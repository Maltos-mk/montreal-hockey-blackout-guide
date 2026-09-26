const fs = require('fs');
let code = fs.readFileSync('shared/app.js', 'utf8');

// The messy string:
const messyString = "${t(g.vs.replace('vs ', '').replace('@ ', '').replace(' (Split Squad)', '')) ? (g.vs.startsWith('vs ') ? 'vs ' : '@ ') + t(g.vs.replace('vs ', '').replace('@ ', '').replace(' (Split Squad)', '')) + (g.vs.includes('Split Squad') ? ' (' + t('Split Squad') + ')' : '') : g.vs}";

code = code.replace(new RegExp(messyString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '${getVs(g.vs)}');

// The note
code = code.replace(/\$\{t\(g\.note\)\}/g, '${g.note ? t(g.note) : ""}');
// Actually, earlier the code was:
// ${g.note ? `<span class="...">\${t(g.note)}</span>` : ''}
// But wait, my previous script did code = code.replace(/\$\{g.note\}/g, "${t(g.note)}");
// So it became: ${t(g.note) ? `<span class...>${t(g.note)}</span>` : ''}
code = code.replace(/\$\{t\(g\.note\)\}/g, '${g.note}');

// Add the helper
code = code.replace(
  'const t = (str) => window.i18n ? window.i18n.t(str) : str;',
  `const t = (str) => window.i18n ? window.i18n.t(str) : str;
      const getVs = (vs) => {
        let clean = vs.replace('vs ', '').replace('@ ', '').replace(' (Split Squad)', '');
        let prefix = vs.startsWith('vs ') ? 'vs ' : '@ ';
        let suffix = vs.includes('Split Squad') ? ' (' + t('Split Squad') + ')' : '';
        return prefix + t(clean) + suffix;
      };`
);

// Fix the Preseason issue
code = code.replace(
  "text-amber-600 dark:text-amber-300\">' + t('Preseason') + '</span>'",
  "text-amber-600 dark:text-amber-300\">${t('Preseason')}</span>'"
);

fs.writeFileSync('shared/app.js', code);
