# Security Quick Reference Guide

This guide provides quick access to security functions and best practices for the Eyes of Azrael platform.

---

## Table of Contents

1. [Common Security Tasks](#common-security-tasks)
2. [XSS Prevention](#xss-prevention)
3. [Input Validation](#input-validation)
4. [Authentication Checks](#authentication-checks)
5. [File Upload Security](#file-upload-security)
6. [Security Configuration](#security-configuration)

---

## Common Security Tasks

### Escape User Input (Prevent XSS)

```javascript
// ALWAYS escape user-generated content before displaying
const safeText = SecurityHelpers.escapeHtml(userInput);
```

### Validate Entity ID

```javascript
// Before querying Firestore
if (!SecurityHelpers.isValidEntityId(entityId)) {
    throw new Error('Invalid entity ID');
}
```

### Sanitize File Name

```javascript
// Before saving file
const safeName = SecurityHelpers.sanitizeFileName(uploadedFile.name);
```

### Check Authentication

```javascript
// Before allowing edit/delete
if (!firebase.auth().currentUser) {
    showLoginPrompt();
    return;
}
```

---

## XSS Prevention

### Safe HTML Rendering

```javascript
// ❌ DANGEROUS - Never do this
element.innerHTML = userInput;

// ✅ SAFE - Use textContent
element.textContent = userInput;

// ✅ SAFE - Use escapeHtml helper
element.innerHTML = SecurityHelpers.escapeHtml(userInput);
```

### Safe Attribute Setting

```javascript
// ❌ DANGEROUS
element.setAttribute('title', userInput);

// ✅ SAFE
element.setAttribute('title', SecurityHelpers.escapeHtml(userInput));
```

### Safe URL Handling

```javascript
// ❌ DANGEROUS
link.href = userInput;

// ✅ SAFE
if (SecurityHelpers.isValidUrl(userInput)) {
    link.href = userInput;
} else {
    console.error('Invalid URL');
}
```

---

## Input Validation

### Email Validation

```javascript
if (!SecurityHelpers.isValidEmail(email)) {
    showError('Invalid email address');
    return;
}
```

### Content Length Validation

```javascript
const validation = SecurityHelpers.validateContentLength(content, 5000);
if (!validation.valid) {
    showError(validation.error);
    return;
}
```

### Required Field Validation

```javascript
if (!name || name.trim().length === 0) {
    showError('Name is required');
    return;
}
```

### Pattern Matching

```javascript
const usernamePattern = /^[a-zA-Z0-9_-]+$/;
if (!usernamePattern.test(username)) {
    showError('Invalid username format');
    return;
}
```

---

## Authentication Checks

### Require Authentication

```javascript
// Before state-changing operation
if (!firebase.auth().currentUser) {
    authGuard.showLoginPrompt('Please sign in to continue');
    return;
}
```

### Verify Ownership

```javascript
// Before allowing edit
const entity = await db.collection('deities').doc(id).get();
const currentUser = firebase.auth().currentUser;

if (entity.data().createdBy !== currentUser.uid) {
    showError('You do not have permission to edit this entity');
    return;
}
```

### Check Admin Privileges

```javascript
const currentUser = firebase.auth().currentUser;
const isAdmin = await currentUser.getIdTokenResult()
    .then(token => token.claims.admin === true);

if (!isAdmin) {
    showError('Admin privileges required');
    return;
}
```

---

## File Upload Security

### Validate File Upload

```javascript
const validation = SecurityHelpers.validateFileUpload(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
});

if (!validation.valid) {
    showError(validation.error);
    return;
}
```

### Generate Safe File Name

```javascript
const userId = firebase.auth().currentUser.uid;
const timestamp = Date.now();
const originalName = SecurityHelpers.sanitizeFileName(file.name);
const safeName = `${userId}_${timestamp}_${originalName}`;
```

---

## Security Configuration

### Content Security Policy

Add to Firebase Hosting `firebase.json`:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://www.gstatic.com https://www.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com; frame-src 'self' https://www.google.com; object-src 'none'"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ]
  }
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() &&
             request.auth.token.admin == true;
    }

    // Entities (deities, heroes, etc.)
    match /{collection}/{docId} {
      // Anyone can read
      allow read: if true;

      // Only authenticated users can create
      allow create: if isSignedIn() &&
                      request.resource.data.createdBy == request.auth.uid;

      // Only owner or admin can update
      allow update: if isOwner(resource.data.createdBy) ||
                      isAdmin();

      // Only owner or admin can delete
      allow delete: if isOwner(resource.data.createdBy) ||
                      isAdmin();
    }

    // User profiles
    match /users/{userId} {
      allow read: if true;
      allow write: if isOwner(userId);
    }
  }
}
```

---

## Security Checklist

Use this checklist before deploying new features:

### Input Handling
- [ ] All user input validated
- [ ] All user input sanitized
- [ ] Length limits enforced
- [ ] Special characters escaped

### Output Encoding
- [ ] HTML entities escaped
- [ ] No direct innerHTML with user data
- [ ] URLs validated before use
- [ ] JSON properly serialized

### Authentication
- [ ] Auth required for state changes
- [ ] Session timeout configured
- [ ] Password never logged
- [ ] Rate limiting implemented

### Authorization
- [ ] Ownership verified
- [ ] Permissions checked
- [ ] Admin privileges explicit
- [ ] Firestore rules configured

### File Uploads
- [ ] File type validated
- [ ] File size limited
- [ ] File name sanitized
- [ ] Double extensions checked

### Privacy
- [ ] PII anonymized in logs
- [ ] Do Not Track respected
- [ ] Data retention policy
- [ ] GDPR compliance

---

## Common Mistakes to Avoid

### ❌ Never Do This

```javascript
// 1. Direct innerHTML with user input
element.innerHTML = userInput; // XSS!

// 2. No authentication check
async function deleteEntity(id) {
    await db.collection('deities').doc(id).delete(); // Anyone can delete!
}

// 3. Trust client-side data
if (userIsAdmin) { // Client can set this!
    allowAdminActions();
}

// 4. No input validation
const age = req.body.age; // Could be anything!
saveToDatabase(age);

// 5. Exposing sensitive data in errors
catch (error) {
    alert(error.stack); // Shows internal details!
}
```

### ✅ Always Do This

```javascript
// 1. Escape user input
element.textContent = userInput;
// or
element.innerHTML = SecurityHelpers.escapeHtml(userInput);

// 2. Require authentication
async function deleteEntity(id) {
    if (!firebase.auth().currentUser) {
        throw new Error('Authentication required');
    }
    await db.collection('deities').doc(id).delete();
}

// 3. Verify server-side
const idToken = await firebase.auth().currentUser.getIdTokenResult();
const isAdmin = idToken.claims.admin === true; // Server-verified

// 4. Validate all input
const age = parseInt(req.body.age);
if (isNaN(age) || age < 0 || age > 150) {
    throw new Error('Invalid age');
}

// 5. Sanitize error messages
catch (error) {
    const safeMessage = SecurityHelpers.sanitizeErrorMessage(error);
    alert(safeMessage);
}
```

---

## Quick Commands

### Run Security Tests

```bash
npm test -- __tests__/security/security-comprehensive.test.js
```

### Check Dependencies for Vulnerabilities

```bash
npm audit
```

### Fix Dependency Vulnerabilities

```bash
npm audit fix
```

### Update All Dependencies

```bash
npm update
```

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [GDPR Compliance](https://gdpr.eu/)

---

**Last Updated:** 2025-12-28
**Maintained By:** Test Polish Agent 8
