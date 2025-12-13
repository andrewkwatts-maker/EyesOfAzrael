# Phase 2 Migration - Quick Reference Guide

**Status:** Phase 1 Complete (382 items, 70%)
**Remaining:** 420 files (30%)
**Estimated Time:** 8-12 hours execution + 4-6 hours testing

---

## At A Glance

### Content Breakdown

```
┌─────────────────────────────────────────────────┐
│  REMAINING CONTENT TO MIGRATE (420 files)      │
├─────────────────────────────────────────────────┤
│                                                 │
│  📖 Sacred Texts            55 files   [HIGH]  │
│     └─ Revelation texts: 32 files               │
│                                                 │
│  ✨ Christian Gnostic       37 files   [HIGH]  │
│     └─ Theological concepts                     │
│                                                 │
│  🔯 Jewish Kabbalah         31 files   [HIGH]  │
│     └─ Mystical teachings                       │
│                                                 │
│  💭 Concepts/Events         43 files   [MED]   │
│                                                 │
│  ❓ Unknown/Mixed          291 files   [LOW]   │
│                                                 │
│  🎨 SVG Graphics             1 file    [MED]   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Execution Order

### ⚡ BATCH 1: Simple Content (2-3 hours)
**Parser:** Universal (existing)
**Files:** ~200 files
**Command:**
```bash
node scripts/migrate-to-firebase-assets.js --mythology apocryphal
node scripts/migrate-to-firebase-assets.js --mythology celtic
node scripts/migrate-to-firebase-assets.js --mythology aztec
```

---

### 📖 BATCH 2: Sacred Texts (4-5 hours)
**Parser:** `parse-sacred-texts.js` (NEW - need to create)
**Files:** 55 files
**Special Features:**
- Scripture reference extraction
- Cross-reference linking
- Parallel passage detection

**Key Modifications:**
```javascript
// Extract verse citations (e.g., "Revelation 7:1-8")
function parseScriptureReferences($) {
  const citations = [];
  const matches = text.match(/([A-Z][a-z]+)\s+(\d+):(\d+)(-(\d+))?/g);
  return citations;
}
```

**Command:**
```bash
# Test first
node scripts/parse-sacred-texts.js --dry-run --page mythos/christian/texts/revelation/144000.html

# Full migration
node scripts/parse-sacred-texts.js --all
```

---

### ✨ BATCH 3: Gnostic Theology (5-6 hours)
**Parser:** `parse-gnostic-content.js` (NEW - need to create)
**Files:** 37 files
**Special Features:**
- Aeon card extraction (syzygy pairs)
- Quote card parsing (Nag Hammadi texts)
- Theological hierarchy mapping

**Key HTML Structures:**
- `.aeon-card` - Divine emanation pairs
- `.gnostic-topic-card` - Theological topics
- `.quote-card` - Sacred text quotes

**Sample Files to Test:**
- `mythos/christian/gnostic/aeons.html`
- `mythos/christian/gnostic/demiurge.html`
- `mythos/christian/gnostic/sophia.html`

**Command:**
```bash
# Test
node scripts/parse-gnostic-content.js --dry-run --page mythos/christian/gnostic/aeons.html

# Migrate
node scripts/parse-gnostic-content.js --mythology christian --path gnostic
```

---

### 🔯 BATCH 4: Kabbalah Mysticism (5-6 hours)
**Parser:** `parse-kabbalah-content.js` (NEW - need to create)
**Files:** 31 files
**Special Features:**
- Sefirot card extraction
- Hebrew text handling (RTL)
- Divine name parsing
- 288 Sparks angel grid

**Key HTML Structures:**
- `.sefirah-card` - Tree of Life emanations
- `.celestial-card` - Angels/demons
- `.hebrew` - RTL Hebrew text
- `.name-card` - Divine name permutations

**Critical:** Test Hebrew encoding preservation

**Sample Files to Test:**
- `mythos/jewish/kabbalah/angels.html`
- `mythos/jewish/kabbalah/concepts.html`
- `mythos/jewish/kabbalah/physics-integration.html`

**Command:**
```bash
# Test
node scripts/parse-kabbalah-content.js --dry-run --page mythos/jewish/kabbalah/angels.html

