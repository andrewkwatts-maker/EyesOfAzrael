/**
 * Comprehensive Shader Theme Picker
 * Integrates CSS themes with WebGL shader backgrounds
 *
 * Features:
 * - DOM ready timing protection
 * - Theme config validation with defaults
 * - Multi-tier storage fallback (localStorage -> sessionStorage -> memory)
 * - FOUC prevention via early theme application
 * - System preference detection (prefers-color-scheme)
 * - Theme preview thumbnails
 * - Smooth transitions between themes
 * - Integration with existing themeToggle button
 * - Accessibility support (keyboard navigation, ARIA)
 */

(function() {
    'use strict';

    // =========================================
    // CONFIGURATION
    // =========================================

    const THEME_CONFIG_PATH = '/themes/theme-config.json';
    const STORAGE_KEY = 'eoaplot-selected-theme';
    const SHADER_STORAGE_KEY = 'eoaplot-shader-enabled';
    const SYSTEM_PREF_KEY = 'eoaplot-respect-system-pref';
    const DEFAULT_THEME = 'night';
    const TRANSITION_DURATION = 400; // ms

    // Map theme names to shader files
    const SHADER_MAPPING = {
        // Featured themes
        night: 'night',
        cosmic: 'cosmic',
        sacred: 'night',        // Uses night shader with sacred colors
        golden: 'light',        // Uses light shader with golden colors
        ocean: 'water',         // Uses water shader
        fire: 'fire',
        // Light themes
        day: 'day',
        light: 'light',
        air: 'air',
        order: 'order',
        // Elemental themes
        water: 'water',
        earth: 'earth',
        storm: 'storm',
        // Cosmic themes
        celestial: 'night',
        abyssal: 'dark',
        chaos: 'chaos',
        aurora: 'aurora',
        void: 'dark'
    };

    // Theme categories for organization
    const THEME_CATEGORIES = [
        { key: 'featured', label: 'Featured Themes', icon: '⭐' },
        { key: 'cosmic', label: 'Cosmic Themes', icon: '🌌' },
        { key: 'element', label: 'Elemental Themes', icon: '🌍' },
        { key: 'light', label: 'Light Themes', icon: '☀️' }
    ];

    // Light themes (for system preference detection)
    const LIGHT_THEMES = ['day', 'light', 'air', 'order'];

    // Theme preview colors (for thumbnail generation)
    const THEME_PREVIEW_COLORS = {
        // Featured themes (6 primary themes)
        night: { bg: '#0a0e27', primary: '#8b7fff', secondary: '#ff7eb6' },
        cosmic: { bg: '#010104', primary: '#a855f7', secondary: '#ec4899' },
        sacred: { bg: '#0f0a1e', primary: '#7c3aed', secondary: '#a855f7' },
        golden: { bg: '#1a1408', primary: '#f59e0b', secondary: '#d97706' },
        ocean: { bg: '#0a1929', primary: '#0891b2', secondary: '#0284c7' },
        fire: { bg: '#1a0a0a', primary: '#dc2626', secondary: '#ea580c' },
        // Light themes
        day: { bg: '#ffffff', primary: '#2563eb', secondary: '#7c3aed' },
        light: { bg: '#fffbeb', primary: '#f59e0b', secondary: '#fbbf24' },
        air: { bg: '#f0f9ff', primary: '#0ea5e9', secondary: '#38bdf8' },
        order: { bg: '#f8fafc', primary: '#1e40af', secondary: '#0891b2' },
        // Elemental themes
        water: { bg: '#0a1929', primary: '#0891b2', secondary: '#0284c7' },
        earth: { bg: '#0f1810', primary: '#15803d', secondary: '#65a30d' },
        storm: { bg: '#0f1419', primary: '#6366f1', secondary: '#8b5cf6' },
        // Cosmic themes
        celestial: { bg: '#0f0a1e', primary: '#7c3aed', secondary: '#a855f7' },
        abyssal: { bg: '#000000', primary: '#6366f1', secondary: '#8b5cf6' },
        chaos: { bg: '#18181b', primary: '#e11d48', secondary: '#a855f7' },
        aurora: { bg: '#0a0e1a', primary: '#10b981', secondary: '#8b5cf6' },
        void: { bg: '#000000', primary: '#6366f1', secondary: '#8b5cf6' }
    };

    // Default theme configuration (fallback if config fails to load)
    const DEFAULT_THEME_CONFIG = {
        defaultTheme: 'night',
        themes: {
            night: {
                name: 'Night',
                icon: '\uD83C\uDF19',
                description: 'Dark and mysterious, like ancient tomes',
                category: 'cosmic',
                colors: {
                    'primary': '#8b7fff',
                    'primary-rgb': '139, 127, 255',
                    'secondary': '#ff7eb6',
                    'secondary-rgb': '255, 126, 182',
                    'accent': '#ffd93d',
                    'accent-rgb': '255, 217, 61',
                    'bg-primary': '#0a0e27',
                    'bg-primary-rgb': '10, 14, 39',
                    'bg-secondary': '#151a35',
                    'bg-secondary-rgb': '21, 26, 53',
                    'bg-card': '#1a1f3a',
                    'bg-card-rgb': '26, 31, 58',
                    'text-primary': '#f8f9fa',
                    'text-primary-rgb': '248, 249, 250',
                    'text-secondary': '#adb5bd',
                    'text-secondary-rgb': '173, 181, 189',
                    'text-muted': '#6c757d',
                    'text-muted-rgb': '108, 117, 125',
                    'border-primary': '#2a2f4a',
                    'border-primary-rgb': '42, 47, 74',
                    'border-accent': '#4a4f6a',
                    'border-accent-rgb': '74, 79, 106'
                }
            },
            day: {
                name: 'Day',
                icon: '\u2600\uFE0F',
                description: 'Bright and clear, like sunlit scrolls',
                category: 'cosmic',
                colors: {
                    'primary': '#2563eb',
                    'primary-rgb': '37, 99, 235',
                    'bg-primary': '#ffffff',
                    'bg-primary-rgb': '255, 255, 255',
                    'text-primary': '#0f172a',
                    'text-primary-rgb': '15, 23, 42'
                }
            }
        }
    };

    // =========================================
    // STATE
    // =========================================

    let themeConfig = null;
    let currentTheme = DEFAULT_THEME;
    let dropdown = null;
    let shaderManager = null;
    let shadersEnabled = true;
    let respectSystemPref = true;
    let isInitialized = false;
    let isTransitioning = false;

    // In-memory storage fallback
    const memoryStorage = {
        _data: {},
        getItem(key) { return this._data[key] || null; },
        setItem(key, value) { this._data[key] = value; },
        removeItem(key) { delete this._data[key]; }
    };

    // =========================================
    // STORAGE UTILITIES
    // =========================================

    /**
     * Get the best available storage mechanism
     * @returns {Object} Storage object (localStorage, sessionStorage, or memory)
     */
    function getStorage() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return localStorage;
        } catch (e) {
            try {
                const testKey = '__storage_test__';
                sessionStorage.setItem(testKey, testKey);
                sessionStorage.removeItem(testKey);
                console.warn('[Theme Picker] Using sessionStorage fallback');
                return sessionStorage;
            } catch (e2) {
                console.warn('[Theme Picker] Using in-memory storage fallback');
                return memoryStorage;
            }
        }
    }

    /**
     * Get saved theme from storage
     */
    function getSavedTheme() {
        try {
            return getStorage().getItem(STORAGE_KEY);
        } catch (error) {
            console.warn('[Theme Picker] Failed to get saved theme:', error.message);
            return null;
        }
    }

    /**
     * Save theme to storage
     */
    function saveTheme(themeName) {
        try {
            getStorage().setItem(STORAGE_KEY, themeName);
        } catch (error) {
            console.warn('[Theme Picker] Failed to save theme:', error.message);
            memoryStorage.setItem(STORAGE_KEY, themeName);
        }
    }

    /**
     * Get shaders enabled preference
     */
    function getShadersEnabled() {
        try {
            const saved = getStorage().getItem(SHADER_STORAGE_KEY);
            return saved === null ? true : saved === 'true';
        } catch (error) {
            return true;
        }
    }

    /**
     * Save shaders enabled preference
     */
    function saveShadersEnabled(enabled) {
        try {
            getStorage().setItem(SHADER_STORAGE_KEY, enabled.toString());
        } catch (error) {
            memoryStorage.setItem(SHADER_STORAGE_KEY, enabled.toString());
        }
    }

    /**
     * Get system preference respect setting
     */
    function getSystemPrefRespect() {
        try {
            const saved = getStorage().getItem(SYSTEM_PREF_KEY);
            return saved === null ? true : saved === 'true';
        } catch (error) {
            return true;
        }
    }

    /**
     * Save system preference respect setting
     */
    function saveSystemPrefRespect(respect) {
        try {
            getStorage().setItem(SYSTEM_PREF_KEY, respect.toString());
        } catch (error) {
            memoryStorage.setItem(SYSTEM_PREF_KEY, respect.toString());
        }
    }

    // =========================================
    // SYSTEM PREFERENCE DETECTION
    // =========================================

    /**
     * Detect system color scheme preference
     * @returns {'light'|'dark'} System preference
     */
    function getSystemColorScheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    }

    /**
     * Get appropriate theme based on system preference
     * @returns {string} Theme name
     */
    function getSystemPreferredTheme() {
        const scheme = getSystemColorScheme();
        return scheme === 'light' ? 'day' : 'night';
    }

    /**
     * Listen for system preference changes
     */
    function watchSystemPreference() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

        const handleChange = (e) => {
            if (respectSystemPref && !getSavedTheme()) {
                const newTheme = e.matches ? 'day' : 'night';
                applyTheme(newTheme, true);
            }
        };

        // Use addEventListener for modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else if (mediaQuery.addListener) {
            // Fallback for older browsers
            mediaQuery.addListener(handleChange);
        }
    }

    // =========================================
    // FOUC PREVENTION
    // =========================================

    /**
     * Apply theme early to prevent Flash of Unstyled Content
     * This runs before DOM is fully ready to prevent any flash
     */
    function applyEarlyTheme() {
        try {
            const storage = getStorage();
            let savedTheme = storage.getItem(STORAGE_KEY);

            // If no saved theme, check system preference
            if (!savedTheme) {
                const respectSystem = storage.getItem(SYSTEM_PREF_KEY);
                if (respectSystem !== 'false') {
                    savedTheme = getSystemPreferredTheme();
                }
            }

            // Default to night if no theme determined
            savedTheme = savedTheme || DEFAULT_THEME;

            if (document.documentElement) {
                // Apply theme immediately to prevent FOUC
                document.documentElement.setAttribute('data-theme', savedTheme);
                document.documentElement.classList.add('theme-ready');

                // Set color-scheme for native elements
                const isLight = LIGHT_THEMES.includes(savedTheme);
                document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';

                if (document.body) {
                    document.body.setAttribute('data-theme', savedTheme);
                }
                currentTheme = savedTheme;

                // Log early theme application
                console.log('[Theme Picker] Early theme applied:', savedTheme);
            }
        } catch (error) {
            // Fallback to default theme on error
            if (document.documentElement) {
                document.documentElement.setAttribute('data-theme', DEFAULT_THEME);
                document.documentElement.classList.add('theme-ready');
            }
        }
    }

    // =========================================
    // INITIALIZATION
    // =========================================

    /**
     * Initialize the shader theme picker
     */
    async function init() {
        if (isInitialized) {
            console.log('[Theme Picker] Already initialized, skipping');
            return;
        }

        // Remove legacy theme picker if present
        const legacyPicker = document.querySelector('.theme-picker-dropdown');
        if (legacyPicker) {
            legacyPicker.remove();
        }

        // Ensure DOM is ready
        if (!document.body) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                requestAnimationFrame(init);
            }
            return;
        }

        try {
            // Load theme configuration
            await loadThemeConfig();

            // Get saved preferences
            respectSystemPref = getSystemPrefRespect();
            shadersEnabled = getShadersEnabled();

            // Determine initial theme
            let savedTheme = getSavedTheme();
            if (!savedTheme && respectSystemPref) {
                savedTheme = getSystemPreferredTheme();
            }
            currentTheme = savedTheme || themeConfig.defaultTheme || DEFAULT_THEME;

            // Initialize shader manager
            initShaderManager();

            // Apply theme
            await applyTheme(currentTheme, false);

            // Create UI
            createHeaderThemePicker();

            // Connect existing themeToggle button
            connectThemeToggleButton();

            // Watch for system preference changes
            watchSystemPreference();

            // Add keyboard navigation
            setupKeyboardNavigation();

            isInitialized = true;
            console.log('[Theme Picker] Initialized successfully with theme:', currentTheme);

            // Dispatch custom event for other components
            window.dispatchEvent(new CustomEvent('themePickerReady', {
                detail: { theme: currentTheme }
            }));

        } catch (error) {
            console.error('[Theme Picker] Init error:', error);
            applyDefaultTheme();
            isInitialized = true;
        }
    }

    /**
     * Load theme configuration from JSON with validation
     */
    async function loadThemeConfig() {
        try {
            const response = await fetch(THEME_CONFIG_PATH);
            if (!response.ok) {
                throw new Error(`Failed to load theme config: ${response.status}`);
            }

            const config = await response.json();

            if (validateThemeConfig(config)) {
                themeConfig = config;
                console.log('[Theme Picker] Loaded', Object.keys(themeConfig.themes).length, 'themes');
            } else {
                console.warn('[Theme Picker] Config validation failed, using defaults');
                themeConfig = DEFAULT_THEME_CONFIG;
            }
        } catch (error) {
            console.warn('[Theme Picker] Failed to load config, using defaults:', error.message);
            themeConfig = DEFAULT_THEME_CONFIG;
        }
    }

    /**
     * Validate theme configuration structure
     */
    function validateThemeConfig(config) {
        if (!config || typeof config !== 'object') return false;
        if (!config.themes || typeof config.themes !== 'object') return false;

        const themeKeys = Object.keys(config.themes);
        if (themeKeys.length === 0) return false;

        for (const key of themeKeys) {
            const theme = config.themes[key];
            if (!theme || typeof theme !== 'object') return false;
            if (!theme.name || typeof theme.name !== 'string') return false;
        }

        return true;
    }

    /**
     * Initialize WebGL shader manager
     */
    function initShaderManager() {
        if (typeof ShaderThemeManager !== 'undefined') {
            shaderManager = new ShaderThemeManager({
                quality: 'high',
                adaptiveQuality: true,
                intensity: 1.0
            });
            console.log('[Theme Picker] Shader manager initialized');
        } else {
            console.warn('[Theme Picker] ShaderThemeManager not available');
        }
    }

    /**
     * Apply default theme fallback
     */
    function applyDefaultTheme() {
        document.body.setAttribute('data-theme', 'night');
        document.documentElement.setAttribute('data-theme', 'night');
        currentTheme = 'night';
    }

    // =========================================
    // THEME APPLICATION
    // =========================================

    /**
     * Apply theme with smooth transition
     * @param {string} themeName - Theme to apply
     * @param {boolean} withTransition - Whether to animate transition
     */
    async function applyTheme(themeName, withTransition = true) {
        if (!themeConfig || !themeConfig.themes || !themeConfig.themes[themeName]) {
            console.warn(`[Theme Picker] Theme "${themeName}" not found`);
            themeName = themeConfig?.defaultTheme || DEFAULT_THEME;
        }

        // Prevent rapid switching during transition
        if (isTransitioning) {
            return;
        }

        const theme = themeConfig.themes[themeName];
        const root = document.documentElement;
        const body = document.body;

        if (withTransition) {
            isTransitioning = true;
            body.classList.add('theme-transitioning');
        }

        // Apply CSS color variables
        if (theme.colors) {
            Object.entries(theme.colors).forEach(([key, value]) => {
                root.style.setProperty(`--color-${key}`, value);
            });
        }

        // Set data attributes for CSS hooks
        body.setAttribute('data-theme', themeName);
        root.setAttribute('data-theme', themeName);

        // Update state
        currentTheme = themeName;
        saveTheme(themeName);

        // Disable system preference respect after manual selection
        if (withTransition) {
            respectSystemPref = false;
            saveSystemPrefRespect(false);
        }

        // Apply shader background if enabled
        await applyShader(themeName);

        // Update UI elements
        updateButtonIcon();
        updateDropdownSelection();
        updateThemeToggleButton();

        // End transition
        if (withTransition) {
            setTimeout(() => {
                body.classList.remove('theme-transitioning');
                isTransitioning = false;
            }, TRANSITION_DURATION);
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, isLight: LIGHT_THEMES.includes(themeName) }
        }));

        console.log('[Theme Picker] Applied theme:', themeName);
    }

    /**
     * Apply shader for current theme
     */
    async function applyShader(themeName) {
        if (!shaderManager) return;

        if (shadersEnabled) {
            const shaderName = SHADER_MAPPING[themeName] || 'night';
            try {
                document.body.classList.add('shader-active');
                const success = await shaderManager.activate(shaderName);
                if (!success) {
                    document.body.classList.remove('shader-active');
                    document.body.classList.remove('shader-rendering');
                }
            } catch (error) {
                console.warn('[Theme Picker] Shader activation failed:', error);
                document.body.classList.remove('shader-active');
                document.body.classList.remove('shader-rendering');
            }
        } else {
            shaderManager.deactivate();
            document.body.classList.remove('shader-active');
            document.body.classList.remove('shader-rendering');
        }
    }

    /**
     * Toggle shaders on/off
     */
    async function toggleShaders() {
        shadersEnabled = !shadersEnabled;
        saveShadersEnabled(shadersEnabled);
        await applyShader(currentTheme);
        console.log('[Theme Picker] Shaders', shadersEnabled ? 'enabled' : 'disabled');
    }

    /**
     * Cycle to next theme
     */
    function cycleToNextTheme() {
        if (!themeConfig || !themeConfig.themes) return;

        // Cycle through featured themes first, then all themes
        const featuredThemes = themeConfig.featuredThemes || ['night', 'cosmic', 'sacred', 'golden', 'ocean', 'fire'];
        const currentIndex = featuredThemes.indexOf(currentTheme);

        let nextTheme;
        if (currentIndex >= 0) {
            // Currently on a featured theme, cycle through featured
            const nextIndex = (currentIndex + 1) % featuredThemes.length;
            nextTheme = featuredThemes[nextIndex];
        } else {
            // Not on a featured theme, jump to first featured theme
            nextTheme = featuredThemes[0];
        }

        applyTheme(nextTheme, true);
    }

    // =========================================
    // THEME PREVIEW (Hover Preview)
    // =========================================

    let previewTimeout = null;
    let isPreviewActive = false;
    let previewedTheme = null;

    /**
     * Preview theme on hover (shows colors without saving)
     * @param {string} themeName - Theme to preview
     */
    function previewTheme(themeName) {
        if (!themeConfig || !themeConfig.themes || !themeConfig.themes[themeName]) return;
        if (previewedTheme === themeName) return;

        // Clear any pending preview timeout
        if (previewTimeout) {
            clearTimeout(previewTimeout);
        }

        // Debounce preview to avoid rapid changes
        previewTimeout = setTimeout(() => {
            const theme = themeConfig.themes[themeName];
            const root = document.documentElement;

            // Apply preview colors with a preview class
            root.classList.add('theme-preview-active');

            // Apply CSS color variables for preview
            if (theme.colors) {
                Object.entries(theme.colors).forEach(([key, value]) => {
                    root.style.setProperty(`--color-${key}`, value);
                });
            }

            // Set preview data attribute
            root.setAttribute('data-theme-preview', themeName);

            previewedTheme = themeName;
            isPreviewActive = true;
        }, 100); // 100ms debounce
    }

    /**
     * Cancel theme preview and restore current theme
     */
    function cancelPreview() {
        if (previewTimeout) {
            clearTimeout(previewTimeout);
            previewTimeout = null;
        }

        if (!isPreviewActive) return;

        const root = document.documentElement;
        root.classList.remove('theme-preview-active');
        root.removeAttribute('data-theme-preview');

        // Restore current theme colors
        if (themeConfig && themeConfig.themes && themeConfig.themes[currentTheme]) {
            const theme = themeConfig.themes[currentTheme];
            if (theme.colors) {
                Object.entries(theme.colors).forEach(([key, value]) => {
                    root.style.setProperty(`--color-${key}`, value);
                });
            }
        }

        previewedTheme = null;
        isPreviewActive = false;
    }

    // =========================================
    // UI CREATION
    // =========================================

    /**
     * Connect to existing #themeToggle button
     */
    function connectThemeToggleButton() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle || themeToggle.dataset.shaderPickerConnected) return;

        themeToggle.dataset.shaderPickerConnected = 'true';

        // On mobile: cycle themes
        // On desktop: dropdown handles click
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                cycleToNextTheme();
            });
        }

        // Update ARIA attributes
        themeToggle.setAttribute('role', 'button');
        themeToggle.setAttribute('aria-haspopup', 'true');
        themeToggle.setAttribute('aria-expanded', 'false');
    }

    /**
     * Create header theme picker with dropdown
     */
    function createHeaderThemePicker() {
        const container = document.getElementById('themePickerContainer');
        if (!container) {
            console.warn('[Theme Picker] No themePickerContainer found');
            return;
        }

        // Prevent duplicate
        if (container.querySelector('.theme-dropdown')) return;

        // Only desktop gets dropdown
        const isMobile = window.innerWidth <= 768;
        if (isMobile) return;

        // Create dropdown
        dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        dropdown.setAttribute('role', 'menu');
        dropdown.setAttribute('aria-label', 'Theme selection');
        dropdown.style.display = 'none';
        dropdown.id = 'themeDropdown';

        // Build content
        buildDropdownContent();

        // Get toggle button
        const themeButton = document.getElementById('themeToggle');

        // Toggle dropdown on click
        if (themeButton && !themeButton.dataset.dropdownConnected) {
            themeButton.dataset.dropdownConnected = 'true';
            themeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleDropdown();
            });
        }

        // Handle theme selection
        dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.theme-option');
            if (option && option.dataset.theme) {
                const themeName = option.dataset.theme;
                applyTheme(themeName, true);
                closeDropdown();
            }

            // Handle shader toggle
            const shaderToggle = e.target.closest('.shader-toggle');
            if (shaderToggle) {
                e.stopPropagation();
                toggleShaders();
                updateDropdownContent();
            }
        });

        // Handle theme preview on hover
        dropdown.addEventListener('mouseenter', (e) => {
            const option = e.target.closest('.theme-option');
            if (option && option.dataset.theme) {
                previewTheme(option.dataset.theme);
            }
        }, true);

        dropdown.addEventListener('mouseleave', (e) => {
            const option = e.target.closest('.theme-option');
            if (option && option.dataset.theme) {
                cancelPreview();
            }
        }, true);

        // Use event delegation for hover preview
        dropdown.addEventListener('mouseover', (e) => {
            const option = e.target.closest('.theme-option');
            if (option && option.dataset.theme && !option.classList.contains('shader-toggle')) {
                previewTheme(option.dataset.theme);
            }
        });

        dropdown.addEventListener('mouseout', (e) => {
            const option = e.target.closest('.theme-option');
            const relatedTarget = e.relatedTarget?.closest('.theme-option');
            if (option && !relatedTarget) {
                cancelPreview();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                closeDropdown();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dropdown.style.display === 'block') {
                closeDropdown();
                document.getElementById('themeToggle')?.focus();
            }
        });

        container.appendChild(dropdown);
        container.classList.add('has-dropdown');
    }

    /**
     * Build dropdown content with categorized themes
     */
    function buildDropdownContent() {
        if (!dropdown || !themeConfig) return;

        // Group themes by category
        const themesByCategory = {};
        Object.entries(themeConfig.themes).forEach(([key, theme]) => {
            const category = theme.category || 'other';
            if (!themesByCategory[category]) {
                themesByCategory[category] = [];
            }
            themesByCategory[category].push({ key, ...theme });
        });

        let html = '';

        // Add categories
        THEME_CATEGORIES.forEach(({ key, label, icon }) => {
            const themes = themesByCategory[key];
            if (!themes) return;

            html += `<div class="theme-category" role="group" aria-label="${label}">`;
            html += `<div class="theme-category-label">${icon} ${label}</div>`;

            themes.forEach(theme => {
                const isActive = theme.key === currentTheme;
                const hasShader = SHADER_MAPPING[theme.key] ? true : false;
                const preview = generateThemePreview(theme.key);
                const featuredThemes = themeConfig.featuredThemes || ['night', 'cosmic', 'sacred', 'golden', 'ocean', 'fire'];
                const isFeatured = featuredThemes.includes(theme.key);

                html += `
                    <button class="theme-option ${isActive ? 'active' : ''}"
                            data-theme="${theme.key}"
                            data-featured="${isFeatured}"
                            role="menuitemradio"
                            aria-checked="${isActive}"
                            title="${theme.description || theme.name}">
                        <span class="theme-preview" aria-hidden="true">${preview}</span>
                        <span class="theme-icon" aria-hidden="true">${theme.icon || ''}</span>
                        <span class="theme-name">${theme.name}</span>
                        ${hasShader ? '<span class="theme-shader-badge" title="Has animated background" aria-label="Animated background available"></span>' : ''}
                        ${isActive ? '<span class="theme-check" aria-hidden="true"></span>' : ''}
                    </button>
                `;
            });

            html += '</div>';
        });

        // Add shader toggle
        html += `
            <div class="theme-category theme-settings">
                <div class="theme-category-label">Settings</div>
                <button class="theme-option shader-toggle" role="switch" aria-checked="${shadersEnabled}">
                    <span class="theme-icon" aria-hidden="true"></span>
                    <span class="theme-name">Animated Backgrounds</span>
                    <span class="toggle-switch ${shadersEnabled ? 'on' : ''}" aria-hidden="true"></span>
                </button>
            </div>
        `;

        dropdown.innerHTML = html;
    }

    /**
     * Update dropdown content (for toggle changes)
     */
    function updateDropdownContent() {
        buildDropdownContent();
    }

    /**
     * Generate theme preview thumbnail with enhanced gradient swatch
     */
    function generateThemePreview(themeName) {
        const colors = THEME_PREVIEW_COLORS[themeName] || THEME_PREVIEW_COLORS.night;
        const isLight = LIGHT_THEMES.includes(themeName);

        // Create a more sophisticated preview with gradient and glow
        return `
            <svg width="28" height="28" viewBox="0 0 28 28" style="border-radius: 6px; overflow: hidden;">
                <defs>
                    <linearGradient id="grad-${themeName}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:0.9" />
                        <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:0.7" />
                    </linearGradient>
                    <filter id="glow-${themeName}" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <rect width="28" height="28" fill="${colors.bg}"/>
                <rect x="2" y="2" width="24" height="24" rx="4" fill="url(#grad-${themeName})" opacity="0.3"/>
                <circle cx="10" cy="14" r="5" fill="${colors.primary}" filter="url(#glow-${themeName})" opacity="0.9"/>
                <circle cx="18" cy="14" r="4" fill="${colors.secondary}" opacity="0.75"/>
                ${isLight ? '<circle cx="22" cy="6" r="2" fill="#fbbf24" opacity="0.8"/>' : '<circle cx="6" cy="6" r="1.5" fill="white" opacity="0.5"/>'}
            </svg>
        `;
    }

    /**
     * Toggle dropdown visibility
     */
    function toggleDropdown() {
        if (!dropdown) return;

        const isOpen = dropdown.style.display === 'block';
        const themeButton = document.getElementById('themeToggle');

        if (isOpen) {
            closeDropdown();
        } else {
            dropdown.style.display = 'block';
            themeButton?.setAttribute('aria-expanded', 'true');

            // Focus first option
            const firstOption = dropdown.querySelector('.theme-option');
            firstOption?.focus();
        }
    }

    /**
     * Close dropdown
     */
    function closeDropdown() {
        if (!dropdown) return;

        dropdown.style.display = 'none';
        document.getElementById('themeToggle')?.setAttribute('aria-expanded', 'false');
    }

    /**
     * Update dropdown selection indicators
     */
    function updateDropdownSelection() {
        if (!dropdown) return;

        dropdown.querySelectorAll('.theme-option[data-theme]').forEach(option => {
            const themeName = option.dataset.theme;
            const isActive = themeName === currentTheme;

            option.classList.toggle('active', isActive);
            option.setAttribute('aria-checked', isActive);

            const existingCheck = option.querySelector('.theme-check');
            if (isActive && !existingCheck) {
                const check = document.createElement('span');
                check.className = 'theme-check';
                check.setAttribute('aria-hidden', 'true');
                check.textContent = '';
                option.appendChild(check);
            } else if (!isActive && existingCheck) {
                existingCheck.remove();
            }
        });
    }

    /**
     * Update main button icon
     */
    function updateButtonIcon() {
        const button = document.querySelector('.theme-picker-btn');
        if (button && themeConfig?.themes?.[currentTheme]) {
            button.textContent = themeConfig.themes[currentTheme].icon || '';
        }
    }

    /**
     * Update #themeToggle button icon with smooth animation
     */
    function updateThemeToggleButton() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const themeName = currentTheme || 'night';
        const themeData = themeConfig?.themes?.[themeName];
        const isLightTheme = LIGHT_THEMES.includes(themeName);

        // Handle SVG icons with CSS-based transitions
        const moonIcon = themeToggle.querySelector('.theme-icon-moon');
        const sunIcon = themeToggle.querySelector('.theme-icon-sun');

        if (moonIcon && sunIcon) {
            // CSS handles the transition via data-theme attribute
            // Just ensure proper display states
            moonIcon.style.display = '';
            sunIcon.style.display = '';

            // Add/remove light-theme class for additional styling
            themeToggle.classList.toggle('light-theme', isLightTheme);

            // Trigger icon animation
            themeToggle.classList.add('icon-transitioning');
            setTimeout(() => {
                themeToggle.classList.remove('icon-transitioning');
            }, 300);
        } else if (themeData?.icon) {
            // Legacy emoji icon with fade transition
            themeToggle.style.opacity = '0';
            setTimeout(() => {
                themeToggle.textContent = themeData.icon;
                themeToggle.style.opacity = '1';
            }, 150);
        }

        // Update ARIA attributes
        themeToggle.setAttribute('aria-label',
            `Current theme: ${themeData?.name || themeName}. Click to change theme.`
        );
        themeToggle.setAttribute('aria-pressed', isLightTheme ? 'true' : 'false');
        themeToggle.title = `Theme: ${themeData?.name || themeName}`;

        // Update data attribute for CSS styling
        themeToggle.dataset.currentTheme = themeName;
        themeToggle.dataset.isLight = isLightTheme;
    }

    // =========================================
    // KEYBOARD NAVIGATION
    // =========================================

    /**
     * Setup keyboard navigation for dropdown
     */
    function setupKeyboardNavigation() {
        if (!dropdown) return;

        dropdown.addEventListener('keydown', (e) => {
            const options = Array.from(dropdown.querySelectorAll('.theme-option'));
            const currentFocus = document.activeElement;
            const currentIndex = options.indexOf(currentFocus);

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < options.length - 1) {
                        options[currentIndex + 1].focus();
                    } else {
                        options[0].focus();
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        options[currentIndex - 1].focus();
                    } else {
                        options[options.length - 1].focus();
                    }
                    break;

                case 'Home':
                    e.preventDefault();
                    options[0]?.focus();
                    break;

                case 'End':
                    e.preventDefault();
                    options[options.length - 1]?.focus();
                    break;

                case 'Enter':
                case ' ':
                    e.preventDefault();
                    currentFocus?.click();
                    break;

                case 'Tab':
                    closeDropdown();
                    break;
            }
        });
    }

    // =========================================
    // PUBLIC API
    // =========================================

    window.ShaderThemePicker = {
        // Theme management
        setTheme: (themeName) => applyTheme(themeName, true),
        getCurrentTheme: () => currentTheme,
        getAvailableThemes: () => themeConfig ? Object.keys(themeConfig.themes) : [],
        getFeaturedThemes: () => themeConfig?.featuredThemes || ['night', 'cosmic', 'sacred', 'golden', 'ocean', 'fire'],
        getThemeInfo: (themeName) => themeConfig?.themes?.[themeName] || null,
        cycleTheme: () => cycleToNextTheme(),

        // Theme preview
        previewTheme: (themeName) => previewTheme(themeName),
        cancelPreview: () => cancelPreview(),

        // Shaders
        toggleShaders: () => toggleShaders(),
        getShadersEnabled: () => shadersEnabled,

        // State
        isInitialized: () => isInitialized,
        isLightTheme: () => LIGHT_THEMES.includes(currentTheme),

        // System preference
        respectSystemPreference: (respect) => {
            respectSystemPref = respect;
            saveSystemPrefRespect(respect);
            if (respect && !getSavedTheme()) {
                applyTheme(getSystemPreferredTheme(), true);
            }
        },
        getSystemPreference: () => getSystemColorScheme(),

        // Status
        getShaderStatus: () => {
            if (shaderManager) {
                return shaderManager.getStatus ? shaderManager.getStatus() : { enabled: shadersEnabled };
            }
            return { enabled: false, supported: false };
        },

        // Entity-type accent colors
        getEntityTypeAccent: (entityType) => {
            const ENTITY_ACCENTS = {
                deity: { color: '#f59e0b', rgb: '245, 158, 11' },      // Golden amber
                hero: { color: '#3b82f6', rgb: '59, 130, 246' },       // Heroic blue
                creature: { color: '#10b981', rgb: '16, 185, 129' },   // Nature green
                item: { color: '#8b5cf6', rgb: '139, 92, 246' },       // Magical purple
                place: { color: '#06b6d4', rgb: '6, 182, 212' },       // Sacred cyan
                text: { color: '#d97706', rgb: '217, 119, 6' },        // Scroll amber
                ritual: { color: '#dc2626', rgb: '220, 38, 38' },      // Ritual red
                herb: { color: '#22c55e', rgb: '34, 197, 94' },        // Herb green
                archetype: { color: '#ec4899', rgb: '236, 72, 153' },  // Archetype pink
                symbol: { color: '#7c3aed', rgb: '124, 58, 237' },     // Symbol violet
                mythology: { color: '#8b7fff', rgb: '139, 127, 255' }  // Theme primary
            };
            return ENTITY_ACCENTS[entityType?.toLowerCase()] || ENTITY_ACCENTS.mythology;
        },

        // Mythology accent colors
        getMythologyAccent: (mythologyId) => {
            const MYTHOLOGY_ACCENTS = {
                greek: { color: '#DAA520', rgb: '218, 165, 32' },
                norse: { color: '#4682B4', rgb: '70, 130, 180' },
                egyptian: { color: '#CD853F', rgb: '205, 133, 63' },
                hindu: { color: '#FF6347', rgb: '255, 99, 71' },
                buddhist: { color: '#FFD700', rgb: '255, 215, 0' },
                chinese: { color: '#DC143C', rgb: '220, 20, 60' },
                japanese: { color: '#C41E3A', rgb: '196, 30, 58' },
                celtic: { color: '#228B22', rgb: '34, 139, 34' },
                roman: { color: '#800080', rgb: '128, 0, 128' },
                babylonian: { color: '#CD853F', rgb: '205, 133, 63' },
                mayan: { color: '#40E0D0', rgb: '64, 224, 208' },
                aztec: { color: '#40E0D0', rgb: '64, 224, 208' },
                yoruba: { color: '#DAA520', rgb: '218, 165, 32' },
                slavic: { color: '#2F4F2F', rgb: '47, 79, 47' },
                persian: { color: '#9932CC', rgb: '153, 50, 204' }
            };
            return MYTHOLOGY_ACCENTS[mythologyId?.toLowerCase()] || { color: '#8b7fff', rgb: '139, 127, 255' };
        }
    };

    // =========================================
    // BOOTSTRAP
    // =========================================

    // Apply early theme to prevent FOUC
    applyEarlyTheme();

    // Safe initialization
    function safeInit() {
        if (isInitialized) return;

        if (!document.body) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', safeInit, { once: true });
            } else {
                requestAnimationFrame(safeInit);
            }
            return;
        }

        init();
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeInit, { once: true });
    } else if (document.readyState === 'interactive') {
        safeInit();
    } else {
        safeInit();
    }

    // Fallback on window load
    window.addEventListener('load', () => {
        if (!isInitialized) {
            console.log('[Theme Picker] Late initialization on window.load');
            safeInit();
        }
    }, { once: true });

    // Handle window resize (mobile/desktop switch)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const isMobile = window.innerWidth <= 768;
            const container = document.getElementById('themePickerContainer');

            if (isMobile && dropdown) {
                dropdown.style.display = 'none';
            } else if (!isMobile && !dropdown && container) {
                createHeaderThemePicker();
            }
        }, 250);
    });

})();
