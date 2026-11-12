(function() {
  var state = {
    zip: '',
    timeFilter: 'upcoming',
    statusFilter: 'all',
    channelFilter: 'all',
    search: '',
    subs: {
      us_rsn: false,
      espn_plus: false,
      espn_abc: false,
      tnt_max: false,
      nhl_network: false
    }
  };
  var teamData = null;
  var subKeys = ['us_rsn', 'espn_plus', 'espn_abc', 'tnt_max', 'nhl_network'];

  function isZipInTeamTerritory(zipStr, teamAbbrev) {
    if (!zipStr || zipStr.length < 3) return false;
    var prefix = parseInt(zipStr.substring(0, 3), 10);
    if (isNaN(prefix)) return false;
    var tInfo = window.US_TERRITORIES && window.US_TERRITORIES[teamAbbrev];
    if (!tInfo || !tInfo.zipRanges) return false;
    for (var i = 0; i < tInfo.zipRanges.length; i++) {
      var r = tInfo.zipRanges[i];
      if (prefix >= r[0] && prefix <= r[1]) return true;
    }
    return false;
  }

  function getLocalTeamsForZip(zipStr) {
    if (!zipStr || zipStr.length < 3 || !window.US_TERRITORIES) return [];
    var matches = [];
    for (var abbrev in window.US_TERRITORIES) {
      if (isZipInTeamTerritory(zipStr, abbrev)) {
        matches.push(window.US_TERRITORIES[abbrev]);
      }
    }
    return matches;
  }

  function evaluateUsGame(g) {
    var team = teamData.team;
    var hasValidZip = /^\d{5}$/.test(state.zip);
    var hasUsTerritory = Array.isArray(team.zipRanges) && team.zipRanges.length > 0;
    var isPrimaryInMarket = hasUsTerritory ? (hasValidZip ? isZipInTeamTerritory(state.zip, team.id) : true) : false;
    var isOpponentInMarket = hasValidZip && g.opp ? isZipInTeamTerritory(state.zip, g.opp) : false;
    var oppInfo = (g.opp && window.US_TERRITORIES && window.US_TERRITORIES[g.opp]) ? window.US_TERRITORIES[g.opp] : null;
    var rsnLabel = g.rsn || team.rsn;
    var netUSNat = g.netUSNat || (g.typeUS === 'national' ? g.primaryNet : (g.typeUS === 'nhl_network' ? 'NHLN' : null));

    // 1. National Exclusive (ESPN, ABC, TNT)
    if (g.typeUS === 'national' || (netUSNat && netUSNat !== 'NHLN')) {
      if (netUSNat === 'ABC' || g.primaryNet === 'ABC') {
        if (state.subs.espn_abc) return { status: 'watchable', reason: 'Watch on ABC' };
        if (state.subs.espn_plus) return { status: 'watchable', reason: 'Watch on ESPN+ (ABC Simulcast)' };
        return { status: 'missing_sub', reason: 'Requires ABC or ESPN+' };
      }
      if (netUSNat === 'TNT' || g.primaryNet === 'TNT') {
        if (state.subs.tnt_max) return { status: 'watchable', reason: 'Watch on TNT / HBO Max' };
        if (state.subs.espn_plus || state.subs.us_rsn) {
          return { status: 'blacked_out', reason: 'BLACKED OUT on ESPN+ & ' + team.rsn + ' (National TNT Exclusive). Requires TNT or Max.' };
        }
        return { status: 'missing_sub', reason: 'Requires TNT or HBO Max (National Exclusive)' };
      }
      // ESPN Linear
      if (state.subs.espn_abc) return { status: 'watchable', reason: 'Watch on ESPN' };
      if (g.espnPlus && state.subs.espn_plus) return { status: 'watchable', reason: 'Watch on ESPN+ (Simulcast)' };
      if (state.subs.espn_plus || state.subs.us_rsn) {
        return { status: 'blacked_out', reason: 'BLACKED OUT on ESPN+ & ' + team.rsn + ' (National ESPN Exclusive). Requires ESPN.' };
      }
      return { status: 'missing_sub', reason: 'Requires ESPN (Linear TV or Live Stream)' };
    }

    // 2. NHL Network Showcase (Local RSN in-market, NHL Network out-of-market)
    if (g.typeUS === 'nhl_network' || netUSNat === 'NHLN') {
      if (isPrimaryInMarket) {
        if (state.subs.us_rsn) return { status: 'watchable', reason: 'Watch on ' + rsnLabel + ' (In-Market)' };
        if (state.subs.nhl_network) return { status: 'watchable', reason: 'Watch on NHL Network' };
        if (state.subs.espn_plus) {
          return { status: 'blacked_out', reason: 'BLACKED OUT on ESPN+ in-market. Requires ' + rsnLabel + '.' };
        }
        return { status: 'missing_sub', reason: 'Requires ' + rsnLabel + ' (or NHL Network)' };
      } else {
        if (state.subs.nhl_network) return { status: 'watchable', reason: 'Watch on NHL Network' };
        if (isOpponentInMarket && state.subs.us_rsn && oppInfo) {
          return { status: 'watchable', reason: 'Watch on local opponent feed (' + oppInfo.rsn + ')' };
        }
        if (state.subs.espn_plus) {
          return { status: 'blacked_out', reason: 'BLACKED OUT on ESPN+ (NHL Network Exclusive). Requires NHL Network.' };
        }
        return { status: 'missing_sub', reason: 'Requires NHL Network (Blacked out on ESPN+)' };
      }
    }

    // 3. Standard Regional Game (Local RSN in-market, ESPN+ out-of-market)
    if (isPrimaryInMarket) {
      if (state.subs.us_rsn) {
        return { status: 'watchable', reason: 'Watch on ' + rsnLabel + ' (In-Market)' };
      }
      if (state.subs.espn_plus) {
        return {
          status: 'blacked_out',
          reason: 'BLACKED OUT on ESPN+ in ' + (hasValidZip ? 'ZIP ' + state.zip : 'home territory') + '. Requires ' + rsnLabel + '.'
        };
      }
      return { status: 'missing_sub', reason: 'Requires ' + rsnLabel + ' (In-market regional broadcast)' };
    }

    if (isOpponentInMarket && oppInfo) {
      if (state.subs.us_rsn) {
        return { status: 'watchable', reason: 'Watch on local opponent feed (' + oppInfo.rsn + ')' };
      }
      return {
        status: 'blacked_out',
        reason: 'BLACKED OUT on ESPN+ in ZIP ' + state.zip + ' (Local ' + oppInfo.name + ' market). Requires ' + oppInfo.rsn + '.'
      };
    }

    // Out-of-Market US Viewer
    if (state.subs.espn_plus) {
      return { status: 'watchable', reason: 'Watch on ESPN+ (Out-of-Market Stream)' };
    }
    if (state.subs.us_rsn) {
      return {
        status: 'blacked_out',
        reason: 'BLACKED OUT outside ' + team.nickname + ' territory' + (hasValidZip ? ' (ZIP ' + state.zip + ')' : '') + '. Requires ESPN+.'
      };
    }
    return { status: 'missing_sub', reason: 'Requires ESPN+ (Out-of-Market Stream)' };
  }

  function renderZipStatusAndAdvice() {
    if (!teamData || !teamData.team) return;
    var team = teamData.team;
    var zipStatusEl = document.getElementById('zipLookupStatus');
    var adviceEl = document.getElementById('adviceCard');
    var hasValidZip = /^\d{5}$/.test(state.zip);
    var hasUsTerritory = Array.isArray(team.zipRanges) && team.zipRanges.length > 0;
    var isPrimaryInMarket = hasUsTerritory ? (hasValidZip ? isZipInTeamTerritory(state.zip, team.id) : true) : false;
    var localTeams = hasValidZip ? getLocalTeamsForZip(state.zip) : [];

    if (zipStatusEl) {
      if (!hasUsTerritory && !hasValidZip) {
        zipStatusEl.className = 'text-xs text-emerald-900 dark:text-emerald-200 mt-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/60';
        zipStatusEl.innerHTML = '📍 <strong>Out-of-Market Across the US:</strong> As a Canadian NHL franchise, the ' + team.name + ' have no local US RSN blackout territory. Regional games stream live on <strong>ESPN+</strong> nationwide (enter your 5-digit US ZIP code above to check for local US opponent RSN blackouts).';
      } else if (!hasValidZip) {
        zipStatusEl.className = 'text-xs text-slate-600 dark:text-slate-300 mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80';
        zipStatusEl.innerHTML = '📍 <strong>Default View: In-Market (' + (team.territoryDescription || team.city) + ')</strong>. Enter any 5-digit US ZIP code above to switch between in-market RSN (<strong>' + team.rsn + '</strong>) and out-of-market (<strong>ESPN+</strong>) blackout rules.';
      } else if (isPrimaryInMarket) {
        zipStatusEl.className = 'text-xs text-amber-900 dark:text-amber-200 mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/60';
        zipStatusEl.innerHTML = '<i class="fa-solid fa-house-signal mr-1 text-amber-600 dark:text-amber-400"></i> <strong>ZIP ' + state.zip + ' is IN-MARKET for the ' + team.name + '.</strong> Regional games are <strong>blacked out on ESPN+</strong> in your ZIP code and require <strong>' + team.rsn + '</strong>.';
      } else {
        var overlapText = localTeams.length > 0
          ? ' Note: ZIP ' + state.zip + ' is inside the local territory for <strong>' + localTeams.map(function(t) { return t.name + ' (' + t.rsn + ')'; }).join(', ') + '</strong>, so matchups against them will be blacked out on ESPN+.'
          : ' No local NHL RSN claims ZIP ' + state.zip + ', so zero opponent regional blackouts apply!';
        zipStatusEl.className = 'text-xs text-emerald-900 dark:text-emerald-200 mt-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/60';
        zipStatusEl.innerHTML = '<i class="fa-solid fa-circle-check mr-1 text-emerald-600 dark:text-emerald-400"></i> <strong>ZIP ' + state.zip + ' is OUT-OF-MARKET for the ' + team.name + '.</strong> Regional ' + team.nickname + ' games stream live on <strong>ESPN+</strong>!' + overlapText;
      }
    }

    if (adviceEl) {
      if (isPrimaryInMarket) {
        adviceEl.innerHTML = '<div class="space-y-4"><div><h3 class="font-bold text-slate-900 dark:text-white">In-Market Full Season Setup' + (hasValidZip ? ' (ZIP ' + state.zip + ')' : '') + '</h3><p class="text-slate-600 dark:text-slate-300 mt-1">Because you are inside the <strong>' + team.name + '</strong> local broadcast territory, ESPN+ blacks out regional games. Check <strong>My Local RSN (' + team.rsn + ')</strong> plus ESPN/TNT above to unlock the full 84-game schedule.</p></div></div>';
      } else {
        adviceEl.innerHTML = '<div class="space-y-4"><div><h3 class="font-bold text-slate-900 dark:text-white">Out-of-Market US Setup' + (hasValidZip ? ' (ZIP ' + state.zip + ')' : '') + '</h3><p class="text-slate-600 dark:text-slate-300 mt-1">Because you are outside the ' + team.name + ' home market in the US, check <strong>ESPN+</strong> to unlock out-of-market regional games, plus ESPN, TNT, and NHL Network for national broadcasts.</p></div></div>';
      }
    }
  }

  function renderAll() {
    if (!teamData || !teamData.schedule) return;
    renderZipStatusAndAdvice();

    var now = Date.now();
    var cutoff = 3.5 * 60 * 60 * 1000;
    var schedule = teamData.schedule;
    var total = schedule.length || 84;

    var watchableCount = 0;
    var blackedOutCount = 0;
    var missingSubCount = 0;

    var evaluatedGames = schedule.map(function(g, idx) {
      var gTime = new Date(g.iso).getTime();
      var isPast = (now - gTime) > cutoff;
      var isToday = new Date(now).toDateString() === new Date(g.iso).toDateString();
      var ev = evaluateUsGame(g);
      if (ev.status === 'watchable') watchableCount++;
      else if (ev.status === 'blacked_out') blackedOutCount++;
      else missingSubCount++;
      return Object.assign({}, g, {
        gameNum: idx + 1,
        isPast: isPast,
        isToday: isToday,
        evalStatus: ev.status,
        evalReason: ev.reason
      });
    });

    // Update Score Box KPIs
    var pct = Math.round((watchableCount / total) * 100) || 0;
    var boPct = Math.round((blackedOutCount / total) * 100) || 0;
    var missPct = Math.round((missingSubCount / total) * 100) || 0;

    var wCountEl = document.getElementById('watchableCount');
    var totalLabelEl = document.getElementById('totalGameLabel');
    var pctBadgeEl = document.getElementById('pctBadge');
    var wBreakEl = document.getElementById('watchableBreakdown');
    var bBreakEl = document.getElementById('blackoutBreakdown');
    var mBreakEl = document.getElementById('missingBreakdown');
    var wBarEl = document.getElementById('watchBar');
    var bBarEl = document.getElementById('blackoutBar');
    var mBarEl = document.getElementById('missingBar');

    if (wCountEl) wCountEl.textContent = watchableCount;
    if (totalLabelEl) totalLabelEl.textContent = '/ ' + total + ' GAMES';
    if (pctBadgeEl) pctBadgeEl.textContent = pct + '% Watchable';
    if (wBreakEl) wBreakEl.textContent = watchableCount + ' games (' + pct + '%)';
    if (bBreakEl) bBreakEl.textContent = blackedOutCount + ' games (' + boPct + '%)';
    if (mBreakEl) mBreakEl.textContent = missingSubCount + ' games (' + missPct + '%)';
    if (wBarEl) wBarEl.style.width = pct + '%';
    if (bBarEl) bBarEl.style.width = boPct + '%';
    if (mBarEl) mBarEl.style.width = missPct + '%';

    // Update Next Game Spotlight Hero
    var upcomingList = evaluatedGames.filter(function(g) { return !g.isPast; });
    var nextGame = upcomingList[0] || evaluatedGames[evaluatedGames.length - 1];
    var spotlightEl = document.getElementById('nextGameSpotlight');
    if (spotlightEl && nextGame) {
      var nextBadgeHtml = '';
      if (nextGame.evalStatus === 'watchable') {
        nextBadgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> Watchable On Your Setup</span>';
      } else if (nextGame.evalStatus === 'blacked_out') {
        nextBadgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-ban"></i> Regionally Blacked Out</span>';
      } else {
        nextBadgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-700 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-lock"></i> Subscription Needed</span>';
      }

      var upcoming3 = upcomingList.slice(0, 3);
      var stripHtml = upcoming3.length > 1 ? (
        '<div class="mt-4 pt-4 border-t border-white/10">' +
          '<div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">' +
            '<i class="fa-solid fa-calendar-days text-rose-400"></i>' +
            '<span>Upcoming Schedule Snapshot:</span>' +
          '</div>' +
          '<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">' +
            upcoming3.map(function(ug) {
              return '<div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">' +
                '<div>' +
                  '<div class="font-bold text-white text-sm flex items-center gap-1.5">' +
                    '<span class="text-rose-400 font-teko text-base">#' + ug.gameNum + '</span>' +
                    '<span>' + ug.vs + '</span>' +
                  '</div>' +
                  '<div class="text-[11px] text-slate-300 mt-0.5">' + ug.date + ' • ' + ug.time + ' ET</div>' +
                '</div>' +
                '<div class="text-right shrink-0">' +
                  '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 text-white border border-white/10">' + ug.primaryNet + '</span>' +
                  (ug.secondaryNet ? '<span class="block text-[10px] text-emerald-300 font-semibold mt-1">' + ug.secondaryNet + '</span>' : '') +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>'
      ) : '';

      spotlightEl.innerHTML =
        '<div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teamSecondary via-slate-900 to-teamDark p-5 sm:p-6 text-white shadow-md border border-slate-700/50" data-spotlight="prerendered">' +
          '<div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">' +
            '<div class="space-y-1.5">' +
              '<div class="flex items-center gap-2">' +
                '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ' + (nextGame.isToday ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-white/20 text-white') + '">' +
                  (nextGame.isToday ? '★ Game Today' : 'Next ' + teamData.team.nickname + ' Game') +
                '</span>' +
                '<span class="text-xs text-slate-300 font-medium">' + nextGame.date + ' • ' + nextGame.time + ' ET</span>' +
                '<span class="text-xs text-slate-400 font-teko text-sm tracking-wide">Game ' + nextGame.gameNum + ' of ' + total + '</span>' +
              '</div>' +
              '<h3 class="text-xl sm:text-2xl font-black font-teko uppercase tracking-wide flex items-center gap-2">' +
                '<span>' + nextGame.vs + '</span>' +
              '</h3>' +
              '<p class="text-xs text-slate-300 flex items-center gap-2">' +
                '<i class="fa-solid fa-location-dot text-slate-400"></i> ' + nextGame.venue +
              '</p>' +
            '</div>' +
            '<div class="flex flex-col md:items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10">' +
              '<div class="flex items-center gap-2">' +
                '<span class="text-xs text-slate-300 font-medium">Broadcast:</span>' +
                '<span class="px-2 py-0.5 rounded text-xs font-bold bg-white text-teamSecondary shadow-sm">' + nextGame.primaryNet + '</span>' +
                (nextGame.secondaryNet ? '<span class="px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white">' + nextGame.secondaryNet + '</span>' : '') +
              '</div>' +
              '<div>' + nextBadgeHtml + '</div>' +
              '<div class="text-[11px] text-slate-300 md:text-right max-w-sm">' +
                nextGame.evalReason +
              '</div>' +
            '</div>' +
          '</div>' +
          stripHtml +
        '</div>';
    }

    // Filter & Render Table + Mobile Cards
    var tbody = document.getElementById('scheduleTableBody');
    var mobile = document.getElementById('scheduleCardsMobile');
    var countLabel = document.getElementById('renderedCountLabel');
    if (!tbody || !mobile) return;

    var rowsHtml = '';
    var cardsHtml = '';
    var shown = 0;

    evaluatedGames.forEach(function(g) {
      if (state.timeFilter === 'upcoming' && g.isPast) return;
      if (state.timeFilter === 'past' && !g.isPast) return;

      if (state.statusFilter !== 'all' && g.evalStatus !== state.statusFilter) return;

      if (state.channelFilter !== 'all') {
        var nets = (g.primaryNet || '') + ' ' + (g.secondaryNet || '') + ' ' + (g.rsn || '');
        if (nets.toLowerCase().indexOf(state.channelFilter.toLowerCase()) === -1) return;
      }

      if (state.search) {
        var hay = (g.vs + ' ' + g.fullMatchup + ' ' + g.venue + ' ' + g.date).toLowerCase();
        if (hay.indexOf(state.search) === -1) return;
      }

      shown++;
      var badgeHtml = '';
      if (g.isPast) {
        badgeHtml = '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap"><i class="fa-solid fa-clock-rotate-left mr-1 text-[10px]"></i>Final</span>';
      } else if (g.evalStatus === 'watchable') {
        badgeHtml = '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap"><i class="fa-solid fa-check mr-1 text-[10px]"></i>Watchable</span>';
      } else if (g.evalStatus === 'blacked_out') {
        badgeHtml = '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 whitespace-nowrap"><i class="fa-solid fa-ban mr-1 text-[10px]"></i>Blacked Out</span>';
      } else {
        badgeHtml = '<span class="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap"><i class="fa-solid fa-lock mr-1 text-[10px]"></i>Need Sub</span>';
      }

      rowsHtml += '<tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800/60 ' + (g.isPast ? 'opacity-60' : '') + '">' +
        '<td class="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 font-teko text-base text-center">' + g.gameNum + '</td>' +
        '<td class="py-3 px-4 whitespace-nowrap"><div class="font-semibold text-slate-800 dark:text-slate-200">' + g.date + '</div><div class="text-[11px] text-slate-600 dark:text-slate-300">' + g.time + ' ET</div></td>' +
        '<td class="py-3 px-4"><div class="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><span>' + g.vs + '</span></div><div class="text-[11px] text-slate-600 dark:text-slate-300">' + g.venue + '</div></td>' +
        '<td class="py-3 px-4"><div class="flex items-center flex-wrap gap-1.5"><span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">' + g.primaryNet + '</span>' + (g.secondaryNet ? '<span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">' + g.secondaryNet + '</span>' : '') + '</div></td>' +
        '<td class="py-3 px-4"><span class="text-[11px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">' + g.coverageLabel + '</span></td>' +
        '<td class="py-3 px-4 text-right"><div>' + badgeHtml + '</div><div class="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">' + g.evalReason + '</div></td>' +
      '</tr>';

      cardsHtml += '<div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 ' + (g.isPast ? 'bg-slate-100/60 dark:bg-slate-900/40 opacity-75' : 'bg-slate-50 dark:bg-slate-800/60') + '">' +
        '<div class="flex items-start justify-between gap-2"><div><div class="flex items-center gap-1.5 flex-wrap"><span class="font-teko text-base font-bold text-slate-600 dark:text-slate-300">#' + g.gameNum + '</span><span class="font-bold text-sm text-slate-900 dark:text-white">' + g.vs + '</span></div><div class="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-tight mt-0.5 truncate">' + g.fullMatchup + ' • ' + g.venue + '</div><div class="text-[11px] text-slate-600 dark:text-slate-300">' + g.date + ' • ' + g.time + ' ET</div></div>' + badgeHtml + '</div>' +
        '<div class="flex items-center justify-between text-xs pt-1 mt-1 border-t border-slate-200/60 dark:border-slate-700/60"><div class="flex items-center gap-1 flex-wrap"><span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">' + g.primaryNet + '</span>' + (g.secondaryNet ? '<span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">' + g.secondaryNet + '</span>' : '') + '</div><span class="text-[11px] font-semibold text-[#AF1E2D] dark:text-rose-400">' + g.coverageLabel + '</span></div>' +
        '<div class="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mt-1">' + g.evalReason + '</div>' +
      '</div>';
    });

    tbody.innerHTML = rowsHtml;
    mobile.innerHTML = cardsHtml;
    if (countLabel) {
      countLabel.textContent = state.timeFilter === 'upcoming'
        ? 'Showing the ' + shown + '-game ' + teamData.team.name + ' upcoming broadcast schedule'
        : state.timeFilter === 'past'
        ? 'Showing ' + shown + ' completed games'
        : 'Showing ' + shown + ' total games';
    }
  }

  var lastTrackedZip = '';

  function trackUsEvent(name, data) {
    if (typeof window.trackUsEvent === 'function') {
      window.trackUsEvent(name, data);
    }
  }

  window.exportPDF = function() {
    var teamName = teamData && teamData.team
      ? teamData.team.name
      : (document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : 'NHL Team');
    var hasValidZip = /^\d{5}$/.test(state.zip);
    var hasUsTerritory = teamData && teamData.team && Array.isArray(teamData.team.zipRanges) && teamData.team.zipRanges.length > 0;
    var isPrimaryInMarket = hasUsTerritory
      ? (hasValidZip ? isZipInTeamTerritory(state.zip, teamData.team.id) : true)
      : false;
    var marketContext = hasValidZip
      ? 'US ZIP Code: ' + state.zip + ' (' + (isPrimaryInMarket ? 'In-Market' : 'Out-of-Market') + ')'
      : 'Default View (' + (isPrimaryInMarket ? 'In-Market' : 'Out-of-Market') + ')';

    var subLabels = [];
    document.querySelectorAll('#subsList input[type="checkbox"]:checked').forEach(function(cb) {
      var p = cb.nextElementSibling && cb.nextElementSibling.querySelector('p:first-child');
      if (p) subLabels.push(p.textContent.trim());
    });

    var opts = {
      buttonId: 'btnExportPDF',
      generatingText: 'Generating...',
      logoSrc: '/shared/pdf-logo.js',
      title: teamName + ' - 2026-27 US TV Schedule',
      contextStr: marketContext + '  |  Active Subscriptions: ' + (subLabels.length > 0 ? subLabels.join(', ') : 'None'),
      head: ['Date & Time', 'Matchup', 'Broadcast', 'Access Status'],
      statusTerms: {
        watchable: ['Watchable'],
        blackedOut: ['Blacked Out'],
        outOfMarket: ['Need Sub', 'Out-of-Market']
      },
      fileName: teamName.replace(/\s+/g, '_') + '_US_Schedule.pdf'
    };

    if (typeof window.runSchedulePdfExport === 'function') {
      window.runSchedulePdfExport(opts);
      return;
    }

    var btn = document.getElementById('btnExportPDF');
    var originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span class="hidden sm:inline">Generating...</span>';
      btn.disabled = true;
    }
    var s = document.createElement('script');
    s.src = '/shared/pdf-export.js';
    s.onload = function() {
      if (typeof window.runSchedulePdfExport === 'function') {
        if (btn) btn.innerHTML = originalText;
        window.runSchedulePdfExport(opts);
      } else if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    };
    s.onerror = function() {
      if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    };
    document.head.appendChild(s);
  };

  window.setUsTimeFilter = function(mode) {
    state.timeFilter = mode;
    ['upcoming', 'all', 'past'].forEach(function(k) {
      var btn = document.getElementById('time_' + k);
      if (!btn) return;
      if (k === mode) {
        btn.className = 'px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-teamPrimary font-bold transition';
      } else {
        btn.className = 'px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition';
      }
    });
    renderAll();
  };

  document.addEventListener('DOMContentLoaded', function() {
    // Restore saved ZIP and subscriptions from localStorage
    try {
      var savedZip = localStorage.getItem('hockeyblackouts_us_zip');
      if (savedZip && /^\d{5}$/.test(savedZip)) {
        state.zip = savedZip;
        var zIn = document.getElementById('zipCodeInput');
        if (zIn) zIn.value = savedZip;
      }
      var savedSubs = localStorage.getItem('hockeyblackouts_us_subs');
      if (savedSubs) {
        var parsed = JSON.parse(savedSubs);
        if (parsed && typeof parsed === 'object') {
          subKeys.forEach(function(k) {
            if (k in parsed) {
              state.subs[k] = Boolean(parsed[k]);
              var cb = document.getElementById('sub_' + k);
              if (cb) cb.checked = state.subs[k];
            }
          });
        }
      }
    } catch (e) {}

    // Bind ZIP Code Form & Input
    var zipForm = document.getElementById('usZipLookupForm');
    var zipInput = document.getElementById('zipCodeInput');
    function applyZipValue(val, isManualAction) {
      var clean = (val || '').replace(/\D/g, '').substring(0, 5);
      if (zipInput && zipInput.value !== clean) zipInput.value = clean;
      if (clean.length === 5 || clean.length === 0) {
        if (clean.length === 0) lastTrackedZip = '';
        state.zip = clean;
        try { localStorage.setItem('hockeyblackouts_us_zip', clean); } catch (e) {}
        renderAll();
        if (isManualAction && clean.length === 5 && clean !== lastTrackedZip) {
          lastTrackedZip = clean;
          var teamCode = teamData && teamData.team ? teamData.team.id : 'US';
          var inMarket = teamData && teamData.team ? isZipInTeamTerritory(clean, teamData.team.id) : false;
          trackUsEvent('zip-lookup-verdict', {
            status: inMarket ? 'in_market' : 'out_of_market',
            team: teamCode
          });
        }
      }
    }
    if (zipForm) {
      zipForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (zipInput) applyZipValue(zipInput.value, true);
      });
    }
    if (zipInput) {
      zipInput.addEventListener('input', function(e) {
        applyZipValue(e.target.value, true);
      });
    }

    // Bind Subscription Checkboxes
    subKeys.forEach(function(k) {
      var cb = document.getElementById('sub_' + k);
      if (cb) {
        cb.addEventListener('change', function(e) {
          state.subs[k] = Boolean(e.target.checked);
          try { localStorage.setItem('hockeyblackouts_us_subs', JSON.stringify(state.subs)); } catch (err) {}
          renderAll();
        });
      }
    });

    // Bind Search, Status & Channel Filters
    var searchEl = document.getElementById('opponentSearch');
    if (searchEl) searchEl.addEventListener('input', function(e) { state.search = (e.target.value || '').toLowerCase(); renderAll(); });
    var statusEl = document.getElementById('statusFilter');
    if (statusEl) statusEl.addEventListener('change', function(e) { state.statusFilter = e.target.value; renderAll(); });
    var chanEl = document.getElementById('channelFilter');
    if (chanEl) chanEl.addEventListener('change', function(e) { state.channelFilter = e.target.value; renderAll(); });

    fetch('data.json')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        teamData = d;
        renderAll();
      })
      .catch(function() {});
  });
})();
