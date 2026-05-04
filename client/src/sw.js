import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback — don't intercept API calls
registerRoute(
  new NavigationRoute(
    async ({ request }) => {
      if (request.url.includes('/api/')) {
        return fetch(request);
      }
      const cache = await caches.open('workbox-precache-v2');
      const cached = await cache.match('/index.html');
      return cached || fetch('/index.html');
    }
  )
);

// Stale-while-revalidate for exercise API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/exercises'),
  new StaleWhileRevalidate({ cacheName: 'exercises-api' })
);

// Cache-first for exercise images
registerRoute(
  ({ url }) => url.pathname.startsWith('/images/'),
  new CacheFirst({
    cacheName: 'exercise-images',
    plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  })
);

// Push notification handler
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch {}

  const title = data.title ?? 'Torque & Tension';
  const options = {
    body: data.body ?? "Time for your pilates session!",
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: data.url ?? '/' },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — focus or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((w) => 'focus' in w);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return clients.openWindow(url);
    })
  );
});
