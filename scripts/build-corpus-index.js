#!/usr/bin/env node

/**
 * Build the term-to-passage index the site looks words up in.
 *
 * INPUT
 *
 * A directory of source-text files, one JSON file per text:
 *
 *   {
 *     "text_id":   "pyr",                      // stable, short, unique
 *     "text_name": "Pyramid Texts",
 *     "tradition": "egyptian",
 *     "language":  "Middle Egyptian",
 *     "translator": "Samuel A. B. Mercer, 1952",
 *     "rights":    "public domain",            // required — see below
 *     "source_url": "https://...",             // where this copy came from
 *     "passages": [
 *       { "citation": "Utterance 217", "text": "The great one has fallen..." }
 *     ]
 *   }
 *
 * `rights` is required and must say the text may be republished. This script
 * refuses anything else. The point of the feature is to let a reader check a
 * claim against a source, and a source that cannot legally be shown is not one.
 *
 * WHAT IT WILL NOT DO
 *
 * It will not invent passages. There is no generation step and there is not
 * going to be one: an invented line attributed to the Book of the Dead, shown
 * under a heading promising primary sources, is worse than an empty panel. The
 * empty panel is merely unhelpful; the invented line is false and looks
 * authoritative. If the index is empty it is because no sources have been
 * supplied, and scripts/validate-corpus-wiring.js will say so.
 *
 * OUTPUT
 *
 * static/corpus/index.json   — term -> passages, matching what the site reads
 * static/corpus/texts.json   — one record per source text, for attribution
 *
 * MATCHING
 *
 * Whole words only, and case-insensitively. A term like "Ra" must not match
 * "Ptah" or "grateful"; this same mistake has already been made twice in this
 * codebase's history, once pairing a deity to a topic on the strength of three
 * letters inside a longer word.
 *
 * USAGE
 *   node scripts/build-corpus-index.js --from data/corpus-sources
 *   node scripts/build-corpus-index.js --from data/corpus-sources --write
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const outIdx = process.argv.indexOf('--out');
// Overridable so a test can build into a temp directory instead of mutating
// the working tree it is running inside.
const OUT_DIR = outIdx !== -1
    ? path.resolve(process.argv[outIdx + 1] || '')
    : path.join(ROOT, 'static', 'corpus');
const BASE = path.join(ROOT, 'static', 'entities');

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const fromIdx = args.indexOf('--from');
const SOURCE_DIR = fromIdx !== -1 ? path.resolve(args[fromIdx + 1] || '') : null;

/**
 * Optional vocabulary override: a JSON array, or one term per line.
 *
 * Collecting the vocabulary means reading every `_all.json` in the base —
 * about 50 MB across 27 collections — which takes the better part of a minute.
 * That is fine once, when rebuilding the real index, and absurd in a test that
 * wants to check the matcher against three passages. Supplying the terms
 * directly also allows a targeted rebuild for one tradition.
 */
const vocabIdx = args.indexOf('--vocab');
const VOCAB_FILE = vocabIdx !== -1 ? path.resolve(args[vocabIdx + 1] || '') : null;

/** Licences that permit republishing the passage on this site. */
const ALLOWED_RIGHTS = [/public domain/i, /^cc0/i, /cc[- ]by(?![- ]nc)/i];

/** Words too common to index: they would match everything and rank nothing. */
const STOPWORDS = new Set([
    'the', 'of', 'and', 'a', 'an', 'in', 'on', 'to', 'is', 'was', 'god', 'great',
    'one', 'all', 'who', 'his', 'her', 'their', 'it', 'he', 'she', 'they', 'for'
]);

const MAX_PASSAGES_PER_TERM = 25;

function wholeWordRegex(term) {
    const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu');
}

/** The vocabulary worth indexing: what entities actually ask to look up. */
function siteTerms() {
    if (VOCAB_FILE) {
        const raw = fs.readFileSync(VOCAB_FILE, 'utf8').trim();
        const list = raw.startsWith('[') ? JSON.parse(raw) : raw.split(/\r?\n/);
        return new Set(list
            .map((t) => String(t).trim().toLowerCase())
            .filter((t) => t.length >= 3 && !STOPWORDS.has(t)));
    }

    const terms = new Set();
    for (const collection of fs.readdirSync(BASE)) {
        const file = path.join(BASE, collection, '_all.json');
        if (!fs.existsSync(file)) continue;
        let raw;
        try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) { continue; }
        for (const row of (Array.isArray(raw) ? raw : Object.values(raw))) {
            if (!row || row.duplicateOf || !row.corpusSearch) continue;
            const cs = row.corpusSearch;
            if (typeof cs !== 'object' || Array.isArray(cs)) continue;
            for (const term of Object.values(cs).flat()) {
                if (typeof term !== 'string') continue;
                const t = term.trim().toLowerCase();
                if (t.length < 3 || STOPWORDS.has(t)) continue;
                terms.add(t);
            }
        }
    }
    return terms;
}

