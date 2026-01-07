# Sacred Texts Metadata Enrichment Guide

This guide explains how to use the scripts to populate rich metadata for sacred text entities in Firebase.

## Overview

The sacred texts enrichment process consists of two steps:

1. **Local Enrichment** - Populate metadata in local JSON files
2. **Firebase Sync** - Upload enriched data to Firestore

## Metadata Fields

Each sacred text entity should contain these metadata fields:

### Core Metadata

- **author** (string): Who wrote or authored the text
  - Examples: "John (Apostle)", "Moses (Traditional)", "Egyptian Priesthood (Anonymous)"
  - Can include multiple authors separated by commas or " and "

- **period** (string): Historical period when the text was written
  - Format: "Century BCE/CE" or "Start-End Year BCE/CE"
  - Examples: "95-96 CE", "8th century BCE", "1570-1069 BCE"

- **language** (string): Original language of composition
  - Examples: "Koine Greek", "Hebrew", "Akkadian", "Egyptian (Hieroglyphic)"
  - Can include multiple languages

- **themes** (array): Major topics and concepts covered
  - Array of 4-7 key themes
  - Examples: ["Apocalyptic Vision", "Divine Justice", "End Times"]

- **structure** (string): How the text is organized
  - Describes the literary or organizational format
  - Examples: "Apocalyptic Vision - Seven seals revealing divine judgment", "Guidebook - Divided into twelve hours"

- **influence** (string): Impact on later works and traditions
  - Describes theological, cultural, or historical impact
  - Examples: "Shaped Christian eschatology throughout history", "Foundation of Egyptian afterlife beliefs"

### Optional Metadata

- **alternateNames** (array): Alternative titles or names for the text
  - Examples: ["Holy Grail", "Apocalypse", "Book of the Covenant"]

## Script 1: Local Enrichment

### File: `ENRICH_SACRED_TEXTS_METADATA.js`

This script enriches your local JSON text files with comprehensive metadata.

### Features

- Reads text files from `firebase-assets-downloaded/texts/`
- Populates empty metadata fields
- Preserves existing data
- Supports dry-run mode
- Generates detailed statistics
- Handles multiple file formats

### Usage

```bash
# Preview changes without modifying files
node ENRICH_SACRED_TEXTS_METADATA.js --dry-run

# Apply enrichment to local files
node ENRICH_SACRED_TEXTS_METADATA.js

# Specific collection
node ENRICH_SACRED_TEXTS_METADATA.js --collection texts
```

### Example Output

```
======================================================================
Sacred Texts Metadata Enrichment Script
======================================================================
Mode: LIVE UPDATE
Collection: texts

Loading text files from .../firebase-assets-downloaded/texts/...
Found 45 text files
Processing files...

✓ Updated: christian.json (23/23 texts enriched)
  Changes in christian.json:
    - christian_144000: author, period, language, themes, structure, influence
    - christian_babylon-fall-detailed: author, period, language, themes, structure, influence
    ...

======================================================================
Summary
======================================================================
Files processed: 45
Files modified: 12
Texts enriched: 87
Fields added: 522
======================================================================
```

### Enriched Fields

The script adds metadata for these text categories:

#### Christian Texts (35 texts)
- Book of Revelation passages
- Apocalyptic visions
- Prophetic parallels
- Eschatological content

#### Egyptian Texts (1 text)
- The Amduat (Book of What is in the Duat)

#### Jewish Texts (3 texts)
- Flood mythologies
- Creation mythology
- Ancient Near East parallels

## Script 2: Firebase Synchronization

### File: `SYNC_TEXTS_TO_FIREBASE.js`

This script uploads enriched text metadata from local files to Firebase Firestore.

### Features

- Batch processing for efficiency
- Dry-run mode for safety
- Error handling and detailed logging
- Firebase Admin SDK integration
- Selective syncing by mythology
- Transaction support

### Prerequisites

1. **Firebase Admin SDK** (Node.js)
   ```bash
   npm install firebase-admin
   ```

2. **Service Account Credentials**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

3. **Environment Variable**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

