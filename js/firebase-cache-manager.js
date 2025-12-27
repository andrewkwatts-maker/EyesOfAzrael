/**
 * Firebase Cache Manager
 * Intelligent multi-layer caching system for Firebase queries
 *
 * Features:
 * - Memory cache (fastest, session lifetime)
 * - SessionStorage cache (tab lifetime)
 * - LocalStorage cache (persistent)
 * - TTL-based expiration
 * - Cache invalidation
 * - Performance metrics
 * - Automatic cache warming
 *
 * Usage:
 *   const cache = new FirebaseCacheManager();
 *   const data = await cache.get('deities', 'zeus', { ttl: 300000 });
 *   await cache.set('deities', 'zeus', data, { ttl: 300000 });
 *   cache.invalidate('deities', 'zeus');
 */

class FirebaseCacheManager {
    constructor(options = {}) {
        this.db = options.db || (typeof firebase !== 'undefined' && firebase.firestore());

        // Memory cache (fastest, cleared on page reload)
        this.memoryCache = new Map();

        // Default TTL values (milliseconds)
        this.defaultTTL = {
            mythologies: 86400000,    // 24 hours - static content
            metadata: 3600000,        // 1 hour - counts/stats
            entities: 300000,         // 5 minutes - entity details
            lists: 600000,            // 10 minutes - entity lists
            search: 604800000,        // 7 days - search index
            temporary: 60000          // 1 minute - temporary data
        };

        // Performance metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            invalidations: 0,
            queries: 0,
            avgResponseTime: 0,
            totalResponseTime: 0
        };

        // Load metrics from storage
        this.loadMetrics();

