const fs = require('fs');
const path = require('path');
const HB_FR = require('../shared/lang-fr.js');

const BUILD_DIR = path.join(__dirname, '../build');
const templateHtml = fs.readFileSync(path.join(__dirname, '../templates/index-fr.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/mtl.json'), 'utf8'));
const team = data.team;

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
  const homeCity = TEAM_CITIES[homeId] || homeId;
  const awayCity = TEAM_CITIES[awayId] || awayId;
  const homeSlug = slugifyCity(homeCity);
  const awaySlug = slugifyCity(awayCity);
  const datePrefix = g.iso ? g.iso.split('T')[0] : g.date;
  return `/game/${datePrefix}/${homeSlug}-vs-${awaySlug}/`;
}

function formatDateFr(isoStr, fallback) {
  if (!isoStr) return fallback || '';
  try {
    return new Intl.DateTimeFormat('fr-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Toronto'
    }).format(new Date(isoStr));
  } catch (e) {
    return fallback || '';
  }
}

function formatTimeFr(isoStr, fallbackTime) {
  if (!isoStr) return (fallbackTime || '19 h 00') + ' HE';
  try {
    return new Intl.DateTimeFormat('fr-CA', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: 'America/Toronto'
    }).format(new Date(isoStr));
  } catch (e) {
    return (fallbackTime || '19 h 00') + ' HE';
  }
}

function getVsFr(vs, opp) {
  const prefix = vs.startsWith('vs ') ? 'vs ' : '@ ';
  const suffix = vs.includes('Split Squad') ? ' (' + HB_FR.strings['Split Squad'] + ')' : '';
  const nick = (opp && HB_FR.teams[opp]) ? HB_FR.teams[opp][1] : vs.replace('vs ', '').replace('@ ', '').replace(' (Split Squad)', '');
  return prefix + nick + suffix;
}

function getFullMatchupFr(teamId, vsStr, oppCode) {
  const teamNameFr = HB_FR.teams[teamId] ? HB_FR.teams[teamId][0] : teamId;
  const oppNameFr = HB_FR.teams[oppCode] ? HB_FR.teams[oppCode][0] : oppCode;
  const isAway = vsStr.startsWith('@');
  return isAway
    ? HB_FR.format(HB_FR.strings['{0} at {1}'], [teamNameFr, oppNameFr])
    : HB_FR.format(HB_FR.strings['{0} vs {1}'], [teamNameFr, oppNameFr]);
}

const timestamp = Date.now();
const [teamNameFr, teamNicknameFr] = HB_FR.teams[team.id];
const teamDirSlug = 'montreal';

let html = templateHtml;
html = html.replace(/\{\{TEAM_NAME_FR\}\}/g, teamNameFr);
html = html.replace(/\{\{TEAM_NICKNAME_FR\}\}/g, teamNicknameFr);
html = html.replace(/\{\{CITY_NAME_FR\}\}/g, 'Montréal');
html = html.replace(/\{\{TEAM_DIR\}\}/g, teamDirSlug);
html = html.replace(/\{\{TEAM_ID\}\}/g, team.id);
html = html.replace(/\{\{BUILD_TIMESTAMP\}\}/g, String(timestamp));
html = html.replace(/\{\{COLOR_PRIMARY\}\}/g, team.colors.primary);
html = html.replace(/\{\{COLOR_SECONDARY\}\}/g, team.colors.secondary);
html = html.replace(/\{\{COLOR_DARK\}\}/g, team.colors.dark);
html = html.replace(/\{\{REGIONAL_EN\}\}/g, team.networks.regionalEN || '');
html = html.replace(/\{\{REGIONAL_FR\}\}/g, team.networks.regionalFR || '');
html = html.replace(/\{\{REGION_DESCRIPTION_FR\}\}/g, HB_FR.regionDescriptions[team.marketRegion.regionCode] || '');
html = html.replace(/\{\{OWNERSHIP_GROUP\}\}/g, 'Groupe CH, Club de hockey Canadien Inc.');

const regEnCount = data.schedule.filter(g => g.typeEN === 'regional').length;
const regFrCount = team.networks.regionalFR ? data.schedule.filter(g => g.netFR && g.netFR.includes(team.networks.regionalFR)).length : 0;
html = html.replace(/\{\{REGIONAL_EN_COUNT\}\}/g, regEnCount);
html = html.replace(/\{\{REGIONAL_FR_COUNT\}\}/g, regFrCount);

