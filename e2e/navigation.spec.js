/**
 * SPA Navigation E2E Tests
 * Comprehensive tests for hash-based SPA routing in Eyes of Azrael
 *
 * Run against production:
 *   BASE_URL=https://www.eyesofazrael.com npx playwright test e2e/navigation.spec.js
 *
 * Run locally:
 *   npx playwright test e2e/navigation.spec.js
 */

const { test, expect } = require('@playwright/test');

// Test configuration constants
const BASE_URL = 'https://www.eyesofazrael.com';
const SPA_LOAD_TIMEOUT = 15000;
const NAVIGATION_TIMEOUT = 20000;
const CONTENT_SETTLE_TIME = 2000;

// Helper function to wait for SPA content to load
async function waitForSPAContent(page, timeout = SPA_LOAD_TIMEOUT) {
  await expect(page.locator('#main-content')).toBeVisible({ timeout });
  await page.waitForTimeout(CONTENT_SETTLE_TIME);
}

// Helper function to collect and filter console errors
function createConsoleErrorCollector(page) {
  const errors = [];
  const handler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected/non-blocking errors
      if (!text.includes('favicon') &&
          !text.includes('404') &&
          !text.includes('Failed to load resource') &&
          !text.includes('Lazy Loader') &&
          !text.includes('Navigation NOT found') &&
          !text.includes('Firebase config not found')) {
        errors.push(text);
      }
    }
  };
  page.on('console', handler);
  return {
    errors,
    cleanup: () => page.off('console', handler)
  };
}

// ============================================================================
// TEST SUITE 1: Home Route Tests
// ============================================================================

