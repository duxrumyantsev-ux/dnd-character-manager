const CACHE_NAME = 'dnd-app-v1';
const urlsToCache = [
    '/dnd-character-manager/',
    '/dnd-character-manager/index.html',
    '/dnd-character-manager/css/style.css',
    '/dnd-character-manager/js/app.js',
    '/dnd-character-manager/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});