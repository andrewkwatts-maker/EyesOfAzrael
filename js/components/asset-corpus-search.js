/**
 * Asset Corpus Search Component
 *
 * Provides embedded corpus search functionality on asset detail pages.
 * Automatically generates and executes search queries based on entity attributes.
 *
 * Features:
 * - Automatic query generation based on entity name, type, mythology, and attributes
 * - Expandable sections for different query categories
 * - Result caching for performance
 * - Integration with corpus-search-core.js for sacred texts search
 * - Link to full corpus explorer for deeper exploration
 *
 * Query Categories:
 * - "Related in Sacred Texts" - texts mentioning this entity
 * - "Cross-Mythology Parallels" - similar entities in other mythologies
 * - "Historical References" - historical context searches
 * - "Symbolic Connections" - related symbols and meanings
 *
 * @version 1.0.0
 */

class AssetCorpusSearch {
    /**
     * Create an AssetCorpusSearch instance
     * @param {HTMLElement} container - Container element for the component
     * @param {Object} entity - Entity data object
     * @param {Object} options - Configuration options
     */
    constructor(container, entity, options = {}) {
        this.container = container;
        this.entity = entity;
        this.options = {
            maxResultsPerSection: 5,
            expandFirstSection: true,
            showCorpusExplorerLink: true,
            enableCaching: true,
            cacheDuration: 10 * 60 * 1000, // 10 minutes
            ...options
        };

        // Query templates service
        this.queryTemplates = null;

        // Corpus search instance
        this.corpusSearch = null;

        // Firebase query service
        this.queryService = null;

        // State
        this.generatedQueries = [];
        this.loadedResults = new Map();
        this.expandedSections = new Set();
        this.isInitialized = false;

        // Cache key prefix
        this.cachePrefix = `asset_corpus_${entity.id || entity.name}_`;
    }

