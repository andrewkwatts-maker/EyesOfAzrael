# Entity Auto-Population System

## Overview

The Entity Auto-Population System enables existing mythology pages to dynamically load and display entity panels based on metadata, eliminating the need for manual HTML coding of each entity. This system provides:

- **Automatic entity discovery** from JSON metadata
- **Dynamic panel generation** with multiple display modes
- **Advanced filtering** by mythology, category, archetype, and more
- **Cross-mythology exploration** through universal archetypes
- **Centralized maintenance** - update once, reflect everywhere

## System Architecture

### Components

1. **Index Generator** (`scripts/generate-entity-indices.js`)
   - Scans all entity JSON files
   - Creates searchable indices organized by various dimensions
   - Generates metadata for quick lookups

2. **Auto-Populate System** (`components/auto-populate.js`)
   - Loads entity indices
   - Filters entities based on page configuration
   - Dynamically renders entity panels

3. **Archetype Filter** (`components/archetype-filter.js`)
   - Advanced filtering interface
   - Cross-mythology archetype exploration
   - Multi-dimensional search capabilities

4. **Entity Panel** (`components/panels/entity-panel.js`)
   - Existing component that renders individual entities
   - Works seamlessly with auto-populate system

### Data Flow

```
Entity JSON Files
       ↓
Generate Indices (Node.js script)
       ↓
Index JSON Files (/data/indices/)
       ↓
Auto-Populate System (Browser)
       ↓
Entity Panels (Rendered on Page)
```

## Generated Indices

The system generates the following index files in `/data/indices/`:

### 1. `all-entities.json`
Complete list of all entities with summary information:
```json
[
  {
    "id": "staff-of-moses",
    "type": "item",
    "name": "Staff of Moses",
    "icon": "🪄",
    "mythologies": ["jewish"],
    "category": "artifact",
    "shortDescription": "...",
    "element": "water",
    "sefirot": ["gevurah", "chesed", "tiferet"],
    "archetypes": [
      {"category": "magical-weapon", "score": 85}
    ],
    "jsonPath": "/data/entities/item/staff-of-moses.json"
  }
]
```

### 2. `by-mythology.json`
Entities organized by mythology:
```json
{
  "greek": {
    "items": [...],
    "places": [...],
    "deities": [...]
  },
  "norse": { ... },
  "jewish": { ... }
}
```

### 3. `by-category.json`
Entities grouped by category:
```json
{
  "artifact": [...],
  "herb": [...],
  "weapon": [...]
}
```

### 4. `by-archetype.json`
Entities organized by universal archetypes:
```json
{
  "hero-journey": [...],
  "magical-weapon": [...],
  "sacred-mountain": [...]
}
```

### 5. `by-element.json`
Entities grouped by elemental correspondence:
```json
{
  "fire": [...],
  "water": [...],
  "earth": [...]
}
```

### 6. `by-sefirot.json`
Entities organized by Kabbalistic Sefirot:
```json
{
  "keter": [...],
  "chokmah": [...],
  "binah": [...]
}
```

### 7. `metadata.json`
System statistics and breakdown:
```json
{
  "generated": "2025-12-04T...",
  "totalEntities": 163,
  "breakdown": {
    "byType": { "item": 65, "place": 55, ... },
    "byMythology": { "greek": 33, "norse": 26, ... }
  }
}
```

## Usage Guide

### Generating Indices

Run the index generator whenever you add or modify entity JSON files:

```bash
cd /path/to/EyesOfAzrael
node scripts/generate-entity-indices.js
```

The script will:
- Scan all entity files
- Process metadata and generate indices
- Save output to `/data/indices/`
- Display summary statistics

**When to regenerate:**
- After adding new entity JSON files
- After modifying entity metadata
- After changing entity categorization
- Before deploying updates to production

### Auto-Populating Pages

Add the auto-populate system to any HTML page:

#### 1. Include Required Scripts

```html
<!-- Entity Panel Component -->
<script defer src="/components/panels/entity-panel.js"></script>

<!-- Auto-Populate System -->
<script defer src="/components/auto-populate.js"></script>
```

#### 2. Create Container with Data Attributes

```html
<div data-auto-populate
     data-mythology="greek"
     data-category="artifact"
     data-display-mode="compact"></div>
```

#### 3. Configure Filters

