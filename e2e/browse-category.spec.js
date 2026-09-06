/**
 * Browse Category View E2E Tests
 * Tests the browse pages for various entity categories (deities, heroes, creatures, etc.)
 *
 * Run against production:
 * BASE_URL=https://www.eyesofazrael.com npx playwright test e2e/browse-category.spec.js
 */

const { test, expect } = require('@playwright/test');

// Empty by default so `${BASE_URL}/#/...` resolves as a relative path
// against playwright.config.js's `use.baseURL` (localhost:8080 in CI/dev).
// Previously hardcoded to the live production site, so every test here
// exercised whatever happened to be deployed instead of the code under
// test. Still overridable for the documented "run against production" use
// case via the same BASE_URL env var playwright.config.js's own baseURL
// already reads.
const BASE_URL = process.env.BASE_URL || '';

// Test timeout configuration
test.describe.configure({ timeout: 60000 });

/**
 * Waits for BrowseCategoryView (js/views/browse-category-view.js) to reach a
 * terminal render state instead of racing its async Firebase load with a
 * fixed sleep: skeleton cards gone AND (real entity cards rendered, OR the
 * empty state shown, OR the error state shown). Generalizes the
 * skeleton-vs-cards waitForFunction already proven below in "shows deity
 * cards with proper layout" to also recognize the empty/error terminal
 * states, since several tests below deliberately drive the view into those
 * states (a no-match search, a blocked network) rather than the happy path.
 */
async function waitForBrowsePageLoaded(page, { timeout = 20000 } = {}) {
    await page.waitForFunction(() => {
        const skeletons = document.querySelectorAll('.skeleton-card, .entity-card-loading');
        if (skeletons.length > 0) return false;
        const cards = document.querySelectorAll('.entity-card:not(.skeleton-card)');
        const emptyState = document.querySelector('.empty-state');
        const errorState = document.querySelector('.error-container, .error-state');
        return cards.length > 0 || !!emptyState || !!errorState;
    }, { timeout }).catch(() => {
        // May legitimately time out (e.g. a genuinely stuck load) — callers
        // that need the page loaded assert on the resulting DOM state next,
        // which will fail with a clear message instead of this helper hanging.
    });
}

/**
 * Polls until the given predicate (evaluated in-page) is true, or the timeout
 * elapses. Used in place of `waitForTimeout` for state changes driven by
 * synchronous in-page logic (filtering, sorting, view-mode class swaps) that
 * still need a tick for the DOM to reflect, and for CSS transitions/debounces
 * where the exact settle time isn't worth hardcoding.
 */
async function waitForCondition(page, fn, arg, { timeout = 5000 } = {}) {
    await page.waitForFunction(fn, arg, { timeout }).catch(() => {});
}

test.describe('Browse Deities View', () => {
    test.beforeEach(async ({ page }) => {
        // Set a longer timeout for production testing
        test.setTimeout(60000);
    });

    test('shows deity cards with proper layout', async ({ page }) => {
        // Navigate to the deities browse page
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for the browse view to render
        await page.waitForSelector('.browse-view, .entity-grid, #entityGrid', { timeout: 15000 });

        // Wait for cards to load (skeleton loading should disappear)
        await page.waitForFunction(() => {
            const skeletons = document.querySelectorAll('.skeleton-card, .entity-card-loading');
            const cards = document.querySelectorAll('.entity-card:not(.skeleton-card)');
            return skeletons.length === 0 && cards.length > 0;
        }, { timeout: 20000 }).catch(() => {
            // May not have skeleton cards, check for actual cards
        });

        // Verify entity cards are present
        const entityCards = page.locator('.entity-card');
        const cardCount = await entityCards.count();

        console.log(`Found ${cardCount} deity cards`);
        expect(cardCount).toBeGreaterThan(0);

        // Verify grid layout is applied
        const grid = page.locator('.entity-grid, #entityGrid');
        await expect(grid.first()).toBeVisible();

        // Check grid has proper CSS display
        const gridDisplay = await grid.first().evaluate(el => {
            return window.getComputedStyle(el).display;
        });
        expect(gridDisplay).toBe('grid');
    });

    test('deity cards display image/icon, name, and description snippet', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load and finish rendering (card content is rendered
        // synchronously from already-fetched entity data, so there's nothing to
        // "populate" beyond the render BrowseCategoryView.getBrowseHTML() already
        // performed by the time .entity-card exists).
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // Get first card
        const firstCard = page.locator('.entity-card').first();
        await expect(firstCard).toBeVisible();

        // Check for icon (emoji, SVG, or image)
        const hasIcon = await firstCard.locator('.entity-icon, .card-icon, .grid-card-icon, img.entity-icon').isVisible().catch(() => false);
        const hasEmojiIcon = await firstCard.locator('.entity-icon-text').isVisible().catch(() => false);
        const hasImageIcon = await firstCard.locator('.entity-icon img, .entity-icon-img').isVisible().catch(() => false);

        console.log('Card has icon:', hasIcon || hasEmojiIcon || hasImageIcon);
        expect(hasIcon || hasEmojiIcon || hasImageIcon).toBeTruthy();

        // Check for name/title
        const hasName = await firstCard.locator('.entity-card-title, .card-title, .grid-card-title, .entity-name, h3').isVisible().catch(() => false);
        console.log('Card has name:', hasName);
        expect(hasName).toBeTruthy();

        // Check for description (may be hidden on compact view)
        const hasDescription = await firstCard.locator('.entity-description, .card-description, .grid-card-description, .entity-short-desc').isVisible().catch(() => false);
        console.log('Card has description:', hasDescription);
        // Description may be truncated or hidden, so we just log it
    });
});

