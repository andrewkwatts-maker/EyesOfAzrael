/**
 * Eyes of Azrael — Deployment Smoke Test
 *
 * Uses Playwright to verify the live site renders correctly after deploy.
 * Exit code 0 = all checks passed. Exit code 1 = one or more checks failed.
 *
 * Usage:
 *   node scripts/smoke-test.js
 *   node scripts/smoke-test.js --url https://staging.eyesofazrael.com
 */

const { chromium } = require('@playwright/test');

const TARGET_URL = (() => {
    const urlArg = process.argv.find(a => a.startsWith('--url='));
    return urlArg ? urlArg.split('=')[1] : 'https://www.eyesofazrael.com';
})();

const TIMEOUT = 20000; // 20s per navigation

// Simple pass/fail tracker
let passed = 0;
let failed = 0;
const failures = [];

function pass(label) {
    console.log(`  [PASS] ${label}`);
    passed++;
}

function fail(label, detail) {
    console.error(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
    failures.push({ label, detail });
}

async function check(label, fn) {
    try {
        await fn();
    } catch (err) {
        fail(label, err.message);
    }
}

async function run() {
    console.log(`\nEyes of Azrael Smoke Test`);
    console.log(`Target: ${TARGET_URL}`);
    console.log('='.repeat(50));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'EyesOfAzrael-SmokeTest/1.0'
    });
    const page = await context.newPage();

    // ---- 1. Home page renders ------------------------------------------------
    console.log('\n[1] Home page');
    await check('Page loads without crash', async () => {
        const response = await page.goto(TARGET_URL, {
            waitUntil: 'domcontentloaded',
            timeout: TIMEOUT
        });
        if (!response || response.status() >= 500) {
            throw new Error(`HTTP ${response ? response.status() : 'no response'}`);
        }
        pass('Page loads without crash');
    });

    await check('Landing category grid present', async () => {
        // Wait for the grid to appear (landing page renders async)
        await page.waitForSelector('.landing-category-grid', { timeout: TIMEOUT });
        pass('Landing category grid present');
    });

    // ---- 2. Header visible ---------------------------------------------------
    console.log('\n[2] Site header');
    await check('Header element exists and has height > 0', async () => {
        const headerHeight = await page.evaluate(() => {
            const h = document.querySelector('.site-header');
            if (!h) return 0;
            return h.getBoundingClientRect().height;
        });
        if (headerHeight <= 0) {
            throw new Error(`Header height is ${headerHeight}px`);
        }
        pass(`Header visible (height: ${headerHeight}px)`);
    });

    // ---- 3. Browse deities ---------------------------------------------------
    console.log('\n[3] Browse deities page');
    await check('Navigate to #/browse/deities', async () => {
        await page.goto(`${TARGET_URL}#/browse/deities`, {
            waitUntil: 'domcontentloaded',
            timeout: TIMEOUT
        });
        pass('Navigated to #/browse/deities');
    });

    await check('Entity cards or loading state present', async () => {
        // Either entity cards have rendered, OR a loading/skeleton state is visible
        const result = await Promise.race([
            page.waitForSelector('.entity-card, .entity-grid .card, [class*="entity"]', {
                timeout: TIMEOUT
            }).then(() => 'cards'),
            page.waitForSelector('.loading-spinner, .skeleton, .loading-state, [class*="loading"]', {
                timeout: TIMEOUT
            }).then(() => 'loading')
        ]).catch(() => null);

        if (!result) {
            throw new Error('Neither entity cards nor loading state found');
        }
        pass(`Browse deities: ${result === 'cards' ? 'entity cards found' : 'loading state visible'}`);
    });

    // ---- 4. Mythologies page -------------------------------------------------
    console.log('\n[4] Mythologies page');
    await check('Navigate to #/mythologies', async () => {
        await page.goto(`${TARGET_URL}#/mythologies`, {
            waitUntil: 'domcontentloaded',
            timeout: TIMEOUT
        });
        pass('Navigated to #/mythologies');
    });

    await check('Mythology cards or loading state present', async () => {
        const result = await Promise.race([
            page.waitForSelector('.mythology-card, .myth-card, .mythology-grid .card, [class*="mythology"]', {
                timeout: TIMEOUT
            }).then(() => 'cards'),
            page.waitForSelector('.loading-spinner, .skeleton, .loading-state, [class*="loading"]', {
                timeout: TIMEOUT
            }).then(() => 'loading')
        ]).catch(() => null);

        if (!result) {
            throw new Error('Neither mythology cards nor loading state found');
        }
        pass(`Mythologies: ${result === 'cards' ? 'cards found' : 'loading state visible'}`);
    });

    // ---- 5. Search with query param ------------------------------------------
    console.log('\n[5] Search page with query param');
    await check('Navigate to #/search?q=zeus', async () => {
        await page.goto(`${TARGET_URL}#/search?q=zeus`, {
            waitUntil: 'domcontentloaded',
            timeout: TIMEOUT
        });
        pass('Navigated to #/search?q=zeus');
    });

    await check('Search page renders (not 404)', async () => {
        const result = await Promise.race([
            page.waitForSelector('.search-view, [class*="search"], #search-input, input[type="search"]', {
                timeout: TIMEOUT
            }).then(() => 'search'),
            page.waitForSelector('.error-404, .not-found, h1', {
                timeout: TIMEOUT
            }).then(async () => {
                const h1 = await page.textContent('h1').catch(() => '');
                if (h1.includes('404') || h1.toLowerCase().includes('not found')) {
                    throw new Error('Got 404 page instead of search page');
                }
                return 'content';
            })
        ]).catch(err => { throw err; });
        pass(`Search page with ?q=zeus rendered: ${result}`);
    });

    // ---- 6. Guidelines page --------------------------------------------------
    console.log('\n[6] Guidelines page');
    await check('Navigate to #/guidelines', async () => {
        await page.goto(`${TARGET_URL}#/guidelines`, {
            waitUntil: 'domcontentloaded',
            timeout: TIMEOUT
        });
        pass('Navigated to #/guidelines');
    });

    await check('Guidelines page renders (not 404)', async () => {
        const result = await Promise.race([
            page.waitForSelector('.guidelines-page, .static-page', {
                timeout: TIMEOUT
            }).then(() => 'guidelines'),
            page.waitForSelector('h1', { timeout: TIMEOUT }).then(async () => {
                const h1 = await page.textContent('h1').catch(() => '');
                if (h1.includes('404') || h1.toLowerCase().includes('not found')) {
                    throw new Error('Got 404 page instead of guidelines page');
                }
                return 'content';
            })
        ]).catch(err => { throw err; });
        pass(`Guidelines page rendered: ${result}`);
    });

    await browser.close();

    // ---- Summary -------------------------------------------------------------
    console.log('\n' + '='.repeat(50));
    console.log(`Results: ${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
        console.error('\nFailed checks:');
        failures.forEach(f => console.error(`  - ${f.label}: ${f.detail || ''}`));
    }
    console.log('');

    process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
    console.error('\n[FATAL] Smoke test crashed:', err.message);
    process.exit(1);
});
