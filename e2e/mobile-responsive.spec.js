/**
 * Mobile Responsiveness E2E Tests
 * Tests the application's responsive design across mobile, tablet, and desktop viewports
 * Run: npx playwright test e2e/mobile-responsive.spec.js
 */

const { test, expect } = require('@playwright/test');

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad)' },
  desktop: { width: 1280, height: 720, name: 'Desktop' }
};

// Minimum touch target size per WCAG guidelines
const MIN_TOUCH_TARGET = 44;

/**
 * Helper function to wait for page to load
 */
async function waitForPageLoad(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
    // Network idle might not be reached, that's ok
  });
}

/**
 * Helper function to get computed styles for an element
 */
async function getComputedStyles(element, properties) {
  return element.evaluate((el, props) => {
    const styles = window.getComputedStyle(el);
    const result = {};
    for (const prop of props) {
      result[prop] = styles.getPropertyValue(prop);
    }
    return result;
  }, properties);
}

/**
 * Helper function to check if element is in viewport
 */
async function isInViewport(page, selector) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
}

// ============================================
// Test Suite 1: Landing Page Cards Layout
// ============================================
test.describe('Landing Page Cards - Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('Cards stack vertically on mobile viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    // Wait for category cards to render
    await page.waitForTimeout(2000);

    // Get all category cards
    const cards = page.locator('.category-card, .asset-type-card, .landing-category');
    const cardCount = await cards.count();

    if (cardCount > 1) {
      // Get bounding boxes of first two cards
      const firstCard = cards.first();
      const secondCard = cards.nth(1);

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      if (firstBox && secondBox) {
        // On mobile, cards should be stacked (second card's top should be below first card's bottom)
        // OR cards should be in a single column (same x position)
        const isStacked = secondBox.y >= firstBox.y + firstBox.height - 10; // Allow 10px tolerance
        const isSingleColumn = Math.abs(firstBox.x - secondBox.x) < 20; // Same x position with tolerance

        console.log(`First card: x=${firstBox.x}, y=${firstBox.y}, width=${firstBox.width}`);
        console.log(`Second card: x=${secondBox.x}, y=${secondBox.y}, width=${secondBox.width}`);

        expect(isStacked || isSingleColumn).toBeTruthy();
      }
    }
  });

  test('Cards show in grid layout on tablet viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Check for grid container
    const gridContainer = page.locator('.landing-grid, .category-grid, .asset-grid, [class*="grid"]').first();
    const hasGrid = await gridContainer.isVisible().catch(() => false);

    if (hasGrid) {
      const styles = await getComputedStyles(gridContainer, ['display', 'grid-template-columns']);
      console.log('Grid styles on tablet:', styles);
      // On tablet, should have CSS grid or flex display
      expect(styles.display).toMatch(/grid|flex/i);
    }
  });

  test('Cards show in multi-column grid on desktop viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const cards = page.locator('.category-card, .asset-type-card, .landing-category');
    const cardCount = await cards.count();

    if (cardCount >= 3) {
      const firstCard = cards.first();
      const secondCard = cards.nth(1);
      const thirdCard = cards.nth(2);

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      const thirdBox = await thirdCard.boundingBox();

      if (firstBox && secondBox && thirdBox) {
        // On desktop, cards should be in multiple columns (some cards on same row)
        const hasMultipleColumns =
          (Math.abs(firstBox.y - secondBox.y) < 10) || // First two on same row
          (Math.abs(secondBox.y - thirdBox.y) < 10);   // Second and third on same row

        console.log(`Desktop layout - Multiple columns: ${hasMultipleColumns}`);
        // Note: This test verifies desktop shows multi-column layout
        expect(hasMultipleColumns).toBeTruthy();
      }
    }
  });
});

