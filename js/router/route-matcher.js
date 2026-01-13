/**
 * Route Matcher Module
 * Pattern matching and route parsing utilities
 *
 * Usage:
 *   const match = RouteMatcher.match(path, routes);
 *   const collection = RouteMatcher.getCollectionName('deity'); // 'deities'
 */

const RouteMatcher = {
    /**
     * Route patterns for the SPA
     * Order matters - more specific patterns should come first
     */
    patterns: {
        home: /^#?\/?$/,
        mythologies: /^#?\/mythologies\/?$/,
        browse_category: /^#?\/browse\/([^\/]+)\/?$/,
        browse_filtered: /^#?\/browse\/([^\/]+)\/([^\/]+)\/?$/,
        mythology: /^#?\/mythology\/([^\/]+)\/?$/,
        entity_simple: /^#?\/entity\/([^\/]+)\/([^\/]+)\/?$/,
        entity_alt: /^#?\/entity\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
        entity: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
        category: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/?$/,
        search: /^#?\/search\/?$/,
        corpus_explorer: /^#?\/corpus-explorer\/?$/,
        compare: /^#?\/compare\/?$/,
        dashboard: /^#?\/dashboard\/?$/,
        profile: /^#?\/profile\/?$/,
        user_profile: /^#?\/user\/([^\/]+)\/?$/,
        about: /^#?\/about\/?$/,
        privacy: /^#?\/privacy\/?$/,
        terms: /^#?\/terms\/?$/
    },

    /**
     * Display names for routes (used for accessibility)
     */
    displayNames: {
        home: 'Home',
        mythologies: 'World Mythologies',
        browse_category: 'Browse Category',
        browse_filtered: 'Browse Category',
        mythology: 'Mythology',
        entity: 'Entity Details',
        entity_alt: 'Entity Details',
        entity_simple: 'Entity Details',
        category: 'Category',
        search: 'Search',
        corpus_explorer: 'Corpus Explorer',
        compare: 'Compare',
        dashboard: 'Dashboard',
        profile: 'Profile',
        user_profile: 'User Profile',
        about: 'About',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service'
    },

    /**
     * Singular to plural collection name mapping
     */
    _collectionMap: {
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
    },

    /**
     * Match a path against route patterns
     * @param {string} path - The path to match
     * @returns {Object|null} Match result with route name, pattern, and captured groups
     */
    match(path) {
        const normalizedPath = this.normalizePath(path);

        for (const [routeName, pattern] of Object.entries(this.patterns)) {
            const match = normalizedPath.match(pattern);
            if (match) {
                return {
                    route: routeName,
                    pattern: pattern,
                    params: match.slice(1), // Captured groups
                    displayName: this.displayNames[routeName] || routeName,
                    path: normalizedPath
                };
            }
        }

        return null;
    },

    /**
     * Normalize path format
     * @param {string} path - The path to normalize
     * @returns {string} Normalized path
     */
    normalizePath(path) {
        if (!path) return '#/';

        // Remove leading/trailing whitespace
        path = path.trim();

        // Ensure starts with #
        if (!path.startsWith('#')) {
            path = '#' + path;
        }

        // Ensure has slash after #
        if (path === '#' || path === '') {
            path = '#/';
        } else if (!path.startsWith('#/')) {
            path = '#/' + path.substring(1);
        }

        return path;
    },

    /**
     * Convert entity type to collection name (singular to plural)
     * @param {string} type - Entity type (e.g., 'deity', 'hero', 'deities')
     * @returns {string} Collection name (e.g., 'deities', 'heroes')
     */
    getCollectionName(type) {
        if (!type) return type;

        // Normalize to lowercase for case-insensitive matching
        const normalizedType = type.toLowerCase();

        // If already plural (in the map values), return as-is
        if (Object.values(this._collectionMap).includes(normalizedType)) {
            return normalizedType;
        }

        return this._collectionMap[normalizedType] || normalizedType;
    },

    /**
     * Get singular form of collection name
     * @param {string} collection - Collection name
     * @returns {string} Singular form
     */
    getSingularName(collection) {
        if (!collection) return collection;

        const normalized = collection.toLowerCase();

        for (const [singular, plural] of Object.entries(this._collectionMap)) {
            if (plural === normalized) {
                return singular;
            }
        }

        return normalized;
    },

    /**
     * Check if route requires authentication
     * @param {string} routeName - Name of the route
     * @returns {boolean}
     */
    isProtectedRoute(routeName) {
        const protectedRoutes = ['dashboard', 'compare', 'profile'];
        return protectedRoutes.includes(routeName);
    },

    /**
     * Parse route for breadcrumb generation
     * @param {string} path - The path to parse
     * @returns {Array} Breadcrumb items
     */
    parseBreadcrumbs(path) {
        const match = this.match(path);
        if (!match) return [{ label: 'Home', href: '#/' }];

        const breadcrumbs = [{ label: 'Home', href: '#/' }];

        switch (match.route) {
            case 'mythologies':
                breadcrumbs.push({ label: 'Mythologies', href: '#/mythologies' });
                break;

            case 'mythology':
                breadcrumbs.push({ label: 'Mythologies', href: '#/mythologies' });
                breadcrumbs.push({ label: this.capitalize(match.params[0]), href: path });
                break;

            case 'browse_category':
                breadcrumbs.push({ label: this.capitalize(match.params[0]), href: path });
                break;

            case 'browse_filtered':
                breadcrumbs.push({ label: this.capitalize(match.params[0]), href: `#/browse/${match.params[0]}` });
                breadcrumbs.push({ label: this.capitalize(match.params[1]), href: path });
                break;

            case 'entity':
            case 'entity_alt':
            case 'entity_simple':
                breadcrumbs.push({ label: 'Entity', href: path });
                break;

            case 'search':
                breadcrumbs.push({ label: 'Search', href: '#/search' });
                break;

            default:
                if (match.displayName !== 'Home') {
                    breadcrumbs.push({ label: match.displayName, href: path });
                }
        }

        return breadcrumbs;
    },

    /**
     * Capitalize first letter
     * @param {string} str - String to capitalize
     * @returns {string}
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RouteMatcher;
}

// Export to window for browser usage
window.RouteMatcher = RouteMatcher;
