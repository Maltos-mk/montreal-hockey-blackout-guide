const fs = require('fs');

let html = fs.readFileSync('teams/ottawa/index.html', 'utf8');

// Strip the entire flex container that held the lang toggles
html = html.replace(
  /<div class="flex items-center space-x-2 bg-black\/25 rounded-xl px-3 py-1\.5 border border-white\/10 text-sm">[\s\S]*?<\/div>\s*<div class="w-full text-center mt-2 hidden" id="frDisclaimer">[\s\S]*?<\/div>/,
  ''
);

fs.writeFileSync('teams/ottawa/index.html', html);
