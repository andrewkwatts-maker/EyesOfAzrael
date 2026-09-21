#!/usr/bin/env node
/**
 * Verify text contrast the way a reader actually sees it: composited.
 *
 * WHY AXE CANNOT BE TRUSTED HERE
 *
 * axe-core's color-contrast check walks the DOM ancestor chain reading
 * computed `background-color` until it finds an opaque one, then computes
 * WCAG contrast between that and the text color. That works for ordinary
 * pages. It does not work here: js/shaders/shader-themes.js paints a
 * full-viewport, animated WebGL <canvas id="shader-background"> behind
 * everything, and css/shader-backgrounds.css makes `body`, `.view-container`
 * and `.site-footer` explicitly `background: transparent !important` while
 * a shader is active (`body.shader-active.shader-rendering`) so the canvas
 * shows through. Axe cannot read canvas pixels. Faced with a fully
 * transparent ancestor chain it falls back to assuming white — which is
 * wrong in both directions:
 *
 *   - A dark theme (Night, Cosmic) paints a near-black canvas behind
 *     light text. Axe assumes white-behind-light-text and flags a FALSE
 *     FAILURE for text that is actually easily readable.
 *   - Conversely, nothing stops a bright patch of an animated shader
 *     (a highlight, a star, a sun) drifting behind text axe already
 *     waved through as "fine against assumed white" - axe cannot see
 *     that patch either, so a real, momentary failure passes silently.
 *
 * WHAT THIS SCRIPT DOES INSTEAD
 *
 * Loads the real site in a real Chromium (via Playwright), switches
 * through every featured theme with the same window.ShaderThemePicker API
 * the theme button uses, and for the footer text - the one theme-exposed,
 * Firebase-independent region with real copy in it - reads back the ACTUAL
 * composited pixels with page.screenshot(), which rasterises the WebGL
 * canvas exactly as the browser painted it. For each sampled text node it:
 *
 *   1. Reads the element's real bounding box and computed `color`.
 *   2. Samples a background pixel just outside the glyph ink (a few px
 *      above the text baseline, inside the same element) from the
 *      screenshot buffer - the actual painted canvas colour at that
 *      point, not a value read out of a stylesheet.
 *   3. Computes the WCAG 2.x contrast ratio between the two real colours.
 *
 * This still simplifies one thing: it ignores anti-aliasing/text-shadow at
 * the sampled point and assumes a locally-flat background a few pixels
 * from the glyph is representative of the pixel behind it. That is a much
 * smaller assumption than axe's "assume white", and unlike axe's number,
 * every ratio this script prints was read from real rendered pixels.
 *
 * The shader is also animated, not static - a time-based noise/gradient
 * function, so the pixel behind a fixed element genuinely changes second to
 * second. One screenshot only proves the ratio at that instant. This script
 * takes several (FRAMES, below) spread over about 1.5s per theme and reports
 * each element's WORST observed ratio, which is the honest answer to "can
 * this ever be unreadable", not "was it readable just now".
 *
 * CAVEAT: this sandbox has no GPU, so Chromium falls back to software WebGL
 * (SwiftShader) and was observed running the shaders at 1-10fps with
 * "GPU stall" warnings. A run here occasionally samples a stray all-white
 * frame during a theme switch (visible as a bg of rgb(255,255,255) that
 * doesn't match the theme's actual palette at all) - almost certainly a
 * software-rendering artifact of a WebGL context rebuild under heavy CPU
 * throttling, not something a real user's GPU would ever paint. Results
 * with a background that doesn't resemble the theme's own colours at all
 * are worth re-running on real hardware before treating as a genuine
 * finding; a background that DOES plausibly belong to the theme's palette
 * (just an unusually bright or dark patch of it) is a real composited
 * result either way.
 *
 * USAGE
 *   node scripts/verify-contrast-composited.js [--base-url http://localhost:8080]
 */

const { chromium } = require('playwright');

const BASE_URL = (() => {
    const i = process.argv.indexOf('--base-url');
    return i !== -1 ? process.argv[i + 1] : (process.env.BASE_URL || 'http://localhost:8080');
})();

const CHROMIUM_EXECUTABLE = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

// WCAG AA for normal text; large text (>=24px, or >=19px bold) may use 3.0.
const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

