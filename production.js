/* Toolidea production runtime hardening.
 * No ad credentials are stored here. Monetag code can be injected later in the
 * dedicated ad slots after the site is approved and the real zone/tag is supplied.
 */
(function () {
  'use strict';

  window.TOOLIDEA_CONFIG = Object.assign({
    brand: 'Toolidea',
    tagline: '90+ Free Online Tools',
    ads: { enabled: false, network: 'monetag' }
  }, window.TOOLIDEA_CONFIG || {});

  function safeText(value) { return String(value == null ? '' : value); }

  function showRuntimeError(container, error, toolName) {
    console.error('[Toolidea]', toolName || 'tool', error);
    if (!container) return;
    container.innerHTML = '<div class="result-box" role="alert">' +
      '<strong>Tool error</strong><p>This tool could not complete the operation. ' +
      'Your files were not uploaded to our server. Please try again or refresh the page.</p>' +
      '<button class="btn" type="button" id="toolRetryBtn">↻ Try Again</button></div>';
    var retry = container.querySelector('#toolRetryBtn');
    if (retry) retry.addEventListener('click', function () { location.reload(); });
  }

  function wrapTools() {
    if (!window.TOOLS || window.__toolideaWrapped) return;
    window.__toolideaWrapped = true;
    Object.keys(window.TOOLS).forEach(function (key) {
      var tool = window.TOOLS[key];
      if (!tool || typeof tool.render !== 'function' || tool.__toolideaWrapped) return;
      var original = tool.render;
      tool.render = function (container) {
        try {
          var result = original.call(this, container);
          return result;
        } catch (error) {
          showRuntimeError(container, error, tool.name || key);
        }
      };
      tool.__toolideaWrapped = true;
    });
  }

  function ensureAdSlots() {
    document.querySelectorAll('.ad-placeholder').forEach(function (slot) {
      if (slot.dataset.toolideaReady) return;
      slot.dataset.toolideaReady = '1';
      slot.setAttribute('aria-label', 'Advertisement');
      var label = slot.querySelector('span');
      if (label) label.textContent = 'Advertisement';
    });
  }

  function brand() {
    document.title = 'Toolidea – 90+ Free Online Tools';
    document.querySelectorAll('.brand-text strong, .footer-col strong').forEach(function (el) {
      el.textContent = 'Toolidea';
    });
    document.querySelectorAll('.brand-text span').forEach(function (el) {
      el.textContent = '90+ Online Tools';
    });
    document.querySelectorAll('.footer-bottom').forEach(function (el) {
      el.innerHTML = '<span>© ' + new Date().getFullYear() + ' Toolidea. All utilities client-side.</span><span>No tool data is sent to our servers.</span>';
    });
  }

  function installGlobalGuards() {
    window.addEventListener('error', function (event) {
      console.error('[Toolidea] Runtime error:', event.error || event.message);
    });
    window.addEventListener('unhandledrejection', function (event) {
      console.error('[Toolidea] Promise rejection:', event.reason);
    });
  }

  function init() {
    brand();
    ensureAdSlots();
    wrapTools();
    installGlobalGuards();
    window.dispatchEvent(new CustomEvent('toolidea:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
