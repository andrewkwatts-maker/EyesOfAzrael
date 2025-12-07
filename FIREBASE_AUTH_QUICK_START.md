# Firebase Authentication Quick Start Guide

**For Developers: Get Firebase Auth Running in 5 Minutes**

## Setup (One-Time)

### 1. Create Firebase Config
```bash
# Copy template
cp firebase-config.template.js firebase-config.js

# Edit firebase-config.js and add your Firebase credentials
# Get these from: https://console.firebase.google.com
# Project Settings > General > Your apps > Web app
```

### 2. Enable Google Authentication
```
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Authentication > Sign-in method
4. Enable "Google" provider
5. Add authorized domain (e.g., localhost for testing)
```

### 3. Create Firestore Database
```
1. Go to Firestore Database
2. Click "Create Database"
3. Start in "Production mode" (we'll apply security rules)
4. Choose a location
5. Deploy security rules from firestore.rules
```

## Usage in HTML Pages

### Add to Any Page

**1. Include Firebase SDKs (in `<head>`):**
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

<!-- Firebase Auth System -->
<link rel="stylesheet" href="/css/user-auth.css">
<script defer src="/js/firebase-config.js"></script>
<script defer src="/js/firebase-auth.js"></script>
<script defer src="/js/components/google-signin-button.js"></script>
```

**2. Load Auth Modal (at end of `<body>`):**
```html
<script>
fetch('auth-modal-firebase.html')
    .then(response => response.text())
    .then(html => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        document.body.insertAdjacentHTML('beforeend', tempDiv.innerHTML);
    });
</script>
```

**Done!** The page now has:
- "Sign in with Google" button (top-right)
- Auth modal
- User profile display
- Session persistence

## Usage in JavaScript

### Check if User is Logged In
```javascript
if (window.userAuth.isLoggedIn()) {
    console.log('User is logged in');
}
```

### Get Current User
```javascript
const user = window.userAuth.getCurrentUser();
console.log(user.displayName); // "John Doe"
console.log(user.email);       // "john@example.com"
console.log(user.photoURL);    // "https://lh3.googleusercontent.com/..."
console.log(user.uid);         // "firebase_user_id_123"
```

### Show Login Modal Programmatically
```javascript
window.userAuth.showLoginModal();
```

### Sign Out User
```javascript
await window.userAuth.logout();
```

### Listen for Auth State Changes
```javascript
window.userAuth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User signed in:', user.displayName);
    } else {
        console.log('User signed out');
    }
});
```

### Add Google Sign-In Button Anywhere
```html
<div data-google-signin
     data-button-text="Sign in with Google"
     data-button-size="large"></div>
```

Size options: `small`, `medium`, `large`

## UI Integration

### Show/Hide Based on Auth State
```html
<!-- Shown only when logged out -->
<div data-auth-show="loggedOut">
    <button onclick="window.userAuth.showLoginModal()">Sign In</button>
</div>

<!-- Shown only when logged in -->
<div data-auth-show="loggedIn">
    <p>Welcome, <span data-auth-username></span>!</p>
    <img data-auth-avatar src="" alt="Avatar">
    <button onclick="window.userAuth.logout()">Sign Out</button>
</div>
```

### Display User Info
```html
<!-- Automatically populated with user data -->
<span data-auth-username></span>  <!-- Display name -->
<img data-auth-avatar src="">     <!-- Profile photo -->
<span data-auth-email></span>     <!-- Email address -->
```

## Events

### Listen for Sign-In Success
```javascript
document.addEventListener('google-signin-success', (event) => {
    console.log('User signed in:', event.detail);
});
```

### Listen for Sign-In Error
```javascript
document.addEventListener('google-signin-error', (event) => {
    console.error('Sign-in error:', event.detail.error);
});
```

### Listen for User Login (Custom Event)
```javascript
window.addEventListener('userLogin', (event) => {
    console.log('User logged in:', event.detail);
});
```

### Listen for User Logout (Custom Event)
```javascript
window.addEventListener('userLogout', () => {
    console.log('User logged out');
});
```

## Firestore Integration

### Access Firestore
```javascript
const db = firebase.firestore();
```

### Get User Profile from Firestore
```javascript
const user = window.userAuth.getCurrentUser();
if (user) {
    const profileDoc = await db.collection('users').doc(user.uid).get();
    const profile = profileDoc.data();
    console.log(profile.bio); // User's bio
}
```

### Update User Profile
```javascript
await window.userAuth.updateProfile({
    bio: 'My new bio text'
});
```

### Create Theory (Example)
```javascript
const user = window.userAuth.getCurrentUser();
if (!user) {
    alert('Please sign in to submit a theory');
    return;
}

