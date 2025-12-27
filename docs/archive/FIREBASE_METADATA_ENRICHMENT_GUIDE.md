# Firebase Metadata Enrichment Guide

## Overview

This system enriches all Firebase assets with standardized metadata fields for improved searchability, display, and analytics.

## Metadata Fields Added

### 1. Timestamps
- **createdAt**: Creation timestamp (auto-set if missing)
- **updatedAt**: Last update timestamp (auto-updated)
- **Format**: Firestore Timestamp

### 2. Importance Score (0-100)
Calculated based on:
- Base score by entity type (deity=70, hero=65, creature=60, etc.)
- Content richness (description length: +5 to +10)
- Rich content panels (up to +15)
- Relationships count (up to +5)
- Media presence (images +5, icon +2)
- Attributes count (up to +10)
- Sources presence (+5)
- Tags count (up to +5)

**Scale**:
- 90-100: Exceptional (major deities, key concepts)
- 70-89: High importance (primary entities)
- 50-69: Medium importance (supporting entities)
- 30-49: Low importance (minor entities)
- 0-29: Minimal (stub entries)

### 3. Tags Array
Automatically extracted from:
- Entity type and content type
- Mythology and pantheon
- Section and role
- Alignment
- Domains (for deities)
- Abilities (for creatures)
- Symbols and titles
- Existing tags and search keywords

**Limit**: Top 25 most relevant tags

### 4. Search Text
Normalized full-text search field containing:
- Name, title, subtitle
- Description and summary
- Mythology, section, pantheon, role
- All attribute values (flattened)
- Rich content panel text

**Normalization**:
- Lowercase
- Special characters removed
- Single spaces only
- Trimmed

### 5. Display Order
String used for alphabetical sorting:
- Based on title or name
- Leading articles removed ("the", "a", "an")
- Lowercase

### 6. Featured Boolean
Marks top 10% of entities by importance:
- Calculated per collection
- Minimum 1 featured per collection
- Used for highlighting in UI

### 7. Completeness Score (0-100)
Calculated based on field population:

**Required fields (60 points)**:
- name/title
- type/contentType
- mythology
- section
- description/summary

**Optional fields (40 points)**:
- subtitle
- icon
- imageUrl
- richContent
- attributes
- tags
- relatedContent
- sources
- pantheon
- role

**Bonus (up to 5 points)**:
- 5+ rich content panels: +5
- 3-4 rich content panels: +3

## Scripts

### 1. Main Enrichment Script
**File**: `scripts/enrich-firebase-metadata.js`

**Usage**:
```bash
# Dry run (preview changes)
node scripts/enrich-firebase-metadata.js --dry-run

# Dry run single collection
node scripts/enrich-firebase-metadata.js --dry-run --collection=deities

# Live update (all collections)
node scripts/enrich-firebase-metadata.js

# Live update (single collection)
node scripts/enrich-firebase-metadata.js --collection=deities
```

**Features**:
- Downloads all assets from Firebase
- Calculates all metadata fields
- Determines featured entities (top 10%)
- Updates Firebase in batches
- Generates detailed report

**Output**:
- Console statistics per collection
- JSON report: `FIREBASE_METADATA_ENRICHMENT_REPORT.json`

### 2. Batch Update Script
**File**: `scripts/batch-update-firebase-metadata.js`

**Usage**:
```bash
# Dry run from report
node scripts/batch-update-firebase-metadata.js FIREBASE_METADATA_ENRICHMENT_REPORT.json --dry-run

# Live update from report
node scripts/batch-update-firebase-metadata.js FIREBASE_METADATA_ENRICHMENT_REPORT.json
```

**Features**:
- Reads enrichment report
- Applies updates in batches of 500
- Progress tracking
- Error handling

### 3. Download Script (Reference)
**File**: `scripts/download-all-firebase-assets.js`

Download all assets for local analysis:
```bash
node scripts/download-all-firebase-assets.js
```

## Workflow

### Initial Enrichment
```bash
# 1. Dry run to preview
node scripts/enrich-firebase-metadata.js --dry-run

# 2. Review report
cat FIREBASE_METADATA_ENRICHMENT_REPORT.json

# 3. Run for real
node scripts/enrich-firebase-metadata.js

# 4. Verify results
node scripts/validate-firebase-metadata.js
```

### Update Single Collection
```bash
# Target specific collection
node scripts/enrich-firebase-metadata.js --collection=deities
```

### Re-enrichment
```bash
# Re-run to update importance/completeness after content changes
node scripts/enrich-firebase-metadata.js
```

## Report Format

The enrichment report (`FIREBASE_METADATA_ENRICHMENT_REPORT.json`) contains:

