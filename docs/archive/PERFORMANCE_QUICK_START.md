# Performance Monitoring - Quick Start Guide

## 🚀 Getting Started in 60 Seconds

### 1. Add to Your HTML Page
```html
<script src="js/performance-monitor.js"></script>
```

That's it! Monitoring starts automatically.

### 2. View the Dashboard
Open in browser: `performance-dashboard.html`

### 3. Test the System
Open in browser: `performance-test.html`

---

## 📊 Quick Commands

### Check Current Performance
```javascript
// Get summary
const summary = performanceMonitor.getSummary();
console.log('Page Load:', summary.pageLoad + 'ms');
console.log('Firebase Queries:', summary.firebaseQueries);
```

### Track Custom Operation
```javascript
// Time an async operation
const result = await performanceMonitor.timeOperation(
  'myOperation',
  async () => {
    // Your code here
    return await doSomething();
  }
);
```

### Mark Important Events
```javascript
performanceMonitor.mark('event_start');
// ... do something ...
performanceMonitor.mark('event_end');
performanceMonitor.measure('event_duration', 'event_start', 'event_end');
```

### Export Performance Report
```javascript
const report = performanceMonitor.exportReport();
// or use dashboard "Export" button
```

---

## 🎯 Performance Targets

| Metric | Target | Your Goal |
|--------|--------|-----------|
| Page Load | < 3s | Under threshold |
| First Paint | < 2s | Fast initial render |
| Firebase Query | < 1s | Quick data fetching |
| Time to Interactive | < 5s | Usable quickly |

---

## 🚨 Alerts

Automatic alerts when:
- ⚠️ Page load > 3 seconds
- ⚠️ Firebase query > 1 second
- ⚠️ Auth time > 2 seconds
- ℹ️ Script load > 1.5 seconds

Listen to alerts:
```javascript
window.addEventListener('performanceAlert', (event) => {
  console.log('Alert:', event.detail.message);
});
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `js/performance-monitor.js` | Core monitoring system |
| `performance-dashboard.html` | Live metrics dashboard |
| `performance-test.html` | Test suite |
| `performance-benchmarks.json` | Target metrics |
| `PERFORMANCE_MONITORING_GUIDE.md` | Full documentation |

---

## 🧪 Quick Test

1. Open `performance-test.html`
2. Click "Test Firebase Query"
3. Click "Open Dashboard" to see results
4. Watch metrics update in real-time

---

## 💡 Common Uses

### Track Page Load
```javascript
// Automatic - just include the script!
// View in dashboard or:
console.log(performanceMonitor.metrics.navigation);
```

### Monitor Firebase Queries
```javascript
// Automatic tracking of all Firestore operations
await db.collection('deities').get(); // Tracked!
```

### Custom Timing
```javascript
async function loadData() {
  return await performanceMonitor.timeOperation('load_data', async () => {
    return await fetchMyData();
  });
}
```

---

## 📈 Dashboard Features

- **Real-time metrics** - Updates every 2 seconds
- **Color-coded cards** - Green/Yellow/Red status
- **Interactive charts** - Firebase performance, resources
- **Alert panel** - Performance warnings
- **Export reports** - Download JSON data

---

## ⚙️ Configuration

### Change Thresholds
```javascript
// Make alerts more strict
performanceMonitor.thresholds.firebaseQuery = 500; // 500ms instead of 1000ms

// Or more lenient
performanceMonitor.thresholds.pageLoad = 4000; // 4s instead of 3s
```

### Stop Monitoring
```javascript
performanceMonitor.stop(); // Stop all tracking
```

### Clear Data
```javascript
performanceMonitor.clear(); // Reset all metrics
```

---

## 🔧 Integration Examples

### With Authentication
```javascript
// Auth timing is automatically tracked!
window.addEventListener('firebaseAuthStateChanged', (event) => {
  console.log('Auth completed, check performance metrics');
});
```

### With Search
```javascript
async function search(query) {
  return await performanceMonitor.timeOperation('search', async () => {
    const results = await performSearch(query);

    performanceMonitor.recordInteraction({
      name: 'search',
      query: query,
      resultCount: results.length
    });

    return results;
  });
}
```

### With Page Render
```javascript
performanceMonitor.mark('render_start');
renderPage();
performanceMonitor.mark('render_end');
performanceMonitor.measure('page_render', 'render_start', 'render_end');
```

---

## 🎓 Learn More

- **Full Guide**: `PERFORMANCE_MONITORING_GUIDE.md` (60+ pages)
- **Implementation Summary**: `PERFORMANCE_MONITORING_SUMMARY.md`
- **Benchmark Targets**: `performance-benchmarks.json`

---

## ✅ Quick Checklist

- [ ] Add `performance-monitor.js` to your page
- [ ] Open `performance-dashboard.html` to view metrics
- [ ] Run tests in `performance-test.html`
- [ ] Check your page load time (should be < 3s)
- [ ] Verify Firebase queries are tracked
- [ ] Review any performance alerts
- [ ] Export a performance report

---

## 🆘 Troubleshooting

**No metrics showing?**
- Ensure page has fully loaded
- Check browser console for errors
- Verify `performance-monitor.js` loaded

**Firebase queries not tracked?**
- Ensure Firebase initialized first
- Check `window.db` is available
- Load order: firebase-config.js → firebase-init.js → performance-monitor.js

**Dashboard shows no data?**
- Refresh the page
- Check if `performanceMonitor` exists in console
- Try running a test in `performance-test.html`

---

## 📞 Quick Support

```javascript
// Check if monitor is working
console.log('Monitor active:', window.performanceMonitor);

// Get all metrics
console.log('Current metrics:', performanceMonitor.getMetrics());

// Get summary
console.log('Summary:', performanceMonitor.getSummary());

// Check alerts
console.log('Alerts:', performanceMonitor.alerts);
```

---

**Ready to monitor?** Open `performance-dashboard.html` and start tracking!

**Want to test?** Open `performance-test.html` and run the test suite!

**Need details?** Read `PERFORMANCE_MONITORING_GUIDE.md` for everything!

---

*Performance Monitoring System v1.0.0 - Eyes of Azrael*
