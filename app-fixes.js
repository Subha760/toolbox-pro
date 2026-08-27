/* Toolinger final navigation + mobile reliability layer. */
(function () {
  'use strict';
  const LOGO = 'https://cdn.phototourl.com/free/2026-08-27-01bf5c9c-8880-4db1-87f7-c3b75410505f.png';
  const $ = id => document.getElementById(id);

  function setDrawer(open) {
    const sidebar = $('sidebar');
    const backdrop = $('toolDrawerBackdrop');
    const button = $('hamburgerBtn');
    if (!sidebar) return;
    sidebar.classList.toggle('open', !!open);
    document.body.classList.toggle('drawer-open', !!open);
    if (button) {
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label', open ? 'Close tools menu' : 'Open tools menu');
    }
    if (backdrop) backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function applyLogo() {
    document.querySelectorAll('.brand-mark').forEach(mark => {
      mark.classList.add('tp-logo');
      if (mark.querySelector('img')) return;
      mark.textContent = '';
      const img = document.createElement('img');
      img.src = LOGO;
      img.alt = 'Toolinger logo';
      img.loading = 'eager';
      img.decoding = 'async';
      mark.appendChild(img);
    });
  }

  function applyBrand() {
    document.title = 'Toolinger – 90+ Free Online Tools';
    document.querySelectorAll('.brand-text strong, .footer-col strong').forEach(el => el.textContent = 'Toolinger');
    document.querySelectorAll('.brand-text span').forEach(el => el.textContent = '90+ Online Tools');
    document.querySelectorAll('.footer-bottom').forEach(el => {
      el.innerHTML = '<span>© ' + new Date().getFullYear() + ' Toolinger.</span><span>Browser-first processing.</span>';
    });
  }

  function applyState() {
    const isTool = /^#\/[^/]+/.test(location.hash);
    document.body.classList.toggle('landing-mode', !isTool);
    if (isTool) setDrawer(false);
  }

  function injectCSS() {
    if ($('toolingerFinalCSS')) return;
    const style = document.createElement('style');
    style.id = 'toolingerFinalCSS';
    style.textContent = `
      body.landing-mode .app-shell .main { display:none !important; }
      body.landing-mode .site-footer, body.landing-mode .ad-footer { display:none !important; }
      body.landing-mode .sidebar { visibility:hidden !important; pointer-events:none !important; }
      body.landing-mode .sidebar.open { visibility:visible !important; pointer-events:auto !important; }
      body:not(.landing-mode) .landing { display:none !important; }
      .brand-mark.tp-logo { background:transparent !important; box-shadow:none !important; padding:0 !important; overflow:hidden !important; }
      .brand-mark.tp-logo img { width:100% !important; height:100% !important; object-fit:contain !important; display:block !important; }
      .tool-drawer-backdrop { position:fixed !important; inset:0 !important; z-index:10900 !important; display:none !important; background:rgba(5,4,14,.68) !important; backdrop-filter:blur(5px) !important; -webkit-backdrop-filter:blur(5px) !important; }
      body.drawer-open .tool-drawer-backdrop { display:block !important; }
      body.drawer-open { overflow:hidden !important; }
      .sidebar ul li { min-height:42px !important; touch-action:manipulation !important; }
      @media(max-width:768px){
        html,body{width:100%;min-width:0;overflow-x:hidden !important}
        .site-header{position:sticky !important;top:0 !important;z-index:11000 !important;min-height:58px !important;padding:8px 10px !important;gap:9px !important;flex-wrap:wrap !important}
        .hamburger{display:inline-flex !important;width:44px !important;height:44px !important;min-width:44px !important}
        .brand{min-width:0 !important;gap:7px !important}.brand-mark{width:36px !important;height:36px !important;border-radius:10px !important}.brand-text strong{font-size:.9rem !important;white-space:nowrap !important}.brand-text span{display:none !important}
        .header-search{order:3 !important;width:100% !important;max-width:none !important;height:40px !important}.header-search input{font-size:16px !important}
        .header-nav{display:none !important}
        .sidebar{position:fixed !important;left:0 !important;top:0 !important;bottom:0 !important;width:min(360px,88vw) !important;height:100dvh !important;max-height:none !important;padding:72px 0 28px !important;overflow-y:auto !important;transform:translate3d(-105%,0,0) !important;visibility:hidden !important;pointer-events:none !important;z-index:10950 !important;box-shadow:24px 0 70px rgba(0,0,0,.55) !important;transition:transform .28s ease,visibility 0s linear .28s !important}
        .sidebar.open{transform:translate3d(0,0,0) !important;visibility:visible !important;pointer-events:auto !important;transition:transform .28s ease,visibility 0s !important}
        .ad-leaderboard{width:calc(100% - 20px) !important;min-height:64px !important;margin:10px auto 0 !important}
        .landing{min-height:calc(100dvh - 112px) !important;padding:18px 12px 42px !important}
        .hero-grid{display:block !important;min-height:0 !important}.hero-title{font-size:clamp(2.55rem,13vw,4rem) !important;letter-spacing:-2px !important}.hero-copy>p{font-size:.88rem !important;line-height:1.55 !important}.hero-actions{display:grid !important;grid-template-columns:1fr !important;gap:8px !important}.hero-actions .btn,.hero-secondary{width:100% !important;min-height:44px !important;margin:0 !important}
        .motion-stage{min-height:300px !important;margin-top:6px !important}.motion-window{width:100% !important;transform:none !important}.motion-tools{gap:6px !important}.motion-tool{height:67px !important;padding:8px !important}.landing-features{grid-template-columns:1fr !important;gap:9px !important}
        .main{padding:16px 12px 40px !important}.tool-content{padding:18px 14px !important;width:100% !important;max-width:none !important}.row{flex-direction:column !important;align-items:stretch !important}.row>*{width:100% !important;max-width:100% !important}.tool-content input,.tool-content select,.tool-content textarea{font-size:16px !important}.tool-content .btn{width:100% !important}.sidebar ul{padding:3px 10px !important}.category-heading{padding:14px 16px 6px !important;font-size:.66rem !important}.sidebar ul li{min-height:44px !important;padding:10px 12px !important;font-size:.79rem !important}
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    injectCSS();
    applyBrand();
    applyLogo();
    applyState();

    const hamburger = $('hamburgerBtn');
    if (hamburger && !hamburger.dataset.toolingerBound) {
      hamburger.dataset.toolingerBound = '1';
      hamburger.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const sidebar = $('sidebar');
        setDrawer(!(sidebar && sidebar.classList.contains('open')));
      }, true);
    }

    const backdrop = $('toolDrawerBackdrop');
    if (backdrop && !backdrop.dataset.toolingerBound) {
      backdrop.dataset.toolingerBound = '1';
      backdrop.addEventListener('click', () => setDrawer(false), true);
    }

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setDrawer(false);
    });

    document.addEventListener('click', function (event) {
      const item = event.target.closest && event.target.closest('#sidebarContent [data-tool]');
      if (!item) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const key = item.dataset.tool;
      setDrawer(false);
      if (key) location.hash = '#/' + key;
    }, true);

    const home = $('brandHome');
    if (home && !home.dataset.toolingerBound) {
      home.dataset.toolingerBound = '1';
      home.addEventListener('click', event => {
        event.preventDefault();
        setDrawer(false);
        location.hash = '';
        applyState();
      });
    }

    const browse = $('heroMenuBtn');
    if (browse && !browse.dataset.toolingerBound) {
      browse.dataset.toolingerBound = '1';
      browse.addEventListener('click', () => setDrawer(true));
    }

    window.addEventListener('hashchange', applyState);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
