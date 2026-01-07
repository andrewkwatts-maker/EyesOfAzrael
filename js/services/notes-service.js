/**
 * Notes Service
 *
 * Comprehensive service for managing user notes on mythology entities.
 * Notes allow users to contribute insights, annotations, and scholarly observations
 * to deities, creatures, heroes, and other mythological assets.
 *
 * Features:
 * - Full CRUD operations with Firebase Firestore
 * - Real-time updates via Firestore listeners
 * - Voting system (upvotes/downvotes)
 * - Rate limiting to prevent spam
 * - Duplicate detection
 * - Soft delete functionality
 * - Offline support with retry queue
 * - Multi-layer caching
 * - Pagination support
 *
 * Note Document Structure:
 * {
 *     id: 'auto-generated',
 *     entityId: 'zeus',
 *     entityCollection: 'deities',
 *     entityName: 'Zeus',
 *     userId: 'user123',
 *     userName: 'John Doe',
 *     userAvatar: 'url',
 *     content: 'Note content...',
 *     contentHtml: '<p>Rendered markdown</p>',
 *     upvoteCount: 0,
 *     downvoteCount: 0,
 *     netVotes: 0,
 *     status: 'active', // active, flagged, deleted
 *     createdAt: timestamp,
 *     updatedAt: timestamp
 * }
 *
 * Collection Structure:
 * notes/{noteId}
 * notes/{noteId}/votes/{userId}
 */

