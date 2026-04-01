# Eyes of Azrael - Project Documentation

## Philosophy

Let the mathematics and source material lead. Do not water down theories or omit rigorous connections out of fear of peer criticism. Core aspects of the theory have been lost in the past by being too sheepish to commit to what the evidence shows. Present findings with confidence — if the maths supports it, include it. Peer review is a process to sharpen work, not a reason to self-censor before it even happens.

## Overview

Eyes of Azrael is a mythology encyclopedia web application built with vanilla JavaScript and Firebase.

## Architecture

### Core Files

- `index.html` - Main entry point (SPA shell)
- `firebase-config.js` - Firebase configuration and initialization
- `js/spa-navigation.js` - SPA router and view management
- `js/app-init-simple.js` - Application initialization sequence
- `js/auth-guard-simple.js` - Authentication and session management
- `js/firebase-cache-manager.js` - Multi-layer cache (memory + localStorage)
- `css/site-header.css` - Site header styles (includes body padding, merged from header-fix.css)
- `css/buttons.css` - Canonical button styles (single source of truth for all buttons)

### Router Modules (`js/router/`)

- `route-matcher.js` - URL pattern matching
- `history-manager.js` - Browser history management
- `scroll-manager.js` - Scroll position save/restore
- `route-preloader.js` - Hover-based prefetching
- `navigation-metrics.js` - Navigation timing
- `transition-manager.js` - Page transition animations
- `render-utilities.js` - Shared rendering helpers
- `accessibility-manager.js` - ARIA and focus management

All router modules use `window.X = { ... }` pattern (not ES modules).

### Views (`js/views/`)

- `landing-page-view.js` - **Home page** (12 asset type categories)
- `home-view.js` - Legacy home view (mythologies grid)
- `browse-category-view.js` - Category browsing
- `mythologies-view.js` - Mythologies grid
- `entity-detail-view.js` - Entity detail page
- `user-dashboard-view.js` - User dashboard
- `user-profile-view.js` - User profile

### Components (`js/components/`)

- `universal-display-renderer.js` - Main entity display renderer
- `search-view-complete.js` - Full search interface
- `compare-view.js` - Entity comparison
- `edit-entity-modal.js` - Entity editing
- `user-dashboard.js` - Dashboard component
- `corpus-search.js` - Corpus search
- `about-page.js`, `privacy-page.js`, `terms-page.js` - Static pages

### Renderers

- `js/page-asset-renderer.js` - Firebase-based dynamic page renderer
- `js/universal-entity-renderer.js` - Entity card rendering
- `js/entity-renderer-firebase.js` - Firebase entity rendering

## Landing Page

The landing page (`LandingPageView`) displays 12 asset type categories:
Mythologies, Deities, Heroes, Creatures, Items, Places, Archetypes, Magic Systems, Herbalism, Rituals, Texts, Symbols.

### View Priority (renderHome)

Single-path rendering: **LandingPageView** only (static 12-category grid). No fallback chain. Safety timeout is 2 seconds.

## Authentication

### Flow

1. **Instant Display** - Check localStorage cache (30 min expiry)
2. **Optimistic Auth** - Show content immediately if cache valid
3. **Firebase Verification** - Verify with Firebase in background
4. **Fallback** - Show login overlay if not authenticated

### Storage Keys

- `eoa_auth_cached` - Auth state (true/false)
- `eoa_auth_timestamp` - Cache timestamp
- `eoa_last_user_email`, `eoa_last_user_name`, `eoa_last_user_photo`

## Firebase

### Initialization

`firebase-config.js` (loaded early in index.html) initializes Firebase immediately. Client-side API keys are safe to deploy (secured by Firebase security rules).

### Content Collections

mythologies, deities, heroes, creatures, items, places, texts, rituals, herbs, archetypes, symbols, concepts, cosmology

### System Collections

pages, users

## Theme System

Themes managed by `js/shader-theme-picker.js`: Night (default), Cosmic, Sacred, Golden, Ocean, Fire.

Config: `themes/theme-config.json`. Icons: `icons/categories/*.svg`.

## Development

### Commands

```bash
npm run dev          # Local dev server
npm run dev:pull     # Pull Firebase assets + start dev server
npm test             # Run Jest unit tests (51 suites, 2200 tests)
npm run test:ci      # CI mode with coverage
npm run test:e2e     # Playwright E2E tests
npm run lint         # ESLint (flat config, v10+)
npm run validate:project  # Check index.html references + orphaned files
npm run push:dry-run # Preview what would be uploaded to Firebase (safe)
npm run push         # Upload enriched assets to Firebase Firestore
npm run deploy       # Deploy to Firebase Hosting (firebase deploy --only hosting)
```

### Safe Firebase Push (`scripts/safe-firebase-sync.js`)

Pushes local JSON assets from `firebase-assets-downloaded/` to Firestore safely:

