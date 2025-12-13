# Magic Systems Migration - Quick Start Guide

## Files Created

### 1. Data Definitions
**File:** `H:\Github\EyesOfAzrael\scripts\extract-magic-systems.js` (49 KB)
- Contains 22 complete magic system definitions
- Structured according to entity-schema-v2.0
- Ready for expansion to 99 systems

### 2. Firebase Import
**File:** `H:\Github\EyesOfAzrael\data\firebase-imports\magic-systems-import.json` (59 KB)
- Complete import file with all 22 systems
- Includes metadata and statistics
- Ready for Firebase upload

### 3. Upload Script
**File:** `H:\Github\EyesOfAzrael\scripts\upload-magic-to-firebase.js` (8.6 KB)
- Automated Firebase upload with batch processing
- Progress tracking and verification
- Creates search indexes automatically

### 4. Documentation
- `H:\Github\EyesOfAzrael\data\firebase-imports\MAGIC_SYSTEMS_MIGRATION.md` - Complete migration guide
- `H:\Github\EyesOfAzrael\MIGRATION_REPORT_MAGIC_SYSTEMS.md` (12 KB) - Detailed report with statistics

---

## Quick Upload to Firebase

### Step 1: Prerequisites
```bash
# Ensure Node.js is installed
node --version

# Install Firebase (if not already installed)
npm install firebase
```

### Step 2: Verify Firebase Config
Open `H:\Github\EyesOfAzrael\firebase-config.js` and confirm credentials are correct.

### Step 3: Run Upload
```bash
cd H:\Github\EyesOfAzrael
node scripts/upload-magic-to-firebase.js
```

### Step 4: Verify in Firebase Console
1. Go to https://console.firebase.google.com
2. Select project: eyesofazrael
3. Navigate to Firestore Database
4. Check collection: `magic-systems` (should have 22 documents)
5. Check collection: `magic-systems-indexes` (should have 3 documents)

---

## Query Examples

### JavaScript/Firebase SDK

```javascript
// Get all divination systems
const divination = await db.collection('magic-systems')
  .where('category', '==', 'divination')
  .get();

// Get Hermetic-related systems
const hermetic = await db.collection('magic-systems')
  .where('mythologies', 'array-contains', 'hermetic')
  .get();

// Search by tag
const tarotSystems = await db.collection('magic-systems')
  .where('tags', 'array-contains', 'tarot')
  .get();

// Get beginner-friendly systems
const beginnerSystems = await db.collection('magic-systems')
  .where('skillLevel', 'in', ['beginner', 'beginner to intermediate'])
  .get();
```

---

## Systems Included (22 Total)

### Divination (6)
1. Tarot
2. I Ching
3. Astrology
4. Runes
5. Geomancy
6. Oracle Bones

### Energy Work (6)
7. Chakra Work
8. Reiki
9. Kundalini
10. Qigong
11. Pranayama
12. Middle Pillar

### Ritual (5)
13. Alchemy
14. Ceremonial Magic
15. Chaos Magic
16. Enochian
17. Practical Kabbalah

### Texts (3)
18. Corpus Hermeticum
19. Emerald Tablet
20. Kybalion

### Practices (2)
21. Meditation
22. Astral Projection

---

## Next Steps

### To Complete Full Migration (99 systems):
1. Review Phase 1 systems for accuracy
2. Extract remaining 78 systems from old repo
3. Add to `extract-magic-systems.js`
4. Regenerate `magic-systems-import.json`
5. Run upload script again
6. Verify all 99 systems in Firebase

### To Test Frontend:
1. Ensure `firebase-content-loader.js` is configured
2. Test loading individual systems by ID
3. Test category filtering
4. Test mythology cross-references
5. Verify search functionality

---

## Troubleshooting

### Upload fails with authentication error
```bash
# Check Firebase config
cat firebase-config.js | grep "apiKey"
# Should not be placeholder values
```

### Systems not appearing in queries
```bash
# Check Firestore rules
# Ensure read permissions are set correctly
```

### Need to re-upload
```bash
# Simply run the script again
# It will overwrite existing documents (merge mode)
node scripts/upload-magic-to-firebase.js
```

---

## File Locations

```
H:\Github\EyesOfAzrael\
├── scripts/
│   ├── extract-magic-systems.js      (49 KB - Data definitions)
│   └── upload-magic-to-firebase.js   (8.6 KB - Upload script)
├── data/
│   └── firebase-imports/
│       ├── magic-systems-import.json  (59 KB - Import file)
│       └── MAGIC_SYSTEMS_MIGRATION.md (Complete guide)
├── MIGRATION_REPORT_MAGIC_SYSTEMS.md  (12 KB - Report)
└── QUICKSTART_MAGIC_MIGRATION.md      (This file)
```

---

## Support Resources

- **Entity Schema:** `H:\Github\EyesOfAzrael\data\schemas\entity-schema-v2.json`
- **Migration Guide:** `H:\Github\EyesOfAzrael\data\firebase-imports\MAGIC_SYSTEMS_MIGRATION.md`
- **Detailed Report:** `H:\Github\EyesOfAzrael\MIGRATION_REPORT_MAGIC_SYSTEMS.md`
- **Firebase Console:** https://console.firebase.google.com

---

**Status:** Phase 1 Complete (22/99 systems)
**Last Updated:** December 13, 2025
