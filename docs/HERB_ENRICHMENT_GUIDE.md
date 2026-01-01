# Sacred Herb Entity Enrichment Guide

## Quick Start

This guide walks through enriching herb entities in the Eyes of Azrael encyclopedia with comprehensive metadata for magical properties, preparations, associations, harvesting info, safety warnings, and substitutes.

## Overview of Enrichment Process

```
Local Herb Files → Validation → Enrichment Script → Firebase Update
   (JSON)           (Errors)       (Add Metadata)       (Firestore)
```

## Step 1: Validation

Before running the enrichment script, validate your local herb data:

```bash
# Validate all herbs
node scripts/validate-herb-metadata.js

# Validate a specific herb
node scripts/validate-herb-metadata.js buddhist_lotus
```

**Output includes:**
- Completeness percentage
- Missing required fields
- Validation warnings
- Metadata quality assessment

## Step 2: Enrichment

The enrichment script adds standardized metadata to herb records:

```bash
# Set Firebase credentials
export FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json

# Run enrichment
node scripts/enrich-herbs-metadata.js
```

**What it does:**
1. Reads local herb JSON files
2. Merges enrichment data with existing records
3. Updates Firebase Firestore
4. Tracks enrichment metadata
5. Reports completion statistics

**Expected output:**
```
Starting herb metadata enrichment...

Found 45 herb records locally

✓ Enriched: buddhist_lotus
✓ Enriched: buddhist_sandalwood
⊘ No enrichment data for: unknown-herb
...

========================================
Enrichment Complete
========================================
Enriched: 30
Skipped: 15
Total: 45
```

## Step 3: Verify

After enrichment, verify data in Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to Firestore → Collection: `herbs`
3. Check a few documents for new metadata fields:
   - `properties.magical`, `properties.medicinal`, `properties.spiritual`
   - `preparations.primary`, `preparations.dosage`
   - `associations.deities`, `associations.concepts`
   - `harvesting.season`, `harvesting.method`
   - `dangers.toxicity`, `dangers.warnings`
   - `substitutes` array
   - `botanicalInfo` object
   - `metadata.enrichedWithMetadata = true`

## Metadata Fields Reference

### 1. Properties

Categorizes herb characteristics:

```json
"properties": {
  "magical": [
    "purity",
    "spiritual awakening",
    "enlightenment"
  ],
  "medicinal": [
    "adaptogenic",
    "sedative",
    "nutritive"
  ],
  "spiritual": [
    "Buddha's seat",
    "chakra awakening"
  ]
}
```

**Guidelines:**
- Use lowercase, simple descriptors
- 3-7 items per category
- Focus on traditional uses and beliefs
- Include both external and internal properties

### 2. Preparations

Method and dosage instructions:

```json
"preparations": {
  "primary": [
    "Lotus seed tea: simmer dried seeds for 10 minutes",
    "Fresh root: slice and cook for nutrition"
  ],
  "alternative": [
    "Powder mixed with honey",
    "Offered fresh at altars"
  ],
  "dosage": "6-15g dried seeds, 3-10g dried leaf"
}
```

**Guidelines:**
- Primary: 2-5 main methods
- Alternative: 1-3 variations
- Dosage: Specific amounts with units
- Include both traditional and modern methods

### 3. Associations

Links to other entities and concepts:

```json
"associations": {
  "deities": [
    "gautama_buddha",
    "avalokiteshvara",
    "tara"
  ],
  "concepts": [
    "enlightenment",
    "purity",
    "compassion"
  ],
  "elements": [
    "water",
    "earth"
  ],
  "chakras": [
    "heart",
    "crown"
  ]
}
```

**Guidelines:**
- Deities: Use exact IDs from database
- Concepts: Simple, universal terms
- Elements: Classical elements (fire, water, earth, air, space)
- Chakras: Standard chakra names (root, sacral, solar plexus, heart, throat, third eye, crown)

### 4. Harvesting

Ethical and practical collection:

```json
"harvesting": {
  "season": "Summer (July-September for flowers and seeds)",
  "method": "Hand-harvest fully opened flowers and mature seed pods",
  "conditions": "Shallow ponds, marshes, 6-18 inches water depth, full sun"
}
```

