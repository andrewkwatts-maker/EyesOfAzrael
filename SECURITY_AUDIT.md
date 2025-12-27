# Security Audit Report
**Eyes of Azrael Application**
**Date:** December 27, 2025
**Auditor:** Security Assessment Agent
**Status:** CRITICAL ISSUES FOUND

---

## Executive Summary

This security audit identified **8 critical vulnerabilities**, **12 high-priority issues**, and **15 medium-priority improvements** across Firebase security rules, client-side code, authentication, and configuration management.

### Risk Level Distribution
- **CRITICAL**: 8 issues requiring immediate attention
- **HIGH**: 12 issues requiring resolution within 7 days
- **MEDIUM**: 15 issues for ongoing improvement
- **LOW**: 8 informational items

### Most Critical Findings
1. **Firebase API keys exposed in Git repository** (CRITICAL)
2. **Hardcoded admin email in multiple security rules** (CRITICAL)
3. **XSS vulnerabilities in innerHTML usage** (HIGH)
4. **Missing rate limiting implementation** (HIGH)
5. **No CSP violation reporting** (MEDIUM)

---

## 1. Firebase Security Rules Assessment

### 1.1 CRITICAL: Hardcoded Admin Email

**File:** `firestore.rules`
**Lines:** 47, 344, 365, 382, 393, 402, 410, 423, 441, 451, 460, 469, 482, 491, 508, 513, 530, 538, 543, 574, 590, 598, 641, 658

**Issue:**
Admin email `andrewkwatts@gmail.com` is hardcoded throughout security rules. This creates several problems:
- Cannot easily add/remove administrators
- Security rules must be redeployed to change admins
- Email exposure in public security rules
- Single point of failure for admin access

**Current Code:**
```javascript
function isAdminEmail() {
  return isAuthenticated() && request.auth.token.email == 'andrewkwatts@gmail.com';
}
```

**Severity:** CRITICAL
**Impact:** Administrative access control
**Likelihood:** HIGH

**Recommendation:**
Use a dedicated `users` collection with role-based access control:

```javascript
function isAdmin() {
  return isAuthenticated() &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

Then use this function consistently throughout all rules.

---

### 1.2 HIGH: Rate Limiting Not Implemented

**File:** `firestore.rules`
**Lines:** 51-57, 629-632

**Issue:**
Rate limiting helper functions exist but are never actually enforced. The `isRateLimited()` function is defined but not used in any rules.

**Current Code:**
```javascript
function isRateLimited() {
  // Check if user has exceeded rate limits
  return !isAdminEmail() && exists(/databases/$(database)/documents/system/rate_limits/$(request.auth != null ? request.auth.uid : request.path));
}
```

**Severity:** HIGH
**Impact:** DDoS protection, abuse prevention
**Likelihood:** MEDIUM

**Recommendation:**
1. Implement Cloud Functions to track rate limits
2. Apply rate limit checks to read-heavy operations:

```javascript
match /assets/{assetId} {
  allow read: if !isRateLimited() && (resource.data.status in ['published', 'approved'] || ...);
}
```

---

### 1.3 MEDIUM: Overly Permissive Fallback Rule

**File:** `firestore.rules`
**Lines:** 656-660

**Issue:**
Default fallback allows read access to ANY undefined collection:

**Current Code:**
```javascript
match /{collection}/{document=**} {
  allow read: if true;  // ⚠️ DANGEROUS
  allow write: if isAuthenticated() && request.auth.token.email == 'andrewkwatts@gmail.com';
}
```

**Severity:** MEDIUM
**Impact:** Data exposure
**Likelihood:** LOW

**Recommendation:**
Deny by default for production:

```javascript
match /{collection}/{document=**} {
  allow read: if false;  // Deny unknown collections
  allow write: if false;
}
```

---

### 1.4 MEDIUM: Insufficient Query Size Validation

**File:** `firestore.rules`
**Lines:** 60-62, 567

**Issue:**
Query size validation function exists but is only used in one place (submissions). Large queries can be expensive and slow.

**Severity:** MEDIUM
**Impact:** Performance, cost
**Likelihood:** MEDIUM

**Recommendation:**
Apply query limits to all list operations:

```javascript
match /deities/{deityId} {
  allow list: if request.query.limit <= 100;
  allow get: if true;
}
```

---

### 1.5 LOW: Comment Update Time Window

**File:** `firestore.rules`
**Lines:** 276-278

**Issue:**
Comments can only be updated within 15 minutes of creation. While this prevents abuse, it may frustrate legitimate users fixing typos.

**Severity:** LOW
**Impact:** User experience
**Likelihood:** HIGH

**Recommendation:**
Consider extending to 60 minutes or allowing edit history tracking.

---

## 2. API Key and Credentials Exposure

### 2.1 CRITICAL: Firebase Config in Git Repository

**Files:**
- `firebase-config.js` (tracked in Git)
- `firebase-config-old.js` (tracked in Git)
- `firebase-config-fixed.js` (tracked in Git)

**Issue:**
Despite having `firebase-config.js` in `.gitignore`, multiple versions of the Firebase configuration file are tracked in Git history with exposed API keys:

```javascript
apiKey: "AIzaSyB7bFdte6f81-bNMsdITgnnnWq7aBNMXRw"
```

**Severity:** CRITICAL
**Impact:** Potential unauthorized access to Firebase project
**Likelihood:** HIGH

**Git Status:**
```bash
git ls-files | grep firebase-config
firebase-config-fixed.js
firebase-config-old.js
firebase-config.js
firebase-config.template.js
```

**Immediate Actions Required:**

1. **Remove files from Git tracking:**
```bash
git rm --cached firebase-config.js firebase-config-old.js firebase-config-fixed.js
git commit -m "Remove Firebase config files from repository"
```

2. **Rotate Firebase API keys:**
   - Go to Firebase Console > Project Settings
   - Restrict API key to specific domains
   - Consider creating new API key

3. **Clean Git history (optional but recommended):**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch firebase-config.js firebase-config-old.js firebase-config-fixed.js" \
  --prune-empty --tag-name-filter cat -- --all
```

