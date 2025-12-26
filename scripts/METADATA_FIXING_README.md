# Metadata Fixing Scripts

Automated scripts to fix common metadata issues found in Firebase assets.

## Overview

These scripts address all 795 files with metadata warnings:
- **200 entities** with `mythology: "unknown"`
- **Missing display metadata** (icon, subtitle, searchTerms, sortName)
- **Missing metrics** (importance, popularity)
- **Incorrect version** (need `_version: "2.0"`)

## Scripts

### 1. fix-unknown-mythology.js

**Purpose:** Automatically infer and fix entities with `mythology: "unknown"`

**How it works:**
- Extracts mythology from file path structure
- Analyzes entity names, IDs, and descriptions
- Uses pattern matching against known mythologies
- Updates mythology field and related display components

**Usage:**
```bash
node scripts/fix-unknown-mythology.js
```

**Output:**
- Updated JSON files in `firebase-assets-validated/`
- Backup created before modifications
- Report saved to `scripts/fix-unknown-mythology-report.json`

**Example fixes:**
- File path: `firebase-assets-validated/deities/egyptian/ra.json` → `mythology: "egyptian"`
- Entity name: "Zeus" → `mythology: "greek"`
- Description: "Norse god of thunder" → `mythology: "norse"`

---

### 2. add-missing-metadata.js

**Purpose:** Add missing metadata fields to all entities

**Fields added:**
- **icon**: Appropriate emoji based on entity type and mythology
- **subtitle**: Extracted from description or generated
- **searchTerms**: Comprehensive terms from name, description, domains
- **sortName**: Clean alphabetical sorting name
- **importance**: Calculated score (0-100) based on content richness
- **popularity**: Default or calculated score (0-100)
- **_version**: Set to "2.0"

**Usage:**
```bash
node scripts/add-missing-metadata.js
```

**Icon Logic:**
- Deity + Egyptian → `𓂀`
- Deity + Greek → `⚡`
- Deity + Norse → `⚔️`
- Hero + Greek → `🏺`
- Creature + Greek → `🦁`
- etc.

**Importance Calculation:**
- Base score: 50
- +20 for rich description (>1000 chars)
- +10 for extensive family relationships
- +10 for many primary sources
- +5 for multiple domains/attributes
- Max: 100

**Output:**
- Enhanced JSON files with added metadata
- Backup created before modifications
- Report saved to `scripts/add-missing-metadata-report.json`

---

### 3. validate-and-upload-fixed.js

**Purpose:** Validate fixed entities and optionally upload to Firebase

**Validation checks:**
- Required fields: id, name, mythology, type, _version
- Display fields: icon, subtitle, searchTerms, sortName
- Metrics: importance, popularity
- No "unknown" values in critical fields
- Version is "2.0"
- Valid data types and structure

**Usage:**

**Dry run (validation only):**
```bash
node scripts/validate-and-upload-fixed.js
```

**Validate and upload:**
```bash
node scripts/validate-and-upload-fixed.js --upload
```

**Custom collection:**
```bash
node scripts/validate-and-upload-fixed.js --upload --collection=deities
```

**Requirements for upload:**
- Firebase Admin SDK installed: `npm install firebase-admin`
- Service account key at `FIREBASE/firebase-service-account.json`
- Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

**Output:**
- Validation report with errors and warnings
- Upload status for each entity
- Report saved to `scripts/validation-upload-report.json`

---

### 4. fix-all-metadata-issues.js (MASTER)

**Purpose:** Run all scripts in sequence with one command

**Execution flow:**
1. Fix unknown mythology
2. Add missing metadata
3. Validate (and optionally upload)
4. Generate summary report

**Usage:**

**Validation only:**
```bash
node scripts/fix-all-metadata-issues.js
```

**With Firebase upload:**
```bash
node scripts/fix-all-metadata-issues.js --upload
```

**Skip validation:**
```bash
node scripts/fix-all-metadata-issues.js --skip-validation
```

**Output:**
- All individual script reports
- Master summary report: `scripts/metadata-fixing-summary.json`
- Console output showing overall results and recommendations

---

## Quick Start

### Run Everything (Recommended)

1. **Validation only** (safe, no upload):
   ```bash
   node scripts/fix-all-metadata-issues.js
   ```

2. **Review the reports** in `scripts/` directory

3. **If satisfied, run with upload**:
   ```bash
   node scripts/fix-all-metadata-issues.js --upload
   ```

### Run Individual Scripts

If you need more control:

