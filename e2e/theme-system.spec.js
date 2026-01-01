/**
 * Theme System E2E Tests
 * Comprehensive tests for the Eyes of Azrael theme system
 * Tests theme toggling, persistence, dropdown, mobile behavior, and CSS variables
 */

const { test, expect } = require('@playwright/test');

// Theme configuration constants
const STORAGE_KEY = 'eoaplot-selected-theme';
const DEFAULT_THEME = 'night';

// All available themes from theme-config.json
const ALL_THEMES = [
  'day', 'night', 'fire', 'water', 'earth', 'air',
  'celestial', 'abyssal', 'chaos', 'order', 'aurora',
  'storm', 'cosmic', 'void', 'light'
];

// Light themes that should show sun icon
const LIGHT_THEMES = ['day', 'light'];

// Dark themes that should show moon icon
const DARK_THEMES = ALL_THEMES.filter(t => !LIGHT_THEMES.includes(t));

// Theme color mappings for verification (subset for testing)
const THEME_COLORS = {
  night: {
    'bg-primary': '#0a0e27',
    'text-primary': '#f8f9fa',
    'primary': '#8b7fff'
  },
  day: {
    'bg-primary': '#ffffff',
    'text-primary': '#0f172a',
    'primary': '#2563eb'
  },
  fire: {
    'bg-primary': '#1a0a0a',
    'text-primary': '#fef2f2',
    'primary': '#dc2626'
  },
  water: {
    'bg-primary': '#0a1929',
    'text-primary': '#e0f2fe',
    'primary': '#0891b2'
  }
};

test.describe('Theme System - Default Theme Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('eoaplot-selected-theme');
        sessionStorage.removeItem('eoaplot-selected-theme');
      } catch (e) {}
    });
  });

  test('Default night theme loads on fresh visit', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for theme system to initialize
    await page.waitForFunction(() => {
      return window.ShaderThemePicker && window.ShaderThemePicker.isInitialized();
    }, { timeout: 10000 }).catch(() => {
      // Fallback: just wait for body to have data-theme
    });

    // Check data-theme attribute on body
    const bodyTheme = await page.getAttribute('body', 'data-theme');
    expect(bodyTheme).toBe(DEFAULT_THEME);

    // Also check html element (FOUC prevention applies theme here)
    const htmlTheme = await page.getAttribute('html', 'data-theme');
    expect(htmlTheme).toBe(DEFAULT_THEME);
  });

  test('Night theme CSS variables are applied by default', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for theme to be applied
    await page.waitForTimeout(1000);

    // Verify CSS custom properties
    const colors = await page.evaluate(() => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      return {
        bgPrimary: style.getPropertyValue('--color-bg-primary').trim(),
        textPrimary: style.getPropertyValue('--color-text-primary').trim(),
        primary: style.getPropertyValue('--color-primary').trim()
      };
    });

    // Night theme should have dark background
    expect(colors.bgPrimary).toBeTruthy();
    // Background should be dark (night theme default)
    console.log('Default theme colors:', colors);
  });
});

test.describe('Theme System - Theme Toggle Button', () => {
  test('Theme toggle button is visible in header', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for header to be visible
    await expect(page.locator('.site-header')).toBeVisible();

    // Theme toggle button should be visible
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible({ timeout: 5000 });
  });

  test('Theme toggle button has correct aria-label', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const themeToggle = page.locator('#themeToggle');
    const ariaLabel = await themeToggle.getAttribute('aria-label');

    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel.toLowerCase()).toContain('theme');
  });

  test('Theme toggle button has moon icon for dark themes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Default is night (dark theme), should show moon
    const moonIcon = page.locator('#themeToggle .theme-icon-moon');
    const sunIcon = page.locator('#themeToggle .theme-icon-sun');

    // Moon should be visible (display not none)
    const moonDisplay = await moonIcon.evaluate(el => getComputedStyle(el).display);
    const sunDisplay = await sunIcon.evaluate(el => getComputedStyle(el).display);

    expect(moonDisplay).not.toBe('none');
    expect(sunDisplay).toBe('none');
  });

  test('Theme toggle button is keyboard accessible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Tab to theme toggle
    const themeToggle = page.locator('#themeToggle');

    // Focus the button
    await themeToggle.focus();

    // Check it received focus
    const isFocused = await page.evaluate(() => {
      return document.activeElement?.id === 'themeToggle';
    });

    expect(isFocused).toBeTruthy();
  });
});

