# Performance Monitoring Guide
## Eyes of Azrael Real-Time Performance Tracking System

### Overview

The Performance Monitoring System provides comprehensive real-time tracking of application performance metrics, Firebase query times, resource loading, and user interactions. This guide explains how to use, configure, and extend the system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Metrics Tracked](#metrics-tracked)
4. [Dashboard Usage](#dashboard-usage)
5. [Integration Guide](#integration-guide)
6. [API Reference](#api-reference)
7. [Alert Configuration](#alert-configuration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Basic Setup

1. **Include the performance monitor script:**
```html
<script src="js/performance-monitor.js"></script>
```

2. **The monitor starts automatically** when the page loads

3. **Access the dashboard:**
   - Open `performance-dashboard.html` in your browser
   - View real-time metrics, charts, and alerts

### Viewing Performance Data

The global `performanceMonitor` instance is available:

```javascript
// Get current metrics
const metrics = performanceMonitor.getMetrics();

// Get summary
const summary = performanceMonitor.getSummary();

// Export report
const report = performanceMonitor.exportReport();
```

---

## System Architecture

### Components

```
┌─────────────────────────────────────────┐
│     Performance Monitor (Core)          │
│  - Navigation Timing Capture            │
│  - Resource Timing Observer             │
│  - Firebase Query Interceptor           │
│  - Custom Metrics Tracker               │
└─────────────────────────────────────────┘
                    │
                    ├── Metrics Storage
                    ├── Alert System
                    └── Dashboard UI
```

### Data Flow

1. **Automatic Capture**: Monitor automatically captures Navigation Timing API data on page load
2. **Observer Pattern**: Performance Observers track resources, paint events, and custom measurements
3. **Firebase Interception**: Wraps Firebase methods to track query performance
4. **Real-Time Updates**: Dashboard polls metrics every 2 seconds for live updates
5. **Alert Generation**: Threshold violations trigger alerts

---

## Metrics Tracked

### 1. Navigation Timing Metrics

Automatically captured from the Navigation Timing API:

| Metric | Description | Target |
|--------|-------------|--------|
| **Page Load** | Total time from navigation to load complete | < 3s |
| **DNS Lookup** | DNS resolution time | < 50ms |
| **TCP Connection** | TCP handshake time | < 100ms |
| **Server Response** | Time to receive full response | < 500ms |
| **DOM Processing** | Time to process and build DOM | < 800ms |
| **Time to Interactive** | When page becomes fully interactive | < 5s |
| **First Contentful Paint** | First content rendered to screen | < 2s |

**Example:**
```javascript
const nav = performanceMonitor.metrics.navigation;
console.log(`Page loaded in ${nav.pageLoad}ms`);
console.log(`First paint at ${nav['first-contentful-paint']}ms`);
```

### 2. Firebase Query Metrics

Tracks all Firestore operations:

```javascript
// Automatically tracked
const doc = await db.collection('deities').doc('zeus').get();

// View Firebase metrics
const fbMetrics = performanceMonitor.metrics.firebase;
fbMetrics.forEach(query => {
  console.log(`${query.collection}: ${query.duration}ms`);
});
```

**Tracked Data:**
- Collection path
- Operation type (get, set, update, delete)
- Query duration
- Result count
- Success/failure status

### 3. Resource Timing

Tracks all loaded resources (scripts, CSS, images, fonts):

```javascript
const scripts = performanceMonitor.getScriptsByLoadTime();
scripts.forEach(script => {
  console.log(`${script.name}: ${script.duration}ms (${script.size} bytes)`);
});
```

### 4. Custom Metrics

**Mark Important Points:**
```javascript
// Mark a point in time
performanceMonitor.mark('user_logged_in');

// Mark another point
performanceMonitor.mark('profile_loaded');

// Measure between marks
const duration = performanceMonitor.measure(
  'profile_load_time',
  'user_logged_in',
  'profile_loaded'
);
```

**Time Async Operations:**
```javascript
const result = await performanceMonitor.timeOperation(
  'fetchDeityData',
  async () => {
    return await db.collection('deities').doc('zeus').get();
  }
);
```

**Record User Interactions:**
```javascript
performanceMonitor.recordInteraction({
  name: 'search_query',
  duration: 450,
  query: 'greek gods',
  resultCount: 12
});
```

---

## Dashboard Usage

### Accessing the Dashboard

Open `performance-dashboard.html` in your browser.

### Dashboard Sections

#### 1. Key Metrics Cards
- **Page Load Time**: Total page load with visual bar indicator
- **First Contentful Paint**: Time to first content
- **Time to Interactive**: When page becomes usable
- **Firebase Queries**: Count and average duration
- **Total Resources**: Number and total size
- **Performance Alerts**: Warning and error count

Color coding:
- 🟢 Green: Optimal performance
- 🟡 Yellow: Warning threshold
- 🔴 Red: Exceeded target

#### 2. Performance Alerts
Real-time alerts when thresholds are exceeded:
```
⚠️ Slow Firebase query: deities/zeus took 1250ms
⚠️ Page load time exceeded threshold: 3200ms > 3000ms
```

#### 3. Charts

**Firebase Query Performance**
- Bar chart showing average query time per collection
- Identifies slow collections at a glance

**Resource Load Distribution**
- Doughnut chart of resource types (scripts, CSS, images, etc.)

**Navigation Timing Breakdown**
- Horizontal bar chart of load phase durations

#### 4. Firebase Query Details Table
Real-time table of all Firebase queries:
- Collection path
- Operation type
- Duration (color-coded)
- Success status
- Result count
- Timestamp

#### 5. Script Loading Waterfall
Visual waterfall showing script load times:
- Sorted by duration (slowest first)
- Shows relative timing

#### 6. Resource Summary Table
Aggregated stats by resource type:
- Count
- Total size
- Average duration
- Cache hit rate

### Dashboard Actions

**Refresh**: Manually refresh all metrics
```javascript
refreshDashboard();
```

**Export**: Download JSON report
```javascript
exportMetrics(); // Downloads performance-report-[timestamp].json
```

**Clear**: Clear all recorded metrics
```javascript
clearMetrics();
```

---

## Integration Guide

### Basic Integration

Add to your HTML pages:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- ... other head content ... -->

  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

  <!-- Firebase Config & Init -->
  <script src="firebase-config.js"></script>
  <script src="js/firebase-init.js"></script>

  <!-- Performance Monitor -->
  <script src="js/performance-monitor.js"></script>
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

### Tracking Custom Operations

**Example 1: Track deity page render**
```javascript
async function renderDeityPage(deityId) {
  performanceMonitor.mark('deity_render_start');

  // Fetch deity data (automatically tracked)
  const deity = await db.collection('deities').doc(deityId).get();

  // Render UI
  renderDeityUI(deity.data());

  performanceMonitor.mark('deity_render_end');
  performanceMonitor.measure(
    'deity_page_render',
    'deity_render_start',
    'deity_render_end'
  );
}
```

**Example 2: Track search performance**
```javascript
async function performSearch(query) {
  const result = await performanceMonitor.timeOperation(
    'search_operation',
    async () => {
      const results = await searchIndex.search(query);
      return results;
    }
  );

  performanceMonitor.recordInteraction({
    name: 'search',
    duration: result.duration,
    query: query,
    resultCount: result.length
  });
}
```

**Example 3: Track shader initialization**
```javascript
async function initShaders() {
  performanceMonitor.mark('shader_init_start');

  // Initialize WebGL and shaders
  await setupWebGL();
  await compileShaders();

  performanceMonitor.mark('shader_init_end');
  const duration = performanceMonitor.measure(
    'shader_initialization',
    'shader_init_start',
    'shader_init_end'
  );

  if (duration > 800) {
    console.warn('Shader initialization slow:', duration);
  }
}
```

### Listening to Performance Events

```javascript
// Listen for performance alerts
window.addEventListener('performanceAlert', (event) => {
  const { level, message, timestamp } = event.detail;

  console.log(`[${level.toUpperCase()}] ${message}`);

  // Send to analytics
  if (window.gtag) {
    gtag('event', 'performance_alert', {
      level: level,
      message: message
    });
  }
});

// Listen for auth state changes
window.addEventListener('firebaseAuthStateChanged', (event) => {
  console.log('Auth change detected, performance tracked');
});
```

---

## API Reference

### PerformanceMonitor Class

#### Properties

```javascript
performanceMonitor.metrics
  .navigation      // Navigation timing data
  .firebase        // Array of Firebase queries
  .resources       // Array of loaded resources
  .interactions    // Array of user interactions
  .custom          // Array of custom measurements

performanceMonitor.alerts  // Array of performance alerts
```

#### Methods

**mark(name)**
```javascript
performanceMonitor.mark('operation_start');
```
Creates a performance mark at the current time.

**measure(name, startMark, endMark)**
```javascript
const duration = performanceMonitor.measure(
  'operation_duration',
  'operation_start',
  'operation_end'
);
```
Measures duration between two marks.

**timeOperation(name, operation)**
```javascript
const result = await performanceMonitor.timeOperation(
  'data_fetch',
  async () => {
    return await fetchData();
  }
);
```
Times an async operation and records metrics.

**recordInteraction(interaction)**
```javascript
performanceMonitor.recordInteraction({
  name: 'button_click',
  duration: 50,
  action: 'submit_form'
});
```
Records a user interaction with custom data.

**getMetrics()**
```javascript
const metrics = performanceMonitor.getMetrics();
```
Returns all collected metrics.

**getSummary()**
```javascript
const summary = performanceMonitor.getSummary();
// {
//   pageLoad: 2345,
//   firstContentfulPaint: 1200,
//   timeToInteractive: 3100,
//   firebaseQueries: 8,
//   avgFirebaseQueryTime: 245,
//   ...
// }
```
Returns summarized performance data.

**exportReport()**
```javascript
const report = performanceMonitor.exportReport();
```
Generates comprehensive performance report.

**exportMetrics()**
```javascript
const json = performanceMonitor.exportMetrics();
```
Exports all metrics as JSON string.

**clear()**
```javascript
performanceMonitor.clear();
```
Clears all collected metrics and alerts.

**stop()**
```javascript
performanceMonitor.stop();
```
Stops all monitoring and disconnects observers.

---

## Alert Configuration

### Default Thresholds

Located in `js/performance-monitor.js`:

```javascript
this.thresholds = {
  pageLoad: 3000,           // 3 seconds
  firebaseQuery: 1000,      // 1 second
  authTime: 2000,           // 2 seconds
  scriptLoad: 1500,         // 1.5 seconds
  timeToInteractive: 5000,  // 5 seconds
  firstContentfulPaint: 2000 // 2 seconds
};
```

### Customizing Thresholds

```javascript
// After page load, modify thresholds
performanceMonitor.thresholds.firebaseQuery = 500; // More strict
performanceMonitor.thresholds.pageLoad = 4000;     // More lenient
```

### Alert Levels

Alerts have three levels:
- **info**: Informational, minor threshold exceeded
- **warning**: Performance issue detected
- **error**: Critical performance problem

### Custom Alert Handling

```javascript
window.addEventListener('performanceAlert', (event) => {
  const { level, message, timestamp } = event.detail;

  switch (level) {
    case 'error':
      // Send to error tracking service
      sendToSentry({ type: 'performance', message });
      break;

    case 'warning':
      // Log to analytics
      logToAnalytics('performance_warning', message);
      break;

    case 'info':
      // Console only
      console.info(message);
      break;
  }
});
```

---

## Best Practices

### 1. Strategic Marking

Mark important lifecycle events:

```javascript
// Page initialization
performanceMonitor.mark('page_init');

// Firebase ready
performanceMonitor.mark('firebase_ready');

// UI rendered
performanceMonitor.mark('ui_rendered');

// Measure total init time
performanceMonitor.measure('total_init', 'page_init', 'ui_rendered');
```

### 2. Batch Operations

For multiple Firebase queries, use batch timing:

```javascript
const result = await performanceMonitor.timeOperation(
  'load_pantheon',
  async () => {
    const [deities, heroes, creatures] = await Promise.all([
      db.collection('deities').where('mythology', '==', 'greek').get(),
      db.collection('heroes').where('mythology', '==', 'greek').get(),
      db.collection('creatures').where('mythology', '==', 'greek').get()
    ]);
    return { deities, heroes, creatures };
  }
);
```

### 3. Regular Monitoring

Set up regular performance checks:

```javascript
// Check performance every 5 minutes
setInterval(() => {
  const summary = performanceMonitor.getSummary();

  if (summary.avgFirebaseQueryTime > 500) {
    console.warn('Firebase queries slowing down');
  }

  if (summary.alerts > 10) {
    console.error('Too many performance alerts!');
  }
}, 300000);
```

### 4. Performance Budgets

Implement budgets for critical pages:

```javascript
function checkPerformanceBudget() {
  const summary = performanceMonitor.getSummary();

  const budgets = {
    pageLoad: 3000,
    firebaseQueries: 5,
    totalSize: 2000000 // 2MB
  };

  const violations = [];

  if (summary.pageLoad > budgets.pageLoad) {
    violations.push('Page load exceeded budget');
  }

  if (summary.firebaseQueries > budgets.firebaseQueries) {
    violations.push('Too many Firebase queries');
  }

  if (summary.totalSize > budgets.totalSize) {
    violations.push('Page size exceeded budget');
  }

  return violations;
}
```

### 5. Production Monitoring

For production, send metrics to analytics:

```javascript
// On page unload, send performance data
window.addEventListener('beforeunload', () => {
  const summary = performanceMonitor.getSummary();

  // Send to Google Analytics
  if (window.gtag) {
    gtag('event', 'page_performance', {
      page_load: summary.pageLoad,
      fcp: summary.firstContentfulPaint,
      tti: summary.timeToInteractive,
      firebase_queries: summary.firebaseQueries
    });
  }

  // Or send to custom endpoint
  navigator.sendBeacon('/api/metrics', JSON.stringify(summary));
});
```

---

## Troubleshooting

### Firebase Queries Not Tracked

**Problem**: Firebase queries don't appear in metrics

**Solutions**:
1. Ensure Firebase is initialized before performance monitor
2. Check that `firebase-init.js` loads before `performance-monitor.js`
3. Verify `window.db` is available:
   ```javascript
   console.log('Firebase DB:', window.db);
   ```

### Navigation Timing Not Captured

**Problem**: Navigation metrics show as `0` or `--`

**Solutions**:
1. Wait for `window.load` event:
   ```javascript
   window.addEventListener('load', () => {
     console.log(performanceMonitor.metrics.navigation);
   });
   ```
2. Check browser support:
   ```javascript
   if (!performance.timing) {
     console.warn('Navigation Timing API not supported');
   }
   ```

### Dashboard Shows No Data

**Problem**: Dashboard displays "--" for all metrics

**Solutions**:
1. Open browser console and check for errors
2. Verify performance monitor loaded:
   ```javascript
   console.log('Monitor loaded:', window.performanceMonitor);
   ```
3. Check if metrics exist:
   ```javascript
   console.log(performanceMonitor.getMetrics());
   ```
4. Ensure dashboard auto-refresh is running

### Alerts Not Appearing

**Problem**: No alerts despite slow performance

**Solutions**:
1. Check threshold configuration
2. Verify alert system is active:
   ```javascript
   console.log('Alerts:', performanceMonitor.alerts);
   ```
3. Listen to alert events manually:
   ```javascript
   window.addEventListener('performanceAlert', console.log);
   ```

### Performance Monitor Slowing Down Site

**Problem**: Monitoring itself causes performance issues

**Solutions**:
1. Stop monitoring in production:
   ```javascript
   if (location.hostname === 'production.com') {
     performanceMonitor.stop();
   }
   ```
2. Sample monitoring (only 10% of users):
   ```javascript
   if (Math.random() > 0.1) {
     performanceMonitor.stop();
   }
   ```
3. Limit data retention:
   ```javascript
   // Clear metrics every 5 minutes
   setInterval(() => performanceMonitor.clear(), 300000);
   ```

---

## Performance Optimization Tips

### Based on Monitoring Data

1. **Slow Firebase Queries**
   - Add composite indexes
   - Reduce query complexity
   - Cache results client-side

2. **Large Page Load Time**
   - Lazy load images
   - Code split JavaScript
   - Implement resource preloading

3. **Slow Scripts**
   - Move to async/defer loading
   - Split large bundles
   - Tree-shake unused code

4. **Many Resources**
   - Bundle CSS/JS files
   - Use HTTP/2 server push
   - Implement service worker caching

---

## Appendix: Benchmark Targets

See `performance-benchmarks.json` for detailed targets:

| Metric | Target | Warning | Optimal |
|--------|--------|---------|---------|
| Page Load | 3000ms | 2000ms | 1500ms |
| FCP | 2000ms | 1500ms | 1000ms |
| TTI | 5000ms | 3500ms | 2500ms |
| Firebase Query | 1000ms | 500ms | 200ms |
| Auth Time | 2000ms | 1500ms | 1000ms |
| Script Load | 1500ms | 1000ms | 500ms |

---

## Support & Contributing

For issues or improvements:
1. Check existing metrics and logs
2. Export performance report
3. Review benchmark targets
4. Document findings in issue tracker

---

**Version**: 1.0.0
**Last Updated**: 2025-12-27
**Author**: Eyes of Azrael Development Team
