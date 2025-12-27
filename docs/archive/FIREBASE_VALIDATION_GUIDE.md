# Firebase Asset Validation Guide

## Overview

The Firebase Asset Validation Script is a comprehensive tool that downloads ALL assets from Firebase, validates them against the unified template, and generates detailed reports for fixing incomplete assets.

## Quick Start

```bash
# Run the validation
npm run validate-firebase

# Or directly with node
node scripts/validate-all-firebase-assets.js
```

## What It Does

### 1. Downloads All Collections

The script automatically discovers and downloads ALL Firebase collections:
- `deities`
- `mythologies`
- `items`
- `places`
- `creatures`
- `heroes`
- `rituals`
- `texts`
- `cosmology`
- `herbs`
- `concepts`
- `beings`
- `angels`
- Any other collections found

### 2. Validates Against Unified Template

Each asset is validated against the template defined in `UNIFIED_ASSET_TEMPLATE.md`:

**Core Identity** (required)
- id, type, name
- title, subtitle

**Display**
- icon, image, thumbnail, color

**Content**
- description, summary, content

**Metadata**
- category, tags, order, importance
- status, created, updated, author

**Relationships**
- mythology, parentId, childIds
- relatedIds, references, collections

**Search**
- keywords, aliases, facets
- searchableText

**Rendering**
- modes, defaultMode, defaultAction

### 3. Generates Reports

**Three output files:**

1. `firebase-validation-report.json` - Complete validation data
2. `FIREBASE_VALIDATION_REPORT.md` - Human-readable summary
3. `firebase-incomplete-backlog.json` - Prioritized fix list

**Plus directory:**
- `firebase-assets-validated-complete/` - All assets organized by collection

## Understanding the Reports

### JSON Report (`firebase-validation-report.json`)

Complete validation data including:
```json
{
  "timestamp": "2025-12-26T...",
  "totalCollections": 15,
  "totalAssets": 847,
  "validatedAssets": 847,
  "collections": {
    "deities": {
      "count": 500,
      "averageCompleteness": 73,
      "incompleteAssets": [...]
    }
  },
  "summary": {
    "averageCompleteness": 68,
    "highQuality": 234,
    "mediumQuality": 412,
    "lowQuality": 201
  }
}
```

### Markdown Report (`FIREBASE_VALIDATION_REPORT.md`)

Human-readable report with:
- Executive summary
- Collection statistics table
- Top 20 incomplete assets (by priority)
- Most common missing fields
- Recommended fix priority

### Backlog File (`firebase-incomplete-backlog.json`)

Prioritized list of assets to fix:
```json
[
  {
    "id": "zeus",
    "collection": "deities",
    "completeness": 45,
    "priority": 187,
    "missingFieldCount": 23,
    "topMissingFields": [
      "search.keywords",
      "relationships.relatedIds",
      "metadata.tags"
    ]
  }
]
```

## Priority Calculation

Assets are prioritized for fixing based on:

1. **Importance** - The `metadata.importance` field (0-100)
2. **Incompleteness** - How many fields are missing
3. **Missing High-Weight Fields** - Critical fields like description, relationships
4. **Featured Status** - Featured items get +20 priority boost

Higher priority score = Fix first

## Output Directory Structure

```
firebase-assets-validated-complete/
├── deities/
│   ├── _collection.json         # Full collection
│   ├── zeus.json                 # Individual asset
│   ├── hera.json
│   └── ...
├── mythologies/
│   ├── _collection.json
│   ├── greek.json
│   └── ...
├── items/
├── places/
└── ...
```

## Quality Levels

The script categorizes assets into three quality levels:

| Level | Completeness | Description |
|-------|-------------|-------------|
| **High** | ≥ 80% | Well-structured, most fields present |
| **Medium** | 50-79% | Usable but missing important fields |
| **Low** | < 50% | Significant gaps, needs attention |

## Field Weights

Fields are weighted by importance:

| Weight | Fields | Meaning |
|--------|--------|---------|
| 10 | id, type, name | Critical - required for basic functionality |
| 8 | description | Very important - primary content |
| 5 | summary, content, mythology | Important - core information |
| 4 | tags, keywords, relatedIds | Important - for search/filtering |
| 3 | icon, importance, references | Useful - enhances experience |
| 1-2 | Other fields | Nice to have |

## Workflow

### 1. Run Validation

```bash
npm run validate-firebase
```

### 2. Review Reports

Read `FIREBASE_VALIDATION_REPORT.md` to understand:
- Overall completeness
- Which collections need attention
- Most common missing fields

### 3. Prioritize Fixes

Use `firebase-incomplete-backlog.json` to:
- Identify highest priority assets
- See what fields are missing
- Plan systematic improvements

### 4. Fix Assets

Options for fixing:
- **Manual:** Edit directly in Firebase Console
- **Script:** Create bulk update scripts
- **User Submission:** Use the submission system

### 5. Re-validate

Run validation again to measure progress:
```bash
npm run validate-firebase
```

## Common Missing Fields

Based on typical validation results:

1. **search.keywords** - Add relevant search terms
2. **relationships.relatedIds** - Link to related assets
3. **metadata.tags** - Add categorization tags
4. **search.facets** - Add filterable attributes
5. **rendering.modes** - Configure display modes
6. **metadata.importance** - Set priority ranking
7. **search.searchableText** - Combine all text for search
8. **relationships.collections** - Assign to collections

## Best Practices

### For High-Priority Assets (Top 20)

1. Add all missing core fields immediately
2. Ensure description, summary, and content are present
3. Link to related assets (relatedIds)
4. Add comprehensive tags and keywords

### For Medium-Priority Assets

1. Focus on search and filtering fields
2. Add metadata for proper organization
3. Link to parent mythology and related items

### For Low-Priority Assets

1. Enhance when time permits
2. Add optional rendering configuration
3. Polish content and relationships

## Integration with User Submission System

The validation script uses the SAME template as the user submission system (`js/components/entity-form.js`), ensuring consistency between:

- Validation requirements
- User submission fields
- Rendering expectations

## Automation Ideas

### Bulk Field Population

Create scripts to automatically add:
- `searchableText` (combine name + description + content)
- `keywords` (extract from content)
- `mythology` (infer from collection path)
- Default `rendering.modes` configuration

### Progressive Enhancement

1. Run validation weekly
2. Track completeness trends
3. Set team goals (e.g., "80% overall by end of month")
4. Celebrate improvements

## Troubleshooting

### "Firebase Admin SDK not initialized"

Make sure `firebase-service-account.json` exists in project root.

### "Collection not found"

The script auto-discovers collections. If a collection is missing, it may be empty or have access restrictions.

### "Out of memory"

If you have thousands of assets, increase Node.js memory:
```bash
node --max-old-space-size=4096 scripts/validate-all-firebase-assets.js
```

### "Validation taking too long"

The script processes collections sequentially. For very large databases, consider:
- Running during off-peak hours
- Validating specific collections only (modify script)

## Next Steps

After validation:

1. **Review** - Read the markdown report
2. **Prioritize** - Use the backlog JSON to plan fixes
3. **Fix** - Update assets systematically
4. **Re-validate** - Measure progress
5. **Automate** - Create scripts to populate common fields

## Support

For issues or questions:
- Check `UNIFIED_ASSET_TEMPLATE.md` for template details
- Review `js/components/entity-form.js` for field definitions
- Examine individual assets in `firebase-assets-validated-complete/`

---

**Last Updated:** 2025-12-26
**Script Version:** 1.0.0
