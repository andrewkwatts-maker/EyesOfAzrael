/**
 * Universal Display Renderer
 *
 * Renders any entity in any display mode using standardized metadata
 *
 * Supported display modes:
 * - 'grid': Card-based grid layout (2-wide mobile, 4-wide desktop)
 * - 'table': Sortable, filterable table view
 * - 'list': Vertical list with optional expansion
 * - 'panel': Detailed cards with multiple sections
 * - 'inline': Mini badges for inline text usage
 *
 * Key Features:
 * - Consistent entity rendering across all types
 * - Text truncation with "Show more" toggle
 * - Array/list rendering as pills with overflow handling
 * - Responsive metadata grid
 * - Related entity links
 * - Empty state handling
 */

class UniversalDisplayRenderer {
    /**
     * Supported display modes
     * @type {string[]}
     */
    static SUPPORTED_MODES = ['grid', 'table', 'list', 'panel', 'inline'];

    /**
     * Entity type icons mapping
     * @type {Object}
     */
    static ENTITY_TYPE_ICONS = {
        deity: '👑',
        hero: '🦸',
        creature: '🐉',
        item: '⚔️',
        place: '🏛️',
        concept: '💭',
        magic: '✨',
        ritual: '🕯️',
        herb: '🌿',
        symbol: '⚡',
        text: '📜',
        archetype: '🎭',
        mythology: '🌍',
        cosmology: '🌌'
    };

    /**
     * Default maximum visible items for arrays/pills
     * @type {number}
     */
    static DEFAULT_MAX_VISIBLE_PILLS = 5;

    /**
     * Default maximum characters for truncation
     * @type {number}
     */
    static DEFAULT_MAX_CHARS = 150;

    /**
     * Default maximum lines for CSS line-clamp
     * @type {number}
     */
    static DEFAULT_MAX_LINES = 3;

    constructor(options = {}) {
        this.options = {
            defaultDisplayMode: 'grid',
            enableHover: true,
            enableExpand: true,
            enableCorpusLinks: true,
            theme: 'auto',
            maxVisiblePills: UniversalDisplayRenderer.DEFAULT_MAX_VISIBLE_PILLS,
            maxTruncateChars: UniversalDisplayRenderer.DEFAULT_MAX_CHARS,
            maxTruncateLines: UniversalDisplayRenderer.DEFAULT_MAX_LINES,
            ...options
        };

        // Track expanded states for "show more" functionality
        this._expandedStates = new Map();
    }

    /**
     * Validate and normalize entities input
     * @param {*} entities - Input to validate
     * @returns {Array} Normalized array of entities
     */
    validateEntities(entities) {
        // Handle null/undefined
        if (entities == null) {
            console.warn('[UniversalDisplayRenderer] Received null/undefined entities, returning empty array');
            return [];
        }

        // Handle array input
        if (Array.isArray(entities)) {
            return entities.filter(entity => {
                if (entity == null) {
                    console.warn('[UniversalDisplayRenderer] Filtered out null/undefined entity from array');
                    return false;
                }
                return true;
            });
        }

        // Handle single entity object
        if (typeof entities === 'object') {
            return [entities];
        }

        // Unexpected input type
        console.warn(`[UniversalDisplayRenderer] Unexpected entities type: ${typeof entities}, returning empty array`);
        return [];
    }

    /**
     * Render empty state message
     * @param {string} displayMode - The display mode being used
     * @returns {string} Empty state HTML
     */
    renderEmptyState(displayMode) {
        return `
            <div class="entity-empty-state" data-display-mode="${this.escapeAttr(displayMode)}">
                <div class="empty-state-icon">🔍</div>
                <p class="empty-state-message">No results found</p>
                <p class="empty-state-hint">Try adjusting your search or filters</p>
            </div>
        `;
    }

    /**
     * Main render method - dispatches to specific renderer
     * @param {Array|Object|null} entities - Entities to render
     * @param {string} displayMode - Display mode (grid, table, list, panel, inline)
     * @param {string|HTMLElement|null} container - Container element or ID
     * @returns {string} Rendered HTML
     * @throws {Error} If container ID is provided but element not found
     */
    render(entities, displayMode = 'grid', container = null) {
        // Validate and normalize entities
        const validatedEntities = this.validateEntities(entities);

        // Check for empty entities
        if (validatedEntities.length === 0) {
            const html = this.renderEmptyState(displayMode);
            if (container) {
                this.setContainerContent(container, html);
            }
            return html;
        }

        const renderers = {
            'grid': this.renderGrid.bind(this),
            'table': this.renderTable.bind(this),
            'list': this.renderList.bind(this),
            'panel': this.renderPanel.bind(this),
            'inline': this.renderInline.bind(this)
        };

        // Validate display mode
        if (!UniversalDisplayRenderer.SUPPORTED_MODES.includes(displayMode)) {
            console.warn(
                `[UniversalDisplayRenderer] Unknown display mode '${displayMode}', ` +
                `falling back to 'grid'. Supported modes: ${UniversalDisplayRenderer.SUPPORTED_MODES.join(', ')}`
            );
        }

        const renderer = renderers[displayMode] || renderers.grid;
        const html = renderer(validatedEntities);

        if (container) {
            this.setContainerContent(container, html);
        }

        return html;
    }

