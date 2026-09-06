/**
 * Guard against calling Firestore APIs the loaded SDK does not have.
 *
 * The site loads the COMPAT build of the Firebase JS SDK from gstatic (see the
 * script tags in index.html). Compat does not expose every API the modular build
 * does, and calling a missing one is not a build error — it throws at runtime, in
 * the browser, on the page that needed it.
 *
 * That happened. An optimisation replaced `.get()` + `.size` with the count
 * aggregation `.count().get()` to avoid downloading rows just to size them. The
 * reasoning was right and the API does not exist in compat:
 *
 *   TypeError: collection.where(...).count is not a function
 *       at MythologyOverview._loadSingleCategory
 *
 * Every mythology overview page rendered an empty shell. It reached production
 * because nothing here executes that path — the unit tests mock Firestore, and
 * a mock happily answers to any method you invent.
 *
 * Verified empirically against the real gstatic bundles: Query.count() is absent
 * in compat 9.22.0 (loaded here), 9.23.0, 10.14.1 and 11.0.2. Count aggregation
 * is modular-only, via getCountFromServer.
 *
 * Static analysis, because that is what catches a method that does not exist.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');

/** Firestore Query/CollectionReference methods that compat does NOT provide. */
const MODULAR_ONLY = [
    {
        pattern: /\.count\s*\(\s*\)/,
        name: '.count()',
        instead: "await query.get() then .size, or read the count from the baked static base"
    },
    {
        pattern: /getCountFromServer\s*\(/,
        name: 'getCountFromServer()',
        instead: 'the same — compat has no aggregation API at all'
    },
    {
        pattern: /getAggregateFromServer\s*\(/,
        name: 'getAggregateFromServer()',
        instead: 'the same — compat has no aggregation API at all'
    }
];

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules') continue;
            walk(full, out);
        } else if (entry.name.endsWith('.js')) {
            out.push(full);
        }
    }
    return out;
}

/** Strip comments so a line explaining the ban does not trip the ban. */
function stripComments(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('Firestore compat API surface', () => {
    let files;

    beforeAll(() => {
        files = walk(JS_DIR);
    });

    test('finds the source files to scan', () => {
        // Without this, a broken walk would make every assertion below vacuous.
        expect(files.length).toBeGreaterThan(50);
    });

    test.each(MODULAR_ONLY)('no production code calls $name', ({ pattern, name, instead }) => {
        const offenders = [];

        for (const file of files) {
            const src = stripComments(fs.readFileSync(file, 'utf8'));
            src.split('\n').forEach((line, i) => {
                if (pattern.test(line)) {
                    offenders.push(`${path.relative(ROOT, file).replace(/\\/g, '/')}:${i + 1}  ${line.trim().slice(0, 90)}`);
                }
            });
        }

        if (offenders.length) {
            throw new Error(
                `${name} is not available in the Firebase compat SDK this site loads, ` +
                `and throws at runtime rather than failing to build.\n` +
                `Use ${instead}.\n\n` +
                offenders.map(o => `  ${o}`).join('\n')
            );
        }
    });

    test('index.html loads a compat build, which is what makes the above apply', () => {
        // If the site ever moves to the modular SDK this whole guard is obsolete,
        // and this assertion is what will say so instead of it silently passing.
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        expect(html).toMatch(/firebase-firestore-compat\.js/);
    });
});
