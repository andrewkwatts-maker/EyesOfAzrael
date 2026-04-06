/**
 * Visual Patrol — Automated Screenshot Collector (Enhanced)
 *
 * Navigates the live site (or localhost), screenshots home + 10 random diverse pages.
 * Captures early (2 s) and settled (5 s) screenshots to detect delayed-load visual bugs.
 * Records page load times and console errors.
 * Archives results to screenshots/history/<timestamp>/ for cross-cycle comparison.
 * Outputs a JSON manifest for downstream Claude analysis.
 *
 * Usage: node scripts/visual-patrol.js [--base-url https://www.eyesofazrael.com]
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ── Route pools ────────────────────────────────────────────────────────────
// Every category represented so patrols cover the full surface area

const ROUTE_POOLS = {
    // Core browsing
    browse: [
        '#/browse/deities', '#/browse/heroes', '#/browse/creatures',
        '#/browse/items', '#/browse/places', '#/browse/texts',
        '#/browse/rituals', '#/browse/symbols', '#/browse/herbs',
        '#/browse/archetypes',
    ],
    // Filtered browse with mythology context
    browseFiltered: [
        '#/browse/deities/greek', '#/browse/deities/norse',
        '#/browse/deities/egyptian', '#/browse/deities/celtic',
        '#/browse/deities/hindu', '#/browse/deities/japanese',
        '#/browse/deities/mesopotamian', '#/browse/deities/aztec',
        '#/browse/creatures/greek', '#/browse/creatures/norse',
        '#/browse/creatures/japanese', '#/browse/creatures/celtic',
        '#/browse/heroes/norse', '#/browse/heroes/greek',
        '#/browse/items/egyptian', '#/browse/items/norse',
        '#/browse/places/greek', '#/browse/places/norse',
        '#/browse/texts/hindu', '#/browse/rituals/celtic',
    ],
    // Mythology overview pages
    mythologies: [
        '#/mythologies',
        '#/mythology/greek', '#/mythology/norse', '#/mythology/egyptian',
        '#/mythology/celtic', '#/mythology/hindu', '#/mythology/japanese',
        '#/mythology/chinese', '#/mythology/mesopotamian', '#/mythology/aztec',
        '#/mythology/roman', '#/mythology/polynesian', '#/mythology/aboriginal',
        '#/mythology/babylonian', '#/mythology/slavic', '#/mythology/finnish',
    ],
    // Entity detail pages (known entities from Firebase)
    entityDetail: [
        '#/entity/deities/greek_zeus',
        '#/entity/deities/greek_athena',
        '#/entity/deities/norse_odin',
        '#/entity/deities/norse_thor',
        '#/entity/deities/egyptian_osiris',
        '#/entity/deities/egyptian_ra',
        '#/entity/deities/hindu_shiva',
        '#/entity/heroes/greek_hercules',
        '#/entity/heroes/greek_perseus',
        '#/entity/creatures/greek_medusa',
        '#/entity/creatures/norse_jormungandr',
        '#/entity/creatures/celtic_banshee',
        '#/entity/items/norse_mjolnir',
        '#/entity/places/greek_olympus',
    ],
    // Utility and feature pages
    utility: [
        '#/search',
        '#/search?q=zeus',
        '#/search?q=dragon',
        '#/search?mode=corpus',
        '#/compare',
        '#/about',
        '#/corpus-explorer',
    ],
    // Auth-gated & admin pages (test auth gates + UI)
    authPages: [
        '#/dashboard',
        '#/profile',
        // These will show login prompts — we verify the auth gate renders correctly
    ],
};

/**
 * Pick 10 diverse routes: at least 2 from each major pool, fill remainder randomly.
 * Ensures each cycle covers entity details, search, browse, mythology, utility, and auth pages.
 */
function pickDiverseRoutes(count = 10) {
    const picks = [];
    const used = new Set();

    function pickFrom(pool, n) {
        const candidates = (ROUTE_POOLS[pool] || []).filter(r => !used.has(r));
        for (let i = 0; i < n && candidates.length > 0; i++) {
            const idx = Math.floor(Math.random() * candidates.length);
            picks.push(candidates[idx]);
            used.add(candidates[idx]);
            candidates.splice(idx, 1);
        }
    }

    // Guaranteed representation
    pickFrom('browse', 1);
    pickFrom('browseFiltered', 1);
    pickFrom('mythologies', 1);
    pickFrom('entityDetail', 2);   // Always test at least 2 entity detail pages
    pickFrom('utility', 1);
    pickFrom('authPages', 1);

    // Fill remaining slots from all routes
    const allRoutes = Object.values(ROUTE_POOLS).flat().filter(r => !used.has(r));
    while (picks.length < count && allRoutes.length > 0) {
        const idx = Math.floor(Math.random() * allRoutes.length);
        picks.push(allRoutes[idx]);
        used.add(allRoutes[idx]);
        allRoutes.splice(idx, 1);
    }

    return picks;
}

