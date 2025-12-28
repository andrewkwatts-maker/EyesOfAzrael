/**
 * Browse Category View
 * Displays a grid of entities for a specific category (deities, creatures, etc.)
 * Fetches from Firebase and renders dynamically
 */

class BrowseCategoryView {
    constructor(firestore) {
        this.db = firestore;
        this.cache = window.cacheManager || new FirebaseCacheManager({ db: firestore });
        this.entities = [];
        this.category = null;
        this.mythology = null; // Optional filter
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
     * Get loading HTML
     */
    getLoadingHTML() {
        return `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Loading ${this.category}...</p>
            </div>
        `;
    }

    /**
     * Get browse view HTML
     */
    getBrowseHTML() {
        const categoryInfo = this.getCategoryInfo(this.category);

        return `
            <div class="browse-view">
                <!-- Header -->
                <header class="browse-header">
                    <div class="browse-header-icon">${categoryInfo.icon}</div>
                    <div class="browse-header-content">
                        <h1 class="browse-title">${categoryInfo.name}</h1>
                        <p class="browse-description">${categoryInfo.description}</p>
                        <div class="browse-stats">
                            <span class="stat">${this.entities.length} ${this.category}</span>
                            <span class="stat">${Object.keys(this.groupedEntities).length} mythologies</span>
                        </div>
                    </div>
                </header>

                <!-- Filters -->
                <div class="browse-filters">
                    <select id="mythologyFilter" class="filter-select">
                        <option value="">All Mythologies</option>
                        ${Object.keys(this.groupedEntities).sort().map(myth => `
                            <option value="${myth}" ${this.mythology === myth ? 'selected' : ''}>
                                ${this.capitalize(myth)}
                            </option>
                        `).join('')}
                    </select>

                    <select id="sortOrder" class="filter-select">
                        <option value="name">Sort by Name</option>
                        <option value="mythology">Sort by Mythology</option>
                    </select>

                    <div class="view-toggle">
                        <button class="view-btn active" data-view="grid">⊞ Grid</button>
                        <button class="view-btn" data-view="list">☰ List</button>
                    </div>
                </div>

                <!-- Entity Grid -->
                <div class="entity-grid" id="entityGrid">
                    ${this.entities.map(entity => this.getEntityCardHTML(entity)).join('')}
                </div>

                ${this.entities.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <h3>No ${this.category} found</h3>
                        <p>Try selecting a different mythology or check back later.</p>
                    </div>
                ` : ''}
            </div>

            <style>
                .browse-view {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .browse-header {
                    display: flex;
                    gap: 2rem;
                    align-items: center;
                    margin-bottom: 3rem;
                    padding: 2rem;
                    background: rgba(var(--color-bg-card-rgb), 0.6);
                    border-radius: 16px;
                    border: 1px solid rgba(var(--color-border-primary-rgb), 0.3);
                }

                .browse-header-icon {
                    font-size: 4rem;
                }

                .browse-header-content {
                    flex: 1;
                }

                .browse-title {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                    color: var(--color-text-primary);
                }

                .browse-description {
                    color: var(--color-text-secondary);
                    font-size: 1.1rem;
                    margin-bottom: 1rem;
                }

                .browse-stats {
                    display: flex;
                    gap: 2rem;
                }

                .stat {
                    color: var(--color-primary);
                    font-weight: 600;
                }

                .browse-filters {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .filter-select {
                    padding: 0.75rem 1rem;
                    background: rgba(var(--color-bg-card-rgb), 0.8);
                    border: 1px solid rgba(var(--color-border-primary-rgb), 0.5);
                    border-radius: 8px;
                    color: var(--color-text-primary);
                    font-size: 1rem;
                    cursor: pointer;
                }

                .view-toggle {
                    display: flex;
                    gap: 0.5rem;
                    margin-left: auto;
                }

                .view-btn {
                    padding: 0.75rem 1rem;
                    background: rgba(var(--color-bg-card-rgb), 0.8);
                    border: 1px solid rgba(var(--color-border-primary-rgb), 0.5);
                    border-radius: 8px;
                    color: var(--color-text-primary);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .view-btn.active {
                    background: var(--color-primary);
                    border-color: var(--color-primary);
                }

                .entity-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }

                .entity-grid.list-view {
                    grid-template-columns: 1fr;
                }

                .entity-card {
                    background: rgba(var(--color-bg-card-rgb), 0.6);
                    border: 1px solid rgba(var(--color-border-primary-rgb), 0.3);
                    border-radius: 12px;
                    padding: 1.5rem;
                    text-decoration: none;
                    color: inherit;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .entity-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--color-primary);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }

                .entity-card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .entity-icon {
                    font-size: 2.5rem;
                }

                .entity-card-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: var(--color-text-primary);
                    margin: 0;
                }

                .entity-mythology {
                    font-size: 0.85rem;
                    color: var(--color-primary);
                    text-transform: capitalize;
                }

                .entity-description {
                    color: var(--color-text-secondary);
                    font-size: 0.95rem;
                    line-height: 1.6;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .entity-tags {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    flex-wrap: wrap;
                }

                .tag {
                    padding: 0.25rem 0.75rem;
                    background: rgba(var(--color-primary-rgb), 0.2);
                    border: 1px solid rgba(var(--color-primary-rgb), 0.4);
                    border-radius: 12px;
                    font-size: 0.8rem;
                    color: var(--color-primary);
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                @media (max-width: 768px) {
                    .browse-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .entity-grid {
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
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

        return `
            <a href="#/entity/${this.category}/${entity.mythology}/${entity.id}"
               class="entity-card"
               data-entity-id="${entity.id}">
                <div class="entity-card-header">
                    <span class="entity-icon">${icon}</span>
                    <div>
                        <h3 class="entity-card-title">${entity.name}</h3>
                        <div class="entity-mythology">${this.capitalize(entity.mythology)}</div>
                    </div>
                </div>
                <p class="entity-description">${description}</p>
                ${entity.domains ? `
                    <div class="entity-tags">
                        ${entity.domains.slice(0, 3).map(domain => `
                            <span class="tag">${domain}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </a>
        `;
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
                const mythology = e.target.value;
                window.location.hash = mythology
                    ? `#/browse/${this.category}/${mythology}`
                    : `#/browse/${this.category}`;
            });
        }

        // View toggle
        const viewBtns = document.querySelectorAll('.view-btn');
        const grid = document.getElementById('entityGrid');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (btn.dataset.view === 'list') {
                    grid.classList.add('list-view');
                } else {
                    grid.classList.remove('list-view');
                }
            });
        });
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
