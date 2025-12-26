/**
 * Corpus Search Component
 *
 * Provides comprehensive search across:
 * - Language metadata (original scripts, transliterations, variants)
 * - Source metadata (primary texts, citations, archaeological evidence)
 * - Generic full-text search across all entity fields and metadata
 * - Cross-cultural comparisons and parallels
 */

class CorpusSearch {
    constructor(firestoreInstance) {
        this.db = firestoreInstance;
        this.searchCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes

        // Searchable collections
        this.collections = [
            'deities', 'heroes', 'creatures', 'cosmology',
            'texts', 'rituals', 'herbs', 'symbols',
            'magic', 'path', 'places', 'items',
            'concepts', 'events', 'figures', 'beings',
            'angels', 'teachings'
        ];
    }

    /**
     * Main search method - supports multiple search modes
     */
    async search(query, options = {}) {
        const {
            mode = 'generic',           // generic, language, source, term, advanced
            mythology = null,           // Filter by mythology
            entityType = null,          // Filter by entity type
            language = null,            // Search in specific language
            limit = 50,
            offset = 0,
            sortBy = 'relevance'        // relevance, importance, popularity, name
        } = options;

        const cacheKey = this.getCacheKey(query, options);
        if (this.searchCache.has(cacheKey)) {
            const cached = this.searchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.results;
            }
        }

        let results;
        switch (mode) {
            case 'language':
                results = await this.searchByLanguage(query, options);
                break;
            case 'source':
                results = await this.searchBySources(query, options);
                break;
            case 'term':
                results = await this.searchByCorpusTerm(query, options);
                break;
            case 'advanced':
                results = await this.advancedSearch(query, options);
                break;
            default:
                results = await this.genericSearch(query, options);
        }

        // Sort results
        results = this.sortResults(results, sortBy);

        // Paginate
        const paginated = results.slice(offset, offset + limit);

        // Cache results
        this.searchCache.set(cacheKey, {
            results: { items: paginated, total: results.length },
            timestamp: Date.now()
        });

