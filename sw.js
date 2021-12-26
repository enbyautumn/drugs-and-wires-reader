let update = 0
let cacheName = 'sw-cache-v1';
let cacheFiles = [
    '/index.html',
    '/main.js',
    '/main.css',
    'https://cdn.jsdelivr.net/npm/swiped-events@1.1.6/dist/swiped-events.min.js',
    'https://cdn.jsdelivr.net/npm/long-press-event@2.4.4/dist/long-press-event.min.js',
    'https://fonts.googleapis.com/css2?family=M+PLUS+2:wght@300;400&display=swap',
]

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(cacheFiles)
        })
    )
})

self.addEventListener("fetch", (e) => {
    e.respondWith(
        fetch(e.request).catch(() => {
            return caches.match(e.request);
        })
    )
})