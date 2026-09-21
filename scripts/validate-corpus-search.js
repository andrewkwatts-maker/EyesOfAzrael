#!/usr/bin/env node
/**
 * Validate the corpus-search feature end to end: the `corpusSearch` field on
 * entities, the two keyword -> passage indexes, and the URL contract that
 * connects a clicked keyword chip to a search on corpus-explorer.html.
 *
 * WHY THIS EXISTS
 *
 * `corpusSearch.canonical` is an array (["zeus"]) on ~23,800 entities but a
 * bare string ("ptah") on a couple dozen - no schema in
 * scripts/validation/schemas/ ever checked this, so it went unnoticed until
 * it silently broke term scoring in js/components/corpus-search.js (fixed
 * separately; see canonicalTerms() there). And the keyword chips on entity
 * pages linked to `/corpus-explorer.html?term=<word>` while
 * corpus-explorer.js only ever read `?q=`, so every chip landed on an empty
 * search box - also fixed separately, by accepting `term` as an alias.
 *
 * Both bugs were the same shape: a contract between two files that nothing
 * checked, so it silently drifted. This script is that check, so a future
 * change to either side gets caught before it ships, not discovered by a
 * reader clicking a dead link.
 *
 * USAGE
 *   node scripts/validate-corpus-search.js            # full report
 *   node scripts/validate-corpus-search.js --quiet    # summary line only
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENTITIES_BASE = path.join(ROOT, 'static', 'entities');
const QUIET = process.argv.includes('--quiet');

const PASSAGE_INDEXES = [
    { id: 'egyptian', file: path.join(ROOT, 'mythos', 'egyptian', 'corpus-index.json') },
    { id: 'buddhist', file: path.join(ROOT, 'mythos', 'buddhist', 'corpus', 'buddhist_corpus_index.json') }
];

/** Fields on `corpusSearch` that should always be an array of non-empty strings. */
const ARRAY_FIELDS = ['canonical', 'variants', 'domains', 'symbols', 'abilities', 'epithets', 'concepts', 'places'];

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadCollectionRows(collection) {
    const file = path.join(ENTITIES_BASE, collection, '_all.json');
    if (!fs.existsSync(file)) return [];
    const raw = readJson(file);
    const rows = Array.isArray(raw) ? raw : Object.values(raw);
    return rows.filter((r) => r && typeof r === 'object' && r.id);
}

/**
 * Check one entity's corpusSearch object. Returns a list of issue strings
 * (empty if clean). Every issue names the exact field, so a person fixing
 * these doesn't have to re-derive what's wrong.
 */
function checkCorpusSearch(corpus) {
    const issues = [];

    for (const field of ARRAY_FIELDS) {
        if (!(field in corpus)) continue;
        const value = corpus[field];

        if (typeof value === 'string') {
            issues.push(`"${field}" is a bare string ("${value}"), not an array - ` +
                'code that does `.includes(term)` on it does a substring check ' +
                'instead of the exact-term check every other record gets.');
            continue;
        }

        if (!Array.isArray(value)) {
            issues.push(`"${field}" is a ${typeof value}, expected an array of strings.`);
            continue;
        }

        value.forEach((entry, i) => {
            if (typeof entry !== 'string') {
                issues.push(`"${field}[${i}]" is a ${typeof entry}, expected a string.`);
            } else if (!entry.trim()) {
                issues.push(`"${field}[${i}]" is empty or whitespace-only.`);
            }
        });
    }

    if (corpus.canonical !== undefined) {
        const canonicalTerms = Array.isArray(corpus.canonical)
            ? corpus.canonical
            : (typeof corpus.canonical === 'string' && corpus.canonical ? [corpus.canonical] : []);
        if (canonicalTerms.length === 0) {
            issues.push('"canonical" is present but empty - this entity has no term a ' +
                'reader could ever click to reach it via corpus search.');
        }
    }

    return issues;
}

