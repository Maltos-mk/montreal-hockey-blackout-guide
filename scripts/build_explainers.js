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

function writeExplainerPage(config) {
  const canonicalUrl = `https://hockeyblackouts.ca/${config.slug}/`;
  const schemaJson = buildSchema(config.title, config.description, canonicalUrl, config.faqs);
  const faqHtml = renderFaqHtml(config.faqs);

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

  const outDir = path.join(BUILD_DIR, config.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

// ============================================================================
// 1. SPORTSNET+ BLACKOUT RULES EXPLAINED
// ============================================================================
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
      <td class="py-3 px-4 font-bold text-white">
        <a href="https://hockeyblackouts.ca/${dir}/" class="hover:text-rose-400 hover:underline flex items-center gap-1.5">
          <span>${t.name}</span>
          <i class="fa-solid fa-chevron-right text-[9px] text-slate-500"></i>
        </a>
      </td>
      <td class="py-3 px-4 text-slate-300">${t.networks.regionalEN}</td>
      <td class="py-3 px-4 text-center font-semibold text-emerald-400">${natSatGames} games</td>
      <td class="py-3 px-4 text-center font-semibold text-sky-400">${snPlusExclusives} games</td>
      <td class="py-3 px-4 text-center text-slate-300">${snRegGames > 0 ? `${snRegGames} games (In-Market)` : `<span class="text-amber-400">0 (TSN holds ${tsnRegGames})</span>`}</td>
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
        <strong>Sportsnet+ Standard</strong> is a digital replacement for a basic Sportsnet cable channel package. It strictly enforces local broadcast territory walls:
      </p>
      <ul class="space-y-2 text-xs text-slate-300">
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>National Broadcasts:</strong> Unlocks all Saturday night national games and Sportsnet+ national streaming exclusives coast-to-coast.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>In-Market Sportsnet Teams:</strong> Unlocks regional games ONLY if you live inside the home territory of a Sportsnet-carried team (Vancouver, Calgary, Edmonton, or Toronto's Sportsnet Ontario half).</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-ban text-amber-400 mt-1"></i><span><strong>Out-of-Market Blackouts:</strong> Locks you out of regional games for teams outside your physical province.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-ban text-rose-400 mt-1"></i><span><strong>No TSN Regional Games:</strong> Does NOT include in-market regional games carried by TSN (Montreal TSN2, Ottawa TSN5, Winnipeg TSN3, or Toronto's 26 TSN4 games).</span></li>
      </ul>
    </div>

    <div class="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">Sportsnet+ Premium</h2>
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Out-of-Market Key</span>
      </div>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
        <strong>Sportsnet+ Premium</strong> absorbs the old NHL Live out-of-market streaming package in Canada. It is built specifically for fans cheering for a team outside their local broadcast territory:
      </p>
      <ul class="space-y-2 text-xs text-slate-300">
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>Bypasses Out-of-Market Blackouts:</strong> Streams over 1,000 out-of-market regional games across Canada—even when the game is carried on TSN or RDS in its home market (e.g., watching Habs/Sens/Leafs TSN games from Alberta or BC).</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-check text-emerald-400 mt-1"></i><span><strong>Includes All Standard Content:</strong> Includes every national Sportsnet broadcast and all Stanley Cup Playoff games.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-triangle-exclamation text-amber-400 mt-1"></i><span><strong>The In-Market TSN Catch:</strong> If you live <em>inside</em> the home territory of a TSN team (like living in Ottawa for the Senators or Winnipeg for the Jets), local TSN regional games are still blacked out on Sportsnet+ Premium to protect TSN's local territory rights.</span></li>
        <li class="flex items-start gap-2"><i class="fa-solid fa-triangle-exclamation text-amber-400 mt-1"></i><span><strong>Prime Exclusives Excluded:</strong> National Wednesday/Monday games exclusive to Amazon Prime Video require a Prime membership.</span></li>
      </ul>
    </div>
  </section>

  <section class="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
    <div class="p-5 sm:p-6 border-b border-white/10">
      <h2 class="text-base sm:text-lg font-bold text-white">2026–27 Canadian Team Breakdown on Sportsnet+ (84-Game Schedule)</h2>
      <p class="text-xs text-slate-400 mt-1">Programmatically calculated from the official 2026–27 broadcast schedule across all 7 Canadian franchises:</p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
          <tr>
            <th class="py-3 px-4">Team</th>
            <th class="py-3 px-4">Regional Carrier</th>
            <th class="py-3 px-4 text-center">National (SN)</th>
            <th class="py-3 px-4 text-center">SN+ Exclusive</th>
            <th class="py-3 px-4 text-center">SN+ Standard (In-Market)</th>
            <th class="py-3 px-4 text-center">SN+ Premium (Out-of-Market)</th>
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
        Wait—what if you live right inside the Belleville-to-Kingston corridor? Cable and streaming providers treat this strip as an official <strong>Shared Overlap Zone</strong> where viewers are granted in-market access to regional feeds for all three teams (TOR, OTT, and MTL). Our calculator includes a dedicated <em>Ontario Overlap</em> region option to model this exact boundary.
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
`;

writeExplainerPage({
  slug: 'how-blackouts-work',
  title: 'How Canadian Hockey Blackouts Work: Territory Map & Methodology',
  description: 'How regional hockey blackouts work in Canada. Official broadcast territory boundaries, the Belleville-Kingston overlap zone, and our data methodology.',
  breadcrumb: 'How Blackouts Work & Methodology',
  badgeIcon: 'fa-map-location-dot',
  badgeLabel: 'Territory Rules & Methodology',
  h1: 'How Canadian Hockey Blackouts Work: Territory Map & Methodology',
  subtitle: 'A plain-English breakdown of why regional hockey blackouts exist in Canada, where the provincial boundary lines are drawn, and how HockeyBlackouts.ca verifies every broadcast.',
  bodyHtml: methodologyBodyHtml,
  faqs: [
    {
      q: 'Why do regional hockey blackouts still exist in Canada?',
      aPlain: 'Broadcast rights are split into two separate contracts: National rights (Saturday night Hockey Night in Canada on Sportsnet/TVA Sports and Wednesday/Monday nights on Amazon Prime Video) and Regional rights sold by individual teams to TSN, RDS, or regional Sportsnet feeds. Regional contracts require networks to geofence live games strictly to viewers physically inside that team\'s local territory.'
    },
    {
      q: 'Where is the Ontario blackout boundary line drawn between Toronto and Ottawa/Montreal?',
      aPlain: 'The dividing line in Ontario runs between Belleville and Kingston. Viewers west of Belleville (including the GTA and Southwestern Ontario) are in the Maple Leafs territory. Viewers east of Kingston (including Ottawa and Cornwall) are in the Senators and Canadiens territory. The corridor between Belleville and Kingston is an official overlap zone with access to both.'
    },
    {
      q: 'Are CBC or Citytv broadcasting free over-the-air hockey games in 2026–27?',
      aPlain: 'Under the 2026–27 broadcast agreements, regular-season games require a cable subscription or streaming service (Sportsnet, TSN, RDS, TVA Sports, or Amazon Prime Video) rather than free over-the-air antenna broadcasts.'
    }
  ]
});

console.log('✅ Generated 4 evergreen explainer & methodology pages.');
