const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf-8');

const search = `      // Add schedule list
      filteredGames.forEach(g => {`;

const replace = `      // Update All Games button text
      const btnAll = document.getElementById('time_all');
      if (btnAll) {
        btnAll.innerText = \`All Games (\${games.length})\`;
      }
      
      // Add schedule list
      filteredGames.forEach(g => {`;

js = js.replace(search, replace);

fs.writeFileSync('shared/app.js', js);
