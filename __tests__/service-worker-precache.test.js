/**
 * Service Worker Precache Completeness Tests
 *
 * Guards against the class of breakage where scripts added to index.html
 * are not added to the service worker precache, causing offline / install
 * failures and cascade load errors.
 *
 * Static-analysis only — no browser or network required.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

describe('Service Worker Precache', () => {
    let indexHtml;
    let swSource;

    beforeAll(() => {
        indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        swSource = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
    });

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Parse all local <script src="..."> URLs from index.html.
     * CDN URLs (starting with http) are excluded — we can't precache those.
     */
    function getIndexScripts() {
        const scriptTagRe = /<script[^>]+src=["']([^"']+)["']/g;
        const scripts = [];
        let match;
        while ((match = scriptTagRe.exec(indexHtml)) !== null) {
            const src = match[1];
            if (!src.startsWith('http')) {
                // Normalise to leading-slash form so comparisons against SW entries work
                const normalised = src.startsWith('/') ? src : `/${src}`;
                scripts.push(normalised);
            }
        }
        return scripts;
    }

    /**
     * Parse string literals out of a named JS array in the SW source.
     * Handles both single- and double-quoted strings, and ignores comment lines.
     *
     * Strategy: grab the text between "const NAME = [" and the closing "];"
     * then extract every quoted string from that block.
     */
    function parsePrecacheArray(name) {
        // Grab everything from the array declaration to its closing bracket
        const arrayRe = new RegExp(`const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
        const arrayMatch = swSource.match(arrayRe);
        if (!arrayMatch) return [];

        const body = arrayMatch[1];
        const stringRe = /['"]([^'"]+)['"]/g;
        const entries = [];
        let m;
        while ((m = stringRe.exec(body)) !== null) {
            entries.push(m[1]);
        }
        return entries;
    }

    /**
     * Return the union of all three precache arrays (de-duped).
     */
    function getAllPrecacheEntries() {
        const assets   = parsePrecacheArray('PRECACHE_ASSETS');
        const critical = parsePrecacheArray('PRECACHE_CRITICAL');
        const enhanced = parsePrecacheArray('PRECACHE_ENHANCED');
        return [...new Set([...assets, ...critical, ...enhanced])];
    }

    // ---------------------------------------------------------------------------
    // Test 1 — every local script in index.html has a precache entry
    // ---------------------------------------------------------------------------

    test('every script in index.html has a precache entry', () => {
        const scripts = getIndexScripts();
        const allEntries = getAllPrecacheEntries();

        expect(scripts.length).toBeGreaterThan(0); // sanity: we found some scripts

        const missing = scripts.filter(src => !allEntries.includes(src));

        if (missing.length > 0) {
            // Produce a readable failure message listing every missing script
            const list = missing.map(s => `  ${s}`).join('\n');
            throw new Error(
                `${missing.length} script(s) in index.html are not in any SW precache array.\n` +
                `Add them to PRECACHE_ASSETS, PRECACHE_CRITICAL, or PRECACHE_ENHANCED in service-worker.js:\n${list}`
            );
        }
    });

    // ---------------------------------------------------------------------------
    // Test 2 — every precache entry references a file that exists on disk
    // ---------------------------------------------------------------------------

    test('all precache entries reference existing files', () => {
        const allEntries = getAllPrecacheEntries();
        expect(allEntries.length).toBeGreaterThan(0); // sanity

        const dead = allEntries.filter(entry => {
            // '/' maps to index.html; skip bare-directory paths that browsers resolve
            if (entry === '/') return false;

            // Strip leading slash and resolve to disk path
            const rel = entry.replace(/^\//, '');
            return !fs.existsSync(path.join(ROOT, rel));
        });

        if (dead.length > 0) {
            const list = dead.map(e => `  ${e}`).join('\n');
            fail(
                `${dead.length} precache entry/entries point to files that do not exist on disk.\n` +
                `Remove or fix these entries in service-worker.js:\n${list}`
            );
        }
    });

    // ---------------------------------------------------------------------------
    // Test 3 — MAX_CACHE_SIZE.static is large enough to hold all precache entries
    // ---------------------------------------------------------------------------

    test('MAX_CACHE_SIZE.static is large enough for all precache entries', () => {
        // Parse: const MAX_CACHE_SIZE = { static: 150, ... };
        const objRe = /const\s+MAX_CACHE_SIZE\s*=\s*\{([\s\S]*?)\}/;
        const objMatch = swSource.match(objRe);
        expect(objMatch).not.toBeNull();

        const objBody = objMatch[1];
        // Extract the numeric value for the "static" key
        const staticRe = /\bstatic\s*:\s*(\d+)/;
        const staticMatch = objBody.match(staticRe);
        expect(staticMatch).not.toBeNull();

        const maxStatic = parseInt(staticMatch[1], 10);
        expect(maxStatic).toBeGreaterThan(0);

        const total = getAllPrecacheEntries().length;
        expect(maxStatic).toBeGreaterThanOrEqual(total);
    });

    // ---------------------------------------------------------------------------
    // Test 4 — CACHE_VERSION is defined and follows a version pattern
    // ---------------------------------------------------------------------------

    test('CACHE_VERSION is defined and matches a version pattern', () => {
        // Matches patterns like: v1, v2.0, v3.1.2, v4.0.0-beta.1
        const versionRe = /const\s+CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/;
        const match = swSource.match(versionRe);

        expect(match).not.toBeNull();

        const version = match[1];
        expect(version).toMatch(/^v\d+(\.\d+)*(-[\w.]+)?$/);
    });
});