**Guidelines:**
- Season: Month range or descriptive timing
- Method: Include ethical considerations
- Conditions: Growing/habitat requirements
- Always include sustainability notes

### 5. Dangers

Critical safety information:

```json
"dangers": {
  "toxicity": "Non-toxic",
  "warnings": [
    "Ensure clean water source if wild-harvesting",
    "Avoid medicinal doses during pregnancy"
  ],
  "contraindications": [
    "Generally safe as food and tea"
  ]
}
```

**Toxicity levels:**
- Non-toxic / Generally safe
- Low toxicity
- Moderate toxicity (use caution)
- High toxicity (avoid without expert supervision)

**Guidelines:**
- Always specify toxicity level
- List all known contraindications
- Include pregnancy/nursing warnings
- Mention drug interactions if known

### 6. Substitutes

Alternative herbs with reasoning:

```json
"substitutes": [
  {
    "name": "Water Lily",
    "reason": "Similar aquatic flower, some shared properties",
    "tradition": "multiple"
  },
  {
    "name": "Lotus Seed",
    "reason": "Different part, concentrated properties",
    "tradition": "buddhist"
  }
]
```

**Guidelines:**
- 1-3 substitutes per herb
- Clear, practical reasoning
- Include tradition context
- Focus on functional equivalents

### 7. Botanical Information

Scientific and taxonomic data:

```json
"botanicalInfo": {
  "scientificName": "Nelumbo nucifera",
  "family": "Nelumbonaceae",
  "nativeRegion": "Asia (India to Japan, Australia)",
  "commonNames": [
    "Sacred Lotus",
    "Indian Lotus",
    "Padma",
    "Kamala"
  ]
}
```

**Guidelines:**
- Scientific name: Proper Latin binomial
- Family: Standard botanical family
- Native region: Specific geographic origin
- Common names: 2-4 alternative names in English and original language

## Adding New Herb Enrichment Data

To add enrichment data for new herbs:

### 1. Edit the enrichment script

Open `scripts/enrich-herbs-metadata.js` and add to `HERB_ENRICHMENT_DATA`:

```javascript
new_herb_id: {
  properties: {
    magical: ['property1', 'property2'],
    medicinal: ['benefit1', 'benefit2'],
    spiritual: ['aspect1', 'aspect2']
  },
  preparations: {
    primary: ['Method 1: description', 'Method 2: description'],
    alternative: ['Alt method 1'],
    dosage: 'Specific amount and frequency'
  },
  associations: {
    deities: ['deity_id1', 'deity_id2'],
    concepts: ['concept1', 'concept2'],
    elements: ['element'],
    chakras: ['chakra']
  },
  harvesting: {
    season: 'When to harvest',
    method: 'How to harvest',
    conditions: 'Growing conditions'
  },
  dangers: {
    toxicity: 'Toxicity level',
    warnings: ['Warning 1', 'Warning 2'],
    contraindications: ['Contraindication 1']
  },
  substitutes: [
    { name: 'Alt herb', reason: 'Why', tradition: 'tradition' }
  ],
  botanicalInfo: {
    scientificName: 'Latin name',
    family: 'Family name',
    nativeRegion: 'Geographic region',
    commonNames: ['Name 1', 'Name 2']
  }
}
```

### 2. Validate the new data

```bash
node scripts/validate-herb-metadata.js new_herb_id
```

### 3. Run enrichment

```bash
node scripts/enrich-herbs-metadata.js
```

## Examples by Tradition

### Buddhist Herbs

