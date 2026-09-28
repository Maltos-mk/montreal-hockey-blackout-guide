const fs = require('fs');

let html = fs.readFileSync('teams/montreal/index.html', 'utf8');

const stringsToTag = [
  'Montreal Canadiens TV &amp; Blackout Guide',
  'Find exactly what channel or streaming service you need for tonight\\\'s game.',
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
  'How Blackouts Work',
  'Close'
];

stringsToTag.forEach(str => {
  const rawStr = str.replace(/\\/g, ''); // unescape for matching
  const regex = new RegExp(`>\\s*${str}\\s*<`, 'g');
  html = html.replace(regex, `><span data-i18n="${rawStr}">${rawStr}</span><`);
});

fs.writeFileSync('teams/montreal/index.html', html);
