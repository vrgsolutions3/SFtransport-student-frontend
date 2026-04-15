// Service Worker para VRG Transport PWA
// Suporta caching estratégico, sync em background e notificações

const CACHE_VERSION = 'v2';
const CACHE_NAME = `vrg-transport-${CACHE_VERSION}`;

// Assets que sempre devem estar em cache (app shell)
const CRITICAL_ASSETS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Padrões de URLs que devem ser cacheadas
const CACHE_PATTERNS = {
  static: /\.(js|css|woff2|png|jpg|jpeg|webp|svg|ico)$/i,
  api: /^\/api\//,
};

const SKIP_CACHE_PATTERNS = [
  /^\/api\/auth\//,
  /^\/_next\//, // Next.js gerencia seus próprios chunks — não cachear aqui
];

const CARD_PAGE_PATH = '/dashboard/card';
const OFFLINE_FALLBACK_PATH = '/login';

// ═════════════════════════════════════════════════════════════════════════════
// INSTALL: Pré-cache dos assets críticos
// ═════════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[Service Worker] Caching critical assets in ${CACHE_NAME}`);
      return cache.addAll(CRITICAL_ASSETS);
    })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[Service Worker] Alguns assets nao puderam ser cacheados:', err);
        return self.skipWaiting();
      })
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// ACTIVATE: Cleanup de caches antigos
// ═════════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log(`[Service Worker] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    })
      .then(() => self.clients.claim())
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// FETCH: Estratégia de caching Network-First com fallback
// ═════════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // Ignora requests de outros domínios.
  if (url.origin !== self.location.origin) {
    return;
  }

  const path = url.pathname;

  // Pula requisições que não devem ser cacheadas
  if (shouldSkipCache(path)) {
    return;
  }

  // ── Navegação (HTML): Network First + fallback de cache ──────────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedPage = await cache.match(request);
          if (cachedPage) return cachedPage;

          if (path.startsWith(CARD_PAGE_PATH)) {
            const cachedCardPage = await cache.match(CARD_PAGE_PATH);
            if (cachedCardPage) return cachedCardPage;
          }

          const fallback = await cache.match(OFFLINE_FALLBACK_PATH);
          if (fallback) return fallback;

          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // ── Arquivos estáticos: Cache First ──────────────────────────────────────
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(async (response) => {
        if (response) return response;

        const networkResponse = await fetch(request);
        // Só cache se for sucesso
        if (networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
        .catch(() => {
          // Offline: retorna fallback de navegação em cache
          return caches.match(OFFLINE_FALLBACK_PATH) ||
            new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // ── API: Network First com cache fallback ────────────────────────────────
  if (CACHE_PATTERNS.api.test(path)) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
            new Response(
              JSON.stringify({
                message: 'Você está offline. Tente novamente quando conectado.',
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
        })
    );
    return;
  }

  // Demais requests GET: network first com fallback em cache.
  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// SYNC: Background sync para falhas de rede (opcional)
// ═════════════════════════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'retry-license-submission') {
    event.waitUntil(retryFailedRequest());
  }
});

async function retryFailedRequest() {
  try {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('vrg-transport-db', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    // Retry de requisições pendentes
    console.log('[Service Worker] Retrying failed requests...');
  } catch (err) {
    console.error('[Service Worker] Retry sync failed:', err);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// PUSH: Notificações push (opcional)
// ═════════════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'VRG Transport', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function isStaticAsset(url) {
  return CACHE_PATTERNS.static.test(url.pathname);
}

function shouldSkipCache(pathname) {
  return SKIP_CACHE_PATTERNS.some((pattern) => pattern.test(pathname));
}

console.log('[Service Worker] Ready to serve VRG Transport');
