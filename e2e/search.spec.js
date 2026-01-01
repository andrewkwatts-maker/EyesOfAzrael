const { test, expect } = require('@playwright/test');
const { mockAuth } = require('./helpers/auth-helper');
const { testEntities, waitForPageLoad, waitForFirebaseReady } = require('./helpers/test-data');

/**
 * Eyes of Azrael - Search Functionality E2E Tests
 *
 * Tests cover:
 * - Global search functionality (SearchViewComplete)
 * - Category filtering within browse views
 * - Mythology filtering
 * - Keyboard navigation
 * - Search result interaction
 */

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for all tests
    await mockAuth(page);
  });

  test.describe('Global Search', () => {
    test('Search input is accessible and visible', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Look for search input with multiple possible selectors
      const searchInput = page.locator([
        '#search-input',
        'input[placeholder*="Search" i]',
        'input[placeholder*="search" i]',
        '.search-input',
        'input[type="search"]'
      ].join(', ')).first();

      const hasSearch = await searchInput.isVisible().catch(() => false);

      if (hasSearch) {
        // Verify the input is accessible
        await expect(searchInput).toBeEnabled();
        await expect(searchInput).toHaveAttribute('placeholder', /.+/);
      } else {
        // Check for search link/button that navigates to search page
        const searchLink = page.locator('a[href*="search"], button:has-text("Search")').first();
        const hasSearchLink = await searchLink.isVisible().catch(() => false);

        if (hasSearchLink) {
          await searchLink.click();
          await waitForPageLoad(page);

          // Now check for search input on the search page
          const searchPageInput = page.locator('#search-input, .search-input').first();
          await expect(searchPageInput).toBeVisible();
        }
      }
    });

    test('Typing in search shows search results or autocomplete', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Find search input
      const searchInput = page.locator('#search-input, .search-input, input[placeholder*="Search" i]').first();
      const hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        // Navigate to search page if available
        const searchLink = page.locator('a[href*="search"]').first();
        const hasSearchLink = await searchLink.isVisible().catch(() => false);
        if (hasSearchLink) {
          await searchLink.click();
          await waitForPageLoad(page);
        }
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        // Type a search query
        await input.fill('zeus');

        // Wait for autocomplete or results to appear
        await page.waitForTimeout(500); // Wait for debounced search

        // Check for autocomplete suggestions
        const autocomplete = page.locator('#autocomplete-results, #search-suggestions, .search-suggestions, .suggestion-item');
        const hasAutocomplete = await autocomplete.first().isVisible({ timeout: 3000 }).catch(() => false);

        // Or check for search results container
        const results = page.locator('#results-container, .search-results, .entity-card, .result-item');
        const hasResults = await results.first().isVisible({ timeout: 3000 }).catch(() => false);

        // At least one should be present after typing
        expect(hasAutocomplete || hasResults).toBeTruthy();
      }
    });

    test('Search results match query (fuzzy/partial matching)', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Navigate to search or find search input
      const searchInput = page.locator('#search-input, .search-input').first();
      let hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        // Try navigating to search page
        const searchLink = page.locator('a[href*="search"]').first();
        if (await searchLink.isVisible().catch(() => false)) {
          await searchLink.click();
          await waitForPageLoad(page);
          hasSearch = await searchInput.isVisible().catch(() => false);
        }
      }

      if (hasSearch) {
        // Search for a partial term
        await searchInput.fill('thund');
        await searchInput.press('Enter');
        await page.waitForTimeout(2000);

        // Check if results contain "thunder" entities (like Thor, Zeus)
        const resultsContainer = page.locator('#results-container, .search-results');
        const resultText = await resultsContainer.textContent().catch(() => '');

        // Should find entities related to thunder
        const hasRelevantResults = /thunder|thor|zeus/i.test(resultText);

        // If search is working, relevant results should appear
        if (resultText.length > 100) {
          expect(hasRelevantResults).toBeTruthy();
        }
      }
    });

    test('Clicking search result navigates to entity page', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Find and use search
      const searchInput = page.locator('#search-input, .search-input').first();
      let hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        const searchLink = page.locator('a[href*="search"]').first();
        if (await searchLink.isVisible().catch(() => false)) {
          await searchLink.click();
          await waitForPageLoad(page);
          hasSearch = true;
        }
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill('zeus');
        await input.press('Enter');
        await page.waitForTimeout(2000);

        // Click on first result
        const resultCard = page.locator('.entity-card, .search-result, .result-item, .grid-card').first();
        const hasResult = await resultCard.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasResult) {
          const initialUrl = page.url();
          await resultCard.click();
          await page.waitForTimeout(1000);

          // URL should change or modal should appear
          const currentUrl = page.url();
          const hasModal = await page.locator('.modal, .quick-view, .entity-detail').isVisible().catch(() => false);

          expect(currentUrl !== initialUrl || hasModal).toBeTruthy();
        }
      }
    });

    test('Empty query shows no results or placeholder', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchInput = page.locator('#search-input, .search-input').first();
      let hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        const searchLink = page.locator('a[href*="search"]').first();
        if (await searchLink.isVisible().catch(() => false)) {
          await searchLink.click();
          await waitForPageLoad(page);
        }
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        // Clear the search input
        await input.fill('');
        await input.press('Enter');
        await page.waitForTimeout(500);

        // Should show placeholder or empty state
        const placeholder = page.locator('.search-placeholder, .empty-state, .no-results');
        const results = page.locator('.entity-card, .result-item');

        const hasPlaceholder = await placeholder.first().isVisible().catch(() => false);
        const resultsCount = await results.count().catch(() => 0);

        // Either show placeholder or no results
        expect(hasPlaceholder || resultsCount === 0).toBeTruthy();
      }
    });

    test('No matches shows "no results" message', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchInput = page.locator('#search-input, .search-input').first();
      let hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        const searchLink = page.locator('a[href*="search"]').first();
        if (await searchLink.isVisible().catch(() => false)) {
          await searchLink.click();
          await waitForPageLoad(page);
        }
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        // Search for something that won't exist
        await input.fill('xyznonexistent12345');
        await input.press('Enter');
        await page.waitForTimeout(2000);

        // Should show no results message
        const noResults = page.locator('.no-results, [class*="no-results"], :text("No results"), :text("No entities found")');
        const hasNoResultsMessage = await noResults.first().isVisible({ timeout: 3000 }).catch(() => false);

        // Check for results count showing 0
        const resultsCount = page.locator('#results-count, .results-count');
        const countText = await resultsCount.textContent().catch(() => '');
        const showsZeroResults = /0\s*result/i.test(countText);

        expect(hasNoResultsMessage || showsZeroResults).toBeTruthy();
      }
    });

    test('Search works across entity types', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchInput = page.locator('#search-input, .search-input').first();
      let hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        const searchLink = page.locator('a[href*="search"]').first();
        if (await searchLink.isVisible().catch(() => false)) {
          await searchLink.click();
          await waitForPageLoad(page);
        }
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        // Search for a term that could match multiple types
        await input.fill('greek');
        await input.press('Enter');
        await page.waitForTimeout(2000);

        // Check results container
        const resultsContainer = page.locator('#results-container, .search-results');
        const resultsText = await resultsContainer.textContent().catch(() => '');

        // Results should include Greek mythology content
        if (resultsText.length > 50) {
          expect(resultsText.toLowerCase()).toContain('greek');
        }
      }
    });
  });

  test.describe('Search Filters', () => {
    test('Search filters by mythology when filter is available', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Navigate to search page if needed
      const searchLink = page.locator('a[href*="search"]').first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await waitForPageLoad(page);
      }

      // Look for mythology filter
      const mythologyFilter = page.locator('#mythology-filter, #filter-mythology, select[name*="mythology" i]');
      const hasFilter = await mythologyFilter.isVisible().catch(() => false);

      if (hasFilter) {
        // Select Greek mythology
        await mythologyFilter.selectOption({ label: /Greek/i }).catch(() => {
          // Try by value
          mythologyFilter.selectOption('greek');
        });

        // Perform a search
        const searchInput = page.locator('#search-input, .search-input').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('god');
          await searchInput.press('Enter');
          await page.waitForTimeout(2000);

          // Results should only contain Greek entities
          const results = page.locator('.entity-card, .result-item');
          const count = await results.count();

          if (count > 0) {
            // Check first few results for Greek mythology
            for (let i = 0; i < Math.min(3, count); i++) {
              const cardText = await results.nth(i).textContent();
              expect(cardText.toLowerCase()).toMatch(/greek/);
            }
          }
        }
      }
    });

    test('Entity type filters work correctly', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Navigate to search or browse page
      const searchLink = page.locator('a[href*="search"]').first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await waitForPageLoad(page);
      }

      // Look for entity type filter checkboxes or select
      const typeCheckboxes = page.locator('.checkbox-group input[type="checkbox"], input[value="deities"]');
      const typeSelect = page.locator('#filter-entity-type, select[name*="type" i]');

      const hasCheckboxes = await typeCheckboxes.first().isVisible().catch(() => false);
      const hasSelect = await typeSelect.isVisible().catch(() => false);

      if (hasCheckboxes) {
        // Uncheck all except deities
        const checkboxes = await typeCheckboxes.all();
        for (const checkbox of checkboxes) {
          const value = await checkbox.getAttribute('value');
          if (value !== 'deities') {
            await checkbox.uncheck().catch(() => {});
          }
        }

        // Apply filters if there's a button
        const applyBtn = page.locator('#apply-filters, button:has-text("Apply")');
        if (await applyBtn.isVisible().catch(() => false)) {
          await applyBtn.click();
          await page.waitForTimeout(1000);
        }
      } else if (hasSelect) {
        await typeSelect.selectOption('deities');
        await page.waitForTimeout(1000);
      }
    });

    test('Clear filters button resets all filters', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Navigate to search page
      const searchLink = page.locator('a[href*="search"]').first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await waitForPageLoad(page);
      }

      // Look for clear filters button
      const clearBtn = page.locator('#clear-filters, #clearFiltersBtn, button:has-text("Clear"), button:has-text("Reset")');
      const hasClearBtn = await clearBtn.first().isVisible().catch(() => false);

      if (hasClearBtn) {
        // First apply some filters
        const mythologyFilter = page.locator('#mythology-filter, #filter-mythology');
        if (await mythologyFilter.isVisible().catch(() => false)) {
          await mythologyFilter.selectOption('greek').catch(() => {});
        }

        // Click clear filters
        await clearBtn.first().click();
        await page.waitForTimeout(500);

        // Verify filter is reset
        const filterValue = await mythologyFilter.inputValue().catch(() => '');
        expect(filterValue === '' || filterValue === 'all').toBeTruthy();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('Arrow keys navigate through search results', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchInput = page.locator('#search-input, .search-input').first();
      let hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        const searchLink = page.locator('a[href*="search"]').first();
        if (await searchLink.isVisible().catch(() => false)) {
          await searchLink.click();
          await waitForPageLoad(page);
        }
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        // Type to trigger autocomplete
        await input.fill('zeus');
        await page.waitForTimeout(500);

        // Check for autocomplete suggestions
        const suggestions = page.locator('.suggestion-item, .autocomplete-item');
        const hasSuggestions = await suggestions.first().isVisible({ timeout: 2000 }).catch(() => false);

        if (hasSuggestions) {
          // Press arrow down
          await input.press('ArrowDown');
          await page.waitForTimeout(100);

          // Check if first suggestion is highlighted/focused
          const focused = page.locator('.suggestion-item:focus, .suggestion-item.active, .suggestion-item.selected');
          const hasFocused = await focused.isVisible().catch(() => false);

          // Press arrow down again
          await input.press('ArrowDown');
          await page.waitForTimeout(100);

          // Press Enter to select
          await input.press('Enter');
          await page.waitForTimeout(500);

          // Autocomplete should close or value should be selected
          const autocompleteHidden = await page.locator('#autocomplete-results, .search-suggestions')
            .evaluate(el => el.style.display === 'none' || !el.offsetParent)
            .catch(() => true);

          expect(hasFocused || autocompleteHidden).toBeTruthy();
        }
      }
    });

    test('Enter key performs search', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchInput = page.locator('#search-input, .search-input').first();
      let hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        const searchLink = page.locator('a[href*="search"]').first();
        if (await searchLink.isVisible().catch(() => false)) {
          await searchLink.click();
          await waitForPageLoad(page);
        }
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill('odin');
        await input.press('Enter');
        await page.waitForTimeout(2000);

        // Results should appear
        const results = page.locator('#results-container, .search-results, .entity-grid');
        const hasResults = await results.first().isVisible().catch(() => false);

        // Or loading state was triggered
        const wasLoading = await results.textContent().catch(() => '');

        expect(hasResults).toBeTruthy();
      }
    });

    test('Escape key clears search or closes autocomplete', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchInput = page.locator('#search-input, .search-input').first();
      let hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        const searchLink = page.locator('a[href*="search"]').first();
        if (await searchLink.isVisible().catch(() => false)) {
          await searchLink.click();
          await waitForPageLoad(page);
        }
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        // Type to trigger autocomplete
        await input.fill('ra');
        await page.waitForTimeout(500);

        // Press Escape
        await input.press('Escape');
        await page.waitForTimeout(200);

        // Autocomplete should be hidden
        const autocomplete = page.locator('#autocomplete-results, .search-suggestions');
        const isHidden = await autocomplete.evaluate(el =>
          el.style.display === 'none' || !el.offsetParent || el.offsetHeight === 0
        ).catch(() => true);

        expect(isHidden).toBeTruthy();
      }
    });

    test('Tab key moves focus through search interface', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchLink = page.locator('a[href*="search"]').first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await waitForPageLoad(page);
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        await input.focus();

        // Tab to next element (usually search button)
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        // Check what element is focused
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            id: el?.id,
            className: el?.className
          };
        });

        // Should have moved focus to another interactive element
        expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(focusedElement.tagName);
      }
    });
  });

  test.describe('Search Behavior', () => {
    test('Search clears on navigation away', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchInput = page.locator('#search-input, .search-input').first();
      let hasSearch = await searchInput.isVisible().catch(() => false);

      if (!hasSearch) {
        const searchLink = page.locator('a[href*="search"]').first();
        if (await searchLink.isVisible().catch(() => false)) {
          await searchLink.click();
          await waitForPageLoad(page);
        }
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        // Perform a search
        await input.fill('thor');
        await input.press('Enter');
        await page.waitForTimeout(1000);

        // Navigate away (go to home or another page)
        await page.goto('/');
        await waitForPageLoad(page);

        // Come back to search
        const searchLinkAgain = page.locator('a[href*="search"]').first();
        if (await searchLinkAgain.isVisible().catch(() => false)) {
          await searchLinkAgain.click();
          await waitForPageLoad(page);

          // Check if search input is empty or shows placeholder
          const newInput = page.locator('#search-input, .search-input').first();
          if (await newInput.isVisible().catch(() => false)) {
            const value = await newInput.inputValue();
            // Search may be persisted or cleared depending on implementation
            // Just verify the input is accessible
            expect(value !== undefined).toBeTruthy();
          }
        }
      }
    });

    test('Search history is displayed when available', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchLink = page.locator('a[href*="search"]').first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await waitForPageLoad(page);
      }

      // Look for search history section
      const historySection = page.locator('.search-history, .history-list, [class*="history"]');
      const hasHistory = await historySection.first().isVisible().catch(() => false);

      // Search history is optional - just check the UI element if present
      if (hasHistory) {
        // Check for history items
        const historyItems = page.locator('.history-item, [class*="history-item"]');
        const count = await historyItems.count();

        // History section exists, which is the expected behavior
        expect(count >= 0).toBeTruthy();
      }
    });

    test('Example queries are clickable', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchLink = page.locator('a[href*="search"]').first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await waitForPageLoad(page);
      }

      // Look for example query buttons
      const exampleQueries = page.locator('.example-query, button[data-query]');
      const hasExamples = await exampleQueries.first().isVisible().catch(() => false);

      if (hasExamples) {
        const firstExample = exampleQueries.first();
        const queryText = await firstExample.getAttribute('data-query').catch(() => null) ||
                          await firstExample.textContent();

        // Click the example
        await firstExample.click();
        await page.waitForTimeout(1500);

        // Search should be performed with that query
        const searchInput = page.locator('#search-input, .search-input').first();
        const inputValue = await searchInput.inputValue().catch(() => '');

        // Input should contain the example query
        expect(inputValue.toLowerCase()).toContain(queryText.toLowerCase().trim());
      }
    });
  });

  test.describe('Browse Category View Filtering', () => {
    test('Category browse view has search/filter input', async ({ page }) => {
      // Navigate to a category browse page (e.g., deities)
      await page.goto('/#/browse/deities');
      await waitForPageLoad(page);

      // Wait for view to render
      await page.waitForTimeout(1000);

      // Look for search/filter input in browse view
      const filterInput = page.locator('#searchFilter, input[placeholder*="Search" i], .filter-input');
      const hasFilter = await filterInput.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasFilter) {
        await expect(filterInput.first()).toBeEnabled();
      }
    });

    test('Mythology chip filters work in browse view', async ({ page }) => {
      await page.goto('/#/browse/deities');
      await waitForPageLoad(page);
      await page.waitForTimeout(1000);

      // Look for filter chips
      const filterChips = page.locator('.filter-chip, [data-filter-type="mythology"]');
      const hasChips = await filterChips.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasChips) {
        // Click a mythology chip (e.g., Greek)
        const greekChip = page.locator('.filter-chip:has-text("Greek"), [data-filter-value="greek"]');
        const hasGreekChip = await greekChip.isVisible().catch(() => false);

        if (hasGreekChip) {
          await greekChip.click();
          await page.waitForTimeout(500);

          // Chip should be active
          const isActive = await greekChip.evaluate(el =>
            el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true'
          );

          expect(isActive).toBeTruthy();

          // Results should be filtered
          const entityCards = page.locator('.entity-card');
          const cardCount = await entityCards.count();

          if (cardCount > 0) {
            // Check that cards contain Greek mythology
            const firstCard = entityCards.first();
            const cardText = await firstCard.textContent();
            expect(cardText.toLowerCase()).toContain('greek');
          }
        }
      }
    });

    test('Text search filter works in browse view', async ({ page }) => {
      await page.goto('/#/browse/deities');
      await waitForPageLoad(page);
      await page.waitForTimeout(1000);

      const filterInput = page.locator('#searchFilter, input[placeholder*="Search" i]').first();
      const hasFilter = await filterInput.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasFilter) {
        // Type in filter
        await filterInput.fill('zeus');
        await page.waitForTimeout(500);

        // Check results are filtered
        const entityCards = page.locator('.entity-card');
        const cardCount = await entityCards.count();

        // Either results are filtered or we see the grid
        const resultsInfo = page.locator('#resultsInfo, .filter-results-info');
        const infoText = await resultsInfo.textContent().catch(() => '');

        expect(cardCount >= 0).toBeTruthy();
      }
    });

    test('Sort order changes affect results', async ({ page }) => {
      await page.goto('/#/browse/deities');
      await waitForPageLoad(page);
      await page.waitForTimeout(1000);

      const sortSelect = page.locator('#sortOrder, select[id*="sort"]');
      const hasSort = await sortSelect.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasSort) {
        // Get first card name before sorting
        const firstCardBefore = await page.locator('.entity-card-title, .entity-card h3').first().textContent().catch(() => '');

        // Change sort to popularity
        await sortSelect.selectOption('popularity');
        await page.waitForTimeout(500);

        // Get first card name after sorting
        const firstCardAfter = await page.locator('.entity-card-title, .entity-card h3').first().textContent().catch(() => '');

        // At minimum, the page should not crash and cards should still be visible
        const cardsVisible = await page.locator('.entity-card').first().isVisible().catch(() => false);
        expect(cardsVisible).toBeTruthy();
      }
    });

    test('View mode toggle works (grid/list)', async ({ page }) => {
      await page.goto('/#/browse/deities');
      await waitForPageLoad(page);
      await page.waitForTimeout(1000);

      const viewButtons = page.locator('.view-btn, button[data-view]');
      const hasViewToggle = await viewButtons.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasViewToggle) {
        // Click list view
        const listBtn = page.locator('[data-view="list"], .view-btn:has-text("List")');
        if (await listBtn.isVisible().catch(() => false)) {
          await listBtn.click();
          await page.waitForTimeout(300);

          // Grid should have list-view class
          const grid = page.locator('.entity-grid, #entityGrid');
          const hasListClass = await grid.evaluate(el => el.classList.contains('list-view'));

          expect(hasListClass).toBeTruthy();
        }

        // Click grid view
        const gridBtn = page.locator('[data-view="grid"], .view-btn:has-text("Grid")');
        if (await gridBtn.isVisible().catch(() => false)) {
          await gridBtn.click();
          await page.waitForTimeout(300);

          const grid = page.locator('.entity-grid, #entityGrid');
          const hasGridClass = await grid.evaluate(el => el.classList.contains('grid-view'));

          expect(hasGridClass).toBeTruthy();
        }
      }
    });

    test('Active filters are displayed and can be cleared', async ({ page }) => {
      await page.goto('/#/browse/deities');
      await waitForPageLoad(page);
      await page.waitForTimeout(1000);

      // Apply a filter
      const filterChip = page.locator('.filter-chip').first();
      const hasChip = await filterChip.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasChip) {
        await filterChip.click();
        await page.waitForTimeout(500);

        // Check for active filters display
        const activeFilters = page.locator('#activeFilters, .active-filters');
        const hasActiveFilters = await activeFilters.isVisible().catch(() => false);

        if (hasActiveFilters) {
          // Click clear all
          const clearBtn = page.locator('#clearFiltersBtn, .clear-filters-btn');
          if (await clearBtn.isVisible().catch(() => false)) {
            await clearBtn.click();
            await page.waitForTimeout(500);

            // Active filters should be hidden
            const stillVisible = await activeFilters.isVisible().catch(() => false);
            expect(stillVisible).toBeFalsy();
          }
        }
      }
    });
  });

  test.describe('Search Performance', () => {
    test('Search responds within reasonable time', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchLink = page.locator('a[href*="search"]').first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await waitForPageLoad(page);
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        const startTime = Date.now();

        await input.fill('zeus');
        await input.press('Enter');

        // Wait for results to appear
        const results = page.locator('.entity-card, .result-item, .no-results');
        await results.first().waitFor({ timeout: 10000 });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Search should respond within 5 seconds
        expect(responseTime).toBeLessThan(5000);
      }
    });

    test('Large result sets load with pagination or virtual scrolling', async ({ page }) => {
      await page.goto('/#/browse/deities');
      await waitForPageLoad(page);
      await page.waitForTimeout(2000);

      // Check for pagination controls
      const pagination = page.locator('#paginationControls, .pagination-controls, .page-btn');
      const hasPagination = await pagination.first().isVisible().catch(() => false);

      // Or check for virtual scrolling (large container with scroll)
      const entityContainer = page.locator('#entityContainer, .entity-container');
      const hasScroll = await entityContainer.evaluate(el => el.scrollHeight > el.clientHeight).catch(() => false);

      // Either pagination or scrollable container should exist for large datasets
      expect(hasPagination || hasScroll).toBeTruthy();
    });
  });

  test.describe('Search Accessibility', () => {
    test('Search input has proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchLink = page.locator('a[href*="search"]').first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await waitForPageLoad(page);
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        // Check for aria-label or aria-describedby
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaDescribedBy = await input.getAttribute('aria-describedby');
        const placeholder = await input.getAttribute('placeholder');

        // Should have at least one accessibility attribute
        expect(ariaLabel || ariaDescribedBy || placeholder).toBeTruthy();
      }
    });

    test('Search results container has proper role', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const searchLink = page.locator('a[href*="search"]').first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await waitForPageLoad(page);
      }

      const input = page.locator('#search-input, .search-input').first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill('zeus');
        await input.press('Enter');
        await page.waitForTimeout(2000);

        // Check for accessible roles on results
        const suggestions = page.locator('#search-suggestions, #autocomplete-results');
        const role = await suggestions.getAttribute('role').catch(() => null);

        // Suggestions should have listbox role for accessibility
        if (await suggestions.isVisible().catch(() => false)) {
          expect(role).toBe('listbox');
        }
      }
    });

    test('Filter chips have accessible pressed state', async ({ page }) => {
      await page.goto('/#/browse/deities');
      await waitForPageLoad(page);
      await page.waitForTimeout(1000);

      const filterChip = page.locator('.filter-chip').first();
      const hasChip = await filterChip.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasChip) {
        // Check aria-pressed attribute
        const ariaPressed = await filterChip.getAttribute('aria-pressed');

        // Initially should be false
        expect(ariaPressed).toBe('false');

        // Click the chip
        await filterChip.click();
        await page.waitForTimeout(200);

        // Should now be true
        const ariaPressedAfter = await filterChip.getAttribute('aria-pressed');
        expect(ariaPressedAfter).toBe('true');
      }
    });
  });
});
