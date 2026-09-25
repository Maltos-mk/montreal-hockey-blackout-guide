const fs = require('fs');
let js = fs.readFileSync('shared/app.js', 'utf-8');

const pwaLogic = `
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
`;

js = js.replace(/\/\/ Auto-display modal once after 3 seconds on mobile devices only/, '// Auto-display modal once after 3 seconds on mobile devices only\n' + pwaLogic);

fs.writeFileSync('shared/app.js', js);
