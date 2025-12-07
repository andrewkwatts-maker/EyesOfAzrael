# Firebase Quick Start Guide
## Eyes of Azrael - User Theories System

**Fast Setup:** Complete Firebase configuration in 15 minutes.

---

## Files Created & Ready

Your Firebase setup is complete! Here's what's been configured:

### Configuration Files

- `firebase-config.js` - **Main config file** (needs your credentials)
- `firebase-config.template.js` - Template/reference (safe in Git)
- `.firebaserc` - Project ID config (needs your project ID)
- `firebase.json` - Hosting & emulator settings (ready)
- `firestore.rules` - Database security rules (ready)
- `firestore.indexes.json` - Database indexes (ready)
- `storage.rules` - Storage security rules (ready)
- `.gitignore` - Protects secrets from Git (ready)

### Documentation

- `FIREBASE_SETUP_INSTRUCTIONS.md` - **Detailed setup guide** (30 min read)
- `FIREBASE_DEPLOYMENT_CHECKLIST.md` - **Deployment steps** (reference)
- `FIREBASE_QUICK_START.md` - **This file** (quick reference)

### Pages Updated with Firebase SDK

All user theory pages now include Firebase SDK:

- `theories/user-submissions/submit.html` - Theory submission
- `theories/user-submissions/browse.html` - Browse theories
- `theories/user-submissions/view.html` - View theory details
- `theories/user-submissions/edit.html` - Edit theories

---

## Quick Setup (3 Steps)

### Step 1: Create Firebase Project (5 min)

1. Go to: https://console.firebase.google.com
2. Click "Add project"
3. Name it: `eyes-of-azrael` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Services (5 min)

**Authentication:**
1. Build > Authentication > Get started
2. Sign-in method > Google > Enable
3. Save

**Firestore:**
1. Build > Firestore Database > Create database
2. Production mode > Next
3. Choose location (closest to users) > Enable

**Storage:**
1. Build > Storage > Get started
2. Production mode > Next
3. Same location as Firestore > Done

### Step 3: Configure Locally (5 min)

**Get Firebase Config:**
1. Project Settings (gear icon) > General
2. Scroll to "Your apps"
3. Click Web icon (`</>`)
4. Copy the `firebaseConfig` object

**Update firebase-config.js:**
1. Open `firebase-config.js`
2. Replace all `YOUR_...` placeholders with your values
3. Save file

**Update .firebaserc:**
1. Open `.firebaserc`
2. Replace `YOUR_PROJECT_ID_HERE` with your project ID
3. Save file

**Done!** Test locally:
```bash
# Open submit.html in browser
# Sign in with Google should work
```

---

## Deploy (3 Commands)

Install Firebase CLI (one-time):
```bash
npm install -g firebase-tools
firebase login
```

Deploy to Firebase:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only hosting
```

Your site is live at: `https://your-project-id.web.app`

---

## Testing Checklist

After setup, test these features:

- [ ] Sign in with Google
- [ ] Create a theory
- [ ] Upload an image
- [ ] Browse theories
- [ ] View a theory
- [ ] Vote on a theory
- [ ] Comment on a theory
- [ ] Edit your theory
- [ ] Delete your theory

All working? You're done!

---

## Troubleshooting

### "Firebase SDK not loaded"

**Fix:** Check that Firebase CDN scripts are loading in your HTML files.

### "Configuration contains placeholder values"

**Fix:** Update `firebase-config.js` with your actual Firebase credentials.

### "Permission denied"

**Fix:** Deploy security rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### "storage/unauthorized" on image upload

**Fix:** Storage rules not deployed. Run:
```bash
firebase deploy --only storage:rules
```

---

## Key Files Explained

### firebase-config.js (YOU MUST UPDATE THIS)

