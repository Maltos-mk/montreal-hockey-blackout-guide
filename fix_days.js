const fs = require('fs');
const path = './data/tor.json';
const tor = JSON.parse(fs.readFileSync(path, 'utf-8'));

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

tor.schedule.forEach(g => {
  const d = new Date(g.iso);
  const dayName = days[d.getDay()];
  const monthName = months[d.getMonth()];
  const dateNum = d.getDate();
  const year = d.getFullYear();
  g.date = `${dayName}, ${monthName} ${dateNum}, ${year}`;
  
  // Quick fix for Monday games to be Prime Video (new Amazon deal)
  if (dayName === 'Mon') {
    g.netEN = 'Prime Video';
    g.type = 'national';
  }
  
  // Saturday games to Sportsnet (National)
  if (dayName === 'Sat') {
    g.netEN = 'Sportsnet';
    g.type = 'national';
  }
});

fs.writeFileSync(path, JSON.stringify(tor, null, 2));
console.log('Fixed days of the week in tor.json.');
