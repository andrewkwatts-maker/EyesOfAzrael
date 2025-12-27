# Quick Fix Reference Card

**Fast reference for fixing Firebase assets with missing fields**

---

## Quick Commands

```bash
# 1. See what needs fixing (no changes made)
node scripts/fix-firebase-assets.js --dry-run

# 2. Review the report
cat firebase-fixes/FIX_REPORT.md

# 3. Apply the fixes
node scripts/fix-firebase-assets.js

# 4. Validate fixes were applied
node scripts/validate-fixes.js
```

---

## What Gets Fixed

| Field | How It's Inferred | Confidence |
|-------|------------------|------------|
| `type` | From collection name (deities → deity) | High |
| `entityType` | From type field or collection name | High |
| `name` | From displayName, title, or ID | High-Low |
| `mythology` | From collection, related links, or title | High-Medium |
| `description` | From summary, display fields, or generated | High-Low |
| `summary` | From description (truncated) | High |
| `metadata.*` | Defaults (published, public) | High |

---

## Field Inference Examples

### Type
```javascript
Collection: "deities" → type: "deity"
Collection: "heroes" → type: "hero"
Collection: "creatures" → type: "creature"
```

### Name
```javascript
displayName: "⚡ Zeus" → name: "Zeus"
title: "Greek - Zeus" → name: "Zeus"
id: "sky-father" → name: "Sky Father"
```

### Mythology
```javascript
Collection: "christian" → mythology: "christian"
Link: "/mythos/greek/deities/zeus" → mythology: "greek"
Title: "Greek - Zeus" → mythology: "greek"
```

### Description
```javascript
summary: "Zeus is..." → description: "Zeus is..."
listDisplay.expandedContent: "..." → description: "..."
Generated: "{name} is a {type} in {mythology} mythology."
```

---

## Output Files

After dry run, check:

```
firebase-fixes/
├── FIX_REPORT.md          # ← Start here (human-readable)
├── FIX_SUMMARY.json       # Statistics
├── MASTER_FIXES.json      # All fixes (detailed)
└── fixes/
    └── {collection}-fixes.json  # Per-collection
```

After applying, check:

```
firebase-fixes/
├── VALIDATION_REPORT.md   # Did fixes work?
└── logs/
    └── change-log-*.json  # What changed
```

---

## Common Scenarios

### Fix One Collection Only

```bash
# Dry run on specific collection
node scripts/fix-firebase-assets.js --dry-run --collection=deities

# Apply to that collection
node scripts/fix-firebase-assets.js --collection=deities
```

### Check Most Critical Issues

```bash
# Run dry run
node scripts/fix-firebase-assets.js --dry-run

# Open report and go to "Top 20 Priority Fixes"
cat firebase-fixes/FIX_REPORT.md | grep -A 25 "Top 20 Priority"
```

### Validate Specific Collection

After applying fixes to a collection, check the validation report:

```bash
node scripts/validate-fixes.js
cat firebase-fixes/VALIDATION_REPORT.md
```

---

## Safety Checklist

- [ ] Run `--dry-run` first
- [ ] Review `FIX_REPORT.md`
- [ ] Check confidence levels (mostly high/medium?)
- [ ] Test on one collection first
- [ ] Validate after applying
- [ ] Keep change logs for rollback

---

## Confidence Levels

- **High** ✅ - Safe to apply automatically
- **Medium** ⚠️ - Probably correct, quick review
- **Low** ⚠️ - Best guess, needs verification

---

## Typical Workflow

```
┌─────────────────┐
│ Run Dry Run     │
│ (--dry-run)     │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Review Report   │
│ (FIX_REPORT.md) │
└────────┬────────┘
         ↓
    ┌────────┐
    │ Good?  │
    └───┬─┬──┘
        │ │
    No  │ │ Yes
        │ │
        ↓ ↓
┌───────┐ ┌────────────┐
│ Skip  │ │ Apply Fixes│
│ or Fix│ │            │
│Manual │ └─────┬──────┘
└───────┘       ↓
         ┌──────────────┐
         │ Validate     │
         │              │
         └──────────────┘
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Service account not found" | Add `firebase-service-account.json` to project root |
| "Permission denied" | Check Firestore permissions in Firebase console |
| Many low-confidence fixes | Review/fix high-priority assets manually first |
| Validation failures | Check `VALIDATION_REPORT.md` for specific issues |

---

## Quick Stats (Example)

After running dry run, you'll see:

```
Total Assets: 1234
Assets Needing Fixes: 890 (72%)
Total Fixes: 2345

Confidence:
  High: 1800 (77%)      ← Good!
  Medium: 400 (17%)     ← Review
  Low: 145 (6%)         ← Check carefully

Common Fixes:
  type: 421 fixes
  name: 380 fixes
  description: 350 fixes
```

---

## Need More Info?

See **FIREBASE_ASSET_FIX_GUIDE.md** for:
- Detailed field inference logic
- Customization options
- Collection-specific examples
- Complete workflow examples

---

**Quick Start:** `node scripts/fix-firebase-assets.js --dry-run`

**Last Updated:** 2025-12-27
