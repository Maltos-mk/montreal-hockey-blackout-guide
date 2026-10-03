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
  
  fs.writeFileSync(path.join(teamBuildDir, 'index.html'), html);
});

const splashHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canadian NHL Blackout Guides</title>
    <script defer src="https://cloud.umami.is/script.js" data-website-id="b68ec99c-ee81-4587-91dc-cd69b239def8"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; font-weight: 800; tracking: -0.025em; }
        p { font-size: 1.125rem; color: #475569; max-width: 600px; margin-bottom: 2rem; line-height: 1.6; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; width: 100%; max-width: 900px; }
        .card { background: white; padding: 1.5rem; border-radius: 1rem; text-decoration: none; color: #0f172a; font-weight: 700; font-size: 1.25rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); transition: transform 0.2s, box-shadow 0.2s; border: 2px solid transparent; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); border-color: #3b82f6; color: #3b82f6; }
        .mtl { border-top: 4px solid #AF1E2D; }
        .tor { border-top: 4px solid #00205B; }
        .ott { border-top: 4px solid #C52032; }
        .van { border-top: 4px solid #00205B; }
        .cgy { border-top: 4px solid #C8102E; }
        .edm { border-top: 4px solid #FF4C00; }
        .wpg { border-top: 4px solid #041E42; }
    </style>
</head>
<body>
    <h1>NHL Blackout Calculators</h1>
    <p>Select your team below to instantly calculate which games are blacked out in your region, and exactly which networks (Sportsnet, TSN, Amazon Prime) carry the games you want to watch.</p>
    
    <div class="grid">
        <a href="/montreal/" class="card mtl" data-umami-event="splash-nav" data-umami-event-team="MTL">Montreal Canadiens</a>
        <a href="/toronto/" class="card tor" data-umami-event="splash-nav" data-umami-event-team="TOR">Toronto Maple Leafs</a>
        <a href="/ottawa/" class="card ott" data-umami-event="splash-nav" data-umami-event-team="OTT">Ottawa Senators</a>
        <a href="/vancouver/" class="card van" data-umami-event="splash-nav" data-umami-event-team="VAN">Vancouver Canucks</a>
        <a href="/calgary/" class="card cgy" data-umami-event="splash-nav" data-umami-event-team="CGY">Calgary Flames</a>
        <a href="/edmonton/" class="card edm" data-umami-event="splash-nav" data-umami-event-team="EDM">Edmonton Oilers</a>
        <a href="/winnipeg/" class="card wpg" data-umami-event="splash-nav" data-umami-event-team="WPG">Winnipeg Jets</a>
    </div>
</body>
</html>
`;
fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), splashHtml);
console.log('Build complete.');
