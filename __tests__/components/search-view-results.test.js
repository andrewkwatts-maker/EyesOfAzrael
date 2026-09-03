/**
 * SearchViewComplete — rendering a result from any of the four datasets
 *
 * Search is the one surface where all four datasets appear side by side, so it
 * is the surface most exposed to the assumption that a result has a
 * `mythology`. It does not: history hits carry `era` and conspiracy hits carry
 * `category`, and reading `entity.mythology` unconditionally labelled every one
 * of them "Unknown" and pointed their links at `#/mythology/unknown/...`.
 *
 * `renderEntityCard` and `renderListItem` also carried the same six lines of
 * resolution logic twice, so a fix to one silently missed the other. Both now
 * go through `describeResult`, and these tests drive that.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

window.DOMAINS = require('../../js/config/domains.js');
const SearchViewComplete = require('../../js/components/search-view-complete.js');

/** A view with a stub Firestore and no search engine of consequence. */
function makeView() {
    const view = new SearchViewComplete({ collection: () => ({}) });
    view.state.query = '';
    return view;
}

describe('describeResult', () => {
    let view;
    beforeEach(() => { view = makeView(); });

    test('reads a mythology hit from the mythology field', () => {
        const d = view.describeResult({
            id: 'zeus', name: 'Zeus', collection: 'deities', mythology: 'greek',
        });

        expect(d.facet).toBe('greek');
        expect(d.facetLabel).toBe('Mythology');
    });

    test('reads a history hit from `era`, not from a field it lacks', () => {
        const d = view.describeResult({
            id: 'napoleon', name: 'Napoleon', collection: 'hist_figures', era: 'modern',
        });

        expect(d.facet).toBe('modern');
        expect(d.facetLabel).toBe('Era');
    });

    test('reads a conspiracy hit from `category`', () => {
        const d = view.describeResult({
            id: 'x', name: 'X', collection: 'con_theories', category: 'political',
        });

        expect(d.facet).toBe('political');
        expect(d.facetLabel).toBe('Category');
    });

    test('labels an esoteric hit "Tradition" though it shares the field', () => {
        const d = view.describeResult({
            id: 'samhain', name: 'Samhain', collection: 'rituals', mythology: 'celtic',
        });

        expect(d.facetLabel).toBe('Tradition');
    });

    test('a hit with no facet anywhere reads "unknown" rather than undefined', () => {
        expect(view.describeResult({ id: 'x', name: 'X', collection: 'deities' }).facet)
            .toBe('unknown');
    });

    test('falls back to `mythology` for a history document predating the rename', () => {
        const d = view.describeResult({
            id: 'x', name: 'X', collection: 'hist_events', mythology: 'roman',
        });

        expect(d.facet).toBe('roman');
    });
});

describe('where a result links', () => {
    let view;
    beforeEach(() => { view = makeView(); });

    test('mythology keeps the live three-segment route', () => {
        // Proven and deep-linked; there is no reason to move it.
        const d = view.describeResult({
            id: 'zeus', name: 'Zeus', type: 'deities', mythology: 'greek',
        });

        expect(d.href).toBe('#/mythology/greek/deities/zeus');
    });

    test('history uses the collection route instead of naming an era a mythology', () => {
        const d = view.describeResult({
            id: 'napoleon', name: 'Napoleon', collection: 'hist_figures', era: 'modern',
        });

        expect(d.href).toBe('#/entity/hist_figures/napoleon');
        expect(d.href).not.toContain('/mythology/');
    });

    test('conspiracy likewise', () => {
        const d = view.describeResult({
            id: 'moon', name: 'Moon', collection: 'con_theories', category: 'space',
        });

        expect(d.href).toBe('#/entity/con_theories/moon');
    });

    test('encodes an id that would otherwise break the hash', () => {
        const d = view.describeResult({
            id: 'a/b', name: 'A', collection: 'hist_figures', era: 'x',
        });

        expect(d.href).toBe('#/entity/hist_figures/a%2Fb');
    });

    test('derives an id from the name when the hit has none', () => {
        const d = view.describeResult({ name: 'Some Thing', collection: 'deities' });
        expect(d.entityId).toBe('some-thing');
    });
});

describe('rendering', () => {
    let view;
    beforeEach(() => { view = makeView(); });

    test('the card badge shows the facet and names which kind it is', () => {
        const html = view.renderEntityCard({
            id: 'napoleon', name: 'Napoleon', collection: 'hist_figures', era: 'modern',
        });

        expect(html).toContain('Modern');
        expect(html).toContain('title="Era: Modern"');
        expect(html).toContain('href="#/entity/hist_figures/napoleon"');
    });

    test('the list item renders the same destination as the card', () => {
        // They used to hold two copies of this logic, so they could disagree.
        const entity = {
            id: 'napoleon', name: 'Napoleon', collection: 'hist_figures', era: 'modern',
        };

        const card = view.renderEntityCard(entity);
        const item = view.renderListItem(entity);

        expect(card).toContain('href="#/entity/hist_figures/napoleon"');
        expect(item).toContain('href="#/entity/hist_figures/napoleon"');
    });

    test('a grid of mixed-domain results renders every one', () => {
        const html = view.renderGridView([
            { id: 'zeus', name: 'Zeus', collection: 'deities', mythology: 'greek' },
            { id: 'napoleon', name: 'Napoleon', collection: 'hist_figures', era: 'modern' },
            { id: 'moon', name: 'Moon', collection: 'con_theories', category: 'space' },
        ]);

        expect(html).toContain('Zeus');
        expect(html).toContain('Napoleon');
        expect(html).toContain('Moon');
        expect(html).not.toContain('Unknown');
    });

    test('a list of mixed-domain results renders every one', () => {
        const html = view.renderListView([
            { id: 'zeus', name: 'Zeus', collection: 'deities', mythology: 'greek' },
            { id: 'napoleon', name: 'Napoleon', collection: 'hist_figures', era: 'modern' },
        ]);

        expect(html).toContain('Zeus');
        expect(html).toContain('Napoleon');
    });

    test('a numeric facet does not take the whole result list down', () => {
        // formatMythologyName called .split on the raw value. A document with a
        // numeric era would throw inside the map and blank every result.
        expect(() => view.renderEntityCard({
            id: 'x', name: 'X', collection: 'hist_periods', era: 1492,
        })).not.toThrow();

        expect(view.formatMythologyName(1492)).toBe('1492');
        expect(view.formatMythologyName(null)).toBe('');
        expect(view.formatMythologyName(undefined)).toBe('');
    });

    test('formats a snake_case facet as words', () => {
        expect(view.formatMythologyName('early_modern')).toBe('Early Modern');
    });
});

describe('degrading without the registry', () => {
    test('falls back to mythology semantics rather than failing', () => {
        const saved = window.DOMAINS;
        delete window.DOMAINS;
        try {
            const view = makeView();
            const d = view.describeResult({
                id: 'zeus', name: 'Zeus', collection: 'deities', mythology: 'greek',
            });

            expect(d.facet).toBe('greek');
            expect(d.facetLabel).toBe('Mythology');
            expect(d.href).toBe('#/mythology/greek/deities/zeus');
        } finally {
            window.DOMAINS = saved;
        }
    });
});

describe('construction', () => {
    test('requires a Firestore instance', () => {
        expect(() => new SearchViewComplete()).toThrow(/Firestore instance is required/);
    });

    test('falls back to an empty search engine when none is available', async () => {
        const view = makeView();
        await expect(view.searchEngine.search('x')).resolves.toEqual({ items: [], total: 0 });
    });
});
