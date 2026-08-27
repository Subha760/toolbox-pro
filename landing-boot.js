(()=>{'use strict';
function boot(){
 const home=document.getElementById('landingHome'), header=document.getElementById('toolHeader'), container=document.getElementById('toolContainer');
 const drawer=document.getElementById('sidebar'), menu=document.getElementById('hamburgerBtn');
 if(!home||!header||!container||!drawer||!menu)return;
 function closeMenu(){drawer.classList.remove('open');menu.setAttribute('aria-expanded','false');document.body.classList.remove('drawer-open')}
 function openMenu(){drawer.classList.add('open');menu.setAttribute('aria-expanded','true');document.body.classList.add('drawer-open')}
 menu.onclick=e=>{e.preventDefault();drawer.classList.contains('open')?closeMenu():openMenu()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
 document.addEventListener('click',e=>{const li=e.target.closest('#sidebarContent li[data-tool]');if(li)closeMenu()});
 const explore=document.getElementById('exploreToolsBtn'); if(explore)explore.onclick=openMenu;
 const popular=document.getElementById('popularToolBtn'); if(popular)popular.onclick=()=>{location.hash='#/qrcode'};
 function renderLanding(){home.style.display='grid';header.style.display='none';container.style.display='none';document.querySelectorAll('.ad-incontent').forEach(x=>x.style.display='none');document.title='Toolbox Pro — 90+ Free Online Tools'}
 function renderTool(){home.style.display='none';header.style.display='block';container.style.display='block';document.querySelectorAll('.ad-incontent').forEach(x=>x.style.display='flex')}
 function sync(){if(!location.hash||location.hash==='#'||location.hash==='#/')renderLanding();else renderTool();closeMenu()}
 window.addEventListener('hashchange',sync);sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();