const fs = require('fs');
const path = require('path');

const templateHtml = fs.readFileSync('templates/index.html', 'utf8');
const dataFiles = fs.readdirSync('data').filter(f => f.endsWith('.json')).map(f => 'data/' + f);

dataFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const team = data.team;
  
  let html = templateHtml;
  html = html.replace(/\{\{TEAM_NAME\}\}/g, team.name);
  html = html.replace(/\{\{TEAM_NICKNAME\}\}/g, team.nickname);
  
  
  const repoName = `${team.name.split(' ')[0].toLowerCase()}-hockey-blackout-guide`;
  html = html.replace(/\{\{REPO_NAME\}\}/g, repoName);
  
  const teamDirSlug = team.name.split(' ')[0].toLowerCase();
  html = html.replace(/\{\{TEAM_DIR\}\}/g, teamDirSlug);

  const city = team.name.split(' ')[0];
  html = html.replace(/\{\{CITY_NAME\}\}/g, city); html = html.replace(/\{\{TEAM_ID\}\}/g, team.id);
  html = html.replace(/\{\{REGION_CODE\}\}/g, team.marketRegion.regionCode);
  html = html.replace(/\{\{REGION_DESCRIPTION\}\}/g, team.marketRegion.description);

  let ownership = 'the National Hockey League';
  if(team.id === 'TOR') ownership = 'Maple Leaf Sports & Entertainment (MLSE)';
  if(team.id === 'MTL') ownership = 'Groupe CH, Club de hockey Canadien Inc.';
  if(team.id === 'OTT') ownership = 'Senators Sports & Entertainment';
  if(team.id === 'VAN') ownership = 'Canucks Sports & Entertainment';
  if(team.id === 'CGY') ownership = 'Calgary Sports and Entertainment Corporation';
  if(team.id === 'EDM') ownership = 'Oilers Entertainment Group (OEG)';
  if(team.id === 'WPG') ownership = 'True North Sports & Entertainment';
  html = html.replace(/\{\{OWNERSHIP_GROUP\}\}/g, ownership);
  
  const regionalFrDisclaimer = team.networks.regionalFR ? ', ' + team.networks.regionalFR : '';
  html = html.replace(/\{\{REGIONAL_FR_DISCLAIMER\}\}/g, regionalFrDisclaimer);


  
  
  let quickSummary = '';
  if (team.id === 'TOR') {
    quickSummary = "<strong>Quick Summary for Leafs Fans Living Outside the Toronto Region:</strong> If tonight's Toronto Maple Leafs game is scheduled on Sportsnet, Prime Video, or CBC, you can watch anywhere in Canada without blackouts. If the game is on TSN4 or Sportsnet Ontario, you will be blacked out in Eastern Ontario, Quebec, and the rest of Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'OTT') {
    quickSummary = "<strong>Quick Summary for Sens Fans Living Outside the Ottawa Region:</strong> If tonight's Ottawa Senators game is scheduled on Sportsnet, Prime Video, or CBC, you can watch anywhere in Canada without blackouts. If the game is on TSN5 or RDS, you will be blacked out in Western Ontario and the rest of Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'VAN') {
    quickSummary = "<strong>Quick Summary for Canucks Fans Living Outside BC/Yukon:</strong> If tonight's Vancouver Canucks game is scheduled on Sportsnet, Prime Video, or CBC, you can watch anywhere in Canada without blackouts. If the game is on Sportsnet Pacific, you will be blacked out in Alberta, the Prairies, and Eastern Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'CGY') {
    quickSummary = "<strong>Quick Summary for Flames Fans Living Outside Alberta/Saskatchewan:</strong> If tonight's Calgary Flames game is scheduled on Sportsnet, Prime Video, or CBC, you can watch anywhere in Canada without blackouts. If the game is on Sportsnet West, you will be blacked out in BC, Manitoba, and Eastern Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'EDM') {
    quickSummary = "<strong>Quick Summary for Oilers Fans Living Outside Alberta/Saskatchewan:</strong> If tonight's Edmonton Oilers game is scheduled on Sportsnet, Prime Video, or CBC, you can watch anywhere in Canada without blackouts. If the game is on Sportsnet West, you will be blacked out in BC, Manitoba, and Eastern Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'WPG') {
    quickSummary = "<strong>Quick Summary for Jets Fans Living Outside Manitoba/Saskatchewan:</strong> If tonight's Winnipeg Jets game is scheduled on Sportsnet, Prime Video, or CBC, you can watch anywhere in Canada without blackouts. If the game is on TSN3, you will be blacked out in BC, Alberta, and Eastern Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else {
    quickSummary = "<strong>Quick Summary for Habs Fans Living Outside Quebec:</strong> If tonight's Montreal Canadiens game is scheduled on Sportsnet, Prime Video, CBC, or TVA Sports, you can watch anywhere in Canada without blackouts. If the game is on TSN2 or RDS, you will be blacked out in Western Ontario and the West unless you have Sportsnet+ Premium or NHL Centre Ice.";
  }
  html = html.replace(/\{\{QUICK_SUMMARY\}\}/g, quickSummary);


  
  let faqHtml = '';
  let schemaText = '';
  if (team.id === 'TOR') {
    faqHtml = `<p><strong>Why are Toronto Maple Leafs games blacked out on TSN4 or Sportsnet Ontario in Eastern Ontario?</strong><br>The NHL broadcast boundary line in Ontario is drawn near Belleville. If you live west of Belleville (including Toronto and the GTA), you are in the Leafs' home territory and can watch regional games on standard cable. If you live strictly in Eastern Ontario (Ottawa, Cornwall, Brockville), you are in the Senators/Canadiens home territory. In that zone, regional Leafs games are blacked out to protect local Sens/Habs rights unless you subscribe to <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>. <em>(Note: The Belleville to Kingston corridor is a designated "Overlap" zone where providers offer feeds for both regions. Use the "Ontario Overlap" region in the dropdown above to accurately see your games).</em></p>`;
    schemaText = "The broadcast boundary line in Ontario is drawn between Belleville and Kingston. If you live in the Eastern Ontario (Kingston, Ottawa, etc) or further east, you are in the Senators/Canadiens territory. Regional Leafs games are blacked out there unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'VAN') {
    faqHtml = `<p><strong>Why are Canucks games blacked out in Alberta?</strong><br>The NHL broadcast boundary for the Canucks is drawn at the British Columbia border. The Canucks' home territory covers strictly BC and the Yukon. If you live in Alberta, Saskatchewan, or the NWT, you are in the Flames/Oilers territory. In that zone, regional Canucks games on Sportsnet Pacific are blacked out to protect local rights unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.</p>`;
    schemaText = "The broadcast boundary for the Canucks is the BC border. If you live in Alberta or further east, you are in the Flames/Oilers territory. Regional Canucks games are blacked out there unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'CGY' || team.id === 'EDM') {
    faqHtml = `<p><strong>Why are ${team.nickname} games blacked out in British Columbia?</strong><br>The Flames and Oilers share a massive broadcast territory that covers all of Alberta, Saskatchewan, Nunavut, and the Northwest Territories. If you live in British Columbia, you are in the Canucks' home territory. In that zone, regional ${team.nickname} games on Sportsnet West are blacked out to protect local rights unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.</p>`;
    schemaText = "The Flames and Oilers territory covers Alberta and Saskatchewan. If you live in BC, you are in the Canucks territory. Regional Flames and Oilers games are blacked out there unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'WPG') {
    faqHtml = `<p><strong>Why are Jets games blacked out in Ontario?</strong><br>The NHL broadcast territory for the Jets covers Manitoba, Saskatchewan, Nunavut, and Northwestern Ontario (including Thunder Bay). If you live further east in Ontario (like Toronto or Ottawa), you are in the Leafs or Senators home territory. In that zone, regional Jets games on TSN3 are blacked out to protect local rights unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.</p>`;
    schemaText = "The Jets territory covers Manitoba, Saskatchewan, and Northwestern Ontario. If you live further east, you are in the Leafs or Senators territory. Regional Jets games are blacked out there unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.";
  } else {
    faqHtml = `<p><strong>Why are ${team.name} games blacked out on ${team.networks.regionalEN} in Western Ontario?</strong><br>The NHL broadcast boundary line in Ontario is drawn near Belleville. If you live strictly in Eastern Ontario (Ottawa, Cornwall, Brockville) or further east into Quebec and Atlantic Canada, you are in the ${team.name}' home territory and can watch regional games on standard cable. However, if you live west of Belleville (including Toronto and the GTA), you are in the Maple Leafs' home territory. In that zone, regional ${team.name} games are blacked out to protect local Leafs rights unless you subscribe to <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>. <em>(Note: The Belleville to Kingston corridor is a designated "Overlap" zone where providers offer feeds for both regions. Use the "Ontario Overlap" region in the dropdown above to accurately see your games).</em></p>`;
    schemaText = `The broadcast boundary line in Ontario is drawn between Belleville and Kingston. If you live in Toronto, Belleville, or anywhere west of there, you are in the Maple Leafs territory. Regional ${team.name} games are blacked out there unless you subscribe to Sportsnet+ Premium or NHL Centre Ice.`;
  }
  html = html.replace(/\{\{FAQ_ONTARIO_BOUNDARY\}\}/g, faqHtml);
  html = html.replace(/\{\{SCHEMA_ONTARIO_BOUNDARY\}\}/g, schemaText);


  html = html.replace(/\{\{COLOR_PRIMARY\}\}/g, team.colors.primary);
  html = html.replace(/\{\{COLOR_SECONDARY\}\}/g, team.colors.secondary); html = html.replace(/\{\{COLOR_DARK\}\}/g, team.colors.dark);
  html = html.replace(/\{\{REGIONAL_EN\}\}/g, team.networks.regionalEN || '');
  html = html.replace(/\{\{REGIONAL_FR\}\}/g, team.networks.regionalFR || '');
  
  // Replace the data url based on the file name
  
  // Calculate regional game counts
  const regEnCount = data.schedule.filter(g => g.typeEN === 'regional').length;
  const regFrCount = team.networks.regionalFR ? data.schedule.filter(g => g.netFR && g.netFR.includes(team.networks.regionalFR)).length : 0;
  
  html = html.replace(/\{\{REGIONAL_EN_COUNT\}\}/g, regEnCount);
  html = html.replace(/\{\{REGIONAL_FR_COUNT\}\}/g, regFrCount);
  
  // Format the text string conditionally based on whether French regional exists
  let regionalRightsText = `<strong>${team.networks.regionalEN}</strong> (${regEnCount} English games)`;
  if (team.networks.regionalFR) {
    regionalRightsText += ` and <strong>${team.networks.regionalFR}</strong> (${regFrCount} French games)`;
  }
  html = html.replace(/\{\{REGIONAL_RIGHTS_TEXT\}\}/g, regionalRightsText);

  
  const allTeams = dataFiles.map(f => {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    return {
      id: d.team.id,
      name: d.team.name,
      repoName: `${d.team.name.split(' ')[0].toLowerCase()}-hockey-blackout-guide`
    };
  });

  let topNavLinks = '<a href="https://hockeyblackouts.ca/" data-umami-event="nav-home" class="px-3 py-1 rounded-md hover:text-white hover:bg-white/10 transition border border-transparent"><i class="fa-solid fa-house mr-1 opacity-50"></i> <span style="color:#AF1E2D;">Hockey</span>Blackouts.ca</a>';
  let footerNavLinks = '<a href="https://hockeyblackouts.ca/" data-umami-event="crosslink-home" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition font-bold"><i class="fa-solid fa-house mr-1 opacity-50"></i> <span style="color:#AF1E2D;">Hockey</span>Blackouts.ca</a>\n';
  allTeams.forEach(t => {
    if (t.id === team.id) {
      topNavLinks += `<span class="px-3 py-1 rounded-md text-white font-bold bg-white/20 shadow-sm border border-white/10">${t.id}</span>`;
    } else {
      topNavLinks += `<a href="https://hockeyblackouts.ca/${t.name.split(' ')[0].toLowerCase()}/" data-umami-event="nav-${t.id.toLowerCase()}" class="px-3 py-1 rounded-md hover:text-white hover:bg-white/10 transition border border-transparent">${t.id}</a>`;
      footerNavLinks += `<a href="https://hockeyblackouts.ca/${t.name.split(' ')[0].toLowerCase()}/" data-umami-event="crosslink-${t.id.toLowerCase()}" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition font-bold">${t.name}</a>\n`;
    }
  });
  html = html.replace(/\{\{NETWORK_LINKS\}\}/g, topNavLinks);
  html = html.replace(/\{\{FOOTER_LINKS\}\}/g, footerNavLinks);

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
  const robots = `User-agent: *\nAllow: /\n\nSitemap: https://hockeyblackouts.ca/${team.name.split(' ')[0].toLowerCase()}/sitemap.xml`;
  fs.writeFileSync(path.join(teamDir, 'robots.txt'), robots);

  // SEO: Generate sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://hockeyblackouts.ca/${team.name.split(' ')[0].toLowerCase()}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
  fs.writeFileSync(path.join(teamDir, 'sitemap.xml'), sitemap);

  
  const manifest = {
    "name": `${team.name} Blackout Guide`,
    "short_name": team.id,
    "start_url": ".",
    "display": "standalone",
    "background_color": team.colors.dark,
    "theme_color": team.colors.primary,
    "icons": [
      {
        "src": "shared/favicon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      }
    ]
  };
  fs.writeFileSync(path.join(teamDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`Generated HTML & Manifest for ${team.name}`);
});
