const fs = require('fs');
global.window = global;
const data = JSON.parse(fs.readFileSync('data/mtl.json'));
const games = data.schedule.filter(g => g.iso.includes('2026-09-26'));

eval(fs.readFileSync('teams/montreal/blackout.js', 'utf8'));

for (let g of games) {
  console.log(`\nGame: ${g.id} ${g.vs} - EN: ${g.netEN} FR: ${g.netFR}`);
  console.log('In-market (TSN+RDS):', window.evaluateGame(g, {region: 'in_market', subs: {tsn: true, rds: true}}));
  console.log('In-market (TSN+RDS+Premium):', window.evaluateGame(g, {region: 'in_market', subs: {tsn: true, rds: true, sn_prem: true}}));
}