        console.log('[CacheManager] Initialized with default TTLs:', this.defaultTTL);
    }

    /**
     * Get data from cache or fetch from Firebase
     * @param {string} collection - Firestore collection name
     * @param {string} id - Document ID
     * @param {object} options - Cache options
     * @returns {Promise<object|null>}
     */
    async get(collection, id, options = {}) {
        const startTime = performance.now();
        const cacheKey = this.generateKey(collection, id);
        const ttl = options.ttl || this.getDefaultTTL(collection);
        const forceRefresh = options.forceRefresh || false;

        try {
            // Check if force refresh requested
            if (!forceRefresh) {
                // 1. Check memory cache first (fastest)
                const memoryData = this.getFromMemory(cacheKey);
                if (memoryData && !this.isExpired(memoryData, ttl)) {
                    this.recordHit(startTime);
                    console.log(`[CacheManager] =š Memory hit: ${cacheKey}`);
                    return memoryData.data;
                }

                // 2. Check sessionStorage (tab lifetime)
                const sessionData = this.getFromSessionStorage(cacheKey);
                if (sessionData && !this.isExpired(sessionData, ttl)) {
                    // Promote to memory cache
                    this.memoryCache.set(cacheKey, sessionData);
                    this.recordHit(startTime);
                    console.log(`[CacheManager] =™ Session hit: ${cacheKey}`);
                    return sessionData.data;
                }

                // 3. Check localStorage (persistent)
                const localData = this.getFromLocalStorage(cacheKey);
                if (localData && !this.isExpired(localData, ttl)) {
                    // Promote to memory and session cache
                    this.memoryCache.set(cacheKey, localData);
                    this.setToSessionStorage(cacheKey, localData);
                    this.recordHit(startTime);
                    console.log(`[CacheManager] =› Local hit: ${cacheKey}`);
                    return localData.data;
                }
            }

            // 4. Cache miss - fetch from Firebase
            this.recordMiss();
            console.log(`[CacheManager] L Cache miss: ${cacheKey}, fetching from Firebase...`);

            const data = await this.fetchFromFirebase(collection, id);

            if (data) {
                // Store in all cache layers
                await this.set(collection, id, data, { ttl });

                const responseTime = performance.now() - startTime;
                this.recordQuery(responseTime);
                console.log(`[CacheManager]  Fetched and cached: ${cacheKey} (${responseTime.toFixed(2)}ms)`);
            }

            return data;

        } catch (error) {
            console.error(`[CacheManager] Error getting ${cacheKey}:`, error);
            throw error;
        }
    }

    /**
     * Store data in cache
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {object} data - Data to cache
     * @param {object} options - Cache options
     */
    async set(collection, id, data, options = {}) {
        const cacheKey = this.generateKey(collection, id);
        const ttl = options.ttl || this.getDefaultTTL(collection);

        const cacheEntry = {
            data: data,
            timestamp: Date.now(),
            ttl: ttl,
            collection: collection,
            id: id
        };

        try {
            // Store in all layers
            this.memoryCache.set(cacheKey, cacheEntry);
            this.setToSessionStorage(cacheKey, cacheEntry);
            this.setToLocalStorage(cacheKey, cacheEntry);

            this.metrics.sets++;
            console.log(`[CacheManager] =¾ Cached: ${cacheKey} (TTL: ${ttl}ms)`);

        } catch (error) {
            console.error(`[CacheManager] Error caching ${cacheKey}:`, error);
        }
    }

    /**
     * Invalidate cached data
     * @param {string} collection - Collection name
     * @param {string} id - Document ID (optional, invalidates all if omitted)
     */
    invalidate(collection, id = null) {
        if (id) {
            // Invalidate specific document
            const cacheKey = this.generateKey(collection, id);
            this.memoryCache.delete(cacheKey);
            sessionStorage.removeItem(cacheKey);
            localStorage.removeItem(cacheKey);
            console.log(`[CacheManager] =Ñ Invalidated: ${cacheKey}`);
        } else {
            // Invalidate entire collection
            const prefix = `cache_${collection}_`;

            // Clear from memory
            for (const key of this.memoryCache.keys()) {
                if (key.startsWith(prefix)) {
                    this.memoryCache.delete(key);
                }
            }

            // Clear from sessionStorage
            this.clearStorageByPrefix(sessionStorage, prefix);

            // Clear from localStorage
            this.clearStorageByPrefix(localStorage, prefix);

            console.log(`[CacheManager] =Ñ Invalidated collection: ${collection}`);
        }

        this.metrics.invalidations++;
    }

    /**
     * Clear all caches
     */
    clearAll() {
        this.memoryCache.clear();

        // Clear cache entries from storage (keep metrics)
        this.clearStorageByPrefix(sessionStorage, 'cache_');
        this.clearStorageByPrefix(localStorage, 'cache_');

        console.log('[CacheManager] =Ñ All caches cleared');
    }

    /**
     * Fetch data from Firebase
     */
    async fetchFromFirebase(collection, id) {
        if (!this.db) {
            throw new Error('Firebase Firestore not initialized');
        }

        try {
            const doc = await this.db.collection(collection).doc(id).get();

            if (!doc.exists) {
                return null;
            }

            return { id: doc.id, ...doc.data() };

        } catch (error) {
            console.error(`[CacheManager] Firebase fetch error (${collection}/${id}):`, error);
            throw error;
        }
    }

    /**
     * Fetch list from Firebase with caching
     */
    async getList(collection, filters = {}, options = {}) {
        const cacheKey = this.generateListKey(collection, filters);
        const ttl = options.ttl || this.defaultTTL.lists;
        const forceRefresh = options.forceRefresh || false;

        try {
            // Check cache
            if (!forceRefresh) {
                const cached = this.getFromMemory(cacheKey) ||
                               this.getFromSessionStorage(cacheKey) ||
                               this.getFromLocalStorage(cacheKey);

                if (cached && !this.isExpired(cached, ttl)) {
                    this.recordHit(performance.now());
                    console.log(`[CacheManager] =š List cache hit: ${cacheKey}`);
                    return cached.data;
                }
            }

            // Fetch from Firebase
            this.recordMiss();
            const startTime = performance.now();

            let query = this.db.collection(collection);

            // Apply filters
            if (filters.mythology) {
                query = query.where('mythology', '==', filters.mythology);
            }

            if (filters.type) {
                query = query.where('type', '==', filters.type);
            }

            // Apply ordering
            if (options.orderBy) {
                const [field, direction = 'asc'] = options.orderBy.split(' ');
                query = query.orderBy(field, direction);
            }

            // Apply limit (default 20)
            const limit = options.limit || 20;
            query = query.limit(limit);

            // Apply pagination
            if (options.startAfter) {
                query = query.startAfter(options.startAfter);
            }

            const snapshot = await query.get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Cache the results
            const cacheEntry = {
                data: data,
                timestamp: Date.now(),
                ttl: ttl,
                collection: collection,
                filters: filters
            };

            this.memoryCache.set(cacheKey, cacheEntry);
            this.setToSessionStorage(cacheKey, cacheEntry);

            const responseTime = performance.now() - startTime;
            this.recordQuery(responseTime);
            console.log(`[CacheManager]  List fetched: ${cacheKey} (${data.length} items, ${responseTime.toFixed(2)}ms)`);

            return data;

        } catch (error) {
            console.error(`[CacheManager] Error fetching list ${cacheKey}:`, error);
            throw error;
        }
    }

    /**
     * Get metadata (counts, stats)
     */
    async getMetadata(type, id = null) {
        const cacheKey = id ? `cache_metadata_${type}_${id}` : `cache_metadata_${type}`;
        const ttl = this.defaultTTL.metadata;

        try {
            // Check cache
            const cached = this.getFromMemory(cacheKey) ||
                          this.getFromLocalStorage(cacheKey);

            if (cached && !this.isExpired(cached, ttl)) {
                this.recordHit(performance.now());
                return cached.data;
            }

            // Fetch from Firebase metadata collection
            this.recordMiss();

            let data;
            if (id) {
                const doc = await this.db.collection('metadata').doc(`${type}_${id}`).get();
                data = doc.exists ? doc.data() : null;
            } else {
                const snapshot = await this.db.collection('metadata')
                    .where('type', '==', type)
                    .get();
                data = snapshot.docs.map(doc => doc.data());
            }

            if (data) {
                const cacheEntry = {
                    data: data,
                    timestamp: Date.now(),
                    ttl: ttl
                };

                this.memoryCache.set(cacheKey, cacheEntry);
                this.setToLocalStorage(cacheKey, cacheEntry);
            }

            return data;

        } catch (error) {
            console.error(`[CacheManager] Error fetching metadata:`, error);
            return null;
        }
    }

    /**
     * Warm cache for frequently accessed data
     */
    async warmCache() {
        console.log('[CacheManager] =% Warming cache...');

        try {
            // Warm mythology list
            const mythologies = await this.getList('mythologies', {}, { ttl: this.defaultTTL.mythologies });
            console.log(`[CacheManager] Cached ${mythologies.length} mythologies`);

            // Warm metadata
            const metadata = await this.getMetadata('mythology_counts');
            console.log(`[CacheManager] Cached mythology metadata`);

            console.log('[CacheManager] =% Cache warming complete');

        } catch (error) {
            console.error('[CacheManager] Error warming cache:', error);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.metrics.hits + this.metrics.misses > 0
            ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100).toFixed(2)
            : 0;

        return {
            ...this.metrics,
            hitRate: hitRate + '%',
            memoryCacheSize: this.memoryCache.size,
            avgResponseTime: this.metrics.queries > 0
                ? (this.metrics.totalResponseTime / this.metrics.queries).toFixed(2) + 'ms'
                : '0ms'
        };
    }

    /**
     * Print statistics
     */
    printStats() {
        const stats = this.getStats();
        console.log('[CacheManager] =Ê Performance Statistics:');
        console.log(`  Cache Hits: ${stats.hits} (${stats.hitRate})`);
        console.log(`  Cache Misses: ${stats.misses}`);
        console.log(`  Cache Sets: ${stats.sets}`);
        console.log(`  Invalidations: ${stats.invalidations}`);
        console.log(`  Firebase Queries: ${stats.queries}`);
        console.log(`  Avg Response Time: ${stats.avgResponseTime}`);
        console.log(`  Memory Cache Size: ${stats.memoryCacheSize} entries`);
    }

    // ==================== HELPER METHODS ====================

    generateKey(collection, id) {
        return `cache_${collection}_${id}`;
    }

    generateListKey(collection, filters) {
        const filterStr = Object.entries(filters)
            .sort()
            .map(([k, v]) => `${k}:${v}`)
            .join('_');
        return `cache_list_${collection}_${filterStr}`;
    }

    getDefaultTTL(collection) {
        return this.defaultTTL[collection] || this.defaultTTL.temporary;
    }

    isExpired(cacheEntry, ttl) {
        if (!cacheEntry || !cacheEntry.timestamp) return true;
        const age = Date.now() - cacheEntry.timestamp;
        return age > ttl;
    }

    getFromMemory(key) {
        return this.memoryCache.get(key);
    }

    getFromSessionStorage(key) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn(`[CacheManager] SessionStorage read error (${key}):`, error);
            return null;
        }
    }

    getFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn(`[CacheManager] LocalStorage read error (${key}):`, error);
            return null;
        }
    }

    setToSessionStorage(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('[CacheManager] SessionStorage quota exceeded, clearing old entries');
                this.clearOldestEntries(sessionStorage);
                // Retry
                try {
                    sessionStorage.setItem(key, JSON.stringify(data));
                } catch (retryError) {
                    console.error('[CacheManager] SessionStorage write failed after cleanup');
                }
            }
        }
    }

    setToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('[CacheManager] LocalStorage quota exceeded, clearing old entries');
                this.clearOldestEntries(localStorage);
                // Retry
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                } catch (retryError) {
                    console.error('[CacheManager] LocalStorage write failed after cleanup');
                }
            }
        }
    }

    clearStorageByPrefix(storage, prefix) {
        const keysToRemove = [];

        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => storage.removeItem(key));
    }

    clearOldestEntries(storage) {
        const entries = [];

        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith('cache_')) {
                try {
                    const data = JSON.parse(storage.getItem(key));
                    entries.push({ key, timestamp: data.timestamp || 0 });
                } catch (error) {
                    // Invalid entry, mark for removal
                    entries.push({ key, timestamp: 0 });
                }
            }
        }

        // Sort by timestamp and remove oldest 25%
        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = Math.ceil(entries.length * 0.25);

        for (let i = 0; i < toRemove; i++) {
            storage.removeItem(entries[i].key);
        }

        console.log(`[CacheManager] Cleared ${toRemove} oldest entries from storage`);
    }

    recordHit(startTime) {
        this.metrics.hits++;
        const responseTime = performance.now() - startTime;
        this.recordQuery(responseTime);
    }

    recordMiss() {
        this.metrics.misses++;
    }

    recordQuery(responseTime) {
        this.metrics.queries++;
        this.metrics.totalResponseTime += responseTime;
        this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.queries;

        // Save metrics periodically (every 10 queries)
        if (this.metrics.queries % 10 === 0) {
            this.saveMetrics();
        }
    }

    saveMetrics() {
        try {
            localStorage.setItem('cache_metrics', JSON.stringify(this.metrics));
        } catch (error) {
            // Metrics are not critical, ignore errors
        }
    }

    loadMetrics() {
        try {
            const saved = localStorage.getItem('cache_metrics');
            if (saved) {
                this.metrics = { ...this.metrics, ...JSON.parse(saved) };
            }
        } catch (error) {
            // Ignore errors
        }
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.FirebaseCacheManager = FirebaseCacheManager;

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cacheManager = new FirebaseCacheManager();
            console.log('[CacheManager] Global instance created: window.cacheManager');
        });
    } else {
        window.cacheManager = new FirebaseCacheManager();
        console.log('[CacheManager] Global instance created: window.cacheManager');
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseCacheManager;
}
