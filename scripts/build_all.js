const { execSync } = require("child_process");
const fs = require('fs');
const path = require('path');
const { formatEtDate } = require('./lib/date_utils');

function copySharedAssets(targetRootDir) {
  const destShared = path.join(targetRootDir, 'shared');
  execSync(`cp -r shared ${targetRootDir}/`);
  fs.readdirSync(destShared, { withFileTypes: true }).forEach(entry => {
    if (entry.isFile() && entry.name.endsWith('.backup')) {
      fs.unlinkSync(path.join(destShared, entry.name));
    }
  });
}

console.log('Compiling static Tailwind CSS...');
execSync('npx tailwindcss -i shared/input.css -o shared/tailwind.min.css --minify', { stdio: 'inherit' });

execSync('node scripts/build.js');
const BUILD_DIR = 'build';

if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR);

// The US site (hockeyblackouts.com) is built separately into build_com/ and deployed to Cloudflare Pages.
const BUILD_COM_DIR = 'build_com';
if (fs.existsSync(BUILD_COM_DIR)) {
  fs.rmSync(BUILD_COM_DIR, { recursive: true, force: true });
}

copySharedAssets(BUILD_DIR);
execSync(`cp LICENSE ${BUILD_DIR}/`);
if (fs.existsSync("robots.txt")) fs.copyFileSync("robots.txt", path.join(BUILD_DIR, "robots.txt"));
if (fs.existsSync("shared/favicon-48x48.png")) fs.copyFileSync("shared/favicon-48x48.png", path.join(BUILD_DIR, "favicon.ico"));
const indexNowKeyFile = "0e7615e8d257218fdc00d074f25a4247.txt";
if (fs.existsSync(indexNowKeyFile)) fs.copyFileSync(indexNowKeyFile, path.join(BUILD_DIR, indexNowKeyFile));

const caTeamsMeta = JSON.parse(fs.readFileSync('data/ca_teams.json', 'utf-8'));
const CA_7_IDS = new Set(['MTL', 'TOR', 'OTT', 'VAN', 'CGY', 'EDM', 'WPG']);

const teams = [
  { id: 'mtl', dir: 'montreal' },
  { id: 'tor', dir: 'toronto' },
  { id: 'ott', dir: 'ottawa' },
  { id: 'van', dir: 'vancouver' },
  { id: 'cgy', dir: 'calgary' },
  { id: 'edm', dir: 'edmonton' },
  { id: 'wpg', dir: 'winnipeg' }
];

const all32CaTeams = caTeamsMeta.map(t => ({
  id: t.id.toLowerCase(),
  abbrev: t.id,
  name: t.name,
  dir: t.slug,
  country: t.country,
  colors: t.colors,
  dataPath: CA_7_IDS.has(t.id) ? `data/${t.id.toLowerCase()}.json` : `data/ca/${t.slug}.json`
}));

const timestamp = Date.now();

