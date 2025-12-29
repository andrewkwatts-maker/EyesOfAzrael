# Eyes of Azrael - Public Launch Checklist

**Version:** 1.0
**Last Updated:** 2025-12-29
**Owner:** Andrew Watts (andrewkwatts@gmail.com)

---

## Pre-Launch Phase (2-4 hours before deployment)

### Critical Blockers ✅ MUST COMPLETE

- [ ] **Deploy Firestore Security Rules**
  ```bash
  firebase deploy --only firestore:rules
  # Verify in Firebase Console → Firestore → Rules
  ```
  **Status:** ⚠️ NOT DEPLOYED
  **Time:** 5 minutes
  **Priority:** CRITICAL

- [ ] **Deploy Firestore Indexes**
  ```bash
  firebase deploy --only firestore:indexes
  # Verify in Firebase Console → Firestore → Indexes
  # Wait for all indexes to build (may take 5-10 min)
  ```
  **Status:** ⚠️ NOT DEPLOYED
  **Time:** 15 minutes (including build time)
  **Priority:** CRITICAL

- [ ] **Deploy Storage Rules**
  ```bash
  firebase deploy --only storage
  # Verify in Firebase Console → Storage → Rules
  ```
  **Status:** ⚠️ NOT DEPLOYED
  **Time:** 2 minutes
  **Priority:** CRITICAL

- [ ] **Generate Missing PWA Icons**
  ```bash
  npm run generate-icons
  npm run validate-icons  # Should show 100% pass
  ```
  **Status:** ⚠️ 8 icons missing
  **Time:** 5 minutes
  **Priority:** HIGH

- [ ] **Verify Firebase Project Configuration**
  ```bash
  cat .firebaserc  # Confirm production project ID
  firebase use --project <prod-project-id>  # If needed
  firebase projects:list  # Verify
  ```
  **Status:** ⚠️ NEEDS VERIFICATION
  **Time:** 5 minutes
  **Priority:** CRITICAL

**Total Time for Critical Blockers:** ~30 minutes

---

## Infrastructure Setup

### Firebase Configuration

- [ ] **Confirm Firebase project**
  - Project ID: ________________
  - Project Name: ________________
  - Billing: Blaze (Pay-as-you-go) enabled ✅/❌
  - Daily budget alert configured ✅/❌

- [ ] **Enable Firebase services**
  - [ ] Authentication (Email/Password, Google)
  - [ ] Firestore Database
  - [ ] Storage
  - [ ] Hosting
  - [ ] Functions (if using)
  - [ ] App Check (recommended for DDoS protection)

- [ ] **Configure custom domain** (optional but recommended)
  - Domain: eyesofazrael.com or ________________
  - DNS records updated ✅/❌
  - SSL certificate active ✅/❌
  - Redirects configured (www → non-www) ✅/❌

- [ ] **Verify security settings**
  - [ ] Firestore rules deployed and tested
  - [ ] Storage rules deployed and tested
  - [ ] API keys restricted (Firebase Console → Settings → API Keys)
  - [ ] App Check enabled (optional)

### Analytics & Monitoring

- [ ] **Google Analytics**
  - [ ] GA4 property created
  - [ ] Tracking code in `index.html`
  - [ ] Custom events configured:
    - asset_created
    - note_added
    - vote_cast
    - search_performed
    - user_login
    - submission_approved
  - [ ] Real-time reports showing data ✅/❌

- [ ] **Error Monitoring**
  - [ ] Sentry account created
  - [ ] Sentry SDK installed
    ```bash
    npm install @sentry/browser
    ```
  - [ ] Sentry initialized in code
  - [ ] Test error sent and received
  - [ ] Source maps uploaded

- [ ] **Performance Monitoring**
  - [ ] Firebase Performance SDK added (optional)
  - [ ] Web Vitals tracking configured
  - [ ] Custom traces added (optional)

- [ ] **Uptime Monitoring**
  - [ ] UptimeRobot account created (or similar)
  - [ ] Monitors configured:
    - Homepage: /index.html
    - Browse: /browse/deities
    - Search: /search
  - [ ] Alert email configured
  - [ ] Check interval: 5 minutes

### Backup & Recovery

- [ ] **Firestore Backup**
  - [ ] Automated backups enabled (Firebase Console → Firestore → Import/Export)
  - [ ] Backup schedule: Daily ✅ / Weekly ✅
  - [ ] Backup location: gs://________________
  - [ ] Test restore procedure documented ✅/❌

