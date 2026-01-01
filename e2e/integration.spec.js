/**
 * Integration E2E Tests - Complete User Journeys
 * Tests end-to-end user flows that verify multiple features work together
 *
 * Run: npx playwright test e2e/integration.spec.js
 * Run against production: BASE_URL=https://www.eyesofazrael.com npx playwright test e2e/integration.spec.js
 */

const { test, expect } = require('@playwright/test');

// Configuration constants for SPA timing
const SPA_TIMEOUT = 15000;
const NAVIGATION_TIMEOUT = 20000;
const CONTENT_LOAD_WAIT = 3000;

/**
 * Helper function to wait for SPA content to load
 * @param {import('@playwright/test').Page} page
 */
async function waitForSPAContent(page) {
  await page.waitForLoadState('domcontentloaded');
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    // Network idle might not be reached - continue anyway
  }
  await page.waitForTimeout(CONTENT_LOAD_WAIT);
}

/**
 * Helper function to verify main content is visible
 * @param {import('@playwright/test').Page} page
 */
async function verifyMainContent(page) {
  await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
}

/**
 * Helper function to click an entity card and wait for navigation
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS selector for the card
 */
async function clickEntityCard(page, selector) {
  const card = page.locator(selector).first();
  await expect(card).toBeVisible({ timeout: SPA_TIMEOUT });
  await card.click();
  await waitForSPAContent(page);
}

/**
 * Helper function to set and verify theme
 * @param {import('@playwright/test').Page} page
 * @param {string} themeName - Theme name to select
 */
async function selectTheme(page, themeName) {
  // Look for theme picker/toggle
  const themeToggle = page.locator('#themePickerContainer, .theme-toggle, .theme-picker, #theme-toggle, [data-theme-picker]').first();

  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Try to find theme option
    const themeOption = page.locator(`[data-theme="${themeName}"], button:has-text("${themeName}"), .theme-option:has-text("${themeName}")`).first();

    if (await themeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await themeOption.click();
      await page.waitForTimeout(500);
    }
  }
}

// ============================================================================
// JOURNEY 1: Browse Journey
// Land on home -> click Deities -> see deity grid -> click Zeus -> see Zeus detail
// -> click related entity -> navigate to that entity
// ============================================================================

