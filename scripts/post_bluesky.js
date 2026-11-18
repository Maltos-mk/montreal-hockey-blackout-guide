#!/usr/bin/env node

/**
 * scripts/post_bluesky.js
 *
 * Automated Bluesky Game-Day Publisher for HockeyBlackouts.ca & HockeyBlackouts.com
 * - Direct AT Protocol XRPC calls (zero npm dependencies)
 * - Targets Canadian Master account (BSKY_MAIN_IDENTIFIER), optional CA team accounts,
 *   and US Master account (BSKY_US_IDENTIFIER / BSKY_US_PASSWORD)
 * - Embeds 1200x630 verdict card PNG with accurate alt text
 * - Accurate UTF-8 byte-offset richtext facets for links and hashtags
 * - Strict grapheme limit (< 280 graphemes)
 * - Supports --dry-run and optional Discord notification via CONCIERGE_WEBHOOK_URL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  TEAM_TIMEZONES,
  formatEtDate,
  getPrimaryCanadianTeamId,
  formatTeamGameTime
} = require('./lib/date_utils');

const BSKY_SERVICE = 'https://bsky.social';
const isDryRun = process.argv.includes('--dry-run');
const isForce = process.argv.includes('--force');

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

function getGameLocalDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
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

// Check public Bluesky feed to prevent duplicate posts for the same game
async function hasAlreadyPostedGame(actor, targetUrl, today = null, matchupText = null) {
  if (!actor || !targetUrl) return false;
  try {
    const cleanUrl = targetUrl.split('?')[0];
    const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(actor)}&limit=50`);
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.feed || !Array.isArray(data.feed)) return false;
    return data.feed.some(item => {
      const record = item.post?.record;
      if (!record) return false;
      const embedUri = record.embed?.external?.uri || '';
      const text = record.text || '';
      const matchesUrl = embedUri.includes(cleanUrl) || text.includes(cleanUrl);
      if (!matchesUrl) return false;
      if (today) {
        const recordDate = getGameLocalDate(record.createdAt);
        if (recordDate && recordDate !== today) return false;
      }
      if (matchupText && !text.includes(matchupText)) {
        return false;
      }
      return true;
    });
  } catch (e) {
    return false;
  }
}

// Discord Webhook Notification (chunked to respect Discord's 10-embed-per-message limit)
async function sendDiscordNotification(webhookUrl, embeds = []) {
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
        console.log(`✅ Discord notification batch (${batch.length} embed(s)) sent successfully.`);
      }
    } catch (err) {
      console.warn('[Discord Webhook Error]:', err.message);
    }
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

// Resolve US card image from build_com/og/ (team pages only, no game pages on .com)
function resolveUsCardImage(teamSlug) {
  if (teamSlug) {
    const teamCard = path.join(__dirname, `../build_com/og/teams/${teamSlug}.png`);
    if (fs.existsSync(teamCard)) return teamCard;
  }

  const defaultCard = path.join(__dirname, '../build_com/og/default.png');
  if (fs.existsSync(defaultCard)) return defaultCard;

  const avatarCard = path.join(__dirname, '../shared/logo-1000x1000.png');
  if (fs.existsSync(avatarCard)) return avatarCard;

  return null;
}

// Format game times in specific team timezones
const formatGameTime = formatTeamGameTime;

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
    scenarioLine = `Sportsnet+ streaming exclusive in Canada (not on linear cable). Available nationwide with zero blackouts.`;
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

  let text = `🏒 Game Day: ${awayCity} at ${homeCity} (${timeStr})\n\n${scenarioLine}\n\nBroadcast Guide: ${gameUrl}\n\n${tagLine}`;
  if (getGraphemeCount(text) > 290) {
    const compactScenario = scenarioLine
      .replace('Blacked out across the rest of Canada on standard packages.', 'Blacked out elsewhere in Canada.')
      .replace('Zero regional blackouts from coast to coast.', 'No regional blackouts in Canada.');
    text = `🏒 Game Day: ${awayCity} at ${homeCity} (${timeStr})\n\n${compactScenario}\n\nBroadcast Guide: ${gameUrl}\n\n${tagLine}`;
  }
  const altText = `Broadcast verdict for ${awayCity} vs ${homeCity} on ${game.date}. ${blackoutSummary}`;
  const cardTitle = `${awayCity} vs. ${homeCity} — TV & Blackout Status`;
  const cardDescription = `${blackoutSummary} Check Canadian regional channels and streaming options.`;

  return { text, altText, cardTitle, cardDescription };
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
  const cardTitle = `${team.name} vs. ${oppCity} — Blackout Guide`;
  const cardDescription = `${broadcastDetail} Check regional channels and streaming options.`;

  return { text, altText, cardTitle, cardDescription };
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
  const cardTitle = `Canadiens de Montréal ${matchTitle} — Guide télé`;
  const cardDescription = `${broadcastFr} Vérifiez vos chaînes et restrictions régionales.`;

  return { text, altText, cardTitle, cardDescription };
}

// Compose US Account Copy (hockeyblackouts.com — ESPN+, TNT, ABC, NHLN & US RSNs)
function composeUsPost(game, homeId, awayId, usUrl, homeTeam, awayTeam) {
  const homeCity = ALL_CITIES[homeId] || homeId;
  const awayCity = ALL_CITIES[awayId] || awayId;
  const timeStr = formatGameTime(game.iso, homeId);
  const netNat = game.netUSNat || game.primaryNet || '';
  const isEspnPlusExclusive = game.typeUS === 'national' && netNat === 'ESPN+';
  const isNational = game.typeUS === 'national' && !isEspnPlusExclusive;
  const isNhlNetwork = game.typeUS === 'nhl_network' || netNat === 'NHLN';

  const usRsns = [];
  if (homeTeam && homeTeam.country === 'US' && homeTeam.rsn) usRsns.push(homeTeam.rsn);
  if (awayTeam && awayTeam.country === 'US' && awayTeam.rsn && !usRsns.includes(awayTeam.rsn)) {
    usRsns.push(awayTeam.rsn);
  }
  if (usRsns.length === 0 && game.rsn && game.rsn !== 'ESPN+' && game.rsn !== 'ESPN+ (Out-of-Market)') {
    usRsns.push(game.rsn);
  }

  let scenarioLine = '';
  let blackoutSummary = '';

  if (isEspnPlusExclusive) {
    scenarioLine = `Streams exclusively on ESPN+ / Hulu across the US. Zero local RSN blackouts.`;
    blackoutSummary = `US national streaming exclusive on ESPN+ / Hulu. No local RSN blackouts.`;
  } else if (isNational) {
    const tvNet = netNat || 'ESPN';
    scenarioLine = `US national TV exclusive on ${tvNet}. Blacked out on ESPN+ and local RSNs.`;
    blackoutSummary = `National TV exclusive on ${tvNet}. Blacked out on ESPN+ & local RSNs.`;
  } else if (isNhlNetwork) {
    const rsnText = usRsns.length > 0 ? ` & ${usRsns.join(' / ')} in-market` : '';
    scenarioLine = `Airs on NHL Network${rsnText}. Out-of-market ESPN+ stream is blacked out nationwide.`;
    blackoutSummary = `NHL Network broadcast${rsnText}. Out-of-market ESPN+ stream blacked out.`;
  } else if (usRsns.length > 0) {
    scenarioLine = `Out-of-market on ESPN+. In-market on ${usRsns.join(' & ')} (blacked out on ESPN+ in local ZIPs).`;
    blackoutSummary = `Out-of-market on ESPN+. Local RSN blackout on ${usRsns.join(' / ')}.`;
  } else {
    scenarioLine = `Streams nationwide in the US on ESPN+ with zero local RSN blackouts.`;
    blackoutSummary = `Out-of-market US stream on ESPN+. No local RSN blackouts.`;
  }

  let text = `🏒 Game Day: ${awayCity} at ${homeCity} (${timeStr})\n\n${scenarioLine}\n\nZIP Blackout Guide: ${usUrl}\n\n#NHL`;
  if (getGraphemeCount(text) > 280 && usRsns.length > 1) {
    const shortRsn = homeTeam?.country === 'US' && homeTeam.rsn ? homeTeam.rsn : usRsns[0];
    scenarioLine = isNhlNetwork
      ? `Airs on NHL Network & ${shortRsn}. Out-of-market ESPN+ stream is blacked out nationwide.`
      : `Out-of-market on ESPN+. In-market on ${shortRsn} & local RSN (blacked out on ESPN+ locally).`;
    text = `🏒 Game Day: ${awayCity} at ${homeCity} (${timeStr})\n\n${scenarioLine}\n\nZIP Blackout Guide: ${usUrl}\n\n#NHL`;
  }

  const altText = `US broadcast verdict for ${awayCity} vs ${homeCity} on ${game.date}. ${blackoutSummary}`;
  const cardTitle = `${awayCity} vs. ${homeCity} — US TV & ESPN+ Blackout Guide`;
  const cardDescription = `${blackoutSummary} Check US ZIP code blackouts, ESPN+, TNT, ABC & RSN channels.`;

  return { text, altText, cardTitle, cardDescription };
}

async function main() {
  console.log('🏒 HockeyBlackouts.ca & .com - Bluesky Game-Day Publisher');
  const today = getTodayIsoDate();
  console.log(`Checking NHL schedules for today: ${today} (America/Toronto)...`);

  // Load Canadian schedule from data/*.json
  const activeGames = new Map();
  ['tor', 'mtl', 'ott', 'van', 'cgy', 'edm', 'wpg'].forEach(teamCode => {
    const dataPath = path.join(__dirname, `../data/${teamCode}.json`);
    if (!fs.existsSync(dataPath)) return;
    const teamData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    teamData.schedule.forEach(g => {
      const gameDate = getGameLocalDate(g.iso);
      if (gameDate === today) {
        const isHome = g.vs.startsWith('vs ');
        const homeId = isHome ? teamData.team.id : g.opp;
        const awayId = isHome ? g.opp : teamData.team.id;
        const datePrefix = formatEtDate(g.iso);
        const matchKey = `${datePrefix}_${homeId}_${awayId}`;
        if (!activeGames.has(matchKey)) {
          activeGames.set(matchKey, {
            game: g,
            homeId,
            awayId,
            datePrefix,
            primaryTeamId: getPrimaryCanadianTeamId(homeId, awayId)
          });
        }
      }
    });
  });

  // Load US schedule from build_com/<slug>/data.json (falling back to data/us/<slug>.json)
  const usTeamsPath = path.join(__dirname, '../data/us_teams.json');
  const usTeamsList = fs.existsSync(usTeamsPath) ? JSON.parse(fs.readFileSync(usTeamsPath, 'utf-8')) : [];
  const usTeamsById = Object.fromEntries(usTeamsList.map(t => [t.id, t]));
  const usActiveGames = new Map();

  usTeamsList.forEach(teamMeta => {
    const buildComDataPath = path.join(__dirname, `../build_com/${teamMeta.slug}/data.json`);
    const fallbackDataPath = path.join(__dirname, `../data/us/${teamMeta.slug}.json`);
    const dataPath = fs.existsSync(buildComDataPath) ? buildComDataPath : fallbackDataPath;
    if (!fs.existsSync(dataPath)) return;
    const teamData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    teamData.schedule.forEach(g => {
      const gameDate = getGameLocalDate(g.iso);
      if (gameDate === today) {
        const isHome = g.vs.startsWith('vs ');
        const homeId = isHome ? teamData.team.id : g.opp;
        const awayId = isHome ? g.opp : teamData.team.id;
        const datePrefix = formatEtDate(g.iso);
        const matchKey = `${datePrefix}_${homeId}_${awayId}`;
        if (!usActiveGames.has(matchKey)) {
          usActiveGames.set(matchKey, {
            game: g,
            homeId,
            awayId,
            datePrefix,
            homeTeam: usTeamsById[homeId] || null,
            awayTeam: usTeamsById[awayId] || null
          });
        }
      }
    });
  });

  if (activeGames.size === 0 && usActiveGames.size === 0) {
    console.log(`ℹ️ No NHL games scheduled for today (${today}). Nothing to post.`);
    return;
  }

  console.log(`Found ${activeGames.size} Canadian-interest game(s) and ${usActiveGames.size} US-slate game(s) today.\n`);

  // Accounts configuration
  const masterIdentifier = process.env.BSKY_MAIN_IDENTIFIER;
  const masterPassword = process.env.BSKY_MAIN_PASSWORD;
  const usIdentifier = process.env.BSKY_US_IDENTIFIER || 'hockeyblackouts.com';
  const usPassword = process.env.BSKY_US_PASSWORD;

  const discordWebhook = process.env.CONCIERGE_WEBHOOK_URL;
  const discordEmbeds = [];

  const postTasks = [];

  activeGames.forEach(({ game, homeId, awayId, datePrefix, primaryTeamId }) => {
    const homeCity = ALL_CITIES[homeId] || homeId;
    const awayCity = ALL_CITIES[awayId] || awayId;
    const homeSlug = slugify(homeCity);
    const awaySlug = slugify(awayCity);
    const gameUrl = `https://hockeyblackouts.ca/game/${datePrefix}/${homeSlug}-vs-${awaySlug}/`;
    const cardImagePath = resolveCardImage(datePrefix, homeSlug, awaySlug, CANADIAN_TEAMS[primaryTeamId]?.slug || 'toronto');

    const campaign = (game.netEN === 'SN+' && game.typeEN === 'national') ? 'sn_exclusive' : 'blackout_guide';

    // 1. Canadian Master Account Post
    const mainUtmUrl = buildUtmUrl(gameUrl, campaign, 'post_link');
    const mainPost = composeMainPost(game, homeId, awayId, gameUrl);
    postTasks.push({
      siteLabel: '.ca',
      accountName: 'Master (@hockeyblackouts.ca)',
      identifier: masterIdentifier,
      password: masterPassword,
      text: mainPost.text,
      cardTitle: mainPost.cardTitle,
      cardDescription: mainPost.cardDescription,
      targetUrl: mainUtmUrl,
      cardImagePath,
      gameTitle: `${awayCity} @ ${homeCity}`,
      linkMap: { [gameUrl]: mainUtmUrl }
    });

    // 2. Canadian Team Accounts (e.g. TOR, MTL)
    [homeId, awayId].forEach(teamId => {
      const teamCfg = CANADIAN_TEAMS[teamId];
      if (!teamCfg) return;

      const teamIdent = process.env[`${teamCfg.accountPrefix}_IDENTIFIER`];
      const teamPass = process.env[`${teamCfg.accountPrefix}_PASSWORD`];
      if (teamIdent && teamPass) {
        const teamUtmUrl = buildUtmUrl(gameUrl, campaign, `${teamCfg.slug}_post`);
        const teamPost = composeTeamPost(teamId, game, homeId, awayId, gameUrl);
        postTasks.push({
          siteLabel: '.ca',
          accountName: `Team ${teamId} (@${teamIdent})`,
          identifier: teamIdent,
          password: teamPass,
          text: teamPost.text,
          cardTitle: teamPost.cardTitle,
          cardDescription: teamPost.cardDescription,
          targetUrl: teamUtmUrl,
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
            siteLabel: '.ca',
            accountName: `French MTL (@${frIdent})`,
            identifier: frIdent,
            password: frPass,
            text: frPost.text,
            cardTitle: frPost.cardTitle,
            cardDescription: frPost.cardDescription,
            targetUrl: frUtmUrl,
            cardImagePath,
            gameTitle: `${awayCity} @ ${homeCity} (FR)`,
            linkMap: { [gameUrl]: frUtmUrl }
          });
        }
      }
    });
  });

  // 3. US Master Account Posts (.com has team pages only, no individual game pages)
  usActiveGames.forEach(({ game, homeId, awayId, homeTeam, awayTeam }) => {
    const homeCity = ALL_CITIES[homeId] || homeId;
    const awayCity = ALL_CITIES[awayId] || awayId;
    const targetSlug = homeTeam?.slug || awayTeam?.slug || '';
    const usBaseUrl = targetSlug ? `https://hockeyblackouts.com/${targetSlug}/` : 'https://hockeyblackouts.com/';
    const usUtmUrl = buildUtmUrl(usBaseUrl, 'blackout_guide', 'post_link');
    const cardImagePath = resolveUsCardImage(targetSlug);
    const usPost = composeUsPost(game, homeId, awayId, usBaseUrl, homeTeam, awayTeam);

    postTasks.push({
      siteLabel: '.com',
      accountName: `US Master (@${usIdentifier})`,
      identifier: usIdentifier,
      password: usPassword,
      text: usPost.text,
      cardTitle: usPost.cardTitle,
      cardDescription: usPost.cardDescription,
      targetUrl: usUtmUrl,
      cardImagePath,
      gameTitle: `${awayCity} @ ${homeCity}`,
      linkMap: { [usBaseUrl]: usUtmUrl },
      dedupeByDateAndMatchup: true,
      matchupText: `${awayCity} at ${homeCity}`
    });
  });

  console.log(`Prepared ${postTasks.length} publication task(s):\n`);

  let postedCount = 0;
  let skippedCount = 0;

  for (const task of postTasks) {
    const graphemeCount = getGraphemeCount(task.text);
    const facets = extractFacets(task.text, task.linkMap);

    console.log(`------------------------------------------------------------`);
    console.log(`Site:   ${task.siteLabel}`);
    console.log(`Target: ${task.accountName}`);
    console.log(`Game:   ${task.gameTitle}`);
    console.log(`Length: ${graphemeCount} graphemes (Limit <= 300)`);
    console.log(`Card:   "${task.cardTitle}"`);
    console.log(`Desc:   "${task.cardDescription}"`);
    console.log(`URI:    ${task.targetUrl}`);
    console.log(`Thumb:  ${task.cardImagePath || 'None'}`);
    console.log(`Facets: ${facets.length} rich text facets detected`);
    console.log(`\nContent:\n${task.text}`);
    console.log(`------------------------------------------------------------\n`);

    if (graphemeCount > 300) {
      console.error(`❌ Post exceeds 300 graphemes (${graphemeCount}). Skipping ${task.accountName} for ${task.gameTitle}.`);
      discordEmbeds.push({
        title: `❌ Skipped [${task.siteLabel}]: ${task.gameTitle} → ${task.accountName}`,
        description: `Post exceeded Bluesky's 300-grapheme limit (${graphemeCount} graphemes).`,
        color: 15548997,
        footer: { text: `HockeyBlackouts${task.siteLabel} Error` },
        timestamp: new Date().toISOString()
      });
      continue;
    }

    if (!isForce && task.identifier) {
      const alreadyPosted = await hasAlreadyPostedGame(
        task.identifier,
        task.targetUrl,
        task.dedupeByDateAndMatchup ? today : null,
        task.matchupText || null
      );
      if (alreadyPosted) {
        console.log(`⏩ [ALREADY POSTED] Skipping duplicate post on ${task.accountName} for ${task.gameTitle} (${task.targetUrl.split('?')[0]})\n`);
        skippedCount++;
        continue;
      }
    }

    if (isDryRun) {
      console.log(`[DRY RUN] Skipping network calls for ${task.accountName}.\n`);
      discordEmbeds.push({
        title: `[DRY RUN] [${task.siteLabel}] ${task.gameTitle} → ${task.accountName}`,
        description: `${task.text}\n\n**External Link Card:** [${task.cardTitle}](${task.targetUrl})\n${task.cardDescription}`,
        color: task.siteLabel === '.com' ? 2123412 : 3447003,
        footer: { text: `HockeyBlackouts${task.siteLabel} • ${graphemeCount} graphemes` },
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
      let thumb = undefined;
      if (task.cardImagePath && fs.existsSync(task.cardImagePath)) {
        console.log(`Uploading card image ${task.cardImagePath}...`);
        const imgBuffer = fs.readFileSync(task.cardImagePath);
        thumb = await uploadBlob(session.accessJwt, imgBuffer, 'image/png');
      }

      embed = {
        $type: 'app.bsky.embed.external',
        external: {
          uri: task.targetUrl,
          title: task.cardTitle,
          description: task.cardDescription,
          ...(thumb ? { thumb } : {})
        }
      };

      console.log(`Publishing post with external link card to ${session.handle} (${session.did})...`);
      const result = await createPostRecord(session.accessJwt, session.did, {
        text: task.text,
        facets,
        embed
      });
      console.log(`✅ Published! URI: ${result.uri}\n`);
      postedCount++;

      discordEmbeds.push({
        title: `✅ Published [${task.siteLabel}]: ${task.gameTitle} → ${task.accountName}`,
        description: `${task.text}\n\n**External Link Card:** [${task.cardTitle}](${task.targetUrl})\n**Post URI:** \`${result.uri}\``,
        color: 5763719,
        footer: { text: `HockeyBlackouts${task.siteLabel} • ${graphemeCount} graphemes` },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(`❌ Error publishing to ${task.accountName}:`, err.message);
      discordEmbeds.push({
        title: `❌ Failed [${task.siteLabel}]: ${task.gameTitle} → ${task.accountName}`,
        description: `Error: ${err.message}`,
        color: 15548997,
        footer: { text: `HockeyBlackouts${task.siteLabel} Error` },
        timestamp: new Date().toISOString()
      });
    }
  }

  if (skippedCount > 0 && postedCount === 0) {
    console.log(`ℹ️ All scheduled posts for today have already been published. No action needed.`);
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
  composeFrenchPost,
  composeUsPost,
  resolveUsCardImage,
  hasAlreadyPostedGame
};
