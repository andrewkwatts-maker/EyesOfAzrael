# Herb Entity Metadata Enrichment System

## Overview

This system provides comprehensive metadata enrichment for sacred herb entities in the Eyes of Azrael mythology encyclopedia. It standardizes herb data across 7 key dimensions: properties, preparations, associations, harvesting, dangers, substitutes, and botanical information.

## What This System Provides

### 1. **Standardized Metadata Schema** (`HERB_METADATA_SCHEMA.md`)
Complete documentation of the herb entity structure with:
- 7 required metadata sections
- Field specifications and types
- Validation requirements
- Real-world examples
- Implementation guidelines

### 2. **Enrichment Script** (`scripts/enrich-herbs-metadata.js`)
Automated script that:
- Reads local herb JSON files
- Merges enrichment data with existing records
- Updates Firebase Firestore
- Tracks enrichment metadata
- Reports completion statistics

Features:
- Batch processing
- Error handling
- Progress reporting
- Automatic metadata tracking

### 3. **Validation Script** (`scripts/validate-herb-metadata.js`)
Quality assurance tool that:
- Validates all 7 metadata sections
- Checks for required fields
- Calculates completeness percentage
- Reports errors and warnings
- Generates validation reports

Usage:
```bash
node scripts/validate-herb-metadata.js              # Validate all herbs
node scripts/validate-herb-metadata.js herb_id     # Validate one herb
```

### 4. **Implementation Guide** (`HERB_ENRICHMENT_GUIDE.md`)
Step-by-step instructions covering:
- Quick start (validation → enrichment → verification)
- Detailed field references
- Adding new herbs
- Content quality checklist
- Troubleshooting
- Firebase update options

### 5. **Quick Reference** (`HERB_METADATA_QUICK_REFERENCE.md`)
Developer cheat sheet with:
- Metadata structure at a glance
- Property types by tradition
- Element and chakra references
- Toxicity levels
- Deity ID formats
- Common mistakes and fixes
- Command reference

## The 7 Metadata Sections

### 1. Properties
Categorizes herb characteristics:
- **Magical**: Spiritual/mystical properties
- **Medicinal**: Health benefits
- **Spiritual**: Ritual/practice aspects

Example:
```json
"properties": {
  "magical": ["purity", "awakening", "enlightenment"],
  "medicinal": ["adaptogenic", "sedative", "nutritive"],
  "spiritual": ["meditation anchor", "chakra work"]
}
```

### 2. Preparations
Method and dosage instructions:
- **Primary**: Main preparation methods (with steps)
- **Alternative**: Variant methods
- **Dosage**: Recommended amounts and frequency

Example:
```json
"preparations": {
  "primary": [
    "Tea: steep 5-7 fresh leaves for 5-10 minutes",
    "Fresh leaves: chew directly or add to water"
  ],
  "alternative": ["Dried powder: 1/4-1/2 tsp with warm water"],
  "dosage": "5-7 fresh leaves daily or 1-2 cups tea"
}
```

### 3. Associations
Links to other entities and concepts:
- **Deities**: Associated gods/goddesses (using entity IDs)
- **Concepts**: Linked universal ideas
- **Elements**: Fire, water, earth, air, space
- **Chakras**: Energy centers (root through crown)

Example:
```json
"associations": {
  "deities": ["vishnu", "krishna", "lakshmi"],
  "concepts": ["devotion", "purity", "protection"],
  "elements": ["fire", "water"],
  "chakras": ["heart", "crown"]
}
```

### 4. Harvesting
Ethical and practical collection:
- **Season**: When to harvest
- **Method**: How to harvest
- **Conditions**: Growing/habitat requirements

Example:
```json
"harvesting": {
  "season": "Spring to Autumn (year-round in tropical climates)",
  "method": "Pinch leaves respectfully, leave main plant intact",
  "conditions": "Full sun, well-drained soil, warm climate"
}
```

### 5. Dangers
Critical safety information:
- **Toxicity**: Level (non-toxic, low, moderate, high)
- **Warnings**: Safety precautions
- **Contraindications**: Who should avoid

Example:
```json
"dangers": {
  "toxicity": "Generally safe",
  "warnings": ["Avoid large medicinal doses during pregnancy"],
  "contraindications": ["Pregnancy: culinary amounts safe"]
}
```

