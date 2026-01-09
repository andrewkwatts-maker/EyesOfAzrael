/**
 * Search Enhancements for Eyes of Azrael
 *
 * Polished search experience with:
 * - Enhanced autocomplete with categories
 * - Recent searches with persistence
 * - Command palette quick search (Ctrl+K)
 * - Advanced filtering with save preferences
 * - Loading states and animations
 * - No results suggestions
 * - Term highlighting
 *
 * @version 2.0.0
 * @author Eyes of Azrael Team
 */

class SearchEnhancements {
    constructor() {
        // State
        this.recentSearches = this.loadRecentSearches();
        this.searchPreferences = this.loadSearchPreferences();
        this.isCommandPaletteOpen = false;
        this.activeAutocompleteIndex = -1;
        this.autocompleteResults = [];
        this.debounceTimer = null;
        this.lastQuery = '';

        // Configuration
        this.config = {
            maxRecentSearches: 10,
            autocompleteDebounce: 150,
            minQueryLength: 2,
            maxAutocompleteSuggestions: 8,
            storageKeys: {
                recentSearches: 'eoa_recent_searches',
                searchPreferences: 'eoa_search_preferences'
            }
        };

        // Entity types for quick filters
        this.entityTypes = [
            { id: 'all', label: 'All', icon: '\u{1F50D}' },
            { id: 'deities', label: 'Deities', icon: '\u2728' },
            { id: 'heroes', label: 'Heroes', icon: '\u2694\uFE0F' },
            { id: 'creatures', label: 'Creatures', icon: '\u{1F432}' },
            { id: 'items', label: 'Items', icon: '\u{1F48E}' },
            { id: 'places', label: 'Places', icon: '\u{1F3DB}\uFE0F' },
            { id: 'texts', label: 'Texts', icon: '\u{1F4DC}' },
            { id: 'rituals', label: 'Rituals', icon: '\u{1F52E}' },
            { id: 'symbols', label: 'Symbols', icon: '\u2638\uFE0F' },
            { id: 'herbs', label: 'Herbs', icon: '\u{1F33F}' }
        ];

        // Popular mythologies
        this.mythologies = [
            { id: 'greek', name: 'Greek' },
            { id: 'norse', name: 'Norse' },
            { id: 'egyptian', name: 'Egyptian' },
            { id: 'hindu', name: 'Hindu' },
            { id: 'buddhist', name: 'Buddhist' },
            { id: 'roman', name: 'Roman' },
            { id: 'celtic', name: 'Celtic' },
            { id: 'japanese', name: 'Japanese' },
            { id: 'chinese', name: 'Chinese' },
            { id: 'sumerian', name: 'Sumerian' }
        ];

        // Trending/popular searches
        this.trendingSearches = [
            'Zeus', 'Odin', 'Ra', 'Shiva', 'Thor',
            'dragon', 'phoenix', 'underworld', 'creation'
        ];

        // Bind methods
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleGlobalKeydown = this.handleGlobalKeydown.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    /**
     * Initialize search enhancements
     */
    init() {
        console.log('[SearchEnhancements] Initializing...');

        // Add global keyboard shortcut
        document.addEventListener('keydown', this.handleGlobalKeydown);

        // Inject command palette HTML
        this.injectCommandPalette();

        // Enhance existing search bars
        this.enhanceSearchBars();

        console.log('[SearchEnhancements] Initialized successfully');
        return this;
    }

    /**
     * Inject command palette into DOM
     */
    injectCommandPalette() {
        if (document.getElementById('command-palette')) return;

        const palette = document.createElement('div');
        palette.id = 'command-palette';
        palette.className = 'command-palette';
        palette.setAttribute('role', 'dialog');
        palette.setAttribute('aria-modal', 'true');
        palette.setAttribute('aria-label', 'Quick search');

        palette.innerHTML = `
            <div class="command-palette-backdrop"></div>
            <div class="command-palette-container">
                <div class="command-palette-header">
                    <div class="command-palette-search-wrapper">
                        <span class="command-palette-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="M21 21l-4.35-4.35"></path>
                            </svg>
                        </span>
                        <input
                            type="text"
                            id="command-palette-input"
                            class="command-palette-input"
                            placeholder="Search mythology... (type to search)"
                            autocomplete="off"
                            autocapitalize="off"
                            spellcheck="false"
                        >
                        <kbd class="command-palette-kbd">ESC</kbd>
                    </div>
                </div>
                <div class="command-palette-body">
                    <div id="command-palette-content" class="command-palette-content">
                        ${this.getCommandPaletteDefaultContent()}
                    </div>
                </div>
                <div class="command-palette-footer">
                    <span class="command-hint">
                        <kbd>\u2191</kbd><kbd>\u2193</kbd> Navigate
                    </span>
                    <span class="command-hint">
                        <kbd>\u21B5</kbd> Select
                    </span>
                    <span class="command-hint">
                        <kbd>ESC</kbd> Close
                    </span>
                </div>
            </div>
        `;

        document.body.appendChild(palette);

        // Add event listeners
        const backdrop = palette.querySelector('.command-palette-backdrop');
        const input = palette.querySelector('#command-palette-input');

        backdrop.addEventListener('click', () => this.closeCommandPalette());
        input.addEventListener('input', (e) => this.handleCommandPaletteInput(e));
        input.addEventListener('keydown', (e) => this.handleCommandPaletteKeydown(e));
    }

    /**
     * Get default content for command palette
     */
    getCommandPaletteDefaultContent() {
        let html = '';

        // Recent searches section
        if (this.recentSearches.length > 0) {
            html += `
                <div class="command-section">
                    <div class="command-section-header">
                        <span class="command-section-icon">\u{1F552}</span>
                        <span class="command-section-title">Recent Searches</span>
                        <button class="command-section-clear" data-action="clear-recent" title="Clear recent searches">
                            Clear
                        </button>
                    </div>
                    <div class="command-section-items">
                        ${this.recentSearches.slice(0, 5).map((search, idx) => `
                            <div class="command-item" data-query="${this.escapeHtml(search.query)}" data-index="${idx}">
                                <span class="command-item-icon">\u{1F50D}</span>
                                <span class="command-item-text">${this.escapeHtml(search.query)}</span>
                                <span class="command-item-meta">${search.resultCount} results</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Quick filters section
        html += `
            <div class="command-section">
                <div class="command-section-header">
                    <span class="command-section-icon">\u{1F3AF}</span>
                    <span class="command-section-title">Quick Filters</span>
                </div>
                <div class="command-section-items command-chips">
                    ${this.entityTypes.slice(1).map(type => `
                        <button class="command-chip" data-filter-type="${type.id}">
                            <span>${type.icon}</span>
                            <span>${type.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Trending searches section
        html += `
            <div class="command-section">
                <div class="command-section-header">
                    <span class="command-section-icon">\u{1F525}</span>
                    <span class="command-section-title">Trending</span>
                </div>
                <div class="command-section-items">
                    ${this.trendingSearches.slice(0, 5).map((term, idx) => `
                        <div class="command-item" data-query="${term}" data-index="${this.recentSearches.length + idx}">
                            <span class="command-item-icon">\u{1F31F}</span>
                            <span class="command-item-text">${term}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Enhance existing search bars on the page
     */
    enhanceSearchBars() {
        // Find all search inputs
        const searchInputs = document.querySelectorAll(
            '#search-input, .search-input, [data-search-input]'
        );

        searchInputs.forEach(input => {
            if (input.dataset.enhanced) return;
            input.dataset.enhanced = 'true';

            // Wrap in enhanced container if not already
            this.enhanceSearchInput(input);
        });
    }

    /**
     * Enhance a single search input
     */
    enhanceSearchInput(input) {
        const wrapper = input.closest('.search-input-wrapper') || input.parentElement;

        // Create dropdown container if not exists
        let dropdown = wrapper.querySelector('.search-dropdown-enhanced');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-dropdown-enhanced';
            dropdown.setAttribute('role', 'listbox');
            wrapper.appendChild(dropdown);
        }

        // Add keyboard shortcut hint
        this.addKeyboardHint(wrapper);

        // Event listeners
        input.addEventListener('focus', () => this.showDropdown(input, dropdown));
        input.addEventListener('input', (e) => this.handleSearchInput(e, dropdown));
        input.addEventListener('keydown', (e) => this.handleKeydown(e, dropdown));

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                this.hideDropdown(dropdown);
            }
        });
    }

