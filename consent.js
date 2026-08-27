/* Toolidea privacy/advertising consent. No ad network is enabled until real Monetag configuration is supplied. */
(function(){
  'use strict';
  function boot(){
    const key='toolidea-consent-v2';
    try{if(localStorage.getItem(key))return;}catch(e){}
    if(document.getElementById('toolideaConsent'))return;
    const box=document.createElement('section');
    box.id='toolideaConsent'; box.className='ti-consent'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Privacy and advertising choices');
    box.innerHTML='<h3>Privacy & advertising choices</h3><p>Toolidea processes supported tools in your browser. Advertising is not enabled until configured. When enabled, advertising partners may use cookies or similar technologies according to their policies.</p><div class="ti-consent-actions"><button type="button" class="ti-consent-accept" data-consent="all">Allow advertising</button><button type="button" class="ti-consent-necessary" data-consent="necessary">Necessary only</button><button type="button" class="ti-consent-more" data-consent="privacy">Privacy policy</button></div>';
    document.body.appendChild(box);
    box.addEventListener('click',function(e){
      const action=e.target.closest('[data-consent]'); if(!action)return;
      const choice=action.dataset.consent;
      if(choice==='privacy'){
        const modal=document.getElementById('modalOverlay'), modalBox=document.getElementById('modalBox');
        if(modal&&modalBox&&window.POLICIES&&POLICIES.privacy){modalBox.innerHTML=POLICIES.privacy;modal.classList.add('open');}
        return;
      }
      try{localStorage.setItem(key,choice)}catch(e){}
      box.remove();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
