# ENTITY RENDERING FLOW DIAGRAM

## Current System (What Works)

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER CLICKS                                │
│                    "Greek Mythology" Card                          │
└───────────────────────────┬────────────────────────────────────────┘
                            │
                            ▼
                  window.location.hash = "#/mythology/greek"
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SPANavigation.handleRoute()                      │
│  • Parses hash: /mythology/greek                                   │
│  • Matches route pattern: routes.mythology                         │
│  • Calls: renderMythology("greek")                                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
                    ❌ STUB IMPLEMENTATION
        mainContent.innerHTML = "<h1>greek Mythology</h1>
                                  <p>Coming soon...</p>"
                            │
                            ▼
                  User sees placeholder text
```

## What SHOULD Happen

```
┌────────────────────────────────────────────────────────────────────┐
│                    SPANavigation.handleRoute()                      │
│  • Parses hash: /mythology/greek                                   │
│  • Matches route pattern: routes.mythology                         │
│  • Calls: renderMythology("greek")                                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              renderMythology("greek") - FIXED VERSION               │
│                                                                     │
│  const overview = new MythologyOverview({ db: this.db });         │
│  const html = await overview.render({ mythology: "greek" });      │
│  mainContent.innerHTML = html;                                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              MythologyOverview.render({ mythology: "greek" })       │
│                                                                     │
│  1. Load mythology data from Firebase                              │
│     → db.collection('mythologies').doc('greek').get()             │
│                                                                     │
│  2. Load entity counts for all types                               │
│     → db.collection('deities').where('mythology', '==', 'greek')  │
│     → db.collection('heroes').where('mythology', '==', 'greek')   │
│     → ... (11 total entity types)                                  │
│                                                                     │
│  3. Generate HTML with:                                            │
│     • Hero section (icon, title, description)                     │
│     • Stats dashboard (total entities, counts per type)           │
│     • Entity type cards (clickable category links)                │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         RENDERED HTML                               │
│                                                                     │
│  ┌────────────────────────────────────────────────┐               │
│  │         🏛️ Greek Mythology                     │               │
│  │  Gods of Olympus and heroes of ancient Greece  │               │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │               │
│  │  Region: Greece | Period: 800 BCE - 400 CE    │               │
│  └────────────────────────────────────────────────┘               │
│                                                                     │
│  ┌────────────────────────────────────────────────┐               │
│  │  Content Statistics                            │               │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │               │
│  │  │ 156  │ │  43  │ │  28  │ │  19  │         │               │
│  │  │Total │ │👑Dei.│ │🦸Hero│ │🐉Crea│         │               │
│  │  └──────┘ └──────┘ └──────┘ └──────┘         │               │
│  └────────────────────────────────────────────────┘               │
│                                                                     │
│  ┌────────────────────────────────────────────────┐               │
│  │  Explore by Category                           │               │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ │               │
│  │  │ 👑 Deities │ │ 🦸 Heroes  │ │ 🐉 Creature│ │               │
│  │  │ 43 deities │ │ 28 heroes  │ │ 19 creatur │ │               │
│  │  │      →     │ │      →     │ │      →     │ │               │
│  │  └────────────┘ └────────────┘ └────────────┘ │               │
│  └────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## Category List Flow (Works)

```
User clicks "👑 Deities" card
    ↓
window.location.hash = "#/mythology/greek/deities"
    ↓
SPANavigation.handleRoute()
    │
    ├─ Matches: routes.category
    │
    └─ Calls: renderCategory("greek", "deities")
         ↓
    ❌ STUB: mainContent.innerHTML = "<h1>deities - greek</h1><p>Coming soon...</p>"

── SHOULD BE ──

renderCategory("greek", "deities") - FIXED
    ↓
const browser = new EntityTypeBrowser({ db: this.db });
const html = await browser.render({
    mythology: "greek",
    entityType: "deity",  // singular
    entityTypePlural: "deities"
});
    ↓
EntityTypeBrowser.render()
    │
    ├─ Query Firebase: db.collection('deities')
    │                     .where('mythology', '==', 'greek')
    │                     .orderBy('name', 'asc')
    │
    ├─ Get 43 deity documents
    │
    └─ Generate HTML with:
        • Header with icon and title
        • View mode switcher (grid/list/table)
        • Sort controls
        • Entity grid (uses UniversalEntityRenderer)
    ↓
Rendered deity cards:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ⚡ Zeus      │ │ 🏹 Artemis   │ │ ☀️ Apollo    │
│ King of Gods │ │ Huntress     │ │ Sun God      │
│ [View →]     │ │ [View →]     │ │ [View →]     │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Entity Detail Flow (BROKEN)

```
User clicks "⚡ Zeus" card
    ↓
Link URL: /mythos/greek/deities/zeus.html  ❌ STATIC URL (WRONG)
    ↓
Browser navigates to static file
    ↓
