const fs = require('fs');

function stripAmazon(file) {
  let html = fs.readFileSync(file, 'utf8');

  // Strip tracking link
  html = html.replace(
    /<a href="https:\/\/www\.amazon\.ca[^>]+>([\s\S]*?)<\/a>/g,
    '<span class="font-bold">$1</span>'
  );

  // Strip disclosure
  html = html.replace(
    /<!-- Statutory Amazon Associate Disclosure -->[\s\S]*?As an Amazon Associate I earn from qualifying purchases./,
    ''
  );

  fs.writeFileSync(file, html);
}

stripAmazon('teams/montreal/index.html');
stripAmazon('teams/toronto/index.html');
