/* Toolidea final mobile navigation controller.
   Replaces the legacy hamburger node so older listeners cannot intercept it. */
(function () {
  'use strict';

  function boot() {
    var oldBtn = document.getElementById('hamburgerBtn');
    var sidebar = document.getElementById('sidebar');
    if (!oldBtn || !sidebar || document.getElementById('toolideaMenuButton')) return;

    /* Detach every listener previously attached to the legacy hamburger by replacing the node. */
    var btn = oldBtn.cloneNode(true);
    btn.id = 'toolideaMenuButton';
    btn.type = 'button';
    btn.removeAttribute('onclick');
    btn.setAttribute('aria-expanded', 'false');
    oldBtn.parentNode.replaceChild(btn, oldBtn);

    var backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.id = 'toolideaMenuBackdrop';
    backdrop.setAttribute('aria-label', 'Close menu');
    document.body.appendChild(backdrop);

    var open = false;
    function isMobile() { return window.matchMedia('(max-width: 900px)').matches; }
    function render(next) {
      open = !!next && isMobile();
      sidebar.classList.toggle('ti-drawer-visible', open);
      sidebar.classList.remove('ti-open', 'open');
      backdrop.classList.toggle('visible', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close tool categories' : 'Open tool categories');
      document.documentElement.classList.toggle('ti-nav-lock', open);
      document.body.classList.toggle('ti-nav-lock', open);
    }

    var style = document.createElement('style');
    style.id = 'toolidea-final-nav-css';
    style.textContent = `
      @media (max-width:900px) {
        #toolideaMenuButton { display:flex!important; position:relative!important; z-index:10004!important; align-items:center!important; justify-content:center!important; cursor:pointer!important; pointer-events:auto!important; touch-action:manipulation!important; }
        #toolideaMenuButton::before { content:'☰'; font-size:32px; line-height:1; font-family:Arial,sans-serif; }
        #toolideaMenuButton { font-size:0!important; }
        #toolideaMenuButton[aria-expanded="true"]::before { content:'✕'; font-size:30px; }
        #toolideaMenuBackdrop { position:fixed!important; inset:0!important; z-index:9998!important; display:none!important; border:0!important; padding:0!important; margin:0!important; background:rgba(20,28,55,.22)!important; cursor:pointer!important; }
        #toolideaMenuBackdrop.visible { display:block!important; }
        #sidebar { z-index:10003!important; }
        html.ti-nav-lock, body.ti-nav-lock { overflow:hidden!important; overscroll-behavior:none!important; }
        #sidebar h2,#sidebar h3,#sidebar h4,#sidebar .category-title,#sidebar .sidebar-category-title,#sidebar [data-category-title] { font-weight:800!important; }
      }
      @media (min-width:901px) { #toolideaMenuBackdrop { display:none!important; } }
    `;
    document.head.appendChild(style);

    btn.addEventListener('pointerup', function (e) {
      if (!isMobile()) return;
      e.preventDefault();
      e.stopPropagation();
      render(!open);
    }, { passive:false });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
    backdrop.addEventListener('pointerup', function (e) {
      e.preventDefault();
      render(false);
    }, { passive:false });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') render(false); });
    window.addEventListener('resize', function () { if (!isMobile()) render(false); }, { passive:true });
    window.addEventListener('hashchange', function () { render(false); });

    sidebar.addEventListener('click', function (e) {
      var item = e.target && e.target.closest ? e.target.closest('a,button') : null;
      if (item) setTimeout(function () { render(false); }, 50);
    });

    var observer = new MutationObserver(function () {
      sidebar.querySelectorAll('h2,h3,h4,.category-title,.sidebar-category-title,[data-category-title]').forEach(function (el) {
        el.style.fontWeight = '800';
      });
    });
    observer.observe(sidebar, { childList:true, subtree:true });
    render(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
  setTimeout(boot, 250);
  setTimeout(boot, 1000);
})();