# Security Hardening Checklist
**Eyes of Azrael Application**

This checklist provides a step-by-step guide to implementing all security recommendations from the security audit.

---

## Critical Priority (Complete within 24 hours)

### 1. Remove Firebase Config from Git Repository

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Steps:**

```bash
# 1. Remove files from Git tracking
cd H:\Github\EyesOfAzrael
git rm --cached firebase-config.js
git rm --cached firebase-config-old.js
git rm --cached firebase-config-fixed.js

# 2. Commit the removal
git commit -m "Security: Remove Firebase config files from repository"

# 3. Verify they're no longer tracked
git ls-files | grep firebase-config
# Should only show: firebase-config.template.js

# 4. Push changes
git push origin main
```

**Optional: Clean Git History**
```bash
# WARNING: This rewrites Git history - coordinate with team first!
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch firebase-config.js firebase-config-old.js firebase-config-fixed.js" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

**Verification:**
- [ ] Files removed from current commit
- [ ] .gitignore contains `firebase-config.js`
- [ ] Only template file is tracked

---

### 2. Implement Role-Based Admin Access

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**A. Create Initial Admin User**

In Firebase Console:
1. Go to Firestore Database
2. Navigate to `users` collection
3. Find your user document (by UID)
4. Add field: `role: "admin"`

**B. Deploy Hardened Security Rules**

```bash
# Backup current rules
cp firestore.rules firestore.rules.backup

# Use hardened version
cp firestore.rules.hardened firestore.rules

# Deploy
firebase deploy --only firestore:rules

# Test rules in Firebase Console > Rules Playground
```

**C. Update Client Code (if needed)**

Review and update any code that checks admin status:

```javascript
// OLD (don't use)
if (user.email === 'andrewkwatts@gmail.com') { ... }

// NEW (use this)
async function isAdmin(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.exists && userDoc.data().role === 'admin';
}
```

**Verification:**
- [ ] Admin user has `role: "admin"` in Firestore
- [ ] Hardened rules deployed
- [ ] Admin functions work correctly
- [ ] Non-admin users cannot access admin features

---

### 3. Restrict Firebase API Keys

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Steps:**

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Select your Firebase project
3. Navigate to APIs & Services > Credentials
4. Click on your API key (starts with AIzaSy...)
5. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add:
     - `eyesofazrael.firebaseapp.com/*`
     - `eyesofazrael.web.app/*`
     - `localhost:*` (for development)
     - `127.0.0.1:*` (for development)
6. Under "API restrictions":
   - Select "Restrict key"
   - Enable only:
     - Cloud Firestore API
     - Firebase Installations API
     - Token Service API
     - Identity Toolkit API
7. Click "Save"

**Verification:**
- [ ] API key restrictions configured
- [ ] App works from allowed domains
- [ ] App blocked from unauthorized domains

---

### 4. Add HTML Sanitization

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**A. Add DOMPurify Library**

Add to `index.html` (before other scripts):

```html
<!-- Add after Firebase SDK -->
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"
        integrity="sha384-5hTxMw4QXKu3qY7y1y0D3YnFPJtl6txp/w+3bZPuGQN9f0pPvJJvEWdZfv5L3xU7"
        crossorigin="anonymous"></script>
```

**B. Create Sanitization Helper**

Create `js/utils/sanitize.js`:

```javascript
/**
 * HTML Sanitization Utilities
 * Prevents XSS attacks
 */

const SanitizeUtils = {
  /**
   * Escape HTML special characters
   */
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Sanitize rich HTML content
   */
  sanitizeHTML(html) {
    if (!html) return '';
    if (typeof DOMPurify === 'undefined') {
      console.error('DOMPurify not loaded');
      return this.escapeHTML(html);
    }
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'],
      ALLOWED_ATTR: ['href', 'title', 'target'],
      ALLOW_DATA_ATTR: false
    });
  },

  /**
   * Safe innerHTML setter
   */
  setInnerHTML(element, html) {
    element.innerHTML = this.sanitizeHTML(html);
  },

  /**
   * Safe text content setter (no HTML)
   */
  setTextContent(element, text) {
    element.textContent = text;
  }
};

