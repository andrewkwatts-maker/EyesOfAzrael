# Eyes of Azrael - Monitoring Dashboard Guide

**Version:** 1.0
**Last Updated:** 2025-12-29
**Owner:** Andrew Watts (andrewkwatts@gmail.com)
**Purpose:** Centralized guide for monitoring production health

---

## Quick Health Check (Daily - 5 minutes)

### 1. Site Status
- [ ] Visit https://eyesofazrael.com (or your domain)
- [ ] Homepage loads in <3 seconds
- [ ] No visible errors
- [ ] Click browse deities → Works
- [ ] Search "zeus" → Returns results

**If any fail:** Investigate immediately (see Troubleshooting section)

---

### 2. Error Rate (Sentry)
**URL:** https://sentry.io
**Target:** <5% error rate

- [ ] Log in to Sentry
- [ ] View project dashboard
- [ ] Check last 24 hours
- [ ] Error rate: _____% (Target: <5%)
- [ ] New error types: YES / NO

**If >5% or new critical errors:** Investigate root cause

---

### 3. User Activity (Google Analytics)
**URL:** https://analytics.google.com
**Target:** Growing week-over-week

- [ ] Open Real-Time dashboard
- [ ] Active users: _____ (baseline: ~10-50 for soft launch)
- [ ] Pages per session: _____ (target: >3)
- [ ] Bounce rate: _____% (target: <60%)

**If unusual drop:** Check for outage or errors

---

### 4. Firebase Usage (Firestore)
**URL:** https://console.firebase.google.com/project/[PROJECT-ID]/firestore
**Target:** Within budget

- [ ] Navigate to Usage tab
- [ ] Reads today: _____ (free tier: 50k/day)
- [ ] Writes today: _____ (free tier: 20k/day)
- [ ] Deletes today: _____ (free tier: 20k/day)
- [ ] Projected cost this month: $_____ (target: <$25)

**If approaching limits:** Optimize queries or upgrade plan

---

## Monitoring Tools Setup

### 1. Google Analytics (GA4)

**Status:** ⚠️ NEEDS VERIFICATION

**Setup Instructions:**
1. Go to https://analytics.google.com
2. Create GA4 property if not exists
3. Get tracking ID (e.g., G-XXXXXXXXXX)
4. Add to `index.html`:
   ```html
   <!-- Google tag (gtag.js) -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```
5. Deploy changes
6. Verify in Real-Time reports (within 1 hour)

**Custom Events to Track:**
```javascript
// In js/analytics.js or equivalent
function trackEvent(eventName, params) {
  gtag('event', eventName, params);
}

// Usage examples:
trackEvent('asset_created', { asset_type: 'deity', mythology: 'greek' });
trackEvent('note_added', { entity_id: 'zeus', note_length: 150 });
trackEvent('vote_cast', { vote_type: 'upvote', item_type: 'note' });
trackEvent('search_performed', { query: 'zeus', results_count: 5 });
trackEvent('user_login', { method: 'email' });
trackEvent('submission_approved', { entity_type: 'deity' });
```

**Key Metrics:**
- **Engagement Rate:** % of engaged sessions (target: >50%)
- **Average Session Duration:** Time on site (target: >2 minutes)
- **Pages per Session:** Navigation depth (target: >3)
- **Bounce Rate:** Single-page sessions (target: <60%)
- **Conversion Rate:** Sign-ups per visitor (target: >5%)

---

### 2. Sentry (Error Monitoring)

**Status:** ❌ NOT CONFIGURED

**Setup Instructions:**
1. Create account at https://sentry.io
2. Create new project: "Eyes of Azrael"
3. Install SDK:
   ```bash
   npm install @sentry/browser
   ```
4. Initialize in `index.html` (before other scripts):
   ```html
   <script
     src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"
     crossorigin="anonymous"
   ></script>
   <script>
     Sentry.init({
       dsn: "YOUR_SENTRY_DSN_HERE",
       environment: "production",
       release: "v1.0.0",
       tracesSampleRate: 0.1,  // 10% of transactions
       replaysSessionSampleRate: 0.1,  // 10% of sessions
       replaysOnErrorSampleRate: 1.0,  // 100% of errors
     });
   </script>
   ```
