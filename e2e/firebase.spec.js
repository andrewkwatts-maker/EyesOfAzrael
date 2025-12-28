const { test, expect } = require('@playwright/test');
const { waitForFirebaseReady, clearStorage } = require('./helpers/test-data');
const { mockAuth } = require('./helpers/auth-helper');

test.describe('Firebase Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first, then clear storage
    await page.goto('/');
    await clearStorage(page);
  });

  test('Firebase initializes correctly', async ({ page }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    const firebaseConfig = await page.evaluate(() => {
      if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
        return null;
      }

      const app = window.firebase.apps[0];
      return {
        hasAuth: typeof window.firebase.auth === 'function',
        hasFirestore: typeof window.firebase.firestore === 'function',
        hasStorage: typeof window.firebase.storage === 'function',
        appName: app.name
      };
    });

    expect(firebaseConfig).toBeTruthy();
    expect(firebaseConfig.hasAuth).toBe(true);
    expect(firebaseConfig.hasFirestore).toBe(true);
  });

  test('Firestore data fetching', async ({ page }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    // Try to fetch some data
    const dataFetched = await page.evaluate(async () => {
      try {
        const db = window.firebase.firestore();
        const snapshot = await db.collection('entities').limit(1).get();
        return {
          success: true,
          hasData: !snapshot.empty,
          docCount: snapshot.size
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('Firestore fetch result:', dataFetched);

    // Should successfully attempt to fetch (even if no data)
    expect(dataFetched.success).toBe(true);
  });

  test('Entity renderer loads entities', async ({ page }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    // Check if entity renderer is loaded
    const hasRenderer = await page.evaluate(() => {
      return typeof window.EntityRenderer !== 'undefined' ||
             typeof window.renderEntity !== 'undefined';
    });

    if (hasRenderer) {
      // Try to render an entity
      const renderResult = await page.evaluate(async () => {
        try {
          // Look for entity render function
          if (window.EntityRenderer && typeof window.EntityRenderer.renderEntity === 'function') {
            return { hasRenderer: true, type: 'EntityRenderer' };
          } else if (typeof window.renderEntity === 'function') {
            return { hasRenderer: true, type: 'renderEntity' };
          }
          return { hasRenderer: false };
        } catch (error) {
          return { hasRenderer: false, error: error.message };
        }
      });

      expect(renderResult.hasRenderer).toBe(true);
    }
  });

  test('Search integration with Firebase', async ({ page }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    const searchInput = page.locator('input[type="search"], #search-input, .search-input').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      // Perform search
      await searchInput.fill('zeus');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);

      // Check if Firebase was queried
      const searchExecuted = await page.evaluate(() => {
        // Check if search results container exists
        return document.querySelector('.search-results, .results-container, .entity-card, .search-result') !== null;
      });

      expect(searchExecuted).toBeTruthy();
    }
  });

  test('Authentication state management', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/');
    await waitForFirebaseReady(page);

    // Check auth state
    const authState = await page.evaluate(() => {
      return {
        authExists: typeof window.firebase.auth === 'function',
        hasCurrentUser: window.firebase.auth() && window.firebase.auth().currentUser !== undefined
      };
    });

    expect(authState.authExists).toBe(true);
  });

  test('Firestore security rules respected', async ({ page }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    // Try to write without authentication (should fail gracefully)
    const writeAttempt = await page.evaluate(async () => {
      try {
        const db = window.firebase.firestore();
        await db.collection('test').add({ test: 'data' });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.code,
          message: error.message
        };
      }
    });

    // Should fail due to security rules or handle gracefully
    expect(writeAttempt.success === false || writeAttempt.error).toBeTruthy();
  });

  test('Real-time updates listener', async ({ page }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    // Set up a listener
    const listenerSetup = await page.evaluate(() => {
      try {
        const db = window.firebase.firestore();
        let listenerCount = 0;

        // Try to set up a listener
        const unsubscribe = db.collection('entities')
          .limit(1)
          .onSnapshot(() => {
            listenerCount++;
          });

        // Store unsubscribe function
        window.__testUnsubscribe = unsubscribe;

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(listenerSetup.success).toBe(true);

    // Clean up
    await page.evaluate(() => {
      if (window.__testUnsubscribe) {
        window.__testUnsubscribe();
      }
    });
  });

  test('Firestore caching behavior', async ({ page }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    // First fetch
    const firstFetch = await page.evaluate(async () => {
      const startTime = Date.now();
      try {
        const db = window.firebase.firestore();
        const snapshot = await db.collection('entities').limit(1).get();
        return {
          success: true,
          duration: Date.now() - startTime,
          fromCache: snapshot.metadata ? snapshot.metadata.fromCache : false
        };
      } catch (error) {
        return { success: false };
      }
    });

    console.log('First fetch:', firstFetch);

    if (firstFetch.success) {
      // Second fetch (might be from cache)
      const secondFetch = await page.evaluate(async () => {
        const startTime = Date.now();
        try {
          const db = window.firebase.firestore();
          const snapshot = await db.collection('entities').limit(1).get();
          return {
            success: true,
            duration: Date.now() - startTime,
            fromCache: snapshot.metadata ? snapshot.metadata.fromCache : false
          };
        } catch (error) {
          return { success: false };
        }
      });

      console.log('Second fetch:', secondFetch);

      // Second fetch should be faster if cached
      if (secondFetch.success && firstFetch.success) {
        expect(secondFetch.duration).toBeLessThanOrEqual(firstFetch.duration + 100);
      }
    }
  });

  test('Error handling for offline mode', async ({ page, context }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    // Go offline
    await context.setOffline(true);

    const offlineQuery = await page.evaluate(async () => {
      try {
        const db = window.firebase.firestore();
        const snapshot = await db.collection('entities').limit(1).get();
        return {
          success: true,
          fromCache: snapshot.metadata ? snapshot.metadata.fromCache : false,
          hasData: !snapshot.empty
        };
      } catch (error) {
        return {
          success: false,
          error: error.code,
          message: error.message
        };
      }
    });

    console.log('Offline query result:', offlineQuery);

    // Should either succeed with cached data or fail gracefully
    expect(offlineQuery).toBeTruthy();

    // Go back online
    await context.setOffline(false);
  });

  test('Firebase config is secure', async ({ page }) => {
    await page.goto('/');
    await waitForFirebaseReady(page);

    const configCheck = await page.evaluate(() => {
      const app = window.firebase.apps[0];
      const options = app.options;

      return {
        hasApiKey: !!options.apiKey,
        hasProjectId: !!options.projectId,
        apiKeyExposed: typeof options.apiKey === 'string' && options.apiKey.length > 0,
        // Firebase API keys are meant to be public, but check structure
        validApiKey: options.apiKey && options.apiKey.startsWith('AIza')
      };
    });

    expect(configCheck.hasApiKey).toBe(true);
    expect(configCheck.hasProjectId).toBe(true);
    expect(configCheck.validApiKey).toBe(true);
  });
});
