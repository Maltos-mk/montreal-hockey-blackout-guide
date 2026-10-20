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

  // Test 5: In-Market Sportsnet+ Premium Guarantee for Sportsnet teams (EDM, CGY, VAN)
  const isSnRegionalTeam = data.team.networks.regionalEN && data.team.networks.regionalEN.includes('Sportsnet');
  if (isSnRegionalTeam) {
    let inMarketPremCount = 0;
    data.schedule.forEach(g => {
      const state = { region: inMarketRegion, lang: 'en', subs: { sn_prem: true, prime: true, sn_cable: false, regional_en: false, sn_plus: false, centre_ice: false } };
      const res = evaluateGame(g, state, teamId);
      if (res.canEN) inMarketPremCount++;
    });
    if (inMarketPremCount !== 84) {
      console.error(`❌ IN-MARKET SN+ PREMIUM FAIL: ${teamId} in-market (${inMarketRegion}) with SN+ Premium + Prime yielded ${inMarketPremCount}/84 games (expected 84).`);
      allPassed = false;
    } else {
      console.log(`✅ IN-MARKET SN+ PREMIUM PASS: ${teamId} in-market (${inMarketRegion}) with SN+ Premium + Prime yielded 84/84 games.`);
    }
  }

  // Test 6: In-Market Centre Ice Blackout Check (Centre Ice alone does NOT unlock in-market games)
  let inMarketCentreIceCount = 0;
  data.schedule.forEach(g => {
    const state = { region: inMarketRegion, lang: 'en', subs: { centre_ice: true, prime: true, sn_cable: false, regional_en: false, sn_plus: false, sn_prem: false } };
    const res = evaluateGame(g, state, teamId);
    if (res.canEN) inMarketCentreIceCount++;
  });
  if (inMarketCentreIceCount === 84) {
    console.error(`❌ IN-MARKET CENTRE ICE FAIL: ${teamId} in-market (${inMarketRegion}) with Centre Ice alone yielded ${inMarketCentreIceCount}/84 games (Should NOT unlock in-market games!).`);
    allPassed = false;
  } else {
    console.log(`✅ IN-MARKET CENTRE ICE PASS: ${teamId} in-market (${inMarketRegion}) with Centre Ice alone properly blacked out regional games (${inMarketCentreIceCount}/84).`);
  }

  // Test 7: Out-of-Market Centre Ice Guarantee (Cable SN + Centre Ice + Prime = 84 games)
  let oomCentreIceCount = 0;
  data.schedule.forEach(g => {
    const state = { region: outMarketRegion, lang: 'en', subs: { centre_ice: true, sn_cable: true, prime: true, sn_prem: false, sn_plus: false, regional_en: false } };
    const res = evaluateGame(g, state, teamId);
    if (res.canEN) oomCentreIceCount++;
  });
  // Note: linear cable does not carry SN+ streaming app exclusives, but Centre Ice unlocks all out-of-market regional games
  const snPlusExclusives = data.schedule.filter(g => g.netEN === 'SN+').length;
  const expectedOomCableCount = 84 - snPlusExclusives;
  if (oomCentreIceCount !== expectedOomCableCount) {
    console.error(`❌ OOM-CENTRE-ICE FAIL: ${teamId} out-of-market (${outMarketRegion}) with Centre Ice + Cable SN + Prime yielded ${oomCentreIceCount}/${expectedOomCableCount} games.`);
    allPassed = false;
  } else {
    console.log(`✅ OOM-CENTRE-ICE PASS: ${teamId} out-of-market (${outMarketRegion}) with Centre Ice + Cable SN + Prime yielded ${oomCentreIceCount}/${expectedOomCableCount} games.`);
  }
  
  // Test 4: CBC & CityTV 2026 contract check (STATUS.md domain logic quirk: no longer free national broadcasters)
  const nationalEN = data.team.networks.nationalEN || [];
  if (nationalEN.includes('CBC') || nationalEN.includes('CityTV')) {
    console.error(`❌ CBC/CityTV CONTRACT FAIL: ${teamId} lists CBC or CityTV in nationalEN networks: ${JSON.stringify(nationalEN)}`);
    allPassed = false;
  }
  const cbcInSchedule = data.schedule.some(g => (g.netEN && g.netEN.includes('CBC')) || (g.netFR && g.netFR.includes('CBC')));
  if (cbcInSchedule) {
    console.error(`❌ CBC IN SCHEDULE FAIL: ${teamId} schedule still contains CBC references.`);
    allPassed = false;
  }

  console.log('---');
});

if (allPassed) {
  console.log('🚀 ALL MATRIX TESTS PASSED!');
} else {
  console.error('💥 MATRIX TESTS FAILED!');
  process.exit(1);
}
