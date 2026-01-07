/**
 * Relationship Service
 *
 * Manages user-suggested relationships between mythology entities.
 * Allows users to propose connections that don't exist in official data.
 *
 * Features:
 * - Suggest relationships between entities
 * - Vote on relationship suggestions
 * - View pending/approved suggestions
 * - Filter by relationship type
 * - Real-time updates
 *
 * Firestore Structure:
 * user_relationships/{relationshipId}
 * ├── fromEntityId, fromEntityType, toEntityId, toEntityType
 * ├── relationshipType: parallel | derived | family | thematic
 * ├── title, description, evidence[], tags[]
 * ├── suggestedBy, suggestedByName
 * ├── upvoteCount, downvoteCount, netVotes, status
 * └── createdAt, updatedAt
 */

class RelationshipService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Valid relationship types
        this.RELATIONSHIP_TYPES = [
            'parallel',      // Cross-mythology parallel (Zeus ↔ Odin)
            'derived',       // One derived from another
            'influenced',    // Cultural influence
            'contrasts',     // Opposing roles/aspects
            'similar',       // Similar functions/roles
            'family',        // Mythological family relationship
            'mythological',  // Within-myth relationship
            'historical',    // Historical connection
            'thematic',      // Shared themes
            'symbolic'       // Shared symbolism
        ];

        // Cache
        this.relationshipCache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000;

        // Active listeners
        this.activeListeners = new Map();

        // Rate limiting
        this.suggestCount = 0;
        this.maxSuggestsPerHour = 15;
        this.rateResetTime = Date.now() + 3600000;
    }

    /**
     * Initialize the service
     */
    async init() {
        if (this.initialized) return;

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            throw new Error('Firebase not initialized');
        }

        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.initialized = true;

        console.log('[RelationshipService] Initialized');
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.auth?.currentUser;
    }

    // ==================== CRUD OPERATIONS ====================

    /**
     * Suggest a relationship between two entities
     * @param {Object} from - { entityId, entityType, entityName, mythology }
     * @param {Object} to - { entityId, entityType, entityName, mythology }
     * @param {Object} data - { relationshipType, title, description, evidence, tags }
     * @returns {Promise<Object>} Created relationship suggestion
     */
    async suggestRelationship(from, to, data) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to suggest relationships');
        }

        // Rate limiting
        if (!this._checkRateLimit()) {
            throw new Error('Too many suggestions. Please wait before suggesting more.');
        }

        // Validate inputs
        this._validateEntityRef(from, 'from');
        this._validateEntityRef(to, 'to');

        if (!data.relationshipType || !this.RELATIONSHIP_TYPES.includes(data.relationshipType)) {
            throw new Error(`Invalid relationship type. Must be one of: ${this.RELATIONSHIP_TYPES.join(', ')}`);
        }

        if (!data.title || data.title.length < 5) {
            throw new Error('Title must be at least 5 characters');
        }

        if (!data.description || data.description.length < 20) {
            throw new Error('Description must be at least 20 characters');
        }

        // Check for duplicate
        const existing = await this._findExistingRelationship(from.entityId, to.entityId, user.uid);
        if (existing) {
            throw new Error('You already suggested a relationship between these entities');
        }

        // Build document
        const relationshipData = {
            // From entity
            fromEntityId: from.entityId,
            fromEntityType: from.entityType,
            fromEntityName: from.entityName || from.entityId,
            fromMythology: from.mythology || 'unknown',

            // To entity
            toEntityId: to.entityId,
            toEntityType: to.entityType,
            toEntityName: to.entityName || to.entityId,
            toMythology: to.mythology || 'unknown',

            // Relationship details
            relationshipType: data.relationshipType,
            direction: data.direction || 'bidirectional',
            strength: data.strength || 'moderate',
            title: this._sanitizeText(data.title, 200),
            description: this._sanitizeText(data.description, 2000),
            evidence: Array.isArray(data.evidence)
                ? data.evidence.slice(0, 5).map(e => this._sanitizeText(e, 500))
                : [],
            tags: Array.isArray(data.tags)
                ? data.tags.slice(0, 10)
                : [],

            // Attribution
            suggestedBy: user.uid,
            suggestedByName: user.displayName || 'Anonymous',
            suggestedByEmail: user.email,
            suggestedByAvatar: user.photoURL || null,

            // Engagement
            upvoteCount: 0,
            downvoteCount: 0,
            netVotes: 0,
            commentCount: 0,

            // Status
            status: 'pending',
            reviewedBy: null,
            reviewedAt: null,
            reviewNotes: null,
            isOfficial: false,

            // Timestamps
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firestore
        const docRef = await this.db.collection('user_relationships').add(relationshipData);

        this.suggestCount++;

        console.log('[RelationshipService] Created relationship suggestion:', docRef.id);

        return {
            id: docRef.id,
            ...relationshipData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Get a relationship by ID
     * @param {string} relationshipId - Relationship ID
     * @returns {Promise<Object|null>}
     */
    async getRelationship(relationshipId) {
        await this.init();

        const doc = await this.db.collection('user_relationships').doc(relationshipId).get();

        if (!doc.exists) return null;

        const relationship = { id: doc.id, ...doc.data() };

        // Check if user can view pending/rejected
        const user = this.getCurrentUser();
        if (relationship.status !== 'approved' && relationship.suggestedBy !== user?.uid) {
            return null;
        }

        return relationship;
    }

    /**
     * Update a relationship suggestion
     * @param {string} relationshipId - Relationship ID
     * @param {Object} updates - Fields to update
     */
    async updateRelationship(relationshipId, updates) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in');
        }

        const docRef = this.db.collection('user_relationships').doc(relationshipId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Relationship not found');
        }

        const existing = doc.data();

        if (existing.suggestedBy !== user.uid) {
            throw new Error('You can only edit your own suggestions');
        }

        if (!['pending', 'rejected'].includes(existing.status)) {
            throw new Error('Cannot edit approved relationships');
        }

        const updateData = {
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (updates.title !== undefined) {
            updateData.title = this._sanitizeText(updates.title, 200);
        }
        if (updates.description !== undefined) {
            updateData.description = this._sanitizeText(updates.description, 2000);
        }
        if (updates.evidence !== undefined) {
            updateData.evidence = Array.isArray(updates.evidence)
                ? updates.evidence.slice(0, 5).map(e => this._sanitizeText(e, 500))
                : [];
        }
        if (updates.tags !== undefined) {
            updateData.tags = Array.isArray(updates.tags) ? updates.tags.slice(0, 10) : [];
        }

        // If was rejected, reset to pending
        if (existing.status === 'rejected') {
            updateData.status = 'pending';
        }

        await docRef.update(updateData);

        console.log('[RelationshipService] Updated relationship:', relationshipId);

        return { id: relationshipId, ...existing, ...updateData };
    }

    /**
     * Delete a relationship suggestion
     * @param {string} relationshipId - Relationship ID
     */
    async deleteRelationship(relationshipId) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in');
        }

        const docRef = this.db.collection('user_relationships').doc(relationshipId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Relationship not found');
        }

        const existing = doc.data();

        if (existing.suggestedBy !== user.uid) {
            throw new Error('You can only delete your own suggestions');
        }

        if (existing.status === 'approved') {
            throw new Error('Cannot delete approved relationships');
        }

        await docRef.delete();

        console.log('[RelationshipService] Deleted relationship:', relationshipId);
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get relationships for an entity
     * @param {string} entityId - Entity ID
     * @param {Object} options - { status, type, direction, limit }
     * @returns {Promise<Array>}
     */
    async getRelationshipsForEntity(entityId, options = {}) {
        await this.init();

        const { status = 'approved', type = null, limit = 20 } = options;

        // Query relationships where entity is either from or to
        const queries = [
            this.db.collection('user_relationships')
                .where('fromEntityId', '==', entityId)
                .where('status', '==', status),
            this.db.collection('user_relationships')
                .where('toEntityId', '==', entityId)
                .where('status', '==', status)
        ];

        const results = await Promise.all(queries.map(q => q.get()));

        const relationships = new Map();

        for (const snapshot of results) {
            snapshot.forEach(doc => {
                if (!relationships.has(doc.id)) {
                    relationships.set(doc.id, { id: doc.id, ...doc.data() });
                }
            });
        }

        let relationshipsArray = Array.from(relationships.values());

        // Filter by type if specified
        if (type) {
            relationshipsArray = relationshipsArray.filter(r => r.relationshipType === type);
        }

        // Sort by votes
        relationshipsArray.sort((a, b) => (b.netVotes || 0) - (a.netVotes || 0));

        return relationshipsArray.slice(0, limit);
    }

    /**
     * Get relationships suggested by a user
     * @param {string} userId - User ID
     * @param {Object} options - { status, limit }
     * @returns {Promise<Array>}
     */
    async getUserRelationships(userId, options = {}) {
        await this.init();

        const { status = null, limit = 50 } = options;

        let query = this.db.collection('user_relationships')
            .where('suggestedBy', '==', userId)
            .orderBy('createdAt', 'desc');

        if (status) {
            query = query.where('status', '==', status);
        }

        query = query.limit(limit);

        const snapshot = await query.get();

        const relationships = [];
        snapshot.forEach(doc => {
            relationships.push({ id: doc.id, ...doc.data() });
        });

        return relationships;
    }

    /**
     * Get pending relationships (for moderation)
     * @param {Object} options - { type, limit }
     * @returns {Promise<Array>}
     */
    async getPendingRelationships(options = {}) {
        await this.init();

        const { type = null, limit = 50 } = options;

        let query = this.db.collection('user_relationships')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc');

        if (type) {
            query = query.where('relationshipType', '==', type);
        }

        query = query.limit(limit);

        const snapshot = await query.get();

        const relationships = [];
        snapshot.forEach(doc => {
            relationships.push({ id: doc.id, ...doc.data() });
        });

        return relationships;
    }

    /**
     * Search for relationships
     * @param {Object} filters - { mythology, type, status }
     * @param {number} limit - Max results
     * @returns {Promise<Array>}
     */
    async searchRelationships(filters = {}, limit = 20) {
        await this.init();

        let query = this.db.collection('user_relationships')
            .where('status', '==', filters.status || 'approved');

        if (filters.mythology) {
            // Search in either from or to mythology
            query = query.where('fromMythology', '==', filters.mythology);
        }

        if (filters.type) {
            query = query.where('relationshipType', '==', filters.type);
        }

        query = query.orderBy('netVotes', 'desc').limit(limit);

        const snapshot = await query.get();

        const relationships = [];
        snapshot.forEach(doc => {
            relationships.push({ id: doc.id, ...doc.data() });
        });

        return relationships;
    }

    // ==================== VOTING ====================

    /**
     * Vote on a relationship
     * @param {string} relationshipId - Relationship ID
     * @param {number} vote - 1 for upvote, -1 for downvote
     * @returns {Promise<Object>} Vote result
     */
    async voteOnRelationship(relationshipId, vote) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to vote');
        }

        if (![1, -1].includes(vote)) {
            throw new Error('Invalid vote value');
        }

        const relationshipRef = this.db.collection('user_relationships').doc(relationshipId);
        const voteRef = this.db.collection('user_relationships')
            .doc(relationshipId)
            .collection('votes')
            .doc(user.uid);

        const result = await this.db.runTransaction(async (transaction) => {
            const relationshipDoc = await transaction.get(relationshipRef);
            const voteDoc = await transaction.get(voteRef);

            if (!relationshipDoc.exists) {
                throw new Error('Relationship not found');
            }

            const relationship = relationshipDoc.data();
            let upvotes = relationship.upvoteCount || 0;
            let downvotes = relationship.downvoteCount || 0;

            if (voteDoc.exists) {
                const oldVote = voteDoc.data().value;

                if (oldVote === vote) {
                    // Remove vote
                    transaction.delete(voteRef);
                    if (vote === 1) upvotes--;
                    else downvotes--;
                } else {
                    // Change vote
                    transaction.update(voteRef, { value: vote, timestamp: Date.now() });
                    if (vote === 1) {
                        upvotes++;
                        downvotes--;
                    } else {
                        downvotes++;
                        upvotes--;
                    }
                }
            } else {
                // New vote
                transaction.set(voteRef, {
                    value: vote,
                    userId: user.uid,
                    timestamp: Date.now()
                });
                if (vote === 1) upvotes++;
                else downvotes++;
            }

            const netVotes = upvotes - downvotes;

            transaction.update(relationshipRef, {
                upvoteCount: upvotes,
                downvoteCount: downvotes,
                netVotes: netVotes,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { upvoteCount: upvotes, downvoteCount: downvotes, netVotes };
        });

        return { success: true, ...result };
    }

    /**
     * Get user's vote on a relationship
     * @param {string} relationshipId - Relationship ID
     * @returns {Promise<number>} 1, -1, or 0
     */
    async getUserVote(relationshipId) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) return 0;

        const voteDoc = await this.db.collection('user_relationships')
            .doc(relationshipId)
            .collection('votes')
            .doc(user.uid)
            .get();

        return voteDoc.exists ? voteDoc.data().value : 0;
    }

    // ==================== REAL-TIME UPDATES ====================

    /**
     * Subscribe to relationships for an entity
     */
    subscribeToRelationships(entityId, callback) {
        if (!this.db) this.init();

        const listenerKey = `relationships_${entityId}`;

        if (this.activeListeners.has(listenerKey)) {
            this.activeListeners.get(listenerKey)();
        }

        // Listen for relationships where entity is "from"
        const query = this.db.collection('user_relationships')
            .where('fromEntityId', '==', entityId)
            .where('status', '==', 'approved')
            .orderBy('netVotes', 'desc')
            .limit(20);

        const unsubscribe = query.onSnapshot(
            snapshot => {
                const relationships = [];
                snapshot.forEach(doc => {
                    relationships.push({ id: doc.id, ...doc.data() });
                });
                callback(relationships);
            },
            error => {
                console.error('[RelationshipService] Listener error:', error);
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
     * Cleanup listeners
     */
    cleanup() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();
    }

    // ==================== PRIVATE HELPERS ====================

    _validateEntityRef(ref, name) {
        if (!ref || !ref.entityId || !ref.entityType) {
            throw new Error(`Invalid ${name} entity reference`);
        }
    }

    async _findExistingRelationship(fromId, toId, userId) {
        const query = this.db.collection('user_relationships')
            .where('suggestedBy', '==', userId)
            .where('fromEntityId', '==', fromId)
            .where('toEntityId', '==', toId)
            .limit(1);

        const snapshot = await query.get();
        return !snapshot.empty;
    }

    _sanitizeText(text, maxLength) {
        if (!text || typeof text !== 'string') return '';
        return text.trim().slice(0, maxLength);
    }

    _checkRateLimit() {
        const now = Date.now();
        if (now > this.rateResetTime) {
            this.suggestCount = 0;
            this.rateResetTime = now + 3600000;
        }
        return this.suggestCount < this.maxSuggestsPerHour;
    }
}

// Create singleton instance
window.relationshipService = window.relationshipService || new RelationshipService();

// Export class
if (typeof window !== 'undefined') {
    window.RelationshipService = RelationshipService;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Suggest a relationship:
 *    const relationship = await relationshipService.suggestRelationship(
 *      { entityId: 'zeus', entityType: 'deity', entityName: 'Zeus', mythology: 'greek' },
 *      { entityId: 'odin', entityType: 'deity', entityName: 'Odin', mythology: 'norse' },
 *      {
 *        relationshipType: 'parallel',
 *        title: 'Sky Father Parallel',
 *        description: 'Both Zeus and Odin represent the Sky Father archetype...',
 *        evidence: ['Both derive from Proto-Indo-European *Dyeus', 'Similar roles'],
 *        tags: ['archetype', 'comparative']
 *      }
 *    );
 *
 * 2. Get relationships for an entity:
 *    const relationships = await relationshipService.getRelationshipsForEntity('zeus');
 *
 * 3. Vote on a relationship:
 *    await relationshipService.voteOnRelationship('relationshipId', 1); // upvote
 */
