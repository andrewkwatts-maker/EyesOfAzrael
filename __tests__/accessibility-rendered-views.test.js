/**
 * Accessibility of the markup the app actually emits
 *
 * `__tests__/accessibility-axe.test.js` passes 22/22, and every one of those
 * assertions runs against HTML written by hand inside the test file. That
 * validates the fixtures, not the app: a component could regress its heading
 * order or drop a label tomorrow and the suite would stay green, because the
 * suite never calls the component.
 *
 * This file closes that gap for the three surfaces a reader meets on every
 * visit — the dataset tab bar, the browse grid card, and the entity detail
 * connections block. It renders each through its real component and hands the
 * output to axe.
 *
 * Scope, stated honestly: axe in jsdom cannot evaluate colour contrast, because
 * jsdom does not compute styles from stylesheets. Contrast on these components
 * is therefore *not* covered here and remains a browser-level concern — the
 * Playwright accessibility job is where it can actually be measured. The rules
 * that do work in jsdom are the structural ones: names, roles, labels, heading
 * order, list semantics, and duplicate ids.
 */

const { axe, toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);

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

const DOMAINS = require('../js/config/domains.js');
window.DOMAINS = DOMAINS;

const EntityConnections = require('../js/components/entity-connections.js');
require('../js/views/browse-category-view.js');

/**
 * Colour-contrast is disabled throughout: jsdom does not apply stylesheets, so
 * axe sees every element as transparent-on-transparent and the result is noise
 * either way it lands. Disabled explicitly rather than left to report a false
 * pass, so nobody reads a green run here as evidence of contrast compliance.
 */
const AXE_OPTIONS = {
    rules: { 'color-contrast': { enabled: false } },
};

/**
 * Wrap a fragment in a landmark and a heading level so axe judges it in a
 * plausible page context rather than flagging it for being a fragment.
 */
function inPage(html) {
    return `<main><h1>Page</h1>${html}</main>`;
}

let container;

beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
});

afterEach(() => {
    document.body.innerHTML = '';
});

