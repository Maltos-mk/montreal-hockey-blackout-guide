const fs = require('fs');

function inject(file) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/href="https:\/\/www\.amazon\.ca\/tryprimefree\?tag=maltos-20" target="_blank" rel="noopener noreferrer" class=/g, 'href="https://www.amazon.ca/tryprimefree?tag=maltos-20" data-umami-event="amazon-prime-click" target="_blank" rel="noopener noreferrer" class=');
  fs.writeFileSync(file, content);
}

inject('teams/toronto/blackout.js');
inject('teams/montreal/blackout.js');
// Check if it exists in toronto HTML without data-umami-event
let torHtml = fs.readFileSync('teams/toronto/index.html', 'utf-8');
if (torHtml.includes('tryprimefree') && !torHtml.includes('amazon-prime-click')) {
  torHtml = torHtml.replace(/href="https:\/\/www\.amazon\.ca\/tryprimefree\?tag=maltos-20"/g, 'href="https://www.amazon.ca/tryprimefree?tag=maltos-20" data-umami-event="amazon-prime-click"');
  fs.writeFileSync('teams/toronto/index.html', torHtml);
}

console.log("Injected Umami events.");
