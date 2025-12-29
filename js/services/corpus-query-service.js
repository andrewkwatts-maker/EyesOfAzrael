/**
 * Corpus Query Service
 *
 * Core service for managing and executing corpus queries.
 * Integrates with:
 * - GitHub sacred texts search (corpus-search-core.js)
 * - Firebase entity search (corpus-search.js component)
 *
 * Provides CRUD operations for query templates and unified search execution.
 *
 * @author Agent 1 - Corpus Search System
 * @version 1.0.0
 */

class CorpusQueryService {
    /**
     * Create a new CorpusQueryService instance
     * @param {firebase.firestore.Firestore} firestoreInstance - Firebase Firestore instance
     */
    constructor(firestoreInstance = null) {
        this.db = firestoreInstance;
        this.auth = null;

        // Search engine instances
        this.githubSearcher = null;      // CorpusSearch from corpus-search-core.js
        this.firebaseSearcher = null;    // CorpusSearch from corpus-search.js
        this.githubBrowser = null;       // GitHubBrowser for dynamic repo browsing

        // Cache for queries
        this.queryCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes

        // Collection name for stored queries
        this.QUERIES_COLLECTION = 'corpus_queries';

        // Active listeners for real-time updates
        this.listeners = new Map();

        // Initialization state
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * Initialize the service and search engines
     * @param {Object} options - Initialization options
     * @param {string} options.githubConfigPath - Path to GitHub corpus config
     * @param {Object} options.customParsers - Custom parsers for GitHub search
     * @returns {Promise<boolean>} - Whether initialization succeeded
     */
    async init(options = {}) {
        // Prevent multiple initializations
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._doInit(options);
        return this.initPromise;
    }

    /**
     * Internal initialization logic
     * @private
     */
    async _doInit(options = {}) {
        try {
            // Initialize Firebase if not provided
            if (!this.db) {
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    this.db = firebase.firestore();
                } else {
                    throw new Error('Firebase Firestore not available');
                }
            }

            // Get auth instance
            if (typeof firebase !== 'undefined' && firebase.auth) {
                this.auth = firebase.auth();
            }

            // Initialize GitHub searcher if available
            if (typeof CorpusSearch !== 'undefined' && options.githubConfigPath) {
                this.githubSearcher = new CorpusSearch(
                    options.githubConfigPath,
                    options.customParsers || {}
                );
                await this.githubSearcher.init();
            }

            // Initialize Firebase entity searcher
            // Note: The component uses the same class name, so we check for the Firestore-based version
            if (typeof CorpusSearch !== 'undefined' && !this.firebaseSearcher) {
                // Check if this is the Firestore version by looking for specific methods
                const testInstance = new CorpusSearch(this.db);
                if (typeof testInstance.genericSearch === 'function') {
                    this.firebaseSearcher = testInstance;
                }
            }

            // Initialize GitHub browser if available
            if (typeof GitHubBrowser !== 'undefined') {
                this.githubBrowser = new GitHubBrowser({
                    cachePrefix: 'corpus_query_',
                    cacheDuration: 3600000 // 1 hour
                });
            }

            this.initialized = true;
            console.log('CorpusQueryService initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize CorpusQueryService:', error);
            this.initialized = false;
            throw error;
        }
    }

    /**
     * Ensure service is initialized
     * @private
     */
    async _ensureInit() {
        if (!this.initialized && !this.initPromise) {
            await this.init();
        } else if (this.initPromise) {
            await this.initPromise;
        }
    }

    /**
     * Get current authenticated user
     * @returns {firebase.User|null}
     */
    getCurrentUser() {
        return this.auth?.currentUser || null;
    }

    // ==========================================
    // CRUD Operations for Queries
    // ==========================================