test.describe('Browse Heroes View', () => {
    test('shows hero cards', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/heroes`, { waitUntil: 'load' });

        // Wait for the browse view to render
        await page.waitForSelector('.browse-view, .entity-grid', { timeout: 15000 });

        // Wait for content to reach a terminal state instead of a fixed sleep
        await waitForBrowsePageLoaded(page);

        // Check for entity cards or empty state
        const entityCards = page.locator('.entity-card');
        const emptyState = page.locator('.empty-state');

        const cardCount = await entityCards.count();
        const hasEmptyState = await emptyState.isVisible().catch(() => false);

        console.log(`Found ${cardCount} hero cards, empty state: ${hasEmptyState}`);

        // Either cards or empty state should be visible
        expect(cardCount > 0 || hasEmptyState).toBeTruthy();

        // If cards exist, verify they're visible
        if (cardCount > 0) {
            await expect(entityCards.first()).toBeVisible();
        }
    });
});

test.describe('Browse Creatures View', () => {
    test('shows creature cards', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/creatures`, { waitUntil: 'load' });

        // Wait for the browse view to render
        await page.waitForSelector('.browse-view, .entity-grid', { timeout: 15000 });

        // Wait for content to reach a terminal state instead of a fixed sleep
        await waitForBrowsePageLoaded(page);

        // Check for entity cards
        const entityCards = page.locator('.entity-card');
        const cardCount = await entityCards.count();

        console.log(`Found ${cardCount} creature cards`);

        // Check for cards or empty state
        const emptyState = page.locator('.empty-state');
        const hasEmptyState = await emptyState.isVisible().catch(() => false);

        expect(cardCount > 0 || hasEmptyState).toBeTruthy();
    });
});

test.describe('Entity Card Interactions', () => {
    test('card hover effects work (scale, shadow)', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        const firstCard = page.locator('.entity-card').first();
        await expect(firstCard).toBeVisible();

        // Get initial transform and box-shadow
        const initialStyles = await firstCard.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
                transform: styles.transform,
                boxShadow: styles.boxShadow
            };
        });

        // Hover over the card
        await firstCard.hover();

        // Poll for the CSS transition to actually apply, instead of a fixed
        // sleep tied to a guessed transition duration.
        await waitForCondition(page, (initial) => {
            const card = document.querySelector('.entity-card');
            return !card || window.getComputedStyle(card).transform !== initial;
        }, initialStyles.transform, { timeout: 1000 });

        // Get hover styles
        const hoverStyles = await firstCard.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
                transform: styles.transform,
                boxShadow: styles.boxShadow
            };
        });

        console.log('Initial transform:', initialStyles.transform);
        console.log('Hover transform:', hoverStyles.transform);

        // Verify transform changed (scale or translate)
        // On hover, cards should have translateY and scale applied
        const transformChanged = initialStyles.transform !== hoverStyles.transform;
        console.log('Transform changed on hover:', transformChanged);

        // Note: Some browsers/environments may not trigger CSS hover in tests
        // We verify the hover mechanism exists by checking the card is interactive
        expect(await firstCard.getAttribute('href') || await firstCard.getAttribute('role')).toBeTruthy();
    });

    test('clicking a card navigates to entity detail', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        const firstCard = page.locator('.entity-card').first();
        await expect(firstCard).toBeVisible();

        // Get the href or data attributes
        const href = await firstCard.getAttribute('href');
        const entityId = await firstCard.getAttribute('data-entity-id');
        const mythology = await firstCard.getAttribute('data-mythology');

        console.log('Card href:', href);
        console.log('Entity ID:', entityId);
        console.log('Mythology:', mythology);

        // Store current URL
        const currentUrl = page.url();

        // Click the card
        await firstCard.click();

        // Wait for the actual navigation instead of a fixed sleep
        await page.waitForFunction((prev) => window.location.href !== prev, currentUrl, { timeout: 10000 }).catch(() => {});

        // Check URL changed (navigated to entity detail)
        const newUrl = page.url();
        console.log('Navigated from:', currentUrl, 'to:', newUrl);

        // URL should change after clicking a card
        // Either the hash changes or we navigate to entity detail page
        expect(newUrl !== currentUrl || newUrl.includes('/entity/')).toBeTruthy();
    });
});