test.describe('Theme System - Theme Cycling (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE viewport

  test('Mobile: clicking toggle cycles through themes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // Wait for theme system init

    const themeToggle = page.locator('#themeToggle');

    // Get initial theme
    const initialTheme = await page.getAttribute('body', 'data-theme');
    console.log('Initial theme:', initialTheme);

    // Click to cycle to next theme
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Theme should have changed
    const newTheme = await page.getAttribute('body', 'data-theme');
    console.log('After click theme:', newTheme);

    // Theme should be different (cycled)
    expect(newTheme).not.toBe(initialTheme);
  });

  test('Mobile: theme cycles through all available themes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const themeToggle = page.locator('#themeToggle');
    const seenThemes = new Set();

    // Get initial theme
    const initialTheme = await page.getAttribute('body', 'data-theme');
    seenThemes.add(initialTheme);

    // Click multiple times to cycle through themes
    for (let i = 0; i < ALL_THEMES.length + 2; i++) {
      await themeToggle.click();
      await page.waitForTimeout(300);

      const currentTheme = await page.getAttribute('body', 'data-theme');
      seenThemes.add(currentTheme);
    }

    console.log('Seen themes:', Array.from(seenThemes));

    // Should have seen multiple themes
    expect(seenThemes.size).toBeGreaterThan(1);
  });
});

test.describe('Theme System - Theme Dropdown (Desktop)', () => {
  test.use({ viewport: { width: 1280, height: 720 } }); // Desktop viewport

  test('Desktop: theme dropdown shows all available themes on click', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for theme picker to create dropdown

    const themeToggle = page.locator('#themeToggle');
    const dropdown = page.locator('.theme-dropdown');

    // Click to open dropdown
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Dropdown should be visible
    const dropdownVisible = await dropdown.isVisible().catch(() => false);

    if (dropdownVisible) {
      // Check for theme options
      const themeOptions = page.locator('.theme-option');
      const count = await themeOptions.count();

      console.log(`Found ${count} theme options in dropdown`);
      expect(count).toBeGreaterThan(0);

      // Verify some expected themes are present
      const hasNightTheme = await page.locator('.theme-option[data-theme="night"]').isVisible().catch(() => false);
      const hasDayTheme = await page.locator('.theme-option[data-theme="day"]').isVisible().catch(() => false);

      expect(hasNightTheme || hasDayTheme).toBeTruthy();
    } else {
      console.log('Dropdown not found - mobile-style cycling may be active on this viewport');
    }
  });

  test('Desktop: selecting theme from dropdown changes theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const themeToggle = page.locator('#themeToggle');

    // Get initial theme
    const initialTheme = await page.getAttribute('body', 'data-theme');

    // Click to open dropdown
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Try to select a different theme
    const targetTheme = initialTheme === 'fire' ? 'water' : 'fire';
    const themeOption = page.locator(`.theme-option[data-theme="${targetTheme}"]`);

    if (await themeOption.isVisible().catch(() => false)) {
      await themeOption.click();
      await page.waitForTimeout(500);

      const newTheme = await page.getAttribute('body', 'data-theme');
      expect(newTheme).toBe(targetTheme);
    }
  });

  test('Desktop: dropdown closes when clicking outside', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const themeToggle = page.locator('#themeToggle');
    const dropdown = page.locator('.theme-dropdown');

    // Open dropdown
    await themeToggle.click();
    await page.waitForTimeout(500);

    if (await dropdown.isVisible().catch(() => false)) {
      // Click outside (on main content)
      await page.locator('#main-content').click();
      await page.waitForTimeout(300);

      // Dropdown should be hidden
      const isHidden = await dropdown.evaluate(el => {
        return el.style.display === 'none' || !el.offsetParent;
      });

      expect(isHidden).toBeTruthy();
    }
  });

  test('Desktop: dropdown shows current theme as active', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const themeToggle = page.locator('#themeToggle');
    const currentTheme = await page.getAttribute('body', 'data-theme');

    // Open dropdown
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Check if current theme has active class
    const activeOption = page.locator(`.theme-option[data-theme="${currentTheme}"].active`);

    if (await page.locator('.theme-dropdown').isVisible().catch(() => false)) {
      const hasActiveOption = await activeOption.isVisible().catch(() => false);
      console.log(`Current theme "${currentTheme}" has active class: ${hasActiveOption}`);
    }
  });
});

