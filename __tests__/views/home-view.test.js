/**
 * Unit Tests for HomeView
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

describe('HomeView', () => {
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
            defaultTTL: { mythologies: 3600000 },
            getMetadata: jest.fn(() => Promise.resolve(null))
        };

        // Mock scroll and performance
        window.scrollTo = jest.fn();
        window.performance = {
            now: jest.fn(() => Date.now())
        };

        // Mock localStorage
        const store = {};
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(key => store[key] || null);
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { store[key] = val; });
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => { delete store[key]; });

        // Mock requestAnimationFrame (both window and global for jsdom compatibility)
        window.requestAnimationFrame = jest.fn(cb => cb());
        global.requestAnimationFrame = jest.fn(cb => cb());

        // Load the module
        require('../../js/views/home-view.js');

        view = new window.HomeView(mockFirestore);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        document.body.innerHTML = '';
        delete window.HomeView;
        delete window.firebase;
        delete window.SPANavigation;
        delete window.cacheManager;
        delete window.AnalyticsManager;
        delete window.EyesOfAzrael;
    });

    // ==================== constructor ====================

    describe('constructor', () => {
        test('should store firestore reference as db', () => {
            expect(view.db).toBe(mockFirestore);
        });

        test('should use global cacheManager when available', () => {
            expect(view.cache).toBe(window.cacheManager);
        });

        test('should initialize mythologies as empty array', () => {
            expect(view.mythologies).toEqual([]);
        });

        test('should set loadingTimeout to null', () => {
            expect(view.loadingTimeout).toBeNull();
        });

        test('should set minLoadingTime to 300', () => {
            expect(view.minLoadingTime).toBe(300);
        });

        test('should set maxLoadingTime to 5000', () => {
            expect(view.maxLoadingTime).toBe(5000);
        });

        test('should set loadingStartTime to null initially', () => {
            expect(view.loadingStartTime).toBeNull();
        });

        test('should create fallback cache when cacheManager is unavailable', () => {
            delete window.cacheManager;
            const fallbackView = new window.HomeView(mockFirestore);
            expect(fallbackView.cache).toBeDefined();
            expect(typeof fallbackView.cache.getList).toBe('function');
        });
    });

    // ==================== render() ====================

    describe('render()', () => {
        test('should show loading spinner with skeleton cards', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {})); // never resolves
            view.render(container);
            expect(container.innerHTML).toContain('loading-container');
            expect(container.innerHTML).toContain('skeleton-card');
            expect(container.innerHTML).toContain('spinner-ring');
        });

        test('should show loading message', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            expect(container.innerHTML).toContain('Loading mythologies...');
        });

        test('should show submessage about Firebase', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            expect(container.innerHTML).toContain('Fetching from Firebase...');
        });

        test('should render 6 skeleton cards', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            const skeletons = container.querySelectorAll('.skeleton-card');
            expect(skeletons.length).toBe(6);
        });

        test('should include role="status" on loading container for accessibility', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            const loadingEl = container.querySelector('[role="status"]');
            expect(loadingEl).not.toBeNull();
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

        test('should register cleanup with SPANavigation', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            expect(window.SPANavigation.registerViewCleanup).toHaveBeenCalledWith(expect.any(Function));
        });

        test('should not throw if SPANavigation is unavailable', () => {
            delete window.SPANavigation;
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            expect(() => view.render(container)).not.toThrow();
        });

        test('should set loading timeout', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            expect(view.loadingTimeout).not.toBeNull();
        });

        test('should set loadingStartTime', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            expect(view.loadingStartTime).not.toBeNull();
        });

        test('should clear timeout on successful load', async () => {
            jest.useRealTimers();
            window.cacheManager.getList.mockResolvedValue([{ id: 'greek', name: 'Greek' }]);
            const clearSpy = jest.spyOn(global, 'clearTimeout');
            await view.render(container);
            expect(clearSpy).toHaveBeenCalled();
            clearSpy.mockRestore();
        });

        test('should clear timeout on error', async () => {
            jest.useRealTimers();
            window.cacheManager.getList.mockRejectedValue(new Error('fail'));
            const clearSpy = jest.spyOn(global, 'clearTimeout');
            await view.render(container);
            expect(clearSpy).toHaveBeenCalled();
            clearSpy.mockRestore();
        });

        test('should set up delegated retry handler on container', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            const addEventSpy = jest.spyOn(container, 'addEventListener');
            view.render(container);
            expect(addEventSpy).toHaveBeenCalledWith(
                'click',
                expect.any(Function),
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
        });
    });

    // ==================== HTML output ====================

    describe('HTML output', () => {
        test('getHomeHTML should not contain onclick attributes', () => {
            view.mythologies = view.getFallbackMythologies();
            const html = view.getHomeHTML();
            expect(html).not.toContain('onclick');
        });

        test('getHomeHTML should not contain onmouseover attributes', () => {
            view.mythologies = view.getFallbackMythologies();
            const html = view.getHomeHTML();
            expect(html).not.toContain('onmouseover');
        });

        test('getHomeHTML should not contain onmouseout attributes', () => {
            view.mythologies = view.getFallbackMythologies();
            const html = view.getHomeHTML();
            expect(html).not.toContain('onmouseout');
        });

        test('getHomeHTML should contain hero section', () => {
            view.mythologies = view.getFallbackMythologies();
            const html = view.getHomeHTML();
            expect(html).toContain('hero-section');
            expect(html).toContain('Eyes of Azrael');
        });

        test('getHomeHTML should contain mythology grid section', () => {
            view.mythologies = view.getFallbackMythologies();
            const html = view.getHomeHTML();
            expect(html).toContain('mythology-grid');
            expect(html).toContain('Explore Mythologies');
        });

        test('getHomeHTML should contain features section', () => {
            view.mythologies = view.getFallbackMythologies();
            const html = view.getHomeHTML();
            expect(html).toContain('features-section');
            expect(html).toContain('Database Features');
        });

        test('getHomeHTML should have SPA-compatible search href', () => {
            view.mythologies = view.getFallbackMythologies();
            const html = view.getHomeHTML();
            expect(html).toContain('href="#/search"');
        });

        test('getHomeHTML should have SPA-compatible compare href', () => {
            view.mythologies = view.getFallbackMythologies();
            const html = view.getHomeHTML();
            expect(html).toContain('href="#/compare"');
        });

        test('getMythologyCardHTML should use SPA-compatible href', () => {
            const html = view.getMythologyCardHTML({ id: 'greek', name: 'Greek', description: 'test' });
            expect(html).toContain('href="#/mythology/greek"');
        });

        test('getMythologyCardHTML should render as anchor tag', () => {
            const html = view.getMythologyCardHTML({ id: 'norse', name: 'Norse', description: 'test' });
            container.innerHTML = html;
            const link = container.querySelector('a.mythology-card');
            expect(link).not.toBeNull();
        });

        test('getMythologyCardHTML should not contain onclick', () => {
            const html = view.getMythologyCardHTML({ id: 'test', name: 'Test', description: 'desc' });
            expect(html).not.toContain('onclick');
        });

        test('getMythologyCardHTML should include data-mythology attribute', () => {
            const html = view.getMythologyCardHTML({ id: 'egyptian', name: 'Egyptian', description: 'desc' });
            expect(html).toContain('data-mythology="egyptian"');
        });

        test('getMythologyCardHTML should display mythology name', () => {
            const html = view.getMythologyCardHTML({ id: 'hindu', name: 'Hindu Mythology', description: 'desc' });
            expect(html).toContain('Hindu Mythology');
        });

        test('getMythologyCardHTML should display description', () => {
            const html = view.getMythologyCardHTML({ id: 'test', name: 'Test', description: 'Awesome mythology' });
            expect(html).toContain('Awesome mythology');
        });

        test('getMythologyCardHTML should show fallback icon when none provided', () => {
            const html = view.getMythologyCardHTML({ id: 'test', name: 'Test', description: 'desc' });
            expect(html).toContain('📖');
        });
    });

    // ==================== handleLoadingTimeout() ====================

    describe('handleLoadingTimeout()', () => {
        test('should show timeout warning HTML', () => {
            view.handleLoadingTimeout(container);
            expect(container.innerHTML).toContain('timeout-warning');
            expect(container.innerHTML).toContain('Loading is taking longer than expected');
        });

        test('should render retry button with data-action="retry"', () => {
            view.handleLoadingTimeout(container);
            const retryBtn = container.querySelector('[data-action="retry"]');
            expect(retryBtn).not.toBeNull();
            expect(retryBtn.tagName).toBe('BUTTON');
        });

        test('should not contain onclick in timeout HTML', () => {
            view.handleLoadingTimeout(container);
            expect(container.innerHTML).not.toContain('onclick=');
        });

        test('should render "Use Cached Data" button', () => {
            view.handleLoadingTimeout(container);
            const cachedBtn = container.querySelector('#useCachedDataBtn');
            expect(cachedBtn).not.toBeNull();
        });

        test('should transition to content if mythologies already loaded', () => {
            view.mythologies = [{ id: 'greek', name: 'Greek' }];
            const transitionSpy = jest.spyOn(view, 'transitionToContent').mockResolvedValue();
            view.handleLoadingTimeout(container);
            expect(transitionSpy).toHaveBeenCalledWith(container);
        });

        test('should still show spinner with "Still trying" message', () => {
            view.handleLoadingTimeout(container);
            expect(container.innerHTML).toContain('Still trying to connect...');
            expect(container.innerHTML).toContain('spinner-ring');
        });
    });

    // ==================== showError() ====================

    describe('showError()', () => {
        test('should display error container', () => {
            view.showError(container, new Error('Test error'));
            expect(container.innerHTML).toContain('error-container');
        });

        test('should display error message', () => {
            view.showError(container, new Error('Firestore is down'));
            expect(container.innerHTML).toContain('Firestore is down');
        });

        test('should display "Failed to Load Mythologies" heading', () => {
            view.showError(container, new Error('err'));
            expect(container.innerHTML).toContain('Failed to Load Mythologies');
        });

        test('should render retry button with data-action="retry"', () => {
            view.showError(container, new Error('err'));
            const retryBtn = container.querySelector('[data-action="retry"]');
            expect(retryBtn).not.toBeNull();
            expect(retryBtn.tagName).toBe('BUTTON');
        });

        test('should include error details expandable section', () => {
            view.showError(container, new Error('Some error'));
            const details = container.querySelector('details');
            expect(details).not.toBeNull();
        });

        test('should show network-specific help for network errors', () => {
            view.showError(container, new Error('network request failed'));
            expect(container.innerHTML).toContain('internet connection');
        });

        test('should show Firebase-specific help for Firebase errors', () => {
            view.showError(container, new Error('Firebase connection failed'));
            expect(container.innerHTML).toContain('Firebase');
        });

        test('should render "Use Cached Data" fallback button', () => {
            view.showError(container, new Error('err'));
            const fallbackBtn = container.querySelector('#useFallbackBtn');
            expect(fallbackBtn).not.toBeNull();
        });

        test('should include help text about browser console', () => {
            view.showError(container, new Error('err'));
            expect(container.innerHTML).toContain('browser console');
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

        test('registered cleanup function should call cleanup', () => {
            window.cacheManager.getList.mockReturnValue(new Promise(() => {}));
            view.render(container);
            const cleanupFn = window.SPANavigation.registerViewCleanup.mock.calls[0][0];
            const cleanupSpy = jest.spyOn(view, 'cleanup');
            cleanupFn();
            expect(cleanupSpy).toHaveBeenCalled();
        });
    });

    // ==================== loadMythologies() ====================

    describe('loadMythologies()', () => {
        test('should call cache.getList with mythologies', async () => {
            window.cacheManager.getList.mockResolvedValue([{ id: 'greek', name: 'Greek' }]);
            await view.loadMythologies();
            expect(window.cacheManager.getList).toHaveBeenCalledWith(
                'mythologies',
                {},
                expect.objectContaining({ orderBy: 'order asc' })
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
        });

        test('should use fallback on error', async () => {
            window.cacheManager.getList.mockRejectedValue(new Error('fail'));
            await view.loadMythologies();
            expect(view.mythologies.length).toBeGreaterThan(0);
        });
    });

    // ==================== getFallbackMythologies() ====================

    describe('getFallbackMythologies()', () => {
        test('should return array of 12 mythologies', () => {
            const fallback = view.getFallbackMythologies();
            expect(Array.isArray(fallback)).toBe(true);
            expect(fallback.length).toBe(12);
        });

        test('should include greek as first mythology', () => {
            const fallback = view.getFallbackMythologies();
            expect(fallback[0].id).toBe('greek');
        });

        test('should have id, name, icon, description, order for each', () => {
            const fallback = view.getFallbackMythologies();
            fallback.forEach(m => {
                expect(m.id).toBeDefined();
                expect(m.name).toBeDefined();
                expect(m.icon).toBeDefined();
                expect(m.description).toBeDefined();
                expect(m.order).toBeDefined();
            });
        });

        test('should have unique IDs', () => {
            const fallback = view.getFallbackMythologies();
            const ids = fallback.map(m => m.id);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });

    // ==================== delay() ====================

    describe('delay()', () => {
        test('should return a promise that resolves after given ms', async () => {
            const promise = view.delay(500);
            jest.advanceTimersByTime(500);
            await promise;
            // No assertion needed, test passes if it resolves
        });
    });

    // ==================== attachEventListeners() ====================

    describe('attachEventListeners()', () => {
        test('should create AbortController if not already present', () => {
            view._abortController = null;
            view.mythologies = view.getFallbackMythologies();
            container.innerHTML = view.getHomeHTML();
            view.attachEventListeners();
            expect(view._abortController).toBeInstanceOf(AbortController);
        });

        test('should reuse existing AbortController', () => {
            const existing = new AbortController();
            view._abortController = existing;
            view.mythologies = view.getFallbackMythologies();
            container.innerHTML = view.getHomeHTML();
            view.attachEventListeners();
            expect(view._abortController).toBe(existing);
        });

        test('should attach mouseenter to mythology cards', () => {
            view._abortController = new AbortController();
            view.mythologies = view.getFallbackMythologies();
            container.innerHTML = view.getHomeHTML();
            view.attachEventListeners();
            const card = document.querySelector('.mythology-card');
            // Should not throw on hover
            card.dispatchEvent(new Event('mouseenter'));
        });
    });

    // ==================== saveMythologiesCache() ====================

    describe('saveMythologiesCache()', () => {
        test('should save to localStorage', () => {
            view.saveMythologiesCache([{ id: 'greek' }]);
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'mythologies_cache',
                expect.any(String)
            );
        });

        test('should not save empty array', () => {
            view.saveMythologiesCache([]);
            expect(localStorage.setItem).not.toHaveBeenCalledWith(
                'mythologies_cache',
                expect.any(String)
            );
        });

        test('should not save null', () => {
            view.saveMythologiesCache(null);
            expect(localStorage.setItem).not.toHaveBeenCalledWith(
                'mythologies_cache',
                expect.any(String)
            );
        });
    });

    // ==================== loadFromCache() ====================

    describe('loadFromCache()', () => {
        test('should return null when no cache exists', () => {
            expect(view.loadFromCache()).toBeNull();
        });

        test('should return cached data when valid', () => {
            const cacheData = { data: [{ id: 'greek' }], timestamp: Date.now() };
            Storage.prototype.getItem.mockReturnValue(JSON.stringify(cacheData));
            const result = view.loadFromCache();
            expect(result).toEqual([{ id: 'greek' }]);
        });

        test('should return null when cache is expired', () => {
            const cacheData = { data: [{ id: 'greek' }], timestamp: Date.now() - 4000000 };
            Storage.prototype.getItem.mockReturnValue(JSON.stringify(cacheData));
            const result = view.loadFromCache();
            expect(result).toBeNull();
        });

        test('should return null on parse error', () => {
            Storage.prototype.getItem.mockReturnValue('invalid-json');
            const result = view.loadFromCache();
            expect(result).toBeNull();
        });
    });
});
