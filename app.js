function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

window.__copyMap = {};
function makeCopyBtn(text) {
  const id = 'cp_' + Math.random().toString(36).slice(2, 10);
  window.__copyMap[id] = text;
  return `<button class="copy-btn" data-copy-id="${id}" onclick="copyStored(this)">Copy</button>`;
}

function copyStored(btn) {
  const id = btn.getAttribute('data-copy-id');
  copyText(window.__copyMap[id] ?? '');
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(flashCopied).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch(e){}
  ta.remove();
  flashCopied();
}

function flashCopied() {
  const t = document.createElement('div');
  t.textContent = '✅ Copied to clipboard';
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#7c5cff;color:#fff;padding:10px 20px;border-radius:30px;font-size:.85rem;z-index:2000;box-shadow:0 10px 30px rgba(0,0,0,.4);';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1400);
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function downloadLinkHtml(dataUrl, filename, label) {
  return `<a href="${dataUrl}" download="${filename}" class="btn">${label || '⬇️ Download'}</a>`;
}

function makeUnitConverter(id, units, factors, decimals) {
  return {
    render: function(c) {
      const opts = Object.keys(units).map(k => `<option value="${k}">${units[k]}</option>`).join('');
      c.innerHTML = `
        <div class="row">
          <input type="number" id="${id}Val" placeholder="Value" value="1" style="flex:1;" />
          <select id="${id}From" style="flex:1;">${opts}</select>
          <span>→</span>
          <select id="${id}To" style="flex:1;">${opts}</select>
        </div>
        <button class="btn" id="${id}Btn">Convert</button>
        <div id="${id}Result" class="result-box">—</div>`;
      document.getElementById(id + 'Btn').addEventListener('click', function() {
        const val = parseFloat(document.getElementById(id + 'Val').value);
        if (isNaN(val)) { document.getElementById(id + 'Result').innerHTML = 'Enter a valid number'; return; }
        const from = document.getElementById(id + 'From').value, to = document.getElementById(id + 'To').value;
        const result = val * (factors[to] / factors[from]);
        const out = `${val} ${units[from]} = ${result.toFixed(decimals)} ${units[to]}`;
        document.getElementById(id + 'Result').innerHTML = out + makeCopyBtn(out);
      });
    }
  };
}

const TOOLS = {};

// 1. IMAGE TOOLS
TOOLS.qrcode = {
  name: 'QR Code Generator',
  desc: 'Generate QR codes completely offline using pure client-side JavaScript.',
  render: function(c) {
    c.innerHTML = `
      <label>Content / URL</label>
      <textarea id="qrInput" placeholder="https://example.com">https://example.com</textarea>
      <div class="row">
        <label style="flex:1;">Dimension</label>
        <select id="qrSize" style="flex:2;">
          <option value="128">128 × 128 px</option>
          <option value="256" selected>256 × 256 px</option>
          <option value="512">512 × 512 px</option>
        </select>
      </div>
      <button class="btn" id="qrBtn">Generate QR Code</button>
      <div class="result-box" style="justify-content:center; flex-direction:column; align-items:center; min-height:260px;">
        <div id="qrCanvasWrap" style="background:#fff; padding:12px; border-radius:8px; margin: 12px 0;"></div>
        <div id="qrDownloadWrap"></div>
      </div>`;
    function gen() {
      const text = document.getElementById('qrInput').value.trim();
      const size = parseInt(document.getElementById('qrSize').value) || 256;
      const wrap = document.getElementById('qrCanvasWrap');
      wrap.innerHTML = '';
      if (!text) return;
      new QRCode(wrap, { text: text, width: size, height: size, correctLevel: QRCode.CorrectLevel.H });
      setTimeout(() => {
        const img = wrap.querySelector('img') || wrap.querySelector('canvas');
        if (img) {
          const src = img.src || (img.toDataURL ? img.toDataURL() : '');
          if (src) document.getElementById('qrDownloadWrap').innerHTML = downloadLinkHtml(src, 'qrcode.png', '⬇️ Download QR');
        }
      }, 100);
    }
    document.getElementById('qrBtn').addEventListener('click', gen);
    gen();
  }
};

TOOLS.idphoto = {
  name: 'Passport & ID Photo Maker',
  desc: 'Scale and frame portrait photos according to global document specifications.',
  render: function(c) {
    c.innerHTML = `
      <label>Select Portrait Image</label><input type="file" id="idFile" accept="image/*" />
      <div class="row">
        <label style="flex:1;">Format Standard</label>
        <select id="idFormat" style="flex:2;">
          <option value="passport">Universal Passport (2x2 in / 51x51 mm)</option>
          <option value="pan">Standard Document Photo (3.5x4.5 cm)</option>
          <option value="us_visa">Visa Standard (2x2 in)</option>
        </select>
      </div>
      <div class="row">
        <label style="flex:1;">Backdrop Color</label>
        <select id="idBg" style="flex:2;">
          <option value="#ffffff">White</option>
          <option value="#1a73e8">Blue</option>
          <option value="#d32f2f">Red</option>
        </select>
      </div>
      <button class="btn" id="idBtn">Render Document Photo</button>
      <div class="result-box" style="justify-content:center; flex-direction:column; align-items:center;">
        <canvas id="idCanvas" style="max-width:240px; border-radius:4px; display:none; border:1px solid rgba(255,255,255,0.3);"></canvas>
        <div id="idDownload" style="margin-top:10px;"></div>
      </div>`;
    document.getElementById('idBtn').addEventListener('click', async () => {
      const file = document.getElementById('idFile').files[0];
      if (!file) return alert('Upload a file first.');
      const dims = { passport: [600, 600], pan: [413, 531], us_visa: [600, 600] };
      const [w, h] = dims[document.getElementById('idFormat').value];
      const bg = document.getElementById('idBg').value;
      const img = await loadImage(await fileToDataURL(file));
      const canvas = document.getElementById('idCanvas');
      canvas.width = w; canvas.height = h; canvas.style.display = 'block';
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      const ratio = img.width / img.height;
      let sw = img.width, sh = img.height, sx = 0, sy = 0;
      if (ratio > (w / h)) { sw = img.height * (w / h); sx = (img.width - sw) / 2; }
      else { sh = img.width / (w / h); sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      const data = canvas.toDataURL('image/jpeg', 0.95);
      document.getElementById('idDownload').innerHTML = downloadLinkHtml(data, 'id-photo.jpg', '⬇️ Download JPG');
    });
  }
};

TOOLS.imgtopdf = {
  name: 'Images to PDF Converter',
  desc: 'Combine multiple image files into a single unified PDF document.',
  render: function(c) {
    c.innerHTML = `
      <label>Select Images</label><input type="file" id="pdfImgFiles" accept="image/*" multiple />
      <button class="btn" id="pdfImgBtn">Generate PDF</button>
      <div id="pdfImgRes" class="result-box">Select files to begin.</div>`;
    document.getElementById('pdfImgBtn').addEventListener('click', async () => {
      const files = document.getElementById('pdfImgFiles').files;
      if (!files.length) return alert('Select image files.');
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight();
      for (let i = 0; i < files.length; i++) {
        const d = await fileToDataURL(files[i]);
        const img = await loadImage(d);
        if (i > 0) doc.addPage('a4', 'p');
        const ratio = img.width / img.height;
        let w = pw - 20, h = w / ratio;
        if (h > ph - 20) { h = ph - 20; w = h * ratio; }
        doc.addImage(d, 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h);
      }
      const url = URL.createObjectURL(doc.output('blob'));
      document.getElementById('pdfImgRes').innerHTML = downloadLinkHtml(url, 'document.pdf', '⬇️ Download PDF');
    });
  }
};

TOOLS.imageresize = {
  name: 'Image Resizer',
  desc: 'Scale pixel dimensions with aspect-ratio locking.',
  render: function(c) {
    c.innerHTML = `
      <label>Upload Image</label><input type="file" id="resFile" accept="image/*" />
      <div class="row">
        <label>Width</label><input type="number" id="resW" value="800" style="width:100px;" />
        <label>Height</label><input type="number" id="resH" value="600" style="width:100px;" />
        <label><input type="checkbox" id="resLock" checked /> Lock Aspect Ratio</label>
      </div>
      <button class="btn" id="resBtn">Resize Image</button>
      <div id="resResult" class="result-box" style="justify-content:center; flex-direction:column;">
        <canvas id="resCanvas" style="max-width:300px; display:none;"></canvas>
        <div id="resDownload"></div>
      </div>`;
    document.getElementById('resBtn').addEventListener('click', async () => {
      const f = document.getElementById('resFile').files[0];
      if (!f) return alert('Select an image.');
      const img = await loadImage(await fileToDataURL(f));
      let w = parseInt(document.getElementById('resW').value) || 800;
      let h = parseInt(document.getElementById('resH').value) || 600;
      if (document.getElementById('resLock').checked) h = Math.round(w * (img.height / img.width));
      const cv = document.getElementById('resCanvas');
      cv.width = w; cv.height = h; cv.style.display = 'block';
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      document.getElementById('resDownload').innerHTML = downloadLinkHtml(cv.toDataURL('image/png'), 'resized.png', '⬇️ Download PNG');
    });
  }
};

TOOLS.imgconvert = {
  name: 'Image Format Converter',
  desc: 'Convert formats between PNG, JPEG, and WebP locally.',
  render: function(c) {
    c.innerHTML = `
      <label>Upload Image</label><input type="file" id="cvFile" accept="image/*" />
      <div class="row">
        <label>Target Format</label>
        <select id="cvFmt"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WEBP</option></select>
      </div>
      <button class="btn" id="cvBtn">Convert</button>
      <div id="cvOut" class="result-box" style="justify-content:center; flex-direction:column;"></div>`;
    document.getElementById('cvBtn').addEventListener('click', async () => {
      const f = document.getElementById('cvFile').files[0];
      if (!f) return alert('Select an image.');
      const img = await loadImage(await fileToDataURL(f));
      const fmt = document.getElementById('cvFmt').value;
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      cv.getContext('2d').drawImage(img, 0, 0);
      const data = cv.toDataURL(fmt);
      document.getElementById('cvOut').innerHTML = downloadLinkHtml(data, `converted.${fmt.split('/')[1]}`, '⬇️ Download Converted Image');
    });
  }
};

TOOLS.imgcompress = {
  name: 'Image Compressor',
  desc: 'Adjust compression quality and reduce image payload sizes.',
  render: function(c) {
    c.innerHTML = `
      <label>Upload Image</label><input type="file" id="compFile" accept="image/*" />
      <div class="row">
        <label>Quality (0.1 - 0.9)</label><input type="number" id="compQ" value="0.7" step="0.1" min="0.1" max="1.0" style="width:100px;" />
      </div>
      <button class="btn" id="compBtn">Compress</button>
      <div id="compOut" class="result-box" style="justify-content:center; flex-direction:column;"></div>`;
    document.getElementById('compBtn').addEventListener('click', async () => {
      const f = document.getElementById('compFile').files[0];
      if (!f) return alert('Select an image.');
      const q = parseFloat(document.getElementById('compQ').value) || 0.7;
      const img = await loadImage(await fileToDataURL(f));
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      cv.getContext('2d').drawImage(img, 0, 0);
      const data = cv.toDataURL('image/jpeg', q);
      const sizeKB = Math.round((data.length * 3 / 4) / 1024);
      document.getElementById('compOut').innerHTML = `<span>Compressed Size: ~${sizeKB} KB</span><br>` + downloadLinkHtml(data, 'compressed.jpg', '⬇️ Download JPG');
    });
  }
};

TOOLS.grayscale = {
  name: 'Grayscale Filter',
  desc: 'Strip RGB color channels to create monochrome pictures.',
  render: function(c) {
    c.innerHTML = `
      <label>Upload Image</label><input type="file" id="grayFile" accept="image/*" />
      <button class="btn" id="grayBtn">Process Grayscale</button>
      <div id="grayOut" class="result-box" style="justify-content:center; flex-direction:column;"></div>`;
    document.getElementById('grayBtn').addEventListener('click', async () => {
      const f = document.getElementById('grayFile').files[0];
      if (!f) return alert('Select an image.');
      const img = await loadImage(await fileToDataURL(f));
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, cv.width, cv.height);
      for (let i = 0; i < id.data.length; i += 4) {
        const avg = (id.data[i] + id.data[i+1] + id.data[i+2]) / 3;
        id.data[i] = id.data[i+1] = id.data[i+2] = avg;
      }
      ctx.putImageData(id, 0, 0);
      document.getElementById('grayOut').innerHTML = downloadLinkHtml(cv.toDataURL('image/png'), 'grayscale.png', '⬇️ Download');
    });
  }
};

TOOLS.sepia = {
  name: 'Sepia Filter',
  desc: 'Apply warm retro tones to photographic images.',
  render: function(c) {
    c.innerHTML = `
      <label>Upload Image</label><input type="file" id="sepFile" accept="image/*" />
      <button class="btn" id="sepBtn">Apply Sepia</button>
      <div id="sepOut" class="result-box" style="justify-content:center; flex-direction:column;"></div>`;
    document.getElementById('sepBtn').addEventListener('click', async () => {
      const f = document.getElementById('sepFile').files[0];
      if (!f) return alert('Select an image.');
      const img = await loadImage(await fileToDataURL(f));
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, cv.width, cv.height);
      for (let i = 0; i < id.data.length; i += 4) {
        const r = id.data[i], g = id.data[i+1], b = id.data[i+2];
        id.data[i] = Math.min(255, 0.393*r + 0.769*g + 0.189*b);
        id.data[i+1] = Math.min(255, 0.349*r + 0.686*g + 0.168*b);
        id.data[i+2] = Math.min(255, 0.272*r + 0.534*g + 0.131*b);
      }
      ctx.putImageData(id, 0, 0);
      document.getElementById('sepOut').innerHTML = downloadLinkHtml(cv.toDataURL('image/png'), 'sepia.png', '⬇️ Download');
    });
  }
};

