const fs = require('fs');
const path = require('path');
const https = require('https');

const INDEXNOW_HOST = 'hockeyblackouts.ca';
const INDEXNOW_KEY = '0e7615e8d257218fdc00d074f25a4247';
const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;
const SITEMAP_PATH = path.join(__dirname, '../build/sitemap.xml');

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`❌ SITEMAP NOT FOUND: ${SITEMAP_PATH}. Please run "node scripts/build_all.js" first.`);
    process.exit(1);
  }

  const sitemapXml = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const locRegex = /<loc>(https:\/\/hockeyblackouts\.ca\/[^<]*)<\/loc>/g;
  const now = new Date();
  const urls = [];
  let match;
  while ((match = locRegex.exec(sitemapXml)) !== null) {
    const url = match[1];
    const gameDateMatch = url.match(/\/game\/(\d{4}-\d{2}-\d{2})\//);
    if (gameDateMatch) {
      const gameDate = new Date(gameDateMatch[1] + 'T12:00:00Z');
      const diffDays = (gameDate - now) / (1000 * 60 * 60 * 24);
      // Only ping games occurring today or within the next 48 hours to avoid IndexNow bulk-spam throttling
      if (diffDays >= -1 && diffDays <= 2) {
        urls.push(url);
      }
    } else {
      urls.push(url);
    }
  }

  if (urls.length === 0) {
    console.warn('⚠️ No URLs found in sitemap.xml to submit to IndexNow.');
    process.exit(0);
  }

  console.log(`📡 IndexNow: Selected ${urls.length} active/core URLs to submit.`);

  const payload = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls
  };

  if (isDryRun) {
    console.log('🧪 IndexNow Dry Run Mode: Skipping network submission.');
    console.log(`Host: ${payload.host}`);
    console.log(`Key Location: ${payload.keyLocation}`);
    console.log(`URL Count: ${payload.urlList.length}`);
    console.log('Sample URLs:', payload.urlList.slice(0, 5));
    process.exit(0);
  }

  console.log('❄️ IndexNow is temporarily frozen for Bing rate-limit cooldown. Skipping live network submission.');
  process.exit(0);

  const postData = JSON.stringify(payload);

  const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 10000
  };

  console.log('🚀 Submitting URL batch to IndexNow API (api.indexnow.org)...');

  try {
    const responseCode = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, body });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('IndexNow request timed out after 10 seconds.'));
      });

      req.write(postData);
      req.end();
    });

    if (responseCode.status === 200 || responseCode.status === 202) {
      console.log(`✅ IndexNow submission successful! Status: ${responseCode.status} (${responseCode.status === 200 ? 'OK' : 'Accepted/Pending Key Validation'})`);
    } else {
      console.warn(`⚠️ IndexNow returned non-standard status: ${responseCode.status}. Response: ${responseCode.body}`);
    }
  } catch (err) {
    console.warn(`⚠️ IndexNow submission encountered a network warning (non-fatal): ${err.message}`);
  }
}

main();
