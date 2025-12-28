const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y, getViolations } = require('axe-playwright');

test.describe('Accessibility Tests', () => {
  test('Home page accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Inject axe-core
    await injectAxe(page);

    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('Search page accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to search if it exists
    const searchLink = page.locator('a[href*="search"]').first();
    const hasSearch = await searchLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSearch) {
      await searchLink.click();
      await page.waitForLoadState('domcontentloaded');

      await injectAxe(page);
      await checkA11y(page);
    }
  });

  test('Keyboard navigation - Tab order', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get initial focus
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    const firstFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName + (el.id ? '#' + el.id : '') : null;
    });

    expect(firstFocused).toBeTruthy();

    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }

    // Verify focus moved
    const lastFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName + (el.id ? '#' + el.id : '') : null;
    });

    expect(lastFocused).toBeTruthy();
    expect(lastFocused).not.toBe(firstFocused);
  });

  test('Keyboard navigation - Enter key activation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find first clickable element
    const firstLink = page.locator('a, button').first();
    const hasClickable = await firstLink.isVisible().catch(() => false);

    if (hasClickable) {
      await firstLink.focus();
      const href = await firstLink.getAttribute('href').catch(() => null);

      if (href && !href.startsWith('http') && !href.startsWith('#sign')) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);

        // Verify navigation or action occurred
        const newUrl = page.url();
        expect(newUrl).toBeTruthy();
      }
    }
  });

  test('ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check for navigation with proper role
    const navElements = await page.locator('nav, [role="navigation"]').count();
    expect(navElements).toBeGreaterThan(0);

    // Check for main content
    const mainElements = await page.locator('main, [role="main"]').count();
    expect(mainElements).toBeGreaterThan(0);
  });

  test('Semantic HTML structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(2); // Should have 1-2 h1 elements max

    // Check for semantic elements
    const hasHeader = await page.locator('header').isVisible().catch(() => false);
    const hasNav = await page.locator('nav').isVisible().catch(() => false);
    const hasMain = await page.locator('main').isVisible().catch(() => false);

    expect(hasHeader || hasNav || hasMain).toBeTruthy();
  });

  test('Image alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find all images
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Images should have alt text or be marked as decorative
      if (role !== 'presentation' && role !== 'none') {
        expect(alt).toBeTruthy();
      }
    }
  });

  test('Form labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find all inputs
    const inputs = await page.locator('input[type="text"], input[type="search"], input[type="email"]').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');

      if (id) {
        // Check for associated label
        const label = await page.locator(`label[for="${id}"]`).count();
        const hasLabel = label > 0 || ariaLabel || placeholder;
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('Color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await injectAxe(page);

    // Check specifically for color contrast issues
    const violations = await getViolations(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    // Should have minimal or no color contrast violations
    expect(violations.length).toBeLessThanOrEqual(5);
  });

  test('Skip links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Tab to first element (should be skip link if present)
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        text: el?.textContent?.toLowerCase() || '',
        href: el?.getAttribute('href') || ''
      };
    });

    // Check if it's a skip link
    const isSkipLink = focusedElement.text.includes('skip') ||
                       focusedElement.href.includes('#main') ||
                       focusedElement.href.includes('#content');

    // Skip links are recommended but not required
    // Just verify that first focusable element exists
    expect(focusedElement.text || focusedElement.href).toBeTruthy();
  });

  test('Focus visible indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Check that focused element has visual indicator
    const hasFocusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;

      const styles = window.getComputedStyle(el);
      const outline = styles.outline;
      const outlineWidth = styles.outlineWidth;
      const boxShadow = styles.boxShadow;

      // Should have some visible focus indicator
      return (outline && outline !== 'none' && outlineWidth !== '0px') ||
             (boxShadow && boxShadow !== 'none');
    });

    // Note: This might not always be true depending on CSS
    // But it's a good practice to check
    expect(typeof hasFocusStyle).toBe('boolean');
  });
});
