/* Toolbox Pro - mobile-first navigation, landing and reliability layer. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  function injectFixes() {
    if ($('tpMobileFixes')) return;
    const s = document.createElement('style');
    s.id = 'tpMobileFixes';
    s.textContent = `
      /* Keep the landing page clean. The library is ONLY the drawer. */
      body.landing-mode .app-shell { display:block !important; min-height:0 !important; }
      body.landing-mode .app-shell .main { display:none !important; }
      body.landing-mode .sidebar { visibility:hidden !important; pointer-events:none !important; }
      body.landing-mode .sidebar.open { visibility:visible !important; pointer-events:auto !important; }
      body:not(.landing-mode) .landing { display:none !important; }

      /* Universal drawer. */
      .sidebar {
        position:fixed !important;
        left:0 !important;
        top:0 !important;
        bottom:0 !important;
        width:min(360px,88vw) !important;
        height:100dvh !important;
        max-height:none !important;
        padding:78px 0 28px !important;
        overflow-x:hidden !important;
        overflow-y:auto !important;
        transform:translate3d(-105%,0,0) !important;
        visibility:hidden !important;
        pointer-events:none !important;
        z-index:10000 !important;
        box-shadow:24px 0 70px rgba(0,0,0,.55) !important;
        transition:transform .28s ease, visibility 0s linear .28s !important;
      }
      .sidebar.open {
        transform:translate3d(0,0,0) !important;
        visibility:visible !important;
        pointer-events:auto !important;
        transition:transform .28s ease, visibility 0s !important;
      }
      .tool-drawer-backdrop {
        position:fixed !important;
        inset:0 !important;
        display:none !important;
        z-index:9990 !important;
        background:rgba(5,5,15,.68) !important;
        -webkit-backdrop-filter:blur(4px) !important;
        backdrop-filter:blur(4px) !important;
      }
      body.drawer-open .tool-drawer-backdrop { display:block !important; }
      body.drawer-open { overflow:hidden !important; }

      /* Header stays above everything and is touch friendly. */
      .site-header { position:sticky !important; top:0 !important; z-index:11000 !important; }
      .hamburger {
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        width:42px !important;
        height:42px !important;
        min-width:42px !important;
        border:1px solid rgba(255,255,255,.18) !important;
        background:rgba(255,255,255,.09) !important;
        color:#fff !important;
        border-radius:12px !important;
        cursor:pointer !important;
        touch-action:manipulation !important;
        -webkit-tap-highlight-color:transparent !important;
        position:relative !important;
        z-index:11001 !important;
      }
      .hamburger .hamburger-lines,
      .hamburger .hamburger-lines:before,
      .hamburger .hamburger-lines:after {
        display:block !important;
        width:20px !important;
        height:2px !important;
        border-radius:4px !important;
        background:#fff !important;
        content:"" !important;
      }
      .hamburger .hamburger-lines { position:relative !important; }
      .hamburger .hamburger-lines:before { position:absolute !important; top:-6px !important; left:0 !important; }
      .hamburger .hamburger-lines:after { position:absolute !important; top:6px !important; left:0 !important; }

      /* Real logo image, never emoji. */
      .brand-mark.tp-logo { background:transparent !important; box-shadow:none !important; padding:0 !important; overflow:hidden !important; }
      .brand-mark.tp-logo img { display:block !important; width:100% !important; height:100% !important; object-fit:contain !important; }

      /* Remove category cards/menus from the landing page if any old markup exists. */
      body.landing-mode .landing .category-grid,
      body.landing-mode .landing .categories,
      body.landing-mode .landing .category-list,
      body.landing-mode .landing [data-category-grid],
      body.landing-mode .landing [data-categories] { display:none !important; }

      /* Mobile-only redesign. Desktop remains unchanged. */
      @media (max-width:768px) {
        html,body { width:100%; min-width:0; overflow-x:hidden !important; }
        .site-header {
          height:58px !important;
          padding:8px 10px !important;
          gap:9px !important;
          background:rgba(10,9,24,.94) !important;
        }
        .brand { gap:7px !important; min-width:0 !important; }
        .brand-mark { width:34px !important; height:34px !important; border-radius:9px !important; }
        .brand-text strong { font-size:.88rem !important; white-space:nowrap !important; }
        .brand-text span { display:none !important; }
        .header-search {
          order:initial !important;
          flex:1 !important;
          min-width:0 !important;
          max-width:none !important;
          padding:7px 10px !important;
          height:38px !important;
        }
        .header-search input { font-size:.74rem !important; min-width:0 !important; }
        .header-nav { display:none !important; }

        .ad-leaderboard {
          width:calc(100% - 20px) !important;
          min-height:62px !important;
          margin:10px auto 0 !important;
          border-radius:14px !important;
        }
        .ad-placeholder { min-height:30px !important; }

        .landing {
          min-height:calc(100dvh - 58px) !important;
          padding:18px 12px 40px !important;
        }
        .landing-inner { width:100% !important; max-width:none !important; }
        .hero-grid { display:block !important; min-height:0 !important; padding-top:0 !important; }
        .hero-copy { width:100% !important; }
        .landing-logo { width:54px !important; height:54px !important; border-radius:15px !important; margin-bottom:12px !important; }
        .eyebrow { font-size:.62rem !important; padding:6px 9px !important; }
        .hero-title {
          font-size:clamp(2.45rem,12.5vw,3.7rem) !important;
          line-height:.96 !important;
          letter-spacing:-2px !important;
          margin-top:14px !important;
        }
        .hero-copy p { font-size:.84rem !important; line-height:1.55 !important; margin-top:15px !important; }
        .hero-actions { display:grid !important; grid-template-columns:1fr !important; gap:8px !important; margin-top:18px !important; }
        .hero-actions .btn,.hero-secondary { width:100% !important; min-height:44px !important; margin:0 !important; }
        .hero-stats { gap:12px !important; margin-top:20px !important; }
        .hero-stat { flex:1 !important; min-width:0 !important; padding:10px 8px !important; border:1px solid rgba(255,255,255,.08); border-radius:12px; background:rgba(255,255,255,.04); }
        .hero-stat strong { font-size:1.05rem !important; }
        .hero-stat span { font-size:.58rem !important; letter-spacing:.5px !important; }

        .motion-stage { min-height:285px !important; margin-top:8px !important; }
        .motion-glow { width:280px !important; height:280px !important; }
        .motion-window { width:100% !important; max-width:430px !important; transform:none !important; animation:floatWindowMobile 5s ease-in-out infinite !important; border-radius:18px !important; }
        @keyframes floatWindowMobile { 50% { transform:translateY(-7px) !important; } }
        .motion-screen { padding:13px !important; }
        .motion-tools { grid-template-columns:repeat(3,1fr) !important; gap:6px !important; }
        .motion-tool { height:67px !important; padding:8px !important; border-radius:10px !important; }
        .motion-icon { width:22px !important; height:22px !important; margin-bottom:5px !important; font-size:.68rem !important; }
        .motion-tool b { font-size:.55rem !important; }
        .motion-tool small { font-size:.45rem !important; }
        .motion-badge { right:3px !important; top:26px !important; padding:7px 8px !important; font-size:.5rem !important; }
        .motion-badge br { display:none !important; }
        .landing-features { grid-template-columns:1fr !important; gap:9px !important; margin-top:12px !important; }
        .feature-card { padding:15px !important; border-radius:14px !important; }
        .feature-card .feature-icon { font-size:1.2rem !important; margin-bottom:7px !important; }
        .feature-card h3 { font-size:.86rem !important; }
        .feature-card p { font-size:.68rem !important; }
        .landing-note { font-size:.66rem !important; margin-top:14px !important; }

        /* Tool page mobile layout. */
        .main { padding:16px 12px 40px !important; }
        .tool-header h1 { font-size:1.45rem !important; }
        .tool-header p { font-size:.78rem !important; }
        .tool-content { padding:18px 14px !important; border-radius:16px !important; width:100% !important; }
        .row { flex-direction:column !important; align-items:stretch !important; gap:8px !important; }
        .row > * { width:100% !important; max-width:100% !important; }
        .tool-content input,.tool-content select,.tool-content textarea { font-size:16px !important; }
        .tool-content .btn { width:100% !important; margin-left:0 !important; margin-right:0 !important; }

        /* Drawer typography and touch targets. */
        .sidebar { padding-top:70px !important; }
        .sidebar ul { padding:3px 10px !important; }
        .category-heading { padding:14px 16px 6px !important; font-size:.66rem !important; }
        .sidebar ul li { min-height:42px !important; padding:10px 12px !important; font-size:.79rem !important; }
      }
    `;
    document.head.appendChild(s);
  }

  function setDrawer(open) {
    const sidebar=$('sidebar'), backdrop=$('toolDrawerBackdrop'), button=$('hamburgerBtn');
    if(!sidebar) return;
    sidebar.classList.toggle('open',!!open);
    sidebar.setAttribute('aria-hidden',open?'false':'true');
    if(backdrop) backdrop.setAttribute('aria-hidden',open?'false':'true');
    if(button) {
      button.setAttribute('aria-expanded',open?'true':'false');
      button.setAttribute('aria-label',open?'Close tools menu':'Open tools menu');
    }
    document.body.classList.toggle('drawer-open',!!open);
  }

  function installHamburger() {
    const button=$('hamburgerBtn');
    if(!button || button.dataset.tpBound) return;
    button.dataset.tpBound='1';
    button.addEventListener('click',function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      const sidebar=$('sidebar');
      setDrawer(!(sidebar && sidebar.classList.contains('open')));
    },true);
    const backdrop=$('toolDrawerBackdrop');
    if(backdrop && !backdrop.dataset.tpBound){
      backdrop.dataset.tpBound='1';
      backdrop.addEventListener('click',function(e){e.preventDefault();setDrawer(false);},true);
    }
  }

  function installToolClicks() {
    if(document.documentElement.dataset.tpToolClicks) return;
    document.documentElement.dataset.tpToolClicks='1';
    document.addEventListener('click',function(e){
      const item=e.target.closest && e.target.closest('#sidebarContent [data-tool]');
      if(!item) return;
      const key=item.dataset.tool;
      if(!key) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setDrawer(false);
      try { sessionStorage.setItem('tpExplicitTool','1'); } catch(_) {}
      location.hash='#/'+key;
    },true);
  }

  function installSearch() {
    const input=$('toolSearch');
    if(!input || input.dataset.tpBound) return;
    input.dataset.tpBound='1';
    input.addEventListener('input',function(){
      const q=this.value.trim().toLowerCase();
      document.querySelectorAll('#sidebarContent [data-tool]').forEach(li=>{
        li.classList.toggle('hidden',!!q && !li.textContent.toLowerCase().includes(q));
      });
      /* Searching is a request to use the drawer. */
      if(q) setDrawer(true);
    });
  }

  function installLogo() {
    document.querySelectorAll('.brand-mark').forEach(mark=>{
      if(mark.classList.contains('tp-logo')) return;
      mark.classList.add('tp-logo');
      mark.textContent='';
      const img=document.createElement('img');
      img.src='logo.svg?v=20260827m1';
      img.alt='Toolbox Pro logo';
      mark.appendChild(img);
    });
    const landing=document.querySelector('.landing-inner');
    if(landing && !landing.querySelector('.landing-logo')){
      const img=document.createElement('img');
      img.className='landing-logo';
      img.src='logo.svg?v=20260827m1';
      img.alt='Toolbox Pro';
      const first=landing.querySelector('.hero-copy');
      if(first) first.insertBefore(img,first.firstChild);
    }
  }

  function installShowcase() {
    const landing=document.querySelector('.landing-inner');
    if(!landing || landing.querySelector('.tp-showcase')) return;
    const box=document.createElement('div');
    box.className='tp-showcase';
    box.innerHTML='<div class="tp-showcase-track">'+[
      ['⚡','Instant Tools','No waiting'],['🖼️','Image Studio','Edit locally'],['📄','PDF Power','Create & convert'],['🔐','Secure Utilities','Private by design'],['🧮','Smart Calculators','Fast results']
    ].map(x=>`<div class="tp-show-card"><div class="tp-show-icon">${x[0]}</div><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')+'</div>';
    landing.appendChild(box);
  }

  function landingState(){
    const hasTool=/^#\/[^/]+/.test(location.hash);
    document.body.classList.toggle('landing-mode',!hasTool);
    if(hasTool) setDrawer(false);
  }

  function boot(){
    injectFixes();
    installHamburger();
    installToolClicks();
    installSearch();
    installLogo();
    installShowcase();
    landingState();
    const year=$('yearNow'); if(year) year.textContent=new Date().getFullYear();
    const banner=$('cookieBanner');
    if(banner){
      let c=null; try{c=localStorage.getItem('tp_consent')}catch(_){}
      banner.classList.toggle('show',!c);
      banner.setAttribute('aria-hidden',c?'true':'false');
    }
  }

  window.addEventListener('hashchange',function(){
    if(/^#\/[^/]+/.test(location.hash)) { try{sessionStorage.setItem('tpExplicitTool','1')}catch(_){} }
    landingState();
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});
  else setTimeout(boot,0);
})();
