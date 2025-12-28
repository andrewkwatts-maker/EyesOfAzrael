# Collection Metadata Enhancement - User Guide

## Quick Start

Run all collection enhancements at once:

```bash
node scripts/enhance-all-collections.js
```

This will:
1. Process all 8 collections
2. Generate individual reports
3. Create comprehensive summary
4. Display results in terminal

---

## Individual Collection Scripts

### Items
```bash
node scripts/enhance-items-metadata.js
```

**What it does:**
- Extracts powers, wielders, origin, material
- Categorizes items (weapon, armor, relic, etc.)
- Adds cultural significance and primary sources
- Generates summaries from descriptions

**Recommended metadata fields:**
- `powers` - Array of item abilities
- `wielders` - Who has used the item
- `origin` - Creation/discovery story
- `material` - What it's made from
- `item_category` - Classification
- `cultural_significance` - Importance in culture
- `primary_sources` - Ancient texts
- `summary` - Brief overview

---

### Creatures
```bash
node scripts/enhance-creatures-metadata.js
```

**What it does:**
- Extracts abilities, habitat, weaknesses
- Generates appearance descriptions
- Categorizes creatures (dragon, beast, hybrid, etc.)
- Adds cultural context

**Recommended metadata fields:**
- `abilities` - Powers and skills
- `habitat` - Where it lives
- `weaknesses` - Vulnerabilities
- `appearance` - Physical description
- `creature_category` - Type classification
- `cultural_significance` - Role in mythology
- `primary_sources` - Ancient texts
- `summary` - Brief overview

---

### Heroes
```bash
node scripts/enhance-heroes-metadata.js
```

**What it does:**
- Extracts achievements, deeds, quests
- Identifies associated deities
- Lists weapons and equipment
- Documents heroic journeys

**Recommended metadata fields:**
- `achievements` - Heroic accomplishments
- `associated_deities` - Connected gods
- `weapons` - Items used
- `quests` - Major journeys
- `cultural_significance` - Hero's importance
- `primary_sources` - Ancient texts
- `summary` - Brief overview

---

### Places
```bash
node scripts/enhance-places-metadata.js
```

**What it does:**
- Extracts significance and location
- Identifies associated deities
- Documents major events
- Adds geographic/cosmological context

**Recommended metadata fields:**
- `significance` - Importance in mythology
- `location` - Geographic/cosmological position
- `associated_deities` - Connected gods
- `events` - Major occurrences
- `cultural_significance` - Sacred importance
- `primary_sources` - Ancient texts
- `summary` - Brief overview

---

### Herbs
```bash
node scripts/enhance-herbs-metadata.js
```

**What it does:**
- Extracts medicinal uses
- Documents preparation methods
- Identifies deity associations
- Lists effects (physical/spiritual)

**Recommended metadata fields:**
- `uses` - Medicinal and ritual applications
- `preparation` - How to prepare
- `associated_deities` - Connected gods
- `effects` - Physical and spiritual effects
- `cultural_significance` - Sacred importance
- `primary_sources` - Medical texts
- `summary` - Brief overview

---

### Rituals
```bash
node scripts/enhance-rituals-metadata.js
```

**What it does:**
- Extracts ritual purpose
- Documents procedural steps
- Identifies participants
- Notes timing and frequency

**Recommended metadata fields:**
- `purpose` - Intent of ritual
- `steps` - Procedural instructions
- `participants` - Who performs it
- `timing` - When performed
- `cultural_significance` - Religious importance
- `primary_sources` - Ritual texts
- `summary` - Brief overview

---

### Texts
```bash
node scripts/enhance-texts-metadata.js
```

**What it does:**
- Extracts author information
- Determines historical dating
- Generates content summaries
- Assesses textual significance

**Recommended metadata fields:**
- `author` - Who wrote it
- `date` - When written
- `content_summary` - What it contains
- `significance` - Importance in tradition
- `cultural_significance` - Cultural impact
- `primary_sources` - Self-referential
- `summary` - Brief overview

---

### Symbols
```bash
node scripts/enhance-symbols-metadata.js
```

**What it does:**
- Extracts symbolic meaning
- Documents usage contexts
- Identifies variations
- Adds cultural background

**Recommended metadata fields:**
- `meaning` - What it represents
- `usage` - How and where used
- `variations` - Different forms
- `cultural_context` - Cultural background
- `cultural_significance` - Sacred importance
- `primary_sources` - Iconographic sources
- `summary` - Brief overview

---

## How Enhancement Works

### 1. Pattern Extraction
Scripts use regex patterns to extract metadata from descriptions:

```javascript
// Example: Extract powers from item descriptions
/grants? (?:the )?([^.,]+)/gi
/provides? (?:the )?([^.,]+)/gi
```

### 2. Intelligent Generation
When extraction fails, scripts generate intelligent defaults:

```javascript
// Example: Generate cultural significance
const mythology = item.mythology || 'ancient';
const name = item.displayName || item.name;
return `${name} is a legendary artifact from ${mythology} mythology.`;
```

### 3. Completeness Scoring
Each item is scored on 8 fields:
- 7-8 fields = Complete
- 4-6 fields = Partial
- 0-3 fields = Minimal

### 4. Tracking
All enhancements are tracked:

```javascript
metadata: {
  enhanced_metadata: true,
  enhancement_date: "2025-12-28T...",
  enhancement_agent: "item_metadata_enhancer_v1",
  fields_added: ["powers", "material", "summary"]
}
```

