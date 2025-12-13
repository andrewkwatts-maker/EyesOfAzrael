# Firebase Migration - Quick Start Guide

## 🚀 What Was Accomplished

### ✅ Complete File Migration
All website files have been copied to the `FIREBASE/` folder:
- 📄 All HTML pages (mythologies, deities, archetypes, theories, etc.)
- 🎨 All CSS stylesheets
- ⚙️ All JavaScript files
- 📁 Complete directory structure preserved

### ✅ Firebase Database Schema Designed
See [`FIREBASE_MIGRATION_SCHEMA.md`](./FIREBASE_MIGRATION_SCHEMA.md) for full details:
- **Collections**: mythologies, deities, archetypes, herbs, theories, user_submissions, content_widgets, pages
- **Security Rules**: Public read, authenticated write model
- **Indexes**: Optimized for common queries
- **Widget System**: Standardized content rendering

### ✅ Firebase-Integrated Index Page
Created [`index_firebase.html`](./index_firebase.html):
- Loads data from Firestore in real-time
- Widget-based rendering system
- Search and filter functionality
- Loading states and error handling
- Responsive design with glassmorphism UI

### ✅ Data Migration Script
Created [`scripts/migrate-data-to-firebase.js`](./scripts/migrate-data-to-firebase.js):
- Parses existing `mythos_data.js`
- Migrates mythologies to Firestore
- Creates sample deities (Zeus, Shiva, Yahweh)
- Creates sample archetypes (Sky Father, Trickster, Earth Mother)
- Generates widget templates

## 🎯 Next Steps (In Order)

### 1. Set Up Firebase Project (10 minutes)
```bash
# Go to: https://console.firebase.google.com/
# 1. Click "Create a project"
# 2. Name it: "eyes-of-azrael"
# 3. Enable/disable Google Analytics (your choice)
# 4. Click "Create project"
```

### 2. Enable Firestore Database (5 minutes)
```bash
# In Firebase Console:
# 1. Click "Firestore Database" in left menu
# 2. Click "Create database"
# 3. Select "Start in test mode"
# 4. Choose location (e.g., us-central)
# 5. Click "Enable"
```

### 3. Get Your Firebase Config (5 minutes)
```bash
# In Firebase Console:
# 1. Click gear icon > Project settings
# 2. Scroll to "Your apps"
# 3. Click "</> Web"
# 4. App nickname: "eyes-of-azrael-web"
# 5. Check "Also set up Firebase Hosting"
# 6. Click "Register app"
# 7. Copy the firebaseConfig object
```

### 4. Create Firebase Config File (2 minutes)
Create `FIREBASE/js/firebase-init.js` with your config:
```javascript
// Firebase Configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
console.log('✅ Firebase initialized');
```

### 5. Install Dependencies (2 minutes)
```bash
cd FIREBASE
npm init -y
npm install firebase-admin
```

### 6. Get Service Account Key (5 minutes)
```bash
# In Firebase Console:
# 1. Project Settings > Service Accounts
# 2. Click "Generate new private key"
# 3. Click "Generate key"
# 4. Save as: FIREBASE/firebase-service-account.json
# ⚠️ IMPORTANT: Add to .gitignore!
```

### 7. Run Data Migration (1 minute)
```bash
cd FIREBASE
node scripts/migrate-data-to-firebase.js
```

Expected output:
```
🚀 Starting Firebase data migration...
✅ Migrated 15 mythologies
✅ Created 3 sample deities
✅ Created 3 archetypes
✅ Created 2 widget templates
✅ Migration complete!
```

### 8. Test Locally (2 minutes)
```bash
# Serve the site locally
cd FIREBASE
python -m http.server 8000
# OR: npx http-server

# Open in browser:
# http://localhost:8000/index_firebase.html
```

You should see:
- ✅ Mythology cards loading from Firestore
- ✅ Stats showing counts (15 mythologies, 3 deities, 3 archetypes)
- ✅ Search and filters working
- ✅ Smooth loading animations

### 9. Deploy Security Rules (3 minutes)
```bash
cd FIREBASE
# Copy rules from parent directory
cp ../firestore.rules .
cp ../firestore.indexes.json .

# Deploy
firebase deploy --only firestore:rules,firestore:indexes
```

