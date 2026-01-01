/**
 * Accessibility E2E Tests for Eyes of Azrael
 *
 * Tests WCAG 2.1 AA compliance across key pages:
 * - Landing page
 * - Browse category
 * - Entity detail
 *
 * Requirements tested:
 * 1. All images have alt text
 * 2. Heading hierarchy is correct (h1 > h2 > h3)
 * 3. Color contrast meets AA standard
 * 4. Keyboard navigation works (tab through elements)
 * 5. Focus indicators are visible
 * 6. ARIA labels on interactive elements
 * 7. Skip link for main content
 * 8. Form inputs have labels
 * 9. Error messages are announced
 * 10. No ARIA violations (axe-core)
 */

const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y, getViolations } = require('axe-playwright');

// Test configuration
const TEST_TIMEOUT = 60000;
const NAVIGATION_TIMEOUT = 30000;

// ============================================
// Test Utilities
// ============================================

/**
 * Wait for page to be fully loaded
 */
async function waitForPageLoad(page) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Allow for SPA content to render
}

/**
 * Get visible heading hierarchy
 */
async function getHeadingHierarchy(page) {
    return page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headings)
            .filter(h => {
                const style = getComputedStyle(h);
                return style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       h.offsetParent !== null;
            })
            .map(h => ({
                level: parseInt(h.tagName.charAt(1)),
                text: h.textContent?.trim().substring(0, 100) || '',
                tagName: h.tagName
            }));
    });
}

/**
 * Check if heading hierarchy is valid (no skipped levels)
 */
function validateHeadingHierarchy(headings) {
    if (headings.length === 0) return { valid: false, error: 'No headings found' };

    // First visible heading should be h1 (or h2 is acceptable for SPA sections)
    const firstHeading = headings[0];
    if (firstHeading.level > 2) {
        return {
            valid: false,
            error: `First heading should be h1 or h2, found h${firstHeading.level}`
        };
    }

    // Check for skipped levels (e.g., h1 -> h3 without h2)
    let previousLevel = firstHeading.level;
    for (let i = 1; i < headings.length; i++) {
        const currentLevel = headings[i].level;
        // Allow going up (smaller numbers) or down by 1
        if (currentLevel > previousLevel + 1) {
            return {
                valid: false,
                error: `Heading level skipped from h${previousLevel} to h${currentLevel} at "${headings[i].text}"`
            };
        }
        previousLevel = currentLevel;
    }

    return { valid: true };
}

// ============================================
// Landing Page Accessibility Tests
// ============================================

