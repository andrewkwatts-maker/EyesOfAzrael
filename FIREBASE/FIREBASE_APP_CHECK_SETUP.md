# Firebase App Check Setup Guide
**Eyes of Azrael - DDoS Protection**

Firebase App Check helps protect your Firebase resources from abuse by preventing unauthorized clients from accessing your backend services.

---

## What is Firebase App Check?

Firebase App Check works with device-check, reCAPTCHA, and other attestation providers to ensure requests to your Firebase services come from legitimate apps and devices.

**Protection Against:**
- DDoS attacks
- API abuse
- Unauthorized scraping
- Bot traffic
- Credential stuffing

**Supported Platforms:**
- Web (reCAPTCHA v3, reCAPTCHA Enterprise)
- iOS (DeviceCheck, App Attest)
- Android (Play Integrity API, SafetyNet)

---

## Prerequisites

### 1. Firebase Plan
- **Spark Plan (Free):** Basic App Check with reCAPTCHA v3
- **Blaze Plan (Pay-as-you-go):** Advanced features, custom providers

### 2. Required Services
- Firebase project with Firestore enabled
- Domain verified in Firebase Hosting
- reCAPTCHA v3 site key (from Google Cloud Console)

---

## Setup Steps

### Step 1: Enable App Check in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **Eyes of Azrael**
3. Navigate to **Build > App Check**
4. Click **Get started**

### Step 2: Register reCAPTCHA v3 for Web

#### Option A: Use Firebase Console
1. In App Check settings, click **Add app**
2. Select your web app
3. Choose **reCAPTCHA v3** as provider
4. Click **Register**

#### Option B: Get reCAPTCHA Keys from Google Cloud
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Security > reCAPTCHA Enterprise**
3. Click **Create Key**
4. Configure:
   - **Label:** Eyes of Azrael Web
   - **Platform:** Website
   - **Domains:** Add your domain (e.g., `eyesofazrael.web.app`, `eyesofazrael.firebaseapp.com`)
   - **reCAPTCHA type:** Score-based (v3)
   - **Threshold:** 0.5 (recommended)
5. Copy the **Site Key**

### Step 3: Add App Check to Your Web App

Add this code to your Firebase initialization in `firebase-config.js`:

```javascript
// Import App Check
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Initialize Firebase (existing code)
const app = initializeApp(firebaseConfig);

// Initialize App Check with reCAPTCHA v3
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),

  // Optional: Use debug token in development
  isTokenAutoRefreshEnabled: true
});

// For development/testing (REMOVE IN PRODUCTION)
// self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
```

### Step 4: Enable App Check for Firebase Services

In Firebase Console > App Check:

1. **Firestore:**
   - Click **Enforce** or **Monitor**
   - Choose **Monitor** initially to test without blocking
   - After testing, switch to **Enforce**

2. **Cloud Functions:**
   - Enable enforcement for callable functions
   - Rate limiter functions will require App Check token

3. **Storage:**
   - Enable if using Firebase Storage

**Monitor vs Enforce:**
- **Monitor:** Logs requests without blocking (good for testing)
- **Enforce:** Blocks requests without valid App Check token

### Step 5: Test App Check

#### Development Testing
1. In `firebase-config.js`, add debug token:
```javascript
// Only for development!
if (window.location.hostname === 'localhost') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
```

2. Open your app in browser
3. Check console for debug token
4. Add debug token to Firebase Console > App Check > Apps > Debug tokens

#### Production Testing
1. Deploy to Firebase Hosting
2. Visit your site
3. Open DevTools > Network tab
4. Look for `X-Firebase-AppCheck` header in requests
5. In Firebase Console, check App Check metrics

### Step 6: Verify reCAPTCHA is Working

1. Open your website
2. Open DevTools > Console
3. Look for reCAPTCHA badge in bottom-right corner
4. Check for App Check token in network requests:
   - Header: `X-Firebase-AppCheck`
   - Should be present on Firestore/Functions requests

---

## Code Integration

### Full Example (firebase-config.js)

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "eyesofazrael.firebaseapp.com",
  projectId: "eyesofazrael",
  storageBucket: "eyesofazrael.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check
// IMPORTANT: Replace with your actual reCAPTCHA v3 site key
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Le...YOUR_SITE_KEY...'),
  isTokenAutoRefreshEnabled: true
});

