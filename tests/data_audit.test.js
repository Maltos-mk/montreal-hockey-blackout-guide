const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {
  loadNetworkAliases,
  normalizeNetworkCode,
  classifyCaGameBroadcasts,
  classifyUsBroadcast,
  auditZipRanges,
  auditUsTeamSchedule,
  auditCaTeamSchedule,
  runFullDataAudit
} = require('../scripts/lib/data_audit_core');

const ROOT_DIR = path.join(__dirname, '..');
const FIXTURE_PATH = path.join(__dirname, 'fixtures/raw/nhl_schedule_sample.json');

function makeValidGame(id, opp, overrides = {}) {
  return {
    id,
    date: 'Thu Nov 12 2026',
    iso: '2026-11-12T00:00:00Z',
    time: '7:00 PM',
    vs: `vs ${opp}`,
    opp,
    venue: 'Test Arena',
    typeUS: 'regional',
    rsn: 'NESN',
    ...overrides
  };
}

function make84Schedule(opp = 'MTL', factory = makeValidGame) {
  return Array.from({ length: 84 }, (_, idx) => factory(2026020001 + idx, opp));
}

function run() {
  const aliases = loadNetworkAliases(ROOT_DIR);
  const rawFixtures = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));

  // 1. Raw NHL API fixture validation (no mocks)
  assert.equal(normalizeNetworkCode('ABTV '), 'ABTV', 'Must strip trailing API whitespace');

  const ottGames = rawFixtures.OTT.games;
  const rdsiGame = ottGames.find(g => (g.tvBroadcasts || []).some(b => b.network === 'RDSI'));
  assert.ok(rdsiGame, 'Raw OTT fixture must include an RDSI game');
  const classifiedOtt = classifyCaGameBroadcasts(rdsiGame, 'OTT', aliases);
  assert.equal(classifiedOtt.unknownCodes.length, 0, 'OTT raw broadcasts should all map cleanly');
  assert.ok(classifiedOtt.netFR.includes('RDS Info'), 'RDSI must map to RDS Info');

  const tvasDGame = ottGames.find(g => (g.tvBroadcasts || []).some(b => b.network === 'TVAS-D'));
  assert.ok(tvasDGame, 'Raw OTT fixture must include a TVAS-D game');
  const classifiedTvasD = classifyCaGameBroadcasts(tvasDGame, 'OTT', aliases);
  assert.equal(classifiedTvasD.unknownCodes.length, 0, 'TVAS-D raw broadcast should map cleanly');
  assert.ok(classifiedTvasD.netFR.includes('TVA Sports Direct'), 'TVAS-D must map to TVA Sports Direct');

  // 1b. Raw NHL API US fixture validation across DET, SEA, LAK, PHI
  const phiEspnPlusExcl = rawFixtures.PHI.games.find(g => g.id === 2026020009);
  assert.ok(phiEspnPlusExcl, 'Raw PHI fixture must include ESPN+/Hulu/Disney+ game 2026020009');
  const phiBcast = classifyUsBroadcast(
    phiEspnPlusExcl,
    { abbreviation: 'PHI', rsn: 'NBC Sports Philadelphia', country: 'US' },
    {},
    aliases
  );
  assert.equal(phiBcast.typeUS, 'national', 'ESPN+/Hulu/Disney+ exclusive must classify as national, not regional');
  assert.equal(phiBcast.netUSNat, 'ESPN+');
  assert.equal(phiBcast.rsn, null, 'ESPN+/Hulu exclusive must not leak team.rsn blackout');
  assert.equal(phiBcast.espnPlus, true);

  const lakTrailingSpace = rawFixtures.LAK.games.find(g =>
    (g.tvBroadcasts || []).some(b => b.network === 'ABTV ')
  );
  assert.ok(lakTrailingSpace, 'Raw LAK fixture must include trailing-space ABTV entry');
  const lakBcast = classifyUsBroadcast(
    lakTrailingSpace,
    { abbreviation: 'LAK', rsn: 'ABTV / DAZN', country: 'US' },
    {},
    aliases
  );
  assert.equal(lakBcast.rsn, 'ABTV', 'Must strip trailing whitespace from raw LAK ABTV code');

  const seaPrime = rawFixtures.SEA.games.find(g =>
    (g.tvBroadcasts || []).some(b => b.network === 'Prime Video')
  );
  assert.ok(seaPrime, 'Raw SEA fixture must include Prime Video entry');
  const seaBcast = classifyUsBroadcast(
    seaPrime,
    { abbreviation: 'SEA', rsn: 'Prime Video / Kraken Hockey Network', country: 'US' },
    {},
    aliases
  );
  assert.equal(seaBcast.rsn, 'Prime Video');

  const detDsn = rawFixtures.DET.games.find(g =>
    (g.tvBroadcasts || []).some(b => b.network === 'DSN')
  );
  assert.ok(detDsn, 'Raw DET fixture must include DSN entry');
  const detBcast = classifyUsBroadcast(
    detDsn,
    { abbreviation: 'DET', rsn: 'Detroit SportsNet (DSN)', country: 'US' },
    {},
    aliases
  );
  assert.equal(detBcast.rsn, 'DSN');

  // Case-insensitive DISNEY+ national detection (no fallback to team.rsn)
  const upperDisney = classifyUsBroadcast(
    {
      homeTeam: { abbrev: 'PHI' },
      awayTeam: { abbrev: 'DET' },
      tvBroadcasts: [{ countryCode: 'US', market: 'N', network: 'DISNEY+' }]
    },
    { abbreviation: 'PHI', rsn: 'NBC Sports Philadelphia', country: 'US' },
    {},
    aliases
  );
  assert.equal(upperDisney.typeUS, 'national');
  assert.equal(upperDisney.rsn, null);

  // Unknown raw CA broadcast code surfaces cleanly rather than vanishing silently
  const unknownCaGame = {
    startTimeUTC: '2026-11-12T00:00:00Z',
    tvBroadcasts: [{ countryCode: 'CA', network: 'MYSTERY_CA_NET' }]
  };
  const unknownCaRes = classifyCaGameBroadcasts(unknownCaGame, 'MTL', aliases);
  assert.deepEqual(unknownCaRes.unknownCodes, ['MYSTERY_CA_NET']);

  // 2. Failure detection on US schedules & ZIP matrices
  const validAbbrevs = new Set(['MTL', 'BOS', 'TOR', 'DET', 'NYR', 'PHI']);
  const defunctRes = auditUsTeamSchedule(
    { abbreviation: 'DET', slug: 'detroit-red-wings', rsn: 'FanDuel Sports Detroit', country: 'US' },
    make84Schedule('MTL', (id, opp) => makeValidGame(id, opp, { rsn: 'FanDuel Sports Detroit' })),
    aliases,
    validAbbrevs
  );
  assert.ok(defunctRes.errors.some(e => e.includes('defunct')), 'Must reject defunct FanDuel RSN');

  const displayFallbackRes = auditUsTeamSchedule(
    { abbreviation: 'PHI', slug: 'philadelphia-flyers', rsn: 'NBC Sports Philadelphia', country: 'US' },
    make84Schedule('MTL', (id, opp) => makeValidGame(id, opp, { rsn: 'NBC Sports Philadelphia' })),
    aliases,
    validAbbrevs
  );
  assert.ok(
    displayFallbackRes.errors.some(e => e.includes('unmapped/drifted RSN')),
    'Must reject display-only team.rsn fallback when upstream RSN code is expected'
  );

  const missingRsnRes = auditUsTeamSchedule(
    { abbreviation: 'PHI', slug: 'philadelphia-flyers', rsn: 'NBC Sports Philadelphia', country: 'US' },
    make84Schedule('MTL', (id, opp) => makeValidGame(id, opp, { rsn: null, primaryNet: 'UNAVAILABLE' })),
    aliases,
    validAbbrevs
  );
  assert.ok(
    missingRsnRes.errors.some(e => e.includes('missing/unavailable RSN')),
    'Must fail when US regional game has missing/UNAVAILABLE rsn'
  );

  const wsRes = auditUsTeamSchedule(
    { abbreviation: 'BOS', slug: 'boston-bruins', rsn: 'NESN', country: 'US' },
    make84Schedule('MTL', (id, opp) => makeValidGame(id, opp, { rsn: 'NESN ' })),
    aliases,
    validAbbrevs
  );
  assert.ok(wsRes.errors.some(e => e.includes('whitespace')), 'Must reject trailing whitespace');

  const zipErrs = auditZipRanges([
    { abbreviation: 'BOS', country: 'US', zipRanges: [[63, 10]] },
    { abbreviation: 'MTL', country: 'CA', zipRanges: [[100, 101]] }
  ]);
  assert.equal(zipErrs.errors.length, 2, 'Must catch reversed US zipRange and non-empty CA zipRange');

  // 3. Failure detection on CA raw unmapped tokens & copy mismatch
  const caBad = auditCaTeamSchedule(
    { id: 'OTT', slug: 'ottawa' },
    make84Schedule('MTL', (id, opp) => ({
      id,
      date: 'Thu Nov 12 2026',
      iso: '2026-11-12T00:00:00Z',
      opp,
      netEN: 'TSN5',
      netFR: 'RDSI'
    })),
    aliases,
    validAbbrevs
  );
  assert.ok(caBad.errors.some(e => e.includes('RDSI')), 'Must fail if unmapped raw RDSI remains in CA JSON');

  const caUsNetLeak = auditCaTeamSchedule(
    { id: 'OTT', slug: 'ottawa' },
    make84Schedule('MTL', (id, opp) => ({
      id,
      date: 'Thu Nov 12 2026',
      iso: '2026-11-12T00:00:00Z',
      opp,
      netEN: 'ESPN',
      netFR: 'RDS'
    })),
    aliases,
    validAbbrevs
  );
  assert.ok(caUsNetLeak.errors.some(e => e.includes('ESPN')), 'Must reject US-only ESPN network in CA schedule');

  // 4. Live workspace production data check
  const prodAudit = runFullDataAudit({ rootDir: ROOT_DIR });
  assert.equal(prodAudit.usResults.length, 32, 'Must audit all 32 US site clubs');
  assert.equal(prodAudit.caResults.length, 32, 'Must audit all 32 CA site clubs');
  assert.ok(prodAudit.passed, `Production data audit failed:\n${prodAudit.errors.join('\n')}`);

  console.log('✅ All data audit unit & fixture contract tests passed.');
}

run();
