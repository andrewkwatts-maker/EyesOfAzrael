#!/usr/bin/env node

/**
 * Check every link in the corpus chain, and say which one is broken.
 *
 * The site is built to ground its claims in primary sources: 11,924 entities
 * carry a `corpusSearch` field listing the terms to look for — 53,541 of them —
 * and there are nine corpus components in js/components/. What there is not, at
 * the time of writing, is a corpus. `CorpusSearch` searches the site's own
 * entity collections; the `texts` collection describes 284 ancient texts and
 * holds not one passage from any of them; and the only index with the right
 * shape is a 10 KB demo whose every entry is `text_id: "DEMO001"`.
 *
 * That is a reasonable state to be in — the terms are the hard part and they
 * are done — but it is easy to mistake for a working feature, because the
 * search box answers, the components render, and the answers come from the
 * site's own descriptions rather than from any source text. This script exists
 * so the gap is stated rather than discovered.
 *
 * It checks four things in order, and stops being useful at the first that
 * fails, which is the point:
 *
 *   1. TERMS     — are the corpusSearch fields well-formed and non-empty?
 *   2. CORPUS    — does a corpus index exist, and does it validate?
 *   3. COVERAGE  — what proportion of entity terms actually match a passage?
 *   4. CITATIONS — does every passage name a text and a locus a reader could
 *                  check? A passage without a citation cannot ground anything.
 *
 * USAGE
 *   node scripts/validate-corpus-wiring.js
 *   node scripts/validate-corpus-wiring.js --json     # machine-readable
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'static', 'entities');
const CORPUS = path.join(ROOT, 'static', 'corpus');
const INDEX = path.join(CORPUS, 'index.json');

const AS_JSON = process.argv.includes('--json');

/**
 * The shape a corpus entry must have to be worth showing.
 *
 * `citation` and `text_name` are required, not optional. A passage shown
 * without them tells a reader that something ancient says this, while giving
 * them no way to check it, which is worse than showing nothing: it looks like
 * sourcing and is not.
 */
const REQUIRED_PASSAGE_FIELDS = ['text_id', 'text_name', 'citation', 'full_verse'];

function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
        return null;
    }
}

/** Every search term the site would look up, with the entity that wants it. */
function collectTerms() {
    const terms = new Map();     // term -> [{collection, id}]
    const perEntity = [];
    let malformed = 0;

    for (const collection of fs.readdirSync(BASE)) {
        const file = path.join(BASE, collection, '_all.json');
        if (!fs.existsSync(file)) continue;
        const raw = readJson(file);
        if (!raw) continue;

        for (const row of (Array.isArray(raw) ? raw : Object.values(raw))) {
            if (!row || !row.id || row.duplicateOf || !row.corpusSearch) continue;
            const cs = row.corpusSearch;
            if (typeof cs !== 'object' || Array.isArray(cs)) { malformed++; continue; }

            // canonical and variants are the two every record has; the extra
            // keys (domains, epithets, places) appear on a few hundred and are
            // equally searchable.
            const all = Object.values(cs).flat().filter((t) => typeof t === 'string' && t.trim());
            if (!all.length) { malformed++; continue; }

            perEntity.push({ collection, id: row.id, count: all.length });
            for (const term of all) {
                const key = term.trim().toLowerCase();
                if (!terms.has(key)) terms.set(key, []);
                terms.get(key).push({ collection, id: row.id });
            }
        }
    }
    return { terms, perEntity, malformed };
}

function validateCorpus() {
    if (!fs.existsSync(INDEX)) {
        return { present: false, reason: `no corpus index at ${path.relative(ROOT, INDEX)}` };
    }
    const index = readJson(INDEX);
    if (!index || typeof index !== 'object') {
        return { present: false, reason: 'corpus index is not valid JSON' };
    }

    let passages = 0;
    let demo = 0;
    const problems = [];

    for (const [term, entries] of Object.entries(index)) {
        if (!Array.isArray(entries)) {
            problems.push(`${term}: not an array`);
            continue;
        }
        for (const entry of entries) {
            passages++;
            // Placeholder data must never be mistaken for sourcing.
            if (/^DEMO/i.test(String(entry.text_id || ''))) demo++;
            const missing = REQUIRED_PASSAGE_FIELDS.filter((f) => !entry || !String(entry[f] || '').trim());
            if (missing.length && problems.length < 20) {
                problems.push(`${term}: entry missing ${missing.join(', ')}`);
            }
        }
    }

    return {
        present: true,
        terms: Object.keys(index).length,
        passages,
        demo,
        problems
    };
}

