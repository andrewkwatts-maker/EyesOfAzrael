/**
 * Cross-Mythology Comparison Engine
 * Enables deep comparison of entities, archetypes, and symbols across different mythological traditions
 *
 * Features:
 * - Side-by-side entity comparison
 * - Archetype pattern matching
 * - Symbol analysis across cultures
 * - Cultural diffusion tracking
 * - Parallel mythology navigation
 */

class MythologyComparisons {
    constructor() {
        this.db = firebase.firestore();
        this.cache = new Map();

        // Archetype definitions with pattern matching
        this.archetypes = {
            'sky-father': {
                name: 'Sky Father',
                description: 'Supreme male deity associated with sky, thunder, and kingship',
                attributes: ['sky', 'thunder', 'lightning', 'king', 'father', 'ruler', 'supreme'],
                domains: ['sky', 'weather', 'leadership', 'justice'],
                symbols: ['lightning bolt', 'eagle', 'oak', 'throne'],
                examples: {
                    greek: 'zeus',
                    norse: 'odin',
                    roman: 'jupiter',
                    hindu: 'indra',
                    egyptian: 'amon-ra'
                }
            },
            'earth-mother': {
                name: 'Earth Mother',
                description: 'Primordial female deity associated with earth, fertility, and creation',
                attributes: ['earth', 'mother', 'fertility', 'nature', 'creation', 'life', 'nurture'],
                domains: ['earth', 'fertility', 'agriculture', 'motherhood'],
                symbols: ['cornucopia', 'grain', 'serpent', 'cave'],
                examples: {
                    greek: 'gaia',
                    norse: 'frigg',
                    roman: 'terra',
                    hindu: 'prithvi',
                    egyptian: 'nut'
                }
            },
            'trickster': {
                name: 'Trickster',
                description: 'Cunning deity or spirit who breaks rules and conventions',
                attributes: ['cunning', 'mischief', 'clever', 'shapeshifter', 'deceit', 'wit', 'chaos'],
                domains: ['trickery', 'cunning', 'transformation', 'chaos'],
                symbols: ['mask', 'staff', 'fox', 'raven'],
                examples: {
                    norse: 'loki',
                    greek: 'hermes',
                    celtic: 'anansi',
                    native_american: 'coyote',
                    egyptian: 'set'
                }
            },
            'war-god': {
                name: 'War God',
                description: 'Deity of battle, conflict, and martial prowess',
                attributes: ['war', 'battle', 'warrior', 'strength', 'combat', 'violence', 'courage'],
                domains: ['war', 'battle', 'combat', 'strategy'],
                symbols: ['sword', 'spear', 'shield', 'helmet'],
                examples: {
                    greek: 'ares',
                    roman: 'mars',
                    norse: 'tyr',
                    aztec: 'huitzilopochtli',
                    hindu: 'kartikeya'
                }
            },
            'underworld-ruler': {
                name: 'Underworld Ruler',
                description: 'Lord or lady of the dead and the afterlife',
                attributes: ['death', 'underworld', 'afterlife', 'dead', 'souls', 'judgment', 'darkness'],
                domains: ['death', 'underworld', 'afterlife', 'judgment'],
                symbols: ['skull', 'gate', 'river', 'dog'],
                examples: {
                    greek: 'hades',
                    egyptian: 'osiris',
                    norse: 'hel',
                    hindu: 'yama',
                    aztec: 'mictlantecuhtli'
                }
            },
            'love-goddess': {
                name: 'Love Goddess',
                description: 'Deity of love, beauty, and desire',
                attributes: ['love', 'beauty', 'desire', 'passion', 'romance', 'attraction', 'pleasure'],
                domains: ['love', 'beauty', 'desire', 'sexuality'],
                symbols: ['rose', 'dove', 'mirror', 'shell'],
                examples: {
                    greek: 'aphrodite',
                    roman: 'venus',
                    norse: 'freyja',
                    hindu: 'rati',
                    mesopotamian: 'ishtar'
                }
            },
            'sun-deity': {
                name: 'Sun Deity',
                description: 'God or goddess of the sun and solar power',
                attributes: ['sun', 'light', 'day', 'solar', 'radiance', 'illumination', 'heat'],
                domains: ['sun', 'light', 'day', 'time'],
                symbols: ['sun disk', 'chariot', 'rays', 'gold'],
                examples: {
                    greek: 'helios',
                    egyptian: 'ra',
                    norse: 'sol',
                    hindu: 'surya',
                    aztec: 'tonatiuh'
                }
            },
            'wisdom-deity': {
                name: 'Wisdom Deity',
                description: 'God or goddess of wisdom, knowledge, and learning',
                attributes: ['wisdom', 'knowledge', 'learning', 'intelligence', 'craft', 'strategy', 'skill'],
                domains: ['wisdom', 'knowledge', 'crafts', 'strategy'],
                symbols: ['owl', 'book', 'staff', 'serpent'],
                examples: {
                    greek: 'athena',
                    norse: 'odin',
                    egyptian: 'thoth',
                    hindu: 'saraswati',
                    mesopotamian: 'nabu'
                }
            },
            'hero-journey': {
                name: 'Hero\'s Journey',
                description: 'Mortal or demigod who undergoes transformative quest',
                attributes: ['hero', 'quest', 'journey', 'trial', 'transformation', 'courage', 'destiny'],
                domains: ['heroism', 'adventure', 'trial', 'destiny'],
                symbols: ['sword', 'path', 'mountain', 'treasure'],
                examples: {
                    greek: 'heracles',
                    mesopotamian: 'gilgamesh',
                    celtic: 'cu-chulainn',
                    hindu: 'rama',
                    norse: 'sigurd'
                }
            }
        };

        // Symbol mappings across cultures
        this.symbols = {
            'lightning': {
                symbolism: 'Divine power, authority, sudden illumination',
                cultures: {
                    greek: { deity: 'zeus', meaning: 'Supreme authority' },
                    norse: { deity: 'thor', meaning: 'Protection and strength' },
                    hindu: { deity: 'indra', meaning: 'Warrior power' },
                    roman: { deity: 'jupiter', meaning: 'Imperial authority' }
                }
            },
            'serpent': {
                symbolism: 'Wisdom, rebirth, danger, transformation',
                cultures: {
                    greek: { deity: 'asclepius', meaning: 'Healing and medicine' },
                    egyptian: { deity: 'wadjet', meaning: 'Protection and royalty' },
                    hindu: { deity: 'shiva', meaning: 'Cosmic power' },
                    aztec: { deity: 'quetzalcoatl', meaning: 'Divine wisdom' },
                    norse: { deity: 'jormungandr', meaning: 'Cosmic threat' }
                }
            },
            'sacred-tree': {
                symbolism: 'Cosmic axis, life, connection between realms',
                cultures: {
                    norse: { name: 'yggdrasil', meaning: 'World tree connecting nine realms' },
                    christian: { name: 'tree-of-knowledge', meaning: 'Knowledge and temptation' },
                    hindu: { name: 'kalpavriksha', meaning: 'Wish-fulfilling divine tree' },
                    celtic: { name: 'bile', meaning: 'Sacred connection to ancestors' }
                }
            },
            'sacred-waters': {
                symbolism: 'Primordial chaos, life source, purification',
                cultures: {
                    mesopotamian: { name: 'abzu', meaning: 'Primordial fresh waters' },
                    hindu: { name: 'ganges', meaning: 'Sacred purification' },
                    egyptian: { name: 'nun', meaning: 'Primordial waters of creation' },
                    greek: { name: 'styx', meaning: 'Boundary between worlds' }
                }
            },
            'eagle': {
                symbolism: 'Divine messenger, sky power, vision',
                cultures: {
                    greek: { deity: 'zeus', meaning: 'Divine messenger and authority' },
                    aztec: { deity: 'huitzilopochtli', meaning: 'Solar warrior power' },
                    native_american: { meaning: 'Great Spirit connection' },
                    roman: { meaning: 'Imperial power' }
                }
            }
        };

        // Indo-European linguistic connections
        this.etymologyConnections = {
            'dyeus': {
                meaning: 'Sky father',
                derivatives: {
                    greek: 'zeus',
                    latin: 'jupiter',
                    sanskrit: 'dyaus-pita',
                    norse: 'tyr'
                }
            },
            'mater': {
                meaning: 'Mother',
                derivatives: {
                    latin: 'mater',
                    greek: 'meter',
                    sanskrit: 'matr',
                    old_english: 'modor'
                }
            }
        };
    }

