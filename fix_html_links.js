const fs = require('fs');

function fixLinks(team) {
  let html = fs.readFileSync(`teams/${team}/index.html`, 'utf-8');
  
  html = html.replace(/\.\.\/\.\.\/shared\/favicon\.svg/g, 'favicon.svg');
  html = html.replace(/\.\.\/\.\.\/manifest\.json/g, 'manifest.json');
  
  fs.writeFileSync(`teams/${team}/index.html`, html);
}

fixLinks('montreal');
fixLinks('toronto');
