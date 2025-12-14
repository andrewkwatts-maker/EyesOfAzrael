/**
 * Dynamic Entity Loader
 * Fetches entity data from Firestore and renders using EntityDisplay component
 * Replaces static HTML pages with dynamic Firebase-powered pages
 *
 * Usage:
 *   EntityLoader.loadAndRenderGrid('deities', '#grid-container', {mythology: 'greek'});
 *   EntityLoader.loadAndRenderDetail('zeus', 'deity', '#detail-container');
 */

class EntityLoader {
    /**
     * Load and render grid of entities
     * @param {string} collection - Firestore collection name
     * @param {string} containerSelector - CSS selector for container
     * @param {Object} filters - Query filters (e.g., {mythology: 'greek'})
     * @param {Object} options - Additional options (limit, orderBy, etc.)
     */
    static async loadAndRenderGrid(collection, containerSelector, filters = {}, options = {}) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error(`Container not found: ${containerSelector}`);
            return;
        }

        // Show loading state
        container.innerHTML = this.renderLoadingGrid();

        try {
            // Build Firestore query
            let query = firebase.firestore().collection(collection);

            // Apply filters
            Object.entries(filters).forEach(([field, value]) => {
                if (Array.isArray(value)) {
                    query = query.where(field, 'in', value);
                } else if (field.includes('.')) {
                    // Nested field query
                    query = query.where(field, '==', value);
                } else {
                    // Check if it's an array contains query
                    if (field.endsWith('s') && collection !== field) {
                        // e.g., filtering mythologies array
                        query = query.where(field, 'array-contains', value);
                    } else {
                        query = query.where(field, '==', value);
                    }
                }
            });

            // Apply ordering
            if (options.orderBy) {
                const [field, direction = 'asc'] = options.orderBy.split(' ');
                query = query.orderBy(field, direction);
            } else {
                // Default ordering by name
                query = query.orderBy('name', 'asc');
            }

            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }

            // Execute query
            const snapshot = await query.get();

            if (snapshot.empty) {
                container.innerHTML = this.renderEmptyState(collection);
                return;
            }

            // Render entities
            container.innerHTML = '';
            container.className = 'entities-grid';

            snapshot.forEach(doc => {
                const entity = { id: doc.id, ...doc.data() };
                const card = EntityDisplay.renderCard(entity);
                container.appendChild(card);
            });

            // Add stats
            this.addGridStats(container, snapshot.size, collection);

        } catch (error) {
            console.error('Error loading entities:', error);
            container.innerHTML = this.renderErrorState(error.message);
        }
    }

    /**
     * Load and render single entity detail
     * @param {string} id - Entity ID
     * @param {string} type - Entity type (deity, hero, etc.)
     * @param {string} containerSelector - CSS selector for container
     */
    static async loadAndRenderDetail(id, type, containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error(`Container not found: ${containerSelector}`);
            return;
        }

        // Show loading state
        container.innerHTML = this.renderLoadingDetail();

        try {
            // Determine collection name
            const collection = this.getCollectionName(type);

            // Fetch entity
            const doc = await firebase.firestore()
                .collection(collection)
                .doc(id)
                .get();

            if (!doc.exists) {
                container.innerHTML = this.renderNotFound(id, type);
                return;
            }

            const entity = { id: doc.id, ...doc.data() };

            // Render entity detail
            EntityDisplay.renderDetail(entity, container);

            // Update page title
            document.title = `${entity.name || entity.title} - Eyes of Azrael`;

            // Track view (analytics)
            this.trackView(id, type);

        } catch (error) {
            console.error('Error loading entity:', error);
            container.innerHTML = this.renderErrorState(error.message);
        }
    }

    /**
     * Load and render based on URL parameters
     * Automatically detects entity from URL path
     */
    static async loadFromURL() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);

        // Check for explicit type/id params (e.g., /view.html?type=deity&id=zeus)
        if (params.has('type') && params.has('id')) {
            const type = params.get('type');
            const id = params.get('id');
            await this.loadAndRenderDetail(id, type, '#entity-container');
            return;
        }

        // Parse path (e.g., /greek/deities/zeus.html)
        const pathParts = path.split('/').filter(p => p);

        if (pathParts.length >= 3) {
            const mythology = pathParts[0];
            const type = pathParts[1].replace(/s$/, ''); // Remove trailing 's'
            const id = pathParts[2].replace('.html', '');

            await this.loadAndRenderDetail(id, type, '#entity-container');
        } else {
            console.error('Could not parse entity from URL:', path);
        }
    }

    /**
     * Search entities across all collections
     * @param {string} searchTerm - Search query
     * @param {Object} options - Search options
     */
    static async search(searchTerm, options = {}) {
        const collections = options.collections || [
            'deities', 'heroes', 'creatures', 'items',
            'places', 'concepts', 'magic', 'user_theories', 'mythologies'
        ];

        const results = [];

        for (const collection of collections) {
            try {
                // Search by name (Firestore doesn't have full-text search, so we use array-contains on searchTerms)
                const snapshot = await firebase.firestore()
                    .collection(collection)
                    .where('searchTerms', 'array-contains', searchTerm.toLowerCase())
                    .limit(10)
                    .get();

                snapshot.forEach(doc => {
                    results.push({
                        id: doc.id,
                        collection: collection,
                        ...doc.data()
                    });
                });
            } catch (error) {
                console.error(`Error searching ${collection}:`, error);
            }
        }

        return results;
    }

    /**
     * Get cross-referenced entities
     * @param {Object} entity - Entity with cross-references
     */
    static async loadCrossReferences(entity) {
        const references = {};

        if (!entity.crossReferences && !entity.relatedEntities) {
            return references;
        }

        const crossRefs = entity.crossReferences || entity.relatedEntities;

        for (const [type, ids] of Object.entries(crossRefs)) {
            if (!ids || ids.length === 0) continue;

            const collection = this.getCollectionName(type.replace(/s$/, ''));
            references[type] = [];

            for (const id of ids.slice(0, 5)) { // Limit to 5 per type
                try {
                    const doc = await firebase.firestore()
                        .collection(collection)
                        .doc(id)
                        .get();

                    if (doc.exists) {
                        references[type].push({ id: doc.id, ...doc.data() });
                    }
                } catch (error) {
                    console.error(`Error loading cross-reference ${id}:`, error);
                }
            }
        }

        return references;
    }

    /**
     * Get collection name from entity type
     */
    static getCollectionName(type) {
        const collectionMap = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'item': 'items',
            'place': 'places',
            'concept': 'concepts',
            'magic': 'magic',
            'theory': 'user_theories',
            'mythology': 'mythologies'
        };

        return collectionMap[type] || type + 's';
    }

    /**
     * Render loading state (grid)
     */
    static renderLoadingGrid() {
        const skeletons = Array(12).fill(0).map(() => `
            <div class="entity-card skeleton">
                <div class="skeleton-icon"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-subtitle"></div>
            </div>
        `).join('');

        return `<div class="entities-grid loading">${skeletons}</div>`;
    }

    /**
     * Render loading state (detail)
     */
    static renderLoadingDetail() {
        return `
            <div class="entity-detail-loading">
                <div class="skeleton-header"></div>
                <div class="skeleton-content"></div>
                <div class="skeleton-content"></div>
                <div class="skeleton-content"></div>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    static renderEmptyState(collection) {
        return `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h2>No ${collection} found</h2>
                <p>Try adjusting your filters or check back later.</p>
            </div>
        `;
    }

    /**
     * Render error state
     */
    static renderErrorState(errorMessage) {
        return `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h2>Oops! Something went wrong</h2>
                <p>${errorMessage}</p>
                <button onclick="location.reload()" class="btn-retry">Try Again</button>
            </div>
        `;
    }

    /**
     * Render not found state
     */
    static renderNotFound(id, type) {
        return `
            <div class="not-found-state">
                <div class="not-found-icon">❌</div>
                <h2>${type} "${id}" not found</h2>
                <p>This ${type} may have been removed or the link is incorrect.</p>
                <a href="/${type}s.html" class="btn-back">Browse All ${type}s</a>
            </div>
        `;
    }

    /**
     * Add grid statistics
     */
    static addGridStats(container, count, collection) {
        const stats = document.createElement('div');
        stats.className = 'grid-stats';
        stats.innerHTML = `
            <p>Showing <strong>${count}</strong> ${collection}</p>
        `;
        container.parentElement.insertBefore(stats, container);
    }

    /**
     * Track entity view (for analytics)
     */
    static trackView(id, type) {
        // TODO: Implement analytics tracking
        if (window.gtag) {
            gtag('event', 'view_entity', {
                entity_type: type,
                entity_id: id
            });
        }
    }

    /**
     * Initialize auto-loading based on page context
     */
    static init() {
        // Check if this is a detail page
        if (document.getElementById('entity-container')) {
            this.loadFromURL();
        }

        // Check if this is a grid page
        const gridContainer = document.querySelector('[data-entity-grid]');
        if (gridContainer) {
            const collection = gridContainer.dataset.entityGrid;
            const mythology = gridContainer.dataset.mythology;
            const filters = mythology ? { mythology } : {};

            this.loadAndRenderGrid(collection, `[data-entity-grid="${collection}"]`, filters);
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to initialize
    firebase.auth().onAuthStateChanged(() => {
        EntityLoader.init();
    });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityLoader;
}
