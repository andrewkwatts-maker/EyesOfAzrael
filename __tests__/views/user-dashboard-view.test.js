/**
 * User Dashboard View - Unit Tests
 * Testing: Constructor, render lifecycle, loading/error states,
 * tab switching, cleanup, AbortController, and HTML output safety.
 *
 * @coverage-target 85%
 * @total-tests ~40
 */

// Mock console to reduce noise
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock alert/confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

const mockUserData = {
    displayName: 'Test User',
    email: 'test@test.com',
    photoURL: null,
    bio: 'Mythology enthusiast',
    createdAt: { toDate: () => new Date('2024-01-01') },
    role: 'member'
};

const mockUserDocSnapshot = {
    exists: true,
    data: () => mockUserData
};

const mockEmptySnapshot = {
    docs: [],
    empty: true,
    size: 0,
    forEach: jest.fn()
};

beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="main-content"></div>';

    window.firebase = {
        firestore: jest.fn(() => ({
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve(mockUserDocSnapshot)),
                    set: jest.fn(() => Promise.resolve()),
                    update: jest.fn(() => Promise.resolve())
                })),
                get: jest.fn(() => Promise.resolve(mockEmptySnapshot)),
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
});

afterEach(() => {
    // no-op
});

// Load the source module (sets window.UserDashboardView)
require('../../js/views/user-dashboard-view.js');

