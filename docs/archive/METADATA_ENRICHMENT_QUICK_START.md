# Firebase Metadata Enrichment - Quick Start Guide

## TL;DR - Run This Now

```bash
# 1. Preview what will happen (safe, no changes)
node scripts/enrich-firebase-metadata.js --dry-run

# 2. Run the enrichment
node scripts/enrich-firebase-metadata.js

# 3. Validate results
node scripts/validate-firebase-metadata.js
```

That's it! Your Firebase assets now have:
- ✓ Timestamps (createdAt, updatedAt)
- ✓ Importance scores (0-100)
- ✓ Auto-extracted tags
- ✓ Searchable text
- ✓ Display order for sorting
- ✓ Featured flag (top 10%)
- ✓ Completeness scores (0-100)

---

## What Each Script Does

### Enrichment Script
```bash
node scripts/enrich-firebase-metadata.js
```
- Downloads all Firebase assets
- Calculates 8 metadata fields
- Updates Firebase in batches
- Generates report: `FIREBASE_METADATA_ENRICHMENT_REPORT.json`
- Takes ~5-10 minutes for all collections

### Validation Script
```bash
node scripts/validate-firebase-metadata.js
```
- Checks metadata coverage
- Validates data types and ranges
- Shows distributions
- Lists issues
- Generates report: `FIREBASE_METADATA_VALIDATION_REPORT.json`
- Takes ~2-3 minutes

### Batch Update Script
```bash
node scripts/batch-update-firebase-metadata.js REPORT.json
```
- Applies updates from a saved report
- Useful for re-applying known-good metadata
- Takes ~3-5 minutes

---

## Common Commands

### Test on One Collection First
```bash
# Dry run on deities only
node scripts/enrich-firebase-metadata.js --dry-run --collection=deities

# Enrich deities only
node scripts/enrich-firebase-metadata.js --collection=deities

# Validate deities only
node scripts/validate-firebase-metadata.js --collection=deities
```

### Full Workflow
```bash
# Step 1: Preview
node scripts/enrich-firebase-metadata.js --dry-run

# Step 2: Execute
node scripts/enrich-firebase-metadata.js

# Step 3: Validate
node scripts/validate-firebase-metadata.js

# Step 4: Check reports
cat FIREBASE_METADATA_ENRICHMENT_REPORT.json
cat FIREBASE_METADATA_VALIDATION_REPORT.json
```

---

## Metadata Fields Explained (Simple)

| Field | What It Does | Example |
|-------|--------------|---------|
| **createdAt** | When entity was created | 2025-12-27T10:30:00Z |
| **updatedAt** | When last modified | 2025-12-27T15:45:00Z |
| **importance** | How important (0-100) | 85 (very important) |
| **tags** | Keywords for filtering | ["greek", "deity", "thunder", "sky"] |
| **search_text** | For full-text search | "zeus king of gods thunder lightning..." |
| **display_order** | For A-Z sorting | "zeus" (not "Zeus" or "The Zeus") |
| **featured** | Should highlight? | true (top 10% only) |
| **completeness_score** | How complete (0-100) | 92 (very complete) |

---

## Importance Score Explained

**How it's calculated**:
- Base score by type (deity=70, hero=65, etc.)
- +5 to +10 for good description
- +up to 15 for rich content panels
- +up to 5 for relationships
- +5 for images
- +2 for icon
- +up to 10 for attributes
- +5 for sources
- +up to 5 for tags

**What it means**:
- 90-100: Major entities (Zeus, Thor, Buddha)
- 70-89: Important entities (most deities)
- 50-69: Standard entities (minor gods, heroes)
- 30-49: Supporting entities (creatures, places)
- 0-29: Stub entries (needs work)

---

## Completeness Score Explained

**Required fields (60 points)**:
- Has name/title?
- Has type?
- Has mythology?
- Has section?
- Has description?

**Optional fields (40 points)**:
- Has subtitle?
- Has icon?
- Has image?
- Has rich content?
- Has attributes?
- Has tags?
- Has related content?
- Has sources?
- Has pantheon?
- Has role?

**Bonus (5 points)**:
- 5+ rich content panels