TOOLS.brightness = {
  name: 'Brightness & Contrast',
  desc: 'Adjust exposure levels and contrast balance via 2D Canvas.',
  render: function(c) {
    c.innerHTML = `
      <label>Upload Image</label><input type="file" id="bcFile" accept="image/*" />
      <div class="row">
        <label>Brightness</label><input type="range" id="bcB" min="-100" max="100" value="0" />
        <label>Contrast</label><input type="range" id="bcC" min="-100" max="100" value="0" />
      </div>
      <button class="btn" id="bcBtn">Apply Adjustments</button>
      <div id="bcOut" class="result-box" style="justify-content:center; flex-direction:column;"></div>`;
    document.getElementById('bcBtn').addEventListener('click', async () => {
      const f = document.getElementById('bcFile').files[0];
      if (!f) return alert('Select an image.');
      const b = parseInt(document.getElementById('bcB').value);
      const co = parseInt(document.getElementById('bcC').value);
      const img = await loadImage(await fileToDataURL(f));
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, cv.width, cv.height);
      const factor = (259 * (co + 255)) / (255 * (259 - co));
      for (let i = 0; i < id.data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
          let val = factor * (id.data[i+j] - 128) + 128 + b;
          id.data[i+j] = Math.min(255, Math.max(0, val));
        }
      }
      ctx.putImageData(id, 0, 0);
      document.getElementById('bcOut').innerHTML = downloadLinkHtml(cv.toDataURL('image/png'), 'adjusted.png', '⬇️ Download');
    });
  }
};

TOOLS.rotateflip = {
  name: 'Rotate & Flip Image',
  desc: 'Rotate images by 90-degree increments or flip horizontally and vertically.',
  render: function(c) {
    c.innerHTML = `
      <label>Upload Image</label><input type="file" id="rfFile" accept="image/*" />
      <div class="row">
        <button class="btn btn-secondary" id="rfRot">Rotate 90°</button>
        <button class="btn btn-secondary" id="rfFlip">Flip Horizontal</button>
      </div>
      <div id="rfOut" class="result-box" style="justify-content:center; flex-direction:column;"></div>`;
    let cur = null;
    document.getElementById('rfRot').addEventListener('click', async () => {
      const f = document.getElementById('rfFile').files[0];
      if (!f && !cur) return alert('Select an image.');
      const img = cur || await loadImage(await fileToDataURL(f));
      const cv = document.createElement('canvas'); cv.width = img.height; cv.height = img.width;
      const ctx = cv.getContext('2d'); ctx.translate(cv.width, 0); ctx.rotate(Math.PI/2);
      ctx.drawImage(img, 0, 0);
      cur = await loadImage(cv.toDataURL());
      document.getElementById('rfOut').innerHTML = downloadLinkHtml(cur.src, 'rotated.png', '⬇️ Download PNG');
    });
    document.getElementById('rfFlip').addEventListener('click', async () => {
      const f = document.getElementById('rfFile').files[0];
      if (!f && !cur) return alert('Select an image.');
      const img = cur || await loadImage(await fileToDataURL(f));
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.translate(cv.width, 0); ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      cur = await loadImage(cv.toDataURL());
      document.getElementById('rfOut').innerHTML = downloadLinkHtml(cur.src, 'flipped.png', '⬇️ Download PNG');
    });
  }
};

TOOLS.imgbase64 = {
  name: 'Image to Base64',
  desc: 'Encode image files into data URI strings for CSS and HTML embeddings.',
  render: function(c) {
    c.innerHTML = `
      <label>Select Image File</label><input type="file" id="ibFile" accept="image/*" />
      <button class="btn" id="ibBtn">Encode to Base64</button>
      <div id="ibOut" class="result-box" style="word-break:break-all;">URI string will appear here.</div>`;
    document.getElementById('ibBtn').addEventListener('click', async () => {
      const f = document.getElementById('ibFile').files[0];
      if (!f) return alert('Select a file.');
      const d = await fileToDataURL(f);
      document.getElementById('ibOut').innerHTML = escapeHtml(d) + makeCopyBtn(d);
    });
  }
};

TOOLS.crop = {
  name: 'Image Cropper',
  desc: 'Extract bounding box dimensions (X, Y, W, H) from any graphic.',
  render: function(c) {
    c.innerHTML = `
      <label>Upload Image</label><input type="file" id="crFile" accept="image/*" />
      <div class="row">
        <label>X<input type="number" id="crX" value="0" style="width:70px;" /></label>
        <label>Y<input type="number" id="crY" value="0" style="width:70px;" /></label>
        <label>W<input type="number" id="crW" value="200" style="width:80px;" /></label>
        <label>H<input type="number" id="crH" value="200" style="width:80px;" /></label>
      </div>
      <button class="btn" id="crBtn">Crop Canvas</button>
      <div id="crOut" class="result-box" style="justify-content:center; flex-direction:column;"></div>`;
    document.getElementById('crBtn').addEventListener('click', async () => {
      const f = document.getElementById('crFile').files[0];
      if (!f) return alert('Select an image.');
      const x = parseInt(document.getElementById('crX').value) || 0;
      const y = parseInt(document.getElementById('crY').value) || 0;
      const w = parseInt(document.getElementById('crW').value) || 200;
      const h = parseInt(document.getElementById('crH').value) || 200;
      const img = await loadImage(await fileToDataURL(f));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
      document.getElementById('crOut').innerHTML = downloadLinkHtml(cv.toDataURL('image/png'), 'cropped.png', '⬇️ Download Cropped');
    });
  }
};

TOOLS.textimage = {
  name: 'Quote Card Generator',
  desc: 'Generate shareable graphic cards from text quotes.',
  render: function(c) {
    c.innerHTML = `
      <label>Card Text</label><textarea id="tiText">Simplicity is prerequisite for reliability.</textarea>
      <button class="btn" id="tiBtn">Generate Card</button>
      <div class="result-box" style="justify-content:center; flex-direction:column; align-items:center;">
        <div id="tiCard" style="width:360px; height:200px; background:linear-gradient(135deg,var(--violet),var(--cyan)); border-radius:12px; display:flex; align-items:center; justify-content:center; padding:20px; text-align:center; font-family:var(--font-display); font-weight:700; color:#fff;">Simplicity is prerequisite for reliability.</div>
        <div id="tiOut" style="margin-top:10px;"></div>
      </div>`;
    document.getElementById('tiText').addEventListener('input', function() { document.getElementById('tiCard').textContent = this.value; });
    document.getElementById('tiBtn').addEventListener('click', () => {
      html2canvas(document.getElementById('tiCard')).then(cv => {
        document.getElementById('tiOut').innerHTML = downloadLinkHtml(cv.toDataURL('image/png'), 'quote-card.png', '⬇️ Download Card');
      });
    });
  }
};

// 2. TEXT TOOLS
TOOLS.charcount = {
  name: 'Character & Word Statistics',
  desc: 'Count characters, words, sentences, lines, and reading metrics.',
  render: function(c) {
    c.innerHTML = `
      <label>Source Text</label><textarea id="ccInput" placeholder="Paste text here..."></textarea>
      <div id="ccOut" class="result-box">Characters: 0 | Words: 0 | Lines: 0 | Reading Time: ~0 min</div>`;
    document.getElementById('ccInput').addEventListener('input', function() {
      const v = this.value;
      const chars = v.length;
      const words = v.trim() ? (v.match(/\S+/g) || []).length : 0;
      const lines = v.split('\n').length;
      document.getElementById('ccOut').textContent = `Characters: ${chars} | Words: ${words} | Lines: ${lines} | Reading Time: ~${Math.ceil(words/200)} min`;
    });
  }
};

