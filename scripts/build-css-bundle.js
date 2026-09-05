#!/usr/bin/env node

/**
 * Concatenate the site's stylesheets into two bundles.
 *
 * ── Why ──────────────────────────────────────────────────────────────────────
 * index.html linked 72 stylesheets: 37 render-blocking and 35 using the
 * `media="print" onload="this.media='all'"` trick. The browser cannot paint
 * until every one of the blocking ones has arrived, so the page carried 35
 * serial round trips before first paint — the E2E performance suite measured 83
 * render-blocking resources against a budget of 5, and 113 seconds of summed
 * stylesheet load time against a budget of 2.96.
 *
 * ONE bundle, not two, and this is the whole design decision. The obvious move
 * is to keep the existing critical/deferred split and emit a bundle for each —
 * but the two sets INTERLEAVE in index.html, and 20 rules actually depend on
 * that interleaving. `css/hamburger-menu.css` is a blocking sheet that sits
 * after the deferred `css/admin-moderation.css`, so today it wins `.admin-tools-
 * section`; group all the blocking sheets ahead of all the deferred ones and
 * admin-moderation silently starts winning instead. Same for `.entity-panel`
 * (panel-shaders vs search-components), `.favorites-grid` (mythology-ambiance vs
 * user-dashboard), and six `@keyframes` names that would flip definition.
 *
 * Concatenating everything in exact document order is the only arrangement that
 * changes no rule at all. It does mean the formerly-deferred sheets now block
 * the first paint — 666 KB raw, but they compress to a fraction of that, and
 * trading 35 serial round trips for those bytes is a clear win. It should also
 * help cumulative layout shift, which was measured at 0.38 against a 0.25
 * budget: stylesheets that land after the first paint are a textbook cause, and
 * with one bundle nothing lands late.
 *
 * ── Source of truth ──────────────────────────────────────────────────────────
 * css/bundle.manifest.json holds the ordered file list for each bundle. It is
 * the SSOT, not index.html — once index.html links only the bundle it no longer
 * records which files went into it, or in what order.
 *
 * ORDER IS LOAD-BEARING, per the above. The manifest preserves the exact
 * document order the <link> tags had. Reordering entries silently changes which
 * rule wins, and nothing will fail loudly when it does.
 *
 * ── @import ──────────────────────────────────────────────────────────────────
 * Four stylesheets @import others. A bundle cannot keep a relative @import: the
 * path would resolve against css/ instead of the importing file's directory. So
 * local imports are inlined in place, and remote ones (Google Fonts) are hoisted
 * to the top, because CSS requires @import to precede every other rule.
 *
 * Asset url() references need no rewriting — verified: no stylesheet in this
 * repo references an asset by relative path. If that ever changes, a file moved
 * into css/ from elsewhere would break, so `--check` also fails on any new
 * relative url() it does not recognise.
 *
 * Usage:
 *   node scripts/build-css-bundle.js            # write the bundles
 *   node scripts/build-css-bundle.js --check    # exit 1 if the bundles are stale
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'css', 'bundle.manifest.json');

/** Bundle name -> output path. Keys must match the manifest's arrays. */
const OUTPUTS = {
    main: path.join(ROOT, 'css', 'bundle.css')
};

/** Matches `@import url(...)` and `@import "..."`, capturing the target. */
const IMPORT_RE = /@import\s+(?:url\(\s*)?['"]?([^'")\s;]+)['"]?\s*\)?\s*;/gi;

/** Matches every url(...) so relative asset references can be detected. */
const URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;

function isRemote(ref) {
    return /^(https?:)?\/\//i.test(ref) || ref.startsWith('data:');
}

/**
 * Read one stylesheet, inlining its local @imports and collecting its remote
 * ones. `seen` spans the whole bundle so a file imported twice is emitted once.
 */
