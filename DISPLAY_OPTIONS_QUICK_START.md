# Display Options System - Quick Start Guide

## For Users

### How to Configure Display Options

1. **Start Submission**: Go to the submission form
2. **Add Content**: Create at least one content panel
3. **Access Display Options**: Scroll to "Related Entities Display" section
4. **Choose Relationship**: Click a relationship type button (e.g., "Related Deities")
5. **Select Mode**: Choose Grid, List, Table, or Panel
6. **Customize Settings**: Adjust options for your chosen mode
7. **Preview**: Check the live preview below settings
8. **Repeat**: Configure other relationship types as needed
9. **Submit**: Your display preferences are saved automatically

### Display Modes at a Glance

#### Grid Mode
- **Best For**: Visual browsing, galleries
- **Options**: 1-6 columns, card styles, icons, sorting
- **Example**: Display related deities in a 4-column grid with icons

#### List Mode
- **Best For**: Reading, scanning, organized content
- **Options**: Categorization, compact mode, icons, sorting
- **Example**: List heroes grouped by mythology

#### Table Mode
- **Best For**: Comparing data, detailed information
- **Options**: Column selection, sorting, filtering, pagination
- **Example**: Show myths with title, theme, and source columns

#### Panel Mode
- **Best For**: Detailed information, expandable content
- **Options**: Layout styles, detail levels, expandability
- **Example**: Accordion panels for family relationships

---

## For Developers

### Quick Integration

#### 1. Include Files

```html
<!-- CSS -->
<link rel="stylesheet" href="/css/display-options-editor.css">

<!-- JavaScript -->
<script src="/js/components/display-options-editor.js"></script>
```

#### 2. Add Container

```html
<div id="display-options-container"></div>
```

#### 3. Initialize Editor

```javascript
const container = document.getElementById('display-options-container');
const editor = new DisplayOptionsEditor(container);
```

#### 4. Get Data

```javascript
const displayOptions = editor.getData();
// Save to database: entity.displayOptions = displayOptions.displayOptions
```

### Rendering with Display Options

#### Basic Usage

```javascript
// In your entity renderer
const config = entity.displayOptions?.relatedDeities || this.getDefaultConfig();

switch (config.mode) {
    case 'grid':
        return this.renderGrid(entities, config);
    case 'list':
        return this.renderList(entities, config);
    case 'table':
        return this.renderTable(entities, config);
    case 'panel':
        return this.renderPanel(entities, config);
}
```

#### Using FirebaseEntityRenderer

```javascript
const renderer = new FirebaseEntityRenderer();

// Render with display options
const html = renderer.renderRelatedEntities(
    entity.relatedDeities,
    'relatedDeities',
    entity.displayOptions
);
```

### Default Configuration

```javascript
{
    mode: 'grid',
    columns: 4,
    sort: 'name',
    showIcons: true
}
```

---

## Configuration Examples

### Example 1: Beautiful Deity Grid

```json
{
  "relatedDeities": {
    "mode": "grid",
    "columns": 3,
    "sort": "importance",
    "showIcons": true,
    "cardStyle": "detailed"
  }
}
```

### Example 2: Organized Hero List

```json
{
  "relatedHeroes": {
    "mode": "list",
    "categorize": "by_mythology",
    "sort": "name",
    "showIcons": true,
    "compact": false
  }
}
```

### Example 3: Data-Rich Myth Table

```json
{
  "relatedMyths": {
    "mode": "table",
    "columns": ["name", "theme", "source", "date"],
    "sortable": true,
    "filterable": true,
    "pagination": "25"
  }
}
```

### Example 4: Detailed Family Panels

```json
{
  "family": {
    "mode": "panel",
    "layout": "accordion",
    "showAllDetails": true,
    "expandable": false
  }
}
```

---

## Supported Relationship Types

| Key | Label | Icon | Typical Use |
|-----|-------|------|-------------|
| `relatedDeities` | Related Deities | ⚡ | Gods and divine beings |
| `relatedHeroes` | Related Heroes | 🗡️ | Heroes and legendary figures |
| `relatedCreatures` | Related Creatures | 🐉 | Mythical creatures |
| `relatedMyths` | Related Myths | 📜 | Stories and legends |
| `relatedPlaces` | Related Places | 🏛️ | Sacred locations |
| `relatedItems` | Related Items | ⚔️ | Artifacts and objects |
| `relatedTexts` | Related Texts | 📖 | Sacred texts |
| `relatedConcepts` | Related Concepts | 💭 | Spiritual concepts |
| `family` | Family | 👥 | Family relationships |
| `allies` | Allies | 🤝 | Allied figures |
| `enemies` | Enemies | ⚔️ | Rival figures |

