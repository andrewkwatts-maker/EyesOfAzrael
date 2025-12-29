/**
 * Browse Category View - PRODUCTION-READY POLISHED VERSION
 *
 * Full-featured browse view with all user interaction capabilities:
 * - ✅ Add Asset button (Agent 6)
 * - ✅ Content filter toggle (Agent 9)
 * - ✅ Sort selector (Agent 10)
 * - ✅ Vote buttons on cards (Agent 8)
 * - ✅ User content badges
 * - ✅ Edit icons for owned assets
 * - ✅ Loading states for all actions
 * - ✅ Empty states (no results)
 * - ✅ Error states (network failures)
 * - ✅ Responsive design (4 breakpoints)
 * - ✅ WCAG AA accessibility
 * - ✅ 60fps animations
 * - ✅ Professional visual polish
 *
 * Dependencies:
 * - AssetService (js/services/asset-service.js)
 * - VoteService (js/services/vote-service.js)
 * - ContentFilter (js/components/content-filter.js)
 * - SortSelector (js/components/sort-selector.js)
 * - AddEntityCard (js/components/add-entity-card.js)
 * - VoteButtonsComponent (js/components/vote-buttons.js)
 */

class BrowseCategoryViewPolished {
    constructor(firestore) {
        this.db = firestore;
        this.cache = window.cacheManager || new FirebaseCacheManager({ db: firestore });
        this.assetService = new AssetService();
        this.voteService = null;

        // Entity data
        this.entities = [];
        this.filteredEntities = [];
        this.displayedEntities = [];
        this.category = null;
        this.mythology = null;

        // User state
        this.currentUser = null;
        this.userVotes = new Map(); // itemId -> vote value (1, -1, or 0)

        // View state
        this.viewMode = localStorage.getItem('browse-view-mode') || 'grid';
        this.viewDensity = localStorage.getItem('browse-view-density') || 'comfortable';
        this.sortBy = localStorage.getItem('browse-sort-by') || 'votes-desc';

        // Filter state
        this.searchTerm = '';
        this.selectedMythologies = new Set();
        this.selectedDomains = new Set();
        this.showUserContent = false;

        // Pagination
        this.currentPage = 1;
        this.itemsPerPage = 24;
        this.useVirtualScrolling = false;
        this.visibleRange = { start: 0, end: 24 };

        // UI state
        this.isLoading = false;
        this.hasError = false;
        this.errorMessage = '';

        // Components
        this.contentFilter = null;
        this.sortSelector = null;
        this.addEntityCard = null;
        this.voteComponents = new Map(); // entityId -> VoteButtonsComponent

        // Debounce timers
        this.searchTimeout = null;
        this.scrollTimeout = null;
        this.resizeTimeout = null;
    }

    /**
     * Render browse view for a category
     */
    async render(container, options = {}) {
        this.category = options.category;
        this.mythology = options.mythology;
        this.container = container;

        console.log(`[Browse View Polished] Rendering ${this.category}${this.mythology ? ` (${this.mythology})` : ''}`);

        // Show loading state with skeleton
        this.showLoadingState();

        try {
            // Initialize services
            await this.initializeServices();

            // Load entities
            await this.loadEntities();

            // Render main content
            this.renderMainContent();

            // Initialize components
            await this.initializeComponents();

            // Attach event listeners
            this.attachEventListeners();

            // Apply initial filters and sort
            this.applyFiltersAndSort();

            // Mark as loaded
            this.isLoading = false;
            this.hasError = false;

            // Dispatch completion event
            window.dispatchEvent(new CustomEvent('browse-view-loaded', {
                detail: { category: this.category, mythology: this.mythology }
            }));

        } catch (error) {
            console.error('[Browse View Polished] Error:', error);
            this.showError(error);
        }
    }

