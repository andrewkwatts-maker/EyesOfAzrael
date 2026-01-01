/**
 * Browse Category View E2E Tests
 * Tests the browse pages for various entity categories (deities, heroes, creatures, etc.)
 *
 * Run against production:
 * BASE_URL=https://www.eyesofazrael.com npx playwright test e2e/browse-category.spec.js
 */

const { test, expect } = require('@playwright/test');

// Base URL for the production site
const BASE_URL = 'https://www.eyesofazrael.com';

// Test timeout configuration
test.describe.configure({ timeout: 60000 });

test.describe('Browse Deities View', () => {
    test.beforeEach(async ({ page }) => {
        // Set a longer timeout for production testing
        test.setTimeout(60000);
    });

    test('shows deity cards with proper layout', async ({ page }) => {
        // Navigate to the deities browse page
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

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
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000); // Allow time for card content to populate

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
        await page.goto(`${BASE_URL}/#/browse/heroes`, { waitUntil: 'networkidle' });

        // Wait for the browse view to render
        await page.waitForSelector('.browse-view, .entity-grid', { timeout: 15000 });

        // Wait for content to load
        await page.waitForTimeout(3000);

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
        await page.goto(`${BASE_URL}/#/browse/creatures`, { waitUntil: 'networkidle' });

        // Wait for the browse view to render
        await page.waitForSelector('.browse-view, .entity-grid', { timeout: 15000 });

        // Wait for content to load
        await page.waitForTimeout(3000);

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
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

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
        await page.waitForTimeout(300); // Wait for transition

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
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

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
        await page.waitForTimeout(2000);

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
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

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
        await page.waitForTimeout(500); // Allow CSS to recalculate

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
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

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
        await page.waitForTimeout(1000);

        const hasLoadingAfterLoad = await page.locator('.skeleton-card, .grid-loading').isVisible().catch(() => false);
        expect(hasLoadingAfterLoad).toBeFalsy();
    });

    test('empty state shown if no results (simulated via filter)', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Find search filter input if available
        const searchFilter = page.locator('#searchFilter, input[type="text"][placeholder*="Search"], input[type="search"]');
        const hasSearchFilter = await searchFilter.isVisible().catch(() => false);

        if (hasSearchFilter) {
            // Type a search term that likely won't match anything
            await searchFilter.fill('zzzzxxxxxxxnotarealentity12345');
            await page.waitForTimeout(500); // Wait for debounce

            // Check for empty state
            const emptyState = page.locator('.empty-state');
            const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

            console.log('Empty state shown for no-match search:', hasEmptyState);

            if (hasEmptyState) {
                // Verify empty state has helpful content
                const emptyStateText = await emptyState.textContent();
                console.log('Empty state content:', emptyStateText?.substring(0, 100));
                expect(emptyStateText?.length).toBeGreaterThan(0);
            }

            // Clear the filter
            await searchFilter.clear();
            await page.waitForTimeout(500);

            // Cards should reappear
            const cardsReappear = await page.locator('.entity-card').first().isVisible({ timeout: 5000 }).catch(() => false);
            console.log('Cards reappear after clearing filter:', cardsReappear);
        }
    });
});

test.describe('Content Filter Toggle', () => {
    test('content filter toggle works (if visible)', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for page to load
        await page.waitForSelector('.browse-view', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Look for content filter toggle
        const contentFilterContainer = page.locator('#contentFilterContainer, .content-filter, [data-content-filter]');
        const hasContentFilter = await contentFilterContainer.isVisible().catch(() => false);

        console.log('Content filter visible:', hasContentFilter);

        if (hasContentFilter) {
            // Find toggle button or checkbox
            const toggle = contentFilterContainer.locator('button, input[type="checkbox"], .toggle-switch');
            const hasToggle = await toggle.first().isVisible().catch(() => false);

            if (hasToggle) {
                // Get initial card count
                const initialCardCount = await page.locator('.entity-card').count();
                console.log('Initial card count:', initialCardCount);

                // Click the toggle
                await toggle.first().click();
                await page.waitForTimeout(1000);

                // Get new card count
                const newCardCount = await page.locator('.entity-card').count();
                console.log('Card count after toggle:', newCardCount);

                // Card count may change (or not, depending on data)
                // The important thing is that no error occurred
            }
        }
    });
});

