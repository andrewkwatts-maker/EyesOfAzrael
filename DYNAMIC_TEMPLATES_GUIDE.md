# Dynamic Templates System Guide

## Overview

The Eyes of Azrael project now uses **universal dynamic templates** that automatically load entity data from Firebase Firestore. Instead of maintaining hundreds of individual HTML files for each entity, we have three core templates that work for ALL entity types across ALL mythologies.

This guide explains how the dynamic template system works and how to use it.

---

## Template Files

### 1. Entity Detail Template (`/templates/entity-detail.html`)

**Purpose**: Display a single entity (deity, hero, creature, item, etc.) with full details.

**URL Pattern**:
```
/templates/entity-detail.html?type=deity&id=zeus&mythology=greek
```

**Features**:
- Automatically detects entity from URL parameters
- Renders entity using `EntityDisplay.renderDetail()`
- Updates page title, meta tags, and JSON-LD structured data
- Generates breadcrumb navigation
- Loads and displays related entities sidebar
- Tracks entity in "Recently Viewed" (localStorage)
- Works for ALL entity types: deities, heroes, creatures, items, places, concepts, magic, theories

**Usage**:
```html
<!-- Link to any entity -->
<a href="/templates/entity-detail.html?type=deity&id=zeus">Zeus</a>
<a href="/templates/entity-detail.html?type=hero&id=hercules">Hercules</a>
<a href="/templates/entity-detail.html?type=creature&id=medusa">Medusa</a>
```

**Auto-population**:
- Page title: `{Entity Name} - {Mythology} {Type} - Eyes of Azrael`
- Meta description: First 160 characters of entity description
- Open Graph tags for social sharing
- JSON-LD structured data for SEO

---

### 2. Entity Grid Template (`/templates/entity-grid.html`)

**Purpose**: Browse and filter entities in a grid layout with search, filters, and pagination.

**URL Pattern**:
```
/templates/entity-grid.html?type=deities&mythology=greek
```

**Features**:
- Grid view of all entities of a specific type
- Advanced filtering:
  - By mythology (checkbox filters)
  - By tags (checkbox filters)
  - By search term (live search)
- Sorting options:
  - Name (A-Z, Z-A)
  - Date (Recently Added, Oldest First)
  - Popularity (Most Popular)
- Pagination (24 items per page)
- "Add New" button (shows for authenticated users)
- Stats bar showing count
- Responsive grid layout

**Usage**:
```html
<!-- Browse all Greek deities -->
<a href="/templates/entity-grid.html?type=deities&mythology=greek">Greek Deities</a>

<!-- Browse all Norse heroes -->
<a href="/templates/entity-grid.html?type=heroes&mythology=norse">Norse Heroes</a>

<!-- Browse all creatures across all mythologies -->
<a href="/templates/entity-grid.html?type=creatures">All Creatures</a>
```

**Filters**:
```javascript
// State management
const state = {
    type: 'deities',           // Entity type filter
    mythology: 'greek',        // Mythology filter
    filters: {
        mythologies: [],       // Multi-select mythology filter
        tags: [],              // Multi-select tag filter
        search: ''             // Search query
    },
    sort: 'name-asc',          // Sort order
    page: 1,                   // Current page
    pageSize: 24               // Items per page
};
```

---

### 3. Mythology Hub Template (`/templates/mythology-hub.html`)

**Purpose**: Show all entities for a specific mythology in one comprehensive hub page.

**URL Pattern**:
```
/templates/mythology-hub.html?mythology=greek
```

**Features**:
- Hero section with mythology name, icon, description
- Statistics grid showing count of each entity type:
  - Deities
  - Heroes
  - Creatures
  - Items
  - Places
  - Concepts
  - Magic Systems
- Featured entities carousel (auto-rotating)
- Mythology metadata section (origin, time period, sources, etc.)
- Sections for each entity type (showing 6 max per section)
- "View All" links to entity-grid for each type
- Responsive grid layout

**Usage**:
```html
<!-- Greek mythology hub -->
<a href="/templates/mythology-hub.html?mythology=greek">Greek Mythology</a>

<!-- Norse mythology hub -->
<a href="/templates/mythology-hub.html?mythology=norse">Norse Mythology</a>
```

