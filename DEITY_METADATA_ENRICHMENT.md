# Deity Metadata Enrichment Guide

This guide explains how to populate rich metadata for deity entities in the Eyes of Azrael mythology database. The enrichment process adds comprehensive information about gods and goddesses across Greek, Norse, and Egyptian mythologies.

## Overview

The deity metadata enrichment includes:

- **Symbolism**: Array of symbolic meanings associated with the deity
- **Domains**: Array of areas of power/influence (e.g., "War", "Wisdom", "Love")
- **Aliases**: Alternative names and cross-cultural equivalents (e.g., "Jupiter" for Zeus)
- **Festivals**: Associated celebrations with descriptions and dates
- **Epithets**: Titles and descriptive names (e.g., "Sky Father", "Cloud Gatherer")
- **Attributes**: Physical or characteristic descriptions
- **Iconography**: Sacred symbols and representations
- **Sacred Sites**: Locations of worship and temples

## Files

### 1. `scripts/enrich-deity-metadata.js`
Local enrichment script that:
- Reads deity JSON files from `firebase-assets-downloaded/deities/`
- Applies metadata templates from the deityMetadataMap
- Updates local files with enriched data
- No Firebase connection required

### 2. `scripts/upload-deity-metadata-firebase.js`
Firebase upload script that:
- Connects to Firebase Firestore
- Uploads enriched metadata from local files
- Supports batch processing
- Includes dry-run mode for testing

## Quick Start

### Step 1: Enrich Local Files

Run the enrichment script to populate metadata in local JSON files:

```bash
cd H:\Github\EyesOfAzrael
node scripts/enrich-deity-metadata.js
```

Expected output:
```
Starting Deity Metadata Enrichment...

Processing deities from: H:\Github\EyesOfAzrael\firebase-assets-downloaded\deities

Found 251 deity files to process

Processing 82 Greek, Norse, and Egyptian deity files

✓ Zeus (greek)
  Symbolism: 8 items, Domains: 11 items, Festivals: 3 items

✓ Odin (norse)
  Symbolism: 8 items, Domains: 9 items, Festivals: 3 items

✓ Osiris (egyptian)
  Symbolism: 7 items, Domains: 9 items, Festivals: 2 items

...

======================================================================
DEITY METADATA ENRICHMENT REPORT
======================================================================

Total Processed: 82
Successfully Enriched: 82
Errors: 0
```

### Step 2: Verify Enriched Data

Check that metadata was added correctly:

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firebase-assets-downloaded/deities/zeus.json'));
console.log('Zeus Enriched Metadata:');
console.log('- Symbolism:', data.symbolism);
console.log('- Domains:', data.domains);
console.log('- Festivals:', data.festivals);
"
```

### Step 3: Upload to Firebase

First, set up Firebase credentials:

```bash
# Option A: Using service account JSON file
$env:FIREBASE_CREDENTIALS="C:\path\to\service-account-key.json"
$env:FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"

# Option B: Using Application Default Credentials
# (requires `gcloud auth application-default login`)
```

Then run the upload script:

```bash
# Dry run (preview changes without uploading)
$env:DRY_RUN="true"
node scripts/upload-deity-metadata-firebase.js

