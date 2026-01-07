/**
 * Firebase Cache Manager
 * Intelligent multi-layer caching system for Firebase queries
 *
 * Features:
 * - Memory cache (fastest, session lifetime)
 * - SessionStorage cache (tab lifetime)
 * - LocalStorage cache (persistent)
 * - TTL-based expiration
 * - Smart cache invalidation with dependency tracking
 * - Performance metrics
 * - Automatic cache warming
 * - Offline support with stale data fallback
 * - CRUD integration for automatic invalidation
 * - Cache versioning for schema changes
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

        // Cache version for schema migrations
        this.CACHE_VERSION = '2.0.0';

        // Memory cache (fastest, cleared on page reload)
        this.memoryCache = new Map();

        // Cache dependency tracking for smart invalidation
        this.cacheDependencies = new Map();

        // Invalidation listeners
        this.invalidationListeners = new Set();

        // Default TTL values (milliseconds)
        this.defaultTTL = {
            mythologies: 86400000,    // 24 hours - static content
            metadata: 3600000,        // 1 hour - counts/stats
            entities: 300000,         // 5 minutes - entity details
            lists: 600000,            // 10 minutes - entity lists
            search: 604800000,        // 7 days - search index
            pages: 3600000,           // 1 hour - page content (home, etc.)
            deities: 1800000,         // 30 minutes - deity lists
            heroes: 1800000,          // 30 minutes - hero lists
            creatures: 1800000,       // 30 minutes - creature lists
            items: 1800000,           // 30 minutes - item lists
            places: 1800000,          // 30 minutes - place lists
            texts: 1800000,           // 30 minutes - text lists
            rituals: 1800000,         // 30 minutes - ritual lists
            herbs: 1800000,           // 30 minutes - herb lists
            archetypes: 1800000,      // 30 minutes - archetype lists
            symbols: 1800000,         // 30 minutes - symbol lists
            magic: 1800000,           // 30 minutes - magic lists
            concepts: 1800000,        // 30 minutes - concept lists
            notes: 300000,            // 5 minutes - user notes
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
            totalResponseTime: 0,
            staleFallbacks: 0,
            cacheWarms: 0
        };

        // Load metrics from storage
        this.loadMetrics();

        // Check and migrate cache version
        this.checkCacheVersion();

        // Setup CRUD event listeners for automatic invalidation
        this.setupCRUDListeners();

        console.log('[CacheManager] Initialized with default TTLs:', this.defaultTTL);
    }

    /**
     * Check cache version and clear if outdated
     */
    checkCacheVersion() {
        try {
            const storedVersion = localStorage.getItem('cache_version');
            if (storedVersion !== this.CACHE_VERSION) {
                console.log(`[CacheManager] Cache version mismatch (${storedVersion} -> ${this.CACHE_VERSION}), clearing cache`);
                this.clearAll();
                localStorage.setItem('cache_version', this.CACHE_VERSION);
            }
        } catch (error) {
            console.warn('[CacheManager] Version check failed:', error);
        }
    }

    /**
     * Setup listeners for CRUD events to auto-invalidate cache
     */
    setupCRUDListeners() {
        if (typeof window !== 'undefined') {
            window.addEventListener('crud:success', (event) => {
                const { type, collection, entityId } = event.detail;

                // Auto-invalidate on CRUD operations
                if (['create', 'update', 'delete'].includes(type)) {
                    this.invalidate(collection, entityId);

                    // Also invalidate related list caches
                    this.invalidateListCaches(collection);
                }
            });

            console.log('[CacheManager] CRUD listeners registered');
        }
    }

    /**
     * Invalidate all list caches for a collection
     * @param {string} collection - Collection name
     */
    invalidateListCaches(collection) {
        const listPrefix = `cache_list_${collection}_`;

        // Clear from memory
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(listPrefix)) {
                this.memoryCache.delete(key);
            }
        }

        // Clear from storage
        this.clearStorageByPrefix(sessionStorage, listPrefix);
        this.clearStorageByPrefix(localStorage, listPrefix);

        console.log(`[CacheManager] Invalidated list caches for: ${collection}`);
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
                    console.log(`[CacheManager] =� Memory hit: ${cacheKey}`);
                    return memoryData.data;
                }

                // 2. Check sessionStorage (tab lifetime)
                const sessionData = this.getFromSessionStorage(cacheKey);
                if (sessionData && !this.isExpired(sessionData, ttl)) {
                    // Promote to memory cache
                    this.memoryCache.set(cacheKey, sessionData);
                    this.recordHit(startTime);
                    console.log(`[CacheManager] =� Session hit: ${cacheKey}`);
                    return sessionData.data;
                }

                // 3. Check localStorage (persistent)
                const localData = this.getFromLocalStorage(cacheKey);
                if (localData && !this.isExpired(localData, ttl)) {
                    // Promote to memory and session cache
                    this.memoryCache.set(cacheKey, localData);
                    this.setToSessionStorage(cacheKey, localData);
                    this.recordHit(startTime);
                    console.log(`[CacheManager] =� Local hit: ${cacheKey}`);
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
            console.log(`[CacheManager] =� Cached: ${cacheKey} (TTL: ${ttl}ms)`);

        } catch (error) {
            console.error(`[CacheManager] Error caching ${cacheKey}:`, error);
        }
    }

    /**
     * Invalidate cached data with dependency cascade
     * @param {string} collection - Collection name
     * @param {string} id - Document ID (optional, invalidates all if omitted)
     * @param {Object} options - Invalidation options
     * @returns {Array<string>} Invalidated cache keys
     */
    invalidate(collection, id = null, options = {}) {
        const invalidatedKeys = [];

        if (id) {
            // Invalidate specific document
            const cacheKey = this.generateKey(collection, id);
            this.memoryCache.delete(cacheKey);
            sessionStorage.removeItem(cacheKey);
            localStorage.removeItem(cacheKey);
            invalidatedKeys.push(cacheKey);
            console.log(`[CacheManager] Invalidated: ${cacheKey}`);

            // Invalidate dependent caches
            if (options.cascade !== false) {
                const dependents = this.cacheDependencies.get(cacheKey) || new Set();
                for (const depKey of dependents) {
                    this.memoryCache.delete(depKey);
                    sessionStorage.removeItem(depKey);
                    localStorage.removeItem(depKey);
                    invalidatedKeys.push(depKey);
                }
                if (dependents.size > 0) {
                    console.log(`[CacheManager] Cascade invalidated ${dependents.size} dependent caches`);
                }
            }
        } else {
            // Invalidate entire collection
            const prefix = `cache_${collection}_`;

            // Clear from memory
            for (const key of this.memoryCache.keys()) {
                if (key.startsWith(prefix)) {
                    this.memoryCache.delete(key);
                    invalidatedKeys.push(key);
                }
            }

            // Clear from sessionStorage
            this.clearStorageByPrefix(sessionStorage, prefix);

            // Clear from localStorage
            this.clearStorageByPrefix(localStorage, prefix);

            console.log(`[CacheManager] Invalidated collection: ${collection}`);
        }

        this.metrics.invalidations++;

        // Notify invalidation listeners
        this.notifyInvalidationListeners(collection, id, invalidatedKeys);

        return invalidatedKeys;
    }

    /**
     * Add a cache dependency (when A changes, invalidate B)
     * @param {string} sourceKey - Source cache key
     * @param {string} dependentKey - Dependent cache key to invalidate
     */
    addDependency(sourceKey, dependentKey) {
        if (!this.cacheDependencies.has(sourceKey)) {
            this.cacheDependencies.set(sourceKey, new Set());
        }
        this.cacheDependencies.get(sourceKey).add(dependentKey);
    }

    /**
     * Remove a cache dependency
     * @param {string} sourceKey - Source cache key
     * @param {string} dependentKey - Dependent cache key
     */
    removeDependency(sourceKey, dependentKey) {
        const deps = this.cacheDependencies.get(sourceKey);
        if (deps) {
            deps.delete(dependentKey);
            if (deps.size === 0) {
                this.cacheDependencies.delete(sourceKey);
            }
        }
    }

    /**
     * Subscribe to cache invalidation events
     * @param {Function} callback - Callback function (collection, id, keys)
     * @returns {Function} Unsubscribe function
     */
    onInvalidate(callback) {
        this.invalidationListeners.add(callback);
        return () => this.invalidationListeners.delete(callback);
    }

    /**
     * Notify invalidation listeners
     */
    notifyInvalidationListeners(collection, id, keys) {
        for (const callback of this.invalidationListeners) {
            try {
                callback({ collection, id, keys, timestamp: Date.now() });
            } catch (error) {
                console.error('[CacheManager] Invalidation listener error:', error);
            }
        }
    }

    /**
     * Batch invalidate multiple items
     * @param {Array<{collection: string, id?: string}>} items - Items to invalidate
     * @returns {Array<string>} All invalidated keys
     */
    batchInvalidate(items) {
        const allInvalidated = [];

        for (const item of items) {
            const keys = this.invalidate(item.collection, item.id, { cascade: false });
            allInvalidated.push(...keys);
        }

        console.log(`[CacheManager] Batch invalidated ${allInvalidated.length} cache entries`);
        return allInvalidated;
    }

    /**
     * Invalidate caches matching a pattern
     * @param {RegExp|string} pattern - Pattern to match cache keys
     * @returns {number} Number of invalidated entries
     */
    invalidateByPattern(pattern) {
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        let count = 0;

        // Clear from memory
        for (const key of this.memoryCache.keys()) {
            if (regex.test(key)) {
                this.memoryCache.delete(key);
                count++;
            }
        }

        // Clear from sessionStorage
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && regex.test(key)) {
                sessionStorage.removeItem(key);
                count++;
            }
        }

        // Clear from localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && regex.test(key)) {
                localStorage.removeItem(key);
                count++;
            }
        }

        this.metrics.invalidations++;
        console.log(`[CacheManager] Invalidated ${count} entries matching pattern: ${pattern}`);
        return count;
    }

    /**
     * Stale-while-revalidate pattern - return stale data while fetching fresh
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {Object} options - Options including onFreshData callback
     * @returns {Promise<Object|null>} Cached data (possibly stale)
     */
    async getWithRevalidate(collection, id, options = {}) {
        const cacheKey = this.generateKey(collection, id);

        // Get cached data (even if stale)
        const cached = this.getFromMemory(cacheKey) ||
                      this.getFromSessionStorage(cacheKey) ||
                      this.getFromLocalStorage(cacheKey);

        // If we have cached data, return it immediately
        if (cached && cached.data) {
            // Check if stale
            const isStale = this.isExpired(cached, options.ttl || this.getDefaultTTL(collection));

            if (isStale) {
                // Revalidate in background
                this.fetchFromFirebase(collection, id)
                    .then(freshData => {
                        if (freshData) {
                            this.set(collection, id, freshData, options);
                            if (options.onFreshData) {
                                options.onFreshData(freshData);
                            }
                        }
                    })
                    .catch(err => console.warn('[CacheManager] Background revalidation failed:', err));

                this.metrics.staleFallbacks++;
            }

            return cached.data;
        }

        // No cached data, fetch fresh
        return this.get(collection, id, options);
    }


    /**
     * Clear all caches
     */
    clearAll() {
        this.memoryCache.clear();
        this.cacheDependencies.clear();

        // Clear cache entries from storage (keep metrics)
        this.clearStorageByPrefix(sessionStorage, 'cache_');
        this.clearStorageByPrefix(localStorage, 'cache_');

        console.log('[CacheManager] All caches cleared');
    }

    /**
     * Destroy cache manager and cleanup
     */
    destroy() {
        this.clearAll();
        this.invalidationListeners.clear();
        this.saveMetrics();
        console.log('[CacheManager] Destroyed');
    }

    /**
     * Check if browser is online
     * @returns {boolean}
     */
    isOnline() {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    /**
     * Fetch data from Firebase with offline fallback
     */
    async fetchFromFirebase(collection, id) {
        if (!this.db) {
            throw new Error('Firebase Firestore not initialized');
        }

        const cacheKey = this.generateKey(collection, id);

        try {
            const doc = await this.db.collection(collection).doc(id).get();

            if (!doc.exists) {
                return null;
            }

            return { id: doc.id, ...doc.data() };

        } catch (error) {
            console.error(`[CacheManager] Firebase fetch error (${collection}/${id}):`, error);

            // If offline, try to return stale cache data
            if (!this.isOnline() || error.code === 'unavailable') {
                console.log(`[CacheManager] Offline - attempting to serve stale cache for: ${cacheKey}`);

                // Try all cache layers even if expired
                const staleData = this.getFromMemory(cacheKey) ||
                                  this.getFromSessionStorage(cacheKey) ||
                                  this.getFromLocalStorage(cacheKey);

                if (staleData && staleData.data) {
                    console.log(`[CacheManager] Serving stale cache for: ${cacheKey}`);
                    return staleData.data;
                }
            }

            throw error;
        }
    }

    /**
     * Fetch list from Firebase with caching
     */
    async getList(collection, filters = {}, options = {}) {
        const cacheKey = this.generateListKey(collection, filters, options);
        const ttl = options.ttl || this.defaultTTL[collection] || this.defaultTTL.lists;
        const forceRefresh = options.forceRefresh || false;

        try {
            // Check cache (all layers)
            if (!forceRefresh) {
                // Check memory first (fastest)
                let cached = this.getFromMemory(cacheKey);
                let cacheSource = 'memory';

                // Try sessionStorage if not in memory
                if (!cached || this.isExpired(cached, ttl)) {
                    cached = this.getFromSessionStorage(cacheKey);
                    cacheSource = 'session';
                }

                // Try localStorage if not in session
                if (!cached || this.isExpired(cached, ttl)) {
                    cached = this.getFromLocalStorage(cacheKey);
                    cacheSource = 'local';
                }

                if (cached && !this.isExpired(cached, ttl)) {
                    // Promote to faster cache layers
                    if (cacheSource === 'local') {
                        this.memoryCache.set(cacheKey, cached);
                        this.setToSessionStorage(cacheKey, cached);
                    } else if (cacheSource === 'session') {
                        this.memoryCache.set(cacheKey, cached);
                    }
                    this.recordHit(performance.now());
                    console.log(`[CacheManager] List cache hit (${cacheSource}): ${cacheKey}`);
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
            // Also persist to localStorage for cross-session caching
            this.setToLocalStorage(cacheKey, cacheEntry);

            const responseTime = performance.now() - startTime;
            this.recordQuery(responseTime);
            console.log(`[CacheManager]  List fetched: ${cacheKey} (${data.length} items, ${responseTime.toFixed(2)}ms)`);

            return data;

        } catch (error) {
            console.error(`[CacheManager] Error fetching list ${cacheKey}:`, error);

            // If offline, try to return stale cache data
            if (!this.isOnline() || error.code === 'unavailable') {
                console.log(`[CacheManager] Offline - attempting to serve stale list cache for: ${cacheKey}`);

                // Try all cache layers even if expired
                const staleData = this.getFromMemory(cacheKey) ||
                                  this.getFromSessionStorage(cacheKey) ||
                                  this.getFromLocalStorage(cacheKey);

                if (staleData && staleData.data) {
                    console.log(`[CacheManager] Serving stale list cache for: ${cacheKey} (${staleData.data.length} items)`);
                    return staleData.data;
                }
            }

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

            // If offline, try to return stale cache data
            if (!this.isOnline() || error.code === 'unavailable') {
                const staleData = this.getFromMemory(cacheKey) ||
                                  this.getFromLocalStorage(cacheKey);

                if (staleData && staleData.data) {
                    console.log(`[CacheManager] Serving stale metadata for: ${cacheKey}`);
                    return staleData.data;
                }
            }

            return null;
        }
    }

    /**
     * Warm cache for frequently accessed data
     */
    async warmCache() {
        console.log('[CacheManager] Warming cache...');

        try {
            // Warm mythology list
            const mythologies = await this.getList('mythologies', {}, {
                ttl: this.defaultTTL.mythologies,
                orderBy: 'order asc',
                limit: 50
            });
            console.log(`[CacheManager] Cached ${mythologies.length} mythologies`);

            // Warm metadata
            const metadata = await this.getMetadata('mythology_counts');
            console.log(`[CacheManager] Cached mythology metadata`);

            console.log('[CacheManager] Cache warming complete');

        } catch (error) {
            console.error('[CacheManager] Error warming cache:', error);
        }
    }

    /**
     * Prefetch home page data for faster initial load
     * Call this early in the app lifecycle
     */
    async prefetchHomeData() {
        console.log('[CacheManager] Prefetching home page data...');

        try {
            const promises = [];

            // Prefetch mythologies (primary home content)
            promises.push(
                this.getList('mythologies', {}, {
                    ttl: this.defaultTTL.mythologies,
                    orderBy: 'order asc',
                    limit: 50
                }).catch(err => {
                    console.warn('[CacheManager] Failed to prefetch mythologies:', err);
                    return [];
                })
            );

            // Prefetch home page config if using PageAssetRenderer
            promises.push(
                this.get('pages', 'home', { ttl: this.defaultTTL.pages }).catch(err => {
                    console.warn('[CacheManager] Failed to prefetch home page config:', err);
                    return null;
                })
            );

            const results = await Promise.all(promises);
            const [mythologies, homeConfig] = results;

            console.log(`[CacheManager] Prefetch complete: ${mythologies?.length || 0} mythologies, home config: ${homeConfig ? 'loaded' : 'not found'}`);

            return { mythologies, homeConfig };

        } catch (error) {
            console.error('[CacheManager] Error prefetching home data:', error);
            return { mythologies: [], homeConfig: null };
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
        console.log('[CacheManager] Performance Statistics:');
        console.log(`  Cache Hits: ${stats.hits} (${stats.hitRate})`);
        console.log(`  Cache Misses: ${stats.misses}`);
        console.log(`  Cache Sets: ${stats.sets}`);
        console.log(`  Invalidations: ${stats.invalidations}`);
        console.log(`  Firebase Queries: ${stats.queries}`);
        console.log(`  Avg Response Time: ${stats.avgResponseTime}`);
        console.log(`  Memory Cache Size: ${stats.memoryCacheSize} entries`);
    }

    /**
     * Clear all stale/expired entries from storage
     * Useful for maintenance and freeing up storage space
     */
    clearStaleEntries() {
        let clearedCount = 0;
        const now = Date.now();

        // Clear stale memory cache entries
        for (const [key, entry] of this.memoryCache.entries()) {
            if (this.isExpired(entry, 0)) {
                this.memoryCache.delete(key);
                clearedCount++;
            }
        }

        // Clear stale sessionStorage entries
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('cache_')) {
                try {
                    const entry = JSON.parse(sessionStorage.getItem(key));
                    if (this.isExpired(entry, 0)) {
                        sessionKeysToRemove.push(key);
                    }
                } catch (e) {
                    // Invalid entry, remove it
                    sessionKeysToRemove.push(key);
                }
            }
        }
        sessionKeysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
            clearedCount++;
        });

        // Clear stale localStorage entries
        const localKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_') && key !== 'cache_metrics') {
                try {
                    const entry = JSON.parse(localStorage.getItem(key));
                    if (this.isExpired(entry, 0)) {
                        localKeysToRemove.push(key);
                    }
                } catch (e) {
                    // Invalid entry, remove it
                    localKeysToRemove.push(key);
                }
            }
        }
        localKeysToRemove.forEach(key => {
            localStorage.removeItem(key);
            clearedCount++;
        });

        console.log(`[CacheManager] Cleared ${clearedCount} stale entries`);
        return clearedCount;
    }

    /**
     * Get cache health information
     * Useful for debugging and monitoring
     */
    getCacheHealth() {
        const now = Date.now();
        let totalEntries = 0;
        let expiredEntries = 0;
        let freshEntries = 0;
        let totalSize = 0;

        // Analyze memory cache
        for (const [key, entry] of this.memoryCache.entries()) {
            totalEntries++;
            if (this.isExpired(entry, 0)) {
                expiredEntries++;
            } else {
                freshEntries++;
            }
        }

        // Estimate localStorage usage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_')) {
                const value = localStorage.getItem(key);
                if (value) {
                    totalSize += value.length * 2; // UTF-16 = 2 bytes per char
                }
            }
        }

        return {
            memoryEntries: this.memoryCache.size,
            totalEntries,
            freshEntries,
            expiredEntries,
            storageSizeBytes: totalSize,
            storageSizeKB: (totalSize / 1024).toFixed(2) + ' KB',
            hitRate: this.getStats().hitRate,
            healthy: expiredEntries < totalEntries * 0.5 // Healthy if less than 50% expired
        };
    }

    // ==================== HELPER METHODS ====================

    generateKey(collection, id) {
        return `cache_${collection}_${id}`;
    }

    generateListKey(collection, filters, options = {}) {
        const filterStr = Object.entries(filters)
            .sort()
            .map(([k, v]) => `${k}:${v}`)
            .join('_');
        // Include orderBy and limit in cache key to prevent cache collisions
        const orderBy = options.orderBy || 'default';
        const limit = options.limit || 20;
        return `cache_list_${collection}_${filterStr}_${orderBy}_${limit}`;
    }

    getDefaultTTL(collection) {
        return this.defaultTTL[collection] || this.defaultTTL.temporary;
    }

    isExpired(cacheEntry, fallbackTTL) {
        if (!cacheEntry || !cacheEntry.timestamp) return true;
        const age = Date.now() - cacheEntry.timestamp;
        // Use the stored TTL from the cache entry if available,
        // otherwise fall back to the provided TTL
        const ttl = cacheEntry.ttl || fallbackTTL;
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
        // Note: We don't record cache hit times to query metrics
        // because they skew the average Firebase response time.
        // Cache hits are essentially instant (<1ms) and shouldn't
        // be counted as "queries" to Firebase.
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
