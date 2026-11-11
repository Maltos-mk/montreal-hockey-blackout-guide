const fs = require('fs');
const path = require('path');

// site 'ca' = build/ (hockeyblackouts.ca, GitHub Pages); site 'com' = build_com/ (hockeyblackouts.com, Cloudflare Pages)
function validateHtml(filePath, site = 'ca') {
  const content = fs.readFileSync(filePath, 'utf-8');
  let errors = [];
  const host = site === 'com' ? 'hockeyblackouts.com' : 'hockeyblackouts.ca';
  const hostRe = host.replace(/\./g, '\\.');
  const siteRoot = path.join(__dirname, '..', site === 'com' ? 'build_com' : 'build');

  if (!content.includes(`<link rel="canonical" href="https://${host}/`)) {
    errors.push(`Missing or invalid canonical link (must point to https://${host}/)`);
  }
  if (!content.includes('<title>')) {
    errors.push('Missing <title> tag');
  } else {
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const titleText = titleMatch[1].replace(/&amp;/g, '&').trim();
      if (titleText.length > 70) {
        errors.push(`Title tag exceeds 70 characters (${titleText.length} chars): "${titleText}"`);
      }
    }
  }

  const EXPLAINER_SLUGS = ['sportsnet-plus-blackout-rules', 'prime-hockey-schedule-canada', 'rds-vs-tva-sports-blackouts', 'how-blackouts-work', 'tsn-hockey-blackout-rules'];
  const isRedirect = content.includes('http-equiv="refresh"');
  const isSplash = site === 'ca' && filePath.endsWith('build/index.html');
  const isGamePage = filePath.includes('/game/');
  const isExplainerPage = EXPLAINER_SLUGS.some(slug => filePath.includes(`/${slug}/`));
  const isUsTeamPage = site === 'com';
  const isTeamPage = !isSplash && !isGamePage && !isExplainerPage && !isUsTeamPage && !isRedirect;

  // H1 Tag Validation (Crucial for SEO & Bing/Google accessibility audits - required on all pages including redirects)
  const h1Matches = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  if (!h1Matches || h1Matches.length === 0) {
    errors.push('Missing <h1> tag (required for search engine ranking and accessibility)');
  } else if (h1Matches.length > 1) {
    errors.push(`Multiple <h1> tags found (${h1Matches.length}). Expected exactly 1 per page.`);
  }

  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch) {
    errors.push('Missing <meta name="description"> tag');
  } else if (descMatch && descMatch[1]) {
    const descText = descMatch[1].replace(/&amp;/g, '&').trim();
    if (descText.length > 160) {
      errors.push(`Meta description exceeds 160 characters (${descText.length} chars)`);
    }
  }

  // Prevent linking to legacy slug aliases (e.g. elmont instead of new-york)
  if (content.includes('href="/game/') && content.includes('-elmont/')) {
    errors.push('Contains internal link pointing to legacy "elmont" slug instead of canonical "new-york" slug.');
  }

  if (content.includes('display: none') && content.toLowerCase().includes('seo')) {
    errors.push('Contains hidden text for SEO (black-hat tactic detected)');
  }

  // AI Overview / SGE Checks
  if (isTeamPage) {
    if (!content.includes('"@type": "FAQPage"')) {
      errors.push('Missing FAQPage Schema for AI Overviews.');
    }
    if (content.includes('id="faq"') && !content.includes('<table')) {
      errors.push('FAQ section is missing the structured summary <table> required for AI Overviews.');
    }
    // Prerendered Static HTML Schedule Check (Googlebot / AI Overviews must see real schedule in raw HTML)
    if (!content.includes('data-prerendered="true"')) {
      errors.push('Schedule table is missing prerendered static HTML rows (empty client-side render hurts SEO/AI Overviews).');
    }
    if (!content.includes('data-spotlight="prerendered"')) {
      errors.push('Team page is missing prerendered static upcoming game spotlight (data-spotlight="prerendered").');
    }
    if (!content.includes('"dateModified":')) {
      errors.push('Team page schema is missing "dateModified" freshness signal.');
    }
    if (!content.includes('data-freshness="verified-date"')) {
      errors.push('Team page is missing visible schedule verification date stamp (data-freshness="verified-date").');
    }
    if (content.includes('"@type": "WebApplication"')) {
      errors.push('Team page contains WebApplication schema with $0 Offer that triggers Rich Results aggregateRating warning; use WebPage instead.');
    }
    if (!/<script\s+defer\s+src="[^"]*shared\/app\.js/.test(content)) {
      errors.push('Team page shared/app.js script tag is missing defer attribute (causes render blocking on mobile).');
    }
    if (!content.includes('id="regionSelect" aria-label=')) {
      errors.push('Team page #regionSelect is missing aria-label (fails Lighthouse select-name & Agentic Browsing checks).');
    }
    const ca7Slugs = ['/montreal/', '/toronto/', '/ottawa/', '/vancouver/', '/calgary/', '/edmonton/', '/winnipeg/'];
    const isCa7Page = ca7Slugs.some(s => filePath.includes(s));
    if (!isCa7Page) {
      if (content.includes('Quick Summary for Habs Fans') || content.includes('drawn between Belleville and Kingston')) {
        errors.push('US Team page on Canadian site leaked Canadian domestic boundary/Habs FAQ text.');
      }
      if (!content.includes('are based in the US, their games are out-of-market in Canada')) {
        errors.push('US Team page on Canadian site is missing Canadian out-of-market localization in meta/FAQ.');
      }
    }
    if (filePath.includes('/fr/')) {
      if (!content.includes('<html lang="fr">')) {
        errors.push('French page is missing <html lang="fr">.');
      }
      if (!/<script\s+defer\s+src="[^"]*shared\/lang-fr\.js/.test(content)) {
        errors.push('French page is missing shared/lang-fr.js script tag.');
      }
      if (!content.includes('hreflang="fr-CA"') || !content.includes('hreflang="en-CA"')) {
        errors.push('French page is missing reciprocal hreflang="fr-CA" / hreflang="en-CA" links.');
      }
      const forbiddenEnglishLeaks = [
        'Where do you live?',
        'Your Active Subscriptions & Channels:',
        'Watchable On Your Setup',
        'Subscription Needed',
        'Upcoming Schedule Snapshot:',
        'TV & Blackout Breakdown',
        'Showing the 84-game',
        'Blackout Rules & FAQ'
      ];
      forbiddenEnglishLeaks.forEach(phrase => {
        if (content.includes(phrase)) {
          errors.push(`French page contains untranslated English UI string: "${phrase}"`);
        }
      });
    }
  }

  if (isSplash) {
    if (!content.includes('data-section="upcoming-matchups"')) {
      errors.push('Splash page is missing upcoming matchups spotlight section (data-section="upcoming-matchups").');
    }
    if (!content.includes('<main>')) {
      errors.push('Splash page is missing <main> landmark.');
    }
    if (!content.includes('"@type": "WebSite"') || !content.includes('"@type": "Organization"')) {
      errors.push('Splash page is missing WebSite or Organization Schema.');
    }
  }

  if (isUsTeamPage && !isRedirect) {
    if (filePath === path.join(siteRoot, 'index.html')) {
      if (!content.includes('"@type": "WebSite"') || !content.includes('"@type": "Organization"')) {
        errors.push('US Homepage is missing WebSite or Organization Schema.');
      }
    } else {
      if (!content.includes('"@type": "FAQPage"')) {
        errors.push('US Team page is missing FAQPage Schema.');
      }
      const cleanedForUsCheck = content
        .replace(/MSG Sportsnet/gi, '')
        .replace(/SportsNet Pittsburgh/gi, '');
      if (/\b(Sportsnet|TSN|TSN[1-5]|RDS|TVA Sports|Centre Ice)\b/i.test(cleanedForUsCheck)) {
        errors.push('US Team page leaked Canadian broadcaster terminology (Sportsnet, TSN, RDS, TVA Sports, or Centre Ice).');
      }
    }
  }

  // 1-to-1 Cross-Border Hreflang Validation (Homepages & All 32 Team Pages across CA & US)
  if ((isSplash || isUsTeamPage || (isTeamPage && !filePath.includes('/fr/'))) && !isRedirect) {
    if (!content.includes('hreflang="en-US" href="https://hockeyblackouts.com/')) {
      errors.push('Missing hreflang="en-US" pointing to https://hockeyblackouts.com/');
    }
    if (!content.includes('hreflang="en-CA" href="https://hockeyblackouts.ca/')) {
      errors.push('Missing hreflang="en-CA" pointing to https://hockeyblackouts.ca/');
    }
    if (!content.includes('hreflang="x-default" href="https://hockeyblackouts.com/')) {
      errors.push('Missing hreflang="x-default" pointing to https://hockeyblackouts.com/');
    }
  }

  // Template Placeholder Leak Check (must not output unrendered {{...}} placeholders)
  const placeholderMatch = content.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (placeholderMatch && !isRedirect) {
    errors.push(`Unrendered template placeholder(s) found: ${placeholderMatch.slice(0, 3).join(', ')}`);
  }

  // Per-Game Page Schema & Trademark Validation
  if (isGamePage && !isRedirect) {
    if (!content.includes('"@type": "SportsEvent"')) {
      errors.push('Game page is missing SportsEvent structured data.');
    }
    if (!content.includes('"@type": "BroadcastEvent"')) {
      errors.push('Game page is missing BroadcastEvent structured data.');
    }
    if (!content.includes('"eventStatus"')) {
      errors.push('Game page SportsEvent is missing eventStatus.');
    }
    if (!content.includes('"endDate"')) {
      errors.push('Game page SportsEvent is missing endDate.');
    }
    if (!content.includes('"organizer"')) {
      errors.push('Game page SportsEvent is missing organizer.');
    }
    if (!content.includes('"performer"')) {
      errors.push('Game page SportsEvent is missing performer.');
    }
    // City-only slug rule: game path must not contain trademarked nicknames
    const urlParts = filePath.split('/');
    const slug = urlParts[urlParts.length - 2];
    const bannedNicknames = ['leafs', 'canadiens', 'habs', 'senators', 'sens', 'canucks', 'flames', 'oilers', 'jets', 'bruins', 'rangers'];
    if (bannedNicknames.some(nick => slug.includes(nick))) {
      errors.push(`Game page URL slug "${slug}" contains trademarked team nickname. Slugs must use city names only.`);
    }

    // Region key parity test: game page REGION_DATA must support canonical app regions
    const canonicalRegions = ['on_west', 'on_east_qc_atl', 'on_overlap', 'ab', 'sk', 'mb', 'nw_on', 'bc', 'us_intl'];
    canonicalRegions.forEach(reg => {
      if (!content.includes(`"${reg}":`)) {
        errors.push(`Game page REGION_DATA is missing canonical region key: "${reg}"`);
      }
    });

    // Ensure header link and CTA link only to valid Canadian team directories
    const nonCanadianTeams = ['Columbus Blue Jackets Schedule', 'Buffalo Sabres Schedule', 'Boston Bruins Schedule', 'Detroit Red Wings Schedule', 'Florida Panthers Schedule', 'Tampa Bay Lightning Schedule'];
    nonCanadianTeams.forEach(badName => {
      if (content.includes(badName)) {
        errors.push(`Game page contains invalid non-Canadian team schedule link: "${badName}". Links must point to Canadian teams only.`);
      }
    });

    // Front door CTA check: game page must have a dedicated season schedule CTA leading to a team page
    if (!content.includes('data-cta="team-schedule"')) {
      errors.push('Game page is missing season schedule call to action (data-cta="team-schedule").');
    }
    if (!content.includes('data-cta="team-hub-nav"')) {
      errors.push('Game page is missing bottom team hub navigation bar (data-cta="team-hub-nav").');
    }
  }

  // Monetization / Tracking Checks
  if (content.includes('cloud.umami.is/script.js') && !content.includes('data-exclude-hash="true"')) {
    errors.push('Umami script tag is missing data-exclude-hash="true" (hash updates artificially inflate pageviews).');
  }
  if (content.includes('cloud.umami.is/script.js') && !content.includes(`data-domains="${host}"`)) {
    errors.push(`Umami script tag is missing data-domains="${host}" (prevents test and localhost pollution).`);
  }
  if (content.includes('amazon.ca')) {
    if (!content.includes('data-umami-event="amazon-prime-click"')) {
      errors.push('Found Amazon link but missing data-umami-event="amazon-prime-click" tracking attribute.');
    }
    if (!content.includes('rel="sponsored noopener noreferrer"') && !content.includes('rel="sponsored"')) {
      errors.push('Found Amazon affiliate link missing Google-compliant rel="sponsored" attribute.');
    }
  }
  if (content.includes('ko-fi.com')) {
    if (!content.includes('data-umami-event="kofi-click"')) {
      errors.push('Found Ko-fi link but missing data-umami-event="kofi-click" tracking attribute.');
    }
    if (/<a[^>]*ko-fi\.com[^>]*noreferrer/i.test(content) || /<a[^>]*noreferrer[^>]*ko-fi\.com/i.test(content)) {
      errors.push('Ko-fi link contains rel="noreferrer" which strips HTTP Referer header from reaching Ko-fi analytics.');
    }
  }
  if (isGamePage && !isRedirect) {
    if (!content.includes('data-umami-event="radio-click"')) {
      errors.push('Game page is missing data-umami-event="radio-click" tracking on radio fallback link.');
    }
    if (!content.includes('data-umami-event="stream-referral-click"') && !content.includes('data-umami-event="amazon-prime-click"')) {
      errors.push('Game page is missing data-umami-event streaming referral tracking attribute.');
    }
  }
  
  
  // Social Meta Tags & OpenGraph Validation
  if (!isRedirect) {
    const twCardMatch = content.match(/<meta\s+(?:name|property)=["']twitter:card["']\s+content=["']([^"']+)["']/i);
    if (!twCardMatch) {
      errors.push('Missing twitter:card meta tag');
    } else if (twCardMatch[1] !== 'summary_large_image') {
      errors.push(`Invalid twitter:card "${twCardMatch[1]}" (must be "summary_large_image")`);
    }

    const ogTitleMatch = content.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (!ogTitleMatch) {
      errors.push('Missing og:title tag');
    } else if (ogTitleMatch[1].replace(/&amp;/g, '&').length > 60) {
      errors.push(`og:title exceeds 60 characters (${ogTitleMatch[1].length} chars): "${ogTitleMatch[1]}"`);
    }

    const twTitleMatch = content.match(/<meta\s+(?:name|property)=["']twitter:title["']\s+content=["']([^"']+)["']/i);
    if (!twTitleMatch) {
      errors.push('Missing twitter:title tag');
    } else if (twTitleMatch[1].replace(/&amp;/g, '&').length > 60) {
      errors.push(`twitter:title exceeds 60 characters (${twTitleMatch[1].length} chars): "${twTitleMatch[1]}"`);
    }

    const ogDescMatch = content.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (!ogDescMatch) {
      errors.push('Missing og:description tag');
    } else if (ogDescMatch[1].replace(/&amp;/g, '&').length > 125) {
      errors.push(`og:description exceeds 125 characters (${ogDescMatch[1].length} chars): "${ogDescMatch[1]}"`);
    }

    const twDescMatch = content.match(/<meta\s+(?:name|property)=["']twitter:description["']\s+content=["']([^"']+)["']/i);
    if (!twDescMatch) {
      errors.push('Missing twitter:description tag');
    } else if (twDescMatch[1].replace(/&amp;/g, '&').length > 125) {
      errors.push(`twitter:description exceeds 125 characters (${twDescMatch[1].length} chars): "${twDescMatch[1]}"`);
    }

    if (!content.includes('<meta property="og:image:width" content="1200">')) {
      errors.push('Missing explicit <meta property="og:image:width" content="1200"> tag');
    }
    if (!content.includes('<meta property="og:image:height" content="630">')) {
      errors.push('Missing explicit <meta property="og:image:height" content="630"> tag');
    }
    if (!content.match(/<meta\s+property=["']og:image:alt["']\s+content=["'][^"']+["']/i)) {
      errors.push('Missing <meta property="og:image:alt" ...> tag');
    }
  }

  // Image & Meta Validation
  const ogImageMatch = content.match(new RegExp(`<meta\\s+property=["']og:image["']\\s+content=["'](https:\\/\\/${hostRe}\\/[^"']+)["']`, 'i'));
  if (!ogImageMatch) {
    errors.push(`Missing or invalid og:image tag (must be absolute https://${host}/...)`);
  } else {
    if (!isRedirect && !ogImageMatch[1].startsWith(`https://${host}/og/`)) {
      errors.push(`og:image does not point to 1200x630 /og/ asset: ${ogImageMatch[1]}`);
    }
    // Check if the physical file exists in the build dir
    const imagePath = ogImageMatch[1].replace(`https://${host}/`, '');
    const physicalPath = path.join(siteRoot, imagePath);
    if (!fs.existsSync(physicalPath)) {
      errors.push(`og:image points to a 404 broken link: ${ogImageMatch[1]}`);
    }
  }

  const twImageMatch = content.match(new RegExp(`<meta\\s+(?:property|name)=["']twitter:image["']\\s+content=["'](https:\\/\\/${hostRe}\\/[^"']+)["']`, 'i'));
  if (!twImageMatch) {
    errors.push('Missing or invalid twitter:image tag');
  } else {
    const twImagePath = twImageMatch[1].replace(`https://${host}/`, '');
    const pTwImagePath = path.join(siteRoot, twImagePath);
    if (!fs.existsSync(pTwImagePath)) {
      errors.push(`twitter:image points to a 404 broken link: ${twImageMatch[1]}`);
    }
  }
  // Schema Validation
  const schemaLogoMatch = content.match(new RegExp(`"url":\\s*"(https:\\/\\/${hostRe}\\/[^"]+)"`, 'i'));
  if (schemaLogoMatch) {
    const logoPath = schemaLogoMatch[1].replace(`https://${host}/`, '');
    const physicalLogoPath = path.join(siteRoot, logoPath);
    if (!fs.existsSync(physicalLogoPath)) {
      errors.push(`Organization schema logo points to a 404 broken link: ${schemaLogoMatch[1]}`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ QA FAILED in ${filePath}:`);
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
}

console.log('Running Pre-Flight QA Validator...');
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) return;

function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'shared') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const allHtmlFiles = getAllHtmlFiles(buildDir);
console.log(`Validating ${allHtmlFiles.length} HTML files...`);
allHtmlFiles.forEach(file => {
  validateHtml(file);
});

// ---- hockeyblackouts.com (build_com/) validation ----
const comDir = path.join(__dirname, '../build_com');
if (!fs.existsSync(comDir)) {
  console.error('\n❌ QA FAILED: build_com/ (hockeyblackouts.com) is missing. Run node scripts/build_all.js.');
  process.exit(1);
}
const comHtmlFiles = getAllHtmlFiles(comDir);
console.log(`Validating ${comHtmlFiles.length} HTML files in build_com/ (hockeyblackouts.com)...`);
comHtmlFiles.forEach(file => {
  validateHtml(file, 'com');
  const c = fs.readFileSync(file, 'utf-8');
  const comErrors = [];
  if (/href="\/us\//.test(c)) comErrors.push('.com page contains a /us/ link (US pages live at the .com root).');
  if (c.includes('b68ec99c-ee81-4587-91dc-cd69b239def8')) comErrors.push('.com page contains the .ca Umami website ID (must use its own UMAMI_WEBSITE_ID_US).');
  if (comErrors.length) {
    console.error(`\n❌ QA FAILED in ${file}:`);
    comErrors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
});
if (process.env.CI && !comHtmlFiles.every(f => fs.readFileSync(f, 'utf-8').includes('cloud.umami.is/script.js'))) {
  console.error('\n❌ QA FAILED: CI build for hockeyblackouts.com has pages without the Umami script. Set the UMAMI_WEBSITE_ID_US secret.');
  process.exit(1);
}
if (fs.existsSync(path.join(buildDir, 'us'))) {
  console.error('\n❌ QA FAILED: build/us exists. The US-built pages must only be served from build_com/ (hockeyblackouts.com).');
  process.exit(1);
}
const comRobots = fs.existsSync(path.join(comDir, 'robots.txt')) ? fs.readFileSync(path.join(comDir, 'robots.txt'), 'utf-8') : '';
if (!comRobots.includes('Sitemap: https://hockeyblackouts.com/sitemap.xml')) {
  console.error('\n❌ QA FAILED: build_com/robots.txt is missing or does not reference https://hockeyblackouts.com/sitemap.xml.');
  process.exit(1);
}
const comSitemapXml = fs.existsSync(path.join(comDir, 'sitemap.xml')) ? fs.readFileSync(path.join(comDir, 'sitemap.xml'), 'utf-8') : '';
const comLocs = [...comSitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
if (comLocs.length < 2 || comLocs.some(u => !u.startsWith('https://hockeyblackouts.com/'))) {
  console.error('\n❌ QA FAILED: build_com/sitemap.xml is missing or contains non-.com URLs.');
  process.exit(1);
}
comLocs.forEach(u => {
  const target = path.join(comDir, u.replace('https://hockeyblackouts.com', ''), 'index.html');
  if (!fs.existsSync(target)) {
    console.error(`\n❌ QA FAILED: .com sitemap URL ${u} does not exist on disk.`);
    process.exit(1);
  }
});
// Both sites must cover all 32 teams.
const usTeamSlugs = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/us_teams.json'), 'utf-8')).map(t => t.slug);
const caTeamSlugs = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/ca_teams.json'), 'utf-8')).map(t => t.slug);
if (usTeamSlugs.length !== 32 || caTeamSlugs.length !== 32) {
  console.error(`\n❌ QA FAILED: expected 32 teams per site (us_teams.json: ${usTeamSlugs.length}, ca_teams.json: ${caTeamSlugs.length}).`);
  process.exit(1);
}
usTeamSlugs.forEach(slug => {
  if (!fs.existsSync(path.join(comDir, slug, 'index.html'))) {
    console.error(`\n❌ QA FAILED: build_com/${slug}/index.html is missing (.com must have all 32 teams).`);
    process.exit(1);
  }
});
caTeamSlugs.forEach(slug => {
  if (!fs.existsSync(path.join(buildDir, slug, 'index.html'))) {
    console.error(`\n❌ QA FAILED: build/${slug}/index.html is missing (.ca must have all 32 teams).`);
    process.exit(1);
  }
});


// Validate robots.txt
const robotsPath = path.join(__dirname, '../build/robots.txt');
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf-8');
  if (!robots.includes('Sitemap: https://hockeyblackouts.ca/sitemap.xml')) {
    console.error('\n❌ QA FAILED: robots.txt is missing the correct sitemap domain.');
    process.exit(1);
  }
} else {
  console.error('\n❌ QA FAILED: robots.txt is missing from the build folder.');
  process.exit(1);
}

// Subfolder robots.txt check (crawlers ignore subfolder robots.txt; having them is an SEO antipattern)
const rootEntries = fs.readdirSync(buildDir);
rootEntries.forEach(file => {
  const fullPath = path.join(buildDir, file);
  if (fs.statSync(fullPath).isDirectory()) {
    const subRobots = path.join(fullPath, 'robots.txt');
    if (fs.existsSync(subRobots)) {
      console.error(`\n❌ QA FAILED: Found redundant robots.txt in subfolder: ${subRobots}. Web crawlers only honor the root robots.txt.`);
      process.exit(1);
    }
  }
});

// Validate IndexNow verification file
const indexNowKey = '0e7615e8d257218fdc00d074f25a4247';
const indexNowPath = path.join(buildDir, `${indexNowKey}.txt`);
if (!fs.existsSync(indexNowPath)) {
  console.error(`\n❌ QA FAILED: IndexNow verification key file missing at ${indexNowPath}`);
  process.exit(1);
} else {
  const keyContent = fs.readFileSync(indexNowPath, 'utf-8').trim();
  if (keyContent !== indexNowKey) {
    console.error(`\n❌ QA FAILED: IndexNow key file content does not match expected key.`);
    process.exit(1);
  }
}

// Validate IndexNow anti-spam guardrails (must not fire on every git push or dump 500+ URLs)
const deployWorkflowPath = path.join(__dirname, '../.github/workflows/deploy-teams.yml');
if (fs.existsSync(deployWorkflowPath)) {
  const workflowYaml = fs.readFileSync(deployWorkflowPath, 'utf-8');
  if (!workflowYaml.includes("github.event_name == 'schedule'")) {
    console.error('\n❌ QA FAILED: .github/workflows/deploy-teams.yml must restrict IndexNow pings to scheduled runs (github.event_name == \'schedule\') to prevent Bing rate-limiting on git pushes.');
    process.exit(1);
  }
}
const { execSync } = require('child_process');
const dryRunOut = execSync('node scripts/ping_indexnow.js --dry-run', { encoding: 'utf-8' });
const urlCountMatch = dryRunOut.match(/URL Count:\s*(\d+)/);
if (!urlCountMatch || parseInt(urlCountMatch[1], 10) > 50) {
  console.error(`\n❌ QA FAILED: scripts/ping_indexnow.js submitted ${urlCountMatch ? urlCountMatch[1] : 'unknown'} URLs (max 50 allowed per daily ping to avoid IndexNow spam throttling).`);
  process.exit(1);
}

// Validate shared/app.js for runtime integrity
const appJsPath = path.join(__dirname, '../shared/app.js');
if (fs.existsSync(appJsPath)) {
  const appJsCode = fs.readFileSync(appJsPath, 'utf-8');
  if (appJsCode.includes('getGamePath(')) {
    console.error('\n❌ QA FAILED: shared/app.js references undefined function "getGamePath". Function in app.js is "getGameUrl".');
    process.exit(1);
  }
  if (appJsCode.includes('kofi-impression')) {
    console.error('\n❌ QA FAILED: shared/app.js contains automatic "kofi-impression" tracking on page load, which inflates Ko-fi event counts.');
    process.exit(1);
  }
  if (appJsCode.includes('bindUmamiEvents')) {
    console.error('\n❌ QA FAILED: shared/app.js contains "bindUmamiEvents", which double-fires [data-umami-event] clicks and strips variant attributes.');
    process.exit(1);
  }
  if (appJsCode.includes("'share-click'") || appJsCode.includes('"share-click"')) {
    console.error('\n❌ QA FAILED: shared/app.js contains "share-click", which conflicts with native sharing and causes double-firing. Use share-native or share-copy-link.');
    process.exit(1);
  }
  if (appJsCode.includes('trackUmamiEvent(\'pwa_prompt_viewed\'') || appJsCode.includes('trackUmamiEvent(\'pwa_install_accepted\'')) {
    console.error('\n❌ QA FAILED: shared/app.js contains legacy snake_case PWA events. All Umami events must use kebab-case.');
    process.exit(1);
  }
  if (/function updateHash\(\)\s*\{\s*const params = new URLSearchParams\(\);\s*params\.set\('region',\s*state\.region\);/.test(appJsCode)) {
    console.error('\n❌ QA FAILED: shared/app.js unconditionally sets #region=... hash on initial page load, polluting canonical URLs for Bing/search crawlers.');
    process.exit(1);
  }
}

// Validate PWA manifests have start_url containing utm_source=pwa
['montreal', 'toronto', 'ottawa', 'vancouver', 'calgary', 'edmonton', 'winnipeg', 'fr/montreal'].forEach(subPath => {
  const mPath = path.join(buildDir, subPath, 'manifest.json');
  if (fs.existsSync(mPath)) {
    const manifestJson = JSON.parse(fs.readFileSync(mPath, 'utf-8'));
    if (!manifestJson.start_url || !manifestJson.start_url.includes('utm_source=pwa')) {
      console.error(`\n❌ QA FAILED: ${mPath} start_url is missing "utm_source=pwa" for PWA analytics tracking.`);
      process.exit(1);
    }
  }
});

// Validate Evergreen Explainer & Methodology Pages (Items 3.4 & 3.5)
const requiredExplainers = [
  'sportsnet-plus-blackout-rules',
  'prime-hockey-schedule-canada',
  'rds-vs-tva-sports-blackouts',
  'how-blackouts-work',
  'tsn-hockey-blackout-rules'
];
const masterSitemapPath = path.join(buildDir, 'sitemap.xml');
const masterSitemapContent = fs.existsSync(masterSitemapPath) ? fs.readFileSync(masterSitemapPath, 'utf-8') : '';

requiredExplainers.forEach(slug => {
  const expPath = path.join(buildDir, slug, 'index.html');
  if (!fs.existsSync(expPath)) {
    console.error(`\n❌ QA FAILED: Required explainer page missing at ${expPath}`);
    process.exit(1);
  }
  const expHtml = fs.readFileSync(expPath, 'utf-8');
  if (!expHtml.includes('"@type": "FAQPage"')) {
    console.error(`\n❌ QA FAILED: Explainer page ${slug} is missing FAQPage schema.`);
    process.exit(1);
  }
  if (!expHtml.includes('"dateModified":')) {
    console.error(`\n❌ QA FAILED: Explainer page ${slug} is missing dateModified schema.`);
    process.exit(1);
  }
  if (!expHtml.includes('data-cta="team-hub-nav"')) {
    console.error(`\n❌ QA FAILED: Explainer page ${slug} is missing team hub navigation bar.`);
    process.exit(1);
  }
  if (!masterSitemapContent.includes(`https://hockeyblackouts.ca/${slug}/`)) {
    console.error(`\n❌ QA FAILED: Master sitemap.xml is missing explainer URL https://hockeyblackouts.ca/${slug}/`);
    process.exit(1);
  }
});

const primePageHtml = fs.readFileSync(path.join(buildDir, 'prime-hockey-schedule-canada', 'index.html'), 'utf-8');
if (!primePageHtml.includes('/game/202')) {
  console.error('\n❌ QA FAILED: prime-hockey-schedule-canada page is missing dynamically rendered game links.');
  process.exit(1);
}

// Validate master sitemap.xml is pruned to rolling window (<= 80 URLs) with <lastmod>
const sitemapLocMatches = masterSitemapContent.match(/<loc>/g) || [];
if (sitemapLocMatches.length > 80) {
  console.error(`\n❌ QA FAILED: build/sitemap.xml contains ${sitemapLocMatches.length} URLs (max 80 allowed for rolling 14-day window to prevent crawl-budget dilution).`);
  process.exit(1);
}
if (!masterSitemapContent.includes('<lastmod>')) {
  console.error('\n❌ QA FAILED: build/sitemap.xml is missing <lastmod> tags.');
  process.exit(1);
}

// Item 3: Validate every URL in master sitemap.xml strictly exists on disk (200 OK) and contains no meta-refresh tags
const sitemapUrls = [...masterSitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
sitemapUrls.forEach(url => {
  const relPath = url.replace('https://hockeyblackouts.ca', '');
  let targetFile = path.join(buildDir, relPath);
  if (targetFile.endsWith('/') || !path.extname(targetFile)) {
    targetFile = path.join(targetFile, 'index.html');
  }
  if (!fs.existsSync(targetFile)) {
    console.error(`\n❌ QA FAILED: Sitemap URL ${url} does not exist on disk at ${targetFile} (would return 404).`);
    process.exit(1);
  }
  const fileHtml = fs.readFileSync(targetFile, 'utf-8');
  if (fileHtml.includes('http-equiv="refresh"')) {
    console.error(`\n❌ QA FAILED: Sitemap URL ${url} contains a meta-refresh redirect tag. All sitemap URLs must strictly return 200 OK non-redirecting content.`);
    process.exit(1);
  }
});

// Validate no build/README.md with legacy maltos-mk.github.io links
if (fs.existsSync(path.join(buildDir, 'README.md'))) {
  console.error('\n❌ QA FAILED: build/README.md should not be deployed to production root.');
  process.exit(1);
}

// Validate English team hubs have <120KB HTML size (under Bing's 125KB truncation cliff), high-intent title ("tonight" + "blackouts"), zero blank token artifacts, and recent games archive
['montreal', 'toronto', 'ottawa', 'vancouver', 'calgary', 'edmonton', 'winnipeg'].forEach(teamSlug => {
  const teamHtmlPath = path.join(buildDir, teamSlug, 'index.html');
  if (fs.existsSync(teamHtmlPath)) {
    const rawHtml = fs.readFileSync(teamHtmlPath, 'utf-8');
    const byteSize = Buffer.byteLength(rawHtml, 'utf-8');
    // The FAQ must be fully inside the first 120KB so Bingbot never truncates it.
    const faqStart = Buffer.from(rawHtml, 'utf-8').indexOf('<section id="faq"');
    const faqEndTag = rawHtml.indexOf('</section>', rawHtml.indexOf('<section id="faq"'));
    const faqEndBytes = faqStart === -1 || faqEndTag === -1 ? -1 : Buffer.byteLength(rawHtml.slice(0, faqEndTag + '</section>'.length), 'utf-8');
    if (faqEndBytes === -1 || faqEndBytes > 120000) {
      console.error(`\n❌ QA FAILED: build/${teamSlug}/index.html #faq ends at byte ${faqEndBytes} (must end before 120KB so Bingbot does not truncate it).`);
      process.exit(1);
    }
    // Whole-document soft ceiling: below Bing's ~125KB truncation cliff.
    if (byteSize > 125000) {
      console.error(`\n❌ QA FAILED: build/${teamSlug}/index.html is ${byteSize} bytes (>125KB total document ceiling).`);
      process.exit(1);
    }
    const tMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
    const tStr = tMatch ? tMatch[1].toLowerCase() : '';
    if (!tStr.includes('tonight') || !tStr.includes('blackout') || !tStr.includes('stream')) {
      console.error(`\n❌ QA FAILED: build/${teamSlug}/index.html <title> ("${tMatch ? tMatch[1] : ''}") is missing high-intent "stream", "tonight", or "blackout" keywords.`);
      process.exit(1);
    }
    if (rawHtml.includes(', , TVA Sports') || rawHtml.includes('and  by subscribing')) {
      console.error(`\n❌ QA FAILED: build/${teamSlug}/index.html contains blank French broadcaster token artifacts (", , TVA Sports" or "and  by subscribing").`);
      process.exit(1);
    }
    if (!rawHtml.includes('id="recentGamesArchive"')) {
      console.error(`\n❌ QA FAILED: build/${teamSlug}/index.html is missing recent games archive section (#recentGamesArchive).`);
      process.exit(1);
    }
  }
});

console.log('✅ All pages passed SEO QA validation.');
