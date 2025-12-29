/**
 * Single Page Application Navigation System
 * Handles dynamic routing and content loading from Firebase
 * Public routes (home, mythologies, browse, etc.) are accessible without auth
 * Protected routes (dashboard, compare) require authentication
 */

class SPANavigation {
    constructor(firestore, authManager, renderer) {
        const constructorStart = performance.now();
        console.log('[SPA] 🔧 Constructor called at:', new Date().toISOString());

        this.db = firestore;
        this.auth = authManager;
        this.renderer = renderer;
        this.currentRoute = null;
        this.routeHistory = [];
        this.maxHistory = 50;
        this.authReady = false;

        // Verify required view classes are loaded (initialization order check)
        this.verifyDependencies();

        console.log('[SPA] Properties initialized:', {
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

        console.log(`[SPA] ⚡ Synchronous auth check took: ${(syncCheckEnd - syncCheckStart).toFixed(2)}ms`);
        console.log(`[SPA] ⚡ Optimistic auth: ${hasOptimisticAuth}, currentUser: ${!!currentUser}`);

        if (currentUser || hasOptimisticAuth) {
            // Fast path: User already authenticated OR using cached optimistic auth
            const fastPathEnd = performance.now();
            if (currentUser) {
                console.log('[SPA] ✨ CurrentUser available immediately:', currentUser.email);
            } else {
                console.log('[SPA] ✨ Using OPTIMISTIC auth from cache (instant start)');
            }
            console.log('[SPA] ⚡ FAST PATH: Auth already ready');
            console.log(`[SPA] 📊 Total constructor time (fast path): ${(fastPathEnd - constructorStart).toFixed(2)}ms`);

            this.authReady = true;
        } else {
            // User not authenticated yet - still initialize router for public routes
            console.log('[SPA] 🔒 No currentUser or optimistic auth, will resolve async...');
            console.log('[SPA] 📖 Router will initialize immediately for public routes');

            // Listen for auth state changes to update authReady flag
            this.waitForAuth().then((user) => {
                const slowPathEnd = performance.now();
                console.log('[SPA] ✅ waitForAuth() resolved with user:', user ? user.email : 'null');
                console.log(`[SPA] 📊 Total auth wait time: ${(slowPathEnd - constructorStart).toFixed(2)}ms`);

                this.authReady = true;
                console.log('[SPA] 🔓 Auth ready flag set to true');

                // Re-trigger route if we were on a protected route waiting for auth
                const currentPath = (window.location.hash || '#/').replace('#', '');
                const protectedRoutes = ['dashboard', 'compare'];
                const isProtectedRoute = protectedRoutes.some(route => currentPath.includes(route));
                if (isProtectedRoute) {
                    console.log('[SPA] 🔄 Re-handling protected route now that auth is ready');
                    this.handleRoute();
                }
            }).catch((error) => {
                console.error('[SPA] ❌ waitForAuth() rejected with error:', error);
                // Even on error, mark auth as ready (just not authenticated)
                // This prevents routes from being blocked indefinitely
                this.authReady = true;
                console.log('[SPA] 🔓 Auth ready flag set to true (error fallback)');
            });

            // Also listen for auth-ready event from auth-guard-simple.js (backup mechanism)
            // This ensures we catch auth state even if our onAuthStateChanged fires late
            document.addEventListener('auth-ready', (event) => {
                console.log('[SPA] 🔔 Received auth-ready event from auth guard:', event.detail);
                if (!this.authReady) {
                    this.authReady = true;
                    console.log('[SPA] 🔓 Auth ready flag set via auth-ready event');

                    // Re-trigger protected routes if user is authenticated
                    const currentPath = (window.location.hash || '#/').replace('#', '');
                    const protectedRoutes = ['dashboard', 'compare'];
                    const isProtectedRoute = protectedRoutes.some(route => currentPath.includes(route));
                    if (isProtectedRoute && event.detail && event.detail.authenticated) {
                        console.log('[SPA] 🔄 Re-handling protected route after auth-ready event');
                        this.handleRoute();
                    }
                }
            }, { once: true });
        }

        // Listen for optimistic auth verification (fires when Firebase confirms/denies cached auth)
        document.addEventListener('auth-verified', (event) => {
            if (!event.detail?.authenticated) {
                console.log('[SPA] ⚠️ Optimistic auth verification FAILED');
                // Auth guard will handle showing the login overlay
            } else {
                console.log('[SPA] ✅ Optimistic auth verified successfully');
            }
        });

        // ALWAYS initialize router immediately - handleRoute() decides auth requirements per route
        if (document.readyState === 'loading') {
            console.log('[SPA] 📄 DOM still loading, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('[SPA] 📄 DOMContentLoaded fired, initializing router...');
                this.initRouter();
            });
        } else {
            console.log('[SPA] 📄 DOM already loaded, initializing router immediately...');
            this.initRouter();
        }

        console.log('[SPA] 🏁 Constructor completed');
    }

    /**
     * Wait for Firebase Auth to be ready
     * Includes timeout fallback to prevent indefinite blocking
     */
    async waitForAuth() {
        return new Promise((resolve, reject) => {
            console.log('[SPA] ⏳ waitForAuth() promise created at:', new Date().toISOString());

            // Use Firebase auth directly (compatible with auth guard)
            const auth = firebase.auth();
            if (!auth) {
                console.error('[SPA] ❌ Firebase auth not available!');
                reject(new Error('Firebase auth not available'));
                return;
            }

            let resolved = false;

            // Timeout fallback: resolve with null after 5 seconds if auth never fires
            // This prevents routes from being blocked indefinitely on network issues
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn('[SPA] ⏰ Auth timeout after 5s - resolving with null (not authenticated)');
                    console.log('[SPA] 💡 This may indicate slow network or Firebase SDK issues');
                    resolve(null);
                }
            }, 5000);

            console.log('[SPA] 📡 Registering onAuthStateChanged listener...');

            // Firebase auth ready check - just resolve, auth guard handles UI
            const unsubscribe = auth.onAuthStateChanged((user) => {
                if (resolved) {
                    console.log('[SPA] ⚠️ Auth state changed after timeout - ignoring');
                    unsubscribe();
                    return;
                }

                resolved = true;
                clearTimeout(timeoutId);

                const timestamp = new Date().toISOString();
                console.log('[SPA] 🔔 onAuthStateChanged fired at:', timestamp);
                console.log('[SPA] 👤 User state:', user ? `Logged in as ${user.email}` : 'Logged out');
                console.log('[SPA] 🧹 Unsubscribing from auth state listener');

                unsubscribe();

                console.log('[SPA] ✅ Resolving waitForAuth() promise with user:', user ? user.email : 'null');
                resolve(user);
            });

            console.log('[SPA] ⏸️ waitForAuth() promise setup complete, waiting for auth state change...');
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

        console.log('[SPA] Dependency check:', {
            loaded: loadedClasses.length,
            missing: missingClasses.length,
            loadedClasses: loadedClasses,
            missingClasses: missingClasses.map(c => c.name)
        });

        // Only warn about critical missing classes
        const criticalMissing = missingClasses.filter(c => c.critical);
        if (criticalMissing.length > 0) {
            console.warn('[SPA] CRITICAL: Some view classes are not loaded:', criticalMissing.map(c => c.name));
            console.warn('[SPA] This may indicate a script loading order issue in index.html');
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
        console.log('[SPA] initRouter() called at:', new Date().toISOString());
        console.log('[SPA] Current state:', {
            authReady: this.authReady,
            currentRoute: this.currentRoute,
            hash: window.location.hash
        });

        // Track if we're currently navigating to prevent double-handling
        this._isNavigating = false;
        this._navigationDebounceTimer = null;
        this._lastNavigatedHash = null;

        // Handle hash changes with debouncing to prevent double-navigation
        window.addEventListener('hashchange', (e) => {
            const newHash = window.location.hash;
            console.log('[SPA] 📍 hashchange event triggered, hash:', newHash);
            console.log('[SPA] 📍 hashchange oldURL:', e.oldURL, 'newURL:', e.newURL);

            // Skip if we just navigated to this hash (prevents double-handling)
            if (this._lastNavigatedHash === newHash) {
                console.log('[SPA] ⏳ Skipping hashchange - same hash already processed');
                this._lastNavigatedHash = null; // Reset for next navigation
                return;
            }

            // Debounce rapid hash changes
            if (this._navigationDebounceTimer) {
                clearTimeout(this._navigationDebounceTimer);
            }

            this._navigationDebounceTimer = setTimeout(() => {
                if (!this._isNavigating) {
                    this.handleRoute();
                } else {
                    console.log('[SPA] ⏳ Skipping hashchange - navigation already in progress');
                }
            }, 10);
        });

        window.addEventListener('popstate', (e) => {
            console.log('[SPA] 📍 popstate event triggered, state:', e.state);
            if (!this._isNavigating) {
                this.handleRoute();
            }
        });

        console.log('[SPA] ✓ Event listeners registered (hashchange, popstate)');

        // Intercept link clicks - improved to handle all hash link formats
        document.addEventListener('click', (e) => {
            // Find the closest anchor element (handles clicks on child elements)
            const link = e.target.closest('a[href]');

            if (!link) return;

            const href = link.getAttribute('href');

            // Check if this is a hash-based SPA link
            if (href && href.startsWith('#')) {
                console.log('[SPA] 🔗 Intercepted link click, href:', href);
                e.preventDefault();
                e.stopPropagation();

                // Use the href attribute directly for navigation (more reliable than link.hash)
                this.navigate(href);
            }
        }, true); // Use capture phase to intercept before other handlers

        console.log('[SPA] ✓ Link click interceptor registered');

        // Initial route
        console.log('[SPA] 🎯 Triggering initial route handler...');
        this.handleRoute();

        console.log('[SPA] 🏁 initRouter() completed');
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

        console.log('[SPA] Navigating to:', path);

        // Track that we're about to navigate to this hash (prevents double-handling)
        this._lastNavigatedHash = path;

        // Check if we're already at this path
        if (window.location.hash === path) {
            console.log('[SPA] Already at this path, forcing route refresh');
            this.handleRoute();
            return;
        }

        // Set the hash and handle the route
        if (options.replace) {
            window.history.replaceState(null, '', path);
        } else {
            window.location.hash = path;
        }

        // ALWAYS call handleRoute() directly - don't rely on hashchange event
        // because it will be skipped due to deduplication (_lastNavigatedHash check)
        this.handleRoute();
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
            console.log('[SPA] ⏳ Route handling already in progress, skipping');
            return;
        }

        this._isNavigating = true;

        const timestamp = new Date().toISOString();
        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');

        console.log('[SPA] ═══════════════════════════════════════');
        console.log('[SPA] 🛣️  handleRoute() called at:', timestamp);
        console.log('[SPA] 📍 Current hash:', hash);
        console.log('[SPA] 📍 Parsed path:', path);
        console.log('[SPA] 🔍 Pre-check state:', {
            authReady: this.authReady,
            currentRoute: this.currentRoute
        });

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
                console.log('[SPA] ⏳ Auth not ready for protected route, showing loading state...');
                console.log('[SPA] 💡 Tip: waitForAuth() may not have completed yet');
                console.log('[SPA] ═══════════════════════════════════════');
                this.showAuthWaitingState(mainContent);
                this._isNavigating = false; // Reset flag on early return
                return;
            }

