# Firebase Setup Instructions
## Eyes of Azrael User Theories System

This guide walks you through setting up Firebase for the Eyes of Azrael user theories system. Follow these steps carefully to enable authentication, database, and storage features.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Firebase Project](#create-firebase-project)
3. [Enable Google Authentication](#enable-google-authentication)
4. [Create Firestore Database](#create-firestore-database)
5. [Create Storage Bucket](#create-storage-bucket)
6. [Get Firebase Configuration](#get-firebase-configuration)
7. [Configure Local Project](#configure-local-project)
8. [Deploy Security Rules](#deploy-security-rules)
9. [Test Your Setup](#test-your-setup)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, you'll need:

- **Google Account** - Free Gmail account
- **Firebase Project** - We'll create this together
- **Firebase CLI** - Install with: `npm install -g firebase-tools`
- **Node.js** - Version 14 or higher (for Firebase CLI)

**Estimated Time:** 20-30 minutes

---

## Step 1: Create Firebase Project

### 1.1 Go to Firebase Console

1. Open your browser and navigate to: [https://console.firebase.google.com](https://console.firebase.google.com)
2. Sign in with your Google account

### 1.2 Create New Project

1. Click **"Add project"** or **"Create a project"**
2. Enter a project name:
   - Suggested: `eyes-of-azrael` or `eyes-of-azrael-theories`
   - This name will be part of your URLs (e.g., `eyes-of-azrael.firebaseapp.com`)
3. Click **"Continue"**

### 1.3 Google Analytics (Optional)

1. You'll be asked if you want to enable Google Analytics
   - **Recommended:** Toggle OFF (not needed for this project)
   - If you enable it, you'll need to create or select a Google Analytics account
2. Click **"Create project"**

### 1.4 Wait for Project Creation

- Firebase will set up your project (takes 30-60 seconds)
- Click **"Continue"** when ready

**Screenshot Suggestion:** Take a screenshot of your project dashboard showing the project name.

---

## Step 2: Enable Google Authentication

### 2.1 Navigate to Authentication

1. In the Firebase Console, look at the left sidebar
2. Click **"Build"** to expand the menu (if collapsed)
3. Click **"Authentication"**
4. Click **"Get started"** button

### 2.2 Enable Google Sign-In Provider

1. Click on the **"Sign-in method"** tab at the top
2. You'll see a list of sign-in providers
3. Find **"Google"** in the list
4. Click on **"Google"** to expand it
5. Click the **"Enable"** toggle switch (top right)

### 2.3 Configure Google Provider

1. **Project support email:**
   - Select your email address from the dropdown
   - This is shown to users during sign-in
2. Click **"Save"**

### 2.4 Add Authorized Domain (if needed)

1. Scroll down to **"Authorized domains"**
2. By default, `localhost` and your Firebase hosting domain are included
3. If you plan to deploy to a custom domain:
   - Click **"Add domain"**
   - Enter your domain (e.g., `eyesofazrael.com`)
   - Click **"Add"**

**Verification:** You should see "Google" provider listed as "Enabled" with a green checkmark.

---

## Step 3: Create Firestore Database

### 3.1 Navigate to Firestore

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"** button

### 3.2 Choose Security Rules Mode

1. You'll see two options:
   - **Production mode** (Deny all reads/writes by default)
   - **Test mode** (Allow all reads/writes for 30 days)

2. **Select: "Production mode"**
   - Don't worry, we'll deploy proper security rules later
   - This is more secure while setting up
3. Click **"Next"**

### 3.3 Choose Database Location

1. Select a location closest to your users:
   - **US:** `us-central1` (Iowa) or `us-east1` (South Carolina)
   - **Europe:** `europe-west1` (Belgium) or `europe-west3` (Frankfurt)
   - **Asia:** `asia-southeast1` (Singapore) or `asia-northeast1` (Tokyo)

2. **Important:** Location cannot be changed after creation!

3. Click **"Enable"**

### 3.4 Wait for Database Creation

- Firestore will provision your database (takes 30-60 seconds)
- You'll see a screen showing "Cloud Firestore" with an empty database

**Verification:** You should see the Firestore console with tabs for "Data", "Rules", "Indexes", etc.

---

## Step 4: Create Storage Bucket

### 4.1 Navigate to Storage

1. In the left sidebar, click **"Storage"**
2. Click **"Get started"** button

### 4.2 Set Up Security Rules

1. You'll see a dialog about security rules
2. **Select: "Start in production mode"**
   - We'll deploy proper rules later
3. Click **"Next"**

### 4.3 Choose Storage Location

1. Select the **same location** you chose for Firestore
   - This ensures data locality and reduces latency
2. Click **"Done"**

### 4.4 Wait for Bucket Creation

- Firebase will create your storage bucket
- You'll see the Storage console with a "Files" tab

**Verification:** You should see an empty storage bucket ready to use.

---

## Step 5: Get Firebase Configuration

### 5.1 Navigate to Project Settings

1. Click the **gear icon** ⚙️ next to "Project Overview" (top left)
2. Click **"Project settings"**

### 5.2 Register Web App

1. Scroll down to **"Your apps"** section
2. If you don't see a web app yet:
   - Click the **"Web"** icon (`</>`)
   - Enter an app nickname: `Eyes of Azrael Web App`
   - **Do NOT** check "Also set up Firebase Hosting" (we'll do this manually)
   - Click **"Register app"**

### 5.3 Copy Firebase Configuration

1. You'll see a code snippet with your Firebase config
2. Look for the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyABcDeFgHiJkLmNoPqRsTuVwXyZ1234567",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl",
  measurementId: "G-ABC123DEF4"
};
```

3. **Copy these values** - you'll need them in the next step

**Important:** Keep this page open or save these values somewhere safe!

---

## Step 6: Configure Local Project

### 6.1 Open firebase-config.js

1. In your project folder, locate: `firebase-config.js`
2. Open it in your code editor

### 6.2 Replace Placeholder Values

Replace each placeholder with the actual values from your Firebase config:

```javascript
const firebaseConfig = {
  // Replace YOUR_API_KEY_HERE with your actual apiKey
  apiKey: "AIzaSyABcDeFgHiJkLmNoPqRsTuVwXyZ1234567",

  // Replace YOUR_PROJECT_ID with your actual projectId (appears 3 times)
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",

  // Replace YOUR_MESSAGING_SENDER_ID with your actual messagingSenderId
  messagingSenderId: "123456789012",

  // Replace YOUR_APP_ID with your actual appId
  appId: "1:123456789012:web:abc123def456ghi789jkl",

  // Replace G-XXXXXXXXXX with your actual measurementId (optional)
  measurementId: "G-ABC123DEF4"
};
```

### 6.3 Save the File

1. Save `firebase-config.js`
2. **Important:** Do NOT commit this file to Git!
   - It contains your API keys
   - We've added it to `.gitignore` to protect it

### 6.4 Update .firebaserc

1. Open `.firebaserc` in your code editor
2. Find the line with `"YOUR_PROJECT_ID_HERE"`
3. Replace it with your actual project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

4. Save the file

**Verification:** Open a test HTML file in your browser and check the console. You should see "Firebase initialized successfully" with no errors.

---

## Step 7: Deploy Security Rules

Now we'll deploy the security rules to protect your data.

### 7.1 Install Firebase CLI

If you haven't installed Firebase CLI yet:

```bash
npm install -g firebase-tools
```

### 7.2 Login to Firebase

```bash
firebase login
```

This will open a browser window for you to sign in with your Google account.

### 7.3 Initialize Firebase (if needed)

If you haven't initialized Firebase in this project:

```bash
firebase init
```

1. Select:
   - ✅ Firestore
   - ✅ Storage
   - ✅ Hosting
2. Use existing project: Select your project from the list
3. For all other prompts, press Enter to accept defaults

### 7.4 Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

**Expected output:**
```
✔  Deploy complete!
```

### 7.5 Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

**Expected output:**
```
✔  Deploy complete!
```

### 7.6 Verify Rules Deployment

1. Go to Firebase Console > Firestore Database > Rules
2. You should see your security rules (not the default ones)
3. Go to Firebase Console > Storage > Rules
4. You should see your storage rules

**Security Check:**
- Firestore: Public read for published theories, authenticated write
- Storage: Public read for images, authenticated upload only

---

## Step 8: Test Your Setup

### 8.1 Test Authentication

1. Open your project in a browser: `http://localhost:5000` (or your local server)
2. Navigate to: `theories/user-submissions/submit.html`
3. Click "Sign in with Google"
4. Complete the Google sign-in flow
5. You should be logged in and see your profile picture

**Expected Result:** Successful sign-in with no errors in console.

### 8.2 Test Theory Creation

1. While logged in, fill out the theory submission form
2. Add a title, content, and topic
3. Click "Submit Theory"
4. Check Firebase Console > Firestore Database > Data
5. You should see a new document in the `theories` collection

**Expected Result:** Theory appears in Firestore with all fields populated.

### 8.3 Test Image Upload

1. In the theory editor, click "Add Image"
2. Select an image file (< 5MB, JPEG/PNG)
3. Wait for upload to complete
4. Check Firebase Console > Storage > Files
5. You should see the image in `theory-images/{userId}/{theoryId}/`

**Expected Result:** Image uploads successfully and appears in Storage.

### 8.4 Test Browse & View

1. Navigate to: `theories/user-submissions/browse.html`
2. You should see your submitted theory listed
3. Click on the theory to view it
4. Verify all content displays correctly

**Expected Result:** Theories display with all data, images, and metadata.

---

## Step 9: Enable Firebase Hosting (Optional)

If you want to deploy your site to Firebase Hosting:

### 9.1 Deploy to Hosting

```bash
firebase deploy --only hosting
```

### 9.2 Access Your Live Site

After deployment completes, you'll see a hosting URL:
```
https://your-project-id.web.app
```

Visit this URL to see your live site!

---

## Troubleshooting

### Common Issues & Solutions

#### ❌ "Firebase SDK not loaded"

**Problem:** Firebase scripts aren't loading before `firebase-config.js`

**Solution:**
1. Check that Firebase CDN scripts are in your HTML
2. Ensure `firebase-config.js` is loaded AFTER Firebase SDK scripts
3. Check browser console for network errors

#### ❌ "Configuration contains placeholder values"

**Problem:** You haven't updated `firebase-config.js` with your actual credentials

**Solution:**
1. Open `firebase-config.js`
2. Replace ALL placeholder values (YOUR_API_KEY_HERE, etc.)
3. Save and refresh your browser

#### ❌ "Permission denied" when reading/writing

**Problem:** Security rules haven't been deployed or are incorrect

**Solution:**
1. Run: `firebase deploy --only firestore:rules`
2. Run: `firebase deploy --only storage:rules`
3. Check Firebase Console > Firestore/Storage > Rules to verify deployment

#### ❌ "Auth domain is not authorized"

**Problem:** Your domain isn't in the authorized domains list

**Solution:**
1. Firebase Console > Authentication > Settings > Authorized domains
2. Add your domain (e.g., `localhost`, `eyesofazrael.com`)
3. Click "Add"

#### ❌ Image upload fails with "storage/unauthorized"

**Problem:** Storage rules haven't been deployed

**Solution:**
1. Run: `firebase deploy --only storage:rules`
2. Verify rules in Firebase Console > Storage > Rules

#### ❌ "Failed to get document" errors

**Problem:** Firestore rules are blocking reads

**Solution:**
1. Check Firebase Console > Firestore > Rules
2. Verify public read access for published theories
3. Re-deploy rules: `firebase deploy --only firestore:rules`

---

## Security Best Practices

### ✅ DO:

- Keep `firebase-config.js` in `.gitignore`
- Use environment variables for sensitive data in production
- Deploy security rules before going live
- Enable App Check for production (advanced)
- Monitor usage in Firebase Console

### ❌ DON'T:

- Commit API keys to Git
- Use test mode in production
- Share your Firebase config publicly
- Disable security rules
- Ignore quota warnings

---

## Quota Limits (Free Tier)

**Firestore:**
- 1 GB stored
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

**Storage:**
- 5 GB stored
- 1 GB/day downloads
- 20,000 uploads/day

**Authentication:**
- Unlimited users
- 3,000 phone authentications/month

**What happens if I exceed limits?**
- Free tier: Service stops until next day
- Solution: Upgrade to Blaze (pay-as-you-go) plan

---

## Next Steps

After completing setup:

1. ✅ Test all features (auth, theories, images, comments)
2. ✅ Review `FIREBASE_DEPLOYMENT_CHECKLIST.md` for deployment steps
3. ✅ Set up monitoring in Firebase Console
4. ✅ Configure custom domain (optional)
5. ✅ Enable analytics (optional)

---

## Getting Help

**Resources:**
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: https://stackoverflow.com/questions/tagged/firebase

**Project-Specific Help:**
- Check browser console for error messages
- Review `FIREBASE_TESTING_CHECKLIST.md` for debugging steps
- Check GitHub issues (if applicable)

---

## Summary Checklist

Use this checklist to track your progress:

- [ ] Created Firebase project
- [ ] Enabled Google Authentication
- [ ] Created Firestore database
- [ ] Created Storage bucket
- [ ] Copied Firebase configuration
- [ ] Updated `firebase-config.js`
- [ ] Updated `.firebaserc`
- [ ] Installed Firebase CLI
- [ ] Deployed Firestore rules
- [ ] Deployed Storage rules
- [ ] Tested authentication
- [ ] Tested theory creation
- [ ] Tested image upload
- [ ] Tested browse & view
- [ ] (Optional) Deployed to Firebase Hosting

**Congratulations!** Your Firebase setup is complete. The Eyes of Azrael user theories system is now fully functional!

---

*Last updated: 2025-12-07*
*Firebase SDK Version: 10.7.1*
