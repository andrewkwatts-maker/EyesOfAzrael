/**
 * Entity Loader - Universal entity loading with caching and performance optimization
 * Provides efficient access to entity data with multiple query patterns
 */

const fs = require('fs').promises;
const path = require('path');

class EntityLoader {
    constructor(options = {}) {
        this.baseDir = options.baseDir || path.join(__dirname, '..');
        this.entitiesDir = path.join(this.baseDir, 'data', 'entities');
        this.indicesDir = path.join(this.baseDir, 'data', 'indices');

        // In-memory caches
        this.cache = new Map();
        this.indices = null;
        this.byMythology = null;
        this.byType = null;
        this.byCategory = null;
        this.byArchetype = null;
        this.byElement = null;
        this.bySefirot = null;

        // Configuration
        this.enableCache = options.enableCache !== false;
        this.verbose = options.verbose || false;

        // Statistics
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            loadsFromDisk: 0,
            indexLoads: 0
        };
    }

    /**
     * Initialize the loader by loading all indices
     */
    async initialize() {
        this.log('Initializing entity loader...');

        try {
            await this.loadAllIndices();
            this.log(`Loaded indices for ${this.indices?.length || 0} entities`);
            return true;
        } catch (error) {
            console.error('Failed to initialize entity loader:', error);
            return false;
        }
    }

    /**
     * Load all index files for fast lookups
     */
    async loadAllIndices() {
        const indexFiles = [
            'all-entities.json',
            'by-mythology.json',
            'by-type.json',
            'by-category.json',
            'by-archetype.json',
            'by-element.json',
            'by-sefirot.json'
        ];

        const results = await Promise.allSettled(
            indexFiles.map(file => this.loadIndexFile(file))
        );

        results.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
                this.stats.indexLoads++;
            } else {
                console.warn(`Failed to load index ${indexFiles[idx]}:`, result.reason);
            }
        });
    }

    /**
     * Load a specific index file
     */
    async loadIndexFile(filename) {
        const filepath = path.join(this.indicesDir, filename);
        const content = await fs.readFile(filepath, 'utf-8');
        const data = JSON.parse(content);

        switch (filename) {
            case 'all-entities.json':
                this.indices = data;
                break;
            case 'by-mythology.json':
                this.byMythology = data;
                break;
            case 'by-type.json':
                this.byType = data;
                break;
            case 'by-category.json':
                this.byCategory = data;
                break;
            case 'by-archetype.json':
                this.byArchetype = data;
                break;
            case 'by-element.json':
                this.byElement = data;
                break;
            case 'by-sefirot.json':
                this.bySefirot = data;
                break;
        }

        return data;
    }

    /**
     * Load a single entity by ID and type
     */
    async loadEntity(id, type) {
        const cacheKey = `${type}:${id}`;

        // Check cache first
        if (this.enableCache && this.cache.has(cacheKey)) {
            this.stats.cacheHits++;
            this.log(`Cache hit for ${cacheKey}`);
            return this.cache.get(cacheKey);
        }

        this.stats.cacheMisses++;
        this.log(`Cache miss for ${cacheKey}, loading from disk`);

        // Load from disk
        const filepath = path.join(this.entitiesDir, type, `${id}.json`);

        try {
            const content = await fs.readFile(filepath, 'utf-8');
            const entity = JSON.parse(content);
            this.stats.loadsFromDisk++;

            // Store in cache
            if (this.enableCache) {
                this.cache.set(cacheKey, entity);
            }

            return entity;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Entity not found: ${type}/${id}`);
            }
            throw error;
        }
    }

    /**
     * Load multiple entities by IDs
     */
    async loadEntities(entityRefs) {
        const promises = entityRefs.map(ref => {
            if (typeof ref === 'string') {
                // Parse "type:id" format
                const [type, id] = ref.split(':');
                return this.loadEntity(id, type);
            } else if (ref.id && ref.type) {
                return this.loadEntity(ref.id, ref.type);
            }
            return Promise.reject(new Error('Invalid entity reference'));
        });

        const results = await Promise.allSettled(promises);
        return results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
    }

    /**
     * Load all entities of a specific type
     */
    async loadEntitiesByType(type) {
        if (!this.byType) {
            await this.loadIndexFile('by-type.json');
        }

        const entityRefs = this.byType[type] || [];
        return this.loadEntities(entityRefs.map(e => ({ id: e.id, type })));
    }

    /**
     * Load all entities from a specific mythology
     */
    async loadEntitiesByMythology(mythology) {
        if (!this.byMythology) {
            await this.loadIndexFile('by-mythology.json');
        }

        const entityRefs = this.byMythology[mythology] || [];
        return this.loadEntities(entityRefs);
    }

    /**
     * Load entities by category
     */
    async loadEntitiesByCategory(category) {
        if (!this.byCategory) {
            await this.loadIndexFile('by-category.json');
        }

        const entityRefs = this.byCategory[category] || [];
        return this.loadEntities(entityRefs);
    }

    /**
     * Load entities by archetype
     */
    async loadEntitiesByArchetype(archetype) {
        if (!this.byArchetype) {
            await this.loadIndexFile('by-archetype.json');
        }

        const entityRefs = this.byArchetype[archetype] || [];
        return this.loadEntities(entityRefs);
    }

    /**
     * Load entities by element
     */
    async loadEntitiesByElement(element) {
        if (!this.byElement) {
            await this.loadIndexFile('by-element.json');
        }

        const entityRefs = this.byElement[element] || [];
        return this.loadEntities(entityRefs);
    }

    /**
     * Load entities by sefirot
     */
    async loadEntitiesBySefirot(sefirot) {
        if (!this.bySefirot) {
            await this.loadIndexFile('by-sefirot.json');
        }

        const entityRefs = this.bySefirot[sefirot] || [];
        return this.loadEntities(entityRefs);
    }

    /**
     * Get all entities from index (lightweight, no full loading)
     */
    getAllEntitiesLight() {
        if (!this.indices) {
            throw new Error('Indices not loaded. Call initialize() first.');
        }
        return this.indices;
    }

    /**
     * Search entities by query
     */
    search(query, filters = {}) {
        if (!this.indices) {
            throw new Error('Indices not loaded. Call initialize() first.');
        }

        const lowerQuery = query.toLowerCase();
        let results = this.indices.filter(entity => {
            // Search in name, tags, and short description
            const searchableText = [
                entity.name,
                entity.shortDescription,
                ...(entity.tags || [])
            ].join(' ').toLowerCase();

            return searchableText.includes(lowerQuery);
        });

        // Apply filters
        if (filters.type) {
            results = results.filter(e => e.type === filters.type);
        }
        if (filters.mythology) {
            results = results.filter(e =>
                e.mythologies && e.mythologies.includes(filters.mythology)
            );
        }
        if (filters.category) {
            results = results.filter(e => e.category === filters.category);
        }
        if (filters.element) {
            results = results.filter(e => e.element === filters.element);
        }

        return results;
    }

    /**
     * Get entities with most connections
     */
    getMostConnected(limit = 10) {
        if (!this.indices) {
            throw new Error('Indices not loaded. Call initialize() first.');
        }

        return [...this.indices]
            .sort((a, b) => {
                const aTotal = Object.values(a.relatedCount || {}).reduce((sum, n) => sum + n, 0);
                const bTotal = Object.values(b.relatedCount || {}).reduce((sum, n) => sum + n, 0);
                return bTotal - aTotal;
            })
            .slice(0, limit);
    }

    /**
     * Get random entities for discovery
     */
    getRandomEntities(count = 10, filters = {}) {
        if (!this.indices) {
            throw new Error('Indices not loaded. Call initialize() first.');
        }

        let pool = this.indices;

        // Apply filters
        if (filters.type) {
            pool = pool.filter(e => e.type === filters.type);
        }
        if (filters.mythology) {
            pool = pool.filter(e =>
                e.mythologies && e.mythologies.includes(filters.mythology)
            );
        }

        // Fisher-Yates shuffle and take first n
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    /**
     * Get statistics about available indices
     */
    getAvailableFilters() {
        const filters = {};

        if (this.byType) {
            filters.types = Object.keys(this.byType);
        }
        if (this.byMythology) {
            filters.mythologies = Object.keys(this.byMythology);
        }
        if (this.byCategory) {
            filters.categories = Object.keys(this.byCategory);
        }
        if (this.byArchetype) {
            filters.archetypes = Object.keys(this.byArchetype);
        }
        if (this.byElement) {
            filters.elements = Object.keys(this.byElement);
        }
        if (this.bySefirot) {
            filters.sefirot = Object.keys(this.bySefirot);
        }

        return filters;
    }

    /**
     * Get loader statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            indicesLoaded: this.indices ? this.indices.length : 0,
            cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.log('Cache cleared');
    }

    /**
     * Preload entities into cache
     */
    async preloadEntities(entityRefs) {
        this.log(`Preloading ${entityRefs.length} entities...`);
        await this.loadEntities(entityRefs);
        this.log('Preload complete');
    }

    /**
     * Logging helper
     */
    log(message) {
        if (this.verbose) {
            console.log(`[EntityLoader] ${message}`);
        }
    }
}

// Browser-compatible version
if (typeof window !== 'undefined') {
    window.EntityLoader = class BrowserEntityLoader {
        constructor(options = {}) {
            this.baseUrl = options.baseUrl || '';
            this.cache = new Map();
            this.indices = null;
            this.enableCache = options.enableCache !== false;
        }

        async initialize() {
            try {
                const response = await fetch(`${this.baseUrl}/data/indices/all-entities.json`);
                this.indices = await response.json();
                return true;
            } catch (error) {
                console.error('Failed to initialize entity loader:', error);
                return false;
            }
        }

        async loadEntity(id, type) {
            const cacheKey = `${type}:${id}`;

            if (this.enableCache && this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const response = await fetch(`${this.baseUrl}/data/entities/${type}/${id}.json`);
            if (!response.ok) {
                throw new Error(`Entity not found: ${type}/${id}`);
            }

            const entity = await response.json();

            if (this.enableCache) {
                this.cache.set(cacheKey, entity);
            }

            return entity;
        }

        getAllEntitiesLight() {
            return this.indices || [];
        }

        search(query, filters = {}) {
            if (!this.indices) return [];

            const lowerQuery = query.toLowerCase();
            let results = this.indices.filter(entity => {
                const searchableText = [
                    entity.name,
                    entity.shortDescription,
                    ...(entity.tags || [])
                ].join(' ').toLowerCase();

                return searchableText.includes(lowerQuery);
            });

            if (filters.type) {
                results = results.filter(e => e.type === filters.type);
            }
            if (filters.mythology) {
                results = results.filter(e =>
                    e.mythologies && e.mythologies.includes(filters.mythology)
                );
            }

            return results;
        }

        getRandomEntities(count = 10, filters = {}) {
            if (!this.indices) return [];

            let pool = this.indices;

            if (filters.type) {
                pool = pool.filter(e => e.type === filters.type);
            }
            if (filters.mythology) {
                pool = pool.filter(e =>
                    e.mythologies && e.mythologies.includes(filters.mythology)
                );
            }

            const shuffled = [...pool];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            return shuffled.slice(0, Math.min(count, shuffled.length));
        }

        clearCache() {
            this.cache.clear();
        }
    };
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityLoader;
}
