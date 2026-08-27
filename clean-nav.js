/* Toolidea: ONE navigation controller. The legacy hamburger listener is kept harmless by using the same legacy id until boot. */
(function(){
'use strict';
function boot(){
 const btn=document.getElementById('hamburgerBtn')||document.getElementById('toolideaMenuBtn');
 const drawer=document.getElementById('sidebar');
 if(!btn||!drawer||window.__toolideaCleanNav)return;
 window.__toolideaCleanNav=true;
 btn.id='toolideaMenuBtn';
 drawer.id='toolideaDrawer';
 let back=document.getElementById('toolideaNavBackdrop');
 if(!back){back=document.createElement('div');back.id='toolideaNavBackdrop';document.body.appendChild(back)}
 let open=false;
 function setOpen(v){open=!!v;drawer.classList.toggle('is-open',open);back.classList.toggle('is-visible',open);btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'Close tool categories':'Open tool categories');document.documentElement.classList.toggle('toolidea-nav-locked',open&&innerWidth<=900);document.body.classList.toggle('toolidea-nav-locked',open&&innerWidth<=900)}
 btn.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();setOpen(!open)},{capture:true,passive:false});
 back.addEventListener('click',function(){setOpen(false)});
 drawer.addEventListener('click',function(e){const item=e.target.closest('#sidebarContent li');if(item)setTimeout(()=>setOpen(false),60)});
 document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false)});
 window.addEventListener('hashchange',function(){setOpen(false)});
 window.addEventListener('resize',function(){if(innerWidth>900)setOpen(false)},{passive:true});
 const obs=new MutationObserver(()=>drawer.querySelectorAll('.category-heading').forEach(h=>h.style.fontWeight='800'));
 obs.observe(drawer,{childList:true,subtree:true});
 setOpen(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
