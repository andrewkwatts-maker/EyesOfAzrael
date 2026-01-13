/**
 * Navigation Metrics Module
 * Tracks performance timing data for navigation events
 *
 * Usage:
 *   const metric = NavigationMetrics.startNavigation('/path');
 *   NavigationMetrics.recordPhase(metric, 'authCheck');
 *   NavigationMetrics.finishNavigation(metric);
 */

const NavigationMetrics = {
    _metrics: [],
    _maxMetrics: 100,

    /**
     * Start tracking a navigation event
     * @param {string} route - The route being navigated to
     * @returns {Object} Metric object to track phases
     */
    startNavigation(route) {
        return {
            route,
            startTime: performance.now(),
            phases: {},
            timestamp: null,
            totalTime: null
        };
    },

    /**
     * Record a phase of the navigation
     * @param {Object} metric - Metric object from startNavigation
     * @param {string} phaseName - Name of the phase
     */
    recordPhase(metric, phaseName) {
        if (!metric) return;
        metric.phases[phaseName] = performance.now() - metric.startTime;
    },

    /**
     * Finish tracking a navigation event
     * @param {Object} metric - Metric object from startNavigation
     */
    finishNavigation(metric) {
        if (!metric) return;

        metric.totalTime = performance.now() - metric.startTime;
        metric.timestamp = Date.now();
        this._metrics.push(metric);

        // Keep only the last N metrics
        if (this._metrics.length > this._maxMetrics) {
            this._metrics = this._metrics.slice(-this._maxMetrics);
        }

        // Dispatch event for external monitoring
        document.dispatchEvent(new CustomEvent('navigation-complete', {
            detail: metric
        }));

        // Log for debugging
        if (window.DEBUG_NAVIGATION) {
            console.log('[NavigationMetrics]', metric);
        }
    },

    /**
     * Get all recorded metrics
     * @returns {Array} Copy of metrics array
     */
    getMetrics() {
        return [...this._metrics];
    },

    /**
     * Get average navigation time
     * @returns {number} Average time in milliseconds
     */
    getAverageTime() {
        if (this._metrics.length === 0) return 0;
        const total = this._metrics.reduce((sum, m) => sum + m.totalTime, 0);
        return total / this._metrics.length;
    },

    /**
     * Clear all metrics
     */
    clear() {
        this._metrics = [];
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationMetrics;
}

// Export to window for browser usage
window.NavigationMetrics = NavigationMetrics;
