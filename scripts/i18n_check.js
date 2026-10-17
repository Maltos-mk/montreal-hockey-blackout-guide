const fs = require('fs');
const path = require('path');

global.window = { matchMedia: () => ({ matches: false }), navigator: { userAgent: '' }, addEventListener: () => {} };
global.navigator = { userAgent: '' };
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelectorAll: () => [],
  getElementById: () => ({ addEventListener: () => {} })
};

const HB_FR = require('../shared/lang-fr.js');
const { evaluateGame } = require('../shared/app.js');

const appJs = fs.readFileSync(path.join(__dirname, '../shared/app.js'), 'utf8');
const mtlData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/mtl.json'), 'utf8'));

let errors = [];

// 1. Check that every literal tx('...') in shared/app.js exists in HB_FR.strings
const txRegex = /\btx\(\s*(['"])((?:\\.|(?!\1).)*)\1/g;
let m;
while ((m = txRegex.exec(appJs)) !== null) {
  const key = m[2];
  if (!(key in HB_FR.strings)) {
    errors.push(`Missing HB_FR.strings entry for tx("${key}")`);
  }
}

// 2. Check that every evaluateGame() reason across all Montreal games x regions x subs translates cleanly
global.window.TEAM_DATA = mtlData;
const regions = ['on_east_qc_atl', 'on_overlap', 'on_west', 'nw_on', 'mb', 'sk', 'ab', 'bc', 'us_intl'];
const subConfigs = [
  {},
  { sn_cable: true },
  { sn_plus: true },
  { sn_prem: true },
  { centre_ice_fr: true },
  { regional_en: true },
  { regional_fr: true },
  { national_fr: true },
  { prime: true },
  { espn: true },
  { regional_en: true, regional_fr: true, national_fr: true, sn_cable: true, prime: true }
];

mtlData.schedule.forEach(g => {
  regions.forEach(region => {
    subConfigs.forEach(subs => {
      const res = evaluateGame(g, { region, subs });
      [res.reasonEN, res.reasonFR, res.summaryReason].forEach(r => {
        if (!r) return;
        const translated = HB_FR.translateSummary(r);
        if (translated === r || /\b(Watch on|Requires|BLACKED OUT|Available in|No English|No French)\b/.test(translated)) {
          errors.push(`Unmatched reason string: "${r}" -> "${translated}"`);
        }
      });
    });
  });
});

if (errors.length > 0) {
  console.error('❌ i18n check failed:');
  [...new Set(errors)].forEach(e => console.error('  -', e));
  process.exit(1);
} else {
  console.log('✅ All tx() keys and blackout reason strings verified in shared/lang-fr.js.');
}
