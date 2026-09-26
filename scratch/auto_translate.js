const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

let html = fs.readFileSync('teams/montreal/index.html', 'utf8');

const dom = new JSDOM(html);
const document = dom.window.document;

const dict = {
  // Add UI strings here
  'Add App': 'Ajouter l\\'application',
  'Montreal Canadiens TV &amp; Blackout Guide': 'Guide de diffusion des Canadiens',
  'Find exactly what channel or streaming service you need for tonight\\'s game.': 'Trouvez exactement quelle chaîne ou service de streaming vous avez besoin pour le match de ce soir.',
  'Where do you live?': 'Où habitez-vous ?',
  'In-Market': 'Dans la région',
  'Out-of-Market (Canada)': 'Hors marché (Canada)',
  'US & International': 'États-Unis ou International',
  'What do you subscribe to?': 'À quoi êtes-vous abonné ?',
  'Sportsnet (Cable / Standard)': 'Sportsnet (Câble / Standard)',
  'Saturday marquee, national games': 'Matchs nationaux du samedi',
  'Sportsnet+ Premium / Centre Ice': 'Sportsnet+ PREMIUM / Centre Ice',
  'Official out-of-market regional package': 'Forfait régional officiel hors marché',
  'TSN / TSN2': 'TSN / TSN2',
  '50 Regional Habs games (in-market only)': '50 matchs régionaux des Canadiens',
  'Amazon Prime Video': 'Amazon Prime Video',
  'National Monday Night Hockey feeds': 'Matchs nationaux du lundi soir',
  'RDS / RDS Direct': 'RDS / RDS Direct',
  '45 Regional French Canadiens games': '45 matchs régionaux en français',
  'TVA Sports': 'TVA Sports',
  'National French broadcasts (zero blackouts)': 'Matchs nationaux en français',
  'ESPN+ / NHL.tv (US / International)': 'ESPN+ / NHL.tv',
  'Official out-of-market Habs streaming outside Canada': 'Streaming officiel hors marché à l\\'étranger',
  'Broadcast Language Filter': 'Filtre de langue de diffusion',
  'English Only': 'Anglais',
  'French Only': 'Français',
  'Either (Any)': 'Peu importe',
  'Upcoming Games': 'À venir',
  'All Games': 'Tous les matchs',
  'Past Games': 'Terminés',
  'Status: All': 'Statut: Tous',
  'Watchable': 'Disponible',
  'Blacked Out': 'Restriction',
  'Need Sub': 'Abonnement Requis',
  'Channel: All': 'Chaîne: Toutes',
  'Gm': 'M#',
  'Date & Time': 'Date et heure',
  'Matchup / Venue': 'Adversaire / Lieu',
  'Broadcast': 'Diffusion',
  'Coverage Type': 'Type de couverture',
  'Access Status': 'Statut d\\'accès',
  'Showing upcoming Montreal Canadiens games': 'Matchs à venir des Canadiens de Montréal',
  'Automatically synchronized with client device clock': 'Synchronisé automatiquement avec l\\'heure de votre appareil',
  'Deep Dive: Regional Blackout Rules': 'En détail : Règles de restrictions régionales',
  'Close': 'Fermer',
  'Not now': 'Plus tard',
  'Install App': 'Installer',
  'Share': 'Partager'
};

// We will inject a translation function that translates all text nodes matching keys in the dict
let i18nScript = `
window.i18n = {
  current: 'en',
  dict: { 'fr': ${JSON.stringify(dict, null, 4)} },
  originalNodes: new Map(),
  
  t: function(str) {
    if (this.current === 'en') return str;
    
    // Exact match
    if (this.dict['fr'][str]) return this.dict['fr'][str];
    
    // Prefix matches
    if (str.startsWith('Watch on ')) return 'Regardez sur ' + str.replace('Watch on ', '');
    if (str.startsWith('Requires ')) return 'Nécessite ' + str.replace('Requires ', '');
    if (str.includes('BLACKED OUT outside territory.')) return 'RESTRICTION (Hors territoire). Nécessite Sportsnet+ PREMIUM ou Centre Ice.';
    if (str === 'Regional feeds blacked out in your territory. Requires Premium sub.') return 'Matchs régionaux soumis à des restrictions (blackout). Abonnement Premium requis.';
    
    return str;
  },
  
  init: function() {
    const saved = localStorage.getItem('lang');
    if (saved) {
      this.current = saved;
    } else if (navigator.language.startsWith('fr')) {
      this.current = 'fr';
    }
    
    // Walk DOM and save original English text
    this.walkDOM(document.body, (node) => {
      const text = node.nodeValue.trim();
      if (text && !this.originalNodes.has(node)) {
         this.originalNodes.set(node, text);
      }
    });
    
    this.apply();
  },
  
  toggle: function() {
    this.current = this.current === 'en' ? 'fr' : 'en';
    localStorage.setItem('lang', this.current);
    this.apply();
    if (window.renderApp) window.renderApp();
  },
  
  apply: function() {
    document.documentElement.lang = this.current;
    
    // Translate all saved text nodes
    for (let [node, origText] of this.originalNodes) {
       const trans = this.t(origText);
       if (trans !== origText || this.current === 'en') {
          node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), trans);
       }
    }
    
    // Toggle active state on EN/FR buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.dataset.lang === this.current) {
        btn.classList.add('font-bold', 'text-teamPrimary', 'dark:text-red-400');
        btn.classList.remove('text-slate-500', 'dark:text-slate-400', 'hover:text-slate-800');
      } else {
        btn.classList.remove('font-bold', 'text-teamPrimary', 'dark:text-red-400');
        btn.classList.add('text-slate-500', 'dark:text-slate-400', 'hover:text-slate-800');
      }
    });

    const disc = document.getElementById('frDisclaimer');
    if (disc) {
       disc.classList.toggle('hidden', this.current === 'en');
    }
    
    // Placeholder
    const search = document.getElementById('search');
    if (search) {
      search.placeholder = this.current === 'en' ? 'Filter by opponent...' : 'Filtrer par adversaire...';
    }
  },
  
  walkDOM: function(el, callback) {
    for (let node of el.childNodes) {
      if (node.nodeType === 3) {
        callback(node);
      } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        this.walkDOM(node, callback);
      }
    }
  }
};
`;

fs.writeFileSync('teams/montreal/i18n.js', i18nScript);
