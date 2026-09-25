const fs = require('fs');

const metaTag = '<meta name="google-site-verification" content="9xDuDaZ6t2VaHECBLicoF274o-jsjOjxz9Shb9P7TYQ" />';

function inject(file) {
  let content = fs.readFileSync(file, 'utf-8');
  if (!content.includes('google-site-verification')) {
    // Insert after <meta charset="UTF-8">
    content = content.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    ' + metaTag);
    fs.writeFileSync(file, content);
  }
}

inject('teams/toronto/index.html');
inject('teams/montreal/index.html');

console.log('GSC tags injected.');
