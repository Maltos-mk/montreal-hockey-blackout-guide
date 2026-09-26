const fs = require('fs');
let code = fs.readFileSync('shared/app.js', 'utf8');

function addT() {
  if (!code.includes('const t = (str) =>')) {
    code = code.replace('function render() {', 'function render() {\n      const t = (str) => window.i18n ? window.i18n.t(str) : str;');
  }
}
addT();

// Translate g.vs
code = code.replace(/\$\{g.vs\}/g, "${t(g.vs.replace('vs ', '').replace('@ ', '').replace(' (Split Squad)', '')) ? (g.vs.startsWith('vs ') ? 'vs ' : '@ ') + t(g.vs.replace('vs ', '').replace('@ ', '').replace(' (Split Squad)', '')) + (g.vs.includes('Split Squad') ? ' (' + t('Split Squad') + ')' : '') : g.vs}");

// Translate g.note
code = code.replace(/\$\{g.note\}/g, "${t(g.note)}");

// Translate Preseason
code = code.replace(/>Preseason</g, ">${t('Preseason')}<");

fs.writeFileSync('shared/app.js', code);
