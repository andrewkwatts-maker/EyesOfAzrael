# Cleanup Quick Reference Card

## 📊 Numbers at a Glance

| Category | Before | After | Change |
|----------|--------|-------|--------|
| **Total Files** | 500 | 124 | -76% ↓ |
| Markdown | 377 | 10 | -97% ↓ |
| JSON | 56 | 8 | -86% ↓ |
| HTML | 67 | 20 | -70% ↓ |

## 🎯 What Gets Deleted/Archived?

### Deleted (44 files)
- `test-*.html` - All test pages
- `demo-*.html` - All demo pages
- `index-old-*.html` - Old backups
- Legacy development files

### Archived (376 files)
- `AGENT*.md` - Agent reports → `docs/archive/agent-reports/`
- `*MIGRATION*.md` - Migration docs → `docs/archive/migration-reports/`
- `*COMPLETE*.md` - Completion reports → `docs/archive/completion-reports/`
- `batch*.json` - Legacy JSON → `docs/archive/legacy-json/`

## 🎯 What Stays in Root?

### Essential Config (8)
```
✅ package.json
✅ firebase.json
✅ manifest.json
✅ .gitignore
✅ firestore.indexes.json
✅ .firebaserc
✅ package-lock.json
✅ _headers
```

### Production HTML (20)
```
✅ index.html                 # Main site
✅ dashboard.html             # User dashboard
✅ search-advanced.html       # Advanced search
✅ admin-upload.html          # Admin tools
✅ about.html, terms.html     # Public pages
✅ login.html                 # Authentication
✅ 404.html, 500.html         # Error pages
+ 11 more production pages
```

### Current Docs (10)
```
✅ README.md                          # New
✅ FIREBASE_FIX_MASTER_SUMMARY.md     # Current system
✅ SESSION_COMPLETION_2025-12-27.md   # Recent work
✅ CLEANUP_PLAN.md                    # This cleanup
+ 6 more current docs
```

## 🚀 Execution Commands

### Setup
```bash
mkdir -p docs/archive/{agent-reports,migration-reports,completion-reports,legacy-json,legacy-html}
mkdir -p docs/{architecture,guides,features,monitoring}
```

### Archive Reports
```bash
git mv AGENT*.md docs/archive/agent-reports/
git mv *MIGRATION*.md *BATCH*.md *PHASE*.md docs/archive/migration-reports/
git mv *COMPLETE*.md *COMPLETION*.md *POLISH*.md docs/archive/completion-reports/
```

### Delete Test Files
```bash
git rm test-*.html demo-*.html index-old-*.html index_old_*.html
git rm shader-test.html performance-test.html firebase-data-verification.html
```

### Archive Legacy JSON
```bash
git mv batch*.json *MIGRATION*.json *REPORT*.json docs/archive/legacy-json/
```

## ⚠️ Safety Checks

Before executing:
- [ ] Review file lists in CLEANUP_PLAN.json
- [ ] Verify no active links to deleted files
- [ ] Create feature branch: `cleanup/root-directory-cleanup`
- [ ] Ensure git history is clean

After executing:
- [ ] Test index.html loads
- [ ] Test dashboard.html works
- [ ] Test admin-upload.html functions
- [ ] Test search-advanced.html works
- [ ] Firebase deploy succeeds
- [ ] No console errors

## 📁 New Structure

```
root/
├── 📋 Config (8 files)
├── 🌐 HTML (20 files)
├── 📄 Docs (10 files)
└── docs/
    ├── archive/ (420 files)
    ├── architecture/ (6 files)
    ├── guides/ (15 files)
    ├── features/ (25 files)
    └── monitoring/ (4 files)
```

## 🎬 Quick Start

```bash
# 1. Create branch
git checkout -b cleanup/root-directory-cleanup

# 2. Run setup
mkdir -p docs/archive/{agent-reports,migration-reports,completion-reports,legacy-json}

# 3. Archive files (see commands above)

# 4. Test
firebase serve

# 5. Commit
git add .
git commit -m "Clean up root directory - archive 376 files, delete 44 test files"

# 6. Push & PR
git push origin cleanup/root-directory-cleanup
```

## 📞 Support

- **Detailed Plan:** CLEANUP_PLAN.md
- **Visual Guide:** CLEANUP_VISUAL_SUMMARY.md
- **File Lists:** CLEANUP_PLAN.json
- **Summary:** CLEANUP_SUMMARY.md

## ✅ Go/No-Go Decision

**GO IF:**
- ✅ Git history is clean
- ✅ No uncommitted changes
- ✅ Backup exists
- ✅ Time available (~4 hours)
- ✅ Can test thoroughly after

**NO-GO IF:**
- ❌ Uncommitted critical work
- ❌ Production deployment pending
- ❌ Unsure about any file
- ❌ No time for testing
- ❌ No backup

---

**Current Status:** Ready for Review & Approval
**Estimated Time:** 4 hours
**Risk Level:** LOW
**Recommendation:** ✅ PROCEED
