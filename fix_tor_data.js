const fs = require('fs');

const nhl = JSON.parse(fs.readFileSync('nhl_tor.json', 'utf-8'));
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTime(d) {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; 
  return `${h}:${m} ${ampm}`;
}

const out = {
  team: {
    id: "TOR",
    name: "Toronto Maple Leafs",
    nickname: "Leafs",
    colors: { primary: "#00205B", secondary: "#003087", dark: "#00133A" },
    marketRegion: { description: "Ontario (excl. Ottawa Valley)", regionCode: "tor_territory" }
  },
  schedule: []
};

nhl.games.forEach(g => {
  if (g.gameType !== 2) return;
  
  const d = new Date(g.startTimeUTC);
  const iso = g.startTimeUTC;
  const dayName = days[d.getDay()];
  const monthName = months[d.getMonth()];
  const dateStr = `${dayName}, ${monthName} ${d.getDate()}, ${d.getFullYear()}`;
  
  const isHome = g.homeTeam.abbrev === 'TOR';
  const opp = isHome ? g.awayTeam : g.homeTeam;
  const vs = `${isHome ? 'vs' : '@'} ${opp.placeName.default} ${opp.commonName.default}`;
  
  let networks = [];
  if (g.tvBroadcasts) {
    g.tvBroadcasts.forEach(b => {
      if (b.countryCode === 'CA') networks.push(b.network);
    });
  }
  
  let netEN = "TBA";
  let type = "national";
  
  // Rule-based classification
  if (dayName === 'Mon') {
    netEN = 'Prime Video';
    type = 'national';
  } else if (dayName === 'Wed' || dayName === 'Sat') {
    netEN = 'Sportsnet';
    type = 'national';
  } else {
    // Tue, Thu, Fri, Sun are typically regional, EXCEPT if there's a strong national flag
    if (networks.includes('SN360') || networks.includes('SN1') || networks.includes('CBC') || networks.includes('CITY')) {
      netEN = 'Sportsnet';
      type = 'national';
    } else if (networks.some(n => n.includes('SN'))) {
      netEN = 'Sportsnet Ontario';
      type = 'regional_tor';
    } else {
      netEN = 'TSN4';
      type = 'regional_tor';
    }
  }

  out.schedule.push({
    id: g.id.toString(),
    iso: iso,
    phase: "regular",
    date: dateStr,
    vs: vs,
    type: type,
    netEN: netEN,
    netFR: networks.includes('TVAS') ? 'TVA Sports' : (networks.includes('RDS') ? 'RDS' : ''),
    time: formatTime(d),
    venue: isHome ? "Scotiabank Arena" : g.venue.default,
    note: ""
  });
});

fs.writeFileSync('data/tor.json', JSON.stringify(out, null, 2));
console.log('Fixed tor.json data.');
