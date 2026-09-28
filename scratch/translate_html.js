const fs = require('fs');

const file = 'teams/montreal/index.html';
let html = fs.readFileSync(file, 'utf8');

const replacements = [
  ['Where do you live\\?', '<span data-i18n="where-live">Where do you live?</span>'],
  ['In Montreal Region', '<span data-i18n="in-market">In Montreal Region</span>'],
  ['Out of Market \\(Canada\\)', '<span data-i18n="out-market">Out of Market (Canada)</span>'],
  ['US or International', '<span data-i18n="us-intl">US or International</span>'],
  ['What do you subscribe to\\?', '<span data-i18n="what-subs">What do you subscribe to?</span>'],
  ['Cable / Streaming', '<span data-i18n="cable-streaming">Cable / Streaming</span>'],
  ['Premium NHL Packages', '<span data-i18n="premium-pkgs">Premium NHL Packages</span>'],
  ['All Games', '<span data-i18n="filter-all">All Games</span>'],
  ['Home Only', '<span data-i18n="filter-home">Home Only</span>'],
  ['Away Only', '<span data-i18n="filter-away">Away Only</span>'],
  ['>National<', '><span data-i18n="filter-national">National</span><'],
  ['>Regional<', '><span data-i18n="filter-regional">Regional</span><'],
  ['>Opponent<', '><span data-i18n="th-opp">Opponent</span><'],
  ['>Date / Time<', '><span data-i18n="th-datetime">Date / Time</span><'],
  ['>English<', '><span data-i18n="th-eng">English</span><'],
  ['>French<', '><span data-i18n="th-fre">French</span><'],
  ['>Status<', '><span data-i18n="th-status">Status</span><'],
  ['>Close<', '><span data-i18n="modal-deepdive-close">Close</span><']
];

for (const [en, tag] of replacements) {
  html = html.replace(new RegExp(en, 'g'), tag);
}

fs.writeFileSync(file, html);
