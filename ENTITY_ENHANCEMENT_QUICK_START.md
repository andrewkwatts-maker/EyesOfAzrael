# Entity Detail Enhancement - Quick Start Guide

🚀 **Get started with enhanced entity detail pages in 5 minutes!**

---

## What's New?

### Visual Enhancements
- ✨ Large hero icons (6rem) with floating animation
- 🎨 Beautiful metadata grid with hover effects
- 📑 Modern tabbed interface for organized content
- 📅 Timeline view for myths and legends
- 🌳 Interactive family tree visualization
- 🔗 Enhanced related entities with thumbnails

### SEO & Sharing
- 🔍 Schema.org structured data for rich snippets
- 📱 Open Graph tags for social media
- 🎯 JSON-LD for Google Knowledge Graph
- 🔖 Automatic keyword generation

### User Experience
- 🧭 Breadcrumb navigation
- ⚡ Quick action buttons
- 📱 Fully responsive design
- ♿ Accessibility improvements
- 🔖 Bookmark functionality

---

## Installation

### 1. Add Files to Your Page

```html
<!-- In <head> -->
<link rel="stylesheet" href="/css/entity-detail-enhanced.css">

<!-- Before </body> -->
<script src="/js/entity-renderer-firebase.js"></script>
<script src="/js/entity-renderer-enhanced.js"></script>
```

### 2. Prepare Your Entity Data

```javascript
const myDeity = {
    // Required basics
    id: 'zeus',
    name: 'Zeus',
    type: 'deity',
    mythology: 'greek',
    description: 'King of the Gods...',

    // Visual
    visual: { icon: '⚡' },

    // Domains
    domains: ['Sky', 'Thunder', 'Justice'],

    // NEW: Enhanced metadata
    epithets: ['Sky Father', 'Cloud Gatherer'],
    alternativeNames: ['Jupiter (Roman)'],
    period: 'Archaic to Hellenistic Period',
    region: 'Ancient Greece',
    significance: 'Supreme deity of Greek pantheon',

    // NEW: Family tree
    family: {
        parents: ['Kronos', 'Rhea'],
        siblings: ['Hera', 'Poseidon', 'Hades'],
        consorts: ['Hera', 'Leto', 'Maia'],
        children: ['Athena', 'Apollo', 'Artemis']
    },

    // NEW: Timeline myths
    mythsAndLegends: [
        {
            title: 'The Titanomachy',
            description: 'Ten-year war against the Titans...',
            source: 'Hesiod, Theogony',
            period: 'Titanomachy War'
        }
    ],

    // NEW: Primary sources
    texts: [
        {
            source: 'Homer, Iliad',
            section: 'Book 1',
            lines: '528-530',
            text: 'The son of Kronos spoke...'
        }
    ]
};
```

### 3. Initialize the Renderer

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('main');
    const renderer = new EnhancedEntityRenderer();

    renderer.mythology = 'greek';
    renderer.renderDeity(myDeity, container);
});
```

---

## Quick Examples

### Minimal Setup (3 Fields)

```javascript
const simpleDeity = {
    name: 'Apollo',
    type: 'deity',
    mythology: 'greek',
    visual: { icon: '☀️' },
    description: 'God of light, music, and prophecy'
};

// Renders with hero section, breadcrumbs, and overview tab
```

### Full Setup (All Features)

```javascript
const fullDeity = {
    // ... (see zeus-enhanced.html for complete example)
};

