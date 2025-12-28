# Entity Renderer Polish Guide

## Overview

The entity rendering system has been polished to match the visual quality and structure of historic entity pages (like `zeus.html` and `mushussu.html`). This guide documents the enhanced rendering capabilities.

## Files Updated

### 1. `js/entity-renderer-firebase.js`
Main entity renderer with support for deities, creatures, heroes, items, places, and concepts.

### 2. `js/page-asset-renderer.js`
Page renderer for landing pages and category indexes with enhanced hero sections.

### 3. `js/components/attribute-grid-renderer.js`
Responsive attribute grid renderer (2-4 columns).

### 4. `js/components/myth-list-renderer.js`
Myth list renderer with proper typography and citation support.

---

## Key Features

### Hero Section with Large Icon

All entity pages now feature a prominent hero section with:
- **4rem icon** (`.hero-icon-display`)
- **Large title** (h2 with proper typography)
- **Subtitle** (1.5rem font size)
- **Description paragraph** (1.1rem font size)
- **Mythology-aware gradient backgrounds**

```html
<section class="hero-section">
    <div class="hero-icon-display">⚡</div>
    <h2>Zeus</h2>
    <p class="subtitle" style="font-size: 1.5rem; margin: 0.5rem 0;">
        King of the Gods, God of Sky and Thunder
    </p>
    <p style="font-size: 1.1rem; margin-top: 1rem;">
        Supreme ruler of Mount Olympus...
    </p>
</section>
```

### Responsive Attribute Grid

Attributes now render in a responsive grid (2-4 columns based on screen size):

```css
.attribute-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}
```

**Supported attributes for deities:**
- Titles/Epithets
- Domains
- Symbols
- Sacred Animals
- Sacred Plants
- Sacred Places

**Rendered as `.subsection-card` elements** for consistent styling.

### Myth List with Citations

Mythology sections now include:
- **Section header** with smart anchor links
- **Introductory paragraph**
- **Key Myths list** with proper `<ul>` structure
- **Citation blocks** for sources
- **Contributor attribution**

```html
<section style="margin-top: 2rem;">
    <h2 style="color: var(--color-primary);">
        <a data-mythos="greek" data-smart href="#mythology">Mythology</a> &amp; Stories
    </h2>
    <p>Zeus's mythology spans numerous tales and legends...</p>
    <h3 style="color: var(--color-text-primary); margin-top: 1.5rem;">Key Myths:</h3>
    <ul style="margin: 1rem 0 0 2rem; line-height: 1.8;">
        <li>
            <strong>The Titanomachy:</strong> Zeus led the Olympians...
            <div class="citation" style="margin-top: 0.5rem;">
                <em>Source: Hesiod's Theogony</em>
            </div>
        </li>
    </ul>
</section>
```

### Sacred Texts Section (Collapsible)

Inspired by `mushussu.html`, entities can now include expandable primary sources:

```javascript
renderSacredTexts(entity) {
    return `
        <div class="codex-search-section">
            <div class="codex-search-header" onclick="toggleCodexSearch(this)">
                <h3>📚 Primary Sources: ${entity.name}</h3>
                <span class="expand-icon">▼</span>
            </div>
            <div class="codex-search-content">
                <div class="search-result-item">
                    <div class="citation" onclick="toggleVerse(this)">
                        Enuma Elish:Tablet I:Lines 133-138
                    </div>
                    <div class="verse-text">
                        "Mother Hubur, who fashions all things..."
                    </div>
                    <div class="book-reference">
                        Source: Enuma Elish, Tablet I (c. 1200 BCE)
                    </div>
                </div>
            </div>
        </div>
    `;
}
```

### Family Relationships

Relationships now render as a clean `<ul>` list instead of cards:

```html
<section style="margin-top: 2rem;">
    <h2 style="color: var(--color-primary);">
        <a data-mythos="greek" data-smart href="#relationships">Relationships</a>
    </h2>
    <h3 style="color: var(--color-text-primary);">Family</h3>
    <ul style="margin: 0.5rem 0 0 2rem;">
        <li><strong>Parents:</strong> Kronos and Rhea</li>
        <li><strong>Consort(s):</strong> Hera, Leto, Maia...</li>
        <li><strong>Children:</strong> Athena, Apollo, Artemis...</li>
        <li><strong>Siblings:</strong> Hestia, Demeter, Hera...</li>
    </ul>
</section>
```

### Smart Anchor Links

Section headers now include smart anchor links for better navigation:

```html
<h2 style="color: var(--color-primary);">
    <a data-mythos="greek" data-smart href="#attributes">Attributes</a> &amp; Domains
</h2>
```

