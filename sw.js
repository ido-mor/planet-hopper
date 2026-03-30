const CACHE_NAME = 'planet-hopper-v3';

// Keep required offline files small and reliable.
const REQUIRED_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './manifest.webmanifest',
  './fonts/Pixeboy-z8XGD.ttf',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg'
];

// Optional media should not block install if any request fails.
const OPTIONAL_ASSETS = [
  './sounds/Hero%20Immortal.mp3',
  './sounds/3%202%201%20go_noise-removal_equalized.wav',
  './sounds/rocket_launch.wav',
  './sounds/newthingget.ogg',
  './sounds/Picked%20Coin%20Echo%202.wav',
  './sounds/thunk.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(REQUIRED_ASSETS);
      await Promise.allSettled(
        OPTIONAL_ASSETS.map((asset) => cache.add(asset))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const reqUrl = new URL(event.request.url);
  const isSameOrigin = reqUrl.origin === self.location.origin;
  const isNavigation = event.request.mode === 'navigate';

  // For document navigations, prefer network to pick up fresh deploys quickly.
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic' && isSameOrigin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      var networkFetch = fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const copy = response.clone();
          if (isSameOrigin) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });

      // Stale-while-revalidate for static assets.
      if (cached) {
        event.waitUntil(networkFetch.catch(() => null));
        return cached;
      }

      return networkFetch.catch(() => new Response('', { status: 503, statusText: 'Offline' }));
    })
  );
});
