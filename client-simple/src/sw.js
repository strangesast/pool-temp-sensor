const CACHE = 'v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([
    '/',
    '/index.html',
    '/style.css',
    '/index.js',
    '/node_modules/d3/dist/d3.min.js',
  ])).then(() => console.log('caching complete')))
});

self.addEventListener('activate', event => {
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
