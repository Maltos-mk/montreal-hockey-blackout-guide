
// Add Web Share API handler
window.shareApp = async function() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: window.TEAM_DATA ? window.TEAM_DATA.team.name + ' Broadcast Guide' : 'Hockey Broadcast Guide',
        text: "Check if tonight's game is blacked out!",
        url: window.location.href,
      });
      // Umami tracking for share
      if (window.umami) umami.track('share-click');
    } catch (err) {
      console.log('Error sharing', err);
    }
  } else {
    alert('Sharing not supported on this browser. Copy the URL to share!');
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
    
    // Update basic UI elements that might have team name
    document.querySelectorAll('.team-nickname-text').forEach(el => el.textContent = window.TEAM_DATA.team.nickname);
    document.querySelectorAll('.team-name-text').forEach(el => el.textContent = window.TEAM_DATA.team.name);
    
    // Auto-display direct install after 3s on mobile
    

    render();
  } catch (err) {
    console.error('Failed to load team data:', err);
  }
}
const state = {
      region: 'in_market',
      lang: 'en',
      timeFilter: 'upcoming',
      search: '',
      statusFilter: 'all',
      channelFilter: 'all',
      subs: {
        sn: true,
        sn_prem: false,
        tsn: false,
        prime: false,
        rds: false,
        tva: false,
        espn: false
      }
    };

    let games = [];

    const evaluateGame = window.evaluateGame;

    function render() {
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
        const nextEval = evaluateGame(nextGame);
        let badgeHtml = '';
        if (nextEval.status === 'watchable') {
          badgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> Watchable On Your Setup</span>';
        } else if (nextEval.status === 'blacked_out') {
          badgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-ban"></i> Regionally Blacked Out</span>';
        } else {
          badgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-lock"></i> Subscription Needed</span>';
        }

        const isGameToday = nextGame.isToday;

        spotlightEl.innerHTML = `
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teamSecondary via-slate-900 to-teamDark p-5 sm:p-6 text-white shadow-md border border-slate-700/50">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${isGameToday ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-white/20 text-white'}">
                    ${isGameToday ? '★ Game Today' : 'Next ' + window.TEAM_DATA.team.nickname + ' Game'}
                  </span>
                  <span class="text-xs text-slate-300 font-medium">${nextGame.date} • ${nextGame.time} ET</span>
                  <span class="text-xs text-slate-400">#${nextGame.id}</span>
                </div>
                
                <h3 class="text-xl sm:text-2xl font-black font-teko uppercase tracking-wide flex items-center gap-2">
                  <span>${nextGame.vs}</span>
                  ${nextGame.note ? `<span class="text-xs font-sans font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">${nextGame.note}</span>` : ''}
                </h3>
                
                <p class="text-xs text-slate-300 flex items-center gap-2">
                  <i class="fa-solid fa-location-dot text-slate-400"></i> ${nextGame.venue}
                </p>
              </div>

              <div class="flex flex-col md:items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-300 font-medium">Broadcast:</span>
                  <span class="px-2 py-0.5 rounded text-xs font-bold bg-white text-teamSecondary shadow-sm">${nextGame.netEN}</span>
                  <span class="px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white">${nextGame.netFR}</span>
                </div>
                
                <div>${badgeHtml}</div>
                
                <div class="text-[11px] text-slate-300 md:text-right max-w-sm">
                  ${nextEval.summaryReason}
                </div>
              </div>

            </div>
          </div>
        `;
      }

      let watchableCount = 0;
      let blackedOutCount = 0;
      let missingSubCount = 0;

      games.forEach(g => {
        const evalRes = evaluateGame(g);
        if (evalRes.status === 'watchable') watchableCount++;
        else if (evalRes.status === 'blacked_out') blackedOutCount++;
        else missingSubCount++;
      });

      const total = games.length;
      const pct = Math.round((watchableCount / total) * 100) || 0;

      document.getElementById('watchableCount').textContent = watchableCount;
      document.getElementById('totalGameLabel').textContent = `/ ${total} GAMES`;
      document.getElementById('pctBadge').textContent = `${pct}% Watchable`;
      document.getElementById('kpiSeasonTitle').textContent = 'Full Season Coverage (All 89 Games)';

      document.getElementById('watchableBreakdown').textContent = `${watchableCount} games (${pct}%)`;
      document.getElementById('blackoutBreakdown').textContent = `${blackedOutCount} games (${Math.round((blackedOutCount/total)*100)||0}%)`;
      document.getElementById('missingBreakdown').textContent = `${missingSubCount} games (${Math.round((missingSubCount/total)*100)||0}%)`;

      document.getElementById('watchBar').style.width = `${pct}%`;
      document.getElementById('blackoutBar').style.width = `${(blackedOutCount/total)*100}%`;
      document.getElementById('missingBar').style.width = `${(missingSubCount/total)*100}%`;

      const tbody = document.getElementById('scheduleTableBody');
      const mobileContainer = document.getElementById('scheduleCardsMobile');
      tbody.innerHTML = '';
      mobileContainer.innerHTML = '';

      let displayedCount = 0;

      const filteredGames = gamesWithTime.filter(g => {
        if (state.timeFilter === 'upcoming' && g.isPast) return false;
        if (state.timeFilter === 'past' && !g.isPast) return false;

        const evalRes = evaluateGame(g);

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
        const evalRes = evaluateGame(g);

        let badge = '';
        if (g.isPast) {
          badge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap"><i class="fa-solid fa-clock-rotate-left mr-1 text-[10px]"></i>Final</span>';
        } else if (evalRes.status === 'watchable') {
          badge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap"><i class="fa-solid fa-check mr-1 text-[10px]"></i>Watchable</span>';
        } else if (evalRes.status === 'blacked_out') {
          badge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 whitespace-nowrap"><i class="fa-solid fa-ban mr-1 text-[10px]"></i>Blacked Out</span>';
        } else {
          badge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap"><i class="fa-solid fa-lock mr-1 text-[10px]"></i>Need Sub</span>';
        }

        const card = document.createElement('div');
        card.className = `p-3 rounded-xl border transition ${g.isPast ? 'bg-slate-100/60 dark:bg-slate-900/40 opacity-75 border-slate-200 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'}`;
        card.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-teko text-base font-bold text-slate-400">#${g.id}</span>
                <span class="font-bold text-sm text-slate-900 dark:text-white">${g.vs}</span>
              </div>
              <div class="text-[11px] text-slate-500">${g.date} • ${g.time}</div>
            </div>
            <div>${badge}</div>
          </div>

          <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <div class="flex items-center gap-1">
              <span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${g.netEN}</span>
              <span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">${g.netFR}</span>
            </div>
            <span class="text-[11px] text-slate-500 font-medium">
              ${g.type === 'national' ? 'National' : g.type === 'prime_monday' ? 'Prime Monday' : 'Regional'}
            </span>
          </div>

          <div class="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            ${evalRes.summaryReason}
          </div>
        `;
        mobileContainer.appendChild(card);

        const tr = document.createElement('tr');
        tr.className = `hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800/60 ${g.isPast ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/20' : ''}`;
        tr.innerHTML = `
          <td class="py-3 px-4 font-bold text-slate-400 dark:text-slate-500 font-teko text-base text-center">${g.id}</td>
          <td class="py-3 px-4 whitespace-nowrap">
            <div class="font-semibold text-slate-800 dark:text-slate-200">${g.date}</div>
            <div class="text-[11px] text-slate-400">${g.time}</div>
          </td>
          <td class="py-3 px-4">
            <div class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>${g.vs}</span>
              ${g.phase === 'preseason' ? '<span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">Preseason</span>' : ''}
              ${g.note ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-teamPrimary/10 text-teamPrimary">${g.note}</span>` : ''}
            </div>
            <div class="text-[11px] text-slate-500">${g.venue}</div>
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center space-x-1.5">
              <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${g.netEN}</span>
              <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${g.netFR}</span>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              ${g.type === 'national' ? 'National (Coast-to-Coast)' : g.type === 'prime_monday' ? 'Prime Monday Exclusive' : 'Regional Territory'}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <div>${badge}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              ${evalRes.summaryReason}
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      document.getElementById('renderedCountLabel').textContent = 
        state.timeFilter === 'upcoming' ? `Showing ${displayedCount} upcoming ${window.TEAM_DATA.team.name} games` :
        state.timeFilter === 'past' ? `Showing ${displayedCount} completed games` : `Showing ${displayedCount} total games`;

      const verdictEl = document.getElementById('kpiVerdict');
      const adviceCard = document.getElementById('adviceCard');

      if (window.renderAdviceCards) {
          adviceCard.innerHTML = window.renderAdviceCards(state);
        }
      }

    document.querySelectorAll('.region-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.region = btn.dataset.region;
        document.querySelectorAll('.region-btn').forEach(b => {
          b.className = "region-btn p-3 rounded-xl border text-left flex flex-col justify-between transition border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300";
        });
        btn.className = "region-btn p-3 rounded-xl border text-left flex flex-col justify-between transition border-teamSecondary bg-teamSecondary/5 text-teamSecondary font-semibold dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300";
        render();
      });
    });

    ['sn', 'sn_prem', 'tsn', 'prime', 'rds', 'tva', 'espn'].forEach(key => {
      const el = document.getElementById(`sub_${key}`);
      if (el) {
        el.addEventListener('change', () => {
          state.subs[key] = el.checked;
          render();
        });
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
      render();
    });

    document.getElementById('channelFilter').addEventListener('change', (e) => {
      state.channelFilter = e.target.value;
      render();
    });

    document.getElementById('opponentSearch').addEventListener('input', (e) => {
      state.search = e.target.value;
      render();
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
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
              <span>Tap the <strong class="text-blue-500 font-semibold"><i class="fa-solid fa-arrow-up-from-bracket"></i> Share icon</strong> at the bottom of Safari.</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">2</span>
              <span>Scroll down & select <strong class="text-slate-900 dark:text-white font-semibold">"Add to Home Screen" <i class="fa-regular fa-square-plus ml-1"></i></strong></span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">3</span>
              <span>Tap <strong class="text-amber-500 font-semibold">"Add"</strong> in the top right.</span>
            </div>
          </div>
        `;
      } else if (deferredPrompt) {
        body.innerHTML = `
          <p class="text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">Install directly to your device for instant launch and offline access.</p>
          <button onclick="triggerDirectInstall()" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow transition flex items-center justify-center gap-2">
            <i class="fa-solid fa-download"></i>
            <span>Install Now</span>
          </button>
        `;
      } else {
        body.innerHTML = `
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">1</span>
              <span>Tap the browser menu <strong class="text-slate-900 dark:text-white font-semibold">(three dots <i class="fa-solid fa-ellipsis-vertical"></i>)</strong>.</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">2</span>
              <span>Select <strong class="text-slate-900 dark:text-white font-semibold">"Install App"</strong> or <strong class="text-slate-900 dark:text-white font-semibold">"Add to Home screen"</strong>.</span>
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
    

    initApp();
