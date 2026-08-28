(()=>{
'use strict';
const $=s=>document.querySelector(s);
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
ready(()=>{
  const body=document.body,home=$('#landingHome'),shell=$('#appShell'),sidebar=$('#sidebar'),header=$('#siteHeader');
  if(!home||!shell||!sidebar||!header)return;

  const menu=$('#hamburgerBtn');
  let backdrop=$('#toolingerBackdrop');
  if(!backdrop){
    backdrop=document.createElement('button');
    backdrop.id='toolingerBackdrop';
    backdrop.type='button';
    backdrop.setAttribute('aria-label','Close tools');
    backdrop.setAttribute('aria-hidden','true');
    document.body.appendChild(backdrop);
  }

  const isMobile=()=>window.matchMedia('(max-width: 900px)').matches;
  const close=()=>{
    sidebar.classList.remove('open');
    menu?.classList.remove('is-open');
    menu?.setAttribute('aria-expanded','false');
    backdrop.classList.remove('show');
    backdrop.setAttribute('aria-hidden','true');
    body.classList.remove('drawer-open');
  };
  const open=()=>{
    if(!isMobile()) return;
    sidebar.classList.add('open');
    menu?.classList.add('is-open');
    menu?.setAttribute('aria-expanded','true');
    backdrop.classList.add('show');
    backdrop.setAttribute('aria-hidden','false');
    body.classList.add('drawer-open');
  };
  const toggle=()=>sidebar.classList.contains('open')?close():open();

  /* Capture the hamburger click before app.js can toggle it a second time. */
  document.addEventListener('click',e=>{
    const target=e.target.closest?.('#hamburgerBtn');
    if(!target)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    toggle();
  },true);
  backdrop.addEventListener('click',e=>{e.preventDefault();close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  document.addEventListener('click',e=>{if(e.target.closest('#sidebarContent li'))close();});
  document.addEventListener('touchend',e=>{if(e.target.closest('#sidebarContent li'))close();});
  window.addEventListener('resize',()=>{if(!isMobile())close();},{passive:true});
  window.__toolingerCloseMenu=close;
  window.__toolingerToggleMenu=toggle;

  const initial=(window.__TOOLINGER_INITIAL_HASH||'').trim();
  const explicitTool=!!initial&&initial!=='#'&&initial!=='#/';
  let landingBoot=!explicitTool;
  function isHome(){const h=location.hash.trim();return !h||h==='#'||h==='#/';}
  function showHome(){
    home.hidden=false;home.classList.add('is-visible');shell.classList.remove('is-tool');
    const title=$('#toolHeader'),content=$('#toolContainer');if(title)title.hidden=true;if(content)content.hidden=true;
    document.querySelectorAll('.ad-incontent').forEach(x=>x.hidden=true);
    body.classList.add('home-view');body.classList.remove('tool-view');
    document.title='Toolinger — 90+ Free Online Tools';
    close();
  }
  function showTool(){
    home.hidden=true;home.classList.remove('is-visible');shell.classList.add('is-tool');
    const title=$('#toolHeader'),content=$('#toolContainer');if(title)title.hidden=false;if(content)content.hidden=false;
    document.querySelectorAll('.ad-incontent').forEach(x=>x.hidden=false);
    body.classList.remove('home-view');body.classList.add('tool-view');
    close();
  }
  if(!explicitTool){
    if(location.hash)history.replaceState(null,'',location.pathname+location.search);
    showHome();
    setTimeout(()=>{if(landingBoot){if(location.hash)history.replaceState(null,'',location.pathname+location.search);showHome();landingBoot=false;}},120);
  }else showTool();
  window.addEventListener('hashchange',()=>{if(landingBoot){if(!explicitTool){history.replaceState(null,'',location.pathname+location.search);showHome();return;}}isHome()?showHome():showTool();});

  $('#exploreToolsBtn')?.addEventListener('click',()=>toggle());
  $('#popularToolBtn')?.addEventListener('click',()=>{landingBoot=false;location.hash='#/qrcode';});
  $('.brand')?.addEventListener('click',e=>{e.preventDefault();landingBoot=true;history.pushState(null,'',location.pathname+location.search);showHome();setTimeout(()=>landingBoot=false,200);});

  const consentKey='toolinger-consent-v1',banner=$('#cookieBanner');
  let consent=null;try{consent=localStorage.getItem(consentKey)}catch(e){}
  if(!consent&&banner)banner.classList.add('show');
  const saveChoice=v=>{try{localStorage.setItem(consentKey,v)}catch(e){}banner?.classList.remove('show');};
  $('#cookieAcceptBtn')?.addEventListener('click',()=>saveChoice('all'));
  $('#cookieDeclineBtn')?.addEventListener('click',()=>saveChoice('necessary'));

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-modal]');if(!b)return;
    const key=b.getAttribute('data-modal'),overlay=$('#modalOverlay'),box=$('#modalBox');
    if(!overlay||!box||!window.POLICIES||!POLICIES[key])return;
    e.preventDefault();box.innerHTML='<button class="modal-close" type="button" data-close-modal>×</button>'+POLICIES[key];overlay.classList.add('open');
  });
  $('#modalOverlay')?.addEventListener('click',e=>{if(e.target.id==='modalOverlay'||e.target.closest('[data-close-modal]'))e.currentTarget.classList.remove('open')});
  const year=$('#yearNow');if(year)year.textContent=new Date().getFullYear();
});
})();
