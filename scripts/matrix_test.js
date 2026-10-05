const fs = require('fs');

// Mock browser globals BEFORE requiring browser scripts
global.window = { matchMedia: () => ({ matches: false }), navigator: { userAgent: '' }, addEventListener: () => {} };
global.navigator = { userAgent: '' };
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelectorAll: () => [], getElementById: () => ({ addEventListener: () => {} })
};

const { evaluateGame, broadcastZones } = require('../shared/app.js');

const teams = ['montreal', 'toronto', 'ottawa', 'vancouver', 'calgary', 'edmonton', 'winnipeg'];
let allPassed = true;

const OOM_MAP = {
  'MTL': 'bc',
  'TOR': 'bc',
  'OTT': 'bc',
  'VAN': 'on_east_qc_atl',
  'CGY': 'on_east_qc_atl',
  'EDM': 'on_east_qc_atl',
  'WPG': 'bc'
};

const mapTeamToAbbrev = {
  'montreal': 'mtl',
  'toronto': 'tor',
  'ottawa': 'ott',
  'vancouver': 'van',
  'calgary': 'cgy',
  'edmonton': 'edm',
  'winnipeg': 'wpg'
};

teams.forEach(teamDir => {
  const abbrev = mapTeamToAbbrev[teamDir];
  const data = JSON.parse(fs.readFileSync(`data/${abbrev}.json`, 'utf-8'));
  const teamId = data.team.id;
  const inMarketRegion = data.team.marketRegion.regionCode;
  const outMarketRegion = OOM_MAP[teamId];
  
  // Test 1: In-Market Guarantee (SN Cable + Regional + Prime = 84 games)
  let inMarketCount = 0;
  global.window.TEAM_DATA = data;
  global.window.TEAM_DATA = data;
  global.window.TEAM_DATA = data;
  data.schedule.forEach(g => {
    const state = { region: inMarketRegion, lang: 'en', subs: { sn_cable: true, prime: true, regional_en: true, sn_plus: true, sn_prem: false } };
    const res = evaluateGame(g, state, teamId);
    if (res.canEN) inMarketCount++;
  });
  if (inMarketCount !== 84) {
    console.error(`❌ IN-MARKET FAIL: ${teamId} yielded ${inMarketCount}/84 games.`);
    allPassed = false;
  } else {
    console.log(`✅ IN-MARKET PASS: ${teamId} yielded 84/84 games.`);
  }

  // Test 2: Out-of-Market Guarantee (SN Premium + Prime = 84 games)
  let oomPremCount = 0;
  data.schedule.forEach(g => {
    const state = { region: outMarketRegion, lang: 'en', subs: { sn_prem: true, prime: true, sn_cable: false, regional_en: false, sn_plus: false } };
    const res = evaluateGame(g, state, teamId);
    if (res.canEN) oomPremCount++;
  });
  if (oomPremCount !== 84) {
    console.error(`❌ OOM-PREMIUM FAIL: ${teamId} yielded ${oomPremCount}/84 games.`);
    allPassed = false;
  } else {
    console.log(`✅ OOM-PREMIUM PASS: ${teamId} yielded 84/84 games.`);
  }

  // Test 3: Out-of-Market Blackout Guarantee (SN Standard + Prime = <84 games)
  let oomStdCount = 0;
  data.schedule.forEach(g => {
    const state = { region: outMarketRegion, lang: 'en', subs: { sn_plus: true, prime: true, sn_cable: false, regional_en: false, sn_prem: false } };
    const res = evaluateGame(g, state, teamId);
    if (res.canEN) oomStdCount++;
  });
  if (oomStdCount === 84) {
    console.error(`❌ OOM-STANDARD FAIL: ${teamId} yielded ${oomStdCount}/84 games (Should be strictly less than 84!).`);
    allPassed = false;
  } else {
    console.log(`✅ OOM-STANDARD PASS: ${teamId} yielded ${oomStdCount}/84 games (Properly blacked out regional games).`);
  }
  
  console.log('---');
});

if (allPassed) {
  console.log('🚀 ALL MATRIX TESTS PASSED!');
} else {
  console.error('💥 MATRIX TESTS FAILED!');
  process.exit(1);
}
