(()=>{
'use strict';
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

function ready(fn){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});
  else fn();
}

ready(()=>{
  const body=document.body;
  const home=$('#landingHome');
  const shell=$('#appShell');
  const sidebar=$('#sidebar');
  const header=$('#siteHeader');
  const menu=$('#hamburgerBtn');
  
  if(!home||!shell||!sidebar||!header||!menu)return;

  // Create backdrop if it doesn't exist
  let backdrop=$('#toolingerBackdrop');
  if(!backdrop){
    backdrop=document.createElement('div');
    backdrop.id='toolingerBackdrop';
    backdrop.setAttribute('aria-label','Close tools');
    backdrop.setAttribute('aria-hidden','true');
    document.body.appendChild(backdrop);
  }

  const isMobile=()=>window.matchMedia('(max-width: 900px)').matches;
  
  const close=()=>{
    sidebar.classList.remove('open');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-expanded','false');
    backdrop.classList.remove('show');
    backdrop.setAttribute('aria-hidden','true');
    body.classList.remove('drawer-open');
    body.style.overflow='';
  };
  
  const open=()=>{
    if(!isMobile())return;
    sidebar.classList.add('open');
    menu.classList.add('is-open');
    menu.setAttribute('aria-expanded','true');
    backdrop.classList.add('show');
    backdrop.setAttribute('aria-hidden','false');
    body.classList.add('drawer-open');
    body.style.overflow='hidden';
  };
  
  const toggle=()=>{
    if(sidebar.classList.contains('open')){
      close();
    }else{
      open();
    }
  };

  // Hamburger menu click - use capture phase to intercept early
  menu.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  // Backdrop click to close
  backdrop.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    close();
  });

  // Keyboard escape to close
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&sidebar.classList.contains('open')){
      close();
    }
  });

  // Click on sidebar menu items to close drawer
  document.addEventListener('click',e=>{
    const li=e.target.closest('#sidebarContent li');
    if(li&&sidebar.classList.contains('open')){
      close();
    }
  });

  // Touch support for mobile
  document.addEventListener('touchstart',e=>{
    const li=e.target.closest('#sidebarContent li');
    if(li&&sidebar.classList.contains('open')){
      close();
    }
  },true);

  // Resize handler - close drawer on desktop
  window.addEventListener('resize',()=>{
    if(!isMobile()&&sidebar.classList.contains('open')){
      close();
    }
  },{passive:true});

  // Expose close and toggle to global scope
  window.__toolingerCloseMenu=close;
  window.__toolingerToggleMenu=toggle;

  // Landing page logic
  const initial=(window.__TOOLINGER_INITIAL_HASH||'').trim();
  const explicitTool=!!initial&&initial!=='#'&&initial!=='#/';
  let landingBoot=!explicitTool;
  
  function isHome(){
    const h=location.hash.trim();
    return !h||h==='#'||h==='#/';
  }
  
  function showHome(){
    home.hidden=false;
    home.classList.add('is-visible');
    shell.classList.remove('is-tool');
    const title=$('#toolHeader');
    const content=$('#toolContainer');
    if(title)title.hidden=true;
    if(content)content.hidden=true;
    $$('.ad-incontent').forEach(x=>x.hidden=true);
    body.classList.add('home-view');
    body.classList.remove('tool-view');
    document.title='Toolinger — 90+ Free Online Tools';
    close();
  }
  
  function showTool(){
    home.hidden=true;
    home.classList.remove('is-visible');
    shell.classList.add('is-tool');
    const title=$('#toolHeader');
    const content=$('#toolContainer');
    if(title)title.hidden=false;
    if(content)content.hidden=false;
    $$('.ad-incontent').forEach(x=>x.hidden=false);
    body.classList.remove('home-view');
    body.classList.add('tool-view');
    close();
  }
  
  if(!explicitTool){
    if(location.hash)history.replaceState(null,'',location.pathname+location.search);
    showHome();
    setTimeout(()=>{
      if(landingBoot){
        if(location.hash)history.replaceState(null,'',location.pathname+location.search);
        showHome();
        landingBoot=false;
      }
    },120);
  }else{
    showTool();
  }
  
  window.addEventListener('hashchange',()=>{
    if(landingBoot){
      if(!explicitTool){
        history.replaceState(null,'',location.pathname+location.search);
        showHome();
        return;
      }
    }
    isHome()?showHome():showTool();
  });

  // Landing page button events
  const exploreBtn=$('#exploreToolsBtn');
  const popularBtn=$('#popularToolBtn');
  const brandLink=$('.brand');
  
  if(exploreBtn)exploreBtn.addEventListener('click',()=>toggle());
  if(popularBtn)popularBtn.addEventListener('click',()=>{
    landingBoot=false;
    location.hash='#/qrcode';
  });
  if(brandLink)brandLink.addEventListener('click',e=>{
    e.preventDefault();
    landingBoot=true;
    history.pushState(null,'',location.pathname+location.search);
    showHome();
    setTimeout(()=>landingBoot=false,200);
  });

  // Cookie banner logic
  const consentKey='toolinger-consent-v1';
  const banner=$('#cookieBanner');
  let consent=null;
  try{
    consent=localStorage.getItem(consentKey);
  }catch(e){}
  if(!consent&&banner)banner.classList.add('show');
  
  const saveChoice=v=>{
    try{
      localStorage.setItem(consentKey,v);
    }catch(e){}
    if(banner)banner.classList.remove('show');
  };
  
  const cookieAccept=$('#cookieAcceptBtn');
  const cookieDecline=$('#cookieDeclineBtn');
  if(cookieAccept)cookieAccept.addEventListener('click',()=>saveChoice('all'));
  if(cookieDecline)cookieDecline.addEventListener('click',()=>saveChoice('necessary'));

  // Modal logic
  const modalOverlay=$('#modalOverlay');
  const modalBox=$('#modalBox');
  
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-modal]');
    if(!btn)return;
    
    const key=btn.getAttribute('data-modal');
    if(!modalOverlay||!modalBox)return;
    if(!window.POLICIES||!window.POLICIES[key])return;
    
    e.preventDefault();
    const content=window.POLICIES[key];
    modalBox.innerHTML=`<button class="modal-close" type="button" data-close-modal aria-label="Close">×</button>${content}`;
    modalOverlay.classList.add('open');
  });
  
  if(modalOverlay){
    modalOverlay.addEventListener('click',e=>{
      if(e.target.id==='modalOverlay'){
        e.currentTarget.classList.remove('open');
      }
    });
  }
  
  // Modal close button handler
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-close-modal]')){
      if(modalOverlay)modalOverlay.classList.remove('open');
    }
  });

  // Footer year
  const yearEl=$('#yearNow');
  if(yearEl)yearEl.textContent=new Date().getFullYear();
});
})();