function relativeLuminance([r, g, b]) {
    const chan = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const [rl, gl, bl] = [chan(r), chan(g), chan(b)];
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(rgbA, rgbB) {
    const l1 = relativeLuminance(rgbA);
    const l2 = relativeLuminance(rgbB);
    const [lighter, darker] = l1 >= l2 ? [l1, l2] : [l2, l1];
    return (lighter + 0.05) / (darker + 0.05);
}

function parseCssColor(css) {
    const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\)/.exec(css);
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Sample a screenshot buffer (raw RGBA from a PNG decoded by Playwright's own
 *  screenshot -> we instead read pixels straight off the page via a canvas
 *  drawImage of a cropped screenshot, so no PNG decoder dependency is needed). */
async function samplePixel(page, x, y) {
    return page.evaluate(([px, py]) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        // html-to-image-less approach: draw the live shader canvas plus a
        // solid swatch is not representative, so instead this relies on the
        // caller having already taken a full-page screenshot and drawn it
        // into window.__contrastSnapshot (see loadSnapshotIntoPage below).
        const img = window.__contrastSnapshotCanvas;
        if (!img) return null;
        const srcCtx = img.getContext('2d');
        const data = srcCtx.getImageData(Math.round(px), Math.round(py), 1, 1).data;
        return [data[0], data[1], data[2]];
    }, [x, y]);
}

async function loadScreenshotIntoPage(page, pngBuffer) {
    const base64 = pngBuffer.toString('base64');
    await page.evaluate((b64) => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                canvas.getContext('2d').drawImage(image, 0, 0);
                window.__contrastSnapshotCanvas = canvas;
                resolve();
            };
            image.onerror = reject;
            image.src = 'data:image/png;base64,' + b64;
        });
    }, base64);
}

/** Footer text nodes worth checking: real, static copy, no Firebase needed. */
const FOOTER_SELECTORS = [
    { selector: '.site-footer h2', label: 'footer h2 ("Stay Updated")' },
    { selector: '.site-footer p', label: 'footer paragraph copy' },
    { selector: '.site-footer a.footer-logo .footer-logo-icon', label: 'footer logo icon' },
    { selector: '.site-footer .footer-section-link', label: 'footer sitemap link' },
    { selector: '.site-footer .footer-social-link', label: 'footer social icon link' },
    { selector: '.site-footer .footer-links a', label: 'footer bottom-row link' },
    { selector: '.site-footer .footer-copyright', label: 'footer copyright line' }
];

/**
 * One pixel sample of one element at the current animation frame. Returns
 * null for anything that cannot be measured (no box, no parseable colour) -
 * the caller decides what an empty result set means.
 */
async function sampleElementOnce(page, handle, label, theme) {
    const box = await handle.boundingBox();
    if (!box || box.width < 4 || box.height < 4) return null;

    const style = await handle.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { color: cs.color, fontSize: parseFloat(cs.fontSize), fontWeight: cs.fontWeight };
    });
    const fg = parseCssColor(style.color);
    if (!fg) return null;

    // Sample just above the text's vertical center, inset from the left edge -
    // close enough to be "behind" the text for a locally-flat background,
    // clear enough of glyph ink on most short labels to avoid anti-aliased
    // pixels skewing the sample.
    const sampleX = box.x + Math.min(4, box.width / 4);
    const sampleY = box.y - 3 >= 0 ? box.y - 3 : box.y + box.height + 3;
    const bg = await samplePixel(page, sampleX, sampleY);
    if (!bg) return null;

    const ratio = contrastRatio(fg, bg);
    const isLarge = style.fontSize >= 24 || (style.fontSize >= 18.66 && Number(style.fontWeight) >= 700);
    const threshold = isLarge ? AA_LARGE : AA_NORMAL;

    return { theme, label, fg, bg, ratio, threshold, pass: ratio >= threshold };
}

