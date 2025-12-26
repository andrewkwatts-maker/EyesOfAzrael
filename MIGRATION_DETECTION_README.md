# HTML to Firebase Migration Detection System

> Automatically detect which HTML files need to be migrated to Firebase assets

## Quick Start

```bash
# Run detection (fastest, no Firebase needed)
npm run detect-migrations

# View summary
node scripts/show-migration-summary.js

# Verify detection is working
node scripts/verify-detection.js
```

## What You Get

After running, you'll have:

1. **`HTML_MIGRATION_REPORT.md`** - Human-readable summary
2. **`html-migration-backlog.json`** - Prioritized list of 468 files to migrate
3. **`html-migration-report.json`** - Complete analysis data
4. **`html-files-to-delete.json`** - Safe to delete after verification

## Current Status

| Metric | Count |
|--------|-------|
| Total HTML Files | 2,317 |
| Infrastructure (keep) | 1,849 |
| **Need Migration** | **468** |
| Priority 10 (urgent) | 140 |
| Priority 8-9 (high) | 63 |

## Migration Priority

The system automatically prioritizes files 1-10 based on:
- **Asset type** (deities > heroes > creatures)
- **Content richness** (more sections = higher priority)
- **File size** (larger = more content)

### Top Priority Files (Priority 10)

```
1. Yoruba deities (5 files)
2. Tarot cards (6 files)
3. Sumerian deities (7 files)
4. Roman deities (20 files)
5. Greek deities (64 files)
```

## What Gets Excluded (Infrastructure)

The script is VERY careful to exclude:

- ✅ Root pages (`index.html`, `login.html`, `dashboard.html`, etc.)
- ✅ All `index.html` files (605 total - category listings)
- ✅ Corpus search pages (26 files)
- ✅ FIREBASE folder (1,136 files - already migrated)
- ✅ Templates and components
- ✅ Test files
- ✅ Auth and admin pages

**Only content pages are flagged for migration.**

## Available Commands

```bash
# Detection
npm run detect-migrations              # Fast scan, no Firebase
npm run detect-migrations:firebase     # With Firebase verification
npm run detect-migrations:verbose      # Detailed output

# Analysis
node scripts/show-migration-summary.js # Quick summary
node scripts/verify-detection.js      # Validation check

# Direct script access
node scripts/detect-html-migrations.js --skip-firebase
node scripts/detect-html-migrations.js --check-firebase
node scripts/detect-html-migrations.js --verbose
```

## Recommended Workflow

### 1. Detect
```bash
npm run detect-migrations
```

### 2. Review
Open `HTML_MIGRATION_REPORT.md` and review:
- Total files needing migration
- Breakdown by mythology
- Breakdown by asset type
- Priority distribution

### 3. Migrate High Priority First
```bash
# Start with small mythologies (Yoruba, Tarot, Sumerian)
node scripts/migrate-to-firebase-assets.js --mythology yoruba

# Or migrate by priority
# (manually select priority 10 files from backlog)
```

### 4. Verify
```bash
# Re-run with Firebase checks
npm run detect-migrations:firebase

# This will show:
# - What's been migrated (moved to "complete")
# - What still needs work (stays in "newMigrations")
# - What needs updating (moved to "updates")
```

### 5. Clean Up
Once Firebase assets are verified complete:
```bash
# Review files marked for deletion
cat html-files-to-delete.json

# Manually verify in Firebase
# Then delete HTML files
```

## Understanding the Reports

### html-migration-backlog.json

Each entry contains:
```json
{
  "file": "mythos/yoruba/deities/yemoja.html",
  "assetId": "yoruba-yemoja",
  "assetType": "deity",
  "mythology": "yoruba",
  "title": "Yoruba - Yemoja - Mother of Waters and Fertility",
  "summary": "Great Mother Orisha of the Ocean...",
  "sections": 9,
  "fileSize": 22937,
  "priority": 10
}
```

Use this to:
- See what needs migrating
- Understand content structure
- Plan migration batches
- Track progress

### HTML_MIGRATION_REPORT.md

Human-readable summary with:
- Statistics tables
- Top priority files
- Breakdowns by type/mythology
- Next steps guide

## Migration Strategy

