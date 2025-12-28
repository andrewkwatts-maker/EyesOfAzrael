# Production Deployment Guide
## Eyes of Azrael v2.0.0

**Date:** December 28, 2025
**Version:** 2.0.0-production-ready
**Type:** Major Release - 16-Agent Deployment

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Configuration Steps](#configuration-steps)
3. [Deployment Process](#deployment-process)
4. [Verification Checklist](#verification-checklist)
5. [Rollback Procedures](#rollback-procedures)
6. [Post-Deployment Monitoring](#post-deployment-monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Readiness
- [ ] All 16 agent tasks completed
- [ ] Git status clean (all changes committed)
- [ ] Version tagged: `v2.0.0-production-ready`
- [ ] No sensitive data in code (API keys, passwords)
- [ ] All TODO comments resolved or documented

### Testing
- [ ] Unit tests passing: `npm run test`
- [ ] Integration tests passing: `npm run test:integration`
- [ ] E2E tests passing: `npm run test:e2e`
- [ ] Manual smoke testing complete
- [ ] Accessibility audit passed: `npm run test:accessibility`
- [ ] Performance audit passed (Lighthouse 90+)

### Documentation
- [ ] README.md updated
- [ ] CHANGELOG.md created/updated
- [ ] All agent reports archived
- [ ] API documentation current
- [ ] User guide updated

### Infrastructure
- [ ] Firebase project created/verified
- [ ] Sentry project created
- [ ] Google Analytics property setup
- [ ] GitHub repository configured
- [ ] Domain DNS configured (if custom domain)

---

## Configuration Steps

### 1. Sentry Configuration

#### Create Sentry Account & Project
```bash
# 1. Visit https://sentry.io and create account
# 2. Create new project: "eyes-of-azrael"
# 3. Select platform: "JavaScript"
# 4. Copy DSN from Settings → Client Keys (DSN)
```

#### Update Application Code
```javascript
// File: js/error-monitoring.js (Line ~30)

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN_HERE', // <- REPLACE THIS
  environment: window.location.hostname === 'localhost' ? 'development' : 'production',
  // ... rest of config
});
```

#### Create Sentry Auth Token
```bash
# 1. Go to Sentry → Settings → Account → API → Auth Tokens
# 2. Create token with scopes:
#    - project:read
#    - project:write
#    - org:read
# 3. Copy token for GitHub secrets
```

#### Add GitHub Secrets
```bash
# Repository → Settings → Secrets and variables → Actions → New repository secret

SENTRY_AUTH_TOKEN=<your_sentry_auth_token>
SENTRY_ORG=<your_sentry_organization_slug>
SENTRY_PROJECT=eyes-of-azrael
```

#### Configure Alerts
```yaml
# In Sentry Dashboard → Alerts → Create Alert Rule

Rule 1: High Error Rate
- When: Error count is more than 10 in 1 minute
- Notify: Email + Slack

Rule 2: New Error Pattern
- When: First seen event
- Notify: Email

Rule 3: User Impact
- When: Affected users is more than 100
- Notify: Email + SMS (if configured)

Rule 4: Performance Degradation
- When: Transaction duration (p95) is more than 3s for 5 minutes
- Notify: Email
```

---

### 2. Firebase Configuration

#### Verify Firebase Project
```bash
# Check current project
firebase projects:list

# Select/create project
firebase use --add
# Select project: eyes-of-azrael-production
# Alias: production
```

#### Deploy Security Rules
```bash
# Review rules first
cat firestore.rules
cat storage.rules

# Deploy to production
firebase deploy --only firestore:rules --project production
firebase deploy --only storage:rules --project production

# Verify in Firebase Console
# Firestore Database → Rules
# Storage → Rules
```

#### Configure Firebase Hosting
```bash
# File: firebase.json - Verify configuration
{
  "hosting": {
    "public": "dist",
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }],
    "headers": [{
      "source": "**/*.@(js|css)",
      "headers": [{
        "key": "Cache-Control",
        "value": "max-age=31536000"
      }]
    }]
  }
}
```

#### Update Firebase Config
```javascript
// File: firebase-config.js
// Ensure production credentials are set (gitignored file)

const firebaseConfig = {
  apiKey: "YOUR_PRODUCTION_API_KEY",
  authDomain: "eyes-of-azrael.firebaseapp.com",
  projectId: "eyes-of-azrael-production",
  storageBucket: "eyes-of-azrael-production.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

---

### 3. Google Analytics Configuration

#### Create GA4 Property
```bash
# 1. Visit https://analytics.google.com
# 2. Create Account: "Eyes of Azrael"
# 3. Create Property: "Eyes of Azrael Production"
# 4. Setup Data Stream: Web
# 5. Copy Measurement ID (G-XXXXXXXXXX)
```

#### Update Analytics Code
```javascript
// File: js/analytics-manager.js (Line ~20)

async init() {
  this.measurementId = 'G-XXXXXXXXXX'; // <- REPLACE THIS
  // ... rest of initialization
}
```

#### Configure Events
```javascript
// Verify custom events are tracked:
- page_view
- entity_view
- search_performed
- comparison_created
- theory_submitted
- user_login
- error_occurred
```

---

### 4. GitHub Actions Configuration

#### Add Firebase Token
```bash
# Generate token
firebase login:ci

# Copy token and add as GitHub secret
# Repository → Settings → Secrets → New repository secret
FIREBASE_TOKEN=<your_firebase_ci_token>
```

#### Verify Workflow Files
```bash
# Check workflows exist
ls .github/workflows/

# Expected files:
- ci.yml (runs on PR)
- deploy.yml (runs on merge to main)
- sentry-upload.yml (uploads source maps)
```

#### Test Workflow
```bash
# Create test PR to verify CI
git checkout -b test/ci-verification
git commit --allow-empty -m "Test: Verify CI pipeline"
git push origin test/ci-verification

# Check GitHub Actions tab for results
# Expected: All checks passing
```

---

### 5. PWA Configuration

#### Verify Manifest
```json
// File: manifest.json
{
  "name": "Eyes of Azrael - Mythology Encyclopedia",
  "short_name": "Eyes of Azrael",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#8b7fff",
  "background_color": "#0a0a0f",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Generate Icons
```bash
# Generate PWA icons from source
npm run generate-icons

# Validate icons
npm run validate-icons

# Expected output:
# ✓ icon-72.png (72x72)
# ✓ icon-96.png (96x96)
# ✓ icon-128.png (128x128)
# ✓ icon-144.png (144x144)
# ✓ icon-152.png (152x152)
# ✓ icon-192.png (192x192)
# ✓ icon-384.png (384x384)
# ✓ icon-512.png (512x512)
```

#### Verify Service Worker
```javascript
// File: service-worker.js
// Update cache version for new deployment
const CACHE_VERSION = 'v2.0.0';
```

---

## Deployment Process

### Step 1: Create Backup

```bash
# Backup current production (if exists)
firebase hosting:clone SOURCE:DEST --project production

# Backup Firestore data
gcloud firestore export gs://eyes-of-azrael-backup/$(date +%Y%m%d)

# Backup configuration
cp firebase-config.js firebase-config.backup.js
```

---

### Step 2: Build Production

```bash
# Install dependencies
npm ci --production=false

# Run pre-build checks
npm run validate:all
npm run lint

# Optimize images
npm run optimize-images

# Build production bundle
npm run build:prod

# Verify build output
ls -lh dist/
```

**Expected Output:**
```
dist/
├── index.html
├── css/ (minified)
├── js/ (minified)
├── icons/
├── manifest.json
├── service-worker.js
└── offline.html
```

---

### Step 3: Pre-Deployment Testing

```bash
# Serve production build locally
npm run serve:prod
# Opens http://localhost:8080

# Run manual checks:
# 1. Navigate through major pages
# 2. Test login/logout
# 3. Test search functionality
# 4. Test comparison tool
# 5. Submit test theory
# 6. Check error handling
# 7. Verify offline mode
# 8. Test on mobile viewport

# Run automated smoke tests
npm run smoke-test
```

---

### Step 4: Deploy to Firebase

```bash
# Deploy to production
firebase deploy --project production

# Or deploy specific services
firebase deploy --only hosting --project production
firebase deploy --only firestore:rules --project production
firebase deploy --only storage:rules --project production

# Monitor deployment
# Expected output:
# ✔ Deploy complete!
# Hosting URL: https://eyes-of-azrael.web.app
```

---

### Step 5: Upload Source Maps to Sentry

```bash
# Automatic via GitHub Actions on push to main
# Or manual upload:

npx @sentry/cli releases new 2.0.0
npx @sentry/cli releases files 2.0.0 upload-sourcemaps dist/js --url-prefix '~/js'
npx @sentry/cli releases finalize 2.0.0
npx @sentry/cli releases deploys 2.0.0 new -e production
```

---

### Step 6: Create Git Tag

```bash
# Tag the release
git tag -a v2.0.0-production-ready -m "Production deployment v2.0.0 - 16-agent enhancement"

# Push tag to GitHub
git push origin v2.0.0-production-ready

# Create GitHub Release
# Visit: https://github.com/yourusername/EyesOfAzrael/releases/new
# Tag: v2.0.0-production-ready
# Title: "v2.0.0: Production Polish - 16-Agent Deployment"
# Description: Copy from 16_AGENT_DEPLOYMENT_SUMMARY.md
```

---

## Verification Checklist

### Immediate Post-Deployment (0-5 minutes)

- [ ] **Site Accessible:** https://eyes-of-azrael.web.app loads
- [ ] **Home Page Loads:** No errors in browser console
- [ ] **Service Worker Registers:** Check DevTools → Application → Service Workers
- [ ] **Firebase Connects:** Database queries working
- [ ] **Authentication Works:** Can sign in with Google
- [ ] **PWA Installable:** "Add to Home Screen" prompt appears on mobile

### Core Functionality (5-15 minutes)

- [ ] **Search Works:** Can search for entities
- [ ] **Entity Pages Load:** Deity/hero pages render correctly
- [ ] **Compare Tool:** Can compare 2+ entities
- [ ] **User Dashboard:** Logged-in users see dashboard
- [ ] **Theme Toggle:** Dark/light mode switching works
- [ ] **Offline Mode:** Disconnect network → see offline page
- [ ] **Edit Functionality:** Can edit entities (if admin)
- [ ] **Theory Submission:** Can submit user theories

### Performance (15-30 minutes)

- [ ] **Lighthouse Score:** Run audit, expect 90+ for all metrics
  ```bash
  npm run lighthouse -- https://eyes-of-azrael.web.app
  ```
- [ ] **Page Load Time:** < 3s first load, < 1s cached
- [ ] **Image Loading:** All images load, lazy loading works
- [ ] **Mobile Performance:** Test on real mobile device
- [ ] **Service Worker Caching:** Repeat visits load from cache

### Monitoring (30-60 minutes)

- [ ] **Sentry Receiving Data:** Check Sentry dashboard for events
- [ ] **Google Analytics:** Real-time users showing
- [ ] **Firebase Console:** Check Firestore/Storage activity
- [ ] **No Critical Errors:** Sentry error rate < 0.1%
- [ ] **Performance Metrics:** Sentry performance tab shows data

### Accessibility (30-60 minutes)

- [ ] **Keyboard Navigation:** Tab through site without mouse
- [ ] **Screen Reader:** Test with NVDA/JAWS/VoiceOver
- [ ] **Color Contrast:** All text meets WCAG AA
- [ ] **Focus Indicators:** Visible focus states
- [ ] **ARIA Labels:** Semantic HTML and ARIA
  ```bash
  npm run test:accessibility
  ```

### Security (1-2 hours)

- [ ] **Firestore Rules:** Cannot write to unauthorized collections
- [ ] **Storage Rules:** Cannot upload without auth
- [ ] **XSS Protection:** User input sanitized
- [ ] **HTTPS Only:** All resources loaded over HTTPS
- [ ] **CSP Headers:** Content Security Policy active
  ```bash
  # Test unauthorized access
  # Try to write to Firestore without auth (should fail)
  ```

### Cross-Browser Testing

- [ ] **Chrome:** Latest version
- [ ] **Firefox:** Latest version
- [ ] **Safari:** Latest version (macOS/iOS)
- [ ] **Edge:** Latest version
- [ ] **Mobile Chrome:** Android
- [ ] **Mobile Safari:** iOS

---

## Rollback Procedures

### Scenario 1: Critical Bug Discovered

```bash
# Immediate rollback to previous version
firebase hosting:rollback --project production

# Verify rollback
curl https://eyes-of-azrael.web.app

# Expected: Previous version serving
```

### Scenario 2: Firestore Rules Issue

```bash
# Rollback Firestore rules only
firebase deploy --only firestore:rules --project production

# Restore from backup
# Edit firestore.rules to previous version
# Redeploy
```

### Scenario 3: Service Worker Caching Old Version

```javascript
// Update service-worker.js to force refresh
const CACHE_VERSION = 'v2.0.1-hotfix';

// Deploy update
firebase deploy --only hosting --project production

// Users will auto-update on next visit
```

### Scenario 4: Complete Rollback

```bash
# 1. Rollback hosting
firebase hosting:rollback --project production

# 2. Rollback Firestore rules
# (restore firestore.rules from git)
git checkout v1.9.0 -- firestore.rules
firebase deploy --only firestore:rules --project production

# 3. Rollback Storage rules
git checkout v1.9.0 -- storage.rules
firebase deploy --only storage:rules --project production

# 4. Notify users (if needed)
# Post notification in app or via email

# 5. Create incident report
# Document in Sentry or GitHub Issues
```

### Emergency Contact

```
Primary: Andrew Keith Watts
Email: AndrewKWatts@Gmail.com
Phone: [Add if needed]

Firebase Support: https://firebase.google.com/support
Sentry Support: https://sentry.io/support
```

---

## Post-Deployment Monitoring

### First 24 Hours

**Hourly Checks:**
- Sentry error dashboard
- Google Analytics real-time users
- Firebase Console → Performance
- Social media mentions/support requests

**Metrics to Watch:**
- Error rate (target: < 0.1%)
- Page load time (target: < 3s)
- Active users (compare to baseline)
- Conversion rate (sign-ups, submissions)

### First Week

**Daily Checks:**
- Review new Sentry issues
- Check performance trends
- Monitor user feedback
- Review analytics data

**Weekly Tasks:**
- Team retrospective
- Update documentation
- Plan hot fixes if needed
- Gather user feedback

### First Month

**Weekly Reports:**
- User growth metrics
- Performance benchmarks
- Error resolution status
- Feature adoption rates

**Monthly Review:**
- Full analytics review
- Performance optimization opportunities
- User feedback themes
- Feature roadmap updates

---

## Monitoring Dashboards

### Sentry Dashboard
```
URL: https://sentry.io/organizations/[org]/issues/

Key Metrics:
- Error count and trends
- Affected users
- Performance (TTFB, FCP, LCP)
- Session replays
- Release health

Alerts:
- Email: Critical errors
- Slack: High-impact errors
- PagerDuty: Production outages (if configured)
```

### Google Analytics
```
URL: https://analytics.google.com

Key Reports:
- Real-time: Active users now
- Acquisition: User sources
- Engagement: Pages and screens
- Monetization: N/A (free site)
- Retention: User retention

Custom Events:
- entity_view
- search_performed
- comparison_created
- theory_submitted
```

### Firebase Console
```
URL: https://console.firebase.google.com

Key Areas:
- Firestore: Read/write metrics
- Storage: Upload/download metrics
- Authentication: Sign-in metrics
- Hosting: Deployment history
- Performance: Web vitals
```

---

## Troubleshooting

### Issue: Service Worker Not Updating

**Symptoms:**
- Old version showing after deployment
- Changes not visible to users

**Solution:**
```javascript
// 1. Update service worker version
// File: service-worker.js
const CACHE_VERSION = 'v2.0.1'; // Increment version

// 2. Force update
// In browser console:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
location.reload(true);

// 3. Redeploy
firebase deploy --only hosting --project production
```

---

### Issue: Sentry Not Receiving Errors

**Symptoms:**
- No errors in Sentry dashboard
- DSN configured but silent

**Diagnosis:**
```javascript
// 1. Check browser console for Sentry errors
// 2. Verify DSN is correct
// 3. Check environment setting

// Test Sentry manually:
import { captureMessage } from './js/error-monitoring.js';
captureMessage('Test message from production', 'info');

// Should appear in Sentry within 30 seconds
```

**Common Causes:**
- DSN incorrect or missing
- Environment set to 'development' on production
- Ad blockers blocking Sentry requests
- Network/firewall issues

---

### Issue: Firebase Rules Denying Legitimate Access

**Symptoms:**
- Users cannot read public data
- Auth users cannot write own data

**Diagnosis:**
```bash
# Test rules in Firebase Console
# Firestore → Rules → Rules Playground

# Test read (should succeed):
Location: /deities/zeus
Auth: Not authenticated
Operation: get

# Test write (should fail):
Location: /theories/test-id
Auth: Not authenticated
Operation: create

# Test auth write (should succeed):
Location: /theories/test-id
Auth: Authenticated as uid:12345
Field: uid = "12345"
Operation: create
```

---

### Issue: Images Not Loading

**Symptoms:**
- Broken image icons
- 404 errors in console

**Diagnosis:**
```bash
# Check Storage rules
firebase deploy --only storage:rules --project production

# Verify images uploaded
firebase storage:ls gs://eyes-of-azrael-production.appspot.com/icons/

# Check CORS configuration
gsutil cors get gs://eyes-of-azrael-production.appspot.com
```

---

### Issue: Analytics Not Tracking

**Symptoms:**
- No users in GA4 real-time
- Events not appearing

**Diagnosis:**
```javascript
// 1. Check measurement ID
console.log(analytics.measurementId);

// 2. Verify gtag.js loaded
console.log(window.gtag);

// 3. Send test event
gtag('event', 'test_event', {
  'category': 'test',
  'label': 'manual_test',
});

// 4. Check Network tab for analytics requests
// Should see POST to www.google-analytics.com/g/collect
```

---

## Success Criteria

Deployment considered successful when:

- [ ] **Uptime:** 100% for first 24 hours
- [ ] **Error Rate:** < 0.1% of sessions
- [ ] **Performance:** Lighthouse score 90+ (all metrics)
- [ ] **User Growth:** Baseline or positive trend
- [ ] **No Critical Bugs:** Zero P0/P1 issues
- [ ] **Monitoring Active:** Sentry + GA4 + Firebase all reporting
- [ ] **User Feedback:** Positive sentiment or minimal complaints
- [ ] **Rollback Not Required:** Deployment stable

---

## Documentation Updates Post-Deployment

After successful deployment:

1. **Update README.md**
   - Version number
   - Production URL
   - New features list

2. **Create CHANGELOG.md Entry**
   ```markdown
   ## [2.0.0] - 2025-12-28

   ### Added (16-Agent Deployment)
   - Complete comparison tool
   - User dashboard
   - PWA support with offline mode
   - Error monitoring with Sentry
   - CI/CD pipeline
   - [Full list from 16_AGENT_DEPLOYMENT_SUMMARY.md]

   ### Changed
   - Performance improvements (80-90% faster)
   - Enhanced accessibility (WCAG 2.1 AA)

   ### Fixed
   - [List any bugs fixed]
   ```

3. **Archive Deployment Report**
   ```bash
   mv 16_AGENT_DEPLOYMENT_SUMMARY.md docs/archive/
   mv PRODUCTION_DEPLOYMENT_GUIDE.md docs/archive/
   ```

4. **Create Incident Log Template**
   ```markdown
   # Production Incident Log

   ## 2025-12-28: v2.0.0 Deployment
   - Start: 10:00 AM PST
   - End: 10:45 AM PST
   - Status: SUCCESS
   - Issues: None
   - Rollbacks: 0
   ```

---

## Appendix: Useful Commands

### Firebase
```bash
# Check deployment status
firebase hosting:channel:list --project production

# View logs
firebase functions:log --project production

# Open console
firebase open hosting --project production
```

### Sentry
```bash
# List releases
npx @sentry/cli releases list

# View release details
npx @sentry/cli releases info 2.0.0

# Delete release (if needed)
npx @sentry/cli releases delete 2.0.0
```

### Analytics
```bash
# No CLI - Use web interface
open https://analytics.google.com
```

### Git
```bash
# View deployment tags
git tag -l "v*"

# Checkout specific version
git checkout v2.0.0-production-ready

# Create hotfix branch
git checkout -b hotfix/2.0.1 v2.0.0-production-ready
```

---

## Contact & Support

**Primary Contact:**
- Andrew Keith Watts
- Email: AndrewKWatts@Gmail.com

**External Support:**
- Firebase: https://firebase.google.com/support
- Sentry: https://sentry.io/support
- GitHub: https://support.github.com

**Internal Documentation:**
- Repository: https://github.com/yourusername/EyesOfAzrael
- Wiki: [Add if exists]
- Slack: #eyes-of-azrael (if team channel exists)

---

**Document Version:** 1.0
**Last Updated:** December 28, 2025
**Next Review:** Post-deployment (1 week)

**Deployment Status:** READY FOR EXECUTION