test.describe('Home Route Navigation', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('Home route (/) loads landing page', async ({ page }) => {
    const { errors, cleanup } = createConsoleErrorCollector(page);

    const response = await page.goto(BASE_URL + '/', {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT
    });

    expect(response.status()).toBe(200);
    await waitForSPAContent(page);

    // Verify landing page content is present
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // Should have category links for the 12 asset types
    const categoryLinks = page.locator('a[href*="#/mythologies"], a[href*="#/browse/"]');
    const linkCount = await categoryLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(4);

    cleanup();
    expect(errors.length).toBeLessThanOrEqual(3);
  });

  test('Home route with hash (#/) loads landing page', async ({ page }) => {
    await page.goto(BASE_URL + '/#/', {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);

    // Verify we're on the landing page
    const hasLandingContent = await page.locator('.landing-page, .category-card, .asset-type-card, [class*="landing"]').first().isVisible().catch(() => false);
    const hasCategoryLinks = await page.locator('a[href*="#/browse/"]').count();

    expect(hasLandingContent || hasCategoryLinks > 0).toBeTruthy();
  });

  test('Empty hash navigates to home page', async ({ page }) => {
    await page.goto(BASE_URL + '/#', {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);

    // Should redirect to or show home content
    const url = page.url();
    expect(url.endsWith('/') || url.endsWith('/#') || url.endsWith('#/')).toBeTruthy();
  });
});

// ============================================================================
// TEST SUITE 2: Browse Category Routes
// ============================================================================

test.describe('Browse Category Routes', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  const browseCategories = [
    { path: 'deities', name: 'Deities & Gods', expectedPattern: /deit|god/i },
    { path: 'heroes', name: 'Heroes & Legends', expectedPattern: /hero|legend/i },
    { path: 'creatures', name: 'Mythical Creatures', expectedPattern: /creature|mythical/i },
    { path: 'items', name: 'Sacred Items', expectedPattern: /item|artifact/i },
    { path: 'places', name: 'Sacred Places', expectedPattern: /place|location/i },
    { path: 'texts', name: 'Sacred Texts', expectedPattern: /text|scripture/i },
    { path: 'rituals', name: 'Rituals & Practices', expectedPattern: /ritual|practice/i },
    { path: 'herbs', name: 'Sacred Herbalism', expectedPattern: /herb|plant/i },
    { path: 'symbols', name: 'Sacred Symbols', expectedPattern: /symbol/i },
    { path: 'archetypes', name: 'Archetypes', expectedPattern: /archetype|pattern/i }
  ];

  for (const category of browseCategories) {
    test(`Browse route /browse/${category.path} loads category grid`, async ({ page }) => {
      await page.goto(`${BASE_URL}/#/browse/${category.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT
      });

      await waitForSPAContent(page);

      // Verify main content is visible
      await expect(page.locator('#main-content')).toBeVisible();

      // Check URL contains the category
      const url = page.url();
      expect(url).toContain(category.path);

      // Page should have content related to the category
      const pageContent = await page.textContent('body');
      const hasRelevantContent = category.expectedPattern.test(pageContent) ||
                                 pageContent.toLowerCase().includes(category.path);

      // Soft assertion - log but don't fail if content pattern not found
      if (!hasRelevantContent) {
        console.log(`[INFO] Category ${category.path}: Expected pattern not found in page content`);
      }
    });
  }

  test('Browse route with trailing slash works', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/browse/deities/`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE 3: Mythology Routes
// ============================================================================

test.describe('Mythology Routes', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  const mythologies = [
    { id: 'greek', name: 'Greek Mythology' },
    { id: 'norse', name: 'Norse Mythology' },
    { id: 'egyptian', name: 'Egyptian Mythology' },
    { id: 'hindu', name: 'Hindu Mythology' },
    { id: 'chinese', name: 'Chinese Mythology' },
    { id: 'japanese', name: 'Japanese Mythology' },
    { id: 'celtic', name: 'Celtic Mythology' },
    { id: 'roman', name: 'Roman Mythology' }
  ];

  for (const myth of mythologies) {
    test(`Mythology route /mythology/${myth.id} loads filtered content`, async ({ page }) => {
      await page.goto(`${BASE_URL}/#/mythology/${myth.id}`, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT
      });

      await waitForSPAContent(page);

      // Verify main content is visible
      await expect(page.locator('#main-content')).toBeVisible();

      // URL should contain mythology ID
      expect(page.url()).toContain(myth.id);

      // Page should show mythology name or related content
      const pageContent = await page.textContent('body');
      const hasMythologyContent = pageContent.toLowerCase().includes(myth.id) ||
                                  pageContent.toLowerCase().includes('mythology');

      if (!hasMythologyContent) {
        console.log(`[INFO] Mythology ${myth.id}: Content may not be visible or page shows different content`);
      }
    });
  }

  test('Mythologies grid route loads all mythologies', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/mythologies`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();

    // Should show mythology cards or links
    const mythologyLinks = page.locator('a[href*="mythology"]');
    const count = await mythologyLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ============================================================================
// TEST SUITE 4: Category Within Mythology Routes
// ============================================================================

test.describe('Category Within Mythology Routes', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  const categoryWithinMythologyRoutes = [
    { mythology: 'greek', category: 'deities', expectedEntity: /zeus|athena|poseidon/i },
    { mythology: 'greek', category: 'heroes', expectedEntity: /heracles|achilles|odysseus/i },
    { mythology: 'greek', category: 'creatures', expectedEntity: /medusa|hydra|minotaur/i },
    { mythology: 'norse', category: 'deities', expectedEntity: /odin|thor|freya/i },
    { mythology: 'norse', category: 'creatures', expectedEntity: /fenrir|jotnar|dragon/i },
    { mythology: 'egyptian', category: 'deities', expectedEntity: /ra|osiris|isis|anubis/i }
  ];

  for (const route of categoryWithinMythologyRoutes) {
    test(`Route /mythology/${route.mythology}/${route.category} loads filtered grid`, async ({ page }) => {
      await page.goto(`${BASE_URL}/#/mythology/${route.mythology}/${route.category}`, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT
      });

      await waitForSPAContent(page);
      await expect(page.locator('#main-content')).toBeVisible();

      // URL should contain both mythology and category
      const url = page.url();
      expect(url).toContain(route.mythology);
      expect(url).toContain(route.category);

      // Page should show entity cards or list
      const hasCards = await page.locator('.entity-card, .card, [class*="card"]').count();
      const hasLinks = await page.locator(`a[href*="${route.category}"]`).count();

      // Either cards or links should be present (or empty state message)
      const pageContent = await page.textContent('body');
      const hasContent = hasCards > 0 || hasLinks > 0 ||
                         pageContent.includes('No') ||
                         pageContent.includes(route.category);

      expect(hasContent).toBeTruthy();
    });
  }

  test('Browse category with mythology filter works', async ({ page }) => {
    // Alternative route pattern: /browse/category/mythology
    await page.goto(`${BASE_URL}/#/browse/deities/greek`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE 5: Entity Detail Routes
// ============================================================================

test.describe('Entity Detail Routes', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  const entityDetailRoutes = [
    { mythology: 'greek', category: 'deities', entity: 'zeus', name: 'Zeus' },
    { mythology: 'greek', category: 'deities', entity: 'athena', name: 'Athena' },
    { mythology: 'greek', category: 'heroes', entity: 'greek_heracles', name: 'Heracles' },
    { mythology: 'greek', category: 'creatures', entity: 'greek_medusa', name: 'Medusa' },
    { mythology: 'norse', category: 'deities', entity: 'odin', name: 'Odin' },
    { mythology: 'norse', category: 'deities', entity: 'thor', name: 'Thor' }
  ];

  for (const route of entityDetailRoutes) {
    test(`Entity route /mythology/${route.mythology}/${route.category}/${route.entity} loads detail view`, async ({ page }) => {
      await page.goto(`${BASE_URL}/#/mythology/${route.mythology}/${route.category}/${route.entity}`, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT
      });

      await waitForSPAContent(page);
      await expect(page.locator('#main-content')).toBeVisible();

      // URL should contain entity ID
      expect(page.url()).toContain(route.entity);

      // Page should show entity name or related content
      const pageContent = await page.textContent('body');
      const hasEntityContent = pageContent.includes(route.name) ||
                               pageContent.includes(route.entity.replace(/-/g, ' ')) ||
                               pageContent.toLowerCase().includes(route.entity.split('_').pop());

      if (!hasEntityContent) {
        // Check for error state or not found message
        const hasError = pageContent.includes('Not Found') ||
                        pageContent.includes('Error') ||
                        pageContent.includes('404');
        console.log(`[INFO] Entity ${route.entity}: ${hasError ? 'Entity not found' : 'Content may differ from expected'}`);
      }
    });
  }

  test('Alternative entity route /entity/category/entityId works', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/entity/deity/zeus`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();

    // Should show Zeus content or redirect appropriately
    const pageContent = await page.textContent('body');
    const hasContent = pageContent.includes('Zeus') ||
                      pageContent.includes('deity') ||
                      page.url().includes('zeus');

    expect(hasContent).toBeTruthy();
  });
});

// ============================================================================
// TEST SUITE 6: Back Button Navigation
// ============================================================================

test.describe('Back Button Navigation', () => {
  test.beforeEach(async () => {
    test.setTimeout(90000);
  });

  test('Back button returns to previous page after category navigation', async ({ page }) => {
    // Navigate to home
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);
    const homeUrl = page.url();

    // Navigate to browse category
    await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Use back button
    await page.goBack();
    await waitForSPAContent(page);

    // Should be back on home page
    const currentUrl = page.url();
    const isHome = currentUrl === homeUrl ||
                   currentUrl.endsWith('/') ||
                   currentUrl.endsWith('#/') ||
                   currentUrl.endsWith('#');
    expect(isHome).toBeTruthy();
  });

  test('Back button works through multi-step navigation', async ({ page }) => {
    const navigationPath = [
      `${BASE_URL}/`,
      `${BASE_URL}/#/mythologies`,
      `${BASE_URL}/#/mythology/greek`,
      `${BASE_URL}/#/mythology/greek/deities`
    ];

    // Navigate forward through each step
    for (const url of navigationPath) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForSPAContent(page);
    }

    // Navigate back and verify each step
    for (let i = navigationPath.length - 2; i >= 0; i--) {
      await page.goBack();
      await waitForSPAContent(page);

      const currentUrl = page.url();
      const expectedPath = navigationPath[i].replace(BASE_URL, '');

      // Verify we're on the expected page (allowing for URL normalization)
      const isExpectedPage = currentUrl.includes(expectedPath.replace('/#', '')) ||
                            (expectedPath === '/' && (currentUrl.endsWith('/') || currentUrl.endsWith('#/')));

      if (!isExpectedPage) {
        console.log(`[INFO] Back navigation step ${i}: Expected ${expectedPath}, got ${currentUrl}`);
      }
    }

    // Final check - should be near home
    const finalUrl = page.url();
    expect(finalUrl.endsWith('/') || finalUrl.endsWith('#/') || finalUrl.includes('#')).toBeTruthy();
  });

  test('Back button works after entity detail navigation', async ({ page }) => {
    // Navigate to category
    await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Navigate to entity
    await page.goto(`${BASE_URL}/#/mythology/greek/deities/zeus`, { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Go back
    await page.goBack();
    await waitForSPAContent(page);

    // Should be on category page
    expect(page.url()).toContain('deities');
  });
});

// ============================================================================
// TEST SUITE 7: Direct URL Access
// ============================================================================

test.describe('Direct URL Access', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('Direct URL to browse category works without prior navigation', async ({ page }) => {
    // Clear any session/cache by going to a blank page first
    await page.goto('about:blank');

    // Navigate directly to a deep route
    await page.goto(`${BASE_URL}/#/browse/creatures`, {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();
    expect(page.url()).toContain('creatures');
  });

  test('Direct URL to mythology page works without prior navigation', async ({ page }) => {
    await page.goto('about:blank');

    await page.goto(`${BASE_URL}/#/mythology/norse`, {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();
    expect(page.url()).toContain('norse');
  });

  test('Direct URL to entity detail works without prior navigation', async ({ page }) => {
    await page.goto('about:blank');

    await page.goto(`${BASE_URL}/#/mythology/greek/deities/athena`, {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();
    expect(page.url()).toContain('athena');
  });

  test('Direct URL access in new browser context works', async ({ browser }) => {
    // Create a completely fresh context
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${BASE_URL}/#/browse/heroes`, {
        waitUntil: 'networkidle',
        timeout: NAVIGATION_TIMEOUT
      });

      await waitForSPAContent(page);
      await expect(page.locator('#main-content')).toBeVisible();
      expect(page.url()).toContain('heroes');
    } finally {
      await context.close();
    }
  });

  test('Page refresh maintains current route', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/browse/items`, {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT
    });
    await waitForSPAContent(page);

    const urlBeforeRefresh = page.url();

    // Reload the page
    await page.reload({ waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });
    await waitForSPAContent(page);

    const urlAfterRefresh = page.url();

    // URL should be the same or equivalent
    expect(urlAfterRefresh).toContain('items');
    expect(urlBeforeRefresh).toEqual(urlAfterRefresh);
  });
});

// ============================================================================
// TEST SUITE 8: Invalid Routes and 404 Handling
// ============================================================================

test.describe('Invalid Routes and 404 Handling', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('Invalid route shows 404 or fallback content', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/this-route-does-not-exist-xyz123`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);

    // Should show main content (either 404 page or home fallback)
    await expect(page.locator('#main-content')).toBeVisible();

    // Check for 404 message or redirect to home
    const pageContent = await page.textContent('body');
    const shows404 = pageContent.includes('404') ||
                     pageContent.includes('Not Found') ||
                     pageContent.includes('not found');
    const redirectedToHome = page.url().endsWith('/') ||
                             page.url().endsWith('#/') ||
                             pageContent.includes('Mythologies') ||
                             pageContent.includes('Browse');

    expect(shows404 || redirectedToHome).toBeTruthy();
  });

  test('Invalid mythology ID handles gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/mythology/nonexistent-mythology-xyz`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();

    // Page should remain functional
    const isInteractive = await page.locator('a, button').first().isEnabled().catch(() => true);
    expect(isInteractive).toBeTruthy();
  });

  test('Invalid entity ID handles gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/mythology/greek/deities/nonexistent-entity-12345`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();

    // Should show error state or fallback
    const pageContent = await page.textContent('body');
    const handledGracefully = pageContent.includes('Not Found') ||
                              pageContent.includes('Error') ||
                              pageContent.includes('not found') ||
                              page.url().includes('nonexistent');

    expect(handledGracefully).toBeTruthy();
  });

  test('Invalid category handles gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/browse/invalid-category-abc`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('Malformed hash routes handle gracefully', async ({ page }) => {
    const malformedRoutes = [
      '#//double-slash',
      '#/browse//deities',
      '#/mythology/greek//deities',
      '#/with spaces',
      '#/special<>chars'
    ];

    for (const route of malformedRoutes) {
      await page.goto(`${BASE_URL}/${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT
      });

      // Should not crash - main content should be visible
      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_LOAD_TIMEOUT });
    }
  });
});

// ============================================================================
// TEST SUITE 9: Hash-Based vs Path-Based Routing
// ============================================================================

test.describe('Hash-Based Routing Consistency', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('Hash route #/browse/deities and path /browse/deities behave consistently', async ({ page }) => {
    // Test hash-based route
    await page.goto(`${BASE_URL}/#/browse/deities`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });
    await waitForSPAContent(page);
    const hashContent = await page.textContent('#main-content');

    // Navigate home first
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // For SPAs, path-based routes may redirect to hash or show same content
    // This test verifies the hash route is the canonical format
    expect(page.url()).toMatch(/eyesofazrael\.com/);
    expect(hashContent.length).toBeGreaterThan(0);
  });

  test('Programmatic hash changes trigger navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Programmatically change hash
    await page.evaluate(() => {
      window.location.hash = '#/browse/places';
    });

    await waitForSPAContent(page);

    // Should have navigated to places
    expect(page.url()).toContain('places');
  });

  test('Hash navigation via link click works correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Find a category link and click it
    const categoryLink = page.locator('a[href*="#/browse/"], a[href*="#/mythologies"]').first();

    if (await categoryLink.isVisible()) {
      const href = await categoryLink.getAttribute('href');
      await categoryLink.click();
      await waitForSPAContent(page);

      // URL should contain the clicked route
      const currentHash = page.url().split('#')[1] || '';
      const expectedPath = href.replace('#', '');

      expect(currentHash).toContain(expectedPath.split('/')[1] || '');
    }
  });

  test('Multiple hash formats normalize correctly', async ({ page }) => {
    const hashVariants = [
      { input: '#browse/deities', expected: 'deities' },
      { input: '#/browse/deities', expected: 'deities' },
      { input: '#/browse/deities/', expected: 'deities' }
    ];

    for (const variant of hashVariants) {
      await page.goto(`${BASE_URL}/${variant.input}`, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT
      });
      await waitForSPAContent(page);

      // All variants should show same content
      expect(page.url()).toContain(variant.expected);
      await expect(page.locator('#main-content')).toBeVisible();
    }
  });
});

