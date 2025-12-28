# Link Validation - Quick Start Guide

## TL;DR

```bash
# Validate all SPA navigation links
node scripts/validate-spa-links.js

# Auto-fix broken links
node scripts/auto-fix-links.js
```

## Status: ✅ ALL LINKS VALID

- **SPA Routes:** 7 unique, 100% working
- **Last Validated:** December 28, 2025
- **Broken Links:** 0

## Available Tools

### 1. `validate-spa-links.js` ⭐ RECOMMENDED

**Best for:** Regular validation, CI/CD pipelines

```bash
node scripts/validate-spa-links.js
```

**Features:**
- ✅ Validates SPA navigation routes only
- ✅ Ignores page anchors (#section-id)
- ✅ Fast and accurate
- ✅ Exit code 0 if all OK, 1 if broken

**Output:**
- `SPA_LINK_VALIDATION.md` - Full report
- `SPA_LINK_FIX_SUMMARY.md` - Quick summary

### 2. `validate-all-links.js`

**Best for:** Deep dive analysis

```bash
node scripts/validate-all-links.js
```

**Features:**
- 🔍 Validates ALL href links
- 🔍 Includes page anchors
- 🔍 More verbose output
- ⚠️ May show false positives for page anchors

**Output:**
- `COMPREHENSIVE_LINK_VALIDATION.md`
- `QUICK_FIX_SUMMARY.md`

### 3. `auto-fix-links.js`

**Best for:** Fixing broken links automatically

```bash
# Preview changes
node scripts/auto-fix-links.js --dry-run

# Apply fixes
node scripts/auto-fix-links.js
```

**Features:**
- 🔧 Creates missing view components
- 🔧 Fixes typos in categories/mythologies
- 🔧 Suggests corrections
- 🔧 Generates fix report

**Output:**
- `LINK_FIX_REPORT.md`
- Modified source files

## Quick Validation Checklist

- [ ] Run `node scripts/validate-spa-links.js`
- [ ] Check exit code is 0
- [ ] Review `SPA_LINK_VALIDATION.md` if errors
- [ ] Fix critical issues first
- [ ] Re-run validation after fixes

## Common Commands

### Validate before commit
```bash
npm run validate-links  # Add to package.json scripts
```

### CI/CD Integration
```yaml
# .github/workflows/validate.yml
- name: Validate Links
  run: node scripts/validate-spa-links.js
```

### Debug specific route
```javascript
// In browser console
window.location.hash = '#/mythology/greek/deities/zeus';
```

## Link Types

### ✅ Valid SPA Routes

```
#/                              → Home
#/search                        → Search
#/compare                       → Compare
#/mythology/greek               → Mythology index
#/browse/deities                → Browse all deities
#/browse/deities/greek          → Greek deities
#/mythology/greek/deities/zeus  → Specific entity
```

### ❌ NOT SPA Routes (Page Anchors)

```
#overview                       → Scroll to section
#L123                          → Code line number
#angels-section                → Page section
```

## Priority Levels

### 🔴 CRITICAL
- Missing routes (site broken)
- Invalid entity IDs
- Must fix immediately

### 🟠 HIGH
- Invalid category names
- Invalid mythology names
- Fix this week

### 🟡 MEDIUM
- Deprecated routes
- Formatting issues
- Fix this month

### ⚪ LOW
- Warnings
- Best practice suggestions
- Fix when convenient

## Troubleshooting

### "Unknown route" errors

**Problem:** Link detected as broken but it's a page anchor

**Solution:**
```bash
# Use SPA-specific validator
node scripts/validate-spa-links.js
```

### "Invalid category" errors

**Problem:** Typo in category name

**Valid categories:**
```
deities, heroes, creatures, texts, rituals,
herbs, cosmology, magic, items, places, symbols
```

**Solution:**
```bash
# Auto-fix will suggest correction
node scripts/auto-fix-links.js
```

### "Invalid mythology" errors

**Problem:** Mythology not in whitelist

**Valid mythologies:**
```
greek, norse, egyptian, hindu, chinese, japanese,
celtic, babylonian, sumerian, persian, roman,
aztec, mayan, buddhist, christian, jewish, islamic,
yoruba, native_american, apocryphal
```

## Exit Codes

- `0` - All links valid ✅
- `1` - Broken links found ❌

## File Locations

```
scripts/
├── validate-spa-links.js       ⭐ Main validator
├── validate-all-links.js       🔍 Deep analysis
└── auto-fix-links.js           🔧 Auto-fixer

Reports:
├── SPA_LINK_VALIDATION.md      📊 SPA validation report
├── SPA_LINK_FIX_SUMMARY.md     📝 Quick summary
├── COMPREHENSIVE_LINK_VALIDATION.md  📚 All links report
└── LINK_FIX_REPORT.md          🔧 Fix actions log
```

## Best Practices

1. **Use SPA validator for regular checks**
   ```bash
   node scripts/validate-spa-links.js
   ```

2. **Fix critical issues first**
   - Missing routes
   - Invalid entity IDs

3. **Test in browser**
   - Click all fixed links
   - Verify pages load correctly

4. **Re-run validation**
   - After fixes
   - Before committing

5. **Add to CI/CD**
   - Prevent broken links in production
   - Gate deployments on validation

## Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "validate": "node scripts/validate-spa-links.js",
    "validate:all": "node scripts/validate-all-links.js",
    "fix:links": "node scripts/auto-fix-links.js",
    "fix:links:dry": "node scripts/auto-fix-links.js --dry-run"
  }
}
```

Then run:

```bash
npm run validate
npm run fix:links
```

## Questions?

1. Read `COMPREHENSIVE_LINK_VALIDATION_REPORT.md`
2. Check `SPA_LINK_VALIDATION.md` for latest results
3. Review code in `scripts/validate-spa-links.js`

---

**Last Updated:** December 28, 2025
**Status:** ✅ ALL VALID
**Next Check:** Before production deployment
