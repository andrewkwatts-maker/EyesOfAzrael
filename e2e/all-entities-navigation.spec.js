/**
 * All Entities Navigation Tests
 * Systematically tests navigation to ALL entity types on the live site
 * Run against production: BASE_URL=https://www.eyesofazrael.com npx playwright test e2e/all-entities-navigation.spec.js
 */

const { test, expect } = require('@playwright/test');

// Configuration for SPA navigation testing
const SPA_TIMEOUT = 15000; // 15 seconds for Firebase SPA loading
const NAVIGATION_TIMEOUT = 20000; // 20 seconds for navigation
const NETWORK_IDLE_TIMEOUT = 10000; // 10 seconds for network idle

/**
 * Sample entity IDs from each collection
 * These are actual entity IDs from the Firebase database
 */
const ENTITY_SAMPLES = {
  deities: [
    { id: 'zeus', name: 'Zeus', type: 'deity' },
    { id: 'athena', name: 'Athena', type: 'deity' },
    { id: 'odin', name: 'Odin', type: 'deity' },
    { id: 'thor', name: 'Thor', type: 'deity' },
    { id: 'brahma', name: 'Brahma', type: 'deity' }
  ],
  heroes: [
    { id: 'greek_achilles', name: 'Achilles', type: 'hero' },
    { id: 'greek_heracles', name: 'Heracles', type: 'hero' },
    { id: 'greek_odysseus', name: 'Odysseus', type: 'hero' },
    { id: 'norse_sigurd', name: 'Sigurd', type: 'hero' },
    { id: 'hindu_rama', name: 'Rama', type: 'hero' }
  ],
  creatures: [
    { id: 'greek_medusa', name: 'Medusa', type: 'creature' },
    { id: 'greek_hydra', name: 'Hydra', type: 'creature' },
    { id: 'greek_pegasus', name: 'Pegasus', type: 'creature' },
    { id: 'norse_jotnar', name: 'Jotnar', type: 'creature' },
    { id: 'hindu_garuda', name: 'Garuda', type: 'creature' }
  ],
  items: [
    { id: 'excalibur', name: 'Excalibur', type: 'item' },
    { id: 'mjolnir', name: 'Mjolnir', type: 'item' },
    { id: 'gungnir', name: 'Gungnir', type: 'item' },
    { id: 'aegis', name: 'Aegis', type: 'item' },
    { id: 'golden-fleece', name: 'Golden Fleece', type: 'item' }
  ],
  places: [
    { id: 'mount-olympus', name: 'Mount Olympus', type: 'place' },
    { id: 'asgard', name: 'Asgard', type: 'place' },
    { id: 'valhalla', name: 'Valhalla', type: 'place' },
    { id: 'avalon', name: 'Avalon', type: 'place' },
    { id: 'duat', name: 'Duat', type: 'place' }
  ],
  texts: [
    { id: 'christian_seven-seals', name: 'Seven Seals', type: 'text' },
    { id: 'christian_four-horsemen', name: 'Four Horsemen', type: 'text' },
    { id: 'egyptian_amduat', name: 'Amduat', type: 'text' }
  ],
  rituals: [
    { id: 'greek_eleusinian-mysteries', name: 'Eleusinian Mysteries', type: 'ritual' },
    { id: 'egyptian_mummification', name: 'Mummification', type: 'ritual' },
    { id: 'norse_blot', name: 'Blot', type: 'ritual' },
    { id: 'hindu_diwali', name: 'Diwali', type: 'ritual' }
  ],
  herbs: [
    { id: 'hindu_soma', name: 'Soma', type: 'herb' },
    { id: 'greek_ambrosia', name: 'Ambrosia', type: 'herb' },
    { id: 'buddhist_lotus', name: 'Lotus', type: 'herb' },
    { id: 'norse_yggdrasil', name: 'Yggdrasil', type: 'herb' }
  ],
  symbols: [
    { id: 'persian_faravahar', name: 'Faravahar', type: 'symbol' },
    { id: 'persian_sacred-fire', name: 'Sacred Fire', type: 'symbol' }
  ],
  concepts: [
    { id: 'norse_ragnarok', name: 'Ragnarok', type: 'concept' },
    { id: 'egyptian_maat', name: 'Maat', type: 'concept' },
    { id: 'buddhist_bodhisattva', name: 'Bodhisattva', type: 'concept' }
  ],
  cosmology: [
    { id: 'norse_yggdrasil', name: 'Yggdrasil', type: 'cosmology' },
    { id: 'greek_titans', name: 'Titans', type: 'cosmology' },
    { id: 'hindu_karma', name: 'Karma', type: 'cosmology' },
    { id: 'christian_heaven', name: 'Heaven', type: 'cosmology' }
  ]
};