### Usage

```bash
# Preview changes without syncing
node SYNC_TEXTS_TO_FIREBASE.js --dry-run

# Sync all texts to Firebase
node SYNC_TEXTS_TO_FIREBASE.js

# Sync specific mythology only
node SYNC_TEXTS_TO_FIREBASE.js --mythology christian

# Custom batch size
node SYNC_TEXTS_TO_FIREBASE.js --batch-size 50

# Combined options
node SYNC_TEXTS_TO_FIREBASE.js --mythology jewish --batch-size 25
```

### Setup Instructions

#### Step 1: Get Service Account Credentials

```bash
# On Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account-key.json"

# On macOS/Linux
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

#### Step 2: Install Dependencies

```bash
cd FIREBASE/scripts
npm install firebase-admin
```

#### Step 3: Run Dry-Run First

```bash
node SYNC_TEXTS_TO_FIREBASE.js --dry-run
```

#### Step 4: Sync to Firebase

```bash
node SYNC_TEXTS_TO_FIREBASE.js
```

### Example Output

```
======================================================================
Sacred Texts Firebase Sync Script
======================================================================
Mode: DRY RUN
Collection: texts
Batch Size: 100
Mythology Filter: christian

Firebase initialized with project: eyes-of-azrael-prod

Loading text files from .../firebase-assets-downloaded/texts/...
Found 45 text files
Loading and preparing documents...

✓ Loaded 23 texts from christian.json
✓ Loaded 0 texts from egyptian.json
✓ Loaded 3 texts from jewish.json

Total documents prepared: 26

Metadata fields to sync: 156

[DRY RUN] Would sync the following:
  - Documents: 26
  - Metadata Fields: 156
  - Batch Size: 100
  - Total Batches: 1

======================================================================
Summary
======================================================================
Files processed: 45
Documents loaded: 26
Documents updated: 0
Documents failed: 0
Metadata fields synced: 156

No changes were made (dry-run mode).
Run without --dry-run flag to sync to Firebase.
======================================================================
```

## Metadata Examples

### Christian Text - Book of Revelation (Christian Apocalypse)

```json
{
  "id": "christian_four-horsemen",
  "displayName": "The Four Horsemen",
  "name": "Revelation 6",
  "mythology": "christian",
  "author": "John (Apostle)",
  "period": "95-96 CE",
  "language": "Koine Greek",
  "themes": [
    "Apocalyptic Judgment",
    "Four Horsemen",
    "Conquest and War",
    "Famine and Death",
    "Divine Justice"
  ],
  "structure": "Apocalyptic Vision - Sequential opening of seals revealing divine judgment",
  "influence": "Most iconic Christian end-times imagery; shaped eschatological expectations",
  "alternateNames": ["Four Horsemen of the Apocalypse", "Revelation 6"],
  "description": "The vision of four horsemen in John's Revelation..."
}
```

### Jewish Text - Flood Mythology

```json
{
  "id": "jewish_flood-myths-ane",
  "displayName": "The Great Flood",
  "mythology": "jewish",
  "author": "Moses (Traditional), Mesopotamian Sources",
  "period": "2100-1800 BCE (Gilgamesh), 13th century BCE (Genesis)",
  "language": "Sumerian/Akkadian (Gilgamesh), Hebrew (Genesis), Akkadian (Atrahasis)",
  "themes": [
    "Universal Destruction",
    "Divine Judgment",
    "Covenant Renewal",
    "Human Sinfulness",
    "Salvation and Preservation"
  ],
  "structure": "Comparative Mythology - Three ancient Near Eastern flood narratives",
  "influence": "Shows cultural borrowing and theological adaptation in early Jewish thought",
  "alternateNames": ["Flood Narratives", "Mesopotamian Flood Parallels"]
}
```

## Data Structure

### Local JSON Format

Each text file contains an array of text entities:

```json
[
  {
    "id": "christian_144000",
    "displayName": "The 144,000 Sealed",
    "name": "Revelation 7, 14",
    "mythology": "christian",
    "author": "John (Apostle)",
    "period": "95-96 CE",
    "language": "Koine Greek",
    "themes": [...],
    "structure": "...",
    "influence": "...",
    "description": "...",
    "type": "text"
  }
]
```

### Firebase Collection Structure

In Firestore, texts are stored in the `texts` collection:

```
/texts/
  /christian_144000
  /christian_babylon-falls
  /egyptian_amduat
  /jewish_flood-myths-ane
  ...
