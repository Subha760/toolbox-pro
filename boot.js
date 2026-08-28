(()=>{
'use strict';
const $=id=>document.getElementById(id);
function drawer(open){const s=$('sidebar'),b=$('drawerBackdrop'),h=$('hamburgerBtn');if(!s)return;s.classList.toggle('open',open);b?.classList.toggle('show',open);h?.classList.toggle('active',open);h?.setAttribute('aria-expanded',String(open));document.body.classList.toggle('drawer-open',open)}
function home(show){const landing=$('landingHome'),shell=$('appShell');landing?.classList.toggle('visible',show);shell?.classList.toggle('tool-mode',!show);if(show)drawer(false)}
function route(){const key=location.hash.replace(/^#\//,'').trim();home(!window.TOOLS||!window.TOOLS[key]);}
document.addEventListener('DOMContentLoaded',()=>{
 const h=$('hamburgerBtn');
 h?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();drawer(!$('sidebar').classList.contains('open'))},true);
 $('drawerClose')?.addEventListener('click',()=>drawer(false));$('drawerBackdrop')?.addEventListener('click',()=>drawer(false));
 $('exploreToolsBtn')?.addEventListener('click',()=>drawer(true));$('popularToolBtn')?.addEventListener('click',()=>{if(window.navigateTo)navigateTo('qrcode')});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')drawer(false)});
 document.addEventListener('click',e=>{const item=e.target.closest('#sidebarContent li[data-tool]');if(item)setTimeout(()=>drawer(false),0)});
 window.addEventListener('hashchange',route);
 $('yearNow').textContent=new Date().getFullYear();
 route();
});
})();
