# 🚨 SECURITY FIX - API Key Exposure

**Issue:** Firebase API key exposed in `test-search-page.html` in commit `6c819b49`

**Status:** ✅ COMPLETE - Git history cleaned on 2025-12-28

---

## What Was Exposed

**File:** `test-search-page.html`
**Commit:** `6c819b49` (2025-12-28)
**Key Found:** `AIzaSyDk0jFt5s8b3pFa6OuBvYJN1Fq7xd3qWsI`

**Note:** This appears to be a TEST key (different from production), but should still be removed from git history.

---

## Files Containing Firebase Config (Expected)

These files SHOULD have Firebase config (public keys):
1. `firebase-config.js` - Main config (public, safe)
2. `BACKUP_PRE_MIGRATION/firebase-config.js` - Backup (same key)
3. `FIREBASE/content-viewer.html` - Older implementation

These are OK because:
- Firebase API keys are meant to be public in client-side apps
- Security is handled by Firebase Security Rules, not key secrecy
- The exposed key in test file appears to be a different TEST key

---

## Immediate Actions Required

### 1. Delete Test File from Working Directory

```bash
git rm test-search-page.html
git commit -m "Remove test file with exposed API key"
```

### 2. Remove from Git History (CRITICAL)

**Option A: Using git filter-repo (Recommended)**

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove file from entire history
git filter-repo --path test-search-page.html --invert-paths

# Force push (THIS REWRITES HISTORY!)
git push origin main --force
```

**Option B: Using BFG Repo-Cleaner**

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files test-search-page.html

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin main --force
```

###3. Verify Key is Invalidated

**Check Firebase Console:**
1. Go to Firebase Console → Project Settings → General
2. Verify the exposed key: `AIzaSyDk0jFt5s8b3pFa6OuBvYJN1Fq7xd3qWsI`
3. If it matches your PRODUCTION key → **REGENERATE IT IMMEDIATELY**
4. If it's a test/old key → Still good to invalidate

**To Rotate Firebase Web API Key:**
- Unfortunately, Firebase doesn't allow rotating web API keys directly
- Instead, restrict the key using:
  - Firebase Console → APIs & Services → Credentials
  - Set HTTP referrer restrictions to only your domain
  - Enable only required APIs

---

## Prevention Measures

### 1. Update .gitignore

```bash
# Add to .gitignore
test-*.html
*-test.html
serviceAccountKey.json
**/firebase-adminsdk-*.json
.env
.env.local
*.key
*.pem
```

### 2. Add Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
# Check for potential secrets before commit

if git diff --cached | grep -E 'AIzaSy[A-Za-z0-9_-]{33}'; then
    echo "❌ ERROR: Firebase API key detected in staged files!"
    echo "   Remove the key before committing."
    exit 1
fi

if git diff --cached | grep -E '"apiKey"\s*:\s*"AIzaSy'; then
    echo "⚠️  WARNING: Firebase config detected."
    echo "   Make sure this is intentional (firebase-config.js is OK)."
fi
```

### 3. Use Environment Variables for Tests

Instead of hardcoding in test files:

```javascript
// test-search-page.html - WRONG
const firebaseConfig = {
  apiKey: "AIzaSyDk0jFt5s8b3pFa6OuBvYJN1Fq7xd3qWsI",  // ❌ EXPOSED
  // ...
};

// CORRECT - Use existing config
import { firebaseConfig } from './firebase-config.js';

// OR for tests, use mock config
const firebaseConfig = {
  apiKey: "MOCK_KEY_FOR_TESTING",
  projectId: "test-project",
  // ...
};
```

---

## Security Assessment

### Risk Level: 🟡 MEDIUM

**Why not HIGH?**
- Firebase web API keys are designed to be public
- Security is enforced by Firebase Security Rules
- The exposed key appears to be a test key (different from main config)

**Why MEDIUM?**
- Still best practice to remove from git history
- Exposed keys can be used for quota exhaustion attacks
- May reveal project structure/IDs

### What an Attacker CAN'T Do
- ❌ Read/write data (protected by Security Rules)
- ❌ Access server-side resources
- ❌ Impersonate users
- ❌ Access private keys

### What an Attacker CAN Do
- ✅ Make API requests that count toward quota
- ✅ See your Firebase project ID
- ✅ View public Security Rules

---

## Verification Steps

After cleanup:

```bash
# 1. Verify file is removed from history
git log --all --full-history -- test-search-page.html
# Should return empty

# 2. Search entire repo for the key
grep -r "AIzaSyDk0jFt5s8b3pFa6OuBvYJN1Fq7xd3qWsI" .
# Should only find this guide

# 3. Check remote
git ls-remote origin
# Verify force push succeeded

# 4. Clone fresh copy to test
cd /tmp
git clone https://github.com/andrewkwatts-maker/EyesOfAzrael.git
cd EyesOfAzrael
grep -r "AIzaSyDk0jFt5s8b3pFa6OuBvYJN1Fq7xd3qWsI" .
# Should find nothing
```

---

## Post-Fix Checklist

- [x] Remove `test-search-page.html` from working directory (Completed: commit b830d01e)
- [x] Remove file from git history using git-filter-repo (Completed: 2025-12-28)
- [x] Force push to remote (Completed: 2025-12-28)
- [x] Verify file is gone from GitHub web interface (Verified)
- [ ] Check if key needs rotation in Firebase Console
- [ ] Update .gitignore to prevent future leaks
- [ ] Add pre-commit hook for secret detection
- [x] Update documentation (this file) (Completed: 2025-12-28)
- [ ] Inform team members to re-clone repository

---

## Firebase Security Rules Check

Verify your Firestore Security Rules are restrictive:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ✅ GOOD - Requires authentication
    match /deities/{deity} {
      allow read: if true;  // Public read OK
      allow write: if request.auth != null;  // Auth required
    }

    // ❌ BAD - Anyone can write
    match /submissions/{submission} {
      allow read, write: if true;  // TOO OPEN!
    }
  }
}
```

---

## References

- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/api-keys)
- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

**Created:** 2025-12-28
**Priority:** HIGH
**Action Required:** YES - Within 24 hours
