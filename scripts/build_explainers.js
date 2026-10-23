const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../build');
const DATA_DIR = path.join(__dirname, '../data');
const TEMPLATE_PATH = path.join(__dirname, '../templates/explainer.html');

const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

const TEAM_ORDER = ['mtl', 'ott', 'tor', 'wpg', 'edm', 'cgy', 'van'];
const TEAM_DIRS = {
  'MTL': 'montreal', 'TOR': 'toronto', 'OTT': 'ottawa', 'VAN': 'vancouver',
  'CGY': 'calgary', 'EDM': 'edmonton', 'WPG': 'winnipeg'
};
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
const TEAM_NAMES = {
  'MTL': 'Montreal Canadiens', 'TOR': 'Toronto Maple Leafs', 'OTT': 'Ottawa Senators',
  'VAN': 'Vancouver Canucks', 'CGY': 'Calgary Flames', 'EDM': 'Edmonton Oilers',
  'WPG': 'Winnipeg Jets', 'BOS': 'Boston Bruins', 'BUF': 'Buffalo Sabres',
  'DET': 'Detroit Red Wings', 'FLA': 'Florida Panthers', 'TBL': 'Tampa Bay Lightning',
  'CAR': 'Carolina Hurricanes', 'NJD': 'New Jersey Devils', 'NYI': 'New York Islanders',
  'NYR': 'New York Rangers', 'PHI': 'Philadelphia Flyers', 'PIT': 'Pittsburgh Penguins',
  'WSH': 'Washington Capitals', 'CBJ': 'Columbus Blue Jackets', 'CHI': 'Chicago Blackhawks',
  'COL': 'Colorado Avalanche', 'DAL': 'Dallas Stars', 'MIN': 'Minnesota Wild',
  'NSH': 'Nashville Predators', 'STL': 'St. Louis Blues', 'UTA': 'Utah Mammoth',
  'ANA': 'Anaheim Ducks', 'LAK': 'Los Angeles Kings', 'SJS': 'San Jose Sharks',
  'SEA': 'Seattle Kraken', 'VGK': 'Vegas Golden Knights'
};

function slugifyCity(cityName) {
  return cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const now = new Date();
const buildDateIso = now.toISOString().split('T')[0];
const buildDateDisplay = now.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/Toronto'
});