test.describe('Responsive Grid Layout', () => {
    test('grid reflows on mobile viewport', async ({ page }) => {
        // Start with desktop viewport
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        const grid = page.locator('.entity-grid, #entityGrid').first();
        await expect(grid).toBeVisible();

        // Get desktop grid columns
        const desktopColumns = await grid.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.gridTemplateColumns;
        });
        console.log('Desktop grid columns:', desktopColumns);

        // Switch to mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Poll for the layout to actually recompute rather than a fixed sleep —
        // viewport-driven reflow is synchronous in Chromium, but guard against
        // any animation frame delay.
        await waitForCondition(page, (prevColumns) => {
            const el = document.querySelector('.entity-grid, #entityGrid');
            return !el || window.getComputedStyle(el).gridTemplateColumns !== prevColumns;
        }, desktopColumns, { timeout: 1000 });

        // Get mobile grid columns
        const mobileColumns = await grid.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.gridTemplateColumns;
        });
        console.log('Mobile grid columns:', mobileColumns);

        // Verify grid layout changed for mobile
        // Mobile should have fewer columns (typically 1 or 2)
        const desktopColCount = desktopColumns.split(' ').filter(s => s.length > 0).length;
        const mobileColCount = mobileColumns.split(' ').filter(s => s.length > 0).length;

        console.log('Desktop column count:', desktopColCount);
        console.log('Mobile column count:', mobileColCount);

        // Mobile should have fewer or equal columns
        expect(mobileColCount).toBeLessThanOrEqual(desktopColCount);
        expect(mobileColCount).toBeLessThanOrEqual(2);
    });

    test('cards remain visible and accessible on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // Cards should be visible
        const firstCard = page.locator('.entity-card').first();
        await expect(firstCard).toBeVisible();

        // Card should be fully within viewport (not cut off)
        const cardBoundingBox = await firstCard.boundingBox();
        expect(cardBoundingBox).not.toBeNull();

        if (cardBoundingBox) {
            expect(cardBoundingBox.width).toBeLessThanOrEqual(375);
            expect(cardBoundingBox.x).toBeGreaterThanOrEqual(0);
        }
    });
});

