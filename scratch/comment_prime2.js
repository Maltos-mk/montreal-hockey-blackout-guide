const fs = require('fs');

function commentPrimeDisclosure(file) {
  let html = fs.readFileSync(file, 'utf8');

  html = html.replace(
    /(<p class="text-\[11px\] leading-relaxed text-slate-500 dark:text-slate-400 mb-2">\s*<strong[^>]*>Disclaimer:<\/strong>[\s\S]*?Amazon Associate[\s\S]*?<\/p>)/g,
    '<!-- $1 -->'
  );

  fs.writeFileSync(file, html);
}

commentPrimeDisclosure('teams/montreal/index.html');
commentPrimeDisclosure('teams/toronto/index.html');
