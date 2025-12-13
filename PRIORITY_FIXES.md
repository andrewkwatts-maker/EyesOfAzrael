# Priority Fixes - Firebase Schema Compliance

**Last Updated:** December 13, 2025
**Status:** 3 Critical, 176 High Priority, 111 Medium Priority

---

## CRITICAL FIXES (Do First)

### 1. JSON Syntax Errors (Blocking)

These files have malformed JSON and cannot be parsed. **Fix immediately before any Firebase migration.**

| File | Line | Error | Action Required |
|------|------|-------|-----------------|
| `data/entities/magic/key-of-solomon.json` | 103 | Missing comma in array | Add comma after previous element |
| `data/entities/magic/picatrix.json` | 155 | Missing comma in array | Add comma after previous element |
| `data/entities/magic/sefer-yetzirah.json` | 115 | Missing comma in array | Add comma after previous element |

**Time Estimate:** 30 minutes
**Impact:** BLOCKING - Prevents Firebase upload

---

## HIGH PRIORITY FIXES (Week 1)

### 2. Missing Japanese Deities (Referenced 15+ times)

Create these entities to resolve broken cross-references:

| Entity ID | Name | Type | Priority | Referenced By |
|-----------|------|------|----------|---------------|
| `amaterasu` | Amaterasu-Omikami | deity | HIGH | concepts/kami, concepts/harae, + 8 more |
| `susanoo` | Susanoo-no-Mikoto | deity | HIGH | concepts/kami, + 6 more |
| `izanagi` | Izanagi | deity | MEDIUM | concepts/harae, concepts/kegare, + 4 more |
| `izanami` | Izanami | deity | MEDIUM | concepts/kegare, + 3 more |
| `inari` | Inari Okami | deity | MEDIUM | concepts/kami, + 4 more |
| `okuninushi` | Okuninushi | deity | LOW | concepts/musubi, + 2 more |
| `takamimusubi` | Takamimusubi-no-Kami | deity | LOW | concepts/musubi |
| `kamimusubi` | Kamimusubi-no-Kami | deity | LOW | concepts/musubi |

**Time Estimate:** 8 hours (1 hour per deity)
**Impact:** HIGH - Resolves 45+ broken references

### 3. Missing Greek Heroes

| Entity ID | Name | Type | Priority | Referenced By |
|-----------|------|------|----------|---------------|
| `icarus` | Icarus | hero | HIGH | concepts/hubris, + 3 more |
| `arachne` | Arachne | hero | MEDIUM | concepts/hubris, + 2 more |
| `hector` | Hector | hero | MEDIUM | concepts/kleos, + 4 more |
| `oedipus` | Oedipus | hero | MEDIUM | concepts/moira, + 3 more |

**Time Estimate:** 4 hours
**Impact:** MEDIUM - Resolves 15+ broken references

### 4. Missing Greek Deities

| Entity ID | Name | Type | Priority | Referenced By |
|-----------|------|------|----------|---------------|
| `nemesis` | Nemesis | deity | MEDIUM | concepts/hubris, + 2 more |
| `ate` | Ate | deity | LOW | concepts/hubris |
| `moirai` | The Moirai (Fates) | deity | MEDIUM | concepts/moira, + 3 more |

**Time Estimate:** 3 hours
**Impact:** MEDIUM - Resolves 8+ broken references

### 5. Missing Concepts

| Entity ID | Name | Type | Priority | Referenced By |
|-----------|------|------|----------|---------------|
| `vanir` | Vanir | concept | MEDIUM | concepts/aesir, + 2 more |
| `brahman` | Brahman | concept | MEDIUM | concepts/maya, + 2 more |
| `themis` | Themis | concept | LOW | concepts/dharma |

**Time Estimate:** 3 hours
**Impact:** LOW - Resolves 6 broken references

---

## MEDIUM PRIORITY FIXES (Weeks 2-3)

### 6. Low Completeness Entities (<20%)

#### Buddhist Concepts (13% completeness each)

