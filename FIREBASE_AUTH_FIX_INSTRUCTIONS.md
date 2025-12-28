# Firebase Authentication Fix Instructions

## Issue
The authentication handler at `https://eyesofazrael.firebaseapp.com/__/auth/handler` was timing out, preventing users from logging in.

## Root Cause
The custom domain `www.eyesofazrael.com` was not added to Firebase's authorized domains list.

## Solution Applied

### 1. Updated Firebase Config ✅
Changed `authDomain` in `firebase-config.js` from:
```javascript
authDomain: "eyesofazrael.firebaseapp.com"
```
to:
```javascript
authDomain: "www.eyesofazrael.com"
```

### 2. Required Manual Step in Firebase Console ⚠️
**You MUST complete this step for authentication to work:**

1. Go to [Firebase Console - Authentication Settings](https://console.firebase.google.com/project/eyesofazrael/authentication/settings)
2. Scroll to **Authorized domains** section
3. Click **Add domain**
4. Add: `www.eyesofazrael.com`
5. (Optional) Also add: `eyesofazrael.com` (root domain)
6. Click **Save**

### 3. Verify Setup
After adding the authorized domain:
1. Hard refresh the site (Ctrl+F5 / Cmd+Shift+R)
2. Click "Sign In" button
3. The Google Sign-In popup should appear without timeout
4. Complete authentication

## Current Status
- ✅ Code updated and pushed to GitHub
- ✅ GitHub Pages will serve updated config within 5-10 minutes
- ⏳ **WAITING**: Authorized domain needs to be added in Firebase Console (manual step)

## Testing
Once the authorized domain is added, test by:
```javascript
// In browser console on www.eyesofazrael.com
window.eyesOfAzrael.authManager.signInWithGoogle()
```

## Additional Notes
- The `.firebaseapp.com` domain will continue to work as a fallback
- Custom domains require explicit authorization for security
- This is a one-time setup step per domain
