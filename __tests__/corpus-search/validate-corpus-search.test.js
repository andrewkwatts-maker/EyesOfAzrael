/**
 * scripts/validate-corpus-search.js
 *
 * checkCorpusSearch() is tested against synthetic records (the whole point
 * is to catch shapes that don't otherwise occur, so real data alone
 * wouldn't exercise every branch). validatePassageIndexes() and
 * validateUrlContract() are tested against the real, committed files -
 * the same convention __tests__/css-loading.test.js uses for
 * scripts/build-css-bundle.js - because those two checks exist specifically
 * to catch a real regression in this repo, not a hypothetical one.
 */

const {
    checkCorpusSearch,
    validatePassageIndexes,
    validateUrlContract
} = require('../../scripts/validate-corpus-search.js');

describe('checkCorpusSearch()', () => {
    test('a well-formed corpusSearch object has no issues', () => {
        const issues = checkCorpusSearch({
            canonical: ['zeus'],
            variants: ['jupiter', 'zeus-primary-deity'],
            domains: ['sky', 'thunder']
        });
        expect(issues).toEqual([]);
    });

    test('flags a bare-string canonical field (the 14-entity bug found in the live data)', () => {
        const issues = checkCorpusSearch({ canonical: 'ptah' });
        expect(issues.length).toBe(1);
        expect(issues[0]).toMatch(/bare string/);
        expect(issues[0]).toMatch(/"ptah"/);
    });

    test('flags a non-string entry inside an array field', () => {
        const issues = checkCorpusSearch({ canonical: ['zeus', 42] });
        expect(issues.some((i) => i.includes('canonical[1]') && i.includes('number'))).toBe(true);
    });

    test('flags an empty-string entry inside an array field', () => {
        const issues = checkCorpusSearch({ canonical: ['zeus'], variants: ['   '] });
        expect(issues.some((i) => i.includes('variants[0]') && i.includes('empty'))).toBe(true);
    });

    test('flags a canonical field that resolves to zero usable terms', () => {
        const issues = checkCorpusSearch({ canonical: [] });
        expect(issues.some((i) => i.includes('no term a reader could ever click'))).toBe(true);
    });

    test('a field that is neither a string nor an array is flagged with its actual type', () => {
        const issues = checkCorpusSearch({ canonical: ['zeus'], domains: { sky: true } });
        expect(issues.some((i) => i.includes('"domains" is a object'))).toBe(true);
    });

    test('fields not present are not required - a sparse corpusSearch object is fine', () => {
        expect(checkCorpusSearch({ canonical: ['zeus'] })).toEqual([]);
    });
});

describe('validatePassageIndexes() against the real committed files', () => {
    let results;

    beforeAll(() => {
        results = validatePassageIndexes();
    });

    test('checks both known indexes', () => {
        expect(results.map((r) => r.id).sort()).toEqual(['buddhist', 'egyptian']);
    });

    test('both indexes are structurally valid', () => {
        for (const r of results) {
            if (!r.ok) throw new Error(`${r.id}: ${JSON.stringify(r.issues)}`);
        }
    });

    test('both indexes report a non-zero term and passage count', () => {
        for (const r of results) {
            expect(r.termCount).toBeGreaterThan(0);
            expect(r.passageCount).toBeGreaterThan(0);
        }
    });
});

describe('validateUrlContract() against the real committed files', () => {
    test('the ?q=/?term= contract holds: no issues', () => {
        const issues = validateUrlContract();
        expect(issues).toEqual([]);
    });
});
