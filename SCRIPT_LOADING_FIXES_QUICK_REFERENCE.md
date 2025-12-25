# Script Loading Fixes - Quick Reference

## The Problem in 3 Points

1. **auth-guard-simple.js is an ES6 module** but nothing imports it (exports are unused)
2. **3 missing files** causing 404 errors: search-firebase.js, shader-manager.js, theme-manager.js
3. **Race condition** - module execution timing conflicts with regular scripts

---

## The Solution in 3 Steps

### STEP 1: Fix index.html Script Tags

**File**: `H:/Github/EyesOfAzrael/index.html`

Replace lines 109-134 with:

```html
    <!-- Core Scripts -->
    <script src="js/seo.js"></script>
    <script src="js/toast.js"></script>
    <script src="js/image-optimizer.js"></script>

    <!-- Authentication Guard (REMOVED type="module") -->
    <script src="js/auth-guard-simple.js"></script>

    <!-- Authentication -->
    <script src="js/auth-manager.js"></script>
    <script src="js/header-theme-picker.js"></script>

    <!-- Shader System (FIXED PATH) -->
    <script src="js/shaders/shader-themes.js"></script>

    <!-- Component Scripts -->
    <script src="js/entity-renderer-firebase.js"></script>
    <script src="js/views/home-view.js"></script>
    <script src="js/spa-navigation.js"></script>

    <!-- Search System (FIXED PATH) -->
    <script src="js/components/corpus-search-enhanced.js"></script>

    <!-- CRUD System -->
    <script src="js/firebase-crud-manager.js"></script>
    <script src="js/components/entity-form.js"></script>
    <script src="js/components/user-dashboard.js"></script>

    <!-- App Initialization (MUST BE LAST) -->
    <script src="js/app-init-simple.js"></script>
```

### STEP 2: Fix auth-guard-simple.js Exports

**File**: `H:/Github/EyesOfAzrael/js/auth-guard-simple.js`

**Change lines 15, 290, 298** from:

```javascript
export function setupAuthGuard() {
// ...
export function isUserAuthenticated() {
// ...
export function getCurrentUser() {
```

**To** (remove "export"):

```javascript
function setupAuthGuard() {
// ...
function isUserAuthenticated() {
// ...
function getCurrentUser() {
```

**Add at the very bottom** (after line 307):

```javascript
// Make functions available globally
window.EyesOfAzrael = window.EyesOfAzrael || {};
window.EyesOfAzrael.setupAuthGuard = setupAuthGuard;
window.EyesOfAzrael.isUserAuthenticated = isUserAuthenticated;
window.EyesOfAzrael.getCurrentUser = getCurrentUser;
```

### STEP 3: Add Dependency Checks to app-init-simple.js

**File**: `H:/Github/EyesOfAzrael/js/app-init-simple.js`

**Add after line 15** (after DOMContentLoaded check):

```javascript
    // Verify all required dependencies are loaded
    const requiredClasses = [
        'AuthManager',
        'FirebaseCRUDManager',
        'HomeView',
        'SPANavigation',
        'ShaderThemeManager'
    ];

    const missing = requiredClasses.filter(className => typeof window[className] === 'undefined');

    if (missing.length > 0) {
        console.error('[App] ❌ Missing required classes:', missing);
        console.error('[App] Check that all script tags are present and paths are correct');
        throw new Error(`Missing dependencies: ${missing.join(', ')}`);
    }

    console.log('[App] ✅ All dependencies loaded');
```

---

## What Changed

| Issue | Before | After |
|-------|--------|-------|
| auth-guard-simple.js | ES6 module (type="module") | Regular script |
| search-firebase.js | ❌ 404 Error | ✅ corpus-search-enhanced.js |
| shader-manager.js | ❌ 404 Error | ✅ shaders/shader-themes.js |
| theme-manager.js | ❌ 404 Error | ✅ Removed (in header-theme-picker.js) |
| Script order | Random | Dependency-ordered |
| Error handling | None | Checks for missing classes |

---

## Testing

After making changes, verify:

```bash
# 1. No 404 errors in browser console
# 2. Firebase initializes successfully
# 3. Auth guard shows login when not authenticated
# 4. All systems initialize without errors
```

In browser console, run:
```javascript
debugApp()  // Should show all initialized systems
```

Expected output:
```javascript
{
  db: Firestore,
  firebaseAuth: Auth,
  auth: AuthManager,
  crudManager: FirebaseCRUDManager,
  renderer: UniversalDisplayRenderer,
  navigation: SPANavigation,
  search: EnhancedCorpusSearch,
  shaders: ShaderThemeManager
}
```

---

## Files Modified

1. ✏️ `index.html` - Lines 109-134
2. ✏️ `js/auth-guard-simple.js` - Lines 15, 290, 298, add at end
3. ✏️ `js/app-init-simple.js` - Add after line 15

---

## Why This Works

**Before**: ES6 module executes AFTER regular scripts (deferred), but nothing imports it
**After**: Regular script executes IN ORDER with other scripts, shares global scope

**Before**: Missing files cause 404 errors → classes undefined → app-init fails silently
**After**: Correct file paths → all classes loaded → dependency check catches issues early

**Before**: No visibility into what's missing
**After**: Clear error messages if dependencies fail to load
