# 🔥 Firebase Backend - Eyes of Azrael

**Status:** ✅ **PHASE 1 & 2 COMPLETE** (1,510 documents in production)
**Live URL:** https://eyesofazrael.web.app
**Project ID:** `eyesofazrael`

---

## 📁 Directory Structure

```
FIREBASE/
├── README.md                          # This file
├── MIGRATION_COMPLETE_SUMMARY.md      # 🎉 Complete migration report
├── CURRENT_STATUS.md                  # Real-time status snapshot
├── FINAL_MIGRATION_REPORT.md          # Detailed migration status
├── DEPLOYMENT_SUMMARY.md              # Phase 2 upload summary
├── INDEX_VALIDATION_REPORT.md         # Index page validation findings
│
├── css/
│   └── firebase-themes.css            # 8 mythology themes (glassmorphism)
│
├── js/
│   ├── theme-manager.js               # Dynamic theme switching
│   └── firebase-content-loader.js     # Universal Firestore content loader
│
├── scripts/
│   ├── upload-parsed-to-firestore.js  # Initial upload script
│   ├── upload-all-content.js          # Universal uploader
│   ├── parse-universal-content.js     # Universal content parser
│   └── create-search-indexes.js       # Search index generator
│
├── parsed_data/
│   ├── deities_parsed.json            # 190 deities
│   ├── heroes_parsed.json             # 50 heroes
│   ├── cosmology_parsed.json          # 65 cosmology entries
│   ├── texts_parsed.json              # 35 sacred texts
│   ├── creatures_parsed.json          # 30 creatures
│   ├── herbs_parsed.json              # 22 herbs
│   ├── rituals_parsed.json            # 20 rituals
│   ├── concepts_parsed.json           # 6 concepts
│   ├── myths_parsed.json              # 9 myths
│   ├── symbols_parsed.json            # 2 symbols
│   └── ... (mythology-specific files)
│
├── search_indexes/
│   ├── search_index.json              # 432 search entries
│   ├── cross_references.json          # 421 relationship maps
│   ├── firestore_search_index.json    # Firestore-ready indexes
│   └── autocomplete_dictionary.json   # Autocomplete data
│
├── test-integration.html              # 🧪 Firebase integration test page
├── theme-demo.html                    # 🎨 Theme showcase
├── content-viewer.html                # Content viewer with themes
│
└── Documentation/
    ├── UI_SYSTEM_README.md            # Complete UI API reference
    ├── QUICK_START.md                 # Getting started guide
    ├── THEME_CUSTOMIZATION.md         # Theme customization
    ├── COMPONENT_LIBRARY.md           # UI component reference
    ├── INTEGRATION_GUIDE.md           # Integration instructions
    ├── COMPREHENSIVE_MIGRATION_PLAN.md
    └── PHASE_2_MIGRATION_PLAN.md
```

---

## 🚀 Quick Start

### 1. View Live Site
Visit https://eyesofazrael.web.app (currently showing maintenance page)

### 2. Test Firebase Integration Locally
```bash
# Start local server
python -m http.server 8000

# Open test page in browser
http://localhost:8000/FIREBASE/test-integration.html

# View theme demo
http://localhost:8000/FIREBASE/theme-demo.html
```

### 3. View Firebase Console
- **Firestore Data:** https://console.firebase.google.com/project/eyesofazrael/firestore/databases/-default-/data
- **Project Overview:** https://console.firebase.google.com/project/eyesofazrael/overview

---

## 📊 What's in Firebase

### Collections (13 total):

| Collection | Count | Description |
|------------|-------|-------------|
| deities | 190 | Full deity database across mythologies |
| heroes | 50 | Legendary heroes and champions |
| cosmology | 65 | Realms, afterlife, creation myths |
| texts | 35 | Sacred texts and scriptures |
| creatures | 30 | Mythological beings and monsters |
| mythologies | 22 | Mythology metadata |
| herbs | 22 | Magical herbs and correspondences |
| rituals | 20 | Magical rituals and practices |
| concepts | 15 | Abstract concepts + 9 myths |
| archetypes | 4 | Universal archetypes |
| symbols | 2 | Sacred symbols and sigils |
| search_index | 634 | Full-text search indexes |
| cross_references | 421 | 8,252 relationship mappings |

