/**
 * Single Page Application Navigation System
 * Handles dynamic routing and content loading from Firebase
 * REQUIRES AUTHENTICATION FOR ALL PAGES
 */

class SPANavigation {
    constructor(firestore, authManager, renderer) {
        this.db = firestore;
        this.auth = authManager;
        this.renderer = renderer;
        this.currentRoute = null;
        this.routeHistory = [];
        this.maxHistory = 50;
        this.authReady = false;

        console.log('[SPA] Initializing navigation...');

        // Route patterns
        this.routes = {
            home: /^#?\/?$/,
            mythology: /^#?\/mythology\/([^\/]+)\/?$/,
            entity: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
            category: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/?$/,
            search: /^#?\/search\/?$/,
            compare: /^#?\/compare\/?$/,
            dashboard: /^#?\/dashboard\/?$/
        };

        // Wait for auth to be ready before initializing router
        this.waitForAuth().then(() => {
            this.authReady = true;
            this.initRouter();
        });
    }

    /**
     * Wait for Firebase Auth to be ready
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            console.log('[SPA] Waiting for auth to be ready...');

            // Use Firebase auth directly (compatible with auth guard)
            const auth = firebase.auth();
            if (!auth) {
                console.error('[SPA] Firebase auth not available!');
                resolve(null);
                return;
            }

            // Firebase auth ready check - just resolve, auth guard handles UI
            const unsubscribe = auth.onAuthStateChanged((user) => {
                console.log('[SPA] Auth state ready:', user ? 'Logged in' : 'Logged out');
                unsubscribe();
                resolve(user);
            });
        });
    }

    /**
     * Initialize router and event listeners
     */
    initRouter() {
        console.log('[SPA] Setting up router...');

        // Handle hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('popstate', () => this.handleRoute());

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
        console.log('[SPA] Router initialized, handling initial route');
        this.handleRoute();
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
        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');

        console.log('[SPA] Handling route:', path);

        // Double-check authentication (auth guard already handles this)
        if (!this.authReady) {
            console.log('[SPA] Auth not ready yet, waiting...');
            return;
        }

        // Verify user is authenticated via Firebase
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.log('[SPA] No current user - auth guard will show login overlay');
            return;
        }

        // Add to history
        this.addToHistory(path);

        // Show loading
        this.showLoading();

        try {
            // Match route
            if (this.routes.home.test(path)) {
                console.log('[SPA] Rendering home');
                await this.renderHome();
            } else if (this.routes.entity.test(path)) {
                const match = path.match(this.routes.entity);
                console.log('[SPA] Rendering entity:', match[3]);
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
            } else {
                await this.render404();
            }

            // Update breadcrumb
            this.updateBreadcrumb(path);

            // Store current route
            this.currentRoute = path;

            console.log('[SPA] ✅ Route rendered successfully');

        } catch (error) {
            console.error('[SPA] ❌ Routing error:', error);
            this.renderError(error);
        }
    }

    /**
     * Render home page
     */
    async renderHome() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('[SPA] main-content element not found!');
            return;
        }

        // Try PageAssetRenderer first (dynamic Firebase page loading)
        if (typeof PageAssetRenderer !== 'undefined') {
            console.log('[SPA] Trying PageAssetRenderer for home page...');
            try {
                const renderer = new PageAssetRenderer(this.db);
                const pageData = await renderer.loadPage('home');

                if (pageData) {
                    await renderer.renderPage('home', mainContent);
                    console.log('[SPA] Home page rendered via PageAssetRenderer');
                    return;
                } else {
                    console.log('[SPA] Home page not found in Firebase, falling back to HomeView');
                }
            } catch (error) {
                console.warn('[SPA] PageAssetRenderer failed, falling back to HomeView:', error);
            }
        }

        // Fallback to HomeView class
        if (typeof HomeView !== 'undefined') {
            console.log('[SPA] Using HomeView class');
            const homeView = new HomeView(this.db);
            await homeView.render(mainContent);
            console.log('[SPA] Home page rendered via HomeView');
            return;
        }

        // Fallback to inline rendering if HomeView not available
        console.warn('[SPA] HomeView not found, using fallback rendering');

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

        console.log('[SPA] Home page rendered');
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
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="mythology-page"><h1>${mythologyId} Mythology</h1><p>Coming soon...</p></div>`;
    }

    async renderCategory(mythology, category) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="category-page"><h1>${category} - ${mythology}</h1><p>Coming soon...</p></div>`;
    }

    async renderEntity(mythology, categoryType, entityId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="entity-page"><h1>${entityId}</h1><p>Coming soon...</p></div>`;
    }

    async renderSearch() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div id="search-container"></div>';
    }

    async renderCompare() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="compare-page"><h1>Compare Entities</h1><p>Coming soon...</p></div>`;
    }

    async renderDashboard() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="dashboard-page"><h1>My Contributions</h1><p>Coming soon...</p></div>`;
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
