const { execSync } = require("child_process");
const fs = require('fs');
const path = require('path');

execSync('node scripts/build.js');
const BUILD_DIR = 'build';

if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR);

execSync(`cp -r shared ${BUILD_DIR}/`);
execSync(`cp LICENSE ${BUILD_DIR}/`);
execSync(`cp README.md ${BUILD_DIR}/`);
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

const splashHtml = fs.readFileSync('templates/splash.html', 'utf-8');
fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), splashHtml);

// Build Phase 2 Per-Game Matchup Pages
execSync('node scripts/build_game_pages.js', { stdio: 'inherit' });

console.log('Build complete.');

let masterSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://hockeyblackouts.ca/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
teams.forEach(team => {
  masterSitemap += `  <url>
    <loc>https://hockeyblackouts.ca/${team.dir}/</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
});

// Add active game URLs to master sitemap (Decision D2: drop games older than 7 days)
const gamesBaseDir = path.join(BUILD_DIR, 'game');
if (fs.existsSync(gamesBaseDir)) {
  const dates = fs.readdirSync(gamesBaseDir);
  const now = new Date();
  dates.forEach(date => {
    // If the game date is more than 7 days in the past, drop from sitemap to preserve crawl budget
    const gameDate = new Date(date + 'T23:59:59Z');
    const daysDiff = (now - gameDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) return;

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
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      });
    }
  });
}

masterSitemap += '</urlset>';
fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), masterSitemap);
execSync('node scripts/qa_validator.js', { stdio: 'inherit' });
