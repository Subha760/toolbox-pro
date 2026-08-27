(function(){'use strict';
  const LOGO='https://cdn.phototourl.com/free/2026-08-27-01bf5c9c-8880-4db1-87f7-c3b75410505f.png';
  function byId(id){return document.getElementById(id)}

  function toolCount(){try{return Object.keys(TOOLS).filter(k=>k!=='landing').length}catch(e){return 90}}
  function go(key){if(typeof navigateTo==='function')navigateTo(key)}

  TOOLS.landing={name:'Toolinger',desc:'90+ fast browser tools',render:function(container){
    const count=toolCount();
    const featured=[['qrcode','QR Code'],['idphoto','ID Photo'],['imgtopdf','Images → PDF'],['hasher','SHA-256'],['jsonfmt','JSON Formatter'],['base64','Base64'],['regex','Regex Tester'],['password','Password Generator'],['temp','Temperature'],['age','Age Calculator'],['stopwatch','Stopwatch'],['markdownpreview','Markdown']];
    container.innerHTML=`
      <section class="landing" aria-label="Toolinger landing page">
        <div class="hero">
          <div class="hero-copy reveal">
            <span class="eyebrow"><i class="pulse-dot"></i> A faster everyday toolkit</span>
            <h2>One beautiful place for <em>everything.</em></h2>
            <p>Images, PDFs, text, security, developer utilities, calculators and everyday helpers — designed to run directly in your browser whenever possible.</p>
            <div class="hero-actions"><button class="btn btn-primary" data-open-tools>Explore ${count}+ tools <span>→</span></button><button class="btn btn-secondary" data-scroll-features>See what’s inside</button></div>
            <div class="hero-meta"><span>⚡ <b>Instant</b> tools</span><span>🔒 <b>Private-first</b></span><span>📱 <b>Mobile ready</b></span><span>☁️ <b>No account</b></span></div>
          </div>
          <div class="hero-stage reveal" aria-label="Animated preview of Toolinger">
            <div class="stage-glow"></div><div class="orbit"></div>
            <div class="demo-window">
              <div class="window-top"><i></i><i></i><i></i><span class="window-title">toolinger / workspace</span></div>
              <div class="demo-body"><div class="demo-search">⌕ &nbsp; Search ${count}+ tools...</div><div class="demo-grid">
                <div class="demo-card"><strong>🖼️ Image Studio</strong><span>Resize · Compress · Convert</span><div class="mini-line"></div></div>
                <div class="demo-card"><strong>🔐 Secure Text</strong><span>Hash · Encode · Generate</span><div class="mini-line"></div></div>
                <div class="demo-card"><strong>💻 Developer</strong><span>JSON · Regex · SQL · CSS</span><div class="mini-line"></div></div>
                <div class="demo-card"><strong>📐 Smart Convert</strong><span>Units · Math · Finance</span><div class="mini-line"></div></div>
              </div></div>
            </div>
            <div class="floating-chip chip1">✦ 100% browser-first</div><div class="floating-chip chip2">✓ Ready in seconds</div><div class="floating-chip chip3">⌁ Smooth motion UI</div>
          </div>
        </div>

        <section class="section reveal" id="landingFeatures"><div class="section-head"><div><span class="eyebrow">Why Toolinger</span><h3>Built to feel effortless.</h3></div><p>No clutter on the home screen. Your complete tool library stays one tap away behind the menu.</p></div>
          <div class="feature-grid">
            <article class="feature"><div class="feature-icon">⚡</div><h4>Fast by design</h4><p>Lightweight UI, instant navigation and client-side utilities wherever the browser can do the work.</p></article>
            <article class="feature"><div class="feature-icon">🔒</div><h4>Privacy-first</h4><p>Many tools process files and text locally instead of sending your content to a server.</p></article>
            <article class="feature"><div class="feature-icon">📱</div><h4>Made for phones</h4><p>Large touch targets, a real slide-out tool drawer and layouts designed for narrow screens.</p></article>
            <article class="feature"><div class="feature-icon">✨</div><h4>Beautiful motion</h4><p>Soft depth, animated particles, floating previews and micro-interactions without heavy frameworks.</p></article>
            <article class="feature"><div class="feature-icon">🧩</div><h4>One toolkit</h4><p>Keep everyday image, text, developer, math, conversion, date, finance, health and fun utilities together.</p></article>
            <article class="feature"><div class="feature-icon">🎯</div><h4>No hunting</h4><p>Use the menu or global search to jump straight to the exact tool you need.</p></article>
          </div>
        </section>

        <section class="section reveal"><div class="showcase"><div class="showcase-panel"><span class="eyebrow">Live toolkit</span><h3>Pick a tool. Get it done.</h3><p>The landing page stays calm and focused. The complete library opens only when you ask for it.</p><div class="metrics"><div class="metric"><b>${count}+</b><span>tools available</span></div><div class="metric"><b>10</b><span>tool families</span></div><div class="metric"><b>1 tap</b><span>to open the library</span></div></div></div><div class="showcase-panel"><h3>Popular quick starts</h3><p>These are shortcuts — the full collection remains inside the three-line menu.</p><div class="tool-pills">${featured.map(([key,label])=>`<button type="button" data-tool="${key}">${label}</button>`).join('')}</div></div></div></section>

        <section class="cta reveal"><span class="eyebrow">Ready when you are</span><h3>Your tools are one tap away.</h3><p>Open the library and choose exactly what you need. Nothing else has to get in your way.</p><button class="btn btn-primary" data-open-tools>Open the ${count}+ tool library →</button></section>
      </section>`;

    container.querySelectorAll('[data-open-tools]').forEach(b=>b.addEventListener('click',openDrawer));
    const sf=container.querySelector('[data-scroll-features]'); if(sf)sf.addEventListener('click',()=>byId('landingFeatures')?.scrollIntoView({behavior:'smooth'}));
    container.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tool)));
    requestAnimationFrame(()=>requestAnimationFrame(()=>container.querySelectorAll('.reveal').forEach(x=>x.classList.add('visible'))));
    if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});container.querySelectorAll('.reveal').forEach(x=>io.observe(x))}
  }};

  function syncMenu(){const menu=byId('sidebar'),btn=byId('hamburgerBtn'),back=byId('drawerBackdrop');const open=!!menu?.classList.contains('open');btn?.classList.toggle('is-open',open);btn?.setAttribute('aria-expanded',String(open));back?.classList.toggle('open',open);document.body.classList.toggle('menu-open',open)}
  function openDrawer(){const menu=byId('sidebar');if(!menu)return;menu.classList.add('open');syncMenu()}
  function closeDrawer(){const menu=byId('sidebar');menu?.classList.remove('open');syncMenu()}

  function installNavigation(){
    const hb=byId('hamburgerBtn'),close=byId('drawerClose'),back=byId('drawerBackdrop');
    hb?.addEventListener('click',()=>setTimeout(syncMenu,0));
    close?.addEventListener('click',closeDrawer);back?.addEventListener('click',closeDrawer);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();if(byId('modalOverlay')?.classList.contains('open')&&typeof closeModal==='function')closeModal()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();byId('toolSearch')?.focus()}});
    document.addEventListener('click',e=>{const item=e.target.closest('#sidebarContent li[data-tool]');if(item)setTimeout(closeDrawer,80);const ft=e.target.closest('.footer-tools');if(ft){e.preventDefault();openDrawer()}});
    const search=byId('toolSearch');search?.addEventListener('focus',()=>{if(innerWidth<=768&&search.value.trim())openDrawer()});search?.addEventListener('input',()=>{if(innerWidth<=768&&search.value.trim())openDrawer()});
  }

  function setLandingMode(){const main=byId('mainContent');if(!main)return;const isLanding=(location.hash.replace('#/','').trim()==='landing'||!location.hash);main.classList.toggle('landing-mode',isLanding);if(isLanding)byId('siteHeader')?.classList.add('landing-header')}
  function ensureLanding(){if(!location.hash){history.replaceState(null,'','#/landing')}setLandingMode()}

  document.addEventListener('DOMContentLoaded',()=>{
    ensureLanding();installNavigation();
    const original=window.handleRoute;
    if(typeof original==='function'){
      const wrapped=function(){original();setLandingMode();syncMenu()};
      window.handleRoute=wrapped;
      window.removeEventListener('hashchange',original);
      window.addEventListener('hashchange',wrapped);
      if(location.hash==='#/landing')wrapped();
    }
    byId('yearNow').textContent=new Date().getFullYear();
  });
})();