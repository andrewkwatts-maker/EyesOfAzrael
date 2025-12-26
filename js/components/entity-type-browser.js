/**
 * Entity Type Browser Component
 * Displays list/grid of entities of a specific type
 *
 * Features:
 * - Loads entities from Firebase filtered by mythology and type
 * - Multiple display modes (grid, list, table)
 * - Filtering and sorting
 * - Pagination
 * - Add Entity card for authenticated users
 */

class EntityTypeBrowser {
    constructor(options = {}) {
        this.db = options.db || (window.firebase && window.firebase.firestore());
        this.router = options.router;
        this.displayMode = 'grid';
        this.sortField = 'name';
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.pageSize = 50;
    }

    /**
     * Render the entity type browser
     * @param {object} route - Route object from router
     * @returns {string} HTML string
     */
    async render(route) {
        try {
            const { mythology, entityType, entityTypePlural, queryParams } = route;

            // Parse query params
            this.displayMode = queryParams.view || 'grid';
            this.sortField = queryParams.sort || 'name';
            this.sortDirection = queryParams.dir || 'asc';
            this.currentPage = parseInt(queryParams.page) || 1;

            // Load entities
            const entities = await this.loadEntities(mythology, entityType);

            if (!entities || entities.length === 0) {
                return this.renderEmpty(mythology, entityType, entityTypePlural);
            }

            // Generate HTML
            return this.generateHTML(mythology, entityType, entityTypePlural, entities);

        } catch (error) {
            console.error('[EntityTypeBrowser] Render error:', error);
            throw error;
        }
    }

    /**
     * Load entities from Firebase
     */
    async loadEntities(mythology, entityType) {
        if (!this.db) {
            throw new Error('Firebase Firestore not initialized');
        }

        // Determine collection name
        const collection = this.getCollectionName(entityType);

        // Query entities
        let query = this.db.collection(collection)
            .where('mythology', '==', mythology);

        // Add ordering
        query = query.orderBy(this.sortField, this.sortDirection);

        const snapshot = await query.get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    /**
     * Get collection name from entity type
     */
    getCollectionName(entityType) {
        const typeMap = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'cosmology': 'cosmology',
            'ritual': 'rituals',
            'herb': 'herbs',
            'text': 'texts',
            'symbol': 'symbols',
            'item': 'items',
            'place': 'places',
            'magic': 'magic',
            'concept': 'concepts',
            'figure': 'figures',
            'being': 'beings'
        };

        return typeMap[entityType] || entityType + 's';
    }

    /**
     * Generate HTML for browser
     */
    generateHTML(mythology, entityType, entityTypePlural, entities) {
        const config = this.getEntityTypeConfig(entityType);

        return `
            <div class="entity-type-browser" data-mythology="${mythology}" data-entity-type="${entityType}">
                <!-- Header -->
                <div class="browser-header">
                    <div class="browser-title-section">
                        <h1 class="browser-title">
                            ${config.icon} ${this.capitalize(mythology)} ${this.capitalize(entityTypePlural)}
                        </h1>
                        <p class="browser-subtitle">${entities.length} ${entities.length === 1 ? config.label : config.plural} found</p>
                    </div>

                    <!-- View Mode Switcher -->
                    <div class="view-mode-switcher">
                        <button class="view-mode-btn ${this.displayMode === 'grid' ? 'active' : ''}"
                                onclick="window.location.hash += '?view=grid'"
                                title="Grid View">
                            ▦
                        </button>
                        <button class="view-mode-btn ${this.displayMode === 'list' ? 'active' : ''}"
                                onclick="window.location.hash += '?view=list'"
                                title="List View">
                            ☰
                        </button>
                        <button class="view-mode-btn ${this.displayMode === 'table' ? 'active' : ''}"
                                onclick="window.location.hash += '?view=table'"
                                title="Table View">
                            ▤
                        </button>
                    </div>
                </div>

                <!-- Sort Controls -->
                <div class="browser-controls">
                    <div class="sort-controls">
                        <label for="sort-field">Sort by:</label>
                        <select id="sort-field" onchange="window.location.hash += '?sort=' + this.value">
                            <option value="name" ${this.sortField === 'name' ? 'selected' : ''}>Name</option>
                            ${config.sortFields.map(field => `
                                <option value="${field.value}" ${this.sortField === field.value ? 'selected' : ''}>
                                    ${field.label}
                                </option>
                            `).join('')}
                        </select>

                        <button class="sort-direction-btn"
                                onclick="window.location.hash += '?dir=${this.sortDirection === 'asc' ? 'desc' : 'asc'}'"
                                title="${this.sortDirection === 'asc' ? 'Ascending' : 'Descending'}">
                            ${this.sortDirection === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>

                    <div class="entity-count-badge">
                        ${entities.length} ${entities.length === 1 ? config.label : config.plural}
                    </div>
                </div>

                <!-- Entity Grid/List -->
                <div id="entity-container" class="entity-container">
                    ${this.renderEntities(mythology, entityType, entities)}
                </div>
            </div>
        `;
    }