await db.collection('theories').add({
    title: 'My Theory',
    content: 'Theory content...',
    authorId: user.uid,
    authorName: user.displayName,
    authorAvatar: user.photoURL,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'published'
});
```

## Common Patterns

### Protect Submission Form
```javascript
const submitBtn = document.getElementById('submit-theory');
submitBtn.addEventListener('click', () => {
    if (!window.userAuth.isLoggedIn()) {
        window.userAuth.showLoginModal();
        return;
    }

    // Proceed with submission
    submitTheory();
});
```

### Show User-Specific Content
```javascript
window.userAuth.onAuthStateChanged((user) => {
    const myTheoriesLink = document.getElementById('my-theories');

    if (user) {
        myTheoriesLink.href = `/theories/user/${user.uid}`;
        myTheoriesLink.style.display = 'block';
    } else {
        myTheoriesLink.style.display = 'none';
    }
});
```

### Auto-Fill User Info
```javascript
window.userAuth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('author-name').value = user.displayName;
        document.getElementById('author-email').value = user.email;
    }
});
```

## Testing Checklist

- [ ] Firebase config file created and valid
- [ ] Google auth enabled in Firebase Console
- [ ] Sign-in button appears
- [ ] Clicking button opens Google popup
- [ ] Can select Google account
- [ ] Profile photo and name appear after sign-in
- [ ] Page refresh keeps user logged in
- [ ] Multi-tab sync works (sign out in one tab updates others)
- [ ] User document created in Firestore `users` collection
- [ ] Sign-out works correctly

## Troubleshooting

**"Firebase SDK not loaded"**
- Check Firebase CDN scripts are before `firebase-auth.js`
- Verify no script loading errors in console

**"Pop-up blocked"**
- Allow pop-ups for this site
- Check browser extensions blocking pop-ups

**"Configuration error"**
- Verify `firebase-config.js` exists
- Check all placeholder values replaced
- Confirm project ID matches Firebase Console

**Session not persisting**
- Check cookies enabled
- Verify localStorage not disabled
- Clear cache and retry

## File Structure

```
your-project/
├── firebase-config.js          (Your config - DO NOT commit)
├── firebase-config.template.js (Template with instructions)
├── auth-modal-firebase.html    (Auth modal template)
├── js/
│   ├── firebase-auth.js        (Main auth module)
│   └── components/
│       └── google-signin-button.js (Button component)
└── css/
    └── user-auth.css           (Auth styles)
```

## Security Notes

- ✅ Firebase API key is public-safe (restricted by domain)
- ✅ Never commit `firebase-config.js` to git
- ✅ Use Firestore security rules to protect data
- ✅ Google handles all password security
- ✅ Session tokens automatically managed by Firebase

## Next Steps

1. **Test authentication** on your pages
2. **Add image upload** (Phase 3) - see `BACKEND_MIGRATION_PLAN.md`
3. **Migrate theories to Firestore** (Phase 4)
4. **Implement public viewing** (Phase 5)
5. **Add edit restrictions** (Phase 6)

## Support

- **Full Documentation**: `FIREBASE_AUTH_IMPLEMENTATION_SUMMARY.md`
- **Setup Guide**: `FIREBASE_SETUP_GUIDE.md`
- **Migration Plan**: `BACKEND_MIGRATION_PLAN.md`
- **Firebase Docs**: https://firebase.google.com/docs/auth

---

**Quick Start Version**: 1.0
**Last Updated**: December 6, 2024