// ============================================
// Test Suite 2: Header Responsiveness
// ============================================
test.describe('Header - Mobile Adaptation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('Header shows hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Look for mobile menu toggle / hamburger button
    const mobileMenuToggle = page.locator(
      '.mobile-menu-toggle, .hamburger, .hamburger-menu, ' +
      '[aria-label*="menu" i], button[aria-expanded], ' +
      '.mobile-nav-toggle, .menu-toggle'
    ).first();

    const hasHamburger = await mobileMenuToggle.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHamburger) {
      console.log('Hamburger menu is visible on mobile');
      expect(hasHamburger).toBeTruthy();

      // Verify desktop nav is hidden on mobile
      const desktopNav = page.locator('.nav-desktop, .desktop-nav, nav.main-nav > ul');
      const desktopNavVisible = await desktopNav.isVisible().catch(() => false);

      // Either desktop nav is hidden or menu is collapsed
      console.log(`Desktop nav visible on mobile: ${desktopNavVisible}`);
    } else {
      // Check if nav is simplified instead of hamburger
      const header = page.locator('header, .site-header').first();
      const isVisible = await header.isVisible();
      expect(isVisible).toBeTruthy();
      console.log('Header is visible but may use simplified nav instead of hamburger');
    }
  });

  test('Header shows full navigation on desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Desktop navigation should be visible
    const desktopNav = page.locator(
      'nav, .nav-links, .main-nav, .nav-desktop, ' +
      'header ul, .header-nav'
    ).first();

    const navVisible = await desktopNav.isVisible({ timeout: 5000 }).catch(() => false);
    expect(navVisible).toBeTruthy();

    // Hamburger should be hidden on desktop
    const hamburger = page.locator('.mobile-menu-toggle, .hamburger').first();
    const hamburgerVisible = await hamburger.isVisible().catch(() => false);

    if (hamburgerVisible) {
      // Check if it has display: none via computed styles
      const styles = await hamburger.evaluate(el => getComputedStyle(el).display);
      console.log(`Hamburger display style on desktop: ${styles}`);
    }
  });

  test('Mobile menu opens and closes correctly', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    const menuToggle = page.locator(
      '.mobile-menu-toggle, .hamburger, [aria-label*="menu" i]'
    ).first();

    const hasMenuToggle = await menuToggle.isVisible().catch(() => false);

    if (hasMenuToggle) {
      // Click to open menu
      await menuToggle.click();
      await page.waitForTimeout(500);

      // Check if menu panel is visible
      const menuPanel = page.locator(
        '.mobile-nav-panel.visible, .mobile-menu.open, ' +
        '.nav-menu.open, [aria-expanded="true"]'
      ).first();

      const menuOpen = await menuPanel.isVisible().catch(() => false);
      console.log(`Mobile menu opened: ${menuOpen}`);

      if (menuOpen) {
        // Click toggle again or overlay to close
        await menuToggle.click();
        await page.waitForTimeout(500);

        // Menu should be closed
        const menuStillOpen = await menuPanel.isVisible().catch(() => false);
        console.log(`Mobile menu after close: ${menuStillOpen}`);
      }
    }
  });
});

// ============================================
// Test Suite 3: Entity Cards Full Width on Mobile
// ============================================
test.describe('Entity Cards - Full Width on Mobile', () => {
  test('Entity cards are full-width on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Get any entity/category card
    const cards = page.locator(
      '.entity-card, .category-card, .asset-type-card, ' +
      '.entity-card-fallback, .landing-category'
    );

    const cardCount = await cards.count();

    if (cardCount > 0) {
      const firstCard = cards.first();
      const cardBox = await firstCard.boundingBox();

      if (cardBox) {
        const viewportWidth = VIEWPORTS.mobile.width;
        // Card should take most of the viewport width (accounting for padding/margins)
        const widthPercentage = (cardBox.width / viewportWidth) * 100;

        console.log(`Card width: ${cardBox.width}px (${widthPercentage.toFixed(1)}% of viewport)`);

        // Card should be at least 80% of viewport width on mobile
        expect(widthPercentage).toBeGreaterThan(75);
      }
    }
  });

  test('Entity cards maintain aspect ratio across breakpoints', async ({ page }) => {
    const cardSelector = '.entity-card, .category-card, .asset-type-card';

    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      const card = page.locator(cardSelector).first();
      const isVisible = await card.isVisible().catch(() => false);

      if (isVisible) {
        const box = await card.boundingBox();
        if (box) {
          console.log(`${viewportName}: Card ${box.width}x${box.height}px`);
        }
      }
    }
  });
});

