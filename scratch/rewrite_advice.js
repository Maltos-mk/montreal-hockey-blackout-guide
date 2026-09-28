const fs = require('fs');

let code = fs.readFileSync('teams/montreal/blackout.js', 'utf8');

const t = (str) => `\${window.i18n ? window.i18n.t('${str}') : '${str}'}`;

code = code.replace(
  '<h4 class="font-bold text-slate-900 dark:text-white">In-Market Full Season Montreal Canadiens Setup</h4>',
  `<h4 class="font-bold text-slate-900 dark:text-white">${t("In-Market Full Season Montreal Canadiens Setup")}</h4>`
);
code = code.replace(
  '<p class="text-slate-600 dark:text-slate-300 mt-1">\n            To receive all Montreal Canadiens games, you need Sportsnet (Saturdays), TSN2 or RDS (regional mid-week), and <span class="font-bold">Amazon Prime</span> for Monday night feeds.\n          </p>',
  `<p class="text-slate-600 dark:text-slate-300 mt-1">\n            ${t("To receive all Montreal Canadiens games, you need Sportsnet (Saturdays), TSN2 or RDS (regional mid-week), and <span class=\"font-bold\">Amazon Prime</span> for Monday night feeds.")}\n          </p>`
);

code = code.replace(
  '<h4 class="font-bold text-slate-900 dark:text-white">Official Out-of-Market Options for Habs Fans:</h4>',
  `<h4 class="font-bold text-slate-900 dark:text-white">${t("Official Out-of-Market Options for Habs Fans:")}</h4>`
);
code = code.replace(
  '<p class="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">\n            Subscribing to TSN or RDS does <strong>not</strong> unlock Montreal Canadiens regional games in Ontario or Western Canada due to NHL blackouts. To watch those 50 regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).\n          </p>',
  `<p class="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">\n            ${t("Subscribing to TSN or RDS does <strong>not</strong> unlock Montreal Canadiens regional games in Ontario or Western Canada due to NHL blackouts. To watch those 50 regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).")}\n          </p>`
);

code = code.replace(
  '<h4 class="font-bold text-slate-900 dark:text-white">International & US Montreal Viewing</h4>',
  `<h4 class="font-bold text-slate-900 dark:text-white">${t("International & US Montreal Viewing")}</h4>`
);
code = code.replace(
  '<p class="text-slate-600 dark:text-slate-300 mt-1">\n            ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN or TNT follow local US availability rules.\n          </p>',
  `<p class="text-slate-600 dark:text-slate-300 mt-1">\n            ${t("ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN or TNT follow local US availability rules.")}\n          </p>`
);

fs.writeFileSync('teams/montreal/blackout.js', code);
