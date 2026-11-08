#!/usr/bin/env node

/**
 * scripts/bluesky_concierge_radar.js
 *
 * Semi-Automated "Helpful Concierge" Radar for HockeyBlackouts.ca
 * - Searches Bluesky for Canadian hockey fans experiencing broadcast blackouts
 * - Filters out reposts, self-handles, and posts older than 90 minutes
 * - Classifies into Categories A, B, C, D and detects Canadian team context
 * - Generates context-aware, helpful replies (< 270 characters)
 * - Sends embeds to Discord webhook (CONCIERGE_WEBHOOK_URL) and GitHub Step Summary
 */

const fs = require('fs');
const path = require('path');

const BSKY_SERVICE = 'https://bsky.social';
const isDryRun = process.argv.includes('--dry-run');

// 90 minutes search window
const LOOKBACK_MINUTES = 90;
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

const SEARCH_CATEGORIES = [
  {
    id: 'A',
    name: 'Regional Blackout (TSN / Sportsnet)',
    query: '("blacked out" OR "blackout") (TSN OR TSN2 OR TSN3 OR TSN4 OR TSN5 OR Sportsnet OR RDS OR Leafs OR Habs OR Sens OR Canucks OR Oilers OR Flames OR Jets)',
    defaultUrl: 'https://hockeyblackouts.ca/tsn-hockey-blackout-rules/'
  },
  {
    id: 'B',
    name: 'Cable vs. Sportsnet+ / Monday Exclusive',
    query: '("Sportsnet+" OR "Sportsnet Plus" OR "Monday") (cable OR Bell OR Telus OR channel OR blackout)',
    defaultUrl: 'https://hockeyblackouts.ca/sportsnet-plus-blackout-rules/'
  },
  {
    id: 'C',
    name: 'Amazon Prime Video Hockey Exclusive',
    query: '(Prime OR Amazon) (Leafs OR Habs OR Sens OR Canucks OR Oilers OR Flames OR Jets OR hockey)',
    defaultUrl: 'https://hockeyblackouts.ca/prime-hockey-schedule-canada/'
  },
  {
    id: 'D',
    name: 'IP Geolocation & ISP Technical Glitch',
    query: '("in market" OR "live in" OR Starlink OR Bell OR Rogers) ("blacked out" OR region OR location) (Sportsnet OR TSN)',
    defaultUrl: 'https://hockeyblackouts.ca/how-blackouts-work/'
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
    const game = data.schedule.find(g => g.iso && g.iso.startsWith(today));
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

    return {
      game,
      url: `https://hockeyblackouts.ca/game/${today}/${homeSlug}-vs-${awaySlug}/`,
      homeCity,
      awayCity
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
  let detectedTeam = null;
  for (const team of CANADIAN_TEAMS) {
    if (team.keywords.test(postText)) {
      detectedTeam = team;
      break;
    }
  }

  const todayGame = detectedTeam ? findTodayGameForTeam(detectedTeam.id) : null;

  let replyText = '';

  if (category.id === 'A') {
    if (todayGame) {
      replyText = `Regional games on TSN/Sportsnet are locked to local broadcast zones on standard cable. Fans outside ${detectedTeam.territory} are blacked out tonight. Here are your channel & stream options: ${todayGame.url}`;
    } else if (detectedTeam) {
      replyText = `Regional NHL games for the ${detectedTeam.name} are locked to ${detectedTeam.territory} on standard cable/TSN/SN+. Here is a breakdown of regional boundaries in Canada: ${category.defaultUrl}`;
    } else {
      replyText = `Regional NHL games on TSN & Sportsnet are locked to local broadcast zones on standard cable/TSN/SN+ feeds. Here is a breakdown of how regional blackout boundaries work: ${category.defaultUrl}`;
    }
  } else if (category.id === 'B') {
    replyText = `Under the NHL broadcast deal, Monday night games stream exclusively on Sportsnet+ (the app), so they aren't on linear cable channels. Here is a breakdown of how it works: ${category.defaultUrl}`;
  } else if (category.id === 'C') {
    replyText = `Amazon Prime has exclusive Canadian rights to Monday Night Hockey this season, so linear cable doesn't carry it. All Prime subscribers across Canada can stream it here: ${category.defaultUrl}`;
  } else if (category.id === 'D') {
    replyText = `ISP routing (especially Starlink, mobile cellular, or border nodes) often misidentifies your province and triggers false blackouts. You can test your IP with our free tool: ${category.defaultUrl}`;
  }

  return {
    replyText,
    detectedTeam: detectedTeam ? detectedTeam.name : null,
    targetUrl: todayGame ? todayGame.url : category.defaultUrl
  };
}

function getRkeyFromUri(uri) {
  if (!uri) return '';
  return uri.split('/').pop();
}

async function sendDiscordWebhook(webhookUrl, embeds) {
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
      console.log(`✅ Sent ${embeds.length} concierge alert(s) to Discord webhook.`);
    }
  } catch (err) {
    console.warn('[Discord Webhook Error]:', err.message);
  }
}

