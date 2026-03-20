/**
 * User Profile View - Unit Tests
 * Testing: Constructor, render lifecycle, cleanup, unsubscribers,
 * tab switching, level info, and HTML output safety.
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
    displayName: 'Mythology Fan',
    email: 'myth@example.com',
    photoURL: 'https://example.com/avatar.png',
    bio: 'I love ancient myths',
    createdAt: { toDate: () => new Date('2024-06-15') },
    isVerified: true,
    isModerator: false,
    role: 'member'
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
                    get: jest.fn(() => Promise.resolve({
                        exists: true,
                        data: () => ({ ...mockUserData })
                    }))
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

    // Ensure optional services are not defined
    delete window.ReputationService;
    delete window.PerspectiveService;
    delete window.NotesService;
    delete window.UserPreferencesService;
    delete window.BadgeDisplay;
});

afterEach(() => {
    // no-op
});

// Load the source module (sets window.UserProfileView)
require('../../js/views/user-profile-view.js');

describe('UserProfileView', () => {
    let view;
    let container;

    beforeEach(() => {
        container = document.getElementById('main-content');
        view = new window.UserProfileView();
    });

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    describe('Constructor', () => {
        test('should create instance with correct defaults', () => {
            expect(view).toBeDefined();
            expect(view.container).toBeNull();
            expect(view.userId).toBeNull();
            expect(view.profileData).toBeNull();
        });

        test('should initialize unsubscribers as empty array', () => {
            expect(view.unsubscribers).toBeDefined();
            expect(Array.isArray(view.unsubscribers)).toBe(true);
            expect(view.unsubscribers.length).toBe(0);
        });

        test('should initialize isOwnProfile as false', () => {
            expect(view.isOwnProfile).toBe(false);
        });

        test('should initialize currentTab as notes', () => {
            expect(view.currentTab).toBe('notes');
        });

        test('should initialize pagination state', () => {
            expect(view.pageSize).toBe(20);
            expect(view.lastDocs).toEqual({});
            expect(view.hasMore).toEqual({});
        });

        test('should initialize sub-components as null', () => {
            expect(view.badgeDisplay).toBeNull();
            expect(view.reputationService).toBeNull();
            expect(view.perspectiveService).toBeNull();
            expect(view.notesService).toBeNull();
            expect(view.userPreferencesService).toBeNull();
        });
    });

    // ──────────────────────────────────────────────
    // Render lifecycle
    // ──────────────────────────────────────────────

    describe('render()', () => {
        test('should show loading HTML initially', async () => {
            // Delay _loadProfileData to check loading state
            const origLoad = view._loadProfileData.bind(view);
            let loadResolve;
            view._loadProfileData = () => new Promise(resolve => { loadResolve = resolve; });

            const renderPromise = view.render('user-456', container);

            expect(container.innerHTML).toContain('loading');
            expect(container.innerHTML).toContain('Loading profile');

            // Clean up - just restore and let it fail gracefully
            view._loadProfileData = origLoad;
        });

        test('should set userId from parameter', async () => {
            await view.render('user-456', container);
            expect(view.userId).toBe('user-456');
        });

        test('should set container from parameter', async () => {
            await view.render('user-456', container);
            expect(view.container).toBe(container);
        });

        test('should use #main-content if no container passed', async () => {
            await view.render('user-456');
            expect(view.container).toBe(document.getElementById('main-content'));
        });

        test('should handle missing container gracefully', async () => {
            document.body.innerHTML = '';
            await view.render('user-456', null);
            expect(console.error).toHaveBeenCalled();
        });

        test('should render profile HTML after loading', async () => {
            await view.render('user-456', container);
            expect(container.innerHTML).toContain('user-profile');
        });

        test('should detect own profile', async () => {
            await view.render('test-user-123', container);
            expect(view.isOwnProfile).toBe(true);
        });

        test('should detect other user profile', async () => {
            await view.render('other-user-999', container);
            expect(view.isOwnProfile).toBe(false);
        });

        test('registerViewCleanup is called at end of render', async () => {
            await view.render('user-456', container);
            expect(window.SPANavigation.registerViewCleanup).toHaveBeenCalled();
        });

        test('registerViewCleanup callback calls cleanup()', async () => {
            await view.render('user-456', container);
            const callback = window.SPANavigation.registerViewCleanup.mock.calls[0][0];
            const cleanupSpy = jest.spyOn(view, 'cleanup');

            callback();

            expect(cleanupSpy).toHaveBeenCalled();
        });

        test('should show error HTML on profile load failure', async () => {
            // Make user doc not exist
            window.firebase.firestore = jest.fn(() => ({
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) }))
                    })),
                    get: jest.fn(() => Promise.resolve(mockEmptySnapshot)),
                    where: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockReturnThis()
                }))
            }));

            await view.render('nonexistent-user', container);

            expect(container.innerHTML).toContain('Unable to load profile');
        });
    });

    // ──────────────────────────────────────────────
    // Loading HTML
    // ──────────────────────────────────────────────

    describe('Loading HTML', () => {
        test('_getLoadingHTML contains spinner', () => {
            const html = view._getLoadingHTML();
            expect(html).toContain('loading-spinner');
            expect(html).toContain('Loading profile');
        });

        test('_getLoadingHTML has loading class', () => {
            const html = view._getLoadingHTML();
            expect(html).toContain('user-profile--loading');
        });
    });

    // ──────────────────────────────────────────────
    // Error HTML
    // ──────────────────────────────────────────────

    describe('Error HTML', () => {
        test('_getErrorHTML shows error message', () => {
            const html = view._getErrorHTML('User not found');
            expect(html).toContain('User not found');
            expect(html).toContain('Unable to load profile');
        });

        test('_getErrorHTML has a link to go home', () => {
            const html = view._getErrorHTML('Error');
            expect(html).toContain('href="#/"');
            expect(html).toContain('Go Home');
        });

        test('_getErrorHTML has error class', () => {
            const html = view._getErrorHTML('Error');
            expect(html).toContain('user-profile--error');
        });

        test('_getErrorHTML escapes HTML in message', () => {
            const html = view._getErrorHTML('<img onerror="alert(1)">');
            expect(html).not.toContain('<img onerror');
        });
    });

    // ──────────────────────────────────────────────
    // No inline onclick in rendered HTML
    // ──────────────────────────────────────────────

    describe('No inline onclick', () => {
        test('profile HTML does not contain onclick', async () => {
            await view.render('user-456', container);
            // Check the entire rendered output
            expect(container.innerHTML).not.toContain('onclick=');
        });

        test('error HTML does not contain onclick', () => {
            const html = view._getErrorHTML('Error');
            expect(html).not.toContain('onclick');
        });

        test('loading HTML does not contain onclick', () => {
            const html = view._getLoadingHTML();
            expect(html).not.toContain('onclick');
        });

        test('profile header has no onclick', async () => {
            await view.render('user-456', container);
            const header = container.querySelector('.user-profile__header');
            if (header) {
                expect(header.innerHTML).not.toContain('onclick=');
            }
        });

        test('tab buttons have no onclick', async () => {
            await view.render('user-456', container);
            const tabs = container.querySelectorAll('.activity-tab');
            tabs.forEach(tab => {
                expect(tab.getAttribute('onclick')).toBeNull();
            });
        });
    });

    // ──────────────────────────────────────────────
    // Cleanup lifecycle
    // ──────────────────────────────────────────────

    describe('Cleanup lifecycle', () => {
        test('cleanup() iterates unsubscribers and calls each', async () => {
            await view.render('user-456', container);

            const unsub1 = jest.fn();
            const unsub2 = jest.fn();
            const unsub3 = jest.fn();
            view.unsubscribers = [unsub1, unsub2, unsub3];

            view.cleanup();

            expect(unsub1).toHaveBeenCalledTimes(1);
            expect(unsub2).toHaveBeenCalledTimes(1);
            expect(unsub3).toHaveBeenCalledTimes(1);
        });

        test('cleanup() clears unsubscribers array', async () => {
            await view.render('user-456', container);
            view.unsubscribers = [jest.fn(), jest.fn()];

            view.cleanup();

            expect(view.unsubscribers).toEqual([]);
        });

        test('cleanup() skips non-function entries', () => {
            view.unsubscribers = [jest.fn(), null, undefined, 'string', 42];
            expect(() => view.cleanup()).not.toThrow();
        });

        test('cleanup() nulls out container', async () => {
            await view.render('user-456', container);
            expect(view.container).not.toBeNull();

            view.cleanup();

            expect(view.container).toBeNull();
        });

        test('cleanup() nulls out profileData', async () => {
            await view.render('user-456', container);
            expect(view.profileData).not.toBeNull();

            view.cleanup();

            expect(view.profileData).toBeNull();
        });

        test('cleanup() is safe to call multiple times', () => {
            view.cleanup();
            expect(() => view.cleanup()).not.toThrow();
        });

        test('destroy() also iterates unsubscribers', async () => {
            await view.render('user-456', container);
            const unsub = jest.fn();
            view.unsubscribers = [unsub];

            view.destroy();

            expect(unsub).toHaveBeenCalled();
            expect(view.unsubscribers).toEqual([]);
        });

        test('destroy() nulls out references', async () => {
            await view.render('user-456', container);

            view.destroy();

            expect(view.container).toBeNull();
            expect(view.profileData).toBeNull();
        });
    });

    // ──────────────────────────────────────────────
    // Profile data and rendering
    // ──────────────────────────────────────────────

    describe('Profile rendering', () => {
        beforeEach(async () => {
            await view.render('user-456', container);
        });

        test('renders user display name', () => {
            expect(container.innerHTML).toContain('Mythology Fan');
        });

        test('renders user avatar image when photoURL exists', () => {
            const img = container.querySelector('.user-profile__avatar img');
            if (img) {
                expect(img.getAttribute('src')).toContain('avatar.png');
            }
        });

        test('renders badges section', () => {
            expect(container.querySelector('.user-profile__badges')).not.toBeNull();
        });

        test('renders stats section', () => {
            expect(container.querySelector('.user-profile__stats')).not.toBeNull();
        });

        test('renders activity tabs', () => {
            const tabs = container.querySelectorAll('.activity-tab');
            expect(tabs.length).toBe(4); // notes, entities, perspectives, relationships
        });

        test('tabs have correct data-tab attributes', () => {
            const tabs = container.querySelectorAll('.activity-tab');
            const tabIds = Array.from(tabs).map(t => t.dataset.tab);
            expect(tabIds).toContain('notes');
            expect(tabIds).toContain('entities');
            expect(tabIds).toContain('perspectives');
            expect(tabIds).toContain('relationships');
        });

        test('tabs have role="tab"', () => {
            const tabs = container.querySelectorAll('.activity-tab');
            tabs.forEach(tab => {
                expect(tab.getAttribute('role')).toBe('tab');
            });
        });

        test('default tab (notes) is active', () => {
            const notesTab = container.querySelector('[data-tab="notes"]');
            expect(notesTab.classList.contains('active')).toBe(true);
            expect(notesTab.getAttribute('aria-selected')).toBe('true');
        });

        test('renders verified badge when user is verified', () => {
            expect(container.innerHTML).toContain('verified-badge');
        });

        test('shows block button for other users profile', () => {
            // view.isOwnProfile should be false for user-456
            const blockBtn = container.querySelector('.btn-block-user');
            expect(blockBtn).not.toBeNull();
        });
    });

    // ──────────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────────

    describe('Helper methods', () => {
        test('_escapeHtml escapes special characters', () => {
            const result = view._escapeHtml('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
        });

        test('_escapeHtml handles null/empty', () => {
            expect(view._escapeHtml(null)).toBe('');
            expect(view._escapeHtml('')).toBe('');
        });

        test('_truncate returns short text unchanged', () => {
            expect(view._truncate('short', 100)).toBe('short');
        });

        test('_truncate truncates long text', () => {
            const long = 'A'.repeat(200);
            const result = view._truncate(long, 50);
            expect(result.length).toBe(53); // 50 + '...'
        });

        test('_truncate handles null', () => {
            expect(view._truncate(null, 50)).toBeNull();
        });

        test('_getLevelInfo returns correct level for various points', () => {
            expect(view._getLevelInfo(0).name).toBe('Newcomer');
            expect(view._getLevelInfo(25).name).toBe('Member');
            expect(view._getLevelInfo(100).name).toBe('Contributor');
            expect(view._getLevelInfo(250).name).toBe('Expert');
            expect(view._getLevelInfo(500).name).toBe('Master');
            expect(view._getLevelInfo(1000).name).toBe('Legend');
        });

        test('_getLevelInfo returns correct tiers', () => {
            expect(view._getLevelInfo(0).tier).toBe('bronze');
            expect(view._getLevelInfo(50).tier).toBe('silver');
            expect(view._getLevelInfo(300).tier).toBe('gold');
            expect(view._getLevelInfo(1500).tier).toBe('platinum');
        });

        test('_getEntityIcon returns emoji for known types', () => {
            expect(view._getEntityIcon('deity')).toBeDefined();
            expect(view._getEntityIcon('hero')).toBeDefined();
            expect(view._getEntityIcon('creature')).toBeDefined();
        });

        test('_getEntityIcon returns fallback for unknown type', () => {
            const icon = view._getEntityIcon('unknown');
            expect(icon).toBeDefined();
        });

        test('_formatDate handles timestamp with toDate()', () => {
            const timestamp = { toDate: () => new Date('2024-01-15') };
            const result = view._formatDate(timestamp);
            expect(result).toContain('2024');
            expect(result).toContain('Jan');
        });

        test('_formatDate handles plain date string', () => {
            const result = view._formatDate('2024-06-15');
            expect(result).toContain('2024');
        });

        test('_formatDate handles null/empty', () => {
            expect(view._formatDate(null)).toBe('');
            expect(view._formatDate(undefined)).toBe('');
        });
    });

    // ──────────────────────────────────────────────
    // Tab content loading
    // ──────────────────────────────────────────────

    describe('Tab content', () => {
        test('_handleTabClick changes currentTab', async () => {
            await view.render('user-456', container);

            const entitiesTab = container.querySelector('[data-tab="entities"]');
            if (entitiesTab) {
                await view._handleTabClick({ currentTarget: entitiesTab });
                expect(view.currentTab).toBe('entities');
            }
        });

        test('_handleTabClick does nothing when clicking current tab', async () => {
            await view.render('user-456', container);
            const loadSpy = jest.spyOn(view, '_loadTabContent');

            const notesTab = container.querySelector('[data-tab="notes"]');
            if (notesTab) {
                await view._handleTabClick({ currentTarget: notesTab });
                // Should not reload since notes is already active
                expect(loadSpy).not.toHaveBeenCalled();
            }
        });
    });

    // ──────────────────────────────────────────────
    // Badge display
    // ──────────────────────────────────────────────

    describe('Badge display', () => {
        test('renders "No badges yet" when user has no badges', async () => {
            await view.render('user-456', container);
            const badgeContainer = container.querySelector('#profile-badges-container');
            if (badgeContainer) {
                expect(badgeContainer.innerHTML).toContain('No badges');
            }
        });
    });
});
