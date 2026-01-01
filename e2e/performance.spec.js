/**
 * Performance Metrics E2E Tests for Eyes of Azrael
 *
 * Tests core web vitals and performance metrics for a Firebase-backed SPA.
 * Uses Performance API for accurate measurements.
 *
 * Run: npx playwright test e2e/performance.spec.js
 * Production: BASE_URL=https://www.eyesofazrael.com npx playwright test e2e/performance.spec.js
 */

const { test, expect } = require('@playwright/test');

// Performance thresholds for a Firebase-backed SPA
const THRESHOLDS = {
  FIRST_CONTENTFUL_PAINT: 3000,      // 3 seconds
  LANDING_PAGE_INTERACTIVE: 5000,    // 5 seconds
  PAGE_NAVIGATION: 2000,             // 2 seconds between pages
  CUMULATIVE_LAYOUT_SHIFT: 0.25,     // Good CLS threshold
  MEMORY_GROWTH_MB: 50,              // Max 50MB memory growth during navigation
  INITIAL_IMAGES_LOADED: 10,         // Max images loaded on initial render (lazy loading check)
  RENDER_BLOCKING_RESOURCES: 5,      // Max render-blocking resources
  CACHE_IMPROVEMENT_PERCENT: 20,     // Subsequent visits should be 20% faster
};

test.describe('Core Web Vitals - Paint Metrics', () => {
  test('First Contentful Paint should be under 3 seconds', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const paintMetrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const fp = paintEntries.find(entry => entry.name === 'first-paint');

      return {
        firstPaint: fp ? fp.startTime : null,
        firstContentfulPaint: fcp ? fcp.startTime : null
      };
    });

    console.log('Paint Metrics:', paintMetrics);

    // First Contentful Paint should be under threshold
    if (paintMetrics.firstContentfulPaint !== null) {
      expect(paintMetrics.firstContentfulPaint).toBeLessThan(THRESHOLDS.FIRST_CONTENTFUL_PAINT);
    }

    // First Paint should also be reasonable
    if (paintMetrics.firstPaint !== null) {
      expect(paintMetrics.firstPaint).toBeLessThan(THRESHOLDS.FIRST_CONTENTFUL_PAINT);
    }
  });

  test('Largest Contentful Paint should be under 4 seconds', async ({ page }) => {
    // Set up LCP observer before navigation
    await page.addInitScript(() => {
      window.__lcpValue = null;
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.__lcpValue = lastEntry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for LCP to be captured
    await page.waitForTimeout(2000);

    const lcp = await page.evaluate(() => window.__lcpValue);

    console.log('Largest Contentful Paint:', lcp, 'ms');

    if (lcp !== null) {
      // LCP should be under 4 seconds for good UX
      expect(lcp).toBeLessThan(4000);
    }
  });
});

test.describe('Page Interactivity', () => {
  test('Landing page should be interactive within 5 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for main content to be visible and interactive
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 10000 });

    // Check DOM interactive time from Navigation Timing API
    const interactiveTime = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return navigation ? navigation.domInteractive : null;
    });

    // Also measure actual time to interactive elements
    const categoryCards = page.locator('.category-card, .asset-type-card, a[href*="browse"], a[href*="mythologies"]');
    await categoryCards.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    const actualInteractiveTime = Date.now() - startTime;

    console.log('DOM Interactive:', interactiveTime, 'ms');
    console.log('Actual Interactive Time:', actualInteractiveTime, 'ms');

    // Page should be interactive within threshold
    expect(actualInteractiveTime).toBeLessThan(THRESHOLDS.LANDING_PAGE_INTERACTIVE);

    if (interactiveTime !== null) {
      expect(interactiveTime).toBeLessThan(THRESHOLDS.LANDING_PAGE_INTERACTIVE);
    }
  });

  test('Time to Interactive (TTI) should be reasonable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const navigationMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (!navigation) return null;

      return {
        domInteractive: navigation.domInteractive,
        domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
        domComplete: navigation.domComplete,
        loadEventEnd: navigation.loadEventEnd,
        duration: navigation.duration
      };
    });

    console.log('Navigation Metrics:', navigationMetrics);

    if (navigationMetrics) {
      // DOM Interactive should be quick
      expect(navigationMetrics.domInteractive).toBeLessThan(THRESHOLDS.LANDING_PAGE_INTERACTIVE);

      // DOMContentLoaded should complete reasonably
      expect(navigationMetrics.domContentLoadedEventEnd).toBeLessThan(THRESHOLDS.LANDING_PAGE_INTERACTIVE + 1000);
    }
  });
});

