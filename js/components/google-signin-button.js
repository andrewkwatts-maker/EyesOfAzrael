/**
 * Google Sign-In Button Component
 * Renders a Google-branded sign-in button with loading states and error handling
 * Auto-initializes on elements with data-google-signin attribute
 */

class GoogleSignInButton {
    constructor(element) {
        this.element = element;
        this.isLoading = false;
        this.render();
        this.attachEventListeners();
    }

    /**
     * Render the button
     */
    render() {
        // Get custom text if provided
        const buttonText = this.element.getAttribute('data-button-text') || 'Sign in with Google';
        const buttonSize = this.element.getAttribute('data-button-size') || 'medium'; // small, medium, large

        // Get size classes
        const sizeClasses = {
            small: 'google-signin-btn-small',
            medium: 'google-signin-btn-medium',
            large: 'google-signin-btn-large'
        };
        const sizeClass = sizeClasses[buttonSize] || sizeClasses.medium;

        this.element.innerHTML = `
            <button class="google-signin-btn ${sizeClass}" data-signin-button>
                <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span class="google-signin-text">${buttonText}</span>
                <span class="google-signin-loader" style="display: none;">
                    <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle class="spinner-circle" cx="12" cy="12" r="10" fill="none" stroke-width="3"/>
                    </svg>
                </span>
            </button>
            <div class="google-signin-error" style="display: none;"></div>
        `;

        // Add styles if not already added
        if (!document.getElementById('google-signin-styles')) {
            this.addStyles();
        }
    }

    /**
     * Add CSS styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.id = 'google-signin-styles';
        style.textContent = `
            .google-signin-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                background: white;
                color: rgba(0, 0, 0, 0.54);
                border: none;
                border-radius: 4px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
                position: relative;
                width: 100%;
            }

            .google-signin-btn:hover {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
                background: #f8f9fa;
            }

            .google-signin-btn:active {
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                background: #f1f3f4;
            }

            .google-signin-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .google-signin-btn-small {
                padding: 8px 16px;
                font-size: 14px;
            }

            .google-signin-btn-medium {
                padding: 10px 20px;
                font-size: 16px;
            }

            .google-signin-btn-large {
                padding: 14px 28px;
                font-size: 18px;
            }

            .google-icon {
                width: 18px;
                height: 18px;
                flex-shrink: 0;
            }

            .google-signin-btn-small .google-icon {
                width: 16px;
                height: 16px;
            }

            .google-signin-btn-large .google-icon {
                width: 20px;
                height: 20px;
            }

            .google-signin-text {
                flex: 1;
                text-align: center;
            }

            .google-signin-loader {
                display: none;
                position: absolute;
                right: 16px;
            }

            .google-signin-btn.loading .google-signin-loader {
                display: block;
            }

            .spinner {
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
            }

            .spinner-circle {
                stroke: #4285F4;
                stroke-linecap: round;
                animation: dash 1.5s ease-in-out infinite;
            }

            @keyframes spin {
                100% {
                    transform: rotate(360deg);
                }
            }

            @keyframes dash {
                0% {
                    stroke-dasharray: 1, 150;
                    stroke-dashoffset: 0;
                }
                50% {
                    stroke-dasharray: 90, 150;
                    stroke-dashoffset: -35;
                }
                100% {
                    stroke-dasharray: 90, 150;
                    stroke-dashoffset: -124;
                }
            }

            .google-signin-error {
                margin-top: 12px;
                padding: 12px;
                background: rgba(220, 38, 38, 0.1);
                border: 1px solid rgba(220, 38, 38, 0.3);
                border-radius: 6px;
                color: #dc2626;
                font-size: 14px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const button = this.element.querySelector('[data-signin-button]');
        if (button) {
            button.addEventListener('click', () => this.handleSignIn());
        }
    }

    /**
     * Handle sign-in click
     */
    async handleSignIn() {
        if (this.isLoading) return;

        // Check if Firebase Auth is available
        if (!window.firebaseAuth) {
            this.showError('Authentication system not initialized. Please refresh the page.');
            return;
        }

        // Clear previous errors
        this.hideError();

        // Show loading state
        this.setLoading(true);

        try {
            // Attempt Google sign-in
            const result = await window.firebaseAuth.signInWithGoogle();

            if (result.success) {
                // Success! Close modal if open
                if (window.firebaseAuth.hideAuthModal) {
                    window.firebaseAuth.hideAuthModal();
                }

                // Dispatch custom event
                this.element.dispatchEvent(new CustomEvent('google-signin-success', {
                    bubbles: true,
                    detail: result.user
                }));
            } else {
                // Show error
                this.showError(result.error);

                // Dispatch custom event
                this.element.dispatchEvent(new CustomEvent('google-signin-error', {
                    bubbles: true,
                    detail: { error: result.error }
                }));
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            this.showError('An unexpected error occurred. Please try again.');

            this.element.dispatchEvent(new CustomEvent('google-signin-error', {
                bubbles: true,
                detail: { error: error.message }
            }));
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const button = this.element.querySelector('[data-signin-button]');
        const loader = this.element.querySelector('.google-signin-loader');

        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            if (loader) loader.style.display = 'block';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (loader) loader.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = this.element.querySelector('.google-signin-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorEl = this.element.querySelector('.google-signin-error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
}

/**
 * Auto-initialize all Google Sign-In buttons
 */
function initGoogleSignInButtons() {
    document.querySelectorAll('[data-google-signin]').forEach(element => {
        // Skip if already initialized
        if (element.hasAttribute('data-google-signin-initialized')) {
            return;
        }

        // Initialize button
        new GoogleSignInButton(element);

        // Mark as initialized
        element.setAttribute('data-google-signin-initialized', 'true');
    });
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleSignInButtons);
} else {
    initGoogleSignInButtons();
}

// Watch for dynamically added buttons
if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.hasAttribute && node.hasAttribute('data-google-signin')) {
                        new GoogleSignInButton(node);
                        node.setAttribute('data-google-signin-initialized', 'true');
                    }
                    // Check children
                    if (node.querySelectorAll) {
                        node.querySelectorAll('[data-google-signin]').forEach(element => {
                            if (!element.hasAttribute('data-google-signin-initialized')) {
                                new GoogleSignInButton(element);
                                element.setAttribute('data-google-signin-initialized', 'true');
                            }
                        });
                    }
                }
            });
        });
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSignInButton;
}