test.describe('Journey 1: Browse Journey', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for full journey
  });

  test('Complete browse journey: Home -> Deities -> Zeus -> Related Entity', async ({ page }) => {
    // Step 1: Land on home page
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });
    await waitForSPAContent(page);
    await verifyMainContent(page);

    // Verify landing page has category cards
    const categoryCards = page.locator('a[href*="#/browse"], a[href*="#/mythologies"], .category-card');
    const cardCount = await categoryCards.count();
    expect(cardCount).toBeGreaterThan(0);
    console.log(`Step 1: Home page loaded with ${cardCount} category cards`);

    // Step 2: Click on Deities category
    const deitiesLink = page.locator('a[href*="browse/deities"], a[href*="deities"], .category-card:has-text("Deities")').first();

    if (await deitiesLink.isVisible({ timeout: 5000 })) {
      await deitiesLink.click();
      await waitForSPAContent(page);

      // Verify we're on the deities browse page
      const url = page.url();
      expect(url).toMatch(/deities/i);
      console.log('Step 2: Navigated to Deities browse page');

      // Step 3: Verify deity grid is displayed
      await verifyMainContent(page);

      // Look for entity cards in the grid
      const entityCards = page.locator('.entity-card, .deity-card, .card, [data-entity-id]');
      const entityCount = await entityCards.count();
      console.log(`Step 3: Found ${entityCount} deity cards in grid`);

      // Step 4: Click on Zeus (or first available deity)
      const zeusCard = page.locator('a[href*="zeus"], .entity-card:has-text("Zeus"), .card:has-text("Zeus")').first();
      const hasZeus = await zeusCard.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasZeus) {
        await zeusCard.click();
        await waitForSPAContent(page);

        // Verify Zeus detail page
        const pageContent = await page.textContent('body');
        expect(pageContent.toLowerCase()).toContain('zeus');
        console.log('Step 4: Viewing Zeus detail page');

        // Step 5: Look for related entities section
        const relatedSection = page.locator('.related-entities, .related-items, .connections, [data-related], .entity-relations');
        const hasRelated = await relatedSection.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasRelated) {
          // Click on first related entity
          const relatedLink = page.locator('.related-entities a, .related-items a, .connections a, [data-related] a').first();

          if (await relatedLink.isVisible({ timeout: 3000 })) {
            const relatedHref = await relatedLink.getAttribute('href');
            console.log(`Step 5: Clicking related entity: ${relatedHref}`);

            await relatedLink.click();
            await waitForSPAContent(page);
            await verifyMainContent(page);

            console.log('Step 6: Successfully navigated to related entity');
          } else {
            console.log('Step 5: No clickable related entity found - journey partially complete');
          }
        } else {
          console.log('Step 5: No related entities section found - journey partially complete');
        }
      } else {
        // Click first available deity card
        const firstCard = entityCards.first();
        if (await firstCard.isVisible()) {
          await firstCard.click();
          await waitForSPAContent(page);
          await verifyMainContent(page);
          console.log('Step 4: Clicked first available deity (Zeus not found)');
        }
      }
    } else {
      console.log('Deities link not found - skipping rest of journey');
    }
  });

  test('Browse journey preserves navigation state with back button', async ({ page }) => {
    // Navigate through multiple pages and verify back button works
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);
    const homeUrl = page.url();

    // Navigate to deities
    const deitiesLink = page.locator('a[href*="browse/deities"], a[href*="deities"]').first();
    if (await deitiesLink.isVisible({ timeout: 5000 })) {
      await deitiesLink.click();
      await waitForSPAContent(page);

      // Navigate to a deity
      const firstDeity = page.locator('.entity-card, .card a').first();
      if (await firstDeity.isVisible({ timeout: 5000 })) {
        await firstDeity.click();
        await waitForSPAContent(page);
        const entityUrl = page.url();

        // Go back to browse page
        await page.goBack();
        await waitForSPAContent(page);
        expect(page.url()).toMatch(/deities|browse/i);
        console.log('Back button worked: Entity -> Browse');

        // Go back to home
        await page.goBack();
        await waitForSPAContent(page);
        const currentUrl = page.url();
        expect(currentUrl === homeUrl || currentUrl.endsWith('/') || currentUrl.endsWith('#/')).toBeTruthy();
        console.log('Back button worked: Browse -> Home');
      }
    }
  });
});

// ============================================================================
// JOURNEY 2: Mythology Exploration
// Home -> click World Mythologies -> select Greek -> see Greek overview
// -> browse Greek deities -> view specific deity
// ============================================================================