**Sections Loaded**:
1. Deities (⚡)
2. Heroes (🦸)
3. Creatures (🐉)
4. Items (⚔️)
5. Places (🏛️)
6. Concepts (💭)
7. Magic Systems (🔮)

---

## Navigation System (`/js/navigation.js`)

The `NavigationSystem` class provides universal navigation components that integrate with the templates.

### Features

#### 1. Dynamic Mythology Menu

Loads mythology list from Firebase and renders menu in various layouts.

```javascript
// Initialize navigation system
const nav = new NavigationSystem();
await nav.init();

// Render mythology menu
nav.renderMythologyMenu('mythology-menu', {
    maxItems: 12,
    showIcons: true,
    layout: 'grid', // 'grid', 'list', 'dropdown'
    currentMythology: 'greek'
});
```

**HTML**:
```html
<div id="mythology-menu"></div>
```

#### 2. Breadcrumb Navigation

Auto-generates breadcrumb based on page context.

```javascript
// Generate breadcrumb
nav.injectBreadcrumb('breadcrumb-nav', {
    mythology: 'greek',
    entityType: 'deity',
    entityName: 'Zeus'
});

// Result: Home → Mythologies → Greek → Deities → Zeus
```

**Custom breadcrumb**:
```javascript
nav.injectBreadcrumb('breadcrumb-nav', {
    customPath: [
        { label: 'Mythologies', url: '/mythos/index.html' },
        { label: 'Greek', url: '/mythos/greek/index.html' },
        { label: 'Zeus', url: null }
    ]
});
```

#### 3. Recently Viewed Component

Tracks entity views and displays recently viewed entities.

```javascript
// Track entity view
nav.trackEntityView(entity);

// Render recently viewed
nav.renderRecentlyViewed('recently-viewed', {
    limit: 5,
    showIcons: true,
    excludeCurrentId: 'zeus' // Don't show current entity
});

// Get recently viewed data
const recent = nav.getRecentlyViewed(5);

// Clear history
nav.clearRecentlyViewed();
```

**HTML**:
```html
<div id="recently-viewed"></div>
```

#### 4. Related Entities Sidebar

Loads and displays related entities for current entity.

```javascript
// Render related entities
await nav.renderRelatedEntities(entity, 'related-sidebar');
```

**HTML**:
```html
<aside id="related-sidebar"></aside>
```

#### 5. Auto-Population

Automatically populates navigation based on current URL.

```javascript
// Auto-detect context from URL and populate navigation
nav.autoPopulateNavigation();
```

This will:
- Parse URL parameters and path
- Generate breadcrumb
- Render mythology menu (if container exists)
- Show recently viewed (if container exists)

---

## Integration with Existing Pages

### Converting Static Pages to Dynamic

**Old way** (static HTML with hardcoded entities):
```html
<!-- mythos/greek/deities/zeus.html -->
<h1>Zeus</h1>
<p>Zeus is the king of the gods...</p>
```

**New way** (redirect to dynamic template):
```html
<!-- mythos/greek/deities/zeus.html -->
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0;url=/templates/entity-detail.html?type=deity&id=zeus&mythology=greek">
</head>
<body>
    <p>Redirecting to <a href="/templates/entity-detail.html?type=deity&id=zeus&mythology=greek">Zeus</a>...</p>
</body>
</html>
```

### Updating Mythology Index Pages

**Current approach**: `mythos/greek/index.html` uses Firebase content loader inline.

**Recommended approach**: Use `mythology-hub.html` template:

1. **Option A**: Redirect to hub template
   ```html
   <meta http-equiv="refresh" content="0;url=/templates/mythology-hub.html?mythology=greek">
   ```

2. **Option B**: Keep existing page structure but use dynamic loading
   - Already implemented in `mythos/greek/index.html` and `mythos/norse/index.html`
   - Uses inline Firebase content loader
   - Preserves static content sections

---

## Entity Display System

### EntityDisplay Class (`/js/entity-display.js`)

Renders entity data into HTML components.

**Main Methods**:

