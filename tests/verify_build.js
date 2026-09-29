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
const evalMatch = appJs.match(/function evaluateGame\(g, state\)\s*\{[\s\S]*?return \{ canEN, reasonEN, isBlackedOutEN, canFR, reasonFR, isBlackedOutFR \};\n\}/);
if (!evalMatch) {
  console.error(`❌ [app.js] Missing evaluateGame logic!`);
  errors++;
} else {
  console.log(`✅ [app.js] Universal Engine found`);
}

global.window = {};
eval(evalMatch[0]);

console.log('\n--- Evaluating Truth Matrix ---');
function runTest(team, networks, game, state, expectedCanEN, expectedCanFR) {
  global.window.TEAM_DATA = { team: { networks } };
  const res = evaluateGame(game, state);
  
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
}

const mtlNetworks = { regionalEN: 'TSN2', regionalFR: 'RDS', nationalEN: ['Sportsnet', 'Prime Video'], nationalFR: ['TVA Sports'] };
const mtlGamePrime = { netEN: 'Prime Video', netFR: 'Prime Video', type: 'prime_monday' };
const mtlGameTSN = { netEN: 'TSN2', netFR: 'RDS', type: 'regional_mtl' };
const mtlGameSN = { netEN: 'Sportsnet', netFR: 'TVA Sports', type: 'national' };

runTest('Montreal', mtlNetworks, mtlGameTSN, { region: 'in_market', subs: { regional_en: true, regional_fr: true } }, true, true);
runTest('Montreal', mtlNetworks, mtlGameTSN, { region: 'out_market_canada', subs: { regional_en: true, regional_fr: true, sn_prem: false, centre_ice_fr: false } }, false, false);
runTest('Montreal', mtlNetworks, mtlGameTSN, { region: 'out_market_canada', subs: { sn_prem: true } }, true, true);
runTest('Montreal', mtlNetworks, mtlGameTSN, { region: 'out_market_canada', subs: { centre_ice_fr: true } }, false, true);

const torNetworks = { regionalEN: 'TSN4', regionalFR: null, nationalEN: ['Sportsnet', 'Prime Video'], nationalFR: ['TVA Sports'] };
runTest('Toronto', torNetworks, { netEN: 'TSN4' }, { region: 'out_market_canada', subs: { regional_en: true, sn_prem: false } }, false, undefined);
runTest('Toronto', torNetworks, { netEN: 'TSN4' }, { region: 'out_market_canada', subs: { regional_en: true, sn_prem: true } }, true, undefined);

if (errors > 0) {
  console.error(`\n🚨 Build verification failed with ${errors} errors. Deployment aborted.`);
  process.exit(1);
} else {
  console.log(`\n🚀 All checks passed! Proceeding to deployment.`);
}
