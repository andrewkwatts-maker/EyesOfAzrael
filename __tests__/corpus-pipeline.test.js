/**
 * The corpus chain: source text -> index -> lookup on an entity page.
 *
 * The point of the feature is that a reader can check a claim against a primary
 * source, so most of what is tested here is refusal: the importer must reject a
 * text it cannot legally show, or one whose passages carry no citation, and the
 * lookup must show nothing at all rather than an empty promise when there is no
 * corpus. A passage without a citation is not a source, and a panel headed "In
 * the primary sources" with nothing behind it misrepresents the site.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BUILDER = path.join(ROOT, 'scripts', 'build-corpus-index.js');
const FIXTURE = path.join(__dirname, 'fixtures', 'corpus-source-sample.json');

/** A handful of terms, so tests do not scan 50 MB of entity files. */
const VOCAB = ['tiamat', 'apsu', 'heaven', 'earth', 'chaos', 'ra', 'field'];

function runBuilder(dir, extra = []) {
    try {
        return {
            ok: true,
            out: execFileSync('node', [BUILDER, '--from', dir, '--vocab', vocabFile(), ...extra], { encoding: 'utf8' })
        };
    } catch (err) {
        return { ok: false, out: `${err.stdout || ''}${err.stderr || ''}` };
    }
}

let _vocabPath = null;
function vocabFile() {
    if (!_vocabPath) {
        _vocabPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-vocab-')), 'vocab.json');
        fs.writeFileSync(_vocabPath, JSON.stringify(VOCAB));
    }
    return _vocabPath;
}

function tempSourceDir(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-test-'));
    for (const [name, body] of Object.entries(files)) {
        fs.writeFileSync(path.join(dir, name), typeof body === 'string' ? body : JSON.stringify(body));
    }
    return dir;
}

describe('corpus importer', () => {
    const sample = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

    test('indexes a well-formed public-domain text', () => {
        const dir = tempSourceDir({ 'sample.json': sample });
        const { out } = runBuilder(dir);
        expect(out).toMatch(/1 text\(s\), 3 passages/);
        expect(out).toMatch(/terms matched something/);
    });

    test('rejects a text with no rights statement', () => {
        const { rights, ...noRights } = sample;
        expect(rights).toBe('public domain');   // guard: the fixture must have had one
        const dir = tempSourceDir({ 'x.json': noRights });
        const { out } = runBuilder(dir);
        expect(out).toMatch(/no rights field/i);
        expect(out).toMatch(/No usable source texts/);
    });

    test('rejects a text whose licence does not permit republication', () => {
        const dir = tempSourceDir({ 'x.json': { ...sample, rights: 'All rights reserved' } });
        const { out } = runBuilder(dir);
        expect(out).toMatch(/do not clearly permit republication/i);
    });

    test('rejects passages with no citation', () => {
        const uncited = {
            ...sample,
            passages: [{ text: 'A line with no locus a reader could follow.' }]
        };
        const dir = tempSourceDir({ 'x.json': uncited });
        const { out } = runBuilder(dir);
        expect(out).toMatch(/missing citation or text/i);
    });

    test('matches whole words only', () => {
        // "ra" occurs inside "primeval" and "earth" throughout the fixture. A
        // substring matcher would index it, and this project has shipped that
        // bug before — once pairing a deity to a topic on three letters inside
        // a longer word.
        const dir = tempSourceDir({ 'sample.json': sample });
        const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-out-'));
        runBuilder(dir, ['--write', '--out', outDir]);

        const indexPath = path.join(outDir, 'index.json');
        expect(fs.existsSync(indexPath)).toBe(true);
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        expect(index.ra).toBeUndefined();
        expect(index.tiamat).toBeDefined();
        fs.rmSync(outDir, { recursive: true, force: true });
    });
});

describe('corpus term lookup', () => {
    const CorpusTermLookup = require('../js/components/corpus-term-lookup.js');

    test('flattens an entity\'s search terms, canonical first, without duplicates', () => {
        const terms = CorpusTermLookup.termsFor({
            corpusSearch: {
                variants: ['Wind God', 'wind god'],
                canonical: ['Enlil'],
                domains: ['storm']
            }
        });
        expect(terms[0]).toBe('Enlil');
        expect(terms).toContain('storm');
        // 'Wind God' and 'wind god' are the same term.
        expect(terms.filter((t) => t.toLowerCase() === 'wind god')).toHaveLength(1);
    });

    test('returns nothing for an entity with no corpusSearch', () => {
        expect(CorpusTermLookup.termsFor({})).toEqual([]);
        expect(CorpusTermLookup.termsFor({ corpusSearch: [] })).toEqual([]);
        expect(CorpusTermLookup.termsFor(null)).toEqual([]);
    });

    test('highlights whole words only', () => {
        const html = CorpusTermLookup.highlight('The earth and the hearth were rated.', 'earth');
        expect(html).toContain('<mark>earth</mark>');
        // 'hearth' and 'rated' contain the letters but are different words.
        expect(html).not.toContain('h<mark>earth</mark>');
        expect(html.match(/<mark>/g)).toHaveLength(1);
    });

    test('escapes markup in a passage before highlighting it', () => {
        const html = CorpusTermLookup.highlight('<script>alert(1)</script> earth', 'earth');
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });
});