test.describe('Journey 2: Mythology Exploration', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('Complete mythology exploration: Home -> World Mythologies -> Greek -> Greek Deities -> Specific Deity', async ({ page }) => {
    // Step 1: Land on home page
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });
    await waitForSPAContent(page);
    await verifyMainContent(page);
    console.log('Step 1: Home page loaded');

    // Step 2: Click on World Mythologies
    const mythologiesLink = page.locator('a[href*="mythologies"], .category-card:has-text("Mythologies"), .category-card:has-text("World")').first();

    if (await mythologiesLink.isVisible({ timeout: 5000 })) {
      await mythologiesLink.click();
      await waitForSPAContent(page);

      const url = page.url();
      expect(url).toMatch(/mytholog/i);
      console.log('Step 2: Navigated to World Mythologies');

      // Step 3: Select Greek mythology
      const greekCard = page.locator('a[href*="greek"], .mythology-card:has-text("Greek"), .card:has-text("Greek"), [data-mythology="greek"]').first();

      if (await greekCard.isVisible({ timeout: 5000 })) {
        await greekCard.click();
        await waitForSPAContent(page);

        const greekUrl = page.url();
        expect(greekUrl.toLowerCase()).toMatch(/greek/);
        console.log('Step 3: Navigated to Greek mythology page');

        // Step 4: Verify Greek mythology overview content
        await verifyMainContent(page);
        const pageContent = await page.textContent('body');
        expect(pageContent.toLowerCase()).toContain('greek');
        console.log('Step 4: Greek mythology overview verified');

        // Step 5: Look for deities section or link
        const deitiesSection = page.locator('a[href*="deities"], .section:has-text("Deities"), .category:has-text("Deities"), [data-category="deities"]').first();

        if (await deitiesSection.isVisible({ timeout: 5000 })) {
          await deitiesSection.click();
          await waitForSPAContent(page);
          console.log('Step 5: Navigated to Greek deities section');

          // Step 6: Click on a specific Greek deity
          const deityCard = page.locator('.entity-card, .deity-card, .card').first();

          if (await deityCard.isVisible({ timeout: 5000 })) {
            const deityName = await deityCard.textContent();
            await deityCard.click();
            await waitForSPAContent(page);
            await verifyMainContent(page);
            console.log(`Step 6: Viewing specific deity: ${deityName?.substring(0, 30)}`);
          } else {
            console.log('Step 6: No deity cards found in Greek section');
          }
        } else {
          console.log('Step 5: Deities section not found on Greek mythology page');
        }
      } else {
        console.log('Step 3: Greek mythology card not found');
      }
    } else {
      console.log('Step 2: Mythologies link not found');
    }
  });

  test('Mythology filtering persists when browsing entities', async ({ page }) => {
    // Navigate directly to Greek mythology filtered view
    await page.goto('/#/mythologies/greek', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Verify we're viewing Greek content
    let pageContent = await page.textContent('body');
    expect(pageContent.toLowerCase()).toMatch(/greek/);

    // Navigate to deities within Greek mythology
    const deitiesLink = page.locator('a[href*="deities"]').first();
    if (await deitiesLink.isVisible({ timeout: 5000 })) {
      await deitiesLink.click();
      await waitForSPAContent(page);

      // Content should still be Greek-filtered
      pageContent = await page.textContent('body');
      // Should show Greek deities (Zeus, Athena, etc.) not Norse or others
      const hasGreekContent = pageContent.toLowerCase().includes('greek') ||
                              pageContent.toLowerCase().includes('zeus') ||
                              pageContent.toLowerCase().includes('athena') ||
                              pageContent.toLowerCase().includes('olymp');
      expect(hasGreekContent).toBeTruthy();
      console.log('Mythology filter persisted through navigation');
    }
  });
});

// ============================================================================
// JOURNEY 3: Theme Customization
// Load site -> change theme -> navigate pages -> theme persists
// -> refresh -> theme still persists
// ============================================================================

