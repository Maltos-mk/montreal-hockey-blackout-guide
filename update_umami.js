const fs = require('fs');

let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');
html = html.replace('YOUR_TORONTO_UMAMI_ID_HERE', 'b68ec99c-ee81-4587-91dc-cd69b239def8');
fs.writeFileSync('teams/toronto/index.html', html);
