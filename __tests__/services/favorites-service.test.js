/**
 * FavoritesService Tests
 *
 * Tests for js/services/favorites-service.js
 *
 * Test Categories:
 * 1. Constructor & initialization (3 tests)
 * 2. Auth state checking (3 tests)
 * 3. getFavorites (3 tests)
 * 4. addFavorite (4 tests)
 * 5. removeFavorite (3 tests)
 * 6. toggleFavorite (3 tests)
 * 7. isFavorited / isFavoritedSync (3 tests)
 * 8. Entity validation (3 tests)
 * 9. Cache management (3 tests)
 * 10. Helpers (getCount, getByMythology, getByType) (3 tests)
 *
 * Total: ~31 tests
 */

// Prevent auto-init side effects
delete global.window._favoritesEventDelegationInitialized;
delete global.window.EyesOfAzrael;

const FavoritesService = require('../../js/services/favorites-service.js');

function createMockFirestore() {
    const mockDoc = {
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve())
    };

    const mockCollection = {
        doc: jest.fn(() => mockDoc),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(() => Promise.resolve({ docs: [] }))
    };

    // Support nested collection calls: collection('users').doc(uid).collection('user_favorites')
    mockDoc.collection = jest.fn(() => ({
        doc: jest.fn(() => mockDoc),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn(() => Promise.resolve({
            docs: []
        }))
    }));

    const db = {
        collection: jest.fn(() => mockCollection)
    };

    return { db, mockDoc, mockCollection };
}

function createMockAuth(user = null) {
    return {
        currentUser: user
    };
}

function createTestUser() {
    return {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
    };
}

