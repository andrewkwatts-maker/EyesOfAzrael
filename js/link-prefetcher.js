/**
 * Link Prefetcher - Aggressive preloading for instant navigation
 *
 * Features:
 * - IntersectionObserver: Prefetch links as they come into viewport
 * - Hover prefetch: Start loading on hover (reduced delay)
 * - Idle prefetch: Preload visible links during idle time
 * - Priority queue: Prefetch most likely links first
 * - Persistent cache: Share cache across navigation
 * - Background refresh: Keep hot cache entries fresh
 */

class LinkPrefetcher {
    constructor(options = {}) {
        this.db = null;
        this.cache = new Map();
        this.pending = new Map();
        this.prefetchQueue = [];
        this.isProcessing = false;

        // Configuration
        this.config = {
            hoverDelay: 50,              // Reduced from 150ms
            cacheExpiry: 10 * 60 * 1000, // 10 minutes (up from 1 min)
            maxCacheSize: 100,           // Increased from 20
            maxConcurrent: 3,            // Max parallel fetches
            intersectionThreshold: 0.1,  // Trigger at 10% visibility
            idlePrefetchBatch: 5,        // Links per idle callback
            priorityBoost: ['deities', 'heroes', 'creatures'], // High-priority categories
            ...options
        };

        // Stats for debugging
        this.stats = {
            hits: 0,
            misses: 0,
            prefetched: 0,
            errors: 0
        };

        this._observer = null;
        this._idleCallbackId = null;
        this._initialized = false;
    }

    /**
     * Initialize with Firestore database
     */
    init(db) {
        if (this._initialized) return;

        this.db = db;
        this._setupIntersectionObserver();
        this._setupHoverListeners();
        this._setupNavigationListener();
        this._initialized = true;

        console.log('[Prefetcher] Initialized');
    }

