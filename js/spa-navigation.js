/**
 * Single Page Application Navigation System
 * Handles dynamic routing and content loading from Firebase
 */

class SPANavigation {
    constructor(firestore, authManager, renderer) {
        this.db = firestore;
        this.auth = authManager;
        this.renderer = renderer;
        this.currentRoute = null;
        this.routeHistory = [];
        this.maxHistory = 50;

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

        this.initRouter();
    }

    /**
     * Initialize router and event listeners
     */
    initRouter() {
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
     * Handle current route
     */
    async handleRoute() {
        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');

        console.log('Routing to:', path);

        // Note: Authentication is optional - users can browse without logging in
        // Login is only required for dashboard/creating content

        // Check if trying to access dashboard without login
        if (this.routes.dashboard.test(path)) {
            if (!this.auth || !this.auth.isAuthenticated()) {
                window.location.href = '/login.html';
                return;
            }
        }

        // Add to history
        this.addToHistory(path);

        // Show loading
        this.showLoading();

        try {
            // Match route
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
            } else {
                await this.render404();
            }

            // Update breadcrumb
            this.updateBreadcrumb(path);

            // Store current route
            this.currentRoute = path;

        } catch (error) {
            console.error('Routing error:', error);
            this.renderError(error);
        }
    }

    /**
     * Render home page
     */
    async renderHome() {
        const mainContent = document.getElementById('main-content');

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

        // Load counts for each mythology
        this.loadMythologyCounts(mythologies);

        // Load featured entities
        this.loadFeaturedEntities();

        // Search button
        document.getElementById('search-btn').addEventListener('click', () => {
            const query = document.getElementById('quick-search').value;
            if (query) {
                this.navigate(`/search?q=${encodeURIComponent(query)}`);
            }
        });

        // Enter key on search
        document.getElementById('quick-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('search-btn').click();
            }
        });
    }

    /**
     * Load entity counts for each mythology
     */
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

    /**
     * Load featured entities (high importance)
     */
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
     * Render mythology overview page
     */
    async renderMythology(mythologyId) {
        const mainContent = document.getElementById('main-content');

        mainContent.innerHTML = `
            <div class="mythology-page">
                <div class="mythology-header">
                    <h1 id="mythology-title">Loading...</h1>
                    <p id="mythology-description"></p>
                </div>

                <div class="category-tabs">
                    <button class="category-tab active" data-category="deities">Deities</button>
                    <button class="category-tab" data-category="heroes">Heroes</button>
                    <button class="category-tab" data-category="creatures">Creatures</button>
                    <button class="category-tab" data-category="cosmology">Cosmology</button>
                    <button class="category-tab" data-category="texts">Texts</button>
                    <button class="category-tab" data-category="rituals">Rituals</button>
                </div>

                <div id="category-content" class="category-content">
                    Loading...
                </div>
            </div>
        `;

        // Set title
        document.getElementById('mythology-title').textContent =
            mythologyId.charAt(0).toUpperCase() + mythologyId.slice(1) + ' Mythology';

        // Load first category (deities)
        await this.loadCategory(mythologyId, 'deities');

        // Tab switching
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', async (e) => {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                const category = e.target.dataset.category;
                await this.loadCategory(mythologyId, category);
            });
        });
    }

    /**
     * Load category content
     */
    async loadCategory(mythology, category) {
        const container = document.getElementById('category-content');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading...</div>';

        try {
            const snapshot = await this.db.collection(category)
                .where('mythology', '==', mythology)
                .orderBy('importance', 'desc')
                .limit(50)
                .get();

            const entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (entities.length > 0) {
                container.innerHTML = this.renderer.render(entities, 'grid');
            } else {
                container.innerHTML = `<p class="no-results">No ${category} found for this mythology</p>`;
            }
        } catch (error) {
            console.error(`Error loading ${category}:`, error);
            container.innerHTML = `<p class="error">Error loading ${category}</p>`;
        }
    }

    /**
     * Render category page
     */
    async renderCategory(mythology, category) {
        await this.renderMythology(mythology);
        // Activate the correct tab
        setTimeout(() => {
            const tab = document.querySelector(`[data-category="${category}"]`);
            if (tab) tab.click();
        }, 100);
    }

    /**
     * Render individual entity page
     */
    async renderEntity(mythology, categoryType, entityId) {
        const mainContent = document.getElementById('main-content');

        try {
            // Determine collection
            const collections = ['deities', 'heroes', 'creatures', 'cosmology', 'texts', 'rituals', 'places', 'items', 'herbs', 'symbols'];
            let entityData = null;
            let collection = null;

            // Search across collections
            for (const coll of collections) {
                try {
                    const doc = await this.db.collection(coll).doc(entityId).get();
                    if (doc.exists) {
                        entityData = doc.data();
                        collection = coll;
                        break;
                    }
                } catch (error) {
                    // Try next collection
                    continue;
                }
            }

            if (!entityData) {
                throw new Error('Entity not found');
            }

            // Render entity using panel display
            mainContent.innerHTML = this.renderer.render([{id: entityId, ...entityData}], 'panel');

        } catch (error) {
            console.error('Error loading entity:', error);
            this.renderError(error);
        }
    }

    /**
     * Render search page
     */
    async renderSearch() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div id="search-container"></div>';

        // Search UI will initialize here (from search-ui.js)
    }

    /**
     * Render compare page
     */
    async renderCompare() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="compare-page">
                <h1>Compare Entities</h1>
                <p>Cross-cultural comparison tool coming soon...</p>
            </div>
        `;
    }

    /**
     * Render dashboard
     */
    async renderDashboard() {
        const mainContent = document.getElementById('main-content');

        // Check if UserDashboard component exists
        if (typeof UserDashboard !== 'undefined' && window.EyesOfAzrael.crudManager) {
            const dashboard = new UserDashboard(
                window.EyesOfAzrael.crudManager,
                window.EyesOfAzrael.firebaseAuth
            );
            mainContent.innerHTML = '<div id="dashboard-container"></div>';
            dashboard.mount('dashboard-container');
        } else {
            mainContent.innerHTML = `
                <div class="dashboard-placeholder">
                    <h1>My Contributions</h1>
                    <p>Dashboard functionality loading...</p>
                </div>
            `;
        }
    }

    /**
     * Render 404 page
     */
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

    /**
     * Render error page
     */
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
     * Show loading state
     */
    showLoading() {
        const mainContent = document.getElementById('main-content');
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

    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb(path) {
        const breadcrumb = document.getElementById('breadcrumb-nav');
        if (!breadcrumb) return;

        const parts = path.split('/').filter(p => p);
        let html = '<nav aria-label="Breadcrumb"><ol class="breadcrumb">';
        html += '<li><a href="#/">Home</a></li>';

        let currentPath = '';
        parts.forEach((part, index) => {
            currentPath += '/' + part;
            const isLast = index === parts.length - 1;
            const label = decodeURIComponent(part).replace(/-/g, ' ');

            if (isLast) {
                html += `<li aria-current="page">${label}</li>`;
            } else {
                html += `<li><a href="#${currentPath}">${label}</a></li>`;
            }
        });

        html += '</ol></nav>';
        breadcrumb.innerHTML = html;
    }

    /**
     * Add path to history
     */
    addToHistory(path) {
        this.routeHistory.push({
            path,
            timestamp: Date.now()
        });

        // Trim history
        if (this.routeHistory.length > this.maxHistory) {
            this.routeHistory = this.routeHistory.slice(-this.maxHistory);
        }
    }

    /**
     * Get navigation history
     */
    getHistory() {
        return this.routeHistory;
    }

    /**
     * Go back
     */
    goBack() {
        window.history.back();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPANavigation;
}