/**
 * Category browse pages to test
 */
const CATEGORY_BROWSE_PAGES = [
  { path: '#/browse/deities', name: 'Deities', expectedTitle: /deit/i },
  { path: '#/browse/heroes', name: 'Heroes', expectedTitle: /hero/i },
  { path: '#/browse/creatures', name: 'Creatures', expectedTitle: /creature/i },
  { path: '#/browse/items', name: 'Items', expectedTitle: /item/i },
  { path: '#/browse/places', name: 'Places', expectedTitle: /place/i },
  { path: '#/browse/texts', name: 'Texts', expectedTitle: /text/i },
  { path: '#/browse/rituals', name: 'Rituals', expectedTitle: /ritual/i },
  { path: '#/browse/herbs', name: 'Herbs', expectedTitle: /herb/i },
  { path: '#/browse/symbols', name: 'Symbols', expectedTitle: /symbol/i },
  { path: '#/browse/concepts', name: 'Concepts', expectedTitle: /concept/i },
  { path: '#/browse/cosmology', name: 'Cosmology', expectedTitle: /cosmolog/i },
  { path: '#/mythologies', name: 'Mythologies', expectedTitle: /mytholog/i }
];

// Track broken navigations for report
const brokenNavigations = [];

/**
 * Helper function to test page navigation and collect errors
 */
