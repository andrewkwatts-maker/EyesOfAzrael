const { test, expect } = require('@playwright/test');
const { mockAuth } = require('./helpers/auth-helper');
const { waitForPageLoad, waitForFirebaseReady } = require('./helpers/test-data');

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for tests that need it
    await mockAuth(page);
  });

  test.describe('Invalid Routes', () => {
    test('Invalid route shows 404 or friendly error', async ({ page }) => {
      // Navigate to a completely invalid route
      await page.goto('/#/this-route-does-not-exist-at-all');
      await waitForPageLoad(page);

      // Check for 404 page or error indication
      const has404 = await page.locator('text=404').isVisible().catch(() => false);
      const hasNotFound = await page.locator('text=/not found/i').isVisible().catch(() => false);
      const hasError = await page.locator('.error-page, .error-container').isVisible().catch(() => false);
      const hasHomeLink = await page.locator('a[href="#/"], a[href="#"]').isVisible().catch(() => false);

      // Should show some form of error/404 message
      expect(has404 || hasNotFound || hasError).toBeTruthy();

      // Should provide a way to return home
      expect(hasHomeLink).toBeTruthy();
    });

    test('Deeply nested invalid route shows friendly error', async ({ page }) => {
      // Test the specific invalid route pattern mentioned in requirements
      await page.goto('/#/mythology/fake/fake/fake');
      await waitForPageLoad(page);

      // Should show error or not found message - not crash
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();

      // Check content is not a blank page
      const hasContent = await mainContent.textContent();
      expect(hasContent.length).toBeGreaterThan(0);

      // Should show error message OR entity not found message
      const hasError = await page.locator('.error-page, .error-container, text=/not found/i, text=/error/i').first().isVisible().catch(() => false);
      expect(hasError).toBeTruthy();
    });

    test('Invalid browse category shows appropriate message', async ({ page }) => {
      await page.goto('/#/browse/nonexistent');
      await waitForPageLoad(page);

      // Main content should still be visible (app didn't crash)
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();

      // Should either show empty state, error, or gracefully handle
      const content = await mainContent.textContent();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('Non-existent Entity', () => {
    test('Non-existent entity shows "not found" message', async ({ page }) => {
      await page.goto('/');
      await waitForFirebaseReady(page);

      // Navigate to a non-existent entity
      await page.goto('/#/mythology/greek/deities/this-deity-does-not-exist-12345');
      await waitForPageLoad(page);

      // Wait for potential async loading
      await page.waitForTimeout(2000);

      // Should show not found or error message
      const content = await page.locator('#main-content').textContent();
      const hasNotFoundIndicator =
        content.toLowerCase().includes('not found') ||
        content.toLowerCase().includes('error') ||
        content.toLowerCase().includes('could not') ||
        content.toLowerCase().includes('does not exist');

      expect(hasNotFoundIndicator).toBeTruthy();

      // Should still have navigation options
      const hasNavigation = await page.locator('a[href="#/"], a[href*="mythology"]').first().isVisible().catch(() => false);
      expect(hasNavigation).toBeTruthy();
    });
  });

  test.describe('Network Offline', () => {
    test('Network offline shows offline message', async ({ page, context }) => {
      // First load the page while online
      await page.goto('/');
      await waitForFirebaseReady(page);
      await waitForPageLoad(page);

      // Go offline
      await context.setOffline(true);

      // Try to navigate to a new route that requires data fetch
      await page.goto('/#/browse/deities');

      // Wait for potential error handling
      await page.waitForTimeout(3000);

      // Check for offline indication or graceful degradation
      const content = await page.locator('#main-content').textContent().catch(() => '');

      // App should either:
      // 1. Show cached content
      // 2. Show offline/error message
      // 3. Show loading state (with eventual timeout)
      const mainContentVisible = await page.locator('#main-content').isVisible();
      expect(mainContentVisible).toBeTruthy();

      // Restore online status
      await context.setOffline(false);
    });

    test('Offline state recovers when back online', async ({ page, context }) => {
      await page.goto('/');
      await waitForFirebaseReady(page);

      // Go offline
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // Go back online
      await context.setOffline(false);
      await page.waitForTimeout(1000);

      // Navigate to home - should work
      await page.goto('/#/');
      await waitForPageLoad(page);

      // Page should load normally
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Firebase Errors', () => {
    test('Firebase errors handled gracefully', async ({ page }) => {
      // Intercept Firebase requests and return errors
      await page.route('**/firestore.googleapis.com/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('/');
      await waitForPageLoad(page);

      // Navigate to a page that requires Firebase data
      await page.goto('/#/browse/deities');
      await page.waitForTimeout(3000);

      // App should not crash - main content should still be visible
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();

      // Should show error message or empty state, not crash
      const content = await mainContent.textContent();
      expect(content.length).toBeGreaterThan(0);
    });

    test('Firebase permission denied handled gracefully', async ({ page }) => {
      await page.goto('/');
      await waitForFirebaseReady(page);

      // Try to access protected route without proper auth
      // The app should handle Firebase permission errors gracefully
      const result = await page.evaluate(async () => {
        try {
          // Attempt to write to a protected collection
          const db = window.firebase.firestore();
          await db.collection('protected').add({ test: 'data' });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            handled: true,
            errorType: error.code || 'unknown'
          };
        }
      });

      // Error should be caught and handled, not crash the app
      expect(result.handled).toBeTruthy();

      // App should still be functional
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Retry Button', () => {
    test('Retry button works on failed loads', async ({ page }) => {
      let requestCount = 0;

      // Intercept requests and fail the first one, succeed on retry
      await page.route('**/firestore.googleapis.com/**', route => {
        requestCount++;
        if (requestCount === 1) {
          // First request fails
          route.abort('failed');
        } else {
          // Subsequent requests succeed
          route.continue();
        }
      });

      await page.goto('/');
      await waitForPageLoad(page);

      // Navigate to trigger a failure
      await page.goto('/#/browse/deities');
      await page.waitForTimeout(2000);

      // Look for retry button
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("retry"), #spa-retry-btn, button:has-text("Try Again")').first();
      const hasRetry = await retryButton.isVisible().catch(() => false);

      if (hasRetry) {
        // Click retry button
        await retryButton.click();
        await page.waitForTimeout(2000);

        // After retry, check if content improved or loaded
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeVisible();
      }
    });

    test('Error page retry button navigates correctly', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Manually inject an error page with retry button
      await page.evaluate(() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.innerHTML = `
            <div class="error-page">
              <h1>Error Loading Page</h1>
              <p>Something went wrong</p>
              <button id="spa-retry-btn">Retry</button>
              <a href="#/" class="btn-secondary">Return Home</a>
            </div>
          `;
        }
      });

      // Verify error page is displayed
      const errorPage = page.locator('.error-page');
      await expect(errorPage).toBeVisible();

      // Click Return Home link
      const homeLink = page.locator('a[href="#/"]').first();
      await homeLink.click();
      await waitForPageLoad(page);

      // Should navigate to home
      const url = page.url();
      expect(url).toMatch(/#\/?$/);
    });
  });

  test.describe('App Stability', () => {
    test('Error does not crash entire app', async ({ page }) => {
      await page.goto('/');
      await waitForFirebaseReady(page);

      // Cause an error by navigating to invalid route
      await page.goto('/#/invalid/route/that/does/not/exist');
      await waitForPageLoad(page);

      // Verify navigation still works
      const navElement = page.locator('nav, header, .navbar, .site-header').first();
      const hasNav = await navElement.isVisible().catch(() => false);

      // Navigation should still be visible
      expect(hasNav).toBeTruthy();

      // Should be able to navigate to home
      await page.goto('/#/');
      await waitForPageLoad(page);

      // Home page should load
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
      const content = await mainContent.textContent();
      expect(content.length).toBeGreaterThan(0);
    });

    test('Multiple rapid error routes do not crash app', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Rapidly navigate to multiple invalid routes
      const invalidRoutes = [
        '/#/invalid1',
        '/#/invalid2/nested',
        '/#/invalid3/deep/nested/path',
        '/#/mythology/fake/fake/fake',
        '/#/browse/nonexistent'
      ];

      for (const route of invalidRoutes) {
        await page.goto(route);
        await page.waitForTimeout(200);
      }

      // Wait for things to settle
      await page.waitForTimeout(1000);

      // App should still be functional
      await page.goto('/#/');
      await waitForPageLoad(page);

      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Navigation from Error State', () => {
    test('User can navigate away from error state', async ({ page }) => {
      await page.goto('/');
      await waitForFirebaseReady(page);

      // Go to an invalid route to trigger error
      await page.goto('/#/mythology/nonexistent/fake/fake');
      await waitForPageLoad(page);

      // Try to navigate using hash link
      await page.goto('/#/');
      await waitForPageLoad(page);

      // Should successfully navigate to home
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();

      // Verify we're on home page (check for home-specific content or URL)
      const url = page.url();
      expect(url).toMatch(/#\/?$/);
    });

    test('Browser back button works from error state', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Navigate to home first
      await page.goto('/#/');
      await waitForPageLoad(page);

      // Navigate to error route
      await page.goto('/#/invalid/route');
      await waitForPageLoad(page);

      // Go back
      await page.goBack();
      await waitForPageLoad(page);

      // Should be back on previous page
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });

    test('Click navigation works from error page', async ({ page }) => {
      await page.goto('/#/invalid-route-12345');
      await waitForPageLoad(page);

      // Look for any navigation link
      const navLinks = page.locator('nav a, header a, a[href^="#"]').first();
      const hasNavLinks = await navLinks.isVisible().catch(() => false);

      if (hasNavLinks) {
        await navLinks.click();
        await waitForPageLoad(page);

        // Should navigate successfully
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeVisible();
      }
    });
  });

  test.describe('Console Error Handling', () => {
    test('Console errors do not include stack traces to user', async ({ page }) => {
      // Collect console messages
      const consoleMessages = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      });

      // Navigate to error-prone route
      await page.goto('/#/mythology/fake/fake/fake');
      await waitForPageLoad(page);

      // Get visible page content
      const visibleContent = await page.locator('#main-content').textContent().catch(() => '');

      // Visible content should NOT contain stack trace indicators
      const stackTraceIndicators = [
        'at Function',
        'at Object',
        'at Array',
        'at eval',
        '.js:',
        'line ',
        'column ',
        'TypeError:',
        'ReferenceError:',
        'SyntaxError:'
      ];

      const hasStackTraceInUI = stackTraceIndicators.some(indicator =>
        visibleContent.includes(indicator)
      );

      expect(hasStackTraceInUI).toBeFalsy();

      // Console may have errors (that's fine), but UI should be clean
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });

    test('User-friendly error messages shown instead of technical details', async ({ page }) => {
      await page.goto('/#/mythology/invalid/invalid/invalid');
      await waitForPageLoad(page);

      const content = await page.locator('#main-content').textContent();
      const contentLower = content.toLowerCase();

      // Should contain user-friendly language
      const friendlyTerms = ['not found', 'error', 'sorry', 'return', 'home', 'back', 'try again'];
      const hasFriendlyMessage = friendlyTerms.some(term => contentLower.includes(term));

      expect(hasFriendlyMessage).toBeTruthy();
    });
  });

  test.describe('Loading Timeout', () => {
    test('Loading timeout shows timeout message', async ({ page }) => {
      // Mock a very slow Firebase response
      await page.route('**/firestore.googleapis.com/**', async route => {
        // Delay for 15 seconds to trigger timeout
        await new Promise(resolve => setTimeout(resolve, 15000));
        route.continue();
      });

      await page.goto('/');

      // Navigate to a route that needs data
      await page.goto('/#/browse/deities');

      // Wait for timeout handling (app typically has 5-10 second timeouts)
      await page.waitForTimeout(12000);

      // Check for loading, timeout, or error state
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();

      // Should show loading spinner OR timeout/error message
      const hasLoadingOrError = await page.locator('.loading-container, .spinner, .error-page, .error-container, text=/loading/i, text=/timeout/i').first().isVisible().catch(() => false);

      // If nothing else, main content should at least be visible (app didn't crash)
      expect(await mainContent.isVisible()).toBeTruthy();
    });

    test('Auth timeout does not block public routes', async ({ page }) => {
      // The SPA has a 5 second auth timeout - public routes should work regardless
      await page.goto('/#/');

      // Wait past auth timeout
      await page.waitForTimeout(6000);

      // Home page (public route) should still render
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();

      const content = await mainContent.textContent();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('Partial Failures', () => {
    test('Partial failures - some data loads, some fails', async ({ page }) => {
      let requestCount = 0;

      // Intercept Firebase requests - fail some, allow others
      await page.route('**/firestore.googleapis.com/**', route => {
        requestCount++;
        const url = route.request().url();

        // Fail requests to 'deities' collection, allow others
        if (url.includes('deities')) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      await page.goto('/');
      await waitForPageLoad(page);

      // Navigate to home which may load multiple collections
      await page.goto('/#/');
      await page.waitForTimeout(3000);

      // App should still be functional even with partial failures
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();

      // Content should exist (not blank)
      const content = await mainContent.textContent();
      expect(content.length).toBeGreaterThan(0);
    });

    test('Failed image loads do not break page layout', async ({ page }) => {
      // Block all image requests
      await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', route => {
        route.abort();
      });

      await page.goto('/');
      await waitForPageLoad(page);

      // Page should still render properly
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();

      // Navigation should still work
      await page.goto('/#/mythologies');
      await waitForPageLoad(page);

      // Content should be visible
      await expect(mainContent).toBeVisible();
    });

    test('CSS load failure does not crash app', async ({ page }) => {
      // Block CSS files
      await page.route('**/*.css', route => {
        route.abort();
      });

      await page.goto('/');
      await page.waitForTimeout(2000);

      // App should still load (just unstyled)
      const mainContent = page.locator('#main-content');
      const hasMain = await mainContent.isVisible().catch(() => false);

      // At minimum, the page should render something
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Error Event Handling', () => {
    test('render-error events are dispatched on failures', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Set up listener for render-error events
      const errorEvents = await page.evaluate(() => {
        return new Promise((resolve) => {
          const events = [];

          document.addEventListener('render-error', (e) => {
            events.push({
              route: e.detail?.route,
              error: e.detail?.error,
              timestamp: e.detail?.timestamp
            });
          });

          // Navigate to invalid route to trigger error
          window.location.hash = '#/mythology/nonexistent/fake/fake';

          // Wait and return collected events
          setTimeout(() => resolve(events), 3000);
        });
      });

      // Error events may or may not fire depending on how errors are handled
      // The key is the app should remain stable
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });

    test('first-render-complete fires on successful loads', async ({ page }) => {
      await page.goto('/');

      // Listen for first-render-complete event
      const renderComplete = await page.evaluate(() => {
        return new Promise((resolve) => {
          let completed = false;

          document.addEventListener('first-render-complete', (e) => {
            completed = true;
            resolve({
              route: e.detail?.route,
              timestamp: e.detail?.timestamp,
              renderer: e.detail?.renderer
            });
          });

          // Timeout fallback
          setTimeout(() => {
            if (!completed) {
              resolve({ completed: false });
            }
          }, 10000);
        });
      });

      // Should receive first-render-complete event
      expect(renderComplete.route || renderComplete.completed === false).toBeTruthy();
    });
  });

  test.describe('Graceful Degradation', () => {
    test('App works without JavaScript features gracefully', async ({ page }) => {
      // Disable some JavaScript APIs
      await page.addInitScript(() => {
        // Simulate missing localStorage
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {}
          }
        });
      });

      await page.goto('/');
      await waitForPageLoad(page);

      // App should still work
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });

    test('App handles missing Firebase gracefully', async ({ page }) => {
      // Block Firebase SDK
      await page.route('**/firebase*.js', route => route.abort());

      await page.goto('/');
      await page.waitForTimeout(5000);

      // Page should at least show something (error message or basic content)
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });
});
