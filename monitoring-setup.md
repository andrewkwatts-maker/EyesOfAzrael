# Monitoring and Analytics Setup Guide

Complete guide for setting up monitoring, analytics, error tracking, and performance monitoring for Eyes of Azrael.

## Table of Contents

1. [Firebase Performance Monitoring](#firebase-performance-monitoring)
2. [Google Analytics Integration](#google-analytics-integration)
3. [Error Tracking with Sentry](#error-tracking-with-sentry)
4. [Uptime Monitoring](#uptime-monitoring)
5. [Custom Monitoring Dashboard](#custom-monitoring-dashboard)
6. [Alerts and Notifications](#alerts-and-notifications)

---

## Firebase Performance Monitoring

### Setup

#### 1. Enable Performance Monitoring in Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Navigate to: Performance → Get Started
4. Click "Enable Performance Monitoring"

#### 2. Add Performance SDK to Your Site

Update your `firebase-config.js`:

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getPerformance } from 'firebase/performance';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const perf = getPerformance(app);

export { app, db, storage, auth, perf };
```

#### 3. Track Custom Performance Metrics

Create `js/monitoring/performance.js`:

```javascript
// js/monitoring/performance.js
import { perf } from '../firebase-config.js';

class PerformanceMonitor {
  constructor() {
    this.traces = new Map();
  }

  // Start a custom trace
  startTrace(name) {
    const trace = perf.trace(name);
    trace.start();
    this.traces.set(name, trace);
    return trace;
  }

  // Stop a custom trace
  stopTrace(name) {
    const trace = this.traces.get(name);
    if (trace) {
      trace.stop();
      this.traces.delete(name);
    }
  }

  // Add custom metric to trace
  addMetric(traceName, metricName, value) {
    const trace = this.traces.get(traceName);
    if (trace) {
      trace.putMetric(metricName, value);
    }
  }

  // Track page load performance
  trackPageLoad() {
    const trace = this.startTrace('page_load');

    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];

      if (perfData) {
        this.addMetric('page_load', 'dns_time', perfData.domainLookupEnd - perfData.domainLookupStart);
        this.addMetric('page_load', 'tcp_time', perfData.connectEnd - perfData.connectStart);
        this.addMetric('page_load', 'request_time', perfData.responseStart - perfData.requestStart);
        this.addMetric('page_load', 'response_time', perfData.responseEnd - perfData.responseStart);
        this.addMetric('page_load', 'dom_processing', perfData.domComplete - perfData.domLoading);
      }

      this.stopTrace('page_load');
    });
  }

  // Track entity loading
  trackEntityLoad(entityType, entityId) {
    const traceName = `entity_load_${entityType}`;
    const trace = this.startTrace(traceName);

    trace.putAttribute('entity_type', entityType);
    trace.putAttribute('entity_id', entityId);

    return {
      complete: () => this.stopTrace(traceName)
    };
  }

  // Track search performance
  trackSearch(query, resultsCount) {
    const trace = this.startTrace('search');
    trace.putAttribute('query', query);
    this.addMetric('search', 'results_count', resultsCount);

    return {
      complete: () => this.stopTrace('search')
    };
  }

  // Track Firebase operations
  trackFirebaseOperation(operation, collection) {
    const traceName = `firebase_${operation}`;
    const trace = this.startTrace(traceName);
    trace.putAttribute('collection', collection);

    return {
      complete: () => this.stopTrace(traceName)
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-track page load
performanceMonitor.trackPageLoad();
```

#### 4. Use Performance Tracking in Your Code

```javascript
// Example: Track entity loading
import { performanceMonitor } from './monitoring/performance.js';

async function loadEntity(type, id) {
  const tracker = performanceMonitor.trackEntityLoad(type, id);

  try {
    const entity = await fetchEntityFromFirebase(type, id);
    tracker.complete();
    return entity;
  } catch (error) {
    tracker.complete();
    throw error;
  }
}

// Example: Track search
async function searchEntities(query) {
  const startTime = performance.now();

  const results = await performSearch(query);

  const tracker = performanceMonitor.trackSearch(query, results.length);
  tracker.complete();

  return results;
}
```

### View Performance Data

1. Go to Firebase Console → Performance
2. View metrics:
   - **Page Load Times**: How fast pages load
   - **Network Requests**: API call performance
   - **Custom Traces**: Your custom metrics

---

## Google Analytics Integration

### Setup

#### 1. Create Google Analytics Property

1. Go to https://analytics.google.com
2. Create a new property (GA4)
3. Get your Measurement ID (G-XXXXXXXXXX)

#### 2. Add Analytics to Firebase

1. Firebase Console → Project Settings
2. Integrations → Google Analytics
3. Link existing GA4 property or create new

#### 3. Add Analytics Script to HTML

Update your HTML template (or create `js/monitoring/analytics.js`):

```html
<!-- Add to <head> section -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-XXXXXXXXXX', {
    'send_page_view': true,
    'anonymize_ip': true,  // Privacy-friendly
    'cookie_flags': 'SameSite=None;Secure'
  });
</script>
```

#### 4. Create Analytics Helper Module

Create `js/monitoring/analytics.js`:

```javascript
// js/monitoring/analytics.js

class Analytics {
  // Track page views
  trackPageView(pagePath, pageTitle) {
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle
      });
    }
  }

  // Track entity views
  trackEntityView(entityType, entityId, entityName) {
    if (typeof gtag === 'function') {
      gtag('event', 'view_entity', {
        event_category: 'engagement',
        event_label: entityType,
        entity_id: entityId,
        entity_name: entityName,
        mythology: this.extractMythology(entityId)
      });
    }
  }

  // Track search queries
  trackSearch(query, resultsCount) {
    if (typeof gtag === 'function') {
      gtag('event', 'search', {
        search_term: query,
        results_count: resultsCount
      });
    }
  }

  // Track user interactions
  trackInteraction(action, category, label, value) {
    if (typeof gtag === 'function') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
  }

  // Track archetype exploration
  trackArchetypeView(archetypeName) {
    if (typeof gtag === 'function') {
      gtag('event', 'view_archetype', {
        event_category: 'exploration',
        archetype_name: archetypeName
      });
    }
  }

  // Track mythology exploration
  trackMythologyView(mythologyName) {
    if (typeof gtag === 'function') {
      gtag('event', 'view_mythology', {
        event_category: 'exploration',
        mythology_name: mythologyName
      });
    }
  }

  // Track theme changes
  trackThemeChange(themeName) {
    if (typeof gtag === 'function') {
      gtag('event', 'theme_change', {
        event_category: 'personalization',
        theme_name: themeName
      });
    }
  }

  // Track user contributions
  trackContribution(contributionType) {
    if (typeof gtag === 'function') {
      gtag('event', 'user_contribution', {
        event_category: 'engagement',
        contribution_type: contributionType
      });
    }
  }

  // Track errors (non-critical)
  trackError(errorType, errorMessage) {
    if (typeof gtag === 'function') {
      gtag('event', 'exception', {
        description: `${errorType}: ${errorMessage}`,
        fatal: false
      });
    }
  }

  // Helper: Extract mythology from entity ID
  extractMythology(entityId) {
    const parts = entityId.split('/');
    return parts.length > 0 ? parts[0] : 'unknown';
  }

  // Track conversion goals
  trackConversion(goalName, value) {
    if (typeof gtag === 'function') {
      gtag('event', 'conversion', {
        event_category: 'goals',
        goal_name: goalName,
        value: value
      });
    }
  }

  // Track user timing
  trackTiming(category, variable, time, label) {
    if (typeof gtag === 'function') {
      gtag('event', 'timing_complete', {
        name: variable,
        value: time,
        event_category: category,
        event_label: label
      });
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();
```

#### 5. Use Analytics in Your Code

```javascript
// Example usage
import { analytics } from './monitoring/analytics.js';

// Track page view
analytics.trackPageView('/mythos/greek/deities/zeus', 'Zeus - Greek Deity');

// Track entity view
analytics.trackEntityView('deity', 'greek/zeus', 'Zeus');

// Track search
const results = await searchEntities('thunder god');
analytics.trackSearch('thunder god', results.length);

// Track theme change
analytics.trackThemeChange('dark-mode');

// Track user interaction
analytics.trackInteraction('click', 'navigation', 'archetype-link');
```

### View Analytics Data

1. Go to Google Analytics dashboard
2. View reports:
   - **Real-time**: Current users
   - **Engagement**: Page views, events
   - **User**: Demographics, interests
   - **Acquisition**: Traffic sources

---

## Error Tracking with Sentry

### Setup

#### 1. Create Sentry Account

1. Go to https://sentry.io
2. Sign up for free account
3. Create new project (JavaScript)
4. Get your DSN

#### 2. Install Sentry SDK

```bash
npm install @sentry/browser --save
```

#### 3. Initialize Sentry

Create `js/monitoring/sentry-init.js`:

```javascript
// js/monitoring/sentry-init.js
import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new BrowserTracing()],

  // Performance Monitoring
  tracesSampleRate: 0.2, // 20% of transactions

  // Error Filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors
    const error = hint.originalException;

    // Ignore certain errors
    if (error && error.message) {
      if (error.message.includes('Network request failed')) {
        return null; // Don't send network errors
      }
    }

    return event;
  },

  // Environment
  environment: process.env.NODE_ENV || 'production',

  // Release tracking
  release: 'eyes-of-azrael@1.0.0'
});

