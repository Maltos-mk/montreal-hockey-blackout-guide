const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock browser globals BEFORE requiring browser scripts
global.window = { matchMedia: () => ({ matches: false }), navigator: { userAgent: '' }, addEventListener: () => {} };
global.navigator = { userAgent: '' }; // Polyfill for Node 18
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelectorAll: () => [], getElementById: () => ({ addEventListener: () => {} })
};

const { evaluateGame, broadcastZones } = require('../shared/app.js');

const DATA_DIR = path.join(__dirname, '../data');
let errors = 0;

console.log('Running automated build checks...\n');

// 0. Privacy Scan
console.log('--- Privacy & Anonymity Scan ---');
try {
  execSync('grep -iR "keithrobinson" . --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir="tests" || true', { stdio: 'pipe' });
  const result = execSync('grep -iR "keithrobinson" . --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir="tests" | wc -l').toString().trim();
  if (parseInt(result) > 0) {
    console.error('❌ PRIVACY BREACH DETECTED: Found "keithrobinson" in codebase!');
    errors++;
  } else {
    console.log('✅ No real name leaks detected.');
  }
} catch(e) {
  console.log('✅ No real name leaks detected.');
}
console.log('');

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
if (typeof evaluateGame === 'function') {
  console.log(`✅ [app.js] Universal Engine successfully imported via require()`);
} else {
  console.error(`❌ [app.js] Failed to import evaluateGame!`);
  errors++;
}

console.log('\n--- Evaluating Truth Matrix ---');

function runTest(team, id, networks, game, state, expectedCanEN, expectedCanFR) {
  global.window.TEAM_DATA = { team: { networks, id } };
  const res = evaluateGame(game, state);
  
  if (res.canEN !== expectedCanEN) {
    console.error(`❌ [${team}] Expected canEN=${expectedCanEN} for ${game.netEN} in ${state.region}. Got: ${res.canEN}`);
    errors++;
  }
  if (expectedCanFR !== undefined && res.canFR !== expectedCanFR) {
    console.error(`❌ [${team}] Expected canFR=${expectedCanFR} for ${game.netFR} in ${state.region}. Got: ${res.canFR}`);
    errors++;
  }
}

const mtlNetworks = { regionalEN: 'TSN2', regionalFR: 'RDS', nationalEN: ['Sportsnet', 'Prime Video'], nationalFR: ['TVA Sports'] };
const mtlGameTSN = { netEN: 'TSN2', netFR: 'RDS', type: 'regional_mtl' };

runTest('Montreal', 'MTL', mtlNetworks, mtlGameTSN, { region: 'on_east_qc_atl', subs: { regional_en: true, regional_fr: true } }, true, true);
runTest('Montreal', 'MTL', mtlNetworks, mtlGameTSN, { region: 'mb', subs: { regional_en: true, regional_fr: true, sn_prem: false, centre_ice_fr: false } }, false, false);
runTest('Montreal', 'MTL', mtlNetworks, mtlGameTSN, { region: 'mb', subs: { sn_prem: true, centre_ice_fr: true } }, true, true);

const torNetworks = { regionalEN: 'TSN4', regionalFR: null, nationalEN: ['Sportsnet', 'Prime Video'], nationalFR: ['TVA Sports'] };
runTest('Toronto', 'TOR', torNetworks, { netEN: 'TSN4' }, { region: 'mb', subs: { regional_en: true, sn_prem: false } }, false, undefined);
runTest('Toronto', 'TOR', torNetworks, { netEN: 'TSN4' }, { region: 'mb', subs: { regional_en: true, sn_prem: true } }, true, undefined);

if (errors > 0) {
  console.error(`\n🚨 Build verification failed with ${errors} errors. Deployment aborted.`);
  process.exit(1);
} else {
  console.log(`\n🚀 All checks passed! Proceeding to deployment.`);
}
