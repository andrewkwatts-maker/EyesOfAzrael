/**
 * Firebase Initialization Module
 * Eyes of Azrael Theory System
 *
 * This module handles Firebase SDK loading and initialization.
 * It provides a centralized way to access Firebase services across the application.
 *
 * USAGE:
 * Include this script after the Firebase config but before other Firebase-dependent scripts:
 *
 * <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>
 * <script src="firebase-config.js"></script>
 * <script src="js/firebase-init.js"></script>
 */

(function() {
  'use strict';

  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Make sure to include Firebase scripts before this file.');
    showFirebaseError('Firebase SDK not loaded. Please check your internet connection and try again.');
    return;
  }

  // Check if Firebase config is loaded
  if (typeof window.firebaseApp === 'undefined') {
    console.error('Firebase config not loaded. Make sure firebase-config.js is included before this file.');
    showFirebaseError('Firebase configuration not found. Please contact the administrator.');
    return;
  }

  /**
   * Firebase Service Manager
   * Provides a single point of access to all Firebase services
   */
  const FirebaseService = {
    // Firebase instances (initialized from firebase-config.js)
    app: window.firebaseApp,
    auth: window.firebaseAuth,
    db: window.firebaseDb,
    storage: window.firebaseStorage,

    // Initialization state
    initialized: false,
    initializing: false,
    error: null,

    // Current user state
    currentUser: null,
    userProfile: null,

    /**
     * Initialize Firebase services
     * This is called automatically when the script loads
     */
    async initialize() {
      if (this.initialized || this.initializing) {
        return;
      }

      this.initializing = true;

      try {
        // Verify all services are available
        if (!this.app || !this.auth || !this.db || !this.storage) {
          throw new Error('One or more Firebase services failed to initialize');
        }

        // Set up auth state listener
        this.auth.onAuthStateChanged(async (user) => {
          this.currentUser = user;

          if (user) {
            console.log('User signed in:', user.uid);
            // Load user profile from Firestore
            await this.loadUserProfile(user.uid);
          } else {
            console.log('User signed out');
            this.userProfile = null;
          }

          // Dispatch custom event for auth state changes
          window.dispatchEvent(new CustomEvent('firebaseAuthStateChanged', {
            detail: { user, userProfile: this.userProfile }
          }));
        });

        this.initialized = true;
        this.initializing = false;
        console.log('Firebase services initialized successfully');

      } catch (error) {
        this.error = error;
        this.initializing = false;
        console.error('Firebase initialization error:', error);
        showFirebaseError('Failed to initialize Firebase services: ' + error.message);
      }
    },

    /**
     * Load user profile from Firestore
     * @param {string} userId - Firebase Auth user ID
     */
    async loadUserProfile(userId) {
      try {
        const userDoc = await this.db.collection('users').doc(userId).get();

        if (userDoc.exists) {
          this.userProfile = {
            id: userId,
            ...userDoc.data()
          };
          console.log('User profile loaded:', this.userProfile);
        } else {
          console.log('User profile not found in Firestore');
          this.userProfile = null;
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        this.userProfile = null;
      }
    },

    /**
     * Create a new user profile in Firestore
     * Called on first login
     * @param {object} userData - User data from Firebase Auth
     */
    async createUserProfile(userData) {
      try {
        const userRef = this.db.collection('users').doc(userData.uid);
        const userDoc = await userRef.get();

        // Only create if doesn't exist
        if (!userDoc.exists) {
          const profile = {
            username: userData.displayName || 'Anonymous',
            email: userData.email,
            avatar: userData.photoURL || '',
            bio: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          await userRef.set(profile);
          console.log('User profile created:', profile);
          this.userProfile = { id: userData.uid, ...profile };
          return this.userProfile;
        } else {
          console.log('User profile already exists');
          return userDoc.data();
        }
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
      return this.currentUser !== null;
    },

    /**
     * Get current user
     * @returns {object|null}
     */
    getCurrentUser() {
      return this.currentUser;
    },

    /**
     * Get current user profile
     * @returns {object|null}
     */
    getUserProfile() {
      return this.userProfile;
    },

    /**
     * Get current user ID
     * @returns {string|null}
     */
    getUserId() {
      return this.currentUser ? this.currentUser.uid : null;
    }
  };

  /**
   * Display user-friendly error message
   * @param {string} message - Error message to display
   */
  function showFirebaseError(message) {
    // Create error banner
    const errorBanner = document.createElement('div');
    errorBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff4444;
      color: white;
      padding: 15px;
      text-align: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    errorBanner.innerHTML = `
      <strong>Firebase Error:</strong> ${message}
      <button onclick="this.parentElement.remove()" style="margin-left: 20px; background: white; color: #ff4444; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">
        Dismiss
      </button>
    `;

    // Add to page when DOM is ready
    if (document.body) {
      document.body.insertBefore(errorBanner, document.body.firstChild);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.insertBefore(errorBanner, document.body.firstChild);
      });
    }
  }

  /**
   * Wait for Firebase to initialize
   * Useful for scripts that need Firebase services to be ready
   * @returns {Promise<FirebaseService>}
   */
  function waitForFirebase() {
    return new Promise((resolve, reject) => {
      if (FirebaseService.initialized) {
        resolve(FirebaseService);
        return;
      }

      const maxWaitTime = 10000; // 10 seconds
      const startTime = Date.now();

      const checkInterval = setInterval(() => {
        if (FirebaseService.initialized) {
          clearInterval(checkInterval);
          resolve(FirebaseService);
        } else if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkInterval);
          reject(new Error('Firebase initialization timeout'));
        }
      }, 100);
    });
  }

  // Initialize Firebase on script load
  FirebaseService.initialize();

  // Export to global scope
  window.FirebaseService = FirebaseService;
  window.waitForFirebase = waitForFirebase;

  // Also export individual services for convenience
  window.auth = FirebaseService.auth;
  window.db = FirebaseService.db;
  window.storage = FirebaseService.storage;

  // Export as module if using ES6 modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      FirebaseService,
      waitForFirebase,
      auth: FirebaseService.auth,
      db: FirebaseService.db,
      storage: FirebaseService.storage
    };
  }

  console.log('Firebase initialization module loaded');
})();

/**
 * USAGE EXAMPLES:
 *
 * 1. Check if user is authenticated:
 *    if (FirebaseService.isAuthenticated()) {
 *      console.log('User is logged in');
 *    }
 *
 * 2. Get current user:
 *    const user = FirebaseService.getCurrentUser();
 *    console.log(user.email);
 *
 * 3. Listen for auth state changes:
 *    window.addEventListener('firebaseAuthStateChanged', (event) => {
 *      const { user, userProfile } = event.detail;
 *      console.log('Auth state changed:', user);
 *    });
 *
 * 4. Wait for Firebase to initialize:
 *    waitForFirebase().then((firebase) => {
 *      // Firebase is ready, safe to use services
 *      firebase.db.collection('theories').get();
 *    });
 *
 * 5. Access services directly:
 *    db.collection('theories').get();
 *    auth.signInWithPopup(provider);
 *    storage.ref('images/test.jpg').put(file);
 */