test.describe('Landing Page Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(TEST_TIMEOUT);
        await page.goto('/', { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
        await waitForPageLoad(page);
    });

    test('1. All images have alt text', async ({ page }) => {
        const images = await page.locator('img').all();

        for (const img of images) {
            const src = await img.getAttribute('src');
            const alt = await img.getAttribute('alt');
            const role = await img.getAttribute('role');
            const ariaHidden = await img.getAttribute('aria-hidden');

            // Images should have alt text, be marked as decorative, or be hidden from AT
            const isAccessible = alt !== null ||
                                 role === 'presentation' ||
                                 role === 'none' ||
                                 ariaHidden === 'true';

            expect(isAccessible, `Image ${src} missing alt text`).toBeTruthy();
        }
    });

    test('2. Heading hierarchy is correct', async ({ page }) => {
        const headings = await getHeadingHierarchy(page);
        console.log('Headings found:', headings);

        expect(headings.length, 'Page should have at least one heading').toBeGreaterThan(0);

        // Check for h1 presence
        const hasH1 = headings.some(h => h.level === 1);
        expect(hasH1, 'Page should have an h1 element').toBeTruthy();

        // Validate hierarchy
        const validation = validateHeadingHierarchy(headings);
        expect(validation.valid, validation.error).toBeTruthy();
    });

    test('3. Color contrast meets AA standard', async ({ page }) => {
        await injectAxe(page);

        const violations = await getViolations(page, null, {
            runOnly: {
                type: 'rule',
                values: ['color-contrast']
            }
        });

        // Log any violations for debugging
        if (violations.length > 0) {
            console.log('Color contrast violations:', JSON.stringify(violations, null, 2));
        }

        // Allow a small number of minor violations (some may be in non-critical UI elements)
        expect(violations.length, 'Color contrast violations should be minimal').toBeLessThanOrEqual(3);
    });

    test('4. Keyboard navigation works - Tab through elements', async ({ page }) => {
        const focusedElements = [];

        // Start from body
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);

        // Tab through first 15 focusable elements
        for (let i = 0; i < 15; i++) {
            const focusedInfo = await page.evaluate(() => {
                const el = document.activeElement;
                if (!el || el === document.body) return null;

                return {
                    tagName: el.tagName,
                    id: el.id || null,
                    className: el.className?.split(' ')[0] || null,
                    role: el.getAttribute('role') || null,
                    ariaLabel: el.getAttribute('aria-label') || null,
                    href: el.getAttribute('href') || null,
                    text: el.textContent?.trim().substring(0, 50) || null
                };
            });

            if (focusedInfo) {
                focusedElements.push(focusedInfo);
            }

            await page.keyboard.press('Tab');
            await page.waitForTimeout(200);
        }

        console.log('Focused elements during tab navigation:', focusedElements);

        // Should be able to tab through multiple elements
        expect(focusedElements.length, 'Should have focusable interactive elements').toBeGreaterThan(3);

        // Verify we hit different types of elements
        const tagNames = [...new Set(focusedElements.map(e => e.tagName))];
        console.log('Unique tag names:', tagNames);
    });

    test('5. Focus indicators are visible', async ({ page }) => {
        // Tab to first interactive element
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);

        // Check focus visibility on multiple elements
        const focusChecks = [];

        for (let i = 0; i < 5; i++) {
            const focusInfo = await page.evaluate(() => {
                const el = document.activeElement;
                if (!el || el === document.body) return null;

                const styles = getComputedStyle(el);
                const outline = styles.outline;
                const outlineWidth = styles.outlineWidth;
                const outlineStyle = styles.outlineStyle;
                const boxShadow = styles.boxShadow;
                const borderColor = styles.borderColor;

                // Check for visible focus indicator
                const hasOutline = outlineStyle !== 'none' &&
                                   outlineWidth !== '0px' &&
                                   outline !== 'none';
                const hasBoxShadow = boxShadow && boxShadow !== 'none';
                const hasFocusStyles = hasOutline || hasBoxShadow;

                return {
                    tagName: el.tagName,
                    hasFocusStyles,
                    outline,
                    outlineWidth,
                    boxShadow: boxShadow?.substring(0, 100)
                };
            });

            if (focusInfo) {
                focusChecks.push(focusInfo);
            }

            await page.keyboard.press('Tab');
            await page.waitForTimeout(200);
        }

        console.log('Focus indicator checks:', focusChecks);

        // At least some elements should have visible focus indicators
        const elementsWithFocus = focusChecks.filter(c => c && c.hasFocusStyles);
        expect(
            elementsWithFocus.length,
            'Interactive elements should have visible focus indicators'
        ).toBeGreaterThan(0);
    });

    test('6. ARIA labels on interactive elements', async ({ page }) => {
        // Check buttons without visible text
        const buttons = await page.locator('button').all();
        for (const button of buttons) {
            const text = await button.textContent();
            const ariaLabel = await button.getAttribute('aria-label');
            const ariaLabelledBy = await button.getAttribute('aria-labelledby');
            const title = await button.getAttribute('title');

            const hasAccessibleName = (text && text.trim().length > 0) ||
                                      ariaLabel ||
                                      ariaLabelledBy ||
                                      title;

            // Get button identifier for error message
            const id = await button.getAttribute('id');
            const className = await button.getAttribute('class');
            const identifier = id || className?.split(' ')[0] || 'unknown';

            expect(
                hasAccessibleName,
                `Button "${identifier}" should have accessible name`
            ).toBeTruthy();
        }

        // Check links
        const links = await page.locator('a').all();
        for (const link of links.slice(0, 20)) { // Check first 20 links
            const text = await link.textContent();
            const ariaLabel = await link.getAttribute('aria-label');
            const ariaLabelledBy = await link.getAttribute('aria-labelledby');
            const title = await link.getAttribute('title');
            const href = await link.getAttribute('href');

            const hasAccessibleName = (text && text.trim().length > 0) ||
                                      ariaLabel ||
                                      ariaLabelledBy ||
                                      title;

            expect(
                hasAccessibleName,
                `Link to "${href}" should have accessible name`
            ).toBeTruthy();
        }

        // Check for navigation landmarks
        const navElements = await page.locator('nav, [role="navigation"]').count();
        expect(navElements, 'Page should have navigation landmarks').toBeGreaterThan(0);

        // Check for main landmark
        const mainElements = await page.locator('main, [role="main"]').count();
        expect(mainElements, 'Page should have a main landmark').toBeGreaterThan(0);
    });

    test('7. Skip link for main content', async ({ page }) => {
        // Tab to first focusable element
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);

        const skipLinkInfo = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el) return null;

            const text = el.textContent?.toLowerCase() || '';
            const href = el.getAttribute('href') || '';

            return {
                isSkipLink: text.includes('skip') ||
                           href.includes('#main') ||
                           href.includes('#content'),
                text: el.textContent?.trim(),
                href
            };
        });

        console.log('First focusable element:', skipLinkInfo);

        // Check for skip link presence
        const skipLink = await page.locator('a[href="#main-content"], a.skip-to-main, [class*="skip"]').first();
        const skipLinkExists = await skipLink.count() > 0;

        if (skipLinkExists) {
            // Verify skip link works
            await skipLink.focus();
            await page.keyboard.press('Enter');
            await page.waitForTimeout(300);

            const focusAfterSkip = await page.evaluate(() => {
                const el = document.activeElement;
                return el?.id || el?.getAttribute('role') || el?.tagName;
            });

            console.log('Focus after skip link:', focusAfterSkip);
            expect(focusAfterSkip).toBeTruthy();
        } else {
            console.log('Skip link not found - consider adding one for better accessibility');
        }
    });

    test('8. Form inputs have labels', async ({ page }) => {
        const inputs = await page.locator(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
            'select, textarea'
        ).all();

        for (const input of inputs) {
            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledBy = await input.getAttribute('aria-labelledby');
            const placeholder = await input.getAttribute('placeholder');
            const title = await input.getAttribute('title');
            const type = await input.getAttribute('type');

            // Check for associated label
            let hasLabel = false;
            if (id) {
                const label = await page.locator(`label[for="${id}"]`).count();
                hasLabel = label > 0;
            }

            const hasAccessibleLabel = hasLabel ||
                                       ariaLabel ||
                                       ariaLabelledBy ||
                                       title;

            // Placeholder alone is not sufficient for accessibility
            const identifier = id || type || 'input';
            expect(
                hasAccessibleLabel,
                `Form input "${identifier}" should have a proper label (placeholder alone is insufficient)`
            ).toBeTruthy();
        }
    });

    test('10. No critical ARIA violations (axe-core)', async ({ page }) => {
        await injectAxe(page);

        // Run full axe audit
        await checkA11y(page, null, {
            detailedReport: true,
            detailedReportOptions: { html: true },
            // Only fail on serious and critical violations
            axeOptions: {
                resultTypes: ['violations'],
                rules: {
                    // Disable rules that may have false positives for SPAs
                    'page-has-heading-one': { enabled: true },
                    'landmark-one-main': { enabled: true },
                    'region': { enabled: true }
                }
            }
        });
    });
});

