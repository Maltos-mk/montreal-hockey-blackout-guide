const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

const team = process.argv[2] || 'montreal';
const buildDir = path.join(__dirname, '../build_' + team);

console.log(`Building production environment for: ${team}`);

const portMapping = {
  'toronto': 8080, 'montreal': 8081, 'ottawa': 8082,
  'vancouver': 8083, 'calgary': 8084, 'edmonton': 8085, 'winnipeg': 8086
};
const PORT = portMapping[team] || 8080;


// 1. Clean build dir
execSync(`rm -rf build_${team} && mkdir build_${team}`);

// 2. Copy files mimicking deploy-teams.yml
execSync(`cp -r shared build_${team}/`);

const teamMap = {
  'montreal': 'mtl', 'toronto': 'tor', 'ottawa': 'ott',
  'vancouver': 'van', 'calgary': 'cgy', 'edmonton': 'edm', 'winnipeg': 'wpg'
};
const jsonName = teamMap[team];
execSync(`cp -r data/${jsonName}.json build_${team}/data.json`);
execSync(`cp -r teams/${team}/* build_${team}/`);

// 3. Fix paths
execSync(`sed -i '' 's|\\.\\./\\.\\./shared/|shared/|g' build_${team}/index.html`);
execSync(`sed -i '' 's|\\.\\./\\.\\./data/.*\\.json|data.json|g' build_${team}/index.html`);

// 4. Inject cache-busters
const timestamp = Date.now();
execSync(`sed -i '' "s|shared/app.css|shared/app.css?v=${timestamp}|g" build_${team}/index.html`);
execSync(`sed -i '' "s|shared/app.js|shared/app.js?v=${timestamp}|g" build_${team}/index.html`);
execSync(`sed -i '' "s|shared/i18n.js|shared/i18n.js?v=${timestamp}|g" build_${team}/index.html`);
execSync(`sed -i '' "s|data.json|data.json?v=${timestamp}|g" build_${team}/index.html`);

console.log(`✅ Build complete. Serving at http://localhost:${PORT}`);

// 5. Serve
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
  let filePath = path.join(buildDir, req.url.split('?')[0]);
  if (filePath === buildDir + '/') filePath = path.join(buildDir, 'index.html');
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}).listen(PORT);
