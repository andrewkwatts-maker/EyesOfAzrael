/**
 * Authentication Guard Module for Eyes of Azrael
 *
 * Protects page content until user is authenticated.
 * Shows login overlay when not authenticated, reveals content when authenticated.
 */

// Auth state
let isAuthenticated = false;
let currentUser = null;

/**
 * Initialize the auth guard
 */
export function setupAuthGuard() {
    console.log('[EOA Auth Guard] Setting up...');

    // Start with loading state (prevents flicker)
    document.body.classList.add('auth-loading');
    document.body.classList.remove('not-authenticated', 'authenticated');

    // Create and inject loading screen if it doesn't exist
    if (!document.getElementById('auth-loading-screen')) {
        injectLoadingScreen();
    }

    // Create and inject auth overlay if it doesn't exist
    if (!document.getElementById('auth-overlay')) {
        injectAuthOverlay();
    }

    // Wait for Firebase to be ready
    if (typeof firebase === 'undefined') {
        console.error('[EOA Auth Guard] Firebase not loaded!');
        return;
    }

    // Initialize Firebase if needed
    if (firebase.apps.length === 0 && typeof firebaseConfig !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
    }

    // Set up auth state listener
    const auth = firebase.auth();
    auth.onAuthStateChanged((user) => {
        // Remove loading state
        document.body.classList.remove('auth-loading');

        if (user) {
            handleAuthenticated(user);
        } else {
            handleNotAuthenticated();
        }
    });

    // Set up login button handlers
    setupLoginHandlers();

    // Set up logout button handler
    setupLogoutHandler();
}

/**
 * Set up login button handlers
 */
function setupLoginHandlers() {
    // Overlay login button
    const overlayLoginBtn = document.getElementById('google-login-btn-overlay');
    if (overlayLoginBtn) {
        overlayLoginBtn.addEventListener('click', handleLogin);
    }
}

/**
 * Set up logout button handler
 */
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('signOutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

/**
 * Handle authenticated state
 * @param {Object} user - Firebase user object
 */
function handleAuthenticated(user) {
    console.log(`[EOA Auth Guard] User authenticated: ${user.email}`);
    isAuthenticated = true;
    currentUser = user;

    // Hide overlay, show content
    document.body.classList.remove('not-authenticated');
    document.body.classList.add('authenticated');

    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    const loadingScreen = document.getElementById('auth-loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }

    // Update user info display in header
    updateUserDisplay(user);

    // Trigger navigation after a short delay to ensure all scripts loaded
    setTimeout(() => {
        console.log('[EOA Auth Guard] Triggering initial navigation...');
        // Trigger hashchange event to load content
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    }, 1000);
}

/**
 * Handle not authenticated state
 */
function handleNotAuthenticated() {
    console.log('[EOA Auth Guard] User not authenticated');
    isAuthenticated = false;
    currentUser = null;

    // Show overlay, hide content
    document.body.classList.add('not-authenticated');
    document.body.classList.remove('authenticated');

    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }

    const loadingScreen = document.getElementById('auth-loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    // Clear user display
    updateUserDisplay(null);
}

/**
 * Handle login button click
 */
async function handleLogin() {
    const loginBtn = document.getElementById('google-login-btn-overlay');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
    }

    try {
        const auth = firebase.auth();
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        await auth.signInWithPopup(provider);
        console.log('[EOA Auth Guard] Login successful');
    } catch (error) {
        console.error('[EOA Auth Guard] Login failed:', error);
        alert('Login failed: ' + error.message);

        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = `
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="width: 20px; height: 20px; margin-right: 12px;">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                Sign in with Google
            `;
        }
    }
}

/**
 * Handle logout button click
 */
async function handleLogout() {
    try {
        const auth = firebase.auth();
        await auth.signOut();
        console.log('[EOA Auth Guard] Logout successful');
    } catch (error) {
        console.error('[EOA Auth Guard] Logout failed:', error);
    }
}

/**
 * Update user display in header
 * @param {Object|null} user - Firebase user object or null
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
 * Inject loading screen HTML into the page
 */
function injectLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'auth-loading-screen';
    loadingScreen.className = 'auth-loading-screen';
    loadingScreen.innerHTML = `
        <div class="auth-spinner"></div>
        <p class="loading-text">Loading Eyes of Azrael...</p>
    `;

    // Insert at beginning of body
    document.body.insertBefore(loadingScreen, document.body.firstChild);
}

/**
 * Inject the auth overlay HTML into the page
 */
function injectAuthOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.className = 'auth-overlay';
    overlay.innerHTML = `
        <div class="auth-card">
            <div class="auth-logo">👁️</div>

            <h1 class="auth-title">Eyes of Azrael</h1>
            <p class="auth-subtitle">Explore World Mythologies</p>

            <p class="auth-description">
                Discover deities, heroes, creatures, and sacred texts from cultures across the globe
            </p>

            <button id="google-login-btn-overlay" class="google-login-btn">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="width: 20px; height: 20px; margin-right: 12px;">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.30-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                Sign in with Google
            </button>

            <div class="auth-tos">
                <p class="tos-notice">By logging in, you agree to the <a href="/terms.html" target="_blank">Terms of Service</a></p>
                <p class="tos-summary">All content is protected. Redistribution prohibited.</p>
            </div>

            <footer class="auth-footer">
                <p>Copyright © Eyes of Azrael 2025</p>
            </footer>
        </div>
    `;

    // Insert at beginning of body
    document.body.insertBefore(overlay, document.body.firstChild);
}

/**
 * Check if user is currently authenticated
 * @returns {boolean}
 */
export function isUserAuthenticated() {
    return isAuthenticated;
}

/**
 * Get current user
 * @returns {Object|null}
 */
export function getCurrentUser() {
    return currentUser;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAuthGuard);
} else {
    setupAuthGuard();
}
