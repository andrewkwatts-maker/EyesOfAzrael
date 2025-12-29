/**
 * Optimized Authentication Guard Module for Eyes of Azrael
 *
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Instant display (<100ms) - No waiting for Firebase
 * 2. Synchronous localStorage check for cached auth state
 * 3. Pre-populated email from last login (instant auto-fill)
 * 4. Background Firebase auth check with smooth transitions
 * 5. Progressive enhancement - show UI first, verify later
 */

// Auth state
let isAuthenticated = false;
let currentUser = null;

// Performance tracking
const perfMarks = {
    scriptStart: performance.now(),
    overlayVisible: null,
    firebaseReady: null,
    authResolved: null
};

// LocalStorage keys
const STORAGE_KEYS = {
    LAST_USER_EMAIL: 'eoa_last_user_email',
    LAST_USER_NAME: 'eoa_last_user_name',
    LAST_USER_PHOTO: 'eoa_last_user_photo',
    AUTH_CACHED: 'eoa_auth_cached',
    AUTH_TIMESTAMP: 'eoa_auth_timestamp'
};

// Cache duration (30 minutes - matches PrincipiaMetaphysica)
const AUTH_CACHE_DURATION = 30 * 60 * 1000;

/**
 * PHASE 1: INSTANT DISPLAY
 * This runs synchronously before any async Firebase operations
 * OPTIMIZED: Show content immediately when cached auth is valid
 */
function instantDisplay() {
    console.log('[EOA Auth Guard OPTIMIZED] Phase 1: Instant Display');

    // Check cached auth state from localStorage (synchronous, instant)
    const cachedAuth = getCachedAuthState();

    if (cachedAuth.isValid && cachedAuth.wasAuthenticated) {
        // User was recently authenticated - show content IMMEDIATELY (optimistic)
        // Don't show loading screen - go straight to authenticated state
        console.log('[EOA Auth Guard] Using cached auth - showing content IMMEDIATELY (optimistic)');

        // Set authenticated state instantly - content visible right away
        isAuthenticated = true;
        document.body.classList.add('authenticated');

        // Show main content container immediately
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.style.opacity = '1';
        }

        // Emit optimistic auth-ready event so SPA can start loading content NOW
        document.dispatchEvent(new CustomEvent('auth-ready', {
            detail: { user: null, authenticated: true, optimistic: true }
        }));

        // Mark that we're using optimistic auth (Firebase will verify in background)
        window._eoaOptimisticAuth = true;
    } else {
        // No valid cache - check if Firebase has a current user (LOCAL persistence)
        // This handles the case where cache expired but user is still logged in
        console.log('[EOA Auth Guard] No valid cache - checking Firebase currentUser...');

        // Show overlay initially, but will auto-close if Firebase confirms login
        document.body.classList.add('not-authenticated');
        showAuthOverlay();
        prefillLastUserEmail(); // Instant auto-fill from localStorage

        // Mark that we need to check Firebase (not optimistic yet)
        window._eoaWaitingForFirebase = true;
    }

    perfMarks.overlayVisible = performance.now();
    console.log(`[EOA Auth Guard] Display time: ${(perfMarks.overlayVisible - perfMarks.scriptStart).toFixed(2)}ms`);
}

/**
 * PHASE 2: FIREBASE VERIFICATION
 * This runs asynchronously in the background after UI is visible
 * OPTIMIZED: Non-blocking, doesn't await persistence
 */
export function setupAuthGuard() {
    console.log('[EOA Auth Guard OPTIMIZED] Phase 2: Firebase Verification (background)');

    // Wait for Firebase to be ready
    if (typeof firebase === 'undefined') {
        console.error('[EOA Auth Guard] Firebase not loaded!');
        if (!window._eoaOptimisticAuth) {
            handleNotAuthenticated();
        }
        return;
    }

    // Initialize Firebase if needed
    if (firebase.apps.length === 0 && typeof firebaseConfig !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();

    // IMMEDIATE CHECK: If user is already logged in (LOCAL persistence loaded synchronously)
    // This handles the case where cache expired but Firebase still has the user
    if (auth.currentUser && window._eoaWaitingForFirebase) {
        console.log('[EOA Auth Guard] Firebase currentUser available immediately:', auth.currentUser.email);
        console.log('[EOA Auth Guard] Auto-closing login overlay...');
        handleAuthenticated(auth.currentUser);
        cacheAuthState(true, auth.currentUser);
        window._eoaWaitingForFirebase = false;
    }

    // Enable auth persistence in background (DON'T await - non-blocking)
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('[EOA Auth Guard] Auth persistence set to LOCAL (background)');
            perfMarks.firebaseReady = performance.now();
        })
        .catch((error) => {
            console.error('[EOA Auth Guard] Failed to set persistence:', error);
        });

    // Set up auth state listener for VERIFICATION
    auth.onAuthStateChanged((user) => {
        perfMarks.authResolved = performance.now();
        console.log(`[EOA Auth Guard] Auth state changed in ${(perfMarks.authResolved - perfMarks.scriptStart).toFixed(2)}ms`);
        console.log('[EOA Auth Guard] User:', user ? user.email : 'null');

        // Remove loading state
        document.body.classList.remove('auth-loading');

        if (user) {
            // User is logged in - update UI and cache
            handleAuthenticated(user);
            cacheAuthState(true, user);

            // Clear waiting flag
            window._eoaWaitingForFirebase = false;

            // If we were optimistic, emit verification event
            if (window._eoaOptimisticAuth) {
                console.log('[EOA Auth Guard] Optimistic auth VERIFIED');
                document.dispatchEvent(new CustomEvent('auth-verified', {
                    detail: { user, authenticated: true }
                }));
            }
        } else {
            // Auth failed - if we were optimistic, need to show login
            if (window._eoaOptimisticAuth) {
                console.log('[EOA Auth Guard] Optimistic auth FAILED - showing login');
                window._eoaOptimisticAuth = false;
            }
            handleNotAuthenticated();
            cacheAuthState(false, null);
        }
    });

    // Set up login button handlers
    setupLoginHandlers();

    // Set up logout button handler
    setupLogoutHandler();
}

