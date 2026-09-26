const fs = require('fs');

function commentSection(file) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<section class="bg-gradient-to-r.*?<\/section>/s, function(match) {
    if (match.includes('passion project') || match.includes('Ko-fi')) {
      return `<!--\n${match}\n-->`;
    }
    return match;
  });
  fs.writeFileSync(file, html);
}
commentSection('teams/toronto/index.html');
commentSection('teams/montreal/index.html');
