/**
 * Search UI Component
 *
 * Provides interactive search interface that integrates with:
 * - CorpusSearch for backend search logic
 * - UniversalDisplayRenderer for results display
 * - Advanced filtering and sorting controls
 */

class SearchUI {
    constructor(corpusSearch, displayRenderer, options = {}) {
        this.corpusSearch = corpusSearch;
        this.renderer = displayRenderer;
        this.options = {
            containerId: 'search-container',
            resultsContainerId: 'search-results',
            defaultDisplayMode: 'grid',
            enableVoiceSearch: false,
            showSuggestions: true,
            ...options
        };

        this.currentResults = [];
        this.currentQuery = '';
        this.currentFilters = {};
        this.displayMode = this.options.defaultDisplayMode;
    }

    /**
     * Initialize search UI
     */
    init() {
        this.renderSearchInterface();
        this.attachEventListeners();
    }

    /**
     * Render complete search interface
     */
    renderSearchInterface() {
        const container = document.getElementById(this.options.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="search-ui">
                <!-- Search Bar -->
                <div class="search-bar">
                    <div class="search-input-wrapper">
                        <input type="text"
                               id="search-input"
                               class="search-input"
                               placeholder="Search entities, terms, languages, sources..."
                               autocomplete="off"
                               aria-label="Search"
                               aria-describedby="search-suggestions">

                        <button id="search-mode-toggle"
                                class="search-mode-btn"
                                title="Search Mode: Generic">
                            <span class="mode-icon">🔍</span>
                        </button>

                        <button id="search-submit"
                                class="search-submit-btn"
                                aria-label="Search">
                            Search
                        </button>

                        <button id="clear-search"
                                class="clear-btn"
                                aria-label="Clear search"
                                style="display: none;">
                            ✕
                        </button>
                    </div>

                    <!-- Suggestions Dropdown -->
                    <div id="search-suggestions"
                         class="search-suggestions"
                         role="listbox"
                         style="display: none;">
                    </div>
                </div>

                <!-- Search Mode Selector -->
                <div id="search-mode-panel" class="search-mode-panel" style="display: none;">
                    <label>
                        <input type="radio" name="search-mode" value="generic" checked>
                        <span>Generic - Search all fields</span>
                    </label>
                    <label>
                        <input type="radio" name="search-mode" value="term">
                        <span>Corpus Terms - Epithets, domains, symbols</span>
                    </label>
                    <label>
                        <input type="radio" name="search-mode" value="language">
                        <span>Language - Original scripts, transliterations</span>
                    </label>
                    <label>
                        <input type="radio" name="search-mode" value="source">
                        <span>Sources - Texts, citations, archaeology</span>
                    </label>
                    <label>
                        <input type="radio" name="search-mode" value="advanced">
                        <span>Advanced - Multiple criteria</span>
                    </label>
                </div>

                <!-- Filter Panel -->
                <div class="search-filters">
                    <button id="toggle-filters" class="filter-toggle-btn">
                        <span>Filters</span>
                        <span class="filter-count" style="display: none;"></span>
                    </button>

                    <div id="filter-panel" class="filter-panel" style="display: none;">
                        <!-- Mythology Filter -->
                        <div class="filter-group">
                            <label>Mythology</label>
                            <select id="filter-mythology" multiple>
                                <option value="">All</option>
                                <option value="greek">Greek</option>
                                <option value="roman">Roman</option>
                                <option value="norse">Norse</option>
                                <option value="egyptian">Egyptian</option>
                                <option value="hindu">Hindu</option>
                                <option value="buddhist">Buddhist</option>
                                <option value="christian">Christian</option>
                                <option value="islamic">Islamic</option>
                                <option value="chinese">Chinese</option>
                                <option value="japanese">Japanese</option>
                                <option value="celtic">Celtic</option>
                                <option value="babylonian">Babylonian</option>
                                <option value="sumerian">Sumerian</option>
                                <option value="persian">Persian</option>
                                <option value="aztec">Aztec</option>
                                <option value="mayan">Mayan</option>
                                <option value="yoruba">Yoruba</option>
                            </select>
                        </div>

                        <!-- Entity Type Filter -->
                        <div class="filter-group">
                            <label>Entity Type</label>
                            <select id="filter-entity-type">
                                <option value="">All</option>
                                <option value="deities">Deities</option>
                                <option value="heroes">Heroes</option>
                                <option value="creatures">Creatures</option>
                                <option value="cosmology">Cosmology</option>
                                <option value="texts">Texts</option>
                                <option value="rituals">Rituals</option>
                                <option value="herbs">Herbs</option>
                                <option value="symbols">Symbols</option>
                                <option value="places">Places</option>
                            </select>
                        </div>

                        <!-- Importance Range -->
                        <div class="filter-group">
                            <label>Importance (0-100)</label>
                            <div class="range-inputs">
                                <input type="number" id="filter-importance-min" min="0" max="100" value="0" placeholder="Min">
                                <span>to</span>
                                <input type="number" id="filter-importance-max" min="0" max="100" value="100" placeholder="Max">
                            </div>
                        </div>

                        <!-- Has Image Filter -->
                        <div class="filter-group">
                            <label>
                                <input type="checkbox" id="filter-has-image">
                                Has Image
                            </label>
                        </div>

                        <div class="filter-actions">
                            <button id="apply-filters" class="btn-primary">Apply Filters</button>
                            <button id="clear-filters" class="btn-secondary">Clear</button>
                        </div>
                    </div>
                </div>

                <!-- Results Controls -->
                <div class="results-controls" style="display: none;">
                    <div class="results-info">
                        <span id="results-count">0 results</span>
                    </div>

                    <div class="display-mode-switcher">
                        <button class="display-mode-btn active" data-mode="grid" title="Grid View">
                            <span>⊞</span>
                        </button>
                        <button class="display-mode-btn" data-mode="list" title="List View">
                            <span>☰</span>
                        </button>
                        <button class="display-mode-btn" data-mode="table" title="Table View">
                            <span>⊟</span>
                        </button>
                        <button class="display-mode-btn" data-mode="panel" title="Panel View">
                            <span>▭</span>
                        </button>
                    </div>

                    <div class="sort-controls">
                        <label for="sort-by">Sort:</label>
                        <select id="sort-by">
                            <option value="relevance">Relevance</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="importance">Importance</option>
                            <option value="popularity">Popularity</option>
                        </select>
                    </div>
                </div>

                <!-- Results Container -->
                <div id="${this.options.resultsContainerId}" class="search-results">
                    <div class="search-placeholder">
                        <div class="placeholder-icon">🔍</div>
                        <p>Enter a search query to find entities</p>
                        <div class="search-examples">
                            <p>Try searching for:</p>
                            <button class="example-query" data-query="thunder">thunder</button>
                            <button class="example-query" data-query="Zeus">Zeus</button>
                            <button class="example-query" data-query="creation myth">creation myth</button>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div id="pagination" class="pagination" style="display: none;">
                </div>
            </div>
        `;
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearchInput.bind(this));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        }

        // Search submit
        const submitBtn = document.getElementById('search-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.performSearch());
        }

        // Clear search
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSearch());
        }

        // Search mode toggle
        const modeToggle = document.getElementById('search-mode-toggle');
        const modePanel = document.getElementById('search-mode-panel');
        if (modeToggle && modePanel) {
            modeToggle.addEventListener('click', () => {
                modePanel.style.display = modePanel.style.display === 'none' ? 'block' : 'none';
            });
        }

        // Search mode selection
        const modeInputs = document.querySelectorAll('input[name="search-mode"]');
        modeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.currentFilters.mode = e.target.value;
                const icon = modeToggle.querySelector('.mode-icon');
                const icons = {
                    generic: '🔍',
                    term: '🏷️',
                    language: '🌐',
                    source: '📚',
                    advanced: '⚙️'
                };
                icon.textContent = icons[e.target.value] || '🔍';
                modeToggle.title = `Search Mode: ${e.target.value}`;
                modePanel.style.display = 'none';
            });
        });

        // Filter toggle
        const filterToggle = document.getElementById('toggle-filters');
        const filterPanel = document.getElementById('filter-panel');
        if (filterToggle && filterPanel) {
            filterToggle.addEventListener('click', () => {
                filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
            });
        }

        // Apply filters
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        // Clear filters
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Display mode switcher
        const displayBtns = document.querySelectorAll('.display-mode-btn');
        displayBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                displayBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.displayMode = btn.dataset.mode;
                this.renderResults();
            });
        });

        // Sort controls
        const sortSelect = document.getElementById('sort-by');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sortBy = e.target.value;
                this.performSearch();
            });
        }

        // Example queries
        const exampleBtns = document.querySelectorAll('.example-query');
        exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                searchInput.value = btn.dataset.query;
                this.performSearch();
            });
        });
    }

    /**
     * Handle search input for suggestions
     */
    async handleSearchInput(e) {
        const query = e.target.value;
        const clearBtn = document.getElementById('clear-search');

        if (clearBtn) {
            clearBtn.style.display = query ? 'block' : 'none';
        }

        if (!this.options.showSuggestions || query.length < 2) {
            this.hideSuggestions();
            return;
        }

        const suggestions = await this.corpusSearch.getSuggestions(query);
        this.showSuggestions(suggestions);
    }

    /**
     * Show search suggestions
     */
    showSuggestions(suggestions) {
        const container = document.getElementById('search-suggestions');
        if (!container) return;

        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        container.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" role="option" tabindex="0">
                ${this.highlightMatch(suggestion, this.currentQuery)}
            </div>
        `).join('');

        container.style.display = 'block';

        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('search-input').value = item.textContent;
                this.hideSuggestions();
                this.performSearch();
            });
        });
    }

    /**
     * Hide suggestions
     */
    hideSuggestions() {
        const container = document.getElementById('search-suggestions');
        if (container) container.style.display = 'none';
    }

    /**
     * Perform search
     */
    async performSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput.value.trim();

        if (!query) return;

        this.currentQuery = query;
        this.hideSuggestions();

        // Show loading state
        this.showLoading();

        try {
            const results = await this.corpusSearch.search(query, {
                mode: this.currentFilters.mode || 'generic',
                mythology: this.currentFilters.mythology || null,
                entityType: this.currentFilters.entityType || null,
                sortBy: this.currentFilters.sortBy || 'relevance',
                limit: 100
            });

            this.currentResults = results.items;
            this.renderResults();
            this.updateResultsCount(results.total);

            // Show results controls
            document.querySelector('.results-controls').style.display = 'flex';

        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    /**
     * Apply filters and re-search
     */
    applyFilters() {
        const mythology = document.getElementById('filter-mythology').value;
        const entityType = document.getElementById('filter-entity-type').value;
        const importanceMin = parseInt(document.getElementById('filter-importance-min').value) || 0;
        const importanceMax = parseInt(document.getElementById('filter-importance-max').value) || 100;
        const hasImage = document.getElementById('filter-has-image').checked;

        this.currentFilters = {
            ...this.currentFilters,
            mythology: mythology || null,
            entityType: entityType || null,
            importance: { min: importanceMin, max: importanceMax },
            hasImage: hasImage ? true : null
        };

        this.updateFilterCount();
        this.performSearch();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('filter-mythology').value = '';
        document.getElementById('filter-entity-type').value = '';
        document.getElementById('filter-importance-min').value = '0';
        document.getElementById('filter-importance-max').value = '100';
        document.getElementById('filter-has-image').checked = false;

        this.currentFilters = { mode: this.currentFilters.mode || 'generic' };
        this.updateFilterCount();
        this.performSearch();
    }

    /**
     * Update filter count badge
     */
    updateFilterCount() {
        const count = Object.keys(this.currentFilters).filter(k => k !== 'mode' && k !== 'sortBy').length;
        const badge = document.querySelector('.filter-count');

        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    /**
     * Render search results
     */
    renderResults() {
        const container = document.getElementById(this.options.resultsContainerId);
        if (!container) return;

        if (this.currentResults.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <p>No results found for "${this.currentQuery}"</p>
                    <p class="no-results-hint">Try different keywords or adjust your filters</p>
                </div>
            `;
            return;
        }

        const html = this.renderer.render(this.currentResults, this.displayMode);
        container.innerHTML = html;

        // Add click tracking for analytics
        this.attachResultClickHandlers();
    }

    /**
     * Attach click handlers to results
     */
    attachResultClickHandlers() {
        const links = document.querySelectorAll('.entity-link, .hoverable-term');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                // Track click for analytics
                console.log('Result clicked:', link.href);
            });
        });
    }

    /**
     * Update results count
     */
    updateResultsCount(total) {
        const countEl = document.getElementById('results-count');
        if (countEl) {
            countEl.textContent = `${total} result${total !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const container = document.getElementById(this.options.resultsContainerId);
        if (container) {
            container.innerHTML = `
                <div class="search-loading">
                    <div class="spinner"></div>
                    <p>Searching...</p>
                </div>
            `;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById(this.options.resultsContainerId);
        if (container) {
            container.innerHTML = `
                <div class="search-error">
                    <div class="error-icon">⚠️</div>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    /**
     * Clear search
     */
    clearSearch() {
        document.getElementById('search-input').value = '';
        document.getElementById('clear-search').style.display = 'none';
        this.currentQuery = '';
        this.currentResults = [];
        this.hideSuggestions();

        const container = document.getElementById(this.options.resultsContainerId);
        if (container) {
            container.innerHTML = `
                <div class="search-placeholder">
                    <div class="placeholder-icon">🔍</div>
                    <p>Enter a search query to find entities</p>
                </div>
            `;
        }

        document.querySelector('.results-controls').style.display = 'none';
    }

    /**
     * Highlight search term in suggestion
     */
    highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchUI;
}
