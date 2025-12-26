# Firebase Validation - Quick Reference Card

## Commands

```bash
# VALIDATION
npm run validate-firebase                      # Validate all assets

# AUTO-ENHANCEMENT
npm run enhance-firebase:dry-run               # Preview changes
npm run enhance-firebase                       # Apply enhancements

# SINGLE COLLECTION
node scripts/auto-enhance-firebase-assets.js --collection=deities
node scripts/auto-enhance-firebase-assets.js --collection=deities --dry-run
```

## Output Files

| File | Contains |
|------|----------|
| `firebase-validation-report.json` | Complete validation data (JSON) |
| `FIREBASE_VALIDATION_REPORT.md` | Human-readable summary (Markdown) |
| `firebase-incomplete-backlog.json` | Prioritized fix list (JSON) |
| `firebase-assets-validated-complete/` | All assets by collection |
| `auto-enhancement-log.json` | Enhancement history |

## Quality Levels

| Level | Completeness | Meaning |
|-------|-------------|---------|
| **High** | 80-100% | Well-structured, most fields present |
| **Medium** | 50-79% | Usable but missing important fields |
| **Low** | 0-49% | Significant gaps, needs attention |

## Field Weights

| Weight | Fields | Priority |
|--------|--------|----------|
| **10** | id, type, name | Critical |
| **8** | description | Very Important |
| **5** | summary, content, mythology | Important |
| **4** | tags, keywords, relatedIds | Useful |
| **3** | icon, importance, references | Nice to Have |
| **1-2** | Others | Optional |

## Auto-Generated Fields

| Field | Generated From |
|-------|---------------|
| `search.searchableText` | All text: name + description + content + tags + keywords |
| `search.keywords` | Name (all words) + Description (4+ letters) + type + mythology |
| `rendering.modes` | Default: all enabled |
| `rendering.defaultMode` | Default: "panelCard" |
| `rendering.defaultAction` | Default: "page" |
| `metadata.importance` | Default by type (mythology: 90, deity: 80, hero: 70...) |
| `metadata.status` | Default: "active" |
| `metadata.visibility` | Default: "public" |

## Priority Calculation

```
Priority = importance + (incompleteness × 0.5) + (missing weights × 2) + featured bonus

Higher priority = Fix first
```

## Typical Workflow

```bash
# 1. Initial assessment
npm run validate-firebase

# 2. Auto-enhance
npm run enhance-firebase:dry-run
npm run enhance-firebase

# 3. Verify improvements
npm run validate-firebase

# 4. Manual fixes (use backlog)
# Edit in Firebase Console or via script

# 5. Track progress
npm run validate-firebase
```

## Collections Validated

- `deities` - Gods and goddesses
- `mythologies` - Mythological traditions
- `items` - Magical items
- `places` - Sacred locations
- `creatures` - Mythical beings
- `heroes` - Legendary heroes
- `rituals` - Sacred practices
- `texts` - Sacred writings
- `cosmology` - Worldviews
- `herbs` - Sacred plants
- `concepts` - Abstract ideas
- `beings` - Other entities
- `angels` - Angelic beings
- **+ Any other collections found**

## Report Sections

### JSON Report
- `timestamp` - When report was generated
- `totalCollections` - Number of collections
- `totalAssets` - Total assets validated
- `collections` - Per-collection details
- `summary` - Overall statistics
- `allValidations` - Every asset validation
- `incompleteAssets` - Assets needing work

### Markdown Report
1. Executive Summary
2. Collection Statistics Table
3. Top 20 Incomplete Assets
4. Most Common Missing Fields
5. Recommended Actions

### Backlog File
Array of incomplete assets sorted by priority:
```json
[
  {
    "id": "zeus",
    "collection": "deities",
    "completeness": 48,
    "priority": 245,
    "missingFieldCount": 28,
    "topMissingFields": ["search.keywords", "relationships.relatedIds", ...]
  }
]
```

## Template Sections

1. **Core Identity** - id, type, name, title, subtitle
2. **Display** - icon, image, thumbnail, color
3. **Content** - description, summary, content
4. **Metadata** - category, tags, order, importance, status, dates, author
5. **Relationships** - mythology, parentId, childIds, relatedIds, references, collections
6. **Search** - keywords, aliases, facets, searchableText
7. **Rendering** - modes, defaultMode, defaultAction

## Common Tasks

### Find assets missing specific field
```bash
npm run validate-firebase
grep "search.keywords" FIREBASE_VALIDATION_REPORT.md
```

### Enhance single collection
```bash
node scripts/auto-enhance-firebase-assets.js --collection=deities --dry-run
node scripts/auto-enhance-firebase-assets.js --collection=deities
```

### Track progress over time
```bash
# Week 1
npm run validate-firebase
cp firebase-validation-report.json week1.json

# Week 2
npm run validate-firebase
cp firebase-validation-report.json week2.json

# Compare
node -e "
const w1 = require('./week1.json');
const w2 = require('./week2.json');
console.log('Week 1:', w1.summary.averageCompleteness + '%');
console.log('Week 2:', w2.summary.averageCompleteness + '%');
"
```

### Export top incomplete to CSV
```javascript
const backlog = require('./firebase-incomplete-backlog.json');
const csv = backlog.slice(0, 50)
  .map(a => `${a.collection},${a.id},${a.completeness}%,${a.priority}`)
  .join('\n');
require('fs').writeFileSync('top50.csv',
  'Collection,ID,Completeness,Priority\n' + csv
);
```

## Success Metrics

Track these weekly:
- Overall completeness (target: 80%+)
- High quality count (increase)
- Low quality count (decrease)
- Average per collection (all > 70%)
- Top 20 backlog (different assets)
- Common gaps (fewer occurrences)

## Documentation

- `FIREBASE_VALIDATION_GUIDE.md` - Detailed usage guide
- `FIREBASE_ASSET_QUALITY_SYSTEM.md` - Complete system docs
- `VALIDATION_EXAMPLE_OUTPUT.md` - Example outputs
- `FIREBASE_VALIDATION_ARCHITECTURE.md` - System architecture
- `UNIFIED_ASSET_TEMPLATE.md` - Template definition

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script hangs | Check Firebase connection, try single collection |
| Permission errors | Verify service account, check Firestore rules |
| Unexpected enhancements | Run --dry-run first, review log |
| Wrong completeness | Check field weights in validation script |

## Integration

All three systems use the same template:

1. **Validation** validates against it
2. **Enhancement** populates its fields
3. **User Submission** creates assets matching it

Source of truth: `UNIFIED_ASSET_TEMPLATE.md`

## Key Files

| File | Purpose |
|------|---------|
| `scripts/validate-all-firebase-assets.js` | Validation script |
| `scripts/auto-enhance-firebase-assets.js` | Enhancement script |
| `js/components/entity-form.js` | User submission form |
| `UNIFIED_ASSET_TEMPLATE.md` | Template definition |
| `firebase-service-account.json` | Firebase credentials |

## Tips

- ✓ Always run validation before and after changes
- ✓ Use --dry-run before applying enhancements
- ✓ Fix high-priority assets first (use backlog)
- ✓ Auto-enhance before manual enhancement
- ✓ Track metrics weekly
- ✓ Set quality goals
- ✓ Celebrate progress

## Next Steps

1. Run `npm run validate-firebase`
2. Review `FIREBASE_VALIDATION_REPORT.md`
3. Run `npm run enhance-firebase:dry-run`
4. Apply with `npm run enhance-firebase`
5. Re-validate to confirm improvements
6. Use backlog for manual fixes
7. Re-validate weekly

---

**Quick Start:** `npm run validate-firebase`
