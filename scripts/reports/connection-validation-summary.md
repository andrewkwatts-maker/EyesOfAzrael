# Connection Validation Report

**Generated:** 2026-01-10T05:11:58.587Z

## Summary

| Metric | Value |
|--------|-------|
| Total Assets | 733 |
| Total Connections | 1131 |
| Compliant Assets | 166 |
| Non-Compliant Assets | 567 |
| Compliance Rate | 22.65% |
| Total Errors | 257 |
| Total Warnings | 2378 |
| Broken Links | 253 |
| Invalid URLs | 0 |
| Legacy Fields Found | 6 |

## Legacy Field Usage

These fields should be migrated to the standardized format:

| Field | Usage Count | Migration Target |
|-------|-------------|------------------|
| `relatedConcepts` | 24 | `relatedEntities.concepts` |
| `inhabitants` | 112 | `relatedEntities.deities` |
| `wielders` | 140 | `relatedEntities.heroes` |
| `relatedItems` | 80 | `relatedEntities.items` |
| `guardians` | 48 | `relatedEntities.creatures` |
| `relatedDeities` | 15 | `relatedEntities.deities` |

## Issues by Entity Type

| Type | Issue Count | Assets Affected |
|------|-------------|------------------|
| deity | 8859 | 229 |
| creature | 77 | 18 |
| hero | 112 | 13 |
| concept | 43 | 15 |
| cosmology | 117 | 63 |
| item | 826 | 140 |
| place | 360 | 48 |
| text | 2 | 1 |
| herb | 12 | 6 |
| ritual | 19 | 6 |
| symbol | 100 | 10 |
| magic | 34 | 12 |
| being | 104 | 6 |

## Recommendations

1. **Migrate Legacy Fields**: Update 6 legacy field names to standardized equivalents
2. **Fix Broken Links**: Resolve 253 references to non-existent entities
3. **Standardize References**: Convert string references to entityReference objects with id and name
4. **Validate URLs**: Fix 0 invalid URL formats
5. **Review Corpus Searches**: Check 141 invalid corpus search configurations
