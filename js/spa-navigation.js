// SPA Navigation System - Polished Edition

/**
 * Single Page Application Navigation System
 * Handles dynamic routing and content loading from Firebase
 * Public routes (home, mythologies, browse, compare, etc.) are accessible without auth
 * Protected routes (dashboard) require authentication
 *
 * Features:
 * - Smooth page transitions with CSS animations
 * - Polish loading indicators with progress feedback
 * - Navigation history with scroll position restoration
 * - Route preloading on link hover (prefetch)
 * - Robust error recovery with retry mechanisms
 * - A11y route change announcements
 * - Back/forward button handling
 * - Navigation timing metrics
 * - Navigation lock to prevent race conditions
 *
 * Accessibility Features:
 * - Screen reader announcements for route changes
 * - Keyboard shortcuts for navigation
 * - Focus management during navigation
 * - ARIA live regions for dynamic content
 */

// Debug mode - set to true to enable verbose logging
const SPA_DEBUG = false;

// Conditional logging helper
const spaLog = (...args) => {
    if (SPA_DEBUG) console.log('[SPA]', ...args);
};
const spaWarn = (...args) => console.warn('[SPA]', ...args);
const spaError = (...args) => console.error('[SPA]', ...args);

/**
 * Navigation timing metrics collector
 * Uses external module if available (js/router/navigation-metrics.js)
 * Falls back to inline definition for backwards compatibility
 */
const NavigationMetrics = window.NavigationMetrics || {
    _metrics: [],
    _maxMetrics: 100,

    startNavigation(route) {
        return {
            route,
            startTime: performance.now(),
            phases: {}
        };
    },

    recordPhase(metric, phaseName) {
        if (metric && metric.phases) {
            metric.phases[phaseName] = performance.now() - metric.startTime;
        }
    },

    finishNavigation(metric) {
        if (!metric) return;
        metric.totalTime = performance.now() - metric.startTime;
        metric.timestamp = Date.now();
        this._metrics.push(metric);
        if (this._metrics.length > this._maxMetrics) {
            this._metrics = this._metrics.slice(-this._maxMetrics);
        }
        spaLog('Navigation metrics:', metric);

        // Dispatch event for external monitoring
        document.dispatchEvent(new CustomEvent('navigation-complete', {
            detail: metric
        }));
    },

    getMetrics() {
        return [...this._metrics];
    },

    getAverageTime() {
        if (this._metrics.length === 0) return 0;
        const total = this._metrics.reduce((sum, m) => sum + m.totalTime, 0);
        return total / this._metrics.length;
    },

    clear() {
        this._metrics = [];
    }
};

/**
 * Scroll position manager for history navigation
 * Uses external module if available (js/router/scroll-manager.js)
 */
const ScrollManager = window.ScrollManager || {
    _positions: new Map(),
    _maxEntries: 50,

    save(path) {
        this._positions.set(path, {
            x: window.scrollX,
            y: window.scrollY,
            timestamp: Date.now()
        });
        // Cleanup old entries
        if (this._positions.size > this._maxEntries) {
            const oldestKey = this._positions.keys().next().value;
            this._positions.delete(oldestKey);
        }
    },

    restore(path, smooth = true) {
        const position = this._positions.get(path);
        if (position) {
            // Use requestAnimationFrame for smooth restoration
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: position.y,
                    left: position.x,
                    behavior: smooth ? 'smooth' : 'instant'
                });
            });
            return true;
        }
        // Default: scroll to top
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
        });
        return false;
    },

    clear() {
        this._positions.clear();
    }
};

/**
 * Route preloader for hover-based prefetching
 * Uses external module if available (js/router/route-preloader.js)
 */
const RoutePreloader = window.RoutePreloader || {
    _cache: new Map(),
    _pending: new Map(),
    _maxCacheSize: 20,
    _hoverDelay: 50, // Reduced from 150ms for faster prefetch
    _cacheExpiry: 300000, // 5 minutes (up from 1 min)

    init(db) {
        this.db = db;
        // Only setup listeners if LinkPrefetcher isn't available
        // LinkPrefetcher provides better prefetching with IntersectionObserver
        if (!window.LinkPrefetcher) {
            this._setupHoverListeners();
        }
    },

    _setupHoverListeners() {
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href === '#' || href === '#/') return;

            // Delay prefetch to avoid unnecessary requests on quick hovers
            link._prefetchTimer = setTimeout(() => {
                this.prefetch(href);
            }, this._hoverDelay);
        });

        document.addEventListener('mouseout', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link._prefetchTimer) {
                clearTimeout(link._prefetchTimer);
                link._prefetchTimer = null;
            }
        });
    },

    async prefetch(path) {
        // Delegate to LinkPrefetcher if available
        if (window.LinkPrefetcher) {
            return window.LinkPrefetcher.prefetch(path, 'legacy');
        }

        const normalizedPath = path.replace(/^#\/?/, '');

        // Check cache
        const cached = this._cache.get(normalizedPath);
        if (cached && Date.now() - cached.timestamp < this._cacheExpiry) {
            return cached.data;
        }

        // Check if already pending
        if (this._pending.has(normalizedPath)) {
            return this._pending.get(normalizedPath);
        }

        // Determine what to prefetch based on route pattern
        const prefetchPromise = this._prefetchRoute(normalizedPath);
        this._pending.set(normalizedPath, prefetchPromise);

        try {
            const data = await prefetchPromise;
            this._cache.set(normalizedPath, { data, timestamp: Date.now() });

            // Cleanup old cache entries
            if (this._cache.size > this._maxCacheSize) {
                const oldestKey = this._cache.keys().next().value;
                this._cache.delete(oldestKey);
            }

            return data;
        } catch (error) {
            spaLog('Prefetch failed for:', normalizedPath, error);
            return null;
        } finally {
            this._pending.delete(normalizedPath);
        }
    },

    async _prefetchRoute(path) {
        if (!this.db) return null;

        // Entity route: /mythology/:myth/:category/:id or /entity/:category/:myth/:id
        const entityMatch = path.match(/(?:mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)|entity\/([^\/]+)\/([^\/]+)\/([^\/]+))/);
        if (entityMatch) {
            const category = entityMatch[2] || entityMatch[4];
            const entityId = entityMatch[3] || entityMatch[6];
            try {
                const doc = await this.db.collection(category).doc(entityId).get();
                return doc.exists ? { id: doc.id, ...doc.data() } : null;
            } catch (e) {
                return null;
            }
        }

        // Browse category: /browse/:category
        const browseMatch = path.match(/browse\/([^\/]+)/);
        if (browseMatch) {
            const category = browseMatch[1];
            try {
                const snapshot = await this.db.collection(category).limit(20).get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                return null;
            }
        }

        return null;
    },

    getCached(path) {
        // Check LinkPrefetcher first for better cache hit rate
        if (window.LinkPrefetcher) {
            const prefetched = window.LinkPrefetcher.get(path);
            if (prefetched) return prefetched;
        }

        const normalizedPath = path.replace(/^#\/?/, '');
        const cached = this._cache.get(normalizedPath);
        if (cached && Date.now() - cached.timestamp < this._cacheExpiry) {
            return cached.data;
        }
        return null;
    },

    clearCache() {
        this._cache.clear();
        this._pending.clear();
        if (window.LinkPrefetcher) {
            window.LinkPrefetcher.clearCache();
        }
    }
};