function loadSources(dir) {
    const texts = [];
    const rejected = [];
    if (!fs.existsSync(dir)) return { texts, rejected, missing: true };

    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
        let doc;
        try {
            doc = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        } catch (err) {
            rejected.push({ file, why: `unreadable: ${err.message}` });
            continue;
        }

        const required = ['text_id', 'text_name', 'passages'];
        const missing = required.filter((f) => !doc || !doc[f]);
        if (missing.length) {
            rejected.push({ file, why: `missing ${missing.join(', ')}` });
            continue;
        }
        if (!Array.isArray(doc.passages) || !doc.passages.length) {
            rejected.push({ file, why: 'no passages' });
            continue;
        }

        const rights = String(doc.rights || '');
        if (!ALLOWED_RIGHTS.some((re) => re.test(rights))) {
            rejected.push({
                file,
                why: rights
                    ? `rights "${rights}" do not clearly permit republication`
                    : 'no rights field — a source that cannot be shown cannot ground a claim'
            });
            continue;
        }

        const bad = doc.passages.filter((p) => !p || !String(p.citation || '').trim() || !String(p.text || '').trim());
        if (bad.length) {
            rejected.push({ file, why: `${bad.length} passage(s) missing citation or text` });
            continue;
        }

        texts.push(doc);
    }
    return { texts, rejected, missing: false };
}

function main() {
    if (!SOURCE_DIR) {
        console.error('Give a source directory: --from <dir>');
        console.error('See the header of this file for the file format each text must use.');
        process.exit(1);
    }

    const vocabulary = siteTerms();
    console.log(`${vocabulary.size.toLocaleString()} distinct terms the site would look up\n`);

    const { texts, rejected, missing } = loadSources(SOURCE_DIR);

    if (missing) {
        console.log(`No source directory at ${SOURCE_DIR}.`);
        console.log('\nNothing is generated to fill it. Supply real texts — public domain');
        console.log('translations of primary sources, one JSON file each, in the format');
        console.log('documented at the top of this script.');
        process.exitCode = 1;
        return;
    }

    if (rejected.length) {
        console.log(`${rejected.length} source file(s) rejected:`);
        rejected.forEach((r) => console.log(`   ${r.file}: ${r.why}`));
        console.log('');
    }

    if (!texts.length) {
        console.log('No usable source texts. Index not built.');
        process.exitCode = 1;
        return;
    }

    // Index only the vocabulary the site asks about, so the file stays
    // proportional to what can actually be looked up rather than to the size
    // of the corpus.
    const index = {};
    let indexed = 0;
    for (const term of vocabulary) {
        const re = wholeWordRegex(term);
        const hits = [];
        for (const text of texts) {
            for (const passage of text.passages) {
                if (!re.test(passage.text)) continue;
                hits.push({
                    text_id: text.text_id,
                    text_name: text.text_name,
                    citation: passage.citation,
                    tradition: text.tradition || null,
                    translator: text.translator || null,
                    full_verse: String(passage.text).slice(0, 1200)
                });
                if (hits.length >= MAX_PASSAGES_PER_TERM) break;
            }
            if (hits.length >= MAX_PASSAGES_PER_TERM) break;
        }
        if (hits.length) { index[term] = hits; indexed++; }
    }

    const attribution = texts.map((t) => ({
        text_id: t.text_id,
        text_name: t.text_name,
        tradition: t.tradition || null,
        language: t.language || null,
        translator: t.translator || null,
        rights: t.rights,
        source_url: t.source_url || null,
        passages: t.passages.length
    }));

    const passages = Object.values(index).reduce((a, v) => a + v.length, 0);
    console.log(`${texts.length} text(s), ${texts.reduce((a, t) => a + t.passages.length, 0).toLocaleString()} passages`);
    console.log(`${indexed.toLocaleString()} terms matched something (${Math.round((indexed / vocabulary.size) * 1000) / 10}% of the vocabulary)`);
    console.log(`${passages.toLocaleString()} term-passage pairs`);

    if (!WRITE) {
        console.log('\nReport only. Re-run with --write to build the index.');
        return;
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index));
    fs.writeFileSync(path.join(OUT_DIR, 'texts.json'), JSON.stringify(attribution, null, 2));
    const kb = (fs.statSync(path.join(OUT_DIR, 'index.json')).size / 1024).toFixed(0);
    console.log(`\nWrote ${path.relative(ROOT, OUT_DIR)}/index.json (${kb} KB) and texts.json`);
    console.log('Verify with: node scripts/validate-corpus-wiring.js');
}

main();
