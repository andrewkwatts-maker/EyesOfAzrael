/**
 * User Authentication System
 * Handles login, signup, logout, and session management
 * Uses localStorage for client-side persistence (upgrade to backend later)
 */

class UserAuth {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
    }

    /**
     * Initialize authentication system
     */
    init() {
        // Check if user is already logged in
        const sessionUser = localStorage.getItem('currentUser');
        if (sessionUser) {
            this.currentUser = JSON.parse(sessionUser);
            this.updateUIForLoggedInUser();
        }

        // Listen for storage events (multi-tab synchronization)
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser') {
                if (e.newValue) {
                    this.currentUser = JSON.parse(e.newValue);
                    this.updateUIForLoggedInUser();
                } else {
                    this.currentUser = null;
                    this.updateUIForLoggedOutUser();
                }
            }
        });
    }

    /**
     * Load users from localStorage
     */
    loadUsers() {
        const usersJSON = localStorage.getItem('users');
        return usersJSON ? JSON.parse(usersJSON) : {};
    }

    /**
     * Save users to localStorage
     */
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    /**
     * Create new user account
     */
    signup(username, email, password) {
        // Validation
        if (!username || username.length < 3) {
            return { success: false, error: 'Username must be at least 3 characters' };
        }

        if (!this.validateEmail(email)) {
            return { success: false, error: 'Please enter a valid email address' };
        }

        if (!password || password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        // Check if user already exists
        if (this.users[username]) {
            return { success: false, error: 'Username already taken' };
        }

        // Check if email already registered
        if (Object.values(this.users).some(user => user.email === email)) {
            return { success: false, error: 'Email already registered' };
        }

        // Create new user
        this.users[username] = {
            username,
            email,
            password: this.hashPassword(password), // Simple hash (upgrade to bcrypt later)
            createdAt: new Date().toISOString(),
            theories: [],
            votes: {},
            bio: '',
            avatar: this.generateAvatar(username)
        };

        this.saveUsers();

        return { success: true, message: 'Account created successfully!' };
    }

    /**
     * Log in user
     */
    login(username, password) {
        const user = this.users[username];

        if (!user) {
            return { success: false, error: 'Invalid username or password' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, error: 'Invalid username or password' };
        }

        // Set current user (exclude password from session)
        this.currentUser = {
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            bio: user.bio,
            avatar: user.avatar
        };

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.updateUIForLoggedInUser();

        return { success: true, message: 'Logged in successfully!' };
    }

    /**
     * Log out user
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUIForLoggedOutUser();

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('userLogout'));
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Update user profile
     */
    updateProfile(bio, avatar) {
        if (!this.isLoggedIn()) {
            return { success: false, error: 'Not logged in' };
        }

        const user = this.users[this.currentUser.username];
        if (bio !== undefined) user.bio = bio;
        if (avatar !== undefined) user.avatar = avatar;

        this.saveUsers();

        // Update current session
        this.currentUser.bio = user.bio;
        this.currentUser.avatar = user.avatar;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        return { success: true, message: 'Profile updated!' };
    }

    /**
     * Simple email validation
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Simple password hashing (replace with proper hashing in production)
     */
    hashPassword(password) {
        // This is NOT secure - just for demonstration
        // In production, use bcrypt or similar server-side
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    /**
     * Generate avatar URL based on username
     */
    generateAvatar(username) {
        // Using DiceBear avatars API
        return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`;
    }

    /**
     * Update UI for logged in user
     */
    updateUIForLoggedInUser() {
        // Show/hide auth buttons
        document.querySelectorAll('[data-auth-show="loggedOut"]').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('[data-auth-show="loggedIn"]').forEach(el => {
            el.style.display = '';
        });

        // Update user display elements
        document.querySelectorAll('[data-auth-username]').forEach(el => {
            el.textContent = this.currentUser.username;
        });
        document.querySelectorAll('[data-auth-avatar]').forEach(el => {
            el.src = this.currentUser.avatar;
        });

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('userLogin', { detail: this.currentUser }));
    }

    /**
     * Update UI for logged out user
     */
    updateUIForLoggedOutUser() {
        // Show/hide auth buttons
        document.querySelectorAll('[data-auth-show="loggedIn"]').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('[data-auth-show="loggedOut"]').forEach(el => {
            el.style.display = '';
        });

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('userLogout'));
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.switchAuthMode('login');
        }
    }

    /**
     * Show signup modal
     */
    showSignupModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.switchAuthMode('signup');
        }
    }

    /**
     * Hide auth modal
     */
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
            this.clearAuthForms();
        }
    }

    /**
     * Switch between login and signup modes
     */
    switchAuthMode(mode) {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const modalTitle = document.getElementById('auth-modal-title');

        if (mode === 'login') {
            if (loginForm) loginForm.style.display = 'block';
            if (signupForm) signupForm.style.display = 'none';
            if (modalTitle) modalTitle.textContent = 'Login to Your Account';
        } else {
            if (loginForm) loginForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'block';
            if (modalTitle) modalTitle.textContent = 'Create New Account';
        }
    }

    /**
     * Clear auth forms
     */
    clearAuthForms() {
        document.querySelectorAll('#login-form input, #signup-form input').forEach(input => {
            input.value = '';
        });
        this.clearAuthMessages();
    }

    /**
     * Show auth message
     */
    showAuthMessage(message, type = 'error') {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `auth-message auth-message-${type}`;
            messageEl.style.display = 'block';
        }
    }

    /**
     * Clear auth messages
     */
    clearAuthMessages() {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.style.display = 'none';
        }
    }
}

// Create global instance
window.userAuth = new UserAuth();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserAuth;
}