    /**
     * IntersectionObserver for viewport-based prefetching
     */
    _setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        this._observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const link = entry.target;
                        const href = link.getAttribute('href');
                        if (href && href.startsWith('#')) {
                            this._queuePrefetch(href, 'intersection');
                        }
                    }
                });
            },
            {
                rootMargin: '100px', // Start prefetching before fully visible
                threshold: this.config.intersectionThreshold
            }
        );

        // Initial observation of existing links
        this._observeLinks();
    }

    /**
     * Observe all internal links on the page
     */
    _observeLinks() {
        if (!this._observer) return;

        document.querySelectorAll('a[href^="#"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '#' && href !== '#/' && !link._prefetchObserved) {
                this._observer.observe(link);
                link._prefetchObserved = true;
            }
        });
    }

    /**
     * Hover-based prefetching with reduced delay
     */
    _setupHoverListeners() {
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href === '#' || href === '#/') return;

            // Immediate prefetch for high-priority links
            const isHighPriority = this._isHighPriority(href);
            const delay = isHighPriority ? 0 : this.config.hoverDelay;

            link._prefetchTimer = setTimeout(() => {
                this.prefetch(href, 'hover');
            }, delay);
        }, { passive: true });

        document.addEventListener('mouseout', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link._prefetchTimer) {
                clearTimeout(link._prefetchTimer);
                link._prefetchTimer = null;
            }
        }, { passive: true });

        // Touch support: prefetch on touchstart
        document.addEventListener('touchstart', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                const href = link.getAttribute('href');
                if (href && href !== '#' && href !== '#/') {
                    this.prefetch(href, 'touch');
                }
            }
        }, { passive: true });
    }

    /**
     * Listen for navigation to prefetch links on new pages
     */
    _setupNavigationListener() {
        document.addEventListener('navigation-complete', () => {
            // Re-observe new links after navigation
            requestAnimationFrame(() => {
                this._observeLinks();
                this._scheduleIdlePrefetch();
            });
        });

        // Also handle initial page load
        if (document.readyState === 'complete') {
            this._scheduleIdlePrefetch();
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this._scheduleIdlePrefetch(), 1000);
            }, { once: true });
        }
    }

    /**
     * Schedule prefetching during idle time
     */
    _scheduleIdlePrefetch() {
        if (this._idleCallbackId) {
            cancelIdleCallback(this._idleCallbackId);
        }

        const idlePrefetch = (deadline) => {
            // Get visible links not yet prefetched
            const links = Array.from(document.querySelectorAll('a[href^="#"]'))
                .filter(link => {
                    const href = link.getAttribute('href');
                    if (!href || href === '#' || href === '#/') return false;
                    const normalized = this._normalizePath(href);
                    return !this.cache.has(normalized) && !this.pending.has(normalized);
                })
                .slice(0, this.config.idlePrefetchBatch);

            let i = 0;
            while (deadline.timeRemaining() > 5 && i < links.length) {
                const href = links[i].getAttribute('href');
                this._queuePrefetch(href, 'idle');
                i++;
            }

            // Continue if more links and time
            if (links.length > i) {
                this._idleCallbackId = requestIdleCallback(idlePrefetch, { timeout: 2000 });
            }
        };

        if ('requestIdleCallback' in window) {
            this._idleCallbackId = requestIdleCallback(idlePrefetch, { timeout: 3000 });
        } else {
            // Fallback for Safari
            setTimeout(() => {
                document.querySelectorAll('a[href^="#"]').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href !== '#' && href !== '#/') {
                        this._queuePrefetch(href, 'fallback');
                    }
                });
            }, 2000);
        }
    }

    /**
     * Check if a path is high priority
     */
    _isHighPriority(path) {
        const normalized = this._normalizePath(path);
        return this.config.priorityBoost.some(cat => normalized.includes(cat));
    }

    /**
     * Normalize path for cache keys
     */
    _normalizePath(path) {
        return path.replace(/^#\/?/, '').replace(/\/$/, '');
    }

    /**
     * Add to prefetch queue with priority
     */
    _queuePrefetch(path, source) {
        const normalized = this._normalizePath(path);

        // Skip if already cached or pending
        if (this.cache.has(normalized) || this.pending.has(normalized)) {
            return;
        }

        // Check if already in queue
        if (this.prefetchQueue.some(item => item.path === normalized)) {
            return;
        }

        // Priority: hover > touch > intersection > idle
        const priorityMap = { hover: 10, touch: 9, intersection: 5, idle: 1, fallback: 1 };
        const priority = priorityMap[source] || 1;

        // Boost priority for high-priority categories
        const boost = this._isHighPriority(path) ? 5 : 0;

        this.prefetchQueue.push({
            path: normalized,
            priority: priority + boost,
            source,
            timestamp: Date.now()
        });

        // Sort by priority (highest first)
        this.prefetchQueue.sort((a, b) => b.priority - a.priority);

        // Process queue
        this._processQueue();
    }

    /**
     * Process the prefetch queue
     */
    async _processQueue() {
        if (this.isProcessing || this.prefetchQueue.length === 0) return;
        if (this.pending.size >= this.config.maxConcurrent) return;

        this.isProcessing = true;

        while (this.prefetchQueue.length > 0 && this.pending.size < this.config.maxConcurrent) {
            const item = this.prefetchQueue.shift();
            if (!item) break;

            // Skip if already cached while waiting
            if (this.cache.has(item.path)) continue;

            // Start prefetch (don't await, let it run in parallel)
            this._doPrefetch(item.path);
        }

        this.isProcessing = false;
    }

    /**
     * Actually perform the prefetch
     */
    async _doPrefetch(normalizedPath) {
        if (!this.db) return null;

        const prefetchPromise = this._fetchRouteData(normalizedPath);
        this.pending.set(normalizedPath, prefetchPromise);

        try {
            const data = await prefetchPromise;
            if (data) {
                this._cacheData(normalizedPath, data);
                this.stats.prefetched++;
            }
            return data;
        } catch (error) {
            this.stats.errors++;
            console.warn('[Prefetcher] Failed:', normalizedPath, error.message);
            return null;
        } finally {
            this.pending.delete(normalizedPath);
            // Continue processing queue
            this._processQueue();
        }
    }

    /**
     * Fetch data based on route pattern
     */
    async _fetchRouteData(path) {
        // Entity route patterns
        const patterns = [
            // /mythology/:myth/:category/:id
            { regex: /^mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)$/, handler: this._fetchEntity.bind(this) },
            // /entity/:category/:myth/:id
            { regex: /^entity\/([^\/]+)\/([^\/]+)\/([^\/]+)$/, handler: this._fetchEntityAlt.bind(this) },
            // /entity/:category/:id (simple)
            { regex: /^entity\/([^\/]+)\/([^\/]+)$/, handler: this._fetchEntitySimple.bind(this) },
            // /browse/:category
            { regex: /^browse\/([^\/]+)$/, handler: this._fetchBrowse.bind(this) },
            // /mythology/:myth
            { regex: /^mythology\/([^\/]+)$/, handler: this._fetchMythology.bind(this) }
        ];

        for (const { regex, handler } of patterns) {
            const match = path.match(regex);
            if (match) {
                return handler(match);
            }
        }

        return null;
    }

    async _fetchEntity(match) {
        const [, mythology, category, id] = match;
        try {
            const doc = await this.db.collection(category).doc(id).get();
            return doc.exists ? { id: doc.id, ...doc.data(), _type: 'entity' } : null;
        } catch (e) {
            return null;
        }
    }

    async _fetchEntityAlt(match) {
        const [, category, mythology, id] = match;
        try {
            const doc = await this.db.collection(category).doc(id).get();
            return doc.exists ? { id: doc.id, ...doc.data(), _type: 'entity' } : null;
        } catch (e) {
            return null;
        }
    }

    async _fetchEntitySimple(match) {
        const [, category, id] = match;
        try {
            const doc = await this.db.collection(category).doc(id).get();
            return doc.exists ? { id: doc.id, ...doc.data(), _type: 'entity' } : null;
        } catch (e) {
            return null;
        }
    }

    async _fetchBrowse(match) {
        const [, category] = match;
        try {
            const snapshot = await this.db.collection(category)
                .orderBy('popularity', 'desc')
                .limit(30)
                .get();
            return {
                items: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                _type: 'browse'
            };
        } catch (e) {
            return null;
        }
    }

    async _fetchMythology(match) {
        const [, mythology] = match;
        try {
            const doc = await this.db.collection('mythologies').doc(mythology).get();
            return doc.exists ? { id: doc.id, ...doc.data(), _type: 'mythology' } : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Cache data with expiry
     */
    _cacheData(path, data) {
        // Clean up if at capacity
        if (this.cache.size >= this.config.maxCacheSize) {
            // Remove oldest entries
            const entries = Array.from(this.cache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toRemove = entries.slice(0, Math.floor(this.config.maxCacheSize * 0.2));
            toRemove.forEach(([key]) => this.cache.delete(key));
        }

        this.cache.set(path, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached data if available and fresh
     */
    get(path) {
        const normalized = this._normalizePath(path);
        const cached = this.cache.get(normalized);

        if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
            this.stats.hits++;
            return cached.data;
        }

        this.stats.misses++;
        return null;
    }

    /**
     * Manually prefetch a path (for external use)
     */
    async prefetch(path, source = 'manual') {
        const normalized = this._normalizePath(path);

        // Return cached if available
        const cached = this.get(path);
        if (cached) return cached;

        // Return pending if in progress
        if (this.pending.has(normalized)) {
            return this.pending.get(normalized);
        }

        // Queue with high priority for manual prefetch
        this._queuePrefetch(path, source);

        // For hover/touch, also start immediately
        if (source === 'hover' || source === 'touch') {
            return this._doPrefetch(normalized);
        }
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            queueLength: this.prefetchQueue.length,
            pendingCount: this.pending.size,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.pending.clear();
        this.prefetchQueue = [];
        this.stats = { hits: 0, misses: 0, prefetched: 0, errors: 0 };
    }
}

// Create global instance
window.LinkPrefetcher = new LinkPrefetcher();

// Auto-init when Firebase is ready (multiple event listeners for reliability)
document.addEventListener('firebase-ready', () => {
    if (window.firebase?.firestore) {
        window.LinkPrefetcher.init(window.firebase.firestore());
    }
});

window.addEventListener('firebaseAuthStateChanged', () => {
    if (window.firebase?.firestore && !window.LinkPrefetcher._initialized) {
        window.LinkPrefetcher.init(window.firebase.firestore());
    }
});

// Check periodically until Firebase is available (reliable fallback)
const _prefetcherInitCheck = setInterval(() => {
    if (window.firebase?.firestore && !window.LinkPrefetcher._initialized) {
        window.LinkPrefetcher.init(window.firebase.firestore());
        clearInterval(_prefetcherInitCheck);
    }
}, 100);

// Stop checking after 10 seconds
setTimeout(() => clearInterval(_prefetcherInitCheck), 10000);

// Fallback init for already-loaded Firebase
if (window.firebase?.firestore) {
    window.LinkPrefetcher.init(window.firebase.firestore());
}
