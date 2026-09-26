const fs = require('fs');

function stripFiles(files) {
  files.forEach(file => {
    let html = fs.readFileSync(file, 'utf8');

    // Comment out Header Ko-fi
    html = html.replace(/(<a href="https:\/\/ko-fi\.com[^>]+>\s*<i class="fa-solid fa-mug-hot"><\/i>\s*<span>Support on Ko-fi<\/span>\s*<\/a>)/g, '<!--\n        $1\n        -->');

    // Comment out Inline Ko-fi banner
    html = html.replace(/(<section class="max-w-4xl mx-auto w-full px-4 sm:px-6 mb-6">\s*<div class="bg-white.*?Support on Ko-fi.*?<\/section>)/s, '<!--\n    $1\n    -->');

    fs.writeFileSync(file, html);
  });
}

stripFiles(['teams/montreal/index.html', 'teams/toronto/index.html']);

function stripBlackout(files) {
  files.forEach(file => {
    let js = fs.readFileSync(file, 'utf8');
    js = js.replace(/<a href="https:\/\/www\.amazon\.ca[^>]+>Amazon Prime<\/a>/g, '<span class="font-bold">Amazon Prime</span>');
    fs.writeFileSync(file, js);
  });
}

stripBlackout(['teams/montreal/blackout.js', 'teams/toronto/blackout.js']);
