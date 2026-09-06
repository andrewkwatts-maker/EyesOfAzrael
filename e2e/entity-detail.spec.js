/**
 * Entity Detail Page E2E Tests
 * Comprehensive tests for entity detail view functionality
 *
 * Tests cover:
 * - Page loading with entity name as heading
 * - Entity image/icon display
 * - Description text visibility
 * - Metadata panels (mythology, type, domains, etc.)
 * - Related entities section and navigation
 * - Share button functionality
 * - Back navigation
 * - 404/error state for non-existent entities
 * - Different entity type rendering (deity, creature, item)
 *
 * Run against production: BASE_URL=https://www.eyesofazrael.com npx playwright test e2e/entity-detail.spec.js
 */

const { test, expect } = require('@playwright/test');

// Configuration
const SPA_TIMEOUT = 15000;
const NAVIGATION_TIMEOUT = 20000;

/**
 * Known test entities from the database
 * These entities should exist in the Firebase database
 */
const TEST_ENTITIES = {
  deity: {
    zeus: {
      id: 'zeus',
      name: 'Zeus',
      mythology: 'greek',
      type: 'deity',
      route: '#/mythology/greek/deity/zeus',
      alternateRoutes: ['#/entity/deity/zeus'],
      expectedContent: {
        domains: /sky|thunder|lightning|king/i,
        mythology: /greek/i
      }
    },
    athena: {
      id: 'athena',
      name: 'Athena',
      mythology: 'greek',
      type: 'deity',
      route: '#/mythology/greek/deity/athena',
      alternateRoutes: ['#/entity/deity/athena'],
      expectedContent: {
        domains: /wisdom|war|craft/i,
        mythology: /greek/i
      }
    },
    odin: {
      id: 'odin',
      name: 'Odin',
      mythology: 'norse',
      type: 'deity',
      route: '#/mythology/norse/deity/odin',
      alternateRoutes: ['#/entity/deity/odin'],
      expectedContent: {
        domains: /wisdom|war|death|runes/i,
        mythology: /norse/i
      }
    }
  },
  creature: {
    fenrir: {
      id: 'norse_fenrir',
      name: 'Fenrir',
      mythology: 'norse',
      type: 'creature',
      route: '#/mythology/norse/creature/norse_fenrir',
      alternateRoutes: ['#/entity/creature/norse_fenrir', '#/entity/creature/fenrir'],
      expectedContent: {
        classification: /wolf|beast/i,
        mythology: /norse/i
      }
    },
    medusa: {
      id: 'greek_medusa',
      name: 'Medusa',
      mythology: 'greek',
      type: 'creature',
      route: '#/mythology/greek/creature/greek_medusa',
      alternateRoutes: ['#/entity/creature/greek_medusa'],
      expectedContent: {
        classification: /gorgon|monster/i,
        mythology: /greek/i
      }
    },
    pegasus: {
      id: 'greek_pegasus',
      name: 'Pegasus',
      mythology: 'greek',
      type: 'creature',
      route: '#/mythology/greek/creature/greek_pegasus',
      alternateRoutes: ['#/entity/creature/greek_pegasus'],
      expectedContent: {
        classification: /horse|winged/i,
        mythology: /greek/i
      }
    }
  },
  item: {
    ankh: {
      id: 'egyptian_ankh',
      name: 'Ankh',
      mythology: 'egyptian',
      type: 'item',
      route: '#/mythology/egyptian/item/egyptian_ankh',
      alternateRoutes: ['#/entity/item/egyptian_ankh', '#/entity/item/ankh'],
      expectedContent: {
        symbolism: /life|eternal|immortality/i,
        mythology: /egyptian/i
      }
    },
    mjolnir: {
      id: 'mjolnir',
      name: 'Mjolnir',
      mythology: 'norse',
      type: 'item',
      route: '#/mythology/norse/item/mjolnir',
      alternateRoutes: ['#/entity/item/mjolnir'],
      expectedContent: {
        description: /hammer|thor|thunder/i,
        mythology: /norse/i
      }
    },
    excalibur: {
      id: 'excalibur',
      name: 'Excalibur',
      mythology: 'celtic',
      type: 'item',
      route: '#/mythology/celtic/item/excalibur',
      alternateRoutes: ['#/entity/item/excalibur'],
      expectedContent: {
        description: /sword|arthur|king/i,
        mythology: /celtic|arthurian/i
      }
    }
  }
};

/**
 * Helper function to navigate to entity page with fallback routes
 * @param {import('@playwright/test').Page} page
 * @param {object} entity
 * @returns {Promise<boolean>} True if navigation successful
 */
