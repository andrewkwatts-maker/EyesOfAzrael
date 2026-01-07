/**
 * Eyes of Azrael - Service Worker
 * Provides offline support, caching strategy, and PWA functionality
 * Version: 2.28.0
 *
 * Changes in 2.28.0:
 * - POLISH: Service Worker and Caching comprehensive update
 * - Add proper cache strategies per asset type (static, dynamic, api, images)
 * - Add background sync for failed POST/PUT requests with retry queue
 * - Add cache size management with automatic LRU cleanup
 * - Polish network-first vs cache-first logic with smarter routing
 * - Enhanced precache for critical assets (JS, CSS, fonts)
 * - Ensure Firebase auth/firestore routes always bypass cache
 * - Add cache expiration TTL management per asset type
 * - Add IndexedDB-based sync queue for offline submissions
 * - Add cache warming for frequently accessed content
 * - Polish update notification messaging to clients
 *
 * Changes in 2.27.0:
 * - POLISH: 12-agent comprehensive rendering fix sprint
 * - Fix SVG icons showing as raw text across all renderers
 * - Add renderIcon() method to 11 components for proper SVG detection
 * - Add truncateDescription() to prevent text overflow in card grids
 */

const CACHE_VERSION = 'v2.28.0';
const CACHE_NAME = `eyes-of-azrael-${CACHE_VERSION}`;

// Separate caches for different content types
const CACHE_NAMES = {
  static: `eoa-static-${CACHE_VERSION}`,
  dynamic: `eoa-dynamic-${CACHE_VERSION}`,
  images: `eoa-images-${CACHE_VERSION}`,
  fonts: `eoa-fonts-${CACHE_VERSION}`,
  pages: `eoa-pages-${CACHE_VERSION}`
};

// Offline fallback pages
const OFFLINE_PAGE = '/offline.html';
const ERROR_PAGE = '/500.html';

// Critical assets to precache on install
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
  '/js/firebase-init.js',
  '/js/app-init-simple.js',
  '/js/spa-navigation.js',
  '/js/auth-guard-simple.js',
  '/js/toast-notifications.js',
  '/js/shader-theme-picker.js',
  '/js/sw-register.js'
];

// Additional assets to precache for enhanced offline experience
const PRECACHE_ENHANCED = [
  '/css/loading-spinner.css',
  '/css/skeleton-screens.css',
  '/css/mythology-ambiance.css',
  '/css/entity-card-polish.css',
  '/css/home-page.css',
  '/js/views/landing-page-view.js',
  '/js/views/browse-category-view.js',
  '/js/components/entity-card.js',
  '/js/utils/loading-spinner.js'
];

// Cache strategies
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  CACHE_ONLY: 'cache-only'
};

// Cache TTL (Time To Live) per asset type in milliseconds
const CACHE_TTL = {
  static: 30 * 24 * 60 * 60 * 1000,      // 30 days for static assets
  dynamic: 24 * 60 * 60 * 1000,          // 24 hours for dynamic content
  images: 7 * 24 * 60 * 60 * 1000,       // 7 days for images
  fonts: 365 * 24 * 60 * 60 * 1000,      // 1 year for fonts
  pages: 60 * 60 * 1000,                 // 1 hour for HTML pages
  api: 5 * 60 * 1000                     // 5 minutes for API responses
};

// Maximum cache sizes per cache type
const MAX_CACHE_SIZE = {
  static: 100,
  dynamic: 50,
  images: 150,
  fonts: 20,
  pages: 30
};

