const fs = require('fs');

function fix(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');
  html = html.replace(/All Games \(\d+\)/g, 'All Games');
  fs.writeFileSync(filePath, html);
}

fix('teams/montreal/index.html');
fix('teams/toronto/index.html');
