/* Toolbox Pro production UI fixes.
 * This file intentionally sits after app.js so it can harden the existing
 * navigation without rewriting the 90+ tool implementations.
 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function setLandingMode() {
    const hasTool = /^#\/[^/]+/.test(window.location.hash) && window.location.hash !== '#/';
    document.body.classList.toggle('landing-mode', !hasTool);
  }

  function setDrawer(open) {
    const sidebar = $('sidebar');
    const backdrop = $('toolDrawerBackdrop');
    const button = $('hamburgerBtn');
    if (!sidebar) return;

    sidebar.classList.toggle('open', !!open);
    sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (backdrop) backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('drawer-open', !!open);
  }

  function closeDrawer() { setDrawer(false); }

  function openDrawer() {
    const sidebar = $('sidebar');
    if (sidebar) setDrawer(!sidebar.classList.contains('open'));
  }

  function showTool(key) {
    if (!window.TOOLS || !window.TOOLS[key]) return false;
    window.location.hash = '#/' + key;
    return true;
  }

  function refreshPageMode() {
    setLandingMode();
    if (!document.body.classList.contains('landing-mode')) {
      closeDrawer();
    }
  }

  function installNavigationGuards() {
    const hamburger = $('hamburgerBtn');
    const backdrop = $('toolDrawerBackdrop');
    const heroTools = $('heroToolsBtn');
    const heroQr = $('heroQrBtn');
    const brand = $('brandHome');

    /* app.js already has a hamburger handler. Its handler toggles the class;
       this handler only synchronizes the accessible state after that toggle. */
    if (hamburger) {
      hamburger.addEventListener('click', function () {
        window.setTimeout(function () {
          const isOpen = $('sidebar')?.classList.contains('open');
          setDrawer(!!isOpen);
        }, 0);
      });
    }

    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    if (heroTools) heroTools.addEventListener('click', function () {
      setDrawer(true);
      const firstTool = $('sidebarContent')?.querySelector('[data-tool]');
      if (firstTool) firstTool.click();
    });

    if (heroQr) heroQr.addEventListener('click', function () { showTool('qrcode'); });

    if (brand) brand.addEventListener('click', function (e) {
      e.preventDefault();
      closeDrawer();
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* Event delegation guarantees that every generated tool row remains
       clickable even if navigation is rebuilt by the application. */
    document.addEventListener('click', function (e) {
      const item = e.target.closest('#sidebarContent [data-tool]');
      if (item) {
        closeDrawer();
        window.setTimeout(refreshPageMode, 0);
        return;
      }

      const modalButton = e.target.closest('[data-modal]');
      if (modalButton) closeDrawer();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    window.addEventListener('hashchange', refreshPageMode);
  }

  function hardenConsentPopup() {
    const banner = $('cookieBanner');
    const accept = $('cookieAcceptBtn');
    const decline = $('cookieDeclineBtn');
    if (!banner) return;

    let consent = null;
    try { consent = localStorage.getItem('tp_consent'); } catch (_) {}

    if (!consent) {
      banner.classList.add('show');
      banner.setAttribute('aria-hidden', 'false');
    } else {
      banner.classList.remove('show');
      banner.setAttribute('aria-hidden', 'true');
    }

    function save(value) {
      try { localStorage.setItem('tp_consent', value); } catch (_) {}
      banner.classList.remove('show');
      banner.setAttribute('aria-hidden', 'true');
    }

    if (accept) accept.addEventListener('click', function () { save('all'); });
    if (decline) decline.addEventListener('click', function () { save('necessary'); });
  }

  function addCacheBust() {
    /* Static deployments can otherwise keep an old HTML/CSS/JS response in a
       service/browser cache. A lightweight build marker is enough to make the
       browser revalidate this document on a fresh load without storing user data. */
    try {
      const marker = sessionStorage.getItem('tp_ui_build');
      if (marker !== '2026-08-27-ui2') sessionStorage.setItem('tp_ui_build', '2026-08-27-ui2');
    } catch (_) {}
  }

  function boot() {
    addCacheBust();
    installNavigationGuards();
    refreshPageMode();
    hardenConsentPopup();

    const year = $('yearNow');
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
