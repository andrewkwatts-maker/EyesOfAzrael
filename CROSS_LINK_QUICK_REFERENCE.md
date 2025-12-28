# Cross-Link System Quick Reference

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Assets | 377 |
| Total Links | 895 |
| Broken Links | 737 (82.3%) |
| Format Issues | 213 (23.8%) |
| Bidirectional Issues | 73 (8.2%) |
| **Bidirectional Completeness** | **91.84%** ✅ |

## Quick Commands

```bash
# Validate cross-links
npm run validate:cross-links

# Fix broken links (preview)
npm run fix:broken-links:dry

# Fix broken links (apply)
npm run fix:broken-links

# Add bidirectional links (preview)
npm run add:bidirectional:dry

# Add bidirectional links (apply)
npm run add:bidirectional

# Standardize link format (preview)
npm run standardize:links:dry

# Standardize link format (apply)
npm run standardize:links
```

## Standard Link Format

### Ideal Format
```json
{
  "id": "greek_deity_zeus",
  "name": "Zeus",
  "type": "deity"
}
```

### ID Pattern
`{mythology}_{type}_{name}`

Examples:
- `greek_deity_zeus`
- `norse_hero_sigurd`
- `egyptian_cosmology_duat`

## Link Fields

- `related_deities`
- `related_heroes`
- `related_creatures`
- `related_items`
- `related_places`
- `related_texts`
- `associated_deities`
- `associated_places`
- `relatedEntities`
- `relationships`

## Common Issues

### 1. Broken Links (82%)
**Problem:** Links point to non-existent assets
- Missing mythology prefix: `_cosmology_duat` → `egyptian_cosmology_duat`
- Descriptive text instead of IDs
- Assets not yet created

**Solution:** Fix ID extraction + create missing assets

### 2. Format Issues (24%)
**Problem:** Inconsistent link formats
- String paths: `"../../greek/deities/zeus.html"`
- Missing fields: objects without `id`
- Wrong structure

**Solution:** Run `npm run standardize:links`

### 3. Bidirectional Missing (8%)
**Problem:** One-way links
- A → B exists
- B → A missing

**Solution:** Run `npm run add:bidirectional`

## Recommended Workflow

```bash
# 1. Check current state
npm run validate:cross-links

# 2. Standardize formats
npm run standardize:links:dry  # Review
npm run standardize:links      # Apply

# 3. Add missing bidirectional
npm run add:bidirectional:dry  # Review
npm run add:bidirectional      # Apply

# 4. Validate again
npm run validate:cross-links

# 5. Check improvements
cat reports/cross-link-validation-report.json
```

## Target Metrics

- Bidirectional Completeness: >95%
- Link Resolution: >90%
- Format Standardization: 100%

## Reports Location

- `reports/cross-link-validation-report.json`
- `reports/broken-links.json`
- `reports/link-suggestions.json`

## Issues to Fix

1. JSON syntax errors in 6 herb files
2. ID extraction missing mythology prefix
3. Relationship field needs parsing
4. Link type detection needs improvement
