/* Toolinger final mobile correction. Loaded last so it overrides legacy mobile rules. */
(function(){
'use strict';
function boot(){
  if(!document.body) return;
  const style=document.createElement('style');
  style.id='toolinger-mobile-final-fix';
  style.textContent=`
@media(max-width:900px){
  /* Homepage must show the landing content, never the category sidebar. */
  body.ti-mobile-home .app-shell{display:block!important;width:100%!important;margin:0!important;padding:0!important}
  body.ti-mobile-home .main{display:block!important;width:100%!important;min-width:0!important;padding:0 10px 28px!important}
  body.ti-mobile-home .sidebar{display:block!important}

  /* Drawer: hidden off-canvas until hamburger is pressed. */
  #toolideaDrawer,#sidebar.sidebar{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:min(340px,88vw)!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;padding:96px 0 28px!important;overflow-y:auto!important;transform:translate3d(-105%,0,0)!important;visibility:hidden!important;opacity:1!important;pointer-events:none!important;z-index:2147483000!important;background:#fff!important;box-shadow:18px 0 50px rgba(20,25,55,.28)!important;transition:transform .25s ease,visibility 0s linear .25s!important}
  #toolideaDrawer.is-open,#sidebar.sidebar.is-open{transform:translate3d(0,0,0)!important;visibility:visible!important;pointer-events:auto!important;transition:transform .25s ease,visibility 0s!important}
  #toolingerBackdrop{position:fixed!important;inset:0!important;z-index:2147482999!important;background:rgba(15,20,45,.50)!important;backdrop-filter:blur(3px)!important}
  #toolingerBackdrop:not(.is-visible){display:none!important}
  #toolingerBackdrop.is-visible{display:block!important}
  body.ti-drawer-open{overflow:hidden!important}

  /* Make the hamburger unmistakable and always tappable. */
  #toolideaMenuBtn,#hamburgerBtn{position:relative!important;z-index:2147483001!important;display:flex!important;width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;align-items:center!important;justify-content:center!important;font-size:0!important;cursor:pointer!important;touch-action:manipulation!important}
  #toolideaMenuBtn::before,#hamburgerBtn::before{content:'☰'!important;font:32px/1 Arial,sans-serif!important}
  #toolideaMenuBtn[aria-expanded="true"]::before,#hamburgerBtn[aria-expanded="true"]::before{content:'×'!important;font-size:40px!important}

  /* Never let legacy desktop category grids leak onto the homepage. */
  body.ti-mobile-home #sidebarContent{display:block!important}
  body.ti-mobile-home .sidebar{visibility:hidden!important;transform:translate3d(-105%,0,0)!important}
  body.ti-mobile-home .sidebar.is-open{visibility:visible!important;transform:translate3d(0,0,0)!important}

  .ti-home{display:block!important;visibility:visible!important;opacity:1!important;margin:10px 0 18px!important;padding:28px 18px 24px!important;min-height:0!important}
  .ti-home-content{display:block!important;visibility:visible!important;opacity:1!important}
  .ti-home h1{font-size:clamp(2.35rem,12.5vw,4rem)!important}
  .ti-home p{max-width:none!important}
  .ti-cubes{pointer-events:none!important}
  .ti-features{display:grid!important;grid-template-columns:1fr!important}
  .ti-home-ad{display:block!important}

  /* Tool pages stay full width. */
  body.ti-mobile-tool .main{display:block!important;width:100%!important;min-width:0!important;padding:10px!important}
  body.ti-mobile-tool .sidebar{visibility:hidden!important;transform:translate3d(-105%,0,0)!important}
  body.ti-mobile-tool .sidebar.is-open{visibility:visible!important;transform:translate3d(0,0,0)!important}
}
@media(max-width:520px){
  .site-header{min-height:92px!important}
  .ti-home{border-radius:20px!important}
}
`;
  document.head.appendChild(style);

  /* Replace the broken/missing WebP reference with the repository SVG logo. */
  document.querySelectorAll('.brand-mark img').forEach(img=>{
    img.src='./toolinger-logo.svg?v=3';
    img.alt='Toolinger logo';
  });

  /* Ensure mobile state is correct even when the page is opened directly with #/. */
  function sync(){
    const mobile=innerWidth<=900;
    const hasTool=location.hash.replace(/^#\/?/,'').trim().length>0;
    document.body.classList.toggle('ti-mobile-home',mobile&&!hasTool);
    document.body.classList.toggle('ti-mobile-tool',mobile&&hasTool);
  }
  sync();
  addEventListener('hashchange',sync);
  addEventListener('resize',sync,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