**What it means**:
- 90-100: Excellent (fully documented)
- 70-89: Good (most fields filled)
- 50-69: Adequate (core fields only)
- 30-49: Incomplete (missing key info)
- 0-29: Stub (needs major work)

---

## Reading the Reports

### Enrichment Report
```json
{
  "summary": {
    "totalAssets": 1234,        // Total entities processed
    "totalFeatured": 124,        // 10% marked as featured
    "avgImportance": 67,         // Average importance score
    "avgCompleteness": 78        // Average completeness
  },
  "collections": [
    {
      "collection": "deities",
      "total": 150,
      "featured": 15,            // Top 10% of deities
      "avgImportance": 75,
      "avgCompleteness": 82
    }
  ]
}
```

### Validation Report
```json
{
  "summary": {
    "totalAssets": 1234,
    "totalErrors": 0,            // Should be 0!
    "totalWarnings": 12          // Minor issues
  },
  "collections": [
    {
      "collection": "deities",
      "stats": {
        "coverage": {
          "importance": {
            "present": 150,
            "percentage": 100      // 100% = good!
          }
        }
      }
    }
  ]
}
```

---

## Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### "Service account not found"
```bash
# Ensure this file exists in project root:
eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json
```

### "Permission denied"
- Check Firebase service account has read/write permissions
- Verify projectId is correct

### "Validation shows errors"
```bash
# Re-run enrichment to fix
node scripts/enrich-firebase-metadata.js
```

---

## Using New Metadata in Frontend

### Get Featured Content
```javascript
const featured = await db.collection('deities')
  .where('featured', '==', true)
  .orderBy('importance', 'desc')
  .limit(10)
  .get();
```

### Search
```javascript
const searchTerm = 'thunder';
const results = await db.collection('deities')
  .orderBy('search_text')
  .startAt(searchTerm.toLowerCase())
  .endAt(searchTerm.toLowerCase() + '\uf8ff')
  .get();
```

### Sort Alphabetically
```javascript
const sorted = await db.collection('deities')
  .orderBy('display_order')
  .get();
```

### Find Incomplete Content
```javascript
const incomplete = await db.collection('deities')
  .where('completeness_score', '<', 60)
  .orderBy('completeness_score')
  .get();
```

### Filter by Tags
```javascript
const tagged = await db.collection('deities')
  .where('tags', 'array-contains', 'thunder')
  .get();
```

---

## When to Re-Run

### Re-run enrichment when:
- Added new content
- Updated existing content
- Changed entity importance
- Monthly maintenance

### Re-run validation when:
- After enrichment
- After manual Firebase edits
- Weekly checks
- Before major releases

---

## Files You'll Get

After running scripts, you'll have:

1. **FIREBASE_METADATA_ENRICHMENT_REPORT.json** - What was enriched
2. **FIREBASE_METADATA_VALIDATION_REPORT.json** - Validation results
3. Console output showing progress

---

## Success Indicators

**After enrichment, you should see**:
- ✓ 100% metadata coverage
- ✓ ~10% featured per collection
- ✓ Average importance: 60-70
- ✓ Average completeness: 70-80
- ✓ 0 validation errors

**If you see issues**:
- Re-run enrichment script
- Check validation report
- Review console output

---

## Need More Info?

- **Full Guide**: `FIREBASE_METADATA_ENRICHMENT_GUIDE.md`
- **Implementation Report**: `METADATA_ENRICHMENT_REPORT.md`
- **Script Inline Docs**: Check comments in scripts

---

## Cheat Sheet

```bash
# Most common workflow
node scripts/enrich-firebase-metadata.js --dry-run     # Preview
node scripts/enrich-firebase-metadata.js               # Execute
node scripts/validate-firebase-metadata.js             # Verify

# Test on one collection
node scripts/enrich-firebase-metadata.js --collection=deities

# View reports
cat FIREBASE_METADATA_ENRICHMENT_REPORT.json
cat FIREBASE_METADATA_VALIDATION_REPORT.json

# Archive reports (monthly)
mkdir -p reports/$(date +%Y-%m)
mv FIREBASE_METADATA_*.json reports/$(date +%Y-%m)/
```

---

**Quick Start Created**: December 27, 2025
**Estimated Time**: 15 minutes total
**Difficulty**: Easy (just run 3 commands)
**Risk**: Low (dry-run tested)
