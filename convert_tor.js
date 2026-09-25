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
    colors: {
      primary: "#00205B",
      secondary: "#003087",
      dark: "#00133A"
    },
    marketRegion: {
      description: "Ontario (excl. Ottawa Valley)",
      regionCode: "tor_territory"
    }
  },
  schedule: []
};

// Map NHL gameType (1=preseason, 2=regular)
nhl.games.forEach(g => {
  if (g.gameType !== 2) return; // The user said "stick with the 84 games" so skip preseason
  
  const d = new Date(g.startTimeUTC);
  const iso = g.startTimeUTC;
  const dayName = days[d.getDay()];
  const monthName = months[d.getMonth()];
  const dateNum = d.getDate();
  const year = d.getFullYear();
  const dateStr = `${dayName}, ${monthName} ${dateNum}, ${year}`;
  
  const isHome = g.homeTeam.abbrev === 'TOR';
  const opp = isHome ? g.awayTeam : g.homeTeam;
  const vs = `${isHome ? 'vs' : '@'} ${opp.placeName.default} ${opp.commonName.default}`;
  
  // Extract networks
  let networks = [];
  if (g.tvBroadcasts) {
    g.tvBroadcasts.forEach(b => {
      if (b.countryCode === 'CA') {
        networks.push(b.network);
      }
    });
  }
  
  let netEN = "TBA";
  let type = "national";
  
  if (networks.length === 0) {
    if (dayName === 'Mon') netEN = 'Prime Video';
    else if (dayName === 'Sat') netEN = 'Sportsnet';
    else {
      netEN = 'TSN4';
      type = 'regional_tor';
    }
  } else {
    // Basic mapping
    if (networks.includes('CBC') || networks.includes('CITY')) {
      netEN = 'Sportsnet';
      type = 'national';
    } else if (networks.includes('SN') || networks.includes('SN360') || networks.includes('SN1')) {
      netEN = 'Sportsnet';
      type = 'national';
    } else if (networks.includes('SNO')) {
      netEN = 'Sportsnet Ontario';
      type = 'regional_tor';
    } else if (networks.includes('TSN4')) {
      netEN = 'TSN4';
      type = 'regional_tor';
    } else if (networks.includes('Prime')) {
      netEN = 'Prime Video';
      type = 'national';
    } else if (networks.some(n => n.includes('SN'))) {
      netEN = 'Sportsnet';
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
console.log(`Saved ${out.schedule.length} regular season games to data/tor.json.`);
