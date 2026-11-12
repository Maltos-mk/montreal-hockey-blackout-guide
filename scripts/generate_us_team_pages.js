const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_PATH = path.join(__dirname, '../data/us_teams.json');
const US_DATA_DIR = path.join(__dirname, '../data/us');
const TEMPLATES_DIR = path.join(__dirname, '../templates');
// The US site (hockeyblackouts.com) is built into its own folder and served from the domain root.
// It is deployed to Cloudflare Pages; the Canadian site in build/ is deployed to GitHub Pages.
const BUILD_COM_DIR = path.join(__dirname, '../build_com');
const SITE_ORIGIN = 'https://hockeyblackouts.com';
const CA_ORIGIN = 'https://hockeyblackouts.ca';

// Umami: the .com site has its own Umami website (separate from the .ca one), hardcoded on purpose.
const UMAMI_SNIPPET = '<script defer src="https://cloud.umami.is/script.js" data-website-id="de005e6e-2c1b-4ecb-8158-7ec341b15192" data-domains="hockeyblackouts.com" data-exclude-hash="true"></script>';

if (!fs.existsSync(DATA_PATH)) {
  console.error(`Missing US teams data file at: ${DATA_PATH}`);
  process.exit(1);
}

const usTeams = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const headerTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'us_header.html'), 'utf-8');
const footerTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'us_footer.html'), 'utf-8');
const teamTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'us_team.html'), 'utf-8');
const splashTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'us_splash.html'), 'utf-8');
const notFoundTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'us_404.html'), 'utf-8');

const US_TERRITORIES_MAP = {};
usTeams.forEach(t => {
  US_TERRITORIES_MAP[t.abbreviation] = {
    name: t.name,
    nickname: t.nickname,
    slug: t.slug,
    rsn: t.rsn,
    territoryDescription: t.territoryDescription || `${t.city} Metro & Regional Market`,
    zipRanges: t.zipRanges || []
  };
});
const US_TERRITORIES_JSON = JSON.stringify(US_TERRITORIES_MAP);

const NHL_TEAMS = {
  ANA: 'Anaheim Ducks',
  BOS: 'Boston Bruins',
  BUF: 'Buffalo Sabres',
  CAR: 'Carolina Hurricanes',
  CBJ: 'Columbus Blue Jackets',
  CGY: 'Calgary Flames',
  CHI: 'Chicago Blackhawks',
  COL: 'Colorado Avalanche',
  DAL: 'Dallas Stars',
  DET: 'Detroit Red Wings',
  EDM: 'Edmonton Oilers',
  FLA: 'Florida Panthers',
  LAK: 'Los Angeles Kings',
  MIN: 'Minnesota Wild',
  MTL: 'Montreal Canadiens',
  NJD: 'New Jersey Devils',
  NSH: 'Nashville Predators',
  NYI: 'New York Islanders',
  NYR: 'New York Rangers',
  OTT: 'Ottawa Senators',
  PHI: 'Philadelphia Flyers',
  PIT: 'Pittsburgh Penguins',
  SJS: 'San Jose Sharks',
  SEA: 'Seattle Kraken',
  STL: 'St. Louis Blues',
  TBL: 'Tampa Bay Lightning',
  TOR: 'Toronto Maple Leafs',
  UTA: 'Utah Mammoth',
  VAN: 'Vancouver Canucks',
  VGK: 'Vegas Golden Knights',
  WSH: 'Washington Capitals',
  WPG: 'Winnipeg Jets'
};

const US_NATIONAL_NETWORKS = new Set([
  'ESPN',
  'ABC',
  'TNT',
  'truTV',
  'HBO MAX',
  'MAX',
  'NHLN',
  'ESPN+',
  'HULU'
]);

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
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

function convertDate(dt) {
  return dt
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York'
    })
    .replace(/,/g, '');
}

function getFullMatchup(teamName, vsStr, oppCode) {
  const oppName = NHL_TEAMS[oppCode] || oppCode;
  const isAway = vsStr.startsWith('@');
  return isAway ? `${teamName} at ${oppName}` : `${teamName} vs ${oppName}`;
}

