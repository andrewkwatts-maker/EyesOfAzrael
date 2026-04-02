/**
 * Mobile Responsive Tests (Sprint 6)
 *
 * Guards against:
 * 1. Footer links pointing to non-existent/broken routes
 * 2. Missing newsletter form HTML
 * 3. Critical mobile CSS files being absent
 * 4. Touch target sizes below WCAG minimum (44px)
 *
 * Static-analysis only — no browser or network required.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

describe('Mobile Responsive & Footer', () => {
    let indexHtml;
    let spaNavJs;

    beforeAll(() => {
        indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        spaNavJs = fs.readFileSync(path.join(ROOT, 'js', 'spa-navigation.js'), 'utf8');
    });

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Extract all footer link hrefs from index.html.
     * Only returns hash-based SPA links (starting with #/).
     */
    function parseFooterLinks(html) {
        const links = [];
        // Match the footer element block
        const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
        if (!footerMatch) return links;

        const footerHtml = footerMatch[0];
        const hrefRegex = /href=["'](#\/[^"']*?)["']/gi;
        let match;
        while ((match = hrefRegex.exec(footerHtml)) !== null) {
            links.push(match[1]);
        }
        return links;
    }

    /**
     * Check if a given hash route is handled by spa-navigation.js.
     * We test this by checking the route regexes or the renderX method presence.
     */
    function isRouteHandled(href, navJs) {
        // Strip the leading # to get just the path
        const path = href.replace(/^#/, '');

        // Home route
        if (path === '/' || path === '') return true;

        // Browse category route: /browse/:category
        if (/^\/browse\/[^/]+\/?$/.test(path)) return true;

        // Named routes: check by looking for the route regex definitions
        const routeMap = {
            '/mythologies': 'mythologies',
            '/search': 'search',
            '/compare': 'compare',
            '/dashboard': 'dashboard',
            '/about': 'about',
            '/privacy': 'privacy',
            '/terms': 'terms',
            '/corpus-explorer': 'corpus_explorer',
            '/guidelines': 'guidelines',
            '/admin': 'admin',
        };

        const basePath = path.split('?')[0].replace(/\/$/, '');
        if (routeMap[basePath]) {
            const routeName = routeMap[basePath];
            // Verify the route regex is defined in spa-navigation.js
            return navJs.includes(routeName + ':');
        }

        return false;
    }

    // ---------------------------------------------------------------------------
    // Tests: Footer Links
    // ---------------------------------------------------------------------------

    describe('Footer Links', () => {
        test('all footer SPA links should point to handled routes', () => {
            const footerLinks = parseFooterLinks(indexHtml);
            expect(footerLinks.length).toBeGreaterThan(0);

            const brokenLinks = footerLinks.filter(href => !isRouteHandled(href, spaNavJs));
            expect(brokenLinks).toEqual([]);
        });

        test('footer should contain links to core sections', () => {
            const footerLinks = parseFooterLinks(indexHtml);
            const hrefs = footerLinks.map(l => l);

            expect(hrefs).toContain('#/');
            expect(hrefs).toContain('#/mythologies');
            expect(hrefs.some(h => h.startsWith('#/browse/'))).toBe(true);
        });

        test('footer should contain Tools section links', () => {
            const footerLinks = parseFooterLinks(indexHtml);
            expect(footerLinks).toContain('#/search');
            expect(footerLinks).toContain('#/compare');
            expect(footerLinks).toContain('#/dashboard');
        });

        test('footer should contain Company section links', () => {
            const footerLinks = parseFooterLinks(indexHtml);
            expect(footerLinks).toContain('#/about');
            expect(footerLinks).toContain('#/privacy');
            expect(footerLinks).toContain('#/terms');
        });
    });

    // ---------------------------------------------------------------------------
    // Tests: Newsletter Form
    // ---------------------------------------------------------------------------

    describe('Newsletter Form', () => {
        test('footer newsletter form should exist in index.html', () => {
            expect(indexHtml).toContain('footer-newsletter-form');
        });

        test('newsletter form should have email input', () => {
            expect(indexHtml).toContain('footer-newsletter-input');
        });

        test('newsletter form should have submit button', () => {
            expect(indexHtml).toContain('footer-newsletter-btn');
        });

        test('newsletter form should have aria-label', () => {
            expect(indexHtml).toMatch(/footer-newsletter-form[^>]*aria-label/);
        });

        test('header-nav.js should contain newsletter handler', () => {
            const headerNavJs = fs.readFileSync(
                path.join(ROOT, 'js', 'header-nav.js'), 'utf8'
            );
            expect(headerNavJs).toContain('setupNewsletterForm');
            expect(headerNavJs).toContain('newsletter_subscribers');
            expect(headerNavJs).toContain('emailRegex');
        });
    });

    // ---------------------------------------------------------------------------
    // Tests: Critical Mobile CSS Files
    // ---------------------------------------------------------------------------

    describe('Mobile CSS Files', () => {
        const criticalMobileCssFiles = [
            'css/mobile-optimization.css',
            'css/site-header.css',
            'css/entity-card-polish.css',
        ];

        criticalMobileCssFiles.forEach(cssFile => {
            test(`${cssFile} should exist on disk`, () => {
                const fullPath = path.join(ROOT, cssFile);
                expect(fs.existsSync(fullPath)).toBe(true);
            });
        });

        test('mobile-optimization.css should have overflow-x: hidden on html/body', () => {
            const mobileOptCss = fs.readFileSync(
                path.join(ROOT, 'css', 'mobile-optimization.css'), 'utf8'
            );
            expect(mobileOptCss).toContain('overflow-x: hidden');
        });

        test('site-header.css should have mobile breakpoint at 900px', () => {
            const siteHeaderCss = fs.readFileSync(
                path.join(ROOT, 'css', 'site-header.css'), 'utf8'
            );
            expect(siteHeaderCss).toContain('max-width: 900px');
        });

        test('site-header.css should have very narrow viewport breakpoint', () => {
            const siteHeaderCss = fs.readFileSync(
                path.join(ROOT, 'css', 'site-header.css'), 'utf8'
            );
            // Should have a breakpoint for 360px or 320px
            expect(siteHeaderCss).toMatch(/max-width:\s*(360|320)px/);
        });
    });

    // ---------------------------------------------------------------------------
    // Tests: Touch Target Sizes
    // ---------------------------------------------------------------------------

    describe('Touch Targets', () => {
        test('entity-card-polish.css should enforce 44px minimum touch target on touch devices', () => {
            const cardCss = fs.readFileSync(
                path.join(ROOT, 'css', 'entity-card-polish.css'), 'utf8'
            );
            // Should have min-height: 44px for touch targets
            expect(cardCss).toContain('min-height: 44px');
        });

        test('site-header.css should maintain 44px icon button size on mobile', () => {
            const siteHeaderCss = fs.readFileSync(
                path.join(ROOT, 'css', 'site-header.css'), 'utf8'
            );
            // Verify the 480px breakpoint sets icon-btn to 44px
            expect(siteHeaderCss).toContain('44px');
        });
    });
});
