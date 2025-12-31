/**
 * Firebase Authentication Manager
 * Handles Google Sign-In and user authentication
 */

class AuthManager {
    constructor(firebaseApp) {
        this.auth = firebase.auth();
        this.currentUser = null;
        this.onAuthStateChangedCallbacks = [];

        // Configure Google Auth Provider
        this.googleProvider = new firebase.auth.GoogleAuthProvider();
        this.googleProvider.addScope('profile');
        this.googleProvider.addScope('email');

        // Initialize auth state listener
        this.initAuthStateListener();
    }

    /**
     * Initialize authentication state listener
     */
    initAuthStateListener() {
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;

            // Update UI
            this.updateAuthUI(user);

            // Notify callbacks
            this.onAuthStateChangedCallbacks.forEach(callback => callback(user));

            // Log auth state
            if (user) {
                console.log('User signed in:', {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                });
            } else {
                console.log('User signed out');
            }
        });
    }

    /**
     * Sign in with Google popup
     * IMPROVED: Check if already logged in before attempting sign-in
     */
    async signInWithGoogle() {
        // Check if user is already logged in
        if (this.auth.currentUser) {
            console.log('[AuthManager] User already logged in:', this.auth.currentUser.email);
            return this.auth.currentUser;
        }

        try {
            console.log('[AuthManager] Initiating Google sign-in...');
            const result = await this.auth.signInWithPopup(this.googleProvider);
            const user = result.user;

            console.log('[AuthManager] Sign-in successful:', user.displayName);
            return user;
        } catch (error) {
            console.error('[AuthManager] Sign-in error:', error.code, error.message);

            // Don't throw for benign errors
            if (error.code === 'auth/popup-closed-by-user' ||
                error.code === 'auth/cancelled-popup-request') {
                console.log('[AuthManager] Sign-in cancelled by user');
                return null;
            }

            this.handleAuthError(error);
            throw error;
        }
    }

    /**
     * Sign in with Google redirect (better for mobile)
     */
    async signInWithGoogleRedirect() {
        try {
            await this.auth.signInWithRedirect(this.googleProvider);
        } catch (error) {
            console.error('Sign-in redirect error:', error);
            this.handleAuthError(error);
            throw error;
        }
    }

    /**
     * Handle redirect result
     */
    async getRedirectResult() {
        try {
            const result = await this.auth.getRedirectResult();
            if (result.user) {
                console.log('Redirect sign-in successful:', result.user.displayName);
                return result.user;
            }
        } catch (error) {
            console.error('Redirect result error:', error);
            this.handleAuthError(error);
        }
        return null;
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            await this.auth.signOut();
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Register callback for auth state changes
     */
    onAuthStateChanged(callback) {
        this.onAuthStateChangedCallbacks.push(callback);
    }

    /**
     * Update authentication UI
     * NOTE: This function is designed to work with multiple page types:
     * - Pages using auth-guard-simple.js (index.html, dashboard.html) - uses body classes
     * - Standalone pages (login.html) - uses element visibility
     */
    updateAuthUI(user) {
        // Check if auth guard is active (body has auth-related classes)
        const hasAuthGuard = document.body.classList.contains('auth-loading') ||
                           document.body.classList.contains('authenticated') ||
                           document.body.classList.contains('not-authenticated');

        if (hasAuthGuard) {
            // Auth guard is managing UI state - don't interfere
            // Just update user info in header if it exists
            this.updateHeaderUserInfo(user);
            return;
        }

        // Legacy UI update for standalone pages (login.html, etc.)
        const authContainer = document.getElementById('auth-container');
        const userInfo = document.getElementById('user-info');
        const signInBtn = document.getElementById('sign-in-btn');
        const signOutBtn = document.getElementById('sign-out-btn');
        const loginPage = document.getElementById('login-page');
        const mainContent = document.getElementById('main-content');

        if (user) {
            // User is signed in
            if (loginPage) loginPage.style.display = 'none';
            if (mainContent) mainContent.style.display = 'block';

            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-profile">
                        <img src="${user.photoURL || '/images/default-avatar.png'}"
                             alt="${user.displayName}"
                             class="user-avatar">
                        <div class="user-details">
                            <div class="user-name">${user.displayName || 'User'}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                `;
                userInfo.style.display = 'block';
            }

            if (signInBtn) signInBtn.style.display = 'none';
            if (signOutBtn) signOutBtn.style.display = 'block';
        } else {
            // User is signed out
            if (loginPage) loginPage.style.display = 'flex';
            if (mainContent) mainContent.style.display = 'none';

            if (userInfo) {
                userInfo.innerHTML = '';
                userInfo.style.display = 'none';
            }

            if (signInBtn) signInBtn.style.display = 'block';
            if (signOutBtn) signOutBtn.style.display = 'none';
        }
    }

    /**
     * Update user info in header (works with auth-guard pages)
     */
    updateHeaderUserInfo(user) {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const signOutBtn = document.getElementById('signOutBtn');

        if (!userInfo) return;

        if (user) {
            userInfo.style.display = 'flex';
            if (userName) {
                userName.textContent = user.displayName || user.email;
            }
            if (userAvatar && user.photoURL) {
                userAvatar.src = user.photoURL;
                userAvatar.alt = user.displayName || 'User';
            }
            if (signOutBtn) {
                signOutBtn.style.display = 'block';
            }
        } else {
            userInfo.style.display = 'none';
        }
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(error) {
        let message = 'Authentication error occurred';

        switch (error.code) {
            case 'auth/popup-closed-by-user':
                message = 'Sign-in popup was closed';
                break;
            case 'auth/popup-blocked':
                message = 'Sign-in popup was blocked. Please allow popups for this site.';
                break;
            case 'auth/cancelled-popup-request':
                message = 'Sign-in cancelled';
                break;
            case 'auth/account-exists-with-different-credential':
                message = 'An account already exists with this email';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Please check your connection.';
                break;
            default:
                message = error.message;
        }

        this.showAuthError(message);
    }

    /**
     * Show authentication error message
     */
    showAuthError(message) {
        const errorContainer = document.getElementById('auth-error');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }

    /**
     * Require authentication (call this to protect pages)
     */
    async requireAuth() {
        return new Promise((resolve) => {
            const unsubscribe = this.auth.onAuthStateChanged((user) => {
                if (user) {
                    resolve(user);
                    unsubscribe();
                }
            });
        });
    }

    /**
     * Initialize auth UI and event listeners
     */
    initAuthUI() {
        // Sign in button
        const signInBtn = document.getElementById('sign-in-btn');
        if (signInBtn) {
            signInBtn.addEventListener('click', async () => {
                signInBtn.disabled = true;
                signInBtn.textContent = 'Signing in...';

                try {
                    // Use redirect on mobile, popup on desktop
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    if (isMobile) {
                        await this.signInWithGoogleRedirect();
                    } else {
                        await this.signInWithGoogle();
                    }
                } catch (error) {
                    console.error('Sign-in failed:', error);
                } finally {
                    signInBtn.disabled = false;
                    signInBtn.textContent = 'Sign in with Google';
                }
            });
        }

        // Sign out button
        const signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to sign out?')) {
                    await this.signOut();
                }
            });
        }

        // Check for redirect result on page load
        this.getRedirectResult();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
}
