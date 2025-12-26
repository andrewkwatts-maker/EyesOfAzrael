/**
 * Diagnostic Data Collector
 * Collects real-time diagnostic data from all application systems
 */

class DiagnosticCollector {
    constructor() {
        this.diagnostics = {
            firebase: {
                status: 'unknown',
                initialized: false,
                config: null,
                error: null,
                timestamp: null
            },
            auth: {
                status: 'unknown',
                currentUser: null,
                ready: false,
                error: null,
                timestamp: null
            },
            navigation: {
                status: 'unknown',
                currentRoute: null,
                history: [],
                ready: false,
                error: null,
                timestamp: null
            },
            dom: {
                status: 'unknown',
                readyState: null,
                criticalElements: {},
                error: null,
                timestamp: null
            },
            network: {
                status: 'unknown',
                requests: [],
                errors: [],
                timestamp: null
            },
            performance: {
                status: 'unknown',
                timing: {},
                memory: null,
                error: null,
                timestamp: null
            },
            console: {
                logs: [],
                errors: [],
                warnings: [],
                maxLogs: 50
            }
        };

        this.startTime = Date.now();
        this.initialized = false;
    }

    /**
     * Initialize diagnostic collection
     */
    init() {
        if (this.initialized) return;

        console.log('[Diagnostics] Initializing collector...');

        // Intercept console methods
        this.interceptConsole();

        // Monitor network requests
        this.monitorNetwork();

        // Monitor DOM state
        this.monitorDOM();

        // Start periodic collection
        this.startPeriodicCollection();

        this.initialized = true;
        console.log('[Diagnostics] Collector initialized');
    }

    /**
     * Intercept console methods to capture logs
     */
    interceptConsole() {
        const self = this;
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = function(...args) {
            self.addLog('log', args);
            originalLog.apply(console, args);
        };

        console.error = function(...args) {
            self.addLog('error', args);
            originalError.apply(console, args);
        };

        console.warn = function(...args) {
            self.addLog('warning', args);
            originalWarn.apply(console, args);
        };
    }

    /**
     * Add log entry
     */
    addLog(level, args) {
        const entry = {
            level,
            message: args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' '),
            timestamp: Date.now(),
            elapsed: Date.now() - this.startTime
        };

        // Add to appropriate array
        if (level === 'error') {
            this.diagnostics.console.errors.push(entry);
        } else if (level === 'warning') {
            this.diagnostics.console.warnings.push(entry);
        }

        this.diagnostics.console.logs.push(entry);

