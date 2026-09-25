const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf-8');

const timeFunc = `
function formatLocalTime(isoStr, fallbackTime) {
  if (!isoStr) return fallbackTime + ' ET';
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(d);
  } catch(e) {
    return fallbackTime + ' ET';
  }
}

// Add Web Share API handler`;

js = js.replace('// Add Web Share API handler', timeFunc);

fs.writeFileSync('shared/app.js', js);
