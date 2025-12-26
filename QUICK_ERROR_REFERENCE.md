# Quick Error Reference Guide

## 🚨 Top 5 Console Errors You'll See

### 1. ES6 Module Import Error (100% probability)
```
Uncaught SyntaxError: Cannot use import statement outside a module
```
**Fix:** Add `type="module"` to script tags in index.html

---

### 2. Firebase Undefined (80% probability)
```
ReferenceError: firebase is not defined
```
**Fix:** Ensure Firebase SDK loads before other scripts

---

### 3. Missing Config File (Unknown probability)
```
GET firebase-config.js 404 (Not Found)
```
**Fix:** Verify firebase-config.js exists in root directory

---

### 4. Race Condition (60% probability)
```
TypeError: Cannot read properties of undefined (reading 'firestore')
```
**Fix:** Use `waitForFirebase()` before accessing Firebase

---

### 5. EntityDisplay Undefined (100% probability)
```
ReferenceError: EntityDisplay is not defined
```
**Fix:** Convert entity-display.js to proper ES6 module

---

## 🔧 Quick Diagnostic Commands

Open browser console and run:

```javascript
// Check Firebase status
typeof firebase !== 'undefined' ? '✓ Loaded' : '✗ Missing'

// View all errors
debugErrors()

// Export error log
ErrorLog.exportLogs()

// Check authentication
firebase?.auth()?.currentUser ? '✓ Logged in' : '✗ Not logged in'

// Check Firebase initialization
window.firebaseApp ? '✓ Initialized' : '✗ Not initialized'
```

---

## 🎯 Priority Fixes

### Must Fix Now (Critical):
1. ✅ Add global error handler to index.html
2. ✅ Fix ES6 module loading
3. ✅ Verify firebase-config.js exists

### Should Fix Soon (High):
1. ⏸️ Add try-catch to async functions
2. ⏸️ Add null checks before DOM operations
3. ⏸️ Implement consistent Firebase waiting

### Nice to Have (Medium):
1. ⏸️ Add loading states
2. ⏸️ Improve error messages
3. ⏸️ Add error analytics

---

## 📊 Testing Checklist

- [ ] Test with DevTools console open
- [ ] Test with slow 3G network
- [ ] Test with cache disabled
- [ ] Test with ad blocker enabled
- [ ] Test in incognito mode
- [ ] Test while logged out
- [ ] Test on mobile device
- [ ] Test in Safari/Firefox

---

## 🛠️ Implementation Steps

### Step 1: Add Error Handler
```html
<!-- index.html - Add as FIRST script in <head> -->
<script src="js/global-error-handler.js"></script>
```

### Step 2: Fix Module Loading
```html
<!-- index.html - Add type="module" -->
<script src="js/navigation.js" type="module"></script>
<script src="js/entity-loader.js" type="module"></script>
<script src="js/entity-display.js" type="module"></script>
```

### Step 3: Test
```javascript
// Open console and run:
debugErrors()
```

---

## 📝 Error Log Commands

```javascript
// View errors
ErrorLog.getErrors()

// View warnings
ErrorLog.getWarnings()

// View all
ErrorLog.getAll()

// Clear log
ErrorLog.clear()

// Export as JSON
ErrorLog.exportLogs()
```

---

## 🔍 Common Error Patterns

### Pattern 1: "Cannot read properties of undefined"
**Cause:** Trying to access property of null/undefined object
**Fix:** Add null check: `if (obj && obj.property)`

### Pattern 2: "is not defined"
**Cause:** Variable or function doesn't exist
**Fix:** Check script load order, add imports

### Pattern 3: "Failed to fetch"
**Cause:** Network error or CORS issue
**Fix:** Check network, verify CORS headers

### Pattern 4: "Permission denied"
**Cause:** Firestore security rules block access
**Fix:** Check user authentication, review security rules

---

## 📚 Full Documentation

- **Detailed Analysis:** `AGENT5_ERROR_ANALYSIS.md`
- **Likely Errors List:** `LIKELY_CONSOLE_ERRORS.md`
- **Complete Summary:** `AGENT5_SUMMARY.md`
- **This Guide:** `QUICK_ERROR_REFERENCE.md`

---

**Quick Tip:** When in doubt, run `debugErrors()` in console!