    /**
     * Compare multiple entities side-by-side
     * @param {Array<string>} entityIds - Array of entity IDs to compare
     * @returns {Object} Comparison data
     */
    async compareEntities(entityIds) {
        if (entityIds.length < 2 || entityIds.length > 4) {
            throw new Error('Can compare 2-4 entities at a time');
        }

        const entities = [];

        // Fetch all entities
        for (const id of entityIds) {
            const entity = await this.fetchEntity(id);
            if (entity) {
                entities.push(entity);
            }
        }

        if (entities.length < 2) {
            throw new Error('At least 2 valid entities required for comparison');
        }

        // Build comparison matrix
        const comparison = {
            entities: entities,
            fields: this.compareFields(entities),
            similarities: this.findSimilarities(entities),
            differences: this.findDifferences(entities),
            culturalContext: this.analyzeCulturalContext(entities),
            archetypes: this.identifySharedArchetypes(entities),
            symbols: this.compareSymbols(entities),
            relationships: await this.findRelationships(entities)
        };

        return comparison;
    }

    /**
     * Fetch entity from Firestore (with caching)
     */
    async fetchEntity(id) {
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }

        // Try multiple collections
        const collections = ['deities', 'heroes', 'creatures', 'places', 'concepts'];

        for (const collection of collections) {
            try {
                const doc = await this.db.collection(collection).doc(id).get();
                if (doc.exists) {
                    const entity = { id: doc.id, collection, ...doc.data() };
                    this.cache.set(id, entity);
                    return entity;
                }
            } catch (error) {
                console.error(`Error fetching from ${collection}:`, error);
            }
        }