    /**
     * Add keyboard shortcut hint to search wrapper
     */
    addKeyboardHint(wrapper) {
        if (wrapper.querySelector('.search-kbd-hint')) return;

        const hint = document.createElement('div');
        hint.className = 'search-kbd-hint';
        hint.innerHTML = '<kbd>Ctrl</kbd><kbd>K</kbd>';
        hint.title = 'Quick search';
        hint.addEventListener('click', () => this.openCommandPalette());

        wrapper.appendChild(hint);
    }

    /**
     * Show dropdown with suggestions
     */
    showDropdown(input, dropdown) {
        const query = input.value.trim();

        if (query.length < this.config.minQueryLength) {
            // Show recent searches and suggestions
            dropdown.innerHTML = this.getDropdownDefaultContent();
        }

        dropdown.classList.add('visible');
        this.attachDropdownListeners(dropdown, input);
    }

    /**
     * Hide dropdown
     */
    hideDropdown(dropdown) {
        if (dropdown) {
            dropdown.classList.remove('visible');
        }
        this.activeAutocompleteIndex = -1;
    }

    /**
     * Get default dropdown content
     */
    getDropdownDefaultContent() {
        let html = '';

        // Recent searches
        if (this.recentSearches.length > 0) {
            html += `
                <div class="dropdown-section">
                    <div class="dropdown-section-header">
                        <span>\u{1F552} Recent</span>
                        <button class="dropdown-clear-btn" data-action="clear-recent">Clear</button>
                    </div>
                    ${this.recentSearches.slice(0, 5).map((search, idx) => `
                        <div class="dropdown-item" data-query="${this.escapeHtml(search.query)}" data-index="${idx}" role="option">
                            <span class="dropdown-item-icon">\u{1F50D}</span>
                            <span class="dropdown-item-text">${this.escapeHtml(search.query)}</span>
                            <span class="dropdown-item-count">${search.resultCount}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Trending
        html += `
            <div class="dropdown-section">
                <div class="dropdown-section-header">
                    <span>\u{1F525} Trending</span>
                </div>
                ${this.trendingSearches.slice(0, 4).map((term, idx) => `
                    <div class="dropdown-item" data-query="${term}" data-index="${this.recentSearches.length + idx}" role="option">
                        <span class="dropdown-item-icon">\u2B50</span>
                        <span class="dropdown-item-text">${term}</span>
                    </div>
                `).join('')}
            </div>
        `;

        return html;
    }

    /**
     * Attach event listeners to dropdown items
     */
    attachDropdownListeners(dropdown, input) {
        // Item click handlers
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                input.value = query;
                this.hideDropdown(dropdown);
                this.performSearch(query);
            });
        });

        // Clear recent button
        const clearBtn = dropdown.querySelector('[data-action="clear-recent"]');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearRecentSearches();
                dropdown.innerHTML = this.getDropdownDefaultContent();
                this.attachDropdownListeners(dropdown, input);
            });
        }
    }

    /**
     * Handle search input
     */
    async handleSearchInput(e, dropdown) {
        const query = e.target.value.trim();
        this.lastQuery = query;

        clearTimeout(this.debounceTimer);

        if (query.length < this.config.minQueryLength) {
            dropdown.innerHTML = this.getDropdownDefaultContent();
            this.attachDropdownListeners(dropdown, e.target);
            return;
        }

        // Show loading state
        dropdown.innerHTML = `
            <div class="dropdown-loading">
                <div class="dropdown-spinner"></div>
                <span>Searching...</span>
            </div>
        `;
        dropdown.classList.add('visible');

        this.debounceTimer = setTimeout(async () => {
            const suggestions = await this.getAutocompleteSuggestions(query);
            this.autocompleteResults = suggestions;

            // Only update if query hasn't changed
            if (this.lastQuery === query) {
                dropdown.innerHTML = this.renderAutocompleteResults(query, suggestions);
                this.attachDropdownListeners(dropdown, e.target);
            }
        }, this.config.autocompleteDebounce);
    }

    /**
     * Get autocomplete suggestions
     */
    async getAutocompleteSuggestions(query) {
        const suggestions = {
            entities: [],
            categories: [],
            mythologies: []
        };

        try {
            // Get entity suggestions from search engine
            if (window.advancedSearchSystem) {
                const results = await window.advancedSearchSystem.getAutocompleteSuggestions(query, 5);
                suggestions.entities = results || [];
            }

            // Match mythology names
            suggestions.mythologies = this.mythologies
                .filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 3);

            // Match entity types
            suggestions.categories = this.entityTypes
                .filter(t => t.label.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 2);

        } catch (error) {
            console.warn('[SearchEnhancements] Autocomplete error:', error);
        }

        return suggestions;
    }

    /**
     * Render autocomplete results
     */
    renderAutocompleteResults(query, suggestions) {
        let html = '';
        let totalIndex = 0;

        // Entity suggestions
        if (suggestions.entities && suggestions.entities.length > 0) {
            html += `
                <div class="dropdown-section">
                    <div class="dropdown-section-header">
                        <span>\u{1F4DA} Entities</span>
                    </div>
                    ${suggestions.entities.map(entity => {
                        const item = `
                            <div class="dropdown-item" data-query="${this.escapeHtml(entity)}" data-index="${totalIndex}" role="option">
                                <span class="dropdown-item-icon">\u2728</span>
                                <span class="dropdown-item-text">${this.highlightMatch(entity, query)}</span>
                            </div>
                        `;
                        totalIndex++;
                        return item;
                    }).join('')}
                </div>
            `;
        }

        // Mythology suggestions
        if (suggestions.mythologies && suggestions.mythologies.length > 0) {
            html += `
                <div class="dropdown-section">
                    <div class="dropdown-section-header">
                        <span>\u{1F30D} Mythologies</span>
                    </div>
                    ${suggestions.mythologies.map(myth => {
                        const item = `
                            <div class="dropdown-item" data-mythology="${myth.id}" data-query="${myth.name}" data-index="${totalIndex}" role="option">
                                <span class="dropdown-item-icon">\u{1F3DB}\uFE0F</span>
                                <span class="dropdown-item-text">${this.highlightMatch(myth.name, query)} Mythology</span>
                            </div>
                        `;
                        totalIndex++;
                        return item;
                    }).join('')}
                </div>
            `;
        }

        // Category suggestions
        if (suggestions.categories && suggestions.categories.length > 0) {
            html += `
                <div class="dropdown-section">
                    <div class="dropdown-section-header">
                        <span>\u{1F3AF} Categories</span>
                    </div>
                    ${suggestions.categories.map(cat => {
                        const item = `
                            <div class="dropdown-item" data-filter-type="${cat.id}" data-query="${cat.label}" data-index="${totalIndex}" role="option">
                                <span class="dropdown-item-icon">${cat.icon}</span>
                                <span class="dropdown-item-text">Search in ${this.highlightMatch(cat.label, query)}</span>
                            </div>
                        `;
                        totalIndex++;
                        return item;
                    }).join('')}
                </div>
            `;
        }

        // No results
        if (!html) {
            html = `
                <div class="dropdown-no-results">
                    <span class="dropdown-no-results-icon">\u{1F50E}</span>
                    <span>No suggestions for "${this.escapeHtml(query)}"</span>
                    <span class="dropdown-no-results-hint">Press Enter to search</span>
                </div>
            `;
        }

        return html;
    }

    /**
     * Handle keyboard navigation in search input
     */
    handleKeydown(e, dropdown) {
        const items = dropdown.querySelectorAll('.dropdown-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.activeAutocompleteIndex = Math.min(
                    this.activeAutocompleteIndex + 1,
                    items.length - 1
                );
                this.updateActiveItem(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.activeAutocompleteIndex = Math.max(
                    this.activeAutocompleteIndex - 1,
                    0
                );
                this.updateActiveItem(items);
                break;

            case 'Enter':
                e.preventDefault();
                if (this.activeAutocompleteIndex >= 0 && items[this.activeAutocompleteIndex]) {
                    const selectedItem = items[this.activeAutocompleteIndex];
                    const query = selectedItem.dataset.query;
                    e.target.value = query;
                    this.hideDropdown(dropdown);
                    this.performSearch(query, {
                        mythology: selectedItem.dataset.mythology,
                        filterType: selectedItem.dataset.filterType
                    });
                } else if (e.target.value.trim()) {
                    this.hideDropdown(dropdown);
                    this.performSearch(e.target.value.trim());
                }
                break;

            case 'Escape':
                this.hideDropdown(dropdown);
                this.activeAutocompleteIndex = -1;
                break;
        }
    }

    /**
     * Update active item highlighting
     */
    updateActiveItem(items) {
        items.forEach((item, idx) => {
            item.classList.toggle('active', idx === this.activeAutocompleteIndex);
        });

        // Scroll into view
        if (items[this.activeAutocompleteIndex]) {
            items[this.activeAutocompleteIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalKeydown(e) {
        // Ctrl+K or Cmd+K to open command palette
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.toggleCommandPalette();
        }

        // Forward slash to focus search (when not in input)
        if (e.key === '/' && !this.isInputFocused()) {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
            } else {
                this.openCommandPalette();
            }
        }
    }

    /**
     * Check if an input is focused
     */
    isInputFocused() {
        const active = document.activeElement;
        return active && (
            active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.isContentEditable
        );
    }

    /**
     * Toggle command palette
     */
    toggleCommandPalette() {
        if (this.isCommandPaletteOpen) {
            this.closeCommandPalette();
        } else {
            this.openCommandPalette();
        }
    }

    /**
     * Open command palette
     */
    openCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (!palette) return;

        palette.classList.add('open');
        this.isCommandPaletteOpen = true;

        // Focus input
        const input = palette.querySelector('#command-palette-input');
        if (input) {
            input.value = '';
            input.focus();
        }

        // Reset content
        const content = palette.querySelector('#command-palette-content');
        if (content) {
            content.innerHTML = this.getCommandPaletteDefaultContent();
            this.attachCommandPaletteListeners(palette);
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close command palette
     */
    closeCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (!palette) return;

        palette.classList.remove('open');
        this.isCommandPaletteOpen = false;
        this.activeAutocompleteIndex = -1;

        // Restore body scroll
        document.body.style.overflow = '';
    }

    /**
     * Handle command palette input
     */
    async handleCommandPaletteInput(e) {
        const query = e.target.value.trim();
        const content = document.getElementById('command-palette-content');

        if (query.length < this.config.minQueryLength) {
            content.innerHTML = this.getCommandPaletteDefaultContent();
            this.attachCommandPaletteListeners(document.getElementById('command-palette'));
            return;
        }

        // Show loading
        content.innerHTML = `
            <div class="command-loading">
                <div class="command-spinner"></div>
                <span>Searching for "${this.escapeHtml(query)}"...</span>
            </div>
        `;

        // Get suggestions
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(async () => {
            const suggestions = await this.getAutocompleteSuggestions(query);
            content.innerHTML = this.renderCommandPaletteResults(query, suggestions);
            this.attachCommandPaletteListeners(document.getElementById('command-palette'));
        }, this.config.autocompleteDebounce);
    }

    /**
     * Render command palette results
     */
    renderCommandPaletteResults(query, suggestions) {
        let html = '';
        let totalIndex = 0;

        // Quick search action
        html += `
            <div class="command-section">
                <div class="command-section-header">
                    <span class="command-section-icon">\u{1F50D}</span>
                    <span class="command-section-title">Search</span>
                </div>
                <div class="command-section-items">
                    <div class="command-item command-item-primary" data-query="${this.escapeHtml(query)}" data-index="${totalIndex}">
                        <span class="command-item-icon">\u{1F50E}</span>
                        <span class="command-item-text">Search for "<strong>${this.escapeHtml(query)}</strong>"</span>
                        <kbd>\u21B5</kbd>
                    </div>
                </div>
            </div>
        `;
        totalIndex++;

        // Entity results
        if (suggestions.entities && suggestions.entities.length > 0) {
            html += `
                <div class="command-section">
                    <div class="command-section-header">
                        <span class="command-section-icon">\u{1F4DA}</span>
                        <span class="command-section-title">Suggestions</span>
                    </div>
                    <div class="command-section-items">
                        ${suggestions.entities.map(entity => {
                            const item = `
                                <div class="command-item" data-query="${this.escapeHtml(entity)}" data-index="${totalIndex}">
                                    <span class="command-item-icon">\u2728</span>
                                    <span class="command-item-text">${this.highlightMatch(entity, query)}</span>
                                </div>
                            `;
                            totalIndex++;
                            return item;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // Mythology filter
        if (suggestions.mythologies && suggestions.mythologies.length > 0) {
            html += `
                <div class="command-section">
                    <div class="command-section-header">
                        <span class="command-section-icon">\u{1F30D}</span>
                        <span class="command-section-title">Search by Mythology</span>
                    </div>
                    <div class="command-section-items">
                        ${suggestions.mythologies.map(myth => {
                            const item = `
                                <div class="command-item" data-mythology="${myth.id}" data-query="${query}" data-index="${totalIndex}">
                                    <span class="command-item-icon">\u{1F3DB}\uFE0F</span>
                                    <span class="command-item-text">Search in ${this.highlightMatch(myth.name, query)}</span>
                                </div>
                            `;
                            totalIndex++;
                            return item;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    /**
     * Handle command palette keyboard navigation
     */
    handleCommandPaletteKeydown(e) {
        const items = document.querySelectorAll('#command-palette-content .command-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.activeAutocompleteIndex = Math.min(
                    this.activeAutocompleteIndex + 1,
                    items.length - 1
                );
                this.updateCommandPaletteActiveItem(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.activeAutocompleteIndex = Math.max(
                    this.activeAutocompleteIndex - 1,
                    0
                );
                this.updateCommandPaletteActiveItem(items);
                break;

            case 'Enter':
                e.preventDefault();
                let selectedItem = null;

                if (this.activeAutocompleteIndex >= 0 && items[this.activeAutocompleteIndex]) {
                    selectedItem = items[this.activeAutocompleteIndex];
                } else if (e.target.value.trim()) {
                    selectedItem = items[0]; // Default to first item
                }

                if (selectedItem) {
                    const query = selectedItem.dataset.query;
                    this.closeCommandPalette();
                    this.performSearch(query, {
                        mythology: selectedItem.dataset.mythology,
                        filterType: selectedItem.dataset.filterType
                    });
                }
                break;

            case 'Escape':
                this.closeCommandPalette();
                break;
        }
    }

    /**
     * Update active command palette item
     */
    updateCommandPaletteActiveItem(items) {
        items.forEach((item, idx) => {
            item.classList.toggle('active', idx === this.activeAutocompleteIndex);
        });

        if (items[this.activeAutocompleteIndex]) {
            items[this.activeAutocompleteIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Attach event listeners to command palette items
     */
    attachCommandPaletteListeners(palette) {
        if (!palette) return;

        // Item clicks
        palette.querySelectorAll('.command-item').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                this.closeCommandPalette();
                this.performSearch(query, {
                    mythology: item.dataset.mythology,
                    filterType: item.dataset.filterType
                });
            });
        });

        // Filter chip clicks
        palette.querySelectorAll('.command-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const filterType = chip.dataset.filterType;
                this.closeCommandPalette();
                window.location.hash = `#/browse/${filterType}`;
            });
        });

        // Clear recent
        const clearBtn = palette.querySelector('[data-action="clear-recent"]');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearRecentSearches();
                const content = palette.querySelector('#command-palette-content');
                if (content) {
                    content.innerHTML = this.getCommandPaletteDefaultContent();
                    this.attachCommandPaletteListeners(palette);
                }
            });
        }
    }

    /**
     * Perform search
     */
    performSearch(query, options = {}) {
        if (!query) return;

        // Add to recent searches (will be updated with result count later)
        this.addRecentSearch(query, 0);

        // Navigate to search results
        let hash = `#/search?q=${encodeURIComponent(query)}`;
        if (options.mythology) {
            hash += `&mythology=${options.mythology}`;
        }
        if (options.filterType && options.filterType !== 'all') {
            hash += `&type=${options.filterType}`;
        }

        window.location.hash = hash;
    }

    /**
     * Highlight matching text
     */
    highlightMatch(text, query) {
        if (!query || !text) return this.escapeHtml(text);

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');

        return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== Recent Searches Management ====================

    /**
     * Load recent searches from storage
     */
    loadRecentSearches() {
        try {
            const stored = localStorage.getItem(this.config.storageKeys.recentSearches);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('[SearchEnhancements] Failed to load recent searches:', e);
            return [];
        }
    }

    /**
     * Save recent searches to storage
     */
    saveRecentSearches() {
        try {
            localStorage.setItem(
                this.config.storageKeys.recentSearches,
                JSON.stringify(this.recentSearches)
            );
        } catch (e) {
            console.warn('[SearchEnhancements] Failed to save recent searches:', e);
        }
    }

    /**
     * Add a search to recent history
     */
    addRecentSearch(query, resultCount = 0) {
        // Remove existing entry for this query
        this.recentSearches = this.recentSearches.filter(s => s.query !== query);

        // Add to beginning
        this.recentSearches.unshift({
            query,
            resultCount,
            timestamp: Date.now()
        });

        // Limit size
        this.recentSearches = this.recentSearches.slice(0, this.config.maxRecentSearches);

        this.saveRecentSearches();
    }

    /**
     * Update result count for a recent search
     */
    updateRecentSearchResultCount(query, resultCount) {
        const search = this.recentSearches.find(s => s.query === query);
        if (search) {
            search.resultCount = resultCount;
            this.saveRecentSearches();
        }
    }

    /**
     * Clear recent searches
     */
    clearRecentSearches() {
        this.recentSearches = [];
        this.saveRecentSearches();
    }

    // ==================== Search Preferences ====================

    /**
     * Load search preferences
     */
    loadSearchPreferences() {
        try {
            const stored = localStorage.getItem(this.config.storageKeys.searchPreferences);
            return stored ? JSON.parse(stored) : {
                defaultSort: 'relevance',
                defaultView: 'grid',
                resultsPerPage: 20,
                savedFilters: []
            };
        } catch (e) {
            return {
                defaultSort: 'relevance',
                defaultView: 'grid',
                resultsPerPage: 20,
                savedFilters: []
            };
        }
    }

    /**
     * Save search preferences
     */
    saveSearchPreferences() {
        try {
            localStorage.setItem(
                this.config.storageKeys.searchPreferences,
                JSON.stringify(this.searchPreferences)
            );
        } catch (e) {
            console.warn('[SearchEnhancements] Failed to save preferences:', e);
        }
    }

    /**
     * Save a filter preset
     */
    saveFilterPreset(name, filters) {
        this.searchPreferences.savedFilters = this.searchPreferences.savedFilters || [];
        this.searchPreferences.savedFilters.push({
            name,
            filters,
            createdAt: Date.now()
        });
        this.saveSearchPreferences();
    }

    /**
     * Cleanup
     */
    destroy() {
        document.removeEventListener('keydown', this.handleGlobalKeydown);
        clearTimeout(this.debounceTimer);

        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.remove();
        }
    }
}

// Create and export global instance
window.SearchEnhancements = SearchEnhancements;
window.searchEnhancements = new SearchEnhancements();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.searchEnhancements.init();
    });
} else {
    window.searchEnhancements.init();
}
