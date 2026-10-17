function isFr() {
  return typeof document !== 'undefined' &&
    document.documentElement &&
    document.documentElement.lang === 'fr' &&
    typeof window !== 'undefined' &&
    Boolean(window.HB_FR);
}

function tx(str) {
  var args = Array.prototype.slice.call(arguments, 1);
  var tpl = (isFr() && window.HB_FR.strings && window.HB_FR.strings[str]) ? window.HB_FR.strings[str] : str;
  return tpl.replace(/\{(\d+)\}/g, function (m, i) {
    return args[i] === undefined ? m : args[i];
  });
}

function trSummary(reason) {
  if (!reason) return reason;
  if (isFr() && window.HB_FR && typeof window.HB_FR.translateSummary === 'function') {
    return window.HB_FR.translateSummary(reason);
  }
  return reason;
}

function teamFullName(id, fallback) {
  if (isFr() && window.HB_FR && window.HB_FR.teams && window.HB_FR.teams[id]) {
    return window.HB_FR.teams[id][0];
  }
  return fallback || NHL_TEAMS[id] || id;
}

function teamNick(id, fallback) {
  if (isFr() && window.HB_FR && window.HB_FR.teams && window.HB_FR.teams[id]) {
    return window.HB_FR.teams[id][1];
  }
  return fallback || id;
}

function formatGameDate(g) {
  if (!isFr() || !g || !g.iso) return g ? g.date : '';
  try {
    const d = new Date(g.iso);
    return new Intl.DateTimeFormat('fr-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return g.date;
  }
}

function formatLocalTime(isoStr, fallbackTime) {
  if (!isoStr) return fallbackTime + (isFr() ? ' HE' : ' ET');
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat(isFr() ? 'fr-CA' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(d);
  } catch(e) {
    return fallbackTime + (isFr() ? ' HE' : ' ET');
  }
}

// Add Web Share API handler
window.shareApp = async function() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: window.TEAM_DATA ? tx('{0} Broadcast Guide', teamFullName(window.TEAM_DATA.team.id, window.TEAM_DATA.team.name)) : tx('Hockey Broadcast Guide'),
        url: window.location.href,
      });
      // Umami tracking for share
      try { umami.track('share-click'); } catch(e) {}
    } catch (err) {
      console.log('Error sharing', err);
    }
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert(tx("Link copied to clipboard!"));
      try { umami.track('copy-link'); } catch(e) {}
    }).catch(() => {
      alert(tx('Sharing not supported on this browser. Copy the URL from your address bar to share!'));
    });
  }
};

async function initApp() {
  if (!window.TEAM_DATA_URL) {
    console.error('window.TEAM_DATA_URL is not set.');
    return;
  }
  
  try {
    const res = await fetch(window.TEAM_DATA_URL);

    window.TEAM_DATA = await res.json();
    games = window.TEAM_DATA.schedule;
    
    // Correctly initialize default region from hash, localStorage, or team default
    if (window.location.hash && new URLSearchParams(window.location.hash.substring(1)).has('region')) {
      state.region = new URLSearchParams(window.location.hash.substring(1)).get('region');
    } else {
      try {
        const savedRegion = localStorage.getItem('hockeyblackouts_region');
        if (savedRegion) {
          state.region = savedRegion;
        } else {
          state.region = window.TEAM_DATA.team.marketRegion.regionCode;
        }
      } catch(e) {
        state.region = window.TEAM_DATA.team.marketRegion.regionCode;
      }
    }
    const rSel = document.getElementById('regionSelect');
    if (rSel) rSel.value = state.region;

    // Load subscriptions from hash, or fall back to localStorage
    const hashParams = window.location.hash ? new URLSearchParams(window.location.hash.substring(1)) : null;
    const subKeysList = ['sn_cable', 'sn_plus', 'sn_prem', 'centre_ice_fr', 'regional_en', 'prime', 'regional_fr', 'national_fr', 'espn'];
    const hasHashSubs = hashParams && subKeysList.some(k => hashParams.has(k));
    if (hasHashSubs) {
      subKeysList.forEach(k => {
        if (hashParams.has(k)) {
          state.subs[k] = hashParams.get(k) === 'true';
          const cb = document.getElementById(`sub_${k}`);
          if (cb) cb.checked = state.subs[k];
        }
      });
    } else {
      try {
        const savedSubs = localStorage.getItem('hockeyblackouts_subs');
        if (savedSubs) {
          const parsed = JSON.parse(savedSubs);
          if (parsed && typeof parsed === 'object') {
            subKeysList.forEach(k => {
              if (k in parsed) {
                state.subs[k] = Boolean(parsed[k]);
                const cb = document.getElementById(`sub_${k}`);
                if (cb) cb.checked = state.subs[k];
              }
            });
          }
        }
      } catch(e) {}
    }

    
    // Update basic UI elements that might have team name
    document.querySelectorAll('.team-nickname-text').forEach(el => el.textContent = teamNick(window.TEAM_DATA.team.id, window.TEAM_DATA.team.nickname));
    document.querySelectorAll('.team-name-text').forEach(el => el.textContent = teamFullName(window.TEAM_DATA.team.id, window.TEAM_DATA.team.name));
    
    // Auto-display direct install after 3s on mobile
    

    render();
    initKofiMultivariate();
  } catch (err) {
    console.error('Failed to load team data:', err);
  }
}

const KOFI_VARIANTS = {
  control: {
    id: 'control',
    teamCopy: 'Did this save you a headache tonight? Buy me a coffee to help keep it running.',
    teamCta: 'Tip $3',
    teamIcon: 'fa-mug-hot'
  },
  anti_gambling: {
    id: 'anti_gambling',
    teamCopy: 'Zero popups. Zero auto-play video. Zero gambling ads before puck drop. Help keep this site independent.',
    teamCta: 'Buy the Dev a $3 Beer',
    teamIcon: 'fa-shield-halved'
  },
  telecom_spite: {
    id: 'telecom_spite',
    teamCopy: 'Finding the game shouldn’t require a law degree and four streaming packages. Help keep the lights on.',
    teamCta: 'Chip in $3',
    teamIcon: 'fa-tv'
  },
  swear_jar: {
    id: 'swear_jar',
    teamCopy: 'Saved you ten minutes of yelling at your TV remote? Drop $3 in the swear jar to keep this running.',
    teamCta: 'Pay the $3 Fine',
    teamIcon: 'fa-mug-hot'
  }
};

