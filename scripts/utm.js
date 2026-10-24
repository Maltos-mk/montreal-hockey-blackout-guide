#!/usr/bin/env node

/**
 * UTM URL Generator for HockeyBlackouts.ca
 *
 * Generates standardized, Umami-compliant URLs following the AGENTS.md taxonomy.
 *
 * Usage:
 *   node scripts/utm.js <target> [source] [content] [campaign]
 *
 * Examples:
 *   node scripts/utm.js toronto reddit r_leafs
 *   node scripts/utm.js mtl reddit r_habs
 *   node scripts/utm.js inspector reddit r_canadahockey
 *   node scripts/utm.js toronto twitter comment_reply sn_exclusive
 */

const TARGET_MAP = {
  'home': '',
  'root': '',
  'toronto': 'toronto',
  'leafs': 'toronto',
  'tor': 'toronto',
  'montreal': 'montreal',
  'habs': 'montreal',
  'mtl': 'montreal',
  'ottawa': 'ottawa',
  'sens': 'ottawa',
  'ott': 'ottawa',
  'winnipeg': 'winnipeg',
  'jets': 'winnipeg',
  'wpg': 'winnipeg',
  'edmonton': 'edmonton',
  'oilers': 'edmonton',
  'edm': 'edmonton',
  'calgary': 'calgary',
  'flames': 'calgary',
  'cgy': 'calgary',
  'vancouver': 'vancouver',
  'canucks': 'vancouver',
  'van': 'vancouver',
  'inspector': 'how-blackouts-work',
  'how-blackouts-work': 'how-blackouts-work',
  'sn-rules': 'sportsnet-plus-blackout-rules',
  'tsn-rules': 'tsn-hockey-blackout-rules'
};

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
HockeyBlackouts.ca - Canonical UTM URL Generator

Usage:
  node scripts/utm.js <target> [source] [content] [campaign]

Arguments:
  target    Team or page (toronto, mtl, ott, wpg, edm, cgy, van, inspector, home)
  source    Platform (default: reddit). Valid: reddit, twitter, facebook, threads, bluesky
  content   Subreddit or placement (e.g., r_leafs, r_habs, r_canadahockey, comment_reply)
  campaign  Asset campaign (default: blackout_guide or blackout_inspector)

Examples:
  node scripts/utm.js toronto reddit r_leafs
  node scripts/utm.js mtl reddit r_habs
  node scripts/utm.js inspector reddit r_canadahockey
  node scripts/utm.js toronto twitter comment_reply sn_exclusive
`);
  process.exit(0);
}

const targetInput = (args[0] || 'home').toLowerCase().replace(/^\//, '').replace(/\/$/, '');
const targetSlug = TARGET_MAP[targetInput] !== undefined ? TARGET_MAP[targetInput] : targetInput;

const source = (args[1] || 'reddit').toLowerCase().replace('x', 'twitter');
const medium = source === 'pwa' ? 'homescreen' : 'social';

let defaultCampaign = 'blackout_guide';
if (targetSlug === 'how-blackouts-work') {
  defaultCampaign = 'blackout_inspector';
} else if (targetSlug === 'sportsnet-plus-blackout-rules') {
  defaultCampaign = 'sn_exclusive';
}

const content = args[2] ? args[2].toLowerCase() : null;
const campaign = args[3] ? args[3].toLowerCase() : defaultCampaign;

let url = `https://hockeyblackouts.ca/${targetSlug ? targetSlug + '/' : ''}`;
const params = new URLSearchParams();
params.set('utm_source', source);
params.set('utm_medium', medium);
params.set('utm_campaign', campaign);
if (content) {
  params.set('utm_content', content);
}

const fullUrl = `${url}?${params.toString()}`;
console.log(fullUrl);
