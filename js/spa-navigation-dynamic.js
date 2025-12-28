/**
 * Single Page Application Navigation System with Dynamic Imports
 * Route-based code splitting for optimal performance
 * REQUIRES AUTHENTICATION FOR ALL PAGES
 *
 * PERFORMANCE FEATURES:
 * - Dynamic imports for on-demand loading
 * - View caching to prevent re-importing
 * - Loading indicators for better UX
 * - Performance analytics tracking
 * - Graceful fallback to sync loading
 */

class SPANavigationDynamic {
    constructor(firestore, authManager, renderer) {
        const constructorStart = performance.now();
        console.log('[SPA Dynamic] 🔧 Constructor called at:', new Date().toISOString());

        this.db = firestore;
        this.auth = authManager;
        this.renderer = renderer;
        this.currentRoute = null;
        this.routeHistory = [];
        this.maxHistory = 50;
        this.authReady = false;

        // View cache to prevent re-importing
        this.viewCache = new Map();

        // Loading state tracking
        this.isLoading = false;
        this.loadingStartTime = null;

        console.log('[SPA Dynamic] ✓ Properties initialized:', {
            hasDB: !!this.db,
            hasAuth: !!this.auth,
            hasRenderer: !!this.renderer,
            authReady: this.authReady
        });

        // Route patterns (same as before)
        this.routes = {
            home: /^#?\/?$/,
            mythology: /^#?\/mythology\/([^\/]+)\/?$/,
            entity: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
            category: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/?$/,
            search: /^#?\/search\/?$/,
            compare: /^#?\/compare\/?$/,
            dashboard: /^#?\/dashboard\/?$/,
            about: /^#?\/about\/?$/,
            privacy: /^#?\/privacy\/?$/,
            terms: /^#?\/terms\/?$/
        };

        // Dynamic import loaders for each route
        this.routeLoaders = {
            home: () => this.loadHomeView(),
            search: () => this.loadSearchView(),
            compare: () => this.loadCompareView(),
            dashboard: () => this.loadDashboardView(),
            about: () => this.loadAboutView(),
            privacy: () => this.loadPrivacyView(),
            terms: () => this.loadTermsView()
        };

        // Performance tracking
        this.performanceMetrics = {
            routeLoads: [],
            cacheHits: 0,
            cacheMisses: 0,
            totalLoadTime: 0,
            averageLoadTime: 0
        };

        // Check currentUser synchronously first (optimization)
        const syncCheckStart = performance.now();
        const currentUser = firebase.auth().currentUser;
        const syncCheckEnd = performance.now();

        console.log(`[SPA Dynamic] ⚡ Synchronous auth check took: ${(syncCheckEnd - syncCheckStart).toFixed(2)}ms`);

        if (currentUser) {
            // Fast path: User already authenticated
            const fastPathEnd = performance.now();
            console.log('[SPA Dynamic] ✨ CurrentUser available immediately:', currentUser.email);
            console.log('[SPA Dynamic] ⚡ FAST PATH: Skipping async auth wait');
            console.log(`[SPA Dynamic] 📊 Total constructor time (fast path): ${(fastPathEnd - constructorStart).toFixed(2)}ms`);

            this.authReady = true;

            // Initialize router immediately
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initRouter();
                });
            } else {
                this.initRouter();
            }
        } else {
            // Slow path: Wait for auth state change
            console.log('[SPA Dynamic] 🔒 No currentUser, taking SLOW PATH (async wait)...');

            this.waitForAuth().then((user) => {
                const slowPathEnd = performance.now();
                console.log('[SPA Dynamic] ✅ waitForAuth() resolved with user:', user ? user.email : 'null');
                console.log(`[SPA Dynamic] 📊 Total auth wait time: ${(slowPathEnd - constructorStart).toFixed(2)}ms`);

                this.authReady = true;
                this.initRouter();
            }).catch((error) => {
                console.error('[SPA Dynamic] ❌ waitForAuth() rejected:', error);
            });
        }
    }

    /**
     * Wait for Firebase Auth to be ready
     */
    async waitForAuth() {
        return new Promise((resolve, reject) => {
            const auth = firebase.auth();
            if (!auth) {
                reject(new Error('Firebase auth not available'));
                return;
            }

            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    /**
     * Initialize router and event listeners
     */
    initRouter() {
        console.log('[SPA Dynamic] 🚀 initRouter() called');

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            console.log('[SPA Dynamic] 📍 hashchange event triggered');
            this.handleRoute();
        });

        window.addEventListener('popstate', () => {
            console.log('[SPA Dynamic] 📍 popstate event triggered');
            this.handleRoute();
        });

        // Intercept link clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]') || e.target.closest('a[href^="#"]')) {
                const link = e.target.matches('a') ? e.target : e.target.closest('a');
                if (link.hash) {
                    e.preventDefault();
                    this.navigate(link.hash);
                }
            }
        });

        // Initial route
        this.handleRoute();
    }

    /**
     * Navigate to a route
     */
    navigate(path) {
        if (!path.startsWith('#')) {
            path = '#' + path;
        }
        window.location.hash = path;
    }

    /**
     * Handle current route with dynamic imports
     */
    async handleRoute() {
        const timestamp = new Date().toISOString();
        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');

        console.log('[SPA Dynamic] ═══════════════════════════════════════');
        console.log('[SPA Dynamic] 🛣️  handleRoute() called at:', timestamp);
        console.log('[SPA Dynamic] 📍 Current hash:', hash);
        console.log('[SPA Dynamic] 📍 Parsed path:', path);

        // Track page view
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackPageView(path);
        }

        // Track navigation
        if (this.currentRoute && window.AnalyticsManager) {
            window.AnalyticsManager.trackNavigation(this.currentRoute, path);
        }

        const mainContent = document.getElementById('main-content');

        // Check authentication
        if (!this.authReady) {
            this.showAuthWaitingState(mainContent);
            return;
        }

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            this.showAuthWaitingState(mainContent);
            return;
        }

        // Add to history
        this.addToHistory(path);

        // Show loading
        this.showLoadingIndicator();

        try {
            // Match route and load view dynamically
            if (this.routes.home.test(path)) {
                console.log('[SPA Dynamic] ✅ Matched HOME route');
                await this.renderHome();
            } else if (this.routes.entity.test(path)) {
                const match = path.match(this.routes.entity);
                console.log('[SPA Dynamic] ✅ Matched ENTITY route');
                await this.renderEntity(match[1], match[2], match[3]);
            } else if (this.routes.category.test(path)) {
                const match = path.match(this.routes.category);
                console.log('[SPA Dynamic] ✅ Matched CATEGORY route');
                await this.renderCategory(match[1], match[2]);
            } else if (this.routes.mythology.test(path)) {
                const match = path.match(this.routes.mythology);
                console.log('[SPA Dynamic] ✅ Matched MYTHOLOGY route');
                await this.renderMythology(match[1]);
            } else if (this.routes.search.test(path)) {
                console.log('[SPA Dynamic] ✅ Matched SEARCH route');
                await this.renderSearch();
            } else if (this.routes.compare.test(path)) {
                console.log('[SPA Dynamic] ✅ Matched COMPARE route');
                await this.renderCompare();
            } else if (this.routes.dashboard.test(path)) {
                console.log('[SPA Dynamic] ✅ Matched DASHBOARD route');
                await this.renderDashboard();
            } else if (this.routes.about.test(path)) {
                console.log('[SPA Dynamic] ✅ Matched ABOUT route');
                await this.renderAbout();
            } else if (this.routes.privacy.test(path)) {
                console.log('[SPA Dynamic] ✅ Matched PRIVACY route');
                await this.renderPrivacy();
            } else if (this.routes.terms.test(path)) {
                console.log('[SPA Dynamic] ✅ Matched TERMS route');
                await this.renderTerms();
            } else {
                console.log('[SPA Dynamic] ⚠️  No route matched');
                await this.render404();
            }

            // Update breadcrumb
            this.updateBreadcrumb(path);

            // Store current route
            this.currentRoute = path;

            console.log('[SPA Dynamic] ✅✅✅ Route rendered successfully ✅✅✅');

        } catch (error) {
            console.error('[SPA Dynamic] ❌ Routing error:', error);
            this.renderError(error);
        } finally {
            this.hideLoadingIndicator();
        }
    }

    /**
     * Dynamic import loader for Home View
     */
    async loadHomeView() {
        const start = performance.now();
        const cacheKey = 'home';

        try {
            // Check cache first
            if (this.viewCache.has(cacheKey)) {
                console.log('[SPA Dynamic] ⚡ Cache hit: HomeView');
                this.performanceMetrics.cacheHits++;
                return this.viewCache.get(cacheKey);
            }

            console.log('[SPA Dynamic] 📦 Dynamically importing HomeView...');
            this.performanceMetrics.cacheMisses++;

            // Dynamic import with error handling
            const module = await import('./views/home-view.js');
            const ViewClass = module.HomeView;

            if (!ViewClass) {
                throw new Error('HomeView class not found in module');
            }

            const instance = new ViewClass(this.db);

            // Cache the instance
            this.viewCache.set(cacheKey, instance);

            const duration = performance.now() - start;
            console.log(`[SPA Dynamic] ✅ HomeView loaded in ${duration.toFixed(2)}ms`);

            // Track performance
            this.trackRouteLoad('home', duration, false);

            return instance;

        } catch (error) {
            console.error('[SPA Dynamic] ❌ Failed to load HomeView:', error);

            // Fallback to global if available
            if (typeof HomeView !== 'undefined') {
                console.log('[SPA Dynamic] 🔄 Falling back to global HomeView');
                return new HomeView(this.db);
            }

            throw error;
        }
    }

    /**
     * Dynamic import loader for Search View
     */
    async loadSearchView() {
        const start = performance.now();
        const cacheKey = 'search';

        try {
            if (this.viewCache.has(cacheKey)) {
                console.log('[SPA Dynamic] ⚡ Cache hit: SearchView');
                this.performanceMetrics.cacheHits++;
                return this.viewCache.get(cacheKey);
            }

            console.log('[SPA Dynamic] 📦 Dynamically importing SearchViewComplete...');
            this.performanceMetrics.cacheMisses++;

            const module = await import('./components/search-view-complete.js');
            const ViewClass = module.SearchViewComplete;

            if (!ViewClass) {
                throw new Error('SearchViewComplete class not found');
            }

            const instance = new ViewClass(this.db);
            this.viewCache.set(cacheKey, instance);

            const duration = performance.now() - start;
            console.log(`[SPA Dynamic] ✅ SearchView loaded in ${duration.toFixed(2)}ms`);

            this.trackRouteLoad('search', duration, false);

            return instance;

        } catch (error) {
            console.error('[SPA Dynamic] ❌ Failed to load SearchView:', error);

            if (typeof SearchViewComplete !== 'undefined') {
                console.log('[SPA Dynamic] 🔄 Falling back to global SearchViewComplete');
                return new SearchViewComplete(this.db);
            }

            throw error;
        }
    }

    /**
     * Dynamic import loader for Compare View
     */
    async loadCompareView() {
        const start = performance.now();
        const cacheKey = 'compare';

        try {
            if (this.viewCache.has(cacheKey)) {
                console.log('[SPA Dynamic] ⚡ Cache hit: CompareView');
                this.performanceMetrics.cacheHits++;
                return this.viewCache.get(cacheKey);
            }

            console.log('[SPA Dynamic] 📦 Dynamically importing CompareView...');
            this.performanceMetrics.cacheMisses++;

            const module = await import('./components/compare-view.js');
            const ViewClass = module.CompareView;

            if (!ViewClass) {
                throw new Error('CompareView class not found');
            }

            const instance = new ViewClass(this.db);
            this.viewCache.set(cacheKey, instance);

            const duration = performance.now() - start;
            console.log(`[SPA Dynamic] ✅ CompareView loaded in ${duration.toFixed(2)}ms`);

            this.trackRouteLoad('compare', duration, false);

            return instance;

        } catch (error) {
            console.error('[SPA Dynamic] ❌ Failed to load CompareView:', error);

            if (typeof CompareView !== 'undefined') {
                console.log('[SPA Dynamic] 🔄 Falling back to global CompareView');
                return new CompareView(this.db);
            }

            throw error;
        }
    }

    /**
     * Dynamic import loader for Dashboard View
     */
    async loadDashboardView() {
        const start = performance.now();
        const cacheKey = 'dashboard';

        try {
            if (this.viewCache.has(cacheKey)) {
                console.log('[SPA Dynamic] ⚡ Cache hit: UserDashboard');
                this.performanceMetrics.cacheHits++;
                return this.viewCache.get(cacheKey);
            }

            console.log('[SPA Dynamic] 📦 Dynamically importing UserDashboard...');
            this.performanceMetrics.cacheMisses++;

            const module = await import('./components/user-dashboard.js');
            const ViewClass = module.UserDashboard;

            if (!ViewClass) {
                throw new Error('UserDashboard class not found');
            }

            // Dashboard needs CRUD manager
            if (typeof FirebaseCRUDManager === 'undefined') {
                throw new Error('FirebaseCRUDManager not available');
            }

            const crudManager = new FirebaseCRUDManager(this.db, firebase.auth());
            const instance = new ViewClass({
                crudManager: crudManager,
                auth: firebase.auth()
            });

            this.viewCache.set(cacheKey, instance);

            const duration = performance.now() - start;
            console.log(`[SPA Dynamic] ✅ UserDashboard loaded in ${duration.toFixed(2)}ms`);

            this.trackRouteLoad('dashboard', duration, false);

            return instance;

        } catch (error) {
            console.error('[SPA Dynamic] ❌ Failed to load UserDashboard:', error);

            if (typeof UserDashboard !== 'undefined') {
                console.log('[SPA Dynamic] 🔄 Falling back to global UserDashboard');
                const crudManager = new FirebaseCRUDManager(this.db, firebase.auth());
                return new UserDashboard({ crudManager, auth: firebase.auth() });
            }

            throw error;
        }
    }

    /**
     * Dynamic import loaders for static pages
     */
    async loadAboutView() {
        return this.loadStaticPage('about', './components/about-page.js', 'AboutPage');
    }

    async loadPrivacyView() {
        return this.loadStaticPage('privacy', './components/privacy-page.js', 'PrivacyPage');
    }

    async loadTermsView() {
        return this.loadStaticPage('terms', './components/terms-page.js', 'TermsPage');
    }

    /**
     * Generic static page loader
     */
    async loadStaticPage(cacheKey, modulePath, className) {
        const start = performance.now();

        try {
            if (this.viewCache.has(cacheKey)) {
                console.log(`[SPA Dynamic] ⚡ Cache hit: ${className}`);
                this.performanceMetrics.cacheHits++;
                return this.viewCache.get(cacheKey);
            }

            console.log(`[SPA Dynamic] 📦 Dynamically importing ${className}...`);
            this.performanceMetrics.cacheMisses++;

            const module = await import(modulePath);
            const ViewClass = module[className];

            if (!ViewClass) {
                throw new Error(`${className} class not found`);
            }

            const instance = new ViewClass();
            this.viewCache.set(cacheKey, instance);

            const duration = performance.now() - start;
            console.log(`[SPA Dynamic] ✅ ${className} loaded in ${duration.toFixed(2)}ms`);

            this.trackRouteLoad(cacheKey, duration, false);

            return instance;

        } catch (error) {
            console.error(`[SPA Dynamic] ❌ Failed to load ${className}:`, error);

            // Fallback to global
            const globalClass = window[className];
            if (globalClass) {
                console.log(`[SPA Dynamic] 🔄 Falling back to global ${className}`);
                return new globalClass();
            }

            throw error;
        }
    }

    /**
     * Render methods using dynamic imports
     */
    async renderHome() {
        const mainContent = document.getElementById('main-content');

        try {
            const homeView = await this.loadHomeView();
            await homeView.render(mainContent);

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'home',
                    renderer: 'HomeView-Dynamic',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA Dynamic] Error rendering home:', error);
            throw error;
        }
    }

    async renderSearch() {
        const mainContent = document.getElementById('main-content');

        try {
            const searchView = await this.loadSearchView();
            window.searchViewInstance = searchView;
            await searchView.render(mainContent);

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'search',
                    renderer: 'SearchView-Dynamic',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA Dynamic] Error rendering search:', error);
            throw error;
        }
    }

    async renderCompare() {
        const mainContent = document.getElementById('main-content');

        try {
            const compareView = await this.loadCompareView();
            await compareView.render(mainContent);

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'compare',
                    renderer: 'CompareView-Dynamic',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA Dynamic] Error rendering compare:', error);
            throw error;
        }
    }

    async renderDashboard() {
        const mainContent = document.getElementById('main-content');

        try {
            const dashboard = await this.loadDashboardView();
            const dashboardHTML = await dashboard.render();
            mainContent.innerHTML = dashboardHTML;
            dashboard.initialize(mainContent);

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'dashboard',
                    renderer: 'Dashboard-Dynamic',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA Dynamic] Error rendering dashboard:', error);
            throw error;
        }
    }

    async renderAbout() {
        const mainContent = document.getElementById('main-content');

        try {
            const aboutPage = await this.loadAboutView();
            aboutPage.render(mainContent);

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'about',
                    renderer: 'About-Dynamic',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA Dynamic] Error rendering about:', error);
            throw error;
        }
    }

    async renderPrivacy() {
        const mainContent = document.getElementById('main-content');

        try {
            const privacyPage = await this.loadPrivacyView();
            privacyPage.render(mainContent);

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'privacy',
                    renderer: 'Privacy-Dynamic',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA Dynamic] Error rendering privacy:', error);
            throw error;
        }
    }

    async renderTerms() {
        const mainContent = document.getElementById('main-content');

        try {
            const termsPage = await this.loadTermsView();
            termsPage.render(mainContent);

            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'terms',
                    renderer: 'Terms-Dynamic',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('[SPA Dynamic] Error rendering terms:', error);
            throw error;
        }
    }

    // Placeholder methods (same as original)
    async renderMythology(mythologyId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="mythology-page"><h1>${mythologyId} Mythology</h1><p>Coming soon...</p></div>`;

        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: { route: 'mythology', mythologyId, timestamp: Date.now() }
        }));
    }

    async renderCategory(mythology, category) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="category-page"><h1>${category} - ${mythology}</h1><p>Coming soon...</p></div>`;

        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: { route: 'category', mythology, category, timestamp: Date.now() }
        }));
    }

    async renderEntity(mythology, categoryType, entityId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="entity-page"><h1>${entityId}</h1><p>Coming soon...</p></div>`;

        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: { route: 'entity', mythology, categoryType, entityId, timestamp: Date.now() }
        }));
    }

    async render404() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="error-page">
                <h1>404</h1>
                <p>Page not found</p>
                <a href="#/" class="btn-primary">Return Home</a>
            </div>
        `;

        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: { route: '404', timestamp: Date.now() }
        }));
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

    /**
     * Show loading indicator while dynamically importing
     */
    showLoadingIndicator() {
        this.loadingStartTime = performance.now();
        this.isLoading = true;

        let indicator = document.getElementById('route-loading');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'route-loading';
            indicator.innerHTML = `
                <div class="loading-indicator" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(var(--color-bg-primary-rgb, 10, 14, 39), 0.9);
                    backdrop-filter: blur(8px);
                    z-index: 9998;
                    animation: fadeIn 0.2s ease;
                ">
                    <div style="text-align: center;">
                        <div class="spinner-container" style="margin-bottom: 1rem;">
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                        </div>
                        <p style="color: var(--color-text-secondary); font-size: 0.9rem;">
                            Loading route...
                        </p>
                    </div>
                </div>
                <style>
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                </style>
            `;
            document.body.appendChild(indicator);
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        const indicator = document.getElementById('route-loading');
        if (indicator) {
            indicator.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                indicator.remove();
            }, 200);
        }

        if (this.loadingStartTime) {
            const loadTime = performance.now() - this.loadingStartTime;
            console.log(`[SPA Dynamic] ⏱️  Route load time: ${loadTime.toFixed(2)}ms`);
            this.loadingStartTime = null;
        }

        this.isLoading = false;
    }

    /**
     * Show auth waiting state
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
     * Track route load performance
     */
    trackRouteLoad(route, duration, cached) {
        this.performanceMetrics.routeLoads.push({
            route,
            duration,
            cached,
            timestamp: Date.now()
        });

        this.performanceMetrics.totalLoadTime += duration;
        this.performanceMetrics.averageLoadTime =
            this.performanceMetrics.totalLoadTime / this.performanceMetrics.routeLoads.length;

        // Track with analytics if available
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackPerformance('route_load', {
                route,
                duration,
                cached
            });
        }
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            ...this.performanceMetrics,
            cacheHitRate: this.performanceMetrics.cacheHits /
                (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100
        };
    }

    /**
     * Clear view cache (useful for development/debugging)
     */
    clearCache() {
        console.log('[SPA Dynamic] 🗑️  Clearing view cache');
        this.viewCache.clear();
        this.performanceMetrics.cacheHits = 0;
        this.performanceMetrics.cacheMisses = 0;
    }

    // Utility methods (same as original)
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
    module.exports = SPANavigationDynamic;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.SPANavigationDynamic = SPANavigationDynamic;
}
