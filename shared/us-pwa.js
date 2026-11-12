(function() {
  function getTeamCode() {
    return (document.body && document.body.getAttribute('data-team-code')) || 'US_HOME';
  }

  window.trackUsEvent = function(name, data) {
    if (typeof window.umami !== 'undefined' && typeof window.umami.track === 'function') {
      try {
        var payload = Object.assign({ team: getTeamCode() }, data || {});
        window.umami.track(name, payload);
      } catch (e) {}
    }
  };

  window.shareApp = function() {
    var shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url: shareUrl })
        .then(function() { window.trackUsEvent('share-native'); })
        .catch(function() {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(function() { window.trackUsEvent('share-copy-link'); })
        .catch(function() {});
    }
  };

  var deferredPrompt = null;
  var supportsWebInstall = typeof Navigator !== 'undefined' && typeof Navigator.prototype.install === 'function';
  var isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var STORAGE_KEY = 'hockeyblackouts_us_pwa_prompt_dismissed';

  // Attribute standalone PWA launches that lack start_url UTM parameters without mutating normal browser URLs
  if (isStandalone && !window.location.search.includes('utm_source')) {
    try {
      var currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('utm_source', 'pwa');
      currentUrl.searchParams.set('utm_medium', 'homescreen');
      window.history.replaceState(null, null, currentUrl.pathname + currentUrl.search + currentUrl.hash);
    } catch (e) {}
  }

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  function hideDirectInstallModal() {
    var modal = document.getElementById('directInstallModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  window.dismissDirectInstallModal = function(neverShowAgain) {
    hideDirectInstallModal();
    window.trackUsEvent('pwa-prompt-dismissed', { permanent: Boolean(neverShowAgain) });
    try {
      localStorage.setItem(STORAGE_KEY, neverShowAgain ? 'permanent' : String(Date.now()));
    } catch (e) {}
  };

  window.triggerDirectInstall = async function() {
    var installBtn = document.getElementById('triggerInstallBtn');
    if (installBtn && installBtn.getAttribute('aria-disabled') === 'true') return;
    if (installBtn) installBtn.setAttribute('aria-disabled', 'true');

    try {
      if (supportsWebInstall) {
        await navigator.install();
        try { localStorage.setItem(STORAGE_KEY, 'installed'); } catch (e) {}
        window.trackUsEvent('pwa-install-accepted');
        hideDirectInstallModal();
      } else if (deferredPrompt) {
        var promptEvent = deferredPrompt;
        deferredPrompt = null;
        await promptEvent.prompt();
        var choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          try { localStorage.setItem(STORAGE_KEY, 'installed'); } catch (e) {}
          window.trackUsEvent('pwa-install-accepted');
          hideDirectInstallModal();
        } else {
          window.dismissDirectInstallModal(false);
        }
      }
    } catch (err) {
      if (!err || err.name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      if (installBtn) installBtn.removeAttribute('aria-disabled');
    }
  };

  window.openDirectInstallModal = function() {
    var modal = document.getElementById('directInstallModal');
    var body = document.getElementById('directInstallBody');
    if (!modal || !body) return;

    if (isIOS) {
      body.innerHTML =
        '<div class="space-y-2">' +
          '<div class="flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">1</span><span>Tap the <strong class="text-blue-500 font-semibold"><i class="fa-solid fa-arrow-up-from-bracket"></i> Share icon</strong> at the bottom of Safari.</span></div>' +
          '<div class="flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">2</span><span>Scroll down &amp; select <strong class="text-slate-900 dark:text-white font-semibold">&ldquo;Add to Home Screen&rdquo; <i class="fa-regular fa-square-plus ml-1"></i></strong></span></div>' +
          '<div class="flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">3</span><span>Tap <strong class="text-amber-500 font-semibold">&ldquo;Add&rdquo;</strong> in the top right.</span></div>' +
        '</div>';
    } else if (supportsWebInstall || deferredPrompt) {
      body.innerHTML =
        '<p class="text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">Install directly to your device for instant 1-tap US blackout &amp; schedule checks.</p>' +
        '<button type="button" id="triggerInstallBtn" onclick="triggerDirectInstall()" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow transition flex items-center justify-center gap-2">' +
          '<i class="fa-solid fa-download"></i><span>Install Now</span>' +
        '</button>';
    } else {
      body.innerHTML =
        '<div class="space-y-2">' +
          '<div class="flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">1</span><span>Tap the browser menu <strong class="text-slate-900 dark:text-white font-semibold">(three dots <i class="fa-solid fa-ellipsis-vertical"></i>)</strong>.</span></div>' +
          '<div class="flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-teamSecondary text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">2</span><span>Select <strong class="text-slate-900 dark:text-white font-semibold">&ldquo;Install App&rdquo;</strong> or <strong class="text-slate-900 dark:text-white font-semibold">&ldquo;Add to Home screen&rdquo;</strong>.</span></div>' +
        '</div>';
    }

    window.trackUsEvent('pwa-prompt-viewed', { os: isIOS ? 'ios' : 'android_desktop' });
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };

  window.addEventListener('appinstalled', function() {
    try { localStorage.setItem(STORAGE_KEY, 'installed'); } catch (e) {}
    window.trackUsEvent('pwa-install-success');
    hideDirectInstallModal();
  });

  document.addEventListener('DOMContentLoaded', function() {
    var pwaBanner = document.getElementById('pwaInstallBanner');
    if (pwaBanner && isStandalone) {
      pwaBanner.style.display = 'none';
    }

    setTimeout(function() {
      var isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
      if (!isMobile || isStandalone) return;
      var dismissed = null;
      try { dismissed = localStorage.getItem(STORAGE_KEY); } catch (e) {}
      if (!dismissed) {
        window.openDirectInstallModal();
      } else if (dismissed !== 'permanent' && dismissed !== 'installed') {
        var dismissedTime = parseInt(dismissed, 10);
        if (!isNaN(dismissedTime) && (Date.now() - dismissedTime > 7 * 24 * 60 * 60 * 1000)) {
          window.openDirectInstallModal();
        }
      }
    }, 25000);
  });
})();
