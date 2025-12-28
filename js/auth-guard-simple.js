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

// Cache duration (5 minutes)
const AUTH_CACHE_DURATION = 5 * 60 * 1000;

/**
 * PHASE 1: INSTANT DISPLAY
 * This runs synchronously before any async Firebase operations
 */
function instantDisplay() {
    console.log('[EOA Auth Guard OPTIMIZED] Phase 1: Instant Display');

    // Check cached auth state from localStorage (synchronous, instant)
    const cachedAuth = getCachedAuthState();

    if (cachedAuth.isValid && cachedAuth.wasAuthenticated) {
        // User was recently authenticated - show content immediately, verify in background
        console.log('[EOA Auth Guard] Using cached auth - showing content optimistically');
        document.body.classList.add('auth-loading');
        showLoadingScreen();
    } else {
        // No valid cache - show login overlay immediately
        console.log('[EOA Auth Guard] No valid cache - showing login immediately');
        document.body.classList.add('not-authenticated');
        showAuthOverlay();
        prefillLastUserEmail(); // Instant auto-fill from localStorage
    }

    perfMarks.overlayVisible = performance.now();
    console.log(`[EOA Auth Guard] Display time: ${(perfMarks.overlayVisible - perfMarks.scriptStart).toFixed(2)}ms`);
}

/**
 * PHASE 2: FIREBASE VERIFICATION
 * This runs asynchronously in the background after UI is visible
 */
export function setupAuthGuard() {
    console.log('[EOA Auth Guard OPTIMIZED] Phase 2: Firebase Verification');

    // Wait for Firebase to be ready
    if (typeof firebase === 'undefined') {
        console.error('[EOA Auth Guard] Firebase not loaded!');
        handleNotAuthenticated();
        return;
    }

    // Initialize Firebase if needed
    if (firebase.apps.length === 0 && typeof firebaseConfig !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();

    // Enable auth persistence (LOCAL = persists across sessions/tabs)
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('[EOA Auth Guard] Auth persistence set to LOCAL');
            perfMarks.firebaseReady = performance.now();
        })
        .catch((error) => {
            console.error('[EOA Auth Guard] Failed to set persistence:', error);
        });

    // Set up auth state listener
    auth.onAuthStateChanged((user) => {
        perfMarks.authResolved = performance.now();
        console.log(`[EOA Auth Guard] Auth resolved in ${(perfMarks.authResolved - perfMarks.scriptStart).toFixed(2)}ms`);

        // Remove loading state
        document.body.classList.remove('auth-loading');

        if (user) {
            handleAuthenticated(user);
            cacheAuthState(true, user);
        } else {
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
 */
function handleAuthenticated(user) {
    console.log(`[EOA Auth Guard] User authenticated: ${user.email}`);
    isAuthenticated = true;
    currentUser = user;

    // Smooth transition to authenticated state
    document.body.classList.remove('not-authenticated', 'auth-loading');
    document.body.classList.add('authenticated');

    // Hide auth overlay if visible
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }

    // DON'T hide loading screen yet - wait for content to render
    console.log('[EOA Auth Guard] Waiting for content to render before hiding loading screen...');

    // Show main content container (but it will have loading spinner until SPA renders)
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.opacity = '1';
    }

    // Update user display
    updateUserDisplay(user);

    // Emit auth-ready event
    document.dispatchEvent(new CustomEvent('auth-ready', {
        detail: { user, authenticated: true }
    }));
}

/**
 * Handle not authenticated state
 */
function handleNotAuthenticated() {
    console.log('[EOA Auth Guard] User not authenticated');
    isAuthenticated = false;
    currentUser = null;

    // Smooth transition to not-authenticated state
    document.body.classList.add('not-authenticated');
    document.body.classList.remove('authenticated', 'auth-loading');

    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        prefillLastUserEmail(); // Re-apply in case overlay was just created
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

    // Emit auth-ready event (not authenticated)
    document.dispatchEvent(new CustomEvent('auth-ready', {
        detail: { user: null, authenticated: false }
    }));
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

        const result = await auth.signInWithPopup(provider);
        console.log('[EOA Auth Guard] Login successful');

        // Cache user info immediately
        if (result.user) {
            cacheAuthState(true, result.user);
        }
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
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.30-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
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
