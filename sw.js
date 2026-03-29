const CACHE_NAME = 'planet-hopper-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './manifest.webmanifest',
  './start-iphone.sh',
  './LOCAL_IPHONE_SETUP.md',
  './fonts/Pixeboy-z8XGD.ttf',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
  './sounds/Hero%20Immortal.mp3',
  './sounds/3%202%201%20go_noise-removal_equalized.wav',
  './sounds/rocket_launch.wav',
  './sounds/newthingget.ogg',
  './sounds/Picked%20Coin%20Echo%202.wav',
  './sounds/thunk.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
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

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return caches.match('./');
        });
    })
  );
});
