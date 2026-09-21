/**
 * js/services/corpus-passage-index.js - the keyword -> ancient-text-passage
 * lookup a clicked corpusSearch chip actually needs. Uses small synthetic
 * fixtures shaped like the two real indexes (mythos/egyptian/corpus-index.json,
 * mythos/buddhist/corpus/buddhist_corpus_index.json) rather than the real
 * 1MB+ Buddhist file, so these stay fast and independent of that file's
 * exact current contents.
 */

require('../setup');

const { normalizeEgyptian, normalizeBuddhist } = require('../../js/services/corpus-passage-index.js');

const EGYPTIAN_FIXTURE = {
    ra: [
        {
            text_id: 'DEMO001',
            text_name: 'Hymn to Ra',
            citation: 'Pyramid Text 217',
            context: 'The great god Ra rises in the eastern horizon.',
            language: 'egyptian',
            url: 'https://example.com/ra'
        }
    ],
    osiris: [
        {
            text_id: 'REAL042',
            text_name: 'Book of the Dead',
            citation: 'Spell 125',
            full_verse: 'Osiris weighs the heart against the feather of Maat.',
            language: 'egyptian'
        }
    ]
};

const BUDDHIST_FIXTURE = {
    terms: {
        佛: {
            chinese: '佛',
            pinyin: 'fo',
            english: 'Buddha',
            occurrences: [
                {
                    sutra_name: '心經',
                    title_pinyin: 'Xin Jing',
                    version: 'Simplified',
                    line_number: '1',
                    context: 'The Buddha spoke of emptiness.',
                    chinese_line: '佛說空性'
                }
            ]
        }
    }
};

describe('normalizeEgyptian()', () => {
    test('one entry per term, aliases lowercased', () => {
        const entries = normalizeEgyptian(EGYPTIAN_FIXTURE);
        expect(entries).toHaveLength(2);
        expect(entries.map((e) => e.aliases[0]).sort()).toEqual(['osiris', 'ra']);
    });

    test('flags DEMO-prefixed text_id as demo data, real ids as not', () => {
        const entries = normalizeEgyptian(EGYPTIAN_FIXTURE);
        const ra = entries.find((e) => e.aliases.includes('ra'));
        const osiris = entries.find((e) => e.aliases.includes('osiris'));
        expect(ra.passages[0].demo).toBe(true);
        expect(osiris.passages[0].demo).toBe(false);
    });

    test('falls back to full_verse when context is absent', () => {
        const entries = normalizeEgyptian(EGYPTIAN_FIXTURE);
        const osiris = entries.find((e) => e.aliases.includes('osiris'));
        expect(osiris.passages[0].context).toBe('Osiris weighs the heart against the feather of Maat.');
    });

    test('returns an empty array for malformed input rather than throwing', () => {
        expect(normalizeEgyptian(null)).toEqual([]);
        expect(normalizeEgyptian('not an object')).toEqual([]);
    });
});

describe('normalizeBuddhist()', () => {
    test('aliases include the Chinese key, pinyin, and English gloss, all lowercased', () => {
        const [entry] = normalizeBuddhist(BUDDHIST_FIXTURE);
        expect(entry.aliases).toEqual(expect.arrayContaining(['佛', 'fo', 'buddha']));
    });

    test('builds a readable citation from line number and version', () => {
        const [entry] = normalizeBuddhist(BUDDHIST_FIXTURE);
        expect(entry.passages[0].citation).toBe('line 1 (Simplified)');
        expect(entry.passages[0].textName).toBe('Xin Jing');
    });

    test('returns an empty array when "terms" is missing', () => {
        expect(normalizeBuddhist({})).toEqual([]);
        expect(normalizeBuddhist(null)).toEqual([]);
    });
});

describe('CorpusPassageIndex.search() (via a stubbed fetch)', () => {
    let CorpusPassageIndex;

    beforeEach(() => {
        jest.resetModules();
        global.fetch = jest.fn((url) => {
            if (url.includes('egyptian')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(EGYPTIAN_FIXTURE) });
            }
            if (url.includes('buddhist')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(BUDDHIST_FIXTURE) });
            }
            return Promise.resolve({ ok: false });
        });
        require('../../js/services/corpus-passage-index.js');
        CorpusPassageIndex = window.CorpusPassageIndex;
    });

    afterEach(() => {
        delete global.fetch;
    });

    test('an exact English alias match returns the Buddhist passage', async () => {
        const results = await CorpusPassageIndex.search('Buddha');
        expect(results).toHaveLength(1);
        expect(results[0].source).toBe('buddhist');
        expect(results[0].context).toBe('The Buddha spoke of emptiness.');
    });

    test('an exact Egyptian term match returns only that term\'s passages', async () => {
        const results = await CorpusPassageIndex.search('ra');
        expect(results).toHaveLength(1);
        expect(results[0].source).toBe('egyptian');
        expect(results[0].demo).toBe(true);
    });

    test('a term with no match anywhere returns an empty array, not an error', async () => {
        const results = await CorpusPassageIndex.search('thor');
        expect(results).toEqual([]);
    });

    test('is case-insensitive', async () => {
        const results = await CorpusPassageIndex.search('OSIRIS');
        expect(results).toHaveLength(1);
    });

    test('a fetch failure on one source does not prevent matches from the other', async () => {
        global.fetch = jest.fn((url) => {
            if (url.includes('egyptian')) return Promise.reject(new Error('network down'));
            return Promise.resolve({ ok: true, json: () => Promise.resolve(BUDDHIST_FIXTURE) });
        });
        jest.resetModules();
        require('../../js/services/corpus-passage-index.js');
        const results = await window.CorpusPassageIndex.search('buddha');
        expect(results).toHaveLength(1);
        expect(results[0].source).toBe('buddhist');
    });

    test('loads each source at most once even across repeated searches', async () => {
        await CorpusPassageIndex.search('ra');
        await CorpusPassageIndex.search('buddha');
        await CorpusPassageIndex.search('osiris');
        expect(global.fetch).toHaveBeenCalledTimes(2); // one egyptian + one buddhist fetch, ever
    });
});
