/**
 * Universal Asset Renderer
 *
 * Renders any Firebase asset in 5 different modes:
 * 1. Hyperlink - Inline link with dropdown options
 * 2. Expandable Row - List item that expands to show details
 * 3. Panel Card - Card in a grid layout
 * 4. Subsection Panel - Collapsible section with nested children
 * 5. Full Page - Complete dedicated page
 */

class UniversalAssetRenderer {
    constructor(db) {
        this.db = db;
        this.cache = new Map();
    }

    /**
     * Render an asset in the specified mode
     * @param {Object|string} asset - Asset object or asset ID
     * @param {string} mode - Rendering mode: hyperlink, expandableRow, panelCard, subsection, fullPage
     * @param {HTMLElement} container - Container to render into
     * @param {Object} options - Additional rendering options
     */
    async render(asset, mode, container, options = {}) {
        // Load asset if ID provided
        if (typeof asset === 'string') {
            asset = await this.loadAsset(asset);
        }

        if (!asset) {
            container.innerHTML = '<p class="error">Asset not found</p>';
            return;
        }

        // Check if mode is enabled for this asset
        if (asset.rendering && asset.rendering.modes && !asset.rendering.modes[mode]) {
            console.warn(`[Asset Renderer] Mode "${mode}" not enabled for asset ${asset.id}`);
            mode = asset.rendering.defaultMode || 'panelCard';
        }

        // Render based on mode
        switch (mode) {
            case 'hyperlink':
                container.innerHTML = this.renderHyperlink(asset, options);
                this.attachHyperlinkListeners(container, asset);
                break;

            case 'expandableRow':
                container.innerHTML = this.renderExpandableRow(asset, options);
                this.attachExpandableRowListeners(container, asset);
                break;

            case 'panelCard':
                container.innerHTML = this.renderPanelCard(asset, options);
                this.attachPanelCardListeners(container, asset);
                break;

            case 'subsection':
                container.innerHTML = await this.renderSubsection(asset, options);
                this.attachSubsectionListeners(container, asset);
                break;

            case 'fullPage':
                container.innerHTML = await this.renderFullPage(asset, options);
                this.attachFullPageListeners(container, asset);
                break;

            default:
                console.error(`[Asset Renderer] Unknown rendering mode: ${mode}`);
                container.innerHTML = this.renderPanelCard(asset, options);
        }
    }

    /**
     * Load asset from Firebase
     */
    async loadAsset(assetId) {
        // Check cache
        if (this.cache.has(assetId)) {
            return this.cache.get(assetId);
        }

        try {
            // Try to find asset in any collection
            const collections = ['deities', 'mythologies', 'items', 'places', 'theories', 'archetypes', 'submissions'];

            for (const collection of collections) {
                const doc = await this.db.collection(collection).doc(assetId).get();
                if (doc.exists) {
                    const asset = { id: doc.id, ...doc.data() };
                    this.cache.set(assetId, asset);
                    return asset;
                }
            }

            console.warn(`[Asset Renderer] Asset not found: ${assetId}`);
            return null;

        } catch (error) {
            console.error(`[Asset Renderer] Error loading asset ${assetId}:`, error);
            return null;
        }
    }

    // ============================================
    // MODE 1: HYPERLINK
    // ============================================

    renderHyperlink(asset, options = {}) {
        const config = asset.rendering?.hyperlink || {};
        const showIcon = config.showIcon !== false;
        const showDropdown = config.dropdownOptions && config.dropdownOptions.length > 0;

        const icon = showIcon ? (asset.icon || '📄') : '';
        const name = asset.name || asset.title || 'Untitled';
        const route = this.getAssetRoute(asset);

        return `
            <span class="asset-hyperlink" data-asset-id="${asset.id}" data-asset-type="${asset.type}">
                <a href="${route}" class="asset-link">
                    ${icon ? `<span class="asset-icon">${icon}</span>` : ''}
                    <span class="asset-name">${name}</span>
                </a>
                ${showDropdown ? `
                    <button class="asset-dropdown-trigger" aria-label="More options">▼</button>
                    <div class="asset-dropdown-menu hidden">
                        ${this.renderDropdownOptions(asset, config.dropdownOptions)}
                    </div>
                ` : ''}
            </span>
        `;
    }

