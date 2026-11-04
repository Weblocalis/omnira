/*
 * Service worker: caches ONLY the app's own static files (interface), so the app opens offline and loads fast.
 * It NEVER intercepts audio: cross-origin requests (streams, HLS segments), audio/video and Range requests are ignored
 * and handled by the browser as usual. Listening offline is not possible.
 * Bump CACHE_VERSION whenever a file of APP_FILES is added, renamed or changed.
 */
const CACHE_VERSION = 'v26';
const CACHE_PREFIX = 'radio-app-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const APP_FILES = [
  './',
  './index.html',
  './404.html',
  './manifest.webmanifest',
  './privacy-policy.html',
  './legal-notice.html',
  './terms-of-use.html',
  './assets/css/style.css',
  './assets/css/legal.css',
  './assets/vendor/bootstrap-5.3.3/bootstrap.min.css',
  './assets/vendor/bootstrap-5.3.3/bootstrap.min.js',
  './assets/vendor/bootstrap-icons-1.11.3/bootstrap-icons-subset.css',
  './assets/vendor/bootstrap-icons-1.11.3/bootstrap-icons-subset.woff2',
  './assets/js/theme-init.js',
  './assets/js/i18n.js',
  './assets/js/locales/en.js',
  './assets/js/locales/fr.js',
  './assets/js/stations.js',
  './assets/js/app.js',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];
// Old cache names used by previous versions of the app
const LEGACY_PREFIXES = ['ma-radio-'];

/* Cloudflare Pages redirects /index.html to / and /page.html to /page. A redirected response cannot answer a
 * navigation from the cache, so it is stored as a plain copy. */
async function storable(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(APP_FILES.map(async (url) => {
        const res = await fetch(new Request(url, { cache: 'reload' }));
        if (!res.ok) throw new Error('Cannot cache ' + url + ' (' + res.status + ')');
        await cache.put(url, await storable(res));
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k !== CACHE_NAME && [CACHE_PREFIX].concat(LEGACY_PREFIXES).some((p) => k.startsWith(p)))
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                          // streams, HLS: never intercepted
  if (req.destination === 'audio' || req.destination === 'video' || req.headers.has('range')) return;

  // Network first (a new deployment shows up immediately), cache as a fallback when offline.
  // Station logos and hls.js are cached on first use, so they also work offline afterwards.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          event.waitUntil(storable(copy).then((r) => caches.open(CACHE_NAME).then((c) => c.put(req, r))).catch(() => {}));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((hit) => {
        if (hit) return hit;
        if (req.mode === 'navigate') return caches.match('./index.html');   // offline: open the app
        return Response.error();
      }))
  );
});
