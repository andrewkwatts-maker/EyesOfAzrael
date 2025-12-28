# Asset Rendering System - Complete Support Matrix

## Overview

This document provides a comprehensive summary of the asset rendering capabilities across all entity types and rendering modes in the Eyes of Azrael mythology database.

**Test Page:** `test-asset-rendering.html`

## Rendering Modes

The system supports **5 distinct rendering modes** for maximum flexibility:

### 1. **PAGE Mode**
- **Purpose:** Full detailed entity page
- **Features:**
  - Hero section with large icon
  - Complete attribute display
  - Mythology and stories
  - Relationships and family
  - Worship and sacred sites
  - Primary source citations
  - Related entities grid
- **Renderer:** `renderDeity()`, `renderHero()`, `renderCreature()`, `renderGenericEntity()`
- **Use Case:** Dedicated entity pages

### 2. **PANEL Mode**
- **Purpose:** Grid card display
- **Features:**
  - Compact card format
  - Icon display
  - Name and title
  - Brief description
  - Hover effects
- **Renderer:** `renderRelatedEntitiesGrid()`
- **Use Case:** Index pages, browse galleries, related entities

### 3. **SECTION Mode**
- **Purpose:** Embedded content within another page
- **Features:**
  - Glass card styling
  - Key attributes
  - Contextual information
  - Mythology-specific colors
- **Renderer:** Custom section rendering
- **Use Case:** Related content, embedded references, comparative displays

### 4. **LINK Mode**
- **Purpose:** Cross-reference navigation
- **Features:**
  - Corpus link styling
  - Tooltip information
  - Smart linking
  - Mythology-aware
- **Class:** `.corpus-link`
- **Use Case:** Cross-references, navigation, text links

### 5. **PARAGRAPH Mode**
- **Purpose:** Inline text mention
- **Features:**
  - Inline styling
  - Highlighted mention
  - Maintains text flow
- **Class:** `.inline-mention`
- **Use Case:** Narrative text, flowing content, natural mentions

---

## Complete Support Matrix

| Asset Type | PAGE | PANEL | SECTION | LINK | PARAGRAPH | Firebase Collection |
|-----------|------|-------|---------|------|-----------|-------------------|
| **Deities** | ✓ | ✓ | ✓ | ✓ | ✓ | `deities` |
| **Heroes** | ✓ | ✓ | ✓ | ✓ | ✓ | `heroes` |
| **Creatures** | ✓ | ✓ | ✓ | ✓ | ✓ | `creatures` |
| **Items** | ✓ | ✓ | ✓ | ✓ | ✓ | `items` |
| **Places** | ✓ | ✓ | ✓ | ✓ | ✓ | `places` |
| **Herbs** | ✓ | ✓ | ✓ | ✓ | ✓ | `herbs` |
| **Rituals** | ✓ | ✓ | ✓ | ✓ | ✓ | `rituals` |
| **Texts** | ✓ | ✓ | ✓ | ✓ | ✓ | `texts` |
| **Symbols** | ✓ | ✓ | ✓ | ✓ | ✓ | `symbols` |
| **Magic Systems** | ✓ | ✓ | ✓ | ✓ | ✓ | `magic` |
| **Mythologies** | ✓ | ✓ | ✓ | ✓ | ✓ | `mythologies` |
| **Archetypes** | ✓ | ✓ | ✓ | ✓ | ✓ | `archetypes` |
| **Custom Pages** | ✓ | ✓ | ✓ | ✓ | ✓ | `pages` |

**Total:** 13 asset types × 5 rendering modes = **65 rendering combinations** - ALL SUPPORTED ✓

---

## Asset Type Details

### Deities
- **Renderer:** `renderDeity(entity, container)`
- **Special Features:**
  - Family relationships
  - Cult centers
  - Sacred animals/plants
  - Myths and legends
  - Worship practices
- **Example:** Zeus, Odin, Ra, Shiva

### Heroes
- **Renderer:** `renderHero(entity, container)`
- **Special Features:**
  - Heroic deeds
  - Quests and accomplishments
  - Weapons and artifacts
  - Lineage
