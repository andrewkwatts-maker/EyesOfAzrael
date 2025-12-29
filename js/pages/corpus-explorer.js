/**
 * Corpus Explorer Page Controller
 *
 * Full-page search interface for exploring the mythological corpus.
 * Features:
 * - Advanced search with multiple modes (generic, language, source, term, advanced)
 * - Filter by repository/collection and mythology
 * - Results display with grid, list, and table views
 * - Pagination with configurable results per page
 * - Save search as query template
 * - Search history management
 * - Virtual scrolling for large result sets
 */

class CorpusExplorerPage {
    constructor() {
        // Firebase instance
        this.db = null;

        // Search engine (CorpusSearch or EnhancedCorpusSearch)
        this.queryService = null;

        // State management
        this.currentResults = [];
        this.totalResults = 0;
        this.currentPage = 1;
        this.resultsPerPage = 24;
        this.displayMode = 'grid';
        this.sortBy = 'relevance';

        // Current search parameters
        this.currentQuery = '';
        this.currentFilters = {
            collection: '',
            mythology: '',
            searchMode: 'generic',
            importance: 1,
            hasImage: null
        };

        // Search options
        this.searchOptions = {
            caseSensitive: false,
            exactMatch: false,
            includeDescriptions: true
        };

        // Saved queries
        this.savedQueries = [];

        // Search history
        this.searchHistory = [];
        this.maxHistorySize = 20;

        // Virtual scroller instance
        this.virtualScroller = null;

        // Debounce timers
        this.autocompleteTimer = null;
        this.autocompleteDelay = 300;

        // Performance tracking
        this.searchStartTime = 0;

        console.log('[CorpusExplorerPage] Constructor completed');
    }

