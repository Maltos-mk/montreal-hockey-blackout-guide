const fs = require('fs');

let js = fs.readFileSync('shared/app.js', 'utf-8');

// Insert formatLocalTime function
const funcStr = `
    function formatLocalTime(isoString, fallbackTime) {
      if (!isoString) return fallbackTime;
      try {
        const d = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(d);
      } catch (e) {
        return fallbackTime;
      }
    }
`;

js = js.replace(/function evaluateGame\(g, state\) \{/g, funcStr + '\n    function evaluateGame(g, state) {');

// Replace usage in Next Game Spotlight
js = js.replace(/\$\{nextGame\.time\} ET/g, '${formatLocalTime(nextGame.iso, nextGame.time)}');
js = js.replace(/\$\{nextGame\.date\} • \$\{nextGame\.time\}/g, '${nextGame.date} • ${formatLocalTime(nextGame.iso, nextGame.time)}');

// Replace usage in Mobile Cards
js = js.replace(/\$\{g\.time\}/g, '${formatLocalTime(g.iso, g.time)}');

fs.writeFileSync('shared/app.js', js);
