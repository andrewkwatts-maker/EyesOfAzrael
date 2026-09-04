/**
 * FavoritesService Tests
 *
 * Tests for js/services/favorites-service.js
 *
 * Focus: observable behaviour — what each method returns, what it writes to
 * Firestore / localStorage / the DOM, and what it does when things fail.
 * Error paths (rejected Firestore promises, missing auth, malformed docs,
 * quota errors, offline mode) are covered deliberately.
 *
 * Tests marked "BUG:" are characterisation tests. They document behaviour that
 * is currently wrong. If the source is fixed they will go red, which is the
 * point — see the notes on each one.
 */

// Prevent auto-init side effects at require time
delete global.window._favoritesEventDelegationInitialized;
delete global.window.EyesOfAzrael;

const FavoritesService = require('../../js/services/favorites-service.js');

// ==========================================================================
// Test doubles
// ==========================================================================

/**
 * Firestore mock at the boundary.
 *
 * Supports the exact chain the service uses:
 *   db.collection('users').doc(uid).collection(name).doc(id).set/update/delete
 *   db.collection('users').doc(uid).collection(name).orderBy(...).get()
 *   db.batch().delete(ref) / .commit()
 *
 * `calls` records every write so tests can assert on payloads.
 * `behaviour` lets tests seed documents and inject failures.
 */
function createFirestoreMock() {
    const calls = {
        set: [],
        update: [],
        delete: [],
        get: [],
        batchDeletes: [],
        batchCommits: 0
    };

    const behaviour = {
        // seeded documents, keyed by sub-collection name
        docs: {
            user_favorites: [],
            favorite_folders: []
        },
        // injected failures
        getError: null,
        setError: null,
        updateError: null,
        deleteError: null,
        batchCommitError: null
    };

    const toSnapshot = (name) => ({
        docs: (behaviour.docs[name] || []).map((d) => {
            const { id, ...rest } = d;
            return {
                id,
                ref: { __path: `${name}/${id}` },
                data: () => rest
            };
        })
    });

    const makeDoc = (name, docId) => ({
        set: jest.fn((data) => {
            calls.set.push({ collection: name, docId, data });
            return behaviour.setError
                ? Promise.reject(behaviour.setError)
                : Promise.resolve();
        }),
        update: jest.fn((data) => {
            calls.update.push({ collection: name, docId, data });
            return behaviour.updateError
                ? Promise.reject(behaviour.updateError)
                : Promise.resolve();
        }),
        delete: jest.fn(() => {
            calls.delete.push({ collection: name, docId });
            return behaviour.deleteError
                ? Promise.reject(behaviour.deleteError)
                : Promise.resolve();
        }),
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) }))
    });

    const makeSubCollection = (name) => {
        const query = {
            doc: jest.fn((docId) => makeDoc(name, docId)),
            where: jest.fn(() => query),
            limit: jest.fn(() => query),
            orderBy: jest.fn(() => query),
            get: jest.fn(() => {
                calls.get.push(name);
                return behaviour.getError
                    ? Promise.reject(behaviour.getError)
                    : Promise.resolve(toSnapshot(name));
            })
        };
        return query;
    };

    const db = {
        collection: jest.fn(() => ({
            doc: jest.fn(() => ({
                collection: jest.fn((name) => makeSubCollection(name))
            }))
        })),
        batch: jest.fn(() => ({
            delete: jest.fn((ref) => calls.batchDeletes.push(ref)),
            commit: jest.fn(() => {
                calls.batchCommits++;
                return behaviour.batchCommitError
                    ? Promise.reject(behaviour.batchCommitError)
                    : Promise.resolve();
            })
        }))
    };

    return { db, calls, behaviour };
}

function createTestUser() {
    return {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
    };
}

function setNavigator(overrides = {}) {
    Object.defineProperty(global, 'navigator', {
        value: {
            userAgent: 'test',
            onLine: true,
            vibrate: jest.fn(),
            clipboard: { writeText: jest.fn(() => Promise.resolve()) },
            ...overrides
        },
        writable: true,
        configurable: true
    });
}

/** Build a favourite button element with the dataset the service reads. */
function makeFavoriteButton(attrs = {}) {
    const btn = document.createElement('button');
    btn.className = 'entity-favorite';
    btn.dataset.entityId = attrs.entityId ?? 'zeus';
    btn.dataset.entityType = attrs.entityType ?? 'deity';
    if (attrs.entityName !== null) btn.dataset.entityName = attrs.entityName ?? 'Zeus';
    if (attrs.entityMythology) btn.dataset.entityMythology = attrs.entityMythology;
    if (attrs.entityIcon) btn.dataset.entityIcon = attrs.entityIcon;
    if (attrs.entityId === null) delete btn.dataset.entityId;
    if (attrs.entityType === null) delete btn.dataset.entityType;
    document.body.appendChild(btn);
    return btn;
}

// ==========================================================================

