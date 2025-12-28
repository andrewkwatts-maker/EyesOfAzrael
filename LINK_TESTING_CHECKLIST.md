# Link Testing Checklist
**Eyes of Azrael - Manual Testing Guide**

Use this checklist to validate all links after applying fixes.

---

## Pre-Testing Setup

- [ ] All fixes applied to `js/spa-navigation.js`
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Firebase connection verified
- [ ] User authenticated (if required)
- [ ] Browser console open (F12) to monitor errors

---

## 🔴 CRITICAL ROUTES (Must Work)

### Header Navigation
- [ ] **Home** - Click `#/`
  - ✅ Should show landing page with 12 category cards
  - ✅ Cards should have hover effects
  - ✅ No console errors
  - Time to render: _____ ms

- [ ] **Search** - Click `#/search`
  - ✅ Should show search interface
  - ✅ Search input should be focusable
  - ✅ SearchViewComplete component loaded
  - Time to render: _____ ms

- [ ] **Compare** - Click `#/compare`
  - ✅ Should show comparison tool
  - ✅ CompareView component loaded
  - ✅ Can select entities to compare
  - Time to render: _____ ms

- [ ] **Dashboard** - Click `#/dashboard`
  - ✅ Should show user dashboard OR login prompt
  - ✅ UserDashboard component loaded
  - ✅ CRUD functionality available (if authenticated)
  - Time to render: _____ ms

### Legal Pages
- [ ] **About** - Click `#/about`
  - ✅ Should show about page content
  - ✅ AboutPage component loaded
  - Time to render: _____ ms

- [ ] **Privacy** - Click `#/privacy`
  - ✅ Should show privacy policy
  - ✅ PrivacyPage component loaded
  - Time to render: _____ ms

- [ ] **Terms** - Click `#/terms`
  - ✅ Should show terms of service
  - ✅ TermsPage component loaded
  - Time to render: _____ ms

---

## 🎯 LANDING PAGE CATEGORIES

Test each card on the home page:

### Row 1
- [ ] **1. World Mythologies** - Click card
  - Route: `#/mythologies`
  - ✅ Should show grid of mythology cards
  - ✅ Cards should link to `/mythology/{id}`
  - Expected count: 12-22 mythologies
  - Actual count: _____

- [ ] **2. Deities & Gods** - Click card
  - Route: `#/browse/deities`
  - ✅ Should show deity cards
  - ✅ Filter/sort controls visible
  - ✅ BrowseCategoryView loaded
  - Entity count: _____

- [ ] **3. Heroes & Legends** - Click card
  - Route: `#/browse/heroes`
  - ✅ Should show hero cards
  - ✅ BrowseCategoryView loaded
  - Entity count: _____

- [ ] **4. Mythical Creatures** - Click card
  - Route: `#/browse/creatures`
  - ✅ Should show creature cards
  - ✅ BrowseCategoryView loaded
  - Entity count: _____

### Row 2
- [ ] **5. Sacred Items** - Click card
  - Route: `#/browse/items`
  - ✅ Should NOT show 404
  - ✅ BrowseCategoryView loaded
  - ✅ Shows items OR "No items found"
  - Entity count: _____ (may be 0)

- [ ] **6. Sacred Places** - Click card
  - Route: `#/browse/places`
  - ✅ Should NOT show 404
  - ✅ BrowseCategoryView loaded
  - ✅ Shows places OR "No places found"
  - Entity count: _____ (may be 0)

- [ ] **7. Archetypes** - Click card ⚠️ CRITICAL FIX
  - Route: `#/archetypes`
  - ✅ Should NOT show 404
  - ✅ Should show archetype content OR "Coming soon"
  - ✅ Check console for route match log
  - ✅ Verify `renderArchetypes()` was called
  - Status: _____

- [ ] **8. Magic Systems** - Click card ⚠️ CRITICAL FIX
  - Route: `#/magic`
  - ✅ Should NOT show 404
  - ✅ Should show magic content OR "No items found"
  - ✅ Check console for route match log
  - ✅ Verify `renderMagic()` was called
  - Status: _____

### Row 3
- [ ] **9. Sacred Herbalism** - Click card
  - Route: `#/browse/herbs`
  - ✅ Should NOT show 404
  - ✅ Shows herbs OR "No herbs found"
  - Entity count: _____ (may be 0)

- [ ] **10. Rituals & Practices** - Click card
  - Route: `#/browse/rituals`
  - ✅ Should NOT show 404
  - ✅ Shows rituals OR "No rituals found"
  - Entity count: _____ (may be 0)

- [ ] **11. Sacred Texts** - Click card
  - Route: `#/browse/texts`
  - ✅ Should NOT show 404
  - ✅ Shows texts OR "No texts found"
  - Entity count: _____ (may be 0)

- [ ] **12. Sacred Symbols** - Click card
  - Route: `#/browse/symbols`
  - ✅ Should NOT show 404
  - ✅ Shows symbols OR "No symbols found"
  - Entity count: _____ (may be 0)

---

## 🔄 DYNAMIC ROUTES

Test these manually by entering URLs in address bar:

### Mythology Detail Pages
- [ ] `#/mythology/greek`
  - ✅ Shows Greek mythology overview
  - ✅ Category cards visible (deities, heroes, etc.)
  - ✅ Entity counts displayed
  - Status: _____

- [ ] `#/mythology/norse`
  - ✅ Shows Norse mythology overview
  - Status: _____

- [ ] `#/mythology/nonexistent`
  - ✅ Shows appropriate error OR 404
  - Status: _____

### Browse with Mythology Filter
- [ ] `#/browse/deities/greek`
  - ✅ Shows ONLY Greek deities
  - ✅ Filter indicator visible
  - Count: _____