function classifyUsBroadcast(rawGame, team) {
  const isHome = rawGame.homeTeam.abbrev === team.abbreviation;
  const usBroadcasts = (rawGame.tvBroadcasts || [])
    .filter(b => b.countryCode === 'US')
    .map(b => ({ ...b, network: String(b.network || '').trim() }))
    .filter(b => b.network);
  const targetMarket = isHome ? 'H' : 'A';

  const nationalNets = usBroadcasts
    .filter(b => b.market === 'N' || US_NATIONAL_NETWORKS.has(b.network))
    .map(b => b.network);

  const localRsnBroadcasts = usBroadcasts
    .filter(b => b.market === targetMarket && !US_NATIONAL_NETWORKS.has(b.network))
    .map(b => b.network);

  const hasEspnLinear = nationalNets.includes('ESPN');
  const hasAbc = nationalNets.includes('ABC');
  const hasTnt = nationalNets.includes('TNT');
  const hasMax = nationalNets.includes('HBO MAX') || nationalNets.includes('MAX');
  const hasNhln = nationalNets.includes('NHLN');
  const hasExplicitEspnPlus = nationalNets.includes('ESPN+') || nationalNets.includes('HULU');

  const rsnFeed = localRsnBroadcasts.length > 0 ? localRsnBroadcasts[0] : team.rsn;

  // Exclusive US National Game (ESPN, ABC, TNT)
  if ((hasEspnLinear || hasAbc || hasTnt) && localRsnBroadcasts.length === 0) {
    let primaryNet = 'ESPN';
    let secondaryNet = '';
    if (hasAbc) {
      primaryNet = 'ABC';
      secondaryNet = 'ESPN+';
    } else if (hasTnt) {
      primaryNet = 'TNT';
      secondaryNet = hasMax ? 'HBO MAX' : '';
    } else if (hasEspnLinear) {
      primaryNet = 'ESPN';
      secondaryNet = hasExplicitEspnPlus ? 'ESPN+' : '';
    }

    const espnPlusSimulcast = Boolean(hasAbc || hasExplicitEspnPlus);
    return {
      rsn: null,
      netUSNat: primaryNet,
      primaryNet,
      secondaryNet,
      espnPlus: espnPlusSimulcast,
      typeUS: 'national',
      coverageLabel: 'US National Exclusive',
      bannerText: espnPlusSimulcast
        ? `National Broadcast on ${primaryNet} / Simulcast on ESPN+`
        : `National TV Exclusive on ${primaryNet} (Blacked out on ESPN+ & local RSN)`
    };
  }

  // NHL Network Showcase (Local RSN in-market, NHL Network out-of-market, blacked out on ESPN+)
  if (hasNhln) {
    if (team.country === 'CA') {
      const oppAbbrev = isHome ? rawGame.awayTeam.abbrev : rawGame.homeTeam.abbrev;
      const oppInfo = US_TERRITORIES_MAP[oppAbbrev];
      const oppHasUsRsn = oppInfo && Array.isArray(oppInfo.zipRanges) && oppInfo.zipRanges.length > 0;
      const oppRsn = oppHasUsRsn ? oppInfo.rsn : null;
      return {
        rsn: oppRsn || 'NHLN',
        netUSNat: 'NHLN',
        primaryNet: 'NHLN',
        secondaryNet: oppRsn || '',
        espnPlus: false,
        typeUS: 'nhl_network',
        coverageLabel: oppRsn ? 'NHL Network / Opponent RSN' : 'NHL Network Exclusive',
        bannerText: oppRsn
          ? `National on NHL Network / Local ${oppInfo.name} market on ${oppRsn} (Blacked out on ESPN+)`
          : 'National TV Exclusive on NHL Network (Blacked out on ESPN+)'
      };
    }
    return {
      rsn: rsnFeed,
      netUSNat: 'NHLN',
      primaryNet: rsnFeed,
      secondaryNet: 'NHLN',
      espnPlus: false,
      typeUS: 'nhl_network',
      coverageLabel: 'NHL Network / Local RSN',
      bannerText: `In-market on ${rsnFeed} / Out-of-market on NHL Network (Blacked out on ESPN+)`
    };
  }

  // Standard Regional Game (Local RSN in-market, ESPN+ out-of-market)
  if (team.country === 'CA') {
    const oppAbbrev = isHome ? rawGame.awayTeam.abbrev : rawGame.homeTeam.abbrev;
    const oppInfo = US_TERRITORIES_MAP[oppAbbrev];
    const oppHasUsRsn = oppInfo && Array.isArray(oppInfo.zipRanges) && oppInfo.zipRanges.length > 0;
    const oppRsn = oppHasUsRsn ? oppInfo.rsn : null;
    return {
      rsn: oppRsn || 'ESPN+',
      netUSNat: null,
      primaryNet: 'ESPN+',
      secondaryNet: oppRsn || '',
      espnPlus: true,
      typeUS: 'regional',
      coverageLabel: oppRsn ? 'ESPN+ / Opponent RSN' : 'ESPN+ Out-of-Market',
      bannerText: oppRsn
        ? `Available on ESPN+ / Subject to local RSN blackout in ${oppInfo.name} market (${oppRsn})`
        : 'Available nationwide in the US on ESPN+ (No local RSN blackout)'
    };
  }

  return {
    rsn: rsnFeed,
    netUSNat: null,
    primaryNet: rsnFeed,
    secondaryNet: 'ESPN+',
    espnPlus: true,
    typeUS: 'regional',
    coverageLabel: 'Regional RSN / ESPN+',
    bannerText: `Available on ESPN+ / Subject to local RSN blackout (${rsnFeed})`
  };
}

async function ensureUsTeamData(team, forceRefresh) {
  fs.mkdirSync(US_DATA_DIR, { recursive: true });
  const cacheFile = path.join(US_DATA_DIR, `${team.slug}.json`);

  if (!forceRefresh && fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    cached.team = {
      ...cached.team,
      rsn: team.rsn,
      territoryDescription: team.territoryDescription || `${team.city} Metro & Regional Market`,
      zipRanges: team.zipRanges || []
    };
    if (Array.isArray(cached.schedule)) {
      cached.schedule = cached.schedule.map(g => {
        const netUSNat =
          g.netUSNat !== undefined
            ? g.netUSNat
            : g.typeUS === 'national'
            ? g.primaryNet
            : g.typeUS === 'nhl_network'
            ? 'NHLN'
            : null;
        if (team.country === 'CA' && (g.typeUS === 'regional' || g.typeUS === 'nhl_network')) {
          const oppInfo = US_TERRITORIES_MAP[g.opp];
          const oppHasUsRsn = oppInfo && Array.isArray(oppInfo.zipRanges) && oppInfo.zipRanges.length > 0;
          const oppRsn = oppHasUsRsn ? oppInfo.rsn : null;
          if (g.typeUS === 'nhl_network') {
            return {
              ...g,
              rsn: oppRsn || 'NHLN',
              netUSNat: 'NHLN',
              primaryNet: 'NHLN',
              secondaryNet: oppRsn || '',
              coverageLabel: oppRsn ? 'NHL Network / Opponent RSN' : 'NHL Network Exclusive',
              bannerText: oppRsn
                ? `National on NHL Network / Local ${oppInfo.name} market on ${oppRsn} (Blacked out on ESPN+)`
                : 'National TV Exclusive on NHL Network (Blacked out on ESPN+)'
            };
          }
          return {
            ...g,
            rsn: oppRsn || 'ESPN+',
            netUSNat,
            primaryNet: 'ESPN+',
            secondaryNet: oppRsn || '',
            coverageLabel: oppRsn ? 'ESPN+ / Opponent RSN' : 'ESPN+ Out-of-Market',
            bannerText: oppRsn
              ? `Available on ESPN+ / Subject to local RSN blackout in ${oppInfo.name} market (${oppRsn})`
              : 'Available nationwide in the US on ESPN+ (No local RSN blackout)'
          };
        }
        const legacyFallbackRe = /^(?:FanDuel Sports .*|Victory\+.*)$/i;
        const rawRsn = typeof g.rsn === 'string' ? g.rsn.trim() : g.rsn;
        const rawPrimary = typeof g.primaryNet === 'string' ? g.primaryNet.trim() : g.primaryNet;
        const normalizedRsn = legacyFallbackRe.test(rawRsn || '') ? team.rsn : rawRsn;
        const normalizedPrimary = legacyFallbackRe.test(rawPrimary || '') ? team.rsn : rawPrimary;
        const normalizedBanner =
          typeof g.bannerText === 'string'
            ? g.bannerText.replace(/(?:FanDuel Sports [^)]+|Victory\+[^)]*)/gi, team.rsn).trim()
            : g.bannerText;
        return {
          ...g,
          rsn: normalizedRsn,
          primaryNet: normalizedPrimary,
          bannerText: normalizedBanner,
          netUSNat
        };
      });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2), 'utf-8');
    return cached;
  }

  console.log(`Fetching NHL schedule for ${team.abbreviation} (${team.name})...`);
  const live = await fetchJSON(
    `https://api-web.nhle.com/v1/club-schedule-season/${team.abbreviation}/20262027`
  );

  const schedule = [];
  for (const g of live.games || []) {
    if (g.gameType !== 2) continue;

    const dt = new Date(g.startTimeUTC);
    const isHome = g.homeTeam.abbrev === team.abbreviation;
    const opp = isHome ? g.awayTeam.abbrev : g.homeTeam.abbrev;
    const oppCommon = isHome
      ? g.awayTeam.commonName.default
      : g.homeTeam.commonName.default;
    const vs = isHome ? `vs ${oppCommon}` : `@ ${oppCommon}`;
    const fullMatchup = getFullMatchup(team.name, vs, opp);

    const bcast = classifyUsBroadcast(g, team);

    schedule.push({
      id: g.id,
      date: convertDate(dt),
      iso: g.startTimeUTC,
      time: dt.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York'
      }),
      vs,
      opp,
      fullMatchup,
      venue: g.venue && g.venue.default ? g.venue.default : '',
      rsn: bcast.rsn,
      netUSNat: bcast.netUSNat,
      primaryNet: bcast.primaryNet,
      secondaryNet: bcast.secondaryNet,
      espnPlus: bcast.espnPlus,
      typeUS: bcast.typeUS,
      coverageLabel: bcast.coverageLabel,
      bannerText: bcast.bannerText
    });
  }

  const payload = {
    team: {
      id: team.abbreviation,
      name: team.name,
      nickname: team.nickname || team.name.split(' ').slice(-1)[0],
      city: team.city || team.name.split(' ')[0],
      slug: team.slug,
      rsn: team.rsn,
      territoryDescription: team.territoryDescription || `${team.city} Metro & Regional Market`,
      zipRanges: team.zipRanges || [],
      colors: team.colors || {
        primary: '#AF1E2D',
        secondary: '#0F172A',
        dark: '#020617'
      }
    },
    schedule
  };

  fs.writeFileSync(cacheFile, JSON.stringify(payload, null, 2), 'utf-8');
  return payload;
}

