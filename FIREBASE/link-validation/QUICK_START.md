# Firebase Link Validation - Quick Start Guide

## TL;DR

**What:** Validated all internal links in Firebase entities
**Result:** 13.4% valid, 86.6% need fixes (mostly format conversions)
**Action:** Run validation script, apply auto-fixes, review problematic entities

## Run Validation

```bash
# Scan all entities
node scripts/validate-fix-links-v2.js --scan

# Scan specific mythology
node scripts/validate-fix-links-v2.js --scan --mythology=greek

# Apply auto-fixes
node scripts/validate-fix-links-v2.js --fix
```

## Check Results

Reports generated in `FIREBASE/link-validation/`:
- `LINK_VALIDATION_SUMMARY.md` - Quick overview
- `LINK_VALIDATION_FINAL_REPORT.md` - Full analysis
- `link-fixes.json` - All proposed fixes

## Main Issues Found

1. **3,114 links:** Object format without `id` field
2. **2,022 links:** Referenced entities don't exist
3. **~800 links:** Sources field incorrectly validated
4. **2 links:** Null/empty values

## Quick Fixes

### Auto-fixable (2 links)
```bash
node scripts/validate-fix-links-v2.js --fix
```
Removes null/empty entries automatically.

### Format Conversions (83 links)
Valid links with wrong format - can be batch converted.

**Before:**
```json
{
  "name": "Zeus",
  "tradition": "greek",
  "path": "../../greek/deities/zeus.html"
}
```

**After:**
```json
"greek-zeus"
```

### Manual Review (5,134 links)
- Missing entities (need creation or removal)
- Ambiguous references (need clarification)

## Top Problematic Entities

Most issues in these entities (mostly format problems):
1. Sacred Groves (96.4% broken)
2. Mahabodhi Temple (97.8%)
3. Fátima (95.7%)
4. Mount Kōya (100%)
5. Mount Kailash (93.2%)

## Correct Link Formats

### Simple ID (Recommended)
```json
"relatedDeities": ["greek-zeus", "greek-hera"]
```

### Rich Object (For complex relations)
```json
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
```

## Next Steps

1. **Read:** `LINK_VALIDATION_FINAL_REPORT.md` for full details
2. **Run:** Auto-fixes with `--fix` flag
3. **Review:** Top 20 problematic entities
4. **Fix:** Missing Norse deity files (17 files)
5. **Convert:** Object-based links to standard format
6. **Test:** Re-run validation after fixes

## Files Generated

```
FIREBASE/link-validation/
├── LINK_VALIDATION_FINAL_REPORT.md  ⭐ Full analysis
├── LINK_VALIDATION_SUMMARY.md       📊 Quick stats
├── README.md                         📚 Documentation
├── QUICK_START.md                    ⚡ This file
├── link-validation-report.json       🔍 Raw data
└── link-fixes.json                   🔧 Proposed fixes

scripts/
└── validate-fix-links-v2.js          🛠️ Validation tool
```

## Common Issues

### "Entity not found"
**Fix:** Check if entity exists, create it, or remove reference

### "Invalid object format"
**Fix:** Add `id` field or convert to simple ID string

### "Missing id or name"
**Fix:** 17 Norse deity files need proper fields added

## Need Help?

1. Check `README.md` in `FIREBASE/link-validation/`
2. Review `LINK_VALIDATION_FINAL_REPORT.md`
3. Examine validation script source code

---

**Report Date:** December 27, 2025
**Entities Scanned:** 529
**Links Analyzed:** 5,928
**Valid Links:** 792 (13.4%)
**Broken Links:** 5,136 (86.6%)