class SPANavigation {
    constructor(firestore, authManager, renderer) {
        const constructorStart = performance.now();
        spaLog('Constructor called at:', new Date().toISOString());

        this.db = firestore;
        this.auth = authManager;
        this.renderer = renderer;
        this.currentRoute = null;
        this.routeHistory = [];
        this.maxHistory = 50;
        this.authReady = false;

        // Navigation state
        this._isNavigating = false;
        this._navigationDebounceTimer = null;
        this._lastNavigatedHash = null;
        this._currentNavigationId = null;
        this._activeNavigationId = null;
        this._transitionEnabled = true;
        this._retryAttempts = 0;
        this._maxRetryAttempts = 3;

        // Initialize preloader
        RoutePreloader.init(firestore);

        // Verify required view classes are loaded (initialization order check)
        this.verifyDependencies();

        spaLog('Properties initialized:', {
            hasDB: !!this.db,
            hasAuth: !!this.auth,
            hasRenderer: !!this.renderer,
            authReady: this.authReady
        });

        // Route patterns
        this.routes = {
            home: /^#?\/?$/,
            mythologies: /^#?\/mythologies\/?$/,
            browse_category: /^#?\/browse\/([^\/]+)\/?$/,
            browse_category_mythology: /^#?\/browse\/([^\/]+)\/([^\/]+)\/?$/,
            mythology: /^#?\/mythology\/([^\/]+)\/?$/,
            entity: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
            entity_alt: /^#?\/entity\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
            entity_simple: /^#?\/entity\/([^\/]+)\/([^\/]+)\/?$/,  // 2-param: #/entity/collection/id
            category: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/?$/,
            search: /^#?\/search\/?$/,
            corpus_explorer: /^#?\/corpus-explorer\/?$/,
            compare: /^#?\/compare\/?$/,
            dashboard: /^#?\/dashboard\/?$/,
            about: /^#?\/about\/?$/,
            privacy: /^#?\/privacy\/?$/,
            terms: /^#?\/terms\/?$/,
            user_profile: /^#?\/user\/([^\/]+)\/?$/,
            guidelines: /^#?\/guidelines\/?$/
        };

        // Route display names for a11y announcements
        this._routeNames = {
            home: 'Home',
            mythologies: 'World Mythologies',
            browse_category: 'Browse',
            browse_category_mythology: 'Browse',
            mythology: 'Mythology',
            entity: 'Entity Details',
            entity_alt: 'Entity Details',
            entity_simple: 'Entity Details',
            category: 'Category',
            search: 'Search',
            corpus_explorer: 'Corpus Explorer',
            compare: 'Compare Entities',
            dashboard: 'Dashboard',
            about: 'About',
            privacy: 'Privacy Policy',
            terms: 'Terms of Service',
            user_profile: 'User Profile',
            guidelines: 'Community Guidelines'
        };

        // Check currentUser OR optimistic auth synchronously first
        const syncCheckStart = performance.now();
        const currentUser = firebase.auth().currentUser;
        const hasOptimisticAuth = window._eoaOptimisticAuth === true;
        const syncCheckEnd = performance.now();

        spaLog(`Synchronous auth check took: ${(syncCheckEnd - syncCheckStart).toFixed(2)}ms`);
        spaLog(`Optimistic auth: ${hasOptimisticAuth}, currentUser: ${!!currentUser}`);

        if (currentUser || hasOptimisticAuth) {
            const fastPathEnd = performance.now();
            spaLog(currentUser ? `CurrentUser available immediately: ${currentUser.email}` : 'Using OPTIMISTIC auth from cache (instant start)');
            spaLog(`FAST PATH: Auth already ready in ${(fastPathEnd - constructorStart).toFixed(2)}ms`);
            this.authReady = true;
        } else {
            spaLog('No currentUser or optimistic auth, will resolve async...');

            this.waitForAuth().then((result) => {
                const slowPathEnd = performance.now();
                const user = result?.user || result;
                const timedOut = result?.timedOut || false;

                if (timedOut) {
                    spaWarn(`waitForAuth() timed out after ${(slowPathEnd - constructorStart).toFixed(2)}ms`);
                } else {
                    spaLog(`waitForAuth() resolved with user: ${user ? user.email : 'null'} in ${(slowPathEnd - constructorStart).toFixed(2)}ms`);
                }

                this.authReady = true;

                const currentPath = (window.location.hash || '#/').replace('#', '');
                const protectedRoutes = ['dashboard'];
                const isProtectedRoute = protectedRoutes.some(route => currentPath.includes(route));
                if (isProtectedRoute) {
                    spaLog('Re-handling protected route now that auth is ready');
                    this.handleRoute();
                }
            }).catch((error) => {
                spaError('waitForAuth() rejected with error:', error);
                this.authReady = true;
            });

            document.addEventListener('auth-ready', (event) => {
                spaLog('Received auth-ready event from auth guard:', event.detail);
                if (!this.authReady) {
                    this.authReady = true;
                    const currentPath = (window.location.hash || '#/').replace('#', '');
                    const protectedRoutes = ['dashboard'];
                    const isProtectedRoute = protectedRoutes.some(route => currentPath.includes(route));
                    if (isProtectedRoute && event.detail && event.detail.authenticated) {
                        spaLog('Re-handling protected route after auth-ready event');
                        this.handleRoute();
                    }
                }
            }, { once: true });
        }

        document.addEventListener('auth-verified', (event) => {
            if (!event.detail?.authenticated) {
                spaWarn('Optimistic auth verification FAILED');
            } else {
                spaLog('Optimistic auth verified successfully');
            }
        }, { once: true });

        if (document.readyState === 'loading') {
            spaLog('DOM still loading, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', () => {
                spaLog('DOMContentLoaded fired, initializing router...');
                this.initRouter();
            });
        } else {
            spaLog('DOM already loaded, initializing router immediately...');
            this.initRouter();
        }

        spaLog('Constructor completed');
    }

