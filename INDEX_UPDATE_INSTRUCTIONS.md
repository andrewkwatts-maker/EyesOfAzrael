# Index.html Update Instructions

## CSS Files to Add (in <head>)

Add after existing CSS files:
```html
<link rel="stylesheet" href="css/panel-shaders.css">
<link rel="stylesheet" href="css/entity-forms.css">
```

## JavaScript Files to Add (before </body>)

Replace `js/app-init.js` with `js/app-init-enhanced.js` and add CRUD components:

```html
<!-- CRUD System -->
<script src="js/firebase-crud-manager.js"></script>
<script src="js/components/entity-form.js"></script>
<script src="js/components/user-dashboard.js"></script>

<!-- Application Initialization (ENHANCED VERSION) -->
<script src="js/app-init-enhanced.js"></script>
```

## Complete Script Order

The correct order should be:

1. Firebase SDK (already in <head>)
2. Firebase Config (already included)
3. Core scripts (SEO, toast, image optimizer)
4. **Auth Manager** ✓
5. **Universal Display Renderer** ✓
6. **Corpus Search** ✓
7. **Enhanced Corpus Search** ✓
8. **Search UI** ✓
9. **SPA Navigation** ✓
10. **Shader Themes** ✓
11. **CRUD Manager** (NEW)
12. **Entity Form** (NEW)
13. **User Dashboard** (NEW)
14. **App Init Enhanced** (REPLACEMENT)

## Navigation Updates

Add dashboard link to header nav:

```html
<nav class="main-nav">
    <a href="#/" class="nav-link">Home</a>
    <a href="#/search" class="nav-link">Search</a>
    <a href="#/compare" class="nav-link">Compare</a>
    <a href="#/dashboard" class="nav-link">My Contributions</a>
</nav>
```

## Final index.html Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eyes of Azrael - World Mythos Explorer</title>

    <!-- Meta tags... -->

    <!-- Icons... -->

    <!-- Stylesheets -->
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="themes/theme-base.css">
    <link rel="stylesheet" href="css/accessibility.css">
    <link rel="stylesheet" href="css/ui-components.css">
    <link rel="stylesheet" href="css/spinner.css">
    <link rel="stylesheet" href="css/universal-grid.css">
    <link rel="stylesheet" href="css/dynamic-views.css">
    <link rel="stylesheet" href="css/search-components.css">
    <link rel="stylesheet" href="css/shader-backgrounds.css">
    <link rel="stylesheet" href="css/panel-shaders.css">
    <link rel="stylesheet" href="css/entity-forms.css">

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

    <!-- Firebase Config -->
    <script src="firebase-config.js"></script>
    <script src="js/firebase-init.js"></script>
</head>
<body>
    <!-- Shader Canvas -->
    <canvas id="shader-canvas" class="shader-background"></canvas>

    <!-- Skip to main content -->
    <a href="#main-content" class="skip-to-main">Skip to main content</a>

    <!-- Header -->
    <header class="site-header">
        <div class="header-container">
            <a href="#/" class="site-logo">👁️ Eyes of Azrael</a>

            <nav class="main-nav">
                <a href="#/" class="nav-link">Home</a>
                <a href="#/search" class="nav-link">Search</a>
                <a href="#/compare" class="nav-link">Compare</a>
                <a href="#/dashboard" class="nav-link">My Contributions</a>
            </nav>

            <div class="header-actions">
                <button id="themeToggle" class="icon-btn" aria-label="Toggle theme">🌙</button>
                <div id="userInfo" class="user-info" style="display: none;">
                    <img id="userAvatar" class="user-avatar" src="" alt="User">
                    <span id="userName"></span>
                    <button id="signOutBtn" class="btn-secondary btn-sm">Sign Out</button>
                </div>
            </div>
        </div>
    </header>

    <!-- Breadcrumb -->
    <div id="breadcrumb-nav" aria-label="Breadcrumb"></div>

    <!-- Main Content -->
    <main id="main-content" class="view-container" role="main">
        <div class="loading-container">
            <div class="spinner-container">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
            </div>
            <p class="loading-message">Initializing...</p>
        </div>
    </main>

    <!-- Footer -->
    <footer class="site-footer">
        <div class="footer-container">
            <p>&copy; 2024 Eyes of Azrael. All rights reserved.</p>
            <div class="footer-links">
                <a href="#/about">About</a>
                <a href="#/privacy">Privacy</a>
                <a href="#/terms">Terms</a>
            </div>
        </div>
    </footer>

    <!-- Core Scripts -->
    <script src="js/seo-manager.js"></script>
    <script src="js/toast-notifications.js"></script>
    <script src="js/image-optimizer.js"></script>

    <!-- Auth & Navigation System -->
    <script src="js/auth-manager.js"></script>
    <script src="js/components/universal-display-renderer.js"></script>
    <script src="js/components/corpus-search.js"></script>
    <script src="js/components/corpus-search-enhanced.js"></script>
    <script src="js/components/search-ui.js"></script>
    <script src="js/spa-navigation.js"></script>
    <script src="js/shaders/shader-themes.js"></script>

    <!-- CRUD System (NEW) -->
    <script src="js/firebase-crud-manager.js"></script>
    <script src="js/components/entity-form.js"></script>
    <script src="js/components/user-dashboard.js"></script>

    <!-- Application Initialization (ENHANCED) -->
    <script src="js/app-init-enhanced.js"></script>

    <!-- Service Worker -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(reg => console.log('[SW] Registered'))
                    .catch(err => console.log('[SW] Failed:', err));
            });
        }
    </script>

    <!-- Inline styles (keep existing)... -->
</body>
</html>
```

## Changes Summary

### Added CSS (2 files):
1. `css/panel-shaders.css` - Panel styling with shader integration
2. `css/entity-forms.css` - Form styling for entity creation/editing

### Added JS (3 files):
1. `js/firebase-crud-manager.js` - CRUD operations manager
2. `js/components/entity-form.js` - Dynamic form component
3. `js/components/user-dashboard.js` - User dashboard component

### Replaced JS (1 file):
- `js/app-init.js` → `js/app-init-enhanced.js` (includes CRUD integration)

### Added Navigation Link:
- "My Contributions" → `#/dashboard`

## Testing After Update

1. Clear browser cache
2. Reload page
3. Check console for initialization messages
4. Test navigation to dashboard
5. Test creating an entity
6. Test editing/deleting
7. Verify shaders on panels