    /**
     * Save a query template to Firebase
     * @param {Object} query - Query object to save
     * @returns {Promise<Object>} - Saved query with ID
     */
    async saveQuery(query) {
        await this._ensureInit();

        const user = this.getCurrentUser();

        // Validate required fields
        if (!query.label) {
            throw new Error('Query label is required');
        }
        if (!query.queryType || !['github', 'firebase', 'combined'].includes(query.queryType)) {
            throw new Error('Valid queryType is required (github, firebase, or combined)');
        }

        // Build query document
        const queryDoc = {
            id: query.id || this._generateId(),
            label: query.label,
            queryType: query.queryType,
            query: {
                term: query.query?.term || '',
                repositories: query.query?.repositories || [],
                collections: query.query?.collections || [],
                options: {
                    caseSensitive: query.query?.options?.caseSensitive || false,
                    contextWords: query.query?.options?.contextWords || 15,
                    maxResults: query.query?.options?.maxResults || 100,
                    mode: query.query?.options?.mode || 'generic',
                    ...(query.query?.options || {})
                }
            },
            renderMode: query.renderMode || 'panel',
            entityRef: query.entityRef || null,
            autoLoad: query.autoLoad || false,
            isStandard: query.isStandard || false,
            userId: query.isStandard ? null : (user?.uid || null),
            createdAt: query.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            metadata: {
                description: query.metadata?.description || '',
                tags: query.metadata?.tags || [],
                version: query.metadata?.version || '1.0.0',
                ...(query.metadata || {})
            }
        };

        // Save to Firestore
        const docRef = this.db.collection(this.QUERIES_COLLECTION).doc(queryDoc.id);
        await docRef.set(queryDoc, { merge: true });

        // Update cache
        this.queryCache.set(queryDoc.id, {
            data: queryDoc,
            timestamp: Date.now()
        });

        console.log('Query saved:', queryDoc.id);
        return queryDoc;
    }

    /**
     * Get query by ID
     * @param {string} queryId - Query ID
     * @returns {Promise<Object|null>} - Query object or null
     */
    async getQuery(queryId) {
        await this._ensureInit();

        // Check cache first
        const cached = this.queryCache.get(queryId);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        // Fetch from Firestore
        const doc = await this.db.collection(this.QUERIES_COLLECTION).doc(queryId).get();

        if (!doc.exists) {
            return null;
        }

        const query = { id: doc.id, ...doc.data() };

        // Update cache
        this.queryCache.set(queryId, {
            data: query,
            timestamp: Date.now()
        });

        return query;
    }

