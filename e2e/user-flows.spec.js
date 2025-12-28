const { test, expect } = require('@playwright/test');
const { mockAuth, waitForFirebase } = require('./helpers/auth-helper');
const { testEntities, waitForPageLoad, waitForFirebaseReady } = require('./helpers/test-data');

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await mockAuth(page);
  });

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible();

    // Check for hero section or main content
    const hasHero = await page.locator('.hero').isVisible().catch(() => false);
    const hasMainContent = await page.locator('main').isVisible().catch(() => false);
    expect(hasHero || hasMainContent).toBeTruthy();
  });

  test('Search flow - Find and view entity', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Look for search functionality
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i], #search-input, .search-input').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      // Perform search
      await searchInput.fill('zeus');
      await searchInput.press('Enter');

      // Wait for results or navigation
      await page.waitForTimeout(2000);

      // Check for results
      const resultsVisible = await page.locator('.search-result, .entity-card, .result-item').first().isVisible({ timeout: 5000 }).catch(() => false);

      if (resultsVisible) {
        // Click first result
        await page.locator('.search-result, .entity-card, .result-item').first().click();

        // Wait for modal or navigation
        await page.waitForTimeout(1000);

        // Verify we're viewing entity details
        const hasModal = await page.locator('.modal, .quick-view').isVisible().catch(() => false);
        const hasEntityPage = await page.locator('.entity-name, .deity-name, h1').isVisible().catch(() => false);
        expect(hasModal || hasEntityPage).toBeTruthy();
      }
    }
  });

  test('Navigation - Browse mythologies', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Look for mythology navigation
    const mythologyLinks = await page.locator('a[href*="mythos"], a[href*="mythology"]').count();

    if (mythologyLinks > 0) {
      const firstMythologyLink = page.locator('a[href*="mythos"], a[href*="mythology"]').first();
      await firstMythologyLink.click();
      await waitForPageLoad(page);

      // Verify navigation worked
      const url = page.url();
      expect(url).toMatch(/mythos|mythology/i);
    }
  });

  test('Firebase integration - Data loads correctly', async ({ page }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    // Verify Firebase is initialized
    const firebaseInitialized = await page.evaluate(() => {
      return window.firebase &&
             window.firebase.apps &&
             window.firebase.apps.length > 0;
    });
    expect(firebaseInitialized).toBeTruthy();

    // Check if Firestore is available
    const firestoreAvailable = await page.evaluate(() => {
      return typeof window.firebase.firestore === 'function';
    });
    expect(firestoreAvailable).toBeTruthy();
  });

  test('Responsive design - Mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForPageLoad(page);

    // Check for mobile menu
    const mobileMenu = page.locator('.mobile-menu, .hamburger, [aria-label*="menu" i]');
    const hasMobileMenu = await mobileMenu.isVisible().catch(() => false);

    if (hasMobileMenu) {
      await mobileMenu.click();
      await page.waitForTimeout(500);

      // Verify menu opened
      const menuExpanded = await page.locator('.mobile-menu.open, .nav-menu.open, nav[aria-expanded="true"]').isVisible().catch(() => false);
      expect(menuExpanded).toBeTruthy();
    }
  });

  test('Compare functionality', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Navigate to compare page
    const compareLink = page.locator('a[href*="compare"]').first();
    const hasCompare = await compareLink.isVisible().catch(() => false);

    if (hasCompare) {
      await compareLink.click();
      await waitForPageLoad(page);

      // Verify compare page loaded
      const url = page.url();
      expect(url).toMatch(/compare/i);

      // Check for compare interface
      const hasCompareUI = await page.locator('.compare-container, .comparison-tool, #compare-section').isVisible().catch(() => false);
      expect(hasCompareUI).toBeTruthy();
    }
  });

  test('Advanced search', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Look for advanced search
    const advancedSearchLink = page.locator('a[href*="advanced"], a[href*="search-advanced"], button:has-text("Advanced Search")').first();
    const hasAdvancedSearch = await advancedSearchLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasAdvancedSearch) {
      await advancedSearchLink.click();
      await waitForPageLoad(page);

      // Verify advanced search page
      const url = page.url();
      expect(url).toMatch(/advanced|search/i);

      // Check for filter options
      const hasFilters = await page.locator('select, .filter-option, .search-filter').first().isVisible().catch(() => false);
      expect(hasFilters).toBeTruthy();
    }
  });

  test('Entity details page structure', async ({ page }) => {
    // Try to navigate to a known entity
    await page.goto('/mythos/greek/deities/zeus.html');
    const pageExists = await page.locator('body').isVisible().catch(() => false);

    if (pageExists) {
      await waitForPageLoad(page);

      // Check for entity information sections
      const hasTitle = await page.locator('h1, .entity-name, .deity-name').isVisible().catch(() => false);
      expect(hasTitle).toBeTruthy();

      // Check for description or details
      const hasContent = await page.locator('.description, .details, .entity-content, main').isVisible().catch(() => false);
      expect(hasContent).toBeTruthy();
    }
  });

  test('Archetype system', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Navigate to archetypes
    const archetypeLink = page.locator('a[href*="archetype"]').first();
    const hasArchetypes = await archetypeLink.isVisible().catch(() => false);

    if (hasArchetypes) {
      await archetypeLink.click();
      await waitForPageLoad(page);

      // Verify archetype page
      const url = page.url();
      expect(url).toMatch(/archetype/i);

      // Check for archetype cards or list
      const hasArchetypeContent = await page.locator('.archetype-card, .archetype-item, .card').first().isVisible().catch(() => false);
      expect(hasArchetypeContent).toBeTruthy();
    }
  });

  test('Page performance - Load time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await waitForPageLoad(page);
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