**Files:**
- `data/entities/concept/dependent-origination.json`
- `data/entities/concept/karuna.json`
- `data/entities/concept/klesha.json`
- `data/entities/concept/nirvana.json`

**Required Additions:**
```json
{
  "linguistic": {
    "originalName": "निर्वाण",  // Add Sanskrit/Pali
    "originalScript": "devanagari",
    "pronunciation": "/nɪrˈvɑːnə/",  // Add IPA
    "etymology": {
      "rootLanguage": "Sanskrit",
      "meaning": "blown out, extinguished",
      "derivation": "nir- (out) + vā (to blow)"
    }
  },
  "geographical": {
    "primaryLocation": {
      "name": "Ancient India",
      "coordinates": { "latitude": 25.5941, "longitude": 85.1376 }
    },
    "region": "Indian Subcontinent"
  },
  "temporal": {
    "firstAttestation": {
      "date": { "year": -500, "circa": true },
      "source": "Pali Canon",
      "type": "literary"
    }
  }
}
```

**Time Estimate:** 4 hours (1 hour each)
**Impact:** Improves completeness from 13% → 60%

#### Underdeveloped Items (13% completeness each)

**Top Priority Items:**
1. `aarons-rod.json` - Biblical item, high cultural significance
2. `asclepius-staff.json` - Medical symbol, widely recognized
3. `artemis-bow.json` - Major Greek deity weapon
4. `apollo-lyre.json` - Major Greek deity symbol

**Required Additions:**
- Original Hebrew/Greek names
- IPA pronunciations
- Etymology and linguistic history
- Primary geographical locations (temples, sacred sites)
- First attestation in historical texts
- Primary source references

**Time Estimate:** 8 hours (30 min each for 16 items)
**Impact:** Improves items collection from 37% → 45%

---

## COLLECTION COMPLETION TARGETS

### Herbs Collection (CRITICAL)

**Current:** 2/28 (7%)
**Target:** 28/28 (100%)
**Status:** Severely underpopulated

**Missing Herbs:**
- Myrrh
- Frankincense
- Hyssop
- Mandrake
- Wormwood
- Mugwort
- Rue
- Yarrow
- Elder
- Hawthorn
- Rowan
- Ash
- Birch
- Oak (sacred tree)
- Willow
- Hazel
- Acacia
- Cedar
- Cypress
- Lotus
- Sacred Basil (Tulsi)
- Soma plant
- Sandalwood
- Saffron
- Cannabis (in Hindu/Buddhist contexts)
- Ayahuasca

**Time Estimate:** 26 hours (1 hour each)
**Impact:** HIGH - Completes critical collection

### Items Collection

**Current:** 142/242 (59%)
**Target:** 242/242 (100%)
**Missing:** 100 items

**Refer to Agent 1 work plan**

### Places Collection

**Current:** 84/129 (65%)
**Target:** 129/129 (100%)
**Missing:** 45 places

**Refer to Agent 2 work plan**

### Magic Systems Collection

**Current:** 48/99 (48%) - after fixing 3 broken files
**Target:** 99/99 (100%)
**Missing:** 51 magic systems

**Refer to Agent 3 work plan**

---

## AUTOMATED FIXES

### Script: Auto-Add Missing Fields

Create a script to automatically add default values for commonly missing fields:

```javascript
// scripts/auto-enrich-entities.js

const missingFieldDefaults = {
  'tags': (entity) => [
    entity.name.toLowerCase().replace(/\s+/g, '-'),
    entity.type,
    entity.primaryMythology
  ],
  'icon': (entity) => {
    const iconMap = {
      deity: '⚡',
      hero: '⚔️',
      creature: '🐉',
      item: '✨',
      place: '🏛️',
      magic: '🔮',
      concept: '💭'
    };
    return iconMap[entity.type] || '⭐';
  },
  'colors.primary': (entity) => {
    const colorMap = {
      greek: '#4169E1',
      norse: '#B0C4DE',
      egyptian: '#FFD700',
      hindu: '#FF6347',
      chinese: '#DC143C',
      japanese: '#FF1493',
      celtic: '#228B22'
    };
    return colorMap[entity.primaryMythology] || '#9370DB';
  }
};

// Auto-apply to entities missing these fields
```