    /**
     * Set content on a container element with proper error handling
     * @param {string|HTMLElement} container - Container element or ID
     * @param {string} html - HTML content to set
     * @throws {Error} If container ID is provided but element not found
     */
    setContainerContent(container, html) {
        if (typeof container === 'string') {
            const element = document.getElementById(container);
            if (!element) {
                throw new Error(
                    `[UniversalDisplayRenderer] Container element not found: ` +
                    `document.getElementById('${container}') returned null. ` +
                    `Ensure the element exists in the DOM before calling render().`
                );
            }
            element.innerHTML = html;
        } else if (container && typeof container.innerHTML !== 'undefined') {
            container.innerHTML = html;
        } else {
            throw new Error(
                `[UniversalDisplayRenderer] Invalid container: expected DOM element or element ID string, ` +
                `received ${typeof container}`
            );
        }
    }

    // =========================================================================
    // HELPER FUNCTIONS (Required by specification)
    // =========================================================================

    /**
     * Truncate HTML content safely, preserving structure
     * @param {string} html - HTML content to truncate
     * @param {number} maxChars - Maximum characters to keep
     * @returns {string} Truncated HTML with ellipsis if needed
     */
    _truncateHTML(html, maxChars = this.options.maxTruncateChars) {
        if (!html || typeof html !== 'string') return '';

        // Strip HTML tags for length calculation
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        if (textContent.length <= maxChars) {
            return html;
        }

        // Truncate the plain text and return
        const truncated = textContent.substring(0, maxChars).replace(/&[^;]*$/, '');
        return this.escapeHtml(truncated) + '...';
    }

