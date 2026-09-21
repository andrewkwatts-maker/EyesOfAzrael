/**
 * CorpusSearch term scoring - real class, not the mock reimplementation in
 * corpus-system.test.js.
 *
 * `corpus.canonical` is an array (["zeus"]) on ~23,800 entities but a bare
 * string ("zeus") on 26 of them (a data-shape bug scripts/validate-corpus-search.js
 * now catches). calculateCorpusScore() and getMatchedCorpusTerms() used to
 * compare the raw field to the search string with `===`, which is never true
 * for an array - the "exact canonical match" branch was dead code on every
 * one of the ~23,800 well-formed entities, and did an unintended *substring*
 * match on the 26 malformed ones (String.prototype.includes vs
 * Array.prototype.includes are different operations). These tests hold the
 * fix in place: canonicalTerms() normalises both shapes, and an exact
 * canonical match scores higher than a mere variant/domain/symbol hit
 * regardless of which shape the record happens to have.
 */

require('../setup');
require('../../js/components/corpus-search.js');

describe('CorpusSearch corpus-term scoring', () => {
    let search;

    beforeEach(() => {
        search = new window.CorpusSearch(null);
    });

    describe('canonicalTerms()', () => {
        test('returns the array unchanged when canonical is already an array', () => {
            expect(search.canonicalTerms({ canonical: ['zeus', 'zeus-primary-deity'] }))
                .toEqual(['zeus', 'zeus-primary-deity']);
        });

        test('wraps a bare string into a one-element array', () => {
            expect(search.canonicalTerms({ canonical: 'ptah' })).toEqual(['ptah']);
        });

        test('returns an empty array when canonical is missing', () => {
            expect(search.canonicalTerms({})).toEqual([]);
            expect(search.canonicalTerms(null)).toEqual([]);
        });
    });

    describe('calculateCorpusScore()', () => {
        test('an exact canonical match scores higher than a variant match', () => {
            const exact = search.calculateCorpusScore({ canonical: ['zeus'] }, 'zeus');
            const variant = search.calculateCorpusScore({ canonical: ['zeus'], variants: ['jupiter'] }, 'jupiter');
            expect(exact).toBeGreaterThan(variant);
        });

        test('an exact match on a STRING-shaped canonical field scores the same as an array-shaped one', () => {
            const arrayShape = search.calculateCorpusScore({ canonical: ['ptah'] }, 'ptah');
            const stringShape = search.calculateCorpusScore({ canonical: 'ptah' }, 'ptah');
            expect(stringShape).toBe(arrayShape);
            expect(stringShape).toBeGreaterThan(0);
        });

        test('a substring-only match on the canonical name scores lower than an exact one', () => {
            const substringScore = search.calculateCorpusScore({ canonical: ['zeus'] }, 'zeu');
            const exactScore = search.calculateCorpusScore({ canonical: ['zeus'] }, 'zeus');
            expect(substringScore).toBeGreaterThan(0);
            expect(exactScore).toBeGreaterThan(substringScore);
        });

        test('returns 0 for a term that matches nothing', () => {
            expect(search.calculateCorpusScore({ canonical: ['zeus'], variants: ['jupiter'] }, 'anubis')).toBe(0);
        });
    });

    describe('getMatchedCorpusTerms()', () => {
        test('reports type "canonical" for an exact canonical hit, array-shaped', () => {
            const matched = search.getMatchedCorpusTerms({ canonical: ['zeus'] }, 'zeus');
            expect(matched.type).toBe('canonical');
            expect(matched.terms).toEqual(['zeus']);
        });

        test('reports type "canonical" for an exact canonical hit, string-shaped', () => {
            const matched = search.getMatchedCorpusTerms({ canonical: 'ptah' }, 'ptah');
            expect(matched.type).toBe('canonical');
            expect(matched.terms).toEqual(['ptah']);
        });

        test('falls back to type "variants" when only a variant matches', () => {
            const matched = search.getMatchedCorpusTerms({ canonical: ['zeus'], variants: ['jupiter'] }, 'jupiter');
            expect(matched.type).toBe('variants');
            expect(matched.terms).toContain('jupiter');
        });
    });
});