// Renders with:
// - All 5 tabs (Overview, Mythology, Relationships, Worship, Sources)
// - Family tree with parents, consorts, children
// - Timeline with 8 myths
// - Metadata grid with 6 fields
// - 8 related entities
// - SEO metadata injection
```

---

## Tab System

### Tabs Automatically Shown

| Data Present | Tab Shown |
|--------------|-----------|
| Always | 📖 Overview |
| `mythsAndLegends`, `myths`, or `stories` | 📜 Mythology |
| `family`, `relationships`, `allies`, or `enemies` | 👥 Relationships |
| `worship`, `cultCenters`, `rituals`, or `festivals` | 🏛️ Worship |
| `texts`, `sources`, or `primarySources` | 📚 Sources |

### Tab Content

**Overview Tab:**
- Full entity description (markdown supported)
- Attribute grid (domains, symbols, sacred items)
- Alternative names

**Mythology Tab:**
- Timeline view of myths
- Numbered markers
- Source citations
- Period labels

**Relationships Tab:**
- Visual family tree
- Allies section
- Enemies section

**Worship Tab:**
- Sacred sites list
- Festival cards
- Ritual descriptions

**Sources Tab:**
- Primary source quotes
- Numbered citations
- Modern interpretations

---

## Quick Actions

### Available Actions

```javascript
// Compare with similar deities
<button data-action="compare">

// View in mythology context
<button data-action="context">

// Scroll to related entities
<button data-action="related">

// Share via Web Share API or clipboard
<button data-action="share">

// Save to localStorage bookmarks
<button data-action="bookmark">
```

### Custom Actions

```javascript
class MyRenderer extends EnhancedEntityRenderer {
    handleQuickAction(action, entity) {
        if (action === 'custom') {
            // Your custom action
        } else {
            super.handleQuickAction(action, entity);
        }
    }
}
```

---

## Metadata Grid Fields

### Standard Fields

```javascript
{
    // Auto-shown if present
    type: 'deity',              // → Type: Deity
    mythology: 'greek',         // → Mythology: Greek
    domains: ['Sky'],           // → Domains: Sky, Thunder
    period: 'Archaic Period',   // → Period: Archaic Period
    region: 'Ancient Greece',   // → Region: Ancient Greece
    significance: 'Supreme...'  // → Significance: Supreme deity
}
```

### Icons Auto-Selected

- Type: `getTypeIcon(type)` → ⚡🗡️🐉⚔️🏛️
- Mythology: `getMythologyIcon(mythology)` → 🏛️🦅⚔️𓂀🕉️

---

## Family Tree Visualization

### Color Coding

```
Parents:  Blue nodes
Self:     Purple (highlighted, larger)
Consorts: Pink nodes
Children: Green nodes
Siblings: Orange nodes
```

### Features

- Hover effects on all nodes
- Visual connectors between levels
- "+X more" for overflow (>8 children)
- Full-width responsive layout

---

## Customization

### Override Tab Content

```javascript
class CustomRenderer extends EnhancedEntityRenderer {
    renderOverviewTab(entity) {
        return `
            <div class="my-custom-overview">
                <h3>My Custom Section</h3>
                ${super.renderOverviewTab(entity)}
            </div>
        `;
    }
}
```

### Add Custom Tab

```javascript
getTabs(entity) {
    const tabs = super.getTabs(entity);

    if (entity.customData) {
        tabs.push({
            id: 'custom',
            label: 'Custom',
            icon: '🎨'
        });
    }

    return tabs;
}

renderTabContent(tabId, entity) {
    if (tabId === 'custom') {
        return `<div>Custom content here</div>`;
    }
    return super.renderTabContent(tabId, entity);
}
```

### Change Icons

```javascript
getMythologyIcon(mythology) {
    const myIcons = {
        'custom': '🌟',
        'fantasy': '🧙'
    };
    return myIcons[mythology] || super.getMythologyIcon(mythology);
}
```

---

## SEO Features

### Auto-Injected Metadata

**Schema.org:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Zeus",
  "parent": [...],
  "children": [...]
}
</script>
```

**Open Graph:**
```html
<meta property="og:title" content="Zeus - Greek Mythology">
<meta property="og:description" content="King of the Gods...">
<meta property="og:type" content="article">
```

**Keywords:**
```html
<meta name="keywords" content="Zeus, Greek, deity, Sky, Thunder, ...">
```

---

## URL Parameters

### Load from Firebase

```
entity-page.html?type=deity&id=zeus&mythology=greek&enhance=true
```