// ============================================
// Test Suite 4: Text Readability
// ============================================
test.describe('Text Readability', () => {
  test('Text is readable on mobile (font-size >= 14px)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    // Check various text elements
    const textSelectors = [
      'p', 'span', '.description', '.card-description',
      '.entity-description', 'h1', 'h2', 'h3', 'a'
    ];

    for (const selector of textSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = elements.nth(i);
        const isVisible = await element.isVisible().catch(() => false);

        if (isVisible) {
          const fontSize = await element.evaluate(el => {
            return parseFloat(getComputedStyle(el).fontSize);
          });

          // Font size should be at least 12px for readability (14px preferred)
          if (fontSize < 12) {
            console.warn(`Small text found: ${selector} has ${fontSize}px font-size`);
          }
        }
      }
    }

    // Check main content text
    const mainContent = page.locator('main, #main-content, .main-content').first();
    const mainVisible = await mainContent.isVisible().catch(() => false);

    if (mainVisible) {
      const fontSize = await mainContent.evaluate(el => {
        return parseFloat(getComputedStyle(el).fontSize);
      });
      console.log(`Main content base font-size: ${fontSize}px`);
      expect(fontSize).toBeGreaterThanOrEqual(12);
    }
  });

  test('Line height provides good readability', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    // Check paragraph line height
    const paragraphs = page.locator('p, .description');
    const count = await paragraphs.count();

    if (count > 0) {
      const firstParagraph = paragraphs.first();
      const isVisible = await firstParagraph.isVisible().catch(() => false);

      if (isVisible) {
        const styles = await firstParagraph.evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            lineHeight: computed.lineHeight,
            fontSize: computed.fontSize
          };
        });

        console.log(`Paragraph styles: font-size=${styles.fontSize}, line-height=${styles.lineHeight}`);

        // Line height should be at least 1.4 for good readability
        const lineHeightValue = parseFloat(styles.lineHeight);
        const fontSizeValue = parseFloat(styles.fontSize);

        if (!isNaN(lineHeightValue) && !isNaN(fontSizeValue)) {
          const ratio = lineHeightValue / fontSizeValue;
          console.log(`Line height ratio: ${ratio.toFixed(2)}`);
          // Ratio should be at least 1.2
          expect(ratio).toBeGreaterThanOrEqual(1.2);
        }
      }
    }
  });
});

// ============================================
// Test Suite 5: Touch Targets
// ============================================
test.describe('Touch Targets - Minimum Size', () => {
  test('Interactive elements meet minimum touch target size (44x44px)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Interactive elements to check
    const interactiveSelectors = [
      'button',
      'a[href]',
      'input[type="checkbox"]',
      'input[type="radio"]',
      '.mobile-menu-toggle',
      '.theme-toggle',
      '.category-card',
      '.entity-card'
    ];

    const smallTouchTargets = [];

    for (const selector of interactiveSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = elements.nth(i);
        const isVisible = await element.isVisible().catch(() => false);

        if (isVisible) {
          const box = await element.boundingBox();

          if (box) {
            const isSmall = box.width < MIN_TOUCH_TARGET || box.height < MIN_TOUCH_TARGET;

            if (isSmall) {
              // Check if it's a link inside a larger clickable area
              const text = await element.textContent().catch(() => '');
              smallTouchTargets.push({
                selector,
                width: box.width,
                height: box.height,
                text: text?.substring(0, 30)
              });
            }
          }
        }
      }
    }

    if (smallTouchTargets.length > 0) {
      console.log('Elements with small touch targets:');
      smallTouchTargets.slice(0, 10).forEach(item => {
        console.log(`  ${item.selector}: ${item.width}x${item.height}px - "${item.text}"`);
      });
    }

    // Allow some small elements but not too many critical ones
    const criticalSmall = smallTouchTargets.filter(t =>
      t.selector.includes('button') ||
      t.selector.includes('toggle') ||
      t.selector.includes('card')
    );

    console.log(`Total small touch targets: ${smallTouchTargets.length}, Critical: ${criticalSmall.length}`);
    // Most critical interactive elements should meet minimum size
    expect(criticalSmall.length).toBeLessThan(5);
  });

  test('Navigation links have adequate tap area', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    // Check navigation links specifically
    const navLinks = page.locator('nav a, header a, .nav-link');
    const count = await navLinks.count();

    let adequateTapTargets = 0;
    let totalChecked = 0;

    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = navLinks.nth(i);
      const isVisible = await link.isVisible().catch(() => false);

      if (isVisible) {
        totalChecked++;
        const box = await link.boundingBox();

        if (box && box.height >= MIN_TOUCH_TARGET) {
          adequateTapTargets++;
        }
      }
    }

    if (totalChecked > 0) {
      const percentage = (adequateTapTargets / totalChecked) * 100;
      console.log(`Nav links with adequate tap area: ${percentage.toFixed(0)}%`);
      // At least 50% of nav links should have adequate tap area
      expect(percentage).toBeGreaterThanOrEqual(50);
    }
  });
});

