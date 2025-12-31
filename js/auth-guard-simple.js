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
     * Set up login button handler
     */
    function setupLoginButton() {
        const loginBtn = document.getElementById('google-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
        }
    }

    /**
     * Set up logout button handler
     */
    function setupLogoutButton() {
        const logoutBtn = document.getElementById('signOutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
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

        const loginBtn = document.getElementById('google-login-btn');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Signing in...';
        }

        try {
            const auth = firebase.auth();
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            const result = await auth.signInWithPopup(provider);
            console.log('[Auth Guard] Login successful:', result.user.email);

            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error('[Auth Guard] Login error:', error);

            // Handle specific errors
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('[Auth Guard] User closed popup');
            } else if (error.code === 'auth/popup-blocked') {
                alert('Please allow popups for this site to sign in.');
            } else if (error.code !== 'auth/cancelled-popup-request') {
                alert('Sign in failed: ' + error.message);
            }

            // Reset button safely (handles missing button gracefully)
            resetLoginButton(loginBtn);
        }
    }

    /**
     * Handle logout button click
     * @param {boolean} skipConfirmation - If true, skip the confirmation dialog
     */
    async function handleLogout(skipConfirmation = false) {
        console.log('[Auth Guard] Logout button clicked');

        // Show confirmation dialog unless skipped
        if (!skipConfirmation) {
            const confirmed = confirm('Are you sure you want to sign out?');
            if (!confirmed) {
                console.log('[Auth Guard] Logout cancelled by user');
                return;
            }
        }

        try {
            await firebase.auth().signOut();
            console.log('[Auth Guard] Logout successful');

            // Clear cached user data on logout to prevent stale data
            clearCachedUserData();
        } catch (error) {
            console.error('[Auth Guard] Logout error:', error);
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
     * Update user display in header
     */
    function updateUserDisplay(user) {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (user && userInfo) {
            userInfo.style.display = 'flex';
            if (userName) {
                userName.textContent = user.displayName || user.email;
            }
            if (userAvatar && user.photoURL) {
                userAvatar.src = user.photoURL;
                userAvatar.alt = user.displayName || 'User';
            }
        } else if (userInfo) {
            userInfo.style.display = 'none';
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
        clearCache: clearCachedUserData
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[Auth Guard] Module loaded');
})();