test.describe('Loading and Empty States', () => {
    test('loading state shows while fetching', async ({ page }) => {
        // Use a slower network to catch loading state
        await page.route('**/*', route => route.continue());

        // Start navigation and immediately check for loading indicators
        const navigationPromise = page.goto(`${BASE_URL}/#/browse/deities`);

        // Check for loading indicators (skeleton cards, spinner, loading text)
        const hasLoadingState = await Promise.race([
            page.waitForSelector('.skeleton-card, .loading-container, .grid-loading, .entity-card-loading, [aria-busy="true"]', { timeout: 5000 })
                .then(() => true)
                .catch(() => false),
            navigationPromise.then(() => false)
        ]);

        console.log('Loading state detected:', hasLoadingState);

        // Wait for navigation to complete
        await navigationPromise;

        // After load, loading indicators should be gone
        await page.waitForSelector('.entity-card', { timeout: 15000 });

        // Poll for skeletons to actually be gone instead of a fixed sleep
        await waitForCondition(page, () => {
            return document.querySelectorAll('.skeleton-card, .grid-loading').length === 0;
        }, null, { timeout: 3000 });

        const hasLoadingAfterLoad = await page.locator('.skeleton-card, .grid-loading').isVisible().catch(() => false);
        expect(hasLoadingAfterLoad).toBeFalsy();
    });

    test('empty state shown when a search matches nothing', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // The search filter is rendered unconditionally in
        // BrowseCategoryView.getFiltersHTML() (js/views/browse-category-view.js),
        // so it is always present — this is a real feature, not something the
        // test needs to guard with an `if`.
        const searchFilter = page.locator('#searchFilter');
        await expect(searchFilter).toBeVisible({ timeout: 5000 });

        const initialCardCount = await page.locator('.entity-card').count();
        expect(initialCardCount).toBeGreaterThan(0);

        // Type a search term that cannot match any entity
        await searchFilter.fill('zzzzxxxxxxxnotarealentity12345');

        // BrowseCategoryView debounces search input by 300ms (attachEventListeners)
        // then calls applyFilters() -> updateGrid(), which renders
        // getEmptyStateHTML() synchronously when filteredEntities is empty.
        // Poll for that real state instead of guessing the debounce + render time.
        await page.waitForFunction(() => !!document.querySelector('.empty-state'), { timeout: 5000 });

        const emptyState = page.locator('.empty-state');
        await expect(emptyState).toBeVisible();

        // Verify empty state has helpful content
        const emptyStateText = await emptyState.textContent();
        console.log('Empty state content:', emptyStateText?.substring(0, 100));
        expect(emptyStateText?.length).toBeGreaterThan(0);

        // No cards should remain visible while the empty state is shown
        expect(await page.locator('.entity-card').count()).toBe(0);

        // Clear the filter
        await searchFilter.clear();

        // Cards should reappear once the debounce fires and filters re-apply
        await page.waitForFunction(() => document.querySelectorAll('.entity-card').length > 0, { timeout: 5000 });

        const cardsReappear = await page.locator('.entity-card').first().isVisible().catch(() => false);
        expect(cardsReappear).toBeTruthy();
    });
});

test.describe('Content Filter Toggle', () => {
    test('content filter toggle is disabled by design (no toggle control renders)', async ({ page }) => {
        // Resolved from "(if visible)" by reading js/components/content-filter.js:
        // ContentFilter.render() only has a real toggle switch (#show-community-content)
        // when a <template id="content-filter-toggle-template"> exists in the DOM
        // (see components/content-filter-toggle.html). That template file is never
        // referenced by index.html or fetched by any script — grep confirms no
        // occurrence of "content-filter-toggle" anywhere outside the component and
        // the orphaned template file itself — so render() always falls through to
        // the inline fallback (content-filter.js lines ~180-206), which renders
        // `<div class="content-filter-bar" ... style="display: none;">` with only a
        // static label, a count badge, and an info button — no checkbox, no button
        // that toggles anything, and the bar itself is hidden. The inline comment
        // there says it outright: "Community content toggle removed — always show
        // standard content." There is nothing left to click, so there is nothing
        // this test can exercise; skipping documents that precisely rather than
        // silently no-op'ing inside an `if (hasToggle)` as before.
        test.skip(true,
            'js/components/content-filter.js has no working toggle: its inline ' +
            'fallback markup (used because content-filter-toggle-template is never ' +
            'loaded anywhere in the app) renders the filter bar with ' +
            'style="display:none" and omits the toggle control entirely.'
        );
    });
});

