/**
 * History Manager Module
 * Manages navigation history and browser history state
 *
 * Usage:
 *   HistoryManager.add('/mythology/greek');
 *   HistoryManager.back();
 *   const history = HistoryManager.getAll();
 */

const HistoryManager = {
    _history: [],
    _maxHistory: 50,
    _currentIndex: -1,

    /**
     * Add a route to the navigation history
     * @param {string} path - Route path to add
     * @param {Object} metadata - Additional metadata (title, scrollPosition, etc.)
     */
    add(path, metadata = {}) {
        const entry = {
            path,
            timestamp: Date.now(),
            ...metadata
        };

        this._history.push(entry);

        // Trim history if it exceeds max
        if (this._history.length > this._maxHistory) {
            this._history = this._history.slice(-this._maxHistory);
        }

        this._currentIndex = this._history.length - 1;
    },

    /**
     * Get all history entries
     * @returns {Array} History entries
     */
    getAll() {
        return [...this._history];
    },

    /**
     * Get recent history entries
     * @param {number} count - Number of entries to retrieve
     * @returns {Array} Recent history entries
     */
    getRecent(count = 10) {
        return this._history.slice(-count);
    },

    /**
     * Get the current history entry
     * @returns {Object|null} Current entry or null
     */
    getCurrent() {
        return this._history[this._currentIndex] || null;
    },

    /**
     * Get the previous history entry
     * @returns {Object|null} Previous entry or null
     */
    getPrevious() {
        if (this._currentIndex > 0) {
            return this._history[this._currentIndex - 1];
        }
        return null;
    },

    /**
     * Navigate back in browser history
     */
    back() {
        window.history.back();
    },

    /**
     * Navigate forward in browser history
     */
    forward() {
        window.history.forward();
    },

    /**
     * Navigate to a specific history index
     * @param {number} delta - Number of steps to go (negative for back)
     */
    go(delta) {
        window.history.go(delta);
    },

    /**
     * Push a new state to browser history
     * @param {string} path - Route path
     * @param {Object} state - State object to store
     * @param {string} title - Document title (mostly ignored by browsers)
     */
    pushState(path, state = {}, title = '') {
        const fullState = {
            ...state,
            timestamp: Date.now(),
            scrollPosition: { x: window.scrollX, y: window.scrollY }
        };

        if (!path.startsWith('#')) {
            path = '#' + path;
        }

        window.history.pushState(fullState, title, path);
    },

    /**
     * Replace current state in browser history
     * @param {string} path - Route path
     * @param {Object} state - State object to store
     * @param {string} title - Document title
     */
    replaceState(path, state = {}, title = '') {
        const fullState = {
            ...state,
            timestamp: Date.now(),
            scrollPosition: state.scrollPosition || { x: window.scrollX, y: window.scrollY }
        };

        window.history.replaceState(fullState, title, path || window.location.hash);
    },

    /**
     * Get the current browser history state
     * @returns {Object|null} Current state or null
     */
    getState() {
        return window.history.state;
    },

    /**
     * Get scroll position from history state
     * @returns {Object} Scroll position {x, y}
     */
    getScrollPosition() {
        const state = window.history.state;
        return state?.scrollPosition || { x: 0, y: 0 };
    },

    /**
     * Clear internal history (not browser history)
     */
    clear() {
        this._history = [];
        this._currentIndex = -1;
    },

    /**
     * Check if we can go back
     * @returns {boolean} True if back navigation is possible
     */
    canGoBack() {
        return this._history.length > 1 && this._currentIndex > 0;
    },

    /**
     * Check if we can go forward
     * @returns {boolean} True if forward navigation is possible
     */
    canGoForward() {
        return this._currentIndex < this._history.length - 1;
    },

    /**
     * Get history length
     * @returns {number} Number of history entries
     */
    get length() {
        return this._history.length;
    },

    /**
     * Search history for paths matching a pattern
     * @param {string|RegExp} pattern - Pattern to search for
     * @returns {Array} Matching history entries
     */
    search(pattern) {
        const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
        return this._history.filter(entry => regex.test(entry.path));
    },

    /**
     * Get frequently visited routes
     * @param {number} limit - Number of routes to return
     * @returns {Array} Routes sorted by visit frequency
     */
    getFrequent(limit = 5) {
        const counts = {};
        for (const entry of this._history) {
            counts[entry.path] = (counts[entry.path] || 0) + 1;
        }

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([path, count]) => ({ path, count }));
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}

// Export to window for browser usage
window.HistoryManager = HistoryManager;