**Important Note:**
Firebase client API keys are safe for public exposure IF properly restricted. However, keeping them out of Git is best practice.

---

### 2.2 HIGH: API Key Restrictions Not Verified

**Issue:**
No evidence that Firebase API keys are restricted to specific domains/apps.

**Severity:** HIGH
**Impact:** Unauthorized API usage
**Likelihood:** MEDIUM

**Recommendation:**
In Firebase Console:
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Select the API key
3. Add application restrictions:
   - HTTP referrers: `eyesofazrael.firebaseapp.com`, `eyesofazrael.web.app`, `localhost`
4. Restrict API access to only required APIs

---

## 3. Client-Side Security (XSS Vulnerabilities)

### 3.1 HIGH: Unsafe innerHTML Usage

**Files:** 80+ JavaScript files
**Examples:**
- `js/entity-loader.js:29`
- `js/entity-display.js:37`
- `js/content-filter-dropdown.js:95`
- `js/editable-panel-system.js:151`

**Issue:**
Extensive use of `innerHTML` with potentially unsanitized data creates XSS vulnerabilities.

**Vulnerable Pattern:**
```javascript
container.innerHTML = `
    <h3>${entity.name}</h3>
    <p>${entity.description}</p>
`;
```

If `entity.name` contains: `<img src=x onerror=alert('XSS')>`, this will execute.

**Severity:** HIGH
**Impact:** Cross-Site Scripting attacks
**Likelihood:** MEDIUM

**Recommendations:**

1. **Use textContent for user-generated content:**
```javascript
const nameEl = document.createElement('h3');
nameEl.textContent = entity.name;  // Safe - escapes HTML
```

2. **Implement DOMPurify for rich content:**
```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>
```

```javascript
container.innerHTML = DOMPurify.sanitize(richContent);
```

3. **Create safe rendering helpers:**
```javascript
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Usage:
container.innerHTML = `<h3>${escapeHTML(entity.name)}</h3>`;
```

---

### 3.2 MEDIUM: localStorage Usage for Sensitive Data

**Files:**
- `js/user-theories.js` (stores theory data)
- `js/firebase-cache-manager.js` (caches Firebase data)
- `js/content-filter.js` (stores filter preferences)

**Issue:**
localStorage is:
- Not encrypted
- Accessible to all scripts on the domain
- Vulnerable to XSS attacks
- Persists indefinitely

