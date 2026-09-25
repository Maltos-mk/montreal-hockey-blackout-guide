const fs = require('fs');

function patchReason(team) {
  let js = fs.readFileSync(`teams/${team}/blackout.js`, 'utf-8');
  js = js.replace(/BLACKOUT \(Out of Market\)/g, "BLACKED OUT outside territory. Requires Sportsnet+ Premium or Centre Ice.");
  fs.writeFileSync(`teams/${team}/blackout.js`, js);
}

patchReason('montreal');
patchReason('toronto');
