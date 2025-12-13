# Security Deployment Checklist
**Eyes of Azrael - Step-by-Step Security Implementation**

Use this checklist to deploy all security features in the correct order.

---

## Pre-Deployment

### 1. Verify Firebase Plan
- [ ] Check current plan in Firebase Console
- [ ] Spark Plan = Free (limited features)
- [ ] Blaze Plan = Pay-as-you-go (full features recommended)
- [ ] Note: Cloud Functions require Blaze plan

### 2. Backup Current Configuration
```bash
# Backup current rules
cp firestore.rules firestore.rules.backup

# Backup current firebase.json
cp firebase.json firebase.json.backup
```

### 3. Install Firebase CLI
```bash
# Check if installed
firebase --version

# If not installed:
npm install -g firebase-tools

# Login
firebase login
```

### 4. Set Active Project
```bash
# List projects
firebase projects:list

# Set active project
firebase use eyesofazrael
```

---

## Phase 1: Firestore Security Rules (Spark & Blaze)

### Deploy Updated Rules
```bash
# Review changes
git diff firestore.rules

# Deploy rules
firebase deploy --only firestore:rules
```

### Verify Deployment
- [ ] Go to Firebase Console > Firestore > Rules
- [ ] Verify new rules are active (check timestamp)
- [ ] Test a query to ensure it works
- [ ] Check query limit (should be max 100 results)

### Test System Collections
```javascript
// Try to write to system collection (should fail)
await setDoc(doc(db, 'system/rate_limits/test'), { test: true });
// Expected: Permission denied

// Try to read as admin (should succeed)
const adminDoc = await getDoc(doc(db, 'system/security_logs/test'));
```

**Expected Results:**
- ✅ Regular users cannot write to `/system` collections
- ✅ Only admin can read security logs
- ✅ Query limits enforced (max 100 results)

---

## Phase 2: Security Headers (Spark & Blaze)

### Deploy Updated firebase.json
```bash
# Review changes
git diff firebase.json

# Deploy hosting configuration
firebase deploy --only hosting
```

### Verify Security Headers
```bash
# Test with curl
curl -I https://eyesofazrael.web.app

# Or use online tool:
# https://securityheaders.com/?q=https://eyesofazrael.web.app
```

**Expected Headers:**
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy: geolocation=(), microphone=(), ...`
- ✅ `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- ✅ `Content-Security-Policy: default-src 'self'; ...`

### Test CSP
- [ ] Open site in browser
- [ ] Open DevTools Console
- [ ] Look for CSP violations
- [ ] Verify Firebase still works (auth, Firestore)
- [ ] Check that external resources load (fonts, images)

**If CSP blocks Firebase:**
Update CSP in `firebase.json` to allow Firebase domains:
```
script-src 'self' https://www.gstatic.com https://www.googleapis.com;
connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
```

---

## Phase 3: Firebase App Check (Spark & Blaze)

### Get reCAPTCHA v3 Site Key

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Select project: Eyes of Azrael

2. **Enable reCAPTCHA Enterprise API:**
   - Navigation > APIs & Services > Enable APIs
   - Search "reCAPTCHA Enterprise API"
   - Click Enable

3. **Create reCAPTCHA Key:**
   - Security > reCAPTCHA Enterprise
   - Click "Create Key"
   - Label: "Eyes of Azrael Web"
   - Platform: Website
   - Domains:
     - `eyesofazrael.web.app`
     - `eyesofazrael.firebaseapp.com`
     - `localhost` (for testing)
   - reCAPTCHA type: Score-based (v3)
   - Threshold: 0.5
   - Click "Create"

4. **Copy Site Key:**
   - [ ] Copy the site key (starts with `6Le...`)
   - [ ] Save to password manager

### Update firebase-config.js

```javascript
// Add this import
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// After initializing app
const app = initializeApp(firebaseConfig);

// Add App Check
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY_HERE'),
  isTokenAutoRefreshEnabled: true
});

// Development debug token (REMOVE IN PRODUCTION)
if (window.location.hostname === 'localhost') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
```

### Enable App Check in Firebase Console

1. **Go to Firebase Console:**
   - Build > App Check
   - Click "Get started"

2. **Register Web App:**
   - Click "Add app"
   - Select your web app
   - Provider: reCAPTCHA v3
   - Site key: (paste your key)
   - Click "Register"