class NotesService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Listener management
        this.noteListeners = new Map();

        // Rate limiting configuration
        this.rateLimiter = new Map();
        this.MAX_NOTES_PER_HOUR = 10;
        this.RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

        // Content validation
        this.MIN_NOTE_LENGTH = 10;
        this.MAX_NOTE_LENGTH = 2000;

        // Duplicate detection
        this.recentNotes = new Map();
        this.DUPLICATE_WINDOW = 5 * 60 * 1000; // 5 minutes

        // Offline retry queue
        this.retryQueue = [];
        this.isProcessingQueue = false;

        // Caching
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes

        // Bind methods
        this.processRetryQueue = this.processRetryQueue.bind(this);
    }

    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initialized) return;

        if (!firebase || !firebase.firestore) {
            throw new Error('Firebase not initialized');
        }

        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.initialized = true;

        // Set up periodic cleanup
        setInterval(() => this.cleanupRateLimiter(), 10 * 60 * 1000);
        setInterval(() => this.cleanupRecentNotes(), 10 * 60 * 1000);

        // Set up online listener for retry queue
        if (typeof window !== 'undefined') {
            window.addEventListener('online', this.processRetryQueue);
        }

        console.log('[NotesService] Initialized successfully');
    }

    /**
     * Get the current authenticated user
     * @returns {firebase.User|null}
     */
    getCurrentUser() {
        return this.auth?.currentUser || null;
    }

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new note
     * @param {string} entityId - Entity ID (e.g., 'zeus')
     * @param {string} entityCollection - Collection name (e.g., 'deities')
     * @param {string} content - Note content (10-2000 chars)
     * @param {string} entityName - Display name of entity (optional)
     * @param {Array<string>} tags - Note category tags (optional)
     * @returns {Promise<{success: boolean, note?: Object, error?: string}>}
     */
    async createNote(entityId, entityCollection, content, entityName = '', tags = []) {
        try {
            await this.init();

            const user = this.getCurrentUser();
            if (!user) {
                return {
                    success: false,
                    error: 'You must be logged in to create notes',
                    code: 'AUTH_REQUIRED'
                };
            }

            // Validate content
            const validation = this.validateContent(content);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error,
                    code: 'VALIDATION_ERROR'
                };
            }

            // Check rate limiting
            if (!this.canCreateNote(user.uid)) {
                const remainingTime = this.getRateLimitRemainingTime(user.uid);
                return {
                    success: false,
                    error: `Rate limit exceeded. Maximum ${this.MAX_NOTES_PER_HOUR} notes per hour. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`,
                    code: 'RATE_LIMITED'
                };
            }

            // Check for duplicate
            if (this.isDuplicateNote(user.uid, entityId, validation.content)) {
                return {
                    success: false,
                    error: 'You recently posted this exact note. Please wait before posting again.',
                    code: 'DUPLICATE'
                };
            }

            // Render content to HTML (basic markdown support)
            const contentHtml = this.renderMarkdown(validation.content);

            // Create note document
            const noteData = {
                entityId,
                entityCollection,
                entityName: entityName || entityId,
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userAvatar: user.photoURL || null,
                content: validation.content,
                contentHtml,
                tags: tags || [],
                upvoteCount: 0,
                downvoteCount: 0,
                netVotes: 0,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Save to Firestore
            const noteRef = await this.db.collection('notes').add(noteData);

            // Record for rate limiting and duplicate detection
            this.recordNoteCreation(user.uid);
            this.recordNoteContent(user.uid, entityId, validation.content);

            // Invalidate cache for this entity
            this.invalidateCache(entityId, entityCollection);

            console.log('[NotesService] Note created:', noteRef.id);

            // Return created note with local timestamp
            const createdNote = {
                id: noteRef.id,
                ...noteData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Dispatch event for UI updates
            this.dispatchNoteEvent('noteCreated', createdNote);

            return {
                success: true,
                note: createdNote
            };

        } catch (error) {
            console.error('[NotesService] Create error:', error);

            // Queue for retry if offline
            if (this.isOfflineError(error)) {
                this.queueForRetry('create', { entityId, entityCollection, content, entityName });
                return {
                    success: false,
                    error: 'You are offline. Your note will be saved when you reconnect.',
                    code: 'OFFLINE',
                    queued: true
                };
            }

            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    /**
     * Update an existing note
     * @param {string} noteId - Note ID
     * @param {string} content - Updated content
     * @param {Array<string>} tags - Updated tags (optional)
     * @returns {Promise<{success: boolean, note?: Object, error?: string}>}
     */
    async updateNote(noteId, content, tags = null) {
        try {
            await this.init();

            const user = this.getCurrentUser();
            if (!user) {
                return {
                    success: false,
                    error: 'You must be logged in to update notes',
                    code: 'AUTH_REQUIRED'
                };
            }

            // Validate content
            const validation = this.validateContent(content);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error,
                    code: 'VALIDATION_ERROR'
                };
            }

            // Get the note to verify ownership
            const noteRef = this.db.collection('notes').doc(noteId);
            const noteDoc = await noteRef.get();

            if (!noteDoc.exists) {
                return {
                    success: false,
                    error: 'Note not found',
                    code: 'NOT_FOUND'
                };
            }

            const noteData = noteDoc.data();
            if (noteData.userId !== user.uid) {
                return {
                    success: false,
                    error: 'You can only edit your own notes',
                    code: 'PERMISSION_DENIED'
                };
            }

            if (noteData.status === 'deleted') {
                return {
                    success: false,
                    error: 'Cannot edit a deleted note',
                    code: 'INVALID_STATE'
                };
            }

            // Render content to HTML
            const contentHtml = this.renderMarkdown(validation.content);

            // Update the note
            const updateData = {
                content: validation.content,
                contentHtml,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isEdited: true
            };

            // Include tags if provided
            if (tags !== null) {
                updateData.tags = tags;
            }

            await noteRef.update(updateData);

            // Invalidate cache
            this.invalidateCache(noteData.entityId, noteData.entityCollection);

            console.log('[NotesService] Note updated:', noteId);

            const updatedNote = {
                id: noteId,
                ...noteData,
                ...updateData,
                updatedAt: new Date()
            };

            // Dispatch event
            this.dispatchNoteEvent('noteUpdated', updatedNote);

            return {
                success: true,
                note: updatedNote
            };

        } catch (error) {
            console.error('[NotesService] Update error:', error);

            if (this.isOfflineError(error)) {
                this.queueForRetry('update', { noteId, content });
                return {
                    success: false,
                    error: 'You are offline. Your update will be saved when you reconnect.',
                    code: 'OFFLINE',
                    queued: true
                };
            }

            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    /**
     * Delete a note (soft delete)
     * @param {string} noteId - Note ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async deleteNote(noteId) {
        try {
            await this.init();

            const user = this.getCurrentUser();
            if (!user) {
                return {
                    success: false,
                    error: 'You must be logged in to delete notes',
                    code: 'AUTH_REQUIRED'
                };
            }

            // Get the note to verify ownership
            const noteRef = this.db.collection('notes').doc(noteId);
            const noteDoc = await noteRef.get();

            if (!noteDoc.exists) {
                return {
                    success: false,
                    error: 'Note not found',
                    code: 'NOT_FOUND'
                };
            }

            const noteData = noteDoc.data();

            // Check if user is owner or admin
            const isOwner = noteData.userId === user.uid;
            const isAdmin = await this.isUserAdmin(user);

            if (!isOwner && !isAdmin) {
                return {
                    success: false,
                    error: 'You can only delete your own notes',
                    code: 'PERMISSION_DENIED'
                };
            }

            // Soft delete
            await noteRef.update({
                status: 'deleted',
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: user.uid
            });

            // Invalidate cache
            this.invalidateCache(noteData.entityId, noteData.entityCollection);

            console.log('[NotesService] Note deleted:', noteId);

            // Dispatch event
            this.dispatchNoteEvent('noteDeleted', { id: noteId, ...noteData });

            return { success: true };

        } catch (error) {
            console.error('[NotesService] Delete error:', error);

            if (this.isOfflineError(error)) {
                this.queueForRetry('delete', { noteId });
                return {
                    success: false,
                    error: 'You are offline. Your note will be deleted when you reconnect.',
                    code: 'OFFLINE',
                    queued: true
                };
            }

            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    /**
     * Get notes for an entity
     * @param {string} entityId - Entity ID
     * @param {string} entityCollection - Collection name
     * @param {Object} options - Query options
     * @returns {Promise<{success: boolean, notes?: Array, lastDoc?: any, hasMore?: boolean, error?: string}>}
     */
    async getNotesForEntity(entityId, entityCollection, options = {}) {
        try {
            await this.init();

            const {
                sortBy = 'netVotes',
                sortDirection = 'desc',
                limit = 20,
                startAfter = null,
                includeDeleted = false
            } = options;

            // Check cache first
            const cacheKey = this.getCacheKey(entityId, entityCollection, sortBy);
            if (!startAfter) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    console.log('[NotesService] Cache hit:', cacheKey);
                    return cached;
                }
            }

            // Build query
            let query = this.db.collection('notes')
                .where('entityId', '==', entityId)
                .where('entityCollection', '==', entityCollection);

            if (!includeDeleted) {
                query = query.where('status', '==', 'active');
            }

            // Apply sorting
            switch (sortBy) {
                case 'netVotes':
                case 'votes':
                    query = query.orderBy('netVotes', sortDirection);
                    break;
                case 'recent':
                case 'createdAt':
                    query = query.orderBy('createdAt', sortDirection);
                    break;
                case 'updatedAt':
                    query = query.orderBy('updatedAt', sortDirection);
                    break;
                default:
                    query = query.orderBy('netVotes', 'desc');
            }

            // Apply pagination
            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            query = query.limit(limit);

            // Execute query
            const snapshot = await query.get();

            const notes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...this.convertTimestamps(doc.data())
            }));

            const result = {
                success: true,
                notes,
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
                hasMore: notes.length === limit
            };

            // Cache first page only
            if (!startAfter) {
                this.setToCache(cacheKey, result);
            }

            return result;

        } catch (error) {
            console.error('[NotesService] GetNotesForEntity error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error),
                notes: []
            };
        }
    }

    /**
     * Get notes by a specific user
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<{success: boolean, notes?: Array, lastDoc?: any, hasMore?: boolean, error?: string}>}
     */
    async getUserNotes(userId, options = {}) {
        try {
            await this.init();

            const {
                limit = 20,
                startAfter = null,
                includeDeleted = false
            } = options;

            // Build query
            let query = this.db.collection('notes')
                .where('userId', '==', userId);

            if (!includeDeleted) {
                query = query.where('status', '==', 'active');
            }

            query = query.orderBy('createdAt', 'desc');

            // Apply pagination
            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            query = query.limit(limit);

            // Execute query
            const snapshot = await query.get();

            const notes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...this.convertTimestamps(doc.data())
            }));

            return {
                success: true,
                notes,
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
                hasMore: notes.length === limit
            };

        } catch (error) {
            console.error('[NotesService] GetUserNotes error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error),
                notes: []
            };
        }
    }

    /**
     * Get a single note by ID
     * @param {string} noteId - Note ID
     * @returns {Promise<{success: boolean, note?: Object, error?: string}>}
     */
    async getNote(noteId) {
        try {
            await this.init();

            const noteDoc = await this.db.collection('notes').doc(noteId).get();

            if (!noteDoc.exists) {
                return {
                    success: false,
                    error: 'Note not found',
                    code: 'NOT_FOUND'
                };
            }

            return {
                success: true,
                note: {
                    id: noteDoc.id,
                    ...this.convertTimestamps(noteDoc.data())
                }
            };

        } catch (error) {
            console.error('[NotesService] GetNote error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    /**
     * Get note count for an entity
     * @param {string} entityId - Entity ID
     * @param {string} entityCollection - Collection name
     * @returns {Promise<number>}
     */
    async getNoteCount(entityId, entityCollection) {
        try {
            await this.init();

            const snapshot = await this.db.collection('notes')
                .where('entityId', '==', entityId)
                .where('entityCollection', '==', entityCollection)
                .where('status', '==', 'active')
                .get();

            return snapshot.size;

        } catch (error) {
            console.error('[NotesService] GetNoteCount error:', error);
            return 0;
        }
    }

    // ==================== VOTING ====================

    /**
     * Vote on a note
     * @param {string} noteId - Note ID
     * @param {number} vote - 1 for upvote, -1 for downvote
     * @returns {Promise<{success: boolean, netVotes?: number, userVote?: number, error?: string}>}
     */
    async voteOnNote(noteId, vote) {
        try {
            await this.init();

            const user = this.getCurrentUser();
            if (!user) {
                return {
                    success: false,
                    error: 'You must be logged in to vote',
                    code: 'AUTH_REQUIRED'
                };
            }

            if (![1, -1].includes(vote)) {
                return {
                    success: false,
                    error: 'Invalid vote value. Must be 1 (upvote) or -1 (downvote)',
                    code: 'VALIDATION_ERROR'
                };
            }

            const noteRef = this.db.collection('notes').doc(noteId);
            const voteRef = noteRef.collection('votes').doc(user.uid);

            // Use transaction for atomicity
            const result = await this.db.runTransaction(async (transaction) => {
                const noteDoc = await transaction.get(noteRef);
                const voteDoc = await transaction.get(voteRef);

                if (!noteDoc.exists) {
                    throw new Error('Note not found');
                }

                const noteData = noteDoc.data();

                if (noteData.status !== 'active') {
                    throw new Error('Cannot vote on inactive notes');
                }

                let upvoteCount = noteData.upvoteCount || 0;
                let downvoteCount = noteData.downvoteCount || 0;
                let newUserVote = 0;

                if (voteDoc.exists) {
                    const existingVote = voteDoc.data().value;

                    if (existingVote === vote) {
                        // Remove vote (toggle off)
                        transaction.delete(voteRef);
                        if (vote === 1) upvoteCount--;
                        else downvoteCount--;
                        newUserVote = 0;
                    } else {
                        // Change vote
                        transaction.update(voteRef, {
                            value: vote,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        if (vote === 1) {
                            upvoteCount++;
                            downvoteCount--;
                        } else {
                            upvoteCount--;
                            downvoteCount++;
                        }
                        newUserVote = vote;
                    }
                } else {
                    // New vote
                    transaction.set(voteRef, {
                        userId: user.uid,
                        value: vote,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    if (vote === 1) upvoteCount++;
                    else downvoteCount++;
                    newUserVote = vote;
                }

                const netVotes = upvoteCount - downvoteCount;

                // Update note with new vote counts
                transaction.update(noteRef, {
                    upvoteCount,
                    downvoteCount,
                    netVotes,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                return {
                    netVotes,
                    upvoteCount,
                    downvoteCount,
                    userVote: newUserVote
                };
            });

            console.log('[NotesService] Vote recorded:', noteId, vote);

            // Dispatch event
            this.dispatchNoteEvent('noteVoted', {
                noteId,
                ...result
            });

            return {
                success: true,
                ...result
            };

        } catch (error) {
            console.error('[NotesService] Vote error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    /**
     * Get the user's vote on a note
     * @param {string} noteId - Note ID
     * @returns {Promise<{success: boolean, vote?: number, error?: string}>}
     */
    async getUserVote(noteId) {
        try {
            await this.init();

            const user = this.getCurrentUser();
            if (!user) {
                return { success: true, vote: 0 };
            }

            const voteDoc = await this.db
                .collection('notes')
                .doc(noteId)
                .collection('votes')
                .doc(user.uid)
                .get();

            return {
                success: true,
                vote: voteDoc.exists ? voteDoc.data().value : 0
            };

        } catch (error) {
            console.error('[NotesService] GetUserVote error:', error);
            return {
                success: false,
                error: error.message,
                vote: 0
            };
        }
    }

    /**
     * Get user's votes for multiple notes (batch)
     * @param {Array<string>} noteIds - Array of note IDs
     * @returns {Promise<{success: boolean, votes?: Object, error?: string}>}
     */
    async getUserVotesForNotes(noteIds) {
        try {
            await this.init();

            const user = this.getCurrentUser();
            if (!user) {
                return { success: true, votes: {} };
            }

            const votes = {};

            // Batch fetch votes (Firestore allows up to 10 concurrent reads efficiently)
            const batchSize = 10;
            for (let i = 0; i < noteIds.length; i += batchSize) {
                const batch = noteIds.slice(i, i + batchSize);
                const promises = batch.map(noteId =>
                    this.db.collection('notes').doc(noteId).collection('votes').doc(user.uid).get()
                );

                const results = await Promise.all(promises);

                results.forEach((doc, index) => {
                    const noteId = batch[index];
                    votes[noteId] = doc.exists ? doc.data().value : 0;
                });
            }

            return { success: true, votes };

        } catch (error) {
            console.error('[NotesService] GetUserVotesForNotes error:', error);
            return {
                success: false,
                error: error.message,
                votes: {}
            };
        }
    }

    // ==================== REAL-TIME UPDATES ====================

    /**
     * Subscribe to notes for an entity
     * @param {string} entityId - Entity ID
     * @param {string} entityCollection - Collection name
     * @param {Function} callback - Callback function(notes)
     * @param {Object} options - Query options
     * @returns {Function} Unsubscribe function
     */
    subscribeToNotes(entityId, entityCollection, callback, options = {}) {
        const listenerKey = `${entityCollection}_${entityId}`;

        // Unsubscribe from existing listener if any
        if (this.noteListeners.has(listenerKey)) {
            this.noteListeners.get(listenerKey)();
            this.noteListeners.delete(listenerKey);
        }

        if (!this.db) {
            console.warn('[NotesService] Not initialized. Call init() first.');
            return () => {};
        }

        const { sortBy = 'netVotes', limit = 50 } = options;

        let query = this.db.collection('notes')
            .where('entityId', '==', entityId)
            .where('entityCollection', '==', entityCollection)
            .where('status', '==', 'active');

        // Apply sorting
        switch (sortBy) {
            case 'netVotes':
            case 'votes':
                query = query.orderBy('netVotes', 'desc');
                break;
            case 'recent':
            case 'createdAt':
                query = query.orderBy('createdAt', 'desc');
                break;
            default:
                query = query.orderBy('netVotes', 'desc');
        }

        query = query.limit(limit);

        // Set up listener
        const unsubscribe = query.onSnapshot(
            (snapshot) => {
                const notes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...this.convertTimestamps(doc.data())
                }));
                callback(notes, null);
            },
            (error) => {
                console.error('[NotesService] Subscription error:', error);
                callback([], error);
            }
        );

        this.noteListeners.set(listenerKey, unsubscribe);
        return unsubscribe;
    }

    /**
     * Unsubscribe from notes
     * @param {string} entityId - Entity ID
     * @param {string} entityCollection - Collection name
     */
    unsubscribe(entityId, entityCollection) {
        const listenerKey = `${entityCollection}_${entityId}`;

        if (this.noteListeners.has(listenerKey)) {
            this.noteListeners.get(listenerKey)();
            this.noteListeners.delete(listenerKey);
            console.log('[NotesService] Unsubscribed:', listenerKey);
        }
    }

    /**
     * Unsubscribe from all listeners
     */
    unsubscribeAll() {
        for (const [key, unsubscribe] of this.noteListeners.entries()) {
            unsubscribe();
        }
        this.noteListeners.clear();
        console.log('[NotesService] All listeners cleared');
    }

    // ==================== RATE LIMITING ====================

    /**
     * Check if user can create a note
     * @param {string} userId - User ID
     * @returns {boolean}
     */
    canCreateNote(userId) {
        const now = Date.now();
        const userActivity = this.rateLimiter.get(userId) || [];

        // Filter to recent activity only
        const recentActivity = userActivity.filter(
            timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
        );

        this.rateLimiter.set(userId, recentActivity);
        return recentActivity.length < this.MAX_NOTES_PER_HOUR;
    }

    /**
     * Get remaining time until rate limit resets
     * @param {string} userId - User ID
     * @returns {number} Milliseconds until reset
     */
    getRateLimitRemainingTime(userId) {
        const userActivity = this.rateLimiter.get(userId) || [];
        if (userActivity.length === 0) return 0;

        const oldestActivity = Math.min(...userActivity);
        return Math.max(0, this.RATE_LIMIT_WINDOW - (Date.now() - oldestActivity));
    }

    /**
     * Record a note creation for rate limiting
     * @param {string} userId - User ID
     */
    recordNoteCreation(userId) {
        const userActivity = this.rateLimiter.get(userId) || [];
        userActivity.push(Date.now());
        this.rateLimiter.set(userId, userActivity);
    }

    /**
     * Clean up old rate limiter entries
     */
    cleanupRateLimiter() {
        const now = Date.now();
        for (const [userId, activity] of this.rateLimiter.entries()) {
            const recent = activity.filter(
                timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
            );
            if (recent.length === 0) {
                this.rateLimiter.delete(userId);
            } else {
                this.rateLimiter.set(userId, recent);
            }
        }
    }

    // ==================== DUPLICATE DETECTION ====================

    /**
     * Check if content is a duplicate
     * @param {string} userId - User ID
     * @param {string} entityId - Entity ID
     * @param {string} content - Note content
     * @returns {boolean}
     */
    isDuplicateNote(userId, entityId, content) {
        const key = `${userId}_${entityId}`;
        const recent = this.recentNotes.get(key);

        if (!recent) return false;

        const now = Date.now();
        if (now - recent.timestamp < this.DUPLICATE_WINDOW && recent.content === content.trim()) {
            return true;
        }

        return false;
    }

    /**
     * Record note content for duplicate detection
     * @param {string} userId - User ID
     * @param {string} entityId - Entity ID
     * @param {string} content - Note content
     */
    recordNoteContent(userId, entityId, content) {
        const key = `${userId}_${entityId}`;
        this.recentNotes.set(key, {
            content: content.trim(),
            timestamp: Date.now()
        });
    }

    /**
     * Clean up old duplicate detection entries
     */
    cleanupRecentNotes() {
        const now = Date.now();
        for (const [key, data] of this.recentNotes.entries()) {
            if (now - data.timestamp > this.DUPLICATE_WINDOW) {
                this.recentNotes.delete(key);
            }
        }
    }

    // ==================== VALIDATION ====================

    /**
     * Validate note content
     * @param {string} content - Content to validate
     * @returns {{valid: boolean, content?: string, error?: string}}
     */
    validateContent(content) {
        if (!content || typeof content !== 'string') {
            return { valid: false, error: 'Note content is required' };
        }

        const trimmed = content.trim();

        if (trimmed.length < this.MIN_NOTE_LENGTH) {
            return {
                valid: false,
                error: `Note must be at least ${this.MIN_NOTE_LENGTH} characters`
            };
        }

        if (trimmed.length > this.MAX_NOTE_LENGTH) {
            return {
                valid: false,
                error: `Note cannot exceed ${this.MAX_NOTE_LENGTH} characters`
            };
        }

        // Check for spam patterns
        if (this.containsSpam(trimmed)) {
            return {
                valid: false,
                error: 'Note contains prohibited content'
            };
        }

        return { valid: true, content: trimmed };
    }

    /**
     * Check for spam patterns
     * @param {string} content - Content to check
     * @returns {boolean}
     */
    containsSpam(content) {
        // Basic spam detection patterns
        const spamPatterns = [
            /(.)\1{10,}/,          // Same character repeated 10+ times
            /https?:\/\/[^\s]+/gi,  // URLs (could be relaxed if needed)
            /<script/i,             // Script tags
            /javascript:/i          // JavaScript protocol
        ];

        return spamPatterns.some(pattern => pattern.test(content));
    }

    // ==================== MARKDOWN RENDERING ====================

    /**
     * Render basic markdown to HTML
     * @param {string} content - Markdown content
     * @returns {string} HTML content
     */
    renderMarkdown(content) {
        if (!content) return '';

        let html = content
            // Escape HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Line breaks
            .replace(/\n/g, '<br>');

        return `<p>${html}</p>`;
    }

    // ==================== OFFLINE SUPPORT ====================

    /**
     * Queue an operation for retry when online
     * @param {string} operation - Operation type
     * @param {Object} data - Operation data
     */
    queueForRetry(operation, data) {
        this.retryQueue.push({
            operation,
            data,
            timestamp: Date.now()
        });

        // Persist queue to localStorage
        try {
            localStorage.setItem('notes_retry_queue', JSON.stringify(this.retryQueue));
        } catch (e) {
            console.warn('[NotesService] Could not persist retry queue');
        }
    }

    /**
     * Process the retry queue
     */
    async processRetryQueue() {
        if (this.isProcessingQueue || this.retryQueue.length === 0) return;

        this.isProcessingQueue = true;
        console.log('[NotesService] Processing retry queue:', this.retryQueue.length);

        const queue = [...this.retryQueue];
        this.retryQueue = [];

        for (const item of queue) {
            try {
                switch (item.operation) {
                    case 'create':
                        await this.createNote(
                            item.data.entityId,
                            item.data.entityCollection,
                            item.data.content,
                            item.data.entityName
                        );
                        break;
                    case 'update':
                        await this.updateNote(item.data.noteId, item.data.content);
                        break;
                    case 'delete':
                        await this.deleteNote(item.data.noteId);
                        break;
                }
            } catch (error) {
                console.error('[NotesService] Retry failed:', error);
                // Re-queue if still offline
                if (this.isOfflineError(error)) {
                    this.retryQueue.push(item);
                }
            }
        }

        // Update persisted queue
        try {
            localStorage.setItem('notes_retry_queue', JSON.stringify(this.retryQueue));
        } catch (e) {}

        this.isProcessingQueue = false;
    }

    /**
     * Load retry queue from localStorage
     */
    loadRetryQueue() {
        try {
            const stored = localStorage.getItem('notes_retry_queue');
            if (stored) {
                this.retryQueue = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('[NotesService] Could not load retry queue');
        }
    }

    // ==================== CACHING ====================

    /**
     * Get cache key
     * @param {string} entityId - Entity ID
     * @param {string} entityCollection - Collection name
     * @param {string} sortBy - Sort order
     * @returns {string}
     */
    getCacheKey(entityId, entityCollection, sortBy) {
        return `notes_${entityCollection}_${entityId}_${sortBy}`;
    }

    /**
     * Get from cache
     * @param {string} key - Cache key
     * @returns {Object|null}
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set to cache
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Invalidate cache for an entity
     * @param {string} entityId - Entity ID
     * @param {string} entityCollection - Collection name
     */
    invalidateCache(entityId, entityCollection) {
        const prefix = `notes_${entityCollection}_${entityId}`;
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
    }

    // ==================== HELPER METHODS ====================

    /**
     * Convert Firestore timestamps to JS Dates
     * @param {Object} data - Data object
     * @returns {Object}
     */
    convertTimestamps(data) {
        const converted = { ...data };

        if (data.createdAt?.toDate) {
            converted.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt?.toDate) {
            converted.updatedAt = data.updatedAt.toDate();
        }
        if (data.deletedAt?.toDate) {
            converted.deletedAt = data.deletedAt.toDate();
        }

        return converted;
    }

    /**
     * Check if error is an offline error
     * @param {Error} error - Error object
     * @returns {boolean}
     */
    isOfflineError(error) {
        return error.code === 'unavailable' ||
               error.message?.includes('offline') ||
               !navigator.onLine;
    }

    /**
     * Get error code from error
     * @param {Error} error - Error object
     * @returns {string}
     */
    getErrorCode(error) {
        if (error.code === 'permission-denied') return 'PERMISSION_DENIED';
        if (error.code === 'unavailable') return 'OFFLINE';
        if (error.code === 'not-found') return 'NOT_FOUND';
        if (error.code === 'already-exists') return 'DUPLICATE';
        return 'UNKNOWN_ERROR';
    }

    /**
     * Check if user is admin
     * @param {firebase.User} user - User object
     * @returns {Promise<boolean>}
     */
    async isUserAdmin(user) {
        if (!user) return false;

        // Check against known admin email
        const adminEmails = ['andrewkwatts@gmail.com'];
        return adminEmails.includes(user.email);
    }

    /**
     * Dispatch a note event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    dispatchNoteEvent(eventName, detail) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(eventName, { detail }));
        }
    }

    /**
     * Clean up the service
     */
    cleanup() {
        this.unsubscribeAll();
        this.clearCache();

        if (typeof window !== 'undefined') {
            window.removeEventListener('online', this.processRetryQueue);
        }

        console.log('[NotesService] Cleanup complete');
    }
}

// Create singleton instance
window.notesService = window.notesService || new NotesService();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotesService;
}
