/**
 * Sort/Filter Controls Component
 * Eyes of Azrael Project
 *
 * Comprehensive UI component for sorting, filtering, and organizing content.
 * Works with ContentFilterService for data operations.
 *
 * Features:
 * - Sort dropdown with 8 options and icons
 * - Filter bar (mythology, asset type, status, ownership, date range)
 * - Active filters display with pills
 * - Results count and sort indicator
 * - View toggle (grid/list/compact)
 * - Quick filters (needs contributors, controversial, trending, my contributions)
 * - URL parameter sync for shareable filtered views
 * - Event-driven architecture for integration
 *
 * Usage:
 *   const controls = new SortFilterControls({
 *     container: document.getElementById('sort-filter-container'),
 *     onFilterChange: (filters) => { console.log('Filters:', filters); },
 *     onSortChange: (sortBy) => { console.log('Sort:', sortBy); },
 *     onViewChange: (view) => { console.log('View:', view); }
 *   });
 */

class SortFilterControls {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element
     * @param {Function} options.onFilterChange - Callback when filters change
     * @param {Function} options.onSortChange - Callback when sort changes
     * @param {Function} options.onViewChange - Callback when view mode changes
     * @param {boolean} options.showMythologyFilter - Show mythology filter (default: true)
     * @param {boolean} options.showTypeFilter - Show asset type filter (default: true)
     * @param {boolean} options.showStatusFilter - Show status filter (default: true)
     * @param {boolean} options.showOwnershipFilter - Show ownership filter (default: true)
     * @param {boolean} options.showDateFilter - Show date range filter (default: true)
     * @param {boolean} options.showQuickFilters - Show quick filter buttons (default: true)
     * @param {boolean} options.showViewToggle - Show view toggle (default: true)
     * @param {boolean} options.syncWithURL - Sync filters with URL parameters (default: true)
     * @param {string} options.storageKey - LocalStorage key prefix (default: 'sfc')
     * @param {Array} options.mythologies - Available mythologies list
     * @param {Array} options.assetTypes - Available asset types list
     */
    constructor(options = {}) {
        this.container = options.container;
        this.onFilterChange = options.onFilterChange || null;
        this.onSortChange = options.onSortChange || null;
        this.onViewChange = options.onViewChange || null;

        // Feature flags
        this.showMythologyFilter = options.showMythologyFilter !== false;
        this.showTypeFilter = options.showTypeFilter !== false;
        this.showStatusFilter = options.showStatusFilter !== false;
        this.showOwnershipFilter = options.showOwnershipFilter !== false;
        this.showDateFilter = options.showDateFilter !== false;
        this.showQuickFilters = options.showQuickFilters !== false;
        this.showViewToggle = options.showViewToggle !== false;
        this.syncWithURL = options.syncWithURL !== false;
        this.storageKey = options.storageKey || 'sfc';

        // Data sources
        this.mythologies = options.mythologies || [];
        this.assetTypes = options.assetTypes || [
            { value: 'deities', label: 'Deities' },
            { value: 'heroes', label: 'Heroes' },
            { value: 'creatures', label: 'Creatures' },
            { value: 'items', label: 'Items' },
            { value: 'places', label: 'Places' },
            { value: 'texts', label: 'Texts' },
            { value: 'rituals', label: 'Rituals' },
            { value: 'symbols', label: 'Symbols' },
            { value: 'herbs', label: 'Herbs' },
            { value: 'archetypes', label: 'Archetypes' }
        ];

        // State
        this.currentSort = this.loadPreference('sort') || 'newest';
        this.currentView = this.loadPreference('view') || 'grid';
        this.activeFilters = [];
        this.isFilterPanelOpen = false;
        this.resultsCount = { showing: 0, total: 0 };

        // Firebase reference
        this.db = null;
        this.auth = null;

        // Debounce timer
        this.debounceTimer = null;
        this.debounceDelay = 300;

        // Initialize
        this.init();
    }

    /**
     * Initialize the component
     */
    async init() {
        // Get Firebase references
        if (typeof firebase !== 'undefined') {
            this.db = firebase.firestore ? firebase.firestore() : null;
            this.auth = firebase.auth ? firebase.auth() : null;
        }

        // Load mythologies if not provided
        if (this.mythologies.length === 0 && this.showMythologyFilter) {
            await this.loadMythologies();
        }

        // Load filters from URL if sync enabled
        if (this.syncWithURL) {
            this.loadFiltersFromURL();
        }

        // Render component
        this.render();

        // Attach event listeners
        this.attachEventListeners();

        // Listen for popstate (browser back/forward)
        if (this.syncWithURL) {
            window.addEventListener('popstate', () => this.loadFiltersFromURL(true));
        }
    }