### 6. Substitutes
Alternative herbs with reasoning:
- **Name**: Alternative herb
- **Reason**: Why it works as substitute
- **Tradition**: Cultural context

Example:
```json
"substitutes": [
  {
    "name": "Basil",
    "reason": "Culinary and some medicinal properties",
    "tradition": "western"
  }
]
```

### 7. Botanical Information
Scientific and taxonomic data:
- **Scientific Name**: Latin binomial (e.g., Nelumbo nucifera)
- **Family**: Plant family (e.g., Nelumbonaceae)
- **Native Region**: Geographic origin
- **Common Names**: Alternative names

Example:
```json
"botanicalInfo": {
  "scientificName": "Ocimum sanctum",
  "family": "Lamiaceae",
  "nativeRegion": "Indian subcontinent",
  "commonNames": ["Holy Basil", "Sacred Basil", "Vrinda"]
}
```

## Current Enrichment Coverage

### Fully Enriched Herbs (with complete metadata)

#### Buddhist Tradition
- **Lotus** - enlightenment symbol, purity from suffering
- **Sandalwood** - meditation, temple incense, transcendence
- **Bodhi** - Buddha's awakening, wisdom, enlightenment

#### Hindu Tradition
- **Tulsi** (Holy Basil) - Vishnu worship, daily puja, devotion
- **Soma** - immortality, Vedic ritual, cosmic consciousness
- **Lotus** - Lakshmi's throne, Brahma's birth, divine creation

#### Islamic Tradition
- **Black Seed** - Sunnah practice, healing, divine remedy

#### Greek Tradition
- **Laurel** - Apollo, victory, prophecy, poetic inspiration

### Partially Enriched Herbs

Herbs with basic data but incomplete metadata sections:
- Greek: Myrtle, Oak, Olive, Pomegranate, Ambrosia
- Norse: Ash, Elder, Mugwort, Yarrow, Yew
- And 30+ others

### Target for Expansion

Additional traditions to enrich:
- Egyptian herbs (blue lotus varieties)
- Persian herbs (Haoma)
- Japanese herbs (Sakaki)
- Celtic herbs
- Mayan herbs

## File Structure

```
docs/
├── HERB_METADATA_README.md          (this file)
├── HERB_METADATA_SCHEMA.md          (complete schema definition)
├── HERB_ENRICHMENT_GUIDE.md         (implementation instructions)
└── HERB_METADATA_QUICK_REFERENCE.md (quick reference card)

scripts/
├── enrich-herbs-metadata.js         (main enrichment script)
└── validate-herb-metadata.js        (validation/quality tool)

firebase-assets-downloaded/herbs/
├── _all.json                        (index of all herbs)
├── buddhist_lotus.json
├── buddhist_sandalwood.json
├── hindu_tulsi.json
├── islamic_black-seed.json
├── greek_laurel.json
└── [45+ other herb files]
```

## Quick Start

### 1. Validate Current Data

```bash
# Check all herbs
node scripts/validate-herb-metadata.js

# Check specific herb
node scripts/validate-herb-metadata.js buddhist_lotus
```

Expected output:
```
Valid: 30 ✓
With warnings: 8 ⚠
With errors: 7 ✗
Validation rate: 66.7%
```

### 2. Enrich in Firebase

```bash
# Set credentials
export FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json

# Run enrichment
node scripts/enrich-herbs-metadata.js
```

Expected output:
```
Enriched: 30 ✓
Skipped: 15 ⊘
Total: 45
```

### 3. Verify in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Go to Firestore → `herbs` collection
3. Open any enriched document
4. Check for new fields:
   - `properties.magical`, `.medicinal`, `.spiritual`
   - `preparations.primary`, `.dosage`
   - `associations.deities`, `.concepts`
   - `harvesting.season`, `.method`
   - `dangers.toxicity`, `.warnings`
   - `substitutes` array
   - `botanicalInfo` object
   - `metadata.enrichedWithMetadata = true`

## Adding New Herb Enrichment

### Step 1: Edit Enrichment Data

Open `scripts/enrich-herbs-metadata.js` and add to `HERB_ENRICHMENT_DATA`:

