/**
 * Browse Category View - concurrent render ownership
 *
 * The router builds a new BrowseCategoryView for every navigation, and every
 * one of them renders into the same mount point after awaiting a network load.
 * Moving between two browse categories therefore leaves two renders in flight,
 * and without a guard the one that *resolves* last owns the page rather than
 * the one the visitor actually asked for. A slow load for the category they
 * left would repaint it over the category they are on -- header and grid
 * together, silently, with no error raised anywhere.
 *
 * These tests drive that race deterministically by holding each render's load
 * open and resolving them out of order.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const storageMock = () => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, val) => { store[key] = String(val); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
};
Object.defineProperty(window, 'localStorage', { value: storageMock() });
Object.defineProperty(window, 'sessionStorage', { value: storageMock() });

require('../../js/views/browse-category-view.js');

/** A promise whose settlement this test controls. */
function deferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

/**
 * A view whose load is held open, with everything after the load stubbed down
 * to the single DOM write whose ownership is under test.
 */
function viewFor(category) {
    const view = new window.BrowseCategoryView({});
    const load = deferred();

    view.loadEntities = jest.fn(() => load.promise);
    view.loadCategoryOverview = jest.fn(() => load.promise);
    view.getLoadingHTML = jest.fn(() => '<div class="loading-container">loading</div>');
    view.getBrowseHTML = jest.fn(() => `<div class="browse-view" data-category="${category}"></div>`);
    view.initContentFilter = jest.fn(() => Promise.resolve());
    view.attachEventListeners = jest.fn();
    view.applyFilters = jest.fn();
    view.updatePagination = jest.fn();
    view.updateLoadMoreButton = jest.fn();
    view.fillTopicStrip = jest.fn();
    view.showError = jest.fn((container) => {
        container.innerHTML = `<div class="error-state" data-category="${category}"></div>`;
    });

    return { view, load };
}

const renderedCategory = (container) =>
    container.querySelector('[data-category]')?.dataset.category ?? null;

describe('BrowseCategoryView concurrent renders', () => {
    let container;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<div id="main-content"></div>';
        container = document.getElementById('main-content');
        window.BrowseCategoryView._renderSeq = 0;
    });

    test('a render that resolves last does not repaint over a newer route', async () => {
        const first = viewFor('deities');
        const second = viewFor('creatures');

        const firstRender = first.view.render(container, { category: 'deities' });
        const secondRender = second.view.render(container, { category: 'creatures' });

        // The route the visitor is on settles first.
        second.load.resolve([]);
        await secondRender;
        expect(renderedCategory(container)).toBe('creatures');

        // The abandoned route settles afterwards. This is the regression: it
        // used to overwrite the page with deities.
        first.load.resolve([]);
        await firstRender;

        expect(renderedCategory(container)).toBe('creatures');
        expect(first.view.getBrowseHTML).not.toHaveBeenCalled();
    });

    test('a superseded render stops before its own side effects', async () => {
        const first = viewFor('deities');
        const second = viewFor('creatures');

        const firstRender = first.view.render(container, { category: 'deities' });
        const secondRender = second.view.render(container, { category: 'creatures' });

        second.load.resolve([]);
        await secondRender;
        first.load.resolve([]);
        await firstRender;

        // Nothing past the checkpoint runs for the abandoned render: no event
        // listeners bound to a grid that is not on the page, no filters applied.
        expect(first.view.attachEventListeners).not.toHaveBeenCalled();
        expect(first.view.applyFilters).not.toHaveBeenCalled();
        expect(first.view.initContentFilter).not.toHaveBeenCalled();

        // The current render is unaffected.
        expect(second.view.attachEventListeners).toHaveBeenCalled();
        expect(second.view.applyFilters).toHaveBeenCalled();
    });

    test('a superseded render does not replace the current page with its error', async () => {
        const first = viewFor('deities');
        const second = viewFor('creatures');

        const firstRender = first.view.render(container, { category: 'deities' });
        const secondRender = second.view.render(container, { category: 'creatures' });

        second.load.resolve([]);
        await secondRender;
        expect(renderedCategory(container)).toBe('creatures');

        // A timeout on the route the visitor already left must not turn the
        // route they are on into an error screen.
        first.load.reject(new Error('Loading timed out.'));
        await firstRender;

        expect(first.view.showError).not.toHaveBeenCalled();
        expect(renderedCategory(container)).toBe('creatures');
        expect(container.querySelector('.error-state')).toBeNull();
    });

    test('the newest render still owns the mount point', async () => {
        const only = viewFor('heroes');

        const render = only.view.render(container, { category: 'heroes' });
        only.load.resolve([]);
        await render;

        expect(renderedCategory(container)).toBe('heroes');
        expect(only.view.getBrowseHTML).toHaveBeenCalled();
        expect(only.view.attachEventListeners).toHaveBeenCalled();
    });

    test('the newest render still reports its own failure', async () => {
        const only = viewFor('heroes');

        const render = only.view.render(container, { category: 'heroes' });
        only.load.reject(new Error('Loading timed out.'));
        await render;

        expect(only.view.showError).toHaveBeenCalled();
        expect(container.querySelector('.error-state')).not.toBeNull();
    });

    test('each render claims a distinct sequence number', async () => {
        expect(window.BrowseCategoryView._renderSeq).toBe(0);

        const a = viewFor('deities');
        const b = viewFor('creatures');
        const c = viewFor('heroes');

        const renders = [
            a.view.render(container, { category: 'deities' }),
            b.view.render(container, { category: 'creatures' }),
            c.view.render(container, { category: 'heroes' })
        ];

        expect(window.BrowseCategoryView._renderSeq).toBe(3);

        c.load.resolve([]);
        a.load.resolve([]);
        b.load.resolve([]);
        await Promise.all(renders);

        // Only the last one to start wrote, whatever order they finished in.
        expect(renderedCategory(container)).toBe('heroes');
        expect(a.view.getBrowseHTML).not.toHaveBeenCalled();
        expect(b.view.getBrowseHTML).not.toHaveBeenCalled();
        expect(c.view.getBrowseHTML).toHaveBeenCalled();
    });
});
