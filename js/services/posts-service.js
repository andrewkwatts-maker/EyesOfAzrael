/**
 * Posts Service
 *
 * Manages public Reddit-style discussion posts on entity pages.
 * Posts support voting, threaded replies, section targeting, and sorting.
 *
 * Firestore Structure:
 *   entity_posts/{entityKey}                  — metadata doc (postCount, lastPostAt)
 *   entity_posts/{entityKey}/posts/{postId}   — individual posts
 *   entity_posts/{entityKey}/posts/{postId}/votes/{userId} — vote records
 *
 * entityKey format: {collection}_{entityId} (e.g., deities_zeus)
 */

class PostsService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;
        this.listeners = new Map();

        // Rate limiting
        this.rateLimiter = new Map();
        this.MAX_POSTS_PER_HOUR = 15;
        this.RATE_LIMIT_WINDOW = 60 * 60 * 1000;

        // Content validation
        this.MIN_POST_LENGTH = 10;
        this.MAX_POST_LENGTH = 5000;

        // Cache
        this.cache = new Map();
        this.cacheTTL = 3 * 60 * 1000; // 3 minutes
    }

    async init() {
        if (this.initialized) return;
        if (!firebase || !firebase.firestore) {
            throw new Error('Firebase not initialized');
        }
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.initialized = true;
        console.log('[PostsService] Initialized');
    }

    /**
     * Get the entity key for Firestore path
     */
    _entityKey(collection, entityId) {
        return `${collection}_${entityId}`;
    }

    /**
     * Get current authenticated user or null
     */
    _getCurrentUser() {
        return this.auth?.currentUser || null;
    }

    /**
     * Check if current user is admin
     */
    _isAdmin() {
        const user = this._getCurrentUser();
        return user?.email === 'andrewkwatts@gmail.com';
    }

    /**
     * Check rate limit for current user
     */
    _checkRateLimit() {
        const user = this._getCurrentUser();
        if (!user) return false;
        if (this._isAdmin()) return true;

        const key = user.uid;
        const now = Date.now();
        const entries = this.rateLimiter.get(key) || [];

        // Remove old entries
        const recent = entries.filter(t => now - t < this.RATE_LIMIT_WINDOW);
        this.rateLimiter.set(key, recent);

        return recent.length < this.MAX_POSTS_PER_HOUR;
    }

    _recordRateLimit() {
        const user = this._getCurrentUser();
        if (!user) return;
        const key = user.uid;
        const entries = this.rateLimiter.get(key) || [];
        entries.push(Date.now());
        this.rateLimiter.set(key, entries);
    }

    /**
     * Create a new post
     * @param {Object} options
     * @param {string} options.collection - Entity collection
     * @param {string} options.entityId - Entity ID
     * @param {string} options.entityName - Entity display name
     * @param {string} options.content - Post content
     * @param {string|null} options.sectionRef - Optional section reference
     * @param {string|null} options.sectionTitle - Optional section display title
     * @param {string|null} options.parentId - Parent post ID for replies
     * @returns {Promise<Object>} Created post data
     */
    async createPost({ collection, entityId, entityName, content, sectionRef = null, sectionTitle = null, parentId = null }) {
        await this.init();

        const user = this._getCurrentUser();
        if (!user) throw new Error('Must be logged in to post');

        // Validate content
        const trimmed = content.trim();
        if (trimmed.length < this.MIN_POST_LENGTH) {
            throw new Error(`Post must be at least ${this.MIN_POST_LENGTH} characters`);
        }
        if (trimmed.length > this.MAX_POST_LENGTH) {
            throw new Error(`Post cannot exceed ${this.MAX_POST_LENGTH} characters`);
        }

        // Check rate limit
        if (!this._checkRateLimit()) {
            throw new Error('Rate limit reached. Please wait before posting again.');
        }

        const entityKey = this._entityKey(collection, entityId);
        const postsRef = this.db.collection('entity_posts').doc(entityKey).collection('posts');

        const postData = {
            content: trimmed,
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorAvatar: user.photoURL || null,
            sectionRef: sectionRef,
            sectionTitle: sectionTitle,
            parentId: parentId,
            netVotes: 0,
            upvoteCount: 0,
            downvoteCount: 0,
            replyCount: 0,
            status: 'published',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await postsRef.add(postData);

        // Update parent metadata doc
        const metaRef = this.db.collection('entity_posts').doc(entityKey);
        await metaRef.set({
            postCount: firebase.firestore.FieldValue.increment(1),
            lastPostAt: firebase.firestore.FieldValue.serverTimestamp(),
            entityCollection: collection,
            entityId: entityId,
            entityName: entityName
        }, { merge: true });

        // If this is a reply, increment parent's replyCount
        if (parentId) {
            const parentRef = postsRef.doc(parentId);
            await parentRef.update({
                replyCount: firebase.firestore.FieldValue.increment(1)
            });
        }

        this._recordRateLimit();
        this._invalidateCache(entityKey);

        return { id: docRef.id, ...postData, createdAt: new Date() };
    }

    /**
     * Get posts for an entity
     * @param {string} collection - Entity collection
     * @param {string} entityId - Entity ID
     * @param {Object} options - Sort/filter options
     * @param {string} options.sortBy - 'newest', 'votes', 'discussed'
     * @param {string|null} options.sectionFilter - Filter by section
     * @param {number} options.limit - Max posts to return
     * @returns {Promise<Array>} Array of posts
     */
    async getPosts(collection, entityId, { sortBy = 'newest', sectionFilter = null, limit = 50 } = {}) {
        await this.init();

        const entityKey = this._entityKey(collection, entityId);
        const cacheKey = `${entityKey}_${sortBy}_${sectionFilter || 'all'}_${limit}`;

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        const postsRef = this.db.collection('entity_posts').doc(entityKey).collection('posts');

        // Only get top-level posts (replies are fetched separately)
        let query = postsRef.where('parentId', '==', null).where('status', '==', 'published');

        // Apply section filter
        if (sectionFilter) {
            query = query.where('sectionRef', '==', sectionFilter);
        }

        // Apply sort
        switch (sortBy) {
            case 'votes':
                query = query.orderBy('netVotes', 'desc').orderBy('createdAt', 'desc');
                break;
            case 'discussed':
                query = query.orderBy('replyCount', 'desc').orderBy('createdAt', 'desc');
                break;
            case 'newest':
            default:
                query = query.orderBy('createdAt', 'desc');
                break;
        }

        query = query.limit(limit);

        const snapshot = await query.get();
        const posts = [];
        snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
        });

        // Cache results
        this.cache.set(cacheKey, { data: posts, timestamp: Date.now() });

        return posts;
    }

    /**
     * Get replies for a post
     */
    async getReplies(collection, entityId, parentId) {
        await this.init();

        const entityKey = this._entityKey(collection, entityId);
        const postsRef = this.db.collection('entity_posts').doc(entityKey).collection('posts');

        const snapshot = await postsRef
            .where('parentId', '==', parentId)
            .where('status', '==', 'published')
            .orderBy('createdAt', 'asc')
            .get();

        const replies = [];
        snapshot.forEach(doc => {
            replies.push({ id: doc.id, ...doc.data() });
        });

        return replies;
    }

    /**
     * Vote on a post
     * @param {string} collection - Entity collection
     * @param {string} entityId - Entity ID
     * @param {string} postId - Post ID
     * @param {number} value - Vote value (1 or -1)
     * @returns {Promise<Object>} Updated vote counts
     */
    async vote(collection, entityId, postId, value) {
        await this.init();

        const user = this._getCurrentUser();
        if (!user) throw new Error('Must be logged in to vote');

        if (value !== 1 && value !== -1) throw new Error('Invalid vote value');

        const entityKey = this._entityKey(collection, entityId);
        const postRef = this.db.collection('entity_posts').doc(entityKey).collection('posts').doc(postId);
        const voteRef = postRef.collection('votes').doc(user.uid);

        // Check existing vote
        const existingVote = await voteRef.get();
        const existingValue = existingVote.exists ? existingVote.data().value : 0;

        if (existingValue === value) {
            // Remove vote (toggle off)
            await voteRef.delete();
            await postRef.update({
                netVotes: firebase.firestore.FieldValue.increment(-value),
                upvoteCount: value === 1 ? firebase.firestore.FieldValue.increment(-1) : firebase.firestore.FieldValue.increment(0),
                downvoteCount: value === -1 ? firebase.firestore.FieldValue.increment(-1) : firebase.firestore.FieldValue.increment(0)
            });
            this._invalidateCache(entityKey);
            return { userVote: 0 };
        }

        // Set new vote
        await voteRef.set({ value, timestamp: firebase.firestore.FieldValue.serverTimestamp() });

        // Calculate increments
        let netIncrement = value;
        let upIncrement = value === 1 ? 1 : 0;
        let downIncrement = value === -1 ? 1 : 0;

        if (existingValue !== 0) {
            // Changing vote direction
            netIncrement = value * 2; // e.g., going from -1 to +1 = +2
            if (existingValue === 1) upIncrement = -1;
            if (existingValue === -1) downIncrement = -1;
            if (value === 1) upIncrement += 1;
            if (value === -1) downIncrement += 1;
        }

        await postRef.update({
            netVotes: firebase.firestore.FieldValue.increment(netIncrement),
            upvoteCount: firebase.firestore.FieldValue.increment(upIncrement),
            downvoteCount: firebase.firestore.FieldValue.increment(downIncrement)
        });

        this._invalidateCache(entityKey);
        return { userVote: value };
    }

    /**
     * Get current user's vote on a post
     */
    async getUserVote(collection, entityId, postId) {
        const user = this._getCurrentUser();
        if (!user) return 0;

        const entityKey = this._entityKey(collection, entityId);
        const voteRef = this.db.collection('entity_posts').doc(entityKey)
            .collection('posts').doc(postId)
            .collection('votes').doc(user.uid);

        const doc = await voteRef.get();
        return doc.exists ? doc.data().value : 0;
    }

    /**
     * Delete a post (admin or owner)
     */
    async deletePost(collection, entityId, postId) {
        await this.init();

        const user = this._getCurrentUser();
        if (!user) throw new Error('Must be logged in');

        const entityKey = this._entityKey(collection, entityId);
        const postRef = this.db.collection('entity_posts').doc(entityKey).collection('posts').doc(postId);

        const doc = await postRef.get();
        if (!doc.exists) throw new Error('Post not found');

        const postData = doc.data();

        // Check permissions
        if (postData.authorId !== user.uid && !this._isAdmin()) {
            throw new Error('Not authorized to delete this post');
        }

        // Soft delete
        await postRef.update({
            status: 'deleted',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update metadata counts
        const metaRef = this.db.collection('entity_posts').doc(entityKey);
        await metaRef.update({
            postCount: firebase.firestore.FieldValue.increment(-1)
        });

        // If reply, decrement parent's replyCount
        if (postData.parentId) {
            const parentRef = this.db.collection('entity_posts').doc(entityKey)
                .collection('posts').doc(postData.parentId);
            await parentRef.update({
                replyCount: firebase.firestore.FieldValue.increment(-1)
            });
        }

        this._invalidateCache(entityKey);
    }

    /**
     * Get post count for an entity
     */
    async getPostCount(collection, entityId) {
        await this.init();
        const entityKey = this._entityKey(collection, entityId);
        const metaDoc = await this.db.collection('entity_posts').doc(entityKey).get();
        return metaDoc.exists ? (metaDoc.data().postCount || 0) : 0;
    }

    /**
     * Listen for real-time post updates
     */
    listenToPosts(collection, entityId, callback) {
        const entityKey = this._entityKey(collection, entityId);
        const listenerKey = `posts_${entityKey}`;

        // Unsubscribe existing listener
        this.stopListening(listenerKey);

        const postsRef = this.db.collection('entity_posts').doc(entityKey).collection('posts');
        const query = postsRef
            .where('parentId', '==', null)
            .where('status', '==', 'published')
            .orderBy('createdAt', 'desc')
            .limit(50);

        const unsubscribe = query.onSnapshot(snapshot => {
            const posts = [];
            snapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });
            callback(posts);
        }, error => {
            console.error('[PostsService] Listener error:', error);
        });

        this.listeners.set(listenerKey, unsubscribe);
        return listenerKey;
    }

    /**
     * Stop listening to a specific listener
     */
    stopListening(key) {
        const unsubscribe = this.listeners.get(key);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(key);
        }
    }

    /**
     * Stop all listeners
     */
    stopAllListeners() {
        for (const [key, unsubscribe] of this.listeners) {
            unsubscribe();
        }
        this.listeners.clear();
    }

    /**
     * Invalidate cache for an entity
     */
    _invalidateCache(entityKey) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(entityKey)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Format a timestamp for display
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Auto-initialize
(function() {
    if (window.postsService) return;
    window.postsService = new PostsService();
    console.log('[PostsService] Registered globally');
})();