all32CaTeams.forEach(team => {
  const teamBuildDir = path.join(BUILD_DIR, team.dir);
  fs.mkdirSync(teamBuildDir, { recursive: true });
  
  execSync(`cp -r teams/${team.dir}/* ${teamBuildDir}/`);
  execSync(`cp ${team.dataPath} ${teamBuildDir}/data.json`);
  
  let html = fs.readFileSync(path.join(teamBuildDir, 'index.html'), 'utf-8');
  html = html.replace(/\.\.\/\.\.\/shared\//g, '../shared/');
  html = html.replace(/\.\.\/\.\.\/data\/[a-z0-9_-]+\.json/g, 'data.json');
  
  html = html.replace(/shared\/tailwind\.min\.css(\?v=[0-9]+)?/g, `shared/tailwind.min.css?v=${timestamp}`);
  html = html.replace(/shared\/app\.css(\?v=[0-9]+)?/g, `shared/app.css?v=${timestamp}`);
  html = html.replace(/shared\/app\.js(\?v=[0-9]+)?/g, `shared/app.js?v=${timestamp}`);
  html = html.replace(/shared\/i18n\.js(\?v=[0-9]+)?/g, `shared/i18n.js?v=${timestamp}`);
  html = html.replace(/data\.json(\?v=[0-9]+)?/g, `data.json?v=${timestamp}`);
  
  if (fs.existsSync(path.join(teamBuildDir, 'sitemap.xml'))) {
    let sitemap = fs.readFileSync(path.join(teamBuildDir, 'sitemap.xml'), 'utf-8');
    sitemap = sitemap.replace(/https:\/\/maltos-mk\.github\.io\/[^</]+/g, `https://hockeyblackouts.ca/${team.dir}/`);
    fs.writeFileSync(path.join(teamBuildDir, 'sitemap.xml'), sitemap);
  }

  fs.writeFileSync(path.join(teamBuildDir, 'index.html'), html);
});

const TEAM_CITIES = {
  'MTL': 'Montreal', 'TOR': 'Toronto', 'OTT': 'Ottawa', 'VAN': 'Vancouver',
  'CGY': 'Calgary', 'EDM': 'Edmonton', 'WPG': 'Winnipeg', 'BOS': 'Boston',
  'BUF': 'Buffalo', 'DET': 'Detroit', 'FLA': 'Florida', 'TBL': 'Tampa Bay',
  'CAR': 'Carolina', 'NJD': 'New Jersey', 'NYI': 'New York', 'NYR': 'New York',
  'PHI': 'Philadelphia', 'PIT': 'Pittsburgh', 'WSH': 'Washington', 'CBJ': 'Columbus',
  'CHI': 'Chicago', 'COL': 'Colorado', 'DAL': 'Dallas', 'MIN': 'Minnesota',
  'NSH': 'Nashville', 'STL': 'St Louis', 'UTA': 'Utah', 'ANA': 'Anaheim',
  'LAK': 'Los Angeles', 'SJS': 'San Jose', 'SEA': 'Seattle', 'VGK': 'Vegas'
};

const TEAM_NAMES = {
  'MTL': 'Montreal Canadiens', 'TOR': 'Toronto Maple Leafs', 'OTT': 'Ottawa Senators',
  'VAN': 'Vancouver Canucks', 'CGY': 'Calgary Flames', 'EDM': 'Edmonton Oilers',
  'WPG': 'Winnipeg Jets', 'BOS': 'Boston Bruins', 'BUF': 'Buffalo Sabres',
  'DET': 'Detroit Red Wings', 'FLA': 'Florida Panthers', 'TBL': 'Tampa Bay Lightning',
  'CAR': 'Carolina Hurricanes', 'NJD': 'New Jersey Devils', 'NYI': 'New York Islanders',
  'NYR': 'New York Rangers', 'PHI': 'Philadelphia Flyers', 'PIT': 'Pittsburgh Penguins',
  'WSH': 'Washington Capitals', 'CBJ': 'Columbus Blue Jackets', 'CHI': 'Chicago Blackhawks',
  'COL': 'Colorado Avalanche', 'DAL': 'Dallas Stars', 'MIN': 'Minnesota Wild',
  'NSH': 'Nashville Predators', 'STL': 'St. Louis Blues', 'UTA': 'Utah Mammoth',
  'ANA': 'Anaheim Ducks', 'LAK': 'Los Angeles Kings', 'SJS': 'San Jose Sharks',
  'SEA': 'Seattle Kraken', 'VGK': 'Vegas Golden Knights'
};

function slugifyCity(cityName) {
  return cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const now = new Date();
const threeHoursThirtyMs = 3.5 * 60 * 60 * 1000;
const allUniqueUpcoming = new Map();

teams.forEach(team => {
  const data = JSON.parse(fs.readFileSync(`data/${team.id}.json`, 'utf-8'));
  data.schedule.forEach(g => {
    const gDate = new Date(g.iso);
    if ((now.getTime() - gDate.getTime()) > threeHoursThirtyMs) return;

    const isHome = g.vs.startsWith('vs ');
    const homeId = isHome ? data.team.id : g.opp;
    const awayId = isHome ? g.opp : data.team.id;
    const homeCity = TEAM_CITIES[homeId] || homeId;
    const awayCity = TEAM_CITIES[awayId] || awayId;
    const datePrefix = formatEtDate(g.iso);
    const matchKey = `${datePrefix}_${homeId}_${awayId}`;

    if (!allUniqueUpcoming.has(matchKey)) {
      const homeSlug = slugifyCity(homeCity);
      const awaySlug = slugifyCity(awayCity);
      const gameUrl = `/game/${datePrefix}/${homeSlug}-vs-${awaySlug}/`;
      
      allUniqueUpcoming.set(matchKey, {
        game: g,
        homeName: TEAM_NAMES[homeId] || homeCity,
        awayName: TEAM_NAMES[awayId] || awayCity,
        gameUrl,
        primaryTeamDir: team.dir,
        primaryTeamName: data.team.name,
        timestamp: gDate.getTime()
      });
    }
  });
});

const sortedUpcoming = Array.from(allUniqueUpcoming.values())
  .sort((a, b) => a.timestamp - b.timestamp)
  .slice(0, 10);

const splashUpcomingHtml = sortedUpcoming.map(item => `
  <div class="matchup-card bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition flex flex-col justify-between gap-3" data-timestamp="${item.timestamp}">
    <div>
      <div class="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        <span>${item.game.date} • ${item.game.time || '7:00 PM ET'}</span>
        <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-teamPrimary dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">${item.game.netEN || 'Sportsnet'}</span>
      </div>
      <h3 class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">${item.awayName} @ ${item.homeName}</h3>
      <div class="text-xs text-slate-500 dark:text-slate-400 mt-1"><i class="fa-solid fa-location-dot text-[11px] mr-1"></i>${item.game.venue}</div>
    </div>
    <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
      <a href="/${item.primaryTeamDir}/" class="font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1">
        <i class="fa-solid fa-shield-halved text-[11px]"></i> ${item.primaryTeamName}
      </a>
      <a href="${item.gameUrl}" class="font-bold text-teamPrimary dark:text-rose-400 hover:underline flex items-center gap-1">
        <span>Can I Watch? &rarr;</span>
      </a>
    </div>
  </div>
`).join('\n');

const splashUsTeamsInCaHtml = all32CaTeams
  .filter(t => t.country === 'US')
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(t => {
    const borderColor = (t.colors && t.colors.primary) || '#AF1E2D';
    return `          <a href="/${t.dir}/" style="border-left: 6px solid ${borderColor};" class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition flex items-center justify-between gap-3 group">
            <div>
              <span class="font-bold text-base sm:text-lg text-slate-900 dark:text-white block">${t.name}</span>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Sportsnet • Prime Video • SN+ Premium</span>
            </div>
            <span class="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition font-bold">&rarr;</span>
          </a>`;
  })
  .join('\n');

let splashHtml = fs.readFileSync('templates/splash.html', 'utf-8');
splashHtml = splashHtml.replace(/\{\{SPLASH_UPCOMING_MATCHUPS_HTML\}\}/g, splashUpcomingHtml);
splashHtml = splashHtml.replace(/\{\{SPLASH_US_TEAMS_IN_CA_HTML\}\}/g, splashUsTeamsInCaHtml);
fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), splashHtml);

