const CACHE_NAME = 'ora-v3';
const SHELL_FILES = ['/', '/index.html', '/manifest.json'];

// The weather request carries a cache-busting `_t` param so it never hits a
// cache on the way out. Strip it for the cache key, otherwise every refresh
// would store a new entry and the offline fallback would never match.
function weatherCacheKey(url) {
  const u = new URL(url);
  u.searchParams.delete('_t');
  return u.toString();
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-first for weather API, cached only as an offline fallback.
  if (url.hostname === 'api.open-meteo.com') {
    const key = weatherCacheKey(e.request.url);
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(key, clone));
          }
          return res;
        })
        .catch(() => caches.match(key))
    );
    return;
  }

  // Network-first for the app shell too, so a deployed change lands on the next
  // load instead of waiting for a service worker update.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
