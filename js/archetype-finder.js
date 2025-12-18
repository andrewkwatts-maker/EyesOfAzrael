/**
 * Archetype Finder
 * Advanced pattern matching and archetype identification across mythologies
 *
 * Features:
 * - Pattern-based archetype detection
 * - Semantic similarity analysis
 * - Cross-mythology archetype mapping
 * - Dynamic archetype discovery
 * - Relationship network analysis
 */

class ArchetypeFinder {
    constructor() {
        this.db = firebase.firestore();
        this.comparisonEngine = new MythologyComparisons();
        this.cache = new Map();

        // Additional archetypes beyond the base comparison engine
        this.extendedArchetypes = {
            'divine-messenger': {
                name: 'Divine Messenger',
                description: 'Herald and intermediary between gods and mortals',
                keywords: ['messenger', 'herald', 'communication', 'travel', 'guide', 'psychopomp'],
                examples: { greek: 'hermes', norse: 'heimdall', hindu: 'narada', roman: 'mercury' }
            },
            'craftsman-god': {
                name: 'Divine Craftsman',
                description: 'God of craftsmanship, forging, and creation',
                keywords: ['forge', 'craftsman', 'smith', 'creation', 'builder', 'artisan'],
                examples: { greek: 'hephaestus', norse: 'wayland', roman: 'vulcan', egyptian: 'ptah' }
            },
            'harvest-deity': {
                name: 'Harvest Deity',
                description: 'God or goddess of agriculture and harvest',
                keywords: ['harvest', 'agriculture', 'grain', 'crops', 'seasons', 'abundance'],
                examples: { greek: 'demeter', roman: 'ceres', norse: 'freyr', aztec: 'centeotl' }
            },
            'storm-god': {
                name: 'Storm God',
                description: 'Deity of storms, thunder, and weather',
                keywords: ['storm', 'thunder', 'rain', 'weather', 'tempest', 'lightning'],
                examples: { norse: 'thor', greek: 'zeus', hindu: 'indra', mayan: 'chaac' }
            },
            'sea-deity': {
                name: 'Sea Deity',
                description: 'Ruler of oceans, seas, and waters',
                keywords: ['sea', 'ocean', 'water', 'waves', 'maritime', 'naval'],
                examples: { greek: 'poseidon', roman: 'neptune', norse: 'njord', hindu: 'varuna' }
            },
            'lunar-deity': {
                name: 'Moon Deity',
                description: 'God or goddess of the moon and night',
                keywords: ['moon', 'lunar', 'night', 'phases', 'celestial', 'nocturnal'],
                examples: { greek: 'selene', roman: 'luna', norse: 'mani', egyptian: 'khonsu' }
            },
            'dawn-deity': {
                name: 'Dawn Deity',
                description: 'Goddess of dawn and morning',
                keywords: ['dawn', 'morning', 'sunrise', 'aurora', 'daybreak'],
                examples: { greek: 'eos', roman: 'aurora', hindu: 'ushas', norse: 'eostre' }
            },
            'hunting-deity': {
                name: 'Hunting Deity',
                description: 'God or goddess of the hunt and wilderness',
                keywords: ['hunt', 'hunting', 'wilderness', 'forest', 'animals', 'archer'],
                examples: { greek: 'artemis', roman: 'diana', celtic: 'cernunnos', hindu: 'rudra' }
            },
            'justice-deity': {
                name: 'Justice Deity',
                description: 'God or goddess of justice, law, and order',
                keywords: ['justice', 'law', 'order', 'balance', 'truth', 'judgment'],
                examples: { greek: 'themis', egyptian: 'maat', roman: 'justitia', norse: 'forseti' }
            },
            'wine-deity': {
                name: 'Wine & Ecstasy Deity',
                description: 'God of wine, revelry, and altered states',
                keywords: ['wine', 'ecstasy', 'revelry', 'intoxication', 'celebration', 'madness'],
                examples: { greek: 'dionysus', roman: 'bacchus', egyptian: 'hathor' }
            },
            'healer-deity': {
                name: 'Healing Deity',
                description: 'God or goddess of medicine and healing',
                keywords: ['healing', 'medicine', 'health', 'cure', 'physician', 'restoration'],
                examples: { greek: 'asclepius', egyptian: 'sekhmet', celtic: 'dian-cecht', hindu: 'dhanvantari' }
            },
            'fire-deity': {
                name: 'Fire Deity',
                description: 'God or goddess of fire and flame',
                keywords: ['fire', 'flame', 'heat', 'combustion', 'hearth', 'volcano'],
                examples: { roman: 'vesta', hindu: 'agni', hawaiian: 'pele', aztec: 'xiuhtecuhtli' }
            }
        };
    }