These links:
- Use `data-smart` attribute for smart-links.js integration
- Include `data-mythos` for mythology-aware styling
- Enable deep linking to specific sections

---

## Entity Type Renderers

### Deity Renderer (`renderDeity`)

**Sections rendered:**
1. Hero section (icon, title, subtitle, description)
2. Attributes & Domains (responsive grid)
3. Mythology & Stories (key myths list)
4. Family & Relationships (list format)
5. Worship & Sacred Sites
6. Content (markdown)
7. Sacred Texts (collapsible)
8. Related Entities (with display options)

**Data structure:**
```javascript
{
    name: "Zeus",
    subtitle: "King of the Gods, God of Sky and Thunder",
    description: "Supreme ruler of Mount Olympus...",
    icon: "⚡",
    domains: ["Sky", "Thunder", "Justice"],
    titles: ["King of the Gods", "Father of Gods and Men"],
    symbols: ["Thunderbolt", "Eagle", "Oak"],
    family: {
        parents: ["Kronos", "Rhea"],
        consorts: ["Hera", "Leto", "Maia"],
        children: ["Athena", "Apollo", "Artemis"],
        siblings: ["Hestia", "Demeter", "Hera", "Hades", "Poseidon"]
    },
    mythsAndLegends: [
        {
            title: "The Titanomachy",
            description: "Zeus led the Olympians against the Titans...",
            source: "Hesiod's Theogony"
        }
    ],
    texts: [
        {
            source: "Homer's Iliad",
            section: "Book I",
            lines: "528-530",
            text: "The son of Kronos spoke, and bowed his dark brow...",
            reference: "Homer's Iliad, Book I (c. 750 BCE)"
        }
    ]
}
```

### Creature Renderer (`renderCreature`)

**Sections rendered:**
1. Hero section (icon, title, subtitle, description)
2. Attributes (responsive grid, supports both object and array formats)
3. Content (markdown)
4. Sacred Texts (collapsible primary sources)
5. Related Entities

**Data structure:**
```javascript
{
    name: "Mušḫuššu",
    subtitle: "Dragon of Marduk",
    description: "Fierce dragon with serpentine features...",
    icon: "🐉",
    attributes: {
        "Physical Form": "Serpent body, lion forelegs, eagle talons",
        "Associated Deity": "Marduk",
        "Symbolic Meaning": "Divine power and protection"
    },
    // OR array format:
    attributes: [
        { label: "Physical Form", value: "Serpent body, lion forelegs..." },
        { label: "Associated Deity", value: "Marduk" }
    ],
    texts: [
        {
            source: "Enuma Elish",
            section: "Tablet I",
            lines: "133-138",
            text: "Mother Hubur, who fashions all things...",
            reference: "Enuma Elish, Tablet I (c. 1200 BCE)"
        }
    ]
}
```

### Generic Entity Renderer (`renderGenericEntity`)

Fallback for heroes, items, places, concepts:

**Sections rendered:**
1. Hero section (icon, title, subtitle, description)
2. Content (markdown)

---

## Page Asset Renderer

### Hero Section

Pages can now include hero sections with large icons:

```javascript
{
    hero: {
        title: "World Mythologies",
        subtitle: "Explore divine wisdom across cultures",
        icon: "🌍",
        cta: [
            { text: "Explore Deities", link: "/deities", icon: "⚡", primary: true },
            { text: "Browse Creatures", link: "/creatures", icon: "🐉" }
        ]
    }
}
```

### Section Cards

Card grids now match historic styling:

```html
<div class="card-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
    <a href="/deity/zeus" class="card panel-card">
        <div class="card-icon" style="font-size: 2rem;">⚡</div>
        <h3 class="card-title" style="color: var(--color-primary);">Zeus</h3>
        <p class="card-description">King of the Gods</p>
    </a>
</div>
```

---

## CSS Classes Used

### Hero Section
- `.hero-section` - Main container with gradient background
- `.hero-icon-display` - Large icon (4rem)
- `.subtitle` - Subtitle text (1.5rem)

### Attributes
- `.attribute-grid` - Responsive grid container
- `.subsection-card` - Individual attribute cards
- `.attribute-label` - Attribute name/label
- `.attribute-value` - Attribute content

### Lists & Citations
- `.citation` - Source attribution block
- `.myth-item` - Individual myth list item
- `.book-reference` - Detailed source reference

### Sacred Texts
- `.codex-search-section` - Container for collapsible texts
- `.codex-search-header` - Clickable header
- `.codex-search-content` - Expandable content
- `.search-result-item` - Individual text citation
- `.verse-text` - Sacred text content

