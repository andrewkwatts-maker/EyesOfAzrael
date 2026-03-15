/**
 * Crawl Validator Configuration
 * Eyes of Azrael - Comprehensive website crawler/validator config
 */

module.exports = {
    // Known categories (must match SPA routes)
    categories: [
        'deities', 'heroes', 'creatures', 'items', 'places',
        'texts', 'rituals', 'herbs', 'symbols', 'archetypes',
        'cosmology', 'magic'
    ],

    // Known mythologies
    mythologies: [
        'greek', 'norse', 'egyptian', 'hindu', 'chinese', 'japanese',
        'celtic', 'babylonian', 'sumerian', 'persian', 'roman',
        'aztec', 'mayan', 'buddhist', 'christian', 'jewish',
        'islamic', 'yoruba', 'native_american', 'apocryphal', 'tarot'
    ],

    // Static pages
    staticPages: [
        '#/', '#/mythologies', '#/search', '#/about', '#/privacy', '#/terms'
    ],

    // Protected routes (skip without auth)
    protectedRoutes: ['#/dashboard', '#/compare', '#/user/'],

    // CSS selectors for content extraction
    selectors: {
        mainContent: '#main-content',
        entityName: '.entity-name, .entity-title, h1.entity-heading, .detail-header h1',
        entityDescription: '.entity-description, .description, .entity-overview',
        entityType: '.entity-type, .type-badge, .content-type-badge',
        mythologyBadge: '.mythology-badge, .mythology-label, .mythology-tag',
        loadingSpinner: '.loading-spinner, .skeleton-loading, .loading-indicator',
        errorMessage: '.error-message, .error-state, .not-found'
    },

    // Timeouts (ms)
    timeouts: {
        pageLoad: 15000,
        contentRender: 10000,
        networkIdle: 5000
    },

    // Crawl limits
    defaults: {
        maxDepth: 5,
        maxPages: 2000,
        parallel: 3
    },

    // Performance thresholds
    performance: {
        slowWarningMs: 5000,
        slowErrorMs: 15000
    },

    // Entity page URL patterns (regex)
    entityPatterns: [
        // #/mythology/:myth/:type/:id
        /^#\/mythology\/([^/]+)\/([^/]+)\/([^/]+)$/,
        // #/entity/:collection/:type/:id
        /^#\/entity\/([^/]+)\/([^/]+)\/([^/]+)$/,
        // #/entity/:collection/:id
        /^#\/entity\/([^/]+)\/([^/]+)$/
    ],

    // Content issues to detect
    contentIssues: {
        // Text patterns that indicate rendering problems
        badTextPatterns: [
            /\bundefined\b/i,
            /\bnull\b/,
            /\[object Object\]/,
            /NaN/,
            /^\s*$/
        ],
        // Minimum content length to consider a page non-empty
        minContentLength: 50
    }
};
