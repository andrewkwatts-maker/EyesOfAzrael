/**
 * User Notes Service
 *
 * Manages user annotations and notes on standard assets.
 * Notes are stored in Firestore under: user_notes/{assetType}/{assetId}/notes/{noteId}
 *
 * Features:
 * - CRUD operations for notes
 * - Real-time updates via Firestore listeners
 * - Spam prevention and rate limiting
 * - Duplicate detection
 * - User-specific note management
 */

class NotesService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.noteListeners = new Map(); // Track active listeners
        this.rateLimiter = new Map(); // Track user activity for rate limiting
        this.recentNotes = new Map(); // Track recent notes for duplicate detection

        // Rate limiting configuration
        this.MAX_NOTES_PER_HOUR = 10;
        this.MIN_NOTE_LENGTH = 20;
        this.MAX_NOTE_LENGTH = 2000;
        this.RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
    }

    /**
     * Initialize the service
     */
    async init() {
        if (this.db) return;

        if (!firebase || !firebase.firestore) {
            throw new Error('Firebase not initialized');
        }

        this.db = firebase.firestore();
        this.auth = firebase.auth();

        // Clean up rate limiter periodically (every 10 minutes)
        setInterval(() => this.cleanupRateLimiter(), 10 * 60 * 1000);
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.auth.currentUser;
    }

    /**
     * Check if user can create a note (rate limiting)
     */
    canCreateNote(userId) {
        const now = Date.now();
        const userActivity = this.rateLimiter.get(userId) || [];

        // Filter out old entries
        const recentActivity = userActivity.filter(
            timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
        );

        // Update the rate limiter
        this.rateLimiter.set(userId, recentActivity);

        return recentActivity.length < this.MAX_NOTES_PER_HOUR;
    }

    /**
     * Record note creation for rate limiting
     */
    recordNoteCreation(userId) {
        const userActivity = this.rateLimiter.get(userId) || [];
        userActivity.push(Date.now());
        this.rateLimiter.set(userId, userActivity);
    }

    /**
     * Check if note content is duplicate
     */
    isDuplicateNote(userId, assetId, content) {
        const key = `${userId}_${assetId}`;
        const recent = this.recentNotes.get(key);

        if (!recent) return false;

        // Check if similar content was posted recently (within 5 minutes)
        const now = Date.now();
        if (now - recent.timestamp < 5 * 60 * 1000 && recent.content === content.trim()) {
            return true;
        }

        return false;
    }

    /**
     * Record note content for duplicate detection
     */
    recordNoteContent(userId, assetId, content) {
        const key = `${userId}_${assetId}`;
        this.recentNotes.set(key, {
            content: content.trim(),
            timestamp: Date.now()
        });
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

    /**
     * Validate note content
     */
    validateNoteContent(content) {
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

        return { valid: true, content: trimmed };
    }

    /**
     * Create a new note
     * @param {string} assetType - Type of asset (deity, hero, creature, etc.)
     * @param {string} assetId - ID of the asset
     * @param {string} content - Note content (supports markdown)
     * @returns {Promise<Object>} Created note object
     */
    async createNote(assetType, assetId, content) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to create notes');
        }

        // Validate content
        const validation = this.validateNoteContent(content);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Check rate limiting
        if (!this.canCreateNote(user.uid)) {
            throw new Error(`Rate limit exceeded. Maximum ${this.MAX_NOTES_PER_HOUR} notes per hour`);
        }

        // Check for duplicate
        if (this.isDuplicateNote(user.uid, assetId, validation.content)) {
            throw new Error('You recently posted this exact note. Please wait before posting again.');
        }

        // Create note object
        const noteData = {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatar: user.photoURL || null,
            content: validation.content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            votes: 0,
            isEdited: false,
            assetType,
            assetId
        };

        // Save to Firestore
        const noteRef = await this.db
            .collection('user_notes')
            .doc(assetType)
            .collection(assetId)
            .add(noteData);

        // Record for rate limiting and duplicate detection
        this.recordNoteCreation(user.uid);
        this.recordNoteContent(user.uid, assetId, validation.content);

        console.log('Note created:', noteRef.id);

        return {
            id: noteRef.id,
            ...noteData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Update an existing note
     * @param {string} assetType - Type of asset
     * @param {string} assetId - ID of the asset
     * @param {string} noteId - ID of the note to update
     * @param {string} content - Updated content
     */
    async updateNote(assetType, assetId, noteId, content) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to update notes');
        }

        // Validate content
        const validation = this.validateNoteContent(content);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Get the note to verify ownership
        const noteRef = this.db
            .collection('user_notes')
            .doc(assetType)
            .collection(assetId)
            .doc(noteId);

        const noteDoc = await noteRef.get();
        if (!noteDoc.exists) {
            throw new Error('Note not found');
        }

        const noteData = noteDoc.data();
        if (noteData.userId !== user.uid) {
            throw new Error('You can only edit your own notes');
        }

        // Update the note
        await noteRef.update({
            content: validation.content,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isEdited: true
        });

        console.log('Note updated:', noteId);

        return {
            id: noteId,
            ...noteData,
            content: validation.content,
            updatedAt: new Date(),
            isEdited: true
        };
    }

    /**
     * Delete a note
     * @param {string} assetType - Type of asset
     * @param {string} assetId - ID of the asset
     * @param {string} noteId - ID of the note to delete
     */
    async deleteNote(assetType, assetId, noteId) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to delete notes');
        }

        // Get the note to verify ownership
        const noteRef = this.db
            .collection('user_notes')
            .doc(assetType)
            .collection(assetId)
            .doc(noteId);

        const noteDoc = await noteRef.get();
        if (!noteDoc.exists) {
            throw new Error('Note not found');
        }

        const noteData = noteDoc.data();
        if (noteData.userId !== user.uid) {
            throw new Error('You can only delete your own notes');
        }

        // Delete the note
        await noteRef.delete();

        console.log('Note deleted:', noteId);
    }

    /**
     * Get all notes for an asset
     * @param {string} assetType - Type of asset
     * @param {string} assetId - ID of the asset
     * @param {string} sortBy - Sort order: 'votes', 'recent', 'debated'
     * @param {number} limit - Maximum number of notes to return
     * @returns {Promise<Array>} Array of notes
     */
    async getNotes(assetType, assetId, sortBy = 'votes', limit = 50) {
        await this.init();

        let query = this.db
            .collection('user_notes')
            .doc(assetType)
            .collection(assetId);

        // Apply sorting
        switch (sortBy) {
            case 'votes':
                query = query.orderBy('votes', 'desc');
                break;
            case 'recent':
                query = query.orderBy('createdAt', 'desc');
                break;
            case 'debated':
                // Most debated = highest vote count (could be positive or negative)
                // For now, using absolute votes - would need separate tracking for debates
                query = query.orderBy('votes', 'desc');
                break;
            default:
                query = query.orderBy('votes', 'desc');
        }

        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();

        const notes = [];
        snapshot.forEach(doc => {
            notes.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return notes;
    }

    /**
     * Get notes created by a specific user
     * @param {string} userId - User ID
     * @param {number} limit - Maximum number of notes
     * @returns {Promise<Array>} Array of user's notes
     */
    async getUserNotes(userId, limit = 50) {
        await this.init();

        // This requires a collection group query
        // Note: Requires Firestore index for user_notes collection group
        const query = this.db
            .collectionGroup('notes')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        const snapshot = await query.get();

        const notes = [];
        snapshot.forEach(doc => {
            notes.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return notes;
    }

    /**
     * Listen to real-time updates for notes on an asset
     * @param {string} assetType - Type of asset
     * @param {string} assetId - ID of the asset
     * @param {Function} callback - Callback function to handle updates
     * @param {string} sortBy - Sort order
     * @returns {Function} Unsubscribe function
     */
    listenToNotes(assetType, assetId, callback, sortBy = 'votes') {
        if (!this.db) {
            this.init();
        }

        const listenerKey = `${assetType}_${assetId}`;

        // Unsubscribe from existing listener if any
        if (this.noteListeners.has(listenerKey)) {
            this.noteListeners.get(listenerKey)();
        }

        let query = this.db
            .collection('user_notes')
            .doc(assetType)
            .collection(assetId);

        // Apply sorting
        switch (sortBy) {
            case 'votes':
                query = query.orderBy('votes', 'desc');
                break;
            case 'recent':
                query = query.orderBy('createdAt', 'desc');
                break;
            case 'debated':
                query = query.orderBy('votes', 'desc');
                break;
            default:
                query = query.orderBy('votes', 'desc');
        }

        // Set up listener
        const unsubscribe = query.onSnapshot(snapshot => {
            const notes = [];
            snapshot.forEach(doc => {
                notes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(notes);
        }, error => {
            console.error('Error listening to notes:', error);
            callback([]);
        });

        // Store the unsubscribe function
        this.noteListeners.set(listenerKey, unsubscribe);

        return unsubscribe;
    }

    /**
     * Stop listening to notes
     * @param {string} assetType - Type of asset
     * @param {string} assetId - ID of the asset
     */
    stopListening(assetType, assetId) {
        const listenerKey = `${assetType}_${assetId}`;

        if (this.noteListeners.has(listenerKey)) {
            this.noteListeners.get(listenerKey)();
            this.noteListeners.delete(listenerKey);
        }
    }

    /**
     * Get note count for an asset
     * @param {string} assetType - Type of asset
     * @param {string} assetId - ID of the asset
     * @returns {Promise<number>} Number of notes
     */
    async getNoteCount(assetType, assetId) {
        await this.init();

        const snapshot = await this.db
            .collection('user_notes')
            .doc(assetType)
            .collection(assetId)
            .get();

        return snapshot.size;
    }

    /**
     * Clean up all listeners
     */
    cleanup() {
        for (const unsubscribe of this.noteListeners.values()) {
            unsubscribe();
        }
        this.noteListeners.clear();
    }
}

// Create singleton instance
window.notesService = window.notesService || new NotesService();
