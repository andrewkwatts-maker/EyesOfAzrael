#!/usr/bin/env node

/**
 * Turn the extracted Egyptian chemical readings into linked `con_theories`.
 *
 * Input is data/egyptian-chemistry/extracted.json (from
 * scripts/extract-egyptian-chemistry.js) plus deity-map.json, which pins each
 * theory to the deity record it concerns.
 *
 * FRAMING
 *
 * These are the author's own speculations — that a deity's name encodes an
 * element, and the myth describes that substance. The legacy pages say so
 * plainly and every record here keeps that: `status: "speculative"`, an
 * `origin` naming it as original research, and a `disclaimer` carried into the
 * record itself rather than left to the template. A reader arriving from a
 * search engine sees the framing on the record, not only on the page.
 *
 * INTERLINKS
 *
 * `relatedEntities` is written as an object keyed by collection, which is the
 * only shape scripts/export-static-base.js reads — it skips arrays outright,
 * which is why the legacy array-shaped relatedEntities produce no backlinks at
 * all. Writing it correctly means the export generates the reverse links on the
 * deity side for free, so Thoth's page gains a link to the thorium theory
 * without the deity record being edited.
 *
 * Two kinds of link:
 *   - theory to its deity
 *   - theory to theory, where the two arguments share an element. The author
 *     builds a decay chain across several pages — thorium to radium to radon
 *     to polonium — and that chain is only visible if the pages are connected.
 *
 * USAGE
 *   node scripts/build-egyptian-chemistry-theories.js           # report
 *   node scripts/build-egyptian-chemistry-theories.js --write   # write records
 */

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'egyptian-chemistry');
const WRITE = process.argv.includes('--write');

const ELEMENT_NAMES = {
    Th: 'thorium', Pt: 'platinum', Os: 'osmium', Se: 'selenium', Te: 'tellurium',
    Au: 'gold', Ag: 'silver', Hg: 'mercury', Pb: 'lead', Fe: 'iron', Cu: 'copper',
    Ra: 'radium', Rn: 'radon', Po: 'polonium', Bi: 'bismuth', Ca: 'calcium',
    Na: 'sodium', Cl: 'chlorine', Si: 'silicon', Al: 'aluminium', Mg: 'magnesium',
    Ni: 'nickel', Zn: 'zinc', Sn: 'tin', Sb: 'antimony', As: 'arsenic',
    S: 'sulfur', C: 'carbon', N: 'nitrogen', O: 'oxygen', H: 'hydrogen',
    P: 'phosphorus', K: 'potassium', U: 'uranium'
};

/**
 * Elements common enough to be noise as a link.
 *
 * Nine of the seventeen arguments mention sulfur and eight mention oxygen,
 * because the prose is about chemistry. Linking every pair that shares one
 * would connect almost everything to almost everything and say nothing. The
 * distinctive elements — thorium, radium, platinum — are the ones the author
 * actually builds an argument across.
 */
const TOO_COMMON = new Set(['S', 'O', 'H', 'N', 'C', 'P', 'K', 'Na', 'Ca', 'Cl']);