- **Lotus** (enlightenment path, purity from suffering)
- **Sandalwood** (meditation, temple incense)
- **Bodhi** (Buddha's awakening, wisdom)

### Hindu Herbs

- **Tulsi** (Vishnu worship, daily puja)
- **Soma** (immortality, Vedic ritual)
- **Lotus** (Lakshmi, Brahma birth)

### Islamic Herbs

- **Black Seed** (Sunnah practice, healing)
- **Myrrh** (prayer, purification)

### Greek Herbs

- **Laurel** (Apollo, victory, prophecy)
- **Myrtle** (Aphrodite, love)
- **Olive** (Athena, wisdom)

### Norse Herbs

- **Mugwort** (protection, journeying)
- **Elder** (gateway herb, purification)
- **Yarrow** (divination, healing)

## Content Quality Checklist

Before submission, verify:

- [ ] All 7 metadata sections completed
- [ ] No empty arrays in required fields
- [ ] Properties categorized (magical/medicinal/spiritual)
- [ ] Preparations include dosage information
- [ ] Associated deities use correct IDs
- [ ] Harvesting section includes seasonal timing
- [ ] Dangers/toxicity clearly stated
- [ ] Substitutes include reasoning
- [ ] Scientific names accurate and sourced
- [ ] No typos or formatting errors

## Firebase Update Options

### Option 1: Automatic Script (Recommended)

```bash
node scripts/enrich-herbs-metadata.js
```

- Automatic validation
- Batch updates
- Progress reporting
- Error handling

### Option 2: Manual Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Go to Firestore → herbs collection
3. Select document
4. Click Edit
5. Add fields manually

### Option 3: Custom Script

```javascript
const db = admin.firestore();
const enrichedData = {
  properties: {...},
  preparations: {...},
  // ... all metadata
  metadata: {
    enrichedWithMetadata: true,
    enrichmentDate: new Date().toISOString()
  }
};
await db.collection('herbs').doc(herbId).set(enrichedData, { merge: true });
```

## Troubleshooting

### Firebase Connection Error

```
Error: Service account file not found
```

**Solution:**
```bash
export FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccountKey.json
node scripts/enrich-herbs-metadata.js
```

### No enrichment data for herb

```
⊘ No enrichment data for: unknown_herb
```

**Solution:** Add enrichment data to `HERB_ENRICHMENT_DATA` in the script.

### Validation failures

```bash
node scripts/validate-herb-metadata.js problematic_herb
```

Check output for missing fields and formatting issues.

### Incompleteness

If completeness score is low:
- Add missing metadata fields
- Populate all arrays (no empty arrays)
- Include dosage information
- Add safety warnings

## Advanced: Custom Enrichment

Create herb-specific enrichment for traditions:

```javascript
// buddhist_enrichment.js
const BUDDHIST_HERBS = {
  lotus: { /* complete metadata */ },
  sandalwood: { /* complete metadata */ },
  bodhi: { /* complete metadata */ }
};

// islamic_enrichment.js
const ISLAMIC_HERBS = {
  black_seed: { /* complete metadata */ },
  myrrh: { /* complete metadata */ }
};
```

Then merge into main enrichment file.

## Updating Existing Data

To update a single herb after enrichment:

```javascript
await db.collection('herbs').doc('herb_id').update({
  'properties.magical': ['new', 'values'],
  'harvesting.season': 'Updated season',
  'metadata.updatedAt': new Date().toISOString()
});
```

## Validation Reports

Generate validation reports:

```bash
# All herbs validation
node scripts/validate-herb-metadata.js > herb_validation_report.txt

# Find all incomplete herbs
node scripts/validate-herb-metadata.js | grep -A 2 "Completeness: [0-5][0-9]%"

# Find all with errors
node scripts/validate-herb-metadata.js | grep -B 1 "✗"
```

## Next Steps

1. ✓ Run validation on all herbs
2. ✓ Enrich herbs with new metadata
3. ✓ Verify in Firebase Console
4. ✓ Test in application views
5. ✓ Document any custom enrichment
6. ✓ Monitor validation metrics

## Resources

- **Enrichment Script**: `scripts/enrich-herbs-metadata.js`
- **Validation Script**: `scripts/validate-herb-metadata.js`
- **Metadata Schema**: `docs/HERB_METADATA_SCHEMA.md`
- **Project Guide**: `CLAUDE.md`

## Support

For questions or issues:
1. Check this guide
2. Review the validation report
3. Consult HERB_METADATA_SCHEMA.md
4. Check Firebase console for actual data

---

**Last Updated**: 2026-01-01
**Schema Version**: 2.0
**Status**: Ready for Production