1. **Backs up** current Firebase state to `backups/` before any writes
2. **Compares timestamps** — only uploads assets where local `enrichedAt` is newer than Firebase
3. **Dry-run by default** — `npm run push:dry-run` previews changes without writing
4. **Upload mode** — `npm run push` (or `--upload`) actually pushes to Firestore
5. **Category filter** — `node scripts/safe-firebase-sync.js --upload --category=deities`

**Requires:** A Firebase Admin SDK service account key file (`eyesofazrael-firebase-adminsdk-*.json`) in the project root. Generate from Firebase Console > Project Settings > Service Accounts. These files are gitignored.

**Reports:** Saves sync results to `scripts/reports/sync-report.json`.

### Module Pattern

All modules use `window.X = { ... }` with optional CommonJS export:
```js
window.MyModule = { init() { ... } };
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.MyModule;
}
```

Do NOT use ES module `export` syntax — scripts are loaded as regular `<script>` tags.

### Testing

- Jest with jsdom environment
- Coverage thresholds: 75% statements/lines, 70% branches, 75% functions
- Test files: `__tests__/components/`, `__tests__/router/`, `__tests__/integration/`, `__tests__/performance/`, `__tests__/security/`

### CI/CD

- `.github/workflows/ci.yml` - Lint + test on push/PR
- `.github/workflows/deploy.yml` - Test + deploy on push to main
- `.github/workflows/e2e-tests.yml` - Playwright browser tests

### Loading States

All page renders should show:
1. **Spinner** - While fetching data
2. **Error message** - If fetch fails (use `getErrorHTML()`)
3. **Content** - On success

### Error Handling

Use `getErrorHTML()` and `getLoadingHTML()` methods in SPANavigation for consistent error/loading states.

### CSS Merges

The following CSS files were consolidated during refactoring:
- `header-fix.css` merged into `site-header.css`
- `user-dashboard-polished.css` merged into `user-dashboard.css`
- `user-profile-polished.css` merged into `user-profile.css`
- `card-truncation.css` merged into `entity-card-polish.css`

### Service Worker Precache Management

Every `<script src="...">` in `index.html` **must** also appear in one of the three precache arrays in `service-worker.js`:

- `PRECACHE_ASSETS` — critical, must-cache (Firebase config, init, navigation, auth)
- `PRECACHE_CRITICAL` — dependency-cascade scripts (auth-manager, crud-manager, renderers)
- `PRECACHE_ENHANCED` — best-effort (views, components, services)

**When adding new scripts to `index.html`, also add them to `PRECACHE_ENHANCED` (or a more critical array) in `service-worker.js`.** Run `npm run validate:project` to check for drift.

Critical JS files (`firebase-config.js`, `app-init-simple.js`, `spa-navigation.js`, `auth-guard-simple.js`) are listed in the `CRITICAL_JS` array and always use **NETWORK_FIRST** strategy so the browser never serves a stale init chain from cache.

### Initialization Chain Architecture

The app boots in this order:

1. `firebase-config.js` — initializes Firebase SDK (must be first)
2. `js/auth-guard-simple.js` — sets up auth state listener
3. `js/app-init-simple.js` — 15-step init chain; waits for all `window.*` globals
4. `js/spa-navigation.js` — SPA router; calls `handleRoute()` on hash change
5. View scripts (e.g. `LandingPageView`) — render on demand

Each step depends on the previous ones completing. If any script fails to load, the chain breaks silently unless `window.__scriptErrors` captures the failure. The `CRITICAL_JS` array in `service-worker.js` ensures these four files are always fresh via network-first fetching.

### Adding New Scripts Checklist

When adding a new JS file to the project:

1. Add `<script src="...">` in `index.html` in the correct load-order position
2. Add the same path to `PRECACHE_ENHANCED` (or `PRECACHE_CRITICAL`) in `service-worker.js`
3. Use the `window.X = { ... }` module pattern — no ES module `export` syntax
4. Add an `onerror` handler on the `<script>` tag if it's load-order critical
5. Run `npm test` to ensure the precache completeness test still passes

### Troubleshooting Common Rendering Issues

**"No X Found" on browse pages** — AssetService or CacheManager is returning an empty array from cache. Clear localStorage keys starting with `eoa_` and reload. Check `firebase-cache-manager.js` `getList()` for empty-array false positives.

**Header missing / zero height** — `HeaderNavController.init()` did not fire. Check that `header-nav.js` loaded (look in DevTools Network tab). The `.site-header` element must exist in DOM before init runs.

**Spinner never resolves** — The safety timeout in `app-init-simple.js` is 2 seconds. If it fires before views are ready, `window.__emergencyRender` can be called from console. Check `window.__scriptErrors` for failed script loads.

**Service worker serving stale JS** — The `CRITICAL_JS` array forces network-first for init scripts. For other scripts, bump `CACHE_VERSION` in `service-worker.js` to invalidate the cache on next visit.

**Startup Diagnostics shows missing dependencies** — The named global (e.g. `window.AuthManager`) was not set because its script failed to load or ran after `app-init-simple.js` checked for it. Verify load order in `index.html` and that the script is in SW precache.
