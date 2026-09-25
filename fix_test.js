const fs = require('fs');

let js = fs.readFileSync('tests/ui.spec.js', 'utf-8');
js = js.replace(/#scheduleContainer/g, '#scheduleCardsMobile');
fs.writeFileSync('tests/ui.spec.js', js);