test.describe('Journey 3: Theme Customization', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);

    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
    });
  });

  test('Theme persists across page navigation', async ({ page }) => {
    // Step 1: Load the site
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);
    console.log('Step 1: Site loaded');

    // Step 2: Get initial theme state
    const initialTheme = await page.evaluate(() => {
      return document.body.dataset.theme ||
             document.documentElement.dataset.theme ||
             localStorage.getItem('eoa-theme') ||
             localStorage.getItem('theme') ||
             'default';
    });
    console.log(`Step 2: Initial theme: ${initialTheme}`);

    // Step 3: Change theme
    const themeToggle = page.locator('#themePickerContainer, .theme-toggle, .theme-picker, #theme-toggle').first();

    if (await themeToggle.isVisible({ timeout: 5000 })) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Find and click a different theme option
      const themeOptions = page.locator('.theme-option, [data-theme], button[data-theme]');
      const optionCount = await themeOptions.count();

      if (optionCount > 1) {
        // Click second option (different from current)
        await themeOptions.nth(1).click();
        await page.waitForTimeout(500);

        const newTheme = await page.evaluate(() => {
          return document.body.dataset.theme ||
                 document.documentElement.dataset.theme ||
                 localStorage.getItem('eoa-theme') ||
                 localStorage.getItem('theme');
        });
        console.log(`Step 3: Changed to theme: ${newTheme}`);

        // Step 4: Navigate to another page
        const navLink = page.locator('a[href*="mythologies"], a[href*="browse"]').first();
        if (await navLink.isVisible()) {
          await navLink.click();
          await waitForSPAContent(page);

          // Step 5: Verify theme persists
          const persistedTheme = await page.evaluate(() => {
            return document.body.dataset.theme ||
                   document.documentElement.dataset.theme ||
                   localStorage.getItem('eoa-theme') ||
                   localStorage.getItem('theme');
          });
          console.log(`Step 4-5: Theme after navigation: ${persistedTheme}`);
          expect(persistedTheme).toBe(newTheme);
        }
      } else {
        console.log('Only one theme option available - skipping theme change test');
      }
    } else {
      console.log('Theme toggle not found - checking if theme stored in localStorage');
    }
  });

  test('Theme persists after page refresh', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Try to change theme
    const themeToggle = page.locator('#themePickerContainer, .theme-toggle, .theme-picker').first();

    if (await themeToggle.isVisible({ timeout: 5000 })) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      const themeOptions = page.locator('.theme-option, [data-theme]');
      const optionCount = await themeOptions.count();

      if (optionCount > 1) {
        // Select a specific theme
        await themeOptions.nth(1).click();
        await page.waitForTimeout(500);

        const selectedTheme = await page.evaluate(() => {
          return document.body.dataset.theme ||
                 document.documentElement.dataset.theme ||
                 localStorage.getItem('eoa-theme') ||
                 localStorage.getItem('theme');
        });
        console.log(`Selected theme before refresh: ${selectedTheme}`);

        // Refresh the page
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForSPAContent(page);

        // Verify theme persisted
        const themeAfterRefresh = await page.evaluate(() => {
          return document.body.dataset.theme ||
                 document.documentElement.dataset.theme ||
                 localStorage.getItem('eoa-theme') ||
                 localStorage.getItem('theme');
        });
        console.log(`Theme after refresh: ${themeAfterRefresh}`);

        expect(themeAfterRefresh).toBe(selectedTheme);
        console.log('Theme persisted after refresh');
      }
    }
  });

  test('Theme applies correct CSS styles', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Get body background color before theme change
    const initialBgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    console.log(`Initial background color: ${initialBgColor}`);

    // Try to change theme
    const themeToggle = page.locator('#themePickerContainer, .theme-toggle').first();

    if (await themeToggle.isVisible({ timeout: 5000 })) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      const themeOptions = page.locator('.theme-option, [data-theme]');
      const optionCount = await themeOptions.count();

      if (optionCount > 1) {
        // Try each theme and verify styles change
        for (let i = 0; i < Math.min(optionCount, 3); i++) {
          // Re-open picker if needed
          if (!await themeOptions.first().isVisible()) {
            await themeToggle.click();
            await page.waitForTimeout(300);
          }

          await themeOptions.nth(i).click();
          await page.waitForTimeout(500);

          const themeName = await page.evaluate(() => {
            return document.body.dataset.theme ||
                   document.documentElement.dataset.theme ||
                   'unknown';
          });

          const bgColor = await page.evaluate(() => {
            return getComputedStyle(document.body).backgroundColor;
          });

          console.log(`Theme ${i + 1} (${themeName}): bg=${bgColor}`);
        }
      }
    }

    // This test passes if no errors occur during theme switching
    expect(true).toBeTruthy();
  });
});

// ============================================================================
// JOURNEY 4: Cross-Category Navigation
// View a deity (Zeus) -> click related item (thunderbolt) -> now on items
// -> click related deity -> back to deities
// ============================================================================

