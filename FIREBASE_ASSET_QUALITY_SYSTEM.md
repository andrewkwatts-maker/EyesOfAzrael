# Firebase Asset Quality System

Complete system for validating, enhancing, and maintaining Firebase asset quality.

## Overview

This system provides three integrated tools:

1. **Validation Script** - Audit all assets against the unified template
2. **Auto-Enhancement Script** - Automatically populate common missing fields
3. **User Submission System** - Allow users to contribute new assets

All three use the **EXACT SAME TEMPLATE** from `UNIFIED_ASSET_TEMPLATE.md`.

## Quick Start

```bash
# 1. Validate current assets
npm run validate-firebase

# 2. Review the report
# Open FIREBASE_VALIDATION_REPORT.md

# 3. Auto-enhance (dry run first)
npm run enhance-firebase:dry-run

# 4. Apply enhancements
npm run enhance-firebase

# 5. Re-validate to see improvements
npm run validate-firebase
```

## The Three Tools

### 1. Validation Script

**Purpose:** Audit ALL Firebase assets and identify gaps

**Command:**
```bash
npm run validate-firebase
```

**What it does:**
- Downloads ALL collections from Firebase
- Validates each asset against unified template
- Calculates completeness percentage (0-100%)
- Identifies missing fields with priority weighting
- Generates detailed reports

**Output:**
- `firebase-validation-report.json` - Complete data
- `FIREBASE_VALIDATION_REPORT.md` - Human-readable summary
- `firebase-incomplete-backlog.json` - Prioritized fix list
- `firebase-assets-validated-complete/` - All assets organized by collection

**When to use:**
- Weekly quality audits
- Before major releases
- After bulk updates
- To measure progress

### 2. Auto-Enhancement Script

**Purpose:** Automatically populate fields that can be inferred

**Commands:**
```bash
# Dry run (preview changes)
npm run enhance-firebase:dry-run

# Apply changes
npm run enhance-firebase

# Process single collection
node scripts/auto-enhance-firebase-assets.js --collection=deities

# Dry run single collection
node scripts/auto-enhance-firebase-assets.js --dry-run --collection=deities
```

**What it auto-generates:**

| Field | How it's generated |
|-------|-------------------|
| `search.searchableText` | Combines name, description, summary, content, tags, keywords |
| `search.keywords` | Extracts from name (all words) + description (4+ letter words) |
| `rendering.modes` | Default: all modes enabled (hyperlink, expandableRow, panelCard, subsection, fullPage) |
| `rendering.defaultMode` | Default: "panelCard" |
| `rendering.defaultAction` | Default: "page" |
| `metadata.importance` | Default based on type (mythology: 90, deity: 80, hero: 70, etc.) |
| `metadata.status` | Default: "active" |
| `metadata.visibility` | Default: "public" |

**When to use:**
- After validation shows many missing auto-generatable fields
- Before manual enhancement (do auto first, then manual)
- After bulk imports
- As regular maintenance

**Safety:**
- Always run with `--dry-run` first
- Reviews changes before applying
- Updates `metadata.updated` timestamp
- Creates enhancement log

### 3. User Submission System

**Purpose:** Allow users to contribute new assets via web form

**Location:** `theories/user-submissions/submit.html`

**Features:**
- Dynamic form based on unified template
- Collection-specific fields (deities, creatures, heroes, etc.)
- Client-side validation
- Firebase integration
- Success/error feedback

**Fields (from `js/components/entity-form.js`):**

**Base fields (all collections):**
- name, mythology, type, description, icon

**Collection-specific fields:**
- **Deities:** domains, symbols, family
- **Creatures:** habitat, abilities
- **Heroes:** quests, weapons
- **Items:** powers, owner
- **Herbs:** uses, preparation
- **Rituals:** purpose, steps, offerings

## Workflow

### Initial Setup

1. **Understand current state:**
   ```bash
   npm run validate-firebase
   ```

2. **Review the report:**
   - Check overall completeness percentage
   - Identify low-quality collections
   - Note most common missing fields

### Auto-Enhancement Phase

3. **Preview auto-enhancements:**
   ```bash
   npm run enhance-firebase:dry-run
   ```

4. **Review what will be added:**
   - Check console output
   - Verify fields make sense
   - Review `auto-enhancement-log.json`

