/**
 * AssetDetailPanel — facet generalisation
 *
 * This panel is the *primary* entity detail renderer: `EntityDetailView`
 * delegates to it whenever `window.AssetDetailPanel` is available, and only
 * falls back to its own inline markup when it is not. So a mythology assumption
 * here is the one a reader actually meets.
 *
 * It had two, and both produced a visibly wrong page rather than an error:
 *
 * 1. The header badge read `entity.primaryMythology || entity.mythology ||
 *    'unknown'`. A history document carries `era` and a conspiracy document
 *    carries `category`, so both rendered the literal word "Unknown".
 * 2. The Quick Info sidebar emitted a hardcoded `<dt>Mythology</dt>` against
 *    that same value — so a history entity in the classical era read
 *    "Mythology: Unknown", naming the wrong field *and* discarding the answer.
 *
 * These tests drive `render` directly and assert on the HTML, because the defect
 * was in what the markup says, not in how the page is assembled.
 */

const DOMAINS = require('../../js/config/domains.js');

// The panel is an IIFE that assigns to `window`, with no module export.
require('../../js/components/asset-detail-panel.js');
const AssetDetailPanel = window.AssetDetailPanel;

/** A panel with the registry injected, as the browser supplies it. */
function panel() {
    return new AssetDetailPanel({ registry: DOMAINS });
}

/** Strip tags so assertions read against the text a person sees. */
function textOf(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

describe('AssetDetailPanel facets', () => {
    describe('the Quick Info list names the right field', () => {
        test('history says "Era", not "Mythology"', () => {
            const html = panel().renderQuickInfoSidebar(
                { type: 'figure', era: 'classical' },
                'hist_figures'
            );
            const text = textOf(html);

            expect(text).toContain('Era');
            expect(text).toContain('Classical');
            expect(text).not.toContain('Mythology');
        });

        test('conspiracy says "Category"', () => {
            const html = panel().renderQuickInfoSidebar(
                { type: 'theory', category: 'financial' },
                'con_theories'
            );
            const text = textOf(html);

            expect(text).toContain('Category');
            expect(text).toContain('Financial');
            expect(text).not.toContain('Mythology');
        });

        test('esoteric says "Tradition" while still reading the mythology field', () => {
            // Esoteric deliberately shares the literal `mythology` field with
            // the mythology domain — only the label differs. See the header
            // note in js/config/domains.js.
            const html = panel().renderQuickInfoSidebar(
                { type: 'ritual', mythology: 'hermetic' },
                'rituals'
            );
            const text = textOf(html);

            expect(text).toContain('Tradition');
            expect(text).toContain('Hermetic');
        });

        test('mythology is unchanged', () => {
            const html = panel().renderQuickInfoSidebar(
                { type: 'deity', mythology: 'greek' },
                'deities'
            );
            const text = textOf(html);

            expect(text).toContain('Mythology');
            expect(text).toContain('Greek');
        });
    });

    describe('an absent facet is omitted, never rendered as "Unknown"', () => {
        test('the Quick Info row disappears rather than saying Unknown', () => {
            const html = panel().renderQuickInfoSidebar({ type: 'figure' }, 'hist_figures');

            // A young dataset with sparse metadata should read as sparse, not
            // as broken. "Unknown" is what the old code printed and it looks
            // like a data error.
            expect(textOf(html)).not.toContain('Unknown');
            expect(html).not.toContain('<dt>Era</dt>');
        });

        test('the header badge disappears rather than saying Unknown', () => {
            const html = panel().renderHeader({ name: 'Anon', type: 'figure' }, 'hist_figures');

            expect(html).not.toContain('asset-facet-badge');
            expect(textOf(html)).not.toContain('Unknown');
        });

        test('placeholder strings from routes count as absent', () => {
            for (const junk of ['unknown', 'Unknown', 'undefined', 'null', '   ']) {
                const value = panel().facetValueOf({ era: junk }, 'hist_figures');
                expect(value).toBe('');
            }
        });
    });

    describe('where the facet value is found', () => {
        test('the domain field wins', () => {
            const value = panel().facetValueOf(
                { era: 'classical', mythology: 'greek' },
                'hist_figures'
            );
            expect(value).toBe('classical');
        });

        test('falls back to the mythology column the packages baked into', () => {
            // mnema and synomosia store era and category in a column named
            // `mythology`, because all four domains share one SQLite schema.
            // Documents exported before the rename still carry them there.
            expect(panel().facetValueOf({ mythology: 'renaissance' }, 'hist_events'))
                .toBe('renaissance');
        });

        test('falls back to the route segment when the document carries nothing', () => {
            expect(panel().facetValueOf({ type: 'figure' }, 'hist_figures', 'classical'))
                .toBe('classical');
        });
    });

    describe('degrading without the registry', () => {
        test('a panel constructed before domains.js loaded still renders', () => {
            // Simulate the real failure: the registry script did not load, so
            // there is nothing on `window` to fall back to either.
            const saved = window.DOMAINS;
            delete window.DOMAINS;
            try {
                const bare = new AssetDetailPanel();

                // Losing the registry should cost the two new domains their
                // labels, not blank the detail page for all four.
                expect(bare.registry).toBeFalsy();
                expect(bare.facetLabelOf('hist_figures')).toBe('Mythology');
                expect(textOf(bare.renderQuickInfoSidebar({ type: 'deity', mythology: 'norse' }, 'deities')))
                    .toContain('Norse');
            } finally {
                window.DOMAINS = saved;
            }
        });

        test('the panel prefers an injected registry over the global one', () => {
            const injected = new AssetDetailPanel({ registry: DOMAINS });
            expect(injected.facetLabelOf('hist_figures')).toBe('Era');
        });
    });

    describe('the header badge carries its label', () => {
        test('a bare value is ambiguous across four tabs, so the label ships with it', () => {
            const html = panel().renderHeader(
                { name: 'Cicero', type: 'figure', era: 'classical' },
                'hist_figures'
            );

            expect(html).toContain('asset-facet-badge');
            // Visible text, not only aria — sighted readers are the ones facing
            // four tabs of similar-looking values.
            expect(textOf(html)).toContain('Era: Classical');
            expect(html).toContain('aria-label="Era: Classical"');
        });

        test('"Also in" is a mythology-only concept and does not leak', () => {
            // `mythologies` (one entity in several pantheons) has no equivalent
            // in history or conspiracy. An absent array means one value, not
            // an unknown number of them.
            const html = panel().renderHeader(
                { name: 'Cicero', type: 'figure', era: 'classical' },
                'hist_figures'
            );
            expect(html).not.toContain('asset-multi-mythology');
        });

        test('a multi-pantheon deity still advertises its other pantheons', () => {
            const html = panel().renderHeader(
                { name: 'Jupiter', type: 'deity', mythology: 'roman', mythologies: ['roman', 'greek'] },
                'deities'
            );
            expect(html).toContain('asset-multi-mythology');
            expect(html).toContain('+1 more');
        });
    });

    describe('render threads the collection through', () => {
        test('a history entity renders "Era" end to end', () => {
            const html = panel().render(
                { id: 'cicero', name: 'Cicero', type: 'figure', era: 'classical' },
                'hist_figures'
            );
            const text = textOf(html);

            expect(text).toContain('Era');
            expect(text).toContain('Classical');
            expect(text).not.toContain('Mythology');
        });

        test('called without a collection it behaves as it always did', () => {
            // Existing callers and tests pass only the entity.
            const html = panel().render({ id: 'zeus', name: 'Zeus', type: 'deity', mythology: 'greek' });
            expect(textOf(html)).toContain('Mythology');
        });
    });
});
