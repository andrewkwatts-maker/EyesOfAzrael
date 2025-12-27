# Security Best Practices
**Eyes of Azrael Development Team**

This document outlines security best practices for developing and maintaining the Eyes of Azrael application.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation & Sanitization](#input-validation--sanitization)
3. [Firebase Security](#firebase-security)
4. [Client-Side Security](#client-side-security)
5. [Data Protection](#data-protection)
6. [API Security](#api-security)
7. [Deployment Security](#deployment-security)
8. [Incident Response](#incident-response)
9. [Regular Maintenance](#regular-maintenance)

---

## Authentication & Authorization

### User Authentication

**DO:**
- ✅ Use Firebase Authentication for user management
- ✅ Implement session timeout (30 minutes default)
- ✅ Use HTTPS for all authentication flows
- ✅ Validate authentication tokens on every request
- ✅ Clear all user data on logout

**DON'T:**
- ❌ Store passwords in the application (use Firebase Auth)
- ❌ Trust client-side authentication checks alone
- ❌ Allow unlimited session duration
- ❌ Expose authentication tokens in URLs
- ❌ Use localStorage for sensitive tokens

### Role-Based Access Control

**DO:**
- ✅ Store user roles in Firestore (admin, moderator, user)
- ✅ Validate permissions on server-side (Firestore rules)
- ✅ Use role checks in both client and security rules
- ✅ Log all admin actions
- ✅ Implement least privilege principle

**DON'T:**
- ❌ Hardcode admin emails in security rules
- ❌ Trust client-side role checks alone
- ❌ Grant admin privileges by default
- ❌ Skip permission checks for "trusted" users
- ❌ Allow users to set their own roles

**Example:**
```javascript
// GOOD: Check role from Firestore
function isAdmin() {
  return getUserRole() == 'admin';
}

function getUserRole() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
}

// BAD: Hardcoded email
function isAdmin() {
  return request.auth.token.email == 'admin@example.com'; // ❌
}
```

---

## Input Validation & Sanitization

### User Input Validation

**DO:**
- ✅ Validate all input on both client and server
- ✅ Use allowlists (not denylists) for validation
- ✅ Enforce length limits on all text fields
- ✅ Validate data types (string, number, array)
- ✅ Reject HTML in plain text fields

**DON'T:**
- ❌ Trust any user input as safe
- ❌ Use client-side validation alone
- ❌ Allow unlimited field lengths
- ❌ Accept any file type for uploads
- ❌ Process input before validation

**Validation Example:**
```javascript
// GOOD: Comprehensive validation
function isValidTheory() {
  return request.resource.data.keys().hasAll(['title', 'content', 'authorId'])
    && isValidString(request.resource.data.title, 3, 200)
    && isValidString(request.resource.data.content, 50, 10000)
    && containsNoHTML(request.resource.data.title)
    && request.resource.data.authorId == request.auth.uid;
}

function isValidString(value, minLength, maxLength) {
  return value is string
    && value.size() >= minLength
    && value.size() <= maxLength;
}

function containsNoHTML(value) {
  return !value.matches('.*<[^>]+>.*');
}
```

### HTML Sanitization

**DO:**
- ✅ Use DOMPurify for rich text content
- ✅ Escape HTML in plain text fields
- ✅ Use textContent instead of innerHTML for user data
- ✅ Allowlist safe HTML tags only
- ✅ Strip JavaScript from all user content

**DON'T:**
- ❌ Use innerHTML with unsanitized data
- ❌ Trust user-provided HTML
- ❌ Allow <script> tags ever
- ❌ Allow event handlers (onclick, onerror, etc.)
- ❌ Allow javascript: URLs

**Sanitization Example:**
```javascript
// GOOD: Safe rendering
import DOMPurify from 'dompurify';

function renderUserContent(content) {
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href'],
    ALLOW_DATA_ATTR: false
  });
  element.innerHTML = clean;
}

// GOOD: Escape plain text
function renderTitle(title) {
  element.textContent = title; // Automatically escapes
}

// BAD: Direct innerHTML
element.innerHTML = userInput; // ❌ XSS vulnerability
```

---

## Firebase Security

### Firestore Security Rules

**DO:**
- ✅ Deny by default, allow explicitly
- ✅ Validate all writes in security rules
- ✅ Use custom functions for complex logic
- ✅ Test rules in Firebase Console Rules Playground
- ✅ Enforce ownership (authorId == request.auth.uid)

**DON'T:**
- ❌ Use `allow read, write: if true` in production
- ❌ Skip validation in security rules
- ❌ Trust client-side data
- ❌ Allow users to modify ownership fields
- ❌ Use overly complex rules (hard to audit)

**Security Rule Pattern:**
```javascript
// GOOD: Secure rule pattern
match /theories/{theoryId} {
  // Read: published or owned
  allow read: if resource.data.status == 'published'
                || isOwner(resource.data.authorId);

  // Create: authenticated + valid data
  allow create: if isAuthenticated()
                && isValidTheory()
                && request.resource.data.authorId == request.auth.uid;

  // Update: owner + immutable authorId
  allow update: if isOwner(resource.data.authorId)
                && request.resource.data.authorId == resource.data.authorId
                && isValidTheory();

  // Delete: owner or admin
  allow delete: if isOwner(resource.data.authorId) || isAdmin();
}

// BAD: Insecure rule
match /theories/{theoryId} {
  allow read, write: if true; // ❌ Anyone can do anything
}
```

### Storage Security Rules

**DO:**
- ✅ Restrict file types (no executables)
- ✅ Enforce file size limits
- ✅ Validate MIME types
- ✅ Use user-specific folders
- ✅ Implement access controls

**DON'T:**
- ❌ Allow public write access
- ❌ Allow SVG uploads (can contain scripts)
- ❌ Skip file size validation
- ❌ Trust client-provided MIME types alone
- ❌ Allow unlimited uploads

**Storage Rule Example:**
```javascript
// GOOD: Secure storage rules
match /user-uploads/{userId}/{filename} {
  allow read: if true; // Public read
  allow write: if request.auth.uid == userId
                && request.resource.contentType.matches('image/(jpeg|png|gif|webp)')
                && request.resource.size < 5 * 1024 * 1024; // 5MB
}

// BAD: Insecure storage
match /{allPaths=**} {
  allow read, write: if true; // ❌ Anyone can upload anything
}
```

---

## Client-Side Security

### Content Security Policy (CSP)

**DO:**
- ✅ Implement strict CSP headers
- ✅ Use nonces for inline scripts
- ✅ Report CSP violations
- ✅ Regularly review and tighten CSP
- ✅ Test CSP before deploying

**DON'T:**
- ❌ Use `unsafe-inline` or `unsafe-eval` without necessity
- ❌ Ignore CSP violation reports
- ❌ Allow all domains in CSP
- ❌ Skip CSP testing
- ❌ Disable CSP in production

**CSP Example:**
```html
<!-- GOOD: Strict CSP -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'nonce-{{NONCE}}' https://trusted-cdn.com;
  style-src 'self' 'nonce-{{NONCE}}';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  report-uri /api/csp-report;
">

<!-- BAD: Permissive CSP -->
<meta http-equiv="Content-Security-Policy" content="
  default-src *;
  script-src * 'unsafe-inline' 'unsafe-eval';
"> <!-- ❌ Allows everything -->
```

### Secure Coding Practices

**DO:**
- ✅ Use `textContent` for user-generated text
- ✅ Sanitize before using `innerHTML`
- ✅ Validate all data types
- ✅ Use prepared statements (Firestore queries)
- ✅ Implement error handling without exposing details

**DON'T:**
- ❌ Use `eval()` or `Function()` constructor
- ❌ Trust data from URL parameters
- ❌ Expose sensitive errors to users
- ❌ Concatenate strings for queries
- ❌ Store secrets in JavaScript

**Code Example:**
```javascript
// GOOD: Safe rendering
const div = document.createElement('div');
div.textContent = userInput; // Safe
container.appendChild(div);

// GOOD: Sanitized rich content
const clean = DOMPurify.sanitize(richContent);
container.innerHTML = clean; // Safe

// BAD: Direct innerHTML
container.innerHTML = userInput; // ❌ XSS risk

// BAD: eval
eval(userInput); // ❌ Never use eval
```

---

## Data Protection

### Personal Data

**DO:**
- ✅ Minimize data collection (only what's needed)
- ✅ Encrypt sensitive data
- ✅ Implement data retention policies
- ✅ Provide data export (GDPR)
- ✅ Provide data deletion (GDPR)

**DON'T:**
- ❌ Collect unnecessary personal information
- ❌ Store passwords (use Firebase Auth)
- ❌ Share user data with third parties without consent
- ❌ Keep data indefinitely
- ❌ Expose email addresses publicly

### Data Storage

**DO:**
- ✅ Use HTTPS for all connections
- ✅ Encrypt data at rest (Firebase default)
- ✅ Implement proper backup procedures
- ✅ Use Firebase Firestore for structured data
- ✅ Implement audit logging for sensitive operations

**DON'T:**
- ❌ Store sensitive data in localStorage
- ❌ Use plain HTTP connections
- ❌ Log sensitive information
- ❌ Expose database credentials
- ❌ Skip data validation

---

## API Security

### Firebase API Keys

**DO:**
- ✅ Restrict API keys to specific domains
- ✅ Restrict API keys to required APIs only
- ✅ Keep API keys out of Git repository
- ✅ Rotate keys if compromised
- ✅ Monitor API key usage

**DON'T:**
- ❌ Commit API keys to Git
- ❌ Share API keys publicly
- ❌ Use unrestricted API keys
- ❌ Hardcode API keys in client code (use config)
- ❌ Reuse keys across projects

**API Key Configuration:**
```javascript
// GOOD: Restricted key configuration
// In Google Cloud Console > APIs & Services > Credentials:
// - Application restrictions: HTTP referrers
//   - yourdomain.com/*
//   - localhost:* (dev only)
// - API restrictions: Restrict key
//   - Cloud Firestore API
//   - Firebase Installations API
//   - Identity Toolkit API

// GOOD: Config file (not in Git)
// firebase-config.js (in .gitignore)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_KEY_HERE",
  authDomain: "your-app.firebaseapp.com",
  // ...
};

// BAD: Hardcoded, unrestricted key
const apiKey = "AIzaSy..."; // ❌ In Git, unrestricted
```

### Rate Limiting

**DO:**
- ✅ Implement rate limiting on API calls
- ✅ Use different limits for different user roles
- ✅ Log rate limit violations
- ✅ Implement exponential backoff
- ✅ Provide clear rate limit errors

**DON'T:**
- ❌ Allow unlimited API calls
- ❌ Use same limits for all users
- ❌ Block users permanently after violations
- ❌ Ignore rate limit patterns (could indicate attack)
- ❌ Skip rate limiting for admins without monitoring

---

## Deployment Security

### Pre-Deployment Checklist

**DO:**
- ✅ Review all code changes
- ✅ Test security rules in emulator
- ✅ Run security scans
- ✅ Update dependencies
- ✅ Remove debug code and console.logs

**DON'T:**
- ❌ Deploy without testing
- ❌ Skip security review
- ❌ Leave debug mode enabled
- ❌ Deploy with known vulnerabilities
- ❌ Skip changelog documentation

### Production Environment

**DO:**
- ✅ Use environment variables for secrets
- ✅ Enable security headers
- ✅ Monitor error logs
- ✅ Set up alerts for anomalies
- ✅ Implement backup procedures

**DON'T:**
- ❌ Use development credentials in production
- ❌ Disable security features for convenience
- ❌ Ignore security warnings
- ❌ Skip monitoring setup
- ❌ Allow direct database access

**Security Headers (firebase.json):**
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
          { "key": "Content-Security-Policy", "value": "default-src 'self'; ..." }
        ]
      }
    ]
  }
}
```

---

## Incident Response

### Security Incident Plan

**Immediate Actions:**
1. ✅ Identify the scope of the breach
2. ✅ Contain the incident (disable affected features)
3. ✅ Preserve evidence (logs, screenshots)
4. ✅ Notify affected users if required
5. ✅ Document the incident

**Post-Incident:**
1. ✅ Conduct root cause analysis
2. ✅ Implement fixes
3. ✅ Update security procedures
4. ✅ Train team on lessons learned
5. ✅ Review and improve incident response plan

### Reporting Security Issues

**For Researchers:**
- Email: security@eyesofazrael.com (create this)
- Include: vulnerability description, steps to reproduce, impact
- Allow reasonable time for fixes before public disclosure

**For Team:**
- Report security concerns immediately
- Don't attempt to exploit vulnerabilities
- Document findings thoroughly
- Collaborate on fixes

---

## Regular Maintenance

### Weekly Tasks

- ✅ Review security logs
- ✅ Check for failed login attempts
- ✅ Monitor rate limit violations
- ✅ Review CSP reports

### Monthly Tasks

- ✅ Update npm dependencies
- ✅ Review security rules
- ✅ Audit user roles/permissions
- ✅ Review API key restrictions
- ✅ Check for security advisories

### Quarterly Tasks

- ✅ Full security audit
- ✅ Penetration testing
- ✅ Update security documentation
- ✅ Review and update incident response plan
- ✅ Security training for team

### Annual Tasks

- ✅ Comprehensive security review
- ✅ Third-party security assessment
- ✅ Update security policies
- ✅ Review compliance requirements (GDPR, etc.)
- ✅ Rotate credentials and keys

---

## Code Review Checklist

### Every Pull Request Should:

- ✅ Not contain hardcoded secrets or API keys
- ✅ Include input validation for new features
- ✅ Sanitize user input before rendering
- ✅ Follow security rules patterns
- ✅ Include security considerations in description

### Security-Specific Reviews:

- ✅ Authentication/authorization changes
- ✅ Database security rules changes
- ✅ New user input fields
- ✅ File upload features
- ✅ Admin functionality

---

## Security Resources

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

### Tools

- **Firebase Emulator**: Test security rules locally
- **Firebase Rules Playground**: Test rules in console
- **DOMPurify**: HTML sanitization library
- **npm audit**: Check for vulnerable dependencies
- **OWASP ZAP**: Security testing tool

### Training

- OWASP Web Security Testing Guide
- Firebase Security Best Practices
- Secure Coding Guidelines
- GDPR Compliance Training

---

## Questions?

If you have questions about these security practices:

1. Review the SECURITY_AUDIT.md report
2. Check the security-hardening-checklist.md
3. Consult with the security team
4. Refer to Firebase documentation
5. Review OWASP guidelines

---

**Remember:** Security is not a one-time task, it's an ongoing process. Stay vigilant, keep learning, and always assume the worst about user input.

---

*Last Updated: December 27, 2025*
*Version: 1.0*
