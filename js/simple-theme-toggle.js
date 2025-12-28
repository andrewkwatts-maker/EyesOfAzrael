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
        root.style.setProperty('--color-text-muted', '#94a3b8');
        root.style.setProperty('--color-text-muted-rgb', '148, 163, 184');

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