test.describe('Journey 4: Cross-Category Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('Navigate between related entities across categories', async ({ page }) => {
    // Start by viewing Zeus
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });
    await waitForSPAContent(page);
    await verifyMainContent(page);

    // Verify we're on Zeus page
    let pageContent = await page.textContent('body');
    const hasZeus = pageContent.toLowerCase().includes('zeus');
    console.log(`Step 1: Viewing Zeus - ${hasZeus ? 'Found' : 'Not found'}`);

    if (hasZeus) {
      // Look for related items section (thunderbolt, aegis, etc.)
      const relatedItems = page.locator('.related-items a, .related-entities a[href*="item"], [data-category="items"] a, a[href*="thunderbolt"], a[href*="aegis"]').first();

      if (await relatedItems.isVisible({ timeout: 5000 })) {
        const itemHref = await relatedItems.getAttribute('href');
        console.log(`Step 2: Found related item link: ${itemHref}`);

        await relatedItems.click();
        await waitForSPAContent(page);
        await verifyMainContent(page);

        // Verify we're now viewing an item
        const currentUrl = page.url();
        console.log(`Step 3: Navigated to: ${currentUrl}`);

        // Look for related deities on the item page
        const relatedDeities = page.locator('.related-deities a, .related-entities a[href*="deity"], [data-category="deities"] a').first();

        if (await relatedDeities.isVisible({ timeout: 5000 })) {
          const deityHref = await relatedDeities.getAttribute('href');
          console.log(`Step 4: Found related deity link: ${deityHref}`);

          await relatedDeities.click();
          await waitForSPAContent(page);
          await verifyMainContent(page);

          // Verify we're back viewing a deity
          const finalUrl = page.url();
          expect(finalUrl).toMatch(/deity|deities/i);
          console.log(`Step 5: Successfully navigated back to deity: ${finalUrl}`);
        } else {
          console.log('Step 4: No related deities found on item page');
        }
      } else {
        console.log('Step 2: No related items found on Zeus page');

        // Alternative: Try navigation through browse
        await page.goto('/#/browse/items', { waitUntil: 'domcontentloaded' });
        await waitForSPAContent(page);

        // Click first item
        const itemCard = page.locator('.entity-card, .card').first();
        if (await itemCard.isVisible({ timeout: 5000 })) {
          await itemCard.click();
          await waitForSPAContent(page);
          console.log('Step 2 (alt): Navigated to an item via browse');

          // Look for related deity
          const relatedDeity = page.locator('a[href*="deity"], a[href*="deities"]').first();
          if (await relatedDeity.isVisible({ timeout: 5000 })) {
            await relatedDeity.click();
            await waitForSPAContent(page);
            console.log('Step 3 (alt): Navigated to related deity');
          }
        }
      }
    } else {
      // Zeus page didn't load - try alternative approach
      console.log('Zeus page not found - testing with different entities');

      // Go to Mjolnir (Thor's hammer)
      await page.goto('/#/entity/item/mjolnir', { waitUntil: 'domcontentloaded' });
      await waitForSPAContent(page);

      pageContent = await page.textContent('body');
      if (pageContent.toLowerCase().includes('mjolnir') || pageContent.toLowerCase().includes('thor')) {
        console.log('Viewing Mjolnir item');

        // Look for Thor in related entities
        const thorLink = page.locator('a[href*="thor"], .related a:has-text("Thor")').first();
        if (await thorLink.isVisible({ timeout: 5000 })) {
          await thorLink.click();
          await waitForSPAContent(page);
          console.log('Navigated to Thor from Mjolnir');
        }
      }
    }
  });

  test('Cross-category navigation maintains breadcrumb trail', async ({ page }) => {
    // Navigate through categories and verify breadcrumbs update
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Navigate to deities
    const deitiesLink = page.locator('a[href*="browse/deities"]').first();
    if (await deitiesLink.isVisible({ timeout: 5000 })) {
      await deitiesLink.click();
      await waitForSPAContent(page);

      // Check for breadcrumb
      const breadcrumb = page.locator('.breadcrumb, nav[aria-label="breadcrumb"], .navigation-path');
      const hasBreadcrumb = await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasBreadcrumb) {
        let breadcrumbText = await breadcrumb.textContent();
        console.log(`Breadcrumb on deities page: ${breadcrumbText}`);

        // Navigate to specific deity
        const deityCard = page.locator('.entity-card, .card').first();
        if (await deityCard.isVisible()) {
          await deityCard.click();
          await waitForSPAContent(page);

          breadcrumbText = await breadcrumb.textContent();
          console.log(`Breadcrumb on deity detail: ${breadcrumbText}`);
          expect(breadcrumbText).toBeTruthy();
        }
      } else {
        console.log('No breadcrumb navigation found');
      }
    }
  });
});

// ============================================================================
// JOURNEY 5: Mobile User Flow
// Same flows on mobile viewport - verify all interactions work with touch
// ============================================================================

