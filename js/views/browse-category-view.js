/**
 * Browse Category View - POLISHED VERSION with Content Filtering
 * Displays a grid of entities for a specific category (deities, creatures, etc.)
 * Fetches from Firebase and renders dynamically
 *
 * ✨ Features:
 * - Responsive auto-fill grid with density controls
 * - List/Grid view toggle with smooth transitions
 * - Advanced filtering: Multi-select mythology, domain tags, search
 * - Enhanced sorting: Name, Mythology, Popularity, Date added
 * - Virtual scrolling for 100+ entities
 * - Rich entity cards with hover previews
 * - Tag overflow handling (max 4, "+X more")
 * - Quick filter chips
 * - Statistics summary
 * - Empty states with helpful CTAs
 * - Content filter toggle (standard vs community content)
 */

class BrowseCategoryView {
    constructor(firestore) {
        this.db = firestore;
        this.cache = window.cacheManager || new FirebaseCacheManager({ db: firestore });
        this.assetService = new AssetService();
        this.entities = [];
        this.filteredEntities = [];
        this.displayedEntities = [];
        this.category = null;
        this.mythology = null; // Optional filter

        // View state
        this.viewMode = localStorage.getItem('browse-view-mode') || 'grid'; // 'grid' or 'list'
        this.viewDensity = localStorage.getItem('browse-view-density') || 'comfortable'; // 'compact', 'comfortable', 'detailed'
        this.sortBy = localStorage.getItem('browse-sort-by') || 'name'; // 'name', 'mythology', 'popularity', 'dateAdded'

        // Filter state
        this.searchTerm = '';
        this.selectedMythologies = new Set();
        this.selectedDomains = new Set();
        this.selectedTypes = new Set();

        // Content filter
        this.contentFilter = null;
        this.showUserContent = false;

        // Pagination/Virtual scrolling
        this.currentPage = 1;
        this.itemsPerPage = 24;
        this.useVirtualScrolling = true; // Auto-enable for 100+ items
        this.visibleRange = { start: 0, end: 24 };

        // Debounce timers
        this.searchTimeout = null;
        this.scrollTimeout = null;
    }

    /**
     * Render browse view for a category with smooth loading transitions
     * @param {HTMLElement} container - Container to render into
     * @param {Object} options - { category, mythology }
     */
    async render(container, options = {}) {
        this.category = options.category;
        this.mythology = options.mythology;
        this.container = container;

        console.log(`[Browse View] Rendering ${this.category}${this.mythology ? ` (${this.mythology})` : ''}`);

        // Show loading state with skeleton
        container.innerHTML = this.getLoadingHTML();
        container.classList.add('has-skeleton');

        try {
            // Load entities from Firebase
            await this.loadEntities();

            // Fade out loading before replacing content
            const loadingEl = container.querySelector('.loading-container');
            if (loadingEl) {
                loadingEl.classList.add('fade-out');
                loadingEl.style.opacity = '0';
                loadingEl.style.transition = 'opacity 0.2s ease-out';
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Render content
            container.innerHTML = this.getBrowseHTML();
            container.classList.remove('has-skeleton');

            // Initialize content filter
            await this.initContentFilter();

            this.attachEventListeners();

            // Apply initial filters
            this.applyFilters();

            // Trigger fade-in animation
            requestAnimationFrame(() => {
                const content = container.firstElementChild;
                if (content) {
                    content.classList.add('content-loaded');
                }
            });

            // Hide loading spinner (use document for consistency)
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { view: 'browse', category: this.category, timestamp: Date.now() }
            }));

