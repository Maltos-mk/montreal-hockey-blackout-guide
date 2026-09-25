const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf-8');

js = js.replace('text: "Check if tonight\\'s game is blacked out!",', '// removed text property so native Copy Link only copies the URL');

fs.writeFileSync('shared/app.js', js);
