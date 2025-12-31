console.log('[LAYER14-DEBUG] spa-navigation.js started loading');
/**
 * Single Page Application Navigation System
 * Handles dynamic routing and content loading from Firebase
 * Public routes (home, mythologies, browse, etc.) are accessible without auth
 * Protected routes (dashboard, compare) require authentication
 */

// Debug mode - set to true to enable verbose logging
const SPA_DEBUG = false;

// Conditional logging helper
const spaLog = (...args) => {
    if (SPA_DEBUG) console.log('[SPA]', ...args);
};
const spaWarn = (...args) => console.warn('[SPA]', ...args);
const spaError = (...args) => console.error('[SPA]', ...args);

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
            category: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/?$/,
            search: /^#?\/search\/?$/,
            corpus_explorer: /^#?\/corpus-explorer\/?$/,
            compare: /^#?\/compare\/?$/,
            dashboard: /^#?\/dashboard\/?$/,
            about: /^#?\/about\/?$/,
            privacy: /^#?\/privacy\/?$/,
            terms: /^#?\/terms\/?$/
        };

        // ⚡ OPTIMIZATION: Check currentUser OR optimistic auth synchronously first
        const syncCheckStart = performance.now();
        const currentUser = firebase.auth().currentUser;
        const hasOptimisticAuth = window._eoaOptimisticAuth === true;
        const syncCheckEnd = performance.now();

        spaLog(`Synchronous auth check took: ${(syncCheckEnd - syncCheckStart).toFixed(2)}ms`);
        spaLog(`Optimistic auth: ${hasOptimisticAuth}, currentUser: ${!!currentUser}`);

        if (currentUser || hasOptimisticAuth) {
            // Fast path: User already authenticated OR using cached optimistic auth
            const fastPathEnd = performance.now();
            spaLog(currentUser ? `CurrentUser available immediately: ${currentUser.email}` : 'Using OPTIMISTIC auth from cache (instant start)');
            spaLog(`FAST PATH: Auth already ready in ${(fastPathEnd - constructorStart).toFixed(2)}ms`);

            this.authReady = true;
        } else {
            // User not authenticated yet - still initialize router for public routes
            spaLog('No currentUser or optimistic auth, will resolve async...');

            // Listen for auth state changes to update authReady flag
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

                // Re-trigger route if we were on a protected route waiting for auth
                const currentPath = (window.location.hash || '#/').replace('#', '');
                const protectedRoutes = ['dashboard', 'compare'];
                const isProtectedRoute = protectedRoutes.some(route => currentPath.includes(route));
                if (isProtectedRoute) {
                    spaLog('Re-handling protected route now that auth is ready');
                    this.handleRoute();
                }
            }).catch((error) => {
                spaError('waitForAuth() rejected with error:', error);
                // Even on error, mark auth as ready (just not authenticated)
                // This prevents routes from being blocked indefinitely
                this.authReady = true;
            });

            // Also listen for auth-ready event from auth-guard-simple.js (backup mechanism)
            document.addEventListener('auth-ready', (event) => {
                spaLog('Received auth-ready event from auth guard:', event.detail);
                if (!this.authReady) {
                    this.authReady = true;

                    // Re-trigger protected routes if user is authenticated
                    const currentPath = (window.location.hash || '#/').replace('#', '');
                    const protectedRoutes = ['dashboard', 'compare'];
                    const isProtectedRoute = protectedRoutes.some(route => currentPath.includes(route));
                    if (isProtectedRoute && event.detail && event.detail.authenticated) {
                        spaLog('Re-handling protected route after auth-ready event');
                        this.handleRoute();
                    }
                }
            }, { once: true });
        }

        // Listen for optimistic auth verification (fires when Firebase confirms/denies cached auth)
        // Use { once: true } to prevent memory leak from persistent listener
        document.addEventListener('auth-verified', (event) => {
            if (!event.detail?.authenticated) {
                spaWarn('Optimistic auth verification FAILED');
            } else {
                spaLog('Optimistic auth verified successfully');
            }
        }, { once: true });

        // ALWAYS initialize router immediately - handleRoute() decides auth requirements per route
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
     * Wait for Firebase Auth to be ready
     * Includes timeout fallback to prevent indefinite blocking
     * @returns {Promise<{user: firebase.User|null, timedOut: boolean}>} Auth result with timeout state
     */
    async waitForAuth() {
        return new Promise((resolve, reject) => {
            spaLog('waitForAuth() promise created at:', new Date().toISOString());

            // Check if Firebase is available
            if (typeof firebase === 'undefined' || !firebase.auth) {
                spaError('Firebase SDK not available!');
                // Return consistent object instead of rejecting to prevent unhandled errors
                resolve({ user: null, timedOut: false, error: 'Firebase SDK not available' });
                return;
            }

            // Use Firebase auth directly (compatible with auth guard)
            const auth = firebase.auth();
            if (!auth) {
                spaError('Firebase auth not available!');
                // Return consistent object instead of rejecting
                resolve({ user: null, timedOut: false, error: 'Firebase auth not available' });
                return;
            }

            let resolved = false;
            let unsubscribe = null;

            // Timeout fallback: resolve with explicit timeout state after 5 seconds
            // This prevents routes from being blocked indefinitely on network issues
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    spaWarn('Auth timeout after 5s - resolving with null (not authenticated). This may indicate slow network or Firebase SDK issues.');
                    // Clean up listener to prevent memory leak
                    if (unsubscribe) {
                        unsubscribe();
                    }
                    // Return explicit state so caller knows it timed out
                    resolve({ user: null, timedOut: true });
                }
            }, 5000);

            spaLog('Registering onAuthStateChanged listener...');

            // Firebase auth ready check - just resolve, auth guard handles UI
            try {
                unsubscribe = auth.onAuthStateChanged((user) => {
                    if (resolved) {
                        spaLog('Auth state changed after timeout - ignoring');
                        return;
                    }

                    resolved = true;
                    clearTimeout(timeoutId);

                    spaLog('onAuthStateChanged fired, user:', user ? user.email : 'null');

                    // Clean up listener
                    if (unsubscribe) {
                        unsubscribe();
                    }

                    // Return explicit state so caller knows auth completed normally
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
     * This helps catch initialization order issues early
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

        // Only warn about critical missing classes
        const criticalMissing = missingClasses.filter(c => c.critical);
        if (criticalMissing.length > 0) {
            spaWarn('CRITICAL: Some view classes are not loaded:', criticalMissing.map(c => c.name));
            spaWarn('This may indicate a script loading order issue in index.html');
        }

        // Store for later reference
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

        // Track if we're currently navigating to prevent double-handling
        this._isNavigating = false;
        this._navigationDebounceTimer = null;
        this._lastNavigatedHash = null;
        this._navigationLock = null; // Promise-based navigation lock

        // Store bound event handlers for cleanup
        this._boundHandlers = {
            hashchange: null,
            popstate: null,
            click: null
        };

        // Store view-specific cleanup functions
        this._viewCleanupCallbacks = [];

        // Create bound handlers for proper cleanup
        this._boundHandlers.hashchange = (e) => {
            const newHash = window.location.hash || '#/';
            spaLog('hashchange event triggered, hash:', newHash);

            // Skip if we just navigated to this hash via navigate() (prevents double-handling)
            if (this._lastNavigatedHash === newHash) {
                spaLog('Skipping hashchange - same hash already processed via navigate()');
                this._lastNavigatedHash = null; // Reset for next navigation
                return;
            }

            // Clear any stale _lastNavigatedHash that doesn't match current hash
            if (this._lastNavigatedHash && this._lastNavigatedHash !== newHash) {
                this._lastNavigatedHash = null;
            }

            // Debounce rapid hash changes (e.g., from rapid back/forward button presses)
            if (this._navigationDebounceTimer) {
                clearTimeout(this._navigationDebounceTimer);
            }

            this._navigationDebounceTimer = setTimeout(() => {
                // Double-check hash hasn't changed during debounce
                const currentHash = window.location.hash || '#/';
                if (currentHash !== newHash) {
                    spaLog('Hash changed during debounce, skipping stale navigation');
                    return;
                }

                if (!this._isNavigating) {
                    this.handleRoute();
                } else {
                    spaLog('Skipping hashchange - navigation already in progress');
                }
            }, 10);
        };

        this._boundHandlers.popstate = (e) => {
            spaLog('popstate event triggered, state:', e.state);
            if (!this._isNavigating) {
                this.handleRoute();
            }
        };

        this._boundHandlers.click = (e) => {
            // Find the closest anchor element (handles clicks on child elements)
            const link = e.target.closest('a[href]');

            if (!link) return;

            const href = link.getAttribute('href');

            // Check if this is a hash-based SPA link
            if (href && href.startsWith('#')) {
                spaLog('Intercepted link click, href:', href);
                e.preventDefault();
                e.stopPropagation();

                // Use the href attribute directly for navigation (more reliable than link.hash)
                this.navigate(href);
            }
        };

        // Handle hash changes with debouncing to prevent double-navigation
        window.addEventListener('hashchange', this._boundHandlers.hashchange);

        window.addEventListener('popstate', this._boundHandlers.popstate);

        spaLog('Event listeners registered (hashchange, popstate)');

        // Intercept link clicks - improved to handle all hash link formats
        document.addEventListener('click', this._boundHandlers.click, true); // Use capture phase to intercept before other handlers

        spaLog('Link click interceptor registered');

        // Initial route
        spaLog('Triggering initial route handler...');
        this.handleRoute();

        spaLog('initRouter() completed');
    }

    /**
     * Navigate to a route
     * @param {string} path - Route path (with or without #)
     * @param {object} options - Navigation options
     * @param {boolean} options.replace - Use replaceState instead of pushState
     */
    navigate(path, options = {}) {
        if (!path.startsWith('#')) {
            path = '#' + path;
        }

        // Normalize path - ensure consistent format
        path = this.normalizePath(path);

        spaLog('Navigating to:', path);

        // Track that we're about to navigate to this hash (prevents double-handling from hashchange)
        this._lastNavigatedHash = path;

        // Check if we're already at this path
        const currentHash = window.location.hash || '#/';
        if (currentHash === path) {
            spaLog('Already at this path, forcing route refresh');
            // Reset navigation flag to allow re-render of same route
            this._isNavigating = false;
            this.handleRoute();
            return;
        }

        // Reset navigation flag before setting new hash
        // This ensures handleRoute() can acquire the lock
        this._isNavigating = false;

        // Set the hash - this will trigger hashchange event
        if (options.replace) {
            window.history.replaceState(null, '', path);
            // replaceState doesn't trigger hashchange, so we must call handleRoute directly
            this.handleRoute();
        } else {
            // Setting hash triggers hashchange which calls handleRoute via the event listener
            // The _lastNavigatedHash check prevents the event handler from calling handleRoute again
            window.location.hash = path;
            // Call handleRoute directly since hashchange handler will skip due to _lastNavigatedHash
            this.handleRoute();
        }
    }

    /**
     * Normalize path to consistent format
     * @param {string} path - Path to normalize
     * @returns {string} Normalized path
     */
    normalizePath(path) {
        // Remove trailing slashes (except for root)
        if (path !== '#/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        // Ensure starts with #/
        if (path === '#') {
            path = '#/';
        } else if (path.startsWith('#') && !path.startsWith('#/')) {
            path = '#/' + path.slice(1);
        }
        return path;
    }

    /**
     * Handle current route
     */
    async handleRoute() {
        // Prevent concurrent route handling (race condition guard)
        if (this._isNavigating) {
            spaLog('Route handling already in progress, skipping');
            return;
        }

        // Acquire navigation lock
        this._isNavigating = true;
        const navigationId = Date.now() + Math.random(); // Unique ID to prevent collisions
        this._currentNavigationId = navigationId;

        // Store navigation ID for child methods to check
        this._activeNavigationId = navigationId;

        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');

        spaLog(`handleRoute() called for path: ${path}`);

        // Track page view
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackPageView(path);
        }

        // Track navigation
        if (this.currentRoute && window.AnalyticsManager) {
            window.AnalyticsManager.trackNavigation(this.currentRoute, path);
        }

        const mainContent = document.getElementById('main-content');

        // Define routes that require authentication (protected routes)
        const protectedRoutes = ['dashboard', 'compare'];
        const isProtectedRoute = protectedRoutes.some(route => path.includes(route));

        // Only block for protected routes if auth is not ready
        if (isProtectedRoute) {
            if (!this.authReady) {
                spaLog('Auth not ready for protected route, showing loading state...');
                this.showAuthWaitingState(mainContent);
                this._isNavigating = false;
                this._activeNavigationId = null;
                return;
            }

            // Verify user is authenticated via Firebase for protected routes
            const currentUser = firebase.auth().currentUser;
            spaLog('Firebase currentUser:', currentUser ? currentUser.email : 'null');

            if (!currentUser) {
                spaLog('No user found for protected route, showing loading state...');
                this.showAuthWaitingState(mainContent);
                this._isNavigating = false;
                this._activeNavigationId = null;
                return;
            }

            spaLog('Auth checks passed for protected route');
        } else {
            // For public routes, just log the auth state but don't block
            spaLog('Public route - proceeding without auth check');
        }

        // Check if navigation was superseded
        if (this._currentNavigationId !== navigationId) {
            spaLog('Navigation superseded by newer request, aborting');
            // Don't reset flags here - the newer navigation owns them
            return;
        }

        // Run cleanup for previous view before rendering new content
        this._runViewCleanup();

        // Add to history
        this.addToHistory(path);

        // Show loading
        this.showLoading();

        try {
            spaLog('Matching route pattern for path:', path);

            // Match route
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
            } else if (this.routes.entity_alt.test(path)) {
                const match = path.match(this.routes.entity_alt);
                spaLog('Matched ENTITY (alt format) route:', match[3]);
                await this.renderEntity(match[2], match[1], match[3]);
            } else if (this.routes.entity.test(path)) {
                const match = path.match(this.routes.entity);
                spaLog('Matched ENTITY route:', match[3]);
                await this.renderEntity(match[1], match[2], match[3]);
            } else if (this.routes.category.test(path)) {
                const match = path.match(this.routes.category);
                spaLog('Matched CATEGORY route:', match[2]);
                await this.renderCategory(match[1], match[2]);
            } else if (this.routes.mythology.test(path)) {
                const match = path.match(this.routes.mythology);
                spaLog('Matched MYTHOLOGY route:', match[1]);
                await this.renderMythology(match[1]);
            } else if (this.routes.search.test(path)) {
                spaLog('Matched SEARCH route');
                await this.renderSearch();
            } else if (this.routes.corpus_explorer.test(path)) {
                spaLog('Matched CORPUS EXPLORER route - redirecting to standalone page');
                this._isNavigating = false; // Reset before redirect
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
            } else {
                spaLog('No route matched, rendering 404');
                await this.render404();
            }

            // Update breadcrumb
            this.updateBreadcrumb(path);

            // Store current route
            this.currentRoute = path;
            spaLog('Route rendered successfully:', path);

        } catch (error) {
            spaError('Routing error:', error);
            this.renderError(error, path);
        } finally {
            // Only reset if this navigation still owns the lock
            if (this._currentNavigationId === navigationId) {
                this._isNavigating = false;
                this._activeNavigationId = null;
            }
        }
    }

    /**
     * Check if the current render operation should continue
     * Call this after any async operation in render methods
     * @returns {boolean} true if navigation is still valid
     */
    isNavigationValid() {
        return this._activeNavigationId === this._currentNavigationId;
    }

    /**
     * Render home page
     * Shows loading spinner while fetching, error message if fails
     */
    async renderHome() {
        spaLog('renderHome() called');

        const mainContent = document.getElementById('main-content');

        if (!mainContent) {
            spaError('CRITICAL: main-content element not found!');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'home',
                    error: 'main-content element not found',
                    timestamp: Date.now()
                }
            }));
            return;
        }

        // Show loading spinner while preparing content
        mainContent.innerHTML = this.getLoadingHTML('Loading home page...');

        // PRIORITY: Use LandingPageView for home page (shows ONLY 12 asset type categories)
        if (typeof LandingPageView !== 'undefined') {
            spaLog('LandingPageView class available, using it...');
            try {
                const landingView = new LandingPageView(this.db);
                await landingView.render(mainContent);

                // Check if navigation was superseded during async render
                if (!this.isNavigationValid()) {
                    spaLog('renderHome: Navigation superseded after LandingPageView render, aborting');
                    return;
                }

                spaLog('Landing page rendered via LandingPageView');

                document.dispatchEvent(new CustomEvent('first-render-complete', {
                    detail: {
                        route: 'home',
                        renderer: 'LandingPageView',
                        timestamp: Date.now()
                    }
                }));
                return;
            } catch (error) {
                spaError('LandingPageView.render() failed:', error);
                // Check navigation validity before falling back
                if (!this.isNavigationValid()) {
                    spaLog('renderHome: Navigation superseded after error, aborting fallback');
                    return;
                }
                // Continue to fallbacks
            }
        }

        // Fallback: Try PageAssetRenderer (dynamic Firebase page loading)
        if (typeof PageAssetRenderer !== 'undefined') {
            spaLog('PageAssetRenderer class available, trying...');
            try {
                const renderer = new PageAssetRenderer(this.db);
                const pageData = await renderer.loadPage('home');

                // Check navigation validity after async load
                if (!this.isNavigationValid()) {
                    spaLog('renderHome: Navigation superseded during PageAssetRenderer load, aborting');
                    return;
                }

                if (pageData) {
                    spaLog('Home page data loaded from Firebase');
                    await renderer.renderPage('home', mainContent);

                    // Check again after render
                    if (!this.isNavigationValid()) {
                        spaLog('renderHome: Navigation superseded after PageAssetRenderer render, aborting');
                        return;
                    }

                    spaLog('Home page rendered via PageAssetRenderer');

                    document.dispatchEvent(new CustomEvent('first-render-complete', {
                        detail: {
                            route: 'home',
                            renderer: 'PageAssetRenderer',
                            timestamp: Date.now()
                        }
                    }));
                    return;
                } else {
                    spaLog('Home page not found in Firebase, falling back to HomeView');
                }
            } catch (error) {
                spaWarn('PageAssetRenderer failed, falling back to HomeView:', error);
                if (!this.isNavigationValid()) {
                    return;
                }
            }
        }

        // Fallback to HomeView class (old mythologies grid)
        if (typeof HomeView !== 'undefined') {
            spaLog('HomeView class available, using it...');
            const homeView = new HomeView(this.db);
            await homeView.render(mainContent);

            // Check navigation validity after async render
            if (!this.isNavigationValid()) {
                spaLog('renderHome: Navigation superseded after HomeView render, aborting');
                return;
            }

            spaLog('Home page rendered via HomeView');

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'home',
                    renderer: 'HomeView',
                    timestamp: Date.now()
                }
            }));
            return;
        }

        // Fallback to inline rendering if HomeView not available
        spaWarn('Using inline fallback rendering (no HomeView or PageAssetRenderer)');

        // Get all mythologies
        const mythologies = [
            { id: 'greek', name: 'Greek', icon: '🏛️', color: '#4A90E2' },
            { id: 'norse', name: 'Norse', icon: '⚔️', color: '#7C4DFF' },
            { id: 'egyptian', name: 'Egyptian', icon: '🔺', color: '#FFB300' },
            { id: 'hindu', name: 'Hindu', icon: '🕉️', color: '#E91E63' },
            { id: 'chinese', name: 'Chinese', icon: '🐉', color: '#F44336' },
            { id: 'japanese', name: 'Japanese', icon: '⛩️', color: '#FF5722' },
            { id: 'celtic', name: 'Celtic', icon: '🍀', color: '#4CAF50' },
            { id: 'babylonian', name: 'Babylonian', icon: '🏺', color: '#795548' },
            { id: 'sumerian', name: 'Sumerian', icon: '📜', color: '#9E9E9E' },
            { id: 'persian', name: 'Persian', icon: '🦁', color: '#00BCD4' },
            { id: 'roman', name: 'Roman', icon: '🏛️', color: '#673AB7' },
            { id: 'aztec', name: 'Aztec', icon: '☀️', color: '#FF9800' },
            { id: 'mayan', name: 'Mayan', icon: '🗿', color: '#8BC34A' },
            { id: 'buddhist', name: 'Buddhist', icon: '☸️', color: '#FFEB3B' },
            { id: 'christian', name: 'Christian', icon: '✝️', color: '#2196F3' },
            { id: 'yoruba', name: 'Yoruba', icon: '👑', color: '#9C27B0' }
        ];

        mainContent.innerHTML = `
            <div class="home-container">
                <div class="hero-section">
                    <h1 class="hero-title">Explore World Mythologies</h1>
                    <p class="hero-subtitle">Discover deities, heroes, creatures, and sacred texts from cultures across the globe</p>

                    <div class="hero-search">
                        <input type="text" id="quick-search" placeholder="Search across all mythologies..." class="search-input-large">
                        <button id="search-btn" class="btn-primary btn-large">
                            🔍 Search
                        </button>
                    </div>
                </div>

                <div class="mythologies-grid">
                    ${mythologies.map(myth => `
                        <a href="#/mythology/${myth.id}" class="mythology-card" data-mythology="${myth.id}">
                            <div class="myth-icon" style="color: ${myth.color}">${myth.icon}</div>
                            <h3 class="myth-name">${myth.name}</h3>
                            <div class="myth-count" id="count-${myth.id}">Loading...</div>
                        </a>
                    `).join('')}
                </div>

                <div class="featured-section">
                    <h2>Featured Entities</h2>
                    <div id="featured-entities" class="entity-grid">
                        Loading...
                    </div>
                </div>
            </div>
        `;

        // Load counts and featured entities
        this.loadMythologyCounts(mythologies);
        this.loadFeaturedEntities();

        // Attach event listeners
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('quick-search');

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value;
                if (query) {
                    this.navigate(`/search?q=${encodeURIComponent(query)}`);
                }
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchBtn.click();
                }
            });
        }

        spaLog('Home page rendered (inline fallback)');

        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: {
                route: 'home',
                renderer: 'inline-fallback',
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Retry helper with exponential backoff
     * @param {Function} fn - Async function to retry
     * @param {number} maxRetries - Maximum retry attempts (default 3)
     * @param {number} baseDelay - Base delay in ms (default 1000)
     * @returns {Promise} Result of fn or throws after max retries
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
                container.innerHTML = this.renderer.render(entities, 'grid');
            } else {
                container.innerHTML = '<p>No featured entities found</p>';
            }
        } catch (error) {
            spaError('Error loading featured entities after retries:', error);
            container.innerHTML = '<p class="error">Error loading featured entities</p>';
        }
    }

    /**
     * Render mythologies grid page
     */
    async renderMythologies() {
        spaLog('renderMythologies() called');
        const mainContent = document.getElementById('main-content');

        if (typeof MythologiesView !== 'undefined') {
            const mythologiesView = new MythologiesView(this.db);
            await mythologiesView.render(mainContent);
            spaLog('Mythologies grid rendered');
        } else {
            mainContent.innerHTML = `<div class="error-page"><h1>Mythologies View not available</h1></div>`;
            spaError('MythologiesView class not found');
        }
    }

    /**
     * Render browse category page (deities, creatures, etc.)
     */
    async renderBrowseCategory(category, mythology = null) {
        spaLog(`renderBrowseCategory() called: ${category}${mythology ? ` (${mythology})` : ''}`);
        const mainContent = document.getElementById('main-content');

        if (typeof BrowseCategoryView !== 'undefined') {
            const browseView = new BrowseCategoryView(this.db);
            await browseView.render(mainContent, { category, mythology });
            spaLog('Browse category rendered');
        } else {
            mainContent.innerHTML = `<div class="error-page"><h1>Browse View not available</h1></div>`;
            spaError('BrowseCategoryView class not found');
        }
    }

    async renderMythology(mythologyId) {
        spaLog('renderMythology() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Check if MythologyOverview component is available
            if (typeof MythologyOverview !== 'undefined') {
                spaLog('MythologyOverview class available, using it...');
                const mythologyView = new MythologyOverview({ db: this.db, router: this });
                const html = await mythologyView.render({ mythology: mythologyId });
                mainContent.innerHTML = html;
                spaLog('Mythology page rendered via MythologyOverview');
            } else {
                // Fallback to PageAssetRenderer for special mythology pages
                spaLog('MythologyOverview not available, trying PageAssetRenderer...');
                if (typeof PageAssetRenderer !== 'undefined') {
                    const renderer = new PageAssetRenderer(this.db);
                    const pageData = await renderer.loadPage(`mythology-${mythologyId}`);
                    if (pageData) {
                        await renderer.renderPage(`mythology-${mythologyId}`, mainContent);
                        spaLog('Mythology page rendered via PageAssetRenderer');
                    } else {
                        // Final fallback: basic mythology info
                        mainContent.innerHTML = await this.renderBasicMythologyPage(mythologyId);
                        spaLog('Mythology page rendered (basic fallback)');
                    }
                } else {
                    mainContent.innerHTML = await this.renderBasicMythologyPage(mythologyId);
                    spaLog('Mythology page rendered (basic fallback)');
                }
            }

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'mythology',
                    mythologyId: mythologyId,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            spaError('Mythology page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'mythology',
                    mythologyId: mythologyId,
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }

    /**
     * Render basic mythology page (fallback)
     */
    async renderBasicMythologyPage(mythologyId) {
        const mythologies = {
            'greek': { name: 'Greek', icon: '🏛️', color: '#4A90E2' },
            'norse': { name: 'Norse', icon: '⚔️', color: '#7C4DFF' },
            'egyptian': { name: 'Egyptian', icon: '🔺', color: '#FFB300' },
            'hindu': { name: 'Hindu', icon: '🕉️', color: '#E91E63' },
            'chinese': { name: 'Chinese', icon: '🐉', color: '#F44336' },
            'japanese': { name: 'Japanese', icon: '⛩️', color: '#FF5722' },
            'celtic': { name: 'Celtic', icon: '🍀', color: '#4CAF50' },
            'babylonian': { name: 'Babylonian', icon: '🏺', color: '#795548' },
            'sumerian': { name: 'Sumerian', icon: '📜', color: '#9E9E9E' },
            'persian': { name: 'Persian', icon: '🦁', color: '#00BCD4' },
            'roman': { name: 'Roman', icon: '🏛️', color: '#673AB7' },
            'aztec': { name: 'Aztec', icon: '☀️', color: '#FF9800' },
            'mayan': { name: 'Mayan', icon: '🗿', color: '#8BC34A' },
            'buddhist': { name: 'Buddhist', icon: '☸️', color: '#FFEB3B' },
            'christian': { name: 'Christian', icon: '✝️', color: '#2196F3' },
            'yoruba': { name: 'Yoruba', icon: '👑', color: '#9C27B0' }
        };

        const myth = mythologies[mythologyId] || { name: mythologyId, icon: '📚', color: '#666' };

        // Count entities
        const entityTypes = ['deities', 'heroes', 'creatures', 'texts', 'rituals', 'herbs', 'cosmology', 'magic'];
        const counts = {};
        let totalCount = 0;

        for (const type of entityTypes) {
            try {
                const snapshot = await this.db.collection(type)
                    .where('mythology', '==', mythologyId)
                    .get();
                counts[type] = snapshot.size;
                totalCount += snapshot.size;
            } catch (error) {
                spaError(`Error loading count for ${type}:`, error);
                counts[type] = 0;
            }
        }

        return `
            <div class="mythology-page" style="--myth-color: ${myth.color};">
                <div class="mythology-hero" style="text-align: center; padding: 3rem 1rem; background: linear-gradient(135deg, ${myth.color}22 0%, transparent 100%);">
                    <div class="mythology-icon" style="font-size: 5rem; margin-bottom: 1rem;">${myth.icon}</div>
                    <h1 style="font-size: 3rem; margin-bottom: 0.5rem; color: ${myth.color};">${myth.name} Mythology</h1>
                    <p style="font-size: 1.2rem; opacity: 0.8;">Explore ${totalCount} entities from the ${myth.name} tradition</p>
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

            // Use BrowseCategoryView to render the category page
            if (typeof BrowseCategoryView !== 'undefined') {
                spaLog('BrowseCategoryView class available, using it...');
                const browseView = new BrowseCategoryView(this.db);
                await browseView.render(mainContent, { category, mythology });
                spaLog('Category page rendered via BrowseCategoryView');
            } else {
                // Fallback to basic category rendering
                spaLog('BrowseCategoryView not available, using basic fallback...');
                mainContent.innerHTML = await this.renderBasicCategoryPage(mythology, category);
                spaLog('Category page rendered (basic fallback)');
            }

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'category',
                    mythology: mythology,
                    category: category,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            spaError('Category page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'category',
                    mythology: mythology,
                    category: category,
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }

    /**
     * Render basic category page (fallback)
     */
    async renderBasicCategoryPage(mythology, category) {
        const categoryIcons = {
            'deities': '👑',
            'heroes': '🦸',
            'creatures': '🐉',
            'texts': '📜',
            'rituals': '🕯️',
            'herbs': '🌿',
            'cosmology': '🌌',
            'magic': '✨',
            'items': '⚔️',
            'places': '🏛️',
            'symbols': '⚡'
        };

        const icon = categoryIcons[category] || '📄';
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

        // Load entities from Firebase
        let entities = [];
        try {
            const snapshot = await this.db.collection(category)
                .where('mythology', '==', mythology)
                .get();
            entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            spaError(`Error loading ${category} for ${mythology}:`, error);
        }

        return `
            <div class="category-page">
                <div class="category-hero" style="text-align: center; padding: 2rem 1rem;">
                    <div class="category-icon" style="font-size: 4rem; margin-bottom: 1rem;">${icon}</div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">${categoryName}</h1>
                    <p style="font-size: 1.2rem; opacity: 0.8;">${mythology.charAt(0).toUpperCase() + mythology.slice(1)} Mythology</p>
                    <p style="opacity: 0.7;">${entities.length} ${entities.length === 1 ? category.slice(0, -1) : category}</p>
                </div>

                ${entities.length > 0 ? `
                    <div class="entity-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                        ${entities.map(entity => `
                            <a href="#/mythology/${mythology}/${category}/${entity.id}" class="entity-card" style="text-decoration: none; padding: 1.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; transition: all 0.3s;">
                                <div class="entity-icon" style="font-size: 2rem; text-align: center; margin-bottom: 0.5rem;">${entity.icon || icon}</div>
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

    async renderEntity(mythology, categoryType, entityId) {
        spaLog('renderEntity() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Use FirebaseEntityRenderer to render the entity
            if (typeof FirebaseEntityRenderer !== 'undefined') {
                spaLog('FirebaseEntityRenderer class available, using it...');
                const entityRenderer = new FirebaseEntityRenderer();
                await entityRenderer.loadAndRender(categoryType, entityId, mythology, mainContent);
                spaLog('Entity page rendered via FirebaseEntityRenderer');
            } else {
                // Fallback to basic entity rendering
                spaLog('FirebaseEntityRenderer not available, using basic fallback...');
                mainContent.innerHTML = await this.renderBasicEntityPage(mythology, categoryType, entityId);
                spaLog('Entity page rendered (basic fallback)');
            }

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'entity',
                    mythology: mythology,
                    categoryType: categoryType,
                    entityId: entityId,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            spaError('Entity page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'entity',
                    mythology: mythology,
                    categoryType: categoryType,
                    entityId: entityId,
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }

    /**
     * Render basic entity page (fallback)
     */
    async renderBasicEntityPage(mythology, categoryType, entityId) {
        // Load entity from Firebase
        let entity = null;
        try {
            const doc = await this.db.collection(categoryType).doc(entityId).get();
            if (doc.exists) {
                entity = { id: doc.id, ...doc.data() };
            }
        } catch (error) {
            spaError(`Error loading entity ${entityId}:`, error);
        }

        if (!entity) {
            return `
                <div class="error-page" style="text-align: center; padding: 3rem;">
                    <h1 style="font-size: 3rem; margin-bottom: 1rem;">🔍</h1>
                    <h2>Entity Not Found</h2>
                    <p>The entity "${entityId}" could not be found in ${categoryType}.</p>
                    <a href="#/mythology/${mythology}/${categoryType}" class="btn-primary" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px;">Back to ${categoryType}</a>
                </div>
            `;
        }

        return `
            <div class="entity-page">
                <div class="entity-hero" style="text-align: center; padding: 2rem 1rem;">
                    <div class="entity-icon" style="font-size: 5rem; margin-bottom: 1rem;">${entity.icon || '✨'}</div>
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
                    <a href="#/mythology/${mythology}/${categoryType}" class="btn-secondary" style="display: inline-block; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px;">← Back to ${categoryType}</a>
                </div>
            </div>
        `;
    }

    /**
     * Render markdown content (basic implementation)
     */
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

    /**
     * Escape HTML to prevent XSS
     */
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

            // Check if SearchViewComplete class is available (preferred)
            if (typeof SearchViewComplete !== 'undefined') {
                spaLog('SearchViewComplete class available, using it...');

                // Create and render complete search view
                const searchView = new SearchViewComplete(this.db);

                // Store globally for pagination callbacks
                window.searchViewInstance = searchView;

                spaLog('Rendering SearchViewComplete...');
                await searchView.render(mainContent);

                spaLog('Search page rendered via SearchViewComplete');
                document.dispatchEvent(new CustomEvent('first-render-complete', {
                    detail: {
                        route: 'search',
                        renderer: 'SearchViewComplete',
                        timestamp: Date.now()
                    }
                }));
                return;
            }

            // Fallback to EnhancedCorpusSearch if available
            if (typeof EnhancedCorpusSearch !== 'undefined') {
                spaLog('Falling back to EnhancedCorpusSearch...');

                const container = document.createElement('div');
                container.id = 'search-container';
                mainContent.innerHTML = '';
                mainContent.appendChild(container);

                const searchEngine = new EnhancedCorpusSearch(this.db);
                // Note: EnhancedCorpusSearch may not have a render method

                spaLog('Search container created (EnhancedCorpusSearch)');
                document.dispatchEvent(new CustomEvent('first-render-complete', {
                    detail: {
                        route: 'search',
                        renderer: 'EnhancedCorpusSearch',
                        timestamp: Date.now()
                    }
                }));
                return;
            }

            // Final fallback - show error
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
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'search',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }

    async renderCompare() {
        spaLog('renderCompare() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Check if CompareView class is available
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

            // Create and render CompareView
            const compareView = new CompareView(this.db);

            spaLog('Rendering CompareView...');
            await compareView.render(mainContent);

            spaLog('Compare page rendered successfully');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'compare',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            spaError('Compare page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'compare',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }

    async renderDashboard() {
        spaLog('renderDashboard() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Check if UserDashboard class is available
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

            // Check if FirebaseCRUDManager is available
            if (typeof FirebaseCRUDManager === 'undefined') {
                spaError('FirebaseCRUDManager class not loaded');
                mainContent.innerHTML = `
                    <div class="error-page">
                        <h1>Error</h1>
                        <p>CRUD manager not loaded. Please refresh the page.</p>
                    </div>
                `;
                return;
            }

            spaLog('UserDashboard and dependencies available');

            // Create CRUD manager instance
            const crudManager = new FirebaseCRUDManager(this.db, firebase.auth());

            // Create and render dashboard
            const dashboard = new UserDashboard({
                crudManager: crudManager,
                auth: firebase.auth()
            });

            spaLog('Rendering UserDashboard...');
            const dashboardHTML = await dashboard.render();
            mainContent.innerHTML = dashboardHTML;

            // Initialize dashboard event listeners
            spaLog('Initializing dashboard event listeners...');
            dashboard.initialize(mainContent);

            spaLog('Dashboard page rendered successfully');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'dashboard',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            spaError('Dashboard page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'dashboard',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
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
                detail: {
                    route: 'about',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            spaError('About page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'about',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
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
                detail: {
                    route: 'privacy',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            spaError('Privacy page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'privacy',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
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
                detail: {
                    route: 'terms',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            spaError('Terms page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'terms',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }

    async render404() {
        spaLog('render404() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>404</h1>
                    <p>Page not found</p>
                    <a href="#/" class="btn-primary">Return Home</a>
                </div>
            `;

            spaLog('404 page rendered');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: '404',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            spaError('404 page render failed:', error);
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: '404',
                    error: error.message,
                    timestamp: Date.now()
                }
            }));
            throw error;
        }
    }

    /**
     * Render error page with route context and working retry button
     * @param {Error} error - The error that occurred
     * @param {string} failedRoute - The route that failed to load
     */
    renderError(error, failedRoute = null) {
        const mainContent = document.getElementById('main-content');
        const route = failedRoute || this.currentRoute || window.location.hash || '#/';

        mainContent.innerHTML = `
            <div class="error-page" style="text-align: center; padding: 4rem 2rem;">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">&#9888;</div>
                <h1 style="color: var(--color-error, #ef4444); margin-bottom: 1rem;">Error Loading Page</h1>
                <p style="color: var(--color-text-secondary, #9ca3af); margin-bottom: 0.5rem; max-width: 500px; margin-left: auto; margin-right: auto;">${this.escapeHtml(error.message)}</p>
                <p style="color: var(--color-text-muted, #6b7280); font-size: 0.875rem; margin-bottom: 2rem;">Failed route: <code style="background: rgba(0,0,0,0.2); padding: 0.25rem 0.5rem; border-radius: 4px;">${this.escapeHtml(route)}</code></p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button id="spa-retry-btn" class="btn btn-primary" style="padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; background: var(--color-primary, #3b82f6); color: white; border: none;">
                        Retry
                    </button>
                    <a href="#/" class="btn btn-secondary" style="padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; background: rgba(255,255,255,0.1); color: inherit;">
                        Return Home
                    </a>
                </div>
            </div>
        `;

        // Attach retry button event listener
        const retryBtn = document.getElementById('spa-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                spaLog('Retry button clicked, re-navigating to:', route);
                this._isNavigating = false; // Reset navigation lock
                this.handleRoute();
            });
        }
    }

    showLoading() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            // Clear any pending loading timeout
            if (this._loadingTimeout) {
                clearTimeout(this._loadingTimeout);
                this._loadingTimeout = null;
            }

            // Set loading immediately to prevent flicker/race conditions
            mainContent.innerHTML = `
                <div class="loading-container" role="status" aria-live="polite">
                    <div class="spinner-container">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-message">Loading...</p>
                </div>
            `;
        }
    }

    /**
     * Hide loading spinner explicitly (useful for error recovery)
     */
    hideLoading() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            const loadingContainer = mainContent.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.remove();
            }
        }
    }

    /**
     * Show loading state while waiting for auth
     */
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
                    <p class="loading-submessage">Verifying authentication...</p>
                </div>
            `;
        }
    }

    /**
     * Get loading HTML (returns string for use with innerHTML)
     * @param {string} message - Optional custom loading message
     */
    getLoadingHTML(message = 'Loading...') {
        return `
            <div class="loading-container" role="status" aria-live="polite">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    /**
     * Get error HTML (returns string for use with innerHTML)
     * @param {string} title - Error title
     * @param {string} message - Error message
     */
    getErrorHTML(title = 'Error', message = 'Something went wrong') {
        return `
            <div class="error-container" role="alert" style="text-align: center; padding: 4rem 2rem;">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">⚠️</div>
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
        // Breadcrumb implementation
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
     * Register a cleanup callback to be run when navigating away from current view
     * @param {Function} callback - Cleanup function to call
     */
    registerViewCleanup(callback) {
        if (typeof callback === 'function') {
            this._viewCleanupCallbacks.push(callback);
        }
    }

    /**
     * Run all registered view cleanup callbacks
     * Called automatically before rendering a new view
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
     * Call this if you need to completely tear down the SPA
     */
    destroy() {
        spaLog('Destroying SPA navigation instance');

        // Run any remaining view cleanup
        this._runViewCleanup();

        // Clear debounce timers
        if (this._navigationDebounceTimer) {
            clearTimeout(this._navigationDebounceTimer);
            this._navigationDebounceTimer = null;
        }

        if (this._loadingTimeout) {
            clearTimeout(this._loadingTimeout);
            this._loadingTimeout = null;
        }

        // Remove event listeners
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
        }

        // Clear references
        this.db = null;
        this.auth = null;
        this.renderer = null;
        this._boundHandlers = null;
        this._viewCleanupCallbacks = null;

        spaLog('SPA navigation destroyed');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPANavigation;
}

// Global export for non-module script loading (browser context)
// This is REQUIRED for app-init-simple.js to find the class via dependencyExists()
if (typeof window !== 'undefined') {
    window.SPANavigation = SPANavigation;
    console.log('[SPANavigation] Class registered globally');
}
