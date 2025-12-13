# Firestore Content Validation

## Overview

The `validate-firestore-content.js` script performs comprehensive validation to ensure all local HTML content exists in Firestore and is properly structured.

## Features

### 1. **Comprehensive Content Scanning**
- Scans all HTML files across all mythology directories
- Supports 13 content types: deities, heroes, creatures, cosmology, texts, herbs, rituals, symbols, concepts, myths, magic, angels, figures
- Extracts metadata from HTML files (title, description, mythology)
- Covers 19 mythologies: apocryphal, aztec, babylonian, buddhist, celtic, chinese, christian, egyptian, greek, hindu, islamic, japanese, jewish, mayan, norse, persian, roman, sumerian, tarot

### 2. **Firestore Querying**
- Retrieves all documents from all Firestore collections
- Analyzes content distribution by mythology and type
- Tracks all collections and document counts

### 3. **Diff Analysis**
- **Missing in Firestore**: Local files without corresponding Firestore documents
- **Extra in Firestore**: Firestore documents without local HTML files
- **Matching Content**: Files that exist in both locations
- **Metadata Mismatches**: Content where descriptions differ

### 4. **Quality Validation**
- Missing critical fields (mythology, contentType, name)
- Empty or short descriptions
- Missing search indexes
- Missing version numbers
- Quality score (0-100) for each document

### 5. **Comprehensive Report**
- Executive summary with pass/fail status
- Content distribution tables by mythology and type
- Complete lists of missing/extra content
- Metadata mismatch details
- Quality validation issues
- Prioritized action items

## Usage

### Prerequisites

```bash
npm install cheerio firebase-admin
```

### Run Validation

```bash
node scripts/validate-firestore-content.js
```

### Output

The script generates:
- **Console output**: Real-time progress and summary
- **Report file**: `FIRESTORE_VALIDATION_REPORT.md` at project root

### Exit Codes

- **0**: PASS - All local content exists in Firestore
- **1**: FAIL - Missing content or validation errors

## Report Structure

### Executive Summary
- Validation status (PASS/FAIL)
- Total counts (local vs Firestore)
- Completeness percentage
- Quality metrics
- Average quality score

### Content Distribution
- By mythology (table showing local vs Firestore counts)
- By content type (detailed comparison)

### Missing Content (Section 3)
Lists all local files NOT in Firestore, organized by:
- Mythology
- Content type
- File path and metadata

### Extra Content (Section 4)
Lists all Firestore documents NOT in local files, organized by:
- Mythology
- Content type
- Document ID and collection

### Metadata Mismatches (Section 5)
Details where local and Firestore metadata differ

### Quality Issues (Section 6)
- Missing mythology field
- Missing contentType field
- Empty/short descriptions
- Other validation failures

### Quality Scores (Section 7)
Documents scoring below 80/100 with specific issues listed

### Action Items (Section 8)
Prioritized list of fixes needed:
- 🔴 **HIGH PRIORITY**: Missing content, critical field errors
- 🟡 **MEDIUM PRIORITY**: Extra content, missing descriptions
- 🟢 **LOW PRIORITY**: Metadata sync issues

### Firestore Collections (Section 9)
Complete list of all Firestore collections found

## Example Output

```
🚀 Starting Firestore Content Validation...

============================================================

🔍 Scanning local content files...
  ✓ babylonian/deities/marduk.html - "Marduk"
  ✓ babylonian/heroes/gilgamesh.html - "Gilgamesh"
  ...

✅ Scanned 376 local content files

🔍 Querying Firestore content...
  Querying collection: deities
  Found 190 documents
  ...

✅ Retrieved 1328 Firestore documents

🔍 Comparing local and Firestore content...
✅ Comparison complete

📝 Generating validation report...
✅ Validation complete!

📄 Report saved to: H:\Github\EyesOfAzrael\FIRESTORE_VALIDATION_REPORT.md

📊 SUMMARY:

   Local Files:         376
   Firestore Documents: 1328
   Matching:            354
   Missing in Firestore: 22
   Extra in Firestore:   134
   Avg Quality Score:    58.88/100
   Completeness:         94.15%

   Status: ❌ FAIL
```

## Configuration

### Content Types

Edit the `CONTENT_TYPES` object in the script to add/modify content types:

```javascript
const CONTENT_TYPES = {
  deities: {
    directory: 'deities',
    firestoreCollection: 'deities',
    singularName: 'deity',
    pluralName: 'deities'
  },
  // ... more types
};
```

### Mythologies

Edit the `MYTHOLOGIES` array to add/modify mythologies:

```javascript
const MYTHOLOGIES = [
  'apocryphal', 'aztec', 'babylonian', // ... etc
];
```

## Troubleshooting

### "Missing dependency: cheerio"

Install cheerio:
```bash
npm install cheerio
```

### Firestore Authentication Error

Ensure the service account file exists:
```
H:\Github\EyesOfAzrael\FIREBASE\firebase-service-account.json
```

### "Could not parse HTML file"

Some HTML files may have malformed structure. The script will warn but continue processing.

### Empty Titles

If titles can't be extracted from HTML:
1. Check `<title>` tag
2. Check `<h1>` tag
3. Falls back to filename

## Quality Score Calculation

Each document starts at 100 points and loses points for:
- **-30**: Missing mythology field
- **-30**: Missing contentType field
- **-40**: Missing name/title field
- **-20**: Description missing or too short (< 20 chars)
- **-10**: Missing search index
- **-5**: Missing version number

### Quality Score Ranges
- **90-100**: Excellent - All fields present and complete
- **80-89**: Good - Minor issues
- **60-79**: Fair - Several missing fields
- **< 60**: Poor - Major quality issues

## Integration with CI/CD

Add to your workflow:

```yaml
- name: Validate Firestore Content
  run: node scripts/validate-firestore-content.js
  env:
    GOOGLE_APPLICATION_CREDENTIALS: ./FIREBASE/firebase-service-account.json
```

The script will fail (exit 1) if content is missing, allowing CI/CD to catch issues.

## Related Scripts

- `migrate-to-firebase-folder.js` - Prepares content for migration
- `analyze-firestore-structure.js` - Analyzes Firestore structure
- `migrate-to-firebase-assets.js` - Migrates assets to Firestore

## Metadata Extraction

The script extracts metadata from HTML files:

### Title Extraction Priority
1. `<title>` tag content (with mythology prefix removed)
2. First `<h1>` tag content
3. Filename (formatted from kebab-case)

### Description Extraction
1. `<meta name="description">` content
2. First `<p>` in `<main>` (truncated to 200 chars)

### Icon Extraction
1. `.deity-icon` element text
2. Emoji at start of `<h1>` tag

## Best Practices

1. **Run Before Deployment**: Validate content before pushing to production
2. **Fix High Priority Items First**: Address missing content immediately
3. **Regular Validation**: Run weekly to catch drift
4. **Document Changes**: Update this README when modifying content types
5. **Review Extra Content**: Decide if extra Firestore docs should have local files

## Version History

- **v1.0.0** (2025-12-13): Initial release
  - Full content scanning
  - Firestore comparison
  - Quality validation
  - Comprehensive reporting

## Support

For issues or questions:
1. Check the generated report first
2. Review this README
3. Check script comments for implementation details
4. Verify service account permissions
