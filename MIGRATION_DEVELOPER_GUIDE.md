# Migration Developer Guide

**Technical Reference for Eyes of Azrael Firebase Migration**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Running Verification](#running-verification)
3. [Preparing Batches](#preparing-batches)
4. [Migration Workflow](#migration-workflow)
5. [Script Reference](#script-reference)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Testing Guide](#testing-guide)

---

## Quick Start

### Prerequisites

```bash
# Required software
- Python 3.8+
- Node.js 16+
- Firebase CLI
- Git

# Python packages
pip install requests beautifulsoup4 lxml

# Node packages
npm install firebase-admin
```

### Environment Setup

```bash
# Clone repository
git clone https://github.com/YourOrg/EyesOfAzrael.git
cd EyesOfAzrael

# Install dependencies
pip install -r requirements.txt
npm install

# Configure Firebase
# Place serviceAccountKey.json in project root
# (Get from Firebase Console > Project Settings > Service Accounts)

# Start local server
firebase serve --only hosting
# Access at http://localhost:5003
```

---

## Running Verification

### Purpose
Analyze all HTML files and compare to Firebase content to determine migration status.

### Basic Usage

```bash
cd H:/Github/EyesOfAzrael
python scripts/verify-migration-simple.py
```

### Output

The script generates `migration-verification-report.csv` with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| html_file | Relative path to HTML file | mythos/greek/deities/zeus.html |
| html_word_count | Number of words in HTML | 1250 |
| firebase_collection | Best matching Firebase collection | deities |
| firebase_asset_id | Matching entity ID | zeus |
| firebase_asset_name | Entity name | Zeus |
| html_text_in_asset_pct | % of HTML text found in Firebase | 95.2 |
| asset_text_in_html_pct | % of Firebase text found in HTML | 92.8 |
| migration_percentage | Average of both percentages | 94.0 |
| migration_status | Status label | Complete |

### Interpreting Results

**Migration Status Categories:**

```python
if migration_pct >= 90:
    status = "Complete"         # Ready for production
elif migration_pct >= 70:
    status = "Mostly Migrated"  # Minor updates needed
elif migration_pct >= 50:
    status = "Partially Migrated"  # Significant work needed
elif migration_pct >= 25:
    status = "Minimal Migration"   # Mostly not migrated
else:
    status = "Not Migrated"     # Needs full migration
```

### Advanced Options

```python
# Modify script to filter by mythology
def find_html_files(base_path, mythology='greek'):
    """Find HTML files for specific mythology"""
    html_files = []
    mythology_path = base_path / f'mythos/{mythology}'

    for html_file in mythology_path.rglob('*.html'):
        if should_exclude(html_file):
            continue
        html_files.append(html_file)

    return html_files

# Modify script to check specific entity type
COLLECTIONS_TO_CHECK = ['deities']  # Only check deities
```

### Performance Tips

```python
# For faster execution, reduce collections checked
collections = ['deities', 'heroes']  # Instead of all 13

# For detailed analysis, increase context window
html_words = set(w for w in html_text.split() if len(w) > 3)  # Longer words only

# For quicker scans, sample files
html_files = random.sample(all_files, 100)  # Random sample
```

---

## Preparing Batches

### Purpose
Split files into equal batches for parallel agent processing.

### Basic Usage

```bash
python scripts/prepare-migration-batches.py
```

### Output Structure

```
migration-batches/
├── batch-1.json  (52 files, avg 12.5% migrated)
├── batch-2.json  (52 files, avg 18.3% migrated)
├── batch-3.json  (52 files, avg 24.7% migrated)
├── batch-4.json  (52 files, avg 31.2% migrated)
├── batch-5.json  (52 files, avg 37.8% migrated)
├── batch-6.json  (52 files, avg 44.1% migrated)
├── batch-7.json  (51 files, avg 50.9% migrated)
├── batch-8.json  (51 files, avg 57.3% migrated)
└── summary.json
```

### Batch File Format

```json
{
  "batch_number": 1,
  "total_files": 52,
  "avg_migration_pct": 12.5,
  "files": [
    {
      "html_file": "mythos/greek/deities/zeus.html",
      "html_word_count": "1250",
      "firebase_collection": "deities",
      "firebase_asset_id": "zeus",
      "firebase_asset_name": "Zeus",
      "html_text_in_asset_pct": "5.2",
      "asset_text_in_html_pct": "3.1",
      "migration_percentage": "4.15",
      "migration_status": "Not Migrated"
    }
  ]
}
```

### Customizing Batch Size

```python
# In prepare-migration-batches.py

# Change number of batches
batches = create_batches(all_to_process, num_batches=10)  # 10 agents

# Create batches by mythology instead of size
def create_batches_by_mythology(files):
    batches = {}
    for file in files:
        mythology = extract_mythology(file['html_file'])
        if mythology not in batches:
            batches[mythology] = []
        batches[mythology].append(file)
    return list(batches.values())

# Create batches by priority
def create_priority_batches(files):
    high_priority = [f for f in files if f['migration_percentage'] < 25]
    medium_priority = [f for f in files if 25 <= f['migration_percentage'] < 50]
    low_priority = [f for f in files if f['migration_percentage'] >= 50]
    return [high_priority, medium_priority, low_priority]
```

### Exclusion Patterns

```python
# Add more exclusion patterns
EXCLUDE_PATTERNS = [
    'index.html',
    'login.html',
    'dashboard.html',
    'components/',
    'templates/',
    'BACKUP_',
    'debug-',
    'test-',
    'your-custom-pattern/',  # Add custom exclusions
]

# Exclude by file size
def should_exclude(filepath):
    if os.path.getsize(filepath) < 1000:  # Files < 1KB
        return True
    # ... other checks
```

---

## Migration Workflow

### Complete Migration Pipeline

```
┌──────────────────────────────────────────────────────────┐
│              COMPLETE MIGRATION WORKFLOW                  │
└──────────────────────────────────────────────────────────┘

Step 1: Verification
├─ Run verify-migration-simple.py
├─ Review migration-verification-report.csv
└─ Identify files needing migration

Step 2: Batch Preparation
├─ Run prepare-migration-batches.py
├─ Review batch distribution in summary.json
└─ Assign batches to agents

Step 3: Extraction
├─ Run extraction script for entity type
├─ Review extraction output JSON
└─ Validate data structure

Step 4: Upload
├─ Run upload-entities.js
├─ Verify upload in Firebase Console
└─ Check for errors in logs

Step 5: Conversion
├─ Run convert-to-firebase.py
├─ Verify HTML updated correctly
└─ Test in local server

Step 6: Verification
├─ Re-run verify-migration-simple.py
├─ Check migration percentage increased
└─ Validate in browser

Step 7: Cleanup
├─ Update MIGRATION_TRACKER.json
├─ Commit changes to Git
└─ Document any issues
```

### Step-by-Step Guide

#### Step 1: Extract Content

```bash
# Extract deities
python scripts/extract-deity-content.py

# Extract cosmology
python scripts/extract-cosmology.py

# Extract heroes
python scripts/extract-heroes.py

# Extract creatures
python scripts/extract-creatures.py

# Extract rituals
python scripts/extract-rituals.py

# Extract everything else
python scripts/extract-all-remaining.py
```

**Output:** `scripts/{type}_extraction.json`

**Validation:**
```python
# Verify extraction file
import json

with open('scripts/deities_extraction.json', 'r') as f:
    data = json.load(f)

print(f"Total entities extracted: {len(data)}")

# Check for required fields
for entity in data:
    assert 'id' in entity, f"Missing id: {entity}"
    assert 'name' in entity, f"Missing name: {entity}"
    assert 'mythology' in entity, f"Missing mythology: {entity}"
    assert 'entityType' in entity, f"Missing entityType: {entity}"
```

---

#### Step 2: Upload to Firebase

```bash
# Upload with dry-run (test mode)
node scripts/upload-entities.js --input scripts/deities_extraction.json --dry-run

# Review output, then upload for real
node scripts/upload-entities.js --input scripts/deities_extraction.json --upload

# Upload specific mythology only
node scripts/upload-entities.js \
  --input scripts/deities_extraction.json \
  --mythology greek \
  --upload
```

**Validation:**
```bash
# Check Firebase Console
# https://console.firebase.google.com/project/eyesofazrael/firestore

# Or verify via script
node scripts/verify-upload.js --mythology greek --type deity
```

---

#### Step 3: Convert HTML Files

```bash
# Convert all deity pages
python scripts/convert-to-firebase.py --type deity

# Convert specific mythology
python scripts/convert-to-firebase.py --type deity --mythology greek

# Convert single file (for testing)
python scripts/convert-to-firebase.py \
  --file mythos/greek/deities/zeus.html \
  --type deity \
  --mythology greek
```

**What it does:**
1. Detects entity type from file path
2. Adds Firebase SDK script
3. Includes appropriate renderer component
4. Replaces content div with data-attributes
5. Preserves hero/header sections

**Before:**
```html
<div class="content">
  <div class="attribute-grid">
    <div class="subsection-card">
      <div class="attribute-label">Titles</div>
      <div class="attribute-value">Sky Father, Cloud Gatherer</div>
    </div>
  </div>
</div>
```

**After:**
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.x/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x/firebase-firestore.js"></script>

<!-- Entity Renderer -->
<script src="../../../js/components/attribute-grid-renderer.js"></script>

<div class="content"
     data-auto-populate
     data-mythology="greek"
     data-entity-id="zeus"
     data-entity-type="deity"></div>
```

---

#### Step 4: Test Locally

```bash
# Start Firebase local server
firebase serve --only hosting

# Access in browser
http://localhost:5003/mythos/greek/deities/zeus.html

# Check browser console for errors
# Verify content loads from Firebase
# Test editing (if authenticated)
```

---

#### Step 5: Verify Migration

```bash
# Re-run verification
python scripts/verify-migration-simple.py

# Check specific file
grep "zeus.html" migration-verification-report.csv

# Expected output:
# mythos/greek/deities/zeus.html,1250,deities,zeus,Zeus,95.2,92.8,94.0,Complete
```

---

#### Step 6: Update Tracker

```bash
# Update MIGRATION_TRACKER.json
node scripts/update-tracker.js --type deity --status completed

# Or manually edit MIGRATION_TRACKER.json
{
  "byEntityType": {
    "deity": {
      "total": 194,
      "extracted": 194,
      "uploaded": 194,
      "converted": 194,
      "status": "completed"
    }
  }
}
```

---

## Script Reference

### Extraction Scripts

#### extract-deity-content.py

**Purpose:** Extract deity attributes, myths, relationships

**Usage:**
```bash
python scripts/extract-deity-content.py

# Optional: Specific mythology
python scripts/extract-deity-content.py --mythology greek

# Optional: Single file
python scripts/extract-deity-content.py --file mythos/greek/deities/zeus.html
```

**Key Functions:**
```python
def extract_attributes(soup):
    """Extract attribute grid (titles, domains, symbols, etc.)"""

def extract_myths(soup):
    """Extract myths as ordered list"""

def extract_relationships(soup):
    """Extract family, consorts, allies"""

def extract_worship(soup):
    """Extract sacred sites, festivals, offerings"""
```

**Output Schema:**
```python
{
    'id': str,
    'entityType': 'deity',
    'name': str,
    'mythology': str,
    'attributes': {
        'titles': str,
        'domains': str,
        'symbols': str,
        'colors': str,
        'animals': str,
        'plants': str
    },
    'myths': [
        {'title': str, 'content': str, 'order': int}
    ],
    'relationships': {
        'family': {...},
        'consorts': [...],
        'allies': [...]
    },
    'worship': {
        'sites': [...],
        'festivals': [...],
        'offerings': [...]
    }
}
```

---

#### extract-cosmology.py

**Purpose:** Extract cosmology concepts (creation, afterlife, realms)

**Key Functions:**
```python
def detect_cosmology_type(title):
    """Auto-detect: creation, afterlife, realms, etc."""

def extract_structure(soup):
    """Extract hierarchical structures"""

def extract_timeline(soup):
    """Extract timeline events"""
```

---

#### extract-heroes.py

**Purpose:** Extract hero biographies, deeds, divine connections

**Key Functions:**
```python
def extract_biography(soup):
    """Extract birth, early life, death"""

def extract_deeds(soup):
    """Extract ordered list of deeds/labors"""

def extract_divine_connections(soup):
    """Extract father, mother, patron, enemy"""
```

---

#### extract-creatures.py

**Purpose:** Extract creature descriptions, abilities, encounters

**Key Functions:**
```python
def extract_physical_description(soup):
    """Extract appearance, size, features"""

def extract_abilities(soup):
    """Extract powers, weaknesses"""

def extract_habitat(soup):
    """Extract origin and habitat"""

def extract_encounters(soup):
    """Extract famous encounters with heroes"""
```

---

#### extract-rituals.py

**Purpose:** Extract ritual procedures, timing, materials

**Key Functions:**
```python
def extract_procedure(soup):
    """Extract step-by-step instructions"""

def extract_timing(soup):
    """Extract when ritual is performed"""

def extract_materials(soup):
    """Extract required materials and offerings"""

def extract_participants(soup):
    """Extract roles and participant requirements"""
```

---

#### extract-all-remaining.py

**Purpose:** Universal extractor for all other entity types

**Key Features:**
- Auto-detects entity type from file path
- Dynamic field extraction
- Handles diverse HTML structures

**Usage:**
```bash
python scripts/extract-all-remaining.py
# Outputs: scripts/remaining_extraction.json
```

---

### Upload Scripts

#### upload-entities.js

**Purpose:** Upload extracted JSON to Firebase

**Usage:**
```bash
# Dry run (test mode)
node scripts/upload-entities.js \
  --input scripts/deities_extraction.json \
  --dry-run

# Real upload
node scripts/upload-entities.js \
  --input scripts/deities_extraction.json \
  --upload

# Specific mythology
node scripts/upload-entities.js \
  --input scripts/deities_extraction.json \
  --mythology greek \
  --upload

# Batch mode (with rate limiting)
node scripts/upload-entities.js \
  --input scripts/deities_extraction.json \
  --upload \
  --batch-size 10 \
  --delay 1000
```

**Error Handling:**
```javascript
// Automatic retry on failure
async function uploadWithRetry(entity, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await uploadToFirebase(entity);
      return true;
    } catch (error) {
      console.error(`Attempt ${i+1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

---

### Conversion Scripts

#### convert-to-firebase.py

**Purpose:** Convert HTML files to use Firebase components

**Usage:**
```bash
# Convert all files of type
python scripts/convert-to-firebase.py --type deity

# Convert specific mythology
python scripts/convert-to-firebase.py --type deity --mythology greek

# Convert single file
python scripts/convert-to-firebase.py \
  --file mythos/greek/deities/zeus.html \
  --type deity \
  --mythology greek

# Dry run (preview only)
python scripts/convert-to-firebase.py \
  --type deity \
  --dry-run
```

**Conversion Process:**
```python
def convert_file(html_path, entity_type, mythology, entity_id):
    """
    1. Read original HTML
    2. Detect entity type (if not provided)
    3. Add Firebase SDK scripts
    4. Add appropriate renderer component
    5. Replace content div with data-attributes
    6. Preserve hero/header sections
    7. Write updated HTML
    """
```

---

## Rollback Procedures

### Emergency Rollback

If migration causes issues, follow these steps:

#### 1. Rollback Files from Git

```bash
# Restore specific file
git checkout HEAD -- mythos/greek/deities/zeus.html

# Restore entire directory
git checkout HEAD -- mythos/greek/deities/

# Restore all changes
git reset --hard HEAD
```

#### 2. Delete Firebase Data

```javascript
// Delete specific entity
await db.collection('entities')
  .doc('greek')
  .collection('deity')
  .doc('zeus')
  .delete();

// Delete entire subcollection (use with caution!)
const batch = db.batch();
const snapshot = await db.collection('entities')
  .doc('greek')
  .collection('deity')
  .get();

snapshot.docs.forEach(doc => {
  batch.delete(doc.ref);
});

await batch.commit();
```

#### 3. Restore from Backup

```bash
# If you created backup before migration
cp -r backup/mythos/greek/deities/* mythos/greek/deities/

# Restore Firebase data from export
firebase firestore:import backup/firestore-export/
```

### Partial Rollback

```bash
# Rollback specific entity type
git checkout HEAD -- mythos/*/deities/

# Rollback specific mythology
git checkout HEAD -- mythos/greek/

# Rollback specific files from list
while read file; do
  git checkout HEAD -- "$file"
done < files-to-rollback.txt
```

### Prevention

**Always create backups before migration:**

```bash
# Backup files
cp -r mythos/ backup/mythos-$(date +%Y%m%d)/

# Backup Firebase
firebase firestore:export backup/firestore-$(date +%Y%m%d)/

# Create Git branch
git checkout -b migration-backup
git add .
git commit -m "Backup before migration"
git checkout main
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Extraction Script Fails

**Symptom:** Script crashes with parsing error

**Diagnosis:**
```python
# Run in debug mode
python scripts/extract-deity-content.py --debug

# Check specific file
python -c "
from bs4 import BeautifulSoup
with open('mythos/greek/deities/zeus.html', 'r') as f:
    soup = BeautifulSoup(f, 'html.parser')
    print(soup.prettify())
"
```

**Solutions:**
```python
# Add error handling
try:
    attributes = extract_attributes(soup)
except Exception as e:
    print(f"Failed to extract attributes: {e}")
    attributes = {}

# Check HTML structure
if not soup.find('div', class_='attribute-grid'):
    print("Warning: No attribute grid found")
    return None
```

---

#### Issue 2: Upload Fails

**Symptom:** Entities not appearing in Firebase

**Diagnosis:**
```javascript
// Check Firebase rules
// Go to Firebase Console > Firestore > Rules

// Test connection
const testConnection = async () => {
  try {
    const doc = await db.collection('entities').doc('test').set({
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Connection successful');
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

**Solutions:**
```javascript
// Check serviceAccountKey.json exists
if (!fs.existsSync('./serviceAccountKey.json')) {
  console.error('Missing serviceAccountKey.json');
  process.exit(1);
}

// Verify Firebase rules allow write
// Update rules in Firebase Console:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /entities/{mythology}/{type}/{entityId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

// Use Admin SDK for script uploads (bypasses rules)
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json')
});
```

---

#### Issue 3: Content Not Rendering

**Symptom:** Blank page or "Loading..." never completes

**Diagnosis:**
```javascript
// Check browser console (F12)
// Look for errors

// Common errors:
// - Firebase SDK not loaded
// - Renderer script not found
// - Wrong data-attributes
// - CORS issues
```

**Solutions:**
```html
<!-- Verify Firebase SDK loaded -->
<script>
console.log('Firebase:', typeof firebase);
console.log('Firestore:', typeof firebase.firestore);
</script>

<!-- Verify renderer loaded -->
<script>
console.log('Renderer:', typeof AttributeGridRenderer);
</script>

<!-- Check data-attributes -->
<div class="content"
     data-auto-populate
     data-mythology="greek"
     data-entity-id="zeus"
     data-entity-type="deity">
  <!-- Should auto-populate -->
</div>

<!-- Add fallback content -->
<div class="content" data-auto-populate ...>
  <div class="fallback">
    Loading... If this persists, please refresh.
  </div>
</div>
```

---

#### Issue 4: Migration Percentage Not Increasing

**Symptom:** Verification shows same percentage after migration

**Diagnosis:**
```bash
# Check if HTML actually updated
git diff mythos/greek/deities/zeus.html

# Check if Firebase has data
node -e "
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json')
});
const db = admin.firestore();
db.collection('entities').doc('greek').collection('deity').doc('zeus').get()
  .then(doc => console.log(doc.exists ? doc.data() : 'NOT FOUND'));
"
```

**Solutions:**
```python
# Clear cache in verification script
# Delete cache before re-running
import os
if os.path.exists('.verification_cache'):
    os.remove('.verification_cache')

# Run fresh verification
python scripts/verify-migration-simple.py

# Check specific file
grep "zeus.html" migration-verification-report.csv
```

---

### Debug Mode

Add debug logging to scripts:

```python
# In extraction scripts
import logging
logging.basicConfig(level=logging.DEBUG)

def extract_attributes(soup):
    logging.debug(f"Extracting attributes from {soup.title}")
    # ... extraction logic
    logging.debug(f"Found {len(attributes)} attributes")
```

```javascript
// In upload scripts
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Entity:', JSON.stringify(entity, null, 2));
  console.log('Upload path:', uploadPath);
}
```

---

## Testing Guide

### Unit Tests

```python
# test_extraction.py
import unittest
from scripts.extract_deity_content import extract_attributes

class TestExtraction(unittest.TestCase):
    def test_extract_attributes(self):
        html = """
        <div class="attribute-grid">
          <div class="subsection-card">
            <div class="attribute-label">Titles</div>
            <div class="attribute-value">Sky Father</div>
          </div>
        </div>
        """
        soup = BeautifulSoup(html, 'html.parser')
        attrs = extract_attributes(soup)

        self.assertIn('titles', attrs)
        self.assertEqual(attrs['titles'], 'Sky Father')

if __name__ == '__main__':
    unittest.main()
```

### Integration Tests

```javascript
// test_upload.js
const admin = require('firebase-admin');

describe('Upload Integration Tests', () => {
  beforeAll(() => {
    admin.initializeApp({
      credential: admin.credential.cert('./serviceAccountKey.json')
    });
  });

  test('Upload deity to Firebase', async () => {
    const entity = {
      id: 'test-deity',
      entityType: 'deity',
      name: 'Test Deity',
      mythology: 'test'
    };

    await uploadEntity(entity);

    const doc = await db.collection('entities')
      .doc('test')
      .collection('deity')
      .doc('test-deity')
      .get();

    expect(doc.exists).toBe(true);
    expect(doc.data().name).toBe('Test Deity');
  });

  afterAll(async () => {
    // Cleanup
    await db.collection('entities')
      .doc('test')
      .collection('deity')
      .doc('test-deity')
      .delete();
  });
});
```

### End-to-End Tests

```bash
# E2E test script
#!/bin/bash

echo "Starting E2E migration test..."

# 1. Extract test file
echo "1. Extracting test file..."
python scripts/extract-deity-content.py \
  --file mythos/test/deities/test-deity.html \
  --output test_extraction.json

# 2. Upload to Firebase
echo "2. Uploading to Firebase..."
node scripts/upload-entities.js \
  --input test_extraction.json \
  --upload

# 3. Convert HTML
echo "3. Converting HTML..."
python scripts/convert-to-firebase.py \
  --file mythos/test/deities/test-deity.html \
  --type deity \
  --mythology test

# 4. Verify migration
echo "4. Verifying migration..."
python scripts/verify-migration-simple.py

# 5. Check results
MIGRATION_PCT=$(grep "test-deity.html" migration-verification-report.csv | cut -d',' -f8)
if (( $(echo "$MIGRATION_PCT > 90" | bc -l) )); then
  echo "✓ E2E test PASSED (${MIGRATION_PCT}%)"
  exit 0
else
  echo "✗ E2E test FAILED (${MIGRATION_PCT}%)"
  exit 1
fi
```

---

## Best Practices

### 1. Always Test First

```bash
# Use --dry-run flags
python scripts/convert-to-firebase.py --type deity --dry-run
node scripts/upload-entities.js --input data.json --dry-run

# Test on single file
python scripts/extract-deity-content.py \
  --file mythos/greek/deities/zeus.html
```

### 2. Create Backups

```bash
# Before each phase
git checkout -b backup-$(date +%Y%m%d-%H%M)
git add .
git commit -m "Backup before Phase X"

# Backup Firebase
firebase firestore:export backup/firestore-$(date +%Y%m%d)/
```

### 3. Verify Incrementally

```bash
# After each batch
python scripts/verify-migration-simple.py
git diff migration-verification-report.csv

# Check specific files
grep "batch-1" migration-verification-report.csv
```

### 4. Document Issues

```bash
# Keep log of issues
echo "$(date): Issue with zeus.html - missing attributes" >> migration.log

# Track resolved issues
git commit -m "Fix: Added missing attributes to zeus.html (Issue #123)"
```

### 5. Use Version Control

```bash
# Commit after each phase
git add .
git commit -m "Phase 2 complete: All deities migrated (194 entities)"
git tag phase-2-complete

# Push to remote
git push origin main --tags
```

---

## Additional Resources

### Documentation
- [MIGRATION_MASTER_DOCUMENTATION.md](MIGRATION_MASTER_DOCUMENTATION.md) - Complete overview
- [FIREBASE_UNIFIED_SCHEMA.md](FIREBASE_UNIFIED_SCHEMA.md) - Schema reference
- [MIGRATION_TRACKER.json](MIGRATION_TRACKER.json) - Real-time progress

### Firebase Console
- [Firestore Database](https://console.firebase.google.com/project/eyesofazrael/firestore)
- [Project Settings](https://console.firebase.google.com/project/eyesofazrael/settings)

### Support
- Create GitHub Issue for bugs
- Check existing documentation first
- Review migration.log for common issues

---

*Developer Guide Version: 1.0*
*Last Updated: 2025-12-27*
*Status: Complete and Tested*
