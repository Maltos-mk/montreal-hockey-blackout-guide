const fs = require('fs');

let html = fs.readFileSync('teams/montreal/index.html', 'utf8');

const stringsToTag = [
  'Montreal Canadiens TV &amp; Blackout Guide',
  'Find exactly what channel or streaming service you need for tonight\\\'s game.',
  'Add App',
  'Where do you live?',
  'In Montreal Region',
  'Out of Market (Canada)',
  'US or International',
  'What do you subscribe to?',
  'Cable / Streaming',
  'Premium NHL Packages',
  'TSN2 (English)',
  'Regional mid-week games',
  'RDS (French)',
  'Sportsnet (National)',
  'Hockey Night in Canada / Saturday',
  'Amazon Prime Video',
  'Monday night national games',
  'TVA Sports',
  'National French games (Saturday)',
  'Sportsnet\\+ PREMIUM',
  'Unlocks out-of-market Canadian games',
  'ESPN\\+ / NHL.tv',
  'Out-of-market US subscription',
  'All Games',
  'Home Only',
  'Away Only',
  'National',
  'Regional',
  'Opponent',
  'Date / Time',
  'English',
  'French',
  'Status',
  'Found this Montreal Canadiens guide helpful?',
  'Buy me a coffee on Ko-fi &rarr;',
  'How Blackouts Work',
  'Close'
];

stringsToTag.forEach(str => {
  // Be careful not to replace inside HTML tags
  const rawStr = str.replace(/\\/g, ''); // unescape for matching
  // Replace ">String<" with "> <span data-i18n='String'>String</span> <"
  const regex = new RegExp(`>\\s*${str}\\s*<`, 'g');
  html = html.replace(regex, `><span data-i18n="${rawStr}">${rawStr}</span><`);
});

// Fix special cases like placeholders
html = html.replace('placeholder="Filter by opponent..."', 'data-i18n-placeholder="Filter by opponent..." placeholder="Filter by opponent..."');

fs.writeFileSync('teams/montreal/index.html', html);
