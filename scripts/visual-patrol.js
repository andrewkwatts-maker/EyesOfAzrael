/**
 * Visual Patrol — Automated Screenshot Collector
 *
 * Launches the site, screenshots the home page, then navigates to 5 random
 * pages and screenshots each. Outputs a JSON manifest with page URLs and
 * screenshot paths for downstream consumption by Claude Code.
 *
 * Usage: node scripts/visual-patrol.js [--base-url http://localhost:8080]
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// All navigable routes (weighted toward content pages where bugs surface)
const ROUTES = [
    // Browse categories (most likely to have issues)
    '#/browse/deities',
    '#/browse/heroes',
    '#/browse/creatures',
    '#/browse/items',
    '#/browse/places',
    '#/browse/texts',
    '#/browse/rituals',
    '#/browse/symbols',
    '#/browse/herbs',
    '#/browse/archetypes',

    // Browse with mythology filter
    '#/browse/deities/greek',
    '#/browse/deities/norse',
    '#/browse/deities/egyptian',
    '#/browse/creatures/greek',
    '#/browse/heroes/norse',
    '#/browse/items/egyptian',

    // Mythologies
    '#/mythologies',
    '#/mythology/greek',
    '#/mythology/norse',
    '#/mythology/egyptian',

    // Static pages
    '#/search',
    '#/compare',
    '#/about',
    '#/privacy',
    '#/terms',
];

function pickRandom(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

async function run() {
    const baseUrl = process.argv.includes('--base-url')
        ? process.argv[process.argv.indexOf('--base-url') + 1]
        : 'http://localhost:8080';

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

    // 1. Screenshot home page
    console.log('[patrol] Loading home page...');
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Let animations settle
    const homePath = path.join(outDir, `home_${timestamp}.png`);
    await page.screenshot({ path: homePath, fullPage: true });
    manifest.pages.push({ route: '#/', name: 'Home', screenshot: homePath });
    console.log('[patrol] Home page captured.');

    // 2. Navigate to 5 random pages
    const randomRoutes = pickRandom(ROUTES, 5);
    for (let i = 0; i < randomRoutes.length; i++) {
        const route = randomRoutes[i];
        const safeName = route.replace(/[#\/]/g, '_').replace(/^_+/, '') || 'root';
        const screenshotPath = path.join(outDir, `${safeName}_${timestamp}.png`);

        console.log(`[patrol] (${i + 1}/5) Navigating to ${route}...`);
        try {
            await page.goto(`${baseUrl}/${route}`, { waitUntil: 'networkidle', timeout: 20000 });
            await page.waitForTimeout(3000); // Wait for data to load + render

            // Check for stuck loading spinner
            const spinnerVisible = await page.evaluate(() => {
                const loader = document.getElementById('loading-container');
                return loader && loader.style.display !== 'none' && !loader.classList.contains('hidden');
            });

            await page.screenshot({ path: screenshotPath, fullPage: true });
            manifest.pages.push({
                route,
                name: safeName,
                screenshot: screenshotPath,
                spinnerStuck: spinnerVisible || false,
            });
            console.log(`[patrol]   Captured (spinner stuck: ${spinnerVisible || false})`);
        } catch (err) {
            console.error(`[patrol]   FAILED: ${err.message}`);
            // Still try to screenshot whatever state we're in
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

    return manifestPath;
}

run().catch(err => {
    console.error('[patrol] Fatal:', err);
    process.exit(1);
});
