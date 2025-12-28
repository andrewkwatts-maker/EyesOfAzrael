/**
 * Single Page Application Navigation System
 * Handles dynamic routing and content loading from Firebase
 * REQUIRES AUTHENTICATION FOR ALL PAGES
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
            // Fast path: User already authenticated
            const fastPathEnd = performance.now();
            console.log('[SPA] ✨ CurrentUser available immediately:', currentUser.email);
            console.log('[SPA] ⚡ FAST PATH: Skipping async auth wait (performance optimization)');
            console.log(`[SPA] 📊 Total constructor time (fast path): ${(fastPathEnd - constructorStart).toFixed(2)}ms`);

            this.authReady = true;

            // Initialize router immediately (synchronous path)
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

            console.log('[SPA] 🏁 Constructor completed (FAST PATH - synchronous)');
        } else {
            // Slow path: Wait for auth state change
            console.log('[SPA] 🔒 No currentUser, taking SLOW PATH (async wait)...');
            console.log('[SPA] 🔒 Starting waitForAuth()...');

            // Wait for auth to be ready before initializing router
            this.waitForAuth().then((user) => {
                const slowPathEnd = performance.now();
                console.log('[SPA] ✅ waitForAuth() resolved with user:', user ? user.email : 'null');
                console.log(`[SPA] 📊 Total auth wait time (slow path): ${(slowPathEnd - constructorStart).toFixed(2)}ms`);

                this.authReady = true;
                console.log('[SPA] 🔓 Auth ready flag set to true');
                this.initRouter();
            }).catch((error) => {
                console.error('[SPA] ❌ waitForAuth() rejected with error:', error);
            });

            console.log('[SPA] 🏁 Constructor completed (SLOW PATH - waitForAuth is async)');
        }
    }

    /**
     * Wait for Firebase Auth to be ready
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

            console.log('[SPA] 📡 Registering onAuthStateChanged listener...');

            // Firebase auth ready check - just resolve, auth guard handles UI
            const unsubscribe = auth.onAuthStateChanged((user) => {
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
     * Initialize router and event listeners
     */
    initRouter() {
        console.log('[SPA] 🚀 initRouter() called at:', new Date().toISOString());
        console.log('[SPA] 🔍 Current state:', {
            authReady: this.authReady,
            currentRoute: this.currentRoute,
            hash: window.location.hash
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            console.log('[SPA] 📍 hashchange event triggered, hash:', window.location.hash);
            this.handleRoute();
        });

        window.addEventListener('popstate', () => {
            console.log('[SPA] 📍 popstate event triggered');
            this.handleRoute();
        });

        console.log('[SPA] ✓ Event listeners registered (hashchange, popstate)');

        // Intercept link clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]') || e.target.closest('a[href^="#"]')) {
                const link = e.target.matches('a') ? e.target : e.target.closest('a');
                if (link.hash) {
                    console.log('[SPA] 🔗 Intercepted link click:', link.hash);
                    e.preventDefault();
                    this.navigate(link.hash);
                }
            }
        });

        console.log('[SPA] ✓ Link click interceptor registered');

        // Initial route
        console.log('[SPA] 🎯 Triggering initial route handler...');
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

        console.log('[SPA] Navigating to:', path);
        window.location.hash = path;
    }

    /**
     * Handle current route
     */
    async handleRoute() {
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

        // Double-check authentication (auth guard already handles this)
        if (!this.authReady) {
            console.log('[SPA] ⏳ Auth not ready yet, showing loading state...');
            console.log('[SPA] 💡 Tip: waitForAuth() may not have completed yet');
            console.log('[SPA] ═══════════════════════════════════════');
            this.showAuthWaitingState(mainContent);
            return;
        }

        console.log('[SPA] ✓ Auth ready check passed');

        // Verify user is authenticated via Firebase
        const currentUser = firebase.auth().currentUser;
        console.log('[SPA] 👤 Firebase currentUser:', currentUser ? currentUser.email : 'null');

        if (!currentUser) {
            console.log('[SPA] ⏳ No user found, showing loading state...');
            console.log('[SPA] 💡 Tip: Firebase auth.currentUser is null (may be transient)');
            console.log('[SPA] ═══════════════════════════════════════');
            this.showAuthWaitingState(mainContent);
            return;
        }

        console.log('[SPA] ✓ Current user check passed');

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
        }
    }

    /**
     * Render home page
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

        // Try PageAssetRenderer first (dynamic Firebase page loading)
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

        // Fallback to HomeView class
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
            console.log('[SPA] ℹ️  HomeView class not defined, using inline fallback');
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

    async renderMythology(mythologyId) {
        console.log('[SPA] ▶️  renderMythology() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div class="mythology-page"><h1>${mythologyId} Mythology</h1><p>Coming soon...</p></div>`;

            console.log('[SPA] ✅ Mythology page rendered');
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

    async renderCategory(mythology, category) {
        console.log('[SPA] ▶️  renderCategory() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div class="category-page"><h1>${category} - ${mythology}</h1><p>Coming soon...</p></div>`;

            console.log('[SPA] ✅ Category page rendered');
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

    async renderEntity(mythology, categoryType, entityId) {
        console.log('[SPA] ▶️  renderEntity() called');

        try {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div class="entity-page"><h1>${entityId}</h1><p>Coming soon...</p></div>`;

            console.log('[SPA] ✅ Entity page rendered');
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
