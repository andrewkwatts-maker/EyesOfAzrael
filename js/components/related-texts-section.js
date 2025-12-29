/**
 * Related Texts Section Component
 *
 * Renders corpus search queries as a section on entity pages.
 * Integrates with CorpusQueryService to load and display
 * both standard and user-submitted corpus queries.
 *
 * Part of the Corpus Search System (Agent 6 - Entity Integration)
 *
 * @author Agent 6 - Entity Page Integration
 * @version 1.0.0
 */

class RelatedTextsSection {
    /**
     * Create a RelatedTextsSection instance
     * @param {HTMLElement} container - Container element for the section
     * @param {Object} entity - Entity data object
     * @param {Object} options - Configuration options
     */
    constructor(container, entity, options = {}) {
        this.container = container;
        this.entity = entity;
        this.options = {
            showUserQueries: true,
            maxQueries: 10,
            autoLoadFirst: false,
            showCorpusExplorerLink: true,
            collapsible: true,
            ...options
        };

        // Service instances
        this.queryService = null;

        // State
        this.queries = [];
        this.loadedResults = new Map();
        this.isLoading = false;
    }

    /**
     * Initialize and render the section
     */
    async init() {
        // Wait for CorpusQueryService
        await this.initService();

        // Render initial structure
        this.renderSkeleton();

        // Load queries
        await this.loadQueries();
    }

    /**
     * Initialize the query service
     */
    async initService() {
        // Check if global instance exists
        if (window.corpusQueryService) {
            this.queryService = window.corpusQueryService;
        } else if (typeof CorpusQueryService !== 'undefined') {
            this.queryService = new CorpusQueryService();
        }

        // Initialize service if needed
        if (this.queryService && !this.queryService.initialized) {
            try {
                await this.queryService.init();
            } catch (error) {
                console.warn('Could not initialize CorpusQueryService:', error);
            }
        }
    }

