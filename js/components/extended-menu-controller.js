/**
 * Extended Menu Controller
 * Manages the hamburger/extended menu with corpus search functionality
 *
 * Features:
 * - Toggle menu open/close
 * - Corpus search across entity corpusQueries and data
 * - Filter by mythology, entity type, time period
 * - Paginated search results
 * - Keyboard accessibility
 * - Mobile-responsive
 */

class ExtendedMenuController {
    constructor() {
        // DOM Elements
        this.menuBtn = document.getElementById('extendedMenuBtn');
        this.menuPanel = document.getElementById('extendedMenuPanel');
        this.menuOverlay = document.getElementById('extendedMenuOverlay');
        this.closeBtn = document.getElementById('extendedMenuClose');

        // Search Elements
        this.searchInput = document.getElementById('corpusSearchInput');
        this.searchBtn = document.getElementById('corpusSearchBtn');
        this.searchResults = document.getElementById('corpusSearchResults');
        this.mythologyFilter = document.getElementById('corpusMythologyFilter');
        this.typeFilter = document.getElementById('corpusTypeFilter');
        this.periodFilter = document.getElementById('corpusPeriodFilter');

        // State
        this.isOpen = false;
        this.searchCache = new Map();
        this.currentPage = 1;
        this.resultsPerPage = 10;
        this.totalResults = 0;
        this.currentResults = [];

        // Firebase reference
        this.db = null;

        // Initialize
        this.init();
    }

    /**
     * Initialize the controller
     */
    init() {
        // Wait for Firebase to be available
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            this.db = firebase.firestore();
        } else {
            // Retry after a short delay
            setTimeout(() => this.init(), 100);
            return;
        }

