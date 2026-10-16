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
    quickSummary = "<strong>Quick Summary for Leafs Fans Living Outside the Toronto Region:</strong> If tonight's Toronto Maple Leafs game is scheduled on Sportsnet or Prime Video, you can watch anywhere in Canada without blackouts. If the game is on TSN4 or Sportsnet Ontario, you will be blacked out in Eastern Ontario, Quebec, and the rest of Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'OTT') {
    quickSummary = "<strong>Quick Summary for Sens Fans Living Outside the Ottawa Region:</strong> If tonight's Ottawa Senators game is scheduled on Sportsnet or Prime Video, you can watch anywhere in Canada without blackouts. If the game is on TSN5 or RDS, you will be blacked out in Western Ontario and the rest of Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'VAN') {
    quickSummary = "<strong>Quick Summary for Canucks Fans Living Outside BC/Yukon:</strong> If tonight's Vancouver Canucks game is scheduled on Sportsnet or Prime Video, you can watch anywhere in Canada without blackouts. If the game is on Sportsnet Pacific, you will be blacked out in Alberta, the Prairies, and Eastern Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'CGY') {
    quickSummary = "<strong>Quick Summary for Flames Fans Living Outside Alberta/Saskatchewan:</strong> If tonight's Calgary Flames game is scheduled on Sportsnet or Prime Video, you can watch anywhere in Canada without blackouts. If the game is on Sportsnet West, you will be blacked out in BC, Manitoba, and Eastern Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'EDM') {
    quickSummary = "<strong>Quick Summary for Oilers Fans Living Outside Alberta/Saskatchewan:</strong> If tonight's Edmonton Oilers game is scheduled on Sportsnet or Prime Video, you can watch anywhere in Canada without blackouts. If the game is on Sportsnet West, you will be blacked out in BC, Manitoba, and Eastern Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else if (team.id === 'WPG') {
    quickSummary = "<strong>Quick Summary for Jets Fans Living Outside Manitoba/Saskatchewan:</strong> If tonight's Winnipeg Jets game is scheduled on Sportsnet or Prime Video, you can watch anywhere in Canada without blackouts. If the game is on TSN3, you will be blacked out in BC, Alberta, and Eastern Canada unless you have Sportsnet+ Premium or NHL Centre Ice.";
  } else {
    quickSummary = "<strong>Quick Summary for Habs Fans Living Outside Quebec:</strong> If tonight's Montreal Canadiens game is scheduled on Sportsnet, Prime Video, or TVA Sports, you can watch anywhere in Canada without blackouts. If the game is on TSN2 or RDS, you will be blacked out in Western Ontario and the West unless you have Sportsnet+ Premium or NHL Centre Ice.";
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

  
  const eastToWest = ['MTL', 'OTT', 'TOR', 'WPG', 'EDM', 'CGY', 'VAN'];
  const allTeams = dataFiles.map(f => {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    return {
      id: d.team.id,
      name: d.team.name,
      repoName: `${d.team.name.split(' ')[0].toLowerCase()}-hockey-blackout-guide`
    };
  }).sort((a, b) => eastToWest.indexOf(a.id) - eastToWest.indexOf(b.id));

  let topNavLinks = '<a href="https://hockeyblackouts.ca/" class="px-3 py-1 rounded-md hover:text-white hover:bg-white/10 transition border border-transparent mr-2"><i class="fa-solid fa-house mr-1 opacity-50"></i> <span class="text-rose-400">Hockey</span>Blackouts.ca</a><div class="w-px h-4 bg-slate-700 mx-2"></div>';
  let footerNavLinks = '<a href="https://hockeyblackouts.ca/" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition font-bold"><i class="fa-solid fa-house mr-1 opacity-50"></i> <span class="text-[#AF1E2D] dark:text-rose-400">Hockey</span>Blackouts.ca</a>\n';
  allTeams.forEach(t => {
    if (t.id === team.id) {
      topNavLinks += `<span class="px-3 py-1 rounded-md text-white font-bold bg-white/20 shadow-sm border border-white/10">${t.id}</span>`;
    } else {
      topNavLinks += `<a href="https://hockeyblackouts.ca/${t.name.split(' ')[0].toLowerCase()}/" class="px-3 py-1 rounded-md hover:text-white hover:bg-white/10 transition border border-transparent">${t.id}</a>`;
      footerNavLinks += `<a href="https://hockeyblackouts.ca/${t.name.split(' ')[0].toLowerCase()}/" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition font-bold">${t.name}</a>\n`;
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
  
  

  // Prerender schedule table & mobile cards into static HTML for crawlers and AI Overviews
  const TEAM_CITIES = {
    'MTL': 'Montreal', 'TOR': 'Toronto', 'OTT': 'Ottawa', 'VAN': 'Vancouver',
    'CGY': 'Calgary', 'EDM': 'Edmonton', 'WPG': 'Winnipeg', 'BOS': 'Boston',
    'BUF': 'Buffalo', 'DET': 'Detroit', 'FLA': 'Florida', 'TBL': 'Tampa Bay',
    'CAR': 'Carolina', 'NJD': 'New Jersey', 'NYI': 'New York', 'NYR': 'New York',
    'PHI': 'Philadelphia', 'PIT': 'Pittsburgh', 'WSH': 'Washington', 'CBJ': 'Columbus',
    'CHI': 'Chicago', 'COL': 'Colorado', 'DAL': 'Dallas', 'MIN': 'Minnesota',
    'NSH': 'Nashville', 'STL': 'St Louis', 'UTA': 'Utah', 'ANA': 'Anaheim',
    'LAK': 'Los Angeles', 'SJS': 'San Jose', 'SEA': 'Seattle', 'VGK': 'Vegas'
  };
  function slugifyCity(cityName) {
    return cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  function getGamePath(g, currentTeamId) {
    const isHome = g.vs.startsWith('vs ');
    const homeId = isHome ? currentTeamId : g.opp;
    const awayId = isHome ? g.opp : currentTeamId;
    const homeCity = (TEAM_CITIES[homeId] || homeId);
    const awayCity = (TEAM_CITIES[awayId] || awayId);
    const homeSlug = slugifyCity(homeCity);
    const awaySlug = slugifyCity(awayCity);
    const datePrefix = g.iso ? g.iso.split('T')[0] : g.date;
    return `/game/${datePrefix}/${homeSlug}-vs-${awaySlug}/`;
  }

  let desktopRows = '';
  let mobileCards = '';
  
  data.schedule.forEach((g, idx) => {
    const isNational = g.typeEN === 'national' || g.typeEN === 'prime_wednesday';
    const coverageLabel = g.typeEN === 'national' ? 'National (Coast-to-Coast)' : g.typeEN === 'prime_wednesday' ? 'Prime Wednesday Exclusive' : 'Regional Territory';
    const broadcastEN = g.netEN || 'TBD';
    const broadcastFR = g.netFR || 'None';
    const statusBadge = isNational 
      ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap"><i class="fa-solid fa-check mr-1 text-[10px]"></i>Watchable Nationally</span>'
      : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 whitespace-nowrap"><i class="fa-solid fa-ban mr-1 text-[10px]"></i>Regional Broadcast</span>';
    const accessDesc = isNational 
      ? 'Coast-to-coast national broadcast. Watch anywhere in Canada without blackouts.'
      : `Regional broadcast on ${broadcastEN}. In-market fans can watch on cable; out-of-market viewers require Sportsnet+ Premium or Centre Ice.`;
    const gameUrl = getGamePath(g, team.id);

    desktopRows += `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800/60">
        <td class="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 font-teko text-base text-center">${idx + 1}</td>
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="font-semibold text-slate-800 dark:text-slate-200">${g.date}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-300">${g.time || '7:00 PM ET'}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <a href="${gameUrl}" class="hover:text-[#AF1E2D] dark:hover:text-rose-400 hover:underline transition flex items-center gap-1.5" title="View TV broadcast and blackout breakdown">
              <span>${g.vs}</span>
              <i class="fa-solid fa-chevron-right text-[9px] text-slate-500 opacity-75"></i>
            </a>
            ${g.phase === 'preseason' ? '<span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">Preseason</span>' : ''}
          </div>
          <div class="text-[11px] text-slate-600 dark:text-slate-300">${g.venue}</div>
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center space-x-1.5">
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${broadcastEN}</span>
            ${broadcastFR !== 'None' ? `<span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${broadcastFR}</span>` : ''}
          </div>
        </td>
        <td class="py-3 px-4">
          <span class="text-[11px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">${coverageLabel}</span>
        </td>
        <td class="py-3 px-4 text-right">
          <div>${statusBadge}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">${accessDesc}</div>
        </td>
      </tr>`;

    mobileCards += `
      <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-teko text-base font-bold text-slate-600 dark:text-slate-300">#${idx + 1}</span>
              <a href="${gameUrl}" class="font-bold text-sm text-slate-900 dark:text-white hover:text-[#AF1E2D] dark:hover:text-rose-400 hover:underline flex items-center gap-1">
                <span>${g.vs}</span>
                <i class="fa-solid fa-chevron-right text-[8px] text-slate-500"></i>
              </a>
            </div>
            <div class="text-[11px] text-slate-600 dark:text-slate-300">${g.date} • ${g.time || '7:00 PM ET'}</div>
          </div>
          <div>${statusBadge}</div>
        </div>
        <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${broadcastEN}</span>
          <a href="${gameUrl}" class="text-[11px] font-semibold text-[#AF1E2D] dark:text-rose-400 hover:underline flex items-center gap-1">
            <span>TV & Blackout Breakdown &rarr;</span>
          </a>
        </div>
        <div class="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mt-1">
          ${accessDesc}
        </div>
      </div>`;
  });

  html = html.replace(/\{\{PRERENDERED_DESKTOP_SCHEDULE\}\}/g, desktopRows);
  html = html.replace(/\{\{PRERENDERED_MOBILE_SCHEDULE\}\}/g, mobileCards);

  // Find next upcoming game and generate static spotlight hero
  const now = new Date();
  const buildDateIso = now.toISOString().split('T')[0];
  const buildDateDisplay = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Toronto' });
  html = html.replace(/\{\{BUILD_DATE_ISO\}\}/g, buildDateIso);
  html = html.replace(/\{\{BUILD_DATE_DISPLAY\}\}/g, buildDateDisplay);

  const threeHoursThirtyMs = 3.5 * 60 * 60 * 1000;
  const upcomingGames = data.schedule.filter(g => {
    const gDate = new Date(g.iso);
    return (now.getTime() - gDate.getTime()) < threeHoursThirtyMs;
  });
  const nextGame = upcomingGames[0] || data.schedule[data.schedule.length - 1];
  const nextGameUrl = getGamePath(nextGame, team.id);

  // Format top 3 upcoming games mini-strip
  const upcoming3 = upcomingGames.slice(0, 3);
  const upcomingStripHtml = upcoming3.map((ug) => {
    const ugUrl = getGamePath(ug, team.id);
    return `
      <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
        <div>
          <div class="font-bold text-white text-sm flex items-center gap-1.5">
            <span class="text-rose-400 font-teko text-base">#${data.schedule.findIndex(s => s.id === ug.id) + 1}</span>
            <a href="${ugUrl}" class="hover:underline hover:text-rose-400">${ug.vs}</a>
          </div>
          <div class="text-[11px] text-slate-300 mt-0.5">${ug.date} • ${ug.time || '7:00 PM ET'}</div>
        </div>
        <div class="text-right shrink-0">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 text-white border border-white/10">${ug.netEN || 'Sportsnet'}</span>
          <a href="${ugUrl}" class="block text-[10px] text-rose-400 font-semibold hover:underline mt-1">Breakdown &rarr;</a>
        </div>
      </div>
    `;
  }).join('');

  const spotlightHeroHtml = `
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teamSecondary via-slate-900 to-teamDark p-5 sm:p-6 text-white shadow-md border border-slate-700/50" data-spotlight="prerendered">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white">
              Next ${team.nickname} Game
            </span>
            <span class="text-xs text-slate-300 font-medium">${nextGame.date} • ${nextGame.time || '7:00 PM ET'}</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-black font-teko uppercase tracking-wide flex items-center gap-2">
            <span>${nextGame.vs}</span>
            ${nextGame.note ? `<span class="text-xs font-sans font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">${nextGame.note}</span>` : ''}
          </h3>
          <p class="text-xs text-slate-300 flex items-center gap-2">
            <i class="fa-solid fa-location-dot text-slate-400"></i> ${nextGame.venue}
          </p>
        </div>
        <div class="flex flex-col md:items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-300 font-medium">Broadcast:</span>
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-white text-teamSecondary shadow-sm">${nextGame.netEN || 'Sportsnet'}</span>
            ${nextGame.netFR && nextGame.netFR !== 'None' ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white">${nextGame.netFR}</span>` : ''}
          </div>
          <a href="${nextGameUrl}" class="px-4 py-2 rounded-xl bg-[#AF1E2D] hover:bg-[#901824] text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 whitespace-nowrap mt-1">
            <span>View Tonight's Blackout Breakdown &rarr;</span>
          </a>
        </div>
      </div>
      ${upcoming3.length > 1 ? `
      <div class="mt-4 pt-4 border-t border-white/10">
        <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <i class="fa-solid fa-calendar-days text-rose-400"></i>
          <span>Upcoming Schedule Snapshot:</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          ${upcomingStripHtml}
        </div>
      </div>` : ''}
    </div>
  `;

  html = html.replace(/\{\{PRERENDERED_SPOTLIGHT_HERO\}\}/g, spotlightHeroHtml);

  const teamDir = `teams/${team.name.split(' ')[0].toLowerCase()}`;
  if (!fs.existsSync(teamDir)) fs.mkdirSync(teamDir, { recursive: true });
  
  fs.writeFileSync(path.join(teamDir, 'index.html'), html);

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
        "src": "shared/favicon.svg",
        "sizes": "any",
        "type": "image/svg+xml"
      }
    ]
  };
  fs.writeFileSync(path.join(teamDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`Generated HTML & Manifest for ${team.name}`);
});
