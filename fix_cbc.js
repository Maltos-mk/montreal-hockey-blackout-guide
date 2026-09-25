const fs = require('fs');

function fixTeam(team) {
  let js = fs.readFileSync(`teams/${team}/blackout.js`, 'utf-8');
  
  // Replace the exact Sportsnet check with a broader National check
  js = js.replace(/if \(g\.netEN === 'Sportsnet'\) \{/g, 
    "if (g.netEN && (g.netEN.includes('Sportsnet') || g.netEN.includes('CBC') || g.netEN.includes('CityTV') || g.netEN.includes('HNIC'))) {");
    
  // Remove the old CBC/CityTV block completely
  const regex = /\} else if \(g\.netEN === 'CBC' \|\| g\.netEN === 'CityTV' \|\| g\.netEN\.includes\('HNIC'\)\) \{[\s\S]*?(?=\} else if \(g\.netEN)/;
  js = js.replace(regex, "");
  
  fs.writeFileSync(`teams/${team}/blackout.js`, js);
}

fixTeam('montreal');
fixTeam('toronto');
console.log("Fixed CBC/CityTV logic!");