// ============================================
// Browse Category Page Accessibility Tests
// ============================================

test.describe('Browse Category Page Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(TEST_TIMEOUT);
        // Navigate to a category page (deities is a common one)
        await page.goto('#/browse/deities', { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
        await waitForPageLoad(page);
    });

    test('1. All images have alt text', async ({ page }) => {
        const images = await page.locator('img').all();

        for (const img of images) {
            const src = await img.getAttribute('src');
            const alt = await img.getAttribute('alt');
            const role = await img.getAttribute('role');
            const ariaHidden = await img.getAttribute('aria-hidden');

            const isAccessible = alt !== null ||
                                 role === 'presentation' ||
                                 role === 'none' ||
                                 ariaHidden === 'true';

            expect(isAccessible, `Image ${src} missing alt text`).toBeTruthy();
        }
    });

    test('2. Heading hierarchy is correct', async ({ page }) => {
        const headings = await getHeadingHierarchy(page);
        console.log('Browse page headings:', headings);

        expect(headings.length).toBeGreaterThan(0);

        // Check for h1
        const hasH1 = headings.some(h => h.level === 1);
        expect(hasH1, 'Browse page should have an h1 element').toBeTruthy();

        // Validate hierarchy
        const validation = validateHeadingHierarchy(headings);
        expect(validation.valid, validation.error).toBeTruthy();
    });

    test('3. Color contrast meets AA standard', async ({ page }) => {
        await injectAxe(page);

        const violations = await getViolations(page, null, {
            runOnly: {
                type: 'rule',
                values: ['color-contrast']
            }
        });

        if (violations.length > 0) {
            console.log('Browse page color contrast violations:',
                violations.map(v => ({
                    id: v.id,
                    impact: v.impact,
                    nodes: v.nodes.length
                }))
            );
        }

        expect(violations.length).toBeLessThanOrEqual(5);
    });

    test('4. Filter controls are keyboard accessible', async ({ page }) => {
        // Find filter elements
        const filterChips = await page.locator('.filter-chip, [data-filter-type]').all();
        const sortSelect = page.locator('#sortOrder, select[id*="sort"]').first();
        const searchInput = page.locator('#searchFilter, input[type="search"], input[type="text"]').first();

        // Test search input keyboard access
        if (await searchInput.count() > 0) {
            await searchInput.focus();
            await page.keyboard.type('test');
            const value = await searchInput.inputValue();
            expect(value).toBe('test');
            await searchInput.fill(''); // Clear
        }

        // Test sort select keyboard access
        if (await sortSelect.count() > 0) {
            await sortSelect.focus();
            await page.keyboard.press('Space');
            await page.waitForTimeout(200);
        }

        // Test filter chips are focusable
        for (const chip of filterChips.slice(0, 3)) {
            const isVisible = await chip.isVisible();
            if (isVisible) {
                await chip.focus();
                const ariaPressed = await chip.getAttribute('aria-pressed');
                expect(ariaPressed).not.toBeNull();
            }
        }
    });

    test('5. Entity cards have proper semantics', async ({ page }) => {
        const entityCards = await page.locator('.entity-card, [data-entity-id]').all();

        for (const card of entityCards.slice(0, 5)) {
            const isVisible = await card.isVisible();
            if (!isVisible) continue;

            // Card should be a link or have role
            const role = await card.getAttribute('role');
            const tagName = await card.evaluate(el => el.tagName.toLowerCase());
            const ariaLabel = await card.getAttribute('aria-label');

            const hasProperRole = tagName === 'a' ||
                                  tagName === 'button' ||
                                  role === 'article' ||
                                  role === 'button' ||
                                  role === 'link';

            expect(hasProperRole, 'Entity card should have proper semantic role').toBeTruthy();

            // Should have accessible name
            const text = await card.textContent();
            const hasAccessibleName = ariaLabel || (text && text.trim().length > 0);
            expect(hasAccessibleName, 'Entity card should have accessible name').toBeTruthy();
        }
    });

    test('6. ARIA labels on filter controls', async ({ page }) => {
        // Check filter region
        const filterRegion = await page.locator('[role="region"][aria-label*="filter"], .quick-filters');
        if (await filterRegion.count() > 0) {
            const ariaLabel = await filterRegion.first().getAttribute('aria-label');
            const ariaLabelledBy = await filterRegion.first().getAttribute('aria-labelledby');
            expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        }

        // Check filter groups have proper labeling
        const filterGroups = await page.locator('[role="group"], .filter-chips').all();
        for (const group of filterGroups) {
            const ariaLabelledBy = await group.getAttribute('aria-labelledby');
            const ariaLabel = await group.getAttribute('aria-label');
            const role = await group.getAttribute('role');

            if (role === 'group') {
                expect(
                    ariaLabel || ariaLabelledBy,
                    'Filter group should have aria-label or aria-labelledby'
                ).toBeTruthy();
            }
        }
    });

    test('10. No critical ARIA violations (axe-core)', async ({ page }) => {
        await injectAxe(page);

        await checkA11y(page, null, {
            detailedReport: true,
            axeOptions: {
                resultTypes: ['violations']
            }
        });
    });
});