function readWithImports(absPath, seen, remoteImports, warnings) {
    const rel = path.relative(ROOT, absPath).replace(/\\/g, '/');
    if (seen.has(rel)) return '';
    seen.add(rel);

    if (!fs.existsSync(absPath)) {
        throw new Error(`Stylesheet listed in the manifest does not exist: ${rel}`);
    }

    // Normalise to LF. The source stylesheets are checked out with CRLF on
    // Windows and LF on Linux, while the strings this script adds are always LF,
    // so without this the bundle is a mix whose exact bytes depend on the
    // platform that built it — and `--check`, which byte-compares, would fail on
    // a perfectly up-to-date bundle. .gitattributes pins the committed file to LF
    // so the checkout matches what this produces everywhere.
    const raw = fs.readFileSync(absPath, 'utf8').replace(/\r\n/g, '\n');
    const dir = path.dirname(absPath);

    // Inlined import bodies are emitted ahead of this file's own rules, which is
    // where the browser would have applied them: @import must precede all other
    // rules, so an imported sheet always sits lower in the cascade than the file
    // importing it.
    let inlined = '';
    const body = raw.replace(IMPORT_RE, (match, ref) => {
        if (isRemote(ref)) {
            remoteImports.add(ref);
            return `/* hoisted to top of bundle: ${ref} */`;
        }
        const target = path.resolve(dir, ref);
        inlined += readWithImports(target, seen, remoteImports, warnings);
        return `/* inlined: ${path.relative(ROOT, target).replace(/\\/g, '/')} */`;
    });

    // Guard the assumption that no stylesheet references an asset by relative
    // path. Bundling moves every file's base URL to css/, so a relative asset
    // reference from styles.css or themes/ would 404 after this runs.
    let m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(body)) !== null) {
        const ref = m[1].trim();
        if (isRemote(ref) || ref.startsWith('#') || ref.startsWith('/')) continue;
        // A fragment-only reference inside an encoded data URI (e.g. "%23noise")
        // names an element in that same document, not a file on disk.
        if (ref.includes('%23') || ref.includes('#')) continue;
        // Imports were already replaced above, so anything left is an asset.
        const fromDir = path.relative(ROOT, dir).replace(/\\/g, '/') || '.';
        if (fromDir !== 'css') {
            warnings.push(
                `${rel} references "${ref}" by relative path. Bundling resolves it ` +
                `against css/ instead of ${fromDir}/, so it will 404. Move the asset, ` +
                `or make the reference root-relative.`
            );
        }
    }

    const header = `\n/* ==== ${rel} ==== */\n`;
    return inlined + header + body + '\n';
}

function buildBundle(files) {
    const seen = new Set();
    const remoteImports = new Set();
    const warnings = [];

    let css = '';
    for (const rel of files) {
        css += readWithImports(path.join(ROOT, rel), seen, remoteImports, warnings);
    }

    // @import is only legal at the very top of a stylesheet.
    let prelude = '';
    for (const ref of remoteImports) {
        prelude += `@import url('${ref}');\n`;
    }

    const banner =
        '/* GENERATED by scripts/build-css-bundle.js - do not edit.\n' +
        '   Edit the source stylesheets, then run: npm run build:css\n' +
        `   Sources (in cascade order): ${files.length} files */\n`;

    return { css: banner + prelude + css, warnings };
}

function loadManifest() {
    if (!fs.existsSync(MANIFEST_PATH)) {
        throw new Error(
            `Missing ${path.relative(ROOT, MANIFEST_PATH)}. It lists the stylesheets ` +
            `that go into each bundle, in cascade order.`
        );
    }
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    for (const key of Object.keys(OUTPUTS)) {
        if (!Array.isArray(manifest[key])) {
            throw new Error(`Manifest is missing the "${key}" array.`);
        }
    }
    return manifest;
}

function main() {
    const check = process.argv.includes('--check');
    const manifest = loadManifest();

    let stale = false;
    const allWarnings = [];

    for (const [name, outPath] of Object.entries(OUTPUTS)) {
        const { css, warnings } = buildBundle(manifest[name]);
        allWarnings.push(...warnings);

        const relOut = path.relative(ROOT, outPath).replace(/\\/g, '/');
        const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;

        if (check) {
            if (current !== css) {
                stale = true;
                console.error(
                    `[css-bundle] ${relOut} is stale — a source stylesheet changed ` +
                    `without the bundle being rebuilt. Run: npm run build:css`
                );
            }
        } else if (current === css) {
            console.log(`[css-bundle] ${relOut} already up to date (${manifest[name].length} sources)`);
        } else {
            fs.writeFileSync(outPath, css, 'utf8');
            const kb = (Buffer.byteLength(css) / 1024).toFixed(0);
            console.log(
                `[css-bundle] wrote ${relOut} — ${manifest[name].length} sources, ${kb} KB`
            );
        }
    }

    for (const w of allWarnings) console.error(`[css-bundle] WARNING: ${w}`);
    if (allWarnings.length && check) stale = true;

    if (stale) process.exit(1);
}

if (require.main === module) {
    try {
        main();
    } catch (err) {
        console.error(`[css-bundle] ${err.message}`);
        process.exit(1);
    }
}

module.exports = { buildBundle, loadManifest, OUTPUTS, MANIFEST_PATH };
