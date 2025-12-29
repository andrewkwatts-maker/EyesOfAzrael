/**
 * Universal Display Renderer
 *
 * Renders any entity in any display mode using standardized metadata
 * Supports: grid, table, list, panel, inline, hoverable, expandable
 */

class UniversalDisplayRenderer {
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
     * Main render method - dispatches to specific renderer
     */
    render(entities, displayMode = 'grid', container = null) {
        if (!Array.isArray(entities)) {
            entities = [entities];
        }

        const renderers = {
            'grid': this.renderGrid.bind(this),
            'table': this.renderTable.bind(this),
            'list': this.renderList.bind(this),
            'panel': this.renderPanel.bind(this),
            'inline': this.renderInline.bind(this)
        };

        const renderer = renderers[displayMode] || renderers.grid;
        const html = renderer(entities);

        if (container) {
            if (typeof container === 'string') {
                document.getElementById(container).innerHTML = html;
            } else {
                container.innerHTML = html;
            }
        }

        return html;
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
        const mythology = (entity.mythology || 'unknown').toLowerCase();
        const iconContent = this.renderIconWithFallback(entity.icon);

        return `
            <div class="entity-card grid-card"
                 data-entity-id="${entity.id}"
                 data-mythology="${mythology}"
                 data-entity-type="${entity.entityType}"
                 data-importance="${entity.importance || 50}"
                 data-created-by="${entity.createdBy || ''}"
                 tabindex="0"
                 role="article"
                 aria-label="${this.escapeHtml(display.title || entity.name)}">

                ${editIcon}

                ${display.badge ? `<div class="card-badge">${display.badge}</div>` : ''}

                <div class="card-icon" aria-hidden="true">
                    ${iconContent}
                </div>

                <h3 class="card-title">
                    <a href="#/mythology/${entity.mythology}/${entity.entityType}/${entity.id}"
                       class="entity-link">
                        ${this.escapeHtml(display.title || entity.name)}
                    </a>
                </h3>

                <div class="card-meta">
                    <span class="entity-type-badge" data-type="${entity.entityType}">${this.getEntityTypeIcon(entity.entityType)} ${this.formatLabel(entity.entityType)}</span>
                    <span class="mythology-badge" data-mythology="${mythology}">${this.formatLabel(entity.mythology)}</span>
                </div>

                ${display.subtitle ? `<p class="card-description">${this.escapeHtml(display.subtitle)}</p>` : ''}

                ${display.stats ? this.renderStats(display.stats) : ''}

                ${hoverInfo}
            </div>
        `;
    }

    /**
     * Render icon with fallback
     */
    renderIconWithFallback(icon) {
        if (!icon) return '✨';

        // Check if icon is an image URL
        if (typeof icon === 'string' && (icon.includes('.svg') || icon.includes('.png') || icon.includes('.jpg') || icon.startsWith('http'))) {
            return `<img src="${icon}" alt="" class="entity-icon-img" loading="lazy" onerror="this.parentElement.textContent='✨'">`;
        }

        return icon;
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
        return `
            <div class="card-stats">
                ${stats.map(stat => `
                    <div class="stat-item">
                        <span class="stat-label">${stat.label}:</span>
                        <span class="stat-value">${stat.value}</span>
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
                ${hover.quick ? `<p class="hover-quick">${hover.quick}</p>` : ''}
                ${hover.domains ? `
                    <div class="hover-domains">
                        ${hover.domains.map(d => this.renderHoverableTerm(d, 'domain', entity)).join(' ')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderHoverableTerm(term, type, entity) {
        if (!this.options.enableCorpusLinks) {
            return `<span class="term-badge">${term}</span>`;
        }

        const corpusLink = `/search?term=${encodeURIComponent(term)}&mythology=${entity.mythology}`;

        return `
            <a href="${corpusLink}"
               class="hoverable-term ${type}-term"
               data-term="${term}"
               data-type="${type}"
               title="Search corpus for '${term}'">
                ${term}
            </a>
        `;
    }

    /**
     * Render Table Display (sortable, filterable)
     */
    renderTable(entities) {
        if (entities.length === 0) return '<p>No entities to display</p>';

        const firstEntity = entities[0];
        const tableConfig = firstEntity.tableDisplay || this.generateTableDisplay(firstEntity);

        const headers = Object.entries(tableConfig.columns).map(([field, config]) => `
            <th class="${config.sortable ? 'sortable' : ''}"
                data-field="${field}"
                data-sort-type="${config.type || 'string'}">
                ${config.label}
                ${config.sortable ? '<span class="sort-indicator"></span>' : ''}
            </th>
        `).join('');

        const rows = entities.map(entity => this.renderTableRow(entity, tableConfig)).join('');

        return `
            <div class="entity-table-container">
                <table class="entity-table"
                       data-display-mode="table"
                       data-default-sort="${tableConfig.defaultSort || 'name'}"
                       data-default-order="${tableConfig.defaultOrder || 'asc'}">
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
            return `<td data-field="${field}">${formatted}</td>`;
        }).join('');

