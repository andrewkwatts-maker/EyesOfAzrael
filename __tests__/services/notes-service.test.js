/**
 * Notes Service Tests
 * Tests for js/services/notes-service.js
 *
 * Firestore is mocked at the SDK boundary with a path-addressable fake so that
 * `notes/{id}` and `notes/{id}/votes/{uid}` can be configured independently.
 * Conventions (global `firebase`, `jest.resetModules()` + require, fake timers)
 * match the neighbouring suites in this directory.
 */

// ---------------------------------------------------------------------------
// Firestore test doubles
// ---------------------------------------------------------------------------

/** A present document snapshot. */
function docSnap(id, data) {
    return { exists: true, id, data: () => data };
}

/** A missing document snapshot. */
function missingSnap(id) {
    return { exists: false, id, data: () => undefined };
}

/** A query snapshot over the supplied doc snapshots. */
function querySnap(snaps) {
    return {
        docs: snaps,
        size: snaps.length,
        empty: snaps.length === 0,
        forEach: (cb) => snaps.forEach(cb)
    };
}

/**
 * Path-addressable Firestore mock.
 * `docRef('notes/n1')` returns the same jest-mocked ref the service will get,
 * so tests can stub `.get()` and assert on `.update()` per document.
 */
function createFirestoreMock() {
    const docs = new Map();
    const cols = new Map();
    const transactions = [];

    function docRef(path) {
        if (!docs.has(path)) {
            const ref = {
                id: path.split('/').pop(),
                path,
                get: jest.fn(() => Promise.resolve(missingSnap(path.split('/').pop()))),
                set: jest.fn(() => Promise.resolve()),
                update: jest.fn(() => Promise.resolve()),
                delete: jest.fn(() => Promise.resolve()),
                collection: jest.fn((name) => collectionRef(`${path}/${name}`))
            };
            docs.set(path, ref);
        }
        return docs.get(path);
    }

    function collectionRef(path) {
        if (!cols.has(path)) {
            const ref = {
                path,
                doc: jest.fn((id) => docRef(`${path}/${id}`)),
                add: jest.fn(() => Promise.resolve(docRef(`${path}/generated-note-id`))),
                where: jest.fn(() => ref),
                orderBy: jest.fn(() => ref),
                limit: jest.fn(() => ref),
                startAfter: jest.fn(() => ref),
                get: jest.fn(() => Promise.resolve(querySnap([]))),
                onSnapshot: jest.fn(() => jest.fn())
            };
            cols.set(path, ref);
        }
        return cols.get(path);
    }

    const db = {
        collection: jest.fn((name) => collectionRef(name)),
        doc: jest.fn((path) => docRef(path)),
        runTransaction: jest.fn(async (fn) => {
            const transaction = {
                get: jest.fn((ref) => ref.get()),
                set: jest.fn(),
                update: jest.fn(),
                delete: jest.fn()
            };
            transactions.push(transaction);
            return fn(transaction);
        })
    };

    return { db, docRef, collectionRef, transactions };
}

/** A Firestore-shaped error. */
function firestoreError(code, message) {
    const err = new Error(message || code);
    err.code = code;
    return err;
}

