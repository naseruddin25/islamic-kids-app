const CACHE_VERSION = 'v1.0.3';
const CACHE_NAME = `islamic-kids-cache-${CACHE_VERSION}`;
const CORE_ASSETS = [
  './',
  './index.html',
  './parents.html',
  './lessons/index.html',
  './lessons/lesson.html',
  './assets/styles.css',
  './assets/app.js',
  './assets/lessons.json',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-maskable.svg'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets');
      return cache.addAll(CORE_ASSETS);
    }).then(() => {
      console.log('[SW] Install complete, skipping waiting');
      return self.skipWaiting();
    }).catch((err) => {
      console.error('[SW] Install failed:', err);
      throw err;
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) => {
      console.log('[SW] Cleaning old caches:', keys.filter(k => k !== CACHE_NAME));
      return Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Try cache first, then network; update cache on successful network fetch
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        // Cache successful GET responses
        if (req.method === 'GET' && res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline fallback
        if (req.destination === 'document') {
          const offlineHtml = new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family: Arial, sans-serif; padding: 24px;">\n<div style="max-width: 600px; margin: 0 auto;">\n<h1>Offline</h1>\n<p>You’re offline. Content you’ve already opened is available. Please reconnect to load new lessons.</p>\n<a href="./" style="display:inline-block; margin-top:12px; padding:10px 14px; border-radius:999px; background:#ffd166; color:#000; text-decoration:none;">Return Home</a>\n</div></body></html>`, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 200
          });
          return offlineHtml;
        }
        // Fallback to cached asset if possible
        return cached || new Response('', { status: 503 });
      });
      return cached || network;
    })
  );
});
