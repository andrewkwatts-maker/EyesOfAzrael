# Firebase Asset Fix Guide

**Purpose:** Fix Firebase assets that are missing required fields (name, type, mythology, description, etc.)

**Date:** 2025-12-27

---

## Overview

This guide explains how to identify and fix Firebase assets with missing required fields. The fix system uses intelligent inference to fill in missing data based on context, collection names, and existing asset fields.

---

## Quick Start

### 1. Dry Run (Recommended First Step)

Analyze assets and see what fixes would be applied WITHOUT making changes:

```bash
node scripts/fix-firebase-assets.js --dry-run
```

This will:
- Download all Firebase assets
- Analyze for missing fields
- Generate fix recommendations
- Create detailed reports
- **NOT modify Firebase**

### 2. Review the Reports

After the dry run, check these files in `firebase-fixes/`:

- **`FIX_REPORT.md`** - Human-readable summary of all fixes
- **`FIX_SUMMARY.json`** - Statistical breakdown
- **`MASTER_FIXES.json`** - Complete list of all fixes to be applied
- **`fixes/{collection}-fixes.json`** - Fixes per collection

### 3. Apply Fixes (Live Mode)

Once you've reviewed and are satisfied:

```bash
node scripts/fix-firebase-assets.js
```

This will apply all fixes to Firebase.

### 4. Validate Fixes

Confirm that fixes were applied correctly:

```bash
node scripts/validate-fixes.js
```

This checks that all fields were properly updated.

---

## Field Inference Logic

The fix script uses intelligent inference to determine missing field values:

### 1. **Type Field**

**Inference Method:** Collection name mapping

```javascript
Collection Name → Inferred Type
-----------------------------
deities         → deity
heroes          → hero
creatures       → creature
cosmology       → cosmology
rituals         → ritual
texts           → text
places          → location
concepts        → concept
```

**Confidence:** High (collection names are reliable)

**Example:**
- Asset in `deities` collection without `type` → gets `type: "deity"`

---

### 2. **EntityType Field**

**Inference Method:**
1. Copy from `type` field if it exists
2. Otherwise, infer from collection name (same as type)

**Confidence:** High

**Example:**
- Asset has `type: "deity"` but no `entityType` → gets `entityType: "deity"`

---

### 3. **Name Field**

**Inference Method (in order of preference):**

1. **From `displayName`** (High confidence)
   - Extracts name, removes leading emoji
   - Example: `"⚡ Zeus"` → `"Zeus"`

2. **From `title`** (Medium confidence)
   - Takes last part after dash
   - Example: `"Greek - Zeus"` → `"Zeus"`

3. **From `id`** (Low confidence)
   - Converts to title case
   - Example: `"sky-father"` → `"Sky Father"`

**Example:**
```javascript
// Asset with id "zeus" and displayName "⚡ Zeus" but no name
{
  "id": "zeus",
  "displayName": "⚡ Zeus",
  "name": null  // Missing!
}

// After fix:
{
  "id": "zeus",
  "displayName": "⚡ Zeus",
  "name": "Zeus"  // Inferred from displayName
}
```

---

### 4. **Mythology Field**

**Inference Method (in order):**

1. **From collection name** (High confidence)
   - Collections: `christian`, `islamic`, `yoruba`, `tarot`
   - Example: Asset in `christian` collection → `mythology: "christian"`

2. **From related entities** (High confidence)
   - Extracts mythology from `relatedEntities[].link` paths
   - Example: Link contains `/mythos/greek/` → `mythology: "greek"`

3. **From title prefix** (High confidence)
   - Pattern: `"{Mythology} - {Name}"`
   - Example: `"Greek - Zeus"` → `mythology: "greek"`

4. **Default to "global"** (Low confidence)
   - For cross-cultural content

**Example:**
```javascript
// Asset with related entities but no mythology
{
  "relatedEntities": [
    {"link": "../../greek/deities/zeus.html"}
  ],
  "mythology": null
}

// After fix:
{
  "mythology": "greek"  // Extracted from link
}
```

---

### 5. **Description Field**

**Inference Method (in order):**

1. **From `summary`** (High confidence)
   - If summary > 50 chars

2. **From `listDisplay.expandedContent`** (High confidence)
   - Common in migrated assets

3. **From `panelDisplay.sections[type=text]`** (Medium confidence)
   - Text content from panel sections

4. **Generated from name + type** (Low confidence)
   - Pattern: `"{Name} is a {Type} in {Mythology} mythology."`
   - Example: `"Zeus is a deity in Greek mythology."`

