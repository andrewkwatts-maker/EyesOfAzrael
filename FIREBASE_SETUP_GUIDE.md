# Firebase Setup Guide
## Eyes of Azrael Theory System

This guide will walk you through setting up Firebase for the Eyes of Azrael theory system, from creating a Firebase project to deploying security rules.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Firebase Project](#create-firebase-project)
3. [Enable Google Authentication](#enable-google-authentication)
4. [Set Up Firestore Database](#set-up-firestore-database)
5. [Enable Firebase Storage](#enable-firebase-storage)
6. [Get Configuration Values](#get-configuration-values)
7. [Configure Your Application](#configure-your-application)
8. [Deploy Security Rules](#deploy-security-rules)
9. [Add Firebase SDK to HTML Pages](#add-firebase-sdk-to-html-pages)
10. [Testing Your Setup](#testing-your-setup)
11. [Monitoring & Quotas](#monitoring--quotas)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

- A Google account (free Gmail account works)
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Basic understanding of HTML and JavaScript
- Node.js installed (for Firebase CLI - optional but recommended)

---

## 1. Create Firebase Project

### Step 1.1: Go to Firebase Console

1. Open your browser and go to: https://console.firebase.google.com
2. Sign in with your Google account
3. Click **"Add project"** or **"Create a project"**

### Step 1.2: Configure Project

1. **Project Name**
   - Enter a name: `Eyes-of-Azrael` (or your preferred name)
   - This creates a unique Project ID like `eyes-of-azrael-a1b2c`
   - Click **"Continue"**

2. **Google Analytics** (optional)
   - Toggle OFF if you don't need analytics (recommended for simplicity)
   - Or toggle ON and select/create an Analytics account
   - Click **"Create project"**

3. **Wait for project creation** (takes 30-60 seconds)
4. Click **"Continue"** when ready

---

## 2. Enable Google Authentication

### Step 2.1: Navigate to Authentication

1. In the Firebase Console, select your project
2. In the left sidebar, click **"Build"** → **"Authentication"**
3. Click **"Get started"**

### Step 2.2: Enable Google Sign-In

1. Click the **"Sign-in method"** tab
2. Find **"Google"** in the list of providers
3. Click on **"Google"**
4. Toggle the **"Enable"** switch to ON
5. **Project support email**: Select your email from the dropdown
6. Click **"Save"**

### Step 2.3: Add Authorized Domains

1. Still in Authentication, click the **"Settings"** tab
2. Scroll to **"Authorized domains"**
3. By default, `localhost` and your Firebase Hosting domain are included
4. To add custom domains:
   - Click **"Add domain"**
   - Enter your domain (e.g., `eyesofazrael.com`)
   - Click **"Add"**

**Note:** For local development, `localhost` is already authorized.

---

## 3. Set Up Firestore Database

### Step 3.1: Create Database

1. In the left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**

### Step 3.2: Choose Security Rules Mode

1. **Start in production mode** (recommended)
   - Select **"Start in production mode"**
   - We'll deploy custom rules later
   - Click **"Next"**

2. **Choose Location**
   - Select a Cloud Firestore location (closest to your users)
   - Examples:
     - `us-central1` (Iowa) - Good for USA
     - `europe-west1` (Belgium) - Good for Europe
     - `asia-northeast1` (Tokyo) - Good for Asia
   - **Warning:** Location CANNOT be changed later!
   - Click **"Enable"**

3. **Wait for database creation** (takes 1-2 minutes)

### Step 3.3: Verify Database

You should see an empty Firestore Database with:
- A **"Data"** tab (empty for now)
- A **"Rules"** tab (default deny-all rules)
- An **"Indexes"** tab
- A **"Usage"** tab

---

## 4. Enable Firebase Storage

### Step 4.1: Navigate to Storage

1. In the left sidebar, click **"Build"** → **"Storage"**
2. Click **"Get started"**

### Step 4.2: Configure Security Rules

1. **Start in production mode** (recommended)
   - Select **"Start in production mode"**
   - We'll deploy custom rules later
   - Click **"Next"**

2. **Choose Location**
   - Use the SAME location as Firestore (automatically selected)
   - Click **"Done"**

3. **Wait for storage initialization** (takes 30 seconds)

### Step 4.3: Verify Storage

You should see:
- A **"Files"** tab (empty bucket)
- A **"Rules"** tab (default deny-all rules)
- A **"Usage"** tab

---

## 5. Get Configuration Values

### Step 5.1: Register Web App

1. In Firebase Console, go to **Project Overview** (home icon in sidebar)
2. Click the **"</>"** icon to add a web app
3. **Register app:**
   - **App nickname**: `Eyes of Azrael Web App`
   - **Firebase Hosting**: Check this box if you plan to use Firebase Hosting
   - Click **"Register app"**

### Step 5.2: Copy Configuration

You'll see a code snippet like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyABcDeFgHiJkLmNoPqRsTuVwXyZ1234567",
  authDomain: "eyes-of-azrael.firebaseapp.com",
  projectId: "eyes-of-azrael",
  storageBucket: "eyes-of-azrael.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl",
  measurementId: "G-ABC123DEF4"
};
```

**COPY THIS ENTIRE OBJECT** - you'll need it in the next step!

Click **"Continue to console"** when done.

### Step 5.3: Retrieve Config Later (if needed)

If you need to find your config again:

1. Go to **Project Overview** (gear icon) → **Project settings**
2. Scroll down to **"Your apps"** section
3. Find your web app
4. Click **"Config"** radio button (not SDK snippet)
5. Copy the `firebaseConfig` object

---

## 6. Configure Your Application

### Step 6.1: Create firebase-config.js

1. **Copy the template file:**
   ```bash
   cp firebase-config.template.js firebase-config.js
   ```

2. **Open `firebase-config.js` in your text editor**

3. **Replace placeholder values** with your actual Firebase config from Step 5.2

4. **Save the file**

The file should look like this after editing (with your actual values):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123..."
};
```

### Step 6.2: Configure .firebaserc

1. **Open `.firebaserc` in your text editor**

2. **Replace `YOUR_PROJECT_ID_HERE`** with your actual Firebase project ID (same as in config)

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### Step 6.3: Add to .gitignore

**IMPORTANT:** Never commit `firebase-config.js` to version control!

1. Open `.gitignore` (or create it if it doesn't exist)
2. Add this line:
   ```
   firebase-config.js
   ```
3. Save and commit `.gitignore`

**Why?** While the API key is public (used in client-side code), it's best practice to keep config files separate and use environment-specific configs.

---

## 7. Deploy Security Rules

### Step 7.1: Install Firebase CLI (Recommended)

The Firebase CLI makes deploying rules much easier.

**Install:**
```bash
npm install -g firebase-tools
```

**Login:**
```bash
firebase login
```

This will open a browser window to authenticate with Google.

### Step 7.2: Deploy Rules

The `firestore.rules` and `storage.rules` files are already created in your project.

**Deploy Firestore rules:**
```bash
firebase deploy --only firestore:rules
```

**Deploy Storage rules:**
```bash
firebase deploy --only storage
```

**Or deploy both at once:**
```bash
firebase deploy --only firestore:rules,storage
```

**Verify deployment:**
- Check Firebase Console → Firestore → Rules tab
- Check Firebase Console → Storage → Rules tab

### Step 7.3: Alternative - Manual Deployment (No CLI)

If you don't want to use Firebase CLI:

**For Firestore Rules:**
1. Open `firestore.rules` in your text editor
2. Copy the entire contents
3. Go to Firebase Console → Firestore Database → Rules tab
4. Paste the rules
5. Click **"Publish"**

**For Storage Rules:**
1. Open `storage.rules` in your text editor
2. Copy the entire contents
3. Go to Firebase Console → Storage → Rules tab
4. Paste the rules
5. Click **"Publish"**

---

## 8. Add Firebase SDK to HTML Pages

### Step 8.1: Add CDN Scripts to HTML

Add these script tags to your HTML pages **before the closing `</body>` tag**:

```html
<!-- Firebase SDK (Compat mode for easier migration) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>

<!-- Your Firebase Config -->
<script src="/firebase-config.js"></script>

<!-- Firebase Initialization Module -->
<script src="/js/firebase-init.js"></script>

<!-- Your other scripts that use Firebase -->
<script src="/js/your-app.js"></script>
```

**Order matters:**
1. Firebase SDK scripts (from CDN)
2. `firebase-config.js` (your config)
3. `firebase-init.js` (initialization)
4. Your application scripts

### Step 8.2: Example HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eyes of Azrael - Theory System</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div id="app">
        <h1>Theory System</h1>
        <div id="auth-status">Loading...</div>
        <button id="sign-in-btn">Sign In with Google</button>
    </div>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>

    <!-- Firebase Config & Init -->
    <script src="/firebase-config.js"></script>
    <script src="/js/firebase-init.js"></script>

    <!-- Your App Scripts -->
    <script>
        // Wait for Firebase to initialize
        waitForFirebase().then(() => {
            console.log('Firebase ready!');

            // Listen for auth state changes
            window.addEventListener('firebaseAuthStateChanged', (event) => {
                const { user } = event.detail;
                const statusDiv = document.getElementById('auth-status');

                if (user) {
                    statusDiv.textContent = `Signed in as ${user.displayName}`;
                } else {
                    statusDiv.textContent = 'Not signed in';
                }
            });

            // Sign in button
            document.getElementById('sign-in-btn').addEventListener('click', () => {
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider)
                    .then(result => console.log('Signed in:', result.user))
                    .catch(error => console.error('Sign in error:', error));
            });
        });
    </script>
</body>
</html>
```

---

## 9. Testing Your Setup

### Step 9.1: Test Firebase Connection

1. **Open your website** in a browser (use a local server, not `file://`)
   ```bash
   # Simple Python server
   python -m http.server 8000

   # Or Node.js server
   npx http-server
   ```

2. **Open browser console** (F12 or Right-click → Inspect)

3. **Look for success messages:**
   ```
   Firebase initialized successfully
   Firebase services initialized: {auth: true, firestore: true, storage: true}
   Firebase initialization module loaded
   ```

### Step 9.2: Test Google Sign-In

1. Click the "Sign in with Google" button
2. Select your Google account
3. Grant permissions
4. Check console for:
   ```
   User signed in: abc123...
   User profile loaded: {username: "...", email: "..."}
   ```

### Step 9.3: Test Firestore Write

```javascript
// Test creating a user profile
FirebaseService.createUserProfile({
  uid: 'test123',
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: 'https://example.com/photo.jpg'
}).then(() => {
  console.log('User profile created successfully!');
});
```

Check Firebase Console → Firestore → Data tab to see the new document.

### Step 9.4: Test Storage Upload

```javascript
// Test image upload
const file = new File(['test'], 'test.png', { type: 'image/png' });
const storageRef = storage.ref('theory-images/test123/theory456/test.png');

storageRef.put(file).then(snapshot => {
  return snapshot.ref.getDownloadURL();
}).then(url => {
  console.log('File uploaded! URL:', url);
});
```

Check Firebase Console → Storage → Files tab to see the uploaded file.

---

## 10. Monitoring & Quotas

### Step 10.1: Check Usage

**Firestore:**
1. Firebase Console → Firestore → Usage tab
2. Monitor:
   - Document reads/writes/deletes
   - Storage size
   - Network egress

**Storage:**
1. Firebase Console → Storage → Usage tab
2. Monitor:
   - Total storage used
   - Downloads
   - Uploads

### Step 10.2: Free Tier Limits

**Firestore:**
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

**Storage:**
- 5 GB total storage
- 1 GB/day downloads
- 20,000 uploads/day

**Authentication:**
- Unlimited (free)

### Step 10.3: Set Up Quota Alerts

1. Firebase Console → Project Overview → Usage and billing
2. Click **"Details & settings"**
3. Set up budget alerts (requires Blaze plan for paid features)

**Note:** Free tier = "Spark" plan. Upgrade to "Blaze" for pay-as-you-go.

---

## 11. Troubleshooting

### Problem: "Firebase SDK not loaded" error

**Solution:**
- Check that Firebase CDN scripts are loaded before `firebase-config.js`
- Open Network tab in DevTools to verify scripts loaded successfully
- Check for CORS errors (use a local server, not `file://` protocol)

### Problem: "Firebase configuration not found" error

**Solution:**
- Make sure `firebase-config.js` exists and is loaded before `firebase-init.js`
- Verify you replaced all placeholder values
- Check browser console for JavaScript errors

### Problem: "Permission denied" when reading/writing data

**Solution:**
- Check security rules in Firebase Console
- Make sure rules are deployed (`firebase deploy --only firestore:rules,storage`)
- For Firestore: Verify `status == 'published'` for public reads
- For Storage: Verify user is authenticated and uploading to their own folder

### Problem: Google Sign-In popup blocked

**Solution:**
- Allow popups in your browser settings
- Add your domain to Firebase authorized domains
- Use `signInWithRedirect()` instead of `signInWithPopup()` on mobile

### Problem: Images not loading from Storage

**Solution:**
- Check CORS configuration in Storage
- Verify file permissions (should have public read)
- Check browser Network tab for 403/404 errors
- Ensure download URLs are being used (not `gs://` URLs)

### Problem: Exceeding free tier quotas

**Solution:**
- Implement pagination (load 20 items at a time)
- Use caching to reduce reads
- Compress images before upload
- Consider upgrading to Blaze plan

---

## 12. Optional: Firebase Hosting

If you want to host your site on Firebase:

### Step 12.1: Initialize Hosting

```bash
firebase init hosting
```

Select your project and configure:
- **Public directory:** `.` (current directory)
- **Single-page app:** `y` (yes)
- **Automatic builds:** `n` (no)

### Step 12.2: Deploy

```bash
firebase deploy --only hosting
```

Your site will be live at: `https://YOUR_PROJECT_ID.web.app`

### Step 12.3: Custom Domain (Optional)

1. Firebase Console → Hosting
2. Click **"Add custom domain"**
3. Follow DNS configuration steps
4. Wait for SSL certificate (24-48 hours)

---

## Next Steps

Now that Firebase is set up, the following agents will implement the integration:

1. **Agent 2:** Google OAuth Integration
2. **Agent 3:** Image Upload Component
3. **Agent 4:** Firestore Integration
4. **Agent 5:** Public Access Implementation
5. **Agent 6:** Ownership Enforcement
6. **Agent 7:** Frontend Updates
7. **Agent 8:** LocalStorage to Firebase Migration
8. **Agent 9:** Integration Testing
9. **Agent 10:** Deployment Setup

---

## Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Firebase Console:** https://console.firebase.google.com
- **Firestore Security Rules:** https://firebase.google.com/docs/firestore/security/get-started
- **Storage Security Rules:** https://firebase.google.com/docs/storage/security
- **Firebase CLI Reference:** https://firebase.google.com/docs/cli

---

## Free Tier Summary

| Service | Free Tier Limit | What This Means |
|---------|----------------|-----------------|
| **Firestore** | 1GB storage | ~200,000 theory documents |
| | 50K reads/day | ~2,500 users browsing 20 theories each |
| | 20K writes/day | ~800 new theories per day |
| **Storage** | 5GB total | ~1,000 high-quality images |
| | 1GB/day downloads | ~200 image views per day |
| | 20K uploads/day | More than enough |
| **Authentication** | Unlimited | Always free |
| **Hosting** | 10GB/month | ~5,000 page loads/month |

**For most websites, the free tier is sufficient for months or years of growth.**

---

## Security Best Practices

1. **Never commit `firebase-config.js` with real values to public repositories**
   - Add to `.gitignore`
   - Use `firebase-config.template.js` as a template

2. **Always use production mode security rules**
   - Never use "test mode" in production
   - Validate all user input in rules
   - Restrict access based on authentication

3. **Monitor your quotas regularly**
   - Set up alerts for 80% usage
   - Implement rate limiting
   - Use caching to reduce reads

4. **Validate user input**
   - Check file sizes before upload (max 5MB)
   - Sanitize text content
   - Limit upload frequency per user

---

**Setup Complete!** You now have a fully configured Firebase backend for Eyes of Azrael.

For questions or issues:
- Check the [Troubleshooting](#troubleshooting) section above
- Review [Firebase Documentation](https://firebase.google.com/docs)
- Contact [Firebase Support](https://firebase.google.com/support)
