# Firebase Security System
**Eyes of Azrael - Complete Security Implementation**

This directory contains all security configurations, Cloud Functions, and documentation for protecting Eyes of Azrael from DDoS attacks, API abuse, and spam.

---

## Quick Start

### For Spark Plan (Free)

1. **Update Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Security Headers:**
   ```bash
   firebase deploy --only hosting
   ```

3. **Set up Firebase App Check:**
   - See [FIREBASE_APP_CHECK_SETUP.md](./FIREBASE_APP_CHECK_SETUP.md)
   - Get reCAPTCHA v3 site key
   - Add to `firebase-config.js`

### For Blaze Plan (Recommended)

All of the above, PLUS:

4. **Deploy Cloud Functions:**
   ```bash
   cd FIREBASE/functions
   npm install
   firebase deploy --only functions
   ```

---

## Files Overview

### Security Rules
- **`firestore.rules`** (root) - Database security rules with rate limiting
  - Query size limits (max 100 results)
  - System collections (rate_limits, blocked_ips, security_logs)
  - Admin bypass for andrewkwatts@gmail.com

### Cloud Functions (Blaze Plan Only)
- **`functions/rateLimiter.js`** - Rate limiting implementation
  - Anonymous: 50 reads/hour, 10 writes/hour
  - Authenticated: 500 reads/hour, 100 writes/hour
  - Admin: Unlimited
  - Auto-blocks IPs after 5 violations

- **`functions/index.js`** - Function exports
- **`functions/package.json`** - Dependencies

### Configuration
- **`firebase.json`** (root) - Firebase project configuration
  - Security headers (CSP, HSTS, X-Frame-Options, etc.)
  - Functions configuration
  - Hosting settings

### Documentation

#### Setup Guides
- **[FIREBASE_APP_CHECK_SETUP.md](./FIREBASE_APP_CHECK_SETUP.md)** - DDoS protection with reCAPTCHA v3
  - What is App Check
  - Step-by-step setup
  - Code integration examples
  - Troubleshooting

#### Configuration Guides
- **[SECURITY_CONFIGURATION.md](./SECURITY_CONFIGURATION.md)** - Complete security overview
  - All security layers explained
  - Threat protection matrix
  - Monitoring and logging
  - IP blocking system
  - Admin tools
  - Cost analysis
  - Incident response

#### Usage Guides
- **[RATE_LIMITING_GUIDE.md](./RATE_LIMITING_GUIDE.md)** - Rate limiting usage and management
  - How rate limiting works
  - Implementation guide
  - Monitoring rate limits
  - Adjusting thresholds
  - Error handling
  - Best practices
  - Troubleshooting

---

## Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Firebase App Check            │  DDoS Protection
│  (reCAPTCHA v3)                         │  Bot Detection
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 2: HTTP Security Headers          │  XSS, Clickjacking
│  (CSP, HSTS, X-Frame-Options)           │  MITM Protection
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 3: Cloud Functions Rate Limiter   │  API Abuse Prevention
│  (Request Counting)                      │  Cost Control
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 4: Firestore Security Rules       │  Data Access Control
│  (Query Limits, Auth)                    │  Query Size Limits
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 5: IP Blocking & Logging          │  Automatic Blocking
│  (Security Logs)                         │  Audit Trail
└─────────────────────────────────────────┘
```

---

## What's Protected

| Threat | Protection | Status |
|--------|-----------|--------|
| DDoS Attack | App Check + Rate Limiting | ✅ |
| Bot Traffic | reCAPTCHA v3 | ✅ |
| API Scraping | Rate Limiting + IP Blocking | ✅ |
| Spam | Rate Limiting + Auth | ✅ |
| XSS | CSP Headers | ✅ |
| Clickjacking | X-Frame-Options | ✅ |
| MITM | HTTPS + HSTS | ✅ |
| Excessive Costs | Query Limits + Rate Limiting | ✅ |

---

## Rate Limits

| User Type | Reads/Hour | Writes/Hour | Query Size |
|-----------|-----------|-------------|-----------|
| Anonymous | 50 | 10 | 100 results |
| Authenticated | 500 | 100 | 100 results |
| Admin | Unlimited | Unlimited | Unlimited |

**Auto-Block:** 5 violations → 24-hour IP block (anonymous only)

---

## Admin Functions

### Check Rate Limit Status
```javascript
const status = await checkRateLimit({ operationType: 'read' });
console.log('Remaining:', status.data.remaining);
```

### Block IP
```javascript
await adminBlockIP({
  ip: '1.2.3.4',
  reason: 'Abuse',
  duration: 86400000 // 24 hours
});
```

### Unblock IP
```javascript
await adminUnblockIP({ ip: '1.2.3.4' });
```

### View Security Logs
```javascript
const logs = await getSecurityLogs({
  limit: 100,
  eventType: 'rate_limit_exceeded'
});
```

---

## Deployment Commands

### Deploy Everything
```bash
firebase deploy
```

### Deploy Specific Components
```bash
# Firestore rules only
firebase deploy --only firestore:rules

