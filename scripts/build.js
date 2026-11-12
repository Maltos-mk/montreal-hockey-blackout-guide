const fs = require('fs');
const path = require('path');
const { formatEtDate } = require('./lib/date_utils');

const templateHtml = fs.readFileSync('templates/index.html', 'utf8');
const caTeamsMeta = JSON.parse(fs.readFileSync('data/ca_teams.json', 'utf8'));
const CA_7_IDS = new Set(['MTL', 'TOR', 'OTT', 'VAN', 'CGY', 'EDM', 'WPG']);

const dataFiles = caTeamsMeta.map(t => {
  if (CA_7_IDS.has(t.id)) {
    return { meta: t, file: `data/${t.id.toLowerCase()}.json` };
  }
  return { meta: t, file: `data/ca/${t.slug}.json` };
});

dataFiles.forEach(({ meta, file }) => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const team = Object.assign({}, meta, data.team, { slug: meta.slug });
  
  let html = templateHtml;
  html = html.replace(/\{\{TEAM_NAME\}\}/g, team.name);
  html = html.replace(/\{\{TEAM_NICKNAME\}\}/g, team.nickname);
  
  const teamDirSlug = team.slug || team.name.split(' ')[0].toLowerCase();
  const repoName = `${teamDirSlug}-hockey-blackout-guide`;
  html = html.replace(/\{\{REPO_NAME\}\}/g, repoName);
  html = html.replace(/\{\{TEAM_DIR\}\}/g, teamDirSlug);

  const ogTitle = `Where to Watch ${team.name} Tonight | TV & Streams`;
  const ogDescription = `Check live TV channels, streaming options, and regional blackouts for ${team.name} games across Canada.`;
  const ogImageUrl = CA_7_IDS.has(team.id)
    ? `https://hockeyblackouts.ca/og/teams/${teamDirSlug}.png`
    : 'https://hockeyblackouts.ca/og/default.png';
  const ogImageAlt = `${team.name} Canadian TV channels and regional blackout guide`;

  html = html.replace(/\{\{OG_TITLE\}\}/g, ogTitle);
  html = html.replace(/\{\{OG_DESCRIPTION\}\}/g, ogDescription);
  html = html.replace(/\{\{OG_IMAGE_URL\}\}/g, ogImageUrl);
  html = html.replace(/\{\{OG_IMAGE_ALT\}\}/g, ogImageAlt);

  const city = meta.city || team.name.split(' ')[0];
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
  const regionalFrAnd = team.networks.regionalFR ? ' and ' + team.networks.regionalFR : '';
  html = html.replace(/\{\{REGIONAL_FR_AND\}\}/g, regionalFrAnd);
  const regionalFrAmp = team.networks.regionalFR ? ' & ' + team.networks.regionalFR : '';
  html = html.replace(/\{\{REGIONAL_FR_AMP\}\}/g, regionalFrAmp);
  const regionalFrSlash = team.networks.regionalFR ? ' / ' + team.networks.regionalFR : '';
  html = html.replace(/\{\{REGIONAL_FR_SLASH\}\}/g, regionalFrSlash);


  
  
  const isCanadianTeam = CA_7_IDS.has(team.id);

  let quickSummary = '';
  if (!isCanadianTeam) {
    quickSummary = `<strong>Quick Summary for ${team.nickname} Fans in Canada:</strong> Because the ${team.name} are based in the US, their games are out-of-market in Canada. Watch them using <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>, or tune in coast-to-coast without blackouts whenever the ${team.name} air nationally in Canada on <strong>Sportsnet</strong>, <strong>Amazon Prime Video</strong>, or <strong>TVA Sports</strong>.`;
  } else if (team.id === 'TOR') {
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

  let faqQuestion = '';
  let faqAnswerHtml = '';
  if (!isCanadianTeam) {
    faqQuestion = `Why are ${team.name} games considered out-of-market across Canada?`;
    faqAnswerHtml = `Because the ${team.name} are based in the US, their games are out-of-market in Canada and do not have a local Canadian regional TV territory. Watch them using <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable/satellite), unless the matchup is selected for a coast-to-coast Canadian national broadcast on <strong>Sportsnet</strong>, <strong>Amazon Prime Video</strong>, or <strong>TVA Sports</strong>, or played against a Canadian team inside that Canadian team's home broadcast region.`;
  } else if (team.id === 'TOR') {
    faqQuestion = 'Why are Toronto Maple Leafs games blacked out on TSN4 or Sportsnet Ontario in Eastern Ontario?';
    faqAnswerHtml = `The NHL broadcast boundary line in Ontario is drawn near Belleville. If you live west of Belleville (including Toronto and the GTA), you are in the Leafs' home territory and can watch regional games on standard cable. If you live strictly in Eastern Ontario (Ottawa, Cornwall, Brockville), you are in the Senators/Canadiens home territory. In that zone, regional Leafs games are blacked out to protect local Sens/Habs rights unless you subscribe to <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>. <em>(Note: The Belleville to Kingston corridor is a designated "Overlap" zone where providers offer feeds for both regions. Use the "Ontario Overlap" region in the dropdown above to accurately see your games).</em>`;
  } else if (team.id === 'VAN') {
    faqQuestion = 'Why are Canucks games blacked out in Alberta?';
    faqAnswerHtml = `The NHL broadcast boundary for the Canucks is drawn at the British Columbia border. The Canucks' home territory covers strictly BC and the Yukon. If you live in Alberta, Saskatchewan, or the NWT, you are in the Flames/Oilers territory. In that zone, regional Canucks games on Sportsnet Pacific are blacked out to protect local rights unless you subscribe to <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>.`;
  } else if (team.id === 'CGY' || team.id === 'EDM') {
    faqQuestion = `Why are ${team.nickname} games blacked out in British Columbia?`;
    faqAnswerHtml = `The Flames and Oilers share a massive broadcast territory that covers all of Alberta, Saskatchewan, Nunavut, and the Northwest Territories. If you live in British Columbia, you are in the Canucks' home territory. In that zone, regional ${team.nickname} games on Sportsnet West are blacked out to protect local rights unless you subscribe to <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>.`;
  } else if (team.id === 'WPG') {
    faqQuestion = 'Why are Jets games blacked out in Ontario?';
    faqAnswerHtml = `The NHL broadcast territory for the Jets covers Manitoba, Saskatchewan, Nunavut, and Northwestern Ontario (including Thunder Bay). If you live further east in Ontario (like Toronto or Ottawa), you are in the Leafs or Senators home territory. In that zone, regional Jets games on TSN3 are blacked out to protect local rights unless you subscribe to <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>.`;
  } else {
    faqQuestion = `Why are ${team.name} games blacked out on ${team.networks.regionalEN} in Western Ontario?`;
    faqAnswerHtml = `The NHL broadcast boundary line in Ontario is drawn near Belleville. If you live strictly in Eastern Ontario (Ottawa, Cornwall, Brockville) or further east into Quebec and Atlantic Canada, you are in the ${team.name}' home territory and can watch regional games on standard cable. However, if you live west of Belleville (including Toronto and the GTA), you are in the Maple Leafs' home territory. In that zone, regional ${team.name} games are blacked out to protect local Leafs rights unless you subscribe to <strong>Sportsnet+ Premium</strong> or <strong>NHL Centre Ice</strong>. <em>(Note: The Belleville to Kingston corridor is a designated "Overlap" zone where providers offer feeds for both regions. Use the "Ontario Overlap" region in the dropdown above to accurately see your games).</em>`;
  }
  const faqHtml = `<div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">\n          <h3 class="font-bold text-slate-800 dark:text-slate-200 mb-1" itemprop="name">${faqQuestion}</h3>\n          <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">\n            <p itemprop="text">${faqAnswerHtml}</p>\n          </div>\n        </div>`;
  const schemaQuestionJson = JSON.stringify(faqQuestion).slice(1, -1);
  const schemaTextJson = JSON.stringify(faqAnswerHtml.replace(/<[^>]+>/g, '')).slice(1, -1);
  html = html.replace(/\{\{FAQ_ONTARIO_BOUNDARY\}\}/g, () => faqHtml);
  html = html.replace(/\{\{SCHEMA_ONTARIO_QUESTION\}\}/g, () => schemaQuestionJson);
  html = html.replace(/\{\{SCHEMA_ONTARIO_BOUNDARY\}\}/g, () => schemaTextJson);


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

  if (!isCanadianTeam) {
    const usTeamCaDesc = `Because the ${team.name} are based in the US, their games are out-of-market in Canada. Watch on Sportsnet+ Premium, Centre Ice, Sportsnet, or Prime.`;
    html = html.replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${usTeamCaDesc}">`
    );
    html = html.replace(
      `"name": "Why are ${team.name} games blacked out on ${team.networks.regionalEN} in Ontario?"`,
      `"name": "Why are ${team.name} games considered out-of-market across Canada?"`
    );
    const oldOomAnswer = `Out-of-market fans living outside the team's regional territory can watch all regional ${team.name} games on ${team.networks.regionalEN} by subscribing to Sportsnet+ Premium or NHL Centre Ice. This bypasses the standard blackout restrictions for standard cable subscribers.`;
    const newOomAnswer = `Because the ${team.name} are based in the US, their games are out-of-market in Canada. Watch them using Sportsnet+ Premium (for online streaming) or NHL Centre Ice (for cable/satellite), plus Sportsnet and Amazon Prime Video for national Canadian broadcasts.`;
    html = html.split(oldOomAnswer).join(newOomAnswer);
    html = html.replace(
      `<h3 class="font-bold text-slate-900 dark:text-white">In-Market Full Season Setup</h3>`,
      `<h3 class="font-bold text-slate-900 dark:text-white">Official Out-of-Market Options</h3>`
    );
    html = html.replace(
      `To receive all ${team.name} games locally, you generally need Sportsnet (Saturdays), your local regional channel, and Amazon Prime.`,
      `Because the ${team.name} are based in the US, their games are out-of-market in Canada. Watch them using <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable), plus Sportsnet and Amazon Prime Video for national broadcasts.`
    );
    html = html.replace(
      `<h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Regional ${team.name} Games (${team.networks.regionalEN})</h3>`,
      `<h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Out-of-Market ${team.name} Games in Canada (Sportsnet+ Premium)</h3>`
    );
    html = html.replace(
      `<p class="text-sm font-semibold">My Local Sports Channel (${team.networks.regionalEN})</p>\n                <p class="text-[11px] text-slate-600 dark:text-slate-300">${regEnCount} Regional ${team.nickname} games (in-market only)</p>`,
      `<p class="text-sm font-semibold">My Local Canadian Regional Channel (TSN / SN)</p>\n                <p class="text-[11px] text-slate-600 dark:text-slate-300">Unlocks ${team.nickname} games vs. your local Canadian team</p>`
    );
  }

  
  const eastToWest = ['MTL', 'OTT', 'TOR', 'WPG', 'EDM', 'CGY', 'VAN'];
  const allTeams = caTeamsMeta.map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    country: t.country
  })).sort((a, b) => {
    const ia = eastToWest.indexOf(a.id);
    const ib = eastToWest.indexOf(b.id);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  let topNavLinks = `<a href="https://hockeyblackouts.ca/" class="px-3 py-1 rounded-md hover:text-white hover:bg-white/10 transition border border-transparent mr-1"><i class="fa-solid fa-house mr-1 opacity-50"></i> <span class="text-rose-400">Hockey</span>Blackouts.ca</a><div class="w-px h-4 bg-slate-700 mx-1.5"></div><div class="inline-flex items-center rounded-lg bg-slate-800/90 border border-slate-700 p-0.5 text-[11px] font-semibold mr-2"><span class="px-2.5 py-0.5 rounded-md bg-white/15 text-white font-bold shadow-sm">🇨🇦 Canada View</span><span class="text-slate-600 px-1">|</span><a href="https://hockeyblackouts.com/${teamDirSlug}/?utm_source=hockeyblackouts.ca&amp;utm_medium=crosslink&amp;utm_campaign=blackout_guide&amp;utm_content=nav_switch" data-umami-event="switch-to-us" data-umami-event-team="${teamDirSlug}" data-umami-event-placement="nav" class="px-2.5 py-0.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition">🇺🇸 Switch to US</a></div><div class="w-px h-4 bg-slate-700 mx-1.5"></div>`;
  let footerNavLinks = '<a href="https://hockeyblackouts.ca/" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition font-bold"><i class="fa-solid fa-house mr-1 opacity-50"></i> <span class="text-[#AF1E2D] dark:text-rose-400">Hockey</span>Blackouts.ca</a>\n';
  allTeams.forEach(t => {
    if (t.id === team.id) {
      topNavLinks += `<span class="px-3 py-1 rounded-md text-white font-bold bg-white/20 shadow-sm border border-white/10">${t.id}</span>`;
    } else {
      topNavLinks += `<a href="https://hockeyblackouts.ca/${t.slug}/" class="px-3 py-1 rounded-md hover:text-white hover:bg-white/10 transition border border-transparent">${t.id}</a>`;
      footerNavLinks += `<a href="https://hockeyblackouts.ca/${t.slug}/" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition font-bold">${t.name}</a>\n`;
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
    if (!CA_7_IDS.has(currentTeamId) && !CA_7_IDS.has(g.opp)) {
      return '#scheduleTableBody';
    }
    const isHome = g.vs.startsWith('vs ');
    const homeId = isHome ? currentTeamId : g.opp;
    const awayId = isHome ? g.opp : currentTeamId;
    const homeCity = (TEAM_CITIES[homeId] || homeId);
    const awayCity = (TEAM_CITIES[awayId] || awayId);
    const homeSlug = slugifyCity(homeCity);
    const awaySlug = slugifyCity(awayCity);
    const datePrefix = g.iso ? formatEtDate(g.iso, g.date) : g.date;
    return `/game/${datePrefix}/${homeSlug}-vs-${awaySlug}/`;
  }

  // Pre-select team's home market region in dropdown
  const regionOptionsHtml = [
    { val: 'on_east_qc_atl', label: 'Quebec, Eastern Ontario (Ottawa), Atlantic Canada' },
    { val: 'on_overlap', label: 'Ontario Overlap (Belleville, Kingston, Pembroke)' },
    { val: 'on_west', label: 'Ontario West (Toronto, London, Niagara)' },
    { val: 'nw_on', label: 'Northwestern Ontario (Thunder Bay)' },
    { val: 'mb', label: 'Manitoba' },
    { val: 'sk', label: 'Saskatchewan, NWT & Nunavut' },
    { val: 'ab', label: 'Alberta' },
    { val: 'bc', label: 'British Columbia & Yukon' },
    { val: 'us_intl', label: 'USA & International' },
  ].map(opt => `<option value="${opt.val}"${opt.val === team.marketRegion.regionCode ? ' selected="selected"' : ''}>${opt.label}</option>`).join('\n            ');
  html = html.replace(/\{\{REGION_OPTIONS\}\}/g, regionOptionsHtml);

  // Time & Upcoming Games Filtering (default view is upcoming games)
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

  html = html.replace(/\{\{PRERENDERED_COUNT_LABEL\}\}/g, `Showing the ${upcomingGames.length}-game ${team.name} TV broadcast schedule`);

  const NHL_TEAMS = {
    'ANA': 'Anaheim Ducks', 'BOS': 'Boston Bruins', 'BUF': 'Buffalo Sabres', 'CAR': 'Carolina Hurricanes',
    'CBJ': 'Columbus Blue Jackets', 'CGY': 'Calgary Flames', 'CHI': 'Chicago Blackhawks', 'COL': 'Colorado Avalanche',
    'DAL': 'Dallas Stars', 'DET': 'Detroit Red Wings', 'EDM': 'Edmonton Oilers', 'FLA': 'Florida Panthers',
    'LAK': 'Los Angeles Kings', 'MIN': 'Minnesota Wild', 'MTL': 'Montreal Canadiens', 'NJD': 'New Jersey Devils',
    'NSH': 'Nashville Predators', 'NYI': 'New York Islanders', 'NYR': 'New York Rangers', 'OTT': 'Ottawa Senators',
    'PHI': 'Philadelphia Flyers', 'PIT': 'Pittsburgh Penguins', 'SJS': 'San Jose Sharks', 'SEA': 'Seattle Kraken',
    'STL': 'St. Louis Blues', 'TBL': 'Tampa Bay Lightning', 'TOR': 'Toronto Maple Leafs', 'UTA': 'Utah Mammoth',
    'VAN': 'Vancouver Canucks', 'VGK': 'Vegas Golden Knights', 'WSH': 'Washington Capitals', 'WPG': 'Winnipeg Jets'
  };
  function getFullMatchup(teamName, vsStr, oppCode) {
    const oppName = NHL_TEAMS[oppCode] || oppCode;
    const isAway = vsStr.startsWith('@');
    return isAway ? `${teamName} at ${oppName}` : `${teamName} vs ${oppName}`;
  }

  let desktopRows = '';
  let mobileCards = '';
  
  // Prerender next 10 upcoming games in static HTML (~3 weeks) so total HTML stays <110KB
  // (under Bing's ~125-150KB HTML truncation limit) while keeping #faq in the indexed window
  // and preventing above-the-fold CLS. Client JS (shared/app.js) hydrates all 84 games immediately.
  upcomingGames.slice(0, 10).forEach((g) => {
    const origIdx = data.schedule.findIndex(orig => orig.id === g.id);
    const gameNum = origIdx + 1;
    const isNational = g.typeEN === 'national' || g.typeEN === 'prime_wednesday';
    const coverageLabel = g.typeEN === 'national' ? 'National (Coast-to-Coast)' : g.typeEN === 'prime_wednesday' ? 'Prime Wednesday Exclusive' : 'Regional Territory';
    const broadcastEN = g.netEN || 'TBD';
    const broadcastFR = g.netFR || 'None';
    const statusBadge = isNational 
      ? '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap"><i class="fa-solid fa-check mr-1 text-[10px]"></i>Watchable</span>'
      : '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap"><i class="fa-solid fa-lock mr-1 text-[10px]"></i>Need Sub</span>';
    const accessDesc = g.netEN === 'Prime Video'
      ? 'Requires Amazon Prime Video'
      : g.netEN === 'SN+'
      ? 'Requires Sportsnet+ (Streaming)'
      : g.netEN && g.netEN.includes('TSN')
      ? 'Requires TSN'
      : g.netEN && g.netEN.includes('Sportsnet')
      ? 'Requires Sportsnet (Cable or Stream)'
      : `Requires ${g.netEN || 'channel subscription'}`;
    const gameUrl = getGamePath(g, team.id);
    const fullMatchup = getFullMatchup(team.name, g.vs, g.opp);

    desktopRows += `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800/60">
        <td class="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 font-teko text-base text-center">${gameNum}</td>
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
            ${g.note ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-teamPrimary/10 text-teamPrimary">${g.note}</span>` : ''}
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
              <span class="font-teko text-base font-bold text-slate-600 dark:text-slate-300">#${gameNum}</span>
              <a href="${gameUrl}" class="font-bold text-sm text-slate-900 dark:text-white hover:text-[#AF1E2D] dark:hover:text-rose-400 hover:underline flex items-center gap-1">
                <span>${g.vs}</span>
                <i class="fa-solid fa-chevron-right text-[8px] text-slate-500"></i>
              </a>
            </div>
            <div class="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-tight mt-0.5 truncate">${fullMatchup}</div>
            <div class="text-[11px] text-slate-600 dark:text-slate-300">${g.date} • ${g.time || '7:00 PM ET'}</div>
          </div>
          ${statusBadge}
        </div>
        <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <div class="flex items-center gap-1">
            <span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${broadcastEN}</span>
            ${broadcastFR !== 'None' ? `<span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${broadcastFR}</span>` : ''}
          </div>
          <a href="${gameUrl}" class="text-[11px] font-semibold text-[#AF1E2D] dark:text-rose-400 hover:underline flex items-center gap-1">
            <span>TV & Blackout Breakdown &rarr;</span>
          </a>
        </div>
        <div class="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mt-1">
          ${accessDesc}
        </div>
      </div>`;
  });

  html = html.replace(/\{\{PRERENDERED_DESKTOP_SCHEDULE\}\}/g, desktopRows.replace(/^[ \t]+/gm, ''));
  html = html.replace(/\{\{PRERENDERED_MOBILE_SCHEDULE\}\}/g, mobileCards.replace(/^[ \t]+/gm, ''));

  // Find next upcoming game and generate static spotlight hero
  const nextGame = upcomingGames[0] || data.schedule[data.schedule.length - 1];
  const nextGameUrl = getGamePath(nextGame, team.id);
  const nextGameIdx = data.schedule.findIndex(orig => orig.id === nextGame.id) + 1;
  const nextGameStatusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-700 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-lock"></i> Subscription Needed</span>';
  const nextGameAccessDesc = nextGame.netEN === 'Prime Video'
    ? 'Requires Amazon Prime Video'
    : nextGame.netEN === 'SN+'
    ? 'Requires Sportsnet+ (Streaming)'
    : nextGame.netEN && nextGame.netEN.includes('TSN')
    ? 'Requires TSN'
    : nextGame.netEN && nextGame.netEN.includes('Sportsnet')
    ? 'Requires Sportsnet (Cable or Stream)'
    : `Requires ${nextGame.netEN || 'channel subscription'}`;

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
            <span class="text-xs text-slate-400 font-teko text-sm tracking-wide">Game ${nextGameIdx} of ${data.schedule.length}</span>
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
          <div>${nextGameStatusBadge}</div>
          <div class="text-[11px] text-slate-300 md:text-right max-w-sm">
            ${nextGameAccessDesc}
          </div>
          <a href="${nextGameUrl}" class="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition">
            <span>View Blackout Breakdown &rarr;</span>
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

  // Recent Results & Past Blackouts Archive (Concluded games within the last 14 days)
  const recentGames = data.schedule.filter(g => {
    const gDate = new Date(g.iso);
    const diffDays = (now.getTime() - gDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 14;
  }).reverse().slice(0, 3); // newest 3 only: keeps HTML under the byte budget

  let recentResultsHtml = '';
  if (recentGames.length > 0) {
    const recentCardsHtml = recentGames.map(rg => {
      const origIdx = data.schedule.findIndex(orig => orig.id === rg.id);
      const gameNum = origIdx + 1;
      const gameUrl = getGamePath(rg, team.id);
      const fullMatchup = getFullMatchup(team.name, rg.vs, rg.opp);
      const isNational = rg.typeEN === 'national' || rg.typeEN === 'prime_wednesday';
      const coverageLabel = isNational ? 'National' : 'Regional';
      const coverageClass = isNational
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      const broadcastEN = rg.netEN || 'Sportsnet';
      const broadcastFR = rg.netFR && rg.netFR !== 'None' ? ` / ${rg.netFR}` : '';

      return `
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2 text-xs">
          <div>
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="font-teko text-base font-bold text-slate-600 dark:text-slate-300">#${gameNum}</span>
              <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${coverageClass}">${coverageLabel}</span>
            </div>
            <a href="${gameUrl}" class="font-bold text-sm text-slate-900 dark:text-white hover:text-teamPrimary transition flex items-center gap-1 group">
              <span class="group-hover:underline">${rg.vs}</span>
              <i class="fa-solid fa-chevron-right text-[8px] text-slate-400 group-hover:translate-x-0.5 transition-transform"></i>
            </a>
            <div class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 truncate" title="${fullMatchup}">${rg.date}</div>
          </div>
          <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <span class="text-[11px] font-medium text-slate-700 dark:text-slate-300">${broadcastEN}${broadcastFR}</span>
            <a href="${gameUrl}" class="text-[11px] font-semibold text-teamPrimary hover:underline flex items-center gap-1">
              <span>Breakdown &rarr;</span>
            </a>
          </div>
        </div>`;
    }).join('');

    recentResultsHtml = `
    <section id="recentGamesArchive" class="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm" data-section="recent-archive">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-teamPrimary/10 text-teamPrimary flex items-center justify-center text-sm shrink-0">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase font-teko tracking-wide leading-tight">
              Recent Results & Past Blackouts
            </h3>
            <p class="text-[11px] text-slate-600 dark:text-slate-300">
              Verified Canadian broadcast feeds and regional territory rules from the last 14 days
            </p>
          </div>
        </div>
        <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
          ${recentGames.length} Recent Games
        </span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        ${recentCardsHtml}
      </div>
    </section>`;
  }
  html = html.replace(/\{\{PRERENDERED_RECENT_RESULTS\}\}/g, recentResultsHtml);

  const teamDir = `teams/${team.slug || team.name.split(' ')[0].toLowerCase()}`; // must match the slug build_all.js copies from (e.g. anaheim-ducks)
  if (!fs.existsSync(teamDir)) fs.mkdirSync(teamDir, { recursive: true });
  
  fs.writeFileSync(path.join(teamDir, 'index.html'), html);

  // SEO: Generate sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://hockeyblackouts.ca/${teamDirSlug}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
  fs.writeFileSync(path.join(teamDir, 'sitemap.xml'), sitemap);

  
  const manifest = {
    "name": `${team.name} Blackout Guide`,
    "short_name": team.id,
    "start_url": "./?utm_source=pwa&utm_medium=homescreen",
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