const now = new Date();
const buildDateIso = now.toISOString().split('T')[0];
const buildDateDisplay = now.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/New_York'
});

function buildPageTitle(team) {
  if (team.country === 'CA') {
    const caCandidate = `How to Watch ${team.name} in the US (ESPN+ & National TV)`;
    if (caCandidate.length <= 70) return caCandidate;
    return `Watch ${team.name} in the US: ESPN+ & National TV`;
  }
  const fullCandidate = `How to Watch ${team.name} Without Blackouts (${team.rsn} & ESPN+)`;
  if (fullCandidate.length <= 70) return fullCandidate;

  const mediumCandidate = `Watch ${team.name} Without Blackouts: ${team.rsn} & ESPN+`;
  if (mediumCandidate.length <= 70) return mediumCandidate;

  const compactCandidate = `${team.name} Blackouts: Watch on ${team.rsn} & ESPN+`;
  if (compactCandidate.length <= 70) return compactCandidate;

  return `How to Watch ${team.name} Without Blackouts (RSN & ESPN+)`;
}

function buildMetaDescription(team) {
  if (team.country === 'CA') {
    const caBase = `How to watch ${team.name} games in the US on ESPN+, ESPN, ABC, TNT, and NHL Network. Check US ZIP code RSN blackouts and national TV exclusives.`;
    if (caBase.length <= 160) return caBase;
    return `How to watch ${team.name} games in the US on ESPN+ and national TV. Check US ZIP code RSN blackouts and national exclusives.`;
  }
  const base = `How to watch ${team.name} games without blackouts on ${team.rsn} and ESPN+. Check local RSN territory rules, national TV exclusives, and US ZIP code blackouts.`;
  if (base.length <= 160) return base;
  const medium = `How to watch ${team.name} games without blackouts on ${team.rsn} and ESPN+. Check local RSN coverage and US ZIP code blackout rules.`;
  if (medium.length <= 160) return medium;
  return `Watch ${team.name} games on ${team.rsn} and ESPN+. Check US ZIP code blackouts and national TV schedules.`;
}

function buildOgTitle(team) {
  if (team.country === 'CA') {
    return `${team.name} US TV & ESPN+ Blackout Guide`.slice(0, 60);
  }
  const candidate = `${team.name} Blackout Guide (${team.rsn} & ESPN+)`;
  if (candidate.length <= 60) return candidate;
  return `${team.name} TV & ESPN+ Blackout Guide`;
}

function buildOgDescription(team) {
  if (team.country === 'CA') {
    return `How to watch ${team.name} games in the US on ESPN+, ESPN, ABC, TNT, and NHL Network without blackouts.`.slice(0, 125);
  }
  const candidate = `How to watch ${team.name} games without blackouts on ${team.rsn} and ESPN+.`;
  if (candidate.length <= 125) return candidate;
  return `How to watch ${team.name} games without blackouts on RSN and ESPN+.`;
}

function buildTopNavLinks(activeSlug, teams) {
  return teams
    .map(t => {
      if (t.slug === activeSlug) {
        return `<span class="px-2.5 py-1 rounded-md text-white font-bold bg-white/20 shadow-sm border border-white/10">${t.abbreviation}</span>`;
      }
      return `<a href="/${t.slug}/" class="px-2.5 py-1 rounded-md hover:text-white hover:bg-white/10 transition border border-transparent">${t.abbreviation}</a>`;
    })
    .join('\n        ');
}

function buildFooterLinks(activeSlug, teams) {
  return teams
    .filter(t => t.slug !== activeSlug)
    .map(
      t =>
        `<a href="/${t.slug}/" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition font-bold">${t.name}</a>`
    )
    .join('\n        ');
}