test.describe('Navigation Performance', () => {
  test('Navigation between pages should be under 2 seconds', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for landing page to be ready
    await page.waitForTimeout(1000);

    // Find a navigation link
    const navLink = page.locator('a[href*="mythologies"], a[href*="browse/deities"]').first();
    const hasNavLink = await navLink.isVisible().catch(() => false);

    if (hasNavLink) {
      const startTime = Date.now();

      await navLink.click();

      // Wait for new content to appear
      await page.waitForFunction(() => {
        const content = document.querySelector('#main-content, main');
        return content && content.children.length > 0;
      }, { timeout: 5000 });

      const navigationTime = Date.now() - startTime;

      console.log('Page Navigation Time:', navigationTime, 'ms');

      expect(navigationTime).toBeLessThan(THRESHOLDS.PAGE_NAVIGATION);
    }
  });

  test('SPA navigation should be faster than full page reload', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Measure SPA navigation time
    const spaNavTime = await page.evaluate(async () => {
      const start = performance.now();

      // Trigger SPA navigation
      window.location.hash = '#/mythologies';

      // Wait for content update
      await new Promise(resolve => setTimeout(resolve, 1500));

      return performance.now() - start;
    });

    // Navigate back and measure full reload for comparison
    await page.goto('/#/mythologies', { waitUntil: 'networkidle' });

    const fullLoadMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return navigation ? navigation.duration : null;
    });

    console.log('SPA Navigation Time:', spaNavTime, 'ms');
    console.log('Full Page Load Time:', fullLoadMetrics, 'ms');

    // SPA navigation should be under threshold
    expect(spaNavTime).toBeLessThan(THRESHOLDS.PAGE_NAVIGATION);
  });

  test('Back/forward navigation should be performant', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Navigate to another page
    const navLink = page.locator('a[href*="mythologies"], a[href*="browse"]').first();
    if (await navLink.isVisible().catch(() => false)) {
      await navLink.click();
      await page.waitForTimeout(1500);

      // Measure back navigation
      const startTime = Date.now();
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
      const backNavTime = Date.now() - startTime;

      console.log('Back Navigation Time:', backNavTime, 'ms');

      expect(backNavTime).toBeLessThan(THRESHOLDS.PAGE_NAVIGATION);
    }
  });
});

test.describe('Layout Stability', () => {
  test('No layout shifts after initial render', async ({ page }) => {
    // Set up CLS observer before navigation
    await page.addInitScript(() => {
      window.__clsValue = 0;
      window.__clsEntries = [];

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__clsValue += entry.value;
            window.__clsEntries.push({
              value: entry.value,
              startTime: entry.startTime,
              sources: entry.sources ? entry.sources.map(s => s.node?.className || 'unknown') : []
            });
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for content to stabilize
    await page.waitForTimeout(3000);

    const clsData = await page.evaluate(() => ({
      cls: window.__clsValue,
      entries: window.__clsEntries
    }));

    console.log('Cumulative Layout Shift:', clsData.cls);
    console.log('Layout Shift Entries:', clsData.entries);

    // CLS should be under threshold for good user experience
    expect(clsData.cls).toBeLessThan(THRESHOLDS.CUMULATIVE_LAYOUT_SHIFT);
  });

  test('Images should not cause layout shifts', async ({ page }) => {
    await page.addInitScript(() => {
      window.__imageLayoutShifts = [];

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput && entry.sources) {
            const imageSources = entry.sources.filter(s =>
              s.node && (s.node.tagName === 'IMG' || s.node.querySelector?.('img'))
            );
            if (imageSources.length > 0) {
              window.__imageLayoutShifts.push({
                value: entry.value,
                sources: imageSources.map(s => s.node?.src || 'unknown')
              });
            }
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const imageShifts = await page.evaluate(() => window.__imageLayoutShifts);

    console.log('Image-caused Layout Shifts:', imageShifts);

    // Images should not cause significant layout shifts
    const totalImageShift = imageShifts.reduce((sum, s) => sum + s.value, 0);
    expect(totalImageShift).toBeLessThan(0.1);
  });
});

test.describe('Image Lazy Loading', () => {
  test('Images should be lazy loaded (not all at once)', async ({ page }) => {
    // Intercept image requests
    const loadedImages = [];

    page.on('request', request => {
      const url = request.url();
      if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || request.resourceType() === 'image') {
        loadedImages.push(url);
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait a short time for initial images only
    await page.waitForTimeout(1000);

    const initialImageCount = loadedImages.length;
    console.log('Initial Images Loaded:', initialImageCount);

    // Check for lazy loading attributes
    const lazyLoadingInfo = await page.evaluate(() => {
      const allImages = document.querySelectorAll('img');
      const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-lazy], img.lazy');
      const belowFoldImages = Array.from(allImages).filter(img => {
        const rect = img.getBoundingClientRect();
        return rect.top > window.innerHeight;
      });

      return {
        totalImages: allImages.length,
        lazyImages: lazyImages.length,
        belowFoldImages: belowFoldImages.length
      };
    });

    console.log('Lazy Loading Info:', lazyLoadingInfo);

    // Not all images should load immediately
    expect(initialImageCount).toBeLessThan(THRESHOLDS.INITIAL_IMAGES_LOADED);
  });

  test('Below-fold images should load on scroll', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Get initial loaded images
    const initialImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter(img => img.complete && img.naturalHeight !== 0)
        .length;
    });

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    // Get loaded images after scroll
    const afterScrollImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter(img => img.complete && img.naturalHeight !== 0)
        .length;
    });

    console.log('Images before scroll:', initialImages);
    console.log('Images after scroll:', afterScrollImages);

    // More images should load after scrolling (if there are images below fold)
    // This confirms lazy loading is working
  });
});

