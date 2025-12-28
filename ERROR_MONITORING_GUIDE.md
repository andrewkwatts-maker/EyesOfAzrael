# Error Monitoring Guide

## Overview

Eyes of Azrael uses **Sentry** for comprehensive error tracking, performance monitoring, and user feedback collection. This guide covers setup, usage, and best practices.

---

## Table of Contents

1. [Setup](#setup)
2. [Sentry Dashboard](#sentry-dashboard)
3. [Key Metrics](#key-metrics)
4. [Alert Rules](#alert-rules)
5. [Response Protocol](#response-protocol)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Setup

### 1. Get Your Sentry DSN

1. Create account at https://sentry.io
2. Create new project: "eyes-of-azrael"
3. Copy your DSN from Project Settings → Client Keys
4. Update `js/error-monitoring.js`:

```javascript
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN_HERE', // Replace with your actual DSN
  // ... rest of config
});
```

### 2. Enable Source Maps (for production)

Source maps help debug minified code. See CI/CD section below.

### 3. Test Integration

```javascript
// Trigger a test error
import { captureMessage } from './js/error-monitoring.js';
captureMessage('Test error - setup verification', 'info');
```

Check your Sentry dashboard to verify the message appears.

---

## Sentry Dashboard

### Access

- **URL**: https://sentry.io/organizations/YOUR_ORG/issues/
- **Mobile App**: Available on iOS and Android

### Main Sections

#### Issues
- All errors and exceptions
- Grouped by similarity
- Shows frequency, users affected, last seen

#### Performance
- Transaction traces
- Slow operations
- Web Vitals metrics

#### Releases
- Deploy tracking
- Version comparison
- Regression detection

#### Alerts
- Custom alert rules
- Slack/email notifications
- PagerDuty integration

---

## Key Metrics

### Error Rate
- **Target**: < 0.1% of requests
- **Critical**: > 1% of requests
- **Monitor**: Issues → View All

### User Impact
- **Target**: < 10 users affected per error
- **Critical**: > 100 users affected
- **Monitor**: Issue details → Users tab

### Crash-Free Rate
- **Target**: > 99.9%
- **Critical**: < 99.0%
- **Monitor**: Releases → Crash Free Sessions

### Performance Metrics
- **TTFB (Time to First Byte)**: < 500ms
- **FCP (First Contentful Paint)**: < 1.5s
- **Page Load**: < 3s
- **Monitor**: Performance → Web Vitals

### Apdex Score
- **Target**: > 0.9
- **Acceptable**: > 0.7
- **Monitor**: Performance → Overview

---

## Alert Rules

### Recommended Rules

#### 1. High Error Rate
```
Alert when: error count > 10 in 1 minute
Notify: Slack #alerts, email
Severity: Critical
```

#### 2. New Error Pattern
```
Alert when: new issue type detected
Notify: Slack #engineering
Severity: Warning
```

#### 3. High User Impact
```
Alert when: single issue affects > 100 users
Notify: PagerDuty, email
Severity: Critical
```

#### 4. Performance Degradation
```
Alert when: p95 response time > 3s for 5 minutes
Notify: Slack #performance
Severity: Warning
```

#### 5. Crash Rate Spike
```
Alert when: crash-free rate < 99% for 10 minutes
Notify: Slack #alerts, PagerDuty
Severity: Critical
```

### Setting Up Alerts

1. Go to Alerts → Create Alert Rule
2. Choose metric and threshold
3. Select notification channels
4. Set alert name and owner
5. Save and test

---

## Response Protocol

### 1. Acknowledge (Within 15 Minutes)

- Check Sentry notification
- Assess severity and scope
- Assign to team member
- Update status to "In Progress"

### 2. Triage (Within 30 Minutes)

**Severity Assessment:**

| Level | Criteria | Response Time |
|-------|----------|---------------|
| P0 - Critical | Site down, data loss, >1000 users affected | Immediate |
| P1 - High | Major feature broken, >100 users affected | < 1 hour |
| P2 - Medium | Minor feature broken, < 100 users affected | < 4 hours |
| P3 - Low | Cosmetic issue, <10 users affected | < 24 hours |

**User Impact:**
- Count affected users
- Identify user segments
- Check if workaround exists

**Business Impact:**
- Revenue affected?
- Brand reputation at risk?
- Legal/compliance issues?

### 3. Fix or Rollback (Based on Severity)

**For Critical Issues (P0):**
1. Immediate rollback to last stable version
2. Notify users via status page
3. Deploy hotfix or keep rolled back
4. Verify fix in production

**For High Priority Issues (P1):**
1. Develop fix in hotfix branch
2. Test thoroughly in staging
3. Deploy during low-traffic hours
4. Monitor for 24 hours

**For Medium/Low Priority (P2/P3):**
1. Add to sprint backlog
2. Fix in normal release cycle
3. Include in release notes

### 4. Post-Mortem (For P0/P1)

Within 48 hours, create post-mortem document:

**Template:**
```markdown
# Post-Mortem: [Issue Title]

## Summary
Brief description of what happened

## Timeline
- [Time]: Issue detected
- [Time]: Team notified
- [Time]: Root cause identified
- [Time]: Fix deployed
- [Time]: Issue resolved

## Root Cause
What caused the issue?

## Impact
- Users affected: X
- Duration: X minutes
- Revenue impact: $X (if applicable)

## Resolution
How was it fixed?

## Prevention
What will prevent this in the future?

## Action Items
- [ ] Item 1 (Owner: X, Due: Date)
- [ ] Item 2 (Owner: Y, Due: Date)
```

---

## Usage Examples

### Capturing Errors

```javascript
import { captureError } from './js/error-monitoring.js';

try {
  // Your code
  riskyOperation();
} catch (error) {
  captureError(error, {
    component: 'DeityCard',
    action: 'loadData',
    deityId: deity.id,
  });
}
```

### Capturing Messages

```javascript
import { captureMessage } from './js/error-monitoring.js';

// Info message
captureMessage('User completed onboarding', 'info', {
  userId: user.id,
  flow: 'standard',
});

// Warning message
captureMessage('API rate limit approaching', 'warning', {
  currentRate: 950,
  limit: 1000,
});
```

### Adding Breadcrumbs

```javascript
import { addBreadcrumb } from './js/error-monitoring.js';

// Track user actions
addBreadcrumb('user_action', 'Clicked deity card', {
  deityId: 'zeus',
  mythology: 'greek',
});

// Track navigation
addBreadcrumb('navigation', 'Viewed search results', {
  query: 'thunder gods',
  resultCount: 12,
});
```

### Performance Tracking

```javascript
import { trackAsyncOperation } from './js/utils/performance-monitoring.js';

// Track Firebase operation
await trackAsyncOperation(
  'Load deity data',
  'firebase.read',
  async () => {
    const doc = await firebase.firestore()
      .collection('deities')
      .doc('zeus')
      .get();
    return doc.data();
  }
);
```

### Error Boundaries

```javascript
import { ErrorBoundary } from './js/utils/error-boundary.js';

class DeityCard {
  constructor() {
    this.errorBoundary = new ErrorBoundary(this);
  }

  async loadDeity(id) {
    return this.errorBoundary.execute('loadDeity', id);
  }

  async loadDeityImplementation(id) {
    // Actual implementation
    // If this throws, ErrorBoundary catches it
  }
}
```

---

## Best Practices

### 1. Context is King

Always provide rich context:

```javascript
captureError(error, {
  // User context
  userId: user?.id,
  userRole: user?.role,

  // Action context
  component: 'SearchBar',
  method: 'performSearch',
  query: searchQuery,

  // Environment context
  browser: navigator.userAgent,
  viewport: `${window.innerWidth}x${window.innerHeight}`,

  // Business context
  feature: 'search',
  category: 'mythology-lookup',
});
```

### 2. Set User Context

```javascript
import { setUser } from './js/error-monitoring.js';

// On login
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    setUser({
      id: user.uid,
      email: user.email,
      username: user.displayName,
    });
  } else {
    setUser(null);
  }
});
```

### 3. Use Tags for Filtering

```javascript
import { setTags } from './js/error-monitoring.js';

setTags({
  mythology: 'greek',
  component: 'deity-card',
  feature_flag: 'new_search_v2',
});
```

### 4. Track Critical Paths

```javascript
import { mark, measure } from './js/utils/performance-monitoring.js';

// Start of critical operation
mark('search-start');

// ... perform search ...

// End of critical operation
mark('search-end');
const duration = measure('search-duration', 'search-start', 'search-end');
```

### 5. Don't Over-Report

Avoid reporting non-errors:

```javascript
// ❌ Bad: Reporting expected behavior
if (!data) {
  captureMessage('No data found'); // This might be expected
}

// ✅ Good: Only report unexpected errors
if (!data && shouldHaveData) {
  captureMessage('Expected data missing', 'warning', {
    expectedSource: 'firebase',
    query: queryParams,
  });
}
```

---

## Troubleshooting

### Issue: No Errors Appearing in Sentry

**Possible Causes:**
1. DSN not configured
2. Development environment (monitoring disabled)
3. Network blocked (firewall, ad blocker)

**Solutions:**
```javascript
// Check if Sentry is initialized
console.log('Sentry hub:', window.Sentry?.getCurrentHub());

// Test with manual error
import { captureMessage } from './js/error-monitoring.js';
captureMessage('Test error', 'error');
```

### Issue: Too Many Errors

**Solutions:**
1. Add to `ignoreErrors` in `error-monitoring.js`
2. Use `beforeSend` to filter
3. Set up sampling:

```javascript
Sentry.init({
  // ... other options
  sampleRate: 0.5, // Send 50% of errors
});
```

### Issue: PII in Error Reports

**Solutions:**
1. Use `beforeSend` to scrub data:

```javascript
beforeSend(event) {
  // Remove email addresses
  if (event.request?.data) {
    event.request.data = scrubPII(event.request.data);
  }
  return event;
}
```

2. Use Sentry's data scrubbing rules (Settings → Security & Privacy)

### Issue: Source Maps Not Working

**Solutions:**
1. Verify source maps are uploaded:
```bash
sentry-cli releases files VERSION list
```

2. Check release name matches:
```javascript
Sentry.init({
  release: 'eyes-of-azrael@1.0.0', // Must match upload
});
```

---

## Performance Budget

Set performance budgets to maintain speed:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| TTFB | < 200ms | 200-500ms | > 500ms |
| FCP | < 1s | 1-2.5s | > 2.5s |
| LCP | < 2.5s | 2.5-4s | > 4s |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| Page Load | < 2s | 2-4s | > 4s |

---

## Resources

- **Sentry Docs**: https://docs.sentry.io/
- **Error Monitoring Best Practices**: https://docs.sentry.io/product/best-practices/
- **Performance Monitoring**: https://docs.sentry.io/product/performance/
- **Release Health**: https://docs.sentry.io/product/releases/health/

---

## Support

For questions or issues:
1. Check Sentry documentation
2. Search existing GitHub issues
3. Create new issue with `[monitoring]` tag
4. Contact DevOps team

---

**Last Updated**: 2024-01-28
**Version**: 1.0.0