    /**
     * Render array items as pills with overflow handling
     * @param {Array} items - Array of items to render
     * @param {number} maxVisible - Maximum visible pills before showing "+N more"
     * @param {string} pillClass - Optional additional CSS class for pills
     * @returns {string} HTML string with pills
     */
    _renderArrayAsPills(items, maxVisible = this.options.maxVisiblePills, pillClass = '') {
        if (!Array.isArray(items) || items.length === 0) {
            return this._renderEmptyFieldState('No items available');
        }

        // Sanitize items - filter nulls and convert objects to readable strings
        const sanitizedItems = this._sanitizeArrayItems(items);
        if (sanitizedItems.length === 0) {
            return this._renderEmptyFieldState('No items available');
        }

        const uniqueId = `pills-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const visibleItems = sanitizedItems.slice(0, maxVisible);
        const hiddenItems = sanitizedItems.slice(maxVisible);
        const hasOverflow = hiddenItems.length > 0;

        let html = `<div class="pills-container ${pillClass}" data-pills-id="${uniqueId}">`;

        // Render visible pills
        html += `<div class="pills-visible">`;
        visibleItems.forEach(item => {
            html += `<span class="pill">${this.escapeHtml(item)}</span>`;
        });

        // Add "+N more" button if overflow
        if (hasOverflow) {
            html += `
                <button class="pill pill-more"
                        data-action="expand-pills"
                        data-target="${uniqueId}"
                        aria-expanded="false"
                        aria-label="Show ${hiddenItems.length} more items">
                    +${hiddenItems.length} more
                </button>
            `;
        }
        html += `</div>`;

        // Render hidden pills (collapsed by default)
        if (hasOverflow) {
            html += `<div class="pills-hidden" data-pills-hidden="${uniqueId}" aria-hidden="true">`;
            hiddenItems.forEach(item => {
                html += `<span class="pill">${this.escapeHtml(item)}</span>`;
            });
            html += `
                <button class="pill pill-less"
                        data-action="collapse-pills"
                        data-target="${uniqueId}"
                        aria-label="Show fewer items">
                    Show less
                </button>
            `;
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    /**
     * Render key-value data as a responsive grid
     * @param {Object} data - Object with key-value pairs
     * @param {Object} options - Rendering options
     * @returns {string} HTML string with metadata grid
     */
    _renderKeyValueGrid(data, options = {}) {
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            return this._renderEmptyFieldState('No metadata available');
        }

        const {
            columns = 2,
            showLabels = true,
            labelPosition = 'top' // 'top', 'left', 'inline'
        } = options;

        let html = `<div class="metadata-grid" data-columns="${columns}" data-label-position="${labelPosition}">`;

        Object.entries(data).forEach(([key, value]) => {
            // Skip null/undefined values
            if (value == null) return;

            // Format the label
            const label = this.formatLabel(key);

            // Format the value based on type
            let formattedValue;
            if (Array.isArray(value)) {
                formattedValue = this._renderArrayAsPills(value, 3, 'inline-pills');
            } else if (typeof value === 'object') {
                formattedValue = this.escapeHtml(JSON.stringify(value));
            } else if (typeof value === 'boolean') {
                formattedValue = value ? 'Yes' : 'No';
            } else {
                formattedValue = this.escapeHtml(String(value));
            }

            html += `
                <div class="metadata-item" data-field="${this.escapeAttr(key)}">
                    ${showLabels ? `<span class="metadata-label">${this.escapeHtml(label)}</span>` : ''}
                    <span class="metadata-value">${formattedValue}</span>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    /**
     * Render a related entity as a clickable link/mini card
     * @param {Object|string} entityRef - Entity reference or ID
     * @param {Object} options - Rendering options
     * @returns {string} HTML string for entity link
     */
    _renderRelatedEntityLink(entityRef, options = {}) {
        const {
            format = 'mini-card', // 'mini-card', 'link', 'badge'
            showIcon = true,
            showType = true
        } = options;

        // Check if reference is unverified/broken
        const isUnverified = this._isUnverifiedReference(entityRef);

        // Handle string ID reference
        if (typeof entityRef === 'string') {
            // Skip completely empty references
            if (!entityRef || entityRef.trim() === '') return '';

            const parts = entityRef.split('_');
            const name = parts.length > 1 ? parts.slice(1).join(' ') : entityRef;
            const formattedName = this.formatLabel(name);

            // Render unverified reference differently
            if (isUnverified) {
                return `
                    <span class="related-entity-link format-${format} unverified-reference"
                          title="This reference could not be verified">
                        ${showIcon ? '<span class="link-icon">⚠️</span>' : ''}
                        <span class="link-name">${this.escapeHtml(formattedName)}</span>
                        <span class="unverified-badge">unverified</span>
                    </span>
                `;
            }

            return `
                <a href="#/${this.escapeAttr(entityRef)}"
                   class="related-entity-link format-${format}"
                   data-entity-ref="${this.escapeAttr(entityRef)}">
                    ${showIcon ? '<span class="link-icon">🔗</span>' : ''}
                    <span class="link-name">${this.escapeHtml(formattedName)}</span>
                </a>
            `;
        }

        // Handle object reference
        if (typeof entityRef === 'object' && entityRef !== null) {
            const {
                id = '',
                name = '',
                entityType = '',
                mythology = '',
                icon = ''
            } = entityRef;

            // Skip empty references
            if (!id && !name) return '';

            const href = mythology && entityType && id
                ? `#/mythology/${this.escapeAttr(mythology)}/${this.escapeAttr(entityType)}/${this.escapeAttr(id)}`
                : `#/${this.escapeAttr(id)}`;

            const typeIcon = showIcon ? this.getEntityTypeIcon(entityType) : '';
            const displayName = name || this.formatLabel(id);

            // Handle unverified object references
            if (isUnverified) {
                if (format === 'mini-card') {
                    return `
                        <span class="related-entity-card unverified-reference"
                              title="This reference could not be verified"
                              data-entity-id="${this.escapeAttr(id)}"
                              data-entity-type="${this.escapeAttr(entityType)}">
                            <span class="mini-card-icon">⚠️</span>
                            <span class="mini-card-content">
                                <span class="mini-card-name">${this.escapeHtml(displayName)}</span>
                                <span class="unverified-badge">unverified</span>
                            </span>
                        </span>
                    `;
                }
                return `
                    <span class="related-entity-link unverified-reference"
                          title="This reference could not be verified">
                        ⚠️ ${this.escapeHtml(displayName)}
                        <span class="unverified-badge">unverified</span>
                    </span>
                `;
            }

            if (format === 'mini-card') {
                return `
                    <a href="${href}"
                       class="related-entity-card"
                       data-entity-id="${this.escapeAttr(id)}"
                       data-entity-type="${this.escapeAttr(entityType)}">
                        <span class="mini-card-icon">${icon ? this.renderIconWithFallback(icon) : typeIcon}</span>
                        <span class="mini-card-content">
                            <span class="mini-card-name">${this.escapeHtml(displayName)}</span>
                            ${showType && entityType ? `<span class="mini-card-type">${this.escapeHtml(this.formatLabel(entityType))}</span>` : ''}
                        </span>
                    </a>
                `;
            }

            if (format === 'badge') {
                return `
                    <a href="${href}"
                       class="related-entity-badge"
                       data-entity-id="${this.escapeAttr(id)}">
                        ${typeIcon} ${this.escapeHtml(displayName)}
                    </a>
                `;
            }

            // Default: link format
            return `
                <a href="${href}"
                   class="related-entity-link"
                   data-entity-id="${this.escapeAttr(id)}">
                    ${typeIcon} ${this.escapeHtml(displayName)}
                </a>
            `;
        }

        return '';
    }

    /**
     * Render external link with new tab indicator
     * @param {string} url - External URL
     * @param {string} text - Link text
     * @returns {string} HTML string for external link
     */
    _renderExternalLink(url, text) {
        if (!url) return '';

        const sanitizedUrl = this.sanitizeUrl(url);
        if (!sanitizedUrl) return '';

        return `
            <a href="${this.escapeAttr(sanitizedUrl)}"
               class="external-link"
               target="_blank"
               rel="noopener noreferrer">
                ${this.escapeHtml(text || url)}
                <span class="external-link-icon" aria-hidden="true">↗</span>
                <span class="sr-only">(opens in new tab)</span>
            </a>
        `;
    }

    /**
     * Render empty state for a field/section
     * @param {string} message - Optional custom message
     * @returns {string} HTML for empty field state
     */
    _renderEmptyFieldState(message = 'No information available') {
        return `<span class="field-empty-state">${this.escapeHtml(message)}</span>`;
    }

    /**
     * Create truncated text with "Show more" toggle
     * @param {string} text - Text to truncate
     * @param {number} maxLines - Maximum lines to show
     * @param {string} uniqueId - Unique identifier for toggle
     * @returns {string} HTML with truncatable text
     */
    _renderTruncatableText(text, maxLines = this.options.maxTruncateLines, uniqueId = null) {
        if (!text || typeof text !== 'string') return '';

        const id = uniqueId || `truncate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return `
            <div class="truncatable-text" data-truncate-id="${id}" data-max-lines="${maxLines}">
                <div class="truncatable-content" style="--max-lines: ${maxLines};">
                    ${this.escapeHtml(text)}
                </div>
                <button class="truncate-toggle"
                        data-action="toggle-truncate"
                        data-target="${id}"
                        aria-expanded="false">
                    <span class="toggle-more">Show more</span>
                    <span class="toggle-less">Show less</span>
                </button>
            </div>
        `;
    }

    // =========================================================================
    // GRID DISPLAY
    // =========================================================================

    /**
     * Render Grid Display (2-wide mobile, 4-wide desktop)
     */
    renderGrid(entities) {
        const cards = entities.map(entity => this.renderGridCard(entity)).join('');

        return `
            <div class="entity-grid universal-grid"
                 data-display-mode="grid"
                 data-entity-count="${entities.length}">
                ${cards}
            </div>
        `;
    }

    renderGridCard(entity) {
        const display = entity.gridDisplay || this.generateGridDisplay(entity);
        const hoverInfo = this.options.enableHover ? this.renderHoverInfo(entity) : '';
        const editIcon = this.renderEditIcon(entity);
        const mythology = this.escapeAttr((entity.mythology || 'unknown').toLowerCase());
        const iconContent = this.renderIconWithFallback(entity.icon);
        const entityId = this.escapeAttr(entity.id);
        const entityType = this.escapeAttr(entity.entityType);

        return `
            <div class="entity-card grid-card card-strict-height"
                 data-entity-id="${entityId}"
                 data-mythology="${mythology}"
                 data-entity-type="${entityType}"
                 data-importance="${this.escapeAttr(entity.importance || 50)}"
                 data-created-by="${this.escapeAttr(entity.createdBy || '')}"
                 tabindex="0"
                 role="article"
                 aria-label="${this.escapeAttr(display.title || entity.name)}">

                ${editIcon}

                ${display.badge ? `<div class="card-badge">${this.escapeHtml(display.badge)}</div>` : ''}

                <div class="card-icon" aria-hidden="true">
                    ${iconContent}
                </div>

                <h3 class="card-title card-title-truncate" aria-label="${this.escapeAttr(display.title || entity.name)}">
                    <a href="#/mythology/${this.escapeAttr(entity.mythology)}/${entityType}/${entityId}"
                       class="entity-link">
                        ${this.escapeHtml(display.title || entity.name)}
                    </a>
                </h3>

                <div class="card-meta">
                    <span class="entity-type-badge" data-type="${entityType}">${this.getEntityTypeIcon(entity.entityType)} ${this.escapeHtml(this.formatLabel(entity.entityType))}</span>
                    <span class="mythology-badge" data-mythology="${mythology}">${this.escapeHtml(this.formatLabel(entity.mythology))}</span>
                </div>

                ${display.subtitle ? `<p class="card-description card-desc-truncate" aria-label="${this.escapeAttr(display.subtitle)}">${this.escapeHtml(this.truncateText(display.subtitle, 120))}</p>` : ''}

                ${display.stats ? this.renderStats(display.stats) : ''}

                ${hoverInfo}
            </div>
        `;
    }

    // =========================================================================
    // TABLE DISPLAY
    // =========================================================================

    /**
     * Render Table Display (sortable, filterable)
     */
    renderTable(entities) {
        // Empty check handled by main render method, but keep for direct calls
        if (entities.length === 0) return this.renderEmptyState('table');

        const firstEntity = entities[0];
        const tableConfig = firstEntity.tableDisplay || this.generateTableDisplay(firstEntity);

        const headers = Object.entries(tableConfig.columns).map(([field, config]) => `
            <th class="${config.sortable ? 'sortable' : ''}"
                data-field="${this.escapeAttr(field)}"
                data-sort-type="${this.escapeAttr(config.type || 'string')}">
                ${this.escapeHtml(config.label)}
                ${config.sortable ? '<span class="sort-indicator"></span>' : ''}
            </th>
        `).join('');

        const rows = entities.map(entity => this.renderTableRow(entity, tableConfig)).join('');

        return `
            <div class="entity-table-container">
                <table class="entity-table"
                       data-display-mode="table"
                       data-default-sort="${this.escapeAttr(tableConfig.defaultSort || 'name')}"
                       data-default-order="${this.escapeAttr(tableConfig.defaultOrder || 'asc')}">
                    <thead>
                        <tr>${headers}</tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderTableRow(entity, tableConfig) {
        const cells = Object.keys(tableConfig.columns).map(field => {
            const value = this.getNestedValue(entity, field);
            const formatted = this.formatTableCell(value, field, entity);
            return `<td data-field="${this.escapeAttr(field)}">${formatted}</td>`;
        }).join('');

        return `
            <tr class="entity-row"
                data-entity-id="${this.escapeAttr(entity.id)}"
                data-mythology="${this.escapeAttr(entity.mythology)}">
                ${cells}
            </tr>
        `;
    }

    formatTableCell(value, field, entity) {
        if (Array.isArray(value)) {
            const escapedItems = value.slice(0, 3).map(v => this.escapeHtml(v));
            return escapedItems.join(', ') + (value.length > 3 ? '...' : '');
        }

        if (field === 'name') {
            const href = `#/mythology/${this.escapeAttr(entity.mythology)}/${this.escapeAttr(entity.entityType)}/${this.escapeAttr(entity.id)}`;
            return `<a href="${href}">${this.escapeHtml(value)}</a>`;
        }

        if (typeof value === 'object' && value !== null) {
            return this.escapeHtml(JSON.stringify(value));
        }

        return this.escapeHtml(value) || '—';
    }

    // =========================================================================
    // LIST DISPLAY
    // =========================================================================

    /**
     * Render List Display (vertical, expandable)
     */
    renderList(entities) {
        const items = entities.map(entity => this.renderListItem(entity)).join('');

        return `
            <ul class="entity-list universal-list"
                data-display-mode="list">
                ${items}
            </ul>
        `;
    }

    renderListItem(entity) {
        const display = entity.listDisplay || this.generateListDisplay(entity);
        const expandable = this.options.enableExpand && display.expandable;
        const iconContent = this.renderIconWithFallback(display.icon || entity.icon || '•');
        const entityId = this.escapeAttr(entity.id);

        return `
            <li class="entity-list-item ${expandable ? 'expandable' : ''}"
                data-entity-id="${entityId}"
                data-mythology="${this.escapeAttr(entity.mythology)}">

                <div class="list-item-main"${expandable ? ` data-expandable="true"` : ''}>
                    <span class="list-icon">${iconContent}</span>
                    <div class="list-content">
                        <div class="list-primary list-item-title card-title-truncate">${this.escapeHtml(display.primary || entity.name)}</div>
                        ${display.secondary ? `<div class="list-secondary list-item-description card-desc-truncate">${this.escapeHtml(display.secondary)}</div>` : ''}
                        ${display.meta ? `<div class="list-meta">${this.escapeHtml(display.meta)}</div>` : ''}
                    </div>
                    ${expandable ? '<span class="expand-indicator">&#9660;</span>' : ''}
                </div>

                ${expandable && display.expandedContent ? `
                    <div class="list-item-expanded">
                        ${this.escapeHtml(display.expandedContent)}
                    </div>
                ` : ''}
            </li>
        `;
    }

    // =========================================================================
    // PANEL DISPLAY
    // =========================================================================

    /**
     * Render Panel Display (detailed cards with sections)
     */
    renderPanel(entities) {
        const panels = entities.map(entity => this.renderPanelCard(entity)).join('');

        return `
            <div class="entity-panels"
                 data-display-mode="panel">
                ${panels}
            </div>
        `;
    }

    renderPanelCard(entity) {
        const display = entity.panelDisplay || this.generatePanelDisplay(entity);
        const layout = this.escapeAttr(display.layout || 'standard');

        // Filter out empty sections
        const validSections = (display.sections || []).filter(section => {
            if (!section) return false;
            if (section.type === 'text' && !section.content) return false;
            if (section.type === 'list' && (!section.items || section.items.length === 0)) return false;
            if (section.type === 'attributes' && (!section.data || Object.keys(section.data).length === 0)) return false;
            if (section.type === 'grid' && (!section.items || section.items.length === 0)) return false;
            return true;
        });

        const sections = validSections.map(section =>
            this.renderPanelSection(section, entity)
        ).join('');

        // Use renderIconWithFallback for consistency
        const iconContent = this.renderIconWithFallback(entity.icon);

        // Render related entities if present
        const relatedEntities = this._renderRelatedEntities(entity);

        return `
            <article class="entity-panel panel-${layout}"
                     data-entity-id="${this.escapeAttr(entity.id)}"
                     data-entity-type="${this.escapeAttr(entity.entityType)}"
                     data-mythology="${this.escapeAttr(entity.mythology)}">

                <header class="panel-header">
                    <div class="panel-icon">${iconContent}</div>
                    <div class="panel-header-content">
                        <h2 class="panel-title">${this.escapeHtml(entity.name)}</h2>
                        ${entity.subtitle ? `<p class="panel-subtitle">${this.escapeHtml(entity.subtitle)}</p>` : ''}
                        <div class="panel-meta">
                            <span class="entity-type-badge">${this.getEntityTypeIcon(entity.entityType)} ${this.escapeHtml(this.formatLabel(entity.entityType))}</span>
                            ${entity.mythology ? `<span class="mythology-badge">${this.escapeHtml(this.formatLabel(entity.mythology))}</span>` : ''}
                        </div>
                    </div>
                </header>

                <div class="panel-body">
                    ${sections || this._renderEmptyFieldState('No content available for this entity.')}
                </div>

                ${relatedEntities}
            </article>
        `;
    }

    /**
     * Render related entities footer
     * @param {Object} entity - Entity with related data
     * @returns {string} HTML for related entities section
     */
    _renderRelatedEntities(entity) {
        const relatedIds = entity.relatedIds || entity.related || [];
        if (!relatedIds || relatedIds.length === 0) return '';

        const maxVisible = 5;
        const visibleRelated = relatedIds.slice(0, maxVisible);
        const hasMore = relatedIds.length > maxVisible;

        const links = visibleRelated.map(ref => this._renderRelatedEntityLink(ref, { format: 'mini-card' })).join('');

        return `
            <footer class="panel-footer">
                <h4 class="panel-footer-title">Related</h4>
                <div class="related-entities">
                    ${links}
                    ${hasMore ? `<span class="related-more">+${relatedIds.length - maxVisible} more</span>` : ''}
                </div>
            </footer>
        `;
    }

    renderPanelSection(section, entity) {
        const renderers = {
            'attributes': this.renderAttributesSection.bind(this),
            'text': this.renderTextSection.bind(this),
            'list': this.renderListSection.bind(this),
            'grid': this.renderGridSection.bind(this),
            'pills': this.renderPillsSection.bind(this)
        };

        const renderer = renderers[section.type] || renderers.text;
        return renderer(section, entity);
    }

    renderAttributesSection(section, entity) {
        const data = section.data || {};
        const nonEmptyData = {};

        // Filter out empty/null values
        Object.entries(data).forEach(([key, value]) => {
            if (value != null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
                nonEmptyData[key] = value;
            }
        });

        if (Object.keys(nonEmptyData).length === 0) return '';

        return `
            <section class="panel-section attributes-section">
                <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                ${this._renderKeyValueGrid(nonEmptyData)}
            </section>
        `;
    }

    renderTextSection(section, entity) {
        if (!section.content) return '';

        const uniqueId = `text-${entity.id}-${section.title}`.replace(/\s+/g, '-').toLowerCase();

        return `
            <section class="panel-section text-section">
                <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                <div class="section-content">
                    ${this._renderTruncatableText(section.content, 5, uniqueId)}
                </div>
            </section>
        `;
    }

    renderListSection(section, entity) {
        if (!section.items || section.items.length === 0) return '';

        return `
            <section class="panel-section list-section">
                <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                <ul class="section-list">
                    ${section.items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}
                </ul>
            </section>
        `;
    }

    renderGridSection(section, entity) {
        if (!section.items || section.items.length === 0) return '';

        return `
            <section class="panel-section grid-section">
                <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                <div class="section-grid">
                    ${section.items.map(item => `
                        <div class="grid-item">${this.escapeHtml(item)}</div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render a section with pills (for domains, symbols, powers, etc.)
     */
    renderPillsSection(section, entity) {
        if (!section.items || section.items.length === 0) return '';

        return `
            <section class="panel-section pills-section">
                <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                ${this._renderArrayAsPills(section.items, this.options.maxVisiblePills)}
            </section>
        `;
    }

    // =========================================================================
    // INLINE DISPLAY
    // =========================================================================

    /**
     * Render Inline Display (mini badges, used in text)
     */
    renderInline(entities) {
        return entities.map(entity => {
            const href = `#/mythology/${this.escapeAttr(entity.mythology)}/${this.escapeAttr(entity.entityType)}/${this.escapeAttr(entity.id)}`;
            const iconContent = this.renderIconWithFallback(entity.icon || '');
            return `
                <a href="${href}"
                   class="entity-inline"
                   data-entity-id="${this.escapeAttr(entity.id)}"
                   title="${this.escapeAttr(entity.description || '')}">
                    <span class="inline-icon">${iconContent}</span>
                    <span class="inline-name">${this.escapeHtml(entity.name)}</span>
                </a>
            `;
        }).join(' ');
    }

    // =========================================================================
    // DISPLAY GENERATION (Fallbacks)
    // =========================================================================

    /**
     * Generate display metadata if not present
     */
    generateGridDisplay(entity) {
        const truncatedDesc = this.truncateText(entity.description, 100);

        return {
            title: entity.name,
            subtitle: entity.subtitle || '',
            image: entity.image || null,
            badge: entity.importance > 80 ? 'Major' : null,
            stats: [
                { label: 'Type', value: entity.entityType || '' },
                { label: 'Mythology', value: entity.mythology || '' }
            ],
            hoverInfo: {
                quick: truncatedDesc,
                domains: entity.domains || entity.corpusSearch?.domains || []
            }
        };
    }

    generateTableDisplay(entity) {
        return {
            columns: {
                name: { label: 'Name', sortable: true },
                mythology: { label: 'Mythology', sortable: true },
                entityType: { label: 'Type', sortable: true },
                importance: { label: 'Importance', sortable: true, type: 'number' }
            },
            defaultSort: 'importance',
            defaultOrder: 'desc'
        };
    }

    generateListDisplay(entity) {
        const truncatedDesc = this.truncateText(entity.description, 150);

        return {
            icon: entity.icon || '•',
            primary: `${entity.name || ''} - ${entity.subtitle || entity.entityType || ''}`,
            secondary: truncatedDesc || null,
            meta: entity.mythology || '',
            expandable: !!entity.longDescription,
            expandedContent: entity.longDescription || entity.description || ''
        };
    }

    generatePanelDisplay(entity) {
        const sections = [];

        // Add description section if present
        if (entity.description || entity.longDescription) {
            sections.push({
                type: 'text',
                title: 'Description',
                content: entity.longDescription || entity.description
            });
        }

        // Add domains as pills if present
        if (entity.domains && entity.domains.length > 0) {
            sections.push({
                type: 'pills',
                title: 'Domains',
                items: entity.domains
            });
        }

        // Add symbols as pills if present
        if (entity.symbols && entity.symbols.length > 0) {
            sections.push({
                type: 'pills',
                title: 'Symbols',
                items: entity.symbols
            });
        }

        // Add powers as pills if present
        if (entity.powers && entity.powers.length > 0) {
            sections.push({
                type: 'pills',
                title: 'Powers',
                items: entity.powers
            });
        }

        // Add attributes section if there are other properties
        const attributes = {};
        ['origin', 'era', 'region', 'importance', 'gender', 'status'].forEach(key => {
            if (entity[key] != null) {
                attributes[key] = entity[key];
            }
        });

        if (Object.keys(attributes).length > 0) {
            sections.push({
                type: 'attributes',
                title: 'Attributes',
                data: attributes
            });
        }

        return {
            layout: 'standard',
            sections: sections
        };
    }

    // =========================================================================
    // SHARED RENDERING HELPERS
    // =========================================================================

    /**
     * Render icon with fallback
     * @param {string} icon - Icon URL, inline SVG, or emoji
     * @returns {string} Safe HTML for icon
     */
    renderIconWithFallback(icon) {
        if (!icon) return '&#10024;'; // Sparkle emoji as HTML entity

        if (typeof icon === 'string') {
            const trimmedIcon = icon.trim();

            // Check if icon is inline SVG - render directly
            if (trimmedIcon.startsWith('<svg')) {
                return `<span class="entity-icon-svg">${icon}</span>`;
            }

            // Check if icon is an image URL
            if (trimmedIcon.includes('.svg') || trimmedIcon.includes('.png') || trimmedIcon.includes('.jpg') || trimmedIcon.includes('.webp') || trimmedIcon.startsWith('http') || trimmedIcon.startsWith('/')) {
                const sanitizedUrl = this.sanitizeUrl(trimmedIcon);
                if (!sanitizedUrl) return '&#10024;';
                return `<img src="${this.escapeAttr(sanitizedUrl)}" alt="" class="entity-icon-img" loading="lazy" onerror="this.parentElement.textContent='&#10024;'">`;
            }
        }

        // For emoji or text icons, escape HTML
        return this.escapeHtml(icon);
    }

    /**
     * Get icon for entity type
     */
    getEntityTypeIcon(entityType) {
        return UniversalDisplayRenderer.ENTITY_TYPE_ICONS[entityType] || '📌';
    }

    renderStats(stats) {
        if (!Array.isArray(stats)) return '';
        return `
            <div class="card-stats">
                ${stats.map(stat => `
                    <div class="stat-item">
                        <span class="stat-label">${this.escapeHtml(String(stat.label || ''))}:</span>
                        <span class="stat-value">${this.escapeHtml(String(stat.value ?? ''))}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderHoverInfo(entity) {
        const hover = entity.gridDisplay?.hoverInfo || entity.hoverInfo;
        if (!hover) return '';

        return `
            <div class="hover-info">
                ${hover.quick ? `<p class="hover-quick">${this.escapeHtml(hover.quick)}</p>` : ''}
                ${hover.domains && Array.isArray(hover.domains) && hover.domains.length > 0 ? `
                    <div class="hover-domains">
                        ${hover.domains.map(d => this.renderHoverableTerm(d, 'domain', entity)).join(' ')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderHoverableTerm(term, type, entity) {
        const escapedTerm = this.escapeHtml(term);
        const escapedType = this.escapeAttr(type);

        if (!this.options.enableCorpusLinks) {
            return `<span class="term-badge">${escapedTerm}</span>`;
        }

        const corpusLink = `/search?term=${encodeURIComponent(term)}&mythology=${encodeURIComponent(entity.mythology || '')}`;

        return `
            <a href="${this.escapeAttr(corpusLink)}"
               class="hoverable-term ${escapedType}-term"
               data-term="${this.escapeAttr(term)}"
               data-type="${escapedType}"
               title="Search corpus for '${this.escapeAttr(term)}'">
                ${escapedTerm}
            </a>
        `;
    }

    /**
     * Render edit icon if user owns entity
     * @param {Object} entity - Entity data
     * @returns {string} Edit icon HTML or empty string
     */
    renderEditIcon(entity) {
        if (!this.canUserEdit(entity)) {
            return '';
        }

        const collection = entity.collection || this.inferCollection(entity.entityType);

        return `
            <button class="edit-icon-btn"
                    data-entity-id="${this.escapeAttr(entity.id)}"
                    data-collection="${this.escapeAttr(collection)}"
                    aria-label="Edit ${this.escapeAttr(entity.name)}"
                    title="Edit this entity">
                &#9998;
            </button>
        `;
    }

    /**
     * Check if current user can edit this entity
     * @param {Object} entity - Entity data
     * @returns {boolean}
     */
    canUserEdit(entity) {
        if (typeof firebase === 'undefined' || !firebase.auth) return false;

        const user = firebase.auth().currentUser;
        if (!user) return false;

        // Check if user created this entity
        return entity.createdBy === user.uid;
    }

    /**
     * Infer Firestore collection from entity type
     * @param {string} entityType - Entity type
     * @returns {string} Collection name
     */
    inferCollection(entityType) {
        const map = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'item': 'items',
            'place': 'places',
            'concept': 'concepts',
            'magic': 'magic',
            'ritual': 'rituals',
            'herb': 'herbs',
            'symbol': 'symbols',
            'text': 'texts'
        };
        return map[entityType] || entityType + 's';
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Truncate text to specified length, avoiding cutting HTML entities
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text with ellipsis if needed
     */
    truncateText(text, maxLength = 100) {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        // Truncate and remove any partial HTML entity at the end
        return text.substring(0, maxLength).replace(/&[^;]*$/, '') + '...';
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    formatLabel(str) {
        if (!str) return '';
        return str.replace(/([A-Z])/g, ' $1')
                  .replace(/_/g, ' ')
                  .replace(/-/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ')
                  .trim();
    }

    /**
     * Escape HTML to prevent XSS in content
     * @param {*} str - String to escape
     * @returns {string} Escaped string safe for HTML content
     */
    escapeHtml(str) {
        if (str == null) return '';
        const strValue = String(str);
        const div = document.createElement('div');
        div.textContent = strValue;
        return div.innerHTML;
    }

    /**
     * Escape string for use in HTML attributes
     * Handles quotes and other special characters
     * @param {*} str - String to escape
     * @returns {string} Escaped string safe for HTML attributes
     */
    escapeAttr(str) {
        if (str == null) return '';
        const strValue = String(str);
        return strValue
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Sanitize a URL to prevent javascript: and data: XSS attacks
     * @param {string} url - URL to sanitize
     * @returns {string} Sanitized URL or empty string if unsafe
     */
    sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim().toLowerCase();
        // Block javascript:, data:, and vbscript: protocols
        if (trimmed.startsWith('javascript:') ||
            trimmed.startsWith('data:') ||
            trimmed.startsWith('vbscript:')) {
            console.warn('[UniversalDisplayRenderer] Blocked potentially dangerous URL:', url);
            return '';
        }
        return url;
    }

    /**
     * Sanitize array items for safe rendering
     * Filters nulls, handles objects, and ensures strings
     * @param {Array} items - Array of items to sanitize
     * @returns {string[]} Array of sanitized string items
     */
    _sanitizeArrayItems(items) {
        if (!Array.isArray(items)) return [];

        return items
            .filter(item => item != null) // Remove null/undefined
            .map(item => {
                // Already a string
                if (typeof item === 'string') {
                    return item.trim();
                }
                // Object - try to extract meaningful value
                if (typeof item === 'object') {
                    // Entity reference with name
                    if (item.name) return String(item.name);
                    // Entity reference with id
                    if (item.id) return this.formatLabel(String(item.id));
                    // Has a label or title
                    if (item.label) return String(item.label);
                    if (item.title) return String(item.title);
                    // Fallback - don't show [object Object]
                    return null;
                }
                // Primitive (number, boolean)
                return String(item);
            })
            .filter(item => item != null && item.length > 0); // Remove empty strings and nulls
    }

    /**
     * Check if an entity reference is unverified/broken
     * @param {Object|string} entityRef - Entity reference to check
     * @returns {boolean} True if unverified
     */
    _isUnverifiedReference(entityRef) {
        if (!entityRef) return true;

        if (typeof entityRef === 'string') {
            return entityRef.includes('_unverified') || entityRef === '';
        }

        if (typeof entityRef === 'object') {
            const id = entityRef.id || '';
            return id.includes('_unverified') || id === '' || entityRef._unverified === true;
        }

        return false;
    }

    /**
     * Attach event listeners to rendered content
     * Call this after inserting rendered HTML into the DOM
     * @param {HTMLElement|string} container - Container element or selector
     */
    attachEventListeners(container) {
        const containerEl = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!containerEl) return;

        // Handle expandable list items via event delegation
        containerEl.addEventListener('click', (e) => {
            // Expandable list items
            const listItemMain = e.target.closest('.list-item-main[data-expandable="true"]');
            if (listItemMain) {
                const listItem = listItemMain.closest('.entity-list-item');
                if (listItem) {
                    listItem.classList.toggle('expanded');
                }
            }

            // Pills expand/collapse
            const pillsButton = e.target.closest('[data-action="expand-pills"], [data-action="collapse-pills"]');
            if (pillsButton) {
                e.preventDefault();
                const targetId = pillsButton.dataset.target;
                const container = containerEl.querySelector(`[data-pills-id="${targetId}"]`);
                if (container) {
                    const isExpanding = pillsButton.dataset.action === 'expand-pills';
                    container.classList.toggle('pills-expanded', isExpanding);
                    pillsButton.setAttribute('aria-expanded', isExpanding);

                    // Toggle hidden pills visibility
                    const hiddenPills = container.querySelector(`[data-pills-hidden="${targetId}"]`);
                    if (hiddenPills) {
                        hiddenPills.setAttribute('aria-hidden', !isExpanding);
                    }
                }
            }

            // Text truncate toggle
            const truncateButton = e.target.closest('[data-action="toggle-truncate"]');
            if (truncateButton) {
                e.preventDefault();
                const targetId = truncateButton.dataset.target;
                const container = containerEl.querySelector(`[data-truncate-id="${targetId}"]`);
                if (container) {
                    const isExpanded = container.classList.toggle('truncate-expanded');
                    truncateButton.setAttribute('aria-expanded', isExpanded);
                }
            }
        });

        // Handle keyboard navigation for expandable items
        containerEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const listItemMain = e.target.closest('.list-item-main[data-expandable="true"]');
                if (listItemMain) {
                    e.preventDefault();
                    const listItem = listItemMain.closest('.entity-list-item');
                    if (listItem) {
                        listItem.classList.toggle('expanded');
                    }
                }
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalDisplayRenderer;
}

// Global export for non-module script loading (browser context)
if (typeof window !== 'undefined') {
    window.UniversalDisplayRenderer = UniversalDisplayRenderer;
    console.log('[UniversalDisplayRenderer] Class registered globally');
}
