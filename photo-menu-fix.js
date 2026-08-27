/* Toolidea Passport Photo + mobile menu fix
 * Background removal is performed locally in the browser with IMG.LY's
 * @imgly/background-removal model. No user image is uploaded to an API.
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
      /* Mobile navigation: compact, crisp and never blur the page underneath. */
      .hamburger { display:flex !important; align-items:center; justify-content:center; position:relative; z-index:120; }
      .ti-menu-backdrop { position:fixed; inset:0; background:rgba(24,32,58,.16); backdrop-filter:none !important; -webkit-backdrop-filter:none !important; z-index:105; display:none; }
      .ti-menu-backdrop.open { display:block; }
      @media (max-width: 900px) {
        .sidebar {
          position:fixed !important; left:0; top:0 !important;
          height:100dvh !important; max-height:100dvh;
          z-index:110; width:min(300px,82vw) !important;
          transform:translate3d(-105%,0,0);
          background:#ffffff !important;
          backdrop-filter:none !important; -webkit-backdrop-filter:none !important;
          border-right:1px solid rgba(60,70,110,.14) !important;
          box-shadow:18px 0 40px rgba(32,42,80,.16);
          transition:transform .24s cubic-bezier(.2,.8,.2,1) !important;
          overscroll-behavior:contain;
        }
        .sidebar.ti-open { transform:translate3d(0,0,0); }
        .sidebar .category-heading { color:#68738d !important; }
        .sidebar ul li { color:#303b59 !important; }
        .sidebar ul li:hover { background:#f1f5ff !important; color:#17203a !important; }
        .sidebar ul li.active {
          background:linear-gradient(135deg,#eeeaff,#e8f8ff) !important;
          color:#3d35a6 !important;
          box-shadow:none !important;
        }
        .site-header { position:sticky; z-index:100; }
        .hamburger {
          width:48px; height:48px; border-radius:15px; font-size:1.45rem;
          color:#273052 !important; background:rgba(255,255,255,.96) !important;
          border:1px solid rgba(91,78,180,.18) !important;
          box-shadow:0 8px 20px rgba(71,55,140,.10);
          -webkit-tap-highlight-color:transparent;
        }
        .hamburger:active { transform:scale(.96); }
        .header-nav { display:none !important; }
        .main { padding:18px 12px 36px !important; }
        .tool-header { margin-bottom:14px !important; }
        .tool-header h1 { font-size:clamp(1.35rem,6vw,1.8rem) !important; line-height:1.15; }
        .tool-header p { font-size:.9rem !important; }
        .tool-content { width:100%; max-width:none; padding:18px 14px !important; border-radius:18px !important; }
        .ad-leaderboard,.ad-footer { width:calc(100% - 20px) !important; min-height:60px !important; }
        .ad-incontent { min-height:70px !important; }
      }
      @media (max-width:380px) {
        .sidebar { width:86vw !important; }
        .brand-text span { font-size:.58rem; }
        .header-search { padding:8px 12px !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        .sidebar { transition:none !important; }
      }

      .ti-photo-preview { position:relative; overflow:hidden; border-radius:18px; padding:14px; background:linear-gradient(135deg,#eaf8ff,#fff); border:1px solid rgba(91,78,180,.15); }
      .ti-photo-canvas { display:block; width:min(100%,420px); max-height:520px; object-fit:contain; margin:0 auto; border-radius:12px; box-shadow:0 18px 45px rgba(53,55,110,.15); }
      .ti-photo-loading { display:flex; flex-direction:column; align-items:center; gap:10px; padding:28px 10px; color:#53617f; font-weight:700; text-align:center; }
      .ti-spinner { width:36px; height:36px; border:4px solid rgba(124,92,255,.15); border-top-color:#7c5cff; border-right-color:#36b9ff; border-radius:50%; animation:tiSpin .8s linear infinite; }
      @keyframes tiSpin { to { transform:rotate(360deg); } }
      .ti-progress { width:min(340px,90%); height:8px; border-radius:20px; overflow:hidden; background:#e8ebf7; }
      .ti-progress > i { display:block; width:0; height:100%; border-radius:20px; background:linear-gradient(90deg,#7c5cff,#36b9ff); transition:width .2s ease; }
      .ti-color-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:9px; margin-top:8px; }
      .ti-color-btn { min-height:48px; border:2px solid transparent; border-radius:13px; cursor:pointer; font-weight:800; color:#24304f; box-shadow:0 5px 15px rgba(54,50,110,.08); transition:transform .18s ease,border-color .18s ease; }
      .ti-color-btn:hover { transform:translateY(-2px); }
      .ti-color-btn.active { border-color:#7c5cff; box-shadow:0 0 0 3px rgba(124,92,255,.13); }
      @media(max-width:520px){.ti-color-grid{grid-template-columns:repeat(2,1fr)}}
      .ti-photo-note { font-size:.78rem; color:#667493; line-height:1.5; margin-top:10px; }
    `;
    document.head.appendChild(style);
  }

  function installMenu() {
    const btn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar || btn.dataset.menuFixed) return;
    btn.dataset.menuFixed = '1';
    const backdrop = document.createElement('div');
    backdrop.className = 'ti-menu-backdrop';
    document.body.appendChild(backdrop);
    const close = () => { sidebar.classList.remove('ti-open'); backdrop.classList.remove('open'); btn.setAttribute('aria-expanded','false'); document.body.style.overflow=''; };
    const open = () => { sidebar.classList.add('ti-open'); backdrop.classList.add('open'); btn.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; };
    btn.addEventListener('click', () => sidebar.classList.contains('ti-open') ? close() : open());
    backdrop.addEventListener('click', close);
    sidebar.addEventListener('click', e => { if (e.target.closest('li')) close(); });
    window.addEventListener('hashchange', close);
    window.addEventListener('resize', () => { if (window.innerWidth > 900) close(); });
  }

  async function getRemoveBackground() {
    if (!removeBackgroundPromise) {
      removeBackgroundPromise = import(BG_REMOVER_URL).then(mod => mod.default || mod.removeBackground);
    }
    return removeBackgroundPromise;
  }

  function blobToUrl(blob) { return URL.createObjectURL(blob); }

  function fitCover(img, w, h) {
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    return { x:(w-dw)/2, y:(h-dh)/2, w:dw, h:dh };
  }

  function installIdPhoto() {
    if (!window.TOOLS) return;
    TOOLS.idphoto = {
      name: 'Passport & ID Photo Maker',
      desc: 'Automatically remove the original background in your browser, then apply a clean studio background and passport dimensions.',
      render: function (c) {
        c.innerHTML = `
          <label>Select Portrait Image</label>
          <input type="file" id="idFile" accept="image/jpeg,image/png,image/webp,image/*" />
          <div class="row">
            <label style="flex:1;min-width:220px;">Format Standard
              <select id="idFormat">
                <option value="passport">Universal Passport (2×2 in / 51×51 mm)</option>
                <option value="pan">Standard Document Photo (35×45 mm)</option>
                <option value="us_visa">US Visa (2×2 in)</option>
              </select>
            </label>
          </div>
          <label>Studio Background</label>
          <div class="ti-color-grid" id="idBgGrid">
            <button type="button" class="ti-color-btn active" data-bg="#ffffff" style="background:#fff">White</button>
            <button type="button" class="ti-color-btn" data-bg="#87ceeb" style="background:#87ceeb">Sky Blue</button>
            <button type="button" class="ti-color-btn" data-bg="#dff4ff" style="background:#dff4ff">Light Blue</button>
            <button type="button" class="ti-color-btn" data-bg="#e9edf5" style="background:#e9edf5">Light Grey</button>
          </div>
          <input type="hidden" id="idBg" value="#ffffff" />
          <button class="btn" id="idBtn" disabled>✨ Remove Background & Create Photo</button>
          <p class="ti-photo-note">Upload starts automatic background removal. Your photo is processed on this device; the neural model is downloaded once and cached by your browser.</p>
          <div class="result-box" style="display:block;">
            <div id="idStatus" class="ti-photo-loading" style="display:none;"><div class="ti-spinner"></div><div id="idStatusText">Preparing…</div><div class="ti-progress"><i id="idProgress"></i></div></div>
            <div class="ti-photo-preview"><canvas id="idCanvas" class="ti-photo-canvas" style="display:none"></canvas></div>
            <div id="idDownload" style="text-align:center;margin-top:12px;"></div>
          </div>`;

        const fileEl = c.querySelector('#idFile');
        const formatEl = c.querySelector('#idFormat');
        const bgEl = c.querySelector('#idBg');
        const btn = c.querySelector('#idBtn');
        const canvas = c.querySelector('#idCanvas');
        const status = c.querySelector('#idStatus');
        const statusText = c.querySelector('#idStatusText');
        const progress = c.querySelector('#idProgress');
        const download = c.querySelector('#idDownload');
        let foregroundBlob = null;
        let busy = false;

        c.querySelectorAll('.ti-color-btn').forEach(b => b.addEventListener('click', () => {
          c.querySelectorAll('.ti-color-btn').forEach(x => x.classList.remove('active'));
          b.classList.add('active'); bgEl.value = b.dataset.bg;
          if (foregroundBlob) renderStudio();
        }));

        function setStatus(show, text, pct) {
          status.style.display = show ? 'flex' : 'none';
          statusText.textContent = text || '';
          progress.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
        }

        async function renderStudio() {
          if (!foregroundBlob) return;
          const dims = { passport:[600,600], pan:[413,531], us_visa:[600,600] };
          const [w,h] = dims[formatEl.value] || dims.passport;
          const fgUrl = blobToUrl(foregroundBlob);
          try {
            const img = await loadImage(fgUrl);
            canvas.width=w; canvas.height=h; canvas.style.display='block';
            const ctx=canvas.getContext('2d');
            ctx.clearRect(0,0,w,h);
            ctx.fillStyle=bgEl.value; ctx.fillRect(0,0,w,h);
            const r=fitCover(img,w,h); ctx.drawImage(img,r.x,r.y,r.w,r.h);
            const data=canvas.toDataURL('image/jpeg',.96);
            download.innerHTML=downloadLinkHtml(data,'toolidea-passport-photo.jpg','⬇️ Download JPG');
            download.classList.remove('ti-result-pop'); void download.offsetWidth; download.classList.add('ti-result-pop');
          } finally { URL.revokeObjectURL(fgUrl); }
        }

        async function process(file) {
          if (busy) return;
          busy=true; btn.disabled=true; download.innerHTML=''; canvas.style.display='none';
          setStatus(true,'Loading background remover…',5);
          try {
            const removeBackground = await getRemoveBackground();
            if (typeof removeBackground !== 'function') throw new Error('Background removal module failed to load.');
            setStatus(true,'Removing background automatically…',15);
            const blob = await removeBackground(file, {
              model:'isnet_quint8',
              output:{format:'image/png',type:'foreground'},
              progress:(key,current,total)=>{
                if(total) setStatus(true,`Processing ${key || 'image'}…`,Math.round((current/total)*100));
              }
            });
            foregroundBlob=blob;
            setStatus(false);
            await renderStudio();
          } catch (err) {
            console.error('Toolidea background removal error:',err);
            setStatus(true,'Automatic removal failed. You can try the image again.',0);
            status.querySelector('.ti-spinner').style.display='none';
            statusText.textContent='Could not load the background-removal model. Check your internet connection and retry.';
          } finally { busy=false; btn.disabled=!foregroundBlob; }
        }

        fileEl.addEventListener('change', () => { const file=fileEl.files[0]; if(file) process(file); });
        btn.addEventListener('click', () => { const file=fileEl.files[0]; if(file) process(file); });
        formatEl.addEventListener('change', () => { if(foregroundBlob) renderStudio(); });
      }
    };
  }

  function boot() {
    ensureStyles();
    installMenu();
    installIdPhoto();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 600);
  setTimeout(boot, 1800);
})();