// Load all 7 Canadian team datasets programmatically
const teamDatasets = TEAM_ORDER.map(id => {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${id}.json`), 'utf-8'));
});

function buildSchema(title, description, url, faqs) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": title,
        "description": description,
        "url": url,
        "datePublished": "2026-10-01",
        "dateModified": buildDateIso,
        "author": {
          "@type": "Organization",
          "name": "HockeyBlackouts.ca",
          "url": "https://hockeyblackouts.ca/"
        },
        "publisher": {
          "@type": "Organization",
          "name": "HockeyBlackouts.ca",
          "url": "https://hockeyblackouts.ca/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://hockeyblackouts.ca/shared/favicon-192x192.png"
          }
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.aPlain
          }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://hockeyblackouts.ca/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": title,
            "item": url
          }
        ]
      }
    ]
  }, null, 2);
}

function renderFaqHtml(faqs) {
  return faqs.map(f => `
    <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5">
      <h3 class="font-bold text-white text-sm mb-1.5">${f.q}</h3>
      <p class="text-slate-300 text-xs sm:text-sm leading-relaxed">${f.aHtml || f.aPlain}</p>
    </div>
  `).join('\n');
}

const ALL_GUIDES = [
  { slug: 'sportsnet-plus-blackout-rules', title: 'Sportsnet+ Blackout Rules' },
  { slug: 'tsn-hockey-blackout-rules', title: 'TSN Blackout Rules' },
  { slug: 'prime-hockey-schedule-canada', title: 'Prime Video Hockey Schedule' },
  { slug: 'rds-vs-tva-sports-blackouts', title: 'RDS vs. TVA Sports Rules' },
  { slug: 'how-blackouts-work', title: 'Territory Map & Methodology' }
];

function renderRelatedGuidesHtml(currentSlug) {
  return ALL_GUIDES
    .filter(g => g.slug !== currentSlug)
    .map(g => `
      <a href="https://hockeyblackouts.ca/${g.slug}/" class="p-3 rounded-xl bg-slate-900 border border-white/10 hover:border-[#AF1E2D]/60 transition flex items-center justify-between text-slate-200 font-semibold">
        <span>${g.title}</span>
        <i class="fa-solid fa-chevron-right text-[10px] text-slate-500"></i>
      </a>
    `).join('\n');
}

function writeExplainerPage(config) {
  const canonicalUrl = `https://hockeyblackouts.ca/${config.slug}/`;
  const schemaJson = buildSchema(config.title, config.description, canonicalUrl, config.faqs);
  const faqHtml = renderFaqHtml(config.faqs);
  const relatedGuidesHtml = renderRelatedGuidesHtml(config.slug);

  let html = templateHtml;
  html = html.replace(/\{\{PAGE_TITLE\}\}/g, config.title);
  html = html.replace(/\{\{META_DESCRIPTION\}\}/g, config.description);
  html = html.replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl);
  html = html.replace(/\{\{SCHEMA_JSON\}\}/g, schemaJson);
  html = html.replace(/\{\{BREADCRUMB_LABEL\}\}/g, config.breadcrumb);
  html = html.replace(/\{\{BUILD_DATE_DISPLAY\}\}/g, buildDateDisplay);
  html = html.replace(/\{\{BADGE_ICON\}\}/g, config.badgeIcon);
  html = html.replace(/\{\{BADGE_LABEL\}\}/g, config.badgeLabel);
  html = html.replace(/\{\{H1_HEADING\}\}/g, config.h1);
  html = html.replace(/\{\{HERO_SUBTITLE\}\}/g, config.subtitle);
  html = html.replace(/\{\{MAIN_BODY_HTML\}\}/g, config.bodyHtml);
  html = html.replace(/\{\{FAQ_CONTENT_HTML\}\}/g, faqHtml);
  html = html.replace(/\{\{RELATED_GUIDES_HTML\}\}/g, relatedGuidesHtml);

  const outDir = path.join(BUILD_DIR, config.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

// ============================================================================
// 1. SPORTSNET+ BLACKOUT RULES EXPLAINED
// ============================================================================
const snDecisionCardsHtml = teamDatasets.map(d => {
  const t = d.team;
  const dir = TEAM_DIRS[t.id];
  const isPureTsn = ['WPG', 'OTT', 'MTL'].includes(t.id);
  const isSplit = t.id === 'TOR';

  let inMarketBadge = '';
  let inMarketVerdict = '';
  if (isPureTsn) {
    inMarketBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">DO NOT BUY SN+ IN-MARKET</span>';
    inMarketVerdict = `<p class="text-xs text-rose-300 font-semibold mt-1">Sportsnet owns ZERO regional games for the ${t.name}. Regional games air exclusively on TSN. Buying Sportsnet+ in-market leaves you blacked out for ~50 games.</p>`;
  } else if (isSplit) {
    inMarketBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">STANDARD GETS ~58 GAMES</span>';
    inMarketVerdict = `<p class="text-xs text-slate-300 mt-1">Standard includes 31 regional Sportsnet Ontario games plus 27 national games. The remaining 26 regional games air on TSN4 and are blacked out on Sportsnet.</p>`;
  } else {
    inMarketBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">STANDARD SUFFICIENT</span>';
    inMarketVerdict = `<p class="text-xs text-slate-300 mt-1">Standard includes all in-market regional games on Sportsnet Pacific/West plus all national games.</p>`;
  }

  return `
    <div class="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-2.5">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-white text-sm">${t.name}</h3>
        <span class="text-[11px] text-slate-400 font-mono">${t.networks.regionalEN}</span>
      </div>
      <div class="space-y-1.5 border-t border-white/5 pt-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-300">If You Live In-Market:</span>
          ${inMarketBadge}
        </div>
        ${inMarketVerdict}
      </div>
      <div class="space-y-1 border-t border-white/5 pt-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-300">If You Live Out-of-Market:</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PREMIUM REQUIRED</span>
        </div>
        <p class="text-xs text-emerald-400">Premium unlocks all regional games coast-to-coast.</p>
      </div>
      <div class="pt-1 text-right">
        <a href="https://hockeyblackouts.ca/${dir}/" class="text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1">
          <span>View ${t.name} 84-Game Schedule &rarr;</span>
        </a>
      </div>
    </div>
  `;
}).join('\n');

const snTeamRows = teamDatasets.map(d => {
  const t = d.team;
  const dir = TEAM_DIRS[t.id];
  const regCount = d.schedule.filter(g => g.typeEN === 'regional').length;
  const snRegGames = d.schedule.filter(g => g.typeEN === 'regional' && g.netEN && g.netEN.includes('Sportsnet')).length;
  const tsnRegGames = d.schedule.filter(g => g.typeEN === 'regional' && g.netEN && g.netEN.includes('TSN')).length;
  const snPlusExclusives = d.schedule.filter(g => g.netEN && g.netEN.includes('SN+')).length;
  const primeGames = d.schedule.filter(g => (g.netEN && g.netEN.includes('Prime')) || g.typeEN === 'prime_wednesday').length;
  const natSatGames = d.schedule.length - regCount - primeGames;

  return `
    <tr class="border-b border-white/5 hover:bg-white/[0.02] transition">
      <th scope="row" class="py-3 px-4 font-bold text-white text-left">
        <a href="https://hockeyblackouts.ca/${dir}/" class="hover:text-rose-400 hover:underline flex items-center gap-1.5">
          <span>${t.name}</span>
          <i class="fa-solid fa-chevron-right text-[9px] text-slate-500"></i>
        </a>
      </th>
      <td class="py-3 px-4 text-slate-300">${t.networks.regionalEN}</td>
      <td class="py-3 px-4 text-center font-semibold text-emerald-400">${natSatGames} games</td>
      <td class="py-3 px-4 text-center font-semibold text-sky-400">${snPlusExclusives} games</td>
      <td class="py-3 px-4 text-center text-slate-300">${snRegGames > 0 ? `${snRegGames} games (In-Market)` : `<span class="text-rose-400 font-semibold">0 (TSN holds ${tsnRegGames})</span>`}</td>
      <td class="py-3 px-4 text-center font-bold text-emerald-400">All ${regCount} Regional Unlocked</td>
    </tr>
  `;
}).join('\n');

const snBodyHtml = `
  <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">Sportsnet+ Standard</h2>
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Regional Blackouts Apply</span>
      </div>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        <strong>Sportsnet+ Standard</strong> ($19.99/mo) is a digital streaming alternative to a basic Sportsnet cable channel package. It strictly enforces local broadcast territory walls:
      </p>
      <ul class="space-y-2 text-xs text-slate-300">
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>National Broadcasts:</strong> Unlocks all Saturday night national games and Sportsnet+ national streaming exclusives coast-to-coast.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>In-Market Sportsnet Teams:</strong> Unlocks regional games ONLY if you live inside the home territory of a Sportsnet-carried team (Vancouver, Calgary, Edmonton, or Toronto's Sportsnet Ontario half).</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-ban text-amber-400 mt-1"></i><span><strong>Out-of-Market Blackouts:</strong> Locks you out of regional games for teams outside your physical province.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-ban text-rose-400 mt-1"></i><span><strong>The In-Market TSN Trap:</strong> Does NOT include in-market regional games carried by TSN (Montreal TSN2, Ottawa TSN5, Winnipeg TSN3, or Toronto's 26 TSN4 games).</span></li>
      </ul>
    </div>

    <div class="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">Sportsnet+ Premium</h2>
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Out-of-Market Key</span>
      </div>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        <strong>Sportsnet+ Premium</strong> ($34.99/mo) absorbs the old NHL Live out-of-market streaming package in Canada. It is built specifically for fans cheering for a team outside their local broadcast territory:
      </p>
      <ul class="space-y-2 text-xs text-slate-300">
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>Bypasses Out-of-Market Blackouts:</strong> Streams over 1,000 out-of-market regional games across Canada—even when the game is carried on TSN or RDS in its home market (e.g., watching Habs, Sens, or regional Leafs games from Alberta or BC).</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>Includes All Standard Content:</strong> Includes every national Sportsnet broadcast and all Stanley Cup Playoff games.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-triangle-exclamation text-amber-400 mt-1"></i><span><strong>The In-Market TSN Catch:</strong> If you live <em>inside</em> the home territory of a TSN team (like living in Ottawa for the Senators or Winnipeg for the Jets), local TSN regional games are still blacked out on Sportsnet+ Premium to protect TSN's local territory rights.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-triangle-exclamation text-amber-400 mt-1"></i><span><strong>Prime Exclusives Excluded:</strong> National Wednesday/Monday games exclusive to Amazon Prime Video require a separate Prime membership.</span></li>
      </ul>
    </div>
  </section>

  <!-- Sportsnet Common Error Messages Section -->
  <section class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
        <span>Sportsnet+ On-Screen Blackout Error Messages Explained</span>
      </h2>
      <span class="text-xs text-slate-400">Troubleshooting</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">Standard Error</span>
          <span class="text-[10px] text-slate-400">Sportsnet+ App</span>
        </div>
        <h3 class="text-white font-bold text-sm">"This broadcast is subject to regional blackouts"</h3>
        <p class="text-xs text-slate-300 leading-relaxed">
          <strong>The Cause:</strong> You have Sportsnet+ Standard and clicked on an out-of-market regional feed, or you are physically located in an in-market city where regional rights belong to TSN (Sens, Jets, Habs).
        </p>
        <p class="text-xs text-emerald-400 leading-relaxed">
          <strong>The Fix:</strong> If you are out-of-market, upgrade to <strong>Sportsnet+ Premium</strong>. If you live in Ottawa, Winnipeg, or Montreal, Sportsnet is legally blocked from airing these regional games—you must watch on TSN.
        </p>
      </div>

      <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">Upgrade Prompt</span>
          <span class="text-[10px] text-slate-400">Apple TV / Roku / Fire TV</span>
        </div>
        <h3 class="text-white font-bold text-sm">"Out-of-market game: An upgrade to Sportsnet+ Premium is required"</h3>
        <p class="text-xs text-slate-300 leading-relaxed">
          <strong>The Cause:</strong> You clicked a live game taking place outside your home broadcast territory. Standard tier only covers local in-market Sportsnet feeds.
        </p>
        <p class="text-xs text-emerald-400 leading-relaxed">
          <strong>The Fix:</strong> Upgrading to Premium ($34.99/mo) immediately unlocks over 1,000 out-of-market NHL games across Canada.
        </p>
      </div>
    </div>
  </section>

  <!-- 7-Team Decision Guide: Sportsnet+ Standard vs Premium -->
  <section class="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
    <div class="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h2 class="text-base sm:text-lg font-bold text-white">Sportsnet+ Standard vs. Premium: Team-by-Team Decision Guide</h2>
        <p class="text-xs text-slate-400 mt-0.5">Which tier do you actually need based on where you live and which team you cheer for?</p>
      </div>
      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 w-fit">2026–27 Broadcast Matrix</span>
    </div>

    <!-- Mobile View: Segmented Decision Cards (< 640px) -->
    <div class="block sm:hidden p-4 space-y-3">
      ${snDecisionCardsHtml}
    </div>

    <!-- Desktop View: Semantic Table (>= 640px) -->
    <div class="hidden sm:block overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
          <tr>
            <th scope="col" class="py-3 px-4">Canadian Team</th>
            <th scope="col" class="py-3 px-4">Regional Rights</th>
            <th scope="col" class="py-3 px-4 text-center">National (SN)</th>
            <th scope="col" class="py-3 px-4 text-center">SN+ Exclusive</th>
            <th scope="col" class="py-3 px-4 text-center">SN+ Standard (In-Market)</th>
            <th scope="col" class="py-3 px-4 text-center">SN+ Premium (Out-of-Market)</th>
          </tr>
        </thead>
        <tbody>
          ${snTeamRows}
        </tbody>
      </table>
    </div>
  </section>
`;

writeExplainerPage({
  slug: 'sportsnet-plus-blackout-rules',
  title: 'Sportsnet+ Blackout Rules Explained: Standard vs Premium (2026–27)',
  description: 'Why is my game blacked out on Sportsnet+? Compare Sportsnet+ Standard vs Premium, regional boundaries, and how to watch all 84 games in Canada.',
  breadcrumb: 'Sportsnet+ Blackout Rules',
  badgeIcon: 'fa-tv',
  badgeLabel: 'Streaming Tier Comparison',
  h1: 'Sportsnet+ Blackout Rules Explained: Standard vs. Premium (2026–27)',
  subtitle: 'Find out why regional hockey games still get blacked out on Sportsnet+, the difference between Standard and Premium, and when TSN or Amazon Prime Video holds the broadcast.',
  bodyHtml: snBodyHtml,
  faqs: [
    {
      q: 'What is the difference between Sportsnet+ Standard and Premium for NHL games?',
      aPlain: 'Sportsnet+ Standard ($19.99/mo) unlocks all Saturday national games and in-market regional games for Sportsnet teams (Canucks, Oilers, Flames, and half the Leafs). Sportsnet+ Premium ($34.99/mo) is the out-of-market package: it unlocks over 1,000 out-of-market regional games across Canada, including regional feeds produced by TSN.'
    },
    {
      q: 'Why is my hockey game blacked out on Sportsnet+ Standard?',
      aPlain: 'Sportsnet+ Standard only unlocks regional games if you are physically located inside that team\'s official broadcast territory and Sportsnet holds those regional rights (Vancouver, Calgary, Edmonton, and half of Toronto\'s regional schedule). If you live outside the team\'s territory, you need Sportsnet+ Premium to stream out-of-market regional games.'
    },
    {
      q: 'Does Sportsnet+ Premium remove all blackouts in Canada?',
      aPlain: 'Sportsnet+ Premium removes all out-of-market regional blackouts across Canada. However, two exceptions remain: (1) if you live inside the local broadcast territory of a team whose regional rights are owned by TSN (Montreal, Ottawa, Winnipeg, or Toronto\'s TSN4 games), those in-market games require TSN; and (2) national games exclusive to Amazon Prime Video require a Prime subscription.'
    },
    {
      q: 'What is the difference between Sportsnet on cable and Sportsnet+ streaming?',
      aPlain: 'While regional blackout boundaries are identical between linear cable and Sportsnet+ Standard, the Sportsnet+ streaming service carries roughly 6 to 13 national streaming-exclusive games per Canadian team that do not air on standard regional cable channels.'
    }
  ]
});

// ============================================================================
// 2. PRIME VIDEO HOCKEY SCHEDULE IN CANADA
// ============================================================================
const primeMap = new Map();
teamDatasets.forEach(d => {
  d.schedule.forEach(g => {
    if ((g.netEN && g.netEN.includes('Prime')) || g.typeEN === 'prime_wednesday') {
      const isHome = g.vs.startsWith('vs ');
      const homeId = isHome ? d.team.id : g.opp;
      const awayId = isHome ? g.opp : d.team.id;
      const datePrefix = g.iso.split('T')[0];
      const key = `${datePrefix}_${homeId}_${awayId}`;
      if (!primeMap.has(key)) {
        const homeCity = TEAM_CITIES[homeId] || homeId;
        const awayCity = TEAM_CITIES[awayId] || awayId;
        const gameUrl = `/game/${datePrefix}/${slugifyCity(homeCity)}-vs-${slugifyCity(awayCity)}/`;
        primeMap.set(key, {
          date: g.date,
          time: g.time || '7:00 PM ET',
          iso: g.iso,
          homeId,
          awayId,
          homeName: TEAM_NAMES[homeId] || homeCity,
          awayName: TEAM_NAMES[awayId] || awayCity,
          venue: g.venue,
          netFR: g.netFR && g.netFR !== 'None' ? g.netFR : 'RDS / TVA Sports',
          gameUrl,
          primaryTeamDir: TEAM_DIRS[d.team.id],
          primaryTeamCode: d.team.id
        });
      }
    }
  });
});

const primeGamesSorted = Array.from(primeMap.values()).sort((a, b) => new Date(a.iso) - new Date(b.iso));

const primeRowsHtml = primeGamesSorted.map((pg, idx) => `
  <tr class="border-b border-white/5 hover:bg-white/[0.02] transition">
    <td class="py-3 px-4 font-teko text-base text-slate-400 text-center">${idx + 1}</td>
    <td class="py-3 px-4 whitespace-nowrap">
      <div class="font-semibold text-white">${pg.date}</div>
      <div class="text-[11px] text-slate-400">${pg.time}</div>
    </td>
    <td class="py-3 px-4">
      <a href="${pg.gameUrl}" class="font-bold text-white hover:text-rose-400 hover:underline flex items-center gap-1.5">
        <span>${pg.awayName} @ ${pg.homeName}</span>
        <i class="fa-solid fa-chevron-right text-[9px] text-slate-500"></i>
      </a>
      <div class="text-[11px] text-slate-400">${pg.venue}</div>
    </td>
    <td class="py-3 px-4">
      <span class="px-2 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">Prime Video</span>
    </td>
    <td class="py-3 px-4 text-right">
      <a href="${pg.gameUrl}" class="text-xs font-semibold text-emerald-400 hover:underline">No Blackouts &rarr;</a>
    </td>
  </tr>
`).join('\n');

const primeBodyHtml = `
  <section class="bg-slate-900 border border-sky-500/30 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
    <div class="space-y-1.5 max-w-2xl">
      <div class="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
        <i class="fa-solid fa-circle-check"></i> Coast-to-Coast National Clearance
      </div>
      <h2 class="text-lg font-bold text-white">Zero Regional Blackouts Anywhere in Canada</h2>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        Every game in the Amazon Prime national package clears coast-to-coast across all 10 provinces and 3 territories. These broadcasts do not air on traditional Sportsnet or TSN cable channels in English, but stream included with any standard Amazon Prime membership.
      </p>
    </div>
    <a href="https://www.amazon.ca/tryprimefree?tag=maltos-20" data-umami-event="amazon-prime-click" target="_blank" rel="sponsored noopener noreferrer" class="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition whitespace-nowrap flex items-center gap-1.5 shrink-0">
      <span>Start 30-Day Free Prime Trial</span>
      <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
    </a>
  </section>

  <section class="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
    <div class="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h2 class="text-base sm:text-lg font-bold text-white">Complete 2026–27 Canadian Prime Video Hockey Schedule (${primeGamesSorted.length} Games)</h2>
        <p class="text-xs text-slate-400 mt-0.5">Click any matchup below for full English/French broadcast and radio details:</p>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
          <tr>
            <th class="py-3 px-4 w-12 text-center">#</th>
            <th class="py-3 px-4">Date & Time</th>
            <th class="py-3 px-4">Matchup & Venue</th>
            <th class="py-3 px-4">English Stream</th>
            <th class="py-3 px-4 text-right">Blackout Status</th>
          </tr>
        </thead>
        <tbody>
          ${primeRowsHtml}
        </tbody>
      </table>
    </div>
  </section>
`;

writeExplainerPage({
  slug: 'prime-hockey-schedule-canada',
  title: 'Amazon Prime Hockey Schedule in Canada (2026–27 Broadcast Guide)',
  description: 'Complete 2026–27 schedule of Canadian hockey games streaming exclusively on Amazon Prime Video. Zero regional blackouts across Canada.',
  breadcrumb: 'Prime Video Hockey Schedule',
  badgeIcon: 'fa-circle-play',
  badgeLabel: 'National Streaming Schedule',
  h1: 'Amazon Prime Video Hockey Schedule in Canada (2026–27 Season)',
  subtitle: `All ${primeGamesSorted.length} national Canadian matchups streaming exclusively on Amazon Prime Video during the 2026–27 season, with coast-to-coast access and zero regional blackouts.`,
  bodyHtml: primeBodyHtml,
  faqs: [
    {
      q: 'Are Amazon Prime Video hockey games blacked out in any Canadian province?',
      aPlain: 'No. Every game carried on Amazon Prime Video in Canada is a national broadcast with coast-to-coast clearance. There are zero regional blackouts regardless of which province or territory you live in.'
    },
    {
      q: 'Can I watch Prime exclusive hockey games on Sportsnet or TSN cable?',
      aPlain: 'No. In English across Canada, these national broadcasts are exclusive to Amazon Prime Video and do not air on linear Sportsnet or TSN cable channels. However, French-language feeds for Montreal Canadiens and Ottawa Senators games still air on RDS or TVA Sports.'
    },
    {
      q: 'Do I need an extra sports add-on to watch hockey on Amazon Prime in Canada?',
      aPlain: 'No extra sports add-on is required. All national Prime hockey broadcasts in Canada are included at no additional cost with a standard Amazon Prime membership or 30-day free trial.'
    }
  ]
});

// ============================================================================
// 3. RDS VS TVA SPORTS BLACKOUT RULES
// ============================================================================
const mtlData = teamDatasets.find(d => d.team.id === 'MTL');
const ottData = teamDatasets.find(d => d.team.id === 'OTT');

const mtlRdsCount = mtlData.schedule.filter(g => g.netFR && g.netFR.includes('RDS')).length;
const mtlTvaCount = mtlData.schedule.filter(g => g.netFR && g.netFR.includes('TVA')).length;
const ottRdsCount = ottData.schedule.filter(g => g.netFR && g.netFR.includes('RDS')).length;
const ottTvaCount = ottData.schedule.filter(g => g.netFR && g.netFR.includes('TVA')).length;

const rdsTvaBodyHtml = `
  <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">RDS (Regional French Rights)</h2>
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Geofenced to East</span>
      </div>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        <strong>RDS (Réseau des sports)</strong> holds the official regional French-language broadcast rights for both the Montreal Canadiens (${mtlRdsCount} games) and the Ottawa Senators (${ottRdsCount} games).
      </p>
      <ul class="space-y-2 text-xs text-slate-300">
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>In-Market Territory:</strong> Viewers located in <strong>Quebec, Atlantic Canada (NB, NS, PEI, NL), and Eastern Ontario</strong> (Ottawa, Kingston, Belleville) can watch all RDS games without blackouts.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-ban text-amber-400 mt-1"></i><span><strong>Western Ontario & Western Canada Blackout:</strong> Even if your cable package in Toronto, Winnipeg, Calgary, or Vancouver includes the RDS channel, live Canadiens and Senators regional games are blacked out west of Belleville.</span></li>
      </ul>
    </div>

    <div class="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">TVA Sports (National French Rights)</h2>
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Zero Blackouts</span>
      </div>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        <strong>TVA Sports</strong> holds the national French-language broadcast rights across Canada, including Saturday night <em>La Super Soirée</em> games (${mtlTvaCount} Montreal games and ${ottTvaCount} Ottawa games) and the Stanley Cup Playoffs.
      </p>
      <ul class="space-y-2 text-xs text-slate-300">
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>Coast-to-Coast Clearance:</strong> TVA Sports broadcasts are never blacked out anywhere in Canada. Fans in Ontario, the Prairies, and BC can watch every TVA Sports game on cable or TVA+ streaming.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>Playoffs & National Exclusives:</strong> Carries national French coverage regardless of which province you live in.</span></li>
      </ul>
    </div>
  </section>

  <section class="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
    <div class="p-5 sm:p-6 border-b border-white/10">
      <h2 class="text-base sm:text-lg font-bold text-white">2026–27 French Broadcast Split: Montreal Canadiens & Ottawa Senators</h2>
      <p class="text-xs text-slate-400 mt-1">Exact network allocation across the 84-game schedule:</p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
          <tr>
            <th class="py-3 px-4">Team</th>
            <th class="py-3 px-4 text-center">RDS (Regional French)</th>
            <th class="py-3 px-4 text-center">TVA Sports (National French)</th>
            <th class="py-3 px-4">In-Market Territory</th>
            <th class="py-3 px-4">Out-of-Market Solution (West of Belleville)</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/5">
            <td class="py-3 px-4 font-bold text-white"><a href="https://hockeyblackouts.ca/montreal/" class="hover:text-rose-400 hover:underline">Montreal Canadiens &rarr;</a></td>
            <td class="py-3 px-4 text-center font-semibold text-amber-400">${mtlRdsCount} games</td>
            <td class="py-3 px-4 text-center font-semibold text-emerald-400">${mtlTvaCount} games</td>
            <td class="py-3 px-4 text-slate-300">Quebec, Atlantic Canada, Eastern ON</td>
            <td class="py-3 px-4 text-slate-300">Sportsnet+ Premium or Centre Ice (French)</td>
          </tr>
          <tr class="border-b border-white/5">
            <td class="py-3 px-4 font-bold text-white"><a href="https://hockeyblackouts.ca/ottawa/" class="hover:text-rose-400 hover:underline">Ottawa Senators &rarr;</a></td>
            <td class="py-3 px-4 text-center font-semibold text-amber-400">${ottRdsCount} games</td>
            <td class="py-3 px-4 text-center font-semibold text-emerald-400">${ottTvaCount} games</td>
            <td class="py-3 px-4 text-slate-300">Eastern ON, Quebec, Atlantic Canada</td>
            <td class="py-3 px-4 text-slate-300">Sportsnet+ Premium or Centre Ice (French)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
`;

writeExplainerPage({
  slug: 'rds-vs-tva-sports-blackouts',
  title: 'RDS vs TVA Sports Blackout Rules: French Hockey Guide (2026–27)',
  description: 'Why are Montreal Canadiens and Ottawa Senators games blacked out on RDS? Compare RDS regional boundaries vs TVA Sports national broadcasts across Canada.',
  breadcrumb: 'RDS vs. TVA Sports Blackouts',
  badgeIcon: 'fa-language',
  badgeLabel: 'French Broadcast Rights',
  h1: 'RDS vs. TVA Sports Blackout Rules Explained (2026–27 Season)',
  subtitle: 'Why RDS blacks out Montreal Canadiens and Ottawa Senators games west of Belleville, Ontario, while TVA Sports broadcasts coast-to-coast across Canada.',
  bodyHtml: rdsTvaBodyHtml,
  faqs: [
    {
      q: 'Why is the Montreal Canadiens game blacked out on RDS in Toronto or Western Canada?',
      aPlain: `RDS only holds regional broadcast rights (${mtlRdsCount} Canadiens games and ${ottRdsCount} Senators games), which are restricted to Quebec, Atlantic Canada, and Eastern Ontario east of Belleville. Viewers in the GTA, Western Ontario, the Prairies, and British Columbia are outside the regional boundary and are blacked out on standard RDS cable feeds.`
    },
    {
      q: 'Are TVA Sports hockey games ever blacked out outside Quebec?',
      aPlain: 'No. TVA Sports holds national French-language rights. Every Canadiens and Senators game broadcast on TVA Sports clears coast-to-coast across all Canadian provinces with zero regional blackouts.'
    },
    {
      q: 'How can French-speaking fans watch RDS regional games outside Quebec and Eastern Ontario?',
      aPlain: 'Fans living west of Belleville (including Toronto, Winnipeg, Calgary, Edmonton, and Vancouver) can stream out-of-market RDS feeds using Sportsnet+ Premium or subscribe to the French-language NHL Centre Ice cable package.'
    }
  ]
});

// ============================================================================
// 4. HOW CANADIAN HOCKEY BLACKOUTS WORK (METHODOLOGY & E-E-A-T)
// ============================================================================
const territoryRowsHtml = teamDatasets.map(d => {
  const t = d.team;
  const dir = TEAM_DIRS[t.id];
  const regCount = d.schedule.filter(g => g.typeEN === 'regional').length;
  return `
    <tr class="border-b border-white/5 hover:bg-white/[0.02] transition">
      <td class="py-3 px-4 font-bold text-white">
        <a href="https://hockeyblackouts.ca/${dir}/" class="hover:text-rose-400 hover:underline">${t.name}</a>
      </td>
      <td class="py-3 px-4 text-slate-300">${t.marketRegion.description}</td>
      <td class="py-3 px-4 text-slate-300">${t.networks.regionalEN}${t.networks.regionalFR ? ` / ${t.networks.regionalFR}` : ''}</td>
      <td class="py-3 px-4 text-center font-semibold text-amber-400">${regCount} / 84 games</td>
    </tr>
  `;
}).join('\n');

const methodologyBodyHtml = `
  <!-- 1. Interactive Blackout Diagnostic Tool (Hero Triage) -->
  <section id="blackout-triage" class="bg-slate-900 border border-sky-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">Live Connection Inspector</span>
          <span class="text-xs text-slate-400">ISP Mismatch Detector</span>
        </div>
        <h2 class="text-base sm:text-lg font-bold text-white mt-1">Blackout IP Inspector: Check for Location Mismatches</h2>
      </div>
      <button id="runIpDiagnosticBtn" data-umami-event="ip-inspector-check" class="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition whitespace-nowrap flex items-center justify-center gap-2">
        <i class="fa-solid fa-satellite-dish"></i>
        <span>Scan My Connection</span>
      </button>
    </div>

    <!-- Step 1: Select Team to Watch -->
    <div class="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-1.5">
      <label for="userTeamSelect" class="block text-xs font-bold text-white">
        Which team are you trying to watch right now?
      </label>
      <select id="userTeamSelect" class="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
        <option value="MTL" selected>Montreal Canadiens (TSN2 / RDS)</option>
        <option value="OTT">Ottawa Senators (TSN5 / RDS)</option>
        <option value="TOR">Toronto Maple Leafs (TSN4 / Sportsnet Ontario)</option>
        <option value="WPG">Winnipeg Jets (TSN3)</option>
        <option value="EDM">Edmonton Oilers (Sportsnet West)</option>
        <option value="CGY">Calgary Flames (Sportsnet West)</option>
        <option value="VAN">Vancouver Canucks (Sportsnet Pacific)</option>
      </select>
    </div>

    <!-- Step 2: Side-by-Side Connection vs. Broadcast Territory Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Left: Detected Connection -->
      <div class="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-network-wired text-sky-400"></i>
            <span>Your Detected Connection</span>
          </span>
          <span id="connectionBadge" class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10 font-medium">Awaiting Scan</span>
        </div>
        <div class="space-y-1 text-xs">
          <div><span class="text-slate-400">IP Location:</span> <strong id="detectedLocation" class="text-slate-300">Click &quot;Scan My Connection&quot;</strong></div>
          <div><span class="text-slate-400">Provider (ISP):</span> <strong id="detectedIsp" class="text-slate-400">—</strong></div>
          <div><span class="text-slate-400">Public IP:</span> <span id="detectedIp" class="text-slate-500 font-mono text-[11px]">—</span></div>
        </div>
      </div>

      <!-- Right: Team's Official Broadcast Territory -->
      <div class="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-map-location-dot text-[#AF1E2D]"></i>
            <span>Designated Broadcast Territory</span>
          </span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">CRTC Geofence</span>
        </div>
        <div class="space-y-1 text-xs">
          <div><span class="text-slate-400">Official Home Zone:</span> <strong id="teamMarketText" class="text-white">Quebec, Atlantic Canada, Eastern Ontario</strong></div>
          <div><span class="text-slate-400">Home Regional Networks:</span> <strong id="teamCarrierText" class="text-rose-400">TSN2 / RDS</strong></div>
          <div class="text-[11px] text-slate-400">Games restricted to viewers inside this zone.</div>
        </div>
      </div>
    </div>

    <!-- Step 3: Prominent Verdict & Mismatch Callout -->
    <div id="diagnosticVerdictBox" class="p-4 rounded-xl border border-white/10 bg-slate-950/70 text-xs leading-relaxed space-y-2 text-slate-300">
      <div class="flex items-center gap-2 font-bold text-white text-sm">
        <i class="fa-solid fa-satellite-dish text-sky-400"></i>
        <span>Ready to Test Your Geolocation</span>
      </div>
      <p>
        Select the team you want to watch above, then click <strong>&quot;Scan My Connection&quot;</strong>. The tool will check your public IP address and compare it against the team&apos;s designated home broadcast territory to detect whether you are out of market, facing an ISP glitch, or hitting a broadcast rights split.
      </p>
    </div>
  </section>

  <!-- 2. The Two Ways Fans Get Blacked Out (Real Wall vs. False Glitch) -->
  <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-3">
      <div class="flex items-center gap-2 text-amber-400 font-bold text-sm">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>The 10% Glitch: False Blackouts (Fixable)</span>
      </div>
      <p class="text-xs text-slate-300 leading-relaxed">
        A <strong>false blackout</strong> happens when you physically live in a team's broadcast zone, but your streaming device reports an out-of-market IP address.
      </p>
      <ul class="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
        <li><strong>Starlink & 5G Home Internet:</strong> Carrier-Grade NAT (CGNAT) frequently routes rural Ontario, Manitoba, or Alberta traffic through ground stations in Montreal or Toronto.</li>
        <li><strong>Living Room Devices:</strong> Smart TVs, Apple TVs, Rokus, and Fire Sticks have no internal GPS chip. They rely entirely on third-party IP tables that are often weeks out of date.</li>
      </ul>
      <p class="text-xs text-amber-300 font-semibold pt-1">
        &rarr; Fix: Cast from a phone with GPS turned on, or reboot your dish/modem for 20 minutes to pull a new regional IP pool.
      </p>
    </div>

    <div class="bg-slate-900 border border-sky-500/30 rounded-2xl p-5 sm:p-6 space-y-3">
      <div class="flex items-center gap-2 text-sky-400 font-bold text-sm">
        <i class="fa-solid fa-lock"></i>
        <span>The 90% Reality: Contract Rights Walls (Unfixable)</span>
      </div>
      <p class="text-xs text-slate-300 leading-relaxed">
        Most blackouts are not technical bugs—they are rigid contractual restrictions enforced by the NHL, Rogers, and Bell.
      </p>
      <ul class="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
        <li><strong>The Wrong Broadcaster:</strong> Sportsnet does not own regional games for Ottawa, Montreal, or Winnipeg (and only half of Toronto's). Those games are exclusive to TSN and RDS.</li>
        <li><strong>The Predatory Upsell:</strong> Sportsnet+ often tells in-market fans to "Upgrade to Premium". If TSN owns the game, paying $35 for Premium will still leave you blacked out.</li>
        <li><strong>Monday Prime Exclusives:</strong> Monday night games air exclusively on Amazon Prime Video nationwide—not on cable or Sportsnet+.</li>
      </ul>
      <p class="text-xs text-sky-300 font-semibold pt-1">
        &rarr; Fix: No router trick will help. You need the specific network holding tonight's rights.
      </p>
    </div>
  </section>

  <!-- 3. Starlink, 5G Wireless & Rural ISP Troubleshooting Guide -->
  <section class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
        <i class="fa-solid fa-wrench text-sky-400"></i>
        <span>Troubleshooting False Blackouts on Starlink, Xplore & 5G Wireless</span>
      </h2>
      <span class="text-xs text-slate-400">Rural Internet Triage</span>
    </div>

    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
      If our diagnostic tool showed an IP mismatch, here is how to get around the geofence before puck drop:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
      <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
        <div class="font-bold text-white flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[11px] font-black">1</span>
          <span>The Mobile GPS Cast (Recommended)</span>
        </div>
        <p class="text-slate-400 leading-relaxed">
          Smart TVs don't have GPS chips; phones do. Open the Sportsnet or TSN app on your phone with Location Services enabled. The app reads your genuine GPS coordinates instead of your Starlink IP. Tap the native Cast or AirPlay icon inside the video player to stream to your TV. (Avoid OS-level screen mirroring or HDMI cables, which trigger DRM blackouts).
        </p>
      </div>

      <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
        <div class="font-bold text-white flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[11px] font-black">2</span>
          <span>20-Minute Power Cycle (Last Resort)</span>
        </div>
        <p class="text-slate-400 leading-relaxed">
          Only do this if you have no mobile device, so you don't burn 20 minutes of game time. Unplug your Starlink dish or wireless modem for a full 20 minutes (a 10-second reboot won't release your CGNAT lease). When it reconnects, the ground station will frequently assign a fresh IP from a closer regional subnet.
        </p>
      </div>

      <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
        <div class="font-bold text-white flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[11px] font-black">3</span>
          <span>Beware the "Call Your ISP" Dodge</span>
        </div>
        <p class="text-slate-400 leading-relaxed">
          Broadcaster support reps love telling fans to call their ISP when their own MaxMind or Neustar GeoIP feed is out of date. If phone GPS works but your TV is blocked, your ISP is fine—the broadcaster's TV app database is simply lagging behind.
        </p>
      </div>
    </div>
  </section>

  <!-- 4. Cable TV Set-Top Box Blackout Error Codes -->
  <section class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
        <i class="fa-solid fa-tv text-[#AF1E2D]"></i>
        <span>Cable TV Set-Top Box Blackout Error Codes (Rogers Ignite & Comcast X1)</span>
      </h2>
      <span class="text-xs text-slate-400">Cable Hardware</span>
    </div>
    <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
      <div class="flex items-center justify-between">
        <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">Cable Box Error Code</span>
        <span class="text-[10px] text-slate-400">Rogers Ignite TV / Shaw BlueCurve</span>
      </div>
      <h3 class="text-white font-bold text-sm">Rogers Ignite TV: Error Codes XRE-07004, XRE-07006 & XRE-07007</h3>
      <p class="text-xs text-slate-300 leading-relaxed">
        <strong>On-Screen Message:</strong> <em>"Sports programming is subject to certain restrictions. This program is blacked out in your area."</em>
      </p>
      <p class="text-xs text-slate-300 leading-relaxed">
        <strong>The Cause:</strong> Rogers Ignite set-top boxes use Comcast\'s syndicated X1 software. These error codes trigger automatically when your cable account\'s physical registered billing address is located outside a team\'s home regional boundary (for example, tuning to Sportsnet Pacific in Toronto, or TSN2 in Alberta).
      </p>
      <p class="text-xs text-emerald-400 leading-relaxed">
        <strong>The Fix:</strong> Check your local regional channels for your local home market game. Out-of-market regional games on linear cable cannot be unlocked on standard regional channels; they require the <strong>NHL Centre Ice</strong> digital cable package or Sportsnet+ Premium online.
      </p>
    </div>
  </section>

  <!-- 5. Official Canadian Broadcast Territory Map -->
  <section class="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
    <div class="p-5 sm:p-6 border-b border-white/10">
      <h2 class="text-base sm:text-lg font-bold text-white">Official Canadian Broadcast Territory Map (All 7 Teams)</h2>
      <p class="text-xs text-slate-400 mt-1">Regional broadcasts are strictly geofenced to each club's designated home market:</p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
          <tr>
            <th class="py-3 px-4">Team</th>
            <th class="py-3 px-4">Designated In-Market Broadcast Territory</th>
            <th class="py-3 px-4">Regional Networks</th>
            <th class="py-3 px-4 text-center">Regional Games</th>
          </tr>
        </thead>
        <tbody>
          ${territoryRowsHtml}
        </tbody>
      </table>
    </div>
  </section>

  <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-2.5">
      <h2 class="text-base font-bold text-white flex items-center gap-2">
        <i class="fa-solid fa-map-pin text-[#AF1E2D]"></i>
        <span>The Belleville–Kingston Ontario Overlap Zone</span>
      </h2>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        In Ontario, the broadcast dividing line between the <strong>Toronto Maple Leafs</strong> (West) and the <strong>Ottawa Senators / Montreal Canadiens</strong> (East) runs between Belleville and Kingston.
      </p>
      <p class="text-xs text-slate-400 leading-relaxed">
        Viewers living in the Belleville-to-Kingston corridor are in an official <strong>Shared Overlap Zone</strong> with in-market access to regional feeds for all three teams (TOR, OTT, and MTL).
      </p>
    </div>

    <div class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-2.5">
      <h2 class="text-base font-bold text-white flex items-center gap-2">
        <i class="fa-solid fa-compass text-[#AF1E2D]"></i>
        <span>Saskatchewan & Northwestern Ontario Shared Zones</span>
      </h2>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        <strong>Saskatchewan</strong> is a shared three-team territory: viewers receive in-market regional access to the <strong>Calgary Flames, Edmonton Oilers</strong> (Sportsnet West), and <strong>Winnipeg Jets</strong> (TSN3).
      </p>
      <p class="text-xs text-slate-400 leading-relaxed">
        <strong>Northwestern Ontario (Thunder Bay / Kenora)</strong> straddles the Manitoba border and is designated as a shared regional zone for both the <strong>Winnipeg Jets</strong> and <strong>Toronto Maple Leafs</strong>.
      </p>
    </div>
  </section>

  <!-- 6. Verification Methodology & Corrections Policy -->
  <section class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
    <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
      <i class="fa-solid fa-code-branch text-emerald-400"></i>
      <span>Data Verification Methodology & Corrections Policy</span>
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
      <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
        <div class="font-bold text-white">1. Daily Automated Schedule Sync</div>
        <p class="text-slate-400">Every morning, our automated build pipeline queries official league schedule feeds (` + '`api-web.nhle.com`' + `) to detect start-time flexing or national broadcast reassignments across all 547 matchups.</p>
      </div>
      <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
        <div class="font-bold text-white">2. 1,000+ Permutation Matrix QA</div>
        <p class="text-slate-400">Before any update deploys to production, an automated test suite validates over 1,000 combinations of postal regions, cable channels, and streaming tiers to verify zero regressions in blackout logic.</p>
      </div>
      <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
        <div class="font-bold text-white">3. Report a Broadcast Discrepancy</div>
        <p class="text-slate-400">Spot a last-minute channel flex or regional carrier change? Submit an issue directly on our <a href="https://github.com/Maltos-mk/montreal-hockey-blackout-guide/issues" target="_blank" rel="noopener noreferrer" class="text-rose-400 hover:underline font-semibold">GitHub Issue Tracker &rarr;</a></p>
      </div>
    </div>
  </section>

  <script>
  (function() {
    var btn = document.getElementById('runIpDiagnosticBtn');
    if (!btn) return;

    var detectedData = null;

    var TEAM_DATA = {
      'MTL': {
        name: 'Montreal Canadiens',
        dir: 'montreal',
        marketHint: 'Home Zone: QC, Atlantic Canada, Eastern ON',
        marketDescription: 'Quebec, Atlantic Canada, and Eastern Ontario',
        inMarketRegions: ['qc', 'atl', 'on_east', 'on_overlap'],
        primaryCarrier: 'TSN2 / RDS',
        tsnRegional: true
      },
      'OTT': {
        name: 'Ottawa Senators',
        dir: 'ottawa',
        marketHint: 'Home Zone: Eastern ON, Outaouais, QC, Atlantic',
        marketDescription: 'Eastern Ontario, the Outaouais, Quebec, and Atlantic Canada',
        inMarketRegions: ['on_east', 'on_overlap', 'qc', 'atl'],
        primaryCarrier: 'TSN5 / RDS',
        tsnRegional: true
      },
      'TOR': {
        name: 'Toronto Maple Leafs',
        dir: 'toronto',
        marketHint: 'Home Zone: Ontario West of Belleville',
        marketDescription: 'Ontario (West of Belleville)',
        inMarketRegions: ['on_west', 'on_overlap', 'nw_on'],
        primaryCarrier: 'TSN4 (26 games) / Sportsnet Ontario',
        tsnRegional: true
      },
      'WPG': {
        name: 'Winnipeg Jets',
        dir: 'winnipeg',
        marketHint: 'Home Zone: Manitoba, Saskatchewan, NW Ontario',
        marketDescription: 'Manitoba, Saskatchewan, and Northwestern Ontario',
        inMarketRegions: ['mb', 'sk', 'nw_on'],
        primaryCarrier: 'TSN3',
        tsnRegional: true
      },
      'EDM': {
        name: 'Edmonton Oilers',
        dir: 'edmonton',
        marketHint: 'Home Zone: Alberta, Saskatchewan, NWT',
        marketDescription: 'Alberta, Saskatchewan, and the Northwest Territories',
        inMarketRegions: ['ab', 'sk'],
        primaryCarrier: 'Sportsnet West',
        tsnRegional: false
      },
      'CGY': {
        name: 'Calgary Flames',
        dir: 'calgary',
        marketHint: 'Home Zone: Alberta, Saskatchewan, NWT',
        marketDescription: 'Alberta, Saskatchewan, and the Northwest Territories',
        inMarketRegions: ['ab', 'sk'],
        primaryCarrier: 'Sportsnet West',
        tsnRegional: false
      },
      'VAN': {
        name: 'Vancouver Canucks',
        dir: 'vancouver',
        marketHint: 'Home Zone: British Columbia & Yukon',
        marketDescription: 'British Columbia and Yukon',
        inMarketRegions: ['bc'],
        primaryCarrier: 'Sportsnet Pacific',
        tsnRegional: false
      }
    };

    var REGION_NAMES = {
      'on_west': 'Ontario (Toronto, GTA & Western ON)',
      'on_east': 'Ontario (Ottawa & Eastern ON)',
      'on_overlap': 'Ontario Overlap (Belleville–Kingston)',
      'qc': 'Quebec',
      'atl': 'Atlantic Canada (NB, NS, PEI, NL)',
      'mb': 'Manitoba',
      'sk': 'Saskatchewan',
      'ab': 'Alberta, NWT & Nunavut',
      'bc': 'British Columbia & Yukon',
      'nw_on': 'Northwestern Ontario (Thunder Bay / Kenora)'
    };

    function mapIpToRegionCode(data) {
      if (!data) return null;
      var r = (data.region || data.region_code || '').toLowerCase();
      var c = (data.city || '').toLowerCase();
      if (r.indexOf('british columbia') !== -1 || r === 'bc') return 'bc';
      if (r.indexOf('alberta') !== -1 || r === 'ab') return 'ab';
      if (r.indexOf('saskatchewan') !== -1 || r === 'sk') return 'sk';
      if (r.indexOf('manitoba') !== -1 || r === 'mb') return 'mb';
      if (r.indexOf('quebec') !== -1 || r === 'qc') return 'qc';
      if (r.indexOf('new brunswick') !== -1 || r.indexOf('nova scotia') !== -1 || r.indexOf('prince edward') !== -1 || r.indexOf('newfoundland') !== -1 || r === 'nb' || r === 'ns' || r === 'pe' || r === 'nl') return 'atl';
      if (r.indexOf('ontario') !== -1 || r === 'on') {
        if (c.indexOf('ottawa') !== -1 || c.indexOf('cornwall') !== -1 || c.indexOf('kingston') !== -1) return 'on_east';
        if (c.indexOf('thunder bay') !== -1 || c.indexOf('kenora') !== -1) return 'nw_on';
        return 'on_west';
      }
      return null;
    }

    function scanConnection(isManual) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Scanning...</span>';

      fetch('https://ipwho.is/')
        .then(function(r) {
          if (!r.ok) throw new Error('ipwho HTTP ' + r.status);
          return r.json();
        })
        .then(function(data) {
          if (!data || data.success === false || !data.ip) throw new Error('ipwho failed');
          return data;
        })
        .catch(function() {
          return fetch('https://ipapi.co/json/')
            .then(function(r2) {
              if (!r2.ok) throw new Error('ipapi HTTP ' + r2.status);
              return r2.json();
            })
            .then(function(data2) {
              if (!data2 || !data2.ip) throw new Error('ipapi failed');
              return {
                ip: data2.ip,
                connection: { isp: data2.org },
                city: data2.city,
                region: data2.region,
                region_code: data2.region_code
              };
            });
        })
        .then(function(data) {
          detectedData = data;
          document.getElementById('detectedIp').textContent = data.ip || 'Unknown';
          document.getElementById('detectedIsp').textContent = (data.connection && data.connection.isp) || data.isp || 'Detected Provider';
          document.getElementById('detectedLocation').textContent = (data.city ? data.city + ', ' : '') + (data.region || data.country || 'Canada');
          var badge = document.getElementById('connectionBadge');
          if (badge) {
            badge.textContent = 'Active IP Verified';
            badge.className = 'text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium';
          }
          renderVerdict(isManual);
        })
        .catch(function(err) {
          document.getElementById('detectedLocation').textContent = 'Location Blocked (Ad-Blocker Active)';
          document.getElementById('detectedIsp').textContent = 'Unable to query IP';
          renderVerdict(isManual);
        })
        .finally(function() {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-satellite-dish"></i><span>Re-scan Connection</span>';
        });
    }

    btn.addEventListener('click', function() {
      scanConnection(true);
    });

    var teamSelect = document.getElementById('userTeamSelect');
    if (teamSelect) {
      teamSelect.addEventListener('change', function() {
        renderVerdict(true);
      });
    }

    function renderVerdict(isManualAction) {
      var teamId = teamSelect ? teamSelect.value : 'MTL';
      var team = TEAM_DATA[teamId] || TEAM_DATA['MTL'];
      var verdictBox = document.getElementById('diagnosticVerdictBox');
      if (!verdictBox) return;

      // Update right-hand territory card
      var marketEl = document.getElementById('teamMarketText');
      var carrierEl = document.getElementById('teamCarrierText');
      if (marketEl) marketEl.textContent = team.marketDescription;
      if (carrierEl) carrierEl.textContent = team.primaryCarrier;

      if (!detectedData) {
        verdictBox.className = 'p-4 rounded-xl border border-white/10 bg-slate-950/70 text-xs leading-relaxed space-y-2 text-slate-300';
        verdictBox.innerHTML = '<div class="flex items-center gap-2 font-bold text-white text-sm">' +
          '<i class="fa-solid fa-satellite-dish text-sky-400"></i>' +
          '<span>Ready to Test Your Geolocation for the ' + team.name + '</span>' +
        '</div>' +
        '<p>' +
          'Selected: <strong>' + team.name + '</strong> (Territory: ' + team.marketDescription + '). Click <strong>"Scan My Connection"</strong> above to test your public IP against this zone and detect any false ISP blackouts.' +
        '</p>';
        return;
      }

      var ipRegionCode = mapIpToRegionCode(detectedData);
      var ispName = (detectedData.connection && detectedData.connection.isp) || detectedData.isp || 'your internet provider';
      var isStarlinkOrCellular = /starlink|spacex|xplor|cellular|telus mobility|rogers wireless|bell mobility/i.test(ispName);
      var ipLocationStr = (detectedData.city ? detectedData.city + ', ' : '') + (detectedData.region || 'your area');

      var isMatch = ipRegionCode ? (team.inMarketRegions.indexOf(ipRegionCode) !== -1) : false;

      if (isManualAction && window.umami && typeof window.umami.track === 'function') {
        window.umami.track('ip-inspector-verdict', {
          status: isMatch ? 'match' : 'mismatch',
          team: teamId,
          detected_region: ipRegionCode || 'unknown'
        });
      }

      if (!isMatch) {
        // LOCATION MISMATCH OCCURRING
        verdictBox.className = 'p-4 sm:p-5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs leading-relaxed space-y-3';
        verdictBox.innerHTML = '<div class="flex items-center justify-between gap-2 border-b border-rose-500/20 pb-2.5">' +
          '<div class="flex items-center gap-2 font-bold text-rose-300 text-sm sm:text-base">' +
            '<i class="fa-solid fa-triangle-exclamation text-rose-400"></i>' +
            '<span>LOCATION MISMATCH: Your IP (' + ipLocationStr + ') is OUTSIDE the ' + team.name + ' Territory</span>' +
          '</div>' +
        '</div>' +
        '<p class="text-slate-200 leading-relaxed">' +
          'Streaming services see your public IP as <strong>' + ipLocationStr + '</strong>. Because this connection is located outside the ' + team.name + ' home broadcast market (' + team.marketDescription + '), local regional broadcasts are geofenced and blacked out.' +
        '</p>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">' +
          '<div class="p-3.5 rounded-lg bg-slate-950/80 border border-white/10 space-y-1.5">' +
            '<div class="font-bold text-white flex items-center gap-1.5">' +
              '<i class="fa-solid fa-house text-sky-400"></i>' +
              '<span>If you actually live in ' + ipLocationStr + ':</span>' +
            '</div>' +
            '<p class="text-slate-300 text-[11px] leading-relaxed">' +
              'Your connection is accurate—you are an <strong>out-of-market fan</strong>. Local cable feeds (' + team.primaryCarrier + ') are legally blacked out in your area.' +
            '</p>' +
            '<p class="text-sky-300 text-[11px] font-semibold pt-1">' +
              '&rarr; To watch: You need <strong>Sportsnet+ Premium</strong> ($34.99/mo) or <strong>NHL Centre Ice</strong> on cable. (Sportsnet+ Standard will NOT work).' +
            '</p>' +
          '</div>' +
          '<div class="p-3.5 rounded-lg bg-slate-950/80 border border-amber-500/30 space-y-1.5">' +
            '<div class="font-bold text-amber-300 flex items-center gap-1.5">' +
              '<i class="fa-solid fa-satellite-dish"></i>' +
              '<span>If you physically live inside ' + team.name + ' territory:</span>' +
            '</div>' +
            '<p class="text-slate-300 text-[11px] leading-relaxed">' +
              '<strong>You have a False Blackout!</strong> ' + (isStarlinkOrCellular ? 'Because you are on <strong>' + ispName + '</strong>, your traffic routes through an out-of-province ground station.' : 'Your internet provider is routing your IP outside your province.') + ' Broadcasters think you are in ' + ipLocationStr + ' and mistakenly block your home team!' +
            '</p>' +
            '<p class="text-amber-200 text-[11px] font-semibold pt-1">' +
              '&rarr; 7:05 PM Fix: Open Sportsnet or TSN on a phone with GPS turned on, then tap the Cast/AirPlay icon in the player to stream to your TV.' +
            '</p>' +
          '</div>' +
        '</div>' +
        '<p class="text-slate-300 pt-1 text-[11px]">' +
          'Check the full broadcast schedule on our <a href="https://hockeyblackouts.ca/' + team.dir + '/" class="text-sky-400 font-bold hover:underline">' + team.name + ' Broadcast & Schedule Guide &rarr;</a>' +
        '</p>';
      } else {
        // LOCATION MATCH
        verdictBox.className = 'p-4 sm:p-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs leading-relaxed space-y-3';
        var rightsWarning = '';
        if (team.tsnRegional && ['MTL', 'OTT', 'WPG'].indexOf(teamId) !== -1) {
          rightsWarning = '<div class="p-3 rounded-lg bg-slate-950/80 border border-rose-500/30 text-rose-200 space-y-1">' +
            '<div class="font-bold flex items-center gap-1.5 text-xs text-rose-300"><i class="fa-solid fa-triangle-exclamation"></i>The Sportsnet+ Regional Trap:</div>' +
            '<p class="text-[11px] text-slate-200 leading-normal">If you have Sportsnet+ open, this game is blacked out because <strong>' + team.primaryCarrier + '</strong> holds 100% of regional rights in your market. <strong>Do NOT click "Upgrade to Premium"</strong>—you will still be blacked out because TSN holds the rights!</p>' +
          '</div>';
        } else if (teamId === 'TOR') {
          rightsWarning = '<div class="p-3 rounded-lg bg-slate-950/80 border border-rose-500/30 text-rose-200 space-y-1">' +
            '<div class="font-bold flex items-center gap-1.5 text-xs text-rose-300"><i class="fa-solid fa-triangle-exclamation"></i>Toronto Split Rights:</div>' +
            '<p class="text-[11px] text-slate-200 leading-normal">26 Maple Leafs games are exclusive to <strong>TSN4</strong> in Ontario. If tonight is a TSN game, Sportsnet+ will black you out, and upgrading to Premium will not unlock it.</p>' +
          '</div>';
        } else {
          rightsWarning = '<p class="text-slate-300">If your game is blacked out on Sportsnet+, check if you are on basic Sportsnet without regional access, or if tonight is exclusive to <strong>Amazon Prime Video</strong> (Monday Night Hockey).</p>';
        }

        verdictBox.innerHTML = '<div class="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">' +
          '<div class="flex items-center gap-2 font-bold text-emerald-300 text-sm sm:text-base">' +
            '<i class="fa-solid fa-circle-check text-emerald-400"></i>' +
            '<span>LOCATION MATCH: Your IP (' + ipLocationStr + ') is INSIDE the ' + team.name + ' Territory</span>' +
          '</div>' +
        '</div>' +
        '<p class="text-slate-200 leading-relaxed">' +
          'Your connection is located inside the official designated home broadcast territory for the ' + team.name + '. <strong>This is not an ISP routing error.</strong>' +
        '</p>' +
        rightsWarning +
        '<p class="text-slate-300 pt-1 text-[11px]">' +
          'Check the broadcast schedule and channel lineup on our <a href="https://hockeyblackouts.ca/' + team.dir + '/" class="text-emerald-400 font-bold hover:underline">' + team.name + ' Schedule & Channel Guide &rarr;</a>' +
        '</p>';
      }
    }

    // Do not auto-scan on page load: user must explicitly click "Scan My Connection"
  })();
  </script>
`;

writeExplainerPage({
  slug: 'how-blackouts-work',
  title: 'Why Is My NHL Game Blacked Out? Canadian Diagnostic & Fixes',
  description: 'Why is your NHL game blacked out tonight? Run our instant diagnostic to detect false ISP glitches vs. regional broadcast walls across all Canadian teams.',
  breadcrumb: 'Blackout Diagnostic & Rules',
  badgeIcon: 'fa-satellite-dish',
  badgeLabel: 'Game-Night Triage & Fixes',
  h1: 'Why Is Your NHL Game Blacked Out? (And Can You Fix It Tonight?)',
  subtitle: 'At 7:05 PM with a black screen, it feels like your streaming app is broken. In 30 seconds, find out whether your internet provider is misrouting your location or if an NHL regional contract just locked you out.',
  bodyHtml: methodologyBodyHtml,
  faqs: [
    {
      q: 'Why is my NHL game blacked out in my area tonight?',
      aPlain: 'Blackouts happen for two reasons: a contractual broadcast wall (85–90% of cases) or a technical ISP geolocation glitch (10–15% of cases). Contractual blackouts occur when a regional game is owned by a different network (such as TSN instead of Sportsnet), requires a premium out-of-market tier, or is exclusive to Amazon Prime Video. Technical glitches occur when satellite (Starlink) or wireless internet routes through an out-of-province ground station.'
    },
    {
      q: 'Why does Sportsnet+ or TSN say I am out of market when I live in the city?',
      aPlain: 'If you use Starlink, Xplore, or 5G home internet, your connection uses Carrier-Grade NAT (CGNAT) that may route through ground stations in Montreal or Toronto. Streaming apps on Smart TVs and Apple TVs have no internal GPS and rely purely on your IP address. If the IP points out of province, you are falsely blacked out. To fix it, open the app on a smartphone with GPS turned on and AirPlay/Cast to your TV.'
    },
    {
      q: 'If I upgrade to Sportsnet+ Premium, will it unblock my local home team?',
      aPlain: 'No. If you live inside the home market for the Winnipeg Jets, Ottawa Senators, Montreal Canadiens, or the 26 regional Toronto Maple Leafs games owned by TSN, upgrading to Sportsnet+ Premium will not unlock the game. Sportsnet legally cannot broadcast those regional games in your territory. You must subscribe to TSN.'
    },
    {
      q: 'Where is the Ontario blackout dividing line between Toronto and Ottawa/Montreal?',
      aPlain: 'The dividing line in Ontario runs between Belleville and Kingston. Viewers west of Belleville are in the Maple Leafs regional territory. Viewers east of Kingston are in the Senators and Canadiens regional territory. The corridor between Belleville and Kingston is an official overlap zone with regional access to all three teams.'
    },
    {
      q: 'What do Rogers Ignite TV error codes XRE-07004 and XRE-07006 mean?',
      aPlain: 'Rogers Ignite TV and Comcast X1 set-top boxes display error codes XRE-07004, XRE-07006, and XRE-07007 ("Sports programming is subject to certain restrictions") when you tune to a regional sports channel outside your registered billing address territory. Out-of-market regional games on cable require the NHL Centre Ice digital package.'
    }
  ]
});

// ============================================================================
// 5. TSN HOCKEY BLACKOUT RULES EXPLAINED
// ============================================================================
const tsnTeamRows = teamDatasets.map(d => {
  const t = d.team;
  const dir = TEAM_DIRS[t.id];
  const hasTsnRights = ['MTL', 'OTT', 'TOR', 'WPG'].includes(t.id);
  const tsnChannel = t.id === 'MTL' ? 'TSN2' : t.id === 'OTT' ? 'TSN5' : t.id === 'TOR' ? 'TSN4' : t.id === 'WPG' ? 'TSN3' : 'None';

  // Only calculate TSN regional count if team actually uses TSN as their home regional carrier
  const tsnRegGames = hasTsnRights ? d.schedule.filter(g => g.typeEN === 'regional' && g.netEN && g.netEN.includes(tsnChannel)).length : 0;
  const snRegGames = d.schedule.filter(g => g.typeEN === 'regional' && g.netEN && g.netEN.includes('Sportsnet')).length;

  let inMarketCell = '';
  let oomCell = '';

  if (hasTsnRights) {
    inMarketCell = `<span class="font-semibold text-emerald-400">${tsnRegGames} games</span> on <span class="font-bold text-white">${tsnChannel}</span>`;
    oomCell = `<span class="text-rose-400 font-semibold">Blacked Out</span> <span class="text-slate-400 text-[11px] block sm:inline">(Watch via Sportsnet+ Premium)</span>`;
  } else {
    inMarketCell = `<span class="text-slate-400">0 (Sportsnet holds 100%)</span>`;
    oomCell = `<span class="text-slate-500">—</span>`;
  }

  return `
    <tr class="border-b border-white/5 hover:bg-white/[0.02] transition">
      <td class="py-3 px-4 font-bold text-white">
        <a href="https://hockeyblackouts.ca/${dir}/" class="hover:text-rose-400 hover:underline flex items-center gap-1.5">
          <span>${t.name}</span>
          <i class="fa-solid fa-chevron-right text-[9px] text-slate-500"></i>
        </a>
      </td>
      <td class="py-3 px-4 text-center font-medium">${tsnChannel !== 'None' ? `<span class="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">${tsnChannel}</span>` : '<span class="text-slate-500">—</span>'}</td>
      <td class="py-3 px-4 text-center">${inMarketCell}</td>
      <td class="py-3 px-4 text-slate-300 text-xs">${t.marketRegion.description}</td>
      <td class="py-3 px-4 text-center">${oomCell}</td>
    </tr>
  `;
}).join('\n');

const tsnBodyHtml = `
  <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">TSN Feeds (TSN1–TSN5) & Cable</h2>
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Regional Rights Only</span>
      </div>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        Every NHL game shown on TSN is a <strong>regional broadcast</strong>. TSN holds zero English national rights in Canada (no Saturday night games, no Stanley Cup Playoffs). Broadcast rights are strictly geofenced to individual team markets:
      </p>
      <ul class="space-y-2 text-xs text-slate-300">
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>TSN2 (Montreal Canadiens):</strong> 50 regional games. Unlocked ONLY in Quebec, Atlantic Canada, and Eastern Ontario (east of Belleville).</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>TSN5 (Ottawa Senators):</strong> 50 regional games. Unlocked ONLY in Eastern Ontario, Quebec, and Atlantic Canada.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>TSN4 (Toronto Maple Leafs):</strong> 27 regional games. Unlocked ONLY in Ontario west of Belleville. (Sportsnet Ontario carries the other half of Toronto's regional slate).</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>TSN3 (Winnipeg Jets):</strong> 50 regional games. Unlocked ONLY in Manitoba, Saskatchewan, Northwest Ontario, Nunavut, and NWT.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-ban text-rose-400 mt-1"></i><span><strong>Out-of-Market Blackout Wall:</strong> If you are outside a team's official territory, that TSN regional channel is blacked out on cable and TSN streaming feeds.</span></li>
      </ul>
    </div>

    <div class="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 sm:p-6 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">The "TSN+" Trap & Out-of-Market Reality</h2>
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">No Out-of-Market NHL</span>
      </div>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        Many cord-cutters subscribe to TSN or the TSN+ streaming add-on hoping to stream their out-of-market team. That setup does not work:
      </p>
      <ul class="space-y-2 text-xs text-slate-300">
        <li class="flex items-start gap-2"><i class="fa-solid fa-ban text-rose-400 mt-1"></i><span><strong>TSN+ Has Zero Out-of-Market NHL:</strong> TSN+ carries bonus streams for PGA Tour golf, tennis courts, and NCAA sports. It does not carry out-of-market NHL games and does not remove blackouts.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-ban text-rose-400 mt-1"></i><span><strong>TSN Direct Geofencing:</strong> Subscribing to TSN directly online checks your device's physical IP address. A subscriber in Toronto gets the exact same TSN2 blackout as a cable customer.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>The Real Fix (Sportsnet+ Premium):</strong> Rogers owns national out-of-market streaming rights in Canada. If you want to watch the Canadiens in Toronto, the Jets in Calgary, or the Sens in Vancouver, you need <strong>Sportsnet+ Premium</strong> (or NHL Centre Ice), which carries TSN's regional broadcast out-of-market.</span></li>
      </ul>
    </div>
  </section>

  <section class="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-3 shadow-xl">
    <h2 class="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2.5">
      <i class="fa-solid fa-circle-exclamation text-lg"></i>
      <span>The Toronto Habs Fan Dilemma: "I have TSN, so why is the game blacked out?"</span>
    </h2>
    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
      It is one of the most common frustrations in Canadian sports: you buy a TSN subscription, see the Montreal Canadiens playing on TSN2, click the channel, and run straight into a blackout screen.
    </p>
    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
      Why does the game appear on your TV guide in the first place? TSN is sold across Canada as a five-feed bundle (TSN1 through TSN5). Because cable providers and the TSN app distribute all five channel guides nationwide, Habs games on TSN2 appear right in your electronic program guide in Toronto, Calgary, or Vancouver. But the moment you click play, postal code and IP geofences verify your location and block the video feed.
    </p>
    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
      Under NHL territorial broadcast bylaws, TSN only purchased the regional rights to show Canadiens games to fans living inside Montreal's home market (Quebec, Atlantic Canada, and Eastern Ontario). When you tune in from Toronto, you are physically inside Maple Leafs territory. TSN is legally prohibited from transmitting the Montreal feed to your screen.
    </p>
    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
      To watch those 50 Habs games in Toronto, you do not need TSN—you need <strong>Sportsnet+ Premium</strong> (or digital cable NHL Centre Ice). Rogers pays the NHL for national out-of-market redistribution rights. In one of Canadian media's great ironies, Rogers takes Bell's regional TSN2 feed—complete with TSN's own broadcast crew of Bryan Mudryk and Craig Button—and streams it directly through the Sportsnet+ app to out-of-market subscribers.
    </p>
  </section>

  <section class="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
        <span>TSN On-Screen Blackout Error Explained</span>
      </h2>
      <span class="text-xs text-slate-400">Troubleshooting</span>
    </div>
    <div class="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
      <div class="flex items-center justify-between">
        <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">TSN App / TSN.ca</span>
        <span class="text-[10px] text-slate-400">Live Video Player Error</span>
      </div>
      <h3 class="text-white font-bold text-sm">"Regional Restriction: This live event is not available in your current area"</h3>
      <p class="text-xs text-slate-300 leading-relaxed">
        <strong>The Cause:</strong> You are physically outside that team's designated broadcast territory (for example, trying to stream a Montreal Canadiens game on TSN2 from Toronto, or a Winnipeg Jets game on TSN3 from Alberta). Under NHL bylaws, TSN is legally prohibited from broadcasting regional games to out-of-market viewers.
      </p>
      <p class="text-xs text-emerald-400 leading-relaxed">
        <strong>The Fix:</strong> Out-of-market regional games cannot be unlocked through a TSN or TSN+ digital subscription. Out-of-market games can only be streamed legally in Canada via <strong>Sportsnet+ Premium</strong> (which re-distributes TSN's regional feeds nationwide) or through the <strong>NHL Centre Ice</strong> digital cable package.
      </p>
    </div>
  </section>

  <section class="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
    <div class="p-5 sm:p-6 border-b border-white/10">
      <h2 class="text-base sm:text-lg font-bold text-white">2026–27 Canadian Team Breakdown on TSN (84-Game Schedule)</h2>
      <p class="text-xs text-slate-400 mt-1">Programmatically calculated across all 7 Canadian franchises:</p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
          <tr>
            <th class="py-3 px-4">Team</th>
            <th class="py-3 px-4 text-center">TSN Channel</th>
            <th class="py-3 px-4 text-center">Regional Games</th>
            <th class="py-3 px-4">Designated In-Market Territory</th>
            <th class="py-3 px-4 text-center">Out-of-Market Status</th>
          </tr>
        </thead>
        <tbody>
          ${tsnTeamRows}
        </tbody>
      </table>
    </div>
  </section>
`;

writeExplainerPage({
  slug: 'tsn-hockey-blackout-rules',
  title: 'TSN Hockey Blackout Rules Explained: Channels & Regions (2026–27)',
  description: 'Why is your hockey game blacked out on TSN? Territory rules for TSN2, TSN3, TSN4, TSN5, the TSN+ trap, and how to watch out-of-market.',
  breadcrumb: 'TSN Blackout Rules',
  badgeIcon: 'fa-tv',
  badgeLabel: 'Regional Channel Breakdown',
  h1: 'TSN Hockey Blackout Rules Explained: Channels, Regions & TSN+ (2026–27)',
  subtitle: 'Why regional hockey games get blacked out on TSN feeds, how territory rules divide TSN2, TSN3, TSN4, and TSN5, and why TSN+ will not unlock out-of-market games.',
  bodyHtml: tsnBodyHtml,
  faqs: [
    {
      q: 'What does "Regional Restriction: This live event is not available in your current area" mean on TSN?',
      aPlain: 'TSN regional broadcasts (Canadiens on TSN2, Jets on TSN3, Leafs on TSN4, Senators on TSN5) are legally geofenced to each club\'s designated home broadcast territory. If you are physically located outside that territory, the NHL requires TSN to block the stream. Out-of-market games can only be streamed via Sportsnet+ Premium or NHL Centre Ice.'
    },
    {
      q: 'Why is the Montreal Canadiens game blacked out on TSN if I live in Toronto?',
      aPlain: 'TSN only holds regional broadcast rights for the Canadiens on TSN2, which are legally restricted to Quebec, Atlantic Canada, and Eastern Ontario (east of Belleville). Toronto is in the Maple Leafs broadcast zone. Under NHL agreements, TSN must black out TSN2 Canadiens broadcasts to viewers in Toronto and Western Canada. To watch in Toronto, you need Sportsnet+ Premium or NHL Centre Ice.'
    },
    {
      q: 'Does a TSN+ streaming subscription bypass NHL regional blackouts?',
      aPlain: 'No. TSN+ is an add-on streaming product that carries bonus coverage for golf, tennis, and auto racing. It does not carry out-of-market NHL games or remove regional blackouts. A direct TSN digital subscription only provides standard linear TSN feeds, which remain geofenced to each team\'s local territory.'
    },
    {
      q: 'Does TSN broadcast any national NHL games or Stanley Cup Playoff games?',
      aPlain: 'No. In English, national broadcast rights (including Saturday night Hockey Night in Canada and the entire Stanley Cup Playoffs) belong exclusively to Rogers Sportsnet, while Monday and Wednesday national regular-season games stream on Amazon Prime Video. Every single NHL game shown on TSN is a regional broadcast.'
    },
    {
      q: 'Why are Winnipeg Jets games blacked out on TSN3 in Ontario and Western Canada?',
      aPlain: 'TSN3\'s regional feed for the Jets is geofenced to Manitoba, Saskatchewan, Northwest Ontario, Nunavut, and the Northwest Territories. Viewers in Ontario (outside Thunder Bay and Kenora), Alberta, BC, Quebec, and Atlantic Canada will find TSN3 blacked out during Jets games and need Sportsnet+ Premium to watch.'
    },
    {
      q: 'Can I watch Toronto Maple Leafs games on TSN4 if I live in Ottawa or Montreal?',
      aPlain: 'No. TSN4 only holds regional rights to 27 Maple Leafs games within Ontario west of Belleville. Viewers in Ottawa, Quebec, and Eastern Canada fall into the Senators and Canadiens broadcast zone, so Leafs games on TSN4 are blacked out. You can watch them using Sportsnet+ Premium.'
    }
  ]
});

console.log('✅ Generated 5 evergreen explainer & methodology pages.');
