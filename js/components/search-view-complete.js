/**
 * Complete Search View Component
 *
 * Full-featured search interface with:
 * - Real-time autocomplete
 * - Advanced filters
 * - Multiple display modes (grid/list/table)
 * - Search history
 * - Pagination
 * - Virtual scrolling for large result sets (>100 items)
 * - Performance optimized
 */

import { VirtualScroller } from './virtual-scroller.js';

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
            resultsPerPage: 24,
            displayMode: 'grid', // grid, list, table
            sortBy: 'relevance',
            filters: {
                mythology: '',
                entityTypes: [],
                importance: [1, 5],
                hasImage: null
            },
            isLoading: false,
            error: null
        };

        // Debounce timer for autocomplete
        this.autocompleteTimer = null;
        this.autocompleteDelay = 300;

        // Search history
        this.searchHistory = this.loadSearchHistory();
        this.maxHistorySize = 10;

        // Available mythologies (will be loaded from Firebase)
        this.mythologies = [];

        // Event listener cleanup tracking (memory leak prevention)
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

            console.log('[SearchView] ✅ Search interface rendered successfully');
        } catch (error) {
            console.error('[SearchView] ❌ Render failed:', error);
            container.innerHTML = `
                <div class="search-error">
                    <div class="error-icon">⚠️</div>
                    <h2>Failed to load search</h2>
                    <p>${error.message}</p>
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
            // Fallback to common mythologies
            this.mythologies = [
                { id: 'greek', name: 'Greek' },
                { id: 'norse', name: 'Norse' },
                { id: 'egyptian', name: 'Egyptian' },
                { id: 'hindu', name: 'Hindu' },
                { id: 'buddhist', name: 'Buddhist' },
                { id: 'christian', name: 'Christian' },
                { id: 'babylonian', name: 'Babylonian' },
                { id: 'sumerian', name: 'Sumerian' }
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
                <div class="search-header">
                    <h1>Search Mythological Entities</h1>
                    <p class="search-description">Explore deities, heroes, creatures, and more across world mythologies</p>

                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input
                            type="text"
                            id="search-input"
                            class="search-input"
                            placeholder="Search deities, heroes, creatures, and more..."
                            autocomplete="off"
                            value="${this.state.query}"
                        >
                        <button id="clear-search" class="clear-btn" style="display: none;">✕</button>
                        <button id="search-btn" class="search-submit-btn">Search</button>
                    </div>

                    <div id="autocomplete-results" class="search-suggestions" style="display: none;"></div>
                </div>

                <div class="search-content">
                    <aside class="search-filters">
                        <button id="filter-toggle-btn" class="filter-toggle-btn">
                            <span>🎛️ Filters</span>
                            <span id="filter-count" class="filter-count" style="display: none;">0</span>
                        </button>

                        <div id="filter-panel" class="filter-panel" style="display: none;">
                            ${this.getFiltersHTML()}
                        </div>

                        ${this.getSearchHistoryHTML()}
                    </aside>

                    <main class="search-results-main">
                        <div class="results-controls" style="display: none;">
                            <div class="results-info">
                                <span id="results-count">0 results</span>
                            </div>

                            <div class="display-mode-switcher">
                                <button class="display-mode-btn active" data-mode="grid" title="Grid view">
                                    ▦
                                </button>
                                <button class="display-mode-btn" data-mode="list" title="List view">
                                    ☰
                                </button>
                                <button class="display-mode-btn" data-mode="table" title="Table view">
                                    ▤
                                </button>
                            </div>

                            <div class="sort-controls">
                                <label for="sort-select">Sort:</label>
                                <select id="sort-select" class="sort-select">
                                    <option value="relevance">Relevance</option>
                                    <option value="name">Name (A-Z)</option>
                                    <option value="importance">Importance</option>
                                    <option value="popularity">Popularity</option>
                                </select>
                            </div>
                        </div>

                        <div id="results-container" class="search-results">
                            ${this.getEmptyStateHTML()}
                        </div>

                        <div id="pagination" class="pagination" style="display: none;"></div>
                    </main>
                </div>
            </div>
        `;
    }

    /**
     * Generate filters HTML
     */
    getFiltersHTML() {
        return `
            <div class="filter-group">
                <label for="mythology-filter">Mythology</label>
                <select id="mythology-filter">
                    <option value="">All Mythologies</option>
                    ${this.mythologies.map(m =>
                        `<option value="${m.id}">${m.name}</option>`
                    ).join('')}
                </select>
            </div>

            <div class="filter-group">
                <label>Entity Type</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" value="deities" checked> Deities</label>
                    <label><input type="checkbox" value="heroes" checked> Heroes</label>
                    <label><input type="checkbox" value="creatures" checked> Creatures</label>
                    <label><input type="checkbox" value="cosmology" checked> Cosmology</label>
                    <label><input type="checkbox" value="rituals" checked> Rituals</label>
                    <label><input type="checkbox" value="texts" checked> Texts</label>
                </div>
            </div>

            <div class="filter-group">
                <label for="importance-filter">
                    Minimum Importance: <span id="importance-value">1</span>
                </label>
                <input
                    type="range"
                    id="importance-filter"
                    min="1"
                    max="5"
                    value="1"
                    step="1"
                >
            </div>

            <div class="filter-group">
                <label>Has Image</label>
                <select id="image-filter">
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </div>

            <div class="filter-actions">
                <button id="apply-filters" class="btn-primary">Apply Filters</button>
                <button id="clear-filters" class="btn-secondary">Clear All</button>
            </div>
        `;
    }

    /**
     * Generate search history HTML
     */
    getSearchHistoryHTML() {
        if (this.searchHistory.length === 0) {
            return '';
        }

        return `
            <div class="search-history">
                <div class="history-header">
                    <h4>Recent Searches</h4>
                    <button id="clear-history" class="btn-text">Clear</button>
                </div>
                <ul class="history-list">
                    ${this.searchHistory.slice(0, 5).map(entry => `
                        <li class="history-item" data-query="${this.escapeHtml(entry.query)}">
                            <span class="history-query">${this.escapeHtml(entry.query)}</span>
                            <span class="history-count">${entry.resultCount || 0}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * Generate empty state HTML
     */
    getEmptyStateHTML() {
        return `
            <div class="search-placeholder">
                <div class="placeholder-icon">🔍</div>
                <p>Enter a search term to find entities across world mythologies</p>
                <div class="search-examples">
                    <p><strong>Try searching for:</strong></p>
                    <button class="example-query" data-query="zeus">Zeus</button>
                    <button class="example-query" data-query="odin">Odin</button>
                    <button class="example-query" data-query="ra">Ra</button>
                    <button class="example-query" data-query="shiva">Shiva</button>
                    <button class="example-query" data-query="thunder">Thunder deities</button>
                    <button class="example-query" data-query="underworld">Underworld</button>
                </div>
            </div>
        `;
    }

    /**
     * Generate no results HTML
     */
    getNoResultsHTML() {
        return `
            <div class="no-results">
                <div class="no-results-icon">😕</div>
                <p>No entities found for "${this.escapeHtml(this.state.query)}"</p>
                <p class="no-results-hint">Try different keywords or check your filters</p>
            </div>
        `;
    }

    /**
     * Generate loading HTML
     */
    getLoadingHTML() {
        return `
            <div class="search-loading">
                <div class="spinner"></div>
                <p>Searching...</p>
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
        const filterToggleBtn = document.getElementById('filter-toggle-btn');
        const applyFiltersBtn = document.getElementById('apply-filters');
        const clearFiltersBtn = document.getElementById('clear-filters');
        const sortSelect = document.getElementById('sort-select');

        // Search input with debounced autocomplete
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Show/hide clear button
            clearBtn.style.display = query ? 'inline-block' : 'none';

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

        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value);
            }
        });

        // Search button click
        searchBtn.addEventListener('click', () => {
            this.performSearch(searchInput.value);
        });

        // Clear search button
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            clearBtn.style.display = 'none';
            this.hideAutocomplete();
            this.showEmptyState();
        });

        // Filter toggle
        filterToggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('filter-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        // Apply filters
        applyFiltersBtn.addEventListener('click', () => {
            this.updateFilters();
            if (this.state.query) {
                this.performSearch(this.state.query);
            }
        });

        // Clear filters
        clearFiltersBtn.addEventListener('click', () => {
            this.clearFilters();
        });

        // Sort change
        sortSelect.addEventListener('change', (e) => {
            this.state.sortBy = e.target.value;
            this.renderResults();
        });

        // Display mode switcher
        document.querySelectorAll('.display-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.display-mode-btn').forEach(b =>
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                this.state.displayMode = btn.dataset.mode;
                this.renderResults();
            });
        });

        // Importance slider
        const importanceFilter = document.getElementById('importance-filter');
        const importanceValue = document.getElementById('importance-value');
        importanceFilter.addEventListener('input', (e) => {
            importanceValue.textContent = e.target.value;
        });

        // Example queries
        document.querySelectorAll('.example-query').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                searchInput.value = query;
                this.performSearch(query);
            });
        });

        // Search history items
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const query = e.currentTarget.dataset.query;
                searchInput.value = query;
                this.performSearch(query);
            });
        });

        // Clear history
        const clearHistoryBtn = document.getElementById('clear-history');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearSearchHistory();
            });
        }

        // Click outside to close autocomplete
        document.addEventListener('click', (e) => {
            const autocomplete = document.getElementById('autocomplete-results');
            if (!searchInput.contains(e.target) && !autocomplete.contains(e.target)) {
                this.hideAutocomplete();
            }
        });

        // Set global instance for pagination callbacks
        window.searchViewInstance = this;
        console.log('[SearchView] Global instance set for pagination callbacks');
    }

    /**
     * Show autocomplete suggestions
     */
    async showAutocomplete(query) {
        try {
            const suggestions = await this.searchEngine.getSuggestions(query, 8);
            const container = document.getElementById('autocomplete-results');

            if (!container) {
                console.warn('[SearchView] Element not found in showAutocomplete: autocomplete-results');
                return;
            }

            if (!suggestions || suggestions.length === 0) {
                this.hideAutocomplete();
                return;
            }

            container.innerHTML = suggestions.map(term => `
                <div class="suggestion-item" data-query="${this.escapeHtml(term)}">
                    <strong>${this.highlightMatch(term, query)}</strong>
                </div>
            `).join('');

            // Add click handlers
            container.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const query = e.currentTarget.dataset.query;
                    const searchInput = document.getElementById('search-input');
                    if (searchInput) {
                        searchInput.value = query;
                        this.performSearch(query);
                        this.hideAutocomplete();
                    }
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
        if (!container) {
            console.warn('[SearchView] Element not found in hideAutocomplete');
            return;
        }
        container.style.display = 'none';
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

        // Show loading state
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.innerHTML = this.getLoadingHTML();
        }

        const resultsControls = document.querySelector('.results-controls');
        if (resultsControls) {
            resultsControls.style.display = 'none';
        }

        try {
            console.log('[SearchView] Searching for:', query);

            // Perform search with current filters
            const searchOptions = {
                mode: 'generic',
                mythology: this.state.filters.mythology || null,
                limit: 1000 // Get all results, we'll paginate client-side
            };

            const result = await this.searchEngine.search(query, searchOptions);

            // Apply additional filters
            this.state.results = this.applyClientFilters(result.items || []);
            this.state.totalResults = this.state.results.length;

            console.log('[SearchView] Found', this.state.totalResults, 'results');

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
            if (this.state.filters.entityTypes.length > 0) {
                const entityType = entity.type || entity.collection;
                if (!this.state.filters.entityTypes.includes(entityType)) {
                    return false;
                }
            }

            // Importance filter
            const importance = entity.importance || 50;
            const minImportance = this.state.filters.importance[0] * 20; // Convert 1-5 to 20-100
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
     * Update filters from form
     */
    updateFilters() {
        // Mythology filter
        const mythologyFilter = document.getElementById('mythology-filter');
        if (mythologyFilter) {
            this.state.filters.mythology = mythologyFilter.value;
        }

        // Entity types
        const checkedTypes = Array.from(
            document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        this.state.filters.entityTypes = checkedTypes;

        // Importance filter
        const importanceFilterEl = document.getElementById('importance-filter');
        if (importanceFilterEl) {
            const importanceValue = parseInt(importanceFilterEl.value);
            this.state.filters.importance = [importanceValue, 5];
        }

        // Image filter
        const imageFilterEl = document.getElementById('image-filter');
        if (imageFilterEl) {
            const imageFilter = imageFilterEl.value;
            this.state.filters.hasImage = imageFilter === '' ? null : imageFilter === 'true';
        }

        // Update filter count badge
        let filterCount = 0;
        if (this.state.filters.mythology) filterCount++;
        if (this.state.filters.entityTypes.length < 6) filterCount++;
        if (this.state.filters.importance[0] > 1) filterCount++;
        if (this.state.filters.hasImage !== null) filterCount++;

        const filterCountBadge = document.getElementById('filter-count');
        if (filterCountBadge) {
            if (filterCount > 0) {
                filterCountBadge.textContent = filterCount;
                filterCountBadge.style.display = 'inline-block';
            } else {
                filterCountBadge.style.display = 'none';
            }
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        const mythologyFilter = document.getElementById('mythology-filter');
        if (mythologyFilter) {
            mythologyFilter.value = '';
        }

        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });

        const importanceFilter = document.getElementById('importance-filter');
        if (importanceFilter) {
            importanceFilter.value = 1;
        }

        const importanceValue = document.getElementById('importance-value');
        if (importanceValue) {
            importanceValue.textContent = '1';
        }

        const imageFilter = document.getElementById('image-filter');
        if (imageFilter) {
            imageFilter.value = '';
        }

        this.state.filters = {
            mythology: '',
            entityTypes: [],
            importance: [1, 5],
            hasImage: null
        };

        const filterCount = document.getElementById('filter-count');
        if (filterCount) {
            filterCount.style.display = 'none';
        }

        // Re-run search if there's a query
        if (this.state.query) {
            this.performSearch(this.state.query);
        }
    }

    /**
     * Render search results with virtual scrolling for large lists
     */
    renderResults() {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) {
            console.warn('[SearchView] Element not found in renderResults: results-container');
            return;
        }

        const resultsControls = document.querySelector('.results-controls');
        if (!resultsControls) {
            console.warn('[SearchView] Element not found in renderResults: results-controls');
            return;
        }

        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) {
            console.warn('[SearchView] Element not found in renderResults: pagination');
            return;
        }

        if (this.state.totalResults === 0) {
            resultsContainer.innerHTML = this.getNoResultsHTML();
            resultsControls.style.display = 'none';
            paginationContainer.style.display = 'none';
            this.destroyVirtualScroller();
            return;
        }

        // Show controls
        resultsControls.style.display = 'flex';

        // Update results count
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            resultsCount.textContent =
                `${this.state.totalResults} result${this.state.totalResults !== 1 ? 's' : ''}`;
        }

        // Sort results
        const sortedResults = this.sortResults([...this.state.results]);

        // Use virtual scrolling for large result sets (>100 items)
        const useVirtualScrolling = sortedResults.length > 100;

        if (useVirtualScrolling) {
            console.log(`[SearchView] Using virtual scrolling for ${sortedResults.length} items`);

            // Hide pagination for virtual scrolling
            paginationContainer.style.display = 'none';

            // Destroy existing virtual scroller if present
            this.destroyVirtualScroller();

            // Prepare container for virtual scrolling
            resultsContainer.innerHTML = '';
            resultsContainer.style.height = '600px'; // Fixed height for scrolling

            // Determine item height based on display mode
            const itemHeight = this.getItemHeight(this.state.displayMode);

            // Create virtual scroller
            this.virtualScroller = new VirtualScroller(resultsContainer, {
                itemHeight: itemHeight,
                bufferSize: 10,
                renderItem: (entity, index) => {
                    return this.renderVirtualItem(entity, index, this.state.displayMode);
                }
            });

            this.virtualScroller.setItems(sortedResults);

            // Track analytics
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackEvent('virtual_scroll_enabled', {
                    itemCount: sortedResults.length,
                    displayMode: this.state.displayMode
                });
            }

        } else {
            // Regular rendering with pagination for small lists (<= 100 items)
            this.destroyVirtualScroller();
            resultsContainer.style.height = ''; // Reset height

            // Paginate
            const startIdx = (this.state.currentPage - 1) * this.state.resultsPerPage;
            const endIdx = startIdx + this.state.resultsPerPage;
            const pageResults = sortedResults.slice(startIdx, endIdx);

            // Render based on display mode
            switch (this.state.displayMode) {
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
    }

    /**
     * Get item height for virtual scrolling based on display mode
     */
    getItemHeight(displayMode) {
        switch (displayMode) {
            case 'grid':
                return 320; // Grid cards are taller
            case 'list':
                return 120; // List items are medium height
            case 'table':
                return 60;  // Table rows are compact
            default:
                return 120;
        }
    }

    /**
     * Render a single item for virtual scrolling
     */
    renderVirtualItem(entity, index, displayMode) {
        switch (displayMode) {
            case 'grid':
                return this.renderEntityCard(entity);
            case 'list':
                return this.renderListItem(entity);
            case 'table':
                return this.renderTableRow(entity);
            default:
                return this.renderEntityCard(entity);
        }
    }

    /**
     * Destroy virtual scroller instance
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
            <div class="entity-grid universal-grid">
                ${results.map(entity => this.renderEntityCard(entity)).join('')}
            </div>
        `;
    }

    /**
     * Render entity card
     */
    renderEntityCard(entity) {
        const mythology = entity.mythology || 'unknown';
        const entityType = entity.type || entity.collection || 'entity';
        const entityId = entity.id || entity.name?.toLowerCase().replace(/\s+/g, '-');
        const icon = entity.icon || entity.gridDisplay?.icon || '📖';
        const name = entity.name || 'Unknown';
        const subtitle = entity.subtitle || entity.description?.substring(0, 60) || '';
        const importance = entity.importance || 50;
        const stars = Math.round(importance / 20); // Convert to 1-5 stars

        return `
            <a href="#/mythology/${mythology}/${entityType}/${entityId}" class="entity-card grid-card">
                <div class="card-badge">${this.formatMythologyName(mythology)}</div>
                <div class="card-icon">${icon}</div>
                <div class="card-title">${this.escapeHtml(name)}</div>
                <div class="card-subtitle">${this.escapeHtml(subtitle)}</div>
                <div class="card-stats">
                    <div class="stat-item">
                        <span class="stat-label">Type:</span>
                        <span class="stat-value">${this.formatEntityType(entityType)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Importance:</span>
                        <span class="stat-value">${'⭐'.repeat(stars)}</span>
                    </div>
                </div>
            </a>
        `;
    }

    /**
     * Render list view
     */
    renderListView(results) {
        return `
            <ul class="entity-list universal-list">
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
        const icon = entity.icon || entity.gridDisplay?.icon || '📖';
        const name = entity.name || 'Unknown';
        const description = entity.description || '';

        return `
            <li class="entity-list-item">
                <a href="#/mythology/${mythology}/${entityType}/${entityId}" class="list-item-main">
                    <div class="list-icon">${icon}</div>
                    <div class="list-content">
                        <div class="list-primary">${this.escapeHtml(name)}</div>
                        <div class="list-secondary">${this.escapeHtml(description.substring(0, 120))}${description.length > 120 ? '...' : ''}</div>
                        <div class="list-meta">${this.formatMythologyName(mythology)} • ${this.formatEntityType(entityType)}</div>
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
                <table class="entity-table">
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
        const icon = entity.icon || entity.gridDisplay?.icon || '📖';
        const name = entity.name || 'Unknown';
        const importance = entity.importance || 50;
        const stars = Math.round(importance / 20);

        return `
            <tr onclick="window.location.hash='#/mythology/${mythology}/${entityType}/${entityId}'" style="cursor: pointer;">
                <td style="font-size: 24px;">${icon}</td>
                <td><strong>${this.escapeHtml(name)}</strong></td>
                <td>${this.formatEntityType(entityType)}</td>
                <td>${this.formatMythologyName(mythology)}</td>
                <td>${'⭐'.repeat(stars)}</td>
            </tr>
        `;
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) {
            console.warn('[SearchView] Element not found in renderPagination: pagination');
            return;
        }

        const totalPages = Math.ceil(this.state.totalResults / this.state.resultsPerPage);

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        paginationContainer.style.justifyContent = 'center';
        paginationContainer.style.gap = '8px';
        paginationContainer.style.padding = '20px';

        let html = '';

        // Previous button
        html += `
            <button class="btn-secondary" ${this.state.currentPage === 1 ? 'disabled' : ''}
                    onclick="searchViewInstance.goToPage(${this.state.currentPage - 1})">
                ← Previous
            </button>
        `;

        // Page numbers (show max 7 pages)
        const maxVisible = 7;
        let startPage = Math.max(1, this.state.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="btn-secondary" onclick="searchViewInstance.goToPage(1)">1</button>`;
            if (startPage > 2) html += '<span>...</span>';
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="btn-${i === this.state.currentPage ? 'primary' : 'secondary'}"
                        onclick="searchViewInstance.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span>...</span>';
            html += `<button class="btn-secondary" onclick="searchViewInstance.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        html += `
            <button class="btn-secondary" ${this.state.currentPage === totalPages ? 'disabled' : ''}
                    onclick="searchViewInstance.goToPage(${this.state.currentPage + 1})">
                Next →
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
        const resultsMain = document.querySelector('.search-results-main');
        if (resultsMain) {
            resultsMain.scrollIntoView({ behavior: 'smooth' });
        }
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
            case 'popularity':
                return results.sort((a, b) => (b.popularity || 50) - (a.popularity || 50));
            default:
                return results;
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) {
            console.warn('[SearchView] Element not found in showEmptyState: results-container');
            return;
        }
        resultsContainer.innerHTML = this.getEmptyStateHTML();

        const resultsControls = document.querySelector('.results-controls');
        if (resultsControls) {
            resultsControls.style.display = 'none';
        }

        const pagination = document.getElementById('pagination');
        if (pagination) {
            pagination.style.display = 'none';
        }

        // Re-attach event listeners to example queries
        document.querySelectorAll('.example-query').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = query;
                    this.performSearch(query);
                }
            });
        });
    }

    /**
     * Render error state
     */
    renderError() {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) {
            console.warn('[SearchView] Element not found in renderError: results-container');
            return;
        }
        resultsContainer.innerHTML = `
            <div class="search-error">
                <div class="error-icon">⚠️</div>
                <h3>Search Error</h3>
                <p>${this.escapeHtml(this.state.error)}</p>
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

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();

        // Re-render to hide history section
        const historySection = document.querySelector('.search-history');
        if (historySection) {
            historySection.remove();
        }
    }

    /**
     * Utility methods
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    highlightMatch(text, query) {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return this.escapeHtml(text);

        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);

        return `${this.escapeHtml(before)}<strong>${this.escapeHtml(match)}</strong>${this.escapeHtml(after)}`;
    }

    formatEntityType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Cleanup method - removes global instance and clears resources
     */
    destroy() {
        console.log('[SearchView] Destroying instance');

        // Destroy virtual scroller
        this.destroyVirtualScroller();

        // Clear global instance reference if it's this instance
        if (window.searchViewInstance === this) {
            window.searchViewInstance = null;
            console.log('[SearchView] Global instance cleared');
        }

        // Clear timers
        if (this.autocompleteTimer) {
            clearTimeout(this.autocompleteTimer);
            this.autocompleteTimer = null;
        }

        // Mark as destroyed
        this.isDestroyed = true;
    }
}

// ES Module Export
export { SearchViewComplete };

// Legacy global export for backwards compatibility
if (typeof window !== 'undefined') {
    window.SearchViewComplete = SearchViewComplete;
}

// Global instance for pagination callbacks
let searchViewInstance = null;
