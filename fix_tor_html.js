const fs = require('fs');
let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');
html = html.replace('84 Regular Season)', '84 Regular Season + 5 Preseason)');
fs.writeFileSync('teams/toronto/index.html', html);
