#!/usr/bin/env node

/**
 * scripts/post_bluesky.js
 *
 * Automated Bluesky Game-Day Publisher for HockeyBlackouts.ca
 * - Direct AT Protocol XRPC calls (zero npm dependencies)
 * - Targets Master account (BSKY_MAIN_IDENTIFIER) and optional team accounts
 * - Embeds 1200x630 verdict card PNG with accurate alt text
 * - Accurate UTF-8 byte-offset richtext facets for links and hashtags
 * - Strict grapheme limit (< 280 graphemes)
 * - Supports --dry-run and optional Discord notification via CONCIERGE_WEBHOOK_URL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BSKY_SERVICE = 'https://bsky.social';
const isDryRun = process.argv.includes('--dry-run');

// Canadian Teams Metadata
const CANADIAN_TEAMS = {
  'TOR': {
    city: 'Toronto',
    name: 'Toronto Maple Leafs',
    nickname: 'Leafs',
    slug: 'toronto',
    hashtag: '#LeafsForever',
    territory: 'Ontario',
    territoryShort: 'Ontario',
    accountPrefix: 'BSKY_TOR',
    timezone: 'America/Toronto',
    timeZoneAbbr: 'ET',
    timeZoneAbbrFr: 'HE'
  },
  'MTL': {
    city: 'Montreal',
    cityFr: 'Montréal',
    name: 'Montreal Canadiens',
    nickname: 'Canadiens',
    nameFr: 'Canadiens de Montréal',
    slug: 'montreal',
    hashtag: '#GoHabsGo',
    territory: 'Quebec, Atlantic Canada & Eastern Ontario',
    territoryShort: 'QC & Atlantic Canada',
    territoryFr: 'au Québec et dans l’Est canadien',
    accountPrefix: 'BSKY_MTL',
    frAccountPrefix: 'BSKY_FR',
    timezone: 'America/Toronto',
    timeZoneAbbr: 'ET',
    timeZoneAbbrFr: 'HE'
  },
  'OTT': {
    city: 'Ottawa',
    name: 'Ottawa Senators',
    nickname: 'Sens',
    slug: 'ottawa',
    hashtag: '#GoSensGo',
    territory: 'Eastern Ontario, Quebec & Atlantic Canada',
    territoryShort: 'Eastern ON, QC & Atlantic',
    accountPrefix: 'BSKY_OTT',
    timezone: 'America/Toronto',
    timeZoneAbbr: 'ET',
    timeZoneAbbrFr: 'HE'
  },
  'VAN': {
    city: 'Vancouver',
    name: 'Vancouver Canucks',
    nickname: 'Canucks',
    slug: 'vancouver',
    hashtag: '#Canucks',
    territory: 'BC & Yukon',
    territoryShort: 'BC & Yukon',
    accountPrefix: 'BSKY_VAN',
    timezone: 'America/Vancouver',
    timeZoneAbbr: 'PT',
    timeZoneAbbrFr: 'HP'
  },
  'CGY': {
    city: 'Calgary',
    name: 'Calgary Flames',
    nickname: 'Flames',
    slug: 'calgary',
    hashtag: '#Flames',
    territory: 'Alberta, Saskatchewan & NWT',
    territoryShort: 'AB & SK',
    accountPrefix: 'BSKY_CGY',
    timezone: 'America/Edmonton',
    timeZoneAbbr: 'MT',
    timeZoneAbbrFr: 'HR'
  },
  'EDM': {
    city: 'Edmonton',
    name: 'Edmonton Oilers',
    nickname: 'Oilers',
    slug: 'edmonton',
    hashtag: '#LetsGoOilers',
    territory: 'Alberta, Saskatchewan & NWT',
    territoryShort: 'AB & SK',
    accountPrefix: 'BSKY_EDM',
    timezone: 'America/Edmonton',
    timeZoneAbbr: 'MT',
    timeZoneAbbrFr: 'HR'
  },
  'WPG': {
    city: 'Winnipeg',
    name: 'Winnipeg Jets',
    nickname: 'Jets',
    slug: 'winnipeg',
    hashtag: '#GoJetsGo',
    territory: 'Manitoba, Saskatchewan & NW Ontario',
    territoryShort: 'MB & SK',
    accountPrefix: 'BSKY_WPG',
    timezone: 'America/Winnipeg',
    timeZoneAbbr: 'CT',
    timeZoneAbbrFr: 'HC'
  }
};

// All 32 NHL Teams Timezone Metadata
const TEAM_TIMEZONES = {
  // Canadian Teams
  'VAN': { timeZone: 'America/Vancouver', abbr: 'PT', abbrFr: 'HP' },
  'CGY': { timeZone: 'America/Edmonton', abbr: 'MT', abbrFr: 'HR' },
  'EDM': { timeZone: 'America/Edmonton', abbr: 'MT', abbrFr: 'HR' },
  'WPG': { timeZone: 'America/Winnipeg', abbr: 'CT', abbrFr: 'HC' },
  'TOR': { timeZone: 'America/Toronto', abbr: 'ET', abbrFr: 'HE' },
  'OTT': { timeZone: 'America/Toronto', abbr: 'ET', abbrFr: 'HE' },
  'MTL': { timeZone: 'America/Toronto', abbr: 'ET', abbrFr: 'HE' },
  // US Eastern Teams
  'BOS': { timeZone: 'America/New_York', abbr: 'ET' },
  'BUF': { timeZone: 'America/New_York', abbr: 'ET' },
  'DET': { timeZone: 'America/New_York', abbr: 'ET' },
  'FLA': { timeZone: 'America/New_York', abbr: 'ET' },
  'TBL': { timeZone: 'America/New_York', abbr: 'ET' },
  'CAR': { timeZone: 'America/New_York', abbr: 'ET' },
  'NJD': { timeZone: 'America/New_York', abbr: 'ET' },
  'NYI': { timeZone: 'America/New_York', abbr: 'ET' },
  'NYR': { timeZone: 'America/New_York', abbr: 'ET' },
  'PHI': { timeZone: 'America/New_York', abbr: 'ET' },
  'PIT': { timeZone: 'America/New_York', abbr: 'ET' },
  'WSH': { timeZone: 'America/New_York', abbr: 'ET' },
  'CBJ': { timeZone: 'America/New_York', abbr: 'ET' },
  // US Central Teams
  'CHI': { timeZone: 'America/Chicago', abbr: 'CT' },
  'DAL': { timeZone: 'America/Chicago', abbr: 'CT' },
  'MIN': { timeZone: 'America/Chicago', abbr: 'CT' },
  'NSH': { timeZone: 'America/Chicago', abbr: 'CT' },
  'STL': { timeZone: 'America/Chicago', abbr: 'CT' },
  // US Mountain Teams
  'COL': { timeZone: 'America/Denver', abbr: 'MT' },
  'UTA': { timeZone: 'America/Denver', abbr: 'MT' },
  // US Pacific Teams
  'ANA': { timeZone: 'America/Los_Angeles', abbr: 'PT' },
  'LAK': { timeZone: 'America/Los_Angeles', abbr: 'PT' },
  'SJS': { timeZone: 'America/Los_Angeles', abbr: 'PT' },
  'SEA': { timeZone: 'America/Los_Angeles', abbr: 'PT' },
  'VGK': { timeZone: 'America/Los_Angeles', abbr: 'PT' }
};

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

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getTodayIsoDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

function getGraphemeCount(str) {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  return Array.from(segmenter.segment(str)).length;
}

// Build canonical UTM URLs adhering to AGENTS.md taxonomy
function buildUtmUrl(baseUrl, campaign = 'blackout_guide', content = 'post_link') {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'bluesky');
  url.searchParams.set('utm_medium', 'social');
  url.searchParams.set('utm_campaign', campaign);
  url.searchParams.set('utm_content', content);
  return url.toString();
}

// Compute accurate UTF-8 byte-offset facets for links and tags in AT Protocol
function extractFacets(text, linkMap = {}) {
  const facets = [];

  // Match full URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const rawUrl = match[0];
    const targetUri = linkMap[rawUrl] || rawUrl;
    const prefix = text.slice(0, match.index);
    const byteStart = Buffer.byteLength(prefix, 'utf-8');
    const byteEnd = byteStart + Buffer.byteLength(rawUrl, 'utf-8');
    facets.push({
      index: { byteStart, byteEnd },
      features: [{
        $type: 'app.bsky.richtext.facet#link',
        uri: targetUri
      }]
    });
  }

  // Match hashtags (#TagName)
  const tagRegex = /(?:^|\s)(#([a-zA-Z0-9_]+))/g;
  while ((match = tagRegex.exec(text)) !== null) {
    const fullTag = match[1];
    const tag = match[2];
    const tagIndex = match.index + (match[0].length - fullTag.length);
    const prefix = text.slice(0, tagIndex);
    const byteStart = Buffer.byteLength(prefix, 'utf-8');
    const byteEnd = byteStart + Buffer.byteLength(fullTag, 'utf-8');
    facets.push({
      index: { byteStart, byteEnd },
      features: [{
        $type: 'app.bsky.richtext.facet#tag',
        tag
      }]
    });
  }

  return facets;
}

// AT Protocol XRPC Calls
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

async function uploadBlob(accessJwt, imageBuffer, mimeType = 'image/png') {
  const res = await fetch(`${BSKY_SERVICE}/xrpc/com.atproto.repo.uploadBlob`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessJwt}`,
      'Content-Type': mimeType
    },
    body: imageBuffer
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload blob: ${res.status} ${errText}`);
  }
  const data = await res.json();
  return data.blob;
}

async function createPostRecord(accessJwt, did, { text, facets, embed }) {
  const record = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: new Date().toISOString()
  };
  if (facets && facets.length > 0) record.facets = facets;
  if (embed) record.embed = embed;

  const res = await fetch(`${BSKY_SERVICE}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      repo: did,
      collection: 'app.bsky.feed.post',
      record
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create post record for ${did}: ${res.status} ${errText}`);
  }
  return await res.json();
}

// Discord Webhook Notification
async function sendDiscordNotification(webhookUrl, embeds = []) {
  if (!webhookUrl || embeds.length === 0) return;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds })
    });
    if (!res.ok) {
      console.warn(`[Discord Webhook] Status: ${res.status}`);
    } else {
      console.log('✅ Discord notification sent successfully.');
    }
  } catch (err) {
    console.warn('[Discord Webhook Error]:', err.message);
  }
}

// Ensure card image exists, generating if needed
function resolveCardImage(datePrefix, homeSlug, awaySlug, primaryTeamSlug) {
  const specificCard = path.join(__dirname, `../build/og/games/${datePrefix}-${homeSlug}-vs-${awaySlug}.png`);
  if (fs.existsSync(specificCard)) return specificCard;

  // Try generating cards if directory is missing
  console.log(`Card ${specificCard} not found. Running generate_og_cards.js...`);
  try {
    execSync('node scripts/generate_og_cards.js', { stdio: 'inherit' });
    if (fs.existsSync(specificCard)) return specificCard;
  } catch (err) {
    console.warn(`Card generation warning: ${err.message}`);
  }

  // Fallbacks
  const teamCard = path.join(__dirname, `../build/og/teams/${primaryTeamSlug}.png`);
  if (fs.existsSync(teamCard)) return teamCard;

  const defaultCard = path.join(__dirname, '../build/og/default.png');
  if (fs.existsSync(defaultCard)) return defaultCard;

  const avatarCard = path.join(__dirname, '../shared/logo-1000x1000.png');
  if (fs.existsSync(avatarCard)) return avatarCard;

  return null;
}

// Format game times in specific team timezones
function formatGameTime(iso, teamId) {
  const tzConfig = TEAM_TIMEZONES[teamId] || { timeZone: 'America/Toronto', abbr: 'ET' };
  if (iso) {
    const dt = new Date(iso);
    if (!isNaN(dt.getTime())) {
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: tzConfig.timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(dt);
      return `${formatted} ${tzConfig.abbr}`;
    }
  }
  return `7:00 PM ${tzConfig.abbr}`;
}

function formatGameTimeFr(iso, teamId = 'MTL') {
  const tzConfig = TEAM_TIMEZONES[teamId] || { timeZone: 'America/Toronto', abbrFr: 'HE' };
  const abbr = tzConfig.abbrFr || 'HE';
  if (iso) {
    const dt = new Date(iso);
    if (!isNaN(dt.getTime())) {
      const parts = new Intl.DateTimeFormat('fr-CA', {
        timeZone: tzConfig.timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      }).formatToParts(dt);
      const hour = parts.find(p => p.type === 'hour')?.value || '19';
      const minute = parts.find(p => p.type === 'minute')?.value || '00';
      return `${hour} h ${minute} ${abbr}`;
    }
  }
  return `19 h 00 ${abbr}`;
}

function getMatchupTimeString(game, homeId, awayId) {
  const homeTime = formatGameTime(game.iso, homeId);
  const homeTz = TEAM_TIMEZONES[homeId] || { abbr: 'ET' };
  const awayTz = TEAM_TIMEZONES[awayId] || { abbr: 'ET' };
  const homeIsCanadian = Boolean(CANADIAN_TEAMS[homeId]);
  const awayIsCanadian = Boolean(CANADIAN_TEAMS[awayId]);

  if (homeTz.abbr === awayTz.abbr) {
    return homeTime;
  }
  const awayTime = formatGameTime(game.iso, awayId);
  if (homeIsCanadian && awayIsCanadian) {
    return `${homeTime} / ${awayTime}`;
  }
  if (!homeIsCanadian && awayIsCanadian) {
    return `${homeTime} / ${awayTime}`;
  }
  return homeTime;
}

// Compose Main Account Copy
function composeMainPost(game, homeId, awayId, gameUrl) {
  const homeCity = ALL_CITIES[homeId] || homeId;
  const awayCity = ALL_CITIES[awayId] || awayId;
  const timeStr = getMatchupTimeString(game, homeId, awayId);
  const isPrime = game.typeEN === 'prime_wednesday' || game.netEN === 'Prime Video';
  const isSnExclusive = game.netEN === 'SN+' || (game.netEN && game.netEN.includes('SN+') && game.typeEN === 'national');
  const isNational = game.typeEN === 'national' && !isSnExclusive;

  const canadianTeams = [];
  if (CANADIAN_TEAMS[homeId]) canadianTeams.push(CANADIAN_TEAMS[homeId]);
  if (CANADIAN_TEAMS[awayId]) canadianTeams.push(CANADIAN_TEAMS[awayId]);
  const primaryTeam = canadianTeams[0] || CANADIAN_TEAMS['TOR'];

  let scenarioLine = '';
  let blackoutSummary = '';

  if (isPrime) {
    scenarioLine = `Streams exclusively on Amazon Prime Video in Canada. Coast-to-coast broadcast with zero regional blackouts.`;
    blackoutSummary = `Amazon Prime Video national broadcast. No regional blackouts across Canada.`;
  } else if (isSnExclusive) {
    scenarioLine = `Tonight is a Monday Night Sportsnet+ streaming exclusive. Streams on the Sportsnet app across Canada (not on linear cable). No blackouts.`;
    blackoutSummary = `Sportsnet+ streaming exclusive. No linear cable broadcast; no regional blackouts.`;
  } else if (isNational) {
    const nets = [game.netEN || 'Sportsnet'];
    if (game.netFR && game.netFR !== 'None') nets.push(game.netFR);
    scenarioLine = `Televised nationally on ${nets.join(' & ')}. Zero regional blackouts from coast to coast.`;
    blackoutSummary = `National broadcast on ${nets.join(' / ')}. Available across all Canadian provinces with zero blackouts.`;
  } else {
    const nets = [game.netEN || 'Sportsnet'];
    if (game.netFR && game.netFR !== 'None') nets.push(game.netFR);
    scenarioLine = `Televised on ${nets.join(' & ')}. In-market inside ${primaryTeam.territoryShort}. Blacked out across the rest of Canada on standard packages.`;
    blackoutSummary = `Regional broadcast on ${nets.join(' / ')}. In-market inside ${primaryTeam.territory}; blacked out across the rest of Canada on standard cable.`;
  }

  const tags = canadianTeams.map(t => t.hashtag);
  tags.push('#NHL');
  const tagLine = [...new Set(tags)].join(' ');

  const text = `🏒 Game Day: ${awayCity} at ${homeCity} (${timeStr})\n\n${scenarioLine}\n\nBroadcast Guide: ${gameUrl}\n\n${tagLine}`;
  const altText = `Broadcast verdict for ${awayCity} vs ${homeCity} on ${game.date}. ${blackoutSummary}`;

  return { text, altText };
}

// Compose Team-Specific Account Copy
function composeTeamPost(teamKey, game, homeId, awayId, gameUrl) {
  const team = CANADIAN_TEAMS[teamKey];
  const isHome = homeId === teamKey;
  const oppId = isHome ? awayId : homeId;
  const oppCity = ALL_CITIES[oppId] || oppId;
  const timeStr = formatGameTime(game.iso, teamKey);
  const isPrime = game.typeEN === 'prime_wednesday' || game.netEN === 'Prime Video';
  const isSnExclusive = game.netEN === 'SN+' || (game.netEN && game.netEN.includes('SN+') && game.typeEN === 'national');
  const isNational = game.typeEN === 'national' && !isSnExclusive;

  let broadcastDetail = '';
  if (isPrime) {
    broadcastDetail = `Streams exclusively on Prime Video in Canada. Available coast-to-coast with zero blackouts.`;
  } else if (isSnExclusive) {
    broadcastDetail = `Sportsnet+ app streaming exclusive tonight. Streams nationwide in Canada (not on linear TV).`;
  } else if (isNational) {
    const nets = [game.netEN || 'Sportsnet'];
    if (game.netFR && game.netFR !== 'None') nets.push(game.netFR);
    broadcastDetail = `Televised nationally on ${nets.join(' & ')} across Canada with zero blackouts.`;
  } else {
    const nets = [game.netEN || 'Sportsnet'];
    if (game.netFR && game.netFR !== 'None') nets.push(game.netFR);
    broadcastDetail = `Televised on ${nets.join(' & ')}. In-market in ${team.territoryShort}; blacked out elsewhere in Canada on standard cable & streams.`;
  }

  const vsText = isHome ? `vs ${oppCity}` : `@ ${oppCity}`;
  const text = `🏒 Game Day: ${team.nickname} ${vsText} (${timeStr})\n\n${broadcastDetail}\n\nBlackout Guide: ${gameUrl}\n\n${team.hashtag} #NHL`;
  const altText = `${team.name} broadcast and blackout guide for ${game.date}. ${broadcastDetail}`;

  return { text, altText };
}

// Compose French Montreal Copy
function composeFrenchPost(game, homeId, awayId, gameUrl) {
  const isHome = homeId === 'MTL';
  const oppId = isHome ? awayId : homeId;
  const oppCity = ALL_CITIES[oppId] || oppId;
  const isPrime = game.typeEN === 'prime_wednesday' || game.netEN === 'Prime Video';
  const isNational = game.typeEN === 'national';
  const timeFr = formatGameTimeFr(game.iso, 'MTL');

  let broadcastFr = '';
  if (isPrime) {
    broadcastFr = `Diffusé exclusivement sur Amazon Prime Video. Aucune restriction de blackout au Canada.`;
  } else if (isNational) {
    const net = game.netFR && game.netFR !== 'None' ? game.netFR : (game.netEN || 'TVA Sports');
    broadcastFr = `Diffusé à l'échelle nationale sur ${net}. Disponible partout au pays sans blackout régional.`;
  } else {
    const net = game.netFR && game.netFR !== 'None' ? game.netFR : 'RDS';
    broadcastFr = `En direct sur ${net}. In-market au Québec et dans l'Est; blackout ailleurs au Canada sur le câble de base.`;
  }

  const matchTitle = isHome ? `c. ${oppCity}` : `@ ${oppCity}`;
  const text = `🏒 Jour de match : Canadiens ${matchTitle} (${timeFr})\n\n${broadcastFr}\n\nGuide télé & blackouts : ${gameUrl}\n\n#GoHabsGo #LNH`;
  const altText = `Guide de diffusion et règles de blackout pour les Canadiens de Montréal le ${game.date}. ${broadcastFr}`;

  return { text, altText };
}

async function main() {
  console.log('🏒 HockeyBlackouts.ca - Bluesky Game-Day Publisher');
  const today = getTodayIsoDate();
  console.log(`Checking Canadian NHL schedule for today: ${today} (America/Toronto)...`);

  // Load schedule from data/*.json
  const activeGames = new Map();
  ['tor', 'mtl', 'ott', 'van', 'cgy', 'edm', 'wpg'].forEach(teamCode => {
    const dataPath = path.join(__dirname, `../data/${teamCode}.json`);
    if (!fs.existsSync(dataPath)) return;
    const teamData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    teamData.schedule.forEach(g => {
      if (g.iso.startsWith(today)) {
        const isHome = g.vs.startsWith('vs ');
        const homeId = isHome ? teamData.team.id : g.opp;
        const awayId = isHome ? g.opp : teamData.team.id;
        const matchKey = `${today}_${homeId}_${awayId}`;
        if (!activeGames.has(matchKey)) {
          activeGames.set(matchKey, {
            game: g,
            homeId,
            awayId,
            primaryTeamCode: teamCode
          });
        }
      }
    });
  });

  if (activeGames.size === 0) {
    console.log(`ℹ️ No Canadian NHL games scheduled for today (${today}). Nothing to post.`);
    return;
  }

  console.log(`Found ${activeGames.size} game(s) involving Canadian teams today.\n`);

  // Accounts configuration
  const masterIdentifier = process.env.BSKY_MAIN_IDENTIFIER;
  const masterPassword = process.env.BSKY_MAIN_PASSWORD;

  const discordWebhook = process.env.CONCIERGE_WEBHOOK_URL;
  const discordEmbeds = [];

  const postTasks = [];

  activeGames.forEach(({ game, homeId, awayId, primaryTeamCode }) => {
    const homeCity = ALL_CITIES[homeId] || homeId;
    const awayCity = ALL_CITIES[awayId] || awayId;
    const homeSlug = slugify(homeCity);
    const awaySlug = slugify(awayCity);
    const gameUrl = `https://hockeyblackouts.ca/game/${today}/${homeSlug}-vs-${awaySlug}/`;
    const cardImagePath = resolveCardImage(today, homeSlug, awaySlug, CANADIAN_TEAMS[primaryTeamCode]?.slug || 'toronto');

    const campaign = (game.netEN === 'SN+' && game.typeEN === 'national') ? 'sn_exclusive' : 'blackout_guide';

    // 1. Master Account Post
    const mainUtmUrl = buildUtmUrl(gameUrl, campaign, 'post_link');
    const mainPost = composeMainPost(game, homeId, awayId, gameUrl);
    postTasks.push({
      accountName: 'Master (@hockeyblackouts.ca)',
      identifier: masterIdentifier,
      password: masterPassword,
      text: mainPost.text,
      altText: mainPost.altText,
      cardImagePath,
      gameTitle: `${awayCity} @ ${homeCity}`,
      linkMap: { [gameUrl]: mainUtmUrl }
    });

    // 2. Team Accounts (e.g. TOR, MTL)
    [homeId, awayId].forEach(teamId => {
      const teamCfg = CANADIAN_TEAMS[teamId];
      if (!teamCfg) return;

      const teamIdent = process.env[`${teamCfg.accountPrefix}_IDENTIFIER`];
      const teamPass = process.env[`${teamCfg.accountPrefix}_PASSWORD`];
      if (teamIdent && teamPass) {
        const teamUtmUrl = buildUtmUrl(gameUrl, campaign, `${teamCfg.slug}_post`);
        const teamPost = composeTeamPost(teamId, game, homeId, awayId, gameUrl);
        postTasks.push({
          accountName: `Team ${teamId} (@${teamIdent})`,
          identifier: teamIdent,
          password: teamPass,
          text: teamPost.text,
          altText: teamPost.altText,
          cardImagePath,
          gameTitle: `${awayCity} @ ${homeCity} (${teamId})`,
          linkMap: { [gameUrl]: teamUtmUrl }
        });
      }

      // French Account for Montreal
      if (teamId === 'MTL') {
        const frIdent = process.env.BSKY_FR_IDENTIFIER;
        const frPass = process.env.BSKY_FR_PASSWORD;
        if (frIdent && frPass) {
          const frUtmUrl = buildUtmUrl(gameUrl, campaign, 'montreal_fr_post');
          const frPost = composeFrenchPost(game, homeId, awayId, gameUrl);
          postTasks.push({
            accountName: `French MTL (@${frIdent})`,
            identifier: frIdent,
            password: frPass,
            text: frPost.text,
            altText: frPost.altText,
            cardImagePath,
            gameTitle: `${awayCity} @ ${homeCity} (FR)`,
            linkMap: { [gameUrl]: frUtmUrl }
          });
        }
      }
    });
  });

  console.log(`Prepared ${postTasks.length} publication task(s):\n`);

  for (const task of postTasks) {
    const graphemeCount = getGraphemeCount(task.text);
    const facets = extractFacets(task.text, task.linkMap);

    console.log(`------------------------------------------------------------`);
    console.log(`Target: ${task.accountName}`);
    console.log(`Game:   ${task.gameTitle}`);
    console.log(`Length: ${graphemeCount} graphemes (Limit < 280)`);
    console.log(`Image:  ${task.cardImagePath || 'None'}`);
    console.log(`Facets: ${facets.length} rich text facets detected`);
    console.log(`\nContent:\n${task.text}`);
    console.log(`\nAlt Text:\n${task.altText}`);
    console.log(`------------------------------------------------------------\n`);

    if (graphemeCount > 280) {
      console.error(`❌ Post exceeds 280 graphemes (${graphemeCount}). Aborting.`);
      process.exit(1);
    }

    if (isDryRun) {
      console.log(`[DRY RUN] Skipping network calls for ${task.accountName}.\n`);
      discordEmbeds.push({
        title: `[DRY RUN] ${task.gameTitle} → ${task.accountName}`,
        description: task.text,
        color: 3447003,
        footer: { text: `HockeyBlackouts.ca • ${graphemeCount} graphemes` },
        timestamp: new Date().toISOString()
      });
      continue;
    }

    if (!task.identifier || !task.password) {
      console.warn(`⚠️ Missing credentials for ${task.accountName}. Skipping.`);
      continue;
    }

    try {
      console.log(`Authenticating with Bluesky as ${task.identifier}...`);
      const session = await createSession(task.identifier, task.password);

      let embed = undefined;
      if (task.cardImagePath && fs.existsSync(task.cardImagePath)) {
        console.log(`Uploading card image ${task.cardImagePath}...`);
        const imgBuffer = fs.readFileSync(task.cardImagePath);
        const blob = await uploadBlob(session.accessJwt, imgBuffer, 'image/png');
        embed = {
          $type: 'app.bsky.embed.images',
          images: [{
            alt: task.altText,
            image: blob
          }]
        };
      }

      console.log(`Publishing post to ${session.handle} (${session.did})...`);
      const result = await createPostRecord(session.accessJwt, session.did, {
        text: task.text,
        facets,
        embed
      });
      console.log(`✅ Published! URI: ${result.uri}\n`);

      discordEmbeds.push({
        title: `✅ Published: ${task.gameTitle} → ${task.accountName}`,
        description: `${task.text}\n\n**Post URI:** \`${result.uri}\``,
        color: 5763719,
        footer: { text: `HockeyBlackouts.ca • ${graphemeCount} graphemes` },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(`❌ Error publishing to ${task.accountName}:`, err.message);
      discordEmbeds.push({
        title: `❌ Failed: ${task.gameTitle} → ${task.accountName}`,
        description: `Error: ${err.message}`,
        color: 15548997,
        footer: { text: 'HockeyBlackouts.ca Error' },
        timestamp: new Date().toISOString()
      });
    }
  }

  if (discordWebhook && discordEmbeds.length > 0) {
    console.log(`Sending summary of ${discordEmbeds.length} item(s) to Discord webhook...`);
    await sendDiscordNotification(discordWebhook, discordEmbeds);
  }

  console.log('🏁 Bluesky game-day publishing process complete.');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal publisher error:', err);
    process.exit(1);
  });
}

module.exports = {
  CANADIAN_TEAMS,
  TEAM_TIMEZONES,
  formatGameTime,
  formatGameTimeFr,
  getMatchupTimeString,
  extractFacets,
  getGraphemeCount,
  composeMainPost,
  composeTeamPost,
  composeFrenchPost
};
