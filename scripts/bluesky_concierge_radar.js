#!/usr/bin/env node

/**
 * scripts/bluesky_concierge_radar.js
 *
 * Semi-Automated "Helpful Concierge" Radar for HockeyBlackouts.ca
 * - Searches Bluesky for Canadian & US hockey fans experiencing broadcast blackouts
 * - Uses simple space-separated Bluesky search queries (no unsupported OR/parentheses) + local regex filtering
 * - Filters out reposts, self-handles, and posts older than LOOKBACK_MINUTES (360 min / 6h)
 * - Classifies into Categories A, B, C, D, E and detects team context
 * - Generates context-aware, helpful replies (< 270 characters)
 * - Sends embeds to Discord webhook (CONCIERGE_WEBHOOK_URL) and GitHub Step Summary
 */

const fs = require('fs');
const path = require('path');
const { formatEtDate } = require('./lib/date_utils');

const BSKY_SERVICE = 'https://bsky.social';
const isDryRun = process.argv.includes('--dry-run');

// 360 minutes (6 hours) search window to absorb GitHub Actions cron delays without re-alerting yesterday's games
const lookbackArg = process.argv.find(a => a.startsWith('--lookback='));
const LOOKBACK_MINUTES = Number(lookbackArg ? lookbackArg.split('=')[1] : (process.env.LOOKBACK_MINUTES || 360));
const now = Date.now();
const sinceIso = new Date(now - LOOKBACK_MINUTES * 60 * 1000).toISOString();

// Canadian Team Detection & Metadata
const CANADIAN_TEAMS = [
  { id: 'TOR', name: 'Leafs', keywords: /\b(leafs|maple leafs|toronto)\b/i, territory: 'Ontario' },
  { id: 'MTL', name: 'Canadiens', keywords: /\b(habs|canadiens|montreal|montréal)\b/i, territory: 'Quebec & Eastern Canada' },
  { id: 'OTT', name: 'Sens', keywords: /\b(sens|senators|ottawa)\b/i, territory: 'Eastern Ontario & Quebec' },
  { id: 'VAN', name: 'Canucks', keywords: /\b(canucks|vancouver)\b/i, territory: 'BC & Yukon' },
  { id: 'CGY', name: 'Flames', keywords: /\b(flames|calgary)\b/i, territory: 'Alberta & Saskatchewan' },
  { id: 'EDM', name: 'Oilers', keywords: /\b(oilers|edmonton)\b/i, territory: 'Alberta & Saskatchewan' },
  { id: 'WPG', name: 'Jets', keywords: /\b(jets|winnipeg)\b/i, territory: 'Manitoba & Saskatchewan' }
];

// US Team Detection & Metadata (loaded from data/us_teams.json)
const US_TEAM_KEYWORD_MAP = {
  ANA: /\b(ducks|anaheim)\b/i,
  BOS: /\b(bruins|boston)\b/i,
  BUF: /\b(sabres|buffalo)\b/i,
  CAR: /\b(hurricanes|carolina|canes)\b/i,
  CBJ: /\b(blue jackets|columbus)\b/i,
  CHI: /\b(blackhawks|chicago|hawks)\b/i,
  COL: /\b(avalanche|colorado|avs)\b/i,
  DAL: /\b(stars|dallas)\b/i,
  DET: /\b(red wings|detroit)\b/i,
  FLA: /\b(panthers|florida)\b/i,
  LAK: /\b(kings|los angeles)\b/i,
  MIN: /\b(wild|minnesota)\b/i,
  NJD: /\b(devils|new jersey)\b/i,
  NSH: /\b(predators|nashville|preds)\b/i,
  NYI: /\b(islanders|isles)\b/i,
  NYR: /\b(rangers)\b/i,
  PHI: /\b(flyers|philadelphia)\b/i,
  PIT: /\b(penguins|pittsburgh|pens)\b/i,
  SEA: /\b(kraken|seattle)\b/i,
  SJS: /\b(sharks|san jose)\b/i,
  STL: /\b(blues|st\.?\s*louis)\b/i,
  TBL: /\b(lightning|tampa bay|bolts)\b/i,
  UTA: /\b(mammoth|utah)\b/i,
  VGK: /\b(golden knights|vegas)\b/i,
  WSH: /\b(capitals|washington|caps)\b/i
};

