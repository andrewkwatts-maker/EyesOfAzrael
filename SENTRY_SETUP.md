# Sentry Setup Instructions

## Quick Start

Follow these steps to get Sentry error monitoring up and running.

---

## Step 1: Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up with GitHub or email
3. Choose "Browser JavaScript" as your platform
4. Create organization (e.g., "eyes-of-azrael")

---

## Step 2: Create Project

1. Click "Create Project"
2. Platform: **Browser JavaScript**
3. Name: `eyes-of-azrael`
4. Team: Default
5. Click "Create Project"

---

## Step 3: Get Your DSN

1. After project creation, copy your DSN
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
2. Navigate to Settings → Projects → eyes-of-azrael → Client Keys (DSN)

---

## Step 4: Configure Application

### Update `js/error-monitoring.js`

Replace the placeholder DSN:

```javascript
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN_HERE', // ← Replace this
  // ... rest of config
});
```

With your actual DSN:

```javascript
Sentry.init({
  dsn: 'https://xxxxx@xxxxx.ingest.sentry.io/xxxxx',
  // ... rest of config
});
```

---

## Step 5: Test Integration

### Manual Test

Open browser console and run:

```javascript
import { captureMessage } from './js/error-monitoring.js';
captureMessage('Test error - Sentry setup verification', 'info');
```

### Check Sentry Dashboard

1. Go to https://sentry.io
2. Select your project
3. Navigate to Issues
4. You should see your test message

---

## Step 6: Setup GitHub Secrets (For CI/CD)

### Create Auth Token

1. Go to Sentry → Settings → Account → API → Auth Tokens
2. Click "Create New Token"
3. Scopes needed:
   - `project:read`
   - `project:releases`
   - `org:read`
