/**
 * BrowseCategoryView — facet generalisation
 *
 * The browse grid was written for one dataset and read `entity.mythology`
 * everywhere: to group, to filter, to sort, to build the card's URL, and to
 * label the UI. History documents carry `era` and conspiracy documents carry
 * `category`, so on those collections every one of those reads returned
 * undefined — which renders an empty or mislabelled grid rather than an error.
 * That is the failure mode these tests exist to catch.
 *
 * They drive the pure methods directly rather than the full render lifecycle,
 * because the defect is in what field is read, not in how the page is assembled.
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

// The view reads the registry off `window`, exactly as the browser does.
window.DOMAINS = require('../../js/config/domains.js');
require('../../js/views/browse-category-view.js');

/** A view already pointed at a collection, with no Firestore involved. */
function viewFor(category) {
    const view = new window.BrowseCategoryView(null);
    view.category = category;
    return view;
}

describe('BrowseCategoryView facets', () => {
    describe('which field the collection reads', () => {
        test('mythology and esoteric keep reading `mythology`', () => {
            expect(viewFor('deities').facetField).toBe('mythology');
            expect(viewFor('rituals').facetField).toBe('mythology');
        });

        test('history reads `era` and conspiracy reads `category`', () => {
            expect(viewFor('hist_figures').facetField).toBe('era');
            expect(viewFor('con_theories').facetField).toBe('category');
        });

        test('an unregistered collection keeps the pre-registry behaviour', () => {
            expect(viewFor('spiritual-items').facetField).toBe('mythology');
        });

        test('degrades to mythology when the registry has not loaded', () => {
            const saved = window.DOMAINS;
            delete window.DOMAINS;
            try {
                // Losing the registry should cost the new domains their labels,
                // not blank the browse page for all four.
                expect(viewFor('hist_figures').facetField).toBe('mythology');
                expect(viewFor('hist_figures').facetLabel).toBe('Mythology');
            } finally {
                window.DOMAINS = saved;
            }
        });
    });

    describe('labels', () => {
        test('history reads "Era" and conspiracy "Category"', () => {
            expect(viewFor('hist_figures').facetLabel).toBe('Era');
            expect(viewFor('con_theories').facetLabel).toBe('Category');
        });

        test('esoteric labels the shared field "Tradition"', () => {
            expect(viewFor('herbs').facetLabel).toBe('Tradition');
        });

        test('plurals are irregular and come from the registry, not "+ s"', () => {
            expect(viewFor('deities').facetLabelPlural).toBe('Mythologies');
            expect(viewFor('con_theories').facetLabelPlural).toBe('Categories');
            expect(viewFor('hist_wars').facetLabelPlural).toBe('Eras');
        });
    });

    describe('reading an entity value', () => {
        test('reads the domain field for history and conspiracy', () => {
            expect(viewFor('hist_figures').facetValueOf({ era: 'medieval' })).toBe('medieval');
            expect(viewFor('con_theories').facetValueOf({ category: 'political' })).toBe('political');
        });

        test('falls back to `mythology` for a document predating the rename', () => {
            // mnema and synomosia baked era and category into a column named
            // `mythology`; documents uploaded before the export renamed it still
            // carry the value there, and must not read as blank.
            expect(viewFor('hist_figures').facetValueOf({ mythology: 'roman' })).toBe('roman');
        });

        test('prefers the domain field when both are present', () => {
            expect(viewFor('hist_figures').facetValueOf({ era: 'medieval', mythology: 'x' }))
                .toBe('medieval');
        });

        test('an entity with neither field yields an empty string, not undefined', () => {
            expect(viewFor('hist_figures').facetValueOf({})).toBe('');
            expect(viewFor('hist_figures').facetValueOf(null)).toBe('');
        });
    });

    describe('grouping', () => {
        test('groups history entities by era, not by a field they lack', () => {
            const view = viewFor('hist_events');
            const grouped = view.groupByMythology([
                { id: 'a', era: 'medieval' },
                { id: 'b', era: 'medieval' },
                { id: 'c', era: 'modern' },
            ]);

            expect(Object.keys(grouped).sort()).toEqual(['medieval', 'modern']);
            expect(grouped.medieval).toHaveLength(2);
        });

        test('reading the wrong field would have collapsed every entity into one bucket', () => {
            // The regression guard: before the fix this returned { unknown: [3] }.
            const grouped = viewFor('hist_events').groupByMythology([
                { id: 'a', era: 'medieval' },
                { id: 'b', era: 'modern' },
                { id: 'c', era: 'ancient' },
            ]);

            expect(Object.keys(grouped)).toHaveLength(3);
            expect(grouped.unknown).toBeUndefined();
        });

        test('mythology grouping is unchanged', () => {
            const grouped = viewFor('deities').groupByMythology([
                { id: 'zeus', mythology: 'greek' },
                { id: 'odin', mythology: 'norse' },
            ]);

            expect(Object.keys(grouped).sort()).toEqual(['greek', 'norse']);
        });
    });

    describe('filtering', () => {
        test('filters history by era', () => {
            const view = viewFor('hist_events');
            view.entities = [
                { id: 'a', name: 'A', era: 'medieval' },
                { id: 'b', name: 'B', era: 'modern' },
            ];
            view.mythology = 'medieval';
            view.updateGrid = () => {};
            view.updateResultsInfo = () => {};
            view.updatePagination = () => {};

            view.applyFilters();

            expect(view.filteredEntities.map(e => e.id)).toEqual(['a']);
        });

        test('filters conspiracy by category, case-insensitively', () => {
            const view = viewFor('con_theories');
            view.entities = [
                { id: 'a', name: 'A', category: 'Political' },
                { id: 'b', name: 'B', category: 'financial' },
            ];
            view.mythology = 'political';
            view.updateGrid = () => {};
            view.updateResultsInfo = () => {};
            view.updatePagination = () => {};

            view.applyFilters();

            expect(view.filteredEntities.map(e => e.id)).toEqual(['a']);
        });
    });

    describe('sorting', () => {
        test('sorting "by facet" orders history by era', () => {
            const view = viewFor('hist_events');
            view.sortBy = 'mythology';
            view.entities = [
                { id: 'c', name: 'C', era: 'modern' },
                { id: 'a', name: 'A', era: 'ancient' },
                { id: 'b', name: 'B', era: 'medieval' },
            ];
            view.updateGrid = () => {};
            view.updateResultsInfo = () => {};
            view.updatePagination = () => {};

            view.applyFilters();

            expect(view.filteredEntities.map(e => e.era))
                .toEqual(['ancient', 'medieval', 'modern']);
        });
    });

    describe('category prose', () => {
        test('a prefixed collection never shows its prefix to a reader', () => {
            // `hist_` exists to keep collection names unique in one Firestore
            // project. It is an implementation detail and must not reach the page.
            expect(viewFor('hist_periods').categoryNoun('hist_periods')).toBe('history periods');
            expect(viewFor('con_documents').categoryNoun('con_documents')).toBe('conspiracy documents');
        });

        test('an unprefixed collection is unchanged', () => {
            expect(viewFor('deities').categoryNoun('deities')).toBe('deities');
        });

        test('getCategoryInfo names the new collections rather than echoing the slug', () => {
            expect(viewFor('hist_figures').getCategoryInfo('hist_figures').name)
                .toBe('Historical Figures');
            expect(viewFor('con_theories').getCategoryInfo('con_theories').name)
                .toBe('Theories');
        });

        test('an unknown prefixed collection still reads cleanly', () => {
            expect(viewFor('hist_treaties').getCategoryInfo('hist_treaties').name)
                .toBe('History treaties');
        });

        test('descriptions exist for the new collections and mention no mythology', () => {
            const desc = viewFor('hist_wars').getCategoryLongDescription('hist_wars', null);
            expect(desc).not.toMatch(/mytholog/i);
            expect(desc.length).toBeGreaterThan(20);
        });

        test('the faceted fallback does not call an era a mythology', () => {
            const desc = viewFor('hist_treaties').getCategoryLongDescription('hist_treaties', 'Medieval');
            expect(desc).not.toMatch(/mytholog/i);
            expect(desc).toContain('Medieval');
        });
    });
});
