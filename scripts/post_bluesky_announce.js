#!/usr/bin/env node

/**
 * scripts/post_bluesky_announce.js
 *
 * Manual one-off Bluesky announcement publisher for @hockeyblackouts.ca and @hockeyblackouts.com.
 * - Resolves @handle mention DIDs and UTF-8 byte-offset facets (links, mentions, hashtags)
 * - Attaches default OG link card image
 * - Supports --dry-run
 */

const fs = require('fs');
const path = require('path');

const BSKY_SERVICE = 'https://bsky.social';
const isDryRun = process.argv.includes('--dry-run');

function getGraphemeCount(str) {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  return Array.from(segmenter.segment(str)).length;
}

async function resolveHandleDid(handle) {
  try {
    const res = await fetch(`${BSKY_SERVICE}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.did || null;
  } catch {
    return null;
  }
}

async function extractFacetsWithMentions(text, linkMap = {}) {
  const facets = [];

  // 1. Links
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
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: targetUri }]
    });
  }

  // 2. Mentions (@handle)
  const mentionRegex = /(?:^|\s)(@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))/g;
  while ((match = mentionRegex.exec(text)) !== null) {
    const fullMention = match[1];
    const handle = match[2];
    const did = await resolveHandleDid(handle);
    if (!did) continue;
    const mentionIndex = match.index + (match[0].length - fullMention.length);
    const prefix = text.slice(0, mentionIndex);
    const byteStart = Buffer.byteLength(prefix, 'utf-8');
    const byteEnd = byteStart + Buffer.byteLength(fullMention, 'utf-8');
    facets.push({
      index: { byteStart, byteEnd },
      features: [{ $type: 'app.bsky.richtext.facet#mention', did }]
    });
  }

  // 3. Hashtags (#Tag)
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
      features: [{ $type: 'app.bsky.richtext.facet#tag', tag }]
    });
  }

  return facets;
}

async function createSession(identifier, password) {
  const res = await fetch(`${BSKY_SERVICE}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  if (!res.ok) {
    throw new Error(`createSession failed for ${identifier}: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function uploadBlob(accessJwt, imageBuffer, mimeType = 'image/png') {
  const res = await fetch(`${BSKY_SERVICE}/xrpc/com.atproto.repo.uploadBlob`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessJwt}`, 'Content-Type': mimeType },
    body: imageBuffer
  });
  if (!res.ok) {
    throw new Error(`uploadBlob failed: ${res.status} ${await res.text()}`);
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
    headers: { 'Authorization': `Bearer ${accessJwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: did, collection: 'app.bsky.feed.post', record })
  });
  if (!res.ok) {
    throw new Error(`createRecord failed for ${did}: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

const POSTS = [
  {
    site: '.ca',
    identifier: process.env.BSKY_MAIN_IDENTIFIER || 'hockeyblackouts.ca',
    password: process.env.BSKY_MAIN_PASSWORD,
    rawUrl: 'https://hockeyblackouts.ca',
    utmUrl: 'https://hockeyblackouts.ca/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=post_link',
    cardTitle: 'HockeyBlackouts.ca — Canadian NHL TV & Blackout Guide',
    cardDescription: 'Check your region & TV/streaming packages (TSN, Sportsnet, SN+, Prime Video) to see which NHL games you can watch tonight.',
    imageCandidates: [
      path.join(__dirname, '../build/og/default.png'),
      path.join(__dirname, '../shared/logo-1000x1000.png')
    ],
    text: [
      'Tired of guessing why an NHL game is blacked out on TSN, Sportsnet, or Prime?',
      '',
      'Check your region & TV/streaming packages at https://hockeyblackouts.ca to see what you can watch tonight.',
      '',
      'Follow @hockeyblackouts.ca for daily game-day guides. (In the US? Follow @hockeyblackouts.com)',
      '',
      '#NHL'
    ].join('\n')
  },
  {
    site: '.com',
    identifier: process.env.BSKY_US_IDENTIFIER || 'hockeyblackouts.com',
    password: process.env.BSKY_US_PASSWORD,
    rawUrl: 'https://hockeyblackouts.com',
    utmUrl: 'https://hockeyblackouts.com/?utm_source=bluesky&utm_medium=social&utm_campaign=blackout_guide&utm_content=post_link',
    cardTitle: 'HockeyBlackouts.com — US NHL TV, ESPN+ & RSN Blackout Guide',
    cardDescription: 'Check your US ZIP code for national TV (ESPN, TNT, ABC), local RSNs, and out-of-market ESPN+ streams tonight.',
    imageCandidates: [
      path.join(__dirname, '../build_com/og/default.png'),
      path.join(__dirname, '../shared/logo-1000x1000.png')
    ],
    text: [
      'Tired of guessing why an NHL game is blacked out on ESPN+, TNT, ABC, or your local RSN?',
      '',
      'Check your ZIP at https://hockeyblackouts.com for national TV, local RSNs & ESPN+ streams tonight.',
      '',
      'Follow @hockeyblackouts.com for daily game-day guides. (In Canada? Follow @hockeyblackouts.ca)',
      '',
      '#NHL'
    ].join('\n')
  }
];

async function main() {
  for (const post of POSTS) {
    const graphemes = getGraphemeCount(post.text);
    const facets = await extractFacetsWithMentions(post.text, { [post.rawUrl]: post.utmUrl });
    const cardImagePath = post.imageCandidates.find(p => fs.existsSync(p)) || null;

    console.log(`------------------------------------------------------------`);
    console.log(`Site:      ${post.site} (@${post.identifier})`);
    console.log(`Graphemes: ${graphemes} (Limit <= 300)`);
    console.log(`Facets:    ${facets.length}`);
    console.log(`Image:     ${cardImagePath || 'None'}`);
    console.log(`\n${post.text}`);
    console.log(`------------------------------------------------------------\n`);

    if (graphemes > 300) {
      throw new Error(`Post for ${post.site} exceeds 300 graphemes (${graphemes}).`);
    }

    if (isDryRun) {
      console.log(`[DRY RUN] Skipping publish for ${post.site}.\n`);
      continue;
    }

    if (!post.identifier || !post.password) {
      console.warn(`⚠️ Missing credentials for ${post.site} (@${post.identifier}). Skipping.\n`);
      continue;
    }

    const session = await createSession(post.identifier, post.password);
    let thumb = undefined;
    if (cardImagePath) {
      thumb = await uploadBlob(session.accessJwt, fs.readFileSync(cardImagePath), 'image/png');
    }

    const embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: post.utmUrl,
        title: post.cardTitle,
        description: post.cardDescription,
        ...(thumb ? { thumb } : {})
      }
    };

    const result = await createPostRecord(session.accessJwt, session.did, {
      text: post.text,
      facets,
      embed
    });
    console.log(`✅ Published ${post.site} announcement: ${result.uri}\n`);
  }
}

main().catch(err => {
  console.error('❌ Announcement publish failed:', err);
  process.exit(1);
});
