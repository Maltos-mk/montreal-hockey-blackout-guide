const fs = require('fs');
let html = fs.readFileSync('teams/toronto/index.html', 'utf-8');

html = html.replace('QC, Atlantic Canada, Eastern Ontario (Leafs Broadcast Territory)', 'Ontario (excluding Ottawa Valley)');
html = html.replace('Following the <strong>Toronto Maple Leafs </strong> regular season and preseason broadcasts across Canada requires understanding how NHL broadcast territory rights are allocated between national networks and regional partners. For Toronto Maple Leafs fans, games are split across five distinct television and streaming networks: <strong>TSN2, RDS, Sportsnet, Amazon Prime Video, and TVA Sports</strong>.', 'Following the <strong>Toronto Maple Leafs </strong> regular season and preseason broadcasts across Canada requires understanding how NHL broadcast territory rights are allocated between national networks and regional partners. For Toronto Maple Leafs fans, games are split across major television and streaming networks: <strong>TSN4, Sportsnet Ontario, CBC, Amazon Prime Video, and TVA Sports</strong>.');

fs.writeFileSync('teams/toronto/index.html', html);
