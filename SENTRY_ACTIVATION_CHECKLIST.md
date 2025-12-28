# 🚀 Sentry Activation Checklist

**Complete these steps to activate error monitoring**

---

## ⏱️ Time Required: 30 Minutes

---

## 📋 Step-by-Step Activation

### ✅ Step 1: Create Sentry Account (5 min)

```
1. Go to: https://sentry.io/signup/
2. Sign up with GitHub or email
3. Choose organization name: "eyes-of-azrael" (or similar)
4. Confirm email address
```

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### ✅ Step 2: Create Sentry Project (3 min)

```
1. Click "Create Project"
2. Platform: Browser JavaScript
3. Project Name: eyes-of-azrael
4. Alert Frequency: Default
5. Click "Create Project"
```

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### ✅ Step 3: Get Your DSN (2 min)

```
1. After project creation, copy the DSN shown
   Format: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

2. Or navigate to:
   Settings → Projects → eyes-of-azrael → Client Keys (DSN)

3. Copy the "DSN" value
```

**Your DSN**: _______________________________________________

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### ✅ Step 4: Update Configuration (2 min)

```javascript
// File: js/error-monitoring.js
// Line: ~29

// BEFORE:
dsn: 'YOUR_SENTRY_DSN_HERE',

// AFTER:
dsn: 'https://xxxxx@xxxxx.ingest.sentry.io/xxxxx',  // ← Paste your DSN here
```

**Files to Update**:
- [ ] `js/error-monitoring.js` (line 29)

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### ✅ Step 5: Test Integration (5 min)

```javascript
// 1. Open your application in a browser
// 2. Open browser console (F12)
// 3. Run this command:

import { captureMessage } from './js/error-monitoring.js';
captureMessage('🎉 Sentry setup test - SUCCESS!', 'info');

// 4. Check Sentry dashboard → Issues
// 5. You should see your test message within 30 seconds
```

**Test Results**:
- [ ] Message sent from browser
- [ ] Message appears in Sentry dashboard
- [ ] User context included (if logged in)
- [ ] Breadcrumbs visible

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### ✅ Step 6: Create Sentry Auth Token (3 min)

```
1. In Sentry, go to: Settings → Account → API → Auth Tokens
2. Click "Create New Token"
3. Name: "GitHub Actions - Eyes of Azrael"
4. Scopes (select these):
   ☑️ project:read
   ☑️ project:releases
   ☑️ org:read
5. Click "Create Token"
6. Copy the token (you won't see it again!)
```

**Your Token**: _______________________________________________

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### ✅ Step 7: Add GitHub Secrets (5 min)

```
1. Go to your GitHub repository
2. Navigate to: Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add THREE secrets:

Secret 1:
   Name: SENTRY_AUTH_TOKEN
   Value: [Paste token from Step 6]

Secret 2:
   Name: SENTRY_ORG
   Value: [Your org slug, e.g., "eyes-of-azrael"]

Secret 3:
   Name: SENTRY_PROJECT
   Value: eyes-of-azrael
```

**GitHub Secrets Added**:
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `SENTRY_ORG`
- [ ] `SENTRY_PROJECT`

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### ✅ Step 8: Configure Alerts (5 min)

```
In Sentry Dashboard:

1. Go to: Alerts → Create Alert Rule

Alert 1: High Error Rate
   When: an issue is seen more than 10 times in 1 minute
   Then: Send notification via email
   ☑️ Create

Alert 2: New Issue
   When: a new issue is created
   Then: Send notification via email
   ☑️ Create

Alert 3: High User Impact
   When: an issue affects more than 100 users
   Then: Send notification via email
   ☑️ Create
```

**Alerts Configured**:
- [ ] High error rate alert
- [ ] New issue alert
- [ ] High user impact alert

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### ✅ Step 9: Deploy to Staging/Production (3 min)

```bash
# 1. Commit your changes
git add js/error-monitoring.js
git commit -m "Configure Sentry error monitoring"

# 2. Push to staging or main branch
git push origin main

# 3. GitHub Actions will automatically:
#    - Build the project
#    - Upload source maps to Sentry
#    - Create a release
#    - Track the deployment
```

**Deployment**:
- [ ] Changes committed
- [ ] Changes pushed
- [ ] GitHub Actions workflow ran
- [ ] Source maps uploaded (check workflow logs)

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### ✅ Step 10: Verify Everything Works (5 min)

```
Production Verification:

1. Visit your production site
2. Check browser console for:
   [Error Monitoring] Sentry initialized successfully

3. Trigger a test error (if safe):
   throw new Error('Test production error monitoring');

4. Check Sentry dashboard:
   ✓ Error appears
   ✓ Stack trace readable (source maps working)
   ✓ User context included
   ✓ Breadcrumbs showing user journey

5. Test feedback widget:
   ✓ Click feedback button
   ✓ Submit feedback
   ✓ Check Sentry for feedback message
```

