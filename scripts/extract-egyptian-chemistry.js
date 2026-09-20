#!/usr/bin/env node

/**
 * Extract the author's chemical readings of the Egyptian pantheon.
 *
 * WHAT THIS IS
 *
 * The legacy site at H:\DaedalusSVN\Mythology grew an "Author's Theories &
 * Analysis" section on 25 Egyptian deity pages, each proposing that a deity's
 * name encodes an element or compound — Thoth as thorium dioxide, Set as
 * selenium ditelluride, Ptah as platinum — and reading the mythology as a
 * description of that substance's behaviour. The pages carry chemistry
 * diagrams: alpha decay, thorium decay chains, a fluorite unit cell.
 *
 * It is the author's own speculation, and the legacy pages say so in as many
 * words. That framing is carried across deliberately and is not softened here:
 * every record is stamped `status: "speculative"` and `origin` names it as
 * original research rather than Egyptology. Presenting an invented etymology as
 * established scholarship would be the one genuinely harmful way to port this.
 *
 * WHERE IT GOES
 *
 * The conspiracy domain, as `con_theories` — the site already separates claims
 * from records, and this is a claim. The mythology entries for these deities
 * stay as they are; the theory links to them and they link back, so a reader
 * meets the speculation beside the deity without it being mixed into the
 * deity's own description.
 *
 * CROSS-LINKS
 *
 * Two kinds, both derived rather than hand-listed:
 *   - theory to deity, by the page the theory came from
 *   - theory to theory, where two share an element. Thoth (thorium) and Osiris
 *     (osmium) sit in the same decay-chain argument the author makes across
 *     several pages, and that argument is only visible when the pages are
 *     linked.
 *
 * USAGE
 *   node scripts/extract-egyptian-chemistry.js            # report only
 *   node scripts/extract-egyptian-chemistry.js --write    # write data/ output
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join('H:', '\\DaedalusSVN', 'Mythology', 'mythos', 'egyptian', 'deities');
const OUT_DIR = path.join(__dirname, '..', 'data', 'egyptian-chemistry');
const WRITE = process.argv.includes('--write');

/** Element symbols worth cross-linking on. Longest first so "Th" beats "T". */
const ELEMENTS = {
    Th: 'thorium', Pt: 'platinum', Os: 'osmium', Se: 'selenium', Te: 'tellurium',
    Au: 'gold', Ag: 'silver', Hg: 'mercury', Pb: 'lead', Fe: 'iron', Cu: 'copper',
    Ra: 'radium', Rn: 'radon', Po: 'polonium', Bi: 'bismuth', Ca: 'calcium',
    Na: 'sodium', Cl: 'chlorine', Si: 'silicon', Al: 'aluminium', Mg: 'magnesium',
    Ni: 'nickel', Zn: 'zinc', Sn: 'tin', Sb: 'antimony', As: 'arsenic',
    S: 'sulfur', C: 'carbon', N: 'nitrogen', O: 'oxygen', H: 'hydrogen',
    P: 'phosphorus', K: 'potassium', U: 'uranium'
};

const strip = (html) => String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The theory block, by class first and by heading as a fallback.
 *
 * `.authors-theories` is the wrapper every one of these pages uses, but the
 * markup was hand-written over time and a handful of pages only have the
 * heading, so both are tried before a page is reported as having nothing.
 */
function theorySection(html) {
    // Start at the wrapper if there is one, otherwise at the heading.
    //
    // Matching the wrapper's closing tag is what the first version of this got
    // wrong: these blocks nest divs several deep and a non-greedy
    // `</div></div>` stops at the first inner pair, which truncated Set to 685
    // characters and dropped all four of its sub-arguments. Taking everything
    // from the start marker to whatever ends the block is more robust than
    // trying to balance tags with a regex.
    let start = html.search(/<(?:section|div)[^>]*class="[^"]*authors-theories/i);
    if (start === -1) start = html.search(/Author'?s Theories/i);
    if (start === -1) return null;

    const rest = html.slice(start);

    // The block ends at the next sibling section, the footer, or the related
    // -entities block these pages put after it.
    const enders = [
        /<footer/i,
        /<section[^>]*class="[^"]*(?:related|sources|references|navigation)/i,
        /<div[^>]*class="[^"]*(?:related-deities|page-nav|back-to)/i
    ];
    let end = rest.length;
    for (const re of enders) {
        const m = rest.slice(200).search(re);
        if (m !== -1 && m + 200 < end) end = m + 200;
    }
    return rest.slice(0, end);
}

