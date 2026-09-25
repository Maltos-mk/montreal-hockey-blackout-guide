const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf-8');

const funcs = `
function updateHash() {
  const params = new URLSearchParams();
  params.set('region', state.region);
  params.set('timeFilter', state.timeFilter);
  params.set('statusFilter', state.statusFilter);
  params.set('channelFilter', state.channelFilter);
  Object.keys(state.subs).forEach(k => {
    params.set(k, state.subs[k]);
  });
  window.history.replaceState(null, null, '#' + params.toString());
}

function loadStateFromHash() {
  if (window.location.hash) {
    try {
      const params = new URLSearchParams(window.location.hash.substring(1));
      if (params.has('region')) state.region = params.get('region');
      if (params.has('timeFilter')) state.timeFilter = params.get('timeFilter');
      if (params.has('statusFilter')) state.statusFilter = params.get('statusFilter');
      if (params.has('channelFilter')) state.channelFilter = params.get('channelFilter');
      
      const subKeys = ['sn', 'sn_prem', 'tsn', 'prime', 'rds', 'tva', 'espn'];
      subKeys.forEach(k => {
        if (params.has(k)) state.subs[k] = params.get(k) === 'true';
      });
    } catch(e) {}
  }
}
`;

js = js.replace(/const state = \{[\s\S]*?    \};/, match => match + '\n' + funcs);

// Add updateHash inside render
js = js.replace(/function render\(\) \{/, 'function render() {\n      updateHash();');

// Init state from hash at DOMContentLoaded
js = js.replace(/document\.addEventListener\('DOMContentLoaded', \(\) => \{/, "document.addEventListener('DOMContentLoaded', () => {\n      loadStateFromHash();");

// Fix region buttons initialization
js = js.replace(/document\.querySelectorAll\('\.region-btn'\)\.forEach\(btn => \{[\s\S]*?render\(\);\s*\}\);\s*\}\);/,
`function updateRegionUI() {
        document.querySelectorAll('.region-btn').forEach(b => {
          if (b.dataset.region === state.region) {
            b.className = "region-btn p-3 rounded-xl border text-left flex flex-col justify-between transition border-teamSecondary bg-teamSecondary/5 text-teamSecondary font-semibold dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300";
            const check = b.querySelector('.fa-circle-check');
            if (check) check.classList.remove('hidden');
          } else {
            b.className = "region-btn p-3 rounded-xl border text-left flex flex-col justify-between transition border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300";
            const check = b.querySelector('.fa-circle-check');
            if (check) check.classList.add('hidden');
          }
        });
      }
      updateRegionUI();
      document.querySelectorAll('.region-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.region = btn.dataset.region;
          updateRegionUI();
          render();
        });
      });`);
      
// Fix checkboxes initialization
js = js.replace(/\['sn', 'sn_prem', 'tsn', 'prime', 'rds', 'tva', 'espn'\]\.forEach\(key => \{[\s\S]*?render\(\);\s*\}\);\s*\}\s*\}\);/,
`['sn', 'sn_prem', 'tsn', 'prime', 'rds', 'tva', 'espn'].forEach(key => {
        const el = document.getElementById(\`sub_\$\{key\}\`);
        if (el) {
          el.checked = state.subs[key];
          el.addEventListener('change', () => {
            state.subs[key] = el.checked;
            render();
          });
        }
      });`);
      
// Fix time/lang/status filters initialization
js = js.replace(/function setLang\(lang\) \{/, 
`['upcoming', 'past', 'all'].forEach(f => {
        const b = document.getElementById(\`time_\$\{f\}\`);
        if (b && state.timeFilter === f) {
          b.className = "px-3 py-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-bold transition";
        }
      });
      ['en', 'fr', 'any'].forEach(l => {
        const b = document.getElementById(\`lang_\$\{l\}\`);
        if (b && state.lang === l) {
          b.className = "px-3 py-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm text-teamPrimary font-bold transition";
        }
      });
      
      function setLang(lang) {`);

fs.writeFileSync('shared/app.js', js);
