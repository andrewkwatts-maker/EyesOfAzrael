/**
 * Unit Tests for MythologiesView
 * Eyes of Azrael - Views Testing Suite
 *
 * @jest-environment jsdom
 */

// Mock console to reduce noise
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

describe('MythologiesView', () => {
    let container;
    let view;
    let mockFirestore;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        jest.useFakeTimers();

        // Mock DOM
        document.body.innerHTML = '<div id="main-content"></div>';
        container = document.getElementById('main-content');

        // Mock Firebase firestore
        mockFirestore = {
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) }))
                })),
                get: jest.fn(() => Promise.resolve({ docs: [] })),
                where: jest.fn(() => ({ get: jest.fn(() => Promise.resolve({ docs: [] })) }))
            }))
        };

        window.firebase = {
            firestore: jest.fn(() => mockFirestore)
        };

        // Mock SPA Navigation
        window.SPANavigation = {
            registerViewCleanup: jest.fn(),
            navigateTo: jest.fn()
        };

        // Mock cache manager
        window.cacheManager = {
            getList: jest.fn(() => Promise.resolve(null)),
            setList: jest.fn(),
            defaultTTL: { mythologies: 3600000 }
        };

        // Mock scroll
        window.scrollTo = jest.fn();

        // Mock localStorage
        const store = {};
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(key => store[key] || null);
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { store[key] = val; });
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => { delete store[key]; });

        // Mock requestAnimationFrame (both window and global for jsdom compatibility)
        window.requestAnimationFrame = jest.fn(cb => cb());
        global.requestAnimationFrame = jest.fn(cb => cb());

        // Mock CustomEvent dispatch
        jest.spyOn(document, 'dispatchEvent');

        // Load the module
        require('../../js/views/mythologies-view.js');

        view = new window.MythologiesView(mockFirestore);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        document.body.innerHTML = '';
        delete window.MythologiesView;
        delete window.firebase;
        delete window.SPANavigation;
        delete window.cacheManager;
    });

    // ==================== constructor ====================

    describe('constructor', () => {
        test('should store firestore reference as db', () => {
            expect(view.db).toBe(mockFirestore);
        });

        test('should use global cacheManager when available', () => {
            expect(view.cache).toBe(window.cacheManager);
        });

        test('should create fallback cache when cacheManager is not available', () => {
            delete window.cacheManager;
            const fallbackView = new window.MythologiesView(mockFirestore);
            expect(fallbackView.cache).toBeDefined();
            expect(typeof fallbackView.cache.getList).toBe('function');
        });

        test('should initialize mythologies as empty array', () => {
            expect(view.mythologies).toEqual([]);
        });

        test('should initialize _abortController as null', () => {
            expect(view._abortController).toBeNull();
        });
    });

    // ==================== render() ====================

    describe('render()', () => {
        test('should show loading HTML first', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {})); // never resolves
            view.render(container);
            expect(container.innerHTML).toContain('loading-container');
            expect(container.innerHTML).toContain('Loading mythologies...');
        });

        test('should add has-skeleton class during loading', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            expect(container.classList.contains('has-skeleton')).toBe(true);
        });

        test('should create AbortController', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            expect(view._abortController).toBeInstanceOf(AbortController);
        });

        test('should abort previous controller if render called again', () => {
            const firstController = new AbortController();
            view._abortController = firstController;
            const abortSpy = jest.spyOn(firstController, 'abort');

            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);

            expect(abortSpy).toHaveBeenCalled();
        });

        test('should register cleanup with SPANavigation after successful render', async () => {
            jest.useRealTimers();
            global.requestAnimationFrame = cb => cb();
            view.loadMythologies = jest.fn(async () => {
                view.mythologies = [{ id: 'greek', name: 'Greek', order: 1 }];
            });
            await view.render(container);
            expect(window.SPANavigation.registerViewCleanup).toHaveBeenCalledWith(expect.any(Function));
        });

        test('should not call registerViewCleanup if SPANavigation is unavailable', async () => {
            jest.useRealTimers();
            global.requestAnimationFrame = cb => cb();
            delete window.SPANavigation;
            view.loadMythologies = jest.fn(async () => {
                view.mythologies = [];
            });
            await view.render(container);
            // No error thrown
        });

        test('should dispatch first-render-complete event on success', async () => {
            jest.useRealTimers();
            global.requestAnimationFrame = cb => cb();
            view.loadMythologies = jest.fn(async () => {
                view.mythologies = [{ id: 'greek', name: 'Greek', order: 1 }];
            });
            let eventFired = false;
            document.addEventListener('first-render-complete', () => { eventFired = true; });
            await view.render(container);
            expect(eventFired).toBe(true);
        });

        test('should show error on failure and call showError', async () => {
            jest.useRealTimers();
            global.requestAnimationFrame = cb => cb();
            const showErrorSpy = jest.spyOn(view, 'showError');
            view.loadMythologies = jest.fn().mockRejectedValue(new Error('Network error'));
            await view.render(container);
            expect(showErrorSpy).toHaveBeenCalled();
        });

        test('should dispatch render-error event on failure', async () => {
            jest.useRealTimers();
            global.requestAnimationFrame = cb => cb();
            view.loadMythologies = jest.fn().mockRejectedValue(new Error('Network error'));
            let eventFired = false;
            document.addEventListener('render-error', () => { eventFired = true; });
            await view.render(container);
            expect(eventFired).toBe(true);
        });

        test('should remove has-skeleton class after content loads', async () => {
            jest.useRealTimers();
            global.requestAnimationFrame = cb => cb();
            view.loadMythologies = jest.fn(async () => {
                view.mythologies = [{ id: 'greek', name: 'Greek', order: 1 }];
            });
            await view.render(container);
            expect(container.classList.contains('has-skeleton')).toBe(false);
        });
    });

    // ==================== getLoadingHTML() ====================

    describe('getLoadingHTML()', () => {
        test('should return loading container with spinner', () => {
            const html = view.getLoadingHTML();
            expect(html).toContain('loading-container');
            expect(html).toContain('spinner-ring');
        });

        test('should include loading message', () => {
            const html = view.getLoadingHTML();
            expect(html).toContain('Loading mythologies...');
        });

        test('should not contain onclick attributes', () => {
            const html = view.getLoadingHTML();
            expect(html).not.toContain('onclick');
        });
    });

    // ==================== getMythologiesHTML() ====================

    describe('getMythologiesHTML()', () => {
        beforeEach(() => {
            view.mythologies = [
                { id: 'greek', name: 'Greek Mythology', description: 'Greek gods', color: '#8b7fff', region: 'Mediterranean', counts: { deities: 10, heroes: 5, creatures: 3 } },
                { id: 'norse', name: 'Norse Mythology', description: 'Norse gods', color: '#4a9eff', region: 'Northern Europe', counts: { deities: 8, heroes: 4, creatures: 6 } },
                { id: 'egyptian', name: 'Egyptian Mythology', description: 'Egyptian gods', color: '#ffd93d', region: 'Africa & Middle East', counts: { deities: 12, heroes: 2, creatures: 5 } }
            ];
        });

        test('should not contain any onclick attributes', () => {
            const html = view.getMythologiesHTML();
            expect(html).not.toContain('onclick');
        });

        test('should not contain any onmouseover attributes', () => {
            const html = view.getMythologiesHTML();
            expect(html).not.toContain('onmouseover');
        });

        test('should not contain any onmouseout attributes', () => {
            const html = view.getMythologiesHTML();
            expect(html).not.toContain('onmouseout');
        });

        test('should render region chips with data-region attributes', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('data-region="Mediterranean"');
            expect(html).toContain('data-region="Northern Europe"');
            expect(html).toContain('data-region="Africa & Middle East"');
        });

        test('should render "All Traditions" chip with data-region="all"', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('data-region="all"');
            expect(html).toContain('All Traditions');
        });

        test('should mark "All Traditions" chip as active by default', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('class="region-chip active" data-region="all"');
        });

        test('should render mythology cards with correct href format', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('href="#/mythology/greek"');
            expect(html).toContain('href="#/mythology/norse"');
            expect(html).toContain('href="#/mythology/egyptian"');
        });

        test('should render mythology cards as anchor tags', () => {
            const html = view.getMythologiesHTML();
            container.innerHTML = html;
            const cards = container.querySelectorAll('a.mythology-card');
            expect(cards.length).toBe(3);
        });

        test('should render back to top as a button element', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('<button class="back-to-top-btn">');
            expect(html).toContain('Back to top');
        });

        test('should include hero section with title', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('World Mythologies');
        });

        test('should include mythology counts in hero meta', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('Traditions');
        });

        test('should show entity count when total is above zero', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('Entities');
        });

        test('should display deity/hero/creature counts on cards', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('10 deities');
            expect(html).toContain('5 heroes');
            expect(html).toContain('3 creatures');
        });

        test('should set data-mythology attribute on cards', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('data-mythology="greek"');
            expect(html).toContain('data-mythology="norse"');
        });

        test('should set data-region attribute on cards', () => {
            const html = view.getMythologiesHTML();
            container.innerHTML = html;
            const greekCard = container.querySelector('[data-mythology="greek"]');
            expect(greekCard.dataset.region).toBe('Mediterranean');
        });

        test('should render region index nav with aria-label', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('aria-label="Browse by region"');
        });

        test('should render region chip counts', () => {
            const html = view.getMythologiesHTML();
            expect(html).toContain('region-chip-count');
        });

        test('should not render region index when only one region exists', () => {
            view.mythologies = [
                { id: 'greek', name: 'Greek', region: 'Mediterranean' }
            ];
            const html = view.getMythologiesHTML();
            expect(html).not.toContain('region-index-chips');
        });
    });

    // ==================== getMythologyCardHTML() ====================

    describe('getMythologyCardHTML()', () => {
        test('should render emoji icon when icon is emoji', () => {
            const html = view.getMythologyCardHTML({ id: 'greek', name: 'Greek', icon: '🏛️' });
            expect(html).toContain('🏛️');
        });

        test('should render img tag when icon is a URL', () => {
            const html = view.getMythologyCardHTML({ id: 'test', name: 'Test', icon: 'https://example.com/icon.svg' });
            expect(html).toContain('<img');
            expect(html).toContain('https://example.com/icon.svg');
        });

        test('should render img tag for local SVG paths', () => {
            const html = view.getMythologyCardHTML({ id: 'test', name: 'Test', icon: 'icons/test.svg' });
            expect(html).toContain('<img');
        });

        test('should render fallback emoji when no icon provided', () => {
            const html = view.getMythologyCardHTML({ id: 'test', name: 'Test' });
            expect(html).toContain('📖');
        });

        test('should use default color when none specified', () => {
            const html = view.getMythologyCardHTML({ id: 'test', name: 'Test' });
            expect(html).toContain('--card-color: #8b7fff');
        });

        test('should not contain onclick in card HTML', () => {
            const html = view.getMythologyCardHTML({ id: 'test', name: 'Test' });
            expect(html).not.toContain('onclick');
        });

        test('should show region tag when mythology has region', () => {
            const html = view.getMythologyCardHTML({ id: 'greek', name: 'Greek', region: 'Mediterranean' });
            expect(html).toContain('mythology-region-tag');
            expect(html).toContain('Mediterranean');
        });

        test('should infer region when not provided', () => {
            const html = view.getMythologyCardHTML({ id: 'greek', name: 'Greek' });
            expect(html).toContain('data-region="Mediterranean"');
        });
    });

    // ==================== attachEventListeners() ====================

    describe('attachEventListeners()', () => {
        beforeEach(() => {
            view.mythologies = [
                { id: 'greek', name: 'Greek', region: 'Mediterranean' },
                { id: 'norse', name: 'Norse', region: 'Northern Europe' }
            ];
            view._abortController = new AbortController();
            container.innerHTML = view.getMythologiesHTML();
        });

        test('should attach click listeners to mythology cards', () => {
            view.attachEventListeners();
            const card = document.querySelector('.mythology-card');
            expect(card).not.toBeNull();
            // Click should not throw
            card.click();
        });

        test('should filter cards when region chip is clicked', () => {
            view.attachEventListeners();
            const chips = document.querySelectorAll('.region-chip');
            // Click on Mediterranean chip
            const medChip = Array.from(chips).find(c => c.dataset.region === 'Mediterranean');
            if (medChip) {
                medChip.click();
                const norseCard = document.querySelector('[data-mythology="norse"]');
                expect(norseCard.style.display).toBe('none');
                const greekCard = document.querySelector('[data-mythology="greek"]');
                expect(greekCard.style.display).toBe('');
            }
        });

        test('should show all cards when "all" chip is clicked', () => {
            view.attachEventListeners();
            // First filter to Mediterranean
            const chips = document.querySelectorAll('.region-chip');
            const medChip = Array.from(chips).find(c => c.dataset.region === 'Mediterranean');
            if (medChip) medChip.click();
            // Then click all
            const allChip = document.querySelector('[data-region="all"]');
            allChip.click();
            const cards = document.querySelectorAll('.mythology-card');
            cards.forEach(c => expect(c.style.display).toBe(''));
        });

        test('should set active class on clicked chip', () => {
            view.attachEventListeners();
            const chips = document.querySelectorAll('.region-chip');
            const medChip = Array.from(chips).find(c => c.dataset.region === 'Mediterranean');
            if (medChip) {
                medChip.click();
                expect(medChip.classList.contains('active')).toBe(true);
                const allChip = document.querySelector('[data-region="all"]');
                expect(allChip.classList.contains('active')).toBe(false);
            }
        });

        test('should scroll to top when back-to-top button is clicked', () => {
            view.attachEventListeners();
            const btn = document.querySelector('.back-to-top-btn');
            btn.click();
            expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        });
    });

    // ==================== showError() ====================

    describe('showError()', () => {
        test('should display error container', () => {
            view._abortController = new AbortController();
            view.showError(container, new Error('Test error'));
            expect(container.innerHTML).toContain('error-container');
        });

        test('should display error message', () => {
            view._abortController = new AbortController();
            view.showError(container, new Error('Network failure'));
            expect(container.innerHTML).toContain('Network failure');
        });

        test('should display "Failed to Load Mythologies" heading', () => {
            view._abortController = new AbortController();
            view.showError(container, new Error('err'));
            expect(container.innerHTML).toContain('Failed to Load Mythologies');
        });

        test('should render retry button with data-action="retry"', () => {
            view._abortController = new AbortController();
            view.showError(container, new Error('err'));
            const retryBtn = container.querySelector('[data-action="retry"]');
            expect(retryBtn).not.toBeNull();
            expect(retryBtn.tagName).toBe('BUTTON');
        });

        test('should not contain onclick in error HTML', () => {
            view._abortController = new AbortController();
            view.showError(container, new Error('err'));
            expect(container.innerHTML).not.toContain('onclick');
        });

        test('should not contain onmouseover in error HTML', () => {
            view._abortController = new AbortController();
            view.showError(container, new Error('err'));
            expect(container.innerHTML).not.toContain('onmouseover');
        });

        test('should attach delegated click handler for retry', () => {
            view._abortController = new AbortController();
            const renderSpy = jest.spyOn(view, 'render').mockResolvedValue();
            view.showError(container, new Error('err'));
            const retryBtn = container.querySelector('[data-action="retry"]');
            retryBtn.click();
            expect(renderSpy).toHaveBeenCalledWith(container);
        });
    });

    // ==================== cleanup() ====================

    describe('cleanup()', () => {
        test('should abort the AbortController', () => {
            view._abortController = new AbortController();
            const abortSpy = jest.spyOn(view._abortController, 'abort');
            view.cleanup();
            expect(abortSpy).toHaveBeenCalled();
        });

        test('should set _abortController to null', () => {
            view._abortController = new AbortController();
            view.cleanup();
            expect(view._abortController).toBeNull();
        });

        test('should be safe to call when _abortController is already null', () => {
            view._abortController = null;
            expect(() => view.cleanup()).not.toThrow();
        });
    });

    // ==================== groupByRegion() ====================

    describe('groupByRegion()', () => {
        test('should group mythologies by their region property', () => {
            const mythologies = [
                { id: 'greek', name: 'Greek', region: 'Mediterranean' },
                { id: 'roman', name: 'Roman', region: 'Mediterranean' },
                { id: 'norse', name: 'Norse', region: 'Northern Europe' }
            ];
            const result = view.groupByRegion(mythologies);
            expect(Object.keys(result)).toEqual(['Mediterranean', 'Northern Europe']);
            expect(result['Mediterranean'].length).toBe(2);
            expect(result['Northern Europe'].length).toBe(1);
        });

        test('should infer region when not provided', () => {
            const mythologies = [
                { id: 'greek', name: 'Greek' },
                { id: 'norse', name: 'Norse' }
            ];
            const result = view.groupByRegion(mythologies);
            expect(result['Mediterranean']).toBeDefined();
            expect(result['Northern Europe']).toBeDefined();
        });

        test('should return empty object for empty array', () => {
            const result = view.groupByRegion([]);
            expect(result).toEqual({});
        });
    });

    // ==================== inferRegion() ====================

    describe('inferRegion()', () => {
        test('should map greek to Mediterranean', () => {
            expect(view.inferRegion('greek')).toBe('Mediterranean');
        });

        test('should map roman to Mediterranean', () => {
            expect(view.inferRegion('roman')).toBe('Mediterranean');
        });

        test('should map norse to Northern Europe', () => {
            expect(view.inferRegion('norse')).toBe('Northern Europe');
        });

        test('should map celtic to Northern Europe', () => {
            expect(view.inferRegion('celtic')).toBe('Northern Europe');
        });

        test('should map egyptian to Africa & Middle East', () => {
            expect(view.inferRegion('egyptian')).toBe('Africa & Middle East');
        });

        test('should map hindu to South & Central Asia', () => {
            expect(view.inferRegion('hindu')).toBe('South & Central Asia');
        });

        test('should map chinese to East Asia', () => {
            expect(view.inferRegion('chinese')).toBe('East Asia');
        });

        test('should map japanese to East Asia', () => {
            expect(view.inferRegion('japanese')).toBe('East Asia');
        });

        test('should map aztec to Americas', () => {
            expect(view.inferRegion('aztec')).toBe('Americas');
        });

        test('should map christian to Abrahamic', () => {
            expect(view.inferRegion('christian')).toBe('Abrahamic');
        });

        test('should map tarot to Esoteric', () => {
            expect(view.inferRegion('tarot')).toBe('Esoteric');
        });

        test('should return Other for unknown ID', () => {
            expect(view.inferRegion('unknown_mythology')).toBe('Other');
        });
    });

    // ==================== loadMythologies() ====================

    describe('loadMythologies()', () => {
        test('should call cache.getList', async () => {
            window.cacheManager.getList.mockResolvedValue([{ id: 'greek', name: 'Greek' }]);
            await view.loadMythologies();
            expect(window.cacheManager.getList).toHaveBeenCalledWith(
                'mythologies',
                {},
                expect.objectContaining({ ttl: 3600000 })
            );
        });

        test('should populate mythologies on success', async () => {
            const data = [{ id: 'greek', name: 'Greek' }];
            window.cacheManager.getList.mockResolvedValue(data);
            await view.loadMythologies();
            expect(view.mythologies).toEqual(data);
        });

        test('should use fallback when getList returns empty', async () => {
            window.cacheManager.getList.mockResolvedValue([]);
            await view.loadMythologies();
            expect(view.mythologies.length).toBeGreaterThan(0);
            expect(view.mythologies[0].id).toBe('greek');
        });

        test('should use fallback on error', async () => {
            window.cacheManager.getList.mockRejectedValue(new Error('fail'));
            await view.loadMythologies();
            expect(view.mythologies.length).toBeGreaterThan(0);
        });

        test('should save to localStorage on success', async () => {
            const data = [{ id: 'norse', name: 'Norse' }];
            window.cacheManager.getList.mockResolvedValue(data);
            await view.loadMythologies();
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'mythologies_cache',
                expect.any(String)
            );
        });
    });

    // ==================== getFallbackMythologies() ====================

    describe('getFallbackMythologies()', () => {
        test('should return array of mythologies', () => {
            const fallback = view.getFallbackMythologies();
            expect(Array.isArray(fallback)).toBe(true);
            expect(fallback.length).toBeGreaterThan(10);
        });

        test('should include greek as first mythology', () => {
            const fallback = view.getFallbackMythologies();
            expect(fallback[0].id).toBe('greek');
        });

        test('should have id, name, icon, description for each', () => {
            const fallback = view.getFallbackMythologies();
            fallback.forEach(m => {
                expect(m.id).toBeDefined();
                expect(m.name).toBeDefined();
                expect(m.icon).toBeDefined();
                expect(m.description).toBeDefined();
            });
        });
    });
});