const usTeamsPath = path.join(__dirname, '../data/us_teams.json');
const ALL_US_TEAMS_META = fs.existsSync(usTeamsPath) ? JSON.parse(fs.readFileSync(usTeamsPath, 'utf-8')) : [];
const US_TEAMS = ALL_US_TEAMS_META
  .filter(t => t.country === 'US' && US_TEAM_KEYWORD_MAP[t.id])
  .map(t => ({ ...t, keywords: US_TEAM_KEYWORD_MAP[t.id] }));

const US_BROADCAST_RE = /\b(espn\b|hulu|tnt|max|msg|nesn|bally|fanduel|altitude|nhl network|peacock)|\bespn\+|\bvictory\+/i;
const CA_TEAM_OR_BROADCASTER_RE = /\b(tsn[2-5]?|sportsnet|rds|leafs|maple leafs|habs|canadiens|sens|senators|canucks|oilers|flames|jets)\b|\bsn\+/i;
const BLACKOUT_RE = /\b(blacked?\s*out|blackout)\b/i;
const HOCKEY_RE = /\b(nhl|hockey|leafs|maple leafs|habs|canadiens|sens|senators|canucks|oilers|flames|jets|rangers|bruins|islanders|devils|flyers|penguins|capitals|hurricanes|panthers|lightning|red wings|sabres|blackhawks|blues|wild|stars|avalanche|predators|ducks|kings|sharks|kraken|golden knights|mammoth)\b/i;

const SEARCH_CATEGORIES = [
  {
    id: 'A',
    name: 'Regional Blackout (TSN / Sportsnet)',
    queries: [
      '"blacked out" TSN',
      '"blacked out" Sportsnet',
      'blackout TSN',
      'blackout Sportsnet',
      '"blacked out" NHL',
      '"blacked out" hockey',
      'blackout RDS'
    ],
    match: (text) => BLACKOUT_RE.test(text) && HOCKEY_RE.test(text) && (!US_BROADCAST_RE.test(text) || CA_TEAM_OR_BROADCASTER_RE.test(text)),
    defaultUrl: 'https://hockeyblackouts.ca/tsn-hockey-blackout-rules/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=comment_reply'
  },
  {
    id: 'B',
    name: 'Cable vs. Sportsnet+ / Wednesday Exclusive',
    queries: [
      '"Sportsnet+" blackout',
      '"Sportsnet Plus" blackout',
      '"Sportsnet+" channel',
      'Sportsnet cable hockey'
    ],
    match: (text) => (/\b(sportsnet plus|sportsnet)\b|\bsportsnet\+|\bsn\+/i).test(text) && /\b(blacked?\s*out|blackout|cable|bell|telus|rogers|channel|wednesday|prime|stream)\b/i.test(text) && (/\b(sportsnet plus)\b|\bsportsnet\+|\bsn\+/i.test(text) || /\bgame\b/i.test(text) || HOCKEY_RE.test(text)),
    defaultUrl: 'https://hockeyblackouts.ca/sportsnet-plus-blackout-rules/?utm_source=bluesky&utm_medium=social&utm_campaign=sn_exclusive&utm_content=comment_reply'
  },
  {
    id: 'C',
    name: 'Amazon Prime Video Hockey Exclusive',
    queries: [
      'Prime hockey',
      'Amazon hockey',
      'Prime NHL',
      '"Prime Video" NHL',
      '"Prime Video" hockey'
    ],
    match: (text) => /\b(prime|amazon)\b/i.test(text) && /\b(nhl|hockey|leafs|habs|canadiens|sens|senators|canucks|oilers|flames|jets)\b/i.test(text) && /\b(blacked?\s*out|blackout|watch|stream|cable|tsn|sportsnet|monday|wednesday|exclusive|game)\b/i.test(text),
    defaultUrl: 'https://hockeyblackouts.ca/prime-hockey-schedule-canada/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=comment_reply'
  },
  {
    id: 'D',
    name: 'IP Geolocation & ISP Technical Glitch',
    queries: [
      'Starlink Sportsnet',
      'Starlink TSN',
      'Starlink blackout hockey',
      '"in market" blackout NHL',
      '"in market" "blacked out" hockey'
    ],
    match: (text) => /\b(starlink|in[- ]market|out[- ]of[- ]market|location|region|province|isp|rogers|bell|telus|ip address)\b/i.test(text) && BLACKOUT_RE.test(text) && (/\b(tsn[2-5]?|sportsnet|espn|nhl|hockey)\b|\bespn\+/i).test(text),
    defaultUrl: 'https://hockeyblackouts.ca/how-blackouts-work/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_inspector&utm_content=comment_reply'
  },
  {
    id: 'E',
    name: 'US National / RSN Blackout (ESPN+ / TNT / RSNs)',
    queries: [
      '"blacked out" "ESPN+"',
      'blackout "ESPN+"',
      '"ESPN+" NHL blackout',
      '"blacked out" MSG hockey',
      '"blacked out" NESN',
      'blackout NHL TNT'
    ],
    match: (text) => BLACKOUT_RE.test(text) && US_BROADCAST_RE.test(text) && HOCKEY_RE.test(text),
    defaultUrl: 'https://hockeyblackouts.com/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=comment_reply'
  }
];

function getTodayIsoDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

function getGameLocalDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Find if a team has an active game today
function findTodayGameForTeam(teamId) {
  const today = getTodayIsoDate();
  const teamCode = teamId.toLowerCase();
  const dataPath = path.join(__dirname, `../data/${teamCode}.json`);
  if (!fs.existsSync(dataPath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const game = data.schedule.find(g => getGameLocalDate(g.iso) === today);
    if (!game) return null;

    const isHome = game.vs.startsWith('vs ');
    const homeId = isHome ? data.team.id : game.opp;
    const awayId = isHome ? game.opp : data.team.id;

    const ALL_CITIES = {
      'MTL': 'Montreal', 'TOR': 'Toronto', 'OTT': 'Ottawa', 'VAN': 'Vancouver',
      'CGY': 'Calgary', 'EDM': 'Edmonton', 'WPG': 'Winnipeg', 'BOS': 'Boston',
      'BUF': 'Buffalo', 'DET': 'Detroit', 'FLA': 'Florida', 'TBL': 'Tampa Bay',
      'CAR': 'Carolina', 'NJD': 'New Jersey', 'NYI': 'New York', 'NYR': 'New York',
      'PHI': 'Philadelphia', 'PIT': 'Pittsburgh', 'WSH': 'Washington', 'CBJ': 'Columbus',
      'CHI': 'Chicago', 'COL': 'Colorado', 'DAL': 'Dallas', 'MIN': 'Minnesota',
      'NSH': 'Nashville', 'STL': 'St Louis', 'UTA': 'Utah', 'ANA': 'Anaheim',
      'LAK': 'Los Angeles', 'SJS': 'San Jose', 'SEA': 'Seattle', 'VGK': 'Vegas'
    };

    const homeCity = ALL_CITIES[homeId] || homeId;
    const awayCity = ALL_CITIES[awayId] || awayId;
    const homeSlug = slugify(homeCity);
    const awaySlug = slugify(awayCity);
    const datePrefix = formatEtDate(game.iso);

    return {
      game,
      url: `https://hockeyblackouts.ca/game/${datePrefix}/${homeSlug}-vs-${awaySlug}/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=comment_reply`,
      homeCity,
      awayCity
    };
  } catch (err) {
    return null;
  }
}

// Find if a US team has an active game today in build_com/<slug>/data.json (or data/us/<slug>.json)
function findTodayUsGameForTeam(teamSlug) {
  if (!teamSlug) return null;
  const today = getTodayIsoDate();
  const buildComPath = path.join(__dirname, `../build_com/${teamSlug}/data.json`);
  const fallbackPath = path.join(__dirname, `../data/us/${teamSlug}.json`);
  const dataPath = fs.existsSync(buildComPath) ? buildComPath : fallbackPath;
  if (!fs.existsSync(dataPath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const game = data.schedule.find(g => getGameLocalDate(g.iso) === today);
    if (!game) return null;

    const isHome = game.vs.startsWith('vs ');
    const homeId = isHome ? data.team.id : game.opp;
    const awayId = isHome ? game.opp : data.team.id;

    const ALL_CITIES = {
      'MTL': 'Montreal', 'TOR': 'Toronto', 'OTT': 'Ottawa', 'VAN': 'Vancouver',
      'CGY': 'Calgary', 'EDM': 'Edmonton', 'WPG': 'Winnipeg', 'BOS': 'Boston',
      'BUF': 'Buffalo', 'DET': 'Detroit', 'FLA': 'Florida', 'TBL': 'Tampa Bay',
      'CAR': 'Carolina', 'NJD': 'New Jersey', 'NYI': 'New York', 'NYR': 'New York',
      'PHI': 'Philadelphia', 'PIT': 'Pittsburgh', 'WSH': 'Washington', 'CBJ': 'Columbus',
      'CHI': 'Chicago', 'COL': 'Colorado', 'DAL': 'Dallas', 'MIN': 'Minnesota',
      'NSH': 'Nashville', 'STL': 'St Louis', 'UTA': 'Utah', 'ANA': 'Anaheim',
      'LAK': 'Los Angeles', 'SJS': 'San Jose', 'SEA': 'Seattle', 'VGK': 'Vegas'
    };

    const homeCity = ALL_CITIES[homeId] || homeId;
    const awayCity = ALL_CITIES[awayId] || awayId;
    const homeTeam = ALL_US_TEAMS_META.find(t => t.id === homeId);
    const linkSlug = homeTeam?.slug || teamSlug;

    return {
      game,
      url: `https://hockeyblackouts.com/${linkSlug}/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=comment_reply`,
      homeCity,
      awayCity,
      matchupText: `${awayCity} at ${homeCity}`
    };
  } catch (err) {
    return null;
  }
}

// AT Protocol Client calls
async function createSession(identifier, password) {
  const res = await fetch(`${BSKY_SERVICE}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create Bluesky session for ${identifier}: ${res.status} ${errText}`);
  }
  return await res.json();
}

async function searchPosts(accessJwt, query, limit = 25) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    sort: 'latest',
    since: sinceIso
  });

  const res = await fetch(`${BSKY_SERVICE}/xrpc/app.bsky.feed.searchPosts?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessJwt}`
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`searchPosts error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.posts || [];
}

// Generate smart, context-aware reply
function draftReply(category, postText) {
  // Detect Canadian team
  let detectedCaTeam = null;
  for (const team of CANADIAN_TEAMS) {
    if (team.keywords.test(postText)) {
      detectedCaTeam = team;
      break;
    }
  }

  // Detect US team
  let detectedUsTeam = null;
  for (const team of US_TEAMS) {
    if (team.keywords.test(postText)) {
      detectedUsTeam = team;
      break;
    }
  }

  // Determine target account (.ca vs .com)
  const isUsTarget =
    category.id === 'E' ||
    (category.id === 'D' && !detectedCaTeam && !CA_TEAM_OR_BROADCASTER_RE.test(postText) && (US_BROADCAST_RE.test(postText) || Boolean(detectedUsTeam)));
  const targetSite = isUsTarget ? '.com' : '.ca';

  const todayCaGame = !isUsTarget && detectedCaTeam ? findTodayGameForTeam(detectedCaTeam.id) : null;
  const todayUsGame = isUsTarget && detectedUsTeam ? findTodayUsGameForTeam(detectedUsTeam.slug) : null;

  let replyText = '';
  let targetUrl = category.defaultUrl;

  if (category.id === 'A') {
    if (todayCaGame) {
      targetUrl = todayCaGame.url;
      replyText = `Regional NHL games are locked to local zones on cable. Fans outside ${detectedCaTeam.territory} are blacked out tonight. Channel options: ${targetUrl}`;
    } else if (detectedCaTeam) {
      replyText = `Regional NHL games for the ${detectedCaTeam.name} are locked to ${detectedCaTeam.territory} on cable/TSN/SN+. Full boundary breakdown: ${targetUrl}`;
    } else {
      replyText = `Regional NHL games on TSN & Sportsnet are locked to local broadcast zones on cable. Full breakdown of blackout boundaries: ${targetUrl}`;
    }
  } else if (category.id === 'B') {
    replyText = `Wednesday games stream exclusively on Prime Video (app only) and are not on linear cable. Full breakdown of the rules: ${targetUrl}`;
  } else if (category.id === 'C') {
    replyText = `Amazon Prime has exclusive Canadian rights to Wednesday Night Hockey, so cable cannot carry it. Full Prime schedule: ${targetUrl}`;
  } else if (category.id === 'D') {
    if (isUsTarget) {
      targetUrl = detectedUsTeam
        ? `https://hockeyblackouts.com/${detectedUsTeam.slug}/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=comment_reply`
        : 'https://hockeyblackouts.com/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=comment_reply';
      replyText = `ISP routing (Starlink or mobile data) often misidentifies your ZIP/DMA and triggers ESPN+ or RSN blackouts. Check ZIP blackout rules: ${targetUrl}`;
    } else {
      replyText = `ISP routing (Starlink or mobile cell data) often misidentifies your province and causes blackouts. Free IP scan: ${targetUrl}`;
    }
  } else if (category.id === 'E') {
    if (todayUsGame) {
      targetUrl = todayUsGame.url;
      const net = todayUsGame.game.netUSNat || todayUsGame.game.primaryNet || 'ESPN+';
      if (todayUsGame.game.typeUS === 'national') {
        replyText = `Tonight's ${detectedUsTeam.nickname} game is a US national exclusive on ${net} (blacked out on ESPN+ & local RSNs). ZIP blackout guide: ${targetUrl}`;
      } else if (todayUsGame.game.typeUS === 'nhl_network') {
        replyText = `Tonight's ${detectedUsTeam.nickname} game airs on NHL Network & local RSN (out-of-market ESPN+ is blacked out). ZIP check: ${targetUrl}`;
      } else {
        replyText = `ESPN+ carries out-of-market ${detectedUsTeam.nickname} games, while in-market ZIPs air on ${detectedUsTeam.rsn}. Check your ZIP: ${targetUrl}`;
      }
    } else if (detectedUsTeam) {
      targetUrl = `https://hockeyblackouts.com/${detectedUsTeam.slug}/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=comment_reply`;
      replyText = `ESPN+ blacks out in-market ${detectedUsTeam.nickname} games (${detectedUsTeam.rsn}) & national exclusives (TNT/ESPN/ABC). Check your ZIP: ${targetUrl}`;
    } else {
      replyText = `ESPN+ blacks out in-market RSN games & national exclusives (TNT/ABC/ESPN/NHL Network). Check tonight's channel & ZIP blackout rules: ${targetUrl}`;
    }
  }

  return {
    replyText,
    detectedTeam: isUsTarget ? (detectedUsTeam ? detectedUsTeam.name : null) : (detectedCaTeam ? detectedCaTeam.name : null),
    targetUrl,
    targetSite
  };
}

