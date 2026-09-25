const fs = require('fs');

let torHtml = fs.readFileSync('teams/toronto/index.html', 'utf-8');
torHtml = torHtml.replace(
  '<p class="text-xs sm:text-sm text-slate-200 font-medium">89-Game Guide for Toronto Maple Leafs  Fans • Real-Time Broadcast & Blackout Calculator</p>',
  '<p class="text-xs sm:text-sm text-slate-200 font-medium">Toronto Maple Leafs Broadcast Guide (84 Regular Season) • Real-Time Broadcast & Blackout Calculator</p>'
);
fs.writeFileSync('teams/toronto/index.html', torHtml);

