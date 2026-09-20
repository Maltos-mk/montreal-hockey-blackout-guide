const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const gamesMatch = html.match(/const games = (\[[\s\S]*?\]);/);
if (gamesMatch) {
  // safely evaluate to get the JS array
  const games = (new Function("return " + gamesMatch[1]))();
  
  const mtlData = {
    team: {
      id: 'MTL',
      name: 'Montreal Canadiens',
      nickname: 'Habs',
      colors: {
        primary: '#AF1E2D', // habsRed
        secondary: '#192168', // habsBlue
        dark: '#871420' // habsDarkRed
      },
      marketRegion: {
        description: 'QC, Atlantic Canada, Eastern Ontario',
        regionCode: 'mtl_territory'
      }
    },
    schedule: games
  };
  
  fs.writeFileSync('data/mtl.json', JSON.stringify(mtlData, null, 2));
  console.log('Successfully wrote data/mtl.json');
} else {
  console.log('Could not find games array');
}
