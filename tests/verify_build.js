const fs = require('fs');
const path = require('path');

const TEAMS_DIR = path.join(__dirname, '../teams');
const DATA_DIR = path.join(__dirname, '../data');

let errors = 0;

console.log('Running automated build checks...\n');

// 1. Data Schema Validation
console.log('--- Checking JSON Data Schemas ---');
const dataFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
dataFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
  
  if (!data.schedule || !Array.isArray(data.schedule)) {
    console.error(`❌ [${file}] Missing schedule array`);
    errors++;
    return;
  }
  
  data.schedule.forEach((g, i) => {
    const requiredKeys = ['iso', 'date', 'time', 'vs', 'venue', 'netEN', 'type'];
    requiredKeys.forEach(k => {
      if (!(k in g)) {
        console.error(`❌ [${file}] Game ID ${g.id || i} missing required key: ${k}`);
        errors++;
      }
    });
  });
  console.log(`✅ [${file}] Schema valid (${data.schedule.length} games)`);
});

// 2. Logic & Core Engine Validation
console.log('\n--- Checking UI Engine & Blackout Logic ---');
const appJs = fs.readFileSync(path.join(__dirname, '../shared/app.js'), 'utf-8');
if (!appJs.includes('summaryReason') || !appJs.includes('evalRes.status')) {
  console.error(`❌ [app.js] Missing status/summaryReason wrapper logic!`);
  errors++;
} else {
  console.log(`✅ [app.js] UI wrapper logic verified`);
}

// 3. Testing specific matrix conditions for Montreal and Toronto
console.log('\n--- Evaluating Truth Matrix ---');

const mtlJs = fs.readFileSync(path.join(TEAMS_DIR, 'montreal/blackout.js'), 'utf-8');
const torJs = fs.readFileSync(path.join(TEAMS_DIR, 'toronto/blackout.js'), 'utf-8');

function runTest(team, code, game, state, expectedCanEN, expectedCanFR) {
  const mockWindow = {};
  new Function('window', code)(mockWindow);
  const res = mockWindow.evaluateGame(game, state);
  
  let failed = false;
  if (res.canEN !== expectedCanEN) {
    console.error(`❌ [${team}] Expected canEN=${expectedCanEN} for ${game.netEN} in ${state.region} with subs: ${JSON.stringify(state.subs)}. Got: ${res.canEN}`);
    failed = true;
    errors++;
  }
  if (expectedCanFR !== undefined && res.canFR !== expectedCanFR) {
    console.error(`❌ [${team}] Expected canFR=${expectedCanFR} for ${game.netFR} in ${state.region} with subs: ${JSON.stringify(state.subs)}. Got: ${res.canFR}`);
    failed = true;
    errors++;
  }
  if (!failed) {
    // Optional: console.log(`✅ [${team}] Correctly evaluated ${game.netEN}`);
  }
}

// Montreal Tests
const mtlGamePrime = { netEN: 'Prime Video', netFR: 'Prime Video', type: 'prime_monday' };
const mtlGameTSN = { netEN: 'TSN2', netFR: 'RDS', type: 'regional_mtl' };
const mtlGameSN = { netEN: 'Sportsnet', netFR: 'TVA Sports', type: 'national' };

// In-Market Montreal with TSN, RDS, Prime, SN
runTest('Montreal', mtlJs, mtlGameTSN, { region: 'in_market', subs: { tsn: true, rds: true } }, true, true);
runTest('Montreal', mtlJs, mtlGameTSN, { region: 'in_market', subs: { tsn: false, rds: false } }, false, false);
runTest('Montreal', mtlJs, mtlGamePrime, { region: 'in_market', subs: { prime: true } }, true, true);
runTest('Montreal', mtlJs, mtlGamePrime, { region: 'in_market', subs: { prime: false } }, false, false);
runTest('Montreal', mtlJs, mtlGameSN, { region: 'in_market', subs: { sn: true, tva: true } }, true, true);

// Out-of-Market Montreal
runTest('Montreal', mtlJs, mtlGameTSN, { region: 'out_market_canada', subs: { tsn: true, rds: true, sn_prem: false } }, false, false); // Blackout!
runTest('Montreal', mtlJs, mtlGameTSN, { region: 'out_market_canada', subs: { sn_prem: true } }, true, true); // Overridden by SN+ Premium!

// Toronto Tests
const torGamePrime = { netEN: 'Prime', type: 'prime_monday' };
const torGameTSN = { netEN: 'TSN4', type: 'regional_tor' };
const torGameSN = { netEN: 'Sportsnet', type: 'national' };

// In-Market Toronto
runTest('Toronto', torJs, torGameTSN, { region: 'in_market', subs: { tsn: true } }, true, undefined);
runTest('Toronto', torJs, torGameTSN, { region: 'in_market', subs: { tsn: false } }, false, undefined);
runTest('Toronto', torJs, torGamePrime, { region: 'in_market', subs: { prime: true } }, true, undefined);
runTest('Toronto', torJs, torGamePrime, { region: 'in_market', subs: { prime: false } }, false, undefined);
runTest('Toronto', torJs, torGameSN, { region: 'in_market', subs: { sn: true } }, true, undefined);

// Out-of-Market Toronto
runTest('Toronto', torJs, torGameTSN, { region: 'out_market_canada', subs: { tsn: true, sn_prem: false } }, false, undefined); // Blackout!
runTest('Toronto', torJs, torGameTSN, { region: 'out_market_canada', subs: { sn_prem: true } }, true, undefined); // Overridden!

console.log('✅ Tested matrix configurations successfully!');

if (errors > 0) {
  console.error(`\n🚨 Build verification failed with ${errors} errors. Deployment aborted.`);
  process.exit(1);
} else {
  console.log(`\n🚀 All checks passed! Proceeding to deployment.`);
}