5. Test error capture:
   ```javascript
   // In browser console:
   throw new Error("Test Sentry integration");
   ```
6. Verify in Sentry dashboard (appears within 1 minute)

**Alerts to Configure:**
- Error rate >5% (15 min window)
- New error type detected
- Performance degradation >50%
- Fatal errors (crash events)

**Alert Destination:** andrewkwatts@gmail.com

---

### 3. Firebase Performance Monitoring (Optional)

**Status:** ❌ NOT CONFIGURED

**Setup Instructions:**
1. Firebase Console → Performance
2. Click "Get Started"
3. Add SDK to `index.html`:
   ```html
   <script src="/__/firebase/9.x.x/firebase-performance.js"></script>
   <script>
     const perf = firebase.performance();
   </script>
   ```
4. Deploy changes
5. Wait 24 hours for data

**Metrics Tracked:**
- Page load time
- API latency
- Network request duration
- Custom traces

**Custom Traces Example:**
```javascript
const trace = firebase.performance().trace('load_deity_page');
trace.start();
// ... load deity data ...
trace.stop();
```

---

### 4. UptimeRobot (Site Availability)

**Status:** ❌ NOT CONFIGURED

**Setup Instructions:**
1. Create account at https://uptimerobot.com (free tier)
2. Add monitors:
   - Monitor 1: Homepage
     - URL: https://eyesofazrael.com
     - Type: HTTP(s)
     - Interval: 5 minutes
     - Keyword: "Eyes of Azrael" (must be present)
   - Monitor 2: Browse Page
     - URL: https://eyesofazrael.com/browse/deities
     - Type: HTTP(s)
     - Interval: 5 minutes
   - Monitor 3: API Health
     - URL: https://eyesofazrael.com/index.html
     - Type: HTTP(s)
     - Interval: 5 minutes
3. Configure alerts:
   - Email: andrewkwatts@gmail.com
   - Alert when: Down
   - Send notification: After 2 failed checks (10 min)

**Expected Uptime:** 99.9% (43 min downtime/month allowable)

---

### 5. Firebase Console Dashboards

**Authentication:**
URL: https://console.firebase.google.com/project/[PROJECT-ID]/authentication

Metrics to monitor:
- Total users: _____ (growing)
- Sign-ups today: _____
- Active users (7 days): _____
- Sign-in methods breakdown

**Firestore:**
URL: https://console.firebase.google.com/project/[PROJECT-ID]/firestore

Metrics to monitor:
- Total documents: _____ (should grow)
- Reads/Writes/Deletes (last 24h)
- Storage size: _____ MB
- Top collections by size

**Hosting:**
URL: https://console.firebase.google.com/project/[PROJECT-ID]/hosting

Metrics to monitor:
- Bandwidth usage (last 30 days): _____ GB
- Requests (last 24h): _____
- Most visited pages
- 404 errors: _____ (target: <1%)

**Storage:**
URL: https://console.firebase.google.com/project/[PROJECT-ID]/storage

Metrics to monitor:
- Total files: _____
- Storage used: _____ MB (free tier: 5 GB)
- Bandwidth (last 30 days): _____ GB

---

## Key Performance Indicators (KPIs)

### User Engagement

| Metric | Target | Current | Trend | Status |
|--------|--------|---------|-------|--------|
| Daily Active Users (DAU) | 50+ | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Weekly Active Users (WAU) | 200+ | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Monthly Active Users (MAU) | 500+ | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Average Session Duration | >2 min | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Pages per Session | >3 | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Bounce Rate | <60% | _____% | ↗️/➡️/↘️ | ✅/⚠️/❌ |

### User-Generated Content

| Metric | Target | Current | Trend | Status |
|--------|--------|---------|-------|--------|
| User Submissions (Week 1) | 20+ | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| User Notes (Week 1) | 50+ | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Votes Cast (Week 1) | 200+ | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Approval Rate (Submissions) | >70% | _____% | ↗️/➡️/↘️ | ✅/⚠️/❌ |

### Technical Health

