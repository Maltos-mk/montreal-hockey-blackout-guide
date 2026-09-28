const fs = require('fs');

function stripAmazonBlackout(file) {
  let js = fs.readFileSync(file, 'utf8');

  js = js.replace(
    /<a href="https:\/\/www\.amazon\.ca[^>]+>([\s\S]*?)<\/a>/g,
    '<span class="font-bold">$1</span>'
  );

  fs.writeFileSync(file, js);
}

stripAmazonBlackout('teams/toronto/blackout.js');