            console.log(`[Browse View] Render complete for ${this.category}`);

        } catch (error) {
            console.error('[Browse View] Error:', error);
            this.showError(container, error);

            // Emit error event
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: { view: 'browse', category: this.category, error: error.message }
            }));
        }
    }

    /**
     * Load entities from Firebase using AssetService
     */
    async loadEntities() {
        console.log(`[Browse View] Loading ${this.category} from Firebase...`);

        try {
            // Check user preference for community content
            const prefsService = new UserPreferencesService();
            await prefsService.init();
            this.showUserContent = prefsService.shouldShowUserContent();

            // Fetch using AssetService (handles standard + community assets)
            this.entities = await this.assetService.getAssets(this.category, {
                mythology: this.mythology,
                includeUserContent: this.showUserContent,
                orderBy: 'name',
                limit: 500
            });

            // Add metadata for sorting
            this.entities = this.entities.map((entity, index) => ({
                ...entity,
                _popularity: this.calculatePopularity(entity),
                _dateAdded: entity.dateAdded || entity.createdAt || Date.now() - (index * 1000)
            }));

            // Group by mythology and extract unique domains
            this.groupedEntities = this.groupByMythology(this.entities);
            this.availableDomains = this.extractUniqueDomains(this.entities);
            this.availableTypes = this.extractUniqueTypes(this.entities);

            console.log(`[Browse View] Loaded ${this.entities.length} ${this.category}`);
            console.log(`[Browse View] Standard: ${this.entities.filter(e => e.isStandard).length}, Community: ${this.entities.filter(e => !e.isStandard).length}`);
            console.log(`[Browse View] Found ${this.availableDomains.size} unique domains`);

        } catch (error) {
            console.error('[Browse View] Error loading entities:', error);
            throw error;
        }
    }

    /**
     * Initialize content filter component
     */
    async initContentFilter() {
        const filterContainer = document.getElementById('contentFilterContainer');
        if (!filterContainer) {
            console.warn('[Browse View] Content filter container not found');
            return;
        }

        // Create content filter instance
        this.contentFilter = new ContentFilter({
            container: filterContainer,
            category: this.category,
            mythology: this.mythology,
            onToggle: async (showUserContent) => {
                this.showUserContent = showUserContent;
                await this.reloadEntities();
            }
        });
    }

    /**
     * Reload entities when content filter changes
     */
    async reloadEntities() {
        console.log(`[Browse View] Reloading with showUserContent: ${this.showUserContent}`);

        try {
            // Re-fetch entities
            this.entities = await this.assetService.getAssets(this.category, {
                mythology: this.mythology,
                includeUserContent: this.showUserContent,
                orderBy: 'name',
                limit: 500
            });

            // Add metadata
            this.entities = this.entities.map((entity, index) => ({
                ...entity,
                _popularity: this.calculatePopularity(entity),
                _dateAdded: entity.dateAdded || entity.createdAt || Date.now() - (index * 1000)
            }));

            // Re-group and re-extract
            this.groupedEntities = this.groupByMythology(this.entities);
            this.availableDomains = this.extractUniqueDomains(this.entities);
            this.availableTypes = this.extractUniqueTypes(this.entities);

            // Re-apply filters
            this.currentPage = 1;
            this.applyFilters();

            // Update stats
            this.updateStats();

        } catch (error) {
            console.error('[Browse View] Error reloading entities:', error);
        }
    }

    /**
     * Update statistics display
     */
    updateStats() {
        const statsEl = document.getElementById('browseStats');
        if (!statsEl) return;

        const totalCount = this.entities.length;
        const mythCount = Object.keys(this.groupedEntities).length;
        const domainCount = this.availableDomains.size;

        statsEl.innerHTML = `
            <span class="stat-badge">
                <span class="stat-icon">📊</span>
                <span class="stat-value">${totalCount}</span>
                <span class="stat-label">${this.category}</span>
            </span>
            <span class="stat-badge">
                <span class="stat-icon">🌍</span>
                <span class="stat-value">${mythCount}</span>
                <span class="stat-label">mythologies</span>
            </span>
            ${domainCount > 0 ? `
                <span class="stat-badge">
                    <span class="stat-icon">🏷️</span>
                    <span class="stat-value">${domainCount}</span>
                    <span class="stat-label">domains</span>
                </span>
            ` : ''}
        `;
    }

    /**
     * Calculate popularity score for sorting
     */
    calculatePopularity(entity) {
        let score = 0;

        // Weight factors
        if (entity.views) score += entity.views * 1;
        if (entity.likes) score += entity.likes * 5;
        if (entity.shares) score += entity.shares * 10;
        if (entity.domains && entity.domains.length) score += entity.domains.length * 2;
        if (entity.attributes && entity.attributes.length) score += entity.attributes.length * 2;
        if (entity.description && entity.description.length > 200) score += 20;
        if (entity.icon) score += 10;

        return score;
    }

    /**
     * Group entities by mythology
     */
    groupByMythology(entities) {
        const grouped = {};

        entities.forEach(entity => {
            const myth = entity.mythology || 'unknown';
            if (!grouped[myth]) {
                grouped[myth] = [];
            }
            grouped[myth].push(entity);
        });

        return grouped;
    }

    /**
     * Extract unique domains from all entities
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
     * Extract unique types (for creatures, items, etc.)
     */
    extractUniqueTypes(entities) {
        const types = new Set();

        entities.forEach(entity => {
            if (entity.type) types.add(entity.type);
            if (entity.category) types.add(entity.category);
        });

        return types;
    }

    /**
     * Get loading HTML with skeleton cards
     */
    getLoadingHTML() {
        return `
            <div class="browse-view">
                <!-- Skeleton Header -->
                <header class="browse-header skeleton-header">
                    <div class="browse-header-icon skeleton-pulse">⏳</div>
                    <div class="browse-header-content">
                        <div class="skeleton-title skeleton-pulse"></div>
                        <div class="skeleton-text skeleton-pulse"></div>
                        <div class="skeleton-stats skeleton-pulse"></div>
                    </div>
                </header>

                <!-- Skeleton Grid -->
                <div class="entity-grid">
                    ${Array(6).fill(0).map(() => this.getSkeletonCardHTML()).join('')}
                </div>
            </div>

            ${this.getSkeletonStyles()}
        `;
    }

    /**
     * Get skeleton card HTML for loading state
     */
    getSkeletonCardHTML() {
        return `
            <div class="entity-card skeleton-card">
                <div class="entity-card-header">
                    <div class="skeleton-icon skeleton-pulse"></div>
                    <div class="skeleton-card-info">
                        <div class="skeleton-card-title skeleton-pulse"></div>
                        <div class="skeleton-card-myth skeleton-pulse"></div>
                    </div>
                </div>
                <div class="skeleton-card-desc skeleton-pulse"></div>
                <div class="skeleton-card-desc skeleton-pulse" style="width: 80%;"></div>
            </div>
        `;
    }

    /**
     * Get skeleton loading styles
     */
    getSkeletonStyles() {
        return `
            <style>
                .skeleton-pulse {
                    animation: skeleton-pulse 1.5s ease-in-out infinite;
                }

                @keyframes skeleton-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .skeleton-title {
                    height: 2.5rem;
                    width: 300px;
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border-radius: var(--radius-lg);
                    margin-bottom: 0.5rem;
                }

                .skeleton-text {
                    height: 1.5rem;
                    width: 500px;
                    max-width: 100%;
                    background: rgba(var(--color-text-secondary-rgb, 156, 163, 175), 0.2);
                    border-radius: var(--radius-md);
                    margin-bottom: 1rem;
                }

                .skeleton-stats {
                    height: 1.5rem;
                    width: 200px;
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border-radius: var(--radius-md);
                }

                .skeleton-card {
                    pointer-events: none;
                }

                .skeleton-icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border-radius: var(--radius-md);
                }

                .skeleton-card-info {
                    flex: 1;
                }

                .skeleton-card-title {
                    height: 1.2rem;
                    width: 150px;
                    background: rgba(var(--color-text-primary-rgb, 229, 231, 235), 0.2);
                    border-radius: var(--radius-md);
                    margin-bottom: 0.5rem;
                }

                .skeleton-card-myth {
                    height: 0.85rem;
                    width: 100px;
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border-radius: var(--radius-md);
                }

                .skeleton-card-desc {
                    height: 0.95rem;
                    background: rgba(var(--color-text-secondary-rgb, 156, 163, 175), 0.2);
                    border-radius: var(--radius-md);
                    margin-top: 1rem;
                }
            </style>
        `;
    }

    /**
     * Get browse view HTML
     */
    getBrowseHTML() {
        const categoryInfo = this.getCategoryInfo(this.category);
        this.filteredEntities = [...this.entities];

        return `
            <div class="browse-view">
                <!-- Header -->
                ${this.getHeaderHTML(categoryInfo)}

                <!-- Content Filter Toggle -->
                <div id="contentFilterContainer"></div>

                <!-- Quick Filters & Statistics -->
                ${this.getQuickFiltersHTML()}

                <!-- Advanced Filters & Controls -->
                ${this.getFiltersHTML()}

                <!-- Entity Grid/List Container -->
                <div class="entity-container" id="entityContainer">
                    <div class="entity-grid ${this.viewMode}-view density-${this.viewDensity}" id="entityGrid">
                        ${this.getGridPlaceholder()}
                    </div>
                </div>

                <!-- Pagination Controls -->
                <div class="pagination-controls" id="paginationControls"></div>
            </div>

            ${this.getStyles()}
        `;
    }

    /**
     * Get header HTML
     */
    getHeaderHTML(categoryInfo) {
        return `
            <header class="browse-header">
                <div class="browse-header-icon">${categoryInfo.icon}</div>
                <div class="browse-header-content">
                    <h1 class="browse-title">${categoryInfo.name}</h1>
                    <p class="browse-description">${categoryInfo.description}</p>
                    <div class="browse-stats" id="browseStats">
                        <span class="stat-badge">
                            <span class="stat-icon">📊</span>
                            <span class="stat-value">${this.entities.length}</span>
                            <span class="stat-label">${this.category}</span>
                        </span>
                        <span class="stat-badge">
                            <span class="stat-icon">🌍</span>
                            <span class="stat-value">${Object.keys(this.groupedEntities).length}</span>
                            <span class="stat-label">mythologies</span>
                        </span>
                        ${this.availableDomains.size > 0 ? `
                            <span class="stat-badge">
                                <span class="stat-icon">🏷️</span>
                                <span class="stat-value">${this.availableDomains.size}</span>
                                <span class="stat-label">domains</span>
                            </span>
                        ` : ''}
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * Get quick filters HTML (chip-based)
     */
    getQuickFiltersHTML() {
        const topMythologies = Object.entries(this.groupedEntities)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 8);

        const topDomains = Array.from(this.availableDomains)
            .slice(0, 10);

        return `
            <div class="quick-filters" role="region" aria-label="Quick filters">
                <div class="quick-filter-section">
                    <h3 class="quick-filter-title" id="mythology-filter-heading">
                        <span class="quick-filter-icon" aria-hidden="true">🌍</span>
                        Quick Filter by Mythology
                    </h3>
                    <div class="filter-chips" role="group" aria-labelledby="mythology-filter-heading">
                        ${topMythologies.map(([myth, entities]) => `
                            <button
                                type="button"
                                class="filter-chip"
                                data-filter-type="mythology"
                                data-filter-value="${myth}"
                                aria-pressed="${this.selectedMythologies.has(myth)}"
                                aria-label="Filter by ${this.capitalize(myth)} mythology (${entities.length} entities)">
                                <span class="chip-label">${this.capitalize(myth)}</span>
                                <span class="chip-count" aria-hidden="true">${entities.length}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                ${this.availableDomains.size > 0 && this.category === 'deities' ? `
                    <div class="quick-filter-section">
                        <h3 class="quick-filter-title" id="domain-filter-heading">
                            <span class="quick-filter-icon" aria-hidden="true">🏷️</span>
                            Filter by Domain
                        </h3>
                        <div class="filter-chips" role="group" aria-labelledby="domain-filter-heading">
                            ${topDomains.map(domain => `
                                <button
                                    type="button"
                                    class="filter-chip"
                                    data-filter-type="domain"
                                    data-filter-value="${this.escapeHtml(domain)}"
                                    aria-pressed="${this.selectedDomains.has(domain)}"
                                    aria-label="Filter by ${domain} domain">
                                    <span class="chip-label">${this.escapeHtml(domain)}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Active Filters Display -->
                <div class="active-filters" id="activeFilters" style="display: none;" role="status" aria-live="polite">
                    <span class="active-filters-label">Active filters:</span>
                    <div class="active-filter-chips" aria-label="Currently active filters"></div>
                    <button type="button" class="clear-filters-btn" id="clearFiltersBtn" aria-label="Clear all active filters">Clear all</button>
                </div>
            </div>
        `;
    }

    /**
     * Get filters and controls HTML
     */
    getFiltersHTML() {
        return `
            <div class="browse-controls">
                <div class="browse-filters">
                    <!-- Search -->
                    <div class="filter-group filter-search">
                        <label for="searchFilter" class="filter-label">
                            <span class="filter-icon">🔍</span>
                            Search
                        </label>
                        <input
                            type="text"
                            id="searchFilter"
                            class="filter-input"
                            placeholder="Search ${this.category} by name, description..."
                            aria-label="Search entities"
                        />
                    </div>

                    <!-- Sort -->
                    <div class="filter-group">
                        <label for="sortOrder" class="filter-label">
                            <span class="filter-icon">⚡</span>
                            Sort By
                        </label>
                        <select id="sortOrder" class="filter-select">
                            <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Name (A-Z)</option>
                            <option value="mythology" ${this.sortBy === 'mythology' ? 'selected' : ''}>Mythology</option>
                            <option value="popularity" ${this.sortBy === 'popularity' ? 'selected' : ''}>Popularity</option>
                            <option value="dateAdded" ${this.sortBy === 'dateAdded' ? 'selected' : ''}>Recently Added</option>
                        </select>
                    </div>

                    <!-- Results Info -->
                    <div class="filter-results-info" id="resultsInfo">
                        Showing <strong>0</strong> of <strong>${this.entities.length}</strong>
                    </div>
                </div>

                <div class="view-controls">
                    <!-- View Mode Toggle -->
                    <div class="view-toggle">
                        <button
                            class="view-btn ${this.viewMode === 'grid' ? 'active' : ''}"
                            data-view="grid"
                            aria-label="Grid view"
                            title="Grid view">
                            <span class="view-icon">⊞</span>
                            <span class="view-label">Grid</span>
                        </button>
                        <button
                            class="view-btn ${this.viewMode === 'list' ? 'active' : ''}"
                            data-view="list"
                            aria-label="List view"
                            title="List view">
                            <span class="view-icon">☰</span>
                            <span class="view-label">List</span>
                        </button>
                    </div>

                    <!-- Density Toggle -->
                    <div class="density-toggle">
                        <button class="density-btn" id="densityBtn" title="View density">
                            <span class="density-icon">⚙</span>
                            <span class="density-label">${this.capitalize(this.viewDensity)}</span>
                        </button>
                        <div class="density-menu" id="densityMenu">
                            <button class="density-option ${this.viewDensity === 'compact' ? 'active' : ''}" data-density="compact">
                                <span class="option-icon">▪</span>
                                <span class="option-label">Compact</span>
                            </button>
                            <button class="density-option ${this.viewDensity === 'comfortable' ? 'active' : ''}" data-density="comfortable">
                                <span class="option-icon">▪▪</span>
                                <span class="option-label">Comfortable</span>
                            </button>
                            <button class="density-option ${this.viewDensity === 'detailed' ? 'active' : ''}" data-density="detailed">
                                <span class="option-icon">▪▪▪</span>
                                <span class="option-label">Detailed</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get grid placeholder
     */
    getGridPlaceholder() {
        return `<div class="grid-loading">Loading entities...</div>`;
    }

    /**
     * Get entity card HTML
     */
    getEntityCardHTML(entity) {
        const icon = entity.icon || this.getDefaultIcon(this.category);
        const description = entity.description || entity.summary || 'No description available';

        // Get tags from domains or attributes
        const tags = entity.domains || entity.attributes || entity.roles || [];
        const allTags = Array.isArray(tags) ? tags : [];
        const maxTags = this.viewDensity === 'compact' ? 3 : (this.viewDensity === 'comfortable' ? 4 : 6);
        const displayTags = allTags.slice(0, maxTags);
        const remainingTags = allTags.length - displayTags.length;

        // Check if icon is SVG path or emoji
        const isSvgIcon = icon && icon.includes('/');
        const iconHTML = isSvgIcon
            ? `<img src="${icon}" alt="${entity.name} icon" class="entity-icon" loading="lazy" />`
            : `<span class="entity-icon">${icon}</span>`;

        // Truncate description based on density
        const maxLines = this.viewDensity === 'compact' ? 2 : (this.viewDensity === 'comfortable' ? 3 : 5);

        // Determine badge
        const badgeHTML = entity.isStandard
            ? '' // No badge for standard content
            : `<span class="user-content-badge" title="Created by ${entity.userId || 'community contributor'}">Community</span>`;

        return `
            <a href="#/entity/${this.category}/${entity.mythology}/${entity.id}"
               class="entity-card ${entity.isStandard ? '' : 'entity-card-community'}"
               data-entity-id="${entity.id}"
               data-mythology="${entity.mythology}"
               data-entity-type="${this.category.replace(/s$/, '')}"
               data-name="${entity.name.toLowerCase()}"
               role="article"
               aria-label="${this.escapeHtml(entity.name)} - ${this.capitalize(entity.mythology)} ${this.category.replace(/s$/, '')}">
                ${badgeHTML}
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

                ${allTags.length > 0 ? `
                    <div class="entity-tags">
                        ${displayTags.map(tag => `
                            <span class="tag" title="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>
                        `).join('')}
                        ${remainingTags > 0 ? `
                            <span class="tag tag-overflow" title="${allTags.slice(maxTags).join(', ')}">
                                +${remainingTags} more
                            </span>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Hover Preview -->
                <div class="entity-preview">
                    <div class="preview-content">
                        ${entity.altNames && entity.altNames.length > 0 ? `
                            <div class="preview-section">
                                <strong>Also known as:</strong> ${entity.altNames.slice(0, 3).join(', ')}
                            </div>
                        ` : ''}
                        ${allTags.length > maxTags ? `
                            <div class="preview-section">
                                <strong>All domains:</strong> ${allTags.join(', ')}
                            </div>
                        ` : ''}
                        ${entity.symbols && entity.symbols.length > 0 ? `
                            <div class="preview-section">
                                <strong>Symbols:</strong> ${entity.symbols.slice(0, 5).join(', ')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </a>
        `;
    }

    /**
     * Get empty state HTML
     */
    getEmptyStateHTML() {
        const categoryInfo = this.getCategoryInfo(this.category);
        const hasActiveFilters = this.searchTerm || this.selectedMythologies.size > 0 ||
                                this.selectedDomains.size > 0 || this.selectedTypes.size > 0;

        return `
            <div class="empty-state">
                <div class="empty-icon">${categoryInfo.icon}</div>
                <h3>No ${categoryInfo.name} Found</h3>
                <p>
                    ${hasActiveFilters
                        ? `No ${this.category} match your current filters. Try adjusting your search or clearing filters.`
                        : this.mythology
                            ? `No ${this.category} found in ${this.capitalize(this.mythology)} mythology. Try selecting a different mythology or browse all.`
                            : `No ${this.category} available at this time. Check back later for updates.`
                    }
                </p>
                ${hasActiveFilters ? `
                    <button class="btn-primary" id="clearFiltersFromEmpty">
                        Clear All Filters
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get category info
     */
    getCategoryInfo(category) {
        const info = {
            deities: { name: 'Deities & Gods', icon: '⚡', description: 'Divine beings and pantheons across traditions' },
            heroes: { name: 'Heroes & Legends', icon: '🗡️', description: 'Epic heroes and legendary figures' },
            creatures: { name: 'Mythical Creatures', icon: '🐉', description: 'Dragons, monsters, and fantastic beasts' },
            items: { name: 'Sacred Items', icon: '💎', description: 'Legendary artifacts and magical objects' },
            places: { name: 'Sacred Places', icon: '🏔️', description: 'Holy sites and mystical locations' },
            herbs: { name: 'Sacred Herbs', icon: '🌿', description: 'Plants and traditional medicine' },
            rituals: { name: 'Rituals', icon: '🕯️', description: 'Ceremonies and sacred rites' },
            texts: { name: 'Sacred Texts', icon: '📜', description: 'Holy scriptures and ancient writings' },
            symbols: { name: 'Sacred Symbols', icon: '☯️', description: 'Religious icons and mystical symbols' },
            cosmology: { name: 'Cosmology', icon: '🌌', description: 'Creation myths and cosmic structures' }
        };

        return info[category] || { name: this.capitalize(category), icon: '📖', description: '' };
    }

    /**
     * Get default icon for category
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
            symbols: '☯️'
        };
        return icons[category] || '📖';
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Quick filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => this.handleChipClick(e));
        });

        // Clear all filters
        const clearBtn = document.getElementById('clearFiltersBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFilters());
        }

        const clearFromEmpty = document.getElementById('clearFiltersFromEmpty');
        if (clearFromEmpty) {
            clearFromEmpty.addEventListener('click', () => this.clearAllFilters());
        }

        // Search filter with debouncing
        const searchFilter = document.getElementById('searchFilter');
        if (searchFilter) {
            searchFilter.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.searchTerm = e.target.value.toLowerCase();
                    this.applyFilters();
                }, 300);
            });
        }

        // Sort order
        const sortOrder = document.getElementById('sortOrder');
        if (sortOrder) {
            sortOrder.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                localStorage.setItem('browse-sort-by', this.sortBy);
                this.applyFilters();
            });
        }

        // View toggle with smooth transition
        const viewBtns = document.querySelectorAll('.view-btn');
        const grid = document.getElementById('entityGrid');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.viewMode = btn.dataset.view;
                localStorage.setItem('browse-view-mode', this.viewMode);

                // Smooth transition
                grid.style.opacity = '0';
                setTimeout(() => {
                    grid.className = `entity-grid ${this.viewMode}-view density-${this.viewDensity}`;
                    grid.style.opacity = '1';
                }, 150);
            });
        });

        // Density toggle
        const densityBtn = document.getElementById('densityBtn');
        const densityMenu = document.getElementById('densityMenu');

        if (densityBtn && densityMenu) {
            densityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                densityMenu.classList.toggle('active');
            });

            // Close menu on outside click
            document.addEventListener('click', () => {
                densityMenu.classList.remove('active');
            });

            // Density options
            document.querySelectorAll('.density-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.viewDensity = option.dataset.density;
                    localStorage.setItem('browse-view-density', this.viewDensity);

                    // Update UI
                    document.querySelectorAll('.density-option').forEach(o => o.classList.remove('active'));
                    option.classList.add('active');
                    document.querySelector('.density-label').textContent = this.capitalize(this.viewDensity);

                    // Re-render grid
                    grid.className = `entity-grid ${this.viewMode}-view density-${this.viewDensity}`;
                    this.updateGrid();

                    densityMenu.classList.remove('active');
                });
            });
        }

        // Virtual scrolling for large lists
        const container = document.getElementById('entityContainer');
        if (container && this.entities.length > 50) {
            container.addEventListener('scroll', () => this.handleScroll());
        }
    }

    /**
     * Handle chip filter click
     */
    handleChipClick(e) {
        const chip = e.currentTarget;
        const type = chip.dataset.filterType;
        const value = chip.dataset.filterValue;

        if (type === 'mythology') {
            if (this.selectedMythologies.has(value)) {
                this.selectedMythologies.delete(value);
                chip.setAttribute('aria-pressed', 'false');
                chip.classList.remove('active');
            } else {
                this.selectedMythologies.add(value);
                chip.setAttribute('aria-pressed', 'true');
                chip.classList.add('active');
            }
        } else if (type === 'domain') {
            if (this.selectedDomains.has(value)) {
                this.selectedDomains.delete(value);
                chip.setAttribute('aria-pressed', 'false');
                chip.classList.remove('active');
            } else {
                this.selectedDomains.add(value);
                chip.setAttribute('aria-pressed', 'true');
                chip.classList.add('active');
            }
        } else if (type === 'type') {
            if (this.selectedTypes.has(value)) {
                this.selectedTypes.delete(value);
                chip.setAttribute('aria-pressed', 'false');
                chip.classList.remove('active');
            } else {
                this.selectedTypes.add(value);
                chip.setAttribute('aria-pressed', 'true');
                chip.classList.add('active');
            }
        }

        this.applyFilters();
        this.updateActiveFilters();
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.searchTerm = '';
        this.selectedMythologies.clear();
        this.selectedDomains.clear();
        this.selectedTypes.clear();

        // Update UI
        const searchFilter = document.getElementById('searchFilter');
        if (searchFilter) {
            searchFilter.value = '';
        }

        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.setAttribute('aria-pressed', 'false');
            chip.classList.remove('active');
        });

        this.applyFilters();
        this.updateActiveFilters();
    }

    /**
     * Update active filters display
     */
    updateActiveFilters() {
        const container = document.getElementById('activeFilters');
        if (!container) return;

        const chipsContainer = container.querySelector('.active-filter-chips');
        if (!chipsContainer) return;

        const hasFilters = this.searchTerm || this.selectedMythologies.size > 0 ||
                          this.selectedDomains.size > 0 || this.selectedTypes.size > 0;

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

        this.selectedTypes.forEach(type => {
            chips.push(`<span class="active-chip">${type}</span>`);
        });

        chipsContainer.innerHTML = chips.join('');
    }

    /**
     * Apply filters and update display
     */
    applyFilters() {
        let filtered = [...this.entities];

        // Apply mythology filter (from quick chips or initial param)
        if (this.mythology && this.selectedMythologies.size === 0) {
            filtered = filtered.filter(entity => entity.mythology === this.mythology);
        } else if (this.selectedMythologies.size > 0) {
            filtered = filtered.filter(entity => this.selectedMythologies.has(entity.mythology));
        }

        // Apply domain filter
        if (this.selectedDomains.size > 0) {
            filtered = filtered.filter(entity => {
                const domains = entity.domains || entity.attributes || entity.roles || [];
                return domains.some(domain => this.selectedDomains.has(domain));
            });
        }

        // Apply type filter
        if (this.selectedTypes.size > 0) {
            filtered = filtered.filter(entity => {
                return this.selectedTypes.has(entity.type) || this.selectedTypes.has(entity.category);
            });
        }

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(entity => {
                const searchableText = [
                    entity.name,
                    entity.description || '',
                    entity.summary || '',
                    ...(entity.domains || []),
                    ...(entity.attributes || []),
                    ...(entity.roles || []),
                    ...(entity.altNames || [])
                ].join(' ').toLowerCase();

                return searchableText.includes(this.searchTerm);
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'mythology':
                    const mythA = a.mythology || '';
                    const mythB = b.mythology || '';
                    const mythCompare = mythA.localeCompare(mythB);
                    if (mythCompare !== 0) return mythCompare;
                    return (a.name || '').localeCompare(b.name || '');

                case 'popularity':
                    return (b._popularity || 0) - (a._popularity || 0);

                case 'dateAdded':
                    return (b._dateAdded || 0) - (a._dateAdded || 0);

                case 'name':
                default:
                    return (a.name || '').localeCompare(b.name || '');
            }
        });

        this.filteredEntities = filtered;
        this.currentPage = 1;
        this.updateGrid();
        this.updateResultsInfo();
        this.updatePagination();
    }

    /**
     * Update results info text
     */
    updateResultsInfo() {
        const info = document.getElementById('resultsInfo');
        if (!info) return;

        const total = this.entities.length;
        const shown = this.filteredEntities.length;

        if (shown === total) {
            info.innerHTML = `Showing <strong>${total}</strong> ${this.category}`;
        } else {
            info.innerHTML = `Showing <strong>${shown}</strong> of <strong>${total}</strong> ${this.category}`;
        }
    }

    /**
     * Update grid with filtered entities
     */
    updateGrid() {
        const grid = document.getElementById('entityGrid');
        if (!grid) return;

        if (this.filteredEntities.length === 0) {
            grid.innerHTML = this.getEmptyStateHTML();

            // Re-attach event listener for clear button in empty state
            const clearFromEmpty = document.getElementById('clearFiltersFromEmpty');
            if (clearFromEmpty) {
                clearFromEmpty.addEventListener('click', () => this.clearAllFilters());
            }
            return;
        }

        // Use pagination or virtual scrolling for large lists
        const useVirtualScrolling = this.filteredEntities.length > 100;

        if (useVirtualScrolling) {
            this.displayedEntities = this.filteredEntities.slice(
                this.visibleRange.start,
                this.visibleRange.end
            );
        } else {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            this.displayedEntities = this.filteredEntities.slice(start, end);
        }

        grid.innerHTML = this.displayedEntities
            .map(entity => this.getEntityCardHTML(entity))
            .join('');
    }

    /**
     * Update pagination controls
     */
    updatePagination() {
        const controls = document.getElementById('paginationControls');
        if (!controls) return;

        const totalPages = Math.ceil(this.filteredEntities.length / this.itemsPerPage);

        if (totalPages <= 1 || this.filteredEntities.length > 100) {
            controls.innerHTML = '';
            return;
        }

        const pages = [];
        const maxButtons = 7;

        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        // Previous button
        pages.push(`
            <button
                class="page-btn"
                data-page="${this.currentPage - 1}"
                ${this.currentPage === 1 ? 'disabled' : ''}>
                ‹ Previous
            </button>
        `);

        // First page
        if (startPage > 1) {
            pages.push(`<button class="page-btn" data-page="1">1</button>`);
            if (startPage > 2) {
                pages.push(`<span class="page-ellipsis">...</span>`);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button
                    class="page-btn ${i === this.currentPage ? 'active' : ''}"
                    data-page="${i}">
                    ${i}
                </button>
            `);
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(`<span class="page-ellipsis">...</span>`);
            }
            pages.push(`<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`);
        }

        // Next button
        pages.push(`
            <button
                class="page-btn"
                data-page="${this.currentPage + 1}"
                ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next ›
            </button>
        `);

        controls.innerHTML = pages.join('');

        // Attach event listeners
        controls.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.updateGrid();
                    this.updatePagination();

                    // Scroll to top
                    document.getElementById('entityContainer').scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    /**
     * Handle scroll for virtual scrolling
     */
    handleScroll() {
        if (this.filteredEntities.length <= 100) return;

        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            const container = document.getElementById('entityContainer');
            if (!container) return;

            const scrollTop = container.scrollTop;
            const containerWidth = container.offsetWidth;

            // Calculate columns based on container width (responsive)
            let columns = 1;
            if (containerWidth >= 1200) columns = 4;
            else if (containerWidth >= 900) columns = 3;
            else if (containerWidth >= 600) columns = 2;

            const itemHeight = this.viewDensity === 'compact' ? 200 : (this.viewDensity === 'detailed' ? 350 : 280);
            const rowHeight = itemHeight + 24; // Include gap

            const start = Math.floor(scrollTop / rowHeight) * columns;
            const visibleRows = Math.ceil(container.offsetHeight / rowHeight) + 2; // Add buffer rows
            const end = start + (visibleRows * columns);

            if (start !== this.visibleRange.start || end !== this.visibleRange.end) {
                this.visibleRange = { start: Math.max(0, start), end: Math.min(this.filteredEntities.length, end) };
                this.updateGrid();
            }
        }, 100);
    }

    /**
     * Get comprehensive styles
     */
    getStyles() {
        return `
            <style>
                /* ==========================================
                   Browse View Container
                   ========================================== */
                .browse-view {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: var(--spacing-xl, 2rem);
                }

                /* ==========================================
                   Header Section
                   ========================================== */
                .browse-header {
                    display: flex;
                    gap: var(--spacing-xl, 2rem);
                    align-items: center;
                    margin-bottom: var(--spacing-xl, 2rem);
                    padding: var(--spacing-xl, 2rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.6);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-radius: var(--radius-2xl, 1.5rem);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                }

                .browse-header-icon {
                    font-size: 4rem;
                    filter: drop-shadow(0 4px 8px rgba(var(--color-primary-rgb), 0.4));
                    line-height: 1;
                }

                .browse-header-content {
                    flex: 1;
                }

                .browse-title {
                    font-size: clamp(1.75rem, 4vw, 2.5rem);
                    margin: 0 0 var(--spacing-sm, 0.5rem) 0;
                    color: var(--color-text-primary);
                    font-family: var(--font-heading, Georgia, serif);
                }

                .browse-description {
                    color: var(--color-text-secondary);
                    font-size: clamp(0.95rem, 2vw, 1.1rem);
                    margin: 0 0 var(--spacing-lg, 1.5rem) 0;
                    line-height: var(--leading-relaxed, 1.75);
                }

                .browse-stats {
                    display: flex;
                    gap: var(--spacing-lg, 1.5rem);
                    flex-wrap: wrap;
                }

                .stat-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--spacing-sm, 0.5rem);
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1.5rem);
                    background: linear-gradient(135deg,
                        rgba(var(--color-primary-rgb), 0.2),
                        rgba(var(--color-secondary-rgb), 0.2));
                    border: 1px solid rgba(var(--color-primary-rgb), 0.4);
                    border-radius: var(--radius-full, 9999px);
                    font-weight: var(--font-semibold, 600);
                }

                .stat-icon {
                    font-size: 1.25rem;
                    line-height: 1;
                }

                .stat-value {
                    color: var(--color-primary);
                    font-size: 1.1rem;
                }

                .stat-label {
                    color: var(--color-text-secondary);
                    font-size: 0.9rem;
                }

                /* ==========================================
                   Quick Filters Section
                   ========================================== */
                .quick-filters {
                    margin-bottom: var(--spacing-xl, 2rem);
                    padding: var(--spacing-lg, 1.5rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.4);
                    border-radius: var(--radius-xl, 1rem);
                    border: 1px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.2);
                }

                .quick-filter-section {
                    margin-bottom: var(--spacing-lg, 1.5rem);
                }

                .quick-filter-section:last-child {
                    margin-bottom: 0;
                }

                .quick-filter-title {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm, 0.5rem);
                    font-size: var(--font-size-base, 1rem);
                    font-weight: var(--font-semibold, 600);
                    color: var(--color-text-primary);
                    margin: 0 0 var(--spacing-md, 1rem) 0;
                }

                .quick-filter-icon {
                    font-size: 1.25rem;
                }

                .filter-chips {
                    display: flex;
                    gap: var(--spacing-sm, 0.5rem);
                    flex-wrap: wrap;
                }

                .filter-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--spacing-xs, 0.25rem);
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.8);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    border-radius: var(--radius-full, 9999px);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm, 0.875rem);
                    font-weight: var(--font-medium, 500);
                    cursor: pointer;
                    transition: all var(--transition-fast, 0.15s ease);
                    font-family: var(--font-primary);
                }

                .filter-chip:hover {
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border-color: rgba(var(--color-primary-rgb), 0.5);
                    color: var(--color-text-primary);
                    transform: translateY(-2px);
                }

                .filter-chip[aria-pressed="true"],
                .filter-chip.active {
                    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                    border-color: var(--color-primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.4);
                }

                .filter-chip:focus {
                    outline: 2px solid var(--color-primary);
                    outline-offset: 2px;
                }

                .chip-label {
                    line-height: 1;
                }

                .chip-count {
                    padding: 2px 6px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: var(--radius-full, 9999px);
                    font-size: 0.75rem;
                    font-weight: var(--font-semibold, 600);
                }

                /* Active Filters Display */
                .active-filters {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md, 1rem);
                    margin-top: var(--spacing-lg, 1.5rem);
                    padding-top: var(--spacing-lg, 1.5rem);
                    border-top: 1px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.2);
                    flex-wrap: wrap;
                }

                .active-filters-label {
                    font-size: var(--font-size-sm, 0.875rem);
                    font-weight: var(--font-medium, 500);
                    color: var(--color-text-secondary);
                }

                .active-filter-chips {
                    display: flex;
                    gap: var(--spacing-xs, 0.25rem);
                    flex-wrap: wrap;
                    flex: 1;
                }

                .active-chip {
                    padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border: 1px solid rgba(var(--color-primary-rgb), 0.4);
                    border-radius: var(--radius-md, 0.5rem);
                    font-size: var(--font-size-xs, 0.75rem);
                    color: var(--color-primary);
                }

                .clear-filters-btn {
                    padding: var(--spacing-xs, 0.25rem) var(--spacing-md, 1rem);
                    background: transparent;
                    border: 1px solid rgba(var(--color-text-secondary-rgb, 156, 163, 175), 0.3);
                    border-radius: var(--radius-md, 0.5rem);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm, 0.875rem);
                    cursor: pointer;
                    transition: all var(--transition-fast, 0.15s ease);
                    font-family: var(--font-primary);
                }

                .clear-filters-btn:hover {
                    background: rgba(var(--color-danger-rgb, 239, 68, 68), 0.1);
                    border-color: var(--color-danger, #ef4444);
                    color: var(--color-danger, #ef4444);
                }

                /* ==========================================
                   Filters & Controls
                   ========================================== */
                .browse-controls {
                    display: flex;
                    gap: var(--spacing-lg, 1.5rem);
                    margin-bottom: var(--spacing-xl, 2rem);
                    flex-wrap: wrap;
                    align-items: flex-end;
                    justify-content: space-between;
                }

                .browse-filters {
                    display: flex;
                    gap: var(--spacing-lg, 1.5rem);
                    flex-wrap: wrap;
                    flex: 1;
                    align-items: flex-end;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-xs, 0.25rem);
                    min-width: 180px;
                }

                .filter-search {
                    flex: 1;
                    min-width: 250px;
                }

                .filter-label {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs, 0.25rem);
                    font-size: var(--font-size-sm, 0.875rem);
                    font-weight: var(--font-medium, 500);
                    color: var(--color-text-secondary);
                }

                .filter-icon {
                    font-size: 1rem;
                }

                .filter-select,
                .filter-input {
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.8);
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    border-radius: var(--radius-lg, 0.75rem);
                    color: var(--color-text-primary);
                    font-size: var(--font-size-base, 1rem);
                    cursor: pointer;
                    transition: all var(--transition-base, 0.3s ease);
                    font-family: var(--font-primary);
                }

                .filter-select:hover,
                .filter-input:hover {
                    border-color: rgba(var(--color-primary-rgb), 0.5);
                }

                .filter-select:focus,
                .filter-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
                }

                .filter-input::placeholder {
                    color: var(--color-text-secondary);
                    opacity: 0.6;
                }

                .filter-results-info {
                    display: flex;
                    align-items: center;
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm, 0.875rem);
                }

                .filter-results-info strong {
                    color: var(--color-primary);
                    font-weight: var(--font-semibold, 600);
                }

                .view-controls {
                    display: flex;
                    gap: var(--spacing-md, 1rem);
                    align-items: flex-end;
                }

                .view-toggle {
                    display: flex;
                    gap: var(--spacing-xs, 0.25rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.6);
                    padding: var(--spacing-xs, 0.25rem);
                    border-radius: var(--radius-lg, 0.75rem);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                }

                .view-btn {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs, 0.25rem);
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
                    background: transparent;
                    border: none;
                    border-radius: var(--radius-md, 0.5rem);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm, 0.875rem);
                    font-weight: var(--font-medium, 500);
                    cursor: pointer;
                    transition: all var(--transition-fast, 0.15s ease);
                    font-family: var(--font-primary);
                }

                .view-btn:hover {
                    background: rgba(var(--color-primary-rgb), 0.1);
                    color: var(--color-text-primary);
                }

                .view-btn.active {
                    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                    color: white;
                    box-shadow: var(--shadow-md);
                }

                .view-icon {
                    font-size: 1.1rem;
                    line-height: 1;
                }

                /* Density Toggle */
                .density-toggle {
                    position: relative;
                }

                .density-btn {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs, 0.25rem);
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.8);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    border-radius: var(--radius-lg, 0.75rem);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm, 0.875rem);
                    font-weight: var(--font-medium, 500);
                    cursor: pointer;
                    transition: all var(--transition-fast, 0.15s ease);
                    font-family: var(--font-primary);
                }

                .density-btn:hover {
                    border-color: rgba(var(--color-primary-rgb), 0.5);
                    color: var(--color-text-primary);
                }

                .density-icon {
                    font-size: 1.1rem;
                    line-height: 1;
                }

                .density-menu {
                    position: absolute;
                    top: calc(100% + var(--spacing-xs, 0.25rem));
                    right: 0;
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.95);
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    border-radius: var(--radius-lg, 0.75rem);
                    padding: var(--spacing-xs, 0.25rem);
                    min-width: 160px;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all var(--transition-fast, 0.15s ease);
                    box-shadow: var(--shadow-xl);
                    z-index: 100;
                }

                .density-menu.active {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .density-option {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm, 0.5rem);
                    width: 100%;
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
                    background: transparent;
                    border: none;
                    border-radius: var(--radius-md, 0.5rem);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm, 0.875rem);
                    text-align: left;
                    cursor: pointer;
                    transition: all var(--transition-fast, 0.15s ease);
                    font-family: var(--font-primary);
                }

                .density-option:hover {
                    background: rgba(var(--color-primary-rgb), 0.1);
                    color: var(--color-text-primary);
                }

                .density-option.active {
                    background: rgba(var(--color-primary-rgb), 0.2);
                    color: var(--color-primary);
                    font-weight: var(--font-semibold, 600);
                }

                .option-icon {
                    font-size: 1rem;
                    line-height: 1;
                }

                /* ==========================================
                   Entity Grid Container
                   ========================================== */
                .entity-container {
                    max-height: none;
                    overflow-y: auto;
                }

                .entity-grid {
                    display: grid;
                    gap: var(--spacing-lg, 1.5rem);
                    margin-bottom: var(--spacing-xl, 2rem);
                    transition: opacity var(--transition-fast, 0.15s ease);
                    width: 100%;
                }

                /* Grid View */
                .entity-grid.grid-view {
                    grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
                }

                /* List View */
                .entity-grid.list-view {
                    grid-template-columns: 1fr;
                }

                /* Density: Compact */
                .entity-grid.density-compact {
                    gap: var(--spacing-md, 1rem);
                }

                .entity-grid.density-compact.grid-view {
                    grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
                }

                /* Density: Detailed */
                .entity-grid.density-detailed.grid-view {
                    grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
                    gap: var(--spacing-xl, 2rem);
                }

                /* ==========================================
                   Entity Cards
                   ========================================== */
                .entity-card {
                    display: flex;
                    flex-direction: column;
                    min-height: 180px;
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.65);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1.5px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.25);
                    border-radius: var(--radius-lg, 0.875rem);
                    padding: 1.25rem;
                    text-decoration: none;
                    color: inherit;
                    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                                border-color 0.25s ease,
                                box-shadow 0.25s ease;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    will-change: transform;
                }

                /* Compact density */
                .density-compact .entity-card {
                    padding: var(--spacing-md, 1rem);
                    min-height: 160px;
                }

                /* Detailed density */
                .density-detailed .entity-card {
                    padding: var(--spacing-xl, 2rem);
                    min-height: 280px;
                }

                .entity-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
                    opacity: 0;
                    transition: opacity var(--transition-fast, 0.15s ease);
                }

                .entity-card:hover {
                    transform: translateY(-5px) scale(1.02);
                    border-color: rgba(var(--color-primary-rgb), 0.6);
                    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.35),
                                0 0 0 1px rgba(var(--color-primary-rgb), 0.15),
                                0 0 24px rgba(var(--color-primary-rgb), 0.2);
                }

                .entity-card:hover::before {
                    opacity: 1;
                }

                .entity-card:hover .entity-preview {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .entity-card:focus {
                    outline: 3px solid var(--color-primary);
                    outline-offset: 2px;
                }

                .entity-card-header {
                    display: flex;
                    align-items: flex-start;
                    gap: var(--spacing-md, 1rem);
                    margin-bottom: var(--spacing-md, 1rem);
                }

                .density-compact .entity-card-header {
                    gap: var(--spacing-sm, 0.5rem);
                    margin-bottom: var(--spacing-sm, 0.5rem);
                }

                .entity-icon {
                    font-size: 2.25rem;
                    line-height: 1;
                    filter: drop-shadow(0 2px 6px rgba(var(--color-primary-rgb), 0.35));
                    flex-shrink: 0;
                    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .entity-card:hover .entity-icon {
                    transform: scale(1.08);
                }

                .density-compact .entity-icon {
                    font-size: 2rem;
                }

                .density-detailed .entity-icon {
                    font-size: 3rem;
                }

                /* Support SVG icons */
                .entity-icon img,
                img.entity-icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    object-fit: contain;
                }

                .density-compact .entity-icon img,
                .density-compact img.entity-icon {
                    width: 2rem;
                    height: 2rem;
                }

                .density-detailed .entity-icon img,
                .density-detailed img.entity-icon {
                    width: 3rem;
                    height: 3rem;
                }

                .entity-card-info {
                    flex: 1;
                    min-width: 0;
                }

                .entity-card-title {
                    font-size: var(--font-size-lg, 1.125rem);
                    font-weight: var(--font-semibold, 600);
                    color: var(--color-text-primary);
                    margin: 0 0 var(--spacing-xs, 0.25rem) 0;
                    line-height: var(--leading-tight, 1.25);
                }

                .density-compact .entity-card-title {
                    font-size: var(--font-size-base, 1rem);
                }

                .density-detailed .entity-card-title {
                    font-size: var(--font-size-xl, 1.25rem);
                }

                .entity-mythology {
                    display: inline-block;
                    font-size: var(--font-size-xs, 0.75rem);
                    padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border: 1px solid rgba(var(--color-primary-rgb), 0.4);
                    border-radius: var(--radius-full, 9999px);
                    color: var(--color-primary);
                    text-transform: uppercase;
                    font-weight: var(--font-semibold, 600);
                    letter-spacing: 0.05em;
                }

                .entity-description {
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm, 0.875rem);
                    line-height: var(--leading-relaxed, 1.75);
                    margin: var(--spacing-md, 1rem) 0;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex: 1 1 auto;
                }

                .density-compact .entity-description {
                    font-size: var(--font-size-xs, 0.75rem);
                    margin: var(--spacing-sm, 0.5rem) 0;
                }

                .density-detailed .entity-description {
                    font-size: var(--font-size-base, 1rem);
                    margin: var(--spacing-lg, 1.5rem) 0;
                }

                .entity-tags {
                    display: flex;
                    gap: var(--spacing-xs, 0.25rem);
                    margin-top: auto;
                    padding-top: var(--spacing-sm, 0.5rem);
                    flex-wrap: wrap;
                }

                .density-compact .entity-tags {
                    margin-top: auto;
                    padding-top: var(--spacing-xs, 0.25rem);
                }

                .tag {
                    padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
                    background: rgba(var(--color-secondary-rgb), 0.2);
                    border: 1px solid rgba(var(--color-secondary-rgb), 0.4);
                    border-radius: var(--radius-md, 0.5rem);
                    font-size: var(--font-size-xs, 0.75rem);
                    color: var(--color-secondary);
                    font-weight: var(--font-medium, 500);
                    transition: all var(--transition-fast, 0.15s ease);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 120px;
                }

                .tag:hover {
                    background: rgba(var(--color-secondary-rgb), 0.3);
                    transform: scale(1.05);
                }

                .tag-overflow {
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border-color: rgba(var(--color-primary-rgb), 0.4);
                    color: var(--color-primary);
                    font-weight: var(--font-semibold, 600);
                }

                /* Hover Preview */
                .entity-preview {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(to top,
                        rgba(var(--color-surface-rgb, 26, 31, 58), 0.98) 0%,
                        rgba(var(--color-surface-rgb, 26, 31, 58), 0.95) 50%,
                        transparent 100%
                    );
                    padding: var(--spacing-xl, 2rem) var(--spacing-lg, 1.5rem) var(--spacing-lg, 1.5rem);
                    border-top: 1px solid rgba(var(--color-primary-rgb), 0.3);
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(10px);
                    transition: all var(--transition-base, 0.3s ease);
                    backdrop-filter: blur(10px);
                    pointer-events: none;
                }

                .preview-content {
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm, 0.875rem);
                    line-height: var(--leading-relaxed, 1.75);
                }

                .preview-section {
                    margin-bottom: var(--spacing-sm, 0.5rem);
                }

                .preview-section:last-child {
                    margin-bottom: 0;
                }

                .preview-section strong {
                    color: var(--color-text-primary);
                    font-weight: var(--font-semibold, 600);
                }

                /* List View Adjustments */
                .entity-grid.list-view .entity-card {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-lg, 1.5rem);
                }

                .entity-grid.list-view .entity-card-header {
                    margin-bottom: 0;
                    min-width: 0;
                    flex: 0 0 auto;
                    max-width: 280px;
                }

                .entity-grid.list-view .entity-description {
                    flex: 1;
                    min-width: 0;
                }

                .entity-grid.list-view .entity-tags {
                    flex: 0 0 auto;
                    max-width: 200px;
                    justify-content: flex-end;
                }

                /* ==========================================
                   Pagination Controls
                   ========================================== */
                .pagination-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: var(--spacing-sm, 0.5rem);
                    margin-top: var(--spacing-xl, 2rem);
                    flex-wrap: wrap;
                }

                .page-btn {
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
                    min-width: 40px;
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.8);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    border-radius: var(--radius-md, 0.5rem);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm, 0.875rem);
                    font-weight: var(--font-medium, 500);
                    cursor: pointer;
                    transition: all var(--transition-fast, 0.15s ease);
                    font-family: var(--font-primary);
                }

                .page-btn:hover:not(:disabled) {
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border-color: rgba(var(--color-primary-rgb), 0.5);
                    color: var(--color-text-primary);
                }

                .page-btn.active {
                    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                    border-color: var(--color-primary);
                    color: white;
                    box-shadow: var(--shadow-md);
                }

                .page-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .page-ellipsis {
                    padding: var(--spacing-sm, 0.5rem);
                    color: var(--color-text-secondary);
                }

                /* ==========================================
                   Empty State
                   ========================================== */
                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: var(--spacing-5xl, 5rem) var(--spacing-xl, 2rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.4);
                    border: 2px dashed rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    border-radius: var(--radius-2xl, 1.5rem);
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: var(--spacing-lg, 1.5rem);
                    opacity: 0.5;
                    filter: grayscale(1);
                }

                .empty-state h3 {
                    color: var(--color-text-primary);
                    font-size: var(--font-size-2xl, 1.5rem);
                    margin: 0 0 var(--spacing-md, 1rem) 0;
                }

                .empty-state p {
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-base, 1rem);
                    margin: 0 0 var(--spacing-lg, 1.5rem) 0;
                    max-width: 500px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .empty-state .btn-primary {
                    padding: var(--spacing-md, 1rem) var(--spacing-xl, 2rem);
                    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                    border: none;
                    border-radius: var(--radius-lg, 0.75rem);
                    color: white;
                    font-size: var(--font-size-base, 1rem);
                    font-weight: var(--font-semibold, 600);
                    cursor: pointer;
                    transition: all var(--transition-base, 0.3s ease);
                    font-family: var(--font-primary);
                    box-shadow: var(--shadow-md);
                }

                .empty-state .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }

                /* ==========================================
                   Responsive Design
                   ========================================== */

                /* Large Tablet */
                @media (max-width: 1200px) {
                    .entity-grid.grid-view {
                        grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
                    }

                    .entity-grid.density-compact.grid-view {
                        grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
                    }

                    .entity-grid.density-detailed.grid-view {
                        grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
                    }
                }

                /* Small Tablet */
                @media (max-width: 900px) {
                    .entity-grid.grid-view {
                        grid-template-columns: repeat(2, 1fr);
                        gap: var(--spacing-md, 1rem);
                    }

                    .entity-grid.density-detailed.grid-view {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                /* Mobile */
                @media (max-width: 768px) {
                    .browse-view {
                        padding: var(--spacing-md, 1rem);
                    }

                    .browse-header {
                        flex-direction: column;
                        text-align: center;
                        padding: var(--spacing-lg, 1.5rem);
                        gap: var(--spacing-lg, 1.5rem);
                    }

                    .browse-header-icon {
                        font-size: 3rem;
                    }

                    .browse-stats {
                        justify-content: center;
                    }

                    .quick-filters {
                        padding: var(--spacing-md, 1rem);
                    }

                    .browse-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .browse-filters {
                        flex-direction: column;
                    }

                    .filter-group {
                        min-width: 100%;
                    }

                    .view-controls {
                        justify-content: center;
                        flex-wrap: wrap;
                    }

                    .entity-grid.grid-view,
                    .entity-grid.list-view {
                        grid-template-columns: 1fr;
                        gap: var(--spacing-md, 1rem);
                    }

                    .entity-grid.list-view .entity-card {
                        flex-direction: column;
                        align-items: stretch;
                        gap: var(--spacing-md, 1rem);
                    }

                    .entity-grid.list-view .entity-card-header {
                        max-width: 100%;
                        width: 100%;
                    }

                    .entity-grid.list-view .entity-description {
                        -webkit-line-clamp: 2;
                    }

                    .entity-grid.list-view .entity-tags {
                        max-width: 100%;
                        justify-content: flex-start;
                    }

                    .view-label {
                        display: none;
                    }

                    .entity-preview {
                        display: none; /* Hide previews on mobile */
                    }
                }

                /* Small mobile */
                @media (max-width: 480px) {
                    .browse-view {
                        padding: var(--spacing-sm, 0.5rem);
                    }

                    .browse-title {
                        font-size: 1.5rem;
                    }

                    .browse-description {
                        font-size: 0.9rem;
                    }

                    .entity-grid.grid-view {
                        grid-template-columns: 1fr;
                        gap: var(--spacing-sm, 0.5rem);
                    }

                    .entity-card {
                        padding: var(--spacing-md, 1rem);
                        min-height: 140px;
                    }

                    .entity-icon {
                        font-size: 2rem;
                    }

                    .entity-icon img,
                    img.entity-icon {
                        width: 2rem;
                        height: 2rem;
                    }

                    .stat-badge {
                        font-size: 0.85rem;
                    }

                    .filter-chip {
                        font-size: 0.75rem;
                        padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
                    }

                    .entity-description {
                        -webkit-line-clamp: 2;
                    }
                }

                /* ==========================================
                   Accessibility
                   ========================================== */
                @media (prefers-reduced-motion: reduce) {
                    .entity-card,
                    .view-btn,
                    .tag,
                    .entity-card::before,
                    .filter-chip,
                    .entity-grid,
                    .entity-preview,
                    .density-menu {
                        transition: none;
                    }

                    .entity-card:hover {
                        transform: none;
                    }

                    .skeleton-pulse {
                        animation: none;
                        opacity: 0.7;
                    }
                }

                @media (prefers-contrast: high) {
                    .entity-card,
                    .browse-header,
                    .filter-select,
                    .filter-input,
                    .filter-chip,
                    .density-btn {
                        border-width: 3px;
                    }
                }
            </style>
        `;
    }

    /**
     * Show error
     */
    showError(container, error) {
        container.innerHTML = `
            <div class="error-container" style="
                text-align: center;
                padding: 4rem 2rem;
                background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.6);
                border-radius: var(--radius-2xl, 1.5rem);
                border: 2px solid rgba(var(--color-danger-rgb, 239, 68, 68), 0.3);
            ">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">⚠️</div>
                <h2 style="color: var(--color-text-primary); margin-bottom: 1rem;">
                    Failed to Load ${this.category}
                </h2>
                <p style="color: var(--color-text-secondary); margin-bottom: 2rem;">
                    ${error.message}
                </p>
                <button
                    onclick="location.reload()"
                    class="btn-primary"
                    style="
                        padding: 1rem 2rem;
                        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                        border: none;
                        border-radius: var(--radius-lg, 0.75rem);
                        color: white;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: var(--shadow-md);
                    ">
                    Retry
                </button>
            </div>
        `;
    }
}

// Global export for non-module script loading
// Note: ES module export removed to prevent SyntaxError in non-module context
if (typeof window !== 'undefined') {
    window.BrowseCategoryView = BrowseCategoryView;
    console.log('[BrowseCategoryView] Class registered globally');
}