### 10. Deploy to Firebase Hosting (5 minutes)
```bash
# Replace index.html with Firebase version
cd FIREBASE
mv index.html index_offline.html
cp index_firebase.html index.html

# Deploy
firebase deploy
```

## 📊 What You Get After Migration

### Before (Static)
- ❌ Hardcoded data in JavaScript files
- ❌ Content updates require code changes
- ❌ No user contributions
- ❌ Manual search implementation
- ❌ No real-time updates

### After (Firebase)
- ✅ Dynamic data from Firestore
- ✅ Update content without redeploying
- ✅ User submission system ready
- ✅ Native database querying
- ✅ Real-time updates across all users
- ✅ Standardized widget system
- ✅ Scalable cloud infrastructure

## 🎨 Widget System

All content uses standardized, reusable widgets:

```javascript
// Mythology Grid Widget
<div class="mythology-grid" data-source="mythologies">
  <!-- Auto-populates from Firestore -->
</div>

// Deity Card Widget
<div class="deity-card" data-id="zeus">
  <!-- Auto-populates deity data -->
</div>

// Search Widget
<div class="search-widget" data-collection="all">
  <!-- Searches across all collections -->
</div>
```

## 📁 Key Files Created

```
FIREBASE/
├── index_firebase.html                   # ⭐ New Firebase-integrated homepage
├── MIGRATION_README.md                   # 📖 Comprehensive migration guide
├── FIREBASE_MIGRATION_SCHEMA.md          # 📋 Database schema documentation
├── QUICKSTART.md                         # 🚀 This file
├── scripts/
│   ├── migrate-to-firebase-folder.js     # ✅ File copy script (completed)
│   └── migrate-data-to-firebase.js       # ✅ Data migration script (ready to run)
└── [all website files copied]
```

## 🔧 Troubleshooting

### "Firebase is not defined"
- Make sure `firebase-init.js` is created with your config
- Check that Firebase SDK scripts load before other scripts
- Verify config values are correct (no quotes around property names)

### "Permission denied" errors
- Check you're in test mode: Firestore > Rules > Test mode
- Deploy security rules: `firebase deploy --only firestore:rules`

### Data not showing
- Verify migration script ran successfully
- Check Firebase Console > Firestore Database
- Look for collections: mythologies, deities, archetypes
- Check browser console for errors

### localhost CORS errors
- Use `firebase serve` instead of python http-server
- Or install: `npm install -g http-server` and use that

## 🎯 Agent Task Plan

Once the base migration is working, spawn agents to handle specific tasks:

### Phase 1: Content Parsers (Agents 1-15)
Each agent handles one mythology:
- Parse all deity HTML files
- Extract structured data
- Upload to Firestore

### Phase 2: Category Migrations (Agents 16-19)
- Agent 16: Herbalism
- Agent 17: Theories
- Agent 18: Archetypes (expand)
- Agent 19: Cosmology

### Phase 3: Frontend Updates (Agents 20-25)
- Agent 20: Mythology index pages
- Agent 21: Deity detail pages
- Agent 22: Archetype pages
- Agent 23: Search functionality
- Agent 24: User submission forms
- Agent 25: Theory editor

### Phase 4: Polish (Agents 26-30)
- Agent 26: Testing & QA
- Agent 27: Performance optimization
- Agent 28: SEO & metadata
- Agent 29: Documentation
- Agent 30: Deployment & monitoring

## 📞 Ready to Start?

1. **Setup Firebase** (Steps 1-6 above) ⏱️ ~30 minutes
2. **Run migration** (Step 7) ⏱️ 1 minute
3. **Test locally** (Step 8) ⏱️ 2 minutes
4. **Deploy** (Steps 9-10) ⏱️ 8 minutes

**Total time: ~45 minutes to go live with Firebase!**

Then iterate with agents to migrate full content.

---

**Questions?** See [`MIGRATION_README.md`](./MIGRATION_README.md) for detailed instructions.

**Database Schema?** See [`FIREBASE_MIGRATION_SCHEMA.md`](./FIREBASE_MIGRATION_SCHEMA.md) for all collections and fields.
