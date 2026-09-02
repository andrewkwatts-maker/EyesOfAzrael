/**
 * DomainTabs Tests
 * Tests for js/components/domain-tabs.js
 *
 * The tab bar derives the active dataset from the route rather than tracking it
 * separately, and only renders tabs whose data actually exists. Both are chosen
 * to avoid silent-wrong states — a highlight that disagrees with the page, and a
 * tab that leads to a blank screen — so most of these tests pin those two things.
 */

const DOMAINS = require('../../js/config/domains.js');
const DomainTabs = require('../../js/components/domain-tabs.js');

/** A manifest listing the given collections. */
function manifestWith(collections) {
    const entry = {};
    for (const c of collections) entry[c] = { total: 1, facets: ['other'] };
    return { version: 'test', generatedAt: '2026-08-30T00:00:00.000Z', collections: entry };
}

function loaderFor(collections) {
    return { getManifest: jest.fn().mockResolvedValue(manifestWith(collections)) };
}

describe('DomainTabs', () => {
    describe('which tabs appear', () => {
        test('renders only domains present in the manifest', async () => {
            // Today's reality: mythology and esoteric have data, the other two do not.
            const tabs = new DomainTabs({
                registry: DOMAINS,
                loader: loaderFor(['deities', 'heroes', 'herbs', 'rituals']),
            });

            const available = await tabs.getAvailableDomains();
            expect(available.map(d => d.id)).toEqual(['mythology', 'esoteric']);
        });

        test('a domain appears as soon as one of its collections has data', async () => {
            // History should light up on its own once seeds are promoted — nobody
            // should have to remember to also edit a list somewhere.
            const tabs = new DomainTabs({
                registry: DOMAINS,
                loader: loaderFor(['deities', 'hist_figures']),
            });

            const available = await tabs.getAvailableDomains();
            expect(available.map(d => d.id)).toEqual(['mythology', 'history']);
        });

        test('falls back to the default domain when the manifest cannot be read', async () => {
            const tabs = new DomainTabs({
                registry: DOMAINS,
                loader: { getManifest: jest.fn().mockRejectedValue(new Error('offline')) },
            });

            const available = await tabs.getAvailableDomains();
            expect(available.map(d => d.id)).toEqual(['mythology']);
        });

        test('falls back rather than rendering nothing when manifest and registry have drifted', async () => {
            // Removing all navigation is the worst possible response to a config
            // mismatch, so an unrecognised manifest still yields a usable tab.
            const tabs = new DomainTabs({
                registry: DOMAINS,
                loader: loaderFor(['some_retired_collection']),
            });

            const available = await tabs.getAvailableDomains();
            expect(available.map(d => d.id)).toEqual(['mythology']);
        });

        test('renders nothing when only one dataset exists — a single tab is not a choice', async () => {
            const tabs = new DomainTabs({
                registry: DOMAINS,
                loader: loaderFor(['deities']),
            });

            expect(await tabs.render()).toBe('');
        });
    });

    describe('active domain is derived from the route', () => {
        const tabs = () => new DomainTabs({ registry: DOMAINS, loader: loaderFor(['deities']) });

        test('resolves the domain from the collection in a browse route', () => {
            expect(tabs().activeDomain('#/browse/deities').id).toBe('mythology');
            expect(tabs().activeDomain('#/browse/herbs').id).toBe('esoteric');
            expect(tabs().activeDomain('#/browse/hist_figures').id).toBe('history');
            expect(tabs().activeDomain('#/browse/con_theories').id).toBe('conspiracy');
        });

        test('handles a filtered browse route', () => {
            expect(tabs().activeDomain('#/browse/deities/greek').id).toBe('mythology');
            expect(tabs().activeDomain('#/browse/hist_figures/medieval').id).toBe('history');
        });

        test('following a cross-domain link lights up the destination tab', () => {
            // The whole point of deriving rather than tracking: a wiki link out of
            // mythology into history cannot leave the highlight behind.
            expect(tabs().activeDomain('#/browse/con_theories').id).toBe('conspiracy');
        });

        test('defaults to mythology for routes naming no collection', () => {
            expect(tabs().activeDomain('#/').id).toBe('mythology');
            expect(tabs().activeDomain('').id).toBe('mythology');
            expect(tabs().activeDomain('#/profile').id).toBe('mythology');
        });

        test('an unregistered collection falls back rather than throwing', () => {
            expect(tabs().activeDomain('#/browse/spiritual-items').id).toBe('mythology');
        });

        test('decodes percent-encoded collection names', () => {
            expect(tabs().activeDomain('#/browse/hist%5Ffigures').id).toBe('history');
        });
    });

    describe('tab targets', () => {
        test('points at a collection that actually has data, not merely the first declared', async () => {
            // esoteric declares spells first in some orderings; the tab must not
            // land the reader on an empty collection when a populated one exists.
            const tabs = new DomainTabs({
                registry: DOMAINS,
                loader: loaderFor(['deities', 'herbs']),
            });

            const esoteric = DOMAINS.byId('esoteric');
            expect(await tabs.routeForDomain(esoteric)).toBe('#/browse/herbs');
        });

        test('falls back to the first declared collection with no manifest', async () => {
            const tabs = new DomainTabs({
                registry: DOMAINS,
                loader: { getManifest: jest.fn().mockRejectedValue(new Error('nope')) },
            });

            expect(await tabs.routeForDomain(DOMAINS.byId('history'))).toBe('#/browse/hist_events');
        });
    });

    describe('rendering', () => {
        let tabs;

        beforeEach(() => {
            tabs = new DomainTabs({
                registry: DOMAINS,
                loader: loaderFor(['deities', 'herbs', 'hist_figures']),
            });
            window.location.hash = '#/browse/deities';
        });

        test('marks exactly one tab active, matching the route', async () => {
            const html = await tabs.render();
            expect(html).toContain('aria-selected="true"');
            expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
            expect(html).toContain('id="domain-tab-mythology"');
            expect(html).toMatch(/domain-tab--active[\s\S]*?Mythology/);
        });

        test('exposes tablist semantics', async () => {
            const html = await tabs.render();
            expect(html).toContain('role="tablist"');
            expect(html.match(/role="tab"/g)).toHaveLength(3);
        });

        test('mounts into a container and reports success', async () => {
            const el = document.createElement('div');
            expect(await tabs.mount(el)).toBe(true);
            expect(el.querySelectorAll('.domain-tab')).toHaveLength(3);
        });

        test('mount reports failure when there is nothing to render', async () => {
            const single = new DomainTabs({ registry: DOMAINS, loader: loaderFor(['deities']) });
            const el = document.createElement('div');
            expect(await single.mount(el)).toBe(false);
            expect(el.innerHTML).toBe('');
        });

        test('escapes domain text rather than injecting it raw', async () => {
            const hostile = {
                default: () => DOMAINS.default(),
                list: () => ([
                    { id: 'a', label: '<img src=x onerror=alert(1)>', blurb: 'x', collections: ['deities'] },
                    { id: 'b', label: 'Safe', blurb: '"quoted"', collections: ['herbs'] },
                ]),
                domainForCollection: c => DOMAINS.domainForCollection(c),
                byId: id => DOMAINS.byId(id),
            };
            const t = new DomainTabs({ registry: hostile, loader: loaderFor(['deities', 'herbs']) });
            const html = await t.render();

            expect(html).not.toContain('<img src=x');
            expect(html).toContain('&lt;img src=x');
        });

        test('refresh follows navigation into another dataset', async () => {
            const el = document.createElement('div');
            await tabs.mount(el);

            window.location.hash = '#/browse/hist_figures';
            await tabs.refresh();

            const active = el.querySelector('.domain-tab--active');
            expect(active.id).toBe('domain-tab-history');
        });

        test('destroy detaches the navigation listener', async () => {
            const el = document.createElement('div');
            const spy = jest.spyOn(window, 'removeEventListener');
            await tabs.mount(el);
            tabs.destroy();
            expect(spy).toHaveBeenCalledWith('hashchange', expect.any(Function));
            spy.mockRestore();
        });
    });

    describe('keyboard navigation', () => {
        test('arrow keys move focus, so inactive tabs stay reachable', async () => {
            // Inactive tabs carry tabindex="-1" per the tablist pattern, which makes
            // them unreachable by Tab alone — arrow handling is what keeps them usable.
            const tabs = new DomainTabs({
                registry: DOMAINS,
                loader: loaderFor(['deities', 'herbs', 'hist_figures']),
            });
            const el = document.createElement('div');
            document.body.appendChild(el);
            await tabs.mount(el);

            const all = el.querySelectorAll('.domain-tab');
            all[0].focus();

            el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            expect(document.activeElement).toBe(all[1]);

            el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
            expect(document.activeElement).toBe(all[2]);

            el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            expect(document.activeElement).toBe(all[0]); // wraps

            document.body.removeChild(el);
        });
    });
});
