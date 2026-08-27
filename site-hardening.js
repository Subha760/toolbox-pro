/* Toolidea production UI hardening: reliable mobile drawer + bold category headings + consent UI. */
(function () {
  'use strict';
  function addStyles(){
    if(document.getElementById('toolidea-hardening-css'))return;
    var s=document.createElement('style');s.id='toolidea-hardening-css';s.textContent=`
      @media(max-width:900px){
        html.ti-nav-lock,body.ti-nav-lock{overflow:hidden!important;overscroll-behavior:none!important}
        .sidebar#sidebar{position:fixed!important;left:0!important;top:0!important;width:min(300px,84vw)!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;padding:84px 12px 24px!important;transform:translate3d(-110%,0,0)!important;visibility:hidden!important;opacity:1!important;z-index:10001!important;display:block!important;background:rgba(255,255,255,.99)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:16px 0 42px rgba(27,39,75,.22)!important;transition:transform .24s cubic-bezier(.2,.8,.2,1),visibility 0s linear .24s!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}
        .sidebar#sidebar.ti-drawer-visible{transform:translate3d(0,0,0)!important;visibility:visible!important;transition:transform .24s cubic-bezier(.2,.8,.2,1),visibility 0s linear 0s!important}
        .ti-drawer-backdrop{position:fixed!important;inset:0!important;background:rgba(20,28,55,.28)!important;z-index:10000!important;display:none!important;opacity:0!important;transition:opacity .18s ease!important}
        .ti-drawer-backdrop.visible{display:block!important;opacity:1!important}
        .site-header{position:relative!important;z-index:10002!important}
        .hamburger#hamburgerBtn{position:relative!important;z-index:10003!important;display:flex!important;align-items:center!important;justify-content:center!important;width:68px!important;height:58px!important;min-width:68px!important;cursor:pointer!important;pointer-events:auto!important;touch-action:manipulation!important;font-size:0!important}
        .hamburger#hamburgerBtn::before{content:'☰';font-size:32px;line-height:1;font-family:Arial,sans-serif!important}
        .hamburger#hamburgerBtn[aria-expanded="true"]::before{content:'✕';font-size:30px}
        #sidebar h2,#sidebar h3,#sidebar h4,#sidebar .category-title,#sidebar .sidebar-category-title,#sidebar [data-category-title]{font-weight:800!important;color:#17213f!important;letter-spacing:.01em!important}
        #sidebar ul,#sidebar li{max-width:100%!important}#sidebar a,#sidebar button{touch-action:manipulation!important}
      }
      @media(min-width:901px){.ti-drawer-backdrop{display:none!important}}
      .ti-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:20000;max-width:720px;margin:auto;padding:18px 20px;border:1px solid rgba(82,73,180,.18);border-radius:20px;background:rgba(255,255,255,.98);box-shadow:0 22px 70px rgba(30,39,78,.22);font-family:Inter,system-ui,sans-serif;color:#26324f}.ti-consent h3{margin:0 0 7px;font-size:1rem}.ti-consent p{margin:0;color:#5d6b86;font-size:.82rem;line-height:1.55}.ti-consent-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.ti-consent-actions button{border:0;border-radius:999px;padding:10px 16px;font-weight:800;cursor:pointer}.ti-consent-accept{background:linear-gradient(135deg,#6956ff,#19bff0);color:#fff}.ti-consent-necessary{background:#eef2f7;color:#33415f}.ti-consent-more{background:transparent;color:#5146b8}
      @media(max-width:520px){.ti-consent{left:10px;right:10px;bottom:10px;padding:15px;border-radius:17px}.ti-consent-actions button{flex:1;min-width:120px}}
      @media(prefers-reduced-motion:reduce){.sidebar#sidebar,.ti-drawer-backdrop{transition:none!important}}
    `;document.head.appendChild(s);
  }
  function installDrawer(){
    var btn=document.getElementById('hamburgerBtn'),sidebar=document.getElementById('sidebar');if(!btn||!sidebar)return;
    try{btn.onclick=null}catch(_){}btn.removeAttribute('onclick');
    var backdrop=document.querySelector('.ti-drawer-backdrop');if(!backdrop){backdrop=document.createElement('div');backdrop.className='ti-drawer-backdrop';backdrop.setAttribute('aria-hidden','true');document.body.appendChild(backdrop)}
    function isOpen(){return sidebar.classList.contains('ti-drawer-visible')}
    function close(){sidebar.classList.remove('ti-drawer-visible','ti-open','open');backdrop.classList.remove('visible','open');document.documentElement.classList.remove('ti-nav-lock');document.body.classList.remove('ti-nav-lock');btn.setAttribute('aria-expanded','false')}
    function open(){sidebar.classList.remove('ti-open','open');sidebar.classList.add('ti-drawer-visible');backdrop.classList.add('visible');document.documentElement.classList.add('ti-nav-lock');document.body.classList.add('ti-nav-lock');btn.setAttribute('aria-expanded','true')}
    function toggle(e){if(e){e.preventDefault();e.stopImmediatePropagation();}if(isOpen())close();else open()}
    if(!window.__toolideaNavDelegated){
      window.__toolideaNavDelegated=true;
      document.addEventListener('click',function(e){
        var target=e.target&&e.target.closest?e.target.closest('#hamburgerBtn'):null;
        if(target){toggle(e);return}
        var closeTarget=e.target&&e.target.closest?e.target.closest('.ti-drawer-backdrop'):null;
        if(closeTarget){e.preventDefault();e.stopImmediatePropagation();close()}
      },true);
      document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
      window.addEventListener('hashchange',close);window.addEventListener('resize',function(){if(innerWidth>900)close()},{passive:true});
    }
    if(!sidebar.__tiCloseHandler){sidebar.__tiCloseHandler=true;sidebar.addEventListener('click',function(e){var item=e.target&&e.target.closest?e.target.closest('a,button,li'):null;if(item&&!item.closest('.sidebar-category-title'))setTimeout(close,80)})}
    function boldCategories(){sidebar.querySelectorAll('h2,h3,h4,.category-title,.sidebar-category-title,[data-category-title]').forEach(function(el){el.style.fontWeight='800'})}
    boldCategories();if(!sidebar.__tiObserver){sidebar.__tiObserver=new MutationObserver(boldCategories);sidebar.__tiObserver.observe(sidebar,{childList:true,subtree:true})}
  }
  function installConsent(){var key='toolidea-consent-v1';try{if(localStorage.getItem(key))return}catch(_){}if(document.getElementById('toolideaConsent'))return;var box=document.createElement('section');box.id='toolideaConsent';box.className='ti-consent';box.setAttribute('role','dialog');box.innerHTML='<h3>Privacy & advertising choices</h3><p>Toolidea processes supported tools in your browser. When advertising is enabled, advertising partners may use cookies or similar technologies according to their policies.</p><div class="ti-consent-actions"><button type="button" class="ti-consent-accept" data-consent="all">Allow advertising</button><button type="button" class="ti-consent-necessary" data-consent="necessary">Necessary only</button><button type="button" class="ti-consent-more" data-consent="privacy">Privacy policy</button></div>';document.body.appendChild(box);box.addEventListener('click',function(e){var action=e.target.closest('[data-consent]');if(!action)return;var choice=action.dataset.consent;if(choice==='privacy'){var modal=document.getElementById('modalOverlay'),modalBox=document.getElementById('modalBox');if(modal&&modalBox&&window.POLICIES&&POLICIES.privacy){modalBox.innerHTML=POLICIES.privacy;modal.classList.add('open')}return}try{localStorage.setItem(key,choice)}catch(_){}box.remove()})}
  function init(){addStyles();installDrawer();installConsent()}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();setTimeout(init,300);setTimeout(init,1200)
})();
