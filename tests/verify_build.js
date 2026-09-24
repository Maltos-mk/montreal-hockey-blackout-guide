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

const teams = fs.readdirSync(TEAMS_DIR).filter(f => fs.statSync(path.join(TEAMS_DIR, f)).isDirectory());
teams.forEach(team => {
  const blackoutPath = path.join(TEAMS_DIR, team, 'blackout.js');
  if (fs.existsSync(blackoutPath)) {
    const blackoutJs = fs.readFileSync(blackoutPath, 'utf-8');
    
    try {
      const mockWindow = {};
      const fn = new Function('window', blackoutJs);
      fn(mockWindow);
      
      if (typeof mockWindow.evaluateGame !== 'function') {
        console.error(`❌ [${team}/blackout.js] Missing window.evaluateGame`);
        errors++;
      } else {
        const res = mockWindow.evaluateGame(
          { netEN: 'Sportsnet', type: 'national', netFR: '' }, 
          { region: 'in_market', subs: { sn: true } }
        );
        if (!res || typeof res.canEN === 'undefined' || typeof res.reasonEN === 'undefined') {
          console.error(`❌ [${team}/blackout.js] evaluateGame returned invalid object schema: ${JSON.stringify(res)}`);
          errors++;
        } else {
          console.log(`✅ [${team}/blackout.js] Core evaluation engine executes safely`);
        }
      }
    } catch (err) {
      console.error(`❌ [${team}/blackout.js] Syntax or runtime error during evaluation:`, err);
      errors++;
    }
  }
});

if (errors > 0) {
  console.error(`\n🚨 Build verification failed with ${errors} errors. Deployment aborted.`);
  process.exit(1);
} else {
  console.log(`\n🚀 All checks passed! Proceeding to deployment.`);
}
