/**
 * Header Theme Picker
 * Dropdown theme selector for the header
 */

(function() {
    'use strict';

    const THEME_CONFIG_PATH = '/themes/theme-config.json';
    const STORAGE_KEY = 'eoaplot-selected-theme';
    const DEFAULT_THEME = 'night';

    let themeConfig = null;
    let currentTheme = DEFAULT_THEME;
    let dropdown = null;

    /**
     * Initialize the header theme picker
     */
    async function init() {
        try {
            await loadThemeConfig();
            currentTheme = getSavedTheme() || themeConfig.defaultTheme || DEFAULT_THEME;
            applyTheme(currentTheme, false);
            createHeaderThemePicker();
        } catch (error) {
            console.error('[Theme Picker] Init error:', error);
            applyDefaultTheme();
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
        console.log('[Theme Picker] Loaded config with', Object.keys(themeConfig.themes).length, 'themes');
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
     * Save theme to localStorage
     */
    function saveTheme(themeName) {
        try {
            localStorage.setItem(STORAGE_KEY, themeName);
        } catch (error) {
            console.warn('[Theme Picker] Failed to save theme');
        }
    }

    /**
     * Apply theme colors
     */
    function applyTheme(themeName, withTransition = true) {
        if (!themeConfig || !themeConfig.themes || !themeConfig.themes[themeName]) {
            console.warn(`[Theme Picker] Theme "${themeName}" not found`);
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
                root.style.setProperty(`--color-${key}`, value);
            });
        }

        body.setAttribute('data-theme', themeName);
        currentTheme = themeName;
        saveTheme(themeName);
        updateButtonIcon();

        if (withTransition) {
            setTimeout(() => {
                body.classList.remove('theme-transitioning');
            }, 300);
        }

        console.log('[Theme Picker] Applied theme:', themeName);
    }

    /**
     * Apply default theme
     */
    function applyDefaultTheme() {
        document.body.setAttribute('data-theme', 'night');
        currentTheme = 'night';
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

        // Create button
        const button = document.createElement('button');
        button.className = 'icon-btn theme-picker-btn';
        button.setAttribute('aria-label', 'Select theme');
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');

        // Set icon from current theme
        const currentThemeConfig = themeConfig?.themes?.[currentTheme];
        button.textContent = currentThemeConfig?.icon || '🎨';

        // Create dropdown
        dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        dropdown.setAttribute('role', 'menu');
        dropdown.style.display = 'none';

        // Group themes by category
        const themesByCategory = {};
        Object.entries(themeConfig.themes).forEach(([key, theme]) => {
            const category = theme.category || 'other';
            if (!themesByCategory[category]) {
                themesByCategory[category] = [];
            }
            themesByCategory[category].push({ key, ...theme });
        });

        // Build dropdown content
        let dropdownHTML = '';

        // Cosmic themes
        if (themesByCategory.cosmic) {
            dropdownHTML += '<div class="theme-category"><div class="theme-category-label">Cosmic</div>';
            themesByCategory.cosmic.forEach(theme => {
                dropdownHTML += `
                    <button class="theme-option ${theme.key === currentTheme ? 'active' : ''}"
                            data-theme="${theme.key}"
                            role="menuitem"
                            title="${theme.description}">
                        <span class="theme-icon">${theme.icon}</span>
                        <span class="theme-name">${theme.name}</span>
                        ${theme.key === currentTheme ? '<span class="theme-check">✓</span>' : ''}
                    </button>
                `;
            });
            dropdownHTML += '</div>';
        }

        // Element themes
        if (themesByCategory.element) {
            dropdownHTML += '<div class="theme-category"><div class="theme-category-label">Elements</div>';
            themesByCategory.element.forEach(theme => {
                dropdownHTML += `
                    <button class="theme-option ${theme.key === currentTheme ? 'active' : ''}"
                            data-theme="${theme.key}"
                            role="menuitem"
                            title="${theme.description}">
                        <span class="theme-icon">${theme.icon}</span>
                        <span class="theme-name">${theme.name}</span>
                        ${theme.key === currentTheme ? '<span class="theme-check">✓</span>' : ''}
                    </button>
                `;
            });
            dropdownHTML += '</div>';
        }

        dropdown.innerHTML = dropdownHTML;

        // Toggle dropdown
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
            button.setAttribute('aria-expanded', !isOpen);
        });

        // Handle theme selection
        dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.theme-option');
            if (option) {
                const themeName = option.dataset.theme;
                applyTheme(themeName, true);
                dropdown.style.display = 'none';
                button.setAttribute('aria-expanded', 'false');
                updateDropdownSelection();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
                button.setAttribute('aria-expanded', 'false');
            }
        });

        container.appendChild(button);
        container.appendChild(dropdown);

        // Add to header actions
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.insertBefore(container, headerActions.firstChild);
        }

        console.log('[Theme Picker] Header picker created');
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

    // Public API
    window.HeaderThemePicker = {
        setTheme: (themeName) => applyTheme(themeName, true),
        getCurrentTheme: () => currentTheme,
        getAvailableThemes: () => themeConfig ? Object.keys(themeConfig.themes) : []
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