function initKofiMultivariate() {
  const variantKeys = ['control', 'anti_gambling', 'telecom_spite', 'swear_jar'];
  let variantKey = 'control';
  try {
    const saved = localStorage.getItem('hb_kofi_variant');
    if (saved && KOFI_VARIANTS[saved]) {
      variantKey = saved;
    } else {
      variantKey = variantKeys[Math.floor(Math.random() * variantKeys.length)];
      localStorage.setItem('hb_kofi_variant', variantKey);
    }
  } catch (e) {
    variantKey = 'control';
  }

  const v = KOFI_VARIANTS[variantKey] || KOFI_VARIANTS.control;
  const frKofi = (isFr() && window.HB_FR.kofi && window.HB_FR.kofi[v.id]) ? window.HB_FR.kofi[v.id] : null;

  const calloutText = document.getElementById('kofiCalloutText');
  const calloutBtn = document.getElementById('kofiCalloutBtn');
  const calloutBtnText = document.getElementById('kofiCalloutBtnText');
  const calloutIcon = document.getElementById('kofiCalloutIcon');
  if (calloutText && calloutBtn && calloutBtnText) {
    calloutText.textContent = frKofi ? frKofi.copy : v.teamCopy;
    calloutBtnText.textContent = frKofi ? frKofi.cta : v.teamCta;
    calloutBtn.setAttribute('data-umami-event-variant', v.id);
    if (calloutIcon && v.teamIcon) {
      calloutIcon.className = `fa-solid ${v.teamIcon}`;
    }
  }

  const footerBtn = document.getElementById('kofiFooterBtn');
  if (footerBtn) {
    footerBtn.setAttribute('data-umami-event-variant', v.id);
  }

  try {
    if (!sessionStorage.getItem('hb_kofi_imp_' + v.id)) {
      sessionStorage.setItem('hb_kofi_imp_' + v.id, 'true');
      const trackImp = () => {
        if (window.umami && typeof window.umami.track === 'function') {
          window.umami.track('kofi-impression', { variant: v.id });
        }
      };
      if (window.umami) {
        trackImp();
      } else {
        window.addEventListener('load', trackImp, { once: true });
      }
    }
  } catch (e) {}
}