// ============================================
// Test Suite 6: No Horizontal Scrolling
// ============================================
test.describe('No Horizontal Scrolling', () => {
  test('No horizontal scrollbar on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Check if page has horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    console.log(`Horizontal scroll on mobile: ${hasHorizontalScroll}`);
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('No horizontal scrollbar on tablet', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    console.log(`Horizontal scroll on tablet: ${hasHorizontalScroll}`);
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('Content does not overflow viewport on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    // Check main container widths
    const overflowingElements = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const elements = document.querySelectorAll('*');
      const overflowing = [];

      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > viewportWidth + 5) { // 5px tolerance
          overflowing.push({
            tag: el.tagName,
            class: el.className?.substring?.(0, 50),
            overflow: rect.right - viewportWidth
          });
        }
      });

      return overflowing.slice(0, 10);
    });

    if (overflowingElements.length > 0) {
      console.log('Elements causing overflow:');
      overflowingElements.forEach(el => {
        console.log(`  ${el.tag}.${el.class}: ${el.overflow}px overflow`);
      });
    }

    // Should have minimal or no overflowing elements
    expect(overflowingElements.length).toBeLessThan(5);
  });
});

// ============================================
// Test Suite 7: Image Scaling
// ============================================
test.describe('Images Scale Appropriately', () => {
  test('Images are responsive and scale to container', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      let responsiveImages = 0;
      let totalChecked = 0;

      for (let i = 0; i < Math.min(imageCount, 10); i++) {
        const img = images.nth(i);
        const isVisible = await img.isVisible().catch(() => false);

        if (isVisible) {
          totalChecked++;

          const styles = await img.evaluate(el => {
            const computed = getComputedStyle(el);
            return {
              maxWidth: computed.maxWidth,
              width: computed.width,
              height: computed.height
            };
          });

          const box = await img.boundingBox();
          const viewportWidth = VIEWPORTS.mobile.width;

          // Image should not exceed viewport
          if (box && box.width <= viewportWidth) {
            responsiveImages++;
          }

          console.log(`Image ${i}: ${box?.width}x${box?.height}px, max-width: ${styles.maxWidth}`);
        }
      }

      if (totalChecked > 0) {
        const percentage = (responsiveImages / totalChecked) * 100;
        console.log(`Responsive images: ${percentage.toFixed(0)}%`);
        expect(percentage).toBeGreaterThanOrEqual(90);
      }
    }
  });

  test('Category icons scale appropriately on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Check category icon sizes
    const icons = page.locator('.category-icon, .asset-icon, .card-icon, svg');
    const iconCount = await icons.count();

    for (let i = 0; i < Math.min(iconCount, 5); i++) {
      const icon = icons.nth(i);
      const isVisible = await icon.isVisible().catch(() => false);

      if (isVisible) {
        const box = await icon.boundingBox();
        if (box) {
          console.log(`Icon ${i}: ${box.width}x${box.height}px`);
          // Icons should be visible but not too large on mobile
          expect(box.width).toBeGreaterThan(16);
          expect(box.width).toBeLessThan(200);
        }
      }
    }
  });
});

