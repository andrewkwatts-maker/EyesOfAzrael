# CI/CD Complete Implementation Guide

## Table of Contents

1. [System Overview](#system-overview)
2. [Files Created](#files-created)
3. [Quick Commands](#quick-commands)
4. [Setup Instructions](#setup-instructions)
5. [Deployment Workflows](#deployment-workflows)
6. [GitHub Actions Configuration](#github-actions-configuration)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Troubleshooting](#troubleshooting)

---

## System Overview

### What This System Does

✅ **Automated Deployment**
- One-command deployment to Firebase
- Automatic builds and optimizations
- Comprehensive pre-deployment testing
- Staging and production environments
- Emergency rollback capability

✅ **Continuous Integration**
- Automatic testing on every push
- Code quality checks
- Security audits
- Performance monitoring
- Preview deployments for PRs

✅ **Quality Assurance**
- Pre-deployment checklist
- Lighthouse performance tests
- Link validation
- Security scanning
- Asset optimization

✅ **Monitoring & Analytics**
- Firebase Performance Monitoring
- Google Analytics integration
- Error tracking (Sentry)
- Uptime monitoring
- Custom dashboards

---

## Files Created

### Deployment Scripts

| File | Purpose | Usage |
|------|---------|-------|
| `build.sh` | Build and optimize for production | `./build.sh` |
| `test.sh` | Run comprehensive test suite | `./test.sh` |
| `deploy.sh` | One-command deployment | `./deploy.sh` |
| `rollback.sh` | Emergency rollback | `./rollback.sh` |
| `smoke-test.sh` | Post-deployment validation | `./smoke-test.sh URL` |

### GitHub Actions Workflows

| File | Purpose | Trigger |
|------|---------|---------|
| `.github/workflows/deploy.yml` | Main CI/CD pipeline | Push to main, PRs |
| `.github/workflows/tests.yml` | Automated testing | Push, PRs, daily |
| `.github/workflows/lighthouse.yml` | Performance monitoring | Push to main, PRs |

### Documentation

| File | Purpose |
|------|---------|
| `DEPLOYMENT.md` | Complete deployment guide (detailed) |
| `DEPLOYMENT_QUICK_START.md` | Quick reference guide |
| `monitoring-setup.md` | Monitoring and analytics setup |
| `PRE_DEPLOYMENT_CHECKLIST.md` | Quality assurance checklist |
| `AUTOMATION_SUMMARY.md` | System overview |
| `STATUS_BADGES.md` | GitHub badge templates |
| `CICD_COMPLETE_GUIDE.md` | This file |

### Updated Files

| File | Changes |
|------|---------|
| `package.json` | Added deployment scripts |

---

## Quick Commands

### NPM Scripts (Cross-Platform)

```bash
# Build
npm run build

# Test
npm run test

# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging

# Rollback
npm run rollback

# Smoke test
npm run smoke-test

# Serve locally
npm run serve

# Run Firebase emulators
npm run emulators
```

### Direct Shell Scripts (Linux/Mac/Git Bash)

```bash
# Build
./build.sh

# Test
./test.sh

# Deploy to production
./deploy.sh

# Deploy to staging
./deploy.sh staging

# Skip tests (emergency only)
./deploy.sh production true

# Rollback
./rollback.sh

# Smoke test
./smoke-test.sh https://your-site.web.app
```

### Firebase CLI Commands

```bash
# Login
firebase login

# List projects
firebase projects:list

# Use project
firebase use your-project-id

# Serve locally
firebase serve

# Deploy
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only functions

# View deployments
firebase hosting:releases:list

# Rollback to previous
firebase hosting:clone --previous

# Run emulators
firebase emulators:start
```

---

## Setup Instructions

### Prerequisites Installation

#### 1. Install Node.js (v18+)

**Windows:**
- Download from https://nodejs.org
- Install and verify: `node --version`

**Mac:**
```bash
brew install node
```

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase --version
```

#### 3. Install Git

**Windows:** Download from https://git-scm.com
**Mac:** `brew install git`
**Linux:** `sudo apt-get install git`

---

### Project Setup

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/EyesOfAzrael.git
cd EyesOfAzrael
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Login to Firebase

```bash
firebase login
```

#### 4. Initialize Firebase (if not already done)

```bash
firebase init

# Select:
# - Hosting
# - Firestore
# - Storage
# - Functions (optional)
```

#### 5. Link to Firebase Project

```bash
# Use existing project
firebase use --add

# Select your project
# Give it an alias (e.g., "production")
```

#### 6. Make Scripts Executable (Linux/Mac)

```bash
chmod +x build.sh test.sh deploy.sh rollback.sh smoke-test.sh
```

---

### GitHub Actions Setup

#### 1. Generate Firebase Service Account

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to: Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file (DO NOT commit to git)

#### 2. Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"

**Add these secrets:**

| Name | Value |
|------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Entire JSON content from step 1 |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub.

#### 3. Verify Workflows

1. Go to GitHub → Actions tab
2. You should see three workflows:
   - Deploy to Firebase
   - Tests
   - Lighthouse CI

---

## Deployment Workflows

### Workflow 1: Local Manual Deployment

**Use Case:** Testing, development, one-off deployments

```bash
# Step 1: Build
npm run build
# or: ./build.sh

# Step 2: Test
npm run test
# or: ./test.sh

# Step 3: Deploy
npm run deploy
# or: ./deploy.sh

# Step 4: Verify
npm run smoke-test
# or: ./smoke-test.sh https://your-site.web.app

# If issues:
npm run rollback
# or: ./rollback.sh
```

**Timeline:** ~5-10 minutes

---

### Workflow 2: GitHub Actions (Automated)

**Use Case:** Regular development workflow

#### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# ... edit files ...

# 3. Commit and push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature

# 4. Create Pull Request on GitHub
# GitHub Actions automatically:
#   - Runs tests
#   - Runs security audit
#   - Runs Lighthouse
#   - Deploys preview
#   - Comments PR with preview URL
```

#### Merge to Production

```bash
# 1. Review and approve PR on GitHub

# 2. Merge PR
# Click "Merge pull request"

# 3. GitHub Actions automatically:
#   - Runs full test suite
#   - Builds for production
#   - Deploys to Firebase
#   - Runs post-deployment monitoring
#   - Sends notifications
```

**Timeline:** ~3-5 minutes per deployment

---

### Workflow 3: Staging Deployment

**Use Case:** Test before production

```bash
# Deploy to staging
npm run deploy:staging
# or: ./deploy.sh staging

# Staging URL expires in 7 days
# Test thoroughly

# If good, deploy to production:
npm run deploy
# or: ./deploy.sh
```

**Timeline:** ~3-5 minutes

---

### Workflow 4: Emergency Rollback

**Use Case:** Critical issue in production

```bash
# Quick rollback
npm run rollback
# or: ./rollback.sh

# Choose rollback method:
# 1. Firebase Hosting (instant)
# 2. Local backup restore
# 3. Git commit rollback

# Verify rollback
npm run smoke-test
# or: ./smoke-test.sh https://your-site.web.app
```

**Timeline:** 1-5 minutes depending on method

---

## GitHub Actions Configuration

### Workflow 1: deploy.yml (Main CI/CD)

**Jobs:**

1. **Lint & Validate**
   - JSON validation
   - console.log detection
   - debugger detection

2. **Security Audit**
   - npm audit
   - Secret scanning
   - Firebase rules validation

3. **Build & Test**
   - Install dependencies
   - Generate entity indices
   - Run custom tests

4. **Lighthouse** (PRs only)
   - Performance testing
   - Accessibility testing
   - Best practices testing
   - SEO testing

5. **Deploy Production** (main only)
   - Build for production
   - Deploy to Firebase live
   - Create deployment record

6. **Deploy Preview** (PRs only)
   - Build for preview
   - Deploy to staging channel
   - Comment PR with URL

7. **Monitor** (after production deploy)
   - Setup monitoring
   - Send notifications

**Triggers:**
- Push to `main` → Production deployment
- Pull request → Preview deployment
- Manual dispatch

---

### Workflow 2: tests.yml (Testing)

**Jobs:**

1. Unit Tests
2. Integration Tests
3. Firebase Emulator Tests
4. Link Validation
5. Performance Tests
6. Accessibility Tests
7. Test Summary

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Daily at 2 AM UTC (scheduled)

---

### Workflow 3: lighthouse.yml (Performance)

**Jobs:**

1. Lighthouse CI
   - Run Lighthouse audit
   - Assert minimum scores (90+)
   - Comment PR with results

**Triggers:**
- Push to `main`
- Pull requests

---

## Monitoring & Analytics

### Firebase Performance Monitoring

**Setup:**

1. Add to your site:
```javascript
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

2. Track custom metrics:
```javascript
import { performanceMonitor } from './js/monitoring/performance.js';

const tracker = performanceMonitor.trackEntityLoad('deity', 'zeus');
// ... load entity
tracker.complete();
```

**View:**
- Firebase Console → Performance

---

### Google Analytics

**Setup:**

1. Create GA4 property
2. Get Measurement ID
3. Add to HTML:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

4. Track events:
```javascript
import { analytics } from './js/monitoring/analytics.js';

analytics.trackPageView('/mythos/greek/deities/zeus', 'Zeus');
analytics.trackSearch('thunder god', 42);
```

**View:**
- https://analytics.google.com

---

### Error Tracking (Sentry)

**Setup:**

1. Create Sentry account
2. Get DSN
3. Add to code:
```javascript
import Sentry from './js/monitoring/sentry-init.js';
```

4. Track errors:
```javascript
import { errorHandler } from './js/monitoring/error-handler.js';

errorHandler.handleFirebaseError(error, 'loadEntity');
```

**View:**
- https://sentry.io

---

### Uptime Monitoring

**Options:**

1. **UptimeRobot** (free)
   - Sign up at https://uptimerobot.com
   - Add HTTP monitor
   - Configure alerts

2. **Google Cloud Monitoring**
   - Enable in Google Cloud Console
   - Create uptime check
   - Configure alerting

3. **Custom Script**
   - Use provided `monitoring/uptime-check.js`
   - Run on server or cloud function

---

## Troubleshooting

### Build Issues

#### Problem: "npm: command not found"

**Solution:**
```bash
# Install Node.js (includes npm)
# See prerequisites section
```

---

#### Problem: "firebase: command not found"

**Solution:**
```bash
npm install -g firebase-tools
```

---

#### Problem: Build script fails

**Solution:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Try again
npm run build
```

---

### Test Issues

#### Problem: Tests fail

**Solution:**
```bash
# Check test output
npm run test

# Generate indices
npm run generate-indices

# Try again
npm run test
```

---

#### Problem: "Entity indices not found"

**Solution:**
```bash
npm run generate-indices
```

---

### Deployment Issues

#### Problem: "Not logged into Firebase"

**Solution:**
```bash
firebase login --reauth
```

---

#### Problem: "Permission denied"

**Solution:**
```bash
# Check you're using correct project
firebase use --list

# Switch project if needed
firebase use your-project-id

# Check your Firebase permissions in console
```

---

#### Problem: "Deployment fails"

**Solution:**
```bash
# Check Firebase status
firebase projects:list

# Try deploying specific services
firebase deploy --only hosting

# Check logs
firebase functions:log
```

---

### GitHub Actions Issues

#### Problem: "FIREBASE_SERVICE_ACCOUNT not found"

**Solution:**
1. Check GitHub Secrets are set
2. Verify JSON is complete (no truncation)
3. Regenerate service account if needed

---

#### Problem: "Workflow not triggering"

**Solution:**
1. Check workflow file syntax (.yml)
2. Verify triggers are correct
3. Check GitHub Actions is enabled
4. View workflow runs for errors

---

#### Problem: "Tests failing in CI but passing locally"

**Solution:**
1. Check Node.js version matches
2. Check environment variables
3. Review CI logs for specific errors
4. Test with `firebase emulators:start`

---

### Performance Issues

#### Problem: "Lighthouse score too low"

**Solution:**
```bash
# Check specific issues
npm install -g lighthouse
lighthouse https://your-site.web.app --view

# Optimize:
# - Minify CSS/JS (build.sh does this)
# - Optimize images
# - Reduce file sizes
# - Enable caching
```

---

#### Problem: "Site loading slowly"

**Solution:**
1. Check Firebase Performance monitoring
2. Optimize images
3. Enable caching headers (in firebase.json)
4. Minify assets (build.sh)
5. Use CDN for static assets

---

## Best Practices

### Before Every Deployment

1. ✅ Review changes
2. ✅ Run tests locally
3. ✅ Check Lighthouse score
4. ✅ Update changelog
5. ✅ Create git tag
6. ✅ Complete checklist

### During Deployment

1. ✅ Deploy to staging first
2. ✅ Test thoroughly
3. ✅ Monitor deployment
4. ✅ Verify smoke tests pass

### After Deployment

1. ✅ Monitor error logs (15 min)
2. ✅ Check analytics
3. ✅ Test critical paths
4. ✅ Document any issues
5. ✅ Update team

### Security

1. ✅ Never commit secrets
2. ✅ Use environment variables
3. ✅ Validate Firebase rules
4. ✅ Run security audits
5. ✅ Keep dependencies updated

### Performance

1. ✅ Optimize images
2. ✅ Minify CSS/JS
3. ✅ Enable caching
4. ✅ Monitor bundle sizes
5. ✅ Use lazy loading

---

## Checklists

### Quick Deployment Checklist

- [ ] Code committed to git
- [ ] Tests passing
- [ ] Build successful
- [ ] Lighthouse > 90
- [ ] No console errors
- [ ] Backup created
- [ ] Team notified

### Emergency Rollback Checklist

- [ ] Identify issue
- [ ] Notify team
- [ ] Run rollback script
- [ ] Verify rollback
- [ ] Check logs
- [ ] Document issue
- [ ] Plan fix

---

## Support Resources

### Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete guide
- [monitoring-setup.md](monitoring-setup.md) - Monitoring setup
- [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md) - Quick start
- [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) - QA checklist
- [AUTOMATION_SUMMARY.md](AUTOMATION_SUMMARY.md) - System overview

### External Resources

- Firebase: https://firebase.google.com/docs
- GitHub Actions: https://docs.github.com/actions
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- Sentry: https://docs.sentry.io

### Getting Help

1. Check documentation
2. Review logs
3. Check GitHub Issues
4. Firebase support
5. Contact development team

---

## Summary

✅ **Complete CI/CD system implemented**
- Automated deployment scripts
- GitHub Actions workflows
- Comprehensive testing
- Performance monitoring
- Error tracking
- Documentation

✅ **Ready to use**
- All scripts created
- Workflows configured
- Documentation complete
- Best practices included

✅ **Next steps**
1. Set up Firebase service account
2. Configure GitHub secrets
3. Test deployment to staging
4. Deploy to production
5. Set up monitoring

---

**Version:** 1.0.0
**Last Updated:** 2025-12-27
**Status:** ✅ Complete
