# Analytics Guide
Eyes of Azrael - Understanding Our Analytics Implementation

## Table of Contents
1. [Overview](#overview)
2. [What We Track and Why](#what-we-track-and-why)
3. [Privacy Considerations](#privacy-considerations)
4. [How to Access Analytics](#how-to-access-analytics)
5. [Key Metrics to Monitor](#key-metrics-to-monitor)
6. [Understanding the Data](#understanding-the-data)
7. [User Guide](#user-guide)
8. [Developer Guide](#developer-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Eyes of Azrael uses a comprehensive analytics system to understand how users interact with our mythology encyclopedia and to continuously improve the user experience. We use two complementary analytics platforms:

- **Google Analytics 4 (GA4)**: For detailed web analytics, user journeys, and acquisition data
- **Firebase Analytics**: For real-time event tracking, user engagement, and mobile-optimized analytics

### Our Analytics Philosophy

1. **Privacy-First**: We respect user privacy and comply with GDPR, CCPA, and other regulations
2. **Transparency**: We're open about what we track and why
3. **User Benefit**: Data collection serves to improve the user experience
4. **Data Minimization**: We only collect what we need
5. **User Control**: Users can opt out at any time

---

## What We Track and Why

### Page Views and Navigation

**What**: Every page visited, time spent, and navigation paths
**Why**: To understand which content is most valuable and how users discover information

**Examples**:
- Which mythologies are most popular (Greek vs. Norse vs. Egyptian)
- Whether users browse by deity, archetype, or comparison
- Where users get stuck or leave the site

**How It Helps**:
- Prioritize content expansion
- Improve navigation structure
- Identify missing or hard-to-find content

### User Interactions

**What**: Buttons clicked, forms submitted, modals opened, tabs switched
**Why**: To measure engagement and identify UX friction points

**Examples**:
- "View Deity Details" button clicks
- Search bar usage
- Theory submission form interactions
- Archetype filter selections

**How It Helps**:
- Optimize button placement and design
- Simplify complex workflows
- Fix confusing UI elements

### Search Behavior

**What**: Search queries, results shown, results clicked, no-result searches
**Why**: To improve search relevance and content discoverability

**Examples**:
- "zeus greek mythology" → shows we need good Zeus content
- "egyptian afterlife" with 0 clicks → search results may not be relevant
- Frequent searches for missing content → content gaps to fill

**How It Helps**:
- Improve search algorithm
- Identify content gaps
- Enhance autocomplete suggestions
- Better organize existing content

### Mythology Comparisons

**What**: Which mythologies/entities are compared, comparison views, time spent
**Why**: To understand cross-cultural interests and improve comparison tools

**Examples**:
- Zeus (Greek) vs. Jupiter (Roman) vs. Thor (Norse)
- Flood myths across cultures
- Underworld conceptions

**How It Helps**:
- Create pre-built comparison templates
- Suggest related comparisons
- Identify universal themes

### User Contributions

**What**: Theories submitted, entities added, edits proposed, submission success/failure
**Why**: To encourage and streamline user contributions

**Examples**:
- Form abandonment rates
- Most common submission types
- Approval rates by category

**How It Helps**:
- Simplify contribution process
- Provide better guidance
- Increase community participation

### Performance Metrics

**What**: Page load times, database query times, render performance, error rates
**Why**: To ensure fast, reliable experience for all users

**Examples**:
- Average page load: 2.3 seconds
- Slow database query on deity search
- High error rate on mobile Safari

**How It Helps**:
- Identify performance bottlenecks
- Optimize slow pages
- Fix browser-specific issues
- Improve server response times

### Error Tracking

**What**: JavaScript errors, failed API calls, broken links, authentication issues
**Why**: To quickly identify and fix bugs

**Examples**:
- "Cannot read property 'name' of undefined" on deity page
- Firebase authentication timeout
- 404 errors from old links

**How It Helps**:
- Proactive bug fixing
- Prioritize critical issues
- Improve error messages
- Better user feedback

### User Engagement

**What**: Scroll depth, time on page, return visits, session duration
**Why**: To measure content quality and user satisfaction

**Examples**:
- 85% of users scroll to bottom of deity pages (good content!)
- Average 5 pages per session (high engagement)
- 40% return within 7 days (sticky product)

**How It Helps**:
- Identify engaging vs. boring content
- Optimize content length
- Improve retention strategies

---

## Privacy Considerations

### What We DON'T Track

- **Personal Identifiable Information (PII)**: No names, addresses, phone numbers
- **Sensitive Personal Data**: No race, religion, political views, health data
- **Private Messages**: No content of user-submitted theories (only that they were submitted)
- **Precise Location**: Only country/region, not GPS coordinates
- **Individual Browsing History**: Data is aggregated and anonymized

### Privacy Protections

#### IP Anonymization
All IP addresses are anonymized before processing:
```javascript
gtag('config', 'G-ECC98XJ9W9', {
  anonymize_ip: true
});
```

#### Cookie Consent
- First-party cookies only (no third-party tracking)
- SameSite=Strict for security
- Users can opt out and delete cookies

#### Data Retention
- **User-level data**: 14 months (GA4 default)
- **Event-level data**: 14 months
- **Aggregate reports**: Indefinitely (no user identification possible)

#### User Rights
Under GDPR/CCPA, you have the right to:
- **Access**: Request what data we have about you
- **Deletion**: Request deletion of your data
- **Portability**: Receive your data in machine-readable format
- **Opt-Out**: Disable analytics tracking

### How to Opt Out

#### Method 1: In-Browser (Recommended)
1. Look for "Privacy Settings" in site footer
2. Toggle "Analytics Tracking" to OFF
3. Your preference is saved locally

#### Method 2: Browser Extension
Install [Google Analytics Opt-out Add-on](https://tools.google.com/dlpage/gaoptout)

#### Method 3: Do Not Track
Enable "Do Not Track" in your browser settings (we honor this)

#### Method 4: Ad Blockers
Most ad blockers will prevent analytics scripts from loading

### Data Security

- **HTTPS Only**: All data transmitted over encrypted connections
- **Firebase Security Rules**: Strict access controls on database
- **No Data Sharing**: We don't sell or share analytics data with third parties
- **Regular Audits**: Quarterly privacy compliance reviews

---

## How to Access Analytics

### For Site Administrators

#### Google Analytics 4

1. **Access Dashboard**:
   - URL: https://analytics.google.com
   - Select property: "Eyes of Azrael"
   - Login with authorized Google account

2. **Key Reports**:
   - **Realtime**: Current activity (users, events, locations)
   - **Life Cycle > Engagement > Pages**: Most viewed content
   - **Life Cycle > Engagement > Events**: Custom event tracking
   - **User > Demographics**: Age, gender, interests
   - **User > Tech**: Browser, OS, device info
   - **Acquisition**: How users find the site

3. **Custom Dashboards**:
   - Navigate to "Explore" in left sidebar
   - Pre-built dashboards:
     - "Content Performance"
     - "Search Analytics"
     - "User Contributions"
     - "Performance Monitoring"

#### Firebase Analytics

1. **Access Console**:
   - URL: https://console.firebase.google.com
   - Select project: "eyesofazrael"
   - Navigate to Analytics in left sidebar

2. **Key Views**:
   - **Dashboard**: Overview of users, events, retention
   - **Events**: All tracked events with parameters
   - **Conversions**: Goal completions (submissions, etc.)
   - **StreamView**: Real-time event stream
   - **DebugView**: Testing mode for verifying events

3. **Audiences**:
   - Engaged Users: >5 pages per session
   - Contributors: Submitted at least one theory/entity
   - Power Users: Visit >10 times per month

### For Content Creators

Even without analytics access, you can see some metrics:

- **Public Stats**: Some aggregate metrics may be shown in user dashboard
- **Content Popularity**: "Trending" badges on popular content
- **Your Contributions**: Stats on your submitted theories (views, upvotes)

### For Developers

#### Debug Mode

Enable debug mode to see analytics in browser console:

```javascript
// Add to URL
?debug=true

// Check console
[Analytics] Page View { path: '/greek/deities/zeus', title: 'Zeus - Greek God' }
[Analytics] Event mythology_viewed { mythology: 'greek', entity_type: 'deity', entity_id: 'zeus' }
```

#### Testing Events

```javascript
// Manual event tracking
window.trackEvent('test_event', {
  category: 'testing',
  action: 'manual_trigger'
});

// Check if analytics initialized
console.log(window.AnalyticsManager.getSummary());
```

#### DebugView (Firebase)

1. Add `?debug=true` to URL
2. Go to Firebase Console > Analytics > DebugView
3. See events appear in real-time with full parameters
4. Verify event names and parameters are correct

---

## Key Metrics to Monitor

### Daily Metrics

#### Active Users
- **What**: Number of users currently on site
- **Target**: Steady growth, 10-50 concurrent users
- **Alert If**: Sudden spike (traffic anomaly) or drop to 0 (site down)

#### Error Rate
- **What**: JavaScript/Firebase errors per 100 sessions
- **Target**: <1% error rate
- **Alert If**: >5% (critical issue affecting users)

#### Page Load Time
- **What**: Average time from navigation to page interactive
- **Target**: <3 seconds on desktop, <5 seconds on mobile
- **Alert If**: >7 seconds (performance issue)

### Weekly Metrics

#### Top Content
- **What**: Most viewed mythologies, deities, archetypes
- **Why**: Guides content expansion priorities
- **Review**: Top 10 pages, look for patterns

#### Search Performance
- **What**: Search queries, results, click-through rate
- **Target**: >50% of searches result in a click
- **Alert If**: CTR <30% (relevance problem)

#### User Engagement
- **What**: Pages per session, session duration, bounce rate
- **Target**:
  - Pages/session: 3-5
  - Duration: 2-4 minutes
  - Bounce rate: <60%
- **Alert If**: Bounce rate >80% (content/UX issue)

### Monthly Metrics

#### User Growth
- **What**: New vs. returning users, user retention
- **Target**: 20% month-over-month growth
- **Cohort Analysis**: 30% of users return within 7 days

#### Contribution Rate
- **What**: Theories/entities submitted per 100 users
- **Target**: 5% contribution rate (5 submissions per 100 users)
- **Trend**: Increasing over time

#### Conversion Funnels
- **What**: % of users who complete key actions
- **Funnels to Track**:
  - Search → Click → Engage: 50% → 30% → 15%
  - Visit → Sign In → Contribute: 100% → 10% → 2%

#### Performance Trends
- **What**: Load time, database performance over time
- **Target**: Stable or improving
- **Alert If**: Degradation >20% month-over-month

### Quarterly Metrics

#### User Satisfaction
- **Proxy Metrics**:
  - Return rate: % who visit >3 times
  - Deep engagement: % who view >10 pages
  - Contribution quality: Approval rate of submissions

#### Content Coverage
- **What**: Which mythologies/categories need expansion
- **Analyze**: Low-traffic pages (under-promoted? poor quality? niche?)

#### Technical Debt
- **What**: Accumulation of errors, performance issues
- **Review**: Long-term error trends, slow pages

---

## Understanding the Data

### Reading Analytics Reports

#### Example: Deity Page Performance

```
Page: /greek/deities/zeus
Views: 1,247
Unique Pageviews: 892
Avg. Time on Page: 2:34
Bounce Rate: 42%
Exit Rate: 18%
```

**Interpretation**:
- **Views vs. Unique**: 1,247/892 = 1.4 → Users view Zeus page 1.4 times on average (some revisit)
- **Time on Page**: 2:34 is good for detailed content
- **Bounce Rate**: 42% bounced (viewed only Zeus, then left) → Could improve related content links
- **Exit Rate**: 18% exited site from Zeus → Most users continue browsing (good!)

**Actions**:
- Add "Related Deities" section to reduce bounce rate
- Ensure Zeus has links to other Greek deities
- Consider Zeus is a good entry point for new users

#### Example: Search Analysis

```
Search Term: "norse creation myth"
Search Count: 89
Avg. Results: 12
Click-Through Rate: 67%
Top Result Clicked: /norse/cosmology/creation (45 clicks)
```

**Interpretation**:
- **Healthy CTR**: 67% found what they wanted
- **Dominant Result**: Creation page gets 67% of clicks (45/67)
- **Good Coverage**: 12 results suggest comprehensive Norse content

**Actions**:
- Feature creation myth more prominently
- Consider dedicated "Creation Myths" comparison page
- Track if users who search "creation" contribute theories

### Common Analytics Patterns

#### Pattern: High Bounce, Low Time
- **What**: Users arrive and leave quickly
- **Possible Causes**:
  - Wrong audience (from irrelevant traffic source)
  - Page doesn't match expectations
  - Poor mobile experience
  - Very slow load time
- **Investigation**: Check acquisition source, device type, page load time

#### Pattern: High Views, No Engagement
- **What**: Many pageviews but no interactions (clicks, scrolls)
- **Possible Causes**:
  - Bot traffic
  - Users scanning and not reading
  - Content at bottom of page not seen
- **Investigation**: Check user agent, scroll depth, time on page

#### Pattern: Funnel Drop-Off
- **What**: Users abandon multi-step process
- **Example**: 1000 start form → 300 complete
- **Possible Causes**:
  - Form too complex
  - Required fields unclear
  - Technical error
  - User changed mind
- **Investigation**: Check error logs, test user experience, simplify form

---

## User Guide

### For Regular Users

#### Your Privacy is Protected
- We don't track your personal information
- Your browsing is anonymous
- You can opt out anytime
- Data helps us improve the site for everyone

#### How Analytics Improves Your Experience

**Example 1: Search Improvements**
- You search "egyptian afterlife"
- We see many users search this
- We create dedicated afterlife comparison page
- Next time you search, you find better results

**Example 2: Content Expansion**
- Many users view Greek mythology
- We prioritize adding more Greek deities
- You get access to more content you're interested in

**Example 3: Performance**
- We notice deity pages load slowly
- We optimize database queries
- Your browsing experience gets faster

#### Your Data, Your Control

**View Your Data**:
- Not directly available (anonymized)
- Aggregate stats may be shown in public dashboards

**Delete Your Data**:
- Contact: privacy@eyesofazrael.com
- Request deletion of analytics data
- Processed within 30 days

**Opt Out**:
- Footer → Privacy Settings → Disable Analytics
- Or use browser Do Not Track setting

### For Contributors

#### Contribution Analytics

When you submit theories or entities, we track:
- **Submission event**: That a submission occurred (not the content)
- **Approval time**: How long until reviewed
- **View count**: How many people view your contribution (shown to you)
- **Engagement**: Upvotes, comments on your contribution

We DON'T track:
- The content of your submission (privacy)
- Your editing patterns
- Time spent writing

#### Why We Track Contributions

- **Improve submission flow**: If many abandon the form, we simplify it
- **Faster reviews**: Identify review bottlenecks
- **Recognition**: Show you which of your contributions are popular
- **Quality**: Understand what types of contributions are most valuable

---

## Developer Guide

### Tracking Custom Events

#### Basic Event Tracking

```javascript
// Track any custom event
window.trackEvent('custom_event_name', {
  param1: 'value1',
  param2: 'value2'
});
```

#### Mythology Events

```javascript
// User views mythology
window.trackMythologyView('greek', 'deity', 'zeus');

// Equivalent to:
window.trackEvent('mythology_viewed', {
  mythology: 'greek',
  entity_type: 'deity',
  entity_id: 'zeus'
});
```

#### Search Events

```javascript
// User performs search
window.trackSearch('zeus greek god', { mythology: 'greek' }, 15);

// User clicks search result
window.AnalyticsManager.trackSearchResult(
  'zeus greek god',  // query
  'zeus',            // result ID
  'deity',           // result type
  0                  // position in results
);
```

#### Comparison Events

```javascript
// User compares mythologies
window.AnalyticsManager.trackComparison(
  ['greek', 'norse', 'egyptian'],  // mythologies
  ['deity', 'deity', 'deity']      // entity types
);
```

#### Contribution Events

```javascript
// User submits theory
window.AnalyticsManager.trackTheorySubmission(
  'alternative-interpretation',
  'greek'
);

// User submits entity
window.AnalyticsManager.trackEntitySubmission(
  'deity',
  'greek'
);
```

### Tracking Page Views (SPA)

For single-page applications, manually track page views:

```javascript
// On route change
window.trackPageView('#/greek/deities/zeus', 'Zeus - Greek God');

// Auto-detect from hash
window.trackPageView();  // Uses current location.hash
```

### Performance Tracking

```javascript
// Track custom performance metric
window.AnalyticsManager.trackPerformance('image_load', {
  image_url: '/images/zeus.jpg',
  load_time: 245,  // milliseconds
  size_kb: 128
});
```

### Error Tracking

```javascript
// Track custom error
window.AnalyticsManager.trackError({
  type: 'api_error',
  message: 'Failed to load deity data',
  endpoint: '/api/deities/zeus',
  status_code: 500
});
```

### Setting User Properties

```javascript
// Set custom user property
window.AnalyticsManager.setUserProperty('favorite_mythology', 'greek');
window.AnalyticsManager.setUserProperty('user_level', 'contributor');

// Set user ID (for authenticated users)
window.AnalyticsManager.setUserId('user_12345');
```

### Checking Analytics Status

```javascript
// Get analytics summary
const summary = window.AnalyticsManager.getSummary();
console.log(summary);
// {
//   initialized: true,
//   analyticsEnabled: true,
//   consentGiven: true,
//   debugMode: false,
//   sessionDuration: 125000,
//   performanceMetrics: {...},
//   queuedEvents: 0
// }
```

### Testing Events

1. **Enable Debug Mode**:
   ```
   ?debug=true
   ```

2. **Trigger Test Event**:
   ```javascript
   window.trackEvent('test_event', { test_param: 'test_value' });
   ```

3. **Verify in Console**:
   ```
   [Analytics] Event test_event { test_param: 'test_value', timestamp: '...', page: '...' }
   ```

4. **Verify in Firebase DebugView**:
   - Go to Firebase Console → Analytics → DebugView
   - See event appear in real-time

### Best Practices

#### Event Naming
- Use snake_case: `deity_viewed`, not `DeityViewed`
- Be descriptive: `search_result_clicked`, not `click`
- Namespace if needed: `mythology_greek_deity_viewed`

#### Parameters
- Keep parameter names consistent
- Use snake_case for parameter names
- Limit to 25 parameters per event (GA4 limit)
- String values max 100 characters

#### Performance
- Events are queued if analytics not initialized
- Don't track PII in event parameters
- Avoid tracking in tight loops (batch if needed)

#### Testing
- Always test in DebugView before deploying
- Verify event names match custom event configuration
- Check parameter spelling and types

---

## Troubleshooting

### Analytics Not Working

#### Symptom: No events appearing in GA4/Firebase

**Check 1: Analytics Initialized**
```javascript
console.log(window.AnalyticsManager.initialized);
// Should be true
```

**Check 2: User Consent**
```javascript
console.log(window.AnalyticsManager.consentGiven);
// Should be true
```

**Check 3: Scripts Loaded**
```javascript
console.log(typeof gtag);  // Should be 'function'
console.log(typeof firebase);  // Should be 'object'
```

**Check 4: Measurement ID Correct**
```javascript
// In firebase-config.js
console.log(firebaseConfig.measurementId);
// Should be 'G-ECC98XJ9W9'
```

**Check 5: Ad Blocker**
- Disable ad blocker and test
- Ad blockers often block analytics scripts

**Fix**: Enable debug mode (`?debug=true`) and check console for error messages

### Events Not Appearing in Reports

#### Symptom: Events fire but don't show in dashboards

**Issue 1: Reporting Delay**
- GA4 can take 24-48 hours for data to appear
- Firebase Analytics: Usually within 1 hour
- **Solution**: Check DebugView for real-time validation

**Issue 2: Event Name Mismatch**
- Custom events must be registered in GA4
- **Solution**: Check Admin → Events → Create Event

**Issue 3: Parameter Not Configured**
- Custom parameters must be registered as dimensions
- **Solution**: Admin → Custom Definitions → Create Custom Dimension

### Performance Issues

#### Symptom: Analytics slowing down site

**Check 1: Too Many Events**
```javascript
// Don't do this:
for (let i = 0; i < 1000; i++) {
  trackEvent('iteration', { index: i });  // BAD
}

// Do this instead:
trackEvent('batch_operation', {
  start: 0,
  end: 1000,
  duration: 500
});  // GOOD
```

**Check 2: Large Parameters**
- Parameter values >100 characters are truncated
- Avoid large JSON strings

**Check 3: Synchronous Operations**
- Analytics should be async
- Check for blocking operations

### Privacy Concerns

#### User Reports Tracking Despite Opt-Out

**Check 1: Consent Stored Correctly**
```javascript
console.log(localStorage.getItem('analytics_consent'));
// Should be 'false' if opted out
```

**Check 2: Opt-Out Applied**
```javascript
console.log(window.AnalyticsManager.analyticsEnabled);
// Should be false if opted out
```

**Check 3: GA Opt-Out**
```javascript
console.log(window['ga-disable-G-ECC98XJ9W9']);
// Should be true if opted out
```

**Fix**: Call opt-out method manually
```javascript
window.AnalyticsManager.optOut();
```

### Data Discrepancies

#### GA4 vs. Firebase Numbers Don't Match

This is normal! Here's why:

- **Different Counting Methods**: GA4 counts sessions differently than Firebase
- **Bot Filtering**: GA4 filters bots, Firebase doesn't
- **Time Zones**: Reports may use different time zones
- **Processing Delay**: Different processing speeds
- **Sampling**: GA4 may sample large datasets

**Best Practice**: Use one source as "source of truth" (recommend GA4 for web)

---

## Compliance & Legal

### GDPR Compliance

We comply with GDPR through:
- Opt-in consent (EU visitors)
- IP anonymization
- Data retention limits
- Right to access/delete
- Clear privacy policy

### CCPA Compliance

We comply with CCPA through:
- Clear disclosure of data collection
- Opt-out mechanism
- No sale of personal data
- Right to know what data is collected

### Cookie Policy

**Cookies We Use**:
- `_ga`: Google Analytics user ID (2 years)
- `_gid`: Google Analytics session ID (24 hours)
- `analytics_consent`: User consent preference (permanent)

**Third-Party Cookies**: None

### Data Processing Agreement

For enterprise users or partners:
- DPA available upon request
- Covers: Data handling, security, breach notification
- Contact: legal@eyesofazrael.com

---

## Support

### Getting Help

**For Users**:
- Privacy questions: privacy@eyesofazrael.com
- Opt-out issues: Include browser and OS details
- Data deletion: Request processed within 30 days

**For Developers**:
- Implementation questions: Check this guide first
- Technical issues: Check console errors, DebugView
- Feature requests: Submit via GitHub issues

**For Administrators**:
- Analytics access: Contact site owner
- Custom reports: See `analytics-dashboard-setup.md`
- Training: Available upon request

### Additional Resources

- [Google Analytics 4 Help](https://support.google.com/analytics)
- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [CCPA Information](https://oag.ca.gov/privacy/ccpa)

---

## Changelog

### Version 1.0 (2024-12-27)
- Initial analytics implementation
- GA4 integration
- Firebase Analytics integration
- Custom event tracking
- Performance monitoring
- Error tracking
- Privacy controls

---

**Last Updated**: 2024-12-27
**Version**: 1.0
**Maintained By**: Eyes of Azrael Development Team