/**
 * Get cached auth state from localStorage (synchronous)
 */
function getCachedAuthState() {
    try {
        const cached = localStorage.getItem(STORAGE_KEYS.AUTH_CACHED);
        const timestamp = localStorage.getItem(STORAGE_KEYS.AUTH_TIMESTAMP);

        if (!cached || !timestamp) {
            return { isValid: false, wasAuthenticated: false };
        }

        const age = Date.now() - parseInt(timestamp, 10);
        const isValid = age < AUTH_CACHE_DURATION;
        const wasAuthenticated = cached === 'true';

        return { isValid, wasAuthenticated, age };
    } catch (error) {
        console.error('[EOA Auth Guard] Error reading cache:', error);
        return { isValid: false, wasAuthenticated: false };
    }
}

/**
 * Cache auth state to localStorage
 */
function cacheAuthState(authenticated, user) {
    try {
        localStorage.setItem(STORAGE_KEYS.AUTH_CACHED, authenticated.toString());
        localStorage.setItem(STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());

        if (user) {
            // Cache user info for instant pre-fill on next visit
            if (user.email) localStorage.setItem(STORAGE_KEYS.LAST_USER_EMAIL, user.email);
            if (user.displayName) localStorage.setItem(STORAGE_KEYS.LAST_USER_NAME, user.displayName);
            if (user.photoURL) localStorage.setItem(STORAGE_KEYS.LAST_USER_PHOTO, user.photoURL);
        }
    } catch (error) {
        console.error('[EOA Auth Guard] Error caching auth state:', error);
    }
}

/**
 * Pre-fill last user email (instant, synchronous)
 */
function prefillLastUserEmail() {
    try {
        const lastEmail = localStorage.getItem(STORAGE_KEYS.LAST_USER_EMAIL);
        const lastName = localStorage.getItem(STORAGE_KEYS.LAST_USER_NAME);

        if (lastEmail || lastName) {
            console.log('[EOA Auth Guard] Pre-filling last user info');

            // Add a "Welcome back" message to the auth card
            const authCard = document.querySelector('.auth-card');
            if (authCard && (lastEmail || lastName)) {
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'welcome-back-msg';
                welcomeMsg.innerHTML = `
                    <p class="welcome-text">Welcome back${lastName ? ', ' + lastName : ''}!</p>
                    ${lastEmail ? `<p class="last-email">${lastEmail}</p>` : ''}
                `;

                // Insert before the login button
                const loginBtn = authCard.querySelector('.google-login-btn');
                if (loginBtn) {
                    authCard.insertBefore(welcomeMsg, loginBtn);
                }
            }
        }
    } catch (error) {
        console.error('[EOA Auth Guard] Error pre-filling email:', error);
    }
}

/**
 * Show loading screen (instant)
 */
