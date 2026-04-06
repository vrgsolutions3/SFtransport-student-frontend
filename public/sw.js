// Service Worker para VRG Transport PWA
// Suporta caching estratégico, sync em background e notificações

const CACHE_VERSION = 'v1';
const CACHE_NAME = `vrg-transport-${CACHE_VERSION}`;

// Assets que sempre devem estar em cache (app shell)
const CRITICAL_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/register',
];

// Padrões de URLs que devem ser cacheadas
const CACHE_PATTERNS = {
  static: /\.(js|css|woff2|png|jpg|jpeg|webp|svg|ico)$/i,
  api: /^https:\/\/vrg-transport-backend\.onrender\.com\/api\/v1/,
};

const SKIP_CACHE_PATTERNS = [
  /localhost/,
  /^https:\/\/vrg-transport-backend\.onrender\.com\/api\/v1\/auth\//,
];

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
        console.warn('[Service Worker] Install failed:', err);
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

  // Pula requisições que não devem ser cacheadas
  if (shouldSkipCache(url)) {
    return;
  }

  // ── Arquivos estáticos: Cache First ──────────────────────────────────────
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response;

        return fetch(request).then((response) => {
          // Só cache se for sucesso
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        });
      })
        .catch(() => {
          // Offline: retorna página genérica de offline
          return caches.match('/offline') ||
            new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // ── API: Network First com cache fallback ────────────────────────────────
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request) ||
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

  // ── POST/PATCH/DELETE: Network only (sem cache) ──────────────────────────
  // Requisições de escrita são sempre feitas na rede
  event.respondWith(fetch(request));
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
    const db = await new Promise((resolve, reject) => {
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
    badge: '/icons/badge-72.png',
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

function shouldSkipCache(url) {
  return SKIP_CACHE_PATTERNS.some((pattern) => pattern.test(url.href));
}

console.log('[Service Worker] Ready to serve VRG Transport');