function getRkeyFromUri(uri) {
  if (!uri) return '';
  return uri.split('/').pop();
}

async function sendDiscordWebhook(webhookUrl, embeds) {
  if (!webhookUrl || embeds.length === 0) return;
  for (let i = 0; i < embeds.length; i += 10) {
    const batch = embeds.slice(i, i + 10);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: batch })
      });
      if (!res.ok) {
        console.warn(`[Discord Webhook] Status: ${res.status}`);
      } else {
        console.log(`✅ Sent ${batch.length} concierge alert(s) to Discord webhook.`);
      }
    } catch (err) {
      console.warn('[Discord Webhook Error]:', err.message);
    }
  }
}

// Check whether today's Canadian games have been published to Bluesky
async function checkTodaysGamePostsPublished(mainIdentifier) {
  const targetActor = mainIdentifier || 'hockeyblackouts.ca';
  const missingGames = [];

  // Find all games today for Canadian teams
  const seenGames = new Set();
  const todaysGames = [];
  ['tor', 'mtl', 'ott', 'van', 'cgy', 'edm', 'wpg'].forEach(code => {
    const info = findTodayGameForTeam(code);
    if (info) {
      const matchKey = `${info.awayCity} @ ${info.homeCity}`;
      if (!seenGames.has(matchKey)) {
        seenGames.add(matchKey);
        todaysGames.push(info);
      }
    }
  });

  if (todaysGames.length === 0) return missingGames;

  try {
    const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(targetActor)}&limit=25`);
    if (!res.ok) return missingGames;
    const data = await res.json();
    const feed = data.feed || [];

    for (const g of todaysGames) {
      const cleanUrl = g.url.split('?')[0];
      const isPosted = feed.some(item => {
        const record = item.post?.record;
        if (!record) return false;
        const embedUri = record.embed?.external?.uri || '';
        const text = record.text || '';
        return embedUri.includes(cleanUrl) || text.includes(cleanUrl);
      });
      if (!isPosted) {
        missingGames.push(g);
      }
    }
  } catch (err) {
    console.warn('Could not query Bluesky public feed for publication check:', err.message);
  }

  return missingGames;
}

// Check whether today's US games have been published to the .com Bluesky account
async function checkTodaysUsGamePostsPublished(usIdentifier) {
  const targetActor = usIdentifier || 'hockeyblackouts.com';
  const missingGames = [];
  const today = getTodayIsoDate();

  const seenGames = new Set();
  const todaysGames = [];
  ALL_US_TEAMS_META.forEach(teamMeta => {
    const info = findTodayUsGameForTeam(teamMeta.slug);
    if (info) {
      const matchKey = `${info.awayCity} @ ${info.homeCity}`;
      if (!seenGames.has(matchKey)) {
        seenGames.add(matchKey);
        todaysGames.push(info);
      }
    }
  });

  if (todaysGames.length === 0) return missingGames;

  try {
    const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(targetActor)}&limit=50`);
    if (!res.ok) return missingGames;
    const data = await res.json();
    const feed = data.feed || [];

    for (const g of todaysGames) {
      const cleanUrl = g.url.split('?')[0];
      const isPosted = feed.some(item => {
        const record = item.post?.record;
        if (!record) return false;
        if (getGameLocalDate(record.createdAt) !== today) return false;
        const embedUri = record.embed?.external?.uri || '';
        const text = record.text || '';
        return (embedUri.includes(cleanUrl) || text.includes(cleanUrl)) && text.includes(g.matchupText);
      });
      if (!isPosted) {
        missingGames.push(g);
      }
    }
  } catch (err) {
    console.warn('Could not query US Bluesky public feed for publication check:', err.message);
  }

  return missingGames;
}