        this.bindEvents();
        console.log('[ExtendedMenu] Controller initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Menu toggle
        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => this.toggle());
        }

        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        // Overlay click to close
        if (this.menuOverlay) {
            this.menuOverlay.addEventListener('click', () => this.close());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Search functionality
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.performSearch());
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Popular search buttons
        const popularSearchBtns = document.querySelectorAll('[data-search]');
        popularSearchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const searchTerm = btn.dataset.search;
                if (this.searchInput) {
                    this.searchInput.value = searchTerm;
                    this.performSearch();
                }
            });
        });

        // Links that should close the menu
        const closeMenuLinks = document.querySelectorAll('[data-close-menu]');
        closeMenuLinks.forEach(link => {
            link.addEventListener('click', () => this.close());
        });

        // Filter changes trigger search if there are results
        [this.mythologyFilter, this.typeFilter, this.periodFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    if (this.searchInput && this.searchInput.value.trim()) {
                        this.performSearch();
                    }
                });
            }
        });
    }

    /**
     * Toggle menu open/close
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open the menu
     */
    open() {
        this.isOpen = true;

        // Update ARIA attributes
        if (this.menuBtn) {
            this.menuBtn.setAttribute('aria-expanded', 'true');
            this.menuBtn.classList.add('active');
        }
        if (this.menuPanel) {
            this.menuPanel.classList.add('active');
            this.menuPanel.setAttribute('aria-hidden', 'false');
        }
        if (this.menuOverlay) {
            this.menuOverlay.classList.add('active');
            this.menuOverlay.setAttribute('aria-hidden', 'false');
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus the search input
        if (this.searchInput) {
            setTimeout(() => this.searchInput.focus(), 300);
        }

        console.log('[ExtendedMenu] Menu opened');
    }

    /**
     * Close the menu
     */
    close() {
        this.isOpen = false;

        // Update ARIA attributes
        if (this.menuBtn) {
            this.menuBtn.setAttribute('aria-expanded', 'false');
            this.menuBtn.classList.remove('active');
        }
        if (this.menuPanel) {
            this.menuPanel.classList.remove('active');
            this.menuPanel.setAttribute('aria-hidden', 'true');
        }
        if (this.menuOverlay) {
            this.menuOverlay.classList.remove('active');
            this.menuOverlay.setAttribute('aria-hidden', 'true');
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to menu button
        if (this.menuBtn) {
            this.menuBtn.focus();
        }

        console.log('[ExtendedMenu] Menu closed');
    }

    /**
     * Perform corpus search
     */
    async performSearch() {
        const query = this.searchInput ? this.searchInput.value.trim() : '';

        if (!query) {
            this.showEmptyState('Enter a search term to begin');
            return;
        }

        // Get filter values
        const mythology = this.mythologyFilter ? this.mythologyFilter.value : '';
        const entityType = this.typeFilter ? this.typeFilter.value : '';
        const period = this.periodFilter ? this.periodFilter.value : '';

        // Show loading state
        this.showLoadingState();

        // Check cache
        const cacheKey = `${query}-${mythology}-${entityType}-${period}`;
        if (this.searchCache.has(cacheKey)) {
            const cached = this.searchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 minute cache
                this.currentResults = cached.results;
                this.totalResults = cached.results.length;
                this.currentPage = 1;
                this.renderResults();
                return;
            }
        }

        try {
            // Perform search
            const results = await this.searchCorpus(query, { mythology, entityType, period });

            // Cache results
            this.searchCache.set(cacheKey, {
                results,
                timestamp: Date.now()
            });

            // Store and render
            this.currentResults = results;
            this.totalResults = results.length;
            this.currentPage = 1;
            this.renderResults();

            console.log(`[ExtendedMenu] Search found ${results.length} results for "${query}"`);

        } catch (error) {
            console.error('[ExtendedMenu] Search error:', error);
            this.showErrorState('Search failed. Please try again.');
        }
    }

    /**
     * Search the corpus across Firebase collections
     */
    async searchCorpus(query, filters = {}) {
        const { mythology, entityType, period } = filters;
        const results = [];
        const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

        // Collections to search
        const collections = entityType
            ? [this.getCollectionName(entityType)]
            : ['deities', 'heroes', 'creatures', 'places', 'items', 'texts', 'symbols', 'rituals', 'concepts', 'herbs'];

        // Remove null/undefined collections
        const validCollections = collections.filter(c => c);

        for (const collection of validCollections) {
            try {
                let queryRef = this.db.collection(collection);

                // Apply mythology filter
                if (mythology) {
                    queryRef = queryRef.where('primaryMythology', '==', mythology);
                }

                const snapshot = await queryRef.limit(100).get();

                snapshot.forEach(doc => {
                    const entity = { id: doc.id, ...doc.data() };

                    // Calculate relevance score
                    const score = this.calculateRelevanceScore(entity, searchTerms);

                    // Apply time period filter
                    if (period && !this.matchesPeriod(entity, period)) {
                        return;
                    }

                    if (score > 0) {
                        results.push({
                            ...entity,
                            _collection: collection,
                            _score: score,
                            _matchedTerms: this.getMatchedTerms(entity, searchTerms)
                        });
                    }
                });
            } catch (error) {
                console.warn(`[ExtendedMenu] Error searching ${collection}:`, error);
            }
        }

        // Sort by score descending
        results.sort((a, b) => b._score - a._score);

        return results;
    }

    /**
     * Map entity type to collection name
     */
    getCollectionName(type) {
        const mapping = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'place': 'places',
            'item': 'items',
            'text': 'texts',
            'symbol': 'symbols',
            'ritual': 'rituals',
            'concept': 'concepts',
            'herb': 'herbs'
        };
        return mapping[type] || type;
    }

    /**
     * Calculate relevance score for an entity
     */
    calculateRelevanceScore(entity, searchTerms) {
        let score = 0;

        searchTerms.forEach(term => {
            // Name match (highest weight)
            if (entity.name?.toLowerCase().includes(term)) {
                score += entity.name.toLowerCase() === term ? 100 : 50;
            }

            // Tags match
            if (entity.tags?.some(tag => tag.toLowerCase().includes(term))) {
                score += 40;
            }

            // Description match
            if (entity.shortDescription?.toLowerCase().includes(term)) {
                score += 30;
            }
            if (entity.fullDescription?.toLowerCase().includes(term)) {
                score += 20;
            }

            // CorpusQueries match
            if (entity.corpusQueries) {
                entity.corpusQueries.forEach(cq => {
                    if (cq.label?.toLowerCase().includes(term)) {
                        score += 35;
                    }
                    if (cq.description?.toLowerCase().includes(term)) {
                        score += 25;
                    }
                    if (cq.query?.term?.toLowerCase().includes(term)) {
                        score += 30;
                    }
                });
            }

            // Linguistic data match
            if (entity.linguistic) {
                if (entity.linguistic.originalName?.toLowerCase().includes(term)) {
                    score += 45;
                }
                if (entity.linguistic.transliteration?.toLowerCase().includes(term)) {
                    score += 40;
                }
                if (entity.linguistic.etymology?.meaning?.toLowerCase().includes(term)) {
                    score += 25;
                }
            }

            // Topic panels match
            if (entity.topic_panels) {
                Object.values(entity.topic_panels).forEach(content => {
                    if (content?.toLowerCase().includes(term)) {
                        score += 15;
                    }
                });
            }

            // Cultural data match
            if (entity.cultural?.socialRole?.toLowerCase().includes(term)) {
                score += 20;
            }
        });

        return score;
    }

    /**
     * Get matched terms for highlighting
     */
    getMatchedTerms(entity, searchTerms) {
        const matched = [];

        searchTerms.forEach(term => {
            if (entity.name?.toLowerCase().includes(term)) {
                matched.push({ field: 'name', term });
            }
            if (entity.tags?.some(tag => tag.toLowerCase().includes(term))) {
                matched.push({ field: 'tags', term });
            }
            if (entity.corpusQueries?.some(cq =>
                cq.label?.toLowerCase().includes(term) ||
                cq.description?.toLowerCase().includes(term)
            )) {
                matched.push({ field: 'corpusQueries', term });
            }
        });

        return matched;
    }

    /**
     * Check if entity matches the time period filter
     */
    matchesPeriod(entity, period) {
        const temporal = entity.temporal;
        if (!temporal) return true; // Include if no temporal data

        const firstAttestation = temporal.firstAttestation?.date?.year;
        if (!firstAttestation) return true;

        switch (period) {
            case 'ancient':
                return firstAttestation < -500;
            case 'classical':
                return firstAttestation >= -500 && firstAttestation < 500;
            case 'medieval':
                return firstAttestation >= 500 && firstAttestation < 1500;
            case 'modern':
                return firstAttestation >= 1500;
            default:
                return true;
        }
    }

    /**
     * Render search results
     */
    renderResults() {
        if (!this.searchResults) return;

        if (this.currentResults.length === 0) {
            this.showEmptyState('No results found. Try different search terms.');
            return;
        }

        // Calculate pagination
        const startIdx = (this.currentPage - 1) * this.resultsPerPage;
        const endIdx = startIdx + this.resultsPerPage;
        const pageResults = this.currentResults.slice(startIdx, endIdx);
        const totalPages = Math.ceil(this.totalResults / this.resultsPerPage);

        // Build HTML
        let html = `
            <div class="corpus-results-header">
                <span class="corpus-results-count">${this.totalResults} result${this.totalResults !== 1 ? 's' : ''} found</span>
                <button class="corpus-results-clear" id="clearCorpusResults">Clear</button>
            </div>
        `;

        pageResults.forEach(result => {
            const icon = result.icon || this.getTypeIcon(result._collection);
            const mythology = result.primaryMythology || result.mythologies?.[0] || '';
            const type = this.getTypeLabel(result._collection);

            html += `
                <div class="corpus-result-item" data-entity-id="${result.id}" data-collection="${result._collection}" data-mythology="${mythology}">
                    <div class="result-item-header">
                        <span class="result-item-name">
                            <span class="entity-icon">${icon}</span>
                            ${this.escapeHtml(result.name || 'Unnamed')}
                        </span>
                        <div class="result-item-badges">
                            ${mythology ? `<span class="result-badge mythology-badge">${mythology}</span>` : ''}
                            <span class="result-badge type-badge">${type}</span>
                        </div>
                    </div>
                    <div class="result-item-description">
                        ${this.escapeHtml(this.truncate(result.shortDescription || result.fullDescription || '', 120))}
                    </div>
                    ${result._matchedTerms?.length > 0 ? `
                        <div class="result-item-match">
                            Matched in: <strong>${result._matchedTerms.map(m => m.field).join(', ')}</strong>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        // Pagination
        if (totalPages > 1) {
            html += `
                <div class="corpus-results-pagination">
                    <button class="pagination-btn" data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
                        &lt;
                    </button>
                    <span class="pagination-info">Page ${this.currentPage} of ${totalPages}</span>
                    <button class="pagination-btn" data-page="next" ${this.currentPage === totalPages ? 'disabled' : ''}>
                        &gt;
                    </button>
                </div>
            `;
        }

        this.searchResults.innerHTML = html;
        this.searchResults.style.display = 'block';

        // Bind result click handlers
        this.bindResultHandlers();
    }

    /**
     * Bind click handlers for search results
     */
    bindResultHandlers() {
        // Clear button
        const clearBtn = document.getElementById('clearCorpusResults');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearResults();
            });
        }

        // Result items
        const resultItems = this.searchResults.querySelectorAll('.corpus-result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const entityId = item.dataset.entityId;
                const collection = item.dataset.collection;
                const mythology = item.dataset.mythology;

                // Navigate to entity page
                this.navigateToEntity(mythology, collection, entityId);
            });
        });

        // Pagination buttons
        const paginationBtns = this.searchResults.querySelectorAll('.pagination-btn');
        paginationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.page;
                if (action === 'prev' && this.currentPage > 1) {
                    this.currentPage--;
                    this.renderResults();
                } else if (action === 'next' && this.currentPage < Math.ceil(this.totalResults / this.resultsPerPage)) {
                    this.currentPage++;
                    this.renderResults();
                }
            });
        });
    }

    /**
     * Navigate to entity page
     */
    navigateToEntity(mythology, collection, entityId) {
        const singularCollection = this.getSingularType(collection);
        const path = `#/mythology/${mythology}/${singularCollection}/${entityId}`;

        // Close menu first
        this.close();

        // Navigate
        if (typeof window.location.hash !== 'undefined') {
            window.location.hash = path;
        }

        console.log(`[ExtendedMenu] Navigating to ${path}`);
    }

    /**
     * Get singular type from collection name
     */
    getSingularType(collection) {
        const mapping = {
            'deities': 'deity',
            'heroes': 'hero',
            'creatures': 'creature',
            'places': 'place',
            'items': 'item',
            'texts': 'text',
            'symbols': 'symbol',
            'rituals': 'ritual',
            'concepts': 'concept',
            'herbs': 'herb'
        };
        return mapping[collection] || collection;
    }

    /**
     * Get type label for display
     */
    getTypeLabel(collection) {
        const labels = {
            'deities': 'Deity',
            'heroes': 'Hero',
            'creatures': 'Creature',
            'places': 'Place',
            'items': 'Item',
            'texts': 'Text',
            'symbols': 'Symbol',
            'rituals': 'Ritual',
            'concepts': 'Concept',
            'herbs': 'Herb'
        };
        return labels[collection] || collection;
    }

    /**
     * Get icon for entity type
     */
    getTypeIcon(collection) {
        const icons = {
            'deities': '⚡',
            'heroes': '🗡️',
            'creatures': '🐉',
            'places': '🏔️',
            'items': '💎',
            'texts': '📜',
            'symbols': '☯️',
            'rituals': '🕯️',
            'concepts': '💭',
            'herbs': '🌿'
        };
        return icons[collection] || '📄';
    }

    /**
     * Clear search results
     */
    clearResults() {
        this.currentResults = [];
        this.totalResults = 0;
        this.currentPage = 1;

        if (this.searchInput) {
            this.searchInput.value = '';
        }

        if (this.searchResults) {
            this.searchResults.style.display = 'none';
            this.searchResults.innerHTML = '';
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        if (!this.searchResults) return;

        this.searchResults.innerHTML = `
            <div class="corpus-search-loading">
                <div class="loading-spinner"></div>
                <p>Searching corpus...</p>
            </div>
        `;
        this.searchResults.style.display = 'block';
    }

    /**
     * Show empty state
     */
    showEmptyState(message) {
        if (!this.searchResults) return;

        this.searchResults.innerHTML = `
            <div class="corpus-search-empty">
                <div class="empty-icon">🔍</div>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        this.searchResults.style.display = 'block';
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        if (!this.searchResults) return;

        this.searchResults.innerHTML = `
            <div class="corpus-search-empty" style="color: #ff6b6b;">
                <div class="empty-icon">❌</div>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        this.searchResults.style.display = 'block';
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
     * Truncate text to specified length
     */
    truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.extendedMenuController = new ExtendedMenuController();
    });
} else {
    window.extendedMenuController = new ExtendedMenuController();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExtendedMenuController;
}
