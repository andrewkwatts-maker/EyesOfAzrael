# DOM Debugging Guide

Quick reference for debugging DOM visibility issues after authentication.

---

## Quick Start

### 1. Enable Debug Mode

Add to `index.html` (temporarily, before `</head>`):

```html
<!-- Debug Tools (REMOVE AFTER DEBUGGING) -->
<link rel="stylesheet" href="css/debug-borders.css">
<script src="js/dom-state-debugger.js"></script>
```

### 2. Open Browser Console

- **Chrome/Edge**: F12 or Ctrl+Shift+I
- **Firefox**: F12 or Ctrl+Shift+K
- **Safari**: Cmd+Option+I (after enabling Developer menu)

### 3. Login and Watch Console

You'll see automatic logs for:
- DOM Ready
- Auth Ready
- App Initialized
- Body class changes
- #main-content style changes
- Periodic state checks (every 2s for 30s)

---

## Console Commands

### Check Initialization State

```javascript
debugInitState()
```

**Expected Output** (after successful auth):
```javascript
{
  domReady: true,
  authReady: true,
  appReady: true,
  navigationReady: true
}
```

### Check DOM State

```javascript
debugDOM.logState()
```

**Shows**:
- Body classes
- Main content visibility
- Loading container status
- Auth screen visibility
- Element dimensions

### Get Full Summary

```javascript
debugDOM.summary()
```

**Shows**:
- Total state logs
- Current state
- Complete state history

### Check Visibility

```javascript
debugDOM.checkVisibility()
```

**Shows detailed visibility for**:
- Main Content
- Auth Overlay
- Auth Loading Screen

### Quick Visibility Check

```javascript
debugDOM.isContentVisible()
```

**Returns**: `true` if main content is visible, `false` otherwise

---

## Manual Fixes (Testing)

### Force Show Main Content

```javascript
debugDOM.forceShowContent()
```

This sets:
- `display: block`
- `visibility: visible`
- `opacity: 1`

### Hide Loading Container

```javascript
debugDOM.hideLoading()
```

Hides the "Initializing..." spinner.

---

## Visual Indicators (with debug-borders.css)

### Body State Indicator (Top Right)

- **🔄 auth-loading** (Magenta background) = Still loading auth
- **🔒 not-authenticated** (Orange background) = Needs login
- **✅ authenticated** (Green background) = Logged in

### Element Borders

- **Magenta outline** = Auth Loading Screen
- **Orange outline** = Auth Overlay
- **Lime outline** = Main Content
- **Red outline** = Loading Container (should disappear after auth)
- **Blue outline** = Site Header

### Element Labels

Each element has a label showing:
- Element name
- Current state
- Z-index
- Display mode

---

## Common Issues

### Issue 1: "Body shows 'authenticated' but content not visible"

**Check**:
```javascript
debugDOM.checkVisibility()
```

**Look for**:
- Main content `display: none` (should be `block`)
- Main content opacity: 0 (should be 1)
- Main content dimensions: 0x0 (should have width/height)

**Fix**:
```javascript
debugDOM.forceShowContent()
```

---

### Issue 2: "Content visible but still showing spinner"

**Check**:
```javascript
document.querySelector('.loading-container')
```

**Should return**: `null` (removed) or element with `display: none`

**Fix**:
```javascript
debugDOM.hideLoading()
```

---

### Issue 3: "Everything looks right but page is blank"

**Check**:
```javascript
document.getElementById('main-content').innerHTML
```

**Should show**: Actual page content (not just loading spinner)

**If empty**, check:
```javascript
debugInitState()
```

**Look for**:
- `navigationReady: false` = Navigation not initialized
- `appReady: false` = App initialization failed

**Check console** for error messages

---

### Issue 4: "Auth overlay won't go away"

**Check body classes**:
```javascript
document.body.className
```

**Should be**: `"authenticated"` (not `"not-authenticated"` or `"auth-loading"`)

**Fix**:
```javascript
document.body.classList.remove('not-authenticated', 'auth-loading');
document.body.classList.add('authenticated');
document.getElementById('auth-overlay').style.display = 'none';
document.getElementById('main-content').style.display = 'block';
```

