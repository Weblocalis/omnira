/*
 * Service Worker : met en cache uniquement les fichiers statiques de l'application (interface).
 * Il n'intercepte JAMAIS les flux audio : requêtes cross-origin, audio/vidéo et en-tête Range sont ignorés,
 * le navigateur les traite normalement. Aucune écoute hors ligne n'est possible.
 * Incrémente CACHE_VERSION si tu ajoutes ou renomme des fichiers de la liste ci-dessous.
 */
const CACHE_VERSION = 'v22';
const CACHE_NAME = 'ma-radio-' + CACHE_VERSION;
const APP_FILES = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/i18n.js',
  './assets/js/locales/en.js',
  './assets/js/stations.js',
  './assets/js/app.js',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ma-radio-') && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                          // flux radio, CDN : jamais interceptés
  if (req.destination === 'audio' || req.destination === 'video' || req.headers.has('range')) return;

  // Réseau d'abord (les mises à jour GitHub s'affichent tout de suite), cache en secours hors ligne
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