const NHL_TEAMS = {
  'ANA': 'Anaheim Ducks', 'BOS': 'Boston Bruins', 'BUF': 'Buffalo Sabres', 'CAR': 'Carolina Hurricanes',
  'CBJ': 'Columbus Blue Jackets', 'CGY': 'Calgary Flames', 'CHI': 'Chicago Blackhawks', 'COL': 'Colorado Avalanche',
  'DAL': 'Dallas Stars', 'DET': 'Detroit Red Wings', 'EDM': 'Edmonton Oilers', 'FLA': 'Florida Panthers',
  'LAK': 'Los Angeles Kings', 'MIN': 'Minnesota Wild', 'MTL': 'Montreal Canadiens', 'NJD': 'New Jersey Devils',
  'NSH': 'Nashville Predators', 'NYI': 'New York Islanders', 'NYR': 'New York Rangers', 'OTT': 'Ottawa Senators',
  'PHI': 'Philadelphia Flyers', 'PIT': 'Pittsburgh Penguins', 'SJS': 'San Jose Sharks', 'SEA': 'Seattle Kraken',
  'STL': 'St. Louis Blues', 'TBL': 'Tampa Bay Lightning', 'TOR': 'Toronto Maple Leafs', 'UTA': 'Utah Hockey Club',
  'VAN': 'Vancouver Canucks', 'VGK': 'Vegas Golden Knights', 'WSH': 'Washington Capitals', 'WPG': 'Winnipeg Jets'
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

function slugifyCity(cityName) {
  return cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getGameUrl(g) {
  if (!window.TEAM_DATA || !window.TEAM_DATA.team) return '#';
  const currentTeamId = window.TEAM_DATA.team.id;
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

function getFullMatchup(teamName, vsStr, oppCode) {
  const dispTeam = window.TEAM_DATA && window.TEAM_DATA.team ? teamFullName(window.TEAM_DATA.team.id, teamName) : teamName;
  const oppName = teamFullName(oppCode, NHL_TEAMS[oppCode] || oppCode);
  const isAway = vsStr.startsWith('@');
  return isAway ? tx('{0} at {1}', dispTeam, oppName) : tx('{0} vs {1}', dispTeam, oppName);
}

const state = {
      region: window.TEAM_DATA ? window.TEAM_DATA.team.marketRegion.regionCode : 'on_east_qc_atl',
      lang: 'any',
      timeFilter: 'upcoming',
      search: '',
      statusFilter: 'all',
      channelFilter: 'all',
      subs: {
        sn_cable: false,
        sn_plus: false,
        sn_prem: false,
        centre_ice_fr: false,
        regional_en: false,
        prime: false,
        regional_fr: false,
        national_fr: false,
        espn: false
      }
    };

function trackUmamiEvent(name, data) {
  if (typeof umami !== 'undefined' && umami.track) {
    try {
      const enrichedData = Object.assign({}, data, { team: window.TEAM_DATA ? window.TEAM_DATA.team.id : 'unknown' });
      umami.track(name, enrichedData);
    } catch (e) {}
  }
}

function updateHash() {
  const params = new URLSearchParams();
  params.set('region', state.region);
  if (state.timeFilter !== 'upcoming') params.set('timeFilter', state.timeFilter);
  if (state.statusFilter !== 'all') params.set('statusFilter', state.statusFilter);
  if (state.channelFilter !== 'all') params.set('channelFilter', state.channelFilter);
  Object.keys(state.subs).forEach(k => {
    if (state.subs[k]) {
      params.set(k, 'true');
    }
  });
  window.history.replaceState(null, null, '#' + params.toString());
}

function loadStateFromHash() {
  if (window.location.hash) {
    try {
      const params = new URLSearchParams(window.location.hash.substring(1));
      if (params.has('region')) state.region = params.get('region');
      if (params.has('timeFilter')) state.timeFilter = params.get('timeFilter');
      if (params.has('statusFilter')) state.statusFilter = params.get('statusFilter');
      if (params.has('channelFilter')) state.channelFilter = params.get('channelFilter');
      
      const subKeys = ['sn_cable', 'sn_plus', 'sn_prem', 'centre_ice_fr', 'regional_en', 'prime', 'regional_fr', 'national_fr', 'espn'];
      subKeys.forEach(k => {
        if (params.has(k)) state.subs[k] = params.get(k) === 'true';
      });
    } catch(e) {}
  }
}


    
// Universal Blackout Engine

const broadcastZones = {
  'bc': ['VAN'],
  'ab': ['EDM', 'CGY'],
  'sk': ['EDM', 'CGY', 'WPG'],
  'mb': ['WPG'],
  'nw_on': ['TOR', 'WPG'],
  'on_west': ['TOR'],
  'on_east_qc_atl': ['MTL', 'OTT'],
  'on_overlap': ['TOR', 'OTT', 'MTL'],
  'us_intl': []
};

function evaluateGame(g, state) {
  let canEN = false, reasonEN = '', isBlackedOutEN = false;
  let canFR = false, reasonFR = '', isBlackedOutFR = false;
  
  const networks = window.TEAM_DATA ? window.TEAM_DATA.team.networks : {
    regionalEN: 'TSN',
    regionalFR: 'RDS',
    nationalEN: ['Sportsnet', 'Prime Video', 'SN+'],
    nationalFR: ['TVA Sports']
  };

  const primaryTeamId = window.TEAM_DATA ? window.TEAM_DATA.team.id : 'MTL';
  const localTeams = broadcastZones[state.region] || [];
  
  const isPrimaryInMarket = localTeams.includes(primaryTeamId);
  const isOpponentInMarket = g.opp ? localTeams.includes(g.opp) : false;

  // --- English Evaluation ---
  if (g.netEN === 'Prime Video') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.prime) { canEN = true; reasonEN = 'Watch on Amazon Prime Video'; }
      else { reasonEN = 'Requires Amazon Prime Video'; }
    }
  } else if (g.netEN) {
    let matchesNat = g.typeEN === 'national' || g.netEN === 'Prime Video' || g.netEN.includes('CBC') || g.netEN.includes('CityTV');
    let matchesReg = g.typeEN === 'regional';
    
    // Evaluate Regional
    let canReg = false, reasonReg = '';
    if (matchesReg) {
      if (state.region === 'us_intl') {
        if (state.subs.espn) { canReg = true; reasonReg = 'Watch on ESPN+ / NHL.tv'; }
        else { reasonReg = 'Requires ESPN+ / NHL.tv'; }
      } else if (isPrimaryInMarket) {
        if (state.subs.regional_en || ((g.netEN.includes('Sportsnet') || g.netEN.includes('SNW') || g.netEN.includes('SNP')) && (state.subs.sn_cable || state.subs.sn_plus))) { canReg = true; reasonReg = `Watch on ${g.netEN}`; }
        else { reasonReg = `Requires ${g.netEN}`; }
      } else if (isOpponentInMarket) {
        if (state.subs.regional_en || state.subs.sn_cable || state.subs.sn_plus || state.subs.sn_prem) {
          canReg = true; reasonReg = "Watch on local opponent feed";
        } else {
          reasonReg = "Requires Sportsnet/TSN for opponent feed";
        }
      } else {
        isBlackedOutEN = true;
        if (state.subs.sn_prem) { canReg = true; reasonReg = 'Watch on Sportsnet+ PREMIUM (or Centre Ice)'; isBlackedOutEN = false; }
        else { reasonReg = 'BLACKED OUT outside territory. Requires Sportsnet (Cable or Stream) Premium or Centre Ice.'; }
      }
    }

    // Evaluate National
    let canNat = false, reasonNat = '';
    if (matchesNat) {
      if (state.region === 'us_intl') {
        if (state.subs.espn) { canNat = true; reasonNat = 'Watch on ESPN+ / NHL.tv'; }
        else { reasonNat = 'Requires ESPN+ / NHL.tv'; }
      } else if (g.netEN === 'SN+') {
        if (state.subs.sn_plus || state.subs.sn_prem) { canNat = true; reasonNat = 'Watch on SN+'; }
        else { reasonNat = 'Requires Sportsnet+ (Streaming)'; }
      } else {
        if (state.subs.sn_cable || state.subs.sn_plus || state.subs.sn_prem) { canNat = true; reasonNat = 'Watch on Sportsnet'; }
        else { reasonNat = 'Requires Sportsnet (Cable or Stream)'; }
      }
    }

    // Combine logic (if it has both, user gets access if EITHER succeeds)
    if (matchesNat && matchesReg) {
      canEN = canNat || canReg;
      reasonEN = canEN ? (canReg ? reasonReg : reasonNat) : reasonNat; 
    } else if (matchesNat) {
      canEN = canNat; reasonEN = reasonNat;
    } else if (matchesReg) {
      canEN = canReg; reasonEN = reasonReg;
    }
  } else if (false) {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else if (isPrimaryInMarket) {
      if (state.subs.regional_en || ((g.netEN.includes('Sportsnet') || g.netEN.includes('SNW') || g.netEN.includes('SNP')) && (state.subs.sn_cable || state.subs.sn_plus))) { canEN = true; reasonEN = `Watch on ${g.netEN}`; }
      else { reasonEN = `Requires ${g.netEN}`; }
    } else if (isOpponentInMarket) {
      if (state.subs.regional_en || state.subs.sn_cable || state.subs.sn_plus) {
        canEN = true; 
        reasonEN = "Watch on local opponent feed (Sportsnet/TSN)";
      } else {
        reasonEN = "Requires Sportsnet/TSN for opponent feed";
      }
    } else {
      isBlackedOutEN = true;
      if (state.subs.sn_prem) { canEN = true; reasonEN = 'Watch on Sportsnet+ PREMIUM (or Centre Ice)'; isBlackedOutEN = false; }
      else { reasonEN = 'BLACKED OUT outside territory. Requires Sportsnet (Cable or Stream) Premium or Centre Ice.'; }
    }
  } else {
    reasonEN = 'No English Broadcast';
  }

  // --- French Evaluation ---
  if (g.netFR === 'Prime Video') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.prime) { canFR = true; reasonFR = 'Watch on Amazon Prime Video'; }
      else { reasonFR = 'Requires Amazon Prime Video'; }
    }
  } else if (g.netFR && networks.nationalFR && networks.nationalFR.some(n => g.netFR.includes(n))) {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.national_fr) { canFR = true; reasonFR = `Watch on ${g.netFR}`; }
      else { reasonFR = `Requires ${g.netFR}`; }
    }
  } else if (g.netFR && networks.regionalFR && g.netFR.includes(networks.regionalFR)) {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = 'Requires ESPN+ / NHL.tv'; }
    } else if (isPrimaryInMarket) {
      if (state.subs.regional_fr) { canFR = true; reasonFR = `Watch on ${g.netFR}`; }
      else { reasonFR = `Requires ${g.netFR}`; }
    } else if (isOpponentInMarket) {
      if (state.subs.regional_fr || state.subs.national_fr) {
        canFR = true; reasonFR = "Watch on local opponent feed";
      } else {
        reasonFR = "Requires French channel for opponent feed";
      }
    } else {
      isBlackedOutFR = true;
      if (state.subs.centre_ice_fr) { canFR = true; reasonFR = 'Watch on NHL Centre Ice'; isBlackedOutFR = false; }
      else { reasonFR = 'BLACKED OUT outside territory. Requires NHL Centre Ice.'; }
    }
  } else {
    reasonFR = 'No French Broadcast';
  }

  const bothBlackedOut = (isBlackedOutEN && isBlackedOutFR) || (isBlackedOutEN && !g.netFR) || (isBlackedOutFR && !g.netEN);
  const anyWatchable = canEN || canFR;
  const watchableEN = canEN;
  const watchableFR = canFR;

  let summaryStatus = '';
  let summaryReason = '';
  
  if (anyWatchable) {
    summaryStatus = 'watchable';
    if (canEN && canFR) summaryReason = 'Available in English & French';
    else if (canEN) summaryReason = reasonEN;
    else if (canFR) summaryReason = reasonFR;
  } else if (bothBlackedOut) {
    summaryStatus = 'blacked_out';
    summaryReason = reasonEN;
  } else {
    summaryStatus = 'missing_sub';
    summaryReason = (!canEN && g.netEN) ? reasonEN : reasonFR;
  }

  let displayNetEN = g.netEN;
  let displayNetFR = g.netFR;
  if (canEN && isOpponentInMarket && g.netEN && networks.regionalEN && g.netEN.includes(networks.regionalEN)) {
      let opponentNets = g.netEN.split(',').map(s => s.trim()).filter(s => s !== networks.regionalEN);
      if (opponentNets.length > 0) {
          displayNetEN = opponentNets.join(', ');
          reasonEN = `Watch on local opponent feed (${displayNetEN})`;
          if (summaryStatus === 'watchable' && summaryReason === 'Watch on local opponent feed (Sportsnet/TSN)') {
              summaryReason = reasonEN;
          }
      }
  }
  return { canEN, reasonEN, isBlackedOutEN, canFR, reasonFR, isBlackedOutFR, summaryStatus, summaryReason, displayNetEN, displayNetFR };
}