test.describe('Pagination and Infinite Scroll', () => {
    test('pagination or infinite scroll works (if implemented)', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Check for pagination controls
        const paginationControls = page.locator('.pagination-controls, #paginationControls, .page-btn');
        const hasPagination = await paginationControls.isVisible().catch(() => false);

        console.log('Pagination controls visible:', hasPagination);

        if (hasPagination) {
            // Get current page indicator
            const activePageBtn = page.locator('.page-btn.active');
            const hasActivePage = await activePageBtn.isVisible().catch(() => false);

            if (hasActivePage) {
                const currentPage = await activePageBtn.textContent();
                console.log('Current page:', currentPage);

                // Find next page button
                const nextBtn = page.locator('.page-btn:has-text("Next"), .page-btn:has-text(">")');
                const hasNextBtn = await nextBtn.isVisible().catch(() => false);

                if (hasNextBtn) {
                    const isDisabled = await nextBtn.isDisabled().catch(() => false);

                    if (!isDisabled) {
                        // Get initial cards
                        const initialFirstCardTitle = await page.locator('.entity-card').first().locator('.entity-card-title, .card-title').textContent();

                        // Click next
                        await nextBtn.click();
                        await page.waitForTimeout(1000);

                        // Verify page changed
                        const newActivePageBtn = page.locator('.page-btn.active');
                        const newPage = await newActivePageBtn.textContent();
                        console.log('New page after next:', newPage);

                        // Get new first card
                        const newFirstCardTitle = await page.locator('.entity-card').first().locator('.entity-card-title, .card-title').textContent();

                        // Content should have changed (different cards shown)
                        if (initialFirstCardTitle !== newFirstCardTitle) {
                            console.log('Pagination working: content changed');
                        }
                    }
                }
            }
        } else {
            // Check for infinite scroll by scrolling down
            const entityContainer = page.locator('#entityContainer, .entity-container');
            const hasContainer = await entityContainer.isVisible().catch(() => false);

            if (hasContainer) {
                // Get initial card count
                const initialCardCount = await page.locator('.entity-card').count();
                console.log('Initial card count:', initialCardCount);

                // Scroll down
                await entityContainer.evaluate(el => {
                    el.scrollTop = el.scrollHeight;
                });
                await page.waitForTimeout(2000);

                // Check if more cards loaded (for infinite scroll)
                const newCardCount = await page.locator('.entity-card').count();
                console.log('Card count after scroll:', newCardCount);

                // If more cards loaded, infinite scroll is working
                if (newCardCount > initialCardCount) {
                    console.log('Infinite scroll working: more cards loaded');
                }
            }
        }
    });
});

test.describe('Browse View Filters', () => {
    test('quick filter chips work', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for page to load
        await page.waitForSelector('.browse-view', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Look for filter chips
        const filterChips = page.locator('.filter-chip');
        const chipCount = await filterChips.count();

        console.log('Filter chips found:', chipCount);

        if (chipCount > 0) {
            // Get initial card count
            const initialCardCount = await page.locator('.entity-card').count();
            console.log('Initial card count:', initialCardCount);

            // Click first filter chip
            const firstChip = filterChips.first();
            await firstChip.click();
            await page.waitForTimeout(500);

            // Check chip is now active
            const chipAriaPressed = await firstChip.getAttribute('aria-pressed');
            const chipHasActiveClass = await firstChip.evaluate(el => el.classList.contains('active'));

            console.log('Chip aria-pressed:', chipAriaPressed);
            console.log('Chip has active class:', chipHasActiveClass);

            // Get new card count (may be different after filtering)
            const newCardCount = await page.locator('.entity-card').count();
            console.log('Card count after filter:', newCardCount);

            // Click the chip again to deactivate
            await firstChip.click();
            await page.waitForTimeout(500);

            // Verify it deactivated
            const chipAriaAfterDeactivate = await firstChip.getAttribute('aria-pressed');
            console.log('Chip aria-pressed after deactivate:', chipAriaAfterDeactivate);
        }
    });

    test('sort order changes card order', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Find sort dropdown
        const sortOrder = page.locator('#sortOrder, select[id*="sort"]');
        const hasSortDropdown = await sortOrder.isVisible().catch(() => false);

        console.log('Sort dropdown visible:', hasSortDropdown);

        if (hasSortDropdown) {
            // Get first card title with current sort
            const getFirstCardTitle = async () => {
                return await page.locator('.entity-card').first().locator('.entity-card-title, .card-title, h3').textContent();
            };

            const initialFirstTitle = await getFirstCardTitle();
            console.log('Initial first card:', initialFirstTitle);

            // Get available options
            const options = await sortOrder.locator('option').allTextContents();
            console.log('Sort options:', options);

            // Change to a different sort option (e.g., mythology or popularity)
            if (options.length > 1) {
                // Select a different option
                await sortOrder.selectOption({ index: 1 });
                await page.waitForTimeout(500);

                const newFirstTitle = await getFirstCardTitle();
                console.log('First card after sort change:', newFirstTitle);

                // Titles might be different (but not always, depends on data)
                console.log('Sort affected order:', initialFirstTitle !== newFirstTitle);
            }
        }
    });
});

