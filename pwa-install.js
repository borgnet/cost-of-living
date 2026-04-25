(() => {
  let deferredPrompt = null;
  let isReady = false;

  function isiOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  function ensureButton() {
    if (document.getElementById('pwa-install-button') || isStandalone()) return null;
    const button = document.createElement('button');
    button.id = 'pwa-install-button';
    button.type = 'button';
    button.textContent = 'Install app';
    button.setAttribute('aria-label', 'Install this tool as an app');
    button.style.cssText = [
      'position:fixed','right:16px','bottom:16px','z-index:2147483647',
      'border:1px solid rgba(24,95,165,.25)','border-radius:999px',
      'padding:10px 14px','background:#185FA5','color:white',
      'font:600 13px system-ui,-apple-system,Segoe UI,sans-serif',
      'box-shadow:0 8px 28px rgba(0,0,0,.18)','cursor:pointer',
      'display:none'
    ].join(';');
    button.addEventListener('click', async () => {
      if (deferredPrompt) {
        const promptEvent = deferredPrompt;
        deferredPrompt = null;
        button.style.display = 'none';
        promptEvent.prompt();
        try { await promptEvent.userChoice; } catch {}
        return;
      }
      const msg = isiOS()
        ? 'On iPhone/iPad: open this page in Safari, tap Share, then Add to Home Screen.'
        : 'If Chrome does not show an install prompt yet, reload this page once so the service worker can take control, then use Chrome menu → Save and share → Install page as app.';
      alert(msg);
    });
    document.body.appendChild(button);
    return button;
  }

  function showButton() {
    const button = ensureButton();
    if (button) button.style.display = 'inline-flex';
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    isReady = true;
    showButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const button = document.getElementById('pwa-install-button');
    if (button) button.remove();
  });

  window.addEventListener('load', () => {
    if (isStandalone()) return;
    if (isiOS()) showButton();
    // Desktop Chrome may fire beforeinstallprompt after installability checks complete.
    // If it has not fired, avoid showing a dead prompt immediately.
    setTimeout(() => {
      if (isReady) showButton();
    }, 2500);
  });
})();