function buildSchema(team, pageTitle, metaDescription, canonicalUrl) {
  const faqs =
    team.country === 'CA'
      ? [
          {
            q: `Why are ${team.name} games blacked out on ESPN+ in some US ZIP codes?`,
            a: `Because the ${team.name} are based in Canada, they do not have a local US Regional Sports Network (RSN) territory. Most ${team.name} games stream out-of-market across the US on ESPN+. However, if the ${team.name} play a US opponent whose local RSN territory includes your ZIP code, the game is blacked out on ESPN+ in that market and airs on the opponent's local RSN. Games selected as US National Exclusives on ESPN, TNT, or NHL Network are also blacked out on ESPN+ nationwide unless simulcast on ABC/ESPN+.`
          },
          {
            q: `What channel broadcasts ${team.name} games in the United States?`,
            a: `In the United States, out-of-market ${team.name} games stream live on ESPN+. Matchups selected for US national television air on ESPN, ABC, TNT, Max, or NHL Network.`
          },
          {
            q: `How do I watch ${team.name} games when they play my local US NHL team?`,
            a: `When the ${team.name} play a US NHL team whose local broadcast territory covers your 5-digit ZIP code, ESPN+ blacks out the stream to protect local RSN exclusivity. You must watch that matchup on your local US team's Regional Sports Network (RSN).`
          }
        ]
      : [
          {
            q: `Why are ${team.name} games blacked out on ESPN+?`,
            a: `ESPN+ only carries out-of-market NHL games. If you live inside the ${team.name} local broadcast territory, regional games are blacked out on ESPN+ and must be watched on ${team.rsn}. Additionally, any game airing nationally on ESPN, ABC, TNT, or NHL Network is blacked out on ESPN+ nationwide unless explicitly simulcast.`
          },
          {
            q: `What channel broadcasts regional ${team.name} games in-market?`,
            a: `In-market regional ${team.name} games are carried by ${team.rsn}. Viewers inside the designated local broadcast territory need cable, satellite, a live TV streamer, or a direct-to-consumer RSN subscription that includes ${team.rsn}.`
          },
          {
            q: `How do I watch ${team.name} games if I live out of market in the US?`,
            a: `Out-of-market fans in the United States can stream regional ${team.name} games live on ESPN+ (carrying both the ${team.rsn} feed and the opponent feed), except when the ${team.name} play a team whose local broadcast territory includes your ZIP code or when the game airs exclusively on a national network.`
          }
        ];

  const schemaObj = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${team.name} Hockey Broadcast & Blackout Guide`,
        headline: pageTitle,
        description: metaDescription,
        url: canonicalUrl,
        datePublished: '2026-10-01',
        dateModified: buildDateIso,
        publisher: {
          '@type': 'Organization',
          name: 'HockeyBlackouts.com',
          url: `${SITE_ORIGIN}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_ORIGIN}/shared/favicon-192x192.png`
          }
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a
          }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'US Home',
            item: `${SITE_ORIGIN}/`
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${team.name} Blackout Guide`,
            item: canonicalUrl
          }
        ]
      }
    ]
  };

  return { schemaJson: JSON.stringify(schemaObj, null, 2), faqs };
}

/**
 * Build static HTML copy tailored for Canadian franchises (no local US RSN territory)
 * versus US franchises (local RSN in-market + ESPN+ out-of-market).
 */