- **Example:** Achilles, Gilgamesh, Rama

### Creatures
- **Renderer:** `renderCreature(entity, container)`
- **Special Features:**
  - Physical characteristics
  - Powers and abilities
  - Habitat
  - Associated myths
- **Example:** Medusa, Dragon, Phoenix

### Items
- **Renderer:** `renderGenericEntity(entity, container)`
- **Special Features:**
  - Creator/origin
  - Powers and properties
  - Associated deities
  - Legendary history
- **Example:** Mjolnir, Excalibur, Thunderbolt

### Places
- **Renderer:** `renderGenericEntity(entity, container)`
- **Special Features:**
  - Location type
  - Inhabitants
  - Significance
  - Associated myths
- **Example:** Mount Olympus, Valhalla, Elysium

### Herbs
- **Renderer:** `renderGenericEntity(entity, container)`
- **Special Features:**
  - Properties
  - Uses (medicinal, ritual, magical)
  - Associated deities
  - Preparation methods
- **Example:** Laurel, Soma, Mistletoe

### Rituals
- **Renderer:** `renderGenericEntity(entity, container)`
- **Special Features:**
  - Ceremony details
  - Participants
  - Sacred objects
  - Timing/calendar
- **Example:** Eleusinian Mysteries, Blót

### Texts
- **Renderer:** `renderGenericEntity(entity, container)`
- **Special Features:**
  - Author
  - Time period
  - Language
  - Key themes
  - Excerpts
- **Example:** Iliad, Bhagavad Gita, Poetic Edda

### Symbols
- **Renderer:** `renderGenericEntity(entity, container)`
- **Special Features:**
  - Meaning/symbolism
  - Associated entities
  - Cultural significance
  - Variations
- **Example:** Ankh, Mjolnir, Ouroboros

### Magic Systems
- **Renderer:** `renderMagicSystem(entity, container)`
- **Special Features:**
  - Practice type
  - Practitioners
  - Methods
  - Cultural context
- **Example:** Runes, Heka, Tantra

### Mythologies
- **Renderer:** `renderGenericEntity(entity, container)`
- **Special Features:**
  - Geographic region
  - Time period
  - Major deities
  - Primary texts
  - Worldview
- **Example:** Greek, Norse, Egyptian, Hindu

### Archetypes
- **Renderer:** `renderGenericEntity(entity, container)`
- **Special Features:**
  - Universal patterns
  - Cross-cultural examples
  - Psychological aspects
  - Comparative analysis
- **Example:** Trickster, Great Mother, Hero's Journey

### Custom Pages
- **Renderer:** `renderGenericEntity(entity, container)`
- **Special Features:**
  - Flexible content structure
  - User-generated
  - Thematic collections
  - Educational content
- **Example:** Comparative studies, themed collections

---

## Unified JSON Schema

All asset types follow a unified schema structure:

```json
{
  "id": "unique-identifier",
  "type": "deity|hero|creature|item|place|herb|ritual|text|symbol|magic|mythology|archetype|page",
  "name": "Display Name",
  "mythology": "greek|norse|egyptian|hindu|etc",
  "icon": "🔮",
  "subtitle": "Brief descriptor",
  "description": "Full description",

  "domains": ["array", "of", "domains"],
  "symbols": ["array", "of", "symbols"],
  "attributes": { "key": "value" },

  "relatedEntities": [
    {
      "id": "related-id",
      "name": "Related Name",
      "type": "deity",
      "relationship": "parent|child|consort|enemy|etc",
      "icon": "⚡"
    }
  ],

  "displayOptions": {
    "relatedEntities": {
      "mode": "grid|list|table|panel",
      "columns": 4,
      "sort": "name|importance|custom",
      "showIcons": true
    }
  },

  "content": "Markdown content...",
  "texts": [],
  "sources": ["citation1", "citation2"],

  "importance": 100,
  "createdBy": "user-id",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## Display Options System

The system supports flexible display configurations for related entities:

### Grid Mode
```javascript
{
  "mode": "grid",
  "columns": 4,
  "cardStyle": "compact|detailed|minimal",
  "showIcons": true,
  "sort": "name"
}
```

### List Mode
```javascript
{
  "mode": "list",
  "compact": true,
  "showIcons": true,
  "categorize": "none|by_domain|by_mythology|alphabetical"
}
```

### Table Mode
```javascript
{
  "mode": "table",
  "columns": ["name", "description", "mythology"],
  "sortable": true
}
```

### Panel Mode
```javascript
{
  "mode": "panel",
  "showAllDetails": true,
  "expandable": true,
  "layout": "stacked|accordion"
}
```

---

## Styling System

### Mythology-Specific Colors

Each mythology has custom CSS variables:

```css
[data-mythology="greek"] {
    --mythos-primary: #1e90ff;
    --mythos-secondary: #ffd700;
}