describe('rendered browse grid cards', () => {
    function viewFor(category, entities) {
        const view = new window.BrowseCategoryView(null);
        view.category = category;
        view.entities = entities;
        view.filteredEntities = [...entities];
        view.groupedEntities = view.groupByMythology(entities);
        view.availableDomains = new Set();
        return view;
    }

    const HISTORY_ENTITIES = [
        { id: 'cicero', name: 'Cicero', description: 'Roman orator.', era: 'classical', isStandard: true },
        { id: 'livy', name: 'Livy', description: 'Roman historian.', era: 'classical', isStandard: true },
    ];

    /**
     * Cards render h3 titles, so they need the results h2 above them — which is
     * exactly what the real page emits. Reproducing that here rather than
     * lowering the fixture's heading level keeps the test honest about the
     * structure being asserted.
     */
    function inGrid(cardsHtml) {
        return inPage(
            `<h2 class="sr-only" id="browseResultsHeading">Results</h2>
             <div class="entity-grid" aria-labelledby="browseResultsHeading">${cardsHtml}</div>`
        );
    }

    test('a history card is accessible', async () => {
        const view = viewFor('hist_figures', HISTORY_ENTITIES);
        container.innerHTML = inGrid(HISTORY_ENTITIES.map(e => view.getEntityCardHTML(e)).join(''));

        expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
    });

    test('the card link keeps its link role', async () => {
        // It used to carry `role="article"`, which overrode the implicit link
        // role and left assistive technology announcing the card as an article
        // — dropping the one fact a reader needs, that it is clickable.
        const view = viewFor('hist_figures', HISTORY_ENTITIES);
        container.innerHTML = view.getEntityCardHTML(HISTORY_ENTITIES[0]);

        expect(container.querySelector('a').hasAttribute('role')).toBe(false);
    });

    test('a card with no facet value is still accessible', async () => {
        // The thin datasets have sparse metadata, so this is the common shape
        // there, not an edge case. The facet span is omitted entirely rather
        // than rendered empty.
        const view = viewFor('hist_figures', [{ id: 'anon', name: 'Anonymous', description: 'Unattributed.', isStandard: true }]);
        container.innerHTML = inGrid(view.getEntityCardHTML(view.entities[0]));

        expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
    });

    test('the card link carries an accessible name that names the dataset slice', async () => {
        const view = viewFor('hist_figures', HISTORY_ENTITIES);
        container.innerHTML = view.getEntityCardHTML(HISTORY_ENTITIES[0]);

        const label = container.querySelector('a').getAttribute('aria-label');
        expect(label).toContain('Cicero');
        expect(label).toContain('Era: Classical');
        // The prefix that keeps collection names unique in one Firestore
        // project is an implementation detail and must not be read aloud.
        expect(label).not.toContain('hist_figures');
    });

    test('quick-action buttons expose their pressed state', async () => {
        const view = viewFor('hist_figures', HISTORY_ENTITIES);
        container.innerHTML = view.getEntityCardHTML(HISTORY_ENTITIES[0]);

        const buttons = container.querySelectorAll('.quick-action-btn');
        expect(buttons.length).toBeGreaterThan(0);
        buttons.forEach(btn => {
            expect(btn.getAttribute('aria-pressed')).toMatch(/^(true|false)$/);
            expect(btn.getAttribute('aria-label')).toBeTruthy();
            expect(btn.getAttribute('type')).toBe('button');
        });
    });

    test('the early-collection notice is accessible', async () => {
        const view = viewFor('hist_wars', HISTORY_ENTITIES);
        container.innerHTML = inPage(view.getEarlyCollectionNoticeHTML());

        expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
    });

    test('the empty state is accessible', async () => {
        const view = viewFor('con_documents', []);
        container.innerHTML = inPage(view.getEmptyStateHTML());

        expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
    });

    test('the whole browse page has a valid heading order', async () => {
        // The real defect: the hero is an h1 and everything under it was an h3,
        // with no h2 anywhere, so the page skipped a level in all four domains.
        const entities = [
            { id: 'a', name: 'A', description: 'x', era: 'classical', isStandard: true },
            { id: 'b', name: 'B', description: 'y', era: 'modern', isStandard: true },
        ];
        const view = viewFor('hist_events', entities);

        const levels = [
            ...view.getHeaderHTML({ name: 'Events', icon: '📜' }).matchAll(/<h([1-6])/g),
            ...view.getQuickFiltersHTML().matchAll(/<h([1-6])/g),
            ...view.getEntityCardHTML(entities[0]).matchAll(/<h([1-6])/g),
        ].map(m => Number(m[1]));

        expect(levels[0]).toBe(1);
        for (let i = 1; i < levels.length; i++) {
            expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
        }
    });

    test('the facet filter chips are accessible', async () => {
        const entities = [
            { id: 'a', name: 'A', description: 'x', era: 'classical', isStandard: true },
            { id: 'b', name: 'B', description: 'y', era: 'modern', isStandard: true },
        ];
        const view = viewFor('hist_events', entities);
        container.innerHTML = inPage(view.getQuickFiltersHTML());

        expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
    });
});

describe('rendered entity connections', () => {
    const ENTITY = {
        relatedEntities: {
            deities: [{ id: 'zeus', name: 'Zeus', relationship: 'invoked' }],
            hist_events: [{ id: 'ides-of-march', name: 'The Ides of March' }],
            retired_collection: [{ id: 'ghost', name: 'A Retired Thing' }],
        },
        _backlinks: [
            { ref: 'con_theories/roman-succession', name: 'Roman Succession' },
        ],
    };

    test('the connections block is accessible across domains', async () => {
        const html = new EntityConnections({ registry: DOMAINS }).render(ENTITY, 'hist_figures');
        // The component emits h2s, so it needs an h1 above it to keep heading
        // order valid — which is exactly what the real page provides.
        container.innerHTML = inPage(html);

        expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
    });

    test('a cross-domain link says so in text, not by styling alone', async () => {
        const html = new EntityConnections({ registry: DOMAINS }).render(ENTITY, 'hist_figures');
        container.innerHTML = inPage(html);

        const crossLink = container.querySelector('[data-collection="deities"]');
        expect(crossLink.getAttribute('aria-label')).toContain('Mythology');

        // The visible badge carries the destination's name too, so the cue
        // survives for a reader who cannot distinguish the styling.
        expect(container.textContent).toContain('Mythology');
    });

    test('an unresolvable reference renders as dead text, not as a link', async () => {
        const html = new EntityConnections({ registry: DOMAINS }).render(ENTITY, 'hist_figures');
        container.innerHTML = inPage(html);

        const broken = container.querySelector('.entity-connections__item--broken');
        expect(broken).not.toBeNull();
        expect(broken.querySelector('a')).toBeNull();
        expect(broken.textContent).toContain('unresolved reference');
    });

    test('every link has a non-empty accessible name', async () => {
        const html = new EntityConnections({ registry: DOMAINS }).render(ENTITY, 'hist_figures');
        container.innerHTML = inPage(html);

        const links = container.querySelectorAll('a');
        expect(links.length).toBeGreaterThan(0);
        links.forEach(a => {
            const name = a.getAttribute('aria-label') || a.textContent.trim();
            expect(name.length).toBeGreaterThan(0);
            expect(a.getAttribute('href')).toBeTruthy();
        });
    });
});

