# HTML Migration Detection - Quick Reference

## Quick Start

```bash
# Run detection (without Firebase checks)
npm run detect-migrations

# Run with Firebase verification
npm run detect-migrations:firebase

# Run with verbose output
npm run detect-migrations:verbose
```

## What It Does

The `detect-html-migrations.js` script scans your entire repository and:

1. **Identifies all HTML files** (found 2,317 total)
2. **Categorizes them** into:
   - Infrastructure pages (keep as-is)
   - Content pages that need Firebase migration
3. **Generates prioritized backlog** for migration
4. **Optionally checks Firebase** to see what's already migrated

## Output Files

After running, you'll get 4 files:

### 1. `HTML_MIGRATION_REPORT.md`
Human-readable summary with statistics and breakdowns.

### 2. `html-migration-report.json`
Complete analysis data including:
- All infrastructure files
- All files needing migration
- All files needing updates
- All files that can be deleted
- Any errors encountered

### 3. `html-migration-backlog.json`
**Prioritized list for migration**, sorted by importance (10 = highest priority).
Use this to decide what to migrate first.

Example entry:
```json
{
  "file": "mythos/yoruba/deities/yemoja.html",
  "assetId": "yoruba-yemoja",
  "assetType": "deity",
  "mythology": "yoruba",
  "title": "Yoruba - Yemoja - Mother of Waters and Fertility",
  "summary": "Great Mother Orisha of the Ocean...",
  "sections": 9,
  "priority": 10
}
```

### 4. `html-files-to-delete.json`
Files that can be safely deleted AFTER verifying Firebase has complete data.

## Current Results Summary

From latest run (December 26, 2025):

| Category | Count |
|----------|-------|
| **Total HTML Files** | **2,317** |
| Infrastructure (keep) | 1,849 |
| **Needs Migration** | **468** |
| Needs Update | 0 |
| Can Delete | 0 |

## Breakdown by Type

| Asset Type | Files to Migrate |
|------------|------------------|
| deity | 197 |
| place | 70 |
| hero | 57 |
| creature | 36 |
| text | 36 |
| item | 22 |
| ritual | 20 |
| concept | 20 |
| event | 10 |

## Breakdown by Mythology

| Mythology | Files to Migrate |
|-----------|------------------|
| Christian | 77 |
| Greek | 64 |
| Norse | 40 |
| Egyptian | 38 |
| Hindu | 37 |
| Buddhist | 31 |
| Roman | 25 |
| Persian | 22 |
| Jewish | 21 |
| Babylonian | 17 |

## Priority System

Files are prioritized 1-10 based on:

- **Asset Type**:
  - Deities: +3 priority
  - Heroes: +2 priority
  - Creatures: +1 priority

- **Content Richness**:
  - 6+ sections: +2 priority
  - 4-5 sections: +1 priority

- **File Size**:
  - 50KB+: +1 priority

**Priority 10** = Most important (e.g., major deities with rich content)
**Priority 5** = Baseline (e.g., basic concept pages)

## Infrastructure Pages (NOT Migrated)

The script automatically excludes:

- Root-level pages: `index.html`, `about.html`, `dashboard.html`, etc.
- Component directories: `/templates/`, `/components/`
- Test files: `/tests/`, `*.test.html`
- Category indexes: any `index.html` file
- Special pages: `corpus-search.html`, `browse.html`, `submit.html`
- Auth pages: `login.html`, `auth-*.html`
- Admin pages: `admin*.html`
- FIREBASE folder: `/FIREBASE/` (already migrated)
- Backups: any file with "backup", "_old", "_dev"

## Workflow

### Step 1: Run Detection
```bash
npm run detect-migrations
```

### Step 2: Review Reports
- Check `HTML_MIGRATION_REPORT.md` for overview
- Review `html-migration-backlog.json` for detailed list

### Step 3: Migrate High Priority First
Focus on priority 8-10 files (197 deities are mostly priority 10).

```bash
# Migrate a single file (test)
npm run migrate:test

# Migrate entire mythology
node scripts/migrate-to-firebase-assets.js --mythology yoruba

# Migrate all (dry run first!)
npm run migrate:dry-run
npm run migrate
```

### Step 4: Verify with Firebase Checks
After migration, run with Firebase verification:
```bash
npm run detect-migrations:firebase
```

This will:
- Check if assets exist in Firebase
- Compare content completeness
- Update the backlog to show what's been completed

### Step 5: Clean Up
Once Firebase assets are verified:
- Review `html-files-to-delete.json`
- **Verify each file in Firebase before deleting**
- Delete HTML files that are fully migrated

## Asset ID Generation

The script generates Firebase asset IDs from file paths:

```
mythos/greek/deities/zeus.html
  → mythology: "greek"
  → assetType: "deity"
  → assetId: "greek-zeus"

mythos/norse/creatures/fenrir.html
  → mythology: "norse"
  → assetType: "creature"
  → assetId: "norse-fenrir"
```

## Troubleshooting

### "Could not determine asset type"
The file path doesn't match known patterns. It's treated as infrastructure and skipped.

### "Could not determine mythology"
The file isn't in a recognized `/mythos/[mythology]/` path. It's skipped.

### Firebase connection errors
Use `--skip-firebase` flag to run without Firebase checks.

## Advanced Usage

### Check specific mythology
```bash
# Run detection, then filter results
npm run detect-migrations
node -e "const data = require('./html-migration-backlog.json'); console.log(JSON.stringify(data.filter(f => f.mythology === 'greek'), null, 2))"
```

### Count by priority
```bash
node -e "const data = require('./html-migration-backlog.json'); const counts = {}; data.forEach(f => counts[f.priority] = (counts[f.priority] || 0) + 1); console.log(counts);"
```

### Find largest files
```bash
node -e "const data = require('./html-migration-backlog.json'); console.log(data.sort((a,b) => b.fileSize - a.fileSize).slice(0, 20));"
```

## Next Steps

1. **Start with Yoruba** (5 deities, all priority 10, smallest mythology)
2. **Then Tarot** (15 files, mostly deities)
3. **Then Sumerian** (15 files, foundational mythology)
4. **Then major mythologies**: Christian (77), Greek (64), Norse (40)

## Script Details

**Location**: `scripts/detect-html-migrations.js`

**Dependencies**:
- `cheerio` - HTML parsing
- `glob` - File finding
- `firebase-admin` - Optional Firebase verification

**Flags**:
- `--skip-firebase` - Don't check Firebase (faster)
- `--check-firebase` - Verify against Firebase
- `--verbose` - Detailed console output
- `-v` - Alias for verbose

---

**Generated**: December 26, 2025
**Script Version**: 1.0.0
**Total HTML Files**: 2,317
**Migrations Needed**: 468