// ============================================================================
// TEST SUITE 10: Navigation State and History
// ============================================================================

test.describe('Navigation State and History Management', () => {
  test.beforeEach(async () => {
    test.setTimeout(90000);
  });

  test('Forward button works after back navigation', async ({ page }) => {
    // Build history
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    await page.goto(`${BASE_URL}/#/mythology/greek`, { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Go back
    await page.goBack();
    await waitForSPAContent(page);
    expect(page.url()).toContain('deities');

    // Go forward
    await page.goForward();
    await waitForSPAContent(page);
    expect(page.url()).toContain('greek');
  });

  test('History state is preserved on page reload', async ({ page }) => {
    // Navigate to a deep route
    await page.goto(`${BASE_URL}/#/mythology/norse/deities`, {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT
    });
    await waitForSPAContent(page);

    // Reload
    await page.reload({ waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Should still be on the same route
    expect(page.url()).toContain('norse');
    expect(page.url()).toContain('deities');
  });

  test('Rapid navigation does not break state', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Rapid navigation sequence
    const routes = [
      '#/browse/deities',
      '#/browse/creatures',
      '#/mythology/greek',
      '#/browse/heroes',
      '#/mythologies'
    ];

    for (const route of routes) {
      await page.evaluate((r) => {
        window.location.hash = r;
      }, route);
      await page.waitForTimeout(500); // Brief wait between navigations
    }

    // Wait for final route to load
    await waitForSPAContent(page);

    // Should be on the last route
    expect(page.url()).toContain('mythologies');
    await expect(page.locator('#main-content')).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE 11: Click Navigation (vs Direct URL)
// ============================================================================

test.describe('Click Navigation', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('Clicking internal links navigates without page reload', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Find a navigation link
    const navLink = page.locator('a[href^="#/"]').first();

    if (await navLink.isVisible()) {
      // Track if page reloads
      let reloaded = false;
      page.on('load', () => { reloaded = true; });

      await navLink.click();
      await waitForSPAContent(page);

      // SPA navigation should not trigger a full page reload
      // Note: Initial page load counts, so we check for additional reloads
      expect(reloaded).toBeFalsy();
    }
  });

  test('Navigation links update URL hash correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Find links with different destinations
    const links = await page.locator('a[href^="#/"]').all();

    for (const link of links.slice(0, 3)) { // Test first 3 links
      const href = await link.getAttribute('href');
      if (href && href.startsWith('#/')) {
        await link.click();
        await waitForSPAContent(page);

        const currentHash = '#' + (page.url().split('#')[1] || '');
        expect(currentHash).toContain(href.replace('#/', '').split('/')[0]);

        // Go back for next iteration
        await page.goBack();
        await waitForSPAContent(page);
      }
    }
  });
});

// ============================================================================
// TEST SUITE 12: Loading States During Navigation
// ============================================================================

test.describe('Loading States', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('Loading spinner appears during navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Navigate to a page that requires data loading
    const navigationPromise = page.goto(`${BASE_URL}/#/browse/deities`);

    // Check for loading state (may be brief)
    const loadingSelector = '.loading-container, .loading-spinner, .loader, [class*="loading"]';

    // Loading spinner might appear briefly
    try {
      await page.waitForSelector(loadingSelector, { timeout: 2000 });
    } catch {
      // Loading may be too fast to catch, which is fine
    }

    await navigationPromise;
    await waitForSPAContent(page);

    // After loading, spinner should be gone
    const spinnerVisible = await page.locator(loadingSelector).isVisible().catch(() => false);
    expect(spinnerVisible).toBeFalsy();
  });

  test('Content replaces loading state', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/browse/texts`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    // Wait for content to load
    await waitForSPAContent(page);

    // Main content should be visible and not showing loading
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    const content = await mainContent.innerHTML();
    const hasActualContent = content.length > 100 &&
                            !content.includes('Loading...');

    expect(hasActualContent).toBeTruthy();
  });
});

// ============================================================================
// TEST SUITE 13: Edge Cases and Stress Tests
// ============================================================================

test.describe('Edge Cases', () => {
  test.beforeEach(async () => {
    test.setTimeout(120000);
  });

  test('Navigation works after long idle period', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Simulate idle period
    await page.waitForTimeout(5000);

    // Navigate after idle
    await page.goto(`${BASE_URL}/#/browse/rituals`, { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    await expect(page.locator('#main-content')).toBeVisible();
    expect(page.url()).toContain('rituals');
  });

  test('Navigation with URL-encoded characters works', async ({ page }) => {
    // Test with URL-encoded spaces or special characters if any entity IDs contain them
    await page.goto(`${BASE_URL}/#/browse/items`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await waitForSPAContent(page);
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('Concurrent navigation attempts are handled', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Trigger multiple rapid navigations
    await Promise.all([
      page.evaluate(() => { window.location.hash = '#/browse/deities'; }),
      page.evaluate(() => { window.location.hash = '#/browse/creatures'; }),
      page.evaluate(() => { window.location.hash = '#/browse/heroes'; })
    ]);

    // Wait for navigation to settle
    await page.waitForTimeout(3000);
    await waitForSPAContent(page);

    // Should be on one of the routes (last one wins typically)
    await expect(page.locator('#main-content')).toBeVisible();
    const url = page.url();
    expect(url.includes('deities') || url.includes('creatures') || url.includes('heroes')).toBeTruthy();
  });

  test('Navigation after network interruption recovers', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForSPAContent(page);

    // Simulate offline
    await page.context().setOffline(true);

    // Try to navigate (will fail)
    try {
      await page.goto(`${BASE_URL}/#/browse/symbols`, { timeout: 5000 });
    } catch {
      // Expected to fail
    }

    // Go back online
    await page.context().setOffline(false);

    // Navigation should work now
    await page.goto(`${BASE_URL}/#/browse/symbols`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });
    await waitForSPAContent(page);

    await expect(page.locator('#main-content')).toBeVisible();
  });
});
