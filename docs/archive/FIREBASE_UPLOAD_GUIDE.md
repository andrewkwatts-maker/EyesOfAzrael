# Firebase Batch Upload Guide

Complete guide for uploading validated entities to Firestore using the batch upload system.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Command Reference](#command-reference)
- [Upload Strategies](#upload-strategies)
- [Collection Mapping](#collection-mapping)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## Overview

The Firebase batch upload system provides a robust, production-ready solution for uploading 582+ entities from parsed JSON files to Firestore. It includes:

- **Batch Processing**: Uploads in batches of 500 documents (Firestore limit)
- **Progress Tracking**: Real-time progress bars and statistics
- **Error Handling**: Automatic retry with exponential backoff
- **Rate Limiting**: Prevents quota exhaustion
- **Verification**: Post-upload validation and integrity checks
- **Conflict Resolution**: Multiple strategies for handling existing data

---

## Prerequisites

### 1. Firebase Service Account

You need a Firebase service account JSON file for authentication.

**How to get it:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `eyesofazrael`
3. Click ⚙️ (Settings) → Project Settings
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save as `firebase-service-account.json` in project root

**Security:** Never commit this file to Git! It's already in `.gitignore`.

### 2. Node.js Dependencies

Install required packages:

```bash
npm install firebase-admin
```

### 3. Data Preparation

Ensure your parsed data is ready:

```bash
# Check parsed data directory
ls FIREBASE/parsed_data/

# Should contain files like:
# - greek_parsed.json
# - norse_parsed.json
# - egyptian_parsed.json
# etc.
```

---

## Quick Start

### Test Run (Dry Run)

Always test first without uploading:

```bash
node scripts/firebase-batch-upload.js --mythology greek --dry-run
```

**Output:**
```
🚀 Firebase Batch Upload
================================================================================
⚠️  DRY RUN MODE - No data will be uploaded

📂 Loading entities...
   Found 145 entities across 7 collections

   Mythology filter: greek

📦 Uploading to deities
   Total: 22 entities in 1 batch(es)

   [DRY RUN] Batch 1/1 - Would upload 22 entities to deities
```

### Upload Greek Mythology

```bash
node scripts/firebase-batch-upload.js --mythology greek
```

### Upload All Deities

```bash
node scripts/firebase-batch-upload.js --type deity
```

### Upload Everything

```bash
node scripts/firebase-batch-upload.js --all
```

---

## Command Reference

### Basic Syntax

```bash
node scripts/firebase-batch-upload.js [options]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--mythology <name>` | Upload entities from specific mythology | `--mythology greek` |
| `--type <type>` | Upload entities of specific type | `--type deity` |
| `--all` | Upload all entities from all mythologies | `--all` |
| `--dry-run` | Test without uploading | `--dry-run` |
| `--strategy <mode>` | Conflict resolution strategy | `--strategy merge` |
| `--help`, `-h` | Show help message | `--help` |

### Examples

#### Example 1: Upload Greek Deities Only

```bash
# Test first
node scripts/firebase-batch-upload.js --mythology greek --type deity --dry-run

# Then upload
node scripts/firebase-batch-upload.js --mythology greek --type deity
```

**Output:**
```
Starting Firebase upload...
Mythology: greek | Type: deity | Files: 22

Batch 1/1 (22 documents)
[████████████████████] 100% | 22/22 uploaded

Summary:
✓ Uploaded: 22
✗ Failed: 0
⊙ Skipped: 0
Time: 3.4s
```

#### Example 2: Upload All Norse Content

```bash
node scripts/firebase-batch-upload.js --mythology norse
```

#### Example 3: Upload All Heroes Across All Mythologies

```bash
node scripts/firebase-batch-upload.js --type hero
```

#### Example 4: Full Migration

```bash
# Upload everything with merge strategy (preserves existing data)
node scripts/firebase-batch-upload.js --all --strategy merge
```

---

## Upload Strategies

The script supports three conflict resolution strategies:

### 1. Overwrite (Default)

Replaces existing documents completely, but preserves user statistics (views, likes).

```bash
node scripts/firebase-batch-upload.js --all --strategy overwrite
```

**Use when:**
- Initial upload
- Updating official content
- Fixing data issues

**Behavior:**
- Replaces all fields
- Preserves: `views`, `likes`
- Updates: everything else

### 2. Skip

Skips documents that already exist.

```bash
node scripts/firebase-batch-upload.js --all --strategy skip
```

**Use when:**
- Adding new content only
- Preserving user edits
- Incremental uploads

**Behavior:**
- Checks if document exists
- If exists: skip
- If new: upload

### 3. Merge

Merges incoming data with existing, preserving important fields.

```bash
node scripts/firebase-batch-upload.js --all --strategy merge
```

**Use when:**
- Updating content
- Preserving user data
- Adding new fields

**Behavior:**
- Merges objects
- Preserves: `createdAt`, `views`, `likes`, user edits
- Updates: content fields

---

## Collection Mapping

Entities are automatically routed to collections based on their type:

| Entity Type | Firestore Collection |
|-------------|---------------------|
| `deity` | `deities` |
| `hero` | `heroes` |
| `creature`, `being`, `spirit` | `creatures` |
| `place`, `realm`, `location` | `places` |
| `item`, `artifact`, `relic`, `weapon` | `items` |
| `text`, `scripture`, `book` | `texts` |
| `concept`, `teaching`, `practice` | `concepts` |
| `ritual`, `magic`, `ceremony` | `rituals` |
| `event` | `events` |
| `myth` | `myths` |
| `cosmology` | `cosmology` |
| `symbol` | `symbols` |

**Example:** A deity entity from `greek_parsed.json` goes to → `deities` collection.

---

## Data Transformation

Entities are transformed during upload:

### Input (Parsed JSON)

```json
{
  "id": "zeus",
  "name": "Zeus",
  "type": "deity",
  "mythology": "greek",
  "summary": "King of the gods...",
  "panels": [...]
}
```

### Output (Firestore Document)

```json
{
  "id": "zeus",
  "name": "Zeus",
  "type": "deity",
  "mythology": "greek",
  "summary": "King of the gods...",
  "panels": [...],

  // Added fields
  "status": "published",
  "authorId": "official",
  "isOfficial": true,
  "searchTerms": ["zeus", "king", "gods", "thunder", "greek"],

  // Timestamps (server-generated)
  "createdAt": "2024-12-15T10:30:00Z",
  "updatedAt": "2024-12-15T10:30:00Z",

  // Migration metadata
  "migrationSource": "html_parser",
  "migrationDate": "2024-12-15T10:30:00Z",

  // Stats (initialized)
  "views": 0,
  "likes": 0
}
```

### Key Transformations

1. **Search Terms Generation**
   - Extracts keywords from name, description, tags
   - Converts to lowercase
   - Removes duplicates
   - Adds mythology and type

2. **Status Fields**
   - Sets `status: 'published'` for official content
   - Marks `isOfficial: true`
   - Sets `authorId: 'official'`

3. **Timestamps**
   - Uses Firebase server timestamps
   - Ensures consistency across all documents

---

## Verification

After upload, verify data integrity:

```bash
node scripts/verify-firebase-upload.js --all
```

### What It Checks

1. **Document Existence**: All uploaded documents exist
2. **Field Completeness**: Required fields present
3. **Special Characters**: Proper encoding (no `&amp;`, etc.)
4. **Search Terms**: Generated correctly
5. **Query Functionality**: Collections are queryable
6. **Data Types**: Fields have correct types

### Verification Output

```
🔍 Firebase Upload Verification
================================================================================
Verifying 12 collection(s)...

================================================================================
📁 Collection: deities
================================================================================

📊 deities
   ------------------------------------------------------------
   Documents: 190
   Mythologies: 15 (greek, norse, egyptian, hindu, celtic...)
   Types: 1 (deity)

   Field Coverage:
     - Description: 190/190 (100%)
     - Search Terms: 190/190 (100%) avg: 12.5
     - Panels: 185/190 (97%) avg: 8.3

   ✅ No issues found

   Checked: 10 documents
   Passed: 10/10 (100%)

   Query Tests: 3/3 passed
      ✅ Query by mythology: 5 results
      ✅ Query by status: 5 results
      ✅ Order by createdAt: 5 results

...

📋 Verification Summary
================================================================================

Collections: 12/12 have data
Total Documents: 582
Issues: 0 collections have issues

Top Collections:
   deities              190 documents
   creatures            87 documents
   heroes               65 documents
   places               52 documents
   concepts             48 documents

Mythologies: 15 total
   aztec, babylonian, buddhist, celtic, chinese, christian, egyptian, greek,
   hindu, islamic, japanese, mayan, norse, roman, sumerian

✅ Verification report saved: firebase-verification-report.json
```

### Verify Specific Collection

```bash
node scripts/verify-firebase-upload.js --collection deities --sample 50
```

---

## Progress Tracking

The upload system tracks progress in multiple ways:

### 1. Real-Time Progress Bar

```
📦 Uploading to deities
   Total: 190 entities in 1 batch(es)

   ✅ Batch 1/1 [████████████████████] 100% | 190/190
```

### 2. Migration Tracker

Updates `MIGRATION_TRACKER.json`:

```json
{
  "stats": {
    "lastUpload": "2024-12-15T10:30:00Z",
    "uploaded": 582,
    "failed": 0,
    "collections": {
      "deities": { "uploaded": 190, "failed": 0 },
      "heroes": { "uploaded": 65, "failed": 0 }
    }
  },
  "lastUpdated": "2024-12-15T10:30:00Z"
}
```

### 3. Migration Log

Appends to `MIGRATION_LOG.md`:

```markdown
## 2024-12-15T10:30:00Z

Uploaded 582 entities across 12 collections.
Filters: mythology=all, type=all
Time: 45.3s
```

### 4. Error Log

Failed uploads logged to `firebase-upload-errors.log`:

```
[2024-12-15T10:30:00Z] Batch write failed
{"collection": "deities", "batchNum": 2, "entityCount": 100}
Error: Quota exceeded
================================================================================
```

---

## Troubleshooting

### Issue: "firebase-service-account.json not found"

**Solution:**
```bash
# Download from Firebase Console (see Prerequisites)
# Place in project root
ls firebase-service-account.json  # Should exist
```

### Issue: "Quota exceeded"

**Cause:** Too many writes too quickly.

**Solution:**
```bash
# Use rate limiting (automatic in script)
# Or upload in smaller batches:
node scripts/firebase-batch-upload.js --mythology greek
# Wait a few minutes
node scripts/firebase-batch-upload.js --mythology norse
```

### Issue: "Some entities failed to upload"

**Check error log:**
```bash
cat firebase-upload-errors.log
```

**Retry failed entities:**
```bash
# Script automatically retries 3 times
# For persistent failures, check individual entity JSON
```

### Issue: "No entities found"

**Check parsed data:**
```bash
ls FIREBASE/parsed_data/*.json

# Verify file contents
node -e "const data = require('./FIREBASE/parsed_data/greek_parsed.json'); console.log(Object.keys(data));"
```

### Issue: "Special characters not preserved"

**Example:** `Athēnā` becomes `Athena`

**Solution:** Already handled in transformation. If still an issue:

```bash
# Verify in Firestore Console
# Check entity JSON source
# Re-parse HTML if needed
```

---

## Advanced Usage

### Upload with Custom Rate Limiting

Edit `firebase-batch-upload.js`:

```javascript
const RATE_LIMIT_DELAY = 500; // Increase to 500ms between batches
```

### Upload to Custom Collections

Edit `ENTITY_COLLECTIONS` mapping:

```javascript
const ENTITY_COLLECTIONS = {
  deity: 'deities',
  hero: 'heroes',
  custom_type: 'custom_collection'  // Add your mapping
};
```

### Batch Size Adjustment

```javascript
const BATCH_SIZE = 250; // Reduce if hitting limits
```

### Progress Callback

For integration with other systems:

```javascript
// In firebase-batch-upload.js
function onProgress(uploaded, total) {
  console.log(`Progress: ${uploaded}/${total}`);
  // Your custom logic here
}
```

### Filtering During Upload

Modify `loadEntitiesFromFiles()` to add custom filters:

```javascript
// Skip entities without descriptions
if (!entity.description || entity.description.length < 50) {
  continue;
}

// Only upload complete entities
if (entity.completeness < 80) {
  continue;
}
```

---

## Migration Checklist

Use this checklist for a complete migration:

### Pre-Migration

- [ ] Firebase service account JSON downloaded
- [ ] Dependencies installed (`npm install`)
- [ ] Parsed data validated (`node scripts/validate-json-structure.js`)
- [ ] Dry run successful (`--dry-run`)
- [ ] Backup existing Firestore data (if any)

### Migration

- [ ] Upload Greek mythology (`--mythology greek`)
- [ ] Verify Greek upload
- [ ] Upload Norse mythology (`--mythology norse`)
- [ ] Verify Norse upload
- [ ] Upload remaining mythologies one by one
- [ ] Upload special collections (herbs, rituals, etc.)
- [ ] Full verification (`--all`)

### Post-Migration

- [ ] Verify document counts in Firestore Console
- [ ] Test frontend queries
- [ ] Check search functionality
- [ ] Verify special characters preserved
- [ ] Test cross-references
- [ ] Update MIGRATION_TRACKER.json
- [ ] Archive parsed data files

---

## Performance Metrics

Expected performance (from testing):

| Operation | Entities | Time | Rate |
|-----------|----------|------|------|
| Upload 22 deities | 22 | 3.4s | 6.5 docs/sec |
| Upload 190 deities | 190 | 28s | 6.8 docs/sec |
| Upload 582 all entities | 582 | 85s | 6.8 docs/sec |

**Notes:**
- Rate limited to ~7 docs/sec to avoid quotas
- Includes verification time
- Network speed affects timing

---

## Support & Resources

### Documentation

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Batch Writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore Quotas](https://firebase.google.com/docs/firestore/quotas)

### Project Files

- **Upload Script**: `scripts/firebase-batch-upload.js`
- **Verification Script**: `scripts/verify-firebase-upload.js`
- **Migration Config**: `scripts/migration-config.js`
- **Entity Schema**: `FIREBASE/entity-schema-v2.0.md`

### Getting Help

1. Check error logs: `firebase-upload-errors.log`
2. Review migration log: `MIGRATION_LOG.md`
3. Verify data: `node scripts/verify-firebase-upload.js`
4. Test queries in Firebase Console

---

## Summary

The Firebase batch upload system provides:

✅ **Robust uploading** with automatic retry and rate limiting
✅ **Progress tracking** with real-time feedback
✅ **Conflict resolution** with multiple strategies
✅ **Comprehensive verification** of uploaded data
✅ **Error handling** with detailed logging
✅ **Flexible filtering** by mythology and type

Ready to upload your 582+ entities to Firebase with confidence!

---

**Next Steps:**

1. Run dry run: `node scripts/firebase-batch-upload.js --all --dry-run`
2. Upload data: `node scripts/firebase-batch-upload.js --all`
3. Verify upload: `node scripts/verify-firebase-upload.js --all`
4. Check Firebase Console: https://console.firebase.google.com/project/eyesofazrael/firestore
