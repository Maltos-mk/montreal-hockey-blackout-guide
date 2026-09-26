const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf-8');
content = content.replace('content="YOUR_TOKEN_HERE"', 'content="9xDuDaZ6t2VaHECBLicoF274o-jsjOjxz9Shb9P7TYQ"');
fs.writeFileSync('index.html', content);

console.log('Fixed root GSC tag.');
