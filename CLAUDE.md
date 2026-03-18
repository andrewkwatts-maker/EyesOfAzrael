# Eyes of Azrael - Project Documentation

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

1. **LandingPageView** (priority) - Static 12-category grid
2. **PageAssetRenderer** - Loads `pages/home` from Firebase
3. **HomeView** - Legacy mythologies grid
4. **Inline fallback** - Hardcoded mythologies

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