function renderAdviceCards(state) {
  const team = window.TEAM_DATA ? window.TEAM_DATA.team : { name: 'Your Team' };
  const localTeams = broadcastZones[state.region] || [];
  if (localTeams.includes(team.id)) {
    return `
      <div class="space-y-4">
        <div>
          <h3 class="font-bold text-slate-900 dark:text-white">${tx('In-Market Full Season Setup')}</h3>
          <p class="text-slate-600 dark:text-slate-300 mt-1">
            ${tx('To receive all {0} games locally, you generally need Sportsnet (Saturdays), your local regional channel, and Amazon Prime.', window.TEAM_DATA ? teamFullName(window.TEAM_DATA.team.id, window.TEAM_DATA.team.name) : 'Team')}
          </p>
        </div>
      </div>
    `;
  } else if (state.region !== 'us_intl') {
    return `
      <div class="space-y-4">
        <div>
          <h3 class="font-bold text-slate-900 dark:text-white">${tx('Official Out-of-Market Options')}</h3>
          <p class="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            ${tx('Subscribing to a regional channel from another province does <strong>not</strong> bypass NHL blackouts. To watch out-of-market regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).')}
          </p>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="space-y-4">
        <div>
          <h3 class="font-bold text-slate-900 dark:text-white">${tx('International & US Viewing')}</h3>
          <p class="text-slate-600 dark:text-slate-300 mt-1">
            ${tx('ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN, TNT, or simulcast on NHL Network follow local US availability rules and will be blacked out on ESPN+.')}
          </p>
        </div>
      </div>
    `;
  }
}


    let games = [];

    

    
function syncRegionalCheckbox() {
  const regCb = document.getElementById('sub_regional_en');
  const regText = regCb ? regCb.nextElementSibling.querySelector('p.text-sm') : null;
  if (!regCb || !window.TEAM_DATA) return;
  
  const primaryTeamId = window.TEAM_DATA.team.id;
  const localTeams = broadcastZones[state.region] || [];
  const isPrimaryInMarket = localTeams.includes(primaryTeamId);
  const isSnRegional = window.TEAM_DATA.team.networks.regionalEN.includes('Sportsnet');
  
  if (isPrimaryInMarket && isSnRegional) {
    if (state.subs.sn_cable || state.subs.sn_plus) {
      regCb.checked = true;
      state.subs.regional_en = true;
      regCb.disabled = true;
      if (regText) {
        if (!regText.dataset.orig) regText.dataset.orig = regText.innerText;
        regText.innerText = regText.dataset.orig + tx(" (Included)");
        regText.classList.add('text-emerald-600');
      }
    } else {
      regCb.disabled = false;
      if (regText && regText.dataset.orig) {
        regText.innerText = regText.dataset.orig;
        regText.classList.remove('text-emerald-600');
      }
    }
  } else {
    regCb.disabled = false;
    if (regText && regText.dataset.orig) {
      regText.innerText = regText.dataset.orig;
      regText.classList.remove('text-emerald-600');
    }
  }
}

