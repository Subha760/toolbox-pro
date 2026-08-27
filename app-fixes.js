/* Toolbox Pro - final navigation, landing and reliability layer. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  function injectFixes() {
    if ($('tpFinalFixes')) return;
    const s = document.createElement('style');
    s.id = 'tpFinalFixes';
    s.textContent = `
      /* LANDING: never hide the shell because the hamburger lives in the header/shell flow. */
      body.landing-mode .app-shell { display:block !important; min-height:0 !important; }
      body.landing-mode .app-shell .main { display:none !important; }
      body.landing-mode .sidebar { display:block !important; visibility:hidden; pointer-events:none; }
      body.landing-mode .sidebar.open { visibility:visible; pointer-events:auto; }
      body:not(.landing-mode) .landing { display:none !important; }
      body:not(.landing-mode) .site-footer { display:block !important; }

      /* Real drawer on every screen size. */
      .sidebar {
        position:fixed !important; left:0 !important; top:66px !important; bottom:0 !important;
        width:min(340px,88vw) !important; height:auto !important; max-height:none !important;
        overflow-y:auto !important; transform:translate3d(-110%,0,0) !important;
        visibility:hidden; pointer-events:none; z-index:5000 !important;
        transition:transform .3s cubic-bezier(.4,0,.2,1),visibility 0s linear .3s !important;
        box-shadow:18px 0 70px rgba(0,0,0,.55);
      }
      .sidebar.open { transform:translate3d(0,0,0) !important; visibility:visible !important; pointer-events:auto !important; transition:transform .3s cubic-bezier(.4,0,.2,1),visibility 0s !important; }
      .tool-drawer-backdrop { display:none !important; position:fixed !important; inset:0 !important; z-index:4990 !important; }
      body.drawer-open .tool-drawer-backdrop { display:block !important; background:rgba(0,0,0,.62) !important; }
      body.drawer-open { overflow:hidden !important; }

      /* Logo */
      .brand-mark.tp-logo { background:transparent !important; box-shadow:none !important; padding:0 !important; overflow:hidden; }
      .brand-mark.tp-logo img { width:100%; height:100%; display:block; object-fit:contain; }
      .landing-logo { width:64px; height:64px; border-radius:18px; margin-bottom:18px; box-shadow:0 18px 50px rgba(124,92,255,.3); }

      /* Animated product-showcase / video-style hero. */
      .tp-showcase { margin-top:34px; position:relative; min-height:130px; padding:18px; border:1px solid rgba(255,255,255,.12); border-radius:22px; background:linear-gradient(135deg,rgba(124,92,255,.12),rgba(34,211,238,.06)); overflow:hidden; }
      .tp-showcase:before { content:""; position:absolute; width:220px; height:220px; border-radius:50%; background:rgba(124,92,255,.2); filter:blur(45px); left:-70px; top:-110px; animation:tpGlow 5s ease-in-out infinite alternate; }
      .tp-showcase:after { content:""; position:absolute; width:180px; height:180px; border-radius:50%; background:rgba(34,211,238,.13); filter:blur(40px); right:-60px; bottom:-100px; animation:tpGlow 6s ease-in-out infinite alternate-reverse; }
      @keyframes tpGlow { to { transform:translate(55px,35px) scale(1.25); opacity:.55; } }
      .tp-showcase-track { position:relative; z-index:2; display:flex; gap:10px; overflow:hidden; }
      .tp-show-card { flex:0 0 145px; height:92px; padding:13px; border:1px solid rgba(255,255,255,.1); border-radius:16px; background:rgba(10,9,24,.62); backdrop-filter:blur(12px); animation:tpSlide 10s linear infinite; }
      @keyframes tpSlide { 0%,100%{transform:translateY(5px)} 50%{transform:translateY(-8px)} }
      .tp-show-card b{display:block;font-size:.72rem;margin-top:9px}.tp-show-card small{display:block;color:var(--text-3);font-size:.58rem;margin-top:4px}.tp-show-icon{font-size:1.25rem}

      @media(max-width:768px){
        .sidebar{top:61px !important;width:min(330px,90vw) !important;}
        .hamburger{display:inline-flex !important;position:relative !important;z-index:6000 !important;touch-action:manipulation !important;}
        .landing{padding-top:18px !important;}
        .tp-showcase{margin-top:24px;}
      }
    `;
    document.head.appendChild(s);
  }

  function setDrawer(open) {
    const sidebar=$('sidebar'), backdrop=$('toolDrawerBackdrop'), button=$('hamburgerBtn');
    if(!sidebar) return;
    sidebar.classList.toggle('open',open);
    sidebar.setAttribute('aria-hidden',open?'false':'true');
    if(backdrop) backdrop.setAttribute('aria-hidden',open?'false':'true');
    if(button) button.setAttribute('aria-expanded',open?'true':'false');
    document.body.classList.toggle('drawer-open',open);
  }

  function landingState() {
    const toolHash=/^#\/[^/]+/.test(location.hash);
    document.body.classList.toggle('landing-mode',!toolHash);
    if(toolHash) setDrawer(false);
  }

  function installHamburger() {
    const button=$('hamburgerBtn');
    if(!button || button.dataset.tpBound) return;
    button.dataset.tpBound='1';
    /* Stop the old app handler from producing an inconsistent second toggle. */
    button.addEventListener('click',function(e){
      e.preventDefault(); e.stopImmediatePropagation();
      const sidebar=$('sidebar');
      setDrawer(!(sidebar && sidebar.classList.contains('open')));
    },true);
    const backdrop=$('toolDrawerBackdrop');
    if(backdrop) backdrop.addEventListener('click',()=>setDrawer(false),true);
  }

  function installToolClicks() {
    document.addEventListener('click',function(e){
      const item=e.target.closest && e.target.closest('#sidebarContent [data-tool]');
      if(!item) return;
      const key=item.dataset.tool;
      if(!key) return;
      e.preventDefault();
      setDrawer(false);
      /* Use the existing app router when available; otherwise hash routing still works. */
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
    });
  }

  function installLogo() {
    const mark=document.querySelector('.brand-mark');
    if(mark && !mark.classList.contains('tp-logo')){
      mark.classList.add('tp-logo');
      mark.textContent='';
      const img=document.createElement('img'); img.src='logo.svg'; img.alt='Toolbox Pro logo'; mark.appendChild(img);
    }
    const landing=document.querySelector('.landing-inner');
    if(landing && !landing.querySelector('.landing-logo')){
      const img=document.createElement('img'); img.className='landing-logo'; img.src='logo.svg'; img.alt='Toolbox Pro';
      const first=landing.querySelector('.hero-copy'); if(first) first.insertBefore(img,first.firstChild);
    }
  }

  function installShowcase() {
    const landing=document.querySelector('.landing-inner');
    if(!landing || landing.querySelector('.tp-showcase')) return;
    const box=document.createElement('div'); box.className='tp-showcase';
    box.innerHTML='<div class="tp-showcase-track">'+[
      ['⚡','Instant Tools','No waiting'],['🖼️','Image Studio','Edit locally'],['📄','PDF Power','Create & convert'],['🔐','Secure Utilities','Private by design'],['🧮','Smart Calculators','Fast results']
    ].map(x=>`<div class="tp-show-card"><div class="tp-show-icon">${x[0]}</div><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')+'</div>';
    landing.appendChild(box);
  }

  function resetBrokenLandingHash() {
    /* app.js treats an empty hash as QR Code. Replace that default after its startup handler. */
    if(location.hash==='#/qrcode' && !sessionStorage.getItem('tpExplicitTool')){
      history.replaceState(null,'',location.pathname+location.search);
      document.body.classList.add('landing-mode');
    }
  }

  function boot() {
    injectFixes();
    installHamburger();
    installToolClicks();
    installSearch();
    installLogo();
    installShowcase();
    landingState();
    resetBrokenLandingHash();
    const year=$('yearNow'); if(year) year.textContent=new Date().getFullYear();
    const banner=$('cookieBanner');
    if(banner){
      let c=null; try{c=localStorage.getItem('tp_consent')}catch(_){ }
      banner.classList.toggle('show',!c);
      banner.setAttribute('aria-hidden',c?'true':'false');
    }
  }

  window.addEventListener('hashchange',function(){
    if(/^#\/[^/]+/.test(location.hash)) sessionStorage.setItem('tpExplicitTool','1');
    landingState();
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});
  else setTimeout(boot,0);
})();
