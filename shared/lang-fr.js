/*
 * French (Québec) strings for HockeyBlackouts.ca.
 *
 * One file, two consumers:
 *   - browser: loaded before app.js on /fr/ pages, exposes window.HB_FR
 *   - node:    required by scripts/build_fr.js and scripts/i18n_check.js
 *
 * Rules for this file:
 *   - Every string app.js passes to tx() MUST have an entry in `strings`
 *     (scripts/i18n_check.js fails the build if one is missing).
 *   - Blackout reasons produced by the engine are matched by `reasons`.
 *   - Quebec conventions: "3 $", "50 %", no space before ? and !, "diffusion en continu".
 */
(function (root) {
  'use strict';

  // [full name, nickname]
  var TEAMS = {
    ANA: ['Ducks d’Anaheim', 'Ducks'],
    BOS: ['Bruins de Boston', 'Bruins'],
    BUF: ['Sabres de Buffalo', 'Sabres'],
    CAR: ['Hurricanes de la Caroline', 'Hurricanes'],
    CBJ: ['Blue Jackets de Columbus', 'Blue Jackets'],
    CGY: ['Flames de Calgary', 'Flames'],
    CHI: ['Blackhawks de Chicago', 'Blackhawks'],
    COL: ['Avalanche du Colorado', 'Avalanche'],
    DAL: ['Stars de Dallas', 'Stars'],
    DET: ['Red Wings de Detroit', 'Red Wings'],
    EDM: ['Oilers d’Edmonton', 'Oilers'],
    FLA: ['Panthers de la Floride', 'Panthers'],
    LAK: ['Kings de Los Angeles', 'Kings'],
    MIN: ['Wild du Minnesota', 'Wild'],
    MTL: ['Canadiens de Montréal', 'Canadiens'],
    NJD: ['Devils du New Jersey', 'Devils'],
    NSH: ['Predators de Nashville', 'Predators'],
    NYI: ['Islanders de New York', 'Islanders'],
    NYR: ['Rangers de New York', 'Rangers'],
    OTT: ['Sénateurs d’Ottawa', 'Sénateurs'],
    PHI: ['Flyers de Philadelphie', 'Flyers'],
    PIT: ['Penguins de Pittsburgh', 'Penguins'],
    SJS: ['Sharks de San Jose', 'Sharks'],
    SEA: ['Kraken de Seattle', 'Kraken'],
    STL: ['Blues de St. Louis', 'Blues'],
    TBL: ['Lightning de Tampa Bay', 'Lightning'],
    TOR: ['Maple Leafs de Toronto', 'Maple Leafs'],
    UTA: ['Mammoth de l’Utah', 'Mammoth'],
    VAN: ['Canucks de Vancouver', 'Canucks'],
    VGK: ['Golden Knights de Vegas', 'Golden Knights'],
    WSH: ['Capitals de Washington', 'Capitals'],
    WPG: ['Jets de Winnipeg', 'Jets']
  };

  // Territory description by region code (used in prose).
  var REGION_DESCRIPTIONS = {
    on_east_qc_atl: 'le Québec, l’est de l’Ontario et le Canada atlantique',
    on_west: 'l’ouest de l’Ontario',
    mb: 'le Manitoba',
    ab: 'l’Alberta',
    bc: 'la Colombie-Britannique et le Yukon'
  };

  var REGION_OPTIONS = [
    ['on_east_qc_atl', 'Québec, est de l’Ontario, Canada atlantique'],
    ['on_overlap', 'Zone de chevauchement en Ontario (Belleville, Kingston, Pembroke)'],
    ['on_west', 'Ontario ouest (Toronto, London)'],
    ['nw_on', 'Nord-ouest de l’Ontario (Thunder Bay)'],
    ['mb', 'Manitoba'],
    ['sk', 'Saskatchewan, T.N.-O. et Nunavut'],
    ['ab', 'Alberta'],
    ['bc', 'Colombie-Britannique et Yukon'],
    ['us_intl', 'États-Unis et international']
  ];

  // Exact-match UI strings. Key = the English source string passed to tx().
  var strings = {
    // Share
    'Link copied to clipboard!': 'Lien copié dans le presse-papiers!',
    'Sharing not supported on this browser. Copy the URL from your address bar to share!':
      'Ce navigateur ne permet pas le partage. Copiez l’adresse dans la barre d’adresse pour la partager!',
    '{0} Broadcast Guide': 'Guide de diffusion : {0}',
    'Hockey Broadcast Guide': 'Guide de diffusion du hockey',

    // Advice cards
    'In-Market Full Season Setup': 'Tous les matchs dans votre marché',
    'To receive all {0} games locally, you generally need Sportsnet (Saturdays), your local regional channel, and Amazon Prime.':
      'Pour recevoir tous les matchs des {0} chez vous, il faut généralement Sportsnet (le samedi), votre chaîne régionale et Amazon Prime.',
    'Official Out-of-Market Options': 'Options officielles hors marché',
    'Subscribing to a regional channel from another province does <strong>not</strong> bypass NHL blackouts. To watch out-of-market regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).':
      'S’abonner à une chaîne régionale d’une autre province ne permet <strong>pas</strong> de contourner les blackouts de la LNH. Pour regarder des matchs régionaux hors marché, il vous faut <strong>Sportsnet+ Premium</strong> (diffusion en continu) ou <strong>Centre Ice de la LNH</strong> (câble).',
    'International & US Viewing': 'Aux États-Unis et à l’international',
    'ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN, TNT, or simulcast on NHL Network follow local US availability rules and will be blacked out on ESPN+.':
      'ESPN+ diffuse les matchs de la LNH hors marché pour les amateurs américains. Les diffusions nationales américaines sur ESPN, TNT ou en simultané sur NHL Network suivent les règles de disponibilité locales aux États-Unis et sont bloquées sur ESPN+.',
    ' (Included)': ' (inclus)',

    // Schedule
    'Preseason': 'Présaison',
    'Split Squad': 'Équipe divisée',
    'Final': 'Terminé',
    'Watchable': 'Disponible',
    'Blacked Out': 'Blackout',
    'Need Sub': 'Abonnement requis',
    'Out-of-Market': 'Hors marché',
    'National (Coast-to-Coast)': 'National (d’un océan à l’autre)',
    'Prime Wednesday Exclusive': 'Exclusivité Prime (mercredi)',
    'Regional Territory': 'Territoire régional',
    'Showing the {0}-game {1} TV broadcast schedule': 'Horaire de diffusion des {1} : {0} matchs affichés',
    'Showing {0} completed games': 'Matchs terminés affichés : {0}',
    'Showing {0} total games': 'Matchs affichés : {0}',
    '{0} at {1}': '{0} à {1}',
    '{0} vs {1}': '{0} vs {1}',

    // Spotlight
    '★ Game Today': '★ Match aujourd’hui',
    'Next {0} Game': 'Prochain match des {0}',
    'Game {0} of {1}': 'Match {0} de {1}',
    'Broadcast:': 'Diffusion :',
    'Upcoming Schedule Snapshot:': 'Aperçu des prochains matchs :',
    'Watchable On Your Setup': 'Disponible avec vos abonnements',
    'Regionally Blacked Out': 'Blackout régional',
    'Subscription Needed': 'Abonnement requis',
    'Breakdown &rarr;': 'Détails &rarr;',
    'View Blackout Breakdown &rarr;': 'Voir les détails de diffusion &rarr;',
    'TV & Blackout Breakdown &rarr;': 'Chaînes et blackouts &rarr;',
    'View TV broadcast and blackout breakdown': 'Voir les chaînes télé et les détails de blackout',

    // Score box
    'Full Season Coverage ({0} Games)': 'Couverture de la saison complète ({0} matchs)',
    '{0}% Watchable': '{0} % disponibles',
    '/ {0} GAMES': '/ {0} MATCHS',
    '{0} games ({1}%)': '{0} matchs ({1} %)',

    // Install modal
    'Tap the <strong class="text-blue-500 font-semibold"><i class="fa-solid fa-arrow-up-from-bracket"></i> Share icon</strong> at the bottom of Safari.':
      'Touchez l’<strong class="text-blue-500 font-semibold"><i class="fa-solid fa-arrow-up-from-bracket"></i> icône de partage</strong> au bas de Safari.',
    'Scroll down & select <strong class="text-slate-900 dark:text-white font-semibold">"Add to Home Screen" <i class="fa-regular fa-square-plus ml-1"></i></strong>':
      'Faites défiler et choisissez <strong class="text-slate-900 dark:text-white font-semibold">« Sur l’écran d’accueil » <i class="fa-regular fa-square-plus ml-1"></i></strong>',
    'Tap <strong class="text-amber-500 font-semibold">"Add"</strong> in the top right.':
      'Touchez <strong class="text-amber-500 font-semibold">« Ajouter »</strong> en haut à droite.',
    'Install directly to your device for instant launch and offline access.':
      'Installez l’application sur votre appareil pour un accès instantané, même hors ligne.',
    'Install Now': 'Installer maintenant',
    'Tap the browser menu <strong class="text-slate-900 dark:text-white font-semibold">(three dots <i class="fa-solid fa-ellipsis-vertical"></i>)</strong>.':
      'Touchez le menu du navigateur <strong class="text-slate-900 dark:text-white font-semibold">(trois points <i class="fa-solid fa-ellipsis-vertical"></i>)</strong>.',
    'Select <strong class="text-slate-900 dark:text-white font-semibold">"Install App"</strong> or <strong class="text-slate-900 dark:text-white font-semibold">"Add to Home screen"</strong>.':
      'Choisissez <strong class="text-slate-900 dark:text-white font-semibold">« Installer l’application »</strong> ou <strong class="text-slate-900 dark:text-white font-semibold">« Ajouter à l’écran d’accueil »</strong>.',

    // PDF export
    'Generating...': 'Génération…',
    '{0} - 2026-27 TV Schedule': '{0} – Horaire télé 2026-2027',
    'Configured Region: {0}  |  Active Subscriptions: {1}': 'Région : {0}  |  Abonnements actifs : {1}',
    'None': 'Aucun',
    'Date & Time': 'Date et heure',
    'Matchup': 'Match',
    'Network': 'Chaîne',
    'Access Status': 'Accès',
    '{0}_Schedule.pdf': '{0}_Horaire.pdf'
  };

  // Ko-fi copy (kept next to the other French copy so it is reviewed together).
  var kofi = {
    control: { copy: 'Cette page vous a évité un mal de tête ce soir? Offrez-moi un café pour la garder en ligne.', cta: 'Un café, 3 $' },
    anti_gambling: { copy: 'Zéro pop-up. Zéro vidéo qui part toute seule. Zéro pub de paris avant la mise au jeu. Aidez-moi à garder ce site indépendant.', cta: 'Payer une bière au dev (3 $)' },
    telecom_spite: { copy: 'Trouver la chaîne d’un match ne devrait pas exiger un diplôme en droit et quatre abonnements. Aidez-moi à garder les lumières allumées.', cta: 'Donner 3 $' },
    swear_jar: { copy: 'Dix minutes de moins à crier après la télécommande? Mettez 3 $ dans le pot à jurons pour que ça continue.', cta: 'Payer l’amende de 3 $' }
  };

  // Blackout reasons produced by evaluateGame(). Order matters: specific rules first.
  // Each: [regex on the English reason, replacement function(match...)].
  var reasons = [
    [/^Available in English & French$/, function () { return 'Disponible en anglais et en français'; }],
    [/^Regional feeds blacked out in your territory\. Requires Premium sub\.$/, function () { return 'Matchs régionaux en blackout dans votre territoire. Abonnement Premium requis.'; }],
    [/^BLACKED OUT outside territory\. Requires NHL Centre Ice\.$/, function () { return 'Blackout hors de votre territoire. Centre Ice de la LNH requis.'; }],
    [/^BLACKED OUT outside territory\. Requires Sportsnet \(Cable or Stream\) Premium or Centre Ice\.$/, function () { return 'Blackout hors de votre territoire. Sportsnet+ Premium ou Centre Ice requis.'; }],
    [/^No English Broadcast$/, function () { return 'Aucune diffusion en anglais'; }],
    [/^No French Broadcast$/, function () { return 'Aucune diffusion en français'; }],
    [/^Watch on Sportsnet\+ PREMIUM \(or Centre Ice\)$/, function () { return 'À voir avec Sportsnet+ PREMIUM (ou Centre Ice)'; }],
    [/^Watch on NHL Centre Ice$/, function () { return 'À voir avec Centre Ice de la LNH'; }],
    [/^Watch on local opponent feed(?: \((.+)\))?$/, function (m, net) { return 'À voir sur la diffusion locale de l’adversaire' + (net ? ' (' + net + ')' : ''); }],
    [/^Requires Sportsnet\/TSN for opponent feed$/, function () { return 'Sportsnet ou TSN requis pour la diffusion de l’adversaire'; }],
    [/^Requires French channel for opponent feed$/, function () { return 'Chaîne francophone requise pour la diffusion de l’adversaire'; }],
    [/^Requires Sportsnet\+ \(Streaming\)$/, function () { return 'Sportsnet+ (diffusion en continu) requis'; }],
    [/^Requires Sportsnet \(Cable or Stream\)$/, function () { return 'Sportsnet requis (câble ou diffusion en continu)'; }],
    [/^Watch on (.+)$/, function (m, net) { return 'À voir sur ' + net; }],
    [/^Requires (.+)$/, function (m, net) { return net + ' requis'; }]
  ];

  // Reasons are joined with " / " in the "either language" view; split before translating.
  var REASON_SPLIT = / \/ (?=Watch on |Requires |BLACKED OUT|No (?:English|French) Broadcast|Available in |Regional feeds)/;

  function format(s, args) {
    return s.replace(/\{(\d+)\}/g, function (m, i) { return args[i] === undefined ? m : args[i]; });
  }

  function translateReason(en) {
    for (var i = 0; i < reasons.length; i++) {
      var m = en.match(reasons[i][0]);
      if (m) return reasons[i][1].apply(null, m);
    }
    return null; // unmatched
  }

  function translateSummary(en) {
    if (!en) return en;
    var parts = en.split(REASON_SPLIT);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var t = translateReason(parts[i]);
      if (t === null) {
        if (typeof console !== 'undefined') console.warn('[i18n] no French rule for reason:', parts[i]);
        t = parts[i];
      }
      out.push(t);
    }
    return out.join(' / ');
  }

  var FR = {
    teams: TEAMS,
    regionDescriptions: REGION_DESCRIPTIONS,
    regionOptions: REGION_OPTIONS,
    strings: strings,
    kofi: kofi,
    reasons: reasons,
    format: format,
    translateReason: translateReason,
    translateSummary: translateSummary
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = FR;
  else root.HB_FR = FR;
})(typeof window !== 'undefined' ? window : globalThis);
