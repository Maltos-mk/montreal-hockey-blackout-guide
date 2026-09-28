const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf8');

js = js.replace(/nextSummaryReason = rawNextRes\.reasonEN \+ ' \/ ' \+ rawNextRes\.reasonFR;/g, `if (rawNextRes.reasonFR === 'No French Broadcast') nextSummaryReason = rawNextRes.reasonEN;
            else if (rawNextRes.reasonEN === 'No English Broadcast') nextSummaryReason = rawNextRes.reasonFR;
            else nextSummaryReason = rawNextRes.reasonEN + ' / ' + rawNextRes.reasonFR;`);

js = js.replace(/summaryReason = rawRes\.reasonEN \+ ' \/ ' \+ rawRes\.reasonFR;/g, `if (rawRes.reasonFR === 'No French Broadcast') summaryReason = rawRes.reasonEN;
            else if (rawRes.reasonEN === 'No English Broadcast') summaryReason = rawRes.reasonFR;
            else summaryReason = rawRes.reasonEN + ' / ' + rawRes.reasonFR;`);

fs.writeFileSync('shared/app.js', js);