async function main() {
  console.log('🚨 HockeyBlackouts.ca & .com - Bluesky Concierge Radar');
  console.log(`Scanning Bluesky posts from the last ${LOOKBACK_MINUTES} minutes (since ${sinceIso})...\n`);

  const identifier = process.env.BSKY_MAIN_IDENTIFIER;
  const password = process.env.BSKY_MAIN_PASSWORD;
  const usIdentifier = process.env.BSKY_US_IDENTIFIER || 'hockeyblackouts.com';
  const usPassword = process.env.BSKY_US_PASSWORD;
  const discordWebhook = process.env.CONCIERGE_WEBHOOK_URL;
  const githubStepSummary = process.env.GITHUB_STEP_SUMMARY;
  const discordEmbeds = [];

  // Watchdog: only alert between 12:00 PM ET and 11:59 PM ET so delayed overnight radar runs don't false-alarm before morning publish
  const currentEtHour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  if (currentEtHour >= 12) {
    console.log('Checking game-day broadcast publication status on Bluesky (.ca)...');
    const missingPosts = await checkTodaysGamePostsPublished(identifier);
    if (missingPosts.length > 0) {
      console.warn(`⚠️ Warning [.ca]: ${missingPosts.length} game-day post(s) are NOT yet live on Bluesky:`);
      missingPosts.forEach(g => {
        console.warn(`   - ${g.awayCity} @ ${g.homeCity} (${g.url.split('?')[0]})`);
        discordEmbeds.push({
          title: '⚠️ Alert [.ca]: Missing Game-Day Post on Bluesky',
          description: `Today's broadcast post for **${g.awayCity} @ ${g.homeCity}** has not yet been published to [@${identifier || 'hockeyblackouts.ca'}](https://bsky.app/profile/${identifier || 'hockeyblackouts.ca'}).\n\nRun the \`Bluesky Game-Day Publisher\` workflow to publish.`,
          color: 16744272,
          footer: { text: 'HockeyBlackouts.ca Concierge Watchdog' },
          timestamp: new Date().toISOString()
        });
      });
    } else {
      console.log('✅ All active Canadian games for today are published on Bluesky (.ca).\n');
    }

    if (usPassword) {
      console.log('Checking game-day broadcast publication status on Bluesky (.com)...');
      const missingUsPosts = await checkTodaysUsGamePostsPublished(usIdentifier);
      if (missingUsPosts.length > 0) {
        console.warn(`⚠️ Warning [.com]: ${missingUsPosts.length} US game-day post(s) are NOT yet live on Bluesky:`);
        missingUsPosts.forEach(g => {
          console.warn(`   - ${g.awayCity} @ ${g.homeCity} (${g.url.split('?')[0]})`);
          discordEmbeds.push({
            title: '⚠️ Alert [.com]: Missing Game-Day Post on Bluesky',
            description: `Today's US broadcast post for **${g.awayCity} @ ${g.homeCity}** has not yet been published to [@${usIdentifier}](https://bsky.app/profile/${usIdentifier}).\n\nRun the \`Bluesky Game-Day Publisher\` workflow to publish.`,
            color: 16744272,
            footer: { text: 'HockeyBlackouts.com Concierge Watchdog' },
            timestamp: new Date().toISOString()
          });
        });
      } else {
        console.log('✅ All active US games for today are published on Bluesky (.com).\n');
      }
    }
  } else {
    console.log(`ℹ️ Skipping missing-post watchdog check (${currentEtHour}:00 ET is prior to afternoon window).\n`);
  }

  let session = null;
  if (!isDryRun && identifier && password) {
    try {
      console.log(`Authenticating with Bluesky as ${identifier}...`);
      session = await createSession(identifier, password);
      console.log(`✅ Authenticated successfully.\n`);
    } catch (err) {
      console.error(`Authentication error: ${err.message}`);
      if (!isDryRun) process.exit(1);
    }
  } else if (!identifier || !password) {
    console.log('ℹ️ No BSKY_MAIN_IDENTIFIER / PASSWORD provided. Operating in dry-run simulation mode.\n');
  }

  const seenUris = new Set();
  const matchedPosts = [];

  if (session) {
    for (const cat of SEARCH_CATEGORIES) {
      console.log(`Searching Category ${cat.id}: "${cat.name}" (${cat.queries.length} queries)...`);
      let rawCount = 0;
      let catMatched = 0;

      for (const query of cat.queries) {
        try {
          const posts = await searchPosts(session.accessJwt, query, 25);
          rawCount += posts.length;

          for (const post of posts) {
            if (!post.uri || seenUris.has(post.uri)) continue;

            const authorHandle = post.author?.handle || '';
            // Filter out our own accounts
            if (
              authorHandle.includes('hockeyblackouts.ca') ||
              authorHandle.includes('hockeyblackouts.com') ||
              authorHandle === identifier ||
              authorHandle === usIdentifier
            ) continue;

            // Filter out retweets / short posts
            const text = post.record?.text || '';
            if (text.startsWith('RT ') || text.length < 15) continue;

            // Check post age (< LOOKBACK_MINUTES)
            const postDate = new Date(post.record?.createdAt || post.indexedAt).getTime();
            if (now - postDate > LOOKBACK_MINUTES * 60 * 1000) continue;

            // Local regex filter to replace unsupported Bluesky OR/parentheses operators
            if (cat.match && !cat.match(text)) continue;

            seenUris.add(post.uri);
            catMatched++;

            const draft = draftReply(cat, text);
            const rkey = getRkeyFromUri(post.uri);
            const postUrl = `https://bsky.app/profile/${authorHandle}/post/${rkey}`;

            matchedPosts.push({
              category: cat,
              post,
              authorHandle,
              text,
              postUrl,
              draft,
              createdAt: post.record?.createdAt || post.indexedAt
            });
          }
        } catch (err) {
          console.warn(`Error querying Category ${cat.id} (${query}): ${err.message}`);
        }
      }
      console.log(`Category ${cat.id}: ${rawCount} raw post(s), ${catMatched} matched filter.`);
    }
  } else {
    // Simulated dry-run samples (both .ca and .com) when running locally without credentials
    console.log('Executing simulated sample evaluation for dry-run verification...');
    const sampleCaPost = {
      author: { handle: 'leafsfan99.bsky.social' },
      record: {
        text: "Why is the Leafs game blacked out on TSN4 right now?? I pay for TSN and live in Halifax!",
        createdAt: new Date().toISOString()
      },
      uri: 'at://did:plc:sample123/app.bsky.feed.post/3lbtest789'
    };
    const draftCa = draftReply(SEARCH_CATEGORIES[0], sampleCaPost.record.text);
    matchedPosts.push({
      category: SEARCH_CATEGORIES[0],
      post: sampleCaPost,
      authorHandle: sampleCaPost.author.handle,
      text: sampleCaPost.record.text,
      postUrl: `https://bsky.app/profile/${sampleCaPost.author.handle}/post/3lbtest789`,
      draft: draftCa,
      createdAt: sampleCaPost.record.createdAt
    });

    const sampleUsPost = {
      author: { handle: 'bruinsfan88.bsky.social' },
      record: {
        text: "Why is the Bruins game blacked out on ESPN+ tonight? I'm in Boston and paying for ESPN+!",
        createdAt: new Date().toISOString()
      },
      uri: 'at://did:plc:sample456/app.bsky.feed.post/3lbtest999'
    };
    const draftUs = draftReply(SEARCH_CATEGORIES[4], sampleUsPost.record.text);
    matchedPosts.push({
      category: SEARCH_CATEGORIES[4],
      post: sampleUsPost,
      authorHandle: sampleUsPost.author.handle,
      text: sampleUsPost.record.text,
      postUrl: `https://bsky.app/profile/${sampleUsPost.author.handle}/post/3lbtest999`,
      draft: draftUs,
      createdAt: sampleUsPost.record.createdAt
    });
  }

  console.log(`\n============================================================`);
  console.log(`Radar Scan Results: ${matchedPosts.length} fan pain-point match(es)`);
  console.log(`============================================================\n`);

  let summaryMarkdown = `## 🏒 Bluesky Concierge Radar Summary\n\n`;
  summaryMarkdown += `Found **${matchedPosts.length}** fan broadcast inquiry/pain-point match(es) in the last ${LOOKBACK_MINUTES} minutes.\n\n`;
  summaryMarkdown += `| Account | Category | Author | Post Excerpt | Suggested Quick Reply | Direct Link |\n`;
  summaryMarkdown += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  // Process top 10 matches (Discord embed limit)
  const topMatches = matchedPosts.slice(0, 10);

  topMatches.forEach((item, index) => {
    const cleanPostExcerpt = item.text.replace(/\n+/g, ' ').slice(0, 90) + (item.text.length > 90 ? '...' : '');
    const cleanReply = item.draft.replyText;
    const targetSite = item.draft.targetSite || '.ca';
    const accountBadge = targetSite === '.com'
      ? `🇺🇸 **hockeyblackouts.com** (\`@${usIdentifier}\`)`
      : `🇨🇦 **hockeyblackouts.ca** (\`@${identifier || 'hockeyblackouts.ca'}\`)`;

    console.log(`[#${index + 1}] [${targetSite}] Category ${item.category.id}: ${item.category.name}`);
    console.log(`Account: ${targetSite}`);
    console.log(`Author:  @${item.authorHandle}`);
    console.log(`Post:    "${item.text}"`);
    console.log(`Reply:   "${cleanReply}" (${cleanReply.length} chars)`);
    console.log(`Link:    ${item.postUrl}\n`);

    // Discord Embed
    discordEmbeds.push({
      title: `🚨 [${targetSite}] Category ${item.category.id}: ${item.category.name}`,
      description: `**Author:** [@${item.authorHandle}](https://bsky.app/profile/${item.authorHandle})\n**Post:** ${item.text}`,
      color: targetSite === '.com' ? 2123412 : (item.category.id === 'A' ? 15548997 : (item.category.id === 'C' ? 3447003 : 15844367)),
      fields: [
        {
          name: 'Target Account',
          value: accountBadge,
          inline: true
        },
        {
          name: `Suggested Reply (${cleanReply.length} chars)`,
          value: `\`\`\`\n${cleanReply}\n\`\`\``
        },
        {
          name: 'Quick Action',
          value: `👉 [Open Post on Bluesky](${item.postUrl})`
        }
      ],
      footer: { text: `HockeyBlackouts${targetSite} Concierge • Category ${item.category.id}` },
      timestamp: item.createdAt
    });

    // GitHub Step Summary Row
    summaryMarkdown += `| **${targetSite}** | **${item.category.id}** (${item.draft.detectedTeam || 'General'}) | [@${item.authorHandle}](${item.postUrl}) | ${cleanPostExcerpt} | \`${cleanReply.slice(0, 100)}...\` | [Open Post](${item.postUrl}) |\n`;
  });

  // Write to GitHub Step Summary
  if (githubStepSummary) {
    try {
      fs.appendFileSync(githubStepSummary, summaryMarkdown + '\n');
      console.log('✅ Wrote summary to $GITHUB_STEP_SUMMARY.');
    } catch (err) {
      console.warn(`Failed writing to GITHUB_STEP_SUMMARY: ${err.message}`);
    }
  }

  // Deliver to Discord
  if (discordWebhook && discordEmbeds.length > 0 && !isDryRun) {
    console.log(`Delivering ${discordEmbeds.length} alert(s) to Discord webhook...`);
    await sendDiscordWebhook(discordWebhook, discordEmbeds);
  } else if (isDryRun) {
    console.log(`[DRY RUN] Would send ${discordEmbeds.length} embed(s) to Discord webhook.`);
  }

  console.log('🏁 Radar scan complete.');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal concierge radar error:', err);
    process.exit(1);
  });
}

module.exports = {
  SEARCH_CATEGORIES,
  CANADIAN_TEAMS,
  US_TEAMS,
  draftReply,
  findTodayGameForTeam,
  findTodayUsGameForTeam,
  checkTodaysUsGamePostsPublished,
  getRkeyFromUri
};