```javascript
// Render entity card (for grid view)
const card = EntityDisplay.renderCard(entity);
container.appendChild(card);

// Render entity detail (for detail page)
EntityDisplay.renderDetail(entity, container);
```

**Type-Specific Rendering**:
- `renderDeitySections()` - Domains, symbols, epithets, relationships
- `renderHeroSections()` - Parentage, quests, weapons, abilities
- `renderCreatureSections()` - Physical description, abilities, weaknesses
- `renderItemSections()` - Powers, materials, wielders
- `renderPlaceSections()` - Inhabitants, events, map
- `renderConceptSections()` - Opposites, personifications
- `renderMagicSections()` - Techniques, tools, warnings
- `renderTheorySections()` - Confidence score, correlations, alternatives
- `renderMythologySections()` - Creation myth, cosmology, major deities

### EntityLoader Class (`/js/entity-loader.js`)

Loads entity data from Firestore and handles queries.

**Main Methods**:

```javascript
// Load and render grid
await EntityLoader.loadAndRenderGrid('deities', '#grid-container', {
    mythology: 'greek'
}, {
    orderBy: 'name asc',
    limit: 24
});

// Load and render single entity
await EntityLoader.loadAndRenderDetail('zeus', 'deity', '#detail-container');

// Load from URL (auto-detect entity)
await EntityLoader.loadFromURL();

// Search entities
const results = await EntityLoader.search('thunder', {
    collections: ['deities', 'heroes']
});

// Load cross-references
const crossRefs = await EntityLoader.loadCrossReferences(entity);
```

---

## URL Structure Reference

### Entity Detail URLs

```
# General pattern
/templates/entity-detail.html?type={TYPE}&id={ID}&mythology={MYTHOLOGY}

# Examples
/templates/entity-detail.html?type=deity&id=zeus&mythology=greek
/templates/entity-detail.html?type=hero&id=hercules&mythology=greek
/templates/entity-detail.html?type=creature&id=medusa&mythology=greek
/templates/entity-detail.html?type=item&id=mjolnir&mythology=norse
/templates/entity-detail.html?type=place&id=valhalla&mythology=norse
/templates/entity-detail.html?type=concept&id=karma&mythology=hindu
/templates/entity-detail.html?type=magic&id=seidr&mythology=norse
/templates/entity-detail.html?type=theory&id=kabbalah-physics&mythology=jewish
```

### Entity Grid URLs

```
# General pattern
/templates/entity-grid.html?type={TYPE}&mythology={MYTHOLOGY}

# Examples (filtered by mythology)
/templates/entity-grid.html?type=deities&mythology=greek
/templates/entity-grid.html?type=heroes&mythology=norse
/templates/entity-grid.html?type=creatures&mythology=egyptian

# Examples (all mythologies)
/templates/entity-grid.html?type=deities
/templates/entity-grid.html?type=heroes
/templates/entity-grid.html?type=creatures
```

### Mythology Hub URLs

```
# General pattern
/templates/mythology-hub.html?mythology={MYTHOLOGY}

# Examples
/templates/mythology-hub.html?mythology=greek
/templates/mythology-hub.html?mythology=norse
/templates/mythology-hub.html?mythology=egyptian
/templates/mythology-hub.html?mythology=hindu
```

---

## Firebase Firestore Structure

### Collections

```
deities/          (Firestore collection)
├── zeus          (Document ID)
│   ├── name: "Zeus"
│   ├── type: "deity"
│   ├── mythology: "greek"
│   ├── description: "..."
│   └── ...
├── odin
│   ├── name: "Odin"
│   ├── type: "deity"
│   ├── mythology: "norse"
│   └── ...

heroes/           (Firestore collection)
├── hercules
├── achilles

creatures/        (Firestore collection)
├── medusa
├── minotaur

items/            (Firestore collection)
├── mjolnir
├── excalibur

places/           (Firestore collection)
├── olympus
├── valhalla

concepts/         (Firestore collection)
├── karma
├── wyrd

magic/            (Firestore collection)
├── seidr
├── kabbalah

user_theories/    (Firestore collection)
├── theory-id-1
├── theory-id-2

mythologies/      (Firestore collection)
├── greek
│   ├── name: "Greek"
│   ├── icon: "⚡"
│   ├── description: "..."
│   └── ...
├── norse
└── egyptian
```