async function main() {
  console.log('🚨 HockeyBlackouts.ca - Bluesky Concierge Radar');
  console.log(`Scanning Bluesky posts from the last ${LOOKBACK_MINUTES} minutes (since ${sinceIso})...\n`);

  const identifier = process.env.BSKY_MAIN_IDENTIFIER;
  const password = process.env.BSKY_MAIN_PASSWORD;
  const discordWebhook = process.env.CONCIERGE_WEBHOOK_URL;
  const githubStepSummary = process.env.GITHUB_STEP_SUMMARY;

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
      console.log(`Searching Category ${cat.id}: "${cat.name}"...`);
      try {
        const posts = await searchPosts(session.accessJwt, cat.query, 25);
        console.log(`Found ${posts.length} post(s) for Category ${cat.id}.`);

        for (const post of posts) {
          if (!post.uri || seenUris.has(post.uri)) continue;
          seenUris.add(post.uri);

          const authorHandle = post.author?.handle || '';
          // Filter out our own accounts
          if (authorHandle.includes('hockeyblackouts.ca') || authorHandle === identifier) continue;

          // Filter out retweets / quotes
          const text = post.record?.text || '';
          if (text.startsWith('RT ') || text.length < 15) continue;

          // Check post age (< 90 minutes)
          const postDate = new Date(post.record?.createdAt || post.indexedAt).getTime();
          if (now - postDate > LOOKBACK_MINUTES * 60 * 1000) continue;

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
        console.warn(`Error querying Category ${cat.id}: ${err.message}`);
      }
    }
  } else {
    // Simulated dry-run sample when running locally without credentials
    console.log('Executing simulated sample evaluation for dry-run verification...');
    const samplePost = {
      author: { handle: 'leafsfan99.bsky.social' },
      record: {
        text: "Why is the Leafs game blacked out on TSN4 right now?? I pay for TSN and live in Halifax!",
        createdAt: new Date().toISOString()
      },
      uri: 'at://did:plc:sample123/app.bsky.feed.post/3lbtest789'
    };
    const draft = draftReply(SEARCH_CATEGORIES[0], samplePost.record.text);
    matchedPosts.push({
      category: SEARCH_CATEGORIES[0],
      post: samplePost,
      authorHandle: samplePost.author.handle,
      text: samplePost.record.text,
      postUrl: `https://bsky.app/profile/${samplePost.author.handle}/post/3lbtest789`,
      draft,
      createdAt: samplePost.record.createdAt
    });
  }

  console.log(`\n============================================================`);
  console.log(`Radar Scan Results: ${matchedPosts.length} fan pain-point match(es)`);
  console.log(`============================================================\n`);

  const discordEmbeds = [];
  let summaryMarkdown = `## 🏒 Bluesky Concierge Radar Summary\n\n`;
  summaryMarkdown += `Found **${matchedPosts.length}** fan broadcast inquiry/pain-point match(es) in the last ${LOOKBACK_MINUTES} minutes.\n\n`;
  summaryMarkdown += `| Category | Author | Post Excerpt | Suggested Quick Reply | Direct Link |\n`;
  summaryMarkdown += `| :--- | :--- | :--- | :--- | :--- |\n`;

  // Process top 10 matches (Discord embed limit)
  const topMatches = matchedPosts.slice(0, 10);

  topMatches.forEach((item, index) => {
    const cleanPostExcerpt = item.text.replace(/\n+/g, ' ').slice(0, 90) + (item.text.length > 90 ? '...' : '');
    const cleanReply = item.draft.replyText;

    console.log(`[#${index + 1}] Category ${item.category.id}: ${item.category.name}`);
    console.log(`Author: @${item.authorHandle}`);
    console.log(`Post:   "${item.text}"`);
    console.log(`Reply:  "${cleanReply}" (${cleanReply.length} chars)`);
    console.log(`Link:   ${item.postUrl}\n`);

    // Discord Embed
    discordEmbeds.push({
      title: `🚨 Category ${item.category.id}: ${item.category.name}`,
      description: `**Author:** [@${item.authorHandle}](https://bsky.app/profile/${item.authorHandle})\n**Post:** ${item.text}`,
      color: item.category.id === 'A' ? 15548997 : (item.category.id === 'C' ? 3447003 : 15844367),
      fields: [
        {
          name: `Suggested Reply (${cleanReply.length} chars)`,
          value: `\`\`\`\n${cleanReply}\n\`\`\``
        },
        {
          name: 'Quick Action',
          value: `👉 [Open Post on Bluesky](${item.postUrl})`
        }
      ],
      footer: { text: `HockeyBlackouts.ca Concierge • Category ${item.category.id}` },
      timestamp: item.createdAt
    });

    // GitHub Step Summary Row
    summaryMarkdown += `| **${item.category.id}** (${item.draft.detectedTeam || 'General'}) | [@${item.authorHandle}](${item.postUrl}) | ${cleanPostExcerpt} | \`${cleanReply.slice(0, 100)}...\` | [Open Post](${item.postUrl}) |\n`;
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
  draftReply,
  findTodayGameForTeam,
  getRkeyFromUri
};
