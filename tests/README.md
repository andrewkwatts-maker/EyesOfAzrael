# Firebase Integration Tests - Quick Start Guide

This directory contains comprehensive testing tools for the Eyes of Azrael Firebase integration.

## 📁 Test Files

| File | Purpose | Type |
|------|---------|------|
| `firebase-integration-tests.html` | Automated test runner with visual UI | Automated |
| `firebase-test-suite.js` | Test implementations (31 tests) | Automated |
| `performance-tests.html` | Performance monitoring and quota tracking | Performance |
| `test-data.json` | Sample test data (10 theories, 10 users) | Data |
| `README.md` | This file - Quick start guide | Documentation |

## 🚀 Quick Start

### 1. Prerequisites

Before running tests, ensure:

- ✅ Firebase project created and configured
- ✅ `firebase-config.js` exists in root directory
- ✅ Security rules deployed (`firebase deploy --only firestore:rules,storage:rules`)
- ✅ Google Authentication enabled in Firebase Console
- ✅ Web browser with JavaScript enabled

### 2. Verify Firebase Setup

First, verify Firebase is properly configured:

```bash
# Create a simple HTML file to run verification
# See ../scripts/verify-firebase-setup.js for implementation
```

Or open browser console on any page with Firebase loaded and check:
```javascript
console.log('Firebase loaded:', typeof firebase !== 'undefined');
console.log('Firebase app:', firebase.apps.length > 0);
console.log('Firestore:', !!firebase.firestore);
console.log('Storage:', !!firebase.storage);
console.log('Auth:', !!firebase.auth);
```

### 3. Run Automated Tests

**Option A: Open directly in browser**
```
1. Open: tests/firebase-integration-tests.html
2. Sign in with Google (for authenticated tests)
3. Click "Run All Tests" button
4. Review results in the visual report
```

