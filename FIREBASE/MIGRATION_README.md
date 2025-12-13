# Firebase Migration Guide - Eyes of Azrael

## Overview

This folder contains a complete copy of the Eyes of Azrael website prepared for migration to Firebase. The migration transforms the site from static HTML/JS files to a dynamic, database-driven application using Firebase Firestore.

## What Has Been Done

### ✅ Phase 1: File Duplication (COMPLETE)
- All website files copied to `FIREBASE/` folder
- Static HTML, CSS, JS, and assets preserved
- Directory structure maintained
- Migration metadata created

### ✅ Phase 2: Schema Design (COMPLETE)
- Firebase database schema designed (see `FIREBASE_MIGRATION_SCHEMA.md`)
- Collections defined: `mythologies`, `deities`, `archetypes`, `content_widgets`, `user_submissions`, `theories`, `herbs`, `pages`
- Security rules designed
- Index requirements documented

### ✅ Phase 3: Template Creation (COMPLETE)
- New Firebase-integrated `index_firebase.html` created
- Widget-based rendering system implemented
- Real-time data loading from Firestore
- Loading states and error handling included

### ✅ Phase 4: Migration Script (COMPLETE)
- Data migration script created: `scripts/migrate-data-to-firebase.js`
- Parses existing `mythos_data.js`
- Creates sample deities and archetypes
- Generates widget templates

## What Needs to Be Done Next

### 🔄 Phase 5: Firebase Setup

#### Step 1: Create Firebase Project
```bash
# 1. Go to https://console.firebase.google.com/
# 2. Create new project: "eyes-of-azrael"
# 3. Enable Google Analytics (optional)
```

#### Step 2: Enable Firestore
```bash
# In Firebase Console:
# 1. Go to "Firestore Database"
# 2. Click "Create database"
# 3. Start in test mode (temporarily)
# 4. Choose location (e.g., us-central)
```

#### Step 3: Get Firebase Config
```bash
# In Firebase Console:
# 1. Go to Project Settings (gear icon)
# 2. Scroll to "Your apps"
# 3. Click "Web" (</> icon)
# 4. Register app: "eyes-of-azrael-web"
# 5. Copy firebaseConfig object
```

#### Step 4: Create Firebase Config File
```bash
# Create js/firebase-init.js with your config:
cd FIREBASE
cat > js/firebase-init.js << 'EOF'
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
EOF
```

#### Step 5: Install Firebase Admin SDK (for data migration)
```bash
cd FIREBASE
npm init -y
npm install firebase-admin
```

#### Step 6: Get Service Account Key
```bash
# In Firebase Console:
# 1. Go to Project Settings > Service Accounts
# 2. Click "Generate new private key"
# 3. Save as firebase-service-account.json
# 4. Move to FIREBASE/ directory
# 5. Add to .gitignore!
```

### 🔄 Phase 6: Data Migration

#### Step 1: Run Migration Script
```bash
cd FIREBASE
node scripts/migrate-data-to-firebase.js
```

Expected output:
```
🚀 Starting Firebase data migration...

📦 Migrating mythologies to Firestore...
✅ Migrated 15 mythologies

📦 Creating sample deities...
✅ Created 3 sample deities

📦 Creating archetypes...
✅ Created 3 archetypes

📦 Creating widget templates...
✅ Created 2 widget templates

✅ Migration complete!

📊 Summary:
   - Mythologies: 15
   - Deities: 3
   - Archetypes: 3
   - Widget Templates: 2
```

#### Step 2: Verify Data in Firebase Console
```bash
# In Firebase Console:
# 1. Go to Firestore Database
# 2. Check collections exist:
#    - mythologies
#    - deities
#    - archetypes
#    - content_widgets
# 3. Verify document count matches migration output
```

### 🔄 Phase 7: Deploy Security Rules

#### Step 1: Deploy Firestore Rules
```bash
cd FIREBASE
# Copy firestore.rules from parent directory
cp ../firestore.rules .

# Deploy rules
firebase deploy --only firestore:rules
```

#### Step 2: Deploy Firestore Indexes
```bash
# Copy firestore.indexes.json from parent directory
cp ../firestore.indexes.json .

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 🔄 Phase 8: Test the Application

#### Step 1: Serve Locally
```bash
cd FIREBASE
# Option 1: Firebase hosting emulator
firebase serve