        // Keep only last N logs
        const maxLogs = this.diagnostics.console.maxLogs;
        if (this.diagnostics.console.logs.length > maxLogs) {
            this.diagnostics.console.logs = this.diagnostics.console.logs.slice(-maxLogs);
        }
    }

    /**
     * Monitor network requests
     */
    monitorNetwork() {
        const self = this;

        // Intercept fetch
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            const startTime = Date.now();

            return originalFetch.apply(this, args)
                .then(response => {
                    self.addNetworkRequest({
                        type: 'fetch',
                        url,
                        status: response.status,
                        duration: Date.now() - startTime,
                        timestamp: Date.now()
                    });
                    return response;
                })
                .catch(error => {
                    self.addNetworkError({
                        type: 'fetch',
                        url,
                        error: error.message,
                        duration: Date.now() - startTime,
                        timestamp: Date.now()
                    });
                    throw error;
                });
        };

        // Intercept XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url) {
            this._diagnosticUrl = url;
            this._diagnosticMethod = method;
            this._diagnosticStartTime = Date.now();
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function() {
            const xhr = this;

            xhr.addEventListener('load', function() {
                self.addNetworkRequest({
                    type: 'xhr',
                    method: xhr._diagnosticMethod,
                    url: xhr._diagnosticUrl,
                    status: xhr.status,
                    duration: Date.now() - xhr._diagnosticStartTime,
                    timestamp: Date.now()
                });
            });

            xhr.addEventListener('error', function() {
                self.addNetworkError({
                    type: 'xhr',
                    method: xhr._diagnosticMethod,
                    url: xhr._diagnosticUrl,
                    error: 'Network error',
                    duration: Date.now() - xhr._diagnosticStartTime,
                    timestamp: Date.now()
                });
            });

            return originalSend.apply(this, arguments);
        };
    }

    /**
     * Add network request
     */
    addNetworkRequest(request) {
        this.diagnostics.network.requests.push(request);

        // Keep only last 50 requests
        if (this.diagnostics.network.requests.length > 50) {
            this.diagnostics.network.requests = this.diagnostics.network.requests.slice(-50);
        }

        this.diagnostics.network.timestamp = Date.now();
    }

    /**
     * Add network error
     */
    addNetworkError(error) {
        this.diagnostics.network.errors.push(error);

        // Keep only last 20 errors
        if (this.diagnostics.network.errors.length > 20) {
            this.diagnostics.network.errors = this.diagnostics.network.errors.slice(-20);
        }

        this.diagnostics.network.timestamp = Date.now();
    }

    /**
     * Monitor DOM state
     */
    monitorDOM() {
        const self = this;

        // Monitor document ready state
        document.addEventListener('readystatechange', () => {
            self.collectDOMState();
        });

        // Monitor mutations
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                self.collectDOMState();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * Start periodic collection
     */
    startPeriodicCollection() {
        setInterval(() => {
            this.collectAll();
        }, 1000);
    }

    /**
     * Collect all diagnostic data
     */
    collectAll() {
        this.collectFirebaseState();
        this.collectAuthState();
        this.collectNavigationState();
        this.collectDOMState();
        this.collectPerformance();
        this.collectNetworkState();
    }

    /**
     * Collect Firebase state
     */
    collectFirebaseState() {
        try {
            if (typeof firebase === 'undefined') {
                this.diagnostics.firebase.status = 'error';
                this.diagnostics.firebase.error = 'Firebase SDK not loaded';
            } else {
                const apps = firebase.apps;

                if (apps.length === 0) {
                    this.diagnostics.firebase.status = 'warning';
                    this.diagnostics.firebase.initialized = false;
                    this.diagnostics.firebase.error = 'Firebase not initialized';
                } else {
                    this.diagnostics.firebase.status = 'ok';
                    this.diagnostics.firebase.initialized = true;
                    this.diagnostics.firebase.config = {
                        projectId: apps[0].options.projectId,
                        appId: apps[0].options.appId
                    };
                    this.diagnostics.firebase.error = null;
                }
            }
        } catch (error) {
            this.diagnostics.firebase.status = 'error';
            this.diagnostics.firebase.error = error.message;
        }

        this.diagnostics.firebase.timestamp = Date.now();
    }

    /**
     * Collect authentication state
     */
    collectAuthState() {
        try {
            if (typeof firebase === 'undefined' || !firebase.auth) {
                this.diagnostics.auth.status = 'error';
                this.diagnostics.auth.error = 'Firebase Auth not available';
            } else {
                const auth = firebase.auth();
                const user = auth.currentUser;

                if (user) {
                    this.diagnostics.auth.status = 'ok';
                    this.diagnostics.auth.ready = true;
                    this.diagnostics.auth.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL
                    };
                    this.diagnostics.auth.error = null;
                } else {
                    this.diagnostics.auth.status = 'warning';
                    this.diagnostics.auth.ready = true;
                    this.diagnostics.auth.currentUser = null;
                    this.diagnostics.auth.error = 'No user signed in';
                }
            }
        } catch (error) {
            this.diagnostics.auth.status = 'error';
            this.diagnostics.auth.error = error.message;
        }

        this.diagnostics.auth.timestamp = Date.now();
    }

    /**
     * Collect navigation state
     */
    collectNavigationState() {
        try {
            const nav = window.EyesOfAzrael?.navigation;

            if (!nav) {
                this.diagnostics.navigation.status = 'warning';
                this.diagnostics.navigation.error = 'Navigation not initialized';
            } else {
                this.diagnostics.navigation.status = 'ok';
                this.diagnostics.navigation.ready = true;
                this.diagnostics.navigation.currentRoute = nav.currentRoute || window.location.hash;
                this.diagnostics.navigation.history = nav.routeHistory || [];
                this.diagnostics.navigation.error = null;
            }
        } catch (error) {
            this.diagnostics.navigation.status = 'error';
            this.diagnostics.navigation.error = error.message;
        }

        this.diagnostics.navigation.timestamp = Date.now();
    }

    /**
     * Collect DOM state
     */
    collectDOMState() {
        try {
            this.diagnostics.dom.readyState = document.readyState;

            // Check critical elements
            const criticalElements = {
                mainContent: document.getElementById('main-content'),
                header: document.querySelector('.site-header'),
                shaderCanvas: document.getElementById('shader-canvas'),
                breadcrumb: document.getElementById('breadcrumb-nav')
            };

            this.diagnostics.dom.criticalElements = {};
            for (const [key, element] of Object.entries(criticalElements)) {
                this.diagnostics.dom.criticalElements[key] = {
                    exists: !!element,
                    visible: element ? element.offsetParent !== null : false,
                    innerHTML: element ? element.innerHTML.length : 0
                };
            }

            // Check for errors
            const hasErrors = Object.values(this.diagnostics.dom.criticalElements)
                .some(el => !el.exists);

            this.diagnostics.dom.status = hasErrors ? 'warning' : 'ok';
            this.diagnostics.dom.error = hasErrors ? 'Missing critical elements' : null;

        } catch (error) {
            this.diagnostics.dom.status = 'error';
            this.diagnostics.dom.error = error.message;
        }

        this.diagnostics.dom.timestamp = Date.now();
    }

    /**
     * Collect network state
     */
    collectNetworkState() {
        try {
            const hasErrors = this.diagnostics.network.errors.length > 0;
            this.diagnostics.network.status = hasErrors ? 'warning' : 'ok';
        } catch (error) {
            this.diagnostics.network.status = 'error';
        }
    }

    /**
     * Collect performance metrics
     */
    collectPerformance() {
        try {
            if (performance && performance.timing) {
                const timing = performance.timing;
                const now = Date.now();

                this.diagnostics.performance.timing = {
                    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                    pageLoad: timing.loadEventEnd - timing.navigationStart,
                    domInteractive: timing.domInteractive - timing.navigationStart,
                    firstPaint: timing.responseStart - timing.navigationStart,
                    uptime: now - this.startTime
                };
            }

            // Memory info (Chrome only)
            if (performance.memory) {
                this.diagnostics.performance.memory = {
                    usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
                    jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
                };
            }

            this.diagnostics.performance.status = 'ok';
            this.diagnostics.performance.error = null;

        } catch (error) {
            this.diagnostics.performance.status = 'error';
            this.diagnostics.performance.error = error.message;
        }

        this.diagnostics.performance.timestamp = Date.now();
    }

    /**
     * Get all diagnostics
     */
    getDiagnostics() {
        return this.diagnostics;
    }

    /**
     * Get overall system status
     */
    getSystemStatus() {
        const statuses = [
            this.diagnostics.firebase.status,
            this.diagnostics.auth.status,
            this.diagnostics.navigation.status,
            this.diagnostics.dom.status,
            this.diagnostics.network.status,
            this.diagnostics.performance.status
        ];

        if (statuses.includes('error')) return 'error';
        if (statuses.includes('warning')) return 'warning';
        return 'ok';
    }

    /**
     * Get failure point (first critical error)
     */
    getFailurePoint() {
        const checks = [
            { name: 'Firebase SDK', status: this.diagnostics.firebase.status, error: this.diagnostics.firebase.error },
            { name: 'Firebase Auth', status: this.diagnostics.auth.status, error: this.diagnostics.auth.error },
            { name: 'Navigation', status: this.diagnostics.navigation.status, error: this.diagnostics.navigation.error },
            { name: 'DOM Elements', status: this.diagnostics.dom.status, error: this.diagnostics.dom.error },
            { name: 'Network', status: this.diagnostics.network.status, error: this.diagnostics.network.error }
        ];

        for (const check of checks) {
            if (check.status === 'error') {
                return {
                    component: check.name,
                    error: check.error
                };
            }
        }

        return null;
    }

    /**
     * Export diagnostics as JSON
     */
    exportJSON() {
        return JSON.stringify(this.diagnostics, null, 2);
    }

    /**
     * Clear console logs
     */
    clearLogs() {
        this.diagnostics.console.logs = [];
        this.diagnostics.console.errors = [];
        this.diagnostics.console.warnings = [];
    }
}

// Auto-initialize if not in dashboard page
if (!window.location.pathname.includes('debug-dashboard')) {
    window.diagnosticCollector = new DiagnosticCollector();
    window.diagnosticCollector.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosticCollector;
}
