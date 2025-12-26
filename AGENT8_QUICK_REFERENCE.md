# Agent 8: Diagnostic Dashboard - Quick Reference

## 🚀 Quick Access

**Dashboard URL:**
```
http://localhost:port/debug-dashboard.html
```

**Or add to any page header:**
```html
<a href="/debug-dashboard.html" style="position: fixed; bottom: 20px; right: 20px;
   background: #ef4444; color: white; padding: 10px 20px; border-radius: 8px;
   z-index: 10000; text-decoration: none; font-weight: bold;">
   🔍 Debug
</a>
```

---

## 📊 What It Shows

### Status Indicators
- 🟢 **Green** = System OK
- 🟡 **Yellow** = Warning (non-critical)
- 🔴 **Red** = Error (critical failure)
- ⚪ **Gray** = Unknown/Initializing

### Monitored Systems
1. **Firebase SDK** - SDK loaded and initialized
2. **Authentication** - User login state
3. **Navigation** - Routing and current page
4. **DOM Elements** - Critical UI elements
5. **Network** - API requests and responses
6. **Performance** - Page load and memory

---

## 🔍 Common Issues & Solutions

### Firebase Not Loading
**Symptoms:** Firebase card shows red
**Fix:** Check Firebase script tags, verify CDN

### User Not Signed In
**Symptoms:** Auth card shows yellow "No user signed in"
**Fix:** Sign in via Google Auth

### Navigation Broken
**Symptoms:** Nav card shows red, page won't load
**Fix:** Check SPANavigation initialization

### Missing DOM Elements
**Symptoms:** DOM card shows ✗ for elements
**Fix:** Verify HTML template has required IDs

### Network Failures
**Symptoms:** Network card shows errors
**Fix:** Check Firestore security rules

---

## 🛠️ Console Commands

```javascript
// Get all diagnostics
window.diagnosticCollector.getDiagnostics()

// Get system status (ok/warning/error)
window.diagnosticCollector.getSystemStatus()

// Get failure point
window.diagnosticCollector.getFailurePoint()

// Export JSON
window.diagnosticCollector.exportJSON()

// Clear logs
window.diagnosticCollector.clearLogs()
```

---

## 📁 Files Created

- `debug-dashboard.html` - Dashboard interface
- `js/diagnostic-collector.js` - Data collector
- `AGENT8_DIAGNOSTIC_DASHBOARD.md` - Full documentation

---

## ✅ Features

- ✅ Auto-refresh every 1 second
- ✅ Last 50 console logs
- ✅ Network request tracking
- ✅ Performance metrics
- ✅ Failure point detection
- ✅ JSON export
- ✅ Zero config required
- ✅ No performance impact

---

## 🎯 When to Use

Use the diagnostic dashboard when:
- App won't load
- Page is blank
- Features not working
- Debugging issues
- Reporting bugs
- Monitoring performance

**The dashboard tells you exactly what's broken and where.**

---

Created by Agent 8 | Full docs: `AGENT8_DIAGNOSTIC_DASHBOARD.md`
