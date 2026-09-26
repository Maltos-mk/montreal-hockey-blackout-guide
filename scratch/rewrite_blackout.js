const fs = require('fs');

let code = fs.readFileSync('teams/montreal/blackout.js', 'utf8');

function wrapWithI18n(match, quote, str) {
  // If there's an interpolation like ${g.netFR}, we might need to handle it.
  // For now, let's just do simple replacements.
  if (str.includes('${')) {
     return `reasonFR = window.i18n ? \`\${window.i18n.t('Watch on')} \${g.netFR}\` : \`Watch on \${g.netFR}\``;
  }
  return match.split('=')[0] + `= window.i18n ? window.i18n.t('${str}') : '${str}'`;
}

code = code.replace(/reasonEN\s*=\s*(['`])(.*?)\1/g, wrapWithI18n);
code = code.replace(/reasonFR\s*=\s*(['`])(.*?)\1/g, wrapWithI18n);

fs.writeFileSync('teams/montreal/blackout.js', code);
