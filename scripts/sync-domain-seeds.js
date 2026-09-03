#!/usr/bin/env node
/**
 * Sync the history and conspiracy seed data from its source repositories into
 * `firebase-assets-downloaded/`, where the static-base export reads it.
 *
 * ── Why a copy exists at all ─────────────────────────────────────────────────
 *
 * The seeds are *authored* in the package repositories — `Mnema/seed_data` for
 * history, `Synomosia/seed_data` for conspiracy — which is where they are
 * reviewed and where `validate_seed.py` runs. Those are the source of truth.
 *
 * But the static-base export reads `firebase-assets-downloaded/`, and a checkout
 * of this repository alone does not have the sibling repositories. That is not
 * hypothetical: an export run without them silently produced two domains instead
 * of four and had no way to notice the other two were missing.
 *
 * So a copy lives here. A copy is a liability unless it is *provably* derived,
 * which is what this script and its test provide: one command regenerates it,
 * and `--check` fails if the copy and its source have diverged. Edit the source,
 * run the sync — never edit the copy.
 *
 * Usage:
 *   node scripts/sync-domain-seeds.js            # report status
 *   node scripts/sync-domain-seeds.js --check    # exit 1 if the copy has drifted
 *   node scripts/sync-domain-seeds.js --write    # regenerate the copy from source
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEST_ROOT = path.join(ROOT, 'firebase-assets-downloaded');

const CHECK = process.argv.includes('--check');
const WRITE = process.argv.includes('--write');

/**
 * Where each domain's seeds are authored. The repositories are named for the
 * PyPI packages (Mnema, Synomosia) but are often cloned under their older
 * directory names (Clio, Augur), so both are accepted — a sync that silently
 * finds nothing is worse than one that looks in two places.
 */
const SOURCES = [
    { domain: 'history', prefix: 'hist_', candidates: ['Mnema', 'Clio'] },
    { domain: 'conspiracy', prefix: 'con_', candidates: ['Synomosia', 'Augur'] },
];

/** Resolve a source directory, or null when the sibling repo is not checked out. */
function resolveSource(candidates) {
    const roots = [path.join(ROOT, '..'), process.env.EOA_SIBLING_ROOT].filter(Boolean);
    for (const root of roots) {
        for (const name of candidates) {
            const dir = path.join(root, name, 'seed_data');
            if (fs.existsSync(dir)) return dir;
        }
    }
    return null;
}

function listSeedFiles(dir) {
    const out = [];
    for (const collection of fs.readdirSync(dir).sort()) {
        const collDir = path.join(dir, collection);
        if (!fs.statSync(collDir).isDirectory()) continue;
        for (const file of fs.readdirSync(collDir).sort()) {
            if (!file.endsWith('.json') || file.startsWith('_')) continue;
            out.push({ collection, file, abs: path.join(collDir, file) });
        }
    }
    return out;
}

function main() {
    let drifted = 0, missing = 0, synced = 0, unavailable = 0;

    for (const { domain, prefix, candidates } of SOURCES) {
        const src = resolveSource(candidates);
        if (!src) {
            // Not an error. Most checkouts of this repo alone will hit this, and
            // the committed copy is what they use.
            console.log(`  ${domain}: source repo not checked out (${candidates.join(' or ')}) — using the committed copy`);
            unavailable++;
            continue;
        }

        for (const { collection, file, abs } of listSeedFiles(src)) {
            const destDir = path.join(DEST_ROOT, prefix + collection);
            const dest = path.join(destDir, file);
            const source = fs.readFileSync(abs);

            if (!fs.existsSync(dest)) {
                missing++;
                if (WRITE) {
                    fs.mkdirSync(destDir, { recursive: true });
                    fs.writeFileSync(dest, source);
                    synced++;
                    console.log(`  + ${prefix}${collection}/${file}`);
                } else {
                    console.log(`  MISSING  ${prefix}${collection}/${file}`);
                }
                continue;
            }

            if (!fs.readFileSync(dest).equals(source)) {
                drifted++;
                if (WRITE) {
                    fs.writeFileSync(dest, source);
                    synced++;
                    console.log(`  ~ ${prefix}${collection}/${file}`);
                } else {
                    console.log(`  DRIFTED  ${prefix}${collection}/${file}`);
                }
            }
        }
    }

    if (WRITE) {
        console.log(`\nSynced ${synced} file(s) from source.`);
        return;
    }

    if (drifted || missing) {
        console.error(
            `\n${drifted} drifted, ${missing} missing. The copy under ` +
            `firebase-assets-downloaded/ no longer matches its source.\n` +
            `Fix by editing the SOURCE (Mnema/seed_data, Synomosia/seed_data), then:\n` +
            `  node scripts/sync-domain-seeds.js --write`
        );
        if (CHECK) process.exit(1);
        return;
    }

    if (unavailable === SOURCES.length) {
        console.log('\nNo source repositories available — nothing verified.');
    } else {
        console.log('\nCopy matches source.');
    }
}

main();
