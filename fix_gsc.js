const fs = require('fs');

function inject(file) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace('content="YOUR_TOKEN_HERE"', 'content="9xDuDaZ6t2VaHECBLicoF274o-jsjOjxz9Shb9P7TYQ"');
  fs.writeFileSync(file, content);
}

inject('teams/toronto/index.html');
inject('teams/montreal/index.html');

console.log('Fixed GSC tags.');