function buildUsTeamCopy(
  team,
  { nickname, city, territoryDescription, regionalCount, espnPlusCount, nationalCount }
) {
  const isCa = team.country === 'CA';

  const nationalCardHtml = `
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">National ${nickname} Games (ESPN, ABC, TNT &amp; NHL Network)</h3>
          <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-300">
            When the ${team.name} are selected for an exclusive national US broadcast on <strong>ESPN, TNT, or NHL Network</strong> (${nationalCount} games), the broadcast is blacked out on ESPN+ nationwide unless simulcast on ABC/ESPN+.
          </p>
          <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-300 mt-2">
            Viewers across all US ZIP codes need access to the designated national television channel or streaming tier (such as Max for TNT simulcasts) to watch these national exclusives.
          </p>
        </div>`;

  const nationalFaqRow = `
            <tr>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2 font-semibold">US National Exclusive</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">ESPN / ABC / TNT / NHL Network</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">Requires National Channel (Unless ABC/ESPN+ Simulcast)</td>
            </tr>`;

  if (isCa) {
    return {
      ogImageAlt: `${team.name} US Broadcast & Blackout Guide (ESPN+ and National TV)`,
      headerNetworksLabel: 'ESPN+ &amp; US National TV',
      footerNetworkSummary: 'ESPN+, ESPN, ABC, TNT, NHL Network',
      nextGameAvailableLabel: 'Available on ESPN+ (Out-of-Market)',
      metaKeywords: `${team.name} game tonight, ${nickname} blackout rules, ${team.name} US broadcast schedule, watch ${nickname} on ESPN+, ${team.name} US TV channel, ${city} hockey live stream`,
      defaultZipStatusHtml: `📍 <strong>Out-of-Market Across the US:</strong> As a Canadian NHL franchise, the ${team.name} have no local US RSN blackout territory. Regional games stream live on <strong>ESPN+</strong> nationwide (enter your 5-digit US ZIP code above to check for local US opponent RSN blackouts).`,
      usRsnCheckboxTitle: 'My Local US Opponent RSN',
      usRsnCheckboxDesc: 'Unlocks matchups blacked out on ESPN+ against your local US team',
      defaultAdviceHtml: `<div>
              <h3 class="font-bold text-slate-900 dark:text-white">Out-of-Market US Setup</h3>
              <p class="text-slate-600 dark:text-slate-300 mt-1">
                Because the ${team.name} are based in Canada, regional games stream across the US on <strong>ESPN+</strong> (${espnPlusCount} out-of-market &amp; simulcast games). Add ESPN, TNT, and NHL Network for US national broadcasts, or enter your ZIP code above if they play your local US team.
              </p>
            </div>`,
      channelFilterRsnOption: '',
      seoArticleHtml: `
      <h2 class="text-base font-bold text-slate-900 dark:text-white uppercase font-teko text-2xl tracking-wider text-teamPrimary">
        ${team.name} US Broadcast Rights &amp; ESPN+ Blackout Guide (2026–27 ${nickname} Season)
      </h2>
      <p class="leading-relaxed">
        Following the <strong>${team.name}</strong> regular season across the United States depends on whether a matchup airs as an out-of-market regional feed or a US national TV broadcast. For ${team.name} fans in the US, games are divided across <strong>ESPN+, ESPN/ABC, TNT, NHL Network, and local US opponent RSNs</strong>.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Out-of-Market ${team.name} Games (ESPN+)</h3>
          <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-300">
            Because the ${team.name} are a Canadian franchise, they do not hold a designated US Regional Sports Network territory. Nearly all non-national ${team.name} games stream live across the US on <strong>ESPN+</strong> (${espnPlusCount} games including simulcasts).
          </p>
          <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-300 mt-2">
            The only regional exception occurs when the ${team.name} play a US NHL team whose local broadcast territory covers your 5-digit ZIP code—those matchups are blacked out on ESPN+ in that market and air on your opponent's local RSN.
          </p>
        </div>
        ${nationalCardHtml}
      </div>

      <div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <strong>Quick Summary for ${nickname} Fans in the US:</strong> Regional ${team.name} games stream nationwide on <strong>ESPN+</strong> unless they visit a US opponent whose local RSN territory includes your ZIP code. Enter your ZIP code above to flag any local opponent blackouts.
      </div>`,
      faqTableRowsHtml: `
            <tr>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2 font-semibold">Regional (Most US ZIPs)</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">ESPN+</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">Stream Live Out-of-Market on ESPN+</td>
            </tr>
            <tr>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2 font-semibold">Regional (Local US Opponent ZIP)</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">Opponent Local RSN</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">Blacked Out on ESPN+ (Watch on Opponent RSN)</td>
            </tr>
            ${nationalFaqRow}`
    };
  }

  return {
    ogImageAlt: `${team.name} Broadcast & Blackout Guide (${team.rsn} and ESPN+)`,
    headerNetworksLabel: `${team.rsn} &amp; ESPN+`,
    footerNetworkSummary: `${team.rsn}, ESPN+, ESPN, ABC, TNT, NHL Network`,
    nextGameAvailableLabel: 'Available on ESPN+ (OOM) / Local RSN',
    metaKeywords: `${team.name} game tonight, ${nickname} blackout rules, ${team.name} broadcast schedule, ${team.rsn} blackout, watch ${nickname} on ESPN+, ${city} hockey live stream`,
    defaultZipStatusHtml: `📍 <strong>Default View: In-Market (${territoryDescription})</strong>. Enter any 5-digit US ZIP code above to switch between in-market RSN (<strong>${team.rsn}</strong>) and out-of-market (<strong>ESPN+</strong>) blackout rules.`,
    usRsnCheckboxTitle: `My Local RSN (${team.rsn})`,
    usRsnCheckboxDesc: `${regionalCount} Regional ${nickname} games (in-market)`,
    defaultAdviceHtml: `<div>
              <h3 class="font-bold text-slate-900 dark:text-white">In-Market Full Season Setup</h3>
              <p class="text-slate-600 dark:text-slate-300 mt-1">
                In-market fans in <strong>${territoryDescription}</strong> need <strong>${team.rsn}</strong> (${regionalCount} regional games) plus ESPN/TNT for national exclusives. Out-of-market US fans can stream ${espnPlusCount} ${team.name} games on <strong>ESPN+</strong>.
              </p>
            </div>`,
    channelFilterRsnOption: `<option value="LOCAL_RSN">${team.rsn}</option>`,
    seoArticleHtml: `
      <h2 class="text-base font-bold text-slate-900 dark:text-white uppercase font-teko text-2xl tracking-wider text-teamPrimary">
        ${team.name} Hockey Broadcast Rights &amp; Regional Blackout Guide (2026–27 ${nickname} Season)
      </h2>
      <p class="leading-relaxed">
        Following the <strong>${team.name}</strong> regular season across the United States requires understanding how NHL broadcast territory rights are split between regional sports networks and national streaming partners. For ${team.name} fans, games are divided across <strong>${team.rsn}, ESPN+, ESPN/ABC, TNT, and NHL Network</strong>.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Regional ${team.name} Games (${team.rsn})</h3>
          <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-300">
            <strong>${team.rsn}</strong> holds the official in-market regional broadcast rights for the ${team.name} (${regionalCount} regular-season games) across <strong>${territoryDescription}</strong>. If your US ZIP code falls inside the ${team.name} local broadcast territory, regional games are <strong>blacked out on ESPN+</strong> and must be watched via ${team.rsn}.
          </p>
          <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-300 mt-2">
            If you live outside the ${team.name} local broadcast territory in the US, regional ${nickname} games stream live on <strong>ESPN+</strong> (unless the ${team.name} are playing an opponent whose local broadcast territory includes your ZIP code).
          </p>
        </div>
        ${nationalCardHtml}
      </div>

      <div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <strong>Quick Summary for ${nickname} Fans:</strong> Use the US ZIP Code Lookup above to check your local market status. In-market ZIP codes (${territoryDescription}) watch regional games on <strong>${team.rsn}</strong>; out-of-market US ZIP codes stream regional games on <strong>ESPN+</strong>.
      </div>`,
    faqTableRowsHtml: `
            <tr>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2 font-semibold">Regional (In-Market ZIP)</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">${team.rsn}</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">Blacked Out on ESPN+ (Watch on ${team.rsn})</td>
            </tr>
            <tr>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2 font-semibold">Regional (Out-of-Market ZIP)</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">ESPN+</td>
              <td class="border border-slate-200 dark:border-slate-700 px-4 py-2">Stream on ESPN+ (Unless Opponent Is Local to Your ZIP)</td>
            </tr>
            ${nationalFaqRow}`
  };
}

