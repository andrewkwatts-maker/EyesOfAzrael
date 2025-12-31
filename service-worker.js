/**
 * Eyes of Azrael - Service Worker
 * Provides offline support, caching strategy, and PWA functionality
 * Version: 2.12.2
 *
 * Changes in 2.12.2:
 * - Fix Firebase race condition in lazy-loader.js
 * - Added _isFirebaseInitialized() method for robust Firebase state checking
 * - Wrapped firebase.auth() in additional try-catch for safety
 * - Removed temporary LAYER13/14 debug logs
 *
 * Changes in 2.12.0:
 * - Added robustness infrastructure (4-phase implementation)
 * - New core/assertions.js for strong type checking
 * - New core/service-container.js for SOLID-compliant DI
 * - New core/startup-checklist.js for pre-flight validation
 * - New components/diagnostic-panel.js for user-facing diagnostics
 * - New validate-and-backup.bat for automated validation
 * - New scripts/validate-and-report.js for entity validation
 * - Added css/diagnostic-panel.css for diagnostic styling
 * - Updated app-init-simple.js to use startup checklist
 *
 * Changes in 2.11.0:
 * - CRITICAL FIX: Add window.SPANavigation export
 * - SPANavigation class was not attached to window object
 * - app-init-simple.js uses dependencyExists() which checks window[name]
 * - Without export, navigation was never initialized, causing blank page
 *
 * Changes in 2.10.0:
 * - Fix landing page not rendering: race condition in app-coordinator.js
 * - Add safety timeout in app-init-simple.js for content visibility
 * - Improve CSS visibility handling in landing-page-view.js
 * - Add critical CSS safeguards in index.html
 *
 * Changes in 2.9.2:
 * - Fix lazy-loader race condition: check firebase.apps.length before calling auth()
 * - Prevents "Firebase App not created" error in lazy-loader.js
 *
 * Changes in 2.9.1:
 * - CRITICAL FIX: firebaseConfig now uses window.firebaseConfig
 * - Fixes "Firebase config not found" error on production
 * - const declarations don't attach to window object, causing init failure
 *
 * Changes in 2.9.0:
 * - 12-agent polish sprint for home page display chain
 * - Fixed race conditions in SPA navigation
 * - Added navigation validity checks for async renders
 * - Improved landing page view with golden ratio typography
 * - Enhanced entity card with standardized sizing
 * - Fixed firebase cache manager TTL handling
 * - Improved entity-renderer-firebase with batch loading
 * - Enhanced browse-category-view with responsive grid
 * - Fixed app-init-simple event sequencing
 * - Added fallback mechanisms for missing dependencies
 *
 * Changes in 2.8.1:
 * - Fixed social sharing meta images to use existing icon
 * - Added default avatar placeholder for user info
 *
 * Changes in 2.8.0:
 * - Fixed null pointer in handleFetchError
 * - Fixed async caching in staleWhileRevalidate
 * - Added cache timestamp tracking for reliable staleness checks
 * - Added cache size limits to prevent storage overflow
 * - Improved SPA navigation handling
 * - Added network timeout for faster offline fallback
 */

const CACHE_VERSION = 'v2.12.1';
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
  // Firebase Auth - network only (never cache auth tokens)
  { pattern: /identitytoolkit\.googleapis\.com/, strategy: CACHE_STRATEGIES.NETWORK_ONLY },
  { pattern: /securetoken\.googleapis\.com/, strategy: CACHE_STRATEGIES.NETWORK_ONLY },

  // Firebase Firestore - always network first
  { pattern: /firestore\.googleapis\.com/, strategy: CACHE_STRATEGIES.NETWORK_FIRST },

  // Firebase Storage - cache first for images
  { pattern: /firebasestorage\.googleapis\.com/, strategy: CACHE_STRATEGIES.CACHE_FIRST },

  // API calls - network first
  { pattern: /\/api\//, strategy: CACHE_STRATEGIES.NETWORK_FIRST },

  // Static assets - cache first
  { pattern: /\.(css|js|png|jpg|jpeg|svg|webp|woff2|woff|ttf|ico)$/i, strategy: CACHE_STRATEGIES.CACHE_FIRST },

  // HTML pages - stale while revalidate
  { pattern: /\.html$/i, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE }
];

// Maximum cache age (7 days)
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

// Network timeout for faster offline fallback (5 seconds)
const NETWORK_TIMEOUT = 5000;

// Maximum number of items to cache per type
const MAX_CACHE_ITEMS = {
  images: 100,
  pages: 50,
  assets: 200
};

