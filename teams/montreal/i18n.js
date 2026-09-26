window.i18n = {
  current: 'en',
  dict: {
    'fr': {
      // Header
      'title': 'Guide de diffusion et des restrictions des Canadiens',
      'subtitle': 'Trouvez exactement quelle chaîne ou service de streaming vous avez besoin pour le match de ce soir.',
      'btn-add-app': 'Ajouter l\'application',
      
      // Selectors
      'where-live': 'Où habitez-vous ?',
      'in-market': 'Dans la région de Montréal (In-Market)',
      'out-market': 'Reste du Canada (Hors marché)',
      'us-intl': 'États-Unis ou International',
      'what-subs': 'À quoi êtes-vous abonné ?',
      'cable-streaming': 'Câble / Streaming Base',
      'premium-pkgs': 'Forfaits LNH Premium',
      
      // Subscriptions
      'sub-tsn2': 'TSN2 (Anglais)',
      'sub-tsn2-desc': 'Matchs régionaux en semaine',
      'sub-rds': 'RDS (Français)',
      'sub-rds-desc': 'Matchs régionaux en semaine',
      'sub-sn': 'Sportsnet (Réseau national)',
      'sub-sn-desc': 'Hockey Night in Canada / Soirée du hockey',
      'sub-prime': 'Amazon Prime Video',
      'sub-prime-desc': 'Matchs nationaux du lundi soir',
      'sub-tva': 'TVA Sports',
      'sub-tva-desc': 'Matchs nationaux (Samedi soir)',
      'sub-snp': 'Sportsnet+ PREMIUM',
      'sub-snp-desc': 'Débloque les matchs hors marché au Canada',
      'sub-espn': 'ESPN+ / NHL.tv',
      'sub-espn-desc': 'Abonnement hors marché américain',
      
      // Filters & Schedule
      'filter-all': 'Tous les matchs',
      'filter-home': 'Domicile seulement',
      'filter-away': 'Extérieur seulement',
      'filter-national': 'Nationaux (Pas de restriction)',
      'filter-regional': 'Régionaux',
      'th-opp': 'Adversaire',
      'th-datetime': 'Date / Heure',
      'th-eng': 'Anglais',
      'th-fre': 'Français',
      'th-status': 'Statut / Accès',
      
      // Footer & Modals
      'footer-kofi': 'Ce guide vous a été utile ? Offrez-moi un café sur Ko-fi &rarr;',
      'footer-disclaimer': 'Traduit automatiquement. Veuillez excuser les éventuelles erreurs.',
      'modal-deepdive-btn': 'Règles de diffusion',
      'modal-deepdive-title': 'Comment fonctionnent les restrictions (Blackouts) ?',
      'modal-deepdive-close': 'Fermer',
      
      
      // Advice Cards
      'In-Market Full Season Montreal Canadiens Setup': 'Configuration pour la saison complète (Région de Montréal)',
      'To receive all Montreal Canadiens games, you need Sportsnet (Saturdays), TSN2 or RDS (regional mid-week), and <span class="font-bold">Amazon Prime</span> for Monday night feeds.': 'Pour regarder tous les matchs des Canadiens, vous avez besoin de Sportsnet (les samedis), TSN2 ou RDS (matchs régionaux en semaine), et <span class="font-bold">Amazon Prime</span> pour les lundis soirs.',
      'Official Out-of-Market Options for Habs Fans:': 'Options officielles hors marché pour les partisans :',
      'Subscribing to TSN or RDS does <strong>not</strong> unlock Montreal Canadiens regional games in Ontario or Western Canada due to NHL blackouts. To watch those 50 regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).': 'S\'abonner à TSN ou RDS <strong>ne débloque pas</strong> les matchs régionaux des Canadiens en Ontario ou dans l\'Ouest canadien à cause des restrictions (blackouts) de la LNH. Pour ces 50 matchs, vous avez besoin de <strong>Sportsnet+ PREMIUM</strong> ou <strong>NHL Centre Ice</strong>.',
      'International & US Montreal Viewing': 'Visionnement aux États-Unis et à l\'International',
      'ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN or TNT follow local US availability rules.': 'ESPN+ diffuse les matchs hors marché de la LNH pour les spectateurs américains. Les matchs nationaux américains sur ESPN ou TNT suivent les règles locales de disponibilité.',

      // Opponents & Terms
      'Ottawa Senators': 'Sénateurs d\'Ottawa',
      'Toronto Maple Leafs': 'Maple Leafs de Toronto',
      'Boston Bruins': 'Bruins de Boston',
      'Vancouver Canucks': 'Canucks de Vancouver',
      'Edmonton Oilers': 'Oilers d\'Edmonton',
      'Winnipeg Jets': 'Jets de Winnipeg',
      'Calgary Flames': 'Flames de Calgary',
      'Preseason': 'Présaison',
      'Split Squad': 'Équipe divisée',
      'Watch on': 'Regardez sur',
      'Requires': 'Nécessite',
      'BLACKED OUT': 'Restriction régionale',
      'BLACKED OUT in Montreal.': 'RESTRICTION à Montréal.',
      'BLACKED OUT outside territory.': 'RESTRICTION (Hors territoire).',
      'No Broadcast Listed': 'Aucune diffusion',
      'No French Broadcast': 'Aucune diffusion en français'
    }
  },
  
  t: function(key) {
    if (this.current === 'en') return key;
    return this.dict['fr'][key] || key;
  },
  
  init: function() {
    const saved = localStorage.getItem('lang');
    if (saved) {
      this.current = saved;
    } else if (navigator.language.startsWith('fr')) {
      this.current = 'fr';
    }
    this.apply();
  },
  
  toggle: function() {
    this.current = this.current === 'en' ? 'fr' : 'en';
    localStorage.setItem('lang', this.current);
    this.apply();
    if (window.renderApp) window.renderApp(); // Re-render dynamic content
  },
  
  apply: function() {
    document.documentElement.lang = this.current;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.innerHTML = this.t(key);
    });
    
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
  }
};
