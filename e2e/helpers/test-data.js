/**
 * Test data helpers for E2E tests
 */

export const testEntities = {
  zeus: {
    name: 'Zeus',
    type: 'deity',
    mythology: 'greek',
    searchTerms: ['zeus', 'god of sky', 'king of gods']
  },
  thor: {
    name: 'Thor',
    type: 'deity',
    mythology: 'norse',
    searchTerms: ['thor', 'thunder god', 'mjolnir']
  },
  ra: {
    name: 'Ra',
    type: 'deity',
    mythology: 'egyptian',
    searchTerms: ['ra', 'sun god', 'egyptian']
  },
  odin: {
    name: 'Odin',
    type: 'deity',
    mythology: 'norse',
    searchTerms: ['odin', 'allfather', 'wisdom']
  }
};

export const testUsers = {
  standard: {
    email: 'test@example.com',
    uid: 'test-user-123',
    displayName: 'Test User'
  },
  admin: {
    email: 'admin@example.com',
    uid: 'admin-user-456',
    displayName: 'Admin User'
  }
};

/**
 * Wait for page to be fully loaded
 * @param {import('@playwright/test').Page} page
 */
export async function waitForPageLoad(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    // Network idle might not be reached, that's ok
  });
}

/**
 * Wait for Firebase to be ready
 * @param {import('@playwright/test').Page} page
 */
export async function waitForFirebaseReady(page) {
  await page.waitForFunction(() => {
    return window.firebase &&
           window.firebase.apps &&
           window.firebase.apps.length > 0 &&
           window.firebase.auth;
  }, { timeout: 15000 });
}

/**
 * Clear all browser storage
 * @param {import('@playwright/test').Page} page
 */
export async function clearStorage(page) {
  try {
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // localStorage might not be accessible in some contexts
      }
      try {
        sessionStorage.clear();
      } catch (e) {
        // sessionStorage might not be accessible in some contexts
      }
    });
  } catch (error) {
    // Ignore errors - storage might not be available yet
  }
}
