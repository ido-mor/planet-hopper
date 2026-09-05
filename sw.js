const CACHE_NAME = 'planet-hopper-v13';

// Keep required offline files small and reliable.
const REQUIRED_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './manifest.webmanifest',
  './fonts/Pixeboy-z8XGD.ttf',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/sprites/rocket-idle.png',
  './assets/sprites/rocket-fire.png',
  './assets/sprites/rocket-small.png',
  './assets/sprites/life-rocket.png',
  './assets/sprites/life-rocket-empty.png',
  './assets/sprites/astronaut-walk.png',
  './assets/sprites/astronaut-dance.png',
  './assets/sprites/countdown.png',
  './assets/sprites/gantry.png'
];

// Optional media should not block install if any request fails.
const OPTIONAL_ASSETS = [
  './sounds/Hero%20Immortal.mp3',
  './sounds/3%202%201%20go_noise-removal_equalized_lower.mp3',
  './sounds/rocket_launch.wav',
  './sounds/newthingget.mp3',
  './sounds/Picked%20Coin%20Echo%202.mp3',
  './sounds/thunk.wav',
  './sounds/click_sound_6.mp3'
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
