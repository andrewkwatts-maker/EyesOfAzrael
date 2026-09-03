/**
 * EntityConnections Tests
 * Tests for js/components/entity-connections.js
 *
 * Two things carry the design and are therefore pinned hardest:
 *
 * 1. A link leaving the current dataset is *marked* as doing so. If that mark
 *    is dropped, following a link silently teleports the reader between tabs,
 *    which is the failure the tab bar exists to prevent.
 * 2. A reference to a collection the registry no longer knows renders as a
 *    dead name, not an exception and not silence. Content outlives config; a
 *    link that vanishes is indistinguishable from one that never existed.
 */

const DOMAINS = require('../../js/config/domains.js');
const EntityConnections = require('../../js/components/entity-connections.js');

function make() {
    return new EntityConnections({ registry: DOMAINS });
}

describe('EntityConnections', () => {
    describe('outbound links', () => {
        test('reads relatedEntities keyed by collection', () => {
            const links = make().outbound({
                relatedEntities: {
                    deities: [{ id: 'zeus', name: 'Zeus', relationship: 'father' }],
                    heroes: [{ id: 'heracles', name: 'Heracles' }],
                },
            }, 'deities');

            expect(links.map(l => l.ref)).toEqual(['deities/zeus', 'heroes/heracles']);
            expect(links[0].relationship).toBe('father');
        });

        test('accepts a bare id string as a reference', () => {
            const links = make().outbound({
                relatedEntities: { deities: ['odin'] },
            }, 'heroes');

            expect(links).toHaveLength(1);
            expect(links[0].ref).toBe('deities/odin');
            expect(links[0].name).toBe('odin');
        });

        test('de-duplicates a reference listed twice', () => {
            const links = make().outbound({
                relatedEntities: { deities: [{ id: 'zeus' }, { id: 'zeus', name: 'Zeus' }] },
            }, 'heroes');

            expect(links).toHaveLength(1);
        });

        test('returns [] rather than throwing for a malformed relatedEntities', () => {
            const c = make();
            expect(c.outbound({ relatedEntities: ['deities/zeus'] }, 'heroes')).toEqual([]);
            expect(c.outbound({ relatedEntities: 'nope' }, 'heroes')).toEqual([]);
            expect(c.outbound({}, 'heroes')).toEqual([]);
            expect(c.outbound(null, 'heroes')).toEqual([]);
        });

        test('skips a ref with no id instead of emitting "collection/undefined"', () => {
            const links = make().outbound({
                relatedEntities: { deities: [{ name: 'nameless' }, { id: 'zeus' }] },
            }, 'heroes');

            expect(links.map(l => l.ref)).toEqual(['deities/zeus']);
        });
    });

    describe('inbound links', () => {
        test('reads the _backlinks array written at export time', () => {
            const links = make().inbound({
                _backlinks: [
                    { ref: 'hist_figures/napoleon', name: 'Napoleon', collection: 'hist_figures' },
                ],
            }, 'deities');

            expect(links).toHaveLength(1);
            expect(links[0].name).toBe('Napoleon');
        });

        test('an entity with no _backlinks has no inbound links', () => {
            expect(make().inbound({}, 'deities')).toEqual([]);
            expect(make().inbound({ _backlinks: 'nope' }, 'deities')).toEqual([]);
        });
    });

    describe('cross-domain marking', () => {
        test('a link within the same dataset is not marked', () => {
            const [link] = make().outbound({
                relatedEntities: { heroes: [{ id: 'heracles' }] },
            }, 'deities');

            expect(link.crossDomain).toBe(false);
            expect(link.domainLabel).toBe('');
        });

        test('a link into another dataset is marked with its destination', () => {
            const [link] = make().outbound({
                relatedEntities: { hist_figures: [{ id: 'napoleon' }] },
            }, 'deities');

            expect(link.crossDomain).toBe(true);
            expect(link.domainLabel).toBe('History');
        });

        test('the mark reaches the rendered HTML as text, not colour alone', () => {
            const html = make().render({
                relatedEntities: { con_theories: [{ id: 'moon-landing', name: 'Moon Landing' }] },
            }, 'deities');

            expect(html).toContain('entity-connections__item--cross-domain');
            expect(html).toContain('data-cross-domain="true"');
            // The badge text is what a reader who cannot see the accent relies on.
            expect(html).toContain('>Conspiracy<');
            expect(html).toContain('in the Conspiracy dataset');
        });

        test('mythology and esoteric are separate datasets and mark each other', () => {
            // They share the `mythology` facet field, which makes it tempting to
            // treat them as one dataset. They are two tabs, so a link between
            // them still moves the reader.
            const [link] = make().outbound({
                relatedEntities: { rituals: [{ id: 'samhain' }] },
            }, 'deities');

            expect(link.crossDomain).toBe(true);
            expect(link.domainLabel).toBe('Esoteric');
        });
    });

    describe('unknown collections', () => {
        test('a ref to a retired collection is unknown, not an exception', () => {
            const [link] = make().outbound({
                relatedEntities: { conspiracies: [{ id: 'stub', name: 'Dead Stub' }] },
            }, 'deities');

            expect(link.known).toBe(false);
            expect(link.crossDomain).toBe(false);
        });

        test('it renders as a dead name with no href', () => {
            const html = make().render({
                relatedEntities: { conspiracies: [{ id: 'stub', name: 'Dead Stub' }] },
            }, 'deities');

            expect(html).toContain('entity-connections__item--broken');
            expect(html).toContain('unresolved reference');
            expect(html).not.toContain('href="#/entity/conspiracies/stub"');
        });

        test('hrefFor returns no link for an unknown ref', () => {
            const c = make();
            expect(c.hrefFor({ known: false, collection: 'gone', id: 'x' })).toBe('');
        });
    });

    describe('link targets', () => {
        test('points at the two-segment entity route, which needs no facet', () => {
            // A reference carries collection and id only. The three-segment route
            // would need a facet value nobody has at link-render time, so using
            // it would mean either a wrong guess or a Firestore read per link.
            const [link] = make().outbound({
                relatedEntities: { hist_figures: [{ id: 'napoleon' }] },
            }, 'deities');

            expect(make().hrefFor(link)).toBe('#/entity/hist_figures/napoleon');
        });

        test('encodes an id containing characters that would break the hash', () => {
            const [link] = make().outbound({
                relatedEntities: { deities: [{ id: 'a/b c' }] },
            }, 'heroes');

            const href = make().hrefFor(link);
            expect(href).toBe('#/entity/deities/a%2Fb%20c');
        });
    });

    describe('rendering', () => {
        test('an entity with no links renders nothing at all', () => {
            // An empty "Connections" heading is worse than no heading.
            expect(make().render({}, 'deities')).toBe('');
            expect(make().render({ relatedEntities: {}, _backlinks: [] }, 'deities')).toBe('');
        });

        test('renders both directions under distinct headings', () => {
            const html = make().render({
                relatedEntities: { heroes: [{ id: 'heracles', name: 'Heracles' }] },
                _backlinks: [{ ref: 'texts/theogony', name: 'Theogony', collection: 'texts' }],
            }, 'deities');

            expect(html).toContain('Connections');
            expect(html).toContain('What links here');
            expect(html).toContain('Heracles');
            expect(html).toContain('Theogony');
        });

        test('escapes a name carrying markup', () => {
            const html = make().render({
                relatedEntities: { heroes: [{ id: 'x', name: '<img src=x onerror=alert(1)>' }] },
            }, 'deities');

            expect(html).not.toContain('<img');
            expect(html).toContain('&lt;img');
        });

        test('collapses the tail rather than rendering hundreds of chips', () => {
            const refs = Array.from({ length: 30 }, (_, i) => ({ id: `d${i}`, name: `D${i}` }));
            const html = new EntityConnections({ registry: DOMAINS, limit: 5 })
                .render({ relatedEntities: { heroes: refs } }, 'deities');

            expect(html).toContain('and 25 more');
        });

        test('the summary agrees in number with a single link', () => {
            const html = make().render({
                relatedEntities: { heroes: [{ id: 'heracles' }] },
            }, 'deities');

            expect(html).toContain('1 entity referenced by this one');
        });
    });
});
