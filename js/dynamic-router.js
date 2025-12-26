/**
 * Dynamic Router - Hash-based SPA routing for Eyes of Azrael
 *
 * Handles all navigation without page reloads, managing:
 * - URL hash parsing and navigation
 * - View component loading
 * - Browser history (back/forward buttons)
 * - Breadcrumb generation
 * - Scroll position restoration
 *
 * Routes:
 * /#/                                      → Home (mythology browser)
 * /#/mythology/{id}                        → Mythology overview
 * /#/mythology/{id}/{type}                 → Entity type list
 * /#/mythology/{id}/{type}/{entity}        → Entity detail
 * /#/search                                → Search
 * /#/compare                               → Comparison tool
 */

class DynamicRouter {
    constructor(options = {}) {
        this.viewContainer = options.viewContainer || document.getElementById('main-content');
        this.breadcrumbContainer = options.breadcrumbContainer || document.getElementById('breadcrumb-nav');
        this.currentRoute = null;
        this.previousRoute = null;
        this.scrollPositions = {};
        this.cachedViews = new Map();
        this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes

        // Component registry
        this.components = {
            'home': null,  // Will be set by MythologyBrowser
            'mythology-overview': null,  // Will be set by MythologyOverview
            'entity-type-browser': null,  // Will be set by EntityTypeBrowser
            'entity-detail-viewer': null,  // Will be set by EntityDetailViewer
            'search': null,
            'compare': null
        };

        this.init();
    }

    /**
     * Initialize router and event listeners
     */
    init() {
        // Listen for hash changes (back/forward/direct navigation)
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Handle initial page load
        window.addEventListener('DOMContentLoaded', () => {
            this.handleInitialLoad();
        });

        // Intercept link clicks for SPA navigation
        document.addEventListener('click', (e) => this.handleLinkClick(e));

        console.log('[DynamicRouter] Initialized');
    }

    /**
     * Handle initial page load
     */
    handleInitialLoad() {
        // Check if coming from old static URL
        const staticPath = this.detectStaticPath();
        if (staticPath) {
            const hash = this.convertStaticToHash(staticPath);
            console.log(`[DynamicRouter] Redirecting static URL: ${staticPath} → ${hash}`);
            window.location.hash = hash;
            return;
        }

        // Parse current hash or default to home
        const hash = window.location.hash || '#/';
        this.navigate(hash, { replace: true });
    }