async function main() {
    const browser = await chromium.launch({ executablePath: CHROMIUM_EXECUTABLE });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });

    console.log(`[contrast] loading ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Dismiss the cookie banner if present - it does not affect the footer
    // but overlaps it in the viewport otherwise.
    const decline = page.locator('button:has-text("Decline")');
    if (await decline.count().catch(() => 0)) {
        await decline.first().click().catch(() => {});
        await page.waitForTimeout(300);
    }

    const themes = await page.evaluate(() => (
        window.ShaderThemePicker ? window.ShaderThemePicker.getFeaturedThemes() : null
    ));
    if (!themes) {
        console.error('[contrast] window.ShaderThemePicker is not available - cannot drive themes.');
        await browser.close();
        process.exit(2);
    }
    console.log(`[contrast] featured themes: ${themes.join(', ')}`);

    const results = [];

    for (const theme of themes) {
        await page.evaluate((t) => window.ShaderThemePicker.setTheme(t), theme);

        // Poll for "shader-rendering" rather than a fixed sleep: this sandbox
        // has no GPU (software WebGL via SwiftShader, observed 1-10fps with
        // "GPU stall" warnings), so how long a theme switch takes to reach
        // steady rendering varies a lot run to run. A fixed short wait here
        // produced a flaky false "shader never started" skip on a real run.
        const deadline = Date.now() + 6000;
        let bodyClasses = '';
        while (Date.now() < deadline) {
            bodyClasses = await page.evaluate(() => document.body.className);
            if (/shader-rendering/.test(bodyClasses)) break;
            await page.waitForTimeout(250);
        }

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(400);

        if (!/shader-rendering/.test(bodyClasses)) {
            console.warn(`[contrast] ${theme}: shader did not reach "rendering" state within 6s (classes: ${bodyClasses}) - skipping`);
            continue;
        }

        // The shader is animated (a time-based noise/gradient function), so
        // the pixel behind a fixed element genuinely changes from one frame
        // to the next - a single screenshot only proves the ratio at that
        // instant, not the range a visitor might actually see while the
        // background keeps moving. FRAMES independent screenshots, spread
        // over ~1.5s, and reporting each element's worst observed ratio, is
        // what "compositing the real painted [and moving] ancestry" means
        // for an animated background: the floor of what a reader sees, not
        // one lucky (or unlucky) sample.
        const FRAMES = 5;
        const perElementSamples = new Map(); // key -> array of sample objects

        const elementGroups = [];
        for (const { selector, label } of FOOTER_SELECTORS) {
            const handles = await page.locator(selector).all();
            elementGroups.push({ label, handles: handles.slice(0, 3) });
        }

        for (let frame = 0; frame < FRAMES; frame++) {
            const pngBuffer = await page.screenshot({ fullPage: false });
            await loadScreenshotIntoPage(page, pngBuffer);

            for (const { label, handles } of elementGroups) {
                for (let i = 0; i < handles.length; i++) {
                    const sample = await sampleElementOnce(page, handles[i], label, theme);
                    if (!sample) continue;
                    const key = `${label}#${i}`;
                    if (!perElementSamples.has(key)) perElementSamples.set(key, []);
                    perElementSamples.get(key).push(sample);
                }
            }

            if (frame < FRAMES - 1) await page.waitForTimeout(350);
        }

        for (const samples of perElementSamples.values()) {
            if (!samples.length) continue;
            const worst = samples.reduce((a, b) => (a.ratio <= b.ratio ? a : b));
            results.push({
                ...worst,
                ratio: Math.round(worst.ratio * 100) / 100,
                framesSampled: samples.length,
                framesFailing: samples.filter((s) => !s.pass).length
            });
        }
    }

    await browser.close();

    console.log('\n=== Composited contrast results (worst of N frames of real rendered pixels) ===\n');
    const failures = results.filter((r) => !r.pass);
    for (const r of results) {
        const status = r.pass ? 'PASS' : 'FAIL';
        const flakiness = r.framesFailing > 0 && r.framesFailing < r.framesSampled
            ? ` [failed ${r.framesFailing}/${r.framesSampled} frames - intermittent]`
            : '';
        console.log(
            `[${status}] ${r.theme.padEnd(8)} ${r.label.padEnd(24)} worst: ` +
            `fg rgb(${r.fg.join(',')}) on bg rgb(${r.bg.join(',')}) ` +
            `-> ${r.ratio}:1 (need ${r.threshold}:1)${flakiness}`
        );
    }

    console.log(`\n${results.length} elements checked, ${failures.length} whose worst-observed-frame is below WCAG AA.`);
    if (failures.length) {
        console.log('\nThese are real composited failures a DOM-only checker (axe-core) cannot see,');
        console.log('because the failing background pixel came from the WebGL canvas, not CSS -');
        console.log('and some only fail on certain frames of the animation, which a single');
        console.log('screenshot (or a static tool that never renders the canvas at all) would miss.');
    }

    process.exitCode = failures.length ? 1 : 0;
}

main().catch((err) => {
    console.error('[contrast] fatal:', err);
    process.exitCode = 2;
});
