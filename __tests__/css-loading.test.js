/**
 * CSS Loading Tests (Sprint 2)
 *
 * Guards against:
 * 1. CSS references in index.html pointing to non-existent files
 * 2. Critical CSS being accidentally moved to deferred loading
 *
 * Static-analysis only — no browser or network required.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

describe('CSS Loading', () => {
    let indexHtml;

    beforeAll(() => {
        indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
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
        // Match <link ... rel="stylesheet" ... > tags (including self-closing)
        const linkTagRegex = /<link\b([^>]*?)>/gi;
        let match;
        while ((match = linkTagRegex.exec(html)) !== null) {
            const attrs = match[1];
            // Only process stylesheet links
            if (!/rel=["']stylesheet["']/i.test(attrs) && !/rel=stylesheet/i.test(attrs)) {
                continue;
            }
            // Skip external URLs (Google Fonts, CDNs)
            const hrefMatch = /href=["']([^"']+)["']/i.exec(attrs);
            if (!hrefMatch) continue;
            const href = hrefMatch[1];
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                continue;
            }
            // Detect deferred loading pattern: media="print" with onload
            const isDeferred = /media=["']print["']/i.test(attrs) && /onload=/i.test(attrs);
            results.push({ href, deferred: isDeferred });
        }
        return results;
    }

    // ---------------------------------------------------------------------------
    // Test: All referenced CSS files exist on disk
    // ---------------------------------------------------------------------------

    describe('CSS file existence', () => {
        test('every <link rel="stylesheet"> in index.html references an existing file', () => {
            const cssLinks = parseCssLinks(indexHtml);
            expect(cssLinks.length).toBeGreaterThan(0);

            const missing = [];
            for (const { href } of cssLinks) {
                const filePath = path.join(ROOT, href);
                if (!fs.existsSync(filePath)) {
                    missing.push(href);
                }
            }

            if (missing.length > 0) {
                const list = missing.map(f => `  - ${f}`).join('\n');
                throw new Error(`Missing CSS files referenced in index.html:\n${list}`);
            }
        });
    });

    // ---------------------------------------------------------------------------
    // Test: Critical CSS is NOT deferred
    // ---------------------------------------------------------------------------

    describe('Critical CSS loading', () => {
        const criticalFiles = [
            'css/site-header.css',
            'css/loading-spinner.css',
            'css/mobile-optimization.css',
            'css/auth-guard.css',
            'css/header-user.css',
            'css/header-theme-picker.css',
        ];

        test.each(criticalFiles)(
            '%s must load synchronously (not deferred)',
            (cssFile) => {
                const cssLinks = parseCssLinks(indexHtml);
                const link = cssLinks.find(l => l.href === cssFile);

                // File must be referenced
                expect(link).toBeDefined();

                // Must NOT be deferred
                expect(link.deferred).toBe(false);
            }
        );
    });

    // ---------------------------------------------------------------------------
    // Test: Truly non-critical CSS is deferred
    // ---------------------------------------------------------------------------

    describe('Non-critical CSS is deferred', () => {
        const deferredFiles = [
            'css/compare-view.css',
            'css/edit-modal.css',
            'css/admin-moderation.css',
            'css/discussion-system.css',
            'css/private-notes.css',
            'css/virtual-scroller.css',
        ];

        test.each(deferredFiles)(
            '%s should be deferred (not render-blocking)',
            (cssFile) => {
                const cssLinks = parseCssLinks(indexHtml);
                const link = cssLinks.find(l => l.href === cssFile);

                // File must be referenced
                expect(link).toBeDefined();

                // Should be deferred
                expect(link.deferred).toBe(true);
            }
        );
    });

    // ---------------------------------------------------------------------------
    // Test: Loading containers have correct structure
    // ---------------------------------------------------------------------------

    describe('Loading container structure', () => {
        test('loading-spinner.css defines .spa-loading with width: 100%', () => {
            const spinnerCss = fs.readFileSync(path.join(ROOT, 'css/loading-spinner.css'), 'utf8');
            // Should have .spa-loading selector
            expect(spinnerCss).toMatch(/\.spa-loading/);
            // .spa-loading should have width: 100%
            const spaLoadingBlock = spinnerCss.match(/\.spa-loading\s*\{([^}]+)\}/);
            expect(spaLoadingBlock).not.toBeNull();
            expect(spaLoadingBlock[1]).toMatch(/width\s*:\s*100%/);
        });

        test('dynamic-views.css defines .loading-container with width: 100%', () => {
            const dynamicCss = fs.readFileSync(path.join(ROOT, 'css/dynamic-views.css'), 'utf8');
            expect(dynamicCss).toMatch(/\.loading-container/);
            // At least one .loading-container rule should have width: 100%
            const hasWidth100 = /\.loading-container\s*\{[^}]*width\s*:\s*100%/s.test(dynamicCss);
            expect(hasWidth100).toBe(true);
        });

        test('index.html inline .loading-container has width: 100%', () => {
            // The inline <style> block in index.html defines .loading-container
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