// Route patterns and their strategies with cache types
const ROUTE_STRATEGIES = [
  // Firebase Auth - ALWAYS network only (never cache auth tokens)
  { pattern: /identitytoolkit\.googleapis\.com/, strategy: CACHE_STRATEGIES.NETWORK_ONLY, cache: null },
  { pattern: /securetoken\.googleapis\.com/, strategy: CACHE_STRATEGIES.NETWORK_ONLY, cache: null },
  { pattern: /www\.googleapis\.com\/identitytoolkit/, strategy: CACHE_STRATEGIES.NETWORK_ONLY, cache: null },

  // Firebase Firestore - network first with short TTL
  { pattern: /firestore\.googleapis\.com/, strategy: CACHE_STRATEGIES.NETWORK_FIRST, cache: 'dynamic', ttl: CACHE_TTL.api },

  // Firebase Storage - cache first for images/assets
  { pattern: /firebasestorage\.googleapis\.com/, strategy: CACHE_STRATEGIES.CACHE_FIRST, cache: 'images', ttl: CACHE_TTL.images },

  // Google Fonts
  { pattern: /fonts\.googleapis\.com/, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, cache: 'fonts', ttl: CACHE_TTL.fonts },
  { pattern: /fonts\.gstatic\.com/, strategy: CACHE_STRATEGIES.CACHE_FIRST, cache: 'fonts', ttl: CACHE_TTL.fonts },

  // Local API calls
  { pattern: /\/api\//, strategy: CACHE_STRATEGIES.NETWORK_FIRST, cache: 'dynamic', ttl: CACHE_TTL.api },

  // JavaScript files - stale while revalidate for quick loads
  { pattern: /\.js$/i, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, cache: 'static', ttl: CACHE_TTL.static },

  // CSS files - stale while revalidate
  { pattern: /\.css$/i, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, cache: 'static', ttl: CACHE_TTL.static },

  // Font files - cache first (rarely change)
  { pattern: /\.(woff2|woff|ttf|eot|otf)$/i, strategy: CACHE_STRATEGIES.CACHE_FIRST, cache: 'fonts', ttl: CACHE_TTL.fonts },

  // Images - cache first
  { pattern: /\.(png|jpg|jpeg|gif|webp|avif|ico|svg)$/i, strategy: CACHE_STRATEGIES.CACHE_FIRST, cache: 'images', ttl: CACHE_TTL.images },

  // JSON data files (mythology data)
  { pattern: /firebase-assets.*\.json$/i, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, cache: 'dynamic', ttl: CACHE_TTL.dynamic },

  // HTML pages - stale while revalidate
  { pattern: /\.html$/i, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, cache: 'pages', ttl: CACHE_TTL.pages },

  // Manifest and config
  { pattern: /manifest\.json$/i, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, cache: 'static', ttl: CACHE_TTL.static }
];

// Network timeout for faster offline fallback
const NETWORK_TIMEOUT = 5000;

// Background sync tag
const SYNC_TAG = 'eoa-sync-submissions';

/**
 * Install Event - Precache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      // Cache critical assets in static cache
      caches.open(CACHE_NAMES.static).then(async (cache) => {
        console.log('[Service Worker] Precaching critical assets');
        const results = await Promise.allSettled(
          PRECACHE_ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, err.message);
              return null;
            })
          )
        );
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[Service Worker] Precached ${successful}/${PRECACHE_ASSETS.length} critical assets`);
      }),

      // Cache enhanced offline experience assets
      caches.open(CACHE_NAMES.static).then(async (cache) => {
        console.log('[Service Worker] Precaching enhanced assets');
        const results = await Promise.allSettled(
          PRECACHE_ENHANCED.map(url =>
            cache.add(url).catch(err => {
              // Silently fail for enhanced assets - not critical
              return null;
            })
          )
        );
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[Service Worker] Precached ${successful}/${PRECACHE_ENHANCED.length} enhanced assets`);
      }),

      // Cache offline page in pages cache
      caches.open(CACHE_NAMES.pages).then(cache => {
        return cache.addAll([OFFLINE_PAGE, ERROR_PAGE, '/']).catch(() => {});
      })
    ])
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
 * Activate Event - Clean up old caches and claim clients
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const currentCaches = Object.values(CACHE_NAMES);
        currentCaches.push(CACHE_NAME); // Include legacy cache name for cleanup

        const deletions = cacheNames
          .filter((name) => {
            // Delete caches not in our current set
            if (name.startsWith('eyes-of-azrael-') || name.startsWith('eoa-')) {
              return !currentCaches.includes(name);
            }
            return false;
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          });

        return Promise.all(deletions);
      })
      .then((deleted) => {
        if (deleted.length > 0) {
          console.log(`[Service Worker] Cleaned up ${deleted.length} old cache(s)`);
        }
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients of the update
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_ACTIVATED',
              version: CACHE_VERSION,
              message: 'New version activated'
            });
          });
        });
      })
  );
});

/**
 * Fetch Event - Implement smart caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (handle POST/PUT via background sync)
  if (request.method !== 'GET') {
    // Queue failed mutations for background sync
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      event.respondWith(
        fetch(request.clone()).catch(async (error) => {
          // Queue for background sync if supported
          if ('sync' in self.registration) {
            await queueFailedRequest(request);
            return new Response(JSON.stringify({
              queued: true,
              message: 'Request queued for sync when online'
            }), {
              status: 202,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          throw error;
        })
      );
    }
    return;
  }

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle SPA navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Determine strategy and handle request
  const routeConfig = getRouteConfig(request);

  event.respondWith(
    handleRequest(request, routeConfig)
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', request.url, error.message);
        return handleFetchError(request);
      })
  );
});

/**
 * Handle navigation requests specially for SPA
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);

    try {
      const response = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        // Cache the response
        const cache = await caches.open(CACHE_NAMES.pages);
        cache.put(request, response.clone()).catch(() => {});
        return response;
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }

    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Fall back to index.html for SPA routing
    const indexCached = await caches.match('/index.html');
    if (indexCached) {
      return indexCached;
    }

    // Last resort: offline page
    const offlinePage = await caches.match(OFFLINE_PAGE);
    if (offlinePage) {
      return offlinePage;
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  } catch (error) {
    const offlinePage = await caches.match(OFFLINE_PAGE);
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

/**
 * Get route configuration for a request
 */
function getRouteConfig(request) {
  const url = request.url;

  for (const route of ROUTE_STRATEGIES) {
    if (route.pattern.test(url)) {
      return route;
    }
  }

  // Default config
  return {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cache: 'dynamic',
    ttl: CACHE_TTL.dynamic
  };
}

/**
 * Handle request based on strategy configuration
 */
async function handleRequest(request, config) {
  const { strategy, cache: cacheType, ttl } = config;

  switch (strategy) {
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheType, ttl);

    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheType, ttl);

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheType, ttl);

    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request);

    default:
      return networkFirst(request, cacheType, ttl);
  }
}