    /**
     * Load mythologies from Firebase
     */
    async loadMythologies() {
        if (!this.db) return;

        try {
            const snapshot = await this.db.collection('mythologies')
                .orderBy('name', 'asc')
                .get();

            this.mythologies = snapshot.docs.map(doc => ({
                value: doc.id,
                label: doc.data().name || doc.id
            }));

            console.log('[SortFilterControls] Loaded mythologies:', this.mythologies.length);
        } catch (error) {
            console.error('[SortFilterControls] Error loading mythologies:', error);
        }
    }

    /**
     * Get sort options with icons
     */
    getSortOptions() {
        return [
            { value: 'most_popular', label: 'Most Popular', icon: 'trending_up' },
            { value: 'least_popular', label: 'Least Popular', icon: 'trending_down' },
            { value: 'most_controversial', label: 'Most Controversial', icon: 'local_fire_department' },
            { value: 'least_controversial', label: 'Least Controversial', icon: 'verified' },
            { value: 'newest', label: 'Newest First', icon: 'schedule' },
            { value: 'oldest', label: 'Oldest First', icon: 'history' },
            { value: 'biggest_contribution', label: 'Most Detailed', icon: 'expand' },
            { value: 'smallest_contribution', label: 'Least Detailed', icon: 'compress' }
        ];
    }

    /**
     * Get status options
     */
    getStatusOptions() {
        return [
            { value: 'pending', label: 'Pending Review', color: '#f59e0b' },
            { value: 'approved', label: 'Approved', color: '#10b981' },
            { value: 'flagged', label: 'Flagged', color: '#f97316' },
            { value: 'rejected', label: 'Rejected', color: '#ef4444' }
        ];
    }

    /**
     * Get ownership options
     */
    getOwnershipOptions() {
        return [
            { value: 'unclaimed', label: 'Unclaimed', icon: 'person_off' },
            { value: 'owned', label: 'Has Owner', icon: 'person' },
            { value: 'mine', label: 'My Content', icon: 'person_pin' }
        ];
    }

    /**
     * Get quick filter presets
     */
    getQuickFilters() {
        return [
            {
                id: 'needs_contributors',
                label: 'Needs Contributors',
                icon: 'group_add',
                tooltip: 'Unclaimed content with sparse information',
                filters: [
                    { type: 'owner', value: 'unclaimed' }
                ],
                sort: 'smallest_contribution'
            },
            {
                id: 'controversial',
                label: 'Controversial',
                icon: 'local_fire_department',
                tooltip: 'Content with high controversy scores',
                filters: [],
                sort: 'most_controversial'
            },
            {
                id: 'trending',
                label: 'Trending',
                icon: 'trending_up',
                tooltip: 'Recently popular content',
                filters: [],
                sort: 'most_popular'
            },
            {
                id: 'my_contributions',
                label: 'My Contributions',
                icon: 'edit',
                tooltip: 'Content you have contributed to',
                filters: [
                    { type: 'owner', value: 'mine' }
                ],
                sort: 'newest',
                requiresAuth: true
            }
        ];
    }

    /**
     * Render the component
     */
    render() {
        if (!this.container) return;

        const html = `
            <div class="sort-filter-controls" data-component="sort-filter-controls">
                <!-- Main Controls Bar -->
                <div class="sfc-main-bar">
                    <!-- Sort Dropdown -->
                    ${this.renderSortDropdown()}

                    <!-- Filter Button -->
                    <button type="button" class="filter-btn sfc-filter-toggle" aria-expanded="false">
                        <span class="material-icons filter-btn-icon">filter_list</span>
                        <span>Filters</span>
                        <span class="filter-btn-badge sfc-filter-count" style="display: none;">0</span>
                    </button>

                    <!-- Quick Filters -->
                    ${this.showQuickFilters ? this.renderQuickFilters() : ''}

                    <!-- Spacer -->
                    <div class="sfc-spacer"></div>

                    <!-- View Toggle -->
                    ${this.showViewToggle ? this.renderViewToggle() : ''}
                </div>

                <!-- Filter Panel (Collapsible) -->
                ${this.renderFilterPanel()}

                <!-- Active Filters Display -->
                <div class="active-filters sfc-active-filters"></div>

                <!-- Results Summary -->
                ${this.renderResultsSummary()}
            </div>
        `;

        this.container.innerHTML = html;

        // Update active filters display
        this.updateActiveFiltersDisplay();
    }