# Migrate
node scripts/parse-kabbalah-content.js --mythology jewish --path kabbalah
```

---

### 🎨 BATCH 5: SVG Graphics (2-3 hours)
**Parser:** `extract-svg-graphics.js` (NEW - need to create)
**Files:** 1-2 files + embedded SVGs

**Process:**
1. Find all `.svg` files
2. Extract embedded `<svg>` tags from HTML
3. Upload to Firebase Storage (`/graphics/`)
4. Update asset documents with URLs

**Dependencies:**
```bash
npm install @google-cloud/storage --save
```

**Command:**
```bash
node scripts/extract-svg-graphics.js --scan
node scripts/extract-svg-graphics.js --extract
node scripts/extract-svg-graphics.js --upload
```

---

## Parser Files to Create

### 1. `scripts/parse-sacred-texts.js`
**Purpose:** Extract scripture references and parallels
**Complexity:** Medium
**Dev Time:** 2 hours

### 2. `scripts/parse-gnostic-content.js`
**Purpose:** Parse Gnostic theological structures
**Complexity:** High
**Dev Time:** 3 hours

### 3. `scripts/parse-kabbalah-content.js`
**Purpose:** Handle Kabbalah mystical content + Hebrew
**Complexity:** Very High
**Dev Time:** 3 hours

### 4. `scripts/extract-svg-graphics.js`
**Purpose:** Extract and upload SVG files
**Complexity:** Medium
**Dev Time:** 2 hours

**Total Development Time:** 10 hours

---

## Testing Checklist

### Before Each Batch

- [ ] Run dry-run on 3-5 sample files
- [ ] Verify JSON output structure
- [ ] Check special field extraction
- [ ] Test validation rules
- [ ] Review error patterns

### During Migration

- [ ] Monitor progress in real-time
- [ ] Check error log periodically
- [ ] Verify document count in Firestore
- [ ] Spot-check random assets

### After Each Batch

- [ ] Validate all uploaded documents
- [ ] Test asset display in UI
- [ ] Verify cross-references work
- [ ] Check search functionality
- [ ] Review quality metrics

---

## Quality Targets

| Metric | Target | Critical? |
|--------|--------|-----------|
| Parse Success Rate | 95%+ | ✅ Yes |
| Validation Pass Rate | 90%+ | ✅ Yes |
| Data Completeness | 85%+ | ⚠️ Medium |
| Avg Panels/Asset | 3+ | ⚠️ Medium |
| Cross-Reference Integrity | 95%+ | ✅ Yes |

---

## Emergency Commands

### Stop Migration
```bash
pkill -f migrate-to-firebase
```

### Check Progress
```bash
cat migration-progress.json | jq '.stats'
```

### View Errors
```bash
tail -f migration-errors.log
```

### Delete Bad Batch
```javascript
// In Firebase Console or script
const batch = db.batch();
const badAssets = await db.collection('assets')
  .where('migratedAt', '>', failureTimestamp)
  .get();
badAssets.forEach(doc => batch.delete(doc.ref));
await batch.commit();
```

### Restore Backup
```bash
gcloud firestore import gs://eyes-of-azrael-backups/backup-[timestamp]
```

---

## File Paths Reference

### Specialized Content Locations

**Gnostic:**
```
mythos/christian/gnostic/*.html (37 files)
```

**Kabbalah:**
```
mythos/jewish/kabbalah/*.html (31 files)
mythos/jewish/kabbalah/physics/*.html
mythos/jewish/kabbalah/names/*.html
```

**Sacred Texts:**
```
mythos/christian/texts/revelation/*.html (32 files)
mythos/christian/texts/revelation/parallels/*.html
mythos/jewish/texts/*.html
mythos/hindu/texts/*.html
```

**SVG Graphics:**
```
mythos/egyptian/theories/thorium_decay_chain.svg
[Embedded in HTML files]
```

---

## Configuration Updates Needed

### `migration-config.js`

Add to `panelTypes`:
```javascript
panelTypes: {
  // ... existing ...
  aeon: '.aeon-card',
  gnostic: '.gnostic-topic-card',
  sefirah: '.sefirah-card',
  celestial: '.celestial-card',
  quote: '.quote-card'
}
```

Add to `assetTypePatterns`:
```javascript
assetTypePatterns: {
  // ... existing ...
  text: ['/texts/', '/scriptures/', '/books/', '/revelation/'],
  concept: ['/concepts/', '/teachings/', '/theology/', '/gnostic/', '/kabbalah/']
}
```

---

## Timeline Summary

| Week | Tasks | Hours |
|------|-------|-------|
| **Week 1** | Simple content + Sacred texts | 8h |
| **Week 2** | Gnostic + Kabbalah parsers | 12h |
| **Week 3** | Graphics + Cleanup + Testing | 6h |
| **Total** | | **26h** |

---

## Risk Mitigation

### High Risk: Hebrew Text Corruption
**Mitigation:** UTF-8 encoding, RTL testing, validation suite

### High Risk: Complex Nested Structures
**Mitigation:** Preserve HTML in richContent, manual validation

### Medium Risk: Broken Cross-References
**Mitigation:** Extract all links, validation script, reference index

### Low Risk: SVG Quality
**Mitigation:** Before/after testing, preserve originals

---

## Success Criteria

### Phase 2 Complete When:

- ✅ All 420 files migrated to Firestore
- ✅ 95%+ parse success rate achieved
- ✅ All specialized parsers tested and working
- ✅ SVG graphics extracted and accessible
- ✅ Cross-references validated
- ✅ Frontend displays all content correctly
- ✅ Search indexes updated
- ✅ Documentation updated

---

## Next Steps

1. **Review this plan** - Get approval to proceed
2. **Install dependencies** - `npm install @google-cloud/storage`
3. **Start Batch 1** - Migrate simple content (quick win)
4. **Develop parsers** - Create specialized parsers in parallel
5. **Execute batches 2-5** - Sequential with testing
6. **Final validation** - Comprehensive quality check

---

**Document:** Quick Reference Guide
**Companion:** `PHASE_2_MIGRATION_PLAN.md` (full details)
**Created:** December 13, 2024
**Status:** Ready for execution
