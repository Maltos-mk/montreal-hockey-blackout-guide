const fs = require('fs');
let code = fs.readFileSync('shared/app.js', 'utf8');

code = code.replace(
  "'<span class=\"text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300\">${t('Preseason')}</span>'",
  "`<span class=\"text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300\">${t('Preseason')}</span>`"
);

fs.writeFileSync('shared/app.js', code);
