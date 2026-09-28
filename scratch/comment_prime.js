const fs = require('fs');

function commentPrimeLink(file) {
  let html = fs.readFileSync(file, 'utf8');

  // Find the div containing the amazon link
  html = html.replace(
    /(<div class="text-\[11px\] pl-7 pt-1">\s*<a href="https:\/\/www\.amazon\.ca[^>]+>[\s\S]*?<\/a>\s*<\/div>)/g,
    '<!-- $1 -->'
  );

  fs.writeFileSync(file, html);
}

commentPrimeLink('teams/montreal/index.html');
commentPrimeLink('teams/toronto/index.html');