        return null;
    }

    /**
     * Compare fields across entities
     */
    compareFields(entities) {
        const fields = {};
        const allFields = new Set();

        // Collect all unique fields
        entities.forEach(entity => {
            Object.keys(entity).forEach(key => allFields.add(key));
        });

        // Build field comparison
        allFields.forEach(field => {
            if (field === 'id' || field === 'collection') return;

            fields[field] = {
                values: entities.map(e => e[field]),
                aligned: this.areValuesComparable(entities.map(e => e[field]))
            };
        });

        return fields;
    }

    /**
     * Check if values are comparable
     */
    areValuesComparable(values) {
        const types = values.map(v => typeof v);
        const uniqueTypes = [...new Set(types)];
        return uniqueTypes.length === 1;
    }

    /**
     * Find similarities between entities
     */
    findSimilarities(entities) {
        const similarities = [];

        // Compare domains
        const sharedDomains = this.findSharedArray(entities, 'domains');
        if (sharedDomains.length > 0) {
            similarities.push({
                type: 'domains',
                values: sharedDomains,
                description: 'Shared areas of divine influence'
            });
        }

        // Compare attributes
        const sharedAttributes = this.findSharedArray(entities, 'attributes');
        if (sharedAttributes.length > 0) {
            similarities.push({
                type: 'attributes',
                values: sharedAttributes,
                description: 'Common characteristics'
            });
        }

        // Compare symbols
        const sharedSymbols = this.findSharedArray(entities, 'symbols');
        if (sharedSymbols.length > 0) {
            similarities.push({
                type: 'symbols',
                values: sharedSymbols,
                description: 'Shared sacred symbols'
            });
        }

        // Compare roles
        const roles = entities.map(e => e.role).filter(Boolean);
        if (roles.length > 1 && roles.every(r => r === roles[0])) {
            similarities.push({
                type: 'role',
                values: [roles[0]],
                description: 'Same mythological role'
            });
        }

        return similarities;
    }

    /**
     * Find shared values in array fields
     */
    findSharedArray(entities, field) {
        const arrays = entities
            .map(e => e[field])
            .filter(arr => Array.isArray(arr));

        if (arrays.length < 2) return [];

        // Find intersection of all arrays
        return arrays.reduce((shared, current) =>
            shared.filter(value => current.includes(value))
        );
    }

    /**
     * Find differences between entities
     */
    findDifferences(entities) {
        const differences = [];

        // Compare mythologies
        const mythologies = [...new Set(entities.map(e => e.mythology))];
        if (mythologies.length > 1) {
            differences.push({
                type: 'mythology',
                values: mythologies,
                description: 'Different cultural traditions'
            });
        }

        // Compare unique attributes
        entities.forEach((entity, idx) => {
            const otherEntities = entities.filter((_, i) => i !== idx);
            const uniqueAttributes = (entity.attributes || []).filter(attr =>
                !otherEntities.some(other => (other.attributes || []).includes(attr))
            );

            if (uniqueAttributes.length > 0) {
                differences.push({
                    type: 'unique_attributes',
                    entity: entity.name,
                    values: uniqueAttributes,
                    description: `Unique to ${entity.name}`
                });
            }
        });

        return differences;
    }

    /**
     * Analyze cultural context
     */
    analyzeCulturalContext(entities) {
        const contexts = entities.map(entity => ({
            entity: entity.name,
            mythology: entity.mythology,
            culture: entity.culture || entity.mythology,
            period: entity.period || entity.historicalPeriod,
            geography: entity.geography || entity.region,
            sources: entity.sources || []
        }));

        return {
            contexts: contexts,
            timeSpan: this.analyzeTimePeriod(contexts),
            geographicSpread: this.analyzeGeography(contexts),
            culturalConnections: this.findCulturalConnections(contexts)
        };
    }

    /**
     * Analyze time periods
     */
    analyzeTimePeriod(contexts) {
        const periods = contexts.map(c => c.period).filter(Boolean);
        return {
            periods: [...new Set(periods)],
            span: periods.length > 1 ? 'Multiple time periods' : 'Same period'
        };
    }

    /**
     * Analyze geographic distribution
     */
    analyzeGeography(contexts) {
        const regions = contexts.map(c => c.geography).filter(Boolean);
        return {
            regions: [...new Set(regions)],
            spread: regions.length > 1 ? 'Wide geographic distribution' : 'Same region'
        };
    }

    /**
     * Find cultural connections
     */
    findCulturalConnections(contexts) {
        const connections = [];

        // Check for Indo-European connections
        const indoEuropean = ['greek', 'roman', 'norse', 'hindu', 'celtic'];
        const mythologies = contexts.map(c => c.mythology);

        if (mythologies.filter(m => indoEuropean.includes(m)).length > 1) {
            connections.push({
                type: 'Indo-European',
                description: 'Shared Indo-European cultural heritage',
                mythologies: mythologies.filter(m => indoEuropean.includes(m))
            });
        }

        // Check for geographic proximity
        const mediterranean = ['greek', 'roman', 'egyptian'];
        if (mythologies.filter(m => mediterranean.includes(m)).length > 1) {
            connections.push({
                type: 'Mediterranean',
                description: 'Mediterranean cultural exchange',
                mythologies: mythologies.filter(m => mediterranean.includes(m))
            });
        }

        return connections;
    }

    /**
     * Identify shared archetypes
     */
    identifySharedArchetypes(entities) {
        const matches = [];

        for (const [archetypeId, archetype] of Object.entries(this.archetypes)) {
            const matchingEntities = entities.filter(entity =>
                this.matchesArchetype(entity, archetype)
            );

            if (matchingEntities.length > 1) {
                matches.push({
                    archetype: archetype.name,
                    id: archetypeId,
                    description: archetype.description,
                    matchingEntities: matchingEntities.map(e => e.name),
                    score: this.calculateArchetypeScore(matchingEntities, archetype)
                });
            }
        }

        return matches.sort((a, b) => b.score - a.score);
    }

    /**
     * Check if entity matches archetype
     */
    matchesArchetype(entity, archetype) {
        const entityText = [
            entity.name,
            entity.title,
            entity.description,
            ...(entity.domains || []),
            ...(entity.attributes || []),
            ...(entity.symbols || [])
        ].join(' ').toLowerCase();

        const archetypeTerms = [
            ...archetype.attributes,
            ...archetype.domains,
            ...archetype.symbols
        ];

        const matches = archetypeTerms.filter(term =>
            entityText.includes(term.toLowerCase())
        );

        return matches.length >= 3; // At least 3 matching terms
    }

    /**
     * Calculate archetype match score
     */
    calculateArchetypeScore(entities, archetype) {
        let totalScore = 0;

        entities.forEach(entity => {
            const entityText = [
                entity.name,
                entity.title,
                entity.description,
                ...(entity.domains || []),
                ...(entity.attributes || []),
                ...(entity.symbols || [])
            ].join(' ').toLowerCase();

            const archetypeTerms = [
                ...archetype.attributes,
                ...archetype.domains,
                ...archetype.symbols
            ];

            const matches = archetypeTerms.filter(term =>
                entityText.includes(term.toLowerCase())
            );

            totalScore += matches.length;
        });

        return totalScore / entities.length;
    }

    /**
     * Compare symbols across entities
     */
    compareSymbols(entities) {
        const symbolComparisons = [];

        entities.forEach(entity => {
            (entity.symbols || []).forEach(symbol => {
                const symbolKey = symbol.toLowerCase().replace(/\s+/g, '-');
                const symbolData = this.symbols[symbolKey];

                if (symbolData) {
                    symbolComparisons.push({
                        symbol: symbol,
                        entity: entity.name,
                        mythology: entity.mythology,
                        symbolism: symbolData.symbolism,
                        crossCulturalMeaning: symbolData.cultures[entity.mythology]
                    });
                }
            });
        });

        return symbolComparisons;
    }

    /**
     * Find relationships between entities
     */
    async findRelationships(entities) {
        const relationships = [];

        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entity1 = entities[i];
                const entity2 = entities[j];

                // Check cross-references
                if (entity1.relatedEntities) {
                    if (entity1.relatedEntities.includes(entity2.id)) {
                        relationships.push({
                            from: entity1.name,
                            to: entity2.name,
                            type: 'direct',
                            description: 'Directly cross-referenced'
                        });
                    }
                }

                // Check shared relationships
                const shared = await this.findSharedRelationships(entity1, entity2);
                if (shared.length > 0) {
                    relationships.push({
                        from: entity1.name,
                        to: entity2.name,
                        type: 'shared',
                        description: `Share ${shared.length} related entities`,
                        shared: shared
                    });
                }
            }
        }

        return relationships;
    }

    /**
     * Find shared relationships between two entities
     */
    async findSharedRelationships(entity1, entity2) {
        const related1 = entity1.relatedEntities || [];
        const related2 = entity2.relatedEntities || [];

        return related1.filter(id => related2.includes(id));
    }

    /**
     * Find entities matching an archetype
     * @param {string} archetypeId - Archetype identifier
     * @returns {Array} Matching entities across mythologies
     */
    async findEntitiesByArchetype(archetypeId) {
        const archetype = this.archetypes[archetypeId];
        if (!archetype) {
            throw new Error('Unknown archetype');
        }

        const results = [];
        const collections = ['deities', 'heroes', 'creatures'];

        for (const collection of collections) {
            try {
                const snapshot = await this.db.collection(collection).get();

                snapshot.docs.forEach(doc => {
                    const entity = { id: doc.id, collection, ...doc.data() };
                    if (this.matchesArchetype(entity, archetype)) {
                        results.push({
                            ...entity,
                            archetypeScore: this.calculateArchetypeScore([entity], archetype)
                        });
                    }
                });
            } catch (error) {
                console.error(`Error searching ${collection}:`, error);
            }
        }

        return results.sort((a, b) => b.archetypeScore - a.archetypeScore);
    }

    /**
     * Find parallel entities across mythologies
     * Given an entity, find its equivalents in other mythologies
     */
    async findParallelEntities(entityId) {
        const entity = await this.fetchEntity(entityId);
        if (!entity) {
            throw new Error('Entity not found');
        }

        // Identify archetypes
        const matchedArchetypes = [];
        for (const [archetypeId, archetype] of Object.entries(this.archetypes)) {
            if (this.matchesArchetype(entity, archetype)) {
                matchedArchetypes.push(archetypeId);
            }
        }

        if (matchedArchetypes.length === 0) {
            return [];
        }

        // Find entities matching the same archetypes in other mythologies
        const parallels = [];
        for (const archetypeId of matchedArchetypes) {
            const matches = await this.findEntitiesByArchetype(archetypeId);

            // Filter out same mythology
            const otherMythologies = matches.filter(m =>
                m.mythology !== entity.mythology && m.id !== entity.id
            );

            parallels.push(...otherMythologies);
        }

        // Remove duplicates and sort by score
        const uniqueParallels = Array.from(
            new Map(parallels.map(p => [p.id, p])).values()
        );

        return uniqueParallels.slice(0, 10); // Top 10 parallels
    }

    /**
     * Analyze symbol across cultures
     */
    analyzeSymbol(symbolKey) {
        const symbolData = this.symbols[symbolKey];
        if (!symbolData) {
            return null;
        }

        return {
            symbol: symbolKey,
            symbolism: symbolData.symbolism,
            cultures: symbolData.cultures,
            universalMeaning: this.extractUniversalMeaning(symbolData)
        };
    }

    /**
     * Extract universal meaning from symbol data
     */
    extractUniversalMeaning(symbolData) {
        const meanings = Object.values(symbolData.cultures).map(c => c.meaning);

        // Simple analysis - could be enhanced with NLP
        const commonWords = this.findCommonWords(meanings);

        return {
            commonThemes: commonWords,
            interpretation: symbolData.symbolism
        };
    }

    /**
     * Find common words in meanings
     */
    findCommonWords(meanings) {
        const wordCounts = {};
        const stopWords = ['the', 'and', 'of', 'in', 'to', 'a', 'is'];

        meanings.forEach(meaning => {
            const words = meaning.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (!stopWords.includes(word) && word.length > 3) {
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                }
            });
        });

        return Object.entries(wordCounts)
            .filter(([word, count]) => count > 1)
            .map(([word]) => word);
    }

    /**
     * Track cultural diffusion paths
     */
    async trackCulturalDiffusion(mythology) {
        // This would require historical data about trade routes,
        // cultural exchanges, and linguistic connections

        const connections = {
            mythology: mythology,
            tradeRoutes: [],
            linguisticConnections: [],
            historicalExchanges: []
        };

        // Example: Greek to Roman
        if (mythology === 'greek') {
            connections.tradeRoutes.push('Mediterranean Sea trade');
            connections.historicalExchanges.push({
                target: 'roman',
                period: '200 BCE - 400 CE',
                mechanism: 'Cultural adoption and syncretism'
            });
        }

        // Example: Indo-European connections
        const indoEuropean = ['greek', 'roman', 'norse', 'hindu', 'celtic'];
        if (indoEuropean.includes(mythology)) {
            connections.linguisticConnections.push({
                family: 'Indo-European',
                evidence: 'Shared root words and deity names',
                examples: this.etymologyConnections
            });
        }

        return connections;
    }

    /**
     * Get all archetype definitions
     */
    getArchetypes() {
        return this.archetypes;
    }

    /**
     * Get all symbol definitions
     */
    getSymbols() {
        return this.symbols;
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
    module.exports = MythologyComparisons;
}