**Total:** 1,510 documents

---

## 🎨 UI System

### 8 Mythology Themes:
- 🏛️ **Greek** - Purple (`#9370DB`)
- 🏺 **Egyptian** - Gold (`#DAA520`)
- ⚔️ **Norse** - Steel Blue (`#4682B4`)
- 🕉️ **Hindu** - Tomato (`#FF6347`)
- 🙏 **Buddhist** - Orange (`#FF8C00`)
- ✝️ **Christian** - Crimson (`#DC143C`)
- ☪️ **Islamic** - Forest Green (`#228B22`)
- 🍀 **Celtic** - Sea Green (`#2E8B57`)

### Features:
- ✅ Glassmorphism design with `backdrop-filter: blur(10px)`
- ✅ Dynamic theme switching with LocalStorage persistence
- ✅ Auto-detection from URL/content
- ✅ Responsive grid layouts
- ✅ Staggered animations
- ✅ Loading states with skeleton screens

### Usage:
```html
<!-- Include theme CSS -->
<link rel="stylesheet" href="/FIREBASE/css/firebase-themes.css">

<!-- Include theme manager -->
<script src="/FIREBASE/js/theme-manager.js"></script>

<!-- Initialize -->
<script>
  const themeManager = new ThemeManager();
  themeManager.init();
  themeManager.setTheme('greek'); // or auto-detect
</script>
```

See [`UI_SYSTEM_README.md`](UI_SYSTEM_README.md) for complete API documentation.

---

## 🔍 Firebase Content Loader

Universal content loader for all Firestore collections.

### Basic Usage:
```javascript
import { FirebaseContentLoader } from '/FIREBASE/js/firebase-content-loader.js';

const loader = new FirebaseContentLoader();

// Load deities from Greek mythology
await loader.loadContent('deities', { mythology: 'greek' });

// Render to container
loader.renderContent('container-id', 'deity');
```

### Supported Content Types:
- `deities`, `heroes`, `creatures`, `cosmology`, `texts`, `herbs`, `rituals`, `concepts`, `symbols`, `archetypes`

### Options:
```javascript
await loader.loadContent('deities', {
  mythology: 'greek',      // Filter by mythology
  search: 'zeus',          // Search in searchTokens
  limit: 50,               // Limit results
  orderBy: 'name',         // Sort field
  direction: 'asc'         // Sort direction
});
```

See [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) for full documentation.

---

## 🔐 Security

### Firestore Rules:
- **Public Read:** All content is publicly readable
- **Restricted Write:** Only `andrewkwatts@gmail.com` can create/update/delete official content
- **User Contributions:** Separate collections allow authenticated user submissions

### Deploy Rules:
```bash
firebase deploy --only firestore:rules
```

---

## 🔧 Development Scripts

### Upload Content to Firestore:
```bash
# Upload all content
cd FIREBASE
node scripts/upload-all-content.js

# Dry run
node scripts/upload-all-content.js --dry-run
```

### Parse New Content:
```bash
# Parse specific content type
node scripts/parse-universal-content.js --type=texts
node scripts/parse-universal-content.js --type=myths
node scripts/parse-universal-content.js --type=concepts

# Options
--type=<contentType>  # Required: texts, myths, concepts, symbols, events
--mythology=<name>    # Optional: Filter by mythology
--output=<path>       # Optional: Custom output path
```

### Generate Search Indexes:
```bash
node scripts/create-search-indexes.js
```

---

## 📚 Documentation

### Quick References:
- **[MIGRATION_COMPLETE_SUMMARY.md](MIGRATION_COMPLETE_SUMMARY.md)** - 🎉 Complete migration overview
- **[CURRENT_STATUS.md](CURRENT_STATUS.md)** - Real-time status snapshot
- **[UI_SYSTEM_README.md](UI_SYSTEM_README.md)** - Complete UI API reference
- **[QUICK_START.md](QUICK_START.md)** - Getting started guide

### Detailed Guides:
- **[FINAL_MIGRATION_REPORT.md](FINAL_MIGRATION_REPORT.md)** - Detailed migration status
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - How to integrate Firebase into pages
- **[THEME_CUSTOMIZATION.md](THEME_CUSTOMIZATION.md)** - Customizing themes
- **[COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md)** - UI component reference

