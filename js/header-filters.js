/**
 * Header Filters Component
 * Global filtering system for content across the entire site
 * Provides unified filter controls in the site header for:
 * - Content Sources (Official, Community, Both)
 * - Mythologies (multi-select)
 * - Entity Types (multi-select)
 * - Topics/Tags (multi-select)
 */

class HeaderFilters {
    constructor() {
        this.filterState = {
            contentSource: 'both', // 'official', 'community', 'both'
            mythologies: [], // Array of mythology IDs
            entityTypes: [], // Array of entity types (deity, hero, etc.)
            topics: [] // Array of topic/tag IDs
        };

        this.availableOptions = {
            mythologies: [],
            entityTypes: [
                { id: 'deity', name: 'Deities', icon: '⚡' },
                { id: 'hero', name: 'Heroes', icon: '🗡️' },
                { id: 'creature', name: 'Creatures', icon: '🐉' },
                { id: 'item', name: 'Items', icon: '⚔️' },
                { id: 'place', name: 'Places', icon: '🏛️' },
                { id: 'concept', name: 'Concepts', icon: '💭' },
                { id: 'magic', name: 'Magic', icon: '🔮' },
                { id: 'theory', name: 'Theories', icon: '🔬' }
            ],
            topics: []
        };

        this.filterBarVisible = false;
        this.initialized = false;
        this.listeners = []; // Event listeners for filter changes
    }

    /**
     * Initialize the header filters system
     */
    async init() {
        if (this.initialized) return;

        try {
            // Load available options from Firebase
            await this.loadAvailableOptions();

            // Load saved preferences
            this.loadFromPreferences();

            // Render the filter bar
            this.renderFilterBar();

            // Apply URL parameters if present
            this.applyURLParameters();

            // Set up event listeners
            this.setupEventListeners();

            this.initialized = true;
            console.log('[HeaderFilters] Initialized successfully');
        } catch (error) {
            console.error('[HeaderFilters] Initialization error:', error);
        }
    }

