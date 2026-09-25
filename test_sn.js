const fs = require('fs');
const mtlJs = fs.readFileSync('teams/montreal/blackout.js', 'utf-8');
const mockWindow = {};
new Function('window', mtlJs)(mockWindow);

const state = { region: 'in_market', subs: { sn: true, tsn: false, prime: false } };

const snGame = { netEN: 'Sportsnet', netFR: 'TVA Sports', type: 'national' };
const res = mockWindow.evaluateGame(snGame, state);
console.log("SPORTSNET GAME:", res);

const cbcGame = { netEN: 'CBC', netFR: 'TVA Sports', type: 'national' };
const res2 = mockWindow.evaluateGame(cbcGame, state);
console.log("CBC GAME:", res2);

const tsnGame = { netEN: 'TSN2', netFR: 'RDS', type: 'regional' };
const res3 = mockWindow.evaluateGame(tsnGame, state);
console.log("TSN GAME:", res3);

