const CACHE_NAME = 'sparsh-profile-v2';
const SHELL_CACHE = `${CACHE_NAME}-shell`;
const RUNTIME_CACHE = `${CACHE_NAME}-runtime`;

const SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './favicon.svg',
  './styles.css',
  './transitions.css',
  './choreo.css',
  './script.js',
  './transitions.js',
  './choreo.js',
  './pwa.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-192.png',
  './assets/icons/maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-1024.png',
  './assets/sparsh-logo.png',
  './assets/sparsh-portrait.jpg',
  './assets/video-poster.jpg',
  './assets/finger-track.svg'
];

const CORS_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'unpkg.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      const adds = SHELL.map((url) => {
        return cache.add(url).catch(() => {});
      });
      return Promise.allSettled(adds).then(() => self.skipWaiting());
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== SHELL_CACHE && k !== RUNTIME_CACHE) {
            return caches.delete(k);
          }
        })
      ).then(() => self.clients.claim());
    })
  );
});

function shouldHandle(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (request.headers.has('range')) return false;
  if (url.hostname === self.location.hostname) return true;
  if (CORS_HOSTS.includes(url.hostname)) return true;
  return false;
}

function isMedia(url) {
  return /\.mp4$/i.test(url.pathname) || /\.(m4v|webm|mov|avi)$/i.test(url.pathname);
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    const url = new URL(request.url);
    if (res.ok) {
      if (url.pathname === self.location.pathname || /\/index\.html$/.test(url.pathname) || url.origin !== self.location.origin) {
        const c = await caches.open(SHELL_CACHE);
        c.put(request, res.clone()).catch(() => {});
      } else {
        const c = await caches.open(RUNTIME_CACHE);
        c.put(request, res.clone()).catch(() => {});
      }
    }
    return res;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('./offline.html');
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const url = new URL(request.url);
  const fetchPromise = fetch(request).then((res) => {
    if (res.ok) {
      const cacheName = url.hostname === self.location.hostname ? RUNTIME_CACHE : RUNTIME_CACHE;
      caches.open(cacheName).then((c) => c.put(request, res.clone())).catch(() => {});
    }
    return res;
  }).catch(() => cached);

  return cached || fetchPromise || caches.match('./offline.html');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!shouldHandle(req)) return;
  const url = new URL(req.url);
  if (isMedia(url)) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }
  event.respondWith(staleWhileRevalidate(req));
});
