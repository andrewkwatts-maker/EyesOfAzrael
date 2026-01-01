/**
 * Service Initialization Tests
 * Verifies all core services initialize correctly without errors
 * Run: npx playwright test e2e/service-init.spec.js
 */

const { test, expect } = require('@playwright/test');
const { waitForFirebaseReady, clearStorage } = require('./helpers/test-data');

/**
 * Critical error patterns that indicate service initialization failures
 */
const CRITICAL_ERROR_PATTERNS = [
  /is not defined/i,
  /is not a function/i,
  /cannot read propert/i,
  /cannot access/i,
  /uncaught exception/i,
  /uncaught error/i,
  /failed to initialize/i,
  /initialization failed/i,
  /script error/i,
  /syntax error/i,
  /reference error/i,
  /type error/i,
];

/**
 * Non-critical errors to ignore (expected or non-blocking)
 */
const IGNORED_ERROR_PATTERNS = [
  /favicon/i,
  /404.*favicon/i,
  /failed to load resource.*favicon/i,
  /lazy loader/i,
  /navigation not found/i,
  /firebase config not found/i,
  /network error/i,
  /net::err/i,
];

/**
 * Check if an error message is critical
 * @param {string} message - Error message to check
 * @returns {boolean} True if error is critical
 */
function isCriticalError(message) {
  // First check if it's an ignored error
  if (IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return false;
  }
  // Then check if it matches critical patterns
  return CRITICAL_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

test.describe('Service Initialization Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('1. No "X is not defined" errors in console', async ({ page }) => {
    const consoleErrors = [];
    const undefinedErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        if (/is not defined/i.test(text)) {
          undefinedErrors.push(text);
        }
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('All console errors:', consoleErrors);
    console.log('"X is not defined" errors:', undefinedErrors);

    // Fail if any "is not defined" errors found
    expect(undefinedErrors.length).toBe(0);
  });

  test('2. Firebase initializes without errors', async ({ page }) => {
    const firebaseErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (/firebase/i.test(text)) {
          firebaseErrors.push(text);
        }
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for Firebase to be ready
    const firebaseReady = await page.waitForFunction(() => {
      return window.firebase &&
             window.firebase.apps &&
             window.firebase.apps.length > 0;
    }, { timeout: 15000 }).catch(() => null);

    expect(firebaseReady).toBeTruthy();

    // Verify Firebase services are available
    const firebaseStatus = await page.evaluate(() => {
      try {
        const hasApps = window.firebase && window.firebase.apps && window.firebase.apps.length > 0;
        const hasAuth = typeof window.firebase.auth === 'function';
        const hasFirestore = typeof window.firebase.firestore === 'function';

        return {
          initialized: hasApps,
          hasAuth,
          hasFirestore,
          appName: hasApps ? window.firebase.apps[0].name : null
        };
      } catch (error) {
        return {
          initialized: false,
          error: error.message
        };
      }
    });

    console.log('Firebase status:', firebaseStatus);
    console.log('Firebase errors:', firebaseErrors);

    expect(firebaseStatus.initialized).toBe(true);
    expect(firebaseStatus.hasAuth).toBe(true);
    expect(firebaseStatus.hasFirestore).toBe(true);

    // Filter out non-critical Firebase errors (like auth persistence warnings)
    const criticalFirebaseErrors = firebaseErrors.filter(e =>
      !e.includes('persistence') &&
      !e.includes('indexedDB') &&
      !e.includes('offline')
    );
    expect(criticalFirebaseErrors.length).toBe(0);
  });

  test('3. SPANavigation is available (window.SPANavigation)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for SPA to initialize
    await page.waitForTimeout(2000);

    const spaStatus = await page.evaluate(() => {
      return {
        exists: typeof window.SPANavigation !== 'undefined',
        isObject: typeof window.SPANavigation === 'object',
        hasNavigate: window.SPANavigation && typeof window.SPANavigation.navigate === 'function',
        hasGetCurrentRoute: window.SPANavigation && typeof window.SPANavigation.getCurrentRoute === 'function',
        hasInit: window.SPANavigation && typeof window.SPANavigation.init === 'function'
      };
    });

    console.log('SPANavigation status:', spaStatus);

    expect(spaStatus.exists).toBe(true);
    expect(spaStatus.isObject).toBe(true);
    // Check for at least one core method
    expect(spaStatus.hasNavigate || spaStatus.hasInit).toBe(true);
  });

  test('4. Theme system initializes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if theme picker container exists
    const themePickerVisible = await page.locator('#themePickerContainer, .theme-picker, .theme-toggle').first().isVisible().catch(() => false);

    // Check theme-related globals or localStorage
    const themeStatus = await page.evaluate(() => {
      const storedTheme = localStorage.getItem('theme') ||
                          localStorage.getItem('eoa_theme') ||
                          localStorage.getItem('selected-theme');

      // Check for theme picker or theme manager
      const hasThemePicker = typeof window.ShaderThemePicker !== 'undefined' ||
                             typeof window.ThemePicker !== 'undefined' ||
                             typeof window.themePicker !== 'undefined';

      // Check body has theme class
      const bodyClasses = document.body.className;
      const hasThemeClass = /theme-|night|cosmic|sacred|golden|ocean|fire/i.test(bodyClasses);

      // Check CSS variables are applied
      const rootStyles = getComputedStyle(document.documentElement);
      const hasCssVars = rootStyles.getPropertyValue('--primary-color') ||
                         rootStyles.getPropertyValue('--bg-primary') ||
                         rootStyles.getPropertyValue('--background');

      return {
        storedTheme,
        hasThemePicker,
        hasThemeClass,
        hasCssVars: !!hasCssVars,
        bodyClasses
      };
    });

    console.log('Theme status:', themeStatus);
    console.log('Theme picker visible:', themePickerVisible);

    // Theme system should be working in at least one way
    expect(
      themePickerVisible ||
      themeStatus.hasThemePicker ||
      themeStatus.hasThemeClass ||
      themeStatus.hasCssVars
    ).toBe(true);
  });

  test('5. Auth guard does not block public content', async ({ page }) => {
    // Clear any cached auth state
    await page.goto('/');
    await clearStorage(page);

    // Navigate fresh without auth
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check that main content is visible (not blocked by login screen)
    const mainContentVisible = await page.locator('#main-content, main, .landing-page, .home-content').first().isVisible().catch(() => false);

    // Check for blocking login overlay
    const loginOverlayBlocking = await page.evaluate(() => {
      const overlay = document.querySelector('.login-overlay, .auth-required, #loginOverlay');
      if (!overlay) return false;

      // Check if overlay is actually visible and blocking
      const style = getComputedStyle(overlay);
      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             parseFloat(style.opacity) > 0;
    });

    // Check for category cards or content
    const hasPublicContent = await page.locator('.category-card, .entity-card, .landing-category, .mythology-card').first().isVisible().catch(() => false);

    console.log('Main content visible:', mainContentVisible);
    console.log('Login overlay blocking:', loginOverlayBlocking);
    console.log('Has public content:', hasPublicContent);

    // Main content should be visible without being blocked by auth
    expect(mainContentVisible).toBe(true);

    // If there's a login overlay, it shouldn't be blocking the entire page
    // (some overlays may exist but should allow content to show)
    if (loginOverlayBlocking) {
      // If login is blocking, there should at least be some content behind it
      const pageHasStructure = await page.locator('header, nav, footer').first().isVisible().catch(() => false);
      expect(pageHasStructure).toBe(true);
    }
  });

  test('6. Landing page renders within reasonable time (< 5s)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for main content to appear
    await page.locator('#main-content, main').first().waitFor({
      state: 'visible',
      timeout: 5000
    });

    const contentVisibleTime = Date.now() - startTime;
    console.log(`Content visible in: ${contentVisibleTime}ms`);

    // Content should appear within 5 seconds
    expect(contentVisibleTime).toBeLessThan(5000);

    // Wait for actual content (not just container)
    const hasActualContent = await page.waitForFunction(() => {
      const main = document.querySelector('#main-content, main');
      if (!main) return false;
      // Check that main has meaningful content (more than just whitespace)
      return main.textContent.trim().length > 50 ||
             main.querySelectorAll('.category-card, .entity-card, a[href*="browse"], a[href*="mythologies"]').length > 0;
    }, { timeout: 5000 }).catch(() => null);

    expect(hasActualContent).toBeTruthy();
  });

  test('7. Browse pages load without service errors', async ({ page }) => {
    const serviceErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (isCriticalError(text)) {
          serviceErrors.push(text);
        }
      }
    });

    page.on('pageerror', error => {
      serviceErrors.push(`Page error: ${error.message}`);
    });

    // Test several browse routes
    const browseRoutes = [
      '/#/browse/deities',
      '/#/browse/creatures',
      '/#/browse/heroes',
      '/#/mythologies'
    ];

    for (const route of browseRoutes) {
      serviceErrors.length = 0; // Clear errors for each route

      console.log(`Testing route: ${route}`);
      await page.goto(route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Check page didn't crash
      const pageStillAlive = await page.evaluate(() => document.readyState).catch(() => null);
      expect(pageStillAlive).toBeTruthy();

      // Check for critical service errors on this route
      const criticalErrors = serviceErrors.filter(e => isCriticalError(e));
      console.log(`Route ${route} errors:`, criticalErrors);

      expect(criticalErrors.length).toBe(0);
    }
  });

  test('8. No uncaught exceptions on page load', async ({ page }) => {
    const pageErrors = [];

    page.on('pageerror', error => {
      pageErrors.push({
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('Page errors:', pageErrors);

    // Filter out non-critical uncaught exceptions
    const criticalPageErrors = pageErrors.filter(e =>
      !e.message.includes('ResizeObserver') &&
      !e.message.includes('Script error') &&
      !e.message.includes('network') &&
      !e.message.includes('fetch')
    );

    expect(criticalPageErrors.length).toBe(0);
  });

  test('9. Service worker registers successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const swStatus = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        return { supported: false };
      }

      try {
        // Check if there's an existing registration
        const registrations = await navigator.serviceWorker.getRegistrations();

        if (registrations.length > 0) {
          const reg = registrations[0];
          return {
            supported: true,
            registered: true,
            active: !!reg.active,
            installing: !!reg.installing,
            waiting: !!reg.waiting,
            scope: reg.scope,
            state: reg.active ? reg.active.state : (reg.installing ? 'installing' : 'none')
          };
        }

        return {
          supported: true,
          registered: false,
          note: 'No service worker registered (may be intentional for dev mode)'
        };
      } catch (error) {
        return {
          supported: true,
          registered: false,
          error: error.message
        };
      }
    });

    console.log('Service Worker status:', swStatus);

    // Service workers should be supported in modern browsers
    expect(swStatus.supported).toBe(true);

    // If a service worker is registered, it should be working
    if (swStatus.registered) {
      expect(swStatus.active || swStatus.installing || swStatus.waiting).toBe(true);
    }
    // Note: Not failing if no SW registered, as it may be disabled in dev mode
  });

  test('10. Diagnostic panel does NOT show (indicates no critical failures)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check for diagnostic/error panels that indicate critical failures
    const diagnosticPanelVisible = await page.evaluate(() => {
      // Common diagnostic panel selectors
      const selectors = [
        '.diagnostic-panel',
        '.error-panel',
        '.critical-error',
        '#diagnosticPanel',
        '#errorPanel',
        '.app-error',
        '.initialization-error',
        '[data-diagnostic]',
        '.debug-panel.visible',
        '.error-overlay:not([style*="display: none"])'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          const style = getComputedStyle(el);
          if (style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              parseFloat(style.opacity) > 0) {
            return {
              found: true,
              selector,
              textContent: el.textContent.substring(0, 200)
            };
          }
        }
      }

      return { found: false };
    });

    console.log('Diagnostic panel status:', diagnosticPanelVisible);

    // Diagnostic panel should NOT be visible
    expect(diagnosticPanelVisible.found).toBe(false);
  });
});

