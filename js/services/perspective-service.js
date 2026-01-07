/**
 * Perspective Service
 *
 * Manages user perspectives/lenses for viewing mythology content.
 * Allows users to create personal interpretations that others can view.
 *
 * Features:
 * - Create, read, update, delete perspectives
 * - Per-entity overlays with custom metadata
 * - Public/private visibility controls
 * - "View as user" functionality via URL parameters
 * - Real-time updates via Firestore listeners
 * - Caching for performance
 *
 * Firestore Structure:
 * user_perspectives/{perspectiveId}
 * ├── userId, entityId, entityType, entityCollection
 * ├── publicNotes, personalNotes, alternativeDescription
 * ├── customMetadata: { personalRating, color, ... }
 * ├── visibility: 'public' | 'private'
 * ├── upvoteCount, downvoteCount, netVotes
 * └── createdAt, updatedAt, status
 */

class PerspectiveService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Current active perspective (for "view as user" mode)
        this.activePerspective = null;
        this.activePerspectiveId = null;

        // Cache for perspectives
        this.perspectiveCache = new Map();
        this.entityOverlayCache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        // Active listeners for cleanup
        this.activeListeners = new Map();

        // Rate limiting
        this.createCount = 0;
        this.maxCreatesPerHour = 20;
        this.rateResetTime = Date.now() + 3600000;
    }

    /**
     * Initialize the service with Firebase
     */
    async init() {
        if (this.initialized) return;

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            throw new Error('Firebase not initialized');
        }

        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.initialized = true;

        // Check URL for perspective parameter
        this._checkUrlPerspective();

        // Listen for URL changes (SPA navigation)
        window.addEventListener('hashchange', () => this._checkUrlPerspective());

        console.log('[PerspectiveService] Initialized');
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.auth?.currentUser;
    }

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new perspective for an entity
     * @param {Object} entityRef - { entityId, entityType, entityCollection }
     * @param {Object} data - Perspective data
     * @returns {Promise<Object>} Created perspective
     */
    async createPerspective(entityRef, data) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to create a perspective');
        }

        // Rate limiting
        if (!this._checkRateLimit()) {
            throw new Error('Too many perspectives created. Please wait before creating more.');
        }

        // Validate required fields
        if (!entityRef.entityId || !entityRef.entityType) {
            throw new Error('Entity reference is required');
        }

        // Check if user already has a perspective for this entity
        const existing = await this._getUserPerspectiveForEntity(
            user.uid,
            entityRef.entityId,
            entityRef.entityCollection || entityRef.entityType
        );

        if (existing) {
            throw new Error('You already have a perspective for this entity. Edit the existing one instead.');
        }

        // Build perspective document
        const perspectiveData = {
            // Entity reference
            entityId: entityRef.entityId,
            entityType: entityRef.entityType,
            entityCollection: entityRef.entityCollection || this._getCollectionName(entityRef.entityType),

            // User attribution
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatar: user.photoURL || null,
            userEmail: user.email,

            // Content
            publicNotes: this._sanitizeText(data.publicNotes || ''),
            personalNotes: this._sanitizeText(data.personalNotes || ''),
            alternativeDescription: this._sanitizeText(data.alternativeDescription || ''),
            customMetadata: this._sanitizeCustomMetadata(data.customMetadata || {}),
            personalTags: Array.isArray(data.personalTags) ? data.personalTags.slice(0, 10) : [],

            // Visibility
            visibility: data.visibility === 'private' ? 'private' : 'public',

            // Engagement (initialized)
            upvoteCount: 0,
            downvoteCount: 0,
            netVotes: 0,
            viewCount: 0,

            // Status
            status: 'active',
            flagCount: 0,
            version: 1,

            // Timestamps
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firestore
        const docRef = await this.db.collection('user_perspectives').add(perspectiveData);

        // Increment rate limit counter
        this.createCount++;

        console.log('[PerspectiveService] Created perspective:', docRef.id);

        // Clear cache for this entity
        this._clearEntityCache(entityRef.entityId);

        return {
            id: docRef.id,
            ...perspectiveData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Get a perspective by ID
     * @param {string} perspectiveId - Perspective document ID
     * @returns {Promise<Object|null>} Perspective data or null
     */
    async getPerspective(perspectiveId) {
        await this.init();

        // Check cache first
        const cached = this._getFromCache(this.perspectiveCache, perspectiveId);
        if (cached) return cached;

        const doc = await this.db.collection('user_perspectives').doc(perspectiveId).get();

        if (!doc.exists) {
            return null;
        }

        const perspective = { id: doc.id, ...doc.data() };

        // Check visibility
        const user = this.getCurrentUser();
        if (perspective.visibility === 'private' && perspective.userId !== user?.uid) {
            throw new Error('This perspective is private');
        }

        // Cache it
        this._setCache(this.perspectiveCache, perspectiveId, perspective);

        return perspective;
    }

    /**
     * Update a perspective
     * @param {string} perspectiveId - Perspective ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated perspective
     */
    async updatePerspective(perspectiveId, updates) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to update a perspective');
        }

        // Get existing perspective
        const docRef = this.db.collection('user_perspectives').doc(perspectiveId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Perspective not found');
        }

        const existing = doc.data();

        // Ownership check
        if (existing.userId !== user.uid) {
            throw new Error('You can only edit your own perspectives');
        }

        // Build update object (only allowed fields)
        const updateData = {
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            version: firebase.firestore.FieldValue.increment(1)
        };

        if (updates.publicNotes !== undefined) {
            updateData.publicNotes = this._sanitizeText(updates.publicNotes);
        }
        if (updates.personalNotes !== undefined) {
            updateData.personalNotes = this._sanitizeText(updates.personalNotes);
        }
        if (updates.alternativeDescription !== undefined) {
            updateData.alternativeDescription = this._sanitizeText(updates.alternativeDescription);
        }
        if (updates.customMetadata !== undefined) {
            updateData.customMetadata = this._sanitizeCustomMetadata(updates.customMetadata);
        }
        if (updates.personalTags !== undefined) {
            updateData.personalTags = Array.isArray(updates.personalTags)
                ? updates.personalTags.slice(0, 10)
                : [];
        }
        if (updates.visibility !== undefined) {
            updateData.visibility = updates.visibility === 'private' ? 'private' : 'public';
        }

        await docRef.update(updateData);

        // Clear cache
        this._clearFromCache(this.perspectiveCache, perspectiveId);
        this._clearEntityCache(existing.entityId);

        console.log('[PerspectiveService] Updated perspective:', perspectiveId);

        return { id: perspectiveId, ...existing, ...updateData };
    }

    /**
     * Delete a perspective (soft delete)
     * @param {string} perspectiveId - Perspective ID
     */
    async deletePerspective(perspectiveId) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to delete a perspective');
        }

        const docRef = this.db.collection('user_perspectives').doc(perspectiveId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Perspective not found');
        }

        const existing = doc.data();

        if (existing.userId !== user.uid) {
            throw new Error('You can only delete your own perspectives');
        }

        // Soft delete
        await docRef.update({
            status: 'deleted',
            deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
            deletedBy: user.uid
        });

        // Clear cache
        this._clearFromCache(this.perspectiveCache, perspectiveId);
        this._clearEntityCache(existing.entityId);

        console.log('[PerspectiveService] Deleted perspective:', perspectiveId);
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get all perspectives for an entity
     * @param {string} entityId - Entity ID
     * @param {string} entityCollection - Collection name
     * @param {Object} options - { visibility, sortBy, limit }
     * @returns {Promise<Array>} Array of perspectives
     */
    async getPerspectivesForEntity(entityId, entityCollection, options = {}) {
        await this.init();

        const { visibility = 'public', sortBy = 'votes', limit = 20 } = options;

        let query = this.db.collection('user_perspectives')
            .where('entityId', '==', entityId)
            .where('entityCollection', '==', entityCollection)
            .where('status', '==', 'active');

        // Filter by visibility
        if (visibility === 'public') {
            query = query.where('visibility', '==', 'public');
        }

        // Apply sorting
        switch (sortBy) {
            case 'votes':
                query = query.orderBy('netVotes', 'desc');
                break;
            case 'recent':
                query = query.orderBy('createdAt', 'desc');
                break;
            case 'views':
                query = query.orderBy('viewCount', 'desc');
                break;
            default:
                query = query.orderBy('netVotes', 'desc');
        }

        query = query.limit(limit);

        const snapshot = await query.get();

        const perspectives = [];
        snapshot.forEach(doc => {
            perspectives.push({ id: doc.id, ...doc.data() });
        });

        return perspectives;
    }

    /**
     * Get all perspectives created by a user
     * @param {string} userId - User ID
     * @param {Object} options - { includePrivate, sortBy, limit }
     * @returns {Promise<Array>} Array of perspectives
     */
    async getUserPerspectives(userId, options = {}) {
        await this.init();

        const { includePrivate = false, sortBy = 'recent', limit = 50 } = options;

        const currentUser = this.getCurrentUser();
        const isOwnProfile = currentUser?.uid === userId;

        let query = this.db.collection('user_perspectives')
            .where('userId', '==', userId)
            .where('status', '==', 'active');

        // Only show private perspectives to the owner
        if (!isOwnProfile || !includePrivate) {
            query = query.where('visibility', '==', 'public');
        }

        // Apply sorting
        switch (sortBy) {
            case 'votes':
                query = query.orderBy('netVotes', 'desc');
                break;
            case 'recent':
                query = query.orderBy('createdAt', 'desc');
                break;
            default:
                query = query.orderBy('createdAt', 'desc');
        }

        query = query.limit(limit);

        const snapshot = await query.get();

        const perspectives = [];
        snapshot.forEach(doc => {
            perspectives.push({ id: doc.id, ...doc.data() });
        });

        return perspectives;
    }

    /**
     * Get the current user's perspective for an entity
     * @param {string} entityId - Entity ID
     * @param {string} entityCollection - Collection name
     * @returns {Promise<Object|null>} User's perspective or null
     */
    async getMyPerspective(entityId, entityCollection) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) return null;

        return await this._getUserPerspectiveForEntity(user.uid, entityId, entityCollection);
    }

    // ==================== PERSPECTIVE VIEWING ====================

    /**
     * Set the active perspective for "view as user" mode
     * @param {string|null} perspectiveId - Perspective ID or null to clear
     */
    async setActivePerspective(perspectiveId) {
        await this.init();

        if (!perspectiveId) {
            this.activePerspective = null;
            this.activePerspectiveId = null;
            this._dispatchPerspectiveChange(null);
            console.log('[PerspectiveService] Cleared active perspective');
            return;
        }

        const perspective = await this.getPerspective(perspectiveId);
        if (!perspective) {
            throw new Error('Perspective not found');
        }

        this.activePerspective = perspective;
        this.activePerspectiveId = perspectiveId;

        // Increment view count (if not own perspective)
        const user = this.getCurrentUser();
        if (perspective.userId !== user?.uid) {
            this._incrementViewCount(perspectiveId);
        }

        this._dispatchPerspectiveChange(perspective);
        console.log('[PerspectiveService] Set active perspective:', perspectiveId);
    }

    /**
     * Get the currently active perspective
     * @returns {Object|null} Active perspective or null
     */
    getActivePerspective() {
        return this.activePerspective;
    }

    /**
     * Get active perspective ID from URL or state
     * @returns {string|null} Perspective ID or null
     */
    getActivePerspectiveId() {
        // Check URL first
        const urlPerspective = this._getPerspectiveFromUrl();
        if (urlPerspective) return urlPerspective;

        // Fall back to stored state
        return this.activePerspectiveId;
    }

    /**
     * Merge entity data with perspective overlay
     * @param {Object} entity - Official entity data
     * @param {string} perspectiveId - Perspective ID (optional, uses active if not provided)
     * @returns {Promise<Object>} Merged entity data
     */
    async mergeWithPerspective(entity, perspectiveId = null) {
        await this.init();

        const pId = perspectiveId || this.activePerspectiveId;
        if (!pId) return entity;

        // Get perspective
        const perspective = pId === this.activePerspectiveId
            ? this.activePerspective
            : await this.getPerspective(pId);

        if (!perspective) return entity;

        // Check if perspective matches entity
        if (perspective.entityId !== entity.id) return entity;

        // Merge data
        return this._mergeEntityWithOverlay(entity, perspective);
    }

    // ==================== REAL-TIME UPDATES ====================

    /**
     * Subscribe to perspectives for an entity
     * @param {string} entityId - Entity ID
     * @param {string} entityCollection - Collection name
     * @param {Function} callback - Callback with perspectives array
     * @returns {Function} Unsubscribe function
     */
    subscribeToPerspectives(entityId, entityCollection, callback) {
        if (!this.db) this.init();

        const listenerKey = `${entityCollection}/${entityId}`;

        // Cleanup existing listener
        if (this.activeListeners.has(listenerKey)) {
            this.activeListeners.get(listenerKey)();
        }

        const query = this.db.collection('user_perspectives')
            .where('entityId', '==', entityId)
            .where('entityCollection', '==', entityCollection)
            .where('status', '==', 'active')
            .where('visibility', '==', 'public')
            .orderBy('netVotes', 'desc')
            .limit(20);

        const unsubscribe = query.onSnapshot(
            snapshot => {
                const perspectives = [];
                snapshot.forEach(doc => {
                    perspectives.push({ id: doc.id, ...doc.data() });
                });
                callback(perspectives);
            },
            error => {
                console.error('[PerspectiveService] Listener error:', error);
                callback([]);
            }
        );

        this.activeListeners.set(listenerKey, unsubscribe);

        return () => {
            unsubscribe();
            this.activeListeners.delete(listenerKey);
        };
    }

    /**
     * Cleanup all listeners
     */
    cleanup() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();
        this.perspectiveCache.clear();
        this.entityOverlayCache.clear();
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Get collection name from entity type
     */
    _getCollectionName(entityType) {
        const typeMap = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'item': 'items',
            'place': 'places',
            'text': 'texts',
            'ritual': 'rituals',
            'symbol': 'symbols',
            'concept': 'concepts',
            'herb': 'herbs'
        };
        return typeMap[entityType] || entityType;
    }

    /**
     * Get user's perspective for a specific entity
     */
    async _getUserPerspectiveForEntity(userId, entityId, entityCollection) {
        const query = this.db.collection('user_perspectives')
            .where('userId', '==', userId)
            .where('entityId', '==', entityId)
            .where('entityCollection', '==', entityCollection)
            .where('status', '==', 'active')
            .limit(1);

        const snapshot = await query.get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }

    /**
     * Merge entity with perspective overlay
     */
    _mergeEntityWithOverlay(entity, perspective) {
        // Deep clone entity
        const merged = JSON.parse(JSON.stringify(entity));

        // Add perspective metadata
        merged._perspective = {
            id: perspective.id,
            userId: perspective.userId,
            userName: perspective.userName,
            overlayedFields: [],
            customFields: []
        };

        // Apply alternative description if provided
        if (perspective.alternativeDescription) {
            merged.description = perspective.alternativeDescription;
            merged._perspective.overlayedFields.push('description');
        }

        // Add public notes as extra content
        if (perspective.publicNotes) {
            merged.perspectiveNotes = perspective.publicNotes;
            merged._perspective.customFields.push('perspectiveNotes');
        }

        // Add custom metadata
        if (perspective.customMetadata && Object.keys(perspective.customMetadata).length > 0) {
            merged.customMetadata = perspective.customMetadata;
            merged._perspective.customFields.push(...Object.keys(perspective.customMetadata));
        }

        // Add personal tags
        if (perspective.personalTags && perspective.personalTags.length > 0) {
            merged.perspectiveTags = perspective.personalTags;
        }

        return merged;
    }

    /**
     * Check URL for perspective parameter
     */
    _checkUrlPerspective() {
        const perspectiveId = this._getPerspectiveFromUrl();
        if (perspectiveId && perspectiveId !== this.activePerspectiveId) {
            this.setActivePerspective(perspectiveId).catch(err => {
                console.error('[PerspectiveService] Failed to load URL perspective:', err);
            });
        }
    }

    /**
     * Get perspective ID from URL
     */
    _getPerspectiveFromUrl() {
        const hash = window.location.hash;

        // Check for ?perspective= parameter
        if (hash.includes('?')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            return params.get('perspective');
        }

        // Check for /p/{perspectiveId}/ pattern
        const match = hash.match(/\/p\/([^\/]+)\//);
        if (match) return match[1];

        return null;
    }

    /**
     * Dispatch perspective change event
     */
    _dispatchPerspectiveChange(perspective) {
        window.dispatchEvent(new CustomEvent('perspectiveChanged', {
            detail: { perspective }
        }));
    }

    /**
     * Increment view count (fire and forget)
     */
    _incrementViewCount(perspectiveId) {
        this.db.collection('user_perspectives').doc(perspectiveId).update({
            viewCount: firebase.firestore.FieldValue.increment(1)
        }).catch(err => {
            console.warn('[PerspectiveService] Failed to increment view count:', err);
        });
    }

    /**
     * Sanitize text content
     */
    _sanitizeText(text) {
        if (!text || typeof text !== 'string') return '';
        return text.trim().slice(0, 5000); // Max 5000 chars
    }

    /**
     * Sanitize custom metadata object
     */
    _sanitizeCustomMetadata(metadata) {
        if (!metadata || typeof metadata !== 'object') return {};

        const sanitized = {};
        const allowedKeys = Object.keys(metadata).slice(0, 20); // Max 20 custom fields

        for (const key of allowedKeys) {
            const value = metadata[key];
            // Only allow primitives
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Rate limit check
     */
    _checkRateLimit() {
        const now = Date.now();
        if (now > this.rateResetTime) {
            this.createCount = 0;
            this.rateResetTime = now + 3600000;
        }
        return this.createCount < this.maxCreatesPerHour;
    }

    /**
     * Cache helpers
     */
    _getFromCache(cache, key) {
        const entry = cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.CACHE_TTL) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    }

    _setCache(cache, key, data) {
        cache.set(key, { data, timestamp: Date.now() });
    }

    _clearFromCache(cache, key) {
        cache.delete(key);
    }

    _clearEntityCache(entityId) {
        // Clear all entity-related cache entries
        for (const [key] of this.entityOverlayCache) {
            if (key.includes(entityId)) {
                this.entityOverlayCache.delete(key);
            }
        }
    }
}

// Create singleton instance
window.perspectiveService = window.perspectiveService || new PerspectiveService();

// Also export class for explicit instantiation
if (typeof window !== 'undefined') {
    window.PerspectiveService = PerspectiveService;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Initialize (auto-initialized on first use):
 *    await perspectiveService.init();
 *
 * 2. Create a perspective:
 *    const perspective = await perspectiveService.createPerspective(
 *      { entityId: 'zeus', entityType: 'deity', entityCollection: 'deities' },
 *      {
 *        publicNotes: 'Zeus represents the father archetype...',
 *        personalTags: ['favorite', 'studied'],
 *        visibility: 'public'
 *      }
 *    );
 *
 * 3. Get perspectives for an entity:
 *    const perspectives = await perspectiveService.getPerspectivesForEntity(
 *      'zeus', 'deities', { sortBy: 'votes', limit: 10 }
 *    );
 *
 * 4. Set active perspective (for "view as user" mode):
 *    await perspectiveService.setActivePerspective('perspectiveId123');
 *
 * 5. Merge entity with active perspective:
 *    const mergedEntity = await perspectiveService.mergeWithPerspective(officialEntity);
 *
 * 6. Listen for perspective changes:
 *    window.addEventListener('perspectiveChanged', (event) => {
 *      const { perspective } = event.detail;
 *      console.log('Now viewing through:', perspective?.userName);
 *    });
 *
 * 7. URL-based perspective sharing:
 *    Navigate to: #/deity/greek/zeus?perspective=perspectiveId123
 */
