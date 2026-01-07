/**
 * Complete Search View Component - Polished Edition
 *
 * Full-featured search interface with:
 * - Large, prominent search bar with clear button
 * - Horizontally scrollable filter chips
 * - Grid layout results with match highlighting
 * - Text truncation (2 lines title, 3 lines description)
 * - Skeleton loading with minimum 300ms display
 * - Results count with pagination info
 * - Full keyboard navigation support
 * - Virtual scrolling for large result sets
 */

class SearchViewComplete {
    constructor(firestoreInstance) {
        if (!firestoreInstance) {
            throw new Error('Firestore instance is required');
        }

        this.db = firestoreInstance;
        this.virtualScroller = null;

        // Initialize search engine (prefer enhanced version)
        if (typeof EnhancedCorpusSearch !== 'undefined') {
            this.searchEngine = new EnhancedCorpusSearch(firestoreInstance);
            console.log('[SearchView] Using EnhancedCorpusSearch');
        } else if (typeof CorpusSearch !== 'undefined') {
            this.searchEngine = new CorpusSearch(firestoreInstance);
            console.log('[SearchView] Using CorpusSearch');
        } else {
            throw new Error('CorpusSearch component not loaded');
        }

        // State
        this.state = {
            query: '',
            results: [],
            totalResults: 0,
            currentPage: 1,
            resultsPerPage: 20,
            displayMode: 'grid',
            sortBy: 'relevance',
            filters: {
                mythology: '',
                entityTypes: ['deities', 'heroes', 'creatures', 'items', 'places', 'texts'],
                importance: [1, 5],
                hasImage: null
            },
            activeFilters: [],
            isLoading: false,
            error: null,
            focusedResultIndex: -1,
            searchStartTime: null
        };

        // Debounce timer for autocomplete
        this.autocompleteTimer = null;
        this.autocompleteDelay = 300;
        this.minLoadingTime = 300; // Minimum loading display time

        // Search history
        this.searchHistory = this.loadSearchHistory();
        this.maxHistorySize = 10;

        // Available mythologies (will be loaded from Firebase)
        this.mythologies = [];

        // Entity type filter chips
        this.entityTypeChips = [
            { id: 'all', label: 'All', icon: null },
            { id: 'deities', label: 'Deities', icon: null },
            { id: 'heroes', label: 'Heroes', icon: null },
            { id: 'creatures', label: 'Creatures', icon: null },
            { id: 'items', label: 'Items', icon: null },
            { id: 'places', label: 'Places', icon: null },
            { id: 'texts', label: 'Texts', icon: null },
            { id: 'symbols', label: 'Symbols', icon: null },
            { id: 'rituals', label: 'Rituals', icon: null }
        ];

        // Event listener cleanup tracking
        this.boundHandlers = {};
        this.activeTimers = [];
        this.elements = {};
        this.isDestroyed = false;
    }

