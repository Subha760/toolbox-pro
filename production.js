/* Toolidea production runtime hardening + tool fixes. */
(function () {
  'use strict';

  window.TOOLIDEA_CONFIG = Object.assign({
    brand: 'Toolidea',
    tagline: '90+ Free Online Tools',
    ads: { enabled: false, network: 'monetag' }
  }, window.TOOLIDEA_CONFIG || {});

  function showRuntimeError(container, error, toolName) {
    console.error('[Toolidea]', toolName || 'tool', error);
    if (!container) return;
    container.innerHTML = '<div class="result-box" role="alert"><strong>Tool error</strong><p>This tool could not complete the operation. Your files were not uploaded to our server.</p><button class="btn" type="button" id="toolRetryBtn">↻ Try Again</button></div>';
    var retry = container.querySelector('#toolRetryBtn');
    if (retry) retry.addEventListener('click', function () { location.reload(); });
  }

  function colorDistance(r, g, b, s) {
    var dr = r - s[0], dg = g - s[1], db = b - s[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function removeEdgeBackground(canvas, tolerance) {
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var w = canvas.width, h = canvas.height;
    var image = ctx.getImageData(0, 0, w, h), data = image.data;
    var points = [[2,2],[w-3,2],[2,h-3],[w-3,h-3],[Math.floor(w/2),2],[Math.floor(w/2),h-3],[2,Math.floor(h/2)],[w-3,Math.floor(h/2)]];
    var samples = points.map(function (p) { var i=(p[1]*w+p[0])*4; return [data[i],data[i+1],data[i+2]]; });
    function bgPixel(p) {
      var i=p*4, r=data[i], g=data[i+1], b=data[i+2];
      for (var j=0;j<samples.length;j++) if (colorDistance(r,g,b,samples[j]) <= tolerance) return true;
      return false;
    }
    var total=w*h, seen=new Uint8Array(total), mask=new Uint8Array(total), queue=new Int32Array(total), head=0, tail=0;
    function seed(x,y){
      if(x<0||y<0||x>=w||y>=h) return;
      var p=y*w+x; if(seen[p]) return; seen[p]=1;
      if(bgPixel(p)){mask[p]=1;queue[tail++]=p;}
    }
    for(var x=0;x<w;x++){seed(x,0);seed(x,h-1);}
    for(var y=1;y<h-1;y++){seed(0,y);seed(w-1,y);}
    while(head<tail){
      var p=queue[head++], px=p%w, py=Math.floor(p/w);
      seed(px-1,py);seed(px+1,py);seed(px,py-1);seed(px,py+1);
    }
    for(var i=0;i<total;i++) if(mask[i]) data[i*4+3]=0;
    ctx.putImageData(image,0,0);
    return Math.round((tail/total)*100);
  }

  function makeFixedIdPhotoTool() {
    return {
      name: 'Passport & ID Photo Maker',
      desc: 'Create document-size photos and replace the original background with the selected color in your browser.',
      render: function (c) {
        c.innerHTML = '<label>Select Portrait Image</label><input type="file" id="idFile" accept="image/jpeg,image/png,image/webp,image/*" />' +
          '<div class="row"><label style="flex:1;">Format Standard</label><select id="idFormat" style="flex:2;"><option value="passport">Universal Passport (2×2 in / 51×51 mm)</option><option value="pan">Standard Document Photo (35×45 mm)</option><option value="us_visa">Visa Standard (2×2 in)</option></select></div>' +
          '<div class="row"><label style="flex:1;">Backdrop Color</label><select id="idBg" style="flex:2;"><option value="#ffffff">White</option><option value="#1a73e8">Blue</option><option value="#d32f2f">Red</option><option value="#e8e8e8">Light Grey</option></select></div>' +
          '<div class="row"><label style="flex:1;">Background Tolerance</label><input type="range" id="idTolerance" min="15" max="110" value="55" style="flex:2;"/><output id="idToleranceValue">55</output></div>' +
          '<p id="idStatus" class="hint-text">The selected color will replace the connected original background. Best results: plain backgrounds.</p>' +
          '<button class="btn" id="idBtn" type="button">Render Document Photo</button>' +
          '<div class="result-box" style="justify-content:center;flex-direction:column;align-items:center;"><canvas id="idCanvas" style="max-width:240px;width:100%;border-radius:4px;display:none;border:1px solid rgba(255,255,255,.3);"></canvas><div id="idDownload" style="margin-top:10px;"></div></div>';

        var fileEl=document.getElementById('idFile'), formatEl=document.getElementById('idFormat'), bgEl=document.getElementById('idBg'), tolEl=document.getElementById('idTolerance'), tolOut=document.getElementById('idToleranceValue'), btn=document.getElementById('idBtn'), status=document.getElementById('idStatus'), canvas=document.getElementById('idCanvas'), download=document.getElementById('idDownload');
        tolEl.addEventListener('input',function(){tolOut.value=tolEl.value;});

        async function renderPhoto(){
          var file=fileEl.files && fileEl.files[0]; if(!file){alert('Upload a photo first.');return;}
          btn.disabled=true;btn.textContent='Processing…';status.textContent='Removing the original background…';download.innerHTML='';
          try{
            var dims={passport:[600,600],pan:[413,531],us_visa:[600,600]}, size=dims[formatEl.value]||dims.passport;
            var img=await loadImage(await fileToDataURL(file));
            var working=document.createElement('canvas');working.width=size[0];working.height=size[1];
            var ctx=working.getContext('2d');var ratio=img.width/img.height,target=size[0]/size[1],sx=0,sy=0,sw=img.width,sh=img.height;
            if(ratio>target){sw=img.height*target;sx=(img.width-sw)/2;}else{sh=img.width/target;sy=(img.height-sh)/2;}
            ctx.drawImage(img,sx,sy,sw,sh,0,0,size[0],size[1]);
            var removed=removeEdgeBackground(working,Number(tolEl.value));
            var finalCanvas=document.createElement('canvas');finalCanvas.width=size[0];finalCanvas.height=size[1];
            var out=finalCanvas.getContext('2d');out.fillStyle=bgEl.value;out.fillRect(0,0,size[0],size[1]);out.drawImage(working,0,0);
            canvas.width=size[0];canvas.height=size[1];canvas.style.display='block';canvas.getContext('2d').drawImage(finalCanvas,0,0);
            var data=canvas.toDataURL('image/jpeg',0.95);
            download.innerHTML='<a href="'+data+'" download="toolidea-id-photo.jpg" class="btn">⬇️ Download JPG</a>';
            status.textContent='Background replaced successfully ('+removed+'% detected background). If some background remains, increase tolerance slightly.';
          }catch(error){console.error('[Toolidea] ID photo error',error);status.textContent='Could not process this image. Try a JPG, PNG or WebP photo.';}
          finally{btn.disabled=false;btn.textContent='Render Document Photo';}
        }
        btn.addEventListener('click',renderPhoto);
        bgEl.addEventListener('change',function(){if(fileEl.files&&fileEl.files[0])renderPhoto();});
        formatEl.addEventListener('change',function(){if(fileEl.files&&fileEl.files[0])renderPhoto();});
      }
    };
  }

  function wrapTools() {
    var registry;
    try { registry = TOOLS; } catch (_) { registry = null; }
    if (!registry || window.__toolideaWrapped) return;
    window.__toolideaWrapped = true;
    window.TOOLIDEA_TOOLS = registry;
    try { window.TOOLIDEA_CATEGORIES = CATEGORIES; } catch (_) {}
    registry.idphoto = makeFixedIdPhotoTool();

    Object.keys(registry).forEach(function (key) {
      var tool = registry[key];
      if (!tool || typeof tool.render !== 'function' || tool.__toolideaWrapped) return;
      var original = tool.render;
      tool.render = function (container) {
        try { return original.call(this, container); }
        catch (error) { showRuntimeError(container, error, tool.name || key); }
      };
      tool.__toolideaWrapped = true;
    });

    /* app.js renders the current route before this production layer runs. Re-render the ID photo route so the fix is visible immediately. */
    if (location.hash.replace('#/','').trim() === 'idphoto' && typeof handleRoute === 'function') handleRoute();
  }

  function ensureAdSlots() {
    document.querySelectorAll('.ad-placeholder').forEach(function (slot) {
      if (slot.dataset.toolideaReady) return;
      slot.dataset.toolideaReady='1'; slot.setAttribute('aria-label','Advertisement');
      var label=slot.querySelector('span'); if(label) label.textContent='Advertisement';
    });
  }

  function brand() {
    document.title='Toolidea – 90+ Free Online Tools';
    document.querySelectorAll('.brand-text strong,.footer-col strong').forEach(function(el){el.textContent='Toolidea';});
    document.querySelectorAll('.brand-text span').forEach(function(el){el.textContent='90+ Online Tools';});
    document.querySelectorAll('.footer-bottom').forEach(function(el){el.innerHTML='<span>© '+new Date().getFullYear()+' Toolidea. All utilities client-side.</span><span>No tool data is sent to our servers.</span>';});
  }

  function installGlobalGuards(){
    window.addEventListener('error',function(event){console.error('[Toolidea] Runtime error:',event.error||event.message);});
    window.addEventListener('unhandledrejection',function(event){console.error('[Toolidea] Promise rejection:',event.reason);});
  }

  function init(){brand();ensureAdSlots();wrapTools();installGlobalGuards();window.dispatchEvent(new CustomEvent('toolidea:ready'));}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
