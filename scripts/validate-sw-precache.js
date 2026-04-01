#!/usr/bin/env node
/**
 * Service Worker Precache Validator
 * Checks that every local <script src="..."> in index.html has an entry
 * in the service worker precache arrays (PRECACHE_ASSETS, PRECACHE_CRITICAL,
 * PRECACHE_ENHANCED).  Scripts missing from the precache caused cascade load
 * failures on the live site — this script catches that in CI.
 *
 * Exit codes:
 *   0 — all scripts are covered
 *   1 — one or more scripts are missing from the precache (CI failure)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract all local <script src="..."> paths from an HTML string.
 * CDN URLs (starting with http or //) are excluded.
 * Returns paths normalised to the /leading-slash form used in the SW arrays.
 */
function extractHtmlScripts(html) {
    const scripts = [];
    const re = /src="([^"]+\.js)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        const src = m[1].trim();
        // Skip absolute URLs (CDN)
        if (src.startsWith('http') || src.startsWith('//')) continue;
        // Normalise to /leading-slash form
        const normalised = src.startsWith('/') ? src : '/' + src;
        scripts.push(normalised);
    }
    return scripts;
}

/**
 * Extract all string literals from named const array blocks in a JS source.
 * Handles PRECACHE_ASSETS, PRECACHE_CRITICAL, PRECACHE_ENHANCED.
 * Returns a Set of URL strings.
 */
function extractPrecacheEntries(source) {
    const entries = new Set();
    // Match each named array block then collect quoted strings inside it
    const arrayNames = ['PRECACHE_ASSETS', 'PRECACHE_CRITICAL', 'PRECACHE_ENHANCED'];
    for (const name of arrayNames) {
        // Find the array declaration: const NAME = [ ... ];
        const startRe = new RegExp(`const\\s+${name}\\s*=\\s*\\[`);
        const startMatch = startRe.exec(source);
        if (!startMatch) continue;

        // Walk forward from the opening bracket to find the matching closing ]
        let depth = 0;
        let i = startMatch.index + startMatch[0].length - 1; // position of '['
        let blockEnd = -1;
        while (i < source.length) {
            if (source[i] === '[') depth++;
            else if (source[i] === ']') {
                depth--;
                if (depth === 0) { blockEnd = i; break; }
            }
            i++;
        }
        if (blockEnd === -1) continue;

        const block = source.slice(startMatch.index, blockEnd + 1);
        // Collect all quoted strings inside the block
        const strRe = /['"]([^'"]+)['"]/g;
        let sm;
        while ((sm = strRe.exec(block)) !== null) {
            entries.add(sm[1]);
        }
    }
    return entries;
}

// ---------------------------------------------------------------------------
// Core validation logic
// ---------------------------------------------------------------------------

/**
 * @param {object} [opts]
 * @param {string} [opts.indexPath]        - Absolute path to index.html
 * @param {string} [opts.swPath]           - Absolute path to service-worker.js
 * @param {boolean} [opts.checkDiskFiles]  - Warn if precache entry has no file
 * @returns {{ missing: string[], orphaned: string[], scripts: string[], precached: Set }}
 */
function validatePrecache(opts) {
    opts = opts || {};
    const indexPath = opts.indexPath || path.join(ROOT, 'index.html');
    const swPath    = opts.swPath    || path.join(ROOT, 'service-worker.js');
    const checkDisk = opts.checkDiskFiles !== false; // default true

    if (!fs.existsSync(indexPath)) {
        throw new Error(`index.html not found at: ${indexPath}`);
    }
    if (!fs.existsSync(swPath)) {
        throw new Error(`service-worker.js not found at: ${swPath}`);
    }

    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    const swContent   = fs.readFileSync(swPath,    'utf8');

    const scripts  = extractHtmlScripts(htmlContent);
    const precached = extractPrecacheEntries(swContent);

    // Scripts in index.html but absent from any precache array
    const missing = scripts.filter(s => !precached.has(s));

    // Precache entries (JS only) whose file does not exist on disk
    const orphaned = [];
    if (checkDisk) {
        for (const entry of precached) {
            if (!entry.endsWith('.js')) continue;
            const filePath = path.join(ROOT, entry);
            if (!fs.existsSync(filePath)) {
                orphaned.push(entry);
            }
        }
    }

    return { missing, orphaned, scripts, precached };
}

// ---------------------------------------------------------------------------
// CLI runner
// ---------------------------------------------------------------------------

function run() {
    console.log('\n[SW Precache Validator]');

    let result;
    try {
        result = validatePrecache();
    } catch (err) {
        console.error(`  ERROR: ${err.message}`);
        process.exit(1);
    }

    const { missing, orphaned, scripts, precached } = result;

    // Count only JS entries in the precache for a fair comparison
    const precachedJsCount = [...precached].filter(e => e.endsWith('.js')).length;

    console.log(`  Scripts in index.html : ${scripts.length}`);
    console.log(`  JS entries in precache: ${precachedJsCount}`);

    if (missing.length === 0) {
        console.log('  \u2713 All scripts have precache entries\n');
    } else {
        console.error(`\n  MISSING from precache (${missing.length}):`);
        for (const s of missing) {
            console.error(`    - ${s}`);
        }
        console.log('');
    }

    if (orphaned.length > 0) {
        console.warn(`  WARNING: precache entries with no file on disk (${orphaned.length}):`);
        for (const s of orphaned) {
            console.warn(`    - ${s}`);
        }
        console.log('');
    }

    if (missing.length > 0) {
        process.exit(1);
    }
}

// Only run automatically when invoked directly (not when required by tests)
if (require.main === module) {
    run();
}

// ---------------------------------------------------------------------------
// Module export (window.X pattern is not applicable in Node-only scripts;
// we export the core function for use in Jest / other scripts)
// ---------------------------------------------------------------------------

/* eslint-disable no-undef */
if (typeof window !== 'undefined') {
    window.SWPrecacheValidator = { validatePrecache };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validatePrecache };
}