// Build Phase 2 Per-Game Matchup Pages
execSync('node scripts/build_game_pages.js', { stdio: 'inherit' });

// Build Phase 3 Evergreen Explainer & Methodology Pages
execSync('node scripts/build_explainers.js', { stdio: 'inherit' });

// Build French Montreal Hub (/fr/montreal/)
execSync('node scripts/build_fr.js', { stdio: 'inherit' });

// Build Phase 4 OpenGraph 1200x630 Social Preview Cards
execSync('node scripts/generate_og_cards.js', { stdio: 'inherit' });

// Build the US site (hockeyblackouts.com) into build_com/: homepage at / and one hub per team at /[slug]/.
// Nothing US-built is written into build/, so hockeyblackouts.ca never serves /us/.
execSync('node scripts/generate_us_team_pages.js', { stdio: 'inherit' });

// Assemble the rest of the .com package: shared assets, OG image, robots.txt, sitemap.xml
copySharedAssets(BUILD_COM_DIR);
execSync(`cp LICENSE ${BUILD_COM_DIR}/`);
if (fs.existsSync('shared/favicon-48x48.png')) fs.copyFileSync('shared/favicon-48x48.png', path.join(BUILD_COM_DIR, 'favicon.ico'));
// IndexNow ownership key for hockeyblackouts.com (separate from the .ca key above)
const indexNowKeyFileCom = "68ca54b3a94f5825cf4f6ca859c94e8f.txt";
fs.copyFileSync(indexNowKeyFileCom, path.join(BUILD_COM_DIR, indexNowKeyFileCom));
fs.mkdirSync(path.join(BUILD_COM_DIR, 'og'), { recursive: true });
fs.writeFileSync(path.join(BUILD_COM_DIR, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: https://hockeyblackouts.com/sitemap.xml\n');
const usTeamsMeta = JSON.parse(fs.readFileSync('data/us_teams.json', 'utf-8'));
const comLastmod = new Date().toISOString().split('T')[0];
let comSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://hockeyblackouts.com/</loc>\n    <lastmod>${comLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
usTeamsMeta.forEach(t => {
  comSitemap += `  <url>\n    <loc>https://hockeyblackouts.com/${t.slug}/</loc>\n    <lastmod>${comLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
});
comSitemap += '</urlset>\n';
fs.writeFileSync(path.join(BUILD_COM_DIR, 'sitemap.xml'), comSitemap);

console.log('Build complete.');

const buildDateIso = now.toISOString().split('T')[0];

let masterSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://hockeyblackouts.ca/</loc>
    <lastmod>${buildDateIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
all32CaTeams.forEach(team => {
  masterSitemap += `  <url>
    <loc>https://hockeyblackouts.ca/${team.dir}/</loc>
    <lastmod>${buildDateIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${team.country === 'CA' ? '0.9' : '0.85'}</priority>
  </url>\n`;
});
masterSitemap += `  <url>
    <loc>https://hockeyblackouts.ca/fr/montreal/</loc>
    <lastmod>${buildDateIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;

const explainerSlugs = [
  'sportsnet-plus-blackout-rules',
  'prime-hockey-schedule-canada',
  'rds-vs-tva-sports-blackouts',
  'how-blackouts-work',
  'tsn-hockey-blackout-rules'
];
explainerSlugs.forEach(slug => {
  masterSitemap += `  <url>
    <loc>https://hockeyblackouts.ca/${slug}/</loc>
    <lastmod>${buildDateIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>\n`;
});

// Add active game URLs to master sitemap (rolling window: past 7 days through next 14 days),
// capped so total sitemap URLs never exceed 80 across /, 32 team hubs, /fr/montreal/, and 5 explainers.
// Synchronized with scripts/build_game_pages.js POST_GAME_RETENTION_DAYS = 7
const POST_GAME_RETENTION_DAYS = 7;
const CA_SITEMAP_MAX_URLS = 80;
const evergreenCount = 1 + all32CaTeams.length + 1 + explainerSlugs.length;
const maxGameUrls = Math.max(0, CA_SITEMAP_MAX_URLS - evergreenCount);
const gamesBaseDir = path.join(BUILD_DIR, 'game');
if (fs.existsSync(gamesBaseDir) && maxGameUrls > 0) {
  const todayEt = formatEtDate(now.toISOString());
  const gameCandidates = [];
  const dates = fs.readdirSync(gamesBaseDir);
  dates.forEach(date => {
    const gameDate = new Date(date + 'T23:59:59Z');
    const daysDiff = (now - gameDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > POST_GAME_RETENTION_DAYS || daysDiff < -14) return;

    const datePath = path.join(gamesBaseDir, date);
    if (fs.statSync(datePath).isDirectory()) {
      const matchups = fs.readdirSync(datePath);
      matchups.forEach(matchup => {
        const htmlPath = path.join(datePath, matchup, 'index.html');
        if (fs.existsSync(htmlPath)) {
          const content = fs.readFileSync(htmlPath, 'utf-8');
          if (content.includes('http-equiv="refresh"')) return;
        }
        gameCandidates.push({ date, matchup });
      });
    }
  });

  // Prioritize upcoming/today games soonest-first, then most recent past games
  gameCandidates.sort((a, b) => {
    const aUpcoming = a.date >= todayEt ? 0 : 1;
    const bUpcoming = b.date >= todayEt ? 0 : 1;
    if (aUpcoming !== bUpcoming) return aUpcoming - bUpcoming;
    if (aUpcoming === 0) {
      return a.date.localeCompare(b.date) || a.matchup.localeCompare(b.matchup);
    }
    return b.date.localeCompare(a.date) || a.matchup.localeCompare(b.matchup);
  });

  gameCandidates.slice(0, maxGameUrls).forEach(({ date, matchup }) => {
    masterSitemap += `  <url>
    <loc>https://hockeyblackouts.ca/game/${date}/${matchup}/</loc>
    <lastmod>${buildDateIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  });
}

masterSitemap += '</urlset>';
fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), masterSitemap);
execSync('node scripts/i18n_check.js', { stdio: 'inherit' });
execSync('node scripts/qa_validator.js', { stdio: 'inherit' });