[data-mythology="norse"] {
    --mythos-primary: #4a90e2;
    --mythos-secondary: #e8b339;
}

[data-mythology="egyptian"] {
    --mythos-primary: #d4af37;
    --mythos-secondary: #4a7c7e;
}

[data-mythology="hindu"] {
    --mythos-primary: #ff6b35;
    --mythos-secondary: #ffd23f;
}
```

### Component Classes

- `.hero-section` - Hero display area
- `.attribute-grid` - Grid of attributes
- `.subsection-card` - Individual attribute card
- `.glass-card` - Translucent card background
- `.entity-card` - Panel mode card
- `.corpus-link` - Cross-reference link
- `.inline-mention` - Paragraph mention

---

## Implementation Examples

### Example 1: Rendering a Deity Page

```javascript
const renderer = new FirebaseEntityRenderer();
await renderer.loadAndRender('deity', 'zeus', 'greek', container);
```

### Example 2: Grid of Heroes

```javascript
const heroes = await fetchHeroes();
const html = renderRelatedEntitiesGrid(heroes, {
  mode: 'grid',
  columns: 3,
  showIcons: true
});
```

### Example 3: Inline Link

```html
<a class="corpus-link"
   href="mythos/greek/deities/zeus.html"
   title="View Zeus deity page">Zeus</a>
```

### Example 4: Paragraph Mention

```html
<p>The king of the gods, <span class="inline-mention">Zeus</span>, ruled from Olympus.</p>
```

---

## Testing

**Test Page:** `/test-asset-rendering.html`

The test page demonstrates:
- All 13 asset types
- All 5 rendering modes
- Visual examples
- HTML code snippets
- JSON data structures
- Success indicators

### Running Tests

1. Open `test-asset-rendering.html` in browser
2. Use tab navigation to switch between asset types
3. Review each rendering mode
4. Copy code snippets as needed
5. Verify support matrix

---

## Success Metrics

✓ **13 Asset Types** fully implemented
✓ **5 Rendering Modes** for each type
✓ **65 Total Combinations** all supported
✓ **Unified Schema** for consistency
✓ **Mythology-Specific Styling** preserved
✓ **Display Options** for customization
✓ **Firebase Integration** complete
✓ **Responsive Design** across devices

---

## Future Enhancements

### Planned Features
- Dynamic mode switching on live pages
- User preference for default display mode
- Advanced filtering in grid/list modes
- Customizable card layouts
- Export to different formats
- Comparison view mode

### Potential New Modes
- **TIMELINE:** Chronological display
- **MAP:** Geographic visualization
- **GRAPH:** Relationship network
- **COMPARISON:** Side-by-side analysis

---

## Conclusion

The Eyes of Azrael rendering system provides **complete, flexible rendering support** for all asset types across all display contexts. The unified schema ensures consistency while allowing for type-specific customizations, and the mythology-specific styling preserves the rich visual identity of each tradition.

**Bottom Line:** Every asset type can be rendered in every mode, providing maximum flexibility for content creators and users.

---

**Document Version:** 1.0
**Last Updated:** 2025-12-28
**Test Page:** `test-asset-rendering.html`
**Related Docs:** `FIREBASE_UNIFIED_SCHEMA.md`, `DISPLAY_OPTIONS_SYSTEM_REPORT.md`