        return { items: paginated, total: results.length };
    }

    /**
     * Generic full-text search across all metadata
     */
    async genericSearch(query, options = {}) {
        const { mythology, entityType } = options;
        const searchTerms = this.tokenize(query.toLowerCase());
        const results = [];

        for (const collection of this.collections) {
            if (entityType && collection !== entityType) continue;

            let queryRef = this.db.collection(collection);

            if (mythology) {
                queryRef = queryRef.where('mythology', '==', mythology);
            }

            const snapshot = await queryRef.get();

            snapshot.forEach(doc => {
                const entity = doc.data();
                const score = this.calculateGenericScore(entity, searchTerms);

                if (score > 0) {
                    results.push({
                        ...entity,
                        _searchScore: score,
                        _matchedFields: this.getMatchedFields(entity, searchTerms)
                    });
                }
            });
        }

        return results;
    }

    /**
     * Search by language metadata (original scripts, transliterations, variants)
     */
    async searchByLanguage(query, options = {}) {
        const { mythology, language } = options;
        const results = [];

        for (const collection of this.collections) {
            const snapshot = await this.db.collection(collection).get();

            snapshot.forEach(doc => {
                const entity = doc.data();

                // Skip if mythology filter doesn't match
                if (mythology && entity.mythology !== mythology) return;

                const langData = entity.languages || {};
                const score = this.calculateLanguageScore(langData, query, language);

                if (score > 0) {
                    results.push({
                        ...entity,
                        _searchScore: score,
                        _matchedLanguage: this.getMatchedLanguage(langData, query, language)
                    });
                }
            });
        }

        return results;
    }

    /**
     * Search by source metadata (texts, citations, archaeological evidence)
     */
    async searchBySources(query, options = {}) {
        const { mythology } = options;
        const results = [];
        const searchTerms = this.tokenize(query.toLowerCase());

        for (const collection of this.collections) {
            const snapshot = await this.db.collection(collection).get();

            snapshot.forEach(doc => {
                const entity = doc.data();

                if (mythology && entity.mythology !== mythology) return;

                const sources = entity.sources || {};
                const score = this.calculateSourceScore(sources, searchTerms);

                if (score > 0) {
                    results.push({
                        ...entity,
                        _searchScore: score,
                        _matchedSources: this.getMatchedSources(sources, searchTerms)
                    });
                }
            });
        }

        return results;
    }

    /**
     * Search by corpus terms (epithets, domains, symbols, places, concepts)
     */
    async searchByCorpusTerm(query, options = {}) {
        const { mythology } = options;
        const results = [];
        const searchTerm = query.toLowerCase().trim();

        for (const collection of this.collections) {
            const snapshot = await this.db.collection(collection).get();

            snapshot.forEach(doc => {
                const entity = doc.data();

                if (mythology && entity.mythology !== mythology) return;

                const corpus = entity.corpusSearch || {};
                const score = this.calculateCorpusScore(corpus, searchTerm);

                if (score > 0) {
                    results.push({
                        ...entity,
                        _searchScore: score,
                        _matchedTerms: this.getMatchedCorpusTerms(corpus, searchTerm)
                    });
                }
            });
        }

        return results;
    }

    /**
     * Advanced search with multiple criteria
     */
    async advancedSearch(criteria, options = {}) {
        const {
            text,              // Text query
            domains = [],      // Domain filters
            symbols = [],      // Symbol filters
            dateRange = null,  // Timeline filter {start, end}
            hasImage = null,   // Boolean filter
            importance = null  // {min, max}
        } = criteria;

        let results = [];

        // Start with text search if provided
        if (text) {
            results = await this.genericSearch(text, options);
        } else {
            // Get all entities
            for (const collection of this.collections) {
                const snapshot = await this.db.collection(collection).get();
                snapshot.forEach(doc => {
                    results.push({ ...doc.data(), _searchScore: 50 });
                });
            }
        }

        // Apply filters
        results = results.filter(entity => {
            // Domain filter
            if (domains.length > 0) {
                const entityDomains = entity.deity?.domains || entity.corpusSearch?.domains || [];
                if (!domains.some(d => entityDomains.includes(d))) return false;
            }

            // Symbol filter
            if (symbols.length > 0) {
                const entitySymbols = entity.deity?.symbols || entity.corpusSearch?.symbols || [];
                if (!symbols.some(s => entitySymbols.includes(s))) return false;
            }

            // Date range filter
            if (dateRange) {
                const timeline = entity.timeline?.dateRange;
                if (!timeline) return false;
                if (timeline.start > dateRange.end || timeline.end < dateRange.start) return false;
            }

            // Image filter
            if (hasImage !== null) {
                const hasImg = !!(entity.image || entity.gridDisplay?.image);
                if (hasImg !== hasImage) return false;
            }

            // Importance filter
            if (importance) {
                const imp = entity.importance || 50;
                if (imp < importance.min || imp > importance.max) return false;
            }

            return true;
        });

        return results;
    }

    /**
     * Calculate generic search score across all entity fields
     */
    calculateGenericScore(entity, searchTerms) {
        let score = 0;
        const text = JSON.stringify(entity).toLowerCase();

        searchTerms.forEach(term => {
            // Exact matches in key fields (higher weight)
            if (entity.name?.toLowerCase().includes(term)) score += 50;
            if (entity.description?.toLowerCase().includes(term)) score += 30;
            if (entity.subtitle?.toLowerCase().includes(term)) score += 20;

            // Search terms array
            const entitySearchTerms = entity.searchTerms || [];
            if (entitySearchTerms.some(st => st.toLowerCase().includes(term))) score += 40;

            // Tags
            const tags = entity.tags || [];
            if (tags.some(tag => tag.toLowerCase().includes(term))) score += 35;

            // Generic text match (lower weight)
            const matches = (text.match(new RegExp(term, 'gi')) || []).length;
            score += matches * 5;
        });

        return score;
    }

    /**
     * Calculate language-specific search score
     */
    calculateLanguageScore(languages, query, targetLanguage = null) {
        let score = 0;
        const q = query.toLowerCase();

        // Original name match
        if (languages.originalName?.toLowerCase().includes(q)) score += 100;

        // Transliteration match
        if (languages.transliteration?.toLowerCase().includes(q)) score += 80;

        // Alternate names
        const alternates = languages.alternateNames || {};
        Object.entries(alternates).forEach(([lang, name]) => {
            if (targetLanguage && lang !== targetLanguage) return;
            if (name.toLowerCase().includes(q)) {
                score += targetLanguage ? 90 : 60;
            }
        });

        // Variant spellings
        const variants = languages.variants || [];
        variants.forEach(variant => {
            if (variant.toLowerCase() === q) score += 70;
            else if (variant.toLowerCase().includes(q)) score += 50;
        });

        return score;
    }

    /**
     * Calculate source-based search score
     */
    calculateSourceScore(sources, searchTerms) {
        let score = 0;
        const sourceText = JSON.stringify(sources).toLowerCase();

        searchTerms.forEach(term => {
            // Primary texts
            (sources.primaryTexts || []).forEach(text => {
                if (text.title?.toLowerCase().includes(term)) score += 40;
                if (text.author?.toLowerCase().includes(term)) score += 35;
                if (text.citations?.some(c => c.toLowerCase().includes(term))) score += 25;
            });

            // Secondary sources
            (sources.secondarySources || []).forEach(source => {
                if (source.title?.toLowerCase().includes(term)) score += 30;
                if (source.author?.toLowerCase().includes(term)) score += 25;
            });

            // Archaeological evidence
            (sources.archeologicalEvidence || []).forEach(evidence => {
                if (evidence.name?.toLowerCase().includes(term)) score += 20;
                if (evidence.location?.toLowerCase().includes(term)) score += 15;
            });

            // Generic source text matches
            const matches = (sourceText.match(new RegExp(term, 'gi')) || []).length;
            score += matches * 5;
        });

        return score;
    }

    /**
     * Calculate corpus term search score
     */
    calculateCorpusScore(corpus, searchTerm) {
        let score = 0;

        // Canonical name exact match
        if (corpus.canonical === searchTerm) score += 100;
        else if (corpus.canonical?.includes(searchTerm)) score += 80;

        // Variants
        (corpus.variants || []).forEach(variant => {
            if (variant === searchTerm) score += 90;
            else if (variant.includes(searchTerm)) score += 70;
        });

        // Epithets
        (corpus.epithets || []).forEach(epithet => {
            if (epithet.includes(searchTerm)) score += 60;
        });

        // Domains
        (corpus.domains || []).forEach(domain => {
            if (domain.includes(searchTerm)) score += 50;
        });

        // Symbols
        (corpus.symbols || []).forEach(symbol => {
            if (symbol.includes(searchTerm)) score += 45;
        });

        // Places
        (corpus.places || []).forEach(place => {
            if (place.includes(searchTerm)) score += 40;
        });

        // Concepts
        (corpus.concepts || []).forEach(concept => {
            if (concept.includes(searchTerm)) score += 35;
        });

        return score;
    }

    /**
     * Get matched fields for highlighting
     */
    getMatchedFields(entity, searchTerms) {
        const matched = [];
        const text = JSON.stringify(entity).toLowerCase();

        if (searchTerms.some(t => entity.name?.toLowerCase().includes(t))) {
            matched.push('name');
        }
        if (searchTerms.some(t => entity.description?.toLowerCase().includes(t))) {
            matched.push('description');
        }
        if (searchTerms.some(t => entity.subtitle?.toLowerCase().includes(t))) {
            matched.push('subtitle');
        }

        return matched;
    }

    /**
     * Get matched language data
     */
    getMatchedLanguage(languages, query, targetLanguage) {
        const q = query.toLowerCase();
        const matched = {};

        if (languages.originalName?.toLowerCase().includes(q)) {
            matched.originalName = languages.originalName;
        }
        if (languages.transliteration?.toLowerCase().includes(q)) {
            matched.transliteration = languages.transliteration;
        }

        const alternates = languages.alternateNames || {};
        Object.entries(alternates).forEach(([lang, name]) => {
            if (name.toLowerCase().includes(q)) {
                matched[lang] = name;
            }
        });

        return matched;
    }

    /**
     * Get matched sources
     */
    getMatchedSources(sources, searchTerms) {
        const matched = {
            primaryTexts: [],
            secondarySources: [],
            archeologicalEvidence: []
        };

        const matchesTerms = (text) => {
            return searchTerms.some(term => text?.toLowerCase().includes(term));
        };

        (sources.primaryTexts || []).forEach(text => {
            if (matchesTerms(text.title) || matchesTerms(text.author)) {
                matched.primaryTexts.push(text);
            }
        });

        (sources.secondarySources || []).forEach(source => {
            if (matchesTerms(source.title) || matchesTerms(source.author)) {
                matched.secondarySources.push(source);
            }
        });

        (sources.archeologicalEvidence || []).forEach(evidence => {
            if (matchesTerms(evidence.name) || matchesTerms(evidence.location)) {
                matched.archeologicalEvidence.push(evidence);
            }
        });

        return matched;
    }

    /**
     * Get matched corpus terms
     */
    getMatchedCorpusTerms(corpus, searchTerm) {
        const matched = {
            type: null,
            terms: []
        };

        if (corpus.canonical === searchTerm) {
            matched.type = 'canonical';
            matched.terms.push(corpus.canonical);
        }

        (corpus.variants || []).forEach(v => {
            if (v.includes(searchTerm)) {
                matched.type = matched.type || 'variants';
                matched.terms.push(v);
            }
        });

        ['epithets', 'domains', 'symbols', 'places', 'concepts'].forEach(field => {
            (corpus[field] || []).forEach(term => {
                if (term.includes(searchTerm)) {
                    matched.type = matched.type || field;
                    matched.terms.push(term);
                }
            });
        });

        return matched;
    }

    /**
     * Sort results by specified criteria
     */
    sortResults(results, sortBy) {
        switch (sortBy) {
            case 'relevance':
                return results.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
            case 'importance':
                return results.sort((a, b) => (b.importance || 50) - (a.importance || 50));
            case 'popularity':
                return results.sort((a, b) => (b.popularity || 50) - (a.popularity || 50));
            case 'name':
                return results.sort((a, b) =>
                    (a.sortName || a.name || '').localeCompare(b.sortName || b.name || '')
                );
            default:
                return results;
        }
    }

    /**
     * Tokenize search query
     */
    tokenize(query) {
        return query
            .toLowerCase()
            .split(/[\s,;]+/)
            .filter(term => term.length > 2)
            .map(term => term.replace(/[^\w]/g, ''));
    }

    /**
     * Generate cache key
     */
    getCacheKey(query, options) {
        return JSON.stringify({ query, ...options });
    }

    /**
     * Clear search cache
     */
    clearCache() {
        this.searchCache.clear();
    }

    /**
     * Find cross-cultural parallels
     */
    async findParallels(entityId) {
        const entity = await this.getEntity(entityId);
        if (!entity) return [];

        const parallels = entity.relationships?.parallels || {};
        const results = [];

        for (const [mythology, parallelId] of Object.entries(parallels)) {
            const parallel = await this.getEntity(parallelId);
            if (parallel) {
                results.push({
                    mythology,
                    entity: parallel,
                    relationship: 'parallel'
                });
            }
        }

        return results;
    }

    /**
     * Get entity by ID
     */
    async getEntity(entityId) {
        const [mythology, name] = entityId.split('_');

        for (const collection of this.collections) {
            const doc = await this.db.collection(collection).doc(entityId).get();
            if (doc.exists) {
                return doc.data();
            }
        }

        return null;
    }

    /**
     * Get suggested search terms based on partial input
     */
    async getSuggestions(partial, limit = 10) {
        const suggestions = new Set();
        const p = partial.toLowerCase();

        for (const collection of this.collections) {
            if (suggestions.size >= limit) break;

            const snapshot = await this.db.collection(collection)
                .limit(100)
                .get();

            snapshot.forEach(doc => {
                const entity = doc.data();

                // Name suggestions
                if (entity.name?.toLowerCase().startsWith(p)) {
                    suggestions.add(entity.name);
                }

                // Search terms suggestions
                (entity.searchTerms || []).forEach(term => {
                    if (term.toLowerCase().startsWith(p)) {
                        suggestions.add(term);
                    }
                });

                // Corpus terms suggestions
                const corpus = entity.corpusSearch || {};
                ['epithets', 'domains', 'symbols'].forEach(field => {
                    (corpus[field] || []).forEach(term => {
                        if (term.toLowerCase().startsWith(p)) {
                            suggestions.add(term);
                        }
                    });
                });
            });
        }

        return Array.from(suggestions).slice(0, limit);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CorpusSearch;
}
