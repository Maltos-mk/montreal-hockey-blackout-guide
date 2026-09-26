const fs = require('fs');

function commentPrimeDisclosure(file) {
  let html = fs.readFileSync(file, 'utf8');

  html = html.replace(
    /(<!-- Statutory Amazon Associate Disclosure -->\s*<p class="text-\[11px\] text-slate-500 italic">\s*As an Amazon Associate I earn from qualifying purchases\.\s*<\/p>)/g,
    '<!-- $1 -->'
  );

  fs.writeFileSync(file, html);
}

commentPrimeDisclosure('teams/montreal/index.html');
commentPrimeDisclosure('teams/toronto/index.html');