function renderTeamPage(team, teamData, allTeams) {
  const canonicalUrl = `${SITE_ORIGIN}/${team.slug}/`;
  const pageTitle = buildPageTitle(team);
  const metaDescription = buildMetaDescription(team);
  const ogTitle = buildOgTitle(team);
  const ogDescription = buildOgDescription(team);
  const ogImageUrl = `${SITE_ORIGIN}/og/teams/${team.slug}.png`;
  const { schemaJson, faqs } = buildSchema(team, pageTitle, metaDescription, canonicalUrl);

  const colors = team.colors || {
    primary: '#AF1E2D',
    secondary: '#0F172A',
    dark: '#020617'
  };
  const nickname = team.nickname || team.name.split(' ').slice(-1)[0];
  const city = team.city || team.name.split(' ')[0];

  const schedule = teamData.schedule || [];
  const totalGames = schedule.length || 84;
  const espnPlusCount = schedule.filter(g => g.espnPlus).length;
  const regionalCount = schedule.filter(g => g.typeUS === 'regional' || g.typeUS === 'nhl_network').length;
  const nationalCount = schedule.filter(g => g.typeUS === 'national' || g.typeUS === 'nhl_network').length;

  const espnPlusPct = Math.round((espnPlusCount / totalGames) * 100) || 0;
  const regionalPct = Math.round((regionalCount / totalGames) * 100) || 0;
  const nationalPct = Math.round((nationalCount / totalGames) * 100) || 0;

  const threeHoursThirtyMs = 3.5 * 60 * 60 * 1000;
  const upcomingGames = schedule.filter(g => {
    const gDate = new Date(g.iso);
    return now.getTime() - gDate.getTime() < threeHoursThirtyMs;
  });

  // Prerender next 10 upcoming games in static HTML (identical to scripts/build.js pattern to stay <120KB)
  // Client script in us_team.html hydrates all upcoming / 84 games from data.json immediately.
  let desktopRows = '';
  let mobileCards = '';

  upcomingGames.slice(0, 10).forEach(g => {
    const origIdx = schedule.findIndex(orig => orig.id === g.id);
    const gameNum = origIdx + 1;
    const statusBadge = g.espnPlus
      ? '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap"><i class="fa-solid fa-tv mr-1 text-[10px]"></i>ESPN+ / RSN</span>'
      : '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 whitespace-nowrap"><i class="fa-solid fa-satellite-dish mr-1 text-[10px]"></i>National TV</span>';

    desktopRows += `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800/60">
        <td class="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 font-teko text-base text-center">${gameNum}</td>
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="font-semibold text-slate-800 dark:text-slate-200">${g.date}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-300">${g.time} ET</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>${g.vs}</span>
          </div>
          <div class="text-[11px] text-slate-600 dark:text-slate-300">${g.venue}</div>
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center flex-wrap gap-1.5">
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${g.primaryNet}</span>
            ${g.secondaryNet ? `<span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${g.secondaryNet}</span>` : ''}
          </div>
        </td>
        <td class="py-3 px-4">
          <span class="text-[11px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">${g.coverageLabel}</span>
        </td>
        <td class="py-3 px-4 text-right">
          <div>${statusBadge}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">${g.bannerText}</div>
        </td>
      </tr>`;

    mobileCards += `
      <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-teko text-base font-bold text-slate-600 dark:text-slate-300">#${gameNum}</span>
              <span class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                <span>${g.vs}</span>
              </span>
            </div>
            <div class="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-tight mt-0.5 truncate">${g.fullMatchup} • ${g.venue}</div>
            <div class="text-[11px] text-slate-600 dark:text-slate-300">${g.date} • ${g.time} ET</div>
          </div>
          ${statusBadge}
        </div>
        <div class="flex items-center justify-between text-xs pt-1 mt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <div class="flex items-center gap-1 flex-wrap">
            <span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${g.primaryNet}</span>
            ${g.secondaryNet ? `<span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${g.secondaryNet}</span>` : ''}
          </div>
          <span class="text-[11px] font-semibold text-[#AF1E2D] dark:text-rose-400">${g.coverageLabel}</span>
        </div>
        <div class="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mt-1">
          ${g.bannerText}
        </div>
      </div>`;
  });

  const territoryDescription = team.territoryDescription || `${city} Metro & Regional Market`;
  const copy = buildUsTeamCopy(team, {
    nickname,
    city,
    territoryDescription,
    regionalCount,
    espnPlusCount,
    nationalCount
  });

  // Next Game Spotlight Hero (Identical to scripts/build.js)
  const nextGame = upcomingGames[0] || schedule[schedule.length - 1];
  const nextGameIdx = schedule.findIndex(orig => orig.id === nextGame.id) + 1;
  const nextGameBadge = nextGame.espnPlus
    ? `<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-tv"></i> ${copy.nextGameAvailableLabel}</span>`
    : '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-satellite-dish"></i> US National Exclusive</span>';

  const upcoming3 = upcomingGames.slice(0, 3);
  const upcomingStripHtml = upcoming3
    .map(ug => {
      const ugIdx = schedule.findIndex(s => s.id === ug.id) + 1;
      return `
      <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
        <div>
          <div class="font-bold text-white text-sm flex items-center gap-1.5">
            <span class="text-rose-400 font-teko text-base">#${ugIdx}</span>
            <span>${ug.vs}</span>
          </div>
          <div class="text-[11px] text-slate-300 mt-0.5">${ug.date} • ${ug.time} ET</div>
        </div>
        <div class="text-right shrink-0">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 text-white border border-white/10">${ug.primaryNet}</span>
          ${ug.secondaryNet ? `<span class="block text-[10px] text-emerald-300 font-semibold mt-1">${ug.secondaryNet}</span>` : ''}
        </div>
      </div>`;
    })
    .join('');

  const spotlightHeroHtml = `
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teamSecondary via-slate-900 to-teamDark p-5 sm:p-6 text-white shadow-md border border-slate-700/50" data-spotlight="prerendered">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white">
              Next ${nickname} Game
            </span>
            <span class="text-xs text-slate-300 font-medium">${nextGame.date} • ${nextGame.time} ET</span>
            <span class="text-xs text-slate-400 font-teko text-sm tracking-wide">Game ${nextGameIdx} of ${totalGames}</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-black font-teko uppercase tracking-wide flex items-center gap-2">
            <span>${nextGame.vs}</span>
          </h3>
          <p class="text-xs text-slate-300 flex items-center gap-2">
            <i class="fa-solid fa-location-dot text-slate-400"></i> ${nextGame.venue}
          </p>
        </div>
        <div class="flex flex-col md:items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-300 font-medium">Broadcast:</span>
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-white text-teamSecondary shadow-sm">${nextGame.primaryNet}</span>
            ${nextGame.secondaryNet ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white">${nextGame.secondaryNet}</span>` : ''}
          </div>
          <div>${nextGameBadge}</div>
          <div class="text-[11px] text-slate-300 md:text-right max-w-sm">
            ${nextGame.bannerText}
          </div>
        </div>
      </div>
      ${
        upcoming3.length > 1
          ? `
      <div class="mt-4 pt-4 border-t border-white/10">
        <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <i class="fa-solid fa-calendar-days text-rose-400"></i>
          <span>Upcoming Schedule Snapshot:</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          ${upcomingStripHtml}
        </div>
      </div>`
          : ''
      }
    </div>`;

  const renderedHeader = headerTemplate
    .replace(/\{\{CA_SWITCH_PATH\}\}/g, `/${team.slug}/`)
    .replace(/\{\{SWITCH_TEAM_KEY\}\}/g, team.slug)
    .replace(/\{\{US_NETWORK_LINKS\}\}/g, buildTopNavLinks(team.slug, allTeams))
    .replace(/\{\{HEADER_BADGE_TEXT\}\}/g, team.abbreviation)
    .replace(
      /\{\{HEADER_H1\}\}/g,
      `What channel is the ${team.name} game on tonight? (${copy.headerNetworksLabel})`
    )
    .replace(
      /\{\{HEADER_SUBTITLE\}\}/g,
      `US ZIP Code Broadcast & Blackout Calculator to find out exactly how to watch the ${nickname} without blackouts.`
    );

  const renderedFooter = footerTemplate
    .replace(/\{\{FOOTER_TEAM_LABEL\}\}/g, team.name)
    .replace(/\{\{US_FOOTER_LINKS\}\}/g, buildFooterLinks(team.slug, allTeams))
    .replace(
      /\{\{FOOTER_NETWORK_SUMMARY\}\}/g,
      copy.footerNetworkSummary
    );

  const faqItemsHtml = faqs
    .map(
      f => `        <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
          <h3 class="font-bold text-slate-800 dark:text-slate-200 mb-1" itemprop="name">${f.q}</h3>
          <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <p itemprop="text">${f.a}</p>
          </div>
        </div>`
    )
    .join('\n\n');

  const samplePrefix =
    team.zipRanges && team.zipRanges.length > 0 ? String(team.zipRanges[0][0]).padStart(3, '0') : '100';
  const sampleZip = `${samplePrefix}01`;

  return teamTemplate
    .replace(/\{\{US_HEADER\}\}/g, renderedHeader)
    .replace(/\{\{US_FOOTER\}\}/g, renderedFooter)
    .replace(/\{\{PAGE_TITLE\}\}/g, pageTitle)
    .replace(/\{\{META_DESCRIPTION\}\}/g, metaDescription)
    .replace(/\{\{META_KEYWORDS\}\}/g, copy.metaKeywords)
    .replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl)
    .replace(/\{\{UMAMI_SNIPPET\}\}/g, () => UMAMI_SNIPPET)
    .replace(/\{\{OG_TITLE\}\}/g, ogTitle)
    .replace(/\{\{OG_DESCRIPTION\}\}/g, ogDescription)
    .replace(/\{\{OG_IMAGE_URL\}\}/g, ogImageUrl)
    .replace(/\{\{OG_IMAGE_ALT\}\}/g, copy.ogImageAlt)
    .replace(/\{\{SCHEMA_JSON\}\}/g, schemaJson)
    .replace(/\{\{COLOR_PRIMARY\}\}/g, colors.primary)
    .replace(/\{\{COLOR_SECONDARY\}\}/g, colors.secondary)
    .replace(/\{\{COLOR_DARK\}\}/g, colors.dark)
    .replace(/\{\{TEAM_NAME\}\}/g, team.name)
    .replace(/\{\{TEAM_NICKNAME\}\}/g, nickname)
    .replace(/\{\{CITY_NAME\}\}/g, city)
    .replace(/\{\{TEAM_ID\}\}/g, team.abbreviation)
    .replace(/\{\{TEAM_SLUG\}\}/g, team.slug)
    .replace(/\{\{TEAM_RSN\}\}/g, team.rsn)
    .replace(/\{\{SAMPLE_ZIP\}\}/g, sampleZip)
    .replace(/\{\{TERRITORY_DESCRIPTION\}\}/g, territoryDescription)
    .replace(/\{\{DEFAULT_ZIP_STATUS_HTML\}\}/g, copy.defaultZipStatusHtml)
    .replace(/\{\{US_RSN_CHECKBOX_TITLE\}\}/g, copy.usRsnCheckboxTitle)
    .replace(/\{\{US_RSN_CHECKBOX_DESC\}\}/g, copy.usRsnCheckboxDesc)
    .replace(/\{\{DEFAULT_ADVICE_HTML\}\}/g, copy.defaultAdviceHtml)
    .replace(/\{\{CHANNEL_FILTER_RSN_OPTION\}\}/g, copy.channelFilterRsnOption)
    .replace(/\{\{SEO_ARTICLE_HTML\}\}/g, copy.seoArticleHtml)
    .replace(/\{\{FAQ_TABLE_ROWS_HTML\}\}/g, copy.faqTableRowsHtml)
    .replace(/\{\{TOTAL_GAMES\}\}/g, totalGames)
    .replace(/\{\{ESPN_PLUS_COUNT\}\}/g, espnPlusCount)
    .replace(/\{\{ESPN_PLUS_PCT\}\}/g, espnPlusPct)
    .replace(/\{\{REGIONAL_COUNT\}\}/g, regionalCount)
    .replace(/\{\{REGIONAL_PCT\}\}/g, regionalPct)
    .replace(/\{\{NATIONAL_COUNT\}\}/g, nationalCount)
    .replace(/\{\{NATIONAL_PCT\}\}/g, nationalPct)
    .replace(
      /\{\{PRERENDERED_COUNT_LABEL\}\}/g,
      `Showing the ${upcomingGames.length}-game ${team.name} upcoming broadcast schedule`
    )
    .replace(/\{\{PRERENDERED_SPOTLIGHT_HERO\}\}/g, spotlightHeroHtml)
    .replace(/\{\{PRERENDERED_MOBILE_SCHEDULE\}\}/g, mobileCards)
    .replace(/\{\{PRERENDERED_DESKTOP_SCHEDULE\}\}/g, desktopRows)
    .replace(/\{\{BUILD_DATE_DISPLAY\}\}/g, buildDateDisplay)
    .replace(/\{\{FAQ_ITEMS_HTML\}\}/g, faqItemsHtml);
}

const US_NETWORK_SUMMARY =
  'ESPN+, ESPN, ABC, TNT, NHL Network, Prime Video, Scripps Sports, MSG, NESN, Altitude, DSN, Wild+, BN+, ABTV, HHN, CBJHN';

function buildUsDirectoryShell(allTeams, badgeText, h1Text, subtitleText) {
  const renderedHeader = headerTemplate
    .replace(/\{\{CA_SWITCH_PATH\}\}/g, '/')
    .replace(/\{\{SWITCH_TEAM_KEY\}\}/g, 'home')
    .replace(/\{\{US_NETWORK_LINKS\}\}/g, buildTopNavLinks('', allTeams))
    .replace(/\{\{HEADER_BADGE_TEXT\}\}/g, badgeText)
    .replace(/\{\{HEADER_H1\}\}/g, h1Text)
    .replace(/\{\{HEADER_SUBTITLE\}\}/g, subtitleText);

  const renderedFooter = footerTemplate
    .replace(/\{\{FOOTER_TEAM_LABEL\}\}/g, 'US NHL Blackout')
    .replace(/\{\{US_FOOTER_LINKS\}\}/g, buildFooterLinks('', allTeams))
    .replace(/\{\{FOOTER_NETWORK_SUMMARY\}\}/g, US_NETWORK_SUMMARY);

  const teamCardsHtml = allTeams
    .map(t => {
      const borderColor = (t.colors && t.colors.primary) || '#AF1E2D';
      const networkLabel =
        t.country === 'CA' ? 'ESPN+ (Out-of-Market) • US National TV' : `${t.rsn} • ESPN+`;
      return `        <a href="/${t.slug}/" style="border-left: 6px solid ${borderColor};" class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition flex items-center justify-between gap-3 group">
          <div>
            <span class="font-bold text-base sm:text-lg text-slate-900 dark:text-white block">${t.name}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${networkLabel}</span>
          </div>
          <span class="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition font-bold">&rarr;</span>
        </a>`;
    })
    .join('\n');

  return { renderedHeader, renderedFooter, teamCardsHtml };
}

function renderUsSplashPage(allTeams) {
  const { renderedHeader, renderedFooter, teamCardsHtml } = buildUsDirectoryShell(
    allTeams,
    'USA',
    'Where &amp; How to Watch NHL Games in the US (RSN &amp; ESPN+ Blackouts)',
    'Enter your 5-digit US ZIP code or select your team below to check Regional Sports Network (RSN) and ESPN+ blackouts.'
  );

  return splashTemplate
    .replace(/\{\{US_HEADER\}\}/g, renderedHeader)
    .replace(/\{\{US_FOOTER\}\}/g, renderedFooter)
    .replace(/\{\{UMAMI_SNIPPET\}\}/g, () => UMAMI_SNIPPET)
    .replace(/\{\{US_TEAM_CARDS_HTML\}\}/g, teamCardsHtml)
    .replace(/\{\{US_TERRITORIES_JSON\}\}/g, US_TERRITORIES_JSON);
}

function renderUs404Page(allTeams) {
  const { renderedHeader, renderedFooter, teamCardsHtml } = buildUsDirectoryShell(
    allTeams,
    '404',
    'Page Not Found (404)',
    'That NHL blackout guide or schedule URL could not be found on HockeyBlackouts.com.'
  );

  return notFoundTemplate
    .replace(/\{\{US_HEADER\}\}/g, renderedHeader)
    .replace(/\{\{US_FOOTER\}\}/g, renderedFooter)
    .replace(/\{\{UMAMI_SNIPPET\}\}/g, () => UMAMI_SNIPPET)
    .replace(/\{\{US_TEAM_CARDS_HTML\}\}/g, teamCardsHtml);
}

function buildUsManifestJson({ id, name, shortName, description, startUrl, scope, backgroundColor, themeColor }) {
  return JSON.stringify(
    {
      id,
      name,
      short_name: shortName,
      description,
      start_url: startUrl,
      scope,
      display: 'standalone',
      background_color: backgroundColor,
      theme_color: themeColor,
      icons: [
        { src: '/shared/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        { src: '/shared/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/shared/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
      ]
    },
    null,
    2
  ) + '\n';
}

async function main() {
  const forceRefresh = process.argv.includes('--refresh');
  fs.mkdirSync(BUILD_COM_DIR, { recursive: true });

  // Generate US Homepage (build_com/index.html -> hockeyblackouts.com/), root PWA manifest, and static 404.html
  const splashHtml = renderUsSplashPage(usTeams);
  fs.writeFileSync(path.join(BUILD_COM_DIR, 'index.html'), splashHtml, 'utf-8');
  fs.writeFileSync(
    path.join(BUILD_COM_DIR, 'manifest.json'),
    buildUsManifestJson({
      id: '/',
      name: 'HockeyBlackouts.com — US NHL Blackout Guide',
      shortName: 'Hockey US',
      description: 'US NHL blackout tracker, local ZIP code RSN lookup, and ESPN+ schedule guide.',
      startUrl: '/?utm_source=pwa&utm_medium=homescreen',
      scope: '/',
      backgroundColor: '#0f172a',
      themeColor: '#0f172a'
    }),
    'utf-8'
  );
  const notFoundHtml = renderUs404Page(usTeams);
  fs.writeFileSync(path.join(BUILD_COM_DIR, '404.html'), notFoundHtml, 'utf-8');
  // Block search engine indexing of Cloudflare Pages *.pages.dev preview/mirror hosts while keeping hockeyblackouts.com indexable
  const cfHeaders = [
    'https://:project.pages.dev/*',
    '  X-Robots-Tag: noindex, nofollow',
    '',
    'https://:version.:project.pages.dev/*',
    '  X-Robots-Tag: noindex, nofollow',
    '',
    '/*',
    '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
    '  X-Content-Type-Options: nosniff',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(BUILD_COM_DIR, '_headers'), cfHeaders, 'utf-8');

  const comSharedDir = path.join(BUILD_COM_DIR, 'shared');
  fs.mkdirSync(comSharedDir, { recursive: true });
  fs.writeFileSync(
    path.join(comSharedDir, 'us-territories.js'),
    `window.US_TERRITORIES = ${US_TERRITORIES_JSON};\n`,
    'utf-8'
  );
  fs.copyFileSync(
    path.join(__dirname, '../shared/us-pwa.js'),
    path.join(comSharedDir, 'us-pwa.js')
  );
  fs.copyFileSync(
    path.join(__dirname, '../shared/us-app.js'),
    path.join(comSharedDir, 'us-app.js')
  );

  // Ingest schedules and generate 32 US Team Pages (build_com/[slug]/index.html + data.json + manifest.json)
  for (const team of usTeams) {
    const teamData = await ensureUsTeamData(team, forceRefresh);
    const teamDir = path.join(BUILD_COM_DIR, team.slug);
    fs.mkdirSync(teamDir, { recursive: true });

    const colors = team.colors || { secondary: '#0F172A', dark: '#020617' };
    const html = renderTeamPage(team, teamData, usTeams);
    fs.writeFileSync(path.join(teamDir, 'index.html'), html, 'utf-8');
    fs.writeFileSync(
      path.join(teamDir, 'data.json'),
      JSON.stringify(teamData, null, 2),
      'utf-8'
    );
    const manifestDesc =
      team.country === 'CA'
        ? `US TV channels, ZIP lookup, ESPN+, and national TV schedule for ${team.name}.`
        : `US TV channels, local RSN (${team.rsn}), ZIP lookup, and ESPN+ schedule for ${team.name}.`;
    fs.writeFileSync(
      path.join(teamDir, 'manifest.json'),
      buildUsManifestJson({
        id: `/${team.slug}/`,
        name: `${team.name} US Blackout Guide`,
        shortName: team.abbreviation,
        description: manifestDesc,
        startUrl: `/${team.slug}/?utm_source=pwa&utm_medium=homescreen`,
        scope: `/${team.slug}/`,
        backgroundColor: colors.dark || '#020617',
        themeColor: colors.secondary || '#0F172A'
      }),
      'utf-8'
    );
  }

  console.log(
    `Generated US homepage (build_com/index.html) and ${usTeams.length} US team pages with live NHL schedules in build_com/[slug]/index.html`
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
