const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Per-site IndexNow endpoint and sitemap configuration.
 * Keep in sync with deployed `<key>.txt` verification files on each domain.
 */
const SITE_CONFIGS = {
  com: {
    host: 'hockeyblackouts.com',
    key: '68ca54b3a94f5825cf4f6ca859c94e8f',
    sitemapPath: path.join(__dirname, '../build_com/sitemap.xml'),
    supportsGameFilter: false
  },
  ca: {
    host: 'hockeyblackouts.ca',
    key: '0e7615e8d257218fdc00d074f25a4247',
    sitemapPath: path.join(__dirname, '../build/sitemap.xml'),
    supportsGameFilter: true
  }
};

/**
 * Parse CLI arguments. Defaults to `--site=com` and dry-run mode unless `--live` is passed.
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const siteFlag = argv.find((arg) => arg.startsWith('--site='));
  const siteArg = siteFlag ? siteFlag.split('=')[1] : 'com';
  const validSites = [...Object.keys(SITE_CONFIGS), 'all'];

  if (!validSites.includes(siteArg)) {
    console.error(`❌ Invalid --site value "${siteArg}". Expected one of: ${validSites.join(', ')}`);
    process.exit(1);
  }

  const hubsOnly = argv.includes('--hubs-only');
  const isLive = argv.includes('--live') && !argv.includes('--dry-run');
  return { siteArg, hubsOnly, isLive };
}

/**
 * Read a site's built sitemap.xml and select URLs eligible for IndexNow submission.
 * When `supportsGameFilter` is enabled, `/game/YYYY-MM-DD/` URLs are skipped if `hubsOnly`
 * is true, or restricted to a rolling `-1..+2` day window to avoid Bing bulk-churn penalties.
 * @param {object} config
 * @param {{ hubsOnly: boolean, now: Date }} options
 * @returns {string[]}
 */
function collectSiteUrls(config, { hubsOnly, now }) {
  if (!fs.existsSync(config.sitemapPath)) {
    console.error(`❌ SITEMAP NOT FOUND: ${config.sitemapPath}. Build the site first.`);
    process.exit(1);
  }

  const sitemapXml = fs.readFileSync(config.sitemapPath, 'utf-8');
  const escapedHost = config.host.replace(/\./g, '\\.');
  const locRegex = new RegExp(`<loc>(https:\\/\\/${escapedHost}\\/[^<]*)<\\/loc>`, 'g');
  const urls = [];
  let match;

  while ((match = locRegex.exec(sitemapXml)) !== null) {
    const url = match[1];
    const gameDateMatch = config.supportsGameFilter
      ? url.match(/\/game\/(\d{4}-\d{2}-\d{2})\//)
      : null;

    if (!gameDateMatch) {
      urls.push(url);
      continue;
    }

    if (hubsOnly) {
      continue;
    }

    const gameDate = new Date(`${gameDateMatch[1]}T12:00:00Z`);
    const diffDays = (gameDate - now) / (1000 * 60 * 60 * 24);
    if (diffDays >= -1 && diffDays <= 2) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Submit a prepared IndexNow batch payload to api.indexnow.org.
 * @param {{ host: string, key: string, keyLocation: string, urlList: string[] }} payload
 */
async function submitBatch(payload) {
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

  console.log(`🚀 [${payload.host}] Submitting ${payload.urlList.length} URLs to IndexNow API (api.indexnow.org)...`);

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, body });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('IndexNow request timed out after 10 seconds.'));
      });

      req.write(postData);
      req.end();
    });

    if (response.status === 200 || response.status === 202) {
      const detail = response.status === 200 ? 'OK' : 'Accepted/Pending Key Validation';
      console.log(`✅ [${payload.host}] IndexNow submission successful! Status: ${response.status} (${detail})`);
    } else {
      console.warn(`⚠️ [${payload.host}] IndexNow returned non-standard status: ${response.status}. Response: ${response.body}`);
    }
  } catch (err) {
    console.warn(`⚠️ [${payload.host}] IndexNow submission encountered a network warning (non-fatal): ${err.message}`);
  }
}

async function processSite(siteKey, { hubsOnly, isLive, now }) {
  const config = SITE_CONFIGS[siteKey];
  const urls = collectSiteUrls(config, { hubsOnly, now });

  if (urls.length === 0) {
    console.warn(`⚠️ [${config.host}] No URLs found in sitemap.xml to submit to IndexNow.`);
    return;
  }

  const payload = {
    host: config.host,
    key: config.key,
    keyLocation: `https://${config.host}/${config.key}.txt`,
    urlList: urls
  };

  console.log(`📡 [${config.host}] IndexNow selected ${urls.length} URLs.`);

  if (!isLive) {
    console.log(`🧪 [${config.host}] Dry Run Mode (pass --live to submit):`);
    console.log(`   Host: ${payload.host}`);
    console.log(`   Key Location: ${payload.keyLocation}`);
    console.log(`   URL Count: ${payload.urlList.length}`);
    console.log('   Sample URLs:', payload.urlList.slice(0, 5));
    return;
  }

  await submitBatch(payload);
}

async function main() {
  const { siteArg, hubsOnly, isLive } = parseArgs(process.argv.slice(2));
  const targetSites = siteArg === 'all' ? Object.keys(SITE_CONFIGS) : [siteArg];
  const now = new Date();

  for (const siteKey of targetSites) {
    await processSite(siteKey, { hubsOnly, isLive, now });
  }
}

main();