    /**
     * Detect if current URL is an old static path
     */
    detectStaticPath() {
        const path = window.location.pathname;

        // Check for mythos paths
        if (path.includes('/mythos/') && path !== '/') {
            return path;
        }

        // Check for specific static pages
        if (path.match(/\/(theories|herbalism|spiritual-items|spiritual-places)\//)) {
            return path;
        }

        return null;
    }

    /**
     * Convert static URL path to hash route
     * Examples:
     *   /mythos/greek/index.html → #/mythology/greek
     *   /mythos/greek/deities/index.html → #/mythology/greek/deities
     *   /mythos/greek/deities/zeus.html → #/mythology/greek/deity/zeus
     */
    convertStaticToHash(path) {
        // Remove leading slash and trailing index.html
        path = path.replace(/^\//, '').replace(/\/index\.html$/, '').replace(/\.html$/, '');

        // Split path
        const parts = path.split('/');

        // Handle mythos paths
        if (parts[0] === 'mythos' && parts.length >= 2) {
            const mythology = parts[1];

            // Just mythology: /mythos/greek → #/mythology/greek
            if (parts.length === 2) {
                return `#/mythology/${mythology}`;
            }

            // Entity type: /mythos/greek/deities → #/mythology/greek/deities
            if (parts.length === 3) {
                const entityType = parts[2];
                return `#/mythology/${mythology}/${entityType}`;
            }

            // Entity detail: /mythos/greek/deities/zeus → #/mythology/greek/deity/zeus
            if (parts.length === 4) {
                const entityType = this.pluralToSingular(parts[2]);
                const entityId = parts[3];
                return `#/mythology/${mythology}/${entityType}/${entityId}`;
            }
        }

        // Default to home
        return '#/';
    }

    /**
     * Convert plural entity type to singular
     */
    pluralToSingular(plural) {
        const map = {
            'deities': 'deity',
            'heroes': 'hero',
            'creatures': 'creature',
            'cosmology': 'cosmology',  // already singular
            'rituals': 'ritual',
            'herbs': 'herb',
            'texts': 'text',
            'symbols': 'symbol',
            'concepts': 'concept',
            'figures': 'figure',
            'beings': 'being',
            'items': 'item',
            'places': 'place',
            'magic': 'magic'
        };
        return map[plural] || plural;
    }

    /**
     * Handle hash change events
     */
    handleHashChange() {
        const hash = window.location.hash || '#/';
        this.navigate(hash, { fromHashChange: true });
    }

    /**
     * Handle link clicks for SPA navigation
     */
    handleLinkClick(e) {
        const link = e.target.closest('a[href^="#/"]');
        if (!link) return;

        e.preventDefault();
        const hash = link.getAttribute('href');
        this.navigate(hash);
    }

    /**
     * Navigate to a route
     * @param {string} hash - Hash route (e.g., "#/mythology/greek")
     * @param {object} options - Navigation options
     */
    async navigate(hash, options = {}) {
        // Save scroll position of current view
        if (this.currentRoute) {
            this.scrollPositions[this.currentRoute.hash] = window.scrollY;
        }

        // Parse route
        const route = this.parseRoute(hash);

        // Update history if not from hash change
        if (!options.fromHashChange) {
            if (options.replace) {
                window.history.replaceState(null, '', hash);
            } else {
                window.location.hash = hash;
                return; // Let hashchange event handle it
            }
        }

        // Store previous route
        this.previousRoute = this.currentRoute;
        this.currentRoute = route;

        console.log('[DynamicRouter] Navigating to:', route);

        // Update breadcrumbs
        this.updateBreadcrumbs(route);

        // Load and render view
        await this.renderView(route);

        // Restore or reset scroll position
        if (options.fromHashChange && this.scrollPositions[hash] !== undefined) {
            setTimeout(() => window.scrollTo(0, this.scrollPositions[hash]), 0);
        } else {
            window.scrollTo(0, 0);
        }
    }

    /**
     * Parse hash route into structured object
     * @param {string} hash - Hash route
     * @returns {object} Route object
     */
    parseRoute(hash) {
        // Remove # and leading/trailing slashes
        const path = hash.replace(/^#\/?/, '').replace(/\/$/, '');

        // Split path and query
        const [pathPart, queryPart] = path.split('?');
        const segments = pathPart ? pathPart.split('/') : [];

        // Parse query parameters
        const queryParams = {};
        if (queryPart) {
            queryPart.split('&').forEach(param => {
                const [key, value] = param.split('=');
                queryParams[decodeURIComponent(key)] = decodeURIComponent(value || '');
            });
        }

        // Determine route type and extract parameters
        if (segments.length === 0) {
            // Home
            return {
                hash,
                type: 'home',
                queryParams
            };
        }

        if (segments[0] === 'mythology') {
            if (segments.length === 2) {
                // Mythology overview: #/mythology/greek
                return {
                    hash,
                    type: 'mythology-overview',
                    mythology: segments[1],
                    queryParams
                };
            }

            if (segments.length === 3) {
                // Entity type list: #/mythology/greek/deities
                return {
                    hash,
                    type: 'entity-type-browser',
                    mythology: segments[1],
                    entityType: this.pluralToSingular(segments[2]),
                    entityTypePlural: segments[2],
                    queryParams
                };
            }

            if (segments.length === 4) {
                // Entity detail: #/mythology/greek/deity/zeus
                return {
                    hash,
                    type: 'entity-detail-viewer',
                    mythology: segments[1],
                    entityType: segments[2],
                    entityId: segments[3],
                    queryParams
                };
            }
        }

        if (segments[0] === 'search') {
            return {
                hash,
                type: 'search',
                queryParams
            };
        }

        if (segments[0] === 'compare') {
            return {
                hash,
                type: 'compare',
                queryParams
            };
        }

        // Unknown route, default to home
        console.warn('[DynamicRouter] Unknown route:', hash);
        return {
            hash: '#/',
            type: 'home',
            queryParams: {}
        };
    }

    /**
     * Render the view for a route
     * @param {object} route - Parsed route object
     */
    async renderView(route) {
        if (!this.viewContainer) {
            console.error('[DynamicRouter] No view container found');
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            // Get component for route type
            const component = this.components[route.type];

            if (!component) {
                throw new Error(`No component registered for route type: ${route.type}`);
            }

            // Check cache
            const cacheKey = this.getCacheKey(route);
            const cached = this.cachedViews.get(cacheKey);

            if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
                console.log('[DynamicRouter] Using cached view:', cacheKey);
                this.displayView(cached.html);
                return;
            }

            // Render component
            const html = await component.render(route);

            // Cache result
            this.cachedViews.set(cacheKey, {
                html,
                timestamp: Date.now()
            });

            // Display
            this.displayView(html);

        } catch (error) {
            console.error('[DynamicRouter] Error rendering view:', error);
            this.showError(error);
        }
    }

    /**
     * Generate cache key for route
     */
    getCacheKey(route) {
        const parts = [route.type];
        if (route.mythology) parts.push(route.mythology);
        if (route.entityType) parts.push(route.entityType);
        if (route.entityId) parts.push(route.entityId);

        // Include relevant query params
        const queryStr = Object.keys(route.queryParams)
            .sort()
            .map(k => `${k}=${route.queryParams[k]}`)
            .join('&');
        if (queryStr) parts.push(queryStr);

        return parts.join(':');
    }

    /**
     * Display rendered HTML in view container
     */
    displayView(html) {
        this.viewContainer.classList.add('view-transition-out');

        setTimeout(() => {
            this.viewContainer.innerHTML = html;
            this.viewContainer.classList.remove('view-transition-out', 'view-loading', 'view-error');
            this.viewContainer.classList.add('view-transition-in');

            setTimeout(() => {
                this.viewContainer.classList.remove('view-transition-in');
            }, 300);
        }, 150);
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.viewContainer.classList.add('view-loading');
        this.viewContainer.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showError(error) {
        this.viewContainer.classList.add('view-error');
        this.viewContainer.innerHTML = `
            <div class="error-container">
                <h2>⚠️ Error Loading Content</h2>
                <p>${error.message || 'An unknown error occurred'}</p>
                <button onclick="window.location.reload()">Reload Page</button>
                <button onclick="window.location.hash = '#/'">Go Home</button>
            </div>
        `;
    }

    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumbs(route) {
        if (!this.breadcrumbContainer) return;

        const breadcrumbs = this.generateBreadcrumbs(route);

        const html = breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            if (isLast) {
                return `<span class="breadcrumb-current">${crumb.label}</span>`;
            } else {
                return `<a href="${crumb.hash}" class="breadcrumb-link">${crumb.label}</a>`;
            }
        }).join(' <span class="breadcrumb-separator">›</span> ');

        this.breadcrumbContainer.innerHTML = html;
    }

    /**
     * Generate breadcrumb trail for route
     */
    generateBreadcrumbs(route) {
        const crumbs = [{
            label: 'Home',
            hash: '#/'
        }];

        if (route.type === 'home') {
            return crumbs;
        }

        if (route.mythology) {
            crumbs.push({
                label: this.capitalize(route.mythology) + ' Mythology',
                hash: `#/mythology/${route.mythology}`
            });
        }

        if (route.entityTypePlural) {
            crumbs.push({
                label: this.capitalize(route.entityTypePlural),
                hash: `#/mythology/${route.mythology}/${route.entityTypePlural}`
            });
        }

        if (route.entityId) {
            crumbs.push({
                label: this.capitalize(route.entityId),
                hash: route.hash
            });
        }

        if (route.type === 'search') {
            crumbs.push({
                label: 'Search',
                hash: '#/search'
            });
        }

        if (route.type === 'compare') {
            crumbs.push({
                label: 'Compare',
                hash: '#/compare'
            });
        }

        return crumbs;
    }

    /**
     * Register a component for a route type
     */
    registerComponent(type, component) {
        this.components[type] = component;
        console.log(`[DynamicRouter] Registered component: ${type}`);
    }

    /**
     * Clear view cache
     */
    clearCache() {
        this.cachedViews.clear();
        console.log('[DynamicRouter] Cache cleared');
    }

    /**
     * Invalidate specific cache entry
     */
    invalidateCache(routeOrKey) {
        if (typeof routeOrKey === 'string') {
            this.cachedViews.delete(routeOrKey);
        } else {
            const key = this.getCacheKey(routeOrKey);
            this.cachedViews.delete(key);
        }
    }

    /**
     * Navigate programmatically
     */
    navigateTo(hash) {
        this.navigate(hash);
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    }

    /**
     * Helper: Capitalize string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Export for global use
window.DynamicRouter = DynamicRouter;