    /**
     * Convert entity type to collection name (singular to plural)
     * @param {string} type - Entity type (e.g., 'deity', 'hero', 'deities')
     * @returns {string} Collection name (e.g., 'deities', 'heroes')
     */
    getCollectionName(type) {
        // Normalize to lowercase for case-insensitive matching
        const normalizedType = type?.toLowerCase() || type;

        const singularToPlural = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'item': 'items',
            'place': 'places',
            'concept': 'concepts',
            'magic': 'magic',
            'theory': 'user_theories',
            'mythology': 'mythologies',
            'archetype': 'archetypes',
            'herb': 'herbs',
            'ritual': 'rituals',
            'text': 'texts',
            'symbol': 'symbols',
            'cosmology': 'cosmology',
            'event': 'events',
            'being': 'beings'
        };
        // If already plural (in the map values), return as-is
        if (Object.values(singularToPlural).includes(normalizedType)) {
            return normalizedType;
        }
        return singularToPlural[normalizedType] || normalizedType;
    }

    /**
     * Wait for Firebase Auth to be ready
     */
    async waitForAuth() {
        return new Promise((resolve, reject) => {
            spaLog('waitForAuth() promise created at:', new Date().toISOString());

            if (typeof firebase === 'undefined' || !firebase.auth) {
                spaError('Firebase SDK not available!');
                resolve({ user: null, timedOut: false, error: 'Firebase SDK not available' });
                return;
            }

            const auth = firebase.auth();
            if (!auth) {
                spaError('Firebase auth not available!');
                resolve({ user: null, timedOut: false, error: 'Firebase auth not available' });
                return;
            }

            let resolved = false;
            let unsubscribe = null;

            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    spaWarn('Auth timeout after 5s - resolving with null (not authenticated).');
                    if (unsubscribe) unsubscribe();
                    resolve({ user: null, timedOut: true });
                }
            }, 5000);

            spaLog('Registering onAuthStateChanged listener...');

            try {
                unsubscribe = auth.onAuthStateChanged((user) => {
                    if (resolved) {
                        spaLog('Auth state changed after timeout - ignoring');
                        return;
                    }

                    resolved = true;
                    clearTimeout(timeoutId);
                    spaLog('onAuthStateChanged fired, user:', user ? user.email : 'null');
                    if (unsubscribe) unsubscribe();
                    resolve({ user, timedOut: false });
                });
            } catch (error) {
                spaError('Error setting up auth listener:', error);
                resolved = true;
                clearTimeout(timeoutId);
                resolve({ user: null, timedOut: false, error: error.message });
            }

            spaLog('waitForAuth() setup complete, waiting for auth state change...');
        });
    }

    /**
     * Verify that required view classes are loaded
     */
    verifyDependencies() {
        const requiredClasses = [
            { name: 'LandingPageView', route: 'home', critical: true },
            { name: 'HomeView', route: 'home', critical: false },
            { name: 'MythologiesView', route: 'mythologies', critical: false },
            { name: 'BrowseCategoryView', route: 'browse', critical: false },
            { name: 'SearchViewComplete', route: 'search', critical: false },
            { name: 'CompareView', route: 'compare', critical: false },
            { name: 'UserDashboard', route: 'dashboard', critical: false },
            { name: 'AboutPage', route: 'about', critical: false },
            { name: 'PrivacyPage', route: 'privacy', critical: false },
            { name: 'TermsPage', route: 'terms', critical: false }
        ];

        const missingClasses = [];
        const loadedClasses = [];

        requiredClasses.forEach(({ name, route, critical }) => {
            if (typeof window[name] === 'undefined') {
                missingClasses.push({ name, route, critical });
            } else {
                loadedClasses.push(name);
            }
        });

        spaLog('Dependency check:', {
            loaded: loadedClasses.length,
            missing: missingClasses.length,
            loadedClasses: loadedClasses,
            missingClasses: missingClasses.map(c => c.name)
        });

        const criticalMissing = missingClasses.filter(c => c.critical);
        if (criticalMissing.length > 0) {
            spaWarn('CRITICAL: Some view classes are not loaded:', criticalMissing.map(c => c.name));
            spaWarn('This may indicate a script loading order issue in index.html');
        }

        this._dependencyStatus = {
            loaded: loadedClasses,
            missing: missingClasses,
            verified: true
        };
    }

    /**
     * Initialize router and event listeners
     */
    initRouter() {
        spaLog('initRouter() called at:', new Date().toISOString());
        spaLog('Current state:', {
            authReady: this.authReady,
            currentRoute: this.currentRoute,
            hash: window.location.hash
        });

        // Store bound event handlers for cleanup
        this._boundHandlers = {
            hashchange: null,
            popstate: null,
            click: null,
            keydown: null
        };

        // Store view-specific cleanup functions
        this._viewCleanupCallbacks = [];

        // Create bound handlers for proper cleanup
        this._boundHandlers.hashchange = (e) => {
            const newHash = window.location.hash || '#/';
            spaLog('hashchange event triggered, hash:', newHash);

            if (this._lastNavigatedHash === newHash) {
                spaLog('Skipping hashchange - same hash already processed via navigate()');
                this._lastNavigatedHash = null;
                return;
            }

            if (this._lastNavigatedHash && this._lastNavigatedHash !== newHash) {
                this._lastNavigatedHash = null;
            }

            if (this._navigationDebounceTimer) {
                clearTimeout(this._navigationDebounceTimer);
            }

            this._navigationDebounceTimer = setTimeout(() => {
                const currentHash = window.location.hash || '#/';
                if (currentHash !== newHash) {
                    spaLog('Hash changed during debounce, skipping stale navigation');
                    return;
                }

                if (!this._isNavigating) {
                    this.handleRoute();
                } else {
                    spaLog('Cancelling in-progress navigation for new hashchange');
                    this._isNavigating = false;
                    this.handleRoute();
                }
            }, 10);
        };

        this._boundHandlers.popstate = (e) => {
            spaLog('popstate event triggered, state:', e.state);

            // Restore scroll position for back/forward navigation
            const path = (window.location.hash || '#/').replace('#', '');
            if (e.state && e.state.scrollPosition) {
                // Use stored position from state
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: e.state.scrollPosition.y,
                        left: e.state.scrollPosition.x,
                        behavior: 'instant'
                    });
                });
            }

            if (this._isNavigating) {
                spaLog('Cancelling in-progress navigation for popstate');
                this._isNavigating = false;
            }
            this.handleRoute(true); // true = isPopState
        };

        this._boundHandlers.click = (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                spaLog('Intercepted link click, href:', href);
                e.preventDefault();
                e.stopPropagation();
                this.navigate(href);
            }
        };

        // Keyboard navigation handler
        this._boundHandlers.keydown = (e) => {
            // Alt + Left Arrow = Back
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goBack();
            }
            // Alt + Right Arrow = Forward
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                window.history.forward();
            }
            // Alt + Home = Go to home
            if (e.altKey && e.key === 'Home') {
                e.preventDefault();
                this.navigate('#/');
            }
        };

        window.addEventListener('hashchange', this._boundHandlers.hashchange);
        window.addEventListener('popstate', this._boundHandlers.popstate);
        document.addEventListener('click', this._boundHandlers.click, true);
        document.addEventListener('keydown', this._boundHandlers.keydown);

        spaLog('Event listeners registered (hashchange, popstate, click, keydown)');

        // Initialize accessibility features
        this._initAccessibility();

        // Initial route
        spaLog('Triggering initial route handler...');
        this.handleRoute();

        spaLog('initRouter() completed');
    }

    /**
     * Initialize accessibility features
     */
    _initAccessibility() {
        // Create ARIA live region for route announcements
        if (!document.getElementById('spa-route-announcer')) {
            const announcer = document.createElement('div');
            announcer.id = 'spa-route-announcer';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            announcer.style.cssText = `
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            `;
            document.body.appendChild(announcer);
        }

        // Create loading announcer
        if (!document.getElementById('spa-loading-announcer')) {
            const loadingAnnouncer = document.createElement('div');
            loadingAnnouncer.id = 'spa-loading-announcer';
            loadingAnnouncer.setAttribute('role', 'status');
            loadingAnnouncer.setAttribute('aria-live', 'assertive');
            loadingAnnouncer.setAttribute('aria-atomic', 'true');
            loadingAnnouncer.className = 'sr-only';
            loadingAnnouncer.style.cssText = `
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            `;
            document.body.appendChild(loadingAnnouncer);
        }
    }

    /**
     * Announce route change to screen readers
     */
    _announceRouteChange(path) {
        const announcer = document.getElementById('spa-route-announcer');
        if (!announcer) return;

        // Determine route name for announcement
        let routeName = 'Page';
        for (const [key, pattern] of Object.entries(this.routes)) {
            if (pattern.test(path)) {
                routeName = this._routeNames[key] || key;
                break;
            }
        }

        // Build announcement message
        const message = `Navigated to ${routeName}`;

        // Clear and set to trigger announcement
        announcer.textContent = '';
        requestAnimationFrame(() => {
            announcer.textContent = message;
        });
    }

    /**
     * Announce loading state to screen readers
     */
    _announceLoading(isLoading, message = 'Loading page') {
        const announcer = document.getElementById('spa-loading-announcer');
        if (!announcer) return;

        announcer.textContent = '';
        if (isLoading) {
            requestAnimationFrame(() => {
                announcer.textContent = message;
            });
        }
    }

    /**
     * Manage focus after navigation for accessibility
     */
    _manageFocusAfterNavigation() {
        // Find the main content area
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Find the first focusable element or heading in main content
        const focusTarget = mainContent.querySelector('h1, h2, [tabindex="-1"], a, button, input');

        if (focusTarget) {
            // Make heading focusable if it's a heading without tabindex
            if (focusTarget.tagName.match(/^H[1-6]$/) && !focusTarget.hasAttribute('tabindex')) {
                focusTarget.setAttribute('tabindex', '-1');
            }

            // Delay focus slightly to ensure content is rendered
            requestAnimationFrame(() => {
                focusTarget.focus({ preventScroll: true });
            });
        }
    }

    /**
     * Navigate to a route
     */
    navigate(path, options = {}) {
        if (!path.startsWith('#')) {
            path = '#' + path;
        }

        path = this.normalizePath(path);
        spaLog('Navigating to:', path);

        // Save current scroll position before navigating
        const currentPath = (window.location.hash || '#/').replace('#', '');
        ScrollManager.save(currentPath);

        // Save scroll position to history state
        const scrollPosition = { x: window.scrollX, y: window.scrollY };
        window.history.replaceState({ scrollPosition }, '', window.location.hash);

        this._lastNavigatedHash = path;

        const currentHash = window.location.hash || '#/';
        if (currentHash === path) {
            spaLog('Already at this path, forcing route refresh');
            this._isNavigating = false;
            this.handleRoute();
            return;
        }

        // Release any stale lock so handleRoute() can acquire it
        this._isNavigating = false;

        if (options.replace) {
            window.history.replaceState({ scrollPosition: { x: 0, y: 0 } }, '', path);
            this.handleRoute();
        } else {
            // Use pushState to update URL — this does NOT trigger hashchange.
            // Avoid also setting window.location.hash which would fire a
            // duplicate hashchange event and potentially double-navigate.
            window.history.pushState({ scrollPosition: { x: 0, y: 0 } }, '', path);
            this.handleRoute();
        }
    }

    /**
     * Normalize path to consistent format
     */
    normalizePath(path) {
        if (path !== '#/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        if (path === '#') {
            path = '#/';
        } else if (path.startsWith('#') && !path.startsWith('#/')) {
            path = '#/' + path.slice(1);
        }
        return path;
    }

    /**
     * Handle current route with transitions and metrics
     */
    async handleRoute(isPopState = false) {
        // Prevent concurrent route handling (race condition guard)
        if (this._isNavigating) {
            spaLog('Route handling already in progress, skipping');
            return;
        }

        // Acquire navigation lock
        this._isNavigating = true;
        const navigationId = Date.now() + Math.random();
        this._currentNavigationId = navigationId;
        this._activeNavigationId = navigationId;

        // Auto-release navigation lock after 10 seconds to prevent permanent stuck state
        const lockTimeout = setTimeout(() => {
            if (this._isNavigating && this._currentNavigationId === navigationId) {
                spaLog('WARNING: Navigation lock auto-released after 10s timeout');
                this._isNavigating = false;
                this._activeNavigationId = null;
            }
        }, 10000);

        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');

        // Start metrics tracking
        const metric = NavigationMetrics.startNavigation(path);

        spaLog(`handleRoute() called for path: ${path}`);

        // Announce loading state
        this._announceLoading(true, 'Loading page content');

        // Dispatch navigation-start event for loading indicators
        document.dispatchEvent(new CustomEvent('navigation-start', {
            detail: { path, timestamp: Date.now() }
        }));

        // Track page view
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackPageView(path);
        }

        if (this.currentRoute && window.AnalyticsManager) {
            window.AnalyticsManager.trackNavigation(this.currentRoute, path);
        }

        const mainContent = document.getElementById('main-content');

        // Protected routes check
        const protectedRoutes = ['dashboard'];
        const isProtectedRoute = protectedRoutes.some(route => path.includes(route));

        if (isProtectedRoute) {
            if (!this.authReady) {
                spaLog('Auth not ready for protected route, showing loading state...');
                this.showAuthWaitingState(mainContent);
                this._isNavigating = false;
                this._activeNavigationId = null;
                NavigationMetrics.recordPhase(metric, 'authWait');
                return;
            }

            const currentUser = firebase.auth().currentUser;
            spaLog('Firebase currentUser:', currentUser ? currentUser.email : 'null');

            // Let renderDashboard() handle unauthenticated users —
            // it shows a proper "Sign In Required" message instead of a stuck spinner
            if (currentUser) {
                spaLog('Auth checks passed for protected route');
            } else {
                spaLog('No user for protected route, letting view handle auth prompt');
            }
        } else {
            spaLog('Public route - proceeding without auth check');
        }

        if (this._currentNavigationId !== navigationId) {
            spaLog('Navigation superseded by newer request, aborting');
            return;
        }

        NavigationMetrics.recordPhase(metric, 'authCheck');

        // Run cleanup for previous view before rendering new content
        this._runViewCleanup();

        // Add to history
        this.addToHistory(path);

        // Apply exit transition
        if (this._transitionEnabled && mainContent) {
            await this._applyExitTransition(mainContent);
        }

        NavigationMetrics.recordPhase(metric, 'cleanup');

        // Show loading with transition
        this.showLoading();

        try {
            spaLog('Matching route pattern for path:', path);

            // Match and render route
            if (this.routes.home.test(path)) {
                spaLog('Matched HOME route');
                await this.renderHome();
            } else if (this.routes.mythologies.test(path)) {
                spaLog('Matched MYTHOLOGIES route');
                await this.renderMythologies();
            } else if (this.routes.browse_category_mythology.test(path)) {
                const match = path.match(this.routes.browse_category_mythology);
                spaLog('Matched BROWSE CATEGORY+MYTHOLOGY route:', match[1], match[2]);
                await this.renderBrowseCategory(match[1], match[2]);
            } else if (this.routes.browse_category.test(path)) {
                const match = path.match(this.routes.browse_category);
                spaLog('Matched BROWSE CATEGORY route:', match[1]);
                await this.renderBrowseCategory(match[1]);
            } else if (this.routes.entity_simple.test(path)) {
                // 2-param format: #/entity/collection/id (e.g., #/entity/deities/zeus)
                const match = path.match(this.routes.entity_simple);
                const collection = this.getCollectionName(match[1]);
                spaLog('Matched ENTITY (simple 2-param) route:', collection, match[2]);
                // Check for prefetched data for instant navigation
                const prefetched = window.LinkPrefetcher?.get(`entity/${match[1]}/${match[2]}`);
                if (prefetched) spaLog('Using prefetched entity data - instant load!');
                // No mythology in URL, pass null - renderEntity will extract from entity data
                await this.renderEntity(null, collection, match[2], prefetched);
            } else if (this.routes.entity_alt.test(path)) {
                // 3-param format: #/entity/collection/mythology/id
                const match = path.match(this.routes.entity_alt);
                const collection = this.getCollectionName(match[1]);
                spaLog('Matched ENTITY (alt format) route:', match[3]);
                const prefetched = window.LinkPrefetcher?.get(`entity/${match[1]}/${match[2]}/${match[3]}`);
                if (prefetched) spaLog('Using prefetched entity data - instant load!');
                await this.renderEntity(match[2], collection, match[3], prefetched);
            } else if (this.routes.entity.test(path)) {
                // 3-param format: #/mythology/mythology/type/id
                const match = path.match(this.routes.entity);
                const collection = this.getCollectionName(match[2]);
                spaLog('Matched ENTITY route:', match[3]);
                const prefetched = window.LinkPrefetcher?.get(`mythology/${match[1]}/${match[2]}/${match[3]}`);
                if (prefetched) spaLog('Using prefetched entity data - instant load!');
                await this.renderEntity(match[1], collection, match[3], prefetched);
            } else if (this.routes.category.test(path)) {
                const match = path.match(this.routes.category);
                spaLog('Matched CATEGORY route:', match[2]);
                await this.renderCategory(match[1], match[2]);
            } else if (this.routes.mythology.test(path)) {
                const match = path.match(this.routes.mythology);
                const mythologyId = match[1];
                // Validate mythology ID: reject "undefined", empty, or IDs with special characters
                if (!mythologyId || mythologyId === 'undefined' || mythologyId === 'null' || /[^a-zA-Z0-9_-]/.test(mythologyId)) {
                    spaWarn('Invalid mythology ID:', mythologyId);
                    const mainContent = document.getElementById('main-content');
                    if (mainContent) {
                        mainContent.innerHTML = this.getErrorHTML(
                            'Mythology Not Found',
                            'The requested mythology could not be found. Please check the URL and try again.'
                        );
                    }
                } else {
                    spaLog('Matched MYTHOLOGY route:', mythologyId);
                    await this.renderMythology(mythologyId);
                }
            } else if (this.routes.search.test(path)) {
                spaLog('Matched SEARCH route');
                await this.renderSearch();
            } else if (this.routes.corpus_explorer.test(path)) {
                spaLog('Matched CORPUS EXPLORER route - redirecting to standalone page');
                this._isNavigating = false;
                window.location.href = 'corpus-explorer.html';
                return;
            } else if (this.routes.compare.test(path)) {
                spaLog('Matched COMPARE route');
                await this.renderCompare();
            } else if (this.routes.dashboard.test(path)) {
                spaLog('Matched DASHBOARD route');
                await this.renderDashboard();
            } else if (this.routes.about.test(path)) {
                spaLog('Matched ABOUT route');
                await this.renderAbout();
            } else if (this.routes.privacy.test(path)) {
                spaLog('Matched PRIVACY route');
                await this.renderPrivacy();
            } else if (this.routes.terms.test(path)) {
                spaLog('Matched TERMS route');
                await this.renderTerms();
            } else if (this.routes.guidelines.test(path)) {
                spaLog('Matched GUIDELINES route - rendering about page');
                await this.renderAbout();
            } else if (this.routes.user_profile.test(path)) {
                const match = path.match(this.routes.user_profile);
                spaLog('Matched USER PROFILE route:', match[1]);
                await this.renderUserProfile(match[1]);
            } else {
                spaLog('No route matched, rendering 404');
                await this.render404(path);
            }

            NavigationMetrics.recordPhase(metric, 'render');

            // Apply enter transition
            if (this._transitionEnabled && mainContent) {
                await this._applyEnterTransition(mainContent);
            }

            NavigationMetrics.recordPhase(metric, 'transition');

            // Update breadcrumb
            this.updateBreadcrumb(path);

            // Store current route
            this.currentRoute = path;
            spaLog('Route rendered successfully:', path);

            // Announce route change to screen readers
            this._announceRouteChange(path);
            this._announceLoading(false);

            // Manage focus after navigation
            this._manageFocusAfterNavigation();

            // Restore scroll position for back/forward, scroll to top for new nav
            if (isPopState) {
                ScrollManager.restore(path, false); // instant for back/forward
            } else {
                // Scroll to top for new navigations
                requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            // Reset retry attempts on success
            this._retryAttempts = 0;

            // Finish metrics
            NavigationMetrics.finishNavigation(metric);

        } catch (error) {
            spaError('Routing error:', error);
            NavigationMetrics.recordPhase(metric, 'error');

            // Attempt retry with backoff
            if (this._retryAttempts < this._maxRetryAttempts) {
                this._retryAttempts++;
                const delay = Math.pow(2, this._retryAttempts) * 500;
                spaLog(`Retrying navigation in ${delay}ms (attempt ${this._retryAttempts}/${this._maxRetryAttempts})`);

                this._isNavigating = false;
                setTimeout(() => this.handleRoute(), delay);
                return;
            }

            this.renderError(error, path);
            this._announceLoading(false);

            // Dispatch first-render-complete to prevent stuck loading states
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'error', path: path, error: error.message, timestamp: Date.now() }
            }));

            NavigationMetrics.finishNavigation(metric);
        } finally {
            clearTimeout(lockTimeout);
            if (this._currentNavigationId === navigationId) {
                this._isNavigating = false;
                this._activeNavigationId = null;
            }
        }
    }

    /**
     * Apply exit transition to content
     */
    async _applyExitTransition(element) {
        if (!element) return;

        // Delegate to TransitionManager if available for centralized control
        if (window.TransitionManager && window.TransitionManager.isEnabled()) {
            return window.TransitionManager.applyExitTransition(element);
        }

        return new Promise(resolve => {
            element.classList.add('spa-transition-exit');

            requestAnimationFrame(() => {
                element.classList.add('spa-transition-exit-active');

                const handleTransitionEnd = () => {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element.classList.remove('spa-transition-exit', 'spa-transition-exit-active');
                    resolve();
                };

                element.addEventListener('transitionend', handleTransitionEnd);

                // Fallback timeout in case transition doesn't fire
                setTimeout(() => {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element.classList.remove('spa-transition-exit', 'spa-transition-exit-active');
                    resolve();
                }, 300);
            });
        });
    }

    /**
     * Apply enter transition to content
     */
    async _applyEnterTransition(element) {
        if (!element) return;

        // Delegate to TransitionManager if available for centralized control
        if (window.TransitionManager && window.TransitionManager.isEnabled()) {
            return window.TransitionManager.applyEnterTransition(element);
        }

        return new Promise(resolve => {
            element.classList.add('spa-transition-enter');

            // Force reflow
            void element.offsetHeight;

            requestAnimationFrame(() => {
                element.classList.add('spa-transition-enter-active');

                const handleTransitionEnd = () => {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element.classList.remove('spa-transition-enter', 'spa-transition-enter-active');
                    resolve();
                };

                element.addEventListener('transitionend', handleTransitionEnd);

                // Fallback timeout
                setTimeout(() => {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element.classList.remove('spa-transition-enter', 'spa-transition-enter-active');
                    resolve();
                }, 350);
            });
        });
    }

    /**
     * Check if the current render operation should continue
     */
    isNavigationValid() {
        return this._activeNavigationId === this._currentNavigationId;
    }

    /**
     * Render home page
     */
    async renderHome() {
        spaLog('renderHome() called');

        const mainContent = document.getElementById('main-content');

        if (!mainContent) {
            spaError('CRITICAL: main-content element not found!');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: { route: 'home', error: 'main-content element not found', timestamp: Date.now() }
            }));
            return;
        }

        mainContent.innerHTML = this.getLoadingHTML('Loading home page...');

        if (typeof LandingPageView !== 'undefined') {
            spaLog('LandingPageView class available, using it...');
            try {
                const landingView = new LandingPageView(this.db);
                await landingView.render(mainContent);

                if (!this.isNavigationValid()) {
                    spaLog('renderHome: Navigation superseded after LandingPageView render, aborting');
                    return;
                }

                spaLog('Landing page rendered via LandingPageView');
                document.dispatchEvent(new CustomEvent('first-render-complete', {
                    detail: { route: 'home', renderer: 'LandingPageView', timestamp: Date.now() }
                }));
                return;
            } catch (error) {
                spaError('LandingPageView.render() failed:', error);
                if (!this.isNavigationValid()) {
                    spaLog('renderHome: Navigation superseded after error, aborting fallback');
                    return;
                }
            }
        } else {
            spaWarn('LandingPageView NOT available - will try fallbacks');
        }

        if (typeof PageAssetRenderer !== 'undefined') {
            spaLog('PageAssetRenderer class available, trying...');
            try {
                const renderer = new PageAssetRenderer(this.db);
                const pageData = await renderer.loadPage('home');

                if (!this.isNavigationValid()) {
                    spaLog('renderHome: Navigation superseded during PageAssetRenderer load, aborting');
                    return;
                }

                if (pageData) {
                    spaLog('Home page data loaded from Firebase');
                    await renderer.renderPage('home', mainContent);

                    if (!this.isNavigationValid()) {
                        spaLog('renderHome: Navigation superseded after PageAssetRenderer render, aborting');
                        return;
                    }

                    spaLog('Home page rendered via PageAssetRenderer');
                    document.dispatchEvent(new CustomEvent('first-render-complete', {
                        detail: { route: 'home', renderer: 'PageAssetRenderer', timestamp: Date.now() }
                    }));
                    return;
                } else {
                    spaLog('Home page not found in Firebase, falling back to HomeView');
                }
            } catch (error) {
                spaWarn('PageAssetRenderer failed, falling back to HomeView:', error);
                if (!this.isNavigationValid()) return;
            }
        }

        if (typeof HomeView !== 'undefined') {
            spaLog('HomeView class available, using it...');
            const homeView = new HomeView(this.db);
            await homeView.render(mainContent);

            if (!this.isNavigationValid()) {
                spaLog('renderHome: Navigation superseded after HomeView render, aborting');
                return;
            }

            spaLog('Home page rendered via HomeView');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'home', renderer: 'HomeView', timestamp: Date.now() }
            }));
            return;
        }

        // Fallback inline rendering
        spaWarn('Using inline fallback rendering (no HomeView or PageAssetRenderer)');
        this._renderFallbackHome(mainContent);
    }

    /**
     * Fallback home page rendering
     */
    _renderFallbackHome(mainContent) {
        const mythologies = [
            { id: 'greek', name: 'Greek', icon: 'temple', color: '#4A90E2' },
            { id: 'norse', name: 'Norse', icon: 'sword', color: '#7C4DFF' },
            { id: 'egyptian', name: 'Egyptian', icon: 'pyramid', color: '#FFB300' },
            { id: 'hindu', name: 'Hindu', icon: 'om', color: '#E91E63' },
            { id: 'chinese', name: 'Chinese', icon: 'dragon', color: '#F44336' },
            { id: 'japanese', name: 'Japanese', icon: 'torii', color: '#FF5722' },
            { id: 'celtic', name: 'Celtic', icon: 'shamrock', color: '#4CAF50' },
            { id: 'babylonian', name: 'Babylonian', icon: 'vessel', color: '#795548' }
        ];

        mainContent.innerHTML = `
            <div class="home-container">
                <div class="hero-section">
                    <h1 class="hero-title">Explore World Mythologies</h1>
                    <p class="hero-subtitle">Discover deities, heroes, creatures, and sacred texts from cultures across the globe</p>
                </div>
                <div class="mythologies-grid">
                    ${mythologies.map(myth => `
                        <a href="#/mythology/${myth.id}" class="mythology-card" data-mythology="${myth.id}">
                            <h3 class="myth-name">${myth.name}</h3>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;

        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: { route: 'home', renderer: 'inline-fallback', timestamp: Date.now() }
        }));
    }

    /**
     * Retry helper with exponential backoff
     */
    async _retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries - 1) {
                    const delay = baseDelay * Math.pow(2, attempt);
                    spaLog(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }

    async loadMythologyCounts(mythologies) {
        const collections = ['deities', 'heroes', 'creatures', 'texts', 'places', 'items'];

        for (const myth of mythologies) {
            let totalCount = 0;

            for (const collection of collections) {
                try {
                    const snapshot = await this._retryWithBackoff(async () => {
                        return await this.db.collection(collection)
                            .where('mythology', '==', myth.id)
                            .get();
                    });
                    totalCount += snapshot.size;
                } catch (error) {
                    spaError(`Error loading count for ${myth.id} after retries:`, error);
                }
            }

            const countEl = document.getElementById(`count-${myth.id}`);
            if (countEl) {
                countEl.textContent = `${totalCount} entities`;
            }
        }
    }

    async loadFeaturedEntities() {
        const container = document.getElementById('featured-entities');
        if (!container) return;

        try {
            const snapshot = await this._retryWithBackoff(async () => {
                return await this.db.collection('deities')
                    .where('importance', '>=', 90)
                    .orderBy('importance', 'desc')
                    .limit(12)
                    .get();
            });

            const entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (entities.length > 0) {
                if (this.renderer && typeof this.renderer.render === 'function') {
                    try {
                        const html = this.renderer.render(entities, 'grid');
                        if (typeof html === 'string') {
                            container.innerHTML = html;
                        } else {
                            container.innerHTML = '<p>Featured entities loaded</p>';
                        }
                    } catch (renderError) {
                        spaWarn('Renderer failed for featured entities:', renderError.message);
                        container.innerHTML = '<p>Featured entities available</p>';
                    }
                } else {
                    container.innerHTML = '<p>Featured entities available</p>';
                }
            } else {
                container.innerHTML = '<p>No featured entities found</p>';
            }
        } catch (error) {
            spaError('Error loading featured entities after retries:', error);
            container.innerHTML = '<p class="error">Error loading featured entities</p>';
        }
    }

    async renderMythologies() {
        spaLog('renderMythologies() called');
        const mainContent = document.getElementById('main-content');

        try {
            if (!mainContent) {
                spaError('CRITICAL: main-content element not found for mythologies!');
                return;
            }

            if (typeof MythologiesView !== 'undefined') {
                const mythologiesView = new MythologiesView(this.db);
                await mythologiesView.render(mainContent);
                spaLog('Mythologies grid rendered');
            } else {
                // Attempt dynamic script load as fallback
                spaError('MythologiesView class not found, attempting dynamic load');
                try {
                    await Promise.race([
                        new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = 'js/views/mythologies-view.js';
                            script.onload = resolve;
                            script.onerror = reject;
                            document.head.appendChild(script);
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Script load timeout')), 3000))
                    ]);
                    if (typeof MythologiesView !== 'undefined') {
                        const mythologiesView = new MythologiesView(this.db);
                        await mythologiesView.render(mainContent);
                        spaLog('Mythologies grid rendered (dynamic load)');
                        return;
                    }
                } catch (e) {
                    spaError('Dynamic load of MythologiesView failed:', e);
                }
                mainContent.innerHTML = `<div class="error-page"><h1>Unable to load Mythologies</h1><p>Please try refreshing the page.</p></div>`;
            }
        } finally {
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'mythologies', timestamp: Date.now() }
            }));
        }
    }

    async renderBrowseCategory(category, mythology = null) {
        spaLog(`renderBrowseCategory() called: ${category}${mythology ? ` (${mythology})` : ''}`);
        const mainContent = document.getElementById('main-content');

        if (!mainContent) {
            spaError('CRITICAL: main-content element not found for browse category!');
            return;
        }

        if (typeof BrowseCategoryView !== 'undefined') {
            try {
                const browseView = new BrowseCategoryView(this.db);
                await browseView.render(mainContent, { category, mythology });
                spaLog('Browse category rendered');
            } catch (error) {
                spaError('BrowseCategoryView render failed:', error);
                mainContent.innerHTML = this.getErrorHTML(
                    `Failed to Load ${category}`,
                    error.message || 'An unexpected error occurred while loading this category.'
                );
            }
        } else {
            spaError('BrowseCategoryView class not found, using basic fallback');
            try {
                mainContent.innerHTML = await this.renderBasicCategoryPage(mythology || '', category);
            } catch (fallbackError) {
                mainContent.innerHTML = this.getErrorHTML('Browse View not available', 'The browse view could not be loaded.');
            }
        }
    }

    async renderMythology(mythologyId) {
        spaLog('renderMythology() called');

        try {
            const mainContent = document.getElementById('main-content');

            if (!mainContent) {
                spaError('CRITICAL: main-content element not found for mythology render!');
                return;
            }

            if (typeof MythologyOverview !== 'undefined') {
                spaLog('MythologyOverview class available, using it...');
                try {
                    const mythologyView = new MythologyOverview({ db: this.db, router: this });
                    const html = await mythologyView.render({ mythology: mythologyId });
                    mainContent.innerHTML = html;
                    mainContent.classList.remove('has-skeleton', 'content-loading', 'fade-out', 'transitioning');
                    mainContent.classList.add('content-loaded');
                    mythologyView.attachEventListeners();
                    spaLog('Mythology page rendered via MythologyOverview');
                } catch (overviewError) {
                    spaError('MythologyOverview render failed, falling back:', overviewError);
                    mainContent.innerHTML = await this.renderBasicMythologyPage(mythologyId);
                    spaLog('Mythology page rendered (basic fallback after MythologyOverview error)');
                }
            } else {
                spaLog('MythologyOverview not available, trying PageAssetRenderer...');
                if (typeof PageAssetRenderer !== 'undefined') {
                    const renderer = new PageAssetRenderer(this.db);
                    const pageData = await renderer.loadPage(`mythology-${mythologyId}`);
                    if (pageData) {
                        await renderer.renderPage(`mythology-${mythologyId}`, mainContent);
                        spaLog('Mythology page rendered via PageAssetRenderer');
                    } else {
                        mainContent.innerHTML = await this.renderBasicMythologyPage(mythologyId);
                        spaLog('Mythology page rendered (basic fallback)');
                    }
                } else {
                    mainContent.innerHTML = await this.renderBasicMythologyPage(mythologyId);
                    spaLog('Mythology page rendered (basic fallback)');
                }
            }
        } catch (error) {
            spaError('Mythology page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: { route: 'mythology', mythologyId: mythologyId, error: error.message, timestamp: Date.now() }
            }));
            throw error;
        } finally {
            // Ensure skeleton classes are always cleaned up
            const mc = document.getElementById('main-content');
            if (mc) {
                mc.classList.remove('has-skeleton', 'content-loading', 'fade-out', 'transitioning');
                mc.classList.add('content-loaded');
            }
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'mythology', mythologyId: mythologyId, timestamp: Date.now() }
            }));
        }
    }

    async renderBasicMythologyPage(mythologyId) {
        const mythologies = {
            'greek': { name: 'Greek', color: '#4A90E2' },
            'norse': { name: 'Norse', color: '#7C4DFF' },
            'egyptian': { name: 'Egyptian', color: '#FFB300' },
            'hindu': { name: 'Hindu', color: '#E91E63' },
            'chinese': { name: 'Chinese', color: '#F44336' },
            'japanese': { name: 'Japanese', color: '#FF5722' },
            'celtic': { name: 'Celtic', color: '#4CAF50' },
            'babylonian': { name: 'Babylonian', color: '#795548' },
            'sumerian': { name: 'Sumerian', color: '#9E9E9E' },
            'persian': { name: 'Persian', color: '#00BCD4' },
            'roman': { name: 'Roman', color: '#673AB7' },
            'aztec': { name: 'Aztec', color: '#FF9800' },
            'mayan': { name: 'Mayan', color: '#8BC34A' },
            'buddhist': { name: 'Buddhist', color: '#FFEB3B' },
            'christian': { name: 'Christian', color: '#2196F3' },
            'yoruba': { name: 'Yoruba', color: '#9C27B0' },
            'aboriginal': { name: 'Aboriginal', color: '#D84315' },
            'slavic': { name: 'Slavic', color: '#5D4037' },
            'polynesian': { name: 'Polynesian', color: '#00897B' },
            'korean': { name: 'Korean', color: '#1565C0' },
            'finnish': { name: 'Finnish', color: '#558B2F' },
            'incan': { name: 'Incan', color: '#F9A825' },
            'mesopotamian': { name: 'Mesopotamian', color: '#6D4C41' },
            'islamic': { name: 'Islamic', color: '#1B5E20' },
            'african': { name: 'African', color: '#BF360C' },
            'native american': { name: 'Native American', color: '#827717' }
        };

        const myth = mythologies[mythologyId] || { name: mythologyId, color: '#666' };
        const entityTypes = ['deities', 'heroes', 'creatures', 'items', 'places', 'texts', 'rituals', 'herbs', 'symbols', 'cosmology', 'magic'];
        const counts = {};
        let totalCount = 0;

        const mythLower = mythologyId.toLowerCase();
        await Promise.all(entityTypes.map(async (type) => {
            try {
                // Try exact match first (most common case)
                let snapshot = await this.db.collection(type)
                    .where('mythology', '==', mythologyId)
                    .get();
                // If no results, fetch all and filter client-side (handles inconsistent casing)
                if (snapshot.empty) {
                    snapshot = await this.db.collection(type).get();
                    counts[type] = snapshot.docs.filter(doc => {
                        const m = (doc.data().mythology || '').toLowerCase();
                        return m === mythLower || m.startsWith(mythLower);
                    }).length;
                } else {
                    counts[type] = snapshot.size;
                }
                totalCount += counts[type];
            } catch (error) {
                spaError(`Error loading count for ${type}:`, error);
                counts[type] = 0;
            }
        }));

        return `
            <div class="mythology-page" style="--myth-color: ${myth.color};">
                <div class="mythology-hero" style="text-align: center; padding: 3rem 1rem; background: linear-gradient(135deg, ${myth.color}22 0%, transparent 100%);">
                    <h1 style="font-size: 3rem; margin-bottom: 0.5rem; color: ${myth.color};">${myth.name.replace(/\s*Mythology$/i, '')} Mythology</h1>
                    <p style="font-size: 1.2rem; opacity: 0.8;">Explore ${totalCount} entities from the ${myth.name.replace(/\s*Mythology$/i, '')} tradition</p>
                </div>
                <div class="mythology-categories" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                    ${entityTypes.filter(type => counts[type] > 0).map(type => `
                        <a href="#/browse/${type}/${mythologyId}" class="category-card" style="text-decoration: none; padding: 1.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; transition: all 0.3s;">
                            <h3 style="color: ${myth.color}; margin-bottom: 0.5rem; text-transform: capitalize;">${type}</h3>
                            <p style="opacity: 0.7; margin: 0;">${counts[type]} ${type}</p>
                        </a>
                    `).join('')}
                </div>
                ${totalCount === 0 ? `
                    <div style="text-align: center; padding: 3rem; opacity: 0.6;">
                        <p>No entities available for this mythology yet. Check back soon!</p>
                        <a href="#/" class="btn-primary" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: ${myth.color}; color: white; text-decoration: none; border-radius: 4px;">Browse All Mythologies</a>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async renderCategory(mythology, category) {
        spaLog('renderCategory() called');

        try {
            const mainContent = document.getElementById('main-content');

            if (!mainContent) {
                spaError('CRITICAL: main-content element not found for category render!');
                return;
            }

            if (typeof BrowseCategoryView !== 'undefined') {
                spaLog('BrowseCategoryView class available, using it...');
                const browseView = new BrowseCategoryView(this.db);
                await browseView.render(mainContent, { category, mythology });
                spaLog('Category page rendered via BrowseCategoryView');
            } else {
                spaLog('BrowseCategoryView not available, using basic fallback...');
                mainContent.innerHTML = await this.renderBasicCategoryPage(mythology, category);
                spaLog('Category page rendered (basic fallback)');
            }

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'category', mythology: mythology, category: category, timestamp: Date.now() }
            }));
        } catch (error) {
            spaError('Category page render failed:', error);
            throw error;
        }
    }

    async renderBasicCategoryPage(mythology, category) {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

        let entities = [];
        const mythLower = mythology.toLowerCase();
        try {
            // Try exact match first
            let snapshot = await this.db.collection(category)
                .where('mythology', '==', mythology)
                .get();
            // If no results, fetch all and filter client-side (handles inconsistent casing)
            if (snapshot.empty) {
                snapshot = await this.db.collection(category).get();
                entities = snapshot.docs
                    .filter(doc => {
                        const m = (doc.data().mythology || '').toLowerCase();
                        return m === mythLower || m.startsWith(mythLower);
                    })
                    .map(doc => ({ id: doc.id, ...doc.data() }));
            } else {
                entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        } catch (error) {
            spaError(`Error loading ${category} for ${mythology}:`, error);
        }

        return `
            <div class="category-page">
                <div class="category-hero" style="text-align: center; padding: 2rem 1rem;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">${categoryName}</h1>
                    <p style="font-size: 1.2rem; opacity: 0.8;">${mythology.charAt(0).toUpperCase() + mythology.slice(1)} Mythology</p>
                    <p style="opacity: 0.7;">${entities.length} ${entities.length === 1 ? category.slice(0, -1) : category}</p>
                </div>
                ${entities.length > 0 ? `
                    <div class="entity-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                        ${entities.map(entity => `
                            <a href="#/mythology/${mythology}/${category}/${entity.id}" class="entity-card" style="text-decoration: none; padding: 1.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; transition: all 0.3s;">
                                <h3 style="color: var(--color-primary); margin-bottom: 0.5rem; font-size: 1.25rem;">${this.escapeHtml(entity.name || entity.title || 'Unnamed')}</h3>
                                ${entity.description ? `<p style="opacity: 0.7; font-size: 0.9rem; margin: 0;">${this.escapeHtml(entity.description.substring(0, 100))}${entity.description.length > 100 ? '...' : ''}</p>` : ''}
                            </a>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 3rem; opacity: 0.6;">
                        <p>No ${category} found for ${mythology} mythology yet.</p>
                        <a href="#/mythology/${mythology}" class="btn-secondary" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px;">Back to ${mythology.charAt(0).toUpperCase() + mythology.slice(1)} Mythology</a>
                    </div>
                `}
            </div>
        `;
    }

    async renderEntity(mythology, categoryType, entityId, prefetchedData = null) {
        spaLog('renderEntity() called');

        try {
            const mainContent = document.getElementById('main-content');

            if (!mainContent) {
                spaError('CRITICAL: main-content element not found for entity render!');
                return;
            }

            // Check for prefetched data from various sources
            if (!prefetchedData) {
                prefetchedData = RoutePreloader.getCached(`mythology/${mythology}/${categoryType}/${entityId}`);
            }
            if (!prefetchedData && window.LinkPrefetcher) {
                prefetchedData = window.LinkPrefetcher.get(`entity/${categoryType}/${entityId}`);
            }

            if (prefetchedData) {
                spaLog('Using prefetched entity data - instant render!');
            }

            if (typeof FirebaseEntityRenderer !== 'undefined') {
                spaLog('FirebaseEntityRenderer class available, using it...');
                const entityRenderer = new FirebaseEntityRenderer();
                // Pass prefetched data to skip Firestore fetch if available
                await entityRenderer.loadAndRender(categoryType, entityId, mythology, mainContent, prefetchedData);
                spaLog('Entity page rendered via FirebaseEntityRenderer');
            } else {
                spaLog('FirebaseEntityRenderer not available, using basic fallback...');
                mainContent.innerHTML = await this.renderBasicEntityPage(mythology, categoryType, entityId, prefetchedData);
                spaLog('Entity page rendered (basic fallback)');
            }

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'entity', mythology, categoryType, entityId, timestamp: Date.now() }
            }));
        } catch (error) {
            spaError('Entity page render failed:', error);
            throw error;
        }
    }

    async renderBasicEntityPage(mythology, categoryType, entityId, prefetchedData = null) {
        let entity = prefetchedData;

        // If no prefetched data, fetch from Firestore
        if (!entity) {
            // Ensure we use the correct collection name (handles singular/plural)
            const collectionName = this.getCollectionName(categoryType);
            try {
                const doc = await this.db.collection(collectionName).doc(entityId).get();
                if (doc.exists) {
                    entity = { id: doc.id, ...doc.data() };
                }
            } catch (error) {
                spaError(`Error loading entity ${entityId}:`, error);
            }
        } else {
            spaLog('Using prefetched entity data for basic render');
        }

        if (!entity) {
            return `
                <div class="error-page" style="text-align: center; padding: 3rem;">
                    <h2>Entity Not Found</h2>
                    <p>The entity "${entityId}" could not be found in ${categoryType}.</p>
                    <a href="#/mythology/${mythology}/${categoryType}" class="btn-primary" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px;">Back to ${categoryType}</a>
                </div>
            `;
        }

        return `
            <div class="entity-page">
                <div class="entity-hero" style="text-align: center; padding: 2rem 1rem;">
                    <h1 style="font-size: 3rem; margin-bottom: 0.5rem;">${this.escapeHtml(entity.name || entity.title || 'Unnamed')}</h1>
                    ${entity.subtitle ? `<p style="font-size: 1.5rem; opacity: 0.8; margin-bottom: 1rem;">${this.escapeHtml(entity.subtitle)}</p>` : ''}
                    ${entity.description ? `<p style="font-size: 1.1rem; opacity: 0.9; max-width: 800px; margin: 0 auto;">${this.escapeHtml(entity.description)}</p>` : ''}
                </div>
                ${entity.content ? `
                    <div style="max-width: 900px; margin: 2rem auto; padding: 0 1rem;">
                        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 2rem;">
                            ${this.renderMarkdown(entity.content)}
                        </div>
                    </div>
                ` : ''}
                <div style="text-align: center; margin-top: 3rem; padding: 2rem; opacity: 0.7;">
                    <a href="#/mythology/${mythology}/${categoryType}" class="btn-secondary" style="display: inline-block; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px;">Back to ${categoryType}</a>
                </div>
            </div>
        `;
    }

    renderMarkdown(markdown) {
        if (!markdown) return '';
        return markdown
            .replace(/^### (.*$)/gim, '<h3 style="color: var(--color-secondary); margin: 1.5rem 0 1rem;">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 style="color: var(--color-primary); margin: 2rem 0 1rem;">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 style="margin: 2rem 0 1rem;">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p style="margin: 1rem 0;">')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async renderSearch() {
        spaLog('renderSearch() called');

        try {
            const mainContent = document.getElementById('main-content');

            if (typeof SearchViewComplete !== 'undefined') {
                spaLog('SearchViewComplete class available, using it...');
                const searchView = new SearchViewComplete(this.db);
                window.searchViewInstance = searchView;
                spaLog('Rendering SearchViewComplete...');
                await searchView.render(mainContent);
                spaLog('Search page rendered via SearchViewComplete');
                document.dispatchEvent(new CustomEvent('first-render-complete', {
                    detail: { route: 'search', renderer: 'SearchViewComplete', timestamp: Date.now() }
                }));
                return;
            }

            if (typeof EnhancedCorpusSearch !== 'undefined' || typeof CorpusSearch !== 'undefined') {
                spaLog('Falling back to basic search UI...');
                mainContent.innerHTML = `
                    <div class="search-view" style="padding: 2rem; max-width: 800px; margin: 0 auto;">
                        <h1 style="text-align: center; margin-bottom: 1rem; color: var(--color-primary, #8b7fff);">Search Mythology</h1>
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem;">
                            <input type="text" id="fallback-search-input" placeholder="Search mythology..."
                                style="flex: 1; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; font-size: 1rem;">
                            <button id="fallback-search-btn" style="padding: 0.75rem 1.5rem; border-radius: 8px; background: var(--color-primary, #8b7fff); color: white; border: none; cursor: pointer; font-size: 1rem;">Search</button>
                        </div>
                        <div id="fallback-search-results"></div>
                    </div>
                `;
                const SearchClass = typeof EnhancedCorpusSearch !== 'undefined' ? EnhancedCorpusSearch : CorpusSearch;
                const searchEngine = new SearchClass(this.db);
                const searchInput = document.getElementById('fallback-search-input');
                const searchBtn = document.getElementById('fallback-search-btn');
                const resultsDiv = document.getElementById('fallback-search-results');

                const doSearch = async () => {
                    const query = searchInput.value.trim();
                    if (!query || query.length < 2) return;
                    resultsDiv.innerHTML = '<p style="text-align:center; opacity:0.7;">Searching...</p>';
                    try {
                        const result = await searchEngine.search(query, { mode: 'generic', limit: 50 });
                        if (!result.items || result.items.length === 0) {
                            resultsDiv.innerHTML = '<p style="text-align:center; opacity:0.7;">No results found.</p>';
                        } else {
                            resultsDiv.innerHTML = result.items.map(function(entity) {
                                const name = entity.name || 'Unknown';
                                let desc = entity.description || entity.subtitle || '';
                                if (desc.length > 120) desc = desc.substring(0, 120) + '...';
                                const mythology = entity.mythology || 'unknown';
                                const type = entity.type || entity.collection || 'entity';
                                const id = entity.id || name.toLowerCase().replace(/\\s+/g, '-');
                                return '<a href="#/mythology/' + mythology + '/' + type + '/' + id + '" style="display:block; padding:1rem; margin-bottom:0.5rem; background:rgba(255,255,255,0.05); border-radius:8px; text-decoration:none; color:inherit; border:1px solid rgba(255,255,255,0.1);">' +
                                    '<strong style="color:var(--color-primary,#8b7fff);">' + name + '</strong>' +
                                    '<p style="margin:0.25rem 0 0; opacity:0.7; font-size:0.9rem;">' + desc + '</p>' +
                                    '</a>';
                            }).join('');
                        }
                    } catch (err) {
                        resultsDiv.innerHTML = '<p style="text-align:center; color:#ef4444;">Search failed: ' + err.message + '</p>';
                    }
                };

                searchBtn.addEventListener('click', doSearch);
                searchInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSearch(); });

                spaLog('Fallback search UI rendered');
                document.dispatchEvent(new CustomEvent('first-render-complete', {
                    detail: { route: 'search', renderer: 'FallbackSearch', timestamp: Date.now() }
                }));
                return;
            }

            spaError('No search component available');
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>Search Not Available</h1>
                    <p>The search component failed to load. Please refresh the page.</p>
                    <a href="#/" class="btn-primary">Return Home</a>
                </div>
            `;
        } catch (error) {
            spaError('Search page render failed:', error);
            throw error;
        }
    }

    async renderCompare() {
        spaLog('renderCompare() called');

        try {
            const mainContent = document.getElementById('main-content');

            if (typeof CompareView === 'undefined') {
                spaError('CompareView class not loaded');
                mainContent.innerHTML = `
                    <div class="error-page">
                        <h1>Error</h1>
                        <p>Compare component not loaded. Please refresh the page.</p>
                    </div>
                `;
                return;
            }

            spaLog('CompareView class available');
            const compareView = new CompareView(this.db);
            spaLog('Rendering CompareView...');
            await compareView.render(mainContent);
            spaLog('Compare page rendered successfully');
        } catch (error) {
            spaError('Compare page render failed:', error);
            throw error;
        } finally {
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'compare', timestamp: Date.now() }
            }));
        }
    }

    async renderDashboard() {
        spaLog('renderDashboard() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Auth check - dashboard requires authentication
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                spaLog('No authenticated user for dashboard, showing sign-in prompt');
                mainContent.innerHTML = `
                    <div class="error-page" style="text-align: center; padding: 4rem 2rem;">
                        <h1 style="margin-bottom: 1rem;">Sign In Required</h1>
                        <p style="margin-bottom: 2rem; opacity: 0.8;">You need to be signed in to view your dashboard.</p>
                        <button data-action="trigger-sign-in" class="btn btn-primary" style="cursor: pointer;">
                            Sign In
                        </button>
                    </div>
                `;
                const signInTrigger = mainContent.querySelector('[data-action="trigger-sign-in"]');
                if (signInTrigger) {
                    signInTrigger.addEventListener('click', () => {
                        const headerBtn = document.getElementById('signInBtn');
                        if (headerBtn) {
                            headerBtn.click();
                        }
                    });
                }
                document.dispatchEvent(new CustomEvent('first-render-complete', {
                    detail: { route: 'dashboard', authRequired: true, timestamp: Date.now() }
                }));
                return;
            }

            if (typeof UserDashboard === 'undefined') {
                spaError('UserDashboard class not loaded');
                mainContent.innerHTML = `
                    <div class="error-page">
                        <h1>Error</h1>
                        <p>Dashboard component not loaded. Please refresh the page.</p>
                    </div>
                `;
                return;
            }

            spaLog('UserDashboard available, initializing...');
            const crudManager = typeof FirebaseCRUDManager !== 'undefined'
                ? new FirebaseCRUDManager(this.db, firebase.auth())
                : null;
            const dashboard = new UserDashboard({
                crudManager: crudManager,
                auth: firebase.auth()
            });

            spaLog('Rendering UserDashboard...');
            const dashboardHTML = await dashboard.render();
            // Note: There is a brief window between innerHTML assignment and
            // initialize() where buttons are visible but have no event handlers.
            // This is inherent to the innerHTML-then-bind pattern and is typically
            // imperceptible (<1ms) but cannot be fully eliminated without a
            // different rendering approach (e.g., DocumentFragment with pre-bound listeners).
            mainContent.innerHTML = dashboardHTML;
            spaLog('Initializing dashboard event listeners...');
            dashboard.initialize(mainContent);
            spaLog('Dashboard page rendered successfully');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'dashboard', timestamp: Date.now() }
            }));
        } catch (error) {
            spaError('Dashboard page render failed:', error);
            throw error;
        }
    }

    async renderAbout() {
        spaLog('renderAbout() called');

        try {
            const mainContent = document.getElementById('main-content');
            if (typeof AboutPage !== 'undefined') {
                const aboutPage = new AboutPage();
                aboutPage.render(mainContent);
            } else {
                mainContent.innerHTML = '<div class="error">AboutPage component not loaded</div>';
            }

            spaLog('About page rendered');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'about', timestamp: Date.now() }
            }));
        } catch (error) {
            spaError('About page render failed:', error);
            throw error;
        }
    }

    async renderPrivacy() {
        spaLog('renderPrivacy() called');

        try {
            const mainContent = document.getElementById('main-content');
            if (typeof PrivacyPage !== 'undefined') {
                const privacyPage = new PrivacyPage();
                privacyPage.render(mainContent);
            } else {
                mainContent.innerHTML = '<div class="error">PrivacyPage component not loaded</div>';
            }

            spaLog('Privacy page rendered');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'privacy', timestamp: Date.now() }
            }));
        } catch (error) {
            spaError('Privacy page render failed:', error);
            throw error;
        }
    }

    async renderTerms() {
        spaLog('renderTerms() called');

        try {
            const mainContent = document.getElementById('main-content');
            if (typeof TermsPage !== 'undefined') {
                const termsPage = new TermsPage();
                termsPage.render(mainContent);
            } else {
                mainContent.innerHTML = '<div class="error">TermsPage component not loaded</div>';
            }

            spaLog('Terms page rendered');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'terms', timestamp: Date.now() }
            }));
        } catch (error) {
            spaError('Terms page render failed:', error);
            throw error;
        }
    }

    async renderUserProfile(userId) {
        spaLog('renderUserProfile() called with userId:', userId);

        try {
            const mainContent = document.getElementById('main-content');

            if (typeof UserProfileView !== 'undefined') {
                const profileView = new UserProfileView();
                await profileView.render(userId, mainContent);
            } else {
                mainContent.innerHTML = `
                    <div class="error-page">
                        <h1>Profile</h1>
                        <p>User profile component not loaded</p>
                        <a href="#/" class="btn-primary">Return Home</a>
                    </div>
                `;
            }

            spaLog('User profile rendered');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: 'user_profile', userId: userId, timestamp: Date.now() }
            }));
        } catch (error) {
            spaError('User profile render failed:', error);
            throw error;
        }
    }

    async render404(path) {
        spaLog('render404() called for path:', path);

        try {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) return;

            const displayPath = path || window.location.hash.replace('#', '') || '/unknown';

            mainContent.innerHTML = `
                <div class="error-page" role="alert" style="text-align: center; padding: 4rem 2rem; max-width: 600px; margin: 0 auto;">
                    <div style="font-size: 6rem; margin-bottom: 1rem; opacity: 0.3; color: var(--color-text-primary, #f8f9fa); font-weight: 700; line-height: 1;">404</div>
                    <h1 style="font-size: 1.5rem; color: var(--color-text-primary, #f8f9fa); margin-bottom: 0.5rem;">Page Not Found</h1>
                    <p style="color: var(--color-text-secondary, #adb5bd); margin-bottom: 2rem;">
                        The page <code style="background: rgba(139,127,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">${this.escapeHtml(displayPath)}</code> doesn't exist.
                    </p>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <a href="#/" class="btn btn-primary" style="padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; background: var(--color-primary, #8b7fff); color: white; display: inline-flex; align-items: center; gap: 0.5rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                <polyline points="9,22 9,12 15,12 15,22"/>
                            </svg>
                            Go Home
                        </a>
                        <a href="#/search" class="btn btn-secondary" style="padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; background: rgba(255,255,255,0.1); color: inherit; display: inline-flex; align-items: center; gap: 0.5rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            Search
                        </a>
                    </div>
                </div>
            `;

            spaLog('404 page rendered for:', displayPath);
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { route: '404', path: displayPath, timestamp: Date.now() }
            }));
        } catch (error) {
            spaError('404 page render failed:', error);
            throw error;
        }
    }

    /**
     * Render error page with route context and retry functionality
     */
    renderError(error, failedRoute = null) {
        const mainContent = document.getElementById('main-content');
        const route = failedRoute || this.currentRoute || window.location.hash || '#/';

        if (!mainContent) {
            spaError('CRITICAL: main-content element not found for error display!');
            return;
        }

        mainContent.innerHTML = `
            <div class="error-page spa-error-recovery" style="text-align: center; padding: 4rem 2rem;">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h1 style="color: var(--color-error, #ef4444); margin-bottom: 1rem;">Error Loading Page</h1>
                <p style="color: var(--color-text-secondary, #9ca3af); margin-bottom: 0.5rem; max-width: 500px; margin-left: auto; margin-right: auto;">${this.escapeHtml(error.message)}</p>
                <p style="color: var(--color-text-muted, #6b7280); font-size: 0.875rem; margin-bottom: 2rem;">
                    Failed route: <code style="background: rgba(0,0,0,0.2); padding: 0.25rem 0.5rem; border-radius: 4px;">${this.escapeHtml(route)}</code>
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button id="spa-retry-btn" class="btn btn-primary" style="padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; background: var(--color-primary, #3b82f6); color: white; border: none; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                        Retry
                    </button>
                    <a href="#/" class="btn btn-secondary" style="padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; background: rgba(255,255,255,0.1); color: inherit; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                        Return Home
                    </a>
                </div>
                ${this._retryAttempts > 0 ? `
                    <p style="margin-top: 1.5rem; font-size: 0.8rem; opacity: 0.6;">
                        Retry attempts: ${this._retryAttempts}/${this._maxRetryAttempts}
                    </p>
                ` : ''}
            </div>
        `;

        // Attach retry button event listener
        const retryBtn = document.getElementById('spa-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                spaLog('Retry button clicked, re-navigating to:', route);
                this._isNavigating = false;
                this._retryAttempts = 0; // Reset retry attempts on manual retry
                this.handleRoute();
            });
        }
    }

    showLoading() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            if (this._loadingTimeout) {
                clearTimeout(this._loadingTimeout);
                this._loadingTimeout = null;
            }

            mainContent.innerHTML = `
                <div class="loading-container spa-loading" role="status" aria-live="polite">
                    <div class="spinner-container">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-message">Loading...</p>
                    <div class="loading-progress" style="width: 200px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 1rem; overflow: hidden;">
                        <div class="loading-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--color-primary, #8b7fff), var(--color-secondary, #ff7fcc)); border-radius: 2px; animation: loadingProgress 2s ease-in-out infinite;"></div>
                    </div>
                </div>
                <style>
                    @keyframes loadingProgress {
                        0% { width: 0%; transform: translateX(0); }
                        50% { width: 70%; }
                        100% { width: 100%; transform: translateX(0); }
                    }
                </style>
            `;
        }
    }

    hideLoading() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            const loadingContainer = mainContent.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.remove();
            }
        }
    }

    showAuthWaitingState(container) {
        if (!container) {
            container = document.getElementById('main-content');
        }

        if (container) {
            container.innerHTML = `
                <div class="loading-container" role="status">
                    <div class="spinner-container">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-message">Preparing content...</p>
                    <p class="loading-submessage" style="font-size: 0.875rem; opacity: 0.7; margin-top: 0.5rem;">Verifying authentication...</p>
                </div>
            `;
        }
    }

    getLoadingHTML(message = 'Loading...') {
        return `
            <div class="loading-container spa-loading" role="status" aria-live="polite">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    getErrorHTML(title = 'Error', message = 'Something went wrong') {
        return `
            <div class="error-container" role="alert" style="text-align: center; padding: 4rem 2rem;">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h1 style="color: var(--color-error, #ef4444); margin-bottom: 1rem;">${this.escapeHtml(title)}</h1>
                <p style="color: var(--color-text-secondary, #9ca3af); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">${this.escapeHtml(message)}</p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="location.reload()" class="btn btn-primary" style="padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                        Retry
                    </button>
                    <a href="#/" class="btn btn-secondary" style="padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none;">
                        Return Home
                    </a>
                </div>
            </div>
        `;
    }

    updateBreadcrumb(path) {
        try {
            if (typeof BreadcrumbNav === 'undefined') {
                spaLog('BreadcrumbNav class not available');
                return;
            }

            if (!window._breadcrumbInstance) {
                window._breadcrumbInstance = new BreadcrumbNav();
            }

            const breadcrumbNav = window._breadcrumbInstance;
            const breadcrumbNavEl = document.getElementById('breadcrumb-nav');

            if (!breadcrumbNavEl) {
                spaLog('Breadcrumb nav element not found');
                return;
            }

            const route = this._parseRouteForBreadcrumb(path);

            if (route) {
                breadcrumbNav.update(route);
                breadcrumbNavEl.classList.add('visible');
            } else {
                breadcrumbNav.clear();
                breadcrumbNavEl.classList.remove('visible');
            }
        } catch (error) {
            spaError('Breadcrumb update error:', error);
        }
    }

    _parseRouteForBreadcrumb(path) {
        const pathParts = path.replace(/^\//, '').split('/');

        if (!pathParts[0]) {
            // Home page — no breadcrumb needed
            return null;
        }

        const route = {};

        if (pathParts[0] === 'search') {
            route.type = 'search';
            return route;
        }

        if (pathParts[0] === 'compare') {
            route.type = 'compare';
            return route;
        }

        if (pathParts[0] === 'mythology' && pathParts[1]) {
            route.mythology = pathParts[1];

            if (pathParts[2]) {
                route.entityTypePlural = pathParts[2];
                route.entityType = pathParts[2].replace(/s$/, '');

                if (pathParts[3]) {
                    route.entityId = pathParts[3];
                    route.hash = path;
                }
            }

            return route;
        }

        if (pathParts[0] === 'browse' && pathParts[1]) {
            route.category = pathParts[1];

            if (pathParts[2]) {
                route.mythology = pathParts[2];
            }

            return route;
        }

        if (pathParts[0] === 'entity' && pathParts[1]) {
            route.entityTypePlural = pathParts[1];
            route.entityType = pathParts[1].replace(/s$/, '');
            route.mythology = pathParts[2];
            route.entityId = pathParts[3];
            route.hash = path;
            return route;
        }

        return null;
    }

    addToHistory(path) {
        this.routeHistory.push({ path, timestamp: Date.now() });
        if (this.routeHistory.length > this.maxHistory) {
            this.routeHistory = this.routeHistory.slice(-this.maxHistory);
        }
    }

    getHistory() {
        return this.routeHistory;
    }

    goBack() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    goForward() {
        window.history.forward();
    }

    /**
     * Enable/disable page transitions
     */
    setTransitionsEnabled(enabled) {
        this._transitionEnabled = enabled;
    }

    /**
     * Get navigation metrics
     */
    getMetrics() {
        return NavigationMetrics.getMetrics();
    }

    /**
     * Get average navigation time
     */
    getAverageNavigationTime() {
        return NavigationMetrics.getAverageTime();
    }

    /**
     * Clear prefetch cache
     */
    clearPrefetchCache() {
        RoutePreloader.clearCache();
    }

    /**
     * Register a cleanup callback to be run when navigating away from current view
     */
    registerViewCleanup(callback) {
        if (typeof callback === 'function') {
            this._viewCleanupCallbacks.push(callback);
        }
    }

    /**
     * Run all registered view cleanup callbacks
     */
    _runViewCleanup() {
        if (this._viewCleanupCallbacks && this._viewCleanupCallbacks.length > 0) {
            spaLog(`Running ${this._viewCleanupCallbacks.length} view cleanup callbacks`);
            for (const callback of this._viewCleanupCallbacks) {
                try {
                    callback();
                } catch (error) {
                    spaError('View cleanup callback error:', error);
                }
            }
            this._viewCleanupCallbacks = [];
        }
    }

    /**
     * Destroy the SPA navigation instance and clean up all event listeners
     */
    destroy() {
        spaLog('Destroying SPA navigation instance');

        this._runViewCleanup();

        if (this._navigationDebounceTimer) {
            clearTimeout(this._navigationDebounceTimer);
            this._navigationDebounceTimer = null;
        }

        if (this._loadingTimeout) {
            clearTimeout(this._loadingTimeout);
            this._loadingTimeout = null;
        }

        if (this._boundHandlers) {
            if (this._boundHandlers.hashchange) {
                window.removeEventListener('hashchange', this._boundHandlers.hashchange);
            }
            if (this._boundHandlers.popstate) {
                window.removeEventListener('popstate', this._boundHandlers.popstate);
            }
            if (this._boundHandlers.click) {
                document.removeEventListener('click', this._boundHandlers.click, true);
            }
            if (this._boundHandlers.keydown) {
                document.removeEventListener('keydown', this._boundHandlers.keydown);
            }
        }

        // Clean up accessibility elements
        const announcer = document.getElementById('spa-route-announcer');
        if (announcer) announcer.remove();
        const loadingAnnouncer = document.getElementById('spa-loading-announcer');
        if (loadingAnnouncer) loadingAnnouncer.remove();

        // Clear caches
        ScrollManager.clear();
        RoutePreloader.clearCache();
        NavigationMetrics.clear();

        this.db = null;
        this.auth = null;
        this.renderer = null;
        this._boundHandlers = null;
        this._viewCleanupCallbacks = null;

        spaLog('SPA navigation destroyed');
    }
}

// Export NavigationMetrics for external access
if (typeof window !== 'undefined') {
    window.NavigationMetrics = NavigationMetrics;
    window.ScrollManager = ScrollManager;
    window.RoutePreloader = RoutePreloader;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPANavigation;
}

// Global export for non-module script loading
if (typeof window !== 'undefined') {
    window.SPANavigation = SPANavigation;
    console.log('[SPANavigation] Class registered globally (polished edition)');
}
