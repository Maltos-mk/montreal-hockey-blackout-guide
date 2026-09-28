const fs = require('fs');
let code = fs.readFileSync('shared/app.js', 'utf8');

code = code.replace(
  "text-amber-600 dark:text-amber-300\">${t('Preseason')}</span>'",
  "text-amber-600 dark:text-amber-300\">' + t('Preseason') + '</span>'"
);

fs.writeFileSync('shared/app.js', code);
