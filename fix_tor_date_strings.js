const fs = require('fs');
const path = './data/tor.json';
const tor = JSON.parse(fs.readFileSync(path, 'utf-8'));

tor.schedule.forEach(g => {
  if (g.date) {
    g.date = g.date.replace('2024', '2026').replace('2025', '2027');
  }
  if (g.id && typeof g.id === 'string' && g.id.startsWith('2024')) {
    g.id = g.id.replace('2024', '2026');
  }
});

fs.writeFileSync(path, JSON.stringify(tor, null, 2));
console.log('Fixed tor.json display dates.');