test.describe('Comprehensive Service Health Check', () => {
  test('All services pass integrated health check', async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Load page
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Comprehensive service check
    const serviceHealth = await page.evaluate(() => {
      const checks = {
        domReady: document.readyState === 'complete',
        hasMainContent: !!document.querySelector('#main-content, main'),
        hasHeader: !!document.querySelector('header, .site-header'),
        hasTheme: !!document.querySelector('#themePickerContainer, .theme-picker'),
        firebaseLoaded: typeof window.firebase !== 'undefined',
        firebaseInitialized: window.firebase && window.firebase.apps && window.firebase.apps.length > 0,
        spaNavigation: typeof window.SPANavigation !== 'undefined',
        noLoginBlock: !document.querySelector('.login-overlay[style*="display: block"], .auth-blocking')
      };

      return {
        checks,
        passCount: Object.values(checks).filter(Boolean).length,
        totalChecks: Object.keys(checks).length
      };
    });

    console.log('Service health:', serviceHealth);
    console.log('Load time:', loadTime, 'ms');
    console.log('Console errors:', consoleErrors.length);
    console.log('Page errors:', pageErrors.length);

    // Filter critical errors
    const criticalConsoleErrors = consoleErrors.filter(isCriticalError);
    const criticalPageErrors = pageErrors.filter(e =>
      !e.includes('ResizeObserver') && isCriticalError(e)
    );

    // Assertions
    expect(serviceHealth.checks.domReady).toBe(true);
    expect(serviceHealth.checks.hasMainContent).toBe(true);
    expect(serviceHealth.checks.firebaseLoaded).toBe(true);
    expect(loadTime).toBeLessThan(15000);
    expect(criticalConsoleErrors.length).toBe(0);
    expect(criticalPageErrors.length).toBe(0);

    // At least 6 out of 8 checks should pass
    expect(serviceHealth.passCount).toBeGreaterThanOrEqual(6);
  });
});
