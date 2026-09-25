const fs = require('fs');
let js = fs.readFileSync('teams/toronto/blackout.js', 'utf-8');
js = js.replace("g.netEN === 'Prime'", "g.netEN.includes('Prime')");
fs.writeFileSync('teams/toronto/blackout.js', js);