// Export
window.SanitizeUtils = SanitizeUtils;
```

**C. Update Code to Use Sanitization**

Find and replace unsafe innerHTML usage:

```javascript
// BEFORE (unsafe)
container.innerHTML = `<h3>${entity.name}</h3>`;

// AFTER (safe)
container.innerHTML = `<h3>${SanitizeUtils.escapeHTML(entity.name)}</h3>`;

// OR for rich content
SanitizeUtils.setInnerHTML(container, entity.richDescription);
```

**Priority Files to Update:**
1. `js/entity-display.js`
2. `js/entity-loader.js`
3. `js/content-filter-dropdown.js`
4. `js/editable-panel-system.js`
5. `js/user-theories.js`

**Verification:**
- [ ] DOMPurify loaded
- [ ] Sanitization utility created
- [ ] User-generated content sanitized
- [ ] Test with XSS payloads (see testing section)

---

## High Priority (Complete within 7 days)

### 5. Implement Session Timeout

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Create:** `js/session-timeout.js`

```javascript
/**
 * Session Timeout Manager
 * Auto-logout after 30 minutes of inactivity
 */

class SessionTimeout {
  constructor(timeoutMinutes = 30) {
    this.timeout = timeoutMinutes * 60 * 1000;
    this.timeoutId = null;
    this.warningTimeoutId = null;
    this.init();
  }

  init() {
    // Reset timer on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), { passive: true });
    });

    // Start timer when user logs in
    window.addEventListener('userLogin', () => this.startTimer());

    // Clear timer when user logs out
    window.addEventListener('userLogout', () => this.clearTimer());

    // Start timer if user already logged in
    if (window.firebaseAuth && window.firebaseAuth.isLoggedIn()) {
      this.startTimer();
    }
  }

  startTimer() {
    this.resetTimer();
  }

  resetTimer() {
    // Clear existing timers
    clearTimeout(this.timeoutId);
    clearTimeout(this.warningTimeoutId);

    // Set warning timer (5 minutes before logout)
    this.warningTimeoutId = setTimeout(() => {
      this.showWarning();
    }, this.timeout - (5 * 60 * 1000));

    // Set logout timer
    this.timeoutId = setTimeout(() => {
      this.logout();
    }, this.timeout);
  }

  clearTimer() {
    clearTimeout(this.timeoutId);
    clearTimeout(this.warningTimeoutId);
  }

  showWarning() {
    if (window.ToastNotification) {
      window.ToastNotification.warning(
        'Session expiring soon',
        'Your session will expire in 5 minutes due to inactivity. Move your mouse to stay logged in.'
      );
    } else {
      console.warn('Session expiring in 5 minutes');
    }
  }

  async logout() {
    if (window.firebaseAuth && window.firebaseAuth.isLoggedIn()) {
      await window.firebaseAuth.signOut();

      if (window.ToastNotification) {
        window.ToastNotification.info(
          'Session expired',
          'You were automatically logged out due to inactivity.'
        );
      } else {
        alert('Session expired due to inactivity. Please log in again.');
      }

      // Redirect to home
      window.location.href = '/';
    }
  }
}

// Initialize
window.sessionTimeout = new SessionTimeout(30); // 30 minutes
```

**Add to index.html:**
```html
<script src="js/session-timeout.js"></script>
```

**Verification:**
- [ ] Session timeout initializes on login
- [ ] Warning shows at 25 minutes
- [ ] Logout occurs at 30 minutes
- [ ] Activity resets timer

---

### 6. Improve Logout Security

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Update:** `js/firebase-auth.js`

```javascript
/**
 * Enhanced handleUserSignedOut with complete data clearing
 */