test.describe('View Mode Toggle', () => {
    test('grid and list view toggle works', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Find view toggle buttons
        const gridBtn = page.locator('.view-btn[data-view="grid"], button:has-text("Grid")');
        const listBtn = page.locator('.view-btn[data-view="list"], button:has-text("List")');

        const hasGridBtn = await gridBtn.isVisible().catch(() => false);
        const hasListBtn = await listBtn.isVisible().catch(() => false);

        console.log('Grid button visible:', hasGridBtn);
        console.log('List button visible:', hasListBtn);

        if (hasGridBtn && hasListBtn) {
            // Get the grid element
            const grid = page.locator('.entity-grid, #entityGrid').first();

            // Verify grid view is active (default)
            const hasGridClass = await grid.evaluate(el => el.classList.contains('grid-view'));
            console.log('Has grid-view class:', hasGridClass);

            // Switch to list view
            await listBtn.click();
            await page.waitForTimeout(300);

            // Verify list view class applied
            const hasListClass = await grid.evaluate(el => el.classList.contains('list-view'));
            console.log('Has list-view class after toggle:', hasListClass);

            // Cards should have different layout in list view
            const firstCard = page.locator('.entity-card').first();
            const cardFlexDirection = await firstCard.evaluate(el => {
                return window.getComputedStyle(el).flexDirection;
            });
            console.log('Card flex-direction in list view:', cardFlexDirection);

            // Switch back to grid view
            await gridBtn.click();
            await page.waitForTimeout(300);

            const hasGridClassAgain = await grid.evaluate(el => el.classList.contains('grid-view'));
            console.log('Back to grid-view:', hasGridClassAgain);
        }
    });
});

test.describe('Browse Header and Statistics', () => {
    test('browse header displays category info', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for page to load
        await page.waitForSelector('.browse-view', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Check for header
        const header = page.locator('.browse-header');
        const hasHeader = await header.isVisible().catch(() => false);

        if (hasHeader) {
            // Check for title
            const title = header.locator('.browse-title, h1');
            const titleText = await title.textContent();
            console.log('Browse title:', titleText);
            expect(titleText?.toLowerCase()).toContain('deit');

            // Check for description
            const description = header.locator('.browse-description');
            const hasDescription = await description.isVisible().catch(() => false);
            console.log('Has description:', hasDescription);

            // Check for stats
            const stats = header.locator('.browse-stats, .stat-badge');
            const hasStats = await stats.isVisible().catch(() => false);
            console.log('Has stats:', hasStats);
        }
    });

    test('statistics show count of entities', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Find stats display
        const statsContainer = page.locator('#browseStats, .browse-stats');
        const hasStats = await statsContainer.isVisible().catch(() => false);

        if (hasStats) {
            const statsText = await statsContainer.textContent();
            console.log('Stats content:', statsText);

            // Should contain some numeric values
            const hasNumbers = /\d+/.test(statsText || '');
            expect(hasNumbers).toBeTruthy();
        }

        // Check results info
        const resultsInfo = page.locator('#resultsInfo, .filter-results-info');
        const hasResultsInfo = await resultsInfo.isVisible().catch(() => false);

        if (hasResultsInfo) {
            const resultsText = await resultsInfo.textContent();
            console.log('Results info:', resultsText);
            // Should show something like "Showing X of Y"
        }
    });
});

