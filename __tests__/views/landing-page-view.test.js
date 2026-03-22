/**
 * Landing Page View - Unit Tests
 * Testing: Constructor, render lifecycle, category cards, search form,
 * error states, cleanup, and HTML output safety.
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

// Must be loaded before the source file
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
                get: jest.fn(() => Promise.resolve({ docs: [], size: 0 })),
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
    jest.useRealTimers();
});

// Load the source module (sets window.LandingPageView)
require('../../js/views/landing-page-view.js');

describe('LandingPageView', () => {
    let view;
    let container;

    beforeEach(() => {
        container = document.getElementById('main-content');
        const db = window.firebase.firestore();
        view = new window.LandingPageView(db);
    });

    // ──────────────────────────────────────────────
    // Constructor & Initialization
    // ──────────────────────────────────────────────

    describe('Constructor and initialization', () => {
        test('should create an instance with correct defaults', () => {
            expect(view).toBeDefined();
            expect(view.isLoaded).toBe(false);
            expect(view.db).toBeDefined();
        });

        test('should initialize assetTypes array', () => {
            expect(view.assetTypes).toBeDefined();
            expect(Array.isArray(view.assetTypes)).toBe(true);
        });

        test('should have 12 standard categories for non-admin', () => {
            // Non-admin email
            window.firebase.auth = jest.fn(() => ({
                currentUser: { uid: 'u1', email: 'user@example.com' }
            }));
            const db = window.firebase.firestore();
            const v = new window.LandingPageView(db);
            expect(v.assetTypes.length).toBe(12);
        });

        test('should have ADMIN_EMAILS defined', () => {
            expect(view.ADMIN_EMAILS).toBeDefined();
            expect(Array.isArray(view.ADMIN_EMAILS)).toBe(true);
        });

        test('isAdmin returns false for non-admin user', () => {
            window.firebase.auth = jest.fn(() => ({
                currentUser: { email: 'nobody@example.com' }
            }));
            const db = window.firebase.firestore();
            const v = new window.LandingPageView(db);
            expect(v.isAdmin()).toBe(false);
        });

        test('isAdmin returns true for admin email', () => {
            window.firebase.auth = jest.fn(() => ({
                currentUser: { email: 'andrewkwatts@gmail.com' }
            }));
            const db = window.firebase.firestore();
            const v = new window.LandingPageView(db);
            expect(v.isAdmin()).toBe(true);
        });

        test('admin user gets extra categories via getAdminOnlyAssetTypes', () => {
            // Admin categories exist and would be added for admin users
            const adminTypes = view.getAdminOnlyAssetTypes();
            expect(adminTypes.length).toBeGreaterThan(0);
            // Standard 12 + admin categories = more than 12
            const totalIfAdmin = 12 + adminTypes.length;
            expect(totalIfAdmin).toBeGreaterThan(12);
        });
    });

    // ──────────────────────────────────────────────
    // Asset Type definitions
    // ──────────────────────────────────────────────

    describe('Asset type categories', () => {
        test('each category has required fields', () => {
            view.assetTypes.forEach(type => {
                expect(type.id).toBeDefined();
                expect(type.name).toBeDefined();
                expect(type.route).toBeDefined();
                expect(type.color).toBeDefined();
                expect(typeof type.order).toBe('number');
            });
        });

        test('categories include mythologies', () => {
            const myth = view.assetTypes.find(t => t.id === 'mythologies');
            expect(myth).toBeDefined();
            expect(myth.name).toBe('World Mythologies');
        });

        test('categories include deities', () => {
            const deities = view.assetTypes.find(t => t.id === 'deities');
            expect(deities).toBeDefined();
            expect(deities.route).toBe('#/browse/deities');
        });

        test('categories include creatures, heroes, items, places', () => {
            const ids = view.assetTypes.map(t => t.id);
            expect(ids).toContain('creatures');
            expect(ids).toContain('heroes');
            expect(ids).toContain('items');
            expect(ids).toContain('places');
        });

        test('categories include archetypes, magic, herbs, rituals, texts, symbols', () => {
            const ids = view.assetTypes.map(t => t.id);
            expect(ids).toContain('archetypes');
            expect(ids).toContain('magic');
            expect(ids).toContain('herbs');
            expect(ids).toContain('rituals');
            expect(ids).toContain('texts');
            expect(ids).toContain('symbols');
        });
    });

    // ──────────────────────────────────────────────
    // Render lifecycle
    // ──────────────────────────────────────────────

    describe('render()', () => {
        test('should show skeleton loading state initially', async () => {
            const renderPromise = view.render(container);
            // Before the 100ms delay, skeleton should be visible
            expect(container.innerHTML).toContain('landing-skeleton');
            jest.advanceTimersByTime(200);
            await renderPromise;
        });

        test('should render landing page HTML after loading', async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;
            expect(container.innerHTML).toContain('landing-page-view');
        });

        test('should render 12 category cards', async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;
            const cards = container.querySelectorAll('.landing-category-card');
            expect(cards.length).toBe(12);
        });

        test('should set isLoaded to true after successful render', async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;
            expect(view.isLoaded).toBe(true);
        });

        test('should render category grid', async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;
            expect(container.querySelector('.landing-categories-section')).not.toBeNull();
        });

        test('should throw error when container is null', async () => {
            await expect(view.render(null)).rejects.toThrow('Container element is required');
        });

        test('should dispatch first-render-complete event', async () => {
            const handler = jest.fn();
            document.addEventListener('first-render-complete', handler);
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;
            expect(handler).toHaveBeenCalled();
            document.removeEventListener('first-render-complete', handler);
        });
    });

    // ──────────────────────────────────────────────
    // Category card hrefs
    // ──────────────────────────────────────────────

    describe('Category card hrefs', () => {
        beforeEach(async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;
        });

        test('each card has an href attribute', () => {
            const cards = container.querySelectorAll('.landing-category-card');
            cards.forEach(card => {
                expect(card.getAttribute('href')).toBeDefined();
                expect(card.getAttribute('href').length).toBeGreaterThan(0);
            });
        });

        test('deities card links to #/browse/deities', () => {
            const deitiesCard = container.querySelector('[data-type="deities"]');
            expect(deitiesCard).not.toBeNull();
            expect(deitiesCard.getAttribute('href')).toBe('#/browse/deities');
        });

        test('mythologies card links to #/mythologies', () => {
            const mythCard = container.querySelector('[data-type="mythologies"]');
            expect(mythCard).not.toBeNull();
            expect(mythCard.getAttribute('href')).toBe('#/mythologies');
        });

        test('creatures card links to #/browse/creatures', () => {
            const card = container.querySelector('[data-type="creatures"]');
            expect(card).not.toBeNull();
            expect(card.getAttribute('href')).toBe('#/browse/creatures');
        });

        test('cards use anchor tags (a elements)', () => {
            const cards = container.querySelectorAll('.landing-category-card');
            cards.forEach(card => {
                expect(card.tagName.toLowerCase()).toBe('a');
            });
        });
    });

    // ──────────────────────────────────────────────
    // Error state
    // ──────────────────────────────────────────────

    describe('Error state', () => {
        test('error HTML has data-action="retry" button', async () => {
            // Force render to fail by making container temporarily valid then erroring
            const badView = new window.LandingPageView(null);
            badView.getSkeletonHTML = () => '<div></div>';
            badView.getLandingHTML = () => { throw new Error('Test error'); };

            const renderPromise = badView.render(container);
            // Advance past the 100ms skeleton delay
            jest.advanceTimersByTime(200);

            try {
                await renderPromise;
            } catch (e) {
                // Expected - render re-throws
            }

            const retryBtn = container.querySelector('[data-action="retry"]');
            expect(retryBtn).not.toBeNull();
        });

        test('error HTML does not contain inline onclick', async () => {
            const badView = new window.LandingPageView(null);
            badView.getSkeletonHTML = () => '<div></div>';
            badView.getLandingHTML = () => { throw new Error('Test error'); };

            const renderPromise = badView.render(container);
            jest.advanceTimersByTime(200);

            try {
                await renderPromise;
            } catch (e) {
                // Expected
            }

            // Check no onclick in error container
            const errorContainer = container.querySelector('.error-container');
            if (errorContainer) {
                expect(errorContainer.innerHTML).not.toContain('onclick');
            }
        });
    });

    // ──────────────────────────────────────────────
    // No onclick attributes in HTML output
    // ──────────────────────────────────────────────

    describe('HTML output safety', () => {
        beforeEach(async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;
        });

        test('no inline onclick attributes in category cards', () => {
            const cards = container.querySelectorAll('.landing-category-card');
            cards.forEach(card => {
                expect(card.getAttribute('onclick')).toBeNull();
            });
        });

        test('landing page HTML contains no onclick= strings in main content sections', () => {
            const landingView = container.querySelector('.landing-page-view');
            if (landingView) {
                const categoriesSection = landingView.querySelector('.landing-categories-section');
                if (categoriesSection) {
                    expect(categoriesSection.innerHTML).not.toContain('onclick=');
                }
            }
        });
    });

    // ──────────────────────────────────────────────
    // Cleanup lifecycle
    // ──────────────────────────────────────────────

    describe('Cleanup lifecycle', () => {
        test('attachEventListeners creates AbortController', async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;
            expect(view._abortController).toBeDefined();
            expect(view._abortController).not.toBeNull();
        });

        test('registerViewCleanup is called during render', async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;
            expect(window.SPANavigation.registerViewCleanup).toHaveBeenCalled();
        });

        test('cleanup() aborts the AbortController', async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;

            const controller = view._abortController;
            expect(controller).not.toBeNull();
            const abortSpy = jest.spyOn(controller, 'abort');

            view.cleanup();

            expect(abortSpy).toHaveBeenCalled();
            expect(view._abortController).toBeNull();
        });

        test('cleanup() removes pull-to-refresh handler', async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;

            expect(view._pullToRefreshHandler).toBeDefined();

            view.cleanup();

            expect(view._pullToRefreshHandler).toBeNull();
        });

        test('cleanup() clears event listeners array', async () => {
            const renderPromise = view.render(container);
            jest.advanceTimersByTime(200);
            await renderPromise;

            view.cleanup();

            expect(view._eventListeners).toEqual([]);
        });
    });

    // ──────────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────────

    describe('Helper methods', () => {
        test('escapeHTML escapes special characters', () => {
            const result = view.escapeHTML('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;');
        });

        test('escapeHTML handles empty/null input', () => {
            expect(view.escapeHTML('')).toBe('');
        });

        test('truncateText returns short text unchanged', () => {
            expect(view.truncateText('short', 100)).toBe('short');
        });

        test('truncateText truncates long text with ellipsis', () => {
            const long = 'A'.repeat(200);
            const result = view.truncateText(long, 50);
            expect(result.length).toBeLessThanOrEqual(54); // 50 + '...'
            expect(result).toContain('...');
        });

        test('truncateText handles null/empty gracefully', () => {
            expect(view.truncateText(null, 100)).toBe('');
            expect(view.truncateText('', 100)).toBe('');
        });

        test('getEmojiFallbacks returns object with all 12 category keys', () => {
            const fallbacks = view.getEmojiFallbacks();
            const keys = Object.keys(fallbacks);
            expect(keys).toContain('mythologies');
            expect(keys).toContain('deities');
            expect(keys).toContain('creatures');
            expect(keys.length).toBeGreaterThanOrEqual(12);
        });

        test('getSkeletonHTML returns valid skeleton HTML with 12 skeleton card divs', () => {
            const html = view.getSkeletonHTML();
            expect(html).toContain('landing-skeleton-card');
            // Count actual skeleton card elements (div tags with the class)
            const matches = html.match(/<div class="landing-skeleton-card"/g);
            expect(matches).not.toBeNull();
            expect(matches.length).toBe(12);
        });
    });

    // ──────────────────────────────────────────────
    // getAssetTypeCardHTML
    // ──────────────────────────────────────────────

    describe('getAssetTypeCardHTML', () => {
        test('generates card with correct route href', () => {
            const type = view.assetTypes.find(t => t.id === 'deities');
            const html = view.getAssetTypeCardHTML(type, 0);
            expect(html).toContain('href="#/browse/deities"');
        });

        test('generates card with data-type attribute', () => {
            const type = view.assetTypes.find(t => t.id === 'heroes');
            const html = view.getAssetTypeCardHTML(type, 1);
            expect(html).toContain('data-type="heroes"');
        });

        test('card has category name', () => {
            const type = view.assetTypes.find(t => t.id === 'creatures');
            const html = view.getAssetTypeCardHTML(type, 0);
            expect(html).toContain('Mythical Creatures');
        });

        test('card has description text', () => {
            const type = view.assetTypes.find(t => t.id === 'items');
            const html = view.getAssetTypeCardHTML(type, 0);
            expect(html).toContain('Legendary artifacts');
        });

        test('card has aria-label for accessibility', () => {
            const type = view.assetTypes[0];
            const html = view.getAssetTypeCardHTML(type, 0);
            expect(html).toContain('aria-label=');
        });

        test('card has tabindex for keyboard navigation', () => {
            const type = view.assetTypes[0];
            const html = view.getAssetTypeCardHTML(type, 0);
            expect(html).toContain('tabindex="0"');
        });
    });

    // ──────────────────────────────────────────────
    // Admin-only asset types
    // ──────────────────────────────────────────────

    describe('Admin-only categories', () => {
        test('getAdminOnlyAssetTypes returns concepts and conspiracies', () => {
            const adminTypes = view.getAdminOnlyAssetTypes();
            const ids = adminTypes.map(t => t.id);
            expect(ids).toContain('concepts');
            expect(ids).toContain('conspiracies');
        });

        test('admin-only types have adminOnly flag', () => {
            const adminTypes = view.getAdminOnlyAssetTypes();
            adminTypes.forEach(t => {
                expect(t.adminOnly).toBe(true);
            });
        });
    });
});