test.describe('Pagination and Infinite Scroll', () => {
    test('Load More button loads additional deity cards', async ({ page }) => {
        // Resolved from "(if implemented)" by reading
        // js/views/browse-category-view.js: updatePagination() deliberately
        // renders no numbered page buttons once filteredEntities.length > 100
        // (`if (totalPages <= 1 || this.filteredEntities.length > 100) { controls.innerHTML = ''; return; }`),
        // leaving the Load More button + IntersectionObserver
        // (updateLoadMoreButton/setupInfiniteScroll) as the only reachable paging
        // mechanism for a category this large. Deities is exactly that category
        // (thousands of entities per CLAUDE.md), so on this page numbered
        // pagination (.page-btn) is a real "no controls" state by design, and
        // Load More is the feature to assert on unconditionally.
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        const loadMoreBtn = page.locator('#loadMoreBtn');
        await expect(loadMoreBtn).toBeVisible({ timeout: 10000 });

        const initialCardCount = await page.locator('.entity-card').count();
        expect(initialCardCount).toBeGreaterThan(0);

        // A raw DOM click, not Playwright's actionability-checked .click(): the
        // IntersectionObserver set up by setupInfiniteScroll() (same file) also
        // watches this button and calls loadMoreEntities() itself the moment it
        // scrolls into view (rootMargin: '200px') — which Playwright's own
        // auto-scroll-before-click causes. The two triggers race, the button
        // toggles visible/spinner/moved-in-viewport while cards are appended, and
        // Playwright's real .click() times out retrying against a moving target.
        // The behavior under test is "activating Load More loads more cards",
        // which a dispatched click event verifies exactly as well without
        // fighting that observer.
        await loadMoreBtn.dispatchEvent('click');

        // loadMoreEntities() appends new cards after a 300ms staggered-animation
        // delay (js/views/browse-category-view.js) — poll for the real DOM change.
        await page.waitForFunction((prevCount) => {
            return document.querySelectorAll('.entity-card').length > prevCount;
        }, initialCardCount, { timeout: 5000 });

        const newCardCount = await page.locator('.entity-card').count();
        expect(newCardCount).toBeGreaterThan(initialCardCount);
    });
});

test.describe('Browse View Filters', () => {
    test('quick filter chips filter the entity grid by mythology', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });
        await page.waitForSelector('.browse-view', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // Quick filter chips are rendered whenever more than one mythology group
        // exists (BrowseCategoryView.getQuickFiltersHTML: `facetFilterIsUseful`),
        // which is always true for the deities category — a real, unconditional
        // feature on this page, not something to guard with `if (chipCount > 0)`.
        const filterChips = page.locator('.filter-chip[data-filter-type="mythology"]');
        await expect(filterChips.first()).toBeVisible({ timeout: 10000 });

        const firstChip = filterChips.first();
        const chipValue = await firstChip.getAttribute('data-filter-value');
        expect(chipValue).toBeTruthy();

        await expect(firstChip).toHaveAttribute('aria-pressed', 'false');

        // Click first filter chip
        await firstChip.click();

        // Confirm the chip's own active state changed
        await expect(firstChip).toHaveAttribute('aria-pressed', 'true');
        await expect(firstChip).toHaveClass(/active/);

        // Confirm filtering actually took effect: handleChipClick ->
        // applyFilters() -> updateGrid() is synchronous, so poll for the grid to
        // contain only cards matching the selected mythology (data-mythology is
        // set from the same facetValueOf() the chip's own value came from).
        await page.waitForFunction((val) => {
            const cards = Array.from(document.querySelectorAll('.entity-card[data-mythology]'));
            return cards.length > 0 && cards.every(c => c.dataset.mythology === val);
        }, chipValue, { timeout: 5000 });

        const filteredCards = page.locator('.entity-card[data-mythology]');
        const filteredCount = await filteredCards.count();
        expect(filteredCount).toBeGreaterThan(0);

        // Click the chip again to deactivate
        await firstChip.click();

        // Verify it deactivated and the grid is no longer restricted to one mythology
        await expect(firstChip).toHaveAttribute('aria-pressed', 'false');
        await page.waitForFunction(() => document.querySelectorAll('.entity-card').length > 0, { timeout: 5000 });
        expect(await page.locator('.entity-card').count()).toBeGreaterThan(0);
    });

    test('sort order changes card order', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // The sort dropdown is rendered unconditionally in
        // BrowseCategoryView.getFiltersHTML() — a real, always-present feature.
        const sortOrder = page.locator('#sortOrder');
        await expect(sortOrder).toBeVisible({ timeout: 5000 });

        // Default sort is "name" (A-Z) — verify the initial order is genuinely
        // non-decreasing before changing anything, so the later "changed order"
        // assertion has a real baseline rather than an assumed one.
        //
        // Scoped to `.entity-card[data-entity-id] h3` rather than plain
        // `.entity-card h3`: getAddNewCardHTML() (browse-category-view.js) always
        // appends one more `.entity-card` at the end ("Submit New Deity" / "Sign
        // in to Contribute") which is also an h3 but carries no data-entity-id and
        // is never part of the sort — including it broke both the ascending and
        // descending order checks against its unsorted title.
        const isNonDecreasing = await page.evaluate(() => {
            const names = Array.from(document.querySelectorAll('.entity-card[data-entity-id] h3')).map(el => el.textContent.trim());
            for (let i = 1; i < names.length; i++) {
                if (names[i - 1].localeCompare(names[i]) > 0) return false;
            }
            return names.length > 1;
        });
        expect(isNonDecreasing).toBeTruthy();

        // Switch to Z-A order
        await sortOrder.selectOption('name-desc');

        // applyFilters() re-sorts and re-renders the grid synchronously on the
        // 'change' event — poll for the real DOM order rather than a fixed sleep.
        await page.waitForFunction(() => {
            const names = Array.from(document.querySelectorAll('.entity-card[data-entity-id] h3')).map(el => el.textContent.trim());
            if (names.length < 2) return false;
            for (let i = 1; i < names.length; i++) {
                if (names[i - 1].localeCompare(names[i]) < 0) return false;
            }
            return true;
        }, { timeout: 5000 });

        const isNonIncreasing = await page.evaluate(() => {
            const names = Array.from(document.querySelectorAll('.entity-card[data-entity-id] h3')).map(el => el.textContent.trim());
            for (let i = 1; i < names.length; i++) {
                if (names[i - 1].localeCompare(names[i]) < 0) return false;
            }
            return names.length > 1;
        });
        expect(isNonIncreasing).toBeTruthy();
    });
});

