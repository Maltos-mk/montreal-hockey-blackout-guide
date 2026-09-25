window.evaluateGame = function(g, state) {
  let canEN = false;
  let reasonEN = '';
  let isBlackedOutEN = false;

  let canFR = false;
  let reasonFR = 'No French Broadcast';
  let isBlackedOutFR = false;

  // Toronto region is 'regional_tor'
  if (g.netEN && (g.netEN.includes('Sportsnet') || g.netEN.includes('CBC') || g.netEN.includes('CityTV') || g.netEN.includes('HNIC'))) {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.sn || state.subs.sn_prem) { canEN = true; reasonEN = 'Watch on Sportsnet (National)'; }
      else { reasonEN = 'Requires Sportsnet+'; }
    }
  } else if (g.netEN === 'TSN4') {
    if (state.region === 'in_market') {
      if (state.subs.tsn) { canEN = true; reasonEN = 'Watch on TSN4'; }
      else { reasonEN = 'Requires TSN+'; }
    } else if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      isBlackedOutEN = true;
      if (state.subs.sn_prem) { canEN = true; reasonEN = 'Watch on Sportsnet+ PREMIUM'; isBlackedOutEN = false; }
      else { reasonEN = 'BLACKED OUT outside territory. Requires Sportsnet+ Premium or Centre Ice.'; }
    }
  } else if (g.netEN === 'Sportsnet Ontario') {
    if (state.region === 'in_market') {
      if (state.subs.sn || state.subs.sn_prem) { canEN = true; reasonEN = 'Watch on Sportsnet Ontario'; }
      else { reasonEN = 'Requires Sportsnet+'; }
    } else if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      isBlackedOutEN = true;
      if (state.subs.sn_prem) { canEN = true; reasonEN = 'Watch on Sportsnet+ PREMIUM'; isBlackedOutEN = false; }
      else { reasonEN = 'BLACKED OUT outside territory. Requires Sportsnet+ Premium or Centre Ice.'; }
    }
  } else if (g.netEN === 'Prime') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.prime) { canEN = true; reasonEN = 'Watch on Amazon Prime Video'; }
      else { reasonEN = 'Requires Amazon Prime Video'; }
    }
  } else {
    reasonEN = 'No Broadcast Listed';
  }

  // French (Leafs generally only have TVA Sports nationally, if at all)
  if (g.netFR === 'TVA Sports') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.tva) { canFR = true; reasonFR = 'Watch on TVA Sports'; }
      else { reasonFR = 'Requires TVA Sports'; }
    }
  }

  return { canEN, reasonEN, isBlackedOutEN, canFR, reasonFR, isBlackedOutFR };
};

window.renderAdviceCards = function(state) {
  if (state.region === 'in_market' || state.region === 'in_market') {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">In-Market Full Season Toronto Maple Leafs Setup</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-1">
            To receive all Toronto Maple Leafs games, you need Sportsnet, TSN4, and <a href="https://www.amazon.ca/tryprimefree?tag=maltos-20" target="_blank" rel="noopener noreferrer" class="text-teamPrimary dark:text-blue-400 font-bold underline">Amazon Prime</a> for Monday night feeds.
          </p>
        </div>
      </div>
    `;
  } else if (state.region === 'out_market_canada') {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">Official Out-of-Market Options for Leafs Fans:</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Subscribing to TSN4 or Sportsnet Ontario does <strong>not</strong> unlock Leafs regional games outside of Ontario due to NHL blackouts. To watch those regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).
          </p>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">International & US Leafs Viewing</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-1">
            ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN or TNT follow local US availability rules.
          </p>
        </div>
      </div>
    `;
  }
};