TOOLS.caseconv = {
  name: 'Case Converter',
  desc: 'Transform strings to UPPERCASE, lowercase, Title Case, or Sentence case.',
  render: function(c) {
    c.innerHTML = `
      <label>Input Text</label><textarea id="caseInput"></textarea>
      <div class="row">
        <button class="btn" id="cUpper">UPPERCASE</button>
        <button class="btn btn-secondary" id="cLower">lowercase</button>
        <button class="btn btn-secondary" id="cTitle">Title Case</button>
        <button class="btn btn-secondary" id="cSent">Sentence case</button>
      </div>
      <div id="caseOut" class="result-box">—</div>`;
    function setCase(fn) {
      const t = document.getElementById('caseInput').value;
      const out = fn(t);
      document.getElementById('caseOut').innerHTML = escapeHtml(out) + makeCopyBtn(out);
    }
    document.getElementById('cUpper').addEventListener('click', () => setCase(t => t.toUpperCase()));
    document.getElementById('cLower').addEventListener('click', () => setCase(t => t.toLowerCase()));
    document.getElementById('cTitle').addEventListener('click', () => setCase(t => t.replace(/\b\w/g, c => c.toUpperCase())));
    document.getElementById('cSent').addEventListener('click', () => setCase(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()));
  }
};

TOOLS.codecase = {
  name: 'Code Case Converter',
  desc: 'Convert strings to camelCase, snake_case, kebab-case, and PascalCase.',
  render: function(c) {
    c.innerHTML = `
      <label>Input String</label><input type="text" id="ccIn" placeholder="hello world example" />
      <div class="row">
        <button class="btn" data-c="camel">camelCase</button>
        <button class="btn btn-secondary" data-c="pascal">PascalCase</button>
        <button class="btn btn-secondary" data-c="snake">snake_case</button>
        <button class="btn btn-secondary" data-c="kebab">kebab-case</button>
      </div>
      <div id="ccOut" class="result-box">—</div>`;
    c.querySelectorAll('[data-c]').forEach(b => {
      b.addEventListener('click', () => {
        const w = document.getElementById('ccIn').value.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_\-]+/).filter(Boolean).map(x => x.toLowerCase());
        let res = '';
        const m = b.dataset.c;
        if (m === 'camel') res = w.map((x, i) => i === 0 ? x : x[0].toUpperCase() + x.slice(1)).join('');
        if (m === 'pascal') res = w.map(x => x[0].toUpperCase() + x.slice(1)).join('');
        if (m === 'snake') res = w.join('_');
        if (m === 'kebab') res = w.join('-');
        document.getElementById('ccOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
      });
    });
  }
};

TOOLS.slug = {
  name: 'URL Slug Generator',
  desc: 'Convert human titles into clean, URL-safe alphanumeric slugs.',
  render: function(c) {
    c.innerHTML = `
      <label>Title / Text</label><input type="text" id="slugIn" placeholder="Best Online Tools 2026" />
      <button class="btn" id="slugBtn">Make Slug</button>
      <div id="slugOut" class="result-box">—</div>`;
    document.getElementById('slugBtn').addEventListener('click', () => {
      const v = document.getElementById('slugIn').value;
      const s = v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      document.getElementById('slugOut').innerHTML = escapeHtml(s) + makeCopyBtn(s);
    });
  }
};

TOOLS.reverse = {
  name: 'Text Reverser',
  desc: 'Reverse string characters or word orders.',
  render: function(c) {
    c.innerHTML = `<label>Input Text</label><input type="text" id="revIn" /><button class="btn" id="revBtn">Reverse</button><div id="revOut" class="result-box">—</div>`;
    document.getElementById('revBtn').addEventListener('click', () => {
      const res = document.getElementById('revIn').value.split('').reverse().join('');
      document.getElementById('revOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.palindrome = {
  name: 'Palindrome Checker',
  desc: 'Evaluate whether an alphanumeric sequence is an exact palindrome.',
  render: function(c) {
    c.innerHTML = `<label>String</label><input type="text" id="palIn" /><button class="btn" id="palBtn">Check Palindrome</button><div id="palOut" class="result-box">—</div>`;
    document.getElementById('palBtn').addEventListener('click', () => {
      const clean = document.getElementById('palIn').value.toLowerCase().replace(/[^a-z0-9]/g, '');
      const ok = clean.length > 0 && clean === clean.split('').reverse().join('');
      document.getElementById('palOut').textContent = ok ? '✅ Valid Palindrome' : '❌ Not a Palindrome';
    });
  }
};

TOOLS.repeater = {
  name: 'Text Repeater',
  desc: 'Repeat string sequences multiple times with custom delimiters.',
  render: function(c) {
    c.innerHTML = `
      <label>Text</label><input type="text" id="repT" value="Hello! " />
      <label>Count</label><input type="number" id="repC" value="5" min="1" max="500" />
      <button class="btn" id="repBtn">Repeat</button>
      <div id="repOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('repBtn').addEventListener('click', () => {
      const t = document.getElementById('repT').value;
      const n = parseInt(document.getElementById('repC').value) || 1;
      const out = t.repeat(Math.min(500, Math.max(1, n)));
      document.getElementById('repOut').innerHTML = escapeHtml(out) + makeCopyBtn(out);
    });
  }
};

TOOLS.loremipsum = {
  name: 'Lorem Ipsum Generator',
  desc: 'Generate filler dummy paragraphs for wireframes and mockups.',
  render: function(c) {
    c.innerHTML = `
      <label>Paragraphs</label><input type="number" id="liCount" value="3" min="1" max="20" />
      <button class="btn" id="liBtn">Generate Text</button>
      <div id="liOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    const words = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat".split(' ');
    document.getElementById('liBtn').addEventListener('click', () => {
      const n = parseInt(document.getElementById('liCount').value) || 3;
      const paras = [];
      for (let i = 0; i < n; i++) {
        const len = 30 + Math.floor(Math.random() * 20);
        const p = Array.from({length: len}, () => words[Math.floor(Math.random() * words.length)]).join(' ');
        paras.push(p.charAt(0).toUpperCase() + p.slice(1) + '.');
      }
      const out = paras.join('\n\n');
      document.getElementById('liOut').innerHTML = escapeHtml(out) + makeCopyBtn(out);
    });
  }
};

TOOLS.dedupe = {
  name: 'Remove Duplicate Lines',
  desc: 'Filter out repeating duplicate lines from large text lists.',
  render: function(c) {
    c.innerHTML = `
      <label>Input List</label><textarea id="ddIn" placeholder="item 1&#10;item 2&#10;item 1"></textarea>
      <button class="btn" id="ddBtn">Deduplicate Lines</button>
      <div id="ddOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('ddBtn').addEventListener('click', () => {
      const lines = document.getElementById('ddIn').value.split('\n');
      const unique = Array.from(new Set(lines));
      const res = unique.join('\n');
      document.getElementById('ddOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.linesort = {
  name: 'Line Sorter',
  desc: 'Sort list lines alphabetically or in reverse order.',
  render: function(c) {
    c.innerHTML = `
      <label>Lines</label><textarea id="lsIn"></textarea>
      <div class="row">
        <button class="btn" id="lsAsc">Sort A → Z</button>
        <button class="btn btn-secondary" id="lsDesc">Sort Z → A</button>
      </div>
      <div id="lsOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('lsAsc').addEventListener('click', () => {
      const l = document.getElementById('lsIn').value.split('\n').sort((a,b) => a.localeCompare(b)).join('\n');
      document.getElementById('lsOut').innerHTML = escapeHtml(l) + makeCopyBtn(l);
    });
    document.getElementById('lsDesc').addEventListener('click', () => {
      const l = document.getElementById('lsIn').value.split('\n').sort((a,b) => b.localeCompare(a)).join('\n');
      document.getElementById('lsOut').innerHTML = escapeHtml(l) + makeCopyBtn(l);
    });
  }
};

TOOLS.stripwhitespace = {
  name: 'Strip Whitespace',
  desc: 'Remove redundant spaces, line breaks, and excess tab characters.',
  render: function(c) {
    c.innerHTML = `
      <label>Text</label><textarea id="swIn"></textarea>
      <button class="btn" id="swBtn">Collapse Spacing</button>
      <div id="swOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('swBtn').addEventListener('click', () => {
      const r = document.getElementById('swIn').value.replace(/\s+/g, ' ').trim();
      document.getElementById('swOut').innerHTML = escapeHtml(r) + makeCopyBtn(r);
    });
  }
};

TOOLS.findreplace = {
  name: 'Find and Replace',
  desc: 'Replace matching text substrings throughout documents.',
  render: function(c) {
    c.innerHTML = `
      <label>Target Text</label><textarea id="frText"></textarea>
      <div class="row">
        <label style="flex:1;">Find<input type="text" id="frFind" /></label>
        <label style="flex:1;">Replace With<input type="text" id="frRep" /></label>
      </div>
      <button class="btn" id="frBtn">Execute Replace</button>
      <div id="frOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('frBtn').addEventListener('click', () => {
      const t = document.getElementById('frText').value;
      const f = document.getElementById('frFind').value;
      const r = document.getElementById('frRep').value;
      const out = t.split(f).join(r);
      document.getElementById('frOut').innerHTML = escapeHtml(out) + makeCopyBtn(out);
    });
  }
};

// 3. CRYPTOGRAPHY & SECURITY
TOOLS.hasher = {
  name: 'SHA-256 / SHA-512 Hash Engine',
  desc: 'Compute cryptographic hashes directly through the native Web Crypto API.',
  render: function(c) {
    c.innerHTML = `
      <label>Input Message</label><textarea id="hIn" placeholder="String data..."></textarea>
      <div class="row">
        <button class="btn" data-a="SHA-256">SHA-256</button>
        <button class="btn btn-secondary" data-a="SHA-512">SHA-512</button>
        <button class="btn btn-secondary" data-a="SHA-1">SHA-1</button>
      </div>
      <div id="hOut" class="result-box" style="word-break:break-all;">Select algorithm...</div>`;
    c.querySelectorAll('[data-a]').forEach(b => {
      b.addEventListener('click', async () => {
        const msg = document.getElementById('hIn').value;
        const buf = await crypto.subtle.digest(b.dataset.a, new TextEncoder().encode(msg));
        const hex = Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
        document.getElementById('hOut').innerHTML = `<strong>${b.dataset.a}:</strong> ${hex}` + makeCopyBtn(hex);
      });
    });
  }
};

