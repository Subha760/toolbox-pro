/* Toolidea Passport Photo background-removal enhancement.
 * Navigation is intentionally NOT handled here; clean-nav.js owns the drawer.
 */
(function () {
  'use strict';
  const BG_REMOVER_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';
  let removeBackgroundPromise = null;

  function ensureStyles() {
    if (document.getElementById('toolidea-photo-fix-style')) return;
    const style = document.createElement('style');
    style.id = 'toolidea-photo-fix-style';
    style.textContent = `
      .ti-photo-preview{position:relative;overflow:hidden;border-radius:18px;padding:14px;background:linear-gradient(135deg,#eaf8ff,#fff);border:1px solid rgba(91,78,180,.15)}
      .ti-photo-canvas{display:block;width:min(100%,420px);max-height:520px;object-fit:contain;margin:0 auto;border-radius:12px;box-shadow:0 18px 45px rgba(53,55,110,.15)}
      .ti-photo-loading{display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px 10px;color:#53617f;font-weight:700;text-align:center}
      .ti-spinner{width:36px;height:36px;border:4px solid rgba(124,92,255,.15);border-top-color:#7c5cff;border-right-color:#36b9ff;border-radius:50%;animation:tiSpin .8s linear infinite}
      @keyframes tiSpin{to{transform:rotate(360deg)}}
      .ti-progress{width:min(340px,90%);height:8px;border-radius:20px;overflow:hidden;background:#e8ebf7}.ti-progress>i{display:block;width:0;height:100%;border-radius:20px;background:linear-gradient(90deg,#7c5cff,#36b9ff);transition:width .2s ease}
      .ti-color-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:8px}.ti-color-btn{min-height:48px;border:2px solid transparent;border-radius:13px;cursor:pointer;font-weight:800;color:#24304f;box-shadow:0 5px 15px rgba(54,50,110,.08);transition:transform .18s ease,border-color .18s ease}.ti-color-btn:hover{transform:translateY(-2px)}.ti-color-btn.active{border-color:#7c5cff;box-shadow:0 0 0 3px rgba(124,92,255,.13)}
      .ti-photo-note{font-size:.78rem;color:#667493;line-height:1.5;margin-top:10px}@media(max-width:520px){.ti-color-grid{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(style);
  }
  async function getRemoveBackground(){
    if(!removeBackgroundPromise){removeBackgroundPromise=import(BG_REMOVER_URL).then(mod=>mod.default||mod.removeBackground);}
    return removeBackgroundPromise;
  }
  function blobToUrl(blob){return URL.createObjectURL(blob)}
  function fitCover(img,w,h){const scale=Math.max(w/img.width,h/img.height);const dw=img.width*scale,dh=img.height*scale;return{x:(w-dw)/2,y:(h-dh)/2,w:dw,h:dh}}
  function installIdPhoto(){
    if(!window.TOOLS)return;
    TOOLS.idphoto={name:'Passport & ID Photo Maker',desc:'Automatically remove the original background in your browser, then apply a clean studio background and passport dimensions.',render:function(c){
      c.innerHTML=`<label>Select Portrait Image</label><input type="file" id="idFile" accept="image/jpeg,image/png,image/webp,image/*"/><div class="row"><label style="flex:1;min-width:220px;">Format Standard<select id="idFormat"><option value="passport">Universal Passport (2×2 in / 51×51 mm)</option><option value="pan">Standard Document Photo (35×45 mm)</option><option value="us_visa">US Visa (2×2 in)</option></select></label></div><label>Studio Background</label><div class="ti-color-grid" id="idBgGrid"><button type="button" class="ti-color-btn active" data-bg="#fff" style="background:#fff">White</button><button type="button" class="ti-color-btn" data-bg="#87ceeb" style="background:#87ceeb">Sky Blue</button><button type="button" class="ti-color-btn" data-bg="#dff4ff" style="background:#dff4ff">Light Blue</button><button type="button" class="ti-color-btn" data-bg="#e9edf5" style="background:#e9edf5">Light Grey</button></div><input type="hidden" id="idBg" value="#fff"/><button class="btn" id="idBtn" disabled>✨ Remove Background & Create Photo</button><p class="ti-photo-note">Upload starts automatic background removal. Processing is done in your browser; the model is downloaded and cached by the browser.</p><div class="result-box" style="display:block"><div id="idStatus" class="ti-photo-loading" style="display:none"><div class="ti-spinner"></div><div id="idStatusText">Preparing…</div><div class="ti-progress"><i id="idProgress"></i></div></div><div class="ti-photo-preview"><canvas id="idCanvas" class="ti-photo-canvas" style="display:none"></canvas></div><div id="idDownload" style="text-align:center;margin-top:12px"></div></div>`;
      const fileEl=c.querySelector('#idFile'),formatEl=c.querySelector('#idFormat'),bgEl=c.querySelector('#idBg'),btn=c.querySelector('#idBtn'),canvas=c.querySelector('#idCanvas'),status=c.querySelector('#idStatus'),statusText=c.querySelector('#idStatusText'),progress=c.querySelector('#idProgress'),download=c.querySelector('#idDownload');let foregroundBlob=null,busy=false;
      c.querySelectorAll('.ti-color-btn').forEach(b=>b.addEventListener('click',()=>{c.querySelectorAll('.ti-color-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');bgEl.value=b.dataset.bg;if(foregroundBlob)renderStudio()}));
      function setStatus(show,text,pct){status.style.display=show?'flex':'none';statusText.textContent=text||'';progress.style.width=Math.max(0,Math.min(100,pct||0))+'%'}
      async function renderStudio(){if(!foregroundBlob)return;const dims={passport:[600,600],pan:[413,531],us_visa:[600,600]},[w,h]=dims[formatEl.value]||dims.passport,fgUrl=blobToUrl(foregroundBlob);try{const img=await loadImage(fgUrl);canvas.width=w;canvas.height=h;canvas.style.display='block';const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);ctx.fillStyle=bgEl.value;ctx.fillRect(0,0,w,h);const r=fitCover(img,w,h);ctx.drawImage(img,r.x,r.y,r.w,r.h);download.innerHTML=downloadLinkHtml(canvas.toDataURL('image/jpeg',.96),'toolidea-passport-photo.jpg','⬇️ Download JPG')}finally{URL.revokeObjectURL(fgUrl)}}
      async function process(file){if(busy)return;busy=true;btn.disabled=true;download.innerHTML='';canvas.style.display='none';setStatus(true,'Loading background remover…',5);try{const removeBackground=await getRemoveBackground();if(typeof removeBackground!=='function')throw new Error('Background removal module failed to load.');setStatus(true,'Removing background automatically…',15);foregroundBlob=await removeBackground(file,{model:'isnet_quint8',output:{format:'image/png',type:'foreground'},progress:(key,current,total)=>{if(total)setStatus(true,`Processing ${key||'image'}…`,Math.round(current/total*100))}});setStatus(false);await renderStudio()}catch(err){console.error('Toolidea background removal error:',err);setStatus(true,'Automatic removal failed.',0);const sp=status.querySelector('.ti-spinner');if(sp)sp.style.display='none';statusText.textContent='Could not load the background-removal model. Check your internet connection and retry.'}finally{busy=false;btn.disabled=!foregroundBlob}}
      fileEl.addEventListener('change',()=>{const file=fileEl.files[0];if(file)process(file)});btn.addEventListener('click',()=>{const file=fileEl.files[0];if(file)process(file)});formatEl.addEventListener('change',()=>{if(foregroundBlob)renderStudio()});
    }};
  }
  function boot(){ensureStyles();installIdPhoto()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();setTimeout(boot,600);setTimeout(boot,1800);
})();