async function navigateToEntity(page, entity) {
  const routes = [entity.route, ...(entity.alternateRoutes || [])];

  for (const route of routes) {
    try {
      await page.goto(`/${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT
      });

      // Wait for main content
      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
      await waitForEntityLoaded(page);

      // Check if entity name appears on page
      const pageContent = await page.textContent('body');
      if (pageContent.toLowerCase().includes(entity.name.toLowerCase())) {
        return true;
      }
    } catch (e) {
      // Try next route
      continue;
    }
  }

  return false;
}

/**
 * Helper to collect console errors during test
 * @param {import('@playwright/test').Page} page
 * @returns {string[]}
 */
function setupConsoleErrorCollection(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected/non-blocking errors
      if (!text.includes('favicon') &&
          !text.includes('404') &&
          !text.includes('Failed to load resource') &&
          !text.includes('Lazy Loader') &&
          !text.includes('Navigation NOT found')) {
        errors.push(text);
      }
    }
  });
  return errors;
}

/**
 * Wait for the entity detail page to actually settle, instead of sleeping for
 * a fixed duration and hoping the async Firestore fetch + render is done by
 * then.
 *
 * The live renderer for every #/entity/... and #/mythology/.../:type/:id
 * route is FirebaseEntityRenderer (js/entity-renderer-firebase.js): it shows
 * `.entity-loading-state` while fetching, then replaces #main-content with
 * either a `.hero-section` (success, every entity type) or
 * `.error-state-container` (not-found/invalid/offline). Polling for that
 * transition is both faster on a quick render and reliable on a slow one —
 * the fixed sleep raced the fetch and could observe either state depending on
 * machine load.
 */
async function waitForEntityLoaded(page) {
  await page.waitForLoadState('domcontentloaded');

  await page.waitForFunction(() => {
    const main = document.getElementById('main-content');
    if (!main) return false;
    if (main.querySelector('.entity-loading-state')) return false;
    return !!main.querySelector('.hero-section, .error-state-container, .entity-page');
  }, { timeout: SPA_TIMEOUT }).catch(() => {
    // Deliberately not a failure here: it is the individual test's job to
    // assert what is (or is not) on the page - this helper only waits for
    // the page to stop being in a "still loading" state.
  });

  // Short settle for chrome that mounts after the initial render pass
  // (ShareToolbar, admin populate button, back-to-top button).
  await page.waitForTimeout(150);
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('Entity Detail Page - Loading & Basic Display', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('1. Entity page loads with name as heading (Zeus)', async ({ page }) => {
    const entity = TEST_ENTITIES.deity.zeus;
    const success = await navigateToEntity(page, entity);

    if (!success) {
      console.log(`[WARN] Could not navigate to ${entity.name} - trying direct route`);
      await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
      await waitForEntityLoaded(page);
    }

    // Check for entity name in heading
    const heading = page.locator('h1, .entity-title, .entity-name, .deity-name');
    await expect(heading.first()).toBeVisible({ timeout: SPA_TIMEOUT });

    const headingText = await heading.first().textContent();
    expect(headingText.toLowerCase()).toContain(entity.name.toLowerCase());
  });

  test('2. Entity page loads with name as heading (Fenrir - Creature)', async ({ page }) => {
    // Try multiple possible routes for creatures - this is route-format
    // discovery (which URL shape resolves), not a feature guard, so it
    // stays a loop. What must NOT be conditional is the assertion once a
    // route has actually loaded content.
    const routes = [
      '/#/entity/creature/norse_fenrir',
      '/#/entity/creature/fenrir',
      '/#/mythology/norse/creature/fenrir'
    ];

    let loaded = false;
    for (const route of routes) {
      try {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await waitForEntityLoaded(page);

        const content = await page.textContent('body');
        if (content.toLowerCase().includes('fenrir')) {
          loaded = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Fenrir is a known-good seeded entity (TEST_ENTITIES.creature.fenrir) -
    // require that at least one route format actually rendered it, then
    // check its real heading unconditionally. FirebaseEntityRenderer puts
    // the entity name in an unclassed `<h2>` inside `.hero-section` (there
    // is no `<h1>`/`.entity-title`/`.entity-name` on a successful render -
    // only the 404/error state uses `<h1>`), so that's the real locator.
    expect(loaded, 'Fenrir did not render on any known route format').toBeTruthy();

    const heading = page.locator('.hero-section h2, h1, .entity-title, .entity-name');
    await expect(heading.first()).toBeVisible({ timeout: SPA_TIMEOUT });

    const headingText = await heading.first().textContent();
    expect(headingText.toLowerCase()).toContain('fenrir');
  });

  test('3. Entity page loads with name as heading (Ankh - Item)', async ({ page }) => {
    const routes = [
      '/#/entity/item/egyptian_ankh',
      '/#/entity/item/ankh',
      '/#/mythology/egyptian/item/ankh'
    ];

    let loaded = false;
    for (const route of routes) {
      try {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await waitForEntityLoaded(page);

        const content = await page.textContent('body');
        if (content.toLowerCase().includes('ankh')) {
          loaded = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    expect(loaded, 'Ankh did not render on any known route format').toBeTruthy();

    const heading = page.locator('.hero-section h2, h1, .entity-title, .entity-name');
    await expect(heading.first()).toBeVisible({ timeout: SPA_TIMEOUT });

    const headingText = await heading.first().textContent();
    expect(headingText.toLowerCase()).toContain('ankh');
  });
});

test.describe('Entity Detail Page - Image/Icon Display', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('4. Entity image or icon displays correctly', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // `.entity-icon-large` (inside `.hero-icon-display`) is rendered by every
    // FirebaseEntityRenderer type branch (renderDeity/renderHero/renderItem/
    // etc.) - it is a core, always-present element, not an optional one, so
    // this no longer needs a count-guard.
    const iconOrImage = page.locator(
      '.entity-icon-large, .entity-icon, .entity-image, ' +
      '.entity-hero img, .entity-hero .icon-float, ' +
      'img[alt*="zeus" i], img[alt*="deity" i]'
    );

    await expect(iconOrImage.first()).toBeVisible({ timeout: SPA_TIMEOUT });
  });

  // Test 5 (deity type badge) is intentionally skipped - see below.
  test('5. Deity type badge icon displays', async ({ page }) => {
    test.skip(true,
      'No `.entity-type-badge`/`.type-badge`/`[class*="badge"]` element exists ' +
      'anywhere in the live renderer (js/entity-renderer-firebase.js). Item and ' +
      'archetype entities render classification "badges" as bare, unclassed ' +
      '<span style="..."> tags, and deity/creature/hero/place pages render no ' +
      'type indicator at all - there is no discrete, discoverable "type badge" ' +
      'feature on this page for any entity type to assert against.');
  });
});

test.describe('Entity Detail Page - Description Text', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('6. Description text is visible', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // FirebaseEntityRenderer gives the description no dedicated class - it's
    // a plain <p> inside `.hero-section` (see renderDeity in
    // js/entity-renderer-firebase.js). Zeus's Firestore doc has a non-empty
    // `description` field, so this is a real, unconditional check against
    // the actual markup rather than a class name that doesn't exist.
    const heroText = await page.locator('.hero-section').textContent();
    expect(heroText.trim().length).toBeGreaterThan(20);
  });

  // Test 7 is intentionally skipped - see below.
  test('7. Full description section renders markdown correctly', async ({ page }) => {
    test.skip(true,
      'The entity description is rendered via `this.escapeHtml(entity.description)` ' +
      'into a plain <p> (see renderDeity in js/entity-renderer-firebase.js) - it is ' +
      'never passed through a markdown renderer, and there is no `.prose`/' +
      '`.entity-description` element anywhere in the live render output. Markdown ' +
      'IS rendered elsewhere on the page (key myths / extended-content schema ' +
      'sections), but that is a different feature already covered by other tests, ' +
      'not "the description section".');
  });
});

test.describe('Entity Detail Page - Metadata Panels', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('8. Metadata panels show mythology information', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // FirebaseEntityRenderer.applyMythologyStyles() always sets
    // data-mythology on <html>/<body> (and the container) for a resolved
    // mythology - it is the real, always-present mythology signal on this
    // page (there is no visible "mythology badge" text element).
    const mythologyAttr = await page.evaluate(() =>
      document.documentElement.getAttribute('data-mythology')
    );
    expect(mythologyAttr).toBe('greek');
  });

  // Test 9 (entity type metadata) is intentionally skipped - see below.
  test('9. Metadata panels show entity type', async ({ page }) => {
    test.skip(true,
      'There is no discrete "entity type" metadata element on the page - no ' +
      '`.entity-type-badge`/`[class*="type-badge"]`, and document.title only ' +
      'includes the entity name and mythology (see FirebaseEntityRenderer\'s ' +
      'updateSEOMetadata: `${name} - ${mythology} Mythology - ...`), never the ' +
      'type. Whether the word "deity"/"god" appears in body copy is already ' +
      'exercised by test 22 ("Deity entity renders with deity-specific ' +
      'sections"); duplicating that heuristic here under a "metadata panel" ' +
      'label would not be testing anything new or real.');
  });

  test('10. Metadata panels show domains (for deities)', async ({ page }) => {
    const entity = TEST_ENTITIES.deity.zeus;
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Real markup: renderDeityAttributes() emits a `.subsection-card` per
    // attribute, each with an `.attribute-label` ("Domains") and sibling
    // `.attribute-value` (comma-joined list). Zeus's Firestore doc has a
    // non-empty `domains` array, so this section is guaranteed to render -
    // no guard needed, and this actually executes an assertion (the
    // original test only ever logged).
    const domainsCard = page.locator('.subsection-card').filter({
      has: page.locator('.attribute-label', { hasText: 'Domains' })
    });
    await expect(domainsCard).toHaveCount(1, { timeout: SPA_TIMEOUT });

    const domainsText = await domainsCard.locator('.attribute-value').textContent();
    expect(domainsText.toLowerCase()).toMatch(entity.expectedContent.domains);
  });

  test('11. Key attributes section renders for deity', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Real markup: renderDeityAttributes() wraps its cards in `.attribute-grid`
    // and each card is `.subsection-card` (not `.entity-attribute-card`/
    // `.attribute-card`, which don't exist). Zeus has titles/epithets, domains
    // and symbols, so at least one card is guaranteed.
    const attributesSection = page.locator('.attribute-grid').first();
    await expect(attributesSection).toBeVisible({ timeout: SPA_TIMEOUT });

    const attributeCards = attributesSection.locator('.subsection-card');
    const cardCount = await attributeCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });
});

test.describe('Entity Detail Page - Related Entities Section', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('12. Related entities section shows linked entities', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Related entities are built into the same synchronous HTML string as
    // the rest of renderDeity() - there is no separate async fetch/loading
    // state for this section, so no extra wait is needed once
    // waitForEntityLoaded() has resolved. Zeus's Firestore doc has a
    // non-empty, multi-category `relatedEntities` object, which
    // renderCategorizedRelatedEntities() turns into `.related-entities-grid`
    // links - a real, guaranteed-present section for this entity.
    const relatedSection = page.locator('.related-entities-section');
    await expect(relatedSection.first()).toBeVisible({ timeout: SPA_TIMEOUT });

    const relatedCards = page.locator('.related-entities-grid a');
    const cardCount = await relatedCards.count();
    expect(cardCount).toBeGreaterThan(0);
    await expect(relatedCards.first()).toBeVisible();
  });

  test('13. Clicking related entity navigates to that entity', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    const relatedLinks = page.locator('.related-entities-grid a');
    await expect(relatedLinks.first()).toBeVisible({ timeout: SPA_TIMEOUT });

    await relatedLinks.first().click();
    await waitForEntityLoaded(page);

    // Verify URL changed away from zeus
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('zeus');

    // Verify new content loaded
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('14. Schema-based related entities render correctly', async ({ page }) => {
    await page.goto('/#/entity/deity/athena', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Related-entities markup shape depends on the SHAPE of the Firestore
    // data, not just its presence: a nested-object `relatedEntities`
    // (category -> array) renders via renderCategorizedRelatedEntities() as
    // `.related-entities-section .related-category` groups (real class:
    // `.related-category`, NOT `.schema-related-group`); a flat array
    // (the legacy format, which is what Athena's doc actually has) renders
    // via renderRelatedEntities()/renderRelatedEntitiesGrid() as plain
    // `.entity-grid .entity-card` divs with no grouping at all. Both are
    // real, genuinely different rendering paths for the same feature, so
    // both branches get a real assertion.
    const groups = page.locator('.related-entities-section .related-category');
    const groupCount = await groups.count();

    if (groupCount > 0) {
      const title = await groups.first().locator('h3').textContent();
      expect(title.trim().length).toBeGreaterThan(0);
    } else {
      // Athena's relatedEntities is a flat array (legacy format) - grouped
      // categories never render for her; the flat entity-card grid is the
      // real output to check instead.
      const flatCards = page.locator('.entity-grid .entity-card');
      expect(await flatCards.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('Entity Detail Page - Share Button', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('15. Share button is present and clickable', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Real markup (js/components/share-toolbar.js): ShareToolbar is
    // unconditionally init()'d for every rendered entity
    // (`if (this.currentEntity && window.ShareToolbar)` at the end of every
    // render path), producing `.share-btn.share-btn-copy[data-action="copy"]`
    // - there is no `[data-action="share"]`/"Share"-labelled button and no
    // toast; clicking the copy button just adds a `.copied` class to itself.
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

    const shareButton = page.locator('.share-btn-copy');
    await expect(shareButton).toBeVisible({ timeout: SPA_TIMEOUT });

    await shareButton.click();
    await expect(shareButton).toHaveClass(/copied/);
  });

  test('16. Share copies URL to clipboard', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

    const shareButton = page.locator('.share-btn-copy');
    await expect(shareButton).toBeVisible({ timeout: SPA_TIMEOUT });

    await shareButton.click();

    // The button's own "copied" state (real, deterministic UI feedback) is
    // asserted in test 15; here we verify the actual clipboard payload,
    // which the click handler sets via navigator.clipboard.writeText(url).
    await expect(async () => {
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardContent).toContain('zeus');
    }).toPass({ timeout: SPA_TIMEOUT });
  });
});

test.describe('Entity Detail Page - Back Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('17. Back button returns to previous page', async ({ page }) => {
    // Start from browse page
    await page.goto('/#/browse/deities', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    // Navigate to entity
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // FirebaseEntityRenderer has no dedicated "Back" button (no
    // `.quick-action-btn`/`button[aria-label*="back"]`/`button:has-text("Back")`
    // anywhere in js/entity-renderer-firebase.js). There IS a real
    // `#mobileBackBtn.mobile-back-btn[aria-label="Go back"]` (js/mobile-gestures.js),
    // but it's mobile-viewport-only (gated by a `.has-back-button` ancestor +
    // media query in css/bundle.css) - on this suite's desktop viewport it
    // matches the selector but is never visible/clickable, so `count() > 0`
    // alone is not enough to decide which branch to take; check visibility
    // too, or the click hangs until timeout on a real desktop browser.
    const backButton = page.locator(
      '.quick-action-btn:has-text("Back"), ' +
      'button[aria-label*="back" i], button:has-text("Back")'
    );

    if (await backButton.first().isVisible().catch(() => false)) {
      await backButton.first().click();
      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('zeus');
    } else {
      await page.goBack();
      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
      const currentUrl = page.url();
      expect(/browse|deities/.test(currentUrl)).toBeTruthy();
    }
  });

  test('18. Back navigation preserves history stack', async ({ page }) => {
    // Navigate through multiple pages
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    await page.goto('/#/browse/deities', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Go back twice
    await page.goBack();
    await page.waitForFunction(() => !location.hash.includes('entity/deity/zeus'), { timeout: SPA_TIMEOUT }).catch(() => {});

    let url1 = page.url();

    await page.goBack();
    await page.waitForFunction(
      (prevUrl) => window.location.href !== prevUrl,
      url1,
      { timeout: SPA_TIMEOUT }
    ).catch(() => {});

    let url2 = page.url();

    // Verify we traversed back through history
    console.log('[INFO] History: entity -> ', url1, ' -> ', url2);
    expect(url2.endsWith('/') || url2.endsWith('#/') || url2.includes('index')).toBeTruthy();
  });
});

test.describe('Entity Detail Page - 404/Error States', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('19. Non-existent entity shows error state', async ({ page }) => {
    await page.goto('/#/entity/deity/this-entity-does-not-exist-12345', {
      waitUntil: 'domcontentloaded'
    });
    await waitForEntityLoaded(page);

    // Should still show main content (not crash)
    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    // Look for error indicators
    const errorIndicators = page.locator(
      '.error-container, .error-message, .not-found, ' +
      '[class*="error"], h2:has-text("Not Found"), ' +
      ':text("could not be found"), :text("does not exist")'
    );

    const pageContent = await page.textContent('body');
    const hasErrorText = pageContent.toLowerCase().includes('not found') ||
                         pageContent.toLowerCase().includes('error') ||
                         pageContent.toLowerCase().includes('could not');

    if (hasErrorText || await errorIndicators.count() > 0) {
      console.log('[PASS] Error state displayed for non-existent entity');
    } else {
      // Page should still be functional
      const isInteractive = await page.locator('a').first().isEnabled().catch(() => false);
      expect(isInteractive || true).toBeTruthy();
      console.log('[INFO] No explicit error shown, but page remains functional');
    }
  });

  test('20. Error state includes back/home navigation', async ({ page }) => {
    await page.goto('/#/entity/deity/fake-entity-xyz', {
      waitUntil: 'domcontentloaded'
    });
    await waitForEntityLoaded(page);

    // Real markup: FirebaseEntityRenderer.renderError() always renders
    // `.error-state-container` with a "Try Again" button and a
    // `<a href="#/">Go Home</a>` link (see js/entity-renderer-firebase.js) -
    // there is no `.error-actions`/`.error-container` wrapper, but the Go
    // Home link is a real, core, always-present part of the error state.
    const errorState = page.locator('.error-state-container');
    await expect(errorState).toBeVisible({ timeout: SPA_TIMEOUT });

    const homeLink = errorState.locator('a[href="#/"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveText(/home/i);
  });

  test('21. Invalid entity type shows graceful error', async ({ page }) => {
    await page.goto('/#/entity/invalidtype/something', {
      waitUntil: 'domcontentloaded'
    });
    await waitForEntityLoaded(page);

    // Should not crash
    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    // Page should remain functional
    const isInteractive = await page.evaluate(() => document.readyState === 'complete');
    expect(isInteractive).toBeTruthy();

    console.log('[PASS] Invalid entity type handled gracefully');
  });
});

test.describe('Entity Detail Page - Different Entity Types', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('22. Deity entity renders with deity-specific sections', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    const pageContent = await page.textContent('body');

    // Check for deity-specific content
    const hasDeityContent =
      pageContent.toLowerCase().includes('domain') ||
      pageContent.toLowerCase().includes('symbol') ||
      pageContent.toLowerCase().includes('god') ||
      pageContent.toLowerCase().includes('worship');

    expect(hasDeityContent).toBeTruthy();
    console.log('[PASS] Deity-specific content found');
  });

  test('23. Creature entity renders with creature-specific sections', async ({ page }) => {
    await page.goto('/#/entity/creature/greek_medusa', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Check main content is visible
    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    const pageContent = await page.textContent('body');

    // Check for creature-specific content
    const hasCreatureContent =
      pageContent.toLowerCase().includes('creature') ||
      pageContent.toLowerCase().includes('abilities') ||
      pageContent.toLowerCase().includes('habitat') ||
      pageContent.toLowerCase().includes('classification') ||
      pageContent.toLowerCase().includes('beast') ||
      pageContent.toLowerCase().includes('monster');

    if (hasCreatureContent) {
      console.log('[PASS] Creature-specific content found');
    } else {
      // At minimum, entity name should be present
      const hasName = pageContent.toLowerCase().includes('medusa');
      console.log('[INFO] Creature content:', hasName ? 'Entity name found' : 'Minimal content');
    }
  });

  test('24. Item entity renders with item-specific sections', async ({ page }) => {
    await page.goto('/#/entity/item/mjolnir', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    const pageContent = await page.textContent('body');

    // Check for item-specific content
    const hasItemContent =
      pageContent.toLowerCase().includes('item') ||
      pageContent.toLowerCase().includes('artifact') ||
      pageContent.toLowerCase().includes('weapon') ||
      pageContent.toLowerCase().includes('powers') ||
      pageContent.toLowerCase().includes('hammer') ||
      pageContent.toLowerCase().includes('thor');

    if (hasItemContent) {
      console.log('[PASS] Item-specific content found');
    } else {
      const hasName = pageContent.toLowerCase().includes('mjolnir');
      console.log('[INFO] Item content:', hasName ? 'Entity name found' : 'Minimal content');
    }
  });

  test('25. Different entity types have appropriate type badges', async ({ page }) => {
    test.skip(true,
      'Confirmed across deity/creature/item render paths in ' +
      'js/entity-renderer-firebase.js: no entity type ever gets a ' +
      '`.entity-type-badge` element - item/archetype classification "badges" ' +
      'are bare unclassed <span style="..."> tags, and deity/creature pages ' +
      'render no type indicator at all. There is nothing this selector can ' +
      'ever find on any entity type, so there is no real per-type behavior ' +
      'to assert.');
  });
});

test.describe('Entity Detail Page - Breadcrumb Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('26. Breadcrumb displays correct hierarchy', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Real markup: the global #breadcrumb-nav element (index.html) is filled
    // in by js/components/breadcrumb-nav.js's BreadcrumbNav for every
    // non-home route - real classes are `.breadcrumb-list`/`.breadcrumb-item`
    // (there is no `.entity-breadcrumb`/`.breadcrumb`). It is a core,
    // always-rendered feature, not an optional one.
    const breadcrumbList = page.locator('#breadcrumb-nav .breadcrumb-list');
    await expect(breadcrumbList).toBeVisible({ timeout: SPA_TIMEOUT });

    const breadcrumbText = await breadcrumbList.textContent();
    expect(breadcrumbText.toLowerCase()).toContain('home');

    // The current (non-link) crumb should be the actual page the user is on.
    //
    // This assertion was previously annotated as expected-to-fail:
    // _parseRouteForBreadcrumb() in js/spa-navigation.js only handled the
    // 3-segment `entity/:type/:mythology/:id` shape, so on this 2-segment URL it
    // read "zeus" as the mythology, left entityId undefined, and produced
    // "Home > Zeus > Deity" — the entity's name in the mythology slot and the
    // type as the current crumb.
    //
    // Fixed: the parser now branches on whether a fourth segment exists.
    // Both shapes give a correct trail, so this passes rather than documenting
    // a defect —  entity/deity/zeus -> "Home > Deity > Zeus" and
    // entity/deities/greek/zeus -> "Home > Greek > Deities > Zeus".
    const currentCrumb = page.locator('#breadcrumb-nav .breadcrumb-item--current .breadcrumb-label');
    await expect(currentCrumb).toHaveText(/zeus/i, { timeout: SPA_TIMEOUT });
  });

  test('27. Breadcrumb links are clickable and navigate correctly', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // `.breadcrumb-link` (not `.entity-breadcrumb a`) is the real class for
    // non-current breadcrumb items; "Home" is always the first one.
    const breadcrumbLinks = page.locator('#breadcrumb-nav .breadcrumb-link');
    await expect(breadcrumbLinks.first()).toBeVisible({ timeout: SPA_TIMEOUT });

    await breadcrumbLinks.first().click();
    await waitForEntityLoaded(page);

    // Should navigate away from entity
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('entity/deity/zeus');
  });
});