    /**
     * Update an existing query
     * @param {string} queryId - Query ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} - Updated query
     */
    async updateQuery(queryId, updates) {
        await this._ensureInit();

        const user = this.getCurrentUser();
        const existingQuery = await this.getQuery(queryId);

        if (!existingQuery) {
            throw new Error('Query not found');
        }

        // Check ownership for non-standard queries
        if (!existingQuery.isStandard && existingQuery.userId !== user?.uid) {
            throw new Error('You can only update your own queries');
        }

        // Prepare update data
        const updateData = {
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Remove fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.isStandard;

        await this.db.collection(this.QUERIES_COLLECTION).doc(queryId).update(updateData);

        // Invalidate cache
        this.queryCache.delete(queryId);

        return this.getQuery(queryId);
    }

    /**
     * Delete a query
     * @param {string} queryId - Query ID
     * @returns {Promise<void>}
     */
    async deleteQuery(queryId) {
        await this._ensureInit();

        const user = this.getCurrentUser();
        const existingQuery = await this.getQuery(queryId);

        if (!existingQuery) {
            throw new Error('Query not found');
        }

        // Check ownership for non-standard queries
        if (!existingQuery.isStandard && existingQuery.userId !== user?.uid) {
            throw new Error('You can only delete your own queries');
        }

        // Standard queries require admin privileges
        if (existingQuery.isStandard) {
            throw new Error('Standard queries cannot be deleted');
        }

        await this.db.collection(this.QUERIES_COLLECTION).doc(queryId).delete();

        // Remove from cache
        this.queryCache.delete(queryId);

        console.log('Query deleted:', queryId);
    }

    /**
     * Get all queries for an entity
     * @param {string} entityType - Entity type (deity, hero, creature, etc.)
     * @param {string} entityId - Entity ID
     * @returns {Promise<Array>} - Array of queries
     */
    async getQueriesForEntity(entityType, entityId) {
        await this._ensureInit();

        const cacheKey = `entity_${entityType}_${entityId}`;
        const cached = this.queryCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        // Query by entityRef
        // Note: This requires a composite index on entityRef.type + entityRef.id
        const snapshot = await this.db.collection(this.QUERIES_COLLECTION)
            .where('entityRef.type', '==', entityType)
            .where('entityRef.id', '==', entityId)
            .get();

        const queries = [];
        snapshot.forEach(doc => {
            queries.push({ id: doc.id, ...doc.data() });
        });

        // Cache results
        this.queryCache.set(cacheKey, {
            data: queries,
            timestamp: Date.now()
        });

        return queries;
    }

    /**
     * Get user's saved queries
     * @param {string} userId - User ID (optional, defaults to current user)
     * @returns {Promise<Array>} - Array of user's queries
     */
    async getUserQueries(userId = null) {
        await this._ensureInit();

        const targetUserId = userId || this.getCurrentUser()?.uid;
        if (!targetUserId) {
            return [];
        }

        const cacheKey = `user_${targetUserId}`;
        const cached = this.queryCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        // Query by userId
        // Note: This requires an index on userId
        const snapshot = await this.db.collection(this.QUERIES_COLLECTION)
            .where('userId', '==', targetUserId)
            .orderBy('updatedAt', 'desc')
            .get();

        const queries = [];
        snapshot.forEach(doc => {
            queries.push({ id: doc.id, ...doc.data() });
        });

        // Cache results
        this.queryCache.set(cacheKey, {
            data: queries,
            timestamp: Date.now()
        });

        return queries;
    }

    /**
     * Get all standard queries
     * @returns {Promise<Array>} - Array of standard queries
     */
    async getStandardQueries() {
        await this._ensureInit();

        const cacheKey = 'standard_queries';
        const cached = this.queryCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        const snapshot = await this.db.collection(this.QUERIES_COLLECTION)
            .where('isStandard', '==', true)
            .get();

        const queries = [];
        snapshot.forEach(doc => {
            queries.push({ id: doc.id, ...doc.data() });
        });

        // Cache results
        this.queryCache.set(cacheKey, {
            data: queries,
            timestamp: Date.now()
        });

        return queries;
    }

    /**
     * Get queries by type
     * @param {string} queryType - Query type (github, firebase, combined)
     * @returns {Promise<Array>} - Array of queries
     */
    async getQueriesByType(queryType) {
        await this._ensureInit();

        const cacheKey = `type_${queryType}`;
        const cached = this.queryCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        const snapshot = await this.db.collection(this.QUERIES_COLLECTION)
            .where('queryType', '==', queryType)
            .get();

        const queries = [];
        snapshot.forEach(doc => {
            queries.push({ id: doc.id, ...doc.data() });
        });

        // Cache results
        this.queryCache.set(cacheKey, {
            data: queries,
            timestamp: Date.now()
        });

        return queries;
    }

    // ==========================================
    // Query Execution
    // ==========================================

    /**
     * Execute a query template
     * @param {Object} queryTemplate - Query template to execute
     * @param {Object} overrides - Override options for this execution
     * @returns {Promise<Object>} - Search results
     */
    async executeQuery(queryTemplate, overrides = {}) {
        await this._ensureInit();

        const queryType = overrides.queryType || queryTemplate.queryType;
        const query = { ...queryTemplate.query, ...overrides.query };
        const options = { ...queryTemplate.query?.options, ...overrides.options };

        let results = {
            github: null,
            firebase: null,
            combined: [],
            metadata: {
                queryId: queryTemplate.id,
                queryType,
                executedAt: new Date().toISOString(),
                term: query.term
            }
        };

        try {
            switch (queryType) {
                case 'github':
                    results.github = await this._executeGitHubQuery(query, options);
                    results.combined = results.github?.items || results.github || [];
                    break;

                case 'firebase':
                    results.firebase = await this._executeFirebaseQuery(query, options);
                    results.combined = results.firebase?.items || results.firebase || [];
                    break;

                case 'combined':
                    // Execute both in parallel
                    const [githubResults, firebaseResults] = await Promise.all([
                        this._executeGitHubQuery(query, options).catch(e => ({ error: e.message, items: [] })),
                        this._executeFirebaseQuery(query, options).catch(e => ({ error: e.message, items: [] }))
                    ]);

                    results.github = githubResults;
                    results.firebase = firebaseResults;
                    results.combined = this._mergeResults(
                        githubResults?.items || githubResults || [],
                        firebaseResults?.items || firebaseResults || []
                    );
                    break;

                default:
                    throw new Error(`Unknown query type: ${queryType}`);
            }

            results.metadata.resultCount = results.combined.length;
            results.metadata.success = true;

        } catch (error) {
            console.error('Query execution failed:', error);
            results.metadata.success = false;
            results.metadata.error = error.message;
        }

        return results;
    }

    /**
     * Execute GitHub sacred texts search
     * @private
     */
    async _executeGitHubQuery(query, options) {
        if (!this.githubSearcher) {
            throw new Error('GitHub searcher not initialized. Provide githubConfigPath in init()');
        }

        // Load repositories if specified and not already loaded
        if (query.repositories && query.repositories.length > 0) {
            const loadedRepos = Array.from(this.githubSearcher.loadedTexts.keys())
                .map(key => key.split(':')[0]);

            const reposToLoad = query.repositories.filter(r => !loadedRepos.includes(r));

            if (reposToLoad.length > 0) {
                await this.githubSearcher.loadSelectedRepos(reposToLoad);
            }
        }

        // Execute search
        const results = await this.githubSearcher.search(query.term, {
            caseSensitive: options.caseSensitive,
            maxResults: options.maxResults || 100,
            contextWords: options.contextWords || 15,
            matchAll: options.matchAll || false,
            useMetadata: options.useMetadata || false
        });

        return {
            items: results,
            total: results.length,
            source: 'github'
        };
    }

    /**
     * Execute Firebase entity search
     * @private
     */
    async _executeFirebaseQuery(query, options) {
        if (!this.firebaseSearcher) {
            // Try to create searcher on-the-fly
            if (typeof CorpusSearch !== 'undefined') {
                this.firebaseSearcher = new CorpusSearch(this.db);
            } else {
                throw new Error('Firebase searcher not available');
            }
        }

        // Execute search
        const searchOptions = {
            mode: options.mode || 'generic',
            mythology: options.mythology || null,
            entityType: options.entityType || null,
            language: options.language || null,
            limit: options.maxResults || 50,
            offset: options.offset || 0,
            sortBy: options.sortBy || 'relevance'
        };

        // Filter collections if specified
        if (query.collections && query.collections.length > 0) {
            // Store original collections and restore after
            const originalCollections = this.firebaseSearcher.collections;
            this.firebaseSearcher.collections = query.collections;

            try {
                const results = await this.firebaseSearcher.search(query.term, searchOptions);
                return {
                    items: results.items,
                    total: results.total,
                    source: 'firebase'
                };
            } finally {
                this.firebaseSearcher.collections = originalCollections;
            }
        }

        const results = await this.firebaseSearcher.search(query.term, searchOptions);
        return {
            items: results.items,
            total: results.total,
            source: 'firebase'
        };
    }

    /**
     * Merge results from multiple sources
     * @private
     */
    _mergeResults(githubResults, firebaseResults) {
        const combined = [];

        // Add GitHub results with source marker
        githubResults.forEach(result => {
            combined.push({
                ...result,
                _source: 'github',
                _type: 'text_reference'
            });
        });

        // Add Firebase results with source marker
        firebaseResults.forEach(result => {
            combined.push({
                ...result,
                _source: 'firebase',
                _type: 'entity'
            });
        });

        // Sort by relevance score
        combined.sort((a, b) => {
            const scoreA = a._searchScore || a.score || 0;
            const scoreB = b._searchScore || b.score || 0;
            return scoreB - scoreA;
        });

        return combined;
    }

    // ==========================================
    // Real-time Subscriptions
    // ==========================================

    /**
     * Subscribe to query updates for an entity
     * @param {string} entityType - Entity type
     * @param {string} entityId - Entity ID
     * @param {Function} callback - Callback for updates
     * @returns {Function} - Unsubscribe function
     */
    subscribeToEntityQueries(entityType, entityId, callback) {
        const listenerKey = `entity_${entityType}_${entityId}`;

        // Unsubscribe existing listener
        if (this.listeners.has(listenerKey)) {
            this.listeners.get(listenerKey)();
        }

        const unsubscribe = this.db.collection(this.QUERIES_COLLECTION)
            .where('entityRef.type', '==', entityType)
            .where('entityRef.id', '==', entityId)
            .onSnapshot(snapshot => {
                const queries = [];
                snapshot.forEach(doc => {
                    queries.push({ id: doc.id, ...doc.data() });
                });
                callback(queries);
            }, error => {
                console.error('Entity queries subscription error:', error);
                callback([]);
            });

        this.listeners.set(listenerKey, unsubscribe);
        return unsubscribe;
    }

    /**
     * Subscribe to user's queries
     * @param {Function} callback - Callback for updates
     * @returns {Function} - Unsubscribe function
     */
    subscribeToUserQueries(callback) {
        const user = this.getCurrentUser();
        if (!user) {
            callback([]);
            return () => {};
        }

        const listenerKey = `user_${user.uid}`;

        // Unsubscribe existing listener
        if (this.listeners.has(listenerKey)) {
            this.listeners.get(listenerKey)();
        }

        const unsubscribe = this.db.collection(this.QUERIES_COLLECTION)
            .where('userId', '==', user.uid)
            .orderBy('updatedAt', 'desc')
            .onSnapshot(snapshot => {
                const queries = [];
                snapshot.forEach(doc => {
                    queries.push({ id: doc.id, ...doc.data() });
                });
                callback(queries);
            }, error => {
                console.error('User queries subscription error:', error);
                callback([]);
            });

        this.listeners.set(listenerKey, unsubscribe);
        return unsubscribe;
    }

    // ==========================================
    // Utility Methods
    // ==========================================

    /**
     * Generate unique ID
     * @private
     */
    _generateId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 9);
        return `query_${timestamp}_${randomPart}`;
    }

    /**
     * Clear query cache
     */
    clearCache() {
        this.queryCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.queryCache.size,
            keys: Array.from(this.queryCache.keys())
        };
    }

    /**
     * Cleanup all listeners
     */
    cleanup() {
        for (const unsubscribe of this.listeners.values()) {
            unsubscribe();
        }
        this.listeners.clear();
        this.queryCache.clear();
    }

    /**
     * Get available GitHub repositories
     * @returns {Array} - Array of repository configurations
     */
    getAvailableRepositories() {
        if (!this.githubSearcher || !this.githubSearcher.config) {
            return [];
        }
        return this.githubSearcher.getRepositories();
    }

    /**
     * Get available Firebase collections
     * @returns {Array} - Array of collection names
     */
    getAvailableCollections() {
        if (!this.firebaseSearcher) {
            return [];
        }
        return this.firebaseSearcher.collections || [];
    }

    /**
     * Get search engine status
     * @returns {Object} - Status of search engines
     */
    getStatus() {
        return {
            initialized: this.initialized,
            githubSearcher: !!this.githubSearcher,
            firebaseSearcher: !!this.firebaseSearcher,
            githubBrowser: !!this.githubBrowser,
            loadedTexts: this.githubSearcher?.loadedTexts?.size || 0,
            cacheSize: this.queryCache.size,
            activeListeners: this.listeners.size
        };
    }
}

