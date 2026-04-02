/**
 * Corpus & Notes Tests — Sprint 5
 *
 * Tests for:
 * 1. Corpus query template generation from entity data (AssetCorpusSearch)
 * 2. Private notes service CRUD operations (mocked)
 * 3. Discussion component error handling and graceful degradation
 *
 * Total: ~30 tests
 */

const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function loadScript(relPath) {
    const code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
    return code;
}

function createFirestoreMock(docs = []) {
    const collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(() => Promise.resolve({
            forEach: (cb) => docs.forEach(cb),
            docs: docs,
            size: docs.length
        })),
        add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
        doc: jest.fn((id) => ({
            get: jest.fn(() => Promise.resolve({ exists: docs.length > 0, id, data: () => docs[0]?.data?.() || {} })),
            update: jest.fn(() => Promise.resolve()),
            delete: jest.fn(() => Promise.resolve()),
            set: jest.fn(() => Promise.resolve())
        }))
    });
    return { collection };
}

// ──────────────────────────────────────────────────────────────
// 1. CORPUS QUERY TEMPLATE GENERATION
// ──────────────────────────────────────────────────────────────

describe('AssetCorpusSearch — query template generation', () => {
    let AssetCorpusSearch;
    let container;

    beforeEach(() => {
        // Set up a minimal DOM container
        container = document.createElement('div');
        document.body.appendChild(container);

        // Load the module (uses class pattern, no window assignment before end)
        const code = loadScript('js/components/asset-corpus-search.js');
        // eslint-disable-next-line no-new-func
        const fn = new Function('window', 'document', code);
        fn(window, document);
        AssetCorpusSearch = window.AssetCorpusSearch;
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    test('generates sacred-texts query for any entity with a name', () => {
        const entity = { id: 'zeus', name: 'Zeus', type: 'deity', mythology: 'greek' };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        const sacredTextQuery = queries.find(q => q.category === 'sacred-texts');
        expect(sacredTextQuery).toBeDefined();
        expect(sacredTextQuery.query.term).toBe('Zeus');
    });

    test('generates parallels query for deity type', () => {
        const entity = { id: 'zeus', name: 'Zeus', type: 'deity', mythology: 'greek' };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        const parallels = queries.find(q => q.category === 'parallels');
        expect(parallels).toBeDefined();
    });

    test('generates parallels query for hero type', () => {
        const entity = { id: 'heracles', name: 'Heracles', type: 'hero', mythology: 'greek' };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        const parallels = queries.find(q => q.category === 'parallels');
        expect(parallels).toBeDefined();
    });

    test('generates parallels query for creature type', () => {
        const entity = { id: 'minotaur', name: 'Minotaur', type: 'creature', mythology: 'greek' };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        const parallels = queries.find(q => q.category === 'parallels');
        expect(parallels).toBeDefined();
    });

    test('does NOT generate parallels query for item type', () => {
        const entity = { id: 'mjolnir', name: 'Mjolnir', type: 'item', mythology: 'norse' };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        const parallels = queries.find(q => q.category === 'parallels');
        expect(parallels).toBeUndefined();
    });

    test('generates historical query when mythology is present', () => {
        const entity = { id: 'odin', name: 'Odin', type: 'deity', mythology: 'norse' };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        const historical = queries.find(q => q.category === 'historical');
        expect(historical).toBeDefined();
        expect(historical.query.term).toContain('Odin');
    });

    test('generates related-entities query when mythology is present', () => {
        const entity = { id: 'thor', name: 'Thor', type: 'deity', mythology: 'norse' };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        const related = queries.find(q => q.category === 'related');
        expect(related).toBeDefined();
        expect(related.query.mythology).toBe('norse');
    });

    test('generates symbol query when entity has symbols', () => {
        const entity = {
            id: 'apollo', name: 'Apollo', type: 'deity', mythology: 'greek',
            symbols: ['sun', 'lyre', 'bow']
        };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        const symbols = queries.find(q => q.category === 'symbols');
        expect(symbols).toBeDefined();
    });

    test('does NOT generate symbol query when entity has no symbols', () => {
        const entity = { id: 'unknown', name: 'Unknown', type: 'deity', mythology: 'greek' };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        const symbols = queries.find(q => q.category === 'symbols');
        expect(symbols).toBeUndefined();
    });

    test('queries are sorted by priority', () => {
        const entity = {
            id: 'zeus', name: 'Zeus', type: 'deity', mythology: 'greek',
            symbols: ['lightning', 'eagle']
        };
        const instance = new AssetCorpusSearch(container, entity);
        const queries = instance.generateQueriesForEntity();
        for (let i = 1; i < queries.length; i++) {
            expect(queries[i].priority).toBeGreaterThanOrEqual(queries[i - 1].priority);
        }
    });

    test('extractSearchableAttributes returns domains array when present', () => {
        const entity = { id: 'zeus', name: 'Zeus', type: 'deity', domains: ['sky', 'thunder', 'justice', 'law'] };
        const instance = new AssetCorpusSearch(container, entity);
        const attrs = instance.extractSearchableAttributes(entity);
        expect(attrs.domains).toBeDefined();
        expect(attrs.domains.length).toBeLessThanOrEqual(3);
    });

    test('extractSymbolicTerms deduplicates terms', () => {
        const entity = {
            id: 'zeus', name: 'Zeus',
            symbols: ['lightning', 'eagle'],
            domains: ['lightning', 'sky']  // 'lightning' duplicated
        };
        const instance = new AssetCorpusSearch(container, entity);
        const terms = instance.extractSymbolicTerms(entity);
        const unique = new Set(terms);
        expect(unique.size).toBe(terms.length);
    });

    test('getCollectionForType returns correct collection names', () => {
        const entity = { id: 'x', name: 'X' };
        const instance = new AssetCorpusSearch(container, entity);
        expect(instance.getCollectionForType('deity')).toBe('deities');
        expect(instance.getCollectionForType('hero')).toBe('heroes');
        expect(instance.getCollectionForType('creature')).toBe('creatures');
        expect(instance.getCollectionForType('item')).toBe('items');
        expect(instance.getCollectionForType('place')).toBe('places');
    });

    test('groupQueriesByCategory returns object keyed by category', () => {
        const entity = { id: 'zeus', name: 'Zeus', type: 'deity', mythology: 'greek' };
        const instance = new AssetCorpusSearch(container, entity);
        instance.generatedQueries = instance.generateQueriesForEntity();
        const grouped = instance.groupQueriesByCategory();
        expect(typeof grouped).toBe('object');
        Object.values(grouped).forEach(arr => {
            expect(Array.isArray(arr)).toBe(true);
            expect(arr.length).toBeGreaterThan(0);
        });
    });
});

// ──────────────────────────────────────────────────────────────
// 2. PRIVATE NOTES SERVICE CRUD (mocked)
// ──────────────────────────────────────────────────────────────

describe('PrivateNotesService — CRUD operations (mocked)', () => {
    let mockDb;
    let service;

    const makeDoc = (id, data) => ({
        id,
        data: () => data,
        exists: true
    });

    beforeEach(() => {
        mockDb = createFirestoreMock([
            makeDoc('note-1', {
                userId: 'user-1',
                entityCollection: 'deities',
                entityId: 'zeus',
                content: 'First note',
                priority: 3,
                order: 1,
                color: '#8b7fff',
                status: 'active',
                createdAt: { toMillis: () => 1000 },
                updatedAt: { toMillis: () => 1000 }
            })
        ]);

        // Mock global firebase so service.init() succeeds immediately
        global.firebase = {
            firestore: jest.fn(() => mockDb),
            auth: jest.fn(() => ({
                currentUser: { uid: 'user-1', displayName: 'Test User' }
            }))
        };
        global.firebase.firestore.FieldValue = {
            serverTimestamp: jest.fn(() => new Date()),
            increment: jest.fn((n) => n)
        };
        window.firebase = global.firebase;

        // Clear any pre-existing singleton so the script re-creates it
        delete window.privateNotesService;

        // Load PrivateNotesService (auto-initializes as singleton)
        const code = loadScript('js/services/private-notes-service.js');
        // eslint-disable-next-line no-new-func
        new Function('window', 'document', 'firebase', code)(window, document, global.firebase);

        service = window.privateNotesService;
    });

    afterEach(() => {
        delete global.firebase;
        delete window.firebase;
        delete window.privateNotesService;
    });

    test('privateNotesService singleton is available globally', () => {
        expect(window.privateNotesService).toBeDefined();
        expect(typeof window.privateNotesService.createNote).toBe('function');
    });

    test('init() resolves without throwing when firebase is available', async () => {
        await expect(service.init()).resolves.not.toThrow();
    });

    test('createNote calls Firestore collection()', async () => {
        await service.init();
        await service.createNote({
            entityCollection: 'deities',
            entityId: 'zeus',
            entityName: 'Zeus',
            content: 'New note about Zeus the sky god',
            priority: 3,
            color: '#8b7fff'
        });
        expect(mockDb.collection).toHaveBeenCalledWith(expect.stringContaining('private_notes'));
    });

    test('deleteNote calls Firestore doc(noteId)', async () => {
        await service.init();
        const collMock = mockDb.collection('private_notes');
        await service.deleteNote('note-1');
        expect(collMock.doc).toHaveBeenCalledWith('note-1');
    });

    test('updateNote calls Firestore doc(noteId)', async () => {
        await service.init();
        const collMock = mockDb.collection('private_notes');
        await service.updateNote('note-1', { content: 'Updated note content', priority: 4 });
        expect(collMock.doc).toHaveBeenCalledWith('note-1');
    });

    test('getNotes returns an array', async () => {
        await service.init();
        const notes = await service.getNotes('deities', 'zeus', {});
        expect(Array.isArray(notes)).toBe(true);
    });
});

// ──────────────────────────────────────────────────────────────
// 3. DISCUSSION COMPONENT ERROR HANDLING
// ──────────────────────────────────────────────────────────────

describe('AssetDiscussion — error handling and graceful degradation', () => {
    let AssetDiscussion;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        // Mock Firebase
        global.firebase = {
            firestore: jest.fn(() => createFirestoreMock()),
            auth: jest.fn(() => ({
                currentUser: null,
                onAuthStateChanged: jest.fn()
            }))
        };
        global.firebase.firestore.FieldValue = {
            serverTimestamp: jest.fn(() => new Date()),
            increment: jest.fn((n) => n)
        };

        const code = loadScript('js/components/asset-discussion.js');
        // eslint-disable-next-line no-new-func
        const fn = new Function('window', 'document', 'firebase', code);
        fn(window, document, global.firebase);
        AssetDiscussion = window.AssetDiscussion;
    });

    afterEach(() => {
        document.body.removeChild(container);
        delete global.firebase;
    });

    test('AssetDiscussion is exported to window', () => {
        expect(window.AssetDiscussion).toBeDefined();
    });

    test('throws when container not found', () => {
        expect(() => new AssetDiscussion('#nonexistent-container', { assetId: 'zeus' }))
            .toThrow('[AssetDiscussion] Container element not found');
    });

    test('throws when assetId not provided', () => {
        expect(() => new AssetDiscussion(container, {}))
            .toThrow('[AssetDiscussion] assetId is required');
    });

    test('initialises without VoteService (graceful degradation)', async () => {
        delete window.VoteService;
        // Should not throw
        expect(() => new AssetDiscussion(container, { assetId: 'zeus' })).not.toThrow();
    });

    test('initialises without BadgeDisplay (graceful degradation)', async () => {
        delete window.BadgeDisplay;
        expect(() => new AssetDiscussion(container, { assetId: 'zeus' })).not.toThrow();
    });

    test('_showErrorBoundary renders retry button when init fails', () => {
        const instance = new AssetDiscussion(container, { assetId: 'test-entity' });
        instance._showErrorBoundary(new Error('Test failure'));
        expect(container.querySelector('.discussion-error-boundary')).toBeTruthy();
        expect(container.querySelector('.discussion-retry-btn')).toBeTruthy();
    });

    test('retry button calls init() again', () => {
        const instance = new AssetDiscussion(container, { assetId: 'test-entity' });
        instance.init = jest.fn();
        instance._showErrorBoundary(new Error('Test failure'));
        const retryBtn = container.querySelector('.discussion-retry-btn');
        retryBtn.click();
        expect(instance.init).toHaveBeenCalledTimes(1);
    });

    test('_showError displays message in error element', () => {
        const instance = new AssetDiscussion(container, { assetId: 'test-entity' });
        // Manually render so errorEl is populated
        instance.render();
        instance._showError('Something went wrong');
        expect(instance.errorEl.textContent).toBe('Something went wrong');
        expect(instance.errorEl.style.display).toBe('block');
    });
});

