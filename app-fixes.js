/* Toolbox Pro production UI fixes. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }

  function setLandingMode() {
    const hash = window.location.hash || '';
    const hasTool = /^#\/[^/]+/.test(hash);
    document.body.classList.toggle('landing-mode', !hasTool);
  }

  function setDrawer(open) {
    const sidebar = $('sidebar'), backdrop = $('toolDrawerBackdrop'), button = $('hamburgerBtn');
    if (!sidebar) return;
    sidebar.classList.toggle('open', !!open);
    sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (backdrop) backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('drawer-open', !!open);
  }

  function closeDrawer() { setDrawer(false); }

  function refreshPageMode() {
    setLandingMode();
    if (!document.body.classList.contains('landing-mode')) closeDrawer();
  }

  function installNavigationGuards() {
    const hamburger = $('hamburgerBtn');
    const backdrop = $('toolDrawerBackdrop');
    const heroTools = $('heroToolsBtn');
    const heroQr = $('heroQrBtn');
    const brand = $('brandHome');

    /* app.js owns the actual toggle; this keeps its state accessible and reliable. */
    if (hamburger) {
      hamburger.addEventListener('click', function () {
        window.setTimeout(function () {
          const sidebar = $('sidebar');
          setDrawer(!!sidebar && sidebar.classList.contains('open'));
        }, 0);
      });
    }
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    if (heroTools) heroTools.addEventListener('click', function () {
      setDrawer(true);
      const firstTool = $('sidebarContent') && $('sidebarContent').querySelector('[data-tool]');
      if (firstTool) firstTool.click();
    });
    if (heroQr) heroQr.addEventListener('click', function () { window.location.hash = '#/qrcode'; });

    if (brand) brand.addEventListener('click', function (e) {
      e.preventDefault();
      closeDrawer();
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.addEventListener('click', function (e) {
      const item = e.target.closest && e.target.closest('#sidebarContent [data-tool]');
      if (item) {
        closeDrawer();
        window.setTimeout(refreshPageMode, 0);
      } else if (e.target.closest && e.target.closest('[data-modal]')) {
        closeDrawer();
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    window.addEventListener('hashchange', refreshPageMode);
  }

  function hardenConsentPopup() {
    const banner = $('cookieBanner'), accept = $('cookieAcceptBtn'), decline = $('cookieDeclineBtn');
    if (!banner) return;
    let consent = null;
    try { consent = localStorage.getItem('tp_consent'); } catch (_) {}
    banner.classList.toggle('show', !consent);
    banner.setAttribute('aria-hidden', consent ? 'true' : 'false');

    function save(value) {
      try { localStorage.setItem('tp_consent', value); } catch (_) {}
      banner.classList.remove('show');
      banner.setAttribute('aria-hidden', 'true');
    }
    if (accept) accept.addEventListener('click', function () { save('all'); });
    if (decline) decline.addEventListener('click', function () { save('necessary'); });
  }

  function boot() {
    try { sessionStorage.setItem('tp_ui_build', '2026-08-27-ui2'); } catch (_) {}
    installNavigationGuards();
    refreshPageMode();
    hardenConsentPopup();
    const year = $('yearNow');
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