            // Verify user is authenticated via Firebase for protected routes
            const currentUser = firebase.auth().currentUser;
            console.log('[SPA] 👤 Firebase currentUser:', currentUser ? currentUser.email : 'null');

            if (!currentUser) {
                console.log('[SPA] ⏳ No user found for protected route, showing loading state...');
                console.log('[SPA] 💡 Tip: Firebase auth.currentUser is null (may be transient)');
                console.log('[SPA] ═══════════════════════════════════════');
                this.showAuthWaitingState(mainContent);
                this._isNavigating = false; // Reset flag on early return
                return;
            }

            console.log('[SPA] ✓ Auth checks passed for protected route');
        } else {
            // For public routes, just log the auth state but don't block
            const currentUser = firebase.auth().currentUser;
            console.log('[SPA] 📖 Public route - auth state:', {
                authReady: this.authReady,
                currentUser: currentUser ? currentUser.email : 'not logged in'
            });
        }

        // Add to history
        this.addToHistory(path);
        console.log('[SPA] ✓ Added to history, total entries:', this.routeHistory.length);

        // Show loading
        console.log('[SPA] 🔄 Showing loading spinner...');
        this.showLoading();

        try {
            console.log('[SPA] 🔍 Matching route pattern for path:', path);

            // Match route
            if (this.routes.home.test(path)) {
                console.log('[SPA] ✅ Matched HOME route');
                console.log('[SPA] 🏠 Calling renderHome()...');
                await this.renderHome();
                console.log('[SPA] ✓ renderHome() completed');
            } else if (this.routes.mythologies.test(path)) {
                console.log('[SPA] ✅ Matched MYTHOLOGIES route');
                await this.renderMythologies();
            } else if (this.routes.browse_category_mythology.test(path)) {
                const match = path.match(this.routes.browse_category_mythology);
                console.log('[SPA] ✅ Matched BROWSE CATEGORY+MYTHOLOGY route:', match[1], match[2]);
                await this.renderBrowseCategory(match[1], match[2]);
            } else if (this.routes.browse_category.test(path)) {
                const match = path.match(this.routes.browse_category);
                console.log('[SPA] ✅ Matched BROWSE CATEGORY route:', match[1]);
                await this.renderBrowseCategory(match[1]);
            } else if (this.routes.entity_alt.test(path)) {
                const match = path.match(this.routes.entity_alt);
                console.log('[SPA] ✅ Matched ENTITY (alt format) route:', match[3]);
                await this.renderEntity(match[2], match[1], match[3]);
            } else if (this.routes.entity.test(path)) {
                const match = path.match(this.routes.entity);
                console.log('[SPA] ✅ Matched ENTITY route:', match[3]);
                await this.renderEntity(match[1], match[2], match[3]);
            } else if (this.routes.category.test(path)) {
                const match = path.match(this.routes.category);
                console.log('[SPA] ✅ Matched CATEGORY route:', match[2]);
                await this.renderCategory(match[1], match[2]);
            } else if (this.routes.mythology.test(path)) {
                const match = path.match(this.routes.mythology);
                console.log('[SPA] ✅ Matched MYTHOLOGY route:', match[1]);
                await this.renderMythology(match[1]);
            } else if (this.routes.search.test(path)) {
                console.log('[SPA] ✅ Matched SEARCH route');
                await this.renderSearch();
            } else if (this.routes.corpus_explorer.test(path)) {
                console.log('[SPA] ✅ Matched CORPUS EXPLORER route - redirecting to standalone page');
                window.location.href = 'corpus-explorer.html';
                return;
            } else if (this.routes.compare.test(path)) {
                console.log('[SPA] ✅ Matched COMPARE route');
                await this.renderCompare();
            } else if (this.routes.dashboard.test(path)) {
                console.log('[SPA] ✅ Matched DASHBOARD route');
                await this.renderDashboard();
            } else if (this.routes.about.test(path)) {
                console.log('[SPA] ✅ Matched ABOUT route');
                await this.renderAbout();
            } else if (this.routes.privacy.test(path)) {
                console.log('[SPA] ✅ Matched PRIVACY route');
                await this.renderPrivacy();
            } else if (this.routes.terms.test(path)) {
                console.log('[SPA] ✅ Matched TERMS route');
                await this.renderTerms();
            } else {
                console.log('[SPA] ⚠️  No route matched, rendering 404');
                await this.render404();
            }

            // Update breadcrumb
            console.log('[SPA] 🍞 Updating breadcrumb...');
            this.updateBreadcrumb(path);

            // Store current route
            this.currentRoute = path;
            console.log('[SPA] ✓ Current route stored:', this.currentRoute);

            console.log('[SPA] ✅✅✅ Route rendered successfully ✅✅✅');
            console.log('[SPA] ═══════════════════════════════════════');

        } catch (error) {
            console.error('[SPA] ❌❌❌ Routing error:', error);
            console.error('[SPA] Stack trace:', error.stack);
            console.log('[SPA] ═══════════════════════════════════════');
            this.renderError(error);
        } finally {
            // Always reset the navigation flag to allow future navigations
            this._isNavigating = false;
        }
    }

    /**
     * Render home page
     * Shows loading spinner while fetching, error message if fails
     */
    async renderHome() {
        console.log('[SPA] ▶️  renderHome() called at:', new Date().toISOString());

        const mainContent = document.getElementById('main-content');
        console.log('[SPA] 🔍 Looking for main-content element...');
        console.log('[SPA] 📦 main-content found:', !!mainContent);

        if (!mainContent) {
            console.error('[SPA] ❌ CRITICAL: main-content element not found!');
            console.error('[SPA] 💡 DOM may not be ready or element ID is wrong');

            // Emit error event
            console.log('[SPA] 📡 Emitting render-error event');
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: {
                    route: 'home',
                    error: 'main-content element not found',
                    timestamp: Date.now()
                }
            }));
            return;
        }

        console.log('[SPA] ✓ main-content element found:', {
            tagName: mainContent.tagName,
            className: mainContent.className,
            display: mainContent.style.display,
            innerHTML: mainContent.innerHTML.substring(0, 100) + '...'
        });

        // Show loading spinner while preparing content
        mainContent.innerHTML = this.getLoadingHTML('Loading home page...');

        // PRIORITY: Use LandingPageView for home page (shows ONLY 12 asset type categories)
        if (typeof LandingPageView !== 'undefined') {
            console.log('[SPA] 🔧 LandingPageView class available, using it...');
            try {
                const landingView = new LandingPageView(this.db);
                console.log('[SPA] 📡 Calling landingView.render(mainContent)...');
                await landingView.render(mainContent);
                console.log('[SPA] ✅ Landing page rendered via LandingPageView');

                // Emit success event
                console.log('[SPA] 📡 Emitting first-render-complete event (LandingPageView)');
                document.dispatchEvent(new CustomEvent('first-render-complete', {
                    detail: {
                        route: 'home',
                        renderer: 'LandingPageView',
                        timestamp: Date.now()
                    }
                }));
                return;
            } catch (error) {
                console.error('[SPA] ❌ LandingPageView.render() failed:', error);
                // Continue to fallbacks
            }
        }

        // Fallback: Try PageAssetRenderer (dynamic Firebase page loading)
        if (typeof PageAssetRenderer !== 'undefined') {
            console.log('[SPA] 🔧 PageAssetRenderer class available, trying...');
            try {
                const renderer = new PageAssetRenderer(this.db);
                console.log('[SPA] 📡 Calling renderer.loadPage("home")...');
                const pageData = await renderer.loadPage('home');

                if (pageData) {
                    console.log('[SPA] ✅ Home page data loaded from Firebase');
                    await renderer.renderPage('home', mainContent);
                    console.log('[SPA] ✅ Home page rendered via PageAssetRenderer');

                    // Emit success event
                    console.log('[SPA] 📡 Emitting first-render-complete event (PageAssetRenderer)');
                    document.dispatchEvent(new CustomEvent('first-render-complete', {
                        detail: {
                            route: 'home',
                            renderer: 'PageAssetRenderer',
                            timestamp: Date.now()
                        }
                    }));
                    return;
                } else {
                    console.log('[SPA] ⚠️  Home page not found in Firebase, falling back to HomeView');
                }
            } catch (error) {
                console.warn('[SPA] ⚠️  PageAssetRenderer failed, falling back to HomeView:', error);
            }
        } else {
            console.log('[SPA] ℹ️  PageAssetRenderer class not defined, skipping');
        }

        // Fallback to HomeView class (old mythologies grid)
        if (typeof HomeView !== 'undefined') {
            console.log('[SPA] 🔧 HomeView class available, using it...');
            const homeView = new HomeView(this.db);
            console.log('[SPA] 📡 Calling homeView.render(mainContent)...');
            await homeView.render(mainContent);
            console.log('[SPA] ✅ Home page rendered via HomeView');

            // Emit success event
            console.log('[SPA] 📡 Emitting first-render-complete event (HomeView)');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'home',
                    renderer: 'HomeView',
                    timestamp: Date.now()
                }
            }));
            return;
        } else {
            console.log('[SPA] ℹ️  No view classes defined, using inline fallback');
        }

        // Fallback to inline rendering if HomeView not available
        console.warn('[SPA] ⚠️  Using inline fallback rendering (no HomeView or PageAssetRenderer)');

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

        console.log('[SPA] ✅ Home page rendered (inline fallback)');

        // Emit success event
        console.log('[SPA] 📡 Emitting first-render-complete event (inline)');
        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: {
                route: 'home',
                renderer: 'inline-fallback',
                timestamp: Date.now()
            }
        }));
    }

    async loadMythologyCounts(mythologies) {
        const collections = ['deities', 'heroes', 'creatures', 'texts', 'places', 'items'];

        for (const myth of mythologies) {
            let totalCount = 0;

            for (const collection of collections) {
                try {
                    const snapshot = await this.db.collection(collection)
                        .where('mythology', '==', myth.id)
                        .get();
                    totalCount += snapshot.size;
                } catch (error) {
                    console.error(`Error loading count for ${myth.id}:`, error);
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
            const snapshot = await this.db.collection('deities')
                .where('importance', '>=', 90)
                .orderBy('importance', 'desc')
                .limit(12)
                .get();

            const entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (entities.length > 0) {
                container.innerHTML = this.renderer.render(entities, 'grid');
            } else {
                container.innerHTML = '<p>No featured entities found</p>';
            }
        } catch (error) {
            console.error('Error loading featured entities:', error);
            container.innerHTML = '<p class="error">Error loading featured entities</p>';
        }
    }

    /**
     * Render mythologies grid page
     */
    async renderMythologies() {
        console.log('[SPA] ▶️  renderMythologies() called');
        const mainContent = document.getElementById('main-content');

        if (typeof MythologiesView !== 'undefined') {
            const mythologiesView = new MythologiesView(this.db);
            await mythologiesView.render(mainContent);
            console.log('[SPA] ✅ Mythologies grid rendered');
        } else {
            mainContent.innerHTML = `<div class="error-page"><h1>Mythologies View not available</h1></div>`;
            console.error('[SPA] MythologiesView class not found');
        }
    }

    /**
     * Render browse category page (deities, creatures, etc.)
     */
    async renderBrowseCategory(category, mythology = null) {
        console.log(`[SPA] ▶️  renderBrowseCategory() called: ${category}${mythology ? ` (${mythology})` : ''}`);
        const mainContent = document.getElementById('main-content');

        if (typeof BrowseCategoryView !== 'undefined') {
            const browseView = new BrowseCategoryView(this.db);
            await browseView.render(mainContent, { category, mythology });
            console.log('[SPA] ✅ Browse category rendered');
        } else {
            mainContent.innerHTML = `<div class="error-page"><h1>Browse View not available</h1></div>`;
            console.error('[SPA] BrowseCategoryView class not found');
        }
    }

    async renderMythology(mythologyId) {
        console.log('[SPA] ▶️  renderMythology() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Check if MythologyOverview component is available
            if (typeof MythologyOverview !== 'undefined') {
                console.log('[SPA] ✓ MythologyOverview class available, using it...');
                const mythologyView = new MythologyOverview({ db: this.db, router: this });
                const html = await mythologyView.render({ mythology: mythologyId });
                mainContent.innerHTML = html;
                console.log('[SPA] ✅ Mythology page rendered via MythologyOverview');
            } else {
                // Fallback to PageAssetRenderer for special mythology pages
                console.log('[SPA] ⚠️  MythologyOverview not available, trying PageAssetRenderer...');
                if (typeof PageAssetRenderer !== 'undefined') {
                    const renderer = new PageAssetRenderer(this.db);
                    const pageData = await renderer.loadPage(`mythology-${mythologyId}`);
                    if (pageData) {
                        await renderer.renderPage(`mythology-${mythologyId}`, mainContent);
                        console.log('[SPA] ✅ Mythology page rendered via PageAssetRenderer');
                    } else {
                        // Final fallback: basic mythology info
                        mainContent.innerHTML = await this.renderBasicMythologyPage(mythologyId);
                        console.log('[SPA] ✅ Mythology page rendered (basic fallback)');
                    }
                } else {
                    mainContent.innerHTML = await this.renderBasicMythologyPage(mythologyId);
                    console.log('[SPA] ✅ Mythology page rendered (basic fallback)');
                }
            }

            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'mythology',
                    mythologyId: mythologyId,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Mythology page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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
                console.error(`Error loading count for ${type}:`, error);
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
        console.log('[SPA] ▶️  renderCategory() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Use BrowseCategoryView to render the category page
            if (typeof BrowseCategoryView !== 'undefined') {
                console.log('[SPA] ✓ BrowseCategoryView class available, using it...');
                const browseView = new BrowseCategoryView(this.db);
                await browseView.render(mainContent, { category, mythology });
                console.log('[SPA] ✅ Category page rendered via BrowseCategoryView');
            } else {
                // Fallback to basic category rendering
                console.log('[SPA] ⚠️  BrowseCategoryView not available, using basic fallback...');
                mainContent.innerHTML = await this.renderBasicCategoryPage(mythology, category);
                console.log('[SPA] ✅ Category page rendered (basic fallback)');
            }

            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'category',
                    mythology: mythology,
                    category: category,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Category page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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
            console.error(`Error loading ${category} for ${mythology}:`, error);
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
        console.log('[SPA] ▶️  renderEntity() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Use FirebaseEntityRenderer to render the entity
            if (typeof FirebaseEntityRenderer !== 'undefined') {
                console.log('[SPA] ✓ FirebaseEntityRenderer class available, using it...');
                const entityRenderer = new FirebaseEntityRenderer();
                await entityRenderer.loadAndRender(categoryType, entityId, mythology, mainContent);
                console.log('[SPA] ✅ Entity page rendered via FirebaseEntityRenderer');
            } else {
                // Fallback to basic entity rendering
                console.log('[SPA] ⚠️  FirebaseEntityRenderer not available, using basic fallback...');
                mainContent.innerHTML = await this.renderBasicEntityPage(mythology, categoryType, entityId);
                console.log('[SPA] ✅ Entity page rendered (basic fallback)');
            }

            console.log('[SPA] 📡 Emitting first-render-complete event');
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
            console.error('[SPA] ❌ Entity page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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
            console.error(`Error loading entity ${entityId}:`, error);
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
        console.log('[SPA] ▶️  renderSearch() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Check if SearchViewComplete class is available (preferred)
            if (typeof SearchViewComplete !== 'undefined') {
                console.log('[SPA] ✓ SearchViewComplete class available, using it...');

                // Create and render complete search view
                const searchView = new SearchViewComplete(this.db);

                // Store globally for pagination callbacks
                window.searchViewInstance = searchView;

                console.log('[SPA] 📡 Rendering SearchViewComplete...');
                await searchView.render(mainContent);

                console.log('[SPA] ✅ Search page rendered via SearchViewComplete');
                console.log('[SPA] 📡 Emitting first-render-complete event');
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
                console.log('[SPA] ⚠️  Falling back to EnhancedCorpusSearch...');

                const container = document.createElement('div');
                container.id = 'search-container';
                mainContent.innerHTML = '';
                mainContent.appendChild(container);

                const searchEngine = new EnhancedCorpusSearch(this.db);
                // Note: EnhancedCorpusSearch may not have a render method
                // This is a placeholder - you may need to implement a UI wrapper

                console.log('[SPA] ✅ Search container created (EnhancedCorpusSearch)');
                console.log('[SPA] 📡 Emitting first-render-complete event');
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
            console.error('[SPA] ❌ No search component available');
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>Search Not Available</h1>
                    <p>The search component failed to load. Please refresh the page.</p>
                    <a href="#/" class="btn-primary">Return Home</a>
                </div>
            `;

        } catch (error) {
            console.error('[SPA] ❌ Search page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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
        console.log('[SPA] ▶️  renderCompare() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Check if CompareView class is available
            if (typeof CompareView === 'undefined') {
                console.error('[SPA] ❌ CompareView class not loaded');
                mainContent.innerHTML = `
                    <div class="error-page">
                        <h1>Error</h1>
                        <p>Compare component not loaded. Please refresh the page.</p>
                    </div>
                `;
                return;
            }

            console.log('[SPA] ✓ CompareView class available');

            // Create and render CompareView
            const compareView = new CompareView(this.db);

            console.log('[SPA] 📡 Rendering CompareView...');
            await compareView.render(mainContent);

            console.log('[SPA] ✅ Compare page rendered successfully');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'compare',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Compare page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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
        console.log('[SPA] ▶️  renderDashboard() called');

        try {
            const mainContent = document.getElementById('main-content');

            // Check if UserDashboard class is available
            if (typeof UserDashboard === 'undefined') {
                console.error('[SPA] ❌ UserDashboard class not loaded');
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
                console.error('[SPA] ❌ FirebaseCRUDManager class not loaded');
                mainContent.innerHTML = `
                    <div class="error-page">
                        <h1>Error</h1>
                        <p>CRUD manager not loaded. Please refresh the page.</p>
                    </div>
                `;
                return;
            }

            console.log('[SPA] ✓ UserDashboard and dependencies available');

            // Create CRUD manager instance
            const crudManager = new FirebaseCRUDManager(this.db, firebase.auth());

            // Create and render dashboard
            const dashboard = new UserDashboard({
                crudManager: crudManager,
                auth: firebase.auth()
            });

            console.log('[SPA] 📡 Rendering UserDashboard...');
            const dashboardHTML = await dashboard.render();
            mainContent.innerHTML = dashboardHTML;

            // Initialize dashboard event listeners
            console.log('[SPA] 🔧 Initializing dashboard event listeners...');
            dashboard.initialize(mainContent);

            console.log('[SPA] ✅ Dashboard page rendered successfully');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'dashboard',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Dashboard page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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
        console.log('[SPA] ▶️  renderAbout() called');

        try {
            const mainContent = document.getElementById('main-content');
            if (typeof AboutPage !== 'undefined') {
                const aboutPage = new AboutPage();
                aboutPage.render(mainContent);
            } else {
                mainContent.innerHTML = '<div class="error">AboutPage component not loaded</div>';
            }

            console.log('[SPA] ✅ About page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'about',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ About page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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
        console.log('[SPA] ▶️  renderPrivacy() called');

        try {
            const mainContent = document.getElementById('main-content');
            if (typeof PrivacyPage !== 'undefined') {
                const privacyPage = new PrivacyPage();
                privacyPage.render(mainContent);
            } else {
                mainContent.innerHTML = '<div class="error">PrivacyPage component not loaded</div>';
            }

            console.log('[SPA] ✅ Privacy page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'privacy',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Privacy page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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
        console.log('[SPA] ▶️  renderTerms() called');

        try {
            const mainContent = document.getElementById('main-content');
            if (typeof TermsPage !== 'undefined') {
                const termsPage = new TermsPage();
                termsPage.render(mainContent);
            } else {
                mainContent.innerHTML = '<div class="error">TermsPage component not loaded</div>';
            }

            console.log('[SPA] ✅ Terms page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'terms',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ Terms page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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
        console.log('[SPA] ▶️  render404() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>404</h1>
                    <p>Page not found</p>
                    <a href="#/" class="btn-primary">Return Home</a>
                </div>
            `;

            console.log('[SPA] ✅ 404 page rendered');
            console.log('[SPA] 📡 Emitting first-render-complete event');
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: '404',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA] ❌ 404 page render failed:', error);
            console.log('[SPA] 📡 Emitting render-error event');
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

    renderError(error) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="error-page">
                <h1>Error</h1>
                <p>${error.message}</p>
                <a href="#/" class="btn-primary">Return Home</a>
            </div>
        `;
    }

    showLoading() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            // Check if there's existing content to fade out
            const existingContent = mainContent.firstElementChild;
            if (existingContent && !existingContent.classList.contains('loading-container')) {
                // Fade out existing content first
                existingContent.classList.add('fade-out');
                existingContent.style.opacity = '0';
                existingContent.style.transition = 'opacity 0.15s ease-out';
            }

            // Use requestAnimationFrame for smooth transition
            requestAnimationFrame(() => {
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
            });
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
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPANavigation;
}