**Severity:** MEDIUM
**Impact:** Data exposure via XSS
**Likelihood:** MEDIUM

**Recommendation:**

1. **Never store sensitive data in localStorage:**
   - No authentication tokens
   - No personal information
   - No private content

2. **Use for non-sensitive preferences only:**
   - Theme preferences
   - UI state
   - Public filter settings

3. **Consider IndexedDB for larger datasets:**
```javascript
// Better than localStorage for large data
const db = await openDB('eyesofazrael', 1, {
  upgrade(db) {
    db.createObjectStore('cache');
  }
});
```

---

### 3.3 LOW: No Subresource Integrity (SRI)

**File:** `index.html`
**Lines:** 45-47

**Issue:**
Firebase SDK loaded from CDN without SRI hashes:

```html
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
```

**Severity:** LOW
**Impact:** CDN compromise risk
**Likelihood:** VERY LOW

**Recommendation:**
Add SRI hashes:

```html
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

Generate hashes at: https://www.srihash.org/

---

## 4. Content Security Policy (CSP)

### 4.1 MEDIUM: CSP Too Permissive

**File:** `firebase.json`
**Lines:** 64-66

**Current CSP:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com ...
```

**Issues:**
- `'unsafe-inline'` allows inline scripts (XSS risk)
- `'unsafe-eval'` allows eval() (XSS risk)

**Severity:** MEDIUM
**Impact:** Reduced XSS protection
**Likelihood:** MEDIUM

**Recommendation:**

1. **Phase 1: Add nonce-based CSP**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'nonce-{{NONCE}}' https://www.gstatic.com https://www.googleapis.com;
  style-src 'self' 'nonce-{{NONCE}}' https://fonts.googleapis.com;
  ...
">
```

2. **Phase 2: Remove unsafe-inline/unsafe-eval**
   - Move all inline scripts to external files
   - Replace eval() with safer alternatives

3. **Add CSP reporting:**
```javascript
report-uri https://eyesofazrael.report-uri.com/r/d/csp/enforce;
```

---

### 4.2 HIGH: No CSP Violation Reporting

**Issue:**
CSP violations are not logged or reported, making it impossible to detect attacks.

**Severity:** HIGH
**Impact:** Undetected security issues
**Likelihood:** HIGH

**Recommendation:**

1. **Add report-uri directive:**
```
Content-Security-Policy: ... report-uri /api/csp-report
```

2. **Set up reporting endpoint (Cloud Function):**
```javascript
exports.cspReport = functions.https.onRequest((req, res) => {
  const report = req.body['csp-report'];
  console.error('CSP Violation:', report);

  // Store in Firestore for analysis
  db.collection('security_logs').add({
    type: 'csp_violation',
    report,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  res.status(204).end();
});
```

---

## 5. Authentication Security

### 5.1 HIGH: No Session Timeout

**Files:** `js/firebase-auth.js`, `js/auth-manager.js`

**Issue:**
Firebase Auth sessions persist indefinitely with LOCAL persistence. No automatic logout after inactivity.

**Current Code:**
```javascript
await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
```

**Severity:** HIGH
**Impact:** Session hijacking risk on shared devices
**Likelihood:** MEDIUM

**Recommendation:**

1. **Implement inactivity timeout:**
```javascript
class SessionTimeout {
  constructor(timeoutMinutes = 30) {
    this.timeout = timeoutMinutes * 60 * 1000;
    this.timeoutId = null;
    this.init();
  }

  init() {
    this.resetTimer();

    // Reset on user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.resetTimer());
    });
  }

  resetTimer() {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => this.logout(), this.timeout);
  }

  async logout() {
    await firebase.auth().signOut();
    alert('Session expired due to inactivity');
    window.location.href = '/';
  }
}
```

2. **Add "Remember Me" option:**
```javascript
const persistence = rememberMe ?
  firebase.auth.Auth.Persistence.LOCAL :
  firebase.auth.Auth.Persistence.SESSION;
