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
 * @version 1.1.0
 */

(function() {
    'use strict';

    // Explicit collection name mapping for edge cases
    // Maps entity type singular to Firebase collection name
    const COLLECTION_NAME_MAP = {
        deity: 'deities',
        hero: 'heroes',
        creature: 'creatures',
        cosmology: 'cosmology',
        ritual: 'rituals',
        herb: 'herbs',
        concept: 'concepts',
        symbol: 'symbols',
        text: 'texts',
        item: 'items',
        place: 'places',
        magic: 'magic',
        mythology: 'mythologies',
        archetype: 'archetypes'
    };

    // Valid entity types for validation
    const VALID_ENTITY_TYPES = new Set(Object.keys(COLLECTION_NAME_MAP));

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
            this.displayMode = options.displayMode || 'grid';
            this.theme = options.theme || 'auto';
            this.entities = [];

            // Validate and set entity type with warning for unknown types
            const requestedType = options.entityType || 'deity';
            this.entityType = this._validateEntityType(requestedType);
            this.config = ENTITY_TYPE_CONFIG[this.entityType] || this._getDefaultConfig();

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

            // Render cache for performance optimization
            this._renderCache = new Map();
            this._cacheEnabled = options.cacheEnabled !== false; // Default to enabled
            this._cacheMaxSize = options.cacheMaxSize || 100;
        }

        /**
         * Validate entity type and log warning if unknown
         * @param {string} type - The entity type to validate
         * @returns {string} - Validated entity type or default
         */
        _validateEntityType(type) {
            if (!type || typeof type !== 'string') {
                console.warn(`[UniversalEntityRenderer] Invalid entity type provided: ${type}. Using default 'deity'.`);
                return 'deity';
            }

            const normalizedType = type.toLowerCase().trim();

            if (!VALID_ENTITY_TYPES.has(normalizedType)) {
                console.warn(
                    `[UniversalEntityRenderer] Unknown entity type '${type}'. ` +
                    `Valid types are: ${Array.from(VALID_ENTITY_TYPES).join(', ')}. ` +
                    `Using default 'deity'.`
                );
                return 'deity';
            }

            return normalizedType;
        }

        /**
         * Get default configuration for unknown entity types
         * @returns {Object} - Default configuration object
         */
        _getDefaultConfig() {
            return {
                icon: '✨',
                label: 'Entity',
                plural: 'Entities',
                collection: 'entities',
                primaryFields: ['name', 'description']
            };
        }

        /**
         * Get collection name for entity type using explicit mapping
         * @param {string} entityType - The entity type
         * @returns {string} - The Firebase collection name
         */
        _getCollectionName(entityType) {
            // First check explicit mapping
            if (COLLECTION_NAME_MAP[entityType]) {
                return COLLECTION_NAME_MAP[entityType];
            }

            // Fall back to config if available
            if (this.config && this.config.collection) {
                return this.config.collection;
            }

            // Last resort: attempt pluralization
            console.warn(`[UniversalEntityRenderer] No collection mapping for '${entityType}'. Attempting auto-pluralization.`);
            if (entityType.endsWith('y')) {
                return entityType.slice(0, -1) + 'ies';
            } else if (entityType.endsWith('s') || entityType.endsWith('x') || entityType.endsWith('ch') || entityType.endsWith('sh')) {
                return entityType + 'es';
            }
            return entityType + 's';
        }

        /**
         * Main render method - dispatches to appropriate renderer
         */
        async render() {
            if (!this.container) {
                console.error('[UniversalEntityRenderer] No container specified');
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

                // Check cache first
                const cacheKey = this._generateCacheKey(processedEntities);
                if (this._cacheEnabled && this._renderCache.has(cacheKey)) {
                    const cachedHTML = this._renderCache.get(cacheKey);
                    this._applyRenderedHTML(cachedHTML);
                    this.attachEventListeners();
                    if (this.onRenderComplete) {
                        this.onRenderComplete(processedEntities);
                    }
                    return;
                }

                // Render based on display mode with error handling
                let renderedHTML = '';
                try {
                    switch (this.displayMode) {
                        case 'grid':
                            renderedHTML = this._renderGridHTML(processedEntities);
                            break;
                        case 'list':
                            renderedHTML = this._renderListHTML(processedEntities);
                            break;
                        case 'table':
                            renderedHTML = this._renderTableHTML(processedEntities);
                            break;
                        case 'panel':
                            renderedHTML = this._renderPanelHTML(processedEntities);
                            break;
                        case 'inline':
                            renderedHTML = this._renderInlineHTML(processedEntities);
                            break;
                        default:
                            console.warn(`[UniversalEntityRenderer] Unknown display mode '${this.displayMode}', falling back to grid.`);
                            renderedHTML = this._renderGridHTML(processedEntities);
                    }
                } catch (renderError) {
                    console.error('[UniversalEntityRenderer] Error during rendering:', renderError);
                    this.showRenderError(renderError, this.displayMode);
                    return;
                }

                // Apply rendered HTML and cache it
                this._applyRenderedHTML(renderedHTML);
                if (this._cacheEnabled) {
                    this._cacheRenderedHTML(cacheKey, renderedHTML);
                }

                // Attach event listeners
                this.attachEventListeners();

                // Call completion callback
                if (this.onRenderComplete) {
                    this.onRenderComplete(processedEntities);
                }

            } catch (error) {
                console.error('[UniversalEntityRenderer] Render error:', error);
                this.showError(error);
            }
        }

        /**
         * Generate cache key based on entity IDs, display mode, and sorting
         */
        _generateCacheKey(entities) {
            const entityIds = entities.map(e => e.id).join(',');
            return `${this.entityType}:${this.displayMode}:${this.sortField}:${this.sortDirection}:${entityIds}`;
        }

        /**
         * Cache rendered HTML with size limit
         */
        _cacheRenderedHTML(key, html) {
            // Enforce cache size limit
            if (this._renderCache.size >= this._cacheMaxSize) {
                // Remove oldest entry (first key in Map)
                const firstKey = this._renderCache.keys().next().value;
                this._renderCache.delete(firstKey);
            }
            this._renderCache.set(key, html);
        }

        /**
         * Apply rendered HTML to container
         */
        _applyRenderedHTML(html) {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (containerEl) {
                containerEl.innerHTML = html;
                containerEl.classList.add('universal-renderer-container');
            }
        }

        /**
         * Invalidate cache (call when entity data changes)
         */
        invalidateCache() {
            this._renderCache.clear();
        }

        /**
         * Show render-specific error with user-friendly message
         */
        showRenderError(error, displayMode) {
            const containerEl = typeof this.container === 'string'
                ? document.querySelector(this.container)
                : this.container;

            if (containerEl) {
                containerEl.innerHTML = `
                    <div class="universal-error render-error">
                        <div class="error-icon">⚠️</div>
                        <h3>Display Error</h3>
                        <p>Unable to render ${this.config.plural.toLowerCase()} in ${displayMode} mode.</p>
                        <p class="error-details">${this.escapeHtml(error.message || 'An unexpected error occurred.')}</p>
                        <div class="error-actions">
                            <button class="btn-retry" onclick="location.reload()">Refresh Page</button>
                            <button class="btn-secondary" onclick="this.closest('.universal-error').remove()">Dismiss</button>
                        </div>
                    </div>
                `;
            }
        }

        /**
         * Load entities from Firebase
         */
        async loadEntities() {
            if (!this.db) {
                throw new Error('Firebase Firestore not initialized');
            }

            // Use explicit collection mapping
            const collectionName = this._getCollectionName(this.entityType);
            let query = this.db.collection(collectionName);

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
         * Render grid layout (legacy method for backward compatibility)
         */
        renderGrid(entities) {
            const html = this._renderGridHTML(entities);
            this._applyRenderedHTML(html);
        }

        /**
         * Generate grid layout HTML
         */
        _renderGridHTML(entities) {
            return `
                <div class="universal-grid" data-entity-type="${this.entityType}">
                    ${entities.map(entity => this._safeRenderGridCard(entity)).join('')}
                </div>
            `;
        }

        /**
         * Safe wrapper for grid card rendering with error handling
         */
        _safeRenderGridCard(entity) {
            try {
                return this.renderGridCard(entity);
            } catch (error) {
                console.error(`[UniversalEntityRenderer] Error rendering grid card for entity ${entity?.id}:`, error);
                return this._renderErrorCard(entity, 'grid');
            }
        }

        /**
         * Render fallback error card when individual entity fails
         */
        _renderErrorCard(entity, mode) {
            const entityName = this._safeGetProperty(entity, 'name') ||
                               this._safeGetProperty(entity, 'title') ||
                               'Unknown Entity';
            const entityId = entity?.id || 'unknown';

            return `
                <div class="entity-card error-card" data-entity-id="${entityId}" data-entity-type="${this.entityType}">
                    <div class="error-card-content">
                        <span class="error-icon">⚠️</span>
                        <span class="error-text">Unable to display: ${this.escapeHtml(entityName)}</span>
                    </div>
                </div>
            `;
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
                     data-entity-id="${this.escapeAttr(entity.id)}"
                     data-entity-type="${this.escapeAttr(this.entityType)}"
                     data-mythology="${this.escapeAttr(mythologyLower)}"
                     data-importance="${parseInt(entity.importance, 10) || 50}"
                     style="--entity-color: ${this.escapeAttr(primaryColor)}"
                     tabindex="0"
                     role="article"
                     aria-label="${this.escapeAttr(entity.name || entity.title)}">

                    <div class="grid-card-header">
                        <div class="grid-card-icon" aria-hidden="true">${iconContent}</div>
                    </div>

                    <div class="grid-card-body">
                        <h3 class="grid-card-title">
                            <a href="${this.escapeAttr(this.sanitizeUrl(this.getEntityUrl(entity)) || '#')}">${this.escapeHtml(entity.name || entity.title)}</a>
                        </h3>

                        <div class="grid-card-meta">
                            <span class="entity-type-badge" data-type="${this.escapeAttr(this.entityType)}">${this.config.icon} ${this.escapeHtml(this.config.label)}</span>
                            <span class="mythology-badge" data-mythology="${this.escapeAttr(mythologyLower)}">${this.escapeHtml(this.capitalize(mythology))}</span>
                        </div>

                        ${entity.shortDescription ? `
                            <p class="grid-card-description">${this.escapeHtml(this.truncateText(entity.shortDescription, 120))}</p>
                        ` : ''}

                        ${this.renderGridCardFields(entity)}
                    </div>

                    <div class="grid-card-footer">
                        <a href="${this.escapeAttr(this.sanitizeUrl(this.getEntityUrl(entity)) || '#')}" class="btn-view-details" aria-label="View details for ${this.escapeAttr(entity.name || entity.title)}">View Details</a>
                    </div>
                </div>
            `;
        }

        /**
         * Render icon with fallback support
         * Handles emoji, inline SVG, SVG URLs, and image URLs
         */
        renderIconWithFallback(icon, fallbackIcon, entityName) {
            if (!icon) {
                // Use fallback icon or generate from entity name
                return fallbackIcon || this.generateFallbackIcon(entityName);
            }

            // Check if icon is inline SVG - render directly without escaping
            if (typeof icon === 'string' && icon.trim().startsWith('<svg')) {
                return `<span class="entity-icon-svg">${icon}</span>`;
            }

            // Check if icon is an SVG URL or path
            if (typeof icon === 'string' && (icon.includes('.svg') || icon.includes('.png') || icon.includes('.jpg'))) {
                // Sanitize URL to prevent javascript: and data: XSS attacks
                const sanitizedUrl = this.sanitizeUrl(icon);
                if (!sanitizedUrl) {
                    return fallbackIcon || '&#10024;'; // Fallback if URL is invalid
                }
                return `<img src="${this.escapeAttr(sanitizedUrl)}" alt="" class="entity-icon-img" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='${fallbackIcon || '&#10024;'}'">`;
            }

            // Emoji or text icon - escape to prevent XSS
            return this.escapeHtml(icon);
        }

        /**
         * Sanitize URL to prevent XSS attacks via javascript: or data: URLs
         * @param {string} url - The URL to sanitize
         * @returns {string|null} - Sanitized URL or null if invalid
         */
        sanitizeUrl(url) {
            if (!url || typeof url !== 'string') return null;

            // Trim and normalize
            const trimmedUrl = url.trim().toLowerCase();

            // Block dangerous URL schemes
            const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
            for (const scheme of dangerousSchemes) {
                if (trimmedUrl.startsWith(scheme)) {
                    console.warn('[UniversalEntityRenderer] Blocked potentially dangerous URL:', url.substring(0, 50));
                    return null;
                }
            }

            // Allow http, https, and relative URLs
            if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./')) {
                return url;
            }

            // Block any other scheme (anything with : before /)
            if (trimmedUrl.indexOf(':') < trimmedUrl.indexOf('/') && trimmedUrl.indexOf(':') !== -1) {
                console.warn('[UniversalEntityRenderer] Blocked URL with unknown scheme:', url.substring(0, 50));
                return null;
            }

            return url;
        }

        /**
         * Escape attribute value for safe HTML attribute insertion
         */
        escapeAttr(text) {
            if (text === null || text === undefined) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
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
         * Render list layout (legacy method for backward compatibility)
         */
        renderList(entities) {
            const html = this._renderListHTML(entities);
            this._applyRenderedHTML(html);
        }

        /**
         * Generate list layout HTML
         */
        _renderListHTML(entities) {
            return `
                <div class="universal-list" data-entity-type="${this.entityType}">
                    ${entities.map(entity => this._safeRenderListItem(entity)).join('')}
                </div>
            `;
        }

        /**
         * Safe wrapper for list item rendering with error handling
         */
        _safeRenderListItem(entity) {
            try {
                return this.renderListItem(entity);
            } catch (error) {
                console.error(`[UniversalEntityRenderer] Error rendering list item for entity ${entity?.id}:`, error);
                return this._renderErrorCard(entity, 'list');
            }
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
                     data-entity-id="${this.escapeAttr(entity.id)}"
                     data-entity-type="${this.escapeAttr(this.entityType)}"
                     data-mythology="${this.escapeAttr(mythologyLower)}"
                     tabindex="0"
                     role="article"
                     aria-label="${this.escapeAttr(entity.name || entity.title)}">

                    <div class="list-item-icon" aria-hidden="true">
                        ${iconContent}
                    </div>

                    <div class="list-item-content">
                        <div class="list-item-header">
                            <h3 class="list-item-title">
                                <a href="${this.escapeAttr(this.sanitizeUrl(this.getEntityUrl(entity)) || '#')}">${this.escapeHtml(entity.name || entity.title)}</a>
                            </h3>
                            <div class="list-item-badges">
                                <span class="entity-type-badge" data-type="${this.escapeAttr(this.entityType)}">${this.config.icon} ${this.escapeHtml(this.config.label)}</span>
                                <span class="mythology-badge" data-mythology="${this.escapeAttr(mythologyLower)}">${this.escapeHtml(this.capitalize(mythology))}</span>
                            </div>
                        </div>

                        ${entity.shortDescription ? `
                            <p class="list-item-description">${this.escapeHtml(this.truncateText(entity.shortDescription, 150))}</p>
                        ` : ''}

                        ${this.renderListItemFields(entity)}
                    </div>

                    <div class="list-item-actions">
                        <a href="${this.escapeAttr(this.sanitizeUrl(this.getEntityUrl(entity)) || '#')}" class="btn-view-details" aria-label="View ${this.escapeAttr(entity.name || entity.title)}">View</a>
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
         * Render table layout (legacy method for backward compatibility)
         */
        renderTable(entities) {
            const html = this._renderTableHTML(entities);
            this._applyRenderedHTML(html);
        }

        /**
         * Generate table layout HTML
         */
        _renderTableHTML(entities) {
            const columns = this.getTableColumns();

            return `
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
                            ${entities.map(entity => this._safeRenderTableRow(entity, columns)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        /**
         * Safe wrapper for table row rendering with error handling
         */
        _safeRenderTableRow(entity, columns) {
            try {
                return this.renderTableRow(entity, columns);
            } catch (error) {
                console.error(`[UniversalEntityRenderer] Error rendering table row for entity ${entity?.id}:`, error);
                const entityName = this._safeGetProperty(entity, 'name') || 'Unknown';
                return `
                    <tr class="error-row" data-entity-id="${entity?.id || 'unknown'}">
                        <td colspan="${columns.length + 1}">
                            <span class="error-icon">⚠️</span> Unable to display: ${this.escapeHtml(entityName)}
                        </td>
                    </tr>
                `;
            }
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
            const safeUrl = this.sanitizeUrl(this.getEntityUrl(entity)) || '#';
            return `
                <tr data-entity-id="${this.escapeAttr(entity.id)}" data-entity-type="${this.escapeAttr(this.entityType)}">
                    ${columns.map(col => {
                        const value = this.getNestedValue(entity, col.field);
                        const displayValue = Array.isArray(value)
                            ? value.join(', ')
                            : (value || '-');

                        if (col.field === 'name') {
                            return `<td class="name-cell"><a href="${this.escapeAttr(safeUrl)}">${this.escapeHtml(entity.name || entity.title)}</a></td>`;
                        }

                        return `<td>${this.escapeHtml(String(displayValue))}</td>`;
                    }).join('')}
                    <td class="actions-cell">
                        <a href="${this.escapeAttr(safeUrl)}" class="btn-table-action">View</a>
                    </td>
                </tr>
            `;
        }

        /**
         * Render panel layout (legacy method for backward compatibility)
         */
        renderPanel(entities) {
            const html = this._renderPanelHTML(entities);
            this._applyRenderedHTML(html);
        }

        /**
         * Generate panel layout HTML
         */
        _renderPanelHTML(entities) {
            return `
                <div class="universal-panel-container" data-entity-type="${this.entityType}">
                    ${entities.map(entity => this._safeRenderPanelCard(entity)).join('')}
                </div>
            `;
        }

        /**
         * Safe wrapper for panel card rendering with error handling
         */
        _safeRenderPanelCard(entity) {
            try {
                return this.renderPanelCard(entity);
            } catch (error) {
                console.error(`[UniversalEntityRenderer] Error rendering panel card for entity ${entity?.id}:`, error);
                return this._renderErrorCard(entity, 'panel');
            }
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
                     data-entity-id="${this.escapeAttr(entity.id)}"
                     data-entity-type="${this.escapeAttr(this.entityType)}"
                     style="--entity-primary: ${this.escapeAttr(primary)}; --entity-secondary: ${this.escapeAttr(secondary)}">

                    <div class="panel-hero" style="background: linear-gradient(135deg, ${this.escapeAttr(primary)}, ${this.escapeAttr(secondary)})">
                        ${entity.icon ? `<div class="panel-icon">${this.escapeHtml(entity.icon)}</div>` : `<div class="panel-icon">${this.config.icon}</div>`}
                        <h2 class="panel-title">${this.escapeHtml(entity.name || entity.title)}</h2>
                        ${entity.linguistic?.originalName ? `
                            <div class="panel-subtitle">${this.escapeHtml(entity.linguistic.originalName)}</div>
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
                            <a href="${this.escapeAttr(this.sanitizeUrl(this.getEntityUrl(entity)) || '#')}" class="btn-primary">Full Details</a>
                            <button class="btn-secondary panel-expand" data-entity-id="${this.escapeAttr(entity.id)}">Expand</button>
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
         * Render inline layout (legacy method for backward compatibility)
         */
        renderInline(entities) {
            const html = this._renderInlineHTML(entities);
            this._applyRenderedHTML(html);
        }

        /**
         * Generate inline layout HTML
         */
        _renderInlineHTML(entities) {
            return `
                <span class="universal-inline" data-entity-type="${this.entityType}">
                    ${entities.map(entity => this._safeRenderInlineItem(entity)).join(', ')}
                </span>
            `;
        }

        /**
         * Safe wrapper for inline item rendering with error handling
         */
        _safeRenderInlineItem(entity) {
            try {
                return this.renderInlineItem(entity);
            } catch (error) {
                console.error(`[UniversalEntityRenderer] Error rendering inline item for entity ${entity?.id}:`, error);
                const entityName = this._safeGetProperty(entity, 'name') || 'Unknown';
                return `<span class="inline-error">${this.escapeHtml(entityName)}</span>`;
            }
        }

        /**
         * Render single inline item
         */
        renderInlineItem(entity) {
            const safeUrl = this.sanitizeUrl(this.getEntityUrl(entity)) || '#';
            return `
                <a href="${this.escapeAttr(safeUrl)}"
                   class="inline-entity-link"
                   data-entity-id="${this.escapeAttr(entity.id)}"
                   data-entity-type="${this.escapeAttr(this.entityType)}"
                   title="${this.escapeAttr(entity.shortDescription || entity.name)}">
                    ${entity.icon ? `<span class="inline-icon">${this.escapeHtml(entity.icon)}</span>` : ''}
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
         * Safe property accessor with fallback
         * Validates property exists before accessing and provides fallback
         * @param {Object} entity - The entity object
         * @param {string} property - The property path (supports dot notation)
         * @param {*} fallback - Fallback value if property doesn't exist (default: null)
         * @returns {*} - Property value or fallback
         */
        _safeGetProperty(entity, property, fallback = null) {
            if (!entity || typeof entity !== 'object') {
                return fallback;
            }

            try {
                const value = this.getNestedValue(entity, property);
                return value !== undefined && value !== null ? value : fallback;
            } catch (error) {
                console.warn(`[UniversalEntityRenderer] Error accessing property '${property}':`, error);
                return fallback;
            }
        }

        /**
         * Validate that required fields exist in entity data
         * Returns object with validation results
         * @param {Object} entity - The entity to validate
         * @param {Array<string>} requiredFields - List of required field paths
         * @returns {Object} - { isValid: boolean, missingFields: string[] }
         */
        _validateEntityFields(entity, requiredFields = ['name']) {
            const missingFields = [];

            if (!entity || typeof entity !== 'object') {
                return { isValid: false, missingFields: requiredFields };
            }

            for (const field of requiredFields) {
                const value = this._safeGetProperty(entity, field);
                if (value === null || value === undefined || value === '') {
                    missingFields.push(field);
                }
            }

            return {
                isValid: missingFields.length === 0,
                missingFields
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

        /**
         * Truncate text to specified length with ellipsis
         * @param {string} text - Text to truncate
         * @param {number} maxLength - Maximum length (default 150)
         * @returns {string} Truncated text
         */
        truncateText(text, maxLength = 150) {
            if (!text || text.length <= maxLength) return text || '';
            return text.substring(0, maxLength).trim() + '...';
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
            // Validate the new entity type
            this.entityType = this._validateEntityType(type);
            this.config = ENTITY_TYPE_CONFIG[this.entityType] || this._getDefaultConfig();
            this.entities = [];
            // Invalidate cache when entity type changes
            this.invalidateCache();
            await this.render();
        }

        /**
         * Update filters and re-render
         */
        async setFilters(filters) {
            this.filters = filters;
            this.entities = [];
            // Invalidate cache when filters change
            this.invalidateCache();
            await this.render();
        }

        /**
         * Refresh data and re-render
         */
        async refresh() {
            this.entities = [];
            // Invalidate cache on refresh
            this.invalidateCache();
            await this.render();
        }
    }

    // Export to window
    window.UniversalEntityRenderer = UniversalEntityRenderer;

    // Also export config and utilities for external use
    window.ENTITY_TYPE_CONFIG = ENTITY_TYPE_CONFIG;
    window.COLLECTION_NAME_MAP = COLLECTION_NAME_MAP;
    window.VALID_ENTITY_TYPES = VALID_ENTITY_TYPES;

})();