---

## Typography

### Headings
- **h2 (section headers):** `color: var(--color-primary)` with smart anchor links
- **h3 (subsection headers):** `color: var(--color-text-primary)`
- **Hero title:** 2.5rem, centered
- **Subtitle:** 1.5rem, centered

### Body Text
- **Description:** 1.1rem for hero sections
- **Lists:** 1.8 line-height, 2rem left margin
- **Citations:** Italic, secondary text color

---

## Responsive Design

All components use responsive grid layouts:

```css
/* 4 columns on large screens */
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

/* Automatically collapses to:
   - 3 columns on medium screens
   - 2 columns on tablets
   - 1 column on mobile
*/
```

---

## Color System

Entity renderers use CSS custom properties for theming:

- `var(--color-primary)` - Primary accent color
- `var(--color-secondary)` - Secondary accent color
- `var(--color-text-primary)` - Main text color
- `var(--color-text-secondary)` - Muted text color
- `var(--mythos-primary)` - Mythology-specific primary
- `var(--mythos-secondary)` - Mythology-specific secondary
- `var(--mythos-gradient-start)` - Gradient start
- `var(--mythos-gradient-end)` - Gradient end

---

## JavaScript Utilities

### HTML Escaping

All user-generated content is escaped to prevent XSS:

```javascript
escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### Markdown Rendering

Basic markdown support with proper heading colors:

```javascript
renderMarkdown(markdown) {
    return markdown
        .replace(/^### (.*$)/gim, '<h3 style="color: var(--mythos-secondary);">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="color: var(--mythos-primary);">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}
```

---

## Display Options System

Related entities support multiple display modes:

### Grid Mode
```javascript
displayOptions: {
    relatedEntities: {
        mode: 'grid',
        columns: 4,
        showIcons: true,
        cardStyle: 'compact', // 'compact', 'detailed', 'minimal'
        sort: 'name'
    }
}
```

### List Mode
```javascript
displayOptions: {
    relatedEntities: {
        mode: 'list',
        compact: true,
        categorize: 'by_domain', // 'by_domain', 'by_mythology', 'alphabetical'
        showIcons: true
    }
}
```

### Table Mode
```javascript
displayOptions: {
    relatedEntities: {
        mode: 'table',
        columns: ['name', 'description', 'mythology'],
        sortable: true
    }
}
```

### Panel Mode
```javascript
displayOptions: {
    relatedEntities: {
        mode: 'panel',
        layout: 'accordion', // 'stacked', 'accordion'
        expandable: true,
        showAllDetails: true
    }
}
```

---

## Integration with Existing Systems

### Smart Links
Hero section titles and section headers include `data-smart` attributes for smart-links.js integration.

### Corpus Links
All entity names can be wrapped in `.corpus-link` for corpus search integration.

### Theme System
All colors use CSS custom properties from `theme-base.css` and `mythology-colors.css`.

### Firebase CRUD
Entity renderer integrates with the Firebase CRUD system, showing edit icons for user-owned entities.

---

## Testing Checklist

When adding new entity types or updating renderers:

1. ✅ **Hero section displays** with 4rem icon
2. ✅ **Responsive grid** collapses properly on mobile
3. ✅ **Smart anchor links** work correctly
4. ✅ **Mythology colors** apply via `data-mythology` attribute
5. ✅ **Citations render** with proper styling
6. ✅ **Sacred texts expand/collapse** correctly
7. ✅ **HTML is escaped** to prevent XSS
8. ✅ **Edit icons show** for user-owned content
9. ✅ **Related entities** respect display options
10. ✅ **Fallback content** shows when data is missing

---

## Examples

### Complete Deity Example (Firebase Data)

```javascript
{
    id: "zeus",
    type: "deity",
    mythology: "greek",
    name: "Zeus",
    subtitle: "King of the Gods, God of Sky and Thunder",
    description: "Supreme ruler of Mount Olympus and the Greek pantheon, Zeus commands the sky, hurls thunderbolts, and upholds cosmic justice.",
    icon: "⚡",

    domains: ["Sky", "Thunder", "Justice", "Law", "Hospitality"],
    titles: ["King of the Gods", "Father of Gods and Men", "Cloud-Gatherer"],
    symbols: ["Thunderbolt", "Eagle", "Oak", "Bull"],
    sacredAnimals: ["Eagle", "Bull"],
    sacredPlants: ["Oak"],
    sacredPlaces: ["Mount Olympus", "Olympia", "Dodona"],

    family: {
        parents: ["Kronos (Titan of Time)", "Rhea (Titaness)"],
        consorts: ["Hera (Queen of Olympus)", "Leto", "Maia", "Semele"],
        children: ["Athena", "Apollo", "Artemis", "Hermes", "Dionysus", "Perseus", "Heracles"],
        siblings: ["Hestia", "Demeter", "Hera", "Hades", "Poseidon"]
    },

    mythsAndLegends: [
        {
            title: "The Titanomachy",
            description: "Zeus led the Olympians in a ten-year war against the Titans, ultimately overthrowing his father Kronos and establishing the reign of the Olympian gods.",
            source: "Hesiod's Theogony"
        },
        {
            title: "The Gigantomachy",
            description: "Zeus and the Olympians battled the Giants, monstrous offspring of Gaia, defeating them with the help of Heracles.",
            source: "Apollodorus's Bibliotheca"
        }
    ],

    texts: [
        {
            source: "Homer's Iliad",
            section: "Book I",
            lines: "528-530",
            text: "The son of Kronos spoke, and bowed his dark brow in assent, and the ambrosial locks waved from the king's immortal head; and he made great Olympus quake.",
            reference: "Homer's Iliad, Book I (c. 750 BCE)"
        }
    ],

    worship: "Zeus received the grandest sacrifices: hecatombs of cattle and bulls, their fat and bones burned on altars while choice portions were consumed by worshippers in communal feasts.",

    cultCenters: [
        "Olympia - Site of the Olympic Games and statue by Phidias",
        "Dodona - Oracle site in Epirus",
        "Athens - Major temple and worship center"
    ],

    relatedEntities: [
        { name: "Hera", type: "deity", relationship: "Wife and Sister", icon: "👑", mythology: "greek" },
        { name: "Athena", type: "deity", relationship: "Daughter", icon: "🦉", mythology: "greek" },
        { name: "Poseidon", type: "deity", relationship: "Brother", icon: "🔱", mythology: "greek" }
    ],

    displayOptions: {
        relatedEntities: {
            mode: 'grid',
            columns: 4,
            showIcons: true,
            sort: 'name'
        }
    }
}
```

---

## Migration Notes

### From Static HTML to Firebase

When migrating historic entity pages to Firebase:

1. **Extract hero section** → `name`, `subtitle`, `description`, `icon`
2. **Parse attribute grids** → `domains`, `titles`, `symbols`, etc.
3. **Extract myth lists** → `mythsAndLegends` array
4. **Parse family sections** → `family` object
5. **Extract citations** → `texts` array with source/section/lines
6. **Identify relationships** → `relatedEntities` array
7. **Set display options** → `displayOptions` for related entities

### Preserving Custom Styling

If historic pages have custom sections not covered by the renderer:
- Store in `content` field as markdown
- Add custom sections via Firebase document structure
- Extend renderer with new section types as needed

---

## Performance Considerations

1. **Lazy loading:** Sacred texts sections start collapsed
2. **Efficient rendering:** Uses template literals and string concatenation
3. **Caching:** Page asset renderer caches loaded pages
4. **Minimal DOM manipulation:** Renders entire HTML string at once

---

## Future Enhancements

Potential improvements to the rendering system:

1. **Image galleries** for entity artifacts and depictions
2. **Interactive timelines** for mythological events
3. **Relationship diagrams** with D3.js or similar
4. **Audio pronunciations** for deity/creature names
5. **3D models** for sacred items and places
6. **Animated backgrounds** specific to each mythology
7. **Comparative views** showing parallel entities across mythologies

---

## Support & Troubleshooting

### Common Issues

**Issue:** Attributes not rendering
- **Check:** Ensure `entity.domains`, `entity.titles`, etc. are arrays
- **Fix:** Convert single values to arrays in Firebase

**Issue:** Sacred texts not expanding
- **Check:** Ensure `toggleCodexSearch()` and `toggleVerse()` functions are defined
- **Fix:** Renderer includes script tags with these functions

**Issue:** Hero icon too small
- **Check:** Ensure using `.hero-icon-display` class, not `.deity-icon`
- **Fix:** Renderer uses correct class with 4rem font size

**Issue:** Grid not responsive
- **Check:** Ensure `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`
- **Fix:** Renderer includes inline styles for grid

**Issue:** Colors not applying
- **Check:** Ensure container has `data-mythology` attribute
- **Fix:** Renderer applies mythology to container in `applyMythologyStyles()`

---

## Credits

**Design inspiration:** Historic entity pages (`zeus.html`, `mushussu.html`)
**Styling system:** `theme-base.css`, `mythology-colors.css`
**Component libraries:** `smart-links.js`, `corpus-links.css`

---

*Last updated: 2025-12-28*
*Version: 2.0*
