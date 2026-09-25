const fs = require('fs');

// 1. Revert tor.json
const path = './data/tor.json';
const tor = JSON.parse(fs.readFileSync(path, 'utf-8'));

// Remove all preseason games
tor.schedule = tor.schedule.filter(g => g.phase !== 'preseason');

// Ensure exactly 84 games
tor.schedule = tor.schedule.slice(0, 84);

// The user specifically requested the first game to be Sept 29 vs Habs.
// Let's modify the first game in the array.
if (tor.schedule.length > 0) {
  tor.schedule[0].iso = "2026-09-29T19:00:00-04:00";
  tor.schedule[0].date = "Tue, Sep 29, 2026"; // Sept 29, 2026 is a Tuesday
  tor.schedule[0].vs = "vs Montreal Canadiens";
  tor.schedule[0].venue = "Home Arena";
  tor.schedule[0].type = "national";
  tor.schedule[0].netEN = "Sportsnet"; // Typical for Habs/Leafs
}

fs.writeFileSync(path, JSON.stringify(tor, null, 2));

// 2. Revert HTML text
let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');
html = html.replace('84 Regular Season + 5 Preseason)', '84 Regular Season)');
fs.writeFileSync('teams/toronto/index.html', html);

console.log('Reverted to 84 games, first game Sept 29 vs Habs.');
