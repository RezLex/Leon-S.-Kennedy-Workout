const CACHE = 'lsk-v2';
const PRECACHE = ['./', './index.html', './data.csv', './icon.svg', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // Firebase (REST y SSE): siempre red directa, sin pasar por caché
    if (e.request.url.includes('firebaseio.com')) {
        e.respondWith(fetch(e.request));
        return;
    }
    // Activos locales: caché primero
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
