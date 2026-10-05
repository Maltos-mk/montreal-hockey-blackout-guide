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

  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch) {
    errors.push('Missing <meta name="description"> tag');
  } else if (descMatch[1]) {
    const descText = descMatch[1].replace(/&amp;/g, '&').trim();
    if (descText.length > 160) {
      errors.push(`Meta description exceeds 160 characters (${descText.length} chars)`);
    }
  }

  if (content.includes('display: none') && content.toLowerCase().includes('seo')) {
    errors.push('Contains hidden text for SEO (black-hat tactic detected)');
  }
  
  // AI Overview / SGE Checks
  if (!filePath.endsWith('build/index.html')) {
    if (!content.includes('"@type": "FAQPage"')) {
      errors.push('Missing FAQPage Schema for AI Overviews.');
    }
    if (content.includes('id="faq"') && !content.includes('<table')) {
      errors.push('FAQ section is missing the structured summary <table> required for AI Overviews.');
    }
  }

  // Monetization / Tracking Checks
  if (content.includes('amazon.ca') && !content.includes('data-umami-event="amazon-prime-click"')) {
    errors.push('Found Amazon link but missing data-umami-event="amazon-prime-click" tracking attribute.');
  }
  if (content.includes('ko-fi.com') && !content.includes('data-umami-event="kofi-click"')) {
    errors.push('Found Ko-fi link but missing data-umami-event="kofi-click" tracking attribute.');
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

const files = fs.readdirSync(buildDir);
files.forEach(file => {
  if (file.endsWith('.html')) {
    validateHtml(path.join(buildDir, file));
  }
});
const teamsDir = path.join(__dirname, '../build/teams');
if (fs.existsSync(teamsDir)) {
    const teams = fs.readdirSync(teamsDir);
    teams.forEach(team => {
        const teamPath = path.join(teamsDir, team, 'index.html');
        if (fs.existsSync(teamPath)) validateHtml(teamPath);
    });
}


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

console.log('✅ All pages passed SEO QA validation.');
