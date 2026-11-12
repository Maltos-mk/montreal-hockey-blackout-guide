const fs = require('fs');
const path = require('path');
const https = require('https');
const {
  LEGACY_CA_PATHS,
  loadNetworkAliases,
  formatEtDate,
  classifyCaGameBroadcasts
} = require('./lib/data_audit_core');

const ROOT_DIR = path.join(__dirname, '..');

function fetchJSON(url, redirectsLeft = 3) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume();
          const nextUrl = new URL(res.headers.location, url).toString();
          resolve(fetchJSON(nextUrl, redirectsLeft - 1));
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
          return;
        }
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function run() {
  const aliases = loadNetworkAliases(ROOT_DIR);
  const caTeams = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'data/ca_teams.json'), 'utf-8')
  );
  const unknownCodesFound = new Set();

  for (const teamMeta of caTeams) {
    const abbrev = teamMeta.id;
    const caFile = path.join(ROOT_DIR, `data/ca/${teamMeta.slug}.json`);
    console.log(`Fetching CA schedule for ${abbrev} (${teamMeta.name})...`);
    const live = await fetchJSON(
      `https://api-web.nhle.com/v1/club-schedule-season/${abbrev}/20262027`
    );
    const existing = fs.existsSync(caFile)
      ? JSON.parse(fs.readFileSync(caFile, 'utf-8'))
      : { team: teamMeta, schedule: [] };

    const newSchedule = [];
    for (const g of live.games || []) {
      if (g.gameType !== 2) continue;
      const dt = new Date(g.startTimeUTC);
      const isHome = g.homeTeam.abbrev === abbrev;
      const vs = isHome
        ? `vs ${g.awayTeam.commonName.default}`
        : `@ ${g.homeTeam.commonName.default}`;
      const opp = isHome ? g.awayTeam.abbrev : g.homeTeam.abbrev;
      const broadcast = classifyCaGameBroadcasts(g, abbrev, aliases);

      broadcast.unknownCodes.forEach(c => unknownCodesFound.add(`${abbrev}:${c}`));

      newSchedule.push({
        id: g.id,
        date: formatEtDate(dt),
        iso: g.startTimeUTC,
        time: dt.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/New_York'
        }),
        vs,
        opp,
        venue: g.venue.default,
        netEN: broadcast.netEN,
        netFR: broadcast.netFR,
        typeEN: broadcast.typeEN,
        typeFR: broadcast.typeFR
      });
    }

    const updated = { ...existing, schedule: newSchedule };
    const serialized = JSON.stringify(updated, null, 2);
    fs.writeFileSync(caFile, serialized);

    const legacyRel = LEGACY_CA_PATHS[abbrev];
    if (legacyRel) {
      const legacyPath = path.join(ROOT_DIR, legacyRel);
      const legacyExisting = fs.existsSync(legacyPath)
        ? JSON.parse(fs.readFileSync(legacyPath, 'utf-8'))
        : { team: teamMeta, schedule: [] };
      fs.writeFileSync(
        legacyPath,
        JSON.stringify({ ...legacyExisting, schedule: newSchedule }, null, 2)
      );
    }
    console.log(`Saved ${newSchedule.length} games to data/ca/${teamMeta.slug}.json`);
  }

  if (unknownCodesFound.size > 0) {
    console.error('❌ Unmapped CA broadcast codes encountered:', [...unknownCodesFound]);
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
