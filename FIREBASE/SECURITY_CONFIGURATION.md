# Firebase Security Configuration
**Eyes of Azrael - Comprehensive Security Guide**

This document outlines all security measures implemented for Eyes of Azrael, including DDoS protection, rate limiting, spam prevention, and security monitoring.

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Firebase App Check (DDoS Protection)](#firebase-app-check-ddos-protection)
3. [Firestore Security Rules](#firestore-security-rules)
4. [Rate Limiting System](#rate-limiting-system)
5. [Cloud Functions Security](#cloud-functions-security)
6. [HTTP Security Headers](#http-security-headers)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [IP Blocking System](#ip-blocking-system)
9. [Admin Tools](#admin-tools)
10. [Cost Analysis](#cost-analysis)
11. [Incident Response](#incident-response)

---

## Security Overview

### Layers of Protection

```
┌─────────────────────────────────────────┐
│  Layer 1: Firebase App Check            │
│  (reCAPTCHA v3 - Bot Detection)         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 2: HTTP Security Headers          │
│  (CSP, HSTS, X-Frame-Options, etc.)     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 3: Cloud Functions Rate Limiter   │
│  (Request counting per IP/user)          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 4: Firestore Security Rules       │
│  (Query limits, authentication)          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 5: IP Blocking & Logging          │
│  (Automatic blocking after violations)   │
└─────────────────────────────────────────┘
```

### Threat Protection Matrix

| Threat Type | Protection Mechanism | Status |
|------------|---------------------|--------|
| DDoS Attack | App Check + Rate Limiting | ✅ Active |
| API Scraping | Rate Limiting + IP Blocking | ✅ Active |
| Bot Traffic | reCAPTCHA v3 | ✅ Active |
| Spam Submissions | Rate Limiting + Auth | ✅ Active |
| SQL Injection | Firestore (NoSQL) | ✅ N/A |
| XSS Attacks | CSP Headers + Sanitization | ✅ Active |
| CSRF Attacks | Firebase Auth Tokens | ✅ Active |
| Clickjacking | X-Frame-Options: DENY | ✅ Active |
| Man-in-the-Middle | HTTPS + HSTS | ✅ Active |

---

## Firebase App Check (DDoS Protection)

### What It Does
- Verifies requests come from legitimate apps/browsers
- Uses reCAPTCHA v3 to detect bots (invisible)
- Blocks requests without valid App Check token

### Implementation
```javascript
// firebase-config.js
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### Configuration
- **Provider:** reCAPTCHA v3
- **Threshold:** 0.5 (blocks suspicious traffic)
- **Enforcement:** Enabled for Firestore and Cloud Functions
- **Debug Tokens:** Enabled for development only

### Setup Guide
See [FIREBASE_APP_CHECK_SETUP.md](./FIREBASE_APP_CHECK_SETUP.md)

---

## Firestore Security Rules

### Rate Limiting Rules

#### Anonymous Users (50 reads/hour)
```javascript
function isRateLimited() {
  return !isAdminEmail() && exists(/databases/$(database)/documents/system/rate_limits/$(request.auth != null ? request.auth.uid : request.path));
}
```

#### Query Size Limits
```javascript
// Deities collection - max 100 results
match /deities/{deityId} {
  allow get: if true;
  allow list: if request.query.limit <= 100;
}
```

#### Admin Bypass
```javascript
function isAdminEmail() {
  return isAuthenticated() && request.auth.token.email == 'andrewkwatts@gmail.com';
}
```

### System Collections (Protected)

#### Rate Limits Collection
```
/system/rate_limits/{identifier}
- Only Cloud Functions can read/write
- Tracks request counts per user/IP
```

#### Blocked IPs Collection
```
/system/blocked_ips/{ipHash}
- Only Cloud Functions can read/write
- Stores blocked IPs with expiration
```

#### Security Logs Collection
```
/system/security_logs/{logId}
- Only admin can read
- Cloud Functions write logs
- Tracks all security events
```

### Deployment
```bash
firebase deploy --only firestore:rules
```

---

## Rate Limiting System

### Thresholds

| User Type | Reads/Hour | Writes/Hour | Enforcement |
|-----------|-----------|-------------|------------|
| Anonymous | 50 | 10 | Cloud Functions |
| Authenticated | 500 | 100 | Cloud Functions |
| Admin | Unlimited | Unlimited | Bypassed |

### How It Works

1. **Request Arrives**
   ```
   User/IP makes request → Cloud Function intercepts
   ```

2. **Check Rate Limit**
   ```javascript
   const rateLimit = await rateLimitMiddleware(context, 'read');
   if (!rateLimit.allowed) {
     throw new HttpsError('resource-exhausted', 'Rate limit exceeded');
   }
   ```

3. **Track Request**
   ```
   Store request timestamp in /system/rate_limits/{identifier}
   ```

4. **Clean Up**
   ```
   Scheduled function runs hourly to remove old records
   ```

### Violation Handling

#### First Violation
- Log to `/system/security_logs`
- Return error with retry-after header

#### Multiple Violations (Anonymous Users)
- After 5 violations: Block IP for 24 hours
- Add to `/system/blocked_ips`
- Log block event

#### Authenticated User Violations
- Log violations
- Do NOT auto-block (might be legitimate)
- Admin can manually review and block

---

## Cloud Functions Security

### Deployed Functions

#### 1. checkRateLimit
```javascript
// Check current rate limit status
const result = await checkRateLimit({ operationType: 'read' });
```

#### 2. cleanupRateLimits
```javascript
// Runs every hour via Pub/Sub
// Removes expired rate limit records
```

#### 3. adminBlockIP
```javascript
// Admin-only: Manually block an IP
await adminBlockIP({ ip: '1.2.3.4', reason: 'Manual block' });
```

#### 4. adminUnblockIP
```javascript
// Admin-only: Unblock an IP
await adminUnblockIP({ ip: '1.2.3.4' });
```

#### 5. getSecurityLogs
```javascript
// Admin-only: View security logs
const logs = await getSecurityLogs({ limit: 100, eventType: 'rate_limit_exceeded' });
```

### Using Rate Limiter in Custom Functions

```javascript
const { rateLimitMiddleware } = require('./rateLimiter');

exports.myCustomFunction = functions.https.onCall(async (data, context) => {
  // Check rate limit
  const rateLimit = await rateLimitMiddleware(context, 'write');

  if (!rateLimit.allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Rate limit exceeded',
      { retryAfter: rateLimit.retryAfter }
    );
  }

  // Your function logic here
  return { success: true };
});
```

### Deployment
```bash
cd FIREBASE/functions
npm install
firebase deploy --only functions
```

---

## HTTP Security Headers

### Configured Headers

#### 1. X-Content-Type-Options: nosniff
- Prevents MIME-sniffing attacks
- Browser won't guess content type

#### 2. X-Frame-Options: DENY
- Prevents clickjacking
- Site cannot be embedded in iframe

#### 3. X-XSS-Protection: 1; mode=block
- Enables browser XSS filter
- Blocks page if XSS detected

#### 4. Referrer-Policy: strict-origin-when-cross-origin
- Controls referrer information
- Full URL for same-origin, origin only for cross-origin

#### 5. Permissions-Policy
```
geolocation=(), microphone=(), camera=(), payment=(), usb=()
```
- Disables unnecessary browser features
- Reduces attack surface

#### 6. Strict-Transport-Security (HSTS)
```
max-age=31536000; includeSubDomains; preload
```
- Forces HTTPS for 1 year
- Includes all subdomains
- Eligible for HSTS preload list

#### 7. Content-Security-Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googleapis.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
frame-src 'self' https://*.firebaseapp.com;
object-src 'none';
base-uri 'self';
form-action 'self';
```

**What it protects against:**
- XSS attacks (limits script sources)
- Data injection
- Mixed content
- Unauthorized requests

### Testing Headers
```bash
curl -I https://eyesofazrael.web.app
```

Or use: https://securityheaders.com/

---

## Monitoring and Logging

### Security Logs Structure

```javascript
{
  type: 'rate_limit_exceeded' | 'ip_blocked' | 'blocked_access_attempt' | 'admin_ip_block' | 'admin_ip_unblock',
  timestamp: Firestore.Timestamp,
  details: {
    identifier: 'user:UID' or 'ip:HASH',
    ipHash: 'abc123...',
    userType: 'anonymous' | 'authenticated' | 'admin',
    operationType: 'read' | 'write',
    reason: 'string'
  }
}
```

### Viewing Logs

#### Firebase Console
```
Firestore > system > security_logs > events
```

#### Cloud Function (Admin Only)
```javascript
const logs = await getSecurityLogs({
  limit: 100,
  eventType: 'rate_limit_exceeded'
});
```

#### Command Line
```bash
firebase firestore:get /system/security_logs/events --limit 100
```

### Log Retention
- Security logs: Retained for 90 days
- Rate limit records: Cleaned up hourly (2 hour window)
- Blocked IPs: Auto-expire after 24 hours

---

## IP Blocking System

### Automatic Blocking

**Criteria for Auto-Block:**
1. User is anonymous (not authenticated)
2. 5+ rate limit violations within 1 hour
3. IP not already blocked

**Block Duration:** 24 hours (auto-expire)

### Manual Blocking (Admin)

```javascript
// Block an IP
await adminBlockIP({
  ip: '1.2.3.4',
  reason: 'Suspicious activity',
  duration: 86400000 // 24 hours in ms (optional)
});

// Unblock an IP
await adminUnblockIP({
  ip: '1.2.3.4'
});
```

### Viewing Blocked IPs

```
Firestore > system > blocked_ips > ips > {ipHash}

{
  blockedAt: Timestamp,
  expiresAt: Timestamp,
  reason: 'Multiple rate limit violations',
  autoExpire: true,
  blockedBy: 'UID' (if manual)
}
```

### IP Privacy
- IPs are hashed using SHA-256 (first 16 chars)
- Original IP not stored in database
- Only admin can see full IP in Cloud Functions logs

---

## Admin Tools

### Admin Functions

All admin functions require authentication as `andrewkwatts@gmail.com`.

#### 1. Block IP
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const blockIP = httpsCallable(functions, 'adminBlockIP');

await blockIP({
  ip: '1.2.3.4',
  reason: 'Manual block',
  duration: 86400000 // 24 hours (optional)
});
```

#### 2. Unblock IP
```javascript
const unblockIP = httpsCallable(functions, 'adminUnblockIP');
await unblockIP({ ip: '1.2.3.4' });
```

#### 3. View Security Logs
```javascript
const getSecurityLogs = httpsCallable(functions, 'getSecurityLogs');
const logs = await getSecurityLogs({
  limit: 100,
  eventType: 'rate_limit_exceeded' // optional filter
});

console.log('Security events:', logs.data.logs);
```

#### 4. Check User Rate Limit
```javascript
const checkRateLimit = httpsCallable(functions, 'checkRateLimit');
const status = await checkRateLimit({ operationType: 'read' });

console.log('Remaining:', status.data.remaining);
console.log('Limit:', status.data.limit);
console.log('User type:', status.data.userType);
```

### Admin Bypass

Admin email (`andrewkwatts@gmail.com`) bypasses:
- All rate limits
- Query size limits
- App Check (if needed for testing)

**Does NOT bypass:**
- IP blocks (admin can still be blocked if not authenticated)
- Security rules for other users' data

---

## Cost Analysis

### Spark Plan (Free Tier)

**Included:**
- Firestore: 50K reads, 20K writes, 1GB storage per day
- Cloud Functions: 125K invocations, 40K GB-seconds per month
- reCAPTCHA: 1M assessments per month
- App Check: Included

**Typical Usage (Eyes of Azrael):**
- ~100K page views/month
- ~200K Firestore reads/month
- ~10K Cloud Function invocations/month
- ~200K reCAPTCHA assessments/month

**Overage Risk:** LOW (within free tier)

### Blaze Plan (Pay-as-you-go)

**Pricing:**
- Firestore reads: $0.06 per 100K documents
- Cloud Functions: $0.40 per million invocations
- reCAPTCHA: $1.00 per 1K assessments (after 1M free)

**Estimated Monthly Cost (100K page views):**
- Firestore: $0.12 (200K reads)
- Cloud Functions: $0.004 (10K invocations)
- reCAPTCHA: $0.00 (within free tier)

**Total: ~$0.13/month**

**With DDoS Attack (1M page views):**
- Firestore: $1.20
- Cloud Functions: $0.40
- reCAPTCHA: $1.00
- IP Blocking: Prevents most malicious requests

**Total: ~$2.60/month (rate limiting prevents higher costs)**

### Cost Optimization

1. **Rate Limiting:** Prevents excessive reads
2. **Query Limits:** Max 100 results per query
3. **Scheduled Cleanup:** Removes old rate limit records
4. **IP Blocking:** Auto-blocks abusive IPs
5. **App Check:** Blocks bots before they hit Firestore

---

## Incident Response

### Scenario 1: Sudden Traffic Spike

**Detection:**
1. Firebase Console > Firestore > Usage
2. Unusually high read/write counts

**Response:**
1. Check security logs for rate limit violations
2. Identify source IPs (check Cloud Functions logs)
3. Review blocked IPs in Firestore
4. Manually block suspicious IPs if needed
5. Adjust rate limits if attack continues

**Commands:**
```bash
# View recent logs
firebase functions:log --only checkRateLimit --limit 100

# Block IP manually
# Use admin function: adminBlockIP
```

### Scenario 2: Bot Attack

**Detection:**
1. App Check metrics show high invalid token rate
2. Many "App Check token missing" errors

**Response:**
1. Verify App Check is enforced (not just monitoring)
2. Check reCAPTCHA v3 score threshold
3. Enable stricter enforcement
4. Review and block IPs with repeated violations

### Scenario 3: Legitimate User Blocked

**Detection:**
1. User reports access issues
2. Check security logs for user's IP/UID

**Response:**
```javascript
// Unblock user's IP
await adminUnblockIP({ ip: 'USER_IP' });

// Check their rate limit status
const status = await checkRateLimit({ operationType: 'read' });
```

### Scenario 4: Admin Account Compromised

**Detection:**
1. Unusual admin activity in logs
2. Unexpected IP blocks/unblocks

**Immediate Response:**
1. Change admin password immediately
2. Revoke all Firebase tokens
3. Review security logs for unauthorized actions
4. Enable 2FA on admin account
5. Audit all recent changes

**Prevention:**
- Enable 2FA (Two-Factor Authentication)
- Use strong, unique password
- Monitor admin activity logs
- Limit admin access to trusted IPs only

---

## Security Checklist

### Initial Setup
- [ ] Firebase App Check enabled and enforced
- [ ] reCAPTCHA v3 configured
- [ ] Cloud Functions deployed
- [ ] Firestore security rules updated
- [ ] HTTP security headers configured
- [ ] Admin email set correctly

### Regular Maintenance (Weekly)
- [ ] Review security logs
- [ ] Check blocked IPs
- [ ] Monitor Firebase usage/costs
- [ ] Test rate limiting
- [ ] Verify App Check metrics

### Security Audits (Monthly)
- [ ] Review all Firestore security rules
- [ ] Test admin functions
- [ ] Check for security updates
- [ ] Audit Cloud Functions logs
- [ ] Review and update CSP headers
- [ ] Test backup/restore procedures

### Emergency Procedures
- [ ] Admin contact info updated
- [ ] Incident response plan documented
- [ ] Backup admin account configured
- [ ] Escalation path defined
- [ ] Post-incident review process

---

## Additional Resources

- [FIREBASE_APP_CHECK_SETUP.md](./FIREBASE_APP_CHECK_SETUP.md) - App Check setup guide
- [RATE_LIMITING_GUIDE.md](./RATE_LIMITING_GUIDE.md) - Rate limiting usage guide
- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Support

**Security Issues:**
- Email: andrewkwatts@gmail.com
- Do NOT post security vulnerabilities publicly

**Questions:**
- Check documentation first
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: [firebase] tag

---

**Last Updated:** December 13, 2025
**Version:** 1.0.0
**Maintained By:** Andrew Watts