handleUserSignedOut() {
  // Clear user data
  this.currentUser = null;

  // Clear Firebase cache
  if (window.firebaseCache) {
    window.firebaseCache.clearAll();
  }

  // Clear sensitive localStorage items
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('user_') ||
      key.startsWith('auth_') ||
      key.startsWith('firebase_') ||
      key.includes('token') ||
      key.includes('session')
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear IndexedDB caches
  if ('indexedDB' in window) {
    const dbsToDelete = ['firebase-cache', 'firebaseLocalStorageDb'];
    dbsToDelete.forEach(dbName => {
      indexedDB.deleteDatabase(dbName);
    });
  }

  // Clear service worker caches (if any)
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('user') || name.includes('auth')) {
          caches.delete(name);
        }
      });
    });
  }

  // Update UI
  this.updateUIForLoggedOutUser();
  this.notifyAuthStateChange(null);
  window.dispatchEvent(new CustomEvent('userLogout'));

  console.log('User signed out and all data cleared');
}
```

**Verification:**
- [ ] localStorage cleared on logout
- [ ] sessionStorage cleared on logout
- [ ] IndexedDB cleared on logout
- [ ] No user data persists after logout

---

### 7. Add CSP Violation Reporting

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**A. Update CSP Header in firebase.json**

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googleapis.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com; frame-src 'self' https://*.firebaseapp.com; object-src 'none'; base-uri 'self'; form-action 'self'; report-uri /api/csp-report;"
}
```

**B. Create Cloud Function for CSP Reporting**

Create `functions/csp-report.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.cspReport = functions.https.onRequest(async (req, res) => {
  // Handle CSP violation reports
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const report = req.body['csp-report'] || req.body;

    // Log to console
    console.error('CSP Violation:', JSON.stringify(report, null, 2));

    // Store in Firestore for analysis
    await admin.firestore().collection('system').doc('security_logs').collection('csp_violations').add({
      report,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    // If this looks like an attack, increment counter
    if (report['violated-directive'] &&
        (report['violated-directive'].includes('script-src') ||
         report['blocked-uri']?.includes('javascript:'))) {
      await admin.firestore().collection('system').doc('metrics').set({
        csp_violations: admin.firestore.FieldValue.increment(1),
        last_violation: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error processing CSP report:', error);
    res.status(500).send('Internal error');
  }
});
```

**C. Deploy Cloud Function**

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:cspReport
```

**Verification:**
- [ ] CSP header includes report-uri
- [ ] Cloud Function deployed
- [ ] Test violations are logged
- [ ] Check Firestore for violation reports

---

### 8. Harden Storage Rules

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Update:** `storage.rules`

```javascript
// Remove SVG from allowed types
function isValidImageType() {
  return request.resource.contentType in [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
    // REMOVED: 'image/svg+xml' (can contain scripts)
  ];
}

// IMPROVED: Conditional read access
match /theory-images/{userId}/{theoryId}/{filename} {
  allow read: if isPublished(userId, theoryId) || isOwner(userId);

  allow create, update: if isOwner(userId)
                        && isImage()
                        && isWithinSizeLimit()
                        && isValidImageType();

  allow delete: if isOwner(userId);

  function isPublished(userId, theoryId) {
    let theory = firestore.get(/databases/(default)/documents/theories/$(theoryId));
    return theory != null && theory.data.status == 'published';
  }
}
```

**Deploy:**
```bash
firebase deploy --only storage
```

**Verification:**
- [ ] SVG uploads blocked
- [ ] Only published theory images are public
- [ ] Private theories' images are protected

---

## Medium Priority (Complete within 30 days)

### 9. Implement Rate Limiting (Cloud Functions)

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

Create `functions/rate-limiter.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const RATE_LIMITS = {
  anonymous: { reads: 50, writes: 10, window: 3600 }, // per hour
  user: { reads: 500, writes: 100, window: 3600 },
  admin: { reads: -1, writes: -1, window: 0 } // unlimited
};

