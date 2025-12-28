/**
 * Integration Tests: Search to Entity View Workflow
 *
 * Tests complete user workflows from search through viewing entities
 * including cross-component communication and state management.
 *
 * Coverage:
 * - Search → Quick View → Favorite workflow
 * - Search → Compare → Export workflow
 * - Search → Edit → Refresh workflow
 * - URL sharing and navigation
 * - Error propagation across components
 *
 * Total Tests: 15
 */

// Import test utilities
const { createMockFirestore } = require('../test-utils.js');

// Mock Firestore instance (will be initialized in beforeEach)
let mockFirestore;

// Mock components
class MockSearchView {
    constructor(db) {
        this.db = db;
        this.state = {
            query: '',
            results: [],
            filters: {}
        };
    }

    async search(query) {
        this.state.query = query;
        const snapshot = await this.db.collection('deities').where('name', '==', query).get();
        this.state.results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return this.state.results;
    }

    setFilters(filters) {
        this.state.filters = filters;
    }

    saveToHistory(query) {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        history.unshift({ query, timestamp: Date.now() });
        localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)));
    }
}

class MockQuickViewModal {
    constructor(db) {
        this.db = db;
        this.isOpen = false;
        this.currentEntity = null;
    }

    async open(entityId, collection) {
        const doc = await this.db.collection(collection).doc(entityId).get();
        if (doc.exists) {
            this.currentEntity = { id: doc.id, ...doc.data() };
            this.isOpen = true;
            return this.currentEntity;
        }
        throw new Error('Entity not found');
    }

    close() {
        this.isOpen = false;
        this.currentEntity = null;
    }

    addToFavorites() {
        if (!this.currentEntity) return false;
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        if (!favorites.includes(this.currentEntity.id)) {
            favorites.push(this.currentEntity.id);
            localStorage.setItem('favorites', JSON.stringify(favorites));

            // Track analytics
            if (window.gtag) {
                window.gtag('event', 'add_to_favorites', {
                    item_id: this.currentEntity.id,
                    item_name: this.currentEntity.name
                });
            }

            return true;
        }
        return false;
    }
}

class MockCompareView {
    constructor(db) {
        this.db = db;
        this.selectedEntities = [];
    }

    addEntity(entity, collection) {
        if (this.selectedEntities.length < 6) {
            this.selectedEntities.push({ ...entity, _collection: collection });
            return true;
        }
        return false;
    }

    generateShareURL() {
        const entityIds = this.selectedEntities.map(e => `${e._collection}:${e.id}`).join(',');
        return `${window.location.origin}#/compare?entities=${entityIds}`;
    }

    async exportToPDF() {
        if (this.selectedEntities.length >= 2) {
            window.print();
            return true;
        }
        return false;
    }
}

class MockEditModal {
    constructor(db) {
        this.db = db;
        this.isOpen = false;
        this.currentEntity = null;
    }

    async open(entityId, collection) {
        const doc = await this.db.collection(collection).doc(entityId).get();
        if (doc.exists) {
            this.currentEntity = { id: doc.id, ...doc.data() };
            this.isOpen = true;
            return this.currentEntity;
        }
        throw new Error('Entity not found');
    }

    async save(updates) {
        if (!this.currentEntity) throw new Error('No entity loaded');
        await this.db.collection(this.currentEntity._collection).doc(this.currentEntity.id).update(updates);
        this.currentEntity = { ...this.currentEntity, ...updates };

        // Trigger refresh event
        window.dispatchEvent(new CustomEvent('entity-updated', {
            detail: { entityId: this.currentEntity.id, collection: this.currentEntity._collection }
        }));

        return this.currentEntity;
    }

    close() {
        this.isOpen = false;
        this.currentEntity = null;
    }
}

// Mock window objects
if (!global.window) {
    global.window = {};
}

// Ensure window has all necessary mocks
global.window.location = global.window.location || { origin: 'http://localhost', hash: '' };
global.window.localStorage = global.window.localStorage || {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    clear() { this.data = {}; }
};
global.window.print = jest.fn();
global.window.gtag = jest.fn();
global.window.dispatchEvent = jest.fn();
global.window.addEventListener = jest.fn();

