# Herb Entity Metadata Enrichment System - Complete Index

## Project Overview

The Herb Entity Metadata Enrichment System provides comprehensive standardization and enrichment of sacred herb entities in the Eyes of Azrael mythology encyclopedia. This system ensures all herb records contain rich, consistent metadata across 7 key dimensions: properties, preparations, associations, harvesting, dangers, substitutes, and botanical information.

**Current Status**: Schema and scripts complete, ready for Firebase enrichment
**Coverage**: 5 herbs fully enriched (100%), 15 partially enriched (40%), 25+ need enrichment
**Target**: 95%+ of all herb entities with complete metadata

---

## Quick Start (3 Steps)

### 1. Validate Current Data
```bash
node scripts/validate-herb-metadata.js
```

### 2. Enrich Firebase
```bash
export FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
node scripts/enrich-herbs-metadata.js
```

### 3. Verify Results
Open Firebase Console → Firestore → herbs collection → Check for new metadata fields

---

## Documentation Files

### Main Documentation (in `docs/`)

#### 1. **HERB_METADATA_README.md** - START HERE
   - System overview and architecture
   - The 7 metadata sections explained
   - Quick start guide
   - Current coverage status
   - Integration guidelines
   - **Read first for complete understanding**

#### 2. **HERB_METADATA_SCHEMA.md** - Technical Reference
   - Complete schema definition
   - Field specifications and data types
   - Validation requirements
   - Detailed examples from all traditions
   - Implementation guidelines for developers
   - **Reference for detailed specifications**

#### 3. **HERB_ENRICHMENT_GUIDE.md** - Implementation Instructions
   - Step-by-step enrichment process
   - Validation procedures
   - Detailed field-by-field reference
   - Adding new herbs to enrichment data
   - Content quality checklist
   - Firebase update options
   - Troubleshooting guide
   - **Follow this to implement enrichment**

#### 4. **HERB_METADATA_QUICK_REFERENCE.md** - Developer Cheat Sheet
   - Metadata structure at a glance
   - Property types by tradition
   - Element and chakra references
   - Toxicity level definitions
   - Deity ID format reference
   - Common mistakes and fixes
   - Command quick reference
   - **Quick lookup for common questions**

#### 5. **HERB_ENRICHMENT_STATUS.md** - Progress Tracking
   - Current enrichment status for all herbs
   - Coverage by tradition
   - Detailed status of 5+ enriched herbs
   - List of herbs needing enrichment (prioritized)
   - Data source citations
   - Contributing guidelines
   - Integration checklist
   - **Track progress and see what needs work**

---

## Script Files (in `scripts/`)

### 1. **enrich-herbs-metadata.js** - Main Enrichment Script
**Purpose**: Batch-enrich herb records in Firebase
**Usage**:
```bash
export FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
node scripts/enrich-herbs-metadata.js
```

**Features**:
- Reads local herb JSON files
- Merges enrichment data with existing records
- Updates Firebase Firestore with new metadata
- Tracks enrichment metadata automatically
- Provides completion statistics
- Error handling and logging
- Progress reporting

**Configuration**:
```javascript
// Edit HERB_ENRICHMENT_DATA in the file to add herbs
HERB_ENRICHMENT_DATA = {
  herb_id: {
    properties: { magical, medicinal, spiritual },
    preparations: { primary, alternative, dosage },
    associations: { deities, concepts, elements, chakras },
    harvesting: { season, method, conditions },
    dangers: { toxicity, warnings, contraindications },
    substitutes: [{ name, reason, tradition }],
    botanicalInfo: { scientificName, family, nativeRegion, commonNames }
  }
}
```

### 2. **validate-herb-metadata.js** - Quality Assurance Tool
**Purpose**: Validate herb records against schema
**Usage**:
```bash
# Validate all herbs
node scripts/validate-herb-metadata.js

# Validate specific herb
node scripts/validate-herb-metadata.js herb_id

# Generate report
node scripts/validate-herb-metadata.js > validation_report.txt
```

