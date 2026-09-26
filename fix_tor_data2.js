const fs = require('fs');
const nhl = JSON.parse(fs.readFileSync('nhl_tor.json', 'utf-8'));
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTime(d) {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 ? h % 12 : 12; 
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
  const dayName = days[d.getDay()];
  const dateStr = `${dayName}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const isHome = g.homeTeam.abbrev === 'TOR';
  const opp = isHome ? g.awayTeam : g.homeTeam;
  const vs = `${isHome ? 'vs' : '@'} ${opp.placeName.default} ${opp.commonName.default}`;
  
  let caBroadcasts = [];
  if (g.tvBroadcasts) {
    caBroadcasts = g.tvBroadcasts.filter(b => b.countryCode === 'CA');
  }
  
  let netEN = "TBA";
  let type = "national";
  let hasNationalEN = false;

  caBroadcasts.forEach(b => {
    if (b.market === 'N' && b.network !== 'TVAS' && b.network !== 'TVAS2' && b.network !== 'RDS') {
      hasNationalEN = true;
      if (b.network.includes('SN')) netEN = 'Sportsnet';
      if (b.network.includes('Prime')) netEN = 'Prime Video';
      if (b.network.includes('CBC')) netEN = 'Sportsnet';
    }
  });

  if (!hasNationalEN) {
    if (dayName === 'Mon') {
      netEN = 'Prime Video';
      type = 'national';
    } else if (dayName === 'Wed' || dayName === 'Sat') {
      netEN = 'Sportsnet';
      type = 'national';
    } else {
      // Must be a regional game since there's no National EN broadcast.
      type = 'regional_tor';
      // Look for SNO or assume TSN4
      let hasSNO = caBroadcasts.some(b => b.network === 'SNO' || b.network === 'SN');
      if (hasSNO) {
        netEN = 'Sportsnet Ontario';
      } else {
        netEN = 'TSN4';
      }
    }
  }

  // Force National explicitly for Season Opener Sep 29 just in case API missed it
  if (g.id.toString() === '2026020002') {
     netEN = 'Sportsnet';
     type = 'national';
  }

  out.schedule.push({
    id: g.id.toString(),
    iso: g.startTimeUTC,
    phase: "regular",
    date: dateStr,
    vs: vs,
    type: type,
    netEN: netEN,
    netFR: caBroadcasts.some(b => b.network.includes('TVA')) ? 'TVA Sports' : (caBroadcasts.some(b => b.network.includes('RDS')) ? 'RDS' : ''),
    time: formatTime(d),
    venue: isHome ? "Scotiabank Arena" : g.venue.default,
    note: ""
  });
});

fs.writeFileSync('data/tor.json', JSON.stringify(out, null, 2));