**Minimum Length:** 50 characters (won't replace if existing description is shorter)

---

### 6. **Summary Field**

**Inference Method:**

1. **From `description`** (High confidence)
   - If < 300 chars, copy directly
   - If > 300 chars, truncate at sentence boundary

2. **From `listDisplay.secondary`** (Medium confidence)
   - Remove trailing ellipsis

**Maximum Length:** 300 characters

---

### 7. **Metadata Fields**

Always added if missing:

```javascript
{
  "metadata": {
    "status": "published",      // Default for existing content
    "visibility": "public",      // Default for existing content
    "created": Timestamp.now(),  // If no _created field exists
    "updated": Timestamp.now()   // Current timestamp
  }
}
```

**Confidence:** High (these are safe defaults)

---

## Fix Confidence Levels

Each fix is assigned a confidence level:

- **High** - Very likely to be correct (e.g., type from collection name)
- **Medium** - Probably correct but verify (e.g., name from title)
- **Low** - Best guess, may need manual review (e.g., generated descriptions)

---

## Priority System

Fixes are prioritized based on:

1. **Field Importance** (10 points each)
   - Required fields: `type`, `name`, `mythology`

2. **Confidence Level**
   - High: +5 points
   - Medium: +3 points
   - Low: +1 point

3. **Asset Importance** (up to 10 points)
   - If `asset.importance > 70`

Higher priority fixes are applied first.

---

## Collection-Specific Fixes

### Cross-References Collection

**Issue:** Minimal data (just `id` and `relatedContent`)

**Fixes Applied:**
- `type: "cross-reference"` (from collection)
- `name`: Generated from ID
- `mythology: "global"` (default)
- `description`: Minimal generated description

**Example:**
```javascript
// Before
{
  "id": "zeus",
  "relatedContent": ["hera", "athena"]
}

// After
{
  "id": "zeus",
  "type": "cross-reference",
  "name": "Zeus",
  "mythology": "global",
  "description": "Zeus is a cross-reference in global mythology.",
  "relatedContent": ["hera", "athena"],
  "metadata": {
    "status": "published",
    "visibility": "public"
  }
}
```

---

## Command-Line Options

### Dry Run Mode

```bash
node scripts/fix-firebase-assets.js --dry-run
```

Analyzes and reports without making changes.

### Specific Collection

```bash
node scripts/fix-firebase-assets.js --collection=deities
```

Only process a single collection.

### Combined

```bash
node scripts/fix-firebase-assets.js --dry-run --collection=cross_references
```

Analyze only cross_references without making changes.

---

## Output Files

### Main Directory: `firebase-fixes/`

```
firebase-fixes/
├── MASTER_FIXES.json       # All fixes to be applied
├── FIX_SUMMARY.json        # Statistical summary
├── FIX_REPORT.md           # Human-readable report
├── VALIDATION_REPORT.md    # Post-application validation
├── fixes/                  # Per-collection fixes
│   ├── deities-fixes.json
│   ├── cross_references-fixes.json
│   └── ...
└── logs/                   # Change logs (when applied)
    └── change-log-{timestamp}.json
```

---

## Fix Report Format

The `FIX_REPORT.md` includes:

1. **Summary**
   - Total assets processed
   - Assets needing fixes
   - Fix confidence breakdown

2. **Fixes by Collection**
   - Table showing which collections need most work

3. **Top 20 Priority Fixes**
   - Highest priority assets to fix first

4. **Most Common Field Fixes**
   - Which fields are most often missing

---

## Safety Features

### 1. Conservative Approach

- **Never overwrites existing valid data**
- Only fills in `null`, `undefined`, or empty values
- Preserves all original fields

### 2. Dry Run Default

- Recommends always running `--dry-run` first
- Review reports before applying

### 3. Change Logging

- Every fix is logged with:
  - Field name
  - Old value
  - New value
  - Reason for change
  - Confidence level

### 4. Validation

- Post-fix validation script confirms changes
- Reports any discrepancies

### 5. Batch Limits

- Respects Firestore 500 operation batch limit
- Commits in smaller batches to avoid timeouts

---

## Example Workflow

### Step 1: Dry Run

```bash
node scripts/fix-firebase-assets.js --dry-run
```

Output:
```
Processing 29 collection(s)...

Analyzing collection: cross_references
  Found 421 documents
  Saved 421 asset fixes to firebase-fixes/fixes/cross_references-fixes.json

...

FIX SUMMARY
================================================================================
Total Assets: 1234
Assets Needing Fixes: 890
Total Fixes: 2345

By Confidence:
  High: 1800
  Medium: 400
  Low: 145

Most Common Fixes:
  type: 421
  name: 380
  description: 350
  ...
```

### Step 2: Review Report

Open `firebase-fixes/FIX_REPORT.md` and review:

- Which collections need most fixes
- What fields are being inferred
- Confidence levels for each fix

### Step 3: Check Specific Fixes

For critical collections, review individual fixes:

```bash
# View fixes for deities collection
cat firebase-fixes/fixes/deities-fixes.json | less
```

Each fix shows:
```json
{
  "id": "zeus",
  "collection": "deities",
  "fixCount": 3,
  "fixes": [
    {
      "field": "entityType",
      "oldValue": "unknown",
      "newValue": "deity",
      "reason": "Inferred from collection name: deities",
      "confidence": "high"
    },
    ...
  ],
  "priority": 48
}
```

### Step 4: Apply Fixes

```bash
node scripts/fix-firebase-assets.js
```

Output:
```
APPLYING FIXES TO FIREBASE
================================================================================
Applying 890 fixes to Firebase...
  Committed batch of 500 updates
  Committed final batch of 390 updates

Change log saved: firebase-fixes/logs/change-log-1735315200000.json
```

### Step 5: Validate

```bash
node scripts/validate-fixes.js
```

Output:
```
VALIDATION SUMMARY
================================================================================
Total: 890
Passed: 888 (99%)
Failed: 2
Errors: 0
Modified: 15

WARNING: Some fixes failed or had errors. Review the report.
```

Review `firebase-fixes/VALIDATION_REPORT.md` for any issues.

---

## Troubleshooting

### Issue: "Firebase service account not found"

**Solution:** Ensure `firebase-service-account.json` exists in project root.

### Issue: "Permission denied" errors

**Solution:** Check that service account has Firestore read/write permissions.

### Issue: "Batch commit failed"

**Solution:**
- Check Firebase quotas
- Try processing one collection at a time:
  ```bash
  node scripts/fix-firebase-assets.js --collection=deities
  ```

### Issue: Fixes not applying

**Solution:**
1. Run validation script to identify what failed
2. Check individual collection files in `firebase-fixes/fixes/`
3. Review Firebase console for any field conflicts

### Issue: Too many low-confidence fixes

**Solution:**
- Review low-confidence fixes in the report
- Manually fix high-priority assets first
- Re-run with those assets excluded

---

## Best Practices

### 1. Always Dry Run First

```bash
# First time
node scripts/fix-firebase-assets.js --dry-run

# Review reports

# Then apply
node scripts/fix-firebase-assets.js
```

### 2. Start with One Collection

Test on a small collection first:

```bash
node scripts/fix-firebase-assets.js --dry-run --collection=symbols
# Review
node scripts/fix-firebase-assets.js --collection=symbols
# Validate
node scripts/validate-fixes.js
```

### 3. Focus on High-Confidence Fixes

Review the confidence distribution in the report. If you have many low-confidence fixes, consider:
- Manually fixing high-priority assets
- Improving inference logic for specific cases
- Running fixes in stages

### 4. Keep Logs

Change logs are saved in `firebase-fixes/logs/`. Keep these for:
- Audit trail
- Rollback reference
- Understanding what changed

### 5. Validate After Applying

Always run validation:

```bash
node scripts/validate-fixes.js
```

This ensures all fixes applied correctly.

---

## Customization

### Adding New Inference Rules

Edit `scripts/fix-firebase-assets.js`:

```javascript
// Add to inference functions section
function inferNewField(collectionName, asset) {
  // Your logic here

  if (inferredValue) {
    return {
      field: 'newField',
      oldValue: asset.newField || null,
      newValue: inferredValue,
      reason: 'Your reason',
      confidence: 'high' // or 'medium' or 'low'
    };
  }

  return null;
}

// Add to analyzeAsset function
const newFieldFix = inferNewField(collectionName, asset);
if (newFieldFix) fixes.push(newFieldFix);
```

### Adjusting Priority Weights

Modify `calculateFixPriority` function:

```javascript
function calculateFixPriority(fixes, asset) {
  let priority = 0;

  fixes.forEach(fix => {
    // Adjust weights here
    if (['type', 'name', 'mythology'].includes(fix.field)) {
      priority += 20; // Increase from 10
    }
    // ... rest of logic
  });

  return priority;
}
```

---

## Schema Compliance

This fix script ensures compliance with the Unified Firebase Schema defined in `FIREBASE_UNIFIED_SCHEMA.md`.

### Core Required Fields

Per the schema, ALL entities must have:

- `id` - Unique identifier
- `type` / `entityType` - Entity type
- `name` - Display name
- `mythology` - Primary mythology

### Recommended Fields

For quality and discoverability:

- `description` - Full description (500-2000 chars)
- `summary` - Short description (150-300 chars)
- `icon` - Emoji or symbol
- `searchTerms` - Array of search keywords

### Metadata Fields

For proper content management:

- `metadata.status` - Published, draft, archived
- `metadata.visibility` - Public, members, admin
- `metadata.created` - Creation timestamp
- `metadata.updated` - Last update timestamp

---

## Support

For questions or issues:

1. Check this guide first
2. Review the validation reports
3. Check the change logs
4. Consult `FIREBASE_UNIFIED_SCHEMA.md` for field definitions

---

**Last Updated:** 2025-12-27
