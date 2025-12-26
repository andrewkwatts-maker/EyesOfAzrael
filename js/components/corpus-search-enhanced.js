/**
 * Enhanced Corpus Search Component
 * Adds performance optimizations, caching, and keyboard accessibility
 */

// Import base class
// This file extends corpus-search.js with enhancements

class EnhancedCorpusSearch extends CorpusSearch {
    constructor(firestoreInstance) {
        super(firestoreInstance);

        // Enhanced caching with IndexedDB
        this.persistentCache = null;
        this.initPersistentCache();

        // Search history
        this.searchHistory = this.loadSearchHistory();
        this.maxHistorySize = 50;

        // Performance metrics
        this.metrics = {
            searches: 0,
            cacheHits: 0,
            averageTime: 0
        };
    }

    /**
     * Initialize IndexedDB for persistent caching
     */
    async initPersistentCache() {
        if (!window.indexedDB) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open('CorpusSearchCache', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.persistentCache = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('searches')) {
                    const store = db.createObjectStore('searches', { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * Enhanced search with persistent caching
     */
    async search(query, options = {}) {
        const startTime = performance.now();
        const cacheKey = this.getCacheKey(query, options);

        // Check persistent cache first
        if (this.persistentCache) {
            const cached = await this.getPersistentCache(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                this.metrics.cacheHits++;
                return cached.results;
            }
        }

        // Check memory cache
        if (this.searchCache.has(cacheKey)) {
            const cached = this.searchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                this.metrics.cacheHits++;
                return cached.results;
            }
        }

        // Perform search
        const results = await super.search(query, options);

        // Update metrics
        const duration = performance.now() - startTime;
        this.metrics.searches++;
        this.metrics.averageTime =
            (this.metrics.averageTime * (this.metrics.searches - 1) + duration) / this.metrics.searches;

        // Save to persistent cache
        if (this.persistentCache) {
            await this.setPersistentCache(cacheKey, results);
        }

        // Add to search history
        this.addToHistory(query, options, results.total);

        return results;
    }

    /**
     * Get from persistent cache
     */
    async getPersistentCache(key) {
        if (!this.persistentCache) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.persistentCache.transaction(['searches'], 'readonly');
            const store = transaction.objectStore('searches');
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }

    /**
     * Set persistent cache
     */
    async setPersistentCache(key, results) {
        if (!this.persistentCache) return;

        return new Promise((resolve, reject) => {
            const transaction = this.persistentCache.transaction(['searches'], 'readwrite');
            const store = transaction.objectStore('searches');
            const request = store.put({
                key,
                results,
                timestamp: Date.now()
            });

            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    }

    /**
     * Load search history from localStorage
     */
    loadSearchHistory() {
        try {
            const stored = localStorage.getItem('searchHistory');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Save search history to localStorage
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.warn('Could not save search history:', e);
        }
    }

    /**
     * Add to search history
     */
    addToHistory(query, options, resultCount) {
        const entry = {
            query,
            options,
            resultCount,
            timestamp: Date.now()
        };

        // Remove duplicates
        this.searchHistory = this.searchHistory.filter(h => h.query !== query);

        // Add to front
        this.searchHistory.unshift(entry);

        // Trim to max size
        if (this.searchHistory.length > this.maxHistorySize) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }

        this.saveSearchHistory();
    }

    /**
     * Get search history
     */
    getHistory(limit = 10) {
        return this.searchHistory.slice(0, limit);
    }

    /**
     * Clear search history
     */
    clearHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    /**
     * Get popular searches
     */
    getPopularSearches(limit = 10) {
        const counts = {};
        this.searchHistory.forEach(entry => {
            const key = entry.query.toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([query, count]) => ({ query, count }));
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheHitRate: this.metrics.searches > 0
                ? (this.metrics.cacheHits / this.metrics.searches * 100).toFixed(2) + '%'
                : '0%',
            averageTime: this.metrics.averageTime.toFixed(2) + 'ms'
        };
    }

    /**
     * Prefetch popular entities
     */
    async prefetchPopularEntities() {
        const popular = [
            'zeus', 'odin', 'ra', 'shiva', 'buddha',
            'jesus', 'muhammad', 'krishna', 'thor', 'apollo'
        ];

        const prefetchPromises = popular.map(query =>
            this.search(query, { mode: 'generic', limit: 10 })
        );

        await Promise.all(prefetchPromises);
        console.log('Prefetched', popular.length, 'popular entities');
    }

    /**
     * Clear all caches
     */
    async clearAllCaches() {
        // Clear memory cache
        this.clearCache();

        // Clear persistent cache
        if (this.persistentCache) {
            return new Promise((resolve) => {
                const transaction = this.persistentCache.transaction(['searches'], 'readwrite');
                const store = transaction.objectStore('searches');
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
            });
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedCorpusSearch;
}