```json
{
  "timestamp": "2025-12-27T...",
  "dryRun": false,
  "summary": {
    "duration": "45.23",
    "totalAssets": 1234,
    "totalFeatured": 124,
    "avgImportance": 67,
    "avgCompleteness": 78
  },
  "collections": [
    {
      "collection": "deities",
      "total": 150,
      "featured": 15,
      "avgImportance": 75,
      "avgCompleteness": 82,
      "assets": [
        {
          "id": "default_greek_deity_zeus",
          "title": "Zeus",
          "importance": 95,
          "completeness": 98,
          "featured": true,
          "tags": 18
        }
      ]
    }
  ]
}
```

## Validation

### Check Metadata Coverage
```javascript
// Get all assets missing metadata
const snapshot = await db.collection('deities').get();
const missing = [];

snapshot.forEach(doc => {
  const data = doc.data();
  if (!data.importance || !data.completeness_score) {
    missing.push(doc.id);
  }
});

console.log(`Missing metadata: ${missing.length}`);
```

### Verify Featured Distribution
```javascript
// Check featured percentage per collection
const featured = await db.collection('deities')
  .where('featured', '==', true)
  .get();

console.log(`Featured: ${featured.size} / ${snapshot.size}`);
```

## Best Practices

### 1. Run Dry Run First
Always preview changes before applying:
```bash
node scripts/enrich-firebase-metadata.js --dry-run
```

### 2. Test on Single Collection
Validate logic on one collection:
```bash
node scripts/enrich-firebase-metadata.js --collection=deities
```

### 3. Regular Re-enrichment
Re-run periodically as content changes:
- After bulk content updates
- After schema changes
- Monthly maintenance

### 4. Monitor Performance
Track enrichment metrics over time:
- Average importance score
- Average completeness score
- Featured distribution
- Tag density

### 5. Backup Before Bulk Updates
```bash
# Download all assets
node scripts/download-all-firebase-assets.js

# Archive
tar -czf firebase-backup-$(date +%Y%m%d).tar.gz firebase-assets-downloaded/
```

## Troubleshooting

### Issue: Batch Commits Failing
**Solution**: Reduce batch size or add retry logic
```javascript
const BATCH_SIZE = 250; // Reduce from 500
```

### Issue: Incorrect Importance Scores
**Solution**: Adjust calculation weights in `calculateImportance()`
```javascript
// Increase/decrease bonuses
if (textLength > 500) score += 15; // Was 10
```

### Issue: Too Many/Few Featured
**Solution**: Adjust percentage in enrichment logic
```javascript
const featuredCount = Math.ceil(sorted.length * 0.15); // Was 0.1 (10%)
```

### Issue: Tags Overwhelming Search
**Solution**: Reduce tag limit
```javascript
return Array.from(tags).slice(0, 15); // Was 25
```

## Advanced Usage

### Custom Importance Calculation
Modify `calculateImportance()` to include custom factors:

```javascript
// Add view count bonus
if (asset.views && asset.views > 1000) {
  score += 10;
}

// Add vote bonus
if (asset.votes && asset.votes > 50) {
  score += 5;
}
```

### Custom Tag Extraction
Extend `extractTags()` for domain-specific tags:

```javascript
// Extract from custom fields
if (asset.customFields?.specialty) {
  tags.add(asset.customFields.specialty.toLowerCase());
}
```

### Custom Search Text
Enhance `createSearchText()` with additional fields:

```javascript
// Add custom searchable fields
if (asset.alternateNames) {
  textParts.push(...asset.alternateNames);
}
```

## Integration with Frontend

### Query by Importance
```javascript
// Get high-importance entities
const query = db.collection('deities')
  .where('importance', '>=', 70)
  .orderBy('importance', 'desc')
  .limit(10);
```

### Query Featured Entities
```javascript
// Get featured for homepage
const query = db.collection('deities')
  .where('featured', '==', true)
  .orderBy('importance', 'desc');
```

### Full-Text Search
```javascript
// Search using search_text
const searchTerm = 'thunder god';
const query = db.collection('deities')
  .orderBy('search_text')
  .startAt(searchTerm.toLowerCase())
  .endAt(searchTerm.toLowerCase() + '\uf8ff');
```

### Sort by Completeness
```javascript
// Find incomplete entities for improvement
const query = db.collection('deities')
  .where('completeness_score', '<', 60)
  .orderBy('completeness_score', 'asc');
```

## Maintenance

### Monthly Tasks
1. Re-run enrichment: `node scripts/enrich-firebase-metadata.js`
2. Review report for trends
3. Update calculation logic if needed
4. Archive old reports

### Quarterly Tasks
1. Audit featured distribution
2. Review importance score distribution
3. Optimize tag extraction
4. Update completeness criteria

### Annual Tasks
1. Major schema review
2. Performance optimization
3. Historical trend analysis
4. Documentation updates

## Support

For issues or questions:
1. Check report for error messages
2. Review validation output
3. Check Firebase console for data
4. Review script logs

## Changelog

### 2025-12-27: Initial Release
- Created enrichment script
- Added batch update script
- Implemented all metadata fields
- Generated documentation