**Time Estimate:** 2 hours to write, 30 min to run
**Impact:** Improves average completeness by ~5%

---

## VALIDATION WORKFLOW

### Pre-Upload Checklist

Before uploading ANY entity to Firebase:

- [ ] Run JSON validator: `node scripts/validate-firebase-schema.js --local`
- [ ] Check completeness score: Must be ≥50% (target 60%)
- [ ] Validate cross-references: All referenced IDs must exist
- [ ] Check required fields: id, type, name, mythologies, primaryMythology
- [ ] Verify ID format: kebab-case, unique, matches file name
- [ ] Test JSON parsing: No syntax errors

### Post-Upload Verification

After uploading to Firebase:

- [ ] Query document from Firestore
- [ ] Verify all fields transferred correctly
- [ ] Test cross-reference links
- [ ] Check search index updated
- [ ] Verify page renders correctly

---

## TIME ESTIMATES

| Priority Level | Task Count | Est. Hours | Est. Days |
|----------------|------------|------------|-----------|
| **CRITICAL** | 3 files | 0.5 | 0.1 |
| **HIGH** | 15 entities | 15 | 2 |
| **MEDIUM** | 111 enrichments | 30 | 4 |
| **COLLECTION COMPLETION** | 122 entities | 122 | 15 |
| **TOTAL** | 251 items | 167.5 | 21 |

**With 2 developers working full-time: ~10.5 days**
**With 1 developer working full-time: ~21 days**
**With 1 developer working part-time (4h/day): ~42 days**

---

## QUICK WIN RECOMMENDATIONS

### Week 1 Quick Wins (Maximum Impact, Minimal Time)

1. **Fix 3 JSON errors** (30 min) → Unblocks Firebase upload
2. **Create Amaterasu deity** (1 hour) → Fixes 10+ broken refs
3. **Create Susanoo deity** (1 hour) → Fixes 6+ broken refs
4. **Run auto-enrichment script** (30 min) → +5% completeness across all entities
5. **Add pronunciations to top 20 deities** (2 hours) → High user value

**Total Time:** 5 hours
**Impact:**
- Unblocks Firebase upload ✅
- Fixes 16+ broken references ✅
- Improves average completeness by 5% ✅
- Enhances top 20 most-viewed entities ✅

---

## TRACKING PROGRESS

### Metrics Dashboard

Create a simple tracking sheet:

| Week | Critical Fixed | High Fixed | Med Fixed | Avg Completeness | Broken Refs |
|------|----------------|------------|-----------|------------------|-------------|
| Start | 0/3 | 0/15 | 0/111 | 56% | 176 |
| Week 1 | 3/3 ✅ | 5/15 | 0/111 | 61% | 140 |
| Week 2 | 3/3 ✅ | 15/15 ✅ | 30/111 | 65% | 80 |
| Week 3 | 3/3 ✅ | 15/15 ✅ | 80/111 | 68% | 20 |
| Week 4 | 3/3 ✅ | 15/15 ✅ | 111/111 ✅ | 70% | 0 ✅ |

**Target Achievement Date:** 4 weeks from start

---

## AUTOMATION OPPORTUNITIES

### Scripts to Create

1. **auto-add-pronunciation.js** - Use API to get IPA pronunciations
2. **auto-fix-references.js** - Scan and fix broken cross-references
3. **auto-generate-tags.js** - Generate tags from name + mythology + type
4. **validate-on-save.js** - Pre-commit hook for validation
5. **completeness-report.js** - Weekly completeness tracking

**Time to Create:** 8 hours
**Time Saved:** 40+ hours over project lifetime

---

## NOTES

- All file paths relative to repository root
- Entity IDs must be kebab-case and unique across ALL collections
- Cross-references use entity ID, not file path
- Completeness scores calculated by `validate-firebase-schema.js`
- Priority based on reference count + user impact + cultural significance