5. **Apply auto-enhancements:**
   ```bash
   npm run enhance-firebase
   ```

6. **Verify improvements:**
   ```bash
   npm run validate-firebase
   ```

### Manual Enhancement Phase

7. **Prioritize manual fixes:**
   - Use `firebase-incomplete-backlog.json`
   - Focus on top 20 high-priority assets
   - Work through by collection

8. **Fix assets:**
   - Option A: Firebase Console (web UI)
   - Option B: Batch update script
   - Option C: User submission form

9. **Re-validate regularly:**
   ```bash
   npm run validate-firebase
   ```

10. **Track progress:**
    - Compare completeness over time
    - Monitor quality distribution
    - Celebrate improvements

## Understanding Quality Scores

### Completeness Calculation

Each field has a **weight** based on importance:

```javascript
// Example weights
{
  name: 10,          // Critical
  description: 8,    // Very important
  mythology: 5,      // Important
  tags: 4,           // Useful
  icon: 3,           // Nice to have
  color: 1           // Optional
}
```

**Completeness = (Actual Score / Max Possible Score) × 100%**

Example:
- Asset has: name (10), description (8), icon (3) = 21 points
- Max possible: 100 points
- Completeness: 21/100 = 21%

### Quality Levels

| Level | Range | Meaning | Action |
|-------|-------|---------|--------|
| **High** | 80-100% | Well-structured, most fields present | Polish optional fields |
| **Medium** | 50-79% | Usable but incomplete | Add important missing fields |
| **Low** | 0-49% | Significant gaps | Priority fix |

### Priority Score

Assets are prioritized for fixing based on:

```javascript
priority = importance                // Base: metadata.importance (0-100)
         + (incompleteness × 0.5)    // More incomplete = higher priority
         + (missing field weights × 2) // Missing important fields = higher priority
         + (featured ? 20 : 0)       // Featured items boosted
```

Higher priority = Fix first

## Field Reference

### Critical Fields (Weight 8-10)

**Must have for basic functionality:**
- `id` - Unique identifier
- `type` - Asset type (deity, hero, etc.)
- `name` - Display name
- `description` - Primary content

### Important Fields (Weight 4-7)

**Needed for good user experience:**
- `mythology` - Parent mythology
- `summary` - Medium-length description
- `content` - Full detailed content
- `tags` - Categorization
- `keywords` - Search terms
- `relatedIds` - Cross-references

### Useful Fields (Weight 2-3)

**Enhance experience:**
- `icon` - Visual identifier
- `image` - Main image
- `importance` - Priority ranking
- `references` - External links
- `facets` - Filtering attributes
- `searchableText` - Full-text search

### Optional Fields (Weight 1)

**Nice to have:**
- `color` - Theme color
- `subtitle` - Additional title
- `thumbnail` - Grid image
- `featured` - Highlight flag
- `order` - Display sequence

## Integration Points

### Template Source of Truth

`UNIFIED_ASSET_TEMPLATE.md` defines:
- All possible fields
- Field types and validation
- Rendering modes
- Relationship structure

### Form Definition

`js/components/entity-form.js` implements:
- User submission forms
- Collection-specific fields
- Client-side validation
- Firebase write operations

### Validation Schema

`scripts/validate-all-firebase-assets.js` uses:
- Field weights
- Required vs optional
- Type checking
- Completeness calculation

### All Three Must Match

When updating template:
1. Update `UNIFIED_ASSET_TEMPLATE.md`
2. Update validation schema in script
3. Update form fields in `entity-form.js`
4. Update auto-enhancement logic

## Common Tasks

### Find all assets missing a specific field

```bash
# Run validation
npm run validate-firebase

# Check the report
cat FIREBASE_VALIDATION_REPORT.md | grep "search.keywords"
```

Or use the JSON:
```javascript
// Load firebase-validation-report.json
const report = require('./firebase-validation-report.json');

// Find assets missing keywords
const missingKeywords = report.allValidations.filter(v =>
  v.missingFields.some(f => f.path === 'search.keywords')
);

console.log(`${missingKeywords.length} assets missing keywords`);
```

### Update a specific collection

```bash
# Validate just deities
npm run validate-firebase

# Auto-enhance just deities
node scripts/auto-enhance-firebase-assets.js --collection=deities

# Re-validate to confirm
npm run validate-firebase
```

