const CACHE_NAME = 'odc-telkom-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    './icon-192.png',
    './icon-512.png',
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
        .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
        .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request)
        .then(response => {
            if (response) {
                return response;
            }
            return fetch(e.request);
        })
    );
});