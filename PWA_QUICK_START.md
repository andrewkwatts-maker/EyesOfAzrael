# PWA Service Worker - Quick Start Guide

## 🚀 Quick Testing (5 Minutes)

### 1. Start Your Server
```bash
# Option 1: Firebase
firebase serve

# Option 2: Any HTTP server
npx http-server -p 8080

# Option 3: Python
python -m http.server 8080
```

### 2. Open Testing Dashboard
```
http://localhost:8080/pwa-test.html
```

### 3. Verify Service Worker
- Check "Service Worker" card
- Status should show: ✅ "Active"
- Scope should show: "/"

### 4. Test Offline Mode
```
1. Open DevTools (F12)
2. Network tab → Set to "Offline"
3. Navigate to http://localhost:8080/
4. Should see beautiful offline page
5. Set back to "Online" → Auto-reloads
```

## 📁 Files Overview

```
/
├── service-worker.js              # Main service worker (already exists)
├── offline.html                   # Offline fallback page (already exists)
├── manifest.json                  # PWA manifest (already exists)
├── pwa-test.html                  # Testing dashboard (NEW)
├── index.html                     # Updated with SW registration
└── js/
    ├── sw-register.js            # SW registration script (NEW)
    └── sw-update-notifier.js     # Update notification UI (NEW)
```

## 🎯 Key Features

### Automatic Features (No Config Needed):
- ✅ Service worker auto-registers on page load
- ✅ Critical assets cached immediately
- ✅ Offline support enabled automatically
- ✅ Updates check every hour
- ✅ User gets notification for updates

### Performance Benefits:
- 🚀 **First visit:** Normal load time
- ⚡ **Repeat visits:** 80-90% faster
- 📱 **Offline:** Basic functionality works
- 🔄 **Updates:** Seamless with user control

## 🔧 Console Commands

### Debug Utilities (In Browser Console):
```javascript
// View service worker info
await window.swDebug.getRegistration()

// View all caches
await window.swDebug.getCacheInfo()

// Clear all caches
await window.swDebug.clearCaches()

// Unregister service worker
await window.swDebug.unregister()
```

## 📊 Check Performance

### Before (First Visit):
```javascript
// In DevTools Network tab
- Resources loaded from server
- Check "Size" column → shows file sizes
- Note total load time
```

### After (Repeat Visit):
```javascript
// Refresh page
- Resources loaded from ServiceWorker
- Check "Size" column → shows "(from ServiceWorker)"
- Load time should be 80-90% faster
```

## 🎨 Caching Strategies

### What Gets Cached:

**Cache First (Instant):**
- CSS files → `/css/*.css`
- JavaScript → `/js/*.js`
- Images → `*.png, *.jpg, *.svg`
- Fonts → `*.woff, *.woff2`

**Network First (Fresh):**
- API calls → `/api/*`
- Firebase data → `firestore.googleapis.com`

**Stale While Revalidate:**
- HTML pages → `*.html`

## 🔄 Update Flow

### How Updates Work:
```
1. Developer pushes new version
2. User visits site
3. SW checks for updates (hourly)
4. New SW installed in background
5. User sees notification: "Update Available!"
6. User clicks "Update Now"
7. New SW activates
8. Page reloads with new version
```

## 📱 Install as App

### Desktop (Chrome/Edge):
```
1. Look for install icon in address bar
2. Click to install
3. App opens in standalone window
```

### Mobile (Android):
```
1. Menu → "Add to Home Screen"
2. App icon appears on home screen
3. Tap to open as standalone app
```

### iOS (Safari):
```
1. Share button
2. "Add to Home Screen"
3. Icon appears on home screen
```

## 🐛 Troubleshooting

### Service Worker Not Working?
```javascript
// 1. Check HTTPS (or localhost)
// 2. Hard refresh: Ctrl + Shift + R
// 3. Clear site data in DevTools
// 4. Check console for errors
```

### Cache Not Updating?
```javascript
// Force update:
window.swDebug.clearCaches()
window.swDebug.unregister()
// Then reload page
```

### Offline Page Not Showing?
```javascript
// Check if offline.html is cached:
caches.keys().then(keys => {
  keys.forEach(key => {
    caches.open(key).then(cache => {
      cache.match('/offline.html').then(r => {
        console.log(key, r ? '✅ Has offline.html' : '❌ Missing');
      });
    });
  });
});
```

## 📈 Testing Checklist

- [ ] Service worker registers on load
- [ ] Static assets cache correctly
- [ ] Offline mode shows fallback page
- [ ] Update notification appears
- [ ] Can install as PWA
- [ ] Performance 80%+ faster on repeat visits
- [ ] Mobile install works
- [ ] Testing dashboard accessible

## 🎓 Learn More

### Service Worker Docs:
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Google: https://web.dev/service-workers/

### Testing Tools:
- Chrome DevTools → Application tab
- Lighthouse audit (PWA score)
- `/pwa-test.html` dashboard

### Performance Analysis:
- Network tab → Check "(from ServiceWorker)"
- Performance tab → Measure load times
- Application tab → View cache storage

## 💡 Tips

1. **Always test on HTTPS** (or localhost for development)
2. **Hard refresh** (Ctrl+Shift+R) to bypass cache during dev
3. **Use incognito** for fresh-state testing
4. **Check DevTools console** for SW logs
5. **Test offline mode** regularly

## 🎉 Success Indicators

✅ **Service Worker Active:**
```
DevTools → Application → Service Workers
Status: "activated and is running"
```

✅ **Assets Cached:**
```
DevTools → Application → Cache Storage
Should see: eyes-of-azrael-v1.0.0
```

✅ **Offline Works:**
```
Network: Offline → Navigate → See offline.html
```

✅ **Fast Loading:**
```
Repeat visit: 80-90% faster than first visit
```

---

**Quick Links:**
- Testing Dashboard: `/pwa-test.html`
- Offline Page: `/offline.html`
- Full Report: `/AGENT_11_PWA_SERVICE_WORKER_REPORT.md`

**Need Help?** Check the full report for detailed documentation and troubleshooting.
