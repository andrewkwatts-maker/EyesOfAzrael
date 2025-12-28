const { test, expect } = require('@playwright/test');

test.describe('Visual Regression Tests', () => {
  test('Homepage visual appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Wait for any animations to complete
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 200,
      animations: 'disabled'
    });
  });

  test('Navigation bar appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('nav, header').first();
    const hasNav = await nav.isVisible().catch(() => false);

    if (hasNav) {
      await expect(nav).toHaveScreenshot('navigation.png', {
        maxDiffPixels: 50,
        animations: 'disabled'
      });
    }
  });

  test('Search results appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Look for search input
    const searchInput = page.locator('input[type="search"], #search-input, .search-input').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill('zeus');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);

      // Check if results are visible
      const hasResults = await page.locator('.search-result, .entity-card, .result-item').first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasResults) {
        const resultsContainer = page.locator('.search-results, .results-container, main').first();
        await expect(resultsContainer).toHaveScreenshot('search-results.png', {
          maxDiffPixels: 150,
          animations: 'disabled'
        });
      }
    }
  });

  test('Compare page layout', async ({ page }) => {
    await page.goto('/compare.html');
    const pageExists = await page.locator('body').isVisible().catch(() => false);

    if (pageExists) {
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('compare-page.png', {
        fullPage: true,
        maxDiffPixels: 200,
        animations: 'disabled'
      });
    }
  });

  test('Entity card appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Look for entity cards
    const card = page.locator('.entity-card, .deity-card, .card').first();
    const hasCard = await card.isVisible().catch(() => false);

    if (hasCard) {
      await expect(card).toHaveScreenshot('entity-card.png', {
        maxDiffPixels: 50,
        animations: 'disabled'
      });
    }
  });

  test('Modal appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Try to trigger a modal
    const modalTrigger = page.locator('button:has-text("Sign In"), button:has-text("Login"), .open-modal').first();
    const hasTrigger = await modalTrigger.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasTrigger) {
      await modalTrigger.click();
      await page.waitForTimeout(500);

      const modal = page.locator('.modal, dialog, [role="dialog"]').first();
      const hasModal = await modal.isVisible().catch(() => false);

      if (hasModal) {
        await expect(modal).toHaveScreenshot('modal.png', {
          maxDiffPixels: 50,
          animations: 'disabled'
        });
      }
    }
  });

  test('Mobile view - Homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      maxDiffPixels: 200,
      animations: 'disabled'
    });
  });

  test('Tablet view - Homepage', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('tablet-homepage.png', {
      fullPage: true,
      maxDiffPixels: 200,
      animations: 'disabled'
    });
  });

  test('Dark mode appearance (if available)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check if dark mode toggle exists
    const darkModeToggle = page.locator('button:has-text("Dark"), .dark-mode-toggle, [aria-label*="dark" i]').first();
    const hasToggle = await darkModeToggle.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasToggle) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('dark-mode.png', {
        fullPage: true,
        maxDiffPixels: 300,
        animations: 'disabled'
      });
    }
  });

  test('Footer appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const footer = page.locator('footer').first();
    const hasFooter = await footer.isVisible().catch(() => false);

    if (hasFooter) {
      await expect(footer).toHaveScreenshot('footer.png', {
        maxDiffPixels: 50,
        animations: 'disabled'
      });
    }
  });
});
