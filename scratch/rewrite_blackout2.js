const fs = require('fs');
let js = fs.readFileSync('teams/montreal/blackout.js', 'utf8');

js = js.replace('function renderAdviceCards(state) {', 'function renderAdviceCards(state) {\n  const t = (str) => window.i18n ? window.i18n.t(str) : str;');
js = js.replace('return `\n    <div class="space-y-4">', 'return `\n    <div class="space-y-4">'); // Anchor point

// Just wrap the big chunks in t()
const chunks = [
  'In-Market Full Season Montreal Canadiens Setup',
  'To receive all Montreal Canadiens games, you need Sportsnet (Saturdays), TSN2 or RDS (regional mid-week), and <span class="font-bold">Amazon Prime</span> for Monday night feeds.',
  'Official Out-of-Market Options for Habs Fans:',
  'Subscribing to TSN or RDS does <strong>not</strong> unlock Montreal Canadiens regional games in Ontario or Western Canada due to NHL blackouts. To watch those 50 regional games, you need <strong>Sportsnet+ PREMIUM</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).',
  'International & US Montreal Viewing',
  'ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN or TNT follow local US availability rules.'
];

chunks.forEach(chunk => {
  js = js.replace(chunk, `\${t('${chunk}')}`);
});

fs.writeFileSync('teams/montreal/blackout.js', js);