    /**
     * Find all entities matching a specific archetype
     * @param {string} archetypeId - Archetype identifier
     * @param {Object} options - Search options
     * @returns {Array} Matching entities with scores
     */
    async findByArchetype(archetypeId, options = {}) {
        // Check cache
        const cacheKey = `archetype:${archetypeId}:${JSON.stringify(options)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Get archetype definition
        const archetype = this.getArchetypeDefinition(archetypeId);
        if (!archetype) {
            throw new Error(`Unknown archetype: ${archetypeId}`);
        }

        const results = [];
        const collections = options.collections || ['deities', 'heroes', 'creatures'];
        const minScore = options.minScore || 3;

        // Search each collection
        for (const collection of collections) {
            try {
                const snapshot = await this.db.collection(collection)
                    .limit(options.limit || 100)
                    .get();

                snapshot.docs.forEach(doc => {
                    const entity = { id: doc.id, collection, ...doc.data() };
                    const score = this.calculateArchetypeMatch(entity, archetype);

                    if (score >= minScore) {
                        results.push({
                            ...entity,
                            archetypeScore: score,
                            archetypeId: archetypeId,
                            archetypeName: archetype.name,
                            matchedKeywords: this.getMatchedKeywords(entity, archetype)
                        });
                    }
                });
            } catch (error) {
                console.error(`Error searching ${collection}:`, error);
            }
        }

        // Sort by score
        results.sort((a, b) => b.archetypeScore - a.archetypeScore);

        // Apply mythology filter if specified
        let filtered = results;
        if (options.mythology) {
            filtered = results.filter(r => r.mythology === options.mythology);
        }

        // Cache results
        this.cache.set(cacheKey, filtered);

        return filtered;
    }

    /**
     * Identify all archetypes for a given entity
     * @param {string} entityId - Entity ID
     * @returns {Array} Matching archetypes with scores
     */
    async identifyArchetypes(entityId) {
        const entity = await this.comparisonEngine.fetchEntity(entityId);
        if (!entity) {
            throw new Error('Entity not found');
        }

        const matches = [];
        const allArchetypes = { ...this.comparisonEngine.archetypes, ...this.extendedArchetypes };

        for (const [archetypeId, archetype] of Object.entries(allArchetypes)) {
            const score = this.calculateArchetypeMatch(entity, archetype);

            if (score >= 3) {
                matches.push({
                    id: archetypeId,
                    name: archetype.name,
                    description: archetype.description,
                    score: score,
                    matchedKeywords: this.getMatchedKeywords(entity, archetype),
                    confidence: this.calculateConfidence(score)
                });
            }
        }

        return matches.sort((a, b) => b.score - a.score);
    }

    /**
     * Calculate archetype match score
     * @param {Object} entity - Entity data
     * @param {Object} archetype - Archetype definition
     * @returns {number} Match score
     */
    calculateArchetypeMatch(entity, archetype) {
        const entityText = this.buildEntitySearchText(entity);
        const keywords = archetype.keywords || archetype.attributes || [];

        let score = 0;

        // Direct keyword matches (weighted)
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');

            // Check name (highest weight)
            if (entity.name && regex.test(entity.name.toLowerCase())) {
                score += 3;
            }

            // Check title
            if (entity.title && regex.test(entity.title.toLowerCase())) {
                score += 2;
            }

            // Check domains
            if (entity.domains && entity.domains.some(d => regex.test(d.toLowerCase()))) {
                score += 2;
            }

            // Check attributes
            if (entity.attributes && entity.attributes.some(a => regex.test(a.toLowerCase()))) {
                score += 1.5;
            }

            // Check description
            if (entity.description && regex.test(entity.description.toLowerCase())) {
                score += 1;
            }

            // Check symbols
            if (entity.symbols && entity.symbols.some(s => regex.test(s.toLowerCase()))) {
                score += 1;
            }
        });

        // Check if entity is in archetype examples
        if (archetype.examples) {
            const exampleIds = Object.values(archetype.examples).map(id => id.toLowerCase());
            if (exampleIds.includes(entity.id.toLowerCase())) {
                score += 5; // Strong match for known examples
            }
        }

        return Math.round(score * 10) / 10; // Round to 1 decimal
    }

    /**
     * Build searchable text from entity
     */
    buildEntitySearchText(entity) {
        return [
            entity.name,
            entity.title,
            entity.description,
            ...(entity.domains || []),
            ...(entity.attributes || []),
            ...(entity.symbols || []),
            ...(entity.aliases || [])
        ].filter(Boolean).join(' ').toLowerCase();
    }

    /**
     * Get keywords that matched
     */
    getMatchedKeywords(entity, archetype) {
        const entityText = this.buildEntitySearchText(entity);
        const keywords = archetype.keywords || archetype.attributes || [];

        return keywords.filter(keyword => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
            return regex.test(entityText);
        });
    }

    /**
     * Calculate confidence level
     */
    calculateConfidence(score) {
        if (score >= 10) return 'very-high';
        if (score >= 7) return 'high';
        if (score >= 5) return 'medium';
        if (score >= 3) return 'low';
        return 'very-low';
    }

    /**
     * Get archetype definition
     */
    getArchetypeDefinition(archetypeId) {
        return this.comparisonEngine.archetypes[archetypeId] ||
               this.extendedArchetypes[archetypeId] ||
               null;
    }

    /**
     * Get all archetype definitions
     */
    getAllArchetypes() {
        return {
            ...this.comparisonEngine.archetypes,
            ...this.extendedArchetypes
        };
    }

    /**
     * Find related archetypes
     * @param {string} archetypeId - Base archetype
     * @returns {Array} Related archetypes
     */
    findRelatedArchetypes(archetypeId) {
        const archetype = this.getArchetypeDefinition(archetypeId);
        if (!archetype) return [];

        const allArchetypes = this.getAllArchetypes();
        const related = [];

        // Find archetypes with overlapping keywords
        for (const [otherId, otherArchetype] of Object.entries(allArchetypes)) {
            if (otherId === archetypeId) continue;

            const sharedKeywords = this.findSharedKeywords(archetype, otherArchetype);
            if (sharedKeywords.length > 0) {
                related.push({
                    id: otherId,
                    name: otherArchetype.name,
                    sharedKeywords: sharedKeywords,
                    similarity: sharedKeywords.length
                });
            }
        }

        return related.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Find shared keywords between archetypes
     */
    findSharedKeywords(arch1, arch2) {
        const keywords1 = arch1.keywords || arch1.attributes || [];
        const keywords2 = arch2.keywords || arch2.attributes || [];

        return keywords1.filter(k => keywords2.includes(k));
    }

    /**
     * Map archetype network
     * Creates a graph of archetype relationships
     */
    async mapArchetypeNetwork() {
        const allArchetypes = this.getAllArchetypes();
        const network = {
            nodes: [],
            edges: []
        };

        // Create nodes
        for (const [id, archetype] of Object.entries(allArchetypes)) {
            const entityCount = await this.countEntitiesForArchetype(id);

            network.nodes.push({
                id: id,
                name: archetype.name,
                description: archetype.description,
                entityCount: entityCount,
                keywords: archetype.keywords || archetype.attributes || []
            });
        }

        // Create edges (relationships between archetypes)
        const archetypeIds = Object.keys(allArchetypes);
        for (let i = 0; i < archetypeIds.length; i++) {
            for (let j = i + 1; j < archetypeIds.length; j++) {
                const id1 = archetypeIds[i];
                const id2 = archetypeIds[j];
                const arch1 = allArchetypes[id1];
                const arch2 = allArchetypes[id2];

                const sharedKeywords = this.findSharedKeywords(arch1, arch2);

                if (sharedKeywords.length > 0) {
                    network.edges.push({
                        source: id1,
                        target: id2,
                        weight: sharedKeywords.length,
                        sharedKeywords: sharedKeywords
                    });
                }
            }
        }

        return network;
    }

    /**
     * Count entities matching archetype (approximate)
     */
    async countEntitiesForArchetype(archetypeId) {
        try {
            const results = await this.findByArchetype(archetypeId, { limit: 100 });
            return results.length;
        } catch (error) {
            console.error(`Error counting for ${archetypeId}:`, error);
            return 0;
        }
    }

    /**
     * Find archetypes by mythology
     * Returns dominant archetypes in a specific mythology
     */
    async findArchetypesByMythology(mythology) {
        const allArchetypes = this.getAllArchetypes();
        const results = [];

        for (const [archetypeId, archetype] of Object.entries(allArchetypes)) {
            // Check if mythology has examples in this archetype
            if (archetype.examples && archetype.examples[mythology]) {
                const entities = await this.findByArchetype(archetypeId, {
                    mythology: mythology,
                    limit: 20
                });

                results.push({
                    id: archetypeId,
                    name: archetype.name,
                    description: archetype.description,
                    entityCount: entities.length,
                    topEntities: entities.slice(0, 5),
                    example: archetype.examples[mythology]
                });
            }
        }

        return results.sort((a, b) => b.entityCount - a.entityCount);
    }

    /**
     * Find universal archetypes
     * Archetypes that appear in most/all mythologies
     */
    async findUniversalArchetypes(minMythologies = 3) {
        const allArchetypes = this.getAllArchetypes();
        const universal = [];

        for (const [archetypeId, archetype] of Object.entries(allArchetypes)) {
            if (!archetype.examples) continue;

            const mythologyCount = Object.keys(archetype.examples).length;

            if (mythologyCount >= minMythologies) {
                const entities = await this.findByArchetype(archetypeId, { limit: 50 });

                // Count unique mythologies represented
                const mythologies = [...new Set(entities.map(e => e.mythology))];

                universal.push({
                    id: archetypeId,
                    name: archetype.name,
                    description: archetype.description,
                    mythologyCount: mythologies.length,
                    mythologies: mythologies,
                    entityCount: entities.length,
                    examples: archetype.examples
                });
            }
        }

        return universal.sort((a, b) => b.mythologyCount - a.mythologyCount);
    }

    /**
     * Discover new archetypes through clustering
     * Analyzes entities to find common patterns not yet defined
     */
    async discoverNewArchetypes(options = {}) {
        // This is a simplified version - full implementation would use ML clustering

        const collections = options.collections || ['deities', 'heroes'];
        const entities = [];

        // Collect entities
        for (const collection of collections) {
            try {
                const snapshot = await this.db.collection(collection)
                    .limit(options.limit || 200)
                    .get();

                snapshot.docs.forEach(doc => {
                    entities.push({ id: doc.id, collection, ...doc.data() });
                });
            } catch (error) {
                console.error(`Error fetching ${collection}:`, error);
            }
        }

        // Analyze patterns
        const patterns = this.analyzeEntityPatterns(entities);

        return patterns;
    }

    /**
     * Analyze entity patterns
     */
    analyzeEntityPatterns(entities) {
        const domainClusters = {};
        const attributeClusters = {};

        entities.forEach(entity => {
            // Cluster by domains
            (entity.domains || []).forEach(domain => {
                if (!domainClusters[domain]) {
                    domainClusters[domain] = [];
                }
                domainClusters[domain].push(entity);
            });

            // Cluster by attributes
            (entity.attributes || []).forEach(attr => {
                if (!attributeClusters[attr]) {
                    attributeClusters[attr] = [];
                }
                attributeClusters[attr].push(entity);
            });
        });

        // Find significant clusters
        const patterns = [];

        for (const [domain, entities] of Object.entries(domainClusters)) {
            if (entities.length >= 3) {
                const mythologies = [...new Set(entities.map(e => e.mythology))];

                if (mythologies.length >= 2) {
                    patterns.push({
                        type: 'domain-based',
                        name: `${domain} Deity Pattern`,
                        domain: domain,
                        entityCount: entities.length,
                        mythologies: mythologies,
                        examples: entities.slice(0, 5).map(e => ({ id: e.id, name: e.name }))
                    });
                }
            }
        }

        return patterns.sort((a, b) => b.entityCount - a.entityCount);
    }

    /**
     * Compare archetype distributions across mythologies
     */
    async compareArchetypeDistributions(mythologies) {
        const distributions = {};

        for (const mythology of mythologies) {
            const archetypes = await this.findArchetypesByMythology(mythology);
            distributions[mythology] = archetypes;
        }

        return {
            mythologies: mythologies,
            distributions: distributions,
            analysis: this.analyzeDistributions(distributions)
        };
    }

    /**
     * Analyze archetype distributions
     */
    analyzeDistributions(distributions) {
        const analysis = {
            sharedArchetypes: [],
            uniqueArchetypes: {},
            dominantArchetypes: {}
        };

        // Find shared archetypes
        const mythologies = Object.keys(distributions);
        const allArchetypeIds = new Set();

        mythologies.forEach(myth => {
            distributions[myth].forEach(arch => allArchetypeIds.add(arch.id));
        });

        allArchetypeIds.forEach(archetypeId => {
            const presentIn = mythologies.filter(myth =>
                distributions[myth].some(a => a.id === archetypeId)
            );

            if (presentIn.length === mythologies.length) {
                analysis.sharedArchetypes.push(archetypeId);
            } else if (presentIn.length === 1) {
                const myth = presentIn[0];
                if (!analysis.uniqueArchetypes[myth]) {
                    analysis.uniqueArchetypes[myth] = [];
                }
                analysis.uniqueArchetypes[myth].push(archetypeId);
            }
        });

        // Find dominant archetype in each mythology
        mythologies.forEach(myth => {
            if (distributions[myth].length > 0) {
                analysis.dominantArchetypes[myth] = distributions[myth][0];
            }
        });

        return analysis;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArchetypeFinder;
}
