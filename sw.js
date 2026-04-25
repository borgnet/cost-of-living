const CACHE = 'extrautil-v10';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Network-first with offline cache fallback. Tools deploy frequently and
// import siblings as ES modules — a stale cache for one file can break
// the entire page. Always try the network first; fall back to the cache
// only when offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then((resp) => {
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(req))
  );
});