/**
 * Network First Strategy with timeout
 */
async function networkFirst(request, cacheType, ttl) {
  const cacheName = CACHE_NAMES[cacheType] || CACHE_NAMES.dynamic;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok && response.status === 200) {
      const cache = await caches.open(cacheName);
      // Add timestamp header for TTL checking
      const responseWithTimestamp = await addTimestampHeader(response);
      cache.put(request, responseWithTimestamp.clone()).catch(() => {});
      await enforceMaxCacheSize(cacheName, cacheType);
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is still valid
      if (!isCacheExpired(cachedResponse, ttl)) {
        console.log('[Service Worker] Serving from cache (network failed):', request.url);
        return cachedResponse;
      }
      // Cache expired but still return it as fallback
      console.log('[Service Worker] Serving stale cache (network failed):', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Cache First Strategy with TTL validation
 */
async function cacheFirst(request, cacheType, ttl) {
  const cacheName = CACHE_NAMES[cacheType] || CACHE_NAMES.static;
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check if cache is still fresh
    if (!isCacheExpired(cachedResponse, ttl)) {
      return cachedResponse;
    }
    // Cache is stale, update in background but return cached
    fetchAndCache(request, cacheName);
    return cachedResponse;
  }

  // Nothing in cache, fetch from network
  try {
    const response = await fetch(request);

    if (response.ok && response.status === 200) {
      const cache = await caches.open(cacheName);
      const responseWithTimestamp = await addTimestampHeader(response);
      cache.put(request, responseWithTimestamp.clone()).catch(() => {});
      await enforceMaxCacheSize(cacheName, cacheType);
    }

    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Network Only Strategy
 */
async function networkOnly(request) {
  return fetch(request);
}

/**
 * Stale While Revalidate Strategy
 */
async function staleWhileRevalidate(request, cacheType, ttl) {
  const cacheName = CACHE_NAMES[cacheType] || CACHE_NAMES.dynamic;
  const cachedResponse = await caches.match(request);

  // Start fetch in background regardless
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok && response.status === 200) {
        try {
          const cache = await caches.open(cacheName);
          const responseWithTimestamp = await addTimestampHeader(response);
          await cache.put(request, responseWithTimestamp.clone());
          await enforceMaxCacheSize(cacheName, cacheType);

          // Notify clients of cache update for critical resources
          if (request.url.endsWith('.js') || request.url.endsWith('.css')) {
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'CACHE_UPDATED',
                  url: request.url
                });
              });
            });
          }
        } catch (cacheError) {
          console.warn('[Service Worker] Failed to update cache:', cacheError.message);
        }
      }
      return response;
    })
    .catch((error) => {
      console.warn('[Service Worker] Background fetch failed:', error.message);
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // No cache, wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  throw new Error('No cached response and network failed');
}

/**
 * Cache Only Strategy
 */
async function cacheOnly(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  throw new Error('Resource not in cache');
}

/**
 * Add timestamp header to response for TTL tracking
 */
async function addTimestampHeader(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());

  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * Check if cached response is expired
 */
function isCacheExpired(response, ttl) {
  if (!ttl) return false;

  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) {
    // Fall back to date header
    const dateHeader = response.headers.get('date');
    if (!dateHeader) return false;
    const cacheDate = new Date(dateHeader);
    return Date.now() - cacheDate.getTime() > ttl;
  }

  return Date.now() - parseInt(timestamp, 10) > ttl;
}

