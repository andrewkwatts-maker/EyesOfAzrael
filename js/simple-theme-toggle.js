/**
 * Simple Day/Night Theme Toggle
 * Clean implementation for basic theme switching
 */

class SimpleThemeToggle {
    constructor() {
        this.button = document.getElementById('themeToggle');
        this.currentTheme = this.loadTheme();

        if (!this.button) {
            console.warn('[SimpleThemeToggle] Button #themeToggle not found');
            return;
        }

        this.init();
    }

    /**
     * Load saved theme from localStorage
     */
    loadTheme() {
        try {
            return localStorage.getItem('eoa_theme') || 'night';
        } catch (error) {
            console.warn('[SimpleThemeToggle] LocalStorage not available');
            return 'night';
        }
    }

    /**
     * Save theme to localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem('eoa_theme', theme);
        } catch (error) {
            console.warn('[SimpleThemeToggle] Failed to save theme');
        }
    }

    /**
     * Toggle between day and night themes
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'night' ? 'day' : 'night';
        this.applyTheme(this.currentTheme);
        this.saveTheme(this.currentTheme);
    }

    /**
     * Apply theme colors and update UI
     */
    applyTheme(theme) {
        const root = document.documentElement;
        const body = document.body;

        // Add transition class
        body.classList.add('theme-transitioning');

        // Set data-theme attribute (for CSS hooks)
        body.setAttribute('data-theme', theme);

        // Apply CSS variables based on theme
        if (theme === 'day') {
            this.applyDayTheme(root);
        } else {
            this.applyNightTheme(root);
        }

        // Update button icon
        if (this.button) {
            this.button.textContent = theme === 'night' ? '☀️' : '🌙';
            this.button.setAttribute('aria-label',
                theme === 'night' ? 'Switch to day theme' : 'Switch to night theme'
            );
        }

        // Update shader backgrounds if available
        if (window.EyesOfAzrael?.shaders) {
            try {
                window.EyesOfAzrael.shaders.activate(theme);
            } catch (error) {
                console.warn('[SimpleThemeToggle] Shader activation failed:', error);
            }
        }

        // Remove transition class after animation
        setTimeout(() => {
            body.classList.remove('theme-transitioning');
        }, 300);

        console.log(`[SimpleThemeToggle] Applied theme: ${theme}`);
    }

    /**
     * Apply day theme colors
     */
    applyDayTheme(root) {
        root.style.setProperty('--color-primary', '#2563eb');
        root.style.setProperty('--color-primary-rgb', '37, 99, 235');
        root.style.setProperty('--color-secondary', '#7c3aed');
        root.style.setProperty('--color-secondary-rgb', '124, 58, 237');
        root.style.setProperty('--color-accent', '#f59e0b');
        root.style.setProperty('--color-accent-rgb', '245, 158, 11');

        root.style.setProperty('--color-bg-primary', '#ffffff');
        root.style.setProperty('--color-bg-primary-rgb', '255, 255, 255');
        root.style.setProperty('--color-bg-secondary', '#f8fafc');
        root.style.setProperty('--color-bg-secondary-rgb', '248, 250, 252');
        root.style.setProperty('--color-bg-card', '#f1f5f9');
        root.style.setProperty('--color-bg-card-rgb', '241, 245, 249');

        root.style.setProperty('--color-text-primary', '#0f172a');
        root.style.setProperty('--color-text-primary-rgb', '15, 23, 42');
        root.style.setProperty('--color-text-secondary', '#475569');
        root.style.setProperty('--color-text-secondary-rgb', '71, 85, 105');
        // #94a3b8 was only 2.35:1 against this theme's near-white card background,
        // failing WCAG AA — axe caught it on the "Press ? for shortcuts" hint, but
        // it applied to every muted string in the light theme.
        //
        // #5d6b7f is the lightest value that clears 4.5:1 against ALL THREE light
        // backgrounds (4.95:1 on the darkest, --color-bg-card #f1f5f9). The obvious
        // pick, slate-500 #64748b, clears white and --color-bg-secondary but lands
        // at 4.34:1 on the card — which is why the sibling test checks every
        // foreground against every background rather than pinning a hex.
        root.style.setProperty('--color-text-muted', '#5d6b7f');
        root.style.setProperty('--color-text-muted-rgb', '93, 107, 127');

        root.style.setProperty('--color-border-primary', '#e2e8f0');
        root.style.setProperty('--color-border-primary-rgb', '226, 232, 240');
        root.style.setProperty('--color-border-accent', '#cbd5e1');
        root.style.setProperty('--color-border-accent-rgb', '203, 213, 225');

        // Legacy support for old CSS
        root.style.setProperty('--color-background', '#ffffff');
        root.style.setProperty('--color-surface', 'rgba(241, 245, 249, 0.8)');
        root.style.setProperty('--color-surface-hover', 'rgba(241, 245, 249, 0.95)');
        root.style.setProperty('--color-border', 'rgba(226, 232, 240, 0.5)');
        root.style.setProperty('--color-shadow', 'rgba(0, 0, 0, 0.1)');

        // The -rgb companions, which this theme used to omit entirely.
        //
        // Stylesheets compose their own alpha with rgba(var(--color-surface-rgb), a)
        // — css/dynamic-views.css and the browse view's injected styles both do. With
        // no day value, those kept themes/theme-base.css's DARK :root default of
        // 26, 31, 58 while --color-text-primary flipped to near-black #0f172a. The
        // Load More button rendered #0f172a on #484c61: 2.1:1, unreadable, and a
        // real defect for anyone using the light theme rather than a test artifact.
        //
        // Every --color-surface* value above is paired with its -rgb form here so
        // the two cannot drift apart again.
        root.style.setProperty('--color-surface-rgb', '241, 245, 249');
        root.style.setProperty('--color-surface-solid', '#f1f5f9');
        root.style.setProperty('--color-surface-solid-rgb', '241, 245, 249');
        root.style.setProperty('--color-surface-hover-rgb', '226, 232, 240');
        root.style.setProperty('--color-surface-elevated', 'rgba(255, 255, 255, 0.9)');
        root.style.setProperty('--color-surface-elevated-rgb', '255, 255, 255');
        root.style.setProperty('--color-surface-elevated-solid', '#ffffff');
        root.style.setProperty('--color-background-rgb', '255, 255, 255');
        root.style.setProperty('--color-border-rgb', '226, 232, 240');
    }

