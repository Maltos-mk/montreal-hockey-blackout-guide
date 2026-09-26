window.evaluateGame = function(g, state) {
  let canEN = false;
  let reasonEN = window.i18n ? window.i18n.t('') : '';
  let isBlackedOutEN = false;

  let canFR = false;
  let reasonFR = window.i18n ? window.i18n.t('') : '';
  let isBlackedOutFR = false;

  // --- English Evaluation ---
  if (g.netEN && (g.netEN.includes('Sportsnet') || g.netEN.includes('HNIC'))) {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = window.i18n ? window.i18n.t('Watch on ESPN+ / NHL.tv') : 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = window.i18n ? window.i18n.t('Requires ESPN+ / NHL.tv') : 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.sn || state.subs.sn_prem) { canEN = true; reasonEN = window.i18n ? window.i18n.t('Watch on Sportsnet (National)') : 'Watch on Sportsnet (National)'; }
      else { reasonEN = window.i18n ? window.i18n.t('Requires Sportsnet+') : 'Requires Sportsnet+'; }
    }
  } else if (g.netEN && g.netEN.includes('TSN')) {
    if (state.region === 'in_market') {
      if (state.subs.tsn) { canEN = true; reasonEN = window.i18n ? window.i18n.t('Watch on TSN2') : 'Watch on TSN2'; }
      else { reasonEN = window.i18n ? window.i18n.t('Requires TSN+') : 'Requires TSN+'; }
    } else if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = window.i18n ? window.i18n.t('Watch on ESPN+ / NHL.tv') : 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = window.i18n ? window.i18n.t('Requires ESPN+ / NHL.tv') : 'Requires ESPN+ / NHL.tv'; }
    } else {
      isBlackedOutEN = true;
      if (state.subs.sn_prem) { canEN = true; reasonEN = window.i18n ? window.i18n.t('Watch on Sportsnet+ PREMIUM') : 'Watch on Sportsnet+ PREMIUM'; isBlackedOutEN = false; }
      else { reasonEN = window.i18n ? window.i18n.t('BLACKED OUT outside territory. Requires Sportsnet+ Premium or Centre Ice.') : 'BLACKED OUT outside territory. Requires Sportsnet+ Premium or Centre Ice.'; }
    }
  } else if (g.netEN === 'Prime Video') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canEN = true; reasonEN = window.i18n ? window.i18n.t('Watch on ESPN+ / NHL.tv') : 'Watch on ESPN+ / NHL.tv'; }
      else { reasonEN = window.i18n ? window.i18n.t('Requires ESPN+ / NHL.tv') : 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.prime) { canEN = true; reasonEN = window.i18n ? window.i18n.t('Watch on Amazon Prime Video') : 'Watch on Amazon Prime Video'; }
      else { reasonEN = window.i18n ? window.i18n.t('Requires Amazon Prime Video') : 'Requires Amazon Prime Video'; }
    }
  } else {
    reasonEN = window.i18n ? window.i18n.t('No English Broadcast') : 'No English Broadcast';
  }

  // --- French Evaluation ---
  if (g.netFR && g.netFR.includes('RDS')) {
    if (state.region === 'in_market') {
      if (state.subs.rds) { canFR = true; reasonFR = window.i18n ? `${window.i18n.t('Watch on')} ${g.netFR}` : `Watch on ${g.netFR}`; }
      else { reasonFR = window.i18n ? window.i18n.t('Requires RDS') : 'Requires RDS'; }
    } else if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = window.i18n ? window.i18n.t('Watch on ESPN+ / NHL.tv') : 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = window.i18n ? window.i18n.t('Requires ESPN+ / NHL.tv') : 'Requires ESPN+ / NHL.tv'; }
    } else {
      isBlackedOutFR = true;
      if (state.subs.sn_prem) { canFR = true; reasonFR = window.i18n ? window.i18n.t('Watch on Sportsnet+ PREMIUM (French)') : 'Watch on Sportsnet+ PREMIUM (French)'; isBlackedOutFR = false; }
      else { reasonFR = window.i18n ? window.i18n.t('BLACKED OUT outside territory. Requires Sportsnet+ Premium or Centre Ice.') : 'BLACKED OUT outside territory. Requires Sportsnet+ Premium or Centre Ice.'; }
    }
  } else if (g.netFR === 'TVA Sports') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = window.i18n ? window.i18n.t('Watch on ESPN+ / NHL.tv') : 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = window.i18n ? window.i18n.t('Requires ESPN+ / NHL.tv') : 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.tva) { canFR = true; reasonFR = window.i18n ? window.i18n.t('Watch on TVA Sports') : 'Watch on TVA Sports'; }
      else { reasonFR = window.i18n ? window.i18n.t('Requires TVA Sports') : 'Requires TVA Sports'; }
    }
  } else if (g.netFR === 'Prime Video') {
    if (state.region === 'us_intl') {
      if (state.subs.espn) { canFR = true; reasonFR = window.i18n ? window.i18n.t('Watch on ESPN+ / NHL.tv') : 'Watch on ESPN+ / NHL.tv'; }
      else { reasonFR = window.i18n ? window.i18n.t('Requires ESPN+ / NHL.tv') : 'Requires ESPN+ / NHL.tv'; }
    } else {
      if (state.subs.prime) { canFR = true; reasonFR = window.i18n ? window.i18n.t('Watch on Amazon Prime Video') : 'Watch on Amazon Prime Video'; }
      else { reasonFR = window.i18n ? window.i18n.t('Requires Amazon Prime Video') : 'Requires Amazon Prime Video'; }
    }
  } else {
    reasonFR = window.i18n ? window.i18n.t('No French Broadcast') : 'No French Broadcast';
  }

  return { canEN, reasonEN, isBlackedOutEN, canFR, reasonFR, isBlackedOutFR };
};