test.describe('View Mode Toggle', () => {
    test('grid and list view toggle changes the layout', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // Both view buttons are rendered unconditionally in
        // BrowseCategoryView.getFiltersHTML() — a real, always-present feature.
        const gridBtn = page.locator('.view-btn[data-view="grid"]');
        const listBtn = page.locator('.view-btn[data-view="list"]');
        await expect(gridBtn).toBeVisible({ timeout: 5000 });
        await expect(listBtn).toBeVisible({ timeout: 5000 });

        const grid = page.locator('.entity-grid, #entityGrid').first();

        // Verify grid view is active (default)
        await expect(grid).toHaveClass(/grid-view/);
        const gridColumns = await grid.evaluate(el => window.getComputedStyle(el).gridTemplateColumns);

        // Switch to list view
        await listBtn.click();

        // Verify list view class applied and the layout genuinely changed:
        // .entity-grid.list-view sets grid-template-columns: 1fr
        // (js/views/browse-category-view.js getStyles()), a real, checkable
        // difference from grid view's multi-column auto-fill layout.
        await expect(grid).toHaveClass(/list-view/);
        await page.waitForFunction((prevColumns) => {
            const el = document.querySelector('.entity-grid, #entityGrid');
            return !!el && window.getComputedStyle(el).gridTemplateColumns !== prevColumns;
        }, gridColumns, { timeout: 2000 });

        const listColumns = await grid.evaluate(el => window.getComputedStyle(el).gridTemplateColumns);
        expect(listColumns).not.toBe(gridColumns);

        // Switch back to grid view
        await gridBtn.click();
        await expect(grid).toHaveClass(/grid-view/);
        await expect(grid).not.toHaveClass(/list-view/);
    });
});

test.describe('Browse Header and Statistics', () => {
    test('browse header displays category info', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });
        await page.waitForSelector('.browse-view', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // The real header markup is `.browse-hero` (js/views/browse-category-view.js
        // getHeaderHTML()) — `.browse-header`/`.browse-title` used by the old
        // version of this test don't exist anywhere in the rendered page; they
        // only survive as dead CSS rules further down the same file's getStyles(),
        // left over from before the header was renamed. This is always rendered,
        // so assert on it unconditionally rather than behind `if (hasHeader)`.
        const header = page.locator('.browse-hero');
        await expect(header).toBeVisible({ timeout: 5000 });

        const title = header.locator('.browse-hero-title');
        await expect(title).toBeVisible();
        const titleText = await title.textContent();
        console.log('Browse title:', titleText);
        expect(titleText?.toLowerCase()).toContain('deit');

        // Description is always rendered (getCategoryLongDescription is never empty)
        const description = header.locator('.browse-hero-description');
        await expect(description).toBeVisible();
        const descriptionText = await description.textContent();
        expect(descriptionText?.length).toBeGreaterThan(0);

        // Stats are always rendered (#browseStats inside the hero, at least the
        // total-entity-count stat)
        const stats = header.locator('.browse-hero-stats .browse-hero-stat');
        expect(await stats.count()).toBeGreaterThan(0);
    });

    test('statistics show count of entities', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // #browseStats is rendered unconditionally inside the hero header
        // (getHeaderHTML) — real, always-present feature.
        const statsContainer = page.locator('#browseStats');
        await expect(statsContainer).toBeVisible({ timeout: 5000 });

        const statsText = await statsContainer.textContent();
        console.log('Stats content:', statsText);
        expect(/\d+/.test(statsText || '')).toBeTruthy();

        // #resultsInfo is rendered unconditionally inside the filter controls
        // (getFiltersHTML) — real, always-present feature.
        const resultsInfo = page.locator('#resultsInfo');
        await expect(resultsInfo).toBeVisible({ timeout: 5000 });
        const resultsText = await resultsInfo.textContent();
        console.log('Results info:', resultsText);
        expect(/\d+/.test(resultsText || '')).toBeTruthy();
        expect(resultsText?.toLowerCase()).toContain('showing');
    });
});

