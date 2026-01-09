/**
 * Corpus Query Templates
 *
 * Generates search queries based on entity attributes.
 * Provides templates for different types of corpus searches.
 *
 * Query Categories:
 * - Entity name queries - direct name searches
 * - Attribute-based queries - searches based on domains, powers, symbols
 * - Relationship queries - finds related entities
 * - Cross-reference queries - finds parallels across mythologies
 *
 * @version 1.0.0
 */

class CorpusQueryTemplates {
    constructor(options = {}) {
        this.options = {
            maxResultsPerQuery: 10,
            defaultContextWords: 20,
            includeAlternateNames: true,
            enableCrossReferences: true,
            ...options
        };

        // Category configurations
        this.categories = {
            'sacred-texts': {
                label: 'Related in Sacred Texts',
                icon: '📜',
                description: 'Find references in ancient scriptures and sacred writings',
                priority: 1,
                queryType: 'github'
            },
            'parallels': {
                label: 'Cross-Mythology Parallels',
                icon: '🌍',
                description: 'Discover similar figures across different traditions',
                priority: 2,
                queryType: 'firebase'
            },
            'historical': {
                label: 'Historical References',
                icon: '📚',
                description: 'Explore historical context and scholarly references',
                priority: 3,
                queryType: 'github'
            },
            'symbols': {
                label: 'Symbolic Connections',
                icon: '🔮',
                description: 'Find related symbols, archetypes, and meanings',
                priority: 4,
                queryType: 'firebase'
            },
            'related': {
                label: 'Related Entities',
                icon: '🔗',
                description: 'Other figures from the same tradition',
                priority: 5,
                queryType: 'firebase'
            },
            'linguistic': {
                label: 'Linguistic Analysis',
                icon: '📖',
                description: 'Etymology and name variations across sources',
                priority: 6,
                queryType: 'combined'
            }
        };

        // Entity type specific templates
        this.typeTemplates = {
            deity: this.getDeityTemplates(),
            hero: this.getHeroTemplates(),
            creature: this.getCreatureTemplates(),
            item: this.getItemTemplates(),
            place: this.getPlaceTemplates(),
            symbol: this.getSymbolTemplates(),
            text: this.getTextTemplates(),
            ritual: this.getRitualTemplates(),
            herb: this.getHerbTemplates(),
            archetype: this.getArchetypeTemplates()
        };
    }

    /**
     * Generate all queries for an entity
     * @param {Object} entity - Entity data object
     * @returns {Array<Object>} Generated queries
     */
    generateForEntity(entity) {
        const queries = [];
        const entityType = entity.type || 'entity';
        const entityName = entity.name || entity.title || '';
        const mythology = entity.mythology || entity.mythologies?.[0] || '';

        // Get type-specific templates
        const templates = this.typeTemplates[entityType] || this.getDefaultTemplates();

        // Generate queries from each applicable template
        for (const template of templates) {
            const query = this.applyTemplate(template, entity, {
                name: entityName,
                type: entityType,
                mythology: mythology
            });

            if (query && this.isQueryValid(query)) {
                queries.push(query);
            }
        }

        // Sort by priority
        queries.sort((a, b) => (a.priority || 99) - (b.priority || 99));

        return queries;
    }

    /**
     * Apply a template to generate a query
     * @param {Object} template - Query template
     * @param {Object} entity - Entity data
     * @param {Object} context - Context variables
     * @returns {Object|null} Generated query or null
     */
    applyTemplate(template, entity, context) {
        // Check if template conditions are met
        if (template.condition && !template.condition(entity)) {
            return null;
        }

        const categoryConfig = this.categories[template.category] || {};
        const queryId = `${template.category}-${entity.id || this.generateId()}`;

        // Build the query object
        const query = {
            id: queryId,
            category: template.category,
            label: this.interpolate(template.label, entity, context),
            description: this.interpolate(template.description, entity, context),
            icon: template.icon || categoryConfig.icon || '📖',
            priority: template.priority || categoryConfig.priority || 10,
            query: {
                type: template.queryType || categoryConfig.queryType || 'github',
                ...this.buildQueryParams(template, entity, context)
            }
        };

        return query;
    }

