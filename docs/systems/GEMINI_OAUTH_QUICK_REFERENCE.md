# Gemini OAuth Integration - Quick Reference

## For Users

### How to Use AI SVG Generation

1. Click "Sign In with Google" button (top right)
2. Open SVG Editor (in theory editor)
3. Click "AI Generator" tab
4. Enter your prompt and click "Generate SVG"
5. That's it! No API key needed.

### Troubleshooting

**Problem:** AI tab says "Sign In Required"
- **Solution:** Sign in with Google first

**Problem:** "Not authenticated" error
- **Solution:** Sign out and sign back in

**Problem:** "Rate limit exceeded"
- **Solution:** Wait a few minutes and try again

## For Developers

### How It Works

```javascript
// User signs in with Google OAuth
firebase.auth().signInWithGoogle()

// Get OAuth token automatically
const token = await firebase.auth().currentUser.getIdToken(true)

// Call Gemini API with token
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
})
```

### Key Classes

**GeminiSVGGenerator:**
- `getCurrentUserToken()` - Gets OAuth token
- `isAuthenticated()` - Checks if user signed in
- `generateSVG(prompt, options)` - Main generation method

**SVGEditorModal:**
- `setupAuthListener()` - Watches for auth changes
- `refreshAITab()` - Updates UI on auth change
- `generateSVG()` - Triggers generation with auth check

### Configuration

**Firebase Config (firebase-config.js):**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project",
  // ... other config
};
```

**No Gemini API key needed!**

### Error Handling

```javascript
const result = await generator.generateSVG(prompt, options);

if (result.success) {
  console.log('SVG:', result.svgCode);
} else if (result.needsAuth) {
  console.log('User needs to sign in');
  showSignInPrompt();
} else {
  console.error('Error:', result.error);
}
```

### Token Management

Tokens are automatically:
- Generated on sign-in
- Refreshed when expired (every 1 hour)
- Used for API calls
- Cleared on sign-out

**No manual token management needed!**

### Setup Requirements

1. **Firebase:**
   - Google OAuth provider enabled
   - Firebase Authentication configured

2. **Google Cloud:**
   - Gemini API enabled
   - OAuth consent screen configured

3. **No API Key Required**

### Testing

```javascript
// Check if user can use AI generation
const generator = new GeminiSVGGenerator();
console.log('Can generate:', generator.isAuthenticated());

// Test generation
const result = await generator.generateSVG('Zeus with lightning bolt', {
  style: 'detailed',
  colorScheme: 'fire'
});

console.log('Result:', result);
```

### Migration from API Key

**Old way:**
```javascript
const GEMINI_API_KEY = "your-api-key-here";
const generator = new GeminiSVGGenerator(GEMINI_API_KEY);
```

**New way:**
```javascript
// User signs in with Google
// No API key needed
const generator = new GeminiSVGGenerator();
```

### Security Notes

- OAuth tokens expire after 1 hour
- Tokens auto-refresh automatically
- No shared credentials
- Each user has own quota
- Tokens never stored in code

### API Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

Headers:
  Authorization: Bearer {oauth_token}
  Content-Type: application/json

Body:
  {
    "contents": [...],
    "generationConfig": {...}
  }
```

### Common Patterns

**Check authentication before showing AI features:**
```javascript
if (generator.isAuthenticated()) {
  showAIGeneratorTab();
} else {
  showSignInPrompt();
}
```

**Handle auth state changes:**
```javascript
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    enableAIFeatures();
  } else {
    disableAIFeatures();
  }
});
```

**Get fresh token:**
```javascript
const token = await generator.getCurrentUserToken();
if (!token) {
  console.log('Not authenticated');
}
```

### Files to Know

- `js/gemini-svg-generator.js` - Main generator class
- `js/components/svg-editor-modal.js` - SVG editor UI
- `js/firebase-auth.js` - Authentication system
- `firebase-config.template.js` - Configuration template

### Quick Links

- [Full Documentation](GEMINI_OAUTH_INTEGRATION_SUMMARY.md)
- [Firebase Auth Guide](FIREBASE_AUTH_IMPLEMENTATION_SUMMARY.md)
- [SVG Editor Guide](js/components/svg-editor-modal.js)

---

**Last Updated:** 2025-12-07
