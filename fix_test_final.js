const fs = require('fs');

let js = fs.readFileSync('tests/ui.spec.js', 'utf-8');
js = js.replace("await page.click('#status_watchable');", "await page.selectOption('#statusFilter', 'watchable');");
js = js.replace("await page.click('#status_all');", "await page.selectOption('#statusFilter', 'all');");
fs.writeFileSync('tests/ui.spec.js', js);