**Verification Results**:
- [ ] Sentry initialized in production
- [ ] Test error captured
- [ ] Source maps working
- [ ] User context present
- [ ] Breadcrumbs recorded
- [ ] Feedback widget working

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## 🎉 Activation Complete!

### ✅ Final Checklist

- [ ] Sentry account created
- [ ] Project created
- [ ] DSN configured in code
- [ ] Integration tested
- [ ] Auth token created
- [ ] GitHub secrets added
- [ ] Alerts configured
- [ ] Deployed to production
- [ ] Everything verified
- [ ] Team notified

**Total Time**: ________ minutes

**Activated By**: ________________

**Date**: ________________

---

## 📊 Post-Activation Tasks

### Daily
- [ ] Check Sentry dashboard for new errors
- [ ] Review and triage P0/P1 issues

### Weekly
- [ ] Review error trends
- [ ] Update ignore patterns if needed
- [ ] Check quota usage
- [ ] Team sync on major issues

### Monthly
- [ ] Post-mortem for critical incidents
- [ ] Review alert rules
- [ ] Analyze performance trends
- [ ] Team training/knowledge share

---

## 🆘 Troubleshooting

### Issue: Errors not showing in Sentry

**Possible Causes**:
1. DSN not configured correctly
2. Testing on localhost (monitoring disabled)
3. Browser blocking Sentry requests
4. Ad blocker interfering

**Solutions**:
```javascript
// Check if Sentry is initialized
console.log('Sentry:', window.Sentry);

// Check current environment
console.log('Hostname:', window.location.hostname);

// Test manually
captureMessage('Manual test', 'info');
```

---

### Issue: Source maps not working

**Possible Causes**:
1. GitHub secrets not configured
2. Workflow didn't run
3. Release name mismatch

**Solutions**:
```bash
# Check if source maps uploaded
sentry-cli releases files <commit-sha> list

# Verify release in Sentry dashboard
# Settings → Releases

# Check GitHub Actions workflow logs
```

---

### Issue: Too many events (quota exceeded)

**Solutions**:
```javascript
// In js/error-monitoring.js, adjust sampling:

// Reduce transaction sampling
tracesSampleRate: 0.1,  // 10% instead of 20%

// Reduce session replay
replaysSessionSampleRate: 0.05,  // 5% instead of 10%

// Add more errors to ignore list
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Network request failed',
  'Your pattern here',
]
```

---

## 📞 Need Help?

### Documentation
- **Setup Guide**: `SENTRY_SETUP.md`
- **Full Guide**: `ERROR_MONITORING_GUIDE.md`
- **Quick Reference**: `SENTRY_QUICK_REFERENCE.md`
- **Architecture**: `ERROR_MONITORING_ARCHITECTURE.md`

### Support
- **Sentry Docs**: https://docs.sentry.io
- **Community**: https://forum.sentry.io
- **Status Page**: https://status.sentry.io
- **Support Email**: support@sentry.io (paid plans)

### Internal
- **GitHub Issues**: Tag with `[monitoring]`
- **Team Slack**: #engineering
- **DevOps Lead**: [Your contact]

---

## 🎓 Team Training

After activation, ensure all team members:

### Developers
- [ ] Read `ERROR_MONITORING_GUIDE.md`
- [ ] Know how to use `captureError()` and `addBreadcrumb()`
- [ ] Understand error boundaries
- [ ] Can access Sentry dashboard

### DevOps
- [ ] Understand alert rules
- [ ] Know incident response protocol
- [ ] Can access GitHub Actions
- [ ] Monitor dashboard daily

### Product/PM
- [ ] Understand error severity levels
- [ ] Review weekly metrics
- [ ] Participate in post-mortems

---

## 📈 Success Metrics

### After 1 Week
- [ ] At least 1 error captured
- [ ] Source maps working
- [ ] No quota issues
- [ ] Team comfortable with dashboard

### After 1 Month
- [ ] Error rate trending down
- [ ] Average fix time < 24 hours
- [ ] User feedback collected
- [ ] Post-mortem for major incidents

### After 3 Months
- [ ] <0.1% error rate
- [ ] 99.9%+ crash-free rate
- [ ] Proactive issue detection
- [ ] Continuous improvement process

---

## ✨ You're Done!

Error monitoring is now **ACTIVE** and protecting your application.

Every error will be:
- ✅ Captured automatically
- ✅ Sent to Sentry
- ✅ Grouped with similar errors
- ✅ Prioritized by impact
- ✅ Alerted to the team
- ✅ Tracked until resolved

**Happy monitoring! 🎉**

---

**Checklist Version**: 1.0.0
**Last Updated**: 2024-01-28

