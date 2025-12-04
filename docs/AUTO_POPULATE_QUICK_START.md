# Entity Auto-Populate - Quick Start Guide

## 5-Minute Setup

### Step 1: Generate Indices (One-Time)

```bash
node scripts/generate-entity-indices.js
```

### Step 2: Add Scripts to Your Page

```html
<script defer src="/components/panels/entity-panel.js"></script>
<script defer src="/components/auto-populate.js"></script>
```

### Step 3: Add Container

```html
<div data-auto-populate
     data-mythology="greek"
     data-type="item"
     data-display-mode="compact"></div>
```

Done! Entities will auto-populate when the page loads.

## Common Patterns

### All Items from a Mythology

```html
<div data-auto-populate
     data-mythology="norse"
     data-type="item"
     data-display-mode="compact"></div>
```

### Items by Category

```html
<div data-auto-populate
     data-mythology="jewish"
     data-category="artifact"
     data-display-mode="compact"></div>
```

### Cross-Mythology Archetype

```html
<div data-auto-populate
     data-archetype="hero-journey"
     data-display-mode="compact"></div>
```

### Limit Results

```html
<div data-auto-populate
     data-mythology="greek"
     data-type="place"
     data-limit="10"
     data-display-mode="compact"></div>
```

### Filter by Element

```html
<div data-auto-populate
     data-element="fire"
     data-type="item"
     data-display-mode="compact"></div>
```

## All Data Attributes

| Attribute | Values | Example |
|-----------|--------|---------|
| `data-mythology` | `greek`, `norse`, `jewish`, etc. | `data-mythology="greek"` |
| `data-type` | `item`, `place`, `deity`, `concept` | `data-type="item"` |
| `data-category` | `artifact`, `herb`, `weapon`, etc. | `data-category="artifact"` |
| `data-sub-category` | Any subcategory | `data-sub-category="divine-weapon"` |
| `data-archetype` | `hero-journey`, `trickster`, etc. | `data-archetype="hero-journey"` |
| `data-element` | `fire`, `water`, `earth`, `air` | `data-element="fire"` |
| `data-sefirot` | `chesed`, `gevurah`, etc. | `data-sefirot="tiferet"` |
| `data-tags` | Comma-separated | `data-tags="divine,power"` |
| `data-display-mode` | `mini`, `compact`, `full` | `data-display-mode="compact"` |
| `data-limit` | Number | `data-limit="10"` |
| `data-sort-by` | `name`, `category`, `random` | `data-sort-by="name"` |
| `data-show-count` | `true`, `false` | `data-show-count="true"` |

## Display Modes

### Mini
- Smallest footprint
- Icon + Name + Badges
- Good for sidebars

```html
data-display-mode="mini"
```

### Compact (Default)
- Card-based
- Icon, name, description
- Expand button
- Best for grids

```html
data-display-mode="compact"
```

### Full
- Complete information
- All metadata
- Related entities
- Good for focus pages

```html
data-display-mode="full"
```

## Archetype Filter

For advanced exploration:

```html
<!-- Add container -->
<div id="archetype-filter-container"></div>

<!-- Add scripts -->
<script defer src="/components/panels/entity-panel.js"></script>
<script defer src="/components/archetype-filter.js"></script>

<!-- Initialize -->
<script>
  const filter = new ArchetypeFilter('archetype-filter-container');
  filter.init();
</script>
```

## Regenerating Indices

Run this whenever you add/modify entity JSON files:

```bash
node scripts/generate-entity-indices.js
```

## Troubleshooting

### No Entities Showing?

1. Check indices exist: `/data/indices/all-entities.json`
2. Regenerate: `node scripts/generate-entity-indices.js`
3. Check browser console for errors
4. Verify scripts are loaded

### Wrong Entities?

1. Check data attribute values
2. Verify entity JSON has correct metadata
3. Regenerate indices
4. Try removing filters to see all

### Styling Issues?

1. Ensure theme CSS is loaded
2. Check for CSS conflicts
3. Try different display modes

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Greek Sacred Items</title>
    <link rel="stylesheet" href="/themes/theme-base.css">
    <link rel="stylesheet" href="/styles.css">
    <script defer src="/components/panels/entity-panel.js"></script>
    <script defer src="/components/auto-populate.js"></script>
</head>
<body>
    <h1>Greek Sacred Items</h1>

    <h2>Divine Weapons</h2>
    <div data-auto-populate
         data-mythology="greek"
         data-sub-category="divine-weapon"
         data-display-mode="compact"></div>

    <h2>Sacred Places</h2>
    <div data-auto-populate
         data-mythology="greek"
         data-type="place"
         data-limit="6"
         data-display-mode="compact"></div>
</body>
</html>
```

## Need More Help?

See full documentation: `/docs/ENTITY_AUTO_POPULATE_SYSTEM.md`