---

## Output Files

### Individual Collection Reports
Located in `firebase-assets-enhanced/[collection]/enhancement-report.json`

Example structure:
```json
{
  "timestamp": "2025-12-28T...",
  "statistics": {
    "total": 45,
    "enhanced": 280,
    "fieldsAdded": {
      "powers": 14,
      "material": 196,
      ...
    }
  },
  "summary": {
    "enhancement_rate": "622.2%",
    "completeness_improvement": {...}
  }
}
```

### Master Reports
- `COLLECTION_METADATA_ENHANCED.md` - Full report
- `COLLECTION_METADATA_ENHANCEMENT_SUMMARY.md` - Executive summary
- `COLLECTION_COMPLETENESS_COMPARISON.md` - Visual before/after

---

## Customization

### Adding New Fields

Edit the enhancement script for your collection:

```javascript
// In enhance-items-metadata.js

function extractNewField(item) {
  // Add your extraction logic
  const text = stripHtml(item.description);
  const pattern = /your pattern here/gi;
  // ... extraction code
  return extractedValue;
}

function enhanceItem(item) {
  // ... existing code

  // Add new field
  const newField = extractNewField(enhanced);
  if (newField && !enhanced.newField) {
    enhanced.newField = newField;
    added.push('newField');
    stats.fieldsAdded.newField++;
  }

  // ... rest of code
}
```

### Adjusting Patterns

Modify regex patterns in the extraction functions:

```javascript
// More specific pattern
/(?:wielded|used|owned) by ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g

// Broader pattern
/(?:associated|connected|linked) (?:with|to) ([^.,]+)/gi
```

### Changing Completeness Threshold

Adjust the field count for "complete" status:

```javascript
// Currently: 7-8 fields = complete
if (score >= 7) stats.after.complete++;

// Change to: 6-8 fields = complete
if (score >= 6) stats.after.complete++;
```

---

## Troubleshooting

### JSON Syntax Errors

If you see errors like:
```
✗ Error processing laurel.json: Expected ',' or ']' after array element
```

**Fix:**
1. Open the file in a JSON validator
2. Locate the syntax error (usually missing comma or bracket)
3. Fix and save
4. Re-run the enhancement script

### No Files Found

If you see:
```
Found 0 files
```

**Check:**
1. Directory exists: `firebase-assets-enhanced/[collection]`
2. JSON files are present (not just subdirectories)
3. File permissions allow reading

### Low Enhancement Rate

If completeness doesn't improve:

**Reasons:**
1. Descriptions too short for pattern matching
2. Non-standard description format
3. Fields already present

**Solutions:**
1. Add more detailed descriptions to source HTML
2. Adjust extraction patterns
3. Lower completeness threshold

---

## Best Practices

### 1. Run Incrementally
Test on one collection first:
```bash
node scripts/enhance-items-metadata.js
```

### 2. Review Results
Check the enhancement report before proceeding:
```bash
cat firebase-assets-enhanced/items/enhancement-report.json
```

### 3. Backup First
Save original files before running:
```bash
cp -r firebase-assets-enhanced firebase-assets-backup
```

### 4. Validate After
Run JSON validation on enhanced files:
```bash
find firebase-assets-enhanced -name "*.json" -exec jsonlint {} \;
```

### 5. Test UI Rendering
Upload a few enhanced items to Firebase and test UI:
```bash
# Upload items to test database
node scripts/test-enhanced-items-upload.js
```

---

## Migration Workflow

### Step 1: Enhance Locally
```bash
node scripts/enhance-all-collections.js
```

### Step 2: Review Reports
```bash
cat COLLECTION_METADATA_ENHANCED.md
cat COLLECTION_COMPLETENESS_COMPARISON.md
```

### Step 3: Fix Errors
```bash
# Fix JSON syntax errors in herbs
vi firebase-assets-enhanced/herbs/laurel.json
# ... fix other files
```

### Step 4: Re-run Failed Collections
```bash
node scripts/enhance-herbs-metadata.js
```

### Step 5: Upload to Firebase
```bash
# Upload all enhanced collections
node scripts/upload-enhanced-collections.js
```

### Step 6: Validate
- Test UI rendering
- Verify search functionality
- Check completeness metrics

---

## Performance

- **Items (45 files):** ~0.2 seconds
- **Creatures (12 files):** ~0.05 seconds
- **All Collections (93 files):** ~0.7 seconds

**Memory Usage:** <100MB
**CPU Usage:** Single-threaded, low impact

---

## Maintenance

### Regular Updates
Run enhancement scripts monthly to process new items:
```bash
# Add to cron
0 0 1 * * cd /path/to/project && node scripts/enhance-all-collections.js
```

### Monitoring
Track completeness over time:
```bash
# Extract completeness percentage
node -e "console.log(require('./firebase-assets-enhanced/items/enhancement-report.json').summary.enhancement_rate)"
```

### Quality Assurance
Review auto-extracted fields quarterly:
```bash
# List all items with auto-generated summaries
grep -r "enhancement_agent" firebase-assets-enhanced/
```

---

## Support

For questions or issues:
1. Check this guide
2. Review the enhancement reports
3. Examine the script source code
4. Test on a single file for debugging

---

**Last Updated:** 2025-12-28
**Version:** 1.0
**Maintainer:** Eyes of Azrael Development Team
