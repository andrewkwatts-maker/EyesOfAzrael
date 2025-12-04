# Entity Panel System - Implementation Guide

## Overview

The Eyes of Azrael Modular Entity System provides a unified way to represent and display items, places, deities, concepts, archetypes, and magic systems across all mythologies. This eliminates content duplication and creates rich cross-referencing capabilities.

## System Architecture

### Directory Structure

```
EyesOfAzrael/
├── data/
│   ├── schemas/
│   │   └── entity-schema.json          # Universal entity schema
│   └── entities/
│       ├── item/
│       │   ├── staff-of-moses.json
│       │   ├── mjolnir.json
│       │   └── ...
│       ├── place/
│       │   ├── burning-bush.json
│       │   ├── mount-olympus.json
│       │   └── ...
│       ├── deity/
│       ├── concept/
│       ├── archetype/
│       └── magic/
│
├── components/
│   └── panels/
│       ├── entity-panel.js             # Main component
│       └── panels.css                  # Styling
│
├── shared/                              # Unified browsers
│   ├── items/
│   │   ├── index.html
│   │   └── search.html
│   ├── places/
│   │   ├── index.html
│   │   └── search.html
│   ├── archetypes/
│   └── concepts/
│
└── mythos/                              # Mythology-specific pages
    ├── greek/
    │   ├── items/
    │   ├── places/
    │   └── ...
    ├── jewish/
    ├── norse/
    └── ...
```

## Core Concepts

### 1. Entity Types

