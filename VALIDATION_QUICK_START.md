# Firebase Schema Validation - Quick Start Guide

**Purpose:** Ensure all entities conform to Entity-Schema-v2.0 before Firebase migration
**Script Location:** `H:\Github\EyesOfAzrael\scripts\validate-firebase-schema.js`

---

## Quick Commands

### Validate All Local Entities
```bash
cd H:\Github\EyesOfAzrael
node scripts/validate-firebase-schema.js --local --report
```

### Validate Specific Collection
```bash
node scripts/validate-firebase-schema.js --local --collection=deities
node scripts/validate-firebase-schema.js --local --collection=items
node scripts/validate-firebase-schema.js --local --collection=places
```

### Validate Firebase (After Upload)
```bash
node scripts/validate-firebase-schema.js --report
```

---

## Understanding the Output

### Console Summary

```
================================================================================
FIREBASE ENTITY-SCHEMA-V2.0 COMPLIANCE REPORT
================================================================================

📊 EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
Total documents audited:     462
Schema compliance:           99% (459/462 documents)
Average completeness:        56%
Invalid documents:           3
Priority fixes needed:       3
Broken cross-references:     176
Low completeness (<50%):     111
```

**Key Metrics:**
- **Schema Compliance:** % of entities with all required fields (id, type, name, mythologies, primaryMythology)
- **Average Completeness:** % of recommended metadata fields present (0-100%)
- **Priority Fixes:** Critical errors that block Firebase upload
- **Broken Cross-References:** Entity references that don't resolve to existing entities

### Per-Collection Results

```
📚 PER-COLLECTION RESULTS
--------------------------------------------------------------------------------
deities              ✅ 89           Compliance: 100%   Completeness: 70%
items                ✅ 142          Compliance: 100%   Completeness: 37%
magic-systems        ⚠️ 51           Compliance: 94%    Completeness: 69%
```

**Status Icons:**
- ✅ = All entities valid
- ⚠️ = Has validation errors
- 🔴 = Critical issues

### Priority Fixes Section

```
🔴 PRIORITY FIXES (Critical Errors)
--------------------------------------------------------------------------------
magic-systems/key-of-solomon
  ❌ file: JSON parsing error: Expected ',' or ']' (line 103)
```

**Action:** Fix these immediately before Firebase upload

### Broken References Section

```
🔗 BROKEN CROSS-REFERENCES
--------------------------------------------------------------------------------
concepts/kami
  ⚠️  relatedEntities.deities: 'amaterasu' (Amaterasu-Omikami) not found
```

**Action:** Create missing entities or update IDs

### Low Completeness Section

```
📉 LOW COMPLETENESS ENTITIES (<50%)
--------------------------------------------------------------------------------
concepts/nirvana: 13%
  Missing: linguistic.originalName, linguistic.pronunciation, ...
```

**Action:** Enrich these entities with missing metadata

---

## Detailed JSON Report

Location: `scripts/reports/firebase-compliance-{timestamp}.json`

### Report Structure

```json
{
  "generated": "2025-12-13T12:15:52.000Z",
  "summary": {
    "totalDocuments": 462,
    "validDocuments": 459,
    "invalidDocuments": 3,
    "complianceRate": 99,
    "avgCompleteness": 56
  },
  "collections": {
    "deities": {
      "documentCount": 89,
      "expectedCount": 100,
      "valid": 89,
      "invalid": 0,
      "complianceRate": "100%",
      "avgCompleteness": "70%",
      "status": "✅"
    }
  },
  "priorityFixes": [
    {
      "collection": "magic-systems",
      "id": "key-of-solomon",
      "errors": [...]
    }
  ],
  "brokenReferences": [
    {
      "collection": "concepts",
      "id": "kami",
      "references": [...]
    }
  ],
  "lowCompletenessEntities": [
    {
      "collection": "concepts",
      "id": "nirvana",
      "completeness": 13,
      "missingFields": [...]
    }
  ]
}
```

---

## Completeness Score Explained

### How It's Calculated

Each recommended metadata field has a point value:

**Linguistic (18 points):**
- originalName: 5 pts
- pronunciation: 5 pts
- etymology: 5 pts
- transliteration: 3 pts

**Geographical (8 points):**
- primaryLocation: 5 pts
- region: 3 pts

**Temporal (11 points):**
- firstAttestation: 5 pts
- historicalDate: 3 pts
- culturalPeriod: 3 pts

**Metaphysical (7 points):**
- primaryElement: 3 pts
- planets: 2 pts
- sefirot: 2 pts

**Core Content (15 points):**
- shortDescription: 5 pts
- longDescription: 5 pts
- sources: 5 pts

**Relationships (5 points):**
- relatedEntities: 5 pts

**Metadata (10 points):**
- tags: 3 pts
- cultural: 3 pts
- colors: 2 pts
- mediaReferences: 2 pts

**Total Possible:** 74 points
**Completeness %** = (Earned Points / 74) × 100

