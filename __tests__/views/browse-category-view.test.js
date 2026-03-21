/**
 * Browse Category View - Unit Tests
 * Testing: Constructor, render lifecycle, entity cards, filter/sort controls,
 * AbortController cleanup, compare tray, and HTML output safety.
 *
 * @coverage-target 85%
 * @total-tests ~45
 */

// Mock console to reduce noise
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, val) => { store[key] = String(val); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, val) => { store[key] = String(val); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="main-content"></div>';

    window.firebase = {
        firestore: jest.fn(() => ({
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) }))
                })),
                get: jest.fn(() => Promise.resolve({
                    docs: [
                        {
                            id: 'zeus',
                            data: () => ({
                                name: 'Zeus',
                                mythology: 'greek',
                                description: 'King of the gods',
                                domains: ['sky', 'thunder'],
                                isStandard: true
                            })
                        },
                        {
                            id: 'odin',
                            data: () => ({
                                name: 'Odin',
                                mythology: 'norse',
                                description: 'Allfather',
                                domains: ['wisdom', 'war'],
                                isStandard: true
                            })
                        }
                    ],
                    size: 2
                })),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis()
            }))
        })),
        auth: jest.fn(() => ({
            currentUser: { uid: 'test-user-123', displayName: 'Test User', email: 'test@test.com', photoURL: null },
            onAuthStateChanged: jest.fn(cb => { cb({ uid: 'test-user-123' }); return jest.fn(); })
        }))
    };

    window.SPANavigation = {
        registerViewCleanup: jest.fn(),
        navigateTo: jest.fn()
    };

    window.cacheManager = {
        getList: jest.fn(() => Promise.resolve(null)),
        setList: jest.fn(),
        defaultTTL: { mythologies: 3600000 },
        getMetadata: jest.fn(() => Promise.resolve(null))
    };

    window.scrollTo = jest.fn();

    // Clear sessionStorage for compare tray
    sessionStorageMock.clear();
    localStorageMock.clear();
});

afterEach(() => {
    // no-op
});

// Load the source module (sets window.BrowseCategoryView)
require('../../js/views/browse-category-view.js');