### Track progress over time

```bash
# Week 1
npm run validate-firebase
cp firebase-validation-report.json reports/week1.json

# Week 2
npm run validate-firebase
cp firebase-validation-report.json reports/week2.json

# Compare
node -e "
const w1 = require('./reports/week1.json');
const w2 = require('./reports/week2.json');
console.log('Week 1:', w1.summary.averageCompleteness + '%');
console.log('Week 2:', w2.summary.averageCompleteness + '%');
console.log('Change:', (w2.summary.averageCompleteness - w1.summary.averageCompleteness) + '%');
"
```

### Export incomplete assets for review

```javascript
// Load backlog
const backlog = require('./firebase-incomplete-backlog.json');

// Export top 50 to CSV
const csv = backlog.slice(0, 50)
  .map(a => `${a.collection},${a.id},${a.completeness}%,${a.priority}`)
  .join('\n');

require('fs').writeFileSync('top50-incomplete.csv',
  'Collection,ID,Completeness,Priority\n' + csv
);
```

## Best Practices

### 1. Regular Validation

Run weekly:
```bash
npm run validate-firebase
```

### 2. Auto-Enhance First

Before manual work:
```bash
npm run enhance-firebase:dry-run
npm run enhance-firebase
```

### 3. Prioritize High-Impact

Focus on:
- Top 20 from backlog
- Assets below 50% completeness
- Featured items
- High-importance assets

### 4. Batch Similar Updates

Group fixes by:
- Collection type
- Missing field pattern
- Mythology family

### 5. Validate After Changes

Always verify:
```bash
npm run validate-firebase
```

### 6. Track Metrics

Monitor:
- Overall completeness trend
- Quality distribution (high/medium/low)
- Collection-specific scores
- Most common gaps

## Troubleshooting

### Validation script hangs

- Check Firebase connection
- Verify service account credentials
- Try with `--collection=` filter for one collection

### Auto-enhance makes unexpected changes

- Always run `--dry-run` first
- Review `auto-enhancement-log.json`
- Adjust generation logic if needed

### Completeness seems wrong

- Check field weights in validation script
- Verify template schema matches expectations
- Some fields worth more than others (by design)

### Firebase permissions errors

- Verify service account has read/write access
- Check Firestore rules
- Ensure project ID matches

## Advanced Usage

### Create custom validation rules

Modify `TEMPLATE_SCHEMA` in validation script:

```javascript
const TEMPLATE_SCHEMA = {
  coreIdentity: {
    // Add custom field
    customField: { required: true, type: 'string', weight: 5 }
  }
};
```

### Add custom auto-enhancements

Modify `determineEnhancements()` function:

```javascript
function determineEnhancements(asset) {
  const enhancements = {};

  // Your custom logic
  if (!asset.custom?.field) {
    enhancements.customField = generateCustomValue(asset);
  }

  return enhancements;
}
```

### Filter validation results

```javascript
const report = require('./firebase-validation-report.json');

// Only show deities below 60%
const lowQualityDeities = report.collections.deities.validations
  .filter(v => v.completeness < 60);

console.log(lowQualityDeities);
```

## Files Reference

| File | Purpose |
|------|---------|
| `UNIFIED_ASSET_TEMPLATE.md` | Template definition (source of truth) |
| `scripts/validate-all-firebase-assets.js` | Validation script |
| `scripts/auto-enhance-firebase-assets.js` | Auto-enhancement script |
| `js/components/entity-form.js` | User submission forms |
| `firebase-validation-report.json` | Validation output (JSON) |
| `FIREBASE_VALIDATION_REPORT.md` | Validation output (Markdown) |
| `firebase-incomplete-backlog.json` | Prioritized fix list |
| `firebase-assets-validated-complete/` | Downloaded assets |
| `auto-enhancement-log.json` | Enhancement history |
| `FIREBASE_VALIDATION_GUIDE.md` | Detailed usage guide |
| `VALIDATION_EXAMPLE_OUTPUT.md` | Example outputs |

## Support

For questions:
1. Read `FIREBASE_VALIDATION_GUIDE.md`
2. Check `VALIDATION_EXAMPLE_OUTPUT.md`
3. Review `UNIFIED_ASSET_TEMPLATE.md`
4. Examine validation reports

---

**Maintain high-quality assets through systematic validation and enhancement!**
