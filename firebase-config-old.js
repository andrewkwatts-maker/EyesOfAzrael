/**
 * Firebase Configuration
 * Eyes of Azrael Theory System
 *
 * IMPORTANT: This file contains your Firebase project credentials.
 * DO NOT commit this file to Git! It should be in .gitignore
 *
 * SETUP INSTRUCTIONS:
 * 1. Replace all placeholder values below with your actual Firebase project credentials
 * 2. Get these values from: https://console.firebase.google.com
 *    - Select your project
 *    - Click the gear icon (Settings) > Project Settings
 *    - Scroll to "Your apps" section
 *    - Copy the config object from the Firebase SDK snippet
 *
 * PLACEHOLDER FORMAT:
 * - All placeholders are marked with "YOUR_..." and "REPLACE_THIS"
 * - After replacing, remove the "REPLACE_THIS" comments
 *
 * NEED HELP? See FIREBASE_SETUP_INSTRUCTIONS.md for detailed setup guide
 */

// ============================================================================
// FIREBASE CONFIGURATION OBJECT
// ============================================================================
// Replace the placeholder values below with your actual Firebase credentials

const firebaseConfig = {
  apiKey: "AIzaSyB7bFdte6f81-bNMsdITgnnnWq7aBNMXRw",
  authDomain: "eyesofazrael.firebaseapp.com",
  projectId: "eyesofazrael",
  storageBucket: "eyesofazrael.firebasestorage.app",
  messagingSenderId: "533894778090",
  appId: "1:533894778090:web:35b48ba34421b385569b93",
  measurementId: "G-ECC98XJ9W9"
};

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================
// Check if configuration has been updated from template

function validateFirebaseConfig() {
  const placeholders = [
    'YOUR_API_KEY_HERE',
    'YOUR_PROJECT_ID',
    'YOUR_MESSAGING_SENDER_ID',
    'YOUR_APP_ID'
  ];

  const configString = JSON.stringify(firebaseConfig);
  const hasPlaceholders = placeholders.some(placeholder =>
    configString.includes(placeholder)
  );

  if (hasPlaceholders) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('🔴 FIREBASE CONFIGURATION ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Firebase configuration has not been set up yet!');
    console.error('');
    console.error('Please follow these steps:');
    console.error('1. Open firebase-config.js');
    console.error('2. Replace all placeholder values (YOUR_...) with your actual Firebase credentials');
    console.error('3. Get your credentials from: https://console.firebase.google.com');
    console.error('');
    console.error('For detailed instructions, see: FIREBASE_SETUP_INSTRUCTIONS.md');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return false;
  }

  return true;
}

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================
// Initialize Firebase app and services

let app;
let auth;
let db;
// Note: storage removed - this project uses URL-based images (no Firebase Storage)

try {
  // Validate configuration before initializing
  const isConfigValid = validateFirebaseConfig();

  if (!isConfigValid) {
    throw new Error('Firebase configuration contains placeholder values. Please update firebase-config.js with your actual credentials.');
  }

  // Check if Firebase SDK is loaded
  if (typeof firebase === 'undefined') {
    throw new Error('Firebase SDK not loaded. Make sure Firebase CDN scripts are included before firebase-config.js');
  }

  // Check if Firebase is already initialized
  if (firebase.apps.length === 0) {
    // Initialize Firebase app
    app = firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
  } else {
    // Use existing Firebase app
    app = firebase.app();
    console.log('✅ Using existing Firebase app');
  }

  // Initialize Firebase services
  auth = firebase.auth();
  db = firebase.firestore();
  // Storage not initialized - this project uses URL-based images

  console.log('✅ Firebase services initialized:');
  console.log('   - Authentication:', !!auth);
  console.log('   - Firestore Database:', !!db);
  console.log('   - Cloud Storage: NOT USED (URL-based images)');

  // Optional: Enable Firestore offline persistence
  // This allows the app to work offline and sync when back online
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => {
      console.log('✅ Firestore offline persistence enabled');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️  Firestore persistence failed: Multiple tabs open');
        console.warn('   Persistence can only be enabled in one tab at a time');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️  Firestore persistence not available in this browser');
      } else {
        console.warn('⚠️  Firestore persistence error:', err);
      }
    });

  // Optional: Set up auth state persistence
  // This keeps users logged in across browser sessions
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      console.log('✅ Auth persistence set to LOCAL (survives browser restart)');
    })
    .catch((error) => {
      console.error('❌ Auth persistence error:', error);
    });

  // Log successful initialization
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ FIREBASE READY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

} catch (error) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('🔴 FIREBASE INITIALIZATION ERROR');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('Error details:', error.message);
  console.error('');
  console.error('Common solutions:');
  console.error('1. Check that firebase-config.js has been updated with your credentials');
  console.error('2. Verify Firebase SDK scripts are loaded before firebase-config.js');
  console.error('3. Check browser console for additional error details');
  console.error('4. See FIREBASE_SETUP_INSTRUCTIONS.md for detailed setup guide');
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Show user-friendly error notification
  // Only show if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => showFirebaseError(error));
  } else {
    showFirebaseError(error);
  }
}

// ============================================================================
// ERROR NOTIFICATION
// ============================================================================
// Show user-friendly error message in the page

function showFirebaseError(error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 1.5rem 2rem;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4);
    z-index: 10000;
    max-width: 600px;
    text-align: center;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  errorDiv.innerHTML = `
    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔴 Firebase Configuration Error</div>
    <div style="font-size: 0.95rem; margin-bottom: 1rem; opacity: 0.95;">
      ${error.message}
    </div>
    <div style="font-size: 0.85rem; opacity: 0.9;">
      Please check firebase-config.js and see FIREBASE_SETUP_INSTRUCTIONS.md
    </div>
    <button onclick="this.parentElement.remove()" style="
      margin-top: 1rem;
      padding: 0.5rem 1.5rem;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-weight: 600;
    ">Dismiss</button>
  `;

  document.body.appendChild(errorDiv);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (errorDiv.parentElement) {
      errorDiv.remove();
    }
  }, 10000);
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================
// Make Firebase instances available globally

// Export to window object for use in other scripts
window.firebaseApp = app;
window.firebaseAuthService = auth; // Renamed to avoid conflict with FirebaseAuth class
window.firebaseDb = db;
// storage removed - using URL-based images
window.firebaseConfig = firebaseConfig;

// Also export as ES6 module if supported
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    app,
    auth,
    db,
    storage,
    firebaseConfig
  };
}

// ============================================================================
// DEVELOPMENT HELPER
// ============================================================================
// Log configuration status (redacted for security)

if (console && console.log) {
  const configStatus = {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY_HERE',
    hasAppId: !!firebaseConfig.appId && firebaseConfig.appId !== 'YOUR_APP_ID',
    hasStorage: !!firebaseConfig.storageBucket && !firebaseConfig.storageBucket.includes('YOUR_PROJECT_ID'),
    analyticsEnabled: !!firebaseConfig.measurementId && !firebaseConfig.measurementId.includes('XXXXXXXXXX')
  };

  console.log('📋 Firebase Config Status:', configStatus);
}
