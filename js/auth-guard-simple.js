/**
 * Simplified Authentication Guard for Eyes of Azrael
 *
 * POLISHED UI FEATURES:
 * - Prominent Google Sign In button with loading states
 * - User dropdown menu with avatar, links, and sign out
 * - Login prompt overlay with benefits messaging
 * - Session expiry notifications
 * - Smooth auth state transitions
 * - Protected route indicators
 * - Error handling with retry options
 * - Full accessibility support
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
    let sessionCheckInterval = null;
    let userMenuOpen = false;

    // LocalStorage keys for remembering user
    const LAST_USER_KEY = 'eoa_last_user_email_hash';
    const LAST_USER_DISPLAY_KEY = 'eoa_last_user_display';
    const SESSION_WARNING_SHOWN = 'eoa_session_warning_shown';

    // Session check interval (5 minutes)
    const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

    /**
     * Simple hash function for email obfuscation (not cryptographic security)
     * Used only to avoid storing plaintext email in localStorage
     */
    function hashEmail(email) {
        if (!email) return '';
        const parts = email.split('@');
        if (parts.length !== 2) return '***';
        const local = parts[0];
        const domain = parts[1];
        const masked = local.substring(0, 2) + '***@' + domain;
        return masked;
    }

    /**
     * Create auth check loading indicator
     */
    function createAuthCheckIndicator() {
        if (!document.querySelector('.auth-check-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'auth-check-indicator';
            document.body.insertBefore(indicator, document.body.firstChild);
        }
    }

    /**
     * Show/hide auth checking state
     */
    function setAuthChecking(checking) {
        if (checking) {
            document.body.classList.add('auth-checking');
            createAuthCheckIndicator();
        } else {
            document.body.classList.remove('auth-checking');
        }
    }

    /**
     * Create auth state transition overlay
     */
    function createAuthTransitionOverlay() {
        if (!document.querySelector('.auth-state-transition-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'auth-state-transition-overlay';
            document.body.appendChild(overlay);
        }
    }

    /**
     * Initialize auth guard when DOM is ready
     */
    function init() {
        console.log('[Auth Guard] DOM ready, setting up Firebase auth listener...');

        // Create transition overlay
        createAuthTransitionOverlay();

        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.error('[Auth Guard] Firebase not loaded!');
            showContent();
            return;
        }

        // Initialize Firebase if needed
        if (firebase.apps.length === 0 && typeof firebaseConfig !== 'undefined') {
            console.log('[Auth Guard] Initializing Firebase...');
            firebase.initializeApp(firebaseConfig);
        } else if (firebase.apps.length > 0) {
            console.log('[Auth Guard] Firebase already initialized, skipping...');
        }

        const auth = firebase.auth();

        // Show auth checking state
        setAuthChecking(true);

        // Set up auth state listener
        auth.onAuthStateChanged(async (user) => {
            console.log('[Auth Guard] Auth state changed:', user ? user.email : 'null');
            authInitialized = true;

            // Hide auth checking state
            setAuthChecking(false);

            if (user) {
                const isValid = await validateSession(user);
                if (isValid) {
                    handleAuthenticated(user);
                    startSessionMonitor();
                } else {
                    console.log('[Auth Guard] Session invalid, signing out...');
                    await auth.signOut();
                    handleNotAuthenticated();
                }
            } else {
                handleNotAuthenticated();
                stopSessionMonitor();
            }

            // Dispatch event for other components
            document.dispatchEvent(new CustomEvent('auth-state-changed', {
                detail: { user, authenticated: !!user }
            }));
        });

        // Set up UI elements
        setupLoginButton();
        setupLogoutButton();
        setupUserMenuDropdown();
        setupProtectedRouteIndicators();

        // Close dropdown when clicking outside
        document.addEventListener('click', handleDocumentClick);

        // Keyboard navigation support
        document.addEventListener('keydown', handleKeyboardNavigation);

        // Show content immediately
        showContent();
    }

    /**
     * Validate user session by checking token validity
     */
    async function validateSession(user) {
        if (!user) return false;

        try {
            const tokenResult = await user.getIdTokenResult(false);
            const expirationTime = new Date(tokenResult.expirationTime).getTime();
            const now = Date.now();

            if (expirationTime < now) {
                console.warn('[Auth Guard] Token expired, attempting refresh...');
                await user.getIdToken(true);
            }

            return true;
        } catch (error) {
            console.error('[Auth Guard] Session validation failed:', error);

            if (error.code === 'auth/user-token-expired' ||
                error.code === 'auth/user-disabled' ||
                error.code === 'auth/user-not-found') {
                return false;
            }

            if (error.code === 'auth/network-request-failed') {
                console.warn('[Auth Guard] Network error during validation, assuming valid');
                return true;
            }

            return false;
        }
    }

    /**
     * Start session monitoring for expiry notifications
     */
    function startSessionMonitor() {
        stopSessionMonitor();
        sessionCheckInterval = setInterval(async () => {
            if (currentUser) {
                const isValid = await validateSession(currentUser);
                if (!isValid) {
                    showSessionExpiryNotification();
                }
            }
        }, SESSION_CHECK_INTERVAL);
    }

    /**
     * Stop session monitoring
     */
    function stopSessionMonitor() {
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
            sessionCheckInterval = null;
        }
    }

    /**
     * Show session expiry notification with countdown
     */
    function showSessionExpiryNotification() {
        // Don't show multiple times
        if (sessionStorage.getItem(SESSION_WARNING_SHOWN)) return;
        sessionStorage.setItem(SESSION_WARNING_SHOWN, 'true');

        const notification = document.createElement('div');
        notification.className = 'auth-session-notification';
        notification.setAttribute('role', 'alertdialog');
        notification.setAttribute('aria-labelledby', 'session-expiry-title');
        notification.setAttribute('aria-describedby', 'session-expiry-desc');
        notification.innerHTML = `
            <div class="session-notification-content">
                <div class="session-notification-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                    </svg>
                </div>
                <div class="session-notification-text">
                    <h4 id="session-expiry-title">Session Expiring Soon</h4>
                    <p id="session-expiry-desc">Your session will expire in <strong id="session-countdown">5:00</strong>. Sign in again to continue using all features.</p>
                </div>
                <div class="session-notification-actions">
                    <button class="session-reauthenticate-btn" id="session-reauth-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                            <polyline points="10,17 15,12 10,7"/>
                            <line x1="15" y1="12" x2="3" y2="12"/>
                        </svg>
                        Sign In Again
                    </button>
                    <button class="session-dismiss-btn" id="session-dismiss-btn" aria-label="Dismiss notification">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Countdown timer (5 minutes)
        let timeRemaining = 300; // 5 minutes in seconds
        const countdownEl = notification.querySelector('#session-countdown');

        const countdownInterval = setInterval(() => {
            timeRemaining--;
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            if (countdownEl) {
                countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            if (timeRemaining <= 60) {
                notification.classList.add('session-urgent');
            }

            if (timeRemaining <= 0) {
                clearInterval(countdownInterval);
                // Auto sign out when countdown reaches zero
                handleLogout(true);
                notification.remove();
                sessionStorage.removeItem(SESSION_WARNING_SHOWN);
            }
        }, 1000);

        // Set up handlers
        const reauthBtn = notification.querySelector('#session-reauth-btn');
        const dismissBtn = notification.querySelector('#session-dismiss-btn');

        reauthBtn.addEventListener('click', () => {
            clearInterval(countdownInterval);
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
            sessionStorage.removeItem(SESSION_WARNING_SHOWN);
            handleLogin();
        });

        dismissBtn.addEventListener('click', () => {
            clearInterval(countdownInterval);
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
            sessionStorage.removeItem(SESSION_WARNING_SHOWN);
        });

        // Focus the re-auth button
        reauthBtn.focus();

        // Announce to screen readers
        announceToScreenReader('Session expiring soon. Please sign in again to continue.');
    }

    /**
     * Show main content
     */
    function showContent() {
        console.log('[Auth Guard] Showing content...');

        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.style.opacity = '1';
            mainContent.style.visibility = 'visible';
        }

        document.body.classList.remove('auth-loading');
    }

    /**
     * Handle authenticated user
     */
    function handleAuthenticated(user) {
        console.log('[Auth Guard] User authenticated:', user.email);

        isAuthenticated = true;
        currentUser = user;

        // Update body class with smooth transition
        document.body.classList.add('authenticated');
        document.body.classList.remove('not-authenticated');
        document.body.classList.add('auth-transitioning');
        setTimeout(() => {
            document.body.classList.remove('auth-transitioning');
        }, 300);

        // Hide auth overlay if visible
        hideLoginOverlay();

        // Show user info in header with dropdown
        updateUserDisplay(user);

        // Remember user for next visit
        try {
            localStorage.setItem(LAST_USER_KEY, hashEmail(user.email));
            localStorage.setItem(LAST_USER_DISPLAY_KEY, user.displayName || '');
        } catch (e) {
            // localStorage might be blocked
        }

        // Announce to screen readers
        announceToScreenReader('Signed in as ' + (user.displayName || user.email));

        // Dispatch auth-ready event
        document.dispatchEvent(new CustomEvent('auth-ready', {
            detail: { user, authenticated: true }
        }));
    }

    /**
     * Handle not authenticated
     */
    function handleNotAuthenticated() {
        console.log('[Auth Guard] User not authenticated');

        isAuthenticated = false;
        currentUser = null;

        // Update body class with smooth transition
        document.body.classList.add('not-authenticated');
        document.body.classList.remove('authenticated');
        document.body.classList.add('auth-transitioning');
        setTimeout(() => {
            document.body.classList.remove('auth-transitioning');
        }, 300);

        // Clear user display
        updateUserDisplay(null);

        // Close user menu if open
        closeUserMenu();

        // Dispatch auth-ready event
        document.dispatchEvent(new CustomEvent('auth-ready', {
            detail: { user: null, authenticated: false }
        }));
    }

    /**
     * Announce message to screen readers
     */
    function announceToScreenReader(message) {
        const announcer = document.createElement('div');
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.textContent = message;
        document.body.appendChild(announcer);
        setTimeout(() => announcer.remove(), 1000);
    }

    /**
     * Show login overlay
     */
    function showLoginOverlay(options = {}) {
        console.log('[Auth Guard] Showing login overlay...');

        let overlay = document.getElementById('auth-overlay');
        if (!overlay) {
            overlay = createLoginOverlay(options);
        }

        overlay.style.display = 'flex';
        overlay.classList.add('show');

        // Pre-fill last user email
        prefillLastUserEmail();

        // Focus management
        const loginBtn = overlay.querySelector('#google-login-btn');
        if (loginBtn) {
            setTimeout(() => loginBtn.focus(), 100);
        }

        // Trap focus in modal
        trapFocus(overlay);
    }

    /**
     * Hide login overlay
     */
    function hideLoginOverlay() {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Create login overlay HTML
     */
    function createLoginOverlay(options = {}) {
        const {
            showGuestOption = true,
            message = 'Sign in to access all features',
            protectedFeature = null
        } = options;

        const overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        overlay.className = 'auth-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'auth-title');
        overlay.innerHTML = `
            <div class="auth-card">
                <button class="auth-close-btn" id="auth-close-btn" aria-label="Close sign in dialog">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                <div class="auth-logo" aria-hidden="true">
                    <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="45" stroke="url(#auth-logo-gradient)" stroke-width="3" fill="none"/>
                        <ellipse cx="50" cy="50" rx="25" ry="35" stroke="url(#auth-logo-gradient)" stroke-width="2" fill="none"/>
                        <circle cx="50" cy="50" r="12" fill="url(#auth-logo-gradient)"/>
                        <circle cx="50" cy="50" r="5" fill="#0a0e27"/>
                        <defs>
                            <linearGradient id="auth-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#8b7fff"/>
                                <stop offset="50%" style="stop-color:#ff7eb6"/>
                                <stop offset="100%" style="stop-color:#ffd93d"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <h1 class="auth-title" id="auth-title">Eyes of Azrael</h1>
                <p class="auth-subtitle">${message}</p>

                ${protectedFeature ? `
                <div class="auth-protected-notice" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>${protectedFeature} requires sign in</span>
                </div>
                ` : ''}

                <div class="auth-benefits">
                    <div class="auth-benefit-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>Save your favorite entries</span>
                    </div>
                    <div class="auth-benefit-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>Share theories and insights</span>
                    </div>
                    <div class="auth-benefit-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                        <span>Access your personal dashboard</span>
                    </div>
                </div>

                <button id="google-login-btn" class="google-login-btn" aria-describedby="auth-security-note">
                    <svg class="google-icon" viewBox="0 0 48 48" width="20" height="20">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.30-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span class="google-btn-text">Sign in with Google</span>
                    <span class="google-btn-loading" aria-hidden="true">
                        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
                        </svg>
                        Signing in...
                    </span>
                </button>

                <p class="auth-security-note" id="auth-security-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Secure authentication via Google
                </p>

                <div class="auth-tos">
                    <p>By signing in, you agree to our <a href="#/terms">Terms of Service</a> and <a href="#/privacy">Privacy Policy</a></p>
                </div>

                ${showGuestOption ? `
                <button class="auth-skip-btn" id="auth-skip-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Continue as Guest
                </button>
                ` : ''}

                <div class="auth-error-message" id="auth-error-message" role="alert" aria-live="assertive" style="display: none;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span class="error-text"></span>
                    <button class="error-retry-btn" id="auth-retry-btn">Try Again</button>
                </div>
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
                hideLoginOverlay();
            });
        }

        const closeBtn = overlay.querySelector('#auth-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                hideLoginOverlay();
            });
        }

        const retryBtn = overlay.querySelector('#auth-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                hideAuthError();
                handleLogin();
            });
        }

        // Close on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideLoginOverlay();
            }
        });

        // Close on Escape key
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideLoginOverlay();
            }
        });

        return overlay;
    }

    /**
     * Trap focus within an element
     */
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        });
    }

    /**
     * Pre-fill last user info for convenience with remember me indicator
     */
    function prefillLastUserEmail() {
        try {
            const maskedEmail = localStorage.getItem(LAST_USER_KEY);
            const displayName = localStorage.getItem(LAST_USER_DISPLAY_KEY);

            if (!maskedEmail || maskedEmail.length < 5) {
                clearCachedUserData();
                return;
            }

            if (!maskedEmail.includes('@') || !maskedEmail.includes('***')) {
                console.log('[Auth Guard] Clearing old format cached email');
                clearCachedUserData();
                return;
            }

            const authCard = document.querySelector('.auth-card');
            if (authCard && !authCard.querySelector('.welcome-back-msg')) {
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'welcome-back-msg';

                const displayText = displayName
                    ? `Welcome back, ${displayName}!`
                    : `Welcome back! (${maskedEmail})`;

                welcomeMsg.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <p>${displayText}</p>
                `;

                // Add remember me indicator
                const rememberIndicator = document.createElement('div');
                rememberIndicator.className = 'remember-me-indicator';
                rememberIndicator.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                    <span>Your information is remembered</span>
                    <button class="remember-me-clear" id="clear-remembered-user" aria-label="Forget remembered user">
                        Clear
                    </button>
                `;

                const loginBtn = authCard.querySelector('.google-login-btn');
                if (loginBtn) {
                    authCard.insertBefore(welcomeMsg, loginBtn);
                    // Insert remember indicator after welcome message
                    welcomeMsg.appendChild(rememberIndicator);
                }

                // Handle clear button
                const clearBtn = rememberIndicator.querySelector('#clear-remembered-user');
                if (clearBtn) {
                    clearBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        clearCachedUserData();
                        welcomeMsg.remove();
                        showAuthToast('Remembered user cleared', 'success');
                    });
                }
            }
        } catch (e) {
            console.warn('[Auth Guard] Could not access localStorage:', e);
        }
    }

    /**
     * Set up login button handlers
     */
    function setupLoginButton() {
        const loginBtn = document.getElementById('google-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
        }

        const headerSignInBtn = document.getElementById('signInBtn');
        if (headerSignInBtn) {
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
            logoutBtn.replaceWith(logoutBtn.cloneNode(true));
            const newLogoutBtn = document.getElementById('signOutBtn');
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Auth Guard] Sign Out button clicked');
                handleLogout();
            });
        }
    }

    /**
     * Set up user menu dropdown
     */
    function setupUserMenuDropdown() {
        const userInfo = document.getElementById('userInfo');
        if (!userInfo) return;

        // Check if dropdown already exists
        if (userInfo.querySelector('.user-dropdown-menu')) return;

        // Create dropdown menu
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown-menu';
        dropdown.id = 'user-dropdown';
        dropdown.setAttribute('role', 'menu');
        dropdown.setAttribute('aria-label', 'User menu');
        dropdown.innerHTML = `
            <div class="user-dropdown-header" role="menuitem">
                <img id="dropdown-avatar" class="dropdown-avatar" src="" alt="">
                <div class="dropdown-user-details">
                    <span class="dropdown-user-name" id="dropdown-user-name"></span>
                    <span class="dropdown-user-email" id="dropdown-user-email"></span>
                </div>
            </div>
            <div class="user-dropdown-divider" role="separator"></div>
            <a href="#/dashboard" class="user-dropdown-item" role="menuitem" tabindex="0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                </svg>
                My Dashboard
            </a>
            <a href="#/favorites" class="user-dropdown-item" role="menuitem" tabindex="0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                My Favorites
            </a>
            <a href="#/settings" class="user-dropdown-item" role="menuitem" tabindex="0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Settings
            </a>
            <div class="user-dropdown-divider" role="separator"></div>
            <button class="user-dropdown-item user-dropdown-signout" id="dropdown-signout" role="menuitem" tabindex="0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
            </button>
        `;

        userInfo.appendChild(dropdown);

        // Make avatar and name clickable to toggle dropdown
        const userAvatar = userInfo.querySelector('#userAvatar');
        const userName = userInfo.querySelector('#userName');

        // Create wrapper for click target
        const clickTarget = document.createElement('button');
        clickTarget.className = 'user-menu-trigger';
        clickTarget.setAttribute('aria-haspopup', 'true');
        clickTarget.setAttribute('aria-expanded', 'false');
        clickTarget.setAttribute('aria-label', 'Open user menu');
        clickTarget.id = 'user-menu-trigger';

        // Move avatar and name into click target
        if (userAvatar) {
            const avatarClone = userAvatar.cloneNode(true);
            clickTarget.appendChild(avatarClone);
            userAvatar.style.display = 'none';
        }
        if (userName) {
            const nameClone = userName.cloneNode(true);
            nameClone.id = 'user-menu-name';
            clickTarget.appendChild(nameClone);
            userName.style.display = 'none';
        }

        // Add dropdown indicator
        const dropdownIndicator = document.createElement('span');
        dropdownIndicator.className = 'dropdown-indicator';
        dropdownIndicator.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"/>
            </svg>
        `;
        clickTarget.appendChild(dropdownIndicator);

        // Insert before dropdown
        userInfo.insertBefore(clickTarget, dropdown);

        // Remove old sign out button (we have one in dropdown)
        const oldSignOutBtn = userInfo.querySelector('#signOutBtn:not(.user-dropdown-signout)');
        if (oldSignOutBtn) {
            oldSignOutBtn.style.display = 'none';
        }

        // Toggle dropdown on click
        clickTarget.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleUserMenu();
        });

        // Sign out from dropdown
        const dropdownSignout = dropdown.querySelector('#dropdown-signout');
        if (dropdownSignout) {
            dropdownSignout.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeUserMenu();
                handleLogout();
            });
        }

        // Close dropdown when clicking menu items (except signout which we handle above)
        dropdown.querySelectorAll('.user-dropdown-item:not(#dropdown-signout)').forEach(item => {
            item.addEventListener('click', () => {
                closeUserMenu();
            });
        });
    }

    /**
     * Toggle user menu dropdown
     */
    function toggleUserMenu() {
        userMenuOpen = !userMenuOpen;
        const dropdown = document.getElementById('user-dropdown');
        const trigger = document.getElementById('user-menu-trigger');

        if (dropdown && trigger) {
            if (userMenuOpen) {
                dropdown.classList.add('show');
                trigger.setAttribute('aria-expanded', 'true');
                // Focus first menu item
                const firstItem = dropdown.querySelector('[role="menuitem"]');
                if (firstItem) firstItem.focus();
            } else {
                dropdown.classList.remove('show');
                trigger.setAttribute('aria-expanded', 'false');
            }
        }
    }

    /**
     * Close user menu dropdown
     */
    function closeUserMenu() {
        userMenuOpen = false;
        const dropdown = document.getElementById('user-dropdown');
        const trigger = document.getElementById('user-menu-trigger');

        if (dropdown) {
            dropdown.classList.remove('show');
        }
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Handle document click to close dropdown
     */
    function handleDocumentClick(e) {
        const userInfo = document.getElementById('userInfo');
        if (userInfo && !userInfo.contains(e.target)) {
            closeUserMenu();
        }
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeyboardNavigation(e) {
        if (!userMenuOpen) return;

        const dropdown = document.getElementById('user-dropdown');
        if (!dropdown) return;

        const items = dropdown.querySelectorAll('[role="menuitem"]');
        const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);

        switch (e.key) {
            case 'Escape':
                closeUserMenu();
                const trigger = document.getElementById('user-menu-trigger');
                if (trigger) trigger.focus();
                break;
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                items[nextIndex].focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                items[prevIndex].focus();
                break;
            case 'Home':
                e.preventDefault();
                items[0].focus();
                break;
            case 'End':
                e.preventDefault();
                items[items.length - 1].focus();
                break;
        }
    }

    /**
     * Set up protected route indicators
     */
    function setupProtectedRouteIndicators() {
        // Add lock icons to protected features
        document.querySelectorAll('[data-protected]').forEach(element => {
            if (element.querySelector('.protected-lock-icon')) return;

            const lockIcon = document.createElement('span');
            lockIcon.className = 'protected-lock-icon';
            lockIcon.setAttribute('aria-hidden', 'true');
            lockIcon.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
            `;

            // Add tooltip
            element.setAttribute('title', 'Sign in to access this feature');
            element.setAttribute('aria-describedby', 'protected-feature-desc');

            element.appendChild(lockIcon);

            // Show login overlay on click if not authenticated
            element.addEventListener('click', (e) => {
                if (!isAuthenticated) {
                    e.preventDefault();
                    e.stopPropagation();
                    showLoginOverlay({
                        protectedFeature: element.getAttribute('data-protected') || 'This feature'
                    });
                }
            });
        });

        // Add hidden description for screen readers
        if (!document.getElementById('protected-feature-desc')) {
            const desc = document.createElement('div');
            desc.id = 'protected-feature-desc';
            desc.className = 'sr-only';
            desc.textContent = 'This feature requires you to sign in.';
            document.body.appendChild(desc);
        }
    }

    /**
     * Google login button HTML
     */
    const GOOGLE_LOGIN_BTN_HTML = `
        <svg class="google-icon" viewBox="0 0 48 48" width="20" height="20">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.30-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        <span class="google-btn-text">Sign in with Google</span>
        <span class="google-btn-loading" aria-hidden="true">
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
            Signing in...
        </span>
    `;

    /**
     * Reset login button to default state
     */
    function resetLoginButton(btn) {
        const loginBtn = btn || document.getElementById('google-login-btn');

        if (!loginBtn) {
            console.warn('[Auth Guard] Login button not found in DOM, cannot reset');
            return;
        }

        try {
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            loginBtn.innerHTML = GOOGLE_LOGIN_BTN_HTML;
        } catch (e) {
            console.error('[Auth Guard] Error resetting login button:', e);
        }
    }

    /**
     * Set login button to loading state
     */
    function setLoginButtonLoading(btn, loading) {
        const loginBtn = btn || document.getElementById('google-login-btn');
        if (!loginBtn) return;

        if (loading) {
            loginBtn.disabled = true;
            loginBtn.classList.add('loading');
        } else {
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
        }
    }

    /**
     * Handle login button click
     */
    async function handleLogin() {
        console.log('[Auth Guard] Login button clicked');

        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error('[Auth Guard] Firebase not available for login');
            showAuthError('Authentication service unavailable. Please refresh the page.');
            return;
        }

        const auth = firebase.auth();
        if (auth.currentUser) {
            console.log('[Auth Guard] User already logged in:', auth.currentUser.email);
            return;
        }

        const loginBtn = document.getElementById('google-login-btn');
        const headerSignInBtn = document.getElementById('signInBtn');

        // Set loading states
        setLoginButtonLoading(loginBtn, true);
        if (headerSignInBtn) {
            headerSignInBtn.disabled = true;
            headerSignInBtn.classList.add('loading');
        }

        // Hide any previous errors
        hideAuthError();

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            const result = await auth.signInWithPopup(provider);
            console.log('[Auth Guard] Login successful:', result.user.email);

            // Success toast
            showAuthSuccess('Signed in successfully!');
        } catch (error) {
            console.error('[Auth Guard] Login error:', error);

            if (error.code === 'auth/popup-closed-by-user') {
                console.log('[Auth Guard] User closed popup');
            } else if (error.code === 'auth/popup-blocked') {
                showAuthError('Popup was blocked. Please allow popups for this site and try again.', true);
            } else if (error.code === 'auth/cancelled-popup-request') {
                console.log('[Auth Guard] Popup request cancelled');
            } else if (error.code === 'auth/network-request-failed') {
                showAuthError('Network error. Please check your connection and try again.', true);
            } else if (error.code === 'auth/too-many-requests') {
                showAuthError('Too many attempts. Please wait a moment and try again.', true);
            } else {
                showAuthError('Sign in failed. Please try again.', true);
            }

            // Reset buttons
            resetLoginButton(loginBtn);
            resetHeaderSignInButton(headerSignInBtn);
        }
    }

    /**
     * Get user-friendly error message
     */
    function getAuthErrorMessage(error) {
        const errorMessages = {
            'auth/popup-closed-by-user': 'Sign in was cancelled. Click to try again.',
            'auth/popup-blocked': 'Pop-up blocked by your browser. Please allow pop-ups and try again.',
            'auth/cancelled-popup-request': 'Sign in was cancelled.',
            'auth/network-request-failed': 'Network connection lost. Please check your internet and try again.',
            'auth/too-many-requests': 'Too many sign in attempts. Please wait a moment before trying again.',
            'auth/user-disabled': 'This account has been disabled. Please contact support.',
            'auth/user-not-found': 'No account found. Please sign up first.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Invalid email address. Please check and try again.',
            'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
            'auth/weak-password': 'Password is too weak. Please use a stronger password.',
            'auth/operation-not-allowed': 'This sign in method is not enabled. Please contact support.',
            'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign in method.',
            'auth/requires-recent-login': 'Please sign in again to complete this action.',
            'auth/credential-already-in-use': 'This credential is already associated with another account.'
        };

        return errorMessages[error.code] || error.message || 'An unexpected error occurred. Please try again.';
    }

    /**
     * Show auth error in the overlay
     */
    function showAuthError(message, showRetry = false) {
        const errorDiv = document.getElementById('auth-error-message');
        if (errorDiv) {
            errorDiv.style.display = 'flex';
            const errorText = errorDiv.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            }
            const retryBtn = errorDiv.querySelector('#auth-retry-btn');
            if (retryBtn) {
                retryBtn.style.display = showRetry ? 'inline-flex' : 'none';
            }

            // Add shake animation
            errorDiv.classList.remove('auth-shake');
            void errorDiv.offsetWidth; // Trigger reflow
            errorDiv.classList.add('auth-shake');

            // Announce to screen readers
            announceToScreenReader('Error: ' + message);
        } else {
            // Fallback to polished toast notification
            showAuthToast(message, 'error');
        }
    }

    /**
     * Show polished toast notification for auth events
     */
    function showAuthToast(message, type = 'info') {
        // Try to use existing toast system first
        if (window.ToastNotifications && typeof window.ToastNotifications.show === 'function') {
            window.ToastNotifications.show(message, type);
            return;
        }

        // Create inline toast if toast system not available
        const existingToast = document.querySelector('.auth-inline-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `auth-inline-toast auth-toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        const iconSvg = type === 'error'
            ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
            : type === 'success'
            ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>';

        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${iconSvg}
            </svg>
            <span>${message}</span>
            <button class="auth-toast-close" aria-label="Dismiss">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto dismiss after 5 seconds
        const autoDismiss = setTimeout(() => {
            dismissToast(toast);
        }, 5000);

        // Close on click
        toast.querySelector('.auth-toast-close').addEventListener('click', () => {
            clearTimeout(autoDismiss);
            dismissToast(toast);
        });
    }

    /**
     * Dismiss toast notification
     */
    function dismissToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }

    /**
     * Hide auth error
     */
    function hideAuthError() {
        const errorDiv = document.getElementById('auth-error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    /**
     * Show auth success message
     */
    function showAuthSuccess(message) {
        if (window.ToastNotifications && typeof window.ToastNotifications.show === 'function') {
            window.ToastNotifications.show(message, 'success');
        }
    }

    /**
     * Reset header sign-in button to default state
     */
    function resetHeaderSignInButton(btn) {
        const signInBtn = btn || document.getElementById('signInBtn');
        if (!signInBtn) return;

        try {
            signInBtn.disabled = false;
            signInBtn.classList.remove('loading');
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
     * Create and show sign-out confirmation dialog
     */
    function showSignOutConfirmDialog() {
        return new Promise((resolve) => {
            // Remove existing dialog if present
            const existing = document.getElementById('signout-confirm-overlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'signout-confirm-overlay';
            overlay.className = 'signout-confirm-overlay';
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'signout-confirm-title');
            overlay.innerHTML = `
                <div class="signout-confirm-dialog">
                    <div class="signout-confirm-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16,17 21,12 16,7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </div>
                    <h3 class="signout-confirm-title" id="signout-confirm-title">Sign Out?</h3>
                    <p class="signout-confirm-message">
                        Are you sure you want to sign out? You will need to sign in again to access your dashboard and favorites.
                    </p>
                    <div class="signout-confirm-actions">
                        <button class="signout-confirm-cancel" id="signout-cancel-btn">Cancel</button>
                        <button class="signout-confirm-btn" id="signout-confirm-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16,17 21,12 16,7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Animate in
            requestAnimationFrame(() => {
                overlay.classList.add('show');
            });

            const cancelBtn = overlay.querySelector('#signout-cancel-btn');
            const confirmBtn = overlay.querySelector('#signout-confirm-btn');

            const cleanup = () => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            confirmBtn.addEventListener('click', () => {
                resolve(true);
            });

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            });

            // Close on Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleEscape);
                    cleanup();
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Focus confirm button
            confirmBtn.focus();
        });
    }

    /**
     * Handle logout button click
     */
    async function handleLogout(skipConfirmation = false) {
        console.log('[Auth Guard] Logout button clicked');

        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error('[Auth Guard] Firebase not available for logout');
            showAuthError('Unable to sign out. Please refresh the page.');
            return;
        }

        // Show polished confirmation dialog unless skipped
        if (!skipConfirmation) {
            const confirmed = await showSignOutConfirmDialog();
            if (!confirmed) {
                console.log('[Auth Guard] Logout cancelled by user');
                return;
            }
        }

        // Add signing out state to body
        document.body.classList.add('auth-signing-out');

        const signOutBtn = document.getElementById('signOutBtn');
        const dropdownSignout = document.getElementById('dropdown-signout');
        const confirmBtn = document.querySelector('#signout-confirm-btn');

        // Update button states
        if (signOutBtn) {
            signOutBtn.disabled = true;
            signOutBtn.textContent = 'Signing out...';
        }
        if (dropdownSignout) {
            dropdownSignout.disabled = true;
            dropdownSignout.innerHTML = `
                <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
                </svg>
                Signing out...
            `;
        }
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
                <svg class="spinner" viewBox="0 0 24 24" width="18" height="18">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
                </svg>
                Signing out...
            `;
        }

        try {
            await firebase.auth().signOut();
            console.log('[Auth Guard] Logout successful');

            clearCachedUserData();

            // Close confirmation dialog
            const confirmOverlay = document.getElementById('signout-confirm-overlay');
            if (confirmOverlay) {
                confirmOverlay.classList.remove('show');
                setTimeout(() => confirmOverlay.remove(), 300);
            }

            if (window.ToastNotifications && typeof window.ToastNotifications.show === 'function') {
                window.ToastNotifications.show('Signed out successfully', 'success');
            }

            announceToScreenReader('Signed out successfully');
        } catch (error) {
            console.error('[Auth Guard] Logout error:', error);

            if (signOutBtn) {
                signOutBtn.disabled = false;
                signOutBtn.textContent = 'Sign Out';
            }

            if (error.code === 'auth/network-request-failed') {
                showAuthError('Network error. Please check your connection and try again.');
            } else {
                showAuthError('Sign out failed: ' + (error.message || 'Unknown error'));
            }
        } finally {
            document.body.classList.remove('auth-signing-out');
        }
    }

    /**
     * Clear cached user data from localStorage
     */
    function clearCachedUserData() {
        try {
            localStorage.removeItem(LAST_USER_KEY);
            localStorage.removeItem(LAST_USER_DISPLAY_KEY);
            localStorage.removeItem('eoa_last_user_email');
            sessionStorage.removeItem(SESSION_WARNING_SHOWN);
        } catch (e) {
            // localStorage might be blocked
        }
    }

    /**
     * Default avatar SVG as data URI
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
     */
    function updateUserDisplay(user) {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const signInBtn = document.getElementById('signInBtn');

        // Also update dropdown elements
        const dropdownAvatar = document.getElementById('dropdown-avatar');
        const dropdownName = document.getElementById('dropdown-user-name');
        const dropdownEmail = document.getElementById('dropdown-user-email');
        const menuName = document.getElementById('user-menu-name');
        const menuAvatar = document.querySelector('.user-menu-trigger img');

        if (user) {
            // User is logged in
            if (userInfo) {
                userInfo.style.display = 'flex';
            }
            if (userName) {
                userName.textContent = user.displayName || user.email || 'User';
            }
            if (userAvatar) {
                userAvatar.src = user.photoURL || DEFAULT_AVATAR;
                userAvatar.alt = user.displayName || 'User profile';
                userAvatar.onerror = function() {
                    this.onerror = null;
                    this.src = DEFAULT_AVATAR;
                };
            }
            if (signInBtn) {
                signInBtn.style.display = 'none';
            }

            // Update dropdown
            if (dropdownAvatar) {
                dropdownAvatar.src = user.photoURL || DEFAULT_AVATAR;
                dropdownAvatar.alt = user.displayName || 'User profile';
            }
            if (dropdownName) {
                dropdownName.textContent = user.displayName || 'User';
            }
            if (dropdownEmail) {
                dropdownEmail.textContent = user.email || '';
            }

            // Update menu trigger
            if (menuName) {
                menuName.textContent = user.displayName || user.email || 'User';
            }
            if (menuAvatar) {
                menuAvatar.src = user.photoURL || DEFAULT_AVATAR;
                menuAvatar.alt = user.displayName || 'User profile';
            }
        } else {
            // User is logged out
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
     * Check if a route is protected
     */
    function isProtectedRoute(path) {
        const protectedRoutes = [
            '/dashboard',
            '/favorites',
            '/settings',
            '/my-theories',
            '/profile'
        ];
        return protectedRoutes.some(route => path.startsWith(route));
    }

    /**
     * Require authentication for current action
     */
    function requireAuth(options = {}) {
        if (isAuthenticated) {
            return Promise.resolve(currentUser);
        }

        return new Promise((resolve, reject) => {
            showLoginOverlay(options);

            const handleAuthChange = (e) => {
                if (e.detail.authenticated) {
                    document.removeEventListener('auth-state-changed', handleAuthChange);
                    resolve(e.detail.user);
                }
            };

            document.addEventListener('auth-state-changed', handleAuthChange);

            // Also listen for overlay close (rejection)
            const overlay = document.getElementById('auth-overlay');
            if (overlay) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'style' &&
                            overlay.style.display === 'none' &&
                            !isAuthenticated) {
                            observer.disconnect();
                            document.removeEventListener('auth-state-changed', handleAuthChange);
                            reject(new Error('Authentication cancelled'));
                        }
                    });
                });
                observer.observe(overlay, { attributes: true });
            }
        });
    }

    /**
     * Public API
     */
    window.AuthGuard = {
        isAuthenticated: () => isAuthenticated,
        getCurrentUser: () => currentUser,
        showLoginOverlay: showLoginOverlay,
        hideLoginOverlay: hideLoginOverlay,
        isReady: () => authInitialized,
        login: handleLogin,
        logout: (skipConfirmation = false) => handleLogout(skipConfirmation),
        validateSession: () => currentUser ? validateSession(currentUser) : Promise.resolve(false),
        clearCache: clearCachedUserData,
        reinitButtons: () => {
            setupLoginButton();
            setupLogoutButton();
            setupUserMenuDropdown();
        },
        requireAuth: requireAuth,
        isProtectedRoute: isProtectedRoute,
        setupProtectedRouteIndicators: setupProtectedRouteIndicators
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[Auth Guard] Module loaded');
})();