Available data attributes:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-mythology` | Filter by mythology | `"greek"`, `"norse"`, `"jewish"` |
| `data-category` | Filter by category | `"artifact"`, `"herb"`, `"weapon"` |
| `data-sub-category` | Filter by subcategory | `"divine-weapon"`, `"temple-vessel"` |
| `data-type` | Filter by entity type | `"item"`, `"place"`, `"deity"` |
| `data-archetype` | Filter by archetype | `"hero-journey"`, `"magical-weapon"` |
| `data-element` | Filter by element | `"fire"`, `"water"`, `"earth"` |
| `data-sefirot` | Filter by Sefirah | `"chesed"`, `"gevurah"`, `"tiferet"` |
| `data-tags` | Filter by tags (comma-separated) | `"divine,power,miracle"` |
| `data-display-mode` | Display format | `"mini"`, `"compact"`, `"full"` |
| `data-limit` | Maximum entities to show | `"10"`, `"20"` |
| `data-sort-by` | Sort order | `"name"`, `"category"`, `"random"` |
| `data-show-count` | Show entity count | `"true"`, `"false"` |
| `data-grid-columns` | Custom grid size | `"280px"`, `"350px"` |

### Examples

#### Example 1: All Items from Greek Mythology

```html
<h2>Greek Sacred Items</h2>
<div data-auto-populate
     data-mythology="greek"
     data-type="item"
     data-display-mode="compact"
     data-sort-by="name"></div>

<script defer src="/components/panels/entity-panel.js"></script>
<script defer src="/components/auto-populate.js"></script>
```

#### Example 2: Divine Weapons Across All Mythologies

```html
<h2>Divine Weapons</h2>
<div data-auto-populate
     data-sub-category="divine-weapon"
     data-display-mode="compact"
     data-limit="12"></div>
```

#### Example 3: Fire Element Entities

```html
<h2>Fire-Aligned Sacred Objects</h2>
<div data-auto-populate
     data-element="fire"
     data-type="item"
     data-display-mode="compact"></div>
```

#### Example 4: Hero's Journey Archetype

```html
<h2>Hero's Journey Across Mythologies</h2>
<div data-auto-populate
     data-archetype="hero-journey"
     data-display-mode="compact"
     data-sort-by="mythology"></div>
```

#### Example 5: Temple Vessels from Jewish Tradition

```html
<h2>Temple & Ritual Items</h2>
<div data-auto-populate
     data-mythology="jewish"
     data-sub-category="temple-vessel"
     data-display-mode="compact"></div>
```

### Archetype Filter System

For advanced cross-mythology exploration, use the Archetype Filter:

#### 1. Include Required Scripts

```html
<script defer src="/components/panels/entity-panel.js"></script>
<script defer src="/components/archetype-filter.js"></script>
```

#### 2. Create Container

```html
<div id="archetype-filter-container"></div>
```

#### 3. Initialize Filter

```html
<script>
  const filter = new ArchetypeFilter('archetype-filter-container');
  filter.init();
