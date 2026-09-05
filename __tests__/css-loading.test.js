/**
 * CSS Loading Tests (Sprint 2)
 *
 * Guards against:
 * 1. Stylesheets listed in the bundle manifest pointing at non-existent files
 * 2. A stylesheet being dropped from the bundle, or the bundle going stale
 * 3. Individual <link rel="stylesheet"> tags creeping back into index.html and
 *    quietly re-introducing the 70-request render-blocking waterfall
 *
 * index.html used to link all 70 stylesheets directly, and these tests read the
 * link tags to tell critical CSS from deferred. It now links one generated
 * bundle, so css/bundle.manifest.json is the source of truth for what loads and
 * in what cascade order — the assertions moved with it.
 *
 * Static-analysis only — no browser or network required.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { buildBundle } = require('../scripts/build-css-bundle');

describe('CSS Loading', () => {
    let indexHtml;
    let manifest;

    beforeAll(() => {
        indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        manifest = JSON.parse(
            fs.readFileSync(path.join(ROOT, 'css/bundle.manifest.json'), 'utf8')
        );
    });

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Parse all <link rel="stylesheet"> href values from index.html.
     * Returns an array of { href, deferred } objects.
     * deferred = true when the link uses media="print" onload pattern.
     */
    function parseCssLinks(html) {
        const results = [];
        const linkTagRegex = /<link\b([^>]*?)>/gi;
        let match;
        while ((match = linkTagRegex.exec(html)) !== null) {
            const attrs = match[1];
            if (!/rel=["']stylesheet["']/i.test(attrs) && !/rel=stylesheet/i.test(attrs)) {
                continue;
            }
            const hrefMatch = /href=["']([^"']+)["']/i.exec(attrs);
            if (!hrefMatch) continue;
            const href = hrefMatch[1];
            // Skip external URLs (Google Fonts, CDNs)
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                continue;
            }
            const isDeferred = /media=["']print["']/i.test(attrs) && /onload=/i.test(attrs);
            results.push({ href, deferred: isDeferred });
        }
        return results;
    }

    // ---------------------------------------------------------------------------
    // Test: All manifested CSS files exist on disk
    // ---------------------------------------------------------------------------

    describe('CSS file existence', () => {
        test('every stylesheet in the bundle manifest exists on disk', () => {
            expect(manifest.main.length).toBeGreaterThan(0);

            const missing = manifest.main.filter(
                href => !fs.existsSync(path.join(ROOT, href))
            );

            if (missing.length > 0) {
                const list = missing.map(f => `  - ${f}`).join('\n');
                throw new Error(
                    `Stylesheets listed in css/bundle.manifest.json but missing on disk:\n${list}`
                );
            }
        });
    });

    // ---------------------------------------------------------------------------
    // Test: index.html loads the bundle, and only the bundle
    // ---------------------------------------------------------------------------

    describe('Bundle wiring', () => {
        test('index.html links css/bundle.css', () => {
            const links = parseCssLinks(indexHtml);
            const bundle = links.find(l => l.href === 'css/bundle.css');
            expect(bundle).toBeDefined();
        });

        test('the bundle is render-blocking, not deferred', () => {
            // A deferred bundle would arrive after first paint and reintroduce the
            // layout shift the bundling was meant to remove.
            const links = parseCssLinks(indexHtml);
            const bundle = links.find(l => l.href === 'css/bundle.css');
            expect(bundle.deferred).toBe(false);
        });

        test('index.html links no local stylesheet other than the bundle', () => {
            // Adding a <link> here instead of an entry in the manifest costs a
            // render-blocking round trip and skips the cascade-order guarantee.
            const strays = parseCssLinks(indexHtml)
                .map(l => l.href)
                .filter(href => href !== 'css/bundle.css');

            if (strays.length > 0) {
                throw new Error(
                    'index.html links stylesheets outside the bundle:\n' +
                    strays.map(f => `  - ${f}`).join('\n') +
                    '\nAdd them to css/bundle.manifest.json instead, then run: npm run build:css'
                );
            }
        });
    });

    // ---------------------------------------------------------------------------
    // Test: the committed bundle matches its sources
    // ---------------------------------------------------------------------------

    describe('Bundle freshness', () => {
        test('css/bundle.css matches what the manifest builds', () => {
            // The bundle is committed because GitHub Pages serves the repo as-is,
            // so a stale bundle ships stale CSS with no build step to catch it.
            const { css } = buildBundle(manifest.main);
            const onDisk = fs.readFileSync(path.join(ROOT, 'css/bundle.css'), 'utf8');

            if (onDisk !== css) {
                throw new Error(
                    'css/bundle.css is out of date with its source stylesheets. ' +
                    'Run: npm run build:css'
                );
            }
        });

        test('every stylesheet in the manifest appears in the bundle', () => {
            const bundleCss = fs.readFileSync(path.join(ROOT, 'css/bundle.css'), 'utf8');
            const absent = manifest.main.filter(href => !bundleCss.includes(`==== ${href} ====`));

            if (absent.length > 0) {
                throw new Error(
                    'Manifested stylesheets missing from the built bundle:\n' +
                    absent.map(f => `  - ${f}`).join('\n')
                );
            }
        });
    });

    // ---------------------------------------------------------------------------
    // Test: critical CSS is still loaded
    // ---------------------------------------------------------------------------

    describe('Critical CSS loading', () => {
        // These were asserted to be non-deferred when index.html linked each file
        // individually. Everything is render-blocking now, so what still needs
        // guarding is that they are in the bundle at all.
        const criticalFiles = [
            'css/site-header.css',
            'css/loading-spinner.css',
            'css/mobile-optimization.css',
            'css/auth-guard.css',
            'css/header-user.css',
            'css/header-theme-picker.css',
        ];

        test.each(criticalFiles)('%s is in the bundle', (cssFile) => {
            expect(manifest.main).toContain(cssFile);
        });
    });

    // ---------------------------------------------------------------------------
    // Test: cascade order is preserved
    // ---------------------------------------------------------------------------

    describe('Cascade order', () => {
        // Bundling concatenates in manifest order, so these pairs encode the
        // orderings that real rules depend on. Reordering the manifest flips which
        // rule wins and nothing else fails.
        const mustPrecede = [
            // The base sheet has to come first or every override below it loses.
            ['styles.css', 'themes/theme-base.css'],
            // hamburger-menu.css wins .admin-tools-section over admin-moderation.css
            ['css/admin-moderation.css', 'css/hamburger-menu.css'],
            // panel-shaders.css wins .entity-panel over search-components.css
            ['css/search-components.css', 'css/panel-shaders.css'],
            // mythology-ambiance.css wins .favorites-grid over user-dashboard.css
            ['css/user-dashboard.css', 'css/mythology-ambiance.css'],
        ];

        test.each(mustPrecede)('%s must come before %s', (first, second) => {
            const a = manifest.main.indexOf(first);
            const b = manifest.main.indexOf(second);
            expect(a).toBeGreaterThanOrEqual(0);
            expect(b).toBeGreaterThanOrEqual(0);
            expect(a).toBeLessThan(b);
        });
    });

    // ---------------------------------------------------------------------------
    // Test: Loading containers have correct structure
    // ---------------------------------------------------------------------------

    describe('Loading container structure', () => {
        test('loading-spinner.css defines .spa-loading with width: 100%', () => {
            const spinnerCss = fs.readFileSync(path.join(ROOT, 'css/loading-spinner.css'), 'utf8');
            expect(spinnerCss).toMatch(/\.spa-loading/);
            const spaLoadingBlock = spinnerCss.match(/\.spa-loading\s*\{([^}]+)\}/);
            expect(spaLoadingBlock).not.toBeNull();
            expect(spaLoadingBlock[1]).toMatch(/width\s*:\s*100%/);
        });

        test('dynamic-views.css defines .loading-container with width: 100%', () => {
            const dynamicCss = fs.readFileSync(path.join(ROOT, 'css/dynamic-views.css'), 'utf8');
            expect(dynamicCss).toMatch(/\.loading-container/);
            const hasWidth100 = /\.loading-container\s*\{[^}]*width\s*:\s*100%/s.test(dynamicCss);
            expect(hasWidth100).toBe(true);
        });

        test('index.html inline .loading-container has width: 100%', () => {
            expect(indexHtml).toMatch(/\.loading-container\s*\{[^}]*width\s*:\s*100%/s);
        });
    });

    // ---------------------------------------------------------------------------
    // Test: Google Fonts uses display=swap
    // ---------------------------------------------------------------------------

    describe('Font loading', () => {
        test('Google Fonts URL includes display=swap', () => {
            const fontMatches = indexHtml.match(/fonts\.googleapis\.com\/css2[^"']+/g) || [];
            expect(fontMatches.length).toBeGreaterThan(0);
            for (const fontUrl of fontMatches) {
                expect(fontUrl).toContain('display=swap');
            }
        });

        test('preconnect hint exists for fonts.googleapis.com', () => {
            expect(indexHtml).toMatch(/rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.googleapis\.com["']/i);
        });

        test('preconnect hint exists for fonts.gstatic.com', () => {
            expect(indexHtml).toMatch(/fonts\.gstatic\.com/);
        });
    });
});