TOOLS.jwt = {
  name: 'JWT Debugger',
  desc: 'Decode and inspect JSON Web Token claims and headers without network calls.',
  render: function(c) {
    c.innerHTML = `
      <label>Encoded JWT</label><textarea id="jwtIn" placeholder="eyJhbGciOi..."></textarea>
      <button class="btn" id="jwtBtn">Parse Token</button>
      <div id="jwtH" class="result-box" style="white-space:pre-wrap;">Header: —</div>
      <div id="jwtP" class="result-box" style="white-space:pre-wrap;">Payload: —</div>`;
    document.getElementById('jwtBtn').addEventListener('click', () => {
      const parts = document.getElementById('jwtIn').value.trim().split('.');
      if (parts.length < 2) return alert('Invalid JWT format.');
      const d = str => JSON.stringify(JSON.parse(atob(str.replace(/-/g, '+').replace(/_/g, '/'))), null, 2);
      try {
        document.getElementById('jwtH').innerHTML = `<strong>Header:</strong>\n` + escapeHtml(d(parts[0])) + makeCopyBtn(d(parts[0]));
        document.getElementById('jwtP').innerHTML = `<strong>Payload:</strong>\n` + escapeHtml(d(parts[1])) + makeCopyBtn(d(parts[1]));
      } catch(e) { alert('Parsing error: ' + e.message); }
    });
  }
};

TOOLS.uuid = {
  name: 'UUID v4 Generator',
  desc: 'Generate cryptographically random RFC4122 Version 4 UUIDs.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label>Quantity</label><input type="number" id="uc" value="5" min="1" max="50" style="width:80px;" />
        <button class="btn" id="uBtn">Generate UUIDs</button>
      </div>
      <div id="uOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('uBtn').addEventListener('click', () => {
      const n = Math.min(50, Math.max(1, parseInt(document.getElementById('uc').value) || 1));
      const out = Array.from({length: n}, () => crypto.randomUUID()).join('\n');
      document.getElementById('uOut').innerHTML = escapeHtml(out) + makeCopyBtn(out);
    });
  }
};

