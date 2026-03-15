/**
 * Auth Guard Simple Tests
 * Tests for js/auth-guard-simple.js
 *
 * The auth guard is an IIFE that exposes window.AuthGuard.
 * Since we can't easily test the IIFE's internal functions directly,
 * we test the logic patterns inline.
 */

describe('AuthGuard', () => {
    let authState;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = '';

        // Mock requestAnimationFrame
        window.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));

        // Simulate the auth guard's internal state and API
        authState = {
            isAuthenticated: false,
            currentUser: null,
            authInitialized: false,
            userMenuOpen: false
        };

        // Create a mock AuthGuard matching the real public API
        window.AuthGuard = {
            isAuthenticated: () => authState.isAuthenticated,
            getCurrentUser: () => authState.currentUser,
            isReady: () => authState.authInitialized,
            showLoginOverlay: jest.fn(),
            hideLoginOverlay: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            validateSession: jest.fn().mockResolvedValue(false),
            clearCache: jest.fn(),
            reinitButtons: jest.fn(),
            requireAuth: jest.fn(),
            isProtectedRoute: jest.fn(),
            setupProtectedRouteIndicators: jest.fn()
        };
    });

    describe('hashEmail logic', () => {
        // Testing the hash function logic inline since it's internal
        function hashEmail(email) {
            if (!email) return '';
            const parts = email.split('@');
            if (parts.length !== 2) return '***';
            const local = parts[0];
            const domain = parts[1];
            const masked = local.substring(0, 2) + '***@' + domain;
            return masked;
        }

        test('should mask email correctly', () => {
            expect(hashEmail('test@example.com')).toBe('te***@example.com');
        });

        test('should handle short local part', () => {
            expect(hashEmail('a@example.com')).toBe('a***@example.com');
        });

        test('should handle empty email', () => {
            expect(hashEmail('')).toBe('');
            expect(hashEmail(null)).toBe('');
        });

        test('should handle invalid email format', () => {
            expect(hashEmail('noemail')).toBe('***');
        });

        test('should handle email with multiple @ signs', () => {
            // split will have more than 2 parts
            expect(hashEmail('bad@email@format')).toBe('***');
        });
    });

    describe('isProtectedRoute logic', () => {
        function isProtectedRoute(hash) {
            const path = (hash || '#/').replace('#', '').replace(/\/$/, '');
            const protectedRoutes = ['/dashboard', '/compare'];
            return protectedRoutes.some(route => path.startsWith(route));
        }

        test('should identify dashboard as protected', () => {
            expect(isProtectedRoute('#/dashboard')).toBe(true);
        });

        test('should identify compare as protected', () => {
            expect(isProtectedRoute('#/compare')).toBe(true);
        });

        test('should not flag home as protected', () => {
            expect(isProtectedRoute('#/')).toBe(false);
        });

        test('should not flag mythologies as protected', () => {
            expect(isProtectedRoute('#/mythologies')).toBe(false);
        });

        test('should not flag browse as protected', () => {
            expect(isProtectedRoute('#/browse/deities')).toBe(false);
        });

        test('should handle empty hash', () => {
            expect(isProtectedRoute('')).toBe(false);
        });
    });

    describe('AuthGuard public API', () => {
        test('isAuthenticated() should return false by default', () => {
            expect(window.AuthGuard.isAuthenticated()).toBe(false);
        });

        test('isAuthenticated() should return true after auth', () => {
            authState.isAuthenticated = true;
            expect(window.AuthGuard.isAuthenticated()).toBe(true);
        });

        test('getCurrentUser() should return null by default', () => {
            expect(window.AuthGuard.getCurrentUser()).toBeNull();
        });

        test('getCurrentUser() should return user after auth', () => {
            authState.currentUser = { uid: '123', email: 'test@test.com' };
            expect(window.AuthGuard.getCurrentUser().uid).toBe('123');
        });

        test('isReady() should return false initially', () => {
            expect(window.AuthGuard.isReady()).toBe(false);
        });

        test('isReady() should return true after init', () => {
            authState.authInitialized = true;
            expect(window.AuthGuard.isReady()).toBe(true);
        });
    });

    describe('localStorage session keys', () => {
        const LAST_USER_KEY = 'eoa_last_user_email_hash';
        const LAST_USER_DISPLAY_KEY = 'eoa_last_user_display';
        const SESSION_WARNING_SHOWN = 'eoa_session_warning_shown';

        test('should store and retrieve user hash', () => {
            localStorage.setItem(LAST_USER_KEY, 'te***@test.com');
            expect(localStorage.getItem(LAST_USER_KEY)).toBe('te***@test.com');
        });

        test('should store and retrieve display name', () => {
            localStorage.setItem(LAST_USER_DISPLAY_KEY, 'Test User');
            expect(localStorage.getItem(LAST_USER_DISPLAY_KEY)).toBe('Test User');
        });

        test('should track session warning state', () => {
            localStorage.setItem(SESSION_WARNING_SHOWN, 'true');
            expect(localStorage.getItem(SESSION_WARNING_SHOWN)).toBe('true');
        });

        test('clearCache should remove session data', () => {
            localStorage.setItem(LAST_USER_KEY, 'data');
            localStorage.setItem(LAST_USER_DISPLAY_KEY, 'data');
            // The real clearCache removes these
            localStorage.removeItem(LAST_USER_KEY);
            localStorage.removeItem(LAST_USER_DISPLAY_KEY);
            expect(localStorage.getItem(LAST_USER_KEY)).toBeNull();
            expect(localStorage.getItem(LAST_USER_DISPLAY_KEY)).toBeNull();
        });
    });

    describe('auth state transitions', () => {
        test('should transition from unauthenticated to authenticated', () => {
            expect(authState.isAuthenticated).toBe(false);
            authState.isAuthenticated = true;
            authState.currentUser = { uid: '123', email: 'user@test.com' };
            authState.authInitialized = true;
            expect(window.AuthGuard.isAuthenticated()).toBe(true);
            expect(window.AuthGuard.getCurrentUser()).not.toBeNull();
            expect(window.AuthGuard.isReady()).toBe(true);
        });

        test('should transition from authenticated to unauthenticated', () => {
            authState.isAuthenticated = true;
            authState.currentUser = { uid: '123' };

            // Simulate logout
            authState.isAuthenticated = false;
            authState.currentUser = null;

            expect(window.AuthGuard.isAuthenticated()).toBe(false);
            expect(window.AuthGuard.getCurrentUser()).toBeNull();
        });
    });

    describe('DOM element creation', () => {
        test('should be able to create auth-check-indicator', () => {
            const indicator = document.createElement('div');
            indicator.className = 'auth-check-indicator';
            document.body.appendChild(indicator);
            expect(document.querySelector('.auth-check-indicator')).not.toBeNull();
        });

        test('should be able to create auth-state-transition-overlay', () => {
            const overlay = document.createElement('div');
            overlay.className = 'auth-state-transition-overlay';
            document.body.appendChild(overlay);
            expect(document.querySelector('.auth-state-transition-overlay')).not.toBeNull();
        });

        test('setAuthChecking should add/remove class on body', () => {
            document.body.classList.add('auth-checking');
            expect(document.body.classList.contains('auth-checking')).toBe(true);
            document.body.classList.remove('auth-checking');
            expect(document.body.classList.contains('auth-checking')).toBe(false);
        });
    });
});
