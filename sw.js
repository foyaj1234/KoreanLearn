/* KoreanLearn Service Worker — offline-first static caching */
const CACHE = 'koreanlearn-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './vocabulary.html',
  './reading.html',
  './flashcard.html',
  './quiz.html',
  './hangul.html',
  './stats.html',
  './settings.html',
  './css/style.css',
  './js/app.js',
  './js/speech.js',
  './js/vocab.js',
  './js/reading.js',
  './js/flashcard.js',
  './js/quiz.js',
  './js/stats.js',
  './js/hangul.js',
  './js/search.js',
  './js/settings.js',
  './data/categories.js',
  './data/hangul.js',
  './data/paragraphs.json',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Cache-first with network fallback + runtime caching of vocab JSONs
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const url = req.url;
        if (res.ok && (url.includes('/data/') || url.includes('/icons/') ||
            url.includes('.html') || url.includes('.css') || url.includes('.js'))) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return Response.error();
      });
    })
  );
});
