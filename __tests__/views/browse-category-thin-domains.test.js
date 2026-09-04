/**
 * BrowseCategoryView — thin datasets, and reaching every result
 *
 * Two unrelated defects share this file because both are about a browse grid
 * showing a reader less than the dataset holds.
 *
 * **Thin datasets.** The grid, its filters and its counts were designed against
 * mythology's 12,672 entities. History has 126 across seven collections and
 * conspiracy 80 across six, so a page there routinely holds a dozen cards in a
 * layout built for hundreds. That is not a fault, but it reads as one, and an
 * interface that looks broken gets treated as broken. The fixes here are about
 * telling the truth about a young collection rather than dressing it up — no
 * invented entries, no inflated counts.
 *
 * **Reachability.** Lists longer than 100 entities took a "virtual scrolling"
 * branch that could never advance, while the same threshold hid the Load More
 * button and cleared the pagination controls. The result was that a large
 * collection rendered its first page and offered no route to the second. These
 * tests pin the paging model so that cannot come back.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, val) => { store[key] = String(val); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

window.DOMAINS = require('../../js/config/domains.js');
require('../../js/views/browse-category-view.js');

const BrowseCategoryView = window.BrowseCategoryView;

/** A view pointed at a collection and preloaded with `count` entities. */
function viewFor(category, count = 0) {
    const view = new BrowseCategoryView(null);
    view.category = category;
    view.entities = Array.from({ length: count }, (_, i) => ({
        id: `e${i}`,
        name: `Entity ${i}`,
        description: 'A description.',
        isStandard: true,
    }));
    view.filteredEntities = [...view.entities];
    view.groupedEntities = view.groupByMythology(view.entities);
    view.availableDomains = view.availableDomains || new Set();
    return view;
}

describe('BrowseCategoryView on thin datasets', () => {
    describe('collectionDensity', () => {
        test('names the three states', () => {
            expect(viewFor('hist_wars', 0).collectionDensity()).toBe('empty');
            expect(viewFor('hist_wars', 12).collectionDensity()).toBe('early');
            expect(viewFor('deities', 400).collectionDensity()).toBe('populated');
        });

        test('the boundary is the declared threshold, not a magic number', () => {
            const t = BrowseCategoryView.EARLY_COLLECTION_THRESHOLD;
            expect(viewFor('hist_wars', t - 1).collectionDensity()).toBe('early');
            expect(viewFor('hist_wars', t).collectionDensity()).toBe('populated');
        });
    });

    describe('the early-collection notice', () => {
        test('appears on a thin collection and states the real count', () => {
            const html = viewFor('hist_wars', 9).getEarlyCollectionNoticeHTML();

            expect(html).toContain('browse-early-notice');
            expect(html).toContain('still early');
            // The true number, not a rounded or inflated one.
            expect(html).toContain('9 entries');
        });

        test('reads as early rather than as an outage', () => {
            const html = viewFor('con_documents', 5).getEarlyCollectionNoticeHTML();

            expect(html).toMatch(/not much of it yet/i);
            // No apology, no error vocabulary, no promise of content that does
            // not exist.
            expect(html).not.toMatch(/error|unavailable|failed|coming soon/i);
        });

        test('does not leak the collection prefix into prose', () => {
            const html = viewFor('hist_wars', 9).getEarlyCollectionNoticeHTML();

            expect(html).not.toContain('hist_wars');
            expect(html).toContain('history wars');
        });

        test('handles the singular', () => {
            expect(viewFor('hist_periods', 1).getEarlyCollectionNoticeHTML())
                .toContain('just one entry');
        });

        test('is absent on a populated collection', () => {
            expect(viewFor('deities', 900).getEarlyCollectionNoticeHTML()).toBe('');
        });

        test('is absent on an empty one, where the empty state speaks instead', () => {
            expect(viewFor('hist_wars', 0).getEarlyCollectionNoticeHTML()).toBe('');
        });

        test('is suppressed while a filter is active', () => {
            // A short list under an active filter is the filter working, not a
            // young dataset — saying "still early" there would be wrong.
            const view = viewFor('hist_figures', 8);
            view.searchTerm = 'cicero';
            expect(view.getEarlyCollectionNoticeHTML()).toBe('');
        });
    });

    describe('facet filters', () => {
        test('a facet with one value offers no filter at all', () => {
            // Every entity sharing one era means the chip filters nothing away.
            // One option is not a filter.
            const view = viewFor('hist_wars', 10);
            view.entities.forEach(e => { e.era = 'classical'; });
            view.groupedEntities = view.groupByMythology(view.entities);

            const html = view.getQuickFiltersHTML();
            expect(html).not.toContain('mythology-filter-heading');
        });

        test('two or more values do offer one', () => {
            const view = viewFor('hist_wars', 10);
            view.entities.forEach((e, i) => { e.era = i % 2 ? 'classical' : 'modern'; });
            view.groupedEntities = view.groupByMythology(view.entities);

            const html = view.getQuickFiltersHTML();
            expect(html).toContain('mythology-filter-heading');
            expect(html).toContain('Quick Filter by Era');
        });

        test('only facets that actually have results are offered', () => {
            // Chips are built from the loaded entities, so a zero-result facet
            // is unrepresentable rather than merely unlikely.
            const view = viewFor('hist_figures', 6);
            view.entities.forEach((e, i) => { e.era = i < 4 ? 'classical' : 'modern'; });
            view.groupedEntities = view.groupByMythology(view.entities);

            const html = view.getQuickFiltersHTML();
            expect(html).toContain('data-filter-value="classical"');
            expect(html).toContain('data-filter-value="modern"');
            expect(html).not.toContain('data-filter-value="renaissance"');
        });
    });

    describe('counts and headings', () => {
        test('the hero stat is labelled in prose, not by raw collection name', () => {
            const view = viewFor('hist_wars', 9);
            view.availableDomains = new Set();
            const html = view.getHeaderHTML({ name: 'Wars', icon: '⚔️' });

            expect(html).toContain('history wars');
            expect(html).not.toContain('>hist_wars<');
        });
    });

    describe('the empty state', () => {
        test('reads as unwritten rather than as broken', () => {
            const view = viewFor('con_documents', 0);
            const html = view.getEmptyStateHTML();

            expect(html).toMatch(/empty so far/i);
            // "Check back later" implies something is expected to arrive and
            // reads as an outage; it was the old copy.
            expect(html).not.toMatch(/check back later/i);
        });

        test('does not leak the collection prefix', () => {
            const html = viewFor('con_documents', 0).getEmptyStateHTML();
            expect(html).not.toContain('con_documents');
            expect(html).toContain('conspiracy documents');
        });
    });
});