**Output Includes**:
- Validation status (✓ valid, ✗ invalid, ⚠ warnings)
- Completeness percentage (0-100%)
- Missing required fields
- Field-specific warnings
- Overall validation statistics
- Recommendations for improvement

**Validation Checks**:
- All 7 metadata sections present
- Required field completion
- Data type correctness
- Array non-emptiness
- Proper field structure
- Completeness scoring

---

## The 7 Metadata Sections

### 1. Properties (Magical, Medicinal, Spiritual)
**Purpose**: Categorize herb characteristics across dimensions
**Fields**:
- `magical`: Spiritual/mystical properties (array of 3-7 items)
- `medicinal`: Health benefits and uses (array of 3-7 items)
- `spiritual`: Ritual and practice aspects (array of 3-7 items)

**Example**:
```json
"properties": {
  "magical": ["purity", "enlightenment", "rebirth"],
  "medicinal": ["adaptogenic", "sedative", "nutritive"],
  "spiritual": ["meditation anchor", "chakra work"]
}
```

### 2. Preparations (Methods and Dosage)
**Purpose**: Provide practical usage instructions
**Fields**:
- `primary`: Main preparation methods with steps (array)
- `alternative`: Variant methods (array)
- `dosage`: Recommended amounts and frequency (string)

**Example**:
```json
"preparations": {
  "primary": [
    "Tea: steep 5-7 fresh leaves for 5-10 minutes",
    "Powder: 1/4-1/2 tsp with warm water"
  ],
  "alternative": ["Fresh leaves: chew directly"],
  "dosage": "5-7 fresh leaves daily or 1-2 cups tea"
}
```

### 3. Associations (Deities, Concepts, Elements, Chakras)
**Purpose**: Link herbs to other entities and concepts
**Fields**:
- `deities`: Associated gods/goddesses (array of entity IDs)
- `concepts`: Linked universal ideas (array of strings)
- `elements`: Fire, water, earth, air, space (array of strings)
- `chakras`: Energy centers root through crown (array of strings)

**Example**:
```json
"associations": {
  "deities": ["gautama_buddha", "avalokiteshvara"],
  "concepts": ["enlightenment", "compassion"],
  "elements": ["water", "earth"],
  "chakras": ["heart", "crown"]
}
```

### 4. Harvesting (Season, Method, Conditions)
**Purpose**: Provide ethical and practical collection guidance
**Fields**:
- `season`: When to harvest (string with months/timing)
- `method`: How to harvest respectfully (string)
- `conditions`: Growing/habitat requirements (string)

**Example**:
```json
"harvesting": {
  "season": "Summer (July-September for flowers and seeds)",
  "method": "Hand-harvest fully opened flowers with care",
  "conditions": "Shallow ponds, 6-18 inches water depth, full sun"
}
```

### 5. Dangers (Toxicity, Warnings, Contraindications)
**Purpose**: Ensure safe use with critical safety information
**Fields**:
- `toxicity`: Level - "Non-toxic", "Low", "Moderate", "High" (string)
- `warnings`: Safety precautions (array of strings)
- `contraindications`: Who should avoid (array of strings)

**Example**:
```json
"dangers": {
  "toxicity": "Non-toxic",
  "warnings": ["Ensure clean water source if wild-harvesting"],
  "contraindications": ["Generally safe as food and tea"]
}
```

### 6. Substitutes (Alternative Herbs)
**Purpose**: Provide alternatives with clear reasoning
**Fields**: Array of objects with:
- `name`: Alternative herb name (string)
- `reason`: Why it works as substitute (string)
- `tradition`: Cultural/tradition context (string)

**Example**:
```json
"substitutes": [
  {
    "name": "Water Lily",
    "reason": "Similar aquatic flower with shared spiritual properties",
    "tradition": "multiple"
  }
]
```