---

## API Reference

### DisplayOptionsEditor Class

#### Constructor

```javascript
new DisplayOptionsEditor(container, initialData)
```

**Parameters**:
- `container` (HTMLElement) - DOM element to render into
- `initialData` (Object|null) - Optional initial configuration

#### Methods

##### `getData()`
Returns current configuration.

```javascript
const data = editor.getData();
// { displayOptions: { relatedDeities: {...}, ... } }
```

##### `setData(data)`
Loads configuration into editor.

```javascript
editor.setData({
    displayOptions: {
        relatedDeities: { mode: 'grid', columns: 4 }
    }
});
```

##### `selectType(typeKey)`
Programmatically select a relationship type.

```javascript
editor.selectType('relatedHeroes');
```

##### `selectMode(typeKey, mode)`
Set display mode for a relationship type.

```javascript
editor.selectMode('relatedDeities', 'table');
```

---

### FirebaseEntityRenderer Methods

#### `renderRelatedEntities(entities, relationshipType, displayOptions)`

**Parameters**:
- `entities` (Array) - Array of entity objects
- `relationshipType` (String) - Type key (e.g., 'relatedDeities')
- `displayOptions` (Object|null) - Display configuration

**Returns**: HTML string

#### `sortEntities(entities, sortBy)`

**Sort Options**:
- `'name'` - Alphabetical A-Z
- `'name-desc'` - Alphabetical Z-A
- `'importance'` - By importance (high to low)
- `'date'` - By date
- `'custom'` - Keep original order

---

## Troubleshooting

### Issue: Display options not saving

**Solution**: Ensure `displayOptionsEditor` is initialized and data is collected:

```javascript
const displayOptionsData = displayOptionsEditor ?
    displayOptionsEditor.getData() : null;
```

### Issue: Related entities not rendering with custom layout

**Solution**: Check that `displayOptions` is passed to renderer:

```javascript
this.renderRelatedEntities(
    entities,
    'relatedDeities',
    entity.displayOptions  // ← Make sure this is included
);
```

### Issue: Preview not updating

**Solution**: Changes are debounced by 300ms. Wait a moment or check console for errors.

### Issue: Section locked on submission form

**Solution**: Add at least one content panel first. Display options section requires content to be added.

---

## Best Practices

### For Users

1. **Start Simple**: Begin with default grid mode, customize if needed
2. **Preview Often**: Use live preview to see changes immediately
3. **Consider Context**: Choose mode based on content type:
   - Grid: Visual items (deities, heroes)
   - List: Text-heavy items (myths, texts)
   - Table: Comparison data (multiple attributes)
   - Panel: Detailed relationships (family)
4. **Test Mobile**: Preview on mobile devices if possible
5. **Use Icons**: Icons improve visual scanning in Grid and List modes

### For Developers

1. **Always Provide Fallback**: Use `|| getDefaultConfig()` pattern
2. **Handle Missing Data**: Check for existence of displayOptions
3. **Test All Modes**: Verify grid, list, table, and panel rendering
4. **Maintain Consistency**: Use same data structure across relationship types
5. **Document Custom Fields**: If adding new entity fields, document which modes use them

---

## Performance Tips

1. **Pagination**: Use table pagination for large datasets (>50 items)
2. **Lazy Loading**: Consider lazy-loading images in grid mode
3. **Compact Mode**: Use compact list mode for long lists
4. **Minimal Cards**: Use minimal card style for large grids
5. **Accordion**: Use accordion panels to reduce initial render size

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

**Required Features**:
- CSS Grid
- CSS Custom Properties
- ES6 Classes
- Optional Chaining (`?.`)
- Nullish Coalescing (`??`)

---

## Additional Resources

- **Full Documentation**: See `DISPLAY_OPTIONS_SYSTEM_REPORT.md`
- **Source Code**: `js/components/display-options-editor.js`
- **Stylesheet**: `css/display-options-editor.css`
- **Example Integration**: `theories/user-submissions/submit.html`
- **Renderer Implementation**: `js/entity-renderer-firebase.js`

---

**Last Updated**: December 24, 2025