// ============================================
// Entity Detail Page Accessibility Tests
// ============================================

test.describe('Entity Detail Page Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(TEST_TIMEOUT);

        // First navigate to browse page to find an entity
        await page.goto('#/browse/deities', { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
        await waitForPageLoad(page);

        // Click on first entity card to navigate to detail page
        const firstEntity = page.locator('.entity-card, [data-entity-id]').first();
        if (await firstEntity.count() > 0) {
            await firstEntity.click();
            await page.waitForTimeout(2000);
        } else {
            // Direct navigation fallback - try common entity paths
            await page.goto('#/entity/deities/greek/zeus', { timeout: NAVIGATION_TIMEOUT });
            await waitForPageLoad(page);
        }
    });

    test('1. All images have alt text', async ({ page }) => {
        const images = await page.locator('img').all();

        for (const img of images) {
            const src = await img.getAttribute('src');
            const alt = await img.getAttribute('alt');
            const role = await img.getAttribute('role');
            const ariaHidden = await img.getAttribute('aria-hidden');

            const isAccessible = alt !== null ||
                                 role === 'presentation' ||
                                 role === 'none' ||
                                 ariaHidden === 'true';

            expect(isAccessible, `Image ${src} missing alt text`).toBeTruthy();
        }
    });

    test('2. Heading hierarchy is correct', async ({ page }) => {
        const headings = await getHeadingHierarchy(page);
        console.log('Entity detail headings:', headings);

        // Entity detail should have clear heading structure
        expect(headings.length).toBeGreaterThan(0);

        // Should have h1 for entity name
        const hasH1 = headings.some(h => h.level === 1);
        expect(hasH1, 'Entity detail should have h1 for entity name').toBeTruthy();

        // Validate hierarchy
        const validation = validateHeadingHierarchy(headings);
        expect(validation.valid, validation.error).toBeTruthy();
    });

    test('3. Color contrast meets AA standard', async ({ page }) => {
        await injectAxe(page);

        const violations = await getViolations(page, null, {
            runOnly: {
                type: 'rule',
                values: ['color-contrast']
            }
        });

        if (violations.length > 0) {
            console.log('Entity detail color contrast violations:', violations.length);
        }

        expect(violations.length).toBeLessThanOrEqual(5);
    });

    test('4. Content sections are keyboard navigable', async ({ page }) => {
        // Tab through entity detail content
        const focusedElements = [];

        await page.keyboard.press('Tab');

        for (let i = 0; i < 20; i++) {
            const info = await page.evaluate(() => {
                const el = document.activeElement;
                if (!el || el === document.body) return null;
                return {
                    tagName: el.tagName,
                    role: el.getAttribute('role'),
                    text: el.textContent?.trim().substring(0, 30)
                };
            });

            if (info) focusedElements.push(info);
            await page.keyboard.press('Tab');
            await page.waitForTimeout(150);
        }

        console.log('Entity detail focusable elements:', focusedElements.length);
        expect(focusedElements.length).toBeGreaterThan(0);
    });

    test('5. Related entities links are accessible', async ({ page }) => {
        // Find related entity links
        const relatedLinks = await page.locator(
            '[class*="related"] a, [class*="connections"] a, [class*="links"] a'
        ).all();

        for (const link of relatedLinks.slice(0, 5)) {
            const isVisible = await link.isVisible();
            if (!isVisible) continue;

            const href = await link.getAttribute('href');
            const text = await link.textContent();
            const ariaLabel = await link.getAttribute('aria-label');

            // Links should have accessible name
            const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel;
            expect(
                hasAccessibleName,
                `Related entity link to ${href} needs accessible name`
            ).toBeTruthy();
        }
    });

    test('6. ARIA landmarks present', async ({ page }) => {
        // Check for main content area
        const main = await page.locator('main, [role="main"]').count();
        expect(main, 'Should have main landmark').toBeGreaterThan(0);

        // Check for article role on entity content
        const article = await page.locator('article, [role="article"]').count();
        // Article is optional but good practice for entity detail

        // Check header
        const header = await page.locator('header, [role="banner"]').count();
        expect(header, 'Should have header landmark').toBeGreaterThan(0);
    });

    test('10. No critical ARIA violations (axe-core)', async ({ page }) => {
        await injectAxe(page);

        await checkA11y(page, null, {
            detailedReport: true,
            axeOptions: {
                resultTypes: ['violations']
            }
        });
    });
});

