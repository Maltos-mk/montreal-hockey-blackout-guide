const fs = require('fs');

let js = fs.readFileSync('shared/app.js', 'utf-8');

const functionsToAdd = `
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

js = js.replace(/const state = \{[\s\S]*?    \};/, match => match + '\n' + functionsToAdd);

// Call loadStateFromHash at the top of DOMContentLoaded initialization (inside the event listener)
js = js.replace(/document\.addEventListener\('DOMContentLoaded', \(\) => \{/, "document.addEventListener('DOMContentLoaded', () => {\n    loadStateFromHash();");

// Replace region setup
const regionMatch = `    document.querySelectorAll('.region-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.region = btn.dataset.region;
        document.querySelectorAll('.region-btn').forEach(b => {
          b.className = "region-btn p-3 rounded-xl border text-left flex flex-col justify-between transition border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300";
        });
        btn.className = "region-btn p-3 rounded-xl border text-left flex flex-col justify-between transition border-teamSecondary bg-teamSecondary/5 text-teamSecondary font-semibold dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300";
        render();
      });
    });`;

const regionReplace = `
    function updateRegionUI() {
      document.querySelectorAll('.region-btn').forEach(b => {
        if (b.dataset.region === state.region) {
          b.className = "region-btn p-3 rounded-xl border text-left flex flex-col justify-between transition border-teamSecondary bg-teamSecondary/5 text-teamSecondary font-semibold dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300";
        } else {
          b.className = "region-btn p-3 rounded-xl border text-left flex flex-col justify-between transition border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300";
        }
      });
    }
    updateRegionUI();

    document.querySelectorAll('.region-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.region = btn.dataset.region;
        updateRegionUI();
        updateHash();
        render();
      });
    });`;

js = js.replace(regionMatch, regionReplace);

// Update checkboxes setup
const checkboxMatch = `    ['sn', 'sn_prem', 'tsn', 'prime', 'rds', 'tva', 'espn'].forEach(key => {
      const el = document.getElementById(\`sub_\$\{key\}\`);
      if (el) {
        el.addEventListener('change', () => {
          state.subs[key] = el.checked;
          render();
        });
      }
    });`;

const checkboxReplace = `    ['sn', 'sn_prem', 'tsn', 'prime', 'rds', 'tva', 'espn'].forEach(key => {
      const el = document.getElementById(\`sub_\$\{key\}\`);
      if (el) {
        el.checked = state.subs[key];
        el.addEventListener('change', () => {
          state.subs[key] = el.checked;
          updateHash();
          render();
        });
      }
    });`;
    
js = js.replace(checkboxMatch, checkboxReplace);

// Update setLang, setTime, etc to updateHash()
js = js.replace(/render\(\);\n\s*\}\n\n\s*function setTime/g, 'updateHash();\n      render();\n    }\n\n    function setTime');
js = js.replace(/state\.timeFilter = filter;\n\s*\[/g, 'state.timeFilter = filter;\n      updateHash();\n      [');

// Oh wait, some basic state changes happen everywhere. Let's just put updateHash() inside render() so ANY time render is called, it pushes to URL!
// This is much safer and easier!