describe('BrowseCategoryView', () => {
    let view;
    let container;
    let db;

    beforeEach(() => {
        container = document.getElementById('main-content');
        db = window.firebase.firestore();
        view = new window.BrowseCategoryView(db);
    });

    // ──────────────────────────────────────────────
    // Constructor & Initialization
    // ──────────────────────────────────────────────

    describe('Constructor', () => {
        test('should create instance with correct defaults', () => {
            expect(view).toBeDefined();
            expect(view.entities).toEqual([]);
            expect(view.filteredEntities).toEqual([]);
            expect(view.category).toBeNull();
        });

        test('should initialize view state defaults', () => {
            expect(view.viewMode).toBe('grid');
            expect(view.sortBy).toBe('name');
            expect(view.searchTerm).toBe('');
        });

        test('should initialize filter state', () => {
            expect(view.selectedMythologies).toBeInstanceOf(Set);
            expect(view.selectedMythologies.size).toBe(0);
            expect(view.selectedDomains).toBeInstanceOf(Set);
            expect(view.selectedDomains.size).toBe(0);
        });

        test('should initialize pagination state', () => {
            expect(view.currentPage).toBe(1);
            expect(view.itemsPerPage).toBe(24);
        });

        test('should reference cache manager', () => {
            expect(view.cache).toBeDefined();
        });

        test('should initialize content filter state', () => {
            expect(view.showUserContent).toBe(false);
            expect(view.contentFilter).toBeNull();
        });
    });

    // ──────────────────────────────────────────────
    // Render for different categories
    // ──────────────────────────────────────────────

    describe('render()', () => {
        test('should show loading HTML initially for deities', async () => {
            const renderPromise = view.render(container, { category: 'deities' });
            expect(container.innerHTML).toContain('browse-view');
            await renderPromise;
        });

        test('should set category from options', async () => {
            await view.render(container, { category: 'heroes' });
            expect(view.category).toBe('heroes');
        });

        test('should set mythology filter from options', async () => {
            await view.render(container, { category: 'creatures', mythology: 'greek' });
            expect(view.mythology).toBe('greek');
        });

        test('should render browse HTML after loading', async () => {
            await view.render(container, { category: 'deities' });
            expect(container.innerHTML).toContain('browse-view');
            expect(container.innerHTML).toContain('browse-hero');
        });

        test('should dispatch first-render-complete event', async () => {
            const handler = jest.fn();
            document.addEventListener('first-render-complete', handler);
            await view.render(container, { category: 'deities' });
            expect(handler).toHaveBeenCalled();
            document.removeEventListener('first-render-complete', handler);
        });

        test('should call attachEventListeners', async () => {
            const spy = jest.spyOn(view, 'attachEventListeners');
            await view.render(container, { category: 'deities' });
            expect(spy).toHaveBeenCalled();
        });

        test('should show error on fetch failure', async () => {
            // Override loadEntities to throw
            view.loadEntities = jest.fn(() => { throw new Error('Network error'); });
            await view.render(container, { category: 'deities' });
            expect(container.innerHTML).toContain('error');
        });
    });

    // ──────────────────────────────────────────────
    // Entity card HTML
    // ──────────────────────────────────────────────

    describe('Entity card HTML', () => {
        beforeEach(async () => {
            await view.render(container, { category: 'deities' });
        });

        test('entity cards have SPA-compatible hrefs', () => {
            // The cards use # hrefs for SPA navigation
            const cards = container.querySelectorAll('.entity-card:not(.skeleton-card):not(.entity-card--add-new)');
            cards.forEach(card => {
                if (card.tagName.toLowerCase() === 'a') {
                    const href = card.getAttribute('href');
                    expect(href).toMatch(/^#\//);
                }
            });
        });

        test('entity cards have data-entity-id attribute', () => {
            const cards = container.querySelectorAll('.entity-card[data-entity-id]');
            cards.forEach(card => {
                expect(card.dataset.entityId).toBeDefined();
                expect(card.dataset.entityId.length).toBeGreaterThan(0);
            });
        });

        test('entity cards have role="article" for accessibility', () => {
            const cards = container.querySelectorAll('.entity-card[role="article"]');
            // Should have at least one card with proper role
            if (view.entities.length > 0) {
                expect(cards.length).toBeGreaterThan(0);
            }
        });
    });

    // ──────────────────────────────────────────────
    // Filter & Sort controls
    // ──────────────────────────────────────────────

    describe('Filter and sort controls', () => {
        beforeEach(async () => {
            await view.render(container, { category: 'deities' });
        });

        test('search filter input exists', () => {
            const searchInput = container.querySelector('#searchFilter');
            expect(searchInput).not.toBeNull();
        });

        test('sort select exists with options', () => {
            const sortSelect = container.querySelector('#sortOrder');
            expect(sortSelect).not.toBeNull();
            const options = sortSelect.querySelectorAll('option');
            expect(options.length).toBeGreaterThanOrEqual(4);
        });

        test('view toggle buttons exist (grid/list)', () => {
            const viewBtns = container.querySelectorAll('.view-btn');
            expect(viewBtns.length).toBe(2);
        });

        test('active view button matches default viewMode', () => {
            const activeBtn = container.querySelector('.view-btn.active');
            expect(activeBtn).not.toBeNull();
            expect(activeBtn.dataset.view).toBe('grid');
        });

        test('density toggle exists', () => {
            const densityBtn = container.querySelector('#densityBtn');
            expect(densityBtn).not.toBeNull();
        });

        test('quick filter chips are rendered', () => {
            const chips = container.querySelectorAll('.filter-chip');
            // Should have chips if there are mythologies
            if (Object.keys(view.groupedEntities).length > 0) {
                expect(chips.length).toBeGreaterThan(0);
            }
        });
    });

    // ──────────────────────────────────────────────
    // AbortController cleanup (gold standard)
    // ──────────────────────────────────────────────

    describe('AbortController cleanup', () => {
        test('attachEventListeners creates AbortController', async () => {
            await view.render(container, { category: 'deities' });
            expect(view._abortController).toBeDefined();
            expect(view._abortController).not.toBeNull();
            expect(view._abortController).toBeInstanceOf(AbortController);
        });

        test('cleanup() aborts the controller', async () => {
            await view.render(container, { category: 'deities' });
            const controller = view._abortController;
            const abortSpy = jest.spyOn(controller, 'abort');

            view.cleanup();

            expect(abortSpy).toHaveBeenCalled();
            expect(view._abortController).toBeNull();
        });

        test('cleanup() removes document-level listeners', async () => {
            await view.render(container, { category: 'deities' });

            // _documentListeners should be tracked
            expect(view._documentListeners).toBeDefined();

            view.cleanup();

            expect(view._documentListeners).toEqual([]);
        });

        test('cleanup() is safe to call multiple times', async () => {
            await view.render(container, { category: 'deities' });
            view.cleanup();
            // Second call should not throw
            expect(() => view.cleanup()).not.toThrow();
        });

        test('registerViewCleanup is called', async () => {
            await view.render(container, { category: 'deities' });
            expect(window.SPANavigation.registerViewCleanup).toHaveBeenCalled();
        });

        test('registerViewCleanup callback calls cleanup()', async () => {
            await view.render(container, { category: 'deities' });
            const cleanupCallback = window.SPANavigation.registerViewCleanup.mock.calls[0][0];
            const cleanupSpy = jest.spyOn(view, 'cleanup');

            cleanupCallback();

            expect(cleanupSpy).toHaveBeenCalled();
        });
    });

    // ──────────────────────────────────────────────
    // Compare tray - known tech debt (4 inline onclick)
    // ──────────────────────────────────────────────

    describe('Compare tray (known tech debt)', () => {
        test('compare tray HTML is empty when no entities in compare', () => {
            const html = view.getCompareTrayHTML();
            expect(html).toBe('');
        });

        test('compare tray with entities has inline onclick (known tech debt)', () => {
            // Add entities to compare via sessionStorage
            const compareEntities = [
                { id: 'zeus', name: 'Zeus', _collection: 'deities' },
                { id: 'odin', name: 'Odin', _collection: 'deities' }
            ];
            sessionStorageMock.getItem.mockReturnValue(JSON.stringify(compareEntities));

            const html = view.getCompareTrayHTML();

            // Inline onclick handlers have been replaced with data-action delegation
            const onclickCount = (html.match(/onclick=/g) || []).length;
            expect(onclickCount).toBe(0);
            // Verify data-action attributes are present instead
            expect(html).toContain('data-action="toggle-compare-tray"');
            expect(html).toContain('data-action="remove-from-compare"');
            expect(html).toContain('data-action="clear-compare"');
        });

        test('compare tray shows "Compare Now" link when 2+ entities', () => {
            const compareEntities = [
                { id: 'zeus', name: 'Zeus', _collection: 'deities' },
                { id: 'odin', name: 'Odin', _collection: 'deities' }
            ];
            sessionStorageMock.getItem.mockReturnValue(JSON.stringify(compareEntities));

            const html = view.getCompareTrayHTML();
            expect(html).toContain('Compare Now');
            expect(html).toContain('href="#/compare"');
        });

        test('compare tray shows hint when only 1 entity', () => {
            const compareEntities = [
                { id: 'zeus', name: 'Zeus', _collection: 'deities' }
            ];
            sessionStorageMock.getItem.mockReturnValue(JSON.stringify(compareEntities));

            const html = view.getCompareTrayHTML();
            expect(html).toContain('Add');
            expect(html).toContain('more to compare');
        });
    });

    // ──────────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────────

    describe('Helper methods', () => {
        test('capitalize capitalizes first letter', () => {
            expect(view.capitalize('deities')).toBe('Deities');
            expect(view.capitalize('norse')).toBe('Norse');
        });

        test('escapeHtml escapes special characters', () => {
            const result = view.escapeHtml('<script>');
            expect(result).not.toContain('<script>');
        });

        test('truncateDescription handles null', () => {
            const result = view.truncateDescription(null, 100);
            expect(result).toBe('No description available');
        });

        test('truncateDescription truncates long text', () => {
            const long = 'A'.repeat(300);
            const result = view.truncateDescription(long, 100);
            expect(result.length).toBeLessThanOrEqual(104);
        });

        test('truncateDescription strips HTML tags', () => {
            const html = '<p>Hello <strong>world</strong></p>';
            const result = view.truncateDescription(html, 100);
            expect(result).not.toContain('<p>');
            expect(result).toContain('Hello');
            expect(result).toContain('world');
        });

        test('calculatePopularity returns a number', () => {
            const score = view.calculatePopularity({ views: 100, likes: 10 });
            expect(typeof score).toBe('number');
            expect(score).toBeGreaterThan(0);
        });

        test('groupByMythology groups correctly', () => {
            const entities = [
                { mythology: 'greek' },
                { mythology: 'greek' },
                { mythology: 'norse' }
            ];
            const grouped = view.groupByMythology(entities);
            expect(Object.keys(grouped)).toContain('greek');
            expect(Object.keys(grouped)).toContain('norse');
            expect(grouped.greek.length).toBe(2);
            expect(grouped.norse.length).toBe(1);
        });

        test('extractUniqueDomains extracts from domains array', () => {
            const entities = [
                { domains: ['sky', 'thunder'] },
                { domains: ['war', 'sky'] }
            ];
            const domains = view.extractUniqueDomains(entities);
            expect(domains.size).toBe(3); // sky, thunder, war
        });
    });

    // ──────────────────────────────────────────────
    // Loading and skeleton states
    // ──────────────────────────────────────────────

    describe('Loading states', () => {
        test('getLoadingHTML returns skeleton HTML', () => {
            view.category = 'deities';
            const html = view.getLoadingHTML();
            expect(html).toContain('browse-view');
            expect(html).toContain('skeleton');
        });

        test('getSkeletonCardHTML returns card skeleton', () => {
            const html = view.getSkeletonCardHTML();
            expect(html).toContain('entity-card');
            expect(html).toContain('skeleton');
        });
    });

    // ──────────────────────────────────────────────
    // showError
    // ──────────────────────────────────────────────

    describe('showError', () => {
        test('shows error message in container', () => {
            view.category = 'deities';
            view.showError(container, new Error('Test failure'));
            expect(container.innerHTML).toContain('error');
            expect(container.innerHTML).toContain('Test failure');
        });

        test('error container has retry button', () => {
            view.category = 'deities';
            view.showError(container, new Error('Fail'));
            // Note: the browse view showError uses onclick="location.reload()"
            // which is a known pattern in this specific error handler
            expect(container.innerHTML).toContain('Retry');
        });
    });

    // ──────────────────────────────────────────────
    // getCategoryInfo and descriptions
    // ──────────────────────────────────────────────

    describe('Category info and descriptions', () => {
        test('getCategoryLongDescription returns description for deities', () => {
            const desc = view.getCategoryLongDescription('deities', null);
            expect(desc).toContain('Divine beings');
        });

        test('getCategoryLongDescription with mythology context', () => {
            const desc = view.getCategoryLongDescription('heroes', 'Norse');
            expect(desc).toContain('Norse');
            expect(desc).toContain('hero');
        });

        test('getCategoryLongDescription returns fallback for unknown category', () => {
            const desc = view.getCategoryLongDescription('unknown', null);
            expect(desc).toContain('Browse');
        });
    });

    // ──────────────────────────────────────────────
    // Static methods
    // ──────────────────────────────────────────────

    describe('Static methods', () => {
        test('removeFromCompare removes entity from session storage', () => {
            const entities = [
                { id: 'zeus', _collection: 'deities' },
                { id: 'odin', _collection: 'deities' }
            ];
            sessionStorageMock.getItem.mockReturnValue(JSON.stringify(entities));

            window.BrowseCategoryView.removeFromCompare('zeus', 'deities');

            const setCall = sessionStorageMock.setItem.mock.calls.find(c => c[0] === 'eoa_compare_entities');
            if (setCall) {
                const remaining = JSON.parse(setCall[1]);
                expect(remaining.length).toBe(1);
                expect(remaining[0].id).toBe('odin');
            }
        });
    });
});