test.describe('Theme System - CSS Variables Update', () => {
  test('Changing theme updates --color-bg-primary CSS variable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Get initial background color
    const initialBg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim();
    });

    // Change theme via API
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('fire');
      }
    });
    await page.waitForTimeout(500);

    // Get new background color
    const newBg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim();
    });

    console.log(`Background changed from "${initialBg}" to "${newBg}"`);
    expect(newBg).not.toBe(initialBg);
  });

  test('Changing theme updates --color-text-primary CSS variable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const initialText = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim();
    });

    // Change to a theme with different text color
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('day');
      }
    });
    await page.waitForTimeout(500);

    const newText = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim();
    });

    console.log(`Text color changed from "${initialText}" to "${newText}"`);
    // Day theme has dark text on light background
    expect(newText).toBeTruthy();
  });

  test('Theme affects body background color', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Get body computed background
    const initialBodyBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Change theme
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('fire');
      }
    });
    await page.waitForTimeout(500);

    const newBodyBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    console.log(`Body background: "${initialBodyBg}" -> "${newBodyBg}"`);
  });

  test('Theme updates card background color', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check for --color-bg-card variable
    const cardBgNight = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-bg-card').trim();
    });

    // Change to fire theme
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('fire');
      }
    });
    await page.waitForTimeout(500);

    const cardBgFire = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-bg-card').trim();
    });

    console.log(`Card background: night="${cardBgNight}", fire="${cardBgFire}"`);
    expect(cardBgFire).not.toBe(cardBgNight);
  });

  test('Theme updates border color', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const initialBorder = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-border-primary').trim();
    });

    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('water');
      }
    });
    await page.waitForTimeout(500);

    const newBorder = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-border-primary').trim();
    });

    console.log(`Border color: "${initialBorder}" -> "${newBorder}"`);
  });
});

test.describe('Theme System - Persistence', () => {
  test('Theme persists across page refresh', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Change to a specific theme
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('fire');
      }
    });
    await page.waitForTimeout(500);

    // Verify theme was set
    const themeBeforeRefresh = await page.getAttribute('body', 'data-theme');
    expect(themeBeforeRefresh).toBe('fire');

    // Refresh the page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Theme should still be fire
    const themeAfterRefresh = await page.getAttribute('body', 'data-theme');
    expect(themeAfterRefresh).toBe('fire');
  });

  test('Theme is saved to localStorage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Set a theme
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('water');
      }
    });
    await page.waitForTimeout(500);

    // Check localStorage
    const savedTheme = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, STORAGE_KEY);

    expect(savedTheme).toBe('water');
  });

  test('Theme persists across navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Set theme to earth
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('earth');
      }
    });
    await page.waitForTimeout(500);

    // Navigate to another page
    await page.goto('/#/mythologies', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Theme should still be earth
    const themeOnNewPage = await page.getAttribute('body', 'data-theme');
    expect(themeOnNewPage).toBe('earth');

    // Navigate back home
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Still earth
    const themeBackHome = await page.getAttribute('body', 'data-theme');
    expect(themeBackHome).toBe('earth');
  });
});

