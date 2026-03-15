/**
 * Scroll Manager Module
 * Saves and restores scroll positions for navigation history
 *
 * Usage:
 *   ScrollManager.save('/current-path');
 *   // ... navigate to new page ...
 *   ScrollManager.restore('/previous-path', true); // smooth scroll
 */

window.ScrollManager = {
    _positions: new Map(),
    _maxEntries: 50,

    /**
     * Save current scroll position for a path
     * @param {string} path - The path to save position for
     */
    save(path) {
        this._positions.set(path, {
            x: window.scrollX,
            y: window.scrollY,
            timestamp: Date.now()
        });

        // Enforce LRU limit
        if (this._positions.size > this._maxEntries) {
            const oldestKey = this._positions.keys().next().value;
            this._positions.delete(oldestKey);
        }
    },

    /**
     * Restore scroll position for a path
     * @param {string} path - The path to restore position for
     * @param {boolean} smooth - Whether to use smooth scrolling
     * @returns {boolean} Whether position was restored
     */
    restore(path, smooth = false) {
        const position = this._positions.get(path);
        if (position) {
            window.scrollTo({
                top: position.y,
                left: position.x,
                behavior: smooth ? 'smooth' : 'instant'
            });
            return true;
        }
        return false;
    },

    /**
     * Get saved position for a path
     * @param {string} path - The path to get position for
     * @returns {Object|null} Position object or null
     */
    get(path) {
        return this._positions.get(path) || null;
    },

    /**
     * Check if position exists for path
     * @param {string} path - The path to check
     * @returns {boolean}
     */
    has(path) {
        return this._positions.has(path);
    },

    /**
     * Clear all saved positions
     */
    clear() {
        this._positions.clear();
    },

    /**
     * Remove position for specific path
     * @param {string} path - The path to remove
     */
    remove(path) {
        this._positions.delete(path);
    },

    /**
     * Scroll to top of page
     * @param {boolean} smooth - Whether to use smooth scrolling
     */
    scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: smooth ? 'smooth' : 'instant'
        });
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ScrollManager;
}
