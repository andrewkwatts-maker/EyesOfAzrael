/**
 * Authentication Guard Utility
 * Provides helper functions for managing authentication requirements
 * and showing login prompts for protected actions
 */

class AuthGuard {
    constructor() {
        this.redirectAfterLogin = null;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is logged in
     */
    isAuthenticated() {
        return window.userAuth && window.userAuth.isLoggedIn();
    }

    /**
     * Get current authenticated user
     * @returns {Object|null} Current user object or null
     */
    getCurrentUser() {
        if (!this.isAuthenticated()) return null;
        return window.userAuth.getCurrentUser();
    }

    /**
     * Check if authentication is required and redirect if needed
     * @param {string} redirectUrl - URL to redirect to after successful login
     * @returns {boolean} True if user is authenticated, false otherwise
     */
    checkAuthRequired(redirectUrl = null) {
        if (this.isAuthenticated()) {
            return true;
        }

        if (redirectUrl) {
            this.redirectAfterLogin = redirectUrl;
        }

        return false;
    }

    /**
     * Show login prompt modal with context message
     * @param {string} message - Context message explaining why login is needed
     * @param {string} action - Action being attempted (e.g., "vote", "comment", "submit")
     */
    showLoginPrompt(message = 'You must be logged in to continue', action = null) {
        if (this.isAuthenticated()) {
            return;
        }

        // Store action context for after login
        if (action) {
            sessionStorage.setItem('pendingAction', action);
        }

        // Show the auth modal with custom message
        if (window.userAuth) {
            window.userAuth.showLoginModal();

            // Display custom message in modal
            const messageEl = document.getElementById('auth-message');
            if (messageEl) {
                messageEl.textContent = message;
                messageEl.className = 'auth-message auth-message-info';
                messageEl.style.display = 'block';
            }
        }
    }

    /**
     * Wait for user authentication
     * Returns a promise that resolves when user logs in or rejects after timeout
     * @param {number} timeout - Timeout in milliseconds (default: 300000 = 5 minutes)
     * @returns {Promise<Object>} Promise that resolves with user object
     */
    waitForAuth(timeout = 300000) {
        if (this.isAuthenticated()) {
            return Promise.resolve(this.getCurrentUser());
        }

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('Authentication timeout'));
            }, timeout);

            const handleLogin = (event) => {
                cleanup();
                resolve(event.detail || this.getCurrentUser());
            };

            const cleanup = () => {
                clearTimeout(timeoutId);
                window.removeEventListener('userLogin', handleLogin);
            };

            window.addEventListener('userLogin', handleLogin);
        });
    }

    /**
     * Execute callback after authentication
     * Shows login prompt if not authenticated, executes callback if authenticated
     * @param {Function} callback - Function to execute after authentication
     * @param {string} message - Message to show in login prompt
     */
    requireAuth(callback, message = 'Please log in to continue') {
        if (this.isAuthenticated()) {
            callback(this.getCurrentUser());
            return;
        }

        // Show login prompt
        this.showLoginPrompt(message);

        // Execute callback after successful login
        const handleLogin = (event) => {
            window.removeEventListener('userLogin', handleLogin);
            callback(event.detail || this.getCurrentUser());
        };

        window.addEventListener('userLogin', handleLogin);
    }

    /**
     * Handle post-login redirect
     * Should be called after successful login
     */
    handlePostLoginRedirect() {
        if (this.redirectAfterLogin) {
            const url = this.redirectAfterLogin;
            this.redirectAfterLogin = null;
            window.location.href = url;
        }

        // Check for pending action
        const pendingAction = sessionStorage.getItem('pendingAction');
        if (pendingAction) {
            sessionStorage.removeItem('pendingAction');
            window.dispatchEvent(new CustomEvent('pendingActionResume', {
                detail: { action: pendingAction }
            }));
        }
    }

    /**
     * Create a "Sign in with Google" button element
     * Note: This creates a styled button that triggers the auth modal
     * In Firebase implementation, this will trigger Google OAuth
     * @param {Object} options - Button configuration
     * @returns {HTMLElement} Button element
     */
    createSignInButton(options = {}) {
        const {
            text = 'Sign in with Google',
            size = 'medium', // small, medium, large
            theme = 'dark', // dark, light
            className = ''
        } = options;

        const button = document.createElement('button');
        button.className = `google-signin-btn google-signin-${size} google-signin-${theme} ${className}`;
        button.innerHTML = `
            <svg class="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span class="google-signin-text">${text}</span>
        `;

        button.addEventListener('click', () => {
            this.showLoginPrompt('Sign in to access all features');
        });

        return button;
    }

    /**
     * Create a subtle login CTA element
     * @param {string} message - Message to display
     * @param {string} linkText - Text for the login link
     * @returns {HTMLElement} CTA element
     */
    createLoginCTA(message = 'Want to contribute?', linkText = 'Sign in') {
        const cta = document.createElement('div');
        cta.className = 'login-cta-subtle';
        cta.innerHTML = `
            <span class="login-cta-message">${message}</span>
            <button class="login-cta-link">${linkText}</button>
        `;

        cta.querySelector('.login-cta-link').addEventListener('click', () => {
            this.showLoginPrompt(message);
        });

        return cta;
    }

    /**
     * Show tooltip for disabled action
     * @param {HTMLElement} element - Element to attach tooltip to
     * @param {string} message - Tooltip message
     */
    addAuthTooltip(element, message = 'Sign in required') {
        element.setAttribute('data-auth-tooltip', message);
        element.classList.add('auth-required');

        // Simple tooltip on hover
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'auth-tooltip';
            tooltip.textContent = message;
            document.body.appendChild(tooltip);

            const rect = element.getBoundingClientRect();
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
            tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;

            element._authTooltip = tooltip;
        });

        element.addEventListener('mouseleave', () => {
            if (element._authTooltip) {
                element._authTooltip.remove();
                element._authTooltip = null;
            }
        });

        // Show login prompt on click
        element.addEventListener('click', (e) => {
            if (!this.isAuthenticated()) {
                e.preventDefault();
                e.stopPropagation();
                this.showLoginPrompt(message);
            }
        });
    }
}

// Create global instance
window.authGuard = new AuthGuard();

// Listen for successful logins to handle redirects
window.addEventListener('userLogin', () => {
    window.authGuard.handlePostLoginRedirect();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthGuard;
}
