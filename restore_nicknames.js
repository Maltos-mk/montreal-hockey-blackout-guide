const fs = require('fs');

// Montreal
let mtlHtml = fs.readFileSync('teams/montreal/index.html', 'utf-8');
mtlHtml = mtlHtml.replace(/content="Montreal blackout rules/g, 'content="Habs blackout rules');
mtlHtml = mtlHtml.replace(/watch Montreal Canadiens online/g, 'watch Habs online');
mtlHtml = mtlHtml.replace(/Montreal Keywords/g, 'Habs Keywords');
mtlHtml = mtlHtml.replace(/Montreal Canadiens game tonight, Montreal blackout rules/g, 'Montreal Canadiens game tonight, Habs blackout rules');
fs.writeFileSync('teams/montreal/index.html', mtlHtml);

let mtlJson = fs.readFileSync('data/mtl.json', 'utf-8');
mtlJson = mtlJson.replace(/"nickname": "Montreal"/g, '"nickname": "Habs"');
fs.writeFileSync('data/mtl.json', mtlJson);

let mtlJs = fs.readFileSync('teams/montreal/blackout.js', 'utf-8');
mtlJs = mtlJs.replace(/Montreal Fans:/g, 'Habs Fans:');
fs.writeFileSync('teams/montreal/blackout.js', mtlJs);

// Toronto
let torHtml = fs.readFileSync('teams/toronto/index.html', 'utf-8');
torHtml = torHtml.replace(/content="Toronto blackout rules/g, 'content="Leafs blackout rules');
torHtml = torHtml.replace(/watch Toronto Maple Leafs online/g, 'watch Leafs online');
torHtml = torHtml.replace(/Toronto Keywords/g, 'Leafs Keywords');
fs.writeFileSync('teams/toronto/index.html', torHtml);

let torJson = fs.readFileSync('data/tor.json', 'utf-8');
torJson = torJson.replace(/"nickname": "Toronto"/g, '"nickname": "Leafs"');
fs.writeFileSync('data/tor.json', torJson);

let torJs = fs.readFileSync('teams/toronto/blackout.js', 'utf-8');
torJs = torJs.replace(/Toronto Fans:/g, 'Leafs Fans:');
fs.writeFileSync('teams/toronto/blackout.js', torJs);

console.log("Restored nicknames to content and SEO keywords!");
