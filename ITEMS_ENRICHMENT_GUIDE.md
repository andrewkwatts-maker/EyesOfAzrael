# Sacred Items Metadata Enrichment Guide

## Overview

This guide explains how to enrich sacred item entities in Firebase with rich metadata fields including:
- **powers**: Magical abilities
- **wielders**: Famous users of the item
- **origin**: How it was created
- **materials**: What it's made of
- **symbolism**: What it represents
- **currentLocation**: Where it resides (if applicable)

## Current Status

We have **184 sacred items** in the database with varying levels of metadata completeness:

| Field | Items with Data | % Complete |
|-------|-----------------|-----------|
| Powers | 140 | 76.1% |
| Wielders | 103 | 56.0% |
| Origin | 54 | 29.3% |
| Materials | 43 | 23.4% |
| Symbolism | 66 | 35.9% |
| Current Location | 5 | 2.7% |

## Quick Start

### Step 1: Enrich Items Locally

```bash
# Dry run (no files modified)
node scripts/enrich-items-metadata.js --dry-run

# Actually enrich items
node scripts/enrich-items-metadata.js
```

This creates enriched JSON files in `firebase-assets-enriched/items/`

### Step 2: Review Output

The script generates:
- Enriched item files in `firebase-assets-enriched/items/`
- Summary statistics
- Sample results showing what was populated

### Step 3: Upload to Firebase

For **local Firebase emulator**:
```bash
# Terminal 1: Start emulator
npm run firebase:emulator

# Terminal 2: Upload enriched items
node scripts/upload-items-enriched.js --test
```

For **live Firebase** (use with caution):
```bash
node scripts/upload-items-enriched.js
```

## How Enrichment Works

### Powers Extraction

The enrichment script identifies magical abilities from:

1. **Existing `powers` field** - Uses what's already there
2. **Symbolism text** - Searches for keywords like:
   - "never miss" → Unerring accuracy
   - "always return" → Self-returning
   - "immortal" → Immortality
   - "heal" → Healing
   - "invincib" → Invincibility
   - And 15+ more patterns

3. **Description and shortDescription** - Extracts ability mentions

