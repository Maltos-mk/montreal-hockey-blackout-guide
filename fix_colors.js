const fs = require('fs');

let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');

html = html.replace("teamPrimary: '#AF1E2D',", "teamPrimary: '#00205B',");
html = html.replace("teamSecondary: '#192168',", "teamSecondary: '#003087',");
html = html.replace("teamDark: '#871420',", "teamDark: '#00133A',");

fs.writeFileSync('teams/toronto/index.html', html);