- [ ] `#/browse/heroes/norse`
  - ✅ Shows ONLY Norse heroes
  - Count: _____

### Entity Detail Pages (if implemented)
- [ ] `#/mythology/greek/deities/zeus`
  - ✅ Shows Zeus detail page OR "Coming soon"
  - Status: _____

- [ ] `#/entity/deities/greek/zeus` (alternative format)
  - ✅ Should work identically to above
  - Status: _____

---

## 🔍 CONSOLE VALIDATION

Check browser console for these logs:

### Successful Route Match
```
[SPA] ✅ Matched ARCHETYPES route
[SPA] ▶️  renderArchetypes() called
[SPA] ✅ Archetypes page rendered
[SPA] 📡 Emitting first-render-complete event
```

### Route Patterns
- [ ] Home route matches: `[SPA] ✅ Matched HOME route`
- [ ] Archetypes route matches: `[SPA] ✅ Matched ARCHETYPES route`
- [ ] Magic route matches: `[SPA] ✅ Matched MAGIC route`
- [ ] No unhandled 404s in console
- [ ] No JavaScript errors
- [ ] All Firebase queries successful

---

## ⚠️ ERROR CHECKS

### What to Look For
- [ ] No 404 errors in console
- [ ] No "Route not found" messages
- [ ] No undefined component errors
- [ ] No Firebase permission errors
- [ ] No CORS errors
- [ ] No authentication failures (unless expected)

### Expected Warnings (OK to ignore)
- ⚠️ "No items found" - Collection may be empty
- ⚠️ "Using cached data" - Normal cache behavior
- ⚠️ "Firebase query slow" - May indicate large datasets

### Critical Errors (Must Fix)
- ❌ "Route not matched" for `/archetypes` or `/magic`
- ❌ "Component not defined" errors
- ❌ "Cannot read property of undefined"
- ❌ White screen with no content

---

## 📊 PERFORMANCE CHECKS

Record load times for critical routes:

| Route | Target | Actual | Pass/Fail |
|-------|--------|--------|-----------|
| `#/` | < 2s | _____ | _____ |
| `#/mythologies` | < 3s | _____ | _____ |
| `#/browse/deities` | < 3s | _____ | _____ |
| `#/archetypes` | < 3s | _____ | _____ |
| `#/magic` | < 3s | _____ | _____ |
| `#/search` | < 2s | _____ | _____ |

---

## 🎨 VISUAL CHECKS

### Loading States
- [ ] Spinner shows while loading
- [ ] Skeleton screens display (if implemented)
- [ ] Smooth transitions between pages
- [ ] No jarring content jumps

### Card Styling
- [ ] All cards have consistent border radius
- [ ] Hover effects work on all cards
- [ ] Colors match the design system
- [ ] Icons display correctly
- [ ] Text is readable on all backgrounds

### Responsive Design
- [ ] Mobile view (< 768px) - Cards stack vertically
- [ ] Tablet view (768px - 1024px) - 2 columns
- [ ] Desktop view (> 1024px) - Auto-fill grid
- [ ] Touch targets are at least 44px on mobile

---

## 🔐 AUTHENTICATION CHECKS

If auth is required:

- [ ] Unauthenticated users see login prompt
- [ ] Authenticated users can access dashboard
- [ ] Auth guard prevents unauthorized access
- [ ] Login/logout flow works correctly
- [ ] User info displays in header

---

## 🌐 BROWSER COMPATIBILITY

Test in multiple browsers:

### Chrome
- [ ] All routes work
- [ ] No console errors
- Version: _____

### Firefox
- [ ] All routes work
- [ ] No console errors
- Version: _____

### Safari
- [ ] All routes work
- [ ] No console errors
- Version: _____

### Edge
- [ ] All routes work
- [ ] No console errors
- Version: _____

---

## 📱 MOBILE TESTING

Test on actual devices:

### iOS
- [ ] All links work
- [ ] Touch targets adequate
- [ ] Scrolling smooth
- Device: _____

### Android
- [ ] All links work
- [ ] Touch targets adequate
- [ ] Scrolling smooth
- Device: _____

---

## ✅ FINAL CHECKLIST

Before marking as complete:

- [ ] All 20 routes tested
- [ ] Zero 404 errors for featured routes
- [ ] All view components load correctly
- [ ] Firebase queries return data (or empty state)
- [ ] Console is free of critical errors
- [ ] Performance targets met
- [ ] Visual consistency maintained
- [ ] Responsive design works
- [ ] Browser compatibility verified
- [ ] Mobile functionality confirmed

---

## 📝 NOTES

### Issues Found
```
Issue 1: ___________________________________________
Fix applied: _______________________________________

Issue 2: ___________________________________________
Fix applied: _______________________________________

Issue 3: ___________________________________________
Fix applied: _______________________________________
```

### Performance Observations
```
Slowest route: ________________ (_____ ms)
Fastest route: ________________ (_____ ms)
Average load time: _____ ms
```

### Browser-Specific Issues
```
Chrome: ___________________________________________
Firefox: __________________________________________
Safari: ___________________________________________
Edge: _____________________________________________
```

---

## ✨ SUCCESS CRITERIA

**Testing is complete when:**
1. ✅ All 20 routes return valid content (not 404)
2. ✅ No JavaScript errors in console
3. ✅ All landing page cards link correctly
4. ✅ Performance targets met (<3s for all routes)
5. ✅ Works in all major browsers
6. ✅ Mobile responsive
7. ✅ Authentication working (if applicable)
8. ✅ Firebase data loading correctly

---

**Tester:** _____________________
**Date:** _____________________
**Status:** ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

**Overall Comments:**
```
_______________________________________________________
_______________________________________________________
_______________________________________________________
```
