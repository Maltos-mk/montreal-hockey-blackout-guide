const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../build');
const GAMES_DIR = path.join(BUILD_DIR, 'game');
const TEMPLATE_FILE = path.join(__dirname, '../templates/game.html');

if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR, { recursive: true });
}

const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

const TEAMS_MAP = {
  'MTL': { city: 'Montreal', name: 'Montreal Canadiens', nickname: 'Canadiens', dir: 'montreal', radio: 'TSN 690 / 98.5 FM', radioUrl: 'https://www.iheartradio.ca/tsn/tsn-montreal' },
  'TOR': { city: 'Toronto', name: 'Toronto Maple Leafs', nickname: 'Maple Leafs', dir: 'toronto', radio: 'TSN 1050 / Sportsnet 590', radioUrl: 'https://www.tsn.ca/radio/toronto-1050' },
  'OTT': { city: 'Ottawa', name: 'Ottawa Senators', nickname: 'Senators', dir: 'ottawa', radio: 'TSN 1200 / 94.5 Unique FM', radioUrl: 'https://www.iheartradio.ca/tsn/tsn-1200' },
  'VAN': { city: 'Vancouver', name: 'Vancouver Canucks', nickname: 'Canucks', dir: 'vancouver', radio: 'Sportsnet 650', radioUrl: 'https://www.sportsnet.ca/650/' },
  'CGY': { city: 'Calgary', name: 'Calgary Flames', nickname: 'Flames', dir: 'calgary', radio: 'Sportsnet 960 The Fan', radioUrl: 'https://www.sportsnet.ca/960/' },
  'EDM': { city: 'Edmonton', name: 'Edmonton Oilers', nickname: 'Oilers', dir: 'edmonton', radio: '630 CHED', radioUrl: 'https://globalnews.ca/radio/630ched/' },
  'WPG': { city: 'Winnipeg', name: 'Winnipeg Jets', nickname: 'Jets', dir: 'winnipeg', radio: '680 CJOB', radioUrl: 'https://globalnews.ca/radio/cjob/' },
  'BOS': { city: 'Boston', name: 'Boston Bruins', nickname: 'Bruins' },
  'BUF': { city: 'Buffalo', name: 'Buffalo Sabres', nickname: 'Sabres' },
  'DET': { city: 'Detroit', name: 'Detroit Red Wings', nickname: 'Red Wings' },
  'FLA': { city: 'Florida', name: 'Florida Panthers', nickname: 'Panthers' },
  'TBL': { city: 'Tampa Bay', name: 'Tampa Bay Lightning', nickname: 'Lightning' },
  'CAR': { city: 'Carolina', name: 'Carolina Hurricanes', nickname: 'Hurricanes' },
  'NJD': { city: 'New Jersey', name: 'New Jersey Devils', nickname: 'Devils' },
  'NYI': { city: 'Elmont', name: 'New York Islanders', nickname: 'Islanders' },
  'NYR': { city: 'New York', name: 'New York Rangers', nickname: 'Rangers' },
  'PHI': { city: 'Philadelphia', name: 'Philadelphia Flyers', nickname: 'Flyers' },
  'PIT': { city: 'Pittsburgh', name: 'Pittsburgh Penguins', nickname: 'Penguins' },
  'WSH': { city: 'Washington', name: 'Washington Capitals', nickname: 'Capitals' },
  'CBJ': { city: 'Columbus', name: 'Columbus Blue Jackets', nickname: 'Blue Jackets' },
  'CHI': { city: 'Chicago', name: 'Chicago Blackhawks', nickname: 'Blackhawks' },
  'COL': { city: 'Colorado', name: 'Colorado Avalanche', nickname: 'Avalanche' },
  'DAL': { city: 'Dallas', name: 'Dallas Stars', nickname: 'Stars' },
  'MIN': { city: 'Minnesota', name: 'Minnesota Wild', nickname: 'Wild' },
  'NSH': { city: 'Nashville', name: 'Nashville Predators', nickname: 'Predators' },
  'STL': { city: 'St Louis', name: 'St. Louis Blues', nickname: 'Blues' },
  'UTA': { city: 'Utah', name: 'Utah Mammoth', nickname: 'Mammoth' },
  'ANA': { city: 'Anaheim', name: 'Anaheim Ducks', nickname: 'Ducks' },
  'LAK': { city: 'Los Angeles', name: 'Los Angeles Kings', nickname: 'Kings' },
  'SJS': { city: 'San Jose', name: 'San Jose Sharks', nickname: 'Sharks' },
  'SEA': { city: 'Seattle', name: 'Seattle Kraken', nickname: 'Kraken' },
  'VGK': { city: 'Vegas', name: 'Vegas Golden Knights', nickname: 'Golden Knights' }
};