### 7. Botanical Information (Scientific, Family, Origin, Names)
**Purpose**: Provide accurate botanical classification
**Fields**:
- `scientificName`: Latin binomial (string)
- `family`: Plant family (string)
- `nativeRegion`: Geographic origin (string)
- `commonNames`: Alternative names (array of strings)

**Example**:
```json
"botanicalInfo": {
  "scientificName": "Nelumbo nucifera",
  "family": "Nelumbonaceae",
  "nativeRegion": "Asia (India to Japan, Australia)",
  "commonNames": ["Sacred Lotus", "Indian Lotus", "Padma", "Kamala"]
}
```

---

## Current Enrichment Coverage

### Fully Enriched (5 herbs - 100% complete)

1. **buddhist_lotus** - Enlightenment symbol, purity from suffering
2. **hindu_tulsi** - Daily worship, devotion, Lakshmi plant
3. **buddhist_sandalwood** - Meditation incense, transcendence
4. **islamic_black_seed** - Sunnah practice, healing
5. **greek_laurel** - Apollo, victory, prophecy

### Partially Enriched (15+ herbs - 40-60% complete)

- Buddhist: tea, preparations
- Hindu: soma
- Greek: myrtle, oak, olive, pomegranate, ambrosia
- Norse: ash, elder, mugwort, yarrow, yew
- Egyptian: lotus
- And more...

### Needs Enrichment (25+ herbs)

- Additional Norse herbs
- Egyptian herbs (complete)
- Persian herbs (Haoma)
- Japanese herbs (Sakaki)
- Celtic herbs
- Hebrew/Jewish herbs
- Others

---

## Enrichment Data Included

The enrichment script includes complete enrichment data for:

### Buddhist Herbs (3)
```
✓ buddhist_lotus      - Supreme enlightenment symbol
✓ buddhist_sandalwood - Meditation and temple incense
✓ buddhist_bodhi      - Buddha's awakening and wisdom
```

### Hindu Herbs (2)
```
✓ hindu_tulsi         - Daily puja, devotion, prosperity
✓ hindu_soma          - Vedic ritual, immortality
```

### Islamic Herbs (1)
```
✓ islamic_black_seed  - Sunnah practice, comprehensive healing
```

### Greek Herbs (1)
```
✓ greek_laurel        - Apollo, victory, prophecy, poetry
```

### Ready for Addition (template provided)
```
⚠ norse_mugwort       - Protection, journeying, divination
⚠ greek_myrtle        - Aphrodite, love, beauty
⚠ egyptian_lotus      - Blue lotus, rebirth, Ra
⚠ persian_haoma       - Zoroastrian sacred plant
⚠ japanese_sakaki     - Shinto purification
```

---

## File Structure

```
eyes-of-azrael/
├── HERB_ENRICHMENT_INDEX.md (this file - complete guide)
│
├── docs/
│   ├── HERB_METADATA_README.md         (START HERE - overview)
│   ├── HERB_METADATA_SCHEMA.md         (detailed specification)
│   ├── HERB_ENRICHMENT_GUIDE.md        (implementation steps)
│   ├── HERB_METADATA_QUICK_REFERENCE.md (quick lookup)
│   └── HERB_ENRICHMENT_STATUS.md       (progress tracking)
│
├── scripts/
│   ├── enrich-herbs-metadata.js        (enrichment automation)
│   └── validate-herb-metadata.js       (quality assurance)
│
└── firebase-assets-downloaded/herbs/
    ├── _all.json                       (herb index)
    ├── buddhist_lotus.json
    ├── hindu_tulsi.json
    ├── islamic_black-seed.json
    ├── greek_laurel.json
    └── [40+ other herb files]
```

---

## Workflow

### Typical Enrichment Workflow

