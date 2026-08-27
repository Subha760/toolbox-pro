/* Final mobile UI patch. Index.html already loads enhancements.js. */
(function(){'use strict';
function init(){
 if(document.documentElement.dataset.tiMobilePatch)return;document.documentElement.dataset.tiMobilePatch='1';
 const s=document.createElement('style');s.textContent=`
.brand-mark{overflow:hidden!important;display:grid!important;place-items:center!important;background:#11152b!important}.brand-mark img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
@media(max-width:900px){
 body.landing-mode .app-shell{display:none!important} body.landing-mode .landing{display:block!important;visibility:visible!important;opacity:1!important;min-height:calc(100vh - 150px)!important;padding:18px 14px 45px!important}
 body.landing-mode .ad-incontent,body.landing-mode .ad-footer,body.landing-mode .site-footer{display:none!important}
 .site-header{position:relative!important;z-index:4000!important;display:flex!important;flex-wrap:wrap!important;gap:10px!important;padding:10px 14px!important}
 .hamburger{display:inline-flex!important;flex:0 0 48px!important;width:48px!important;height:48px!important;z-index:4002!important;cursor:pointer!important;touch-action:manipulation!important}
 .brand{display:flex!important;align-items:center!important;min-width:0!important}.brand-mark{width:48px!important;height:48px!important;flex:0 0 48px!important;border-radius:14px!important}.brand-text span{display:none!important}.brand-text strong{font-size:1.05rem!important}
 .header-search{order:5!important;flex:1 1 100%!important;width:100%!important;margin:2px 0 0!important}.header-search input{width:100%!important;min-height:48px!important;font-size:16px!important}.header-nav{display:none!important}
 #sidebar{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:min(330px,88vw)!important;height:100dvh!important;max-height:none!important;padding:82px 0 24px!important;margin:0!important;overflow-y:auto!important;background:#101025!important;z-index:4001!important;transform:translate3d(-110%,0,0)!important;visibility:hidden!important;pointer-events:none!important;opacity:1!important;transition:transform .24s ease,visibility 0s linear .24s!important;box-shadow:18px 0 60px rgba(0,0,0,.45)!important}
 #sidebar.ti-open{transform:translate3d(0,0,0)!important;visibility:visible!important;pointer-events:auto!important}
 #tiBackdrop{position:fixed!important;inset:0!important;background:rgba(8,10,25,.62)!important;backdrop-filter:blur(4px)!important;z-index:4000!important;display:none!important}#tiBackdrop.show{display:block!important}
 body.ti-lock{overflow:hidden!important}
 body.landing-mode .hero-grid{display:flex!important;flex-direction:column!important;gap:14px!important}.hero-copy{width:100%!important}.hero-title{font-size:clamp(2.55rem,13vw,4.2rem)!important;letter-spacing:-2.5px!important}.hero-copy p{font-size:.92rem!important;line-height:1.6!important}.motion-stage{min-height:330px!important;width:100%!important}.landing-features{grid-template-columns:1fr!important}
}
`;document.head.appendChild(s);
 function logo(){document.querySelectorAll('.brand-mark').forEach(m=>{let i=m.querySelector('img');if(!i){i=document.createElement('img');m.textContent='';m.appendChild(i)}i.src='./toolinger-logo.svg?v=5';i.alt='Toolinger logo';i.loading='eager'});document.querySelectorAll('.brand-text strong').forEach(e=>e.textContent='Toolinger');document.querySelectorAll('.brand-text span').forEach(e=>e.textContent='90+ ONLINE TOOLS')}
 function landing(){const p=document.getElementById('landingPage');if(!p)return;const tool=location.hash.replace(/^#\/?/,'').trim();document.body.classList.toggle('landing-mode',!tool);if(!tool){p.hidden=false;p.style.display='block';p.style.visibility='visible';p.style.opacity='1'}}
 function nav(){const b=document.getElementById('hamburgerBtn'),d=document.getElementById('sidebar');if(!b||!d||b.dataset.tiNav)return;b.dataset.tiNav='1';let back=document.getElementById('tiBackdrop');if(!back){back=document.createElement('div');back.id='tiBackdrop';document.body.appendChild(back)}const set=o=>{d.classList.toggle('ti-open',o);b.setAttribute('aria-expanded',String(o));b.setAttribute('aria-label',o?'Close tools menu':'Open tools menu');back.classList.toggle('show',o);document.body.classList.toggle('ti-lock',o)};b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();set(!d.classList.contains('ti-open'))},{capture:true});back.addEventListener('click',()=>set(false));document.addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});d.addEventListener('click',e=>{if(e.target.closest('[data-tool]'))set(false)});addEventListener('hashchange',()=>{set(false);landing()})}
 logo();landing();nav();setTimeout(()=>{logo();landing();nav()},250);setTimeout(()=>{logo();landing();nav()},900)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();