    /**
     * Render the section skeleton/loading state
     */
    renderSkeleton() {
        const sectionId = `related-texts-${this.entity.id || 'section'}`;

        this.container.innerHTML = `
            <section class="corpus-search-section related-texts-section" id="${sectionId}">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="margin: 0; color: var(--color-primary); display: flex; align-items: center; gap: 0.5rem;">
                            <span>📚</span>
                            <span>Primary Source References</span>
                        </h3>
                        <p style="margin: 0.25rem 0 0; font-size: 0.9rem; opacity: 0.7;">
                            Ancient texts and scholarly references for ${this.escapeHtml(this.entity.name)}
                        </p>
                    </div>
                    <div class="section-actions" style="display: flex; gap: 0.5rem;">
                        ${this.options.showCorpusExplorerLink ? `
                            <a href="/corpus-explorer.html?term=${encodeURIComponent(this.entity.name)}"
                               class="btn-secondary"
                               style="font-size: 0.85rem; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; background: var(--color-surface); color: var(--color-text-primary);">
                                🔍 Search for more
                            </a>
                        ` : ''}
                    </div>
                </div>

                <div class="queries-loading" id="${sectionId}-loading" style="text-align: center; padding: 2rem;">
                    <div class="loading-spinner" style="display: inline-block; width: 24px; height: 24px; border: 2px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 0.5rem; opacity: 0.7;">Loading corpus references...</p>
                </div>

                <div class="queries-container" id="${sectionId}-container" style="display: none;">
                    <div class="standard-queries" id="${sectionId}-standard"></div>
                    ${this.options.showUserQueries ? `
                        <div class="user-queries-section" id="${sectionId}-user" style="margin-top: 1.5rem; display: none;">
                            <div class="user-queries-header" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border);">
                                <span style="font-size: 0.85rem; color: var(--color-secondary); font-weight: 600;">Community Queries</span>
                                <span class="user-query-count" style="font-size: 0.75rem; opacity: 0.6;"></span>
                            </div>
                            <div class="user-queries-list"></div>
                        </div>
                    ` : ''}
                </div>

                <div class="queries-empty" id="${sectionId}-empty" style="display: none; text-align: center; padding: 2rem; opacity: 0.7;">
                    <p>No corpus references available for this entity yet.</p>
                    <a href="/corpus-explorer.html?term=${encodeURIComponent(this.entity.name)}"
                       style="color: var(--color-primary);">
                        Search ancient texts for ${this.escapeHtml(this.entity.name)}
                    </a>
                </div>
            </section>

            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .corpus-query-panel {
                    margin-bottom: 1rem;
                    border-radius: 8px;
                    overflow: hidden;
                    transition: box-shadow 0.2s ease;
                }

                .corpus-query-panel:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .query-header {
                    cursor: pointer;
                    transition: background 0.2s ease;
                }

                .query-header:hover {
                    background: rgba(var(--color-primary-rgb), 0.05);
                }

                .query-content.collapsed {
                    display: none;
                }

                .query-content.expanded {
                    display: block;
                    border-top: 1px solid var(--color-border);
                }

                .query-link-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    width: 100%;
                    padding: 1rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s ease;
                    margin-bottom: 0.5rem;
                }

                .query-link-btn:hover {
                    background: var(--color-surface-hover);
                    border-color: var(--color-primary);
                }

                .result-item {
                    padding: 0.75rem;
                    border-bottom: 1px solid var(--color-border);
                }

                .result-item:last-child {
                    border-bottom: none;
                }

                .context-text {
                    font-style: italic;
                    padding: 0.5rem;
                    background: var(--color-surface);
                    border-radius: 4px;
                    border-left: 3px solid var(--color-primary);
                    margin-top: 0.5rem;
                }

                .user-query-badge {
                    font-size: 0.75rem;
                    padding: 0.125rem 0.5rem;
                    background: var(--color-secondary);
                    color: white;
                    border-radius: 1rem;
                    margin-left: 0.5rem;
                }
            </style>
        `;
    }

    /**
     * Load corpus queries for the entity
     */
    async loadQueries() {
        this.isLoading = true;
        const sectionId = `related-texts-${this.entity.id || 'section'}`;

        try {
            let queries = [];

            // First, check entity's embedded corpusQueries
            if (this.entity.corpusQueries && Array.isArray(this.entity.corpusQueries)) {
                queries = this.entity.corpusQueries.map(q => ({
                    ...q,
                    isStandard: true,
                    source: 'entity'
                }));
            }

            // Then try to load from Firebase via service
            if (this.queryService && this.queryService.initialized) {
                try {
                    const entityType = this.entity.type || 'deity';
                    const entityId = this.entity.id;

                    const serviceQueries = await this.queryService.getQueriesForEntity(entityType, entityId);

                    // Merge, avoiding duplicates
                    const existingIds = new Set(queries.map(q => q.id));
                    serviceQueries.forEach(q => {
                        if (!existingIds.has(q.id)) {
                            queries.push(q);
                        }
                    });
                } catch (error) {
                    console.warn('Could not load queries from service:', error);
                }
            }

            // Sort: standard first, then by order/votes
            queries.sort((a, b) => {
                if (a.isStandard && !b.isStandard) return -1;
                if (!a.isStandard && b.isStandard) return 1;
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return (b.votes || 0) - (a.votes || 0);
            });

            // Limit queries
            this.queries = queries.slice(0, this.options.maxQueries);

            // Render queries
            this.renderQueries();

        } catch (error) {
            console.error('Error loading corpus queries:', error);
            this.renderError(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render loaded queries
     */
    renderQueries() {
        const sectionId = `related-texts-${this.entity.id || 'section'}`;
        const loadingEl = document.getElementById(`${sectionId}-loading`);
        const containerEl = document.getElementById(`${sectionId}-container`);
        const emptyEl = document.getElementById(`${sectionId}-empty`);
        const standardEl = document.getElementById(`${sectionId}-standard`);
        const userEl = document.getElementById(`${sectionId}-user`);

        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';

        // Check if we have queries
        if (this.queries.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        // Show container
        if (containerEl) containerEl.style.display = 'block';

        // Separate standard and user queries
        const standardQueries = this.queries.filter(q => q.isStandard);
        const userQueries = this.queries.filter(q => !q.isStandard);

        // Render standard queries
        if (standardEl && standardQueries.length > 0) {
            standardEl.innerHTML = standardQueries.map(query =>
                this.renderQueryItem(query)
            ).join('');

            // Auto-load first query if configured
            if (this.options.autoLoadFirst && standardQueries.length > 0) {
                const firstQuery = standardQueries[0];
                if (firstQuery.autoLoad) {
                    this.loadQueryResults(firstQuery.id);
                }
            }
        }

        // Render user queries
        if (userEl && this.options.showUserQueries && userQueries.length > 0) {
            userEl.style.display = 'block';
            const countEl = userEl.querySelector('.user-query-count');
            if (countEl) countEl.textContent = `(${userQueries.length})`;

            const listEl = userEl.querySelector('.user-queries-list');
            if (listEl) {
                listEl.innerHTML = userQueries.map(query =>
                    this.renderQueryItem(query, true)
                ).join('');
            }
        }

        // Attach event handlers
        this.attachEventHandlers();

        // Load auto-load queries
        this.queries.filter(q => q.autoLoad).forEach(query => {
            this.loadQueryResults(query.id);
        });
    }

    /**
     * Render a single query item
     */
    renderQueryItem(query, isUserQuery = false) {
        const queryIcon = query.queryType === 'github' ? '📜' : '🔍';
        const statusClass = query.autoLoad ? 'auto-load' : 'click-to-load';

        return `
            <div class="corpus-query-panel glass-card ${statusClass}" data-query-id="${query.id}">
                <div class="query-header" style="display: flex; align-items: center; gap: 1rem; padding: 1rem;">
                    <span class="query-icon" style="font-size: 1.25rem;">${queryIcon}</span>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; color: var(--color-primary); font-size: 1rem;">
                            ${this.escapeHtml(query.label)}
                            ${isUserQuery && query.userName ? `<span class="user-query-badge">by ${this.escapeHtml(query.userName)}</span>` : ''}
                        </h4>
                        ${query.description ? `
                            <p style="margin: 0.25rem 0 0; font-size: 0.85rem; opacity: 0.7;">
                                ${this.escapeHtml(query.description)}
                            </p>
                        ` : ''}
                    </div>
                    <div class="query-meta" style="display: flex; align-items: center; gap: 0.75rem;">
                        ${isUserQuery && typeof query.votes === 'number' ? `
                            <span class="vote-count" style="font-size: 0.85rem; opacity: 0.7;">
                                👍 ${query.votes}
                            </span>
                        ` : ''}
                        <span class="result-count" style="font-size: 0.85rem; opacity: 0.6;"></span>
                        <span class="expand-icon" style="font-size: 0.75rem; opacity: 0.5;">
                            ${query.autoLoad ? '▼' : '▶'}
                        </span>
                    </div>
                </div>
                <div class="query-content ${query.autoLoad ? 'expanded' : 'collapsed'}">
                    <div class="query-results-container" style="padding: 1rem;">
                        <div class="loading-placeholder" style="text-align: center; padding: 1rem; opacity: 0.6;">
                            Click to load results...
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event handlers to query panels
     */
    attachEventHandlers() {
        const panels = this.container.querySelectorAll('.corpus-query-panel');

        panels.forEach(panel => {
            const queryId = panel.dataset.queryId;
            const header = panel.querySelector('.query-header');

            if (header) {
                header.addEventListener('click', () => {
                    this.toggleQueryPanel(queryId, panel);
                });
            }
        });
    }

    /**
     * Toggle query panel expand/collapse
     */
    async toggleQueryPanel(queryId, panel) {
        const content = panel.querySelector('.query-content');
        const icon = panel.querySelector('.expand-icon');

        if (content.classList.contains('collapsed')) {
            // Expand
            content.classList.remove('collapsed');
            content.classList.add('expanded');
            if (icon) icon.textContent = '▼';

            // Load results if not already loaded
            if (!this.loadedResults.has(queryId)) {
                await this.loadQueryResults(queryId);
            }
        } else {
            // Collapse
            content.classList.remove('expanded');
            content.classList.add('collapsed');
            if (icon) icon.textContent = '▶';
        }
    }

    /**
     * Load and render query results
     */
    async loadQueryResults(queryId) {
        const query = this.queries.find(q => q.id === queryId);
        if (!query) return;

        const panel = this.container.querySelector(`[data-query-id="${queryId}"]`);
        if (!panel) return;

        const resultsContainer = panel.querySelector('.query-results-container');
        const resultCountEl = panel.querySelector('.result-count');

        // Show loading
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 1rem;">
                <div class="loading-spinner" style="display: inline-block; width: 20px; height: 20px; border: 2px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.7;">Loading results...</p>
            </div>
        `;

        try {
            let results = { items: [], total: 0 };

            // Execute query via service
            if (this.queryService && this.queryService.initialized) {
                results = await this.queryService.executeQuery(query);

                // Handle the combined result format
                if (results.combined) {
                    results = {
                        items: results.combined,
                        total: results.combined.length
                    };
                } else if (results.github) {
                    results = results.github;
                } else if (results.firebase) {
                    results = results.firebase;
                }
            }

            // Cache results
            this.loadedResults.set(queryId, results);

            // Update count
            const count = results.total || results.items?.length || 0;
            if (resultCountEl) {
                resultCountEl.textContent = `${count} result${count !== 1 ? 's' : ''}`;
            }

            // Render results
            this.renderResults(resultsContainer, results, query);

        } catch (error) {
            console.error('Error loading query results:', error);
            resultsContainer.innerHTML = `
                <div style="color: var(--color-error); padding: 1rem;">
                    <p>Error loading results: ${this.escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    /**
     * Render query results
     */
    renderResults(container, results, query) {
        if (!results.items || results.items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; opacity: 0.7;">
                    <p>No results found</p>
                </div>
            `;
            return;
        }

        // Render based on query type
        if (query.queryType === 'github' || results.items[0]?.context) {
            this.renderGitHubResults(container, results, query);
        } else {
            this.renderEntityResults(container, results, query);
        }
    }

    /**
     * Render GitHub/sacred text results
     */
    renderGitHubResults(container, results, query) {
        container.innerHTML = `
            <div class="github-results">
                ${results.items.slice(0, 10).map(item => `
                    <div class="result-item">
                        ${item.file || item.textName ? `
                            <div class="result-source" style="font-size: 0.85rem; color: var(--color-primary); margin-bottom: 0.5rem;">
                                <strong>${this.escapeHtml(item.file || item.textName)}</strong>
                                ${item.matchCount ? `<span style="opacity: 0.7;"> - ${item.matchCount} matches</span>` : ''}
                            </div>
                        ` : ''}
                        ${item.matches ? item.matches.slice(0, 3).map(match => `
                            <div class="context-text">
                                "...${this.escapeHtml(match.context || match)}..."
                            </div>
                        `).join('') : item.context ? `
                            <div class="context-text">
                                "...${this.escapeHtml(item.context)}..."
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
                ${results.items.length > 10 ? `
                    <div style="text-align: center; padding: 1rem;">
                        <a href="/corpus-explorer.html?term=${encodeURIComponent(query.query?.term || this.entity.name)}"
                           style="color: var(--color-primary);">
                            View all ${results.total || results.items.length} results →
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render entity/Firebase results
     */
    renderEntityResults(container, results, query) {
        const renderMode = query.renderMode || 'list';

        if (renderMode === 'inline-grid' || renderMode === 'grid') {
            container.innerHTML = `
                <div class="entity-results-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
                    ${results.items.slice(0, 12).map(item => `
                        <div class="entity-mini-card" style="padding: 1rem; background: var(--color-surface); border-radius: 8px; text-align: center;">
                            ${item.icon ? `<div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${item.icon}</div>` : ''}
                            <h5 style="margin: 0; color: var(--color-primary); font-size: 0.95rem;">
                                ${this.escapeHtml(item.name)}
                            </h5>
                            ${item.mythology ? `<small style="opacity: 0.6;">${this.escapeHtml(item.mythology)}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="entity-results-list">
                    ${results.items.slice(0, 10).map(item => `
                        <div class="result-item" style="display: flex; align-items: center; gap: 0.75rem;">
                            ${item.icon ? `<span style="font-size: 1.25rem;">${item.icon}</span>` : ''}
                            <div style="flex: 1;">
                                <strong style="color: var(--color-primary);">${this.escapeHtml(item.name)}</strong>
                                ${item.type ? `<span style="font-size: 0.8rem; opacity: 0.6; margin-left: 0.5rem;">${this.escapeHtml(item.type)}</span>` : ''}
                                ${item.description ? `<p style="margin: 0.25rem 0 0; font-size: 0.85rem; opacity: 0.8;">${this.escapeHtml(item.description?.substring(0, 100))}...</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    /**
     * Render error state
     */
    renderError(message) {
        const sectionId = `related-texts-${this.entity.id || 'section'}`;
        const loadingEl = document.getElementById(`${sectionId}-loading`);

        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="color: var(--color-error); padding: 1rem;">
                    <p>Error loading corpus references: ${this.escapeHtml(message)}</p>
                </div>
            `;
        }
    }

    /**
     * Add a corpus query link (for non-auto-load queries)
     */
    renderQueryLink(query) {
        return `
            <button class="query-link-btn" data-query-id="${query.id}">
                <span class="query-icon">${query.queryType === 'github' ? '📜' : '🔍'}</span>
                <div style="flex: 1;">
                    <strong>${this.escapeHtml(query.label)}</strong>
                    ${query.description ? `<p style="margin: 0.25rem 0 0; font-size: 0.85rem; opacity: 0.7;">${this.escapeHtml(query.description)}</p>` : ''}
                </div>
                <span style="opacity: 0.5;">→</span>
            </button>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.queries = [];
        this.loadedResults.clear();
        this.container.innerHTML = '';
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelatedTextsSection;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.RelatedTextsSection = RelatedTextsSection;
}