    /**
     * Initialize the page controller
     */
    async init() {
        console.log('[CorpusExplorerPage] Initializing...');

        try {
            // Get Firestore instance
            this.db = firebase.firestore();

            // Initialize search engine (prefer enhanced version)
            if (typeof EnhancedCorpusSearch !== 'undefined') {
                this.queryService = new EnhancedCorpusSearch(this.db);
                console.log('[CorpusExplorerPage] Using EnhancedCorpusSearch');
            } else if (typeof CorpusSearch !== 'undefined') {
                this.queryService = new CorpusSearch(this.db);
                console.log('[CorpusExplorerPage] Using CorpusSearch');
            } else {
                throw new Error('No search engine available');
            }

            // Load saved state
            this.loadSavedState();

            // Setup event listeners
            this.setupEventListeners();

            // Load mythologies for filter
            await this.loadMythologies();

            // Load saved queries
            await this.loadSavedQueries();

            // Check for URL parameters
            this.handleURLParameters();

            console.log('[CorpusExplorerPage] Initialization complete');
        } catch (error) {
            console.error('[CorpusExplorerPage] Initialization failed:', error);
            this.showError('Failed to initialize search. Please refresh the page.');
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('corpus-search-input');
        const searchBtn = document.getElementById('search-btn');
        const clearSearchBtn = document.getElementById('clear-search-btn');

        if (searchInput) {
            // Input event for autocomplete
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                clearSearchBtn.style.display = query ? 'block' : 'none';

                // Debounced autocomplete
                clearTimeout(this.autocompleteTimer);
                if (query.length >= 2) {
                    this.autocompleteTimer = setTimeout(() => {
                        this.showAutocomplete(query);
                    }, this.autocompleteDelay);
                } else {
                    this.hideAutocomplete();
                }
            });

            // Enter key to search
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });

            // Focus/blur for suggestions
            searchInput.addEventListener('focus', () => {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    this.showAutocomplete(query);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                this.hideAutocomplete();
                this.showPlaceholder();
            });
        }

        // Filter controls
        const collectionFilter = document.getElementById('collection-filter');
        const mythologyFilter = document.getElementById('mythology-filter');
        const searchModeFilter = document.getElementById('search-mode');
        const importanceFilter = document.getElementById('importance-filter');
        const imageFilter = document.getElementById('image-filter');
        const sortByFilter = document.getElementById('sort-by');

        if (collectionFilter) {
            collectionFilter.addEventListener('change', (e) => {
                this.currentFilters.collection = e.target.value;
                this.onFilterChange();
            });
        }

        if (mythologyFilter) {
            mythologyFilter.addEventListener('change', (e) => {
                this.currentFilters.mythology = e.target.value;
                this.onFilterChange();
            });
        }

        if (searchModeFilter) {
            searchModeFilter.addEventListener('change', (e) => {
                this.currentFilters.searchMode = e.target.value;
                this.onFilterChange();
            });
        }

        if (importanceFilter) {
            importanceFilter.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.currentFilters.importance = value;
                const valueDisplay = document.getElementById('importance-value');
                if (valueDisplay) {
                    valueDisplay.textContent = value;
                }
            });

            importanceFilter.addEventListener('change', () => {
                this.onFilterChange();
            });
        }

        if (imageFilter) {
            imageFilter.addEventListener('change', (e) => {
                const value = e.target.value;
                this.currentFilters.hasImage = value === '' ? null : value === 'true';
                this.onFilterChange();
            });
        }

        if (sortByFilter) {
            sortByFilter.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderResults();
            });
        }

        // Clear all filters
        const clearAllFilters = document.getElementById('clear-all-filters');
        if (clearAllFilters) {
            clearAllFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Search options
        const caseSensitive = document.getElementById('case-sensitive');
        const exactMatch = document.getElementById('exact-match');
        const includeDescriptions = document.getElementById('include-descriptions');

        if (caseSensitive) {
            caseSensitive.addEventListener('change', (e) => {
                this.searchOptions.caseSensitive = e.target.checked;
            });
        }

        if (exactMatch) {
            exactMatch.addEventListener('change', (e) => {
                this.searchOptions.exactMatch = e.target.checked;
            });
        }

        if (includeDescriptions) {
            includeDescriptions.addEventListener('change', (e) => {
                this.searchOptions.includeDescriptions = e.target.checked;
            });
        }

        // Display mode switcher
        document.querySelectorAll('.display-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.display-mode-btn').forEach(b =>
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                this.displayMode = btn.dataset.mode;
                this.renderResults();
            });
        });

        // Results per page
        const resultsPerPage = document.getElementById('results-per-page');
        if (resultsPerPage) {
            resultsPerPage.addEventListener('change', (e) => {
                this.resultsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.renderResults();
            });
        }

        // Example queries
        document.querySelectorAll('.example-query').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                document.getElementById('corpus-search-input').value = query;
                this.performSearch(query);
            });
        });

        // Save query button
        const saveQueryBtn = document.getElementById('save-query-btn');
        if (saveQueryBtn) {
            saveQueryBtn.addEventListener('click', () => {
                this.showSaveQueryModal();
            });
        }

        // Save query modal
        this.setupSaveQueryModal();

        // Click outside to close autocomplete
        document.addEventListener('click', (e) => {
            const searchInput = document.getElementById('corpus-search-input');
            const suggestions = document.getElementById('search-suggestions');
            if (searchInput && suggestions) {
                if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
                    this.hideAutocomplete();
                }
            }
        });

        // Window resize handler for responsive layout
        window.addEventListener('resize', this.debounce(() => {
            if (this.currentResults.length > 0) {
                this.renderResults();
            }
        }, 250));
    }

    /**
     * Setup save query modal
     */
    setupSaveQueryModal() {
        const modal = document.getElementById('save-query-modal');
        const overlay = modal?.querySelector('.modal-overlay');
        const closeBtn = modal?.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancel-save-query');
        const confirmBtn = document.getElementById('confirm-save-query');

        const closeModal = () => {
            if (modal) modal.style.display = 'none';
        };

        if (overlay) overlay.addEventListener('click', closeModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                await this.saveAsQuery();
                closeModal();
            });
        }
    }

    /**
     * Perform search with current query and filters
     */
    async performSearch(query, options = {}) {
        query = query?.trim() || '';

        if (!query && !options.allowEmpty) {
            this.showPlaceholder();
            return;
        }

        this.currentQuery = query;
        this.currentPage = options.page || 1;
        this.searchStartTime = performance.now();

        // Hide autocomplete
        this.hideAutocomplete();

        // Show loading state
        this.showLoading();

        try {
            console.log('[CorpusExplorerPage] Searching for:', query);

            // Build search options
            const searchOptions = {
                mode: this.currentFilters.searchMode,
                mythology: this.currentFilters.mythology || null,
                entityType: this.currentFilters.collection || null,
                limit: 1000, // Get all results for client-side filtering
                sortBy: this.sortBy
            };

            // Perform search
            const result = await this.queryService.search(query, searchOptions);

            // Apply client-side filters
            this.currentResults = this.applyFilters(result.items || []);
            this.totalResults = this.currentResults.length;

            const searchTime = performance.now() - this.searchStartTime;
            console.log(`[CorpusExplorerPage] Found ${this.totalResults} results in ${searchTime.toFixed(2)}ms`);

            // Add to history
            this.addToHistory(query, this.totalResults);

            // Render results
            this.renderResults();

            // Update search time display
            const searchTimeEl = document.getElementById('search-time');
            if (searchTimeEl) {
                searchTimeEl.textContent = `(${searchTime.toFixed(0)}ms)`;
            }

            // Update URL
            this.updateURL(query);

            // Track analytics
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackSearch(query, this.currentFilters, this.totalResults);
            }

        } catch (error) {
            console.error('[CorpusExplorerPage] Search failed:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    /**
     * Apply client-side filters to results
     */
    applyFilters(results) {
        return results.filter(entity => {
            // Importance filter
            const importance = entity.importance || 50;
            const minImportance = this.currentFilters.importance * 20; // Convert 1-5 to 20-100
            if (importance < minImportance) {
                return false;
            }

            // Image filter
            if (this.currentFilters.hasImage !== null) {
                const hasImage = !!(entity.image || entity.gridDisplay?.image || entity.icon);
                if (hasImage !== this.currentFilters.hasImage) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * On filter change handler
     */
    onFilterChange() {
        if (this.currentQuery) {
            this.performSearch(this.currentQuery);
        }
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        // Reset filter values
        this.currentFilters = {
            collection: '',
            mythology: '',
            searchMode: 'generic',
            importance: 1,
            hasImage: null
        };

        // Reset UI
        const collectionFilter = document.getElementById('collection-filter');
        const mythologyFilter = document.getElementById('mythology-filter');
        const searchModeFilter = document.getElementById('search-mode');
        const importanceFilter = document.getElementById('importance-filter');
        const imageFilter = document.getElementById('image-filter');

        if (collectionFilter) collectionFilter.value = '';
        if (mythologyFilter) mythologyFilter.value = '';
        if (searchModeFilter) searchModeFilter.value = 'generic';
        if (importanceFilter) {
            importanceFilter.value = 1;
            const valueDisplay = document.getElementById('importance-value');
            if (valueDisplay) valueDisplay.textContent = '1';
        }
        if (imageFilter) imageFilter.value = '';

        // Re-run search if there's a query
        if (this.currentQuery) {
            this.performSearch(this.currentQuery);
        }
    }

    /**
     * Render search results
     */
    renderResults() {
        const resultsContainer = document.getElementById('search-results');
        const resultsControls = document.getElementById('results-controls');
        const paginationContainer = document.getElementById('pagination');
        const placeholder = document.getElementById('search-placeholder');

        if (!resultsContainer) return;

        // Hide placeholder
        if (placeholder) placeholder.style.display = 'none';

        if (this.totalResults === 0) {
            resultsContainer.innerHTML = this.getNoResultsHTML();
            if (resultsControls) resultsControls.style.display = 'none';
            if (paginationContainer) paginationContainer.style.display = 'none';
            return;
        }

        // Show controls
        if (resultsControls) resultsControls.style.display = 'flex';

        // Update results count
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            resultsCount.textContent = `${this.totalResults} result${this.totalResults !== 1 ? 's' : ''}`;
        }

        // Sort results
        const sortedResults = this.sortResults([...this.currentResults]);

        // Paginate
        const startIdx = (this.currentPage - 1) * this.resultsPerPage;
        const endIdx = startIdx + this.resultsPerPage;
        const pageResults = sortedResults.slice(startIdx, endIdx);

        // Render based on display mode
        switch (this.displayMode) {
            case 'grid':
                resultsContainer.innerHTML = this.renderGridView(pageResults);
                break;
            case 'list':
                resultsContainer.innerHTML = this.renderListView(pageResults);
                break;
            case 'table':
                resultsContainer.innerHTML = this.renderTableView(pageResults);
                break;
        }

        // Render pagination
        this.renderPagination();
    }

    /**
     * Render grid view
     */
    renderGridView(results) {
        return `
            <div class="entity-grid corpus-grid">
                ${results.map(entity => this.renderEntityCard(entity)).join('')}
            </div>
        `;
    }

    /**
     * Render entity card for grid view
     */
    renderEntityCard(entity) {
        const mythology = entity.mythology || 'unknown';
        const entityType = entity.type || entity.collection || 'entity';
        const entityId = entity.id || entity.name?.toLowerCase().replace(/\s+/g, '-');
        const icon = entity.icon || entity.gridDisplay?.icon || 'Entity';
        const name = entity.name || 'Unknown';
        const subtitle = entity.subtitle || entity.description?.substring(0, 80) || '';
        const importance = entity.importance || 50;
        const stars = Math.round(importance / 20);

        const highlightedName = this.highlightMatch(name, this.currentQuery);

        return `
            <a href="index.html#/mythology/${mythology}/${entityType}/${entityId}" class="entity-card corpus-card">
                <div class="card-badge">${this.formatMythologyName(mythology)}</div>
                <div class="card-icon">${icon}</div>
                <h3 class="card-title">${highlightedName}</h3>
                <p class="card-subtitle">${this.escapeHtml(subtitle)}${subtitle.length > 80 ? '...' : ''}</p>
                <div class="card-footer">
                    <span class="card-type">${this.formatEntityType(entityType)}</span>
                    <span class="card-importance">${'*'.repeat(stars)}</span>
                </div>
            </a>
        `;
    }

    /**
     * Render list view
     */
    renderListView(results) {
        return `
            <ul class="entity-list corpus-list">
                ${results.map(entity => this.renderListItem(entity)).join('')}
            </ul>
        `;
    }

    /**
     * Render list item
     */
    renderListItem(entity) {
        const mythology = entity.mythology || 'unknown';
        const entityType = entity.type || entity.collection || 'entity';
        const entityId = entity.id || entity.name?.toLowerCase().replace(/\s+/g, '-');
        const icon = entity.icon || entity.gridDisplay?.icon || 'Entity';
        const name = entity.name || 'Unknown';
        const description = entity.description || '';

        return `
            <li class="entity-list-item">
                <a href="index.html#/mythology/${mythology}/${entityType}/${entityId}" class="list-item-main">
                    <div class="list-icon">${icon}</div>
                    <div class="list-content">
                        <div class="list-primary">${this.escapeHtml(name)}</div>
                        <div class="list-secondary">${this.escapeHtml(description.substring(0, 150))}${description.length > 150 ? '...' : ''}</div>
                        <div class="list-meta">${this.formatMythologyName(mythology)} - ${this.formatEntityType(entityType)}</div>
                    </div>
                </a>
            </li>
        `;
    }

    /**
     * Render table view
     */
    renderTableView(results) {
        return `
            <div class="entity-table-container">
                <table class="entity-table corpus-table">
                    <thead>
                        <tr>
                            <th>Icon</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Mythology</th>
                            <th>Importance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(entity => this.renderTableRow(entity)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render table row
     */
    renderTableRow(entity) {
        const mythology = entity.mythology || 'unknown';
        const entityType = entity.type || entity.collection || 'entity';
        const entityId = entity.id || entity.name?.toLowerCase().replace(/\s+/g, '-');
        const icon = entity.icon || entity.gridDisplay?.icon || 'Entity';
        const name = entity.name || 'Unknown';
        const importance = entity.importance || 50;
        const stars = Math.round(importance / 20);

        return `
            <tr onclick="window.location.href='index.html#/mythology/${mythology}/${entityType}/${entityId}'" class="clickable-row">
                <td class="table-icon">${icon}</td>
                <td><strong>${this.escapeHtml(name)}</strong></td>
                <td>${this.formatEntityType(entityType)}</td>
                <td>${this.formatMythologyName(mythology)}</td>
                <td>${'*'.repeat(stars)}</td>
            </tr>
        `;
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.totalResults / this.resultsPerPage);

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        let html = '';

        // Previous button
        html += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="corpusExplorerInstance.goToPage(${this.currentPage - 1})">
                Previous
            </button>
        `;

        // Page numbers
        const maxVisible = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="corpusExplorerInstance.goToPage(1)">1</button>`;
            if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            html += `
                <button class="pagination-btn ${isActive ? 'active' : ''}" onclick="corpusExplorerInstance.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
            html += `<button class="pagination-btn" onclick="corpusExplorerInstance.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        html += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="corpusExplorerInstance.goToPage(${this.currentPage + 1})">
                Next
            </button>
        `;

        paginationContainer.innerHTML = html;
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.totalResults / this.resultsPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.renderResults();

        // Scroll to top of results
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Sort results
     */
    sortResults(results) {
        switch (this.sortBy) {
            case 'relevance':
                return results.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
            case 'name':
                return results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            case 'importance':
                return results.sort((a, b) => (b.importance || 50) - (a.importance || 50));
            case 'popularity':
                return results.sort((a, b) => (b.popularity || 50) - (a.popularity || 50));
            default:
                return results;
        }
    }

    /**
     * Show autocomplete suggestions
     */
    async showAutocomplete(query) {
        try {
            const suggestions = await this.queryService.getSuggestions(query, 8);
            const container = document.getElementById('search-suggestions');

            if (!container || !suggestions || suggestions.length === 0) {
                this.hideAutocomplete();
                return;
            }

            container.innerHTML = suggestions.map(term => `
                <div class="suggestion-item" data-query="${this.escapeHtml(term)}">
                    ${this.highlightMatch(term, query)}
                </div>
            `).join('');

            // Add click handlers
            container.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const q = e.currentTarget.dataset.query;
                    document.getElementById('corpus-search-input').value = q;
                    this.performSearch(q);
                    this.hideAutocomplete();
                });
            });

            container.style.display = 'block';
        } catch (error) {
            console.error('[CorpusExplorerPage] Autocomplete failed:', error);
        }
    }

    /**
     * Hide autocomplete
     */
    hideAutocomplete() {
        const container = document.getElementById('search-suggestions');
        if (container) container.style.display = 'none';
    }

    /**
     * Show save query modal
     */
    showSaveQueryModal() {
        if (!this.currentQuery) {
            this.showToast('Enter a search query first', 'warning');
            return;
        }

        const modal = document.getElementById('save-query-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('query-name').value = this.currentQuery;
            document.getElementById('query-description').value = '';
            document.getElementById('query-name').focus();
        }
    }

    /**
     * Save current search as query template
     */
    async saveAsQuery() {
        const nameInput = document.getElementById('query-name');
        const descInput = document.getElementById('query-description');

        const name = nameInput?.value?.trim();
        const description = descInput?.value?.trim();

        if (!name) {
            this.showToast('Please enter a query name', 'warning');
            return;
        }

        const savedQuery = {
            id: Date.now().toString(),
            name: name,
            description: description,
            query: this.currentQuery,
            filters: { ...this.currentFilters },
            options: { ...this.searchOptions },
            createdAt: new Date().toISOString()
        };

        // Add to saved queries
        this.savedQueries.unshift(savedQuery);

        // Limit saved queries
        if (this.savedQueries.length > 20) {
            this.savedQueries = this.savedQueries.slice(0, 20);
        }

        // Save to localStorage
        this.saveSavedQueries();

        // Update UI
        this.renderSavedQueries();

        this.showToast('Query saved successfully', 'success');
        console.log('[CorpusExplorerPage] Query saved:', savedQuery);
    }

    /**
     * Load saved query
     */
    loadSavedQuery(queryId) {
        const savedQuery = this.savedQueries.find(q => q.id === queryId);
        if (!savedQuery) return;

        // Restore query
        const searchInput = document.getElementById('corpus-search-input');
        if (searchInput) searchInput.value = savedQuery.query;

        // Restore filters
        this.currentFilters = { ...savedQuery.filters };
        this.updateFilterUI();

        // Restore options
        this.searchOptions = { ...savedQuery.options };
        this.updateOptionsUI();

        // Perform search
        this.performSearch(savedQuery.query);
    }

    /**
     * Delete saved query
     */
    deleteSavedQuery(queryId) {
        this.savedQueries = this.savedQueries.filter(q => q.id !== queryId);
        this.saveSavedQueries();
        this.renderSavedQueries();
        this.showToast('Query deleted', 'success');
    }

    /**
     * Render saved queries list
     */
    renderSavedQueries() {
        const container = document.getElementById('saved-queries-list');
        if (!container) return;

        if (this.savedQueries.length === 0) {
            container.innerHTML = '<p class="no-queries-message">No saved queries yet</p>';
            return;
        }

        container.innerHTML = this.savedQueries.map(query => `
            <div class="saved-query-item" data-id="${query.id}">
                <div class="saved-query-info" onclick="corpusExplorerInstance.loadSavedQuery('${query.id}')">
                    <span class="saved-query-name">${this.escapeHtml(query.name)}</span>
                    <span class="saved-query-meta">${this.escapeHtml(query.query)}</span>
                </div>
                <button class="saved-query-delete" onclick="corpusExplorerInstance.deleteSavedQuery('${query.id}')" aria-label="Delete query">
                    Delete
                </button>
            </div>
        `).join('');
    }

    /**
     * Load mythologies for filter dropdown
     */
    async loadMythologies() {
        try {
            const snapshot = await this.db.collection('mythologies').get();
            const mythologyFilter = document.getElementById('mythology-filter');

            if (mythologyFilter && snapshot.size > 0) {
                const mythologies = [];
                snapshot.forEach(doc => {
                    mythologies.push({
                        id: doc.id,
                        name: doc.data().name || this.formatMythologyName(doc.id)
                    });
                });

                mythologies.sort((a, b) => a.name.localeCompare(b.name));

                // Keep existing options and add from Firebase
                const existingOptions = Array.from(mythologyFilter.options).map(o => o.value);

                mythologies.forEach(m => {
                    if (!existingOptions.includes(m.id)) {
                        const option = document.createElement('option');
                        option.value = m.id;
                        option.textContent = m.name;
                        mythologyFilter.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.warn('[CorpusExplorerPage] Could not load mythologies:', error);
        }
    }

    /**
     * Handle URL parameters
     */
    handleURLParameters() {
        const params = new URLSearchParams(window.location.search);

        const query = params.get('q');
        if (query) {
            document.getElementById('corpus-search-input').value = query;
            this.performSearch(query);
        }

        const mythology = params.get('mythology');
        if (mythology) {
            this.currentFilters.mythology = mythology;
            const mythologyFilter = document.getElementById('mythology-filter');
            if (mythologyFilter) mythologyFilter.value = mythology;
        }

        const collection = params.get('collection');
        if (collection) {
            this.currentFilters.collection = collection;
            const collectionFilter = document.getElementById('collection-filter');
            if (collectionFilter) collectionFilter.value = collection;
        }
    }

    /**
     * Update URL with search parameters
     */
    updateURL(query) {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (this.currentFilters.mythology) params.set('mythology', this.currentFilters.mythology);
        if (this.currentFilters.collection) params.set('collection', this.currentFilters.collection);

        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newURL);
    }

    /**
     * Update filter UI from current state
     */
    updateFilterUI() {
        const collectionFilter = document.getElementById('collection-filter');
        const mythologyFilter = document.getElementById('mythology-filter');
        const searchModeFilter = document.getElementById('search-mode');
        const importanceFilter = document.getElementById('importance-filter');
        const imageFilter = document.getElementById('image-filter');

        if (collectionFilter) collectionFilter.value = this.currentFilters.collection || '';
        if (mythologyFilter) mythologyFilter.value = this.currentFilters.mythology || '';
        if (searchModeFilter) searchModeFilter.value = this.currentFilters.searchMode || 'generic';
        if (importanceFilter) {
            importanceFilter.value = this.currentFilters.importance || 1;
            const valueDisplay = document.getElementById('importance-value');
            if (valueDisplay) valueDisplay.textContent = this.currentFilters.importance || 1;
        }
        if (imageFilter) {
            imageFilter.value = this.currentFilters.hasImage === null ? '' : this.currentFilters.hasImage.toString();
        }
    }

    /**
     * Update options UI from current state
     */
    updateOptionsUI() {
        const caseSensitive = document.getElementById('case-sensitive');
        const exactMatch = document.getElementById('exact-match');
        const includeDescriptions = document.getElementById('include-descriptions');

        if (caseSensitive) caseSensitive.checked = this.searchOptions.caseSensitive;
        if (exactMatch) exactMatch.checked = this.searchOptions.exactMatch;
        if (includeDescriptions) includeDescriptions.checked = this.searchOptions.includeDescriptions;
    }

    /**
     * Search history management
     */
    addToHistory(query, resultCount) {
        // Remove duplicates
        this.searchHistory = this.searchHistory.filter(h => h.query !== query);

        // Add to front
        this.searchHistory.unshift({
            query,
            resultCount,
            timestamp: Date.now()
        });

        // Trim to max size
        if (this.searchHistory.length > this.maxHistorySize) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }

        this.saveSearchHistory();
    }

    /**
     * Load/save state from localStorage
     */
    loadSavedState() {
        try {
            // Load search history
            const history = localStorage.getItem('corpusSearchHistory');
            if (history) {
                this.searchHistory = JSON.parse(history);
            }

            // Load saved queries
            const queries = localStorage.getItem('corpusSavedQueries');
            if (queries) {
                this.savedQueries = JSON.parse(queries);
            }
        } catch (error) {
            console.warn('[CorpusExplorerPage] Could not load saved state:', error);
        }
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('corpusSearchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('[CorpusExplorerPage] Could not save search history:', error);
        }
    }

    loadSavedQueries() {
        // Already loaded in loadSavedState
        this.renderSavedQueries();
    }

    saveSavedQueries() {
        try {
            localStorage.setItem('corpusSavedQueries', JSON.stringify(this.savedQueries));
        } catch (error) {
            console.warn('[CorpusExplorerPage] Could not save queries:', error);
        }
    }

    /**
     * UI helpers
     */
    showLoading() {
        const resultsContainer = document.getElementById('search-results');
        const placeholder = document.getElementById('search-placeholder');

        if (placeholder) placeholder.style.display = 'none';

        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="search-loading">
                    <div class="spinner"></div>
                    <p>Searching...</p>
                </div>
            `;
        }

        const resultsControls = document.getElementById('results-controls');
        if (resultsControls) resultsControls.style.display = 'none';

        const pagination = document.getElementById('pagination');
        if (pagination) pagination.style.display = 'none';
    }

    showPlaceholder() {
        const resultsContainer = document.getElementById('search-results');
        const placeholder = document.getElementById('search-placeholder');
        const resultsControls = document.getElementById('results-controls');
        const pagination = document.getElementById('pagination');

        if (resultsContainer) resultsContainer.innerHTML = '';
        if (placeholder) placeholder.style.display = 'block';
        if (resultsControls) resultsControls.style.display = 'none';
        if (pagination) pagination.style.display = 'none';

        // Reset state
        this.currentResults = [];
        this.totalResults = 0;
        this.currentQuery = '';
    }

    showError(message) {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="search-error">
                    <div class="error-icon">Error</div>
                    <h3>Search Error</h3>
                    <p>${this.escapeHtml(message)}</p>
                    <button class="btn-primary" onclick="corpusExplorerInstance.performSearch('${this.escapeHtml(this.currentQuery)}')">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    showToast(message, type = 'info') {
        if (window.ToastNotifications) {
            window.ToastNotifications.show(message, type);
        } else {
            console.log(`[Toast ${type}] ${message}`);
        }
    }

    getNoResultsHTML() {
        return `
            <div class="no-results">
                <div class="no-results-icon">No Results</div>
                <h3>No results found for "${this.escapeHtml(this.currentQuery)}"</h3>
                <p>Try different keywords or adjust your filters</p>
                <button class="btn-secondary" onclick="corpusExplorerInstance.clearAllFilters()">
                    Clear All Filters
                </button>
            </div>
        `;
    }

    /**
     * Utility methods
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    highlightMatch(text, query) {
        if (!query || !text) return this.escapeHtml(text);
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return this.escapeHtml(text);

        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);

        return `${this.escapeHtml(before)}<strong class="highlight">${this.escapeHtml(match)}</strong>${this.escapeHtml(after)}`;
    }

    formatMythologyName(id) {
        if (!id) return 'Unknown';
        return id.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatEntityType(type) {
        if (!type) return 'Entity';
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        console.log('[CorpusExplorerPage] Destroying instance');

        // Clear timers
        if (this.autocompleteTimer) {
            clearTimeout(this.autocompleteTimer);
            this.autocompleteTimer = null;
        }

        // Clear global reference
        if (window.corpusExplorerInstance === this) {
            window.corpusExplorerInstance = null;
        }
    }
}

// Global instance for event handlers
let corpusExplorerInstance = null;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CorpusExplorerPage;
}

// Global export for browser
if (typeof window !== 'undefined') {
    window.CorpusExplorerPage = CorpusExplorerPage;
}
