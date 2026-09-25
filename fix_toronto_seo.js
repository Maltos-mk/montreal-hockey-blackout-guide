const fs = require('fs');

let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');

html = html.replace(
  'across TSN2, RDS, Sportsnet, Prime Video, and TVA Sports.',
  'across TSN4, Sportsnet, and Prime Video.'
);

html = html.replace(
  'content="Toronto Maple Leafs game tonight, Leafs blackout rules, Toronto Maple Leafs broadcast schedule, TSN2 blackout Ontario, watch Leafs online, Sportsnet Toronto Maple Leafs, RDS blackout Ontario, Toronto hockey live stream"',
  'content="Toronto Maple Leafs game tonight, Leafs blackout rules, Toronto Maple Leafs broadcast schedule, TSN4 blackout out of market, watch Leafs online, Sportsnet Toronto Maple Leafs, Toronto hockey live stream"'
);

html = html.replace(/href="https:\/\/maltos-mk\.github\.io\/montreal-hockey-blackout-guide\/"/g, 'href="https://maltos-mk.github.io/toronto-hockey-blackout-guide/"');
html = html.replace(/content="https:\/\/maltos-mk\.github\.io\/montreal-hockey-blackout-guide\/"/g, 'content="https://maltos-mk.github.io/toronto-hockey-blackout-guide/"');
html = html.replace(/content="https:\/\/maltos-mk\.github\.io\/montreal-hockey-blackout-guide\/og-preview\.png"/g, 'content="https://maltos-mk.github.io/toronto-hockey-blackout-guide/og-preview.png"');

html = html.replace(/content="#192168"/g, 'content="#00205B"');
html = html.replace(/data-website-id="b68ec99c-ee81-4587-91dc-cd69b239def8"/g, 'data-website-id="YOUR_TORONTO_UMAMI_ID_HERE"');

fs.writeFileSync('teams/toronto/index.html', html);
console.log("Fixed Toronto SEO!");
