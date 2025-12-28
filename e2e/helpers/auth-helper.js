/**
 * Authentication helper for E2E tests
 */

/**
 * Mock Firebase authentication for testing
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - User email for mock auth
 * @param {string} uid - User ID for mock auth
 */
export async function mockAuth(page, email = 'test@example.com', uid = 'test-user-123') {
  // Inject mock Firebase auth before the page loads
  await page.addInitScript(({ userEmail, userId }) => {
    // Mock Firebase auth state
    window.__mockFirebaseUser = {
      uid: userId,
      email: userEmail,
      displayName: 'Test User',
      photoURL: null,
      emailVerified: true
    };

    // Mock Firebase auth methods
    window.__mockFirebaseAuth = true;
  }, { userEmail: email, userId: uid });
}

/**
 * Wait for Firebase to initialize
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function waitForFirebase(page) {
  await page.waitForFunction(() => {
    return window.firebase && window.firebase.apps && window.firebase.apps.length > 0;
  }, { timeout: 10000 });
}

/**
 * Check if user is signed in
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} True if user is signed in
 */
export async function isSignedIn(page) {
  return await page.evaluate(() => {
    return window.firebase &&
           window.firebase.auth() &&
           window.firebase.auth().currentUser !== null;
  });
}

/**
 * Get current user info
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser(page) {
  return await page.evaluate(() => {
    const user = window.firebase?.auth()?.currentUser;
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
  });
}