```javascript
tradition_herbname: {
  properties: {
    magical: ['property1', 'property2'],
    medicinal: ['benefit1', 'benefit2'],
    spiritual: ['aspect1', 'aspect2']
  },
  preparations: {
    primary: ['Method 1: step-by-step', 'Method 2: step-by-step'],
    alternative: ['Alt method'],
    dosage: 'Specific amount and frequency'
  },
  associations: {
    deities: ['deity_id1', 'deity_id2'],
    concepts: ['concept1', 'concept2'],
    elements: ['element'],
    chakras: ['chakra']
  },
  harvesting: {
    season: 'Seasonal timing',
    method: 'How to harvest',
    conditions: 'Growing requirements'
  },
  dangers: {
    toxicity: 'Toxicity level',
    warnings: ['Warning 1'],
    contraindications: ['Contraindication 1']
  },
  substitutes: [
    { name: 'Alt herb', reason: 'Why', tradition: 'tradition' }
  ],
  botanicalInfo: {
    scientificName: 'Genus species',
    family: 'Family name',
    nativeRegion: 'Geographic origin',
    commonNames: ['Name 1', 'Name 2']
  }
}
```

### Step 2: Validate

```bash
node scripts/validate-herb-metadata.js tradition_herbname
```

### Step 3: Enrich

```bash
node scripts/enrich-herbs-metadata.js
```

## Content Quality Standards

All enriched herbs should meet these criteria:

- [ ] All 7 metadata sections completed
- [ ] No empty arrays
- [ ] Properties: 3-7 items per category (magical/medicinal/spiritual)
- [ ] Preparations: Primary methods with clear instructions + dosage
- [ ] Associations: Deities use correct database IDs
- [ ] Harvesting: Season, method, and conditions all specified
- [ ] Dangers: Toxicity level clearly stated
- [ ] Substitutes: 1-3 alternatives with reasoning
- [ ] Botanical: Scientific name is proper binomial format
- [ ] Completeness: Minimum 80% (aim for 90%+)

## Validation Metrics

Run validation to see:

```
Completeness by Herb:
- buddhist_lotus: 95% ✓
- hindu_tulsi: 90% ✓
- greek_laurel: 75% ⚠
- islamic_black-seed: 85% ✓

Overall Statistics:
- Total herbs: 45
- Valid: 30 (66.7%)
- With warnings: 8 (17.8%)
- With errors: 7 (15.5%)
```

## Troubleshooting

### Firebase Connection Failed

```bash
# Set environment variable
export FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccountKey.json

# Or pass via command
FIREBASE_SERVICE_ACCOUNT=./key.json node scripts/enrich-herbs-metadata.js
```

### Herb Not Found During Validation

```bash
# Make sure herb file exists
ls -la firebase-assets-downloaded/herbs/herb_id.json

# Check it's valid JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('firebase-assets-downloaded/herbs/herb_id.json', 'utf8')))"
```

### Completeness Score Too Low

Run validation to identify missing fields:

```bash
node scripts/validate-herb-metadata.js herb_id
```

Common issues:
- Empty arrays (fill with at least 2 items)
- Missing dosage information
- Incomplete botanical info
- No harvesting season

## Integration with Application

### Displaying Rich Metadata

In entity detail views, use the new fields:

```javascript
// Display properties
const magicalProps = herb.properties?.magical || [];
const medicinalProps = herb.properties?.medicinal || [];

// Show preparations with dosage
const prepMethods = herb.preparations?.primary || [];
const dosage = herb.preparations?.dosage;

// Link to associated deities
const deities = herb.associations?.deities || [];

// Display harvesting info
const season = herb.harvesting?.season;
const method = herb.harvesting?.method;

// Show safety information
const toxicity = herb.dangers?.toxicity;
const warnings = herb.dangers?.warnings || [];
```

### Filtering and Search

Use metadata for improved filtering:

```javascript
// Find herbs by element
db.collection('herbs')
  .where('associations.elements', 'array-contains', 'water')
  .get();

// Find by chakra
db.collection('herbs')
  .where('associations.chakras', 'array-contains', 'heart')
  .get();

// Find by deity
db.collection('herbs')
  .where('associations.deities', 'array-contains', 'lakshmi')
  .get();
```

## Documentation Files

