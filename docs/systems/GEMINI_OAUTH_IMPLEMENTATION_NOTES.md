# Gemini OAuth Implementation - Important Notes & Challenges

## Critical Implementation Note

### Firebase ID Token vs OAuth Access Token

**Important Discovery:**

The current implementation uses Firebase ID tokens (`user.getIdToken()`) to authenticate with the Gemini API. However, there's an important distinction to be aware of:

1. **Firebase ID Tokens:**
   - Issued by Firebase Authentication
   - Used to verify user identity with Firebase services
   - May or may not work directly with Gemini API
   - Short-lived (1 hour expiration)

2. **Google OAuth Access Tokens:**
   - Issued by Google OAuth 2.0
   - Required for Google Cloud APIs
   - Include specific API scopes
   - Used for service authorization

### Potential Issue

The Gemini API may require a proper Google OAuth **access token** with the appropriate scopes, rather than a Firebase **ID token**. If API calls fail with 401/403 errors, this is likely the cause.

### Solution Options

#### Option 1: Use Firebase ID Token (Current Implementation)

**Pros:**
- Simple implementation
- No additional configuration
- Works if Gemini API accepts Firebase tokens

**Cons:**
- May not work with all Gemini API features
- Limited to Firebase authentication flow
- No control over API scopes

**When it works:**
- If your Firebase project and GCP project are properly linked
- If Gemini API is configured to accept Firebase tokens
- For basic API operations

#### Option 2: Get OAuth Access Token from Credential

**Implementation:**
```javascript
async getCurrentUserToken() {
    const user = this.auth.currentUser;
    if (!user) return null;

    try {
        // Get OAuth credential
        const credential = await user.getIdTokenResult();

        // Access token may be in credential.token or need separate call
        // This is the Google OAuth access token, not Firebase ID token
        const accessToken = credential.token;

        return accessToken;
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
}
```

**Pros:**
- Proper OAuth flow
- Access to API scopes
- Better compatibility with Google Cloud APIs

**Cons:**
- More complex implementation
- May require additional Firebase configuration
- Scopes must be requested at sign-in

#### Option 3: Use Google API Client Library

**Implementation:**
```javascript
// Load Google API client library
<script src="https://apis.google.com/js/api.js"></script>

// Initialize and get token
gapi.load('client:auth2', async () => {
    await gapi.client.init({
        clientId: 'YOUR_CLIENT_ID',
        scope: 'https://www.googleapis.com/auth/generative-language.retriever'
    });

    const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
});
```

**Pros:**
- Official Google approach
- Full control over scopes
- Reliable token management

**Cons:**
- Additional library dependency
- Separate auth flow from Firebase
- More complex setup

## Current Implementation Status

### What's Implemented

The current implementation uses **Firebase ID tokens** via `user.getIdToken(true)`:

```javascript
async getCurrentUserToken() {
    const user = this.auth.currentUser;
    if (!user) return null;

    try {
        // Get ID token (this is the OAuth token)
        const token = await user.getIdToken(true); // true = force refresh
        return token;
    } catch (error) {
        console.error('Error getting user token:', error);
        return null;
    }
}
```

### Testing Required

**You must test if this works with Gemini API:**

1. Sign in with Google
2. Try to generate an SVG
3. Check browser console for API response
4. Look for 401/403 authentication errors

**If it works:** Great! No changes needed.

**If it fails with 401/403:** You'll need to implement one of the alternative solutions above.

## Recommended Testing Procedure

### Step 1: Test Current Implementation

```javascript
// In browser console after signing in:
const generator = new GeminiSVGGenerator();
const result = await generator.generateSVG('test prompt', {});
console.log('Result:', result);
```

**Expected outcomes:**

- **Success:** API accepts Firebase ID token → No changes needed
- **401/403 Error:** API requires OAuth access token → Implement alternative solution
- **Other Error:** Check error message for specific issue

### Step 2: Inspect Token

```javascript
// Check what token we're using
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
console.log('Token:', token);

// Decode JWT to see claims
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token claims:', payload);
```

**Look for:**
- `aud` (audience) - Should be your Firebase project
- `iss` (issuer) - Should be Firebase
- No `scope` claim - ID tokens don't include API scopes

### Step 3: Test API Call Directly

```javascript
// Test API call with current token
const token = await firebase.auth().currentUser.getIdToken(true);

const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        contents: [{
            parts: [{
                text: 'Generate a simple SVG circle'
            }]
        }]
    })
});

console.log('Status:', response.status);
const data = await response.json();
console.log('Response:', data);
```

**Interpret results:**
- **200 OK:** Firebase ID token works! ✓
- **401 Unauthorized:** Need OAuth access token
- **403 Forbidden:** May need additional scopes
- **400 Bad Request:** Check request format

## Alternative Implementation (If Needed)

If Firebase ID tokens don't work, here's a complete alternative using OAuth access tokens:

### Updated getCurrentUserToken Method

