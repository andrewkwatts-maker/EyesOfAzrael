# Eyes of Azrael - Emergency Rollback Procedure

**Version:** 1.0
**Last Updated:** 2025-12-29
**Classification:** CRITICAL - Keep Updated
**Owner:** Andrew Watts (andrewkwatts@gmail.com)

---

## Quick Reference

**When to Rollback:**
- 🚨 Security breach detected
- 🚨 Data loss occurring
- 🚨 Site completely down >10 minutes
- 🚨 >10% error rate sustained
- 🚨 Critical bug affecting all users
- ⚠️ Performance degradation >50%
- ⚠️ Auth system failure

**Rollback Time:** 5-30 minutes (depending on issue)

**Emergency Contact:** andrewkwatts@gmail.com

---

## Severity Levels

### 🔴 CRITICAL - Immediate Rollback Required

**Indicators:**
- Security vulnerability actively exploited
- Data being corrupted or deleted
- All users unable to access site
- Authentication completely broken
- Firestore rules allowing unauthorized access

**Action:** ROLLBACK IMMEDIATELY (do not investigate first)

**Response Time:** <5 minutes

---

### 🟠 HIGH - Rollback Recommended

**Indicators:**
- >10% error rate (check Sentry)
- Major feature completely broken (voting, submissions)
- Performance >50% slower than baseline
- Firestore costs spiking unexpectedly (>$100/day)

**Action:** Rollback within 30 minutes OR hotfix if trivial

**Response Time:** <30 minutes

---

### 🟡 MEDIUM - Hotfix Preferred

**Indicators:**
- 5-10% error rate
- Single feature broken (affects subset of users)
- Performance 20-50% slower
- UI rendering issues (not blocking functionality)

**Action:** Attempt hotfix, rollback if fix takes >1 hour

**Response Time:** <1 hour

---

### 🟢 LOW - Monitor and Fix

**Indicators:**
- <5% error rate
- Minor visual bugs
- Performance <20% slower
- Isolated user reports

**Action:** Create bug ticket, fix in next deployment

**Response Time:** <24 hours

---

## Rollback Methods

### Method 1: Firebase Hosting Rollback (Fastest - 2 minutes)

**Use When:**
- Issue is in frontend code (HTML/JS/CSS)
- Firestore data is intact
- No Firestore rules changes involved

**Steps:**

```bash
# 1. Open terminal
cd /h/Github/EyesOfAzrael

# 2. List recent deployments
firebase hosting:channel:list

# Output will show:
# live (current) - deployed 10 minutes ago
# previous deployment IDs

# 3. Rollback to previous deployment
firebase hosting:rollback

# 4. Verify rollback
# Visit site in incognito window
# Test critical functionality:
#   - Homepage loads
#   - Browse deities works
#   - Login works
#   - Voting works

# 5. Monitor
# Check Sentry dashboard - error rate should drop
# Check Google Analytics - traffic should stabilize
# Check Firebase Console - usage should normalize
```

**Time Estimate:** 2-5 minutes

**Verification:**
- [ ] Site loads without errors
- [ ] Critical features work
- [ ] Error rate <5%
- [ ] No console errors

---

### Method 2: Git Revert + Redeploy (Medium - 10 minutes)

**Use When:**
- Hosting rollback doesn't work
- Need to rollback to specific commit
- Want more control over what's reverted

**Steps:**

```bash
# 1. Identify problematic commit
git log --oneline -10

# Output:
# abc1234 Fix voting bug (BAD - current)
# def5678 Add new feature (GOOD - last known good)
# ghi9012 Update icons

# 2. Create rollback branch
git checkout -b rollback-emergency

# 3. Revert to last known good commit
git reset --hard def5678

# 4. Verify locally (IMPORTANT)
# Open index.html in browser
# Test critical paths
# Check console for errors

# 5. Deploy
firebase deploy --only hosting

# 6. Monitor deployment
# Wait 2-3 minutes for propagation
# Test in incognito
# Check error rates

# 7. Tag rollback for record
git tag -a rollback-$(date +%Y%m%d-%H%M) -m "Emergency rollback from abc1234"
git push origin --tags
```

**Time Estimate:** 10-15 minutes

**Verification:**
- [ ] Local testing passes
- [ ] Deployment successful
- [ ] Site stable for 10 minutes
- [ ] Error rate normal

---

