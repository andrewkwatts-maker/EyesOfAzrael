const { test, expect } = require('@playwright/test');

// Screenshot in a settled state instead of sleeping and hoping the
// staggered card fade-ins (js/views/landing-page-view.js) finished. The
// site already honours prefers-reduced-motion (css/accessibility.css),
// which renders every element at its final opacity immediately -- the
// same trick accessibility.spec.js uses for the same reason.
test.use({ reducedMotion: 'reduce' });

/**
 * Wait for the page to actually have rendered content, instead of a fixed
 * sleep after waitForLoadState.
 */
async function waitForSettled(page, selector = '#main-content') {
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    return !!el && (el.textContent || '').trim().length > 20;
  }, selector, { timeout: 10000 }).catch(() => {
    // The screenshot assertion itself will say what's wrong with the page.
  });
}

test.describe('Visual Regression Tests', () => {
  test('Homepage visual appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
    await waitForSettled(page);

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 200,
      animations: 'disabled'
    });
  });

  test('Navigation bar appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // .site-header is static markup in index.html, not conditionally
    // rendered -- it's always there, so this asserts unconditionally
    // instead of skipping the whole test when a stale generic
    // `nav, header` locator happened not to resolve in time.
    const header = page.locator('.site-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('navigation.png', {
      maxDiffPixels: 50,
      animations: 'disabled'
    });
  });

  test('Search results appearance', async ({ page }) => {
    await page.goto('/');
    await waitForSettled(page);

    // The real header search widget (index.html) is #headerSearchInput,
    // hidden inside #headerSearchDropdown until #headerSearchBtn is
    // clicked (js/header-nav.js setupHeaderSearch) -- input[type="search"]/
    // #search-input/.search-input never matched it, so this test always
    // skipped its own screenshot.
    await page.locator('#headerSearchBtn').click();
    const searchInput = page.locator('#headerSearchInput');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('zeus');
    await searchInput.press('Enter');

    // Enter navigates to #/search?q=zeus (js/header-nav.js); wait for the
    // real terminal state search-view-complete.js renders, not a sleep.
    await page.waitForFunction(() => location.hash.startsWith('#/search'), { timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => {
      return !!document.querySelector('#results-container, .search-results, .no-results');
    }, { timeout: 10000 }).catch(() => {});

    // Whichever real state the search landed in, screenshot it -- a
    // results grid and a "no results" state are both meaningful visual
    // regression targets, so this no longer silently skips when the
    // stubbed/offline backend returns zero matches.
    const target = page.locator('#results-container, .no-results').first();
    await expect(target).toBeVisible();
    await expect(target).toHaveScreenshot('search-results.png', {
      maxDiffPixels: 150,
      animations: 'disabled'
    });
  });

  test('Compare page layout', async ({ page }) => {
    // compare.html is a real static file shipped with the site (not a
    // conditionally-served route), so this loads unconditionally instead
    // of only screenshotting when a generic `body` visibility check
    // happened to pass in time.
    await page.goto('/compare.html');
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await expect(page).toHaveScreenshot('compare-page.png', {
      fullPage: true,
      maxDiffPixels: 200,
      animations: 'disabled'
    });
  });

  test('Entity card appearance', async ({ page }) => {
    await page.goto('/');
    await waitForSettled(page);

    // The landing page renders 12 category cards as
    // .landing-category-card (js/views/landing-page-view.js), not
    // .entity-card/.deity-card/.card -- none of which exist on this page,
    // so this test never found anything to screenshot.
    const card = page.locator('.landing-category-card').first();
    await expect(card).toBeVisible();
    await expect(card).toHaveScreenshot('entity-card.png', {
      maxDiffPixels: 50,
      animations: 'disabled'
    });
  });

  test('Modal appearance (if available)', async ({ page }) => {
    await page.goto('/');
    await waitForSettled(page);

    // #signInBtn (the only "Sign In"/"Login" trigger on the landing page)
    // calls firebase.auth().signInWithPopup() (js/auth-guard-simple.js) --
    // a native browser popup window, never a `.modal`/dialog/[role=dialog]
    // element in this page. There is no other modal reachable from the
    // landing page without already being signed in, so there is nothing
    // for this test to screenshot; skipping explicitly rather than
    // silently no-op'ing on a selector that can never match.
    test.skip(true, '#signInBtn opens a native OAuth popup (signInWithPopup), not an in-page modal -- no in-page modal is reachable from the landing page while signed out');
  });

  test('Mobile view - Homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
    await waitForSettled(page);

    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      maxDiffPixels: 200,
      animations: 'disabled'
    });
  });

  test('Tablet view - Homepage', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
    await waitForSettled(page);

    await expect(page).toHaveScreenshot('tablet-homepage.png', {
      fullPage: true,
      maxDiffPixels: 200,
      animations: 'disabled'
    });
  });

  test('Dark theme (night) appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.ShaderThemePicker && window.ShaderThemePicker.isInitialized(), { timeout: 10000 });

    // There is no single "dark mode toggle" by that name -- the site has a
    // full theme picker (e2e/theme-system.spec.js covers its behavior in
    // depth). For a visual-regression screenshot, driving straight to the
    // 'night' theme via the same API those tests use is both deterministic
    // and exercises the real dark-theme visual target this test's name
    // describes, instead of skipping outright when no element named
    // "Dark"/.dark-mode-toggle exists.
    await page.waitForFunction(() => {
      window.ShaderThemePicker.setTheme('night');
      return document.body.getAttribute('data-theme') === 'night';
    }, { timeout: 10000, polling: 400 });
    await waitForSettled(page);

    await expect(page).toHaveScreenshot('dark-mode.png', {
      fullPage: true,
      maxDiffPixels: 300,
      animations: 'disabled'
    });
  });

  test('Footer appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // <footer class="site-footer"> is static markup in index.html, always
    // present -- not conditionally rendered -- so this asserts
    // unconditionally.
    const footer = page.locator('.site-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toHaveScreenshot('footer.png', {
      maxDiffPixels: 50,
      animations: 'disabled'
    });
  });
});
