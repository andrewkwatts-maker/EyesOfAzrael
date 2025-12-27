# Unified Firebase Asset Template

## Overview

All Firebase assets (deities, items, places, mythologies, theories, etc.) use a **unified base template** that supports 5 rendering modes and complete metadata for filtering, searching, cross-linking, and dynamic collections.

---

## Base Asset Template

Every asset in Firebase follows this structure:

```javascript
{
    // === CORE IDENTITY ===
    id: 'unique-id',                    // Unique identifier (kebab-case)
    type: 'deity',                      // Asset type: deity, item, place, mythology, theory, etc.
    name: 'Asset Name',                 // Primary display name
    title: 'Alternative Title',         // Optional alternative title
    subtitle: 'Brief Tagline',          // Optional subtitle

    // === DISPLAY ===
    icon: '📄',                         // Icon emoji or URL
    image: 'url-to-image.jpg',         // Primary image URL
    thumbnail: 'url-to-thumbnail.jpg',  // Thumbnail for grid view
    color: '#8b7fff',                   // Primary color (hex)

    // === CONTENT ===
    description: 'Brief description',   // Short description (1-2 sentences)
    summary: 'Longer summary',          // Medium summary (paragraph)
    content: 'Full content',            // Full content (markdown supported)

    // === METADATA ===
    metadata: {
        // Classification
        category: 'main-category',      // Primary category
        subcategory: 'sub-category',    // Sub-category
        tags: ['tag1', 'tag2'],         // Search/filter tags

        // Ordering & Display
        order: 1,                       // Display order (lower = first)
        importance: 95,                 // Importance score (0-100)
        featured: true,                 // Show on featured lists
        status: 'active',               // active, draft, archived, hidden

        // Temporal
        created: timestamp,             // Creation timestamp
        updated: timestamp,             // Last update timestamp
        published: timestamp,           // Publication timestamp

        // Authorship
        author: 'user-id',              // Creator user ID
        contributors: ['user-id'],      // Contributor user IDs
        source: 'source-reference',     // Original source

        // Access
        visibility: 'public',           // public, private, members-only
        permissions: {                  // Access permissions
            read: ['*'],                // Who can read
            edit: ['admin'],            // Who can edit
            delete: ['admin']           // Who can delete
        }
    },

    // === RELATIONSHIPS ===
    relationships: {
        // Parent/Child
        mythology: 'greek',             // Parent mythology
        parentId: 'parent-asset-id',    // Parent asset
        childIds: ['child-id-1'],       // Child assets

        // Cross-references
        relatedIds: ['related-1'],      // Related assets
        references: [                   // External references
            {
                type: 'deity',
                id: 'zeus',
                label: 'Father of Gods'
            }
        ],

        // Collections
        collections: ['olympians', 'sky-gods'],  // Collection memberships

        // Semantic links
        sameAs: ['url-1', 'url-2'],     // Same entity in other databases
        seeAlso: ['url-1', 'url-2']     // Related resources
    },

    // === SEARCH & FILTERING ===
    search: {
        // Indexed fields
        keywords: ['word1', 'word2'],   // Search keywords
        aliases: ['alias1', 'alias2'],  // Alternative names

        // Facets for filtering
        facets: {
            culture: 'greek',           // Cultural origin
            period: 'classical',        // Time period
            domain: 'sky',              // Domain/sphere
            gender: 'male',             // Gender (if applicable)
            alignment: 'good',          // Moral alignment
            power: 'high'               // Power level
        },

        // Full-text search
        searchableText: 'Combined text for full-text search...'
    },

    // === RENDERING CONFIGURATION ===
    rendering: {
        // Which modes are enabled for this asset
        modes: {
            hyperlink: true,            // Can render as link
            expandableRow: true,        // Can render as expandable row
            panelCard: true,            // Can render as panel in grid
            subsection: true,           // Can render as expandable subsection
            fullPage: true              // Can render as full page
        },

        // Default rendering preferences
        defaultMode: 'panelCard',       // Default rendering mode
        defaultAction: 'page',          // Default click action: page, expand, dropdown

        // Mode-specific configuration
        hyperlink: {
            showIcon: true,             // Show icon in link
            showDescription: false,     // Show description on hover
            dropdownOptions: [          // Dropdown menu options
                {
                    label: 'View Page',
                    action: 'navigate',
                    icon: '📄',
                    route: '#/{type}/{id}'
                },
                {
                    label: 'Quick View',
                    action: 'expand',
                    icon: '👁️'
                },
                {
                    label: 'References',
                    action: 'showReferences',
                    icon: '🔗'
                },
                {
                    label: 'Corpus Search',
                    action: 'corpusSearch',
                    icon: '🔍'
                }
            ]
        },

        expandableRow: {
            showPreview: true,          // Show preview in collapsed state
            previewFields: ['name', 'description', 'icon'],
            expandedFields: ['summary', 'relationships', 'metadata'],
            expandAnimation: 'slide',   // slide, fade, none
            maxHeight: '500px'          // Max height when expanded
        },

        panelCard: {
            size: 'medium',             // small, medium, large
            layout: 'standard',         // standard, compact, featured
            showFields: ['icon', 'name', 'description', 'status'],
            hoverEffect: 'lift',        // lift, glow, scale, none
            badge: null                 // Optional badge text
        },

        subsection: {
            collapsible: true,          // Can be collapsed
            defaultState: 'expanded',   // expanded, collapsed
            showChildCount: true,       // Show number of children
            childrenLayout: 'grid',     // grid, list, tree
            depth: 2                    // Max nesting depth
        },

        fullPage: {
            layout: 'standard',         // standard, hero, sidebar, tabs
            sections: [                 // Page sections to display
                'header',
                'description',
                'attributes',
                'relationships',
                'references',
                'related'
            ],
            sidebar: {
                enabled: true,
                position: 'right',      // left, right
                sticky: true,
                content: ['toc', 'related', 'actions']
            }
        }
    },

    // === TYPE-SPECIFIC DATA ===
    // Each asset type can have additional fields
    // Examples:

    // For deities:
    attributes: {
        domains: ['sky', 'thunder'],
        symbols: ['lightning bolt', 'eagle'],
        epithets: ['Father of Gods'],
        consort: 'hera',
        parents: ['cronus', 'rhea'],
        children: ['apollo', 'artemis']
    },

    // For items:
    itemProperties: {
        itemType: 'weapon',
        material: 'divine bronze',
        powers: ['flight', 'thunder'],
        owner: 'zeus',
        location: 'olympus'
    },

    // For places:
    placeProperties: {
        placeType: 'sacred-mountain',
        location: 'Greece',
        inhabitants: ['zeus', 'hera'],
        significance: 'Home of the gods'
    },

    // For theories:
    theoryProperties: {
        hypothesis: 'Main thesis',
        evidence: ['point-1', 'point-2'],
        scholars: ['scholar-1'],
        relatedTheories: ['theory-id']
    }
}
```