---

## Diagnostic Checklist

### After Login

- [ ] Body class changed to `authenticated`
- [ ] `#auth-overlay` has `display: none`
- [ ] `#main-content` has `display: block`
- [ ] `.loading-container` removed or hidden
- [ ] Home page content loaded
- [ ] No errors in console

### Timing Expectations

| Event | Expected Time |
|-------|--------------|
| DOM Ready | < 100ms |
| Auth Ready | < 2s |
| App Initialized | < 3s |
| Navigation Ready | < 3.5s |
| Home Page Loaded | < 4s |

**If any step takes > 10s**: Check console for errors

---

## Advanced Debugging

### Monitor State Changes in Real-Time

```javascript
// Get initial state
let lastState = debugDOM.logState();

// Check every second for changes
const monitor = setInterval(() => {
    const currentState = debugDOM.logState();
    // States are logged automatically
}, 1000);

// Stop monitoring after 30 seconds
setTimeout(() => clearInterval(monitor), 30000);
```

### Compare States

```javascript
// Get state history
const log = debugDOM.getLog();

// Compare first and last states
console.log('Initial:', log[0]);
console.log('Current:', log[log.length - 1]);
```

### Export State Log

```javascript
// Copy to clipboard
copy(JSON.stringify(debugDOM.getLog(), null, 2));

// Or save to file (paste into text editor)
console.log(JSON.stringify(debugDOM.getLog(), null, 2));
```

---

## Performance Monitoring

### Check Initialization Time

```javascript
const state = debugInitState();
console.log('Total init time:', state.elapsed, 'ms');

// Breakdown
console.log('DOM Ready:', state.initState.domReady.timestamp, 'ms');
console.log('Auth Ready:', state.initState.authReady.timestamp, 'ms');
console.log('App Ready:', state.initState.appReady.timestamp, 'ms');
console.log('Navigation Ready:', state.initState.navigationReady.timestamp, 'ms');
```

### Check for Slow Scripts

```javascript
// In browser DevTools -> Network tab
// Filter by "JS"
// Sort by "Time"
// Look for scripts taking > 500ms
```

---

## Cleanup

### After Debugging

1. **Remove debug CSS**:
   ```html
   <!-- Remove this line from index.html -->
   <link rel="stylesheet" href="css/debug-borders.css">
   ```

2. **Remove debug script**:
   ```html
   <!-- Remove this line from index.html -->
   <script src="js/dom-state-debugger.js"></script>
   ```

3. **Clear console**:
   ```javascript
   console.clear()
   ```

4. **Hard refresh**:
   - Chrome/Edge: Ctrl+Shift+R
   - Firefox: Ctrl+F5
   - Safari: Cmd+Shift+R

---

## Reporting Issues

When reporting a bug, include:

1. **State Log**:
   ```javascript
   copy(JSON.stringify(debugDOM.getLog(), null, 2))
   ```

2. **Init State**:
   ```javascript
   copy(JSON.stringify(debugInitState(), null, 2))
   ```

3. **Console Errors**:
   - Screenshot or copy all red error messages

4. **Screenshots**:
   - Full page with debug borders visible
   - Body state indicator (top right)
   - Console output

5. **Browser Info**:
   - Browser name and version
   - Operating system
   - Screen resolution

---

## Quick Fixes Reference

### Force Authenticated State

```javascript
// WARNING: This bypasses auth! Only for debugging!
document.body.classList.remove('not-authenticated', 'auth-loading');
document.body.classList.add('authenticated');
document.getElementById('auth-overlay').style.display = 'none';
document.getElementById('auth-loading-screen').style.display = 'none';
document.getElementById('main-content').style.display = 'block';

const loadingContainer = document.querySelector('.loading-container');
if (loadingContainer) loadingContainer.style.display = 'none';
```

### Trigger Navigation Manually

```javascript
if (window.EyesOfAzrael && window.EyesOfAzrael.navigation) {
    window.EyesOfAzrael.navigation.handleRoute();
} else {
    console.error('Navigation not available');
}
```

### Force App Initialization

```javascript
forceRouteCheck()
```

---

**Last Updated**: 2025-12-26
**Created by**: Agent 6
