const fs = require('fs');

let js = fs.readFileSync('tests/ui.spec.js', 'utf-8');
// Fix the selector to count TRs instead of DIVs
js = js.replace(/#scheduleTableBody > div/g, '#scheduleTableBody > tr');
fs.writeFileSync('tests/ui.spec.js', js);