const eastToWest = [
  { id: 'MTL', slug: 'montreal' },
  { id: 'OTT', slug: 'ottawa' },
  { id: 'TOR', slug: 'toronto' },
  { id: 'WPG', slug: 'winnipeg' },
  { id: 'EDM', slug: 'edmonton' },
  { id: 'CGY', slug: 'calgary' },
  { id: 'VAN', slug: 'vancouver' }
];

let topNavLinks = '<a href="https://hockeyblackouts.ca/" class="px-3 py-1 rounded-md hover:text-white hover:bg-white/10 transition border border-transparent mr-2"><i class="fa-solid fa-house mr-1 opacity-50"></i> <span class="text-rose-400">Hockey</span>Blackouts.ca</a><div class="w-px h-4 bg-slate-700 mx-2"></div>';
let footerNavLinks = '<a href="https://hockeyblackouts.ca/" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition font-bold"><i class="fa-solid fa-house mr-1 opacity-50"></i> <span class="text-[#AF1E2D] dark:text-rose-400">Hockey</span>Blackouts.ca</a>\n';

eastToWest.forEach(t => {
  if (t.id === team.id) {
    topNavLinks += `<span class="px-3 py-1 rounded-md text-white font-bold bg-white/20 shadow-sm border border-white/10">${t.id}</span>`;
  } else {
    const frName = HB_FR.teams[t.id][0];
    topNavLinks += `<a href="https://hockeyblackouts.ca/${t.slug}/" class="px-3 py-1 rounded-md hover:text-white hover:bg-white/10 transition border border-transparent">${t.id}</a>`;
    footerNavLinks += `<a href="https://hockeyblackouts.ca/${t.slug}/" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition font-bold">${frName}</a>\n`;
  }
});
html = html.replace(/\{\{NETWORK_LINKS\}\}/g, topNavLinks);
html = html.replace(/\{\{FOOTER_LINKS\}\}/g, footerNavLinks);

const regionOptionsHtml = HB_FR.regionOptions
  .map(([val, label]) => `<option value="${val}"${val === team.marketRegion.regionCode ? ' selected="selected"' : ''}>${label}</option>`)
  .join('\n            ');
html = html.replace(/\{\{REGION_OPTIONS\}\}/g, regionOptionsHtml);

const now = new Date();
const buildDateIso = now.toISOString().split('T')[0];
const buildDateDisplayFr = new Intl.DateTimeFormat('fr-CA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Toronto'
}).format(now);
html = html.replace(/\{\{BUILD_DATE_ISO\}\}/g, buildDateIso);
html = html.replace(/\{\{BUILD_DATE_DISPLAY_FR\}\}/g, buildDateDisplayFr);

const threeHoursThirtyMs = 3.5 * 60 * 60 * 1000;
const upcomingGames = data.schedule.filter(g => {
  const gDate = new Date(g.iso);
  return (now.getTime() - gDate.getTime()) < threeHoursThirtyMs;
});

html = html.replace(
  /\{\{PRERENDERED_COUNT_LABEL\}\}/g,
  HB_FR.format(HB_FR.strings['Showing the {0}-game {1} TV broadcast schedule'], [upcomingGames.length, teamNameFr])
);

function getAccessDescFr(g) {
  const enDesc = g.netEN === 'Prime Video'
    ? 'Requires Amazon Prime Video'
    : g.netEN === 'SN+'
    ? 'Requires Sportsnet+ (Streaming)'
    : g.netEN && g.netEN.includes('TSN')
    ? `Requires ${g.netEN}`
    : g.netEN && g.netEN.includes('Sportsnet')
    ? 'Requires Sportsnet (Cable or Stream)'
    : `Requires ${g.netEN || 'Sportsnet'}`;
  const frDesc = g.netFR && g.netFR !== 'None' ? `Requires ${g.netFR}` : '';
  return HB_FR.translateSummary(frDesc ? `${enDesc} / ${frDesc}` : enDesc);
}

let desktopRows = '';
let mobileCards = '';