function render() {
  syncRegionalCheckbox();
      const getVs = (vs, opp) => {
        let clean = vs.replace('vs ', '').replace('@ ', '').replace(' (Split Squad)', '');
        let prefix = vs.startsWith('vs ') ? 'vs ' : '@ ';
        let suffix = vs.includes('Split Squad') ? ' (' + tx('Split Squad') + ')' : '';
        let name = (isFr() && opp) ? teamNick(opp, clean) : tx(clean);
        return prefix + name + suffix;
      };
      updateHash();
      const now = new Date();
      const threeHoursThirtyMs = 3.5 * 60 * 60 * 1000;

      const gamesWithTime = games.map(g => {
        const gameDate = new Date(g.iso);
        const diff = now.getTime() - gameDate.getTime();
        const isPast = diff > threeHoursThirtyMs;
        const isToday = now.toDateString() === gameDate.toDateString();
        const isLiveOrImminent = Math.abs(diff) < threeHoursThirtyMs;
        return { ...g, gameDate, isPast, isToday, isLiveOrImminent };
      });

      const nextGame = gamesWithTime.find(g => !g.isPast) || gamesWithTime[gamesWithTime.length - 1];

      const spotlightEl = document.getElementById('nextGameSpotlight');
      if (nextGame) {
        const rawNextRes = evaluateGame(nextGame, state);
        let nextStatus = 'missing_sub';
        let nextSummaryReason = '';

        if (state.lang === 'en') {
          if (rawNextRes.canEN) { nextStatus = 'watchable'; nextSummaryReason = rawNextRes.reasonEN; }
          else if (rawNextRes.isBlackedOutEN) { nextStatus = 'blacked_out'; nextSummaryReason = rawNextRes.reasonEN; }
          else { nextStatus = 'missing_sub'; nextSummaryReason = rawNextRes.reasonEN; }
        } else if (state.lang === 'fr') {
          if (rawNextRes.canFR) { nextStatus = 'watchable'; nextSummaryReason = rawNextRes.reasonFR; }
          else if (rawNextRes.isBlackedOutFR) { nextStatus = 'blacked_out'; nextSummaryReason = rawNextRes.reasonFR; }
          else { nextStatus = 'missing_sub'; nextSummaryReason = rawNextRes.reasonFR; }
        } else {
          if (rawNextRes.canEN || rawNextRes.canFR) {
            nextStatus = 'watchable';
            nextSummaryReason = rawNextRes.canEN ? rawNextRes.reasonEN : rawNextRes.reasonFR;
          } else if (rawNextRes.isBlackedOutEN && rawNextRes.isBlackedOutFR) {
            nextStatus = 'blacked_out';
            nextSummaryReason = 'Regional feeds blacked out in your territory. Requires Premium sub.';
          } else if (rawNextRes.isBlackedOutEN) {
            nextStatus = 'blacked_out';
            nextSummaryReason = rawNextRes.reasonEN;
          } else if (rawNextRes.isBlackedOutFR) {
            nextStatus = 'blacked_out';
            nextSummaryReason = rawNextRes.reasonFR;
          } else {
            nextStatus = 'missing_sub';
            if (rawNextRes.reasonFR === 'No French Broadcast') nextSummaryReason = rawNextRes.reasonEN;
            else if (rawNextRes.reasonEN === 'No English Broadcast') nextSummaryReason = rawNextRes.reasonFR;
            else nextSummaryReason = rawNextRes.reasonEN + ' / ' + rawNextRes.reasonFR;
          }
        }
        const nextEval = Object.assign({}, rawNextRes, { status: nextStatus, summaryReason: nextSummaryReason });
        let badgeHtml = '';
        if (nextEval.status === 'watchable') {
          badgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> ' + tx('Watchable On Your Setup') + '</span>';
        } else if (nextEval.status === 'blacked_out') {
          badgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-ban"></i> ' + tx('Regionally Blacked Out') + '</span>';
        } else {
          badgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-700 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-lock"></i> ' + tx('Subscription Needed') + '</span>';
        }

        const isGameToday = nextGame.isToday;
        const upcomingGamesList = gamesWithTime.filter(g => !g.isPast);
        const upcoming3 = upcomingGamesList.slice(0, 3);
        const upcomingStripHtml = upcoming3.length > 1 ? `
          <div class="mt-4 pt-4 border-t border-white/10">
            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <i class="fa-solid fa-calendar-days text-rose-400"></i>
              <span>${tx('Upcoming Schedule Snapshot:')}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              ${upcoming3.map(ug => `
                <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div class="font-bold text-white text-sm flex items-center gap-1.5">
                      <span class="text-rose-400 font-teko text-base">#${games.findIndex(orig => orig.id === ug.id) + 1}</span>
                      <a href="${getGameUrl(ug)}" class="hover:underline hover:text-rose-400">${getVs(ug.vs, ug.opp)}</a>
                    </div>
                    <div class="text-[11px] text-slate-300 mt-0.5">${formatGameDate(ug)} • ${formatLocalTime(ug.iso, ug.time)}</div>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 text-white border border-white/10">${ug.netEN || 'Sportsnet'}</span>
                    <a href="${getGameUrl(ug)}" class="block text-[10px] text-rose-400 font-semibold hover:underline mt-1">${tx('Breakdown &rarr;')}</a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '';

        spotlightEl.innerHTML = `
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teamSecondary via-slate-900 to-teamDark p-5 sm:p-6 text-white shadow-md border border-slate-700/50">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${isGameToday ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-white/20 text-white'}">
                    ${isGameToday ? tx('★ Game Today') : tx('Next {0} Game', teamNick(window.TEAM_DATA.team.id, window.TEAM_DATA.team.nickname))}
                  </span>
                  <span class="text-xs text-slate-300 font-medium">${formatGameDate(nextGame)} • ${formatLocalTime(nextGame.iso, nextGame.time)}</span>
                  <span class="text-xs text-slate-400 font-teko text-sm tracking-wide">${tx('Game {0} of {1}', games.findIndex(orig => orig.id === nextGame.id) + 1, games.length)}</span>
                </div>
                
                <h3 class="text-xl sm:text-2xl font-black font-teko uppercase tracking-wide flex items-center gap-2">
                  <span>${getVs(nextGame.vs, nextGame.opp)}</span>
                  ${nextGame.note ? `<span class="text-xs font-sans font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">${tx(nextGame.note)}</span>` : ''}
                </h3>
                
                <p class="text-xs text-slate-300 flex items-center gap-2">
                  <i class="fa-solid fa-location-dot text-slate-400"></i> ${nextGame.venue}
                </p>
              </div>

              <div class="flex flex-col md:items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-300 font-medium">${tx('Broadcast:')}</span>
                  <span class="px-2 py-0.5 rounded text-xs font-bold bg-white text-teamSecondary shadow-sm">${nextGame.netEN}</span>
                  <span class="px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white">${nextGame.netFR}</span>
                </div>
                
                <div>${badgeHtml}</div>
                
                <div class="text-[11px] text-slate-300 md:text-right max-w-sm">
                  ${trSummary(nextEval.summaryReason)}
                </div>

                <a href="${getGameUrl(nextGame)}" class="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition">
                  <span>${tx('View Blackout Breakdown &rarr;')}</span>
                </a>
              </div>

            </div>
            ${upcomingStripHtml}
          </div>
        `;
      }

      let watchableCount = 0;
      let blackedOutCount = 0;
      let missingSubCount = 0;

      games.forEach((g, index) => {
        // Evaluate safely if not cached
        let evalRes = g._cachedEvalRes;
        if (!evalRes) {
          const rawRes = evaluateGame(g, state);
          let status = 'missing_sub';
          if (state.lang === 'en') {
            if (rawRes.canEN) status = 'watchable';
            else if (rawRes.isBlackedOutEN) status = 'blacked_out';
          } else if (state.lang === 'fr') {
            if (rawRes.canFR) status = 'watchable';
            else if (rawRes.isBlackedOutFR) status = 'blacked_out';
          } else {
            if (rawRes.canEN || rawRes.canFR) status = 'watchable';
            else if (rawRes.isBlackedOutEN && rawRes.isBlackedOutFR) status = 'blacked_out';
            else if (rawRes.isBlackedOutEN || rawRes.isBlackedOutFR) status = 'blacked_out';
          }
          evalRes = { status };
        }
        
        if (evalRes.status === 'watchable') watchableCount++;
        else if (evalRes.status === 'blacked_out') blackedOutCount++;
        else missingSubCount++;
      });

      const total = games.length;
      const pct = Math.round((watchableCount / total) * 100) || 0;

      document.getElementById('watchableCount').textContent = watchableCount;
      document.getElementById('totalGameLabel').textContent = tx('/ {0} GAMES', total);
      document.getElementById('pctBadge').textContent = tx('{0}% Watchable', pct);
      document.getElementById('kpiSeasonTitle').textContent = tx('Full Season Coverage ({0} Games)', total);

      document.getElementById('watchableBreakdown').textContent = tx('{0} games ({1}%)', watchableCount, pct);
      document.getElementById('blackoutBreakdown').textContent = tx('{0} games ({1}%)', blackedOutCount, Math.round((blackedOutCount/total)*100)||0);
      document.getElementById('missingBreakdown').textContent = tx('{0} games ({1}%)', missingSubCount, Math.round((missingSubCount/total)*100)||0);

      document.getElementById('watchBar').style.width = `${pct}%`;
      document.getElementById('blackoutBar').style.width = `${(blackedOutCount/total)*100}%`;
      document.getElementById('missingBar').style.width = `${(missingSubCount/total)*100}%`;

      const tbody = document.getElementById('scheduleTableBody');
      const mobileContainer = document.getElementById('scheduleCardsMobile');
      let newTbodyHtml = '';
      let newMobileHtml = '';

      let displayedCount = 0;

      const filteredGames = gamesWithTime.filter(g => {
        if (state.timeFilter === 'upcoming' && g.isPast) return false;
        if (state.timeFilter === 'past' && !g.isPast) return false;

        const rawRes = evaluateGame(g, state);
        let status = 'missing_sub';
        let summaryReason = '';

        if (state.lang === 'en') {
          if (rawRes.canEN) { status = 'watchable'; summaryReason = rawRes.reasonEN; }
          else if (rawRes.isBlackedOutEN) { status = 'blacked_out'; summaryReason = rawRes.reasonEN; }
          else { status = 'missing_sub'; summaryReason = rawRes.reasonEN; }
        } else if (state.lang === 'fr') {
          if (rawRes.canFR) { status = 'watchable'; summaryReason = rawRes.reasonFR; }
          else if (rawRes.isBlackedOutFR) { status = 'blacked_out'; summaryReason = rawRes.reasonFR; }
          else { status = 'missing_sub'; summaryReason = rawRes.reasonFR; }
        } else {
          if (rawRes.canEN || rawRes.canFR) {
            status = 'watchable';
            summaryReason = rawRes.canEN ? rawRes.reasonEN : rawRes.reasonFR;
          } else if (rawRes.isBlackedOutEN && rawRes.isBlackedOutFR) {
            status = 'blacked_out';
            summaryReason = 'Regional feeds blacked out in your territory. Requires Premium sub.';
          } else if (rawRes.isBlackedOutEN) {
            status = 'blacked_out';
            summaryReason = rawRes.reasonEN;
          } else if (rawRes.isBlackedOutFR) {
            status = 'blacked_out';
            summaryReason = rawRes.reasonFR;
          } else {
            status = 'missing_sub';
            if (rawRes.reasonFR === 'No French Broadcast') summaryReason = rawRes.reasonEN;
            else if (rawRes.reasonEN === 'No English Broadcast') summaryReason = rawRes.reasonFR;
            else summaryReason = rawRes.reasonEN + ' / ' + rawRes.reasonFR;
          }
        }
        const evalRes = Object.assign({}, rawRes, { status, summaryReason });

        if (state.statusFilter !== 'all' && evalRes.status !== state.statusFilter) return false;

        if (state.channelFilter !== 'all') {
          const matchChan = (g.netEN && g.netEN.includes(state.channelFilter)) || (g.netFR && g.netFR.includes(state.channelFilter));
          if (!matchChan) return false;
        }

        if (state.search) {
          const s = state.search.toLowerCase();
          const matchSearch = g.vs.toLowerCase().includes(s) || g.venue.toLowerCase().includes(s) || (g.note && g.note.toLowerCase().includes(s));
          if (!matchSearch) return false;
        }

        return true;
      });

      filteredGames.forEach(g => {
        displayedCount++;
        const rawRes = evaluateGame(g, state);
        let status = 'missing_sub';
        let summaryReason = '';

        if (state.lang === 'en') {
          if (rawRes.canEN) { status = 'watchable'; summaryReason = rawRes.reasonEN; }
          else if (rawRes.isBlackedOutEN) { status = 'blacked_out'; summaryReason = rawRes.reasonEN; }
          else { status = 'missing_sub'; summaryReason = rawRes.reasonEN; }
        } else if (state.lang === 'fr') {
          if (rawRes.canFR) { status = 'watchable'; summaryReason = rawRes.reasonFR; }
          else if (rawRes.isBlackedOutFR) { status = 'blacked_out'; summaryReason = rawRes.reasonFR; }
          else { status = 'missing_sub'; summaryReason = rawRes.reasonFR; }
        } else {
          if (rawRes.canEN || rawRes.canFR) {
            status = 'watchable';
            summaryReason = rawRes.canEN ? rawRes.reasonEN : rawRes.reasonFR;
          } else if (rawRes.isBlackedOutEN && rawRes.isBlackedOutFR) {
            status = 'blacked_out';
            summaryReason = 'Regional feeds blacked out in your territory. Requires Premium sub.';
          } else if (rawRes.isBlackedOutEN) {
            status = 'blacked_out';
            summaryReason = rawRes.reasonEN;
          } else if (rawRes.isBlackedOutFR) {
            status = 'blacked_out';
            summaryReason = rawRes.reasonFR;
          } else {
            status = 'missing_sub';
            if (rawRes.reasonFR === 'No French Broadcast') summaryReason = rawRes.reasonEN;
            else if (rawRes.reasonEN === 'No English Broadcast') summaryReason = rawRes.reasonFR;
            else summaryReason = rawRes.reasonEN + ' / ' + rawRes.reasonFR;
          }
        }
        const evalRes = Object.assign({}, rawRes, { status, summaryReason });

        let badge = '';
        if (g.isPast) {
          badge = '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap"><i class="fa-solid fa-clock-rotate-left mr-1 text-[10px]"></i>' + tx('Final') + '</span>';
        } else if (evalRes.status === 'watchable') {
          badge = '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap"><i class="fa-solid fa-check mr-1 text-[10px]"></i>' + tx('Watchable') + '</span>';
        } else if (evalRes.status === 'blacked_out') {
          badge = '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 whitespace-nowrap"><i class="fa-solid fa-ban mr-1 text-[10px]"></i>' + tx('Blacked Out') + '</span>';
        } else {
          badge = '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap"><i class="fa-solid fa-lock mr-1 text-[10px]"></i>' + tx('Need Sub') + '</span>';
        }

        const card = document.createElement('div');
        card.className = `p-3 rounded-xl border border-slate-200 dark:border-slate-800 ${g.isPast ? 'bg-slate-100/60 dark:bg-slate-900/40 opacity-75' : 'bg-slate-50 dark:bg-slate-800/60'}`;
        card.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-teko text-base font-bold text-slate-600 dark:text-slate-300">#${games.findIndex(orig => orig.id === g.id) + 1}</span>
                <a href="${getGameUrl(g)}" class="font-bold text-sm text-slate-900 dark:text-white hover:text-[#AF1E2D] dark:hover:text-rose-400 hover:underline flex items-center gap-1">
                  <span>${getVs(g.vs, g.opp)}</span>
                  <i class="fa-solid fa-chevron-right text-[8px] text-slate-500"></i>
                </a>
              </div>
              <div class="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-tight mt-0.5 truncate">${getFullMatchup(window.TEAM_DATA.team.name, g.vs, g.opp)}</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-300">${formatGameDate(g)} • ${formatLocalTime(g.iso, g.time)}</div>
            </div>
            ${badge}
          </div>

          <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <div class="flex items-center gap-1">
              <span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${evalRes.displayNetEN || g.netEN}</span>
              ${g.netFR && g.netFR !== 'None' ? `<span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${g.netFR}</span>` : ''}
            </div>
            <a href="${getGameUrl(g)}" class="text-[11px] font-semibold text-[#AF1E2D] dark:text-rose-400 hover:underline flex items-center gap-1">
              <span>${tx('TV & Blackout Breakdown &rarr;')}</span>
            </a>
          </div>

          <div class="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mt-1">
            ${trSummary(evalRes.summaryReason)}
          </div>
        `;
        newMobileHtml += card.outerHTML;

        const tr = document.createElement('tr');
        tr.className = `hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800/60 ${g.isPast ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/20' : ''}`;
        tr.innerHTML = `
          <td class="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 font-teko text-base text-center">${games.findIndex(orig => orig.id === g.id) + 1}</td>
          <td class="py-3 px-4 whitespace-nowrap">
            <div class="font-semibold text-slate-800 dark:text-slate-200">${formatGameDate(g)}</div>
            <div class="text-[11px] text-slate-600 dark:text-slate-300">${formatLocalTime(g.iso, g.time)}</div>
          </td>
          <td class="py-3 px-4">
            <div class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <a href="${getGameUrl(g)}" class="hover:text-[#AF1E2D] dark:hover:text-rose-400 hover:underline transition flex items-center gap-1.5" title="${tx('View TV broadcast and blackout breakdown')}">
                <span>${getVs(g.vs, g.opp)}</span>
                <i class="fa-solid fa-chevron-right text-[9px] text-slate-500 opacity-75"></i>
              </a>
              ${g.phase === 'preseason' ? `<span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">${tx('Preseason')}</span>` : ''}
              ${g.note ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-teamPrimary/10 text-teamPrimary">${g.note ? tx(g.note) : ""}</span>` : ''}
            </div>
            <div class="text-[11px] text-slate-600 dark:text-slate-300">${g.venue}</div>
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center space-x-1.5">
              <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${evalRes.displayNetEN || g.netEN}</span>
              <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${evalRes.displayNetFR || g.netFR}</span>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="text-[11px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
              ${g.typeEN === 'national' ? tx('National (Coast-to-Coast)') : g.typeEN === 'prime_wednesday' ? tx('Prime Wednesday Exclusive') : tx('Regional Territory')}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <div>${badge}</div>
            <div class="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
              ${trSummary(evalRes.summaryReason)}
            </div>
          </td>
        `;
        newTbodyHtml += tr.outerHTML;
      });

      tbody.innerHTML = newTbodyHtml;
      mobileContainer.innerHTML = newMobileHtml;

      document.getElementById('renderedCountLabel').textContent = 
        state.timeFilter === 'upcoming' ? tx('Showing the {0}-game {1} TV broadcast schedule', displayedCount, teamFullName(window.TEAM_DATA.team.id, window.TEAM_DATA.team.name)) :
        state.timeFilter === 'past' ? tx('Showing {0} completed games', displayedCount) : tx('Showing {0} total games', displayedCount);

            const adviceCard = document.getElementById('adviceCard');

      if (window.renderAdviceCards) {
          adviceCard.innerHTML = window.renderAdviceCards(state);
      }
    }

    function enableBarTransitions() {
      ['watchBar', 'blackoutBar', 'missingBar'].forEach(id => {
        const bar = document.getElementById(id);
        if (bar && !bar.classList.contains('transition-all')) {
          bar.classList.add('transition-all', 'duration-300');
        }
      });
    }

    const regionSelect = document.getElementById('regionSelect');
    if (regionSelect) {
      regionSelect.value = state.region;
      regionSelect.addEventListener('change', (e) => {
        enableBarTransitions();
        state.region = e.target.value;
        try { localStorage.setItem('hockeyblackouts_region', state.region); } catch(err) {}
        render();
      });
    }
    ['sn_cable', 'sn_plus', 'sn_prem', 'centre_ice_fr', 'regional_en', 'prime', 'regional_fr', 'national_fr', 'espn'].forEach(key => {
        const el = document.getElementById(`sub_${key}`);
        if (el) {
          el.checked = state.subs[key];
          el.addEventListener('change', () => {
            enableBarTransitions();
            state.subs[key] = el.checked;
            try { localStorage.setItem('hockeyblackouts_subs', JSON.stringify(state.subs)); } catch(err) {}
            render();
          });
        }
      });

    ['upcoming', 'past', 'all'].forEach(f => {
        const b = document.getElementById(`time_${f}`);
        if (b && state.timeFilter === f) {
          b.className = "px-3 py-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-bold transition";
        }
      });
      ['en', 'fr', 'any'].forEach(l => {
        const b = document.getElementById(`lang_${l}`);
        if (b && state.lang === l) {
          b.className = "px-3 py-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm text-teamPrimary font-bold transition";
        }
      });
      
      function setLang(lang) {
      state.lang = lang;
      ['en', 'fr', 'any'].forEach(l => {
        const b = document.getElementById(`lang_${l}`);
        if (l === lang) {
          b.className = "px-3 py-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm text-teamPrimary font-bold transition";
        } else {
          b.className = "px-3 py-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-white transition";
        }
      });
      render();
    }

    function setTimeFilter(filter) {
      state.timeFilter = filter;
      // tracking removed
      ['upcoming', 'all', 'past'].forEach(f => {
        const b = document.getElementById(`time_${f}`);
        if (f === filter) {
          b.className = "px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-teamPrimary font-bold transition";
        } else {
          b.className = "px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition";
        }
      });
      render();
    }

    document.getElementById('statusFilter').addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
      // tracking removed
      render();
    });

    document.getElementById('channelFilter').addEventListener('change', (e) => {
      state.channelFilter = e.target.value;
      // tracking removed
      render();
    });

    document.getElementById('opponentSearch').addEventListener('input', (e) => {
      state.search = e.target.value;
      render();
    });

    

    function openDeepDiveModal() {
      const m = document.getElementById('deepDiveModal');
      m.classList.remove('hidden');
      m.classList.add('flex');
    }
    function closeDeepDiveModal() {
      const m = document.getElementById('deepDiveModal');
      m.classList.add('hidden');
      m.classList.remove('flex');
    }

    // ==============================================================
    // DIRECT "GLOBAL NEWS" STYLE ADD TO HOME SCREEN MODAL ENGINE
    // ==============================================================
    let deferredPrompt = null;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    function openDirectInstallModal() {
      const modal = document.getElementById('directInstallModal');
      const body = document.getElementById('directInstallBody');
      if (!modal || !body) return;

      if (isIOS) {
        body.innerHTML = `
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">1</span>
              <span>${tx('Tap the <strong class="text-blue-500 font-semibold"><i class="fa-solid fa-arrow-up-from-bracket"></i> Share icon</strong> at the bottom of Safari.')}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">2</span>
              <span>${tx('Scroll down & select <strong class="text-slate-900 dark:text-white font-semibold">"Add to Home Screen" <i class="fa-regular fa-square-plus ml-1"></i></strong>')}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">3</span>
              <span>${tx('Tap <strong class="text-amber-500 font-semibold">"Add"</strong> in the top right.')}</span>
            </div>
          </div>
        `;
      } else if (deferredPrompt) {
        body.innerHTML = `
          <p class="text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">${tx('Install directly to your device for instant launch and offline access.')}</p>
          <button onclick="triggerDirectInstall()" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow transition flex items-center justify-center gap-2">
            <i class="fa-solid fa-download"></i>
            <span>${tx('Install Now')}</span>
          </button>
        `;
      } else {
        body.innerHTML = `
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">1</span>
              <span>${tx('Tap the browser menu <strong class="text-slate-900 dark:text-white font-semibold">(three dots <i class="fa-solid fa-ellipsis-vertical"></i>)</strong>.')}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">2</span>
              <span>${tx('Select <strong class="text-slate-900 dark:text-white font-semibold">"Install App"</strong> or <strong class="text-slate-900 dark:text-white font-semibold">"Add to Home screen"</strong>.')}</span>
            </div>
          </div>
        `;
      }

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    async function triggerDirectInstall() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('pwa_prompt_dismissed', 'installed');
        }
        deferredPrompt = null;
        dismissDirectInstallModal(false);
      }
    }

    function dismissDirectInstallModal(neverShowAgain = false) {
      const modal = document.getElementById('directInstallModal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      if (neverShowAgain) {
        localStorage.setItem('pwa_prompt_dismissed', 'permanent');
      } else {
        // Remind again after 14 days
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
      }
    }

    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa_prompt_dismissed', 'installed');
      dismissDirectInstallModal(false);
    });

    // Auto-display modal once after 3 seconds on mobile devices only

    setTimeout(() => {
      const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
      if (isMobile && !isStandalone) {
        const dismissed = localStorage.getItem('pwa_prompt_dismissed');
        if (!dismissed) {
          openDirectInstallModal();
        } else if (dismissed !== 'permanent' && dismissed !== 'installed') {
          const dismissedTime = parseInt(dismissed, 10);
          if (Date.now() - dismissedTime > 7 * 24 * 60 * 60 * 1000) {
            openDirectInstallModal();
          }
        }
      }
    }, 3000);

    

    initApp();

// Manual fallback for Umami events (sometimes data-umami-event fails on outbound links)
function bindUmamiEvents() {
  document.querySelectorAll('[data-umami-event]').forEach(el => {
    // Avoid double-binding
    if (el.dataset.umamiBound) return;
    el.dataset.umamiBound = 'true';
    el.addEventListener('click', () => {
      const eventName = el.getAttribute('data-umami-event');
      if (window.umami) {
        try { umami.track(eventName); } catch(e) {}
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindUmamiEvents);
} else {
  bindUmamiEvents();
}






// --- PDF Export Logic ---
window.exportPDF = function() {
  const btn = document.getElementById('btnExportPDF');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span class="hidden sm:inline">' + tx('Generating...') + '</span>';
  btn.disabled = true;

  const ensureLogoAndBuild = () => {
    if (typeof window.PDF_LOGO_B64 === 'undefined') {
      const appScript = document.querySelector('script[src*="shared/app.js"]');
      const logoSrc = appScript ? appScript.src.replace(/app\.js.*$/, 'pdf-logo.js') : '../shared/pdf-logo.js';
      const logoScript = document.createElement('script');
      logoScript.src = logoSrc;
      logoScript.onload = () => buildAndDownloadPDF(btn, originalText);
      logoScript.onerror = () => buildAndDownloadPDF(btn, originalText);
      document.head.appendChild(logoScript);
    } else {
      buildAndDownloadPDF(btn, originalText);
    }
  };

  // We need to load jsPDF and AutoTable sequentially
  if (typeof window.jspdf === 'undefined') {
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
      script2.onload = () => ensureLogoAndBuild();
      document.head.appendChild(script2);
    };
    document.head.appendChild(script1);
  } else {
    ensureLogoAndBuild();
  }
};

function buildAndDownloadPDF(btn, originalText) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'pt', 'letter');
  
  const teamName = window.TEAM_DATA ? teamFullName(window.TEAM_DATA.team.id, window.TEAM_DATA.team.name) : 'Team';

  // 1. Branding Header
  const logoB64 = window.PDF_LOGO_B64;
  
  // addImage(imageData, format, x, y, width, height)
  // Letter size is 612 x 792 pt
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(tx('{0} - 2026-27 TV Schedule', teamName), 40, 50);

  // URL
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246); // blue-500
  const cleanUrl = window.location.origin + window.location.pathname.replace('index.html', '');
  doc.text(cleanUrl, 40, 68);

  // Logo (Right aligned)
  if (logoB64) {
    const logoHeight = 45;
    const logoWidth = 45; // 1:1 aspect ratio
    doc.addImage(logoB64, 'JPEG', pageWidth - logoWidth - 40, 35, logoWidth, logoHeight);
  }

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(2);
  doc.line(40, 85, pageWidth - 40, 85);

  // 2. Subtitle / Context
  const regionSelect = document.getElementById('regionSelect');
  const regionText = regionSelect.options[regionSelect.selectedIndex].text;
  
  const subLabels = [];
  document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    let name = cb.nextElementSibling.querySelector('p:first-child').textContent;
    subLabels.push(name.trim());
  });

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // slate-600
  const contextStr = tx('Configured Region: {0}  |  Active Subscriptions: {1}', regionText, subLabels.length > 0 ? subLabels.join(', ') : tx('None'));
  const contextLines = doc.splitTextToSize(contextStr, pageWidth - 80);
  doc.text(contextLines, 40, 105);
  
  const dynamicStartY = 105 + (contextLines.length * 14);

  // 3. Table Data
  const head = [[tx('Date & Time'), tx('Matchup'), tx('Network'), tx('Access Status')]];
  const body = [];

  const sourceRows = document.getElementById('scheduleTableBody').querySelectorAll('tr');
  sourceRows.forEach((row) => {
    if (row.style.display === 'none' || row.classList.contains('hidden')) return;

    const cells = row.querySelectorAll('td');
    if(cells.length >= 6) {
      body.push([
        cells[1].innerText.replace(/\n/g, ' '),
        cells[2].innerText.replace(/\n/g, ' '),
        cells[3].innerText.replace(/\n/g, ' '),
        cells[5].innerText.replace(/\n/g, ' - ')
      ]);
    }
  });

  // 4. AutoTable
  doc.autoTable({
    startY: dynamicStartY,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', lineWidth: 0.5, lineColor: [203, 213, 225] },
    bodyStyles: { textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 40, right: 40, bottom: 40, left: 40 },
    didParseCell: function (data) {
      // Colorize the Access Status column
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw.includes(tx('Watchable'))) {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else if (data.cell.raw.includes(tx('Blacked Out'))) {
          data.cell.styles.textColor = [220, 38, 38]; // red-600
        } else if (data.cell.raw.includes(tx('Out-of-Market'))) {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        }
      }
    }
  });

  // 5. Save
  doc.save(tx('{0}_Schedule.pdf', teamName.replace(/\s+/g, '_')));

  // Reset button
  btn.innerHTML = originalText;
  btn.disabled = false;
}
// --- Node.js Exports for Testing ---
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { evaluateGame, broadcastZones, tx, trSummary };
}


window.toggleTheme = function() {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }
};