3. **Enable Enforcement:**
   - **Start with "Monitor" mode** (logs but doesn't block)
   - Firestore: Monitor
   - Cloud Functions: Monitor
   - After testing, switch to "Enforce"

### Test App Check

1. **Local Testing:**
   ```bash
   firebase serve
   ```
   - [ ] Open http://localhost:5000
   - [ ] Open DevTools Console
   - [ ] Look for App Check debug token
   - [ ] Copy debug token

2. **Add Debug Token:**
   - Firebase Console > App Check > Apps > Debug tokens
   - Click "Add debug token"
   - Paste token
   - Save

3. **Production Testing:**
   ```bash
   firebase deploy --only hosting
   ```
   - [ ] Visit your site
   - [ ] Open DevTools > Network tab
   - [ ] Make a Firestore request
   - [ ] Look for `X-Firebase-AppCheck` header

**Expected Results:**
- ✅ reCAPTCHA badge visible in bottom-right corner
- ✅ `X-Firebase-AppCheck` header in Firestore requests
- ✅ No "App Check token missing" errors
- ✅ App Check metrics showing valid tokens in Firebase Console

---

## Phase 4: Cloud Functions (Blaze Plan ONLY)

### Install Dependencies

```bash
cd FIREBASE/functions
npm install
```

**Expected Output:**
```
added 150 packages
```

### Initialize Firebase Admin SDK

If you don't have a service account key:

1. **Generate Service Account Key:**
   - Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `service-account-key.json` (DO NOT COMMIT)

2. **Add to .gitignore:**
   ```
   FIREBASE/functions/service-account-key.json
   ```

### Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy individually
firebase deploy --only functions:checkRateLimit
firebase deploy --only functions:cleanupRateLimits
firebase deploy --only functions:adminBlockIP
firebase deploy --only functions:adminUnblockIP
firebase deploy --only functions:getSecurityLogs
```

**Expected Output:**
```
✔ functions[checkRateLimit] Successful create operation.
✔ functions[cleanupRateLimits] Successful create operation.
✔ functions[adminBlockIP] Successful create operation.
✔ functions[adminUnblockIP] Successful create operation.
✔ functions[getSecurityLogs] Successful create operation.
```

### Verify Functions Deployed

```bash
# List deployed functions
firebase functions:list
```

**Expected Output:**
```
checkRateLimit
cleanupRateLimits
adminBlockIP
adminUnblockIP
getSecurityLogs
```

### Test Cloud Functions

#### Test checkRateLimit
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const checkLimit = httpsCallable(functions, 'checkRateLimit');

const result = await checkLimit({ operationType: 'read' });
console.log('Rate limit:', result.data);
// Expected: { allowed: true, remaining: 50, limit: 50, window: 3600, userType: 'anonymous' }
```

#### Test adminBlockIP (Admin Only)
```javascript
const blockIP = httpsCallable(functions, 'adminBlockIP');
const result = await blockIP({
  ip: '1.2.3.4',
  reason: 'Test block',
  duration: 60000 // 1 minute for testing
});
console.log('Block result:', result.data);
// Expected: { success: true, ipHash: '...', expiresAt: '...' }
```

#### Test getSecurityLogs (Admin Only)
```javascript
const getLogs = httpsCallable(functions, 'getSecurityLogs');
const result = await getLogs({ limit: 10 });
console.log('Security logs:', result.data.logs);
// Expected: Array of log events
```

### Monitor Function Logs

```bash
# Follow logs in real-time
firebase functions:log --follow

# View specific function
firebase functions:log --only checkRateLimit
```

**Expected Results:**
- ✅ All functions deployed successfully
- ✅ checkRateLimit returns correct rate limit info
- ✅ Admin functions work (when authenticated as admin)
- ✅ No errors in function logs

---

## Phase 5: Integration Testing

### Test Rate Limiting

1. **Anonymous User Test:**
   ```javascript
   // Make 51 rapid requests (exceeds 50 limit)
   for (let i = 0; i < 51; i++) {
     await getDocs(collection(db, 'deities'));
   }
   // Expected: 51st request fails with "resource-exhausted" error
   ```

2. **Authenticated User Test:**
   ```javascript
   // Sign in
   await signInWithEmailAndPassword(auth, 'test@example.com', 'password');

   // Make 501 rapid requests (exceeds 500 limit)
   for (let i = 0; i < 501; i++) {
     await getDocs(collection(db, 'deities'));
   }
   // Expected: 501st request fails
   ```

3. **Admin Test:**
   ```javascript
   // Sign in as admin
   await signInWithEmailAndPassword(auth, 'andrewkwatts@gmail.com', 'password');

   // Make 1000 requests (should all succeed)
   for (let i = 0; i < 1000; i++) {
     await getDocs(collection(db, 'deities'));
   }
   // Expected: All requests succeed (admin unlimited)
   ```

### Test IP Blocking

1. **Trigger Auto-Block:**
   ```javascript
   // As anonymous user, exceed rate limit 5 times
   for (let i = 0; i < 5; i++) {
     try {
       for (let j = 0; j < 51; j++) {
         await getDocs(collection(db, 'deities'));
       }
     } catch (error) {
       console.log('Violation', i + 1);
     }
     await new Promise(resolve => setTimeout(resolve, 1000));
   }
   // Expected: IP blocked after 5 violations
   ```

2. **Verify Block:**
   ```
   Firestore > system > blocked_ips > ips
   ```
   - [ ] See blocked IP (hashed)
   - [ ] Check `expiresAt` timestamp (24 hours from now)

3. **Test Unblock:**
   ```javascript
   await adminUnblockIP({ ip: 'YOUR_IP' });
   // Expected: IP removed from blocked list
   ```

### Test Security Logs

1. **Trigger Security Events:**
   - Exceed rate limit (creates `rate_limit_exceeded` event)
   - Block an IP (creates `ip_blocked` event)
   - Try to access while blocked (creates `blocked_access_attempt` event)

2. **View Logs:**
   ```javascript
   const logs = await getSecurityLogs({ limit: 100 });
   console.log(logs.data.logs);
   ```

3. **Verify Log Types:**
   - [ ] `rate_limit_exceeded` events logged
   - [ ] `ip_blocked` events logged
   - [ ] `blocked_access_attempt` events logged

---

## Phase 6: Production Hardening

### Remove Debug Tokens

1. **firebase-config.js:**
   ```javascript
   // REMOVE OR COMMENT OUT:
   // self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

   // OR make it conditional:
   if (process.env.NODE_ENV === 'development') {
     self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
   }
   ```

2. **Firebase Console:**
   - App Check > Apps > Debug tokens
   - Remove any debug tokens (or keep one for emergency)

### Enable App Check Enforcement

1. **Firebase Console > App Check:**
   - Firestore: Switch from "Monitor" to "Enforce"
   - Cloud Functions: Switch to "Enforce"

2. **Test:**
   - Visit site
   - Verify all requests still work
   - Check for "App Check token invalid" errors

### Enable Scheduled Cleanup

- [ ] Verify `cleanupRateLimits` function is deployed
- [ ] Check Cloud Scheduler in Google Cloud Console
- [ ] Verify it runs every hour
- [ ] Monitor logs: `firebase functions:log --only cleanupRateLimits`

### Set Up Monitoring Alerts

1. **Firebase Console > Firestore > Usage:**
   - Set budget alert for reads/writes
   - Alert at 80% of free tier limits

2. **Cloud Functions > Metrics:**
   - Monitor invocations
   - Set alert for unusual spikes

3. **App Check > Metrics:**
   - Monitor invalid token rate
   - Alert if > 10% invalid tokens

---

## Post-Deployment Verification

### Security Checklist

- [ ] Firestore rules deployed and active
- [ ] Security headers present in responses
- [ ] App Check enabled and enforcing
- [ ] Cloud Functions deployed and working
- [ ] Rate limiting functioning correctly
- [ ] IP blocking working
- [ ] Security logs capturing events
- [ ] Scheduled cleanup running
- [ ] Admin functions accessible
- [ ] Debug tokens removed from production

### Performance Checklist

- [ ] Site loads without errors
- [ ] Firebase requests complete successfully
- [ ] No CSP violations
- [ ] reCAPTCHA doesn't interfere with UX
- [ ] Rate limits don't affect normal users
- [ ] Query limits don't break pagination

### Cost Checklist

- [ ] Monitor Firebase usage
- [ ] Check Cloud Functions invocations
- [ ] Verify reCAPTCHA assessments
- [ ] Review projected costs
- [ ] Set budget alerts

---

## Rollback Procedures

### If Something Goes Wrong

#### Rollback Firestore Rules
```bash
# Restore from backup
cp firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules
```

#### Rollback firebase.json
```bash
# Restore from backup
cp firebase.json.backup firebase.json
firebase deploy --only hosting
```

#### Disable App Check Enforcement
- Firebase Console > App Check
- Switch from "Enforce" to "Monitor"

#### Delete Cloud Functions
```bash
firebase functions:delete checkRateLimit
firebase functions:delete cleanupRateLimits
firebase functions:delete adminBlockIP
firebase functions:delete adminUnblockIP
firebase functions:delete getSecurityLogs
```

---

## Support and Documentation

### Documentation Files
- [FIREBASE_APP_CHECK_SETUP.md](./FIREBASE_APP_CHECK_SETUP.md) - App Check setup
- [SECURITY_CONFIGURATION.md](./SECURITY_CONFIGURATION.md) - Complete security guide
- [RATE_LIMITING_GUIDE.md](./RATE_LIMITING_GUIDE.md) - Rate limiting usage
- [SECURITY_README.md](./SECURITY_README.md) - Quick reference

### Get Help
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: [firebase] tag
- Email: andrewkwatts@gmail.com (security issues)

---

## Final Notes

**Spark Plan Users:**
- You can deploy everything except Cloud Functions
- Rate limiting will be handled by Firestore rules only
- Less granular control, but still effective

**Blaze Plan Users:**
- Full security suite available
- Recommended for production
- Monitor costs regularly
- Estimated cost: ~$0.13/month for 100K pageviews

**Next Steps:**
1. Monitor security logs for the first week
2. Adjust rate limits if needed
3. Review costs after first month
4. Set up regular security audits

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Firebase Plan:** [ ] Spark [ ] Blaze
**All Tests Passed:** [ ] Yes [ ] No
**Production Ready:** [ ] Yes [ ] No

---

**Last Updated:** December 13, 2025
**Version:** 1.0.0