</script>
```

The Archetype Filter provides:
- **Archetype selection** - Choose from universal patterns
- **Score threshold** - Filter by archetype strength (0-100%)
- **Mythology filter** - Limit to specific traditions
- **Type filter** - Filter by entity type
- **Element filter** - Filter by elemental correspondence
- **Search** - Text search across names and descriptions

## Display Modes

The system supports three display modes:

### 1. Mini Mode (`data-display-mode="mini"`)
- Compact inline display
- Icon + Name + Mythology badges
- Perfect for lists and sidebars

### 2. Compact Mode (`data-display-mode="compact"`)
- Card-based display
- Icon, name, short description
- Mythology context (if applicable)
- "View Details" and "Expand" buttons
- **Default mode**

### 3. Full Mode (`data-display-mode="full"`)
- Complete entity information
- Hero section with gradient background
- Full description
- Type-specific properties
- Metaphysical properties
- Mythology contexts
- Related entities
- Ancient sources

## Styling

The system includes default styles, but you can customize with these CSS classes:

```css
/* Auto-populate container */
.entity-auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Entity count display */
.auto-populate-count {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

/* Empty state */
.auto-populate-empty {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

/* Error state */
.auto-populate-error {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 0, 0, 0.1);
  border: 2px solid rgba(255, 0, 0, 0.3);
}

/* Archetype score badge */
.archetype-score-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  font-weight: bold;
}
```

## Archetype System

### Universal Archetypes

The system recognizes these universal archetypes:

1. **Hero's Journey** - Transformation through trials
2. **Trickster** - Cunning, deception, boundary-crossing
3. **Magical Weapon** - Divine instruments of power
4. **Sacred Mountain** - Axis mundi, cosmic center
5. **Underworld Journey** - Descent and rebirth
6. **Great Mother** - Feminine creative principle
7. **Dragon Slayer** - Conquering chaos
8. **World Tree** - Cosmic axis
9. **Divine Child** - Miraculous birth
10. **Wise Old Man** - Mentor and sage

### Archetype Scoring

Entities receive archetype scores (0-100%) based on:
- **Explicit classification** - Entity type is "archetype"
- **Related archetypes** - Listed in entity metadata
- **Tag inference** - Keywords in tags matching archetype patterns

**Score Ranges:**
- **90-100%**: Perfect exemplar (e.g., Mjolnir for "Magical Weapon")
- **70-89%**: Strong alignment (clearly embodies archetype)
- **50-69%**: Moderate presence (some archetype qualities)
- **Below 50%**: Weak connection (tangential relationship)

## Performance Considerations

### Index File Sizes

Current index sizes (163 entities):
- `all-entities.json`: ~150 KB
- `by-mythology.json`: ~160 KB
- `by-category.json`: ~155 KB
- `by-archetype.json`: ~120 KB
- Total: ~600 KB

### Loading Strategy

The auto-populate system:
1. Loads indices once on page load
2. Caches in memory for instant filtering
3. Lazy-loads individual entity data via EntityPanel component
4. Renders panels progressively to avoid blocking

### Optimization Tips

1. **Use specific filters** - Narrow results for faster rendering
2. **Set limits** - Use `data-limit` for large datasets
3. **Choose appropriate display mode** - "mini" renders fastest
4. **Consider lazy loading** - Load indices on user interaction for large pages

## Troubleshooting

### Entities Not Appearing

1. **Check indices are generated**
   - Run `node scripts/generate-entity-indices.js`
   - Verify files exist in `/data/indices/`

2. **Verify filter criteria**
   - Check data attributes match entity metadata
   - Try removing filters to see all entities

3. **Check browser console**
   - Look for fetch errors or JavaScript errors
   - Verify script paths are correct

### Incorrect Filtering

1. **Regenerate indices**
   - Entity metadata may have changed
   - Run index generator again

2. **Check entity JSON**
   - Verify mythology, category, tags are correct
   - Ensure proper array/string formats

3. **Verify attribute values**
   - Values are case-sensitive
   - Use exact values from entity JSON

### Display Issues

1. **Check EntityPanel script**
   - Ensure `/components/panels/entity-panel.js` is loaded
   - Verify no JavaScript errors

2. **Verify CSS**
   - Ensure theme CSS is loaded
   - Check for conflicting styles

3. **Test display mode**
   - Try different modes: "mini", "compact", "full"
   - Check if issue is mode-specific

## Future Enhancements

### Planned Features

1. **Real-time filtering** - Update without page reload
2. **Infinite scroll** - Load more entities as user scrolls
3. **Comparison mode** - Side-by-side entity comparison
4. **Export functionality** - Export filtered results as JSON/CSV
5. **Advanced sorting** - Multiple sort criteria
6. **Visual clustering** - Group related entities visually
7. **Timeline view** - Display entities chronologically
8. **Network graph** - Show entity relationships visually

### Integration Opportunities

1. **Search enhancement** - Integrate with corpus search
2. **Recommendation system** - "You might also like..."
3. **User collections** - Save favorite entities
4. **Annotation system** - User notes on entities
5. **API endpoint** - RESTful API for external access

## Best Practices

### For Content Creators

1. **Maintain consistent metadata**
   - Use standard mythology names
   - Apply consistent categories
   - Add relevant tags

2. **Assign archetypes thoughtfully**
   - Consider universal patterns
   - Use related entities section
   - Tag appropriately

3. **Regenerate indices regularly**
   - After batch entity updates
   - Before major content pushes
   - When adding new mythologies

### For Developers

1. **Test filter combinations**
   - Verify edge cases
   - Check empty results
   - Test limit boundaries

2. **Monitor performance**
   - Track index file sizes
   - Optimize large result sets
   - Consider pagination

3. **Maintain backwards compatibility**
   - Don't break existing data attributes
   - Deprecate gracefully
   - Document changes

## Examples Repository

See these pages for working examples:

- `/mythos/jewish/items/index.html` - Auto-populated items page
- `/archetypes/explorer.html` - Full archetype filter system
- `/mythos/greek/places/index.html` - Greek places (to be created)
- `/shared/archetypes/hero-journey.html` - Single archetype focus

## Support

For issues, questions, or suggestions:

1. Check this documentation first
2. Review entity JSON structure
3. Test with minimal configuration
4. Check browser console for errors
5. Verify all scripts are loaded correctly

## Version History

### v1.0.0 (Current)
- Initial release
- Index generator
- Auto-populate system
- Archetype filter
- Basic styling
- Documentation

---

**Last Updated:** December 4, 2025
**Maintained By:** EyesOfAzrael Development Team
