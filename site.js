(()=>{
'use strict';
const $=s=>document.querySelector(s);
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
ready(()=>{
  const body=document.body, home=$('#landingHome'), shell=$('#appShell'), sidebar=$('#sidebar'), header=$('#siteHeader');
  if(!home||!shell||!sidebar||!header)return;

  /* Replace any legacy hamburger listeners with one deterministic controller. */
  const oldMenu=$('#hamburgerBtn');
  if(oldMenu){
    const menu=oldMenu.cloneNode(true); oldMenu.replaceWith(menu);
    let backdrop=$('#toolingerBackdrop');
    if(!backdrop){backdrop=document.createElement('button');backdrop.id='toolingerBackdrop';backdrop.type='button';backdrop.setAttribute('aria-label','Close tools');document.body.appendChild(backdrop);}
    const close=()=>{sidebar.classList.remove('open');menu.classList.remove('is-open');menu.setAttribute('aria-expanded','false');backdrop.classList.remove('show');body.classList.remove('drawer-open');};
    const open=()=>{sidebar.classList.add('open');menu.classList.add('is-open');menu.setAttribute('aria-expanded','true');backdrop.classList.add('show');body.classList.add('drawer-open');};
    menu.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();sidebar.classList.contains('open')?close():open();});
    backdrop.addEventListener('click',close);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    document.addEventListener('click',e=>{if(e.target.closest('#sidebarContent li'))close();});
    window.__toolingerCloseMenu=close;
  }

  const initial=(window.__TOOLINGER_INITIAL_HASH||'').trim();
  const explicitTool=!!initial && initial!=='#' && initial!=='#/';
  function isHome(){const h=location.hash.trim();return !h||h==='#'||h==='#/';}
  function showHome(){
    home.hidden=false; home.classList.add('is-visible');
    shell.classList.remove('is-tool');
    const title=$('#toolHeader'), content=$('#toolContainer');
    if(title)title.hidden=true; if(content)content.hidden=true;
    document.querySelectorAll('.ad-incontent').forEach(x=>x.hidden=true);
    document.querySelector('.ad-footer')?.classList.remove('home-hidden');
    body.classList.add('home-view'); body.classList.remove('tool-view');
    document.title='Toolinger — 90+ Free Online Tools';
  }
  function showTool(){
    home.hidden=true; home.classList.remove('is-visible'); shell.classList.add('is-tool');
    const title=$('#toolHeader'), content=$('#toolContainer');
    if(title)title.hidden=false; if(content)content.hidden=false;
    document.querySelectorAll('.ad-incontent').forEach(x=>x.hidden=false);
    body.classList.remove('home-view'); body.classList.add('tool-view');
    window.__toolingerCloseMenu?.();
  }

  /* A fresh visit with no route is always the landing page. */
  if(!explicitTool){
    if(location.hash)history.replaceState(null,'',location.pathname+location.search);
    showHome();
  }else showTool();
  window.addEventListener('hashchange',()=>isHome()?showHome():showTool());

  $('#exploreToolsBtn')?.addEventListener('click',()=>{
    const menu=$('#hamburgerBtn');
    if(menu)menu.click();
  });
  $('#popularToolBtn')?.addEventListener('click',()=>{location.hash='#/qrcode';});
  $('.brand')?.addEventListener('click',e=>{e.preventDefault();history.pushState(null,'',location.pathname+location.search);showHome();});

  /* Cookie popup: visible on landing until a choice is made. */
  const consentKey='toolinger-consent-v1', banner=$('#cookieBanner');
  let consent=null; try{consent=localStorage.getItem(consentKey)}catch(e){}
  if(!consent && banner)banner.classList.add('show');
  function saveChoice(v){try{localStorage.setItem(consentKey,v)}catch(e){} banner?.classList.remove('show');}
  $('#cookieAcceptBtn')?.addEventListener('click',()=>saveChoice('all'));
  $('#cookieDeclineBtn')?.addEventListener('click',()=>saveChoice('necessary'));

  /* Safe modal fallback; existing app.js handlers remain authoritative if present. */
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-modal]'); if(!b)return;
    const key=b.getAttribute('data-modal'), overlay=$('#modalOverlay'), box=$('#modalBox');
    if(!overlay||!box||!window.POLICIES||!POLICIES[key])return;
    e.preventDefault(); box.innerHTML='<button class="modal-close" type="button" data-close-modal>×</button>'+POLICIES[key]; overlay.classList.add('open');
  });
  $('#modalOverlay')?.addEventListener('click',e=>{if(e.target.id==='modalOverlay'||e.target.closest('[data-close-modal]'))e.currentTarget.classList.remove('open')});
  $('#yearNow').textContent=new Date().getFullYear();
});
})();
