const fs = require('fs');
let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');

html = html.replace(/<label class="sub-item flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800\/60 cursor-pointer transition">\s*<input type="checkbox" id="sub_rds" class="rounded border-slate-300 text-teamSecondary focus:ring-teamSecondary h-4 w-4">\s*<div class="flex-1">\s*<p class="text-sm font-semibold">RDS \/ RDS Direct<\/p>\s*<p class="text-\[11px\] text-slate-500">45 Regional French games \(in-market only\)<\/p>\s*<\/div>\s*<\/label>/s, '');

html = html.replace(/<option value="RDS">RDS<\/option>/, '');

fs.writeFileSync('teams/toronto/index.html', html);