describe('NotesService', () => {
    let NotesService;
    let fs;
    let mockFirestore;
    let mockAuth;
    let dispatchSpy;

    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = '';

        fs = createFirestoreMock();
        mockFirestore = fs.db;

        mockAuth = {
            currentUser: {
                uid: 'user123',
                displayName: 'Test User',
                email: 'test@example.com',
                photoURL: 'https://example.com/photo.jpg'
            }
        };

        // Mock firebase global
        global.firebase = {
            firestore: jest.fn(() => mockFirestore),
            auth: jest.fn(() => mockAuth),
        };
        global.firebase.firestore.FieldValue = {
            serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
            increment: jest.fn((n) => n),
            delete: jest.fn()
        };

        dispatchSpy = jest.spyOn(window, 'dispatchEvent');

        jest.resetModules();
        const mod = require('../../js/services/notes-service.js');
        NotesService = mod.NotesService || mod;
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        delete global.firebase;
    });

    /** Build an initialised service. */
    async function makeService() {
        const service = new NotesService();
        await service.init();
        return service;
    }

    /** Read the CustomEvent of the given type dispatched during the test. */
    function dispatchedEvent(type) {
        const call = dispatchSpy.mock.calls.find(([e]) => e && e.type === type);
        return call ? call[0] : null;
    }

    describe('constructor', () => {
        test('should initialize with default values', () => {
            const service = new NotesService();
            expect(service.initialized).toBe(false);
            expect(service.MAX_NOTES_PER_HOUR).toBe(10);
            expect(service.MIN_NOTE_LENGTH).toBe(10);
            expect(service.MAX_NOTE_LENGTH).toBe(2000);
        });

        test('should have empty retry queue', () => {
            const service = new NotesService();
            expect(service.retryQueue).toEqual([]);
        });
    });

    describe('init', () => {
        test('should initialize with Firebase', async () => {
            const service = new NotesService();
            await service.init();
            expect(service.initialized).toBe(true);
            expect(service.db).toBeTruthy();
            expect(service.auth).toBeTruthy();
        });

        test('should skip if already initialized', async () => {
            const service = new NotesService();
            await service.init();
            await service.init(); // second call
            expect(firebase.firestore).toHaveBeenCalledTimes(1);
        });

        test('should throw if Firebase not loaded', async () => {
            delete global.firebase;
            global.firebase = undefined;
            const service = new NotesService();
            await expect(service.init()).rejects.toThrow();
        });

        test('should register an online listener to drain the retry queue', async () => {
            const service = await makeService();
            expect(window.addEventListener).toHaveBeenCalledWith('online', service.processRetryQueue);
        });
    });

    describe('getCurrentUser', () => {
        test('should return current user when authenticated', async () => {
            const service = await makeService();
            const user = service.getCurrentUser();
            expect(user.uid).toBe('user123');
        });

        test('should return null when not authenticated', async () => {
            mockAuth.currentUser = null;
            const service = await makeService();
            expect(service.getCurrentUser()).toBeNull();
        });

        test('should return null before init when auth is unset', () => {
            const service = new NotesService();
            expect(service.getCurrentUser()).toBeNull();
        });
    });

    // =====================================================================
    // createNote
    // =====================================================================

    describe('createNote', () => {
        test('should require authentication', async () => {
            mockAuth.currentUser = null;
            const service = new NotesService();
            const result = await service.createNote('zeus', 'deities', 'This is a test note about Zeus');
            expect(result.success).toBe(false);
            expect(result.code).toBe('AUTH_REQUIRED');
        });

        test('should reject short content', async () => {
            const service = new NotesService();
            const result = await service.createNote('zeus', 'deities', 'short');
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        test('should reject content over max length', async () => {
            const service = new NotesService();
            const longContent = 'a'.repeat(2001);
            const result = await service.createNote('zeus', 'deities', longContent);
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        test('should not write to Firestore when validation fails', async () => {
            const service = await makeService();
            await service.createNote('zeus', 'deities', 'short');
            expect(fs.collectionRef('notes').add).not.toHaveBeenCalled();
        });

        test('should write a complete, sanitised note document', async () => {
            const service = await makeService();

            const result = await service.createNote(
                'zeus', 'deities', '  **Zeus** rules the sky  ', 'Zeus', ['scholarly']
            );

            expect(result.success).toBe(true);
            const written = fs.collectionRef('notes').add.mock.calls[0][0];
            expect(written).toMatchObject({
                entityId: 'zeus',
                entityCollection: 'deities',
                entityName: 'Zeus',
                userId: 'user123',
                userName: 'Test User',
                userAvatar: 'https://example.com/photo.jpg',
                content: '**Zeus** rules the sky',
                tags: ['scholarly'],
                upvoteCount: 0,
                downvoteCount: 0,
                netVotes: 0,
                status: 'active'
            });
            expect(written.contentHtml).toBe('<p><strong>Zeus</strong> rules the sky</p>');
            expect(written.createdAt).toBe('SERVER_TIMESTAMP');
        });

        test('should return the created note carrying the generated id', async () => {
            const service = await makeService();
            const result = await service.createNote('zeus', 'deities', 'A valid note about Zeus');
            expect(result.note.id).toBe('generated-note-id');
            expect(result.note.createdAt).toBeInstanceOf(Date);
        });

        test('should fall back to entityId and Anonymous when optional fields are absent', async () => {
            mockAuth.currentUser = { uid: 'user123', displayName: null, photoURL: null };
            const service = await makeService();

            await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            const written = fs.collectionRef('notes').add.mock.calls[0][0];
            expect(written.entityName).toBe('zeus');
            expect(written.userName).toBe('Anonymous');
            expect(written.userAvatar).toBeNull();
        });

        test('should dispatch noteCreated after a successful write', async () => {
            const service = await makeService();
            await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            const event = dispatchedEvent('noteCreated');
            expect(event).not.toBeNull();
            expect(event.detail.entityId).toBe('zeus');
            expect(event.detail.id).toBe('generated-note-id');
        });

        test('should invalidate the cached first page for the entity', async () => {
            const service = await makeService();
            const key = service.getCacheKey('zeus', 'deities', 'netVotes');
            service.setToCache(key, { success: true, notes: [] });

            await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            expect(service.getFromCache(key)).toBeNull();
        });

        test('should count the write against the rate limit', async () => {
            const service = await makeService();
            await service.createNote('zeus', 'deities', 'A valid note about Zeus');
            expect(service.rateLimiter.get('user123')).toHaveLength(1);
        });

        test('should refuse once the hourly rate limit is spent', async () => {
            const service = await makeService();
            for (let i = 0; i < service.MAX_NOTES_PER_HOUR; i++) {
                service.recordNoteCreation('user123');
            }

            const result = await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            expect(result.success).toBe(false);
            expect(result.code).toBe('RATE_LIMITED');
            expect(result.error).toContain('60 minutes');
            expect(fs.collectionRef('notes').add).not.toHaveBeenCalled();
        });

        test('should refuse an identical note posted twice within the duplicate window', async () => {
            const service = await makeService();
            await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            const second = await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            expect(second.success).toBe(false);
            expect(second.code).toBe('DUPLICATE');
            expect(fs.collectionRef('notes').add).toHaveBeenCalledTimes(1);
        });

        test('should allow the same text again once the duplicate window has passed', async () => {
            const service = await makeService();
            await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            jest.advanceTimersByTime(service.DUPLICATE_WINDOW + 1000);
            const second = await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            expect(second.success).toBe(true);
            expect(fs.collectionRef('notes').add).toHaveBeenCalledTimes(2);
        });

        test('should reject spam content before touching Firestore', async () => {
            const service = await makeService();
            const result = await service.createNote('zeus', 'deities', 'Buy now http://spam.example.com');
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
            expect(result.error).toContain('prohibited');
        });

        test('should surface a permission-denied write as PERMISSION_DENIED without queueing', async () => {
            const service = await makeService();
            fs.collectionRef('notes').add.mockRejectedValue(
                firestoreError('permission-denied', 'Missing or insufficient permissions.')
            );

            const result = await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            expect(result.success).toBe(false);
            expect(result.code).toBe('PERMISSION_DENIED');
            expect(result.queued).toBeUndefined();
            expect(service.retryQueue).toHaveLength(0);
        });

        test('should queue the note for retry when Firestore reports unavailable', async () => {
            const service = await makeService();
            fs.collectionRef('notes').add.mockRejectedValue(
                firestoreError('unavailable', 'Failed to get document because the client is offline.')
            );

            const result = await service.createNote('zeus', 'deities', 'A valid note about Zeus');

            expect(result.success).toBe(false);
            expect(result.code).toBe('OFFLINE');
            expect(result.queued).toBe(true);
            expect(service.retryQueue).toHaveLength(1);
            expect(service.retryQueue[0].operation).toBe('create');
            expect(service.retryQueue[0].data.entityId).toBe('zeus');
            expect(JSON.parse(localStorage.getItem('notes_retry_queue'))).toHaveLength(1);
        });

        test('should not spend the hourly allowance on writes that failed', async () => {
            const service = await makeService();
            fs.collectionRef('notes').add.mockRejectedValue(firestoreError('permission-denied'));

            for (let i = 0; i < service.MAX_NOTES_PER_HOUR + 2; i++) {
                await service.createNote('zeus', 'deities', `A valid note about Zeus ${i}`);
            }

            expect(service.rateLimiter.get('user123')).toEqual([]);
            expect(service.canCreateNote('user123')).toBe(true);
        });
    });

    // =====================================================================
    // updateNote
    // =====================================================================

    describe('updateNote', () => {
        test('should require authentication', async () => {
            mockAuth.currentUser = null;
            const service = new NotesService();
            const result = await service.updateNote('note1', 'An updated note body');
            expect(result.success).toBe(false);
            expect(result.code).toBe('AUTH_REQUIRED');
        });

        test('should reject invalid content before reading the note', async () => {
            const service = await makeService();
            const result = await service.updateNote('note1', 'tiny');
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
            expect(fs.docRef('notes/note1').get).not.toHaveBeenCalled();
        });

        test('should report NOT_FOUND for a missing note', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(missingSnap('note1'));

            const result = await service.updateNote('note1', 'An updated note body');

            expect(result.success).toBe(false);
            expect(result.code).toBe('NOT_FOUND');
            expect(fs.docRef('notes/note1').update).not.toHaveBeenCalled();
        });

        test('should refuse to edit another users note', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(
                docSnap('note1', { userId: 'someone-else', status: 'active' })
            );

            const result = await service.updateNote('note1', 'An updated note body');

            expect(result.success).toBe(false);
            expect(result.code).toBe('PERMISSION_DENIED');
            expect(fs.docRef('notes/note1').update).not.toHaveBeenCalled();
        });

        test('should refuse to edit a deleted note', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(
                docSnap('note1', { userId: 'user123', status: 'deleted' })
            );

            const result = await service.updateNote('note1', 'An updated note body');

            expect(result.success).toBe(false);
            expect(result.code).toBe('INVALID_STATE');
        });

        test('should write content, html and the edited flag', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(
                docSnap('note1', { userId: 'user123', status: 'active', entityId: 'zeus', entityCollection: 'deities' })
            );

            const result = await service.updateNote('note1', 'Zeus is *king* of Olympus');

            expect(result.success).toBe(true);
            const payload = fs.docRef('notes/note1').update.mock.calls[0][0];
            expect(payload.content).toBe('Zeus is *king* of Olympus');
            expect(payload.contentHtml).toBe('<p>Zeus is <em>king</em> of Olympus</p>');
            expect(payload.isEdited).toBe(true);
            expect(payload).not.toHaveProperty('tags');
        });

        test('should write tags only when they are supplied', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(
                docSnap('note1', { userId: 'user123', status: 'active' })
            );

            await service.updateNote('note1', 'An updated note body', ['myth', 'greek']);

            expect(fs.docRef('notes/note1').update.mock.calls[0][0].tags).toEqual(['myth', 'greek']);
        });

        test('should dispatch noteUpdated and invalidate the entity cache', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(
                docSnap('note1', { userId: 'user123', status: 'active', entityId: 'zeus', entityCollection: 'deities' })
            );
            const key = service.getCacheKey('zeus', 'deities', 'netVotes');
            service.setToCache(key, { success: true, notes: [] });

            await service.updateNote('note1', 'An updated note body');

            expect(service.getFromCache(key)).toBeNull();
            expect(dispatchedEvent('noteUpdated').detail.id).toBe('note1');
        });

        test('should queue an update that fails while offline', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockRejectedValue(firestoreError('unavailable'));

            const result = await service.updateNote('note1', 'An updated note body');

            expect(result.code).toBe('OFFLINE');
            expect(result.queued).toBe(true);
            expect(service.retryQueue[0]).toMatchObject({
                operation: 'update',
                data: { noteId: 'note1', content: 'An updated note body' }
            });
        });

        test('should map an unrecognised failure to UNKNOWN_ERROR', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockRejectedValue(new Error('boom'));

            const result = await service.updateNote('note1', 'An updated note body');

            expect(result.success).toBe(false);
            expect(result.code).toBe('UNKNOWN_ERROR');
            expect(result.error).toBe('boom');
        });
    });

    // =====================================================================
    // deleteNote
    // =====================================================================

    describe('deleteNote', () => {
        test('should require authentication', async () => {
            mockAuth.currentUser = null;
            const service = new NotesService();
            const result = await service.deleteNote('note1');
            expect(result.success).toBe(false);
            expect(result.code).toBe('AUTH_REQUIRED');
        });

        test('should report NOT_FOUND for a missing note', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(missingSnap('note1'));

            const result = await service.deleteNote('note1');

            expect(result.success).toBe(false);
            expect(result.code).toBe('NOT_FOUND');
        });

        test('should refuse deletion by a non-owner, non-admin user', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(
                docSnap('note1', { userId: 'someone-else', status: 'active' })
            );

            const result = await service.deleteNote('note1');

            expect(result.success).toBe(false);
            expect(result.code).toBe('PERMISSION_DENIED');
            expect(fs.docRef('notes/note1').update).not.toHaveBeenCalled();
        });

        test('should soft delete rather than remove the document', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(
                docSnap('note1', { userId: 'user123', status: 'active', entityId: 'zeus', entityCollection: 'deities' })
            );

            const result = await service.deleteNote('note1');

            expect(result.success).toBe(true);
            expect(fs.docRef('notes/note1').delete).not.toHaveBeenCalled();
            expect(fs.docRef('notes/note1').update).toHaveBeenCalledWith({
                status: 'deleted',
                deletedAt: 'SERVER_TIMESTAMP',
                deletedBy: 'user123'
            });
            expect(dispatchedEvent('noteDeleted').detail.id).toBe('note1');
        });

        test('should let an admin delete another users note', async () => {
            mockAuth.currentUser = { uid: 'admin1', email: 'andrewkwatts@gmail.com' };
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(
                docSnap('note1', { userId: 'someone-else', status: 'active' })
            );

            const result = await service.deleteNote('note1');

            expect(result.success).toBe(true);
            expect(fs.docRef('notes/note1').update.mock.calls[0][0].deletedBy).toBe('admin1');
        });

        test('should queue a delete that fails while offline', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockRejectedValue(firestoreError('unavailable'));

            const result = await service.deleteNote('note1');

            expect(result.code).toBe('OFFLINE');
            expect(service.retryQueue[0]).toMatchObject({ operation: 'delete', data: { noteId: 'note1' } });
        });

        test('should not queue a delete that was rejected on permission grounds', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(
                docSnap('note1', { userId: 'user123', status: 'active' })
            );
            fs.docRef('notes/note1').update.mockRejectedValue(
                firestoreError('permission-denied', 'Missing or insufficient permissions.')
            );

            const result = await service.deleteNote('note1');

            expect(result.success).toBe(false);
            expect(result.code).toBe('PERMISSION_DENIED');
            expect(service.retryQueue).toHaveLength(0);
        });
    });

    // =====================================================================
    // getNotesForEntity
    // =====================================================================

    describe('getNotesForEntity', () => {
        function stubQuery(snaps) {
            fs.collectionRef('notes').get.mockResolvedValue(querySnap(snaps));
        }

        test('should map documents and expose the pagination cursor', async () => {
            const service = await makeService();
            stubQuery([
                docSnap('n1', { content: 'first', netVotes: 3 }),
                docSnap('n2', { content: 'second', netVotes: 1 })
            ]);

            const result = await service.getNotesForEntity('zeus', 'deities', { limit: 2 });

            expect(result.success).toBe(true);
            expect(result.notes).toEqual([
                { id: 'n1', content: 'first', netVotes: 3 },
                { id: 'n2', content: 'second', netVotes: 1 }
            ]);
            expect(result.lastDoc.id).toBe('n2');
            expect(result.hasMore).toBe(true);
        });

        test('should report hasMore false and a null cursor for an empty page', async () => {
            const service = await makeService();
            stubQuery([]);

            const result = await service.getNotesForEntity('zeus', 'deities');

            expect(result.notes).toEqual([]);
            expect(result.lastDoc).toBeNull();
            expect(result.hasMore).toBe(false);
        });

        test('should filter to active notes and sort by netVotes by default', async () => {
            const service = await makeService();
            stubQuery([]);
            const col = fs.collectionRef('notes');

            await service.getNotesForEntity('zeus', 'deities');

            expect(col.where).toHaveBeenCalledWith('entityId', '==', 'zeus');
            expect(col.where).toHaveBeenCalledWith('entityCollection', '==', 'deities');
            expect(col.where).toHaveBeenCalledWith('status', '==', 'active');
            expect(col.orderBy).toHaveBeenCalledWith('netVotes', 'desc');
            expect(col.limit).toHaveBeenCalledWith(20);
        });

        test('should drop the status filter when deleted notes are requested', async () => {
            const service = await makeService();
            stubQuery([]);

            await service.getNotesForEntity('zeus', 'deities', { includeDeleted: true });

            expect(fs.collectionRef('notes').where).not.toHaveBeenCalledWith('status', '==', 'active');
        });

        test('should order by createdAt when sorting by recent', async () => {
            const service = await makeService();
            stubQuery([]);

            await service.getNotesForEntity('zeus', 'deities', { sortBy: 'recent', sortDirection: 'asc' });

            expect(fs.collectionRef('notes').orderBy).toHaveBeenCalledWith('createdAt', 'asc');
        });

        test('should order by updatedAt when requested', async () => {
            const service = await makeService();
            stubQuery([]);

            await service.getNotesForEntity('zeus', 'deities', { sortBy: 'updatedAt' });

            expect(fs.collectionRef('notes').orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
        });

        test('should fall back to netVotes desc for an unknown sort key', async () => {
            const service = await makeService();
            stubQuery([]);

            await service.getNotesForEntity('zeus', 'deities', { sortBy: 'nonsense', sortDirection: 'asc' });

            expect(fs.collectionRef('notes').orderBy).toHaveBeenCalledWith('netVotes', 'desc');
        });

        test('should serve the second call for the same key from cache', async () => {
            const service = await makeService();
            stubQuery([docSnap('n1', { content: 'first' })]);

            const first = await service.getNotesForEntity('zeus', 'deities');
            const second = await service.getNotesForEntity('zeus', 'deities');

            expect(second).toEqual(first);
            expect(fs.collectionRef('notes').get).toHaveBeenCalledTimes(1);
        });

        test('should bypass and not populate the cache for paginated pages', async () => {
            const service = await makeService();
            stubQuery([docSnap('n3', { content: 'third' })]);
            const cursor = docSnap('n2', {});

            await service.getNotesForEntity('zeus', 'deities', { startAfter: cursor });

            expect(fs.collectionRef('notes').startAfter).toHaveBeenCalledWith(cursor);
            expect(service.getFromCache(service.getCacheKey('zeus', 'deities', 'netVotes'))).toBeNull();
        });

        test('should surface a missing composite index as a failed result rather than throwing', async () => {
            const service = await makeService();
            fs.collectionRef('notes').get.mockRejectedValue(
                firestoreError('failed-precondition', 'The query requires an index.')
            );

            const result = await service.getNotesForEntity('zeus', 'deities');

            expect(result.success).toBe(false);
            expect(result.notes).toEqual([]);
            expect(result.error).toContain('requires an index');
            expect(result.code).toBe('UNKNOWN_ERROR');
        });

        test('should not cache a failed query', async () => {
            const service = await makeService();
            fs.collectionRef('notes').get.mockRejectedValue(firestoreError('failed-precondition'));

            await service.getNotesForEntity('zeus', 'deities');

            expect(service.getFromCache(service.getCacheKey('zeus', 'deities', 'netVotes'))).toBeNull();
        });

        test('should convert Firestore timestamps to Dates', async () => {
            const service = await makeService();
            const when = new Date('2024-01-01T00:00:00Z');
            stubQuery([docSnap('n1', { content: 'x', createdAt: { toDate: () => when } })]);

            const result = await service.getNotesForEntity('zeus', 'deities');

            expect(result.notes[0].createdAt).toBe(when);
        });
    });

    // =====================================================================
    // getUserNotes / getNote / getNoteCount
    // =====================================================================

    describe('getUserNotes', () => {
        test('should filter by user and active status, newest first', async () => {
            const service = await makeService();
            fs.collectionRef('notes').get.mockResolvedValue(querySnap([docSnap('n1', { content: 'a' })]));

            const result = await service.getUserNotes('user123', { limit: 5 });

            expect(result.success).toBe(true);
            expect(result.notes).toHaveLength(1);
            expect(result.hasMore).toBe(false);
            const col = fs.collectionRef('notes');
            expect(col.where).toHaveBeenCalledWith('userId', '==', 'user123');
            expect(col.where).toHaveBeenCalledWith('status', '==', 'active');
            expect(col.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
            expect(col.limit).toHaveBeenCalledWith(5);
        });

        test('should include deleted notes when asked', async () => {
            const service = await makeService();
            fs.collectionRef('notes').get.mockResolvedValue(querySnap([]));

            await service.getUserNotes('user123', { includeDeleted: true });

            expect(fs.collectionRef('notes').where).not.toHaveBeenCalledWith('status', '==', 'active');
        });

        test('should apply the pagination cursor', async () => {
            const service = await makeService();
            fs.collectionRef('notes').get.mockResolvedValue(querySnap([]));
            const cursor = docSnap('n9', {});

            await service.getUserNotes('user123', { startAfter: cursor });

            expect(fs.collectionRef('notes').startAfter).toHaveBeenCalledWith(cursor);
        });

        test('should return an empty note list on failure', async () => {
            const service = await makeService();
            fs.collectionRef('notes').get.mockRejectedValue(firestoreError('permission-denied', 'nope'));

            const result = await service.getUserNotes('user123');

            expect(result.success).toBe(false);
            expect(result.code).toBe('PERMISSION_DENIED');
            expect(result.notes).toEqual([]);
        });
    });

    describe('getNote', () => {
        test('should return the note when it exists', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(docSnap('note1', { content: 'hello' }));

            const result = await service.getNote('note1');

            expect(result.success).toBe(true);
            expect(result.note).toEqual({ id: 'note1', content: 'hello' });
        });

        test('should report NOT_FOUND when it does not exist', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockResolvedValue(missingSnap('note1'));

            const result = await service.getNote('note1');

            expect(result.success).toBe(false);
            expect(result.code).toBe('NOT_FOUND');
        });

        test('should map a read failure to an error result', async () => {
            const service = await makeService();
            fs.docRef('notes/note1').get.mockRejectedValue(firestoreError('permission-denied', 'denied'));

            const result = await service.getNote('note1');

            expect(result.success).toBe(false);
            expect(result.code).toBe('PERMISSION_DENIED');
            expect(result.error).toBe('denied');
        });
    });

    describe('getNoteCount', () => {
        test('should return the number of active notes', async () => {
            const service = await makeService();
            fs.collectionRef('notes').get.mockResolvedValue(
                querySnap([docSnap('a', {}), docSnap('b', {}), docSnap('c', {})])
            );

            await expect(service.getNoteCount('zeus', 'deities')).resolves.toBe(3);
            expect(fs.collectionRef('notes').where).toHaveBeenCalledWith('status', '==', 'active');
        });

        test('should return 0 rather than throwing when the count query fails', async () => {
            const service = await makeService();
            fs.collectionRef('notes').get.mockRejectedValue(firestoreError('failed-precondition'));

            await expect(service.getNoteCount('zeus', 'deities')).resolves.toBe(0);
        });
    });

    // =====================================================================
    // voteOnNote
    // =====================================================================

    describe('voteOnNote', () => {
        const NOTE = 'notes/note1';
        const VOTE = 'notes/note1/votes/user123';

        /** Configure the note doc and the caller's vote doc. */
        function stubVoteState(noteData, voteData) {
            fs.docRef(NOTE).get.mockResolvedValue(
                noteData ? docSnap('note1', noteData) : missingSnap('note1')
            );
            fs.docRef(VOTE).get.mockResolvedValue(
                voteData ? docSnap('user123', voteData) : missingSnap('user123')
            );
        }

        test('should require authentication', async () => {
            mockAuth.currentUser = null;
            const service = new NotesService();
            const result = await service.voteOnNote('note1', 1);
            expect(result.success).toBe(false);
            expect(result.code).toBe('AUTH_REQUIRED');
        });

        test('should reject a vote value that is neither 1 nor -1', async () => {
            const service = await makeService();
            const result = await service.voteOnNote('note1', 5);
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
            expect(mockFirestore.runTransaction).not.toHaveBeenCalled();
        });

        test('should record a first-time upvote and bump the aggregate counts', async () => {
            const service = await makeService();
            stubVoteState({ status: 'active', upvoteCount: 4, downvoteCount: 1 }, null);

            const result = await service.voteOnNote('note1', 1);

            expect(result).toMatchObject({
                success: true, upvoteCount: 5, downvoteCount: 1, netVotes: 4, userVote: 1
            });
            const txn = fs.transactions[0];
            expect(txn.set).toHaveBeenCalledWith(
                fs.docRef(VOTE),
                expect.objectContaining({ userId: 'user123', value: 1 })
            );
            expect(txn.update).toHaveBeenCalledWith(
                fs.docRef(NOTE),
                expect.objectContaining({ upvoteCount: 5, downvoteCount: 1, netVotes: 4 })
            );
        });

        test('should treat missing counters on the note as zero', async () => {
            const service = await makeService();
            stubVoteState({ status: 'active' }, null);

            const result = await service.voteOnNote('note1', -1);

            expect(result).toMatchObject({ upvoteCount: 0, downvoteCount: 1, netVotes: -1, userVote: -1 });
        });

        test('should toggle an existing vote off when the same button is pressed again', async () => {
            const service = await makeService();
            stubVoteState({ status: 'active', upvoteCount: 5, downvoteCount: 1 }, { value: 1 });

            const result = await service.voteOnNote('note1', 1);

            expect(result).toMatchObject({ upvoteCount: 4, netVotes: 3, userVote: 0 });
            const txn = fs.transactions[0];
            expect(txn.delete).toHaveBeenCalledWith(fs.docRef(VOTE));
            expect(txn.set).not.toHaveBeenCalled();
        });

        test('should toggle an existing downvote off', async () => {
            const service = await makeService();
            stubVoteState({ status: 'active', upvoteCount: 5, downvoteCount: 3 }, { value: -1 });

            const result = await service.voteOnNote('note1', -1);

            expect(result).toMatchObject({ upvoteCount: 5, downvoteCount: 2, netVotes: 3, userVote: 0 });
            expect(fs.transactions[0].delete).toHaveBeenCalledWith(fs.docRef(VOTE));
        });

        test('should swing both counters when an upvote is changed to a downvote', async () => {
            const service = await makeService();
            stubVoteState({ status: 'active', upvoteCount: 5, downvoteCount: 3 }, { value: 1 });

            const result = await service.voteOnNote('note1', -1);

            expect(result).toMatchObject({ upvoteCount: 4, downvoteCount: 4, netVotes: 0, userVote: -1 });
        });

        test('should swing both counters when a vote is flipped', async () => {
            const service = await makeService();
            stubVoteState({ status: 'active', upvoteCount: 5, downvoteCount: 3 }, { value: -1 });

            const result = await service.voteOnNote('note1', 1);

            // upvote +1, downvote -1 => net moves by 2
            expect(result).toMatchObject({ upvoteCount: 6, downvoteCount: 2, netVotes: 4, userVote: 1 });
            expect(fs.transactions[0].delete).not.toHaveBeenCalled();
            expect(fs.transactions[0].update).toHaveBeenCalledWith(
                fs.docRef(VOTE),
                expect.objectContaining({ value: 1 })
            );
        });

        test('should fail when the note does not exist', async () => {
            const service = await makeService();
            stubVoteState(null, null);

            const result = await service.voteOnNote('note1', 1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Note not found');
        });

        test('should refuse to vote on a deleted note', async () => {
            const service = await makeService();
            stubVoteState({ status: 'deleted', upvoteCount: 2 }, null);

            const result = await service.voteOnNote('note1', 1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot vote on inactive notes');
        });

        test('should surface a transaction failure without dispatching an event', async () => {
            const service = await makeService();
            stubVoteState({ status: 'active' }, null);
            mockFirestore.runTransaction.mockRejectedValue(
                firestoreError('aborted', 'Transaction failed after 5 attempts.')
            );

            const result = await service.voteOnNote('note1', 1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('5 attempts');
            expect(dispatchedEvent('noteVoted')).toBeNull();
        });

        test('should produce the same counts when the SDK retries the transaction body', async () => {
            const service = await makeService();
            stubVoteState({ status: 'active', upvoteCount: 5, downvoteCount: 1 }, null);

            const results = [];
            mockFirestore.runTransaction.mockImplementation(async (fn) => {
                for (let attempt = 0; attempt < 2; attempt++) {
                    results.push(await fn({
                        get: (ref) => ref.get(),
                        set: jest.fn(), update: jest.fn(), delete: jest.fn()
                    }));
                }
                return results[results.length - 1];
            });

            const result = await service.voteOnNote('note1', 1);

            // The body must be a pure function of the documents it reads.
            expect(results[0]).toEqual(results[1]);
            expect(result).toMatchObject({ success: true, upvoteCount: 6, netVotes: 5 });
        });

        test('should dispatch noteVoted with the new totals', async () => {
            const service = await makeService();
            stubVoteState({ status: 'active', upvoteCount: 0, downvoteCount: 0 }, null);

            await service.voteOnNote('note1', 1);

            const event = dispatchedEvent('noteVoted');
            expect(event.detail).toMatchObject({ noteId: 'note1', netVotes: 1, userVote: 1 });
        });
    });

    describe('getUserVote', () => {
        test('should report no vote for an anonymous visitor without reading Firestore', async () => {
            mockAuth.currentUser = null;
            const service = await makeService();

            const result = await service.getUserVote('note1');

            expect(result).toEqual({ success: true, vote: 0 });
            expect(mockFirestore.collection).not.toHaveBeenCalled();
        });

        test('should return the stored vote value', async () => {
            const service = await makeService();
            fs.docRef('notes/note1/votes/user123').get.mockResolvedValue(docSnap('user123', { value: -1 }));

            await expect(service.getUserVote('note1')).resolves.toEqual({ success: true, vote: -1 });
        });

        test('should return 0 when the user has not voted', async () => {
            const service = await makeService();

            await expect(service.getUserVote('note1')).resolves.toEqual({ success: true, vote: 0 });
        });

        test('should return a safe 0 on read failure', async () => {
            const service = await makeService();
            fs.docRef('notes/note1/votes/user123').get.mockRejectedValue(new Error('read failed'));

            const result = await service.getUserVote('note1');

            expect(result.success).toBe(false);
            expect(result.vote).toBe(0);
            expect(result.error).toBe('read failed');
        });
    });

    describe('getUserVotesForNotes', () => {
        test('should return an empty map for an anonymous visitor', async () => {
            mockAuth.currentUser = null;
            const service = await makeService();

            await expect(service.getUserVotesForNotes(['a', 'b'])).resolves.toEqual({ success: true, votes: {} });
        });

        test('should return a vote per requested note, defaulting to 0', async () => {
            const service = await makeService();
            fs.docRef('notes/n1/votes/user123').get.mockResolvedValue(docSnap('user123', { value: 1 }));
            fs.docRef('notes/n2/votes/user123').get.mockResolvedValue(missingSnap('user123'));

            const result = await service.getUserVotesForNotes(['n1', 'n2']);

            expect(result).toEqual({ success: true, votes: { n1: 1, n2: 0 } });
        });

        test('should read every note when the list exceeds one batch', async () => {
            const service = await makeService();
            const ids = Array.from({ length: 23 }, (_, i) => `n${i}`);

            const result = await service.getUserVotesForNotes(ids);

            expect(Object.keys(result.votes)).toHaveLength(23);
            ids.forEach(id => expect(fs.docRef(`notes/${id}/votes/user123`).get).toHaveBeenCalled());
        });

        test('should return an empty map when a batch read fails', async () => {
            const service = await makeService();
            fs.docRef('notes/n1/votes/user123').get.mockRejectedValue(new Error('batch failed'));

            const result = await service.getUserVotesForNotes(['n1', 'n2']);

            expect(result.success).toBe(false);
            expect(result.votes).toEqual({});
        });
    });

    // =====================================================================
    // Realtime subscriptions
    // =====================================================================

    describe('subscribeToNotes', () => {
        test('should return an inert unsubscribe when the service is not initialized', () => {
            const service = new NotesService();
            const callback = jest.fn();

            const unsubscribe = service.subscribeToNotes('zeus', 'deities', callback);

            expect(typeof unsubscribe).toBe('function');
            expect(() => unsubscribe()).not.toThrow();
            expect(callback).not.toHaveBeenCalled();
            expect(console.warn).toHaveBeenCalled();
        });

        test('should deliver mapped notes to the callback', async () => {
            const service = await makeService();
            const callback = jest.fn();
            fs.collectionRef('notes').onSnapshot.mockImplementation((onNext) => {
                onNext(querySnap([docSnap('n1', { content: 'live' })]));
                return jest.fn();
            });

            service.subscribeToNotes('zeus', 'deities', callback);

            expect(callback).toHaveBeenCalledWith([{ id: 'n1', content: 'live' }], null);
        });

        test('should deliver an empty list plus the error when the listener fails', async () => {
            const service = await makeService();
            const callback = jest.fn();
            const err = firestoreError('failed-precondition', 'The query requires an index.');
            fs.collectionRef('notes').onSnapshot.mockImplementation((onNext, onError) => {
                onError(err);
                return jest.fn();
            });

            service.subscribeToNotes('zeus', 'deities', callback);

            expect(callback).toHaveBeenCalledWith([], err);
        });

        test('should tear down a previous listener for the same entity', async () => {
            const service = await makeService();
            const firstUnsub = jest.fn();
            fs.collectionRef('notes').onSnapshot
                .mockReturnValueOnce(firstUnsub)
                .mockReturnValueOnce(jest.fn());

            service.subscribeToNotes('zeus', 'deities', jest.fn());
            service.subscribeToNotes('zeus', 'deities', jest.fn());

            expect(firstUnsub).toHaveBeenCalledTimes(1);
            expect(service.noteListeners.size).toBe(1);
        });

        test('should order a recent subscription by createdAt', async () => {
            const service = await makeService();
            service.subscribeToNotes('zeus', 'deities', jest.fn(), { sortBy: 'recent', limit: 5 });

            expect(fs.collectionRef('notes').orderBy).toHaveBeenCalledWith('createdAt', 'desc');
            expect(fs.collectionRef('notes').limit).toHaveBeenCalledWith(5);
        });

        test('should fall back to netVotes for an unknown sort key', async () => {
            const service = await makeService();
            service.subscribeToNotes('zeus', 'deities', jest.fn(), { sortBy: 'nonsense' });

            expect(fs.collectionRef('notes').orderBy).toHaveBeenCalledWith('netVotes', 'desc');
        });
    });

    describe('unsubscribe', () => {
        test('should call and forget the stored unsubscribe', async () => {
            const service = await makeService();
            const unsub = jest.fn();
            fs.collectionRef('notes').onSnapshot.mockReturnValue(unsub);
            service.subscribeToNotes('zeus', 'deities', jest.fn());

            service.unsubscribe('zeus', 'deities');

            expect(unsub).toHaveBeenCalledTimes(1);
            expect(service.noteListeners.size).toBe(0);
        });

        test('should be a no-op for an entity with no listener', async () => {
            const service = await makeService();
            expect(() => service.unsubscribe('hera', 'deities')).not.toThrow();
        });

        test('unsubscribeAll should release every listener', async () => {
            const service = await makeService();
            const a = jest.fn();
            const b = jest.fn();
            service.noteListeners.set('deities_zeus', a);
            service.noteListeners.set('deities_hera', b);

            service.unsubscribeAll();

            expect(a).toHaveBeenCalled();
            expect(b).toHaveBeenCalled();
            expect(service.noteListeners.size).toBe(0);
        });
    });

    // =====================================================================
    // Validation, markdown, spam
    // =====================================================================

    describe('validateContent', () => {
        test('should accept valid content', () => {
            const service = new NotesService();
            const result = service.validateContent('This is a valid note about mythology');
            expect(result.valid).toBe(true);
        });

        test('should reject empty content', () => {
            const service = new NotesService();
            expect(service.validateContent('').valid).toBe(false);
            expect(service.validateContent(null).valid).toBe(false);
        });

        test('should reject non-string input', () => {
            const service = new NotesService();
            expect(service.validateContent(12345).valid).toBe(false);
            expect(service.validateContent({}).valid).toBe(false);
        });

        test('should reject content under minimum length', () => {
            const service = new NotesService();
            expect(service.validateContent('short').valid).toBe(false);
        });

        test('should measure length after trimming', () => {
            const service = new NotesService();
            // 9 visible chars padded to well over the minimum with whitespace
            expect(service.validateContent(`${' '.repeat(20)}nine char${' '.repeat(20)}`).valid).toBe(false);
        });

        test('should trim and normalize content', () => {
            const service = new NotesService();
            const result = service.validateContent('   This is valid content with spaces   ');
            expect(result.valid).toBe(true);
            expect(result.content).toBe('This is valid content with spaces');
        });

        test('should reject spam as prohibited rather than as a length problem', () => {
            const service = new NotesService();
            const result = service.validateContent('<script>alert(1)</script> and more text');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('prohibited');
        });
    });

    describe('containsSpam', () => {
        test('should flag a long run of one character', () => {
            const service = new NotesService();
            expect(service.containsSpam(`aaaaaaaaaaaa is great`)).toBe(true);
        });

        test('should flag URLs', () => {
            const service = new NotesService();
            expect(service.containsSpam('see https://example.com/x')).toBe(true);
        });

        test('should flag script tags and javascript URLs', () => {
            const service = new NotesService();
            expect(service.containsSpam('<script src=x>')).toBe(true);
            expect(service.containsSpam('javascript:alert(1)')).toBe(true);
        });

        test('should not flag ordinary prose', () => {
            const service = new NotesService();
            expect(service.containsSpam('Zeus was the king of the Greek gods.')).toBe(false);
        });
    });

    describe('renderMarkdown', () => {
        test('should return an empty string for empty input', () => {
            const service = new NotesService();
            expect(service.renderMarkdown('')).toBe('');
            expect(service.renderMarkdown(null)).toBe('');
        });

        test('should escape HTML before applying markdown', () => {
            const service = new NotesService();
            const html = service.renderMarkdown('<img src=x onerror=alert(1)>');
            expect(html).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>');
            expect(html).not.toContain('<img');
        });

        test('should escape ampersands first so entities are not double-decoded', () => {
            const service = new NotesService();
            expect(service.renderMarkdown('Zeus & Hera')).toBe('<p>Zeus &amp; Hera</p>');
        });

        test('should render bold, italic and line breaks', () => {
            const service = new NotesService();
            expect(service.renderMarkdown('**bold**')).toBe('<p><strong>bold</strong></p>');
            expect(service.renderMarkdown('*it*')).toBe('<p><em>it</em></p>');
            expect(service.renderMarkdown('a\nb')).toBe('<p>a<br>b</p>');
        });
    });

    // =====================================================================
    // Rate limiting / duplicates
    // =====================================================================

    describe('rate limiting', () => {
        test('should allow notes within rate limit', () => {
            const service = new NotesService();
            expect(service.canCreateNote('user123')).toBe(true);
        });

        test('should block after exceeding rate limit', () => {
            const service = new NotesService();
            // Simulate MAX_NOTES_PER_HOUR entries
            for (let i = 0; i < service.MAX_NOTES_PER_HOUR; i++) {
                service.recordNoteCreation('user123');
            }
            expect(service.canCreateNote('user123')).toBe(false);
        });

        test('should reset after time window expires', () => {
            const service = new NotesService();
            for (let i = 0; i < service.MAX_NOTES_PER_HOUR; i++) {
                service.recordNoteCreation('user123');
            }
            expect(service.canCreateNote('user123')).toBe(false);

            // Advance time past the rate limit window
            jest.advanceTimersByTime(service.RATE_LIMIT_WINDOW + 1000);
            service.cleanupRateLimiter();
            expect(service.canCreateNote('user123')).toBe(true);
        });

        test('should track users independently', () => {
            const service = new NotesService();
            for (let i = 0; i < service.MAX_NOTES_PER_HOUR; i++) {
                service.recordNoteCreation('user123');
            }
            expect(service.canCreateNote('user123')).toBe(false);
            expect(service.canCreateNote('other-user')).toBe(true);
        });

        test('getRateLimitRemainingTime should be 0 for an unseen user', () => {
            const service = new NotesService();
            expect(service.getRateLimitRemainingTime('nobody')).toBe(0);
        });

        test('getRateLimitRemainingTime should count down from the oldest note', () => {
            const service = new NotesService();
            service.recordNoteCreation('user123');
            jest.advanceTimersByTime(10 * 60 * 1000);

            expect(service.getRateLimitRemainingTime('user123')).toBe(service.RATE_LIMIT_WINDOW - 10 * 60 * 1000);
        });

        test('cleanupRateLimiter should keep users with recent activity', () => {
            const service = new NotesService();
            service.recordNoteCreation('recent-user');
            jest.advanceTimersByTime(1000);

            service.cleanupRateLimiter();

            expect(service.rateLimiter.has('recent-user')).toBe(true);
        });

        test('cleanupRateLimiter should evict users whose window has fully expired', () => {
            const service = new NotesService();
            service.recordNoteCreation('stale-user');
            jest.advanceTimersByTime(service.RATE_LIMIT_WINDOW + 1000);

            service.cleanupRateLimiter();

            expect(service.rateLimiter.has('stale-user')).toBe(false);
        });
    });

    describe('duplicate detection', () => {
        test('should detect duplicate notes', () => {
            const service = new NotesService();
            service.recordNoteContent('user123', 'zeus', 'This is my note');
            expect(service.isDuplicateNote('user123', 'zeus', 'This is my note')).toBe(true);
        });

        test('should not flag different notes as duplicates', () => {
            const service = new NotesService();
            service.recordNoteContent('user123', 'zeus', 'First note');
            expect(service.isDuplicateNote('user123', 'zeus', 'Completely different note')).toBe(false);
        });

        test('should scope duplicates to the entity', () => {
            const service = new NotesService();
            service.recordNoteContent('user123', 'zeus', 'This is my note');
            expect(service.isDuplicateNote('user123', 'hera', 'This is my note')).toBe(false);
        });

        test('should scope duplicates to the user', () => {
            const service = new NotesService();
            service.recordNoteContent('user123', 'zeus', 'This is my note');
            expect(service.isDuplicateNote('other', 'zeus', 'This is my note')).toBe(false);
        });

        test('should ignore surrounding whitespace when comparing', () => {
            const service = new NotesService();
            service.recordNoteContent('user123', 'zeus', '  This is my note  ');
            expect(service.isDuplicateNote('user123', 'zeus', 'This is my note   ')).toBe(true);
        });

        test('should stop matching once the window elapses even without cleanup', () => {
            const service = new NotesService();
            service.recordNoteContent('user123', 'zeus', 'This is my note');

            jest.advanceTimersByTime(service.DUPLICATE_WINDOW + 1000);

            expect(service.isDuplicateNote('user123', 'zeus', 'This is my note')).toBe(false);
        });

        test('should expire duplicates after window', () => {
            const service = new NotesService();
            service.recordNoteContent('user123', 'zeus', 'This is my note');

            jest.advanceTimersByTime(service.DUPLICATE_WINDOW + 1000);
            service.cleanupRecentNotes();
            expect(service.isDuplicateNote('user123', 'zeus', 'This is my note')).toBe(false);
        });

        test('cleanupRecentNotes should keep entries inside the window', () => {
            const service = new NotesService();
            service.recordNoteContent('user123', 'zeus', 'This is my note');

            jest.advanceTimersByTime(1000);
            service.cleanupRecentNotes();

            expect(service.recentNotes.size).toBe(1);
        });
    });

    // =====================================================================
    // Offline retry queue
    // =====================================================================

    describe('retry queue', () => {
        test('queueForRetry should append and persist the item', () => {
            const service = new NotesService();
            service.queueForRetry('create', { entityId: 'zeus' });

            expect(service.retryQueue).toHaveLength(1);
            expect(JSON.parse(localStorage.getItem('notes_retry_queue'))[0].operation).toBe('create');
        });

        test('queueForRetry should still queue in memory when storage throws', () => {
            const service = new NotesService();
            jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            expect(() => service.queueForRetry('create', { entityId: 'zeus' })).not.toThrow();
            expect(service.retryQueue).toHaveLength(1);
        });

        test('loadRetryQueue should restore a persisted queue', () => {
            localStorage.setItem('notes_retry_queue', JSON.stringify([{ operation: 'delete', data: { noteId: 'n1' } }]));
            const service = new NotesService();

            service.loadRetryQueue();

            expect(service.retryQueue).toEqual([{ operation: 'delete', data: { noteId: 'n1' } }]);
        });

        test('loadRetryQueue should leave the queue empty when storage is corrupt', () => {
            localStorage.setItem('notes_retry_queue', '{not json');
            const service = new NotesService();

            service.loadRetryQueue();

            expect(service.retryQueue).toEqual([]);
            expect(console.warn).toHaveBeenCalled();
        });

        test('loadRetryQueue should leave the queue empty when nothing is stored', () => {
            const service = new NotesService();
            service.loadRetryQueue();
            expect(service.retryQueue).toEqual([]);
        });

        test('processRetryQueue should replay each queued operation', async () => {
            const service = await makeService();
            const createSpy = jest.spyOn(service, 'createNote').mockResolvedValue({ success: true });
            const updateSpy = jest.spyOn(service, 'updateNote').mockResolvedValue({ success: true });
            const deleteSpy = jest.spyOn(service, 'deleteNote').mockResolvedValue({ success: true });

            service.retryQueue = [
                { operation: 'create', data: { entityId: 'zeus', entityCollection: 'deities', content: 'A queued note body', entityName: 'Zeus' } },
                { operation: 'update', data: { noteId: 'n1', content: 'An edited note body' } },
                { operation: 'delete', data: { noteId: 'n2' } }
            ];

            await service.processRetryQueue();

            expect(createSpy).toHaveBeenCalledWith('zeus', 'deities', 'A queued note body', 'Zeus');
            expect(updateSpy).toHaveBeenCalledWith('n1', 'An edited note body');
            expect(deleteSpy).toHaveBeenCalledWith('n2');
            expect(service.retryQueue).toEqual([]);
            expect(service.isProcessingQueue).toBe(false);
        });

        test('processRetryQueue should skip unknown operations without losing the rest', async () => {
            const service = await makeService();
            const deleteSpy = jest.spyOn(service, 'deleteNote').mockResolvedValue({ success: true });
            service.retryQueue = [
                { operation: 'frobnicate', data: {} },
                { operation: 'delete', data: { noteId: 'n2' } }
            ];

            await service.processRetryQueue();

            expect(deleteSpy).toHaveBeenCalledWith('n2');
            expect(service.retryQueue).toEqual([]);
        });

        test('processRetryQueue should do nothing for an empty queue', async () => {
            const service = await makeService();
            const createSpy = jest.spyOn(service, 'createNote');

            await service.processRetryQueue();

            expect(createSpy).not.toHaveBeenCalled();
        });

        test('processRetryQueue should not re-enter while a drain is in flight', async () => {
            const service = await makeService();
            const deleteSpy = jest.spyOn(service, 'deleteNote').mockResolvedValue({ success: true });
            service.isProcessingQueue = true;
            service.retryQueue = [{ operation: 'delete', data: { noteId: 'n2' } }];

            await service.processRetryQueue();

            expect(deleteSpy).not.toHaveBeenCalled();
            expect(service.retryQueue).toHaveLength(1);
        });

        test('processRetryQueue should re-queue an item that is still offline', async () => {
            const service = await makeService();
            jest.spyOn(service, 'deleteNote').mockRejectedValue(firestoreError('unavailable'));
            service.retryQueue = [{ operation: 'delete', data: { noteId: 'n2' } }];

            await service.processRetryQueue();

            expect(service.retryQueue).toHaveLength(1);
            expect(service.retryQueue[0].data.noteId).toBe('n2');
        });

        test('processRetryQueue should still finish when the queue cannot be persisted', async () => {
            const service = await makeService();
            jest.spyOn(service, 'deleteNote').mockResolvedValue({ success: true });
            service.retryQueue = [{ operation: 'delete', data: { noteId: 'n2' } }];
            jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            await expect(service.processRetryQueue()).resolves.toBeUndefined();

            expect(service.isProcessingQueue).toBe(false);
            expect(service.retryQueue).toEqual([]);
        });

        test('processRetryQueue should drop an item that fails for a non-offline reason', async () => {
            const service = await makeService();
            jest.spyOn(service, 'deleteNote').mockRejectedValue(firestoreError('permission-denied'));
            service.retryQueue = [{ operation: 'delete', data: { noteId: 'n2' } }];

            await service.processRetryQueue();

            expect(service.retryQueue).toEqual([]);
        });
    });

    // =====================================================================
    // Caching
    // =====================================================================

    describe('caching', () => {
        test('should cache notes', () => {
            const service = new NotesService();
            const cacheKey = service.getCacheKey('zeus', 'deities', 'newest');
            const notes = [{ id: 'note1', content: 'Test' }];
            service.setToCache(cacheKey, notes);
            expect(service.getFromCache(cacheKey)).toEqual(notes);
        });

        test('should return null for an unknown key', () => {
            const service = new NotesService();
            expect(service.getFromCache('nope')).toBeNull();
        });

        test('should expire cache after TTL', () => {
            const service = new NotesService();
            const cacheKey = service.getCacheKey('zeus', 'deities', 'newest');
            service.setToCache(cacheKey, [{ id: 'note1' }]);

            jest.advanceTimersByTime(service.cacheTTL + 1000);
            expect(service.getFromCache(cacheKey)).toBeNull();
        });

        test('should evict the expired entry rather than keep it around', () => {
            const service = new NotesService();
            const cacheKey = service.getCacheKey('zeus', 'deities', 'newest');
            service.setToCache(cacheKey, [{ id: 'note1' }]);

            jest.advanceTimersByTime(service.cacheTTL + 1000);
            service.getFromCache(cacheKey);

            expect(service.cache.has(cacheKey)).toBe(false);
        });

        test('should invalidate cache for entity', () => {
            const service = new NotesService();
            const key = service.getCacheKey('zeus', 'deities', 'newest');
            service.setToCache(key, [{ id: 'note1' }]);
            service.invalidateCache('zeus', 'deities');
            expect(service.getFromCache(key)).toBeNull();
        });

        test('should invalidate every sort variant for one entity only', () => {
            const service = new NotesService();
            const zeusVotes = service.getCacheKey('zeus', 'deities', 'netVotes');
            const zeusRecent = service.getCacheKey('zeus', 'deities', 'recent');
            const heraVotes = service.getCacheKey('hera', 'deities', 'netVotes');
            [zeusVotes, zeusRecent, heraVotes].forEach(k => service.setToCache(k, [{ id: k }]));

            service.invalidateCache('zeus', 'deities');

            expect(service.getFromCache(zeusVotes)).toBeNull();
            expect(service.getFromCache(zeusRecent)).toBeNull();
            expect(service.getFromCache(heraVotes)).not.toBeNull();
        });

        test('clearCache should empty the cache', () => {
            const service = new NotesService();
            service.setToCache('a', 1);
            service.setToCache('b', 2);

            service.clearCache();

            expect(service.cache.size).toBe(0);
        });
    });

    // =====================================================================
    // Helpers
    // =====================================================================

    describe('convertTimestamps', () => {
        test('should convert createdAt, updatedAt and deletedAt', () => {
            const service = new NotesService();
            const a = new Date('2024-01-01');
            const b = new Date('2024-02-01');
            const c = new Date('2024-03-01');

            const out = service.convertTimestamps({
                createdAt: { toDate: () => a },
                updatedAt: { toDate: () => b },
                deletedAt: { toDate: () => c },
                content: 'x'
            });

            expect(out).toEqual({ createdAt: a, updatedAt: b, deletedAt: c, content: 'x' });
        });

        test('should leave plain values untouched and not mutate the input', () => {
            const service = new NotesService();
            const input = { createdAt: 'not-a-timestamp', content: 'x' };

            const out = service.convertTimestamps(input);

            expect(out.createdAt).toBe('not-a-timestamp');
            out.content = 'changed';
            expect(input.content).toBe('x');
        });
    });

    describe('isOfflineError', () => {
        test('should recognise the unavailable code', () => {
            const service = new NotesService();
            expect(service.isOfflineError(firestoreError('unavailable'))).toBe(true);
        });

        test('should recognise an offline message', () => {
            const service = new NotesService();
            expect(service.isOfflineError(new Error('client is offline'))).toBe(true);
        });

        test('should not treat a permission error as offline while online', () => {
            const service = new NotesService();
            expect(service.isOfflineError(firestoreError('permission-denied', 'denied'))).toBe(false);
        });

        test('should treat any error as offline when the browser reports no connection', () => {
            const service = new NotesService();
            const spy = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

            expect(service.isOfflineError(firestoreError('permission-denied', 'denied'))).toBe(true);

            spy.mockRestore();
        });
    });

    describe('getErrorCode', () => {
        test('should map known Firestore codes', () => {
            const service = new NotesService();
            expect(service.getErrorCode(firestoreError('permission-denied'))).toBe('PERMISSION_DENIED');
            expect(service.getErrorCode(firestoreError('unavailable'))).toBe('OFFLINE');
            expect(service.getErrorCode(firestoreError('not-found'))).toBe('NOT_FOUND');
            expect(service.getErrorCode(firestoreError('already-exists'))).toBe('DUPLICATE');
        });

        test('should fall back to UNKNOWN_ERROR', () => {
            const service = new NotesService();
            expect(service.getErrorCode(new Error('boom'))).toBe('UNKNOWN_ERROR');
            expect(service.getErrorCode(firestoreError('failed-precondition'))).toBe('UNKNOWN_ERROR');
        });
    });

    describe('isUserAdmin', () => {
        test('should be false without a user', async () => {
            const service = new NotesService();
            await expect(service.isUserAdmin(null)).resolves.toBe(false);
        });

        test('should be false for a regular user', async () => {
            const service = new NotesService();
            await expect(service.isUserAdmin({ email: 'test@example.com' })).resolves.toBe(false);
        });

        test('should be true for the admin email', async () => {
            const service = new NotesService();
            await expect(service.isUserAdmin({ email: 'andrewkwatts@gmail.com' })).resolves.toBe(true);
        });
    });

    describe('cleanup', () => {
        test('should release listeners, cache and the online handler', async () => {
            const service = await makeService();
            const unsub = jest.fn();
            service.noteListeners.set('deities_zeus', unsub);
            service.setToCache('k', 'v');

            service.cleanup();

            expect(unsub).toHaveBeenCalled();
            expect(service.noteListeners.size).toBe(0);
            expect(service.cache.size).toBe(0);
            expect(window.removeEventListener).toBeDefined();
        });
    });
});