### 1. HERB_METADATA_SCHEMA.md
**Purpose**: Complete technical specification
**Audience**: Developers, data architects
**Contains**:
- Full schema structure
- Field specifications
- Data types and validation
- Examples from all traditions
- Implementation guidelines

### 2. HERB_ENRICHMENT_GUIDE.md
**Purpose**: Step-by-step implementation guide
**Audience**: Developers, content managers
**Contains**:
- Quick start instructions
- Validation and enrichment process
- Field-by-field reference
- Adding new herbs
- Quality checklist
- Troubleshooting

### 3. HERB_METADATA_QUICK_REFERENCE.md
**Purpose**: Quick lookup and cheat sheet
**Audience**: Developers, content contributors
**Contains**:
- Structure overview
- Property/element/chakra reference tables
- Common mistakes and fixes
- Command reference
- Validation checklist

### 4. HERB_METADATA_README.md
**Purpose**: Overview and getting started (this file)
**Audience**: All stakeholders
**Contains**:
- System overview
- The 7 metadata sections
- Current coverage
- Quick start guide
- Troubleshooting

## Success Metrics

### Coverage Goals

- **Phase 1 (Current)**: 30+ herbs with complete metadata
- **Phase 2**: 80%+ of all herb entities enriched
- **Phase 3**: 95%+ validation rate across all herbs

### Quality Standards

- **Completeness**: Minimum 80% (target 90%+)
- **Accuracy**: 100% scientific name verification
- **Consistency**: All 7 sections standardized
- **Validation**: 0 errors, <10% warnings

## Related Systems

This system integrates with:

- **Entity Types**: Deities, Places, Items, Concepts
- **Cross-linking**: Associations to other entities
- **Taxonomy**: Mythology traditions and classifications
- **Display**: Entity detail pages and browse views
- **Search**: Metadata-based filtering and discovery

## Future Enhancements

Planned improvements:

- [ ] Growing difficulty levels (beginner, intermediate, expert)
- [ ] Cultivation requirements by climate zone
- [ ] Companion planting recommendations
- [ ] Storage and shelf-life guidelines
- [ ] Cost and availability ratings by region
- [ ] Research citations and academic sources
- [ ] Cross-tradition preparation variations
- [ ] Seasonal availability calendars
- [ ] Vendor/supplier recommendations
- [ ] Modern scientific research links

## Contributing

To enrich additional herbs:

1. **Identify target herbs** - Check which traditions need coverage
2. **Research thoroughly** - Use traditional and modern sources
3. **Follow schema** - Use HERB_METADATA_SCHEMA.md format
4. **Validate quality** - Run validate-herb-metadata.js
5. **Test in Firebase** - Verify updates properly
6. **Document sources** - Note where information came from

## Support and Questions

- **Schema questions**: See HERB_METADATA_SCHEMA.md
- **Implementation help**: See HERB_ENRICHMENT_GUIDE.md
- **Quick answers**: See HERB_METADATA_QUICK_REFERENCE.md
- **Validation issues**: Run validate-herb-metadata.js and check output
- **Firebase issues**: Check service account credentials and permissions

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-01-01 | Complete metadata schema with 7 sections, enrichment and validation scripts |
| 1.0 | 2025-12-25 | Initial herb metadata structure |

## License and Attribution

This system is part of the Eyes of Azrael project. All herb information should include proper attribution to source traditions and academic works.

## Metadata Tracking

All enriched records include:

```json
"metadata": {
  "enrichedWithMetadata": true,
  "enrichmentDate": "2026-01-01T12:00:00.000Z",
  "enrichmentVersion": "2.0"
}
```

---

## Quick Links

- **Full Schema**: [HERB_METADATA_SCHEMA.md](HERB_METADATA_SCHEMA.md)
- **Implementation Guide**: [HERB_ENRICHMENT_GUIDE.md](HERB_ENRICHMENT_GUIDE.md)
- **Quick Reference**: [HERB_METADATA_QUICK_REFERENCE.md](HERB_METADATA_QUICK_REFERENCE.md)
- **Enrichment Script**: [enrich-herbs-metadata.js](../scripts/enrich-herbs-metadata.js)
- **Validation Script**: [validate-herb-metadata.js](../scripts/validate-herb-metadata.js)

---

**Status**: Ready for Production
**Last Updated**: 2026-01-01
**Maintained by**: Eyes of Azrael Development Team