    /**
     * Apply night theme colors
     */
    applyNightTheme(root) {
        root.style.setProperty('--color-primary', '#8b7fff');
        root.style.setProperty('--color-primary-rgb', '139, 127, 255');
        root.style.setProperty('--color-secondary', '#ff7eb6');
        root.style.setProperty('--color-secondary-rgb', '255, 126, 182');
        root.style.setProperty('--color-accent', '#ffd93d');
        root.style.setProperty('--color-accent-rgb', '255, 217, 61');

        root.style.setProperty('--color-bg-primary', '#0a0e27');
        root.style.setProperty('--color-bg-primary-rgb', '10, 14, 39');
        root.style.setProperty('--color-bg-secondary', '#151a35');
        root.style.setProperty('--color-bg-secondary-rgb', '21, 26, 53');
        root.style.setProperty('--color-bg-card', '#1a1f3a');
        root.style.setProperty('--color-bg-card-rgb', '26, 31, 58');

        root.style.setProperty('--color-text-primary', '#f8f9fa');
        root.style.setProperty('--color-text-primary-rgb', '248, 249, 250');
        root.style.setProperty('--color-text-secondary', '#adb5bd');
        root.style.setProperty('--color-text-secondary-rgb', '173, 181, 189');
        root.style.setProperty('--color-text-muted', '#6c757d');
        root.style.setProperty('--color-text-muted-rgb', '108, 117, 125');

        root.style.setProperty('--color-border-primary', '#2a2f4a');
        root.style.setProperty('--color-border-primary-rgb', '42, 47, 74');
        root.style.setProperty('--color-border-accent', '#4a4f6a');
        root.style.setProperty('--color-border-accent-rgb', '74, 79, 106');

        // Legacy support for old CSS
        root.style.setProperty('--color-background', '#0a0e27');
        root.style.setProperty('--color-surface', 'rgba(26, 31, 58, 0.8)');
        root.style.setProperty('--color-surface-hover', 'rgba(26, 31, 58, 0.95)');
        root.style.setProperty('--color-border', 'rgba(139, 127, 255, 0.3)');
        root.style.setProperty('--color-shadow', 'rgba(0, 0, 0, 0.5)');

        // Mirrors the day theme's -rgb companions. These match themes/theme-base.css's
        // :root, so omitting them here was survivable — but only by accident, and only
        // until someone changed the default. Set explicitly so switching themes always
        // writes a complete set rather than leaving the previous theme's values behind.
        root.style.setProperty('--color-surface-rgb', '26, 31, 58');
        root.style.setProperty('--color-surface-solid', '#1a1f3a');
        root.style.setProperty('--color-surface-solid-rgb', '26, 31, 58');
        root.style.setProperty('--color-surface-hover-rgb', '42, 47, 74');
        root.style.setProperty('--color-surface-elevated', 'rgba(42, 47, 74, 0.9)');
        root.style.setProperty('--color-surface-elevated-rgb', '42, 47, 74');
        root.style.setProperty('--color-surface-elevated-solid', '#2a2f4a');
        root.style.setProperty('--color-background-rgb', '10, 14, 39');
        root.style.setProperty('--color-border-rgb', '139, 127, 255');
    }

    /**
     * Initialize the toggle
     */
    init() {
        // Apply saved theme on load
        this.applyTheme(this.currentTheme);

        // Wire up button click event
        this.button.addEventListener('click', () => {
            this.toggleTheme();
        });

        console.log('[SimpleThemeToggle] Initialized with theme:', this.currentTheme);
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Set specific theme
     */
    setTheme(theme) {
        if (theme !== 'day' && theme !== 'night') {
            console.warn(`[SimpleThemeToggle] Invalid theme: ${theme}`);
            return;
        }
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
    }
}

// Export for use and auto-initialize
if (typeof window !== 'undefined') {
    window.SimpleThemeToggle = SimpleThemeToggle;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.themeToggle = new SimpleThemeToggle();
        });
    } else {
        // DOM already loaded
        window.themeToggle = new SimpleThemeToggle();
    }
}