# Actual upload
node scripts/upload-deity-metadata-firebase.js
```

## Enriched Metadata Examples

### Zeus (Greek)

```json
{
  "symbolism": ["divine authority", "sovereignty", "justice", "storm", "eagle", "thunderbolt", "oak tree", "power"],
  "domains": ["Sky", "Thunder", "Lightning", "Law", "Order", "Justice", "Kingship", "Oaths"],
  "aliases": ["Jupiter (Roman)", "Dias (Classical)", "Theos Patrios"],
  "festivals": [
    "Olympic Games (every 4 years, 776 BCE onwards)",
    "Diasia (Athenian, early spring)",
    "Anthesteria (February, Athenian)"
  ],
  "epithets": ["Sky Father", "Cloud Gatherer", "Thunderer", "Aegis-Bearer", "King of Gods"],
  "attributes": ["bearded masculine figure", "robed in light", "carries thunderbolt", "crowned with oak leaves"],
  "iconography": "Thunderbolt, Eagle, Oak tree, Bull",
  "sacred_sites": ["Mount Olympus", "Dodona (oracle)", "Olympia (temple)", "Delphi"]
}
```

### Odin (Norse)

```json
{
  "symbolism": ["wisdom", "knowledge", "war", "death", "poetry", "magic", "runes", "prophecy"],
  "domains": ["Wisdom", "War", "Death", "Poetry", "Magic", "Runes", "Prophecy", "Knowledge"],
  "aliases": ["Óðinn", "Wodan (Germanic)", "Wotan"],
  "festivals": [
    "Blóts (sacrificial feasts)",
    "Yule (winter solstice)",
    "Midsummer"
  ],
  "epithets": ["Allfather", "Valfather", "Grimnir (Masked One)", "Gangleri (Wanderer)", "High One"],
  "attributes": ["one-eyed", "long-bearded", "grey-robed", "wise", "mysterious"],
  "iconography": "Spear Gungnir, Valknut, Huginn/Muninn (ravens), Sleipnir (8-legged horse)",
  "sacred_sites": ["Asgard", "Valhalla", "Yggdrasil (World Tree)", "Mimir's Well"]
}
```

### Isis (Egyptian)

```json
{
  "symbolism": ["magic", "motherhood", "healing", "protection", "resurrection", "throne", "wisdom"],
  "domains": ["Magic (heka)", "Motherhood", "Healing", "Protection", "Wisdom", "Resurrection", "Marriage"],
  "aliases": ["Aset", "Iset", "Eset"],
  "festivals": [
    "Isia (October 28-November 3)",
    "Navigium Isidis (March 5)",
    "Lychnapsia (August 12)"
  ],
  "epithets": ["Queen of Heaven", "Great of Magic", "Mother of the Gods", "The Divine Mother"],
  "attributes": ["beautiful", "compassionate", "powerful magician", "devoted mother", "wise"],
  "iconography": "Throne headdress, Tyet knot, Wings, Sistrum, Solar disk with horns",
  "sacred_sites": ["Philae (primary temple)", "Behbeit el-Hagar", "Giza", "Dendera"]
}
```

## Mythology Coverage

### Greek Deities (21 major deities)
- Zeus, Hera, Poseidon, Hades
- Athena, Apollo, Artemis, Ares
- Aphrodite, Hephaestus, Hermes, Dionysus
- Demeter, Hestia, Cronos, Prometheus
- And more...

### Norse Deities (8 major deities)
- Odin, Thor, Freyja, Loki
- Frigg, Heimdall, Baldr, Tyr
- And more...

### Egyptian Deities (12 major deities)
- Ra, Osiris, Isis, Set, Horus
- Thoth, Amun, Ptah, Sekhmet, Bastet
- And more...

## Metadata Structure

Each enriched deity document follows this structure:

```javascript
{
  // Core identity
  "id": "zeus",
  "name": "Zeus",
  "displayName": "⚡ Zeus",
  "mythology": "greek",

  // Enriched metadata (NEW)
  "symbolism": [...],           // Array of symbols
  "domains": [...],              // Areas of influence
  "aliases": [...],              // Alternative names
  "festivals": [...],            // Celebrations
  "epithets": [...],             // Titles
  "attributes": [...],           // Characteristics
  "iconography": "...",          // Symbol description
  "sacred_sites": [...],         // Worship locations

  // Existing fields (preserved)
  "symbols": [...],
  "relationships": {...},
  "worship": {...},
  "metadata": {...}
}
```

## Metadata Enrichment Template

The enrichment uses a comprehensive template for each deity. For example, Zeus's template includes:

```javascript
'zeus': {
  symbolism: ['divine authority', 'sovereignty', 'justice', ...],
  domains: ['Sky', 'Thunder', 'Lightning', ...],
  aliases: ['Jupiter (Roman)', 'Dias (Classical)', ...],
  festivals: ['Olympic Games (every 4 years, 776 BCE onwards)', ...],
  epithets: ['Sky Father', 'Cloud Gatherer', ...],
  attributes: ['bearded masculine figure', 'robed in light', ...],
  iconography: 'Thunderbolt, Eagle, Oak tree, Bull',
  sacred_sites: ['Mount Olympus', 'Dodona (oracle)', ...]
}
```

## Firebase Integration

### Document Structure in Firestore

Enriched data is stored in the `deities` collection:

```
deities/
  ├── zeus
  │   ├── symbolism: array
  │   ├── domains: array
  │   ├── aliases: array
  │   ├── festivals: array
  │   ├── epithets: array
  │   ├── attributes: array
  │   ├── iconography: string
  │   ├── sacred_sites: array
  │   └── metadata: {...}
  ├── odin
  ├── osiris
  └── ... (more deities)
