const fs = require('fs');

// Toronto HTML
let torHtml = fs.readFileSync('teams/toronto/index.html', 'utf-8');
torHtml = torHtml.replace('Sportsnet/CBC', 'Sportsnet');
torHtml = torHtml.replace('Sportsnet Ontario, CBC, Amazon', 'Sportsnet Ontario, Sportsnet, Amazon');
torHtml = torHtml.replace('Sportsnet, CBC, Prime Video', 'Sportsnet, Prime Video');
fs.writeFileSync('teams/toronto/index.html', torHtml);

// Toronto JS
let torJs = fs.readFileSync('teams/toronto/blackout.js', 'utf-8');
torJs = torJs.replace("g.netEN.includes('CBC') || g.netEN.includes('CityTV') || ", "");
fs.writeFileSync('teams/toronto/blackout.js', torJs);

// Montreal JS
let mtlJs = fs.readFileSync('teams/montreal/blackout.js', 'utf-8');
mtlJs = mtlJs.replace("g.netEN.includes('CBC') || g.netEN.includes('CityTV') || ", "");
fs.writeFileSync('teams/montreal/blackout.js', mtlJs);

