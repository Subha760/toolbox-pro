/* Final mobile UI fix. This file is already referenced by Index.html and loads before the page finishes booting. */
(function(){
'use strict';
function install(){
  if(window.__toolingerMobileFinal) return;
  window.__toolingerMobileFinal=true;
  const css=document.createElement('style'); css.id='toolinger-mobile-final';
  css.textContent=`
    .brand-mark{overflow:hidden!important;display:grid!important;place-items:center!important;background:#11152b!important}
    .brand-mark img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
    @media(max-width:900px){
      body.landing-mode .landing{display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;min-height:calc(100vh - 150px)!important}
      body.landing-mode .app-shell{display:none!important}
      body.landing-mode .site-footer{display:none!important}
      body.landing-mode .ad-footer,body.landing-mode .ad-incontent{display:none!important}
      body.landing-mode .landing{padding:18px 14px 42px!important}
      body.landing-mode .hero-grid{display:flex!important;flex-direction:column!important;gap:14px!important;padding-top:12px!important}
      body.landing-mode .hero-copy{width:100%!important}
      body.landing-mode .hero-title{font-size:clamp(2.65rem,13.5vw,4.2rem)!important;letter-spacing:-2.5px!important}
      body.landing-mode .hero-copy p{font-size:.92rem!important;line-height:1.6!important}
      body.landing-mode .motion-stage{width:100%!important;min-height:330px!important;order:2!important}
      body.landing-mode .landing-features{display:grid!important;grid-template-columns:1fr!important}
      .site-header{position:relative!important;z-index:3000!important;display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:10px!important;padding:10px 14px!important}
      .hamburger{display:inline-flex!important;flex:0 0 48px!important;width:48px!important;height:48px!important;z-index:3002!important;cursor:pointer!important;touch-action:manipulation!important}
      .brand{display:flex!important;align-items:center!important;min-width:0!important}
      .brand-mark{width:48px!important;height:48px!important;flex:0 0 48px!important;border-radius:14px!important}
      .brand-text strong{font-size:1.05rem!important}
      .header-search{order:5!important;flex:1 1 100%!important;width:100%!important;margin:2px 0 0!important}
      .header-search input{width:100%!important;min-height:48px!important;font-size:16px!important}
      .header-nav{display:none!important}
      #sidebar{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:min(330px,88vw)!important;height:100dvh!important;max-height:none!important;padding:82px 0 24px!important;margin:0!important;overflow-y:auto!important;background:#101025!important;z-index:3001!important;transform:translate3d(-110%,0,0)!important;visibility:hidden!important;opacity:1!important;pointer-events:none!important;transition:transform .24s ease,visibility 0s linear .24s!important;box-shadow:18px 0 60px rgba(0,0,0,.45)!important}
      #sidebar.toolinger-open{transform:translate3d(0,0,0)!important;visibility:visible!important;pointer-events:auto!important}
      #toolingerMobileBackdrop{position:fixed!important;inset:0!important;background:rgba(8,10,25,.62)!important;backdrop-filter:blur(4px)!important;z-index:3000!important;display:none!important}
      #toolingerMobileBackdrop.show{display:block!important}
      body.toolinger-lock{overflow:hidden!important}
      body.toolinger-lock .landing,body.toolinger-lock .ad-leaderboard{filter:blur(2px)!important}
      body:not(.toolinger-lock) #toolingerMobileBackdrop{display:none!important}
    }
  `;
  document.head.appendChild(css);

  function fixLogo(){
    document.querySelectorAll('.brand-mark').forEach(m=>{
      let img=m.querySelector('img');
      if(!img){img=document.createElement('img');m.textContent='';m.appendChild(img)}
      img.src='./toolinger-logo.svg?v=4';img.alt='Toolinger logo';img.loading='eager';
    });
    document.querySelectorAll('.brand-text strong').forEach(e=>e.textContent='Toolinger');
    document.querySelectorAll('.brand-text span').forEach(e=>e.textContent='90+ ONLINE TOOLS');
    document.title='Toolinger – 90+ Free Online Tools';
  }

  function landingFix(){
    const page=document.getElementById('landingPage');
    if(!page) return;
    const hasHash=location.hash && location.hash.replace(/^#\/?/,'').trim();
    document.body.classList.toggle('landing-mode',!hasHash);
    if(!hasHash){
      page.hidden=false;page.style.removeProperty('display');page.style.removeProperty('visibility');page.style.removeProperty('opacity');
    }
  }

  function nav(){
    const btn=document.getElementById('hamburgerBtn'), drawer=document.getElementById('sidebar');
    if(!btn||!drawer||btn.dataset.tiFinalNav)return;
    btn.dataset.tiFinalNav='1';
    let back=document.getElementById('toolingerMobileBackdrop');
    if(!back){back=document.createElement('div');back.id='toolingerMobileBackdrop';document.body.appendChild(back)}
    const setOpen=(v)=>{
      const open=!!v; drawer.classList.toggle('toolinger-open',open); document.body.classList.toggle('toolinger-lock',open); back.classList.toggle('show',open); btn.setAttribute('aria-expanded',String(open)); btn.setAttribute('aria-label',open?'Close tools menu':'Open tools menu');
    };
    btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();setOpen(!drawer.classList.contains('toolinger-open'))},{capture:true});
    back.addEventListener('click',()=>setOpen(false));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
    drawer.addEventListener('click',e=>{const item=e.target.closest('[data-tool]');if(item){setOpen(false)}});
    addEventListener('hashchange',()=>{setOpen(false);landingFix()});
    addEventListener('resize',()=>{if(innerWidth>900)setOpen(false)},{passive:true});
  }

  function run(){fixLogo();landingFix();nav();}
  run();
  setTimeout(run,300);setTimeout(run,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