/**
 * Fetch and cache in background
 */
function fetchAndCache(request, cacheName) {
  fetch(request)
    .then(async (response) => {
      if (response.ok && response.status === 200) {
        try {
          const cache = await caches.open(cacheName);
          const responseWithTimestamp = await addTimestampHeader(response);
          await cache.put(request, responseWithTimestamp.clone());
        } catch (error) {
          // Silently fail
        }
      }
    })
    .catch(() => {
      // Silently fail
    });
}

/**
 * Enforce maximum cache size using LRU-like cleanup
 */
async function enforceMaxCacheSize(cacheName, cacheType) {
  const maxSize = MAX_CACHE_SIZE[cacheType];
  if (!maxSize) return;

  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxSize) {
      // Sort by timestamp and delete oldest
      const entries = await Promise.all(
        keys.map(async (request) => {
          const response = await cache.match(request);
          const timestamp = response?.headers.get('sw-cache-timestamp') || '0';
          return { request, timestamp: parseInt(timestamp, 10) };
        })
      );

      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Delete oldest entries to get back to maxSize
      const toDelete = entries.slice(0, entries.length - maxSize);
      await Promise.all(
        toDelete.map(entry => cache.delete(entry.request))
      );

      console.log(`[Service Worker] Cleaned ${toDelete.length} old entries from ${cacheName}`);
    }
  } catch (error) {
    console.warn('[Service Worker] Cache cleanup failed:', error.message);
  }
}

/**
 * Handle fetch errors with appropriate fallbacks
 */
async function handleFetchError(request) {
  const acceptHeader = request.headers.get('accept') || '';
  const isNavigationRequest = request.mode === 'navigate' || acceptHeader.includes('text/html');

  if (isNavigationRequest) {
    // Try offline page
    const offlinePage = await caches.match(OFFLINE_PAGE);
    if (offlinePage) {
      return offlinePage;
    }
    // Try index.html for SPA
    const indexPage = await caches.match('/index.html');
    if (indexPage) {
      return indexPage;
    }
  }

  // Try to return any cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return appropriate error response
  if (acceptHeader.includes('application/json')) {
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'Resource not available offline'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (acceptHeader.includes('image/')) {
    // Return a placeholder for images
    return new Response('', {
      status: 503,
      statusText: 'Image not available offline'
    });
  }

  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

/**
 * Queue failed request for background sync
 */
async function queueFailedRequest(request) {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('sync-queue', 'readwrite');
    const store = tx.objectStore('sync-queue');

    const requestData = {
      id: Date.now().toString(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };

    await store.add(requestData);
    await tx.complete;

    // Register sync
    if ('sync' in self.registration) {
      await self.registration.sync.register(SYNC_TAG);
    }

    console.log('[Service Worker] Request queued for sync:', request.url);
  } catch (error) {
    console.error('[Service Worker] Failed to queue request:', error);
  }
}

/**
 * Open IndexedDB for sync queue
 */
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('eoa-sync-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Background Sync Handler
 */
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncQueuedRequests());
  }
});

/**
 * Sync all queued requests
 */
async function syncQueuedRequests() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('sync-queue', 'readwrite');
    const store = tx.objectStore('sync-queue');
    const requests = await store.getAll();

    console.log(`[Service Worker] Syncing ${requests.length} queued requests`);

    let successCount = 0;
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });

        if (response.ok) {
          await store.delete(requestData.id);
          successCount++;
        }
      } catch (error) {
        console.warn('[Service Worker] Sync failed for:', requestData.url);
      }
    }

    // Notify clients of sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        synced: successCount,
        total: requests.length
      });
    });

    console.log(`[Service Worker] Synced ${successCount}/${requests.length} requests`);
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error;
  }
}

