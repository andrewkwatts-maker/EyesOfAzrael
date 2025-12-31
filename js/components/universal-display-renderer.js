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
 */

class UniversalDisplayRenderer {
    /**
     * Supported display modes
     * @type {string[]}
     */
    static SUPPORTED_MODES = ['grid', 'table', 'list', 'panel', 'inline'];

    constructor(options = {}) {
        this.options = {
            defaultDisplayMode: 'grid',
            enableHover: true,
            enableExpand: true,
            enableCorpusLinks: true,
            theme: 'auto',
            ...options
        };
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
            <div class="entity-empty-state" data-display-mode="${this.escapeHtml(displayMode)}">
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
            <div class="entity-card grid-card"
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

                <h3 class="card-title">
                    <a href="#/mythology/${this.escapeAttr(entity.mythology)}/${entityType}/${entityId}"
                       class="entity-link">
                        ${this.escapeHtml(display.title || entity.name)}
                    </a>
                </h3>

                <div class="card-meta">
                    <span class="entity-type-badge" data-type="${entityType}">${this.getEntityTypeIcon(entity.entityType)} ${this.escapeHtml(this.formatLabel(entity.entityType))}</span>
                    <span class="mythology-badge" data-mythology="${mythology}">${this.escapeHtml(this.formatLabel(entity.mythology))}</span>
                </div>

                ${display.subtitle ? `<p class="card-description">${this.escapeHtml(display.subtitle)}</p>` : ''}

                ${display.stats ? this.renderStats(display.stats) : ''}

                ${hoverInfo}
            </div>
        `;
    }

    /**
     * Render icon with fallback
     * @param {string} icon - Icon URL or emoji
     * @returns {string} Safe HTML for icon
     */
    renderIconWithFallback(icon) {
        if (!icon) return '&#10024;'; // Sparkle emoji as HTML entity

        // Check if icon is an image URL
        if (typeof icon === 'string' && (icon.includes('.svg') || icon.includes('.png') || icon.includes('.jpg') || icon.startsWith('http'))) {
            const sanitizedUrl = this.sanitizeUrl(icon);
            if (!sanitizedUrl) return '&#10024;';
            return `<img src="${this.escapeAttr(sanitizedUrl)}" alt="" class="entity-icon-img" loading="lazy" onerror="this.parentElement.textContent='&#10024;'">`;
        }

        // For emoji or text icons, escape HTML
        return this.escapeHtml(icon);
    }

    /**
     * Get icon for entity type
     */
    getEntityTypeIcon(entityType) {
        const icons = {
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
            text: '📜'
        };
        return icons[entityType] || '📌';
    }

    renderStats(stats) {
        if (!Array.isArray(stats)) return '';
        return `
            <div class="card-stats">
                ${stats.map(stat => `
                    <div class="stat-item">
                        <span class="stat-label">${this.escapeHtml(stat.label)}:</span>
                        <span class="stat-value">${this.escapeHtml(stat.value)}</span>
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
                ${hover.domains && Array.isArray(hover.domains) ? `
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
        const iconContent = this.escapeHtml(display.icon || entity.icon || '•');

        return `
            <li class="entity-list-item ${expandable ? 'expandable' : ''}"
                data-entity-id="${this.escapeAttr(entity.id)}"
                data-mythology="${this.escapeAttr(entity.mythology)}">

                <div class="list-item-main" ${expandable ? 'onclick="this.parentElement.classList.toggle(\'expanded\')"' : ''}>
                    <span class="list-icon">${iconContent}</span>
                    <div class="list-content">
                        <div class="list-primary">${this.escapeHtml(display.primary || entity.name)}</div>
                        ${display.secondary ? `<div class="list-secondary">${this.escapeHtml(display.secondary)}</div>` : ''}
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

        const sections = (display.sections || []).map(section =>
            this.renderPanelSection(section, entity)
        ).join('');

        const iconContent = this.escapeHtml(entity.icon || '&#10024;');

        return `
            <article class="entity-panel panel-${layout}"
                     data-entity-id="${this.escapeAttr(entity.id)}"
                     data-mythology="${this.escapeAttr(entity.mythology)}">

                <header class="panel-header">
                    <div class="panel-icon">${iconContent}</div>
                    <h2 class="panel-title">${this.escapeHtml(entity.name)}</h2>
                    ${entity.subtitle ? `<p class="panel-subtitle">${this.escapeHtml(entity.subtitle)}</p>` : ''}
                </header>

                <div class="panel-body">
                    ${sections}
                </div>

                ${entity.relatedIds?.length > 0 ? `
                    <footer class="panel-footer">
                        <h4>Related</h4>
                        <div class="related-entities">
                            ${entity.relatedIds.slice(0, 5).map(id => {
                                const escapedId = this.escapeAttr(id);
                                const displayName = this.escapeHtml((id.split('_')[1] || id));
                                return `<a href="#/${escapedId}" class="related-link">${displayName}</a>`;
                            }).join('')}
                        </div>
                    </footer>
                ` : ''}
            </article>
        `;
    }

    renderPanelSection(section, entity) {
        const renderers = {
            'attributes': this.renderAttributesSection.bind(this),
            'text': this.renderTextSection.bind(this),
            'list': this.renderListSection.bind(this),
            'grid': this.renderGridSection.bind(this)
        };

        const renderer = renderers[section.type] || renderers.text;
        return renderer(section, entity);
    }

    renderAttributesSection(section, entity) {
        return `
            <section class="panel-section attributes-section">
                <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                <div class="attributes-grid">
                    ${Object.entries(section.data || {}).map(([key, value]) => `
                        <div class="attribute-item">
                            <span class="attribute-label">${this.escapeHtml(this.formatLabel(key))}:</span>
                            <span class="attribute-value">
                                ${Array.isArray(value) ?
                                    value.map(v => this.renderHoverableTerm(v, key, entity)).join(', ') :
                                    this.escapeHtml(value)
                                }
                            </span>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    renderTextSection(section, entity) {
        return `
            <section class="panel-section text-section">
                <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                <div class="section-content">
                    ${this.escapeHtml(section.content)}
                </div>
            </section>
        `;
    }

    renderListSection(section, entity) {
        return `
            <section class="panel-section list-section">
                <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                <ul class="section-list">
                    ${(section.items || []).map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}
                </ul>
            </section>
        `;
    }

    renderGridSection(section, entity) {
        return `
            <section class="panel-section grid-section">
                <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                <div class="section-grid">
                    ${(section.items || []).map(item => `
                        <div class="grid-item">${this.escapeHtml(item)}</div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render Inline Display (mini badges, used in text)
     */
    renderInline(entities) {
        return entities.map(entity => {
            const href = `#/mythology/${this.escapeAttr(entity.mythology)}/${this.escapeAttr(entity.entityType)}/${this.escapeAttr(entity.id)}`;
            return `
                <a href="${href}"
                   class="entity-inline"
                   data-entity-id="${this.escapeAttr(entity.id)}"
                   title="${this.escapeAttr(entity.description || '')}">
                    <span class="inline-icon">${this.escapeHtml(entity.icon || '')}</span>
                    <span class="inline-name">${this.escapeHtml(entity.name)}</span>
                </a>
            `;
        }).join(' ');
    }

    /**
     * Generate display metadata if not present
     */
    generateGridDisplay(entity) {
        return {
            title: entity.name,
            subtitle: entity.subtitle || '',
            image: entity.image || null,
            badge: entity.importance > 80 ? 'Major' : null,
            stats: [
                { label: 'Type', value: entity.entityType },
                { label: 'Mythology', value: entity.mythology }
            ],
            hoverInfo: {
                quick: entity.description?.substring(0, 100) + '...',
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
        return {
            icon: entity.icon || '•',
            primary: `${entity.name} - ${entity.subtitle || entity.entityType}`,
            secondary: entity.description?.substring(0, 150),
            meta: entity.mythology,
            expandable: !!entity.longDescription,
            expandedContent: entity.longDescription || entity.description
        };
    }

    generatePanelDisplay(entity) {
        return {
            layout: 'standard',
            sections: [
                {
                    type: 'text',
                    title: 'Description',
                    content: entity.description || entity.longDescription
                },
                entity.domains || entity.symbols ? {
                    type: 'attributes',
                    title: 'Attributes',
                    data: {
                        domains: entity.domains,
                        symbols: entity.symbols
                    }
                } : null
            ].filter(Boolean)
        };
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

    /**
     * Utility methods
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    formatLabel(str) {
        if (!str) return '';
        return str.replace(/([A-Z])/g, ' $1')
                  .replace(/_/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
