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
  
  const repoName = `${team.name.split(' ')[0].toLowerCase()}-hockey-blackout-guide`;
  html = html.replace(/\{\{REPO_NAME\}\}/g, repoName);
  const city = team.name.split(' ')[0];
  html = html.replace(/\{\{CITY_NAME\}\}/g, city); html = html.replace(/\{\{TEAM_ID\}\}/g, team.id);
  html = html.replace(/\{\{REGION_CODE\}\}/g, team.marketRegion.regionCode);
  html = html.replace(/\{\{REGION_DESCRIPTION\}\}/g, team.marketRegion.description);
  html = html.replace(/\{\{COLOR_PRIMARY\}\}/g, team.colors.primary);
  html = html.replace(/\{\{COLOR_SECONDARY\}\}/g, team.colors.secondary); html = html.replace(/\{\{COLOR_DARK\}\}/g, team.colors.dark);
  html = html.replace(/\{\{REGIONAL_EN\}\}/g, team.networks.regionalEN || '');
  html = html.replace(/\{\{REGIONAL_FR\}\}/g, team.networks.regionalFR || '');
  
  // Replace the data url based on the file name
  
  // Calculate regional game counts
  const regEnCount = data.schedule.filter(g => g.netEN && g.netEN.includes(team.networks.regionalEN)).length;
  const regFrCount = team.networks.regionalFR ? data.schedule.filter(g => g.netFR && g.netFR.includes(team.networks.regionalFR)).length : 0;
  
  html = html.replace(/\{\{REGIONAL_EN_COUNT\}\}/g, regEnCount);
  html = html.replace(/\{\{REGIONAL_FR_COUNT\}\}/g, regFrCount);
  
  // Format the text string conditionally based on whether French regional exists
  let regionalRightsText = `<strong>${team.networks.regionalEN}</strong> (${regEnCount} English games)`;
  if (team.networks.regionalFR) {
    regionalRightsText += ` and <strong>${team.networks.regionalFR}</strong> (${regFrCount} French games)`;
  }
  html = html.replace(/\{\{REGIONAL_RIGHTS_TEXT\}\}/g, regionalRightsText);

  const jsonFilename = path.basename(file);
  html = html.replace(/\{\{JSON_FILENAME\}\}/g, jsonFilename);
  
  if (!team.networks.regionalFR) {
    const rdsRegex = /<label[^>]*>(?:(?!<label)[\s\S])*?id="sub_regional_fr"[\s\S]*?<\/label>/;
    html = html.replace(rdsRegex, '');
    const cifRegex = /<label[^>]*>(?:(?!<label)[\s\S])*?id="sub_centre_ice_fr"[\s\S]*?<\/label>/;
    html = html.replace(cifRegex, '');
  }

  // Remove the crosslink for the current team
  
  if (team.id === 'TOR') {
    html = html.replace(/\{\{AMAZON_AFFILIATE_LINK\}\}/g, `              <a href="https://www.amazon.ca/tryprimefree?tag=maltos-20" target="_blank" rel="noopener noreferrer" class="text-[11px] pl-7 pt-1 text-habsRed dark:text-red-400 hover:underline block w-max">
                <span class="font-bold">
                  <span>Need Prime? Try 30-Day Free Trial</span>
                  <i class="fa-solid fa-arrow-up-right-from-square text-[9px] ml-1"></i>
                </span>
              </a>`);
  } else {
    html = html.replace(/\{\{AMAZON_AFFILIATE_LINK\}\}/g, '');
  }

  const crosslinkRegex = new RegExp(`<a href="[^"]+" data-umami-event="crosslink-[a-z]+" class="[^"]*">${team.name}</a>`, 'g');
  html = html.replace(crosslinkRegex, '');
  
  const teamDir = `teams/${team.name.split(' ')[0].toLowerCase()}`;
  if (!fs.existsSync(teamDir)) fs.mkdirSync(teamDir, { recursive: true });
  
  fs.writeFileSync(path.join(teamDir, 'index.html'), html);
  console.log(`Generated HTML for ${team.name}`);
});
