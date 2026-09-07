/**
 * Test data helpers for E2E tests
 */

const testEntities = {
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

const testUsers = {
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
async function waitForPageLoad(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {
    // Network idle might not be reached, that's ok
  });

  // Wait for the SPA to actually render something, not just for the document
  // to finish loading.
  //
  // This is a hash-routed SPA: `load` fires while #main-content is still empty
  // or showing a skeleton, and the view arrives a second or two later. Every
  // assertion made straight after this helper was therefore racing the render,
  // which is why tests reported missing headings, missing error states and
  // missing links on pages that render all three — the classic symptom being a
  // "friendly error" assertion failing against a page that clearly shows
  // "Not Found".
  //
  // The condition is deliberately broad: any rendered view, any error state, or
  // simply enough text to mean the page has committed to something. Waiting for
  // one specific view would make this helper wrong for the many callers that
  // navigate somewhere else.
  await page.waitForFunction(() => {
    const main = document.getElementById('main-content');
    if (!main) return false;
    if (main.querySelector('.entity-loading-state, .spa-loading')) return false;
    const settled = main.querySelector(
      'h1, h2, .entity-card, .landing-category-card, .mythology-card, ' +
      '.error-state-container, .error-page, .browse-view, .landing-page-view'
    );
    return !!settled || (main.innerText || '').trim().length > 80;
  }, { timeout: 20000 }).catch(() => {
    // Not a failure. Some routes legitimately settle on an empty or error state,
    // and it is each test's job to assert what is wrong with the page — this
    // helper only waits for it to stop being mid-render.
  });
}

/**
 * Wait for Firebase to be ready
 * @param {import('@playwright/test').Page} page
 */
async function waitForFirebaseReady(page) {
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
async function clearStorage(page) {
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

module.exports = { testEntities, testUsers, waitForPageLoad, waitForFirebaseReady, clearStorage };