exports.checkRateLimit = functions.firestore
  .document('{collection}/{docId}')
  .onWrite(async (change, context) => {
    const userId = context.auth?.uid || 'anonymous';
    const collection = context.params.collection;

    // Skip system collections
    if (collection === 'system') return;

    // Get user role
    let userRole = 'anonymous';
    if (userId !== 'anonymous') {
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      userRole = userDoc.exists ? (userDoc.data().role || 'user') : 'user';
    }

    // Admin bypass
    if (userRole === 'admin') return;

    // Check rate limit
    const limits = RATE_LIMITS[userRole];
    const limitKey = `rate_limits/${userId}`;
    const limitRef = admin.firestore().doc(limitKey);

    const now = Date.now();
    const limitDoc = await limitRef.get();

    if (limitDoc.exists) {
      const data = limitDoc.data();
      const windowStart = data.windowStart.toMillis();
      const elapsed = now - windowStart;

      // Reset window if expired
      if (elapsed > limits.window * 1000) {
        await limitRef.set({
          reads: change.after.exists ? 1 : 0,
          writes: change.after.exists ? 0 : 1,
          windowStart: admin.firestore.Timestamp.now()
        });
        return;
      }

      // Check limits
      const reads = data.reads || 0;
      const writes = data.writes || 0;

      if ((change.after.exists && reads >= limits.reads) ||
          (!change.after.exists && writes >= limits.writes)) {

        // Rate limit exceeded - log and potentially block
        console.warn(`Rate limit exceeded for ${userId}`);

        // Update limit doc with exceeded flag
        await limitRef.update({
          exceeded: true,
          lastExceeded: admin.firestore.Timestamp.now()
        });

        return;
      }

      // Increment counter
      await limitRef.update({
        reads: admin.firestore.FieldValue.increment(change.after.exists ? 1 : 0),
        writes: admin.firestore.FieldValue.increment(change.after.exists ? 0 : 1)
      });
    } else {
      // First request in window
      await limitRef.set({
        reads: change.after.exists ? 1 : 0,
        writes: change.after.exists ? 0 : 1,
        windowStart: admin.firestore.Timestamp.now(),
        exceeded: false
      });
    }
  });
```

**Deploy:**
```bash
firebase deploy --only functions:checkRateLimit
```

**Verification:**
- [ ] Rate limiting function deployed
- [ ] Test with rapid requests
- [ ] Verify limits enforced
- [ ] Check rate_limits collection

---

### 10. Add Security Monitoring

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

Create `functions/security-monitor.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Suspicious patterns to detect
const SUSPICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe/gi,
  /javascript:/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /eval\(/gi,
  /atob\(/gi,
  /fromCharCode/gi
];

exports.securityMonitor = functions.firestore
  .document('{collection}/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const collection = context.params.collection;
    const docId = context.params.docId;

    // Skip system collections
    if (collection === 'system') return;

    // Convert data to string for pattern matching
    const content = JSON.stringify(data);

    // Check for suspicious patterns
    const matches = [];
    SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(content)) {
        matches.push(pattern.toString());
      }
    });

    if (matches.length > 0) {
      // Log suspicious content
      console.error('Suspicious content detected:', {
        collection,
        docId,
        matches,
        userId: data.authorId || data.createdBy || data.submittedBy || 'unknown'
      });

      // Store in security logs
      await admin.firestore().collection('system').doc('security_logs').collection('suspicious_content').add({
        collection,
        docId,
        matches,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: data.authorId || data.createdBy || data.submittedBy || null,
        contentPreview: content.substring(0, 500)
      });

      // Alert admins (implement email/notification as needed)
      // TODO: Send notification to admin
    }
  });
```

**Deploy:**
```bash
firebase deploy --only functions:securityMonitor
```

**Verification:**
- [ ] Security monitor function deployed
- [ ] Test with suspicious content
- [ ] Check security_logs collection
- [ ] Verify alerts working

---

### 11. Add GDPR Compliance Features

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

Create `functions/gdpr.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Export all user data (GDPR right to data portability)
 */
exports.exportUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const db = admin.firestore();

  try {
    const userData = {
      profile: null,
      theories: [],
      submissions: [],
      comments: [],
      votes: [],
      bookmarks: []
    };

    // Get user profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      userData.profile = { id: userDoc.id, ...userDoc.data() };
    }

    // Get user's theories
    const theoriesSnapshot = await db.collection('theories')
      .where('authorId', '==', userId).get();
    userData.theories = theoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get user's submissions
    const submissionsSnapshot = await db.collection('submissions')
      .where('submittedBy', '==', userId).get();
    userData.submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get user's comments
    const commentsSnapshot = await db.collection('comments')
      .where('authorId', '==', userId).get();
    userData.comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get user's votes
    const votesSnapshot = await db.collection('votes')
      .where('userId', '==', userId).get();
    userData.votes = votesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get user's bookmarks
    const bookmarksSnapshot = await db.collection('bookmarks')
      .where('userId', '==', userId).get();
    userData.bookmarks = bookmarksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return userData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to export user data');
  }
});