    /**
     * Load available filter options from Firebase
     */
    async loadAvailableOptions() {
        try {
            // Load mythologies
            const mythSnapshot = await firebase.firestore()
                .collection('mythologies')
                .orderBy('name', 'asc')
                .get();

            this.availableOptions.mythologies = mythSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                icon: doc.data().icon || '🌍'
            }));

            // Load topics/tags
            const tagsSnapshot = await firebase.firestore()
                .collection('tags')
                .orderBy('name', 'asc')
                .limit(50)
                .get();

            this.availableOptions.topics = tagsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                count: doc.data().count || 0
            }));

            console.log('[HeaderFilters] Loaded options:', {
                mythologies: this.availableOptions.mythologies.length,
                topics: this.availableOptions.topics.length
            });
        } catch (error) {
            console.error('[HeaderFilters] Error loading options:', error);
            // Use fallback options
            this.availableOptions.mythologies = this.getFallbackMythologies();
            this.availableOptions.topics = this.getFallbackTopics();
        }
    }

    /**
     * Render the filter bar in the header
     */
    renderFilterBar() {
        // Find or create filter bar container
        let container = document.getElementById('header-filter-bar');
        if (!container) {
            // Create container below main navigation
            const header = document.querySelector('header') || document.body;
            container = document.createElement('div');
            container.id = 'header-filter-bar';
            header.insertAdjacentElement('afterend', container);
        }

        const activeCount = this.getActiveFilterCount();
        const isCollapsed = !this.filterBarVisible && activeCount === 0;

        container.innerHTML = `
            <div class="filter-bar-container ${isCollapsed ? 'collapsed' : ''}">
                <!-- Filter Toggle/Status Bar -->
                <div class="filter-status-bar" id="filter-status-bar">
                    <div class="filter-status-content">
                        <button class="filter-toggle-btn" id="filter-toggle-btn">
                            <span class="filter-icon">🔍</span>
                            <span class="filter-label">Filters</span>
                            ${activeCount > 0 ? `<span class="filter-badge">${activeCount}</span>` : ''}
                        </button>

                        ${activeCount > 0 ? `
                            <div class="active-filters-preview" id="active-filters-preview">
                                ${this.renderActiveFiltersPills()}
                            </div>
                        ` : ''}
                    </div>

                    ${activeCount > 0 ? `
                        <button class="btn-clear-all-filters" id="btn-clear-all-filters">
                            Clear All
                        </button>
                    ` : ''}
                </div>

                <!-- Filter Controls (expandable) -->
                <div class="filter-controls-panel ${this.filterBarVisible ? 'visible' : 'hidden'}" id="filter-controls-panel">
                    <div class="filter-controls-grid">
                        <!-- Content Source -->
                        <div class="filter-control">
                            <label class="filter-label">Content Source</label>
                            <div class="filter-dropdown" id="content-source-dropdown">
                                <button class="dropdown-btn" data-dropdown="content-source">
                                    <span class="dropdown-value">${this.getContentSourceLabel()}</span>
                                    <span class="dropdown-arrow">▼</span>
                                </button>
                                <div class="dropdown-menu" data-dropdown-menu="content-source">
                                    <label class="dropdown-option">
                                        <input type="radio" name="content-source" value="both" ${this.filterState.contentSource === 'both' ? 'checked' : ''}>
                                        <span>Both Official & Community</span>
                                    </label>
                                    <label class="dropdown-option">
                                        <input type="radio" name="content-source" value="official" ${this.filterState.contentSource === 'official' ? 'checked' : ''}>
                                        <span>Official Content Only</span>
                                    </label>
                                    <label class="dropdown-option">
                                        <input type="radio" name="content-source" value="community" ${this.filterState.contentSource === 'community' ? 'checked' : ''}>
                                        <span>Community Contributions</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Mythologies -->
                        <div class="filter-control">
                            <label class="filter-label">Mythologies ${this.filterState.mythologies.length > 0 ? `(${this.filterState.mythologies.length} selected)` : ''}</label>
                            <div class="filter-dropdown" id="mythologies-dropdown">
                                <button class="dropdown-btn" data-dropdown="mythologies">
                                    <span class="dropdown-value">${this.getMythologiesLabel()}</span>
                                    <span class="dropdown-arrow">▼</span>
                                </button>
                                <div class="dropdown-menu multi-select" data-dropdown-menu="mythologies">
                                    <div class="dropdown-search">
                                        <input type="text" placeholder="Search mythologies..." class="dropdown-search-input">
                                    </div>
                                    <div class="dropdown-options-list">
                                        ${this.availableOptions.mythologies.map(myth => `
                                            <label class="dropdown-option checkbox-option">
                                                <input type="checkbox" name="mythologies" value="${myth.id}"
                                                    ${this.filterState.mythologies.includes(myth.id) ? 'checked' : ''}>
                                                <span>${myth.icon} ${myth.name}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Entity Types -->
                        <div class="filter-control">
                            <label class="filter-label">Entity Types ${this.filterState.entityTypes.length > 0 ? `(${this.filterState.entityTypes.length} selected)` : ''}</label>
                            <div class="filter-dropdown" id="entity-types-dropdown">
                                <button class="dropdown-btn" data-dropdown="entity-types">
                                    <span class="dropdown-value">${this.getEntityTypesLabel()}</span>
                                    <span class="dropdown-arrow">▼</span>
                                </button>
                                <div class="dropdown-menu multi-select" data-dropdown-menu="entity-types">
                                    ${this.availableOptions.entityTypes.map(type => `
                                        <label class="dropdown-option checkbox-option">
                                            <input type="checkbox" name="entity-types" value="${type.id}"
                                                ${this.filterState.entityTypes.includes(type.id) ? 'checked' : ''}>
                                            <span>${type.icon} ${type.name}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Topics/Tags -->
                        <div class="filter-control">
                            <label class="filter-label">Topics/Tags ${this.filterState.topics.length > 0 ? `(${this.filterState.topics.length} selected)` : ''}</label>
                            <div class="filter-dropdown" id="topics-dropdown">
                                <button class="dropdown-btn" data-dropdown="topics">
                                    <span class="dropdown-value">${this.getTopicsLabel()}</span>
                                    <span class="dropdown-arrow">▼</span>
                                </button>
                                <div class="dropdown-menu multi-select" data-dropdown-menu="topics">
                                    <div class="dropdown-search">
                                        <input type="text" placeholder="Search topics..." class="dropdown-search-input">
                                    </div>
                                    <div class="dropdown-options-list">
                                        ${this.availableOptions.topics.map(topic => `
                                            <label class="dropdown-option checkbox-option">
                                                <input type="checkbox" name="topics" value="${topic.id}"
                                                    ${this.filterState.topics.includes(topic.id) ? 'checked' : ''}>
                                                <span>${topic.name} ${topic.count ? `(${topic.count})` : ''}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Clear All Button -->
                        <div class="filter-control filter-actions">
                            <button class="btn-clear-filters" id="btn-clear-filters-panel">
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Set up event listeners for filter controls
     */
    setupEventListeners() {
        // Toggle filter bar visibility
        const toggleBtn = document.getElementById('filter-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleFilterBar());
        }

        // Clear all filters buttons
        document.querySelectorAll('#btn-clear-all-filters, #btn-clear-filters-panel').forEach(btn => {
            btn.addEventListener('click', () => this.clearFilters());
        });

        // Dropdown toggles
        document.querySelectorAll('.dropdown-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dropdown = e.currentTarget.dataset.dropdown;
                this.toggleDropdown(dropdown);
            });
        });

        // Content source radio buttons
        document.querySelectorAll('input[name="content-source"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateFilters('contentSource', e.target.value);
            });
        });

        // Mythology checkboxes
        document.querySelectorAll('input[name="mythologies"]').forEach(input => {
            input.addEventListener('change', () => {
                const selected = Array.from(document.querySelectorAll('input[name="mythologies"]:checked'))
                    .map(cb => cb.value);
                this.updateFilters('mythologies', selected);
            });
        });

        // Entity type checkboxes
        document.querySelectorAll('input[name="entity-types"]').forEach(input => {
            input.addEventListener('change', () => {
                const selected = Array.from(document.querySelectorAll('input[name="entity-types"]:checked'))
                    .map(cb => cb.value);
                this.updateFilters('entityTypes', selected);
            });
        });

        // Topic checkboxes
        document.querySelectorAll('input[name="topics"]').forEach(input => {
            input.addEventListener('change', () => {
                const selected = Array.from(document.querySelectorAll('input[name="topics"]:checked'))
                    .map(cb => cb.value);
                this.updateFilters('topics', selected);
            });
        });

        // Dropdown search functionality
        document.querySelectorAll('.dropdown-search-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleDropdownSearch(e.target);
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.filter-dropdown')) {
                this.closeAllDropdowns();
            }
        });

        // Remove filter pills
        this.setupPillListeners();
    }

    /**
     * Set up listeners for active filter pills
     */
    setupPillListeners() {
        document.querySelectorAll('.filter-pill-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filterType = e.currentTarget.dataset.filterType;
                const filterValue = e.currentTarget.dataset.filterValue;
                this.removeFilter(filterType, filterValue);
            });
        });
    }

    /**
     * Toggle filter bar visibility
     */
    toggleFilterBar() {
        this.filterBarVisible = !this.filterBarVisible;
        const panel = document.getElementById('filter-controls-panel');
        const container = document.querySelector('.filter-bar-container');

        if (panel) {
            panel.classList.toggle('visible', this.filterBarVisible);
            panel.classList.toggle('hidden', !this.filterBarVisible);
        }

        if (container) {
            container.classList.toggle('collapsed', !this.filterBarVisible && this.getActiveFilterCount() === 0);
        }
    }

    /**
     * Toggle dropdown menu
     */
    toggleDropdown(dropdownId) {
        const menu = document.querySelector(`[data-dropdown-menu="${dropdownId}"]`);
        if (!menu) return;

        const isOpen = menu.classList.contains('show');

        // Close all other dropdowns
        this.closeAllDropdowns();

        // Toggle this dropdown
        if (!isOpen) {
            menu.classList.add('show');
        }
    }

    /**
     * Close all dropdown menus
     */
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    /**
     * Handle dropdown search input
     */
    handleDropdownSearch(input) {
        const searchTerm = input.value.toLowerCase();
        const dropdown = input.closest('.dropdown-menu');
        const options = dropdown.querySelectorAll('.dropdown-option');

        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            option.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    /**
     * Update filters
     * @param {string} filterType - Type of filter to update
     * @param {any} values - New filter values
     */
    updateFilters(filterType, values) {
        this.filterState[filterType] = values;

        // Save to preferences
        this.saveToPreferences();

        // Update URL parameters
        this.updateURLParameters();

        // Re-render filter bar to update counts
        this.renderFilterBar();
        this.setupEventListeners();

        // Notify listeners
        this.notifyFilterChange();

        console.log('[HeaderFilters] Updated:', filterType, values);
    }

    /**
     * Remove a specific filter
     */
    removeFilter(filterType, filterValue) {
        if (filterType === 'contentSource') {
            this.filterState.contentSource = 'both';
        } else if (Array.isArray(this.filterState[filterType])) {
            this.filterState[filterType] = this.filterState[filterType].filter(v => v !== filterValue);
        }

        this.updateFilters(filterType, this.filterState[filterType]);
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.filterState = {
            contentSource: 'both',
            mythologies: [],
            entityTypes: [],
            topics: []
        };

        this.saveToPreferences();
        this.updateURLParameters();
        this.renderFilterBar();
        this.setupEventListeners();
        this.notifyFilterChange();

        console.log('[HeaderFilters] All filters cleared');
    }

    /**
     * Get active filter state
     */
    getActiveFilters() {
        return { ...this.filterState };
    }

    /**
     * Get count of active filters
     */
    getActiveFilterCount() {
        let count = 0;
        if (this.filterState.contentSource !== 'both') count++;
        count += this.filterState.mythologies.length;
        count += this.filterState.entityTypes.length;
        count += this.filterState.topics.length;
        return count;
    }

    /**
     * Render active filter pills
     */
    renderActiveFiltersPills() {
        const pills = [];

        if (this.filterState.contentSource !== 'both') {
            pills.push(`
                <span class="filter-pill">
                    ${this.getContentSourceLabel()}
                    <button class="filter-pill-remove" data-filter-type="contentSource" data-filter-value="${this.filterState.contentSource}">×</button>
                </span>
            `);
        }

        this.filterState.mythologies.forEach(id => {
            const myth = this.availableOptions.mythologies.find(m => m.id === id);
            if (myth) {
                pills.push(`
                    <span class="filter-pill">
                        ${myth.icon} ${myth.name}
                        <button class="filter-pill-remove" data-filter-type="mythologies" data-filter-value="${id}">×</button>
                    </span>
                `);
            }
        });

        this.filterState.entityTypes.forEach(id => {
            const type = this.availableOptions.entityTypes.find(t => t.id === id);
            if (type) {
                pills.push(`
                    <span class="filter-pill">
                        ${type.icon} ${type.name}
                        <button class="filter-pill-remove" data-filter-type="entityTypes" data-filter-value="${id}">×</button>
                    </span>
                `);
            }
        });

        this.filterState.topics.forEach(id => {
            const topic = this.availableOptions.topics.find(t => t.id === id);
            if (topic) {
                pills.push(`
                    <span class="filter-pill">
                        ${topic.name}
                        <button class="filter-pill-remove" data-filter-type="topics" data-filter-value="${id}">×</button>
                    </span>
                `);
            }
        });

        return pills.join('');
    }

    /**
     * Get content source label
     */
    getContentSourceLabel() {
        const labels = {
            'both': 'Both Sources',
            'official': 'Official Only',
            'community': 'Community Only'
        };
        return labels[this.filterState.contentSource] || 'Both Sources';
    }

    /**
     * Get mythologies label
     */
    getMythologiesLabel() {
        const count = this.filterState.mythologies.length;
        if (count === 0) return 'All Mythologies';
        if (count === 1) {
            const myth = this.availableOptions.mythologies.find(m => m.id === this.filterState.mythologies[0]);
            return myth ? `${myth.icon} ${myth.name}` : '1 selected';
        }
        return `${count} selected`;
    }

    /**
     * Get entity types label
     */
    getEntityTypesLabel() {
        const count = this.filterState.entityTypes.length;
        if (count === 0) return 'All Types';
        if (count === 1) {
            const type = this.availableOptions.entityTypes.find(t => t.id === this.filterState.entityTypes[0]);
            return type ? `${type.icon} ${type.name}` : '1 selected';
        }
        return `${count} selected`;
    }

    /**
     * Get topics label
     */
    getTopicsLabel() {
        const count = this.filterState.topics.length;
        if (count === 0) return 'All Topics';
        if (count === 1) {
            const topic = this.availableOptions.topics.find(t => t.id === this.filterState.topics[0]);
            return topic ? topic.name : '1 selected';
        }
        return `${count} selected`;
    }

    /**
     * Save filter state to localStorage
     */
    saveToPreferences() {
        try {
            localStorage.setItem('headerFilters', JSON.stringify(this.filterState));
        } catch (error) {
            console.error('[HeaderFilters] Error saving preferences:', error);
        }
    }

    /**
     * Load filter state from localStorage
     */
    loadFromPreferences() {
        try {
            const stored = localStorage.getItem('headerFilters');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.filterState = {
                    contentSource: parsed.contentSource || 'both',
                    mythologies: parsed.mythologies || [],
                    entityTypes: parsed.entityTypes || [],
                    topics: parsed.topics || []
                };
            }
        } catch (error) {
            console.error('[HeaderFilters] Error loading preferences:', error);
        }
    }

    /**
     * Apply URL parameters to filter state
     */
    applyURLParameters() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('source')) {
            this.filterState.contentSource = params.get('source');
        }

        if (params.has('mythology')) {
            this.filterState.mythologies = params.get('mythology').split(',');
        }

        if (params.has('type')) {
            this.filterState.entityTypes = params.get('type').split(',');
        }

        if (params.has('topics')) {
            this.filterState.topics = params.get('topics').split(',');
        }
    }

    /**
     * Update URL parameters to reflect current filters
     */
    updateURLParameters() {
        const params = new URLSearchParams(window.location.search);

        // Update parameters
        if (this.filterState.contentSource !== 'both') {
            params.set('source', this.filterState.contentSource);
        } else {
            params.delete('source');
        }

        if (this.filterState.mythologies.length > 0) {
            params.set('mythology', this.filterState.mythologies.join(','));
        } else {
            params.delete('mythology');
        }

        if (this.filterState.entityTypes.length > 0) {
            params.set('type', this.filterState.entityTypes.join(','));
        } else {
            params.delete('type');
        }

        if (this.filterState.topics.length > 0) {
            params.set('topics', this.filterState.topics.join(','));
        } else {
            params.delete('topics');
        }

        // Update URL without reload
        const newURL = params.toString() ?
            `${window.location.pathname}?${params.toString()}` :
            window.location.pathname;

        window.history.replaceState({}, '', newURL);
    }

    /**
     * Register a listener for filter changes
     */
    onFilterChange(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notify all listeners of filter change
     */
    notifyFilterChange() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getActiveFilters());
            } catch (error) {
                console.error('[HeaderFilters] Error in filter change listener:', error);
            }
        });
    }

    /**
     * Get fallback mythologies
     */
    getFallbackMythologies() {
        return [
            { id: 'greek', name: 'Greek', icon: '⚡' },
            { id: 'norse', name: 'Norse', icon: '⚔️' },
            { id: 'egyptian', name: 'Egyptian', icon: '𓂀' },
            { id: 'hindu', name: 'Hindu', icon: '🕉️' },
            { id: 'buddhist', name: 'Buddhist', icon: '☸️' },
            { id: 'chinese', name: 'Chinese', icon: '☯️' },
            { id: 'japanese', name: 'Japanese', icon: '⛩️' },
            { id: 'celtic', name: 'Celtic', icon: '☘️' },
            { id: 'jewish', name: 'Jewish', icon: '✡️' },
            { id: 'christian', name: 'Christian', icon: '✝️' },
            { id: 'islamic', name: 'Islamic', icon: '☪️' }
        ];
    }

    /**
     * Get fallback topics
     */
    getFallbackTopics() {
        return [
            { id: 'creation', name: 'Creation', count: 0 },
            { id: 'death', name: 'Death & Afterlife', count: 0 },
            { id: 'war', name: 'War & Combat', count: 0 },
            { id: 'love', name: 'Love & Beauty', count: 0 },
            { id: 'wisdom', name: 'Wisdom & Knowledge', count: 0 },
            { id: 'nature', name: 'Nature & Elements', count: 0 }
        ];
    }
}

// Create global instance
window.HeaderFilters = HeaderFilters;

// Auto-initialize when DOM is ready and Firebase is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderFilters);
} else {
    initHeaderFilters();
}

async function initHeaderFilters() {
    // Wait for Firebase to be ready
    const waitForFirebase = () => {
        return new Promise((resolve) => {
            if (window.firebaseApp && window.firebaseDb) {
                resolve();
            } else {
                setTimeout(() => waitForFirebase().then(resolve), 100);
            }
        });
    };

    await waitForFirebase();

    // Initialize header filters
    window.headerFilters = new HeaderFilters();
    await window.headerFilters.init();

    console.log('[HeaderFilters] Ready');
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderFilters;
}
