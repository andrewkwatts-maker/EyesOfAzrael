# Eyes of Azrael - Project Documentation

## Overview

Eyes of Azrael is a mythology encyclopedia web application built with vanilla JavaScript and Firebase.

## Architecture

### Core Files

- `index.html` - Main entry point
- `js/spa-navigation.js` - SPA router and view management
- `js/app-init-simple.js` - Application initialization
- `js/auth-guard-simple.js` - Authentication and session management

### Views

- `js/views/landing-page-view.js` - **Home page landing view** (12 asset type categories)
- `js/views/home-view.js` - Legacy home view (mythologies grid)
- `js/views/browse-category-view.js` - Category browsing
- `js/views/mythologies-view.js` - Mythologies grid

### Renderers

- `js/components/universal-display-renderer.js` - Main entity display renderer
- `js/page-asset-renderer.js` - Firebase-based dynamic page renderer
- `js/universal-entity-renderer.js` - Entity card rendering

## Landing Page Asset

### Current Implementation

The landing page (`LandingPageView`) displays 12 asset type categories:

1. World Mythologies
2. Deities & Gods
3. Heroes & Legends
4. Mythical Creatures
5. Sacred Items
6. Sacred Places
7. Archetypes
8. Magic Systems
9. Sacred Herbalism
10. Rituals & Practices
11. Sacred Texts
12. Sacred Symbols

### View Priority (renderHome)

When loading the home page, the SPA tries views in this order:

1. **LandingPageView** (priority) - Static 12-category grid
2. **PageAssetRenderer** - Loads `pages/home` document from Firebase
3. **HomeView** - Legacy mythologies grid
4. **Inline fallback** - Hardcoded mythologies

### Firebase Page Assets (Optional)

The `PageAssetRenderer` can load dynamic page content from Firebase:

**Collection:** `pages`

**Document structure for `pages/home`:**
```json
{
  "title": "Eyes of Azrael",
  "hero": {
    "title": "Explore World Mythologies",
    "subtitle": "Discover the myths and legends of humanity",
    "icon": "eye_icon_url",
    "cta": [
      { "text": "Explore", "link": "#/mythologies", "primary": true }
    ]
  },
  "sections": [
    {
      "id": "mythologies",
      "title": "World Mythologies",
      "description": "Ancient traditions and belief systems",
      "icon": "globe_icon",
      "collection": "mythologies",
      "displayCount": 12,
      "sortBy": "order",
      "link": "#/mythologies"
    }
  ]
}
```

### Category Icons

SVG icons are stored in `icons/categories/`:
- `mythologies.svg`
- `deities.svg`
- `heroes.svg`
- `creatures.svg`
- `items.svg`
- `places.svg`
- `archetypes.svg`
- `magic.svg`
- `herbs.svg`
- `rituals.svg`
- `texts.svg`
- `symbols.svg`

## Authentication

### Flow

1. **Instant Display** - Check localStorage cache (30 min expiry)
2. **Optimistic Auth** - Show content immediately if cache valid
3. **Firebase Verification** - Verify with Firebase in background
4. **Fallback** - Show login overlay if not authenticated

### Storage Keys

- `eoa_auth_cached` - Auth state (true/false)
- `eoa_auth_timestamp` - Cache timestamp
- `eoa_last_user_email` - Last logged in email
- `eoa_last_user_name` - Last logged in display name
- `eoa_last_user_photo` - Last logged in photo URL

## Firebase Collections

### Content Collections

- `mythologies` - Mythology systems (Greek, Norse, Egyptian, etc.)
- `deities` - Gods and divine beings
- `heroes` - Legendary heroes and figures
- `creatures` - Mythical creatures and beasts
- `items` - Sacred items and artifacts
- `places` - Sacred locations and sites
- `texts` - Sacred texts and scriptures
- `rituals` - Ceremonies and practices
- `herbs` - Sacred plants and preparations
- `archetypes` - Universal patterns
- `symbols` - Sacred symbols and icons

### System Collections

- `pages` - Dynamic page content (optional)
- `users` - User profiles and preferences

## Theme System

Themes are managed by `js/shader-theme-picker.js`:

- Night (default)
- Cosmic
- Sacred
- Golden
- Ocean
- Fire

Theme configuration is stored in `themes/theme-config.json`.

## Development Notes

### Loading States

All page renders should show:
1. **Spinner** - While fetching data
2. **Error message** - If fetch fails
3. **Content** - On success

### Error Handling

Use `getErrorHTML()` and `getLoadingHTML()` methods in SPANavigation for consistent error/loading states.
