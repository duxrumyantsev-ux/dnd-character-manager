const CACHE_NAME = 'dnd-app-v5'; // Увеличиваем версию
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/db.js',
    '/js/auth.js',
    '/js/spell-structure.js',
    '/js/spell-loader.js',
    '/js/spells-manager.js',
    '/data/spells.json',
    '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // Принудительно активируем новый SW
                return self.skipWaiting();
            })
    );
});

// Активация - удаляем старые кэши
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Берем управление всеми клиентами
            return self.clients.claim();
        })
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэш или делаем запрос
                return response || fetch(event.request);
            })
    );
});
