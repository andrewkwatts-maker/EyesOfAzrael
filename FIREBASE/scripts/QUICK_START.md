# Sacred Texts Metadata - Quick Start Guide

## TL;DR

Two-step process to populate sacred text metadata in Firebase:

### Step 1: Enrich Local Files

```bash
cd H:\Github\EyesOfAzrael
node FIREBASE/scripts/ENRICH_SACRED_TEXTS_METADATA.js
```

This populates empty metadata fields in JSON files with:
- `author` - Who wrote the text
- `period` - When it was written
- `language` - Original language
- `themes` - Major topics (array)
- `structure` - How it's organized
- `influence` - Impact on later works
- `alternateNames` - Alternative titles (array)

### Step 2: Sync to Firebase

```bash
# Set up credentials (do this once)
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account-key.json"

# Install dependencies (do this once)
cd FIREBASE/scripts
npm install firebase-admin

# Preview changes (optional but recommended)
node SYNC_TEXTS_TO_FIREBASE.js --dry-run

# Sync to Firebase
node SYNC_TEXTS_TO_FIREBASE.js
```

## Files Modified

- `ENRICH_SACRED_TEXTS_METADATA.js` - Enriches local JSON files with metadata
- `SYNC_TEXTS_TO_FIREBASE.js` - Uploads enriched data to Firebase Firestore
- `SACRED_TEXTS_ENRICHMENT_GUIDE.md` - Full documentation

## Supported Texts

Currently enriched with metadata:

- **Christian** (39 texts): Revelation passages, apocalyptic visions, eschatological concepts
- **Egyptian** (1 text): The Amduat (Book of What is in the Duat)
- **Jewish** (3 texts): Genesis parallels, Mesopotamian comparisons, flood mythology

Total: **43 sacred texts** with comprehensive metadata

## Example Enriched Text

```json
{
  "id": "christian_four-horsemen",
  "displayName": "The Four Horsemen of the Apocalypse",
  "name": "Revelation 6",
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
  "alternateNames": [
    "Four Horsemen of the Apocalypse",
    "Revelation 6"
  ]
}
```

## Command Reference

### Enrichment Script

```bash
# Preview changes (safe)
node ENRICH_SACRED_TEXTS_METADATA.js --dry-run

# Apply changes
node ENRICH_SACRED_TEXTS_METADATA.js

# Specific collection
node ENRICH_SACRED_TEXTS_METADATA.js --collection texts
```

### Sync Script

```bash
# Preview Firebase sync (safe)
node SYNC_TEXTS_TO_FIREBASE.js --dry-run

# Sync all texts
node SYNC_TEXTS_TO_FIREBASE.js

# Sync specific mythology only
node SYNC_TEXTS_TO_FIREBASE.js --mythology christian
node SYNC_TEXTS_TO_FIREBASE.js --mythology jewish
node SYNC_TEXTS_TO_FIREBASE.js --mythology egyptian

# Custom batch size (for large updates)
node SYNC_TEXTS_TO_FIREBASE.js --batch-size 50

# Combined options
node SYNC_TEXTS_TO_FIREBASE.js --mythology christian --batch-size 25 --dry-run
```

## Firebase Setup

If this is your first time syncing to Firebase:

1. Get service account key:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file

2. Set environment variable:
   ```powershell
   # Windows PowerShell
   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account-key.json"
   ```

3. Install Firebase Admin SDK:
   ```bash
   cd FIREBASE/scripts
   npm install firebase-admin
   ```

4. Run sync with dry-run first:
   ```bash
   node SYNC_TEXTS_TO_FIREBASE.js --dry-run
   ```

5. If preview looks good:
   ```bash
   node SYNC_TEXTS_TO_FIREBASE.js
   ```

## Data Fields Explained

### author
The original author or traditional attribution of the text.
- Examples: "John (Apostle)", "Moses (Traditional)", "Egyptian Priesthood"
- Can be multiple authors: "Isaiah, Jeremiah, John"

### period
The historical period when the text was written.
- Format: "Year-Year BCE/CE" or "Century BCE/CE"
- Examples: "95-96 CE", "8th century BCE", "1570-1069 BCE (New Kingdom)"

### language
The original language of composition.
- Examples: "Koine Greek", "Hebrew", "Akkadian", "Egyptian (Hieroglyphic)"
- Multiple: "Hebrew (Isaiah), Koine Greek (Revelation)"

### themes (array)
4-7 major topics or concepts covered by the text.
- Examples: ["Apocalyptic Vision", "Divine Justice", "End Times"]
- Should be specific, not generic

### structure
How the text is organized or what type of literary work it is.
- Example: "Apocalyptic Vision - Sequential opening of seals revealing divine judgment"
- Include both format and purpose

### influence
The impact this text had on later works, traditions, or theology.
- Example: "Shaped Christian eschatology throughout history"
- Include both immediate and long-term impact

### alternateNames (array)
Alternative titles or names by which the text is known.
- Examples: ["Holy Grail", "Apocalypse", "Book of the Covenant"]
- Include common variations

## Status Check

To verify enrichment was applied:

```bash
# Check a specific file
grep -A 5 '"author"' firebase-assets-downloaded/texts/christian_four-horsemen.json

# Count enriched texts
grep -l '"author"' firebase-assets-downloaded/texts/*.json | wc -l
```

## Troubleshooting

**Script not found**: Make sure you're in the project root directory
```bash
cd H:\Github\EyesOfAzrael
```

**Firebase connection error**: Check environment variable is set
```bash
$env:GOOGLE_APPLICATION_CREDENTIALS  # Should show path
```

**Files already enriched**: Rerun will skip if metadata already present
```bash
node ENRICH_SACRED_TEXTS_METADATA.js --dry-run
```

**Permission denied in Firestore**: Ensure service account has Editor role in Firebase project

## Next Steps

After syncing to Firebase:

1. Verify in Firebase Console > Firestore > Collection `texts`
2. Check that documents have author, period, language, themes, structure, influence fields
3. Test querying by mythology or theme
4. Consider adding more text categories (Hindu, Norse, Islamic, etc.)

## Adding New Texts

To add metadata for new texts:

1. Add entry to `SACRED_TEXTS_METADATA` object in `ENRICH_SACRED_TEXTS_METADATA.js`
2. Run enrichment script
3. Sync to Firebase
4. Done!

Example:
```javascript
SACRED_TEXTS_METADATA['hindu_bhagavad-gita'] = {
  author: 'Vyasa (Traditional)',
  period: '400 BCE - 400 CE (likely 2nd century BCE)',
  language: 'Sanskrit',
  themes: ['Dharma', 'Yoga', 'Devotion', 'Duty', 'Liberation'],
  structure: 'Philosophical Dialogue - 700 verses of Krishna\'s teaching',
  influence: 'Foundational to Hindu philosophy and spirituality',
  alternateNames: ['Gita', 'Sacred Song of the Lord']
};
```

## Support

For detailed information, see `SACRED_TEXTS_ENRICHMENT_GUIDE.md`

Questions? Check the guide's troubleshooting section or review script output carefully.