```
1. PLAN
   └─ Identify herbs needing enrichment
   └─ Research sources
   └─ Prepare enrichment data

2. PREPARE
   └─ Add data to enrich-herbs-metadata.js
   └─ Follow HERB_METADATA_SCHEMA.md format
   └─ Verify all 7 sections complete

3. VALIDATE
   └─ Run: node scripts/validate-herb-metadata.js herb_id
   └─ Check for errors (should be 0)
   └─ Aim for 85%+ completeness

4. ENRICH
   └─ Set Firebase credentials
   └─ Run: node scripts/enrich-herbs-metadata.js
   └─ Monitor progress

5. VERIFY
   └─ Open Firebase Console
   └─ Check Firestore → herbs collection
   └─ Verify new metadata fields present

6. INTEGRATE
   └─ Test in application UI
   └─ Verify search/filter works
   └─ Document any custom enrichment
```

---

## Key Commands Reference

### Validation
```bash
# Validate all herbs
node scripts/validate-herb-metadata.js

# Validate one herb
node scripts/validate-herb-metadata.js buddhist_lotus

# Generate validation report
node scripts/validate-herb-metadata.js > report.txt

# Find incomplete herbs
node scripts/validate-herb-metadata.js | grep "⚠"

# Find errored herbs
node scripts/validate-herb-metadata.js | grep "✗"
```

### Enrichment
```bash
# Set credentials (one-time)
export FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json

# Run enrichment
node scripts/enrich-herbs-metadata.js

# Enrich with specific config
FIREBASE_SERVICE_ACCOUNT=./key.json node scripts/enrich-herbs-metadata.js
```

### Firebase
```bash
# Open Firebase Console
# Navigate to: Firestore → Collections → herbs

# Check single herb metadata
# Select any document and view new fields:
# - properties.magical, .medicinal, .spiritual
# - preparations.primary, .dosage
# - associations.deities, .concepts
# - harvesting.season, .method
# - dangers.toxicity, .warnings
# - substitutes
# - botanicalInfo.*
# - metadata.enrichedWithMetadata = true
```

---

## Quality Standards

All enriched herbs should meet:

- ✓ All 7 metadata sections completed
- ✓ No empty arrays (minimum 2 items)
- ✓ Properties: 3-7 items per category
- ✓ Preparations: Include clear dosage
- ✓ Associations: Use correct deity IDs
- ✓ Harvesting: All fields specified
- ✓ Dangers: Toxicity level stated
- ✓ Substitutes: 1-3 with reasoning
- ✓ Botanical: Proper scientific names
- ✓ Completeness: 80%+ (target 90%+)

---

## Common Tasks

### Adding a New Herb for Enrichment

1. Open `scripts/enrich-herbs-metadata.js`
2. Find `HERB_ENRICHMENT_DATA` object
3. Add new entry:
   ```javascript
   herb_id: {
     properties: { magical: [], medicinal: [], spiritual: [] },
     preparations: { primary: [], alternative: [], dosage: "" },
     associations: { deities: [], concepts: [], elements: [], chakras: [] },
     harvesting: { season: "", method: "", conditions: "" },
     dangers: { toxicity: "", warnings: [], contraindications: [] },
     substitutes: [],
     botanicalInfo: { scientificName: "", family: "", nativeRegion: "", commonNames: [] }
   }
   ```
4. Fill with complete data (follow examples)
5. Validate: `node scripts/validate-herb-metadata.js herb_id`
6. Run enrichment: `node scripts/enrich-herbs-metadata.js`

### Updating Existing Herb

1. Edit enrichment data in script
2. Run: `node scripts/validate-herb-metadata.js herb_id`
3. Run: `node scripts/enrich-herbs-metadata.js`
4. Verify in Firebase Console

### Finding Data Issues

```bash
# Get completeness report
node scripts/validate-herb-metadata.js

# Find specific herb problems
node scripts/validate-herb-metadata.js herb_id

# See missing fields
node scripts/validate-herb-metadata.js herb_id 2>&1 | grep "Missing"

# See empty fields
node scripts/validate-herb-metadata.js herb_id 2>&1 | grep "empty"
```