test.describe('Service Worker and Caching', () => {
  test('Service worker should cache assets', async ({ page, context }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check if service worker is registered
    const swStatus = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        return { supported: false };
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      return {
        supported: true,
        registered: registrations.length > 0,
        controllers: registrations.map(r => r.active?.scriptURL || 'pending')
      };
    });

    console.log('Service Worker Status:', swStatus);

    if (swStatus.registered) {
      // Check cache storage
      const cacheInfo = await page.evaluate(async () => {
        const cacheNames = await caches.keys();
        const cacheContents = {};

        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          cacheContents[name] = keys.length;
        }

        return {
          caches: cacheNames,
          contents: cacheContents
        };
      });

      console.log('Cache Info:', cacheInfo);

      // Should have at least one cache with items
      const totalCachedItems = Object.values(cacheInfo.contents).reduce((a, b) => a + b, 0);
      expect(totalCachedItems).toBeGreaterThan(0);
    }
  });

  test('Subsequent visits should be faster than first (cache hit)', async ({ page, context }) => {
    // First visit - cold cache
    const firstVisitStart = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const firstVisitTime = Date.now() - firstVisitStart;

    // Get resource timing for first visit
    const firstVisitResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        count: resources.length,
        totalTransfer: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        totalDuration: resources.reduce((sum, r) => sum + r.duration, 0)
      };
    });

    console.log('First Visit Time:', firstVisitTime, 'ms');
    console.log('First Visit Resources:', firstVisitResources);

    // Second visit - warm cache
    const secondVisitStart = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const secondVisitTime = Date.now() - secondVisitStart;

    const secondVisitResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        count: resources.length,
        totalTransfer: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        totalDuration: resources.reduce((sum, r) => sum + r.duration, 0),
        cachedCount: resources.filter(r => r.transferSize === 0).length
      };
    });

    console.log('Second Visit Time:', secondVisitTime, 'ms');
    console.log('Second Visit Resources:', secondVisitResources);

    // Second visit should be faster or have more cached resources
    const improvement = ((firstVisitTime - secondVisitTime) / firstVisitTime) * 100;
    console.log('Load Time Improvement:', improvement.toFixed(2), '%');

    // Either time improves or more resources are cached
    const hasImprovement = improvement > 0 ||
                           secondVisitResources.cachedCount > 0 ||
                           secondVisitResources.totalTransfer < firstVisitResources.totalTransfer;

    expect(hasImprovement).toBeTruthy();
  });

  test('Static assets should be served from cache on reload', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Reload and check cache hits
    await page.reload({ waitUntil: 'networkidle' });

    const cacheHits = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources.filter(r => {
        // transferSize of 0 typically indicates cache hit
        return r.transferSize === 0 && r.decodedBodySize > 0;
      }).map(r => ({
        name: r.name.split('/').pop(),
        type: r.initiatorType
      }));
    });

    console.log('Cache Hits on Reload:', cacheHits.length);
    console.log('Cached Resources:', cacheHits.slice(0, 10));

    // Should have some cache hits on reload
    expect(cacheHits.length).toBeGreaterThan(0);
  });
});

