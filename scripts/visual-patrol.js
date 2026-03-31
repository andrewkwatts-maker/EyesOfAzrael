/**
 * Visual Patrol — Automated Screenshot Collector
 *
 * Navigates the live site (or localhost), screenshots the home page,
 * then navigates to 5 random pages and screenshots each.
 * Outputs a JSON manifest for downstream Claude analysis.
 *
 * Usage: node scripts/visual-patrol.js [--base-url https://www.eyesofazrael.com]
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ── Route pools ────────────────────────────────────────────────────────────
// Organised by category so we always get variety

const ROUTE_POOLS = {
    browse: [
        '#/browse/deities', '#/browse/heroes', '#/browse/creatures',
        '#/browse/items', '#/browse/places', '#/browse/texts',
        '#/browse/rituals', '#/browse/symbols', '#/browse/herbs',
        '#/browse/archetypes',
    ],
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
    mythologies: [
        '#/mythologies',
        '#/mythology/greek', '#/mythology/norse', '#/mythology/egyptian',
        '#/mythology/celtic', '#/mythology/hindu', '#/mythology/japanese',
        '#/mythology/chinese', '#/mythology/mesopotamian', '#/mythology/aztec',
        '#/mythology/roman', '#/mythology/polynesian', '#/mythology/aboriginal',
        '#/mythology/babylonian', '#/mythology/slavic', '#/mythology/finnish',
    ],
    utility: [
        '#/search', '#/compare', '#/about', '#/privacy', '#/terms',
        '#/dashboard',
    ],
};

/**
 * Pick 5 random routes ensuring variety across categories.
 * Strategy: pick 1 from each of 4 pools, then 1 more at random from all.
 */
function pickDiverseRoutes() {
    const poolNames = Object.keys(ROUTE_POOLS);
    const picks = [];
    const used = new Set();

    // 1 from each pool (first 4)
    for (const pool of poolNames.slice(0, 4)) {
        const candidates = ROUTE_POOLS[pool].filter(r => !used.has(r));
        if (candidates.length > 0) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            picks.push(pick);
            used.add(pick);
        }
    }

    // Fill remaining up to 5 from all routes
    const allRoutes = Object.values(ROUTE_POOLS).flat().filter(r => !used.has(r));
    while (picks.length < 5 && allRoutes.length > 0) {
        const idx = Math.floor(Math.random() * allRoutes.length);
        picks.push(allRoutes[idx]);
        allRoutes.splice(idx, 1);
    }

    return picks;
}

async function run() {
    const baseUrl = process.argv.includes('--base-url')
        ? process.argv[process.argv.indexOf('--base-url') + 1]
        : 'https://www.eyesofazrael.com';

    const outDir = path.join(__dirname, '..', 'screenshots', 'patrol');
    fs.mkdirSync(outDir, { recursive: true });

    // Clean old screenshots
    for (const f of fs.readdirSync(outDir)) {
        if (f.endsWith('.png')) fs.unlinkSync(path.join(outDir, f));
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const manifest = { timestamp, baseUrl, pages: [] };

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push({ url: page.url(), text: msg.text() });
        }
    });

    // ── Home page ──────────────────────────────────────────────────────────
    console.log('[patrol] Loading home page...');
    try {
        await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
        // networkidle can time out on heavy pages — domcontentloaded is enough
        console.log('[patrol] networkidle timed out, continuing with current state');
    }
    await page.waitForTimeout(3000); // Let Firebase data + animations settle
    const homePath = path.join(outDir, `home_${timestamp}.png`);
    await page.screenshot({ path: homePath, fullPage: true });
    manifest.pages.push({ route: '#/', name: 'Home', screenshot: homePath });
    console.log('[patrol] Home page captured.');

    // ── 5 random pages ────────────────────────────────────────────────────
    const randomRoutes = pickDiverseRoutes();
    console.log(`[patrol] Selected routes: ${randomRoutes.join(', ')}`);

    for (let i = 0; i < randomRoutes.length; i++) {
        const route = randomRoutes[i];
        const safeName = route.replace(/[#\/]/g, '_').replace(/^_+/, '') || 'root';
        const screenshotPath = path.join(outDir, `${safeName}_${timestamp}.png`);

        console.log(`[patrol] (${i + 1}/5) Navigating to ${route}...`);
        try {
            // Use hash navigation — go to baseUrl then set hash
            const fullUrl = `${baseUrl}/${route}`;
            await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 20000 });
            await page.waitForTimeout(4000); // Wait for Firebase data + render

            // Check for stuck loading spinner
            const spinnerVisible = await page.evaluate(() => {
                const loader = document.getElementById('loading-container');
                return loader && loader.style.display !== 'none' && !loader.classList.contains('hidden');
            });

            // Check for visible error messages
            const hasVisibleError = await page.evaluate(() => {
                const body = document.body.innerText || '';
                return /error|exception|undefined|null/i.test(body.substring(0, 500));
            });

            await page.screenshot({ path: screenshotPath, fullPage: true });
            manifest.pages.push({
                route,
                name: safeName,
                screenshot: screenshotPath,
                spinnerStuck: spinnerVisible || false,
                hasVisibleError: hasVisibleError || false,
            });
            console.log(`[patrol]   Captured (spinner stuck: ${spinnerVisible || false}, errors visible: ${hasVisibleError || false})`);
        } catch (err) {
            console.error(`[patrol]   FAILED: ${err.message}`);
            try {
                await page.screenshot({ path: screenshotPath, fullPage: true });
                manifest.pages.push({
                    route,
                    name: safeName,
                    screenshot: screenshotPath,
                    error: err.message,
                });
            } catch (_) { /* ignore */ }
        }
    }

    await browser.close();

    // Add console errors to manifest
    manifest.consoleErrors = consoleErrors;

    // Write manifest
    const manifestPath = path.join(outDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\n[patrol] Done. ${manifest.pages.length} pages captured.`);
    console.log(`[patrol] Console errors: ${consoleErrors.length}`);
    console.log(`[patrol] Manifest: ${manifestPath}`);

    // Print selected routes for the log
    console.log('[patrol] Pages captured:');
    for (const p of manifest.pages) {
        let flags = '';
        if (p.spinnerStuck) flags += ' [SPINNER STUCK]';
        if (p.hasVisibleError) flags += ' [ERROR VISIBLE]';
        if (p.error) flags += ` [NAV ERROR: ${p.error}]`;
        console.log(`- ${p.route} -> ${p.screenshot}${flags}`);
    }

    return manifestPath;
}

run().catch(err => {
    console.error('[patrol] Fatal:', err);
    process.exit(1);
});