```bash
# Step 1: Fix mythology
node scripts/fix-unknown-mythology.js

# Step 2: Add metadata
node scripts/add-missing-metadata.js

# Step 3: Validate
node scripts/validate-and-upload-fixed.js

# Step 4: Upload (after validation passes)
node scripts/validate-and-upload-fixed.js --upload
```

## Safety Features

All scripts include:
- ✅ **Automatic backups** before any modifications
- ✅ **Detailed logging** of all changes
- ✅ **Comprehensive reports** in JSON format
- ✅ **Error handling** with graceful failures
- ✅ **Progress indicators** for long operations
- ✅ **Dry-run mode** for validation script

## Reports Generated

### fix-unknown-mythology-report.json
```json
{
  "timestamp": "2025-12-25T...",
  "duration": "5.23s",
  "statistics": {
    "totalFiles": 796,
    "unknownFound": 200,
    "successfullyFixed": 195,
    "failed": 5
  },
  "summary": {
    "fixedByMythology": {
      "egyptian": 45,
      "greek": 38,
      "norse": 27,
      ...
    }
  }
}
```

### add-missing-metadata-report.json
```json
{
  "timestamp": "2025-12-25T...",
  "duration": "8.15s",
  "statistics": {
    "totalFiles": 796,
    "enhanced": 795,
    "failed": 1
  },
  "summary": {
    "fieldsAdded": {
      "icon": 423,
      "subtitle": 156,
      "searchTerms": 234,
      "sortName": 89,
      "importance": 145,
      "popularity": 67,
      "version": 795
    }
  }
}
```

### validation-upload-report.json
```json
{
  "timestamp": "2025-12-25T...",
  "duration": "12.45s",
  "statistics": {
    "totalFiles": 796,
    "validated": 790,
    "invalid": 6,
    "uploaded": 790,
    "uploadFailed": 0,
    "successRate": "99.25%"
  },
  "validationErrors": {
    "Mythology is still \"unknown\"": 5,
    "Missing required field: importance": 1
  }
}
```

### metadata-fixing-summary.json
```json
{
  "timestamp": "2025-12-25T...",
  "overallResults": {
    "totalFiles": 796,
    "mythologyFixed": 195,
    "metadataEnhanced": 795,
    "validEntities": 790,
    "invalidEntities": 6,
    "uploadedToFirebase": 790
  },
  "recommendations": [
    "6 entities still have validation errors. Review the validation report for details.",
    "5 entities could not have their mythology inferred. Manual review needed."
  ]
}
```

## Troubleshooting

### "Directory not found: firebase-assets-validated"

Make sure you're running from the project root and the directory exists:
```bash
cd H:/Github/EyesOfAzrael
ls firebase-assets-validated
```

### Firebase initialization failed

Ensure you have:
1. Firebase Admin SDK installed: `npm install firebase-admin`
2. Service account key at `FIREBASE/firebase-service-account.json`
3. Or environment variable: `set GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json`

### Script fails partway through

- Backups are created automatically before modifications
- Check the individual script reports for details
- You can safely re-run scripts; they're idempotent

### High validation failure rate

1. Run `fix-unknown-mythology.js` first
2. Then run `add-missing-metadata.js`
3. Finally validate with `validate-and-upload-fixed.js`
4. Or just use the master script: `fix-all-metadata-issues.js`

## File Locations

- **Source**: `firebase-assets-validated/` (all JSON files)
- **Scripts**: `scripts/fix-*.js`, `scripts/add-*.js`, `scripts/validate-*.js`
- **Reports**: `scripts/*-report.json`
- **Backups**: `firebase-assets-validated-backup-*/`

## Best Practices

1. **Always start with dry run**: Run without `--upload` first
2. **Review reports**: Check reports before proceeding to upload
3. **Keep backups**: Don't delete automatic backups until verified
4. **Test small batch**: Test on a few files first if unsure
5. **Monitor Firebase quota**: Large uploads may hit rate limits

## Advanced Usage

### Custom mythology patterns

Edit `fix-unknown-mythology.js` to add new mythology patterns:
```javascript
const mythologyPatterns = {
  yourMythology: ['pattern1', 'pattern2', 'deity-name'],
  // ...
};
```

### Custom icon mappings

Edit `add-missing-metadata.js` to customize icons:
```javascript
const iconMappings = {
  deity: {
    yourMythology: '🎭',
    // ...
  }
};
```

### Custom importance calculation

Modify `calculateImportance()` in `add-missing-metadata.js` to adjust scoring logic.

## Support

For issues or questions:
1. Check the detailed reports in `scripts/` directory
2. Review backup files to see what changed
3. Check individual script logs for error messages
4. Re-run scripts; they're designed to be idempotent

## License

Part of the Eyes of Azrael mythology database project.