- [ ] **Code Repository**
  - [ ] Latest code pushed to GitHub
  - [ ] Release tag created: `v1.0.0`
  - [ ] Deployment instructions in README.md
  - [ ] .env.example file updated

---

## Content & Legal

### Required Pages

- [ ] **Terms of Service**
  - [ ] Page created: `/terms.html`
  - [ ] Content written (use template from Termly.io)
  - [ ] Linked in footer
  - [ ] Last updated date shown

- [ ] **Privacy Policy**
  - [ ] Page created: `/privacy.html`
  - [ ] Content written (use template from Termly.io)
  - [ ] Cookie usage disclosed
  - [ ] Data collection explained
  - [ ] User rights outlined
  - [ ] Linked in footer
  - [ ] Last updated date shown

- [ ] **Community Guidelines**
  - [ ] Page created: `/community-guidelines.html`
  - [ ] Content submission rules
  - [ ] Voting etiquette
  - [ ] Prohibited content
  - [ ] Moderation process
  - [ ] Linked in footer

- [ ] **About Page**
  - [ ] Page updated: `/about.html`
  - [ ] Project description
  - [ ] Contact information
  - [ ] Attribution for data sources
  - [ ] Acknowledgments

### Support Infrastructure

- [ ] **Support Email**
  - Email: support@eyesofazrael.com (or ________________)
  - Configured and tested ✅/❌
  - Auto-reply set up ✅/❌
  - Response time commitment: <24 hours

- [ ] **Bug Tracking**
  - GitHub Issues enabled ✅/❌
  - Issue templates created ✅/❌
  - Labels configured (bug, enhancement, question)

- [ ] **Feedback Mechanism**
  - Contact form on site ✅/❌
  - OR link to Google Form ✅/❌
  - OR email mailto link ✅/❌

---

## Testing Phase

### Automated Tests

- [ ] **Run all validation scripts**
  ```bash
  node scripts/validate-all-firebase-assets.js
  node scripts/validate-all-links.js
  node scripts/validate-cross-links.js
  node scripts/validate-deity-icons.js
  node scripts/validate-pwa-icons.js
  ```
  **Expected:** Majority pass, review failures

- [ ] **Run unit tests** (if applicable)
  ```bash
  npm test
  ```
  **Expected:** All tests pass

### Manual Testing - Anonymous User

- [ ] **Browse standard content**
  - [ ] Visit homepage
  - [ ] Navigate to mythology (e.g., Greek)
  - [ ] Browse deities list
  - [ ] Click on deity (e.g., Zeus)
  - [ ] Icons display correctly
  - [ ] Topic panels expand/collapse
  - [ ] Images load
  - [ ] No console errors

- [ ] **Search functionality**
  - [ ] Use search bar
  - [ ] Try query: "zeus"
  - [ ] Results appear
  - [ ] Filters work (mythology, type)

- [ ] **Restricted actions**
  - [ ] Click "Add Note" → Login prompt appears
  - [ ] Click upvote → Login prompt appears
  - [ ] Click "Submit Asset" → Login prompt appears

- [ ] **Navigation**
  - [ ] Menu works (hamburger on mobile)
  - [ ] Footer links work
  - [ ] Back button works
  - [ ] Direct URL navigation works

### Manual Testing - Authenticated User

- [ ] **Authentication**
  - [ ] Sign up with email/password
  - [ ] Verify email (if enabled)
  - [ ] Log out
  - [ ] Log in again
  - [ ] Password reset works

- [ ] **Asset Submission**
  - [ ] Click "Add New Deity" (or other type)
  - [ ] Fill step 1: Name, mythology, icon
  - [ ] Fill step 2: Description, domains, etc.
  - [ ] Review step 3: Preview looks correct
  - [ ] Submit successfully
  - [ ] Verify in Firestore: `/submissions/{id}`
  - [ ] Refresh page mid-form → Draft restored

- [ ] **User Notes**
  - [ ] Navigate to deity page
  - [ ] Click "Add Note"
  - [ ] Write markdown:
    - **Bold text**
    - *Italic text*
    - Bullet list
    - Numbered list
  - [ ] Preview renders correctly
  - [ ] Submit note
  - [ ] Note appears in real-time
  - [ ] Edit own note
  - [ ] Delete own note
  - [ ] Cannot edit others' notes (if test account exists)

- [ ] **Voting**
  - [ ] Upvote a user note
  - [ ] Count increments instantly
  - [ ] Change to downvote
  - [ ] Count adjusts correctly
  - [ ] Remove vote
  - [ ] Count returns to original
  - [ ] Refresh page → Vote persists

