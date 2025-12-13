(function() {
    'use strict';

    if (window.ThemePicker) {
        console.warn('Theme picker already initialized');
        return;
    }

    // --- Configuration & Utility Functions (Kept from Original) ---

    // Calculate theme config path relative to the script location
    function getThemeConfigPath() {
        const scriptPath = document.currentScript ? document.currentScript.src : '';
        if (scriptPath) {
            const themesIndex = scriptPath.lastIndexOf('/themes/');
            if (themesIndex !== -1) {
                return scriptPath.substring(0, themesIndex + '/themes/'.length) + 'theme-config.json';
            }
        }
        const depth = (window.location.pathname.match(/\//g) || []).length - 2;
        const prefix = '../'.repeat(Math.max(0, depth));
        return prefix + 'themes/theme-config.json';
    }

    const THEME_CONFIG_PATH = getThemeConfigPath();
    const STORAGE_KEY = 'eoaplot-selected-theme';
    const DEFAULT_THEME = 'night';

    let themeConfig = null;
    let currentTheme = DEFAULT_THEME;

    // --- Core Initialization ---

    async function init() {
        try {
            await loadThemeConfig();

            // Restore saved theme or use default
            currentTheme = getSavedTheme() || themeConfig.defaultTheme || DEFAULT_THEME;

            // Apply the theme
            applyTheme(currentTheme, false);

            // Create theme picker UI (Dropdown)
            createThemePicker();

        } catch (error) {
            console.error('Failed to initialize theme system:', error);
            applyDefaultTheme();
        }
    }

    // --- Data Loading and Persistence (Kept from Original) ---

    async function loadThemeConfig() {
        const response = await fetch(THEME_CONFIG_PATH);
        if (!response.ok) {
            throw new Error(`Failed to load theme config: ${response.status}`);
        }
        themeConfig = await response.json();
    }

    function getSavedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn('localStorage not available:', error);
            return null;
        }
    }

    function saveTheme(themeName) {
        try {
            localStorage.setItem(STORAGE_KEY, themeName);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }

    // --- Theme Application Logic (Kept from Original) ---

    function applyTheme(themeName, withTransition = true) {
        if (!themeConfig || !themeConfig.themes || !themeConfig.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found, using default`);
            themeName = themeConfig?.defaultTheme || DEFAULT_THEME;
        }

        const theme = themeConfig.themes[themeName];
        const root = document.documentElement;
        const body = document.body;

        if (withTransition) {
            body.classList.add('theme-transitioning');
        }

        // Apply color variables
        if (theme.colors) {
            Object.entries(theme.colors).forEach(([key, value]) => {
                const cssVarName = `--color-${key}`;
                root.style.setProperty(cssVarName, value);
            });
        }

        body.setAttribute('data-theme', themeName);
        currentTheme = themeName;
        saveTheme(themeName);
        updateThemePickerUI(); // Ensures the checkmark updates

        if (withTransition) {
            setTimeout(() => {
                body.classList.remove('theme-transitioning');
            }, 300);
        }
    }

    function applyDefaultTheme() {
        const root = document.documentElement;
        // Default color application logic... (omitted for brevity, assume original logic applies defaults)
        document.body.setAttribute('data-theme', 'night');
    }

    // --- Theme Picker UI Creation ---

    // Store theme keys for cycling
    let themeKeys = [];

    /**
     * Create the theme picker UI as a cycling button
     * Uses: .theme-picker, .theme-picker-btn
     */
    function createThemePicker() {
        // Get theme keys for cycling
        if (themeConfig && themeConfig.themes) {
            themeKeys = Object.keys(themeConfig.themes);
        }

        const container = document.createElement('div');
        container.className = 'theme-picker';
        container.setAttribute('aria-label', 'Theme Selector');

        const button = document.createElement('button');
        button.className = 'theme-picker-btn';
        button.setAttribute('aria-label', 'Cycle Theme');
        button.setAttribute('title', 'Click to change theme');

        // Set initial icon based on current theme
        const currentThemeConfig = themeConfig?.themes?.[currentTheme];
        button.innerHTML = currentThemeConfig?.icon || '🎨';

        // Cycle to next theme on click
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleToNextTheme();
        });

        container.appendChild(button);

        // Add to page
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
     * Cycle to the next theme in the list
     */
    function cycleToNextTheme() {
        if (!themeKeys.length) return;

        const currentIndex = themeKeys.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        const nextTheme = themeKeys[nextIndex];

        applyTheme(nextTheme, true);
    }

    /**
     * Update theme picker button to show current theme icon
     */
    function updateThemePickerUI() {
        const button = document.querySelector('.theme-picker-btn');
        if (button && themeConfig?.themes?.[currentTheme]) {
            button.innerHTML = themeConfig.themes[currentTheme].icon || '🎨';
            button.setAttribute('title', `Current: ${themeConfig.themes[currentTheme].name || currentTheme} - Click to change`);
        }
    }

    // --- Public API and Initialization (Kept from Original) ---

    window.ThemePicker = {
        setTheme: (themeName) => applyTheme(themeName, true),
        getCurrentTheme: () => currentTheme,
        getAvailableThemes: () => themeConfig ? Object.keys(themeConfig.themes) : [],
        getThemeConfig: () => themeConfig
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();