const fs = require('fs');

// Scrub index.html
let html = fs.readFileSync('teams/montreal/index.html', 'utf-8');
html = html.replace(/\(Habs\)/g, '');
html = html.replace(/Habs blackout rules/g, 'Montreal blackout rules');
html = html.replace(/watch Habs online/g, 'watch Montreal Canadiens online');
html = html.replace(/content="Habs Guide"/g, 'content="Montreal Guide"');
html = html.replace(/Habs Fans:/g, 'Canadiens Fans:');
html = html.replace(/International & US Habs Viewing/g, 'International & US Montreal Viewing');
html = html.replace(/Habs Keywords/g, 'Montreal Keywords');
fs.writeFileSync('teams/montreal/index.html', html);

// Scrub blackout.js
let js = fs.readFileSync('teams/montreal/blackout.js', 'utf-8');
js = js.replace(/Habs Fans:/g, 'Montreal Fans:');
js = js.replace(/Habs Viewing/g, 'Montreal Viewing');
fs.writeFileSync('teams/montreal/blackout.js', js);

// Scrub manifest.json
let manifest = fs.readFileSync('teams/montreal/manifest.json', 'utf-8');
manifest = manifest.replace(/Habs Guide/g, 'Montreal Guide');
fs.writeFileSync('teams/montreal/manifest.json', manifest);

// Scrub mtl.json nickname
let json = fs.readFileSync('data/mtl.json', 'utf-8');
json = json.replace(/"nickname": "Habs"/g, '"nickname": "Montreal"');
fs.writeFileSync('data/mtl.json', json);

console.log("Scrubbed all Habs references!");