Contains your Firebase project credentials. **Critical:** Replace all placeholders!

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",          // Replace!
  authDomain: "YOUR_PROJECT.firebaseapp.com",  // Replace!
  projectId: "YOUR_PROJECT_ID",         // Replace!
  storageBucket: "YOUR_PROJECT.appspot.com",   // Replace!
  messagingSenderId: "123456789012",    // Replace!
  appId: "1:123...:web:abc...",         // Replace!
  measurementId: "G-XXXXXXXXXX"         // Optional
};
```

### .firebaserc (UPDATE PROJECT ID)

Tells Firebase CLI which project to use:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### firestore.rules (READY)

Security rules for database. Already configured for:
- Public read of published theories
- Authenticated write (logged-in users only)
- Ownership verification (users can only edit their own)

### storage.rules (READY)

Security rules for image storage. Already configured for:
- Public read of all images
- Authenticated upload only
- 5MB file size limit
- Image file types only

---

## What Happens When You Load a Page?

1. **Browser loads Firebase SDK** from CDN (firebasejs)
2. **firebase-config.js runs** and initializes Firebase
3. **Checks configuration** - shows error if placeholders remain
4. **Connects to Firebase services** (Auth, Firestore, Storage)
5. **Sets up offline persistence** (works without internet)
6. **Exports to window object** (available globally as `window.firebaseAuth`, etc.)

If configured correctly, you'll see in console:
```
✅ Firebase app initialized successfully
✅ Firebase services initialized:
   - Authentication: true
   - Firestore Database: true
   - Cloud Storage: true
✅ FIREBASE READY
```

If not configured, you'll see:
```
🔴 FIREBASE CONFIGURATION ERROR
Firebase configuration contains placeholder values...
```

---

## Security Notes

### Safe to Commit to Git

- `firebase-config.template.js` - Template only
- `.firebaserc` - Just project ID
- `firebase.json` - Hosting config
- `firestore.rules` - Security rules
- `storage.rules` - Security rules
- All HTML files

### NEVER Commit to Git

- `firebase-config.js` - Contains API keys (protected by .gitignore)
- `.firebase/` - Firebase cache
- `firebase-debug.log` - Debug logs
- Any `*-firebase-adminsdk-*.json` service account keys

### Why API Keys Are Safe in Client Code

Firebase API keys are **not secret** - they're meant to be public:
- They identify your Firebase project
- Real security comes from Firebase Security Rules
- Rules control who can read/write data
- Rules are enforced server-side (can't be bypassed)

Still, we use .gitignore to:
- Keep Git history clean
- Avoid confusion
- Follow best practices

---

## Free Tier Limits

**Firestore Database:**
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

**Cloud Storage:**
- 5 GB storage
- 1 GB downloads/day
- 20,000 uploads/day

**Authentication:**
- Unlimited Google sign-ins
- 3,000 SMS verifications/month (if you add phone auth)

**Need more?** Upgrade to Blaze (pay-as-you-go) plan.

---

## Next Steps

After completing basic setup:

1. **Read FIREBASE_SETUP_INSTRUCTIONS.md** for detailed setup
2. **Review FIREBASE_DEPLOYMENT_CHECKLIST.md** before deploying
3. **Test all features** locally before deploying
4. **Deploy security rules** before launching
5. **Set up monitoring** in Firebase Console
6. **Configure custom domain** (optional)

---

## Getting Help

**Documentation:**
- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)

**Project Docs:**
- `FIREBASE_SETUP_INSTRUCTIONS.md` - Detailed setup
- `FIREBASE_DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `API_REFERENCE.md` - API documentation

**Support:**
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase Community](https://firebase.google.com/community)
- [Firebase Support](https://firebase.google.com/support)

---

## Summary

**You have everything you need!**

1. ✅ Firebase configuration files created
2. ✅ Security rules configured
3. ✅ HTML pages updated with Firebase SDK
4. ✅ .gitignore protecting secrets
5. ✅ Documentation complete

**What you need to do:**

1. Create Firebase project (5 min)
2. Enable services (5 min)
3. Update firebase-config.js (5 min)
4. Test locally (5 min)
5. Deploy (5 min)

**Total time:** 25 minutes to go live!

---

*Good luck with your deployment! May your theories be insightful and your queries be fast.*

---

*Last updated: 2025-12-07*
*Firebase SDK Version: 10.7.1*