### Auto-Initialization

```javascript
// Checks URL parameters automatically
// If enhance=true, uses EnhancedEntityRenderer
// Otherwise uses standard FirebaseEntityRenderer
```

---

## Live Demo

🎯 **See it in action:**
```
mythos/greek/deities/zeus-enhanced.html
```

**Showcases:**
- Large hero icon with animation
- 6-field metadata grid
- All 5 tabs active
- 8 myths in timeline
- Complex family tree (14 children!)
- 4 primary source texts
- 8 related entities
- Full SEO metadata

---

## Common Patterns

### Pattern 1: Simple Deity Page

```javascript
const deity = {
    name: 'Artemis',
    type: 'deity',
    mythology: 'greek',
    visual: { icon: '🏹' },
    description: 'Goddess of the hunt...',
    domains: ['Hunt', 'Wilderness', 'Moon']
};
```

**Result:**
- Hero section
- Breadcrumbs
- Quick actions
- Metadata grid (3 cards)
- Overview tab only

### Pattern 2: Deity with Family

```javascript
const deity = {
    // ... basic fields
    family: {
        parents: ['Zeus', 'Leto'],
        siblings: ['Apollo']
    }
};
```

**Result:**
- Overview tab
- Relationships tab (family tree)

### Pattern 3: Full Mythology Integration

```javascript
const deity = {
    // ... basic fields
    mythsAndLegends: [...],
    family: {...},
    texts: [...],
    relatedEntities: [...]
};
```

**Result:**
- All 5 tabs active
- Full feature set

---

## Troubleshooting

### Tabs Not Showing

**Problem:** Only Overview tab appears

**Solution:** Check data structure
```javascript
// Must be exact field names
mythsAndLegends: [...]  // ✅ Works
myths: [...]            // ✅ Works
stories: [...]          // ✅ Works
myMythsList: [...]      // ❌ Won't trigger tab
```

### Icons Not Displaying

**Problem:** Default icons (✨) instead of custom

**Solution:** Use `visual.icon` field
```javascript
// ✅ Correct
visual: { icon: '⚡' }

// ❌ Wrong
icon: '⚡'  // This works in base renderer but not enhanced
```

### Family Tree Empty

**Problem:** No family tree shows

**Solution:** Check structure
```javascript
// ✅ Correct
family: {
    parents: ['Zeus', 'Hera'],  // Array of strings
    children: ['Ares']
}

// ❌ Wrong
family: {
    parents: 'Zeus and Hera',  // String instead of array
}
```

### SEO Metadata Not Injecting

**Problem:** No Schema.org in page source

**Solution:** Check JavaScript console
- Enhanced renderer must be loaded
- Entity must be rendered successfully
- Check browser console for errors

---

## Performance Tips

### Lazy Load Large Content

```javascript
// Don't load all 100 children at once
children: entity.children.slice(0, 20)  // Limit to 20
```

### Optimize Images

```javascript
// Use emoji icons (fastest)
visual: { icon: '⚡' }

// Or optimized SVG
visual: { icon: '<svg>...</svg>' }

// Avoid large images
visual: { icon: '<img src="huge.png">' }  // ❌ Slow
```

### Cache Entity Data

```javascript
// Renderer automatically caches
// But you can pre-cache
localStorage.setItem('entity-zeus', JSON.stringify(zeusData));
```

---

## Next Steps

1. ✅ **Read full documentation:** `ENTITY_DETAIL_ENHANCEMENTS.md`
2. 🎯 **Try the demo:** `mythos/greek/deities/zeus-enhanced.html`
3. 🔧 **Customize:** Create your own renderer class
4. 🚀 **Deploy:** Add to your existing entity pages

---

## Support

- 📖 Full docs: `ENTITY_DETAIL_ENHANCEMENTS.md`
- 🎯 Live demo: `zeus-enhanced.html`
- 💻 Code examples: See `entity-renderer-enhanced.js`

---

**Last Updated:** 2025-12-28
**Version:** 2.0
