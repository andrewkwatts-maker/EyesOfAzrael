/**
 * Firebase Configuration
 * Eyes of Azrael
 *
 * NOTE: Using window.firebaseConfig to ensure global accessibility
 * for dependency checking in app-init-simple.js
 */

// Attach to window for global access (const doesn't attach to window object)
window.firebaseConfig = {
  apiKey: "AIzaSyB7bFdte6f81-bNMsdITgnnnWq7aBNMXRw",
  authDomain: "eyesofazrael.firebaseapp.com",
  projectId: "eyesofazrael",
  storageBucket: "eyesofazrael.firebasestorage.app",
  messagingSenderId: "533894778090",
  appId: "1:533894778090:web:35b48ba34421b385569b93",
  measurementId: "G-ECC98XJ9W9"
};

// Also create local reference for backwards compatibility
const firebaseConfig = window.firebaseConfig;

// Initialize Firebase immediately so services are available to all scripts
try {
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized successfully');
  }
} catch (e) {
  console.warn('[Firebase] Init error:', e.message);
}
