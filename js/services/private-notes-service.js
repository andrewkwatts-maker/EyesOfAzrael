/**
 * Private Notes Service
 *
 * Manages private user annotations on entities.
 * Notes are only visible to the user who created them.
 * Supports: CRUD, ordering, filtering, priority, color-coding, tags.
 *
 * Firestore Structure:
 *   private_notes/{noteId}
 *     - userId (owner - access controlled)
 *     - entityCollection, entityId, entityName
 *     - sectionRef, sectionTitle (optional)
 *     - content (1-5000 chars)
 *     - priority (1-5)
 *     - color (hex string)
 *     - order (integer)
 *     - tags (string array)
 *     - status: "active"
 *     - createdAt, updatedAt
 */

class PrivateNotesService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    async init() {
        if (this.initialized) return;
        if (!firebase || !firebase.firestore) {
            throw new Error('Firebase not initialized');
        }
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.initialized = true;
        console.log('[PrivateNotesService] Initialized');
    }

    _getCurrentUser() {
        return this.auth?.currentUser || null;
    }

    _requireAuth() {
        const user = this._getCurrentUser();
        if (!user) throw new Error('Must be logged in');
        return user;
    }

    /**
     * Create a new private note
     */
    async createNote({ entityCollection, entityId, entityName, content, sectionRef = null, sectionTitle = null, priority = 3, color = '#8b7fff', tags = [] }) {
        await this.init();
        const user = this._requireAuth();

        const trimmed = content.trim();
        if (!trimmed) throw new Error('Note content cannot be empty');
        if (trimmed.length > 5000) throw new Error('Note cannot exceed 5000 characters');

        // Get next order number
        const existingNotes = await this.getNotes(entityCollection, entityId);
        const maxOrder = existingNotes.reduce((max, n) => Math.max(max, n.order || 0), 0);

        const noteData = {
            userId: user.uid,
            entityCollection,
            entityId,
            entityName: entityName || entityId,
            sectionRef,
            sectionTitle,
            content: trimmed,
            priority: Math.max(1, Math.min(5, priority)),
            color,
            order: maxOrder + 1,
            tags: tags.filter(t => t && typeof t === 'string'),
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await this.db.collection('private_notes').add(noteData);
        this._invalidateCache(entityCollection, entityId);

        return { id: docRef.id, ...noteData, createdAt: new Date(), updatedAt: new Date() };
    }

    /**
     * Get all notes for an entity (current user only)
     */
    async getNotes(entityCollection, entityId, { sortBy = 'order', sectionFilter = null, priorityFilter = null } = {}) {
        await this.init();
        const user = this._requireAuth();

        const cacheKey = `${user.uid}_${entityCollection}_${entityId}_${sortBy}_${sectionFilter || 'all'}_${priorityFilter || 'all'}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        let query = this.db.collection('private_notes')
            .where('userId', '==', user.uid)
            .where('entityCollection', '==', entityCollection)
            .where('entityId', '==', entityId)
            .where('status', '==', 'active');

        if (sectionFilter) {
            query = query.where('sectionRef', '==', sectionFilter);
        }

        if (priorityFilter) {
            query = query.where('priority', '==', priorityFilter);
        }

        const snapshot = await query.get();
        let notes = [];
        snapshot.forEach(doc => {
            notes.push({ id: doc.id, ...doc.data() });
        });

        // Sort client-side (Firestore compound indexes get complex)
        switch (sortBy) {
            case 'priority':
                notes.sort((a, b) => (b.priority || 3) - (a.priority || 3));
                break;
            case 'date':
                notes.sort((a, b) => {
                    const ta = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                    const tb = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                    return tb - ta;
                });
                break;
            case 'section':
                notes.sort((a, b) => (a.sectionRef || '').localeCompare(b.sectionRef || ''));
                break;
            case 'order':
            default:
                notes.sort((a, b) => (a.order || 0) - (b.order || 0));
                break;
        }

        this.cache.set(cacheKey, { data: notes, timestamp: Date.now() });
        return notes;
    }

    /**
     * Update a private note
     */
    async updateNote(noteId, updates) {
        await this.init();
        const user = this._requireAuth();

        const noteRef = this.db.collection('private_notes').doc(noteId);
        const doc = await noteRef.get();

        if (!doc.exists) throw new Error('Note not found');
        if (doc.data().userId !== user.uid) throw new Error('Not authorized');

        const allowedFields = ['content', 'priority', 'color', 'order', 'tags', 'sectionRef', 'sectionTitle'];
        const safeUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                safeUpdates[key] = value;
            }
        }

        if (safeUpdates.content !== undefined) {
            const trimmed = safeUpdates.content.trim();
            if (!trimmed) throw new Error('Note content cannot be empty');
            if (trimmed.length > 5000) throw new Error('Note cannot exceed 5000 characters');
            safeUpdates.content = trimmed;
        }

        if (safeUpdates.priority !== undefined) {
            safeUpdates.priority = Math.max(1, Math.min(5, safeUpdates.priority));
        }

        safeUpdates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await noteRef.update(safeUpdates);

        const noteData = doc.data();
        this._invalidateCache(noteData.entityCollection, noteData.entityId);
    }

    /**
     * Delete a private note (hard delete since it's private data)
     */
    async deleteNote(noteId) {
        await this.init();
        const user = this._requireAuth();

        const noteRef = this.db.collection('private_notes').doc(noteId);
        const doc = await noteRef.get();

        if (!doc.exists) throw new Error('Note not found');
        if (doc.data().userId !== user.uid) throw new Error('Not authorized');

        const noteData = doc.data();
        await noteRef.delete();
        this._invalidateCache(noteData.entityCollection, noteData.entityId);
    }

    /**
     * Reorder a note (move up or down)
     */
    async reorderNote(noteId, direction) {
        await this.init();
        const user = this._requireAuth();

        const noteRef = this.db.collection('private_notes').doc(noteId);
        const doc = await noteRef.get();
        if (!doc.exists) throw new Error('Note not found');

        const noteData = doc.data();
        if (noteData.userId !== user.uid) throw new Error('Not authorized');

        // Get all notes for this entity
        const notes = await this.getNotes(noteData.entityCollection, noteData.entityId);
        const currentIndex = notes.findIndex(n => n.id === noteId);

        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= notes.length) return;

        // Swap orders
        const currentOrder = notes[currentIndex].order || currentIndex;
        const targetOrder = notes[targetIndex].order || targetIndex;

        const batch = this.db.batch();
        batch.update(this.db.collection('private_notes').doc(noteId), { order: targetOrder });
        batch.update(this.db.collection('private_notes').doc(notes[targetIndex].id), { order: currentOrder });
        await batch.commit();

        this._invalidateCache(noteData.entityCollection, noteData.entityId);
    }

    /**
     * Get note count for an entity
     */
    async getNoteCount(entityCollection, entityId) {
        const notes = await this.getNotes(entityCollection, entityId);
        return notes.length;
    }

    _invalidateCache(entityCollection, entityId) {
        const prefix = `${this._getCurrentUser()?.uid}_${entityCollection}_${entityId}`;
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
}

// Auto-initialize
(function() {
    if (window.privateNotesService) return;
    window.privateNotesService = new PrivateNotesService();
    console.log('[PrivateNotesService] Registered globally');
})();