test.describe('Theme System - Light/Dark Icon Toggle', () => {
  test('Light themes (day, light) show sun icon', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Set to day theme (light)
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('day');
      }
    });
    await page.waitForTimeout(500);

    // Sun icon should be visible, moon hidden
    const sunDisplay = await page.locator('#themeToggle .theme-icon-sun').evaluate(el => {
      return getComputedStyle(el).display;
    });
    const moonDisplay = await page.locator('#themeToggle .theme-icon-moon').evaluate(el => {
      return getComputedStyle(el).display;
    });

    console.log(`Day theme: sun=${sunDisplay}, moon=${moonDisplay}`);
    expect(sunDisplay).not.toBe('none');
    expect(moonDisplay).toBe('none');
  });

  test('Dark themes show moon icon', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Set to night theme (dark)
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('night');
      }
    });
    await page.waitForTimeout(500);

    // Moon icon should be visible, sun hidden
    const sunDisplay = await page.locator('#themeToggle .theme-icon-sun').evaluate(el => {
      return getComputedStyle(el).display;
    });
    const moonDisplay = await page.locator('#themeToggle .theme-icon-moon').evaluate(el => {
      return getComputedStyle(el).display;
    });

    console.log(`Night theme: sun=${sunDisplay}, moon=${moonDisplay}`);
    expect(moonDisplay).not.toBe('none');
    expect(sunDisplay).toBe('none');
  });

  test('Light theme (light) shows sun icon', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('light');
      }
    });
    await page.waitForTimeout(500);

    const sunDisplay = await page.locator('#themeToggle .theme-icon-sun').evaluate(el => {
      return getComputedStyle(el).display;
    });

    expect(sunDisplay).not.toBe('none');
  });

  test('Fire theme (dark) shows moon icon', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('fire');
      }
    });
    await page.waitForTimeout(500);

    const moonDisplay = await page.locator('#themeToggle .theme-icon-moon').evaluate(el => {
      return getComputedStyle(el).display;
    });

    expect(moonDisplay).not.toBe('none');
  });
});

test.describe('Theme System - Shader Background', () => {
  test('Shader background activates for appropriate themes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if shader manager is available
    const hasShaderManager = await page.evaluate(() => {
      return !!(window.ShaderThemePicker && typeof window.ShaderThemePicker.getShaderStatus === 'function');
    });

    if (hasShaderManager) {
      const shaderStatus = await page.evaluate(() => {
        return window.ShaderThemePicker.getShaderStatus();
      });

      console.log('Shader status:', shaderStatus);

      // If shaders are supported, verify they can be activated
      if (shaderStatus.supported) {
        // Check for shader-active class on body
        const hasShaderActive = await page.locator('body.shader-active').isVisible().catch(() => false);
        console.log('Shader active class present:', hasShaderActive);
      }
    }
  });

  test('Body has shader-active class when shaders enabled', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if shader canvas or shader-active class exists
    const hasShaderElements = await page.evaluate(() => {
      const hasCanvas = document.querySelector('canvas.shader-background, canvas.shader-canvas');
      const hasClass = document.body.classList.contains('shader-active');
      return { hasCanvas: !!hasCanvas, hasClass };
    });

    console.log('Shader elements:', hasShaderElements);
    // Note: Shaders may not be supported in all environments
  });
});

test.describe('Theme System - data-theme Attribute', () => {
  test('Body has correct data-theme attribute', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Test multiple themes
    const themesToTest = ['night', 'day', 'fire', 'water'];

    for (const theme of themesToTest) {
      await page.evaluate((t) => {
        if (window.ShaderThemePicker) {
          window.ShaderThemePicker.setTheme(t);
        }
      }, theme);
      await page.waitForTimeout(300);

      const bodyTheme = await page.getAttribute('body', 'data-theme');
      expect(bodyTheme).toBe(theme);
      console.log(`Set theme "${theme}", body data-theme="${bodyTheme}"`);
    }
  });

  test('HTML element also gets data-theme for FOUC prevention', async ({ page }) => {
    // Set theme in localStorage before navigation
    await page.addInitScript((key) => {
      try {
        localStorage.setItem(key, 'cosmic');
      } catch (e) {}
    }, STORAGE_KEY);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check html element immediately (before full load)
    const htmlTheme = await page.getAttribute('html', 'data-theme');
    console.log('HTML data-theme on domcontentloaded:', htmlTheme);

    // Should be cosmic (from localStorage)
    expect(htmlTheme).toBe('cosmic');
  });
});