---

## 5 Rendering Modes

### 1. Hyperlink Mode
**When to use:** Inline references, citations, cross-links

**Rendered as:**
```html
<a href="#/deity/zeus" class="asset-link" data-asset-id="zeus">
    <span class="asset-icon">⚡</span>
    <span class="asset-name">Zeus</span>
    <span class="asset-dropdown-trigger">▼</span>
</a>
```

**Features:**
- Click → Navigate to full page (default)
- Dropdown menu on hover/click:
  - View Page
  - Quick View (expand inline)
  - Show References
  - Corpus Search

**Configuration:**
```javascript
rendering.hyperlink = {
    showIcon: true,
    showDescription: true,
    dropdownOptions: [...]
}
```

---

### 2. Expandable Row Mode
**When to use:** List views, search results, tables

**Rendered as:**
```html
<div class="asset-row expandable" data-asset-id="zeus">
    <div class="row-header">
        <span class="expand-icon">▶</span>
        <span class="asset-icon">⚡</span>
        <span class="asset-name">Zeus</span>
        <span class="asset-description">King of the gods</span>
    </div>
    <div class="row-content collapsed">
        <!-- Full content when expanded -->
    </div>
</div>
```

**Features:**
- Collapsed by default (shows preview)
- Click to expand/collapse
- Smooth animation
- Shows full content when expanded

**Configuration:**
```javascript
rendering.expandableRow = {
    showPreview: true,
    previewFields: ['name', 'description'],
    expandedFields: ['summary', 'attributes'],
    maxHeight: '500px'
}
```

---

### 3. Panel Card Mode
**When to use:** Grid layouts, galleries, category browsing