**Option B: Via local server** (recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Then open: http://localhost:8000/tests/firebase-integration-tests.html
```

### 4. Run Performance Tests

```
1. Open: tests/performance-tests.html
2. Click "Run All Performance Tests"
3. Review metrics:
   - Load times
   - Query performance
   - Quota usage
   - Optimization recommendations
```

### 5. Manual Testing

Follow the comprehensive checklist:
```
1. Open: ../FIREBASE_TESTING_CHECKLIST.md
2. Work through each section systematically
3. Check off completed items
4. Document any issues found
```

## 📊 Test Coverage

### Automated Tests (31 total)

**Firebase Initialization** (5 tests)
- ✅ Firebase SDK loaded
- ✅ Firebase app initialized
- ✅ Firestore available
- ✅ Storage available
- ✅ Auth available

**Authentication** (3 tests)
- ✅ Auth state detection
- 🔒 User profile structure (requires auth)
- 🔒 Session persistence (requires auth)

**Firestore Operations** (7 tests)
- 🔒 Create theory (requires auth)
- 🔒 Read theory by ID (requires auth)
- 🔒 Update own theory (requires auth)
- 🔒 Delete own theory (requires auth)
- ✅ Query published theories
- ✅ Filter theories by topic
- ✅ Public read access

**Voting & Comments** (4 tests)
- 🔒 Add vote (requires auth)
- 🔒 Remove vote (requires auth)
- 🔒 Add comment (requires auth)
- 🔒 Delete own comment (requires auth)

**Storage Operations** (5 tests)
- 🔒 Upload image (requires auth)
- 🔒 Get download URL (requires auth)
- 🔒 Delete image (requires auth)
- 🔒 File size validation (requires auth)
- 🔒 File type validation (requires auth)

**Security Rules** (4 tests)
- 🔒 Cannot edit other user's theory (requires 2 accounts)
- 🔒 Cannot delete other user's theory (requires 2 accounts)
- 🔒 Cannot upload to other user's folder (requires 2 accounts)
- ✅ Public can read without login

**Error Handling** (3 tests)
- ✅ Handle network errors
- 🔒 Handle invalid data (requires auth)
- 🔒 Handle missing required fields (requires auth)

**Legend:**
- ✅ = Runs without authentication
- 🔒 = Requires Google Sign-In

### Manual Tests (277 checks)

See `../FIREBASE_TESTING_CHECKLIST.md` for complete list organized in 15 categories.

## 🔍 Understanding Test Results

### Automated Test Results

**Test Status Indicators:**
- ✅ **PASS** (Green) - Test completed successfully
- ❌ **FAIL** (Red) - Test failed, review error message
- ⊘ **SKIP** (Orange) - Test skipped (usually requires auth)
- ⏳ **RUNNING** (Blue) - Test currently executing

**Summary Metrics:**
- **Total Tests**: Number of tests defined
- **Passed**: Tests that completed successfully
- **Failed**: Tests that encountered errors
- **Skipped**: Tests that couldn't run (missing prerequisites)

**What to do if tests fail:**

1. **Check Firebase Configuration**
   - Verify `firebase-config.js` has correct credentials
   - Ensure all required services enabled in Firebase Console

2. **Check Security Rules**
   - Run `firebase deploy --only firestore:rules,storage:rules`
   - Verify rules allow public read for published theories

3. **Check Authentication**
   - Sign in with Google for auth-required tests
   - Verify Google Auth provider enabled

4. **Check Browser Console**
   - Open DevTools → Console
   - Look for error messages
   - Check Network tab for failed requests

### Performance Test Results

**Color Coding:**
- 🟢 **Good** (Green) - Excellent performance
  - Load times: < 500ms
  - Queries: < 300ms
- 🟡 **Warning** (Yellow) - Acceptable but could improve
  - Load times: 500ms - 2000ms
  - Queries: 300ms - 1000ms
- 🔴 **Bad** (Red) - Needs optimization
  - Load times: > 2000ms
  - Queries: > 1000ms

**Quota Metrics:**
- **Firestore Reads**: Should be < 50K/day for free tier
- **Firestore Writes**: Should be < 20K/day
- **Storage Downloads**: Should be < 1GB/day

## 🔧 Test Data

### Loading Sample Test Data

The `test-data.json` file contains 10 sample theories for testing. To import:

```javascript
// Open browser console on a page with Firebase loaded

fetch('tests/test-data.json')
  .then(r => r.json())
  .then(async data => {
    const db = firebase.firestore();

    // Import theories
    for (const theory of data.theories) {
      await db.collection('theories').doc(theory.id).set(theory);
      console.log(`Imported: ${theory.title}`);
    }

    console.log('All test data imported!');
  })
  .catch(err => console.error('Import failed:', err));
```

**Note:** This requires authentication and proper security rules.

### Test Data Contents

- **10 Theories** covering diverse topics:
  - Mythologies (Flood myths, Egyptian, Norse, Aztec)
  - Kabbalah (Quantum physics connections)
  - Occult Philosophy (Hermeticism, Alchemy)
  - Divination (Tarot, I Ching)
  - Sacred Geometry

- **10 Test Users** with unique profiles
- **Various Topics and Subtopics**
- **Realistic Vote/View Counts**
- **Rich Content** (panels, images, links, searches)

## 🐛 Troubleshooting

### Common Issues

#### "Firebase not initialized"
```
Cause: Firebase SDK not loaded or config missing
Fix:
1. Check firebase-config.js exists in root directory
2. Verify SDK scripts load before test scripts
3. Check browser console for initialization errors
```

#### "Permission denied" errors
```
Cause: Security rules not deployed or too restrictive
Fix:
1. Run: firebase deploy --only firestore:rules,storage:rules
2. Verify rules allow public read for published theories
3. Sign in for write operations
```

#### Tests timeout or hang
```
Cause: Network issues or Firebase quota exceeded
Fix:
1. Check internet connection
2. Verify Firebase quota in console
3. Try running fewer tests at once
4. Clear browser cache and reload
```

#### "Cannot read property of undefined"
```
Cause: Firebase service not available
Fix:
1. Check all Firebase SDK scripts loaded
2. Verify service enabled in Firebase Console
3. Check for typos in service names
```

### Getting Help

1. **Check Documentation**
   - `../FIREBASE_TESTING_STRATEGY.md` - Overall testing approach
   - `../FIREBASE_TESTING_CHECKLIST.md` - Manual testing guide
   - `../BACKEND_MIGRATION_PLAN.md` - Migration overview

2. **Check Firebase Console**
   - https://console.firebase.google.com
   - View errors, quota usage, security rules

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for error messages
   - Check Network tab for failed requests

4. **Check Security Rules**
   - Firestore rules: Firebase Console → Firestore → Rules
   - Storage rules: Firebase Console → Storage → Rules

## 📋 Testing Checklist

Before production deployment:

### Setup Phase
- [ ] Firebase project created
- [ ] All services enabled (Auth, Firestore, Storage)
- [ ] Security rules deployed
- [ ] `firebase-config.js` configured
- [ ] Google Auth provider enabled

### Testing Phase
- [ ] Setup verification passed (all green ✅)
- [ ] Automated tests passed (≥ 90% pass rate)
- [ ] Performance tests passed (all metrics acceptable)
- [ ] Manual checklist completed (277 items)
- [ ] Security tests passed
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete

### Documentation Phase
- [ ] Known issues documented
- [ ] User guide created
- [ ] API documentation updated
- [ ] Troubleshooting guide available

### Deployment Phase
- [ ] Monitoring setup (quota alerts, analytics)
- [ ] Backup strategy in place
- [ ] Rollback plan prepared
- [ ] Production deployment authorized

## 📈 Expected Test Results

### Healthy Test Suite

**Automated Tests:**
- Total: 31 tests
- Passed (without auth): ~10-12 tests
- Passed (with auth): ~25-28 tests
- Failed: 0 tests
- Skipped: 3-6 tests (auth required)

**Performance Tests:**
- Initial page load: 100-500ms (🟢 Good)
- Theory list (20 items): 500-1500ms (🟢 Good)
- Single theory: 200-800ms (🟢 Good)
- Image load average: 500-2000ms (🟢/🟡 Good/Warning)

**Quota Usage (per test run):**
- Firestore reads: 20-50 reads
- Firestore writes: 5-10 writes
- Storage downloads: 0-5 downloads

### When to Worry

**Red Flags:**
- ❌ More than 2-3 automated tests failing
- ❌ Any security test failures
- ❌ Page load times > 5 seconds
- ❌ Quota usage exceeding daily limits in testing
- ❌ Console showing multiple errors
- ❌ Critical features not working (login, submit, view)

**Yellow Flags:**
- ⚠️ Performance in "warning" range (yellow)
- ⚠️ Some tests skipped (usually OK if auth-related)
- ⚠️ Quota usage approaching 50% in testing
- ⚠️ Minor UI glitches or cosmetic issues

## 🔄 Test Maintenance

### When to Re-Run Tests

**Always:**
- After any code changes
- Before production deployment
- After Firebase config changes
- After security rule updates

**Periodically:**
- Weekly during active development
- Monthly after stable release
- After Firebase SDK updates
- When adding new features

### Updating Tests

When adding new features:
1. Add automated test to `firebase-test-suite.js`
2. Add manual checks to `../FIREBASE_TESTING_CHECKLIST.md`
3. Update performance benchmarks if needed
4. Document expected behavior

## 📞 Support Resources

### Firebase Documentation
- [Web Setup](https://firebase.google.com/docs/web/setup)
- [Firestore](https://firebase.google.com/docs/firestore)
- [Storage](https://firebase.google.com/docs/storage)
- [Auth](https://firebase.google.com/docs/auth)
- [Security Rules](https://firebase.google.com/docs/rules)

### Project Documentation
- Testing Strategy: `../FIREBASE_TESTING_STRATEGY.md`
- Testing Checklist: `../FIREBASE_TESTING_CHECKLIST.md`
- Migration Plan: `../BACKEND_MIGRATION_PLAN.md`

### Tools
- Firebase Console: https://console.firebase.google.com
- Firebase CLI Docs: https://firebase.google.com/docs/cli
- Browser DevTools: F12 (Chrome/Firefox/Edge)

---

**Happy Testing! 🧪**

For questions or issues, refer to the comprehensive documentation in the project root directory.
