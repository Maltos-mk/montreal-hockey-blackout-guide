const fs = require('fs');

let code = fs.readFileSync('teams/montreal/i18n.js', 'utf8');

const newTranslations = `
      // Advice Cards
      'In-Market Full Season Montreal Canadiens Setup': 'Configuration pour la saison complète (Région de Montréal)',
      'To receive all Montreal Canadiens games, you need Sportsnet (Saturdays), TSN2 or RDS (regional mid-week), and <span class="font-bold">Amazon Prime</span> for Monday night feeds.': 'Pour regarder tous les matchs des Canadiens, vous avez besoin de Sportsnet (les samedis), TSN2 ou RDS (matchs régionaux en semaine), et <span class="font-bold">Amazon Prime</span> pour les lundis soirs.',
      'Official Out-of-Market Options for Habs Fans:': 'Options officielles hors marché pour les partisans :',
      'Subscribing to TSN or RDS does <strong>not</strong> unlock Montreal Canadiens regional games in Ontario or Western Canada due to NHL blackouts. To watch those 50 regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).': 'S\\'abonner à TSN ou RDS <strong>ne débloque pas</strong> les matchs régionaux des Canadiens en Ontario ou dans l\\'Ouest canadien à cause des restrictions (blackouts) de la LNH. Pour ces 50 matchs, vous avez besoin de <strong>Sportsnet+ PREMIUM</strong> ou <strong>NHL Centre Ice</strong>.',
      'International & US Montreal Viewing': 'Visionnement aux États-Unis et à l\\'International',
      'ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN or TNT follow local US availability rules.': 'ESPN+ diffuse les matchs hors marché de la LNH pour les spectateurs américains. Les matchs nationaux américains sur ESPN ou TNT suivent les règles locales de disponibilité.',
`;

code = code.replace("// Opponents & Terms", newTranslations + "\n      // Opponents & Terms");

fs.writeFileSync('teams/montreal/i18n.js', code);