- [ ] **Content Filtering**
  - [ ] Toggle "Show Community Content" ON
  - [ ] User submissions appear in lists
  - [ ] Community badge shows on user content
  - [ ] Count badge: "+X items"
  - [ ] Toggle OFF
  - [ ] User content hidden
  - [ ] Preference persists across sessions

- [ ] **Sorting**
  - [ ] Change sort to "Most Helpful"
  - [ ] Items reorder (highest votes first)
  - [ ] Change to "Most Debated"
  - [ ] Items reorder (highest contested score first)
  - [ ] Change to "Alphabetical"
  - [ ] Items reorder (A-Z)
  - [ ] Preference persists

- [ ] **User Dashboard** (if implemented)
  - [ ] View my submissions
  - [ ] View my notes
  - [ ] View my votes
  - [ ] Edit my profile

### Manual Testing - Admin User

- [ ] **Admin Login**
  - Log in as: andrewkwatts@gmail.com
  - Verify admin role recognized

- [ ] **Edit Standard Content**
  - [ ] Navigate to deity page
  - [ ] See "Edit" button (others don't)
  - [ ] Modify deity data
  - [ ] Save changes
  - [ ] Verify in Firestore

- [ ] **Manage Submissions**
  - [ ] Access submissions queue (admin panel or manual Firestore check)
  - [ ] Review pending submission
  - [ ] Approve → Status: "approved"
  - [ ] Verify appears in browse views
  - [ ] Reject → Status: "rejected"

- [ ] **Delete User Content**
  - [ ] Navigate to user note
  - [ ] See "Delete" button
  - [ ] Delete successfully
  - [ ] Verify removed from Firestore

### Cross-Browser Testing

- [ ] **Desktop**
  - [ ] Chrome (latest) - Windows/Mac
  - [ ] Firefox (latest) - Windows/Mac
  - [ ] Safari (latest) - Mac
  - [ ] Edge (latest) - Windows

- [ ] **Mobile**
  - [ ] Mobile Safari - iOS 15+
  - [ ] Mobile Chrome - Android 11+

- [ ] **Test Scenarios (each browser)**
  - [ ] Page loads without errors
  - [ ] Icons render
  - [ ] Forms submit
  - [ ] Modals open/close
  - [ ] Touch interactions (mobile)
  - [ ] No console errors

### Performance Testing

- [ ] **Lighthouse Audit** (after deployment)
  - Run on:
    - [ ] Homepage (`/index.html`)
    - [ ] Browse page (`/browse/deities`)
    - [ ] Entity detail (e.g., `/mythos/greek/deities/zeus`)
    - [ ] Search page (`/search`)
    - [ ] User dashboard (`/dashboard`)

  - **Target Scores:**
    - Performance: >90 ✅/❌
    - Accessibility: >95 ✅/❌
    - Best Practices: >90 ✅/❌
    - SEO: >90 ✅/❌

- [ ] **Load Time**
  - [ ] Homepage loads in <3 seconds (desktop)
  - [ ] Homepage loads in <5 seconds (mobile)
  - [ ] Entity pages load in <2 seconds

### Accessibility Testing

- [ ] **Automated Scan**
  - [ ] Run axe DevTools on 5 key pages
  - [ ] Fix all critical issues
  - [ ] Fix high-priority issues

- [ ] **Manual Checks**
  - [ ] Tab through page (keyboard navigation)
  - [ ] All interactive elements reachable
  - [ ] Focus indicators visible
  - [ ] Color contrast sufficient (WAVE tool)
  - [ ] Alt text on images
  - [ ] ARIA labels on buttons

- [ ] **Screen Reader** (optional but recommended)
  - [ ] Test with NVDA (Windows) or VoiceOver (Mac)
  - [ ] Navigation makes sense
  - [ ] Content is readable

---

## Deployment

### Pre-Deployment

- [ ] **Verify environment variables**
  - [ ] Firebase config correct
  - [ ] API keys restricted
  - [ ] Production mode enabled

- [ ] **Create deployment tag**
  ```bash
  git tag -a v1.0.0 -m "Public launch"
  git push origin v1.0.0
  ```

- [ ] **Backup current state**
  - [ ] Export Firestore data
  - [ ] Save to: gs://eyesofazrael-backups/pre-launch
  - [ ] Verify export successful

### Deployment Commands

```bash
# Option 1: Deploy everything
firebase deploy

# Option 2: Deploy incrementally
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes  # Wait for indexes to build
firebase deploy --only storage
firebase deploy --only hosting

# Verify deployment
firebase hosting:channel:list
```

### Post-Deployment Verification

- [ ] **Site is live**
  - [ ] Visit production URL
  - [ ] Page loads correctly
  - [ ] No 404 errors
  - [ ] SSL certificate valid (lock icon)

- [ ] **Critical functions work**
  - [ ] Authentication (sign up/login)
  - [ ] Firestore reads (browse deities)
  - [ ] Firestore writes (submit note)
  - [ ] Voting works
  - [ ] Search works

- [ ] **Monitoring active**
  - [ ] Sentry receiving events
  - [ ] Google Analytics showing data
  - [ ] Firebase Console shows traffic
  - [ ] Uptime monitor green

- [ ] **No errors**
  - [ ] Check browser console (no red errors)
  - [ ] Check Sentry dashboard (no crashes)
  - [ ] Check Firebase Console → Firestore → Rules (no access denied errors)

---

## Launch Announcement

### Social Media (if applicable)

- [ ] **Twitter/X**
  - [ ] Announcement tweet written
  - [ ] Link to site
  - [ ] Screenshot attached

- [ ] **Reddit**
  - [ ] r/mythology post (check rules)
  - [ ] r/webdev post (show-off thread)

- [ ] **Email List** (if exists)
  - [ ] Launch email sent
  - [ ] Link to features
  - [ ] Call to action (create account)

### Communities

- [ ] Notify beta testers
- [ ] Post in relevant Discord servers
- [ ] Share with academic/mythology communities

---

## Monitoring (First 24 Hours)

### Hourly Checks (Hours 1-6)

- [ ] **Error rates**
  - Check Sentry dashboard
  - Target: <5% error rate
  - If >5%: Investigate immediately

- [ ] **User activity**
  - Google Analytics Real-Time
  - Firebase Authentication → Users
  - Firestore → Database activity

- [ ] **Performance**
  - Lighthouse score
  - Page load times (Google Analytics)

- [ ] **Firestore costs**
  - Firebase Console → Usage
  - Reads: <100k/day (free tier)
  - Writes: <50k/day (free tier)
  - If exceeded: Optimize queries or upgrade

### Daily Checks (Days 1-7)

- [ ] **Submissions Queue**
  - Review user submissions
  - Approve quality content
  - Reject spam/low-quality

- [ ] **User Feedback**
  - Check support email
  - Check GitHub Issues
  - Respond to questions

- [ ] **Security**
  - Firebase Console → Firestore → Rules → Logs
  - Look for access denied (could indicate attack)
  - Check abuse reports (if any)

- [ ] **Performance**
  - Run Lighthouse daily
  - Track trends (improving/degrading)

---

## Post-Launch Tasks (Week 1)

### High Priority

- [ ] Address any launch bugs
- [ ] Respond to all user feedback
- [ ] Optimize performance bottlenecks
- [ ] Fix accessibility issues

### Medium Priority

- [ ] Create user guide (5 key features)
- [ ] Write FAQ (10 common questions)
- [ ] Expand content (low-completeness entities)
- [ ] Review security logs

### Low Priority

- [ ] Set up automated testing
- [ ] Create admin dashboard enhancements
- [ ] Plan roadmap for Month 2
- [ ] Collect feature requests

---

## Go/No-Go Decision

**Checklist Complete:** _____% (Target: 90%+)

**Critical Blockers Resolved:** YES ✅ / NO ❌

**Decision:**
- ✅ GO - All critical items complete, ready to launch
- ⚠️ SOFT GO - Launch to limited audience, resolve issues before full launch
- ❌ NO-GO - Critical issues remain, delay launch

**Signed Off By:**
- Owner: ________________ Date: ________
- Technical Lead: ________________ Date: ________

---

## Rollback Plan (In Case of Emergency)

**When to Rollback:**
- Security breach
- >10% error rate
- Data loss
- Site completely down >10 minutes

**Rollback Steps:**
```bash
# 1. Identify issue
# Check Sentry, Firebase Console, browser console

# 2. Rollback deployment
firebase hosting:rollback

# 3. Verify rollback
# Visit site, test critical functions

# 4. Notify users (if needed)
# Post status update, send email

# 5. Fix issue
# Create hotfix, test locally, redeploy

Time Estimate: 10-30 minutes
```

**Emergency Contact:**
- Owner: andrewkwatts@gmail.com
- Backup: ________________

---

**Checklist Version:** 1.0
**Created:** 2025-12-29
**Next Review:** After launch (Week 1)