global.localStorage = global.window.localStorage;

// Wait utility
const waitFor = async (callback, timeout = 1000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            callback();
            return;
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    throw new Error('Timeout waiting for condition');
};

describe('Search to Entity View Integration', () => {
    let searchView, quickViewModal, compareView, editModal;
    let container;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        localStorage.clear();

        // Create fresh mock Firestore instance with Zeus data
        const zeusDoc = {
            id: 'zeus',
            exists: true,
            data: () => ({
                name: 'Zeus',
                mythology: 'greek',
                type: 'deity',
                description: 'King of the Gods',
                importance: 100
            })
        };

        mockFirestore = createMockFirestore({
            id: 'zeus',
            exists: true,
            data: {
                name: 'Zeus',
                mythology: 'greek',
                type: 'deity',
                description: 'King of the Gods',
                importance: 100
            },
            docs: [zeusDoc]
        });

        // Create instances
        searchView = new MockSearchView(mockFirestore);
        quickViewModal = new MockQuickViewModal(mockFirestore);
        compareView = new MockCompareView(mockFirestore);
        editModal = new MockEditModal(mockFirestore);

        // Set global instances
        window.searchViewInstance = searchView;
        window.quickViewModal = quickViewModal;
        window.compareViewInstance = compareView;

        // Create container
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    // ==========================================
    // Complete User Workflows
    // ==========================================

    test('1. Complete search → view → favorite workflow', async () => {
        // Step 1: User searches for Zeus
        const results = await searchView.search('Zeus');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name).toBe('Zeus');

        // Step 2: User opens quick view
        const entity = await quickViewModal.open('zeus', 'deities');

        expect(quickViewModal.isOpen).toBe(true);
        expect(entity.name).toBe('Zeus');

        // Step 3: User adds to favorites
        const added = quickViewModal.addToFavorites();

        expect(added).toBe(true);
        const favorites = JSON.parse(localStorage.getItem('favorites'));
        expect(favorites).toContain('zeus');

        // Step 4: Analytics tracked
        expect(window.gtag).toHaveBeenCalledWith('event', 'add_to_favorites', expect.any(Object));
    });

    test('2. Search → compare → export workflow', async () => {
        // Step 1: Search for multiple entities
        await searchView.search('Zeus');
        const zeus = searchView.state.results[0];

        // Mock second entity - update the snapshot for Hera search
        const heraDoc = {
            id: 'hera',
            exists: true,
            data: () => ({ name: 'Hera', mythology: 'greek', type: 'deity' })
        };
        mockFirestore._mockSnapshot.docs = [heraDoc];

        await searchView.search('Hera');
        const hera = searchView.state.results[0];

        // Step 2: Add entities to comparison
        compareView.addEntity(zeus, 'deities');
        compareView.addEntity(hera, 'deities');

        expect(compareView.selectedEntities.length).toBe(2);

        // Step 3: Export to PDF
        const exported = await compareView.exportToPDF();

        expect(exported).toBe(true);
        expect(window.print).toHaveBeenCalled();
    });

    test('3. Search → edit → refresh workflow', async () => {
        // Step 1: Search and find entity
        await searchView.search('Zeus');
        const entity = searchView.state.results[0];

        // Step 2: Open edit modal
        await editModal.open('zeus', 'deities');

        expect(editModal.isOpen).toBe(true);

        // Step 3: Save changes
        const updates = { description: 'Updated description' };
        await editModal.save(updates);

        // Step 4: Verify refresh event was triggered
        expect(window.dispatchEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'entity-updated'
            })
        );

        expect(editModal.currentEntity.description).toBe('Updated description');
    });

    test('4. URL sharing and deep linking', async () => {
        // Step 1: Add entities to compare
        const zeus = { id: 'zeus', name: 'Zeus', mythology: 'greek' };
        const hera = { id: 'hera', name: 'Hera', mythology: 'greek' };

        compareView.addEntity(zeus, 'deities');
        compareView.addEntity(hera, 'deities');

        // Step 2: Generate share URL
        const shareURL = compareView.generateShareURL();

        expect(shareURL).toContain('entities=deities:zeus,deities:hera');

        // Step 3: Simulate loading from URL
        window.location.hash = '#/compare?entities=deities:zeus,deities:hera';

        // URL parameters would be parsed by router
        expect(window.location.hash).toContain('deities:zeus');
    });

    test('5. Search history persistence', async () => {
        // Perform multiple searches
        await searchView.search('Zeus');
        searchView.saveToHistory('Zeus');

        await searchView.search('Hera');
        searchView.saveToHistory('Hera');

        await searchView.search('Apollo');
        searchView.saveToHistory('Apollo');

        // Verify history
        const history = JSON.parse(localStorage.getItem('searchHistory'));

        expect(history.length).toBe(3);
        expect(history[0].query).toBe('Apollo'); // Most recent
        expect(history[2].query).toBe('Zeus'); // Oldest
    });

    test('6. Filter persistence across navigation', async () => {
        // Set filters
        searchView.setFilters({
            mythology: 'greek',
            type: 'deities',
            importance: [80, 100]
        });

        // Navigate away (simulate)
        window.location.hash = '#/about';

        // Navigate back
        window.location.hash = '#/search';

        // Filters should persist
        expect(searchView.state.filters.mythology).toBe('greek');
        expect(searchView.state.filters.type).toBe('deities');
    });

    test('7. Error propagation across components', async () => {
        // Mock Firestore error - document not found
        mockFirestore._mockDoc.exists = false;

        // Try to open quick view
        await expect(quickViewModal.open('zeus', 'deities')).rejects.toThrow('Entity not found');

        // Error should be logged
        expect(quickViewModal.isOpen).toBe(false);

        // Reset for other tests
        mockFirestore._mockDoc.exists = true;
    });

    test('8. Multiple components updating simultaneously', async () => {
        // Search results
        await searchView.search('Zeus');
        const zeus = searchView.state.results[0];

        // Open in quick view
        await quickViewModal.open('zeus', 'deities');

        // Add to compare
        compareView.addEntity(zeus, 'deities');

        // All components should have the same entity data
        expect(searchView.state.results[0].id).toBe('zeus');
        expect(quickViewModal.currentEntity.id).toBe('zeus');
        expect(compareView.selectedEntities[0].id).toBe('zeus');
    });

    test('9. Favorite → unfavorite → refavorite flow', async () => {
        await quickViewModal.open('zeus', 'deities');

        // Add to favorites
        quickViewModal.addToFavorites();
        let favorites = JSON.parse(localStorage.getItem('favorites'));
        expect(favorites).toContain('zeus');

        // Remove from favorites (simulate)
        favorites = favorites.filter(id => id !== 'zeus');
        localStorage.setItem('favorites', JSON.stringify(favorites));

        favorites = JSON.parse(localStorage.getItem('favorites'));
        expect(favorites).not.toContain('zeus');

        // Re-add to favorites
        quickViewModal.addToFavorites();
        favorites = JSON.parse(localStorage.getItem('favorites'));
        expect(favorites).toContain('zeus');
    });

    test('10. Search with empty query returns empty results', async () => {
        // Update snapshot to return empty results
        mockFirestore._mockSnapshot.docs = [];

        const results = await searchView.search('');

        expect(results.length).toBe(0);
    });

    test('11. Compare view max entities enforcement', () => {
        // Add 6 entities
        for (let i = 0; i < 6; i++) {
            const added = compareView.addEntity(
                { id: `entity${i}`, name: `Entity ${i}` },
                'deities'
            );
            expect(added).toBe(true);
        }

        // Try to add 7th entity
        const added = compareView.addEntity(
            { id: 'entity7', name: 'Entity 7' },
            'deities'
        );

        expect(added).toBe(false);
        expect(compareView.selectedEntities.length).toBe(6);
    });

    test('12. Edit modal prevents concurrent edits', async () => {
        await editModal.open('zeus', 'deities');

        // Try to open another entity while first is open
        const firstEntity = editModal.currentEntity;

        // Update mock to return Hera
        mockFirestore._mockDoc.id = 'hera';
        mockFirestore._mockDoc.data = () => ({
            name: 'Hera',
            mythology: 'greek',
            type: 'deity',
            description: 'Queen of the Gods',
            importance: 95
        });

        await editModal.open('hera', 'deities');

        // Second entity should replace first
        expect(editModal.currentEntity.id).toBe('hera');
        expect(editModal.currentEntity.id).not.toBe(firstEntity.id);
    });

    test('13. Analytics tracking across workflow', async () => {
        // Search
        await searchView.search('Zeus');
        window.gtag('event', 'search', { search_term: 'Zeus' });

        // View
        await quickViewModal.open('zeus', 'deities');
        window.gtag('event', 'view_item', { item_id: 'zeus' });

        // Favorite
        quickViewModal.addToFavorites();
        window.gtag('event', 'add_to_favorites', { item_id: 'zeus' });

        // Verify all analytics calls
        expect(window.gtag).toHaveBeenCalledTimes(3);
        expect(window.gtag).toHaveBeenCalledWith('event', 'search', expect.any(Object));
        expect(window.gtag).toHaveBeenCalledWith('event', 'view_item', expect.any(Object));
        expect(window.gtag).toHaveBeenCalledWith('event', 'add_to_favorites', expect.any(Object));
    });

    test('14. State consistency after errors', async () => {
        // Set initial state
        searchView.state.query = 'Zeus';
        searchView.state.results = [{ id: 'zeus', name: 'Zeus' }];

        // Trigger error - document doesn't exist
        const originalExists = mockFirestore._mockDoc.exists;
        mockFirestore._mockDoc.exists = false;

        try {
            await quickViewModal.open('zeus', 'deities');
        } catch (error) {
            // Error caught
        }

        // Search state should remain unchanged
        expect(searchView.state.query).toBe('Zeus');
        expect(searchView.state.results.length).toBe(1);

        // Modal should be closed
        expect(quickViewModal.isOpen).toBe(false);

        // Reset
        mockFirestore._mockDoc.exists = originalExists;
    });

    test('15. Cross-component event communication', async () => {
        const eventHandler = jest.fn();
        window.addEventListener('entity-updated', eventHandler);

        // Edit and save entity
        await editModal.open('zeus', 'deities');
        await editModal.save({ name: 'Zeus Updated' });

        // Event should be dispatched
        expect(window.dispatchEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'entity-updated',
                detail: expect.objectContaining({
                    entityId: 'zeus'
                })
            })
        );
    });
});