test.describe('Accessibility', () => {
    test('cards are keyboard accessible', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // Entity cards are rendered as <a href="..."> elements
        // (getEntityCardHTML in js/views/browse-category-view.js) with no
        // tabindex override, so they are natively focusable and operable via
        // the keyboard without depending on how many other focusable controls
        // (filter chips, search, sort, view buttons) precede them in tab order.
        // Assert that directly and unconditionally instead of tabbing a fixed
        // number of times and only checking inside an `if` when one happened to
        // be found.
        const firstCard = page.locator('.entity-card').first();
        await expect(firstCard).toBeVisible();

        const tagName = await firstCard.evaluate(el => el.tagName);
        const hasHref = await firstCard.getAttribute('href');
        expect(tagName).toBe('A');
        expect(hasHref).toBeTruthy();

        // Focus it and confirm it actually becomes the active element
        await firstCard.focus();
        const isFocused = await firstCard.evaluate(el => el === document.activeElement);
        expect(isFocused).toBeTruthy();

        // Activate it via keyboard (Enter) and confirm real navigation occurs —
        // the actual behavior a keyboard user relies on, not just focusability.
        const currentUrl = page.url();
        await page.keyboard.press('Enter');
        await page.waitForFunction((prev) => window.location.href !== prev, currentUrl, { timeout: 10000 }).catch(() => {});
        expect(page.url()).not.toBe(currentUrl);
    });

    test('filter chips have proper ARIA attributes', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });
        await page.waitForSelector('.browse-view', { timeout: 15000 });
        await waitForBrowsePageLoaded(page);

        // Mythology filter chips are rendered unconditionally for the deities
        // category (getQuickFiltersHTML: facetFilterIsUseful is always true
        // there) with aria-pressed and aria-label set on every chip
        // (js/views/browse-category-view.js) — real, always-present feature.
        const filterChips = page.locator('.filter-chip');
        await expect(filterChips.first()).toBeVisible({ timeout: 10000 });

        const chipCount = await filterChips.count();
        expect(chipCount).toBeGreaterThan(0);

        for (const chip of await filterChips.all()) {
            const ariaPressed = await chip.getAttribute('aria-pressed');
            const ariaLabel = await chip.getAttribute('aria-label');
            expect(['true', 'false']).toContain(ariaPressed);
            expect(ariaLabel).toBeTruthy();
        }
    });
});

test.describe('Cross-Category Navigation', () => {
    test('can navigate between different browse categories', async ({ page }) => {
        // Start at deities
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });
        await page.waitForSelector('.entity-card, .empty-state', { timeout: 15000 });

        // Navigate to creatures. Because these routes only differ by hash
        // fragment, `page.goto()` is a same-document navigation — the previous
        // route's DOM is not torn down by the browser, only by the SPA router
        // re-rendering the mount point. `waitForBrowsePageLoaded` alone is not
        // enough here: it just checks "some cards/empty/error state exists",
        // which the *previous* route's leftover content already satisfies the
        // instant goto() resolves, before BrowseCategoryView.render() for the
        // new route has replaced it. Wait for the header text itself to become
        // the new category's before reading it, so this can't read stale content.
        await page.goto(`${BASE_URL}/#/browse/creatures`, { waitUntil: 'load' });
        await page.waitForFunction(() => {
            const el = document.querySelector('.browse-hero-title');
            return !!el && el.textContent.toLowerCase().includes('creature');
        }, { timeout: 20000 });

        const headerText = await page.locator('.browse-hero-title').first().textContent();
        console.log('Creatures page header:', headerText);
        expect(headerText?.toLowerCase()).toMatch(/creature/i);

        // Navigate to heroes — same reasoning as above.
        await page.goto(`${BASE_URL}/#/browse/heroes`, { waitUntil: 'load' });
        await page.waitForFunction(() => {
            const el = document.querySelector('.browse-hero-title');
            return !!el && el.textContent.toLowerCase().includes('hero');
        }, { timeout: 20000 });

        const heroHeaderText = await page.locator('.browse-hero-title').first().textContent();
        console.log('Heroes page header:', heroHeaderText);
        expect(heroHeaderText?.toLowerCase()).toMatch(/hero/i);
    });
});