describe('FavoritesService', () => {
    let service;
    let mockDb;
    let mockAuth;
    let testUser;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        delete global.window._favoritesEventDelegationInitialized;
        delete global.window.toast;
        delete global.window.ToastNotification;

        testUser = createTestUser();
        const mocks = createMockFirestore();
        mockDb = mocks.db;
        mockAuth = createMockAuth(testUser);

        // Ensure global firebase.auth() fallback returns a valid mock
        global.firebase = {
            auth: jest.fn(() => ({ currentUser: null })),
            firestore: jest.fn(() => mockDb)
        };

        service = new FavoritesService({
            firestore: mockDb,
            auth: mockAuth
        });
    });

    // ==========================================
    // 1. Constructor & initialization
    // ==========================================

    describe('constructor', () => {
        test('should initialize with provided firestore and auth', () => {
            expect(service.db).toBe(mockDb);
            expect(service.auth).toBe(mockAuth);
        });

        test('should initialize empty caches', () => {
            expect(service._cache.size).toBe(0);
            expect(service._favoritedLookup.size).toBe(0);
            expect(service._pendingFetches.size).toBe(0);
        });

        test('should set default cache TTL to 5 minutes', () => {
            expect(service._cacheTTL).toBe(5 * 60 * 1000);
        });
    });

    // ==========================================
    // 2. Auth state checking
    // ==========================================

    describe('_checkAuthState', () => {
        test('should return authenticated when user is present', () => {
            const result = service._checkAuthState();
            expect(result.authenticated).toBe(true);
            expect(result.user).toBe(testUser);
        });

        test('should return not authenticated when no user', () => {
            mockAuth.currentUser = null;
            const result = service._checkAuthState();
            expect(result.authenticated).toBe(false);
            expect(result.reason).toBe('no_user');
        });

        test('should return not authenticated when user has no uid', () => {
            mockAuth.currentUser = { email: 'test@example.com' };
            const result = service._checkAuthState();
            expect(result.authenticated).toBe(false);
            expect(result.reason).toBe('invalid_user');
        });
    });

    // ==========================================
    // 3. getFavorites
    // ==========================================

    describe('getFavorites', () => {
        test('should return empty array when not authenticated', async () => {
            mockAuth.currentUser = null;
            const result = await service.getFavorites();
            expect(result).toEqual([]);
        });

        test('should return result object when returnResultObject is true and not authenticated', async () => {
            mockAuth.currentUser = null;
            const result = await service.getFavorites({ returnResultObject: true });
            expect(result.success).toBe(false);
            expect(result.status).toBe('not_authenticated');
            expect(result.data).toEqual([]);
        });

        test('should return favorites from cache when cache is valid', async () => {
            // Populate cache
            const fav = { id: 'deity_zeus', entityId: 'zeus', entityType: 'deity', name: 'Zeus' };
            const map = new Map();
            map.set('deity_zeus', fav);
            service._cache.set(testUser.uid, map);
            service._cacheTimestamps.set(testUser.uid, Date.now());

            const result = await service.getFavorites();
            expect(result).toEqual([fav]);
        });
    });

    // ==========================================
    // 4. addFavorite
    // ==========================================

    describe('addFavorite', () => {
        test('should fail when not authenticated', async () => {
            mockAuth.currentUser = null;
            const result = await service.addFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });
            expect(result.success).toBe(false);
            expect(result.code).toBe('AUTH_REQUIRED');
        });

        test('should fail when entity is missing required fields', async () => {
            const result = await service.addFavorite({ id: 'zeus' });
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        test('should fail when entity is null', async () => {
            const result = await service.addFavorite(null);
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        test('should add favorite successfully when online', async () => {
            // Mock navigator.onLine
            Object.defineProperty(global, 'navigator', {
                value: { onLine: true, userAgent: 'test' },
                writable: true,
                configurable: true
            });

            // Setup the nested collection mock to return set successfully
            const mockSet = jest.fn(() => Promise.resolve());
            const mockInnerDoc = jest.fn(() => ({ set: mockSet, get: jest.fn() }));
            const mockInnerCollection = jest.fn(() => ({
                doc: mockInnerDoc,
                orderBy: jest.fn().mockReturnThis(),
                get: jest.fn(() => Promise.resolve({ docs: [] }))
            }));
            const mockOuterDoc = jest.fn(() => ({
                collection: mockInnerCollection
            }));

            mockDb.collection = jest.fn(() => ({
                doc: mockOuterDoc
            }));

            const entity = { id: 'zeus', type: 'deity', name: 'Zeus', mythology: 'greek' };
            const result = await service.addFavorite(entity);
            expect(result.success).toBe(true);
            expect(result.data.entityId).toBe('zeus');
            expect(result.data.entityType).toBe('deity');
        });
    });

    // ==========================================
    // 5. removeFavorite
    // ==========================================

    describe('removeFavorite', () => {
        test('should fail when not authenticated', async () => {
            mockAuth.currentUser = null;
            const result = await service.removeFavorite('zeus', 'deity');
            expect(result.success).toBe(false);
            expect(result.code).toBe('AUTH_REQUIRED');
        });

        test('should fail when entityId is missing', async () => {
            const result = await service.removeFavorite(null, 'deity');
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        test('should fail when entityType is missing', async () => {
            const result = await service.removeFavorite('zeus', null);
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
        });
    });

    // ==========================================
    // 6. toggleFavorite
    // ==========================================

    describe('toggleFavorite', () => {
        test('should fail when not authenticated', async () => {
            mockAuth.currentUser = null;
            const result = await service.toggleFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });
            expect(result.success).toBe(false);
            expect(result.code).toBe('AUTH_REQUIRED');
        });

        test('should fail when entity is null', async () => {
            const result = await service.toggleFavorite(null);
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        test('should fail when entity has no id or type', async () => {
            const result = await service.toggleFavorite({ name: 'Zeus' });
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
        });
    });

    // ==========================================
    // 7. isFavorited / isFavoritedSync
    // ==========================================

    describe('isFavorited', () => {
        test('should return false when not authenticated', async () => {
            mockAuth.currentUser = null;
            const result = await service.isFavorited('zeus', 'deity');
            expect(result).toBe(false);
        });

        test('should return true when entity is in lookup Set', async () => {
            const lookupSet = new Set();
            lookupSet.add('deity::zeus');
            service._favoritedLookup.set(testUser.uid, lookupSet);
            service._cache.set(testUser.uid, new Map());
            service._cacheTimestamps.set(testUser.uid, Date.now());

            const result = await service.isFavorited('zeus', 'deity');
            expect(result).toBe(true);
        });

        test('should return false when entity is not in lookup Set', async () => {
            const lookupSet = new Set();
            service._favoritedLookup.set(testUser.uid, lookupSet);
            service._cache.set(testUser.uid, new Map());
            service._cacheTimestamps.set(testUser.uid, Date.now());

            const result = await service.isFavorited('zeus', 'deity');
            expect(result).toBe(false);
        });
    });

    describe('isFavoritedSync', () => {
        test('should return false when not authenticated', () => {
            mockAuth.currentUser = null;
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(false);
        });

        test('should use lookup Set for O(1) check', () => {
            const lookupSet = new Set(['deity::zeus']);
            service._favoritedLookup.set(testUser.uid, lookupSet);

            expect(service.isFavoritedSync('zeus', 'deity')).toBe(true);
            expect(service.isFavoritedSync('poseidon', 'deity')).toBe(false);
        });

        test('should return false when no lookup Set exists', () => {
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(false);
        });
    });

    // ==========================================
    // 8. Entity validation
    // ==========================================

    describe('_validateEntity', () => {
        test('should fail when entity is null', () => {
            const result = service._validateEntity(null);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Entity is required');
        });

        test('should fail when entity has no name', () => {
            const result = service._validateEntity({ id: 'zeus', type: 'deity' });
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Entity name is required');
        });

        test('should succeed with valid entity using alternate field names', () => {
            const result = service._validateEntity({
                entityId: 'zeus',
                entityType: 'deity',
                name: 'Zeus'
            });
            expect(result.valid).toBe(true);
        });
    });

    // ==========================================
    // 9. Cache management
    // ==========================================

    describe('cache management', () => {
        test('_generateDocId should combine entityType and entityId', () => {
            expect(service._generateDocId('zeus', 'deity')).toBe('deity_zeus');
        });

        test('_generateCompositeKey should create type::id format', () => {
            expect(service._generateCompositeKey('zeus', 'deity')).toBe('deity::zeus');
        });

        test('_isCacheValid should return false for expired cache', () => {
            service._cache.set(testUser.uid, new Map());
            // Set timestamp far in the past
            service._cacheTimestamps.set(testUser.uid, Date.now() - 10 * 60 * 1000);

            expect(service._isCacheValid(testUser.uid)).toBe(false);
        });

        test('_isCacheValid should return true for fresh cache', () => {
            service._cache.set(testUser.uid, new Map());
            service._cacheTimestamps.set(testUser.uid, Date.now());

            expect(service._isCacheValid(testUser.uid)).toBe(true);
        });

        test('_isCacheValid should return false when cache does not exist', () => {
            expect(service._isCacheValid('nonexistent-user')).toBe(false);
        });
    });

    // ==========================================
    // 10. Helpers
    // ==========================================

    describe('getCount', () => {
        test('should return count of cached favorites', async () => {
            const map = new Map();
            map.set('deity_zeus', { entityId: 'zeus', entityType: 'deity', name: 'Zeus' });
            map.set('deity_athena', { entityId: 'athena', entityType: 'deity', name: 'Athena' });
            service._cache.set(testUser.uid, map);
            service._cacheTimestamps.set(testUser.uid, Date.now());

            const count = await service.getCount();
            expect(count).toBe(2);
        });
    });

    describe('getByMythology', () => {
        test('should filter favorites by mythology', async () => {
            const map = new Map();
            map.set('deity_zeus', { entityId: 'zeus', entityType: 'deity', name: 'Zeus', mythology: 'greek' });
            map.set('deity_ra', { entityId: 'ra', entityType: 'deity', name: 'Ra', mythology: 'egyptian' });
            service._cache.set(testUser.uid, map);
            service._cacheTimestamps.set(testUser.uid, Date.now());

            const result = await service.getByMythology('greek');
            expect(result.length).toBe(1);
            expect(result[0].entityId).toBe('zeus');
        });
    });

    describe('getByType', () => {
        test('should filter favorites by entity type', async () => {
            const map = new Map();
            map.set('deity_zeus', { entityId: 'zeus', entityType: 'deity', name: 'Zeus' });
            map.set('creature_hydra', { entityId: 'hydra', entityType: 'creature', name: 'Hydra' });
            service._cache.set(testUser.uid, map);
            service._cacheTimestamps.set(testUser.uid, Date.now());

            const result = await service.getByType('creature');
            expect(result.length).toBe(1);
            expect(result[0].entityId).toBe('hydra');
        });
    });
});
