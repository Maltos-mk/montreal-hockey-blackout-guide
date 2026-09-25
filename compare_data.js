const fs = require('fs');

const oldHtml = fs.readFileSync('index.html', 'utf-8');
const oldDataMatch = oldHtml.match(/const\s+games\s*=\s*(\[[^\]]+\]);/);
let oldKeys = new Set();
if (oldDataMatch) {
  try {
    const oldGames = eval(oldDataMatch[1]);
    oldGames.forEach(g => Object.keys(g).forEach(k => oldKeys.add(k)));
  } catch (e) {}
}

const newGames = require('./data/mtl.json');
let newKeys = new Set();
newGames.forEach(g => Object.keys(g).forEach(k => newKeys.add(k)));

console.log("OLD DATA KEYS:", oldKeys);
console.log("NEW DATA KEYS:", newKeys);
