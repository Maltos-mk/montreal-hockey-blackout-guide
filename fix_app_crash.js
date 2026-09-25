const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf-8');

// We need to evaluate ALL games to get the total counts, regardless of the time filter.
// Let's refactor `evaluateGameStatus(g, state)` into a helper inside app.js so we can call it anytime.

const search = `      games.forEach(g => {
        const evalRes = g._cachedEvalRes;
        if (evalRes.status === 'watchable') watchableCount++;
        else if (evalRes.status === 'blacked_out') blackedOutCount++;
        else missingSubCount++;
      });`;

const replace = `      games.forEach(g => {
        // Evaluate safely if not cached
        let evalRes = g._cachedEvalRes;
        if (!evalRes) {
          const rawRes = evaluateGame(g, state);
          let status = 'missing_sub';
          if (state.lang === 'en') {
            if (rawRes.canEN) status = 'watchable';
            else if (rawRes.isBlackedOutEN) status = 'blacked_out';
          } else if (state.lang === 'fr') {
            if (rawRes.canFR) status = 'watchable';
            else if (rawRes.isBlackedOutFR) status = 'blacked_out';
          } else {
            if (rawRes.canEN || rawRes.canFR) status = 'watchable';
            else if (rawRes.isBlackedOutEN && rawRes.isBlackedOutFR) status = 'blacked_out';
            else if (rawRes.isBlackedOutEN || rawRes.isBlackedOutFR) status = 'blacked_out';
          }
          evalRes = { status };
        }
        
        if (evalRes.status === 'watchable') watchableCount++;
        else if (evalRes.status === 'blacked_out') blackedOutCount++;
        else missingSubCount++;
      });`;

js = js.replace(search, replace);
fs.writeFileSync('shared/app.js', js);
