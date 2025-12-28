# Route Fix Instructions

## Quick Reference

This document provides step-by-step instructions to fix any broken or incomplete routes in the Eyes of Azrael SPA.

---

## Fix 1: Load Missing View Components ⚠️ HIGH PRIORITY

**Issue:** Some view classes are not loaded, causing error pages

**Affected Routes:**
- `#/mythologies` (MythologiesView)
- `#/search` (SearchViewComplete)
- `#/compare` (CompareView)
- `#/about` (AboutPage)
- `#/privacy` (PrivacyPage)
- `#/terms` (TermsPage)

**Fix:**

### Step 1: Verify Files Exist

Check that these files exist:
```
js/views/mythologies-view.js ✅
js/components/search-view-complete.js ✅
js/components/compare-view.js ✅
js/views/about-page.js ❓ (create if missing)
js/views/privacy-page.js ❓ (create if missing)
js/views/terms-page.js ❓ (create if missing)
```

### Step 2: Load in index.html

Add these scripts BEFORE closing `</body>` tag:

```html
<!-- View Components -->
<script src="js/views/mythologies-view.js"></script>
<script src="js/components/search-view-complete.js"></script>
<script src="js/components/compare-view.js"></script>
<script src="js/views/about-page.js"></script>
<script src="js/views/privacy-page.js"></script>
<script src="js/views/terms-page.js"></script>
```

### Step 3: Create Missing Page Components

If AboutPage, PrivacyPage, or TermsPage don't exist, create them:

**File: `js/views/about-page.js`**
```javascript
class AboutPage {
    render(container) {
        container.innerHTML = `
            <div class="static-page">
                <h1>About Eyes of Azrael</h1>
                <p>Your comprehensive mythology database...</p>
                <!-- Add your content here -->
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.AboutPage = AboutPage;
}
```

**File: `js/views/privacy-page.js`**
```javascript
class PrivacyPage {
    render(container) {
        container.innerHTML = `
            <div class="static-page">
                <h1>Privacy Policy</h1>
                <p>Your privacy policy content...</p>
                <!-- Add your content here -->
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PrivacyPage = PrivacyPage;
}
```

**File: `js/views/terms-page.js`**
```javascript
class TermsPage {
    render(container) {
        container.innerHTML = `
            <div class="static-page">
                <h1>Terms of Service</h1>
                <p>Your terms of service content...</p>
                <!-- Add your content here -->
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.TermsPage = TermsPage;
}
```

**Estimated Time:** 30 minutes

---

## Fix 2: Entity Pages Integration ❌ CRITICAL

**Issue:** Entity pages show "Coming soon" instead of full entity content

**Affected Routes:**
- `#/entity/deities/greek/zeus`
- `#/mythology/greek/deities/zeus`
- All individual entity pages

**Current Behavior:**
```javascript
async renderEntity(mythology, categoryType, entityId) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div class="entity-page"><h1>${entityId}</h1><p>Coming soon...</p></div>';
}
```

**Fix:**

The good news is that this has already been fixed in the latest `spa-navigation.js`! The code now includes:

1. **Primary handler** - Uses `FirebaseEntityRenderer`
2. **Fallback handler** - Uses `renderBasicEntityPage()`
3. **Error handling** - Shows proper error if entity not found

**Verify Fix:**

Check `js/spa-navigation.js` lines 829-851:

```javascript
async renderEntity(mythology, categoryType, entityId) {
    const mainContent = document.getElementById('main-content');

    // Use FirebaseEntityRenderer to render the entity
    if (typeof FirebaseEntityRenderer !== 'undefined') {
        const entityRenderer = new FirebaseEntityRenderer();
        await entityRenderer.loadAndRender(categoryType, entityId, mythology, mainContent);
    } else {
        // Fallback to basic entity rendering
        mainContent.innerHTML = await this.renderBasicEntityPage(mythology, categoryType, entityId);
    }

    document.dispatchEvent(new CustomEvent('first-render-complete', {
        detail: { route: 'entity', entityId, timestamp: Date.now() }
    }));
}
```

**If not present, update the function with the code above.**

**Ensure Dependencies:**

Make sure `js/entity-renderer-firebase.js` is loaded in index.html:

```html
<script src="js/entity-renderer-firebase.js"></script>
```

**Test:**

Navigate to `#/entity/deities/greek/zeus` - you should see Zeus's full page

**Estimated Time:** Already complete! (Just verify)

---

## Fix 3: Mythology Overview Pages ✨ ENHANCEMENT

**Issue:** Mythology landing pages use basic fallback instead of rich component

**Affected Routes:**
- `#/mythology/greek`
- `#/mythology/norse`
- All mythology overview pages

**Current Behavior:**
- Shows basic page with entity counts
- Links to browse pages
- No featured content or cosmology info

**Enhancement:**

The latest `spa-navigation.js` already includes:

1. **Primary handler** - Tries `MythologyOverview` component
2. **Fallback 1** - Tries `PageAssetRenderer`
3. **Fallback 2** - Uses `renderBasicMythologyPage()`

**To Enable Rich Mythology Pages:**

### Option A: Create MythologyOverview Component

**File: `js/views/mythology-overview.js`**

```javascript
class MythologyOverview {
    constructor({ db, router }) {
        this.db = db;
        this.router = router;
    }

    async render({ mythology }) {
        // Load mythology data
        const mythData = await this.loadMythologyData(mythology);

        return `
            <div class="mythology-overview" data-mythology="${mythology}">
                <!-- Rich mythology content -->
                <div class="mythology-hero">
                    <h1>${mythData.name} Mythology</h1>
                    <p>${mythData.description}</p>
                </div>