### Method 3: Firestore Rules Rollback (Critical - 5 minutes)

**Use When:**
- Security breach via Firestore rules
- Rules causing access denied errors
- Rules causing unexpected costs (too permissive)

**Steps:**

```bash
# 1. Immediately deploy safe ruleset
# Keep a copy of minimal-secure-rules.txt

# Option A: Deploy minimal restrictive rules
cat > temp-firestore.rules <<EOF
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == 'andrewkwatts@gmail.com';
    }
  }
}
EOF

firebase deploy --only firestore:rules --file temp-firestore.rules

# Option B: Rollback to previous rules version
# Download from Firebase Console → Firestore → Rules → History
# Copy previous working version
firebase deploy --only firestore:rules

# 2. Verify rules active
# Firebase Console → Firestore → Rules
# Check "Published" timestamp

# 3. Test access
# Try read operation (should work)
# Try write operation as regular user (should fail)
# Try write as admin (should work)

# 4. Investigate issue
# Review error logs
# Check what changed
# Plan fix

# 5. Deploy proper fix
# Once identified and tested
firebase deploy --only firestore:rules
```

**Time Estimate:** 5 minutes

**Verification:**
- [ ] Rules deployed (<1 min)
- [ ] Read access works for all
- [ ] Write access restricted
- [ ] No security vulnerability

---

### Method 4: Firestore Data Rollback (Extreme - 30-60 minutes)

**Use When:**
- Data corruption detected
- Mass deletion of data
- Catastrophic database issue

**WARNING:** This is a last resort. Data loss may occur.

**Steps:**

```bash
# 1. STOP ALL WRITES IMMEDIATELY
# Deploy read-only Firestore rules:

cat > emergency-readonly.rules <<EOF
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if false;  // ALL WRITES BLOCKED
    }
  }
}
EOF

firebase deploy --only firestore:rules --file emergency-readonly.rules

# 2. Export current state (even if corrupted - for forensics)
gcloud firestore export gs://eyesofazrael-backups/emergency-$(date +%Y%m%d-%H%M)

# Wait for export to complete (check Firebase Console)

# 3. Identify last good backup
gsutil ls gs://eyesofazrael-backups/

# Output:
# gs://eyesofazrael-backups/2025-12-28-daily/
# gs://eyesofazrael-backups/2025-12-29-daily/
# gs://eyesofazrael-backups/emergency-20251229-1430/

# 4. Restore from last good backup
gcloud firestore import gs://eyesofazrael-backups/2025-12-28-daily

# Wait for import to complete (30-60 min for large datasets)
# Monitor: Firebase Console → Firestore → Import/Export

# 5. Verify data integrity
# Spot check 20 entities:
#   - Deities count matches expected
#   - User accounts intact
#   - Submissions present
#   - Votes accurate

# 6. Re-enable writes (deploy normal rules)
firebase deploy --only firestore:rules

# 7. Notify users
# Email: "Due to a technical issue, data from [time] to [time] has been restored to a backup. Any changes during this window are lost. We apologize for the inconvenience."
```

**Time Estimate:** 30-90 minutes (depending on database size)

**Data Loss:** All changes between backup and restore time

**Verification:**
- [ ] Data counts match expected
- [ ] Spot check 20 entities
- [ ] User accounts intact
- [ ] No corruption visible

---

## Post-Rollback Actions

### Immediate (Within 5 Minutes)

- [ ] **Verify Stability**
  - Site loads correctly
  - Critical features work
  - Error rate <5%
  - No console errors

- [ ] **Monitor Dashboards**
  - Sentry: Error rate dropping
  - Google Analytics: Traffic normal
  - Firebase Console: Usage stable

- [ ] **Update Status** (if public-facing)
  - Post on status page (if exists)
  - Tweet/social media update
  - Email affected users (if major)

### Short-Term (Within 1 Hour)

- [ ] **Root Cause Analysis**
  - Review error logs (Sentry)
  - Check recent commits (`git log`)
  - Identify exact cause
  - Document findings

- [ ] **Create Hotfix Branch**
  ```bash
  git checkout main
  git pull
  git checkout -b hotfix/issue-description
  ```

- [ ] **Develop Fix**
  - Fix the root cause
  - Test thoroughly locally
  - Write test to prevent recurrence
  - Code review (if team)

- [ ] **Test Hotfix**
  - Local testing
  - Test in Firebase emulator (if applicable)
  - Verify fix doesn't break other features

