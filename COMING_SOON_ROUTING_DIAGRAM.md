# Routing Architecture - "Coming Soon" Removal Solution

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER NAVIGATION                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SPA NAVIGATION ROUTER                           │
│                    (js/spa-navigation.js)                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
         ┌──────────────────────┐    ┌──────────────────────┐
         │  Route Pattern Match │    │   Auth Verification  │
         └──────────────────────┘    └──────────────────────┘
                    │
        ┌───────────┴───────────┬───────────────┬──────────────────┐
        │                       │               │                  │
        ▼                       ▼               ▼                  ▼
┌──────────────┐      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Mythology   │      │   Category   │  │    Entity    │  │    Other     │
│   Overview   │      │    Browse    │  │    Detail    │  │    Routes    │
└──────────────┘      └──────────────┘  └──────────────┘  └──────────────┘
        │                     │                │                  │
        └─────────────────────┴────────────────┴──────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   3-TIER FALLBACK       │
                    │   ARCHITECTURE          │
                    └─────────────────────────┘
                                  │
        ┌────────────────────────┬┴────────────────────────┬─────────────────┐
        │                        │                         │                 │
        ▼                        ▼                         ▼                 ▼
┌──────────────┐      ┌──────────────────┐      ┌────────────────┐  ┌─────────────┐
│   PRIMARY    │      │    SECONDARY     │      │    TERTIARY    │  │   ALWAYS    │
│  Component   │      │  PageAssetRend.  │      │ Basic Fallback │  │    WORKS    │
├──────────────┤      ├──────────────────┤      ├────────────────┤  └─────────────┘
│ Full Feature │ ───► │ Dynamic Firebase │ ───► │  Minimal HTML  │
│ Rich UX      │      │ Page Loading     │      │  Self-Contained│
│ If Available │      │ If Page Exists   │      │  No Dependencies│
└──────────────┘      └──────────────────┘      └────────────────┘
```

## Route-Specific Flow

### 1. Mythology Overview (`#/mythology/greek`)

```
User navigates to #/mythology/greek
            │
            ▼
┌───────────────────────────────────┐
│  renderMythology('greek')         │
└───────────────────────────────────┘
            │
            ├─► Check: MythologyOverview available?
            │   └─► YES ✅ → Use MythologyOverview
            │       └─► Render full mythology page with:
            │           • Hero section with icon
            │           • Entity statistics
            │           • Category cards
            │           • Metadata
            │
            ├─► NO → Check: PageAssetRenderer + 'mythology-greek' page?
            │   └─► YES ✅ → Load dynamic page from Firebase
            │       └─► Render custom page content
            │
            └─► NO → Use renderBasicMythologyPage()
                └─► ✅ Query Firebase for entity counts
                    └─► Render basic page with:
                        • Mythology hero section
                        • Entity count grid
                        • Category links

RESULT: Content always displays (never "Coming soon")
```

### 2. Category Browse (`#/mythology/greek/deities`)

```
User navigates to #/mythology/greek/deities
            │
            ▼
┌───────────────────────────────────┐
│  renderCategory('greek','deities')│
└───────────────────────────────────┘
            │
            ├─► Check: BrowseCategoryView available?
            │   └─► YES ✅ → Use BrowseCategoryView
            │       └─► Render full category browser with:
            │           • Filters and sorting
            │           • Entity grid
            │           • Pagination
            │           • Quick view modals
            │
            └─► NO → Use renderBasicCategoryPage()
                └─► ✅ Query Firebase for entities
                    └─► Render basic page with:
                        • Category hero section
                        • Entity grid
                        • Entity cards linking to details

RESULT: Content always displays (never "Coming soon")
```

### 3. Entity Detail (`#/mythology/greek/deities/zeus`)