    /**
     * Render sort dropdown
     */
    renderSortDropdown() {
        const sortOptions = this.getSortOptions();
        const currentOption = sortOptions.find(o => o.value === this.currentSort) || sortOptions[4];

        return `
            <div class="sort-dropdown sfc-sort-dropdown">
                <span class="sort-dropdown-label">Sort</span>
                <button type="button" class="sort-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
                    <span class="material-icons sort-dropdown-icon">${currentOption.icon}</span>
                    <span class="sort-dropdown-text">${currentOption.label}</span>
                    <span class="material-icons sort-dropdown-arrow">expand_more</span>
                </button>
                <div class="sort-dropdown-menu" role="listbox" aria-label="Sort options">
                    ${sortOptions.map(option => `
                        <button type="button"
                                class="sort-menu-item ${option.value === this.currentSort ? 'selected' : ''}"
                                role="option"
                                aria-selected="${option.value === this.currentSort}"
                                data-value="${option.value}">
                            <span class="material-icons sort-menu-item-icon">${option.icon}</span>
                            <span class="sort-menu-item-text">${option.label}</span>
                            <span class="material-icons sort-menu-item-check">check</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render quick filter buttons
     */
    renderQuickFilters() {
        const quickFilters = this.getQuickFilters();
        const user = this.auth ? this.auth.currentUser : null;

        return `
            <div class="filter-controls sfc-quick-filters">
                ${quickFilters.map(qf => {
                    if (qf.requiresAuth && !user) return '';
                    return `
                        <button type="button"
                                class="filter-btn sfc-quick-filter"
                                data-quick-filter="${qf.id}"
                                title="${qf.tooltip}">
                            <span class="material-icons filter-btn-icon">${qf.icon}</span>
                            <span>${qf.label}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render view toggle
     */
    renderViewToggle() {
        const views = [
            { value: 'grid', icon: 'grid_view', label: 'Grid View' },
            { value: 'list', icon: 'view_list', label: 'List View' },
            { value: 'compact', icon: 'view_module', label: 'Compact View' }
        ];

        return `
            <div class="results-view-toggle sfc-view-toggle">
                ${views.map(view => `
                    <button type="button"
                            class="view-toggle-btn ${view.value === this.currentView ? 'active' : ''}"
                            data-view="${view.value}"
                            title="${view.label}"
                            aria-pressed="${view.value === this.currentView}">
                        <span class="material-icons">${view.icon}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render filter panel
     */
    renderFilterPanel() {
        return `
            <div class="filter-panel sfc-filter-panel">
                <div class="filter-panel-header">
                    <span class="filter-panel-title">Filter Options</span>
                    <button type="button" class="filter-panel-close" aria-label="Close filters">
                        <span class="material-icons">close</span>
                    </button>
                </div>

                <div class="sfc-filter-grid">
                    <!-- Mythology Filter -->
                    ${this.showMythologyFilter ? `
                        <div class="filter-group">
                            <label class="filter-group-label">Mythology</label>
                            <select class="filter-input sfc-mythology-select">
                                <option value="">All Mythologies</option>
                                ${this.mythologies.map(m => `
                                    <option value="${m.value}">${m.label}</option>
                                `).join('')}
                            </select>
                        </div>
                    ` : ''}

                    <!-- Asset Type Filter -->
                    ${this.showTypeFilter ? `
                        <div class="filter-group">
                            <label class="filter-group-label">Asset Type</label>
                            <select class="filter-input sfc-type-select">
                                <option value="">All Types</option>
                                ${this.assetTypes.map(t => `
                                    <option value="${t.value}">${t.label}</option>
                                `).join('')}
                            </select>
                        </div>
                    ` : ''}

                    <!-- Status Filter -->
                    ${this.showStatusFilter ? `
                        <div class="filter-group">
                            <label class="filter-group-label">Status</label>
                            <div class="filter-group-options sfc-status-options">
                                ${this.getStatusOptions().map(status => `
                                    <button type="button"
                                            class="filter-option sfc-status-option"
                                            data-value="${status.value}">
                                        <span class="filter-status-indicator filter-status-${status.value}"></span>
                                        ${status.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Ownership Filter -->
                    ${this.showOwnershipFilter ? `
                        <div class="filter-group">
                            <label class="filter-group-label">Ownership</label>
                            <div class="filter-group-options sfc-ownership-options">
                                ${this.getOwnershipOptions().map(opt => `
                                    <button type="button"
                                            class="filter-option sfc-ownership-option"
                                            data-value="${opt.value}">
                                        <span class="material-icons" style="font-size: 1rem;">${opt.icon}</span>
                                        ${opt.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Date Range Filter -->
                    ${this.showDateFilter ? `
                        <div class="filter-group">
                            <label class="filter-group-label">Date Range</label>
                            <div class="filter-date-range">
                                <input type="date"
                                       class="filter-date-input sfc-date-start"
                                       placeholder="Start date"
                                       aria-label="Start date">
                                <span class="filter-date-range-separator">to</span>
                                <input type="date"
                                       class="filter-date-input sfc-date-end"
                                       placeholder="End date"
                                       aria-label="End date">
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="sfc-filter-actions">
                    <button type="button" class="filter-clear-all sfc-clear-filters">
                        Clear All Filters
                    </button>
                    <button type="button" class="filter-btn active sfc-apply-filters">
                        Apply Filters
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render results summary
     */
    renderResultsSummary() {
        return `
            <div class="results-summary sfc-results-summary" style="display: none;">
                <span class="results-count">
                    Showing <span class="results-count-number sfc-showing-count">0</span>
                    of <span class="results-count-number sfc-total-count">0</span> results
                </span>
                <span class="sfc-sort-indicator">
                    Sorted by: <strong class="sfc-current-sort-label">Newest First</strong>
                </span>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const container = this.container;

        // Sort dropdown toggle
        const sortTrigger = container.querySelector('.sort-dropdown-trigger');
        if (sortTrigger) {
            sortTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSortDropdown();
            });
        }

        // Sort option selection
        container.querySelectorAll('.sort-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectSort(item.dataset.value);
            });
        });

        // Filter panel toggle
        const filterToggle = container.querySelector('.sfc-filter-toggle');
        if (filterToggle) {
            filterToggle.addEventListener('click', () => {
                this.toggleFilterPanel();
            });
        }

        // Filter panel close
        const filterClose = container.querySelector('.filter-panel-close');
        if (filterClose) {
            filterClose.addEventListener('click', () => {
                this.closeFilterPanel();
            });
        }

        // Quick filters
        container.querySelectorAll('.sfc-quick-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyQuickFilter(btn.dataset.quickFilter);
            });
        });

        // View toggle
        container.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectView(btn.dataset.view);
            });
        });

        // Mythology filter
        const mythologySelect = container.querySelector('.sfc-mythology-select');
        if (mythologySelect) {
            mythologySelect.addEventListener('change', () => {
                this.updateFilter('mythology', mythologySelect.value);
            });
        }

        // Type filter
        const typeSelect = container.querySelector('.sfc-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                this.updateFilter('type', typeSelect.value);
            });
        }

        // Status filter options
        container.querySelectorAll('.sfc-status-option').forEach(opt => {
            opt.addEventListener('click', () => {
                opt.classList.toggle('selected');
                this.updateFilter('status', opt.dataset.value, opt.classList.contains('selected'));
            });
        });

        // Ownership filter options
        container.querySelectorAll('.sfc-ownership-option').forEach(opt => {
            opt.addEventListener('click', () => {
                // Single select for ownership
                container.querySelectorAll('.sfc-ownership-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                this.updateFilter('owner', opt.dataset.value);
            });
        });

        // Date range filters
        const dateStart = container.querySelector('.sfc-date-start');
        const dateEnd = container.querySelector('.sfc-date-end');
        if (dateStart) {
            dateStart.addEventListener('change', () => {
                this.updateDateFilter();
            });
        }
        if (dateEnd) {
            dateEnd.addEventListener('change', () => {
                this.updateDateFilter();
            });
        }

        // Clear all filters
        const clearBtn = container.querySelector('.sfc-clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Apply filters
        const applyBtn = container.querySelector('.sfc-apply-filters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyFilters();
                this.closeFilterPanel();
            });
        }

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                this.closeSortDropdown();
            }
        });

        // Keyboard navigation
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSortDropdown();
                this.closeFilterPanel();
            }
        });
    }

    /**
     * Toggle sort dropdown
     */
    toggleSortDropdown() {
        const dropdown = this.container.querySelector('.sfc-sort-dropdown');
        const trigger = dropdown.querySelector('.sort-dropdown-trigger');
        const isOpen = dropdown.classList.contains('open');

        dropdown.classList.toggle('open');
        trigger.setAttribute('aria-expanded', !isOpen);
    }

    /**
     * Close sort dropdown
     */
    closeSortDropdown() {
        const dropdown = this.container.querySelector('.sfc-sort-dropdown');
        if (dropdown) {
            dropdown.classList.remove('open');
            const trigger = dropdown.querySelector('.sort-dropdown-trigger');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        }
    }

    /**
     * Select sort option
     * @param {string} value - Sort option value
     */
    selectSort(value) {
        this.currentSort = value;
        this.savePreference('sort', value);

        // Update UI
        const sortOptions = this.getSortOptions();
        const selectedOption = sortOptions.find(o => o.value === value) || sortOptions[0];

        // Update trigger display
        const trigger = this.container.querySelector('.sort-dropdown-trigger');
        if (trigger) {
            trigger.querySelector('.sort-dropdown-icon').textContent = selectedOption.icon;
            trigger.querySelector('.sort-dropdown-text').textContent = selectedOption.label;
        }

        // Update menu items
        this.container.querySelectorAll('.sort-menu-item').forEach(item => {
            const isSelected = item.dataset.value === value;
            item.classList.toggle('selected', isSelected);
            item.setAttribute('aria-selected', isSelected);
        });

        // Update sort indicator
        const sortLabel = this.container.querySelector('.sfc-current-sort-label');
        if (sortLabel) {
            sortLabel.textContent = selectedOption.label;
        }

        // Close dropdown
        this.closeSortDropdown();

        // Sync with URL
        if (this.syncWithURL) {
            this.updateURL();
        }

        // Emit event
        this.emitSortChange();
    }

    /**
     * Toggle filter panel
     */
    toggleFilterPanel() {
        const panel = this.container.querySelector('.sfc-filter-panel');
        const toggle = this.container.querySelector('.sfc-filter-toggle');
        this.isFilterPanelOpen = !this.isFilterPanelOpen;

        panel.classList.toggle('show', this.isFilterPanelOpen);
        toggle.setAttribute('aria-expanded', this.isFilterPanelOpen);
    }

    /**
     * Close filter panel
     */
    closeFilterPanel() {
        const panel = this.container.querySelector('.sfc-filter-panel');
        const toggle = this.container.querySelector('.sfc-filter-toggle');
        this.isFilterPanelOpen = false;

        panel.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
    }

    /**
     * Select view mode
     * @param {string} view - View mode ('grid', 'list', 'compact')
     */
    selectView(view) {
        this.currentView = view;
        this.savePreference('view', view);

        // Update UI
        this.container.querySelectorAll('.view-toggle-btn').forEach(btn => {
            const isActive = btn.dataset.view === view;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });

        // Emit event
        this.emitViewChange();
    }

    /**
     * Update a filter value
     * @param {string} type - Filter type
     * @param {string} value - Filter value
     * @param {boolean} add - Add or remove (for multi-select)
     */
    updateFilter(type, value, add = true) {
        // Remove existing filter of same type (for single-select filters)
        if (type !== 'status') {
            this.activeFilters = this.activeFilters.filter(f => f.type !== type);
        }

        if (value && add) {
            // Check if already exists (for status multi-select)
            const existingIndex = this.activeFilters.findIndex(f => f.type === type && f.value === value);

            if (existingIndex === -1) {
                this.activeFilters.push({ type, value });
            }
        } else if (!add) {
            // Remove specific filter
            this.activeFilters = this.activeFilters.filter(f => !(f.type === type && f.value === value));
        }

        this.updateFilterBadge();
    }

    /**
     * Update date range filter
     */
    updateDateFilter() {
        const startInput = this.container.querySelector('.sfc-date-start');
        const endInput = this.container.querySelector('.sfc-date-end');

        // Remove existing date range filter
        this.activeFilters = this.activeFilters.filter(f => f.type !== 'date_range');

        const start = startInput ? startInput.value : null;
        const end = endInput ? endInput.value : null;

        if (start || end) {
            this.activeFilters.push({
                type: 'date_range',
                start: start || null,
                end: end || null
            });
        }

        this.updateFilterBadge();
    }

    /**
     * Apply quick filter preset
     * @param {string} filterId - Quick filter ID
     */
    applyQuickFilter(filterId) {
        const quickFilters = this.getQuickFilters();
        const preset = quickFilters.find(qf => qf.id === filterId);

        if (!preset) return;

        // Clear existing filters
        this.clearAllFilters(false);

        // Apply preset filters
        preset.filters.forEach(f => {
            this.updateFilter(f.type, f.value, true);
        });

        // Apply preset sort
        if (preset.sort) {
            this.selectSort(preset.sort);
        }

        // Update UI
        this.updateActiveFiltersDisplay();
        this.updateFilterBadge();

        // Highlight active quick filter
        this.container.querySelectorAll('.sfc-quick-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quickFilter === filterId);
        });

        // Apply and emit
        this.applyFilters();
    }

    /**
     * Clear all filters
     * @param {boolean} emit - Whether to emit change event
     */
    clearAllFilters(emit = true) {
        this.activeFilters = [];

        // Reset UI
        const mythologySelect = this.container.querySelector('.sfc-mythology-select');
        if (mythologySelect) mythologySelect.value = '';

        const typeSelect = this.container.querySelector('.sfc-type-select');
        if (typeSelect) typeSelect.value = '';

        this.container.querySelectorAll('.sfc-status-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        this.container.querySelectorAll('.sfc-ownership-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        const dateStart = this.container.querySelector('.sfc-date-start');
        if (dateStart) dateStart.value = '';

        const dateEnd = this.container.querySelector('.sfc-date-end');
        if (dateEnd) dateEnd.value = '';

        // Clear quick filter highlights
        this.container.querySelectorAll('.sfc-quick-filter').forEach(btn => {
            btn.classList.remove('active');
        });

        // Update displays
        this.updateActiveFiltersDisplay();
        this.updateFilterBadge();

        if (emit) {
            this.applyFilters();
        }
    }

    /**
     * Remove a specific filter
     * @param {number} index - Filter index to remove
     */
    removeFilter(index) {
        const filter = this.activeFilters[index];
        if (!filter) return;

        // Remove from array
        this.activeFilters.splice(index, 1);

        // Update UI to reflect removed filter
        this.syncUIWithFilters();

        // Update displays
        this.updateActiveFiltersDisplay();
        this.updateFilterBadge();

        // Sync URL and emit
        if (this.syncWithURL) {
            this.updateURL();
        }
        this.emitFilterChange();
    }

    /**
     * Sync UI elements with current filter state
     */
    syncUIWithFilters() {
        // Sync mythology select
        const mythFilter = this.activeFilters.find(f => f.type === 'mythology');
        const mythologySelect = this.container.querySelector('.sfc-mythology-select');
        if (mythologySelect) {
            mythologySelect.value = mythFilter ? mythFilter.value : '';
        }

        // Sync type select
        const typeFilter = this.activeFilters.find(f => f.type === 'type');
        const typeSelect = this.container.querySelector('.sfc-type-select');
        if (typeSelect) {
            typeSelect.value = typeFilter ? typeFilter.value : '';
        }

        // Sync status options
        const statusFilters = this.activeFilters.filter(f => f.type === 'status').map(f => f.value);
        this.container.querySelectorAll('.sfc-status-option').forEach(opt => {
            opt.classList.toggle('selected', statusFilters.includes(opt.dataset.value));
        });

        // Sync ownership options
        const ownerFilter = this.activeFilters.find(f => f.type === 'owner');
        this.container.querySelectorAll('.sfc-ownership-option').forEach(opt => {
            opt.classList.toggle('selected', ownerFilter && ownerFilter.value === opt.dataset.value);
        });

        // Sync date inputs
        const dateFilter = this.activeFilters.find(f => f.type === 'date_range');
        const dateStart = this.container.querySelector('.sfc-date-start');
        const dateEnd = this.container.querySelector('.sfc-date-end');
        if (dateStart) dateStart.value = dateFilter && dateFilter.start ? dateFilter.start : '';
        if (dateEnd) dateEnd.value = dateFilter && dateFilter.end ? dateFilter.end : '';
    }

    /**
     * Apply filters and emit change
     */
    applyFilters() {
        // Sync with URL
        if (this.syncWithURL) {
            this.updateURL();
        }

        // Emit filter change
        this.emitFilterChange();
    }

    /**
     * Update active filters display (pills)
     */
    updateActiveFiltersDisplay() {
        const container = this.container.querySelector('.sfc-active-filters');
        if (!container) return;

        if (this.activeFilters.length === 0) {
            container.innerHTML = '';
            return;
        }

        const pillsHTML = this.activeFilters.map((filter, index) => {
            const label = this.getFilterLabel(filter.type);
            const value = this.getFilterValueLabel(filter);

            return `
                <div class="filter-pill" data-index="${index}">
                    <span class="filter-pill-label">${label}:</span>
                    <span class="filter-pill-value">${value}</span>
                    <button type="button"
                            class="filter-pill-remove"
                            aria-label="Remove ${label} filter"
                            data-index="${index}">
                        <span class="material-icons" style="font-size: 0.8rem;">close</span>
                    </button>
                </div>
            `;
        }).join('');

        const clearAllHTML = `
            <button type="button" class="filter-clear-all sfc-clear-all-pills">
                Clear All
            </button>
        `;

        container.innerHTML = pillsHTML + clearAllHTML;

        // Attach remove listeners
        container.querySelectorAll('.filter-pill-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.removeFilter(parseInt(btn.dataset.index, 10));
            });
        });

        // Attach clear all listener
        const clearAllBtn = container.querySelector('.sfc-clear-all-pills');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    /**
     * Get human-readable filter type label
     * @param {string} type - Filter type
     * @returns {string} Label
     */
    getFilterLabel(type) {
        const labels = {
            mythology: 'Mythology',
            type: 'Type',
            status: 'Status',
            owner: 'Ownership',
            date_range: 'Date'
        };
        return labels[type] || type;
    }

    /**
     * Get human-readable filter value label
     * @param {Object} filter - Filter object
     * @returns {string} Label
     */
    getFilterValueLabel(filter) {
        if (filter.type === 'mythology') {
            const myth = this.mythologies.find(m => m.value === filter.value);
            return myth ? myth.label : filter.value;
        }

        if (filter.type === 'type') {
            const type = this.assetTypes.find(t => t.value === filter.value);
            return type ? type.label : filter.value;
        }

        if (filter.type === 'status') {
            const status = this.getStatusOptions().find(s => s.value === filter.value);
            return status ? status.label : filter.value;
        }

        if (filter.type === 'owner') {
            const owner = this.getOwnershipOptions().find(o => o.value === filter.value);
            return owner ? owner.label : filter.value;
        }

        if (filter.type === 'date_range') {
            const start = filter.start || 'Any';
            const end = filter.end || 'Any';
            return `${start} - ${end}`;
        }

        return filter.value || '';
    }

    /**
     * Update filter count badge
     */
    updateFilterBadge() {
        const badge = this.container.querySelector('.sfc-filter-count');
        if (!badge) return;

        const count = this.activeFilters.length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    /**
     * Update results count display
     * @param {number} showing - Currently showing count
     * @param {number} total - Total count
     */
    updateResultsCount(showing, total) {
        this.resultsCount = { showing, total };

        const summary = this.container.querySelector('.sfc-results-summary');
        const showingEl = this.container.querySelector('.sfc-showing-count');
        const totalEl = this.container.querySelector('.sfc-total-count');

        if (summary) {
            summary.style.display = total > 0 ? 'flex' : 'none';
        }

        if (showingEl) {
            showingEl.textContent = showing;
        }

        if (totalEl) {
            totalEl.textContent = total;
        }
    }

    /**
     * Load filters from URL parameters
     * @param {boolean} applyImmediately - Apply filters immediately
     */
    loadFiltersFromURL(applyImmediately = false) {
        const params = new URLSearchParams(window.location.search);

        // Load sort
        const sort = params.get('sort');
        if (sort && this.getSortOptions().some(o => o.value === sort)) {
            this.currentSort = sort;
        }

        // Load view
        const view = params.get('view');
        if (view && ['grid', 'list', 'compact'].includes(view)) {
            this.currentView = view;
        }

        // Load filters
        this.activeFilters = [];

        const mythology = params.get('mythology');
        if (mythology) {
            this.activeFilters.push({ type: 'mythology', value: mythology });
        }

        const type = params.get('type');
        if (type) {
            this.activeFilters.push({ type: 'type', value: type });
        }

        const status = params.getAll('status');
        status.forEach(s => {
            this.activeFilters.push({ type: 'status', value: s });
        });

        const owner = params.get('owner');
        if (owner) {
            this.activeFilters.push({ type: 'owner', value: owner });
        }

        const dateStart = params.get('date_start');
        const dateEnd = params.get('date_end');
        if (dateStart || dateEnd) {
            this.activeFilters.push({
                type: 'date_range',
                start: dateStart || null,
                end: dateEnd || null
            });
        }

        // Update UI if already rendered
        if (this.container.querySelector('.sfc-sort-dropdown')) {
            this.syncUIWithFilters();
            this.updateActiveFiltersDisplay();
            this.updateFilterBadge();

            // Update sort dropdown display
            const sortOptions = this.getSortOptions();
            const selectedOption = sortOptions.find(o => o.value === this.currentSort) || sortOptions[4];
            const trigger = this.container.querySelector('.sort-dropdown-trigger');
            if (trigger) {
                trigger.querySelector('.sort-dropdown-icon').textContent = selectedOption.icon;
                trigger.querySelector('.sort-dropdown-text').textContent = selectedOption.label;
            }

            // Update view toggle
            this.container.querySelectorAll('.view-toggle-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === this.currentView);
            });
        }

        if (applyImmediately) {
            this.emitFilterChange();
            this.emitSortChange();
            this.emitViewChange();
        }
    }

    /**
     * Update URL with current filter state
     */
    updateURL() {
        const params = new URLSearchParams();

        // Add sort
        if (this.currentSort !== 'newest') {
            params.set('sort', this.currentSort);
        }

        // Add view
        if (this.currentView !== 'grid') {
            params.set('view', this.currentView);
        }

        // Add filters
        this.activeFilters.forEach(filter => {
            if (filter.type === 'mythology') {
                params.set('mythology', filter.value);
            } else if (filter.type === 'type') {
                params.set('type', filter.value);
            } else if (filter.type === 'status') {
                params.append('status', filter.value);
            } else if (filter.type === 'owner') {
                params.set('owner', filter.value);
            } else if (filter.type === 'date_range') {
                if (filter.start) params.set('date_start', filter.start);
                if (filter.end) params.set('date_end', filter.end);
            }
        });

        // Update URL without page reload
        const newURL = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;

        window.history.replaceState({}, '', newURL);
    }

    /**
     * Emit filter change event
     */
    emitFilterChange() {
        // Debounce
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            // Call callback
            if (this.onFilterChange && typeof this.onFilterChange === 'function') {
                this.onFilterChange(this.activeFilters);
            }

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('sortFilterControlsChange', {
                detail: {
                    type: 'filter',
                    filters: this.activeFilters,
                    timestamp: Date.now()
                }
            }));
        }, this.debounceDelay);
    }

    /**
     * Emit sort change event
     */
    emitSortChange() {
        // Call callback
        if (this.onSortChange && typeof this.onSortChange === 'function') {
            this.onSortChange(this.currentSort);
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('sortFilterControlsChange', {
            detail: {
                type: 'sort',
                sort: this.currentSort,
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Emit view change event
     */
    emitViewChange() {
        // Call callback
        if (this.onViewChange && typeof this.onViewChange === 'function') {
            this.onViewChange(this.currentView);
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('sortFilterControlsChange', {
            detail: {
                type: 'view',
                view: this.currentView,
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Save preference to localStorage
     * @param {string} key - Preference key
     * @param {string} value - Preference value
     */
    savePreference(key, value) {
        try {
            localStorage.setItem(`${this.storageKey}_${key}`, value);
        } catch (error) {
            console.warn('[SortFilterControls] Error saving preference:', error);
        }
    }

    /**
     * Load preference from localStorage
     * @param {string} key - Preference key
     * @returns {string|null} Preference value
     */
    loadPreference(key) {
        try {
            return localStorage.getItem(`${this.storageKey}_${key}`);
        } catch (error) {
            console.warn('[SortFilterControls] Error loading preference:', error);
            return null;
        }
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            sort: this.currentSort,
            view: this.currentView,
            filters: [...this.activeFilters],
            resultsCount: { ...this.resultsCount }
        };
    }

    /**
     * Set state programmatically
     * @param {Object} state - State to set
     */
    setState(state) {
        if (state.sort) {
            this.selectSort(state.sort);
        }

        if (state.view) {
            this.selectView(state.view);
        }

        if (state.filters) {
            this.activeFilters = [...state.filters];
            this.syncUIWithFilters();
            this.updateActiveFiltersDisplay();
            this.updateFilterBadge();
        }
    }

    /**
     * Destroy component and clean up
     */
    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Remove popstate listener
        if (this.syncWithURL) {
            window.removeEventListener('popstate', this.loadFiltersFromURL);
        }

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for ES modules
export { SortFilterControls };

// Global export for browser usage
if (typeof window !== 'undefined') {
    window.SortFilterControls = SortFilterControls;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Basic usage:
 *    const controls = new SortFilterControls({
 *      container: document.getElementById('controls-container'),
 *      onFilterChange: (filters) => {
 *        console.log('Filters changed:', filters);
 *        refreshContent(filters);
 *      },
 *      onSortChange: (sort) => {
 *        console.log('Sort changed:', sort);
 *        refreshContent(null, sort);
 *      },
 *      onViewChange: (view) => {
 *        console.log('View changed:', view);
 *        updateGridLayout(view);
 *      }
 *    });
 *
 * 2. With custom options:
 *    const controls = new SortFilterControls({
 *      container: document.getElementById('controls'),
 *      showStatusFilter: false,
 *      showOwnershipFilter: false,
 *      showQuickFilters: true,
 *      syncWithURL: true,
 *      mythologies: [
 *        { value: 'greek', label: 'Greek' },
 *        { value: 'norse', label: 'Norse' }
 *      ]
 *    });
 *
 * 3. Integration with ContentFilterService:
 *    const filterService = new ContentFilterService();
 *    const controls = new SortFilterControls({
 *      container: document.getElementById('controls'),
 *      onFilterChange: (filters) => {
 *        const filtered = filterService.combineFilters(allAssets, filters);
 *        displayAssets(filtered);
 *      },
 *      onSortChange: (sort) => {
 *        const sorted = filterService.sortByOption(currentAssets, sort);
 *        displayAssets(sorted);
 *      }
 *    });
 *
 * 4. Listen for events:
 *    window.addEventListener('sortFilterControlsChange', (event) => {
 *      const { type, filters, sort, view } = event.detail;
 *      console.log('Change event:', type, event.detail);
 *    });
 *
 * 5. Programmatic control:
 *    controls.setState({
 *      sort: 'most_popular',
 *      view: 'list',
 *      filters: [{ type: 'mythology', value: 'greek' }]
 *    });
 *
 * 6. Get current state:
 *    const state = controls.getState();
 *    console.log('Current state:', state);
 *
 * 7. Update results count:
 *    controls.updateResultsCount(24, 156);
 */
