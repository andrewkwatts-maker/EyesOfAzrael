/**
 * Entity Auto-Population System
 *
 * Automatically populates mythology pages with entity panels
 * based on page metadata and data attributes.
 *
 * Usage:
 * <div data-auto-populate
 *      data-mythology="greek"
 *      data-category="artifact"
 *      data-display-mode="compact"></div>
 *
 * <script src="/components/auto-populate.js"></script>
 */

class EntityAutoPopulator {
    constructor() {
        this.indices = {
            all: null,
            byMythology: null,
            byCategory: null,
            byArchetype: null
        };
        this.loaded = false;
        this.loading = false;
        this.loadPromise = null;
    }

    /**
     * Initialize and populate all auto-populate containers on the page
     */
    async init() {
        if (this.loading) {
            return this.loadPromise;
        }

        this.loading = true;
        this.loadPromise = this.loadIndices();

        try {
            await this.loadPromise;
            this.loaded = true;
            await this.populateAll();
        } catch (error) {
            console.error('EntityAutoPopulator: Failed to initialize', error);
        } finally {
            this.loading = false;
        }
    }

    /**
     * Load entity indices from JSON files
     */
    async loadIndices() {
        console.log('EntityAutoPopulator: Loading indices...');

        try {
            // Load all indices in parallel
            const [all, byMythology, byCategory, byArchetype] = await Promise.all([
                this.fetchJSON('/data/indices/all-entities.json'),
                this.fetchJSON('/data/indices/by-mythology.json'),
                this.fetchJSON('/data/indices/by-category.json'),
                this.fetchJSON('/data/indices/by-archetype.json')
            ]);

            this.indices.all = all;
            this.indices.byMythology = byMythology;
            this.indices.byCategory = byCategory;
            this.indices.byArchetype = byArchetype;

            console.log(`EntityAutoPopulator: Loaded ${all.length} entities`);
        } catch (error) {
            console.error('EntityAutoPopulator: Failed to load indices', error);
            throw error;
        }
    }

    /**
     * Fetch and parse JSON file
     */
    async fetchJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Populate all auto-populate containers on the page
     */
    async populateAll() {
        const containers = document.querySelectorAll('[data-auto-populate]');
        console.log(`EntityAutoPopulator: Found ${containers.length} containers to populate`);

        for (const container of containers) {
            try {
                await this.populateContainer(container);
            } catch (error) {
                console.error('EntityAutoPopulator: Error populating container', error);
                this.renderError(container, error);
            }
        }
    }

    /**
     * Populate a single container with entity panels
     */
    async populateContainer(container) {
        // Extract configuration from data attributes
        const config = {
            mythology: container.dataset.mythology || null,
            category: container.dataset.category || null,
            subCategory: container.dataset.subCategory || null,
            type: container.dataset.type || null,
            archetype: container.dataset.archetype || null,
            element: container.dataset.element || null,
            sefirot: container.dataset.sefirot || null,
            tags: container.dataset.tags ? container.dataset.tags.split(',').map(t => t.trim()) : null,
            displayMode: container.dataset.displayMode || 'compact',
            limit: container.dataset.limit ? parseInt(container.dataset.limit) : null,
            sortBy: container.dataset.sortBy || 'name', // name, category, random
            showCount: container.dataset.showCount !== 'false',
            gridColumns: container.dataset.gridColumns || null
        };

        // Filter entities based on config
        const entities = this.filterEntities(config);

        // Sort entities
        const sortedEntities = this.sortEntities(entities, config.sortBy);

        // Apply limit if specified
        const limitedEntities = config.limit
            ? sortedEntities.slice(0, config.limit)
            : sortedEntities;

        // Show count if enabled
        if (config.showCount && entities.length > 0) {
            const countEl = document.createElement('div');
            countEl.className = 'auto-populate-count';
            countEl.textContent = `Found ${entities.length} ${entities.length === 1 ? 'entity' : 'entities'}`;
            if (config.limit && entities.length > config.limit) {
                countEl.textContent += ` (showing ${config.limit})`;
            }
            container.appendChild(countEl);
        }

        // Create grid container
        const grid = document.createElement('div');
        grid.className = 'entity-auto-grid';
        if (config.gridColumns) {
            grid.style.gridTemplateColumns = `repeat(auto-fit, minmax(${config.gridColumns}, 1fr))`;
        }
        container.appendChild(grid);

        // Render entities
        if (limitedEntities.length === 0) {
            this.renderEmpty(container, config);
        } else {
            for (const entity of limitedEntities) {
                await this.renderEntity(grid, entity, config);
            }
        }

        // Mark as populated
        container.dataset.populated = 'true';
    }

