/* Applies the saved theme BEFORE the first paint (no flash of the wrong theme). Loaded synchronously in <head>
 * by index.html and the legal pages. Same logic as applyTheme() in app.js; key "radio.theme" = light | dark | auto. */
(function () {
  var pref = 'auto';
  try { var v = JSON.parse(localStorage.getItem('radio.theme')); if (v === 'light' || v === 'dark') pref = v; } catch (e) { /* storage blocked */ }
  var dark = pref === 'dark' || (pref === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', dark ? '#0f1216' : '#f4f6f9');
})();