### Medium-Term (Within 24 Hours)

- [ ] **Deploy Fix**
  ```bash
  # From hotfix branch
  git add .
  git commit -m "Hotfix: [description]"
  firebase deploy

  # Tag release
  git tag -a v1.0.1-hotfix -m "Hotfix: [description]"
  git push origin hotfix/issue-description --tags

  # Merge to main
  git checkout main
  git merge hotfix/issue-description
  git push origin main
  ```

- [ ] **Verify Fix**
  - Monitor for 1 hour
  - Check error rates
  - Confirm issue resolved

- [ ] **Incident Report**
  - What happened
  - Why it happened
  - How it was fixed
  - How to prevent recurrence
  - Share with team (if applicable)

- [ ] **Update Monitoring**
  - Add alert for similar issue
  - Improve error detection
  - Update rollback docs if needed

---

## Prevention Strategies

### Before Every Deployment

- [ ] **Test Locally**
  - Run all validation scripts
  - Test critical user flows
  - Check console for errors

- [ ] **Backup Current State**
  ```bash
  gcloud firestore export gs://eyesofazrael-backups/pre-deploy-$(date +%Y%m%d-%H%M)
  ```

- [ ] **Tag Release**
  ```bash
  git tag -a v1.0.x -m "Deployment: [features]"
  git push origin --tags
  ```

- [ ] **Deploy to Staging First** (if exists)
  - Test on staging
  - Run smoke tests
  - Deploy to production only if stable

### Monitoring Alerts

**Set up alerts for:**
- Error rate >5% (Sentry)
- Response time >5s (Firebase Performance)
- Firestore costs >$10/day (Firebase Billing)
- Site down (UptimeRobot)

**Response:**
- Email: andrewkwatts@gmail.com
- SMS: (optional - configure in Firebase Console)

---

## Rollback Checklist

Use this checklist during an actual rollback:

### Pre-Rollback

- [ ] Severity assessed: 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 LOW
- [ ] Rollback method chosen: Method 1 / 2 / 3 / 4
- [ ] Current deployment ID recorded: ________________
- [ ] Last known good deployment ID identified: ________________
- [ ] Backup created (if Method 4): YES / NO / N/A

### During Rollback

- [ ] Commands executed successfully
- [ ] Deployment confirmed in Firebase Console
- [ ] Errors in terminal: YES / NO
- [ ] Time taken: _______ minutes

### Post-Rollback Verification

- [ ] Site loads: ✅ / ❌
- [ ] Homepage functional: ✅ / ❌
- [ ] Authentication works: ✅ / ❌
- [ ] Browse deities works: ✅ / ❌
- [ ] Voting works: ✅ / ❌
- [ ] Search works: ✅ / ❌
- [ ] Error rate <5%: ✅ / ❌
- [ ] No console errors: ✅ / ❌

### Follow-Up

- [ ] Root cause identified: ________________
- [ ] Hotfix created: YES / NO
- [ ] Hotfix tested: YES / NO
- [ ] Hotfix deployed: YES / NO
- [ ] Incident report written: YES / NO
- [ ] Prevention measures added: YES / NO

---

## Emergency Contacts

**Primary:**
- Name: Andrew Watts
- Email: andrewkwatts@gmail.com
- Phone: ________________

**Firebase Console:**
- URL: https://console.firebase.google.com/project/[PROJECT-ID]
- Login: andrewkwatts@gmail.com

**GitHub Repository:**
- URL: https://github.com/andrewkwatts/EyesOfAzrael (or actual URL)

**Monitoring Tools:**
- Sentry: https://sentry.io/organizations/[ORG]/projects/eyesofazrael
- Google Analytics: https://analytics.google.com
- UptimeRobot: https://uptimerobot.com

---

## Rollback History

Keep a log of all rollbacks for future reference:

| Date | Time | Severity | Reason | Method | Duration | Outcome |
|------|------|----------|--------|--------|----------|---------|
| 2025-12-29 | 14:30 | 🟡 MEDIUM | Example: Voting bug | Method 1 | 5 min | ✅ Success |
| | | | | | | |
| | | | | | | |
| | | | | | | |

---

**Document Version:** 1.0
**Last Reviewed:** 2025-12-29
**Next Review:** After first rollback OR 30 days

**Approved By:** Andrew Watts
**Date:** 2025-12-29