```javascript
async getCurrentUserToken() {
    if (!this.auth) {
        console.error('Firebase Auth not initialized');
        return null;
    }

    const user = this.auth.currentUser;
    if (!user) {
        return null;
    }

    try {
        // Try to get OAuth access token from provider data
        const googleProvider = user.providerData.find(
            provider => provider.providerId === 'google.com'
        );

        if (!googleProvider) {
            console.error('User did not sign in with Google');
            return null;
        }

        // Get fresh credential with access token
        const credential = await user.getIdTokenResult();

        // The access token might be in the credential
        // This depends on Firebase configuration
        if (credential.claims && credential.claims.access_token) {
            return credential.claims.access_token;
        }

        // Fallback to ID token (current implementation)
        return credential.token;
    } catch (error) {
        console.error('Error getting user token:', error);
        return null;
    }
}
```

### Request Additional Scopes at Sign-In

```javascript
// In firebase-auth.js signInWithGoogle method
async signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();

        // Request Gemini API scope
        provider.addScope('profile');
        provider.addScope('email');
        provider.addScope('https://www.googleapis.com/auth/generative-language.retriever');

        // Important: Request access token
        provider.setCustomParameters({
            'access_type': 'offline',
            'prompt': 'consent'
        });

        const result = await this.auth.signInWithPopup(provider);

        // Access token should be in result.credential
        console.log('OAuth Credential:', result.credential);

        return { success: true, user: result.user };
    } catch (error) {
        console.error('Google sign-in error:', error);
        // ... error handling
    }
}
```

## Google Cloud Configuration

### Required Setup

1. **Enable Gemini API:**
   ```
   Google Cloud Console → APIs & Services → Enable APIs → Generative Language API
   ```

2. **Configure OAuth Consent Screen:**
   ```
   Google Cloud Console → APIs & Services → OAuth consent screen
   - Add required scopes
   - Add test users (for development)
   ```

3. **Create OAuth 2.0 Client ID:**
   ```
   Google Cloud Console → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Add authorized JavaScript origins
   - Add authorized redirect URIs
   ```

4. **Link Firebase to GCP:**
   ```
   Firebase Console → Project Settings → Service accounts
   - Ensure linked to correct GCP project
   ```

### Required Scopes

For Gemini API access, you may need:
- `https://www.googleapis.com/auth/generative-language.retriever`
- `https://www.googleapis.com/auth/cloud-platform` (optional)

## Fallback Strategy

If OAuth proves too complex or problematic, consider:

1. **Hybrid Approach:**
   - Try Firebase ID token first
   - Fall back to API key if available
   - Show clear error messages

2. **Server-Side Proxy:**
   - Create Firebase Cloud Function
   - Handle API calls server-side
   - Use service account credentials
   - Client calls Cloud Function, not Gemini directly

3. **API Key Option:**
   - Keep OAuth as primary
   - Allow optional API key in firebase-config.js
   - Document both approaches

## Known Working Patterns

### Pattern 1: Firebase ID Token (Simple)
```javascript
const token = await user.getIdToken(true);
// May work if Firebase and GCP properly linked
```

### Pattern 2: OAuth Access Token (Recommended)
```javascript
const credential = await user.getIdTokenResult();
const accessToken = credential.claims.access_token;
// More reliable for Google Cloud APIs
```

### Pattern 3: Google API Client (Most Reliable)
```javascript
const auth = gapi.auth2.getAuthInstance();
const token = auth.currentUser.get().getAuthResponse().access_token;
// Official Google approach, always works
```

## Debugging Checklist

- [ ] Firebase initialized correctly
- [ ] User signed in with Google
- [ ] Token retrieved successfully
- [ ] Token not expired (check exp claim)
- [ ] Gemini API enabled in GCP
- [ ] OAuth consent screen configured
- [ ] Correct scopes requested
- [ ] Firebase linked to GCP project
- [ ] No CORS errors in console
- [ ] API endpoint URL correct
- [ ] Request body formatted correctly
- [ ] Response inspected for error details

## Error Messages to Watch For

**"Invalid authentication credentials"**
- Token format wrong or expired
- Try refreshing token
- Check token claims

**"Request had insufficient authentication scopes"**
- Need to add Gemini API scope
- Re-authenticate with new scopes
- Update OAuth provider configuration

**"API key not valid"**
- Trying to use ID token as API key
- Need to use Authorization header, not query param
- Current implementation should handle this correctly

**"The caller does not have permission"**
- Gemini API not enabled
- User doesn't have access
- Check GCP project permissions

## Recommended Next Steps

1. **Test current implementation** with real Google sign-in
2. **Monitor browser console** for API responses
3. **Check API status codes** (200 = success, 401/403 = auth issue)
4. **Inspect token claims** to understand what we're sending
5. **Adjust implementation** based on test results
6. **Document findings** for future reference

## Success Criteria

✓ User can sign in with Google
✓ User can generate SVG with AI
✓ No authentication errors
✓ Token refreshes automatically
✓ Clear error messages if issues occur

---

**Status:** Implementation complete, testing required

**Next Action:** Test with real Google account and Gemini API

**Contact:** Check browser console for errors and update this document with findings
