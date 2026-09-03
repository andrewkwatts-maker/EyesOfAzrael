/**
 * Broken-reference fixer — planning and rewriting
 *
 * This script edits 500+ committed source files unattended, so what it declines
 * to do matters more than what it does. Every guard below exists because the
 * corresponding mistake would produce a reference that is still broken but no
 * longer reported — the one outcome worse than leaving it alone.
 */

const { planFixes, rewriteEntity } = require('../../scripts/fix-broken-references.js');

/** A collection map shaped like the export's, from bare ids. */
function collections(spec) {
    return new Map(Object.entries(spec).map(([c, ids]) => [c, ids.map(id => ({ id }))]));
}

describe('planFixes', () => {
    test('repairs a target found in exactly one other collection', () => {
        const { fixes, declined } = planFixes(
            [{ from: 'deities/zeus', to: 'deities/heracles', reason: 'wrong collection', foundIn: ['heroes'] }],
            collections({ deities: ['zeus'], heroes: ['heracles'] })
        );

        expect(fixes.get('deities/heracles')).toBe('heroes/heracles');
        expect(declined).toHaveLength(0);
    });

    test('declines when two collections hold the id', () => {
        // Picking one would be a guess, and a guess that rewrites content
        // silently is worse than a break a human can still see reported.
        const { fixes, declined } = planFixes(
            [{ from: 'deities/zeus', to: 'deities/apollo', reason: 'wrong collection', foundIn: ['heroes', 'concepts'] }],
            collections({ deities: ['zeus'], heroes: ['apollo'], concepts: ['apollo'] })
        );

        expect(fixes.size).toBe(0);
        expect(declined[0].reason).toBe('ambiguous target');
        expect(declined[0].foundIn).toEqual(['heroes', 'concepts']);
    });

    test('declines a case-only match rather than writing a still-broken ref', () => {
        // The export indexes ids case-insensitively to spot the near-miss.
        // Writing `heroes/Heracles` back when the entity is `heroes/heracles`
        // would stop the report without fixing anything.
        const { fixes, declined } = planFixes(
            [{ from: 'deities/zeus', to: 'deities/Heracles', reason: 'wrong collection', foundIn: ['heroes'] }],
            collections({ deities: ['zeus'], heroes: ['heracles'] })
        );

        expect(fixes.size).toBe(0);
        expect(declined[0].reason).toBe('case mismatch in target id');
    });

    test('declines a target that exists in no collection at all', () => {
        const { fixes, declined } = planFixes(
            [{ from: 'deities/zeus', to: 'deities/nobody', reason: 'no such entity' }],
            collections({ deities: ['zeus'] })
        );

        expect(fixes.size).toBe(0);
        expect(declined[0].reason).toBe('no such entity');
    });

    test('declines a destination the domain registry does not know', () => {
        // Moving a reference into a collection nothing serves trades one broken
        // link for another.
        const { fixes, declined } = planFixes(
            [{ from: 'deities/zeus', to: 'deities/censer', reason: 'wrong collection', foundIn: ['spiritual-items'] }],
            collections({ deities: ['zeus'], 'spiritual-items': ['censer'] })
        );

        expect(fixes.size).toBe(0);
        expect(declined[0].reason).toBe('target collection not in the domain registry');
    });

    test('decides once per target however many entities point at it', () => {
        const { fixes, declined } = planFixes(
            [
                { from: 'deities/a', to: 'deities/heracles', reason: 'wrong collection', foundIn: ['heroes'] },
                { from: 'deities/b', to: 'deities/heracles', reason: 'wrong collection', foundIn: ['heroes'] },
                { from: 'texts/c', to: 'deities/heracles', reason: 'wrong collection', foundIn: ['heroes'] },
            ],
            collections({ deities: ['a', 'b'], heroes: ['heracles'], texts: ['c'] })
        );

        expect(fixes.size).toBe(1);
        expect(declined).toHaveLength(0);
    });

    test('a declined target reports who pointed at it', () => {
        const { declined } = planFixes(
            [
                { from: 'deities/a', to: 'deities/ghost', reason: 'no such entity' },
                { from: 'deities/b', to: 'deities/ghost', reason: 'no such entity' },
            ],
            collections({ deities: ['a', 'b'] })
        );

        expect(declined[0].referenceCount).toBe(2);
        expect(declined[0].referencedBy).toEqual(['deities/a', 'deities/b']);
    });

    test('repairs a reference that crosses into another domain', () => {
        const { fixes } = planFixes(
            [{ from: 'deities/zeus', to: 'deities/napoleon', reason: 'wrong collection', foundIn: ['hist_figures'] }],
            collections({ deities: ['zeus'], hist_figures: ['napoleon'] })
        );

        expect(fixes.get('deities/napoleon')).toBe('hist_figures/napoleon');
    });
});

