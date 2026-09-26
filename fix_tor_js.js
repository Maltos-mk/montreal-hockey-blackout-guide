const fs = require('fs');

let content = fs.readFileSync('teams/toronto/blackout.js', 'utf-8');

// Replace the condition so it explicitly handles National vs Regional correctly based on type or string equality
const oldBlock = `  if (g.netEN && (g.netEN.includes('Sportsnet') || g.netEN.includes('HNIC'))) {`;

const newBlock = `  if (g.netEN === 'Sportsnet Ontario' || g.type === 'regional_tor' && g.netEN.includes('Sportsnet')) {
    if (state.region === 'in_market') {
      if (state.subs.sn || state.subs.sn_prem) { canEN = true; reasonEN = 'Watch on Sportsnet Ontario'; }
      else { reasonEN = 'Requires Sportsnet+'; }
    } else if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      isBlackedOutEN = true;
      if (state.subs.sn_prem) { canEN = true; reasonEN = 'Watch on Sportsnet+ PREMIUM'; isBlackedOutEN = false; }
      else { reasonEN = 'BLACKED OUT outside territory. Requires Sportsnet+ Premium or Centre Ice.'; }
    }
  } else if (g.netEN && (g.netEN === 'Sportsnet' || g.netEN.includes('HNIC') || g.type === 'national' && g.netEN.includes('Sportsnet'))) {`;

content = content.replace(oldBlock, newBlock);

// remove the old redundant Sportsnet Ontario block
const redundantBlockRegex = /  \} else if \(g\.netEN === 'Sportsnet Ontario'\) \{[\s\S]*?\} else if/g;
content = content.replace(redundantBlockRegex, '  } else if');

fs.writeFileSync('teams/toronto/blackout.js', content);
console.log('Fixed blackout logic.');
