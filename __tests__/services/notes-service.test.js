/**
 * Notes Service Tests
 * Tests for js/services/notes-service.js
 */

describe('NotesService', () => {
    let NotesService;
    let mockFirestore;
    let mockAuth;

    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = '';

        // Mock Firestore
        mockFirestore = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            add: jest.fn().mockResolvedValue({ id: 'note123' }),
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}), id: 'note123' }),
            set: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            startAfter: jest.fn().mockReturnThis(),
            onSnapshot: jest.fn().mockReturnValue(jest.fn()),
        };

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
            serverTimestamp: jest.fn(() => new Date()),
            increment: jest.fn((n) => n),
            delete: jest.fn()
        };

        jest.resetModules();
        const mod = require('../../js/services/notes-service.js');
        NotesService = mod.NotesService || mod;
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        delete global.firebase;
    });

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
    });

    describe('getCurrentUser', () => {
        test('should return current user when authenticated', async () => {
            const service = new NotesService();
            await service.init();
            const user = service.getCurrentUser();
            expect(user.uid).toBe('user123');
        });

        test('should return null when not authenticated', async () => {
            mockAuth.currentUser = null;
            const service = new NotesService();
            await service.init();
            expect(service.getCurrentUser()).toBeNull();
        });
    });

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
    });

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

        test('should reject content under minimum length', () => {
            const service = new NotesService();
            expect(service.validateContent('short').valid).toBe(false);
        });

        test('should trim and normalize content', () => {
            const service = new NotesService();
            const result = service.validateContent('   This is valid content with spaces   ');
            expect(result.valid).toBe(true);
            expect(result.content).toBe('This is valid content with spaces');
        });
    });

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

        test('should expire duplicates after window', () => {
            const service = new NotesService();
            service.recordNoteContent('user123', 'zeus', 'This is my note');

            jest.advanceTimersByTime(service.DUPLICATE_WINDOW + 1000);
            service.cleanupRecentNotes();
            expect(service.isDuplicateNote('user123', 'zeus', 'This is my note')).toBe(false);
        });
    });

    describe('caching', () => {
        test('should cache notes', () => {
            const service = new NotesService();
            const cacheKey = service.getCacheKey('zeus', 'deities', 'newest');
            const notes = [{ id: 'note1', content: 'Test' }];
            service.setToCache(cacheKey, notes);
            expect(service.getFromCache(cacheKey)).toEqual(notes);
        });

        test('should expire cache after TTL', () => {
            const service = new NotesService();
            const cacheKey = service.getCacheKey('zeus', 'deities', 'newest');
            service.setToCache(cacheKey, [{ id: 'note1' }]);

            jest.advanceTimersByTime(service.cacheTTL + 1000);
            expect(service.getFromCache(cacheKey)).toBeNull();
        });

        test('should invalidate cache for entity', () => {
            const service = new NotesService();
            const key = service.getCacheKey('zeus', 'deities', 'newest');
            service.setToCache(key, [{ id: 'note1' }]);
            service.invalidateCache('zeus', 'deities');
            expect(service.getFromCache(key)).toBeNull();
        });
    });
});
