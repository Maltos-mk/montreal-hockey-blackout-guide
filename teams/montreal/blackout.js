window.evaluateGame = function(g, state) {
  let canEN = false;
  let reasonEN = '';
  let isBlackedOutEN = false;

  let canFR = false;
  let reasonFR = '';
  let isBlackedOutFR = false;

  // --- English Evaluation ---
  if (g.netEN === 'Sportsnet') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.sn || state.subs.sn_prem) { canEN = true; reasonEN = 'Watch on Sportsnet (National)'; }
      else { reasonEN = 'Requires Sportsnet+'; }
    }
  } else if (g.netEN && g.netEN.includes('TSN')) {
    if (state.region === 'in_market') {
      if (state.subs.tsn) { canEN = true; reasonEN = 'Watch on TSN2'; }
      else { reasonEN = 'Requires TSN+'; }
    } else if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      isBlackedOutEN = true;
      if (state.subs.sn_prem) { canEN = true; reasonEN = 'Watch on Sportsnet+ PREMIUM'; isBlackedOutEN = false; }
      else { reasonEN = 'BLACKOUT (Out of Market)'; }
    }
  } else if (g.netEN === 'CBC' || g.netEN === 'CityTV' || g.netEN.includes('HNIC')) {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      canEN = true;
      reasonEN = `Watch on ${g.netEN} (Free) or Sportsnet+`;
    }
  } else if (g.netEN === 'Prime Video') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.prime) { canEN = true; reasonEN = 'Watch on Amazon Prime Video'; }
      else { reasonEN = 'Requires Amazon Prime Video'; }
    }
  } else {
    reasonEN = 'No English Broadcast';
  }

  // --- French Evaluation ---
  if (g.netFR === 'RDS') {
    if (state.region === 'in_market') {
      if (state.subs.rds) { canFR = true; reasonFR = 'Watch on RDS'; }
      else { reasonFR = 'Requires RDS'; }
    } else if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = 'Requires ESPN+ / NHL.tv'; }
    } else {
      isBlackedOutFR = true;
      if (state.subs.sn_prem) { canFR = true; reasonFR = 'Watch on Sportsnet+ PREMIUM (French)'; isBlackedOutFR = false; }
      else { reasonFR = 'BLACKOUT (Out of Market)'; }
    }
  } else if (g.netFR === 'TVA Sports') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.tva) { canFR = true; reasonFR = 'Watch on TVA Sports'; }
      else { reasonFR = 'Requires TVA Sports'; }
    }
  } else if (g.netFR === 'Prime Video') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.prime) { canFR = true; reasonFR = 'Watch on Amazon Prime Video'; }
      else { reasonFR = 'Requires Amazon Prime Video'; }
    }
  } else {
    reasonFR = 'No French Broadcast';
  }

  return { canEN, reasonEN, isBlackedOutEN, canFR, reasonFR, isBlackedOutFR };
};

window.renderAdviceCards = function(state) {
  if (state.region === 'in_market' || state.region === 'in_market') {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">In-Market Full Season Montreal Canadiens Setup</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-1">
            To receive all Montreal Canadiens games, you need Sportsnet (Saturdays), TSN2 or RDS (regional mid-week), and <a href="https://www.amazon.ca/tryprimefree?tag=maltos-20" target="_blank" rel="noopener noreferrer" class="text-teamPrimary dark:text-red-400 font-bold underline">Amazon Prime</a> for Monday night feeds.
          </p>
        </div>
      </div>
    `;
  } else if (state.region === 'out_market_canada') {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">Official Out-of-Market Options for Habs Fans:</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Subscribing to TSN or RDS does <strong>not</strong> unlock Montreal Canadiens regional games in Ontario or Western Canada due to NHL blackouts. To watch those 50 regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).
          </p>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">International & US Habs Viewing</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-1">
            ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN or TNT follow local US availability rules.
          </p>
        </div>
      </div>
    `;
  }
};
