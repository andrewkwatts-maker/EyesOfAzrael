/**
 * User Corpus Queries Service
 * Manages user-created corpus search queries in Firestore
 *
 * Features:
 * - CRUD operations for user queries
 * - Public query discovery
 * - Entity-linked queries
 * - Vote integration
 * - Query execution
 *
 * Firestore Structure:
 * user_corpus_queries/{userId}/queries/{queryId}
 * {
 *   id: string,
 *   userId: string,
 *   label: string,
 *   queryType: 'github' | 'firebase' | 'combined',
 *   query: { searchTerm, searchMode, collection, mythology, repository, branch, filters },
 *   renderMode: 'panel' | 'inline' | 'modal' | 'collapsed',
 *   autoLoad: boolean,
 *   entityRef: { type: string, id: string } | null,
 *   isPublic: boolean,
 *   votes: number,
 *   upvoteCount: number,
 *   downvoteCount: number,
 *   executionCount: number,
 *   createdAt: timestamp,
 *   updatedAt: timestamp
 * }
 *
 * Public Query Index (for discovery):
 * public_corpus_queries/{queryId}
 * {
 *   ...query data,
 *   authorDisplayName: string,
 *   authorPhotoURL: string
 * }
 */

class UserCorpusQueries {
    /**
     * @param {firebase.firestore.Firestore} db - Firestore instance
     * @param {firebase.auth.Auth} auth - Firebase Auth instance
     */
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;

        // Collection paths
        this.userQueriesPath = 'user_corpus_queries';
        this.publicQueriesPath = 'public_corpus_queries';
        this.votesPath = 'votes/corpus_queries';