describe('FavoritesService', () => {
    let service;
    let mockDb;
    let calls;
    let behaviour;
    let mockAuth;
    let testUser;

    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';

        // Keep the flag set so constructing services in tests never attaches a
        // real document click listener (which would leak between tests).
        // The delegation tests capture the handler explicitly instead.
        global.window._favoritesEventDelegationInitialized = true;

        setNavigator();

        global.window.toast = {
            success: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
            show: jest.fn()
        };
        delete global.window.ToastNotification;
        delete global.window.entityLoader;

        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = jest.fn();

        testUser = createTestUser();
        const mocks = createFirestoreMock();
        mockDb = mocks.db;
        calls = mocks.calls;
        behaviour = mocks.behaviour;
        mockAuth = { currentUser: testUser };

        // global firebase fallback used by _getCurrentUser
        global.firebase = {
            auth: jest.fn(() => ({ currentUser: null })),
            firestore: jest.fn(() => mockDb)
        };

        service = new FavoritesService({ firestore: mockDb, auth: mockAuth });
    });

    /** Seed a valid, non-expired cache for the test user. */
    function seedCache(favorites) {
        const map = new Map();
        const lookup = new Set();
        favorites.forEach((f) => {
            const id = f.id || `${f.entityType}_${f.entityId}`;
            map.set(id, { id, ...f });
            lookup.add(`${f.entityType}::${f.entityId}`);
        });
        service._cache.set(testUser.uid, map);
        service._favoritedLookup.set(testUser.uid, lookup);
        service._cacheTimestamps.set(testUser.uid, Date.now());
        return map;
    }

    // ======================================================================
    // Constructor & initialization
    // ======================================================================

    describe('constructor', () => {
        test('uses the injected firestore and auth', () => {
            expect(service.db).toBe(mockDb);
            expect(service.auth).toBe(mockAuth);
        });

        test('starts with empty caches and a 5 minute TTL', () => {
            expect(service._cache.size).toBe(0);
            expect(service._favoritedLookup.size).toBe(0);
            expect(service._pendingFetches.size).toBe(0);
            expect(service._cacheTTL).toBe(5 * 60 * 1000);
        });

        test('falls back to window.EyesOfAzrael when no options given', () => {
            const globalDb = { collection: jest.fn() };
            const globalAuth = { currentUser: null };
            global.window.EyesOfAzrael = { db: globalDb, firebaseAuth: globalAuth };

            const s = new FavoritesService();
            expect(s.db).toBe(globalDb);
            expect(s.auth).toBe(globalAuth);

            delete global.window.EyesOfAzrael;
        });

        test('uses the documented collection names', () => {
            expect(service.COLLECTION).toBe('user_favorites');
            expect(service.FOLDERS_COLLECTION).toBe('favorite_folders');
        });
    });

    describe('_restorePendingChangesFromStorage', () => {
        let originalLocalStorage;

        beforeEach(() => {
            originalLocalStorage = global.localStorage;
        });

        afterEach(() => {
            Object.defineProperty(global, 'localStorage', {
                value: originalLocalStorage,
                writable: true,
                configurable: true
            });
        });

        function installStorage(value) {
            Object.defineProperty(global, 'localStorage', {
                value,
                writable: true,
                configurable: true
            });
        }

        test('rehydrates pending changes for every user key found in storage', () => {
            const pending = { adds: [{ docId: 'deity_zeus' }], removes: [] };
            installStorage({
                'eoa_favorites_pending_user-a': JSON.stringify(pending),
                getItem(k) { return Object.prototype.hasOwnProperty.call(this, k) ? this[k] : null; },
                setItem() {},
                removeItem() {},
                clear() {}
            });

            const s = new FavoritesService({ firestore: mockDb, auth: mockAuth });

            expect(s._pendingLocalChanges.get('user-a')).toEqual(pending);
        });

        test('swallows storage enumeration errors instead of failing construction', () => {
            installStorage(new Proxy({}, {
                ownKeys() { throw new Error('SecurityError: storage disabled'); }
            }));

            expect(() => new FavoritesService({ firestore: mockDb, auth: mockAuth })).not.toThrow();
            expect(console.warn).toHaveBeenCalledWith(
                '[FavoritesService] Failed to restore pending changes:',
                expect.any(Error)
            );
        });
    });

    // ======================================================================
    // Auth
    // ======================================================================

    describe('_getCurrentUser / _checkAuthState', () => {
        test('reports authenticated for a user with a uid', () => {
            const result = service._checkAuthState();
            expect(result).toEqual({ authenticated: true, user: testUser });
        });

        test('reports no_user when nobody is signed in', () => {
            mockAuth.currentUser = null;
            expect(service._checkAuthState()).toEqual({
                authenticated: false,
                user: null,
                reason: 'no_user'
            });
        });

        test('reports invalid_user for a user object without a uid', () => {
            mockAuth.currentUser = { email: 'test@example.com' };
            expect(service._checkAuthState()).toEqual({
                authenticated: false,
                user: null,
                reason: 'invalid_user'
            });
        });

        test('falls back to the global firebase.auth() when no auth was injected', () => {
            const fallbackUser = { uid: 'fallback-user' };
            service.auth = null;
            global.firebase.auth = jest.fn(() => ({ currentUser: fallbackUser }));

            expect(service._getCurrentUser()).toBe(fallbackUser);
        });

        test('returns null when neither injected auth nor the firebase global exist', () => {
            service.auth = null;
            delete global.firebase;

            expect(service._getCurrentUser()).toBeNull();
        });
    });

    // ======================================================================
    // getFavorites
    // ======================================================================

    describe('getFavorites', () => {
        test('returns an empty array when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.getFavorites()).resolves.toEqual([]);
        });

        test('returns a not_authenticated result object when asked for one', async () => {
            mockAuth.currentUser = null;
            const result = await service.getFavorites({ returnResultObject: true });
            expect(result).toEqual({
                success: false,
                data: [],
                error: 'User not authenticated',
                status: 'not_authenticated'
            });
        });

        test('serves from cache without touching Firestore', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            const result = await service.getFavorites();

            expect(result).toHaveLength(1);
            expect(result[0].entityId).toBe('zeus');
            expect(calls.get).toHaveLength(0);
        });

        test('filters the cached results by folderId', async () => {
            seedCache([
                { entityId: 'zeus', entityType: 'deity', name: 'Zeus', folderId: 'f1' },
                { entityId: 'ra', entityType: 'deity', name: 'Ra', folderId: 'f2' }
            ]);

            const result = await service.getFavorites({ folderId: 'f2' });

            expect(result).toHaveLength(1);
            expect(result[0].entityId).toBe('ra');
        });

        test('returns an authenticated result object from cache', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            const result = await service.getFavorites({ returnResultObject: true });

            expect(result.success).toBe(true);
            expect(result.status).toBe('authenticated');
            expect(result.data).toHaveLength(1);
        });

        test('ignores an expired cache and refetches from Firestore', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            service._cacheTimestamps.set(testUser.uid, Date.now() - 10 * 60 * 1000);
            behaviour.docs.user_favorites = [
                { id: 'deity_ra', entityId: 'ra', entityType: 'deity', name: 'Ra', addedAt: 5 }
            ];

            const result = await service.getFavorites();

            expect(calls.get).toContain('user_favorites');
            expect(result).toHaveLength(1);
            expect(result[0].entityId).toBe('ra');
        });

        test('fetches from Firestore, merges the doc id, and rebuilds the lookup set', async () => {
            behaviour.docs.user_favorites = [
                { id: 'deity_zeus', entityId: 'zeus', entityType: 'deity', name: 'Zeus', addedAt: 2 },
                { id: 'creature_hydra', entityId: 'hydra', entityType: 'creature', name: 'Hydra', addedAt: 1 }
            ];

            const result = await service.getFavorites();

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ id: 'deity_zeus', entityId: 'zeus', name: 'Zeus' });
            expect(service._favoritedLookup.get(testUser.uid).has('deity::zeus')).toBe(true);
            expect(service._favoritedLookup.get(testUser.uid).has('creature::hydra')).toBe(true);
            expect(service._isCacheValid(testUser.uid)).toBe(true);
        });

        test('tolerates a malformed document that is missing entityId/entityType', async () => {
            behaviour.docs.user_favorites = [{ id: 'broken_doc', name: 'Nameless' }];

            const result = await service.getFavorites();

            expect(result).toEqual([{ id: 'broken_doc', name: 'Nameless' }]);
            // It is indexed under the undefined composite key, so real lookups miss.
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(false);
        });

        test('_fetchFavoritesFromFirebase rejects when Firestore is not initialised', async () => {
            service.db = null;
            await expect(service._fetchFavoritesFromFirebase(testUser.uid))
                .rejects.toThrow('Firebase not initialized');
        });

        test('falls back to localStorage when the Firestore read is rejected', async () => {
            behaviour.getError = new Error('Quota exceeded');
            localStorage.setItem(
                `eoa_favorites_${testUser.uid}`,
                JSON.stringify([
                    { entityId: 'zeus', entityType: 'deity', name: 'Zeus' }
                ])
            );

            const result = await service.getFavorites();

            expect(result).toHaveLength(1);
            expect(result[0].entityId).toBe('zeus');
            expect(console.error).toHaveBeenCalledWith(
                '[FavoritesService] Failed to get favorites:',
                expect.any(Error)
            );
        });

        test('the localStorage fallback repopulates the cache with a shortened TTL', async () => {
            behaviour.getError = new Error('Quota exceeded');
            localStorage.setItem(
                `eoa_favorites_${testUser.uid}`,
                JSON.stringify([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }])
            );

            await service.getFavorites();

            expect(service.isFavoritedSync('zeus', 'deity')).toBe(true);
            expect(service._isCacheValid(testUser.uid)).toBe(true);
            // TTL is deliberately shortened to ~1 minute so we refetch soon.
            const age = Date.now() - service._cacheTimestamps.get(testUser.uid);
            expect(age).toBeGreaterThanOrEqual(service._cacheTTL - 60000 - 50);
        });

        test('reports status "error" and success=false when the read fails and there is no local copy', async () => {
            behaviour.getError = new Error('Quota exceeded');

            const result = await service.getFavorites({ returnResultObject: true });

            expect(result).toEqual({
                success: false,
                data: [],
                error: 'Quota exceeded',
                status: 'error'
            });
        });

        test('deduplicates concurrent fetches into a single Firestore read', async () => {
            behaviour.docs.user_favorites = [
                { id: 'deity_zeus', entityId: 'zeus', entityType: 'deity', name: 'Zeus', addedAt: 1 }
            ];

            const [a, b] = await Promise.all([service.getFavorites(), service.getFavorites()]);

            expect(calls.get.filter((c) => c === 'user_favorites')).toHaveLength(1);
            expect(a).toHaveLength(1);
            expect(b).toHaveLength(1);
        });

        test('the shared-fetch branch still honours the folderId filter', async () => {
            behaviour.docs.user_favorites = [
                { id: 'deity_zeus', entityId: 'zeus', entityType: 'deity', name: 'Zeus', folderId: 'f1', addedAt: 2 },
                { id: 'deity_ra', entityId: 'ra', entityType: 'deity', name: 'Ra', folderId: 'f2', addedAt: 1 }
            ];

            const [first, second] = await Promise.all([
                service.getFavorites(),
                service.getFavorites({ folderId: 'f2', returnResultObject: true })
            ]);

            expect(first).toHaveLength(2);
            expect(second.data).toHaveLength(1);
            expect(second.data[0].entityId).toBe('ra');
        });

        test('BUG: a piggy-backing concurrent caller gets the raw rejection instead of the localStorage fallback', async () => {
            // favorites-service.js:392-404 — the "there is already a pending fetch"
            // branch awaits the shared promise with no try/catch, so the second
            // caller rejects while the first caller is gracefully handled at :422.
            // A fix would make BOTH resolve to the localStorage fallback; this
            // assertion would then need to become `.resolves`.
            behaviour.getError = new Error('Quota exceeded');
            localStorage.setItem(
                `eoa_favorites_${testUser.uid}`,
                JSON.stringify([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }])
            );

            const first = service.getFavorites();
            const second = service.getFavorites().then(
                (value) => ({ resolved: value }),
                (error) => ({ rejected: error })
            );

            const firstResult = await first;
            const secondResult = await second;

            expect(firstResult).toHaveLength(1);
            expect(secondResult.rejected).toBeInstanceOf(Error);
            expect(secondResult.rejected.message).toBe('Quota exceeded');
        });

        test('returns an authenticated result object after a fresh Firestore read', async () => {
            behaviour.docs.user_favorites = [
                { id: 'deity_zeus', entityId: 'zeus', entityType: 'deity', name: 'Zeus', folderId: 'f1', addedAt: 1 },
                { id: 'deity_ra', entityId: 'ra', entityType: 'deity', name: 'Ra', folderId: 'f2', addedAt: 2 }
            ];

            const result = await service.getFavorites({ returnResultObject: true, folderId: 'f1' });

            expect(result.success).toBe(true);
            expect(result.status).toBe('authenticated');
            expect(result.data).toHaveLength(1);
            expect(result.data[0].entityId).toBe('zeus');
        });

        test('clears the pending fetch entry once the read settles', async () => {
            await service.getFavorites();
            expect(service._pendingFetches.has(testUser.uid)).toBe(false);
        });
    });

    // ======================================================================
    // isFavorited
    // ======================================================================

    describe('isFavorited / isFavoritedSync', () => {
        test('isFavorited is false when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.isFavorited('zeus', 'deity')).resolves.toBe(false);
        });

        test('isFavorited answers from the lookup set without hitting Firestore', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            await expect(service.isFavorited('zeus', 'deity')).resolves.toBe(true);
            await expect(service.isFavorited('poseidon', 'deity')).resolves.toBe(false);
            expect(calls.get).toHaveLength(0);
        });

        test('isFavorited fetches when the cache is cold, then answers from the rebuilt set', async () => {
            behaviour.docs.user_favorites = [
                { id: 'deity_zeus', entityId: 'zeus', entityType: 'deity', name: 'Zeus', addedAt: 1 }
            ];

            await expect(service.isFavorited('zeus', 'deity')).resolves.toBe(true);
            expect(calls.get).toContain('user_favorites');
        });

        test('isFavorited falls back to a linear scan when no lookup set was built', async () => {
            // Documented fallback at favorites-service.js:565-569 — getFavorites
            // returned rows but never populated the O(1) set for this user.
            jest.spyOn(service, 'getFavorites').mockResolvedValue([
                { entityId: 'zeus', entityType: 'deity', name: 'Zeus' }
            ]);

            await expect(service.isFavorited('zeus', 'deity')).resolves.toBe(true);
            await expect(service.isFavorited('zeus', 'hero')).resolves.toBe(false);
            await expect(service.isFavorited('ra', 'deity')).resolves.toBe(false);
            expect(service._favoritedLookup.has(testUser.uid)).toBe(false);
        });

        test('isFavorited is false when the read fails and there is no local copy', async () => {
            behaviour.getError = new Error('Quota exceeded');

            await expect(service.isFavorited('zeus', 'deity')).resolves.toBe(false);
        });

        test('isFavorited distinguishes entities that share an id across types', async () => {
            seedCache([{ entityId: 'apollo', entityType: 'deity', name: 'Apollo' }]);

            await expect(service.isFavorited('apollo', 'deity')).resolves.toBe(true);
            await expect(service.isFavorited('apollo', 'hero')).resolves.toBe(false);
        });

        test('isFavoritedSync is false when not authenticated', () => {
            mockAuth.currentUser = null;
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(false);
        });

        test('isFavoritedSync is false when no lookup set has been built', () => {
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(false);
        });

        test('isFavoritedSync reads the lookup set', () => {
            service._favoritedLookup.set(testUser.uid, new Set(['deity::zeus']));
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(true);
            expect(service.isFavoritedSync('poseidon', 'deity')).toBe(false);
        });
    });

    // ======================================================================
    // addFavorite
    // ======================================================================

    describe('addFavorite', () => {
        test('rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            const result = await service.addFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });
            expect(result).toEqual({
                success: false,
                error: 'Not authenticated',
                code: 'AUTH_REQUIRED'
            });
        });

        test.each([
            [null, 'Entity is required'],
            [{ type: 'deity', name: 'Zeus' }, 'Entity ID is required'],
            [{ id: 'zeus', name: 'Zeus' }, 'Entity type is required'],
            [{ id: 'zeus', type: 'deity' }, 'Entity name is required']
        ])('rejects invalid entity %#', async (entity, expectedError) => {
            const result = await service.addFavorite(entity);
            expect(result.success).toBe(false);
            expect(result.code).toBe('VALIDATION_ERROR');
            expect(result.error).toBe(expectedError);
            expect(calls.set).toHaveLength(0);
        });

        test('writes the normalised favourite document to Firestore', async () => {
            const result = await service.addFavorite({
                id: 'zeus',
                type: 'deity',
                name: 'Zeus',
                mythology: 'greek',
                icon: 'Z',
                tags: ['sky']
            }, 'folder-1');

            expect(result.success).toBe(true);
            expect(calls.set).toHaveLength(1);
            expect(calls.set[0].collection).toBe('user_favorites');
            expect(calls.set[0].docId).toBe('deity_zeus');
            expect(calls.set[0].data).toMatchObject({
                entityId: 'zeus',
                entityType: 'deity',
                mythology: 'greek',
                name: 'Zeus',
                icon: 'Z',
                folderId: 'folder-1',
                tags: ['sky']
            });
            expect(typeof calls.set[0].data.addedAt).toBe('number');
        });

        test('defaults mythology, icon, folderId and tags when absent', async () => {
            await service.addFavorite({ entityId: 'hydra', entityType: 'creature', name: 'Hydra' });

            expect(calls.set[0].data).toMatchObject({
                mythology: 'unknown',
                icon: null,
                folderId: null,
                tags: []
            });
        });

        test('accepts primaryMythology as the mythology source', async () => {
            await service.addFavorite({
                id: 'ra', type: 'deity', name: 'Ra', primaryMythology: 'egyptian'
            });
            expect(calls.set[0].data.mythology).toBe('egyptian');
        });

        test('updates cache, lookup set, localStorage and emits favorite-added', async () => {
            const listener = jest.fn();
            service.subscribe(listener);

            await service.addFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });

            expect(service.isFavoritedSync('zeus', 'deity')).toBe(true);
            expect(service._cache.get(testUser.uid).get('deity_zeus').name).toBe('Zeus');

            const stored = JSON.parse(localStorage.getItem(`eoa_favorites_${testUser.uid}`));
            expect(stored).toHaveLength(1);
            expect(stored[0].entityId).toBe('zeus');

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                event: 'favorite-added',
                data: expect.objectContaining({ id: 'deity_zeus', name: 'Zeus' })
            }));
        });

        test('does not track a pending sync change on a successful online write', async () => {
            await service.addFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });
            expect(service.hasPendingChanges()).toBe(false);
        });

        test('falls back to an offline save when the Firestore write is rejected', async () => {
            behaviour.setError = new Error('PERMISSION_DENIED');

            const result = await service.addFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });

            expect(result.success).toBe(true);
            expect(result.offline).toBe(true);
            expect(result.message).toBe('Saved locally. Will sync when online.');
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(true);
            expect(service.hasPendingChanges()).toBe(true);
            expect(console.error).toHaveBeenCalledWith(
                '[FavoritesService] Failed to add favorite to Firebase:',
                expect.any(Error)
            );
        });

        test('saves offline (no Firestore call) when navigator reports offline', async () => {
            setNavigator({ onLine: false });

            const result = await service.addFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });

            expect(result.offline).toBe(true);
            expect(calls.set).toHaveLength(0);
            const pending = JSON.parse(localStorage.getItem(`eoa_favorites_pending_${testUser.uid}`));
            expect(pending.adds).toHaveLength(1);
            expect(pending.adds[0].docId).toBe('deity_zeus');
        });

        test('saves offline when no Firestore instance is configured', async () => {
            service.db = null;

            const result = await service.addFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });

            expect(result.offline).toBe(true);
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(true);
        });

        test('reports OFFLINE_SAVE_FAILED when the local persistence step throws', async () => {
            setNavigator({ onLine: false });
            jest.spyOn(service, '_saveToLocalStorage').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            const result = await service.addFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });

            expect(result).toEqual({
                success: false,
                error: 'QuotaExceededError',
                code: 'OFFLINE_SAVE_FAILED'
            });
        });
    });

    // ======================================================================
    // removeFavorite
    // ======================================================================

    describe('removeFavorite', () => {
        test('rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            const result = await service.removeFavorite('zeus', 'deity');
            expect(result).toEqual({
                success: false,
                error: 'Not authenticated',
                code: 'AUTH_REQUIRED'
            });
        });

        test.each([
            [null, 'deity'],
            ['zeus', null],
            ['', ''],
            [undefined, undefined]
        ])('rejects missing identifiers (%s, %s)', async (entityId, entityType) => {
            const result = await service.removeFavorite(entityId, entityType);
            expect(result).toEqual({
                success: false,
                error: 'Entity ID and type are required',
                code: 'VALIDATION_ERROR'
            });
            expect(calls.delete).toHaveLength(0);
        });

        test('deletes the document and clears cache, lookup and localStorage', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            const listener = jest.fn();
            service.subscribe(listener);

            const result = await service.removeFavorite('zeus', 'deity');

            expect(result).toEqual({ success: true });
            expect(calls.delete).toEqual([{ collection: 'user_favorites', docId: 'deity_zeus' }]);
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(false);
            expect(service._cache.get(testUser.uid).has('deity_zeus')).toBe(false);
            expect(JSON.parse(localStorage.getItem(`eoa_favorites_${testUser.uid}`))).toEqual([]);
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                event: 'favorite-removed',
                data: { entityId: 'zeus', entityType: 'deity' }
            }));
        });

        test('names the entity in the toast using the cached record', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            await service.removeFavorite('zeus', 'deity');

            expect(window.toast.info).toHaveBeenCalledWith('Removed Zeus from your Pantheon');
        });

        test('falls back to "Entity" in the toast when nothing is cached', async () => {
            await service.removeFavorite('zeus', 'deity');
            expect(window.toast.info).toHaveBeenCalledWith('Removed Entity from your Pantheon');
        });

        test('falls back to an offline remove when the delete is rejected', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            behaviour.deleteError = new Error('UNAVAILABLE');

            const result = await service.removeFavorite('zeus', 'deity');

            expect(result.success).toBe(true);
            expect(result.offline).toBe(true);
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(false);
            const pending = JSON.parse(localStorage.getItem(`eoa_favorites_pending_${testUser.uid}`));
            expect(pending.removes).toHaveLength(1);
            expect(pending.removes[0]).toMatchObject({
                docId: 'deity_zeus', entityId: 'zeus', entityType: 'deity'
            });
        });

        test('removes offline without calling Firestore when navigator is offline', async () => {
            setNavigator({ onLine: false });
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            const result = await service.removeFavorite('zeus', 'deity');

            expect(result.offline).toBe(true);
            expect(calls.delete).toHaveLength(0);
        });

        test('reports OFFLINE_REMOVE_FAILED when local persistence throws', async () => {
            setNavigator({ onLine: false });
            jest.spyOn(service, '_saveToLocalStorage').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            const result = await service.removeFavorite('zeus', 'deity');

            expect(result).toEqual({
                success: false,
                error: 'QuotaExceededError',
                code: 'OFFLINE_REMOVE_FAILED'
            });
        });
    });

    // ======================================================================
    // toggleFavorite
    // ======================================================================

    describe('toggleFavorite', () => {
        test('rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            const result = await service.toggleFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });
            expect(result).toMatchObject({
                success: false, isFavorited: false, code: 'AUTH_REQUIRED'
            });
        });

        test('rejects a null entity', async () => {
            const result = await service.toggleFavorite(null);
            expect(result).toEqual({
                success: false,
                isFavorited: false,
                error: 'Entity is required',
                code: 'VALIDATION_ERROR'
            });
        });

        test('rejects an entity with no id or type', async () => {
            const result = await service.toggleFavorite({ name: 'Zeus' });
            expect(result).toMatchObject({
                success: false, isFavorited: false, code: 'VALIDATION_ERROR'
            });
        });

        test('adds when the entity is not currently favourited', async () => {
            seedCache([]);

            const result = await service.toggleFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });

            expect(result.success).toBe(true);
            expect(result.isFavorited).toBe(true);
            expect(calls.set).toHaveLength(1);
            expect(calls.delete).toHaveLength(0);
        });

        test('removes when the entity is currently favourited', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            const result = await service.toggleFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });

            expect(result.success).toBe(true);
            expect(result.isFavorited).toBe(false);
            expect(calls.delete).toHaveLength(1);
            expect(calls.set).toHaveLength(0);
        });

        test('returns TOGGLE_FAILED when the lookup itself throws', async () => {
            jest.spyOn(service, 'isFavorited').mockRejectedValue(new Error('lookup exploded'));

            const result = await service.toggleFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });

            expect(result).toEqual({
                success: false,
                isFavorited: false,
                error: 'lookup exploded',
                code: 'TOGGLE_FAILED'
            });
        });

        test('BUG: reports isFavorited=true even when the add failed', async () => {
            // favorites-service.js:893-894 — the add result is spread and then
            // `isFavorited: true` is stamped on unconditionally, so a failed add
            // is reported as "now favourited". A fix should derive isFavorited
            // from result.success; this assertion would become `false`.
            seedCache([]);
            jest.spyOn(service, 'addFavorite').mockResolvedValue({
                success: false, error: 'Not authenticated', code: 'AUTH_REQUIRED'
            });

            const result = await service.toggleFavorite({ id: 'zeus', type: 'deity', name: 'Zeus' });

            expect(result.success).toBe(false);
            expect(result.isFavorited).toBe(true);
        });
    });

    // ======================================================================
    // Derived queries
    // ======================================================================

    describe('derived queries', () => {
        beforeEach(() => {
            seedCache([
                { entityId: 'zeus', entityType: 'deity', name: 'Zeus', mythology: 'Greek', folderId: 'f1' },
                { entityId: 'ra', entityType: 'deity', name: 'Ra', mythology: 'egyptian', folderId: null },
                { entityId: 'hydra', entityType: 'creature', name: 'Hydra', mythology: 'greek', folderId: 'f1' }
            ]);
        });

        test('getCount returns the number of favourites', async () => {
            await expect(service.getCount()).resolves.toBe(3);
        });

        test('getCount is 0 when unauthenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.getCount()).resolves.toBe(0);
        });

        test('getByMythology matches case-insensitively', async () => {
            const result = await service.getByMythology('greek');
            expect(result.map((f) => f.entityId).sort()).toEqual(['hydra', 'zeus']);
        });

        test('getByMythology returns nothing for an unknown mythology', async () => {
            await expect(service.getByMythology('norse')).resolves.toEqual([]);
        });

        test('getByType filters on entityType', async () => {
            const result = await service.getByType('creature');
            expect(result).toHaveLength(1);
            expect(result[0].entityId).toBe('hydra');
        });

        test('getByFolder filters on folderId', async () => {
            const result = await service.getByFolder('f1');
            expect(result.map((f) => f.entityId).sort()).toEqual(['hydra', 'zeus']);
        });
    });

    // ======================================================================
    // Folders
    // ======================================================================

    describe('folders', () => {
        test('createFolder rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.createFolder({ name: 'X' }))
                .resolves.toEqual({ success: false, error: 'Not authenticated' });
        });

        test('createFolder writes the folder and caches it', async () => {
            const result = await service.createFolder({ name: 'Olympians', icon: 'O', color: '#fff', order: 3 });

            expect(result.success).toBe(true);
            expect(result.data).toMatchObject({
                name: 'Olympians', icon: 'O', color: '#fff', order: 3
            });
            expect(result.data.id).toMatch(/^folder_\d+_/);
            expect(calls.set).toHaveLength(1);
            expect(calls.set[0].collection).toBe('favorite_folders');
            expect(calls.set[0].docId).toBe(result.data.id);
            expect(service._foldersCache.get(testUser.uid).get(result.data.id)).toEqual(result.data);
        });

        test('createFolder applies defaults for name and colour', async () => {
            const result = await service.createFolder({});
            expect(result.data.name).toBe('New Collection');
            expect(result.data.color).toBe('#8b7fff');
            expect(result.data.icon).toBeNull();
            expect(result.data.order).toBe(0);
        });

        test('createFolder still caches the folder while offline (no write)', async () => {
            setNavigator({ onLine: false });

            const result = await service.createFolder({ name: 'Offline Set' });

            expect(result.success).toBe(true);
            expect(calls.set).toHaveLength(0);
            expect(service._foldersCache.get(testUser.uid).size).toBe(1);
        });

        test('createFolder surfaces a rejected write', async () => {
            behaviour.setError = new Error('PERMISSION_DENIED');

            const result = await service.createFolder({ name: 'Nope' });

            expect(result).toEqual({ success: false, error: 'PERMISSION_DENIED' });
            expect(service._foldersCache.has(testUser.uid)).toBe(false);
        });

        test('getFolders returns [] when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.getFolders()).resolves.toEqual([]);
        });

        test('getFolders reads Firestore and caches the result', async () => {
            behaviour.docs.favorite_folders = [
                { id: 'f2', name: 'Second', order: 2 },
                { id: 'f1', name: 'First', order: 1 }
            ];

            const first = await service.getFolders();
            expect(first).toHaveLength(2);
            expect(calls.get.filter((c) => c === 'favorite_folders')).toHaveLength(1);

            const second = await service.getFolders();
            expect(second).toHaveLength(2);
            // cached — no second read
            expect(calls.get.filter((c) => c === 'favorite_folders')).toHaveLength(1);
        });

        test('getFolders sorts cached folders by order', async () => {
            const cache = new Map();
            cache.set('b', { id: 'b', name: 'B', order: 5 });
            cache.set('a', { id: 'a', name: 'A', order: 1 });
            cache.set('c', { id: 'c', name: 'C' });
            service._foldersCache.set(testUser.uid, cache);

            const result = await service.getFolders();
            expect(result.map((f) => f.id)).toEqual(['c', 'a', 'b']);
        });

        test('getFolders returns [] and logs when the read is rejected', async () => {
            behaviour.getError = new Error('Quota exceeded');

            await expect(service.getFolders()).resolves.toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                '[FavoritesService] Failed to get folders:',
                expect.any(Error)
            );
        });

        test('getFolders returns [] when there is no Firestore instance', async () => {
            service.db = null;
            await expect(service.getFolders()).resolves.toEqual([]);
        });

        test('updateFolder rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.updateFolder('f1', { name: 'X' }))
                .resolves.toEqual({ success: false, error: 'Not authenticated' });
        });

        test('updateFolder writes the patch and merges it into the cache', async () => {
            const cache = new Map([['f1', { id: 'f1', name: 'Old', order: 0 }]]);
            service._foldersCache.set(testUser.uid, cache);
            const listener = jest.fn();
            service.subscribe(listener);

            const result = await service.updateFolder('f1', { name: 'New' });

            expect(result).toEqual({ success: true });
            expect(calls.update).toEqual([
                { collection: 'favorite_folders', docId: 'f1', data: { name: 'New' } }
            ]);
            expect(cache.get('f1').name).toBe('New');
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                event: 'folder-updated',
                data: { folderId: 'f1', updates: { name: 'New' } }
            }));
        });

        test('updateFolder tolerates a folder that is not in the cache', async () => {
            service._foldersCache.set(testUser.uid, new Map());
            await expect(service.updateFolder('missing', { name: 'X' }))
                .resolves.toEqual({ success: true });
        });

        test('updateFolder surfaces a rejected update', async () => {
            behaviour.updateError = new Error('NOT_FOUND');
            const result = await service.updateFolder('f1', { name: 'X' });
            expect(result).toEqual({ success: false, error: 'NOT_FOUND' });
        });

        test('deleteFolder rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.deleteFolder('f1'))
                .resolves.toEqual({ success: false, error: 'Not authenticated' });
        });

        test('deleteFolder deletes the doc, uncategorises its favourites and drops the cache entry', async () => {
            service._foldersCache.set(testUser.uid, new Map([['f1', { id: 'f1', name: 'F1' }]]));
            seedCache([
                { entityId: 'zeus', entityType: 'deity', name: 'Zeus', folderId: 'f1' },
                { entityId: 'ra', entityType: 'deity', name: 'Ra', folderId: 'f2' }
            ]);

            const result = await service.deleteFolder('f1');

            expect(result).toEqual({ success: true });
            expect(calls.delete).toEqual([{ collection: 'favorite_folders', docId: 'f1' }]);
            // Only the favourite that lived in f1 was moved
            expect(calls.update).toEqual([
                { collection: 'user_favorites', docId: 'deity_zeus', data: { folderId: null } }
            ]);
            expect(service._cache.get(testUser.uid).get('deity_zeus').folderId).toBeNull();
            expect(service._foldersCache.get(testUser.uid).has('f1')).toBe(false);
        });

        test('deleteFolder surfaces a rejected delete', async () => {
            behaviour.deleteError = new Error('PERMISSION_DENIED');
            const result = await service.deleteFolder('f1');
            expect(result).toEqual({ success: false, error: 'PERMISSION_DENIED' });
        });

        test('moveFavoriteToFolder rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.moveFavoriteToFolder('zeus', 'deity', 'f1'))
                .resolves.toEqual({ success: false, error: 'Not authenticated' });
        });

        test('moveFavoriteToFolder updates Firestore, cache, localStorage and emits', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus', folderId: null }]);
            const listener = jest.fn();
            service.subscribe(listener);

            const result = await service.moveFavoriteToFolder('zeus', 'deity', 'f9');

            expect(result).toEqual({ success: true });
            expect(calls.update[0]).toEqual({
                collection: 'user_favorites', docId: 'deity_zeus', data: { folderId: 'f9' }
            });
            expect(service._cache.get(testUser.uid).get('deity_zeus').folderId).toBe('f9');
            const stored = JSON.parse(localStorage.getItem(`eoa_favorites_${testUser.uid}`));
            expect(stored[0].folderId).toBe('f9');
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                event: 'favorite-moved',
                data: { entityId: 'zeus', entityType: 'deity', folderId: 'f9' }
            }));
        });

        test('moveFavoriteToFolder skips the write when offline but still updates the cache', async () => {
            setNavigator({ onLine: false });
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus', folderId: 'f1' }]);

            const result = await service.moveFavoriteToFolder('zeus', 'deity', null);

            expect(result).toEqual({ success: true });
            expect(calls.update).toHaveLength(0);
            expect(service._cache.get(testUser.uid).get('deity_zeus').folderId).toBeNull();
        });

        test('moveFavoriteToFolder surfaces a rejected update', async () => {
            behaviour.updateError = new Error('NOT_FOUND');
            const result = await service.moveFavoriteToFolder('zeus', 'deity', 'f1');
            expect(result).toEqual({ success: false, error: 'NOT_FOUND' });
        });
    });

    // ======================================================================
    // Bulk add
    // ======================================================================

    describe('addAllFromMythology', () => {
        test('rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.addAllFromMythology('greek', 'deity')).resolves.toEqual({
                success: false, added: 0, skipped: 0, error: 'Not authenticated'
            });
        });

        test('rejects when the entity loader is unavailable', async () => {
            await expect(service.addAllFromMythology('greek', 'deity')).resolves.toEqual({
                success: false, added: 0, skipped: 0, error: 'Entity loader not available'
            });
        });

        test('pluralises the collection name and filters by lowercase mythology', async () => {
            window.entityLoader = {
                loadCollection: jest.fn(() => Promise.resolve([])),
                searchEntities: jest.fn()
            };

            await service.addAllFromMythology('Greek', 'deity');

            expect(window.entityLoader.loadCollection).toHaveBeenCalledWith('deities'.replace('deities', 'deitys'), {
                filters: { mythology: 'greek' }
            });
        });

        test('does not double-pluralise an already-plural entity type', async () => {
            window.entityLoader = { loadCollection: jest.fn(() => Promise.resolve([])) };

            await service.addAllFromMythology('greek', 'creatures');

            expect(window.entityLoader.loadCollection).toHaveBeenCalledWith('creatures', expect.anything());
        });

        test('returns a "No entities found" result for an empty collection', async () => {
            window.entityLoader = { loadCollection: jest.fn(() => Promise.resolve([])) };

            const result = await service.addAllFromMythology('greek', 'deity');

            expect(result).toEqual({
                success: true, added: 0, skipped: 0, message: 'No entities found'
            });
        });

        test('falls back to searchEntities when loadCollection throws', async () => {
            window.entityLoader = {
                loadCollection: jest.fn(() => Promise.reject(new Error('unsupported'))),
                searchEntities: jest.fn(() => Promise.resolve([
                    { id: 'zeus', name: 'Zeus' }
                ]))
            };
            seedCache([]);

            const result = await service.addAllFromMythology('greek', 'deity');

            expect(window.entityLoader.searchEntities).toHaveBeenCalledWith({
                mythology: 'greek', type: 'deity'
            });
            expect(result).toMatchObject({ success: true, added: 1, skipped: 0, total: 1 });
        });

        test('skips entities that are already favourited and counts failures as skipped', async () => {
            window.entityLoader = {
                loadCollection: jest.fn(() => Promise.resolve([
                    { id: 'zeus', name: 'Zeus' },
                    { id: 'ra', name: 'Ra' },
                    { id: 'broken' } // no name -> addFavorite validation failure
                ]))
            };
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            const result = await service.addAllFromMythology('greek', 'deity');

            expect(result).toMatchObject({ success: true, added: 1, skipped: 2, total: 3 });
            expect(calls.set.map((c) => c.docId)).toEqual(['deity_ra']);
        });

        test('returns an error result when the whole operation throws', async () => {
            window.entityLoader = { loadCollection: jest.fn(() => Promise.resolve([{ id: 'a', name: 'A' }])) };
            jest.spyOn(service, 'isFavorited').mockRejectedValue(new Error('boom'));

            const result = await service.addAllFromMythology('greek', 'deity');

            expect(result).toEqual({ success: false, added: 0, skipped: 0, error: 'boom' });
        });
    });

    // ======================================================================
    // Export / import / share
    // ======================================================================

    describe('exportFavorites', () => {
        beforeEach(() => {
            jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        });

        test('rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.exportFavorites())
                .resolves.toEqual({ success: false, error: 'Not authenticated' });
        });

        test('serialises favourites, folders and statistics and triggers a download', async () => {
            seedCache([
                { entityId: 'zeus', entityType: 'deity', name: 'Zeus', mythology: 'greek', icon: 'Z', folderId: 'f1', addedAt: 10 }
            ]);
            service._foldersCache.set(testUser.uid, new Map([['f1', { id: 'f1', name: 'Olympians', order: 0 }]]));

            const result = await service.exportFavorites();

            expect(result.success).toBe(true);
            const parsed = JSON.parse(result.data);
            expect(parsed.version).toBe('1.0');
            expect(parsed.userDisplayName).toBe('Test User');
            expect(parsed.folders).toEqual([{ id: 'f1', name: 'Olympians', order: 0 }]);
            expect(parsed.favorites).toEqual([{
                entityId: 'zeus',
                entityType: 'deity',
                name: 'Zeus',
                mythology: 'greek',
                icon: 'Z',
                folderId: 'f1',
                addedAt: 10
            }]);
            expect(parsed.statistics.total).toBe(1);
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
            expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
        });

        test('removes the temporary anchor from the DOM', async () => {
            seedCache([]);
            await service.exportFavorites();
            expect(document.querySelectorAll('a[download]')).toHaveLength(0);
        });

        test('uses "Anonymous" when the user has no display name', async () => {
            mockAuth.currentUser = { uid: testUser.uid };
            seedCache([]);

            const result = await service.exportFavorites();

            expect(JSON.parse(result.data).userDisplayName).toBe('Anonymous');
        });

        test('returns an error result when gathering the data fails', async () => {
            jest.spyOn(service, 'getFavorites').mockRejectedValue(new Error('read failed'));

            const result = await service.exportFavorites();

            expect(result).toEqual({ success: false, error: 'read failed' });
        });
    });

    describe('importFavorites', () => {
        test('rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.importFavorites('{}'))
                .resolves.toEqual({ success: false, imported: 0, error: 'Not authenticated' });
        });

        test('rejects malformed JSON', async () => {
            const result = await service.importFavorites('not json {');
            expect(result.success).toBe(false);
            expect(result.imported).toBe(0);
            expect(result.error).toEqual(expect.any(String));
        });

        test('rejects a payload with no favorites array', async () => {
            await expect(service.importFavorites(JSON.stringify({ favorites: 'nope' })))
                .resolves.toEqual({ success: false, imported: 0, error: 'Invalid import format' });
        });

        test('imports favourites, skipping ones that already exist', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            const result = await service.importFavorites(JSON.stringify({
                favorites: [
                    { entityId: 'zeus', entityType: 'deity', name: 'Zeus' },
                    { entityId: 'ra', entityType: 'deity', name: 'Ra', mythology: 'egyptian' }
                ]
            }));

            expect(result).toEqual({ success: true, imported: 1 });
            expect(calls.set.map((c) => c.docId)).toEqual(['deity_ra']);
        });

        test('BUG: imported folders are given fresh ids, leaving favourites pointing at dead folderIds', async () => {
            // favorites-service.js:1334-1350 — createFolder() mints a brand new
            // `folder_<ts>_<rand>` id, but the favourites are then written with the
            // folderId from the export file. Nothing remaps them, so every imported
            // favourite references a folder that does not exist.
            // A fix would build an oldId -> newId map; this test would then assert
            // the written folderId equals the newly created folder's id.
            seedCache([]);

            const result = await service.importFavorites(JSON.stringify({
                folders: [{ id: 'f1', name: 'Olympians' }],
                favorites: [{ entityId: 'zeus', entityType: 'deity', name: 'Zeus', folderId: 'f1' }]
            }));

            expect(result.imported).toBe(1);

            const folderWrite = calls.set.find((c) => c.collection === 'favorite_folders');
            const favoriteWrite = calls.set.find((c) => c.collection === 'user_favorites');

            expect(folderWrite.docId).not.toBe('f1');
            expect(favoriteWrite.data.folderId).toBe('f1');
            expect(service._foldersCache.get(testUser.uid).has('f1')).toBe(false);
        });

        test('returns an error result when an import step throws', async () => {
            jest.spyOn(service, 'isFavorited').mockRejectedValue(new Error('lookup failed'));

            const result = await service.importFavorites(JSON.stringify({
                favorites: [{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]
            }));

            expect(result).toEqual({ success: false, imported: 0, error: 'lookup failed' });
        });
    });

    describe('generateShareLink / loadSharedPantheon', () => {
        test('rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.generateShareLink())
                .resolves.toEqual({ success: false, error: 'Not authenticated' });
        });

        test('refuses to share an empty pantheon', async () => {
            seedCache([]);
            await expect(service.generateShareLink())
                .resolves.toEqual({ success: false, error: 'No favorites to share' });
        });

        test('encodes a compact payload and copies it to the clipboard', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            const result = await service.generateShareLink();

            expect(result.success).toBe(true);
            expect(result.url).toContain('/#/shared-pantheon?data=');

            const encoded = result.url.split('data=')[1];
            expect(JSON.parse(atob(encoded))).toEqual([{ i: 'zeus', t: 'd', n: 'Zeus' }]);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(result.url);
        });

        test('caps the shared payload at 50 entries', async () => {
            seedCache(Array.from({ length: 60 }, (_, i) => ({
                entityId: `e${i}`, entityType: 'deity', name: `E${i}`
            })));

            const result = await service.generateShareLink();

            const encoded = result.url.split('data=')[1];
            expect(JSON.parse(atob(encoded))).toHaveLength(50);
        });

        test('still returns the url when the clipboard API is unavailable', async () => {
            setNavigator({ clipboard: undefined });
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            const result = await service.generateShareLink();

            expect(result.success).toBe(true);
            expect(result.url).toContain('shared-pantheon');
        });

        test('returns an error result when an entry has no entityType', async () => {
            seedCache([{ entityId: 'zeus', entityType: undefined, name: 'Zeus' }]);
            // seedCache keys off entityType, so force the malformed record in directly
            service._cache.get(testUser.uid).set('bad', { id: 'bad', entityId: 'zeus', name: 'Zeus' });

            const result = await service.generateShareLink();

            expect(result.success).toBe(false);
            expect(result.error).toEqual(expect.any(String));
        });

        test('loadSharedPantheon expands the single-letter type codes', () => {
            const encoded = btoa(JSON.stringify([
                { i: 'zeus', t: 'd', n: 'Zeus' },
                { i: 'hydra', t: 'c', n: 'Hydra' },
                { i: 'mjolnir', t: 'i', n: 'Mjolnir' },
                { i: 'valhalla', t: 'p', n: 'Valhalla' },
                { i: 'perseus', t: 'h', n: 'Perseus' }
            ]));

            const result = service.loadSharedPantheon(encoded);

            expect(result.success).toBe(true);
            expect(result.favorites.map((f) => f.entityType))
                .toEqual(['deity', 'creature', 'item', 'place', 'hero']);
        });

        test('loadSharedPantheon passes through an unknown type code', () => {
            const encoded = btoa(JSON.stringify([{ i: 'x', t: 'artifact', n: 'X' }]));
            const result = service.loadSharedPantheon(encoded);
            expect(result.favorites[0].entityType).toBe('artifact');
        });

        test('loadSharedPantheon rejects a corrupt link', () => {
            const result = service.loadSharedPantheon('!!!not-base64!!!');
            expect(result).toEqual({ success: false, error: 'Invalid share link' });
        });

        test('round-trips a generated link', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            const { url } = await service.generateShareLink();

            const loaded = service.loadSharedPantheon(url.split('data=')[1]);

            expect(loaded.favorites).toEqual([
                { entityId: 'zeus', entityType: 'deity', name: 'Zeus' }
            ]);
        });
    });

    // ======================================================================
    // clearAll
    // ======================================================================

    describe('clearAll', () => {
        test('rejects when not authenticated', async () => {
            mockAuth.currentUser = null;
            await expect(service.clearAll()).resolves.toEqual({
                success: false, error: 'Not authenticated', code: 'AUTH_REQUIRED'
            });
        });

        test('batch-deletes every document and wipes local state', async () => {
            behaviour.docs.user_favorites = [
                { id: 'deity_zeus', entityId: 'zeus', entityType: 'deity', name: 'Zeus' },
                { id: 'deity_ra', entityId: 'ra', entityType: 'deity', name: 'Ra' }
            ];
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            localStorage.setItem(`eoa_favorites_${testUser.uid}`, '[]');
            localStorage.setItem(`eoa_favorites_pending_${testUser.uid}`, '{"adds":[],"removes":[]}');
            const listener = jest.fn();
            service.subscribe(listener);

            const result = await service.clearAll();

            expect(result).toEqual({ success: true });
            expect(calls.batchDeletes).toHaveLength(2);
            expect(calls.batchCommits).toBe(1);
            expect(service._cache.has(testUser.uid)).toBe(false);
            expect(service._favoritedLookup.has(testUser.uid)).toBe(false);
            expect(service._cacheTimestamps.has(testUser.uid)).toBe(false);
            expect(localStorage.getItem(`eoa_favorites_${testUser.uid}`)).toBeNull();
            expect(localStorage.getItem(`eoa_favorites_pending_${testUser.uid}`)).toBeNull();
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                event: 'favorites-cleared',
                data: { userId: testUser.uid }
            }));
        });

        test('falls back to an offline clear when the batch commit is rejected', async () => {
            behaviour.batchCommitError = new Error('UNAVAILABLE');
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            const result = await service.clearAll();

            expect(result.success).toBe(true);
            expect(result.offline).toBe(true);
            expect(service._cache.has(testUser.uid)).toBe(false);
        });

        test('offline clear records a pending remove for every cached favourite', async () => {
            setNavigator({ onLine: false });
            seedCache([
                { entityId: 'zeus', entityType: 'deity', name: 'Zeus' },
                { entityId: 'hydra', entityType: 'creature', name: 'Hydra' }
            ]);

            const result = await service.clearAll();

            expect(result).toEqual({
                success: true, offline: true, message: 'Cleared locally. Will sync when online.'
            });
            const pending = JSON.parse(localStorage.getItem(`eoa_favorites_pending_${testUser.uid}`));
            expect(pending.removes.map((r) => r.docId).sort())
                .toEqual(['creature_hydra', 'deity_zeus']);
        });

        test('reports OFFLINE_CLEAR_FAILED when the offline clear throws', async () => {
            setNavigator({ onLine: false });
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            jest.spyOn(service, '_trackPendingRemove').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            const result = await service.clearAll();

            expect(result).toEqual({
                success: false, error: 'QuotaExceededError', code: 'OFFLINE_CLEAR_FAILED'
            });
        });
    });

    // ======================================================================
    // Events
    // ======================================================================

    describe('event system', () => {
        test('subscribe receives events and the returned function unsubscribes', () => {
            const listener = jest.fn();
            const unsubscribe = service.subscribe(listener);

            service._emit('test-event', { a: 1 });
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({
                event: 'test-event', data: { a: 1 }, timestamp: expect.any(Number)
            });

            unsubscribe();
            service._emit('test-event', { a: 2 });
            expect(listener).toHaveBeenCalledTimes(1);
        });

        test('a throwing listener is isolated from the others', () => {
            const bad = jest.fn(() => { throw new Error('listener exploded'); });
            const good = jest.fn();
            service.subscribe(bad);
            service.subscribe(good);

            expect(() => service._emit('x', {})).not.toThrow();
            expect(good).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith(
                '[FavoritesService] Listener error:',
                expect.any(Error)
            );
        });

        test('also dispatches a favorites-changed DOM event', () => {
            const domListener = jest.fn();
            document.addEventListener('favorites-changed', domListener);

            service._emit('favorite-added', { id: 'deity_zeus' });

            expect(domListener).toHaveBeenCalled();
            expect(domListener.mock.calls[0][0].detail).toEqual({
                event: 'favorite-added', data: { id: 'deity_zeus' }
            });

            document.removeEventListener('favorites-changed', domListener);
        });
    });

    // ======================================================================
    // Cache primitives
    // ======================================================================

    describe('cache primitives', () => {
        test('_generateDocId and _generateCompositeKey use distinct formats', () => {
            expect(service._generateDocId('zeus', 'deity')).toBe('deity_zeus');
            expect(service._generateCompositeKey('zeus', 'deity')).toBe('deity::zeus');
        });

        test('_isCacheValid requires both an entry and a fresh timestamp', () => {
            expect(service._isCacheValid('nobody')).toBe(false);

            service._cache.set(testUser.uid, new Map());
            expect(service._isCacheValid(testUser.uid)).toBe(false);

            service._cacheTimestamps.set(testUser.uid, Date.now());
            expect(service._isCacheValid(testUser.uid)).toBe(true);

            service._cacheTimestamps.set(testUser.uid, Date.now() - 10 * 60 * 1000);
            expect(service._isCacheValid(testUser.uid)).toBe(false);
        });

        test('_updateCache replaces the whole cache and lookup set', () => {
            service._updateCache(testUser.uid, [
                { id: 'deity_zeus', entityId: 'zeus', entityType: 'deity' }
            ]);
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(true);

            service._updateCache(testUser.uid, [
                { id: 'deity_ra', entityId: 'ra', entityType: 'deity' }
            ]);
            expect(service.isFavoritedSync('zeus', 'deity')).toBe(false);
            expect(service.isFavoritedSync('ra', 'deity')).toBe(true);
        });

        test('_updateCacheFromLocalStorage synthesises missing doc ids', () => {
            service._updateCacheFromLocalStorage(testUser.uid, [
                { entityId: 'zeus', entityType: 'deity', name: 'Zeus' }
            ]);

            expect(service._cache.get(testUser.uid).has('deity_zeus')).toBe(true);
            expect(service._cache.get(testUser.uid).get('deity_zeus').id).toBe('deity_zeus');
        });

        test('_updateCacheFromLocalStorage preserves an existing doc id', () => {
            service._updateCacheFromLocalStorage(testUser.uid, [
                { id: 'custom-id', entityId: 'zeus', entityType: 'deity', name: 'Zeus' }
            ]);
            expect(service._cache.get(testUser.uid).has('custom-id')).toBe(true);
        });

        test('_addToCache / _removeFromCache create and prune the per-user map', () => {
            service._addToCache(testUser.uid, 'deity_zeus', { entityId: 'zeus', name: 'Zeus' });
            expect(service._cache.get(testUser.uid).get('deity_zeus'))
                .toEqual({ id: 'deity_zeus', entityId: 'zeus', name: 'Zeus' });

            service._removeFromCache(testUser.uid, 'deity_zeus');
            expect(service._cache.get(testUser.uid).size).toBe(0);

            expect(() => service._removeFromCache('unknown-user', 'x')).not.toThrow();
        });

        test('_addToLookup / _removeFromLookup create and prune the per-user set', () => {
            service._addToLookup(testUser.uid, 'deity::zeus');
            expect(service._favoritedLookup.get(testUser.uid).has('deity::zeus')).toBe(true);

            service._removeFromLookup(testUser.uid, 'deity::zeus');
            expect(service._favoritedLookup.get(testUser.uid).has('deity::zeus')).toBe(false);

            expect(() => service._removeFromLookup('unknown-user', 'x')).not.toThrow();
        });

        test('invalidateCache clears the current user and emits', () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            const listener = jest.fn();
            service.subscribe(listener);

            const result = service.invalidateCache();

            expect(result).toEqual({ success: true });
            expect(service._cache.has(testUser.uid)).toBe(false);
            expect(service._favoritedLookup.has(testUser.uid)).toBe(false);
            expect(service._cacheTimestamps.has(testUser.uid)).toBe(false);
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                event: 'cache-invalidated', data: { userId: testUser.uid }
            }));
        });

        test('invalidateCache accepts an explicit user id', () => {
            service._cache.set('other-user', new Map());
            service.invalidateCache('other-user');
            expect(service._cache.has('other-user')).toBe(false);
        });

        test('invalidateCache fails when there is no user at all', () => {
            mockAuth.currentUser = null;
            expect(service.invalidateCache()).toEqual({ success: false, error: 'No user ID' });
        });

        test('refreshFavorites drops the cache and refetches', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            behaviour.docs.user_favorites = [
                { id: 'deity_ra', entityId: 'ra', entityType: 'deity', name: 'Ra', addedAt: 1 }
            ];

            const result = await service.refreshFavorites();

            expect(calls.get).toContain('user_favorites');
            expect(result.map((f) => f.entityId)).toEqual(['ra']);
        });

        test('refreshFavorites returns [] when signed out', async () => {
            mockAuth.currentUser = null;
            await expect(service.refreshFavorites()).resolves.toEqual([]);
        });

        test('_isOnline reflects navigator.onLine', () => {
            setNavigator({ onLine: true });
            expect(service._isOnline()).toBe(true);
            setNavigator({ onLine: false });
            expect(service._isOnline()).toBe(false);
        });
    });

    // ======================================================================
    // Pending changes & sync
    // ======================================================================

    describe('pending change tracking', () => {
        test('_trackPendingAdd persists an add', () => {
            service._trackPendingAdd(testUser.uid, { docId: 'deity_zeus', data: { name: 'Zeus' } });

            const pending = JSON.parse(localStorage.getItem(`eoa_favorites_pending_${testUser.uid}`));
            expect(pending.adds).toHaveLength(1);
            expect(pending.adds[0]).toMatchObject({ docId: 'deity_zeus' });
            expect(typeof pending.adds[0].timestamp).toBe('number');
        });

        test('an add cancels a matching pending remove instead of stacking', () => {
            service._trackPendingRemove(testUser.uid, { docId: 'deity_zeus' });
            service._trackPendingAdd(testUser.uid, { docId: 'deity_zeus', data: {} });

            const pending = service._pendingLocalChanges.get(testUser.uid);
            expect(pending.removes).toHaveLength(0);
            expect(pending.adds).toHaveLength(0);
        });

        test('a remove cancels a matching pending add instead of stacking', () => {
            service._trackPendingAdd(testUser.uid, { docId: 'deity_zeus', data: {} });
            service._trackPendingRemove(testUser.uid, { docId: 'deity_zeus' });

            const pending = service._pendingLocalChanges.get(testUser.uid);
            expect(pending.adds).toHaveLength(0);
            expect(pending.removes).toHaveLength(0);
        });

        test('_loadPendingChanges returns an empty shape when storage is empty', () => {
            expect(service._loadPendingChanges('nobody')).toEqual({ adds: [], removes: [] });
        });

        test('_loadPendingChanges tolerates corrupt JSON', () => {
            localStorage.setItem(`eoa_favorites_pending_${testUser.uid}`, '{not json');

            expect(service._loadPendingChanges(testUser.uid)).toEqual({ adds: [], removes: [] });
            expect(console.warn).toHaveBeenCalledWith(
                '[FavoritesService] Failed to load pending changes:',
                expect.any(Error)
            );
        });

        test('_clearPendingChanges removes both the memory entry and the storage key', () => {
            service._trackPendingAdd(testUser.uid, { docId: 'deity_zeus', data: {} });

            service._clearPendingChanges(testUser.uid);

            expect(service._pendingLocalChanges.has(testUser.uid)).toBe(false);
            expect(localStorage.getItem(`eoa_favorites_pending_${testUser.uid}`)).toBeNull();
        });

        test('hasPendingChanges is false without a user', () => {
            mockAuth.currentUser = null;
            expect(service.hasPendingChanges()).toBe(false);
        });

        test('hasPendingChanges reads from localStorage when memory is empty', () => {
            localStorage.setItem(
                `eoa_favorites_pending_${testUser.uid}`,
                JSON.stringify({ adds: [], removes: [{ docId: 'deity_zeus' }] })
            );

            expect(service.hasPendingChanges()).toBe(true);
        });

        test('hasPendingChanges is false when both lists are empty', () => {
            service._pendingLocalChanges.set(testUser.uid, { adds: [], removes: [] });
            expect(service.hasPendingChanges()).toBe(false);
        });
    });

    describe('_syncPendingChanges / syncToCloud', () => {
        function seedPending(pending) {
            localStorage.setItem(
                `eoa_favorites_pending_${testUser.uid}`,
                JSON.stringify({ adds: [], removes: [], ...pending })
            );
        }

        test('does nothing without a signed-in user', async () => {
            mockAuth.currentUser = null;
            await expect(service._syncPendingChanges())
                .resolves.toEqual({ success: false, synced: 0, conflicts: 0 });
        });

        test('does nothing while offline', async () => {
            setNavigator({ onLine: false });
            await expect(service._syncPendingChanges())
                .resolves.toEqual({ success: false, synced: 0, conflicts: 0 });
        });

        test('does nothing without a Firestore instance', async () => {
            service.db = null;
            await expect(service._syncPendingChanges())
                .resolves.toEqual({ success: false, synced: 0, conflicts: 0 });
        });

        test('aborts and keeps the pending queue when the state read fails', async () => {
            seedPending({ adds: [{ docId: 'deity_zeus', data: {}, timestamp: 5 }] });
            behaviour.getError = new Error('Quota exceeded');

            const result = await service._syncPendingChanges();

            expect(result).toEqual({
                success: false, synced: 0, conflicts: 0, error: 'Quota exceeded'
            });
            expect(calls.set).toHaveLength(0);
            expect(localStorage.getItem(`eoa_favorites_pending_${testUser.uid}`)).not.toBeNull();
        });

        test('writes an add that has no remote counterpart', async () => {
            seedPending({ adds: [{ docId: 'deity_zeus', data: { name: 'Zeus' }, timestamp: 100 }] });

            const result = await service._syncPendingChanges();

            expect(result).toEqual({ success: true, synced: 1, conflicts: 0 });
            expect(calls.set).toEqual([
                { collection: 'user_favorites', docId: 'deity_zeus', data: { name: 'Zeus' } }
            ]);
        });

        test('overwrites a remote doc when the local add is newer', async () => {
            behaviour.docs.user_favorites = [{ id: 'deity_zeus', name: 'Old Zeus', addedAt: 50 }];
            seedPending({ adds: [{ docId: 'deity_zeus', data: { name: 'New Zeus' }, timestamp: 100 }] });

            const result = await service._syncPendingChanges();

            expect(result).toEqual({ success: true, synced: 1, conflicts: 0 });
            expect(calls.set[0].data).toEqual({ name: 'New Zeus' });
        });

        test('counts a conflict and skips the write when the remote doc is newer', async () => {
            behaviour.docs.user_favorites = [{ id: 'deity_zeus', name: 'Remote Zeus', addedAt: 500 }];
            seedPending({ adds: [{ docId: 'deity_zeus', data: { name: 'Local Zeus' }, timestamp: 100 }] });

            const result = await service._syncPendingChanges();

            expect(result).toEqual({ success: true, synced: 0, conflicts: 1 });
            expect(calls.set).toHaveLength(0);
        });

        test('counts a conflict when an individual add write is rejected', async () => {
            seedPending({ adds: [{ docId: 'deity_zeus', data: { name: 'Zeus' }, timestamp: 100 }] });
            behaviour.setError = new Error('PERMISSION_DENIED');

            const result = await service._syncPendingChanges();

            expect(result).toEqual({ success: true, synced: 0, conflicts: 1 });
            expect(console.error).toHaveBeenCalledWith(
                '[FavoritesService] Failed to sync add:',
                expect.any(Error)
            );
        });

        test('deletes a remote doc when the local remove is newer', async () => {
            behaviour.docs.user_favorites = [{ id: 'deity_zeus', name: 'Zeus', addedAt: 50 }];
            seedPending({ removes: [{ docId: 'deity_zeus', timestamp: 100 }] });

            const result = await service._syncPendingChanges();

            expect(result).toEqual({ success: true, synced: 1, conflicts: 0 });
            expect(calls.delete).toEqual([{ collection: 'user_favorites', docId: 'deity_zeus' }]);
        });

        test('keeps a remote doc that was re-added after the local remove', async () => {
            behaviour.docs.user_favorites = [{ id: 'deity_zeus', name: 'Zeus', addedAt: 500 }];
            seedPending({ removes: [{ docId: 'deity_zeus', timestamp: 100 }] });

            const result = await service._syncPendingChanges();

            expect(result).toEqual({ success: true, synced: 0, conflicts: 1 });
            expect(calls.delete).toHaveLength(0);
        });

        test('treats a remove of an already-absent doc as a no-op', async () => {
            seedPending({ removes: [{ docId: 'deity_zeus', timestamp: 100 }] });

            const result = await service._syncPendingChanges();

            expect(result).toEqual({ success: true, synced: 0, conflicts: 0 });
            expect(calls.delete).toHaveLength(0);
        });

        test('counts a conflict when an individual delete is rejected', async () => {
            behaviour.docs.user_favorites = [{ id: 'deity_zeus', name: 'Zeus', addedAt: 50 }];
            seedPending({ removes: [{ docId: 'deity_zeus', timestamp: 100 }] });
            behaviour.deleteError = new Error('UNAVAILABLE');

            const result = await service._syncPendingChanges();

            expect(result).toEqual({ success: true, synced: 0, conflicts: 1 });
        });

        test('clears the queue, invalidates the cache and emits sync-complete', async () => {
            seedPending({ adds: [{ docId: 'deity_zeus', data: { name: 'Zeus' }, timestamp: 100 }] });
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            const listener = jest.fn();
            service.subscribe(listener);

            await service._syncPendingChanges();

            expect(localStorage.getItem(`eoa_favorites_pending_${testUser.uid}`)).toBeNull();
            expect(service._pendingLocalChanges.has(testUser.uid)).toBe(false);
            expect(service._cache.has(testUser.uid)).toBe(false);
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                event: 'sync-complete', data: { synced: 1, conflicts: 0 }
            }));
            expect(window.toast.success).toHaveBeenCalledWith('Synced 1 favorites');
        });

        test('does not toast when nothing was synced', async () => {
            seedPending({});
            await service._syncPendingChanges();
            expect(window.toast.success).not.toHaveBeenCalled();
        });

        test('syncToCloud delegates to the sync routine', async () => {
            const spy = jest.spyOn(service, '_syncPendingChanges')
                .mockResolvedValue({ success: true, synced: 3, conflicts: 1 });

            await expect(service.syncToCloud())
                .resolves.toEqual({ success: true, synced: 3, conflicts: 1 });
            expect(spy).toHaveBeenCalled();
        });

        test('_onOnline reloads the queue then syncs', async () => {
            localStorage.setItem(
                `eoa_favorites_pending_${testUser.uid}`,
                JSON.stringify({ adds: [{ docId: 'deity_zeus', data: {}, timestamp: 1 }], removes: [] })
            );
            const syncSpy = jest.spyOn(service, '_syncPendingChanges').mockResolvedValue({});

            service._onOnline();

            expect(service._pendingLocalChanges.get(testUser.uid).adds).toHaveLength(1);
            expect(syncSpy).toHaveBeenCalled();
        });

        test('_onOnline does nothing when signed out', () => {
            mockAuth.currentUser = null;
            const syncSpy = jest.spyOn(service, '_syncPendingChanges').mockResolvedValue({});

            service._onOnline();

            expect(syncSpy).not.toHaveBeenCalled();
        });
    });

    // ======================================================================
    // localStorage helpers
    // ======================================================================

    describe('localStorage helpers', () => {
        // jsdom's localStorage is a Proxy-backed Storage, so it cannot be spied
        // on. Swap the global for a stub that throws instead.
        let originalLocalStorage;

        afterEach(() => {
            if (originalLocalStorage) {
                Object.defineProperty(global, 'localStorage', {
                    value: originalLocalStorage,
                    writable: true,
                    configurable: true
                });
                originalLocalStorage = null;
            }
        });

        function installThrowingStorage(failingMethod, error) {
            originalLocalStorage = global.localStorage;
            const stub = {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
                clear: () => {}
            };
            stub[failingMethod] = () => { throw error; };
            Object.defineProperty(global, 'localStorage', {
                value: stub,
                writable: true,
                configurable: true
            });
        }

        test('_getStorageKey is namespaced per user', () => {
            expect(service._getStorageKey('abc')).toBe('eoa_favorites_abc');
        });

        test('_saveToLocalStorage writes the cached values as an array', () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);

            service._saveToLocalStorage(testUser.uid);

            const stored = JSON.parse(localStorage.getItem('eoa_favorites_test-user-123'));
            expect(stored).toEqual([
                { id: 'deity_zeus', entityId: 'zeus', entityType: 'deity', name: 'Zeus' }
            ]);
        });

        test('_saveToLocalStorage is a no-op when nothing is cached', () => {
            service._saveToLocalStorage('nobody');
            expect(localStorage.getItem('eoa_favorites_nobody')).toBeNull();
        });

        test('_saveToLocalStorage swallows quota errors', () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            installThrowingStorage('setItem', new Error('QuotaExceededError'));

            expect(() => service._saveToLocalStorage(testUser.uid)).not.toThrow();
            expect(console.warn).toHaveBeenCalledWith(
                '[FavoritesService] LocalStorage save failed:',
                expect.any(Error)
            );
        });

        test('_getFromLocalStorage returns [] for a missing key', () => {
            expect(service._getFromLocalStorage('nobody')).toEqual([]);
        });

        test('_getFromLocalStorage returns [] for corrupt JSON', () => {
            localStorage.setItem('eoa_favorites_test-user-123', '{broken');

            expect(service._getFromLocalStorage(testUser.uid)).toEqual([]);
            expect(console.warn).toHaveBeenCalledWith(
                '[FavoritesService] LocalStorage read failed:',
                expect.any(Error)
            );
        });

        test('_clearLocalStorage removes only that user key', () => {
            localStorage.setItem('eoa_favorites_test-user-123', '[]');
            localStorage.setItem('eoa_favorites_other', '[]');

            service._clearLocalStorage(testUser.uid);

            expect(localStorage.getItem('eoa_favorites_test-user-123')).toBeNull();
            expect(localStorage.getItem('eoa_favorites_other')).toBe('[]');
        });

        test('_clearLocalStorage swallows storage errors', () => {
            installThrowingStorage('removeItem', new Error('SecurityError'));

            expect(() => service._clearLocalStorage(testUser.uid)).not.toThrow();
            expect(console.warn).toHaveBeenCalledWith(
                '[FavoritesService] LocalStorage clear failed:',
                expect.any(Error)
            );
        });

        test('_savePendingChanges swallows storage errors', () => {
            service._pendingLocalChanges.set(testUser.uid, { adds: [], removes: [] });
            installThrowingStorage('setItem', new Error('QuotaExceededError'));

            expect(() => service._savePendingChanges(testUser.uid)).not.toThrow();
            expect(console.warn).toHaveBeenCalledWith(
                '[FavoritesService] Failed to save pending changes:',
                expect.any(Error)
            );
        });

        test('_clearPendingChanges swallows storage errors', () => {
            installThrowingStorage('removeItem', new Error('SecurityError'));

            expect(() => service._clearPendingChanges(testUser.uid)).not.toThrow();
            expect(console.warn).toHaveBeenCalledWith(
                '[FavoritesService] Failed to clear pending changes:',
                expect.any(Error)
            );
        });
    });

    // ======================================================================
    // Statistics
    // ======================================================================

    describe('getStatistics', () => {
        test('aggregates by mythology, type and folder', async () => {
            seedCache([
                { entityId: 'zeus', entityType: 'deity', name: 'Zeus', mythology: 'greek', folderId: 'f1', addedAt: 300 },
                { entityId: 'hera', entityType: 'deity', name: 'Hera', mythology: 'greek', folderId: 'f1', addedAt: 200 },
                { entityId: 'anubis', entityType: 'creature', name: 'Anubis', mythology: 'egyptian', addedAt: 100 }
            ]);
            service._foldersCache.set(testUser.uid, new Map([['f1', { id: 'f1', name: 'F1' }]]));

            const stats = await service.getStatistics();

            expect(stats.total).toBe(3);
            expect(stats.byMythology).toEqual({ greek: 2, egyptian: 1 });
            expect(stats.byType).toEqual({ deity: 2, creature: 1 });
            expect(stats.byFolder).toEqual({ f1: 2, uncategorized: 1 });
            expect(stats.folderCount).toBe(1);
            expect(stats.topMythology).toBe('greek');
            expect(stats.topType).toBe('deity');
            expect(stats.newestFavorite).toBe(300);
            expect(stats.oldestFavorite).toBe(100);
        });

        test('buckets records with no mythology or type under "Unknown"', async () => {
            seedCache([{ entityId: 'x', entityType: undefined, name: 'X' }]);
            service._cache.get(testUser.uid).set('x', { id: 'x', entityId: 'x', name: 'X' });

            const stats = await service.getStatistics();

            expect(stats.byMythology.Unknown).toBeGreaterThan(0);
            expect(stats.byType.Unknown).toBeGreaterThan(0);
        });

        test('returns a zeroed shape when there are no favourites', async () => {
            seedCache([]);

            const stats = await service.getStatistics();

            expect(stats).toMatchObject({
                total: 0,
                byMythology: {},
                byType: {},
                byFolder: {},
                folderCount: 0,
                oldestFavorite: null,
                newestFavorite: null,
                topMythology: null,
                topType: null
            });
        });
    });

    // ======================================================================
    // DOM sync
    // ======================================================================

    describe('updateAllFavoriteButtons', () => {
        test('does nothing when signed out', async () => {
            mockAuth.currentUser = null;
            const btn = makeFavoriteButton();

            await service.updateAllFavoriteButtons();

            expect(btn.getAttribute('aria-pressed')).toBeNull();
        });

        test('marks favourited buttons and unmarks the rest', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            const favourited = makeFavoriteButton({ entityId: 'zeus', entityName: 'Zeus' });
            const notFavourited = makeFavoriteButton({ entityId: 'ra', entityName: 'Ra' });
            notFavourited.classList.add('favorited');

            await service.updateAllFavoriteButtons();

            expect(favourited.classList.contains('favorited')).toBe(true);
            expect(favourited.getAttribute('aria-pressed')).toBe('true');
            expect(favourited.getAttribute('aria-label')).toBe('Remove Zeus from favorites');
            expect(favourited.title).toBe('Remove from favorites');

            expect(notFavourited.classList.contains('favorited')).toBe(false);
            expect(notFavourited.getAttribute('aria-pressed')).toBe('false');
            expect(notFavourited.getAttribute('aria-label')).toBe('Add Ra to favorites');
            expect(notFavourited.title).toBe('Add to favorites');
        });

        test('ignores buttons missing entity data', async () => {
            seedCache([]);
            const btn = makeFavoriteButton({ entityId: null, entityType: null });

            await service.updateAllFavoriteButtons();

            expect(btn.getAttribute('aria-pressed')).toBeNull();
        });

        test('falls back to "Entity" when the button has no name', async () => {
            seedCache([]);
            const btn = makeFavoriteButton({ entityName: null });

            await service.updateAllFavoriteButtons();

            expect(btn.getAttribute('aria-label')).toBe('Add Entity to favorites');
        });

        test('also updates card action buttons', async () => {
            seedCache([{ entityId: 'zeus', entityType: 'deity', name: 'Zeus' }]);
            const btn = document.createElement('button');
            btn.className = 'entity-card__action-btn--favorite';
            btn.dataset.entityId = 'zeus';
            btn.dataset.entityType = 'deity';
            document.body.appendChild(btn);

            await service.updateAllFavoriteButtons();

            expect(btn.getAttribute('aria-pressed')).toBe('true');
        });
    });

    // ======================================================================
    // Toasts
    // ======================================================================

    describe('_showToast', () => {
        test('prefers the typed method on window.toast', () => {
            service._showToast('hello', 'success');
            expect(window.toast.success).toHaveBeenCalledWith('hello');
        });

        test('BUG: also calls window.toast.show(), producing a duplicate toast', () => {
            // favorites-service.js:305 —
            //   window.toast[type]?.(message) || window.toast.show?.(message, type)
            // The typed toast helpers return undefined, so the `||` always
            // evaluates the right-hand side too and the user sees two toasts.
            // A fix would use an if/else; this test would then assert
            // `window.toast.show` was NOT called.
            service._showToast('hello', 'success');

            expect(window.toast.success).toHaveBeenCalledWith('hello');
            expect(window.toast.show).toHaveBeenCalledWith('hello', 'success');
        });

        test('uses show() when the typed method is missing', () => {
            window.toast = { show: jest.fn() };
            service._showToast('hello', 'nope');
            expect(window.toast.show).toHaveBeenCalledWith('hello', 'nope');
        });

        test('falls back to window.ToastNotification', () => {
            delete window.toast;
            window.ToastNotification = { show: jest.fn() };

            service._showToast('hello', 'error');

            expect(window.ToastNotification.show).toHaveBeenCalledWith('hello', 'error');
        });

        test('is a silent no-op when no toast implementation exists', () => {
            delete window.toast;
            delete window.ToastNotification;
            expect(() => service._showToast('hello')).not.toThrow();
        });
    });

    // ======================================================================
    // Optimistic UI & animations
    // ======================================================================

    describe('optimistic UI', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });

        test('marks a button as favourited and clears the loading state after 300ms', () => {
            const btn = makeFavoriteButton();

            service._applyOptimisticUI(btn, true, 'Zeus');

            expect(btn.classList.contains('loading')).toBe(true);
            expect(btn.classList.contains('favorited')).toBe(true);
            expect(btn.getAttribute('aria-pressed')).toBe('true');
            expect(btn.getAttribute('aria-label')).toBe('Remove Zeus from favorites');
            expect(btn.title).toBe('Remove from favorites');

            jest.advanceTimersByTime(300);
            expect(btn.classList.contains('loading')).toBe(false);
        });

        test('unmarks a button when toggling off', () => {
            const btn = makeFavoriteButton();
            btn.classList.add('favorited');

            service._applyOptimisticUI(btn, false, 'Zeus');

            expect(btn.classList.contains('favorited')).toBe(false);
            expect(btn.getAttribute('aria-pressed')).toBe('false');
            expect(btn.getAttribute('aria-label')).toBe('Add Zeus to favorites');
            expect(btn.title).toBe('Add to favorites');
        });

        test('the add animation bursts particles, vibrates, and cleans up after itself', () => {
            const btn = makeFavoriteButton();

            service._triggerHeartAnimation(btn, 'add');

            expect(btn.classList.contains('heart-burst')).toBe(true);
            const container = document.querySelector('.favorite-particles');
            expect(container).not.toBeNull();
            expect(container.querySelectorAll('.favorite-particle')).toHaveLength(8);
            expect(navigator.vibrate).toHaveBeenCalledWith([15, 30, 15]);

            jest.advanceTimersByTime(600);
            expect(btn.classList.contains('heart-burst')).toBe(false);

            jest.advanceTimersByTime(100);
            expect(document.querySelector('.favorite-particles')).toBeNull();
        });

        test('the remove animation uses heart-break and creates no particles', () => {
            const btn = makeFavoriteButton();

            service._triggerHeartAnimation(btn, 'remove');

            expect(btn.classList.contains('heart-break')).toBe(true);
            expect(document.querySelector('.favorite-particles')).toBeNull();

            jest.advanceTimersByTime(400);
            expect(btn.classList.contains('heart-break')).toBe(false);
        });

        test('survives a browser that blocks vibration', () => {
            setNavigator({
                vibrate: jest.fn(() => { throw new Error('blocked by permissions policy'); })
            });
            const btn = makeFavoriteButton();

            expect(() => service._triggerHeartAnimation(btn, 'add')).not.toThrow();
            expect(btn.classList.contains('heart-burst')).toBe(true);
        });

        test('survives a browser with no vibration API', () => {
            setNavigator({ vibrate: undefined });
            const btn = makeFavoriteButton();

            expect(() => service._triggerHeartAnimation(btn, 'add')).not.toThrow();
        });
    });

    // ======================================================================
    // Module-level auto-initialisation
    // ======================================================================

    describe('module auto-initialisation', () => {
        afterEach(() => {
            delete global.window.EyesOfAzrael;
        });

        test('the firebase-ready event creates the singleton and syncs the buttons', () => {
            jest.useFakeTimers();
            delete global.window.EyesOfAzrael;

            document.dispatchEvent(new CustomEvent('firebase-ready'));

            expect(window.EyesOfAzrael.favorites).toBeInstanceOf(FavoritesService);

            const updateSpy = jest
                .spyOn(window.EyesOfAzrael.favorites, 'updateAllFavoriteButtons')
                .mockResolvedValue(undefined);

            jest.advanceTimersByTime(500);
            expect(updateSpy).toHaveBeenCalled();

            jest.useRealTimers();
        });

        test('exports the class on window', () => {
            expect(window.FavoritesService).toBe(FavoritesService);
        });
    });

    // ======================================================================
    // Global click delegation
    //
    // The constructor attaches a single document-level click listener. Rather
    // than letting it leak onto the real document (it can never be detached),
    // the listener is captured from a stubbed addEventListener and invoked
    // directly, which is both deterministic and leak-free.
    // ======================================================================

    describe('global click delegation', () => {
        let handler;
        let delegationService;

        beforeEach(() => {
            const captured = {};
            jest.spyOn(document, 'addEventListener')
                .mockImplementation((type, fn) => { captured[type] = fn; });

            delete global.window._favoritesEventDelegationInitialized;
            delegationService = new FavoritesService({ firestore: mockDb, auth: mockAuth });
            handler = captured.click;

            global.window._favoritesEventDelegationInitialized = true;
        });

        function clickOn(target) {
            const event = {
                target,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            return { event, result: handler(event) };
        }

        test('registers exactly one click listener', () => {
            expect(typeof handler).toBe('function');
        });

        test('is inert for clicks outside a favourite button', async () => {
            const other = document.createElement('div');
            document.body.appendChild(other);

            const { event } = clickOn(other);
            await Promise.resolve();

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(calls.set).toHaveLength(0);
        });

        test('does not double-register when the flag is already set', () => {
            const before = document.addEventListener.mock.calls.length;
            // eslint-disable-next-line no-new
            new FavoritesService({ firestore: mockDb, auth: mockAuth });
            expect(document.addEventListener.mock.calls.length).toBe(before);
        });

        test('prompts for sign-in instead of writing when unauthenticated', async () => {
            mockAuth.currentUser = null;
            const listener = jest.fn();
            delegationService.subscribe(listener);
            const btn = makeFavoriteButton();

            const { event, result } = clickOn(btn);
            await result;

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                event: 'auth-required', data: { action: 'favorite' }
            }));
            expect(window.toast.warning).toHaveBeenCalledWith('Please sign in to save favorites');
            expect(calls.set).toHaveLength(0);
        });

        test('warns and bails when the button carries no entity data', async () => {
            const btn = makeFavoriteButton({ entityId: null, entityType: null });

            const { result } = clickOn(btn);
            await result;

            expect(console.warn).toHaveBeenCalledWith(
                '[FavoritesService] Missing entity data on favorite button'
            );
            expect(calls.set).toHaveLength(0);
        });

        test('optimistically marks the button and writes the favourite', async () => {
            delegationService._cache.set(testUser.uid, new Map());
            delegationService._favoritedLookup.set(testUser.uid, new Set());
            delegationService._cacheTimestamps.set(testUser.uid, Date.now());
            const btn = makeFavoriteButton({
                entityName: 'Zeus', entityMythology: 'greek', entityIcon: 'Z'
            });

            const { result } = clickOn(btn);
            await result;

            expect(btn.classList.contains('favorited')).toBe(true);
            expect(btn.getAttribute('aria-pressed')).toBe('true');
            expect(calls.set).toHaveLength(1);
            expect(calls.set[0].data).toMatchObject({
                entityId: 'zeus', entityType: 'deity', name: 'Zeus',
                mythology: 'greek', icon: 'Z'
            });
        });

        test('removes the favourite when the button is already marked', async () => {
            const lookup = new Set(['deity::zeus']);
            delegationService._cache.set(testUser.uid, new Map());
            delegationService._favoritedLookup.set(testUser.uid, lookup);
            delegationService._cacheTimestamps.set(testUser.uid, Date.now());

            const btn = makeFavoriteButton();
            btn.setAttribute('aria-pressed', 'true');

            const { result } = clickOn(btn);
            await result;

            expect(calls.delete).toHaveLength(1);
            expect(btn.classList.contains('favorited')).toBe(false);
        });

        test('reverts the optimistic state and toasts when the toggle fails', async () => {
            delegationService._cache.set(testUser.uid, new Map());
            delegationService._favoritedLookup.set(testUser.uid, new Set());
            delegationService._cacheTimestamps.set(testUser.uid, Date.now());
            jest.spyOn(delegationService, 'toggleFavorite')
                .mockResolvedValue({ success: false, error: 'Write failed' });

            const btn = makeFavoriteButton();

            const { result } = clickOn(btn);
            await result;

            expect(btn.classList.contains('favorited')).toBe(false);
            expect(btn.getAttribute('aria-pressed')).toBe('false');
            expect(window.toast.error).toHaveBeenCalledWith('Write failed');
        });

        test('uses a generic message when the failure carries no error text', async () => {
            delegationService._cache.set(testUser.uid, new Map());
            delegationService._favoritedLookup.set(testUser.uid, new Set());
            delegationService._cacheTimestamps.set(testUser.uid, Date.now());
            jest.spyOn(delegationService, 'toggleFavorite')
                .mockResolvedValue({ success: false });

            const { result } = clickOn(makeFavoriteButton());
            await result;

            expect(window.toast.error).toHaveBeenCalledWith('Failed to update favorite');
        });

        test('defaults name, mythology and icon when the dataset omits them', async () => {
            delegationService._cache.set(testUser.uid, new Map());
            delegationService._favoritedLookup.set(testUser.uid, new Set());
            delegationService._cacheTimestamps.set(testUser.uid, Date.now());

            const btn = document.createElement('button');
            btn.className = 'entity-favorite';
            btn.dataset.entityId = 'zeus';
            btn.dataset.entityType = 'deity';
            document.body.appendChild(btn);

            const { result } = clickOn(btn);
            await result;

            expect(calls.set[0].data).toMatchObject({
                name: 'Entity', mythology: 'unknown', icon: null
            });
        });

        test('resolves the button from a nested click target', async () => {
            delegationService._cache.set(testUser.uid, new Map());
            delegationService._favoritedLookup.set(testUser.uid, new Set());
            delegationService._cacheTimestamps.set(testUser.uid, Date.now());

            const btn = makeFavoriteButton();
            const icon = document.createElement('span');
            btn.appendChild(icon);

            const { result } = clickOn(icon);
            await result;

            expect(calls.set).toHaveLength(1);
        });
    });
});