describe('the dataset tab bar', () => {
    let DomainTabs;

    beforeAll(() => {
        jest.isolateModules(() => {
            require('../js/components/domain-tabs.js');
        });
        DomainTabs = window.DomainTabs;
    });

    test('the component is available to test', () => {
        expect(typeof DomainTabs).toBe('function');
    });

    /**
     * A manifest listing one collection per domain, so all four tabs appear.
     * Matching the convention in __tests__/components/domain-tabs.test.js.
     *
     * A loader is required: with none, `getAvailableDomains` correctly falls
     * back to the default domain alone and `render` returns '' for a single
     * tab. Without this stub every assertion below would pass vacuously against
     * an empty string.
     */
    function loaderFor(collections) {
        const entry = {};
        for (const c of collections) entry[c] = { total: 1, facets: ['other'] };
        return {
            getManifest: jest.fn().mockResolvedValue({
                version: 'test',
                generatedAt: '2026-08-30T00:00:00.000Z',
                collections: entry,
            }),
        };
    }

    const ALL_FOUR = ['deities', 'herbs', 'hist_figures', 'con_theories'];

    /**
     * `render()` is async and takes no argument — the active tab is derived
     * from the route rather than passed in, which is the property that keeps
     * the highlight correct after a cross-domain link.
     */
    async function renderAt(hash) {
        window.location.hash = hash;
        const tabs = new DomainTabs({ registry: DOMAINS, loader: loaderFor(ALL_FOUR) });
        const html = await tabs.render();
        // Guard against the vacuous pass described above.
        expect(html).toContain('domain-tab');
        return html;
    }

    test('the rendered tab bar is accessible', async () => {
        container.innerHTML = inPage(await renderAt('#/browse/deities'));
        expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
    });

    test('exactly one tab is marked current', async () => {
        container.innerHTML = await renderAt('#/browse/hist_figures');
        expect(container.querySelectorAll('[aria-current="page"]').length).toBe(1);
    });

    test('the highlight follows a cross-domain entity link', async () => {
        // Landing on a history entity from a mythology page must move the tab,
        // or the tab bar lies about which dataset the reader is in.
        container.innerHTML = await renderAt('#/entity/con_theories/some-theory');

        const current = container.querySelector('[aria-current="page"]');
        expect(current.textContent).toContain('Conspiracy');
    });

    test('every tab is a real link, so it is keyboard reachable without JS', async () => {
        container.innerHTML = await renderAt('#/browse/deities');

        const anchors = container.querySelectorAll('a');
        expect(anchors.length).toBeGreaterThan(1);
        anchors.forEach(a => {
            expect(a.getAttribute('href')).toBeTruthy();
            // A positive tabindex reorders the whole page's tab sequence and is
            // a bug wherever it appears.
            const ti = a.getAttribute('tabindex');
            expect(ti === null || Number(ti) <= 0).toBe(true);
        });
    });

    test('each tab has a text label, not an icon alone', async () => {
        container.innerHTML = await renderAt('#/browse/deities');

        container.querySelectorAll('a').forEach(a => {
            expect(a.textContent.trim().length).toBeGreaterThan(0);
        });
    });
});
