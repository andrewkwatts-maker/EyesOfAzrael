/**
 * Firebase Authentication System
 * Handles Google OAuth authentication and user profile management
 * Replaces localStorage-based auth with cloud-based Firebase Auth
 */

class FirebaseAuth {
    constructor() {
        this.currentUser = null;
        this.auth = null;
        this.db = null;
        this.unsubscribeAuth = null;
        this.authStateChangeCallbacks = [];
    }

    /**
     * Initialize Firebase authentication
     * Must be called after Firebase is initialized
     */
    async init() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded. Please include Firebase scripts before firebase-auth.js');
            return;
        }

        try {
            this.auth = firebase.auth();
            this.db = firebase.firestore();

            // Set persistence to LOCAL (survives browser restarts)
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

            // Listen for auth state changes
            this.unsubscribeAuth = this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    // User is signed in
                    await this.handleUserSignedIn(user);
                } else {
                    // User is signed out
                    this.handleUserSignedOut();
                }
            });

            console.log('Firebase Auth initialized');
        } catch (error) {
            console.error('Error initializing Firebase Auth:', error);
        }
    }

    /**
     * Handle user signed in
     */
    async handleUserSignedIn(firebaseUser) {
        try {
            // Create user profile object
            this.currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified
            };

            // Create or update user profile in Firestore
            await this.createOrUpdateUserProfile(firebaseUser);

            // Update UI
            this.updateUIForLoggedInUser();

            // Notify callbacks
            this.notifyAuthStateChange(this.currentUser);

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('userLogin', { detail: this.currentUser }));

            console.log('User signed in:', this.currentUser.displayName);
        } catch (error) {
            console.error('Error handling user sign in:', error);
        }
    }

    /**
     * Handle user signed out
     */
    handleUserSignedOut() {
        this.currentUser = null;
        this.updateUIForLoggedOutUser();
        this.notifyAuthStateChange(null);
        window.dispatchEvent(new CustomEvent('userLogout'));
        console.log('User signed out');
    }

    /**
     * Create or update user profile in Firestore
     */
    async createOrUpdateUserProfile(firebaseUser) {
        try {
            const userRef = this.db.collection('users').doc(firebaseUser.uid);
            const userDoc = await userRef.get();

            const profileData = {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (!userDoc.exists) {
                // New user - create profile
                profileData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                profileData.bio = '';
                profileData.theories = [];
                profileData.votes = {};

                await userRef.set(profileData);
                console.log('Created new user profile for:', firebaseUser.displayName);
            } else {
                // Existing user - update profile
                await userRef.update(profileData);
                console.log('Updated user profile for:', firebaseUser.displayName);
            }
        } catch (error) {
            console.error('Error creating/updating user profile:', error);
            throw error;
        }
    }

    /**
     * Sign in with Google popup
     */
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();

            // Request additional scopes if needed
            provider.addScope('profile');
            provider.addScope('email');

            // Optional: Add Gemini API scope for AI SVG generation
            // Note: This may require additional Google Cloud project configuration
            // The Firebase ID token should work for Gemini API calls even without this scope
            // provider.addScope('https://www.googleapis.com/auth/generative-language.retriever');

            // Sign in with popup
            const result = await this.auth.signInWithPopup(provider);

            return { success: true, user: result.user };
        } catch (error) {
            console.error('Google sign-in error:', error);

            // Handle specific error cases
            let errorMessage = 'Failed to sign in with Google';

            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in cancelled. Please try again.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Pop-up blocked. Please allow pop-ups for this site.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Sign-in cancelled.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            return { success: false, error: errorMessage };
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true, message: 'Signed out successfully' };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: 'Failed to sign out' };
        }
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
     * Get user profile from Firestore
     */
    async getUserProfile(uid) {
        try {
            const userDoc = await this.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        if (!this.isLoggedIn()) {
            return { success: false, error: 'Not logged in' };
        }

        try {
            const userRef = this.db.collection('users').doc(this.currentUser.uid);

            // Only allow updating certain fields
            const allowedUpdates = {};
            if ('bio' in updates) allowedUpdates.bio = updates.bio;
            if ('displayName' in updates) allowedUpdates.displayName = updates.displayName;

            allowedUpdates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

            await userRef.update(allowedUpdates);

            // Update current user object
            if ('displayName' in allowedUpdates) {
                this.currentUser.displayName = allowedUpdates.displayName;
            }

            return { success: true, message: 'Profile updated successfully' };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: 'Failed to update profile' };
        }
    }

    /**
     * Register callback for auth state changes
     */
    onAuthStateChanged(callback) {
        this.authStateChangeCallbacks.push(callback);

        // If already logged in, call callback immediately
        if (this.currentUser) {
            callback(this.currentUser);
        }

        // Return unsubscribe function
        return () => {
            const index = this.authStateChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.authStateChangeCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Notify all callbacks of auth state change
     */
    notifyAuthStateChange(user) {
        this.authStateChangeCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Error in auth state change callback:', error);
            }
        });
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
            el.textContent = this.currentUser.displayName || this.currentUser.email;
        });
        document.querySelectorAll('[data-auth-avatar]').forEach(el => {
            el.src = this.currentUser.photoURL || this.generateAvatar(this.currentUser.email);
        });
        document.querySelectorAll('[data-auth-email]').forEach(el => {
            el.textContent = this.currentUser.email;
        });
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
    }

    /**
     * Generate avatar URL as fallback
     */
    generateAvatar(email) {
        return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`;
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * Hide auth modal
     */
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
            this.clearAuthMessages();
        }
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

    /**
     * Cleanup on destroy
     */
    destroy() {
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
        }
        this.authStateChangeCallbacks = [];
    }
}

// Create global instance (will be initialized after Firebase config loads)
window.firebaseAuth = new FirebaseAuth();

// For backward compatibility with old user-auth.js API
// This allows existing code to work without changes
window.userAuth = {
    isLoggedIn: () => window.firebaseAuth.isLoggedIn(),
    getCurrentUser: () => window.firebaseAuth.getCurrentUser(),
    login: () => window.firebaseAuth.signInWithGoogle(),
    logout: () => window.firebaseAuth.signOut(),
    showLoginModal: () => window.firebaseAuth.showLoginModal(),
    showSignupModal: () => window.firebaseAuth.showLoginModal(), // Same as login now
    hideAuthModal: () => window.firebaseAuth.hideAuthModal(),
    showAuthMessage: (msg, type) => window.firebaseAuth.showAuthMessage(msg, type),
    clearAuthMessages: () => window.firebaseAuth.clearAuthMessages(),
    updateProfile: (bio, avatar) => window.firebaseAuth.updateProfile({ bio }),
    switchAuthMode: () => {}, // No longer needed with Google OAuth only
    onAuthStateChanged: (callback) => window.firebaseAuth.onAuthStateChanged(callback)
};

// Auto-initialize when Firebase is ready
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    window.firebaseAuth.init();
} else {
    // Wait for Firebase to be initialized
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            window.firebaseAuth.init();
        }
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseAuth;
}
