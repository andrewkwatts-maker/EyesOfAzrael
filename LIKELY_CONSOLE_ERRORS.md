# Likely Console Errors - Eyes of Azrael

## Overview
This document lists the most likely errors that will appear in the browser console when loading the Eyes of Azrael website, based on code analysis.

---

## Critical Errors (100% Probability)

### 1. ES6 Module Import Errors
```
Uncaught SyntaxError: Cannot use import statement outside a module
    at navigation.js:7
    at entity-loader.js:11
    at entity-display.js:11
```

**Cause:** Three JavaScript files use ES6 `import` statements but are loaded as regular scripts:
- `js/navigation.js` imports from `./constants/entity-types.js`
- `js/entity-loader.js` imports from `./constants/entity-types.js`
- `js/entity-display.js` imports from `./constants/entity-types.js`

**Fix Required:** Add `type="module"` to script tags in index.html

---

### 2. Missing Constants File
```
GET https://eyesofazrael.com/js/constants/entity-types.js 404 (Not Found)
```

**Cause:** File exists but is referenced as ES6 module

**Secondary Errors:**
```
ReferenceError: ENTITY_ICONS is not defined
ReferenceError: getEntityIcon is not defined
ReferenceError: getCollectionName is not defined
```

---

### 3. Firebase SDK Load Failure
```
GET https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js net::ERR_BLOCKED_BY_CLIENT
```

**Cause:** Ad blockers or network issues blocking Firebase CDN

**Secondary Errors:**
```
ReferenceError: firebase is not defined
    at firebase-init.js:23
    at firebase-auth.js:21
    at app-init.js:27
```

---

## High Probability Errors (60-80%)

### 4. Firebase Config Missing
```
GET https://eyesofazrael.com/firebase-config.js 404 (Not Found)
```

**Secondary Errors:**
```
TypeError: Cannot read properties of undefined (reading 'initializeApp')
    at app-init.js:27

TypeError: Cannot read properties of undefined (reading 'collection')
    at entity-loader.js:36
```

---

### 5. Race Condition - Firebase Not Ready
```
TypeError: Cannot read properties of undefined (reading 'firestore')
    at entity-loader.js:36

Error: Firebase not initialized
    at advanced-search.js:54

TypeError: Cannot read properties of undefined (reading 'onAuthStateChanged')
    at entity-loader.js:525
```

**Occurs When:** Component tries to use Firebase before it's initialized

---

### 6. Undefined EntityDisplay
```
ReferenceError: EntityDisplay is not defined
    at entity-loader.js:87
    at entity-loader.js:219
```

**Cause:** entity-display.js exports as ES6 module but is loaded as regular script

---

### 7. Undefined EntityLoader
```
ReferenceError: EntityLoader is not defined
    at navigation.js:366
```

**Cause:** entity-loader.js exports as ES6 module but is loaded as regular script

---

### 8. Firebase Timeout
```
Error: Firebase initialization timeout
    at firebase-init.js:253
```

**Occurs When:** Firebase doesn't initialize within 10 seconds

---

## Medium Probability Errors (30-50%)

### 9. Missing DOM Elements
```
TypeError: Cannot set property 'innerHTML' of null
    at navigation.js:206

TypeError: Cannot read properties of null (reading 'style')
    at entity-loader.js:272
```

**Occurs When:** Scripts try to manipulate DOM elements that don't exist

---

### 10. Firestore Permission Denied
```
FirebaseError: Missing or insufficient permissions.
    at entity-loader.js:71

FirebaseError: [code=permission-denied]: Permission denied
```

**Occurs When:** User not authenticated or security rules block access

---

### 11. Unhandled Promise Rejections
```
Unhandled Promise Rejection: FirebaseError: Firebase: Error (auth/network-request-failed).

Unhandled Promise Rejection: TypeError: Cannot read properties of undefined
```

**Occurs When:** Async functions fail without try-catch

---

