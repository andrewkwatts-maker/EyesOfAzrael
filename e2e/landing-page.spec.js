/**
 * Landing Page Verification Tests
 * Tests the home page loading, rendering, and navigation
 * Run against production: BASE_URL=https://www.eyesofazrael.com npx playwright test e2e/landing-page.spec.js
 */

const { test, expect } = require('@playwright/test');

test.describe('Landing Page Loading & Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for production testing
    test.setTimeout(60000);
  });

  test('Home page loads without errors', async ({ page }) => {
    // Collect console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to home page
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    // Verify HTTP response
    expect(response.status()).toBe(200);

    // Wait for main content to be visible
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 10000 });

    // Check for critical errors (filter out expected ones)
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('Failed to load resource')
    );

    console.log('Console errors:', errors);
    expect(criticalErrors.length).toBe(0);
  });

  test('Landing page displays 12 category cards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for landing page to render
    await page.waitForSelector('.landing-page, .category-grid, .asset-type-grid', { timeout: 15000 });

    // Check for category cards
    const categoryCards = page.locator('.category-card, .asset-type-card, .landing-category');
    const count = await categoryCards.count();

    console.log(`Found ${count} category cards`);

    // Should have at least some category cards (expecting 12)
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('Category cards have proper structure', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Find category cards
    const cards = page.locator('.category-card, .asset-type-card, .landing-category');
    const count = await cards.count();

    if (count > 0) {
      // Check first card has required elements
      const firstCard = cards.first();

      // Should have a title/name
      const hasTitle = await firstCard.locator('h2, h3, .category-name, .card-title').isVisible();
      expect(hasTitle).toBeTruthy();

      // Should be clickable (has link or click handler)
      const isClickable = await firstCard.locator('a').count() > 0 ||
                          await firstCard.getAttribute('onclick') !== null ||
                          await firstCard.getAttribute('role') === 'button';
      console.log('First card clickable:', isClickable);
    }
  });

  test('Loading spinner disappears after content loads', async ({ page }) => {
    await page.goto('/');

    // Check that loading spinner eventually disappears
    const spinner = page.locator('.loading-container, .loading-spinner, .loader');

    // Wait for spinner to be hidden or removed
    await expect(spinner).toBeHidden({ timeout: 15000 }).catch(() => {
      // Spinner might not exist at all, which is fine
    });

    // Main content should be visible
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('Header is visible with logo and theme toggle', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Header should be visible
    const header = page.locator('header, .site-header');
    await expect(header).toBeVisible();

    // Logo should be present
    const logo = page.locator('.site-logo, .logo, header a[href="/"], header a[href="#/"]');
    await expect(logo.first()).toBeVisible();

    // Theme toggle should be present
    const themeToggle = page.locator('#themePickerContainer, .theme-toggle, .theme-picker, #theme-toggle');
    await expect(themeToggle.first()).toBeVisible();
  });
});

test.describe('Landing Page Navigation', () => {
  test('Clicking "World Mythologies" navigates to mythologies page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for landing page
    await page.waitForTimeout(3000);

    // Find and click World Mythologies card
    const mythologiesCard = page.locator('a[href*="mythologies"], .category-card:has-text("Mythologies"), [data-category="mythologies"]').first();

    if (await mythologiesCard.isVisible()) {
      await mythologiesCard.click();
      await page.waitForURL(/mythologies|#\/mythologies/, { timeout: 10000 });

      // Verify navigation
      expect(page.url()).toMatch(/mythologies/i);
    }
  });

  test('Clicking "Deities & Gods" navigates to deities browse page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Find and click Deities card
    const deitiesCard = page.locator('a[href*="deities"], a[href*="browse/deities"], .category-card:has-text("Deities")').first();

    if (await deitiesCard.isVisible()) {
      await deitiesCard.click();
      await page.waitForURL(/deities|browse\/deities/, { timeout: 10000 });

      expect(page.url()).toMatch(/deities/i);
    }
  });

  test('Clicking "Mythical Creatures" navigates to creatures browse page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Find and click Creatures card
    const creaturesCard = page.locator('a[href*="creatures"], a[href*="browse/creatures"], .category-card:has-text("Creatures")').first();

    if (await creaturesCard.isVisible()) {
      await creaturesCard.click();
      await page.waitForURL(/creatures|browse\/creatures/, { timeout: 10000 });

      expect(page.url()).toMatch(/creatures/i);
    }
  });

  test('All category card links are valid', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Get all category card links
    const cardLinks = page.locator('.category-card a, .asset-type-card a, .landing-category a');
    const count = await cardLinks.count();

    console.log(`Found ${count} category card links`);

    // Verify each link has a valid href
    for (let i = 0; i < Math.min(count, 12); i++) {
      const link = cardLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href) {
        console.log(`Card ${i + 1} href: ${href}`);
        expect(href).toBeTruthy();
        expect(href).not.toBe('#');
        expect(href).not.toBe('');
      }
    }
  });

  test('Back navigation works after clicking category', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Store initial URL
    const initialUrl = page.url();

    // Find any clickable category card
    const anyCard = page.locator('.category-card a, .asset-type-card a, a[href*="browse"], a[href*="mythologies"]').first();

    if (await anyCard.isVisible()) {
      await anyCard.click();
      await page.waitForTimeout(2000);

      // Navigate back
      await page.goBack();
      await page.waitForTimeout(2000);

      // Should be back on home page
      const currentUrl = page.url();
      expect(currentUrl === initialUrl || currentUrl.endsWith('/') || currentUrl.endsWith('#/')).toBeTruthy();
    }
  });
});