// Development debug token (REMOVE IN PRODUCTION)
if (process.env.NODE_ENV === 'development') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Initialize other Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, appCheck };
```

### Using App Check with Cloud Functions

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Call rate-limited function
const checkRateLimit = httpsCallable(functions, 'checkRateLimit');

try {
  const result = await checkRateLimit({ operationType: 'read' });
  console.log('Rate limit status:', result.data);
} catch (error) {
  if (error.code === 'unauthenticated') {
    console.error('App Check token missing or invalid');
  }
}
```

---

## Monitoring and Metrics

### Firebase Console Metrics
1. Go to **App Check** in Firebase Console
2. View metrics:
   - Total requests
   - Valid tokens
   - Invalid tokens
   - Token refresh rate

### Cloud Functions Logs
```bash
firebase functions:log --only checkRateLimit
```

### Custom Monitoring
Add this to your Cloud Functions:

```javascript
exports.myFunction = functions.https.onCall(async (data, context) => {
  // Verify App Check token
  if (!context.app) {
    console.warn('App Check token missing', {
      timestamp: new Date().toISOString(),
      function: 'myFunction'
    });
  }

  // Your function logic...
});
```

---

## Troubleshooting

### Issue: reCAPTCHA Badge Not Showing
**Solution:**
- Check that reCAPTCHA site key is correct
- Verify domain is registered in reCAPTCHA settings
- Check browser console for errors
- Clear browser cache

### Issue: "App Check token is invalid"
**Solution:**
- Verify App Check is initialized before Firestore
- Check that debug token is added in Firebase Console
- Ensure reCAPTCHA v3 is working (check Network tab)
- Verify clock on device is correct

### Issue: Functions Failing with "unauthenticated"
**Solution:**
- Enable App Check enforcement for Cloud Functions
- Verify `context.app` is present in function
- Check that client has valid App Check token

### Issue: Too Many reCAPTCHA Challenges
**Solution:**
- Lower reCAPTCHA threshold (0.3 instead of 0.5)
- Use reCAPTCHA Enterprise for better scoring
- Check for bot-like behavior (rapid requests)

---

## Cost Considerations

### Spark Plan (Free)
- **reCAPTCHA v3:** 1 million assessments/month free
- **Firebase App Check:** Included
- **Overage:** $1 per 1,000 assessments

### Blaze Plan (Pay-as-you-go)
- **reCAPTCHA Enterprise:** Better scoring, fraud detection
- **Custom providers:** Build your own attestation
- **Priority support:** Faster response times

**Typical Usage (Eyes of Azrael):**
- ~100,000 page views/month
- ~2 App Check token refreshes per session
- **Cost:** Free (within free tier)

---

## Security Best Practices

### 1. Don't Expose Debug Tokens
```javascript
// BAD - Always enabled
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

// GOOD - Only in development
if (window.location.hostname === 'localhost') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
```

### 2. Use Replay Protection
```javascript
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### 3. Monitor Invalid Tokens
Set up Cloud Functions to log invalid App Check attempts:

```javascript
exports.logInvalidAppCheck = functions.firestore
  .document('system/security_logs/events/{eventId}')
  .onCreate((snap, context) => {
    const data = snap.data();
    if (data.type === 'invalid_app_check_token') {
      // Alert admin
      // Block IP if repeated violations
    }
  });
```

### 4. Combine with Rate Limiting
App Check prevents unauthorized clients. Rate limiting prevents abuse from authorized clients. **Use both!**

---

## Deployment Checklist

- [ ] reCAPTCHA v3 site key obtained
- [ ] App Check initialized in `firebase-config.js`
- [ ] Debug token removed from production build
- [ ] App Check enforced for Firestore
- [ ] App Check enforced for Cloud Functions
- [ ] Monitoring enabled in Firebase Console
- [ ] reCAPTCHA badge visible on site
- [ ] Test with valid and invalid tokens
- [ ] Security logs configured
- [ ] Rate limiting integrated

---

## Additional Resources

- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [App Check Best Practices](https://firebase.google.com/docs/app-check/best-practices)
- [Troubleshooting Guide](https://firebase.google.com/docs/app-check/web/debug-provider)

---

## Support

**Issues with App Check?**
- Check Firebase Console > App Check > Metrics
- Review Cloud Functions logs
- Test with debug token locally
- Contact: andrewkwatts@gmail.com

**Need Help?**
- Firebase Support: https://firebase.google.com/support
- Community: https://stackoverflow.com/questions/tagged/firebase-app-check
- Discord: Firebase Discord Community
