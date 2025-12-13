# Firebase Setup Guide - Eyes of Azrael Migration

## Current Status
- ✅ Firebase project configured: `eyesofazrael`
- ✅ Parsed data ready: 190 deities from 23 mythologies (73.9% quality)
- ⚠️ Service account key needed for backend upload scripts

---

## Quick Setup (5 minutes)

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **eyesofazrael**
3. Click ⚙️ (Settings) → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file as:
   ```
   H:\Github\EyesOfAzrael\FIREBASE\firebase-service-account.json
   ```

**IMPORTANT:** This file contains secrets. It's already in `.gitignore` and will NOT be committed.

### Step 2: Install Node.js Dependencies (if not done)

```bash
cd H:\Github\EyesOfAzrael\FIREBASE
npm install firebase-admin jsdom
```

### Step 3: Run Dry-Run Upload (Validation Only)

```bash
cd H:\Github\EyesOfAzrael\FIREBASE
node scripts/upload-parsed-to-firestore.js --dry-run
```

This will:
- ✅ Validate all parsed data structure
- ✅ Show what will be uploaded (without actually uploading)
- ✅ Check for any data issues

### Step 4: Production Upload

```bash
node scripts/upload-parsed-to-firestore.js
```

Expected results:
- 23 documents in `mythologies` collection
- 190 documents in `deities` collection
- ~50 documents in `archetypes` collection
- ~300 documents in `search_index` collection

**Estimated time:** 2-3 minutes

### Step 5: Deploy Firestore Rules & Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Step 6: Verify in Firebase Console

1. Go to [Firestore Database](https://console.firebase.google.com/project/eyesofazrael/firestore)
2. Check collections:
   - `mythologies` → should have 23 documents
   - `deities` → should have 190 documents
   - `archetypes` → should have ~50 documents
   - `search_index` → should have ~300 documents

---

## Alternative: Use Firebase CLI Authentication

If you already have Firebase CLI authenticated (you do, based on `.firebaserc`), you can use the emulator for testing:

```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# In another terminal, run upload pointing to emulator
# (script would need modification to use emulator)
```

---

## Data Overview

### What's Being Uploaded

| Collection | Documents | Description |
|------------|-----------|-------------|
| `mythologies` | 23 | Mythology metadata (Greek, Hindu, Norse, etc.) |
| `deities` | 190 | Full deity information with domains, symbols, relationships |
| `archetypes` | ~50 | Cross-mythology archetypes (Sky Father, Trickster, etc.) |
| `search_index` | ~300 | Searchable entries for full-text search |

### Sample Deity Document (Zeus)

```json
{
  "id": "greek_zeus",
  "mythology": "greek",
  "name": "Zeus",
  "displayName": "⚡ Zeus",
  "description": "King of the Olympian gods, ruler of Mount Olympus...",
  "domains": ["Sky Father", "Cloud Gatherer", "Thunderer"],
  "symbols": ["Thunderbolt", "eagle", "oak tree"],
  "relationships": {
    "consort": "Hera",
    "father": "Cronus",
    "children": ["Athena", "Apollo", "Artemis", ...]
  },
  "primarySources": [
    { "title": "Iliad", "book": "Book 1", "lines": "1-52" },
    { "title": "Theogony", "lines": "453-506" },
    ...90+ more
  ],
  "metadata": {
    "createdAt": "2024-12-13T...",
    "source": "html_parser",
    "verified": false
  }
}
```

---

## Troubleshooting

### Error: "firebase-service-account.json not found"
**Solution:** Follow Step 1 above to download service account key

### Error: "Permission denied" during upload
**Solution:** Check that your Firebase project has Firestore enabled:
1. Go to Firebase Console → Firestore Database
2. Click "Create Database" if needed
3. Choose "Start in test mode" (rules will be deployed later)

### Error: "Module not found: firebase-admin"
**Solution:** Run `npm install` in FIREBASE directory

### Data uploaded but not showing in frontend
**Solution:**
1. Check browser console for errors
2. Verify Firebase config in `firebase-config.js`
3. Ensure Firestore rules allow read access

---

## Next Steps After Upload

1. ✅ Validate data with agents (spawn 3-5 agents to check different mythologies)
2. ✅ Test frontend locally: `python -m http.server 8000`
3. ✅ Deploy to Firebase Hosting: `firebase deploy`
4. ✅ Update main index.html to point to Firebase-powered version

---

## Files Generated

All parsed data is ready in `FIREBASE/parsed_data/`:
- `all_mythologies_parsed.json` - Combined data (all mythologies)
- `greek_parsed.json`, `hindu_parsed.json`, etc. - Individual mythologies
- `quality_report.json` - Quality metrics (73.9% overall)
- `parsing_stats.json` - Statistics summary

---

**Status:** Ready for production migration once service account key is added.
**Quality Score:** 73.9% (exceeds 70% threshold)
**Total Data:** 190 deities, 1,307 domains, 1,318 symbols, 95 relationships