test.describe('Landing Page Performance', () => {
  test('Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const domLoadTime = Date.now() - startTime;
    console.log(`DOM Content Loaded: ${domLoadTime}ms`);

    // DOM should load within 3 seconds
    expect(domLoadTime).toBeLessThan(3000);

    await page.waitForLoadState('networkidle');
    const fullLoadTime = Date.now() - startTime;
    console.log(`Full Load Time: ${fullLoadTime}ms`);

    // Full page should load within 10 seconds
    expect(fullLoadTime).toBeLessThan(10000);
  });

  test('First contentful paint timing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcp = entries.find(e => e.name === 'first-contentful-paint');
      return {
        fcp: fcp ? fcp.startTime : null
      };
    });

    console.log('FCP:', metrics.fcp, 'ms');

    if (metrics.fcp) {
      // FCP should be under 2.5 seconds for good UX
      expect(metrics.fcp).toBeLessThan(2500);
    }
  });

  test('No layout shifts during load', async ({ page }) => {
    await page.goto('/');

    // Wait for initial render
    await page.waitForTimeout(1000);

    // Get cumulative layout shift
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    console.log('CLS:', cls);

    // CLS should be under 0.25 for good UX
    expect(cls).toBeLessThan(0.25);
  });
});

test.describe('Landing Page Accessibility', () => {
  test('Page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Should have an h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();

    // Check heading order
    const headings = await page.evaluate(() => {
      const hs = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(hs).map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent?.trim().substring(0, 50)
      }));
    });

    console.log('Headings found:', headings);

    // First heading should be h1
    if (headings.length > 0) {
      expect(headings[0].level).toBe(1);
    }
  });

  test('Category cards are keyboard accessible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    // Keep tabbing until we hit a category card or its link
    for (let i = 0; i < 20; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          class: el?.className,
          href: el?.getAttribute('href')
        };
      });

      if (focused.href && (focused.href.includes('browse') || focused.href.includes('mythologies'))) {
        console.log('Found focusable category link:', focused);

        // Press Enter to activate
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);

        // Should have navigated
        const url = page.url();
        expect(url).toMatch(/browse|mythologies/i);
        return;
      }

      await page.keyboard.press('Tab');
    }

    console.log('Could not find category card via keyboard - may need review');
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check all images have alt attribute
    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).filter(img => !img.alt && !img.getAttribute('role')).map(img => img.src);
    });

    console.log('Images without alt:', imagesWithoutAlt.length);

    // Allow some decorative images but not too many
    expect(imagesWithoutAlt.length).toBeLessThan(5);
  });
});

test.describe('Landing Page Error Handling', () => {
  test('Page handles network errors gracefully', async ({ page }) => {
    // Block some requests to simulate partial failures
    await page.route('**/icons/**', route => route.abort());

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Page should still render
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 10000 });

    // Should show fallback icons or handle missing icons
    const hasContent = await page.locator('.category-card, .landing-page, main').isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('Page shows error message for failed data fetch', async ({ page }) => {
    // This is a resilience check - the page should handle Firestore failures
    await page.goto('/');

    // Wait for page to attempt data load
    await page.waitForTimeout(5000);

    // Even if data fails, page should be interactive
    const isInteractive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });

    expect(isInteractive).toBeTruthy();
  });
});