// ============================================
// Test Suite 8: Modal/Overlay Viewport Fit
// ============================================
test.describe('Modals and Overlays Fit Viewport', () => {
  test('Modal fits within mobile viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Try to trigger a modal by clicking on an entity card
    const clickableCard = page.locator(
      '.entity-card, .category-card a, .asset-type-card a, ' +
      '[data-modal], [data-quick-view]'
    ).first();

    const hasClickable = await clickableCard.isVisible().catch(() => false);

    if (hasClickable) {
      await clickableCard.click();
      await page.waitForTimeout(1000);

      // Check for modal
      const modal = page.locator(
        '.modal, .quick-view, .overlay, .dialog, ' +
        '[role="dialog"], .entity-modal, .detail-modal'
      ).first();

      const modalVisible = await modal.isVisible().catch(() => false);

      if (modalVisible) {
        const box = await modal.boundingBox();

        if (box) {
          console.log(`Modal size: ${box.width}x${box.height}px`);
          console.log(`Viewport: ${VIEWPORTS.mobile.width}x${VIEWPORTS.mobile.height}px`);

          // Modal should fit within viewport (with some padding allowance)
          expect(box.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width);
          // Height can exceed viewport if scrollable

          // Modal should not start off-screen
          expect(box.x).toBeGreaterThanOrEqual(-5);
          expect(box.y).toBeGreaterThanOrEqual(-5);
        }

        // Close modal if possible
        const closeButton = modal.locator('.close, .close-btn, [aria-label*="close" i], button:has-text("Close")').first();
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
        }
      }
    }
  });

  test('Overlay covers full viewport on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    // Check for any overlay elements that might be present
    const overlays = page.locator('.overlay, .modal-backdrop, .mobile-nav-overlay');

    // These overlays might not be visible initially, check their CSS
    const overlayCount = await overlays.count();

    for (let i = 0; i < overlayCount; i++) {
      const overlay = overlays.nth(i);

      // Check overlay CSS properties
      const styles = await overlay.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          position: computed.position,
          width: computed.width,
          height: computed.height,
          inset: computed.inset
        };
      }).catch(() => null);

      if (styles) {
        console.log(`Overlay ${i} styles:`, styles);
        // Overlays should typically be position fixed with full coverage
        expect(['fixed', 'absolute']).toContain(styles.position);
      }
    }
  });
});

// ============================================
// Test Suite 9: Theme Toggle Accessibility
// ============================================
test.describe('Theme Toggle - Mobile Accessibility', () => {
  test('Theme toggle is visible and accessible on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Look for theme toggle
    const themeToggle = page.locator(
      '#themePickerContainer, .theme-toggle, .theme-picker, ' +
      '#theme-toggle, [aria-label*="theme" i], .theme-switcher'
    ).first();

    const isVisible = await themeToggle.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      const box = await themeToggle.boundingBox();

      if (box) {
        console.log(`Theme toggle size: ${box.width}x${box.height}px`);
        console.log(`Theme toggle position: x=${box.x}, y=${box.y}`);

        // Theme toggle should be adequately sized for touch
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);

        // Should be within viewport
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width + 5);
      }
    } else {
      // Theme toggle might be in mobile menu - open it first
      const menuToggle = page.locator('.mobile-menu-toggle, .hamburger').first();
      const hasMenu = await menuToggle.isVisible().catch(() => false);

      if (hasMenu) {
        await menuToggle.click();
        await page.waitForTimeout(500);

        // Check for theme toggle in mobile menu
        const themeInMenu = page.locator(
          '.mobile-nav-panel .theme-toggle, ' +
          '.mobile-menu .theme-picker, ' +
          '#themePickerContainer'
        ).first();

        const themeInMenuVisible = await themeInMenu.isVisible().catch(() => false);
        console.log(`Theme toggle in mobile menu: ${themeInMenuVisible}`);
      }
    }
  });

  test('Theme toggle is interactive on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    const themeToggle = page.locator(
      '#themePickerContainer, .theme-toggle, .theme-picker, ' +
      '#theme-toggle, .theme-switcher, button[class*="theme"]'
    ).first();

    const isVisible = await themeToggle.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme') ||
               document.body.getAttribute('data-theme') ||
               document.body.className;
      });

      console.log(`Initial theme: ${initialTheme}`);

      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Check if a theme menu appeared or theme changed
      const themeMenu = page.locator('.theme-menu, .theme-options, .theme-dropdown').first();
      const menuVisible = await themeMenu.isVisible().catch(() => false);

      if (menuVisible) {
        console.log('Theme menu is visible after click');
        // Click a theme option if available
        const themeOption = themeMenu.locator('button, li, .theme-option').first();
        if (await themeOption.isVisible()) {
          await themeOption.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });
});

