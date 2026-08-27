/* Toolidea privacy/advertising consent. Advertising stays disabled until real Monetag data is supplied. */
(function(){
'use strict';
/* app.js calls initConsent() on DOMContentLoaded. Replace that legacy hook so it cannot throw or create a second popup. */
window.initConsent=function(){};
function boot(){
 const key='toolidea-consent-v3';
 let saved=null;try{saved=localStorage.getItem(key)}catch(e){}
 if(saved)return;
 if(document.getElementById('toolideaConsent'))return;
 const box=document.createElement('section');box.id='toolideaConsent';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Privacy and advertising choices');
 box.innerHTML='<div class="ti-consent-card"><div class="ti-consent-icon">🛡️</div><div><h3>Privacy & advertising choices</h3><p>Toolidea uses browser storage for preferences. Advertising is currently not enabled. If advertising is enabled later, non-essential cookies or similar technologies may be used by the advertising provider.</p></div><div class="ti-consent-actions"><button type="button" data-choice="necessary">Necessary only</button><button type="button" data-choice="all">Allow advertising</button><button type="button" data-choice="privacy" class="ti-consent-link">Privacy policy</button></div></div>';
 document.body.appendChild(box);
 box.addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(!b)return;const choice=b.dataset.choice;if(choice==='privacy'){const m=document.getElementById('modalOverlay'),mb=document.getElementById('modalBox');if(m&&mb&&window.POLICIES){mb.innerHTML='<button class="modal-close" type="button" onclick="closeModal()">✕</button>'+POLICIES.privacy;m.classList.add('open')}return}try{localStorage.setItem(key,choice)}catch(e){}box.remove()});
}
const s=document.createElement('style');s.textContent='#toolideaConsent{position:fixed;inset:0;z-index:20000;display:grid;place-items:end center;padding:18px;background:rgba(20,28,55,.28)}.ti-consent-card{width:min(760px,100%);background:#fff;color:#24304f;border:1px solid rgba(75,65,150,.15);border-radius:22px;padding:20px;box-shadow:0 24px 70px rgba(31,39,80,.25);display:grid;grid-template-columns:auto 1fr;gap:12px}.ti-consent-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#eef2ff}.ti-consent-card h3{margin:0 0 5px;font:700 1.05rem var(--font-display)}.ti-consent-card p{margin:0;color:#66738e;font-size:.83rem;line-height:1.55}.ti-consent-actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.ti-consent-actions button{min-height:42px;border:0;border-radius:999px;padding:0 16px;font-weight:800;cursor:pointer;background:#6956ff;color:#fff}.ti-consent-actions button:first-child{background:#eef2ff;color:#3d3977}.ti-consent-actions .ti-consent-link{background:transparent;color:#5146a8}@media(max-width:520px){#toolideaConsent{padding:10px}.ti-consent-card{grid-template-columns:1fr;padding:16px;border-radius:18px}.ti-consent-icon{display:none}.ti-consent-actions{display:grid;grid-template-columns:1fr}.ti-consent-actions button{width:100%}}';document.head.appendChild(s);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
