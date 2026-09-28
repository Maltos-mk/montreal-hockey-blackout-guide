const fs = require('fs');

const file = 'teams/montreal/index.html';
let html = fs.readFileSync(file, 'utf8');

const replacements = [
  ['<h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">\\n          Montreal Canadiens TV &amp; Blackout Guide\\n        </h1>', '<h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight" data-i18n="title">\\n          Montreal Canadiens TV &amp; Blackout Guide\\n        </h1>'],
  ['<p class="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl">\\n          Find exactly what channel or streaming service you need for tonight\\\'s game.\\n        </p>', '<p class="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl" data-i18n="subtitle">\\n          Find exactly what channel or streaming service you need for tonight\'s game.\\n        </p>'],
  ['<span>Add App</span>', '<span data-i18n="btn-add-app">Add App</span>'],
  ['<span class="text-white/30">|</span>\\n          <button onclick="window.i18n.toggle()" class="lang-btn uppercase text-slate-300 hover:text-white transition" data-lang="fr">FR</button>\\n        </div>', '<span class="text-white/30">|</span>\\n          <button onclick="window.i18n.toggle()" class="lang-btn uppercase text-slate-300 hover:text-white transition" data-lang="fr">FR</button>\\n        </div>\\n        <div class="w-full text-center mt-2 hidden" id="frDisclaimer"><span class="text-[10px] text-slate-500 italic" data-i18n="footer-disclaimer">Traduit automatiquement. Veuillez excuser les éventuelles erreurs.</span></div>']
];

for (const [en, tag] of replacements) {
  html = html.replace(new RegExp(en, 'g'), tag);
}

fs.writeFileSync(file, html);
