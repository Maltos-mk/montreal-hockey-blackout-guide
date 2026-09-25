const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf-8');

const search = `        const evalRes = evaluateGame(g, state);`;

const replace = `        const rawRes = evaluateGame(g, state);
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
        const evalRes = Object.assign({}, rawRes, { status, summaryReason });`;

// Replace first occurrence (mobile cards)
js = js.replace(search, replace);

// Replace second occurrence (status filter logic)
js = js.replace(search, replace);

// Replace third occurrence (table rows)
js = js.replace(search, replace);

// Replace the nextEval occurrence
const searchNext = `        const nextEval = evaluateGame(nextGame, state);`;
const replaceNext = `        const rawNextRes = evaluateGame(nextGame, state);
        let nextStatus = 'missing_sub';
        let nextSummaryReason = '';

        if (state.lang === 'en') {
          if (rawNextRes.canEN) { nextStatus = 'watchable'; nextSummaryReason = rawNextRes.reasonEN; }
          else if (rawNextRes.isBlackedOutEN) { nextStatus = 'blacked_out'; nextSummaryReason = rawNextRes.reasonEN; }
          else { nextStatus = 'missing_sub'; nextSummaryReason = rawNextRes.reasonEN; }
        } else if (state.lang === 'fr') {
          if (rawNextRes.canFR) { nextStatus = 'watchable'; nextSummaryReason = rawNextRes.reasonFR; }
          else if (rawNextRes.isBlackedOutFR) { nextStatus = 'blacked_out'; nextSummaryReason = rawNextRes.reasonFR; }
          else { nextStatus = 'missing_sub'; nextSummaryReason = rawNextRes.reasonFR; }
        } else {
          if (rawNextRes.canEN || rawNextRes.canFR) {
            nextStatus = 'watchable';
            nextSummaryReason = rawNextRes.canEN ? rawNextRes.reasonEN : rawNextRes.reasonFR;
          } else if (rawNextRes.isBlackedOutEN && rawNextRes.isBlackedOutFR) {
            nextStatus = 'blacked_out';
            nextSummaryReason = 'Regional feeds blacked out in your territory. Requires Premium sub.';
          } else if (rawNextRes.isBlackedOutEN) {
            nextStatus = 'blacked_out';
            nextSummaryReason = rawNextRes.reasonEN;
          } else if (rawNextRes.isBlackedOutFR) {
            nextStatus = 'blacked_out';
            nextSummaryReason = rawNextRes.reasonFR;
          } else {
            nextStatus = 'missing_sub';
            nextSummaryReason = rawNextRes.reasonEN + ' / ' + rawNextRes.reasonFR;
          }
        }
        const nextEval = Object.assign({}, rawNextRes, { status: nextStatus, summaryReason: nextSummaryReason });`;

js = js.replace(searchNext, replaceNext);

fs.writeFileSync('shared/app.js', js);