| Metric | Target | Current | Trend | Status |
|--------|--------|---------|-------|--------|
| Error Rate | <5% | _____% | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Uptime | >99% | _____% | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Page Load Time (Desktop) | <3s | _____s | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Page Load Time (Mobile) | <5s | _____s | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Lighthouse Performance | >90 | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Lighthouse Accessibility | >95 | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |

### Cost Efficiency

| Metric | Target | Current | Trend | Status |
|--------|--------|---------|-------|--------|
| Monthly Firebase Cost | <$25 | $_____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Cost per MAU | <$0.10 | $_____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Firestore Reads/User/Day | <100 | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |
| Firestore Writes/User/Day | <20 | _____ | ↗️/➡️/↘️ | ✅/⚠️/❌ |

**Legend:**
- ✅ GREEN: Meeting or exceeding target
- ⚠️ YELLOW: Within 20% of target, needs attention
- ❌ RED: Below target by >20%, urgent action needed

---

## Daily Monitoring Routine (10 minutes)

**Best Time:** Morning (9-10 AM) to catch overnight issues

### Monday - Friday

**5 Minutes - Quick Health Check:**
1. Visit site → Loads correctly ✅/❌
2. Sentry dashboard → Error rate <5% ✅/❌
3. Google Analytics → Users active ✅/❌
4. Firebase Console → Costs normal ✅/❌

**5 Minutes - User Content Review:**
1. Firestore → `/submissions` collection
   - New submissions: _____ (review and approve/reject)
2. Check for abuse reports (if any)
3. Respond to 1-2 user comments/questions

### Saturday - Sunday

**Optional - 5 Minute Check:**
1. Site status: UP ✅ / DOWN ❌
2. Sentry: No critical errors ✅ / Has errors ❌
3. If issues: Investigate or wait until Monday (if minor)

---

## Weekly Monitoring Tasks (30 minutes)

**Best Time:** Monday morning

### 1. KPI Review (10 minutes)

Update KPI table (see above) with last week's data:
- User metrics (DAU, WAU, session duration)
- Content metrics (submissions, notes, votes)
- Technical metrics (error rate, uptime, load time)
- Cost metrics (Firebase spend, cost per user)

Identify trends:
- What's improving? (celebrate!)
- What's declining? (investigate)
- Any anomalies? (dig deeper)

---

### 2. Top Pages Analysis (5 minutes)

Google Analytics → Reports → Engagement → Pages and Screens

Questions:
- Most visited pages: _____________________
- Are users finding deities? ✅/❌
- Are users using search? ✅/❌
- High bounce pages: _____________________ (optimize these)

---

### 3. Error Analysis (10 minutes)

Sentry → Issues tab

Review top 5 errors:
1. Error: _____________________ Count: _____ Status: Fixed/In Progress/Backlog
2. Error: _____________________ Count: _____ Status: Fixed/In Progress/Backlog
3. Error: _____________________ Count: _____ Status: Fixed/In Progress/Backlog
4. Error: _____________________ Count: _____ Status: Fixed/In Progress/Backlog
5. Error: _____________________ Count: _____ Status: Fixed/In Progress/Backlog

Create GitHub issues for any high-impact errors.

---

### 4. Performance Check (5 minutes)

Run Lighthouse audit on 2 key pages:
- Homepage: Performance _____ Accessibility _____
- Browse Deities: Performance _____ Accessibility _____

If scores drop >10 points: Investigate (images? scripts? queries?)

---

## Monthly Monitoring Tasks (2 hours)

**Best Time:** First Monday of the month

### 1. Comprehensive Analytics Review (30 minutes)

Google Analytics → Full reports

**User Acquisition:**
- New users: _____
- Returning users: _____
- Traffic sources:
  - Direct: _____%
  - Organic Search: _____%
  - Social: _____%
  - Referral: _____%

**User Behavior:**
- Most popular mythologies: _____________________
- Most viewed deities: _____________________
- Search queries: _____________________ (trending topics?)
- User flows: Where do users go after homepage?

**User Retention:**
- % returning after 1 week: _____% (target: >20%)
- % returning after 1 month: _____% (target: >10%)

---

### 2. Content Quality Review (30 minutes)

