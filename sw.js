/**
 * SERVICE WORKER - GitHub Pages compatible (v1.1.3)
 * Handles caching for both local dev and GitHub Pages deployment
 */

const CACHE_VERSION = 'v1.1.3';
const CACHE_NAME = `islamic-kids-cache-${CACHE_VERSION}`;

// Detect base path from service worker scope
function getBasePath() {
  const scope = self.registration ? self.registration.scope : self.location.pathname;
  const url = new URL(scope, self.location.origin);
  const path = url.pathname;
  
  // Check if we're under a GitHub Pages project path
  const match = path.match(/^(\/[^\/]+)\//);
  if (match && match[1] !== '/lessons' && match[1] !== '/assets') {
    return match[1]; // e.g., "/islamic-kids-app"
  }
  
  return ''; // Root
}

const BASE_PATH = getBasePath();

function withBase(path) {
  if (!path) return BASE_PATH || '/';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('./') ? path.slice(2) : path;
  return BASE_PATH ? `${BASE_PATH}/${cleanPath}` : cleanPath;
}

// Core assets to cache (using base path)
const CORE_ASSETS = [
  withBase('./'),
  withBase('index.html'),
  withBase('parents.html'),
  withBase('lessons/index.html'),
  withBase('lessons/lesson.html'),
  withBase('assets/styles.css'),
  withBase('assets/app.js'),
  withBase('assets/main.js'),
  withBase('assets/base-path.js'),
  withBase('data/lessons.json'),
  withBase('manifest.webmanifest'),
  withBase('assets/icon.svg'),
  withBase('assets/icon-maskable.svg')
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', CACHE_VERSION, 'with base path:', BASE_PATH);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets:', CORE_ASSETS);
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
          const homeLink = withBase('./');
          const offlineHtml = new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family: Arial, sans-serif; padding: 24px;">\n<div style="max-width: 600px; margin: 0 auto;">\n<h1>Offline</h1>\n<p>You're offline. Content you've already opened is available. Please reconnect to load new lessons.</p>\n<a href="${homeLink}" style="display:inline-block; margin-top:12px; padding:10px 14px; border-radius:999px; background:#ffd166; color:#000; text-decoration:none;">Return Home</a>\n</div></body></html>`, {
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