### Completeness Targets

- **80-100%:** Excellent - Ready for publication
- **60-79%:** Good - Acceptable for public use
- **50-59%:** Acceptable - Could use enrichment
- **<50%:** Poor - Needs significant work

---

## Common Validation Errors

### 1. Missing Required Fields

```
❌ Required field 'primaryMythology' is missing or empty
```

**Fix:** Add the missing field to your JSON:
```json
{
  "primaryMythology": "greek"
}
```

### 2. Invalid ID Format

```
❌ ID 'Zeus_Greek' does not match kebab-case pattern
```

**Fix:** Use lowercase with hyphens only:
```json
{
  "id": "zeus"  // ✅ Good
  // "id": "Zeus_Greek"  ❌ Bad
}
```

### 3. Empty Mythologies Array

```
❌ Field 'mythologies' array must have at least one item
```

**Fix:** Add at least one mythology:
```json
{
  "mythologies": ["greek"]
}
```

### 4. Broken Cross-Reference

```
⚠️ Referenced entity 'amaterasu' does not exist
```

**Fix Option 1:** Create the missing entity
**Fix Option 2:** Remove or update the reference

### 5. JSON Syntax Error

```
❌ JSON parsing error: Expected ',' or ']' (line 103)
```

**Fix:** Check JSON syntax at the specified line:
```json
// Bad:
"items": [
  {"id": "item1"}
  {"id": "item2"}  // ❌ Missing comma
]

// Good:
"items": [
  {"id": "item1"},  // ✅ Comma added
  {"id": "item2"}
]
```

---

## Workflow Integration

### Pre-Commit Validation

Add this to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "Validating entity schema..."
node scripts/validate-firebase-schema.js --local

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Entity validation failed!"
  echo "Fix errors before committing."
  echo ""
  exit 1
fi

echo "✅ Entity validation passed"
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### CI/CD Integration

GitHub Actions (`.github/workflows/validate.yml`):

```yaml
name: Validate Entity Schema
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/validate-firebase-schema.js --local
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: scripts/reports/firebase-compliance-*.json
```

---

## Fixing Common Issues

### Fix JSON Syntax Errors

1. Open the file mentioned in error
2. Go to the line number specified
3. Look for missing commas, brackets, or quotes
4. Use a JSON validator (https://jsonlint.com)
5. Run validation again to confirm fix

### Fix Broken Cross-References

1. Note the missing entity ID from validation output
2. Option A: Create the missing entity
3. Option B: Update the reference to an existing entity
4. Option C: Remove the reference if no longer needed

### Improve Completeness Score

Focus on high-value fields first:

**Priority 1 (5 points each):**
- Add `linguistic.originalName`
- Add `linguistic.pronunciation`
- Add `linguistic.etymology`
- Add `geographical.primaryLocation`
- Add `temporal.firstAttestation`
- Add `shortDescription`
- Add `longDescription`
- Add `sources`
- Add `relatedEntities`

**Priority 2 (3 points each):**
- Add `linguistic.transliteration`
- Add `geographical.region`
- Add `temporal.historicalDate`
- Add `temporal.culturalPeriod`
- Add `metaphysicalProperties.primaryElement`
- Add `tags`
- Add `cultural`

---

## Exit Codes

The validation script returns:

- **0:** All entities valid ✅
- **1:** Has validation errors or warnings ⚠️

Use in scripts:
```bash
node scripts/validate-firebase-schema.js --local
if [ $? -eq 0 ]; then
  echo "All clear!"
  npm run deploy
fi
```

---

## Getting Help

### Validation Failed?

1. Read the console output carefully
2. Check `scripts/reports/firebase-compliance-*.json` for details
3. See `PRIORITY_FIXES.md` for common fixes
4. See `FIREBASE_SCHEMA_COMPLIANCE_REPORT.md` for full analysis

### Need to Add a Field?

Refer to the Entity Schema:
```
H:\Github\EyesOfAzrael\data\schemas\entity-schema-v2.json
```

### Schema Questions?

Check the schema documentation for field definitions, formats, and examples.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `--local` | Validate local files instead of Firebase |
| `--report` | Generate detailed JSON report |
| `--collection=<name>` | Validate only one collection |
| Exit code 0 | All valid |
| Exit code 1 | Has errors |

| Completeness | Meaning |
|--------------|---------|
| 80-100% | Excellent ✅ |
| 60-79% | Good ✅ |
| 50-59% | Acceptable ⚠️ |
| <50% | Poor 🔴 |

---

## Next Steps

After running validation:

1. ✅ Review console summary
2. ✅ Check detailed JSON report
3. 🔴 Fix critical errors (JSON syntax)
4. ⚠️ Fix high-priority issues (missing entities)
5. ⚠️ Enrich low-completeness entities
6. ✅ Re-run validation to verify fixes
7. 🚀 Proceed with Firebase upload

**Target:** 100% schema compliance, 70%+ average completeness