const REGIONS_CONFIG = [
  { key: 'on_west', name: 'Ontario (West / GTA / Hamilton)', inMarket: ['TOR'] },
  { key: 'on_east_qc_atl', name: 'Eastern Ontario, Quebec & Atlantic', inMarket: ['MTL', 'OTT'] },
  { key: 'on_overlap', name: 'Ontario Overlap (Belleville / Kingston)', inMarket: ['TOR', 'OTT', 'MTL'] },
  { key: 'ab', name: 'Alberta', inMarket: ['CGY', 'EDM'] },
  { key: 'sk', name: 'Saskatchewan, NWT & Nunavut', inMarket: ['CGY', 'EDM', 'WPG'] },
  { key: 'mb', name: 'Manitoba', inMarket: ['WPG'] },
  { key: 'nw_on', name: 'Northwestern Ontario', inMarket: ['TOR', 'WPG'] },
  { key: 'bc', name: 'British Columbia & Yukon', inMarket: ['VAN'] },
  { key: 'us_intl', name: 'USA & International', inMarket: [] }
];

function slugifyCity(cityName) {
  return cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Harvest all unique games across the 7 teams
const uniqueGames = new Map();

['mtl', 'tor', 'ott', 'van', 'cgy', 'edm', 'wpg'].forEach(abbrev => {
  const filePath = path.join(__dirname, `../data/${abbrev}.json`);
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const teamId = data.team.id;

  data.schedule.forEach(g => {
    const isHome = g.vs.startsWith('vs ');
    const homeTeamId = isHome ? teamId : g.opp;
    const awayTeamId = isHome ? g.opp : teamId;
    
    // Key by date and home/away to deduplicate Canadian vs Canadian games
    const datePrefix = g.iso.split('T')[0];
    const matchKey = `${datePrefix}_${homeTeamId}_${awayTeamId}`;

    if (!uniqueGames.has(matchKey)) {
      uniqueGames.set(matchKey, {
        game: g,
        primaryTeamId: teamId,
        homeTeamId,
        awayTeamId,
        datePrefix,
        matchKey
      });
    }
  });
});

console.log(`Building per-game pages for ${uniqueGames.size} unique matchups...`);

const builtGameUrls = [];

uniqueGames.forEach(({ game: g, primaryTeamId, homeTeamId, awayTeamId, datePrefix }) => {
  const homeTeam = TEAMS_MAP[homeTeamId] || { city: homeTeamId, name: homeTeamId, nickname: homeTeamId };
  const awayTeam = TEAMS_MAP[awayTeamId] || { city: awayTeamId, name: awayTeamId, nickname: awayTeamId };
  
  const homeCitySlug = slugifyCity(homeTeam.city);
  const awayCitySlug = slugifyCity(awayTeam.city);
  
  // Canonical slug: [home-city]-vs-[away-city]
  const gameSlug = `${homeCitySlug}-vs-${awayCitySlug}`;
  const canonicalUrl = `https://hockeyblackouts.ca/game/${datePrefix}/${gameSlug}/`;
  
  const gameDirPath = path.join(GAMES_DIR, datePrefix, gameSlug);
  if (!fs.existsSync(gameDirPath)) {
    fs.mkdirSync(gameDirPath, { recursive: true });
  }

  const homeTeamDir = (TEAMS_MAP[homeTeamId] && TEAMS_MAP[homeTeamId].dir) ? TEAMS_MAP[homeTeamId].dir : 'toronto';

  // Decision D2: If game concluded more than 21 days ago, issue permanent 301-equivalent redirect to home team schedule
  const gameDate = new Date(g.iso);
  const now = new Date();
  const daysDiff = (now - gameDate) / (1000 * 60 * 60 * 24);

  if (daysDiff > 21) {
    const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting to ${homeTeam.name} TV Schedule</title>
  <meta http-equiv="refresh" content="0; url=https://hockeyblackouts.ca/${homeTeamDir}/">
  <link rel="canonical" href="https://hockeyblackouts.ca/${homeTeamDir}/">
  <meta name="robots" content="noindex, follow">
</head>
<body class="bg-slate-950 text-white font-sans p-8 text-center">
  <p class="text-slate-400">This game has concluded. Redirecting to <a href="https://hockeyblackouts.ca/${homeTeamDir}/" class="text-rose-400 underline font-bold">${homeTeam.name} TV Schedule</a>...</p>
</body>
</html>`;
    fs.writeFileSync(path.join(gameDirPath, 'index.html'), redirectHtml);
    builtGameUrls.push(canonicalUrl);
    return;
  }

  const isNational = g.typeEN === 'national' || g.typeEN === 'prime_wednesday';
  const isPrime = g.typeEN === 'prime_wednesday' || g.netEN === 'Prime Video';
  
  const pageTitle = `Where to Watch ${awayTeam.city} vs ${homeTeam.city} Tonight: TV & Stream Guide`;
  const metaDescription = `Watch ${awayTeam.city} vs ${homeTeam.city} on ${g.date}. Find live TV channels, streaming options, and blackout rules across Canada.`;
  const ogImageUrl = `https://hockeyblackouts.ca/shared/favicon-192x192.png`;

  // Pre-calculate regional breakdown
  const regionBreakdown = {};
  let matrixRowsHtml = '';

  REGIONS_CONFIG.forEach(reg => {
    const isHomeInMarket = reg.inMarket.includes(homeTeamId);
    const isAwayInMarket = reg.inMarket.includes(awayTeamId);
    const inMarket = isHomeInMarket || isAwayInMarket;

    let headline = '';
    let badgeText = '';
    let badgeClass = '';
    let boxClass = '';
    let explanation = '';
    let icon = '';

    if (reg.key === 'us_intl') {
      headline = 'Stream via ESPN+ or NHL.tv (US & International)';
      badgeText = 'ESPN+ / NHL.tv (No Blackouts)';
      badgeClass = 'bg-slate-700 text-white font-bold px-3 py-1 rounded-full text-xs shadow-sm border border-white/20';
      boxClass = 'bg-slate-800/90 border-white/10 text-slate-200';
      explanation = 'Fans in the United States and abroad can stream through ESPN+ or NHL.tv without Canadian regional blackout restrictions.';
      icon = '<i class="fa-solid fa-globe text-slate-300 text-lg"></i>';
    } else if (isPrime) {
      headline = 'Watch Across Canada on Prime Video';
      badgeText = 'Prime Video (National)';
      badgeClass = 'bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs shadow-sm';
      boxClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      explanation = 'National Prime Monday Night broadcast. Streams anywhere in Canada with an Amazon Prime membership. No regional blackout restrictions.';
      icon = '<i class="fa-solid fa-circle-check text-emerald-400 text-lg"></i>';
    } else if (isNational) {
      headline = `Coast-to-Coast Broadcast on ${g.netEN || 'Sportsnet'}`;
      badgeText = 'National (No Blackouts)';
      badgeClass = 'bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs shadow-sm';
      boxClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      explanation = 'National feed available across all Canadian provinces. Watchable on standard cable or basic Sportsnet+ with zero regional blackouts.';
      icon = '<i class="fa-solid fa-circle-check text-emerald-400 text-lg"></i>';
    } else if (inMarket) {
      headline = `In-Market Regional Broadcast on ${g.netEN}`;
      badgeText = 'In-Market (Regional Feed)';
      badgeClass = 'bg-slate-700 text-white font-bold px-3 py-1 rounded-full text-xs shadow-sm border border-white/20';
      boxClass = 'bg-slate-800/90 border-white/10 text-slate-200';
      explanation = `This location is inside the official broadcast territory. Watch on your regional sports package (${g.netEN}) or standard in-market stream (Sportsnet+ / TSN+). If you only have basic TV without a sports package, this game is not included.`;
      icon = '<i class="fa-solid fa-tv text-slate-300 text-lg"></i>';
    } else {
      headline = `Regional Blackout on ${g.netEN}`;
      badgeText = 'Blacked Out (Out-of-Market)';
      badgeClass = 'bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs shadow-sm';
      boxClass = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      explanation = `This location is outside the regional territory. The broadcast on ${g.netEN} is blacked out on standard cable to protect local broadcast rights. Requires Sportsnet+ Premium or an out-of-market streaming package.`;
      icon = '<i class="fa-solid fa-ban text-amber-400 text-lg"></i>';
    }

    regionBreakdown[reg.key] = {
      name: reg.name,
      headline,
      badgeText,
      badgeClass,
      boxClass,
      explanation,
      icon,
      inMarket,
      isNational,
      isPrime,
      netEN: g.netEN || ''
    };

    let rowBadge = '';
    if (reg.key === 'us_intl') {
      rowBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-700/50 text-slate-200 border border-white/10"><i class="fa-solid fa-globe text-[10px] mr-1"></i>ESPN+ / Intl</span>';
    } else if (isNational || isPrime) {
      rowBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><i class="fa-solid fa-globe text-[10px] mr-1"></i>National</span>';
    } else if (inMarket) {
      rowBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-700/50 text-slate-200 border border-white/10"><i class="fa-solid fa-tv text-[10px] mr-1"></i>In-Market</span>';
    } else {
      rowBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20"><i class="fa-solid fa-ban text-[10px] mr-1"></i>Blacked Out</span>';
    }

    matrixRowsHtml += `
      <tr class="hover:bg-white/5 transition">
        <td class="py-2.5 px-3 font-semibold text-slate-200">${reg.name}</td>
        <td class="py-2.5 px-3 text-slate-300">${g.netEN || 'TBD'}</td>
        <td class="py-2.5 px-3 text-slate-400">${g.netFR || 'None'}</td>
        <td class="py-2.5 px-3 text-right">${rowBadge}</td>
      </tr>`;
  });

  // Default initial region: Ontario West (or home region if known)
  const defaultRegionKey = 'on_west';
  const defaultVerdict = regionBreakdown[defaultRegionKey];

  // Calculate approximate endDate (~2.5 hours after game start)
  const startMs = new Date(g.iso).getTime();
  const endIso = new Date(startMs + 2.5 * 60 * 60 * 1000).toISOString();

  // Schema.org JSON-LD
  const schemaObj = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsEvent",
        "@id": `${canonicalUrl}#event`,
        "name": `${awayTeam.name} at ${homeTeam.name}`,
        "description": metaDescription,
        "image": ogImageUrl,
        "sport": "Ice Hockey",
        "startDate": g.iso,
        "endDate": endIso,
        "eventStatus": "https://schema.org/EventScheduled",
        "location": {
          "@type": "Place",
          "name": g.venue || "NHL Arena",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": homeTeam.city,
            "addressCountry": "CA"
          }
        },
        "competitor": [
          { "@type": "SportsTeam", "name": awayTeam.name },
          { "@type": "SportsTeam", "name": homeTeam.name }
        ],
        "performer": [
          { "@type": "SportsTeam", "name": awayTeam.name },
          { "@type": "SportsTeam", "name": homeTeam.name }
        ],
        "organizer": {
          "@type": "Organization",
          "name": "National Hockey League",
          "url": "https://www.nhl.com"
        },
        "publication": [
          {
            "@type": "BroadcastEvent",
            "isLiveBroadcast": true,
            "videoFormat": "HD",
            "publishedOn": {
              "@type": "BroadcastService",
              "name": g.netEN || "Sportsnet",
              "broadcastDisplayName": g.netEN || "Sportsnet"
            }
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": `What channel is ${awayTeam.city} vs ${homeTeam.city} on tonight in Canada?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": isNational 
                ? `Tonight's game is broadcast nationally across Canada on ${g.netEN || 'Sportsnet'} with no regional blackouts.`
                : `Tonight's game airs regionally on ${g.netEN}. Fans living in the team broadcast territory can watch on local cable or standard streaming. Out-of-market viewers require Sportsnet+ Premium or NHL Centre Ice.`
            }
          },
          {
            "@type": "Question",
            "name": `Is the ${awayTeam.city} vs ${homeTeam.city} game blacked out?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": isNational 
                ? "No. As a national broadcast, regional blackouts do not apply anywhere in Canada."
                : `Yes, for fans outside the home broadcast territory, regional games on ${g.netEN} are subject to regional blackouts unless subscribed to an out-of-market package.`
            }
          }
        ]
      }
    ]
  };

  // Radio station details
  const hostCanadianTeam = TEAMS_MAP[primaryTeamId] || TEAMS_MAP['TOR'];
  const radioStationName = hostCanadianTeam.radio || 'Local Team Radio';
  const radioStreamUrl = hostCanadianTeam.radioUrl || 'https://www.iheartradio.ca/';

  // Streaming action card
  let streamingProviderName = 'Sportsnet+';
  let streamingDescription = 'Official streaming home for regional & national games in Canada.';
  let streamingActionLink = '<a href="https://www.sportsnetplus.ca/" data-umami-event="stream-referral-click" data-umami-event-provider="sportsnet" target="_blank" rel="noopener noreferrer" class="w-fit text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"><span>Visit Sportsnet+</span><i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>';
  
  if (isPrime) {
    streamingProviderName = 'Amazon Prime Video';
    streamingDescription = 'Exclusive national broadcast for Prime Monday Night Hockey.';
    streamingActionLink = '<a href="https://www.amazon.ca/tryprimefree?tag=maltos-20" data-umami-event="amazon-prime-click" target="_blank" rel="sponsored noopener noreferrer" class="w-fit text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"><span>Try Prime 30-Day Free Trial</span><i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>';
  } else if (g.netEN && g.netEN.includes('TSN') && !isNational) {
    streamingProviderName = 'TSN+';
    streamingDescription = 'Official streaming home for regional coverage in this broadcast territory.';
    streamingActionLink = '<a href="https://www.tsn.ca/subscribe" data-umami-event="stream-referral-click" data-umami-event-provider="tsn" target="_blank" rel="noopener noreferrer" class="w-fit text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"><span>Visit TSN+</span><i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>';
  }

  // Preseason badge
  const preseasonBadge = g.phase === 'preseason' 
    ? '<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Preseason</span>' 
    : '';

  // French broadcast badge
  const primaryNetFrBadge = g.netFR && g.netFR !== 'None' 
    ? `<span class="px-2.5 py-1 rounded-md text-xs font-bold bg-white/10 text-white border border-white/10">${g.netFR}</span>` 
    : '';

  // FAQ HTML
  const faqHtml = `
    <div class="border border-white/10 rounded-xl p-4 bg-slate-950/60 space-y-1.5">
      <h3 class="font-bold text-slate-100 text-sm">What channel is the ${awayTeam.city} vs ${homeTeam.city} game on tonight?</h3>
      <p class="text-slate-400">
        ${isNational 
          ? `The game is televised nationally on <strong>${g.netEN || 'Sportsnet'}</strong>${g.netFR ? ` and in French on <strong>${g.netFR}</strong>` : ''}. All Canadian viewers can watch without regional blackouts.`
          : `The game is televised regionally on <strong>${g.netEN}</strong>${g.netFR ? ` and on <strong>${g.netFR}</strong>` : ''}. Regional broadcast boundaries apply outside local market territories.`}
      </p>
    </div>
    <div class="border border-white/10 rounded-xl p-4 bg-slate-950/60 space-y-1.5">
      <h3 class="font-bold text-slate-100 text-sm">How can I stream this game legally in Canada?</h3>
      <p class="text-slate-400">
        ${isPrime 
          ? `Stream legally on the Amazon Prime Video app across mobile, smart TVs, and browser.`
          : `Stream via Sportsnet+ (Standard in-market, Premium out-of-market) or TSN+ depending on your provider.`}
      </p>
    </div>
  `;

  // Team hub directory already defined as homeTeamDir

  let renderedHtml = template;
  renderedHtml = renderedHtml.replace(/\{\{PAGE_TITLE\}\}/g, pageTitle);
  renderedHtml = renderedHtml.replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl);
  renderedHtml = renderedHtml.replace(/\{\{META_DESCRIPTION\}\}/g, metaDescription);
  renderedHtml = renderedHtml.replace(/\{\{OG_IMAGE_URL\}\}/g, ogImageUrl);
  renderedHtml = renderedHtml.replace(/\{\{SCHEMA_JSON\}\}/g, JSON.stringify(schemaObj, null, 2));
  renderedHtml = renderedHtml.replace(/\{\{HOME_TEAM_DIR\}\}/g, homeTeamDir);
  renderedHtml = renderedHtml.replace(/\{\{HOME_TEAM_NAME\}\}/g, homeTeam.name);
  renderedHtml = renderedHtml.replace(/\{\{MATCHUP_SHORT\}\}/g, `${awayTeam.city} vs ${homeTeam.city}`);
  renderedHtml = renderedHtml.replace(/\{\{MATCHUP_TITLE\}\}/g, `${awayTeam.name} @ ${homeTeam.name}`);
  renderedHtml = renderedHtml.replace(/\{\{PRESEASON_BADGE\}\}/g, preseasonBadge);
  renderedHtml = renderedHtml.replace(/\{\{GAME_DATE\}\}/g, g.date);
  renderedHtml = renderedHtml.replace(/\{\{GAME_TIME\}\}/g, g.time || '7:00 PM ET');
  renderedHtml = renderedHtml.replace(/\{\{GAME_ISO\}\}/g, g.iso);
  renderedHtml = renderedHtml.replace(/\{\{VENUE_NAME\}\}/g, g.venue || `${homeTeam.city} Arena`);
  renderedHtml = renderedHtml.replace(/\{\{PRIMARY_NET_EN\}\}/g, g.netEN || 'Sportsnet');
  renderedHtml = renderedHtml.replace(/\{\{PRIMARY_NET_FR_BADGE\}\}/g, primaryNetFrBadge);
  
  renderedHtml = renderedHtml.replace(/\{\{VERDICT_BOX_CLASSES\}\}/g, defaultVerdict.boxClass);
  renderedHtml = renderedHtml.replace(/\{\{VERDICT_ICON\}\}/g, defaultVerdict.icon);
  renderedHtml = renderedHtml.replace(/\{\{VERDICT_HEADLINE\}\}/g, defaultVerdict.headline);
  renderedHtml = renderedHtml.replace(/\{\{VERDICT_BADGE_CLASSES\}\}/g, defaultVerdict.badgeClass);
  renderedHtml = renderedHtml.replace(/\{\{VERDICT_BADGE_TEXT\}\}/g, defaultVerdict.badgeText);
  renderedHtml = renderedHtml.replace(/\{\{VERDICT_EXPLANATION\}\}/g, defaultVerdict.explanation);

  renderedHtml = renderedHtml.replace(/\{\{REGION_MATRIX_ROWS\}\}/g, matrixRowsHtml);
  renderedHtml = renderedHtml.replace(/\{\{RADIO_STATION_NAME\}\}/g, radioStationName);
  renderedHtml = renderedHtml.replace(/\{\{RADIO_STREAM_URL\}\}/g, radioStreamUrl);
  renderedHtml = renderedHtml.replace(/\{\{RADIO_ACTION_TEXT\}\}/g, `Listen live on ${radioStationName.split('/')[0].trim()} \u2192`);
  
  renderedHtml = renderedHtml.replace(/\{\{STREAMING_PROVIDER_NAME\}\}/g, streamingProviderName);
  renderedHtml = renderedHtml.replace(/\{\{STREAMING_DESCRIPTION\}\}/g, streamingDescription);
  renderedHtml = renderedHtml.replace(/\{\{STREAMING_ACTION_LINK\}\}/g, streamingActionLink);
  renderedHtml = renderedHtml.replace(/\{\{FAQ_CONTENT_HTML\}\}/g, faqHtml);
  renderedHtml = renderedHtml.replace(/\{\{REGION_DATA_JSON\}\}/g, JSON.stringify(regionBreakdown));

  // Placeholder navigation
  renderedHtml = renderedHtml.replace(/\{\{PREV_GAME_LINK\}\}/g, `<a href="https://hockeyblackouts.ca/${homeTeamDir}/" class="hover:text-white transition">&larr; ${homeTeam.nickname} Schedule</a>`);
  renderedHtml = renderedHtml.replace(/\{\{NEXT_GAME_LINK\}\}/g, `<a href="https://hockeyblackouts.ca/${homeTeamDir}/" class="hover:text-white transition">More ${homeTeam.nickname} Games &rarr;</a>`);

  fs.writeFileSync(path.join(gameDirPath, 'index.html'), renderedHtml);
  builtGameUrls.push(canonicalUrl);
});

console.log(`✅ Successfully generated ${builtGameUrls.length} per-game pages under build/game/`);
