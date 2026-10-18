const { execSync } = require("child_process");
const fs = require('fs');
const path = require('path');

console.log('Compiling static Tailwind CSS...');
execSync('npx tailwindcss -i shared/input.css -o shared/tailwind.min.css --minify', { stdio: 'inherit' });

execSync('node scripts/build.js');
const BUILD_DIR = 'build';

if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR);

execSync(`cp -r shared ${BUILD_DIR}/`);
execSync(`cp LICENSE ${BUILD_DIR}/`);
if (fs.existsSync("robots.txt")) fs.copyFileSync("robots.txt", path.join(BUILD_DIR, "robots.txt"));
if (fs.existsSync("shared/favicon-48x48.png")) fs.copyFileSync("shared/favicon-48x48.png", path.join(BUILD_DIR, "favicon.ico"));
const indexNowKeyFile = "0e7615e8d257218fdc00d074f25a4247.txt";
if (fs.existsSync(indexNowKeyFile)) fs.copyFileSync(indexNowKeyFile, path.join(BUILD_DIR, indexNowKeyFile));

const teams = [
  { id: 'mtl', dir: 'montreal' },
  { id: 'tor', dir: 'toronto' },
  { id: 'ott', dir: 'ottawa' },
  { id: 'van', dir: 'vancouver' },
  { id: 'cgy', dir: 'calgary' },
  { id: 'edm', dir: 'edmonton' },
  { id: 'wpg', dir: 'winnipeg' }
];

const timestamp = Date.now();

teams.forEach(team => {
  const teamBuildDir = path.join(BUILD_DIR, team.dir);
  fs.mkdirSync(teamBuildDir);
  
  execSync(`cp -r teams/${team.dir}/* ${teamBuildDir}/`);
  execSync(`cp data/${team.id}.json ${teamBuildDir}/data.json`);
  
  let html = fs.readFileSync(path.join(teamBuildDir, 'index.html'), 'utf-8');
  html = html.replace(/\.\.\/\.\.\/shared\//g, '../shared/');
  html = html.replace(/\.\.\/\.\.\/data\/[a-z]{3}\.json/g, 'data.json');
  
  html = html.replace(/shared\/tailwind\.min\.css(\?v=[0-9]+)?/g, `shared/tailwind.min.css?v=${timestamp}`);
  html = html.replace(/shared\/app\.css(\?v=[0-9]+)?/g, `shared/app.css?v=${timestamp}`);
  html = html.replace(/shared\/app\.js(\?v=[0-9]+)?/g, `shared/app.js?v=${timestamp}`);
  html = html.replace(/shared\/i18n\.js(\?v=[0-9]+)?/g, `shared/i18n.js?v=${timestamp}`);
  html = html.replace(/data\.json(\?v=[0-9]+)?/g, `data.json?v=${timestamp}`);
  
  
  // Update canonicals and sitemap
    
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
    const datePrefix = g.iso.split('T')[0];
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
  <div class="matchup-card" data-timestamp="${item.timestamp}">
    <div>
      <div class="matchup-card-header">
        <span>${item.game.date} • ${item.game.time || '7:00 PM ET'}</span>
        <span class="matchup-badge">${item.game.netEN || 'Sportsnet'}</span>
      </div>
      <h3 class="matchup-card-title">${item.awayName} @ ${item.homeName}</h3>
      <div class="matchup-card-venue"><i class="fa-solid fa-location-dot" style="font-size: 0.7rem; margin-right: 4px;"></i>${item.game.venue}</div>
    </div>
    <div class="matchup-card-footer">
      <a href="/${item.primaryTeamDir}/" class="matchup-link" style="color: var(--text-muted); font-size: 0.75rem;">
        <i class="fa-solid fa-shield-halved" style="font-size: 0.7rem;"></i> ${item.primaryTeamName}
      </a>
      <a href="${item.gameUrl}" class="matchup-link">
        <span>Can I Watch? &rarr;</span>
      </a>
    </div>
  </div>
`).join('\n');

let splashHtml = fs.readFileSync('templates/splash.html', 'utf-8');
splashHtml = splashHtml.replace(/\{\{SPLASH_UPCOMING_MATCHUPS_HTML\}\}/g, splashUpcomingHtml);
fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), splashHtml);

// Build Phase 2 Per-Game Matchup Pages
execSync('node scripts/build_game_pages.js', { stdio: 'inherit' });

// Build Phase 3 Evergreen Explainer & Methodology Pages
execSync('node scripts/build_explainers.js', { stdio: 'inherit' });

// Build French Montreal Hub (/fr/montreal/)
execSync('node scripts/build_fr.js', { stdio: 'inherit' });

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
teams.forEach(team => {
  masterSitemap += `  <url>
    <loc>https://hockeyblackouts.ca/${team.dir}/</loc>
    <lastmod>${buildDateIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
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
  'how-blackouts-work'
];
explainerSlugs.forEach(slug => {
  masterSitemap += `  <url>
    <loc>https://hockeyblackouts.ca/${slug}/</loc>
    <lastmod>${buildDateIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>\n`;
});

// Add active game URLs to master sitemap (rolling window: past 7 days through next 14 days to preserve crawl budget)
const gamesBaseDir = path.join(BUILD_DIR, 'game');
if (fs.existsSync(gamesBaseDir)) {
  const dates = fs.readdirSync(gamesBaseDir);
  dates.forEach(date => {
    const gameDate = new Date(date + 'T23:59:59Z');
    const daysDiff = (now - gameDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7 || daysDiff < -14) return;

    const datePath = path.join(gamesBaseDir, date);
    if (fs.statSync(datePath).isDirectory()) {
      const matchups = fs.readdirSync(datePath);
      matchups.forEach(matchup => {
        const htmlPath = path.join(datePath, matchup, 'index.html');
        if (fs.existsSync(htmlPath)) {
          const content = fs.readFileSync(htmlPath, 'utf-8');
          if (content.includes('http-equiv="refresh"')) return;
        }
        masterSitemap += `  <url>
    <loc>https://hockeyblackouts.ca/game/${date}/${matchup}/</loc>
    <lastmod>${buildDateIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      });
    }
  });
}

masterSitemap += '</urlset>';
fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), masterSitemap);
execSync('node scripts/i18n_check.js', { stdio: 'inherit' });
execSync('node scripts/qa_validator.js', { stdio: 'inherit' });
