/**
 * Firestore Query Builder
 * Complex query utilities for filtering, sorting, and grouping theories
 */

class FirestoreQueries {
    constructor(firebaseDB) {
        this.db = firebaseDB;
    }

    /**
     * Query builder for theories
     */
    async queryTheories(options = {}) {
        const {
            filters = {},
            sort = 'newest',
            limit = 20,
            startAfter = null,
            includeDeleted = false
        } = options;

        const queryOptions = {
            ...filters,
            sortBy: sort,
            limit,
            startAfter
        };

        if (!includeDeleted && !filters.status) {
            queryOptions.status = 'published';
        }

        return await this.db.getTheories(queryOptions);
    }

    /**
     * Filter theories by topic
     */
    async filterByTopic(topicId, options = {}) {
        return await this.queryTheories({
            filters: { topic: topicId },
            ...options
        });
    }

    /**
     * Filter theories by subtopic
     */
    async filterBySubtopic(subtopicId, options = {}) {
        return await this.queryTheories({
            filters: { subtopic: subtopicId },
            ...options
        });
    }

    /**
     * Filter theories by author
     */
    async filterByAuthor(authorName, options = {}) {
        return await this.queryTheories({
            filters: { author: authorName },
            ...options
        });
    }

    /**
     * Filter theories by author ID
     */
    async filterByAuthorId(authorId, options = {}) {
        return await this.queryTheories({
            filters: { authorId },
            ...options
        });
    }

    /**
     * Get user's own theories
     */
    async getUserTheories(userId, options = {}) {
        return await this.queryTheories({
            filters: { authorId: userId, status: null },
            ...options
        });
    }

    /**
     * Sort theories by newest
     */
    async sortByNewest(filters = {}, options = {}) {
        return await this.queryTheories({
            filters,
            sort: 'newest',
            ...options
        });
    }

    /**
     * Sort theories by oldest
     */
    async sortByOldest(filters = {}, options = {}) {
        return await this.queryTheories({
            filters,
            sort: 'oldest',
            ...options
        });
    }

    /**
     * Sort theories by popularity (votes)
     */
    async sortByPopular(filters = {}, options = {}) {
        return await this.queryTheories({
            filters,
            sort: 'popular',
            ...options
        });
    }

    /**
     * Sort theories by views
     */
    async sortByViews(filters = {}, options = {}) {
        return await this.queryTheories({
            filters,
            sort: 'views',
            ...options
        });
    }

    /**
     * Search theories by text (limited - client-side)
     */
    async search(searchTerm, filters = {}, options = {}) {
        if (!searchTerm || searchTerm.trim() === '') {
            return await this.queryTheories({ filters, ...options });
        }

        return await this.db.searchTheories(searchTerm, {
            ...filters,
            ...options
        });
    }

    /**
     * Group theories by topic (client-side)
     */
    async groupByTopic(theories = null, options = {}) {
        if (!theories) {
            const result = await this.queryTheories({ limit: 100, ...options });
            theories = result.theories;
        }

        const groups = {};

        theories.forEach(theory => {
            const key = theory.topic || 'uncategorized';
            if (!groups[key]) {
                groups[key] = {
                    topic: key,
                    topicName: theory.topicName || 'Uncategorized',
                    topicIcon: theory.topicIcon || '📌',
                    theories: []
                };
            }
            groups[key].theories.push(theory);
        });

        return groups;
    }

    /**
     * Group theories by subtopic (client-side)
     */
    async groupBySubtopic(theories = null, options = {}) {
        if (!theories) {
            const result = await this.queryTheories({ limit: 100, ...options });
            theories = result.theories;
        }

        const groups = {};

        theories.forEach(theory => {
            const key = theory.subtopic || 'unspecified';
            if (!groups[key]) {
                groups[key] = {
                    subtopic: key,
                    subtopicName: theory.subtopicName || 'Unspecified',
                    topicIcon: theory.topicIcon || '📋',
                    theories: []
                };
            }
            groups[key].theories.push(theory);
        });

        return groups;
    }

    /**
     * Group theories by author (client-side)
     */
    async groupByAuthor(theories = null, options = {}) {
        if (!theories) {
            const result = await this.queryTheories({ limit: 100, ...options });
            theories = result.theories;
        }

        const groups = {};

        theories.forEach(theory => {
            const key = theory.authorName || theory.authorId;
            if (!groups[key]) {
                groups[key] = {
                    author: key,
                    authorName: theory.authorName,
                    authorAvatar: theory.authorAvatar,
                    theories: []
                };
            }
            groups[key].theories.push(theory);
        });

        return groups;
    }

    /**
     * Get trending theories (high votes + recent)
     */
    async getTrendingTheories(daysBack = 7, limit = 10) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        // Get recent theories sorted by votes
        const result = await this.queryTheories({
            sort: 'popular',
            limit: 50
        });

        // Filter by date (client-side since Firestore doesn't support complex queries)
        const trending = result.theories
            .filter(theory => {
                const createdAt = theory.createdAt;
                return createdAt && createdAt >= cutoffDate;
            })
            .slice(0, limit);