const slugify = (s) => String(s || '').toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function main() {
    const extracted = JSON.parse(fs.readFileSync(path.join(DIR, 'extracted.json'), 'utf8'));
    const deityMap = JSON.parse(fs.readFileSync(path.join(DIR, 'deity-map.json'), 'utf8'));

    const theories = extracted.theories.filter((t) => t.core && t.arguments.length);

    // Index by distinctive element so theory-to-theory links can be derived.
    const byElement = {};
    for (const t of theories) {
        for (const e of t.elements) {
            if (TOO_COMMON.has(e)) continue;
            (byElement[e] = byElement[e] || []).push(t);
        }
    }

    const records = [];
    for (const t of theories) {
        const key = slugify(t.deityName);
        const deityId = deityMap[key] || deityMap[key.replace(/-/g, '')] || null;
        const id = `egyptian-chemistry-${key}`;

        const distinctive = t.elements.filter((e) => !TOO_COMMON.has(e));

        // Sibling theories sharing a distinctive element, closest first.
        const siblings = [...new Set(
            distinctive.flatMap((e) => (byElement[e] || []))
                .filter((other) => other !== t)
        )].map((other) => ({
            id: `egyptian-chemistry-${slugify(other.deityName)}`,
            shared: distinctive.filter((e) => other.elements.includes(e))
        }))
            .sort((a, b) => b.shared.length - a.shared.length)
            .slice(0, 6);

        const body = t.arguments.map((a) => `${a.heading}\n\n${a.body}`).join('\n\n');

        const related = {};
        if (deityId) {
            related.deities = [{ id: deityId, relationship: 'the deity this theory reads as a substance' }];
        }
        if (siblings.length) {
            related.con_theories = siblings.map((s) => ({
                id: s.id,
                relationship: `shares ${s.shared.map((e) => ELEMENT_NAMES[e] || e).join(', ')}`
            }));
        }

        records.push({
            id,
            name: `${t.deityName} as ${t.core.replace(new RegExp(`^${t.deityName}\\s+as\\s+`, 'i'), '')}`.slice(0, 110),
            type: 'theory',
            // The conspiracy domain shards on `category`, not `mythology`, and
            // __tests__/scripts/domain-seed-sync.test.js enforces that no
            // con_* record carries a mythology field. A first pass stamped
            // `mythology: 'egyptian'` on all seventeen of these and the test
            // caught it. The Egyptian connection belongs in the link to the
            // deity and in the tags, which is where a reader follows it from
            // anyway — putting it in the facet would also have filed these
            // under a tradition in listings that shard by something else.
            category: 'alternative_science',
            status: 'speculative',
            origin: "Eyes of Azrael — the author's original research, not established Egyptology",
            claim: t.core,
            disclaimer: 'An original interpretation by this site\'s author. It is not a finding of '
                + 'Egyptology, chemistry or archaeology, and no scholarly source proposes it.',
            description: `A reading of ${t.deityName} in which the name is treated as an element or `
                + `compound and the mythology as a description of how that substance behaves. `
                + `${t.arguments.length} lines of argument are given.`,
            extendedContent: body.slice(0, 24000),
            elements: distinctive.map((e) => ELEMENT_NAMES[e] || e),
            formulae: t.formulae,
            tags: ['egyptian', 'alchemy', 'chemistry', 'etymology', 'original-research',
                ...distinctive.map((e) => ELEMENT_NAMES[e] || e)],
            relatedEntities: related,
            sourcePage: `mythos/egyptian/deities/${t.deitySlug}.html`
        });
    }

    console.log(`${records.length} theory records\n`);
    for (const r of records) {
        const d = (r.relatedEntities.deities || []).length;
        const s = (r.relatedEntities.con_theories || []).length;
        console.log(`  ${r.id.replace('egyptian-chemistry-', '').padEnd(10)} ${String(r.extendedContent.length).padStart(6)}ch  deity:${d} siblings:${s}  [${r.elements.slice(0, 4).join(', ')}]`);
    }

    const unlinked = records.filter((r) => !(r.relatedEntities.deities || []).length);
    if (unlinked.length) console.log(`\n${unlinked.length} with no deity link: ${unlinked.map((r) => r.id).join(', ')}`);

    const totalLinks = records.reduce((a, r) =>
        a + (r.relatedEntities.deities || []).length + (r.relatedEntities.con_theories || []).length, 0);
    console.log(`\n${totalLinks} outgoing links; the export will mirror these as backlinks on the deity pages.`);

    if (!WRITE) {
        console.log('\nReport only. Re-run with --write.');
        return;
    }
    fs.writeFileSync(path.join(DIR, 'theories.json'), JSON.stringify(records, null, 2));
    console.log(`\nWrote ${path.join(DIR, 'theories.json')}`);
}

main();