    /**
     * Build query parameters from template
     * @param {Object} template - Query template
     * @param {Object} entity - Entity data
     * @param {Object} context - Context variables
     * @returns {Object} Query parameters
     */
    buildQueryParams(template, entity, context) {
        const params = {};

        // Build search terms
        if (template.terms) {
            params.terms = template.terms(entity).filter(Boolean);
            params.term = params.terms[0] || context.name;
        } else if (template.term) {
            params.term = this.interpolate(template.term, entity, context);
        } else {
            params.term = context.name;
        }

        // Firebase collection
        if (template.collection) {
            params.collection = template.collection(entity);
        }

        // Attributes for similarity search
        if (template.attributes) {
            params.attributes = template.attributes(entity);
        }

        // Exclusions
        if (template.excludeId) {
            params.excludeId = entity.id;
        }
        if (template.excludeMythology) {
            params.excludeMythology = context.mythology;
        }

        // Mythology filter
        if (template.mythology) {
            params.mythology = template.mythology === true ? context.mythology : template.mythology;
        }

        // Query options
        params.options = {
            maxResults: template.maxResults || this.options.maxResultsPerQuery,
            contextWords: template.contextWords || this.options.defaultContextWords,
            ...(template.options || {})
        };

        return params;
    }

    /**
     * Check if a query is valid
     * @param {Object} query - Query to validate
     * @returns {boolean} Whether query is valid
     */
    isQueryValid(query) {
        // Must have a term or terms
        const hasTerm = query.query?.term || (query.query?.terms && query.query.terms.length > 0);
        return Boolean(query.id && query.category && hasTerm);
    }