**Example**: For Gungnir (Odin's spear), the script identifies:
- Unerring accuracy (from "never misses")
- Self-returning (from "returns to his hand")

### Wielders Extraction

Identifies famous users from:

1. **Existing `wielders` field** - Uses what's already there
2. **Associated deities** - From `mythologyContexts` section
3. **Extended content** - Sections titled "Wielders" or similar

**Example**: For Mjolnir:
- Thor (primary wielder)
- Magni and Modi (sons of Thor)

### Origin Extraction

Locates creation/crafting information from:

1. **Extended content sections** - Titled:
   - "Creation Myth"
   - "Crafting"
   - "Origin"
   - "How it was forged"

2. **Interpretations** - Sections about creation stories

**Example**: Gungnir was crafted by "The Sons of Ivaldi, master dwarf craftsmen"

### Materials Extraction

Uses existing materials field or extracts from:
- Symbolism text mentioning composition
- Description of what the item is made of

**Example**: Ankh is made from "Gold, bronze, faience, wood, stone"

### Symbolism Extraction

Uses the existing `symbolism` field as-is, which contains rich descriptions of what the item represents spiritually and culturally.

**Example**: The Ankh represents "life force, protection, and eternal existence"

### Current Location Extraction

Searches extended content for sections about:
- "Location"
- "Current resting place"
- "Where it resides"
- "Housed in"

Also checks symbolism for phrases like "kept in [location]"

**Example**: Aaron's Rod "kept inside the Ark of the Covenant"

## Data Structure

### Original Item Format

```json
{
  "id": "gungnir",
  "name": "Gungnir",
  "symbolism": "...",
  "materials": ["..."],
  "extendedContent": [
    {
      "title": "Creation Myth and Crafting",
      "content": "..."
    }
  ],
  "mythologyContexts": [
    {
      "associatedDeities": [
        {"name": "Odin", "type": "deity"}
      ]
    }
  ]
}
```

### Enriched Output

```json
{
  "id": "gungnir",
  "name": "Gungnir",

  // All original fields preserved
  "symbolism": "...",
  "materials": ["..."],

  // New enriched fields
  "powers": [
    "Unerring accuracy",
    "Self-returning",
    "Determination of fate"
  ],
  "wielders": [
    "Odin"
  ],
  "origin": "Gungnir's creation is inextricably linked with...",
  "currentLocation": "Carried by Odin in Asgard",

  // Enrichment metadata
  "_metadata_enriched": {
    "timestamp": "2026-01-01T...",
    "version": "1.0",
    "fields": {
      "powers": true,
      "wielders": true,
      "origin": true,
      "materials": true,
      "symbolism": true,
      "currentLocation": true
    }
  }
}
```

## Command Options

### enrich-items-metadata.js

```bash
node scripts/enrich-items-metadata.js [OPTIONS]

Options:
  --dry-run    Preview changes without saving (default: false)
  --upload     Show Firebase upload instructions (default: false)
```

### upload-items-enriched.js

```bash
node scripts/upload-items-enriched.js [OPTIONS]

Options:
  --test       Use Firebase emulator (default: auto-detect)
  --verbose    Print progress for each item (default: false)
  --batch N    Items per upload batch (default: 50)
```

## Troubleshooting

### Items Directory Not Found

```
Error: Items directory not found: .../firebase-assets-enriched/items
```

**Solution**: Run enrichment script first:
```bash
node scripts/enrich-items-metadata.js
```

### Firebase Connection Failed

```
Error initializing Firebase: No default credentials found
```

**Solutions**:
1. Place `serviceAccountKey.json` in project root
2. Or set `FIREBASE_PROJECT_ID` environment variable
3. Or use `--test` flag for local emulator

### Upload Fails Mid-Batch

The script uses Firestore's atomic batch writes. If a batch fails:
1. Fix the error
2. Re-run the script (will retry failed items)
3. Check Firestore logs for details

## Verification

After uploading, verify the data with:

```bash
# Check Firebase has items
firebase firestore:inspect items --limit 5

# Or use console query
db.collection('items').limit(5).get()
```

Look for:
- `powers` array with 2+ items
- `wielders` array with 1+ items
- `origin` string with 50+ characters
- `_metadata_enriched` field with enrichment timestamp

## Integration with Frontend

The frontend can now use enriched fields:

### Display Powers
```javascript
item.powers?.forEach(power => {
  // Render power badge/chip
});
```

### Show Wielders
```javascript
if (item.wielders?.length > 0) {
  // Display "Wielders: [list]"
  // Link to deity/hero pages
}
```

### Highlight Origin
```javascript
if (item.origin) {
  // Render expanded "How it was created" section
}
```

### Show Current Location
```javascript
if (item.currentLocation) {
  // Display in "Resting Place" section
}
```

## Batch Processing

For processing large numbers of items:

```bash
# Process with verbose output to track progress
node scripts/enrich-items-metadata.js --verbose > enrichment.log

# Upload with smaller batches if memory is an issue
node scripts/upload-items-enriched.js --batch 25
```

## Manual Enrichment

For items needing manual enhancement, edit the enriched JSON directly:

```json
{
  "id": "my-item",
  "powers": ["Added power"],
  "wielders": ["Added wielder"],
  "origin": "Custom origin story...",
  "currentLocation": "Manually added location"
}
```

Then upload:
```bash
node scripts/upload-items-enriched.js
```

## Performance

- **Enrichment script**: ~30 seconds for 184 items
- **Upload**: ~2-3 seconds per batch (50 items)
- **Total process**: ~5 minutes including Firebase initialization

## Next Steps

1. Run enrichment on all 184 items
2. Review sample outputs
3. Upload to Firebase staging/test environment
4. Verify data integrity
5. Update frontend to display new fields
6. Deploy to production

## Related Resources

- Entity enrichment scripts: `scripts/enrich-*-metadata.js`
- Firebase utilities: `scripts/validate-firebase-assets.js`
- Schema validation: `scripts/validate-schema.js`
