/**
 * Archetype Filter System
 *
 * Provides advanced filtering and search capabilities based on
 * universal archetypes, allowing cross-mythology discovery.
 *
 * Usage:
 * <div id="archetype-filter-container"></div>
 * <script>
 *   const filter = new ArchetypeFilter('archetype-filter-container');
 *   filter.init();
 * </script>
 */

class ArchetypeFilter {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`ArchetypeFilter: Container "${containerId}" not found`);
            return;
        }

        this.entities = [];
        this.filters = {
            archetype: null,
            minScore: 0,
            mythology: null,
            type: null,
            element: null,
            searchTerm: ''
        };

        this.archetypeDefinitions = {
            'hero-journey': {
                name: "Hero's Journey",
                description: 'Transformation through trials and adventure',
                icon: '🗡️',
                keywords: ['hero', 'quest', 'journey', 'transformation', 'trials']
            },
            'trickster': {
                name: 'Trickster',
                description: 'Cunning, deception, boundary-crossing',
                icon: '🦊',
                keywords: ['trickster', 'deception', 'cunning', 'boundary', 'chaos']
            },
            'magical-weapon': {
                name: 'Magical Weapon',
                description: 'Divine instruments of power',
                icon: '⚔️',
                keywords: ['weapon', 'sword', 'staff', 'divine-weapon', 'power']
            },
            'sacred-mountain': {
                name: 'Sacred Mountain',
                description: 'Axis mundi, cosmic center',
                icon: '⛰️',
                keywords: ['mountain', 'sacred-mountain', 'axis-mundi', 'cosmic-center']
            },
            'underworld-journey': {
                name: 'Underworld Journey',
                description: 'Descent into death and rebirth',
                icon: '🌑',
                keywords: ['underworld', 'death', 'descent', 'rebirth', 'katabasis']
            },
            'great-mother': {
                name: 'Great Mother',
                description: 'Feminine creative principle',
                icon: '🌺',
                keywords: ['mother', 'fertility', 'creation', 'goddess', 'nurture']
            },
            'dragon-slayer': {
                name: 'Dragon Slayer',
                description: 'Conquering chaos and monsters',
                icon: '🐉',
                keywords: ['dragon', 'monster', 'slayer', 'chaos', 'victory']
            },
            'world-tree': {
                name: 'World Tree',
                description: 'Cosmic axis connecting realms',
                icon: '🌳',
                keywords: ['tree', 'axis-mundi', 'cosmic-tree', 'world-tree']
            },
            'divine-child': {
                name: 'Divine Child',
                description: 'Birth of the miraculous',
                icon: '👶',
                keywords: ['child', 'birth', 'divine-birth', 'miraculous']
            },
            'wise-old-man': {
                name: 'Wise Old Man',
                description: 'Mentor, sage, wisdom keeper',
                icon: '🧙',
                keywords: ['wise', 'sage', 'mentor', 'elder', 'wisdom']
            }
        };
    }

    /**
     * Initialize the filter system
     */
    async init() {
        try {
            await this.loadEntities();
            this.render();
            this.attachEventListeners();
            this.renderResults();
        } catch (error) {
            console.error('ArchetypeFilter: Failed to initialize', error);
            this.renderError(error);
        }
    }

    /**
     * Load entity data
     */
    async loadEntities() {
        console.log('ArchetypeFilter: Loading entity data...');

        try {
            // Load all entities and archetype index
            const [allEntities, byArchetype] = await Promise.all([
                this.fetchJSON('/data/indices/all-entities.json'),
                this.fetchJSON('/data/indices/by-archetype.json')
            ]);

            this.entities = allEntities;
            this.byArchetype = byArchetype;

            console.log(`ArchetypeFilter: Loaded ${allEntities.length} entities`);
        } catch (error) {
            console.error('ArchetypeFilter: Failed to load data', error);
            throw error;
        }
    }

    /**
     * Fetch JSON file
     */
    async fetchJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Render the filter interface
     */
    render() {
        const mythologies = [...new Set(this.entities.flatMap(e => e.mythologies))].sort();
        const types = [...new Set(this.entities.map(e => e.type))].sort();
        const elements = [...new Set(this.entities.map(e => e.element).filter(Boolean))].sort();

        this.container.innerHTML = `
            <div class="archetype-filter-system">
                <!-- Filters -->
                <div class="archetype-filters glass-card">
                    <h3>Filter by Archetype</h3>

                    <!-- Search -->
                    <div class="filter-group">
                        <label for="archetype-search">Search</label>
                        <input type="text"
                               id="archetype-search"
                               placeholder="Search entities..."
                               class="filter-input">
                    </div>

                    <!-- Archetype -->
                    <div class="filter-group">
                        <label for="archetype-select">Archetype</label>
                        <select id="archetype-select" class="filter-select">
                            <option value="">All Archetypes</option>
                            ${Object.entries(this.archetypeDefinitions).map(([key, def]) => `
                                <option value="${key}">${def.icon} ${def.name}</option>
                            `).join('')}
                        </select>
                        <div id="archetype-description" class="archetype-description"></div>
                    </div>

                    <!-- Score Slider -->
                    <div class="filter-group">
                        <label>
                            Minimum Archetype Score:
                            <span id="score-display" class="score-value">0</span>
                        </label>
                        <input type="range"
                               id="score-slider"
                               min="0"
                               max="100"
                               value="0"
                               class="filter-slider">
                        <div class="slider-labels">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                        </div>
                    </div>

                    <!-- Mythology -->
                    <div class="filter-group">
                        <label for="mythology-filter">Mythology</label>
                        <select id="mythology-filter" class="filter-select">
                            <option value="">All Mythologies</option>
                            ${mythologies.map(m => `
                                <option value="${m}">${this.capitalize(m)}</option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Type -->
                    <div class="filter-group">
                        <label for="type-filter">Entity Type</label>
                        <select id="type-filter" class="filter-select">
                            <option value="">All Types</option>
                            ${types.map(t => `
                                <option value="${t}">${this.capitalize(t)}s</option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Element -->
                    <div class="filter-group">
                        <label for="element-filter">Element</label>
                        <select id="element-filter" class="filter-select">
                            <option value="">All Elements</option>
                            ${elements.map(e => `
                                <option value="${e}">${this.capitalize(e)}</option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Reset Button -->
                    <button id="reset-filters" class="btn-secondary">
                        Reset Filters
                    </button>
                </div>

                <!-- Results -->
                <div id="archetype-results" class="archetype-results">
                    <!-- Results will be rendered here -->
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to filters
     */
    attachEventListeners() {
        // Search
        const searchInput = document.getElementById('archetype-search');
        searchInput?.addEventListener('input', (e) => {
            this.filters.searchTerm = e.target.value.toLowerCase();
            this.renderResults();
        });

        // Archetype select
        const archetypeSelect = document.getElementById('archetype-select');
        archetypeSelect?.addEventListener('change', (e) => {
            this.filters.archetype = e.target.value || null;
            this.updateArchetypeDescription();
            this.renderResults();
        });

        // Score slider
        const scoreSlider = document.getElementById('score-slider');
        scoreSlider?.addEventListener('input', (e) => {
            this.filters.minScore = parseInt(e.target.value);
            document.getElementById('score-display').textContent = e.target.value;
            this.renderResults();
        });

        // Mythology filter
        const mythologyFilter = document.getElementById('mythology-filter');
        mythologyFilter?.addEventListener('change', (e) => {
            this.filters.mythology = e.target.value || null;
            this.renderResults();
        });

        // Type filter
        const typeFilter = document.getElementById('type-filter');
        typeFilter?.addEventListener('change', (e) => {
            this.filters.type = e.target.value || null;
            this.renderResults();
        });

        // Element filter
        const elementFilter = document.getElementById('element-filter');
        elementFilter?.addEventListener('change', (e) => {
            this.filters.element = e.target.value || null;
            this.renderResults();
        });

        // Reset button
        const resetButton = document.getElementById('reset-filters');
        resetButton?.addEventListener('click', () => {
            this.resetFilters();
        });
    }

    /**
     * Update archetype description
     */
    updateArchetypeDescription() {
        const descEl = document.getElementById('archetype-description');
        if (!descEl) return;

        if (this.filters.archetype) {
            const def = this.archetypeDefinitions[this.filters.archetype];
            descEl.innerHTML = `
                <div class="archetype-info">
                    <div class="archetype-icon">${def.icon}</div>
                    <div class="archetype-text">
                        <strong>${def.name}</strong>
                        <p>${def.description}</p>
                    </div>
                </div>
            `;
            descEl.style.display = 'block';
        } else {
            descEl.style.display = 'none';
        }
    }

    /**
     * Filter entities based on current filters
     */
    filterEntities() {
        return this.entities.filter(entity => {
            // Search term
            if (this.filters.searchTerm) {
                const searchLower = this.filters.searchTerm;
                const matchesSearch =
                    entity.name.toLowerCase().includes(searchLower) ||
                    entity.shortDescription.toLowerCase().includes(searchLower) ||
                    entity.tags.some(tag => tag.toLowerCase().includes(searchLower));

                if (!matchesSearch) return false;
            }

            // Filter by specific archetype
            if (this.filters.archetype) {
                const hasArchetype = entity.archetypes?.some(a =>
                    a.category === this.filters.archetype &&
                    a.score >= this.filters.minScore
                );
                if (!hasArchetype) return false;
            }

            // Filter by minimum score (any archetype)
            if (!this.filters.archetype && this.filters.minScore > 0) {
                const maxScore = Math.max(...(entity.archetypes?.map(a => a.score) || [0]));
                if (maxScore < this.filters.minScore) return false;
            }

            // Filter by mythology
            if (this.filters.mythology && !entity.mythologies.includes(this.filters.mythology)) {
                return false;
            }

            // Filter by type
            if (this.filters.type && entity.type !== this.filters.type) {
                return false;
            }

            // Filter by element
            if (this.filters.element && entity.element !== this.filters.element) {
                return false;
            }

            return true;
        });
    }

    /**
     * Render filtered results
     */
    renderResults() {
        const resultsContainer = document.getElementById('archetype-results');
        if (!resultsContainer) return;

        const filtered = this.filterEntities();

        // Sort by archetype score if filtering by archetype
        const sorted = this.filters.archetype
            ? filtered.sort((a, b) => {
                const aScore = a.archetypes?.find(ar => ar.category === this.filters.archetype)?.score || 0;
                const bScore = b.archetypes?.find(ar => ar.category === this.filters.archetype)?.score || 0;
                return bScore - aScore;
            })
            : filtered.sort((a, b) => a.name.localeCompare(b.name));

        // Render header
        resultsContainer.innerHTML = `
            <div class="results-header">
                <h3>Results</h3>
                <span class="results-count">${sorted.length} ${sorted.length === 1 ? 'entity' : 'entities'}</span>
            </div>
        `;

        if (sorted.length === 0) {
            resultsContainer.innerHTML += `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <div class="no-results-text">No entities match your filters</div>
                    <button class="btn-secondary" onclick="window.archetypeFilter?.resetFilters()">
                        Reset Filters
                    </button>
                </div>
            `;
            return;
        }

        // Create grid
        const grid = document.createElement('div');
        grid.className = 'entity-grid';
        resultsContainer.appendChild(grid);

        // Render entities
        sorted.forEach(entity => {
            this.renderEntityCard(grid, entity);
        });
    }

    /**
     * Render a single entity card
     */
    renderEntityCard(container, entity) {
        const containerId = `filtered-${entity.id}-${Math.random().toString(36).substr(2, 9)}`;

        // Create panel element
        const panel = document.createElement('div');
        panel.setAttribute('data-entity-panel', '');
        panel.setAttribute('data-entity-id', entity.id);
        panel.setAttribute('data-entity-type', entity.type);
        panel.setAttribute('data-display-mode', 'compact');
        panel.id = containerId;
        panel.className = 'archetype-result-card';

        // Add archetype score badge if filtering by archetype
        if (this.filters.archetype) {
            const arch = entity.archetypes?.find(a => a.category === this.filters.archetype);
            if (arch) {
                panel.dataset.archetypeScore = arch.score;
            }
        }

        container.appendChild(panel);

        // Load EntityPanel if available
        if (typeof EntityPanel !== 'undefined') {
            try {
                new EntityPanel({
                    entityId: entity.id,
                    entityType: entity.type,
                    displayMode: 'compact',
                    containerId: containerId
                }).load();

                // Add archetype score overlay if filtering
                if (this.filters.archetype) {
                    const arch = entity.archetypes?.find(a => a.category === this.filters.archetype);
                    if (arch) {
                        setTimeout(() => {
                            const scoreDiv = document.createElement('div');
                            scoreDiv.className = 'archetype-score-badge';
                            scoreDiv.textContent = `${arch.score}%`;
                            scoreDiv.title = `Archetype match: ${arch.score}%`;
                            panel.appendChild(scoreDiv);
                        }, 100);
                    }
                }
            } catch (error) {
                console.error(`Failed to load entity panel for ${entity.id}`, error);
            }
        }
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        this.filters = {
            archetype: null,
            minScore: 0,
            mythology: null,
            type: null,
            element: null,
            searchTerm: ''
        };

        // Reset UI
        const searchInput = document.getElementById('archetype-search');
        if (searchInput) searchInput.value = '';

        const archetypeSelect = document.getElementById('archetype-select');
        if (archetypeSelect) archetypeSelect.value = '';

        const scoreSlider = document.getElementById('score-slider');
        if (scoreSlider) {
            scoreSlider.value = '0';
            document.getElementById('score-display').textContent = '0';
        }

        const mythologyFilter = document.getElementById('mythology-filter');
        if (mythologyFilter) mythologyFilter.value = '';

        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) typeFilter.value = '';

        const elementFilter = document.getElementById('element-filter');
        if (elementFilter) elementFilter.value = '';

        this.updateArchetypeDescription();
        this.renderResults();
    }

    /**
     * Render error state
     */
    renderError(error) {
        this.container.innerHTML = `
            <div class="archetype-filter-error glass-card">
                <div class="error-icon">⚠️</div>
                <h3>Failed to Load Filter System</h3>
                <p>${error.message}</p>
            </div>
        `;
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Export for use
window.ArchetypeFilter = ArchetypeFilter;
