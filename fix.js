const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf8');

// Remove synchronous render()
js = js.replace(/render\(\);\s*$/, '');
js = js.replace(/render\(\);\n*$/, '');
js = js.replace(/render\(\);\s*initApp\(\);\s*$/, 'initApp();\n');

// Fix nested template string
js = js.replace(/'Next \$\{window\.TEAM_DATA\.team\.nickname\} Game'/g, "'Next ' + window.TEAM_DATA.team.nickname + ' Game'");
js = js.replace(/'\$\{window\.TEAM_DATA\.team\.nickname\} fans'/g, "window.TEAM_DATA.team.nickname + ' fans'");

// Just in case there are others
js = js.replace(/'([a-zA-Z\s]*?)\$\{window\.TEAM_DATA\.team\.nickname\}([a-zA-Z\s]*?)'/g, "'$1' + window.TEAM_DATA.team.nickname + '$2'");

fs.writeFileSync('shared/app.js', js);
console.log('Fixed QA bugs in app.js');