describe('rewriteEntity', () => {
    const fixes = new Map([['deities/heracles', 'heroes/heracles']]);

    test('moves the ref out of the wrong collection and into the right one', () => {
        const entity = {
            id: 'zeus',
            relatedEntities: {
                deities: [{ id: 'hera' }, { id: 'heracles', name: 'Heracles', relationship: 'son' }],
            },
        };

        const moves = rewriteEntity(entity, fixes);

        expect(entity.relatedEntities.deities).toEqual([{ id: 'hera' }]);
        expect(entity.relatedEntities.heroes).toEqual([
            { id: 'heracles', name: 'Heracles', relationship: 'son' },
        ]);
        expect(moves).toEqual([{ from: 'deities/heracles', to: 'heroes/heracles', duplicate: false }]);
    });

    test('preserves the relationship metadata the ref carried', () => {
        const entity = {
            relatedEntities: { deities: [{ id: 'heracles', relationship: 'son' }] },
        };
        rewriteEntity(entity, fixes);
        expect(entity.relatedEntities.heroes[0].relationship).toBe('son');
    });

    test('handles a bare id string as well as an object', () => {
        const entity = { relatedEntities: { deities: ['heracles'] } };
        rewriteEntity(entity, fixes);
        expect(entity.relatedEntities.heroes).toEqual(['heracles']);
    });

    test('does not duplicate a link the destination already has', () => {
        const entity = {
            relatedEntities: {
                deities: [{ id: 'heracles' }],
                heroes: [{ id: 'heracles', name: 'Heracles' }],
            },
        };

        const moves = rewriteEntity(entity, fixes);

        expect(entity.relatedEntities.heroes).toHaveLength(1);
        expect(entity.relatedEntities.deities).toBeUndefined();
        expect(moves[0].duplicate).toBe(true);
    });

    test('drops a collection key emptied by the move', () => {
        const entity = { relatedEntities: { deities: [{ id: 'heracles' }] } };
        rewriteEntity(entity, fixes);
        expect(entity.relatedEntities.deities).toBeUndefined();
    });

    test('leaves an entity with no repairable references untouched', () => {
        const entity = { relatedEntities: { deities: [{ id: 'hera' }] } };
        const before = JSON.stringify(entity);

        expect(rewriteEntity(entity, fixes)).toEqual([]);
        expect(JSON.stringify(entity)).toBe(before);
    });

    test('tolerates a malformed relatedEntities rather than throwing', () => {
        expect(rewriteEntity({ relatedEntities: ['deities/x'] }, fixes)).toEqual([]);
        expect(rewriteEntity({ relatedEntities: 'nope' }, fixes)).toEqual([]);
        expect(rewriteEntity({ relatedEntities: { deities: 'nope' } }, fixes)).toEqual([]);
        expect(rewriteEntity({}, fixes)).toEqual([]);
        expect(rewriteEntity(null, fixes)).toEqual([]);
    });

    test('keeps a ref carrying no id instead of dropping it', () => {
        // A malformed ref is someone's data. Silently deleting it during an
        // unrelated repair would be a second bug hiding inside the first.
        const entity = { relatedEntities: { deities: [{ name: 'nameless' }] } };
        rewriteEntity(entity, fixes);
        expect(entity.relatedEntities.deities).toEqual([{ name: 'nameless' }]);
    });
});