    /**
     * Render entities based on display mode
     */
    renderEntities(mythology, entityType, entities) {
        // Use UniversalEntityRenderer for rendering
        const rendererId = 'entity-renderer-' + Date.now();

        // Schedule rendering after DOM update
        setTimeout(() => {
            const container = document.getElementById('entity-container');
            if (container && window.UniversalEntityRenderer) {
                const renderer = new window.UniversalEntityRenderer({
                    container: container,
                    entityType: entityType,
                    displayMode: this.displayMode,
                    db: this.db
                });

                // Set entities directly
                renderer.entities = entities;
                renderer.render();
            }
        }, 100);

        return `<div id="${rendererId}" class="renderer-loading">Loading entities...</div>`;
    }

    /**
     * Render empty state
     */
    renderEmpty(mythology, entityType, entityTypePlural) {
        const config = this.getEntityTypeConfig(entityType);

        return `
            <div class="entity-type-browser empty-browser">
                <div class="browser-header">
                    <h1 class="browser-title">
                        ${config.icon} ${this.capitalize(mythology)} ${this.capitalize(entityTypePlural)}
                    </h1>
                </div>

                <div class="empty-container">
                    <div class="empty-icon">${config.icon}</div>
                    <h2>No ${this.capitalize(entityTypePlural)} Found</h2>
                    <p class="empty-message">
                        There are no ${entityTypePlural} in the ${mythology} mythology yet.
                    </p>
                    <div class="empty-actions">
                        <a href="#/mythology/${mythology}" class="btn-primary">
                            Back to ${this.capitalize(mythology)}
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get entity type configuration
     */
    getEntityTypeConfig(entityType) {
        const configs = {
            'deity': {
                icon: '👑',
                label: 'Deity',
                plural: 'Deities',
                sortFields: [
                    { value: 'domains', label: 'Domains' },
                    { value: 'element', label: 'Element' }
                ]
            },
            'hero': {
                icon: '🦸',
                label: 'Hero',
                plural: 'Heroes',
                sortFields: [
                    { value: 'feats', label: 'Feats' },
                    { value: 'legacy', label: 'Legacy' }
                ]
            },
            'creature': {
                icon: '🐉',
                label: 'Creature',
                plural: 'Creatures',
                sortFields: [
                    { value: 'type', label: 'Type' },
                    { value: 'habitat', label: 'Habitat' }
                ]
            },
            'cosmology': {
                icon: '🌌',
                label: 'Cosmology',
                plural: 'Cosmology',
                sortFields: [
                    { value: 'realm', label: 'Realm' }
                ]
            },
            'ritual': {
                icon: '🕯️',
                label: 'Ritual',
                plural: 'Rituals',
                sortFields: [
                    { value: 'purpose', label: 'Purpose' },
                    { value: 'timing', label: 'Timing' }
                ]
            },
            'herb': {
                icon: '🌿',
                label: 'Herb',
                plural: 'Herbs',
                sortFields: [
                    { value: 'uses', label: 'Uses' }
                ]
            },
            'text': {
                icon: '📜',
                label: 'Text',
                plural: 'Texts',
                sortFields: [
                    { value: 'author', label: 'Author' },
                    { value: 'period', label: 'Period' }
                ]
            },
            'symbol': {
                icon: '⚡',
                label: 'Symbol',
                plural: 'Symbols',
                sortFields: [
                    { value: 'meaning', label: 'Meaning' }
                ]
            }
        };

        return configs[entityType] || {
            icon: '📄',
            label: this.capitalize(entityType),
            plural: this.capitalize(entityType) + 's',
            sortFields: []
        };
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export
window.EntityTypeBrowser = EntityTypeBrowser;
