const fs = require('fs');
const path = require('path');

function validateHtml(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let errors = [];

  if (!content.includes('<link rel="canonical" href="https://hockeyblackouts.ca/')) {
    errors.push('Missing or invalid canonical link (must point to https://hockeyblackouts.ca/)');
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

  const isRedirect = content.includes('http-equiv="refresh"');
  const isSplash = filePath.endsWith('build/index.html');
  const isGamePage = filePath.includes('/game/');
  const isTeamPage = !isSplash && !isGamePage && !isRedirect;

  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch && !isRedirect) {
    errors.push('Missing <meta name="description"> tag');
  } else if (descMatch && descMatch[1]) {
    const descText = descMatch[1].replace(/&amp;/g, '&').trim();
    if (descText.length > 160) {
      errors.push(`Meta description exceeds 160 characters (${descText.length} chars)`);
    }
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
  }

  // Monetization / Tracking Checks
  if (content.includes('cloud.umami.is/script.js') && !content.includes('data-exclude-hash="true"')) {
    errors.push('Umami script tag is missing data-exclude-hash="true" (hash updates artificially inflate pageviews).');
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
  
  
  // Image & Meta Validation
  const ogImageMatch = content.match(/<meta\s+property=["']og:image["']\s+content=["'](https:\/\/hockeyblackouts\.ca\/[^"']+)["']/i);
  if (!ogImageMatch) {
    errors.push('Missing or invalid og:image tag (must be absolute https://hockeyblackouts.ca/...)');
  } else {
    // Check if the physical file exists in the build dir
    const imagePath = ogImageMatch[1].replace('https://hockeyblackouts.ca/', '');
    const physicalPath = path.join(__dirname, '../build', imagePath);
    if (!fs.existsSync(physicalPath)) {
      errors.push(`og:image points to a 404 broken link: ${ogImageMatch[1]}`);
    }
  }

  const twImageMatch = content.match(/<meta\s+property=["']twitter:image["']\s+content=["'](https:\/\/hockeyblackouts\.ca\/[^"']+)["']/i);
  if (!twImageMatch) {
    errors.push('Missing or invalid twitter:image tag');
  } else {
    const twImagePath = twImageMatch[1].replace('https://hockeyblackouts.ca/', '');
    const pTwImagePath = path.join(__dirname, '../build', twImagePath);
    if (!fs.existsSync(pTwImagePath)) {
      errors.push(`twitter:image points to a 404 broken link: ${twImageMatch[1]}`);
    }
  }
  // Schema Validation
  const schemaLogoMatch = content.match(/"url":\s*"(https:\/\/hockeyblackouts\.ca\/[^"]+)"/i);
  if (schemaLogoMatch) {
    const logoPath = schemaLogoMatch[1].replace('https://hockeyblackouts.ca/', '');
    const physicalLogoPath = path.join(__dirname, '../build', logoPath);
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

console.log('✅ All pages passed SEO QA validation.');
