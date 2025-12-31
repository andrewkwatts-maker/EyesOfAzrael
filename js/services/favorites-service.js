/**
 * FavoritesService - User's Personal Pantheon Management
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles favorites CRUD operations
 * - Open/Closed: Extensible via event system, closed for modification
 * - Liskov Substitution: Works with any entity following IEntity interface
 * - Interface Segregation: Clean, minimal API surface
 * - Dependency Inversion: Depends on abstract storage interface
 */

/**
 * @typedef {Object} FavoriteEntity
 * @property {string} entityId - Unique entity identifier
 * @property {string} entityType - Type of entity (deity, creature, hero, etc.)
 * @property {string} mythology - Associated mythology
 * @property {string} name - Entity display name
 * @property {string} [icon] - Entity icon/emoji
 * @property {number} addedAt - Timestamp when favorited
 */

/**
 * @typedef {Object} IStorageAdapter
 * @property {Function} get - Get favorites for user
 * @property {Function} add - Add a favorite
 * @property {Function} remove - Remove a favorite
 * @property {Function} clear - Clear all favorites
 */

/**
 * @typedef {Object} FavoritesResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {FavoriteEntity[]} [data] - The favorites array (if successful)
 * @property {string} [error] - Error message (if failed)
 * @property {'authenticated'|'not_authenticated'|'error'} status - Result status
 */

