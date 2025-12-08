# Quick Testing Checklist

**Date**: _________
**Tester**: _________
**Browser**: _________

---

## Pre-Test Setup

- [ ] HTTP server running on port 8000
- [ ] Firebase Console open (https://console.firebase.google.com/project/eyesofazrael)
- [ ] Signed in with Google account
- [ ] Browser DevTools open (F12) on Console tab

---

## Test Each Content Type

### Instructions:
1. Go to: http://localhost:8000/theories/user-submissions/submit.html
2. Select content type from dropdown
3. Verify correct fields appear
4. Fill in required fields (use test data from SUBMISSION_TESTING_GUIDE.md)
5. Submit form
6. Check Firebase Console > Firestore > theories collection
7. Mark checkbox when verified

---

### Content Types

| # | Type | Fields Appear? | Submit Success? | In Firestore? | Notes |
|---|------|----------------|-----------------|---------------|-------|
| 1 | 💡 Theory | [ ] | [ ] | [ ] | |
| 2 | ⚡ Deity | [ ] | [ ] | [ ] | Check `assetMetadata.deity` |
| 3 | 🦸 Hero | [ ] | [ ] | [ ] | Check `assetMetadata.hero` |
| 4 | 🐉 Creature | [ ] | [ ] | [ ] | Check `assetMetadata.creature` |
| 5 | 🏛️ Place | [ ] | [ ] | [ ] | Check `assetMetadata.place` |
| 6 | 💭 Concept | [ ] | [ ] | [ ] | Check `assetMetadata.concept` |
| 7 | 🕯️ Ritual | [ ] | [ ] | [ ] | Check `assetMetadata.ritual` ⭐ NEW |
| 8 | ✨ Magic | [ ] | [ ] | [ ] | Check `assetMetadata.magic` ⭐ NEW |
| 9 | 🌿 Herb | [ ] | [ ] | [ ] | Check `assetMetadata.herb` |
| 10 | ☥ Symbol | [ ] | [ ] | [ ] | Check `assetMetadata.symbol` ⭐ NEW |
| 11 | 📜 Text | [ ] | [ ] | [ ] | Check `assetMetadata.text` |
| 12 | 🔮 Archetype | [ ] | [ ] | [ ] | Check `assetMetadata.archetype` ⭐ NEW |
| 13 | ⚔️ Item | [ ] | [ ] | [ ] | Check `assetMetadata.item` |
| 14 | 🌌 Cosmology | [ ] | [ ] | [ ] | Check `assetMetadata.cosmology` ⭐ NEW |
| 15 | 👥 Lineage | [ ] | [ ] | [ ] | Check `assetMetadata.lineage` ⭐ NEW |
| 16 | ⚔️ Event | [ ] | [ ] | [ ] | Check `assetMetadata.event` ⭐ NEW |
| 17 | 🌍 Mythology | [ ] | [ ] | [ ] | Check `assetMetadata.mythology` ⭐ NEW |

---

## Common Fields to Verify

For **every** submission, check Firestore document has:

- [ ] `id` field (format: `user_[timestamp]_[random]`)
- [ ] `contributionType` matches selected type
- [ ] `title` captured correctly
- [ ] `summary` captured correctly
- [ ] `content` captured correctly
- [ ] `authorId` is your Firebase UID
- [ ] `authorName` is your display name
- [ ] `authorEmail` is your email
- [ ] `status` is "draft" or "published"
- [ ] `createdAt` is a Timestamp
- [ ] `updatedAt` is a Timestamp
- [ ] `votes.score` = 0
- [ ] `votes.upvotes` = 0
- [ ] `votes.downvotes` = 0

---

## Issues Found

| Content Type | Issue Description | Severity | Fixed? |
|--------------|-------------------|----------|--------|
| | | | [ ] |
| | | | [ ] |
| | | | [ ] |
| | | | [ ] |

**Severity**: High / Medium / Low

---

## Test Results Summary

**Total Tested**: _____ / 17
**Successful**: _____
**Failed**: _____
**Issues Found**: _____

**Overall Status**: ✅ PASS / ⚠️ ISSUES / ❌ FAIL

---

## Notes

```
[Add any observations, recommendations, or additional notes here]







```

---

## Next Steps

After completing all tests:

- [ ] Review all issues found
- [ ] Prioritize fixes (high severity first)
- [ ] Update form validation if needed
- [ ] Retest failed items
- [ ] Document any UX improvements needed
- [ ] Proceed to building content reading/display system

---

## Quick Commands

**Start HTTP Server**:
```bash
cd H:/Github/EyesOfAzrael
python -m http.server 8000
```

**Check Firestore Indexes**:
```bash
firebase firestore:indexes
```

**View Firebase Console**:
- Firestore: https://console.firebase.google.com/project/eyesofazrael/firestore
- Auth: https://console.firebase.google.com/project/eyesofazrael/authentication
- Storage: https://console.firebase.google.com/project/eyesofazrael/storage

---

**💡 Tip**: Keep Firebase Console open in a separate window so you can immediately see new documents appear after submission!