function validateEntities() {
    const collections = fs.existsSync(ENTITIES_BASE)
        ? fs.readdirSync(ENTITIES_BASE, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
        : [];

    let totalWithCorpusSearch = 0;
    const problems = []; // { collection, id, issues }

    for (const collection of collections) {
        for (const row of loadCollectionRows(collection)) {
            if (!row.corpusSearch || typeof row.corpusSearch !== 'object') continue;
            totalWithCorpusSearch++;
            const issues = checkCorpusSearch(row.corpusSearch);
            if (issues.length) problems.push({ collection, id: row.id, issues });
        }
    }

    return { totalWithCorpusSearch, problems };
}

/**
 * The passage indexes are hand/script-built, not schema-validated anywhere
 * else. Confirm they're at least structurally usable by
 * js/services/corpus-passage-index.js before a reader hits a runtime error
 * instead of "no passages found".
 */
function validatePassageIndexes() {
    const results = [];

    for (const { id, file } of PASSAGE_INDEXES) {
        if (!fs.existsSync(file)) {
            results.push({ id, ok: false, error: `missing file: ${path.relative(ROOT, file)}` });
            continue;
        }

        let raw;
        try {
            raw = readJson(file);
        } catch (error) {
            results.push({ id, ok: false, error: `invalid JSON: ${error.message}` });
            continue;
        }

        const issues = [];
        let termCount = 0;
        let passageCount = 0;

        if (id === 'egyptian') {
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
                issues.push('expected a top-level object of { term: [passages] }');
            } else {
                for (const [term, entries] of Object.entries(raw)) {
                    termCount++;
                    if (!Array.isArray(entries)) {
                        issues.push(`"${term}" does not map to an array`);
                        continue;
                    }
                    entries.forEach((p, i) => {
                        passageCount++;
                        if (!p || typeof p !== 'object') {
                            issues.push(`"${term}"[${i}] is not an object`);
                        } else if (!p.text_name || !(p.context || p.full_verse)) {
                            issues.push(`"${term}"[${i}] is missing text_name or context/full_verse`);
                        }
                    });
                }
            }
        } else if (id === 'buddhist') {
            const terms = raw && raw.terms;
            if (!terms || typeof terms !== 'object') {
                issues.push('expected a top-level "terms" object');
            } else {
                for (const [key, entry] of Object.entries(terms)) {
                    termCount++;
                    if (!entry || typeof entry !== 'object') {
                        issues.push(`terms["${key}"] is not an object`);
                        continue;
                    }
                    if (!entry.pinyin && !entry.english) {
                        issues.push(`terms["${key}"] has neither a pinyin nor an english alias - ` +
                            'nothing in Latin script a reader could click through to reach it');
                    }
                    (entry.occurrences || []).forEach((occ, i) => {
                        passageCount++;
                        if (!occ || typeof occ !== 'object' || !occ.context) {
                            issues.push(`terms["${key}"].occurrences[${i}] is missing context`);
                        }
                    });
                }
            }
        }

        results.push({ id, ok: issues.length === 0, issues, termCount, passageCount });
    }

    return results;
}

/**
 * The specific contract that broke once already: every file that emits a
 * `corpus-explorer.html?term=...`/`?q=...` link, cross-checked against
 * corpus-explorer.js actually reading both param names. A regex check, not
 * a full JS parse - deliberately simple so it stays cheap to run and easy
 * to read when it fails.
 */