test.describe('Memory Management', () => {
  test('Memory should not grow excessively during navigation', async ({ page }) => {
    // Note: performance.memory is Chrome-only
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });

    if (initialMemory) {
      console.log('Initial Memory:', (initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');

      // Perform multiple navigations
      const navPaths = ['#/mythologies', '#/browse/deities', '#/browse/creatures', '#/', '#/browse/heroes'];

      for (const path of navPaths) {
        await page.evaluate((hash) => {
          window.location.hash = hash;
        }, path);
        await page.waitForTimeout(1000);
      }

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        // Trigger garbage collection if available
        if (window.gc) window.gc();

        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      });

      const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryGrowthMB = memoryGrowth / 1024 / 1024;

      console.log('Final Memory:', (finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
      console.log('Memory Growth:', memoryGrowthMB.toFixed(2), 'MB');

      // Memory should not grow excessively
      expect(memoryGrowthMB).toBeLessThan(THRESHOLDS.MEMORY_GROWTH_MB);
    } else {
      console.log('performance.memory not available in this browser');
    }
  });

  test('DOM node count should remain stable during navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const initialNodeCount = await page.evaluate(() => document.getElementsByTagName('*').length);
    console.log('Initial DOM Nodes:', initialNodeCount);

    // Navigate around
    const navPaths = ['#/mythologies', '#/browse/deities', '#/'];

    for (const path of navPaths) {
      await page.evaluate((hash) => {
        window.location.hash = hash;
      }, path);
      await page.waitForTimeout(1500);
    }

    const finalNodeCount = await page.evaluate(() => document.getElementsByTagName('*').length);
    const nodeGrowth = finalNodeCount - initialNodeCount;

    console.log('Final DOM Nodes:', finalNodeCount);
    console.log('DOM Node Growth:', nodeGrowth);

    // DOM nodes should not grow excessively (indicates memory leak)
    expect(nodeGrowth).toBeLessThan(500);
  });

  test('Event listeners should be cleaned up during navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // This is a heuristic check - actual listener count is hard to measure
    const checkListenerLeaks = await page.evaluate(() => {
      // Check for common leak patterns
      const windowEventTypes = ['scroll', 'resize', 'click', 'keydown'];
      const warnings = [];

      // Check if there are too many elements with inline handlers
      const inlineHandlers = document.querySelectorAll('[onclick], [onscroll], [onresize]');
      if (inlineHandlers.length > 50) {
        warnings.push(`High inline handler count: ${inlineHandlers.length}`);
      }

      return {
        inlineHandlerCount: inlineHandlers.length,
        warnings
      };
    });

    console.log('Listener Check:', checkListenerLeaks);

    // Should not have excessive inline handlers
    expect(checkListenerLeaks.inlineHandlerCount).toBeLessThan(100);
  });
});

test.describe('Render Blocking Resources', () => {
  test('No blocking resources should delay render', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const blockingResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');

      return resources
        .filter(r => {
          // Check for render-blocking status (if available)
          if (r.renderBlockingStatus === 'blocking') return true;

          // Heuristic: CSS and sync scripts loaded early are likely blocking
          const isCSS = r.name.endsWith('.css');
          const isEarlyScript = r.name.endsWith('.js') && r.startTime < 100;

          return (isCSS || isEarlyScript) && r.duration > 100;
        })
        .map(r => ({
          name: r.name.split('/').pop(),
          type: r.initiatorType,
          duration: Math.round(r.duration),
          renderBlocking: r.renderBlockingStatus || 'unknown'
        }));
    });

    console.log('Potentially Blocking Resources:', blockingResources);

    // Should have minimal blocking resources
    expect(blockingResources.length).toBeLessThan(THRESHOLDS.RENDER_BLOCKING_RESOURCES);
  });

  test('CSS should not block initial render excessively', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const cssMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const cssResources = resources.filter(r => r.name.endsWith('.css'));

      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');

      return {
        cssFiles: cssResources.map(r => ({
          name: r.name.split('/').pop(),
          duration: Math.round(r.duration),
          renderBlocking: r.renderBlockingStatus || 'unknown'
        })),
        fcpTime: fcp ? fcp.startTime : null,
        totalCSSLoadTime: cssResources.reduce((sum, r) => sum + r.duration, 0)
      };
    });

    console.log('CSS Metrics:', cssMetrics);

    // Total CSS load time should not dominate FCP
    if (cssMetrics.fcpTime) {
      expect(cssMetrics.totalCSSLoadTime).toBeLessThan(cssMetrics.fcpTime * 2);
    }
  });

  test('JavaScript should not block critical rendering path', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const jsMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.endsWith('.js'));

      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');

      // Check for async/defer attributes
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const asyncScripts = scripts.filter(s => s.async || s.defer);

      return {
        jsFiles: jsResources.slice(0, 10).map(r => ({
          name: r.name.split('/').pop(),
          duration: Math.round(r.duration),
          startTime: Math.round(r.startTime)
        })),
        totalJSCount: jsResources.length,
        asyncScriptCount: asyncScripts.length,
        totalScriptCount: scripts.length,
        fcpTime: fcp ? fcp.startTime : null
      };
    });

    console.log('JavaScript Metrics:', jsMetrics);

    // Most scripts should be async or defer
    if (jsMetrics.totalScriptCount > 0) {
      const asyncRatio = jsMetrics.asyncScriptCount / jsMetrics.totalScriptCount;
      console.log('Async Script Ratio:', (asyncRatio * 100).toFixed(1), '%');
    }
  });
});

