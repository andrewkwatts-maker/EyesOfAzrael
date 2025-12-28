# Entity Renderer - Quick Reference

## Updated Files

✅ **js/entity-renderer-firebase.js** - Main entity renderer
✅ **js/page-asset-renderer.js** - Page/landing renderer
✅ **js/components/attribute-grid-renderer.js** - Attribute grids
✅ **js/components/myth-list-renderer.js** - Myth lists

---

## Key Visual Improvements

### 1. Hero Section (4rem Icon)
```html
<section class="hero-section">
    <div class="hero-icon-display">⚡</div>  <!-- 4rem size -->
    <h2>Zeus</h2>
    <p class="subtitle" style="font-size: 1.5rem;">King of the Gods</p>
    <p style="font-size: 1.1rem;">Description...</p>
</section>
```

### 2. Responsive Attribute Grid
```css
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
/* 4 cols → 3 cols → 2 cols → 1 col responsive */
```

### 3. Myth Lists with Citations
```html
<ul style="margin: 1rem 0 0 2rem; line-height: 1.8;">
    <li>
        <strong>Myth Title:</strong> Description
        <div class="citation">
            <em>Source: Hesiod's Theogony</em>
        </div>
    </li>
</ul>
```

### 4. Collapsible Sacred Texts (mushussu.html pattern)
```html
<div class="codex-search-section">
    <div class="codex-search-header" onclick="toggleCodexSearch(this)">
        <h3>📚 Primary Sources</h3>
        <span class="expand-icon">▼</span>
    </div>
    <div class="codex-search-content">
        <div class="search-result-item">
            <div class="citation" onclick="toggleVerse(this)">
                Homer's Iliad:Book I:Lines 528-530
            </div>
            <div class="verse-text">"Text content..."</div>
        </div>
    </div>
</div>
```

### 5. Family Relationships (List Format)
```html
<ul style="margin: 0.5rem 0 0 2rem;">
    <li><strong>Parents:</strong> Kronos, Rhea</li>
    <li><strong>Consorts:</strong> Hera, Leto</li>
    <li><strong>Children:</strong> Athena, Apollo</li>
</ul>
```

---

## Entity Data Structure

### Deity Example
```javascript
{
    name: "Zeus",
    subtitle: "King of the Gods",
    description: "Supreme ruler...",
    icon: "⚡",
    mythology: "greek",

    // Attributes
    domains: ["Sky", "Thunder"],
    titles: ["King of the Gods"],
    symbols: ["Thunderbolt", "Eagle"],
    sacredAnimals: ["Eagle"],
    sacredPlants: ["Oak"],
    sacredPlaces: ["Mount Olympus"],

    // Family
    family: {
        parents: ["Kronos", "Rhea"],
        consorts: ["Hera"],
        children: ["Athena", "Apollo"],
        siblings: ["Poseidon", "Hades"]
    },

    // Myths
    mythsAndLegends: [
        {
            title: "The Titanomachy",
            description: "War against the Titans...",
            source: "Hesiod's Theogony"
        }
    ],

    // Sacred Texts
    texts: [
        {
            source: "Homer's Iliad",
            section: "Book I",
            lines: "528-530",
            text: "The son of Kronos spoke...",
            reference: "Homer's Iliad, Book I (c. 750 BCE)"
        }
    ],

    // Worship
    worship: "Grand sacrifices...",
    cultCenters: ["Olympia", "Dodona"],

    // Related
    relatedEntities: [
        { name: "Hera", type: "deity", icon: "👑" }
    ]
}
```

### Creature Example
```javascript
{
    name: "Mušḫuššu",
    subtitle: "Dragon of Marduk",
    description: "Fierce dragon...",
    icon: "🐉",
    mythology: "babylonian",

    // Attributes (object or array)
    attributes: {
        "Physical Form": "Serpent body...",
        "Associated Deity": "Marduk"
    },
    // OR:
    attributes: [
        { label: "Physical Form", value: "Serpent body..." }
    ],

    // Sacred Texts
    texts: [
        {
            source: "Enuma Elish",
            section: "Tablet I",
            lines: "133-138",
            text: "Mother Hubur...",
            reference: "Enuma Elish (c. 1200 BCE)"
        }
    ]
}
```

---

## CSS Classes

| Class | Purpose | Example |
|-------|---------|---------|
| `.hero-section` | Main hero container | Gradient background, padding |
| `.hero-icon-display` | Large 4rem icon | `font-size: 4rem` |
| `.subtitle` | Entity subtitle | `font-size: 1.5rem` |
| `.attribute-grid` | Responsive grid | 2-4 columns |
| `.subsection-card` | Attribute card | Border, padding, hover |
| `.attribute-label` | Attribute name | Bold, uppercase |
| `.attribute-value` | Attribute content | Normal text |
| `.citation` | Source attribution | Italic, border-left |
| `.codex-search-section` | Sacred texts container | Collapsible |
| `.verse-text` | Sacred text content | Hidden by default |

