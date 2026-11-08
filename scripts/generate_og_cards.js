const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const BUILD_DIR = path.join(__dirname, '../build');
const OG_DIR = path.join(BUILD_DIR, 'og');
const TEAMS_OG_DIR = path.join(OG_DIR, 'teams');
const EXPLAINERS_OG_DIR = path.join(OG_DIR, 'explainers');
const GAMES_OG_DIR = path.join(OG_DIR, 'games');

// Ensure output directories exist
[OG_DIR, TEAMS_OG_DIR, EXPLAINERS_OG_DIR, GAMES_OG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function renderCardHtml({
  brandBadge = 'Canadian Broadcast Guide',
  statusTag = '',
  statusClass = 'status-regional',
  headline = '',
  subheadline = '',
  footerMeta = '100% Free • Independent • Canadian NHL Broadcasts',
  ctaText = 'Check Your Region & Channels → hockeyblackouts.ca'
}) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 630px;
    background: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }
  .card {
    width: 1136px;
    height: 566px;
    background: radial-gradient(circle at 80% 20%, #1e293b 0%, #0f172a 70%);
    border: 2px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    padding: 44px 50px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .brand-icon {
    font-size: 28px;
  }
  .brand-name {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #f8fafc;
  }
  .badge {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .content {
    margin: auto 0;
  }
  .status-tag {
    display: inline-block;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  .status-regional {
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(245, 158, 11, 0.5);
    color: #fbbf24;
  }
  .status-national {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.5);
    color: #34d399;
  }
  .status-prime {
    background: rgba(56, 189, 248, 0.2);
    border: 1px solid rgba(56, 189, 248, 0.5);
    color: #38bdf8;
  }
  .status-info {
    background: rgba(148, 163, 184, 0.2);
    border: 1px solid rgba(148, 163, 184, 0.4);
    color: #e2e8f0;
  }
  .headline {
    font-size: 48px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: #ffffff;
    margin-bottom: 14px;
    max-width: 1000px;
  }
  .subheadline {
    font-size: 21px;
    font-weight: 500;
    line-height: 1.4;
    color: #94a3b8;
    max-width: 960px;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 22px;
  }
  .footer-meta {
    font-size: 15px;
    color: #64748b;
    font-weight: 600;
  }
  .cta-btn {
    background: #10b981;
    color: #022c22;
    font-size: 17px;
    font-weight: 800;
    padding: 13px 26px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 10px 20px -3px rgba(16, 185, 129, 0.35);
  }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <span class="brand-icon">🏒</span>
        <span class="brand-name">HockeyBlackouts.ca</span>
      </div>
      <div class="badge">${brandBadge}</div>
    </div>
    <div class="content">
      ${statusTag ? `<div class="status-tag ${statusClass}">${statusTag}</div>` : ''}
      <h1 class="headline">${headline}</h1>
      <p class="subheadline">${subheadline}</p>
    </div>
    <div class="footer">
      <div class="footer-meta">${footerMeta}</div>
      <div class="cta-btn">${ctaText}</div>
    </div>
  </div>
</body>
</html>`;
}

const cardsToGenerate = [];

// 1. Root default card
cardsToGenerate.push({
  path: path.join(OG_DIR, 'default.png'),
  data: {
    brandBadge: 'Canadian NHL TV & Streaming',
    statusTag: 'Interactive Blackout Finder',
    statusClass: 'status-national',
    headline: "Can You Watch Tonight's NHL Game in Canada?",
    subheadline: 'Find the exact TV channel, streaming service, and regional blackout rules for all 7 Canadian teams by province and provider.',
    ctaText: 'Check Your Region & Channels → hockeyblackouts.ca'
  }
});

// 2. Team Hub cards
const TEAMS_CONFIG = [
  { id: 'tor', dir: 'toronto', name: 'Toronto Maple Leafs', tag: 'Maple Leafs Broadcast Territory', channels: 'TSN4 & Sportsnet Ontario' },
  { id: 'mtl', dir: 'montreal', name: 'Montreal Canadiens', tag: 'Canadiens Broadcast Territory', channels: 'TSN2, RDS & Sportsnet' },
  { id: 'ott', dir: 'ottawa', name: 'Ottawa Senators', tag: 'Senators Broadcast Territory', channels: 'TSN5, RDS & Sportsnet' },
  { id: 'van', dir: 'vancouver', name: 'Vancouver Canucks', tag: 'Canucks Broadcast Territory', channels: 'Sportsnet Pacific' },
  { id: 'cgy', dir: 'calgary', name: 'Calgary Flames', tag: 'Flames Broadcast Territory', channels: 'Sportsnet West' },
  { id: 'edm', dir: 'edmonton', name: 'Edmonton Oilers', tag: 'Oilers Broadcast Territory', channels: 'Sportsnet West' },
  { id: 'wpg', dir: 'winnipeg', name: 'Winnipeg Jets', tag: 'Jets Broadcast Territory', channels: 'TSN3 & Sportsnet' }
];

TEAMS_CONFIG.forEach(t => {
  cardsToGenerate.push({
    path: path.join(TEAMS_OG_DIR, `${t.dir}.png`),
    data: {
      brandBadge: 'Full 84-Game Guide',
      statusTag: t.tag,
      statusClass: 'status-info',
      headline: `Can I Watch the ${t.name.split(' ').slice(1).join(' ')} Tonight?`,
      subheadline: `Verified Canadian TV channels (${t.channels}), streams, and regional blackout rules for all 84 regular season games.`,
      ctaText: 'Check Your Region & Channels → hockeyblackouts.ca'
    }
  });
});

// French Montreal Hub card
cardsToGenerate.push({
  path: path.join(TEAMS_OG_DIR, 'fr-montreal.png'),
  data: {
    brandBadge: 'Horaire complet des 84 matchs',
    statusTag: 'Territoire de diffusion des Canadiens',
    statusClass: 'status-info',
    headline: 'Où regarder les Canadiens ce soir ?',
    subheadline: 'Postes de télévision québécois (RDS, TVA Sports, Sportsnet) et règles de blackouts régionaux au Québec et au Canada.',
    footerMeta: '100 % gratuit • Indépendant • Diffusions LNH au Canada',
    ctaText: 'Vérifiez votre région & vos chaînes → hockeyblackouts.ca'
  }
});

// 3. Evergreen Explainer cards
const EXPLAINERS_CONFIG = [
  {
    slug: 'sportsnet-plus-blackout-rules',
    tag: 'Streaming Blackout Guide',
    statusClass: 'status-regional',
    headline: 'Sportsnet+ Blackout Rules Explained',
    subheadline: 'Understand Standard vs Premium tiers, regional broadcast territories, and which games blackout across Canada.'
  },
  {
    slug: 'tsn-hockey-blackout-rules',
    tag: 'Regional Cable & Streaming',
    statusClass: 'status-regional',
    headline: 'TSN Hockey Blackout Rules Explained',
    subheadline: 'Regional broadcast territories and boundary rules for Maple Leafs (TSN4), Senators (TSN5), Canadiens (TSN2), and Jets (TSN3).'
  },
  {
    slug: 'prime-hockey-schedule-canada',
    tag: 'National Broadcast Schedule',
    statusClass: 'status-prime',
    headline: 'Amazon Prime Monday Night Hockey',
    subheadline: 'Full broadcast schedule and streaming guide. Watch exclusive Prime Video NHL games coast-to-coast in Canada with zero blackouts.'
  },
  {
    slug: 'rds-vs-tva-sports-blackouts',
    tag: 'Diffusions francophones',
    statusClass: 'status-info',
    headline: 'RDS vs. TVA Sports Blackout Rules',
    subheadline: 'How French-language regional and national broadcast rights work for the Montreal Canadiens and NHL across Canada.'
  },
  {
    slug: 'how-blackouts-work',
    tag: 'Methodology & Territory Map',
    statusClass: 'status-national',
    headline: 'How NHL Regional Blackouts Work',
    subheadline: 'Interactive map of Canadian broadcast territories, regional vs national feeds, and cable rules.'
  }
];

EXPLAINERS_CONFIG.forEach(exp => {
  cardsToGenerate.push({
    path: path.join(EXPLAINERS_OG_DIR, `${exp.slug}.png`),
    data: {
      brandBadge: 'Official Blackout Guide',
      statusTag: exp.tag,
      statusClass: exp.statusClass,
      headline: exp.headline,
      subheadline: exp.subheadline,
      ctaText: 'Check Your Region & Channels → hockeyblackouts.ca'
    }
  });
});

// 4. Game Detail Page cards (Rolling active window: yesterday through +14 days)
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

const now = new Date();
const activeGames = new Map();

['tor', 'mtl', 'ott', 'van', 'cgy', 'edm', 'wpg'].forEach(teamId => {
  const filePath = path.join(__dirname, `../data/${teamId}.json`);
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  data.schedule.forEach(g => {
    const gameDate = new Date(g.iso);
    const diffDays = (now - gameDate) / (1000 * 60 * 60 * 24);
    if (diffDays >= -14 && diffDays <= 1) {
      const isHome = g.vs.startsWith('vs ');
      const homeId = isHome ? data.team.id : g.opp;
      const awayId = isHome ? g.opp : data.team.id;
      const datePrefix = g.iso.split('T')[0];
      const matchKey = `${datePrefix}_${homeId}_${awayId}`;
      if (!activeGames.has(matchKey)) {
        activeGames.set(matchKey, {
          game: g,
          homeId,
          awayId,
          datePrefix
        });
      }
    }
  });
});

activeGames.forEach(({ game: g, homeId, awayId, datePrefix }) => {
  const homeCity = TEAM_CITIES[homeId] || homeId;
  const awayCity = TEAM_CITIES[awayId] || awayId;
  const homeSlug = slugifyCity(homeCity);
  const awaySlug = slugifyCity(awayCity);
  const cardFileName = `${datePrefix}-${homeSlug}-vs-${awaySlug}.png`;

  const isNational = g.typeEN === 'national' || g.typeEN === 'prime_wednesday';
  const isPrime = g.typeEN === 'prime_wednesday' || g.netEN === 'Prime Video';

  let statusTag = 'Regional — Blackouts Apply';
  let statusClass = 'status-regional';
  if (isPrime) {
    statusTag = 'Prime Video Exclusive';
    statusClass = 'status-prime';
  } else if (isNational) {
    statusTag = 'Coast-to-Coast National Broadcast';
    statusClass = 'status-national';
  }

  const networks = [g.netEN || 'Sportsnet'];
  if (g.netFR && g.netFR !== 'None') networks.push(g.netFR);
  const networkStr = networks.join(' / ');

  cardsToGenerate.push({
    path: path.join(GAMES_OG_DIR, cardFileName),
    data: {
      brandBadge: 'Live Broadcast Status',
      statusTag,
      statusClass,
      headline: `${awayCity} vs. ${homeCity} — TV & Blackout Status`,
      subheadline: `${g.date} • ${g.time || '7:00 PM ET'} • Networks: ${networkStr}`,
      ctaText: 'Check Your Region & Channels → hockeyblackouts.ca'
    }
  });
});

async function generateCards() {
  console.log(`Generating ${cardsToGenerate.length} OpenGraph 1200x630 cards in parallel...`);
  const startTime = Date.now();

  const browser = await chromium.launch({ headless: true });
  const WORKERS = 4;
  const pages = await Promise.all(
    Array.from({ length: WORKERS }, () => browser.newPage({ viewport: { width: 1200, height: 630 } }))
  );

  let currentIndex = 0;
  await Promise.all(pages.map(async (page, workerIdx) => {
    while (currentIndex < cardsToGenerate.length) {
      const item = cardsToGenerate[currentIndex++];
      const html = renderCardHtml(item.data);
      await page.setContent(html);
      await page.screenshot({ path: item.path, type: 'png' });
    }
  }));

  await browser.close();
  console.log(`✅ Successfully generated ${cardsToGenerate.length} cards in ${(Date.now() - startTime) / 1000}s.`);
}

generateCards().catch(err => {
  console.error('❌ Error generating OG cards:', err);
  process.exit(1);
});