function validateUrlContract() {
    const explorerJs = path.join(ROOT, 'js', 'pages', 'corpus-explorer.js');
    const issues = [];

    if (!fs.existsSync(explorerJs)) {
        return [`${path.relative(ROOT, explorerJs)} does not exist`];
    }
    const explorerSrc = fs.readFileSync(explorerJs, 'utf8');
    const readsQ = /params\.get\(\s*['"]q['"]\s*\)/.test(explorerSrc);
    const readsTerm = /params\.get\(\s*['"]term['"]\s*\)/.test(explorerSrc);

    if (!readsQ) issues.push(`${path.relative(ROOT, explorerJs)} no longer reads the "q" param`);
    if (!readsTerm) {
        issues.push(`${path.relative(ROOT, explorerJs)} no longer reads the "term" param - ` +
            'every keyword chip on an entity page links with ?term=, so this ' +
            'silently breaks every one of them.');
    }

    // Every place known to emit a corpus-explorer link, and which param name
    // it uses - not exhaustive, but each entry here is a real, current chip
    // a reader can click.
    const emitters = [
        { file: path.join(ROOT, 'js', 'components', 'schema-section-renderer.js'), param: 'term' },
        { file: path.join(ROOT, 'js', 'components', 'asset-corpus-search.js'), param: 'term' }
    ];
    for (const { file, param } of emitters) {
        if (!fs.existsSync(file)) continue;
        const src = fs.readFileSync(file, 'utf8');
        const emitsParam = new RegExp(`corpus-explorer\\.html\\?${param}=`).test(src);
        if (!emitsParam) continue; // Emitter changed its own contract - not this script's concern.
        const explorerReadsIt = param === 'q' ? readsQ : readsTerm;
        if (!explorerReadsIt) {
            issues.push(`${path.relative(ROOT, file)} links with "?${param}=" but corpus-explorer.js does not read "${param}"`);
        }
    }

    return issues;
}

function main() {
    const { totalWithCorpusSearch, problems } = validateEntities();
    const passageResults = validatePassageIndexes();
    const urlIssues = validateUrlContract();

    if (!QUIET) {
        console.log(`[validate-corpus-search] ${totalWithCorpusSearch} entities carry a corpusSearch field`);
        console.log(`[validate-corpus-search] ${problems.length} of them have a shape problem`);
        for (const p of problems.slice(0, 30)) {
            console.log(`  ${p.collection}/${p.id}:`);
            for (const issue of p.issues) console.log(`    - ${issue}`);
        }
        if (problems.length > 30) console.log(`  ... and ${problems.length - 30} more`);

        console.log('');
        for (const r of passageResults) {
            if (r.error) {
                console.log(`[validate-corpus-search] ${r.id} passage index: ERROR - ${r.error}`);
                continue;
            }
            console.log(`[validate-corpus-search] ${r.id} passage index: ${r.termCount} terms, ${r.passageCount} passages, ${r.ok ? 'OK' : `${r.issues.length} issue(s)`}`);
            for (const issue of (r.issues || []).slice(0, 10)) console.log(`    - ${issue}`);
        }

        console.log('');
        if (urlIssues.length) {
            console.log('[validate-corpus-search] URL contract: BROKEN');
            for (const issue of urlIssues) console.log(`    - ${issue}`);
        } else {
            console.log('[validate-corpus-search] URL contract: OK (?q= and ?term= both work; every known emitter matches)');
        }
    }

    const hardFailures = passageResults.filter((r) => r.error || !r.ok).length + urlIssues.length;
    const summary = `${totalWithCorpusSearch} entities checked, ${problems.length} corpusSearch shape issue(s), ` +
        `${hardFailures} passage-index/URL-contract failure(s)`;
    console.log(`\n[validate-corpus-search] ${summary}`);

    // Shape issues in entity data are reported, not build-breaking - same
    // stance as the rest of this codebase's data-quality audits (see
    // data/legacy-port/suspect-names.json): a person should look at each one,
    // not have CI block on content it can't safely auto-repair. A broken
    // URL contract or an unreadable passage index is a code bug with no
    // judgment call involved, so those DO fail the run.
    if (hardFailures > 0) process.exit(1);
}

if (require.main === module) {
    main();
}

module.exports = { checkCorpusSearch, validateEntities, validatePassageIndexes, validateUrlContract };
