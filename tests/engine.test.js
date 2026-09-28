const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

const appCode = fs.readFileSync('shared/app.js', 'utf8');
const evalMatch = appCode.match(/function evaluateGame\(g, state\)\s*\{[\s\S]*?return \{ canEN, reasonEN, isBlackedOutEN, canFR, reasonFR, isBlackedOutFR \};\n\}/);

// In Node, we can just eval it to define it in the local scope, but we must mock window first
global.window = {};
eval(evalMatch[0]);

test('Montreal In-Market: TSN2 requires TSN+', () => {
  global.window.TEAM_DATA = { team: { networks: { regionalEN: 'TSN2', regionalFR: 'RDS', nationalEN: ['Sportsnet', 'Prime Video'], nationalFR: ['TVA Sports'] } } };
  
  const g = { netEN: 'TSN2' };
  const stateNoSub = { region: 'in_market', subs: { regional_en: false } };
  const resNoSub = evaluateGame(g, stateNoSub);
  assert.strictEqual(resNoSub.canEN, false);
  assert.strictEqual(resNoSub.reasonEN, 'Requires TSN2');

  const stateSub = { region: 'in_market', subs: { regional_en: true } };
  const resSub = evaluateGame(g, stateSub);
  assert.strictEqual(resSub.canEN, true);
  assert.strictEqual(resSub.reasonEN, 'Watch on TSN2');
});

test('Toronto Out-of-Market: TSN4 blacked out without SN Premium', () => {
  global.window.TEAM_DATA = { team: { networks: { regionalEN: 'TSN4', regionalFR: null, nationalEN: ['Sportsnet', 'Prime Video'], nationalFR: ['TVA Sports'] } } };
  
  const g = { netEN: 'TSN4' };
  const stateNoSub = { region: 'out_market_canada', subs: { regional_en: true, sn_prem: false } };
  const resNoSub = evaluateGame(g, stateNoSub);
  assert.strictEqual(resNoSub.canEN, false);
  assert.strictEqual(resNoSub.isBlackedOutEN, true);
  
  const stateSub = { region: 'out_market_canada', subs: { regional_en: true, sn_prem: true } };
  const resSub = evaluateGame(g, stateSub);
  assert.strictEqual(resSub.canEN, true);
  assert.strictEqual(resSub.isBlackedOutEN, false);
});

test('Ottawa National: Prime Video watchable everywhere with Prime', () => {
  global.window.TEAM_DATA = { team: { networks: { regionalEN: 'TSN5', regionalFR: 'RDS', nationalEN: ['Sportsnet', 'Prime Video'], nationalFR: ['TVA Sports'] } } };
  
  const g = { netEN: 'Prime Video' };
  const stateSub = { region: 'out_market_canada', subs: { prime: true } };
  const resSub = evaluateGame(g, stateSub);
  assert.strictEqual(resSub.canEN, true);
  assert.strictEqual(resSub.isBlackedOutEN, false);
});