# Cloud Functions only
firebase deploy --only functions

# Hosting (security headers) only
firebase deploy --only hosting
```

### View Logs
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only checkRateLimit

# Follow in real-time
firebase functions:log --follow
```

---

## Monitoring

### Firebase Console
1. **App Check Metrics:** Build > App Check
2. **Firestore Usage:** Build > Firestore > Usage
3. **Function Logs:** Functions > Logs
4. **Security Logs:** Firestore > system > security_logs > events

### Security Logs (Admin Only)
```javascript
const logs = await getSecurityLogs({ limit: 100 });
logs.data.logs.forEach(log => {
  console.log(log.type, log.timestamp, log.details);
});
```

### Rate Limit Documents
```
Firestore > system > rate_limits > requests > {identifier}
```

### Blocked IPs
```
Firestore > system > blocked_ips > ips > {ipHash}
```

---

## Cost Estimates

### Spark Plan (Free)
- Firestore: 50K reads, 20K writes per day
- **Cost:** $0/month (within free tier for ~100K pageviews/month)

### Blaze Plan (Pay-as-you-go)
- Firestore: $0.06 per 100K reads
- Cloud Functions: $0.40 per 1M invocations
- reCAPTCHA: $1.00 per 1K assessments (after 1M free)
- **Estimated:** $0.13/month (100K pageviews)
- **Under Attack:** $2.60/month (1M pageviews, rate limiting prevents higher)

---

## Security Checklist

### Initial Setup
- [ ] Deploy Firestore rules
- [ ] Configure Firebase App Check
- [ ] Deploy Cloud Functions (Blaze only)
- [ ] Deploy security headers
- [ ] Test all functions
- [ ] Verify rate limiting works
- [ ] Check security logs

### Weekly Maintenance
- [ ] Review security logs
- [ ] Check blocked IPs
- [ ] Monitor Firebase usage
- [ ] Verify rate limits functioning

### Monthly Security Audit
- [ ] Review all security rules
- [ ] Test admin functions
- [ ] Check for security updates
- [ ] Audit Cloud Functions logs
- [ ] Review and update CSP headers
- [ ] Test incident response procedures

---

## Troubleshooting

### Rate Limits Not Working
1. Check if Cloud Functions are deployed: `firebase functions:list`
2. View logs: `firebase functions:log --only checkRateLimit`
3. Verify `rateLimitMiddleware` is called

### App Check Errors
1. Verify reCAPTCHA site key is correct
2. Check domain is registered in reCAPTCHA settings
3. Ensure App Check is initialized before Firestore
4. Check browser console for errors

### Legitimate Users Blocked
1. View security logs to find IP/UID
2. Unblock IP: `await adminUnblockIP({ ip: 'USER_IP' })`
3. Review rate limit thresholds
4. Consider increasing limits

---

## Support

**Security Issues (DO NOT POST PUBLICLY):**
- Email: andrewkwatts@gmail.com

**General Questions:**
- Check documentation first
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: [firebase] tag

---

## Additional Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Cloud Functions Security](https://firebase.google.com/docs/functions/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**System Version:** 1.0.0
**Last Updated:** December 13, 2025
**Maintained By:** Andrew Watts (andrewkwatts@gmail.com)
