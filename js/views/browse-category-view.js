/**
 * Browse Category View
 * Displays a grid of entities for a specific category (deities, creatures, etc.)
 * Fetches from Firebase and renders dynamically
 *
 * Features:
 * - Responsive auto-fill grid (280px min, 1fr max)
 * - List/Grid view toggle
 * - Advanced filtering and sorting
 * - Skeleton loading states
 * - Entity cards with tag badges
 * - Description truncation (3 lines)
 * - Empty states with helpful messaging
 */

class BrowseCategoryView {
    constructor(firestore) {
        this.db = firestore;
        this.cache = window.cacheManager || new FirebaseCacheManager({ db: firestore });
        this.entities = [];
        this.filteredEntities = [];
        this.category = null;
        this.mythology = null; // Optional filter
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.sortBy = 'name'; // 'name' or 'mythology'
    }

    /**
     * Render browse view for a category
     * @param {HTMLElement} container - Container to render into
     * @param {Object} options - { category, mythology }
     */
    async render(container, options = {}) {
        this.category = options.category;
        this.mythology = options.mythology;

        console.log(`[Browse View] Rendering ${this.category}${this.mythology ? ` (${this.mythology})` : ''}`);

        // Show loading state
        container.innerHTML = this.getLoadingHTML();

        try {
            // Load entities from Firebase
            await this.loadEntities();

            // Render content
            container.innerHTML = this.getBrowseHTML();
            this.attachEventListeners();

            // Hide loading spinner
            window.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { view: 'browse', category: this.category }
            }));

        } catch (error) {
            console.error('[Browse View] Error:', error);
            this.showError(container, error);
        }
    }

    /**
     * Load entities from Firebase
     */
    async loadEntities() {
        console.log(`[Browse View] Loading ${this.category} from Firebase...`);

        try {
            // Build query
            const collection = this.category;
            const query = this.mythology ? { mythology: this.mythology } : {};

            // Fetch from cache manager
            this.entities = await this.cache.getList(collection, query, {
                ttl: this.cache.defaultTTL[collection] || 3600000,
                orderBy: 'name asc',
                limit: 500
            });

            // Group by mythology
            this.groupedEntities = this.groupByMythology(this.entities);

            console.log(`[Browse View] Loaded ${this.entities.length} ${this.category}`);

        } catch (error) {
            console.error('[Browse View] Error loading entities:', error);
            throw error;
        }
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
            </style>
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

            <style>
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
                <header class="browse-header">
                    <div class="browse-header-icon">${categoryInfo.icon}</div>
                    <div class="browse-header-content">
                        <h1 class="browse-title">${categoryInfo.name}</h1>
                        <p class="browse-description">${categoryInfo.description}</p>
                        <div class="browse-stats">
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
                        </div>
                    </div>
                </header>

                <!-- Filters & Controls -->
                <div class="browse-controls">
                    <div class="browse-filters">
                        <div class="filter-group">
                            <label for="mythologyFilter" class="filter-label">
                                <span class="filter-icon">🌍</span>
                                Mythology
                            </label>
                            <select id="mythologyFilter" class="filter-select">
                                <option value="">All Mythologies</option>
                                ${Object.keys(this.groupedEntities).sort().map(myth => `
                                    <option value="${myth}" ${this.mythology === myth ? 'selected' : ''}>
                                        ${this.capitalize(myth)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="sortOrder" class="filter-label">
                                <span class="filter-icon">⚡</span>
                                Sort
                            </label>
                            <select id="sortOrder" class="filter-select">
                                <option value="name">Name (A-Z)</option>
                                <option value="mythology">Mythology</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="searchFilter" class="filter-label">
                                <span class="filter-icon">🔍</span>
                                Search
                            </label>
                            <input
                                type="text"
                                id="searchFilter"
                                class="filter-input"
                                placeholder="Search ${this.category}..."
                                aria-label="Search entities"
                            />
                        </div>
                    </div>

                    <div class="view-controls">
                        <div class="view-toggle">
                            <button
                                class="view-btn active"
                                data-view="grid"
                                aria-label="Grid view"
                                title="Grid view">
                                <span class="view-icon">⊞</span>
                                <span class="view-label">Grid</span>
                            </button>
                            <button
                                class="view-btn"
                                data-view="list"
                                aria-label="List view"
                                title="List view">
                                <span class="view-icon">☰</span>
                                <span class="view-label">List</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Entity Grid -->
                <div class="entity-grid" id="entityGrid">
                    ${this.entities.length > 0
                        ? this.entities.map(entity => this.getEntityCardHTML(entity)).join('')
                        : this.getEmptyStateHTML()
                    }
                </div>
            </div>

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
                    margin-bottom: var(--spacing-3xl, 3rem);
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
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-xs, 0.25rem);
                    min-width: 200px;
                    flex: 1;
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

                .view-controls {
                    display: flex;
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

                /* ==========================================
                   Entity Grid
                   ========================================== */
                .entity-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: var(--spacing-lg, 1.5rem);
                    margin-bottom: var(--spacing-3xl, 3rem);
                }

                .entity-grid.list-view {
                    grid-template-columns: 1fr;
                }

                /* ==========================================
                   Entity Cards
                   ========================================== */
                .entity-card {
                    display: block;
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.6);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    border-radius: var(--radius-xl, 1rem);
                    padding: var(--spacing-lg, 1.5rem);
                    text-decoration: none;
                    color: inherit;
                    transition: all var(--transition-base, 0.3s ease);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
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
                    transform: translateY(-4px);
                    border-color: var(--color-primary);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4),
                                0 0 20px rgba(var(--color-primary-rgb), 0.3);
                }

                .entity-card:hover::before {
                    opacity: 1;
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

                .entity-icon {
                    font-size: 2.5rem;
                    line-height: 1;
                    filter: drop-shadow(0 2px 4px rgba(var(--color-primary-rgb), 0.3));
                    flex-shrink: 0;
                }

                /* Support SVG icons */
                .entity-icon img,
                img.entity-icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    object-fit: contain;
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
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .entity-tags {
                    display: flex;
                    gap: var(--spacing-xs, 0.25rem);
                    margin-top: var(--spacing-md, 1rem);
                    flex-wrap: wrap;
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
                }

                .tag:hover {
                    background: rgba(var(--color-secondary-rgb), 0.3);
                    transform: scale(1.05);
                }

                /* List View Adjustments */
                .entity-grid.list-view .entity-card {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-lg, 1.5rem);
                }

                .entity-grid.list-view .entity-card-header {
                    margin-bottom: 0;
                    min-width: 300px;
                }

                .entity-grid.list-view .entity-description {
                    -webkit-line-clamp: 2;
                    flex: 1;
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
                    margin: 0;
                }

                /* ==========================================
                   Responsive Design
                   ========================================== */

                /* Tablet */
                @media (max-width: 1024px) {
                    .entity-grid {
                        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
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
                    }

                    .entity-grid {
                        grid-template-columns: 1fr;
                        gap: var(--spacing-md, 1rem);
                    }

                    .entity-grid.list-view .entity-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .entity-grid.list-view .entity-card-header {
                        min-width: 100%;
                    }

                    .view-label {
                        display: none;
                    }
                }

                /* Small mobile */
                @media (max-width: 480px) {
                    .browse-title {
                        font-size: 1.5rem;
                    }

                    .browse-description {
                        font-size: 0.9rem;
                    }

                    .entity-card {
                        padding: var(--spacing-md, 1rem);
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
                }

                /* ==========================================
                   Accessibility
                   ========================================== */
                @media (prefers-reduced-motion: reduce) {
                    .entity-card,
                    .view-btn,
                    .tag,
                    .entity-card::before {
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
                    .filter-input {
                        border-width: 3px;
                    }
                }
            </style>
        `;
    }

    /**
     * Get entity card HTML
     */
    getEntityCardHTML(entity) {
        const icon = entity.icon || this.getDefaultIcon(this.category);
        const description = entity.description || entity.summary || 'No description available';

        // Get tags from domains or attributes
        const tags = entity.domains || entity.attributes || entity.roles || [];
        const displayTags = Array.isArray(tags) ? tags.slice(0, 4) : [];

        // Check if icon is SVG path or emoji
        const isSvgIcon = icon && icon.includes('/');
        const iconHTML = isSvgIcon
            ? `<img src="${icon}" alt="${entity.name} icon" class="entity-icon" loading="lazy" />`
            : `<span class="entity-icon">${icon}</span>`;

        return `
            <a href="#/entity/${this.category}/${entity.mythology}/${entity.id}"
               class="entity-card"
               data-entity-id="${entity.id}"
               data-mythology="${entity.mythology}"
               data-name="${entity.name.toLowerCase()}">
                <div class="entity-card-header">
                    ${iconHTML}
                    <div class="entity-card-info">
                        <h3 class="entity-card-title">${this.escapeHtml(entity.name)}</h3>
                        <span class="entity-mythology">${this.capitalize(entity.mythology)}</span>
                    </div>
                </div>
                <p class="entity-description">${this.escapeHtml(description)}</p>
                ${displayTags.length > 0 ? `
                    <div class="entity-tags">
                        ${displayTags.map(tag => `
                            <span class="tag" title="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </a>
        `;
    }

    /**
     * Get empty state HTML
     */
    getEmptyStateHTML() {
        const categoryInfo = this.getCategoryInfo(this.category);

        return `
            <div class="empty-state">
                <div class="empty-icon">${categoryInfo.icon}</div>
                <h3>No ${categoryInfo.name} Found</h3>
                <p>
                    ${this.mythology
                        ? `No ${this.category} found in ${this.capitalize(this.mythology)} mythology. Try selecting a different mythology or browse all.`
                        : `No ${this.category} available at this time. Check back later for updates.`
                    }
                </p>
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
        // Mythology filter
        const mythFilter = document.getElementById('mythologyFilter');
        if (mythFilter) {
            mythFilter.addEventListener('change', (e) => {
                this.mythology = e.target.value || null;
                this.applyFilters();
            });
        }

        // Sort order
        const sortOrder = document.getElementById('sortOrder');
        if (sortOrder) {
            sortOrder.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // Search filter
        const searchFilter = document.getElementById('searchFilter');
        if (searchFilter) {
            let searchTimeout;
            searchFilter.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = e.target.value.toLowerCase();
                    this.applyFilters();
                }, 300); // Debounce search
            });
        }

        // View toggle
        const viewBtns = document.querySelectorAll('.view-btn');
        const grid = document.getElementById('entityGrid');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.viewMode = btn.dataset.view;
                if (this.viewMode === 'list') {
                    grid.classList.add('list-view');
                } else {
                    grid.classList.remove('list-view');
                }
            });
        });
    }

    /**
     * Apply filters and update display
     */
    applyFilters() {
        let filtered = [...this.entities];

        // Apply mythology filter
        if (this.mythology) {
            filtered = filtered.filter(entity =>
                entity.mythology === this.mythology
            );
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
                    ...(entity.roles || [])
                ].join(' ').toLowerCase();

                return searchableText.includes(this.searchTerm);
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (this.sortBy === 'mythology') {
                const mythCompare = a.mythology.localeCompare(b.mythology);
                if (mythCompare !== 0) return mythCompare;
            }
            return a.name.localeCompare(b.name);
        });

        this.filteredEntities = filtered;
        this.updateGrid();
    }

    /**
     * Update grid with filtered entities
     */
    updateGrid() {
        const grid = document.getElementById('entityGrid');
        if (!grid) return;

        if (this.filteredEntities.length === 0) {
            grid.innerHTML = this.getEmptyStateHTML();
        } else {
            grid.innerHTML = this.filteredEntities
                .map(entity => this.getEntityCardHTML(entity))
                .join('');
        }
    }

    /**
     * Show error
     */
    showError(container, error) {
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h2>Failed to Load ${this.category}</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn-primary">Retry</button>
            </div>
        `;
    }
}

// ES Module Export
export { BrowseCategoryView };

// Legacy global export
if (typeof window !== 'undefined') {
    window.BrowseCategoryView = BrowseCategoryView;
}
