if ('serviceWorker' in navigator) {
  const register = () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
  };
  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }

  let deferredPrompt;
  const installBtnId = 'pwa-install-btn';
  const installBtnStyleId = 'pwa-install-style';

  function createInstallButton() {
    if (document.getElementById(installBtnId)) return;
    const style = document.createElement('style');
    style.id = installBtnStyleId;
    style.textContent = `
      #${installBtnId} {
        position: fixed;
        left: 16px;
        bottom: 16px;
        z-index: 120;
        display: none;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.2rem;
        border-radius: 999px;
        background: rgba(240, 76, 120, 0.98);
        color: #fff0df;
        font-family: "DM Mono", monospace;
        font-size: 0.8rem;
        letter-spacing: 0.16em;
        text-decoration: none;
        border: 1px solid rgba(255, 240, 223, 0.45);
        box-shadow: 0 12px 40px rgba(240, 76, 120, 0.35), 0 1px 0 rgba(255, 240, 223, 0.18) inset;
        cursor: pointer;
        backdrop-filter: blur(6px) saturate(1.2);
      }
      #${installBtnId}.show { display: flex; }
      @media (prefers-reduced-motion: reduce) {
        #${installBtnId} { transition: none; }
      }
    `;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = installBtnId;
    btn.type = 'button';
    btn.textContent = 'INSTALL APP ↓';
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      btn.classList.remove('show');
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch (_) {}
      deferredPrompt = null;
    });
    document.body.appendChild(btn);
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    createInstallButton();
    const btn = document.getElementById(installBtnId);
    setTimeout(() => btn.classList.add('show'), 1500);
  });

  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById(installBtnId);
    if (btn) btn.remove();
    const style = document.getElementById(installBtnStyleId);
    if (style) style.remove();
    deferredPrompt = null;
  });

  if (window.matchMedia('(display-mode: standalone)').matches) {
    const btn = document.getElementById(installBtnId);
    if (btn) btn.remove();
  }
}
