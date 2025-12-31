/**
 * Simplified Authentication Guard for Eyes of Azrael
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles auth state and UI visibility
 * - Open/Closed: Extensible via events, closed for modification
 * - Dependency Inversion: Depends on Firebase abstraction, not implementation
 *
 * SIMPLIFIED APPROACH:
 * 1. Content is ALWAYS visible by default (public site)
 * 2. Auth overlay only shows when explicitly needed (protected routes)
 * 3. No complex caching or optimistic auth - just check Firebase directly
 */

(function() {
    'use strict';

    console.log('[Auth Guard] Initializing simplified auth guard...');

    // State
    let isAuthenticated = false;
    let currentUser = null;
    let authInitialized = false;

    // LocalStorage keys for remembering user
    // SECURITY NOTE: We store a hashed version of the email for privacy.
    // The hash is used only for display purposes (showing "Welcome back") and
    // is not used for authentication. Actual auth is always verified via Firebase.
    const LAST_USER_KEY = 'eoa_last_user_email_hash';
    const LAST_USER_DISPLAY_KEY = 'eoa_last_user_display';

    /**
     * Simple hash function for email obfuscation (not cryptographic security)
     * Used only to avoid storing plaintext email in localStorage
     */
    function hashEmail(email) {
        if (!email) return '';
        // Create a simple masked version: first 2 chars + *** + domain
        const parts = email.split('@');
        if (parts.length !== 2) return '***';
        const local = parts[0];
        const domain = parts[1];
        const masked = local.substring(0, 2) + '***@' + domain;
        return masked;
    }

    /**
     * Initialize auth guard when DOM is ready
     */
    function init() {
        console.log('[Auth Guard] DOM ready, setting up Firebase auth listener...');

        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.error('[Auth Guard] Firebase not loaded!');
            showContent(); // Show content anyway - don't block on auth errors
            return;
        }

        // Initialize Firebase if needed (check if already initialized)
        if (firebase.apps.length === 0 && typeof firebaseConfig !== 'undefined') {
            console.log('[Auth Guard] Initializing Firebase...');
            firebase.initializeApp(firebaseConfig);
        } else if (firebase.apps.length > 0) {
            console.log('[Auth Guard] Firebase already initialized, skipping...');
        }

        const auth = firebase.auth();

        // Set up auth state listener - this is the ONLY place we handle auth state
        auth.onAuthStateChanged(async (user) => {
            console.log('[Auth Guard] Auth state changed:', user ? user.email : 'null');
            authInitialized = true;

            if (user) {
                // Validate token is still valid before showing authenticated UI
                const isValid = await validateSession(user);
                if (isValid) {
                    handleAuthenticated(user);
                } else {
                    console.log('[Auth Guard] Session invalid, signing out...');
                    await auth.signOut();
                    handleNotAuthenticated();
                }
            } else {
                handleNotAuthenticated();
            }

            // Dispatch event for other components
            document.dispatchEvent(new CustomEvent('auth-state-changed', {
                detail: { user, authenticated: !!user }
            }));
        });

        // Set up login button if overlay exists
        setupLoginButton();

        // Set up logout button
        setupLogoutButton();

        // IMPORTANT: Show content immediately - don't wait for auth
        // The site is public, auth is optional enhancement
        showContent();
    }

    /**
     * Validate user session by checking token validity
     * @param {firebase.User} user - The Firebase user object
     * @returns {Promise<boolean>} - True if session is valid
     */
    async function validateSession(user) {
        if (!user) return false;

        try {
            // Get fresh token to validate session
            // forceRefresh: false - use cached token if not expired
            // forceRefresh: true would force a refresh every time
            const tokenResult = await user.getIdTokenResult(false);

            // Check if token is expired (shouldn't happen with valid session)
            const expirationTime = new Date(tokenResult.expirationTime).getTime();
            const now = Date.now();

            if (expirationTime < now) {
                console.warn('[Auth Guard] Token expired, attempting refresh...');
                // Force refresh the token
                await user.getIdToken(true);
            }

            return true;
        } catch (error) {
            console.error('[Auth Guard] Session validation failed:', error);

            // Token refresh failed - session is invalid
            if (error.code === 'auth/user-token-expired' ||
                error.code === 'auth/user-disabled' ||
                error.code === 'auth/user-not-found') {
                return false;
            }

            // Network errors - give benefit of doubt, don't log out
            if (error.code === 'auth/network-request-failed') {
                console.warn('[Auth Guard] Network error during validation, assuming valid');
                return true;
            }

            // Unknown error - log out to be safe
            return false;
        }
    }

    /**
     * Show main content - called immediately on load
     */
    function showContent() {
        console.log('[Auth Guard] Showing content...');

        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.style.opacity = '1';
            mainContent.style.visibility = 'visible';
        }

        // Remove any loading classes from body
        document.body.classList.remove('auth-loading');
    }

    /**
     * Handle authenticated user
     */
    function handleAuthenticated(user) {
        console.log('[Auth Guard] User authenticated:', user.email);

        isAuthenticated = true;
        currentUser = user;

        // Update body class
        document.body.classList.add('authenticated');
        document.body.classList.remove('not-authenticated');

        // Hide auth overlay if visible
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        // Show user info in header
        updateUserDisplay(user);

        // Remember user for next visit (store masked email for privacy)
        try {
            localStorage.setItem(LAST_USER_KEY, hashEmail(user.email));
            localStorage.setItem(LAST_USER_DISPLAY_KEY, user.displayName || '');
        } catch (e) {
            // localStorage might be blocked
        }

        // Dispatch auth-ready event
        document.dispatchEvent(new CustomEvent('auth-ready', {
            detail: { user, authenticated: true }
        }));
    }

    /**
     * Handle not authenticated - but DON'T block content
     */
    function handleNotAuthenticated() {
        console.log('[Auth Guard] User not authenticated');

        isAuthenticated = false;
        currentUser = null;

        // Update body class
        document.body.classList.add('not-authenticated');
        document.body.classList.remove('authenticated');

        // Clear user display
        updateUserDisplay(null);

        // Dispatch auth-ready event (not authenticated, but ready)
        document.dispatchEvent(new CustomEvent('auth-ready', {
            detail: { user: null, authenticated: false }
        }));
    }

    /**
     * Show login overlay - called when user explicitly needs to login
     * (e.g., for protected routes like dashboard, or user clicks login)
     */
    function showLoginOverlay() {
        console.log('[Auth Guard] Showing login overlay...');

        let overlay = document.getElementById('auth-overlay');
        if (!overlay) {
            overlay = createLoginOverlay();
        }
        overlay.style.display = 'flex';

        // Pre-fill last user email
        prefillLastUserEmail();
    }

    /**
     * Create login overlay HTML
     */
    function createLoginOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        overlay.className = 'auth-overlay';
        overlay.innerHTML = `
            <div class="auth-card">
                <div class="auth-logo">👁️</div>
                <h1 class="auth-title">Eyes of Azrael</h1>
                <p class="auth-subtitle">Sign in to access all features</p>

                <button id="google-login-btn" class="google-login-btn">
                    <svg viewBox="0 0 48 48" style="width: 20px; height: 20px; margin-right: 12px;">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.30-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    Sign in with Google
                </button>

                <div class="auth-tos">
                    <p>By signing in, you agree to our <a href="#/terms">Terms of Service</a></p>
                </div>

                <button class="auth-skip-btn" id="auth-skip-btn">
                    Continue as Guest
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Set up event handlers
        const loginBtn = overlay.querySelector('#google-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
        }

        const skipBtn = overlay.querySelector('#auth-skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                overlay.style.display = 'none';
            });
        }

        return overlay;
    }

    /**
     * Pre-fill last user info for convenience
     * Uses masked email (not full email) for privacy
     */
    function prefillLastUserEmail() {
        try {
            const maskedEmail = localStorage.getItem(LAST_USER_KEY);
            const displayName = localStorage.getItem(LAST_USER_DISPLAY_KEY);

            // Validate cached data exists and has reasonable format
            if (!maskedEmail || maskedEmail.length < 5) {
                // Invalid or missing cached data - clear stale entries
                clearCachedUserData();
                return;
            }

            // Validate masked email format (should contain @ and ***)
            if (!maskedEmail.includes('@') || !maskedEmail.includes('***')) {
                // Looks like old format (full email) - clear for privacy
                console.log('[Auth Guard] Clearing old format cached email');
                clearCachedUserData();
                return;
            }

            const authCard = document.querySelector('.auth-card');
            if (authCard && !authCard.querySelector('.welcome-back-msg')) {
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'welcome-back-msg';

                // Show display name if available, otherwise show masked email
                const displayText = displayName
                    ? `Welcome back, ${displayName}!`
                    : `Welcome back! (${maskedEmail})`;

                welcomeMsg.innerHTML = `<p>${displayText}</p>`;
                const loginBtn = authCard.querySelector('.google-login-btn');
                if (loginBtn) {
                    authCard.insertBefore(welcomeMsg, loginBtn);
                }
            }
        } catch (e) {
            // localStorage might be blocked
            console.warn('[Auth Guard] Could not access localStorage:', e);
        }
    }

    /**
     * Set up login button handlers
     * Handles both the overlay login button and the header sign-in button
     */
    function setupLoginButton() {
        // Overlay login button
        const loginBtn = document.getElementById('google-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
        }

        // Header sign-in button (new minimalist header)
        const headerSignInBtn = document.getElementById('signInBtn');
        if (headerSignInBtn) {
            // Remove any existing listeners to prevent duplicates
            headerSignInBtn.replaceWith(headerSignInBtn.cloneNode(true));
            const newHeaderSignInBtn = document.getElementById('signInBtn');
            newHeaderSignInBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[Auth Guard] Header Sign In button clicked');
                handleLogin();
            });
        }
    }

    /**
     * Set up logout button handler
     */
    function setupLogoutButton() {
        const logoutBtn = document.getElementById('signOutBtn');
        if (logoutBtn) {
            // Remove any existing listeners to prevent duplicates
            logoutBtn.replaceWith(logoutBtn.cloneNode(true));
            const newLogoutBtn = document.getElementById('signOutBtn');
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[Auth Guard] Sign Out button clicked');
                handleLogout();
            });
        }
    }

    /**
     * Google login button HTML for resetting button state
     */
    const GOOGLE_LOGIN_BTN_HTML = `
        <svg viewBox="0 0 48 48" style="width: 20px; height: 20px; margin-right: 12px;">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.30-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        </svg>
        Sign in with Google
    `;

    /**
     * Reset login button to default state
     * @param {HTMLElement|null} btn - The button element (optional, will find by ID if not provided)
     */
    function resetLoginButton(btn) {
        // Try to find button if not provided
        const loginBtn = btn || document.getElementById('google-login-btn');

        // Safety check - button might not exist in DOM
        if (!loginBtn) {
            console.warn('[Auth Guard] Login button not found in DOM, cannot reset');
            return;
        }

        try {
            loginBtn.disabled = false;
            loginBtn.innerHTML = GOOGLE_LOGIN_BTN_HTML;
        } catch (e) {
            console.error('[Auth Guard] Error resetting login button:', e);
        }
    }

    /**
     * Handle login button click
     */
    async function handleLogin() {
        console.log('[Auth Guard] Login button clicked');

        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error('[Auth Guard] Firebase not available for login');
            showAuthError('Authentication service unavailable. Please refresh the page.');
            return;
        }

        // Check if user is already logged in
        const auth = firebase.auth();
        if (auth.currentUser) {
            console.log('[Auth Guard] User already logged in:', auth.currentUser.email);
            return;
        }

        const loginBtn = document.getElementById('google-login-btn');
        const headerSignInBtn = document.getElementById('signInBtn');

        // Disable both buttons during login
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Signing in...';
        }
        if (headerSignInBtn) {
            headerSignInBtn.disabled = true;
            headerSignInBtn.textContent = 'Signing in...';
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            const result = await auth.signInWithPopup(provider);
            console.log('[Auth Guard] Login successful:', result.user.email);

            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error('[Auth Guard] Login error:', error);

            // Handle specific errors with user-friendly messages
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('[Auth Guard] User closed popup');
                // No alert needed - user intentionally closed
            } else if (error.code === 'auth/popup-blocked') {
                showAuthError('Popup blocked. Please allow popups for this site to sign in.');
            } else if (error.code === 'auth/cancelled-popup-request') {
                console.log('[Auth Guard] Popup request cancelled (another popup may be open)');
            } else if (error.code === 'auth/network-request-failed') {
                showAuthError('Network error. Please check your connection and try again.');
            } else if (error.code === 'auth/too-many-requests') {
                showAuthError('Too many attempts. Please wait a moment and try again.');
            } else {
                showAuthError('Sign in failed: ' + (error.message || 'Unknown error'));
            }

            // Reset buttons safely
            resetLoginButton(loginBtn);
            resetHeaderSignInButton(headerSignInBtn);
        }
    }

    /**
     * Show authentication error to user
     * @param {string} message - Error message to display
     */
    function showAuthError(message) {
        // Try to use toast notifications if available
        if (window.ToastNotifications && typeof window.ToastNotifications.show === 'function') {
            window.ToastNotifications.show(message, 'error');
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    /**
     * Reset header sign-in button to default state
     * @param {HTMLElement|null} btn - The button element
     */
    function resetHeaderSignInButton(btn) {
        const signInBtn = btn || document.getElementById('signInBtn');
        if (!signInBtn) return;

        try {
            signInBtn.disabled = false;
            signInBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign In
            `;
        } catch (e) {
            console.error('[Auth Guard] Error resetting header sign-in button:', e);
        }
    }

    /**
     * Handle logout button click
     * @param {boolean|Event} skipConfirmationOrEvent - If true, skip dialog; if Event, extract from it
     */
    async function handleLogout(skipConfirmationOrEvent = false) {
        console.log('[Auth Guard] Logout button clicked');

        // Handle case where this is called as an event handler
        let skipConfirmation = false;
        if (skipConfirmationOrEvent === true) {
            skipConfirmation = true;
        } else if (skipConfirmationOrEvent && typeof skipConfirmationOrEvent.preventDefault === 'function') {
            // This is an Event object from addEventListener
            skipConfirmationOrEvent.preventDefault();
            skipConfirmation = false;
        }

        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error('[Auth Guard] Firebase not available for logout');
            showAuthError('Unable to sign out. Please refresh the page.');
            return;
        }

        // Show confirmation dialog unless skipped
        if (!skipConfirmation) {
            const confirmed = confirm('Are you sure you want to sign out?');
            if (!confirmed) {
                console.log('[Auth Guard] Logout cancelled by user');
                return;
            }
        }

        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.disabled = true;
            signOutBtn.textContent = 'Signing out...';
        }

        try {
            await firebase.auth().signOut();
            console.log('[Auth Guard] Logout successful');

            // Clear cached user data on logout to prevent stale data
            clearCachedUserData();

            // Show success message if toast is available
            if (window.ToastNotifications && typeof window.ToastNotifications.show === 'function') {
                window.ToastNotifications.show('Signed out successfully', 'success');
            }
        } catch (error) {
            console.error('[Auth Guard] Logout error:', error);

            // Reset button state
            if (signOutBtn) {
                signOutBtn.disabled = false;
                signOutBtn.textContent = 'Sign Out';
            }

            // Show error message
            if (error.code === 'auth/network-request-failed') {
                showAuthError('Network error. Please check your connection and try again.');
            } else {
                showAuthError('Sign out failed: ' + (error.message || 'Unknown error'));
            }
        }
    }

    /**
     * Clear cached user data from localStorage
     */
    function clearCachedUserData() {
        try {
            localStorage.removeItem(LAST_USER_KEY);
            localStorage.removeItem(LAST_USER_DISPLAY_KEY);
            // Also clear legacy key if it exists
            localStorage.removeItem('eoa_last_user_email');
        } catch (e) {
            // localStorage might be blocked
        }
    }

    /**
     * Default avatar SVG as data URI for users without a photo
     */
    const DEFAULT_AVATAR = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#8b7fff"/>
            <circle cx="20" cy="16" r="7" fill="#f8f9fa"/>
            <path d="M8 36c0-8 5-12 12-12s12 4 12 12" fill="#f8f9fa"/>
        </svg>
    `);

    /**
     * Update user display in header
     * Shows user info when logged in, sign-in button when logged out
     * Note: Body classes are managed by handleAuthenticated/handleNotAuthenticated
     */
    function updateUserDisplay(user) {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const signInBtn = document.getElementById('signInBtn');

        if (user) {
            // User is logged in - show user info, hide sign-in button
            if (userInfo) {
                userInfo.style.display = 'flex';
            }
            if (userName) {
                userName.textContent = user.displayName || user.email || 'User';
            }
            if (userAvatar) {
                // Use photoURL if available, otherwise use default avatar
                userAvatar.src = user.photoURL || DEFAULT_AVATAR;
                userAvatar.alt = user.displayName || 'User profile';
                // Handle image load errors by falling back to default
                userAvatar.onerror = function() {
                    this.onerror = null; // Prevent infinite loop
                    this.src = DEFAULT_AVATAR;
                };
            }
            if (signInBtn) {
                signInBtn.style.display = 'none';
            }
        } else {
            // User is logged out - show sign-in button, hide user info
            if (userInfo) {
                userInfo.style.display = 'none';
            }
            if (userAvatar) {
                userAvatar.src = '';
                userAvatar.alt = '';
            }
            if (signInBtn) {
                signInBtn.style.display = 'inline-flex';
            }
        }
    }

    /**
     * Public API
     */
    window.AuthGuard = {
        isAuthenticated: () => isAuthenticated,
        getCurrentUser: () => currentUser,
        showLoginOverlay: showLoginOverlay,
        isReady: () => authInitialized,
        /**
         * Initiate login flow
         * @returns {Promise<void>}
         */
        login: handleLogin,
        /**
         * Logout the current user
         * @param {boolean} skipConfirmation - If true, logout immediately without confirmation
         */
        logout: (skipConfirmation = false) => handleLogout(skipConfirmation),
        /**
         * Validate the current session
         * @returns {Promise<boolean>} - True if session is valid
         */
        validateSession: () => currentUser ? validateSession(currentUser) : Promise.resolve(false),
        /**
         * Clear all cached user data
         */
        clearCache: clearCachedUserData,
        /**
         * Re-initialize button handlers (useful after dynamic DOM updates)
         */
        reinitButtons: () => {
            setupLoginButton();
            setupLogoutButton();
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[Auth Guard] Module loaded');
})();
