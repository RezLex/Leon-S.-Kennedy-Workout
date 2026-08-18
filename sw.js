const CACHE = 'lsk-v6';
const ASSETS = ['./data.csv', './icon.svg', './manifest.json?v=2', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // HTML y Firebase: siempre red, sin caché
    if (e.request.mode === 'navigate' ||
        e.request.url.includes('firebaseio.com') ||
        e.request.url.includes('googleapis.com')) {
        e.respondWith(fetch(e.request, { cache: 'no-cache' }));
        return;
    }
    // Activos estáticos: caché primero
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