upcomingGames.forEach(g => {
  const origIdx = data.schedule.findIndex(orig => orig.id === g.id);
  const gameNum = origIdx + 1;
  const coverageLabel = g.typeEN === 'national'
    ? HB_FR.strings['National (Coast-to-Coast)']
    : g.typeEN === 'prime_wednesday'
    ? HB_FR.strings['Prime Wednesday Exclusive']
    : HB_FR.strings['Regional Territory'];
  const broadcastEN = g.netEN || 'Sportsnet';
  const broadcastFR = g.netFR || 'None';
  const statusBadge = `<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap"><i class="fa-solid fa-lock mr-1 text-[10px]"></i>${HB_FR.strings['Need Sub']}</span>`;
  const accessDesc = getAccessDescFr(g);
  const gameUrl = getGamePath(g, team.id);
  const fullMatchup = getFullMatchupFr(team.id, g.vs, g.opp);
  const vsFr = getVsFr(g.vs, g.opp);
  const dateFr = formatDateFr(g.iso, g.date);
  const timeFr = formatTimeFr(g.iso, g.time);

  desktopRows += `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800/60">
        <td class="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 font-teko text-base text-center">${gameNum}</td>
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="font-semibold text-slate-800 dark:text-slate-200">${dateFr}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-300">${timeFr}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <a href="${gameUrl}" class="hover:text-[#AF1E2D] dark:hover:text-rose-400 hover:underline transition flex items-center gap-1.5" title="${HB_FR.strings['View TV broadcast and blackout breakdown']}">
              <span>${vsFr}</span>
              <i class="fa-solid fa-chevron-right text-[9px] text-slate-500 opacity-75"></i>
            </a>
            ${g.phase === 'preseason' ? `<span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">${HB_FR.strings['Preseason']}</span>` : ''}
            ${g.note ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-teamPrimary/10 text-teamPrimary">${HB_FR.strings[g.note] || g.note}</span>` : ''}
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
                <span>${vsFr}</span>
                <i class="fa-solid fa-chevron-right text-[8px] text-slate-500"></i>
              </a>
            </div>
            <div class="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-tight mt-0.5 truncate">${fullMatchup}</div>
            <div class="text-[11px] text-slate-600 dark:text-slate-300">${dateFr} • ${timeFr}</div>
          </div>
          ${statusBadge}
        </div>
        <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <div class="flex items-center gap-1">
            <span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${broadcastEN}</span>
            ${broadcastFR !== 'None' ? `<span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${broadcastFR}</span>` : ''}
          </div>
          <a href="${gameUrl}" class="text-[11px] font-semibold text-[#AF1E2D] dark:text-rose-400 hover:underline flex items-center gap-1">
            <span>${HB_FR.strings['TV & Blackout Breakdown &rarr;']}</span>
          </a>
        </div>
        <div class="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mt-1">
          ${accessDesc}
        </div>
      </div>`;
});

html = html.replace(/\{\{PRERENDERED_DESKTOP_SCHEDULE\}\}/g, desktopRows);
html = html.replace(/\{\{PRERENDERED_MOBILE_SCHEDULE\}\}/g, mobileCards);

const nextGame = upcomingGames[0] || data.schedule[data.schedule.length - 1];
const nextGameUrl = getGamePath(nextGame, team.id);
const nextGameIdx = data.schedule.findIndex(orig => orig.id === nextGame.id) + 1;
const nextGameStatusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-700 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-lock"></i> ${HB_FR.strings['Subscription Needed']}</span>`;
const nextGameAccessDesc = getAccessDescFr(nextGame);

const upcoming3 = upcomingGames.slice(0, 3);
const upcomingStripHtml = upcoming3.map(ug => {
  const ugUrl = getGamePath(ug, team.id);
  return `
      <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
        <div>
          <div class="font-bold text-white text-sm flex items-center gap-1.5">
            <span class="text-rose-400 font-teko text-base">#${data.schedule.findIndex(s => s.id === ug.id) + 1}</span>
            <a href="${ugUrl}" class="hover:underline hover:text-rose-400">${getVsFr(ug.vs, ug.opp)}</a>
          </div>
          <div class="text-[11px] text-slate-300 mt-0.5">${formatDateFr(ug.iso, ug.date)} • ${formatTimeFr(ug.iso, ug.time)}</div>
        </div>
        <div class="text-right shrink-0">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 text-white border border-white/10">${ug.netEN || 'Sportsnet'}</span>
          <a href="${ugUrl}" class="block text-[10px] text-rose-400 font-semibold hover:underline mt-1">${HB_FR.strings['Breakdown &rarr;']}</a>
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
              ${HB_FR.format(HB_FR.strings['Next {0} Game'], [teamNicknameFr])}
            </span>
            <span class="text-xs text-slate-300 font-medium">${formatDateFr(nextGame.iso, nextGame.date)} • ${formatTimeFr(nextGame.iso, nextGame.time)}</span>
            <span class="text-xs text-slate-400 font-teko text-sm tracking-wide">${HB_FR.format(HB_FR.strings['Game {0} of {1}'], [nextGameIdx, data.schedule.length])}</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-black font-teko uppercase tracking-wide flex items-center gap-2">
            <span>${getVsFr(nextGame.vs, nextGame.opp)}</span>
            ${nextGame.note ? `<span class="text-xs font-sans font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">${HB_FR.strings[nextGame.note] || nextGame.note}</span>` : ''}
          </h3>
          <p class="text-xs text-slate-300 flex items-center gap-2">
            <i class="fa-solid fa-location-dot text-slate-400"></i> ${nextGame.venue}
          </p>
        </div>
        <div class="flex flex-col md:items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-300 font-medium">${HB_FR.strings['Broadcast:']}</span>
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-white text-teamSecondary shadow-sm">${nextGame.netEN || 'Sportsnet'}</span>
            ${nextGame.netFR && nextGame.netFR !== 'None' ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white">${nextGame.netFR}</span>` : ''}
          </div>
          <div>${nextGameStatusBadge}</div>
          <div class="text-[11px] text-slate-300 md:text-right max-w-sm">
            ${nextGameAccessDesc}
          </div>
          <a href="${nextGameUrl}" class="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition">
            <span>${HB_FR.strings['View Blackout Breakdown &rarr;']}</span>
          </a>
        </div>
      </div>
      ${upcoming3.length > 1 ? `
      <div class="mt-4 pt-4 border-t border-white/10">
        <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <i class="fa-solid fa-calendar-days text-rose-400"></i>
          <span>${HB_FR.strings['Upcoming Schedule Snapshot:']}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          ${upcomingStripHtml}
        </div>
      </div>` : ''}
    </div>
  `;

html = html.replace(/\{\{PRERENDERED_SPOTLIGHT_HERO\}\}/g, spotlightHeroHtml);

const frMontrealDir = path.join(BUILD_DIR, 'fr', 'montreal');
fs.mkdirSync(frMontrealDir, { recursive: true });
fs.writeFileSync(path.join(frMontrealDir, 'index.html'), html);

// Write French PWA manifest
const frManifest = {
  name: `Guide de diffusion : ${teamNameFr}`,
  short_name: 'Guide MTL',
  description: `Horaire télé et calculateur de blackouts régionaux pour les matchs des ${teamNameFr}.`,
  lang: 'fr-CA',
  start_url: '/fr/montreal/',
  display: 'standalone',
  background_color: '#0f172a',
  theme_color: team.colors.secondary,
  icons: [
    { src: '/shared/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/shared/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
  ]
};
fs.writeFileSync(path.join(frMontrealDir, 'manifest.json'), JSON.stringify(frManifest, null, 2));

// Inject reciprocal hreflang tags and FR language switcher link into English /montreal/index.html
const enMontrealPath = path.join(BUILD_DIR, 'montreal', 'index.html');
if (fs.existsSync(enMontrealPath)) {
  let enHtml = fs.readFileSync(enMontrealPath, 'utf8');
  if (!enHtml.includes('hreflang="fr-CA"')) {
    const hreflangBlock = `  <link rel="canonical" href="https://hockeyblackouts.ca/montreal/">
  <link rel="alternate" hreflang="en-CA" href="https://hockeyblackouts.ca/montreal/">
  <link rel="alternate" hreflang="en" href="https://hockeyblackouts.ca/montreal/">
  <link rel="alternate" hreflang="fr-CA" href="https://hockeyblackouts.ca/fr/montreal/">
  <link rel="alternate" hreflang="fr" href="https://hockeyblackouts.ca/fr/montreal/">
  <link rel="alternate" hreflang="x-default" href="https://hockeyblackouts.ca/montreal/">`;
    enHtml = enHtml.replace('  <link rel="canonical" href="https://hockeyblackouts.ca/montreal/">', hreflangBlock);
  }

  if (!enHtml.includes('data-lang-switcher="fr"')) {
    const frBtnHtml = `<a href="/fr/montreal/" lang="fr" hreflang="fr-CA" data-lang-switcher="fr" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 shadow-sm flex items-center gap-1.5 transition" title="Version française">
          <i class="fa-solid fa-globe text-sky-200"></i>
          <span>FR</span>
        </a>\n        `;
    enHtml = enHtml.replace('<a href="#faq"', frBtnHtml + '<a href="#faq"');
  }
  fs.writeFileSync(enMontrealPath, enHtml);
}

console.log('Built French Montreal hub at build/fr/montreal/index.html');