/** "🐺 Anubis ( Inpu )" -> "Anubis". */
function cleanName(raw, fallback) {
    let name = String(raw || '')
        // Emoji and other pictographs the headings lead with.
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu, '')
        .replace(/\s*\|[\s\S]*$/, '')     // "Thoth | Egyptian Mythology"
        .replace(/\s*\([^)]*\)\s*/g, ' ') // alternate spellings
        .replace(/\s+/g, ' ')
        .trim();
    if (!name) name = String(fallback || '').replace(/[-_]+/g, ' ');
    return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseTheory(file) {
    const html = fs.readFileSync(path.join(SOURCE, file), 'utf8');
    const section = theorySection(html);
    if (!section) return null;

    const deitySlug = path.basename(file, '.html');
    const deityName = cleanName(strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]), deitySlug);

    const core = strip((section.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[1] || '')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
        .replace(/^[^\w]*/, '')
        .replace(/^(?:Author'?s Theory|Core Theory|Chemical Etymology Theory):\s*/i, '')
        .trim();

    const arguments_ = [...section.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>([\s\S]*?)(?=<h4|$)/gi)]
        .map((m) => ({
            heading: strip(m[1])
                .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
                .replace(/^[^\w]*/, '')
                .trim(),
            body: strip(m[2]).slice(0, 900)
        }))
        .filter((a) => a.heading && a.body.length > 40);

    // Formulae as written by the author, e.g. ThO₂, SeT₂.
    const text = strip(section);
    const formulae = [...new Set(
        (text.match(/\b[A-Z][a-z]?[A-Za-z]{0,3}[₀-₉0-9]?(?:[A-Z][a-z]?[₀-₉0-9]?){0,3}\b/g) || [])
            .filter((f) => /[₀-₉]/.test(f) || /^(ThO|SeT|PtO|OsO)/.test(f))
    )].slice(0, 6);

    // Which elements the argument leans on. Word-boundary matched so "S" does
    // not fire on every capital in the prose.
    const elements = Object.keys(ELEMENTS).filter((sym) => {
        const full = ELEMENTS[sym];
        return new RegExp(`\\b${full}\\b`, 'i').test(text)
            || new RegExp(`\\b${sym}(?![a-z])`).test(core);
    });

    return {
        deitySlug,
        deityName,
        core,
        arguments: arguments_,
        formulae,
        elements,
        chars: text.length
    };
}

function main() {
    if (!fs.existsSync(SOURCE)) {
        console.error(`Legacy source not found at ${SOURCE}`);
        process.exit(1);
    }

    const files = fs.readdirSync(SOURCE).filter((f) => f.endsWith('.html'));
    const found = [];
    const without = [];

    for (const file of files) {
        let parsed;
        try {
            parsed = parseTheory(file);
        } catch (err) {
            console.warn(`  ! ${file}: ${err.message}`);
            continue;
        }
        if (!parsed || !parsed.core) { without.push(file); continue; }
        found.push(parsed);
    }

    found.sort((a, b) => b.chars - a.chars);

    console.log(`${files.length} Egyptian deity pages, ${found.length} carry a chemical theory\n`);
    for (const t of found) {
        console.log(`  ${t.deityName.padEnd(16)} ${String(t.chars).padStart(5)}ch  ${t.arguments.length} args  [${t.elements.slice(0, 4).join(', ')}]`);
        console.log(`      ${t.core.slice(0, 92)}`);
    }

    // Which theories share an element — the cross-links worth making.
    const byElement = {};
    for (const t of found) {
        for (const e of t.elements) (byElement[e] = byElement[e] || []).push(t.deityName);
    }
    const shared = Object.entries(byElement).filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);
    console.log(`\nelements shared by more than one theory: ${shared.length}`);
    shared.slice(0, 10).forEach(([e, v]) => console.log(`   ${ELEMENTS[e].padEnd(12)} ${v.join(', ')}`));

    if (without.length) console.log(`\n${without.length} page(s) with no theory section: ${without.slice(0, 8).join(', ')}`);

    if (!WRITE) {
        console.log('\nReport only. Re-run with --write to emit data/egyptian-chemistry/.');
        return;
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'extracted.json'), JSON.stringify({ extractedAt: new Date().toISOString(), theories: found }, null, 2));
    console.log(`\nWrote ${found.length} theories to ${path.join(OUT_DIR, 'extracted.json')}`);
}

main();
