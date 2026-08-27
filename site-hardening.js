/* Toolidea production UI hardening: single mobile drawer + cookie/advertising consent UI. */
(function () {
  'use strict';

  function addStyles() {
    if (document.getElementById('toolidea-hardening-css')) return;
    var s = document.createElement('style');
    s.id = 'toolidea-hardening-css';
    s.textContent = `
      /* One authoritative mobile drawer. */
      @media (max-width:900px){
        body.ti-drawer-open{overflow:hidden!important}
        .sidebar#sidebar{
          position:fixed!important;left:0!important;top:0!important;
          width:min(300px,82vw)!important;height:100dvh!important;max-height:100dvh!important;
          transform:translate3d(-105%,0,0)!important;z-index:1001!important;
          background:#fff!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
          box-shadow:18px 0 45px rgba(27,39,75,.20)!important;
          transition:transform .22s cubic-bezier(.2,.8,.2,1)!important;
          overflow-y:auto!important;padding-top:78px!important;
        }
        .sidebar#sidebar.ti-drawer-visible{transform:translate3d(0,0,0)!important}
        .ti-drawer-backdrop{position:fixed;inset:0;background:rgba(20,28,55,.22);z-index:1000;display:none;opacity:0;transition:opacity .18s ease}
        .ti-drawer-backdrop.visible{display:block;opacity:1}
        .site-header{z-index:1002!important}
        .hamburger{z-index:1003!important}
      }
      @media(min-width:901px){.ti-drawer-backdrop{display:none!important}}

      /* Cookie / advertising consent popup. It is shown once until a choice is saved. */
      .ti-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2000;max-width:720px;margin:auto;padding:18px 20px;border:1px solid rgba(82,73,180,.18);border-radius:20px;background:rgba(255,255,255,.97);box-shadow:0 22px 70px rgba(30,39,78,.22);font-family:Inter,system-ui,sans-serif;color:#26324f}
      .ti-consent h3{margin:0 0 7px;font-size:1rem}.ti-consent p{margin:0;color:#5d6b86;font-size:.82rem;line-height:1.55}.ti-consent-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.ti-consent-actions button{border:0;border-radius:999px;padding:10px 16px;font-weight:800;cursor:pointer}.ti-consent-accept{background:linear-gradient(135deg,#6956ff,#19bff0);color:#fff}.ti-consent-necessary{background:#eef2f7;color:#33415f}.ti-consent-more{background:transparent;color:#5146b8}
      @media(max-width:520px){.ti-consent{left:10px;right:10px;bottom:10px;padding:15px;border-radius:17px}.ti-consent-actions button{flex:1;min-width:120px}}
    `;
    document.head.appendChild(s);
  }

  function installDrawer() {
    var btn = document.getElementById('hamburgerBtn');
    var sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar || btn.dataset.tiDrawerInstalled) return;
    btn.dataset.tiDrawerInstalled = '1';

    var backdrop = document.querySelector('.ti-drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'ti-drawer-backdrop';
      document.body.appendChild(backdrop);
    }

    function close() {
      sidebar.classList.remove('ti-drawer-visible', 'ti-open', 'open');
      backdrop.classList.remove('visible', 'open');
      document.body.classList.remove('ti-drawer-open');
      btn.setAttribute('aria-expanded', 'false');
    }
    function open() {
      sidebar.classList.add('ti-drawer-visible');
      backdrop.classList.add('visible');
      document.body.classList.add('ti-drawer-open');
      btn.setAttribute('aria-expanded', 'true');
    }

    /* Capture phase prevents older menu listeners from toggling a second state. */
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (sidebar.classList.contains('ti-drawer-visible')) close(); else open();
    }, true);
    backdrop.addEventListener('click', close);
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('li,button,a')) setTimeout(close, 0);
    });
    window.addEventListener('hashchange', close);
    window.addEventListener('resize', function () { if (innerWidth > 900) close(); }, { passive: true });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function installConsent() {
    var key = 'toolidea-consent-v1';
    try { if (localStorage.getItem(key)) return; } catch (_) {}
    if (document.getElementById('toolideaConsent')) return;

    var box = document.createElement('section');
    box.id = 'toolideaConsent';
    box.className = 'ti-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Privacy and advertising choices');
    box.innerHTML = `
      <h3>Privacy & advertising choices</h3>
      <p>Toolidea processes supported tools in your browser. When advertising is enabled, advertising partners such as Monetag may use cookies or similar technologies according to their policies. You can choose whether to allow non-essential advertising storage.</p>
      <div class="ti-consent-actions">
        <button type="button" class="ti-consent-accept" data-consent="all">Allow advertising</button>
        <button type="button" class="ti-consent-necessary" data-consent="necessary">Necessary only</button>
        <button type="button" class="ti-consent-more" data-consent="privacy">Privacy policy</button>
      </div>`;
    document.body.appendChild(box);

    box.addEventListener('click', function (e) {
      var action = e.target.closest('[data-consent]');
      if (!action) return;
      var choice = action.dataset.consent;
      if (choice === 'privacy') {
        var modal = document.getElementById('modalOverlay');
        var modalBox = document.getElementById('modalBox');
        if (modal && modalBox && window.POLICIES && POLICIES.privacy) {
          modalBox.innerHTML = POLICIES.privacy;
          modal.classList.add('open');
        }
        return;
      }
      try { localStorage.setItem(key, choice); } catch (_) {}
      box.remove();
    });
  }

  function init() { addStyles(); installDrawer(); installConsent(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  setTimeout(init, 500);
})();
