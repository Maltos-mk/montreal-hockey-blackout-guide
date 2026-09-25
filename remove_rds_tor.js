const fs = require('fs');

let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');

// Find and remove the entire label block for RDS
const rdsBlockRegex = /<label class="sub-item flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800\/60 cursor-pointer transition">[\s\S]*?RDS \/ RDS Direct[\s\S]*?<\/label>/;
html = html.replace(rdsBlockRegex, '');

fs.writeFileSync('teams/toronto/index.html', html);

let js = fs.readFileSync('teams/toronto/blackout.js', 'utf-8');
// remove RDS logic from French if any, though it seems it only mentions TVA Sports
// Actually we can leave the JS alone if it doesn't process RDS, or just leave it alone.