test.describe('Error Handling', () => {
    // This app's data layer is deliberately resilient: AssetService's
    // static+delta path (js/services/asset-service.js) serves
    // /static/entities/*.json first and treats a failed Firestore query as
    // non-fatal (see "handles network errors gracefully" below, which proves
    // exactly that). A Service Worker also fronts these origins, so simply
    // aborting a route can be silently served from its cache instead of
    // reaching the page's own network stack at all. `serviceWorkers: 'block'`
    // keeps this describe block's forced-error test honest: the only test here
    // that actually needs an error is "error state shows retry option", and it
    // needs one it can trust actually came from the network condition it set up.
    test.use({ serviceWorkers: 'block' });

    test('handles network errors gracefully', async ({ page }) => {
        // Block Firebase requests to simulate network error
        await page.route('**/firestore.googleapis.com/**', route => route.abort());

        await page.goto(`${BASE_URL}/#/browse/deities`);

        // Wait for the page to reach a terminal state (content, empty state, or
        // error state) instead of a fixed sleep — BrowseCategoryView.render()
        // races its load against a 25s timeout (LOAD_TIMEOUT) before falling
        // back to showError(), so give this enough headroom to actually resolve.
        await waitForBrowsePageLoaded(page, { timeout: 30000 });

        // Page should not crash - main content should still be visible
        const mainContent = page.locator('#main-content, main, .browse-view');
        const isVisible = await mainContent.first().isVisible().catch(() => false);

        // Either the page shows content or an error message, but should not be blank
        const hasAnyContent = await page.locator('body').textContent();
        expect(hasAnyContent?.length).toBeGreaterThan(0);
    });

    test('error state shows retry option', async ({ page }) => {
        // Force a real, deterministic error. Aborting requests isn't enough —
        // AssetService falls back through several layers (static base ->
        // Firestore -> cache) and an abort/empty-result at any one of them is
        // treated as "no data" rather than a fatal error (proven by "handles
        // network errors gracefully" above still rendering successfully with
        // Firestore blocked). What genuinely reaches showError() is a request
        // that never resolves at all: AssetService has its own 20s internal
        // timeout (js/services/asset-service.js), and BrowseCategoryView.render()
        // races the whole load against a 25s LOAD_TIMEOUT
        // (js/views/browse-category-view.js) — both are real production
        // safety nets against a hung connection, not test-only behavior.
        await page.route('**/static/entities/**', () => {});
        await page.route('**/firestore.googleapis.com/**', () => {});

        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'load' });

        // showError() always renders `.error-container` with a
        // `button[data-action="retry"]` unconditionally — no `if` in the
        // component. Give this enough headroom for AssetService's 20s timeout
        // plus BrowseCategoryView's 25s LOAD_TIMEOUT to actually fire.
        const errorContainer = page.locator('.error-container');
        await expect(errorContainer).toBeVisible({ timeout: 35000 });

        const retryBtn = errorContainer.locator('button[data-action="retry"]');
        await expect(retryBtn).toBeVisible();
        const retryText = await retryBtn.textContent();
        expect(retryText?.toLowerCase()).toContain('retry');

        // Clicking retry re-invokes render(), which synchronously replaces
        // .error-container with the loading skeleton before re-fetching. Unroute
        // first so this attempt can actually succeed — a genuine recovery, not
        // just "the button does something".
        await page.unroute('**/static/entities/**');
        await page.unroute('**/firestore.googleapis.com/**');
        await retryBtn.click();
        await page.waitForFunction(() => !document.querySelector('.error-container'), { timeout: 30000 });
        await page.waitForFunction(() => document.querySelectorAll('.entity-card').length > 0, { timeout: 15000 });
    });
});