// ──────────────────────────────────────────────────────────────
// 4. DISCUSSION SUBMIT FORM — graceful corpus degradation
// ──────────────────────────────────────────────────────────────

describe('DiscussionSubmitForm — graceful corpus degradation', () => {
    let DiscussionSubmitForm;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        global.firebase = {
            firestore: jest.fn(() => createFirestoreMock()),
            auth: jest.fn(() => ({
                currentUser: { uid: 'u1', displayName: 'User', photoURL: null, email: 'u@test.com' }
            }))
        };
        global.firebase.firestore.FieldValue = {
            serverTimestamp: jest.fn(() => new Date()),
            increment: jest.fn()
        };

        // Ensure CorpusQueryService is NOT available
        delete window.CorpusQueryService;

        const code = loadScript('js/components/discussion-submit-form.js');
        // eslint-disable-next-line no-new-func
        const fn = new Function('window', 'document', 'firebase', code);
        fn(window, document, global.firebase);
        DiscussionSubmitForm = window.DiscussionSubmitForm;
    });

    afterEach(() => {
        document.body.removeChild(container);
        delete global.firebase;
    });

    test('DiscussionSubmitForm is exported to window', () => {
        expect(window.DiscussionSubmitForm).toBeDefined();
    });

    test('throws when container not found', () => {
        expect(() => new DiscussionSubmitForm('#nonexistent', { assetId: 'zeus' }))
            .toThrow('[DiscussionSubmitForm] Container element not found');
    });

    test('throws when assetId not provided', () => {
        expect(() => new DiscussionSubmitForm(container, {}))
            .toThrow('[DiscussionSubmitForm] assetId is required');
    });

    test('validate button is enabled when corpus service unavailable and content is long enough', async () => {
        const instance = new DiscussionSubmitForm(container, {
            assetId: 'zeus',
            requireCorpusQuery: true
        });

        // Wait for async init
        await new Promise(r => setTimeout(r, 50));

        // Simulate typing content (>=10 chars)
        if (instance.contentInput) {
            instance.contentInput.value = 'This is a test comment for Zeus';
            instance._handleContentChange();
        }

        // Validate button should be enabled even without corpus query since service is unavailable
        if (instance.validateBtn) {
            expect(instance.validateBtn.disabled).toBe(false);
        }
    });

    test('renders form fields for authenticated user', async () => {
        const instance = new DiscussionSubmitForm(container, { assetId: 'zeus' });
        await new Promise(r => setTimeout(r, 50));

        // Should render form for logged-in user
        expect(container.querySelector('.submit-form')).toBeTruthy();
    });
});