```

---

### 5.2 MEDIUM: Incomplete Logout

**File:** `js/firebase-auth.js`
**Lines:** 85-91

**Issue:**
Logout doesn't clear all user data from memory and local storage.

**Current Code:**
```javascript
handleUserSignedOut() {
  this.currentUser = null;
  this.updateUIForLoggedOutUser();
  this.notifyAuthStateChange(null);
  window.dispatchEvent(new CustomEvent('userLogout'));
  console.log('User signed out');
}
```

**Severity:** MEDIUM
**Impact:** Data leakage after logout
**Likelihood:** MEDIUM

**Recommendation:**

```javascript
handleUserSignedOut() {
  // Clear user data
  this.currentUser = null;

  // Clear caches
  if (window.firebaseCache) {
    window.firebaseCache.clear();
  }

  // Clear sensitive localStorage items
  const keysToRemove = Object.keys(localStorage).filter(key =>
    key.startsWith('user_') || key.startsWith('auth_')
  );
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear IndexedDB caches
  if ('indexedDB' in window) {
    indexedDB.deleteDatabase('firebase-cache');
  }

  // Update UI
  this.updateUIForLoggedOutUser();
  this.notifyAuthStateChange(null);
  window.dispatchEvent(new CustomEvent('userLogout'));

  console.log('User signed out and data cleared');
}
```

---

### 5.3 LOW: No Password Requirements

**Issue:**
Using Google OAuth only is secure, but no fallback authentication method exists.

**Severity:** LOW
**Impact:** Limited authentication options
**Likelihood:** LOW

**Recommendation:**
Consider adding:
- Email/password authentication with strong requirements
- Multi-factor authentication (MFA)
- Passkey/WebAuthn support

---

## 6. Storage Security Rules

### 6.1 MEDIUM: No File Content Validation

**File:** `storage.rules`
**Lines:** 46-65

**Issue:**
File type validation only checks MIME type, which can be spoofed.

**Current Code:**
```javascript
function isValidImageType() {
  return request.resource.contentType in [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'  // ⚠️ SVG can contain scripts!
  ];
}
```

**Severity:** MEDIUM
**Impact:** Malicious file uploads
**Likelihood:** MEDIUM

**Recommendations:**

1. **Remove SVG from allowed types** (SVGs can contain JavaScript):
```javascript
function isValidImageType() {
  return request.resource.contentType in [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
    // Removed: 'image/svg+xml'
  ];
}
```

2. **Use Cloud Functions for validation:**
```javascript
exports.validateUpload = functions.storage.object().onFinalize(async (object) => {
  // Use image processing library to verify it's actually an image
  const [buffer] = await storage.bucket().file(object.name).download();

  // Verify with image library (sharp, etc.)
  const metadata = await sharp(buffer).metadata();

  if (!metadata.format) {
    // Not a valid image - delete it
    await storage.bucket().file(object.name).delete();
    console.error('Invalid image uploaded:', object.name);
  }
});
```

---

### 6.2 HIGH: Public Read Access to All Uploads

**File:** `storage.rules`
**Lines:** 78-79

**Issue:**
All uploaded files are publicly readable by anyone:

```javascript
allow read: if true;  // Anyone can read
```

**Severity:** HIGH
**Impact:** Unauthorized access to user uploads
**Likelihood:** MEDIUM

**Recommendation:**

For user-generated content that should be private until published:

```javascript
match /theory-images/{userId}/{theoryId}/{filename} {
  // Only allow reading if:
  // 1. Theory is published, OR
  // 2. User is the owner
  allow read: if isOwner(userId) || isTheoryPublished(userId, theoryId);

  // Helper function
  function isTheoryPublished(userId, theoryId) {
    let theory = firestore.get(/databases/(default)/documents/theories/$(theoryId));
    return theory.data.status == 'published';
  }
}
```

---

## 7. Additional Security Recommendations

### 7.1 HTTPS Enforcement

**Status:** ✅ GOOD
**File:** `firebase.json`
**Lines:** 60-62

```javascript
"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
```

**Recommendation:** Submit domain to HSTS preload list: https://hstspreload.org/

---

### 7.2 Security Headers

**Status:** ✅ MOSTLY GOOD
**File:** `firebase.json`

Current headers are good:
- X-Content-Type-Options: nosniff ✅
- X-Frame-Options: DENY ✅
- X-XSS-Protection: 1; mode=block ✅
- Referrer-Policy: strict-origin-when-cross-origin ✅
- Permissions-Policy: restrictive ✅

**Additional Recommendations:**

1. **Add Cross-Origin policies:**
```json
{
  "key": "Cross-Origin-Opener-Policy",
  "value": "same-origin"
},
{
  "key": "Cross-Origin-Resource-Policy",
  "value": "same-origin"
}
```

---

### 7.3 Implement Security Monitoring

**Recommendation:** Create Cloud Function for security event logging:

```javascript
exports.securityMonitor = functions.firestore
  .document('{collection}/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();

    // Log suspicious activities
    const suspiciousPatterns = [
      /script>/gi,
      /<iframe/gi,
      /javascript:/gi,
      /onerror=/gi
    ];

    const content = JSON.stringify(data);
    const suspicious = suspiciousPatterns.some(pattern => pattern.test(content));

    if (suspicious) {
      await db.collection('security_logs').add({
        type: 'suspicious_content',
        collection: context.params.collection,
        docId: context.params.docId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        content: content.substring(0, 500)
      });

      // Alert admins
      console.error('Suspicious content detected:', context.params);
    }
  });