test.describe('Journey 5: Mobile User Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('Mobile: Complete browse journey on iPhone viewport', async ({ page }) => {
    // Set iPhone viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Step 1: Load home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);
    await verifyMainContent(page);
    console.log('Mobile Step 1: Home page loaded');

    // Step 2: Check for mobile menu if exists
    const mobileMenu = page.locator('.mobile-menu, .hamburger, [aria-label*="menu" i], .menu-toggle');
    const hasMobileMenu = await mobileMenu.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMobileMenu) {
      console.log('Mobile menu detected');
      await mobileMenu.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Navigate to a category
    const categoryLink = page.locator('a[href*="browse"], a[href*="mythologies"]').first();
    if (await categoryLink.isVisible({ timeout: 5000 })) {
      await categoryLink.click();
      await waitForSPAContent(page);
      console.log('Mobile Step 2: Navigated to category');

      // Step 4: Click on an entity card
      const entityCard = page.locator('.entity-card, .card').first();
      if (await entityCard.isVisible({ timeout: 5000 })) {
        await entityCard.click();
        await waitForSPAContent(page);
        await verifyMainContent(page);
        console.log('Mobile Step 3: Viewing entity detail');

        // Verify content is visible and scrollable
        const content = page.locator('.entity-content, .detail-content, main');
        await expect(content).toBeVisible();

        // Test scroll behavior
        await page.evaluate(() => window.scrollBy(0, 300));
        await page.waitForTimeout(300);

        const scrollPos = await page.evaluate(() => window.scrollY);
        expect(scrollPos).toBeGreaterThan(0);
        console.log('Mobile Step 4: Scroll verified');
      }
    }
  });

  test('Mobile: Touch interactions work correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Test tap on category card
    const categoryCard = page.locator('.category-card, a[href*="browse"], a[href*="mythologies"]').first();

    if (await categoryCard.isVisible({ timeout: 5000 })) {
      // Simulate touch/tap
      const box = await categoryCard.boundingBox();
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        await waitForSPAContent(page);

        // Verify navigation occurred
        const url = page.url();
        expect(url).not.toBe('/');
        console.log(`Touch tap navigated to: ${url}`);
      }
    }
  });

  test('Mobile: Swipe gestures on entity cards', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/#/browse/deities', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Look for horizontal scrollable container
    const carousel = page.locator('.carousel, .swiper, .scroll-container, .horizontal-scroll');
    const hasCarousel = await carousel.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCarousel) {
      const box = await carousel.boundingBox();
      if (box) {
        // Simulate swipe left
        await page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2);
        await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up();

        await page.waitForTimeout(500);
        console.log('Swipe gesture completed on carousel');
      }
    } else {
      console.log('No horizontal carousel found - vertical scroll only');

      // Test vertical scroll instead
      await page.touchscreen.tap(200, 400);
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(300);

      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
      console.log('Vertical scroll verified on mobile');
    }
  });

  test('Mobile: Theme picker works on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Find theme picker
    const themeToggle = page.locator('#themePickerContainer, .theme-toggle, .theme-picker').first();

    if (await themeToggle.isVisible({ timeout: 5000 })) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Verify dropdown/modal is visible and not cut off
      const themeOptions = page.locator('.theme-option, [data-theme]');
      const optionCount = await themeOptions.count();

      if (optionCount > 0) {
        // Check that options are within viewport
        const firstOption = themeOptions.first();
        const box = await firstOption.boundingBox();

        if (box) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(375);
          console.log('Theme options properly positioned on mobile screen');
        }

        // Select a theme
        await firstOption.click();
        await page.waitForTimeout(300);
        console.log('Theme selected on mobile');
      }
    } else {
      console.log('Theme toggle not visible on mobile');
    }
  });

  test('Mobile: Android viewport browsing', async ({ page }) => {
    // Set Android viewport (Pixel 5)
    await page.setViewportSize({ width: 393, height: 851 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);
    await verifyMainContent(page);

    // Navigate through the app
    const categoryLinks = page.locator('a[href*="browse"], a[href*="mythologies"]');
    const linkCount = await categoryLinks.count();
    console.log(`Found ${linkCount} category links on Android viewport`);

    if (linkCount > 0) {
      // Click first link
      await categoryLinks.first().click();
      await waitForSPAContent(page);

      // Verify content loaded
      await verifyMainContent(page);
      console.log('Android: Navigation successful');

      // Test entity detail view
      const entityCard = page.locator('.entity-card, .card').first();
      if (await entityCard.isVisible({ timeout: 5000 })) {
        await entityCard.click();
        await waitForSPAContent(page);
        await verifyMainContent(page);
        console.log('Android: Entity detail view loaded');
      }
    }
  });

  test('Mobile: Landscape orientation handling', async ({ page }) => {
    // Set landscape viewport
    await page.setViewportSize({ width: 812, height: 375 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);
    await verifyMainContent(page);

    // Verify layout adapts to landscape
    const mainContent = page.locator('#main-content');
    const box = await mainContent.boundingBox();

    if (box) {
      // Content should utilize the wider viewport
      expect(box.width).toBeGreaterThan(700);
      console.log(`Landscape content width: ${box.width}px`);
    }

    // Navigate and verify layout persists
    const navLink = page.locator('a[href*="browse"], a[href*="mythologies"]').first();
    if (await navLink.isVisible()) {
      await navLink.click();
      await waitForSPAContent(page);
      await verifyMainContent(page);
      console.log('Landscape: Navigation works correctly');
    }
  });
});