/**
 * Message Handler
 */
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || !data.type) return;

  switch (data.type) {
    case 'SKIP_WAITING':
      console.log('[Service Worker] Skip waiting requested');
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      console.log('[Service Worker] Clear all caches requested');
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              console.log('[Service Worker] Deleting cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        }).then(() => {
          if (event.source) {
            event.source.postMessage({ type: 'CACHE_CLEARED' });
          }
        })
      );
      break;

    case 'CLEAR_CACHE_TYPE':
      const cacheTypeToDelete = data.cacheType;
      const cacheNameToDelete = CACHE_NAMES[cacheTypeToDelete];
      if (cacheNameToDelete) {
        event.waitUntil(
          caches.delete(cacheNameToDelete).then(() => {
            console.log('[Service Worker] Cleared cache:', cacheNameToDelete);
            if (event.source) {
              event.source.postMessage({ type: 'CACHE_TYPE_CLEARED', cacheType: cacheTypeToDelete });
            }
          })
        );
      }
      break;

    case 'CACHE_URLS':
      const urls = data.urls || [];
      const targetCache = data.cacheType ? CACHE_NAMES[data.cacheType] : CACHE_NAMES.static;
      console.log(`[Service Worker] Caching ${urls.length} URLs to ${targetCache}`);
      event.waitUntil(
        caches.open(targetCache).then((cache) => {
          return Promise.allSettled(
            urls.map(url => cache.add(url).catch(err => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, err.message);
            }))
          );
        }).then(() => {
          if (event.source) {
            event.source.postMessage({ type: 'CACHE_COMPLETE', urls: urls.length });
          }
        })
      );
      break;

    case 'GET_VERSION':
      if (event.source) {
        event.source.postMessage({
          type: 'VERSION_INFO',
          version: CACHE_VERSION,
          caches: Object.keys(CACHE_NAMES)
        });
      }
      break;

    case 'GET_CACHE_STATS':
      event.waitUntil(
        getCacheStats().then(stats => {
          if (event.source) {
            event.source.postMessage({
              type: 'CACHE_STATS',
              stats: stats
            });
          }
        })
      );
      break;

    case 'CLEANUP_EXPIRED':
      event.waitUntil(cleanupExpiredCaches());
      break;

    case 'WARM_CACHE':
      const urlsToWarm = data.urls || [];
      event.waitUntil(warmCache(urlsToWarm));
      break;

    default:
      console.log('[Service Worker] Unknown message type:', data.type);
  }
});

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const stats = {};

  for (const [type, cacheName] of Object.entries(CACHE_NAMES)) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[type] = {
        name: cacheName,
        count: keys.length,
        maxSize: MAX_CACHE_SIZE[type] || 'unlimited'
      };
    } catch (e) {
      stats[type] = { error: e.message };
    }
  }

  return stats;
}

/**
 * Cleanup expired entries from all caches
 */
async function cleanupExpiredCaches() {
  console.log('[Service Worker] Running cache cleanup');
  let totalCleaned = 0;

  for (const [type, cacheName] of Object.entries(CACHE_NAMES)) {
    const ttl = CACHE_TTL[type];
    if (!ttl) continue;

    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response && isCacheExpired(response, ttl)) {
          await cache.delete(request);
          totalCleaned++;
        }
      }
    } catch (e) {
      console.warn(`[Service Worker] Failed to cleanup ${cacheName}:`, e.message);
    }
  }

  console.log(`[Service Worker] Cleaned ${totalCleaned} expired entries`);
  return totalCleaned;
}

/**
 * Warm cache with specified URLs
 */
async function warmCache(urls) {
  console.log(`[Service Worker] Warming cache with ${urls.length} URLs`);

  for (const url of urls) {
    try {
      const config = getRouteConfig({ url });
      const cacheName = CACHE_NAMES[config.cache] || CACHE_NAMES.dynamic;

      // Check if already cached
      const existing = await caches.match(url);
      if (existing && !isCacheExpired(existing, config.ttl)) {
        continue; // Already cached and fresh
      }

      // Fetch and cache
      const response = await fetch(url);
      if (response.ok) {
        const cache = await caches.open(cacheName);
        const responseWithTimestamp = await addTimestampHeader(response);
        await cache.put(url, responseWithTimestamp);
      }
    } catch (e) {
      console.warn(`[Service Worker] Failed to warm cache for ${url}:`, e.message);
    }
  }

  console.log('[Service Worker] Cache warming complete');
}

/**
 * Push Notification Handler
 */
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'eyes-of-azrael-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Eyes of Azrael', options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if a window is already open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Periodic sync for cache maintenance (if supported)
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'eoa-cache-maintenance') {
    event.waitUntil(cleanupExpiredCaches());
  }
});

console.log('[Service Worker] Loaded successfully', CACHE_VERSION);