    /**
     * Initialize Firebase services
     */
    async initializeServices() {
        // Wait for Firebase
        if (typeof window.waitForFirebase === 'function') {
            await window.waitForFirebase();
        }

        // Initialize vote service
        if (window.VoteService && window.db && window.auth) {
            this.voteService = new window.VoteService(window.db, window.auth);
        }

        // Get current user
        if (window.auth && window.auth.currentUser) {
            this.currentUser = window.auth.currentUser;
        }

        // Listen for auth changes
        if (window.auth) {
            window.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.onAuthStateChanged(user);
            });
        }
    }

    /**
     * Handle auth state changes
     */
    onAuthStateChanged(user) {
        console.log('[Browse View Polished] Auth state changed:', user ? user.uid : 'signed out');

        // Update edit icons visibility
        this.updateEditIconsVisibility();

        // Reload if user content visibility should change
        if (user && this.showUserContent) {
            this.reloadEntities();
        }
    }

    /**
     * Load entities from Firebase
     */
    async loadEntities() {
        console.log(`[Browse View Polished] Loading ${this.category}...`);

        try {
            // Get user preference for community content
            const prefsService = new UserPreferencesService();
            await prefsService.init();
            this.showUserContent = prefsService.shouldShowUserContent();

            // Fetch assets
            this.entities = await this.assetService.getAssets(this.category, {
                mythology: this.mythology,
                includeUserContent: this.showUserContent,
                orderBy: 'name',
                limit: 500
            });

            // Load vote counts for all entities
            if (this.voteService) {
                await this.loadVoteCounts();
            }

            // Add metadata for sorting
            this.entities = this.entities.map((entity, index) => ({
                ...entity,
                _popularity: this.calculatePopularity(entity),
                _dateAdded: entity.dateAdded || entity.createdAt || Date.now() - (index * 1000),
                _contested: this.calculateContestedScore(entity),
                _netVotes: (entity.upvotes || 0) - (entity.downvotes || 0)
            }));

            // Group and extract metadata
            this.groupedEntities = this.groupByMythology(this.entities);
            this.availableDomains = this.extractUniqueDomains(this.entities);

            console.log(`[Browse View Polished] Loaded ${this.entities.length} ${this.category}`);
            console.log(`[Browse View Polished] Standard: ${this.entities.filter(e => e.isStandard).length}, Community: ${this.entities.filter(e => !e.isStandard).length}`);

        } catch (error) {
            console.error('[Browse View Polished] Error loading entities:', error);
            throw error;
        }
    }

    /**
     * Load vote counts for all entities
     */
    async loadVoteCounts() {
        if (!this.voteService) return;

        try {
            const votePromises = this.entities.map(async (entity) => {
                const votes = await this.voteService.getVoteCounts(entity.id, this.category);
                entity.upvotes = votes.upvotes || 0;
                entity.downvotes = votes.downvotes || 0;

                // Load user's vote if authenticated
                if (this.currentUser) {
                    const userVote = await this.voteService.getUserVote(entity.id, this.category, this.currentUser.uid);
                    this.userVotes.set(entity.id, userVote);
                }
            });

            await Promise.all(votePromises);
        } catch (error) {
            console.error('[Browse View Polished] Error loading vote counts:', error);
        }
    }

    /**
     * Calculate popularity score
     */
    calculatePopularity(entity) {
        let score = 0;

        // Vote-based popularity
        if (entity.upvotes) score += entity.upvotes * 5;
        if (entity.downvotes) score -= entity.downvotes * 2;

        // Engagement metrics
        if (entity.views) score += entity.views * 1;
        if (entity.comments) score += entity.comments * 10;
        if (entity.shares) score += entity.shares * 15;

        // Content quality
        if (entity.domains && entity.domains.length) score += entity.domains.length * 2;
        if (entity.description && entity.description.length > 200) score += 20;
        if (entity.icon) score += 10;

        return Math.max(0, score);
    }

    /**
     * Calculate contested score (high engagement but divisive)
     */
    calculateContestedScore(entity) {
        const upvotes = entity.upvotes || 0;
        const downvotes = entity.downvotes || 0;
        const totalVotes = upvotes + downvotes;

        if (totalVotes < 10) return 0; // Need minimum votes to be considered contested

        // Calculate controversy: higher when votes are evenly split
        const voteRatio = Math.min(upvotes, downvotes) / Math.max(upvotes, downvotes, 1);
        const controversy = voteRatio * totalVotes;

        return controversy;
    }

    /**
     * Group entities by mythology
     */
    groupByMythology(entities) {
        const grouped = {};
        entities.forEach(entity => {
            const myth = entity.mythology || 'unknown';
            if (!grouped[myth]) grouped[myth] = [];
            grouped[myth].push(entity);
        });
        return grouped;
    }

    /**
     * Extract unique domains
     */
    extractUniqueDomains(entities) {
        const domains = new Set();
        entities.forEach(entity => {
            const entityDomains = entity.domains || entity.attributes || entity.roles || [];
            entityDomains.forEach(domain => domains.add(domain));
        });
        return domains;
    }

    /**
     * Show loading state with skeleton cards
     */
    showLoadingState() {
        this.container.innerHTML = `
            <div class="browse-view">
                <div class="browse-loading-skeleton">
                    <!-- Skeleton Header -->
                    <div class="skeleton-header">
                        <div class="skeleton-icon skeleton-pulse"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title skeleton-pulse"></div>
                            <div class="skeleton-text skeleton-pulse"></div>
                            <div class="skeleton-stats skeleton-pulse"></div>
                        </div>
                    </div>

                    <!-- Skeleton Controls -->
                    <div class="skeleton-controls">
                        <div class="skeleton-button skeleton-pulse"></div>
                        <div class="skeleton-filter skeleton-pulse"></div>
                        <div class="skeleton-sort skeleton-pulse"></div>
                    </div>

                    <!-- Skeleton Grid -->
                    <div class="skeleton-grid">
                        ${Array(6).fill(0).map(() => `
                            <div class="skeleton-card skeleton-pulse">
                                <div class="skeleton-card-icon"></div>
                                <div class="skeleton-card-title"></div>
                                <div class="skeleton-card-text"></div>
                                <div class="skeleton-card-text" style="width: 80%;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ${this.getLoadingStyles()}
        `;
    }

    /**
     * Render main content structure
     */
    renderMainContent() {
        const categoryInfo = this.getCategoryInfo(this.category);

        this.container.innerHTML = `
            <div class="browse-view">
                <!-- Header with Add Button -->
                ${this.getHeaderHTML(categoryInfo)}

                <!-- User Interaction Controls -->
                <div class="browse-interaction-bar">
                    <!-- Add Entity Card Container -->
                    <div id="addEntityContainer" class="add-entity-container"></div>

                    <!-- Content Filter Container -->
                    <div id="contentFilterContainer" class="content-filter-container"></div>

                    <!-- Sort Selector Container -->
                    <div id="sortSelectorContainer" class="sort-selector-container"></div>
                </div>

                <!-- Quick Filters & Stats -->
                ${this.getQuickFiltersHTML()}

                <!-- Search & View Controls -->
                ${this.getSearchAndViewControlsHTML()}

                <!-- Entity Grid Container -->
                <div class="entity-grid-wrapper">
                    <div class="entity-grid ${this.viewMode}-view density-${this.viewDensity}"
                         id="entityGrid"
                         role="list"
                         aria-label="${categoryInfo.name}">
                        <!-- Cards will be inserted here -->
                    </div>
                </div>

                <!-- Pagination -->
                <div class="pagination-controls" id="paginationControls"></div>

                <!-- Loading Overlay -->
                <div class="loading-overlay" id="loadingOverlay" aria-hidden="true">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Loading...</p>
                </div>
            </div>

            ${this.getStyles()}
        `;
    }

    /**
     * Get header HTML with stats
     */
    getHeaderHTML(categoryInfo) {
        return `
            <header class="browse-header" role="banner">
                <div class="header-visual">
                    <div class="header-icon" aria-hidden="true">${categoryInfo.icon}</div>
                </div>
                <div class="header-content">
                    <h1 class="header-title">${categoryInfo.name}</h1>
                    <p class="header-description">${categoryInfo.description}</p>
                    <div class="header-stats" id="browseStats" role="status" aria-live="polite">
                        <!-- Stats will be updated dynamically -->
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * Get quick filters HTML
     */
    getQuickFiltersHTML() {
        const topMythologies = Object.entries(this.groupedEntities || {})
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 8);

        const topDomains = Array.from(this.availableDomains || []).slice(0, 10);

        return `
            <div class="quick-filters" role="region" aria-label="Quick filters">
                <!-- Mythology Chips -->
                ${topMythologies.length > 0 ? `
                    <div class="filter-section">
                        <h3 class="filter-section-title">
                            <span class="filter-section-icon" aria-hidden="true">🌍</span>
                            Filter by Mythology
                        </h3>
                        <div class="filter-chips" role="group" aria-label="Mythology filters">
                            ${topMythologies.map(([myth, entities]) => `
                                <button
                                    class="filter-chip"
                                    data-filter-type="mythology"
                                    data-filter-value="${myth}"
                                    aria-pressed="false"
                                    type="button">
                                    <span class="chip-label">${this.capitalize(myth)}</span>
                                    <span class="chip-count" aria-label="${entities.length} items">${entities.length}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Domain Chips -->
                ${topDomains.length > 0 && this.category === 'deities' ? `
                    <div class="filter-section">
                        <h3 class="filter-section-title">
                            <span class="filter-section-icon" aria-hidden="true">🏷️</span>
                            Filter by Domain
                        </h3>
                        <div class="filter-chips" role="group" aria-label="Domain filters">
                            ${topDomains.map(domain => `
                                <button
                                    class="filter-chip"
                                    data-filter-type="domain"
                                    data-filter-value="${domain}"
                                    aria-pressed="false"
                                    type="button">
                                    <span class="chip-label">${domain}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Active Filters Display -->
                <div class="active-filters" id="activeFilters" style="display: none;" role="status" aria-live="polite">
                    <span class="active-filters-label">Active filters:</span>
                    <div class="active-filter-chips" id="activeFilterChips"></div>
                    <button class="clear-filters-btn" id="clearFiltersBtn" type="button">
                        Clear all
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get search and view controls HTML
     */
    getSearchAndViewControlsHTML() {
        return `
            <div class="browse-controls" role="region" aria-label="Search and view controls">
                <!-- Search -->
                <div class="search-box">
                    <label for="searchInput" class="sr-only">Search ${this.category}</label>
                    <input
                        type="search"
                        id="searchInput"
                        class="search-input"
                        placeholder="Search ${this.category}..."
                        autocomplete="off"
                        aria-label="Search ${this.category}"
                    />
                    <span class="search-icon" aria-hidden="true">🔍</span>
                </div>

                <!-- View Controls -->
                <div class="view-controls">
                    <!-- View Mode Toggle -->
                    <div class="view-mode-toggle" role="group" aria-label="View mode">
                        <button
                            class="view-mode-btn ${this.viewMode === 'grid' ? 'active' : ''}"
                            data-view="grid"
                            aria-label="Grid view"
                            aria-pressed="${this.viewMode === 'grid'}"
                            type="button">
                            <svg class="view-mode-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7"/>
                                <rect x="14" y="3" width="7" height="7"/>
                                <rect x="14" y="14" width="7" height="7"/>
                                <rect x="3" y="14" width="7" height="7"/>
                            </svg>
                            <span class="view-mode-label">Grid</span>
                        </button>
                        <button
                            class="view-mode-btn ${this.viewMode === 'list' ? 'active' : ''}"
                            data-view="list"
                            aria-label="List view"
                            aria-pressed="${this.viewMode === 'list'}"
                            type="button">
                            <svg class="view-mode-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="8" y1="6" x2="21" y2="6"/>
                                <line x1="8" y1="12" x2="21" y2="12"/>
                                <line x1="8" y1="18" x2="21" y2="18"/>
                                <line x1="3" y1="6" x2="3.01" y2="6"/>
                                <line x1="3" y1="12" x2="3.01" y2="12"/>
                                <line x1="3" y1="18" x2="3.01" y2="18"/>
                            </svg>
                            <span class="view-mode-label">List</span>
                        </button>
                    </div>

                    <!-- Density Dropdown -->
                    <div class="density-dropdown">
                        <button class="density-btn" id="densityBtn" aria-haspopup="true" aria-expanded="false" type="button">
                            <svg class="density-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"/>
                                <circle cx="12" cy="12" r="8"/>
                            </svg>
                            <span class="density-label">${this.capitalize(this.viewDensity)}</span>
                        </button>
                        <div class="density-menu" id="densityMenu" role="menu">
                            <button class="density-option ${this.viewDensity === 'compact' ? 'active' : ''}"
                                    data-density="compact"
                                    role="menuitem"
                                    type="button">
                                <span class="density-option-icon">▪</span>
                                <span class="density-option-label">Compact</span>
                            </button>
                            <button class="density-option ${this.viewDensity === 'comfortable' ? 'active' : ''}"
                                    data-density="comfortable"
                                    role="menuitem"
                                    type="button">
                                <span class="density-option-icon">▪▪</span>
                                <span class="density-option-label">Comfortable</span>
                            </button>
                            <button class="density-option ${this.viewDensity === 'detailed' ? 'active' : ''}"
                                    data-density="detailed"
                                    role="menuitem"
                                    type="button">
                                <span class="density-option-icon">▪▪▪</span>
                                <span class="density-option-label">Detailed</span>
                            </button>
                        </div>
                    </div>

                    <!-- Results Info -->
                    <div class="results-info" id="resultsInfo" role="status" aria-live="polite">
                        <!-- Will be updated dynamically -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize all interactive components
     */
    async initializeComponents() {
        // Initialize Add Entity Card
        this.initializeAddEntityCard();

        // Initialize Content Filter
        await this.initializeContentFilter();

        // Initialize Sort Selector
        this.initializeSortSelector();

        // Update stats
        this.updateStats();
    }

    /**
     * Initialize Add Entity Card component
     */
    initializeAddEntityCard() {
        const container = document.getElementById('addEntityContainer');
        if (!container) return;

        try {
            this.addEntityCard = new AddEntityCard({
                containerId: 'addEntityContainer',
                entityType: this.category,
                mythology: this.mythology,
                category: this.category,
                label: `Add ${this.capitalize(this.category.slice(0, -1))}`,
                icon: '+',
                position: 'start'
            });

            this.addEntityCard.init();
        } catch (error) {
            console.error('[Browse View Polished] Error initializing Add Entity Card:', error);
        }
    }

    /**
     * Initialize Content Filter component
     */
    async initializeContentFilter() {
        const container = document.getElementById('contentFilterContainer');
        if (!container) return;

        try {
            this.contentFilter = new ContentFilter({
                container: container,
                category: this.category,
                mythology: this.mythology,
                onToggle: async (showUserContent) => {
                    this.showUserContent = showUserContent;
                    await this.reloadEntities();
                }
            });
        } catch (error) {
            console.error('[Browse View Polished] Error initializing Content Filter:', error);
        }
    }

    /**
     * Initialize Sort Selector component
     */
    initializeSortSelector() {
        const container = document.getElementById('sortSelectorContainer');
        if (!container) return;

        try {
            this.sortSelector = new SortSelector(container, {
                defaultSort: this.sortBy,
                onSortChange: (sortBy) => {
                    this.sortBy = sortBy;
                    this.applyFiltersAndSort();
                }
            });
        } catch (error) {
            console.error('[Browse View Polished] Error initializing Sort Selector:', error);
        }
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Quick filter chips
        this.attachQuickFilterListeners();

        // Search input
        this.attachSearchListener();

        // View mode toggle
        this.attachViewModeListeners();

        // Density dropdown
        this.attachDensityListeners();

        // Clear filters button
        this.attachClearFiltersListener();

        // Keyboard navigation
        this.attachKeyboardListeners();

        // Resize handler
        this.attachResizeListener();
    }

    /**
     * Attach quick filter chip listeners
     */
    attachQuickFilterListeners() {
        const chips = document.querySelectorAll('.filter-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => this.handleChipClick(chip));
        });
    }

    /**
     * Attach search input listener
     */
    attachSearchListener() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFiltersAndSort();

                // Announce to screen readers
                this.announceSearchResults();
            }, 300);
        });
    }

    /**
     * Attach view mode listeners
     */
    attachViewModeListeners() {
        const viewBtns = document.querySelectorAll('.view-mode-btn');
        const grid = document.getElementById('entityGrid');

        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const newMode = btn.dataset.view;
                if (newMode === this.viewMode) return;

                // Update state
                this.viewMode = newMode;
                localStorage.setItem('browse-view-mode', newMode);

                // Update UI
                viewBtns.forEach(b => {
                    b.classList.toggle('active', b.dataset.view === newMode);
                    b.setAttribute('aria-pressed', String(b.dataset.view === newMode));
                });

                // Smooth transition
                grid.style.opacity = '0';
                setTimeout(() => {
                    grid.className = `entity-grid ${this.viewMode}-view density-${this.viewDensity}`;
                    grid.style.opacity = '1';
                }, 150);
            });
        });
    }

    /**
     * Attach density dropdown listeners
     */
    attachDensityListeners() {
        const densityBtn = document.getElementById('densityBtn');
        const densityMenu = document.getElementById('densityMenu');
        const densityOptions = document.querySelectorAll('.density-option');
        const grid = document.getElementById('entityGrid');

        if (!densityBtn || !densityMenu) return;

        // Toggle menu
        densityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = densityBtn.getAttribute('aria-expanded') === 'true';
            densityBtn.setAttribute('aria-expanded', String(!isExpanded));
            densityMenu.classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', () => {
            densityBtn.setAttribute('aria-expanded', 'false');
            densityMenu.classList.remove('active');
        });

        // Density options
        densityOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const newDensity = option.dataset.density;

                // Update state
                this.viewDensity = newDensity;
                localStorage.setItem('browse-view-density', newDensity);

                // Update UI
                densityOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                document.querySelector('.density-label').textContent = this.capitalize(newDensity);

                // Update grid
                grid.className = `entity-grid ${this.viewMode}-view density-${this.viewDensity}`;
                this.updateGrid();

                // Close menu
                densityMenu.classList.remove('active');
                densityBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /**
     * Attach clear filters listener
     */
    attachClearFiltersListener() {
        const clearBtn = document.getElementById('clearFiltersBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }

    /**
     * Attach keyboard navigation listeners
     */
    attachKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Escape to close menus
            if (e.key === 'Escape') {
                const densityMenu = document.getElementById('densityMenu');
                if (densityMenu && densityMenu.classList.contains('active')) {
                    densityMenu.classList.remove('active');
                    document.getElementById('densityBtn')?.focus();
                }
            }
        });
    }

    /**
     * Attach resize listener
     */
    attachResizeListener() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 200);
        });
    }

    /**
     * Handle chip filter click
     */
    handleChipClick(chip) {
        const type = chip.dataset.filterType;
        const value = chip.dataset.filterValue;
        const isActive = chip.getAttribute('aria-pressed') === 'true';

        if (type === 'mythology') {
            if (isActive) {
                this.selectedMythologies.delete(value);
            } else {
                this.selectedMythologies.add(value);
            }
        } else if (type === 'domain') {
            if (isActive) {
                this.selectedDomains.delete(value);
            } else {
                this.selectedDomains.add(value);
            }
        }

        chip.setAttribute('aria-pressed', String(!isActive));
        this.applyFiltersAndSort();
        this.updateActiveFilters();
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.searchTerm = '';
        this.selectedMythologies.clear();
        this.selectedDomains.clear();

        // Update UI
        document.getElementById('searchInput').value = '';
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.setAttribute('aria-pressed', 'false');
        });

        this.applyFiltersAndSort();
        this.updateActiveFilters();
    }

    /**
     * Apply filters and sort to entities
     */
    applyFiltersAndSort() {
        let filtered = [...this.entities];

        // Apply mythology filter
        if (this.mythology && this.selectedMythologies.size === 0) {
            filtered = filtered.filter(e => e.mythology === this.mythology);
        } else if (this.selectedMythologies.size > 0) {
            filtered = filtered.filter(e => this.selectedMythologies.has(e.mythology));
        }

        // Apply domain filter
        if (this.selectedDomains.size > 0) {
            filtered = filtered.filter(e => {
                const domains = e.domains || e.attributes || e.roles || [];
                return domains.some(d => this.selectedDomains.has(d));
            });
        }

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(e => {
                const searchable = [
                    e.name,
                    e.description || '',
                    e.summary || '',
                    ...(e.domains || []),
                    ...(e.attributes || []),
                    ...(e.altNames || [])
                ].join(' ').toLowerCase();
                return searchable.includes(this.searchTerm);
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'votes-desc':
                    return (b._netVotes || 0) - (a._netVotes || 0);
                case 'votes-asc':
                    return (a._netVotes || 0) - (b._netVotes || 0);
                case 'contested':
                    return (b._contested || 0) - (a._contested || 0);
                case 'recent':
                    return (b._dateAdded || 0) - (a._dateAdded || 0);
                case 'alphabetical':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        this.filteredEntities = filtered;
        this.currentPage = 1;
        this.updateGrid();
        this.updateResultsInfo();
        this.updatePagination();
    }

    /**
     * Update entity grid
     */
    updateGrid() {
        const grid = document.getElementById('entityGrid');
        if (!grid) return;

        if (this.filteredEntities.length === 0) {
            grid.innerHTML = this.getEmptyStateHTML();
            return;
        }

        // Calculate visible range
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        this.displayedEntities = this.filteredEntities.slice(start, end);

        // Render cards
        grid.innerHTML = this.displayedEntities
            .map(entity => this.getEntityCardHTML(entity))
            .join('');

        // Initialize vote buttons for each card
        this.initializeVoteButtons();

        // Initialize edit icons
        this.initializeEditIcons();

        // Scroll to top smoothly
        if (this.currentPage > 1) {
            grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Get entity card HTML with all features
     */
    getEntityCardHTML(entity) {
        const icon = entity.icon || this.getDefaultIcon(this.category);
        const description = entity.description || entity.summary || 'No description available';
        const tags = entity.domains || entity.attributes || entity.roles || [];
        const maxTags = this.viewDensity === 'compact' ? 3 : (this.viewDensity === 'comfortable' ? 4 : 6);
        const displayTags = tags.slice(0, maxTags);
        const remainingTags = tags.length - displayTags.length;
        const maxLines = this.viewDensity === 'compact' ? 2 : (this.viewDensity === 'comfortable' ? 3 : 5);

        const isSvgIcon = icon && icon.includes('/');
        const iconHTML = isSvgIcon
            ? `<img src="${icon}" alt="${entity.name}" class="entity-icon" loading="lazy" />`
            : `<span class="entity-icon" aria-hidden="true">${icon}</span>`;

        const isUserContent = !entity.isStandard;
        const isOwned = this.currentUser && entity.userId === this.currentUser.uid;
        const isContested = (entity._contested || 0) > 50;

        const netVotes = (entity.upvotes || 0) - (entity.downvotes || 0);

        return `
            <article class="entity-card ${isUserContent ? 'entity-card-community' : ''} ${isContested ? 'entity-card-contested' : ''}"
                     data-entity-id="${entity.id}"
                     data-mythology="${entity.mythology}"
                     tabindex="0"
                     role="article"
                     aria-label="${entity.name}">

                <!-- Badges -->
                <div class="entity-badges">
                    ${isUserContent ? `
                        <span class="badge badge-community" title="Community contribution">
                            Community
                        </span>
                    ` : ''}
                    ${isContested ? `
                        <span class="badge badge-contested" title="Highly debated content">
                            Debated
                        </span>
                    ` : ''}
                </div>

                <!-- Edit Icon for Owners -->
                ${isOwned ? `
                    <button class="edit-icon"
                            data-entity-id="${entity.id}"
                            aria-label="Edit ${entity.name}"
                            title="Edit this ${this.category.slice(0, -1)}"
                            type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                ` : ''}

                <!-- Card Content -->
                <a href="#/entity/${this.category}/${entity.mythology}/${entity.id}"
                   class="entity-card-link">
                    <div class="entity-card-header">
                        ${iconHTML}
                        <div class="entity-card-info">
                            <h3 class="entity-card-title">${this.escapeHtml(entity.name)}</h3>
                            <span class="entity-mythology">${this.capitalize(entity.mythology)}</span>
                        </div>
                    </div>

                    <p class="entity-description" style="-webkit-line-clamp: ${maxLines};">
                        ${this.escapeHtml(description)}
                    </p>

                    ${tags.length > 0 ? `
                        <div class="entity-tags">
                            ${displayTags.map(tag => `
                                <span class="tag" title="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>
                            `).join('')}
                            ${remainingTags > 0 ? `
                                <span class="tag tag-overflow" title="${tags.slice(maxTags).join(', ')}">
                                    +${remainingTags}
                                </span>
                            ` : ''}
                        </div>
                    ` : ''}
                </a>

                <!-- Vote Buttons -->
                <div class="entity-vote-section"
                     data-item-id="${entity.id}"
                     data-item-type="${this.category}"
                     data-upvotes="${entity.upvotes || 0}"
                     data-downvotes="${entity.downvotes || 0}">
                    <!-- Vote buttons will be initialized here -->
                </div>
            </article>
        `;
    }

    /**
     * Initialize vote buttons for all cards
     */
    initializeVoteButtons() {
        const voteContainers = document.querySelectorAll('.entity-vote-section');

        voteContainers.forEach(container => {
            const itemId = container.dataset.itemId;

            try {
                const voteBtn = new VoteButtonsComponent(container);
                this.voteComponents.set(itemId, voteBtn);
            } catch (error) {
                console.error(`[Browse View Polished] Error initializing vote buttons for ${itemId}:`, error);
            }
        });
    }

    /**
     * Initialize edit icons
     */
    initializeEditIcons() {
        const editIcons = document.querySelectorAll('.edit-icon');

        editIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const entityId = icon.dataset.entityId;
                this.handleEditEntity(entityId);
            });
        });
    }

    /**
     * Handle edit entity
     */
    handleEditEntity(entityId) {
        // Navigate to edit form
        window.location.href = `/theories/user-submissions/edit.html?id=${entityId}&type=${this.category}`;
    }

    /**
     * Update edit icons visibility based on ownership
     */
    updateEditIconsVisibility() {
        const editIcons = document.querySelectorAll('.edit-icon');
        editIcons.forEach(icon => {
            const entityId = icon.dataset.entityId;
            const entity = this.entities.find(e => e.id === entityId);
            const isOwned = this.currentUser && entity && entity.userId === this.currentUser.uid;
            icon.style.display = isOwned ? 'flex' : 'none';
        });
    }

    /**
     * Get empty state HTML
     */
    getEmptyStateHTML() {
        const categoryInfo = this.getCategoryInfo(this.category);
        const hasFilters = this.searchTerm || this.selectedMythologies.size > 0 || this.selectedDomains.size > 0;

        return `
            <div class="empty-state" role="status">
                <div class="empty-icon" aria-hidden="true">${categoryInfo.icon}</div>
                <h3 class="empty-title">No ${categoryInfo.name} Found</h3>
                <p class="empty-message">
                    ${hasFilters
                        ? `No ${this.category} match your current filters. Try adjusting your search or clearing filters.`
                        : `No ${this.category} available at this time.`
                    }
                </p>
                ${hasFilters ? `
                    <button class="empty-action-btn" onclick="document.getElementById('clearFiltersBtn')?.click()" type="button">
                        Clear All Filters
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Update active filters display
     */
    updateActiveFilters() {
        const container = document.getElementById('activeFilters');
        const chipsContainer = document.getElementById('activeFilterChips');

        const hasFilters = this.searchTerm || this.selectedMythologies.size > 0 || this.selectedDomains.size > 0;

        if (!hasFilters) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';

        const chips = [];
        if (this.searchTerm) {
            chips.push(`<span class="active-chip">Search: "${this.searchTerm}"</span>`);
        }
        this.selectedMythologies.forEach(myth => {
            chips.push(`<span class="active-chip">${this.capitalize(myth)}</span>`);
        });
        this.selectedDomains.forEach(domain => {
            chips.push(`<span class="active-chip">${domain}</span>`);
        });

        chipsContainer.innerHTML = chips.join('');
    }

    /**
     * Update stats display
     */
    updateStats() {
        const statsEl = document.getElementById('browseStats');
        if (!statsEl) return;

        const totalCount = this.entities.length;
        const mythCount = Object.keys(this.groupedEntities || {}).length;
        const domainCount = this.availableDomains ? this.availableDomains.size : 0;
        const communityCount = this.entities.filter(e => !e.isStandard).length;

        statsEl.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${totalCount}</span>
                <span class="stat-label">${this.category}</span>
            </div>
            <div class="stat-divider" aria-hidden="true">•</div>
            <div class="stat-item">
                <span class="stat-value">${mythCount}</span>
                <span class="stat-label">mythologies</span>
            </div>
            ${domainCount > 0 ? `
                <div class="stat-divider" aria-hidden="true">•</div>
                <div class="stat-item">
                    <span class="stat-value">${domainCount}</span>
                    <span class="stat-label">domains</span>
                </div>
            ` : ''}
            ${communityCount > 0 ? `
                <div class="stat-divider" aria-hidden="true">•</div>
                <div class="stat-item">
                    <span class="stat-value">${communityCount}</span>
                    <span class="stat-label">community</span>
                </div>
            ` : ''}
        `;
    }

    /**
     * Update results info
     */
    updateResultsInfo() {
        const infoEl = document.getElementById('resultsInfo');
        if (!infoEl) return;

        const shown = this.filteredEntities.length;
        const total = this.entities.length;

        if (shown === total) {
            infoEl.textContent = `${total} ${this.category}`;
        } else {
            infoEl.textContent = `${shown} of ${total} ${this.category}`;
        }
    }

    /**
     * Update pagination controls
     */
    updatePagination() {
        const controls = document.getElementById('paginationControls');
        if (!controls) return;

        const totalPages = Math.ceil(this.filteredEntities.length / this.itemsPerPage);

        if (totalPages <= 1) {
            controls.innerHTML = '';
            return;
        }

        const maxButtons = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        const pages = [];

        // Previous
        pages.push(`
            <button class="page-btn page-btn-prev"
                    data-page="${this.currentPage - 1}"
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    aria-label="Previous page"
                    type="button">
                ‹ Previous
            </button>
        `);

        // First page
        if (startPage > 1) {
            pages.push(`<button class="page-btn" data-page="1" type="button">1</button>`);
            if (startPage > 2) {
                pages.push(`<span class="page-ellipsis" aria-hidden="true">...</span>`);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}"
                        data-page="${i}"
                        aria-label="Page ${i}"
                        aria-current="${i === this.currentPage ? 'page' : 'false'}"
                        type="button">
                    ${i}
                </button>
            `);
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(`<span class="page-ellipsis" aria-hidden="true">...</span>`);
            }
            pages.push(`<button class="page-btn" data-page="${totalPages}" type="button">${totalPages}</button>`);
        }

        // Next
        pages.push(`
            <button class="page-btn page-btn-next"
                    data-page="${this.currentPage + 1}"
                    ${this.currentPage === totalPages ? 'disabled' : ''}
                    aria-label="Next page"
                    type="button">
                Next ›
            </button>
        `);

        controls.innerHTML = pages.join('');

        // Attach listeners
        controls.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.updateGrid();
                    this.updatePagination();
                }
            });
        });
    }

    /**
     * Reload entities when filters change
     */
    async reloadEntities() {
        this.showLoadingOverlay();

        try {
            await this.loadEntities();
            this.applyFiltersAndSort();
            this.updateStats();
        } catch (error) {
            console.error('[Browse View Polished] Error reloading:', error);
            this.showError(error);
        } finally {
            this.hideLoadingOverlay();
        }
    }

    /**
     * Show loading overlay
     */
    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.setAttribute('aria-hidden', 'false');
            overlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.setAttribute('aria-hidden', 'true');
            overlay.style.display = 'none';
        }
    }

    /**
     * Show error state
     */
    showError(error) {
        this.hasError = true;
        this.errorMessage = error.message || 'An error occurred';

        const grid = document.getElementById('entityGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-state" role="alert">
                    <div class="error-icon" aria-hidden="true">⚠️</div>
                    <h3 class="error-title">Failed to Load ${this.category}</h3>
                    <p class="error-message">${this.escapeHtml(this.errorMessage)}</p>
                    <button class="error-retry-btn" onclick="location.reload()" type="button">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Announce search results to screen readers
     */
    announceSearchResults() {
        const count = this.filteredEntities.length;
        const announcement = `Found ${count} ${count === 1 ? this.category.slice(0, -1) : this.category}`;

        // Create or update live region
        let liveRegion = document.getElementById('searchAnnouncement');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'searchAnnouncement';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = announcement;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust layout if needed
        const width = window.innerWidth;

        // Auto-switch to list view on mobile
        if (width < 768 && this.viewMode === 'grid') {
            // Optionally auto-switch or just maintain current view
        }
    }

    /**
     * Get category info
     */
    getCategoryInfo(category) {
        const info = {
            deities: {
                name: 'Deities & Gods',
                icon: '⚡',
                description: 'Divine beings and pantheons across mythological traditions'
            },
            heroes: {
                name: 'Heroes & Legends',
                icon: '🗡️',
                description: 'Epic heroes and legendary figures from myth and folklore'
            },
            creatures: {
                name: 'Mythical Creatures',
                icon: '🐉',
                description: 'Dragons, monsters, and fantastic beasts'
            },
            items: {
                name: 'Sacred Items',
                icon: '💎',
                description: 'Legendary artifacts and magical objects'
            },
            places: {
                name: 'Sacred Places',
                icon: '🏔️',
                description: 'Holy sites, mystical locations, and otherworldly realms'
            },
            herbs: {
                name: 'Sacred Herbs',
                icon: '🌿',
                description: 'Mystical plants and traditional medicine'
            },
            rituals: {
                name: 'Rituals & Ceremonies',
                icon: '🕯️',
                description: 'Sacred rites and religious practices'
            },
            texts: {
                name: 'Sacred Texts',
                icon: '📜',
                description: 'Holy scriptures and ancient writings'
            },
            symbols: {
                name: 'Sacred Symbols',
                icon: '☯️',
                description: 'Religious icons and mystical symbols'
            },
            cosmology: {
                name: 'Cosmology',
                icon: '🌌',
                description: 'Creation myths and cosmic structures'
            }
        };

        return info[category] || {
            name: this.capitalize(category),
            icon: '📖',
            description: ''
        };
    }

    /**
     * Get default icon
     */
    getDefaultIcon(category) {
        const icons = {
            deities: '⚡',
            heroes: '🗡️',
            creatures: '🐉',
            items: '💎',
            places: '🏔️',
            herbs: '🌿',
            rituals: '🕯️',
            texts: '📜',
            symbols: '☯️',
            cosmology: '🌌'
        };
        return icons[category] || '📖';
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
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

    /**
     * Get loading skeleton styles
     */
    getLoadingStyles() {
        return `
            <style>
                .browse-loading-skeleton {
                    padding: var(--spacing-xl, 2rem);
                }

                .skeleton-header {
                    display: flex;
                    gap: var(--spacing-xl, 2rem);
                    align-items: center;
                    margin-bottom: var(--spacing-xl, 2rem);
                    padding: var(--spacing-xl, 2rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.4);
                    border-radius: var(--radius-2xl, 1.5rem);
                }

                .skeleton-icon {
                    width: 4rem;
                    height: 4rem;
                    background: rgba(var(--color-primary-rgb, 139, 92, 246), 0.2);
                    border-radius: var(--radius-lg, 0.75rem);
                }

                .skeleton-content {
                    flex: 1;
                }

                .skeleton-title {
                    height: 2.5rem;
                    width: 300px;
                    max-width: 100%;
                    background: rgba(var(--color-primary-rgb, 139, 92, 246), 0.2);
                    border-radius: var(--radius-lg, 0.75rem);
                    margin-bottom: var(--spacing-md, 1rem);
                }

                .skeleton-text {
                    height: 1.5rem;
                    width: 500px;
                    max-width: 100%;
                    background: rgba(var(--color-text-secondary-rgb, 156, 163, 175), 0.2);
                    border-radius: var(--radius-md, 0.5rem);
                    margin-bottom: var(--spacing-md, 1rem);
                }

                .skeleton-stats {
                    height: 1.5rem;
                    width: 200px;
                    background: rgba(var(--color-primary-rgb, 139, 92, 246), 0.2);
                    border-radius: var(--radius-md, 0.5rem);
                }

                .skeleton-controls {
                    display: flex;
                    gap: var(--spacing-lg, 1.5rem);
                    margin-bottom: var(--spacing-xl, 2rem);
                }

                .skeleton-button,
                .skeleton-filter,
                .skeleton-sort {
                    height: 2.5rem;
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.4);
                    border-radius: var(--radius-lg, 0.75rem);
                }

                .skeleton-button {
                    width: 150px;
                }

                .skeleton-filter {
                    width: 200px;
                }

                .skeleton-sort {
                    width: 180px;
                }

                .skeleton-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: var(--spacing-lg, 1.5rem);
                }

                .skeleton-card {
                    padding: var(--spacing-lg, 1.5rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.4);
                    border-radius: var(--radius-xl, 1rem);
                }

                .skeleton-card-icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    background: rgba(var(--color-primary-rgb, 139, 92, 246), 0.2);
                    border-radius: var(--radius-md, 0.5rem);
                    margin-bottom: var(--spacing-md, 1rem);
                }

                .skeleton-card-title {
                    height: 1.2rem;
                    width: 150px;
                    background: rgba(var(--color-text-primary-rgb, 229, 231, 235), 0.2);
                    border-radius: var(--radius-md, 0.5rem);
                    margin-bottom: var(--spacing-sm, 0.5rem);
                }

                .skeleton-card-text {
                    height: 0.95rem;
                    background: rgba(var(--color-text-secondary-rgb, 156, 163, 175), 0.2);
                    border-radius: var(--radius-md, 0.5rem);
                    margin-top: var(--spacing-sm, 0.5rem);
                }

                .skeleton-pulse {
                    animation: skeleton-pulse 1.5s ease-in-out infinite;
                }

                @keyframes skeleton-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .skeleton-pulse {
                        animation: none;
                        opacity: 0.7;
                    }
                }
            </style>
        `;
    }

    /**
     * Get comprehensive production styles
     * (Will be in separate CSS file - browse-category-polished.css)
     */
    getStyles() {
        return `<link rel="stylesheet" href="/css/browse-category-polished.css">`;
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Clear timers
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

        // Destroy components
        if (this.contentFilter) this.contentFilter.destroy?.();
        if (this.sortSelector) this.sortSelector.destroy?.();
        if (this.addEntityCard) this.addEntityCard.destroy?.();

        this.voteComponents.forEach(comp => comp.destroy?.());
        this.voteComponents.clear();

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// ES Module Export
export { BrowseCategoryViewPolished };

// Legacy global export
if (typeof window !== 'undefined') {
    window.BrowseCategoryViewPolished = BrowseCategoryViewPolished;
}