### Planning & Reports:
- **[COMPREHENSIVE_MIGRATION_PLAN.md](COMPREHENSIVE_MIGRATION_PLAN.md)** - Full migration strategy
- **[PHASE_2_MIGRATION_PLAN.md](PHASE_2_MIGRATION_PLAN.md)** - Phase 2 detailed plan
- **[INDEX_VALIDATION_REPORT.md](INDEX_VALIDATION_REPORT.md)** - Index page findings
- **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** - Phase 2 upload results

---

## 🧪 Testing

### Test Pages:

1. **Firebase Integration Test** (`test-integration.html`)
   - Live Firebase stats
   - Content loading demo
   - Theme switching
   - Filter and search

2. **Theme Demo** (`theme-demo.html`)
   - Interactive theme showcase
   - All 8 themes
   - Component library

3. **Content Viewer** (`content-viewer.html`)
   - View all content types
   - Theme support
   - Grid layout

### Run Tests:
```bash
# Start local server
python -m http.server 8000

# Test URLs
http://localhost:8000/FIREBASE/test-integration.html
http://localhost:8000/FIREBASE/theme-demo.html
http://localhost:8000/FIREBASE/content-viewer.html
```

---

## 🚀 Deployment

### Deploy to Firebase Hosting:
```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes
```

### Check Deployment Status:
```bash
# List Firebase projects
firebase projects:list

# List hosting sites
firebase hosting:sites:list

# View current deployment
firebase hosting:channel:list
```

---

## ✅ Success Metrics

### Phase 1 & 2 Complete:
- ✅ **1,510 documents** in Firebase
- ✅ **100% success rate** - Zero errors
- ✅ **634 search indexes** generated
- ✅ **421 cross-reference maps** created
- ✅ **8,252 relationship links** established
- ✅ **8 themes** with glassmorphism
- ✅ **Universal content loader** built
- ✅ **Security rules** deployed

### Firebase Costs:
- **Current usage:** Well within free tier
- **Estimated cost:** $0/month

---

## 🎯 Next Steps

### Immediate Options:

1. **Integrate Firebase into Index Pages**
   - Update 19+ mythology index pages
   - Replace static HTML with dynamic loading
   - Use Firebase content loader

2. **Bring Site Back Online**
   - Remove maintenance page
   - Deploy actual content
   - Test live integration

3. **Implement Search UI**
   - Create search interface
   - Use `search_index` collection
   - Add autocomplete

4. **Phase 3 Migration**
   - Develop specialized parsers
   - Migrate remaining 159 files
   - Complete Gnostic/Kabbalah content

---

## 🔗 Quick Links

### Firebase Console:
- **Project:** https://console.firebase.google.com/project/eyesofazrael/overview
- **Firestore:** https://console.firebase.google.com/project/eyesofazrael/firestore/databases/-default-/data
- **Authentication:** https://console.firebase.google.com/project/eyesofazrael/authentication
- **Hosting:** https://console.firebase.google.com/project/eyesofazrael/hosting
- **Storage:** https://console.firebase.google.com/project/eyesofazrael/storage

### Live URLs:
- **Production:** https://eyesofazrael.web.app
- **Alternative:** https://eyesofazrael.firebaseapp.com

---

## 📝 Notes

### Current Site Status:
The site is currently showing a maintenance page while content is being reviewed. The Firebase backend is fully operational and ready to serve content once the frontend is updated.

### Firebase Configuration:
- Configuration is in `/firebase-config.js` (root directory)
- Service account key is in `/FIREBASE/firebase-service-account.json` (excluded from git)
- Project rules are in `/firestore.rules`

### Data Quality:
- Average quality score: 60%
- Parse success rate: 100%
- All data validated before upload

---

## 🙏 Support

For issues or questions:
1. Check the documentation files in this directory
2. Review Firebase Console for data verification
3. Test locally using test pages
4. Consult migration reports for status updates

---

**Last Updated:** December 13, 2025
**Status:** ✅ Phase 1 & 2 Complete
**Total Documents:** 1,510
**Success Rate:** 100%

🎉 **Ready for production deployment!**
