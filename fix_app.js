const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf8');

// Fix null listener bug
js = js.replace(/\[\'sn\', \'sn_prem\', \'tsn\', \'prime\', \'rds\', \'tva\', \'espn\'\]\.forEach\(key => \{\n\s*const el = document\.getElementById\(\`sub_\$\{key\}\`\);\n\s*el\.addEventListener\(\'change\', \(\) => \{\n\s*state\.subs\[key\] = el\.checked;\n\s*render\(\);\n\s*\}\);\n\s*\}\);/g, 
  "['sn', 'sn_prem', 'tsn', 'prime', 'rds', 'tva', 'espn'].forEach(key => {\n      const el = document.getElementById(`sub_${key}`);\n      if (el) {\n        el.addEventListener('change', () => {\n          state.subs[key] = el.checked;\n          render();\n        });\n      }\n    });");

// Replace the hardcoded advice cards block in render()
const renderAdviceStart = js.indexOf("if (state.region === 'out_market_canada') {");
if (renderAdviceStart !== -1) {
  const renderAdviceEndMarker = "</div>\n        `;\n      }\n    }";
  const renderAdviceEnd = js.indexOf(renderAdviceEndMarker, renderAdviceStart);
  if (renderAdviceEnd !== -1) {
    const before = js.substring(0, renderAdviceStart);
    const after = js.substring(renderAdviceEnd + renderAdviceEndMarker.length);
    js = before + "if (window.renderAdviceCards) {\n          adviceCard.innerHTML = window.renderAdviceCards(state);\n        }\n      }" + after;
  }
}

fs.writeFileSync('shared/app.js', js);
console.log('Updated app.js');