**User Submissions:**
- Total approved this month: _____
- Total rejected this month: _____
- Approval rate: _____% (target: >70%)
- Quality assessment: Excellent / Good / Fair / Poor

**User Notes:**
- Total notes added: _____
- Average length: _____ words
- Most noted entities: _____________________

**Voting Patterns:**
- Total votes: _____
- Upvotes: _____ (_____%)
- Downvotes: _____ (_____%)
- Most voted items: _____________________

---

### 3. Security Review (30 minutes)

**Firestore Security:**
- Firebase Console → Firestore → Rules → Logs
- Any access denied errors? _____ (investigate if many)
- Unusual write patterns? YES/NO
- Large batch operations? YES/NO

**Authentication:**
- Failed login attempts: _____ (target: <5% of total logins)
- Account creation spam? YES/NO
- Unusual IP addresses? YES/NO

**Abuse Reports:**
- Total reports this month: _____
- Resolved: _____
- Banned users: _____ (if applicable)

---

### 4. Cost Optimization (30 minutes)

**Firebase Bill:**
- Total cost this month: $_____
- Breakdown:
  - Firestore: $_____ (reads: _____ writes: _____)
  - Storage: $_____
  - Hosting: $_____
  - Functions: $_____ (if using)

**Cost Analysis:**
- Cost per user: $_____ (total cost / MAU)
- Firestore reads per user: _____
- Firestore writes per user: _____

**Optimization Opportunities:**
- [ ] Implement query caching (reduce reads)
- [ ] Paginate large lists (reduce reads)
- [ ] Optimize images (reduce bandwidth)
- [ ] Review expensive queries (Firestore Console)

---

## Troubleshooting Guide

### Issue: Site Down / Not Loading

**Symptoms:**
- Homepage returns 404 or error
- All pages unavailable
- UptimeRobot alert received

**Investigation:**
1. Check Firebase Console → Hosting → Dashboards
   - Recent deployment failed? ✅/❌
   - Bandwidth exceeded? ✅/❌
2. Check Sentry → Recent errors
   - JavaScript crash? ✅/❌
   - Network errors? ✅/❌
3. Check browser console (F12)
   - DNS error? ✅/❌
   - SSL certificate error? ✅/❌

**Resolution:**
- If deployment failed: Rollback (see ROLLBACK_PROCEDURE.md)
- If bandwidth exceeded: Upgrade plan or wait for reset
- If DNS/SSL: Check domain registrar settings

---

### Issue: High Error Rate (>5%)

**Symptoms:**
- Sentry dashboard shows >5% errors
- Specific error type spiking

**Investigation:**
1. Sentry → Issues → Filter by "unhandled"
2. Identify top error:
   - Error message: _____________________
   - Stack trace points to: _____________________ (file/function)
   - Affected browsers: _____________________
   - Affected users: _____ (all users or specific group?)
3. Review recent code changes:
   ```bash
   git log --oneline -10
   ```
   - Recent deploy related? ✅/❌

**Resolution:**
- If specific function: Hotfix and redeploy
- If recent deploy: Rollback, fix, redeploy
- If browser-specific: Add polyfill or feature detection

---

### Issue: Slow Performance

**Symptoms:**
- Pages load >5 seconds
- Users complain of slowness
- Lighthouse score <80

**Investigation:**
1. Run Lighthouse audit
   - Performance score: _____
   - Opportunities: _____________________ (largest impact)
2. Firebase Console → Performance
   - Slowest traces: _____________________
3. Network tab (F12)
   - Slow resources: _____________________ (images? scripts?)
   - Firestore query times: _____ms (target: <500ms)

**Resolution:**
- If images: Compress, lazy load, use WebP
- If Firestore: Add indexes, optimize queries, cache results
- If JavaScript: Code split, defer non-critical scripts
- If network: Use CDN (Firebase Hosting has built-in CDN)

---

### Issue: High Firebase Costs

**Symptoms:**
- Monthly bill >$25 (or budget)
- Firebase Console shows unusual spike

**Investigation:**
1. Firebase Console → Usage
   - Which service spiking? Firestore/Storage/Functions
2. If Firestore:
   - Reads: _____ (free tier: 50k/day)
   - Writes: _____ (free tier: 20k/day)
   - Top collections by operations: _____________________
