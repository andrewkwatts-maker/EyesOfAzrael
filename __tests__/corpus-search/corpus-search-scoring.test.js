/**
 * CorpusSearch's pure scoring/matching/utility methods - the parts of the
 * class that take plain data in and return a score or a match list, with no
 * Firestore or DOM dependency. These were essentially untested (the class
 * as a whole sat at ~11% branch coverage before this file), which is real
 * risk on code that decides what a reader searching the corpus actually
 * sees, independent of the coverage-ratchet reason for writing it now.
 */

require('../setup');
require('../../js/components/corpus-search.js');

describe('CorpusSearch scoring and matching', () => {
    let search;

    beforeEach(() => {
        search = new window.CorpusSearch(null);
    });

    describe('calculateGenericScore()', () => {
        test('a name starting with the query scores highest', () => {
            const entity = { name: 'Zeus, King of Olympus' };
            const score = search.calculateGenericScore(entity, [], 'zeus');
            expect(score).toBe(1000);
        });

        test('a name merely containing the query scores lower than starting with it', () => {
            const starts = search.calculateGenericScore({ name: 'Zeus' }, [], 'zeus');
            const contains = search.calculateGenericScore({ name: 'Son of Zeus' }, [], 'zeus');
            expect(contains).toBeGreaterThan(0);
            expect(contains).toBeLessThan(starts);
        });

        test('adds points for description, subtitle, searchTerms and tags matches', () => {
            const entity = {
                name: 'Irrelevant',
                description: 'a story about zeus',
                subtitle: 'zeus the thunderer',
                searchTerms: ['zeus'],
                tags: ['zeus']
            };
            expect(search.calculateGenericScore(entity, [], 'zeus')).toBe(150 + 100 + 120 + 90);
        });

        test('an empty query contributes no query-specific score', () => {
            expect(search.calculateGenericScore({ name: 'Zeus' }, [], '')).toBe(0);
        });

        test('secondary tokens add smaller bonuses, skipping the primary query token', () => {
            const entity = { name: 'zeus the sky father', description: 'greek myth', searchTerms: ['sky'] };
            const score = search.calculateGenericScore(entity, ['zeus', 'sky'], 'zeus');
            // "zeus" token is skipped (=== rawQuery); "sky" matches name (+50) and searchTerms (+40)
            expect(score).toBe(1000 + 50 + 40);
        });

        test('handles an entity with none of the optional fields present', () => {
            expect(search.calculateGenericScore({}, ['x'], 'x')).toBe(0);
        });
    });

    describe('_fuzzyMatch()', () => {
        test('matches when query characters appear in order, not necessarily contiguous', () => {
            expect(search._fuzzyMatch('zeus', 'zs')).toBe(true);
            expect(search._fuzzyMatch('poseidon', 'psdn')).toBe(true);
        });

        test('does not match when a query character is out of order', () => {
            expect(search._fuzzyMatch('zeus', 'sz')).toBe(false);
        });

        test('does not match when the string is exhausted before the query is', () => {
            expect(search._fuzzyMatch('ze', 'zeus')).toBe(false);
        });
    });

    describe('calculateFuzzyScore()', () => {
        test('scores a fuzzy name match', () => {
            const score = search.calculateFuzzyScore({ name: 'Zeus' }, [], 'zs');
            expect(score).toBeGreaterThanOrEqual(40);
        });

        test('a query shorter than 2 characters contributes no fuzzy-name score', () => {
            expect(search.calculateFuzzyScore({ name: 'Zeus' }, [], 'z')).toBe(0);
        });

        test('counts substring occurrences across the whole serialized entity for tier 5', () => {
            const entity = { name: 'Irrelevant', note: 'thunder thunder thunder' };
            const score = search.calculateFuzzyScore(entity, ['thunder'], '');
            expect(score).toBe(3 * 2); // 3 occurrences * weight 2
        });

        test('ignores search terms shorter than 2 characters in tier 5', () => {
            expect(search.calculateFuzzyScore({ name: 'a' }, ['a'], '')).toBe(0);
        });

        test('escapes regex special characters in a search term rather than throwing', () => {
            expect(() => search.calculateFuzzyScore({ name: 'C++' }, ['c++'], '')).not.toThrow();
        });
    });

    describe('calculateLanguageScore()', () => {
        const languages = {
            originalName: 'Ζεύς',
            transliteration: 'Zeus',
            alternateNames: { latin: 'Iuppiter', norse: 'Odin' },
            variants: ['Zeu', 'Zeous']
        };

        test('scores an original-name match', () => {
            expect(search.calculateLanguageScore(languages, 'Ζεύς')).toBeGreaterThanOrEqual(100);
        });

        test('scores a transliteration match', () => {
            expect(search.calculateLanguageScore({ transliteration: 'Zeus' }, 'zeus')).toBe(80);
        });

        test('an alternate-name match scores higher when it matches the requested target language', () => {
            const untargeted = search.calculateLanguageScore(languages, 'iuppiter');
            const targeted = search.calculateLanguageScore(languages, 'iuppiter', 'latin');
            expect(targeted).toBeGreaterThan(untargeted);
        });

        test('an alternate name in a language other than the target is not scored', () => {
            expect(search.calculateLanguageScore(languages, 'odin', 'latin')).toBe(0);
        });

        test('an exact variant match scores higher than a partial one', () => {
            const exact = search.calculateLanguageScore({ variants: ['zeu'] }, 'zeu');
            const partial = search.calculateLanguageScore({ variants: ['zeus-primary'] }, 'zeus');
            expect(exact).toBe(70);
            expect(partial).toBe(50);
        });

        test('an entity with no language fields at all scores 0', () => {
            expect(search.calculateLanguageScore({}, 'zeus')).toBe(0);
        });
    });

    describe('calculateSourceScore()', () => {
        test('scores matches across primary texts, secondary sources and archaeological evidence', () => {
            const sources = {
                primaryTexts: [{ title: 'The Iliad', author: 'Homer', citations: ['Book 1'] }],
                secondarySources: [{ title: 'Greek Myths', author: 'Graves' }],
                archeologicalEvidence: [{ name: 'Parthenon frieze', location: 'Athens' }]
            };
            const score = search.calculateSourceScore(sources, ['iliad']);
            expect(score).toBeGreaterThan(0);
        });

        test('an empty sources object scores 0 for any term', () => {
            expect(search.calculateSourceScore({}, ['zeus'])).toBe(0);
        });
    });

    describe('getMatchedFields()', () => {
        test('reports every field that matched at least one term', () => {
            const entity = { name: 'Zeus', description: 'sky father', subtitle: 'king of gods' };
            expect(search.getMatchedFields(entity, ['zeus'])).toEqual(['name']);
            expect(search.getMatchedFields(entity, ['sky'])).toEqual(['description']);
            expect(search.getMatchedFields(entity, ['king'])).toEqual(['subtitle']);
        });

        test('returns an empty array when nothing matches, without throwing on missing fields', () => {
            expect(search.getMatchedFields({}, ['zeus'])).toEqual([]);
        });
    });

    describe('getMatchedLanguage()', () => {
        test('collects every alternate-name language that matched, ignoring target when none given', () => {
            const languages = { alternateNames: { latin: 'Iuppiter', norse: 'Odin' } };
            const matched = search.getMatchedLanguage(languages, 'iup');
            expect(matched).toEqual({ latin: 'Iuppiter' });
        });

        test('returns an empty object when nothing matches', () => {
            expect(search.getMatchedLanguage({}, 'zeus')).toEqual({});
        });
    });

    describe('getMatchedSources()', () => {
        test('collects only the sources whose title or author matched', () => {
            const sources = {
                primaryTexts: [
                    { title: 'The Iliad', author: 'Homer' },
                    { title: 'Unrelated Text', author: 'Nobody' }
                ]
            };
            const matched = search.getMatchedSources(sources, ['iliad']);
            expect(matched.primaryTexts).toHaveLength(1);
            expect(matched.secondarySources).toEqual([]);
            expect(matched.archeologicalEvidence).toEqual([]);
        });
    });

    describe('sortResults()', () => {
        const results = () => ([
            { name: 'B', _searchScore: 10, importance: 20, popularity: 30, sortName: 'b' },
            { name: 'A', _searchScore: 30, importance: 40, popularity: 10, sortName: 'a' },
            { name: 'C', _searchScore: 20, importance: 10, popularity: 50, sortName: 'c' }
        ]);

        test('sorts by relevance (search score) descending', () => {
            const sorted = search.sortResults(results(), 'relevance');
            expect(sorted.map((r) => r.name)).toEqual(['A', 'C', 'B']);
        });

        test('sorts by importance descending', () => {
            const sorted = search.sortResults(results(), 'importance');
            expect(sorted.map((r) => r.name)).toEqual(['A', 'B', 'C']);
        });

        test('sorts by popularity descending', () => {
            const sorted = search.sortResults(results(), 'popularity');
            expect(sorted.map((r) => r.name)).toEqual(['C', 'B', 'A']);
        });

        test('sorts by name (sortName preferred over name) ascending', () => {
            const sorted = search.sortResults(results(), 'name');
            expect(sorted.map((r) => r.name)).toEqual(['A', 'B', 'C']);
        });

        test('an unrecognised sort key returns the list unchanged', () => {
            const original = results();
            expect(search.sortResults(original, 'nonsense')).toBe(original);
        });

        test('missing score/importance/popularity fields fall back to sane defaults rather than throwing', () => {
            expect(() => search.sortResults([{ name: 'X' }, { name: 'Y' }], 'relevance')).not.toThrow();
        });
    });

    describe('tokenize()', () => {
        test('lowercases, splits on whitespace/commas/semicolons, and strips punctuation', () => {
            expect(search.tokenize('Zeus, King; of OLYMPUS!')).toEqual(['zeus', 'king', 'of', 'olympus']);
        });

        test('drops tokens that become empty after stripping punctuation', () => {
            expect(search.tokenize('zeus ---  ,, odin')).toEqual(['zeus', 'odin']);
        });
    });

    describe('getCacheKey()', () => {
        test('two calls with the same query and options produce the same key', () => {
            const a = search.getCacheKey('zeus', { mode: 'generic', limit: 10 });
            const b = search.getCacheKey('zeus', { mode: 'generic', limit: 10 });
            expect(a).toBe(b);
        });

        test('a different option produces a different key', () => {
            const a = search.getCacheKey('zeus', { mode: 'generic' });
            const b = search.getCacheKey('zeus', { mode: 'term' });
            expect(a).not.toBe(b);
        });
    });

    describe('clearCache()', () => {
        test('empties the search cache', () => {
            search.searchCache.set('key', { results: {}, timestamp: Date.now() });
            expect(search.searchCache.size).toBe(1);
            search.clearCache();
            expect(search.searchCache.size).toBe(0);
        });
    });
});
