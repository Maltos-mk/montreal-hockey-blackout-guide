const fs = require('fs');
const path = require('path');

const templateHtml = fs.readFileSync('templates/index.html', 'utf8');
const dataFiles = ['data/mtl.json', 'data/tor.json', 'data/ott.json'];

dataFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const team = data.team;
  
  let html = templateHtml;
  html = html.replace(/\{\{TEAM_NAME\}\}/g, team.name);
  html = html.replace(/\{\{TEAM_NICKNAME\}\}/g, team.nickname);
  
  const city = team.name.split(' ')[0];
  html = html.replace(/\{\{CITY_NAME\}\}/g, city); html = html.replace(/\{\{TEAM_ID\}\}/g, team.id);
  html = html.replace(/\{\{REGION_CODE\}\}/g, team.marketRegion.regionCode);
  html = html.replace(/\{\{COLOR_PRIMARY\}\}/g, team.colors.primary);
  html = html.replace(/\{\{COLOR_SECONDARY\}\}/g, team.colors.secondary); html = html.replace(/\{\{COLOR_DARK\}\}/g, team.colors.dark);
  html = html.replace(/\{\{REGIONAL_EN\}\}/g, team.networks.regionalEN || '');
  html = html.replace(/\{\{REGIONAL_FR\}\}/g, team.networks.regionalFR || '');
  
  // Replace the data url based on the file name
  const jsonFilename = path.basename(file);
  html = html.replace(/\{\{JSON_FILENAME\}\}/g, jsonFilename);
  
  if (!team.networks.regionalFR) {
    const rdsRegex = /<label[^>]*>(?:(?!<label)[\s\S])*?id="sub_regional_fr"[\s\S]*?<\/label>/;
    html = html.replace(rdsRegex, '');
  }
  
  const teamDir = `teams/${team.name.split(' ')[0].toLowerCase()}`;
  if (!fs.existsSync(teamDir)) fs.mkdirSync(teamDir, { recursive: true });
  
  fs.writeFileSync(path.join(teamDir, 'index.html'), html);
  console.log(`Generated HTML for ${team.name}`);
});
