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
            <div class="search-view" style="max-width: 1600px; margin: 0 auto; padding: 1rem;">
                <div class="search-header" style="margin-bottom: 2rem;">
                    <div class="search-hero" style="
                        text-align: center;
                        padding: 3rem 2rem;
                        background: linear-gradient(135deg,
                            rgba(var(--color-primary-rgb), 0.15),
                            rgba(var(--color-secondary-rgb), 0.15));
                        backdrop-filter: blur(10px);
                        border: 2px solid rgba(var(--color-primary-rgb), 0.3);
                        border-radius: var(--radius-xl, 24px);
                        margin-bottom: 2rem;
                        box-shadow: var(--shadow-xl);
                    ">
                        <h1 style="
                            font-size: clamp(2rem, 5vw, 3rem);
                            background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            margin: 0 0 1rem 0;
                        ">🔍 Search Mythological Entities</h1>
                        <p class="search-description" style="
                            font-size: 1.2rem;
                            color: var(--color-text-secondary);
                            margin: 0;
                        ">Explore deities, heroes, creatures, and more across world mythologies</p>
                    </div>

                    <div class="search-input-wrapper" style="
                        display: flex;
                        gap: 0.75rem;
                        position: relative;
                        margin-bottom: 1rem;
                    ">
                        <div style="position: relative; flex: 1;">
                            <span class="search-icon" style="
                                position: absolute;
                                left: 1rem;
                                top: 50%;
                                transform: translateY(-50%);
                                font-size: 1.2rem;
                                opacity: 0.6;
                            ">🔍</span>
                            <input
                                type="text"
                                id="search-input"
                                class="search-input"
                                placeholder="Search deities, heroes, creatures, and more..."
                                autocomplete="off"
                                value="${this.state.query}"
                                style="
                                    width: 100%;
                                    min-height: 48px;
                                    padding: 0.75rem 3rem 0.75rem 3rem;
                                    font-size: 1.1rem;
                                    background: rgba(var(--color-surface-rgb), 0.6);
                                    backdrop-filter: blur(10px);
                                    border: 2px solid rgba(var(--color-primary-rgb), 0.2);
                                    border-radius: var(--radius-md, 12px);
                                    color: var(--color-text-primary);
                                    transition: all var(--transition-base);
                                "
                            >
                            <button id="clear-search" class="clear-btn" style="
                                display: none;
                                position: absolute;
                                right: 1rem;
                                top: 50%;
                                transform: translateY(-50%);
                                background: transparent;
                                border: none;
                                color: var(--color-text-secondary);
                                font-size: 1.5rem;
                                cursor: pointer;
                                padding: 0.25rem;
                                opacity: 0.6;
                                transition: opacity 0.2s;
                            ">✕</button>
                        </div>
                        <button id="search-btn" class="search-submit-btn" style="
                            min-height: 48px;
                            padding: 0.75rem 2rem;
                            background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                            color: white;
                            border: none;
                            border-radius: var(--radius-md, 12px);
                            font-size: 1.1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all var(--transition-base);
                            white-space: nowrap;
                        ">Search</button>
                    </div>

                    <div id="autocomplete-results" class="search-suggestions" style="
                        display: none;
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        margin-top: 0.5rem;
                        background: rgba(var(--color-surface-rgb), 0.95);
                        backdrop-filter: blur(10px);
                        border: 2px solid rgba(var(--color-primary-rgb), 0.2);
                        border-radius: var(--radius-md, 12px);
                        overflow: hidden;
                        z-index: 1000;
                        max-height: 300px;
                        overflow-y: auto;
                        box-shadow: var(--shadow-lg);
                    "></div>
                </div>

                <div class="search-content" style="
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    gap: 2rem;
                    align-items: start;
                ">
                    <aside class="search-filters" style="
                        position: sticky;
                        top: 1rem;
                        background: rgba(var(--color-surface-rgb), 0.6);
                        backdrop-filter: blur(10px);
                        border: 2px solid rgba(var(--color-primary-rgb), 0.2);
                        border-radius: var(--radius-lg, 16px);
                        padding: 1.5rem;
                        max-height: calc(100vh - 2rem);
                        overflow-y: auto;
                    ">
                        <button id="filter-toggle-btn" class="filter-toggle-btn" style="
                            width: 100%;
                            min-height: 44px;
                            padding: 0.75rem 1rem;
                            background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                            color: white;
                            border: none;
                            border-radius: var(--radius-md, 8px);
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 0.5rem;
                            margin-bottom: 1rem;
                            transition: all var(--transition-base);
                        ">
                            <span>🎛️ Filters</span>
                            <span id="filter-count" class="filter-count" style="
                                display: none;
                                background: white;
                                color: var(--color-primary);
                                border-radius: var(--radius-full, 20px);
                                padding: 0.25rem 0.75rem;
                                font-size: 0.85rem;
                                font-weight: 700;
                            ">0</span>
                        </button>

                        <div id="filter-panel" class="filter-panel" style="display: none;">
                            ${this.getFiltersHTML()}
                        </div>

                        ${this.getSearchHistoryHTML()}
                    </aside>

                    <main class="search-results-main" style="min-height: 600px;">
                        <div class="results-controls" style="
                            display: none;
                            flex-wrap: wrap;
                            gap: 1rem;
                            align-items: center;
                            justify-content: space-between;
                            padding: 1rem;
                            background: rgba(var(--color-surface-rgb), 0.4);
                            border-radius: var(--radius-md, 8px);
                            margin-bottom: 1.5rem;
                        ">
                            <div class="results-info">
                                <span id="results-count" style="
                                    font-size: 1.1rem;
                                    font-weight: 600;
                                    color: var(--color-text-primary);
                                ">0 results</span>
                            </div>

                            <div class="display-mode-switcher" style="
                                display: flex;
                                gap: 0.5rem;
                                background: rgba(var(--color-surface-rgb), 0.6);
                                padding: 0.25rem;
                                border-radius: var(--radius-md, 8px);
                                border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                            ">
                                <button class="display-mode-btn active" data-mode="grid" title="Grid view" style="
                                    min-height: 40px;
                                    min-width: 40px;
                                    padding: 0.5rem;
                                    background: var(--color-primary);
                                    border: none;
                                    border-radius: var(--radius-sm, 6px);
                                    color: white;
                                    cursor: pointer;
                                    font-size: 1.2rem;
                                    transition: all var(--transition-base);
                                ">▦</button>
                                <button class="display-mode-btn" data-mode="list" title="List view" style="
                                    min-height: 40px;
                                    min-width: 40px;
                                    padding: 0.5rem;
                                    background: transparent;
                                    border: none;
                                    border-radius: var(--radius-sm, 6px);
                                    color: var(--color-text-secondary);
                                    cursor: pointer;
                                    font-size: 1.2rem;
                                    transition: all var(--transition-base);
                                ">☰</button>
                                <button class="display-mode-btn" data-mode="table" title="Table view" style="
                                    min-height: 40px;
                                    min-width: 40px;
                                    padding: 0.5rem;
                                    background: transparent;
                                    border: none;
                                    border-radius: var(--radius-sm, 6px);
                                    color: var(--color-text-secondary);
                                    cursor: pointer;
                                    font-size: 1.2rem;
                                    transition: all var(--transition-base);
                                ">▤</button>
                            </div>

                            <div class="sort-controls" style="display: flex; align-items: center; gap: 0.5rem;">
                                <label for="sort-select" style="
                                    font-size: 0.95rem;
                                    color: var(--color-text-secondary);
                                    font-weight: 500;
                                ">Sort:</label>
                                <select id="sort-select" class="sort-select" style="
                                    min-height: 40px;
                                    padding: 0.5rem 1rem;
                                    background: rgba(var(--color-surface-rgb), 0.6);
                                    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                                    border-radius: var(--radius-sm, 6px);
                                    color: var(--color-text-primary);
                                    cursor: pointer;
                                    font-size: 0.95rem;
                                ">
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

                        <div id="pagination" class="pagination" style="
                            display: none;
                            flex-wrap: wrap;
                            justify-content: center;
                            align-items: center;
                            gap: 0.5rem;
                            padding: 2rem 0;
                        "></div>
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
            <div class="filter-group" style="margin-bottom: 1.5rem;">
                <label for="mythology-filter" style="
                    display: block;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--color-text-primary);
                    margin-bottom: 0.5rem;
                ">🌍 Mythology</label>
                <select id="mythology-filter" style="
                    width: 100%;
                    min-height: 44px;
                    padding: 0.5rem 1rem;
                    background: rgba(var(--color-surface-rgb), 0.6);
                    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                    border-radius: var(--radius-sm, 6px);
                    color: var(--color-text-primary);
                    cursor: pointer;
                    font-size: 0.95rem;
                ">
                    <option value="">All Mythologies</option>
                    ${this.mythologies.map(m =>
                        `<option value="${m.id}">${m.name}</option>`
                    ).join('')}
                </select>
            </div>

            <div class="filter-group" style="margin-bottom: 1.5rem;">
                <label style="
                    display: block;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--color-text-primary);
                    margin-bottom: 0.5rem;
                ">📚 Entity Type</label>
                <div class="checkbox-group" style="
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                ">
                    <label style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem;
                        border-radius: var(--radius-sm, 6px);
                        cursor: pointer;
                        transition: background 0.2s;
                        color: var(--color-text-secondary);
                    "><input type="checkbox" value="deities" checked style="
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        accent-color: var(--color-primary);
                    "> Deities</label>
                    <label style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem;
                        border-radius: var(--radius-sm, 6px);
                        cursor: pointer;
                        transition: background 0.2s;
                        color: var(--color-text-secondary);
                    "><input type="checkbox" value="heroes" checked style="
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        accent-color: var(--color-primary);
                    "> Heroes</label>
                    <label style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem;
                        border-radius: var(--radius-sm, 6px);
                        cursor: pointer;
                        transition: background 0.2s;
                        color: var(--color-text-secondary);
                    "><input type="checkbox" value="creatures" checked style="
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        accent-color: var(--color-primary);
                    "> Creatures</label>
                    <label style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem;
                        border-radius: var(--radius-sm, 6px);
                        cursor: pointer;
                        transition: background 0.2s;
                        color: var(--color-text-secondary);
                    "><input type="checkbox" value="cosmology" checked style="
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        accent-color: var(--color-primary);
                    "> Cosmology</label>
                    <label style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem;
                        border-radius: var(--radius-sm, 6px);
                        cursor: pointer;
                        transition: background 0.2s;
                        color: var(--color-text-secondary);
                    "><input type="checkbox" value="rituals" checked style="
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        accent-color: var(--color-primary);
                    "> Rituals</label>
                    <label style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem;
                        border-radius: var(--radius-sm, 6px);
                        cursor: pointer;
                        transition: background 0.2s;
                        color: var(--color-text-secondary);
                    "><input type="checkbox" value="texts" checked style="
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        accent-color: var(--color-primary);
                    "> Texts</label>
                </div>
            </div>

            <div class="filter-group" style="margin-bottom: 1.5rem;">
                <label for="importance-filter" style="
                    display: block;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--color-text-primary);
                    margin-bottom: 0.5rem;
                ">
                    ⭐ Minimum Importance: <span id="importance-value" style="
                        color: var(--color-secondary);
                        font-weight: 700;
                    ">1</span>
                </label>
                <input
                    type="range"
                    id="importance-filter"
                    min="1"
                    max="5"
                    value="1"
                    step="1"
                    style="
                        width: 100%;
                        height: 8px;
                        cursor: pointer;
                        accent-color: var(--color-primary);
                    "
                >
                <div style="
                    display: flex;
                    justify-content: space-between;
                    margin-top: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--color-text-secondary);
                ">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                </div>
            </div>

            <div class="filter-group" style="margin-bottom: 1.5rem;">
                <label for="image-filter" style="
                    display: block;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--color-text-primary);
                    margin-bottom: 0.5rem;
                ">🖼️ Has Image</label>
                <select id="image-filter" style="
                    width: 100%;
                    min-height: 44px;
                    padding: 0.5rem 1rem;
                    background: rgba(var(--color-surface-rgb), 0.6);
                    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                    border-radius: var(--radius-sm, 6px);
                    color: var(--color-text-primary);
                    cursor: pointer;
                    font-size: 0.95rem;
                ">
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </div>

            <div class="filter-actions" style="
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-top: 1.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid rgba(var(--color-primary-rgb), 0.2);
            ">
                <button id="apply-filters" class="btn-primary" style="
                    width: 100%;
                    min-height: 44px;
                    padding: 0.75rem 1rem;
                    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                    color: white;
                    border: none;
                    border-radius: var(--radius-md, 8px);
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--transition-base);
                ">Apply Filters</button>
                <button id="clear-filters" class="btn-secondary" style="
                    width: 100%;
                    min-height: 44px;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    color: var(--color-text-secondary);
                    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                    border-radius: var(--radius-md, 8px);
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--transition-base);
                ">Clear All</button>
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
            <div class="search-history" style="margin-top: 1.5rem;">
                <div class="history-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                ">
                    <h4 style="
                        font-size: 0.95rem;
                        font-weight: 600;
                        color: var(--color-text-primary);
                        margin: 0;
                    ">🕒 Recent Searches</h4>
                    <button id="clear-history" class="btn-text" style="
                        background: transparent;
                        border: none;
                        color: var(--color-text-secondary);
                        font-size: 0.85rem;
                        cursor: pointer;
                        padding: 0.25rem 0.5rem;
                        transition: color 0.2s;
                    ">Clear</button>
                </div>
                <ul class="history-list" style="
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                ">
                    ${this.searchHistory.slice(0, 5).map(entry => `
                        <li class="history-item" data-query="${this.escapeHtml(entry.query)}" style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 0.75rem;
                            background: rgba(var(--color-primary-rgb), 0.1);
                            border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                            border-radius: var(--radius-sm, 6px);
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                            <span class="history-query" style="
                                color: var(--color-text-primary);
                                font-size: 0.9rem;
                                flex: 1;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                            ">${this.escapeHtml(entry.query)}</span>
                            <span class="history-count" style="
                                background: rgba(var(--color-primary-rgb), 0.3);
                                color: var(--color-primary);
                                padding: 0.25rem 0.5rem;
                                border-radius: var(--radius-full, 20px);
                                font-size: 0.75rem;
                                font-weight: 700;
                                min-width: 30px;
                                text-align: center;
                            ">${entry.resultCount || 0}</span>
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
            <div class="search-placeholder" style="
                text-align: center;
                padding: 4rem 2rem;
                background: rgba(var(--color-surface-rgb), 0.3);
                border-radius: var(--radius-lg, 16px);
                border: 2px dashed rgba(var(--color-primary-rgb), 0.3);
            ">
                <div class="placeholder-icon" style="
                    font-size: 4rem;
                    margin-bottom: 1.5rem;
                    opacity: 0.6;
                ">🔍</div>
                <p style="
                    font-size: 1.2rem;
                    color: var(--color-text-secondary);
                    margin-bottom: 2rem;
                ">Enter a search term to find entities across world mythologies</p>
                <div class="search-examples">
                    <p style="
                        font-size: 1rem;
                        font-weight: 600;
                        color: var(--color-text-primary);
                        margin-bottom: 1rem;
                    ">Try searching for:</p>
                    <div style="
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.75rem;
                        justify-content: center;
                        max-width: 600px;
                        margin: 0 auto;
                    ">
                        <button class="example-query" data-query="zeus" style="
                            min-height: 44px;
                            padding: 0.75rem 1.5rem;
                            background: rgba(var(--color-primary-rgb), 0.2);
                            border: 2px solid var(--color-primary);
                            border-radius: var(--radius-full, 20px);
                            color: var(--color-primary);
                            cursor: pointer;
                            font-size: 0.95rem;
                            font-weight: 600;
                            transition: all var(--transition-base);
                        ">Zeus</button>
                        <button class="example-query" data-query="odin" style="
                            min-height: 44px;
                            padding: 0.75rem 1.5rem;
                            background: rgba(var(--color-primary-rgb), 0.2);
                            border: 2px solid var(--color-primary);
                            border-radius: var(--radius-full, 20px);
                            color: var(--color-primary);
                            cursor: pointer;
                            font-size: 0.95rem;
                            font-weight: 600;
                            transition: all var(--transition-base);
                        ">Odin</button>
                        <button class="example-query" data-query="ra" style="
                            min-height: 44px;
                            padding: 0.75rem 1.5rem;
                            background: rgba(var(--color-primary-rgb), 0.2);
                            border: 2px solid var(--color-primary);
                            border-radius: var(--radius-full, 20px);
                            color: var(--color-primary);
                            cursor: pointer;
                            font-size: 0.95rem;
                            font-weight: 600;
                            transition: all var(--transition-base);
                        ">Ra</button>
                        <button class="example-query" data-query="shiva" style="
                            min-height: 44px;
                            padding: 0.75rem 1.5rem;
                            background: rgba(var(--color-primary-rgb), 0.2);
                            border: 2px solid var(--color-primary);
                            border-radius: var(--radius-full, 20px);
                            color: var(--color-primary);
                            cursor: pointer;
                            font-size: 0.95rem;
                            font-weight: 600;
                            transition: all var(--transition-base);
                        ">Shiva</button>
                        <button class="example-query" data-query="thunder" style="
                            min-height: 44px;
                            padding: 0.75rem 1.5rem;
                            background: rgba(var(--color-primary-rgb), 0.2);
                            border: 2px solid var(--color-primary);
                            border-radius: var(--radius-full, 20px);
                            color: var(--color-primary);
                            cursor: pointer;
                            font-size: 0.95rem;
                            font-weight: 600;
                            transition: all var(--transition-base);
                        ">Thunder</button>
                        <button class="example-query" data-query="underworld" style="
                            min-height: 44px;
                            padding: 0.75rem 1.5rem;
                            background: rgba(var(--color-primary-rgb), 0.2);
                            border: 2px solid var(--color-primary);
                            border-radius: var(--radius-full, 20px);
                            color: var(--color-primary);
                            cursor: pointer;
                            font-size: 0.95rem;
                            font-weight: 600;
                            transition: all var(--transition-base);
                        ">Underworld</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate no results HTML
     */
    getNoResultsHTML() {
        return `
            <div class="no-results" style="
                text-align: center;
                padding: 4rem 2rem;
                background: linear-gradient(135deg, rgba(255, 107, 107, 0.08), rgba(255, 152, 0, 0.08));
                border: 2px dashed rgba(255, 107, 107, 0.3);
                border-radius: var(--radius-lg, 16px);
            ">
                <div class="no-results-icon" style="
                    font-size: 4rem;
                    margin-bottom: 1.5rem;
                    animation: bounce 1s ease-in-out infinite;
                ">🔍</div>
                <p style="
                    font-size: 1.3rem;
                    color: var(--color-text-primary);
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                ">No results for "${this.escapeHtml(this.state.query)}"</p>
                <p class="no-results-hint" style="
                    font-size: 1rem;
                    color: var(--color-text-secondary);
                    margin-bottom: 2rem;
                ">Try different keywords, refine your search, or adjust filters</p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button id="clear-all-filters-btn" class="btn-secondary" style="
                        min-height: 44px;
                        padding: 0.75rem 1.5rem;
                        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                        color: white;
                        border: none;
                        border-radius: var(--radius-md, 8px);
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all var(--transition-base);
                    ">Reset Filters</button>
                    <button onclick="document.getElementById('search-input').focus()" class="btn-secondary" style="
                        min-height: 44px;
                        padding: 0.75rem 1.5rem;
                        background: transparent;
                        color: var(--color-primary);
                        border: 2px solid var(--color-primary);
                        border-radius: var(--radius-md, 8px);
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all var(--transition-base);
                    ">Try Again</button>
                </div>
            </div>
        `;
    }

    /**
     * Generate loading HTML
     */
    getLoadingHTML() {
        return `
            <div class="search-loading" style="
                text-align: center;
                padding: 4rem 2rem;
            ">
                <div class="spinner"></div>
                <p style="
                    font-size: 1.1rem;
                    color: var(--color-text-secondary);
                    margin-top: 1rem;
                    font-weight: 500;
                ">Searching across mythologies...</p>
                <p style="
                    font-size: 0.9rem;
                    color: var(--color-text-tertiary);
                    margin-top: 0.5rem;
                ">This may take a moment</p>
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

            container.innerHTML = suggestions.map((term, idx) => `
                <div class="suggestion-item" data-query="${this.escapeHtml(term)}" style="
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 1px solid rgba(var(--color-primary-rgb), 0.1);
                    color: var(--color-text-primary);
                    position: relative;
                    animation: fadeIn 0.3s ease-out ${idx * 0.05}s both;
                ">
                    <span style="display: inline-block; margin-right: 0.5rem; opacity: 0.6; font-size: 0.9rem;">🔍</span>
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
            <div class="entity-grid universal-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1.5rem;
            ">
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

        // Highlight search term in name
        const highlightedName = this.highlightMatch(name, this.state.query);

        return `
            <a href="#/mythology/${mythology}/${entityType}/${entityId}" style="
                display: block;
                background: rgba(var(--color-surface-rgb), 0.6);
                backdrop-filter: blur(10px);
                border: 2px solid rgba(var(--color-primary-rgb), 0.2);
                border-radius: var(--radius-lg, 12px);
                padding: 1.5rem;
                cursor: pointer;
                transition: all var(--transition-base);
                position: relative;
                overflow: hidden;
                text-decoration: none;
                color: inherit;
            " class="entity-card grid-card">
                <div style="
                    position: absolute;
                    top: 0.75rem;
                    right: 0.75rem;
                    background: rgba(var(--color-primary-rgb), 0.2);
                    padding: 0.25rem 0.75rem;
                    border-radius: var(--radius-full, 20px);
                    font-size: 0.75rem;
                    font-weight: 600;
                    border: 1px solid rgba(var(--color-primary-rgb), 0.3);
                    color: var(--color-primary);
                ">${this.formatMythologyName(mythology)}</div>
                <div style="
                    font-size: 3rem;
                    text-align: center;
                    margin: 1rem 0;
                ">${icon}</div>
                <div style="
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: var(--color-primary);
                    margin-bottom: 0.5rem;
                    text-align: center;
                ">${highlightedName}</div>
                <div style="
                    font-size: 0.9rem;
                    color: var(--color-text-secondary);
                    line-height: 1.5;
                    margin-bottom: 1rem;
                    text-align: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                ">${this.escapeHtml(subtitle)}</div>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(var(--color-primary-rgb), 0.2);
                    gap: 0.5rem;
                ">
                    <div style="flex: 1; text-align: center;">
                        <span style="
                            display: block;
                            font-size: 0.75rem;
                            color: var(--color-text-secondary);
                            margin-bottom: 0.25rem;
                        ">Type</span>
                        <span style="
                            font-size: 0.85rem;
                            font-weight: 600;
                            color: var(--color-text-primary);
                        ">${this.formatEntityType(entityType)}</span>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <span style="
                            display: block;
                            font-size: 0.75rem;
                            color: var(--color-text-secondary);
                            margin-bottom: 0.25rem;
                        ">Importance</span>
                        <span style="
                            font-size: 1rem;
                        ">${'⭐'.repeat(stars)}</span>
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
                    onclick="searchViewInstance.goToPage(${this.state.currentPage - 1})"
                    style="
                        min-height: 44px;
                        padding: 0.75rem 1.5rem;
                        background: rgba(var(--color-surface-rgb), 0.6);
                        border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                        border-radius: var(--radius-md, 8px);
                        color: var(--color-text-primary);
                        cursor: pointer;
                        font-size: 0.95rem;
                        font-weight: 600;
                        transition: all var(--transition-base);
                        ${this.state.currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                    ">
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
            html += `<button class="btn-secondary" onclick="searchViewInstance.goToPage(1)" style="
                min-height: 44px;
                min-width: 44px;
                padding: 0.75rem;
                background: rgba(var(--color-surface-rgb), 0.6);
                border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                border-radius: var(--radius-md, 8px);
                color: var(--color-text-primary);
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 600;
                transition: all var(--transition-base);
            ">1</button>`;
            if (startPage > 2) html += '<span style="color: var(--color-text-secondary); padding: 0 0.5rem;">...</span>';
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.state.currentPage;
            html += `
                <button class="btn-${isActive ? 'primary' : 'secondary'}"
                        onclick="searchViewInstance.goToPage(${i})"
                        style="
                            min-height: 44px;
                            min-width: 44px;
                            padding: 0.75rem;
                            background: ${isActive ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'rgba(var(--color-surface-rgb), 0.6)'};
                            border: 1px solid ${isActive ? 'var(--color-primary)' : 'rgba(var(--color-primary-rgb), 0.2)'};
                            border-radius: var(--radius-md, 8px);
                            color: ${isActive ? 'white' : 'var(--color-text-primary)'};
                            cursor: pointer;
                            font-size: 0.95rem;
                            font-weight: ${isActive ? '700' : '600'};
                            transition: all var(--transition-base);
                        ">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span style="color: var(--color-text-secondary); padding: 0 0.5rem;">...</span>';
            html += `<button class="btn-secondary" onclick="searchViewInstance.goToPage(${totalPages})" style="
                min-height: 44px;
                min-width: 44px;
                padding: 0.75rem;
                background: rgba(var(--color-surface-rgb), 0.6);
                border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                border-radius: var(--radius-md, 8px);
                color: var(--color-text-primary);
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 600;
                transition: all var(--transition-base);
            ">${totalPages}</button>`;
        }

        // Next button
        html += `
            <button class="btn-secondary" ${this.state.currentPage === totalPages ? 'disabled' : ''}
                    onclick="searchViewInstance.goToPage(${this.state.currentPage + 1})"
                    style="
                        min-height: 44px;
                        padding: 0.75rem 1.5rem;
                        background: rgba(var(--color-surface-rgb), 0.6);
                        border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                        border-radius: var(--radius-md, 8px);
                        color: var(--color-text-primary);
                        cursor: pointer;
                        font-size: 0.95rem;
                        font-weight: 600;
                        transition: all var(--transition-base);
                        ${this.state.currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                    ">
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

// Global export for non-module script loading
if (typeof window !== 'undefined') {
    window.SearchViewComplete = SearchViewComplete;
}

// Global instance for pagination callbacks
let searchViewInstance = null;