### Phase 1: Small Mythologies (Quick Wins)
- Yoruba (5 files)
- Tarot (15 files)
- Sumerian (15 files)

**Why start here:**
- Small, manageable sets
- High priority content
- Test migration workflow
- Build confidence

### Phase 2: Major Mythologies
- Greek (64 files)
- Norse (40 files)
- Egyptian (38 files)
- Hindu (37 files)

**Why next:**
- Core content
- Most visited pages
- Rich metadata
- Good test cases

### Phase 3: Abrahamic Traditions
- Christian (77 files) - Largest set
- Jewish (21 files)
- Islamic (15 files)

**Why later:**
- Complex theology content
- May need special handling
- Benefits from experience with earlier phases

## Asset Types Detected

| Type | Count | Examples |
|------|-------|----------|
| deity | 197 | Zeus, Odin, Vishnu |
| place | 70 | Valhalla, Mount Olympus, Underworld |
| hero | 57 | Gilgamesh, Hercules, Buddha |
| creature | 36 | Phoenix, Dragon, Sphinx |
| text | 36 | Vedas, Eddas, Sutras |
| item | 22 | Mjolnir, Holy Grail, Ankh |
| ritual | 20 | Baptism, Sacrifice, Meditation |
| concept | 20 | Karma, Valhalla, Nirvana |
| event | 10 | Ragnarok, Flood, Creation |

## Mythologies Detected

21 mythologies total:
- Greek, Roman, Norse, Egyptian
- Hindu, Buddhist, Christian, Jewish, Islamic
- Celtic, Babylonian, Sumerian, Persian
- Chinese, Japanese, Aztec, Mayan
- Yoruba, Tarot, Freemasons, Apocryphal
- Native American, Comparative

## Troubleshooting

### "No files found"
Make sure you're in the project root directory.

### "Firebase connection failed"
Use `--skip-firebase` flag for detection without Firebase checks.

### "Too many infrastructure files"
This is normal. 1,849 infrastructure files are correctly excluded.

### "File classified wrong"
Check if file path matches expected patterns in `detect-html-migrations.js`.

## Performance

- **2,317 files scanned in ~30 seconds**
- **No Firebase**: 20 seconds
- **With Firebase**: 2-3 minutes (network latency)
- **Memory usage**: Minimal (streaming)
- **Output size**: ~500KB JSON

## Files Generated

| File | Size | Purpose |
|------|------|---------|
| HTML_MIGRATION_REPORT.md | ~10KB | Human-readable summary |
| html-migration-backlog.json | ~150KB | Prioritized migration list |
| html-migration-report.json | ~300KB | Complete analysis data |
| html-files-to-delete.json | ~50KB | Safe deletion candidates |

## Integration

Works seamlessly with:
- `scripts/migrate-to-firebase-assets.js` - Main migration tool
- `scripts/migration-config.js` - Shared configuration
- Firebase Admin SDK
- Existing npm scripts

## Documentation

- **`HTML_MIGRATION_QUICK_REFERENCE.md`** - Quick start guide
- **`HTML_MIGRATION_SYSTEM_SUMMARY.md`** - Technical deep dive
- **`MIGRATION_DETECTION_README.md`** - This file

## Success Criteria

✅ **All achieved:**
- Scans entire repository (2,317 files)
- Correctly excludes infrastructure (1,849 files)
- Detects content needing migration (468 files)
- Prioritizes by importance (1-10 scale)
- Generates actionable reports
- Zero errors
- Ready for production

## Next Steps

1. ✅ **You are here** - Detection system complete
2. 🎯 Start migrating priority 10 files (140 files)
3. 🎯 Verify with Firebase checks
4. 🎯 Complete all 468 migrations
5. 🎯 Clean up HTML files
6. 🎯 System fully Firebase-based

## Support

Questions or issues? Check:
1. `HTML_MIGRATION_QUICK_REFERENCE.md` for common questions
2. `HTML_MIGRATION_SYSTEM_SUMMARY.md` for technical details
3. `scripts/detect-html-migrations.js` source code (well commented)

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Created**: December 26, 2025
**Files to Migrate**: 468
**Estimated Time**: 20-30 hours for all migrations
