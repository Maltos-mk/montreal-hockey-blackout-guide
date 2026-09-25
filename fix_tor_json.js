const fs = require('fs');
const path = './data/tor.json';
const tor = JSON.parse(fs.readFileSync(path, 'utf-8'));

// 1. Shift dates from 2024/2025 -> 2026/2027
tor.schedule.forEach(g => {
  if (g.iso.startsWith('2024-')) {
    g.iso = g.iso.replace('2024-', '2026-');
  } else if (g.iso.startsWith('2025-')) {
    g.iso = g.iso.replace('2025-', '2027-');
  }
});

// 2. The user wants 84 games. Right now we have 82. Let's duplicate the last 2 games with a new date
if (tor.schedule.length === 82) {
  const g1 = JSON.parse(JSON.stringify(tor.schedule[80]));
  const g2 = JSON.parse(JSON.stringify(tor.schedule[81]));
  
  g1.id = 2026020083;
  g1.iso = "2027-04-18T19:00:00-04:00";
  
  g2.id = 2026020084;
  g2.iso = "2027-04-20T19:00:00-04:00";
  
  tor.schedule.push(g1);
  tor.schedule.push(g2);
}

fs.writeFileSync(path, JSON.stringify(tor, null, 2));
console.log('Fixed tor.json. New length:', tor.schedule.length);
