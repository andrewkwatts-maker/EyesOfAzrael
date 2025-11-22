/**
 * EOAPlot Theme System - Theme Picker
 * Manages theme switching and persistence across all documentation pages
 */

(function() {
    'use strict';

    // Prevent duplicate initialization
    if (window.ThemePicker) {
        console.warn('Theme picker already initialized');
        return;
    }

    // Calculate theme config path relative to the script location
    function getThemeConfigPath() {
        const scriptPath = document.currentScript ? document.currentScript.src : '';
        if (scriptPath) {
            const themesIndex = scriptPath.lastIndexOf('/themes/');
            if (themesIndex !== -1) {
                return scriptPath.substring(0, themesIndex + '/themes/'.length) + 'theme-config.json';
            }
        }
        // Fallback: try to find themes directory relative to current page
        const depth = (window.location.pathname.match(/\//g) || []).length - 2;
        const prefix = '../'.repeat(Math.max(0, depth));
        return prefix + 'themes/theme-config.json';
    }

    const THEME_CONFIG_PATH = getThemeConfigPath();
    const STORAGE_KEY = 'eoaplot-selected-theme';
    const DEFAULT_THEME = 'night';

    let themeConfig = null;
    let currentTheme = DEFAULT_THEME;

    /**
     * Initialize the theme system
     */
    async function init() {
        try {
            // Load theme configuration
            await loadThemeConfig();

            // Restore saved theme or use default
            currentTheme = getSavedTheme() || themeConfig.defaultTheme || DEFAULT_THEME;

            // Apply the theme
            applyTheme(currentTheme, false);

            // Create theme picker UI
            createThemePicker();

        } catch (error) {
            console.error('Failed to initialize theme system:', error);
            // Fallback to default theme
            applyDefaultTheme();
        }
    }

    /**
     * Load theme configuration from JSON file
     */
    async function loadThemeConfig() {
        const response = await fetch(THEME_CONFIG_PATH);
        if (!response.ok) {
            throw new Error(`Failed to load theme config: ${response.status}`);
        }
        themeConfig = await response.json();
    }

    /**
     * Get saved theme from localStorage
     */
    function getSavedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn('localStorage not available:', error);
            return null;
        }
    }

    /**
     * Save theme to localStorage
     */
    function saveTheme(themeName) {
        try {
            localStorage.setItem(STORAGE_KEY, themeName);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }

    /**
     * Apply a theme by name
     */
    function applyTheme(themeName, withTransition = true) {
        if (!themeConfig || !themeConfig.themes || !themeConfig.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found, using default`);
            themeName = themeConfig?.defaultTheme || DEFAULT_THEME;
        }

        const theme = themeConfig.themes[themeName];
        const root = document.documentElement;
        const body = document.body;

        // Add transition class
        if (withTransition) {
            body.classList.add('theme-transitioning');
        }

        // Apply color variables
        if (theme.colors) {
            Object.entries(theme.colors).forEach(([key, value]) => {
                // Convert kebab-case config keys to CSS variable names
                const cssVarName = `--color-${key}`;
                root.style.setProperty(cssVarName, value);
            });
        }

        // Set data-theme attribute for theme-specific CSS
        body.setAttribute('data-theme', themeName);

        currentTheme = themeName;
        saveTheme(themeName);

        // Update active state in theme picker
        updateThemePickerUI();

        // Remove transition class after animation completes
        if (withTransition) {
            setTimeout(() => {
                body.classList.remove('theme-transitioning');
            }, 300);
        }
    }

    /**
     * Apply default theme (fallback)
     */
    function applyDefaultTheme() {
        const root = document.documentElement;

        // Default (Night) theme colors
        const defaults = {
            '--color-primary': '#8b7fff',
            '--color-primary-rgb': '139, 127, 255',
            '--color-secondary': '#ff7eb6',
            '--color-secondary-rgb': '255, 126, 182',
            '--color-accent': '#ffd93d',
            '--color-accent-rgb': '255, 217, 61',
            '--color-bg-primary': '#0a0e27',
            '--color-bg-primary-rgb': '10, 14, 39',
            '--color-bg-secondary': '#151a35',
            '--color-bg-secondary-rgb': '21, 26, 53',
            '--color-bg-card': '#1a1f3a',
            '--color-bg-card-rgb': '26, 31, 58',
            '--color-text-primary': '#f8f9fa',
            '--color-text-primary-rgb': '248, 249, 250',
            '--color-text-secondary': '#adb5bd',
            '--color-text-secondary-rgb': '173, 181, 189',
            '--color-text-muted': '#6c757d',
            '--color-text-muted-rgb': '108, 117, 125',
            '--color-border-primary': '#2a2f4a',
            '--color-border-primary-rgb': '42, 47, 74',
            '--color-border-accent': '#4a4f6a',
            '--color-border-accent-rgb': '74, 79, 106'
        };

        Object.entries(defaults).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        document.body.setAttribute('data-theme', 'night');
    }

    /**
     * Create the theme picker UI
     */
    function createThemePicker() {
        // Create container
        const container = document.createElement('div');
        container.className = 'theme-picker';
        container.setAttribute('aria-label', 'Theme Selector');

        // Create toggle button
        const button = document.createElement('button');
        button.className = 'theme-picker-btn';
        button.setAttribute('aria-label', 'Choose Theme');
        button.setAttribute('aria-expanded', 'false');
        button.innerHTML = '🎨';

        // Create dropdown menu
        const dropdown = document.createElement('div');
        dropdown.className = 'theme-picker-dropdown';
        dropdown.setAttribute('role', 'menu');

        // Add header
        const header = document.createElement('div');
        header.className = 'theme-picker-header';
        header.innerHTML = `
            <h3>Choose Your Theme</h3>
            <p>Select a visual style for your exploration</p>
        `;
        dropdown.appendChild(header);

        // Create grid container
        const grid = document.createElement('div');
        grid.className = 'theme-picker-grid';

        // Populate grid with theme options
        if (themeConfig && themeConfig.themes) {
            Object.entries(themeConfig.themes).forEach(([themeId, theme]) => {
                const card = createThemeCard(themeId, theme);
                grid.appendChild(card);
            });
        }

        dropdown.appendChild(grid);

        // Toggle dropdown on button click
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.toggle('open');
            button.setAttribute('aria-expanded', isOpen.toString());
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('open');
                button.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
                button.setAttribute('aria-expanded', 'false');
                button.focus();
            }
        });

        // Assemble picker
        container.appendChild(button);
        container.appendChild(dropdown);

        // Add to page - prefer header-content if available, otherwise body
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            container.style.position = 'relative';
            container.style.marginLeft = 'auto';
            headerContent.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
    }

    /**
     * Create a theme card element
     */
    function createThemeCard(themeId, theme) {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.setAttribute('role', 'menuitem');
        card.setAttribute('tabindex', '0');
        card.setAttribute('data-theme-id', themeId);

        if (themeId === currentTheme) {
            card.classList.add('active');
        }

        const icon = document.createElement('div');
        icon.className = 'theme-card-icon';
        icon.textContent = theme.icon || '⚪';

        const content = document.createElement('div');
        content.className = 'theme-card-content';

        const name = document.createElement('div');
        name.className = 'theme-card-name';
        name.textContent = theme.name || themeId;

        const description = document.createElement('div');
        description.className = 'theme-card-description';
        description.textContent = theme.description || '';

        const checkmark = document.createElement('div');
        checkmark.className = 'theme-card-checkmark';
        checkmark.innerHTML = '✓';

        content.appendChild(name);
        content.appendChild(description);
        card.appendChild(icon);
        card.appendChild(content);
        card.appendChild(checkmark);

        // Handle selection
        const selectTheme = () => {
            applyTheme(themeId, true);

            // Close dropdown
            const dropdown = card.closest('.theme-picker-dropdown');
            if (dropdown) {
                dropdown.classList.remove('open');
                const picker = dropdown.closest('.theme-picker');
                if (picker) {
                    const button = picker.querySelector('.theme-picker-btn');
                    if (button) {
                        button.setAttribute('aria-expanded', 'false');
                    }
                }
            }
        };

        card.addEventListener('click', selectTheme);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectTheme();
            }
        });

        return card;
    }

    /**
     * Update theme picker UI to reflect current theme
     */
    function updateThemePickerUI() {
        const cards = document.querySelectorAll('.theme-card');
        cards.forEach(card => {
            const themeId = card.getAttribute('data-theme-id');
            if (themeId === currentTheme) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    /**
     * Expose API for manual theme switching
     */
    window.ThemePicker = {
        setTheme: (themeName) => applyTheme(themeName, true),
        getCurrentTheme: () => currentTheme,
        getAvailableThemes: () => themeConfig ? Object.keys(themeConfig.themes) : [],
        getThemeConfig: () => themeConfig
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
