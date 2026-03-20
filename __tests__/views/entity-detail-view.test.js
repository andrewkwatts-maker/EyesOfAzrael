/**
 * Unit Tests for EntityDetailView
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

describe('EntityDetailView', () => {
    let container;
    let view;
    let mockFirestore;
    let mockDocGet;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        jest.useFakeTimers();

        // Mock DOM
        document.body.innerHTML = '<div id="main-content"></div>';
        container = document.getElementById('main-content');

        // Mock doc.get for Firebase
        mockDocGet = jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) }));

        // Mock Firebase firestore
        mockFirestore = {
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: mockDocGet
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
            registerView: jest.fn(),
            navigateTo: jest.fn()
        };

        // Mock cache manager
        window.cacheManager = {
            getList: jest.fn(() => Promise.resolve(null)),
            setList: jest.fn(),
            defaultTTL: { mythologies: 3600000 }
        };

        // Mock localStorage
        const store = {};
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(key => store[key] || null);
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { store[key] = val; });
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => { delete store[key]; });

        // Mock scroll
        window.scrollTo = jest.fn();

        // Mock requestAnimationFrame (both window and global for jsdom compatibility)
        window.requestAnimationFrame = jest.fn(cb => cb());
        global.requestAnimationFrame = jest.fn(cb => cb());

        // Mock navigator.clipboard
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: jest.fn(() => Promise.resolve()) },
            writable: true,
            configurable: true
        });

        // Load the module (IIFE sets window.EntityDetailView)
        require('../../js/views/entity-detail-view.js');

        view = new window.EntityDetailView({ db: mockFirestore });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        document.body.innerHTML = '';
        delete window.EntityDetailView;
        delete window.firebase;
        delete window.SPANavigation;
        delete window.cacheManager;
        delete window.MetadataGeographic;
        delete window.MetadataChronological;
        delete window.MetadataRelationships;
        delete window.AssetDetailPanel;
        delete window.EntityDetailViewer;
    });

    // ==================== constructor ====================

    describe('constructor', () => {
        test('should store db reference', () => {
            expect(view.db).toBe(mockFirestore);
        });

        test('should set _abortController to null', () => {
            expect(view._abortController).toBeNull();
        });

        test('should set container to null', () => {
            expect(view.container).toBeNull();
        });

        test('should create entityCache as Map', () => {
            expect(view.entityCache).toBeInstanceOf(Map);
        });

        test('should set CACHE_TTL to 5 minutes', () => {
            expect(view.CACHE_TTL).toBe(5 * 60 * 1000);
        });

        test('should set currentEntity to null', () => {
            expect(view.currentEntity).toBeNull();
        });

        test('should set currentRoute to null', () => {
            expect(view.currentRoute).toBeNull();
        });

        test('should set isLoading to false', () => {
            expect(view.isLoading).toBe(false);
        });

        test('should default useNewComponents to true', () => {
            expect(view.useNewComponents).toBe(true);
        });

        test('should default useLegacyViewer to false', () => {
            expect(view.useLegacyViewer).toBe(false);
        });

        test('should default showEditButton to false', () => {
            expect(view.showEditButton).toBe(false);
        });

        test('should default enablePrintStyles to true', () => {
            expect(view.enablePrintStyles).toBe(true);
        });

        test('should use firebase.firestore() when db not provided in options', () => {
            const v = new window.EntityDetailView();
            expect(v.db).toBeDefined();
        });

        test('should accept router option', () => {
            const mockRouter = { navigate: jest.fn() };
            const v = new window.EntityDetailView({ router: mockRouter });
            expect(v.router).toBe(mockRouter);
        });

        test('should call initializeComponents', () => {
            // Components are not on window, so renderers should be null
            expect(view.geoRenderer).toBeNull();
            expect(view.chronoRenderer).toBeNull();
            expect(view.relationRenderer).toBeNull();
            expect(view.assetDetailPanel).toBeNull();
        });
    });

    // ==================== render() ====================

    describe('render()', () => {
        const route = { mythology: 'greek', entityType: 'deities', entityId: 'zeus' };

        test('should return loading state HTML', async () => {
            const html = await view.render(route, container);
            expect(html).toContain('entity-detail-view--loading');
        });

        test('should show loading overlay with spinner', async () => {
            const html = await view.render(route, container);
            expect(html).toContain('edv-loading-overlay');
            expect(html).toContain('edv-spinner');
        });

        test('should show "Loading entity details..." text', async () => {
            const html = await view.render(route, container);
            expect(html).toContain('Loading entity details...');
        });

        test('should create AbortController', async () => {
            await view.render(route, container);
            expect(view._abortController).toBeInstanceOf(AbortController);
        });

        test('should abort previous controller', async () => {
            const oldController = new AbortController();
            view._abortController = oldController;
            const abortSpy = jest.spyOn(oldController, 'abort');
            await view.render(route, container);
            expect(abortSpy).toHaveBeenCalled();
        });

        test('should store container reference', async () => {
            await view.render(route, container);
            expect(view.container).toBe(container);
        });

        test('should store currentRoute', async () => {
            await view.render(route, container);
            expect(view.currentRoute).toBe(route);
        });

        test('should register cleanup with SPANavigation', async () => {
            await view.render(route, container);
            expect(window.SPANavigation.registerViewCleanup).toHaveBeenCalledWith(expect.any(Function));
        });

        test('should not throw if SPANavigation is unavailable', async () => {
            delete window.SPANavigation;
            await expect(view.render(route, container)).resolves.toBeDefined();
        });

        test('should include skeleton breadcrumb in loading state', async () => {
            const html = await view.render(route, container);
            expect(html).toContain('edv-breadcrumb');
            expect(html).toContain('edv-skeleton');
        });

        test('should include data attributes on loading article', async () => {
            const html = await view.render(route, container);
            expect(html).toContain('data-entity-id="zeus"');
            expect(html).toContain('data-entity-type="deities"');
            expect(html).toContain('data-mythology="greek"');
        });

        test('should not contain onclick in loading HTML', async () => {
            const html = await view.render(route, container);
            expect(html).not.toContain('onclick');
        });
    });

    // ==================== renderNotFound() ====================

    describe('renderNotFound()', () => {
        beforeEach(() => {
            // Set up a container with the expected class
            container.innerHTML = '<article class="entity-detail-view"></article>';
        });

        test('should render not found message', () => {
            view.renderNotFound('zeus', 'deities');
            const notFound = document.querySelector('.edv-not-found');
            expect(notFound).not.toBeNull();
        });

        test('should display "Entity Not Found" title', () => {
            view.renderNotFound('zeus', 'deities');
            const title = document.querySelector('.edv-not-found__title');
            expect(title.textContent).toBe('Entity Not Found');
        });

        test('should include entity ID in message', () => {
            view.renderNotFound('zeus', 'deities');
            const msg = document.querySelector('.edv-not-found__message');
            expect(msg.textContent).toContain('zeus');
        });

        test('should include entity type label in message', () => {
            view.renderNotFound('zeus', 'deities');
            const msg = document.querySelector('.edv-not-found__message');
            expect(msg.textContent).toContain('deity');
        });

        test('should not contain onclick in HTML', () => {
            view.renderNotFound('zeus', 'deities');
            const el = document.querySelector('.entity-detail-view');
            expect(el.innerHTML).not.toContain('onclick');
        });

        test('should render Go Back button with data-action="go-back"', () => {
            view.renderNotFound('zeus', 'deities');
            const goBack = document.querySelector('[data-action="go-back"]');
            expect(goBack).not.toBeNull();
            expect(goBack.tagName).toBe('BUTTON');
            expect(goBack.textContent.trim()).toContain('Go Back');
        });

        test('should render Browse link with correct href', () => {
            view.renderNotFound('zeus', 'deities');
            const browseLink = document.querySelector('a.edv-btn--secondary');
            expect(browseLink).not.toBeNull();
            expect(browseLink.getAttribute('href')).toBe('#/browse/deities');
        });

        test('should render Browse link text with entity type label', () => {
            view.renderNotFound('zeus', 'deities');
            const browseLink = document.querySelector('a.edv-btn--secondary');
            expect(browseLink.textContent.trim()).toContain('Browse');
            expect(browseLink.textContent.trim()).toContain('Deity');
        });

        test('should call attachEventListeners after rendering', () => {
            const spy = jest.spyOn(view, 'attachEventListeners');
            view.renderNotFound('zeus', 'deities');
            expect(spy).toHaveBeenCalled();
        });

        test('should do nothing when entity-detail-view container is missing', () => {
            document.body.innerHTML = '<div></div>';
            expect(() => view.renderNotFound('zeus', 'deities')).not.toThrow();
        });
    });

    // ==================== renderError() ====================

    describe('renderError()', () => {
        beforeEach(() => {
            container.innerHTML = '<article class="entity-detail-view"></article>';
        });

        test('should render error container', () => {
            view.renderError('Something went wrong');
            const error = document.querySelector('.edv-error');
            expect(error).not.toBeNull();
        });

        test('should display error title', () => {
            view.renderError('err');
            const title = document.querySelector('.edv-error__title');
            expect(title.textContent).toBe('Error Loading Entity');
        });

        test('should display error message', () => {
            view.renderError('Custom error message');
            const msg = document.querySelector('.edv-error__message');
            expect(msg.textContent).toContain('Custom error message');
        });

        test('should show default message when none provided', () => {
            view.renderError(null);
            const msg = document.querySelector('.edv-error__message');
            expect(msg.textContent).toContain('An unexpected error occurred');
        });

        test('should not contain onclick in HTML', () => {
            view.renderError('err');
            const el = document.querySelector('.entity-detail-view');
            expect(el.innerHTML).not.toContain('onclick');
        });

        test('should not contain onmouseover in HTML', () => {
            view.renderError('err');
            const el = document.querySelector('.entity-detail-view');
            expect(el.innerHTML).not.toContain('onmouseover');
        });

        test('should render Retry button with data-action="retry"', () => {
            view.renderError('err');
            const retryBtn = document.querySelector('[data-action="retry"]');
            expect(retryBtn).not.toBeNull();
            expect(retryBtn.tagName).toBe('BUTTON');
            expect(retryBtn.textContent.trim()).toContain('Retry');
        });

        test('should render Go Back button with data-action="go-back"', () => {
            view.renderError('err');
            const goBack = document.querySelector('[data-action="go-back"]');
            expect(goBack).not.toBeNull();
            expect(goBack.tagName).toBe('BUTTON');
            expect(goBack.textContent.trim()).toContain('Go Back');
        });

        test('should call attachEventListeners after rendering', () => {
            const spy = jest.spyOn(view, 'attachEventListeners');
            view.renderError('err');
            expect(spy).toHaveBeenCalled();
        });

        test('should do nothing when entity-detail-view container is missing', () => {
            document.body.innerHTML = '<div></div>';
            expect(() => view.renderError('err')).not.toThrow();
        });
    });

    // ==================== handleAction() ====================

    describe('handleAction()', () => {
        test('go-back should call window.history.back()', () => {
            const backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});
            view.handleAction('go-back', document.createElement('button'), new Event('click'));
            expect(backSpy).toHaveBeenCalled();
        });

        test('retry should call render when container and route are set', () => {
            view.container = container;
            view.currentRoute = { mythology: 'greek', entityType: 'deities', entityId: 'zeus' };
            const renderSpy = jest.spyOn(view, 'render').mockResolvedValue('');
            view.handleAction('retry', document.createElement('button'), new Event('click'));
            expect(renderSpy).toHaveBeenCalledWith(view.currentRoute, view.container);
        });

        test('retry should reload page when container or route not set', () => {
            view.container = null;
            view.currentRoute = null;
            // location.reload is not easily mockable in jsdom, wrap in try
            const reloadMock = jest.fn();
            Object.defineProperty(window, 'location', {
                value: { ...window.location, reload: reloadMock },
                writable: true,
                configurable: true
            });
            view.handleAction('retry', document.createElement('button'), new Event('click'));
            expect(reloadMock).toHaveBeenCalled();
        });

        test('print should call window.print()', () => {
            window.print = jest.fn();
            view.handleAction('print', document.createElement('button'), new Event('click'));
            expect(window.print).toHaveBeenCalled();
        });

        test('unknown action should not throw', () => {
            expect(() => {
                view.handleAction('unknown-action', document.createElement('button'), new Event('click'));
            }).not.toThrow();
        });
    });

    // ==================== cleanup() ====================

    describe('cleanup()', () => {
        test('should abort AbortController', () => {
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

        test('should set currentEntity to null', () => {
            view.currentEntity = { id: 'zeus', name: 'Zeus' };
            view.cleanup();
            expect(view.currentEntity).toBeNull();
        });

        test('should set currentRoute to null', () => {
            view.currentRoute = { mythology: 'greek' };
            view.cleanup();
            expect(view.currentRoute).toBeNull();
        });

        test('should set container to null', () => {
            view.container = container;
            view.cleanup();
            expect(view.container).toBeNull();
        });

        test('should be safe to call when _abortController is already null', () => {
            view._abortController = null;
            expect(() => view.cleanup()).not.toThrow();
        });

        test('registered cleanup via SPANavigation should call cleanup', async () => {
            const route = { mythology: 'greek', entityType: 'deities', entityId: 'zeus' };
            await view.render(route, container);
            const cleanupFn = window.SPANavigation.registerViewCleanup.mock.calls[0][0];
            const cleanupSpy = jest.spyOn(view, 'cleanup');
            cleanupFn();
            expect(cleanupSpy).toHaveBeenCalled();
        });
    });

    // ==================== getCollectionName() ====================

    describe('getCollectionName()', () => {
        test('should map deity to deities', () => {
            expect(view.getCollectionName('deity')).toBe('deities');
        });

        test('should map deities to deities', () => {
            expect(view.getCollectionName('deities')).toBe('deities');
        });

        test('should map god to deities', () => {
            expect(view.getCollectionName('god')).toBe('deities');
        });

        test('should map creature to creatures', () => {
            expect(view.getCollectionName('creature')).toBe('creatures');
        });

        test('should map hero to heroes', () => {
            expect(view.getCollectionName('hero')).toBe('heroes');
        });

        test('should map item to items', () => {
            expect(view.getCollectionName('item')).toBe('items');
        });

        test('should map artifact to items', () => {
            expect(view.getCollectionName('artifact')).toBe('items');
        });

        test('should map place to places', () => {
            expect(view.getCollectionName('place')).toBe('places');
        });

        test('should map location to places', () => {
            expect(view.getCollectionName('location')).toBe('places');
        });

        test('should return the input for unknown types', () => {
            expect(view.getCollectionName('unknownType')).toBe('unknownType');
        });
    });

    // ==================== getEntityTypeLabel() ====================

    describe('getEntityTypeLabel()', () => {
        test('should return Deity for deities', () => {
            expect(view.getEntityTypeLabel('deities')).toBe('Deity');
        });

        test('should return Creature for creatures', () => {
            expect(view.getEntityTypeLabel('creatures')).toBe('Creature');
        });

        test('should return Hero for heroes', () => {
            expect(view.getEntityTypeLabel('heroes')).toBe('Hero');
        });

        test('should return capitalized string for unknown types', () => {
            expect(view.getEntityTypeLabel('something')).toBe('Something');
        });
    });

    // ==================== utility methods ====================

    describe('escapeHtml()', () => {
        test('should escape HTML special characters', () => {
            const result = view.escapeHtml('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;');
        });

        test('should return empty string for null', () => {
            expect(view.escapeHtml(null)).toBe('');
        });

        test('should return empty string for undefined', () => {
            expect(view.escapeHtml(undefined)).toBe('');
        });
    });

    describe('escapeAttr()', () => {
        test('should escape double quotes', () => {
            expect(view.escapeAttr('"test"')).toContain('&quot;');
        });

        test('should escape angle brackets', () => {
            expect(view.escapeAttr('<test>')).toContain('&lt;');
            expect(view.escapeAttr('<test>')).toContain('&gt;');
        });

        test('should return empty string for null', () => {
            expect(view.escapeAttr(null)).toBe('');
        });
    });

    describe('capitalize()', () => {
        test('should capitalize first letter', () => {
            expect(view.capitalize('greek')).toBe('Greek');
        });

        test('should lowercase remaining letters', () => {
            expect(view.capitalize('GREEK')).toBe('Greek');
        });

        test('should return empty string for null', () => {
            expect(view.capitalize(null)).toBe('');
        });
    });

    describe('getTypeColor()', () => {
        test('should return gold for deities', () => {
            expect(view.getTypeColor('deities')).toBe('#ffd700');
        });

        test('should return default for unknown type', () => {
            expect(view.getTypeColor('unknown')).toBe('#667eea');
        });
    });

    describe('darkenColor()', () => {
        test('should return a darker hex color', () => {
            const result = view.darkenColor('#ffffff', 20);
            expect(result).toMatch(/^#[0-9a-f]{6}$/);
            expect(result).not.toBe('#ffffff');
        });

        test('should not go below 0 for any channel', () => {
            const result = view.darkenColor('#000000', 50);
            expect(result).toBe('#000000');
        });
    });

    describe('renderIcon()', () => {
        test('should return empty string for null', () => {
            expect(view.renderIcon(null)).toBe('');
        });

        test('should return emoji span for emoji input', () => {
            const result = view.renderIcon('⚡');
            expect(result).toContain('edv-icon-emoji');
            expect(result).toContain('⚡');
        });

        test('should return img tag for URL', () => {
            const result = view.renderIcon('https://example.com/icon.png');
            expect(result).toContain('<img');
            expect(result).toContain('edv-icon-img');
        });

        test('should return SVG as-is', () => {
            const svg = '<svg viewBox="0 0 100 100"></svg>';
            expect(view.renderIcon(svg)).toBe(svg);
        });
    });

    // ==================== renderBreadcrumb() ====================

    describe('renderBreadcrumb()', () => {
        test('should render nav with aria-label', () => {
            const html = view.renderBreadcrumb('greek', 'deities', 'Zeus');
            expect(html).toContain('aria-label="Breadcrumb navigation"');
        });

        test('should include Home link', () => {
            const html = view.renderBreadcrumb('greek', 'deities', 'Zeus');
            expect(html).toContain('href="#/"');
            expect(html).toContain('Home');
        });

        test('should include entity type browse link', () => {
            const html = view.renderBreadcrumb('greek', 'deities', 'Zeus');
            expect(html).toContain('href="#/browse/deities"');
        });

        test('should include mythology link', () => {
            const html = view.renderBreadcrumb('greek', 'deities', 'Zeus');
            expect(html).toContain('href="#/mythologies/greek"');
        });

        test('should include entity name as current page', () => {
            const html = view.renderBreadcrumb('greek', 'deities', 'Zeus');
            expect(html).toContain('aria-current="page"');
            expect(html).toContain('Zeus');
        });

        test('should not contain onclick', () => {
            const html = view.renderBreadcrumb('greek', 'deities', 'Zeus');
            expect(html).not.toContain('onclick');
        });
    });

    // ==================== loadEntity() ====================

    describe('loadEntity()', () => {
        test('should return entity from Firebase when doc exists', async () => {
            mockDocGet.mockResolvedValue({
                exists: true,
                id: 'zeus',
                data: () => ({ name: 'Zeus', description: 'King of gods' })
            });
            const result = await view.loadEntity('greek', 'deities', 'zeus');
            expect(result).toEqual(expect.objectContaining({
                id: 'zeus',
                name: 'Zeus',
                mythology: 'greek',
                entityType: 'deities'
            }));
        });

        test('should return null when doc does not exist', async () => {
            mockDocGet.mockResolvedValue({ exists: false });
            const result = await view.loadEntity('greek', 'deities', 'nonexistent');
            expect(result).toBeNull();
        });

        test('should cache entity after loading', async () => {
            mockDocGet.mockResolvedValue({
                exists: true,
                id: 'zeus',
                data: () => ({ name: 'Zeus' })
            });
            await view.loadEntity('greek', 'deities', 'zeus');
            expect(view.entityCache.has('greek:deities:zeus')).toBe(true);
        });

        test('should return cached entity when cache is valid', async () => {
            view.entityCache.set('greek:deities:zeus', {
                data: { id: 'zeus', name: 'Zeus (cached)' },
                timestamp: Date.now()
            });
            const result = await view.loadEntity('greek', 'deities', 'zeus');
            expect(result.name).toBe('Zeus (cached)');
            expect(mockDocGet).not.toHaveBeenCalled();
        });

        test('should bypass cache when cache is expired', async () => {
            view.entityCache.set('greek:deities:zeus', {
                data: { id: 'zeus', name: 'Zeus (stale)' },
                timestamp: Date.now() - 10 * 60 * 1000 // 10 min old
            });
            mockDocGet.mockResolvedValue({
                exists: true,
                id: 'zeus',
                data: () => ({ name: 'Zeus (fresh)' })
            });
            const result = await view.loadEntity('greek', 'deities', 'zeus');
            expect(result.name).toBe('Zeus (fresh)');
        });

        test('should throw when db is not available', async () => {
            view.db = null;
            await expect(view.loadEntity('greek', 'deities', 'zeus'))
                .rejects.toThrow('Firebase Firestore not initialized');
        });
    });

    // ==================== destroy() ====================

    describe('destroy()', () => {
        test('should nullify currentEntity', () => {
            view.currentEntity = { id: 'zeus' };
            view.destroy();
            expect(view.currentEntity).toBeNull();
        });

        test('should nullify currentRoute', () => {
            view.currentRoute = { mythology: 'greek' };
            view.destroy();
            expect(view.currentRoute).toBeNull();
        });

        test('should clear entityCache', () => {
            view.entityCache.set('key', 'value');
            view.destroy();
            expect(view.entityCache.size).toBe(0);
        });
    });

    // ==================== toggleBookmark() ====================

    describe('toggleBookmark()', () => {
        test('should add entity to bookmarks and return true', () => {
            Storage.prototype.getItem.mockImplementation(key => {
                if (key === 'eoa_bookmarks') return '[]';
                return null;
            });
            const result = view.toggleBookmark('zeus');
            expect(result).toBe(true);
            expect(Storage.prototype.setItem).toHaveBeenCalledWith(
                'eoa_bookmarks',
                expect.stringContaining('zeus')
            );
        });

        test('should remove entity from bookmarks and return false', () => {
            Storage.prototype.getItem.mockImplementation(key => {
                if (key === 'eoa_bookmarks') return '["zeus"]';
                return null;
            });
            const result = view.toggleBookmark('zeus');
            expect(result).toBe(false);
        });
    });

    // ==================== isBookmarked() ====================

    describe('isBookmarked()', () => {
        test('should return true when entity is bookmarked', () => {
            Storage.prototype.getItem.mockImplementation(key => {
                if (key === 'eoa_bookmarks') return '["zeus","athena"]';
                return null;
            });
            expect(view.isBookmarked('zeus')).toBe(true);
        });

        test('should return false when entity is not bookmarked', () => {
            Storage.prototype.getItem.mockImplementation(key => {
                if (key === 'eoa_bookmarks') return '["athena"]';
                return null;
            });
            expect(view.isBookmarked('zeus')).toBe(false);
        });

        test('should return false when no bookmarks exist', () => {
            Storage.prototype.getItem.mockImplementation(() => null);
            expect(view.isBookmarked('zeus')).toBe(false);
        });
    });
});