function showLoadingScreen() {
    if (!document.getElementById('auth-loading-screen')) {
        injectLoadingScreen();
    }
    const loadingScreen = document.getElementById('auth-loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

/**
 * Show auth overlay (instant)
 */
function showAuthOverlay() {
    if (!document.getElementById('auth-overlay')) {
        injectAuthOverlay();
    }
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

/**
 * Set up login button handlers
 */
function setupLoginHandlers() {
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
 * IMPROVED: Always hides overlay and shows content when user is authenticated
 */
function handleAuthenticated(user) {
    console.log(`[EOA Auth Guard] ✅ User authenticated: ${user.email}`);

    isAuthenticated = true;
    currentUser = user;

    // Update user display first
    updateUserDisplay(user);

    // ALWAYS ensure authenticated class is on body (required by CSS to show main-content)
    document.body.classList.remove('not-authenticated', 'auth-loading');
    document.body.classList.add('authenticated');

    // If we were in optimistic mode, content is already visible - just verify
    if (window._eoaOptimisticAuth) {
        console.log('[EOA Auth Guard] Optimistic mode - content already visible, user verified');
        return;
    }

    console.log('[EOA Auth Guard] User display name:', user.displayName);
    console.log('[EOA Auth Guard] Transitioning to authenticated state...');

    // ALWAYS hide auth overlay if visible (this is the key fix)
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        console.log('[EOA Auth Guard] Hiding auth overlay (login prompt)');
        overlay.style.display = 'none';
    }

    // Show main content container immediately
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.opacity = '1';
    }

    // Emit auth-ready event
    document.dispatchEvent(new CustomEvent('auth-ready', {
        detail: { user, authenticated: true }
    }));

    console.log('[EOA Auth Guard] Auth transition complete - content visible');
}

/**
 * Handle not authenticated state
 */
function handleNotAuthenticated() {
    console.log('[EOA Auth Guard] ❌ User not authenticated - showing login prompt');
    isAuthenticated = false;
    currentUser = null;

    // Smooth transition to not-authenticated state
    document.body.classList.add('not-authenticated');
    document.body.classList.remove('authenticated', 'auth-loading');

    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        console.log('[EOA Auth Guard] Displaying auth overlay (login prompt)');
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        prefillLastUserEmail(); // Re-apply in case overlay was just created
    }

    const loadingScreen = document.getElementById('auth-loading-screen');
    if (loadingScreen) {
        console.log('[EOA Auth Guard] Hiding loading screen');
        loadingScreen.style.display = 'none';
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        console.log('[EOA Auth Guard] Hiding main content');
        mainContent.style.display = 'none';
    }

    // Clear user display
    updateUserDisplay(null);

    // Emit auth-ready event (not authenticated)
    document.dispatchEvent(new CustomEvent('auth-ready', {
        detail: { user: null, authenticated: false }
    }));
}

/**
 * Handle login button click
 * IMPROVED: Check if already logged in, better error handling
 */
async function handleLogin() {
    const loginBtn = document.getElementById('google-login-btn-overlay');
    const auth = firebase.auth();

    // Check if user is already logged in
    if (auth.currentUser) {
        console.log('[EOA Auth Guard] User already logged in:', auth.currentUser.email);
        // User is already authenticated - just update UI and hide overlay
        handleAuthenticated(auth.currentUser);
        cacheAuthState(true, auth.currentUser);
        return;
    }

    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
    }

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        console.log('[EOA Auth Guard] Initiating Google sign-in...');
        const result = await auth.signInWithPopup(provider);
        console.log('[EOA Auth Guard] Login successful:', result.user.email);

        // Cache user info immediately and update UI
        if (result.user) {
            cacheAuthState(true, result.user);
            handleAuthenticated(result.user);
        }
    } catch (error) {
        console.error('[EOA Auth Guard] Login error:', error.code, error.message);

        // Handle specific error cases (learned from PrincipiaMetaphysica)
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                console.log('[EOA Auth Guard] Sign-in cancelled by user');
                // Don't show alert - user intentionally closed popup
                break;
            case 'auth/popup-blocked':
                alert('Pop-up blocked by browser. Please allow pop-ups for this site.');
                break;
            case 'auth/cancelled-popup-request':
                // Multiple popups opened, ignore silently
                console.log('[EOA Auth Guard] Cancelled duplicate popup request');
                break;
            case 'auth/account-exists-with-different-credential':
                alert('An account already exists with this email using a different sign-in method.');
                break;
            case 'auth/network-request-failed':
                alert('Network error. Please check your connection and try again.');
                break;
            default:
                // Only show alert for unexpected errors
                if (error.code && !error.code.includes('cancelled') && !error.code.includes('closed')) {
                    alert('Sign-in failed: ' + error.message);
                }
        }

        // Reset button state
        resetLoginButton(loginBtn);
    }
}

/**
 * Reset login button to default state
 */
function resetLoginButton(loginBtn) {
    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = `
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="width: 20px; height: 20px; margin-right: 12px;">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.30-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Sign in with Google
        `;
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

        // Clear cache
        cacheAuthState(false, null);
    } catch (error) {
        console.error('[EOA Auth Guard] Logout failed:', error);
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

    document.body.insertBefore(overlay, document.body.firstChild);
}

/**
 * Check if user is currently authenticated
 */
export function isUserAuthenticated() {
    return isAuthenticated;
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics() {
    return {
        displayTime: perfMarks.overlayVisible - perfMarks.scriptStart,
        firebaseReadyTime: perfMarks.firebaseReady - perfMarks.scriptStart,
        totalAuthTime: perfMarks.authResolved - perfMarks.scriptStart,
        marks: perfMarks
    };
}

// Listen for first render complete to hide loading screen
document.addEventListener('first-render-complete', (event) => {
    console.log('[EOA Auth Guard] Content rendered, hiding loading screen');

    const loadingScreen = document.getElementById('auth-loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            console.log('[EOA Auth Guard] Loading screen hidden');
        }, 300);
    }
});

// PHASE 1 & 2: Execute when DOM body is ready
if (document.readyState === 'loading') {
    // DOM not ready yet - wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        instantDisplay();
        setupAuthGuard();
    });
} else {
    // DOM is already ready - execute immediately
    instantDisplay();
    setupAuthGuard();
}