### Required Entity Fields

All entities must have these fields:

```javascript
{
    "id": "zeus",                    // Document ID
    "type": "deity",                 // Entity type
    "name": "Zeus",                  // Display name
    "mythology": "greek",            // Primary mythology
    "description": "...",            // Short description
    "createdAt": Timestamp,          // Creation timestamp
    "updatedAt": Timestamp           // Update timestamp
}
```

### Optional Entity Fields

```javascript
{
    "mythologies": ["greek", "roman"],  // Multiple mythologies
    "subtitle": "King of the Gods",     // Subtitle
    "shortDescription": "...",          // Brief summary
    "longDescription": "...",           // Extended content
    "tags": ["olympian", "sky"],        // Searchable tags
    "featured": true,                   // Show in featured carousel
    "visual": {
        "icon": "⚡",                    // Display icon
        "image": "url"                  // Image URL
    },
    "relatedEntities": {
        "deities": ["hera", "poseidon"],
        "heroes": ["hercules"],
        "items": ["thunderbolt"]
    },
    "crossReferences": { ... },
    "sources": [ ... ],
    "metadata": { ... }
}
```

---

## CSS Styling

### Entity Card Styles

```css
.entity-card {
    background: rgba(var(--color-surface-rgb), 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.entity-card:hover {
    transform: translateY(-4px);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-lg);
}
```

### Grid Layout Styles

```css
.entities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-lg);
}
```

### Custom Styles

Templates include built-in styles. To customize, add to your site's CSS:

```css
/* Customize entity cards */
.entity-card {
    /* Your styles */
}

/* Customize breadcrumb */
.breadcrumb {
    /* Your styles */
}

/* Customize recently viewed */
.recently-viewed {
    /* Your styles */
}
```

---

## SEO Features

### Meta Tags

All templates automatically generate:

1. **Title tag**: `{Entity Name} - {Mythology} {Type} - Eyes of Azrael`
2. **Meta description**: First 160 characters of entity description
3. **Open Graph tags**:
   - `og:title`
   - `og:description`
   - `og:type` (article)
   - `og:image`
4. **Twitter Card tags**:
   - `twitter:card`
   - `twitter:title`
   - `twitter:description`

### JSON-LD Structured Data

```json
{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Zeus - King of the Gods",
    "description": "Zeus is the king of the Olympian gods...",
    "author": {
        "@type": "Organization",
        "name": "Eyes of Azrael"
    },
    "publisher": {
        "@type": "Organization",
        "name": "Eyes of Azrael"
    },
    "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://eyesofazrael.com/templates/entity-detail.html?type=deity&id=zeus"
    },
    "image": "..."
}
```

---

## Migration Guide

### Step 1: Update Links

Replace all static entity links with dynamic template links:

**Before**:
```html
<a href="/mythos/greek/deities/zeus.html">Zeus</a>
```

**After**:
```html
<a href="/templates/entity-detail.html?type=deity&id=zeus">Zeus</a>
```

### Step 2: Add Redirects

For backward compatibility, add redirect pages:

```html
<!-- mythos/greek/deities/zeus.html -->
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0;url=/templates/entity-detail.html?type=deity&id=zeus">
</head>
<body>
    <p>Redirecting...</p>
</body>
</html>
```

### Step 3: Update Navigation

Add navigation system to pages:

```html
<!-- Include navigation.js -->
<script src="/js/navigation.js"></script>

<!-- Add containers -->
<nav id="breadcrumb-nav"></nav>
<div id="mythology-menu"></div>
<div id="recently-viewed"></div>
```

### Step 4: Test

Test all entity pages:
1. Load entity detail pages
2. Test grid filtering and search
3. Test mythology hub
4. Verify breadcrumbs
5. Check recently viewed

---

## Troubleshooting

### Entity Not Loading

**Problem**: Entity detail page shows "Loading..." indefinitely.

**Solution**:
1. Check browser console for errors
2. Verify Firebase is initialized: `window.firebaseApp` and `window.firebaseDb`
3. Check entity exists in Firestore: `firebase.firestore().collection('deities').doc('zeus').get()`
4. Verify URL parameters are correct: `?type=deity&id=zeus`

