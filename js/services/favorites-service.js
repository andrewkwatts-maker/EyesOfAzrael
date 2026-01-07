/**
 * FavoritesService - User's Personal Pantheon Management
 * Polished version with delightful animations, categories, and sharing
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
 * @property {string} [folderId] - Optional folder/category ID
 * @property {string[]} [tags] - Optional user-defined tags
 */

/**
 * @typedef {Object} FavoriteFolder
 * @property {string} id - Folder unique ID
 * @property {string} name - Folder display name
 * @property {string} [icon] - Folder icon/emoji
 * @property {string} [color] - Folder accent color
 * @property {number} createdAt - Creation timestamp
 * @property {number} [order] - Sort order
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
        this._cacheTimestamps = new Map(); // Per-user cache timestamps
        this._cacheTTL = 5 * 60 * 1000; // 5 minutes

        // O(1) lookup Set for isFavorited() - keyed by composite key
        this._favoritedLookup = new Map(); // userId -> Set<compositeKey>

        // Pending fetch promises to prevent race conditions
        this._pendingFetches = new Map(); // userId -> Promise

        // Event emitter for reactive updates
        this._listeners = new Set();

        // Track pending localStorage changes for conflict resolution
        this._pendingLocalChanges = new Map(); // userId -> { adds: [], removes: [] }

        // Folders/categories cache
        this._foldersCache = new Map(); // userId -> Map<folderId, FavoriteFolder>

        // Optimistic UI state tracking
        this._optimisticUpdates = new Map(); // compositeKey -> { action, timestamp }

        // Listen for online/offline status for sync
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this._onOnline());
        }

        // Collection names
        this.COLLECTION = 'user_favorites';
        this.FOLDERS_COLLECTION = 'favorite_folders';

        // Restore pending changes from localStorage on initialization
        this._restorePendingChangesFromStorage();

        // Initialize global event delegation for favorite buttons
        this._initGlobalEventDelegation();

        console.log('[FavoritesService] Initialized with enhanced features');
    }

    // ============================================
    // GLOBAL EVENT DELEGATION - Optimistic UI
    // ============================================

    /**
     * Initialize global event delegation for favorite buttons
     * @private
     */
    _initGlobalEventDelegation() {
        if (typeof document === 'undefined') return;

        // Only initialize once
        if (window._favoritesEventDelegationInitialized) return;
        window._favoritesEventDelegationInitialized = true;

        document.addEventListener('click', async (e) => {
            const favoriteBtn = e.target.closest('.entity-favorite, .entity-card__action-btn--favorite');
            if (!favoriteBtn) return;

            e.preventDefault();
            e.stopPropagation();

            // Check authentication first
            const authState = this._checkAuthState();
            if (!authState.authenticated) {
                this._emit('auth-required', { action: 'favorite' });
                this._showToast('Please sign in to save favorites', 'warning');
                return;
            }

            // Extract entity data from button
            const entityId = favoriteBtn.dataset.entityId;
            const entityType = favoriteBtn.dataset.entityType;
            const entityName = favoriteBtn.dataset.entityName || 'Entity';
            const entityMythology = favoriteBtn.dataset.entityMythology || 'unknown';
            const entityIcon = favoriteBtn.dataset.entityIcon || null;

            if (!entityId || !entityType) {
                console.warn('[FavoritesService] Missing entity data on favorite button');
                return;
            }

            // Get current state for optimistic UI
            const compositeKey = this._generateCompositeKey(entityId, entityType);
            const currentlyFavorited = favoriteBtn.classList.contains('favorited') ||
                                       favoriteBtn.getAttribute('aria-pressed') === 'true';

            // Apply optimistic UI immediately
            this._applyOptimisticUI(favoriteBtn, !currentlyFavorited, entityName);

            // Perform actual toggle
            const entity = {
                id: entityId,
                type: entityType,
                name: entityName,
                mythology: entityMythology,
                icon: entityIcon
            };

            const result = await this.toggleFavorite(entity);

            // Revert if operation failed
            if (!result.success) {
                this._applyOptimisticUI(favoriteBtn, currentlyFavorited, entityName);
                this._showToast(result.error || 'Failed to update favorite', 'error');
            }
        });
    }

    /**
     * Apply optimistic UI update to favorite button
     * @param {HTMLElement} button - The favorite button
     * @param {boolean} isFavorited - New favorited state
     * @param {string} entityName - Entity name for announcement
     * @private
     */
    _applyOptimisticUI(button, isFavorited, entityName) {
        // Add loading state briefly
        button.classList.add('loading');

        // Update visual state
        if (isFavorited) {
            button.classList.add('favorited');
            button.setAttribute('aria-pressed', 'true');
            button.setAttribute('aria-label', `Remove ${entityName} from favorites`);
            button.title = 'Remove from favorites';

            // Trigger heart fill animation
            this._triggerHeartAnimation(button, 'add');
        } else {
            button.classList.remove('favorited');
            button.setAttribute('aria-pressed', 'false');
            button.setAttribute('aria-label', `Add ${entityName} to favorites`);
            button.title = 'Add to favorites';

            // Trigger heart unfill animation
            this._triggerHeartAnimation(button, 'remove');
        }

        // Remove loading state after animation
        setTimeout(() => {
            button.classList.remove('loading');
        }, 300);
    }

    /**
     * Trigger delightful heart animation
     * @param {HTMLElement} button - The favorite button
     * @param {string} action - 'add' or 'remove'
     * @private
     */
    _triggerHeartAnimation(button, action) {
        // Remove any existing animation classes
        button.classList.remove('heart-burst', 'heart-break');

        if (action === 'add') {
            // Heart burst animation with particles
            button.classList.add('heart-burst');

            // Create particle burst effect
            this._createParticleBurst(button);

            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate([15, 30, 15]);
            }

            setTimeout(() => button.classList.remove('heart-burst'), 600);
        } else {
            // Subtle break animation
            button.classList.add('heart-break');
            setTimeout(() => button.classList.remove('heart-break'), 400);
        }
    }

    /**
     * Create particle burst effect for favorite animation
     * @param {HTMLElement} button - The favorite button
     * @private
     */
    _createParticleBurst(button) {
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Create particles container
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'favorite-particles';
        particlesContainer.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            pointer-events: none;
            z-index: 10000;
        `;

        // Create heart particles
        const colors = ['#ff6b6b', '#ff8787', '#ffa8a8', '#ffd43b', '#fff'];
        const particleCount = 8;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('span');
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 30 + Math.random() * 20;
            const size = 4 + Math.random() * 4;

            particle.className = 'favorite-particle';
            particle.innerHTML = i % 2 === 0 ? '&#10084;' : '&#10022;';
            particle.style.cssText = `
                position: absolute;
                font-size: ${size}px;
                color: ${colors[i % colors.length]};
                transform: translate(-50%, -50%);
                animation: favoriteParticle 0.6s ease-out forwards;
                --particle-x: ${Math.cos(angle) * velocity}px;
                --particle-y: ${Math.sin(angle) * velocity}px;
            `;

            particlesContainer.appendChild(particle);
        }

        document.body.appendChild(particlesContainer);

        // Cleanup after animation
        setTimeout(() => {
            particlesContainer.remove();
        }, 700);
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     * @private
     */
    _showToast(message, type = 'info') {
        if (window.toast) {
            window.toast[type]?.(message) || window.toast.show?.(message, type);
        } else if (window.ToastNotification) {
            window.ToastNotification.show(message, type);
        }
    }

    /**
     * Handle coming back online - restore pending changes and sync
     * @private
     */
    _onOnline() {
        const user = this._getCurrentUser();
        if (user) {
            // Ensure pending changes are loaded from localStorage before syncing
            this._loadPendingChanges(user.uid);
            this._syncPendingChanges();
        }
    }

    /**
     * Restore pending changes from localStorage on initialization
     * @private
     */
    _restorePendingChangesFromStorage() {
        try {
            // Look for any pending changes in localStorage
            const keys = Object.keys(localStorage).filter(k => k.startsWith('eoa_favorites_pending_'));
            keys.forEach(key => {
                const userId = key.replace('eoa_favorites_pending_', '');
                this._loadPendingChanges(userId);
            });
        } catch (error) {
            console.warn('[FavoritesService] Failed to restore pending changes:', error);
        }
    }

    // ============================================
    // PUBLIC API - Interface Segregation Principle
    // ============================================

    /**
     * Get current user's favorites with explicit auth status
     * @param {Object} options - Options for fetching
     * @param {boolean} [options.returnResultObject=false] - Return FavoritesResult instead of array
     * @param {string} [options.folderId] - Filter by folder ID
     * @returns {Promise<FavoriteEntity[]|FavoritesResult>}
     */
    async getFavorites(options = {}) {
        const { returnResultObject = false, folderId = null } = options;

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
            let favorites = Array.from(this._cache.get(user.uid)?.values() || []);

            // Filter by folder if specified
            if (folderId) {
                favorites = favorites.filter(f => f.folderId === folderId);
            }

            if (returnResultObject) {
                return {
                    success: true,
                    data: favorites,
                    status: 'authenticated'
                };
            }
            return favorites;
        }

        // Check if there's already a pending fetch for this user to prevent race conditions
        if (this._pendingFetches.has(user.uid)) {
            const result = await this._pendingFetches.get(user.uid);
            let favorites = folderId ? result.filter(f => f.folderId === folderId) : result;

            if (returnResultObject) {
                return {
                    success: true,
                    data: favorites,
                    status: 'authenticated'
                };
            }
            return favorites;
        }

        // Create the fetch promise
        const fetchPromise = this._fetchFavoritesFromFirebase(user.uid);
        this._pendingFetches.set(user.uid, fetchPromise);

        try {
            const favorites = await fetchPromise;
            const filtered = folderId ? favorites.filter(f => f.folderId === folderId) : favorites;

            if (returnResultObject) {
                return {
                    success: true,
                    data: filtered,
                    status: 'authenticated'
                };
            }
            return filtered;
        } catch (error) {
            console.error('[FavoritesService] Failed to get favorites:', error);
            const localFavorites = this._getFromLocalStorage(user.uid);
            const filtered = folderId ? localFavorites.filter(f => f.folderId === folderId) : localFavorites;

            // Populate cache and lookup Set from localStorage fallback
            if (localFavorites.length > 0) {
                this._updateCacheFromLocalStorage(user.uid, localFavorites);
            }

            if (returnResultObject) {
                return {
                    success: localFavorites.length > 0,
                    data: filtered,
                    error: error.message,
                    status: 'error'
                };
            }
            return filtered;
        } finally {
            // Clean up pending fetch
            this._pendingFetches.delete(user.uid);
        }
    }

    /**
     * Internal method to fetch favorites from Firebase
     * @private
     */
    async _fetchFavoritesFromFirebase(userId) {
        // Check if Firebase is available
        if (!this.db) {
            throw new Error('Firebase not initialized');
        }

        const snapshot = await this.db
            .collection('users')
            .doc(userId)
            .collection(this.COLLECTION)
            .orderBy('addedAt', 'desc')
            .get();

        const favorites = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Update cache and lookup Set
        this._updateCache(userId, favorites);

        return favorites;
    }

    /**
     * Update cache from localStorage fallback (with shorter TTL)
     * @private
     */
    _updateCacheFromLocalStorage(userId, favorites) {
        const map = new Map();
        const lookupSet = new Set();

        favorites.forEach(f => {
            // Generate id if not present (localStorage may not have it)
            const id = f.id || this._generateDocId(f.entityId, f.entityType);
            map.set(id, { ...f, id });
            // Build O(1) lookup Set
            const compositeKey = this._generateCompositeKey(f.entityId, f.entityType);
            lookupSet.add(compositeKey);
        });

        this._cache.set(userId, map);
        this._favoritedLookup.set(userId, lookupSet);
        // Use shorter TTL for localStorage-sourced cache (1 minute)
        // to encourage re-fetching from Firebase when back online
        this._cacheTimestamps.set(userId, Date.now() - (this._cacheTTL - 60000));
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
        // This will populate both cache and lookup Set
        const favorites = await this.getFavorites();

        // After getFavorites, the lookup Set should be populated
        // Check the Set first for O(1) lookup
        if (this._favoritedLookup.has(userId)) {
            return this._favoritedLookup.get(userId).has(compositeKey);
        }

        // Fallback to linear search only if lookup Set wasn't populated
        // (e.g., if getFavorites returned from localStorage without rebuilding Set)
        return favorites.some(f =>
            f.entityId === entityId && f.entityType === entityType
        );
    }

    /**
     * Synchronous check if entity is favorited (uses cached data only)
     * @param {string} entityId
     * @param {string} entityType
     * @returns {boolean}
     */
    isFavoritedSync(entityId, entityType) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) return false;

        const userId = authState.user.uid;
        const compositeKey = this._generateCompositeKey(entityId, entityType);

        if (this._favoritedLookup.has(userId)) {
            return this._favoritedLookup.get(userId).has(compositeKey);
        }

        return false;
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
     * @param {string} [folderId] - Optional folder to add to
     * @returns {Promise<{success: boolean, error?: string, data?: Object}>}
     */
    async addFavorite(entity, folderId = null) {
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
            addedAt: Date.now(),
            folderId: folderId || null,
            tags: entity.tags || []
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

                // Show success toast
                this._showToast(`Added ${favoriteData.name} to your Pantheon`, 'success');

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

            // Show offline toast
            this._showToast(`Saved ${favoriteData.name} (will sync when online)`, 'info');

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

        // Get entity name for toast
        const favoriteData = this._cache.get(user.uid)?.get(docId);
        const entityName = favoriteData?.name || 'Entity';

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

                // Show toast
                this._showToast(`Removed ${entityName} from your Pantheon`, 'info');

                console.log('[FavoritesService] Removed favorite:', entityId);
                return { success: true };
            } catch (error) {
                console.error('[FavoritesService] Failed to remove favorite from Firebase:', error);

                // Fallback to localStorage and track for sync
                return this._removeFavoriteOffline(user.uid, docId, entityId, entityType, compositeKey, entityName);
            }
        } else {
            // Offline mode
            return this._removeFavoriteOffline(user.uid, docId, entityId, entityType, compositeKey, entityName);
        }
    }

    /**
     * Remove favorite in offline mode
     * @private
     */
    _removeFavoriteOffline(userId, docId, entityId, entityType, compositeKey, entityName) {
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

            // Show offline toast
            this._showToast(`Removed ${entityName} (will sync when online)`, 'info');

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
     * Get favorites by folder
     * @param {string} folderId
     * @returns {Promise<FavoriteEntity[]>}
     */
    async getByFolder(folderId) {
        return this.getFavorites({ folderId });
    }

    // ============================================
    // FOLDERS/CATEGORIES - Personal Pantheon Organization
    // ============================================

    /**
     * Create a new folder/category
     * @param {Object} folderData - Folder data
     * @returns {Promise<{success: boolean, data?: FavoriteFolder, error?: string}>}
     */
    async createFolder(folderData) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        const user = authState.user;
        const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const folder = {
            id: folderId,
            name: folderData.name || 'New Collection',
            icon: folderData.icon || null,
            color: folderData.color || '#8b7fff',
            createdAt: Date.now(),
            order: folderData.order || 0
        };

        try {
            if (this.db && this._isOnline()) {
                await this.db
                    .collection('users')
                    .doc(user.uid)
                    .collection(this.FOLDERS_COLLECTION)
                    .doc(folderId)
                    .set(folder);
            }

            // Update cache
            if (!this._foldersCache.has(user.uid)) {
                this._foldersCache.set(user.uid, new Map());
            }
            this._foldersCache.get(user.uid).set(folderId, folder);

            this._emit('folder-created', folder);
            this._showToast(`Created collection: ${folder.name}`, 'success');

            return { success: true, data: folder };
        } catch (error) {
            console.error('[FavoritesService] Failed to create folder:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all folders for current user
     * @returns {Promise<FavoriteFolder[]>}
     */
    async getFolders() {
        const authState = this._checkAuthState();
        if (!authState.authenticated) return [];

        const user = authState.user;

        // Check cache
        if (this._foldersCache.has(user.uid)) {
            return Array.from(this._foldersCache.get(user.uid).values())
                .sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        try {
            if (this.db) {
                const snapshot = await this.db
                    .collection('users')
                    .doc(user.uid)
                    .collection(this.FOLDERS_COLLECTION)
                    .orderBy('order', 'asc')
                    .get();

                const folders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Cache folders
                const folderMap = new Map();
                folders.forEach(f => folderMap.set(f.id, f));
                this._foldersCache.set(user.uid, folderMap);

                return folders;
            }
        } catch (error) {
            console.error('[FavoritesService] Failed to get folders:', error);
        }

        return [];
    }

    /**
     * Update folder
     * @param {string} folderId - Folder ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateFolder(folderId, updates) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        const user = authState.user;

        try {
            if (this.db && this._isOnline()) {
                await this.db
                    .collection('users')
                    .doc(user.uid)
                    .collection(this.FOLDERS_COLLECTION)
                    .doc(folderId)
                    .update(updates);
            }

            // Update cache
            if (this._foldersCache.has(user.uid)) {
                const folder = this._foldersCache.get(user.uid).get(folderId);
                if (folder) {
                    Object.assign(folder, updates);
                }
            }

            this._emit('folder-updated', { folderId, updates });
            return { success: true };
        } catch (error) {
            console.error('[FavoritesService] Failed to update folder:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete folder (does not delete favorites in it)
     * @param {string} folderId - Folder ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async deleteFolder(folderId) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        const user = authState.user;

        try {
            if (this.db && this._isOnline()) {
                await this.db
                    .collection('users')
                    .doc(user.uid)
                    .collection(this.FOLDERS_COLLECTION)
                    .doc(folderId)
                    .delete();

                // Move favorites in this folder to "uncategorized"
                const favoritesInFolder = await this.getByFolder(folderId);
                for (const fav of favoritesInFolder) {
                    await this.moveFavoriteToFolder(fav.entityId, fav.entityType, null);
                }
            }

            // Update cache
            if (this._foldersCache.has(user.uid)) {
                this._foldersCache.get(user.uid).delete(folderId);
            }

            this._emit('folder-deleted', { folderId });
            this._showToast('Collection deleted', 'info');
            return { success: true };
        } catch (error) {
            console.error('[FavoritesService] Failed to delete folder:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Move favorite to a folder
     * @param {string} entityId - Entity ID
     * @param {string} entityType - Entity type
     * @param {string|null} folderId - Target folder ID (null for uncategorized)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async moveFavoriteToFolder(entityId, entityType, folderId) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        const user = authState.user;
        const docId = this._generateDocId(entityId, entityType);

        try {
            if (this.db && this._isOnline()) {
                await this.db
                    .collection('users')
                    .doc(user.uid)
                    .collection(this.COLLECTION)
                    .doc(docId)
                    .update({ folderId: folderId });
            }

            // Update cache
            if (this._cache.has(user.uid)) {
                const favorite = this._cache.get(user.uid).get(docId);
                if (favorite) {
                    favorite.folderId = folderId;
                }
            }

            this._saveToLocalStorage(user.uid);
            this._emit('favorite-moved', { entityId, entityType, folderId });
            return { success: true };
        } catch (error) {
            console.error('[FavoritesService] Failed to move favorite:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // BULK OPERATIONS - Add All From Mythology
    // ============================================

    /**
     * Add all entities from a specific mythology to favorites
     * @param {string} mythology - Mythology name
     * @param {string} entityType - Entity type to add
     * @param {string} [folderId] - Optional folder to add to
     * @returns {Promise<{success: boolean, added: number, skipped: number, error?: string}>}
     */
    async addAllFromMythology(mythology, entityType, folderId = null) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return { success: false, added: 0, skipped: 0, error: 'Not authenticated' };
        }

        // Ensure entityLoader is available
        if (!window.entityLoader) {
            return { success: false, added: 0, skipped: 0, error: 'Entity loader not available' };
        }

        try {
            // Load entities from the mythology
            const collectionName = entityType.endsWith('s') ? entityType : `${entityType}s`;
            let entities = [];

            try {
                entities = await window.entityLoader.loadCollection(collectionName, {
                    filters: { mythology: mythology.toLowerCase() }
                });
            } catch {
                // Try alternative approach
                entities = await window.entityLoader.searchEntities({
                    mythology: mythology,
                    type: entityType
                });
            }

            if (!entities || entities.length === 0) {
                return { success: true, added: 0, skipped: 0, message: 'No entities found' };
            }

            let added = 0;
            let skipped = 0;

            for (const entity of entities) {
                const entityId = entity.id || entity.entityId;
                const isAlreadyFavorited = await this.isFavorited(entityId, entityType);

                if (isAlreadyFavorited) {
                    skipped++;
                    continue;
                }

                const result = await this.addFavorite({
                    id: entityId,
                    type: entityType,
                    name: entity.name,
                    mythology: mythology,
                    icon: entity.icon
                }, folderId);

                if (result.success) {
                    added++;
                } else {
                    skipped++;
                }
            }

            this._showToast(`Added ${added} ${entityType}s from ${mythology}`, 'success');

            return {
                success: true,
                added,
                skipped,
                total: entities.length
            };
        } catch (error) {
            console.error('[FavoritesService] Failed to add all from mythology:', error);
            return { success: false, added: 0, skipped: 0, error: error.message };
        }
    }

    // ============================================
    // EXPORT & SHARING
    // ============================================

    /**
     * Export favorites to JSON format
     * @param {Object} options - Export options
     * @returns {Promise<{success: boolean, data?: string, error?: string}>}
     */
    async exportFavorites(options = {}) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const favorites = await this.getFavorites();
            const folders = await this.getFolders();
            const stats = await this.getStatistics();

            const exportData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                userDisplayName: authState.user.displayName || 'Anonymous',
                statistics: stats,
                folders: folders,
                favorites: favorites.map(f => ({
                    entityId: f.entityId,
                    entityType: f.entityType,
                    name: f.name,
                    mythology: f.mythology,
                    icon: f.icon,
                    folderId: f.folderId,
                    addedAt: f.addedAt
                }))
            };

            const jsonString = JSON.stringify(exportData, null, 2);

            // Trigger download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `personal-pantheon-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this._showToast('Favorites exported successfully', 'success');

            return { success: true, data: jsonString };
        } catch (error) {
            console.error('[FavoritesService] Failed to export favorites:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Import favorites from JSON
     * @param {string} jsonData - JSON string to import
     * @returns {Promise<{success: boolean, imported: number, error?: string}>}
     */
    async importFavorites(jsonData) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return { success: false, imported: 0, error: 'Not authenticated' };
        }

        try {
            const data = JSON.parse(jsonData);

            if (!data.favorites || !Array.isArray(data.favorites)) {
                return { success: false, imported: 0, error: 'Invalid import format' };
            }

            let imported = 0;

            // Import folders first
            if (data.folders && Array.isArray(data.folders)) {
                for (const folder of data.folders) {
                    await this.createFolder(folder);
                }
            }

            // Import favorites
            for (const fav of data.favorites) {
                const isAlreadyFavorited = await this.isFavorited(fav.entityId, fav.entityType);
                if (!isAlreadyFavorited) {
                    const result = await this.addFavorite({
                        id: fav.entityId,
                        type: fav.entityType,
                        name: fav.name,
                        mythology: fav.mythology,
                        icon: fav.icon
                    }, fav.folderId);

                    if (result.success) imported++;
                }
            }

            this._showToast(`Imported ${imported} favorites`, 'success');

            return { success: true, imported };
        } catch (error) {
            console.error('[FavoritesService] Failed to import favorites:', error);
            return { success: false, imported: 0, error: error.message };
        }
    }

    /**
     * Generate shareable link for favorites
     * @param {Object} options - Sharing options
     * @returns {Promise<{success: boolean, url?: string, error?: string}>}
     */
    async generateShareLink(options = {}) {
        const authState = this._checkAuthState();
        if (!authState.authenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const favorites = await this.getFavorites();

            if (favorites.length === 0) {
                return { success: false, error: 'No favorites to share' };
            }

            // Create compact shareable data
            const shareData = favorites.slice(0, 50).map(f => ({
                i: f.entityId,
                t: f.entityType.charAt(0), // First letter for type
                n: f.name
            }));

            // Encode to base64
            const encoded = btoa(JSON.stringify(shareData));
            const shareUrl = `${window.location.origin}/#/shared-pantheon?data=${encoded}`;

            // Copy to clipboard
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareUrl);
                this._showToast('Share link copied to clipboard!', 'success');
            }

            return { success: true, url: shareUrl };
        } catch (error) {
            console.error('[FavoritesService] Failed to generate share link:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load shared pantheon from URL data
     * @param {string} encodedData - Base64 encoded share data
     * @returns {{success: boolean, favorites?: Object[], error?: string}}
     */
    loadSharedPantheon(encodedData) {
        try {
            const decoded = JSON.parse(atob(encodedData));

            const typeMap = {
                d: 'deity',
                h: 'hero',
                c: 'creature',
                i: 'item',
                p: 'place'
            };

            const favorites = decoded.map(item => ({
                entityId: item.i,
                entityType: typeMap[item.t] || item.t,
                name: item.n
            }));

            return { success: true, favorites };
        } catch (error) {
            console.error('[FavoritesService] Failed to load shared pantheon:', error);
            return { success: false, error: 'Invalid share link' };
        }
    }

    /**
     * Clear all favorites
     * @returns {Promise<{success: boolean}>}
     */
    async clearAll() {
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
        const isOnline = this._isOnline();

        if (this.db && isOnline) {
            try {
                const snapshot = await this.db
                    .collection('users')
                    .doc(user.uid)
                    .collection(this.COLLECTION)
                    .get();

                const batch = this.db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();

                // Clear all caches and storage
                this._cache.delete(user.uid);
                this._favoritedLookup.delete(user.uid);
                this._cacheTimestamps.delete(user.uid);
                this._clearLocalStorage(user.uid);
                this._clearPendingChanges(user.uid);

                // Emit event
                this._emit('favorites-cleared', { userId: user.uid });

                this._showToast('Pantheon cleared', 'info');

                console.log('[FavoritesService] Cleared all favorites');
                return { success: true };
            } catch (error) {
                console.error('[FavoritesService] Failed to clear favorites from Firebase:', error);
                // Fallback to offline clear
                return this._clearAllOffline(user.uid);
            }
        } else {
            // Offline mode
            return this._clearAllOffline(user.uid);
        }
    }

    /**
     * Clear all favorites in offline mode
     * @private
     */
    _clearAllOffline(userId) {
        try {
            // Get current favorites to track pending removes
            const currentFavorites = Array.from(this._cache.get(userId)?.values() || []);

            // Track all as pending removes
            currentFavorites.forEach(favorite => {
                const docId = this._generateDocId(favorite.entityId, favorite.entityType);
                this._trackPendingRemove(userId, {
                    docId,
                    entityId: favorite.entityId,
                    entityType: favorite.entityType
                });
            });

            // Clear all caches and storage
            this._cache.delete(userId);
            this._favoritedLookup.delete(userId);
            this._cacheTimestamps.delete(userId);
            this._clearLocalStorage(userId);

            // Emit event
            this._emit('favorites-cleared', { userId, offline: true });

            console.log('[FavoritesService] Cleared all favorites offline');
            return {
                success: true,
                offline: true,
                message: 'Cleared locally. Will sync when online.'
            };
        } catch (error) {
            console.error('[FavoritesService] Failed to clear favorites offline:', error);
            return {
                success: false,
                error: error.message,
                code: 'OFFLINE_CLEAR_FAILED'
            };
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
        const timestamp = this._cacheTimestamps.get(userId);
        if (!timestamp) return false;
        return (Date.now() - timestamp) < this._cacheTTL;
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
        this._cacheTimestamps.set(userId, Date.now());
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
        this._cacheTimestamps.delete(targetUserId);

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

        if (synced > 0) {
            this._showToast(`Synced ${synced} favorites`, 'success');
        }

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
        const folders = await this.getFolders();

        const byMythology = {};
        const byType = {};
        const byFolder = {};

        favorites.forEach(f => {
            // Count by mythology
            const myth = f.mythology || 'Unknown';
            byMythology[myth] = (byMythology[myth] || 0) + 1;

            // Count by type
            const type = f.entityType || 'Unknown';
            byType[type] = (byType[type] || 0) + 1;

            // Count by folder
            const folder = f.folderId || 'uncategorized';
            byFolder[folder] = (byFolder[folder] || 0) + 1;
        });

        return {
            total: favorites.length,
            byMythology,
            byType,
            byFolder,
            folderCount: folders.length,
            oldestFavorite: favorites[favorites.length - 1]?.addedAt || null,
            newestFavorite: favorites[0]?.addedAt || null,
            topMythology: Object.entries(byMythology).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
            topType: Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || null
        };
    }

    /**
     * Update all favorite buttons on the page to reflect current state
     * Call this after loading favorites to sync UI state
     */
    async updateAllFavoriteButtons() {
        const authState = this._checkAuthState();
        if (!authState.authenticated) return;

        // Ensure cache is populated
        await this.getFavorites();

        // Find all favorite buttons on the page
        const favoriteButtons = document.querySelectorAll('.entity-favorite, .entity-card__action-btn--favorite');

        favoriteButtons.forEach(btn => {
            const entityId = btn.dataset.entityId;
            const entityType = btn.dataset.entityType;

            if (entityId && entityType) {
                const isFav = this.isFavoritedSync(entityId, entityType);
                const entityName = btn.dataset.entityName || 'Entity';

                if (isFav) {
                    btn.classList.add('favorited');
                    btn.setAttribute('aria-pressed', 'true');
                    btn.setAttribute('aria-label', `Remove ${entityName} from favorites`);
                    btn.title = 'Remove from favorites';
                } else {
                    btn.classList.remove('favorited');
                    btn.setAttribute('aria-pressed', 'false');
                    btn.setAttribute('aria-label', `Add ${entityName} to favorites`);
                    btn.title = 'Add to favorites';
                }
            }
        });
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

        // Update buttons after a short delay to ensure DOM is ready
        setTimeout(() => {
            window.EyesOfAzrael.favorites.updateAllFavoriteButtons();
        }, 500);
    });

    // Also initialize if Firebase is already ready
    if (window.EyesOfAzrael?.db) {
        window.EyesOfAzrael.favorites = new FavoritesService();
    }

    // Listen for navigation changes to update favorite buttons
    window.addEventListener('hashchange', () => {
        setTimeout(() => {
            if (window.EyesOfAzrael?.favorites) {
                window.EyesOfAzrael.favorites.updateAllFavoriteButtons();
            }
        }, 300);
    });
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FavoritesService;
}

console.log('[FavoritesService] Enhanced module loaded with animations, categories, and sharing');
