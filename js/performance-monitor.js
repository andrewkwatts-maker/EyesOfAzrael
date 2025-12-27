/**
 * Performance Monitor
 * Eyes of Azrael Real-Time Performance Tracking System
 *
 * Tracks and monitors:
 * - Navigation Timing API metrics
 * - Firebase query durations
 * - Time-to-interactive
 * - Time-to-first-render
 * - Script load times
 * - User interaction timing (login, etc.)
 * - Shader initialization
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            navigation: {},
            firebase: [],
            scripts: [],
            resources: [],
            interactions: [],
            custom: []
        };

        this.startTime = performance.now();
        this.observers = [];
        this.alerts = [];
        this.isRecording = true;

        // Performance thresholds (milliseconds)
        this.thresholds = {
            pageLoad: 3000,
            firebaseQuery: 1000,
            authTime: 2000,
            scriptLoad: 1500,
            timeToInteractive: 5000,
            firstContentfulPaint: 2000
        };

        // Initialize monitoring
        this.init();
    }

    /**
     * Initialize performance monitoring
     */
    init() {
        // Wait for page load to capture navigation timing
        if (document.readyState === 'complete') {
            this.captureNavigationTiming();
        } else {
            window.addEventListener('load', () => this.captureNavigationTiming());
        }

        // Set up performance observers
        this.setupPerformanceObservers();

        // Set up Firebase query interceptor
        this.setupFirebaseInterceptor();

        // Track time to interactive
        this.trackTimeToInteractive();

        // Track custom metrics
        this.setupCustomMetrics();

        console.log('[PerformanceMonitor] Initialized');
    }

    /**
     * Capture Navigation Timing API metrics
     */
    captureNavigationTiming() {
        if (!performance.timing) {
            console.warn('[PerformanceMonitor] Navigation Timing API not supported');
            return;
        }

        const timing = performance.timing;
        const navigation = performance.navigation;

        this.metrics.navigation = {
            // DNS lookup
            dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,

            // TCP connection
            tcpConnection: timing.connectEnd - timing.connectStart,

            // Request + Response
            serverResponse: timing.responseEnd - timing.requestStart,

            // DOM Processing
            domProcessing: timing.domComplete - timing.domLoading,

            // DOM Interactive
            domInteractive: timing.domInteractive - timing.navigationStart,

            // DOM Content Loaded
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,

            // Page Load (Full)
            pageLoad: timing.loadEventEnd - timing.navigationStart,

            // Time to First Byte
            ttfb: timing.responseStart - timing.navigationStart,

            // Navigation type
            navigationType: ['navigate', 'reload', 'back_forward', 'prerender'][navigation.type] || 'unknown',

            // Redirect count
            redirectCount: navigation.redirectCount
        };

        // Check for page load threshold alert
        if (this.metrics.navigation.pageLoad > this.thresholds.pageLoad) {
            this.addAlert('warning', `Page load time exceeded threshold: ${this.metrics.navigation.pageLoad}ms > ${this.thresholds.pageLoad}ms`);
        }

        console.log('[PerformanceMonitor] Navigation timing captured:', this.metrics.navigation);
    }

    /**
     * Set up Performance Observer for resources, paint timing, etc.
     */
    setupPerformanceObservers() {
        // Observe resource timing (scripts, stylesheets, images)
        if (window.PerformanceObserver) {
            try {
                // Resource timing observer
                const resourceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordResourceTiming(entry);
                    }
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);

                // Paint timing observer (FCP, FP)
                const paintObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordPaintTiming(entry);
                    }
                });
                paintObserver.observe({ entryTypes: ['paint'] });
                this.observers.push(paintObserver);

                // Measure timing observer
                const measureObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordCustomTiming(entry);
                    }
                });
                measureObserver.observe({ entryTypes: ['measure'] });
                this.observers.push(measureObserver);

            } catch (error) {
                console.warn('[PerformanceMonitor] Performance Observer setup failed:', error);
            }
        }
    }

    /**
     * Record resource timing (scripts, CSS, images)
     */
    recordResourceTiming(entry) {
        const resource = {
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize || 0,
            startTime: entry.startTime,
            responseTime: entry.responseEnd - entry.requestStart,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
        };

        this.metrics.resources.push(resource);

        // Check for script load threshold
        if (entry.initiatorType === 'script' && resource.duration > this.thresholds.scriptLoad) {
            this.addAlert('warning', `Slow script load: ${entry.name} took ${Math.round(resource.duration)}ms`);
        }
    }

    /**
     * Record paint timing (FCP, FP)
     */
    recordPaintTiming(entry) {
        this.metrics.navigation[entry.name] = entry.startTime;

        // Check FCP threshold
        if (entry.name === 'first-contentful-paint' && entry.startTime > this.thresholds.firstContentfulPaint) {
            this.addAlert('warning', `First Contentful Paint exceeded threshold: ${Math.round(entry.startTime)}ms`);
        }

        console.log(`[PerformanceMonitor] ${entry.name}: ${Math.round(entry.startTime)}ms`);
    }

    /**
     * Record custom timing measurements
     */
    recordCustomTiming(entry) {
        this.metrics.custom.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
        });
    }

    /**
     * Set up Firebase query interceptor
     */
    setupFirebaseInterceptor() {
        // Wait for Firebase to be available
        const checkFirebase = setInterval(() => {
            if (window.firebase && window.db) {
                clearInterval(checkFirebase);
                this.wrapFirebaseMethods();
            }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => clearInterval(checkFirebase), 10000);
    }

    /**
     * Wrap Firebase methods to track query performance
     */
    wrapFirebaseMethods() {
        const db = window.db;
        if (!db) return;

        // Store original collection method
        const originalCollection = db.collection.bind(db);

        // Override collection method
        db.collection = (path) => {
            const collectionRef = originalCollection(path);
            return this.wrapCollectionRef(collectionRef, path);
        };

        console.log('[PerformanceMonitor] Firebase interceptor installed');
    }

    /**
     * Wrap collection reference methods
     */
    wrapCollectionRef(collectionRef, path) {
        // Wrap get() method
        const originalGet = collectionRef.get.bind(collectionRef);
        collectionRef.get = async (...args) => {
            const startTime = performance.now();
            const queryId = `${path}_${Date.now()}`;

            try {
                const result = await originalGet(...args);
                const duration = performance.now() - startTime;

                this.recordFirebaseQuery({
                    collection: path,
                    operation: 'get',
                    duration,
                    success: true,
                    resultCount: result.size || result.docs?.length || 0,
                    queryId
                });

                return result;
            } catch (error) {
                const duration = performance.now() - startTime;
                this.recordFirebaseQuery({
                    collection: path,
                    operation: 'get',
                    duration,
                    success: false,
                    error: error.message,
                    queryId
                });
                throw error;
            }
        };

        // Wrap doc() method to also wrap document references
        const originalDoc = collectionRef.doc.bind(collectionRef);
        collectionRef.doc = (docId) => {
            const docRef = originalDoc(docId);
            return this.wrapDocRef(docRef, `${path}/${docId}`);
        };

        return collectionRef;
    }

    /**
     * Wrap document reference methods
     */
    wrapDocRef(docRef, fullPath) {
        // Wrap get() method
        const originalGet = docRef.get.bind(docRef);
        docRef.get = async (...args) => {
            const startTime = performance.now();
            const queryId = `${fullPath}_${Date.now()}`;

            try {
                const result = await originalGet(...args);
                const duration = performance.now() - startTime;

                this.recordFirebaseQuery({
                    collection: fullPath,
                    operation: 'get',
                    duration,
                    success: true,
                    exists: result.exists,
                    queryId
                });

                return result;
            } catch (error) {
                const duration = performance.now() - startTime;
                this.recordFirebaseQuery({
                    collection: fullPath,
                    operation: 'get',
                    duration,
                    success: false,
                    error: error.message,
                    queryId
                });
                throw error;
            }
        };

        return docRef;
    }

    /**
     * Record Firebase query metrics
     */
    recordFirebaseQuery(queryData) {
        this.metrics.firebase.push({
            ...queryData,
            timestamp: Date.now()
        });

        // Check for query threshold alert
        if (queryData.duration > this.thresholds.firebaseQuery) {
            this.addAlert('warning', `Slow Firebase query: ${queryData.collection} took ${Math.round(queryData.duration)}ms`);
        }

        console.log(`[PerformanceMonitor] Firebase ${queryData.operation} on ${queryData.collection}: ${Math.round(queryData.duration)}ms`);
    }

    /**
     * Track time to interactive
     */
    trackTimeToInteractive() {
        // Simple TTI estimation: when long tasks stop
        let lastLongTask = 0;

        if (window.PerformanceObserver) {
            try {
                const longtaskObserver = new PerformanceObserver((list) => {
                    lastLongTask = performance.now();
                });
                longtaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.push(longtaskObserver);
            } catch (error) {
                // Long task API not supported
            }
        }

        // Fallback: consider interactive when load event fires
        window.addEventListener('load', () => {
            setTimeout(() => {
                const tti = performance.now() - this.startTime;
                this.metrics.navigation.timeToInteractive = tti;

                if (tti > this.thresholds.timeToInteractive) {
                    this.addAlert('warning', `Time to Interactive exceeded threshold: ${Math.round(tti)}ms`);
                }

                console.log(`[PerformanceMonitor] Time to Interactive: ${Math.round(tti)}ms`);
            }, 100);
        });
    }

    /**
     * Set up custom metrics tracking
     */
    setupCustomMetrics() {
        // Track auth time
        window.addEventListener('firebaseAuthStateChanged', (event) => {
            const authTime = performance.now() - this.startTime;

            this.recordInteraction({
                name: 'auth_state_change',
                duration: authTime,
                user: event.detail.user ? 'signed_in' : 'signed_out'
            });

            if (event.detail.user && authTime > this.thresholds.authTime) {
                this.addAlert('warning', `Authentication took longer than expected: ${Math.round(authTime)}ms`);
            }
        });
    }

    /**
     * Mark a custom performance point
     */
    mark(name) {
        if (!this.isRecording) return;
        performance.mark(name);
        console.log(`[PerformanceMonitor] Mark: ${name}`);
    }

    /**
     * Measure duration between two marks
     */
    measure(name, startMark, endMark) {
        if (!this.isRecording) return;

        try {
            performance.measure(name, startMark, endMark);
            const measure = performance.getEntriesByName(name, 'measure')[0];
            console.log(`[PerformanceMonitor] Measure: ${name} = ${Math.round(measure.duration)}ms`);
            return measure.duration;
        } catch (error) {
            console.warn(`[PerformanceMonitor] Measure failed:`, error);
            return 0;
        }
    }

    /**
     * Record user interaction timing
     */
    recordInteraction(interaction) {
        this.metrics.interactions.push({
            ...interaction,
            timestamp: Date.now()
        });
    }

    /**
     * Time an async operation
     */
    async timeOperation(name, operation) {
        const startTime = performance.now();
        this.mark(`${name}_start`);

        try {
            const result = await operation();
            const duration = performance.now() - startTime;

            this.mark(`${name}_end`);
            this.measure(name, `${name}_start`, `${name}_end`);

            this.metrics.custom.push({
                name,
                duration,
                success: true,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;

            this.metrics.custom.push({
                name,
                duration,
                success: false,
                error: error.message,
                timestamp: Date.now()
            });

            throw error;
        }
    }

    /**
     * Add performance alert
     */
    addAlert(level, message) {
        const alert = {
            level, // 'info', 'warning', 'error'
            message,
            timestamp: Date.now()
        };

        this.alerts.push(alert);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('performanceAlert', { detail: alert }));

        console.log(`[PerformanceMonitor] ${level.toUpperCase()}: ${message}`);
    }

    /**
     * Get all metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            alerts: this.alerts,
            timestamp: Date.now()
        };
    }

    /**
     * Get metrics summary
     */
    getSummary() {
        return {
            pageLoad: this.metrics.navigation.pageLoad || 0,
            firstContentfulPaint: this.metrics.navigation['first-contentful-paint'] || 0,
            timeToInteractive: this.metrics.navigation.timeToInteractive || 0,
            firebaseQueries: this.metrics.firebase.length,
            avgFirebaseQueryTime: this.getAverageFirebaseQueryTime(),
            slowFirebaseQueries: this.getSlowFirebaseQueries(),
            totalResources: this.metrics.resources.length,
            totalSize: this.getTotalResourceSize(),
            alerts: this.alerts.length
        };
    }

    /**
     * Get average Firebase query time
     */
    getAverageFirebaseQueryTime() {
        if (this.metrics.firebase.length === 0) return 0;

        const total = this.metrics.firebase.reduce((sum, query) => sum + query.duration, 0);
        return total / this.metrics.firebase.length;
    }

    /**
     * Get slow Firebase queries (exceeding threshold)
     */
    getSlowFirebaseQueries() {
        return this.metrics.firebase.filter(query => query.duration > this.thresholds.firebaseQuery);
    }

    /**
     * Get total resource size
     */
    getTotalResourceSize() {
        return this.metrics.resources.reduce((sum, resource) => sum + resource.size, 0);
    }

    /**
     * Get scripts sorted by load time
     */
    getScriptsByLoadTime() {
        return this.metrics.resources
            .filter(r => r.type === 'script')
            .sort((a, b) => b.duration - a.duration);
    }

    /**
     * Export metrics as JSON
     */
    exportMetrics() {
        return JSON.stringify(this.getMetrics(), null, 2);
    }

    /**
     * Export summary report
     */
    exportReport() {
        const summary = this.getSummary();
        const slowQueries = this.getSlowFirebaseQueries();
        const slowScripts = this.getScriptsByLoadTime().slice(0, 10);

        return {
            summary,
            slowQueries,
            slowScripts,
            alerts: this.alerts,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Clear all metrics
     */
    clear() {
        this.metrics = {
            navigation: {},
            firebase: [],
            scripts: [],
            resources: [],
            interactions: [],
            custom: []
        };
        this.alerts = [];
        console.log('[PerformanceMonitor] Metrics cleared');
    }

    /**
     * Stop recording
     */
    stop() {
        this.isRecording = false;
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        console.log('[PerformanceMonitor] Stopped');
    }
}

// Create global instance
window.PerformanceMonitor = PerformanceMonitor;
window.performanceMonitor = new PerformanceMonitor();

// Export module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}

console.log('[PerformanceMonitor] Module loaded');