export default Sentry;
```

#### 4. Add Error Boundary

Create `js/monitoring/error-handler.js`:

```javascript
// js/monitoring/error-handler.js
import Sentry from './sentry-init.js';
import { analytics } from './analytics.js';

class ErrorHandler {
  constructor() {
    this.setupGlobalErrorHandlers();
  }

  setupGlobalErrorHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        type: 'unhandled_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'unhandled_rejection',
        promise: event.promise
      });
    });
  }

  // Handle errors
  handleError(error, context = {}) {
    console.error('Error occurred:', error, context);

    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        custom: context
      }
    });

    // Track in Analytics
    analytics.trackError(context.type || 'unknown', error.message || 'Unknown error');

    // Show user-friendly message
    this.showErrorMessage('An error occurred. We\'ve been notified and will fix it soon.');
  }

  // Handle Firebase errors
  handleFirebaseError(error, operation) {
    const context = {
      type: 'firebase_error',
      operation: operation,
      code: error.code,
      message: error.message
    };

    this.handleError(error, context);
  }

  // Handle network errors
  handleNetworkError(error, url) {
    const context = {
      type: 'network_error',
      url: url,
      status: error.status
    };

    this.handleError(error, context);
  }

  // Show user-friendly error message
  showErrorMessage(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 10000;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Manual error reporting
  reportError(message, severity = 'error') {
    Sentry.captureMessage(message, severity);
  }

  // Set user context
  setUser(userId, email, username) {
    Sentry.setUser({
      id: userId,
      email: email,
      username: username
    });
  }

  // Add breadcrumb (for debugging)
  addBreadcrumb(category, message, data = {}) {
    Sentry.addBreadcrumb({
      category: category,
      message: message,
      data: data,
      level: 'info'
    });
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
```

#### 5. Use Error Tracking

```javascript
// Example usage
import { errorHandler } from './monitoring/error-handler.js';

// Catch errors in async operations
async function loadEntity(id) {
  try {
    const entity = await fetchEntity(id);
    return entity;
  } catch (error) {
    errorHandler.handleFirebaseError(error, 'loadEntity');
    throw error;
  }
}

// Add breadcrumbs for debugging
errorHandler.addBreadcrumb('navigation', 'User viewed deity page', {
  deity: 'Zeus',
  mythology: 'Greek'
});

// Manual error reporting
errorHandler.reportError('User attempted unauthorized action', 'warning');

// Set user context (after login)
errorHandler.setUser('user123', 'user@example.com', 'mythfan');
```

### View Error Data

1. Go to Sentry dashboard
2. View:
   - **Issues**: All errors grouped
   - **Performance**: Transaction traces
   - **Releases**: Track errors by version
   - **Alerts**: Configure notifications

---

## Uptime Monitoring

### Option 1: UptimeRobot (Free)

#### Setup

1. Sign up at https://uptimerobot.com
2. Add monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Eyes of Azrael
   - **URL**: https://your-site.web.app
   - **Monitoring Interval**: 5 minutes
3. Configure alerts:
   - Email notifications
   - SMS (paid)
   - Webhook (for Slack/Discord)

#### Webhook Integration (Slack)

1. Create Slack webhook
2. Add to UptimeRobot alert contacts
3. Receive notifications in Slack

### Option 2: Google Cloud Monitoring

#### Setup

1. Go to Google Cloud Console
2. Enable Cloud Monitoring API
3. Create uptime check:
   - **Check Type**: HTTPS
   - **Resource Type**: URL
   - **Hostname**: your-site.web.app
   - **Path**: /
4. Configure alerting policy

### Option 3: Custom Monitoring Script

Create `monitoring/uptime-check.js`:

```javascript
// monitoring/uptime-check.js
const https = require('https');

const SITE_URL = 'https://your-site.web.app';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK_URL;

function checkUptime() {
  const startTime = Date.now();

  https.get(SITE_URL, (res) => {
    const responseTime = Date.now() - startTime;

    if (res.statusCode === 200) {
      console.log(`✓ Site is up (${responseTime}ms)`);
    } else {
      console.error(`✗ Site returned ${res.statusCode}`);
      sendAlert(`Site returned status ${res.statusCode}`);
    }
  }).on('error', (error) => {
    console.error(`✗ Site is down: ${error.message}`);
    sendAlert(`Site is down: ${error.message}`);
  });
}

function sendAlert(message) {
  if (!ALERT_WEBHOOK) return;

  const data = JSON.stringify({
    text: `🚨 Alert: ${message}`,
    timestamp: new Date().toISOString()
  });

  const url = new URL(ALERT_WEBHOOK);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options);
  req.write(data);
  req.end();
}

// Run check immediately
checkUptime();

// Schedule periodic checks
setInterval(checkUptime, CHECK_INTERVAL);
```

Run with:
```bash
ALERT_WEBHOOK_URL=https://hooks.slack.com/... node monitoring/uptime-check.js
```

---

## Custom Monitoring Dashboard

### Create Dashboard Page

Create `monitoring-dashboard.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring Dashboard - Eyes of Azrael</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }

        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
        }

        h1 {
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .metric-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }

        .metric-card:hover {
            transform: translateY(-5px);
        }

        .metric-title {
            font-size: 0.9em;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }

        .metric-change {
            font-size: 0.9em;
            margin-top: 5px;
        }

        .metric-change.positive {
            color: #4caf50;
        }

        .metric-change.negative {
            color: #f44336;
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .status-indicator.up {
            background: #4caf50;
        }

        .status-indicator.down {
            background: #f44336;
        }

        .chart-container {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }

        .refresh-btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            display: block;
            margin: 20px auto;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .refresh-btn:hover {
            background: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>📊 Monitoring Dashboard</h1>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">
                    <span class="status-indicator up"></span>
                    Uptime
                </div>
                <div class="metric-value" id="uptime">99.9%</div>
                <div class="metric-change positive">▲ 0.1%</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Avg Response Time</div>
                <div class="metric-value" id="response-time">247ms</div>
                <div class="metric-change positive">▼ 15ms</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Page Views (24h)</div>
                <div class="metric-value" id="page-views">12,543</div>
                <div class="metric-change positive">▲ 8%</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Active Users</div>
                <div class="metric-value" id="active-users">342</div>
                <div class="metric-change positive">▲ 23</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Error Rate</div>
                <div class="metric-value" id="error-rate">0.12%</div>
                <div class="metric-change positive">▼ 0.03%</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Lighthouse Score</div>
                <div class="metric-value" id="lighthouse">94</div>
                <div class="metric-change positive">▲ 2</div>
            </div>
        </div>

        <div class="chart-container">
            <h2>Performance Trends (Last 7 Days)</h2>
            <canvas id="performanceChart"></canvas>
        </div>

        <button class="refresh-btn" onclick="refreshMetrics()">🔄 Refresh Metrics</button>
    </div>

    <script type="module">
        import { analytics } from './js/monitoring/analytics.js';
        import { performanceMonitor } from './js/monitoring/performance.js';

        // Track dashboard view
        analytics.trackPageView('/monitoring-dashboard', 'Monitoring Dashboard');

        // Fetch metrics from Firebase Performance
        async function fetchMetrics() {
            // This would fetch real data from Firebase Performance API
            // For now, we'll use mock data

            return {
                uptime: '99.9%',
                responseTime: '247ms',
                pageViews: '12,543',
                activeUsers: '342',
                errorRate: '0.12%',
                lighthouse: '94'
            };
        }

        // Update metrics on page
        async function updateMetrics() {
            const metrics = await fetchMetrics();

            document.getElementById('uptime').textContent = metrics.uptime;
            document.getElementById('response-time').textContent = metrics.responseTime;
            document.getElementById('page-views').textContent = metrics.pageViews;
            document.getElementById('active-users').textContent = metrics.activeUsers;
            document.getElementById('error-rate').textContent = metrics.errorRate;
            document.getElementById('lighthouse').textContent = metrics.lighthouse;
        }

        // Refresh metrics
        window.refreshMetrics = function() {
            updateMetrics();
            alert('Metrics refreshed!');
        };

        // Auto-refresh every 5 minutes
        setInterval(updateMetrics, 5 * 60 * 1000);

        // Initial load
        updateMetrics();
    </script>
</body>
</html>
```

---

## Alerts and Notifications

### Slack Integration

#### Create Slack Webhook

1. Go to https://api.slack.com/apps
2. Create new app
3. Enable Incoming Webhooks
4. Add webhook to workspace
5. Copy webhook URL

#### Send Alerts to Slack

Create `monitoring/slack-alerts.js`:

```javascript
// monitoring/slack-alerts.js

class SlackAlerts {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async send(message, options = {}) {
    const payload = {
      text: message,
      username: options.username || 'Eyes of Azrael Monitor',
      icon_emoji: options.icon || ':eye:',
      attachments: options.attachments || []
    };

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
      return false;
    }
  }

  async deploymentAlert(version, status) {
    const color = status === 'success' ? 'good' : 'danger';
    const emoji = status === 'success' ? '✅' : '❌';

    await this.send(`${emoji} Deployment ${status}`, {
      attachments: [{
        color: color,
        fields: [
          {
            title: 'Version',
            value: version,
            short: true
          },
          {
            title: 'Status',
            value: status,
            short: true
          },
          {
            title: 'Time',
            value: new Date().toLocaleString(),
            short: false
          }
        ]
      }]
    });
  }

  async errorAlert(error, severity) {
    await this.send('🚨 Error Detected', {
      icon: ':rotating_light:',
      attachments: [{
        color: 'danger',
        fields: [
          {
            title: 'Error',
            value: error.message,
            short: false
          },
          {
            title: 'Severity',
            value: severity,
            short: true
          },
          {
            title: 'Time',
            value: new Date().toLocaleString(),
            short: true
          }
        ]
      }]
    });
  }

  async performanceAlert(metric, value, threshold) {
    await this.send('⚠️ Performance Alert', {
      attachments: [{
        color: 'warning',
        fields: [
          {
            title: 'Metric',
            value: metric,
            short: true
          },
          {
            title: 'Value',
            value: value,
            short: true
          },
          {
            title: 'Threshold',
            value: threshold,
            short: true
          }
        ]
      }]
    });
  }
}

// Export
export const slackAlerts = new SlackAlerts(process.env.SLACK_WEBHOOK_URL);
```

### Email Alerts

Configure in Firebase Console:
1. Extensions → Install extension
2. Search for "Trigger Email"
3. Configure with SendGrid/Mailgun

---

## Best Practices

1. **Privacy First**
   - Anonymize IP addresses
   - Respect GDPR/CCPA
   - Provide opt-out mechanism

2. **Performance**
   - Sample traffic (don't track 100%)
   - Async tracking (don't block page load)
   - Batch events when possible

3. **Security**
   - Don't track sensitive data
   - Sanitize error messages
   - Secure API keys/tokens

4. **Alerting**
   - Set meaningful thresholds
   - Avoid alert fatigue
   - Escalate critical issues

5. **Regular Review**
   - Weekly: Check key metrics
   - Monthly: Review trends
   - Quarterly: Adjust goals

---

**Last Updated:** 2025-12-27
**Version:** 1.0.0