    /**
     * Main render method - initializes the search interface
     */
    async render(container) {
        console.log('[SearchView] Rendering search interface');

        try {
            // Load mythologies
            await this.loadMythologies();

            // Render HTML
            container.innerHTML = this.getHTML();

            // Initialize components
            await this.init();

            console.log('[SearchView] Search interface rendered successfully');
        } catch (error) {
            console.error('[SearchView] Render failed:', error);
            container.innerHTML = `
                <div class="search-error-container">
                    <div class="search-error">
                        <div class="error-icon">!</div>
                        <h2>Failed to load search</h2>
                        <p>${error.message}</p>
                        <button class="btn-primary" onclick="location.reload()">Retry</button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Load available mythologies from Firestore
     */
    async loadMythologies() {
        try {
            const snapshot = await this.db.collection('mythologies').get();
            this.mythologies = [];
            snapshot.forEach(doc => {
                this.mythologies.push({
                    id: doc.id,
                    name: doc.data().name || this.formatMythologyName(doc.id)
                });
            });
            this.mythologies.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.warn('[SearchView] Could not load mythologies:', error);
            this.mythologies = [
                { id: 'greek', name: 'Greek' },
                { id: 'norse', name: 'Norse' },
                { id: 'egyptian', name: 'Egyptian' },
                { id: 'hindu', name: 'Hindu' },
                { id: 'buddhist', name: 'Buddhist' },
                { id: 'christian', name: 'Christian' },
                { id: 'babylonian', name: 'Babylonian' },
                { id: 'sumerian', name: 'Sumerian' },
                { id: 'celtic', name: 'Celtic' },
                { id: 'japanese', name: 'Japanese' },
                { id: 'chinese', name: 'Chinese' }
            ];
        }
    }

    formatMythologyName(id) {
        return id.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Generate main HTML structure
     */
    getHTML() {
        return `
            <div class="search-view">
                <!-- Search Header with Hero -->
                <header class="search-header">
                    <div class="search-hero">
                        <h1 class="search-title">Search Mythology</h1>
                        <p class="search-subtitle">Explore deities, heroes, creatures, and more across world mythologies</p>
                    </div>

                    <!-- Prominent Search Bar -->
                    <div class="search-bar-container">
                        <div class="search-input-wrapper" role="search">
                            <span class="search-icon" aria-hidden="true">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="M21 21l-4.35-4.35"></path>
                                </svg>
                            </span>
                            <input
                                type="text"
                                id="search-input"
                                class="search-input"
                                placeholder="Search mythology..."
                                autocomplete="off"
                                aria-label="Search mythology"
                                value="${this.escapeHtml(this.state.query)}"
                            >
                            <button id="clear-search" class="clear-btn" aria-label="Clear search" style="display: none;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                            <button id="search-btn" class="search-submit-btn" aria-label="Search">
                                Search
                            </button>
                        </div>
                        <div id="autocomplete-results" class="search-suggestions" role="listbox" aria-label="Search suggestions"></div>
                    </div>
                </header>

                <!-- Filter Chips - Horizontally Scrollable -->
                <div class="filter-chips-container">
                    <div class="filter-chips-scroll" role="tablist" aria-label="Filter by category">
                        ${this.getFilterChipsHTML()}
                    </div>
                    <div class="filter-chips-fade filter-chips-fade-left"></div>
                    <div class="filter-chips-fade filter-chips-fade-right"></div>
                </div>

                <!-- Mythology Sub-filters -->
                <div class="mythology-filters-container">
                    <div class="mythology-filters-scroll">
                        <button class="mythology-chip active" data-mythology="" role="tab" aria-selected="true">
                            All Mythologies
                        </button>
                        ${this.mythologies.map(m => `
                            <button class="mythology-chip" data-mythology="${m.id}" role="tab" aria-selected="false">
                                ${m.name}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Main Content Area -->
                <main class="search-main">
                    <!-- Results Header -->
                    <div id="results-header" class="results-header" style="display: none;">
                        <div class="results-count-info">
                            <span id="results-count" class="results-count"></span>
                            <span id="pagination-info" class="pagination-info"></span>
                        </div>
                        <div class="results-controls">
                            <div class="display-mode-switcher" role="group" aria-label="Display mode">
                                <button class="display-mode-btn active" data-mode="grid" title="Grid view" aria-pressed="true">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                                        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                                        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                                        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                                    </svg>
                                </button>
                                <button class="display-mode-btn" data-mode="list" title="List view" aria-pressed="false">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="3" y="4" width="18" height="4" rx="1"></rect>
                                        <rect x="3" y="10" width="18" height="4" rx="1"></rect>
                                        <rect x="3" y="16" width="18" height="4" rx="1"></rect>
                                    </svg>
                                </button>
                            </div>
                            <div class="sort-controls">
                                <label for="sort-select">Sort:</label>
                                <select id="sort-select" class="sort-select">
                                    <option value="relevance">Relevance</option>
                                    <option value="name">Name (A-Z)</option>
                                    <option value="importance">Importance</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Results Container -->
                    <div id="results-container" class="search-results" role="main" aria-live="polite">
                        ${this.getEmptyStateHTML()}
                    </div>

                    <!-- Pagination -->
                    <nav id="pagination" class="pagination" aria-label="Search results pagination" style="display: none;"></nav>
                </main>
            </div>
        `;
    }

    /**
     * Generate filter chips HTML
     */
    getFilterChipsHTML() {
        return this.entityTypeChips.map((chip, index) => `
            <button
                class="filter-chip ${chip.id === 'all' ? 'active' : ''}"
                data-type="${chip.id}"
                role="tab"
                aria-selected="${chip.id === 'all' ? 'true' : 'false'}"
                tabindex="${index === 0 ? '0' : '-1'}"
            >
                ${chip.label}
            </button>
        `).join('');
    }

    /**
     * Generate empty state HTML
     */
    getEmptyStateHTML() {
        return `
            <div class="search-placeholder">
                <div class="placeholder-visual">
                    <svg class="placeholder-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="M21 21l-4.35-4.35"></path>
                    </svg>
                </div>
                <p class="placeholder-text">Enter a search term to discover mythological entities</p>
                <div class="search-examples">
                    <p class="examples-label">Try searching for:</p>
                    <div class="example-queries">
                        <button class="example-query" data-query="zeus">Zeus</button>
                        <button class="example-query" data-query="odin">Odin</button>
                        <button class="example-query" data-query="ra">Ra</button>
                        <button class="example-query" data-query="shiva">Shiva</button>
                        <button class="example-query" data-query="dragon">Dragon</button>
                        <button class="example-query" data-query="underworld">Underworld</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate no results HTML
     */
    getNoResultsHTML() {
        const suggestions = this.getSuggestions();
        return `
            <div class="no-results">
                <div class="no-results-visual">
                    <svg class="no-results-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="M21 21l-4.35-4.35"></path>
                        <path d="M8 8l6 6M14 8l-6 6" stroke-width="2"></path>
                    </svg>
                </div>
                <h3 class="no-results-title">No results found for "${this.escapeHtml(this.state.query)}"</h3>
                <p class="no-results-hint">Try different keywords or clear filters</p>
                <div class="no-results-actions">
                    <button id="clear-all-filters-btn" class="btn-primary">
                        Clear Filters
                    </button>
                    <button id="try-again-btn" class="btn-secondary">
                        Modify Search
                    </button>
                </div>
                ${suggestions.length > 0 ? `
                    <div class="related-suggestions">
                        <p class="suggestions-label">You might like:</p>
                        <div class="suggestion-chips">
                            ${suggestions.map(s => `
                                <button class="suggestion-chip" data-query="${this.escapeHtml(s)}">${this.escapeHtml(s)}</button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get search suggestions based on current query
     */
    getSuggestions() {
        const common = ['zeus', 'odin', 'thor', 'ra', 'anubis', 'athena', 'poseidon', 'hades'];
        const query = this.state.query.toLowerCase();
        return common.filter(s => !s.includes(query)).slice(0, 4);
    }

    /**
     * Generate skeleton loading HTML
     */
    getLoadingHTML() {
        const skeletonCount = 8;
        const skeletons = Array(skeletonCount).fill(0).map(() => `
            <div class="skeleton-card">
                <div class="skeleton-badge"></div>
                <div class="skeleton-icon"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-subtitle"></div>
                <div class="skeleton-subtitle short"></div>
                <div class="skeleton-meta">
                    <div class="skeleton-meta-item"></div>
                    <div class="skeleton-meta-item"></div>
                </div>
            </div>
        `).join('');

        return `
            <div class="search-loading">
                <div class="skeleton-grid">
                    ${skeletons}
                </div>
                <p class="loading-text">Searching across mythologies...</p>
            </div>
        `;
    }

    /**
     * Initialize event listeners and components
     */
    async init() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const clearBtn = document.getElementById('clear-search');
        const sortSelect = document.getElementById('sort-select');

        // Store element references
        this.elements = { searchInput, searchBtn, clearBtn, sortSelect };

        // Search input handlers
        this.boundHandlers.onInput = this.handleSearchInput.bind(this);
        this.boundHandlers.onKeydown = this.handleKeydown.bind(this);
        this.boundHandlers.onSearch = () => this.performSearch(searchInput.value);
        this.boundHandlers.onClear = this.handleClear.bind(this);
        this.boundHandlers.onSort = this.handleSort.bind(this);
        this.boundHandlers.onDocClick = this.handleDocumentClick.bind(this);

        searchInput.addEventListener('input', this.boundHandlers.onInput);
        searchInput.addEventListener('keydown', this.boundHandlers.onKeydown);
        searchBtn.addEventListener('click', this.boundHandlers.onSearch);
        clearBtn.addEventListener('click', this.boundHandlers.onClear);
        sortSelect.addEventListener('change', this.boundHandlers.onSort);
        document.addEventListener('click', this.boundHandlers.onDocClick);

        // Filter chip handlers
        this.initFilterChips();

        // Mythology filter handlers
        this.initMythologyFilters();

        // Display mode handlers
        this.initDisplayModes();

        // Example query handlers
        this.initExampleQueries();

        // Set global instance for pagination
        window.searchViewInstance = this;
        console.log('[SearchView] Initialization complete');
    }

    /**
     * Handle search input changes
     */
    handleSearchInput(e) {
        const query = e.target.value.trim();
        const clearBtn = this.elements.clearBtn;

        // Show/hide clear button
        clearBtn.style.display = query ? 'flex' : 'none';

        // Debounced autocomplete
        clearTimeout(this.autocompleteTimer);
        if (query.length >= 2) {
            this.autocompleteTimer = setTimeout(() => {
                this.showAutocomplete(query);
            }, this.autocompleteDelay);
        } else {
            this.hideAutocomplete();
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeydown(e) {
        const autocomplete = document.getElementById('autocomplete-results');
        const suggestions = autocomplete?.querySelectorAll('.suggestion-item') || [];
        const resultsContainer = document.getElementById('results-container');
        const resultCards = resultsContainer?.querySelectorAll('.entity-card, .entity-list-item') || [];

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (this.state.focusedResultIndex >= 0 && suggestions.length > 0) {
                    // Select focused autocomplete suggestion
                    const focusedSuggestion = suggestions[this.state.focusedResultIndex];
                    if (focusedSuggestion) {
                        const query = focusedSuggestion.dataset.query;
                        this.elements.searchInput.value = query;
                        this.performSearch(query);
                        this.hideAutocomplete();
                    }
                } else {
                    // Perform search
                    this.performSearch(this.elements.searchInput.value);
                }
                break;

            case 'Escape':
                e.preventDefault();
                if (autocomplete?.style.display !== 'none') {
                    this.hideAutocomplete();
                } else if (this.elements.searchInput.value) {
                    this.handleClear();
                }
                this.state.focusedResultIndex = -1;
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (suggestions.length > 0) {
                    this.state.focusedResultIndex = Math.min(
                        this.state.focusedResultIndex + 1,
                        suggestions.length - 1
                    );
                    this.updateFocusedSuggestion(suggestions);
                } else if (resultCards.length > 0) {
                    this.focusNextResult(resultCards, 1);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (suggestions.length > 0) {
                    this.state.focusedResultIndex = Math.max(
                        this.state.focusedResultIndex - 1,
                        0
                    );
                    this.updateFocusedSuggestion(suggestions);
                } else if (resultCards.length > 0) {
                    this.focusNextResult(resultCards, -1);
                }
                break;
        }
    }

    /**
     * Update focused suggestion styling
     */
    updateFocusedSuggestion(suggestions) {
        suggestions.forEach((s, i) => {
            s.classList.toggle('focused', i === this.state.focusedResultIndex);
        });
    }

    /**
     * Focus next/previous result card
     */
    focusNextResult(cards, direction) {
        const currentFocus = document.activeElement;
        const currentIndex = Array.from(cards).indexOf(currentFocus);
        const nextIndex = currentIndex + direction;

        if (nextIndex >= 0 && nextIndex < cards.length) {
            cards[nextIndex].focus();
        }
    }

    /**
     * Handle clear button click
     */
    handleClear() {
        this.elements.searchInput.value = '';
        this.elements.searchInput.focus();
        this.elements.clearBtn.style.display = 'none';
        this.hideAutocomplete();
        this.state.query = '';
        this.showEmptyState();
    }

    /**
     * Handle sort change
     */
    handleSort(e) {
        this.state.sortBy = e.target.value;
        if (this.state.results.length > 0) {
            this.renderResults();
        }
    }

    /**
     * Handle document click (close autocomplete)
     */
    handleDocumentClick(e) {
        const autocomplete = document.getElementById('autocomplete-results');
        const searchInput = this.elements.searchInput;
        if (autocomplete && searchInput && !searchInput.contains(e.target) && !autocomplete.contains(e.target)) {
            this.hideAutocomplete();
        }
    }

    /**
     * Initialize filter chips
     */
    initFilterChips() {
        const chips = document.querySelectorAll('.filter-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const type = chip.dataset.type;

                if (type === 'all') {
                    // Select all types
                    this.state.filters.entityTypes = ['deities', 'heroes', 'creatures', 'items', 'places', 'texts', 'symbols', 'rituals'];
                    chips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                } else {
                    // Toggle individual type
                    const allChip = document.querySelector('.filter-chip[data-type="all"]');
                    allChip?.classList.remove('active');

                    if (chip.classList.contains('active')) {
                        chip.classList.remove('active');
                        this.state.filters.entityTypes = this.state.filters.entityTypes.filter(t => t !== type);
                    } else {
                        chip.classList.add('active');
                        if (!this.state.filters.entityTypes.includes(type)) {
                            this.state.filters.entityTypes.push(type);
                        }
                    }

                    // If all types selected, activate "All" chip
                    if (this.state.filters.entityTypes.length >= 8) {
                        chips.forEach(c => c.classList.remove('active'));
                        allChip?.classList.add('active');
                    }
                }

                // Re-search if there's a query
                if (this.state.query) {
                    this.performSearch(this.state.query);
                }
            });
        });
    }

    /**
     * Initialize mythology filters
     */
    initMythologyFilters() {
        const chips = document.querySelectorAll('.mythology-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => {
                    c.classList.remove('active');
                    c.setAttribute('aria-selected', 'false');
                });
                chip.classList.add('active');
                chip.setAttribute('aria-selected', 'true');

                this.state.filters.mythology = chip.dataset.mythology;

                if (this.state.query) {
                    this.performSearch(this.state.query);
                }
            });
        });
    }

    /**
     * Initialize display mode buttons
     */
    initDisplayModes() {
        const buttons = document.querySelectorAll('.display-mode-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                this.state.displayMode = btn.dataset.mode;
                this.renderResults();
            });
        });
    }

    /**
     * Initialize example query buttons
     */
    initExampleQueries() {
        document.querySelectorAll('.example-query').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                this.elements.searchInput.value = query;
                this.performSearch(query);
            });
        });
    }

    /**
     * Show autocomplete suggestions
     */
    async showAutocomplete(query) {
        try {
            const suggestions = await this.searchEngine.getSuggestions(query, 8);
            const container = document.getElementById('autocomplete-results');

            if (!container) return;

            if (!suggestions || suggestions.length === 0) {
                this.hideAutocomplete();
                return;
            }

            this.state.focusedResultIndex = -1;

            container.innerHTML = suggestions.map((term, idx) => `
                <div class="suggestion-item" data-query="${this.escapeHtml(term)}" role="option" tabindex="-1">
                    <span class="suggestion-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                    </span>
                    <span class="suggestion-text">${this.highlightMatch(term, query)}</span>
                </div>
            `).join('');

            container.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const q = item.dataset.query;
                    this.elements.searchInput.value = q;
                    this.performSearch(q);
                    this.hideAutocomplete();
                });
            });

            container.style.display = 'block';
        } catch (error) {
            console.error('[SearchView] Autocomplete failed:', error);
        }
    }

    /**
     * Hide autocomplete
     */
    hideAutocomplete() {
        const container = document.getElementById('autocomplete-results');
        if (container) {
            container.style.display = 'none';
        }
        this.state.focusedResultIndex = -1;
    }

    /**
     * Perform search
     */
    async performSearch(query) {
        query = query.trim();

        if (!query || query.length < 2) {
            this.showEmptyState();
            return;
        }

        this.hideAutocomplete();
        this.state.query = query;
        this.state.currentPage = 1;
        this.state.isLoading = true;
        this.state.error = null;
        this.state.searchStartTime = Date.now();

        // Show loading state
        const resultsContainer = document.getElementById('results-container');
        const resultsHeader = document.getElementById('results-header');
        const pagination = document.getElementById('pagination');

        if (resultsContainer) {
            resultsContainer.innerHTML = this.getLoadingHTML();
        }
        if (resultsHeader) {
            resultsHeader.style.display = 'none';
        }
        if (pagination) {
            pagination.style.display = 'none';
        }

        try {
            console.log('[SearchView] Searching for:', query);

            const searchOptions = {
                mode: 'generic',
                mythology: this.state.filters.mythology || null,
                limit: 1000
            };

            const result = await this.searchEngine.search(query, searchOptions);

            // Apply client-side filters
            this.state.results = this.applyClientFilters(result.items || []);
            this.state.totalResults = this.state.results.length;

            console.log('[SearchView] Found', this.state.totalResults, 'results');

            // Ensure minimum loading time for smooth UX
            const elapsed = Date.now() - this.state.searchStartTime;
            if (elapsed < this.minLoadingTime) {
                await new Promise(resolve => setTimeout(resolve, this.minLoadingTime - elapsed));
            }

            // Track search event
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackSearch(query, {
                    mythology: this.state.filters.mythology,
                    entityTypes: this.state.filters.entityTypes.join(','),
                    hasImage: this.state.filters.hasImage
                }, this.state.totalResults);
            }

            // Save to history
            this.addToSearchHistory(query, this.state.totalResults);

            // Render results
            this.renderResults();

        } catch (error) {
            console.error('[SearchView] Search failed:', error);
            this.state.error = error.message;
            this.renderError();
        } finally {
            this.state.isLoading = false;
        }
    }

    /**
     * Apply client-side filters
     */
    applyClientFilters(results) {
        return results.filter(entity => {
            // Entity type filter
            if (this.state.filters.entityTypes.length > 0 && this.state.filters.entityTypes.length < 8) {
                const entityType = entity.type || entity.collection;
                if (!this.state.filters.entityTypes.includes(entityType)) {
                    return false;
                }
            }

            // Importance filter
            const importance = entity.importance || 50;
            const minImportance = this.state.filters.importance[0] * 20;
            if (importance < minImportance) {
                return false;
            }

            // Image filter
            if (this.state.filters.hasImage !== null) {
                const hasImage = !!(entity.image || entity.gridDisplay?.image);
                if (hasImage !== this.state.filters.hasImage) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Render search results
     */
    renderResults() {
        const resultsContainer = document.getElementById('results-container');
        const resultsHeader = document.getElementById('results-header');
        const pagination = document.getElementById('pagination');

        if (!resultsContainer || !resultsHeader || !pagination) return;

        if (this.state.totalResults === 0) {
            resultsContainer.innerHTML = this.getNoResultsHTML();
            resultsHeader.style.display = 'none';
            pagination.style.display = 'none';
            this.initNoResultsHandlers();
            this.destroyVirtualScroller();
            return;
        }

        // Show header
        resultsHeader.style.display = 'flex';

        // Update results count and pagination info
        const startIdx = (this.state.currentPage - 1) * this.state.resultsPerPage + 1;
        const endIdx = Math.min(this.state.currentPage * this.state.resultsPerPage, this.state.totalResults);

        document.getElementById('results-count').innerHTML = `
            Found <strong>${this.state.totalResults}</strong> result${this.state.totalResults !== 1 ? 's' : ''} for "<em>${this.escapeHtml(this.state.query)}</em>"
        `;
        document.getElementById('pagination-info').textContent = `Showing ${startIdx}-${endIdx} of ${this.state.totalResults}`;

        // Sort results
        const sortedResults = this.sortResults([...this.state.results]);

        // Use virtual scrolling for large result sets
        const useVirtualScrolling = sortedResults.length > 100;

        if (useVirtualScrolling) {
            pagination.style.display = 'none';
            this.destroyVirtualScroller();

            resultsContainer.innerHTML = '';
            resultsContainer.style.height = '600px';

            const itemHeight = this.getItemHeight(this.state.displayMode);

            this.virtualScroller = new VirtualScroller(resultsContainer, {
                itemHeight: itemHeight,
                bufferSize: 10,
                renderItem: (entity, index) => this.renderVirtualItem(entity, index, this.state.displayMode)
            });

            this.virtualScroller.setItems(sortedResults);
        } else {
            this.destroyVirtualScroller();
            resultsContainer.style.height = '';

            // Paginate
            const pageResults = sortedResults.slice(
                (this.state.currentPage - 1) * this.state.resultsPerPage,
                this.state.currentPage * this.state.resultsPerPage
            );

            // Render based on display mode
            if (this.state.displayMode === 'grid') {
                resultsContainer.innerHTML = this.renderGridView(pageResults);
            } else {
                resultsContainer.innerHTML = this.renderListView(pageResults);
            }

            // Add keyboard navigation to cards
            this.initCardKeyboardNav();

            // Render pagination
            this.renderPagination();
        }
    }

    /**
     * Initialize no results handlers
     */
    initNoResultsHandlers() {
        document.getElementById('clear-all-filters-btn')?.addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('try-again-btn')?.addEventListener('click', () => {
            this.elements.searchInput.focus();
            this.elements.searchInput.select();
        });

        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.dataset.query;
                this.elements.searchInput.value = query;
                this.performSearch(query);
            });
        });
    }

    /**
     * Initialize keyboard navigation for result cards
     */
    initCardKeyboardNav() {
        const cards = document.querySelectorAll('.entity-card, .entity-list-item');
        cards.forEach((card, index) => {
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    }

    /**
     * Get item height for virtual scrolling
     */
    getItemHeight(displayMode) {
        return displayMode === 'grid' ? 320 : 120;
    }

    /**
     * Render virtual item
     */
    renderVirtualItem(entity, index, displayMode) {
        return displayMode === 'grid' ? this.renderEntityCard(entity) : this.renderListItem(entity);
    }

    /**
     * Destroy virtual scroller
     */
    destroyVirtualScroller() {
        if (this.virtualScroller) {
            this.virtualScroller.destroy();
            this.virtualScroller = null;
        }
    }

    /**
     * Render grid view
     */
    renderGridView(results) {
        return `
            <div class="entity-grid universal-grid" role="list">
                ${results.map(entity => this.renderEntityCard(entity)).join('')}
            </div>
        `;
    }

    /**
     * Render entity card with text truncation and highlighting
     */
    renderEntityCard(entity) {
        const mythology = entity.mythology || 'unknown';
        const entityType = entity.type || entity.collection || 'entity';
        const entityId = entity.id || entity.name?.toLowerCase().replace(/\s+/g, '-');
        const icon = entity.icon || entity.gridDisplay?.icon || this.getDefaultIcon(entityType);
        const name = entity.name || 'Unknown';
        const description = entity.description || entity.subtitle || '';
        const importance = entity.importance || 50;
        const stars = Math.round(importance / 20);
        const path = `${this.formatMythologyName(mythology)} / ${this.formatEntityType(entityType)}`;

        return `
            <a href="#/mythology/${mythology}/${entityType}/${entityId}"
               class="entity-card grid-card"
               role="listitem"
               tabindex="0">
                <span class="card-badge">${this.formatMythologyName(mythology)}</span>
                <div class="card-icon">${icon}</div>
                <h3 class="card-title">${this.highlightMatch(name, this.state.query)}</h3>
                <p class="card-description">${this.highlightMatchInDescription(description, this.state.query)}</p>
                <div class="card-path" title="${this.escapeHtml(path)}">${this.truncatePath(path)}</div>
                <div class="card-footer">
                    <span class="card-type">${this.formatEntityType(entityType)}</span>
                    <span class="card-importance" aria-label="${stars} out of 5 stars">
                        ${Array(5).fill(0).map((_, i) =>
                            `<span class="star ${i < stars ? 'filled' : ''}">${i < stars ? '\u2605' : '\u2606'}</span>`
                        ).join('')}
                    </span>
                </div>
            </a>
        `;
    }

    /**
     * Render list view
     */
    renderListView(results) {
        return `
            <ul class="entity-list universal-list" role="list">
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
        const icon = entity.icon || entity.gridDisplay?.icon || this.getDefaultIcon(entityType);
        const name = entity.name || 'Unknown';
        const description = entity.description || '';
        const path = `${this.formatMythologyName(mythology)} / ${this.formatEntityType(entityType)}`;

        return `
            <li class="entity-list-item" role="listitem">
                <a href="#/mythology/${mythology}/${entityType}/${entityId}" class="list-item-link" tabindex="0">
                    <span class="list-icon">${icon}</span>
                    <div class="list-content">
                        <h3 class="list-title">${this.highlightMatch(name, this.state.query)}</h3>
                        <p class="list-description">${this.highlightMatchInDescription(description, this.state.query)}</p>
                        <span class="list-path">${this.truncatePath(path)}</span>
                    </div>
                    <span class="list-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </span>
                </a>
            </li>
        `;
    }

    /**
     * Get default icon for entity type
     */
    getDefaultIcon(type) {
        const icons = {
            deities: '\u2728',
            heroes: '\u2694\uFE0F',
            creatures: '\u{1F432}',
            items: '\u2728',
            places: '\u{1F3DB}\uFE0F',
            texts: '\u{1F4DC}',
            symbols: '\u2638\uFE0F',
            rituals: '\u{1F52E}'
        };
        return icons[type] || '\u{1F4D6}';
    }

    /**
     * Highlight match in text (max 2 lines for title)
     */
    highlightMatch(text, query) {
        if (!query || !text) return this.escapeHtml(text);

        const escapedText = this.escapeHtml(text);
        const escapedQuery = this.escapeHtml(query);
        const regex = new RegExp(`(${this.escapeRegex(escapedQuery)})`, 'gi');

        return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    /**
     * Highlight match in description (shows context around match, max 3 lines)
     */
    highlightMatchInDescription(text, query) {
        if (!text) return '';

        const maxLength = 150;
        let displayText = text;

        if (query && text.toLowerCase().includes(query.toLowerCase())) {
            // Find the match position and show context around it
            const lowerText = text.toLowerCase();
            const matchIndex = lowerText.indexOf(query.toLowerCase());

            if (matchIndex > 30) {
                // Start a bit before the match
                const startIndex = Math.max(0, matchIndex - 30);
                displayText = '...' + text.substring(startIndex);
            }
        }

        if (displayText.length > maxLength) {
            displayText = displayText.substring(0, maxLength) + '...';
        }

        return this.highlightMatch(displayText, query);
    }

    /**
     * Truncate path (middle ellipsis if too long)
     */
    truncatePath(path) {
        const maxLength = 35;
        if (path.length <= maxLength) return this.escapeHtml(path);

        const parts = path.split(' / ');
        if (parts.length === 2) {
            const [mythology, type] = parts;
            const availableForMythology = maxLength - type.length - 5;
            if (mythology.length > availableForMythology) {
                return `${this.escapeHtml(mythology.substring(0, availableForMythology))}... / ${this.escapeHtml(type)}`;
            }
        }

        return this.escapeHtml(path.substring(0, maxLength - 3)) + '...';
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.state.totalResults / this.state.resultsPerPage);

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        let html = '';

        // Previous button
        html += `
            <button class="pagination-btn ${this.state.currentPage === 1 ? 'disabled' : ''}"
                    ${this.state.currentPage === 1 ? 'disabled' : ''}
                    onclick="searchViewInstance.goToPage(${this.state.currentPage - 1})"
                    aria-label="Previous page">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Previous
            </button>
        `;

        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.state.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="searchViewInstance.goToPage(1)">1</button>`;
            if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === this.state.currentPage ? 'active' : ''}"
                        onclick="searchViewInstance.goToPage(${i})"
                        ${i === this.state.currentPage ? 'aria-current="page"' : ''}>
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
            html += `<button class="pagination-btn" onclick="searchViewInstance.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        html += `
            <button class="pagination-btn ${this.state.currentPage === totalPages ? 'disabled' : ''}"
                    ${this.state.currentPage === totalPages ? 'disabled' : ''}
                    onclick="searchViewInstance.goToPage(${this.state.currentPage + 1})"
                    aria-label="Next page">
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        `;

        paginationContainer.innerHTML = html;
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.state.totalResults / this.state.resultsPerPage);
        if (page < 1 || page > totalPages) return;

        this.state.currentPage = page;
        this.renderResults();

        // Scroll to top of results
        document.querySelector('.search-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Sort results
     */
    sortResults(results) {
        switch (this.state.sortBy) {
            case 'relevance':
                return results.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
            case 'name':
                return results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            case 'importance':
                return results.sort((a, b) => (b.importance || 50) - (a.importance || 50));
            default:
                return results;
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        // Reset filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.type === 'all');
        });

        // Reset mythology filters
        document.querySelectorAll('.mythology-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.mythology === '');
        });

        this.state.filters = {
            mythology: '',
            entityTypes: ['deities', 'heroes', 'creatures', 'items', 'places', 'texts', 'symbols', 'rituals'],
            importance: [1, 5],
            hasImage: null
        };

        if (this.state.query) {
            this.performSearch(this.state.query);
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const resultsContainer = document.getElementById('results-container');
        const resultsHeader = document.getElementById('results-header');
        const pagination = document.getElementById('pagination');

        if (resultsContainer) {
            resultsContainer.innerHTML = this.getEmptyStateHTML();
        }
        if (resultsHeader) {
            resultsHeader.style.display = 'none';
        }
        if (pagination) {
            pagination.style.display = 'none';
        }

        this.initExampleQueries();
    }

    /**
     * Render error state
     */
    renderError() {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="search-error">
                <div class="error-visual">
                    <svg class="error-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3 class="error-title">Search Error</h3>
                <p class="error-message">${this.escapeHtml(this.state.error)}</p>
                <button class="btn-primary" onclick="searchViewInstance.performSearch('${this.escapeHtml(this.state.query)}')">
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Search history management
     */
    loadSearchHistory() {
        try {
            const stored = localStorage.getItem('searchHistory');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('[SearchView] Could not load search history:', e);
            return [];
        }
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.warn('[SearchView] Could not save search history:', e);
        }
    }

    addToSearchHistory(query, resultCount) {
        this.searchHistory = this.searchHistory.filter(h => h.query !== query);
        this.searchHistory.unshift({ query, resultCount, timestamp: Date.now() });
        if (this.searchHistory.length > this.maxHistorySize) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }
        this.saveSearchHistory();
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

    formatEntityType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Cleanup method
     */
    destroy() {
        console.log('[SearchView] Destroying instance');

        this.destroyVirtualScroller();

        if (window.searchViewInstance === this) {
            window.searchViewInstance = null;
        }

        if (this.autocompleteTimer) {
            clearTimeout(this.autocompleteTimer);
            this.autocompleteTimer = null;
        }

        // Remove event listeners
        if (this.elements.searchInput) {
            this.elements.searchInput.removeEventListener('input', this.boundHandlers.onInput);
            this.elements.searchInput.removeEventListener('keydown', this.boundHandlers.onKeydown);
        }
        if (this.elements.searchBtn) {
            this.elements.searchBtn.removeEventListener('click', this.boundHandlers.onSearch);
        }
        if (this.elements.clearBtn) {
            this.elements.clearBtn.removeEventListener('click', this.boundHandlers.onClear);
        }
        if (this.elements.sortSelect) {
            this.elements.sortSelect.removeEventListener('change', this.boundHandlers.onSort);
        }
        document.removeEventListener('click', this.boundHandlers.onDocClick);

        this.isDestroyed = true;
    }
}

// Global export
if (typeof window !== 'undefined') {
    window.SearchViewComplete = SearchViewComplete;
}

// Global instance for pagination callbacks
let searchViewInstance = null;
