/**
 * Keyword -> ancient-text-passage lookup.
 *
 * WHY THIS EXISTS
 *
 * Every entity carries `corpusSearch.canonical`/`.variants` (e.g. deities/
 * germanic.json's "berchta" carries ["berchta"] and ["perchta", "bertha",
 * "frau perchta", "stampa"]), and schema-section-renderer.js's
 * renderCorpusSearch() already turns each one into a clickable chip linking
 * to `/corpus-explorer.html?term=<word>`. What corpus-explorer.html did with
 * that term was search OTHER ENTITY RECORDS (deities, heroes, "texts" - which
 * are encyclopedia articles about a text, not the text itself) - never an
 * actual quoted ancient-text passage with a citation. Clicking a keyword
 * never actually surfaced the thing its own label promised: a passage.
 *
 * Two real keyword -> passage indexes already exist in the repo, unused by
 * anything except an orphaned per-mythology page (see
 * mythos/*\/corpus-search.html, which references a corpus-search-core.js
 * that isn't even at the path they load it from):
 *
 *   - mythos/egyptian/corpus-index.json - 11 terms (ra, osiris, isis, ...),
 *     each an array of {text_name, citation, context, full_verse,
 *     translation, language, metadata, url}. Its `text_id` values are all
 *     "DEMO00N" - almost certainly placeholder/demonstration data rather
 *     than a finished import, and is surfaced as such (see `demo` on each
 *     result below) rather than presented as equivalent to the Buddhist set.
 *   - mythos/buddhist/corpus/buddhist_corpus_index.json - 23 real terms
 *     (Chinese character, pinyin, English gloss), each with an `occurrences`
 *     array citing a real sutra name, version, line number and the actual
 *     line text in Chinese and pinyin.
 *
 * This module normalises both into one shape and searches them by the same
 * term a reader just clicked. It is intentionally small and additive: it
 * does not touch corpus-explorer.js's existing entity-search pipeline
 * (performSearch/renderResults/applyFilters, all of which assume entity-
 * shaped records), so a passage lookup failing can never break the entity
 * search results a reader already relies on. It also does not touch
 * Firestore - both source files are static and public, fetched only when a
 * search actually runs, not on every page load.
 *
 * HONEST LIMITS
 *
 * Two mythologies, 34 keyword entries total, out of an encyclopedia with
 * corpusSearch terms on ~23,800 entities. Most keyword clicks will find no
 * passage match here - `hasAny` and the panel below both make that
 * explicit rather than implying broader coverage than exists. Extending
 * coverage means building more indexes in this same shape, not touching
 * this file.
 */

(function () {
    const SOURCES = [
        {
            id: 'egyptian',
            label: 'Egyptian texts',
            url: '/mythos/egyptian/corpus-index.json',
            normalize: normalizeEgyptian
        },
        {
            id: 'buddhist',
            label: 'Buddhist sutras',
            url: '/mythos/buddhist/corpus/buddhist_corpus_index.json',
            normalize: normalizeBuddhist
        }
    ];

    /** [{ aliases: string[] (lowercase), passages: NormalizedPassage[] }] */
    function normalizeEgyptian(raw) {
        if (!raw || typeof raw !== 'object') return [];
        return Object.entries(raw).map(([term, entries]) => ({
            aliases: [String(term).toLowerCase()],
            passages: (Array.isArray(entries) ? entries : []).map((p) => ({
                source: 'egyptian',
                demo: String(p.text_id || '').startsWith('DEMO'),
                textName: p.text_name || 'Untitled text',
                citation: p.citation || null,
                context: p.context || p.full_verse || '',
                translation: p.translation || null,
                language: p.language || 'egyptian',
                url: p.url || null,
                matchedTerm: term
            }))
        }));
    }

    function normalizeBuddhist(raw) {
        const terms = raw && raw.terms;
        if (!terms || typeof terms !== 'object') return [];
        return Object.entries(terms).map(([chineseKey, entry]) => {
            const aliases = [chineseKey, entry.pinyin, entry.english]
                .filter(Boolean)
                .map((a) => String(a).toLowerCase());
            const passages = (Array.isArray(entry.occurrences) ? entry.occurrences : []).map((occ) => ({
                source: 'buddhist',
                demo: false,
                textName: occ.title_pinyin || occ.sutra_name || 'Untitled sutra',
                citation: occ.line_number ? `line ${occ.line_number}${occ.version ? ` (${occ.version})` : ''}` : (occ.version || null),
                context: occ.context || occ.chinese_line || '',
                translation: occ.pinyin_line || null,
                language: 'chinese/pinyin',
                url: null,
                matchedTerm: entry.english || entry.pinyin || chineseKey
            }));
            return { aliases, passages };
        });
    }

    class CorpusPassageIndex {
        constructor() {
            this._loadPromise = null;
        }

        /**
         * Fetch and normalize every source once per page load. A source that
         * fails to fetch (missing file, network error) is dropped rather than
         * failing the whole index - a reader searching a term the OTHER
         * source covers should still get an answer.
         */
        load() {
            if (!this._loadPromise) {
                this._loadPromise = Promise.all(SOURCES.map(async (src) => {
                    try {
                        const res = await fetch(src.url);
                        if (!res.ok) return [];
                        const raw = await res.json();
                        return src.normalize(raw);
                    } catch (error) {
                        console.warn(`[CorpusPassageIndex] Could not load ${src.id}:`, error.message);
                        return [];
                    }
                })).then((perSource) => perSource.flat());
            }
            return this._loadPromise;
        }

        /**
         * Passages whose term entry matches `term`, exact match first
         * (case-insensitive), falling back to a substring match in either
         * direction so a reader searching "buddha" still finds the "佛" entry
         * (english alias "buddha") and vice versa.
         */
        async search(term, options = {}) {
            const needle = String(term || '').trim().toLowerCase();
            if (!needle) return [];

            const entries = await this.load();
            const exact = entries.filter((e) => e.aliases.includes(needle));

            // The substring fallback is right for a search box, where a reader
            // typing "buddh" should still find 佛, and wrong for a strip of
            // chips generated from an entity's own vocabulary. Those include
            // long phrases — "Reckoner of Time", and at least one collapsed
            // page title — and `needle.includes(a)` makes any of them match
            // every short alias in the index. Thoth's page offered 36 Chinese
            // sutra passages on that basis.
            //
            // So callers who generated their own term ask for exact, and the
            // explorer keeps the forgiving behaviour it needs.
            if (options.exact) return exact.flatMap((e) => e.passages);

            const partial = exact.length
                ? []
                : entries.filter((e) => e.aliases.some((a) => a.includes(needle) || needle.includes(a)));

            return (exact.length ? exact : partial).flatMap((e) => e.passages);
        }
    }

    window.CorpusPassageIndex = new CorpusPassageIndex();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CorpusPassageIndex, normalizeEgyptian, normalizeBuddhist };
    }
})();