class FavoritesService {
    /**
     * @param {Object} options - Configuration options
     * @param {firebase.firestore.Firestore} options.firestore - Firestore instance
     * @param {firebase.auth.Auth} options.auth - Firebase Auth instance
     */
    constructor(options = {}) {
        this.db = options.firestore || window.EyesOfAzrael?.db;
        this.auth = options.auth || window.EyesOfAzrael?.firebaseAuth;

        // In-memory cache for performance
        this._cache = new Map();
        this._cacheTimestamp = null;
        this._cacheTTL = 5 * 60 * 1000; // 5 minutes

        // O(1) lookup Set for isFavorited() - keyed by composite key
        this._favoritedLookup = new Map(); // userId -> Set<compositeKey>

        // Event emitter for reactive updates
        this._listeners = new Set();

        // Track pending localStorage changes for conflict resolution
        this._pendingLocalChanges = new Map(); // userId -> { adds: [], removes: [] }

        // Listen for online/offline status for sync
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this._syncPendingChanges());
        }

        // Collection name for favorites
        this.COLLECTION = 'user_favorites';

        console.log('[FavoritesService] Initialized');
    }

    // ============================================
    // PUBLIC API - Interface Segregation Principle
    // ============================================

    /**
     * Get current user's favorites with explicit auth status
     * @param {Object} options - Options for fetching
     * @param {boolean} [options.returnResultObject=false] - Return FavoritesResult instead of array
     * @returns {Promise<FavoriteEntity[]|FavoritesResult>}
     */
    async getFavorites(options = {}) {
        const { returnResultObject = false } = options;

        // Explicit auth check
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            console.warn('[FavoritesService] No authenticated user');
            if (returnResultObject) {
                return {
                    success: false,
                    data: [],
                    error: 'User not authenticated',
                    status: 'not_authenticated'
                };
            }
            return [];
        }

        const user = authState.user;

        // Check cache first
        if (this._isCacheValid(user.uid)) {
            const favorites = Array.from(this._cache.get(user.uid)?.values() || []);
            if (returnResultObject) {
                return {
                    success: true,
                    data: favorites,
                    status: 'authenticated'
                };
            }
            return favorites;
        }

        try {
            // Check if Firebase is available
            if (!this.db) {
                throw new Error('Firebase not initialized');
            }

            const snapshot = await this.db
                .collection('users')
                .doc(user.uid)
                .collection(this.COLLECTION)
                .orderBy('addedAt', 'desc')
                .get();

            const favorites = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Update cache and lookup Set
            this._updateCache(user.uid, favorites);

            if (returnResultObject) {
                return {
                    success: true,
                    data: favorites,
                    status: 'authenticated'
                };
            }
            return favorites;
        } catch (error) {
            console.error('[FavoritesService] Failed to get favorites:', error);
            const localFavorites = this._getFromLocalStorage(user.uid);

            if (returnResultObject) {
                return {
                    success: localFavorites.length > 0,
                    data: localFavorites,
                    error: error.message,
                    status: 'error'
                };
            }
            return localFavorites;
        }
    }

    /**
     * Check authentication state explicitly
     * @returns {{authenticated: boolean, user: Object|null, reason?: string}}
     * @private
     */
    _checkAuthState() {
        const user = this._getCurrentUser();

        if (!user) {
            return {
                authenticated: false,
                user: null,
                reason: 'no_user'
            };
        }

        // Check if user has valid UID
        if (!user.uid) {
            return {
                authenticated: false,
                user: null,
                reason: 'invalid_user'
            };
        }

        return {
            authenticated: true,
            user
        };
    }

    /**
     * Check if entity is favorited - O(1) lookup using cached Set
     * @param {string} entityId
     * @param {string} entityType
     * @returns {Promise<boolean>}
     */
    async isFavorited(entityId, entityType) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return false;
        }

        const userId = authState.user.uid;
        const compositeKey = this._generateCompositeKey(entityId, entityType);

        // Check if we have a valid lookup Set
        if (this._favoritedLookup.has(userId) && this._isCacheValid(userId)) {
            // O(1) lookup
            return this._favoritedLookup.get(userId).has(compositeKey);
        }

        // Need to populate the lookup Set - fetch favorites
        await this.getFavorites();

        // Now check the Set
        if (this._favoritedLookup.has(userId)) {
            return this._favoritedLookup.get(userId).has(compositeKey);
        }

        // Fallback to linear search (shouldn't happen)
        const favorites = await this.getFavorites();
        return favorites.some(f =>
            f.entityId === entityId && f.entityType === entityType
        );
    }

    /**
     * Generate composite key for O(1) lookup
     * @param {string} entityId
     * @param {string} entityType
     * @returns {string}
     * @private
     */
    _generateCompositeKey(entityId, entityType) {
        return `${entityType}::${entityId}`;
    }

    /**
     * Add entity to favorites (Personal Pantheon)
     * @param {Object} entity - Entity to favorite
     * @returns {Promise<{success: boolean, error?: string, data?: Object}>}
     */
    async addFavorite(entity) {
        // Explicit auth check
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return {
                success: false,
                error: 'Not authenticated',
                code: 'AUTH_REQUIRED'
            };
        }

        const user = authState.user;

        // Validate entity
        const validation = this._validateEntity(entity);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                code: 'VALIDATION_ERROR'
            };
        }

        const favoriteData = {
            entityId: entity.id || entity.entityId,
            entityType: entity.type || entity.entityType,
            mythology: entity.mythology || entity.primaryMythology || 'unknown',
            name: entity.name,
            icon: entity.icon || null,
            addedAt: Date.now()
        };

        const docId = this._generateDocId(favoriteData.entityId, favoriteData.entityType);
        const compositeKey = this._generateCompositeKey(favoriteData.entityId, favoriteData.entityType);

        // Check if Firebase is available
        const isOnline = this._isOnline();

        if (this.db && isOnline) {
            try {
                await this.db
                    .collection('users')
                    .doc(user.uid)
                    .collection(this.COLLECTION)
                    .doc(docId)
                    .set(favoriteData);

                // Update cache and lookup Set
                this._addToCache(user.uid, docId, favoriteData);
                this._addToLookup(user.uid, compositeKey);

                // Persist to localStorage as backup
                this._saveToLocalStorage(user.uid);

                // Emit event
                this._emit('favorite-added', { ...favoriteData, id: docId });

                console.log('[FavoritesService] Added favorite:', favoriteData.name);
                return { success: true, data: favoriteData };
            } catch (error) {
                console.error('[FavoritesService] Failed to add favorite to Firebase:', error);

                // Fallback to localStorage and track for sync
                return this._addFavoriteOffline(user.uid, docId, favoriteData, compositeKey);
            }
        } else {
            // Offline mode - save to localStorage and track for sync
            return this._addFavoriteOffline(user.uid, docId, favoriteData, compositeKey);
        }
    }

    /**
     * Add favorite in offline mode
     * @private
     */
    _addFavoriteOffline(userId, docId, favoriteData, compositeKey) {
        try {
            // Update cache and lookup Set
            this._addToCache(userId, docId, favoriteData);
            this._addToLookup(userId, compositeKey);

            // Save to localStorage
            this._saveToLocalStorage(userId);

            // Track pending change for sync
            this._trackPendingAdd(userId, { docId, data: favoriteData });

            // Emit event
            this._emit('favorite-added', { ...favoriteData, id: docId, offline: true });

            console.log('[FavoritesService] Added favorite offline:', favoriteData.name);
            return {
                success: true,
                data: favoriteData,
                offline: true,
                message: 'Saved locally. Will sync when online.'
            };
        } catch (error) {
            console.error('[FavoritesService] Failed to add favorite offline:', error);
            return {
                success: false,
                error: error.message,
                code: 'OFFLINE_SAVE_FAILED'
            };
        }
    }

    /**
     * Remove entity from favorites
     * @param {string} entityId
     * @param {string} entityType
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async removeFavorite(entityId, entityType) {
        // Explicit auth check
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return {
                success: false,
                error: 'Not authenticated',
                code: 'AUTH_REQUIRED'
            };
        }

        // Validate inputs
        if (!entityId || !entityType) {
            return {
                success: false,
                error: 'Entity ID and type are required',
                code: 'VALIDATION_ERROR'
            };
        }

        const user = authState.user;
        const docId = this._generateDocId(entityId, entityType);
        const compositeKey = this._generateCompositeKey(entityId, entityType);

        // Check if Firebase is available
        const isOnline = this._isOnline();

        if (this.db && isOnline) {
            try {
                await this.db
                    .collection('users')
                    .doc(user.uid)
                    .collection(this.COLLECTION)
                    .doc(docId)
                    .delete();

                // Update cache and lookup Set
                this._removeFromCache(user.uid, docId);
                this._removeFromLookup(user.uid, compositeKey);

                // Update localStorage
                this._saveToLocalStorage(user.uid);

                // Emit event
                this._emit('favorite-removed', { entityId, entityType });

                console.log('[FavoritesService] Removed favorite:', entityId);
                return { success: true };
            } catch (error) {
                console.error('[FavoritesService] Failed to remove favorite from Firebase:', error);

                // Fallback to localStorage and track for sync
                return this._removeFavoriteOffline(user.uid, docId, entityId, entityType, compositeKey);
            }
        } else {
            // Offline mode
            return this._removeFavoriteOffline(user.uid, docId, entityId, entityType, compositeKey);
        }
    }

    /**
     * Remove favorite in offline mode
     * @private
     */
    _removeFavoriteOffline(userId, docId, entityId, entityType, compositeKey) {
        try {
            // Update cache and lookup Set
            this._removeFromCache(userId, docId);
            this._removeFromLookup(userId, compositeKey);

            // Update localStorage
            this._saveToLocalStorage(userId);

            // Track pending change for sync
            this._trackPendingRemove(userId, { docId, entityId, entityType });

            // Emit event
            this._emit('favorite-removed', { entityId, entityType, offline: true });

            console.log('[FavoritesService] Removed favorite offline:', entityId);
            return {
                success: true,
                offline: true,
                message: 'Removed locally. Will sync when online.'
            };
        } catch (error) {
            console.error('[FavoritesService] Failed to remove favorite offline:', error);
            return {
                success: false,
                error: error.message,
                code: 'OFFLINE_REMOVE_FAILED'
            };
        }
    }

    /**
     * Toggle favorite status
     * @param {Object} entity
     * @returns {Promise<{success: boolean, isFavorited: boolean, error?: string}>}
     */
    async toggleFavorite(entity) {
        // Explicit auth check
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return {
                success: false,
                isFavorited: false,
                error: 'Not authenticated',
                code: 'AUTH_REQUIRED'
            };
        }

        // Validate entity
        if (!entity) {
            return {
                success: false,
                isFavorited: false,
                error: 'Entity is required',
                code: 'VALIDATION_ERROR'
            };
        }

        const entityId = entity.id || entity.entityId;
        const entityType = entity.type || entity.entityType;

        if (!entityId || !entityType) {
            return {
                success: false,
                isFavorited: false,
                error: 'Entity ID and type are required',
                code: 'VALIDATION_ERROR'
            };
        }

        try {
            const currentlyFavorited = await this.isFavorited(entityId, entityType);

            if (currentlyFavorited) {
                const result = await this.removeFavorite(entityId, entityType);
                return { ...result, isFavorited: false };
            } else {
                const result = await this.addFavorite(entity);
                return { ...result, isFavorited: true };
            }
        } catch (error) {
            console.error('[FavoritesService] Toggle favorite failed:', error);
            return {
                success: false,
                isFavorited: false,
                error: error.message,
                code: 'TOGGLE_FAILED'
            };
        }
    }

    /**
     * Get favorites count
     * @returns {Promise<number>}
     */
    async getCount() {
        const favorites = await this.getFavorites();
        return favorites.length;
    }

    /**
     * Get favorites by mythology
     * @param {string} mythology
     * @returns {Promise<FavoriteEntity[]>}
     */
    async getByMythology(mythology) {
        const favorites = await this.getFavorites();
        return favorites.filter(f =>
            f.mythology?.toLowerCase() === mythology?.toLowerCase()
        );
    }

    /**
     * Get favorites by entity type
     * @param {string} entityType
     * @returns {Promise<FavoriteEntity[]>}
     */
    async getByType(entityType) {
        const favorites = await this.getFavorites();
        return favorites.filter(f => f.entityType === entityType);
    }

    /**
     * Clear all favorites
     * @returns {Promise<{success: boolean}>}
     */
    async clearAll() {
        const user = this._getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const snapshot = await this.db
                .collection('users')
                .doc(user.uid)
                .collection(this.COLLECTION)
                .get();

            const batch = this.db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            // Clear cache
            this._cache.delete(user.uid);
            this._clearLocalStorage(user.uid);

            // Emit event
            this._emit('favorites-cleared', { userId: user.uid });

            return { success: true };
        } catch (error) {
            console.error('[FavoritesService] Failed to clear favorites:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // EVENT SYSTEM - Open/Closed Principle
    // ============================================

    /**
     * Subscribe to favorites changes
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    /**
     * Emit event to all listeners
     * @private
     */
    _emit(event, data) {
        this._listeners.forEach(callback => {
            try {
                callback({ event, data, timestamp: Date.now() });
            } catch (error) {
                console.error('[FavoritesService] Listener error:', error);
            }
        });

        // Also dispatch DOM event for components
        document.dispatchEvent(new CustomEvent('favorites-changed', {
            detail: { event, data }
        }));
    }

    // ============================================
    // PRIVATE METHODS - Single Responsibility
    // ============================================

    /**
     * Get current authenticated user
     * @private
     */
    _getCurrentUser() {
        if (this.auth?.currentUser) {
            return this.auth.currentUser;
        }
        // Fallback to firebase global
        if (typeof firebase !== 'undefined' && firebase.auth) {
            return firebase.auth().currentUser;
        }
        return null;
    }

    /**
     * Validate entity data
     * @private
     */
    _validateEntity(entity) {
        if (!entity) {
            return { valid: false, error: 'Entity is required' };
        }

        const entityId = entity.id || entity.entityId;
        const entityType = entity.type || entity.entityType;

        if (!entityId) {
            return { valid: false, error: 'Entity ID is required' };
        }
        if (!entityType) {
            return { valid: false, error: 'Entity type is required' };
        }
        if (!entity.name) {
            return { valid: false, error: 'Entity name is required' };
        }

        return { valid: true };
    }

    /**
     * Generate document ID from entity
     * @private
     */
    _generateDocId(entityId, entityType) {
        return `${entityType}_${entityId}`;
    }

    // ============================================
    // CACHING - Performance Optimization
    // ============================================

    /**
     * Check if cache is still valid
     * @private
     */
    _isCacheValid(userId) {
        if (!this._cache.has(userId)) return false;
        if (!this._cacheTimestamp) return false;
        return (Date.now() - this._cacheTimestamp) < this._cacheTTL;
    }

    /**
     * Update cache with favorites and rebuild lookup Set
     * @private
     */
    _updateCache(userId, favorites) {
        const map = new Map();
        const lookupSet = new Set();

        favorites.forEach(f => {
            map.set(f.id, f);
            // Build O(1) lookup Set
            const compositeKey = this._generateCompositeKey(f.entityId, f.entityType);
            lookupSet.add(compositeKey);
        });

        this._cache.set(userId, map);
        this._favoritedLookup.set(userId, lookupSet);
        this._cacheTimestamp = Date.now();
    }

    /**
     * Add single item to cache
     * @private
     */
    _addToCache(userId, docId, data) {
        if (!this._cache.has(userId)) {
            this._cache.set(userId, new Map());
        }
        this._cache.get(userId).set(docId, { id: docId, ...data });
    }

    /**
     * Remove item from cache
     * @private
     */
    _removeFromCache(userId, docId) {
        if (this._cache.has(userId)) {
            this._cache.get(userId).delete(docId);
        }
    }

    /**
     * Add to O(1) lookup Set
     * @private
     */
    _addToLookup(userId, compositeKey) {
        if (!this._favoritedLookup.has(userId)) {
            this._favoritedLookup.set(userId, new Set());
        }
        this._favoritedLookup.get(userId).add(compositeKey);
    }

    /**
     * Remove from O(1) lookup Set
     * @private
     */
    _removeFromLookup(userId, compositeKey) {
        if (this._favoritedLookup.has(userId)) {
            this._favoritedLookup.get(userId).delete(compositeKey);
        }
    }

    /**
     * Manually invalidate cache - call when favorites might have changed externally
     * @param {string} [userId] - Optional user ID, defaults to current user
     * @returns {{success: boolean}}
     */
    invalidateCache(userId = null) {
        const targetUserId = userId || this._getCurrentUser()?.uid;

        if (!targetUserId) {
            console.warn('[FavoritesService] No user ID for cache invalidation');
            return { success: false, error: 'No user ID' };
        }

        // Clear cache for user
        this._cache.delete(targetUserId);
        this._favoritedLookup.delete(targetUserId);
        this._cacheTimestamp = null;

        console.log('[FavoritesService] Cache invalidated for user:', targetUserId);

        // Emit event
        this._emit('cache-invalidated', { userId: targetUserId });

        return { success: true };
    }

    /**
     * Force refresh favorites from Firebase
     * @returns {Promise<FavoriteEntity[]>}
     */
    async refreshFavorites() {
        const user = this._getCurrentUser();
        if (user) {
            this.invalidateCache(user.uid);
        }
        return this.getFavorites();
    }

    /**
     * Check if browser is online
     * @private
     */
    _isOnline() {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    // ============================================
    // CONFLICT RESOLUTION - Offline Sync
    // ============================================

    /**
     * Track pending add for later sync
     * @private
     */
    _trackPendingAdd(userId, change) {
        if (!this._pendingLocalChanges.has(userId)) {
            this._pendingLocalChanges.set(userId, { adds: [], removes: [] });
        }
        const pending = this._pendingLocalChanges.get(userId);

        // Check if this is reversing a pending remove
        const removeIndex = pending.removes.findIndex(r => r.docId === change.docId);
        if (removeIndex !== -1) {
            // Cancel out the remove
            pending.removes.splice(removeIndex, 1);
        } else {
            // Add to pending adds
            pending.adds.push({ ...change, timestamp: Date.now() });
        }

        this._savePendingChanges(userId);
    }

    /**
     * Track pending remove for later sync
     * @private
     */
    _trackPendingRemove(userId, change) {
        if (!this._pendingLocalChanges.has(userId)) {
            this._pendingLocalChanges.set(userId, { adds: [], removes: [] });
        }
        const pending = this._pendingLocalChanges.get(userId);

        // Check if this is reversing a pending add
        const addIndex = pending.adds.findIndex(a => a.docId === change.docId);
        if (addIndex !== -1) {
            // Cancel out the add
            pending.adds.splice(addIndex, 1);
        } else {
            // Add to pending removes
            pending.removes.push({ ...change, timestamp: Date.now() });
        }

        this._savePendingChanges(userId);
    }

    /**
     * Save pending changes to localStorage
     * @private
     */
    _savePendingChanges(userId) {
        try {
            const pending = this._pendingLocalChanges.get(userId);
            if (pending) {
                localStorage.setItem(
                    `eoa_favorites_pending_${userId}`,
                    JSON.stringify(pending)
                );
            }
        } catch (error) {
            console.warn('[FavoritesService] Failed to save pending changes:', error);
        }
    }

    /**
     * Load pending changes from localStorage
     * @private
     */
    _loadPendingChanges(userId) {
        try {
            const data = localStorage.getItem(`eoa_favorites_pending_${userId}`);
            if (data) {
                const pending = JSON.parse(data);
                this._pendingLocalChanges.set(userId, pending);
                return pending;
            }
        } catch (error) {
            console.warn('[FavoritesService] Failed to load pending changes:', error);
        }
        return { adds: [], removes: [] };
    }

    /**
     * Clear pending changes after successful sync
     * @private
     */
    _clearPendingChanges(userId) {
        this._pendingLocalChanges.delete(userId);
        try {
            localStorage.removeItem(`eoa_favorites_pending_${userId}`);
        } catch (error) {
            console.warn('[FavoritesService] Failed to clear pending changes:', error);
        }
    }

    /**
     * Sync pending local changes to Firebase when coming back online
     * @returns {Promise<{success: boolean, synced: number, conflicts: number}>}
     */
    async _syncPendingChanges() {
        const user = this._getCurrentUser();
        if (!user || !this.db || !this._isOnline()) {
            return { success: false, synced: 0, conflicts: 0 };
        }

        console.log('[FavoritesService] Syncing pending changes...');

        const pending = this._loadPendingChanges(user.uid);
        let synced = 0;
        let conflicts = 0;

        // First, fetch current Firebase state for conflict detection
        let firebaseFavorites = new Map();
        try {
            const snapshot = await this.db
                .collection('users')
                .doc(user.uid)
                .collection(this.COLLECTION)
                .get();

            snapshot.docs.forEach(doc => {
                firebaseFavorites.set(doc.id, { id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.error('[FavoritesService] Failed to fetch Firebase state for sync:', error);
            return { success: false, synced: 0, conflicts: 0, error: error.message };
        }

        // Process pending adds
        for (const add of pending.adds) {
            try {
                const existingDoc = firebaseFavorites.get(add.docId);

                if (existingDoc) {
                    // Conflict: document exists in Firebase
                    // Resolution: Use last-write-wins based on timestamp
                    if (add.timestamp > (existingDoc.addedAt || 0)) {
                        // Local is newer, overwrite
                        await this.db
                            .collection('users')
                            .doc(user.uid)
                            .collection(this.COLLECTION)
                            .doc(add.docId)
                            .set(add.data);
                        synced++;
                    } else {
                        // Firebase is newer, skip
                        conflicts++;
                    }
                } else {
                    // No conflict, add to Firebase
                    await this.db
                        .collection('users')
                        .doc(user.uid)
                        .collection(this.COLLECTION)
                        .doc(add.docId)
                        .set(add.data);
                    synced++;
                }
            } catch (error) {
                console.error('[FavoritesService] Failed to sync add:', error);
                conflicts++;
            }
        }

        // Process pending removes
        for (const remove of pending.removes) {
            try {
                const existingDoc = firebaseFavorites.get(remove.docId);

                if (existingDoc) {
                    // Document exists, check timestamp for conflict resolution
                    if (remove.timestamp > (existingDoc.addedAt || 0)) {
                        // Remove was requested after the add, proceed with delete
                        await this.db
                            .collection('users')
                            .doc(user.uid)
                            .collection(this.COLLECTION)
                            .doc(remove.docId)
                            .delete();
                        synced++;
                    } else {
                        // Firebase document is newer (re-added), don't delete
                        conflicts++;
                    }
                }
                // If document doesn't exist, nothing to remove - considered success
            } catch (error) {
                console.error('[FavoritesService] Failed to sync remove:', error);
                conflicts++;
            }
        }

        // Clear pending changes after sync
        this._clearPendingChanges(user.uid);

        // Invalidate cache to get fresh data
        this.invalidateCache(user.uid);

        // Emit sync complete event
        this._emit('sync-complete', { synced, conflicts });

        console.log(`[FavoritesService] Sync complete. Synced: ${synced}, Conflicts: ${conflicts}`);
        return { success: true, synced, conflicts };
    }

    /**
     * Manually trigger sync (public API)
     * @returns {Promise<{success: boolean, synced: number, conflicts: number}>}
     */
    async syncToCloud() {
        return this._syncPendingChanges();
    }

    /**
     * Check if there are pending changes to sync
     * @returns {boolean}
     */
    hasPendingChanges() {
        const user = this._getCurrentUser();
        if (!user) return false;

        const pending = this._pendingLocalChanges.get(user.uid) ||
            this._loadPendingChanges(user.uid);

        return (pending.adds.length > 0 || pending.removes.length > 0);
    }

    // ============================================
    // LOCAL STORAGE FALLBACK - Dependency Inversion
    // ============================================

    /**
     * Get storage key for user
     * @private
     */
    _getStorageKey(userId) {
        return `eoa_favorites_${userId}`;
    }

    /**
     * Save to localStorage
     * @private
     */
    _saveToLocalStorage(userId) {
        try {
            const favorites = this._cache.get(userId);
            if (favorites) {
                const data = Array.from(favorites.values());
                localStorage.setItem(this._getStorageKey(userId), JSON.stringify(data));
            }
        } catch (error) {
            console.warn('[FavoritesService] LocalStorage save failed:', error);
        }
    }

    /**
     * Get from localStorage
     * @private
     */
    _getFromLocalStorage(userId) {
        try {
            const data = localStorage.getItem(this._getStorageKey(userId));
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('[FavoritesService] LocalStorage read failed:', error);
            return [];
        }
    }

    /**
     * Clear localStorage
     * @private
     */
    _clearLocalStorage(userId) {
        try {
            localStorage.removeItem(this._getStorageKey(userId));
        } catch (error) {
            console.warn('[FavoritesService] LocalStorage clear failed:', error);
        }
    }

    // ============================================
    // STATISTICS - For User Dashboard
    // ============================================

    /**
     * Get favorites statistics for dashboard
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        const favorites = await this.getFavorites();

        const byMythology = {};
        const byType = {};

        favorites.forEach(f => {
            // Count by mythology
            const myth = f.mythology || 'Unknown';
            byMythology[myth] = (byMythology[myth] || 0) + 1;

            // Count by type
            const type = f.entityType || 'Unknown';
            byType[type] = (byType[type] || 0) + 1;
        });

        return {
            total: favorites.length,
            byMythology,
            byType,
            oldestFavorite: favorites[favorites.length - 1]?.addedAt || null,
            newestFavorite: favorites[0]?.addedAt || null
        };
    }
}

// ============================================
// SINGLETON INSTANCE & EXPORTS
// ============================================

// Create global singleton
if (typeof window !== 'undefined') {
    window.FavoritesService = FavoritesService;

    // Auto-initialize when Firebase is ready
    document.addEventListener('firebase-ready', () => {
        if (!window.EyesOfAzrael) window.EyesOfAzrael = {};
        window.EyesOfAzrael.favorites = new FavoritesService();
    });

    // Also initialize if Firebase is already ready
    if (window.EyesOfAzrael?.db) {
        window.EyesOfAzrael.favorites = new FavoritesService();
    }
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FavoritesService;
}

console.log('[FavoritesService] Module loaded');