3. Check for infinite loops or polling
   - Recent code changes: _____________________
   - Real-time listeners properly unsubscribed? ✅/❌

**Resolution:**
- Add query limits
- Implement caching (reduce reads)
- Unsubscribe real-time listeners on unmount
- Review cloud functions (if using) for efficiency

---

### Issue: Authentication Not Working

**Symptoms:**
- Users can't log in
- Sign-up fails
- "Auth error" in console

**Investigation:**
1. Firebase Console → Authentication → Sign-in methods
   - Email/Password enabled? ✅/❌
   - Authorized domains include your domain? ✅/❌
2. Browser console:
   - Specific error message: _____________________
   - API key valid? ✅/❌
3. Test with incognito window (rule out cookie issues)

**Resolution:**
- If API key issue: Check `firebase-init.js` config
- If domain not authorized: Add to Firebase Console → Auth → Settings
- If temporary Firebase outage: Wait and retry (check Firebase Status Dashboard)

---

## Alert Configuration

### Sentry Alerts

**Critical Errors (Immediate Email):**
- New error type detected
- Error rate >10% (15 min window)
- Fatal crashes

**Warning (Daily Digest):**
- Error rate 5-10%
- Performance degradation >30%

### Firebase Budget Alerts

**Set in Firebase Console → Billing:**
- Alert 1: 50% of budget ($12.50 if budget is $25)
- Alert 2: 80% of budget ($20 if budget is $25)
- Alert 3: 100% of budget ($25)

**Alert Email:** andrewkwatts@gmail.com

### UptimeRobot Alerts

**Downtime:**
- Alert after: 2 failed checks (10 minutes)
- Email: andrewkwatts@gmail.com
- Expected response time: <30 minutes

---

## Monitoring Dashboard Links

Keep these bookmarked for quick access:

**Primary Dashboards:**
- [Firebase Console](https://console.firebase.google.com/project/[PROJECT-ID])
- [Google Analytics](https://analytics.google.com)
- [Sentry Dashboard](https://sentry.io/organizations/[ORG]/projects/eyesofazrael)
- [UptimeRobot](https://uptimerobot.com/dashboard)

**Quick Links:**
- [Firestore Data](https://console.firebase.google.com/project/[PROJECT-ID]/firestore)
- [Firestore Usage](https://console.firebase.google.com/project/[PROJECT-ID]/usage)
- [Authentication Users](https://console.firebase.google.com/project/[PROJECT-ID]/authentication/users)
- [Hosting Deployments](https://console.firebase.google.com/project/[PROJECT-ID]/hosting)
- [Sentry Issues](https://sentry.io/organizations/[ORG]/issues/)
- [GA4 Real-Time](https://analytics.google.com/analytics/web/#/realtime)

---

## Status Page (Future Enhancement)

**Recommendation:** Create a public status page

**Options:**
1. **Simple:** Static HTML page at `/status.html`
   - Manual updates during incidents
   - Show current status: Operational / Degraded / Down

2. **Automated:** Use service like statuspage.io
   - Integrates with monitoring tools
   - Auto-updates based on UptimeRobot
   - Incident history
   - Subscribe for updates

**Template for Status Page:**
```
Eyes of Azrael - System Status

Current Status: 🟢 All Systems Operational

Components:
  ✅ Website (eyesofazrael.com)
  ✅ API / Firestore
  ✅ Authentication
  ✅ Search
  ✅ User Submissions

Last Updated: [Timestamp]
Uptime (30 days): 99.9%

Recent Incidents: None

Subscribe for updates: [Email signup]
```

---

## Document Maintenance

**Review Schedule:**
- After each incident: Update troubleshooting guide
- Monthly: Review KPI targets (adjust as needed)
- Quarterly: Audit all monitoring tools (still needed? Missing anything?)
- Annually: Major revision

**Change Log:**
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-29 | 1.0 | Initial creation | Andrew Watts |
| | | | |

---

**Document Version:** 1.0
**Last Updated:** 2025-12-29
**Next Review:** 2026-01-29 (1 month)
**Owner:** Andrew Watts (andrewkwatts@gmail.com)
