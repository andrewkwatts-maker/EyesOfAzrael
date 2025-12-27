# Upload Enhanced Assets to Firebase - Quick Guide

**Status:** Ready to upload 626+ enhanced entities
**Location:** `firebase-assets-enhanced/`
**Total Size:** ~15 MB

---

## Quick Commands

### Upload All Enhanced Assets
```bash
# Create upload script (recommended approach)
node scripts/create-upload-script.js

# Or use Python bulk upload
python scripts/upload-enhanced-to-firebase.py
```

### Upload by Collection
```bash
# Upload deities only
node scripts/upload-collection.js deities

# Upload cosmology only
node scripts/upload-collection.js cosmology

# Upload all collections
for collection in deities heroes cosmology creatures rituals texts herbs items places symbols concepts events
do
  node scripts/upload-collection.js $collection
done
```

---

## What Gets Uploaded

### Collections with Enhanced Data

| Collection | Original | Enhanced | Files | Priority |
|------------|----------|----------|-------|----------|
| deities | 212 | 212 | 212+ files | HIGH |
| cosmology | 65 | 65 | 65 files | HIGH |
| heroes | 58 | 58 | 58 files | HIGH |
| creatures | 37 | 37 | 37 files | MEDIUM |
| texts | 35 | 35 | 35 files | MEDIUM |
| herbs | 28 | 23 | 23 files | MEDIUM |
| rituals | 20 | 5 | 5 files | LOW |
| items | 140 | 140 | 140 files | MEDIUM |
| places | 47 | 47 | 47 files | MEDIUM |
| symbols | 2 | 2 | 2 files | LOW |
| concepts | 15 | 15 | 15 files | LOW |
| events | 1 | 1 | 1 file | LOW |
| **TOTAL** | **660** | **626+** | **640+ files** | - |

---

## Upload Strategy

### Phase 1: Critical Collections (HIGH Priority)
Upload these first as they power the main site functionality:

1. **Deities** (212 entities)
   ```bash
   node scripts/upload-collection.js deities
   ```
   - Most visited content
   - Powers deity grids and detail pages
   - Enhanced by Agents 1-8

2. **Cosmology** (65 entities)
   ```bash
   node scripts/upload-collection.js cosmology
   ```
   - Creation myths, afterlife systems
   - Powers cosmology browser
   - Enhanced by Agent 10

3. **Heroes** (58 entities)
   ```bash
   node scripts/upload-collection.js heroes
   ```
   - Quest narratives, lineages
   - Powers hero grids
   - Enhanced by Agent 9

**Time:** ~5-10 minutes
**Impact:** Immediate improvement to core site

### Phase 2: Supporting Collections (MEDIUM Priority)
Upload these for complete site functionality:

4. **Creatures** (37 entities)
5. **Texts** (35 entities)
6. **Items** (140 entities)
7. **Places** (47 entities)
8. **Herbs** (23 entities)

```bash
# Upload all medium priority
for coll in creatures texts items places herbs; do
  node scripts/upload-collection.js $coll
done
```

**Time:** ~10-15 minutes
**Impact:** Full feature parity with HTML pages

### Phase 3: Specialized Collections (LOW Priority)
Upload these when ready for complete coverage:

9. **Rituals** (5 entities - foundation)
10. **Symbols** (2 entities)
11. **Concepts** (15 entities)
12. **Events** (1 entity)

```bash
# Upload all low priority
for coll in rituals symbols concepts events; do
  node scripts/upload-collection.js $coll
done
```

**Time:** ~2-5 minutes
**Impact:** Complete dataset

---

## Verification Steps

### After Each Upload

1. **Check Firestore Console**
   ```
   https://console.firebase.google.com/project/eyesofazrael/firestore
   ```
   - Verify document count matches expected
   - Spot-check 2-3 random entities
   - Verify new fields appear

2. **Test Frontend Query**
   ```javascript
   // In browser console on site
   firebase.firestore().collection('deities')
     .where('mythology', '==', 'greek')
     .limit(5)
     .get()
     .then(snapshot => {
       snapshot.forEach(doc => {
         console.log(doc.id, doc.data());
       });
     });
   ```

3. **Verify Enhanced Fields**
   ```javascript
   // Check specific enhanced deity
   firebase.firestore().collection('deities').doc('greek_zeus').get()
     .then(doc => {
       const data = doc.data();
       console.log('Hieroglyphics:', data.hieroglyphics);
       console.log('Mantras:', data.mantras);
       console.log('Norse Specific:', data.norse_specific);
       console.log('Worship:', data.worship);
     });
   ```

---

## Create Upload Script

Create `scripts/upload-enhanced-to-firebase.py`:

