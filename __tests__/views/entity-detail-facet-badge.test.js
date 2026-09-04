/**
 * EntityDetailView — the facet badge
 *
 * The badge under an entity's title used to print a bare value: "Greek",
 * "Classical", "Financial". That was legible while the site had one dataset,
 * because the only thing a bare value could be was a mythology. With four tabs
 * it is ambiguous — "Classical" is a mythology on one tab and an era on
 * another — and the view already had a `facetLabel()` helper wired to the
 * domain registry that nothing called.
 *
 * The other half of the defect was the absent case. `capitalize(mythology)` on
 * a document with no facet produced an empty badge, and on a route carrying the
 * literal string "undefined" it produced a badge reading "Undefined". Both look
 * like a data error on a young dataset, where sparse metadata is expected.
 *
 * This is the fallback renderer — `AssetDetailPanel` handles the primary path,
 * covered in __tests__/components/asset-detail-panel-facets.test.js — but it is
 * what a reader sees whenever that component fails to load.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

window.DOMAINS = require('../../js/config/domains.js');
require('../../js/views/entity-detail-view.js');

const EntityDetailView = window.EntityDetailView;

function view() {
    return new EntityDetailView({ db: null });
}

/** Strip tags so assertions read against the text a person sees. */
function textOf(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

describe('EntityDetailView facet badge', () => {
    describe('it names the field, not just the value', () => {
        test('history reads "Era: Classical"', () => {
            const html = view().renderFacetBadge('hist_figures', 'classical');

            expect(textOf(html)).toBe('Era: Classical');
            expect(html).toContain('aria-label="Era: Classical"');
        });

        test('conspiracy reads "Category"', () => {
            expect(textOf(view().renderFacetBadge('con_theories', 'financial')))
                .toBe('Category: Financial');
        });

        test('esoteric reads "Tradition"', () => {
            expect(textOf(view().renderFacetBadge('rituals', 'hermetic')))
                .toBe('Tradition: Hermetic');
        });

        test('mythology still reads "Mythology"', () => {
            expect(textOf(view().renderFacetBadge('deities', 'greek')))
                .toBe('Mythology: Greek');
        });

        test('an unregistered collection keeps the pre-registry label', () => {
            expect(textOf(view().renderFacetBadge('spiritual-items', 'norse')))
                .toBe('Mythology: Norse');
        });
    });

    describe('the label is visible, not only announced', () => {
        test('it is in the text as well as in aria-label', () => {
            const html = view().renderFacetBadge('hist_events', 'renaissance');

            // Putting the label only in `aria-label` would give a screen-reader
            // user the context and deny it to everyone else — the wrong way
            // round, since sighted readers are the ones facing four tabs of
            // similar-looking values.
            expect(html).toContain('edv-badge__label');
            expect(html).toContain('edv-badge__value');
            expect(textOf(html)).toContain('Era');
        });
    });

    describe('an absent value renders nothing at all', () => {
        test.each([
            ['empty string', ''],
            ['whitespace', '   '],
            ['the string "undefined" from a route', 'undefined'],
            ['the string "unknown"', 'unknown'],
            ['the string "null"', 'null'],
            ['a missing argument', undefined],
            ['a non-string', 42],
        ])('%s produces no badge', (_label, value) => {
            expect(view().renderFacetBadge('hist_figures', value)).toBe('');
        });
    });

    describe('escaping', () => {
        test('a facet value carrying markup cannot break out', () => {
            const html = view().renderFacetBadge('deities', '<img src=x onerror=alert(1)>');

            expect(html).not.toContain('<img');
            expect(html).toContain('&lt;img');
        });
    });

    describe('degrading without the registry', () => {
        test('the badge still renders, labelled as mythology', () => {
            const saved = window.DOMAINS;
            delete window.DOMAINS;
            try {
                // Losing the registry should cost the two new domains their
                // labels, not blank the badge for all four.
                expect(textOf(view().renderFacetBadge('hist_figures', 'classical')))
                    .toBe('Mythology: Classical');
            } finally {
                window.DOMAINS = saved;
            }
        });
    });

    describe('where the badge links', () => {
        test('only mythology has an overview page; the rest go to a filtered browse', () => {
            const v = view();
            expect(v.facetHref('deities', 'greek')).toBe('#/mythology/greek');
            expect(v.facetHref('hist_figures', 'classical'))
                .toBe('#/browse/hist_figures/classical');
            expect(v.facetHref('con_theories', 'financial'))
                .toBe('#/browse/con_theories/financial');
        });

        test('with no facet value it falls back to the unfiltered browse', () => {
            expect(view().facetHref('hist_figures', null)).toBe('#/browse/hist_figures');
        });
    });
});