```

Each document contains all the enriched metadata.

## Supported Mythologies

The enrichment script includes metadata for texts from:

1. **Christian** (39 texts)
   - Book of Revelation passages
   - Apocalyptic teachings
   - Eschatological concepts

2. **Egyptian** (1 text)
   - The Amduat
   - Underworld journeys

3. **Jewish** (3 texts)
   - Genesis parallels
   - Mesopotamian comparisons
   - Ancient Near East connections

## Adding New Texts

To add metadata for new texts:

1. Add an entry to `SACRED_TEXTS_METADATA` object in `ENRICH_SACRED_TEXTS_METADATA.js`:

```javascript
SACRED_TEXTS_METADATA[
  'mythology_text-id'
] = {
  author: 'Name of Author',
  period: 'Time Period',
  language: 'Original Language',
  themes: ['Theme 1', 'Theme 2', '...'],
  structure: 'Description of structure',
  influence: 'Description of influence',
  alternateNames: ['Alt Name 1', 'Alt Name 2']
};
```

2. Run the enrichment script:
```bash
node ENRICH_SACRED_TEXTS_METADATA.js
```

3. Sync to Firebase:
```bash
node SYNC_TEXTS_TO_FIREBASE.js
```

## Troubleshooting

### Firebase Connection Issues

**Error:** `GOOGLE_APPLICATION_CREDENTIALS environment variable not set`

**Solution:**
```bash
# Windows (PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS = "path\to\service-account-key.json"

# macOS/Linux (Bash)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### JSON Parse Errors

**Error:** `File does not contain an array of texts`

**Solution:** Ensure each JSON file in `firebase-assets-downloaded/texts/` contains a valid array of text objects.

### Firebase Permission Denied

**Error:** `Permission denied when writing to Firestore`

**Solution:**
1. Check Firestore security rules allow writes to `texts` collection
2. Ensure service account has `Editor` or `Cloud Datastore Editor` role
3. Verify project ID in service account matches Firebase project

### Batch Size Too Large

**Error:** `Batch is too large`

**Solution:** Reduce batch size:
```bash
node SYNC_TEXTS_TO_FIREBASE.js --batch-size 50
```

## Best Practices

1. **Always run dry-run first**
   ```bash
   node SCRIPT_NAME.js --dry-run
   ```

2. **Review changes before syncing**
   - Check the dry-run output
   - Verify metadata accuracy
   - Test with a small subset first

3. **Backup Firebase data**
   - Export collection before large updates
   - Use version control for local files

4. **Batch processing**
   - Start with smaller batches for large datasets
   - Increase batch size gradually

5. **Metadata quality**
   - Keep themes concise (4-7 per text)
   - Use consistent date formats
   - Include multiple influences if applicable

## Performance Notes

- **Local Enrichment**: ~100 texts/second
- **Firebase Sync**: ~10-50 documents/second (network dependent)
- **Batch Size Impact**: Larger batches are more efficient but use more memory

For large updates (1000+ documents), use `--batch-size 50` for stability.

## Support and Questions

For issues or questions:

1. Check this guide's Troubleshooting section
2. Review script output carefully (includes detailed error messages)
3. Verify file formats match expected structure
4. Check Firebase console for connection issues
5. Review service account permissions

## Files Modified

After running the enrichment script, the following files will be updated:

- `firebase-assets-downloaded/texts/christian.json`
- `firebase-assets-downloaded/texts/egyptian.json`
- `firebase-assets-downloaded/texts/jewish.json`
- Other text category files containing enriched entities

**Note:** The script uses `merge: true` in Firebase updates, so existing data is preserved and only new/empty fields are populated.