window.renderAdviceCards = function(state) {
  if (state.region === 'in_market' || state.region === 'in_market') {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">${window.i18n ? window.i18n.t('In-Market Full Season Montreal Canadiens Setup') : 'In-Market Full Season Montreal Canadiens Setup'}</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-1">
            ${window.i18n ? window.i18n.t('To receive all Montreal Canadiens games, you need Sportsnet (Saturdays), TSN2 or RDS (regional mid-week), and <span class="font-bold">Amazon Prime</span> for Monday night feeds.') : 'To receive all Montreal Canadiens games, you need Sportsnet (Saturdays), TSN2 or RDS (regional mid-week), and <span class="font-bold">Amazon Prime</span> for Monday night feeds.'}
          </p>
        </div>
      </div>
    `;
  } else if (state.region === 'out_market_canada') {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">${window.i18n ? window.i18n.t('Official Out-of-Market Options for Habs Fans:') : 'Official Out-of-Market Options for Habs Fans:'}</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            ${window.i18n ? window.i18n.t('Subscribing to TSN or RDS does <strong>not</strong> unlock Montreal Canadiens regional games in Ontario or Western Canada due to NHL blackouts. To watch those 50 regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).') : 'Subscribing to TSN or RDS does <strong>not</strong> unlock Montreal Canadiens regional games in Ontario or Western Canada due to NHL blackouts. To watch those 50 regional games, you need <strong>Sportsnet+ Premium</strong> (streaming) or <strong>NHL Centre Ice</strong> (cable).'}
          </p>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">${window.i18n ? window.i18n.t('International & US Montreal Viewing') : 'International & US Montreal Viewing'}</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-1">
            ${window.i18n ? window.i18n.t('ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN or TNT follow local US availability rules.') : 'ESPN+ carries out-of-market NHL games for US viewers. National US broadcasts on ESPN or TNT follow local US availability rules.'}
          </p>
        </div>
      </div>
    `;
  }
};