**Rendered as:**
```html
<a href="#/deity/zeus" class="panel-card" data-asset-id="zeus">
    <div class="card-image">
        <img src="zeus-thumbnail.jpg" alt="Zeus">
    </div>
    <div class="card-icon">⚡</div>
    <h3 class="card-title">Zeus</h3>
    <p class="card-description">King of the gods</p>
    <div class="card-tags">
        <span class="tag">Olympian</span>
        <span class="tag">Sky God</span>
    </div>
</a>
```

**Features:**
- Visual card with image
- Hover effects (lift, glow, scale)
- Badge/status indicators
- Click to navigate

**Configuration:**
```javascript
rendering.panelCard = {
    size: 'medium',
    layout: 'standard',
    showFields: ['icon', 'name', 'description'],
    hoverEffect: 'lift'
}
```

---

### 4. Subsection Panel Mode
**When to use:** Hierarchical content, nested sections

**Rendered as:**
```html
<div class="subsection-panel" data-asset-id="zeus">
    <div class="subsection-header">
        <span class="collapse-icon">▼</span>
        <h3 class="subsection-title">
            <span class="subsection-icon">⚡</span>
            Zeus - King of the Gods
        </h3>
        <span class="child-count">(12 children)</span>
    </div>
    <div class="subsection-content expanded">
        <!-- Full content -->
        <div class="subsection-children">
            <!-- Child assets as nested panels -->
        </div>
    </div>
</div>
```

**Features:**
- Collapsible sections
- Nested children display
- Shows child count
- Supports multiple nesting levels

**Configuration:**
```javascript
rendering.subsection = {
    collapsible: true,
    defaultState: 'expanded',
    showChildCount: true,
    childrenLayout: 'grid',
    depth: 2
}
```

---

### 5. Full Page Mode
**When to use:** Dedicated detail pages

**Rendered as:**
```html
<div class="asset-page" data-asset-id="zeus" data-asset-type="deity">
    <header class="page-header">
        <div class="header-icon">⚡</div>
        <h1 class="page-title">Zeus</h1>
        <p class="page-subtitle">King of the Gods, God of Sky and Thunder</p>
    </header>

    <div class="page-layout">
        <aside class="page-sidebar">
            <!-- TOC, related, actions -->
        </aside>

        <main class="page-content">
            <section class="description">...</section>
            <section class="attributes">...</section>
            <section class="relationships">...</section>
            <section class="references">...</section>
            <section class="related">...</section>
        </main>
    </div>
</div>
```

**Features:**
- Full dedicated page layout
- Multiple sections
- Sidebar with TOC
- Related content recommendations
- Breadcrumb navigation

**Configuration:**
```javascript
rendering.fullPage = {
    layout: 'standard',
    sections: ['header', 'description', 'attributes', 'relationships'],
    sidebar: { enabled: true, position: 'right' }
}
```

---

## Metadata Requirements for Features

### For Filtering
Required fields:
- `metadata.tags` - Array of tags
- `search.facets` - Object with facet values
- `metadata.category` - Primary category
- `metadata.status` - Status (active/draft/archived)

### For Searching
Required fields:
- `name` - Primary name
- `search.keywords` - Search keywords
- `search.aliases` - Alternative names
- `search.searchableText` - Combined searchable content

### For Ordering
Required fields:
- `metadata.order` - Display order (integer)
- `metadata.importance` - Importance score (0-100)
- `metadata.created` - Creation timestamp
- `metadata.updated` - Update timestamp

### For Cross-linking
Required fields:
- `relationships.mythology` - Parent mythology
- `relationships.relatedIds` - Related asset IDs
- `relationships.references` - External references
- `relationships.collections` - Collection memberships

### For Dynamic Collections
Required fields:
- `type` - Asset type
- `metadata.tags` - Tags for collection matching
- `search.facets` - Facets for filtering
- `relationships.collections` - Explicit collection memberships

---

## Migration Plan

All existing Firebase assets need to be migrated to this unified template:

1. **Deities** (~500 documents)
2. **Mythologies** (17 documents)
3. **Items** (3 documents, expanding)
4. **Places** (4 documents, expanding)
5. **Theories** (3 documents, expanding)
6. **Archetypes** (many documents)
7. **Submissions** (user-generated)

Each asset type will be validated and enhanced by specialized agents.

---

## Next Steps

1. Create `UniversalAssetRenderer` class supporting all 5 modes
2. Deploy agents to validate/migrate existing assets
3. Add missing metadata to all assets
4. Test all rendering modes
5. Implement dynamic collection system
6. Build corpus search integration

---

**Status:** Template defined, implementation in progress
