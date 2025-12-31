/**
 * Universal Entity Renderer
 * Comprehensive rendering system supporting all entity types with multiple display modes
 *
 * Supports:
 * - Entity Types: deity, hero, creature, cosmology, ritual, herb, concept, symbol, text
 * - Display Modes: grid, list, table, panel, inline
 * - Responsive layouts with mobile-first design
 * - Theme integration and Firebase data structure
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    // Entity type configuration with icons and metadata
    const ENTITY_TYPE_CONFIG = {
        deity: {
            icon: '👑',
            label: 'Deity',
            plural: 'Deities',
            collection: 'deities',
            primaryFields: ['domains', 'symbols', 'element']
        },
        hero: {
            icon: '🦸',
            label: 'Hero',
            plural: 'Heroes',
            collection: 'heroes',
            primaryFields: ['feats', 'weapons', 'legacy']
        },
        creature: {
            icon: '🐉',
            label: 'Creature',
            plural: 'Creatures',
            collection: 'creatures',
            primaryFields: ['abilities', 'habitat', 'type']
        },
        cosmology: {
            icon: '🌌',
            label: 'Cosmology',
            plural: 'Cosmology',
            collection: 'cosmology',
            primaryFields: ['realm', 'structure', 'inhabitants']
        },
        ritual: {
            icon: '🕯️',
            label: 'Ritual',
            plural: 'Rituals',
            collection: 'rituals',
            primaryFields: ['purpose', 'participants', 'timing']
        },
        herb: {
            icon: '🌿',
            label: 'Herb',
            plural: 'Herbs',
            collection: 'herbs',
            primaryFields: ['uses', 'properties', 'preparation']
        },
        concept: {
            icon: '💭',
            label: 'Concept',
            plural: 'Concepts',
            collection: 'concepts',
            primaryFields: ['philosophy', 'principles', 'applications']
        },
        symbol: {
            icon: '⚡',
            label: 'Symbol',
            plural: 'Symbols',
            collection: 'symbols',
            primaryFields: ['meaning', 'usage', 'associations']
        },
        text: {
            icon: '📜',
            label: 'Text',
            plural: 'Texts',
            collection: 'texts',
            primaryFields: ['author', 'period', 'significance']
        },
        item: {
            icon: '⚔️',
            label: 'Item',
            plural: 'Items',
            collection: 'items',
            primaryFields: ['type', 'powers', 'wielder']
        },
        place: {
            icon: '🏛️',
            label: 'Place',
            plural: 'Places',
            collection: 'places',
            primaryFields: ['location', 'significance', 'inhabitants']
        },
        magic: {
            icon: '✨',
            label: 'Magic',
            plural: 'Magic',
            collection: 'magic',
            primaryFields: ['type', 'effects', 'practitioners']
        }
    };

    class UniversalEntityRenderer {
        constructor(options = {}) {
            this.db = options.db || (window.firebase && window.firebase.firestore());
            this.container = options.container;
            this.entityType = options.entityType || 'deity';
            this.displayMode = options.displayMode || 'grid';
            this.theme = options.theme || 'auto';
            this.entities = [];
            this.config = ENTITY_TYPE_CONFIG[this.entityType] || ENTITY_TYPE_CONFIG.deity;

            // Sorting and filtering
            this.sortField = options.sortField || 'name';
            this.sortDirection = options.sortDirection || 'asc';
            this.filters = options.filters || {};

            // Pagination
            this.pageSize = options.pageSize || 50;
            this.currentPage = 1;

            // Callbacks
            this.onEntityClick = options.onEntityClick || null;
            this.onRenderComplete = options.onRenderComplete || null;
        }

        /**
         * Main render method - dispatches to appropriate renderer
         */
        async render() {
            if (!this.container) {
                console.error('UniversalEntityRenderer: No container specified');
                return;
            }

            this.showLoading();

            try {
                // Load entities if not already loaded
                if (this.entities.length === 0) {
                    await this.loadEntities();
                }

                // Apply sorting and filtering
                const processedEntities = this.processEntities(this.entities);

                // Render based on display mode
                switch (this.displayMode) {
                    case 'grid':
                        this.renderGrid(processedEntities);
                        break;
                    case 'list':
                        this.renderList(processedEntities);
                        break;
                    case 'table':
                        this.renderTable(processedEntities);
                        break;
                    case 'panel':
                        this.renderPanel(processedEntities);
                        break;
                    case 'inline':
                        this.renderInline(processedEntities);
                        break;
                    default:
                        this.renderGrid(processedEntities);
                }

                // Attach event listeners
                this.attachEventListeners();

                // Call completion callback
                if (this.onRenderComplete) {
                    this.onRenderComplete(processedEntities);
                }

            } catch (error) {
                console.error('UniversalEntityRenderer: Render error', error);
                this.showError(error);
            }
        }

        /**
         * Load entities from Firebase
         */
        async loadEntities() {
            if (!this.db) {
                throw new Error('Firebase Firestore not initialized');
            }

            let query = this.db.collection(this.config.collection);

            // Apply filters
            Object.entries(this.filters).forEach(([field, value]) => {
                if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                        query = query.where(field, 'array-contains-any', value);
                    } else {
                        query = query.where(field, '==', value);
                    }
                }
            });

            const snapshot = await query.get();
            this.entities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return this.entities;
        }

        /**
         * Process entities (sort, filter, paginate)
         */
        processEntities(entities) {
            let processed = [...entities];

            // Sort
            processed.sort((a, b) => {
                const aVal = this.getNestedValue(a, this.sortField);
                const bVal = this.getNestedValue(b, this.sortField);

                if (aVal === bVal) return 0;

                const comparison = aVal < bVal ? -1 : 1;
                return this.sortDirection === 'asc' ? comparison : -comparison;
            });

            // Paginate
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            processed = processed.slice(startIndex, endIndex);

            return processed;
        }

        /**
         * Render grid layout
         */
        renderGrid(entities) {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (!containerEl) return;

            const gridHTML = `
                <div class="universal-grid" data-entity-type="${this.entityType}">
                    ${entities.map(entity => this.renderGridCard(entity)).join('')}
                </div>
            `;

            containerEl.innerHTML = gridHTML;
            containerEl.classList.add('universal-renderer-container');
        }

        /**
         * Render single grid card
         */
        renderGridCard(entity) {
            const colors = entity.colors || {};
            const primaryColor = colors.primary || '#667eea';
            const mythology = entity.mythology || entity.primaryMythology || 'unknown';
            const mythologyLower = mythology.toLowerCase();

            // Generate icon with fallback
            const iconContent = this.renderIconWithFallback(entity.icon, this.config.icon, entity.name);

            return `
                <div class="entity-card universal-grid-card"
                     data-entity-id="${entity.id}"
                     data-entity-type="${this.entityType}"
                     data-mythology="${mythologyLower}"
                     data-importance="${entity.importance || 50}"
                     style="--entity-color: ${primaryColor}"
                     tabindex="0"
                     role="article"
                     aria-label="${this.escapeHtml(entity.name || entity.title)}">

                    <div class="grid-card-header">
                        <div class="grid-card-icon" aria-hidden="true">${iconContent}</div>
                    </div>

                    <div class="grid-card-body">
                        <h3 class="grid-card-title">
                            <a href="${this.getEntityUrl(entity)}">${this.escapeHtml(entity.name || entity.title)}</a>
                        </h3>

                        <div class="grid-card-meta">
                            <span class="entity-type-badge" data-type="${this.entityType}">${this.config.icon} ${this.config.label}</span>
                            <span class="mythology-badge" data-mythology="${mythologyLower}">${this.capitalize(mythology)}</span>
                        </div>

                        ${entity.shortDescription ? `
                            <p class="grid-card-description">${this.escapeHtml(entity.shortDescription)}</p>
                        ` : ''}

                        ${this.renderGridCardFields(entity)}
                    </div>

                    <div class="grid-card-footer">
                        <a href="${this.getEntityUrl(entity)}" class="btn-view-details" aria-label="View details for ${this.escapeHtml(entity.name || entity.title)}">View Details</a>
                    </div>
                </div>
            `;
        }

        /**
         * Render icon with fallback support
         */
        renderIconWithFallback(icon, fallbackIcon, entityName) {
            if (!icon) {
                // Use fallback icon or generate from entity name
                return fallbackIcon || this.generateFallbackIcon(entityName);
            }

            // Check if icon is an SVG URL or path
            if (typeof icon === 'string' && (icon.includes('.svg') || icon.includes('.png') || icon.includes('.jpg'))) {
                return `<img src="${icon}" alt="" class="entity-icon-img" loading="lazy" onerror="this.parentElement.innerHTML='${fallbackIcon || '✨'}'">`;
            }

            // Emoji or text icon
            return icon;
        }

        /**
         * Generate fallback icon from entity name
         */
        generateFallbackIcon(name) {
            if (!name) return '✨';
            // Return first character as fallback
            const firstChar = name.charAt(0).toUpperCase();
            return `<span class="icon-fallback">${firstChar}</span>`;
        }

        /**
         * Render type-specific fields for grid card
         */
        renderGridCardFields(entity) {
            const fields = this.config.primaryFields || [];
            let html = '<div class="grid-card-fields">';

            fields.forEach(field => {
                const value = this.getNestedValue(entity, field);
                if (value) {
                    const displayValue = Array.isArray(value)
                        ? value.slice(0, 3).join(', ')
                        : value;

                    html += `
                        <div class="field-item">
                            <span class="field-label">${this.capitalize(field)}:</span>
                            <span class="field-value">${this.escapeHtml(displayValue)}</span>
                        </div>
                    `;
                }
            });

            html += '</div>';
            return html;
        }

        /**
         * Render list layout
         */
        renderList(entities) {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (!containerEl) return;

            const listHTML = `
                <div class="universal-list" data-entity-type="${this.entityType}">
                    ${entities.map(entity => this.renderListItem(entity)).join('')}
                </div>
            `;

            containerEl.innerHTML = listHTML;
            containerEl.classList.add('universal-renderer-container');
        }

        /**
         * Render single list item
         */
        renderListItem(entity) {
            const mythology = entity.mythology || entity.primaryMythology || 'unknown';
            const mythologyLower = mythology.toLowerCase();
            const iconContent = this.renderIconWithFallback(entity.icon, this.config.icon, entity.name);

            return `
                <div class="universal-list-item"
                     data-entity-id="${entity.id}"
                     data-entity-type="${this.entityType}"
                     data-mythology="${mythologyLower}"
                     tabindex="0"
                     role="article"
                     aria-label="${this.escapeHtml(entity.name || entity.title)}">

                    <div class="list-item-icon" aria-hidden="true">
                        ${iconContent}
                    </div>

                    <div class="list-item-content">
                        <div class="list-item-header">
                            <h3 class="list-item-title">
                                <a href="${this.getEntityUrl(entity)}">${this.escapeHtml(entity.name || entity.title)}</a>
                            </h3>
                            <div class="list-item-badges">
                                <span class="entity-type-badge" data-type="${this.entityType}">${this.config.icon} ${this.config.label}</span>
                                <span class="mythology-badge" data-mythology="${mythologyLower}">${this.capitalize(mythology)}</span>
                            </div>
                        </div>

                        ${entity.shortDescription ? `
                            <p class="list-item-description">${this.escapeHtml(entity.shortDescription)}</p>
                        ` : ''}

                        ${this.renderListItemFields(entity)}
                    </div>

                    <div class="list-item-actions">
                        <a href="${this.getEntityUrl(entity)}" class="btn-view-details" aria-label="View ${this.escapeHtml(entity.name || entity.title)}">View</a>
                    </div>
                </div>
            `;
        }

        /**
         * Render type-specific fields for list item
         */
        renderListItemFields(entity) {
            const fields = this.config.primaryFields || [];
            let html = '<div class="list-item-fields">';

            fields.forEach(field => {
                const value = this.getNestedValue(entity, field);
                if (value) {
                    const displayValue = Array.isArray(value)
                        ? value.join(', ')
                        : value;

                    html += `<span class="field-tag"><strong>${this.capitalize(field)}:</strong> ${this.escapeHtml(displayValue)}</span>`;
                }
            });

            html += '</div>';
            return html;
        }

        /**
         * Render table layout
         */
        renderTable(entities) {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (!containerEl) return;

            const columns = this.getTableColumns();

            const tableHTML = `
                <div class="universal-table-container">
                    <table class="universal-table" data-entity-type="${this.entityType}">
                        <thead>
                            <tr>
                                ${columns.map(col => `
                                    <th class="sortable" data-field="${col.field}" data-sort="${this.sortField === col.field ? this.sortDirection : 'none'}">
                                        ${col.label}
                                        <span class="sort-indicator"></span>
                                    </th>
                                `).join('')}
                                <th class="actions-column">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${entities.map(entity => this.renderTableRow(entity, columns)).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            containerEl.innerHTML = tableHTML;
            containerEl.classList.add('universal-renderer-container');
        }

        /**
         * Get table columns based on entity type
         */
        getTableColumns() {
            const baseColumns = [
                { field: 'name', label: 'Name' },
                { field: 'mythology', label: 'Mythology' }
            ];

            const typeColumns = this.config.primaryFields.map(field => ({
                field: field,
                label: this.capitalize(field)
            }));

            return [...baseColumns, ...typeColumns];
        }

        /**
         * Render single table row
         */
        renderTableRow(entity, columns) {
            return `
                <tr data-entity-id="${entity.id}" data-entity-type="${this.entityType}">
                    ${columns.map(col => {
                        const value = this.getNestedValue(entity, col.field);
                        const displayValue = Array.isArray(value)
                            ? value.join(', ')
                            : (value || '-');

                        if (col.field === 'name') {
                            return `<td class="name-cell"><a href="${this.getEntityUrl(entity)}">${this.escapeHtml(entity.name || entity.title)}</a></td>`;
                        }

                        return `<td>${this.escapeHtml(displayValue)}</td>`;
                    }).join('')}
                    <td class="actions-cell">
                        <a href="${this.getEntityUrl(entity)}" class="btn-table-action">View</a>
                    </td>
                </tr>
            `;
        }

        /**
         * Render panel layout (detailed cards)
         */
        renderPanel(entities) {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (!containerEl) return;

            const panelHTML = `
                <div class="universal-panel-container" data-entity-type="${this.entityType}">
                    ${entities.map(entity => this.renderPanelCard(entity)).join('')}
                </div>
            `;

            containerEl.innerHTML = panelHTML;
            containerEl.classList.add('universal-renderer-container');
        }

        /**
         * Render single panel card
         */
        renderPanelCard(entity) {
            const colors = entity.colors || {};
            const primary = colors.primary || '#667eea';
            const secondary = colors.secondary || '#764ba2';

            return `
                <div class="universal-panel-card glass-card"
                     data-entity-id="${entity.id}"
                     data-entity-type="${this.entityType}"
                     style="--entity-primary: ${primary}; --entity-secondary: ${secondary}">

                    <div class="panel-hero" style="background: linear-gradient(135deg, ${primary}, ${secondary})">
                        ${entity.icon ? `<div class="panel-icon">${entity.icon}</div>` : `<div class="panel-icon">${this.config.icon}</div>`}
                        <h2 class="panel-title">${this.escapeHtml(entity.name || entity.title)}</h2>
                        ${entity.linguistic?.originalName ? `
                            <div class="panel-subtitle">${entity.linguistic.originalName}</div>
                        ` : ''}
                    </div>

                    <div class="panel-content">
                        <div class="panel-meta">
                            <span class="entity-type-badge">${this.config.label}</span>
                            <span class="mythology-badge">${this.capitalize(entity.mythology || entity.primaryMythology || 'unknown')}</span>
                        </div>

                        ${entity.shortDescription || entity.fullDescription ? `
                            <div class="panel-description">
                                ${this.escapeHtml(entity.shortDescription || entity.fullDescription?.substring(0, 200) + '...')}
                            </div>
                        ` : ''}

                        ${this.renderPanelFields(entity)}

                        <div class="panel-actions">
                            <a href="${this.getEntityUrl(entity)}" class="btn-primary">Full Details</a>
                            <button class="btn-secondary panel-expand" data-entity-id="${entity.id}">Expand</button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render type-specific fields for panel
         */
        renderPanelFields(entity) {
            const fields = this.config.primaryFields || [];
            let html = '<div class="panel-fields">';

            fields.forEach(field => {
                const value = this.getNestedValue(entity, field);
                if (value) {
                    html += `
                        <div class="panel-field">
                            <div class="panel-field-label">${this.capitalize(field)}</div>
                            <div class="panel-field-value">
                                ${Array.isArray(value)
                                    ? value.map(v => `<span class="field-tag">${this.escapeHtml(v)}</span>`).join('')
                                    : this.escapeHtml(value)}
                            </div>
                        </div>
                    `;
                }
            });

            html += '</div>';
            return html;
        }

        /**
         * Render inline layout (for embedding in text)
         */
        renderInline(entities) {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (!containerEl) return;

            const inlineHTML = `
                <span class="universal-inline" data-entity-type="${this.entityType}">
                    ${entities.map(entity => this.renderInlineItem(entity)).join(', ')}
                </span>
            `;

            containerEl.innerHTML = inlineHTML;
            containerEl.classList.add('universal-renderer-container');
        }

        /**
         * Render single inline item
         */
        renderInlineItem(entity) {
            return `
                <a href="${this.getEntityUrl(entity)}"
                   class="inline-entity-link"
                   data-entity-id="${entity.id}"
                   data-entity-type="${this.entityType}"
                   title="${this.escapeHtml(entity.shortDescription || entity.name)}">
                    ${entity.icon ? `<span class="inline-icon">${entity.icon}</span>` : ''}
                    ${this.escapeHtml(entity.name || entity.title)}
                </a>
            `;
        }

        /**
         * Show loading state
         */
        showLoading() {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (containerEl) {
                containerEl.innerHTML = `
                    <div class="universal-loading">
                        <div class="spinner-container">
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                        </div>
                        <p>Loading ${this.config.plural.toLowerCase()}...</p>
                    </div>
                `;
            }
        }

        /**
         * Show error state
         */
        showError(error) {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (containerEl) {
                containerEl.innerHTML = `
                    <div class="universal-error">
                        <div class="error-icon">⚠️</div>
                        <h3>Error Loading ${this.config.plural}</h3>
                        <p>${this.escapeHtml(error.message)}</p>
                        <button class="btn-retry" onclick="location.reload()">Retry</button>
                    </div>
                `;
            }
        }

        /**
         * Attach event listeners
         */
        attachEventListeners() {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (!containerEl) return;

            // Table sorting
            containerEl.querySelectorAll('.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const field = th.dataset.field;
                    if (this.sortField === field) {
                        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.sortField = field;
                        this.sortDirection = 'asc';
                    }
                    this.render();
                });
            });

            // Panel expand buttons
            containerEl.querySelectorAll('.panel-expand').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const card = btn.closest('.universal-panel-card');
                    card.classList.toggle('expanded');
                });
            });

            // Entity click events
            if (this.onEntityClick) {
                containerEl.querySelectorAll('[data-entity-id]').forEach(el => {
                    el.addEventListener('click', (e) => {
                        if (!e.target.closest('a, button')) {
                            const entityId = el.dataset.entityId;
                            const entity = this.entities.find(e => e.id === entityId);
                            if (entity) {
                                this.onEntityClick(entity, e);
                            }
                        }
                    });
                });
            }
        }

        /**
         * Get entity URL
         */
        getEntityUrl(entity) {
            if (entity.url) return entity.url;

            const mythology = entity.mythology || entity.primaryMythology || 'shared';
            const type = this.config.collection;
            return `/mythos/${mythology}/${type}/${entity.id}.html`;
        }

        /**
         * Get nested value from object
         */
        getNestedValue(obj, path) {
            return path.split('.').reduce((current, key) => current?.[key], obj);
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

        /**
         * Set display mode and re-render
         */
        setDisplayMode(mode) {
            this.displayMode = mode;
            this.render();
        }

        /**
         * Set entity type and reload
         */
        async setEntityType(type) {
            this.entityType = type;
            this.config = ENTITY_TYPE_CONFIG[type] || ENTITY_TYPE_CONFIG.deity;
            this.entities = [];
            await this.render();
        }

        /**
         * Update filters and re-render
         */
        async setFilters(filters) {
            this.filters = filters;
            this.entities = [];
            await this.render();
        }

        /**
         * Refresh data and re-render
         */
        async refresh() {
            this.entities = [];
            await this.render();
        }
    }

    // Export to window
    window.UniversalEntityRenderer = UniversalEntityRenderer;

    // Also export config for external use
    window.ENTITY_TYPE_CONFIG = ENTITY_TYPE_CONFIG;

})();
