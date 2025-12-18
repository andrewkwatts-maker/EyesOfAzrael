/**
 * Advanced Search System for Eyes of Azrael
 * Comprehensive search across all mythologies with fuzzy matching, faceted filters, and analytics
 *
 * Features:
 * - Full-text search with typo tolerance
 * - Fuzzy matching using Levenshtein distance
 * - Faceted filtering (mythology, type, domain, time period)
 * - Boolean operators (AND, OR, NOT)
 * - Exact phrase matching
 * - Wildcard support
 * - Field-specific search
 * - Autocomplete suggestions
 * - Search analytics and tracking
 */

class AdvancedSearchSystem {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.searchIndex = new Map();
        this.searchCache = new Map();
        this.searchHistory = [];
        this.searchAnalytics = {
            queries: [],
            popularSearches: {},
            noResultsQueries: [],
            popularEntities: {}
        };

        // Search configuration
        this.config = {
            fuzzyThreshold: 0.7, // Minimum similarity score (0-1)
            maxResults: 100,
            minQueryLength: 2,
            cacheTimeout: 300000, // 5 minutes
            highlightTag: 'mark',
            debounceDelay: 300 // ms
        };

        // Load analytics from localStorage
        this.loadAnalytics();
    }

    /**
     * Initialize search system
     */
    async init() {
        if (this.initialized) return;

        try {
            // Wait for Firebase
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error('Firebase not initialized');
            }

            this.db = firebase.firestore();

            // Build search index
            await this.buildSearchIndex();

            this.initialized = true;
            console.log('Advanced Search System initialized');
        } catch (error) {
            console.error('Failed to initialize search system:', error);
            throw error;
        }
    }

    /**
     * Build search index from Firestore content
     */
    async buildSearchIndex() {
        console.log('Building search index...');

        try {
            // Query all published content
            const snapshot = await this.db.collection('content')
                .where('status', '==', 'published')
                .limit(1000)
                .get();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                this.indexContent(data);
            });

            console.log(`Search index built with ${this.searchIndex.size} entries`);
        } catch (error) {
            console.error('Error building search index:', error);
        }
    }

    /**
     * Index content for searching
     */
    indexContent(content) {
        const searchableText = this.buildSearchableText(content);
        const tokens = this.tokenize(searchableText);

        this.searchIndex.set(content.id, {
            id: content.id,
            title: content.title,
            subtitle: content.subtitle || '',
            summary: content.summary,
            contentType: content.contentType,
            mythology: content.mythology,
            mythologyName: content.mythologyName,
            section: content.section,
            icon: content.icon,
            imageUrl: content.imageUrl,
            tags: content.tags || [],
            attributes: content.attributes || {},
            searchableText,
            tokens,
            createdAt: content.createdAt,
            views: content.views || 0,
            votes: content.votes || 0
        });
    }

    /**
     * Build searchable text from content
     */
    buildSearchableText(content) {
        const parts = [
            content.title,
            content.subtitle,
            content.summary,
            content.mythology,
            content.mythologyName,
            content.section,
            content.contentType
        ];

        // Add tags
        if (content.tags && Array.isArray(content.tags)) {
            parts.push(...content.tags);
        }

        // Add attributes
        if (content.attributes) {
            if (content.attributes.domains) parts.push(...content.attributes.domains);
            if (content.attributes.titles) parts.push(...content.attributes.titles);
            if (content.attributes.symbols) parts.push(...content.attributes.symbols);
        }

        // Extract text from rich content panels
        if (content.richContent && content.richContent.panels) {
            content.richContent.panels.forEach(panel => {
                if (panel.title) parts.push(panel.title);
                if (panel.content) parts.push(panel.content);
            });
        }

        return parts.filter(Boolean).join(' ').toLowerCase();
    }

    /**
     * Tokenize text for searching
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 1);
    }

    /**
     * Main search function
     */
    async search(query, options = {}) {
        if (!this.initialized) {
            await this.init();
        }

        // Validate query
        if (!query || query.trim().length < this.config.minQueryLength) {
            return { results: [], totalResults: 0, searchTime: 0 };
        }

        const startTime = performance.now();

        // Parse query for advanced operators
        const parsedQuery = this.parseQuery(query);

        // Check cache
        const cacheKey = this.getCacheKey(query, options);
        if (this.searchCache.has(cacheKey)) {
            const cached = this.searchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.results;
            }
        }

        // Perform search
        let results = this.performSearch(parsedQuery, options);

        // Apply filters
        results = this.applyFilters(results, options.filters || {});

        // Sort results
        results = this.sortResults(results, options.sortBy || 'relevance');

        // Limit results
        const totalResults = results.length;
        results = results.slice(0, options.limit || this.config.maxResults);

        // Highlight matches
        results = results.map(result => this.highlightMatches(result, parsedQuery));

        const searchTime = performance.now() - startTime;

        const searchResults = {
            results,
            totalResults,
            searchTime: Math.round(searchTime),
            query: parsedQuery,
            filters: options.filters || {}
        };

        // Cache results
        this.searchCache.set(cacheKey, {
            results: searchResults,
            timestamp: Date.now()
        });

        // Track analytics
        this.trackSearch(query, totalResults);

        return searchResults;
    }

    /**
     * Parse query for advanced operators
     */
    parseQuery(query) {
        const parsed = {
            original: query,
            terms: [],
            exactPhrases: [],
            wildcards: [],
            fieldSpecific: {},
            operators: {
                and: [],
                or: [],
                not: []
            }
        };

        // Extract exact phrases ("golden fleece")
        const phraseRegex = /"([^"]+)"/g;
        let match;
        while ((match = phraseRegex.exec(query)) !== null) {
            parsed.exactPhrases.push(match[1].toLowerCase());
            query = query.replace(match[0], '');
        }

        // Extract field-specific queries (mythology:greek)
        const fieldRegex = /(\w+):(\w+)/g;
        while ((match = fieldRegex.exec(query)) !== null) {
            const field = match[1].toLowerCase();
            const value = match[2].toLowerCase();
            if (!parsed.fieldSpecific[field]) {
                parsed.fieldSpecific[field] = [];
            }
            parsed.fieldSpecific[field].push(value);
            query = query.replace(match[0], '');
        }

        // Extract NOT terms
        const notRegex = /NOT\s+(\w+)/gi;
        while ((match = notRegex.exec(query)) !== null) {
            parsed.operators.not.push(match[1].toLowerCase());
            query = query.replace(match[0], '');
        }

        // Extract wildcards (zeu*)
        const wildcardRegex = /(\w+)\*/g;
        while ((match = wildcardRegex.exec(query)) !== null) {
            parsed.wildcards.push(match[1].toLowerCase());
            query = query.replace(match[0], '');
        }

        // Remaining terms
        const terms = query.trim().split(/\s+/).filter(t => t.length > 0);

        // Check for OR operator
        terms.forEach((term, index) => {
            if (term.toUpperCase() === 'OR') {
                if (index > 0) parsed.operators.or.push(terms[index - 1].toLowerCase());
                if (index < terms.length - 1) parsed.operators.or.push(terms[index + 1].toLowerCase());
            } else if (term.toUpperCase() === 'AND') {
                if (index > 0) parsed.operators.and.push(terms[index - 1].toLowerCase());
                if (index < terms.length - 1) parsed.operators.and.push(terms[index + 1].toLowerCase());
            } else if (term.toUpperCase() !== 'OR' && term.toUpperCase() !== 'AND' && term.toUpperCase() !== 'NOT') {
                parsed.terms.push(term.toLowerCase());
            }
        });

        // Default to AND if no operators specified
        if (parsed.operators.and.length === 0 && parsed.operators.or.length === 0) {
            parsed.operators.and = parsed.terms;
        }

        return parsed;
    }

    /**
     * Perform search across index
     */
    performSearch(parsedQuery, options) {
        const results = [];

        this.searchIndex.forEach((entry, id) => {
            let score = 0;
            let matches = [];

            // Exact phrase matching
            parsedQuery.exactPhrases.forEach(phrase => {
                if (entry.searchableText.includes(phrase)) {
                    score += 10;
                    matches.push({ type: 'exact', term: phrase });
                }
            });

            // Field-specific matching
            Object.entries(parsedQuery.fieldSpecific).forEach(([field, values]) => {
                values.forEach(value => {
                    if (entry[field] && entry[field].toLowerCase() === value) {
                        score += 8;
                        matches.push({ type: 'field', field, value });
                    }
                });
            });

            // Wildcard matching
            parsedQuery.wildcards.forEach(wildcard => {
                entry.tokens.forEach(token => {
                    if (token.startsWith(wildcard)) {
                        score += 5;
                        matches.push({ type: 'wildcard', term: wildcard, matched: token });
                    }
                });
            });

            // AND operator (all terms must match)
            if (parsedQuery.operators.and.length > 0) {
                let andMatches = 0;
                parsedQuery.operators.and.forEach(term => {
                    const matchScore = this.matchTerm(term, entry);
                    if (matchScore > 0) {
                        andMatches++;
                        score += matchScore;
                        matches.push({ type: 'and', term, score: matchScore });
                    }
                });

                // All AND terms must match
                if (andMatches < parsedQuery.operators.and.length) {
                    return; // Skip this entry
                }
            }

            // OR operator (at least one term must match)
            if (parsedQuery.operators.or.length > 0) {
                let orMatched = false;
                parsedQuery.operators.or.forEach(term => {
                    const matchScore = this.matchTerm(term, entry);
                    if (matchScore > 0) {
                        orMatched = true;
                        score += matchScore;
                        matches.push({ type: 'or', term, score: matchScore });
                    }
                });

                if (!orMatched) return; // Skip this entry
            }

            // NOT operator (these terms must NOT match)
            let notMatched = false;
            parsedQuery.operators.not.forEach(term => {
                if (entry.searchableText.includes(term)) {
                    notMatched = true;
                }
            });

            if (notMatched) return; // Skip this entry

            // Regular term matching (if no operators)
            if (parsedQuery.operators.and.length === 0 &&
                parsedQuery.operators.or.length === 0 &&
                parsedQuery.terms.length > 0) {
                parsedQuery.terms.forEach(term => {
                    const matchScore = this.matchTerm(term, entry);
                    score += matchScore;
                    if (matchScore > 0) {
                        matches.push({ type: 'regular', term, score: matchScore });
                    }
                });
            }

            // Only include results with matches
            if (score > 0 && matches.length > 0) {
                results.push({
                    ...entry,
                    searchScore: score,
                    matches
                });
            }
        });

        return results;
    }

    /**
     * Match term with fuzzy matching
     */
    matchTerm(term, entry) {
        let score = 0;

        // Exact match in title (highest score)
        if (entry.title.toLowerCase().includes(term)) {
            score += 10;
        }

        // Exact match in subtitle
        if (entry.subtitle.toLowerCase().includes(term)) {
            score += 8;
        }

        // Exact match in summary
        if (entry.summary.toLowerCase().includes(term)) {
            score += 5;
        }

        // Token match
        if (entry.tokens.includes(term)) {
            score += 3;
        }

        // Fuzzy match (typo tolerance)
        if (score === 0) {
            entry.tokens.forEach(token => {
                const similarity = this.calculateSimilarity(term, token);
                if (similarity >= this.config.fuzzyThreshold) {
                    score += similarity * 2;
                }
            });
        }

        return score;
    }

    /**
     * Calculate Levenshtein distance similarity (0-1)
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Levenshtein distance algorithm
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Apply faceted filters
     */
    applyFilters(results, filters) {
        let filtered = results;

        // Mythology filter (multi-select)
        if (filters.mythologies && filters.mythologies.length > 0) {
            filtered = filtered.filter(r =>
                filters.mythologies.includes(r.mythology)
            );
        }

        // Content type filter (multi-select)
        if (filters.contentTypes && filters.contentTypes.length > 0) {
            filtered = filtered.filter(r =>
                filters.contentTypes.includes(r.contentType)
            );
        }

        // Domain filter (for deities)
        if (filters.domains && filters.domains.length > 0) {
            filtered = filtered.filter(r => {
                if (!r.attributes || !r.attributes.domains) return false;
                return filters.domains.some(d =>
                    r.attributes.domains.includes(d)
                );
            });
        }

        // Tag filter
        if (filters.tags && filters.tags.length > 0) {
            filtered = filtered.filter(r => {
                if (!r.tags) return false;
                return filters.tags.some(t => r.tags.includes(t));
            });
        }

        return filtered;
    }

    /**
     * Sort results
     */
    sortResults(results, sortBy) {
        switch (sortBy) {
            case 'relevance':
                return results.sort((a, b) => b.searchScore - a.searchScore);

            case 'name':
            case 'alphabetical':
                return results.sort((a, b) =>
                    a.title.localeCompare(b.title)
                );

            case 'date':
            case 'newest':
                return results.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return dateB - dateA;
                });

            case 'popular':
            case 'votes':
                return results.sort((a, b) => b.votes - a.votes);

            case 'views':
                return results.sort((a, b) => b.views - a.views);

            default:
                return results;
        }
    }

    /**
     * Highlight matched terms in result
     */
    highlightMatches(result, parsedQuery) {
        const allTerms = [
            ...parsedQuery.terms,
            ...parsedQuery.exactPhrases,
            ...parsedQuery.operators.and,
            ...parsedQuery.operators.or
        ];

        result.highlightedTitle = this.highlightText(result.title, allTerms);
        result.highlightedSubtitle = this.highlightText(result.subtitle, allTerms);
        result.highlightedSummary = this.highlightText(result.summary, allTerms);

        return result;
    }

    /**
     * Highlight text with matches
     */
    highlightText(text, terms) {
        if (!text) return '';

        let highlighted = text;
        terms.forEach(term => {
            const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
            highlighted = highlighted.replace(regex, `<${this.config.highlightTag}>$1</${this.config.highlightTag}>`);
        });

        return highlighted;
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get autocomplete suggestions
     */
    async getAutocompleteSuggestions(query, limit = 10) {
        if (!query || query.length < 2) return [];

        const suggestions = new Set();
        const queryLower = query.toLowerCase();

        // Search titles
        this.searchIndex.forEach(entry => {
            if (entry.title.toLowerCase().includes(queryLower)) {
                suggestions.add(entry.title);
            }
        });

        // Add from search history
        this.searchHistory.forEach(term => {
            if (term.toLowerCase().includes(queryLower)) {
                suggestions.add(term);
            }
        });

        return Array.from(suggestions).slice(0, limit);
    }

    /**
     * Get "Did you mean?" spell correction suggestions
     */
    getSpellingSuggestions(query) {
        const suggestions = [];
        const tokens = this.tokenize(query);

        tokens.forEach(token => {
            let bestMatch = null;
            let bestSimilarity = 0;

            this.searchIndex.forEach(entry => {
                entry.tokens.forEach(entryToken => {
                    const similarity = this.calculateSimilarity(token, entryToken);
                    if (similarity > bestSimilarity && similarity < 1.0 && similarity >= this.config.fuzzyThreshold) {
                        bestSimilarity = similarity;
                        bestMatch = entryToken;
                    }
                });
            });

            if (bestMatch && bestSimilarity >= 0.75) {
                suggestions.push({
                    original: token,
                    suggestion: bestMatch,
                    confidence: bestSimilarity
                });
            }
        });

        return suggestions;
    }

    /**
     * Get related searches
     */
    getRelatedSearches(query, limit = 5) {
        const related = new Set();
        const results = this.performSearch(this.parseQuery(query), {});

        // Extract common terms from top results
        results.slice(0, 10).forEach(result => {
            result.tags.forEach(tag => related.add(tag));
            if (result.mythology) related.add(result.mythologyName);
            if (result.contentType) related.add(result.contentType);
        });

        return Array.from(related).slice(0, limit);
    }

    /**
     * Get popular searches
     */
    getPopularSearches(limit = 10) {
        const sorted = Object.entries(this.searchAnalytics.popularSearches)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([query, count]) => ({ query, count }));

        return sorted;
    }

    /**
     * Track search analytics
     */
    trackSearch(query, resultCount) {
        // Add to queries log
        this.searchAnalytics.queries.push({
            query,
            resultCount,
            timestamp: new Date()
        });

        // Update popular searches
        if (!this.searchAnalytics.popularSearches[query]) {
            this.searchAnalytics.popularSearches[query] = 0;
        }
        this.searchAnalytics.popularSearches[query]++;

        // Track no-results queries
        if (resultCount === 0) {
            this.searchAnalytics.noResultsQueries.push({
                query,
                timestamp: new Date()
            });
        }

        // Add to search history
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 50); // Keep last 50
        }

        // Save analytics
        this.saveAnalytics();
    }

    /**
     * Track entity view
     */
    trackEntityView(entityId, entityTitle) {
        if (!this.searchAnalytics.popularEntities[entityId]) {
            this.searchAnalytics.popularEntities[entityId] = {
                title: entityTitle,
                views: 0
            };
        }
        this.searchAnalytics.popularEntities[entityId].views++;
        this.saveAnalytics();
    }

    /**
     * Get search trends
     */
    getSearchTrends(days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const recentQueries = this.searchAnalytics.queries.filter(q =>
            new Date(q.timestamp) >= cutoff
        );

        const trends = {};
        recentQueries.forEach(q => {
            if (!trends[q.query]) {
                trends[q.query] = { count: 0, avgResults: 0 };
            }
            trends[q.query].count++;
            trends[q.query].avgResults =
                (trends[q.query].avgResults + q.resultCount) / 2;
        });

        return Object.entries(trends)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([query, data]) => ({ query, ...data }));
    }

    /**
     * Get popular entities
     */
    getPopularEntities(limit = 10) {
        return Object.entries(this.searchAnalytics.popularEntities)
            .sort((a, b) => b[1].views - a[1].views)
            .slice(0, limit)
            .map(([id, data]) => ({ id, ...data }));
    }

    /**
     * Get cache key
     */
    getCacheKey(query, options) {
        return `${query}_${JSON.stringify(options)}`;
    }

    /**
     * Save analytics to localStorage
     */
    saveAnalytics() {
        try {
            localStorage.setItem('searchAnalytics', JSON.stringify(this.searchAnalytics));
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Failed to save search analytics:', error);
        }
    }

    /**
     * Load analytics from localStorage
     */
    loadAnalytics() {
        try {
            const analytics = localStorage.getItem('searchAnalytics');
            if (analytics) {
                this.searchAnalytics = JSON.parse(analytics);
            }

            const history = localStorage.getItem('searchHistory');
            if (history) {
                this.searchHistory = JSON.parse(history);
            }
        } catch (error) {
            console.warn('Failed to load search analytics:', error);
        }
    }

    /**
     * Clear search cache
     */
    clearCache() {
        this.searchCache.clear();
    }

    /**
     * Get available facets
     */
    async getAvailableFacets() {
        const facets = {
            mythologies: new Set(),
            contentTypes: new Set(),
            domains: new Set(),
            tags: new Set()
        };

        this.searchIndex.forEach(entry => {
            facets.mythologies.add(entry.mythology);
            facets.contentTypes.add(entry.contentType);

            if (entry.attributes && entry.attributes.domains) {
                entry.attributes.domains.forEach(d => facets.domains.add(d));
            }

            if (entry.tags) {
                entry.tags.forEach(t => facets.tags.add(t));
            }
        });

        return {
            mythologies: Array.from(facets.mythologies).sort(),
            contentTypes: Array.from(facets.contentTypes).sort(),
            domains: Array.from(facets.domains).sort(),
            tags: Array.from(facets.tags).sort()
        };
    }

    /**
     * Refresh index from Firestore
     */
    async refreshIndex() {
        this.searchIndex.clear();
        await this.buildSearchIndex();
    }
}

// Create global instance
window.advancedSearchSystem = new AdvancedSearchSystem();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedSearchSystem;
}
