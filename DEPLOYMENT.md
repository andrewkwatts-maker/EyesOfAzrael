# Eyes of Azrael - Deployment Guide

Complete guide for deploying Eyes of Azrael to Firebase Hosting with automated CI/CD.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Deployment Process](#deployment-process)
5. [CI/CD Configuration](#cicd-configuration)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### One-Command Deployment

```bash
# Production deployment
./deploy.sh

# Staging deployment
./deploy.sh staging

# Skip tests (use with caution)
./deploy.sh production true
```

### Individual Scripts

```bash
# Build for production
./build.sh

# Run all tests
./test.sh

# Emergency rollback
./rollback.sh
```

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase --version
   ```

4. **Git**
   ```bash
   git --version
   ```

### Optional Tools

- **ImageMagick** (for image optimization)
  - Linux: `sudo apt-get install imagemagick`
  - Mac: `brew install imagemagick`
  - Windows: Download from https://imagemagick.org

- **Lighthouse CLI** (for performance testing)
  ```bash
  npm install -g @lhci/cli
  ```

---

## Environment Setup

### 1. Firebase Project Setup

1. **Create Firebase Project** (if not already created)
   ```bash
   firebase login
   firebase projects:create eyes-of-azrael
   ```

2. **Initialize Firebase in your project**
   ```bash
   firebase init
   ```
   Select:
   - Hosting
   - Firestore
   - Storage
   - Functions (optional)

3. **Link to Firebase Project**
   ```bash
   firebase use eyes-of-azrael
   ```

### 2. Environment Variables

Create a `.env` file (not committed to git):

```bash
# Firebase Configuration
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Optional
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 3. Firebase Service Account (for CI/CD)

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Save as `service-account-key.json` (DO NOT COMMIT)
4. Add to GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT`

### 4. GitHub Secrets Configuration

Add these secrets to your GitHub repository:

```
Settings → Secrets and variables → Actions → New repository secret
```

Required secrets:
- `FIREBASE_SERVICE_ACCOUNT` - Service account JSON
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `GITHUB_TOKEN` - Automatically provided by GitHub

---

## Deployment Process

### Step-by-Step Manual Deployment

#### 1. Pre-Deployment Checklist

- [ ] All code committed to git
- [ ] On correct branch (main for production)
- [ ] Tests passing locally
- [ ] Firebase rules validated
- [ ] No console errors in browser
- [ ] Lighthouse score > 90
- [ ] Security audit passed
- [ ] Backup created

#### 2. Build Phase

```bash
./build.sh
```

This will:
- Validate dependencies
- Install npm packages
- Generate entity indices
- Validate Firebase assets
- Minify CSS files
- Minify JavaScript files
- Optimize images
- Generate build summary

Expected output:
```
========================================
Eyes of Azrael - Production Build
========================================

[1/8] Pre-build validation...
✓ Pre-build validation passed

[2/8] Installing dependencies...
✓ Dependencies installed

[3/8] Generating entity indices...
✓ Entity indices generated

[4/8] Validating Firebase assets...
✓ Firebase assets validated

[5/8] Minifying CSS files...
✓ Minified 15 CSS files

[6/8] Minifying JavaScript files...
✓ Minified 20 JavaScript files

[7/8] Optimizing images...
✓ Optimized 45 images

[8/8] Generating build summary...
========================================
Build Summary
========================================
HTML Files: 12.5 MB
CSS Files:  245.3 KB
JS Files:   189.7 KB
========================================

✓ Build completed successfully!
```

#### 3. Testing Phase

```bash
./test.sh
```

This will:
- Validate HTML structure
- Check JavaScript syntax
- Validate Firebase rules
- Validate entity data
- Check Firebase configuration
- Check for broken links
- Run security audit
- Check asset sizes
- Generate test report

Expected output:
```
========================================
Eyes of Azrael - Test Suite
========================================

[1/10] Validating HTML structure...
✓ HTML structure validation passed

[2/10] Checking JavaScript syntax...
✓ JavaScript validation passed

[3/10] Validating Firebase rules...
✓ Firestore rules validation passed
✓ Storage rules validation passed

...

========================================
Test Summary
========================================
✓ All critical tests passed!
✓ Ready for deployment
```

#### 4. Deployment Phase

```bash
./deploy.sh
```

This will:
- Run pre-deployment checks
- Create backup
- Run tests (unless skipped)
- Build for production
- Generate entity indices
- Validate Firebase configuration
- Deploy Firebase rules
- Deploy Firebase functions
- Deploy to Firebase Hosting
- Run post-deployment verification

Expected output:
```
╔════════════════════════════════════════╗
║   Eyes of Azrael - Deploy to Firebase ║
╚════════════════════════════════════════╝

Environment: production
Timestamp: 2025-12-27 10:30:00

[1/10] Pre-deployment checks...
✓ Pre-deployment checks passed

[2/10] Creating backup...
✓ Backup created: deploy-backup-20251227-103000

...

╔════════════════════════════════════════╗
║      Deployment Successful! 🚀         ║
╚════════════════════════════════════════╝

Deployment Details:
  Environment: production
  URL: https://eyes-of-azrael.web.app
  Backup: deploy-backup-20251227-103000
  Time: 2025-12-27 10:35:00

Next Steps:
  1. Verify deployment: https://eyes-of-azrael.web.app
  2. Run smoke tests: ./smoke-test.sh https://eyes-of-azrael.web.app
  3. Check monitoring: Firebase Console
  4. If issues: ./rollback.sh
```

### Automated Deployment (CI/CD)

#### GitHub Actions Workflow

Deployments are automatically triggered on:

1. **Push to main** → Deploy to production
2. **Pull request** → Deploy preview

The workflow:
1. Runs linting and validation
2. Runs security audit
3. Builds and tests
4. Runs Lighthouse performance tests (on PRs)
5. Deploys to Firebase
6. Sets up post-deployment monitoring

#### Monitoring GitHub Actions

1. Go to your repository on GitHub
2. Click "Actions" tab
3. View workflow runs
4. Click on a run to see detailed logs

---

## CI/CD Configuration

### GitHub Actions Workflows

#### Main Deployment Workflow (`.github/workflows/deploy.yml`)

Triggers:
- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

Jobs:
1. **Lint** - Code validation
2. **Security** - Security audit
3. **Build** - Build and test
4. **Lighthouse** - Performance testing (PRs only)
5. **Deploy Production** - Deploy to live site
6. **Deploy Preview** - Deploy PR preview
7. **Monitor** - Post-deployment monitoring

#### Test Workflow (`.github/workflows/tests.yml`)

Triggers:
- Push to `main` or `develop`
- Pull requests
- Daily at 2 AM UTC

Jobs:
1. Unit tests
2. Integration tests
3. Firebase emulator tests
4. Link validation
5. Performance tests
6. Accessibility tests

### Configuration Files

#### `firebase.json`

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600"
          }
        ]
      }
    ]
  }
}
```

#### `.firebaserc`

```json
{
  "projects": {
    "default": "eyes-of-azrael"
  }
}
```

---

## Rollback Procedures

### Quick Rollback

```bash
./rollback.sh
```

### Rollback Options

#### Option 1: Rollback to Previous Firebase Release

Fastest method - rolls back Firebase Hosting to the previous release.

```bash
# In rollback.sh, choose option 1
# Or manually:
firebase hosting:clone --previous
```

**Pros:**
- Instant rollback
- No build required
- Minimal downtime

**Cons:**
- Only rolls back hosting (not rules/functions)
- Limited to recent releases

#### Option 2: Restore from Local Backup

Restores from a backup created during deployment.

```bash
# In rollback.sh, choose option 2
# Then enter backup directory name
```

**Pros:**
- Complete restoration
- Includes all assets and configuration
- Can restore rules and functions

**Cons:**
- Requires backup to exist
- Needs rebuild and redeploy
- Takes longer

#### Option 3: Deploy from Specific Git Commit

Redeploys from a known good commit.

```bash
# In rollback.sh, choose option 3
# Then enter git commit hash
```

**Pros:**
- Can go back to any point in history
- Creates rollback branch for tracking
- Full control over deployment

**Cons:**
- Requires rebuild
- Longest rollback time
- May need dependency updates

### Manual Rollback Steps

1. **Identify the Issue**
   ```bash
   # Check Firebase hosting releases
   firebase hosting:releases:list
   ```

2. **Create Rollback Plan**
   - Document current state
   - Identify target release/commit
   - Notify team

3. **Execute Rollback**
   ```bash
   ./rollback.sh
   ```

4. **Verify Rollback**
   - Check site functionality
   - Review error logs
   - Test critical paths

5. **Post-Rollback**
   - Document what went wrong
   - Update tests to catch issue
   - Plan fix for next deployment

---

## Monitoring & Analytics

### Firebase Performance Monitoring

#### Setup

1. **Enable Performance Monitoring**
   ```javascript
   // In your firebase-config.js
   import { getPerformance } from 'firebase/performance';
   const perf = getPerformance(app);
   ```

2. **Track Custom Metrics**
   ```javascript
   const trace = perf.trace('page_load');
   trace.start();
   // ... page load
   trace.stop();
   ```

#### View Performance Data

1. Go to Firebase Console
2. Navigate to Performance
3. View:
   - Page load times
   - Network requests
   - Custom traces

### Google Analytics

#### Setup

1. **Add Analytics to Firebase**
   ```bash
   firebase init analytics
   ```

2. **Configure in HTML**
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

#### Track Custom Events

```javascript
gtag('event', 'entity_view', {
  'event_category': 'engagement',
  'event_label': 'deity',
  'value': 'Zeus'
});
```

### Error Tracking

#### Firebase Crashlytics (for errors)

1. **Setup**
   ```javascript
   import { getAnalytics, logEvent } from 'firebase/analytics';

   window.addEventListener('error', (event) => {
     logEvent(analytics, 'exception', {
       description: event.message,
       fatal: false
     });
   });
   ```

2. **View Errors**
   - Firebase Console → Crashlytics
   - View error reports and stack traces

### Uptime Monitoring

#### Option 1: UptimeRobot (Free)

1. Sign up at https://uptimerobot.com
2. Add monitor for your site
3. Configure alerts (email/SMS)

#### Option 2: Firebase Hosting Status

```bash
# Check Firebase status
firebase hosting:status
```

### Custom Monitoring Dashboard

Create a monitoring dashboard page:

```html
<!-- monitoring-dashboard.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Monitoring Dashboard</title>
</head>
<body>
    <h1>Eyes of Azrael - Monitoring</h1>

    <div class="metrics">
        <div class="metric">
            <h2>Uptime</h2>
            <p id="uptime">99.9%</p>
        </div>

        <div class="metric">
            <h2>Avg Load Time</h2>
            <p id="load-time">1.2s</p>
        </div>

        <div class="metric">
            <h2>Error Rate</h2>
            <p id="error-rate">0.1%</p>
        </div>
    </div>

    <script>
        // Fetch metrics from Firebase Performance
        // Update dashboard
    </script>
</body>
</html>
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails - "Firebase CLI not found"

**Solution:**
```bash
npm install -g firebase-tools
firebase login
```

#### 2. Tests Fail - "Entity indices not found"

**Solution:**
```bash
npm run generate-indices
```

#### 3. Build Fails - Missing dependencies

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 4. Firebase Rules Deployment Fails

**Solution:**
```bash
# Validate rules locally
firebase deploy --only firestore:rules --dry-run

# Check rules syntax
cat firestore.rules
```

#### 5. Performance Issues After Deployment

**Checklist:**
- [ ] Images optimized?
- [ ] CSS/JS minified?
- [ ] Cache headers configured?
- [ ] CDN enabled?
- [ ] Lighthouse score check

**Solution:**
```bash
# Run performance tests
npm install -g lighthouse
lighthouse https://your-site.web.app --view
```

#### 6. Broken Links After Deployment

**Solution:**
```bash
# Check for broken links
./test.sh

# Or manually check specific pages
grep -r 'href="' index.html | grep -v 'http'
```

#### 7. Security Rules Too Permissive

**Solution:**
```javascript
// firestore.rules - Tighten security
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }

    // Specific rules
    match /entities/{entity} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Getting Help

1. **Check Logs**
   ```bash
   # Firebase logs
   firebase functions:log

   # GitHub Actions logs
   # Go to GitHub → Actions → Select run
   ```

2. **Firebase Support**
   - Firebase Console → Support
   - Firebase Community: https://firebase.google.com/community

3. **Documentation**
   - Firebase Docs: https://firebase.google.com/docs
   - GitHub Actions: https://docs.github.com/actions

---

## Best Practices

### Before Every Deployment

1. **Code Review**
   - All changes reviewed
   - No commented-out code
   - No console.log statements
   - No debugger statements

2. **Testing**
   - All tests passing
   - Manual testing completed
   - Cross-browser testing
   - Mobile testing

3. **Performance**
   - Lighthouse score > 90
   - Images optimized
   - Assets minified
   - Bundle size checked

4. **Security**
   - No exposed API keys
   - Security rules validated
   - npm audit clean
   - HTTPS enforced

### Deployment Timing

- **Avoid**: Fridays, end of day, holidays
- **Prefer**: Tuesday-Thursday, morning hours
- **Have**: Rollback plan ready
- **Monitor**: For 1 hour after deployment

### Version Control

```bash
# Tag releases
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Use semantic versioning
# MAJOR.MINOR.PATCH
# 1.0.0, 1.1.0, 1.1.1
```

---

## Appendix

### Useful Commands

```bash
# Firebase
firebase login                           # Login to Firebase
firebase projects:list                   # List projects
firebase use <project-id>               # Switch project
firebase serve                          # Test locally
firebase deploy                         # Deploy all
firebase deploy --only hosting          # Deploy hosting only
firebase hosting:channel:deploy staging # Deploy to staging

# Git
git status                              # Check status
git log --oneline -10                  # Recent commits
git tag                                # List tags
git checkout -b feature/new-feature    # Create branch

# npm
npm install                            # Install dependencies
npm run generate-indices               # Generate entity indices
npm audit                             # Check for vulnerabilities
npm outdated                          # Check for updates

# Testing
./build.sh                            # Build
./test.sh                             # Test
./deploy.sh                           # Deploy
./rollback.sh                         # Rollback
```

### File Structure

```
EyesOfAzrael/
├── .github/
│   └── workflows/
│       ├── deploy.yml                 # Main deployment workflow
│       └── tests.yml                  # Test workflow
├── data/
│   ├── entities/                      # Entity data
│   └── indices/                       # Generated indices
├── FIREBASE/
│   ├── data/                          # Firebase data
│   └── functions/                     # Cloud functions
├── css/                               # Stylesheets
├── js/                                # JavaScript
├── firebase.json                      # Firebase config
├── firestore.rules                    # Firestore security rules
├── storage.rules                      # Storage security rules
├── build.sh                           # Build script
├── test.sh                            # Test script
├── deploy.sh                          # Deployment script
├── rollback.sh                        # Rollback script
└── DEPLOYMENT.md                      # This file
```

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_API_KEY` | Firebase API key | Yes |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket | Yes |
| `FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | No |
| `FIREBASE_APP_ID` | Firebase app ID | Yes |
| `FIREBASE_MEASUREMENT_ID` | Analytics measurement ID | No |
| `NODE_ENV` | Environment (production/development) | No |

---

## Support

For issues or questions:
1. Check this documentation
2. Review Firebase documentation
3. Check GitHub Issues
4. Contact development team

**Last Updated:** 2025-12-27
**Version:** 1.0.0