describe('BrowseCategoryView paging reaches every result', () => {
    // The grid appends an "Add new" card whose visibility depends on auth.
    // Signed out is the state that matters here.
    beforeAll(() => {
        global.firebase = {
            auth: () => ({ currentUser: null, onAuthStateChanged: () => {} }),
        };
    });
    afterAll(() => { delete global.firebase; });

    /** A view with a live grid element in the document. */
    function gridViewFor(count) {
        const view = viewFor('deities', count);
        document.body.innerHTML = `
            <div class="entity-container" id="entityContainer">
                <div class="entity-grid" id="entityGrid"></div>
            </div>
            <div class="load-more-container" id="loadMoreContainer">
                <div id="loadMoreSpinner"></div>
                <button id="loadMoreBtn"></button>
            </div>
        `;
        view.updatePagination = () => {};
        view.updateResultsInfo = () => {};
        return view;
    }

    afterEach(() => { document.body.innerHTML = ''; });

    test('a list over 100 still offers a way forward', () => {
        // The regression: `> 100` handed the list to a virtual-scrolling branch
        // that never advanced, and hid Load More at the same time, so entity
        // 25 of 500 was unreachable by any route.
        const view = gridViewFor(500);
        view.currentPage = 1;
        view.updateGrid();

        const container = document.getElementById('loadMoreContainer');
        expect(container.style.display).toBe('flex');
        expect(document.getElementById('loadMoreBtn').innerHTML).toContain('remaining');
    });

    test('paging is by page for every list length, short or long', () => {
        for (const count of [50, 500]) {
            const view = gridViewFor(count);
            view.currentPage = 2;
            view.updateGrid();

            const start = view.itemsPerPage;
            expect(view.displayedEntities[0].id).toBe(`e${start}`);
            expect(view.displayedEntities.length).toBe(view.itemsPerPage);
        }
    });

    test('the last page hides the button rather than offering an empty load', () => {
        const view = gridViewFor(500);
        view.currentPage = Math.ceil(500 / view.itemsPerPage);
        view.updateGrid();

        expect(document.getElementById('loadMoreContainer').style.display).toBe('none');
    });

    test('handleScroll no longer drives rendering', () => {
        // It was bound to `#entityContainer`, which auto-sizes and never
        // scrolls, so it never ran; when it did run it forced three synchronous
        // layouts to compute a window nothing consumed.
        const view = gridViewFor(500);
        view.currentPage = 1;
        view.updateGrid();
        const before = view.displayedEntities.length;

        expect(() => view.handleScroll()).not.toThrow();
        expect(view.displayedEntities.length).toBe(before);
    });
});
