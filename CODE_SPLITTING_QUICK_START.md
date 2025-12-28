# Code Splitting Quick Start Guide

## 🚀 Activate Dynamic Code Splitting (2 Minutes)

### Step 1: Update index.html

Find this line (~line 252):
```html
<script src="js/spa-navigation.js"></script>
```

Replace with:
```html
<script src="js/spa-navigation-dynamic.js"></script>
```

### Step 2: Update app-init-simple.js

Find this line (~line 76):
```javascript
window.EyesOfAzrael.navigation = new SPANavigation(
    db,
    window.EyesOfAzrael.auth,
    window.EyesOfAzrael.renderer
);
```

Replace with:
```javascript
window.EyesOfAzrael.navigation = new SPANavigationDynamic(
    db,
    window.EyesOfAzrael.auth,
    window.EyesOfAzrael.renderer
);
```

### Step 3: Test

1. Clear browser cache (Ctrl+Shift+Delete)
2. Load home page
3. Open DevTools Network tab
4. Navigate between routes

**You should see:**
- ✅ Only 71KB loaded initially (vs 160KB before)
- ✅ Routes load on-demand
- ✅ Cached routes load instantly
- ✅ Loading indicators during transitions

---

## 📊 Check Performance

```javascript
// In browser console:
window.EyesOfAzrael.navigation.getPerformanceStats()

// Output:
// {
//   cacheHits: 15,
//   cacheMisses: 7,
//   cacheHitRate: 68.2,
//   averageLoadTime: 156.6
// }
```

---

## 🔄 Rollback (If Needed)

Revert the two changes above to return to synchronous loading. Both systems are maintained for compatibility.

---

## 📈 Expected Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial load | 160 KB | 71 KB | **-55%** |
| Cached routes | 160 KB | 0 KB | **Instant** |
| First route | 160 KB | 116 KB | **-27%** |

---

## 🐛 Troubleshooting

**Routes not loading?**
- Check browser console for errors
- Ensure all component files have ES module exports
- Verify file paths are correct

**Performance not improved?**
- Clear browser cache completely
- Check Network tab to verify dynamic imports
- Ensure modulepreload hints are in index.html

**Need help?**
See `CODE_SPLITTING_IMPLEMENTATION_REPORT.md` for full documentation.

---

## ✅ Success Indicators

After activation, you should see in console:

```
[SPA Dynamic] 🚀 initRouter() called
[SPA Dynamic] 📦 Dynamically importing HomeView...
[SPA Dynamic] ✅ HomeView loaded in 45.67ms
[SPA Dynamic] ⚡ Cache hit: HomeView
```

---

**Ready to go? Just make the 2 changes above!**