- **Item**: Physical objects (herbs, artifacts, weapons, tools)
- **Place**: Locations (realms, temples, mountains, sacred sites)
- **Deity**: Gods, goddesses, divine beings
- **Concept**: Abstract principles (justice, fate, chaos)
- **Archetype**: Universal patterns (hero's journey, trickster)
- **Magic**: Magical systems and practices

### 2. Entity Data Structure

Every entity is defined in a JSON file with:

```json
{
  "id": "unique-kebab-case-id",
  "type": "item|place|deity|concept|archetype|magic",
  "name": "Display Name",
  "icon": "🪄",
  "mythologies": ["greek", "norse", ...],
  "primaryMythology": "jewish",
  "shortDescription": "One sentence (max 200 chars)",
  "fullDescription": "Complete description (markdown)",
  "metaphysicalProperties": {
    "element": "fire|water|earth|air|aether|void",
    "energyType": "divine|elemental|psychic|vital",
    "chakra": "root|sacral|solar-plexus|heart|throat|third-eye|crown",
    "planet": "sun|moon|mercury|venus|mars|jupiter|saturn",
    "sefirot": ["keter", "chokmah", ...],
    "world": "atziluth|beriah|yetzirah|assiah"
  },
  "mythologyContexts": [
    {
      "mythology": "jewish",
      "usage": "How this entity is used in this tradition",
      "associatedDeities": [...],
      "rituals": [...],
      "textReferences": [...],
      "symbolism": "...",
      "culturalSignificance": "..."
    }
  ],
  "relatedEntities": {
    "deities": [...],
    "items": [...],
    "places": [...],
    "concepts": [...],
    "archetypes": [...]
  },
  "sources": [...]
}
```

### 3. Display Modes

The Entity Panel component supports three display modes:

#### Mini (Inline)
```html
<span data-entity-panel
      data-entity-id="staff-of-moses"
      data-entity-type="item"
      data-display-mode="mini"></span>
```

Use for: Inline text references, tooltips

#### Compact (Card)
```html
<div data-entity-panel
     data-entity-id="staff-of-moses"
     data-entity-type="item"
     data-display-mode="compact"></div>
```

Use for: Lists, sidebars, related items sections

#### Full (Detailed)
```html
<div data-entity-panel
     data-entity-id="staff-of-moses"
     data-entity-type="item"
     data-display-mode="full"
     data-mythology="jewish"></div>
```

Use for: Dedicated entity pages, main content areas

## Implementation Workflow

### Phase 1: Entity Inventory

1. **Audit existing content** across all mythologies
2. **Identify entities** that appear in multiple traditions
3. **Create master inventory** spreadsheet with:
   - Entity name
   - Type
   - Mythologies where it appears
   - Current file locations
   - Priority (high/medium/low)

**Tools:**
```bash
# Find all items across mythologies
find mythos -type f -path "*/items/*.html" | grep -v index

# Find all places
find mythos -type f -path "*/places/*.html" | grep -v index

# Find all herbs (common across traditions)
find mythos -type f -path "*/herbs/*.html" | grep -v index
```

### Phase 2: JSON Data Creation

For each entity:

1. **Create JSON file** in `/data/entities/{type}/{id}.json`
2. **Extract information** from existing pages
3. **Map relationships** to other entities
4. **Add metaphysical properties** where applicable
5. **Include all mythology contexts**
6. **Cite ancient sources**

**Template Script:**
```javascript
// create-entity.js
const fs = require('fs');

function createEntity(data) {
  const path = `data/entities/${data.type}/${data.id}.json`;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`Created: ${path}`);
}

// Example usage
createEntity({
  id: 'frankincense',
  type: 'item',
  name: 'Frankincense',
  category: 'incense',
  mythologies: ['jewish', 'egyptian', 'greek', 'christian'],
  // ... rest of data
});
```

### Phase 3: Page Integration

Three strategies based on entity scope:

#### Strategy A: Universal Entities (appear in 3+ mythologies)

**Examples:** Frankincense, Myrrh, Underworld concept

1. **Create primary page** in `/shared/{type}/data/{category}/{id}.html`
2. **Use full entity panel** on primary page
3. **Create stub pages** in each mythology with context
4. **Link to primary page** from mythology stubs

**Example - Frankincense:**

`/shared/items/data/incense/frankincense.html`:
```html
<div data-entity-panel
     data-entity-id="frankincense"
     data-entity-type="item"
     data-display-mode="full"></div>
```

`/mythos/jewish/items/frankincense.html`:
```html
<section class="hero-section">
  <h1>Frankincense in Jewish Tradition</h1>
</section>

<section class="glass-card">
  <p>Frankincense (Hebrew: לְבֹנָה levonah) was a key component of the
  Temple incense offering (Ketoret)...</p>

  <a href="/shared/items/data/incense/frankincense.html" class="btn-primary">
    View Complete Frankincense Information →
  </a>
</section>

<!-- Show just Jewish context -->
<div data-entity-panel
     data-entity-id="frankincense"
     data-entity-type="item"
     data-display-mode="compact"
     data-mythology="jewish"></div>
```

#### Strategy B: Mythology-Specific Entities

**Examples:** Staff of Moses, Mjolnir, Golden Fleece

1. **Keep file** in mythology folder: `/mythos/{mythology}/items/{id}.html`
2. **Create JSON** data file for cross-referencing
3. **Use compact panels** when referenced from other pages

**Example - Staff of Moses:**

Keep: `/mythos/jewish/items/staff.html`

Create: `/data/entities/item/staff-of-moses.json`

Reference from Moses' page:
```html
<h3>Associated Items</h3>
<div data-entity-panel
     data-entity-id="staff-of-moses"
     data-entity-type="item"
     data-display-mode="compact"></div>
```

#### Strategy C: Archetype Collections

**Examples:** "Magical Staffs", "Underworld Journeys", "Trickster Gods"

1. **Create archetype page** in `/shared/archetypes/{id}.html`
2. **List all examples** across mythologies using compact panels
3. **Provide pattern analysis**

**Example - Magical Staffs:**

`/shared/archetypes/magical-staff.html`:
```html
<section class="hero-section">
  <h1>🪄 The Magical Staff Archetype</h1>
  <p>Divine instruments of power appearing across all mythologies...</p>
</section>

<section class="glass-card">
  <h2>Examples Across Mythologies</h2>

  <h3>Jewish Tradition</h3>
  <div data-entity-panel
       data-entity-id="staff-of-moses"
       data-entity-type="item"
       data-display-mode="compact"></div>

  <h3>Greek Tradition</h3>
  <div data-entity-panel
       data-entity-id="caduceus"
       data-entity-type="item"
       data-display-mode="compact"></div>

  <h3>Norse Tradition</h3>
  <div data-entity-panel
       data-entity-id="gungnir"
       data-entity-type="item"
       data-display-mode="compact"></div>
</section>
```

### Phase 4: Index Pages

Create unified browsers:

**Items Browser** (`/shared/items/index.html`):
```html
<section class="filter-controls">
  <select id="mythology-filter">
    <option value="all">All Mythologies</option>
    <option value="greek">Greek</option>
    <option value="jewish">Jewish</option>
    <!-- ... -->
  </select>

  <select id="category-filter">
    <option value="all">All Categories</option>
    <option value="herb">Herbs</option>
    <option value="artifact">Artifacts</option>
    <option value="weapon">Weapons</option>
    <!-- ... -->
  </select>
</section>

<section id="items-grid" class="entity-grid">
  <!-- Dynamically populated with entity panels -->
</section>

<script>
  // Load all items and filter
  fetch('/data/entities/item/index.json')
    .then(r => r.json())
    .then(items => renderItems(items));
</script>
```

### Phase 5: Testing & Validation

1. **Link validation**
   ```bash
   node validate-entity-links.js
   ```

2. **Schema validation**
   ```bash
   node validate-entity-schemas.js
   ```

3. **Cross-reference validation**
   ```bash
   node validate-cross-references.js
   ```

4. **Visual testing**
   - Test all three display modes
   - Test theme picker compatibility
   - Test mobile responsiveness
   - Test with long/short content

## Migration Priority

### High Priority (Complete First)

**Items:**
- [ ] Sacred herbs (frankincense, myrrh, mugwort, lotus, etc.)
- [ ] Divine weapons (Mjolnir, Staff of Moses, Vajra, etc.)
- [ ] Sacred artifacts (Ark of Covenant, Golden Fleece, etc.)

**Places:**
- [ ] Underworld variations (Hades, Sheol, Helheim, Duat, etc.)
- [ ] Sacred mountains (Olympus, Sinai, Kailash, etc.)
- [ ] Temples and shrines

**Concepts:**
- [ ] Universal concepts (Justice, Fate, Chaos, Order)
- [ ] Cross-cultural parallels

### Medium Priority

**Archetypes:**
- [ ] Hero's Journey examples
- [ ] Trickster figures
- [ ] Great Mother manifestations
- [ ] Dragon slayers

**Magic Systems:**
- [ ] Divination methods
- [ ] Invocation practices
- [ ] Transformation rituals

### Low Priority

**Creatures:**
- [ ] Dragons across cultures
- [ ] Divine messengers
- [ ] Underworld guardians

## Maintenance

### Adding New Entities

1. Create JSON file following schema
2. Add entry to `/data/entities/{type}/index.json`
3. Create primary page (if universal) or mythology page
4. Update related entities to reference new entity
5. Run validation scripts

### Updating Entities

1. Edit JSON file
2. Changes automatically propagate to all panels
3. No need to update individual pages

### Archiving Entities

1. Move JSON to `/data/entities/archived/`
2. Update index files
3. Leave redirect on old pages if necessary

## Best Practices

### Naming Conventions

- **IDs:** `kebab-case` (e.g., `staff-of-moses`)
- **Files:** Match ID exactly (e.g., `staff-of-moses.json`)
- **Names:** Proper capitalization (e.g., "Staff of Moses")

### Relationship Mapping

- Always map bidirectional relationships
- If Item A references Deity B, ensure Deity B references Item A
- Use consistent entity reference format:
  ```json
  {
    "id": "moses",
    "name": "Moses",
    "type": "hero",
    "mythology": "jewish",
    "icon": "👨‍🦳",
    "url": "/mythos/jewish/heroes/moses.html"
  }
  ```

### Mythology Contexts

- Provide unique context for each mythology
- Don't duplicate shared information across contexts
- Focus on tradition-specific usage, symbolism, and significance

### Ancient Sources

- Always cite primary sources
- Link to corpus search where possible
- Format consistently:
  ```json
  {
    "text": "Torah",
    "author": "Moses (traditional)",
    "passage": "Exodus 4:2-5",
    "mythology": "jewish",
    "corpusUrl": "/corpus-search.html?term=exodus+4"
  }
  ```

## Troubleshooting

### Panel not loading

1. Check browser console for errors
2. Verify JSON file exists at correct path
3. Validate JSON syntax
4. Ensure entity-panel.js is loaded

### Styles not applying

1. Verify panels.css is imported
2. Check theme-base.css is loaded first
3. Clear browser cache
4. Check for CSS conflicts

### Cross-references broken

1. Run validation script
2. Check entity IDs match exactly
3. Verify URL paths are correct
4. Ensure bidirectional relationships

## Examples

See `/test-entity-panel.html` for complete working examples of:
- All three display modes
- JavaScript API usage
- Integration patterns
- Real-world use cases

## Technical Support

- **Schema:** `/data/schemas/entity-schema.json`
- **Component:** `/components/panels/entity-panel.js`
- **Styles:** `/components/panels/panels.css`
- **Test Page:** `/test-entity-panel.html`

## Next Steps

1. ✅ Core system complete
2. ⏳ Begin entity inventory
3. ⏳ Create JSON data files
4. ⏳ Integrate with existing pages
5. ⏳ Build unified browsers
6. ⏳ Validation and testing

---

**System Status:** ✅ Ready for Production

**Last Updated:** December 4, 2025