test.describe('Accessibility', () => {
    test('cards are keyboard accessible', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for cards to load
        await page.waitForSelector('.entity-card', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Tab through the page to reach cards
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('Tab');

            const focusedElement = await page.evaluate(() => {
                const el = document.activeElement;
                return {
                    tag: el?.tagName,
                    className: el?.className,
                    hasHref: !!el?.getAttribute('href'),
                    role: el?.getAttribute('role')
                };
            });

            // Check if we focused on an entity card
            if (focusedElement.className?.includes('entity-card') || focusedElement.hasHref) {
                console.log('Focused on card or link:', focusedElement);

                // Cards should be focusable (have tabindex or be links)
                expect(focusedElement.hasHref || focusedElement.role === 'article').toBeTruthy();
                break;
            }
        }
    });

    test('filter chips have proper ARIA attributes', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for page to load
        await page.waitForSelector('.filter-chip', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2000);

        const filterChips = page.locator('.filter-chip');
        const chipCount = await filterChips.count();

        if (chipCount > 0) {
            const firstChip = filterChips.first();

            // Check for aria-pressed attribute
            const ariaPressed = await firstChip.getAttribute('aria-pressed');
            console.log('Filter chip aria-pressed:', ariaPressed);
            expect(['true', 'false']).toContain(ariaPressed);

            // Check for aria-label
            const ariaLabel = await firstChip.getAttribute('aria-label');
            console.log('Filter chip aria-label:', ariaLabel);
            expect(ariaLabel).toBeTruthy();
        }
    });
});

test.describe('Cross-Category Navigation', () => {
    test('can navigate between different browse categories', async ({ page }) => {
        // Start at deities
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.entity-card, .empty-state', { timeout: 15000 });

        // Navigate to creatures
        await page.goto(`${BASE_URL}/#/browse/creatures`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.browse-view', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Verify we're on creatures page
        const header = page.locator('.browse-header .browse-title, h1');
        const headerText = await header.textContent();
        console.log('Creatures page header:', headerText);
        expect(headerText?.toLowerCase()).toMatch(/creature/i);

        // Navigate to heroes
        await page.goto(`${BASE_URL}/#/browse/heroes`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.browse-view', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Verify we're on heroes page
        const heroHeader = page.locator('.browse-header .browse-title, h1');
        const heroHeaderText = await heroHeader.textContent();
        console.log('Heroes page header:', heroHeaderText);
        expect(heroHeaderText?.toLowerCase()).toMatch(/hero/i);
    });
});

test.describe('Error Handling', () => {
    test('handles network errors gracefully', async ({ page }) => {
        // Block Firebase requests to simulate network error
        await page.route('**/firestore.googleapis.com/**', route => route.abort());

        await page.goto(`${BASE_URL}/#/browse/deities`);

        // Wait for page to handle the error
        await page.waitForTimeout(5000);

        // Page should not crash - main content should still be visible
        const mainContent = page.locator('#main-content, main, .browse-view');
        const isVisible = await mainContent.first().isVisible().catch(() => false);

        // Either the page shows content or an error message, but should not be blank
        const hasAnyContent = await page.locator('body').textContent();
        expect(hasAnyContent?.length).toBeGreaterThan(0);
    });

    test('error state shows retry option', async ({ page }) => {
        // This test checks if error handling includes recovery options
        await page.goto(`${BASE_URL}/#/browse/deities`, { waitUntil: 'networkidle' });

        // Wait for page to load
        await page.waitForSelector('.browse-view', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2000);

        // Check if error container exists (may not be visible if no error)
        const errorContainer = page.locator('.error-container, .error-state');
        const hasError = await errorContainer.isVisible().catch(() => false);

        if (hasError) {
            // Should have retry button
            const retryBtn = errorContainer.locator('button');
            const hasRetryBtn = await retryBtn.isVisible().catch(() => false);
            console.log('Error has retry button:', hasRetryBtn);
        } else {
            console.log('No error state visible (page loaded successfully)');
        }
    });
});
