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

        // Event emitter for reactive updates
        this._listeners = new Set();

        // Collection name for favorites
        this.COLLECTION = 'user_favorites';

        console.log('[FavoritesService] Initialized');
    }

    // ============================================
    // PUBLIC API - Interface Segregation Principle
    // ============================================

    /**
     * Get current user's favorites
     * @returns {Promise<FavoriteEntity[]>}
     */
    async getFavorites() {
        const user = this._getCurrentUser();
        if (!user) {
            console.warn('[FavoritesService] No authenticated user');
            return [];
        }

        // Check cache first
        if (this._isCacheValid(user.uid)) {
            return Array.from(this._cache.get(user.uid)?.values() || []);
        }

        try {
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

            // Update cache
            this._updateCache(user.uid, favorites);

            return favorites;
        } catch (error) {
            console.error('[FavoritesService] Failed to get favorites:', error);
            return this._getFromLocalStorage(user.uid);
        }
    }

    /**
     * Check if entity is favorited
     * @param {string} entityId
     * @param {string} entityType
     * @returns {Promise<boolean>}
     */
    async isFavorited(entityId, entityType) {
        const favorites = await this.getFavorites();
        return favorites.some(f =>
            f.entityId === entityId && f.entityType === entityType
        );
    }

    /**
     * Add entity to favorites (Personal Pantheon)
     * @param {Object} entity - Entity to favorite
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async addFavorite(entity) {
        const user = this._getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate entity
        const validation = this._validateEntity(entity);
        if (!validation.valid) {
            return { success: false, error: validation.error };
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

        try {
            await this.db
                .collection('users')
                .doc(user.uid)
                .collection(this.COLLECTION)
                .doc(docId)
                .set(favoriteData);

            // Update cache
            this._addToCache(user.uid, docId, favoriteData);

            // Persist to localStorage as backup
            this._saveToLocalStorage(user.uid);

            // Emit event
            this._emit('favorite-added', { ...favoriteData, id: docId });

            console.log('[FavoritesService] Added favorite:', favoriteData.name);
            return { success: true, data: favoriteData };
        } catch (error) {
            console.error('[FavoritesService] Failed to add favorite:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove entity from favorites
     * @param {string} entityId
     * @param {string} entityType
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async removeFavorite(entityId, entityType) {
        const user = this._getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const docId = this._generateDocId(entityId, entityType);

        try {
            await this.db
                .collection('users')
                .doc(user.uid)
                .collection(this.COLLECTION)
                .doc(docId)
                .delete();

            // Update cache
            this._removeFromCache(user.uid, docId);

            // Update localStorage
            this._saveToLocalStorage(user.uid);

            // Emit event
            this._emit('favorite-removed', { entityId, entityType });

            console.log('[FavoritesService] Removed favorite:', entityId);
            return { success: true };
        } catch (error) {
            console.error('[FavoritesService] Failed to remove favorite:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Toggle favorite status
     * @param {Object} entity
     * @returns {Promise<{success: boolean, isFavorited: boolean}>}
     */
    async toggleFavorite(entity) {
        const entityId = entity.id || entity.entityId;
        const entityType = entity.type || entity.entityType;

        const currentlyFavorited = await this.isFavorited(entityId, entityType);

        if (currentlyFavorited) {
            const result = await this.removeFavorite(entityId, entityType);
            return { ...result, isFavorited: false };
        } else {
            const result = await this.addFavorite(entity);
            return { ...result, isFavorited: true };
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
     * Update cache with favorites
     * @private
     */
    _updateCache(userId, favorites) {
        const map = new Map();
        favorites.forEach(f => map.set(f.id, f));
        this._cache.set(userId, map);
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
