/**
 * Route Preloader Module
 * Hover-based prefetching for improved navigation performance
 *
 * Usage:
 *   RoutePreloader.init(firestoreDb);
 *   const data = RoutePreloader.getCached('mythology/greek/deities/zeus');
 *   RoutePreloader.clearCache();
 */

const RoutePreloader = {
    _cache: new Map(),
    _pending: new Map(),
    _maxCacheSize: 20,
    _hoverDelay: 150, // ms before starting prefetch
    _cacheExpiry: 60000, // 1 minute cache
    _db: null,
    _initialized: false,

    /**
     * Initialize the preloader with Firestore instance
     * @param {Object} db - Firestore database instance
     */
    init(db) {
        if (this._initialized) return;

        this._db = db;
        this._setupHoverListeners();
        this._initialized = true;
    },

    /**
     * Set up document-level hover listeners for prefetching
     * @private
     */
    _setupHoverListeners() {
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href === '#' || href === '#/') return;

            // Delay prefetch to avoid unnecessary requests on quick hovers
            link._prefetchTimer = setTimeout(() => {
                this.prefetch(href);
            }, this._hoverDelay);
        });

        document.addEventListener('mouseout', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link._prefetchTimer) {
                clearTimeout(link._prefetchTimer);
                link._prefetchTimer = null;
            }
        });
    },

    /**
     * Prefetch data for a given route path
     * @param {string} path - Route path to prefetch
     * @returns {Promise<Object|null>} Prefetched data or null
     */
    async prefetch(path) {
        const normalizedPath = path.replace(/^#\/?/, '');

        // Check cache
        const cached = this._cache.get(normalizedPath);
        if (cached && Date.now() - cached.timestamp < this._cacheExpiry) {
            return cached.data;
        }

        // Check if already pending
        if (this._pending.has(normalizedPath)) {
            return this._pending.get(normalizedPath);
        }

        // Determine what to prefetch based on route pattern
        const prefetchPromise = this._prefetchRoute(normalizedPath);
        this._pending.set(normalizedPath, prefetchPromise);

        try {
            const data = await prefetchPromise;
            this._cache.set(normalizedPath, { data, timestamp: Date.now() });

            // Cleanup old cache entries (LRU-style)
            if (this._cache.size > this._maxCacheSize) {
                const oldestKey = this._cache.keys().next().value;
                this._cache.delete(oldestKey);
            }

            return data;
        } catch (error) {
            console.warn('[RoutePreloader] Prefetch failed for:', normalizedPath, error);
            return null;
        } finally {
            this._pending.delete(normalizedPath);
        }
    },

    /**
     * Prefetch route data based on path pattern
     * @param {string} path - Normalized route path
     * @returns {Promise<Object|Array|null>} Fetched data
     * @private
     */
    async _prefetchRoute(path) {
        if (!this._db) return null;

        // Entity route: /mythology/:myth/:category/:id or /entity/:category/:myth/:id
        const entityMatch = path.match(/(?:mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)|entity\/([^\/]+)\/([^\/]+)\/([^\/]+))/);
        if (entityMatch) {
            const category = entityMatch[2] || entityMatch[4];
            const entityId = entityMatch[3] || entityMatch[6];
            try {
                const doc = await this._db.collection(category).doc(entityId).get();
                return doc.exists ? { id: doc.id, ...doc.data() } : null;
            } catch (e) {
                return null;
            }
        }

        // Browse category: /browse/:category
        const browseMatch = path.match(/browse\/([^\/]+)/);
        if (browseMatch) {
            const category = browseMatch[1];
            try {
                const snapshot = await this._db.collection(category).limit(20).get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                return null;
            }
        }

        return null;
    },

    /**
     * Get cached data for a path
     * @param {string} path - Route path to check
     * @returns {Object|null} Cached data or null if not cached/expired
     */
    getCached(path) {
        const normalizedPath = path.replace(/^#\/?/, '');
        const cached = this._cache.get(normalizedPath);
        if (cached && Date.now() - cached.timestamp < this._cacheExpiry) {
            return cached.data;
        }
        return null;
    },

    /**
     * Clear all cached prefetch data
     */
    clearCache() {
        this._cache.clear();
        this._pending.clear();
    },

    /**
     * Get cache statistics for debugging
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            cacheSize: this._cache.size,
            pendingRequests: this._pending.size,
            maxCacheSize: this._maxCacheSize,
            cacheExpiry: this._cacheExpiry
        };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoutePreloader;
}

// Export to window for browser usage
window.RoutePreloader = RoutePreloader;
