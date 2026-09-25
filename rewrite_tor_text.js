const fs = require('fs');
let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');

const replacements = [
  {
    search: `"name": "Why are Toronto Maple Leafs games blacked out on TSN2 in Ontario?",`,
    replace: `"name": "Why are Toronto Maple Leafs games blacked out on TSN4 and Sportsnet Ontario outside of Ontario?",`
  },
  {
    search: `"text": "TSN2 and RDS hold regional broadcast rights for the Toronto Maple Leafs limited strictly to Quebec, Atlantic Canada, and Eastern Ontario. Leafs fans in Western Ontario, Toronto, and Western Canada are subject to NHL territorial blackouts unless watching via Sportsnet+ Premium or NHL Centre Ice."`,
    replace: `"text": "TSN4 and Sportsnet Ontario hold regional broadcast rights for the Toronto Maple Leafs, limited strictly to Ontario (excluding the Ottawa Valley). Leafs fans in Quebec, Atlantic Canada, and Western Canada are subject to NHL territorial blackouts unless watching via Sportsnet+ Premium or NHL Centre Ice."`
  },
  {
    search: `"text": "Out-of-market Canadian fans living outside Quebec and Eastern Ontario can watch all regional Toronto Maple Leafs games on TSN2 and RDS by subscribing to Sportsnet+ Premium or NHL Centre Ice. Saturday night games on Sportsnet and Monday games on Amazon Prime Video have zero regional blackouts across Canada."`,
    replace: `"text": "Out-of-market Canadian fans living outside Ontario can watch all regional Toronto Maple Leafs games on TSN4 and Sportsnet Ontario by subscribing to Sportsnet+ Premium or NHL Centre Ice. Saturday night games on Sportsnet/CBC and Monday games on Amazon Prime Video have zero regional blackouts across Canada."`
  },
  {
    search: `<option value="TSN2">TSN2</option>`,
    replace: `<option value="TSN4">TSN4</option>`
  },
  {
    search: `<p class="text-sm font-semibold">TSN / TSN2</p>`,
    replace: `<p class="text-sm font-semibold">TSN / TSN4</p>`
  },
  {
    search: `following the <strong>Toronto Maple Leafs </strong> regular season and preseason broadcasts across Canada requires understanding how NHL broadcast territory rights are allocated between national networks and regional partners. For Toronto Maple Leafs fans, games are split across five distinct television and streaming networks: <strong>TSN2, RDS, Sportsnet, Amazon Prime Video, and TVA Sports</strong>.`,
    replace: `Following the <strong>Toronto Maple Leafs </strong> regular season and preseason broadcasts across Canada requires understanding how NHL broadcast territory rights are allocated between national networks and regional partners. For Toronto Maple Leafs fans, games are split across major television and streaming networks: <strong>TSN4, Sportsnet Ontario, CBC, Amazon Prime Video, and TVA Sports</strong>.`
  },
  {
    search: `<h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Regional Toronto Maple Leafs Games (TSN2 & RDS)</h3>`,
    replace: `<h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Regional Toronto Maple Leafs Games (TSN4 & Sportsnet Ontario)</h3>`
  },
  {
    search: `<strong>TSN2</strong> (50 English games) and <strong>RDS</strong> (45 French games) hold the official regional rights for the Toronto Maple Leafs. Their broadcast boundary is restricted by NHL carriage rules strictly to <strong>Quebec, Atlantic Canada (New Brunswick, Nova Scotia, PEI, Newfoundland), and Eastern Ontario (Pembroke, Ottawa, Cornwall)</strong>.`,
    replace: `<strong>TSN4</strong> and <strong>Sportsnet Ontario</strong> hold the official regional rights for the Toronto Maple Leafs. Their broadcast boundary is restricted by NHL carriage rules strictly to <strong>Ontario (excluding the Ottawa Valley)</strong>.`
  },
  {
    search: `If you reside outside this territory (such as Toronto, the GTA, Northern Ontario, Manitoba, Saskatchewan, Alberta, or British Columbia), standard cable subscriptions to TSN or RDS will show a <strong>regional blackout screen</strong> during live Toronto Maple Leafs games. Out-of-market Leafs fans must use <strong>Sportsnet+ Premium</strong> or add <strong>NHL Centre Ice</strong> to watch regional feeds legally.`,
    replace: `If you reside outside this territory (such as Quebec, Atlantic Canada, Manitoba, Saskatchewan, Alberta, or British Columbia), standard cable subscriptions to TSN or Sportsnet will show a <strong>regional blackout screen</strong> during live regional Toronto Maple Leafs games. Out-of-market Leafs fans must use <strong>Sportsnet+ Premium</strong> or add <strong>NHL Centre Ice</strong> to watch regional feeds legally.`
  },
  {
    search: `<strong>Quick Summary for Leafs Fans Living Outside Quebec:</strong> If tonight's Toronto Maple Leafs game is scheduled on Sportsnet, Prime Video, or TVA Sports, you can watch anywhere in Canada without blackouts. If the game is on TSN2 or RDS, you will be blacked out in Western Ontario and the West unless you have Sportsnet+ Premium or NHL Centre Ice.`,
    replace: `<strong>Quick Summary for Leafs Fans Living Outside Ontario:</strong> If tonight's Toronto Maple Leafs game is scheduled nationally on Sportsnet, CBC, Prime Video, or TVA Sports, you can watch anywhere in Canada without blackouts. If the game is a regional broadcast on TSN4 or Sportsnet Ontario, you will be blacked out outside of Ontario unless you have Sportsnet+ Premium or NHL Centre Ice.`
  },
  {
    search: `<option value="in_market">In-Market (Quebec, Atlantic, Eastern ON)</option>`,
    replace: `<option value="in_market">In-Market (Ontario - excluding Ottawa Valley)</option>`
  }
];

for (const r of replacements) {
  if (html.indexOf(r.search) === -1) {
    console.error("COULD NOT FIND: ", r.search);
  }
  html = html.replace(r.search, r.replace);
}

fs.writeFileSync('teams/toronto/index.html', html);