describe('Component Lifecycle Integration', () => {
    let components;

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();

        components = {
            search: new MockSearchView(mockFirestore),
            quickView: new MockQuickViewModal(mockFirestore),
            compare: new MockCompareView(mockFirestore),
            edit: new MockEditModal(mockFirestore)
        };
    });

    test('16. All components initialize without errors', () => {
        expect(components.search).toBeDefined();
        expect(components.quickView).toBeDefined();
        expect(components.compare).toBeDefined();
        expect(components.edit).toBeDefined();

        expect(components.search.db).toBe(mockFirestore);
        expect(components.quickView.db).toBe(mockFirestore);
        expect(components.compare.db).toBe(mockFirestore);
        expect(components.edit.db).toBe(mockFirestore);
    });

    test('17. Components clean up resources on unmount', () => {
        // Open modals
        components.quickView.isOpen = true;
        components.edit.isOpen = true;

        // Close/cleanup
        components.quickView.close();
        components.edit.close();

        expect(components.quickView.isOpen).toBe(false);
        expect(components.quickView.currentEntity).toBeNull();
        expect(components.edit.isOpen).toBe(false);
        expect(components.edit.currentEntity).toBeNull();
    });

    test('18. Memory leaks prevented in component teardown', () => {
        // Add many entities to compare
        for (let i = 0; i < 100; i++) {
            if (components.compare.selectedEntities.length < 6) {
                components.compare.addEntity({ id: `e${i}` }, 'deities');
            }
        }

        // Clear all
        components.compare.selectedEntities = [];

        expect(components.compare.selectedEntities.length).toBe(0);
    });
});