    /**
     * Initialize and render the component
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Initialize dependencies
            await this.initializeDependencies();

            // Generate queries based on entity
            this.generatedQueries = this.generateQueriesForEntity();

            // Render initial structure
            this.render();

            // Expand first section if configured
            if (this.options.expandFirstSection && this.generatedQueries.length > 0) {
                const firstCategory = this.generatedQueries[0]?.category;
                if (firstCategory) {
                    this.expandedSections.add(firstCategory);
                    this.updateSectionState(firstCategory, true);
                }
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('[AssetCorpusSearch] Initialization error:', error);
            this.renderError('Failed to initialize corpus search');
        }
    }

    /**
     * Initialize dependencies (query templates, corpus search, etc.)
     * @returns {Promise<void>}
     */
    async initializeDependencies() {
        // Initialize query templates
        if (typeof CorpusQueryTemplates !== 'undefined') {
            this.queryTemplates = new CorpusQueryTemplates();
        }

        // Initialize GitHub corpus search (from corpus-search-core.js)
        // Check if CorpusSearch is the GitHub version (has configPath property)
        if (typeof CorpusSearch !== 'undefined' && !this.corpusSearch) {
            try {
                const configPath = this.options.corpusConfigPath || 'data/corpus-config.json';
                const testInstance = new CorpusSearch(configPath);

                // The GitHub version uses configPath, Firebase version uses firestoreInstance
                if (testInstance.configPath) {
                    // This is the GitHub-based corpus search
                    this.corpusSearch = testInstance;
                    await this.corpusSearch.init().catch(() => {
                        console.log('[AssetCorpusSearch] Corpus config not found, using Firebase-only mode');
                        this.corpusSearch = null;
                    });
                } else {
                    // This is the Firebase-based CorpusSearch, use it for firebaseSearcher
                    if (typeof firebase !== 'undefined' && firebase.firestore) {
                        this.firebaseSearcher = new CorpusSearch(firebase.firestore());
                    }
                }
            } catch (e) {
                console.log('[AssetCorpusSearch] Corpus search not available');
            }
        }

        // Initialize Firebase query service
        if (window.corpusQueryService) {
            this.queryService = window.corpusQueryService;
        } else if (typeof CorpusQueryService !== 'undefined') {
            this.queryService = new CorpusQueryService();
            try {
                await this.queryService.init();
            } catch (e) {
                console.warn('[AssetCorpusSearch] Query service init failed:', e);
            }
        }

        // If we have the Firebase-based CorpusSearch but not the query service
        if (!this.queryService && !this.firebaseSearcher) {
            // Try to use Firebase directly
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                this.queryService = { db: firebase.firestore() };
            }
        }
    }

    /**
     * Generate queries based on entity attributes
     * @returns {Array<Object>} Generated query objects
     */
    generateQueriesForEntity() {
        const queries = [];
        const entity = this.entity;

        // Use templates if available
        if (this.queryTemplates) {
            return this.queryTemplates.generateForEntity(entity);
        }

        // Fallback: Generate basic queries manually
        const entityName = entity.name || entity.title || '';
        const entityType = entity.type || 'entity';
        const mythology = entity.mythology || entity.mythologies?.[0] || '';

        // Category 1: Sacred Texts References
        queries.push({
            id: `sacred-texts-${entity.id}`,
            category: 'sacred-texts',
            label: `${entityName} in Sacred Texts`,
            description: `Find references to ${entityName} in ancient scriptures and sacred writings`,
            icon: '📜',
            query: {
                term: entityName,
                type: 'github',
                options: {
                    maxResults: this.options.maxResultsPerSection,
                    contextWords: 20
                }
            },
            priority: 1
        });

        // Category 2: Cross-Mythology Parallels
        if (entityType === 'deity' || entityType === 'hero' || entityType === 'creature') {
            const attributes = this.extractSearchableAttributes(entity);

            queries.push({
                id: `parallels-${entity.id}`,
                category: 'parallels',
                label: 'Cross-Mythology Parallels',
                description: `Discover similar ${entityType === 'deity' ? 'gods' : entityType + 's'} across different traditions`,
                icon: '🌍',
                query: {
                    type: 'firebase',
                    collection: this.getCollectionForType(entityType),
                    attributes: attributes,
                    excludeId: entity.id,
                    excludeMythology: mythology,
                    options: {
                        maxResults: this.options.maxResultsPerSection
                    }
                },
                priority: 2
            });
        }

        // Category 3: Historical References
        if (entity.historicalPeriod || entity.era || mythology) {
            const historicalContext = entity.historicalPeriod || entity.era || mythology;

            queries.push({
                id: `historical-${entity.id}`,
                category: 'historical',
                label: 'Historical Context',
                description: `Explore the historical background and scholarly references`,
                icon: '📚',
                query: {
                    term: `${entityName} ${historicalContext}`,
                    type: 'github',
                    options: {
                        maxResults: this.options.maxResultsPerSection,
                        contextWords: 25
                    }
                },
                priority: 3
            });
        }

        // Category 4: Symbolic Connections
        if (entity.symbols || entity.domains || entity.attributes || entity.powers) {
            const symbolTerms = this.extractSymbolicTerms(entity);

            if (symbolTerms.length > 0) {
                queries.push({
                    id: `symbols-${entity.id}`,
                    category: 'symbols',
                    label: 'Symbolic Connections',
                    description: 'Explore related symbols, archetypes, and meanings',
                    icon: '🔮',
                    query: {
                        type: 'firebase',
                        collection: 'symbols',
                        terms: symbolTerms,
                        options: {
                            maxResults: this.options.maxResultsPerSection
                        }
                    },
                    priority: 4
                });
            }
        }

        // Category 5: Related Entities (same mythology)
        if (mythology) {
            queries.push({
                id: `related-${entity.id}`,
                category: 'related',
                label: `More from ${mythology} Mythology`,
                description: `Other ${entityType === 'deity' ? 'deities' : entityType + 's'} from the same tradition`,
                icon: '🔗',
                query: {
                    type: 'firebase',
                    collection: this.getCollectionForType(entityType),
                    mythology: mythology,
                    excludeId: entity.id,
                    options: {
                        maxResults: this.options.maxResultsPerSection
                    }
                },
                priority: 5
            });
        }

        // Sort by priority
        queries.sort((a, b) => a.priority - b.priority);

        return queries;
    }

    /**
     * Extract searchable attributes from entity
     * @param {Object} entity - Entity object
     * @returns {Object} Searchable attributes
     */
    extractSearchableAttributes(entity) {
        const attributes = {};

        // Domains for deities
        if (entity.domains && Array.isArray(entity.domains)) {
            attributes.domains = entity.domains.slice(0, 3);
        }

        // Powers/abilities
        if (entity.powers && Array.isArray(entity.powers)) {
            attributes.powers = entity.powers.slice(0, 3);
        }

        // Role/archetype
        if (entity.role || entity.archetype) {
            attributes.role = entity.role || entity.archetype;
        }

        // Symbols
        if (entity.symbols && Array.isArray(entity.symbols)) {
            attributes.symbols = entity.symbols.slice(0, 3);
        }

        return attributes;
    }

    /**
     * Extract symbolic terms for symbol search
     * @param {Object} entity - Entity object
     * @returns {Array<string>} Symbolic terms
     */
    extractSymbolicTerms(entity) {
        const terms = [];

        if (entity.symbols) {
            terms.push(...(Array.isArray(entity.symbols) ? entity.symbols : [entity.symbols]));
        }
        if (entity.domains) {
            terms.push(...(Array.isArray(entity.domains) ? entity.domains.slice(0, 2) : [entity.domains]));
        }
        if (entity.attributes && typeof entity.attributes === 'object') {
            const attrValues = Object.values(entity.attributes).flat();
            terms.push(...attrValues.slice(0, 3));
        }
        if (entity.powers) {
            terms.push(...(Array.isArray(entity.powers) ? entity.powers.slice(0, 2) : [entity.powers]));
        }

        // Remove duplicates and limit
        return [...new Set(terms)].slice(0, 5);
    }

    /**
     * Get Firebase collection name for entity type
     * @param {string} type - Entity type
     * @returns {string} Collection name
     */
    getCollectionForType(type) {
        const map = {
            deity: 'deities',
            hero: 'heroes',
            creature: 'creatures',
            item: 'items',
            place: 'places',
            symbol: 'symbols',
            text: 'texts',
            ritual: 'rituals',
            herb: 'herbs',
            archetype: 'archetypes',
            magic: 'magic'
        };
        return map[type] || type + 's';
    }

    /**
     * Render the component
     */
    render() {
        const groupedQueries = this.groupQueriesByCategory();

        this.container.innerHTML = `
            <section class="asset-corpus-search" data-entity-id="${this.escapeAttr(this.entity.id || '')}">
                <header class="corpus-search-header">
                    <div class="corpus-search-title">
                        <h3>
                            <span class="title-icon">🔍</span>
                            Explore Further
                        </h3>
                        <p class="corpus-search-subtitle">
                            Discover connections, references, and parallels
                        </p>
                    </div>
                    ${this.options.showCorpusExplorerLink ? `
                        <a href="/corpus-explorer.html?term=${encodeURIComponent(this.entity.name || '')}"
                           class="corpus-explorer-link"
                           target="_blank"
                           rel="noopener">
                            <span>Open Corpus Explorer</span>
                            <span class="link-icon">↗</span>
                        </a>
                    ` : ''}
                </header>

                <div class="corpus-sections">
                    ${Object.entries(groupedQueries).map(([category, queries]) =>
                        this.renderSection(category, queries)
                    ).join('')}
                </div>

                ${this.generatedQueries.length === 0 ? `
                    <div class="corpus-empty-state">
                        <p>No corpus queries available for this entity.</p>
                        <a href="/corpus-explorer.html" class="explore-link">
                            Explore the full corpus →
                        </a>
                    </div>
                ` : ''}
            </section>

            <style>
                ${this.getStyles()}
            </style>
        `;

        // Attach event listeners
        this.attachEventListeners();
    }

    /**
     * Group queries by category
     * @returns {Object} Queries grouped by category
     */
    groupQueriesByCategory() {
        const grouped = {};

        for (const query of this.generatedQueries) {
            const category = query.category || 'general';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(query);
        }

        return grouped;
    }

    /**
     * Render a single section
     * @param {string} category - Category name
     * @param {Array} queries - Queries in this category
     * @returns {string} Section HTML
     */
    renderSection(category, queries) {
        const firstQuery = queries[0];
        const isExpanded = this.expandedSections.has(category);
        const categoryLabels = {
            'sacred-texts': 'Related in Sacred Texts',
            'parallels': 'Cross-Mythology Parallels',
            'historical': 'Historical References',
            'symbols': 'Symbolic Connections',
            'related': 'Related Entities'
        };

        return `
            <div class="corpus-section" data-category="${this.escapeAttr(category)}">
                <button class="corpus-section-header"
                        aria-expanded="${isExpanded}"
                        aria-controls="corpus-content-${category}">
                    <span class="section-icon">${firstQuery?.icon || '📖'}</span>
                    <div class="section-info">
                        <h4 class="section-title">${categoryLabels[category] || firstQuery?.label || 'Search Results'}</h4>
                        <p class="section-description">${firstQuery?.description || ''}</p>
                    </div>
                    <span class="section-toggle ${isExpanded ? 'expanded' : ''}">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                        </svg>
                    </span>
                </button>

                <div class="corpus-section-content ${isExpanded ? 'expanded' : 'collapsed'}"
                     id="corpus-content-${category}">
                    <div class="corpus-results-container" data-category="${this.escapeAttr(category)}">
                        ${isExpanded ? this.renderLoadingState() : this.renderCollapsedState()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render loading state
     * @returns {string} Loading HTML
     */
    renderLoadingState() {
        return `
            <div class="corpus-loading">
                <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p>Searching corpus...</p>
            </div>
        `;
    }

    /**
     * Render collapsed state
     * @returns {string} Collapsed state HTML
     */
    renderCollapsedState() {
        return `
            <div class="corpus-collapsed-hint">
                <p>Click to expand and load results</p>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const headers = this.container.querySelectorAll('.corpus-section-header');

        headers.forEach(header => {
            header.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = header.closest('.corpus-section');
                const category = section?.dataset.category;

                if (category) {
                    await this.toggleSection(category);
                }
            });
        });

        // Handle "Show More" buttons
        this.container.addEventListener('click', async (e) => {
            if (e.target.classList.contains('show-more-btn')) {
                const category = e.target.dataset.category;
                if (category) {
                    await this.loadMoreResults(category);
                }
            }
        });
    }

    /**
     * Toggle section expand/collapse
     * @param {string} category - Category to toggle
     */
    async toggleSection(category) {
        const isExpanded = this.expandedSections.has(category);

        if (isExpanded) {
            this.expandedSections.delete(category);
            this.updateSectionState(category, false);
        } else {
            this.expandedSections.add(category);
            this.updateSectionState(category, true);

            // Load results if not already loaded
            if (!this.loadedResults.has(category)) {
                await this.loadCategoryResults(category);
            }
        }
    }

    /**
     * Update section visual state
     * @param {string} category - Category name
     * @param {boolean} expanded - Whether expanded
     */
    updateSectionState(category, expanded) {
        const section = this.container.querySelector(`[data-category="${category}"]`);
        if (!section) return;

        const header = section.querySelector('.corpus-section-header');
        const content = section.querySelector('.corpus-section-content');
        const toggle = section.querySelector('.section-toggle');

        if (header) {
            header.setAttribute('aria-expanded', expanded);
        }
        if (content) {
            content.classList.toggle('expanded', expanded);
            content.classList.toggle('collapsed', !expanded);
        }
        if (toggle) {
            toggle.classList.toggle('expanded', expanded);
        }

        // If expanding and no results loaded, show loading
        if (expanded && !this.loadedResults.has(category)) {
            const resultsContainer = content?.querySelector('.corpus-results-container');
            if (resultsContainer) {
                resultsContainer.innerHTML = this.renderLoadingState();
            }
        }
    }

    /**
     * Load results for a category
     * @param {string} category - Category to load
     */
    async loadCategoryResults(category) {
        const queries = this.generatedQueries.filter(q => q.category === category);
        if (queries.length === 0) return;

        // Check cache first
        const cacheKey = this.cachePrefix + category;
        if (this.options.enableCaching) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.loadedResults.set(category, cached);
                this.renderResults(category, cached);
                return;
            }
        }

        try {
            const allResults = [];

            for (const query of queries) {
                const results = await this.executeQuery(query);
                allResults.push(...results);
            }

            // Cache results
            if (this.options.enableCaching) {
                this.saveToCache(cacheKey, allResults);
            }

            this.loadedResults.set(category, allResults);
            this.renderResults(category, allResults);

        } catch (error) {
            console.error(`[AssetCorpusSearch] Error loading ${category}:`, error);
            this.renderError(`Failed to load ${category} results`, category);
        }
    }

    /**
     * Execute a single query
     * @param {Object} query - Query object
     * @returns {Promise<Array>} Results array
     */
    async executeQuery(query) {
        const results = [];

        if (query.query.type === 'github' && this.corpusSearch) {
            // Execute GitHub corpus search
            try {
                const term = query.query.term;
                const options = query.query.options || {};

                // Load repos if not already loaded
                if (this.corpusSearch.loadedTexts?.size === 0) {
                    const repos = this.corpusSearch.getRepositories();
                    if (repos.length > 0) {
                        const enabledRepos = repos.filter(r => r.enabled_by_default).map(r => r.id);
                        if (enabledRepos.length > 0) {
                            await this.corpusSearch.loadSelectedRepos(enabledRepos);
                        }
                    }
                }

                const searchResults = await this.corpusSearch.search(term, options);

                results.push(...searchResults.map(r => ({
                    type: 'text-reference',
                    source: r.corpus_name,
                    reference: r.text_name,
                    context: r.context || r.full_verse,
                    matchedTerm: r.matched_term,
                    url: r.url
                })));
            } catch (e) {
                console.warn('[AssetCorpusSearch] GitHub search error:', e);
            }
        }

        if (query.query.type === 'firebase' && this.queryService?.db) {
            // Execute Firebase entity search
            try {
                const db = this.queryService.db;
                const collection = query.query.collection;
                const options = query.query.options || {};

                let queryRef = db.collection(collection);

                // Apply mythology filter
                if (query.query.mythology) {
                    queryRef = queryRef.where('mythology', '==', query.query.mythology);
                }

                // Apply exclusions
                if (query.query.excludeMythology) {
                    queryRef = queryRef.where('mythology', '!=', query.query.excludeMythology);
                }

                // Limit results
                queryRef = queryRef.limit(options.maxResults || 10);

                const snapshot = await queryRef.get();

                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Exclude the current entity
                    if (doc.id !== query.query.excludeId) {
                        results.push({
                            type: 'entity',
                            id: doc.id,
                            name: data.name,
                            entityType: data.type,
                            mythology: data.mythology,
                            icon: data.icon,
                            description: data.description?.substring(0, 150) + '...'
                        });
                    }
                });
            } catch (e) {
                console.warn('[AssetCorpusSearch] Firebase search error:', e);
            }
        }

        return results;
    }

    /**
     * Render results for a category
     * @param {string} category - Category name
     * @param {Array} results - Results array
     */
    renderResults(category, results) {
        const section = this.container.querySelector(`[data-category="${category}"]`);
        const resultsContainer = section?.querySelector('.corpus-results-container');

        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="corpus-no-results">
                    <p>No results found for this query.</p>
                    <a href="/corpus-explorer.html?term=${encodeURIComponent(this.entity.name || '')}"
                       class="explore-link">
                        Try the full corpus explorer →
                    </a>
                </div>
            `;
            return;
        }

        // Group results by type
        const textResults = results.filter(r => r.type === 'text-reference');
        const entityResults = results.filter(r => r.type === 'entity');

        let html = '<div class="corpus-results">';

        // Text references
        if (textResults.length > 0) {
            html += `
                <div class="text-results">
                    ${textResults.slice(0, this.options.maxResultsPerSection).map(r => `
                        <div class="text-result-item">
                            <div class="result-source">
                                <span class="source-icon">📜</span>
                                <strong>${this.escapeHtml(r.source)}</strong>
                                ${r.reference ? `<span class="reference">${this.escapeHtml(r.reference)}</span>` : ''}
                            </div>
                            <blockquote class="result-context">
                                "...${this.escapeHtml(this.truncateText(r.context, 200))}..."
                            </blockquote>
                            ${r.url ? `
                                <a href="${this.escapeAttr(r.url)}" target="_blank" rel="noopener" class="result-link">
                                    View source →
                                </a>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Entity results
        if (entityResults.length > 0) {
            html += `
                <div class="entity-results">
                    <div class="entity-grid">
                        ${entityResults.slice(0, this.options.maxResultsPerSection).map(r => `
                            <a href="#/${r.mythology || 'browse'}/${r.entityType}/${r.id}"
                               class="entity-result-card">
                                <span class="entity-icon">${r.icon || this.getDefaultIcon(r.entityType)}</span>
                                <div class="entity-info">
                                    <h5>${this.escapeHtml(r.name)}</h5>
                                    <span class="entity-meta">
                                        ${r.mythology ? this.escapeHtml(r.mythology) : ''}
                                        ${r.entityType ? `• ${this.escapeHtml(r.entityType)}` : ''}
                                    </span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Show more button
        if (results.length > this.options.maxResultsPerSection) {
            html += `
                <div class="show-more-container">
                    <button class="show-more-btn" data-category="${this.escapeAttr(category)}">
                        Show ${results.length - this.options.maxResultsPerSection} more results
                    </button>
                </div>
            `;
        }

        html += '</div>';
        resultsContainer.innerHTML = html;
    }

    /**
     * Load more results for a category
     * @param {string} category - Category name
     */
    async loadMoreResults(category) {
        // For now, redirect to corpus explorer
        const term = this.entity.name || '';
        window.open(`/corpus-explorer.html?term=${encodeURIComponent(term)}`, '_blank');
    }

    /**
     * Render error state
     * @param {string} message - Error message
     * @param {string} category - Optional category for scoped error
     */
    renderError(message, category = null) {
        const html = `
            <div class="corpus-error">
                <span class="error-icon">⚠️</span>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;

        if (category) {
            const section = this.container.querySelector(`[data-category="${category}"]`);
            const resultsContainer = section?.querySelector('.corpus-results-container');
            if (resultsContainer) {
                resultsContainer.innerHTML = html;
            }
        } else {
            this.container.innerHTML = html;
        }
    }

    /**
     * Get default icon for entity type
     * @param {string} type - Entity type
     * @returns {string} Default icon
     */
    getDefaultIcon(type) {
        const icons = {
            deity: '👑',
            hero: '⚔️',
            creature: '🐉',
            item: '🗡️',
            place: '🏛️',
            symbol: '☀️',
            text: '📜',
            ritual: '🕯️'
        };
        return icons[type] || '📖';
    }

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength).trim();
    }

    /**
     * Get from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or null
     */
    getFromCache(key) {
        try {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < this.options.cacheDuration) {
                    return data;
                }
                sessionStorage.removeItem(key);
            }
        } catch (e) {
            console.warn('[AssetCorpusSearch] Cache read error:', e);
        }
        return null;
    }

    /**
     * Save to cache
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     */
    saveToCache(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('[AssetCorpusSearch] Cache write error:', e);
        }
    }

    /**
     * Escape HTML
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Escape attribute value
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeAttr(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    /**
     * Get component styles
     * @returns {string} CSS styles
     */
    getStyles() {
        return `
            .asset-corpus-search {
                margin-top: 2rem;
                padding: 1.5rem;
                background: var(--color-surface, #1a1a2e);
                border-radius: 12px;
                border: 1px solid var(--color-border, rgba(255,255,255,0.1));
            }

            .corpus-search-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.1));
            }

            .corpus-search-title h3 {
                margin: 0;
                font-size: 1.25rem;
                color: var(--color-primary, #6366f1);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .corpus-search-subtitle {
                margin: 0.25rem 0 0;
                font-size: 0.9rem;
                opacity: 0.7;
            }

            .corpus-explorer-link {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                background: var(--color-primary, #6366f1);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-size: 0.9rem;
                transition: all 0.2s ease;
            }

            .corpus-explorer-link:hover {
                background: var(--color-primary-hover, #5558e3);
                transform: translateY(-1px);
            }

            .corpus-sections {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .corpus-section {
                border: 1px solid var(--color-border, rgba(255,255,255,0.1));
                border-radius: 10px;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .corpus-section:hover {
                border-color: var(--color-primary, #6366f1);
            }

            .corpus-section-header {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem 1.25rem;
                background: transparent;
                border: none;
                cursor: pointer;
                text-align: left;
                color: inherit;
                transition: background 0.2s ease;
            }

            .corpus-section-header:hover {
                background: rgba(var(--color-primary-rgb, 99,102,241), 0.05);
            }

            .section-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }

            .section-info {
                flex: 1;
                min-width: 0;
            }

            .section-title {
                margin: 0;
                font-size: 1rem;
                color: var(--color-text-primary, #ffffff);
            }

            .section-description {
                margin: 0.25rem 0 0;
                font-size: 0.85rem;
                opacity: 0.7;
            }

            .section-toggle {
                transition: transform 0.3s ease;
            }

            .section-toggle.expanded {
                transform: rotate(180deg);
            }

            .corpus-section-content {
                overflow: hidden;
                transition: max-height 0.3s ease, opacity 0.3s ease;
            }

            .corpus-section-content.collapsed {
                max-height: 0;
                opacity: 0;
            }

            .corpus-section-content.expanded {
                max-height: 2000px;
                opacity: 1;
            }

            .corpus-results-container {
                padding: 1rem 1.25rem;
                border-top: 1px solid var(--color-border, rgba(255,255,255,0.1));
            }

            .corpus-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 2rem;
                text-align: center;
            }

            .loading-spinner {
                position: relative;
                width: 40px;
                height: 40px;
            }

            .spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 2px solid transparent;
                border-top-color: var(--color-primary, #6366f1);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .spinner-ring:nth-child(2) {
                width: 80%;
                height: 80%;
                top: 10%;
                left: 10%;
                animation-duration: 0.8s;
                animation-direction: reverse;
            }

            .spinner-ring:nth-child(3) {
                width: 60%;
                height: 60%;
                top: 20%;
                left: 20%;
                animation-duration: 0.6s;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .corpus-results {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .text-result-item {
                padding: 1rem;
                background: var(--color-background, #0f0f23);
                border-radius: 8px;
                border-left: 3px solid var(--color-primary, #6366f1);
            }

            .result-source {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            }

            .result-source .reference {
                opacity: 0.7;
                font-size: 0.85rem;
            }

            .result-context {
                margin: 0.75rem 0;
                padding: 0.75rem;
                font-style: italic;
                background: rgba(var(--color-primary-rgb, 99,102,241), 0.05);
                border-radius: 6px;
                line-height: 1.6;
            }

            .result-link {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.85rem;
                color: var(--color-primary, #6366f1);
                text-decoration: none;
            }

            .result-link:hover {
                text-decoration: underline;
            }

            .entity-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 0.75rem;
            }

            .entity-result-card {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                background: var(--color-background, #0f0f23);
                border-radius: 8px;
                text-decoration: none;
                color: inherit;
                transition: all 0.2s ease;
            }

            .entity-result-card:hover {
                background: rgba(var(--color-primary-rgb, 99,102,241), 0.1);
                transform: translateY(-2px);
            }

            .entity-icon {
                font-size: 1.5rem;
            }

            .entity-info h5 {
                margin: 0;
                font-size: 0.95rem;
                color: var(--color-text-primary, #ffffff);
            }

            .entity-meta {
                font-size: 0.8rem;
                opacity: 0.6;
            }

            .show-more-container {
                text-align: center;
                margin-top: 1rem;
            }

            .show-more-btn {
                padding: 0.5rem 1.5rem;
                background: transparent;
                border: 1px solid var(--color-border, rgba(255,255,255,0.2));
                border-radius: 6px;
                color: var(--color-primary, #6366f1);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .show-more-btn:hover {
                background: var(--color-primary, #6366f1);
                color: white;
            }

            .corpus-no-results,
            .corpus-error,
            .corpus-empty-state {
                text-align: center;
                padding: 2rem;
                opacity: 0.7;
            }

            .corpus-error {
                color: var(--color-error, #ef4444);
            }

            .explore-link {
                color: var(--color-primary, #6366f1);
                text-decoration: none;
            }

            .explore-link:hover {
                text-decoration: underline;
            }

            .corpus-collapsed-hint {
                text-align: center;
                padding: 1rem;
                opacity: 0.5;
                font-size: 0.9rem;
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .corpus-search-header {
                    flex-direction: column;
                    gap: 1rem;
                }

                .corpus-explorer-link {
                    width: 100%;
                    justify-content: center;
                }

                .entity-grid {
                    grid-template-columns: 1fr;
                }

                .corpus-section-header {
                    padding: 0.875rem 1rem;
                }

                .section-icon {
                    font-size: 1.25rem;
                }
            }
        `;
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.generatedQueries = [];
        this.loadedResults.clear();
        this.expandedSections.clear();
        this.container.innerHTML = '';
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetCorpusSearch;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AssetCorpusSearch = AssetCorpusSearch;
}