    /**
     * Filter entities based on configuration
     */
    filterEntities(config) {
        let entities = this.indices.all;

        // Filter by mythology
        if (config.mythology) {
            entities = entities.filter(e =>
                e.mythologies.includes(config.mythology)
            );
        }

        // Filter by category
        if (config.category) {
            entities = entities.filter(e =>
                e.category === config.category
            );
        }

        // Filter by subCategory
        if (config.subCategory) {
            entities = entities.filter(e =>
                e.subCategory === config.subCategory
            );
        }

        // Filter by type
        if (config.type) {
            entities = entities.filter(e =>
                e.type === config.type
            );
        }

        // Filter by archetype
        if (config.archetype) {
            entities = entities.filter(e =>
                e.archetypes.some(a => a.category === config.archetype)
            );
        }

        // Filter by element
        if (config.element) {
            entities = entities.filter(e =>
                e.element === config.element
            );
        }

        // Filter by sefirot
        if (config.sefirot) {
            entities = entities.filter(e =>
                e.sefirot.includes(config.sefirot)
            );
        }

        // Filter by tags
        if (config.tags && config.tags.length > 0) {
            entities = entities.filter(e =>
                config.tags.some(tag => e.tags.includes(tag))
            );
        }

        return entities;
    }

    /**
     * Sort entities based on sort configuration
     */
    sortEntities(entities, sortBy) {
        switch (sortBy) {
            case 'name':
                return entities.sort((a, b) => a.name.localeCompare(b.name));

            case 'category':
                return entities.sort((a, b) => {
                    const catCompare = a.category.localeCompare(b.category);
                    if (catCompare !== 0) return catCompare;
                    return a.name.localeCompare(b.name);
                });

            case 'mythology':
                return entities.sort((a, b) => {
                    const mythCompare = a.primaryMythology.localeCompare(b.primaryMythology);
                    if (mythCompare !== 0) return mythCompare;
                    return a.name.localeCompare(b.name);
                });

            case 'random':
                return this.shuffleArray([...entities]);

            default:
                return entities;
        }
    }

    /**
     * Shuffle array (Fisher-Yates algorithm)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Render a single entity panel
     */
    async renderEntity(container, entity, config) {
        // Create unique container ID
        const containerId = `entity-${entity.id}-${Math.random().toString(36).substr(2, 9)}`;

        // Create panel element
        const panel = document.createElement('div');
        panel.setAttribute('data-entity-panel', '');
        panel.setAttribute('data-entity-id', entity.id);
        panel.setAttribute('data-entity-type', entity.type);
        panel.setAttribute('data-display-mode', config.displayMode);
        if (config.mythology) {
            panel.setAttribute('data-mythology', config.mythology);
        }
        panel.id = containerId;
        panel.className = 'entity-auto-panel';

        container.appendChild(panel);

        // Load EntityPanel if available
        if (typeof EntityPanel !== 'undefined') {
            try {
                const entityPanel = new EntityPanel({
                    entityId: entity.id,
                    entityType: entity.type,
                    displayMode: config.displayMode,
                    containerId: containerId,
                    mythology: config.mythology
                });
                await entityPanel.load();
            } catch (error) {
                console.error(`Failed to load EntityPanel for ${entity.id}`, error);
                this.renderFallback(panel, entity, config);
            }
        } else {
            // Fallback if EntityPanel not available
            this.renderFallback(panel, entity, config);
        }
    }

    /**
     * Render fallback card (simple version without EntityPanel)
     */
    renderFallback(container, entity, config) {
        const url = this.getEntityUrl(entity);

        container.innerHTML = `
            <div class="entity-card-fallback ${config.displayMode}">
                <div class="entity-icon">${entity.icon}</div>
                <div class="entity-info">
                    <h3><a href="${url}">${entity.name}</a></h3>
                    <p class="entity-description">${entity.shortDescription}</p>
                    <div class="entity-meta">
                        <span class="entity-type">${entity.type}</span>
                        <span class="entity-category">${entity.category}</span>
                        ${entity.mythologies.map(m =>
                            `<span class="myth-badge">${this.capitalize(m)}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get entity URL
     */
    getEntityUrl(entity) {
        // Use primary mythology for URL
        const myth = entity.primaryMythology;
        return `/mythos/${myth}/${entity.type}s/${entity.id}.html`;
    }

    /**
     * Render empty state
     */
    renderEmpty(container, config) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'auto-populate-empty';

        let message = 'No entities found';
        if (config.mythology) {
            message += ` in ${this.capitalize(config.mythology)} mythology`;
        }
        if (config.category) {
            message += ` with category "${config.category}"`;
        }

        emptyEl.textContent = message;
        container.appendChild(emptyEl);
    }

    /**
     * Render error state
     */
    renderError(container, error) {
        const errorEl = document.createElement('div');
        errorEl.className = 'auto-populate-error';
        errorEl.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">Failed to load entities</div>
            <div class="error-details">${error.message}</div>
        `;
        container.appendChild(errorEl);
    }

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Global instance
const autoPopulator = new EntityAutoPopulator();

// Auto-init on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        autoPopulator.init();
    });
} else {
    // DOM already loaded
    autoPopulator.init();
}

// Export for manual usage
window.EntityAutoPopulator = EntityAutoPopulator;
window.autoPopulator = autoPopulator;
