/**
 * Static base — the card projection
 *
 * `_all.json` answers "list this collection" by shipping whole entities, and the
 * browse grid then draws cards and slices to 500. For `concepts` that is 38.7 MB
 * downloaded to render 500 cards. `_cards.json` carries the same fields the grid
 * reads, in full, at 9.0 MB.
 *
 * Two failure modes are worth more than the saving, and both are pinned here:
 *
 * 1. A field the browse view reads but the projection drops reads `undefined`
 *    for every entity — a blank column, not an error. The field list is checked
 *    against the view's own source so adding a read without adding the field is
 *    a test failure.
 * 2. A client requesting `_cards.json` from a base that predates it gets a 404
 *    on every page view. The loader must therefore ask the manifest, not guess.
 */

const fs = require('fs');
const path = require('path');

const { toCard, CARD_FIELDS } = require('../../scripts/export-static-base.js');

describe('card projection', () => {
    test('keeps every field it declares and drops the rest', () => {
        const card = toCard({
            id: 'zeus',
            name: 'Zeus',
            mythology: 'greek',
            description: 'King of the gods',
            relatedEntities: { heroes: [{ id: 'heracles' }] },
            _backlinks: [{ ref: 'texts/theogony' }],
            sources: ['Hesiod'],
        });

        expect(card).toEqual({
            id: 'zeus',
            name: 'Zeus',
            mythology: 'greek',
            description: 'King of the gods',
        });
    });

    test('drops the heavy fields that make _all.json large', () => {
        const card = toCard({
            id: 'x',
            name: 'X',
            relatedEntities: {},
            _backlinks: [],
            sources: [],
            associations: [],
        });

        expect(card.relatedEntities).toBeUndefined();
        expect(card._backlinks).toBeUndefined();
        expect(card.sources).toBeUndefined();
        expect(card.associations).toBeUndefined();
    });

    test('copies values whole rather than truncating them', () => {
        // The grid's own search filters on `description`. Shortening it here
        // would quietly change which entities a reader can find, which is a
        // bigger cost than the extra bytes.
        const long = 'a'.repeat(5000);
        expect(toCard({ id: 'x', description: long }).description).toBe(long);
    });

    test('omits an absent field instead of writing undefined', () => {
        const card = toCard({ id: 'x', name: 'X' });
        expect(Object.prototype.hasOwnProperty.call(card, 'icon')).toBe(false);
    });

    test('carries the facet field of every domain', () => {
        // A card missing its facet cannot be grouped, filtered or sorted, and
        // the grid would silently collapse the whole collection into "unknown".
        expect(CARD_FIELDS).toContain('mythology');   // mythology + esoteric
        expect(CARD_FIELDS).toContain('era');         // history
        expect(CARD_FIELDS).toContain('category');    // conspiracy

        expect(toCard({ id: 'a', era: 'medieval' }).era).toBe('medieval');
        expect(toCard({ id: 'b', category: 'political' }).category).toBe('political');
    });

    test('covers every entity field the browse view reads', () => {
        // Read the view's source rather than restating a list, so a new
        // `entity.something` in the grid fails here instead of rendering blank.
        const source = fs.readFileSync(
            path.join(__dirname, '..', '..', 'js', 'views', 'browse-category-view.js'),
            'utf8'
        );

        const read = new Set(
            (source.match(/\bentity\.[a-zA-Z_][a-zA-Z0-9_]*/g) || [])
                .map(m => m.slice('entity.'.length))
        );

        // Fields the view computes onto entities itself, never read from the
        // base, so they have no business travelling in the payload.
        const derived = new Set(['_popularity', '_dateAdded']);

        const missing = [...read].filter(f => !derived.has(f) && !CARD_FIELDS.includes(f));
        expect(missing).toEqual([]);
    });
});

describe('EntityBaseLoader chooses cards only when the manifest offers them', () => {
    let EntityBaseLoader;

    beforeEach(() => {
        jest.resetModules();
        global.localStorage = {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
        };
        EntityBaseLoader = require('../../js/services/entity-base-loader.js');
    });

    /** A loader with a stubbed manifest, recording which URL it fetches. */
    function loaderWith(collMeta) {
        const loader = new EntityBaseLoader();
        loader._manifest = {
            version: 'v1',
            generatedAt: '2026-01-01T00:00:00.000Z',
            collections: { deities: collMeta },
        };

        const fetched = [];
        global.fetch = jest.fn(url => {
            fetched.push(url);
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 'zeus', name: 'Zeus' }]),
            });
        });

        return { loader, fetched };
    }

    test('reads _cards.json when the manifest declares cards', async () => {
        const { loader, fetched } = loaderWith({ total: 1, facets: ['greek'], cards: true });

        await loader.load('deities', null);

        expect(fetched[0]).toBe('/static/entities/deities/_cards.json');
    });

    test('falls back to _all.json for a base that predates cards', async () => {
        // The deployed base has no `_cards.json`. Guessing would cost every
        // visitor a 404 before the real fetch.
        const { loader, fetched } = loaderWith({ total: 1, mythologies: ['greek'] });

        await loader.load('deities', null);

        expect(fetched[0]).toBe('/static/entities/deities/_all.json');
    });

    test('a faceted request is unaffected and still reads its shard', async () => {
        const { loader, fetched } = loaderWith({ total: 1, facets: ['greek'], cards: true });

        await loader.load('deities', 'greek');

        expect(fetched[0]).toBe('/static/entities/deities/greek.json');
    });
});