        return { theories: trending, hasMore: false };
    }

    /**
     * Get related theories based on topic/subtopic
     */
    async getRelatedTheories(theory, limit = 5) {
        const filters = {};

        if (theory.subtopic) {
            filters.subtopic = theory.subtopic;
        } else if (theory.topic) {
            filters.topic = theory.topic;
        }

        const result = await this.queryTheories({
            filters,
            sort: 'popular',
            limit: limit + 1 // +1 to account for the current theory
        });

        // Remove the current theory from results
        const related = result.theories.filter(t => t.id !== theory.id).slice(0, limit);

        return { theories: related, hasMore: false };
    }

    /**
     * Get statistics for theories
     */
    async getStatistics() {
        try {
            // Get all published theories (up to reasonable limit)
            const result = await this.queryTheories({
                limit: 1000,
                filters: { status: 'published' }
            });

            const theories = result.theories;

            // Calculate stats
            const stats = {
                totalTheories: theories.length,
                totalVotes: theories.reduce((sum, t) => sum + (t.votes || 0), 0),
                totalViews: theories.reduce((sum, t) => sum + (t.views || 0), 0),
                totalComments: 0, // Would need to query subcollections

                topics: new Set(theories.filter(t => t.topic).map(t => t.topic)).size,
                subtopics: new Set(theories.filter(t => t.subtopic).map(t => t.subtopic)).size,
                authors: new Set(theories.map(t => t.authorId)).size,

                avgVotes: 0,
                avgViews: 0,

                mostPopular: null,
                mostViewed: null,
                newest: null
            };

            if (theories.length > 0) {
                stats.avgVotes = stats.totalVotes / theories.length;
                stats.avgViews = stats.totalViews / theories.length;

                // Find extremes
                stats.mostPopular = theories.reduce((max, t) =>
                    (t.votes || 0) > (max.votes || 0) ? t : max, theories[0]);

                stats.mostViewed = theories.reduce((max, t) =>
                    (t.views || 0) > (max.views || 0) ? t : max, theories[0]);

                stats.newest = theories.reduce((max, t) =>
                    t.createdAt > max.createdAt ? t : max, theories[0]);
            }

            return stats;
        } catch (error) {
            console.error('Error calculating statistics:', error);
            throw error;
        }
    }

    /**
     * Pagination helper - load more theories
     */
    async loadMore(lastDoc, filters = {}, sort = 'newest', limit = 20) {
        return await this.queryTheories({
            filters,
            sort,
            limit,
            startAfter: lastDoc
        });
    }

    /**
     * Advanced search with multiple criteria
     */
    async advancedSearch(criteria) {
        const {
            searchTerm = '',
            topic = null,
            subtopic = null,
            author = null,
            minVotes = null,
            minViews = null,
            dateFrom = null,
            dateTo = null,
            sort = 'newest',
            limit = 20
        } = criteria;

        // Build filters
        const filters = {};
        if (topic) filters.topic = topic;
        if (subtopic) filters.subtopic = subtopic;
        if (author) filters.author = author;

        // Get theories with basic filters
        let result;
        if (searchTerm) {
            result = await this.search(searchTerm, filters, { sort, limit: 100 });
        } else {
            result = await this.queryTheories({ filters, sort, limit: 100 });
        }

        // Apply additional client-side filters
        let filtered = result.theories;

        if (minVotes !== null) {
            filtered = filtered.filter(t => (t.votes || 0) >= minVotes);
        }

        if (minViews !== null) {
            filtered = filtered.filter(t => (t.views || 0) >= minViews);
        }

        if (dateFrom) {
            filtered = filtered.filter(t => t.createdAt >= new Date(dateFrom));
        }

        if (dateTo) {
            filtered = filtered.filter(t => t.createdAt <= new Date(dateTo));
        }

        // Apply limit
        filtered = filtered.slice(0, limit);

        return {
            theories: filtered,
            hasMore: false,
            totalMatches: filtered.length
        };
    }

    /**
     * Get theories by multiple topics
     */
    async getTheoriesByTopics(topicIds, options = {}) {
        // Since Firestore doesn't support OR queries efficiently, we fetch each topic separately
        const results = await Promise.all(
            topicIds.map(topicId => this.filterByTopic(topicId, options))
        );

        // Merge and deduplicate
        const theoriesMap = new Map();
        results.forEach(result => {
            result.theories.forEach(theory => {
                theoriesMap.set(theory.id, theory);
            });
        });

        return {
            theories: Array.from(theoriesMap.values()),
            hasMore: false
        };
    }

    /**
     * Batch operations helper
     */
    async batchUpdate(theoryIds, updates) {
        const results = await Promise.all(
            theoryIds.map(id => this.db.updateTheory(id, updates))
        );

        return {
            success: results.every(r => r.success),
            updated: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        };
    }

    /**
     * Export query results to JSON
     */
    async exportTheories(filters = {}, format = 'json') {
        const result = await this.queryTheories({
            filters,
            limit: 1000
        });

        if (format === 'json') {
            return JSON.stringify(result.theories, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(result.theories);
        }

        return result.theories;
    }

    /**
     * Convert theories to CSV format
     */
    convertToCSV(theories) {
        if (theories.length === 0) return '';

        const headers = ['ID', 'Title', 'Author', 'Topic', 'Subtopic', 'Votes', 'Views', 'Created'];
        const rows = theories.map(t => [
            t.id,
            `"${(t.title || '').replace(/"/g, '""')}"`,
            t.authorName,
            t.topicName || '',
            t.subtopicName || '',
            t.votes || 0,
            t.views || 0,
            t.createdAt ? t.createdAt.toISOString() : ''
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }
}

// Create global instance (requires firebaseDB to be initialized)
if (window.firebaseDB) {
    window.firestoreQueries = new FirestoreQueries(window.firebaseDB);
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirestoreQueries;
}