        // Cache for performance
        this.queryCache = new Map();
        this.cacheTimeout = 60000; // 1 minute
    }

    /**
     * Get current user ID
     * @returns {string|null}
     */
    getCurrentUserId() {
        return this.auth.currentUser?.uid || null;
    }

    /**
     * Get current user info
     * @returns {Object|null}
     */
    getCurrentUserInfo() {
        const user = this.auth.currentUser;
        if (!user) return null;
        return {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || null,
            email: user.email
        };
    }

    /**
     * Create a new corpus query
     * @param {Object} queryData - Query data
     * @returns {Promise<Object>} Created query with ID
     */
    async createQuery(queryData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('Must be logged in to create queries');
        }

        const userInfo = this.getCurrentUserInfo();
        const now = firebase.firestore.FieldValue.serverTimestamp();

        const query = {
            userId,
            label: queryData.label,
            queryType: queryData.queryType || 'firebase',
            query: queryData.query || {},
            renderMode: queryData.renderMode || 'panel',
            autoLoad: queryData.autoLoad || false,
            entityRef: queryData.entityRef || null,
            isPublic: queryData.isPublic !== false,
            votes: 0,
            upvoteCount: 0,
            downvoteCount: 0,
            executionCount: 0,
            createdAt: now,
            updatedAt: now
        };

        // Create in user's subcollection
        const userQueryRef = await this.db
            .collection(this.userQueriesPath)
            .doc(userId)
            .collection('queries')
            .add(query);

        const queryId = userQueryRef.id;

        // If public, also add to public index
        if (query.isPublic) {
            await this.db.collection(this.publicQueriesPath).doc(queryId).set({
                ...query,
                id: queryId,
                authorDisplayName: userInfo.displayName,
                authorPhotoURL: userInfo.photoURL
            });
        }

        console.log('[UserCorpusQueries] Created query:', queryId);

        return {
            id: queryId,
            ...query
        };
    }

    /**
     * Update an existing query
     * @param {string} queryId - Query ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateQuery(queryId, updates) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('Must be logged in to update queries');
        }

        const userInfo = this.getCurrentUserInfo();
        const now = firebase.firestore.FieldValue.serverTimestamp();

        // Get existing query to check ownership
        const existingQuery = await this.getQuery(queryId);
        if (!existingQuery) {
            throw new Error('Query not found');
        }
        if (existingQuery.userId !== userId) {
            throw new Error('You can only update your own queries');
        }

        const updateData = {
            ...updates,
            updatedAt: now
        };

        // Remove fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData.userId;
        delete updateData.createdAt;
        delete updateData.votes;
        delete updateData.upvoteCount;
        delete updateData.downvoteCount;

        // Update in user's subcollection
        await this.db
            .collection(this.userQueriesPath)
            .doc(userId)
            .collection('queries')
            .doc(queryId)
            .update(updateData);

        // Update public index if applicable
        const wasPublic = existingQuery.isPublic;
        const isNowPublic = updates.isPublic !== undefined ? updates.isPublic : wasPublic;

        if (isNowPublic) {
            await this.db.collection(this.publicQueriesPath).doc(queryId).set({
                ...existingQuery,
                ...updateData,
                id: queryId,
                authorDisplayName: userInfo.displayName,
                authorPhotoURL: userInfo.photoURL
            }, { merge: true });
        } else if (wasPublic && !isNowPublic) {
            // Remove from public index
            await this.db.collection(this.publicQueriesPath).doc(queryId).delete();
        }

        // Clear cache
        this.queryCache.delete(queryId);

        console.log('[UserCorpusQueries] Updated query:', queryId);
    }

    /**
     * Delete a query
     * @param {string} queryId - Query ID
     * @returns {Promise<void>}
     */
    async deleteQuery(queryId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('Must be logged in to delete queries');
        }

        // Get existing query to check ownership
        const existingQuery = await this.getQuery(queryId);
        if (!existingQuery) {
            throw new Error('Query not found');
        }
        if (existingQuery.userId !== userId) {
            throw new Error('You can only delete your own queries');
        }

        // Delete from user's subcollection
        await this.db
            .collection(this.userQueriesPath)
            .doc(userId)
            .collection('queries')
            .doc(queryId)
            .delete();

        // Delete from public index if it was public
        if (existingQuery.isPublic) {
            await this.db.collection(this.publicQueriesPath).doc(queryId).delete();
        }

        // Delete associated votes
        const votesSnapshot = await this.db
            .collection(this.votesPath)
            .doc(queryId)
            .collection('votes')
            .get();

        const batch = this.db.batch();
        votesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Clear cache
        this.queryCache.delete(queryId);

        console.log('[UserCorpusQueries] Deleted query:', queryId);
    }

    /**
     * Get a single query by ID
     * @param {string} queryId - Query ID
     * @returns {Promise<Object|null>}
     */
    async getQuery(queryId) {
        // Check cache first
        if (this.queryCache.has(queryId)) {
            const cached = this.queryCache.get(queryId);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        // Try public index first (faster)
        const publicDoc = await this.db.collection(this.publicQueriesPath).doc(queryId).get();
        if (publicDoc.exists) {
            const data = { id: publicDoc.id, ...publicDoc.data() };
            this.queryCache.set(queryId, { data, timestamp: Date.now() });
            return data;
        }

        // Search in user's own queries
        const userId = this.getCurrentUserId();
        if (userId) {
            const userDoc = await this.db
                .collection(this.userQueriesPath)
                .doc(userId)
                .collection('queries')
                .doc(queryId)
                .get();

            if (userDoc.exists) {
                const data = { id: userDoc.id, ...userDoc.data() };
                this.queryCache.set(queryId, { data, timestamp: Date.now() });
                return data;
            }
        }

        return null;
    }

    /**
     * Get user's own queries
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getUserQueries(options = {}) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return [];
        }

        const {
            limit = 50,
            orderBy = 'createdAt',
            orderDirection = 'desc',
            entityRef = null
        } = options;

        let query = this.db
            .collection(this.userQueriesPath)
            .doc(userId)
            .collection('queries')
            .orderBy(orderBy, orderDirection)
            .limit(limit);

        // Filter by entity reference if provided
        if (entityRef) {
            query = query
                .where('entityRef.type', '==', entityRef.type)
                .where('entityRef.id', '==', entityRef.id);
        }

        const snapshot = await query.get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    /**
     * Get public queries (for discovery)
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getPublicQueries(options = {}) {
        const {
            limit = 20,
            orderBy = 'votes',
            orderDirection = 'desc',
            entityRef = null,
            mythology = null,
            queryType = null,
            minVotes = null
        } = options;

        let query = this.db
            .collection(this.publicQueriesPath)
            .orderBy(orderBy, orderDirection)
            .limit(limit);

        // Apply filters
        if (minVotes !== null) {
            query = query.where('votes', '>=', minVotes);
        }

        const snapshot = await query.get();

        let results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply client-side filters for complex queries
        if (entityRef) {
            results = results.filter(q =>
                q.entityRef?.type === entityRef.type &&
                q.entityRef?.id === entityRef.id
            );
        }

        if (mythology) {
            results = results.filter(q =>
                q.query?.mythology === mythology
            );
        }

        if (queryType) {
            results = results.filter(q => q.queryType === queryType);
        }

        return results;
    }

    /**
     * Get queries for a specific entity
     * @param {string} entityType - Entity type
     * @param {string} entityId - Entity ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Object with userQueries and publicQueries
     */
    async getEntityQueries(entityType, entityId, options = {}) {
        const entityRef = { type: entityType, id: entityId };

        const [userQueries, publicQueries] = await Promise.all([
            this.getUserQueries({ ...options, entityRef }),
            this.getPublicQueries({ ...options, entityRef })
        ]);

        // Remove duplicates (user's public queries appear in both)
        const userId = this.getCurrentUserId();
        const filteredPublic = publicQueries.filter(q => q.userId !== userId);

        return {
            userQueries,
            publicQueries: filteredPublic
        };
    }

    /**
     * Increment execution count for a query
     * @param {string} queryId - Query ID
     * @returns {Promise<void>}
     */
    async incrementExecutionCount(queryId) {
        const query = await this.getQuery(queryId);
        if (!query) return;

        const increment = firebase.firestore.FieldValue.increment(1);

        // Update in user's collection
        if (query.userId) {
            await this.db
                .collection(this.userQueriesPath)
                .doc(query.userId)
                .collection('queries')
                .doc(queryId)
                .update({ executionCount: increment });
        }

        // Update in public index if public
        if (query.isPublic) {
            await this.db.collection(this.publicQueriesPath).doc(queryId).update({
                executionCount: increment
            });
        }

        // Clear cache
        this.queryCache.delete(queryId);
    }

    /**
     * Search public queries
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Promise<Array>}
     */
    async searchPublicQueries(searchTerm, options = {}) {
        const { limit = 20 } = options;

        // Get all public queries (limited)
        const snapshot = await this.db
            .collection(this.publicQueriesPath)
            .orderBy('votes', 'desc')
            .limit(100)
            .get();

        const searchLower = searchTerm.toLowerCase();

        // Client-side filtering for text search
        const results = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(query => {
                const label = (query.label || '').toLowerCase();
                const queryTerm = (query.query?.searchTerm || '').toLowerCase();
                return label.includes(searchLower) || queryTerm.includes(searchLower);
            })
            .slice(0, limit);

        return results;
    }

    /**
     * Get popular queries (most voted)
     * @param {number} limit - Number of queries to return
     * @returns {Promise<Array>}
     */
    async getPopularQueries(limit = 10) {
        const snapshot = await this.db
            .collection(this.publicQueriesPath)
            .where('votes', '>', 0)
            .orderBy('votes', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    /**
     * Get recent queries
     * @param {number} limit - Number of queries to return
     * @returns {Promise<Array>}
     */
    async getRecentQueries(limit = 10) {
        const snapshot = await this.db
            .collection(this.publicQueriesPath)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    /**
     * Get most executed queries
     * @param {number} limit - Number of queries to return
     * @returns {Promise<Array>}
     */
    async getMostExecutedQueries(limit = 10) {
        const snapshot = await this.db
            .collection(this.publicQueriesPath)
            .orderBy('executionCount', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    /**
     * Duplicate a query (fork)
     * @param {string} queryId - Query ID to duplicate
     * @returns {Promise<Object>} New query
     */
    async duplicateQuery(queryId) {
        const originalQuery = await this.getQuery(queryId);
        if (!originalQuery) {
            throw new Error('Query not found');
        }

        const newQueryData = {
            label: `${originalQuery.label} (copy)`,
            queryType: originalQuery.queryType,
            query: originalQuery.query,
            renderMode: originalQuery.renderMode,
            autoLoad: originalQuery.autoLoad,
            entityRef: originalQuery.entityRef,
            isPublic: false // Start as private
        };

        return await this.createQuery(newQueryData);
    }

    /**
     * Clear query cache
     */
    clearCache() {
        this.queryCache.clear();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserCorpusQueries;
}

if (typeof window !== 'undefined') {
    window.UserCorpusQueries = UserCorpusQueries;
}
