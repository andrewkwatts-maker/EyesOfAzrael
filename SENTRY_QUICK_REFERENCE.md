# Sentry Error Monitoring - Quick Reference

**Version**: 1.0.0 | **Last Updated**: 2024-01-28

---

## 🚀 Quick Start (5 Minutes)

### 1. Get DSN
```
1. Go to https://sentry.io/signup/
2. Create project "eyes-of-azrael"
3. Copy DSN from Settings → Client Keys
```

### 2. Configure
```javascript
// js/error-monitoring.js (line 29)
dsn: 'https://xxxxx@xxxxx.ingest.sentry.io/xxxxx'  // ← Paste here
```

### 3. Test
```javascript
import { captureMessage } from './js/error-monitoring.js';
captureMessage('Test - Sentry works!', 'info');
```

### 4. Check
```
Open https://sentry.io → Issues
See your test message ✓
```

---

## 📝 Common Tasks

### Capture Error
```javascript
import { captureError } from './js/error-monitoring.js';

try {
  riskyOperation();
} catch (error) {
  captureError(error, {
    component: 'DeityCard',
    deityId: deity.id,
  });
}
```

### Log Message
```javascript
import { captureMessage } from './js/error-monitoring.js';

captureMessage('User completed onboarding', 'info', {
  userId: user.id,
});
```

### Track Action
```javascript
import { addBreadcrumb } from './js/error-monitoring.js';

addBreadcrumb('user_action', 'Clicked deity card', {
  deityId: 'zeus',
});
```

### Track Performance
```javascript
import { trackAsyncOperation } from './js/utils/performance-monitoring.js';

await trackAsyncOperation('Load data', 'firebase.read', async () => {
  return await fetchData();
});
```

### Wrap Component
```javascript
import { ErrorBoundary } from './js/utils/error-boundary.js';

class MyComponent {
  constructor() {
    this.boundary = new ErrorBoundary(this);
  }

  async riskyMethod() {
    return this.boundary.execute('riskyMethod');
  }
}
```

---

## 🎯 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `js/error-monitoring.js` | Core Sentry setup | 423 |
| `js/utils/error-boundary.js` | Error handling | 320 |
| `js/utils/performance-monitoring.js` | Performance | 378 |
| `js/components/feedback-widget.js` | User feedback | 301 |
| `ERROR_MONITORING_GUIDE.md` | Full guide | 600+ |
| `SENTRY_SETUP.md` | Setup steps | 400+ |

---

## 📊 Key Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| Error Rate | <0.1% | >1% |
| Crash-Free | >99.9% | <99% |
| TTFB | <500ms | >1s |
| Page Load | <3s | >5s |

---

## 🚨 Alert Response

| Priority | Response Time | Action |
|----------|---------------|--------|
| P0 (Critical) | Immediate | Deploy fix/rollback |
| P1 (High) | <1 hour | Hotfix branch |
| P2 (Medium) | <4 hours | Add to sprint |
| P3 (Low) | <24 hours | Backlog |

---

## 🔧 Troubleshooting

### No Errors Showing?
```javascript
// 1. Check DSN configured
console.log(window.Sentry);

// 2. Not on localhost?
// Monitoring disabled in development

// 3. Test manually
captureMessage('Test error', 'error');
```

### Source Maps Not Working?
```bash
# Check uploaded
sentry-cli releases files VERSION list

# Verify release matches
# js/error-monitoring.js: release: 'eyes-of-azrael@1.0.0'
```

### Too Many Errors?
```javascript
// Add to ignoreErrors in error-monitoring.js
ignoreErrors: [
  'ResizeObserver loop',
  'Your error pattern',
]
```

---

## 💰 Free Tier Limits

- **Errors**: 5,000/month
- **Transactions**: 10,000/month
- **Replays**: 50/month

**Stay Under**:
```javascript
// Lower sampling
tracesSampleRate: 0.2        // 20% of transactions
replaysSessionSampleRate: 0.1  // 10% of sessions
```

---

## 🔐 GitHub Secrets

Add these to: Settings → Secrets and variables → Actions

| Secret | Where to Get |
|--------|--------------|
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → API → Create Token |
| `SENTRY_ORG` | Your organization slug |
| `SENTRY_PROJECT` | `eyes-of-azrael` |

---

## 📱 Quick Links

- **Dashboard**: https://sentry.io
- **Docs**: https://docs.sentry.io
- **Setup Guide**: `SENTRY_SETUP.md`
- **Full Guide**: `ERROR_MONITORING_GUIDE.md`

---

## ✅ Pre-Launch Checklist

- [ ] DSN configured in `error-monitoring.js`
- [ ] Test error sent successfully
- [ ] GitHub secrets added
- [ ] Alert rules configured
- [ ] Source maps uploading (check workflow)
- [ ] Team members added to Sentry
- [ ] Slack integration setup (optional)

---

## 🎓 Team Training

### For Developers
1. Read `ERROR_MONITORING_GUIDE.md`
2. Learn to use `captureError()` and `addBreadcrumb()`
3. Wrap risky components with `ErrorBoundary`
4. Add context to all errors

### For DevOps
1. Read `SENTRY_SETUP.md`
2. Configure GitHub secrets
3. Setup alert rules
4. Monitor dashboard daily
5. Respond to incidents per protocol

### For Product/PM
1. Understand error severity levels
2. Review weekly metrics
3. Participate in post-mortems
4. Prioritize error fixes

---

## 🆘 Need Help?

1. **Documentation**
   - `ERROR_MONITORING_GUIDE.md` - Usage guide
   - `SENTRY_SETUP.md` - Setup guide

2. **Support**
   - Sentry Forum: https://forum.sentry.io
   - Sentry Docs: https://docs.sentry.io
   - Team Slack: #engineering

3. **Issues**
   - GitHub: Tag with `[monitoring]`
   - Email: support@sentry.io (paid)

---

**Print this card and keep it handy!**

*Quick Reference v1.0 - Agent 16*