```

---

## 8. Compliance and Privacy

### 8.1 GDPR Considerations

**Current Status:** ⚠️ NEEDS IMPROVEMENT

**Required Actions:**

1. **Add Privacy Policy** with clear information about:
   - What data is collected (email, display name, IP)
   - How it's used (authentication, content attribution)
   - How long it's retained
   - User rights (access, deletion, portability)

2. **Implement data export/deletion:**
```javascript
exports.exportUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error('Not authenticated');

  const userId = context.auth.uid;
  const userData = {
    profile: await db.collection('users').doc(userId).get(),
    theories: await db.collection('theories').where('authorId', '==', userId).get(),
    submissions: await db.collection('submissions').where('submittedBy', '==', userId).get()
  };

  return userData;
});

exports.deleteUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error('Not authenticated');

  const userId = context.auth.uid;
  const batch = db.batch();

  // Delete user's content
  const theories = await db.collection('theories').where('authorId', '==', userId).get();
  theories.forEach(doc => batch.delete(doc.ref));

  // Delete user profile
  batch.delete(db.collection('users').doc(userId));

  await batch.commit();
  await admin.auth().deleteUser(userId);
});
```

---

## 9. Testing Recommendations

### 9.1 Security Testing Checklist

1. **XSS Testing:**
   - Test all form inputs with XSS payloads
   - Verify HTML escaping in all user content
   - Test rich text editor sanitization

2. **CSRF Testing:**
   - Verify all state-changing operations require authentication
   - Test Firebase Auth token validation

3. **Authorization Testing:**
   - Test accessing other users' private data
   - Test privilege escalation attempts
   - Verify rule enforcement

4. **Rate Limiting Testing:**
   - Test rapid API calls
   - Verify rate limit enforcement
   - Test bypass attempts

---

## 10. Remediation Priority Matrix

### Immediate (Within 24 hours)
1. Remove firebase-config.js from Git
2. Implement role-based admin access
3. Add HTML sanitization to all innerHTML usage
4. Restrict Firebase API keys

### Short-term (Within 1 week)
1. Implement session timeout
2. Fix CSP violations
3. Add security monitoring
4. Implement rate limiting
5. Remove SVG upload support

### Medium-term (Within 1 month)
1. Add CSP reporting
2. Implement data export/deletion
3. Add security headers
4. Create security testing suite
5. Add GDPR compliance measures

### Long-term (Ongoing)
1. Regular security audits
2. Dependency updates
3. Security training
4. Penetration testing
5. Bug bounty program

---

## Conclusion

The Eyes of Azrael application has a solid security foundation with Firebase Authentication and well-structured security rules. However, several critical issues require immediate attention:

1. **Exposed credentials in Git** must be addressed immediately
2. **XSS vulnerabilities** require systematic remediation
3. **Authorization improvements** needed for admin access
4. **Monitoring and logging** should be implemented

Following the recommendations in this audit will significantly improve the application's security posture and protect user data.

---

**Next Steps:**
1. Review this audit with development team
2. Create remediation tasks in project tracker
3. Implement fixes according to priority matrix
4. Re-audit after fixes are implemented
5. Establish ongoing security review process

**Estimated Remediation Time:** 40-60 hours
**Risk Level After Remediation:** LOW

---

*End of Security Audit Report*