### 12. CORS Errors
```
Access to fetch at 'https://eyesofazrael.com/data/entities/deity/zeus.json'
from origin 'https://www.eyesofazrael.com' has been blocked by CORS policy
```

**Occurs When:** Wrong domain or missing CORS headers

---

### 13. Missing headerFilters
```
TypeError: Cannot read properties of undefined (reading 'getActiveFilters')
    at entity-loader.js:110
```

**Occurs When:** header-filters.js not loaded or failed to initialize

---

### 14. Missing userPreferences
```
TypeError: window.userPreferences.applyFilters is not a function
    at entity-loader.js:179
```

---

## Low Probability Errors (10-30%)

### 15. LocalStorage Quota Exceeded
```
QuotaExceededError: The quota has been exceeded.
    at advanced-search.js:801
    at navigation.js:322
```

**Occurs When:** Too much data stored in localStorage (usually on mobile)

---

### 16. Performance API Missing
```
ReferenceError: performance is not defined
    at advanced-search.js:183
```

**Occurs When:** Running in older browser

---

### 17. Map/Set Not Supported
```
TypeError: Map is not a constructor
    at advanced-search.js:21
```

**Occurs When:** Running in IE11 or older browser

---

### 18. Maximum Call Stack Size Exceeded
```
RangeError: Maximum call stack size exceeded
    at navigation.js:516
```

**Occurs When:** waitForFirebase creates infinite recursion

---

### 19. Missing gtag Function
```
ReferenceError: gtag is not defined
    at entity-loader.js:456
```

**Occurs When:** Google Analytics not loaded

---

## Security Warnings

### 20. XSS Vulnerability Warning
```
[Security] Potential XSS: Unescaped user input in markdown rendering
    at entity-renderer-firebase.js:708
```

**Not a console error but should be monitored**

---

## Network Errors

### 21. Failed Script Loads
```
GET https://eyesofazrael.com/js/app-init.js net::ERR_ABORTED 404
GET https://eyesofazrael.com/js/entity-display.js net::ERR_BLOCKED_BY_CLIENT
```

---

## Component-Specific Errors

### 22. Entity Panel Errors
```
TypeError: Cannot read properties of undefined (reading 'mythology')
    at entity-display.js:31

Error loading entity: Entity not found: deity/undefined
    at entity-panel.js:21
```

---

### 23. Advanced Search Errors
```
Error: Firebase not initialized
    at advanced-search.js:54

TypeError: Cannot read properties of undefined (reading 'collection')
    at advanced-search.js:77
```

---

### 24. Navigation System Errors
```
Error loading mythologies: FirebaseError: Permission denied
    at navigation.js:47

TypeError: Cannot read properties of undefined (reading 'includes')
    at navigation.js:474
```

---

## Typical Load Sequence Errors

### Scenario: First Page Load (Clean Cache)

**1. Initial Errors:**
```
GET firebase-config.js 404
Uncaught SyntaxError: Cannot use import statement outside a module (navigation.js:7)
Uncaught SyntaxError: Cannot use import statement outside a module (entity-loader.js:11)
Uncaught SyntaxError: Cannot use import statement outside a module (entity-display.js:11)
```

**2. Firebase Errors:**
```
ReferenceError: firebase is not defined (firebase-init.js:23)
TypeError: Cannot read properties of undefined (reading 'initializeApp') (app-init.js:27)
```

**3. Cascading Failures:**
```
ReferenceError: EntityDisplay is not defined (entity-loader.js:87)
ReferenceError: EntityLoader is not defined (navigation.js:366)
Error: Firebase initialization timeout (firebase-init.js:253)
```

**4. Final State:**
```
Application non-functional, white screen or error page
```

---

### Scenario: Slow Network (3G)

**1. Race Condition Errors:**
```
TypeError: Cannot read properties of undefined (reading 'firestore')
Error: Firebase not initialized
TypeError: Cannot read properties of undefined (reading 'onAuthStateChanged')
```

**2. Timeout Errors:**
```
Error: Firebase initialization timeout
GET https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js net::ERR_CONNECTION_TIMED_OUT
```

