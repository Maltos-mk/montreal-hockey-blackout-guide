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

  let faqHtml = '';
  let schemaText = '';
  if (team.id === 'TOR') {
    faqHtml = `<p>
          <strong>Why are Toronto Maple Leafs games blacked out on TSN4 or Sportsnet Ontario in Eastern Ontario?</strong><br>
          The NHL broadcast boundary line in Ontario is drawn roughly between Belleville and Kingston. If you live in Toronto, the GTA, Belleville, or anywhere west of there, you are in the Leafs' home territory and can watch regional games on standard cable. However, if you live in the Ottawa Valley (including Kingston, Pembroke, Ottawa, Cornwall) or further east, you are in the Senators/Canadiens home territory. In that zone, regional Leafs games are blacked out to protect local Sens/Habs rights unless you subscribe to <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>.
        </p>`;
    schemaText = "The broadcast boundary line in Ontario is drawn between Belleville and Kingston. If you live in the Ottawa Valley (Kingston, Ottawa, etc) or further east, you are in the Senators/Canadiens territory. Regional Leafs games are blacked out there unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.";
  } else {
    faqHtml = `<p>
          <strong>Why are ${team.name} games blacked out on ${team.networks.regionalEN} in Ontario?</strong><br>
          The NHL broadcast boundary line in Ontario is drawn roughly between Belleville and Kingston. If you live in the Ottawa Valley (including Kingston, Pembroke, Ottawa, Cornwall) or further east into Quebec and Atlantic Canada, you are in the ${team.name}' home territory and can watch regional games on standard cable. However, if you live in Toronto, the GTA, Belleville, or anywhere west of there, you are in the Maple Leafs' home territory. In that zone, regional ${team.name} games are blacked out to protect local Leafs rights unless you subscribe to <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>.
        </p>`;
    schemaText = `The broadcast boundary line in Ontario is drawn between Belleville and Kingston. If you live in Toronto, Belleville, or anywhere west of there, you are in the Maple Leafs territory. Regional ${team.name} games are blacked out there unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.`;
  }
  
  
  let regionalRightsFaq = team.networks.regionalEN;
  if (team.networks.regionalFR) {
    regionalRightsFaq += ' or ' + team.networks.regionalFR;
  }
  html = html.replace(/\{\{REGIONAL_RIGHTS_FAQ_STRING\}\}/g, regionalRightsFaq);

  html = html.replace(/\{\{FAQ_ONTARIO_BOUNDARY\}\}/g, faqHtml);
  html = html.replace(/\{\{SCHEMA_ONTARIO_BOUNDARY\}\}/g, schemaText);

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
  
  

  const crosslinkRegex = new RegExp(`<a href="[^"]+" data-umami-event="crosslink-[a-z]+" class="[^"]*">${team.name}</a>`, 'g');
  html = html.replace(crosslinkRegex, '');
  
  const teamDir = `teams/${team.name.split(' ')[0].toLowerCase()}`;
  if (!fs.existsSync(teamDir)) fs.mkdirSync(teamDir, { recursive: true });
  
  fs.writeFileSync(path.join(teamDir, 'index.html'), html);

  // SEO: Generate robots.txt
  const robots = `User-agent: *\nAllow: /\n\nSitemap: https://maltos-mk.github.io/${repoName}/sitemap.xml`;
  fs.writeFileSync(path.join(teamDir, 'robots.txt'), robots);

  // SEO: Generate sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://maltos-mk.github.io/${repoName}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
  fs.writeFileSync(path.join(teamDir, 'sitemap.xml'), sitemap);

  console.log(`Generated HTML for ${team.name}`);
});
