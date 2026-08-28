(()=>{
'use strict';
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
ready(()=>{
 const body=document.body,home=$('#landingHome'),shell=$('#appShell'),sidebar=$('#sidebar'),menu=$('#hamburgerBtn');
 if(!home||!shell||!sidebar||!menu)return;
 let backdrop=$('#toolingerBackdrop');
 if(!backdrop){backdrop=document.createElement('div');backdrop.id='toolingerBackdrop';document.body.appendChild(backdrop);}
 const mobile=()=>matchMedia('(max-width:900px)').matches;
 const close=()=>{sidebar.classList.remove('open');menu.classList.remove('is-open');menu.setAttribute('aria-expanded','false');backdrop.classList.remove('show');body.classList.remove('drawer-open');body.style.overflow='';};
 const open=()=>{if(!mobile())return;sidebar.classList.add('open');menu.classList.add('is-open');menu.setAttribute('aria-expanded','true');backdrop.classList.add('show');body.classList.add('drawer-open');body.style.overflow='hidden';sidebar.style.background='#090b18';sidebar.style.backgroundImage='linear-gradient(180deg,#151938 0%,#0d1026 50%,#090b18 100%)';sidebar.style.backdropFilter='none';sidebar.style.webkitBackdropFilter='none';sidebar.style.filter='none';};
 const toggle=()=>sidebar.classList.contains('open')?close():open();
 // App.js also installs a hamburger listener. Capture here and stop it so the menu toggles exactly once.
 menu.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toggle();},{capture:true});
 menu.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toggle();},{capture:true,passive:false});
 backdrop.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 sidebar.addEventListener('click',e=>{const li=e.target.closest('#sidebarContent li');if(li){setTimeout(close,0);}});
 window.addEventListener('resize',()=>{if(!mobile())close();},{passive:true});
 window.__toolingerCloseMenu=close;window.__toolingerToggleMenu=toggle;
 function homeState(){
   const isHome=!location.hash||location.hash==='#'||location.hash==='#/';
   home.hidden=false;
   home.style.display=isHome?'grid':'none';
   home.style.visibility=isHome?'visible':'hidden';
   home.style.opacity=isHome?'1':'0';
   const title=$('#toolHeader'),content=$('#toolContainer');
   if(title)title.hidden=isHome;
   if(content)content.hidden=isHome;
   $$('.ad-incontent').forEach(x=>x.hidden=isHome);
   shell.classList.toggle('is-tool',!isHome);
   body.classList.toggle('home-view',isHome);
   body.classList.toggle('tool-view',!isHome);
   document.title=isHome?'Toolinger — 90+ Free Online Tools':document.title;
   if(isHome)close();
 }
 homeState();
 window.addEventListener('hashchange',homeState);
 const explore=$('#exploreToolsBtn');
 if(explore)explore.addEventListener('click',e=>{e.preventDefault();toggle();});
 const popular=$('#popularToolBtn');
 if(popular)popular.addEventListener('click',()=>{location.hash='#/qrcode';});
 const brand=$('.brand');
 if(brand)brand.addEventListener('click',e=>{if(e.currentTarget===brand){e.preventDefault();history.replaceState(null,'',location.pathname+location.search);homeState();}});
 // Keep the consent banner visible until a choice is made.
 const banner=$('#cookieBanner');
 try{if(banner&&!localStorage.getItem('toolinger-consent-v1'))banner.classList.add('show');}catch(e){if(banner)banner.classList.add('show');}
 const save=v=>{try{localStorage.setItem('toolinger-consent-v1',v);}catch(e){}if(banner)banner.classList.remove('show');};
 $('#cookieAcceptBtn')?.addEventListener('click',()=>save('all'));
 $('#cookieDeclineBtn')?.addEventListener('click',()=>save('necessary'));
});
})();