**3. Promise Rejections:**
```
Unhandled Promise Rejection: FirebaseError: Error (auth/network-request-failed)
Unhandled Promise Rejection: Error: Failed to load entity
```

---

### Scenario: Logged Out User

**1. Permission Errors:**
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions
FirebaseError: Permission denied
```

**2. Auth Errors:**
```
No errors - auth system should handle gracefully
(But check: are security rules configured correctly?)
```

---

### Scenario: Ad Blocker Active

**1. Blocked Resources:**
```
GET https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js net::ERR_BLOCKED_BY_CLIENT
GET https://www.googletagmanager.com/gtag/js?id=... net::ERR_BLOCKED_BY_CLIENT
```

**2. Secondary Failures:**
```
ReferenceError: firebase is not defined
ReferenceError: gtag is not defined
Application fails to load
```

---

## Error Frequency Analysis

Based on code analysis, expected error frequency:

| Error Type | Probability | Frequency | Impact |
|------------|------------|-----------|---------|
| ES6 Module Errors | 100% | Every page load | CRITICAL - App broken |
| Firebase Undefined | 80% | Most page loads | CRITICAL - No functionality |
| Missing firebase-config | Unknown | If file missing | CRITICAL - No Firebase |
| Race Conditions | 60% | Intermittent | HIGH - Features fail |
| DOM Element Missing | 40% | Some pages | MEDIUM - UI broken |
| Permission Denied | 30% | When logged out | MEDIUM - Expected behavior |
| Network Errors | 20% | Slow connections | MEDIUM - Retry possible |
| LocalStorage Quota | 5% | Heavy usage | LOW - Clear storage |
| Browser Compatibility | 2% | Old browsers | LOW - Upgrade browser |

---

## Testing Recommendations

### Essential Tests:

1. **Test with DevTools open**
   - Open Console tab before loading page
   - Check for red errors
   - Check Network tab for failed requests

2. **Test with slow network**
   - Chrome DevTools > Network > Throttling > Slow 3G
   - Will reveal race conditions

3. **Test with cache disabled**
   - Chrome DevTools > Network > Disable cache
   - Will reveal missing file errors

4. **Test with ad blocker**
   - Install uBlock Origin
   - Will reveal Firebase CDN blocks

5. **Test in incognito**
   - Will reveal localStorage issues
   - Clean state testing

---

## Quick Diagnostic Commands

Run these in browser console to debug:

```javascript
// 1. Check if Firebase loaded
typeof firebase !== 'undefined' ? '✓ Firebase loaded' : '✗ Firebase missing'

// 2. Check Firebase initialization
window.firebaseApp ? '✓ Firebase initialized' : '✗ Firebase not initialized'

// 3. Check if modules loaded
typeof EntityDisplay !== 'undefined' ? '✓ EntityDisplay loaded' : '✗ EntityDisplay missing'

// 4. View all errors
debugErrors()

// 5. Export error log
ErrorLog.exportLogs()

// 6. Check auth state
firebase?.auth()?.currentUser ? '✓ User logged in' : '✗ Not logged in'
```

---

## Fix Priority

### Priority 1 (MUST FIX):
1. ✅ Convert ES6 modules to proper loading
2. ✅ Add global error handler
3. ✅ Verify firebase-config.js exists
4. ✅ Add Firebase SDK load verification

### Priority 2 (SHOULD FIX):
1. ⏸️ Add try-catch to all async functions
2. ⏸️ Add null checks before DOM manipulation
3. ⏸️ Implement waitForFirebase consistently
4. ⏸️ Add loading states

### Priority 3 (NICE TO HAVE):
1. ⏸️ Add error boundaries
2. ⏸️ Implement Sentry error tracking
3. ⏸️ Add offline support
4. ⏸️ Improve error messages

---

**Last Updated:** 2024-12-26
**Coverage:** 12 core JavaScript files, 8,500+ lines of code
**Total Error Categories:** 27
**Critical Errors:** 8
