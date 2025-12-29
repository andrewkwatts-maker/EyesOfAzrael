/**
 * Comprehensive Shader Theme Picker
 * Integrates CSS themes with WebGL shader backgrounds
 * Shows all 10+ themes in a beautiful dropdown
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

    let themeConfig = null;
    let currentTheme = DEFAULT_THEME;
    let dropdown = null;
    let shaderManager = null;
    let shadersEnabled = true;

    /**
     * Initialize the shader theme picker
     */
    async function init() {
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

            console.log('[Shader Theme Picker] Initialized successfully');
        } catch (error) {
            console.error('[Shader Theme Picker] Init error:', error);
            applyDefaultTheme();
        }
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
     * Load theme configuration from JSON
     */
    async function loadThemeConfig() {
        const response = await fetch(THEME_CONFIG_PATH);
        if (!response.ok) {
            throw new Error(`Failed to load theme config: ${response.status}`);
        }
        themeConfig = await response.json();
        console.log('[Shader Theme Picker] Loaded', Object.keys(themeConfig.themes).length, 'themes');
    }

    /**
     * Get saved theme from localStorage
     */
    function getSavedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return null;
        }
    }

    /**
     * Get shaders enabled preference
     */
    function getShadersEnabled() {
        try {
            const saved = localStorage.getItem(SHADER_STORAGE_KEY);
            return saved === null ? true : saved === 'true';
        } catch (error) {
            return true;
        }
    }

    /**
     * Save theme to localStorage
     */
    function saveTheme(themeName) {
        try {
            localStorage.setItem(STORAGE_KEY, themeName);
        } catch (error) {
            console.warn('[Shader Theme Picker] Failed to save theme');
        }
    }

    /**
     * Save shaders enabled preference
     */
    function saveShadersEnabled(enabled) {
        try {
            localStorage.setItem(SHADER_STORAGE_KEY, enabled.toString());
        } catch (error) {
            console.warn('[Shader Theme Picker] Failed to save shader preference');
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

        if (withTransition) {
            setTimeout(() => {
                body.classList.remove('theme-transitioning');
            }, 300);
        }

        console.log('[Shader Theme Picker] Applied theme:', themeName);
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
        // Remove existing theme toggle button
        const oldToggle = document.getElementById('themeToggle');
        if (oldToggle) {
            oldToggle.remove();
        }

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
        getShaderStatus: () => getShaderStatus()
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