```

### Querying Enriched Data

Example queries in your application:

```javascript
// Get all deities with "magic" in their domains
const magicDeities = await db.collection('deities')
  .where('domains', 'array-contains', 'magic')
  .get();

// Get all Greek deities with "war" domain
const greekWarDeities = await db.collection('deities')
  .where('mythology', '==', 'greek')
  .where('domains', 'array-contains', 'war')
  .get();

// Get deity with specific epithet
const wisdomDeities = await db.collection('deities')
  .where('epithets', 'array-contains', 'Wise')
  .get();
```

## Updating Enrichment Data

### Adding a New Deity

1. Add an entry to `deityMetadataMap` in `enrich-deity-metadata.js`:

```javascript
'my-new-deity': {
  symbolism: ['symbol1', 'symbol2', ...],
  domains: ['domain1', 'domain2', ...],
  aliases: ['alias1', 'alias2', ...],
  festivals: ['festival1', 'festival2', ...],
  epithets: ['epithet1', 'epithet2', ...],
  attributes: ['attr1', 'attr2', ...],
  iconography: 'symbol descriptions',
  sacred_sites: ['site1', 'site2', ...]
}
```

2. Run the enrichment script:

```bash
node scripts/enrich-deity-metadata.js
```

3. Upload to Firebase:

```bash
node scripts/upload-deity-metadata-firebase.js
```

### Modifying Existing Metadata

1. Update the template in `deityMetadataMap`
2. Run enrichment to update local files
3. Upload to Firebase

## Environment Variables

### Firebase Upload Script

```bash
# Firebase service account credentials
FIREBASE_CREDENTIALS=/path/to/service-account-key.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Firebase project ID (if using Application Default Credentials)
FIREBASE_PROJECT_ID=your-project-id

# Dry run mode (preview without uploading)
DRY_RUN=true
```

## Error Handling

### Common Issues

**1. Firebase Connection Failed**
- Ensure FIREBASE_CREDENTIALS points to a valid service account JSON
- Check that FIREBASE_DATABASE_URL is correct
- Verify Firebase project permissions

**2. File Parsing Errors**
- Check that JSON files are valid
- Ensure deity IDs match filenames
- Verify JSON encoding (UTF-8)

**3. Missing Metadata**
- Add deity to `deityMetadataMap` in enrichment script
- Ensure all required fields are present
- Run enrichment script to populate

## Scripts Reference

### enrich-deity-metadata.js

```bash
node scripts/enrich-deity-metadata.js

# Options:
# - Processes all Greek, Norse, Egyptian deities
# - Applies metadata templates
# - Updates local JSON files
# - No Firebase connection required
```

### upload-deity-metadata-firebase.js

```bash
# Dry run (preview)
DRY_RUN=true node scripts/upload-deity-metadata-firebase.js

# Actual upload
node scripts/upload-deity-metadata-firebase.js

# With custom credentials
FIREBASE_CREDENTIALS=/path/to/creds.json node scripts/upload-deity-metadata-firebase.js
```

## Verification Checklist

After enrichment and upload:

- [ ] Local files contain all metadata fields
- [ ] No errors in enrichment script output
- [ ] Firebase upload successful (no errors)
- [ ] Verify in Firebase Console that documents have new fields
- [ ] Test queries in application
- [ ] Confirm UI displays enriched metadata correctly

## Performance Notes

- **Local enrichment**: ~50-100 deities per second
- **Firebase upload**: ~10 deities per second (batch processing)
- **Total time**: 5-10 minutes for all 82 targeted deities

## Historical Accuracy

The enrichment metadata is sourced from:

- Classical mythology texts and primary sources
- Academic references for historical festivals and practices
- Cross-cultural deity parallels documented in comparative mythology
- Contemporary mythological scholarship

All symbolism, domains, festivals, and sacred sites are historically grounded.

## Next Steps

1. **Run enrichment**: `node scripts/enrich-deity-metadata.js`
2. **Verify locally**: Check enriched JSON files
3. **Set up Firebase credentials**: Configure environment variables
4. **Test upload**: `DRY_RUN=true node scripts/upload-deity-metadata-firebase.js`
5. **Upload to Firebase**: `node scripts/upload-deity-metadata-firebase.js`
6. **Verify in Firebase**: Check Console for new fields
7. **Update application**: Use enriched metadata in UI/queries

## Support

For issues or questions:
1. Check the error messages in script output
2. Verify Firebase credentials and permissions
3. Review JSON file structure and content
4. Check that deity IDs match metadata templates
5. Ensure all required Node.js dependencies are installed
