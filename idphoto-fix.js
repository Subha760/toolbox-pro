/* Toolidea Passport & ID Photo Maker — background replacement fix.
 * Runs entirely in the browser. No API, upload or server processing is used.
 * Uses edge-connected color segmentation so the selected background is actually
 * removed before the new color is composited. Best results are obtained with
 * a reasonably plain background.
 */
(function () {
  'use strict';

  function fileToDataURLLocal(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) { resolve(e.target.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImageLocal(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function colorDistance(r, g, b, s) {
    var dr = r - s[0], dg = g - s[1], db = b - s[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function collectSamples(data, width, height) {
    var samples = [];
    var points = [
      [2, 2], [width - 3, 2], [2, height - 3], [width - 3, height - 3],
      [Math.floor(width / 2), 2], [Math.floor(width / 2), height - 3],
      [2, Math.floor(height / 2)], [width - 3, Math.floor(height / 2)]
    ];
    points.forEach(function (p) {
      var i = (p[1] * width + p[0]) * 4;
      samples.push([data[i], data[i + 1], data[i + 2]]);
    });
    return samples;
  }

  function isBackgroundPixel(data, index, samples, tolerance) {
    var r = data[index], g = data[index + 1], b = data[index + 2];
    for (var i = 0; i < samples.length; i++) {
      if (colorDistance(r, g, b, samples[i]) <= tolerance) return true;
    }
    return false;
  }

  function removeConnectedBackground(sourceCanvas, tolerance) {
    var width = sourceCanvas.width;
    var height = sourceCanvas.height;
    var ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    var image = ctx.getImageData(0, 0, width, height);
    var data = image.data;
    var samples = collectSamples(data, width, height);
    var total = width * height;
    var visited = new Uint8Array(total);
    var background = new Uint8Array(total);
    var queue = new Int32Array(total);
    var head = 0, tail = 0;

    function seed(x, y) {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      var p = y * width + x;
      if (visited[p]) return;
      visited[p] = 1;
      var idx = p * 4;
      if (isBackgroundPixel(data, idx, samples, tolerance)) {
        background[p] = 1;
        queue[tail++] = p;
      }
    }

    for (var x = 0; x < width; x++) {
      seed(x, 0);
      seed(x, height - 1);
    }
    for (var y = 1; y < height - 1; y++) {
      seed(0, y);
      seed(width - 1, y);
    }

    while (head < tail) {
      var p = queue[head++];
      var px = p % width;
      var py = Math.floor(p / width);
      seed(px - 1, py);
      seed(px + 1, py);
      seed(px, py - 1);
      seed(px, py + 1);
    }

    for (var i = 0; i < total; i++) {
      if (background[i]) data[i * 4 + 3] = 0;
    }
    ctx.putImageData(image, 0, 0);

    return { removed: tail, total: total };
  }

  function replaceBackground(sourceCanvas, color, tolerance) {
    var out = document.createElement('canvas');
    out.width = sourceCanvas.width;
    out.height = sourceCanvas.height;
    var outCtx = out.getContext('2d');
    outCtx.fillStyle = color;
    outCtx.fillRect(0, 0, out.width, out.height);
    outCtx.drawImage(sourceCanvas, 0, 0);
    return out;
  }

  function cropToCanvas(img, width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var ratio = img.width / img.height;
    var targetRatio = width / height;
    var sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (ratio > targetRatio) {
      sw = img.height * targetRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
    return canvas;
  }

  window.TOOLIDEA_IDPHOTO_FIXED = {
    name: 'Passport & ID Photo Maker',
    desc: 'Create document-size photos and actually replace the original background with the selected color — fully in your browser.',
    render: function (c) {
      c.innerHTML = `
        <label>Select Portrait Image</label>
        <input type="file" id="idFile" accept="image/jpeg,image/png,image/webp,image/*" />
        <div class="row">
          <label style="flex:1;">Format Standard</label>
          <select id="idFormat" style="flex:2;">
            <option value="passport">Universal Passport (2×2 in / 51×51 mm)</option>
            <option value="pan">Standard Document Photo (35×45 mm)</option>
            <option value="us_visa">Visa Standard (2×2 in)</option>
          </select>
        </div>
        <div class="row">
          <label style="flex:1;">Backdrop Color</label>
          <select id="idBg" style="flex:2;">
            <option value="#ffffff">White</option>
            <option value="#1a73e8">Blue</option>
            <option value="#d32f2f">Red</option>
            <option value="#e8e8e8">Light Grey</option>
          </select>
        </div>
        <div class="row">
          <label style="flex:1;">Background Tolerance</label>
          <input type="range" id="idTolerance" min="15" max="110" value="55" style="flex:2;" />
          <output id="idToleranceValue">55</output>
        </div>
        <p id="idStatus" class="hint-text">Upload a photo, choose the background, then tap Render.</p>
        <button class="btn" id="idBtn" type="button">Render Document Photo</button>
        <div class="result-box" style="justify-content:center; flex-direction:column; align-items:center;">
          <canvas id="idCanvas" style="max-width:240px; width:100%; border-radius:4px; display:none; border:1px solid rgba(255,255,255,0.3);"></canvas>
          <div id="idDownload" style="margin-top:10px;"></div>
        </div>`;

      var fileEl = document.getElementById('idFile');
      var formatEl = document.getElementById('idFormat');
      var bgEl = document.getElementById('idBg');
      var tolEl = document.getElementById('idTolerance');
      var tolOut = document.getElementById('idToleranceValue');
      var btn = document.getElementById('idBtn');
      var status = document.getElementById('idStatus');
      var canvas = document.getElementById('idCanvas');
      var download = document.getElementById('idDownload');

      tolEl.addEventListener('input', function () { tolOut.value = tolEl.value; });

      async function renderPhoto() {
        var file = fileEl.files && fileEl.files[0];
        if (!file) {
          alert('Upload a photo first.');
          return;
        }
        btn.disabled = true;
        btn.textContent = 'Processing…';
        status.textContent = 'Removing the original background…';
        download.innerHTML = '';

        try {
          var dims = { passport: [600, 600], pan: [413, 531], us_visa: [600, 600] };
          var size = dims[formatEl.value] || dims.passport;
          var img = await loadImageLocal(await fileToDataURLLocal(file));
          var working = cropToCanvas(img, size[0], size[1]);
          var result = removeConnectedBackground(working, Number(tolEl.value));
          var finalCanvas = replaceBackground(working, bgEl.value, Number(tolEl.value));

          canvas.width = finalCanvas.width;
          canvas.height = finalCanvas.height;
          canvas.style.display = 'block';
          canvas.getContext('2d').drawImage(finalCanvas, 0, 0);

          var data = canvas.toDataURL('image/jpeg', 0.95);
          download.innerHTML = '<a href="' + data + '" download="toolidea-id-photo.jpg" class="btn">⬇️ Download JPG</a>';
          var pct = Math.round((result.removed / result.total) * 100);
          status.textContent = 'Background replaced successfully. Detected background: about ' + pct + '% of the image. If some background remains, increase tolerance slightly.';
        } catch (error) {
          console.error('[Toolidea] ID photo error', error);
          status.textContent = 'Could not process this image. Try a JPG/PNG/WebP photo and refresh if necessary.';
          alert('Photo processing failed. Please try another image.');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Render Document Photo';
        }
      }

      btn.addEventListener('click', renderPhoto);
      bgEl.addEventListener('change', function () {
        if (fileEl.files && fileEl.files[0]) renderPhoto();
      });
      formatEl.addEventListener('change', function () {
        if (fileEl.files && fileEl.files[0]) renderPhoto();
      });
    }
  };

  if (window.TOOLS) window.TOOLS.idphoto = window.TOOLIDEA_IDPHOTO_FIXED;
})();