// ==========================================
// Firestore Indexes Documentation
// ==========================================
/**
 * Required Composite Indexes for Firebase Firestore
 *
 * Add these indexes in Firebase Console or firestore.indexes.json:
 *
 * 1. Entity Reference Queries:
 *    Collection: corpus_queries
 *    Fields: entityRef.type (Ascending), entityRef.id (Ascending)
 *    Query scope: Collection
 *
 * 2. User Queries with Ordering:
 *    Collection: corpus_queries
 *    Fields: userId (Ascending), updatedAt (Descending)
 *    Query scope: Collection
 *
 * 3. Query Type Index:
 *    Collection: corpus_queries
 *    Fields: queryType (Ascending)
 *    Query scope: Collection
 *
 * 4. Standard Queries Index:
 *    Collection: corpus_queries
 *    Fields: isStandard (Ascending)
 *    Query scope: Collection
 *
 * firestore.indexes.json example:
 * {
 *   "indexes": [
 *     {
 *       "collectionGroup": "corpus_queries",
 *       "queryScope": "COLLECTION",
 *       "fields": [
 *         { "fieldPath": "entityRef.type", "order": "ASCENDING" },
 *         { "fieldPath": "entityRef.id", "order": "ASCENDING" }
 *       ]
 *     },
 *     {
 *       "collectionGroup": "corpus_queries",
 *       "queryScope": "COLLECTION",
 *       "fields": [
 *         { "fieldPath": "userId", "order": "ASCENDING" },
 *         { "fieldPath": "updatedAt", "order": "DESCENDING" }
 *       ]
 *     }
 *   ]
 * }
 */

// ES Module Export
export { CorpusQueryService };

// Legacy global export
if (typeof window !== 'undefined') {
    window.CorpusQueryService = CorpusQueryService;
}

// Create singleton instance
if (typeof window !== 'undefined') {
    window.corpusQueryService = window.corpusQueryService || new CorpusQueryService();
}