async function run() {
    const args = process.argv.slice(2);
    const baseUrlIdx = args.indexOf('--base-url');
    const baseUrl = baseUrlIdx >= 0
        ? args[baseUrlIdx + 1]
        : 'https://www.eyesofazrael.com';

    const countIdx = args.indexOf('--count');
    const pageCount = countIdx >= 0 ? parseInt(args[countIdx + 1], 10) : 10;

    const outDir = path.join(__dirname, '..', 'screenshots', 'patrol');
    fs.mkdirSync(outDir, { recursive: true });

    // Archive previous patrol to history before wiping
    const historyDir = path.join(__dirname, '..', 'screenshots', 'history');
    fs.mkdirSync(historyDir, { recursive: true });

    const existingScreenshots = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));
    if (existingScreenshots.length > 0) {
        const prevManifestPath = path.join(outDir, 'manifest.json');
        if (fs.existsSync(prevManifestPath)) {
            try {
                const prevManifest = JSON.parse(fs.readFileSync(prevManifestPath, 'utf8'));
                const archiveTimestamp = prevManifest.timestamp || new Date().toISOString().replace(/[:.]/g, '-');
                const archiveSubdir = path.join(historyDir, archiveTimestamp);
                fs.mkdirSync(archiveSubdir, { recursive: true });

                // Copy screenshots and manifest
                for (const f of [...existingScreenshots, 'manifest.json']) {
                    const src = path.join(outDir, f);
                    const dst = path.join(archiveSubdir, f);
                    if (fs.existsSync(src)) fs.copyFileSync(src, dst);
                }
                console.log(`[patrol] Archived previous patrol to ${archiveSubdir}`);
            } catch (e) {
                console.log(`[patrol] Archive failed (non-fatal): ${e.message}`);
            }
        }
        // Clean current patrol dir
        for (const f of [...existingScreenshots, 'manifest.json']) {
            const fp = path.join(outDir, f);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const manifest = {
        timestamp,
        baseUrl,
        cycleTime: new Date().toISOString(),
        pages: [],
        performanceSummary: {},
    };

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Collect console errors + warnings
    const consoleErrors = [];
    const consoleWarnings = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push({ url: page.url(), text: msg.text() });
        } else if (msg.type() === 'warning') {
            consoleWarnings.push({ url: page.url(), text: msg.text() });
        }
    });

    // Track network requests (for redundancy detection)
    const networkRequests = [];
    page.on('request', req => {
        if (req.url().includes('firestore') || req.url().includes('googleapis')) {
            networkRequests.push({ url: req.url().substring(0, 120), method: req.method() });
        }
    });

    // ── Home page ──────────────────────────────────────────────────────────
    console.log('[patrol] Loading home page...');
    const homeStart = Date.now();
    try {
        await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
        console.log('[patrol] networkidle timed out on home, continuing...');
    }
    const homeLoadTime = Date.now() - homeStart;

    // Early screenshot at ~2 seconds (catches delayed-load bugs)
    await page.waitForTimeout(2000);
    const homeEarlyPath = path.join(outDir, `home_early_${timestamp}.png`);
    await page.screenshot({ path: homeEarlyPath, fullPage: true });

    // Settled screenshot at 5 seconds
    await page.waitForTimeout(3000);
    const homePath = path.join(outDir, `home_${timestamp}.png`);
    await page.screenshot({ path: homePath, fullPage: true });

    const homeSpinnerStuck = await page.evaluate(() => {
        const loader = document.getElementById('loading-container');
        return loader && loader.style.display !== 'none' && !loader.classList.contains('hidden');
    });

    manifest.pages.push({
        route: '#/',
        name: 'Home',
        screenshot: homePath,
        earlyScreenshot: homeEarlyPath,
        loadTimeMs: homeLoadTime,
        spinnerStuck: homeSpinnerStuck || false,
    });
    console.log(`[patrol] Home page captured (${homeLoadTime}ms load time).`);

    // ── N random pages ────────────────────────────────────────────────────
    const randomRoutes = pickDiverseRoutes(pageCount);
    console.log(`[patrol] Selected ${randomRoutes.length} routes: ${randomRoutes.join(', ')}`);

    const pageTimes = [];

    for (let i = 0; i < randomRoutes.length; i++) {
        const route = randomRoutes[i];
        const safeName = route.replace(/[#\/?=&]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '') || 'root';
        const screenshotPath = path.join(outDir, `${safeName}_${timestamp}.png`);
        const earlyPath = path.join(outDir, `${safeName}_early_${timestamp}.png`);

        console.log(`[patrol] (${i + 1}/${randomRoutes.length}) Navigating to ${route}...`);

        const navStart = Date.now();
        try {
            const fullUrl = `${baseUrl}/${route}`;
            await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

            // Early screenshot — captures before Firebase data resolves
            await page.waitForTimeout(1500);
            await page.screenshot({ path: earlyPath, fullPage: true });

            // Settled screenshot — after Firebase data + animations
            await page.waitForTimeout(3500);
            const loadTimeMs = Date.now() - navStart;
            pageTimes.push(loadTimeMs);

            const spinnerVisible = await page.evaluate(() => {
                const loader = document.getElementById('loading-container');
                return loader && loader.style.display !== 'none' && !loader.classList.contains('hidden');
            });

            const hasVisibleError = await page.evaluate(() => {
                const text = document.body ? document.body.innerText || '' : '';
                return /TypeError|ReferenceError|Cannot read|is not a function|undefined is not/i.test(text.substring(0, 1000));
            });

            const hasEmptyGrid = await page.evaluate(() => {
                // Check if page has grid/list containers that are empty
                const grids = document.querySelectorAll('.entities-grid, .cards-grid, .results-grid, .mythology-grid');
                for (const g of grids) {
                    if (g.children.length === 0) return true;
                }
                return false;
            });

            await page.screenshot({ path: screenshotPath, fullPage: true });

            manifest.pages.push({
                route,
                name: safeName,
                screenshot: screenshotPath,
                earlyScreenshot: earlyPath,
                loadTimeMs,
                spinnerStuck: spinnerVisible || false,
                hasVisibleError: hasVisibleError || false,
                hasEmptyGrid: hasEmptyGrid || false,
            });

            let flags = '';
            if (spinnerVisible) flags += ' [SPINNER STUCK]';
            if (hasVisibleError) flags += ' [JS ERROR VISIBLE]';
            if (hasEmptyGrid) flags += ' [EMPTY GRID]';
            console.log(`[patrol]   Captured in ${loadTimeMs}ms${flags}`);

        } catch (err) {
            const loadTimeMs = Date.now() - navStart;
            console.error(`[patrol]   FAILED (${loadTimeMs}ms): ${err.message}`);
            try {
                await page.screenshot({ path: screenshotPath, fullPage: true });
                manifest.pages.push({
                    route,
                    name: safeName,
                    screenshot: screenshotPath,
                    earlyScreenshot: null,
                    loadTimeMs,
                    error: err.message,
                });
            } catch (_) { /* ignore */ }
        }
    }

    await browser.close();

    // ── Performance summary ────────────────────────────────────────────────
    if (pageTimes.length > 0) {
        const sorted = [...pageTimes].sort((a, b) => a - b);
        manifest.performanceSummary = {
            avgLoadMs: Math.round(pageTimes.reduce((a, b) => a + b, 0) / pageTimes.length),
            minLoadMs: sorted[0],
            maxLoadMs: sorted[sorted.length - 1],
            p75LoadMs: sorted[Math.floor(sorted.length * 0.75)],
            pagesOver3s: pageTimes.filter(t => t > 3000).length,
            pagesOver5s: pageTimes.filter(t => t > 5000).length,
        };
    }

    manifest.consoleErrors = consoleErrors;
    manifest.consoleWarnings = consoleWarnings;
    manifest.firestoreRequests = networkRequests.length;

    // ── Write manifest ────────────────────────────────────────────────────
    const manifestPath = path.join(outDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`\n[patrol] Done. ${manifest.pages.length} pages captured.`);
    console.log(`[patrol] Console errors: ${consoleErrors.length}, warnings: ${consoleWarnings.length}`);
    console.log(`[patrol] Firestore requests: ${networkRequests.length}`);
    if (manifest.performanceSummary.avgLoadMs) {
        console.log(`[patrol] Load times — avg: ${manifest.performanceSummary.avgLoadMs}ms, max: ${manifest.performanceSummary.maxLoadMs}ms, over 3s: ${manifest.performanceSummary.pagesOver3s}`);
    }
    console.log(`[patrol] Manifest: ${manifestPath}`);

    console.log('[patrol] Pages captured:');
    for (const p of manifest.pages) {
        let flags = '';
        if (p.spinnerStuck) flags += ' [SPINNER STUCK]';
        if (p.hasVisibleError) flags += ' [JS ERROR VISIBLE]';
        if (p.hasEmptyGrid) flags += ' [EMPTY GRID]';
        if (p.error) flags += ` [NAV ERROR: ${p.error}]`;
        const timing = p.loadTimeMs ? ` (${p.loadTimeMs}ms)` : '';
        console.log(`- ${p.route} -> ${p.screenshot}${timing}${flags}`);
    }

    return manifestPath;
}

run().catch(err => {
    console.error('[patrol] Fatal:', err);
    process.exit(1);
});
