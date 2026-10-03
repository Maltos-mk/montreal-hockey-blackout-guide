const fs = require('fs');
const https = require('https');

const teams = {
  'MTL': 'data/mtl.json',
  'TOR': 'data/tor.json',
  'OTT': 'data/ott.json',
  'VAN': 'data/van.json',
  'CGY': 'data/cgy.json',
  'EDM': 'data/edm.json',
  'WPG': 'data/wpg.json'
};

const networkMap = {
  'Prime': 'Prime Video',
  'SNE': 'Sportsnet East',
  'SNO': 'Sportsnet Ontario',
  'SNP': 'Sportsnet Pacific',
  'SNW': 'Sportsnet West',
  'SN': 'Sportsnet',
  'SN1': 'Sportsnet One',
  'SN360': 'Sportsnet 360',
  'TVAS': 'TVA Sports',
  'TVAS2': 'TVA Sports 2',
  'RDS': 'RDS',
  'RDS2': 'RDS2',
  'TSN2': 'TSN2',
  'TSN4': 'TSN4',
  'TSN5': 'TSN5',
  'CBC': 'CBC',
  'CITY': 'CityTV',
  'ESPN': 'ESPN',
  'TNT': 'TNT'
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function convertDate(dt) {
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }).replace(/,/g, '');
}

async function run() {
  for (const [abbrev, file] of Object.entries(teams)) {
    console.log(`Fetching ${abbrev} 2026-2027...`);
    const live = await fetchJSON(`https://api-web.nhle.com/v1/club-schedule-season/${abbrev}/20262027`);
    const local = JSON.parse(fs.readFileSync(file, 'utf-8'));
    
    const newSchedule = [];
    
    for (const g of live.games) {
      if (g.gameType !== 2) continue; // Only regular season
      
      const dt = new Date(g.startTimeUTC);
      
      let vs = '';
      let opp = '';
      if (g.homeTeam.abbrev === abbrev) {
        vs = `vs ${g.awayTeam.commonName.default}`;
        opp = g.awayTeam.abbrev;
      } else {
        vs = `@ ${g.homeTeam.commonName.default}`;
        opp = g.homeTeam.abbrev;
      }
      
      let netEN = '';
      let netFR = '';
      let type = 'regional';
      
      const broadcasts = g.tvBroadcasts || [];
      const canadianNets = broadcasts.filter(b => b.countryCode === 'CA').map(b => networkMap[b.network] || b.network);
      
      if (canadianNets.includes('Prime Video')) {
        netEN = 'Prime Video';
        netFR = 'Prime Video';
        type = 'prime_wednesday';
      } else {
        let enNets = canadianNets.filter(n => !n.includes('RDS') && !n.includes('TVA'));
        let frNets = canadianNets.filter(n => n.includes('RDS') || n.includes('TVA'));
        
        // Check if there are national networks
        const hasNationalEN = enNets.some(n => n === 'Sportsnet' || n === 'Sportsnet One' || n === 'Sportsnet 360' || n === 'CBC' || n === 'CityTV');
        const hasNationalFR = frNets.some(n => n.includes('TVA Sports'));
        
        if (hasNationalEN || hasNationalFR) {
            type = 'national';
        }
        
        // Fallbacks for regional gaps
        if (enNets.length === 0) {
            if (abbrev === 'MTL') enNets = ['TSN2'];
            if (abbrev === 'TOR') enNets = ['TSN4'];
            if (abbrev === 'OTT') enNets = ['TSN5'];
            if (abbrev === 'VAN') enNets = ['Sportsnet Pacific'];
            if (abbrev === 'CGY') enNets = ['Sportsnet West'];
            if (abbrev === 'EDM') enNets = ['Sportsnet West'];
            if (abbrev === 'WPG') enNets = ['TSN3'];
        }
        if (frNets.length === 0) {
            if (abbrev === 'MTL') frNets = ['RDS'];
            if (abbrev === 'OTT') frNets = ['RDS'];
        }
        
        netEN = enNets.join(', ');
        netFR = frNets.join(', ');
      }
      
      newSchedule.push({
        id: g.id,
        date: convertDate(dt),
        iso: g.startTimeUTC,
        time: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }),
        vs: vs,
        opp: opp,
        venue: g.venue.default,
        netEN: netEN,
        netFR: netFR,
        type: type
      });
    }
    
    local.schedule = newSchedule;
    fs.writeFileSync(file, JSON.stringify(local, null, 2));
    console.log(`Saved ${newSchedule.length} games to ${file}`);
  }
}

run().catch(console.error);
