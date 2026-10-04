// Service Worker KonabMap - offline de base
const CACHE = 'konabmap-v2';
const ASSETS = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json', '/logo.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  // Supprime anciens caches pour forcer la nouvelle version
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Ne pas cacher socket.io (temps réel)
  if (url.pathname.startsWith('/socket.io')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      // cache dynamique léger pour tuiles OSM
      if (url.hostname.includes('tile.openstreetmap.org')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => cached))
  );
});
