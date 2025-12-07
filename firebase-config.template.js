/**
 * Firebase Configuration Template
 * Eyes of Azrael Theory System
 *
 * INSTRUCTIONS:
 * 1. Copy this file to 'firebase-config.js' (DO NOT commit firebase-config.js to git)
 * 2. Replace all placeholder values with your actual Firebase project credentials
 * 3. Get these values from Firebase Console > Project Settings > General > Your apps
 *
 * HOW TO GET THESE VALUES:
 * - Go to https://console.firebase.google.com
 * - Select your project
 * - Click the gear icon (Settings) > Project Settings
 * - Scroll down to "Your apps" section
 * - If you haven't added a web app, click "</>" to add one
 * - Copy the config object from the Firebase SDK snippet
 */

// Firebase Configuration Object
const firebaseConfig = {
  // API Key - Find this in Firebase Console > Project Settings > General
  // This is public and safe to expose in client-side code
  apiKey: "YOUR_API_KEY_HERE",

  // Auth Domain - Format: your-project-id.firebaseapp.com
  // Used for Firebase Authentication
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",

  // Project ID - Your Firebase project identifier
  // Find this in Firebase Console > Project Settings
  projectId: "YOUR_PROJECT_ID",

  // Storage Bucket - Format: your-project-id.appspot.com
  // Used for Firebase Storage (image uploads)
  storageBucket: "YOUR_PROJECT_ID.appspot.com",

  // Messaging Sender ID - Used for Firebase Cloud Messaging (optional)
  // Find this in Firebase Console > Project Settings > Cloud Messaging
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",

  // App ID - Unique identifier for your Firebase app
  // Find this in Firebase Console > Project Settings > General
  appId: "YOUR_APP_ID",

  // Measurement ID - Used for Firebase Analytics (optional)
  // Find this in Firebase Console > Project Settings > General
  // You can omit this if you don't use Analytics
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Example of what your config should look like (with fake values):
/*
const firebaseConfig = {
  apiKey: "AIzaSyABcDeFgHiJkLmNoPqRsTuVwXyZ1234567",
  authDomain: "eyes-of-azrael.firebaseapp.com",
  projectId: "eyes-of-azrael",
  storageBucket: "eyes-of-azrael.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl",
  measurementId: "G-ABC123DEF4"
};
*/

// ====================================================================
// GOOGLE GEMINI API - OAUTH AUTHENTICATION
// ====================================================================
// AI-powered SVG generation uses Google Gemini API with OAuth authentication.
//
// HOW IT WORKS:
// 1. Users sign in with Google OAuth (via Firebase Authentication)
// 2. Their OAuth token is automatically used to call Gemini API
// 3. No API key needed - seamless integration with existing sign-in
//
// OAUTH SCOPES:
// The Google sign-in provider requests these scopes:
// - profile: User's basic profile information
// - email: User's email address
// - https://www.googleapis.com/auth/generative-language.retriever (optional)
//
// NOTE: The Gemini 1.5 Flash model is free for moderate usage
// and very cost-effective for SVG generation tasks.
//
// BENEFITS OF OAUTH:
// - No API key management required
// - Each user has their own quota
// - Better security (short-lived tokens)
// - Automatic token refresh
// - No shared credentials to protect
//
// REQUIREMENTS:
// - Users must sign in with Google to use AI SVG generation
// - Code editor tab works without authentication
// - Gemini API must be enabled in your Google Cloud project

// ====================================================================
// Initialize Firebase (using compat mode for easier migration)
// This assumes Firebase SDKs are already loaded via CDN in your HTML
let app;
let auth;
let db;
let storage;

try {
  // Check if Firebase is already initialized
  if (firebase.apps.length === 0) {
    // Initialize Firebase app
    app = firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    // Use existing Firebase app
    app = firebase.app();
    console.log('Using existing Firebase app');
  }

  // Initialize Firebase services
  auth = firebase.auth();
  db = firebase.firestore();
  storage = firebase.storage();

  // Optional: Enable Firestore offline persistence
  // This allows the app to work offline and sync when back online
  db.enablePersistence()
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
      }
    });

  // Optional: Set up auth state persistence
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((error) => {
      console.error('Auth persistence error:', error);
    });

  console.log('Firebase services initialized:', {
    auth: !!auth,
    firestore: !!db,
    storage: !!storage
  });

} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Make sure you have replaced all placeholder values in firebase-config.js');
  console.error('Also ensure Firebase SDK scripts are loaded before this file');

  // Show user-friendly error
  alert('Firebase configuration error. Please check the console for details.');
}

// Export Firebase instances for use in other modules
// These will be available globally when this script is loaded
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;

// Also export as module if using ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    app,
    auth,
    db,
    storage,
    firebaseConfig
  };
}