TOOLS.password = {
  name: 'Cryptographic Password Generator',
  desc: 'Generate secure passwords using hardware-backed entropy.',
  render: function(c) {
    c.innerHTML = `
      <label>Length</label><input type="number" id="pLen" value="16" min="6" max="64" />
      <button class="btn" id="pBtn">Generate Random Password</button>
      <div id="pOut" class="result-box">—</div>`;
    document.getElementById('pBtn').addEventListener('click', () => {
      const len = parseInt(document.getElementById('pLen').value) || 16;
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
      const arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      const res = Array.from(arr).map(x => chars[x % chars.length]).join('');
      document.getElementById('pOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.base64 = {
  name: 'Base64 Text Encoder',
  desc: 'Encode UTF-8 string data into Base64 format.',
  render: function(c) {
    c.innerHTML = `
      <label>Raw String</label><textarea id="b64In"></textarea>
      <button class="btn" id="b64Btn">Encode Base64</button>
      <div id="b64Out" class="result-box" style="word-break:break-all;">—</div>`;
    document.getElementById('b64Btn').addEventListener('click', () => {
      const val = document.getElementById('b64In').value;
      const res = btoa(unescape(encodeURIComponent(val)));
      document.getElementById('b64Out').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.base64dec = {
  name: 'Base64 Text Decoder',
  desc: 'Decode Base64 string payloads back to plain text.',
  render: function(c) {
    c.innerHTML = `
      <label>Base64 Payload</label><textarea id="b64dIn"></textarea>
      <button class="btn" id="b64dBtn">Decode to Text</button>
      <div id="b64dOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('b64dBtn').addEventListener('click', () => {
      try {
        const val = document.getElementById('b64dIn').value;
        const res = decodeURIComponent(escape(atob(val)));
        document.getElementById('b64dOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
      } catch(e) { document.getElementById('b64dOut').textContent = 'Invalid Base64 sequence.'; }
    });
  }
};

TOOLS.urlencode = {
  name: 'URL Encoder',
  desc: 'Convert special query characters to percent-encoded standards.',
  render: function(c) {
    c.innerHTML = `<label>Plain URI</label><textarea id="ueIn"></textarea><button class="btn" id="ueBtn">Encode</button><div id="ueOut" class="result-box">—</div>`;
    document.getElementById('ueBtn').addEventListener('click', () => {
      const res = encodeURIComponent(document.getElementById('ueIn').value);
      document.getElementById('ueOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.urldecode = {
  name: 'URL Decoder',
  desc: 'Decode percent-encoded strings back to standard URLs.',
  render: function(c) {
    c.innerHTML = `<label>Encoded URI</label><textarea id="udIn"></textarea><button class="btn" id="udBtn">Decode</button><div id="udOut" class="result-box">—</div>`;
    document.getElementById('udBtn').addEventListener('click', () => {
      try {
        const res = decodeURIComponent(document.getElementById('udIn').value);
        document.getElementById('udOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
      } catch(e) { document.getElementById('udOut').textContent = 'Malformed URI string.'; }
    });
  }
};

TOOLS.cipher = {
  name: 'ROT13 / Caesar Cipher',
  desc: 'Shift Latin alphabet letters with custom numerical offsets.',
  render: function(c) {
    c.innerHTML = `
      <label>Message</label><textarea id="ciphIn"></textarea>
      <div class="row">
        <label>Shift Offset</label><input type="number" id="ciphS" value="13" style="width:80px;" />
        <button class="btn" id="ciphBtn">Execute Cipher</button>
      </div>
      <div id="ciphOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('ciphBtn').addEventListener('click', () => {
      const s = parseInt(document.getElementById('ciphS').value) || 13;
      const res = document.getElementById('ciphIn').value.replace(/[a-zA-Z]/g, ch => {
        const base = ch <= 'Z' ? 65 : 97;
        return String.fromCharCode((ch.charCodeAt(0) - base + s + 2600) % 26 + base);
      });
      document.getElementById('ciphOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.morse = {
  name: 'Morse Code Translator',
  desc: 'Convert text characters into international Morse code.',
  render: function(c) {
    c.innerHTML = `<label>Message</label><textarea id="mIn"></textarea><button class="btn" id="mBtn">Translate to Morse</button><div id="mOut" class="result-box">—</div>`;
    const map = {a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',0:'-----',' ':'/'};
    document.getElementById('mBtn').addEventListener('click', () => {
      const res = document.getElementById('mIn').value.toLowerCase().split('').map(x => map[x] || x).join(' ');
      document.getElementById('mOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.binarytext = {
  name: 'Text to Binary',
  desc: 'Encode ASCII characters into binary bit streams.',
  render: function(c) {
    c.innerHTML = `<label>Text</label><input type="text" id="binIn" /><button class="btn" id="binBtn">To Binary</button><div id="binOut" class="result-box">—</div>`;
    document.getElementById('binBtn').addEventListener('click', () => {
      const res = document.getElementById('binIn').value.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      document.getElementById('binOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.textbinary = {
  name: 'Binary to Text',
  desc: 'Parse 8-bit binary numbers back into plain text.',
  render: function(c) {
    c.innerHTML = `<label>Binary (space separated)</label><textarea id="tbIn"></textarea><button class="btn" id="tbBtn">Parse to Text</button><div id="tbOut" class="result-box">—</div>`;
    document.getElementById('tbBtn').addEventListener('click', () => {
      try {
        const res = document.getElementById('tbIn').value.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
        document.getElementById('tbOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
      } catch(e) { document.getElementById('tbOut').textContent = 'Invalid binary sequence.'; }
    });
  }
};

// 4. DEVELOPER UTILITIES
TOOLS.jsonfmt = {
  name: 'JSON Formatter & Validator',
  desc: 'Format, validate, or minify raw JSON structures.',
  render: function(c) {
    c.innerHTML = `
      <label>JSON Input</label><textarea id="jfIn"></textarea>
      <div class="row">
        <button class="btn" id="jfFmt">Format (2 Spaces)</button>
        <button class="btn btn-secondary" id="jfMin">Minify</button>
      </div>
      <div id="jfOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('jfFmt').addEventListener('click', () => {
      try {
        const val = JSON.parse(document.getElementById('jfIn').value);
        const out = JSON.stringify(val, null, 2);
        document.getElementById('jfOut').innerHTML = escapeHtml(out) + makeCopyBtn(out);
      } catch(e) { document.getElementById('jfOut').textContent = 'JSON Syntax Error: ' + e.message; }
    });
    document.getElementById('jfMin').addEventListener('click', () => {
      try {
        const val = JSON.parse(document.getElementById('jfIn').value);
        const out = JSON.stringify(val);
        document.getElementById('jfOut').innerHTML = escapeHtml(out) + makeCopyBtn(out);
      } catch(e) { document.getElementById('jfOut').textContent = 'JSON Syntax Error: ' + e.message; }
    });
  }
};

TOOLS.htmlmin = {
  name: 'HTML Minifier',
  desc: 'Strip comments and redundant whitespace from HTML markup.',
  render: function(c) {
    c.innerHTML = `<label>HTML</label><textarea id="hmIn"></textarea><button class="btn" id="hmBtn">Minify HTML</button><div id="hmOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('hmBtn').addEventListener('click', () => {
      const res = document.getElementById('hmIn').value.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
      document.getElementById('hmOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.cssmin = {
  name: 'CSS Minifier',
  desc: 'Minify CSS files and compress declarations.',
  render: function(c) {
    c.innerHTML = `<label>CSS</label><textarea id="cmIn"></textarea><button class="btn" id="cmBtn">Minify CSS</button><div id="cmOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('cmBtn').addEventListener('click', () => {
      const res = document.getElementById('cmIn').value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').trim();
      document.getElementById('cmOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.jsmin = {
  name: 'JavaScript Minifier',
  desc: 'Strip comments and compress whitespace from scripts.',
  render: function(c) {
    c.innerHTML = `<label>JS Script</label><textarea id="jmIn"></textarea><button class="btn" id="jmBtn">Minify Script</button><div id="jmOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('jmBtn').addEventListener('click', () => {
      const res = document.getElementById('jmIn').value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\s+/g, ' ').trim();
      document.getElementById('jmOut').innerHTML = escapeHtml(res) + makeCopyBtn(res);
    });
  }
};

TOOLS.regex = {
  name: 'RegEx Tester',
  desc: 'Test JavaScript regular expressions against real-time sample strings.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:2;">Pattern<input type="text" id="rxPat" placeholder="[a-z]+" /></label>
        <label style="flex:1;">Flags<input type="text" id="rxFlg" value="g" /></label>
      </div>
      <label>Target String</label><textarea id="rxStr"></textarea>
      <button class="btn" id="rxBtn">Evaluate RegEx</button>
      <div id="rxOut" class="result-box">—</div>`;
    document.getElementById('rxBtn').addEventListener('click', () => {
      try {
        const rx = new RegExp(document.getElementById('rxPat').value, document.getElementById('rxFlg').value);
        const m = document.getElementById('rxStr').value.match(rx);
        document.getElementById('rxOut').innerHTML = m ? `Matches (${m.length}): ` + escapeHtml(m.join(', ')) : 'No matches found.';
      } catch(e) { document.getElementById('rxOut').textContent = 'Invalid RegEx: ' + e.message; }
    });
  }
};

TOOLS.sqlfmt = {
  name: 'SQL Formatter',
  desc: 'Format and indent SQL queries with standardized keywords.',
  render: function(c) {
    c.innerHTML = `<label>SQL Query</label><textarea id="sqlIn"></textarea><button class="btn" id="sqlBtn">Format SQL</button><div id="sqlOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('sqlBtn').addEventListener('click', () => {
      const kws = ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "JOIN", "LEFT JOIN", "RIGHT JOIN"];
      let s = document.getElementById('sqlIn').value;
      kws.forEach(k => { s = s.replace(new RegExp('\\b' + k + '\\b', 'gi'), '\n' + k.toUpperCase()); });
      const out = s.trim();
      document.getElementById('sqlOut').innerHTML = escapeHtml(out) + makeCopyBtn(out);
    });
  }
};

TOOLS.htmlescape = {
  name: 'HTML Entity Encoder / Decoder',
  desc: 'Convert special HTML characters (&, <, >, ", \') into entity codes and vice versa.',
  render: function(c) {
    c.innerHTML = `
      <label>HTML Code</label><textarea id="heIn"></textarea>
      <div class="row">
        <button class="btn" id="heEnc">Encode Entities</button>
        <button class="btn btn-secondary" id="heDec">Decode Entities</button>
      </div>
      <div id="heOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('heEnc').addEventListener('click', () => {
      const res = escapeHtml(document.getElementById('heIn').value);
      document.getElementById('heOut').innerHTML = res + makeCopyBtn(res);
    });
    document.getElementById('heDec').addEventListener('click', () => {
      const ta = document.createElement('textarea');
      ta.innerHTML = document.getElementById('heIn').value;
      document.getElementById('heOut').innerHTML = escapeHtml(ta.value) + makeCopyBtn(ta.value);
    });
  }
};

TOOLS.colorgen = {
  name: 'Color Generator',
  desc: 'Generate random HEX and RGB palettes with visual color swatches.',
  render: function(c) {
    c.innerHTML = `
      <button class="btn" id="colBtn">Roll Color</button>
      <div class="result-box" style="justify-content:center;">
        <div id="colBox" style="width:50px;height:50px;border-radius:8px;border:1px solid #fff;"></div>
        <span id="colHex">#7c5cff</span>
      </div>`;
    document.getElementById('colBtn').addEventListener('click', () => {
      const h = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      document.getElementById('colBox').style.background = h;
      document.getElementById('colHex').innerHTML = h + makeCopyBtn(h);
    });
  }
};

TOOLS.markdownpreview = {
  name: 'Markdown Previewer',
  desc: 'Render Markdown formatting into live HTML previews.',
  render: function(c) {
    c.innerHTML = `
      <label>Markdown</label><textarea id="mdIn"># Heading&#10;**Bold Text** and *Italic*</textarea>
      <button class="btn" id="mdBtn">Render Preview</button>
      <div id="mdOut" class="result-box" style="display:block;"></div>`;
    document.getElementById('mdBtn').addEventListener('click', () => {
      let t = document.getElementById('mdIn').value;
      t = t.replace(/^# (.*$)/gim, '<h2>$1</h2>')
           .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
           .replace(/\*(.*)\*/gim, '<em>$1</em>')
           .replace(/\n/gim, '<br>');
      document.getElementById('mdOut').innerHTML = t;
    });
  }
};

TOOLS.cssglass = {
  name: 'CSS Glassmorphism Generator',
  desc: 'Configure frosted glass CSS backdrop-filter declarations.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label>Blur (px)<input type="number" id="gBlur" value="16" /></label>
        <label>Opacity (0-1)<input type="number" id="gOp" value="0.1" step="0.05" /></label>
      </div>
      <button class="btn" id="gBtn">Generate CSS</button>
      <div id="gOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    document.getElementById('gBtn').addEventListener('click', () => {
      const b = document.getElementById('gBlur').value;
      const o = document.getElementById('gOp').value;
      const css = `background: rgba(255, 255, 255, ${o});\nbackdrop-filter: blur(${b}px);\n-webkit-backdrop-filter: blur(${b}px);\nborder: 1px solid rgba(255, 255, 255, 0.18);\nborder-radius: 12px;`;
      document.getElementById('gOut').innerHTML = escapeHtml(css) + makeCopyBtn(css);
    });
  }
};

TOOLS.cssboxshadow = {
  name: 'CSS Box Shadow Generator',
  desc: 'Calculate multi-directional CSS drop shadows.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label>X<input type="number" id="bsX" value="0" style="width:60px;" /></label>
        <label>Y<input type="number" id="bsY" value="10" style="width:60px;" /></label>
        <label>Blur<input type="number" id="bsB" value="30" style="width:60px;" /></label>
        <label>Spread<input type="number" id="bsS" value="-5" style="width:60px;" /></label>
      </div>
      <button class="btn" id="bsBtn">Generate Shadow</button>
      <div id="bsOut" class="result-box">—</div>`;
    document.getElementById('bsBtn').addEventListener('click', () => {
      const str = `box-shadow: ${document.getElementById('bsX').value}px ${document.getElementById('bsY').value}px ${document.getElementById('bsB').value}px ${document.getElementById('bsS').value}px rgba(0, 0, 0, 0.35);`;
      document.getElementById('bsOut').innerHTML = escapeHtml(str) + makeCopyBtn(str);
    });
  }
};

TOOLS.cssgradient = {
  name: 'CSS Gradient Generator',
  desc: 'Generate linear CSS color blends with custom angle orientations.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label>Color A<input type="color" id="grA" value="#7c5cff" /></label>
        <label>Color B<input type="color" id="grB" value="#22d3ee" /></label>
        <label>Angle (deg)<input type="number" id="grDeg" value="135" style="width:80px;" /></label>
      </div>
      <button class="btn" id="grBtn">Generate Gradient</button>
      <div id="grOut" class="result-box">—</div>`;
    document.getElementById('grBtn').addEventListener('click', () => {
      const str = `background: linear-gradient(${document.getElementById('grDeg').value}deg, ${document.getElementById('grA').value}, ${document.getElementById('grB').value});`;
      document.getElementById('grOut').innerHTML = escapeHtml(str) + makeCopyBtn(str);
    });
  }
};

// 5. MATHEMATICS TOOLS
TOOLS.randomnum = {
  name: 'Random Number Generator',
  desc: 'Generate random integers within custom min/max bounds.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label>Min</label><input type="number" id="rnMin" value="1" style="width:80px;" />
        <label>Max</label><input type="number" id="rnMax" value="100" style="width:80px;" />
      </div>
      <button class="btn" id="rnBtn">Roll Random</button>
      <div id="rnOut" class="result-box">—</div>`;
    document.getElementById('rnBtn').addEventListener('click', () => {
      const min = parseInt(document.getElementById('rnMin').value) || 0;
      const max = parseInt(document.getElementById('rnMax').value) || 100;
      const res = Math.floor(Math.random() * (max - min + 1)) + min;
      document.getElementById('rnOut').innerHTML = res + makeCopyBtn(String(res));
    });
  }
};

TOOLS.prime = {
  name: 'Prime Number Checker',
  desc: 'Evaluate whether an integer is prime.',
  render: function(c) {
    c.innerHTML = `<label>Number</label><input type="number" id="prIn" /><button class="btn" id="prBtn">Evaluate</button><div id="prOut" class="result-box">—</div>`;
    document.getElementById('prBtn').addEventListener('click', () => {
      const n = parseInt(document.getElementById('prIn').value);
      if (isNaN(n) || n < 2) { document.getElementById('prOut').textContent = 'Enter an integer >= 2'; return; }
      let isP = true;
      for (let i = 2; i * i <= n; i++) { if (n % i === 0) { isP = false; break; } }
      document.getElementById('prOut').textContent = `${n} is ${isP ? 'a PRIME' : 'NOT a prime'} number.`;
    });
  }
};

TOOLS.fibonacci = {
  name: 'Fibonacci Sequence Generator',
  desc: 'Generate terms of the Fibonacci sequence.',
  render: function(c) {
    c.innerHTML = `<label>Count</label><input type="number" id="fibN" value="10" min="1" max="50" /><button class="btn" id="fibBtn">Generate</button><div id="fibOut" class="result-box">—</div>`;
    document.getElementById('fibBtn').addEventListener('click', () => {
      const n = parseInt(document.getElementById('fibN').value) || 10;
      const seq = [0, 1];
      for (let i = 2; i < n; i++) seq.push(seq[i-1] + seq[i-2]);
      const res = seq.slice(0, n).join(', ');
      document.getElementById('fibOut').innerHTML = res + makeCopyBtn(res);
    });
  }
};

TOOLS.factorial = {
  name: 'Factorial Calculator',
  desc: 'Calculate factorials using BigInt arithmetic.',
  render: function(c) {
    c.innerHTML = `<label>Integer (0-150)</label><input type="number" id="facIn" value="5" /><button class="btn" id="facBtn">Compute Factorial</button><div id="facOut" class="result-box">—</div>`;
    document.getElementById('facBtn').addEventListener('click', () => {
      const n = parseInt(document.getElementById('facIn').value);
      if (isNaN(n) || n < 0) return;
      let res = 1n;
      for (let i = 2n; i <= BigInt(n); i++) res *= i;
      document.getElementById('facOut').innerHTML = `${n}! = ` + res.toString() + makeCopyBtn(res.toString());
    });
  }
};

TOOLS.percentage = {
  name: 'Percentage Calculator',
  desc: 'Calculate proportions and percent values.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <input type="number" id="pctA" placeholder="Part" style="flex:1;" />
        <span>of</span>
        <input type="number" id="pctB" placeholder="Whole" style="flex:1;" />
      </div>
      <button class="btn" id="pctBtn">Calculate</button>
      <div id="pctOut" class="result-box">—</div>`;
    document.getElementById('pctBtn').addEventListener('click', () => {
      const a = parseFloat(document.getElementById('pctA').value);
      const b = parseFloat(document.getElementById('pctB').value);
      if (!b) return;
      const res = `${a} is ${((a/b)*100).toFixed(2)}% of ${b}`;
      document.getElementById('pctOut').innerHTML = res + makeCopyBtn(res);
    });
  }
};

TOOLS.discount = {
  name: 'Discount Calculator',
  desc: 'Compute net pricing and total savings after percent discounts.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Original Price<input type="number" id="dcP" value="100" /></label>
        <label style="flex:1;">Discount %<input type="number" id="dcD" value="20" /></label>
      </div>
      <button class="btn" id="dcBtn">Calculate Discount</button>
      <div id="dcOut" class="result-box">—</div>`;
    document.getElementById('dcBtn').addEventListener('click', () => {
      const p = parseFloat(document.getElementById('dcP').value);
      const d = parseFloat(document.getElementById('dcD').value);
      const save = p * (d / 100);
      document.getElementById('dcOut').textContent = `Final Price: $${(p - save).toFixed(2)} (Savings: $${save.toFixed(2)})`;
    });
  }
};

TOOLS.gcdlcm = {
  name: 'GCD & LCM Calculator',
  desc: 'Calculate Greatest Common Divisor and Least Common Multiple.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <input type="number" id="glA" value="12" style="flex:1;" />
        <input type="number" id="glB" value="18" style="flex:1;" />
      </div>
      <button class="btn" id="glBtn">Calculate</button>
      <div id="glOut" class="result-box">—</div>`;
    document.getElementById('glBtn').addEventListener('click', () => {
      const a = parseInt(document.getElementById('glA').value);
      const b = parseInt(document.getElementById('glB').value);
      const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
      const g = gcd(a, b);
      const l = (a * b) / g;
      document.getElementById('glOut').textContent = `GCD: ${g} | LCM: ${l}`;
    });
  }
};

TOOLS.root = {
  name: 'Square & Cube Root Calculator',
  desc: 'Compute square and cube roots for numbers.',
  render: function(c) {
    c.innerHTML = `<label>Number</label><input type="number" id="rtIn" value="64" /><button class="btn" id="rtBtn">Compute Roots</button><div id="rtOut" class="result-box">—</div>`;
    document.getElementById('rtBtn').addEventListener('click', () => {
      const n = parseFloat(document.getElementById('rtIn').value);
      document.getElementById('rtOut').textContent = `√${n} = ${Math.sqrt(n).toFixed(4)} | ³√${n} = ${Math.cbrt(n).toFixed(4)}`;
    });
  }
};

TOOLS.baseconv = {
  name: 'Radix Base Converter',
  desc: 'Convert integers across Binary, Octal, Decimal, and Hex.',
  render: function(c) {
    c.innerHTML = `
      <label>Input Number</label><input type="text" id="bcVal" value="255" />
      <div class="row">
        <label>From</label><select id="bcF"><option value="10">Decimal</option><option value="2">Binary</option><option value="16">Hex</option></select>
        <label>To</label><select id="bcT"><option value="16">Hex</option><option value="2">Binary</option><option value="10">Decimal</option></select>
      </div>
      <button class="btn" id="bcBtn">Convert Base</button>
      <div id="bcOut" class="result-box">—</div>`;
    document.getElementById('bcBtn').addEventListener('click', () => {
      const v = document.getElementById('bcVal').value.trim();
      const from = parseInt(document.getElementById('bcF').value);
      const to = parseInt(document.getElementById('bcT').value);
      const res = parseInt(v, from).toString(to).toUpperCase();
      document.getElementById('bcOut').innerHTML = res + makeCopyBtn(res);
    });
  }
};

TOOLS.hexrgb = {
  name: 'Hex to RGB Converter',
  desc: 'Convert Hex colors to RGB and vice versa.',
  render: function(c) {
    c.innerHTML = `
      <label>Hex Color</label><input type="text" id="hrIn" value="#7c5cff" />
      <button class="btn" id="hrBtn">To RGB</button>
      <div id="hrOut" class="result-box">—</div>`;
    document.getElementById('hrBtn').addEventListener('click', () => {
      let h = document.getElementById('hrIn').value.replace('#', '');
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      const res = `rgb(${r}, ${g}, ${b})`;
      document.getElementById('hrOut').innerHTML = res + makeCopyBtn(res);
    });
  }
};

TOOLS.average = {
  name: 'Mean & Average Calculator',
  desc: 'Compute mean, sum, count, and totals from comma-separated datasets.',
  render: function(c) {
    c.innerHTML = `<label>Numbers (comma separated)</label><input type="text" id="avgIn" value="10, 20, 30, 40, 50" /><button class="btn" id="avgBtn">Calculate Statistics</button><div id="avgOut" class="result-box">—</div>`;
    document.getElementById('avgBtn').addEventListener('click', () => {
      const arr = document.getElementById('avgIn').value.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      if (!arr.length) return;
      const sum = arr.reduce((a, b) => a + b, 0);
      document.getElementById('avgOut').textContent = `Sum: ${sum} | Mean: ${(sum / arr.length).toFixed(2)} | Count: ${arr.length}`;
    });
  }
};

TOOLS.stddev = {
  name: 'Standard Deviation Calculator',
  desc: 'Calculate sample variance and standard deviation.',
  render: function(c) {
    c.innerHTML = `<label>Dataset (comma separated)</label><input type="text" id="sdIn" value="2, 4, 4, 4, 5, 5, 7, 9" /><button class="btn" id="sdBtn">Calculate SD</button><div id="sdOut" class="result-box">—</div>`;
    document.getElementById('sdBtn').addEventListener('click', () => {
      const arr = document.getElementById('sdIn').value.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      if (arr.length < 2) return;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const v = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (arr.length - 1);
      document.getElementById('sdOut').textContent = `Standard Deviation (Sample): ${Math.sqrt(v).toFixed(4)} | Variance: ${v.toFixed(4)}`;
    });
  }
};

// 6. UNIT CONVERTERS
TOOLS.temp = {
  name: 'Temperature Converter',
  desc: 'Convert temperatures across Celsius, Fahrenheit, and Kelvin.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <input type="number" id="tV" value="100" style="flex:1;" />
        <select id="tF"><option value="C">°C</option><option value="F">°F</option><option value="K">K</option></select>
        <span>→</span>
        <select id="tT"><option value="F">°F</option><option value="C">°C</option><option value="K">K</option></select>
      </div>
      <button class="btn" id="tBtn">Convert</button>
      <div id="tOut" class="result-box">—</div>`;
    document.getElementById('tBtn').addEventListener('click', () => {
      const v = parseFloat(document.getElementById('tV').value);
      const f = document.getElementById('tF').value, t = document.getElementById('tT').value;
      let c = f === 'C' ? v : f === 'F' ? (v - 32) * 5/9 : v - 273.15;
      let res = t === 'C' ? c : t === 'F' ? (c * 9/5 + 32) : c + 273.15;
      document.getElementById('tOut').textContent = `${v} °${f} = ${res.toFixed(2)} °${t}`;
    });
  }
};

TOOLS.length = Object.assign({name:'Length Converter', desc:'Convert meters, feet, inches, kilometers, and miles.'}, makeUnitConverter('len', {m:'m',ft:'ft',in:'in',km:'km',mi:'mi'}, {m:1,ft:3.28084,in:39.3701,km:0.001,mi:0.000621371}, 4));
TOOLS.weight = Object.assign({name:'Weight Converter', desc:'Convert kilograms, pounds, ounces, and grams.'}, makeUnitConverter('wt', {kg:'kg',lb:'lb',oz:'oz',g:'g'}, {kg:1,lb:2.20462,oz:35.274,g:1000}, 4));
TOOLS.volume = Object.assign({name:'Volume Converter', desc:'Convert liters, gallons, fluid ounces, and milliliters.'}, makeUnitConverter('vol', {L:'L',gal:'gal',floz:'fl oz',ml:'ml'}, {L:1,gal:0.264172,floz:33.814,ml:1000}, 4));
TOOLS.area = Object.assign({name:'Area Converter', desc:'Convert square meters, square feet, acres, and hectares.'}, makeUnitConverter('area', {m2:'m²',ft2:'ft²',ac:'ac',ha:'ha'}, {m2:1,ft2:10.7639,ac:0.000247105,ha:0.0001}, 4));
TOOLS.datastorage = Object.assign({name:'Data Storage Converter', desc:'Convert Bytes, KB, MB, GB, and TB.'}, makeUnitConverter('ds', {B:'B',KB:'KB',MB:'MB',GB:'GB',TB:'TB'}, {B:1,KB:1024,MB:1048576,GB:1073741824,TB:1099511627776}, 2));
TOOLS.speed = Object.assign({name:'Speed Converter', desc:'Convert km/h, mph, and meters per second.'}, makeUnitConverter('sp', {kmh:'km/h',mph:'mph',ms:'m/s'}, {kmh:1,mph:0.621371,ms:0.277778}, 4));
TOOLS.pressure = Object.assign({name:'Pressure Converter', desc:'Convert Pascals, PSI, and Bar units.'}, makeUnitConverter('pr', {Pa:'Pa',psi:'psi',bar:'bar'}, {Pa:1,psi:0.000145038,bar:0.00001}, 6));
TOOLS.energy = Object.assign({name:'Energy Converter', desc:'Convert Joules, Kilocalories, and Watt-hours.'}, makeUnitConverter('en', {J:'J',kcal:'kcal',Wh:'Wh'}, {J:1,kcal:0.000239006,Wh:0.000277778}, 4));
TOOLS.power = Object.assign({name:'Power Converter', desc:'Convert Watts, Kilowatts, and Horsepower.'}, makeUnitConverter('pw', {W:'W',kW:'kW',hp:'hp'}, {W:1,kW:0.001,hp:0.00134102}, 4));

// 7. DATE & TIME
TOOLS.age = {
  name: 'Age Calculator',
  desc: 'Calculate exact elapsed age in years, months, and days.',
  render: function(c) {
    c.innerHTML = `<label>Date of Birth</label><input type="date" id="agD" /><button class="btn" id="agBtn">Calculate Age</button><div id="agOut" class="result-box">—</div>`;
    document.getElementById('agBtn').addEventListener('click', () => {
      const v = document.getElementById('agD').value;
      if (!v) return;
      const b = new Date(v), now = new Date();
      let y = now.getFullYear() - b.getFullYear(), m = now.getMonth() - b.getMonth(), d = now.getDate() - b.getDate();
      if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
      if (m < 0) { y--; m += 12; }
      document.getElementById('agOut').textContent = `Age: ${y} years, ${m} months, ${d} days`;
    });
  }
};

TOOLS.daysbetween = {
  name: 'Days Between Dates',
  desc: 'Count total calendar days between two dates.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Start Date<input type="date" id="dbA" /></label>
        <label style="flex:1;">End Date<input type="date" id="dbB" /></label>
      </div>
      <button class="btn" id="dbBtn">Count Days</button>
      <div id="dbOut" class="result-box">—</div>`;
    document.getElementById('dbBtn').addEventListener('click', () => {
      const a = new Date(document.getElementById('dbA').value);
      const b = new Date(document.getElementById('dbB').value);
      const diff = Math.ceil(Math.abs(b - a) / (1000 * 60 * 60 * 24));
      document.getElementById('dbOut').textContent = `Duration: ${diff} Days`;
    });
  }
};

TOOLS.timestamp = {
  name: 'Unix Timestamp Converter',
  desc: 'Convert epoch timestamps into human-readable ISO dates.',
  render: function(c) {
    c.innerHTML = `
      <label>Unix Epoch (Seconds)</label><input type="number" id="tsIn" value="1700000000" />
      <button class="btn" id="tsBtn">Convert Epoch</button>
      <div id="tsOut" class="result-box">—</div>`;
    document.getElementById('tsBtn').addEventListener('click', () => {
      const v = parseInt(document.getElementById('tsIn').value);
      document.getElementById('tsOut').textContent = new Date(v * 1000).toUTCString();
    });
  }
};

TOOLS.worldclock = {
  name: 'Global Timezones Clock',
  desc: 'View live clocks across key global financial zones.',
  render: function(c) {
    c.innerHTML = `<button class="btn" id="wcBtn">Refresh Times</button><div id="wcOut" class="result-box" style="white-space:pre-wrap;">—</div>`;
    function upd() {
      const z = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'];
      document.getElementById('wcOut').innerHTML = z.map(x => `${x}: ${new Date().toLocaleString('en-US', {timeZone: x})}`).join('\n');
    }
    document.getElementById('wcBtn').addEventListener('click', upd);
    upd();
  }
};

TOOLS.adddays = {
  name: 'Add / Subtract Days',
  desc: 'Calculate forward and backward date offsets.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <input type="date" id="adD" style="flex:2;" />
        <input type="number" id="adN" value="30" style="flex:1;" />
      </div>
      <button class="btn" id="adBtn">Add Days</button>
      <div id="adOut" class="result-box">—</div>`;
    document.getElementById('adBtn').addEventListener('click', () => {
      const d = new Date(document.getElementById('adD').value);
      d.setDate(d.getDate() + (parseInt(document.getElementById('adN').value) || 0));
      document.getElementById('adOut').textContent = d.toDateString();
    });
  }
};

TOOLS.leapyear = {
  name: 'Leap Year Evaluator',
  desc: 'Check if a calendar year has 366 days.',
  render: function(c) {
    c.innerHTML = `<label>Year</label><input type="number" id="lyIn" value="2028" /><button class="btn" id="lyBtn">Check Leap Year</button><div id="lyOut" class="result-box">—</div>`;
    document.getElementById('lyBtn').addEventListener('click', () => {
      const y = parseInt(document.getElementById('lyIn').value);
      const isL = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
      document.getElementById('lyOut').textContent = `${y} is ${isL ? 'a LEAP YEAR' : 'NOT a leap year'}.`;
    });
  }
};

// 8. FINANCE TOOLS
TOOLS.loan = {
  name: 'Loan & EMI Calculator',
  desc: 'Calculate amortized payments, interest distributions, and totals.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Principal<input type="number" id="lAmt" value="50000" /></label>
        <label style="flex:1;">Rate (%)<input type="number" id="lR" value="8.5" step="0.1" /></label>
        <label style="flex:1;">Tenure (Mo)<input type="number" id="lT" value="36" /></label>
      </div>
      <button class="btn" id="lBtn">Calculate EMI</button>
      <div id="lOut" class="result-box">—</div>`;
    document.getElementById('lBtn').addEventListener('click', () => {
      const p = parseFloat(document.getElementById('lAmt').value);
      const r = parseFloat(document.getElementById('lR').value) / 12 / 100;
      const n = parseInt(document.getElementById('lT').value);
      const emi = (p * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
      const total = emi * n;
      document.getElementById('lOut').textContent = `Monthly EMI: $${emi.toFixed(2)} | Total Payment: $${total.toFixed(2)} | Interest: $${(total - p).toFixed(2)}`;
    });
  }
};

TOOLS.interest = {
  name: 'Simple vs Compound Interest',
  desc: 'Compare simple and compound principal yields side by side.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Principal<input type="number" id="inP" value="10000" /></label>
        <label style="flex:1;">Rate (%)<input type="number" id="inR" value="6" /></label>
        <label style="flex:1;">Years<input type="number" id="inY" value="5" /></label>
      </div>
      <button class="btn" id="inBtn">Calculate</button>
      <div id="inOut" class="result-box">—</div>`;
    document.getElementById('inBtn').addEventListener('click', () => {
      const p = parseFloat(document.getElementById('inP').value);
      const r = parseFloat(document.getElementById('inR').value) / 100;
      const y = parseFloat(document.getElementById('inY').value);
      const sim = p * r * y;
      const comp = p * Math.pow(1 + r, y) - p;
      document.getElementById('inOut').textContent = `Simple Interest: $${sim.toFixed(2)} | Compound Interest: $${comp.toFixed(2)}`;
    });
  }
};

TOOLS.tip = {
  name: 'Tip & Bill Splitter',
  desc: 'Calculate gratuities and split dinner checks evenly.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Bill Total<input type="number" id="tbBill" value="120" /></label>
        <label style="flex:1;">Tip %<input type="number" id="tbTip" value="15" /></label>
        <label style="flex:1;">Persons<input type="number" id="tbPpl" value="3" /></label>
      </div>
      <button class="btn" id="tbBtn">Split Bill</button>
      <div id="tbOut" class="result-box">—</div>`;
    document.getElementById('tbBtn').addEventListener('click', () => {
      const b = parseFloat(document.getElementById('tbBill').value);
      const t = parseFloat(document.getElementById('tbTip').value) / 100;
      const n = parseInt(document.getElementById('tbPpl').value) || 1;
      const total = b + (b * t);
      document.getElementById('tbOut').textContent = `Total: $${total.toFixed(2)} | Each Person Pays: $${(total / n).toFixed(2)}`;
    });
  }
};

TOOLS.profitloss = {
  name: 'Profit / Margin Calculator',
  desc: 'Evaluate gross profit margins and markup percentages.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Cost Price<input type="number" id="plC" value="80" /></label>
        <label style="flex:1;">Selling Price<input type="number" id="plS" value="120" /></label>
      </div>
      <button class="btn" id="plBtn">Calculate Margin</button>
      <div id="plOut" class="result-box">—</div>`;
    document.getElementById('plBtn').addEventListener('click', () => {
      const c = parseFloat(document.getElementById('plC').value);
      const s = parseFloat(document.getElementById('plS').value);
      const p = s - c;
      document.getElementById('plOut').textContent = `Gross Profit: $${p.toFixed(2)} | Margin: ${((p/s)*100).toFixed(2)}% | Markup: ${((p/c)*100).toFixed(2)}%`;
    });
  }
};

TOOLS.vat = {
  name: 'Sales Tax & VAT Calculator',
  desc: 'Compute net tax extractions and gross totals.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Net Amount<input type="number" id="vatA" value="200" /></label>
        <label style="flex:1;">Tax Rate (%)<input type="number" id="vatR" value="20" /></label>
      </div>
      <button class="btn" id="vatBtn">Calculate Tax</button>
      <div id="vatOut" class="result-box">—</div>`;
    document.getElementById('vatBtn').addEventListener('click', () => {
      const a = parseFloat(document.getElementById('vatA').value);
      const r = parseFloat(document.getElementById('vatR').value) / 100;
      const tax = a * r;
      document.getElementById('vatOut').textContent = `Tax: $${tax.toFixed(2)} | Gross Total: $${(a + tax).toFixed(2)}`;
    });
  }
};

TOOLS.roi = {
  name: 'ROI (Return on Investment)',
  desc: 'Calculate net percentage returns on capital outlays.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Invested<input type="number" id="roiI" value="1000" /></label>
        <label style="flex:1;">Returned<input type="number" id="roiR" value="1500" /></label>
      </div>
      <button class="btn" id="roiBtn">Calculate ROI</button>
      <div id="roiOut" class="result-box">—</div>`;
    document.getElementById('roiBtn').addEventListener('click', () => {
      const inv = parseFloat(document.getElementById('roiI').value);
      const ret = parseFloat(document.getElementById('roiR').value);
      const roi = ((ret - inv) / inv) * 100;
      document.getElementById('roiOut').textContent = `ROI Gain: ${roi.toFixed(2)}%`;
    });
  }
};

// 9. HEALTH & BODY
TOOLS.bmi = {
  name: 'BMI Body Mass Calculator',
  desc: 'Estimate Body Mass Index based on height and weight.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Weight (kg)<input type="number" id="bmW" value="70" /></label>
        <label style="flex:1;">Height (cm)<input type="number" id="bmH" value="175" /></label>
      </div>
      <button class="btn" id="bmBtn">Calculate BMI</button>
      <div id="bmOut" class="result-box">—</div>`;
    document.getElementById('bmBtn').addEventListener('click', () => {
      const w = parseFloat(document.getElementById('bmW').value);
      const h = parseFloat(document.getElementById('bmH').value) / 100;
      const bmi = w / (h * h);
      document.getElementById('bmOut').textContent = `BMI: ${bmi.toFixed(1)} kg/m²`;
    });
  }
};

TOOLS.water = {
  name: 'Daily Water Intake',
  desc: 'Estimate daily hydration needs based on body mass.',
  render: function(c) {
    c.innerHTML = `<label>Weight (kg)</label><input type="number" id="wtKg" value="70" /><button class="btn" id="wtBtn">Calculate</button><div id="wtOut" class="result-box">—</div>`;
    document.getElementById('wtBtn').addEventListener('click', () => {
      const w = parseFloat(document.getElementById('wtKg').value);
      document.getElementById('wtOut').textContent = `Recommended: ~${(w * 0.033).toFixed(2)} Liters/day`;
    });
  }
};

TOOLS.bmr = {
  name: 'BMR Calorie Calculator',
  desc: 'Estimate daily basal metabolic rate requirements.',
  render: function(c) {
    c.innerHTML = `
      <div class="row">
        <label style="flex:1;">Weight (kg)<input type="number" id="bmrW" value="70" /></label>
        <label style="flex:1;">Height (cm)<input type="number" id="bmrH" value="175" /></label>
        <label style="flex:1;">Age<input type="number" id="bmrA" value="25" /></label>
      </div>
      <button class="btn" id="bmrBtn">Calculate BMR</button>
      <div id="bmrOut" class="result-box">—</div>`;
    document.getElementById('bmrBtn').addEventListener('click', () => {
      const w = parseFloat(document.getElementById('bmrW').value);
      const h = parseFloat(document.getElementById('bmrH').value);
      const a = parseFloat(document.getElementById('bmrA').value);
      const bmr = 10 * w + 6.25 * h - 5 * a + 5;
      document.getElementById('bmrOut').textContent = `Basal Metabolic Rate: ~${Math.round(bmr)} kcal/day`;
    });
  }
};

TOOLS.idealweight = {
  name: 'Ideal Body Weight Calculator',
  desc: 'Calculate healthy weight targets via the Devine formula.',
  render: function(c) {
    c.innerHTML = `<label>Height (cm)</label><input type="number" id="iwH" value="175" /><button class="btn" id="iwBtn">Calculate</button><div id="iwOut" class="result-box">—</div>`;
    document.getElementById('iwBtn').addEventListener('click', () => {
      const inches = parseFloat(document.getElementById('iwH').value) / 2.54;
      const ibw = 50 + 2.3 * (inches - 60);
      document.getElementById('iwOut').textContent = `Ideal Body Weight: ~${ibw.toFixed(1)} kg`;
    });
  }
};

// 10. PRODUCTIVITY & FUN
TOOLS.stopwatch = {
  name: 'Precision Stopwatch',
  desc: 'Measure elapsed time with split and pause capabilities.',
  render: function(c) {
    c.innerHTML = `
      <div id="swDisp" style="font-size:2.5rem; text-align:center; margin:10px 0; font-family:var(--font-mono);">00:00:00</div>
      <div class="row" style="justify-content:center;">
        <button class="btn" id="swSt">Start</button>
        <button class="btn btn-secondary" id="swPs">Pause</button>
        <button class="btn btn-secondary" id="swRs">Reset</button>
      </div>`;
    let t = 0, inv = null;
    function upd() {
      const s = Math.floor(t / 1000);
      document.getElementById('swDisp').textContent = `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    }
    document.getElementById('swSt').addEventListener('click', () => { if (!inv) { const st = Date.now() - t; inv = setInterval(() => { t = Date.now() - st; upd(); }, 100); } });
    document.getElementById('swPs').addEventListener('click', () => { clearInterval(inv); inv = null; });
    document.getElementById('swRs').addEventListener('click', () => { clearInterval(inv); inv = null; t = 0; upd(); });
  }
};

TOOLS.pomodoro = {
  name: 'Pomodoro Timer',
  desc: 'Focus interval timer (25 min work, 5 min rest).',
  render: function(c) {
    c.innerHTML = `
      <div id="pmDisp" style="font-size:2.5rem; text-align:center; margin:10px 0; font-family:var(--font-mono);">25:00</div>
      <div class="row" style="justify-content:center;">
        <button class="btn" id="pmSt">Start Focus</button>
        <button class="btn btn-secondary" id="pmRs">Reset</button>
      </div>`;
    let sec = 25 * 60, inv = null;
    function upd() { document.getElementById('pmDisp').textContent = `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }
    document.getElementById('pmSt').addEventListener('click', () => {
      if (!inv) inv = setInterval(() => { if (sec > 0) { sec--; upd(); } else { clearInterval(inv); inv = null; alert('Interval Complete!'); } }, 1000);
    });
    document.getElementById('pmRs').addEventListener('click', () => { clearInterval(inv); inv = null; sec = 25 * 60; upd(); });
  }
};

TOOLS.countdown = {
  name: 'Countdown Timer',
  desc: 'Set custom second-based timers.',
  render: function(c) {
    c.innerHTML = `
      <div class="row"><input type="number" id="cdS" value="60" style="flex:1;" /><button class="btn" id="cdSt">Start Timer</button></div>
      <div id="cdDisp" style="font-size:2.5rem; text-align:center; margin:10px 0; font-family:var(--font-mono);">00:00</div>`;
    let sec = 0, inv = null;
    document.getElementById('cdSt').addEventListener('click', () => {
      clearInterval(inv);
      sec = parseInt(document.getElementById('cdS').value) || 60;
      inv = setInterval(() => {
        if (sec > 0) {
          sec--;
          document.getElementById('cdDisp').textContent = `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
        } else { clearInterval(inv); }
      }, 1000);
    });
  }
};

TOOLS.dice = {
  name: 'Dice Roller',
  desc: 'Roll standard six-sided dice.',
  render: function(c) {
    c.innerHTML = `<button class="btn" id="dcRoll">Roll Die</button><div id="dcRes" class="result-box" style="font-size:2rem; justify-content:center;">🎲 —</div>`;
    document.getElementById('dcRoll').addEventListener('click', () => {
      const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      const idx = Math.floor(Math.random() * 6);
      document.getElementById('dcRes').textContent = `${faces[idx]} (${idx + 1})`;
    });
  }
};

TOOLS.coin = {
  name: 'Coin Flipper',
  desc: 'Simulate randomized 50/50 coin tosses.',
  render: function(c) {
    c.innerHTML = `<button class="btn" id="cfFlip">Flip Coin</button><div id="cfRes" class="result-box" style="font-size:1.5rem; justify-content:center;">🪙 —</div>`;
    document.getElementById('cfFlip').addEventListener('click', () => {
      document.getElementById('cfRes').textContent = Math.random() < 0.5 ? '🪙 Heads' : '🪙 Tails';
    });
  }
};

const CATEGORIES = [
  { name: 'Image Tools', icon: '🖼️', tools: ['qrcode', 'idphoto', 'imgtopdf', 'imageresize', 'imgconvert', 'imgcompress', 'grayscale', 'sepia', 'brightness', 'rotateflip', 'imgbase64', 'crop', 'textimage'] },
  { name: 'Text & String Tools', icon: '📝', tools: ['charcount', 'caseconv', 'codecase', 'slug', 'reverse', 'palindrome', 'repeater', 'loremipsum', 'dedupe', 'linesort', 'stripwhitespace', 'findreplace'] },
  { name: 'Crypto & Security', icon: '🔐', tools: ['hasher', 'jwt', 'uuid', 'password', 'base64', 'base64dec', 'urlencode', 'urldecode', 'cipher', 'morse', 'binarytext', 'textbinary'] },
  { name: 'Developer & Web', icon: '💻', tools: ['jsonfmt', 'htmlmin', 'cssmin', 'jsmin', 'regex', 'sqlfmt', 'htmlescape', 'colorgen', 'markdownpreview', 'cssglass', 'cssboxshadow', 'cssgradient'] },
  { name: 'Math Tools', icon: '🔢', tools: ['randomnum', 'prime', 'fibonacci', 'factorial', 'percentage', 'discount', 'gcdlcm', 'root', 'baseconv', 'hexrgb', 'average', 'stddev'] },
  { name: 'Unit Converters', icon: '📐', tools: ['temp', 'length', 'weight', 'volume', 'area', 'datastorage', 'speed', 'pressure', 'energy', 'power'] },
  { name: 'Date & Time', icon: '📅', tools: ['age', 'daysbetween', 'timestamp', 'worldclock', 'adddays', 'leapyear'] },
  { name: 'Finance', icon: '💰', tools: ['loan', 'interest', 'tip', 'profitloss', 'vat', 'roi'] },
  { name: 'Health & Body', icon: '🩺', tools: ['bmi', 'water', 'bmr', 'idealweight'] },
  { name: 'Productivity & Fun', icon: '🎯', tools: ['stopwatch', 'pomodoro', 'countdown', 'dice', 'coin'] }
];

const toolTitle = document.getElementById('toolTitle');
const toolDesc = document.getElementById('toolDesc');
const toolContainer = document.getElementById('toolContainer');

function navigateTo(key) {
  if (!TOOLS[key]) key = 'qrcode';
  location.hash = '#/' + key;
}

function handleRoute() {
  const hash = location.hash.replace('#/', '').trim();
  const key = TOOLS[hash] ? hash : 'qrcode';
  const tool = TOOLS[key];

  toolTitle.textContent = tool.name;
  toolDesc.textContent = tool.desc;
  toolContainer.innerHTML = '';
  tool.render(toolContainer);

  document.querySelectorAll('#sidebarContent ul li').forEach(el => {
    el.classList.toggle('active', el.dataset.tool === key);
  });

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildNavigation() {
  const sidebarContent = document.getElementById('sidebarContent');
  const footerList = document.getElementById('footerCategoryList');
  sidebarContent.innerHTML = '';
  footerList.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const heading = document.createElement('div');
    heading.className = 'category-heading';
    heading.textContent = `${cat.icon} ${cat.name}`;
    sidebarContent.appendChild(heading);

    const ul = document.createElement('ul');
    cat.tools.forEach(key => {
      if (!TOOLS[key]) return;
      const li = document.createElement('li');
      li.textContent = TOOLS[key].name;
      li.dataset.tool = key;
      li.addEventListener('click', () => navigateTo(key));
      ul.appendChild(li);
    });
    sidebarContent.appendChild(ul);

    const fli = document.createElement('li');
    const fbtn = document.createElement('button');
    fbtn.textContent = `${cat.icon} ${cat.name}`;
    fbtn.addEventListener('click', () => navigateTo(cat.tools[0]));
    fli.appendChild(fbtn);
    footerList.appendChild(fli);
  });
}

document.getElementById('toolSearch').addEventListener('input', function() {
  const q = this.value.trim().toLowerCase();
  document.querySelectorAll('#sidebarContent ul li').forEach(li => {
    const match = !q || li.textContent.toLowerCase().includes(q);
    li.classList.toggle('hidden', !match);
  });
  document.querySelectorAll('.category-heading').forEach(h => {
    const ul = h.nextElementSibling;
    const anyVisible = ul && Array.from(ul.children).some(li => !li.classList.contains('hidden'));
    h.classList.toggle('hidden', !anyVisible);
  });
});

document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', () => {
  buildNavigation();
  handleRoute();
  document.getElementById('yearNow').textContent = new Date().getFullYear();
  initConsent();
});

function openModal(key) {
  const box = document.getElementById('modalBox');
  box.innerHTML = `<button class="modal-close" onclick="closeModal()">✕</button>` + (POLICIES[key] || '<p>Not found.</p>');
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-modal]');
  if (btn) openModal(btn.getAttribute('data-modal'));
});

function initConsent() {
  if (!localStorage.getItem('tp_consent')) {
    document.getElementById('cookieBanner').classList.add('show');
  }
  document.getElementById('cookieAcceptBtn').addEventListener('click', () => {
    localStorage.setItem('tp_consent', 'all');
    document.getElementById('cookieBanner').classList.remove('show');
  });
  document.getElementById('cookieDeclineBtn').addEventListener('click', () => {
    localStorage.setItem('tp_consent', 'essential');
    document.getElementById('cookieBanner').classList.remove('show');
  });
}