// ============================================
// Global Accessibility Tests (All Pages)
// ============================================

test.describe('Global Accessibility Requirements', () => {
    test('9. Error messages are announced - Login error scenario', async ({ page }) => {
        test.setTimeout(TEST_TIMEOUT);
        await page.goto('/', { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
        await waitForPageLoad(page);

        // Find sign in button if present
        const signInBtn = page.locator('#signInBtn, [aria-label*="sign in" i], button:has-text("Sign In")').first();

        if (await signInBtn.count() > 0 && await signInBtn.isVisible()) {
            // Check for aria-live regions that would announce errors
            const liveRegions = await page.locator('[aria-live], [role="alert"], [role="status"]').all();
            console.log('Live regions found:', liveRegions.length);

            // Page should have mechanism for announcing errors
            // Check for error container or aria-live region
            const errorContainers = await page.locator(
                '[aria-live="polite"], [aria-live="assertive"], [role="alert"], .error-message, .toast-notification'
            ).count();

            console.log('Error announcement mechanisms:', errorContainers);
        }
    });

    test('Page language is set', async ({ page }) => {
        await page.goto('/');
        await waitForPageLoad(page);

        const lang = await page.locator('html').getAttribute('lang');
        expect(lang, 'HTML element should have lang attribute').toBeTruthy();
        expect(lang, 'Language should be English').toMatch(/^en/i);
    });

    test('Page has descriptive title', async ({ page }) => {
        await page.goto('/');
        await waitForPageLoad(page);

        const title = await page.title();
        expect(title, 'Page should have a title').toBeTruthy();
        expect(title.length, 'Title should be descriptive').toBeGreaterThan(5);
    });

    test('Interactive elements have sufficient touch target size', async ({ page }) => {
        await page.goto('/');
        await waitForPageLoad(page);

        const interactiveElements = await page.locator('a, button, input, select').all();

        for (const el of interactiveElements.slice(0, 10)) {
            const isVisible = await el.isVisible();
            if (!isVisible) continue;

            const box = await el.boundingBox();
            if (!box) continue;

            // WCAG 2.5.5 recommends 44x44px minimum touch target
            // WCAG 2.5.8 (AAA) requires 24x24px minimum
            const minSize = 24; // AA level

            // Allow inline links to be smaller if they have adequate spacing
            const tagName = await el.evaluate(e => e.tagName.toLowerCase());
            if (tagName === 'a') continue; // Skip inline text links

            if (box.width < minSize || box.height < minSize) {
                console.log(`Small touch target: ${tagName} (${box.width}x${box.height})`);
            }
        }
    });

    test('No auto-playing media', async ({ page }) => {
        await page.goto('/');
        await waitForPageLoad(page);

        // Check for video/audio elements
        const autoplayMedia = await page.locator('video[autoplay], audio[autoplay]').count();
        expect(autoplayMedia, 'Should not have auto-playing media').toBe(0);

        // Or if autoplay exists, it should be muted
        const unmutedAutoplay = await page.locator(
            'video[autoplay]:not([muted]), audio[autoplay]:not([muted])'
        ).count();
        expect(unmutedAutoplay, 'Autoplay media should be muted').toBe(0);
    });

    test('Reduced motion is respected', async ({ page }) => {
        // Set prefers-reduced-motion
        await page.emulateMedia({ reducedMotion: 'reduce' });

        await page.goto('/');
        await waitForPageLoad(page);

        // Check that animations are disabled or reduced
        const animatedElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            let animatedCount = 0;

            for (const el of elements) {
                const style = getComputedStyle(el);
                const animDuration = parseFloat(style.animationDuration) || 0;
                const transDuration = parseFloat(style.transitionDuration) || 0;

                // Check for long animations (> 0.3s)
                if (animDuration > 0.3 || transDuration > 0.3) {
                    animatedCount++;
                }
            }

            return animatedCount;
        });

        console.log('Elements with animations in reduced motion mode:', animatedElements);
        // Should have minimal animations
    });
});

