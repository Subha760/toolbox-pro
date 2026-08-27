/* Toolidea single-source mobile navigation. Loaded last and uses unique IDs. */
(function(){
  'use strict';
  function boot(){
    const old=document.getElementById('hamburgerBtn');
    const drawer=document.getElementById('sidebar');
    if(!old||!drawer||window.__toolideaCleanNav) return;
    window.__toolideaCleanNav=true;
    old.removeAttribute('id');
    old.id='toolideaMenuBtn';
    drawer.removeAttribute('id');
    drawer.id='toolideaDrawer';
    drawer.setAttribute('aria-label','Tool categories');
    let backdrop=document.getElementById('toolideaNavBackdrop');
    if(!backdrop){backdrop=document.createElement('div');backdrop.id='toolideaNavBackdrop';backdrop.setAttribute('aria-hidden','true');document.body.appendChild(backdrop);}
    let open=false;
    const setOpen=(value)=>{
      open=!!value;
      drawer.classList.toggle('is-open',open);
      backdrop.classList.toggle('is-visible',open);
      old.setAttribute('aria-expanded',String(open));
      old.setAttribute('aria-label',open?'Close tool categories':'Open tool categories');
      document.documentElement.classList.toggle('toolidea-nav-locked',open && innerWidth<=900);
      document.body.classList.toggle('toolidea-nav-locked',open && innerWidth<=900);
    };
    const toggle=(e)=>{if(e){e.preventDefault();e.stopPropagation();}setOpen(!open);};
    old.addEventListener('click',toggle,{passive:false});
    old.addEventListener('pointerup',e=>{if(e.pointerType==='touch'){e.preventDefault();}}, {passive:false});
    backdrop.addEventListener('click',()=>setOpen(false));
    drawer.addEventListener('click',e=>{
      const item=e.target.closest('li,a,button');
      if(item && !item.classList.contains('category-heading')) setTimeout(()=>setOpen(false),40);
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
    window.addEventListener('hashchange',()=>setOpen(false));
    window.addEventListener('resize',()=>{if(innerWidth>900)setOpen(false);},{passive:true});
    const observer=new MutationObserver(()=>{
      drawer.querySelectorAll('.category-heading').forEach(h=>{h.style.fontWeight='800';});
    });
    observer.observe(drawer,{childList:true,subtree:true});
    drawer.querySelectorAll('.category-heading').forEach(h=>h.style.fontWeight='800');
    setOpen(false);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  setTimeout(boot,100); setTimeout(boot,800);
})();