---

## Troubleshooting

### Firebase Connection Failed
```bash
# Solution 1: Set environment variable
export FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccountKey.json

# Solution 2: Check file exists
ls -la serviceAccountKey.json

# Solution 3: Copy credentials to root
cp /path/to/serviceAccountKey.json ./serviceAccountKey.json
```

### Validation Failures
```bash
# Check what's wrong
node scripts/validate-herb-metadata.js herb_id

# Common issues:
# - Empty arrays (fill with 2+ items)
# - Missing dosage (add specific amounts)
# - Invalid entity IDs (use exact deity IDs)
# - Incomplete sections (fill all 7)
```

### Low Completeness Score
```bash
# If score < 80%:
# 1. Run validation to see missing fields
# 2. Use template from HERB_ENRICHMENT_GUIDE.md
# 3. Fill all required fields
# 4. Re-validate and test
```

---

## Success Metrics

### Phase 1 (Current)
- ✓ Schema complete
- ✓ Scripts functional
- ✓ 5 herbs fully enriched
- ✓ Documentation complete
- Target: Reached

### Phase 2 (Next Month)
- 20+ herbs enriched
- 70%+ average completeness
- All traditions represented
- Target date: 2026-02-28

### Phase 3 (This Quarter)
- 40+ herbs enriched
- 85%+ average completeness
- 95%+ validation rate
- Full UI integration
- Target date: 2026-06-30

---

## Support and Resources

### Documentation
- **Overview**: HERB_METADATA_README.md
- **Technical Details**: HERB_METADATA_SCHEMA.md
- **How-To Guide**: HERB_ENRICHMENT_GUIDE.md
- **Quick Lookup**: HERB_METADATA_QUICK_REFERENCE.md
- **Progress Tracking**: HERB_ENRICHMENT_STATUS.md

### Tools
- **Enrichment**: scripts/enrich-herbs-metadata.js
- **Validation**: scripts/validate-herb-metadata.js
- **Schema**: HERB_METADATA_SCHEMA.md

### Getting Help
1. Check appropriate documentation file
2. Run validation script for diagnostics
3. Review examples in enriched herbs
4. Consult HERB_METADATA_QUICK_REFERENCE.md

---

## Project Status

| Component | Status | Completion |
|-----------|--------|-----------|
| Metadata Schema | ✓ Complete | 100% |
| Enrichment Script | ✓ Complete | 100% |
| Validation Script | ✓ Complete | 100% |
| Documentation | ✓ Complete | 100% |
| Enriched Herbs | ⚠ In Progress | 44% |
| Firebase Integration | ⚠ Ready | 100% |
| UI Integration | ⚠ Pending | 0% |

**Overall Status**: Ready for production enrichment

---

## Next Steps

1. ✓ Review HERB_METADATA_README.md for overview
2. ✓ Read HERB_METADATA_SCHEMA.md for specifications
3. Follow HERB_ENRICHMENT_GUIDE.md for implementation
4. Run validation on current herbs
5. Execute enrichment script for Firebase update
6. Verify results in Firebase Console
7. Integrate into application views
8. Expand to additional herbs using priority list

---

## Version Information

- **Schema Version**: 2.0
- **Script Version**: 1.0
- **Documentation Version**: 1.0
- **Release Date**: 2026-01-01
- **Status**: Active / Production Ready

---

## License and Attribution

This enrichment system is part of the Eyes of Azrael mythology encyclopedia. All herb information should include proper attribution to source traditions, academic works, and practitioners.

---

## Contact

For questions, issues, or contributions regarding the herb enrichment system:
- Review documentation files
- Run validation scripts for diagnostics
- Check Firebase Console for current state
- Consult with Eyes of Azrael development team

---

**Ready to start? Begin with HERB_METADATA_README.md**