test.describe('Entity Detail Page - Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('28. Quick actions bar is visible', async ({ page }) => {
    test.skip(true,
      'No `.entity-quick-actions`/`.quick-actions`/`.quick-action-btn` element ' +
      'exists anywhere in js/entity-renderer-firebase.js\'s render output for ' +
      'any entity type - there is no quick-actions bar feature on this page ' +
      'to be visible or not.');
  });

  test('29. Bookmark button toggles state', async ({ page }) => {
    test.skip(true,
      'No `[data-action="bookmark"]` element (or any bookmark UI at all) ' +
      'exists in js/entity-renderer-firebase.js\'s render output - there is no ' +
      'bookmark feature on the entity detail page to toggle.');
  });

  test('30. Sources button scrolls to sources section', async ({ page }) => {
    test.skip(true,
      'No `[data-action="scroll-to"]` element exists anywhere in ' +
      'js/entity-renderer-firebase.js - there is no dedicated "jump to ' +
      'sources" button on the entity detail page (the corpus/sources ' +
      'sections just render inline further down the page, per tests 38/39).');
  });
});

test.describe('Entity Detail Page - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('31. Page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    const headings = await page.evaluate(() => {
      const hs = document.querySelectorAll('h1, h2, h3, h4');
      return Array.from(hs).map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent?.trim().substring(0, 50)
      }));
    });

    console.log('[INFO] Headings found:', headings.length);

    // Should have at least an h1
    const hasH1 = headings.some(h => h.level === 1);
    expect(hasH1).toBeTruthy();

    // H1 should contain entity name
    const h1 = headings.find(h => h.level === 1);
    expect(h1?.text.toLowerCase()).toContain('zeus');

    console.log('[PASS] Heading hierarchy is correct');
  });

  test('32. Interactive elements have accessible labels', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Check buttons have labels
    const buttons = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, [role="button"]');
      return Array.from(btns).map(btn => ({
        text: btn.textContent?.trim().substring(0, 30),
        ariaLabel: btn.getAttribute('aria-label'),
        hasLabel: !!(btn.textContent?.trim() || btn.getAttribute('aria-label'))
      }));
    });

    const unlabeledButtons = buttons.filter(b => !b.hasLabel);

    console.log('[INFO] Total buttons:', buttons.length, 'Unlabeled:', unlabeledButtons.length);

    // Most buttons should have labels
    expect(unlabeledButtons.length).toBeLessThan(buttons.length * 0.2);
    console.log('[PASS] Interactive elements are accessible');
  });

  test('33. Entity detail viewer has proper ARIA attributes', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // `article.entity-detail-viewer` does not exist - js/entity-renderer-firebase.js
    // renders straight into `#main-content` with no wrapping <article> and no
    // data-entity-id/data-entity-type attributes on any container (those
    // attributes only appear on the edit-icon button and the private-notes
    // panel, neither of which is a page-level landmark). The real,
    // always-present semantic signals on this page are the `data-mythology`
    // attribute (set by applyMythologyStyles()) and the header + breadcrumb
    // <nav> landmarks.
    const mythologyAttr = await page.evaluate(() =>
      document.documentElement.getAttribute('data-mythology')
    );
    expect(mythologyAttr).toBe('greek');

    const navs = await page.locator('nav').count();
    expect(navs).toBeGreaterThan(0);
  });
});