404 Not Found (file doesn't exist)

── SHOULD BE ──

User clicks "⚡ Zeus" card
    ↓
Link URL: #/mythology/greek/deity/zeus  ✅ SPA HASH ROUTE
    ↓
SPANavigation.handleRoute()
    │
    ├─ Matches: routes.entity
    │
    └─ Calls: renderEntity("greek", "deity", "zeus")
         ↓
    ❌ STUB: mainContent.innerHTML = "<h1>zeus</h1><p>Coming soon...</p>"

── SHOULD BE ──

renderEntity("greek", "deity", "zeus") - FIXED
    ↓
const viewer = new EntityDetailViewer({ db: this.db });
await viewer.render({
    mythology: "greek",
    entityType: "deity",
    entityId: "zeus"
});
    ↓
EntityDetailViewer.render()
    │
    ├─ Use FirebaseEntityRenderer
    │
    └─ renderer.loadAndRender("deity", "zeus", "greek", container)
         ↓
FirebaseEntityRenderer.loadAndRender()
    │
    ├─ Fetch entity from Firebase:
    │   → db.collection('deities').doc('zeus').get()
    │
    ├─ Get entity data:
    │   {
    │     id: "zeus",
    │     name: "Zeus",
    │     mythology: "greek",
    │     domains: ["Sky", "Thunder", "Justice"],
    │     family: { parents: ["Kronos", "Rhea"], ... },
    │     ...
    │   }
    │
    └─ Render deity-specific template:
        • Header with icon and name
        • Attributes grid (domains, symbols, etc.)
        • Family relationships
        • Myths and legends
        • Worship and sacred sites
        • Related entities
        • Sources
    ↓
Rendered detail page:
┌─────────────────────────────────────────────────────┐
│  ⚡                                                  │
│  Zeus                                               │
│  King of the Gods, Ruler of Olympus                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  Attributes & Domains                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Domains  │ │ Symbols  │ │ Animals  │          │
│  │ Sky      │ │Thunder-  │ │ Eagle    │          │
│  │ Thunder  │ │ bolt     │ │          │          │
│  │ Justice  │ │ Oak      │ │          │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                     │
│  Family & Relationships                            │
│  Parents: Kronos, Rhea                             │
│  Consorts: Hera, Leto, ...                        │
│  Children: Athena, Apollo, Artemis, ...           │
│                                                     │
│  [... more sections ...]                          │
└─────────────────────────────────────────────────────┘
```

## URL Generation Issue

**Current (BROKEN)**:
```javascript
// js/universal-entity-renderer.js line 713
getEntityUrl(entity) {
    return `/mythos/${mythology}/${type}/${entity.id}.html`;
}

Result: /mythos/greek/deities/zeus.html  ❌ Static file URL
```

**Fixed**:
```javascript
getEntityUrl(entity) {
    return `#/mythology/${mythology}/${type}/${entity.id}`;
}

Result: #/mythology/greek/deity/zeus  ✅ SPA hash route
```

## Complete Navigation Flow (After Fixes)

```
Home Page (#/)
    ↓
    │ Click Greek Mythology card
    ↓
Mythology Overview (#/mythology/greek)
    ↓
    │ Click Deities category
    ↓
Entity Type Browser (#/mythology/greek/deities)
    ↓
    │ Click Zeus deity card
    ↓
Entity Detail Page (#/mythology/greek/deity/zeus)
    │
    └─ All data loaded from Firebase
    └─ Full entity information displayed
    └─ Related entities are clickable
    └─ Back button works correctly
    └─ Breadcrumbs show full path: Home > Greek > Deities > Zeus
```

## Component Dependency Chain

```
┌───────────────────────────────────────────────────────────────┐
│                       index.html                              │
│  Loads scripts in order:                                     │
│  1. Firebase SDK                                             │
│  2. Firebase Config                                          │
│  3. Auth Guard                                               │
│  4. Auth Manager                                             │
│  5. HomeView ✅                                              │
│  6. EntityRenderer ✅                                        │
│  7. SPANavigation ✅                                         │
│  8. Missing: MythologyOverview ❌                           │
│  9. Missing: EntityTypeBrowser ❌                           │
│  10. Missing: EntityDetailViewer ❌                         │
│  11. Missing: UniversalEntityRenderer ❌                    │
│  12. App Init                                                │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                  app-init-simple.js                          │
│  Creates:                                                    │
│  • window.EyesOfAzrael.db                                   │
│  • window.EyesOfAzrael.auth                                 │
│  • window.EyesOfAzrael.navigation                           │
│                                                              │
│  But doesn't register view components ❌                    │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                   SPANavigation                              │
│  Has route patterns but stub handlers ❌                    │
│  • renderMythology() → "Coming soon..."                     │
│  • renderCategory() → "Coming soon..."                      │
│  • renderEntity() → "Coming soon..."                        │
└───────────────────────────────────────────────────────────────┘
```

## Summary of Issues

| Issue | Location | Impact | Fix Complexity |
|-------|----------|--------|----------------|
| Missing component scripts | index.html | Can't instantiate view components | Easy (add script tags) |
| Stub route handlers | spa-navigation.js | Pages show placeholders | Medium (update 3 methods) |
| Static URLs in renderer | universal-entity-renderer.js | Links break navigation | Easy (change URL format) |
| Missing EntityDetailViewer | N/A | Detail pages don't work | Medium (create new component) |
| No component registration | app-init-simple.js | Router can't use components | Easy (add registration code) |

**Total Fix Time**: ~4-5 hours
**Lines of Code to Change**: ~150 lines
**Files to Create**: 1 (EntityDetailViewer)
**Files to Modify**: 4 (index.html, spa-navigation.js, universal-entity-renderer.js, app-init-simple.js)