/**
 * Delete all user data (GDPR right to erasure)
 */
exports.deleteUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const db = admin.firestore();
  const batch = db.batch();

  try {
    // Delete theories
    const theoriesSnapshot = await db.collection('theories')
      .where('authorId', '==', userId).get();
    theoriesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete submissions
    const submissionsSnapshot = await db.collection('submissions')
      .where('submittedBy', '==', userId).get();
    submissionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete comments
    const commentsSnapshot = await db.collection('comments')
      .where('authorId', '==', userId).get();
    commentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete votes
    const votesSnapshot = await db.collection('votes')
      .where('userId', '==', userId).get();
    votesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete bookmarks
    const bookmarksSnapshot = await db.collection('bookmarks')
      .where('userId', '==', userId).get();
    bookmarksSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete user profile
    batch.delete(db.collection('users').doc(userId));

    // Commit batch
    await batch.commit();

    // Delete Firebase Auth account
    await admin.auth().deleteUser(userId);

    return { success: true, message: 'All user data deleted successfully' };
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user data');
  }
});
```

**Deploy:**
```bash
firebase deploy --only functions:exportUserData,functions:deleteUserData
```

**Add UI for GDPR Features:**

Create buttons in user dashboard:

```javascript
// In dashboard.html or user settings
async function exportMyData() {
  const exportData = functions.httpsCallable('exportUserData');
  const result = await exportData();

  // Download as JSON
  const dataStr = JSON.stringify(result.data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `eyesofazrael-data-${Date.now()}.json`;
  link.click();
}

async function deleteMyAccount() {
  if (!confirm('Are you sure? This will permanently delete all your data and cannot be undone.')) {
    return;
  }

  const secondConfirm = prompt('Type DELETE to confirm account deletion:');
  if (secondConfirm !== 'DELETE') {
    alert('Account deletion cancelled');
    return;
  }

  const deleteData = functions.httpsCallable('deleteUserData');
  await deleteData();

  alert('Your account and all data have been permanently deleted.');
  window.location.href = '/';
}
```

**Verification:**
- [ ] Export function works
- [ ] Delete function works
- [ ] All user data is removed
- [ ] Firebase Auth account deleted

---

## Testing Checklist

### XSS Testing

Test these payloads in all user input fields:

```javascript
const XSS_TEST_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(XSS)">',
  '<svg/onload=alert("XSS")>',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<img src="x" onerror="eval(atob(\'YWxlcnQoIlhTUyIp\'))">',
  '<div style="background:url(javascript:alert(\'XSS\'))">',
];
```

**Test in:**
- [ ] Theory titles
- [ ] Theory content
- [ ] Comments
- [ ] User bio
- [ ] Entity names
- [ ] Descriptions

**Expected Result:** All payloads should be escaped/sanitized

---

### Authorization Testing

- [ ] Non-admin cannot access admin functions
- [ ] Users cannot edit others' content
- [ ] Users cannot delete others' content
- [ ] Private data is not readable by others
- [ ] Rate limits apply to non-admins

---

### Session Testing

- [ ] Session expires after 30 minutes of inactivity
- [ ] Warning shows at 25 minutes
- [ ] Activity resets timer
- [ ] Logout clears all data

---

## Deployment Checklist

Before deploying security fixes:

- [ ] Review all changes
- [ ] Test in local emulator
- [ ] Test in Firebase Console Rules Playground
- [ ] Deploy to staging/test environment first
- [ ] Verify no breaking changes
- [ ] Monitor error logs after deployment
- [ ] Have rollback plan ready

---

## Monitoring

After deployment, monitor:

- [ ] Firebase Console > Security Rules > Usage
- [ ] Cloud Functions logs for errors
- [ ] CSP violation reports
- [ ] Security logs collection
- [ ] Rate limit enforcement
- [ ] User reports of access issues

---

## Documentation

- [ ] Update README with security practices
- [ ] Document admin procedures
- [ ] Create incident response plan
- [ ] Document GDPR compliance features
- [ ] Add security section to developer docs

---

**End of Security Hardening Checklist**