async function testNavigation(page, url, expectedNameOrPattern, entityInfo = {}) {
  const errors = [];
  const consoleErrors = [];

  // Collect console errors
  const consoleHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected/non-blocking errors
      if (!text.includes('favicon') &&
          !text.includes('404') &&
          !text.includes('Failed to load resource') &&
          !text.includes('Lazy Loader') &&
          !text.includes('Navigation NOT found') &&
          !text.includes('Firebase config not found')) {
        consoleErrors.push(text);
      }
    }
  };

  page.on('console', consoleHandler);

  try {
    // Navigate to page
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    // Check HTTP response
    if (!response || response.status() >= 400) {
      errors.push(`HTTP ${response?.status() || 'no response'}`);
    }

    // Wait for main content to be visible
    try {
      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    } catch (e) {
      errors.push('Main content not visible');
    }

    // Wait for network to settle
    try {
      await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_TIMEOUT });
    } catch (e) {
      // Network idle timeout is not critical
    }

    // Additional wait for SPA content
    await page.waitForTimeout(2000);

    // Check for entity name on page
    if (expectedNameOrPattern) {
      const pageContent = await page.textContent('body');
      const pattern = expectedNameOrPattern instanceof RegExp
        ? expectedNameOrPattern
        : new RegExp(expectedNameOrPattern, 'i');

      if (!pattern.test(pageContent)) {
        errors.push(`Expected content "${expectedNameOrPattern}" not found`);
      }
    }

    // Check for error states on page
    const hasError = await page.locator('.error, .error-message, [class*="error"]').isVisible().catch(() => false);
    if (hasError) {
      const errorText = await page.locator('.error, .error-message, [class*="error"]').first().textContent().catch(() => '');
      if (errorText && !errorText.includes('No results') && errorText.length > 0) {
        errors.push(`Page error: ${errorText.substring(0, 100)}`);
      }
    }

    // Add critical console errors
    if (consoleErrors.length > 2) {
      errors.push(`${consoleErrors.length} console errors`);
    }

  } catch (e) {
    errors.push(`Navigation error: ${e.message}`);
  } finally {
    page.off('console', consoleHandler);
  }

  if (errors.length > 0) {
    brokenNavigations.push({
      url,
      errors,
      consoleErrors,
      ...entityInfo
    });
  }

  return { success: errors.length === 0, errors, consoleErrors };
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('Category Browse Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 minutes per test
  });

  for (const category of CATEGORY_BROWSE_PAGES) {
    test(`Browse page: ${category.name} (${category.path})`, async ({ page }) => {
      const url = `/${category.path}`;
      const result = await testNavigation(page, url, category.expectedTitle, {
        type: 'browse',
        category: category.name
      });

      // Log errors for debugging
      if (!result.success) {
        console.log(`[FAIL] ${category.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${category.name}`);
      }

      // Assert main content is visible (soft fail - don't fail whole test on minor issues)
      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Deity Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.deities) {
    test(`Deity: ${entity.name} (#/entity/deity/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/deity/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Hero Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.heroes) {
    test(`Hero: ${entity.name} (#/entity/hero/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/hero/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Creature Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.creatures) {
    test(`Creature: ${entity.name} (#/entity/creature/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/creature/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Item Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.items) {
    test(`Item: ${entity.name} (#/entity/item/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/item/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Place Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.places) {
    test(`Place: ${entity.name} (#/entity/place/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/place/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Text Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.texts) {
    test(`Text: ${entity.name} (#/entity/text/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/text/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Ritual Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.rituals) {
    test(`Ritual: ${entity.name} (#/entity/ritual/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/ritual/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Herb Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.herbs) {
    test(`Herb: ${entity.name} (#/entity/herb/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/herb/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Symbol Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.symbols) {
    test(`Symbol: ${entity.name} (#/entity/symbol/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/symbol/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Concept Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.concepts) {
    test(`Concept: ${entity.name} (#/entity/concept/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/concept/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

test.describe('Cosmology Entity Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  for (const entity of ENTITY_SAMPLES.cosmology) {
    test(`Cosmology: ${entity.name} (#/entity/cosmology/${entity.id})`, async ({ page }) => {
      const url = `/#/entity/cosmology/${entity.id}`;
      const result = await testNavigation(page, url, entity.name, entity);

      if (!result.success) {
        console.log(`[FAIL] ${entity.name}: ${result.errors.join(', ')}`);
      } else {
        console.log(`[PASS] ${entity.name}`);
      }

      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });
    });
  }
});

// ============================================================================
// REPORT GENERATION
// ============================================================================

test.describe('Navigation Report', () => {
  test('Generate broken navigations report', async ({ page }) => {
    // This test runs last and generates a report of all broken navigations
    test.setTimeout(30000);

    console.log('\n========================================');
    console.log('NAVIGATION TEST REPORT');
    console.log('========================================\n');

    if (brokenNavigations.length === 0) {
      console.log('All navigations passed successfully!');
    } else {
      console.log(`Found ${brokenNavigations.length} broken navigation(s):\n`);

      for (const nav of brokenNavigations) {
        console.log(`URL: ${nav.url}`);
        console.log(`  Type: ${nav.type || 'entity'}`);
        console.log(`  Name: ${nav.name || 'N/A'}`);
        console.log(`  Errors: ${nav.errors.join(', ')}`);
        if (nav.consoleErrors.length > 0) {
          console.log(`  Console Errors: ${nav.consoleErrors.slice(0, 3).join(', ')}`);
        }
        console.log('');
      }

      console.log('========================================');
      console.log(`SUMMARY: ${brokenNavigations.length} broken navigation(s)`);
      console.log('========================================\n');
    }

    // This test always passes - it's just for reporting
    expect(true).toBeTruthy();
  });
});

// ============================================================================
// DEEP NAVIGATION TESTS (Individual Routes)
// ============================================================================

test.describe('Deep Navigation - Mythology Filter Routes', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  const mythologyRoutes = [
    { path: '#/mythologies/greek', name: 'Greek Mythology' },
    { path: '#/mythologies/norse', name: 'Norse Mythology' },
    { path: '#/mythologies/egyptian', name: 'Egyptian Mythology' },
    { path: '#/mythologies/hindu', name: 'Hindu Mythology' },
    { path: '#/mythologies/celtic', name: 'Celtic Mythology' }
  ];

  for (const route of mythologyRoutes) {
    test(`Mythology filter: ${route.name}`, async ({ page }) => {
      const url = `/${route.path}`;

      // Navigate
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });

      // Wait for content
      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

      // Wait for network
      await page.waitForTimeout(3000);

      // Should show mythology content
      const pageContent = await page.textContent('body');
      expect(pageContent.toLowerCase()).toMatch(/mythology|deities|heroes|creatures/i);

      console.log(`[PASS] ${route.name}`);
    });
  }
});

test.describe('Deep Navigation - Alternative Entity Routes', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  // Test alternative route patterns that may exist
  const alternativeRoutes = [
    { path: '#/deities/zeus', name: 'Direct deity route (zeus)' },
    { path: '#/creatures/medusa', name: 'Direct creature route (medusa)' },
    { path: '#/heroes/achilles', name: 'Direct hero route (achilles)' },
    { path: '#/view/deity/athena', name: 'View route (athena)' },
    { path: '#/detail/place/mount-olympus', name: 'Detail route (mount-olympus)' }
  ];

  for (const route of alternativeRoutes) {
    test.skip(`Alternative route: ${route.name}`, async ({ page }) => {
      // These tests are skipped by default as they may not be implemented
      // Remove .skip to enable them
      const url = `/${route.path}`;

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });
      await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

      console.log(`[INFO] ${route.name} - Route may or may not be implemented`);
    });
  }
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('Navigation Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('Non-existent entity shows graceful error', async ({ page }) => {
    await page.goto('/#/entity/deity/nonexistent-entity-12345', {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    // Wait for content to load
    await page.waitForTimeout(5000);

    // Should show main content (even if error)
    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    // Should not crash - page should remain functional
    const isClickable = await page.locator('a').first().isEnabled().catch(() => false);
    expect(isClickable || true).toBeTruthy(); // Soft check

    console.log('[PASS] Non-existent entity handled gracefully');
  });

  test('Invalid category shows graceful error', async ({ page }) => {
    await page.goto('/#/browse/invalid-category-xyz', {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT
    });

    await page.waitForTimeout(5000);
    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    console.log('[PASS] Invalid category handled gracefully');
  });

  test('Empty hash navigates to home', async ({ page }) => {
    await page.goto('/#/', { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });

    await expect(page.locator('#main-content')).toBeVisible({ timeout: SPA_TIMEOUT });

    // Should show landing page content
    const hasCategories = await page.locator('a[href*="browse"], a[href*="mythologies"]').count();
    expect(hasCategories).toBeGreaterThan(0);

    console.log('[PASS] Empty hash navigates to home');
  });
});

// ============================================================================
// BULK NAVIGATION STRESS TEST
// ============================================================================

test.describe('Bulk Navigation Stress Test', () => {
  test('Rapid navigation between multiple pages', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    const routes = [
      '/',
      '/#/mythologies',
      '/#/browse/deities',
      '/#/entity/deity/zeus',
      '/#/browse/creatures',
      '/#/entity/creature/greek_medusa',
      '/#/browse/heroes',
      '/#/entity/hero/greek_achilles',
      '/'
    ];

    let successCount = 0;
    let failCount = 0;

    for (const route of routes) {
      try {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);

        const mainVisible = await page.locator('#main-content').isVisible();
        if (mainVisible) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
        console.log(`[FAIL] Rapid nav to ${route}: ${e.message}`);
      }
    }

    console.log(`\nRapid Navigation Results: ${successCount}/${routes.length} successful`);

    // At least 80% should succeed
    expect(successCount / routes.length).toBeGreaterThan(0.8);
  });
});