    /**
     * Interpolate template string with entity data
     * @param {string} str - Template string
     * @param {Object} entity - Entity data
     * @param {Object} context - Context variables
     * @returns {string} Interpolated string
     */
    interpolate(str, entity, context) {
        if (typeof str === 'function') {
            return str(entity, context);
        }
        if (typeof str !== 'string') return str || '';

        return str
            .replace(/\{name\}/g, context.name || '')
            .replace(/\{type\}/g, context.type || '')
            .replace(/\{mythology\}/g, context.mythology || '')
            .replace(/\{entity\.(\w+)\}/g, (_, key) => entity[key] || '');
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ==========================================
    // Type-Specific Templates
    // ==========================================

    /**
     * Get templates for deity entities
     * @returns {Array<Object>} Deity templates
     */
    getDeityTemplates() {
        return [
            // Sacred texts mentioning this deity
            {
                category: 'sacred-texts',
                label: '{name} in Sacred Texts',
                description: 'Find references to {name} in ancient scriptures',
                terms: (entity) => {
                    const terms = [entity.name];
                    if (entity.alternateNames) {
                        terms.push(...entity.alternateNames.slice(0, 3));
                    }
                    if (entity.epithet) {
                        terms.push(entity.epithet);
                    }
                    return terms;
                },
                queryType: 'github',
                priority: 1
            },

            // Cross-mythology parallels based on domains
            {
                category: 'parallels',
                label: 'Similar Deities Across Cultures',
                description: 'Gods with similar domains and attributes',
                condition: (entity) => entity.domains && entity.domains.length > 0,
                collection: () => 'deities',
                attributes: (entity) => ({
                    domains: entity.domains?.slice(0, 3),
                    powers: entity.powers?.slice(0, 2)
                }),
                excludeId: true,
                excludeMythology: true,
                queryType: 'firebase',
                priority: 2
            },

            // Historical and scholarly references
            {
                category: 'historical',
                label: 'Historical References',
                description: 'Archaeological and scholarly sources about {name}',
                terms: (entity) => {
                    const terms = [`${entity.name} worship`];
                    if (entity.cult) {
                        terms.push(`${entity.cult} cult`);
                    }
                    if (entity.temple) {
                        terms.push(entity.temple);
                    }
                    return terms;
                },
                queryType: 'github',
                priority: 3
            },

            // Symbolic connections
            {
                category: 'symbols',
                label: 'Sacred Symbols',
                description: 'Symbols and iconography associated with {name}',
                condition: (entity) => entity.symbols || entity.attributes?.symbols,
                collection: () => 'symbols',
                terms: (entity) => {
                    return [
                        ...(entity.symbols || []),
                        ...(entity.sacredAnimals || []),
                        ...(entity.sacredPlants || [])
                    ].slice(0, 5);
                },
                queryType: 'firebase',
                priority: 4
            },

            // Related deities from same mythology
            {
                category: 'related',
                label: 'Deities of {mythology}',
                description: 'Other gods from the same pantheon',
                condition: (entity) => entity.mythology,
                collection: () => 'deities',
                mythology: true,
                excludeId: true,
                queryType: 'firebase',
                priority: 5
            },

            // Linguistic analysis
            {
                category: 'linguistic',
                label: 'Etymology of {name}',
                description: 'Name origins and linguistic connections',
                condition: (entity) => entity.etymology || entity.alternateNames?.length > 0,
                terms: (entity) => {
                    const terms = [entity.name];
                    if (entity.etymology?.originalName) {
                        terms.push(entity.etymology.originalName);
                    }
                    return terms;
                },
                options: { mode: 'linguistic' },
                queryType: 'combined',
                priority: 6
            }
        ];
    }

    /**
     * Get templates for hero entities
     * @returns {Array<Object>} Hero templates
     */
    getHeroTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: 'Tales of {name}',
                description: 'Epic stories and legends featuring {name}',
                terms: (entity) => [entity.name, ...((entity.alternateNames || []).slice(0, 2))],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Heroes of Similar Quests',
                description: 'Heroes with comparable journeys and trials',
                condition: (entity) => entity.quests || entity.archetype,
                collection: () => 'heroes',
                attributes: (entity) => ({
                    archetype: entity.archetype,
                    questType: entity.quests?.[0]?.type
                }),
                excludeId: true,
                excludeMythology: true,
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'historical',
                label: 'Historical {name}',
                description: 'Historical basis and archaeological evidence',
                terms: (entity) => [`${entity.name} historical`, `${entity.name} archaeology`],
                queryType: 'github',
                priority: 3
            },
            {
                category: 'related',
                label: 'Heroes of {mythology}',
                description: 'Other legendary figures from the same tradition',
                condition: (entity) => entity.mythology,
                collection: () => 'heroes',
                mythology: true,
                excludeId: true,
                queryType: 'firebase',
                priority: 5
            }
        ];
    }

    /**
     * Get templates for creature entities
     * @returns {Array<Object>} Creature templates
     */
    getCreatureTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: '{name} in Ancient Sources',
                description: 'Historical descriptions and sightings',
                terms: (entity) => [entity.name, ...(entity.alternateNames || []).slice(0, 2)],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Similar Creatures Worldwide',
                description: 'Comparable beings from other cultures',
                condition: (entity) => entity.classification || entity.abilities,
                collection: () => 'creatures',
                attributes: (entity) => ({
                    classification: entity.classification,
                    abilities: entity.abilities?.slice(0, 2)
                }),
                excludeId: true,
                excludeMythology: true,
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'symbols',
                label: 'Symbolic Meaning',
                description: 'What {name} represents across cultures',
                terms: (entity) => [entity.name, entity.symbolizes || entity.represents],
                queryType: 'combined',
                priority: 4
            },
            {
                category: 'related',
                label: 'Creatures of {mythology}',
                description: 'Other mythical beings from the same tradition',
                condition: (entity) => entity.mythology,
                collection: () => 'creatures',
                mythology: true,
                excludeId: true,
                queryType: 'firebase',
                priority: 5
            }
        ];
    }

    /**
     * Get templates for item entities
     * @returns {Array<Object>} Item templates
     */
    getItemTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: '{name} in Legends',
                description: 'Stories and accounts of this sacred object',
                terms: (entity) => [entity.name],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Similar Sacred Items',
                description: 'Comparable artifacts from other traditions',
                condition: (entity) => entity.itemType || entity.powers,
                collection: () => 'items',
                attributes: (entity) => ({
                    itemType: entity.itemType,
                    powers: entity.powers?.slice(0, 2)
                }),
                excludeId: true,
                excludeMythology: true,
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'symbols',
                label: 'Symbolism of {name}',
                description: 'What this artifact represents',
                terms: (entity) => [entity.name, entity.symbolizes],
                queryType: 'combined',
                priority: 4
            },
            {
                category: 'related',
                label: 'Artifacts of {mythology}',
                description: 'Other sacred items from the same tradition',
                condition: (entity) => entity.mythology,
                collection: () => 'items',
                mythology: true,
                excludeId: true,
                queryType: 'firebase',
                priority: 5
            }
        ];
    }

    /**
     * Get templates for place entities
     * @returns {Array<Object>} Place templates
     */
    getPlaceTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: '{name} in Ancient Sources',
                description: 'Historical and mythological accounts',
                terms: (entity) => [entity.name],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Similar Sacred Sites',
                description: 'Comparable locations across traditions',
                condition: (entity) => entity.placeType,
                collection: () => 'places',
                attributes: (entity) => ({
                    placeType: entity.placeType,
                    significance: entity.significance
                }),
                excludeId: true,
                excludeMythology: true,
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'historical',
                label: 'Archaeological Evidence',
                description: 'Physical remains and historical research',
                terms: (entity) => [`${entity.name} archaeology`, `${entity.name} excavation`],
                condition: (entity) => entity.physicalLocation || entity.realLocation,
                queryType: 'github',
                priority: 3
            },
            {
                category: 'related',
                label: 'Sacred Places of {mythology}',
                description: 'Other significant locations in this tradition',
                condition: (entity) => entity.mythology,
                collection: () => 'places',
                mythology: true,
                excludeId: true,
                queryType: 'firebase',
                priority: 5
            }
        ];
    }

    /**
     * Get templates for symbol entities
     * @returns {Array<Object>} Symbol templates
     */
    getSymbolTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: '{name} in Sacred Literature',
                description: 'References and interpretations in ancient texts',
                terms: (entity) => [entity.name],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Universal Symbolism',
                description: 'How this symbol appears across cultures',
                collection: () => 'symbols',
                attributes: (entity) => ({
                    meaning: entity.meaning,
                    category: entity.category
                }),
                excludeId: true,
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'related',
                label: 'Related Symbols',
                description: 'Connected symbols and iconography',
                collection: () => 'symbols',
                attributes: (entity) => ({
                    category: entity.category
                }),
                excludeId: true,
                queryType: 'firebase',
                priority: 5
            }
        ];
    }

    /**
     * Get templates for text entities
     * @returns {Array<Object>} Text templates
     */
    getTextTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: 'Content of {name}',
                description: 'Search within this sacred text',
                terms: (entity) => [entity.name],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Related Scriptures',
                description: 'Texts from the same tradition or era',
                condition: (entity) => entity.tradition || entity.era,
                collection: () => 'texts',
                attributes: (entity) => ({
                    tradition: entity.tradition,
                    textType: entity.textType
                }),
                excludeId: true,
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'historical',
                label: 'Historical Context',
                description: 'When and how {name} was written',
                terms: (entity) => [`${entity.name} history`, `${entity.name} composition`],
                queryType: 'github',
                priority: 3
            }
        ];
    }

    /**
     * Get templates for ritual entities
     * @returns {Array<Object>} Ritual templates
     */
    getRitualTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: '{name} in Ancient Sources',
                description: 'Historical descriptions of this practice',
                terms: (entity) => [entity.name],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Similar Practices',
                description: 'Comparable rituals across traditions',
                condition: (entity) => entity.ritualType || entity.purpose,
                collection: () => 'rituals',
                attributes: (entity) => ({
                    ritualType: entity.ritualType,
                    purpose: entity.purpose
                }),
                excludeId: true,
                excludeMythology: true,
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'related',
                label: 'Rituals of {mythology}',
                description: 'Other practices from this tradition',
                condition: (entity) => entity.mythology,
                collection: () => 'rituals',
                mythology: true,
                excludeId: true,
                queryType: 'firebase',
                priority: 5
            }
        ];
    }

    /**
     * Get templates for herb entities
     * @returns {Array<Object>} Herb templates
     */
    getHerbTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: '{name} in Herbalism Texts',
                description: 'Traditional knowledge and usage',
                terms: (entity) => [entity.name, ...(entity.commonNames || []).slice(0, 2)],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Similar Sacred Plants',
                description: 'Plants with comparable uses',
                condition: (entity) => entity.uses || entity.properties,
                collection: () => 'herbs',
                attributes: (entity) => ({
                    uses: entity.uses?.slice(0, 2),
                    properties: entity.properties?.slice(0, 2)
                }),
                excludeId: true,
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'historical',
                label: 'Historical Uses',
                description: 'How {name} was used through history',
                terms: (entity) => [`${entity.name} traditional medicine`, `${entity.name} ancient use`],
                queryType: 'github',
                priority: 3
            }
        ];
    }

    /**
     * Get templates for archetype entities
     * @returns {Array<Object>} Archetype templates
     */
    getArchetypeTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: 'The {name} in Mythology',
                description: 'Manifestations across cultures',
                terms: (entity) => [entity.name],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Figures Embodying {name}',
                description: 'Characters representing this archetype',
                collection: () => 'deities',
                attributes: (entity) => ({
                    archetype: entity.name
                }),
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'symbols',
                label: 'Symbols of {name}',
                description: 'Visual representations of this archetype',
                collection: () => 'symbols',
                terms: (entity) => [entity.name],
                queryType: 'firebase',
                priority: 4
            }
        ];
    }

    /**
     * Get default templates for unknown entity types
     * @returns {Array<Object>} Default templates
     */
    getDefaultTemplates() {
        return [
            {
                category: 'sacred-texts',
                label: '{name} in Sacred Texts',
                description: 'Find references to {name} in ancient sources',
                terms: (entity) => [entity.name],
                queryType: 'github',
                priority: 1
            },
            {
                category: 'parallels',
                label: 'Cross-Cultural Parallels',
                description: 'Similar concepts across traditions',
                excludeMythology: true,
                queryType: 'firebase',
                priority: 2
            },
            {
                category: 'related',
                label: 'Related from {mythology}',
                description: 'Other entities from the same tradition',
                condition: (entity) => entity.mythology,
                mythology: true,
                excludeId: true,
                queryType: 'firebase',
                priority: 5
            }
        ];
    }

    // ==========================================
    // Utility Methods
    // ==========================================

    /**
     * Get category configuration
     * @param {string} category - Category name
     * @returns {Object} Category config
     */
    getCategoryConfig(category) {
        return this.categories[category] || {};
    }

    /**
     * Get all available categories
     * @returns {Array<string>} Category names
     */
    getAvailableCategories() {
        return Object.keys(this.categories);
    }

    /**
     * Add a custom category
     * @param {string} name - Category name
     * @param {Object} config - Category configuration
     */
    addCategory(name, config) {
        this.categories[name] = config;
    }

    /**
     * Add custom templates for an entity type
     * @param {string} type - Entity type
     * @param {Array<Object>} templates - Templates to add
     */
    addTypeTemplates(type, templates) {
        if (!this.typeTemplates[type]) {
            this.typeTemplates[type] = [];
        }
        this.typeTemplates[type].push(...templates);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CorpusQueryTemplates;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.CorpusQueryTemplates = CorpusQueryTemplates;
}
