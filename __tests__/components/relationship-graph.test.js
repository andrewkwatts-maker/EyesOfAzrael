/**
 * RelationshipGraph — the relationship each node actually stands in
 *
 * The corpus stores relationships as `companions`, `enemies` and `allies`:
 * arrays of { name, relationship, description }, on 7,127 of 13,585 entities.
 * Two things threw the relationship away.
 *
 * The container key is plural and this.relationshipTypes is keyed singular, so
 * every lookup missed and fell through to `default` — one grey "Connected"
 * label and one colour for every relationship on the site. And each item
 * carries its own, more specific word ("protector", "helper", "animal",
 * "mount"), which nothing read; across the corpus that is 25,344 values over
 * 826 distinct words, and the four above are among the most common while none
 * of them is in the taxonomy.
 */

require('../../js/components/relationship-graph.js');

const makeGraph = () => new window.RelationshipGraph();

describe('RelationshipGraph.resolveRelationshipType', () => {
    let g;
    beforeEach(() => { g = makeGraph(); });

    test('the item\'s own relationship wins over the container it is stored in', () => {
        // "protector" is not in the taxonomy, but it is the real datum;
        // collapsing it to the container's "companion" loses the distinction.
        expect(g.resolveRelationshipType('companions', { relationship: 'protector' })).toBe('protector');
        expect(g.resolveRelationshipType('companions', { relationship: 'animal' })).toBe('animal');
    });

    test('a taxonomy word in the item is used as the taxonomy spells it', () => {
        expect(g.resolveRelationshipType('companions', { relationship: 'Ally' })).toBe('ally');
        expect(g.resolveRelationshipType('companions', { relationship: ' ENEMY ' })).toBe('enemy');
    });

    test('a plural container key resolves to its singular', () => {
        expect(g.resolveRelationshipType('companions', {})).toBe('companion');
        expect(g.resolveRelationshipType('consorts', {})).toBe('consort');
        expect(g.resolveRelationshipType('siblings', {})).toBe('sibling');
    });

    test('an -ies plural resolves to -y, not to a truncated stem', () => {
        // Trimming a trailing "s" gives "enemie"/"allie", which match nothing.
        expect(g.resolveRelationshipType('enemies', {})).toBe('enemy');
        expect(g.resolveRelationshipType('allies', {})).toBe('ally');
    });

    test('irregular plurals the extractor collects are handled', () => {
        expect(g.resolveRelationshipType('children', {})).toBe('child');
        expect(g.resolveRelationshipType('parents', {})).toBe('parent');
    });

    test('a string item falls back to the container key', () => {
        expect(g.resolveRelationshipType('enemies', 'Typhon')).toBe('enemy');
    });

    test('an unrecognised container key is kept rather than discarded', () => {
        expect(g.resolveRelationshipType('worshippers', {})).toBe('worshipper');
        expect(g.resolveRelationshipType('mounts', {})).toBe('mounts');
    });
});

describe('RelationshipGraph.render with corpus-shaped data', () => {
    let g;
    beforeEach(() => { g = makeGraph(); });

    const entity = {
        id: 'ankou',
        name: 'Ankou',
        companions: [
            { name: 'Kerber', relationship: 'animal', description: 'A spectral black dog.' },
            { name: 'Itzamna', relationship: 'protector', description: 'Offers guidance.' }
        ],
        enemies: [{ name: 'Typhon', relationship: 'enemy' }]
    };

    test('draws a node for every named relation plus the central entity', () => {
        const html = g.render(entity);
        expect(html).not.toContain('No relationships to display');
        expect(html).toContain('data-node-count="4"');
    });

    test('each node carries its own relationship, not the container name', () => {
        const html = g.render(entity);
        const rels = [...html.matchAll(/data-relationship="([^"]+)"/g)].map((m) => m[1]);
        expect(rels).toEqual(expect.arrayContaining(['animal', 'protector', 'enemy']));
        expect(rels).not.toContain('companions');
    });

    test('a relationship the taxonomy does not name is labelled with its own word', () => {
        // Rather than the default "Connected".
        const html = g.render(entity);
        expect(html).toContain('Protector');
        expect(html).not.toContain('Connected');
    });

    test('a taxonomy relationship keeps its configured label', () => {
        expect(g.render(entity)).toContain('Enemy');
    });

    test('reports the empty state when the entity has no relationships', () => {
        expect(g.render({ id: 'x', name: 'X' })).toContain('No relationships to display');
    });

    test('escapes a relation name carrying markup', () => {
        const html = g.render({
            id: 'x',
            name: 'X',
            companions: [{ name: '<img src=x onerror=alert(1)>', relationship: 'ally' }]
        });
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    test('tolerates string relations alongside object ones', () => {
        const html = g.render({
            id: 'x',
            name: 'X',
            enemies: ['Typhon', { name: 'Echidna', relationship: 'rival' }]
        });
        expect(html).toContain('data-node-count="3"');
        expect(html).toContain('Typhon');
        expect(html).toContain('Echidna');
    });

    test('skips entries that name nobody instead of drawing blank nodes', () => {
        const html = g.render({
            id: 'x',
            name: 'X',
            companions: [{ name: 'Real', relationship: 'ally' }, {}, null]
        });
        expect(html).toContain('data-node-count="2"');
    });
});

describe('RelationshipGraph.titleCaseRelationship', () => {
    let g;
    beforeEach(() => { g = makeGraph(); });

    test('renders a stored word as a readable label', () => {
        expect(g.titleCaseRelationship('protector')).toBe('Protector');
        expect(g.titleCaseRelationship('associated deity')).toBe('Associated Deity');
        expect(g.titleCaseRelationship('foster_parent')).toBe('Foster Parent');
    });

    test('falls back to the default label when there is no word', () => {
        expect(g.titleCaseRelationship('')).toBe('Connected');
        expect(g.titleCaseRelationship(null)).toBe('Connected');
    });
});
