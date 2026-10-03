const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = 'build';

if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR);

execSync(`cp -r shared ${BUILD_DIR}/`);
execSync(`cp LICENSE ${BUILD_DIR}/`);
execSync(`cp README.md ${BUILD_DIR}/`);

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
  html = html.replace(/href="https:\/\/maltos-mk\.github\.io\/[^"]+"/g, `href="https://hockeyblackouts.ca/${team.dir}/"`);
  
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
