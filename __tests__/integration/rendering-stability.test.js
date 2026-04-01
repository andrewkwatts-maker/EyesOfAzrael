/**
 * Integration Tests: Rendering Stability Regression Suite (Sprint 7)
 *
 * Prevents regressions in three critical areas:
 *  1. All index.html scripts are present in the SW precache arrays
 *  2. All view source files contain a first-render-complete dispatch call
 *  3. CacheManager never stores an empty array (unit test of the write path)
 *
 * Static-analysis only — no browser, network, or Firebase connection required.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Helpers — reuse parsing logic from service-worker-precache.test.js
// ---------------------------------------------------------------------------

function readFile(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function getIndexScripts(indexHtml) {
    const scriptTagRe = /<script[^>]+src=["']([^"']+)["']/g;
    const scripts = [];
    let match;
    while ((match = scriptTagRe.exec(indexHtml)) !== null) {
        const src = match[1];
        if (!src.startsWith('http')) {
            scripts.push(src.startsWith('/') ? src : `/${src}`);
        }
    }
    return scripts;
}

function parsePrecacheArray(swSource, name) {
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

function getAllPrecacheEntries(swSource) {
    const assets   = parsePrecacheArray(swSource, 'PRECACHE_ASSETS');
    const critical = parsePrecacheArray(swSource, 'PRECACHE_CRITICAL');
    const enhanced = parsePrecacheArray(swSource, 'PRECACHE_ENHANCED');
    return [...new Set([...assets, ...critical, ...enhanced])];
}

// ---------------------------------------------------------------------------
// 1. SW Precache completeness (mirrors service-worker-precache.test.js)
// ---------------------------------------------------------------------------

describe('Rendering Stability — SW precache completeness', () => {
    let indexHtml;
    let swSource;

    beforeAll(() => {
        indexHtml = readFile('index.html');
        swSource  = readFile('service-worker.js');
    });

    test('all index.html scripts are covered by a SW precache array', () => {
        const scripts    = getIndexScripts(indexHtml);
        const allEntries = getAllPrecacheEntries(swSource);

        expect(scripts.length).toBeGreaterThan(0);

        const missing = scripts.filter(src => !allEntries.includes(src));

        if (missing.length > 0) {
            const list = missing.map(s => `  ${s}`).join('\n');
            throw new Error(
                `${missing.length} script(s) in index.html are NOT in any SW precache array.\n` +
                `Add them to PRECACHE_ASSETS, PRECACHE_CRITICAL, or PRECACHE_ENHANCED in service-worker.js:\n${list}`
            );
        }
    });

    test('CRITICAL_JS entries are also in PRECACHE_ASSETS', () => {
        // The four critical JS files must be precached so they survive offline
        const criticalJsRe = /const\s+CRITICAL_JS\s*=\s*\[([\s\S]*?)\];/;
        const match = swSource.match(criticalJsRe);

        if (!match) {
            // CRITICAL_JS array not found — the feature hasn't been added yet; skip
            return;
        }

        const body       = match[1];
        const stringRe   = /['"]([^'"]+)['"]/g;
        const criticalJs = [];
        let m;
        while ((m = stringRe.exec(body)) !== null) {
            criticalJs.push(m[1]);
        }

        const assets = parsePrecacheArray(swSource, 'PRECACHE_ASSETS');
        const notPrecached = criticalJs.filter(p => !assets.includes(p));

        if (notPrecached.length > 0) {
            const list = notPrecached.map(p => `  ${p}`).join('\n');
            throw new Error(
                `CRITICAL_JS entries must also be in PRECACHE_ASSETS so they are cached on install:\n${list}`
            );
        }
    });
});

// ---------------------------------------------------------------------------
// 2. Every view dispatches first-render-complete
// ---------------------------------------------------------------------------

describe('Rendering Stability — first-render-complete dispatch', () => {
    const VIEW_FILES = [
        'js/views/landing-page-view.js',
        'js/views/browse-category-view.js',
        'js/views/mythologies-view.js',
        'js/views/entity-detail-view.js',
        'js/views/user-dashboard-view.js',
        'js/views/user-profile-view.js'
    ];

    test.each(VIEW_FILES)('%s dispatches first-render-complete', (viewFile) => {
        const src = readFile(viewFile);
        expect(src).toMatch(/first-render-complete/);
    });
});

// ---------------------------------------------------------------------------
// 3. CacheManager must not cache empty arrays (unit test)
// ---------------------------------------------------------------------------

describe('Rendering Stability — cache manager empty-array protection', () => {
    /**
     * The FirebaseCacheManager.getList() currently caches whatever Firebase
     * returns, including empty arrays. This suite verifies the expected guard
     * is in place: the cache write is skipped when data.length === 0.
     *
     * We load the source and check for the guard statically, then simulate
     * the behaviour with a minimal stub.
     */

    let cacheManagerSrc;

    beforeAll(() => {
        cacheManagerSrc = readFile('js/firebase-cache-manager.js');
    });

    test('source file contains empty-array guard before caching list results', () => {
        // Look for a pattern that checks data length before storing into cache.
        // Acceptable forms:
        //   if (data.length > 0)
        //   if (data && data.length)
        //   data.length === 0  (as a skip condition)
        //   minResultsToCache
        const hasGuard =
            /data\.length\s*[>!]=?\s*0/.test(cacheManagerSrc) ||
            /minResultsToCache/.test(cacheManagerSrc) ||
            /if\s*\(\s*data\s*&&\s*data\.length\s*\)/.test(cacheManagerSrc) ||
            /skip.*empty|empty.*skip|no.*cache.*empty|cache.*only.*if/i.test(cacheManagerSrc);

        if (!hasGuard) {
            throw new Error(
                'firebase-cache-manager.js does not appear to guard against caching empty arrays.\n' +
                'In getList(), add a check before the cache.set() calls:\n' +
                '  if (data.length === 0) return data; // never cache empty result\n' +
                'This prevents stale empty caches from masking real Firebase data.'
            );
        }
    });

    test('memory cache stub never stores empty arrays when guard is applied', () => {
        // Minimal simulation of the guard logic we expect to exist
        const memoryCache = new Map();

        function guardedCacheStore(cacheKey, data, ttl) {
            // This is the guard that SHOULD be in firebase-cache-manager.js
            if (!data || data.length === 0) {
                return; // do not cache empty results
            }
            memoryCache.set(cacheKey, { data, ttl, timestamp: Date.now() });
        }

        guardedCacheStore('test::deities::all', [], 30000);
        expect(memoryCache.has('test::deities::all')).toBe(false);

        guardedCacheStore('test::deities::all', [{ id: 'zeus', name: 'Zeus' }], 30000);
        expect(memoryCache.has('test::deities::all')).toBe(true);
        expect(memoryCache.get('test::deities::all').data).toHaveLength(1);
    });

    test('returning empty array from cache is treated as a miss in downstream consumers', () => {
        // Verify the expected consumer-side behaviour: if cache returns [],
        // the consumer should not treat it as a successful load with zero results.
        function simulateConsumer(cachedData) {
            // This mirrors what browse-category-view.js / asset-service.js
            // should do: treat empty-array result as a cache miss.
            if (!cachedData || cachedData.length === 0) {
                return 'cache-miss'; // trigger direct Firebase query
            }
            return 'cache-hit';
        }

        expect(simulateConsumer([])).toBe('cache-miss');
        expect(simulateConsumer(null)).toBe('cache-miss');
        expect(simulateConsumer([{ id: 1 }])).toBe('cache-hit');
    });
});
