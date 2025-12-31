/**
 * Eyes of Azrael - Service Worker
 * Provides offline support, caching strategy, and PWA functionality
 * Version: 1.0.0
 */

const CACHE_VERSION = 'v2.4.0';
const CACHE_NAME = `eyes-of-azrael-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';
const ERROR_PAGE = '/500.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/404.html',
  '/500.html',
  '/styles.css',
  '/themes/theme-base.css',
  '/manifest.json',
  '/firebase-config.js',
  '/js/firebase-init.js'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first, fallback to cache (for dynamic Firebase data)
  NETWORK_FIRST: 'network-first',

  // Cache first, fallback to network (for static assets)
  CACHE_FIRST: 'cache-first',

  // Network only (for user auth, submissions)
  NETWORK_ONLY: 'network-only',

  // Stale while revalidate (for semi-dynamic content)
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Route patterns and their strategies
const ROUTE_STRATEGIES = [
  // Firebase Firestore - always network first
  { pattern: /firestore\.googleapis\.com/, strategy: CACHE_STRATEGIES.NETWORK_FIRST },

  // Firebase Storage - cache first for images
  { pattern: /firebasestorage\.googleapis\.com/, strategy: CACHE_STRATEGIES.CACHE_FIRST },

  // API calls - network first
  { pattern: /\/api\//, strategy: CACHE_STRATEGIES.NETWORK_FIRST },

  // Static assets - cache first
  { pattern: /\.(css|js|png|jpg|jpeg|svg|webp|woff2|woff|ttf)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST },

  // HTML pages - stale while revalidate
  { pattern: /\.html$/, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE }
];

// Maximum cache age (7 days)
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Install Event - Cache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', CACHE_NAME);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('eyes-of-azrael-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine strategy for this request
  const strategy = getStrategyForRequest(request);

  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        return handleFetchError(request);
      })
  );
});

/**
 * Determine caching strategy for a request
 */
function getStrategyForRequest(request) {
  const url = request.url;

  for (const route of ROUTE_STRATEGIES) {
    if (route.pattern.test(url)) {
      return route.strategy;
    }
  }

  // Default strategy
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

/**
 * Handle request based on strategy
 */
async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);

    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);

    default:
      return networkFirst(request);
  }
}

/**
 * Network First Strategy
 * Try network, fallback to cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Cache First Strategy
 * Try cache, fallback to network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check cache age
    const cacheDate = new Date(cachedResponse.headers.get('date'));
    const age = Date.now() - cacheDate.getTime();

    if (age < MAX_CACHE_AGE) {
      return cachedResponse;
    }
  }

  // Fetch from network and cache
  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}

/**
 * Network Only Strategy
 * Always use network
 */
async function networkOnly(request) {
  return fetch(request);
}

/**
 * Stale While Revalidate Strategy
 * Return cache immediately, update in background
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  // Fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Handle fetch errors
 */
async function handleFetchError(request) {
  const url = new URL(request.url);

  // If requesting an HTML page, show offline page
  if (request.headers.get('accept').includes('text/html')) {
    const offlinePage = await caches.match(OFFLINE_PAGE);
    if (offlinePage) {
      return offlinePage;
    }
  }

  // Try to return cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return error page
  const errorPage = await caches.match(ERROR_PAGE);
  if (errorPage) {
    return errorPage;
  }

  // Last resort: generic error response
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  });
}

/**
 * Message Handler - for cache management from the app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }
});

/**
 * Background Sync - for offline form submissions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions') {
    event.waitUntil(syncSubmissions());
  }
});

/**
 * Sync offline submissions
 */
async function syncSubmissions() {
  try {
    // This would sync any queued submissions
    console.log('[Service Worker] Syncing offline submissions');
    // Implementation would depend on your submission queue
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error;
  }
}

/**
 * Push Notifications (future feature)
 */
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'eyes-of-azrael-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Eyes of Azrael', options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[Service Worker] Loaded successfully', CACHE_VERSION);
