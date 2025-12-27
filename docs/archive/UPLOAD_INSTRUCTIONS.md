# Firebase Content Upload Instructions

## Overview

All migrated content (216 entities) is ready for upload to Firebase Firestore. An admin upload interface has been created to make this process simple and tracked.

---

## Step-by-Step Upload Process

### 1. Start Firebase Local Server

The Firebase local server should already be running. If not, start it:

```bash
firebase serve --only hosting --port 5000
```

Wait for the message: `✔  hosting: Local server: http://localhost:5000`

### 2. Open Admin Upload Page

Navigate to: **http://localhost:5000/admin-upload.html**

This page provides a visual interface for uploading all migrated content.

### 3. Sign In

Click the **"Sign in with Google"** button and authenticate as:
- **Email:** andrewkwatts@gmail.com

This email has admin privileges in the Firestore security rules (line 47 of firestore.rules).

### 4. Upload Collections

Once authenticated, four upload buttons will be enabled:

#### 📿 Items & Artifacts (140 documents)
- **Collection:** `items`
- **Source:** `data/firebase-imports/items-import.json`
- **Contents:** Mjolnir, Excalibur, Holy Grail, etc.

Click **"Upload Items"** to start the upload.

#### 🏛️ Sacred Places (49 documents)
- **Collection:** `places`
- **Source:** `data/firebase-imports/places-import.json`
- **Contents:** Mount Olympus, Kailash, River Styx, etc.

Click **"Upload Places"** to start the upload.

#### ✨ Magic Systems (22 documents)
- **Collection:** `magic`
- **Source:** `data/firebase-imports/magic-systems-import.json`
- **Contents:** Tarot, I Ching, Runes, Kabbalah, etc.

Click **"Upload Magic Systems"** to start the upload.

#### 🔬 Theories (5 documents)
- **Collection:** `user_theories`
- **Source:** `data/theories-import.json`
- **Contents:** Kabbalah-Physics, Chinese-Physics, Enoch-Physics, etc.

Click **"Upload Theories"** to start the upload.

### 5. Monitor Progress

For each collection:
- Progress bar shows upload percentage
- Live log displays:
  - ✅ Success messages (green)
  - ❌ Error messages (red)
  - ℹ️ Info messages (gray)
- Statistics update in real-time:
  - Documents Uploaded
  - Failed
  - Total Documents

### 6. Verify Upload

After all uploads complete, check the Firebase console:
https://console.firebase.google.com/project/eyesofazrael/firestore

Expected collections:
- `items`: 140 documents
- `places`: 49 documents
- `magic`: 22 documents
- `user_theories`: 5 documents

**Total:** 216 documents

---

## Troubleshooting

### Error: "Failed to load JSON file"

**Cause:** JSON file path is incorrect or file doesn't exist

**Fix:** Verify the JSON files exist:
```bash
ls -lh data/firebase-imports/*.json
ls -lh data/theories-import.json
```

### Error: "Missing or insufficient permissions"

**Cause:** Not signed in as andrewkwatts@gmail.com

**Fix:**
1. Click "Sign Out"
2. Click "Sign in with Google"
3. Select andrewkwatts@gmail.com account

### Error: "Batch commit failed"

**Cause:** Network issue or Firestore quota exceeded

**Fix:**
1. Check internet connection
2. Wait 1 minute (rate limiting)
3. Click "Retry Upload"

### Upload Stuck at 0%

**Cause:** Firebase config not loaded

**Fix:**
1. Check browser console (F12) for errors
2. Verify `firebase-config.js` is loaded
3. Refresh page and try again

---

## Alternative Upload Methods

If the web interface doesn't work, you can use the command-line scripts:

### Option 1: Node.js with Firebase Admin SDK (requires service account)

**Note:** This requires generating a Firebase service account JSON key.

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `firebase-service-account.json` in project root
4. Run:

```bash
node scripts/upload-items-to-firebase.js
node scripts/upload-places-to-firebase.js
node scripts/upload-magic-to-firebase.js
node scripts/upload-theories-to-firebase.js
```

### Option 2: Firebase CLI Import

**Note:** This requires converting JSON to Firestore export format.

```bash
firebase firestore:import data/firebase-imports/ --collection items
```

---

## After Upload: Deploy Indexes

After all content is uploaded, deploy the Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

This creates composite indexes for efficient queries:
- `items`: [mythology + itemType + name]
- `places`: [mythology + placeType + geohash]
- `magic`: [category + tradition + name]
- `user_theories`: [status + createdAt]

---

## Verification Queries

After upload, test these queries in the Firebase console:

### Items by Mythology
```javascript
db.collection('items')
  .where('mythologies', 'array-contains', 'norse')
  .orderBy('name')
  .limit(10)
```

**Expected:** Mjolnir, Gungnir, Draupnir, etc.

### Places with Coordinates
```javascript
db.collection('places')
  .where('geographical.primaryLocation.coordinates.accuracy', '==', 'exact')
  .limit(10)
```

**Expected:** Mount Olympus, Mount Kailash, etc.

### Magic Systems by Category
```javascript
db.collection('magic')
  .where('category', '==', 'divination')
  .orderBy('name')
```

**Expected:** Tarot, I Ching, Runes, etc.

### Published Theories
```javascript
db.collection('user_theories')
  .where('status', '==', 'published')
  .orderBy('createdAt', 'desc')
```

**Expected:** All 5 physics correlation theories

---

## Security Notes

**Firebase API Keys are Public:**
The `firebase-config.js` file contains the Firebase API key, which is **safe to commit to Git**. Firebase API keys are designed to be public and access is controlled by Firestore security rules.

**Admin Access:**
Only `andrewkwatts@gmail.com` has write access to official content collections (items, places, magic, etc.) via the security rules.

**User Submissions:**
Regular authenticated users can create their own submissions in the `submissions` collection, which go through an approval workflow.

---

## Next Steps After Upload

1. ✅ Upload all content to Firestore (216 documents)
2. Deploy Firestore indexes
3. Deploy Firestore security rules (if changed)
4. Test website integration:
   - Visit deity pages and verify cross-references load
   - Test search functionality
   - Verify "items" page displays all artifacts
   - Check "places" page shows map markers
5. Enable user submissions:
   - Test submission form
   - Test admin approval workflow

---

## File Locations

**Upload Interface:**
- `admin-upload.html` - Admin upload page (run on localhost:5000)

**Import Data:**
- `data/firebase-imports/items-import.json` - 140 items (2.5 MB)
- `data/firebase-imports/places-import.json` - 49 places (150 KB)
- `data/firebase-imports/magic-systems-import.json` - 22 systems (80 KB)
- `data/theories-import.json` - 5 theories (60 KB)

**Upload Scripts (alternative methods):**
- `scripts/upload-items-to-firebase.js` - Requires service account
- `scripts/upload-places-to-firebase.js` - Requires service account
- `scripts/upload-magic-to-firebase.js` - Requires service account
- `scripts/upload-theories-to-firebase.js` - Requires service account

**Configuration:**
- `firebase-config.js` - Firebase project configuration (public)
- `firestore.rules` - Security rules (defines admin email)
- `firestore.indexes.json` - Composite indexes for efficient queries

---

## Support

For issues or questions:
- Check Firebase Console logs
- Review browser console (F12) for JavaScript errors
- Check `MIGRATION_READY_SUMMARY.md` for detailed migration documentation
- Review `FIREBASE_SCHEMA_COMPLIANCE_REPORT.md` for data quality metrics

---

**Created:** 2025-12-13
**Author:** Claude (Anthropic)
**Status:** Ready for Upload
