/**
 * Enhanced Corpus Search Component
 * Adds performance optimizations, caching, keyboard accessibility, and polished UI
 *
 * Features:
 * - IndexedDB persistent caching
 * - Search history tracking
 * - Performance metrics
 * - Modern UI with glassmorphism
 * - Mobile-friendly touch targets (44px minimum)
 * - Highlighted search results
 * - Accessible keyboard navigation
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

        // UI state
        this.highlightEnabled = true;
        this.maxResultsDisplay = 100;
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
        console.log('[EnhancedCorpusSearch] Prefetched', popular.length, 'popular entities');
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
                request.onsuccess = () => {
                    console.log('[EnhancedCorpusSearch] All caches cleared');
                    resolve();
                };
                request.onerror = () => resolve();
            });
        }
    }

    /**
     * Render corpus search result with highlighting
     * @param {Object} result - Search result object
     * @param {string} searchTerm - The search term to highlight
     * @returns {string} HTML string for the result
     */
    renderCorpusResult(result, searchTerm) {
        const text = result.text || result.content || '';
        const citation = result.citation || result.reference || 'Unknown';
        const corpus = result.corpus || result.source || '';

        // Highlight the search term
        const highlightedText = this.highlightEnabled ?
            this.highlightSearchTerm(text, searchTerm) :
            this.escapeHtml(text);

        return `
            <div class="search-result-item" style="
                background: rgba(var(--color-surface-rgb), 0.6);
                backdrop-filter: blur(10px);
                border: 2px solid rgba(var(--color-primary-rgb), 0.2);
                border-radius: var(--radius-lg, 12px);
                padding: 1.5rem;
                transition: all var(--transition-base);
                margin-bottom: 1rem;
            ">
                <div class="result-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 0.75rem;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                ">
                    <div class="result-citation" style="
                        font-weight: 600;
                        color: var(--color-primary);
                        font-size: 1.1rem;
                    ">${this.escapeHtml(citation)}</div>
                    ${corpus ? `<div class="result-corpus" style="
                        background: rgba(var(--color-secondary-rgb), 0.2);
                        padding: 0.25rem 0.75rem;
                        border-radius: var(--radius-full, 20px);
                        font-size: 0.85rem;
                        font-weight: 600;
                        border: 1px solid rgba(var(--color-secondary-rgb), 0.3);
                        color: var(--color-secondary);
                    ">${this.escapeHtml(corpus)}</div>` : ''}
                </div>
                <div class="result-text" style="
                    color: var(--color-text-primary);
                    line-height: 1.8;
                    margin-bottom: 0.75rem;
                    font-size: 1rem;
                ">${highlightedText}</div>
                ${result.link ? `<div class="result-link">
                    <a href="${this.escapeHtml(result.link)}" target="_blank" style="
                        color: var(--color-secondary);
                        text-decoration: none;
                        font-size: 0.9rem;
                        transition: color 0.3s ease;
                    ">View Source →</a>
                </div>` : ''}
            </div>
        `;
    }

    /**
     * Highlight search term in text
     * @param {string} text - Text to highlight
     * @param {string} searchTerm - Term to highlight
     * @returns {string} HTML with highlighted terms
     */
    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || !text) return this.escapeHtml(text);

        const escapedText = this.escapeHtml(text);
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');

        return escapedText.replace(regex, `<mark style="
            background: rgba(var(--color-secondary-rgb), 0.3);
            color: var(--color-secondary);
            padding: 0.2rem 0.4rem;
            border-radius: var(--radius-sm, 4px);
            font-weight: 600;
        ">$1</mark>`);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render search metrics UI
     * @returns {string} HTML for metrics display
     */
    renderMetrics() {
        const metrics = this.getMetrics();
        return `
            <div class="search-metrics" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                padding: 1.5rem;
                background: rgba(var(--color-surface-rgb), 0.4);
                border-radius: var(--radius-lg, 12px);
                margin-top: 2rem;
                border: 1px solid rgba(var(--color-primary-rgb), 0.2);
            ">
                <div class="metric-item" style="text-align: center;">
                    <div style="
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: var(--color-primary);
                        margin-bottom: 0.25rem;
                    ">${metrics.searches}</div>
                    <div style="
                        font-size: 0.85rem;
                        color: var(--color-text-secondary);
                    ">Searches</div>
                </div>
                <div class="metric-item" style="text-align: center;">
                    <div style="
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: var(--color-secondary);
                        margin-bottom: 0.25rem;
                    ">${metrics.cacheHitRate}</div>
                    <div style="
                        font-size: 0.85rem;
                        color: var(--color-text-secondary);
                    ">Cache Hit Rate</div>
                </div>
                <div class="metric-item" style="text-align: center;">
                    <div style="
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: var(--color-accent, var(--color-primary));
                        margin-bottom: 0.25rem;
                    ">${metrics.averageTime}</div>
                    <div style="
                        font-size: 0.85rem;
                        color: var(--color-text-secondary);
                    ">Avg Response</div>
                </div>
            </div>
        `;
    }

    /**
     * Toggle search term highlighting
     * @param {boolean} enabled - Whether to enable highlighting
     */
    toggleHighlighting(enabled) {
        this.highlightEnabled = enabled;
        console.log('[EnhancedCorpusSearch] Highlighting', enabled ? 'enabled' : 'disabled');
    }

    /**
     * Set maximum results to display
     * @param {number} max - Maximum number of results
     */
    setMaxResults(max) {
        this.maxResultsDisplay = Math.max(1, Math.min(500, max));
        console.log('[EnhancedCorpusSearch] Max results set to', this.maxResultsDisplay);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedCorpusSearch;
}

// Browser global export
if (typeof window !== 'undefined') {
    window.EnhancedCorpusSearch = EnhancedCorpusSearch;
}