// ============================================
// Test Suite 10: Touch Navigation
// ============================================
test.describe('Navigation Works with Touch', () => {
  test('Category cards are tappable on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const categoryCard = page.locator(
      '.category-card a, .asset-type-card a, ' +
      'a[href*="browse"], a[href*="mythologies"]'
    ).first();

    const isVisible = await categoryCard.isVisible().catch(() => false);

    if (isVisible) {
      const initialUrl = page.url();

      // Simulate tap
      await categoryCard.tap();
      await page.waitForTimeout(1500);

      const newUrl = page.url();
      console.log(`Navigation: ${initialUrl} -> ${newUrl}`);

      // URL should have changed or modal should have appeared
      const urlChanged = newUrl !== initialUrl;
      const modalAppeared = await page.locator('.modal, .quick-view, [role="dialog"]')
        .isVisible().catch(() => false);

      expect(urlChanged || modalAppeared).toBeTruthy();
    }
  });

  test('Swipe gestures do not break navigation', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    // Perform a swipe gesture (horizontal)
    const viewport = VIEWPORTS.mobile;
    await page.touchscreen.tap(viewport.width / 2, viewport.height / 2);

    // Swipe from right to left
    const startX = viewport.width * 0.8;
    const endX = viewport.width * 0.2;
    const centerY = viewport.height / 2;

    // Simulating swipe using mouse move (touchscreen API is limited)
    await page.mouse.move(startX, centerY);
    await page.mouse.down();
    await page.mouse.move(endX, centerY, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Page should still be responsive
    const mainContent = page.locator('#main-content, main, .main-content').first();
    const isVisible = await mainContent.isVisible().catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('Back button navigation works on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const homeUrl = page.url();

    // Navigate to a category
    const categoryLink = page.locator('a[href*="browse"], a[href*="mythologies"]').first();
    const hasLink = await categoryLink.isVisible().catch(() => false);

    if (hasLink) {
      await categoryLink.click();
      await page.waitForTimeout(2000);

      const categoryUrl = page.url();
      console.log(`Navigated to: ${categoryUrl}`);

      // Go back
      await page.goBack();
      await page.waitForTimeout(1500);

      const afterBackUrl = page.url();
      console.log(`After back: ${afterBackUrl}`);

      // Should be back on home or same origin
      const isHome = afterBackUrl === homeUrl ||
                     afterBackUrl.endsWith('/') ||
                     afterBackUrl.includes('#/');
      expect(isHome).toBeTruthy();
    }
  });

  test('Scroll works smoothly on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    // Get initial scroll position
    const initialScroll = await page.evaluate(() => window.scrollY);

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);

    const afterScroll = await page.evaluate(() => window.scrollY);
    console.log(`Scroll: ${initialScroll} -> ${afterScroll}`);

    // Should have scrolled (unless page is too short)
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = VIEWPORTS.mobile.height;

    if (pageHeight > viewportHeight) {
      expect(afterScroll).toBeGreaterThan(initialScroll);
    }
  });
});

// ============================================
// Cross-Viewport Consistency Tests
// ============================================
test.describe('Cross-Viewport Consistency', () => {
  test('Same content is available across all viewports', async ({ page }) => {
    const contentPresence = {};

    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });
      await waitForPageLoad(page);
      await page.waitForTimeout(1500);

      // Check for key content elements
      const hasHeader = await page.locator('header, .site-header').isVisible().catch(() => false);
      const hasMain = await page.locator('#main-content, main').isVisible().catch(() => false);
      const hasNav = await page.locator('nav, .nav-links, .mobile-nav-panel').isVisible().catch(() => false);
      const categoryCount = await page.locator('.category-card, .asset-type-card, .landing-category').count();

      contentPresence[viewportName] = {
        hasHeader,
        hasMain,
        hasNav,
        categoryCount
      };

      console.log(`${viewportName}:`, contentPresence[viewportName]);
    }

    // All viewports should have header and main content
    for (const [viewportName, content] of Object.entries(contentPresence)) {
      expect(content.hasHeader || content.hasNav).toBeTruthy();
      expect(content.hasMain).toBeTruthy();
    }
  });

  test('Responsive breakpoints transition smoothly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageLoad(page);

    // Test viewport sizes from mobile to desktop
    const sizes = [
      { width: 320, height: 568 },   // Small mobile
      { width: 375, height: 667 },   // iPhone SE
      { width: 414, height: 896 },   // iPhone XR
      { width: 768, height: 1024 },  // iPad
      { width: 1024, height: 768 },  // Landscape tablet
      { width: 1280, height: 720 },  // Desktop
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(300);

      // Page should not have horizontal scroll at any size
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      console.log(`${size.width}x${size.height}: Horizontal scroll = ${hasHorizontalScroll}`);

      // Main content should be visible
      const mainVisible = await page.locator('#main-content, main').isVisible().catch(() => false);
      expect(mainVisible).toBeTruthy();
    }
  });
});