4. Copy the token (you won't see it again!)

### Add to GitHub

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add three secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SENTRY_AUTH_TOKEN` | Your auth token | `sntrys_xxxxx` |
| `SENTRY_ORG` | Organization slug | `eyes-of-azrael` |
| `SENTRY_PROJECT` | Project name | `eyes-of-azrael` |

---

## Step 7: Configure Alerts

### Email Alerts

1. Sentry → Settings → Account → Notifications
2. Enable "Issue Alerts"
3. Set email preferences

### Recommended Alert Rules

Navigate to Alerts → Create Alert Rule

#### Alert 1: High Error Rate
```
When: an issue is seen more than 10 times in 1 minute
Then: send notification to #alerts
```

#### Alert 2: New Issues
```
When: a new issue is created
Then: send notification to #engineering
```

#### Alert 3: User Impact
```
When: an issue affects more than 100 users
Then: send notification to #critical and PagerDuty
```

---

## Step 8: Setup Integrations (Optional)

### Slack Integration

1. Sentry → Settings → Integrations → Slack
2. Click "Add Workspace"
3. Authorize Sentry
4. Configure notification channels

### GitHub Integration

1. Sentry → Settings → Integrations → GitHub
2. Install Sentry app on your repo
3. Link commits to releases
4. Create issues from Sentry errors

---

## Step 9: Configure Release Tracking

### Update package.json

Add version number:

```json
{
  "name": "eyes-of-azrael",
  "version": "1.0.0",
  ...
}
```

### Update error-monitoring.js

```javascript
Sentry.init({
  dsn: 'YOUR_DSN',
  release: 'eyes-of-azrael@1.0.0',
  // ... rest
});
```

### Deploy Tracking

The GitHub Actions workflow (`.github/workflows/sentry-upload.yml`) will automatically:
- Create releases on deploy
- Upload source maps
- Track commits

---

## Step 10: Verify Everything Works

### Checklist

- [ ] Sentry account created
- [ ] Project configured
- [ ] DSN added to code
- [ ] Test error sent successfully
- [ ] Error appears in Sentry dashboard
- [ ] GitHub secrets configured
- [ ] Alert rules created
- [ ] Integrations setup (Slack, GitHub)

### Test in Production

1. Deploy to production
2. Trigger a test error:
```javascript
throw new Error('Test production error');
```
3. Verify in Sentry:
   - Error captured
   - Source maps working
   - User context included
   - Release tagged

---

## Troubleshooting

### Errors Not Showing Up

**Problem**: No errors in Sentry dashboard

**Solutions**:
1. Check DSN is correct
2. Verify not in localhost (monitoring disabled locally)
3. Check browser console for Sentry errors
4. Disable ad blockers
5. Check network tab for requests to `sentry.io`

### Source Maps Not Working

**Problem**: Stack traces show minified code

**Solutions**:
1. Verify source maps uploaded:
```bash
sentry-cli releases files VERSION list
```

2. Check release name matches in code and upload

3. Verify source map URL prefix:
```bash
sentry-cli releases files VERSION upload-sourcemaps ./dist --url-prefix '~/dist'
```

### Too Many Errors

**Problem**: Sentry quota exceeded

**Solutions**:
1. Use sampling:
```javascript
Sentry.init({
  sampleRate: 0.5, // Send 50% of errors
});
```

2. Add to ignore list:
```javascript
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Non-Error promise rejection',
],
```

3. Upgrade Sentry plan

---

## Cost Optimization

### Free Tier Limits

- **Errors**: 5,000 events/month
- **Performance**: 10,000 transactions/month
- **Session Replay**: 50 replays/month
- **Team Members**: Unlimited

### Tips to Stay in Free Tier

1. **Sample Events**:
```javascript
tracesSampleRate: 0.2, // 20% of transactions
```

2. **Ignore Non-Critical Errors**:
```javascript
ignoreErrors: ['ResizeObserver', 'Network request failed'],
```

3. **Filter in beforeSend**:
```javascript
beforeSend(event) {
  // Don't send extension errors
  if (event.filename?.includes('chrome-extension://')) {
    return null;
  }
  return event;
}
```

4. **Monitor Usage**: Settings → Usage & Billing

---

## Security Best Practices

### 1. Scrub Sensitive Data

```javascript
beforeSend(event) {
  // Remove passwords
  if (event.request?.data?.password) {
    delete event.request.data.password;
  }

  // Scrub email addresses in strings
  event.message = event.message?.replace(
    /[\w.-]+@[\w.-]+\.\w+/g,
    '[EMAIL_REDACTED]'
  );

  return event;
}
```

### 2. Use Data Scrubbing

Sentry → Settings → Security & Privacy → Data Scrubbing

Add patterns to scrub:
- `password`
- `api_key`
- `secret`
- `token`
- Credit card numbers
- Social security numbers

### 3. IP Address Anonymization

Settings → Security & Privacy → Data Scrubbing
- Enable "Prevent Storing IP Addresses"

### 4. Restrict Dashboard Access

Settings → Teams → Permissions
- Limit who can view errors
- Set up role-based access

---

## Next Steps

1. **Read the Guide**: See `ERROR_MONITORING_GUIDE.md`
2. **Setup Alerts**: Configure notification preferences
3. **Integrate with Team**: Add team members
4. **Monitor Dashboard**: Check daily for new issues
5. **Review Performance**: Track Web Vitals

---

## Resources

- **Sentry Docs**: https://docs.sentry.io/
- **JavaScript SDK**: https://docs.sentry.io/platforms/javascript/
- **Best Practices**: https://docs.sentry.io/product/best-practices/
- **CLI Reference**: https://docs.sentry.io/product/cli/

---

## Support

Need help?
1. Check [Sentry Status](https://status.sentry.io/)
2. Browse [Community Forum](https://forum.sentry.io/)
3. Read [GitHub Discussions](https://github.com/getsentry/sentry/discussions)
4. Contact support@sentry.io (paid plans)

---

**Setup Time**: ~15 minutes
**Difficulty**: Easy
**Prerequisites**: None

Good luck! 🚀
