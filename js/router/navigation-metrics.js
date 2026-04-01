/**
 * Navigation Metrics Module
 * Tracks performance timing data for navigation events
 *
 * Usage:
 *   const metric = NavigationMetrics.startNavigation('/path');
 *   NavigationMetrics.recordPhase(metric, 'authCheck');
 *   NavigationMetrics.finishNavigation(metric);
 */

window.NavigationMetrics = {
    _metrics: [],
    _maxMetrics: 100,
    _failedRoutes: [],

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
     * Get routes that exceeded a given time threshold
     * @param {number} thresholdMs - Threshold in milliseconds
     * @returns {Array} Metrics for routes exceeding the threshold
     */
    getSlowRoutes(thresholdMs = 2000) {
        return this._metrics.filter(m => (m.totalTime || 0) >= thresholdMs);
    },

    /**
     * Record a navigation error for a route
     * @param {string} route - The route that failed
     * @param {Error|string} error - The error that occurred
     */
    recordError(route, error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this._failedRoutes.push({
            route,
            error: errorMessage,
            timestamp: Date.now()
        });
    },

    /**
     * Get all failed routes
     * @returns {Array} Copy of failed routes array
     */
    getFailedRoutes() {
        return [...this._failedRoutes];
    },

    /**
     * Get a health report summarising navigation metrics
     * @param {number} slowThresholdMs - Threshold in ms to classify a navigation as slow (default 2000)
     * @returns {Object} Health report
     */
    getHealthReport(slowThresholdMs = 2000) {
        const metrics = this._metrics;
        const failedRoutes = this._failedRoutes;

        const totalNavigations = metrics.length;
        const averageTimeMs = totalNavigations > 0
            ? metrics.reduce((sum, m) => sum + (m.totalTime || 0), 0) / totalNavigations
            : 0;

        const slowRoutes = metrics.filter(m => (m.totalTime || 0) >= slowThresholdMs);
        const slowRouteCount = slowRoutes.length;
        const failedRouteCount = failedRoutes.length;

        const healthy = failedRouteCount === 0 && slowRouteCount < 3;

        return {
            totalNavigations,
            averageTimeMs,
            slowRouteCount,
            failedRouteCount,
            slowRoutes: slowRoutes.map(m => ({ route: m.route, totalTime: m.totalTime })),
            recentErrors: failedRoutes.slice(-5),
            recentNavigations: metrics.slice(-5).map(m => ({ route: m.route, totalTime: m.totalTime })),
            healthy
        };
    },

    /**
     * Clear all metrics
     */
    clear() {
        this._metrics = [];
        this._failedRoutes = [];
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NavigationMetrics;
}