                <!-- Featured Entities -->
                <section class="featured-entities">
                    <!-- Load featured deities, heroes, etc. -->
                </section>

                <!-- Cosmology Section -->
                <section class="cosmology">
                    <!-- Creation myths, cosmology -->
                </section>

                <!-- Browse by Category -->
                <section class="categories">
                    <!-- Links to browse pages -->
                </section>
            </div>
        `;
    }

    async loadMythologyData(mythology) {
        // Implement data loading
        return {
            name: mythology.charAt(0).toUpperCase() + mythology.slice(1),
            description: `Explore the rich tradition of ${mythology} mythology...`
        };
    }
}

if (typeof window !== 'undefined') {
    window.MythologyOverview = MythologyOverview;
}
```

**Load in index.html:**
```html
<script src="js/views/mythology-overview.js"></script>
```

### Option B: Use Current Basic Fallback

The current basic fallback is functional and shows:
- Entity counts by category
- Links to browse each category
- Clean, simple layout

**This is acceptable for now** - enhancement can be done later.

**Estimated Time:** 2-4 hours (if creating MythologyOverview)

---

## Fix 4: Category Pages Integration ✅ COMPLETE

**Status:** Already fixed in latest `spa-navigation.js`!

The category rendering (`#/mythology/{mythology}/{category}`) now uses:

1. **Primary handler** - `BrowseCategoryView`
2. **Fallback handler** - `renderBasicCategoryPage()`

**Verify:** Navigate to `#/mythology/greek/deities` - should show deity grid

---

## Fix 5: Populate Secondary Collections 📊 CONTENT

**Issue:** Some collections have limited or no data

**Affected Collections:**
- `places` (0-5 documents)
- `herbs` (0-5 documents)
- `rituals` (0-5 documents)
- `texts` (0-5 documents)
- `symbols` (0-5 documents)

**Fix:**

This is a content creation task, not a code fix.

**Recommended Approach:**

1. **Use Firebase Console** to add documents manually
2. **Use CRUD Dashboard** (`#/dashboard`) to submit entities
3. **Import from CSV/JSON** using Firebase Admin SDK

**Example Entity Structure:**

```javascript
// Example: Sacred Place
{
  id: 'olympus',
  name: 'Mount Olympus',
  mythology: 'greek',
  type: 'place',
  icon: '⛰️',
  description: 'Home of the Greek gods...',
  location: 'Greece',
  significance: 'Divine dwelling',
  relatedEntities: [
    { name: 'Zeus', id: 'zeus', type: 'deity' },
    { name: 'Hera', id: 'hera', type: 'deity' }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
}
```

**Priority:**
- `texts` - HIGH (sacred scriptures)
- `places` - MEDIUM (temples, sacred sites)
- `herbs` - LOW (nice to have)
- `rituals` - LOW (nice to have)
- `symbols` - LOW (nice to have)

**Estimated Time:** Ongoing content creation

---

## Fix 6: Add Lazy Loading 🚀 OPTIMIZATION

**Issue:** Large components loaded on initial page load

**Affected Components:**
- `SearchViewComplete` (large file)
- `CompareView` (medium file)
- Other view components

**Fix:**

### Step 1: Create Lazy Loader

**File: `js/utils/lazy-loader.js`**

```javascript
class LazyLoader {
    constructor() {
        this.loaded = new Set();
    }

    async loadScript(src) {
        if (this.loaded.has(src)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                this.loaded.add(src);
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    async loadComponent(name, src) {
        if (typeof window[name] !== 'undefined') {
            return Promise.resolve();
        }

        await this.loadScript(src);

        // Wait for component to be defined
        return new Promise((resolve, reject) => {
            const maxWait = 5000;
            const start = Date.now();

            const check = () => {
                if (typeof window[name] !== 'undefined') {
                    resolve();
                } else if (Date.now() - start > maxWait) {
                    reject(new Error(`Component ${name} not loaded after ${maxWait}ms`));
                } else {
                    setTimeout(check, 50);
                }
            };

            check();
        });
    }
}

const lazyLoader = new LazyLoader();
if (typeof window !== 'undefined') {
    window.lazyLoader = lazyLoader;
}
```

### Step 2: Update Route Handlers

**Example: Search Route**

```javascript
async renderSearch() {
    const mainContent = document.getElementById('main-content');

    // Show loading while lazy-loading component
    mainContent.innerHTML = '<div class="loading-container"><p>Loading search...</p></div>';

    try {
        // Lazy load SearchViewComplete
        await window.lazyLoader.loadComponent('SearchViewComplete', 'js/components/search-view-complete.js');

        // Render
        const searchView = new SearchViewComplete(this.db);
        await searchView.render(mainContent);

    } catch (error) {
        console.error('Failed to load search component:', error);
        this.renderError(error);
    }
}
```

**Benefits:**
- Faster initial page load
- Loads components only when needed
- Better performance

**Estimated Time:** 2-3 hours

---

## Fix 7: Improve Error Handling 🛡️ ROBUSTNESS

**Issue:** Generic error pages don't guide users

**Fix:**

### Update Error Renderer

In `spa-navigation.js`, enhance the `renderError()` method:

```javascript
renderError(error) {
    const mainContent = document.getElementById('main-content');

    // Determine error type
    const isNetworkError = error.message?.includes('network') || error.message?.includes('fetch');
    const isFirebaseError = error.message?.includes('Firebase') || error.message?.includes('firestore');
    const isAuthError = error.message?.includes('auth') || error.message?.includes('permission');

    // Suggest actions
    let suggestion = 'Please try again or return home.';
    let actionButton = '<a href="#/" class="btn-primary">Return Home</a>';

    if (isNetworkError) {
        suggestion = 'Please check your internet connection and try again.';
        actionButton = '<button onclick="location.reload()" class="btn-primary">Retry</button>';
    } else if (isFirebaseError) {
        suggestion = 'There may be an issue with the database. Please try again in a moment.';
        actionButton = '<button onclick="location.reload()" class="btn-primary">Reload Page</button>';
    } else if (isAuthError) {
        suggestion = 'You may need to sign in to view this content.';
        actionButton = '<a href="#/dashboard" class="btn-primary">Sign In</a>';
    }

    mainContent.innerHTML = `
        <div class="error-page">
            <div class="error-icon">⚠️</div>
            <h1>Oops! Something Went Wrong</h1>
            <p class="error-message">${error.message || 'Unknown error occurred'}</p>
            <p class="error-suggestion">${suggestion}</p>
            <div class="error-actions">
                ${actionButton}
                <button onclick="history.back()" class="btn-secondary">Go Back</button>
            </div>
            <details class="error-details">
                <summary>Technical Details</summary>
                <pre>${error.stack || 'No stack trace available'}</pre>
            </details>
        </div>
    `;
}
```

**Benefits:**
- Better user guidance
- Context-specific suggestions
- Recovery options

**Estimated Time:** 30 minutes

---

## Fix 8: Add Loading States 🔄 UX

**Issue:** Routes show blank screen during data loading

**Fix:**

### Universal Loading Component

**File: `js/components/loading-state.js`**

```javascript
class LoadingState {
    static show(container, message = 'Loading...') {
        container.innerHTML = `
            <div class="loading-container" role="status">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">${message}</p>
            </div>
        `;
    }

    static showSkeleton(container, type = 'grid') {
        if (type === 'grid') {
            container.innerHTML = `
                <div class="skeleton-grid">
                    ${Array(6).fill(0).map(() => `
                        <div class="skeleton-card"></div>
                    `).join('')}
                </div>
            `;
        } else if (type === 'page') {
            container.innerHTML = `
                <div class="skeleton-page">
                    <div class="skeleton-header"></div>
                    <div class="skeleton-content"></div>
                </div>
            `;
        }
    }

    static hide(container) {
        const loading = container.querySelector('.loading-container, .skeleton-grid, .skeleton-page');
        if (loading) {
            loading.remove();
        }
    }
}

if (typeof window !== 'undefined') {
    window.LoadingState = LoadingState;
}
```

### Use in Routes

```javascript
async renderBrowseCategory(category, mythology = null) {
    const mainContent = document.getElementById('main-content');

    // Show loading
    LoadingState.showSkeleton(mainContent, 'grid');

    try {
        // Load and render
        const browseView = new BrowseCategoryView(this.db);
        await browseView.render(mainContent, { category, mythology });
    } catch (error) {
        this.renderError(error);
    }
}
```

**Benefits:**
- Better perceived performance
- No blank screens
- Professional UX

**Estimated Time:** 1-2 hours

---

## Testing Checklist

After applying fixes, test these routes:

### Core Routes
- [ ] `#/` - Home page loads with LandingPageView
- [ ] `#/mythologies` - Mythology grid displays
- [ ] `#/browse/deities` - Deity list loads
- [ ] `#/browse/creatures` - Creature list loads
- [ ] `#/browse/deities/greek` - Filtered Greek deities

### Entity Routes
- [ ] `#/entity/deities/greek/zeus` - Zeus page loads
- [ ] `#/mythology/greek/deities/zeus` - Alt format works
- [ ] `#/entity/creatures/greek/medusa` - Medusa page loads

### Mythology Routes
- [ ] `#/mythology/greek` - Greek mythology overview
- [ ] `#/mythology/norse` - Norse mythology overview
- [ ] `#/mythology/greek/deities` - Greek deities category

### Tool Routes
- [ ] `#/search` - Search interface loads
- [ ] `#/compare` - Compare tool loads
- [ ] `#/dashboard` - Dashboard loads (if authenticated)

### Static Routes
- [ ] `#/about` - About page loads
- [ ] `#/privacy` - Privacy page loads
- [ ] `#/terms` - Terms page loads

### Error Routes
- [ ] `#/invalid-route` - 404 page shows
- [ ] Back/forward buttons work
- [ ] Page refresh maintains route

---

## Priority Order

Apply fixes in this order for maximum impact:

1. **CRITICAL** - Entity Pages Integration ✅ (Already done!)
2. **HIGH** - Load Missing View Components (30 min)
3. **MEDIUM** - Improve Error Handling (30 min)
4. **MEDIUM** - Add Loading States (1-2 hours)
5. **LOW** - Create Mythology Overview (2-4 hours)
6. **LOW** - Add Lazy Loading (2-3 hours)
7. **ONGOING** - Populate Collections (content creation)

---

## Quick Commands

### Test All Routes (Automated)
```javascript
const tester = new RouteTester(firebase.firestore());
await tester.runAllTests();
console.log(tester.exportReportMarkdown());
```

### Test Single Route (Manual)
```javascript
// Navigate to route
window.location.hash = '#/browse/deities';

// Wait for render
await new Promise(resolve => setTimeout(resolve, 1000));

// Check content
const hasContent = document.getElementById('main-content').innerHTML.length > 100;
console.log('Content rendered:', hasContent);
```

### Clear Cache (If Issues)
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## Support

If you encounter issues:

1. Check browser console for errors (F12)
2. Verify Firebase connection
3. Ensure user is authenticated
4. Check that all scripts are loaded
5. Test in incognito mode (clear cache)

For detailed error reports, run the automated tester and export HTML report.

---

**Last Updated:** 2025-12-28

**Testing Tool:** `tests/route-tester.js`

**Main Report:** `ROUTE_TESTING_REPORT.md`