        return `
            <tr class="entity-row"
                data-entity-id="${entity.id}"
                data-mythology="${entity.mythology}">
                ${cells}
            </tr>
        `;
    }

    formatTableCell(value, field, entity) {
        if (Array.isArray(value)) {
            return value.slice(0, 3).join(', ') + (value.length > 3 ? '...' : '');
        }

        if (field === 'name') {
            return `<a href="#/mythology/${entity.mythology}/${entity.entityType}/${entity.id}">${value}</a>`;
        }

        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }

        return value || '—';
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

        return `
            <li class="entity-list-item ${expandable ? 'expandable' : ''}"
                data-entity-id="${entity.id}"
                data-mythology="${entity.mythology}">

                <div class="list-item-main" ${expandable ? 'onclick="this.parentElement.classList.toggle(\'expanded\')"' : ''}>
                    <span class="list-icon">${display.icon || entity.icon || '•'}</span>
                    <div class="list-content">
                        <div class="list-primary">${display.primary || entity.name}</div>
                        ${display.secondary ? `<div class="list-secondary">${display.secondary}</div>` : ''}
                        ${display.meta ? `<div class="list-meta">${display.meta}</div>` : ''}
                    </div>
                    ${expandable ? '<span class="expand-indicator">▼</span>' : ''}
                </div>

                ${expandable && display.expandedContent ? `
                    <div class="list-item-expanded">
                        ${display.expandedContent}
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
        const layout = display.layout || 'standard';

        const sections = (display.sections || []).map(section =>
            this.renderPanelSection(section, entity)
        ).join('');

        return `
            <article class="entity-panel panel-${layout}"
                     data-entity-id="${entity.id}"
                     data-mythology="${entity.mythology}">

                <header class="panel-header">
                    <div class="panel-icon">${entity.icon || '✨'}</div>
                    <h2 class="panel-title">${entity.name}</h2>
                    ${entity.subtitle ? `<p class="panel-subtitle">${entity.subtitle}</p>` : ''}
                </header>

                <div class="panel-body">
                    ${sections}
                </div>

                ${entity.relatedIds?.length > 0 ? `
                    <footer class="panel-footer">
                        <h4>Related</h4>
                        <div class="related-entities">
                            ${entity.relatedIds.slice(0, 5).map(id =>
                                `<a href="#/${id}" class="related-link">${id.split('_')[1]}</a>`
                            ).join('')}
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
                <h3 class="section-title">${section.title}</h3>
                <div class="attributes-grid">
                    ${Object.entries(section.data || {}).map(([key, value]) => `
                        <div class="attribute-item">
                            <span class="attribute-label">${this.formatLabel(key)}:</span>
                            <span class="attribute-value">
                                ${Array.isArray(value) ?
                                    value.map(v => this.renderHoverableTerm(v, key, entity)).join(', ') :
                                    value
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
                <h3 class="section-title">${section.title}</h3>
                <div class="section-content">
                    ${section.content}
                </div>
            </section>
        `;
    }

    renderListSection(section, entity) {
        return `
            <section class="panel-section list-section">
                <h3 class="section-title">${section.title}</h3>
                <ul class="section-list">
                    ${(section.items || []).map(item => `<li>${item}</li>`).join('')}
                </ul>
            </section>
        `;
    }

    renderGridSection(section, entity) {
        return `
            <section class="panel-section grid-section">
                <h3 class="section-title">${section.title}</h3>
                <div class="section-grid">
                    ${(section.items || []).map(item => `
                        <div class="grid-item">${item}</div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render Inline Display (mini badges, used in text)
     */
    renderInline(entities) {
        return entities.map(entity => `
            <a href="#/mythology/${entity.mythology}/${entity.entityType}/${entity.id}"
               class="entity-inline"
               data-entity-id="${entity.id}"
               title="${entity.description}">
                <span class="inline-icon">${entity.icon}</span>
                <span class="inline-name">${entity.name}</span>
            </a>
        `).join(' ');
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
                    data-entity-id="${entity.id}"
                    data-collection="${collection}"
                    aria-label="Edit ${entity.name}"
                    title="Edit this entity">
                ✏️
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
     * Escape HTML to prevent XSS
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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
