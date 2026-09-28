const fs = require('fs');

function fixLangUI(file) {
  let html = fs.readFileSync(file, 'utf8');

  // Change lang_en to unselected state
  html = html.replace(
    /id="lang_en"[^>]*class="[^"]*"/,
    `id="lang_en" onclick="setLang('en')" class="px-3 py-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-white transition"`
  );

  // Change lang_any to selected state
  html = html.replace(
    /id="lang_any"[^>]*class="[^"]*"/,
    `id="lang_any" onclick="setLang('any')" class="px-3 py-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm text-teamPrimary font-bold transition"`
  );

  fs.writeFileSync(file, html);
}

fixLangUI('teams/montreal/index.html');
fixLangUI('teams/toronto/index.html');
fixLangUI('teams/ottawa/index.html');