```
User navigates to #/mythology/greek/deities/zeus
            │
            ▼
┌────────────────────────────────────────┐
│  renderEntity('greek','deities','zeus')│
└────────────────────────────────────────┘
            │
            ├─► Check: FirebaseEntityRenderer available?
            │   └─► YES ✅ → Use FirebaseEntityRenderer
            │       └─► Render rich entity page with:
            │           • Hero section with large icon
            │           • Attributes & domains
            │           • Myths & legends
            │           • Family relationships
            │           • Sacred texts
            │           • Related entities
            │           • Full markdown content
            │
            └─► NO → Use renderBasicEntityPage()
                └─► ✅ Query Firebase for entity data
                    └─► Render basic page with:
                        • Entity hero section
                        • Description
                        • Markdown content
                        • Back navigation

RESULT: Content always displays (never "Coming soon")
```

## Fallback Priority Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT AVAILABILITY                    │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   IDEAL      │ │   ACCEPTABLE │ │   MINIMAL    │
    │ Full Feature │ │   Enhanced   │ │   Always OK  │
    ├──────────────┤ ├──────────────┤ ├──────────────┤
    │ • Rich UX    │ │ • Dynamic    │ │ • Static     │
    │ • Interactive│ │ • Firebase   │ │ • Self-Cont. │
    │ • Fast       │ │ • Flexible   │ │ • Reliable   │
    │ • Full Data  │ │ • Cached     │ │ • Fast       │
    └──────────────┘ └──────────────┘ └──────────────┘
         Tier 1          Tier 2           Tier 3
    (Best Experience)  (Good Enough)  (Always Works)
```

## Error Handling Flow

```
┌─────────────────────────────────────┐
│     COMPONENT LOADING ERROR         │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Log warning to console             │
│  "[SPA] ⚠️ Component not available" │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Try next tier in fallback chain   │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  FIREBASE QUERY ERROR               │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Log error to console               │
│  Show empty state message           │
│  Provide navigation back            │
└─────────────────────────────────────┘

NEVER shows "Coming soon" ✅
```

## Data Flow

```
┌──────────────┐
│   Firebase   │
│   Firestore  │
└──────────────┘
        │
        │ Query: collection(type).where('mythology','==',id)
        │
        ▼
┌──────────────┐
│  Component   │
│  or Fallback │
└──────────────┘
        │
        │ Process: Sort, Filter, Transform
        │
        ▼
┌──────────────┐
│   Renderer   │
│   (HTML)     │
└──────────────┘
        │
        │ Inject: innerHTML or DOM manipulation
        │
        ▼
┌──────────────┐
│     DOM      │
│   (Display)  │
└──────────────┘
```

## State Management

```
┌─────────────────────────────────────┐
│       ROUTE NAVIGATION EVENT        │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  1. showLoading()                   │
│     → Display spinner               │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  2. Component check & selection     │
│     → Choose renderer               │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  3. Data loading                    │
│     → Query Firebase                │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  4. Rendering                       │
│     → Generate HTML                 │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  5. DOM injection                   │
│     → Update main-content           │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  6. Event emission                  │
│     → first-render-complete         │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  7. Event listeners                 │
│     → Attach interactions           │
└─────────────────────────────────────┘

Total time: ~500ms - 2000ms (depending on tier)
```

## Component Dependencies

```
index.html
    │
    ├─► page-asset-renderer.js (Tier 2)
    │
    ├─► components/
    │   ├─► mythology-overview.js (Tier 1 - Mythology)
    │   └─► Other components...
    │
    ├─► views/
    │   ├─► browse-category-view.js (Tier 1 - Category)
    │   └─► Other views...
    │
    ├─► entity-renderer-firebase.js (Tier 1 - Entity)
    │
    └─► spa-navigation.js (Router + Tier 3 Fallbacks)
        ├─► renderBasicMythologyPage()
        ├─► renderBasicCategoryPage()
        ├─► renderBasicEntityPage()
        ├─► renderMarkdown()
        └─► escapeHtml()
```

## Summary

This architecture ensures:
- ✅ **No "Coming soon" placeholders** - Every route renders content
- ✅ **Graceful degradation** - Falls back through 3 tiers
- ✅ **Robust error handling** - Errors show helpful messages
- ✅ **Performance optimized** - Uses best available component
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Testable** - Each tier can be tested independently

All routes follow the same pattern:
```
Try Best → Try Good → Use Minimal → Always Works
```
