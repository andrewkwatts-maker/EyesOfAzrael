# Firebase Link Validation Tools

## Overview

This directory contains tools and reports for validating and fixing internal links in Firebase entity assets.

## Files

### Reports
- **`LINK_VALIDATION_FINAL_REPORT.md`** - Comprehensive analysis and recommendations
- **`LINK_VALIDATION_SUMMARY.md`** - Quick summary of findings
- **`link-validation-report.json`** - Full validation results (JSON)
- **`link-fixes.json`** - Proposed fixes for all issues (JSON)

### Scripts (in `/scripts` directory)
- **`validate-fix-links-v2.js`** - Main validation and fixing script
- **`batch-link-converter.js`** - Batch convert object links to ID format (recommended)

## Quick Start

### 1. Scan for Issues

```bash
node scripts/validate-fix-links-v2.js --scan
```

This will scan all entities and generate reports without making any changes.

### 2. Review Reports

Check the generated reports in `FIREBASE/link-validation/`:
- Start with `LINK_VALIDATION_SUMMARY.md` for quick overview
- Read `LINK_VALIDATION_FINAL_REPORT.md` for detailed analysis
- Examine `link-fixes.json` for specific fix proposals

### 3. Apply Fixes

```bash
# Apply auto-fixes only (safest)
node scripts/validate-fix-links-v2.js --fix

# Or use batch converter for systematic conversion
node scripts/batch-link-converter.js --mythology greek --dry-run
```

## Link Format Standards

### ✅ Correct Formats

#### Simple ID Reference (Recommended for arrays)
```json
{
  "relatedDeities": ["greek-zeus", "greek-hera", "greek-athena"]
}
```

#### Rich Object Reference (Recommended for complex relationships)
```json
{
  "relatedDeities": [
    {
      "id": "greek-zeus",
      "name": "Zeus",
      "type": "deity",
      "mythology": "greek",
      "icon": "⚡",
      "url": "/mythos/greek/deities/zeus.html"
    }
  ]
}
```

### ❌ Incorrect Formats (Legacy)

#### Object Without ID
```json
{
  "relatedDeities": [
    {
      "name": "Zeus",
      "tradition": "greek",
      "path": "../../greek/deities/zeus.html"
    }
  ]
}
```

#### Path-Only Reference
```json
{
  "relatedDeities": ["../../greek/deities/zeus.html"]
}
```

## Issue Types

| Issue | Count | Description | Fix |
|-------|-------|-------------|-----|
| `invalid_object_format` | 3,114 | Object without id field | Convert to proper format |
| `entity_not_found` | 2,022 | Referenced entity doesn't exist | Add entity or remove ref |
| `null_or_undefined` | 2 | Empty value | Remove |

## Field Types

### Entity Link Fields (Validated)
- `relatedDeities`, `relatedHeroes`, `relatedCreatures`, `relatedPlaces`
- `relatedItems`, `relatedConcepts`, `relatedRituals`, `relatedTexts`
- `parents`, `children`, `siblings`, `spouse`, `consort`
- `inhabitants`, `companions`, `associatedDeities`
- Nested: `relatedEntities.deities`, `mythologyContexts[].associatedDeities`, etc.

### Non-Entity Fields (NOT Validated as Entity Links)
- `sources` - Bibliographic references (different schema)
- `textReferences` - Text citations
- `events[].participants` - Event participants (may include non-entity objects)

## Best Practices

### When Creating New Entities

1. **Use ID references for simple lists:**
   ```json
   "relatedDeities": ["norse-odin", "norse-thor", "norse-loki"]
   ```

2. **Use rich objects for complex relationships:**
   ```json
   "parents": [
     {
       "id": "norse-odin",
       "name": "Odin",
       "type": "deity",
       "mythology": "norse",
       "relationship": "father"
     }
   ]
   ```

3. **Always validate entity IDs exist:**
   - Check `FIREBASE/data/indices/all-entities.json`
   - Or run validation script before committing

4. **Use consistent mythology prefixes:**
   - Format: `{mythology}-{entity-slug}`
   - Examples: `greek-zeus`, `hindu-vishnu`, `egyptian-ra`

### When Updating Existing Entities

1. **Run validation first:**
   ```bash
   node scripts/validate-fix-links-v2.js --scan
   ```

2. **Check for broken links:**
   - Review generated report
   - Fix any issues before committing

3. **Test after changes:**
   ```bash
   node scripts/validate-fix-links-v2.js --mythology <your-mythology>
   ```

## Common Tasks

### Validate Single Mythology

```bash
node scripts/validate-fix-links-v2.js --scan --mythology=greek
```

### Fix Auto-fixable Issues

```bash
# Dry run first
node scripts/validate-fix-links-v2.js --fix --mythology=greek

# Check results, then run without dry-run
node scripts/validate-fix-links-v2.js --fix --mythology=greek
```

### Convert All Links to Standard Format

```bash
# Test first
node scripts/batch-link-converter.js --dry-run

# Apply after verification
node scripts/batch-link-converter.js
```

### Find Entities with Most Issues

Check `topProblematicEntities` in `link-validation-report.json` or see summary report.

## Validation Results

### Current Status (Latest Scan)

- ✅ **792 valid links** (13.4%)
- 🔄 **83 need format conversion** (1.4%)
- ❌ **5,136 broken links** (86.6%)

### By Category

- **Auto-fixable:** 2 (remove null/empty)
- **Format conversions:** 83 (valid but wrong format)
- **Needs review:** 5,134 (manual fixes required)

## Troubleshooting

### "Entity not found" Errors

**Cause:** Referenced entity doesn't exist in index

**Solutions:**
1. Check if entity exists: `grep -r "\"id\": \"entity-id\"" FIREBASE/data/entities/`
2. If missing, create entity file or remove reference
3. Check for typos in entity ID

### "Invalid object format" Errors

**Cause:** Object reference without `id` field

**Solutions:**
1. Add `id` field to object
2. Convert to simple ID string
3. Use batch converter script

### "Ambiguous name" Errors

**Cause:** Multiple entities with same name

**Solutions:**
1. Use mythology-specific ID
2. Add mythology context to reference
3. Manually disambiguate

## Contributing

When adding new entities or updating links:

1. Follow link format standards above
2. Run validation before committing
3. Fix any issues found
4. Update indices if adding new entities

## Maintenance

### Regular Tasks

- **Weekly:** Run full validation scan
- **Monthly:** Review and fix top problematic entities
- **Quarterly:** Audit link quality metrics

### After Major Changes

- Run full validation
- Update indices
- Check for broken cross-references
- Regenerate reports

## Support

For issues or questions:
1. Check this README first
2. Review `LINK_VALIDATION_FINAL_REPORT.md` for detailed info
3. Examine validation script source code
4. Create issue with validation report attached

## Version History

- **v2.0** (2025-12-27): Added object format detection, improved name matching
- **v1.0** (2025-12-27): Initial validation system
