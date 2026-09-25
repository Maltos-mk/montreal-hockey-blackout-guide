const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf-8');

const oldFilterLoop = `      const filteredGames = schedule.filter(g => {
        const gameDate = new Date(g.iso);
        g.isPast = gameDate < now;
        if (state.timeFilter === 'upcoming' && g.isPast) return false;
        if (state.timeFilter === 'past' && !g.isPast) return false;

        const evalRes = evaluateGame(g, state);
        if (state.statusFilter !== 'all' && evalRes.status !== state.statusFilter) return false;`;

const newFilterLoop = `      const filteredGames = schedule.filter(g => {
        const gameDate = new Date(g.iso);
        g.isPast = gameDate < now;
        if (state.timeFilter === 'upcoming' && g.isPast) return false;
        if (state.timeFilter === 'past' && !g.isPast) return false;

        const rawRes = evaluateGame(g, state);
        let status = 'missing_sub';
        let summaryReason = '';
        if (state.lang === 'en') {
          if (rawRes.canEN) { status = 'watchable'; summaryReason = rawRes.reasonEN; }
          else if (rawRes.isBlackedOutEN) { status = 'blacked_out'; summaryReason = rawRes.reasonEN; }
          else { status = 'missing_sub'; summaryReason = rawRes.reasonEN; }
        } else if (state.lang === 'fr') {
          if (rawRes.canFR) { status = 'watchable'; summaryReason = rawRes.reasonFR; }
          else if (rawRes.isBlackedOutFR) { status = 'blacked_out'; summaryReason = rawRes.reasonFR; }
          else { status = 'missing_sub'; summaryReason = rawRes.reasonFR; }
        } else {
          if (rawRes.canEN || rawRes.canFR) { status = 'watchable'; summaryReason = rawRes.canEN ? rawRes.reasonEN : rawRes.reasonFR; }
          else if (rawRes.isBlackedOutEN && rawRes.isBlackedOutFR) { status = 'blacked_out'; summaryReason = 'Regional feeds blacked out in your territory. Requires Premium sub.'; }
          else if (rawRes.isBlackedOutEN) { status = 'blacked_out'; summaryReason = rawRes.reasonEN; }
          else if (rawRes.isBlackedOutFR) { status = 'blacked_out'; summaryReason = rawRes.reasonFR; }
          else { status = 'missing_sub'; summaryReason = rawRes.reasonEN + ' / ' + rawRes.reasonFR; }
        }
        const evalRes = Object.assign({}, rawRes, { status, summaryReason });
        g._cachedEvalRes = evalRes;

        if (state.statusFilter !== 'all' && evalRes.status !== state.statusFilter) return false;`;

js = js.replace(oldFilterLoop, newFilterLoop);

// Now update the map/forEach later down so it uses _cachedEvalRes
js = js.replace(`        const rawRes = evaluateGame(g, state);
        let status = 'missing_sub';
        let summaryReason = '';

        if (state.lang === 'en') {
          if (rawRes.canEN) { status = 'watchable'; summaryReason = rawRes.reasonEN; }
          else if (rawRes.isBlackedOutEN) { status = 'blacked_out'; summaryReason = rawRes.reasonEN; }
          else { status = 'missing_sub'; summaryReason = rawRes.reasonEN; }
        } else if (state.lang === 'fr') {
          if (rawRes.canFR) { status = 'watchable'; summaryReason = rawRes.reasonFR; }
          else if (rawRes.isBlackedOutFR) { status = 'blacked_out'; summaryReason = rawRes.reasonFR; }
          else { status = 'missing_sub'; summaryReason = rawRes.reasonFR; }
        } else {
          if (rawRes.canEN || rawRes.canFR) {
            status = 'watchable';
            summaryReason = rawRes.canEN ? rawRes.reasonEN : rawRes.reasonFR;
          } else if (rawRes.isBlackedOutEN && rawRes.isBlackedOutFR) {
            status = 'blacked_out';
            summaryReason = 'Regional feeds blacked out in your territory. Requires Premium sub.';
          } else if (rawRes.isBlackedOutEN) {
            status = 'blacked_out';
            summaryReason = rawRes.reasonEN;
          } else if (rawRes.isBlackedOutFR) {
            status = 'blacked_out';
            summaryReason = rawRes.reasonFR;
          } else {
            status = 'missing_sub';
            summaryReason = rawRes.reasonEN + ' / ' + rawRes.reasonFR;
          }
        }
        const evalRes = Object.assign({}, rawRes, { status, summaryReason });`, `        const evalRes = g._cachedEvalRes;`);

fs.writeFileSync('shared/app.js', js);
