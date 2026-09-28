const fs = require('fs');

let js = fs.readFileSync('shared/app.js', 'utf8');

js = js.replace(
  'if (window.i18n) { window.i18n.translateNode(adviceCard); window.i18n.apply(); }',
  'if (window.i18n) { window.i18n.translateNode(adviceCard); window.i18n.translateNode(desktopTable); window.i18n.translateNode(mobileContainer); window.i18n.apply(); }'
);

fs.writeFileSync('shared/app.js', js);