```python
#!/usr/bin/env python3
import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from pathlib import Path

# Initialize Firebase
cred = credentials.Certificate('eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Base directory
base_dir = Path('firebase-assets-enhanced')

# Collections to upload
collections = [
    'deities', 'cosmology', 'heroes', 'creatures',
    'texts', 'items', 'places', 'herbs',
    'rituals', 'symbols', 'concepts', 'events'
]

def upload_collection(collection_name):
    print(f"\n📥 Uploading {collection_name}...")

    # Find all JSON files for this collection
    collection_dir = base_dir / collection_name
    if not collection_dir.exists():
        print(f"  ⚠️  Directory not found: {collection_dir}")
        return 0

    uploaded = 0
    errors = 0

    # Upload all JSON files
    for json_file in collection_dir.rglob('*.json'):
        # Skip summary/report files
        if 'summary' in json_file.name.lower() or 'report' in json_file.name.lower():
            continue
        if json_file.name.startswith('_all'):
            continue

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Handle array of entities vs single entity
            entities = data if isinstance(data, list) else [data]

            for entity in entities:
                if 'id' in entity:
                    doc_id = entity['id']
                    db.collection(collection_name).document(doc_id).set(entity)
                    uploaded += 1

        except Exception as e:
            print(f"  ❌ Error with {json_file.name}: {e}")
            errors += 1

    print(f"  ✅ Uploaded {uploaded} entities")
    if errors > 0:
        print(f"  ⚠️  {errors} errors")

    return uploaded

# Main execution
if __name__ == '__main__':
    print('=' * 80)
    print('FIREBASE ENHANCED ASSETS UPLOAD')
    print('=' * 80)

    total_uploaded = 0

    for collection in collections:
        count = upload_collection(collection)
        total_uploaded += count

    print('\n' + '=' * 80)
    print(f'TOTAL UPLOADED: {total_uploaded} entities')
    print('=' * 80)
```

Make executable and run:
```bash
chmod +x scripts/upload-enhanced-to-firebase.py
python scripts/upload-enhanced-to-firebase.py
```

---

## Alternative: JavaScript Upload

Create `scripts/upload-collection.js`:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'eyesofazrael'
});

const db = admin.firestore();

async function uploadCollection(collectionName) {
    console.log(`\n📥 Uploading ${collectionName}...`);

    const baseDir = path.join(__dirname, '..', 'firebase-assets-enhanced', collectionName);

    if (!fs.existsSync(baseDir)) {
        console.log(`  ⚠️  Directory not found: ${baseDir}`);
        return 0;
    }

    let uploaded = 0;
    const batch = db.batch();

    // Find all JSON files
    const findJsonFiles = (dir) => {
        let files = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                files = files.concat(findJsonFiles(fullPath));
            } else if (item.name.endsWith('.json') &&
                       !item.name.includes('summary') &&
                       !item.name.startsWith('_all')) {
                files.push(fullPath);
            }
        }
        return files;
    };

    const jsonFiles = findJsonFiles(baseDir);

    for (const file of jsonFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
            const entities = Array.isArray(data) ? data : [data];

            for (const entity of entities) {
                if (entity.id) {
                    const docRef = db.collection(collectionName).doc(entity.id);
                    batch.set(docRef, entity);
                    uploaded++;
                }
            }
        } catch (error) {
            console.error(`  ❌ Error with ${path.basename(file)}:`, error.message);
        }
    }

    // Commit batch
    if (uploaded > 0) {
        await batch.commit();
        console.log(`  ✅ Uploaded ${uploaded} entities`);
    }

    return uploaded;
}

// Main execution
const collectionName = process.argv[2] || 'deities';

uploadCollection(collectionName)
    .then(count => {
        console.log(`\n✅ Successfully uploaded ${count} ${collectionName}`);
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Upload failed:', error);
        process.exit(1);
    });
```

Usage:
```bash
node scripts/upload-collection.js deities
node scripts/upload-collection.js cosmology
node scripts/upload-collection.js heroes
```

---

## Backup Before Upload

**IMPORTANT:** Backup existing Firebase data first!

```bash
# Export current Firestore data
firebase firestore:export firebase-backup-$(date +%Y%m%d)

# Or use Node script
node scripts/backup-firestore.js
```

---

## Monitoring Upload

### Watch Firestore Console
Open in browser:
```
https://console.firebase.google.com/project/eyesofazrael/firestore/data
```

### Check Upload Progress
```bash
# Count documents in collection
firebase firestore:get deities | wc -l

# Or use gcloud
gcloud firestore documents list --collection=deities | wc -l
```

---

## Rollback Plan

If upload fails or causes issues:

```bash
# Restore from backup
firebase firestore:import firebase-backup-20251225

# Or delete uploaded collection
firebase firestore:delete --collection=deities --recursive
```

---

## Post-Upload Tasks

### 1. Update Frontend
Modify entity renderers to display new fields:
- Hieroglyphics
- Mantras/Prayers
- Norse-specific data
- Worship information
- Sacred sites
- Primary sources

### 2. Test Dynamic Pages
```
http://localhost:5000/#/mythology/greek/deity/zeus
http://localhost:5000/#/mythology/norse/deity/odin
http://localhost:5000/#/mythology/egyptian/deity/anubis
```

### 3. Update Search
Add new fields to search index:
- Epithets
- Festivals
- Sacred sites
- Primary sources

### 4. Deploy to Production
```bash
firebase deploy --only firestore,hosting
```

---

## Troubleshooting

### Upload Too Slow
Use batch operations (already in scripts above)

### Permission Errors
Check Firebase Admin SDK key:
```bash
ls eyesofazrael-firebase-adminsdk-fbsvc-*.json
```

### Document Too Large
Firestore limit: 1 MB per document
- Split large entities if needed
- Move large text to subcollections

### UTF-8 Encoding Issues
Already handled in enhanced assets (all UTF-8)

---

## Success Criteria

✅ All 626+ entities uploaded
✅ Document counts match expected
✅ New fields visible in Firestore console
✅ Frontend queries return enhanced data
✅ Multi-language content displays correctly
✅ No errors in upload logs

---

**Current Status:** Ready to upload
**Recommended:** Start with Phase 1 (deities, cosmology, heroes)
**Time Estimate:** 20-30 minutes total
**Risk:** Low (backup available)

---

*Upload the enhanced assets and watch the gods come alive with rich, comprehensive mythology!*
