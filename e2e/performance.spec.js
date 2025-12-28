const { test, expect } = require('@playwright/test');

test.describe('Performance Tests', () => {
  test('Page load performance metrics', async ({ page }) => {
    await page.goto('/');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      const navigation = window.performance.getEntriesByType('navigation')[0];

      return {
        // Basic timing
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        loadComplete: perfData.loadEventEnd - perfData.navigationStart,

        // Navigation timing API v2
        domInteractive: navigation?.domInteractive || 0,
        domComplete: navigation?.domComplete || 0,

        // Resource timing
        resourceCount: window.performance.getEntriesByType('resource').length
      };
    });

    console.log('Performance Metrics:', metrics);

    // DOM Content Loaded should be under 3 seconds
    expect(metrics.domContentLoaded).toBeLessThan(3000);

    // Full page load should be under 5 seconds
    expect(metrics.loadComplete).toBeLessThan(5000);
  });

  test('JavaScript bundle size impact', async ({ page }) => {
    await page.goto('/');

    const jsResources = await page.evaluate(() => {
      const resources = window.performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.endsWith('.js'))
        .map(r => ({
          name: r.name.split('/').pop(),
          size: r.transferSize,
          duration: r.duration
        }));
    });

    console.log('JavaScript Resources:', jsResources);

    // Check that individual JS files load reasonably fast
    for (const js of jsResources) {
      expect(js.duration).toBeLessThan(2000); // 2 seconds per file
    }
  });

  test('CSS resource loading', async ({ page }) => {
    await page.goto('/');

    const cssResources = await page.evaluate(() => {
      const resources = window.performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.endsWith('.css'))
        .map(r => ({
          name: r.name.split('/').pop(),
          size: r.transferSize,
          duration: r.duration
        }));
    });

    console.log('CSS Resources:', cssResources);

    // CSS files should load quickly
    for (const css of cssResources) {
      expect(css.duration).toBeLessThan(1000);
    }
  });

  test('Firebase initialization time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');

    // Wait for Firebase to initialize
    await page.waitForFunction(() => {
      return window.firebase &&
             window.firebase.apps &&
             window.firebase.apps.length > 0;
    }, { timeout: 10000 });

    const initTime = Date.now() - startTime;
    console.log('Firebase initialization time:', initTime, 'ms');

    // Firebase should initialize within 5 seconds
    expect(initTime).toBeLessThan(5000);
  });

  test('Search responsiveness', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[type="search"], #search-input, .search-input').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      const startTime = Date.now();

      await searchInput.fill('zeus');
      await searchInput.press('Enter');

      // Wait for results or timeout
      await page.locator('.search-result, .entity-card, .result-item').first().waitFor({ timeout: 5000 }).catch(() => {});

      const searchTime = Date.now() - startTime;
      console.log('Search response time:', searchTime, 'ms');

      // Search should respond within 3 seconds
      expect(searchTime).toBeLessThan(3000);
    }
  });

  test('Image loading optimization', async ({ page }) => {
    await page.goto('/');

    const imageMetrics = await page.evaluate(() => {
      const resources = window.performance.getEntriesByType('resource');
      return resources
        .filter(r => r.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(r.name))
        .map(r => ({
          name: r.name.split('/').pop(),
          size: r.transferSize,
          duration: r.duration
        }));
    });

    console.log('Image Resources:', imageMetrics);

    // Check for lazy loading - not all images should load immediately
    expect(imageMetrics.length).toBeLessThan(50); // Reasonable limit for initial load
  });

  test('Memory usage - No major leaks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Get initial memory (if available)
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return null;
    });

    if (initialMemory) {
      // Perform some navigation
      const links = await page.locator('a[href*=".html"]').all();
      if (links.length > 0) {
        await links[0].click().catch(() => {});
        await page.waitForTimeout(1000);
        await page.goBack();
        await page.waitForTimeout(1000);
      }

      const finalMemory = await page.evaluate(() => {
        return performance.memory.usedJSHeapSize;
      });

      const memoryIncrease = finalMemory - initialMemory;
      console.log('Memory increase:', memoryIncrease / 1024 / 1024, 'MB');

      // Memory shouldn't increase by more than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('Time to Interactive (TTI)', async ({ page }) => {
    await page.goto('/');

    const tti = await page.evaluate(() => {
      const navigation = window.performance.getEntriesByType('navigation')[0];
      const interactive = navigation?.domInteractive || 0;
      return interactive;
    });

    console.log('Time to Interactive:', tti, 'ms');

    // Page should be interactive within 4 seconds
    expect(tti).toBeLessThan(4000);
  });

  test('Render blocking resources', async ({ page }) => {
    await page.goto('/');

    const renderBlockingResources = await page.evaluate(() => {
      const resources = window.performance.getEntriesByType('resource');
      return resources
        .filter(r => {
          // CSS and sync scripts in head are typically render-blocking
          return (r.name.endsWith('.css') || r.name.endsWith('.js')) &&
                 r.renderBlockingStatus === 'blocking';
        })
        .map(r => ({
          name: r.name.split('/').pop(),
          duration: r.duration
        }));
    });

    console.log('Render blocking resources:', renderBlockingResources);

    // Should minimize render-blocking resources
    expect(renderBlockingResources.length).toBeLessThan(10);
  });

  test('API response times', async ({ page }) => {
    await page.goto('/');

    // Monitor network requests
    const apiCalls = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('firestore') || url.includes('api') || url.includes('.json')) {
        const timing = response.timing();
        apiCalls.push({
          url: url.split('/').pop(),
          status: response.status(),
          duration: timing ? timing.responseEnd : 0
        });
      }
    });

    await page.waitForTimeout(3000);

    console.log('API Calls:', apiCalls);

    // API calls should respond quickly
    for (const call of apiCalls) {
      if (call.duration > 0) {
        expect(call.duration).toBeLessThan(3000);
      }
    }
  });
});