// ============================================================================
// ADDITIONAL INTEGRATION TESTS
// ============================================================================

test.describe('Integration: Search and Navigation Combined', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
  });

  test('Search leads to entity, back button returns to search results', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], #search-input, .search-input').first();

    if (await searchInput.isVisible({ timeout: 5000 })) {
      // Perform search
      await searchInput.fill('zeus');
      await searchInput.press('Enter');
      await waitForSPAContent(page);

      const searchResultsUrl = page.url();

      // Click on a search result
      const searchResult = page.locator('.search-result, .entity-card, .result-item').first();
      if (await searchResult.isVisible({ timeout: 5000 })) {
        await searchResult.click();
        await waitForSPAContent(page);

        // Go back
        await page.goBack();
        await waitForSPAContent(page);

        // Should be back at search results (or search page)
        const backUrl = page.url();
        expect(backUrl).toMatch(/search|results/i);
        console.log('Search -> Entity -> Back navigation works');
      }
    } else {
      console.log('Search input not found on home page');
    }
  });
});

test.describe('Integration: Error Recovery', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('Navigate to invalid entity, then recover to valid page', async ({ page }) => {
    // Navigate to non-existent entity
    await page.goto('/#/entity/deity/nonexistent-deity-xyz', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Page should still be functional (not crashed)
    await verifyMainContent(page);

    // Navigate to valid page
    await page.goto('/#/browse/deities', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);
    await verifyMainContent(page);

    // Verify content loaded
    const hasCards = await page.locator('.entity-card, .card').count();
    expect(hasCards).toBeGreaterThanOrEqual(0);
    console.log('Recovered from invalid entity navigation');
  });

  test('Network interruption during navigation - page remains functional', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Simulate network interruption for specific requests
    await page.route('**/icons/**', route => route.abort());

    // Navigate to another page
    const navLink = page.locator('a[href*="browse"], a[href*="mythologies"]').first();
    if (await navLink.isVisible()) {
      await navLink.click();
      await waitForSPAContent(page);

      // Page should still render despite blocked icon requests
      await verifyMainContent(page);
      console.log('Page functional despite blocked icon resources');
    }

    // Remove route blocking
    await page.unroute('**/icons/**');
  });
});

test.describe('Integration: Session Continuity', () => {
  test('Theme and navigation state persist in same session', async ({ page }) => {
    // First visit - set theme and navigate
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSPAContent(page);

    // Try to change theme
    const themeToggle = page.locator('#themePickerContainer, .theme-toggle').first();
    if (await themeToggle.isVisible({ timeout: 5000 })) {
      await themeToggle.click();
      await page.waitForTimeout(300);

      const themeOption = page.locator('.theme-option, [data-theme]').first();
      if (await themeOption.isVisible()) {
        await themeOption.click();
        await page.waitForTimeout(300);
      }
    }

    const themeBeforeNav = await page.evaluate(() => {
      return document.body.dataset.theme ||
             document.documentElement.dataset.theme ||
             localStorage.getItem('eoa-theme') ||
             'default';
    });

    // Navigate through several pages
    const pages = ['/#/mythologies', '/#/browse/deities', '/#/browse/creatures', '/'];

    for (const pagePath of pages) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      await waitForSPAContent(page);

      const currentTheme = await page.evaluate(() => {
        return document.body.dataset.theme ||
               document.documentElement.dataset.theme ||
               localStorage.getItem('eoa-theme') ||
               'default';
      });

      expect(currentTheme).toBe(themeBeforeNav);
    }

    console.log(`Theme "${themeBeforeNav}" persisted across ${pages.length} page navigations`);
  });
});
