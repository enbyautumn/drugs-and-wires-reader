let cacheName = 'sw-cache-v1';
let cacheFiles = [
    '/index.html',
    '/main.js',
    '/main.css',
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
        caches.match(e.request).then((response) => {
            return response || fetch(e.request)
        })
    )
})