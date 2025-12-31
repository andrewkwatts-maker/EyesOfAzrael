/**
 * Comprehensive Shader Theme Picker
 * Integrates CSS themes with WebGL shader backgrounds
 * Shows all 10+ themes in a beautiful dropdown
 *
 * Features:
 * - DOM ready timing protection
 * - Theme config validation with defaults
 * - Multi-tier storage fallback (localStorage -> sessionStorage -> memory)
 * - FOUC prevention via early theme application
 * - Integration with existing themeToggle button
 */

(function() {
    'use strict';

    const THEME_CONFIG_PATH = '/themes/theme-config.json';
    const STORAGE_KEY = 'eoaplot-selected-theme';
    const SHADER_STORAGE_KEY = 'eoaplot-shader-enabled';
    const DEFAULT_THEME = 'night';

    // Map theme names to shader files
    const SHADER_MAPPING = {
        day: 'day',
        night: 'night',
        fire: 'fire',
        water: 'water',
        earth: 'earth',
        air: 'air',
        celestial: 'night', // Use night shader for celestial (starry)
        abyssal: 'dark', // Use dark shader for abyssal
        chaos: 'chaos',
        order: 'order',
        aurora: 'aurora',
        storm: 'storm',
        cosmic: 'cosmic',
        void: 'dark', // Use dark shader for void
        light: 'light'
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

    // In-memory storage fallback
    const memoryStorage = {
        _data: {},
        getItem(key) { return this._data[key] || null; },
        setItem(key, value) { this._data[key] = value; }
    };

    let themeConfig = null;
    let currentTheme = DEFAULT_THEME;
    let dropdown = null;
    let shaderManager = null;
    let shadersEnabled = true;
    let isInitialized = false;

    /**
     * Get the best available storage mechanism
     * @returns {Object} Storage object (localStorage, sessionStorage, or memory)
     */
    function getStorage() {
        // Try localStorage first
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return localStorage;
        } catch (e) {
            // localStorage not available, try sessionStorage
            try {
                const testKey = '__storage_test__';
                sessionStorage.setItem(testKey, testKey);
                sessionStorage.removeItem(testKey);
                console.warn('[Shader Theme Picker] Using sessionStorage fallback');
                return sessionStorage;
            } catch (e2) {
                // Both failed, use in-memory storage
                console.warn('[Shader Theme Picker] Using in-memory storage fallback');
                return memoryStorage;
            }
        }
    }

    /**
     * Apply theme early to prevent FOUC (Flash of Unstyled Content)
     * This runs synchronously before full initialization
     */
    function applyEarlyTheme() {
        try {
            const storage = getStorage();
            const savedTheme = storage.getItem(STORAGE_KEY);
            if (savedTheme && document.documentElement) {
                // Set data-theme attribute early
                if (document.body) {
                    document.body.setAttribute('data-theme', savedTheme);
                }
                currentTheme = savedTheme;
                console.log('[Shader Theme Picker] Applied early theme:', savedTheme);
            }
        } catch (error) {
            // Silent fail for early theme - full init will handle it
        }
    }

    /**
     * Initialize the shader theme picker
     */
    async function init() {
        // Prevent double initialization
        if (isInitialized) {
            console.log('[Shader Theme Picker] Already initialized, skipping');
            return;
        }

        // Ensure DOM is ready
        if (!document.body) {
            console.warn('[Shader Theme Picker] DOM not ready, deferring initialization');
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                // Fallback: wait for next frame
                requestAnimationFrame(init);
            }
            return;
        }

        try {
            // Load theme configuration
            await loadThemeConfig();

            // Get saved preferences
            currentTheme = getSavedTheme() || themeConfig.defaultTheme || DEFAULT_THEME;
            shadersEnabled = getShadersEnabled();

            // Initialize shader manager
            initShaderManager();

            // Apply theme
            await applyTheme(currentTheme, false);

            // Create UI
            createHeaderThemePicker();

            // Connect existing themeToggle button if present
            connectThemeToggleButton();

            isInitialized = true;
            console.log('[Shader Theme Picker] Initialized successfully');
        } catch (error) {
            console.error('[Shader Theme Picker] Init error:', error);
            applyDefaultTheme();
            isInitialized = true; // Mark as initialized even on error to prevent loops
        }
    }

    /**
     * Connect to the existing #themeToggle button in the header
     * This button exists in index.html and should work with our theme system
     */
    function connectThemeToggleButton() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // Check if we've already transformed this button
            if (themeToggle.dataset.shaderPickerConnected) {
                return;
            }

            // Mark as connected
            themeToggle.dataset.shaderPickerConnected = 'true';

            // Update button icon to match current theme
            const currentThemeConfig = themeConfig?.themes?.[currentTheme];
            if (currentThemeConfig?.icon) {
                themeToggle.textContent = currentThemeConfig.icon;
            }

            // Add click handler to cycle through themes
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                cycleToNextTheme();
            });

            console.log('[Shader Theme Picker] Connected to #themeToggle button');
        }
    }

    /**
     * Cycle to the next theme in the list
     */
    function cycleToNextTheme() {
        if (!themeConfig || !themeConfig.themes) return;

        const themeKeys = Object.keys(themeConfig.themes);
        const currentIndex = themeKeys.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        const nextTheme = themeKeys[nextIndex];

        applyTheme(nextTheme, true);
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
            console.log('[Shader Theme Picker] Shader manager initialized');
        } else {
            console.warn('[Shader Theme Picker] ShaderThemeManager not available');
        }
    }

    /**
     * Validate theme configuration structure
     * @param {Object} config - Configuration object to validate
     * @returns {boolean} True if valid
     */
    function validateThemeConfig(config) {
        // Check basic structure
        if (!config || typeof config !== 'object') {
            console.warn('[Shader Theme Picker] Invalid config: not an object');
            return false;
        }

        // Must have themes object
        if (!config.themes || typeof config.themes !== 'object') {
            console.warn('[Shader Theme Picker] Invalid config: missing themes object');
            return false;
        }

        // Must have at least one theme
        const themeKeys = Object.keys(config.themes);
        if (themeKeys.length === 0) {
            console.warn('[Shader Theme Picker] Invalid config: no themes defined');
            return false;
        }

        // Validate each theme has required properties
        for (const key of themeKeys) {
            const theme = config.themes[key];
            if (!theme || typeof theme !== 'object') {
                console.warn(`[Shader Theme Picker] Invalid theme "${key}": not an object`);
                return false;
            }
            // Theme must have at least a name
            if (!theme.name || typeof theme.name !== 'string') {
                console.warn(`[Shader Theme Picker] Invalid theme "${key}": missing name`);
                return false;
            }
        }

        return true;
    }

    /**
     * Load theme configuration from JSON with validation and fallback
     */
    async function loadThemeConfig() {
        try {
            const response = await fetch(THEME_CONFIG_PATH);
            if (!response.ok) {
                throw new Error(`Failed to load theme config: ${response.status}`);
            }

            const config = await response.json();

            // Validate the loaded configuration
            if (validateThemeConfig(config)) {
                themeConfig = config;
                console.log('[Shader Theme Picker] Loaded', Object.keys(themeConfig.themes).length, 'themes');
            } else {
                console.warn('[Shader Theme Picker] Config validation failed, using defaults');
                themeConfig = DEFAULT_THEME_CONFIG;
            }
        } catch (error) {
            console.warn('[Shader Theme Picker] Failed to load config, using defaults:', error.message);
            themeConfig = DEFAULT_THEME_CONFIG;
        }
    }

    /**
     * Get saved theme from storage (with multi-tier fallback)
     */
    function getSavedTheme() {
        try {
            const storage = getStorage();
            return storage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn('[Shader Theme Picker] Failed to get saved theme:', error.message);
            return null;
        }
    }

    /**
     * Get shaders enabled preference (with multi-tier fallback)
     */
    function getShadersEnabled() {
        try {
            const storage = getStorage();
            const saved = storage.getItem(SHADER_STORAGE_KEY);
            return saved === null ? true : saved === 'true';
        } catch (error) {
            console.warn('[Shader Theme Picker] Failed to get shader preference:', error.message);
            return true;
        }
    }

    /**
     * Save theme to storage (with multi-tier fallback)
     */
    function saveTheme(themeName) {
        try {
            const storage = getStorage();
            storage.setItem(STORAGE_KEY, themeName);
        } catch (error) {
            console.warn('[Shader Theme Picker] Failed to save theme:', error.message);
            // Store in memory as last resort
            memoryStorage.setItem(STORAGE_KEY, themeName);
        }
    }

    /**
     * Save shaders enabled preference (with multi-tier fallback)
     */
    function saveShadersEnabled(enabled) {
        try {
            const storage = getStorage();
            storage.setItem(SHADER_STORAGE_KEY, enabled.toString());
        } catch (error) {
            console.warn('[Shader Theme Picker] Failed to save shader preference:', error.message);
            // Store in memory as last resort
            memoryStorage.setItem(SHADER_STORAGE_KEY, enabled.toString());
        }
    }

    /**
     * Apply theme (CSS + optional shader)
     */
    async function applyTheme(themeName, withTransition = true) {
        if (!themeConfig || !themeConfig.themes || !themeConfig.themes[themeName]) {
            console.warn(`[Shader Theme Picker] Theme "${themeName}" not found`);
            themeName = themeConfig?.defaultTheme || DEFAULT_THEME;
        }

        const theme = themeConfig.themes[themeName];
        const root = document.documentElement;
        const body = document.body;

        if (withTransition) {
            body.classList.add('theme-transitioning');
        }

        // Apply CSS color variables
        if (theme.colors) {
            Object.entries(theme.colors).forEach(([key, value]) => {
                root.style.setProperty(`--color-${key}`, value);
            });
        }

        // Set data attribute for CSS hooks
        body.setAttribute('data-theme', themeName);
        currentTheme = themeName;
        saveTheme(themeName);

        // Apply shader background if enabled
        if (shadersEnabled && shaderManager) {
            const shaderName = SHADER_MAPPING[themeName] || 'night';
            try {
                await shaderManager.activate(shaderName);
                console.log(`[Shader Theme Picker] Activated shader: ${shaderName}`);
            } catch (error) {
                console.warn('[Shader Theme Picker] Shader activation failed:', error);
            }
        } else if (shaderManager) {
            shaderManager.deactivate();
        }

        // Update UI
        updateButtonIcon();
        updateDropdownSelection();
        updateThemeToggleButton();

        if (withTransition) {
            setTimeout(() => {
                body.classList.remove('theme-transitioning');
            }, 300);
        }

        console.log('[Shader Theme Picker] Applied theme:', themeName);
    }

    /**
     * Update the #themeToggle button icon to match current theme
     * Supports both emoji icons and SVG sun/moon icons
     */
    function updateThemeToggleButton() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const themeName = currentTheme || 'night';
        const themeData = themeConfig?.themes?.[themeName];

        // Check if using SVG icons (new minimalist design)
        const moonIcon = themeToggle.querySelector('.theme-icon-moon');
        const sunIcon = themeToggle.querySelector('.theme-icon-sun');

        if (moonIcon && sunIcon) {
            // Determine if current theme is "light" or "dark"
            const isLightTheme = ['day', 'sacred', 'light'].includes(themeName);

            // Toggle SVG visibility
            moonIcon.style.display = isLightTheme ? 'none' : 'block';
            sunIcon.style.display = isLightTheme ? 'block' : 'none';

            // Update aria-label
            themeToggle.setAttribute('aria-label',
                `Current theme: ${themeData?.name || themeName}. Click to change theme.`
            );
        } else if (themeData?.icon) {
            // Legacy: Use emoji icon
            themeToggle.textContent = themeData.icon;
            themeToggle.setAttribute('aria-label',
                `Current theme: ${themeData.name}. Click to change theme.`
            );
        }
    }

    /**
     * Apply default theme fallback
     */
    function applyDefaultTheme() {
        document.body.setAttribute('data-theme', 'night');
        currentTheme = 'night';
    }

    /**
     * Toggle shaders on/off
     */
    function toggleShaders() {
        shadersEnabled = !shadersEnabled;
        saveShadersEnabled(shadersEnabled);

        if (shaderManager) {
            if (shadersEnabled) {
                const shaderName = SHADER_MAPPING[currentTheme] || 'night';
                shaderManager.activate(shaderName);
            } else {
                shaderManager.deactivate();
            }
        }

        console.log('[Shader Theme Picker] Shaders', shadersEnabled ? 'enabled' : 'disabled');
    }

    /**
     * Create header theme picker with dropdown
     */
    function createHeaderThemePicker() {
        // Keep existing theme toggle button - it's now connected for quick cycling
        // Don't remove it; instead we add the dropdown picker alongside it

        // Create container
        const container = document.createElement('div');
        container.className = 'theme-picker-dropdown';
        container.setAttribute('role', 'navigation');
        container.setAttribute('aria-label', 'Theme selector');

        // Create theme button
        const themeButton = document.createElement('button');
        themeButton.className = 'icon-btn theme-picker-btn';
        themeButton.setAttribute('aria-label', 'Select theme');
        themeButton.setAttribute('aria-haspopup', 'true');
        themeButton.setAttribute('aria-expanded', 'false');
        themeButton.setAttribute('title', 'Change theme');

        // Set icon from current theme
        const currentThemeConfig = themeConfig?.themes?.[currentTheme];
        themeButton.textContent = currentThemeConfig?.icon || '🎨';

        // Create dropdown
        dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        dropdown.setAttribute('role', 'menu');
        dropdown.style.display = 'none';

        // Build dropdown content
        buildDropdownContent();

        // Event: Toggle dropdown
        themeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
            themeButton.setAttribute('aria-expanded', !isOpen);
        });

        // Event: Handle theme selection
        dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.theme-option');
            if (option) {
                const themeName = option.dataset.theme;
                applyTheme(themeName, true);
                dropdown.style.display = 'none';
                themeButton.setAttribute('aria-expanded', 'false');
            }
        });

        // Event: Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
                themeButton.setAttribute('aria-expanded', 'false');
            }
        });

        // Add elements to container
        container.appendChild(themeButton);
        container.appendChild(dropdown);

        // Add to header actions
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.insertBefore(container, headerActions.firstChild);
        }

        console.log('[Shader Theme Picker] UI created');
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

        let dropdownHTML = '';

        // Category order and labels
        const categories = [
            { key: 'cosmic', label: '🌌 Cosmic Themes' },
            { key: 'element', label: '🔥 Elemental Themes' }
        ];

        categories.forEach(({ key, label }) => {
            if (themesByCategory[key]) {
                dropdownHTML += `<div class="theme-category">`;
                dropdownHTML += `<div class="theme-category-label">${label}</div>`;

                themesByCategory[key].forEach(theme => {
                    const isActive = theme.key === currentTheme;
                    const hasShader = SHADER_MAPPING[theme.key] ? '✨' : '';

                    dropdownHTML += `
                        <button class="theme-option ${isActive ? 'active' : ''}"
                                data-theme="${theme.key}"
                                role="menuitem"
                                title="${theme.description}">
                            <span class="theme-icon">${theme.icon}</span>
                            <span class="theme-name">${theme.name}</span>
                            <span class="theme-features">${hasShader}</span>
                            ${isActive ? '<span class="theme-check">✓</span>' : ''}
                        </button>
                    `;
                });

                dropdownHTML += '</div>';
            }
        });

        dropdown.innerHTML = dropdownHTML;
    }

    /**
     * Update button icon to match current theme
     */
    function updateButtonIcon() {
        const button = document.querySelector('.theme-picker-btn');
        if (button && themeConfig?.themes?.[currentTheme]) {
            button.textContent = themeConfig.themes[currentTheme].icon || '🎨';
        }
    }

    /**
     * Update dropdown to show current selection
     */
    function updateDropdownSelection() {
        if (!dropdown) return;

        dropdown.querySelectorAll('.theme-option').forEach(option => {
            const themeName = option.dataset.theme;
            const isActive = themeName === currentTheme;

            option.classList.toggle('active', isActive);

            // Update checkmark
            const existingCheck = option.querySelector('.theme-check');
            if (isActive && !existingCheck) {
                const check = document.createElement('span');
                check.className = 'theme-check';
                check.textContent = '✓';
                option.appendChild(check);
            } else if (!isActive && existingCheck) {
                existingCheck.remove();
            }
        });
    }

    /**
     * Get shader manager status
     */
    function getShaderStatus() {
        if (shaderManager) {
            return shaderManager.getStatus();
        }
        return { enabled: false, supported: false };
    }

    // Public API
    window.ShaderThemePicker = {
        setTheme: (themeName) => applyTheme(themeName, true),
        getCurrentTheme: () => currentTheme,
        getAvailableThemes: () => themeConfig ? Object.keys(themeConfig.themes) : [],
        toggleShaders: () => toggleShaders(),
        getShadersEnabled: () => shadersEnabled,
        getShaderStatus: () => getShaderStatus(),
        cycleTheme: () => cycleToNextTheme(),
        isInitialized: () => isInitialized
    };

    // =========================================
    // FOUC Prevention: Apply theme early
    // =========================================
    // This runs synchronously before DOM is fully ready
    // to prevent Flash of Unstyled Content
    applyEarlyTheme();

    // =========================================
    // Full Initialization with DOM ready check
    // =========================================
    // Use multiple strategies to ensure we initialize at the right time
    function safeInit() {
        // Already initialized? Skip.
        if (isInitialized) return;

        // DOM not ready? Wait for it.
        if (!document.body) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', safeInit, { once: true });
            } else {
                // Rare edge case: readyState is not 'loading' but body doesn't exist
                requestAnimationFrame(safeInit);
            }
            return;
        }

        // DOM is ready, initialize
        init();
    }

    // Start initialization process
    if (document.readyState === 'loading') {
        // DOM still loading, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', safeInit, { once: true });
    } else if (document.readyState === 'interactive') {
        // DOM is interactive but not complete - safe to init
        safeInit();
    } else {
        // DOM is complete, initialize immediately
        safeInit();
    }

    // Fallback: Also try on window load in case other methods fail
    window.addEventListener('load', () => {
        if (!isInitialized) {
            console.log('[Shader Theme Picker] Late initialization on window.load');
            safeInit();
        }
    }, { once: true });

})();