    renderDropdownOptions(asset, options) {
        return options.map(option => {
            const route = option.route ? option.route.replace('{type}', asset.type).replace('{id}', asset.id) : '#';
            return `
                <button class="dropdown-option" data-action="${option.action}" data-route="${route}">
                    ${option.icon} ${option.label}
                </button>
            `;
        }).join('');
    }

    attachHyperlinkListeners(container, asset) {
        // Dropdown toggle
        const trigger = container.querySelector('.asset-dropdown-trigger');
        const menu = container.querySelector('.asset-dropdown-menu');

        if (trigger && menu) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                menu.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                menu.classList.add('hidden');
            });

            // Dropdown options
            const options = menu.querySelectorAll('.dropdown-option');
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = option.dataset.action;
                    const route = option.dataset.route;

                    this.handleDropdownAction(action, route, asset);
                    menu.classList.add('hidden');
                });
            });
        }
    }

    handleDropdownAction(action, route, asset) {
        switch (action) {
            case 'navigate':
                window.location.hash = route;
                break;
            case 'expand':
                this.showQuickView(asset);
                break;
            case 'showReferences':
                this.showReferences(asset);
                break;
            case 'corpusSearch':
                this.openCorpusSearch(asset);
                break;
            default:
                console.log(`[Asset Renderer] Unknown action: ${action}`);
        }
    }

    // ============================================
    // MODE 2: EXPANDABLE ROW
    // ============================================

    renderExpandableRow(asset, options = {}) {
        const config = asset.rendering?.expandableRow || {};
        const showPreview = config.showPreview !== false;
        const previewFields = config.previewFields || ['name', 'description'];

        const icon = asset.icon || '📄';
        const name = asset.name || asset.title || 'Untitled';
        const description = asset.description || '';

        return `
            <div class="asset-expandable-row" data-asset-id="${asset.id}" data-asset-type="${asset.type}">
                <div class="row-header">
                    <button class="expand-toggle" aria-label="Expand">▶</button>
                    ${icon ? `<span class="row-icon">${icon}</span>` : ''}
                    <span class="row-name">${name}</span>
                    ${showPreview && description ? `<span class="row-preview">${description}</span>` : ''}
                </div>
                <div class="row-content collapsed">
                    ${this.renderRowContent(asset, config.expandedFields)}
                </div>
            </div>
        `;
    }

    renderRowContent(asset, fields = []) {
        let html = '';

        if (fields.includes('summary') && asset.summary) {
            html += `<div class="field-summary">${asset.summary}</div>`;
        }

        if (fields.includes('attributes') && asset.attributes) {
            html += `<div class="field-attributes">${this.renderAttributes(asset.attributes)}</div>`;
        }

        if (fields.includes('relationships') && asset.relationships) {
            html += `<div class="field-relationships">${this.renderRelationships(asset.relationships)}</div>`;
        }

        if (fields.includes('metadata') && asset.metadata) {
            html += `<div class="field-metadata">${this.renderMetadata(asset.metadata)}</div>`;
        }

        return html || `<p>No additional details available</p>`;
    }

    attachExpandableRowListeners(container, asset) {
        const toggle = container.querySelector('.expand-toggle');
        const content = container.querySelector('.row-content');

        if (toggle && content) {
            toggle.addEventListener('click', () => {
                const isCollapsed = content.classList.contains('collapsed');

                if (isCollapsed) {
                    content.classList.remove('collapsed');
                    content.classList.add('expanded');
                    toggle.textContent = '▼';
                    toggle.setAttribute('aria-label', 'Collapse');
                } else {
                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    toggle.textContent = '▶';
                    toggle.setAttribute('aria-label', 'Expand');
                }
            });
        }
    }

    // ============================================
    // MODE 3: PANEL CARD
    // ============================================

    renderPanelCard(asset, options = {}) {
        const config = asset.rendering?.panelCard || {};
        const size = config.size || 'medium';
        const layout = config.layout || 'standard';
        const showFields = config.showFields || ['icon', 'name', 'description'];

        const icon = asset.icon || '📄';
        const name = asset.name || asset.title || 'Untitled';
        const description = asset.description || '';
        const image = asset.thumbnail || asset.image;
        const route = this.getAssetRoute(asset);
        const badge = config.badge || asset.metadata?.status;

        return `
            <a href="${route}"
               class="panel-card panel-card-${size} panel-card-${layout}"
               data-asset-id="${asset.id}"
               data-asset-type="${asset.type}">
                ${image ? `
                    <div class="card-image">
                        <img src="${image}" alt="${name}" loading="lazy">
                    </div>
                ` : ''}
                ${showFields.includes('icon') && icon ? `
                    <div class="card-icon">${icon}</div>
                ` : ''}
                ${showFields.includes('name') ? `
                    <h3 class="card-title">${name}</h3>
                ` : ''}
                ${showFields.includes('description') && description ? `
                    <p class="card-description">${description}</p>
                ` : ''}
                ${badge ? `
                    <span class="card-badge">${badge}</span>
                ` : ''}
                ${asset.metadata?.tags ? `
                    <div class="card-tags">
                        ${asset.metadata.tags.slice(0, 3).map(tag =>
                            `<span class="tag">${tag}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </a>
        `;
    }

    attachPanelCardListeners(container, asset) {
        // Cards already have href, so they navigate automatically
        // Can add additional listeners for analytics, etc.
        const card = container.querySelector('.panel-card');
        if (card) {
            card.addEventListener('click', (e) => {
                console.log(`[Asset Renderer] Card clicked: ${asset.id}`);
            });
        }
    }

    // ============================================
    // MODE 4: SUBSECTION PANEL
    // ============================================

    async renderSubsection(asset, options = {}) {
        const config = asset.rendering?.subsection || {};
        const collapsible = config.collapsible !== false;
        const defaultState = config.defaultState || 'expanded';
        const showChildCount = config.showChildCount !== false;

        const icon = asset.icon || '📄';
        const name = asset.name || asset.title || 'Untitled';

        // Load children if they exist
        const children = await this.loadChildren(asset);
        const childCount = children.length;

        return `
            <div class="subsection-panel" data-asset-id="${asset.id}" data-asset-type="${asset.type}">
                <div class="subsection-header">
                    ${collapsible ? `<button class="collapse-toggle" aria-label="Toggle">▼</button>` : ''}
                    <h3 class="subsection-title">
                        ${icon ? `<span class="subsection-icon">${icon}</span>` : ''}
                        ${name}
                    </h3>
                    ${showChildCount && childCount > 0 ? `
                        <span class="child-count">(${childCount})</span>
                    ` : ''}
                </div>
                <div class="subsection-content ${defaultState === 'collapsed' ? 'collapsed' : 'expanded'}">
                    ${asset.summary || asset.description || ''}
                    ${children.length > 0 ? `
                        <div class="subsection-children">
                            ${this.renderChildren(children, config.childrenLayout)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async loadChildren(asset) {
        if (!asset.relationships || !asset.relationships.childIds) {
            return [];
        }

        const childPromises = asset.relationships.childIds.map(id => this.loadAsset(id));
        const children = await Promise.all(childPromises);
        return children.filter(child => child !== null);
    }

    renderChildren(children, layout = 'grid') {
        if (layout === 'grid') {
            return `
                <div class="children-grid">
                    ${children.map(child => this.renderPanelCard(child, { size: 'small' })).join('')}
                </div>
            `;
        } else if (layout === 'list') {
            return `
                <ul class="children-list">
                    ${children.map(child => `
                        <li>${this.renderHyperlink(child)}</li>
                    `).join('')}
                </ul>
            `;
        } else {
            return '';
        }
    }

    attachSubsectionListeners(container, asset) {
        const toggle = container.querySelector('.collapse-toggle');
        const content = container.querySelector('.subsection-content');

        if (toggle && content) {
            toggle.addEventListener('click', () => {
                const isCollapsed = content.classList.contains('collapsed');

                if (isCollapsed) {
                    content.classList.remove('collapsed');
                    content.classList.add('expanded');
                    toggle.textContent = '▼';
                } else {
                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    toggle.textContent = '▶';
                }
            });
        }
    }

    // ============================================
    // MODE 5: FULL PAGE
    // ============================================

    async renderFullPage(asset, options = {}) {
        const config = asset.rendering?.fullPage || {};
        const sections = config.sections || ['header', 'description', 'attributes', 'relationships'];
        const sidebar = config.sidebar || { enabled: false };

        const icon = asset.icon || '📄';
        const name = asset.name || asset.title || 'Untitled';
        const subtitle = asset.subtitle || '';

        let html = `
            <div class="asset-page" data-asset-id="${asset.id}" data-asset-type="${asset.type}">
                ${sections.includes('header') ? `
                    <header class="page-header">
                        <div class="header-icon">${icon}</div>
                        <h1 class="page-title">${name}</h1>
                        ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
                    </header>
                ` : ''}

                <div class="page-layout ${sidebar.enabled ? 'with-sidebar' : ''}">
                    ${sidebar.enabled ? `
                        <aside class="page-sidebar sidebar-${sidebar.position || 'right'}">
                            ${await this.renderSidebar(asset, sidebar)}
                        </aside>
                    ` : ''}

                    <main class="page-content">
                        ${await this.renderPageSections(asset, sections)}
                    </main>
                </div>
            </div>
        `;

        return html;
    }

    async renderPageSections(asset, sections) {
        let html = '';

        for (const section of sections) {
            switch (section) {
                case 'description':
                    if (asset.description || asset.summary || asset.content) {
                        html += `
                            <section class="section-description">
                                <h2>Description</h2>
                                ${asset.content || asset.summary || asset.description}
                            </section>
                        `;
                    }
                    break;

                case 'attributes':
                    if (asset.attributes) {
                        html += `
                            <section class="section-attributes">
                                <h2>Attributes</h2>
                                ${this.renderAttributes(asset.attributes)}
                            </section>
                        `;
                    }
                    break;

                case 'relationships':
                    if (asset.relationships) {
                        html += `
                            <section class="section-relationships">
                                <h2>Relationships</h2>
                                ${await this.renderRelationships(asset.relationships)}
                            </section>
                        `;
                    }
                    break;

                case 'references':
                    if (asset.relationships?.references) {
                        html += `
                            <section class="section-references">
                                <h2>References</h2>
                                ${this.renderReferences(asset.relationships.references)}
                            </section>
                        `;
                    }
                    break;

                case 'related':
                    if (asset.relationships?.relatedIds) {
                        const related = await this.loadRelatedAssets(asset.relationships.relatedIds);
                        html += `
                            <section class="section-related">
                                <h2>Related</h2>
                                <div class="related-grid">
                                    ${related.map(r => this.renderPanelCard(r, { size: 'small' })).join('')}
                                </div>
                            </section>
                        `;
                    }
                    break;
            }
        }

        return html;
    }

    async renderSidebar(asset, config) {
        const content = config.content || ['toc', 'related'];
        let html = '';

        if (content.includes('toc')) {
            html += `<div class="sidebar-toc"><h3>Contents</h3><!-- TOC --></div>`;
        }

        if (content.includes('related') && asset.relationships?.relatedIds) {
            const related = await this.loadRelatedAssets(asset.relationships.relatedIds.slice(0, 3));
            html += `
                <div class="sidebar-related">
                    <h3>Related</h3>
                    ${related.map(r => this.renderHyperlink(r)).join('<br>')}
                </div>
            `;
        }

        return html;
    }

    attachFullPageListeners(container, asset) {
        // Add scroll listeners, etc.
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    getAssetRoute(asset) {
        const type = asset.type || 'asset';
        const id = asset.id;

        const routeMap = {
            deity: `#/mythology/${asset.relationships?.mythology}/deities/${id}`,
            mythology: `#/mythology/${id}`,
            item: `#/item/${id}`,
            place: `#/place/${id}`,
            theory: `#/theory/${id}`,
            archetype: `#/archetype/${id}`,
            submission: `#/submission/${id}`
        };

        return routeMap[type] || `#/${type}/${id}`;
    }

    renderAttributes(attributes) {
        return `
            <dl class="attributes-list">
                ${Object.entries(attributes).map(([key, value]) => `
                    <dt>${this.formatKey(key)}</dt>
                    <dd>${Array.isArray(value) ? value.join(', ') : value}</dd>
                `).join('')}
            </dl>
        `;
    }

    async renderRelationships(relationships) {
        let html = '<dl class="relationships-list">';

        if (relationships.parentId) {
            const parent = await this.loadAsset(relationships.parentId);
            html += `<dt>Parent</dt><dd>${parent ? this.renderHyperlink(parent) : relationships.parentId}</dd>`;
        }

        if (relationships.relatedIds && relationships.relatedIds.length > 0) {
            const related = await this.loadRelatedAssets(relationships.relatedIds);
            html += `<dt>Related</dt><dd>${related.map(r => this.renderHyperlink(r)).join(', ')}</dd>`;
        }

        html += '</dl>';
        return html;
    }

    renderReferences(references) {
        return `
            <ul class="references-list">
                ${references.map(ref => `
                    <li>
                        <a href="${ref.url || '#'}" target="_blank" rel="noopener">
                            ${ref.label || ref.title || 'Reference'}
                        </a>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    renderMetadata(metadata) {
        return `
            <dl class="metadata-list">
                ${metadata.category ? `<dt>Category</dt><dd>${metadata.category}</dd>` : ''}
                ${metadata.tags ? `<dt>Tags</dt><dd>${metadata.tags.join(', ')}</dd>` : ''}
                ${metadata.status ? `<dt>Status</dt><dd>${metadata.status}</dd>` : ''}
            </dl>
        `;
    }

    async loadRelatedAssets(ids) {
        const promises = ids.map(id => this.loadAsset(id));
        const assets = await Promise.all(promises);
        return assets.filter(a => a !== null);
    }

    formatKey(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    // Quick view modal
    showQuickView(asset) {
        if (typeof EntityQuickViewModal !== 'undefined' && this.db) {
            const modal = new EntityQuickViewModal(this.db);
            modal.open(asset.id, asset.type || 'assets', asset.relationships?.mythology || 'unknown');
        } else {
            console.warn('[Asset Renderer] EntityQuickViewModal not available');
            // Fallback to navigation
            window.location.hash = this.getAssetRoute(asset);
        }
    }

    showReferences(asset) {
        // Show references in modal or navigate to references section
        if (asset.relationships?.references && asset.relationships.references.length > 0) {
            // Navigate to full page with references anchor
            window.location.hash = this.getAssetRoute(asset) + '#references';
        } else {
            console.log('[Asset Renderer] No references available for:', asset.id);
        }
    }

    openCorpusSearch(asset) {
        // Navigate to search page with entity name pre-filled
        const searchQuery = asset.name || asset.title || '';
        window.location.hash = `#/search?q=${encodeURIComponent(searchQuery)}`;
    }

    clearCache() {
        this.cache.clear();
    }
}

// Make globally available
window.UniversalAssetRenderer = UniversalAssetRenderer;
