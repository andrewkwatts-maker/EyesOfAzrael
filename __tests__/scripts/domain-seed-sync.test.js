/**
 * Domain seed sync tests
 * Tests for scripts/sync-domain-seeds.js
 *
 * The history and conspiracy seeds are authored in sibling repositories and
 * copied into firebase-assets-downloaded/ so this repo can export four domains
 * on its own. A copy is only acceptable if it is provably derived, so these
 * tests pin that: the copy must match its source when the source is available,
 * and must at minimum be complete and well-formed when it is not.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const DEST_ROOT = path.join(ROOT, 'firebase-assets-downloaded');
const SCRIPT = path.join(ROOT, 'scripts', 'sync-domain-seeds.js');

const DOMAIN_COLLECTIONS = {
    hist_: ['artifacts', 'cultures', 'events', 'figures', 'periods', 'wars'],
    con_: ['documents', 'events', 'figures', 'organizations', 'theories'],
};

/** The source repo for a domain, or null when it is not checked out. */
function resolveSource(candidates) {
    for (const name of candidates) {
        const dir = path.join(ROOT, '..', name, 'seed_data');
        if (fs.existsSync(dir)) return dir;
    }
    return null;
}

describe('domain seed copy', () => {
    describe('completeness — checkable without the source repos', () => {
        test('every declared collection has a directory with at least one seed file', () => {
            for (const [prefix, collections] of Object.entries(DOMAIN_COLLECTIONS)) {
                for (const collection of collections) {
                    const dir = path.join(DEST_ROOT, prefix + collection);
                    expect(fs.existsSync(dir)).toBe(true);
                    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
                    expect(files.length).toBeGreaterThan(0);
                }
            }
        });

        test('every seed file is valid JSON containing entities with ids', () => {
            for (const [prefix, collections] of Object.entries(DOMAIN_COLLECTIONS)) {
                for (const collection of collections) {
                    const dir = path.join(DEST_ROOT, prefix + collection);
                    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
                        const raw = fs.readFileSync(path.join(dir, file), 'utf8');
                        const parsed = JSON.parse(raw);
                        const items = Array.isArray(parsed) ? parsed : [parsed];
                        expect(items.length).toBeGreaterThan(0);
                        for (const entity of items) {
                            expect(typeof entity.id).toBe('string');
                            expect(entity.id.length).toBeGreaterThan(0);
                        }
                    }
                }
            }
        });

        test('entities carry the facet their domain shards on, not mythology', () => {
            // A history document with a `mythology` field would be a sign that
            // mythology data leaked into the history collections — the exact
            // failure the whole prefix scheme exists to prevent.
            const facets = { hist_: 'era', con_: 'category' };
            for (const [prefix, collections] of Object.entries(DOMAIN_COLLECTIONS)) {
                for (const collection of collections) {
                    const dir = path.join(DEST_ROOT, prefix + collection);
                    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
                        const parsed = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
                        for (const entity of (Array.isArray(parsed) ? parsed : [parsed])) {
                            expect(typeof entity[facets[prefix]]).toBe('string');
                            expect(entity.mythology).toBeUndefined();
                        }
                    }
                }
            }
        });
    });

    describe('fidelity to source — skipped when the source repos are absent', () => {
        const history = resolveSource(['Mnema', 'Clio']);
        const conspiracy = resolveSource(['Synomosia', 'Augur']);

        // A checkout of this repo alone cannot verify fidelity, and failing there
        // would make the suite depend on the developer's directory layout. Skipping
        // is honest; the completeness tests above still run everywhere.
        const maybe = (history || conspiracy) ? test : test.skip;

        maybe('the committed copy is byte-identical to its source', () => {
            const pairs = [
                [history, 'hist_'],
                [conspiracy, 'con_'],
            ].filter(([src]) => src);

            const mismatches = [];
            for (const [src, prefix] of pairs) {
                for (const collection of fs.readdirSync(src)) {
                    const collDir = path.join(src, collection);
                    if (!fs.statSync(collDir).isDirectory()) continue;
                    for (const file of fs.readdirSync(collDir)) {
                        if (!file.endsWith('.json') || file.startsWith('_')) continue;
                        const dest = path.join(DEST_ROOT, prefix + collection, file);
                        if (!fs.existsSync(dest)) {
                            mismatches.push(`missing: ${prefix}${collection}/${file}`);
                            continue;
                        }
                        const a = fs.readFileSync(path.join(collDir, file));
                        const b = fs.readFileSync(dest);
                        if (!a.equals(b)) mismatches.push(`drifted: ${prefix}${collection}/${file}`);
                    }
                }
            }

            // Named explicitly so the failure says which file to re-sync rather
            // than only that a comparison failed.
            expect(mismatches).toEqual([]);
        });

        maybe('the --check flag agrees with the comparison above', () => {
            let exitCode = 0;
            try {
                execFileSync(process.execPath, [SCRIPT, '--check'], { encoding: 'utf8' });
            } catch (err) {
                exitCode = err.status;
            }
            expect(exitCode).toBe(0);
        });
    });
});
