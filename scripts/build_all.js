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
  
  html = html.replace(/shared\/app\.css/g, `shared/app.css?v=${timestamp}`);
  html = html.replace(/shared\/app\.js/g, `shared/app.js?v=${timestamp}`);
  html = html.replace(/shared\/i18n\.js/g, `shared/i18n.js?v=${timestamp}`);
  html = html.replace(/data\.json/g, `data.json?v=${timestamp}`);
  
  
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
masterSitemap += '</urlset>';
fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), masterSitemap);
execSync('node scripts/qa_validator.js', { stdio: 'inherit' });