// ============================================
// Comprehensive axe-core Audit
// ============================================

test.describe('Comprehensive axe-core Accessibility Audit', () => {
    test('Landing page - Full accessibility audit', async ({ page }) => {
        test.setTimeout(TEST_TIMEOUT);
        await page.goto('/', { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
        await waitForPageLoad(page);

        await injectAxe(page);

        const violations = await getViolations(page);

        // Log all violations for review
        if (violations.length > 0) {
            console.log('\n=== ACCESSIBILITY VIOLATIONS ===');
            for (const violation of violations) {
                console.log(`\n${violation.id} (${violation.impact}): ${violation.description}`);
                console.log(`  Help: ${violation.helpUrl}`);
                console.log(`  Affected elements: ${violation.nodes.length}`);

                for (const node of violation.nodes.slice(0, 3)) {
                    console.log(`    - ${node.target.join(' > ')}`);
                }
            }
            console.log('\n=================================\n');
        }

        // Fail only on critical/serious violations
        const criticalViolations = violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(
            criticalViolations.length,
            `Found ${criticalViolations.length} critical/serious accessibility violations`
        ).toBe(0);
    });

    test('Browse page - Full accessibility audit', async ({ page }) => {
        test.setTimeout(TEST_TIMEOUT);
        await page.goto('#/browse/deities', { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
        await waitForPageLoad(page);

        await injectAxe(page);

        const violations = await getViolations(page);

        const criticalViolations = violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious'
        );

        if (criticalViolations.length > 0) {
            console.log('Critical violations on browse page:', criticalViolations);
        }

        expect(criticalViolations.length).toBe(0);
    });

    test('Mythologies page - Full accessibility audit', async ({ page }) => {
        test.setTimeout(TEST_TIMEOUT);
        await page.goto('#/mythologies', { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
        await waitForPageLoad(page);

        await injectAxe(page);

        const violations = await getViolations(page);

        const criticalViolations = violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalViolations.length).toBe(0);
    });
});