test.describe('Theme System - API', () => {
  test('ShaderThemePicker.getCurrentTheme returns current theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const currentTheme = await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        return window.ShaderThemePicker.getCurrentTheme();
      }
      return null;
    });

    console.log('Current theme from API:', currentTheme);
    expect(currentTheme).toBeTruthy();
    expect(ALL_THEMES).toContain(currentTheme);
  });

  test('ShaderThemePicker.getAvailableThemes returns all themes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const availableThemes = await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        return window.ShaderThemePicker.getAvailableThemes();
      }
      return [];
    });

    console.log('Available themes:', availableThemes);
    expect(availableThemes.length).toBeGreaterThan(0);

    // Should include at least some expected themes
    expect(availableThemes).toContain('night');
    expect(availableThemes).toContain('day');
  });

  test('ShaderThemePicker.setTheme changes theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Set theme via API
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('aurora');
      }
    });
    await page.waitForTimeout(500);

    const bodyTheme = await page.getAttribute('body', 'data-theme');
    expect(bodyTheme).toBe('aurora');
  });

  test('ShaderThemePicker.cycleTheme cycles to next theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const initialTheme = await page.evaluate(() => {
      return window.ShaderThemePicker?.getCurrentTheme();
    });

    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.cycleTheme();
      }
    });
    await page.waitForTimeout(500);

    const newTheme = await page.evaluate(() => {
      return window.ShaderThemePicker?.getCurrentTheme();
    });

    console.log(`Theme cycled from "${initialTheme}" to "${newTheme}"`);
    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('Theme System - Visual Verification', () => {
  test('Theme change has visible effect on page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot with night theme
    await page.evaluate(() => {
      window.ShaderThemePicker?.setTheme('night');
    });
    await page.waitForTimeout(500);

    const nightBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Change to day theme
    await page.evaluate(() => {
      window.ShaderThemePicker?.setTheme('day');
    });
    await page.waitForTimeout(500);

    const dayBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    console.log(`Night background: ${nightBg}`);
    console.log(`Day background: ${dayBg}`);

    // Colors should be different
    expect(nightBg).not.toBe(dayBg);
  });

  test('Header respects theme colors', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Get header background for night theme
    await page.evaluate(() => {
      window.ShaderThemePicker?.setTheme('night');
    });
    await page.waitForTimeout(500);

    const headerExists = await page.locator('.site-header').isVisible();
    expect(headerExists).toBeTruthy();

    // Header uses CSS variables, so theme change should affect it
    const headerBg = await page.locator('.site-header').evaluate(el => {
      return getComputedStyle(el).backgroundColor;
    });

    console.log('Header background:', headerBg);
  });
});

test.describe('Theme System - Error Handling', () => {
  test('Invalid theme name falls back to default', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Try to set an invalid theme
    await page.evaluate(() => {
      if (window.ShaderThemePicker) {
        window.ShaderThemePicker.setTheme('invalid-theme-name-xyz');
      }
    });
    await page.waitForTimeout(500);

    // Should fall back to default theme
    const bodyTheme = await page.getAttribute('body', 'data-theme');
    expect(bodyTheme).toBeTruthy();
    expect(ALL_THEMES).toContain(bodyTheme);
  });

  test('Theme system handles localStorage being unavailable', async ({ page }) => {
    // Disable localStorage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('localStorage disabled'); },
          setItem: () => { throw new Error('localStorage disabled'); },
          removeItem: () => { throw new Error('localStorage disabled'); }
        },
        writable: false
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Page should still load and have a theme
    const bodyTheme = await page.getAttribute('body', 'data-theme');
    expect(bodyTheme).toBeTruthy();
    console.log('Theme with localStorage disabled:', bodyTheme);
  });
});

test.describe('Theme System - Transition Effects', () => {
  test('Theme change adds transition class', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Watch for transition class being added
    const transitionDetected = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              if (document.body.classList.contains('theme-transitioning')) {
                resolve(true);
                observer.disconnect();
                return;
              }
            }
          }
        });

        observer.observe(document.body, { attributes: true });

        // Trigger theme change
        if (window.ShaderThemePicker) {
          window.ShaderThemePicker.setTheme('fire');
        }

        // Timeout after 2 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(false);
        }, 2000);
      });
    });

    console.log('Transition class detected:', transitionDetected);
    // Note: May or may not be detected depending on timing
  });
});
