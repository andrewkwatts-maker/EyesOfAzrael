/**
 * Dynamic Entity Loader
 * Fetches entity data from Firestore and renders using EntityDisplay component
 * Replaces static HTML pages with dynamic Firebase-powered pages
 *
 * Usage:
 *   EntityLoader.loadAndRenderGrid('deities', '#grid-container', {mythology: 'greek'});
 *   EntityLoader.loadAndRenderDetail('zeus', 'deity', '#detail-container');
 */

import { ENTITY_COLLECTIONS, getCollectionName } from './constants/entity-types.js';

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
            // Merge with header filters if available
            const mergedFilters = this.mergeWithHeaderFilters(filters);

            // Build Firestore query
            let query = firebase.firestore().collection(collection);

            // Apply filters
            Object.entries(mergedFilters).forEach(([field, value]) => {
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

            // Apply client-side filters (for filters that can't be done in Firestore)
            let entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            entities = this.applyClientSideFilters(entities);

            if (entities.length === 0) {
                container.innerHTML = this.renderEmptyState(collection);
                return;
            }

            // Render entities
            container.innerHTML = '';
            container.className = 'entities-grid';

            entities.forEach(entity => {
                const card = EntityDisplay.renderCard(entity);
                container.appendChild(card);
            });

            // Add stats with filter info
            this.addGridStatsWithFilters(container, entities.length, snapshot.size, collection);

        } catch (error) {
            console.error('Error loading entities:', error);
            container.innerHTML = this.renderErrorState(error.message);
        }
    }

    /**
     * Merge filters with header filters
     * @param {Object} filters - Original filters
     * @returns {Object} Merged filters
     */
    static mergeWithHeaderFilters(filters) {
        if (!window.headerFilters) {
            return filters;
        }

        const headerFilters = window.headerFilters.getActiveFilters();
        const merged = { ...filters };

        // Apply mythology filters
        if (headerFilters.mythologies.length > 0 && !filters.mythology) {
            // For single mythology filter, use direct match
            if (headerFilters.mythologies.length === 1) {
                merged.mythology = headerFilters.mythologies[0];
            } else {
                // For multiple mythologies, use 'in' query
                merged.mythology = headerFilters.mythologies;
            }
        }

        // Entity type filters are applied client-side (see applyClientSideFilters)
        // Content source filters are applied client-side (see applyClientSideFilters)
        // Topic filters are applied client-side (see applyClientSideFilters)

        return merged;
    }

    /**
     * Apply client-side filters (for complex filtering that can't be done in Firestore)
     * @param {Array} entities - Array of entities
     * @returns {Array} Filtered entities
     */
    static applyClientSideFilters(entities) {
        let filtered = [...entities];

        // Apply header filters if available
        if (window.headerFilters) {
            const filters = window.headerFilters.getActiveFilters();

            // Apply content source filter
            if (filters.contentSource !== 'both') {
                filtered = filtered.filter(entity => {
                    const isOfficial = entity.source === 'official' || !entity.source;
                    const isCommunity = entity.source === 'community' || entity.userSubmitted;

                    if (filters.contentSource === 'official') {
                        return isOfficial;
                    } else if (filters.contentSource === 'community') {
                        return isCommunity;
                    }

                    return true;
                });
            }

            // Apply entity type filter
            if (filters.entityTypes.length > 0) {
                filtered = filtered.filter(entity =>
                    filters.entityTypes.includes(entity.type)
                );
            }

            // Apply topic/tag filter
            if (filters.topics.length > 0) {
                filtered = filtered.filter(entity => {
                    const entityTags = entity.tags || entity.topics || [];
                    return filters.topics.some(topic =>
                        entityTags.includes(topic)
                    );
                });
            }
        }

        // Apply user preferences filters if available
        if (window.userPreferences && window.userPreferences.userId) {
            filtered = window.userPreferences.applyFilters(filtered);
        }

        return filtered;
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

            // Track view (analytics) - pass full entity object
            this.trackView(entity);

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
        return getCollectionName(type);
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
     * Add grid statistics with filter information
     */
    static addGridStatsWithFilters(container, filteredCount, totalCount, collection) {
        const stats = document.createElement('div');
        stats.className = 'grid-stats filter-results-count';

        const hasActiveFilters = window.headerFilters && window.headerFilters.getActiveFilterCount() > 0;

        if (hasActiveFilters && filteredCount !== totalCount) {
            stats.innerHTML = `
                <span>Showing <strong>${filteredCount}</strong> of <span class="results-total">${totalCount}</span> ${collection}</span>
            `;
        } else {
            stats.innerHTML = `
                <span>Showing <strong>${filteredCount}</strong> ${collection}</span>
            `;
        }

        container.parentElement.insertBefore(stats, container);
    }

    /**
     * Track entity view (for analytics)
     */
    static trackView(entity) {
        // Use AnalyticsManager if available
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackEntityView(entity);
        } else if (window.gtag) {
            // Fallback to direct gtag
            gtag('event', 'view_entity', {
                entity_type: entity.type,
                entity_id: entity.id,
                entity_name: entity.name || entity.title,
                mythology: entity.mythology
            });
        }
    }

    /**
     * Initialize auto-loading based on page context
     */
    static async init() {
        // Load user preferences if user is logged in
        const user = firebase.auth().currentUser;
        if (user && window.userPreferences && !window.userPreferences.userId) {
            try {
                await window.userPreferences.loadPreferences(user.uid);
                console.log('[EntityLoader] User preferences loaded');
            } catch (error) {
                console.error('[EntityLoader] Error loading user preferences:', error);
            }
        }

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

            // Register for filter change events
            if (window.headerFilters) {
                window.headerFilters.onFilterChange(() => {
                    console.log('[EntityLoader] Reloading due to filter change');
                    this.loadAndRenderGrid(collection, `[data-entity-grid="${collection}"]`, filters);
                });
            }

            // Register for preference change events
            window.addEventListener('preferencesApplied', () => {
                console.log('[EntityLoader] Reloading due to preference change');
                this.loadAndRenderGrid(collection, `[data-entity-grid="${collection}"]`, filters);
            });
        }
    }

    /**
     * Reload current grid with updated filters
     */
    static reloadCurrentGrid() {
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
