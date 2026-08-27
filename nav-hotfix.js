/* Toolidea navigation hotfix: deliberately independent from legacy menu handlers. */
(function () {
  'use strict';
  var installed = false;

  function boot() {
    if (installed) return;
    var btn = document.getElementById('hamburgerBtn');
    var sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;
    installed = true;

    var backdrop = document.getElementById('tiNavBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'tiNavBackdrop';
      document.body.appendChild(backdrop);
    }

    var openState = false;
    var suppressClick = false;

    function mobile() { return window.innerWidth <= 900; }
    function paint(open) {
      openState = !!open && mobile();
      sidebar.classList.toggle('ti-drawer-visible', openState);
      sidebar.classList.remove('ti-open', 'open');
      sidebar.style.setProperty('transform', openState ? 'translate3d(0,0,0)' : 'translate3d(-110%,0,0)', 'important');
      sidebar.style.setProperty('visibility', openState ? 'visible' : 'hidden', 'important');
      sidebar.style.setProperty('pointer-events', openState ? 'auto' : 'none', 'important');
      backdrop.classList.toggle('ti-nav-visible', openState);
      backdrop.style.setProperty('display', openState ? 'block' : 'none', 'important');
      backdrop.style.setProperty('pointer-events', openState ? 'auto' : 'none', 'important');
      btn.setAttribute('aria-expanded', openState ? 'true' : 'false');
      btn.setAttribute('aria-label', openState ? 'Close tool categories' : 'Open tool categories');
      document.documentElement.classList.toggle('ti-nav-lock', openState);
      document.body.classList.toggle('ti-nav-lock', openState);
    }

    var css = document.createElement('style');
    css.id = 'ti-nav-hotfix-css';
    css.textContent = `
      @media(max-width:900px){
        #tiNavBackdrop{position:fixed!important;inset:0!important;background:rgba(20,28,55,.22)!important;z-index:9998!important;display:none;pointer-events:none;}
        #sidebar{z-index:9999!important;}
        #hamburgerBtn{z-index:10000!important;position:relative!important;pointer-events:auto!important;touch-action:manipulation!important;}
        html.ti-nav-lock,body.ti-nav-lock{overflow:hidden!important;touch-action:none!important;}
        #sidebar .sidebar-category-title,#sidebar h2,#sidebar h3,#sidebar h4,#sidebar .category-title,#sidebar [data-category-title]{font-weight:800!important;}
      }
    `;
    document.head.appendChild(css);

    /* Window capture is used so legacy document-level handlers cannot cancel the tap first. */
    window.addEventListener('pointerdown', function (e) {
      if (!mobile()) return;
      var target = e.target && e.target.closest ? e.target.closest('#hamburgerBtn') : null;
      if (target) {
        e.preventDefault();
        e.stopImmediatePropagation();
        suppressClick = true;
        paint(!openState);
      }
    }, true);

    window.addEventListener('click', function (e) {
      if (!mobile()) return;
      var target = e.target && e.target.closest ? e.target.closest('#hamburgerBtn') : null;
      if (target) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (suppressClick) { suppressClick = false; return; }
        paint(!openState);
        return;
      }
      var bg = e.target && e.target.closest ? e.target.closest('#tiNavBackdrop') : null;
      if (bg) { e.preventDefault(); e.stopImmediatePropagation(); paint(false); }
    }, true);

    window.addEventListener('resize', function () { if (!mobile()) paint(false); }, { passive:true });
    window.addEventListener('orientationchange', function () { setTimeout(function(){ if (!mobile()) paint(false); }, 80); }, { passive:true });
    window.addEventListener('hashchange', function () { if (openState) paint(false); });
    window.addEventListener('pageshow', function () { paint(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') paint(false); }, true);

    sidebar.addEventListener('click', function (e) {
      if (!mobile()) return;
      var item = e.target && e.target.closest ? e.target.closest('a,button') : null;
      if (item) setTimeout(function(){ paint(false); }, 80);
    }, true);

    /* Keep generated category headings bold. */
    function bold() { sidebar.querySelectorAll('h2,h3,h4,.category-title,.sidebar-category-title,[data-category-title]').forEach(function(el){el.style.fontWeight='800';}); }
    bold();
    new MutationObserver(bold).observe(sidebar, {childList:true,subtree:true});
    paint(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  setTimeout(boot, 100);
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
})();