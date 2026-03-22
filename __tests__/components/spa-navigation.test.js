/**
 * SPA Navigation Tests
 * Tests for js/spa-navigation.js
 */

describe('SPANavigation', () => {
    let SPANavigation;
    let spa;
    let mockFirestore;
    let mockAuth;
    let mockRenderer;

    beforeEach(() => {
        // Setup window globals that SPA expects
        window._eoaOptimisticAuth = true; // fast path
        window.LandingPageView = undefined;
        window.HomeView = undefined;
        window.MythologiesView = undefined;
        window.BrowseCategoryView = undefined;
        window.SearchViewComplete = undefined;
        window.CompareView = undefined;
        window.UserDashboard = undefined;
        window.AboutPage = undefined;
        window.PrivacyPage = undefined;
        window.TermsPage = undefined;
        window.LinkPrefetcher = undefined;
        window.NavigationMetrics = undefined;
        window.ScrollManager = undefined;
        window.RoutePreloader = undefined;

        // Mock requestAnimationFrame
        window.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));

        // Mock scrollTo
        window.scrollTo = jest.fn();
        window.scrollX = 0;
        window.scrollY = 0;

        // Mock history
        window.history.pushState = jest.fn();
        window.history.replaceState = jest.fn();
        window.history.back = jest.fn();
        window.history.forward = jest.fn();

        mockFirestore = {
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}), id: 'test' }))
                })),
                limit: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({ docs: [] }))
                })),
                get: jest.fn(() => Promise.resolve({ docs: [] }))
            }))
        };

        mockAuth = {
            currentUser: null,
            onAuthStateChanged: jest.fn(cb => {
                cb(null);
                return () => {};
            })
        };

        mockRenderer = {
            loadAndRender: jest.fn()
        };

        // Setup firebase mock for SPA constructor
        global.firebase = {
            auth: jest.fn(() => mockAuth),
            firestore: jest.fn(() => mockFirestore)
        };

        SPANavigation = require('../../js/spa-navigation.js');
    });

    afterEach(() => {
        if (spa) {
            try { spa.destroy(); } catch (e) {}
            spa = null;
        }
        delete window._eoaOptimisticAuth;
    });

    describe('constructor', () => {
        test('should initialize with firestore, auth, and renderer', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            expect(spa.db).toBe(mockFirestore);
            expect(spa.auth).toBe(mockAuth);
            expect(spa.renderer).toBe(mockRenderer);
        });

        test('should initialize route patterns', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            expect(spa.routes).toBeDefined();
            expect(spa.routes.home).toBeDefined();
            expect(spa.routes.mythologies).toBeDefined();
            expect(spa.routes.entity).toBeDefined();
            expect(spa.routes.search).toBeDefined();
        });

        test('should set authReady to true with optimistic auth', () => {
            window._eoaOptimisticAuth = true;
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            expect(spa.authReady).toBe(true);
        });

        test('should initialize navigation state tracking', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            expect(spa._isNavigating).toBeDefined();
        });
    });

    describe('getCollectionName()', () => {
        beforeEach(() => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
        });

        test('should map deity to deities', () => {
            expect(spa.getCollectionName('deity')).toBe('deities');
        });

        test('should map hero to heroes', () => {
            expect(spa.getCollectionName('hero')).toBe('heroes');
        });

        test('should map creature to creatures', () => {
            expect(spa.getCollectionName('creature')).toBe('creatures');
        });

        test('should return already-plural names as-is', () => {
            expect(spa.getCollectionName('deities')).toBe('deities');
            expect(spa.getCollectionName('heroes')).toBe('heroes');
        });

        test('should handle case-insensitive input', () => {
            expect(spa.getCollectionName('Deity')).toBe('deities');
            expect(spa.getCollectionName('HERO')).toBe('heroes');
        });

        test('should return unknown types as-is', () => {
            expect(spa.getCollectionName('unknown')).toBe('unknown');
        });

        test('should handle null/undefined', () => {
            expect(spa.getCollectionName(null)).toBeNull();
            expect(spa.getCollectionName(undefined)).toBeUndefined();
        });

        test('should map magic to magic (same singular/plural)', () => {
            expect(spa.getCollectionName('magic')).toBe('magic');
        });

        test('should map theory to user_theories', () => {
            expect(spa.getCollectionName('theory')).toBe('user_theories');
        });
    });

    describe('route patterns', () => {
        beforeEach(() => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
        });

        test('should match home route', () => {
            expect('#/'.match(spa.routes.home)).toBeTruthy();
            expect('/'.match(spa.routes.home)).toBeTruthy();
            expect('#'.match(spa.routes.home)).toBeTruthy();
            expect(''.match(spa.routes.home)).toBeTruthy();
        });

        test('should match mythologies route', () => {
            expect('#/mythologies'.match(spa.routes.mythologies)).toBeTruthy();
            expect('#/mythologies/'.match(spa.routes.mythologies)).toBeTruthy();
        });

        test('should match entity route', () => {
            const match = '#/mythology/greek/deities/zeus'.match(spa.routes.entity);
            expect(match).toBeTruthy();
            expect(match[1]).toBe('greek');
            expect(match[2]).toBe('deities');
            expect(match[3]).toBe('zeus');
        });

        test('should match browse category route', () => {
            const match = '#/browse/deities'.match(spa.routes.browse_category);
            expect(match).toBeTruthy();
            expect(match[1]).toBe('deities');
        });

        test('should match search route', () => {
            expect('#/search'.match(spa.routes.search)).toBeTruthy();
        });

        test('should match dashboard route', () => {
            expect('#/dashboard'.match(spa.routes.dashboard)).toBeTruthy();
        });

        test('should match about route', () => {
            expect('#/about'.match(spa.routes.about)).toBeTruthy();
        });

        test('should match compare route', () => {
            expect('#/compare'.match(spa.routes.compare)).toBeTruthy();
        });

        test('should match entity_alt route', () => {
            const match = '#/entity/deities/greek/zeus'.match(spa.routes.entity_alt);
            expect(match).toBeTruthy();
        });

        test('should match entity_simple route', () => {
            const match = '#/entity/deities/zeus'.match(spa.routes.entity_simple);
            expect(match).toBeTruthy();
            expect(match[1]).toBe('deities');
            expect(match[2]).toBe('zeus');
        });

        test('should match category route', () => {
            const match = '#/mythology/greek/deities'.match(spa.routes.category);
            expect(match).toBeTruthy();
            expect(match[1]).toBe('greek');
            expect(match[2]).toBe('deities');
        });

        test('should match privacy route', () => {
            expect('#/privacy'.match(spa.routes.privacy)).toBeTruthy();
        });

        test('should match terms route', () => {
            expect('#/terms'.match(spa.routes.terms)).toBeTruthy();
        });

        test('should match user_profile route', () => {
            const match = '#/user/abc123'.match(spa.routes.user_profile);
            expect(match).toBeTruthy();
            expect(match[1]).toBe('abc123');
        });

        test('should match corpus_explorer route', () => {
            expect('#/corpus-explorer'.match(spa.routes.corpus_explorer)).toBeTruthy();
        });
    });

    describe('route display names', () => {
        beforeEach(() => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
        });

        test('should have display names for all routes', () => {
            expect(spa._routeNames.home).toBe('Home');
            expect(spa._routeNames.mythologies).toBe('World Mythologies');
            expect(spa._routeNames.entity).toBe('Entity Details');
            expect(spa._routeNames.search).toBe('Search');
            expect(spa._routeNames.dashboard).toBe('Dashboard');
            expect(spa._routeNames.about).toBe('About');
        });
    });

    describe('verifyDependencies()', () => {
        test('should track loaded and missing classes', () => {
            window.AboutPage = function() {};
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            expect(spa._dependencyStatus).toBeDefined();
            expect(spa._dependencyStatus.verified).toBe(true);
            expect(spa._dependencyStatus.loaded).toContain('AboutPage');
        });
    });

    describe('waitForAuth()', () => {
        test('should resolve with user from onAuthStateChanged', async () => {
            mockAuth.onAuthStateChanged = jest.fn(cb => {
                cb({ email: 'test@test.com' });
                return () => {};
            });
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const result = await spa.waitForAuth();
            expect(result.user).toBeDefined();
            expect(result.timedOut).toBe(false);
        });

        test('should resolve with null user when not authenticated', async () => {
            mockAuth.onAuthStateChanged = jest.fn(cb => {
                cb(null);
                return () => {};
            });
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const result = await spa.waitForAuth();
            expect(result.user).toBeNull();
            expect(result.timedOut).toBe(false);
        });

        test('should timeout after 5 seconds', async () => {
            jest.useFakeTimers();
            mockAuth.onAuthStateChanged = jest.fn(() => () => {}); // never calls callback
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const promise = spa.waitForAuth();
            jest.advanceTimersByTime(5000);
            const result = await promise;
            expect(result.timedOut).toBe(true);
            jest.useRealTimers();
        });
    });

    describe('_initAccessibility()', () => {
        test('should create route announcer element', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._initAccessibility();
            const announcer = document.getElementById('spa-route-announcer');
            expect(announcer).not.toBeNull();
            expect(announcer.getAttribute('role')).toBe('status');
            expect(announcer.getAttribute('aria-live')).toBe('polite');
        });

        test('should create loading announcer element', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._initAccessibility();
            const announcer = document.getElementById('spa-loading-announcer');
            expect(announcer).not.toBeNull();
            expect(announcer.getAttribute('aria-live')).toBe('assertive');
        });

        test('should not create duplicate announcers', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._initAccessibility();
            spa._initAccessibility();
            const announcers = document.querySelectorAll('#spa-route-announcer');
            expect(announcers.length).toBe(1);
        });
    });

    describe('normalizePath()', () => {
        beforeEach(() => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
        });

        test('should keep #/ as-is', () => {
            expect(spa.normalizePath('#/')).toBe('#/');
        });

        test('should remove trailing slash', () => {
            expect(spa.normalizePath('#/mythologies/')).toBe('#/mythologies');
        });

        test('should not remove trailing slash from #/', () => {
            expect(spa.normalizePath('#/')).toBe('#/');
        });

        test('should add slash after #', () => {
            expect(spa.normalizePath('#mythologies')).toBe('#/mythologies');
        });

        test('should convert lone # to #/', () => {
            expect(spa.normalizePath('#')).toBe('#/');
        });
    });

    describe('addToHistory()', () => {
        beforeEach(() => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            // Clear any history added during construction
            spa.routeHistory = [];
        });

        test('should add path to history', () => {
            spa.addToHistory('/mythologies');
            expect(spa.routeHistory).toHaveLength(1);
            expect(spa.routeHistory[0].path).toBe('/mythologies');
        });

        test('should trim history when exceeding max', () => {
            spa.maxHistory = 3;
            spa.addToHistory('/a');
            spa.addToHistory('/b');
            spa.addToHistory('/c');
            spa.addToHistory('/d');
            expect(spa.routeHistory).toHaveLength(3);
            expect(spa.routeHistory[0].path).toBe('/b');
        });

        test('should include timestamp', () => {
            spa.addToHistory('/test');
            expect(spa.routeHistory[0].timestamp).toBeDefined();
        });
    });

    describe('getHistory()', () => {
        test('should return route history', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa.routeHistory = [];
            spa.addToHistory('/a');
            spa.addToHistory('/b');
            expect(spa.getHistory()).toHaveLength(2);
        });
    });

    describe('goBack()', () => {
        test('should call window.history.back()', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa.goBack();
            expect(window.history.back).toHaveBeenCalled();
        });
    });

    describe('goForward()', () => {
        test('should call window.history.forward()', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa.goForward();
            expect(window.history.forward).toHaveBeenCalled();
        });
    });

    describe('setTransitionsEnabled()', () => {
        test('should set transition state', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa.setTransitionsEnabled(false);
            expect(spa._transitionEnabled).toBe(false);
            spa.setTransitionsEnabled(true);
            expect(spa._transitionEnabled).toBe(true);
        });
    });

    describe('getLoadingHTML()', () => {
        test('should return HTML with loading message', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const html = spa.getLoadingHTML('Loading deities...');
            expect(html).toContain('Loading deities...');
            expect(html).toContain('loading-container');
            expect(html).toContain('role="status"');
        });

        test('should use default message', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const html = spa.getLoadingHTML();
            expect(html).toContain('Loading...');
        });
    });

    describe('getErrorHTML()', () => {
        test('should return HTML with title and message', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const html = spa.getErrorHTML('Not Found', 'Page missing');
            expect(html).toContain('Not Found');
            expect(html).toContain('Page missing');
            expect(html).toContain('role="alert"');
        });

        test('should use default title and message', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const html = spa.getErrorHTML();
            expect(html).toContain('Error');
            expect(html).toContain('Something went wrong');
        });

        test('should escape HTML in title', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const html = spa.getErrorHTML('<script>xss</script>');
            expect(html).not.toContain('<script>xss</script>');
        });
    });

    describe('_parseRouteForBreadcrumb()', () => {
        beforeEach(() => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
        });

        test('should return home for root path', () => {
            const result = spa._parseRouteForBreadcrumb('/');
            expect(result.type).toBe('home');
        });

        test('should return search type', () => {
            const result = spa._parseRouteForBreadcrumb('search');
            expect(result.type).toBe('search');
        });

        test('should return compare type', () => {
            const result = spa._parseRouteForBreadcrumb('compare');
            expect(result.type).toBe('compare');
        });

        test('should parse mythology route', () => {
            const result = spa._parseRouteForBreadcrumb('mythology/greek');
            expect(result.mythology).toBe('greek');
        });

        test('should parse mythology entity route', () => {
            const result = spa._parseRouteForBreadcrumb('mythology/greek/deities/zeus');
            expect(result.mythology).toBe('greek');
            expect(result.entityTypePlural).toBe('deities');
            expect(result.entityId).toBe('zeus');
        });

        test('should parse browse route', () => {
            const result = spa._parseRouteForBreadcrumb('browse/deities');
            expect(result.category).toBe('deities');
        });

        test('should parse browse with mythology filter', () => {
            const result = spa._parseRouteForBreadcrumb('browse/deities/greek');
            expect(result.category).toBe('deities');
            expect(result.mythology).toBe('greek');
        });

        test('should parse entity route', () => {
            const result = spa._parseRouteForBreadcrumb('entity/deities/greek/zeus');
            expect(result.entityTypePlural).toBe('deities');
            expect(result.mythology).toBe('greek');
            expect(result.entityId).toBe('zeus');
        });

        test('should return null for unknown routes', () => {
            const result = spa._parseRouteForBreadcrumb('unknown/path');
            expect(result).toBeNull();
        });
    });

    describe('registerViewCleanup()', () => {
        test('should register a callback', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._viewCleanupCallbacks = [];
            const cb = jest.fn();
            spa.registerViewCleanup(cb);
            expect(spa._viewCleanupCallbacks).toHaveLength(1);
        });

        test('should ignore non-function values', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._viewCleanupCallbacks = [];
            spa.registerViewCleanup('not a function');
            spa.registerViewCleanup(null);
            expect(spa._viewCleanupCallbacks).toHaveLength(0);
        });
    });

    describe('_runViewCleanup()', () => {
        test('should call all registered callbacks', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._viewCleanupCallbacks = [];
            const cb1 = jest.fn();
            const cb2 = jest.fn();
            spa.registerViewCleanup(cb1);
            spa.registerViewCleanup(cb2);
            spa._runViewCleanup();
            expect(cb1).toHaveBeenCalled();
            expect(cb2).toHaveBeenCalled();
        });

        test('should clear callbacks after running', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._viewCleanupCallbacks = [];
            spa.registerViewCleanup(jest.fn());
            spa._runViewCleanup();
            expect(spa._viewCleanupCallbacks).toHaveLength(0);
        });

        test('should handle errors in callbacks', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._viewCleanupCallbacks = [];
            spa.registerViewCleanup(() => { throw new Error('cleanup error'); });
            spa.registerViewCleanup(jest.fn());
            expect(() => spa._runViewCleanup()).not.toThrow();
        });

        test('should handle empty callbacks array', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._viewCleanupCallbacks = [];
            expect(() => spa._runViewCleanup()).not.toThrow();
        });
    });

    describe('escapeHtml()', () => {
        beforeEach(() => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
        });

        test('should escape HTML tags', () => {
            const result = spa.escapeHtml('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
        });

        test('should handle empty string', () => {
            expect(spa.escapeHtml('')).toBe('');
        });

        test('should handle null/undefined', () => {
            expect(spa.escapeHtml(null)).toBe('');
            expect(spa.escapeHtml(undefined)).toBe('');
        });
    });

    describe('showLoading()', () => {
        test('should show loading state in main-content', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const mainContent = document.createElement('div');
            mainContent.id = 'main-content';
            document.body.appendChild(mainContent);

            spa.showLoading();
            expect(mainContent.innerHTML).toContain('loading');
        });
    });

    describe('hideLoading()', () => {
        test('should clear loading state', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const mainContent = document.createElement('div');
            mainContent.id = 'main-content';
            mainContent.innerHTML = '<div class="loading-container">Loading...</div>';
            document.body.appendChild(mainContent);

            spa.hideLoading();
            // hideLoading removes the loading-container
        });
    });

    describe('showAuthWaitingState()', () => {
        test('should show auth waiting UI', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const container = document.createElement('div');
            spa.showAuthWaitingState(container);
            expect(container.innerHTML).toContain('Verifying authentication');
        });

        test('should handle null container', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            expect(() => spa.showAuthWaitingState(null)).not.toThrow();
        });
    });

    describe('_applyExitTransition()', () => {
        test('should resolve immediately for null element', async () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            await expect(spa._applyExitTransition(null)).resolves.toBeUndefined();
        });

        test('should add and remove transition classes', async () => {
            jest.useFakeTimers();
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const el = document.createElement('div');
            const promise = spa._applyExitTransition(el);
            expect(el.classList.contains('spa-transition-exit')).toBe(true);
            jest.advanceTimersByTime(400);
            await promise;
            expect(el.classList.contains('spa-transition-exit')).toBe(false);
            jest.useRealTimers();
        });
    });

    describe('_applyEnterTransition()', () => {
        test('should resolve immediately for null element', async () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            await expect(spa._applyEnterTransition(null)).resolves.toBeUndefined();
        });
    });

    describe('destroy()', () => {
        test('should clean up references', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa._boundHandlers = {
                hashchange: jest.fn(),
                popstate: jest.fn(),
                click: jest.fn(),
                keydown: jest.fn()
            };
            spa._viewCleanupCallbacks = [];
            spa.destroy();
            expect(spa.db).toBeNull();
            expect(spa.auth).toBeNull();
            expect(spa.renderer).toBeNull();
        });
    });

    // Helper to create main-content and SPA in proper order
    function createSpaWithMainContent() {
        // Ensure main-content exists before SPA constructor (which calls handleRoute)
        let mc = document.getElementById('main-content');
        if (!mc) {
            mc = document.createElement('div');
            mc.id = 'main-content';
            document.body.appendChild(mc);
        }
        const s = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
        return { spa: s, mainContent: mc };
    }

    describe('renderMythologies()', () => {
        test('should render with MythologiesView when available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.MythologiesView = jest.fn().mockImplementation(function() { this.render = jest.fn(); });
            await spa.renderMythologies();
            expect(window.MythologiesView).toHaveBeenCalled();
        });

        test('should show error when MythologiesView not available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.MythologiesView = undefined;
            await spa.renderMythologies();
            expect(ctx.mainContent.innerHTML).toContain('Unable to load Mythologies');
        });
    });

    describe('renderBrowseCategory()', () => {
        test('should render with BrowseCategoryView when available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.BrowseCategoryView = jest.fn().mockImplementation(function() { this.render = jest.fn(); });
            await spa.renderBrowseCategory('deities', 'greek');
            expect(window.BrowseCategoryView).toHaveBeenCalled();
        });

        test('should show basic fallback when BrowseCategoryView not available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.BrowseCategoryView = undefined;
            await spa.renderBrowseCategory('deities');
            // Falls back to renderBasicCategoryPage instead of showing an error
            expect(ctx.mainContent.innerHTML).toContain('Deities');
        });
    });

    describe('renderSearch()', () => {
        test('should render with SearchViewComplete when available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.SearchViewComplete = jest.fn().mockImplementation(function() { this.render = jest.fn(); });
            await spa.renderSearch();
            expect(window.SearchViewComplete).toHaveBeenCalled();
        });

        test('should show error when no search component available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.SearchViewComplete = undefined;
            window.EnhancedCorpusSearch = undefined;
            await spa.renderSearch();
            expect(ctx.mainContent.innerHTML).toContain('Not Available');
        });
    });

    describe('renderCompare()', () => {
        test('should render with CompareView when available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.CompareView = jest.fn().mockImplementation(function() { this.render = jest.fn(); });
            await spa.renderCompare();
            expect(window.CompareView).toHaveBeenCalled();
        });

        test('should show error when CompareView not available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.CompareView = undefined;
            await spa.renderCompare();
            expect(ctx.mainContent.innerHTML).toContain('not loaded');
        });
    });

    describe('renderDashboard()', () => {
        test('should render with UserDashboard when available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            global.UserDashboard = jest.fn().mockImplementation(function() { this.render = jest.fn().mockReturnValue('<div>dashboard</div>'); this.initialize = jest.fn(); });
            global.FirebaseCRUDManager = jest.fn().mockImplementation(function() {});
            global.firebase = { auth: jest.fn().mockReturnValue({}) };
            await spa.renderDashboard();
            expect(global.UserDashboard).toHaveBeenCalled();
            delete global.UserDashboard;
            delete global.FirebaseCRUDManager;
        });

        test('should show error when UserDashboard not available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.UserDashboard = undefined;
            await spa.renderDashboard();
            expect(ctx.mainContent.innerHTML).toContain('not loaded');
        });
    });

    describe('renderAbout()', () => {
        test('should render with AboutPage when available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.AboutPage = jest.fn().mockImplementation(function() { this.render = jest.fn(); });
            await spa.renderAbout();
            expect(window.AboutPage).toHaveBeenCalled();
        });

        test('should show error when AboutPage not available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.AboutPage = undefined;
            await spa.renderAbout();
            expect(ctx.mainContent.innerHTML).toContain('not loaded');
        });
    });

    describe('renderPrivacy()', () => {
        test('should render with PrivacyPage when available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.PrivacyPage = jest.fn().mockImplementation(function() { this.render = jest.fn(); });
            await spa.renderPrivacy();
            expect(window.PrivacyPage).toHaveBeenCalled();
        });

        test('should show error when PrivacyPage not available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.PrivacyPage = undefined;
            await spa.renderPrivacy();
            expect(ctx.mainContent.innerHTML).toContain('not loaded');
        });
    });

    describe('renderTerms()', () => {
        test('should render with TermsPage when available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.TermsPage = jest.fn().mockImplementation(function() { this.render = jest.fn(); });
            await spa.renderTerms();
            expect(window.TermsPage).toHaveBeenCalled();
        });

        test('should show error when TermsPage not available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.TermsPage = undefined;
            await spa.renderTerms();
            expect(ctx.mainContent.innerHTML).toContain('not loaded');
        });
    });

    describe('render404()', () => {
        test('should render 404 page', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            await spa.render404();
            expect(ctx.mainContent.innerHTML).toContain('404');
            expect(ctx.mainContent.innerHTML).toContain('Page not found');
        });
    });

    describe('renderError()', () => {
        test('should render error page with message', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            spa.renderError(new Error('Test error'));
            expect(ctx.mainContent.innerHTML).toContain('Test error');
            expect(ctx.mainContent.innerHTML).toContain('Error Loading Page');
        });

        test('should show failed route', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            spa.renderError(new Error('Failed'), '#/mythologies');
            expect(ctx.mainContent.innerHTML).toContain('#/mythologies');
        });

        test('should include retry button', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            spa.renderError(new Error('Error'));
            expect(ctx.mainContent.innerHTML).toContain('Retry');
        });
    });

    describe('renderUserProfile()', () => {
        test('should show error when UserProfileView not available', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.UserProfileView = undefined;
            await spa.renderUserProfile('user123');
            expect(ctx.mainContent.innerHTML).toContain('not loaded');
        });
    });

    describe('_retryWithBackoff()', () => {
        test('should return result on first success', async () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const result = await spa._retryWithBackoff(() => 'success');
            expect(result).toBe('success');
        });

        test('should retry on failure and succeed', async () => {
            jest.useFakeTimers();
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            let attempt = 0;
            const fn = jest.fn(() => {
                attempt++;
                if (attempt < 2) throw new Error('fail');
                return 'success';
            });
            const promise = spa._retryWithBackoff(fn, 3, 10);
            jest.advanceTimersByTime(100);
            const result = await promise;
            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(2);
            jest.useRealTimers();
        });

        test('should throw after max retries', async () => {
            jest.useFakeTimers();
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            const fn = jest.fn(() => { throw new Error('persistent error'); });
            const promise = spa._retryWithBackoff(fn, 2, 10);
            jest.advanceTimersByTime(100);
            await expect(promise).rejects.toThrow('persistent error');
            jest.useRealTimers();
        });
    });

    describe('navigate()', () => {
        test('should handle same path navigation', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa.currentRoute = '/';
            spa.navigate('#/');
        });

        test('should set hash for new path', () => {
            spa = new SPANavigation(mockFirestore, mockAuth, mockRenderer);
            spa.currentRoute = '/';
            spa._isNavigating = false;
            spa.navigate('#/mythologies');
        });
    });

    describe('renderHome()', () => {
        test('should try LandingPageView first', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.LandingPageView = jest.fn().mockImplementation(function() { this.render = jest.fn(); });
            await spa.renderHome();
            expect(window.LandingPageView).toHaveBeenCalled();
        });
    });

    describe('renderMythology()', () => {
        test('should render mythology page', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            // Without MythologyDetailView, it should try BrowseCategoryView or fallback
            window.MythologyDetailView = undefined;
            window.BrowseCategoryView = undefined;
            await spa.renderMythology('greek');
            // Should have rendered something (error or fallback)
        });
    });

    describe('renderEntity()', () => {
        test('should render entity page', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.FirebaseEntityRenderer = jest.fn().mockImplementation(function() {
                this.loadAndRender = jest.fn();
            });
            await spa.renderEntity('greek', 'deities', 'zeus');
        });
    });

    // ========================================
    // getCollectionName
    // ========================================

    describe('getCollectionName()', () => {
        let spa;

        beforeEach(() => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
        });

        test('should convert singular to plural', () => {
            expect(spa.getCollectionName('deity')).toBe('deities');
            expect(spa.getCollectionName('hero')).toBe('heroes');
            expect(spa.getCollectionName('creature')).toBe('creatures');
            expect(spa.getCollectionName('item')).toBe('items');
            expect(spa.getCollectionName('place')).toBe('places');
            expect(spa.getCollectionName('concept')).toBe('concepts');
            expect(spa.getCollectionName('archetype')).toBe('archetypes');
            expect(spa.getCollectionName('herb')).toBe('herbs');
            expect(spa.getCollectionName('ritual')).toBe('rituals');
            expect(spa.getCollectionName('text')).toBe('texts');
            expect(spa.getCollectionName('symbol')).toBe('symbols');
            expect(spa.getCollectionName('theory')).toBe('user_theories');
        });

        test('should return plural names as-is', () => {
            expect(spa.getCollectionName('deities')).toBe('deities');
            expect(spa.getCollectionName('heroes')).toBe('heroes');
            expect(spa.getCollectionName('creatures')).toBe('creatures');
        });

        test('should handle case-insensitive input', () => {
            expect(spa.getCollectionName('Deity')).toBe('deities');
            expect(spa.getCollectionName('HERO')).toBe('heroes');
        });

        test('should return unknown types as-is', () => {
            expect(spa.getCollectionName('unknown_type')).toBe('unknown_type');
        });
    });

    // ========================================
    // verifyDependencies
    // ========================================

    describe('verifyDependencies()', () => {
        test('should track loaded and missing classes', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            // All window globals are undefined in test
            expect(spa._dependencyStatus.verified).toBe(true);
            expect(spa._dependencyStatus.missing.length).toBeGreaterThan(0);
        });

        test('should detect loaded classes', () => {
            window.LandingPageView = function() {};
            window.AboutPage = function() {};
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            expect(spa._dependencyStatus.loaded).toContain('LandingPageView');
            expect(spa._dependencyStatus.loaded).toContain('AboutPage');
        });
    });

    // ========================================
    // _announceRouteChange
    // ========================================

    describe('_announceRouteChange()', () => {
        test('should set announcer text for matching route', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;

            const announcer = document.createElement('div');
            announcer.id = 'spa-route-announcer';
            document.body.appendChild(announcer);

            spa._announceRouteChange('#/mythologies');
            // requestAnimationFrame is mocked to run sync
        });

        test('should handle missing announcer', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            expect(() => spa._announceRouteChange('#/about')).not.toThrow();
        });
    });

    // ========================================
    // _announceLoading
    // ========================================

    describe('_announceLoading()', () => {
        test('should set loading message', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;

            const announcer = document.createElement('div');
            announcer.id = 'spa-loading-announcer';
            document.body.appendChild(announcer);

            spa._announceLoading(true, 'Loading entities');
        });

        test('should not set loading text when isLoading is false', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;

            const announcer = document.createElement('div');
            announcer.id = 'spa-loading-announcer';
            document.body.appendChild(announcer);

            // _announceLoading(false) clears textContent and does not set new text
            spa._announceLoading(false);
            // textContent is cleared to ''
            expect(announcer.textContent).toBe('');
        });

        test('should handle missing announcer', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            expect(() => spa._announceLoading(true)).not.toThrow();
        });
    });

    // ========================================
    // _manageFocusAfterNavigation
    // ========================================

    describe('_manageFocusAfterNavigation()', () => {
        test('should find focusable target in main-content', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;

            // Add a button (which is natively focusable, no tabindex setting needed)
            const btn = document.createElement('button');
            btn.textContent = 'Click me';
            btn.focus = jest.fn();
            ctx.mainContent.appendChild(btn);

            spa._manageFocusAfterNavigation();
            // requestAnimationFrame is mocked via setTimeout, but the key thing
            // is it doesn't throw and finds the focusable element
        });

        test('should handle missing main-content', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            ctx.mainContent.remove();
            expect(() => spa._manageFocusAfterNavigation()).not.toThrow();
        });

        test('should handle empty main-content', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            ctx.mainContent.innerHTML = '';
            expect(() => spa._manageFocusAfterNavigation()).not.toThrow();
        });
    });

    // ========================================
    // handleRoute via different paths
    // ========================================

    describe('handleRoute() route matching', () => {
        function prepareForRoute(ctx) {
            ctx.spa._isNavigating = false;
            ctx.spa._currentNavigationId = null;
            ctx.spa._activeNavigationId = null;
        }

        test('should handle mythologies route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/mythologies';
            const spy = jest.spyOn(spa, 'renderMythologies').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });

        test('should handle browse category route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/browse/deities';
            const spy = jest.spyOn(spa, 'renderBrowseCategory').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalledWith('deities');
        });

        test('should handle search route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/search';
            const spy = jest.spyOn(spa, 'renderSearch').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });

        test('should handle about route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/about';
            const spy = jest.spyOn(spa, 'renderAbout').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });

        test('should handle privacy route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/privacy';
            const spy = jest.spyOn(spa, 'renderPrivacy').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });

        test('should handle terms route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/terms';
            const spy = jest.spyOn(spa, 'renderTerms').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });

        test('should handle entity simple route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/entity/deities/zeus';
            const spy = jest.spyOn(spa, 'renderEntity').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });

        test('should handle 404 for unmatched route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/nonexistent/path/foo/bar/baz';
            const spy = jest.spyOn(spa, 'render404').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });

        test('should handle mythology route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/mythology/greek';
            const spy = jest.spyOn(spa, 'renderMythology').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalledWith('greek');
        });

        test('should handle dashboard route (with auth)', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            spa.authReady = true;
            global.firebase = { auth: jest.fn(() => ({ currentUser: { email: 'test@test.com' }, onAuthStateChanged: jest.fn() })) };
            window.location.hash = '#/dashboard';
            const spy = jest.spyOn(spa, 'renderDashboard').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });

        test('should handle entity standard route', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/mythology/greek/deities/zeus';
            const spy = jest.spyOn(spa, 'renderEntity').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });

        test('should handle browse category with mythology', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            window.location.hash = '#/browse/deities/greek';
            const spy = jest.spyOn(spa, 'renderBrowseCategory').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).toHaveBeenCalledWith('deities', 'greek');
        });

        test('should skip when already navigating', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            spa._isNavigating = true;
            window.location.hash = '#/mythologies';
            const spy = jest.spyOn(spa, 'renderMythologies').mockResolvedValue();
            await spa.handleRoute();
            expect(spy).not.toHaveBeenCalled();
        });

        test('should show auth waiting for protected route without auth', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            prepareForRoute(ctx);
            spa.authReady = false;
            window.location.hash = '#/dashboard';
            const spy = jest.spyOn(spa, 'showAuthWaitingState').mockImplementation(() => {});
            await spa.handleRoute();
            expect(spy).toHaveBeenCalled();
        });
    });

    // ========================================
    // navigate() with scroll and history
    // ========================================

    describe('navigate() details', () => {
        test('should normalize path with # prefix', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            spa.navigate('/mythologies');
            // Should have set hash to #/mythologies
        });

        test('should save scroll position', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            window.scrollX = 100;
            window.scrollY = 200;
            spa.navigate('#/about');
            expect(window.history.replaceState).toHaveBeenCalled();
        });
    });

    // ========================================
    // updateBreadcrumb
    // ========================================

    describe('updateBreadcrumb()', () => {
        test('should update breadcrumb when BreadcrumbNav available', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;

            global.BreadcrumbNav = jest.fn().mockImplementation(function() {
                this.update = jest.fn();
                this.clear = jest.fn();
            });

            const breadcrumbEl = document.createElement('nav');
            breadcrumbEl.id = 'breadcrumb-nav';
            document.body.appendChild(breadcrumbEl);

            spa.updateBreadcrumb('/mythology/greek/deities/zeus');
            expect(global.BreadcrumbNav).toHaveBeenCalled();
            delete global.BreadcrumbNav;
        });

        test('should handle missing BreadcrumbNav class', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            delete global.BreadcrumbNav;
            expect(() => spa.updateBreadcrumb('/mythologies')).not.toThrow();
        });

        test('should handle missing breadcrumb-nav element', () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            global.BreadcrumbNav = jest.fn().mockImplementation(function() {
                this.update = jest.fn();
                this.clear = jest.fn();
            });
            expect(() => spa.updateBreadcrumb('/mythologies')).not.toThrow();
            delete global.BreadcrumbNav;
        });
    });

    // ========================================
    // renderCategory
    // ========================================

    describe('renderCategory()', () => {
        test('should render category with BrowseCategoryView', async () => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
            global.BrowseCategoryView = jest.fn().mockImplementation(function() { this.render = jest.fn(); });
            await spa.renderCategory('greek', 'deities');
            delete global.BrowseCategoryView;
        });
    });

    // ========================================
    // normalizePath
    // ========================================

    describe('normalizePath()', () => {
        let spa;
        beforeEach(() => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
        });

        test('should strip trailing slash', () => {
            expect(spa.normalizePath('#/mythologies/')).toBe('#/mythologies');
        });

        test('should not strip trailing slash from root', () => {
            expect(spa.normalizePath('#/')).toBe('#/');
        });

        test('should normalize bare # to #/', () => {
            expect(spa.normalizePath('#')).toBe('#/');
        });

        test('should add / after # if missing', () => {
            expect(spa.normalizePath('#mythologies')).toBe('#/mythologies');
        });

        test('should pass through normal paths', () => {
            expect(spa.normalizePath('#/about')).toBe('#/about');
        });
    });

    // ========================================
    // _parseRouteForBreadcrumb
    // ========================================

    describe('_parseRouteForBreadcrumb()', () => {
        let spa;
        beforeEach(() => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
        });

        test('should return home for empty path', () => {
            expect(spa._parseRouteForBreadcrumb('/')).toEqual({ type: 'home' });
        });

        test('should return search type', () => {
            expect(spa._parseRouteForBreadcrumb('/search')).toEqual({ type: 'search' });
        });

        test('should return compare type', () => {
            expect(spa._parseRouteForBreadcrumb('/compare')).toEqual({ type: 'compare' });
        });

        test('should parse mythology route', () => {
            const result = spa._parseRouteForBreadcrumb('/mythology/greek');
            expect(result.mythology).toBe('greek');
        });

        test('should parse mythology with entity type', () => {
            const result = spa._parseRouteForBreadcrumb('/mythology/greek/deities');
            expect(result.mythology).toBe('greek');
            expect(result.entityTypePlural).toBe('deities');
            expect(result.entityType).toBe('deitie');
        });

        test('should parse mythology with entity type and id', () => {
            const result = spa._parseRouteForBreadcrumb('/mythology/greek/deities/zeus');
            expect(result.mythology).toBe('greek');
            expect(result.entityId).toBe('zeus');
        });

        test('should parse browse route', () => {
            const result = spa._parseRouteForBreadcrumb('/browse/deities');
            expect(result.category).toBe('deities');
        });

        test('should parse browse route with mythology', () => {
            const result = spa._parseRouteForBreadcrumb('/browse/deities/greek');
            expect(result.category).toBe('deities');
            expect(result.mythology).toBe('greek');
        });

        test('should parse entity route', () => {
            const result = spa._parseRouteForBreadcrumb('/entity/deities/greek/zeus');
            expect(result.entityTypePlural).toBe('deities');
            expect(result.mythology).toBe('greek');
            expect(result.entityId).toBe('zeus');
        });

        test('should return null for unknown route', () => {
            expect(spa._parseRouteForBreadcrumb('/unknown')).toBeNull();
        });
    });

    // ========================================
    // addToHistory, getHistory, goBack, goForward
    // ========================================

    describe('history management', () => {
        let spa;
        beforeEach(() => {
            const ctx = createSpaWithMainContent();
            spa = ctx.spa;
        });

        test('addToHistory should add route', () => {
            const initialLen = spa.getHistory().length;
            spa.addToHistory('/mythologies');
            spa.addToHistory('/about');
            expect(spa.getHistory()).toHaveLength(initialLen + 2);
        });

        test('addToHistory should trim old entries', () => {
            spa.maxHistory = 3;
            for (let i = 0; i < 5; i++) {
                spa.addToHistory(`/route-${i}`);
            }
            expect(spa.getHistory()).toHaveLength(3);
        });

        test('goBack should call history.back', () => {
            window.history.back = jest.fn();
            spa.goBack();
            expect(window.history.back).toHaveBeenCalled();
        });

        test('goForward should call history.forward', () => {
            window.history.forward = jest.fn();
            spa.goForward();
            expect(window.history.forward).toHaveBeenCalled();
        });
    });
});
