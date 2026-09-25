const fs = require('fs');

// Scrub index.html
let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');
html = html.replace(/\(Leafs\)/ig, '');
html = html.replace(/Leafs blackout rules/ig, 'Toronto blackout rules');
html = html.replace(/watch Leafs online/ig, 'watch Toronto Maple Leafs online');
html = html.replace(/content="Leafs Guide"/ig, 'content="Toronto Guide"');
html = html.replace(/Leafs Fans:/ig, 'Toronto Fans:');
fs.writeFileSync('teams/toronto/index.html', html);

// Scrub blackout.js
let js = fs.readFileSync('teams/toronto/blackout.js', 'utf-8');
js = js.replace(/Leafs Fans:/ig, 'Toronto Fans:');
fs.writeFileSync('teams/toronto/blackout.js', js);

// Scrub manifest.json
let manifest = fs.readFileSync('teams/toronto/manifest.json', 'utf-8');
manifest = manifest.replace(/Leafs Guide/ig, 'Toronto Guide');
fs.writeFileSync('teams/toronto/manifest.json', manifest);

// Scrub tor.json nickname
let json = fs.readFileSync('data/tor.json', 'utf-8');
json = json.replace(/"nickname": "Leafs"/ig, '"nickname": "Toronto"');
fs.writeFileSync('data/tor.json', json);

console.log("Scrubbed all Leafs references!");
