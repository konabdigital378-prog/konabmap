// Service Worker KonabMap - offline de base
const CACHE = 'konabmap-v1';
const ASSETS = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json', '/logo.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
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