---

## Smart Anchor Links

All section headers include smart links:

```html
<h2 style="color: var(--color-primary);">
    <a data-mythos="greek" data-smart href="#attributes">Attributes</a> &amp; Domains
</h2>
```

**Benefits:**
- Deep linking to sections
- Mythology-aware styling
- Integration with smart-links.js

---

## Color Variables

```css
/* Primary colors */
var(--color-primary)        /* Section headers */
var(--color-secondary)      /* Links, accents */
var(--color-text-primary)   /* Main text */
var(--color-text-secondary) /* Muted text */

/* Mythology-specific */
var(--mythos-primary)       /* Mythology accent */
var(--mythos-secondary)     /* Secondary accent */
var(--mythos-gradient-start)
var(--mythos-gradient-end)
```

---

## Renderer Methods

### Main Renderers
- `renderDeity(entity, container)` - Full deity page
- `renderCreature(entity, container)` - Creature page
- `renderHero(entity, container)` - Hero page
- `renderGenericEntity(entity, container)` - Fallback

### Helper Methods
- `renderDeityAttributes(entity)` - Attribute grid
- `renderCreatureAttributes(entity)` - Creature attributes
- `renderFamilyRelationships(family)` - Family list
- `renderSacredTexts(entity)` - Collapsible texts
- `renderRelatedEntities(entities, type, options)` - Related grid/list
- `renderMarkdown(text)` - Basic markdown

### Utilities
- `escapeHtml(text)` - XSS protection
- `capitalize(str)` - Capitalize first letter
- `getDefaultIcon(type)` - Default icons by type

---

## Display Options for Related Entities

```javascript
displayOptions: {
    relatedEntities: {
        mode: 'grid',      // 'grid', 'list', 'table', 'panel'
        columns: 4,        // Grid columns
        sort: 'name',      // 'name', 'importance', 'date'
        showIcons: true,   // Show entity icons
        cardStyle: 'compact' // 'compact', 'detailed', 'minimal'
    }
}
```

---

## Integration Points

### Firebase CRUD
- Edit icons show for user-owned entities
- `renderEditIcon(entity)` checks `entity.createdBy`

### Theme System
- `applyMythologyStyles(container, mythology)` sets `data-mythology`
- All colors use CSS custom properties

### Smart Links
- Section headers use `data-smart` attribute
- Integrates with smart-links.js

### Corpus Search
- Entity names wrapped in `.corpus-link` class
- Links to corpus search pages

---

## Testing Checklist

✅ Hero icon displays at 4rem
✅ Attribute grid responsive (250px min)
✅ Myths render as `<ul>` with citations
✅ Sacred texts expand/collapse
✅ Family shows as list, not cards
✅ Smart anchor links work
✅ Mythology colors apply
✅ HTML properly escaped
✅ Edit icons show for owned content
✅ Fallback content for missing data

---

## Common Patterns

### Adding a New Attribute Type
```javascript
// In renderDeityAttributes()
if (entity.newAttributeType?.length) {
    attributes.push(`
        <div class="subsection-card">
            <div class="attribute-label">New Type</div>
            <div class="attribute-value">${entity.newAttributeType.join(', ')}</div>
        </div>
    `);
}
```

### Adding a New Section
```javascript
<!-- New Section -->
${entity.newSection ? `
<section style="margin-top: 2rem;">
    <h2 style="color: var(--color-primary);">
        <a data-mythos="${this.mythology}" data-smart href="#newsection">New Section</a>
    </h2>
    <p>${this.escapeHtml(entity.newSection)}</p>
</section>
` : ''}
```

### Custom Display Mode
```javascript
// In renderRelatedEntities()
case 'custom':
    return this.renderCustomMode(entities, config);
```

---

## Performance Tips

1. **Use template literals** for HTML generation
2. **Escape HTML once** during rendering
3. **Cache mythology colors** in CSS variables
4. **Lazy load** sacred texts (collapsed by default)
5. **Single innerHTML assignment** per section

---

## Migration from Static HTML

1. Extract hero → `name`, `subtitle`, `description`, `icon`
2. Parse grids → `domains`, `titles`, `symbols` arrays
3. Extract lists → `mythsAndLegends` array
4. Parse family → `family` object
5. Extract citations → `texts` array
6. Set mythology → `mythology: "greek"`
7. Configure display → `displayOptions` object

---

## Example Usage

### Rendering a Deity
```javascript
const renderer = new FirebaseEntityRenderer();
await renderer.loadAndRender('deity', 'zeus', 'greek', container);
```

### Rendering a Creature
```javascript
const renderer = new FirebaseEntityRenderer();
await renderer.loadAndRender('creature', 'mushussu', 'babylonian', container);
```

### Rendering a Page
```javascript
const renderer = new PageAssetRenderer(db);
await renderer.renderPage('home', container);
```

---

*Quick Reference - Version 2.0*
*Last Updated: 2025-12-28*
