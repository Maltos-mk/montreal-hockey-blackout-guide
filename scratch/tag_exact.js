const fs = require('fs');

let html = fs.readFileSync('teams/montreal/index.html', 'utf8');

const dict = {
  'Montreal Canadiens TV &amp; Blackout Guide': 'Montreal Canadiens TV &amp; Blackout Guide',
  'Find exactly what channel or streaming service you need for tonight\\\'s game.': 'Find exactly what channel or streaming service you need for tonight\\\'s game.',
  '>Add App<': '><span data-i18n="Add App">Add App</span><',
  'Where do you live?': 'Where do you live?',
  '>In Montreal Region<': '><span data-i18n="In Montreal Region">In Montreal Region</span><',
  '>Out of Market (Canada)<': '><span data-i18n="Out of Market (Canada)">Out of Market (Canada)</span><',
  '>US or International<': '><span data-i18n="US or International">US or International</span><',
  '>What do you subscribe to\\?<': '><span data-i18n="What do you subscribe to?">What do you subscribe to?</span><',
  '>Cable / Streaming<': '><span data-i18n="Cable / Streaming">Cable / Streaming</span><',
  '>Premium NHL Packages<': '><span data-i18n="Premium NHL Packages">Premium NHL Packages</span><',
  '>TSN2 (English)<': '><span data-i18n="TSN2 (English)">TSN2 (English)</span><',
  '>Regional mid-week games<': '><span data-i18n="Regional mid-week games">Regional mid-week games</span><',
  '>RDS (French)<': '><span data-i18n="RDS (French)">RDS (French)</span><',
  '>Sportsnet (National)<': '><span data-i18n="Sportsnet (National)">Sportsnet (National)</span><',
  '>Hockey Night in Canada / Saturday<': '><span data-i18n="Hockey Night in Canada / Saturday">Hockey Night in Canada / Saturday</span><',
  '>Amazon Prime Video<': '><span data-i18n="Amazon Prime Video">Amazon Prime Video</span><',
  '>Monday night national games<': '><span data-i18n="Monday night national games">Monday night national games</span><',
  '>TVA Sports<': '><span data-i18n="TVA Sports">TVA Sports</span><',
  '>National French games (Saturday)<': '><span data-i18n="National French games (Saturday)">National French games (Saturday)</span><',
  '>Sportsnet\\+ PREMIUM<': '><span data-i18n="Sportsnet+ PREMIUM">Sportsnet+ PREMIUM</span><',
  '>Unlocks out-of-market Canadian games<': '><span data-i18n="Unlocks out-of-market Canadian games">Unlocks out-of-market Canadian games</span><',
  '>ESPN\\+ / NHL.tv<': '><span data-i18n="ESPN+ / NHL.tv">ESPN+ / NHL.tv</span><',
  '>Out-of-market US subscription<': '><span data-i18n="Out-of-market US subscription">Out-of-market US subscription</span><',
  '>All Games<': '><span data-i18n="All Games">All Games</span><',
  '>Home Only<': '><span data-i18n="Home Only">Home Only</span><',
  '>Away Only<': '><span data-i18n="Away Only">Away Only</span><',
  '>National<': '><span data-i18n="National">National</span><',
  '>Regional<': '><span data-i18n="Regional">Regional</span><',
  '>Opponent<': '><span data-i18n="Opponent">Opponent</span><',
  '>Date / Time<': '><span data-i18n="Date / Time">Date / Time</span><',
  '>English<': '><span data-i18n="English">English</span><',
  '>French<': '><span data-i18n="French">French</span><',
  '>Status<': '><span data-i18n="Status">Status</span><',
  '>Found this Montreal Canadiens guide helpful\\?<': '><span data-i18n="Found this Montreal Canadiens guide helpful?">Found this Montreal Canadiens guide helpful?</span><',
  '>How Blackouts Work<': '><span data-i18n="How Blackouts Work">How Blackouts Work</span><',
  '>Close<': '><span data-i18n="Close">Close</span><'
};

for (const [key, value] of Object.entries(dict)) {
  const search = key.replace(/\\/g, ''); // unescape for exact string match if needed, wait no, let's keep it simple
  html = html.replace(new RegExp(key, 'g'), value);
}

// Special cases
html = html.replace(
  'Montreal Canadiens TV &amp; Blackout Guide',
  '<span data-i18n="Montreal Canadiens TV &amp; Blackout Guide">Montreal Canadiens TV &amp; Blackout Guide</span>'
);
html = html.replace(
  'Find exactly what channel or streaming service you need for tonight\'s game.',
  '<span data-i18n="Find exactly what channel or streaming service you need for tonight\'s game.">Find exactly what channel or streaming service you need for tonight\'s game.</span>'
);
html = html.replace(
  'Where do you live?',
  '<span data-i18n="Where do you live?">Where do you live?</span>'
);
html = html.replace(
  'placeholder="Filter by opponent..."',
  'data-i18n-placeholder="Filter by opponent..." placeholder="Filter by opponent..."'
);

fs.writeFileSync('teams/montreal/index.html', html);