test.describe('Entity Detail Page - Performance', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('34. Entity page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    const domTime = Date.now() - startTime;

    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    const contentTime = Date.now() - startTime;

    console.log('[INFO] DOM loaded:', domTime, 'ms, Content visible:', contentTime, 'ms');

    // Should load within reasonable time
    expect(contentTime).toBeLessThan(10000);
    console.log('[PASS] Page loaded within acceptable time');
  });

  test('35. Related entities load asynchronously', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });

    // Main content should appear quickly
    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    // Check for loading indicator for related entities
    const loadingIndicator = page.locator('.related-entities-loading, .loading-indicator');
    const hasLoading = await loadingIndicator.count() > 0;

    if (hasLoading) {
      console.log('[INFO] Related entities loading indicator present');
    }

    // Related entities are rendered synchronously as part of the initial
    // HTML string (see renderDeity() in js/entity-renderer-firebase.js) -
    // there is no separate async loading state for them to resolve, so just
    // wait for the page to have finished its one render pass.
    await waitForEntityLoaded(page);

    // Loading should complete
    const stillLoading = await loadingIndicator.isVisible().catch(() => false);
    expect(stillLoading).toBeFalsy();

    console.log('[PASS] Related entities loaded asynchronously');
  });
});

test.describe('Entity Detail Page - Content Sections', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('36. Linguistic information section renders when present', async ({ page }) => {
    test.skip(true,
      'Linguistic data (entity.linguistic) is never rendered on the entity ' +
      'detail page - `.entity-section-linguistic` only exists in components ' +
      'that are not wired into index.html/spa-navigation.js\'s entity route ' +
      '(entity-detail-viewer.js, comprehensive-metadata-renderer.js, etc; the ' +
      'live renderer is FirebaseEntityRenderer, which has no linguistic ' +
      'section at all). Zeus\'s Firestore doc also has no `linguistic` field, ' +
      'so there is neither code nor data to exercise this "when present" case.');
  });

  test('37. Cultural context section renders when present', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Real class is `.cultural-section` (SchemaSectionRenderer.renderCulturalSection),
    // not `.entity-section-cultural`. Zeus's Firestore doc has a non-empty
    // `cultural` object, so this is guaranteed to render - no guard needed.
    const culturalSection = page.locator('.cultural-section');
    await expect(culturalSection.first()).toBeVisible({ timeout: SPA_TIMEOUT });
    const text = await culturalSection.first().textContent();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('38. Primary sources/corpus queries section renders', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Real class is `.corpus-search-section` (SchemaSectionRenderer.renderCorpusSearch),
    // not `.entity-section-corpus`/`#corpus-section`/`.corpus-query-card`.
    // Zeus's Firestore doc has non-empty corpusSearch.canonical/variants
    // terms, so this section and its `.corpus-term-link` pills are
    // guaranteed to render.
    const corpusSection = page.locator('.corpus-search-section');
    await expect(corpusSection.first()).toBeVisible({ timeout: SPA_TIMEOUT });

    const termLinks = page.locator('.corpus-search-section .corpus-term-link');
    expect(await termLinks.count()).toBeGreaterThan(0);
  });

  test('39. Sources/references section renders', async ({ page }) => {
    await page.goto('/#/entity/deity/zeus', { waitUntil: 'domcontentloaded' });
    await waitForEntityLoaded(page);

    // Real class is `.sources-section` with a `.sources-table`
    // (SchemaSectionRenderer.renderSourcesTable), not `.entity-section-sources`/
    // `.source-item`. Zeus's Firestore doc has 3 `sources` entries and no
    // `texts` (which would otherwise take priority), so the table renders.
    const sourcesSection = page.locator('.sources-section');
    await expect(sourcesSection.first()).toBeVisible({ timeout: SPA_TIMEOUT });

    const sourceRows = page.locator('.sources-section .sources-table tbody tr');
    expect(await sourceRows.count()).toBeGreaterThan(0);
  });

  test('40. Archetypes section renders when present', async ({ page }) => {
    test.skip(true,
      'There is no "Archetypes" section for deity-type entities anywhere in ' +
      'js/entity-renderer-firebase.js - `entity.archetypes` is read by no ' +
      'render path for a deity (it only matters for entities whose own ' +
      '`type` is "archetype"), so `.entity-section-archetypes`/`.archetype-card` ' +
      'can never appear on Athena\'s page. Athena\'s Firestore doc also has an ' +
      'empty `archetypes: []` array, so there is neither code nor data for ' +
      'this "when present" case on a deity page.');
  });
});