function main() {
    const { terms, perEntity, malformed } = collectTerms();
    const corpus = validateCorpus();

    const report = {
        terms: {
            entities: perEntity.length,
            distinctTerms: terms.size,
            totalTerms: perEntity.reduce((a, e) => a + e.count, 0),
            malformed
        },
        corpus,
        coverage: null
    };

    if (corpus.present) {
        const index = readJson(INDEX) || {};
        const indexed = new Set(Object.keys(index).map((t) => t.toLowerCase()));

        // Two different numbers, and the second is the one that matters.
        //
        // Term coverage says how much of the vocabulary is answerable. Entity
        // coverage says how many pages would actually show a reader something,
        // which is what the feature is for: a page whose every term misses is
        // no better off than a page with no terms at all.
        let matchedTerms = 0;
        for (const term of terms.keys()) if (indexed.has(term)) matchedTerms++;

        const entitiesCovered = new Set();
        for (const [term, owners] of terms) {
            if (!indexed.has(term)) continue;
            for (const owner of owners) entitiesCovered.add(`${owner.collection}/${owner.id}`);
        }

        report.coverage = {
            termsWithPassages: matchedTerms,
            termsWithout: terms.size - matchedTerms,
            percent: terms.size ? Math.round((matchedTerms / terms.size) * 1000) / 10 : 0,
            entitiesWithAMatch: entitiesCovered.size,
            entityPercent: perEntity.length
                ? Math.round((entitiesCovered.size / perEntity.length) * 1000) / 10
                : 0
        };
    }

    if (AS_JSON) {
        console.log(JSON.stringify(report, null, 2));
        return;
    }

    console.log('CORPUS WIRING\n');
    console.log('1. Terms');
    console.log(`   ${report.terms.entities.toLocaleString()} entities carry corpusSearch`);
    console.log(`   ${report.terms.totalTerms.toLocaleString()} terms, ${report.terms.distinctTerms.toLocaleString()} distinct`);
    console.log(`   ${report.terms.malformed} malformed or empty`);

    console.log('\n2. Corpus');
    if (!corpus.present) {
        console.log(`   MISSING — ${corpus.reason}`);
        console.log('\n   No passage can be shown until a corpus exists. Build one with:');
        console.log('     node scripts/build-corpus-index.js --from <dir-of-source-texts>');
        console.log('\n   Source texts must be public domain or licensed for this use, and each');
        console.log('   passage must carry a citation a reader can follow. Do not generate');
        console.log('   passages: an invented quotation attributed to the Pyramid Texts is');
        console.log('   worse than showing nothing, because it looks like grounding.');
        process.exitCode = 1;
        return;
    }

    console.log(`   ${corpus.terms.toLocaleString()} indexed terms, ${corpus.passages.toLocaleString()} passages`);
    if (corpus.demo) {
        console.log(`   ${corpus.demo} PLACEHOLDER passage(s) with a DEMO text_id — not real sourcing`);
    }
    if (corpus.problems.length) {
        console.log(`   ${corpus.problems.length} schema problem(s):`);
        corpus.problems.slice(0, 8).forEach((p) => console.log(`      ${p}`));
    }

    console.log('\n3. Coverage');
    if (report.coverage) {
        console.log(`   ${report.coverage.termsWithPassages.toLocaleString()} of ${report.terms.distinctTerms.toLocaleString()} terms have a passage (${report.coverage.percent}%)`);
        console.log(`   ${report.coverage.entitiesWithAMatch.toLocaleString()} of ${report.terms.entities.toLocaleString()} entities would show one (${report.coverage.entityPercent}%)`);
    }

    const healthy = corpus.present && !corpus.demo && !corpus.problems.length;
    console.log(`\n${healthy ? 'Chain is intact.' : 'Chain is incomplete — see above.'}`);
    if (!healthy) process.exitCode = 1;
}

main();
