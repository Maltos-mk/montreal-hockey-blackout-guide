const fs = require('fs');

let js = fs.readFileSync('tests/ui.spec.js', 'utf-8');
// Fix the selector to be the table body which is visible on desktop
js = js.replace(/#scheduleCardsMobile/g, '#scheduleTableBody');
fs.writeFileSync('tests/ui.spec.js', js);