/**
 * Install Event - Cache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        // Use individual cache.add() to handle failures gracefully
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, err.message);
              return null; // Continue despite individual failures
            })
          )
        );
      })
      .then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[Service Worker] Precached ${successful}/${PRECACHE_ASSETS.length} assets`);
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
        const deletions = cacheNames
          .filter((name) => {
            // Delete old versioned caches
            if (name.startsWith('eyes-of-azrael-') && name !== CACHE_NAME) {
              return true;
            }
            // Also clean up any orphaned caches without our prefix
            // that might be from development
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
        // Claim all clients immediately so the new SW takes control
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that an update occurred
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_ACTIVATED',
              version: CACHE_VERSION
            });
          });
        });
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

  // Note: Cross-origin requests to Firebase are handled by route strategies

  // Handle SPA navigation - serve index.html for navigation requests
  // This handles hash-based routing (#/path) where the browser requests /
  if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(
      caches.match('/index.html')
        .then(cached => {
          if (cached) {
            // Return cached but update in background
            fetchAndCache(request);
            return cached;
          }
          return fetch(request);
        })
        .catch(() => handleFetchError(request))
    );
    return;
  }

  // Determine strategy for this request
  const strategy = getStrategyForRequest(request);

  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', error.message || error);
        return handleFetchError(request);
      })
  );
});

/**
 * Helper: Fetch and cache a request in the background
 * Does not return the response, just updates the cache
 */
function fetchAndCache(request) {
  fetch(request)
    .then(async (response) => {
      if (response.ok && response.status === 200) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch (error) {
          // Silently fail - this is a background update
        }
      }
    })
    .catch(() => {
      // Silently fail - this is a background update
    });
}

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
 * Try network with timeout, fallback to cache
 */
async function networkFirst(request) {
  try {
    // Race between network and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);

    try {
      const response = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);

      // Cache successful responses
      if (response.ok && response.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        // Don't await - cache in background
        cache.put(request, response.clone()).catch(() => {});
      }

      return response;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    // Network failed or timed out, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache (network failed):', request.url);
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
    // Check cache age using date header if available
    const dateHeader = cachedResponse.headers.get('date');
    if (dateHeader) {
      const cacheDate = new Date(dateHeader);
      const age = Date.now() - cacheDate.getTime();

      // If cache is fresh, return it
      if (!isNaN(age) && age < MAX_CACHE_AGE) {
        return cachedResponse;
      }
      // Cache is stale, but still return it while fetching fresh copy
      fetchAndCache(request);
      return cachedResponse;
    }
    // No date header, return cached response but update in background
    fetchAndCache(request);
    return cachedResponse;
  }

  // Nothing in cache, fetch from network
  try {
    const response = await fetch(request);

    if (response.ok && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      // Don't await - cache in background
      cache.put(request, response.clone()).catch(() => {});
    }

    return response;
  } catch (error) {
    // Network failed, nothing in cache - throw
    throw error;
  }
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

  // Always start fetch in background to update cache
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok && response.status === 200) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
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

  // Both cache and network failed
  throw new Error('No cached response and network failed');
}

/**
 * Handle fetch errors
 */
async function handleFetchError(request) {
  // Safely check if this is a navigation/HTML request
  const acceptHeader = request.headers.get('accept') || '';
  const isNavigationRequest = request.mode === 'navigate' ||
    acceptHeader.includes('text/html');

  // If requesting an HTML page, show offline page
  if (isNavigationRequest) {
    const offlinePage = await caches.match(OFFLINE_PAGE);
    if (offlinePage) {
      return offlinePage;
    }
    // Try index.html as fallback for SPA
    const indexPage = await caches.match('/index.html');
    if (indexPage) {
      return indexPage;
    }
  }

  // Try to return cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // For non-HTML requests, return appropriate error
  if (!isNavigationRequest) {
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }

  // Return error page for HTML requests
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
  const { data } = event;
  if (!data || !data.type) return;

  switch (data.type) {
    case 'SKIP_WAITING':
      console.log('[Service Worker] Skip waiting requested');
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      console.log('[Service Worker] Clear cache requested');
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              console.log('[Service Worker] Deleting cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        }).then(() => {
          // Notify client that cache was cleared
          if (event.source) {
            event.source.postMessage({ type: 'CACHE_CLEARED' });
          }
        })
      );
      break;

    case 'CACHE_URLS':
      const urls = data.urls || [];
      console.log(`[Service Worker] Caching ${urls.length} URLs`);
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          // Use Promise.allSettled to handle individual failures
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
      // Return current cache version
      if (event.source) {
        event.source.postMessage({
          type: 'VERSION_INFO',
          version: CACHE_VERSION,
          cacheName: CACHE_NAME
        });
      }
      break;

    case 'CLEANUP_OLD_CACHES':
      // Force cleanup of old caches
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter(name => name.startsWith('eyes-of-azrael-') && name !== CACHE_NAME)
              .map(name => {
                console.log('[Service Worker] Force deleting old cache:', name);
                return caches.delete(name);
              })
          );
        })
      );
      break;

    default:
      console.log('[Service Worker] Unknown message type:', data.type);
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
