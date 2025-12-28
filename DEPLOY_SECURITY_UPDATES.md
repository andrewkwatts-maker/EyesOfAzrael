# Deploy Security Updates - Quick Start
**Eyes of Azrael Firebase Security**

## 🚀 Quick Deploy (3 Steps)

### Step 1: Review Changes
```bash
# See what will be deployed
git diff firestore.rules firestore.indexes.json
```

**Expected:**
- `firestore.rules`: Fixed parentheses on line 165-167
- `firestore.indexes.json`: Added 3 new indexes

### Step 2: Deploy
```bash
# Deploy security rules and indexes
firebase deploy --only firestore
```

**Expected Output:**
```
✔  Deploy complete!
Firestore Rules: firestore.rules
Firestore Indexes: 3 new indexes created
```

### Step 3: Verify
```bash
# Check deployment status
firebase firestore:indexes:list
```

**Expected:** 8 total indexes (5 existing + 3 new)

---

## ✅ What Gets Deployed

### 1. Security Bug Fix
- **File:** `firestore.rules` (line 165-167)
- **Fix:** Added parentheses to ensure moderators pass validation
- **Impact:** Improved security (moderators can't bypass validation)

### 2. Performance Indexes (3 new)
- **Submissions Index:** Query user's pending/approved submissions
- **Theories Index:** Query user's published/draft theories
- **Assets Index:** Filter assets by type + mythology

---

## ⏱️ Timeline

**Deployment Time:** ~30 seconds
**Index Build Time:** 5-15 minutes
**Total Time:** ~15 minutes

**During Deployment:**
- Site remains online ✅
- No downtime ✅
- Existing queries work ✅

**After Deployment:**
- New indexes build in background
- Status shows "Building..." then "Enabled"
- New queries work once enabled

---

## 🧪 Test After Deploy (Optional)

### Test 1: Submissions Query
```javascript
// Should work after indexes enable
const mySubmissions = await db.collection('submissions')
  .where('submittedBy', '==', userId)
  .where('status', '==', 'pending')
  .orderBy('submittedAt', 'desc')
  .get();
```

### Test 2: Theories Query
```javascript
// Should work after indexes enable
const myTheories = await db.collection('theories')
  .where('authorId', '==', userId)
  .where('status', '==', 'published')
  .orderBy('createdAt', 'desc')
  .get();
```

### Test 3: Assets Query
```javascript
// Should work after indexes enable
const greekDeities = await db.collection('assets')
  .where('assetType', '==', 'deity')
  .where('mythology', '==', 'greek')
  .where('status', '==', 'published')
  .get();
```

**Before Indexes Enable:** May see "Index building" message
**After Indexes Enable:** Queries succeed instantly

---

## 📊 Check Status

### Firebase Console
1. Go to: https://console.firebase.google.com/project/eyesofazrael
2. Navigate to Firestore > Indexes
3. Wait for all 3 new indexes to show "Enabled"

### Command Line
```bash
# List all indexes
firebase firestore:indexes:list

# Should show:
# - 5 existing "entities" indexes
# - 1 new "submissions" index
# - 1 new "theories" index
# - 1 new "assets" index
```

---

## 🔄 Rollback (If Needed)

**If something goes wrong:**

```bash
# Backup current rules first
firebase firestore:rules:get > backup.rules

# Deploy old rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

**Note:** Indexes cannot be rolled back easily, but they don't break anything.

---

## 📚 Documentation

**Quick Reference:**
- `SECURITY_STATUS_SUMMARY.md` - Security scores and overview

**Detailed Analysis:**
- `FIREBASE_SECURITY_AUDIT.md` - Full audit report (18,000+ words)

**Deployment Guide:**
- `FIREBASE_SECURITY_DEPLOYMENT.md` - Detailed deployment procedures

**Changes Made:**
- `SECURITY_CHANGES_APPLIED.md` - Specific changes and why

---

## ❓ FAQ

### Q: Will this break my site?
**A:** No. Changes are additive (new indexes) and fixes (security logic). No breaking changes.

### Q: How long will deployment take?
**A:** 30 seconds to deploy, 5-15 minutes for indexes to build.

### Q: Can I deploy during business hours?
**A:** Yes. No downtime, site stays online.

### Q: What if indexes fail to build?
**A:** Check Firebase Console for error message. Indexes can be manually recreated.

### Q: Do I need to update my code?
**A:** No. These are backend changes only.

---

## 🎯 Summary

**What:** Security fix + 3 performance indexes
**When:** Deploy anytime (no downtime)
**How:** `firebase deploy --only firestore`
**Risk:** Low (fixes bug, improves performance)
**Time:** 15 minutes total

---

**Ready to deploy?** Run: `firebase deploy --only firestore`

**Questions?** See detailed docs in `FIREBASE_SECURITY_AUDIT.md`
