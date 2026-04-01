/**
 * Sprint 5 View Rendering Tests
 * Verifies first-render-complete dispatches, error/empty states,
 * and timeout handling across all Sprint 5 views.
 *
 * @jest-environment jsdom
 * @coverage-target 80%
 */

// Mock console to reduce noise
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// ============================================================
// Shared setup helpers
// ============================================================

const createContainer = () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
};

const cleanupContainer = (el) => {
    if (el && el.parentElement) el.parentElement.removeChild(el);
};

const waitForEvent = (eventName, timeout = 3000) =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${eventName}`)), timeout);
        document.addEventListener(eventName, (e) => {
            clearTimeout(timer);
            resolve(e);
        }, { once: true });
    });

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    document.body.innerHTML = '<div id="main-content"></div>';

    window.firebase = {
        firestore: jest.fn(() => ({
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) }))
                })),
                get: jest.fn(() => Promise.resolve({ docs: [], empty: true, size: 0, forEach: jest.fn() })),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis()
            }))
        })),
        auth: jest.fn(() => ({
            currentUser: { uid: 'test-uid', displayName: 'Test', email: 'test@test.com', photoURL: null },
            onAuthStateChanged: jest.fn(cb => { cb({ uid: 'test-uid' }); return jest.fn(); })
        }))
    };

    window.SPANavigation = {
        registerViewCleanup: jest.fn(),
        navigateTo: jest.fn()
    };

    window.cacheManager = {
        getList: jest.fn(() => Promise.resolve(null)),
        setList: jest.fn(),
        defaultTTL: { mythologies: 3600000 }
    };

    window.scrollTo = jest.fn();
    window.requestAnimationFrame = jest.fn(cb => cb());
    global.requestAnimationFrame = jest.fn(cb => cb());

    jest.spyOn(document, 'dispatchEvent');

    const store = {};
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(key => store[key] || null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { store[key] = val; });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => { delete store[key]; });
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.innerHTML = '';
    // Clean up loaded globals
    delete window.MythologiesView;
    delete window.AboutPage;
    delete window.PrivacyPage;
    delete window.TermsPage;
    delete window.UserDashboardView;
    delete window.UserProfileView;
    delete window.CompareView;
    delete window.SearchViewComplete;
    delete window.UniversalDisplayRenderer;
});

// ============================================================
// Agent 5.2: MythologiesView
// ============================================================

describe('Agent 5.2 — MythologiesView', () => {
    let view;
    let container;

    beforeEach(() => {
        jest.resetModules();
        require('../../js/views/mythologies-view.js');
        view = new window.MythologiesView(window.firebase.firestore());
        container = createContainer();
    });

    afterEach(() => cleanupContainer(container));

    test('dispatches first-render-complete on success', async () => {
        jest.useRealTimers();
        view.loadMythologies = jest.fn(async () => {
            view.mythologies = [{ id: 'greek', name: 'Greek', order: 1, icon: '🏛️', description: '', color: '#fff' }];
        });
        let fired = false;
        document.addEventListener('first-render-complete', () => { fired = true; }, { once: true });
        await view.render(container);
        expect(fired).toBe(true);
    });

    test('dispatches first-render-complete on error', async () => {
        jest.useRealTimers();
        view.loadMythologies = jest.fn().mockRejectedValue(new Error('Network fail'));
        let fired = false;
        document.addEventListener('first-render-complete', () => { fired = true; }, { once: true });
        await view.render(container);
        expect(fired).toBe(true);
    });

    test('dispatches render-error on failure', async () => {
        jest.useRealTimers();
        view.loadMythologies = jest.fn().mockRejectedValue(new Error('Boom'));
        let fired = false;
        document.addEventListener('render-error', () => { fired = true; }, { once: true });
        await view.render(container);
        expect(fired).toBe(true);
    });

    test('uses fallback data when loadMythologies returns empty', async () => {
        jest.useRealTimers();
        // loadMythologies leaves this.mythologies as empty
        view.loadMythologies = jest.fn(async () => {
            view.mythologies = [];
        });
        await view.render(container);
        // Should fall back to getFallbackMythologies
        expect(view.mythologies.length).toBeGreaterThan(0);
    });

    test('showError includes retry and use-fallback buttons', () => {
        view._abortController = new AbortController();
        view.showError(container, new Error('test error'));
        expect(container.innerHTML).toContain('data-action="retry"');
        expect(container.innerHTML).toContain('data-action="use-fallback"');
    });

    test('removes has-skeleton class on error', () => {
        container.classList.add('has-skeleton');
        view._abortController = new AbortController();
        view.showError(container, new Error('test'));
        expect(container.classList.contains('has-skeleton')).toBe(false);
    });
});

// ============================================================
// Agent 5.8: Static Pages (AboutPage, PrivacyPage, TermsPage)
// ============================================================

describe('Agent 5.8 — AboutPage first-render-complete', () => {
    let container;

    beforeEach(() => {
        jest.resetModules();
        require('../../js/components/about-page.js');
        container = createContainer();
    });

    afterEach(() => cleanupContainer(container));

    test('dispatches first-render-complete on successful render', () => {
        const page = new window.AboutPage();
        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.view === 'about') fired = true;
        }, { once: true });
        page.render(container);
        expect(fired).toBe(true);
    });

    test('dispatches first-render-complete with view=about', () => {
        const page = new window.AboutPage();
        let detail = null;
        document.addEventListener('first-render-complete', (e) => { detail = e.detail; }, { once: true });
        page.render(container);
        expect(detail).not.toBeNull();
        expect(detail.view).toBe('about');
    });

    test('renders content without external dependencies', () => {
        const page = new window.AboutPage();
        // No external deps needed — should render fine
        page.render(container);
        expect(container.querySelector('h1')).not.toBeNull();
        expect(container.querySelector('.legal-page')).not.toBeNull();
    });
});

describe('Agent 5.8 — PrivacyPage first-render-complete', () => {
    let container;

    beforeEach(() => {
        jest.resetModules();
        require('../../js/components/privacy-page.js');
        container = createContainer();
    });

    afterEach(() => cleanupContainer(container));

    test('dispatches first-render-complete on successful render', () => {
        const page = new window.PrivacyPage();
        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.view === 'privacy') fired = true;
        }, { once: true });
        page.render(container);
        expect(fired).toBe(true);
    });

    test('dispatches first-render-complete with view=privacy', () => {
        const page = new window.PrivacyPage();
        let detail = null;
        document.addEventListener('first-render-complete', (e) => { detail = e.detail; }, { once: true });
        page.render(container);
        expect(detail).not.toBeNull();
        expect(detail.view).toBe('privacy');
    });
});

describe('Agent 5.8 — TermsPage first-render-complete', () => {
    let container;

    beforeEach(() => {
        jest.resetModules();
        require('../../js/components/terms-page.js');
        container = createContainer();
    });

    afterEach(() => cleanupContainer(container));

    test('dispatches first-render-complete on successful render', () => {
        const page = new window.TermsPage();
        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.view === 'terms') fired = true;
        }, { once: true });
        page.render(container);
        expect(fired).toBe(true);
    });

    test('dispatches first-render-complete with view=terms', () => {
        const page = new window.TermsPage();
        let detail = null;
        document.addEventListener('first-render-complete', (e) => { detail = e.detail; }, { once: true });
        page.render(container);
        expect(detail).not.toBeNull();
        expect(detail.view).toBe('terms');
    });
});

// ============================================================
// Agent 5.9: UniversalDisplayRenderer — renderSafe, isAvailable, isValidEntity
// ============================================================

describe('Agent 5.9 — UniversalDisplayRenderer safety methods', () => {
    let renderer;

    beforeEach(() => {
        jest.resetModules();
        require('../../js/components/universal-display-renderer.js');
        renderer = new window.UniversalDisplayRenderer();
    });

    test('isAvailable() returns true when registered on window', () => {
        expect(window.UniversalDisplayRenderer.isAvailable()).toBe(true);
    });

    test('isAvailable() returns false when not on window', () => {
        const OrigClass = window.UniversalDisplayRenderer;
        delete window.UniversalDisplayRenderer;
        expect(OrigClass.isAvailable()).toBe(false);
        window.UniversalDisplayRenderer = OrigClass;
    });

    test('isValidEntity() returns true for plain objects', () => {
        expect(window.UniversalDisplayRenderer.isValidEntity({ id: 'zeus', name: 'Zeus' })).toBe(true);
    });

    test('isValidEntity() returns false for null', () => {
        expect(window.UniversalDisplayRenderer.isValidEntity(null)).toBe(false);
    });

    test('isValidEntity() returns false for arrays', () => {
        expect(window.UniversalDisplayRenderer.isValidEntity([])).toBe(false);
    });

    test('isValidEntity() returns false for strings', () => {
        expect(window.UniversalDisplayRenderer.isValidEntity('zeus')).toBe(false);
    });

    test('renderSafe() returns HTML for valid entities', () => {
        const entities = [{ id: 'zeus', name: 'Zeus', mythology: 'greek', entityType: 'deity' }];
        const html = renderer.renderSafe(entities, 'grid');
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
    });

    test('renderSafe() returns fallback HTML on render error', () => {
        // Force renderGrid to throw
        renderer.renderGrid = jest.fn(() => { throw new Error('render crash'); });
        const entities = [{ id: 'zeus', name: 'Zeus', mythology: 'greek', entityType: 'deity' }];
        const html = renderer.renderSafe(entities, 'grid');
        expect(html).toContain('entity-render-error');
    });

    test('renderSafe() returns empty state for empty entities', () => {
        const html = renderer.renderSafe([], 'grid');
        expect(html).toContain('empty-state');
    });

    test('renderGrid() returns error HTML on internal error', () => {
        // Cause renderGridCard to throw by passing bad data
        renderer.renderGridCard = jest.fn(() => { throw new Error('card crash'); });
        const entities = [{ id: 'zeus', name: 'Zeus', mythology: 'greek' }];
        const html = renderer.renderGrid(entities);
        expect(html).toContain('entity-render-error');
    });

    test('renderList() returns error HTML on internal error', () => {
        renderer.renderListItem = jest.fn(() => { throw new Error('list crash'); });
        const entities = [{ id: 'zeus', name: 'Zeus', mythology: 'greek' }];
        const html = renderer.renderList(entities);
        expect(html).toContain('entity-render-error');
    });
});

// ============================================================
// Agent 5.6: SearchViewComplete — first-render-complete
// ============================================================

describe('Agent 5.6 — SearchViewComplete first-render-complete', () => {
    let container;

    beforeEach(() => {
        jest.resetModules();
        jest.useRealTimers();

        // Minimal mocks needed by SearchViewComplete constructor
        window.EnhancedCorpusSearch = undefined;
        window.CorpusSearch = undefined;

        require('../../js/components/search-view-complete.js');
        container = createContainer();
    });

    afterEach(() => {
        cleanupContainer(container);
        delete window.SearchViewComplete;
    });

    test('dispatches first-render-complete on successful render', async () => {
        const view = new window.SearchViewComplete(window.firebase.firestore());

        // Mock internal methods to avoid full init
        view.loadMythologies = jest.fn(async () => { view.mythologies = []; });
        view.getHTML = jest.fn(() => '<div class="search-view"><input id="search-input" /><div id="search-results"></div></div>');
        view.init = jest.fn(async () => {});

        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.view === 'search') fired = true;
        }, { once: true });

        await view.render(container);
        expect(fired).toBe(true);
    });

    test('dispatches first-render-complete on render error', async () => {
        const view = new window.SearchViewComplete(window.firebase.firestore());
        view.loadMythologies = jest.fn().mockRejectedValue(new Error('fail'));

        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.view === 'search') fired = true;
        }, { once: true });

        await view.render(container);
        expect(fired).toBe(true);
    });

    test('shows loading state while rendering', async () => {
        const view = new window.SearchViewComplete(window.firebase.firestore());
        let loadingVisible = false;

        // Capture innerHTML during loadMythologies
        view.loadMythologies = jest.fn(async () => {
            loadingVisible = container.innerHTML.includes('Loading search');
            view.mythologies = [];
        });
        view.getHTML = jest.fn(() => '<div></div>');
        view.init = jest.fn(async () => {});

        await view.render(container);
        expect(loadingVisible).toBe(true);
    });
});

// ============================================================
// Agent 5.7: CompareView — first-render-complete
// ============================================================

describe('Agent 5.7 — CompareView first-render-complete', () => {
    let container;

    beforeEach(() => {
        jest.resetModules();
        jest.useRealTimers();

        window.location.hash = '';

        require('../../js/components/compare-view.js');
        container = createContainer();
    });

    afterEach(() => {
        cleanupContainer(container);
        delete window.CompareView;
    });

    test('dispatches first-render-complete on successful render', async () => {
        const view = new window.CompareView(window.firebase.firestore());
        view.parseURLParams = jest.fn(async () => {});
        view.init = jest.fn(async () => {});
        view.getHTML = jest.fn(() => '<div class="compare-view"></div>');

        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.view === 'compare') fired = true;
        }, { once: true });

        await view.render(container);
        expect(fired).toBe(true);
    });

    test('dispatches first-render-complete on render error', async () => {
        const view = new window.CompareView(window.firebase.firestore());
        view.parseURLParams = jest.fn().mockRejectedValue(new Error('URL fail'));

        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.view === 'compare') fired = true;
        }, { once: true });

        await view.render(container);
        expect(fired).toBe(true);
    });

    test('shows error UI on render failure', async () => {
        const view = new window.CompareView(window.firebase.firestore());
        view.parseURLParams = jest.fn().mockRejectedValue(new Error('fail'));

        await view.render(container);
        expect(container.innerHTML).toContain('Failed to load Compare view');
    });

    test('shows loading state initially', async () => {
        const view = new window.CompareView(window.firebase.firestore());
        let loadingVisible = false;

        view.parseURLParams = jest.fn(async () => {
            loadingVisible = container.innerHTML.includes('Loading compare view');
        });
        view.init = jest.fn(async () => {});
        view.getHTML = jest.fn(() => '<div class="compare-view"></div>');

        await view.render(container);
        expect(loadingVisible).toBe(true);
    });
});

// ============================================================
// Agent 5.4: UserDashboardView — per-service error isolation
// ============================================================

describe('Agent 5.4 — UserDashboardView service isolation', () => {
    let container;

    beforeEach(() => {
        jest.resetModules();
        jest.useRealTimers();

        require('../../js/views/user-dashboard-view.js');
        container = createContainer();
    });

    afterEach(() => {
        cleanupContainer(container);
        delete window.UserDashboardView;
    });

    test('dispatches first-render-complete even when unauthenticated', async () => {
        // Override auth to return no user
        window.firebase.auth = jest.fn(() => ({
            currentUser: null,
            onAuthStateChanged: jest.fn()
        }));

        const view = new window.UserDashboardView();
        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.route === 'dashboard') fired = true;
        }, { once: true });

        await view.render(container);
        expect(fired).toBe(true);
    });

    test('init() continues when ReputationService fails', async () => {
        window.ReputationService = jest.fn(() => ({
            init: jest.fn().mockRejectedValue(new Error('Rep service down'))
        }));

        const view = new window.UserDashboardView();
        view._loadUserData = jest.fn(async () => {
            view.userData = { displayName: 'Test', reputation: { level: 1 }, badges: [], counts: {}, activity: [], favorites: {}, notifications: {} };
        });

        // Should not throw even though ReputationService fails
        await expect(view.init()).resolves.not.toThrow();
        expect(view.reputationService).toBeNull();
    });

    test('init() continues when FavoritesService is missing', async () => {
        delete window.FavoritesService;

        const view = new window.UserDashboardView();
        view._loadUserData = jest.fn(async () => {
            view.userData = { displayName: 'Test', reputation: { level: 1 }, badges: [], counts: {}, activity: [], favorites: {}, notifications: {} };
        });

        await expect(view.init()).resolves.not.toThrow();
        expect(view.favoritesService).toBeNull();
    });
});

// ============================================================
// Agent 5.5: UserProfileView — first-render-complete
// ============================================================

describe('Agent 5.5 — UserProfileView first-render-complete', () => {
    let container;

    beforeEach(() => {
        jest.resetModules();
        jest.useRealTimers();
        require('../../js/views/user-profile-view.js');
        container = createContainer();
    });

    afterEach(() => {
        cleanupContainer(container);
        delete window.UserProfileView;
    });

    test('dispatches first-render-complete on invalid userId', () => {
        const view = new window.UserProfileView();
        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.view === 'user-profile') fired = true;
        }, { once: true });
        view.render('', container);
        expect(fired).toBe(true);
    });

    test('dispatches first-render-complete on error', async () => {
        const view = new window.UserProfileView();
        view._initServices = jest.fn(async () => {});
        view._loadProfileData = jest.fn().mockRejectedValue(new Error('DB error'));

        let fired = false;
        document.addEventListener('first-render-complete', (e) => {
            if (e.detail && e.detail.view === 'user-profile') fired = true;
        }, { once: true });

        await view.render('user123', container);
        expect(fired).toBe(true);
    });

    test('shows error HTML when profile load fails', async () => {
        const view = new window.UserProfileView();
        view._initServices = jest.fn(async () => {});
        view._loadProfileData = jest.fn().mockRejectedValue(new Error('Not found'));

        await view.render('user123', container);
        expect(container.innerHTML).toContain('user-profile--error');
    });
});