### Grid Shows No Results

**Problem**: Entity grid shows "No entities found".

**Solution**:
1. Check Firestore collection exists and has data
2. Verify mythology filter matches entity data
3. Clear filters and search
4. Check browser console for query errors

### Navigation Not Appearing

**Problem**: Breadcrumb or recently viewed not showing.

**Solution**:
1. Verify `navigation.js` is loaded
2. Check container elements exist: `<div id="breadcrumb-nav"></div>`
3. Verify Firebase is initialized before navigation system
4. Check browser console for initialization errors

### Styles Not Applied

**Problem**: Templates look broken or unstyled.

**Solution**:
1. Verify CSS files are loaded:
   - `/themes/theme-base.css`
   - `/styles.css`
   - `/css/firebase-themes.css`
2. Check CSS custom properties are defined
3. Clear browser cache
4. Check browser console for CSS errors

---

## Best Practices

### 1. Use Semantic IDs

Entity IDs should be lowercase, hyphenated, and descriptive:

```
Good: zeus, king-arthur, sword-of-shiva
Bad: Z3us, KingArthur1, swordofshiva
```

### 2. Provide Rich Metadata

Always include:
- `name` or `title`
- `description`
- `mythology`
- `type`
- `tags` (for search)

### 3. Link Related Entities

Use `relatedEntities` to create connections:

```javascript
{
    "relatedEntities": {
        "deities": ["hera", "poseidon", "hades"],
        "heroes": ["hercules", "perseus"],
        "items": ["thunderbolt", "aegis"]
    }
}
```

### 4. Mark Featured Content

Use `featured: true` for important entities to show in carousel.

### 5. Add Search Terms

Include searchable terms for better discoverability:

```javascript
{
    "searchTerms": ["zeus", "jupiter", "sky god", "thunder", "olympian"]
}
```

---

## Advanced Usage

### Custom Entity Types

Add custom entity types by:

1. Create Firestore collection
2. Update `EntityLoader.getCollectionName()`:
   ```javascript
   static getCollectionName(type) {
       const collectionMap = {
           'deity': 'deities',
           'hero': 'heroes',
           'custom': 'custom_entities' // Add custom type
       };
       return collectionMap[type] || type + 's';
   }
   ```
3. Add icon mapping in `EntityDisplay.getEntityIcon()`
4. Add type-specific rendering in `EntityDisplay.renderTypeSpecificSections()`

### Custom Filters

Add custom filters to entity-grid:

```javascript
// Add filter section HTML
<div class="filter-section">
    <h3>Custom Filter</h3>
    <div id="custom-filter-options"></div>
</div>

// Build filter options
function buildCustomFilter() {
    // Extract unique values
    const values = new Set();
    state.allEntities.forEach(entity => {
        if (entity.customField) {
            values.add(entity.customField);
        }
    });

    // Render options
    // ...
}

// Apply filter
function applyCustomFilter() {
    state.filteredEntities = state.allEntities.filter(entity => {
        if (state.filters.custom.length > 0) {
            if (!state.filters.custom.includes(entity.customField)) {
                return false;
            }
        }
        return true;
    });
}
```

### Analytics Integration

Track entity views:

```javascript
// In entity-detail.html
if (window.gtag) {
    gtag('event', 'view_entity', {
        entity_type: type,
        entity_id: id,
        mythology: entity.mythology
    });
}
```

---

## Support

For questions or issues:

1. Check this guide first
2. Review browser console for errors
3. Check Firebase Firestore rules
4. Verify entity data structure
5. Test with sample entity

---

## Summary

The dynamic templates system provides:

- **Universal entity detail page** - Works for all entity types
- **Universal entity grid** - Browse, filter, search, paginate
- **Mythology hub** - Comprehensive mythology overview
- **Navigation system** - Breadcrumbs, menus, recently viewed
- **SEO optimization** - Meta tags, structured data
- **Firebase integration** - Real-time data loading
- **Responsive design** - Mobile-friendly layouts

Instead of maintaining hundreds of static HTML files, you now have three templates that work for everything. Add new entities simply by creating Firestore documents - no HTML files needed!