# Option 2: Simple HTTP server
python -m http.server 8000
# or
npx http-server
```

#### Step 2: Open in Browser
```bash
# Navigate to:
http://localhost:8000/index_firebase.html
```

#### Step 3: Verify Functionality
- [ ] Page loads without errors
- [ ] Stats display correct counts
- [ ] Mythology cards render from Firestore
- [ ] Search filters work
- [ ] Clicking cards navigates to mythology pages
- [ ] Loading states display correctly
- [ ] Error handling works (test by disconnecting network)

### 🔄 Phase 9: Full Content Migration

#### Migrate Deity Pages
The migration script currently creates only 3 sample deities. To migrate all deities:

1. **Create deity parser script:**
   ```bash
   # Create scripts/parse-deity-html.js
   # This should:
   # - Read all deity HTML files
   # - Extract deity information
   # - Transform to Firestore format
   # - Batch upload to 'deities' collection
   ```

2. **Parse directory structure:**
   ```javascript
   // Example: Parse mythos/greek/deities/*.html
   const deityFiles = glob.sync('mythos/*/deities/*.html');
   deityFiles.forEach(parseDeityHTML);
   ```

3. **Extract data from HTML:**
   ```javascript
   // Parse structured sections:
   // - Name and titles
   // - Archetypes
   // - Domains
   // - Relationships
   // - Symbols
   // - Description
   ```

#### Migrate Other Collections
Similar parsers needed for:
- **Heroes**: `mythos/*/heroes/*.html`
- **Creatures**: `mythos/*/creatures/*.html`
- **Cosmology**: `mythos/*/cosmology/*.html`
- **Herbs**: `herbalism/**/*.html`
- **Theories**: `theories/**/*.html`

### 🔄 Phase 10: Update All Pages

#### Convert Static Pages to Dynamic
Replace static HTML with Firebase-integrated versions:

1. **Mythology index pages** (`mythos/*/index.html`)
   - Load deity list from Firestore
   - Render using widgets
   - Add real-time updates

2. **Deity detail pages** (`mythos/*/deities/*.html`)
   - Load single deity from Firestore
   - Render relationships dynamically
   - Link to related archetypes

3. **Archetype pages** (`archetypes/*/index.html`)
   - Load archetype data
   - Show cross-mythology occurrences
   - Dynamic linking

### 🔄 Phase 11: Deploy to Production

#### Step 1: Configure Firebase Hosting
```bash
cd FIREBASE
firebase init hosting
# Choose:
# - Public directory: .
# - Single-page app: No
# - GitHub actions: No
```

#### Step 2: Replace index.html
```bash
# Backup current offline page
mv index.html index_offline.html

# Use Firebase version as main page
cp index_firebase.html index.html
```

#### Step 3: Deploy
```bash
firebase deploy
```

#### Step 4: Update DNS (if using custom domain)
```bash
# In Firebase Console:
# 1. Go to Hosting
# 2. Click "Add custom domain"
# 3. Follow DNS configuration steps
```

## File Structure

```
FIREBASE/
├── MIGRATION_README.md              # This file
├── FIREBASE_MIGRATION_SCHEMA.md     # Database schema documentation
├── index.html                        # Current offline page
├── index_firebase.html               # New Firebase-integrated page
├── firebase-service-account.json     # Service account key (DO NOT COMMIT!)
├── js/
│   └── firebase-init.js              # Firebase configuration (create this)
├── scripts/
│   ├── migrate-to-firebase-folder.js # File duplication script (✅ done)
│   └── migrate-data-to-firebase.js   # Data migration script (✅ done)
├── mythos/                           # All mythology content
├── archetypes/                       # Archetype pages
├── herbalism/                        # Herbalism content
├── theories/                         # Theory pages
└── ... (all other website files)
```

## Key Benefits of This Migration

1. **Dynamic Content**: Update deities, mythologies, and content without redeploying
2. **User Contributions**: Community can submit new deities, theories, correlations
3. **Real-time Updates**: Changes propagate instantly to all users
4. **Advanced Search**: Native Firestore querying across all collections
5. **Scalability**: Cloud infrastructure handles traffic automatically
6. **Consistency**: Standardized data model ensures quality
7. **Widget System**: Reusable components for consistent UI

## Agent Task Breakdown

To complete this migration efficiently, you can spawn agents for each mythology:

### Agent 1: Greek Mythology Migration
- Parse all Greek deity HTML files
- Extract structured data
- Upload to Firestore `deities` collection with `mythology: "greek"`

### Agent 2: Hindu Mythology Migration
- Parse all Hindu deity HTML files
- Extract structured data
- Upload to Firestore `deities` collection with `mythology: "hindu"`

### Agent 3: Jewish/Kabbalah Migration
- Parse Sefirot, Sparks, Angels, Demons
- Upload to appropriate collections
- Link to archetypes

### Agent 4-15: Remaining Mythologies
- Egyptian, Norse, Celtic, Chinese, Buddhist, Christian, etc.
- Same parsing and upload process

### Agent 16: Herbalism Migration
- Parse all herb pages
- Extract cross-tradition data
- Upload to `herbs` collection

### Agent 17: Theory Migration
- Parse all theory pages
- Extract categories, tags, correlations
- Upload to `theories` collection

### Agent 18: Frontend Integration
- Update all static HTML pages to use Firestore
- Implement widget rendering
- Add loading states and error handling

### Agent 19: Testing & Quality Assurance
- Verify all data migrated correctly
- Test all features
- Check cross-references and links

### Agent 20: Documentation & Deployment
- Update documentation
- Deploy to production
- Monitor for errors

## Quick Start Checklist

- [ ] Create Firebase project
- [ ] Enable Firestore
- [ ] Get Firebase config
- [ ] Create `js/firebase-init.js`
- [ ] Install Firebase Admin SDK
- [ ] Get service account key
- [ ] Run data migration script
- [ ] Verify data in Firebase Console
- [ ] Deploy security rules
- [ ] Deploy indexes
- [ ] Test `index_firebase.html` locally
- [ ] Create deity parser scripts
- [ ] Migrate all deity content
- [ ] Update mythology index pages
- [ ] Test all features
- [ ] Deploy to production

## Support & Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firestore Docs**: https://firebase.google.com/docs/firestore
- **This Schema**: See `FIREBASE_MIGRATION_SCHEMA.md`
- **Original Data**: `mythos_data.js`, individual HTML files

## Notes

- The current `index.html` is an offline maintenance page
- The new `index_firebase.html` is the Firebase-integrated version
- Service account keys must NEVER be committed to Git
- Start with test mode security rules, then tighten in production
- Consider rate limiting and query quotas for large datasets

---

**Created**: December 13, 2024
**Status**: Ready for Firebase setup and data migration
**Next Step**: Create Firebase project and run migration script