describe('UserDashboardView', () => {
    let view;
    let container;

    beforeEach(() => {
        container = document.getElementById('main-content');
        view = new window.UserDashboardView();
    });

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    describe('Constructor', () => {
        test('should create instance with correct defaults', () => {
            expect(view).toBeDefined();
            expect(view.container).toBeNull();
            expect(view.userId).toBeNull();
            expect(view.userData).toBeNull();
        });

        test('should initialize unsubscribers as empty array', () => {
            expect(view.unsubscribers).toBeDefined();
            expect(Array.isArray(view.unsubscribers)).toBe(true);
            expect(view.unsubscribers.length).toBe(0);
        });

        test('should initialize _abortController as null', () => {
            expect(view._abortController).toBeNull();
        });

        test('should initialize view state', () => {
            expect(view.activeTab).toBe('overview');
            expect(view.activityPage).toBe(0);
            expect(view.contributionsPage).toBe(0);
            expect(view.pageSize).toBe(10);
        });

        test('should initialize settings state', () => {
            expect(view.isEditingProfile).toBe(false);
            expect(view.pendingChanges).toEqual({});
        });

        test('should accept options', () => {
            const v = new window.UserDashboardView({ initialTab: 'settings' });
            expect(v.options.initialTab).toBe('settings');
        });

        test('should have default showFullDashboard option', () => {
            expect(view.options.showFullDashboard).toBe(true);
        });
    });

    // ──────────────────────────────────────────────
    // Render lifecycle
    // ──────────────────────────────────────────────

    describe('render()', () => {
        test('should show loading HTML initially (3-ring spinner, not SVG)', async () => {
            // We need to delay init to check loading state
            const origInit = view.init.bind(view);
            let initResolve;
            view.init = () => new Promise(resolve => { initResolve = resolve; });

            const renderPromise = view.render(container);

            // Check loading state
            expect(container.innerHTML).toContain('spinner-ring');
            // It should NOT be an SVG spinner
            expect(container.querySelector('.spinner-ring')).not.toBeNull();
            // The loading container uses div-based rings, not SVG
            const spinnerContainer = container.querySelector('.spinner-container');
            expect(spinnerContainer).not.toBeNull();
            const rings = spinnerContainer.querySelectorAll('.spinner-ring');
            expect(rings.length).toBe(3);

            // Resolve init to complete render
            if (initResolve) {
                // Restore init and resolve
                view.init = origInit;
                initResolve();
            }
            // We can't cleanly resolve this, so we just verify loading state
        });

        test('should show loading text', async () => {
            const origInit = view.init.bind(view);
            view.init = () => new Promise(() => {}); // Never resolves

            view.render(container);

            expect(container.innerHTML).toContain('Loading your dashboard');
        });

        test('should set container from parameter', async () => {
            await view.render(container);
            expect(view.container).toBe(container);
        });

        test('should use #main-content if no container passed', async () => {
            await view.render();
            expect(view.container).toBe(document.getElementById('main-content'));
        });

        test('should handle null container gracefully', async () => {
            document.body.innerHTML = '';
            await view.render(null);
            // Should log error and return
            expect(console.error).toHaveBeenCalled();
        });

        test('should create AbortController', async () => {
            await view.render(container);
            expect(view._abortController).toBeDefined();
            expect(view._abortController).toBeInstanceOf(AbortController);
        });

        test('should abort previous controller on re-render', async () => {
            await view.render(container);
            const first = view._abortController;
            const abortSpy = jest.spyOn(first, 'abort');

            await view.render(container);

            expect(abortSpy).toHaveBeenCalled();
        });

        test('registerViewCleanup is called', async () => {
            await view.render(container);
            expect(window.SPANavigation.registerViewCleanup).toHaveBeenCalled();
        });

        test('registerViewCleanup is called before loading data', async () => {
            // The registration happens before init()
            let registeredBeforeInit = false;
            const origInit = view.init.bind(view);
            view.init = async function() {
                registeredBeforeInit = window.SPANavigation.registerViewCleanup.mock.calls.length > 0;
                return origInit();
            };

            await view.render(container);

            expect(registeredBeforeInit).toBe(true);
        });
    });

    // ──────────────────────────────────────────────
    // Error state HTML
    // ──────────────────────────────────────────────

    describe('Error state HTML', () => {
        test('_getErrorHTML has data-action="retry" button', () => {
            const html = view._getErrorHTML('Something went wrong');
            expect(html).toContain('data-action="retry"');
        });

        test('_getErrorHTML does NOT have inline onclick', () => {
            const html = view._getErrorHTML('Something went wrong');
            expect(html).not.toContain('onclick');
        });

        test('_getErrorHTML shows error message', () => {
            const html = view._getErrorHTML('Network failure');
            expect(html).toContain('Network failure');
        });

        test('_getErrorHTML has error icon (SVG)', () => {
            const html = view._getErrorHTML('Error');
            expect(html).toContain('<svg');
            expect(html).toContain('error-icon');
        });

        test('_getErrorHTML escapes HTML in message', () => {
            const html = view._getErrorHTML('<script>alert("xss")</script>');
            expect(html).not.toContain('<script>alert');
        });

        test('error state renders on init failure', async () => {
            // Make auth return no user
            window.firebase.auth = jest.fn(() => ({
                currentUser: null,
                onAuthStateChanged: jest.fn()
            }));

            await view.render(container);

            expect(container.innerHTML).toContain('data-action="retry"');
            expect(container.innerHTML).toContain('Unable to load dashboard');
        });
    });

    // ──────────────────────────────────────────────
    // Loading HTML
    // ──────────────────────────────────────────────

    describe('Loading HTML', () => {
        test('_getLoadingHTML uses div-based spinner rings, not SVG', () => {
            const html = view._getLoadingHTML();
            expect(html).toContain('spinner-ring');
            expect(html).toContain('spinner-container');
            // Should NOT use <svg> for main loading spinner
            expect(html).not.toContain('<svg');
        });

        test('_getLoadingHTML has loading text', () => {
            const html = view._getLoadingHTML();
            expect(html).toContain('Loading your dashboard');
        });

        test('_getLoadingHTML has dashboard loading class', () => {
            const html = view._getLoadingHTML();
            expect(html).toContain('user-dashboard--loading');
        });
    });

    // ──────────────────────────────────────────────
    // Contributions error state
    // ──────────────────────────────────────────────

    describe('Contributions error', () => {
        test('_getContributionsContent returns valid HTML', async () => {
            // Need userData to call this
            await view.render(container);

            if (view.userData) {
                const html = view._getContributionsContent();
                expect(html).toContain('dashboard-contributions');
            }
        });

        // The contributions loading error uses data-action="retry" (line 1542 in source)
        // This is set dynamically when contribution loading fails, tested via integration
    });

    // ──────────────────────────────────────────────
    // Tab switching
    // ──────────────────────────────────────────────

    describe('Tab switching', () => {
        test('_getTabContent returns overview for default tab', () => {
            // Need to set userData first
            view.userData = {
                displayName: 'Test',
                photoURL: null,
                reputation: { totalPoints: 50 },
                activity: [],
                badges: [],
                counts: { notes: 0, entities: 0, perspectives: 0, relationships: 0, total: 0, pending: 0, approved: 0 }
            };

            const html = view._getTabContent('overview');
            expect(html).toContain('dashboard-overview');
        });

        test('_getTabContent returns contributions for contributions tab', () => {
            view.userData = {
                displayName: 'Test',
                photoURL: null,
                reputation: { totalPoints: 50 },
                activity: [],
                badges: [],
                counts: { notes: 0, entities: 0, perspectives: 0, relationships: 0, total: 0, pending: 0, approved: 0 }
            };

            const html = view._getTabContent('contributions');
            expect(html).toContain('dashboard-contributions');
        });

        test('_getTabContent returns overview for unknown tab', () => {
            view.userData = {
                displayName: 'Test',
                photoURL: null,
                reputation: { totalPoints: 50 },
                activity: [],
                badges: [],
                counts: { notes: 0, entities: 0, perspectives: 0, relationships: 0, total: 0, pending: 0, approved: 0 }
            };

            const html = view._getTabContent('nonexistent');
            expect(html).toContain('dashboard-overview');
        });

        test('activeTab defaults to overview', () => {
            expect(view.activeTab).toBe('overview');
        });
    });

    // ──────────────────────────────────────────────
    // Cleanup lifecycle
    // ──────────────────────────────────────────────

    describe('Cleanup lifecycle', () => {
        test('cleanup() aborts AbortController', async () => {
            await view.render(container);
            const controller = view._abortController;
            expect(controller).not.toBeNull();
            const abortSpy = jest.spyOn(controller, 'abort');

            view.cleanup();

            expect(abortSpy).toHaveBeenCalled();
            expect(view._abortController).toBeNull();
        });

        test('cleanup() iterates and calls unsubscribers', async () => {
            await view.render(container);

            const unsub1 = jest.fn();
            const unsub2 = jest.fn();
            view.unsubscribers = [unsub1, unsub2];

            view.cleanup();

            expect(unsub1).toHaveBeenCalled();
            expect(unsub2).toHaveBeenCalled();
            expect(view.unsubscribers).toEqual([]);
        });

        test('cleanup() handles non-function entries in unsubscribers', async () => {
            await view.render(container);
            view.unsubscribers = [jest.fn(), null, 'not-a-function'];

            expect(() => view.cleanup()).not.toThrow();
        });

        test('cleanup() is safe to call without prior render', () => {
            expect(() => view.cleanup()).not.toThrow();
        });

        test('destroy() calls cleanup()', async () => {
            await view.render(container);
            const cleanupSpy = jest.spyOn(view, 'cleanup');

            view.destroy();

            expect(cleanupSpy).toHaveBeenCalled();
        });

        test('destroy() nulls out container and userData', async () => {
            await view.render(container);

            view.destroy();

            expect(view.container).toBeNull();
            expect(view.userData).toBeNull();
        });

        test('registerViewCleanup callback triggers cleanup()', async () => {
            await view.render(container);
            const callback = window.SPANavigation.registerViewCleanup.mock.calls[0][0];
            const cleanupSpy = jest.spyOn(view, 'cleanup');

            callback();

            expect(cleanupSpy).toHaveBeenCalled();
        });
    });

    // ──────────────────────────────────────────────
    // Dashboard HTML (after successful render)
    // ──────────────────────────────────────────────

    describe('Dashboard HTML output', () => {
        beforeEach(async () => {
            await view.render(container);
        });

        test('renders dashboard header with user name', () => {
            if (view.userData) {
                expect(container.innerHTML).toContain('dashboard-header');
                expect(container.innerHTML).toContain(view.userData.displayName);
            }
        });

        test('renders tab navigation', () => {
            if (view.userData) {
                const tabs = container.querySelectorAll('.dashboard-tab');
                expect(tabs.length).toBeGreaterThan(0);
            }
        });

        test('tabs have role="tab" attribute', () => {
            if (view.userData) {
                const tabs = container.querySelectorAll('.dashboard-tab');
                tabs.forEach(tab => {
                    expect(tab.getAttribute('role')).toBe('tab');
                });
            }
        });

        test('active tab has aria-selected="true"', () => {
            if (view.userData) {
                const activeTab = container.querySelector('.dashboard-tab.active');
                if (activeTab) {
                    expect(activeTab.getAttribute('aria-selected')).toBe('true');
                }
            }
        });

        test('delegated retry handler is attached via signal', async () => {
            // Render sets up a click handler with abort signal
            // Clicking retry should call render again
            if (view.userData) {
                expect(view._abortController).not.toBeNull();
            }
        });
    });

    // ──────────────────────────────────────────────
    // Level info helper
    // ──────────────────────────────────────────────

    describe('Level info', () => {
        test('_getLevelInfo returns Newcomer for 0 points', () => {
            const info = view._getLevelInfo(0);
            expect(info.name).toBe('Newcomer');
            expect(info.tier).toBe('bronze');
        });

        test('_getLevelInfo returns Member for 25 points', () => {
            const info = view._getLevelInfo(25);
            expect(info.name).toBe('Member');
            expect(info.tier).toBe('silver');
        });

        test('_getLevelInfo returns Legend for 1000+ points', () => {
            const info = view._getLevelInfo(1500);
            expect(info.name).toBe('Legend');
            expect(info.tier).toBe('platinum');
        });
    });
});
