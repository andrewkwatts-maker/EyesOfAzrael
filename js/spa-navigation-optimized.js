/**
 * Single Page Application Navigation System (OPTIMIZED)
 * Handles dynamic routing and content loading from Firebase
 * REQUIRES AUTHENTICATION FOR ALL PAGES
 *
 * OPTIMIZATION: Implements code splitting with dynamic imports
 * - Heavy components loaded only when needed
 * - Reduces initial bundle size significantly
 * - Improves Time to Interactive (TTI)
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

        // Component cache for dynamic imports
        this.componentCache = new Map();

        console.log('[SPA] ✓ Properties initialized:', {
            hasDB: !!this.db,
            hasAuth: !!this.auth,
            hasRenderer: !!this.renderer,
            authReady: this.authReady
        });

        // Route patterns
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

        // ⚡ OPTIMIZATION: Check currentUser synchronously first
        const syncCheckStart = performance.now();
        const currentUser = firebase.auth().currentUser;
        const syncCheckEnd = performance.now();

        console.log(`[SPA] ⚡ Synchronous auth check took: ${(syncCheckEnd - syncCheckStart).toFixed(2)}ms`);

        if (currentUser) {
            const fastPathEnd = performance.now();
            console.log('[SPA] ✨ CurrentUser available immediately:', currentUser.email);
            console.log('[SPA] ⚡ FAST PATH: Skipping async auth wait (performance optimization)');
            console.log(`[SPA] 📊 Total constructor time (fast path): ${(fastPathEnd - constructorStart).toFixed(2)}ms`);

            this.authReady = true;

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initRouter());
            } else {
                this.initRouter();
            }
        } else {
            console.log('[SPA] 🔒 No currentUser, taking SLOW PATH (async wait)...');
            this.waitForAuth().then((user) => {
                this.authReady = true;
                this.initRouter();
            }).catch((error) => {
                console.error('[SPA] ❌ waitForAuth() rejected with error:', error);
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
        console.log('[SPA] 🚀 initRouter() called at:', new Date().toISOString());

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('popstate', () => this.handleRoute());

        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]') || e.target.closest('a[href^="#"]')) {
                const link = e.target.matches('a') ? e.target : e.target.closest('a');
                if (link.hash) {
                    e.preventDefault();
                    this.navigate(link.hash);
                }
            }
        });

        this.handleRoute();
        console.log('[SPA] 🏁 initRouter() completed');
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
     * ⚡ OPTIMIZATION: Dynamic component loader with caching
     */
    async loadComponent(componentName) {
        // Check cache first
        if (this.componentCache.has(componentName)) {
            console.log(`[SPA] 💾 Using cached component: ${componentName}`);
            return this.componentCache.get(componentName);
        }

        console.log(`[SPA] 📦 Loading component dynamically: ${componentName}`);
        const loadStart = performance.now();

        try {
            let component;

            switch (componentName) {
                case 'SearchViewComplete':
                    // Dynamic import - only loaded when user visits search
                    if (typeof SearchViewComplete === 'undefined') {
                        await this.loadScript('js/components/search-view-complete.min.js');
                    }
                    component = SearchViewComplete;
                    break;

                case 'CompareView':
                    if (typeof CompareView === 'undefined') {
                        await this.loadScript('js/components/compare-view.min.js');
                    }
                    component = CompareView;
                    break;

                case 'UserDashboard':
                    if (typeof UserDashboard === 'undefined') {
                        await Promise.all([
                            this.loadScript('js/components/user-dashboard.min.js'),
                            this.loadScript('js/firebase-crud-manager.min.js')
                        ]);
                    }
                    component = UserDashboard;
                    break;

                case 'EntityEditor':
                    if (typeof EntityEditor === 'undefined') {
                        await this.loadScript('js/entity-editor.min.js');
                    }
                    component = EntityEditor;
                    break;

                case 'HomeView':
                    if (typeof HomeView === 'undefined') {
                        await this.loadScript('js/views/home-view.min.js');
                    }
                    component = HomeView;
                    break;

                default:
                    throw new Error(`Unknown component: ${componentName}`);
            }

            const loadEnd = performance.now();
            console.log(`[SPA] ✅ Component loaded in ${(loadEnd - loadStart).toFixed(2)}ms: ${componentName}`);

            // Cache the component
            this.componentCache.set(componentName, component);

            return component;
        } catch (error) {
            console.error(`[SPA] ❌ Failed to load component: ${componentName}`, error);
            throw error;
        }
    }

    /**
     * ⚡ OPTIMIZATION: Dynamic script loader
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.type = 'module';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Handle current route
     */
    async handleRoute() {
        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');

        console.log('[SPA] 🛣️  handleRoute():', path);

        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackPageView(path);
        }

        if (this.currentRoute && window.AnalyticsManager) {
            window.AnalyticsManager.trackNavigation(this.currentRoute, path);
        }

        const mainContent = document.getElementById('main-content');

        if (!this.authReady) {
            this.showAuthWaitingState(mainContent);
            return;
        }

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            this.showAuthWaitingState(mainContent);
            return;
        }

        this.addToHistory(path);
        this.showLoading();

        try {
            // Route matching with dynamic imports
            if (this.routes.home.test(path)) {
                await this.renderHome();
            } else if (this.routes.entity.test(path)) {
                const match = path.match(this.routes.entity);
                await this.renderEntity(match[1], match[2], match[3]);
            } else if (this.routes.category.test(path)) {
                const match = path.match(this.routes.category);
                await this.renderCategory(match[1], match[2]);
            } else if (this.routes.mythology.test(path)) {
                const match = path.match(this.routes.mythology);
                await this.renderMythology(match[1]);
            } else if (this.routes.search.test(path)) {
                await this.renderSearch();
            } else if (this.routes.compare.test(path)) {
                await this.renderCompare();
            } else if (this.routes.dashboard.test(path)) {
                await this.renderDashboard();
            } else if (this.routes.about.test(path)) {
                await this.renderAbout();
            } else if (this.routes.privacy.test(path)) {
                await this.renderPrivacy();
            } else if (this.routes.terms.test(path)) {
                await this.renderTerms();
            } else {
                await this.render404();
            }

            this.updateBreadcrumb(path);
            this.currentRoute = path;

        } catch (error) {
            console.error('[SPA] ❌ Routing error:', error);
            this.renderError(error);
        }
    }

    /**
     * Render home page (lightweight inline version)
     */
    async renderHome() {
        const mainContent = document.getElementById('main-content');

        // Try PageAssetRenderer first (dynamic Firebase loading)
        if (typeof PageAssetRenderer !== 'undefined') {
            try {
                const renderer = new PageAssetRenderer(this.db);
                const pageData = await renderer.loadPage('home');

                if (pageData) {
                    await renderer.renderPage('home', mainContent);
                    this.emitRenderComplete('home', 'PageAssetRenderer');
                    return;
                }
            } catch (error) {
                console.warn('[SPA] PageAssetRenderer failed:', error);
            }
        }

        // ⚡ OPTIMIZATION: Load HomeView dynamically only if needed
        try {
            const HomeView = await this.loadComponent('HomeView');
            const homeView = new HomeView(this.db);
            await homeView.render(mainContent);
            this.emitRenderComplete('home', 'HomeView');
            return;
        } catch (error) {
            console.warn('[SPA] HomeView failed, using inline:', error);
        }

        // Lightweight inline fallback
        this.renderHomeFallback(mainContent);
    }

    renderHomeFallback(mainContent) {
        const mythologies = [
            { id: 'greek', name: 'Greek', icon: '🏛️', color: '#4A90E2' },
            { id: 'norse', name: 'Norse', icon: '⚔️', color: '#7C4DFF' },
            { id: 'egyptian', name: 'Egyptian', icon: '🔺', color: '#FFB300' },
            { id: 'hindu', name: 'Hindu', icon: '🕉️', color: '#E91E63' },
            { id: 'chinese', name: 'Chinese', icon: '🐉', color: '#F44336' },
            { id: 'japanese', name: 'Japanese', icon: '⛩️', color: '#FF5722' },
            { id: 'celtic', name: 'Celtic', icon: '🍀', color: '#4CAF50' },
            { id: 'babylonian', name: 'Babylonian', icon: '🏺', color: '#795548' },
            { id: 'christian', name: 'Christian', icon: '✝️', color: '#2196F3' }
        ];

        mainContent.innerHTML = `
            <div class="home-container">
                <div class="hero-section">
                    <h1 class="hero-title">Explore World Mythologies</h1>
                    <p class="hero-subtitle">Discover deities, heroes, creatures, and sacred texts</p>
                    <div class="hero-search">
                        <input type="text" id="quick-search" placeholder="Search..." class="search-input-large">
                        <button id="search-btn" class="btn-primary btn-large">🔍 Search</button>
                    </div>
                </div>
                <div class="mythologies-grid">
                    ${mythologies.map(m => `
                        <a href="#/mythology/${m.id}" class="mythology-card">
                            <div class="myth-icon" style="color: ${m.color}">${m.icon}</div>
                            <h3 class="myth-name">${m.name}</h3>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;

        this.attachSearchListeners();
        this.emitRenderComplete('home', 'inline');
    }

    attachSearchListeners() {
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('quick-search');

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value;
                if (query) this.navigate(`/search?q=${encodeURIComponent(query)}`);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchBtn.click();
            });
        }
    }

    async renderMythology(mythologyId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="mythology-page"><h1>${mythologyId} Mythology</h1></div>`;
        this.emitRenderComplete('mythology');
    }

    async renderCategory(mythology, category) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="category-page"><h1>${category} - ${mythology}</h1></div>`;
        this.emitRenderComplete('category');
    }

    async renderEntity(mythology, categoryType, entityId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="entity-page"><h1>${entityId}</h1></div>`;
        this.emitRenderComplete('entity');
    }

    /**
     * ⚡ OPTIMIZATION: Search loaded dynamically
     */
    async renderSearch() {
        const mainContent = document.getElementById('main-content');

        try {
            const SearchViewComplete = await this.loadComponent('SearchViewComplete');
            const searchView = new SearchViewComplete(this.db);
            window.searchViewInstance = searchView;

            await searchView.render(mainContent);
            this.emitRenderComplete('search', 'SearchViewComplete');
        } catch (error) {
            console.error('[SPA] Search component failed:', error);
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>Search Not Available</h1>
                    <p>Please refresh the page.</p>
                    <a href="#/" class="btn-primary">Return Home</a>
                </div>
            `;
        }
    }

    /**
     * ⚡ OPTIMIZATION: Compare loaded dynamically
     */
    async renderCompare() {
        const mainContent = document.getElementById('main-content');

        try {
            const CompareView = await this.loadComponent('CompareView');
            const compareView = new CompareView(this.db);

            await compareView.render(mainContent);
            this.emitRenderComplete('compare', 'CompareView');
        } catch (error) {
            console.error('[SPA] Compare component failed:', error);
            mainContent.innerHTML = `<div class="error">Compare unavailable</div>`;
        }
    }

    /**
     * ⚡ OPTIMIZATION: Dashboard loaded dynamically
     */
    async renderDashboard() {
        const mainContent = document.getElementById('main-content');

        try {
            const UserDashboard = await this.loadComponent('UserDashboard');
            const crudManager = new FirebaseCRUDManager(this.db, firebase.auth());
            const dashboard = new UserDashboard({ crudManager, auth: firebase.auth() });

            const dashboardHTML = await dashboard.render();
            mainContent.innerHTML = dashboardHTML;
            dashboard.initialize(mainContent);

            this.emitRenderComplete('dashboard', 'UserDashboard');
        } catch (error) {
            console.error('[SPA] Dashboard component failed:', error);
            mainContent.innerHTML = `<div class="error">Dashboard unavailable</div>`;
        }
    }

    async renderAbout() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="static-page"><h1>About</h1></div>';
        this.emitRenderComplete('about');
    }

    async renderPrivacy() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="static-page"><h1>Privacy Policy</h1></div>';
        this.emitRenderComplete('privacy');
    }

    async renderTerms() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="static-page"><h1>Terms of Service</h1></div>';
        this.emitRenderComplete('terms');
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
        this.emitRenderComplete('404');
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
            mainContent.innerHTML = `
                <div class="loading-container">
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

    showAuthWaitingState(container) {
        if (!container) container = document.getElementById('main-content');
        if (container) {
            container.innerHTML = `
                <div class="loading-container">
                    <div class="spinner-container">
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-message">Verifying authentication...</p>
                </div>
            `;
        }
    }

    emitRenderComplete(route, renderer = 'default') {
        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: { route, renderer, timestamp: Date.now() }
        }));
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