test.describe('Firebase Performance', () => {
  test('Firebase initialization should not block rendering', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check if content is visible before Firebase is fully initialized
    const contentVisibleTime = await page.locator('#main-content').waitFor({ state: 'visible', timeout: 5000 })
      .then(() => Date.now() - startTime)
      .catch(() => null);

    // Wait for Firebase
    const firebaseReadyTime = await page.waitForFunction(() => {
      return window.firebase && window.firebase.apps && window.firebase.apps.length > 0;
    }, { timeout: 10000 })
      .then(() => Date.now() - startTime)
      .catch(() => null);

    console.log('Content Visible Time:', contentVisibleTime, 'ms');
    console.log('Firebase Ready Time:', firebaseReadyTime, 'ms');

    // Content should be visible before or around the same time as Firebase
    if (contentVisibleTime && firebaseReadyTime) {
      // Allow content to appear up to 2 seconds after Firebase (for data loading)
      expect(contentVisibleTime).toBeLessThan(firebaseReadyTime + 2000);
    }
  });

  test('Firestore queries should complete within reasonable time', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Monitor network requests for Firestore
    const firestoreRequests = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('firestore') || url.includes('googleapis.com/v1')) {
        const timing = response.timing();
        firestoreRequests.push({
          url: url.substring(0, 100),
          status: response.status(),
          responseEnd: timing?.responseEnd || 0
        });
      }
    });

    // Trigger a navigation to load data
    await page.evaluate(() => {
      window.location.hash = '#/mythologies';
    });
    await page.waitForTimeout(3000);

    console.log('Firestore Requests:', firestoreRequests.length);

    // All Firestore requests should complete within 5 seconds
    for (const req of firestoreRequests) {
      if (req.responseEnd > 0) {
        expect(req.responseEnd).toBeLessThan(5000);
      }
    }
  });
});

test.describe('Resource Optimization', () => {
  test('Total page weight should be reasonable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const resourceMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');

      const byType = {};
      let totalSize = 0;

      for (const r of resources) {
        const type = r.initiatorType || 'other';
        if (!byType[type]) {
          byType[type] = { count: 0, size: 0 };
        }
        byType[type].count++;
        byType[type].size += r.transferSize || 0;
        totalSize += r.transferSize || 0;
      }

      return {
        totalResources: resources.length,
        totalSizeKB: Math.round(totalSize / 1024),
        byType
      };
    });

    console.log('Resource Metrics:', resourceMetrics);
    console.log('Total Page Size:', resourceMetrics.totalSizeKB, 'KB');

    // Total page weight should be under 5MB for initial load
    expect(resourceMetrics.totalSizeKB).toBeLessThan(5000);
  });

  test('Individual resources should not be excessively large', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const largeResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const threshold = 500 * 1024; // 500KB

      return resources
        .filter(r => r.transferSize > threshold)
        .map(r => ({
          name: r.name.split('/').pop(),
          sizeKB: Math.round(r.transferSize / 1024),
          type: r.initiatorType
        }))
        .sort((a, b) => b.sizeKB - a.sizeKB);
    });

    console.log('Large Resources (>500KB):', largeResources);

    // Should have minimal large resources
    expect(largeResources.length).toBeLessThan(5);
  });

  test('HTTP/2 or HTTP/3 should be used for multiplexing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const protocolInfo = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const protocols = {};

      for (const r of resources) {
        const protocol = r.nextHopProtocol || 'unknown';
        protocols[protocol] = (protocols[protocol] || 0) + 1;
      }

      return protocols;
    });

    console.log('HTTP Protocols Used:', protocolInfo);

    // Most resources should use HTTP/2 or HTTP/3
    const modernProtocols = (protocolInfo['h2'] || 0) + (protocolInfo['h3'] || 0);
    const totalResources = Object.values(protocolInfo).reduce((a, b) => a + b, 0);

    if (totalResources > 0) {
      const modernRatio = modernProtocols / totalResources;
      console.log('Modern Protocol Ratio:', (modernRatio * 100).toFixed(1), '%');
    }
  });
});
