# Header Filters System - Complete Guide

## Overview

The Header Filters system provides a unified, site-wide filtering experience that allows users to filter content across all pages based on:
- **Content Source**: Official, Community, or Both
- **Mythologies**: Multi-select from all available mythologies
- **Entity Types**: Multi-select from deities, heroes, creatures, etc.
- **Topics/Tags**: Multi-select from available tags/topics

The system features a collapsible glassmorphism-styled filter bar in the site header with real-time filtering, URL synchronization, and persistent user preferences.

## Architecture

### Components

1. **`js/header-filters.js`** - Core filter logic and state management
2. **`css/header-filters.css`** - Glassmorphism UI styles
3. **`js/entity-loader.js`** (updated) - Entity loading with filter support
4. **`js/navigation.js`** (updated) - Navigation integration

### Key Features

- **Persistent State**: Filters saved to localStorage
- **URL Synchronization**: Filters reflected in URL parameters for sharing
- **Real-time Updates**: Automatic content reload on filter changes
- **Responsive Design**: Mobile-optimized collapsible interface
- **Filter Pills**: Visual indicators of active filters with quick removal
- **Smart Filtering**: Combines Firestore queries with client-side filtering

## Installation

### 1. Include Required Files

Add to your HTML `<head>` section:

```html
<!-- Header Filters CSS -->
<link rel="stylesheet" href="/css/header-filters.css">

<!-- Header Filters JS -->
<script defer src="/js/header-filters.js"></script>
```

**Note**: Header filters must load AFTER Firebase initialization but BEFORE entity-loader.js and navigation.js.

### 2. Required Order

```html
<!-- 1. Firebase -->
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js"></script>
<script src="/js/firebase-config.js"></script>

<!-- 2. Header Filters -->
<script defer src="/js/header-filters.js"></script>

<!-- 3. Entity Loader (updated) -->
<script defer src="/js/entity-loader.js"></script>

<!-- 4. Navigation (updated) -->
<script defer src="/js/navigation.js"></script>
```

## Usage

### Basic Initialization

The header filters initialize automatically when the page loads. No manual initialization is required.

```javascript
// The global instance is created automatically
window.headerFilters // HeaderFilters instance
```

### Accessing Filter State

```javascript
// Get current filter state
const filters = window.headerFilters.getActiveFilters();
// Returns: {
//   contentSource: 'both' | 'official' | 'community',
//   mythologies: ['greek', 'norse', ...],
//   entityTypes: ['deity', 'hero', ...],
//   topics: ['creation', 'war', ...]
// }

// Get count of active filters
const count = window.headerFilters.getActiveFilterCount();
```

### Programmatic Filter Updates

```javascript
// Update content source
window.headerFilters.updateFilters('contentSource', 'official');

// Update mythologies (array)
window.headerFilters.updateFilters('mythologies', ['greek', 'norse']);

// Update entity types (array)
window.headerFilters.updateFilters('entityTypes', ['deity', 'hero']);

// Update topics (array)
window.headerFilters.updateFilters('topics', ['war', 'creation']);

// Clear all filters
window.headerFilters.clearFilters();
```

### Listen for Filter Changes

```javascript
// Register a callback for filter changes
window.headerFilters.onFilterChange((filters) => {
    console.log('Filters changed:', filters);
    // Reload your content here
});
```

## Entity Loader Integration

### How It Works

The updated `EntityLoader` automatically respects header filters:

1. **Firestore Query Filters**: Applied for mythology filters (optimized)
2. **Client-Side Filters**: Applied for content source, entity types, and topics

### Example Usage

```javascript
// Load entities with automatic filter application
EntityLoader.loadAndRenderGrid(
    'deities',              // collection
    '#grid-container',      // container selector
    { mythology: 'greek' }, // base filters
    { limit: 50 }          // options
);

// Header filters will automatically merge with base filters
```

### Auto-Reload on Filter Change

When using `data-entity-grid` attribute, auto-reload is enabled:

```html
<div id="deities-grid" data-entity-grid="deities" data-mythology="greek"></div>

<script>
    // EntityLoader.init() sets up auto-reload
    EntityLoader.init();
</script>
```

## Filter Bar UI

### Structure

```
┌─────────────────────────────────────────────────────────┐
│ [🔍 Filters (3)] [Greek ×] [Norse ×] [Deities ×] [Clear]│
├─────────────────────────────────────────────────────────┤
│ Content Source: [Both Sources ▼]                        │
│ Mythologies: [2 selected ▼]                             │
│ Entity Types: [1 selected ▼]                            │
│ Topics/Tags: [All Topics ▼]                             │
│ [Clear All Filters]                                     │
└─────────────────────────────────────────────────────────┘
```

### Filter Status Bar

- **Filter Toggle Button**: Shows filter count badge, expands/collapses panel
- **Active Filter Pills**: Visual indicators with quick removal (× button)
- **Clear All Button**: Removes all active filters

### Filter Controls Panel

- **Expandable**: Toggles visibility with smooth animation
- **Dropdowns**: Glassmorphism-styled with search for large lists
- **Multi-Select**: Checkboxes for mythologies, entity types, topics
- **Single-Select**: Radio buttons for content source

## URL Parameters

Filters are synchronized with URL for shareability:

### Format

```
?source=official&mythology=greek,norse&type=deity,hero&topics=war,creation
```

### Parameters

- `source`: `official`, `community`, or omitted for `both`
- `mythology`: Comma-separated mythology IDs
- `type`: Comma-separated entity type IDs
- `topics`: Comma-separated topic/tag IDs

### Example URLs

```
# Official Greek deities
/browse.html?source=official&mythology=greek&type=deity

# Community-contributed war-related content from Norse and Greek
/browse.html?source=community&mythology=norse,greek&topics=war

# All heroes and deities
/browse.html?type=deity,hero
```

## Styling

### CSS Variables

The filter bar uses theme variables from `theme-base.css`:

```css
--color-surface-rgb: 26, 31, 58
--color-primary-rgb: 139, 127, 255
--color-secondary-rgb: 255, 124, 230
--color-border: rgba(139, 127, 255, 0.3)
--color-text-primary: #e5e7eb
--color-text-secondary: #9ca3af
```

### Custom Styling

Override filter bar styles:

```css
/* Custom filter bar background */
.filter-bar-container {
    background: rgba(20, 25, 50, 0.8);
}

/* Custom filter pill colors */
.filter-pill {
    background: rgba(100, 200, 255, 0.2);
    border-color: rgba(100, 200, 255, 0.5);
}
```

## Mobile Responsive

### Breakpoints

- **Desktop (>1024px)**: Full grid layout
- **Tablet (768px-1024px)**: 2-column grid
- **Mobile (<768px)**: Single column, stacked layout

### Mobile Optimizations

- Collapsible filter bar by default
- Touch-friendly dropdown controls
- Horizontal scroll for filter pills
- Full-width buttons

## Performance Considerations

### Firestore Query Optimization

1. **Mythology filters**: Applied directly to Firestore query (indexed)
2. **Other filters**: Applied client-side to reduce query complexity

### Debouncing

Search inputs in dropdowns are debounced to prevent excessive filtering.

### Lazy Loading

Dropdowns load options on-demand to minimize initial page load.

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Backdrop Filter**: Graceful degradation on older browsers
- **localStorage**: Required for filter persistence

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between filter controls
- **Enter/Space**: Activate dropdowns and buttons
- **Escape**: Close dropdowns
- **Arrow Keys**: Navigate dropdown options

### Screen Readers

- ARIA labels on all interactive elements
- Status announcements for filter changes
- Semantic HTML structure

### Focus Management

- Visible focus indicators
- Logical tab order
- Focus trap within dropdowns

## Troubleshooting

### Filters Not Appearing

**Issue**: Filter bar doesn't render
**Solution**: Check that Firebase is initialized before header-filters.js loads

```javascript
// Verify initialization
console.log(window.headerFilters);
console.log(window.headerFilters.initialized);
```

### Filters Not Applying

**Issue**: Content doesn't filter
**Solution**: Ensure EntityLoader is listening for filter changes

```javascript
// Check listener registration
console.log(window.headerFilters.listeners.length);
```

### URL Parameters Not Working

**Issue**: Filters from URL aren't applied
**Solution**: Verify applyURLParameters() is called after initialization

```javascript
// Manually apply URL params
window.headerFilters.applyURLParameters();
window.headerFilters.renderFilterBar();
window.headerFilters.setupEventListeners();
```

### Performance Issues

**Issue**: Slow filtering with large datasets
**Solution**: Implement pagination or virtual scrolling

```javascript
// Limit results
EntityLoader.loadAndRenderGrid('deities', '#container', {}, { limit: 50 });
```

## Advanced Usage

### Custom Filter Types

Add custom filter types by extending HeaderFilters:

```javascript
// Extend available options
window.headerFilters.availableOptions.customFilter = [
    { id: 'option1', name: 'Option 1' },
    { id: 'option2', name: 'Option 2' }
];

// Add to filter state
window.headerFilters.filterState.customFilter = [];

// Re-render filter bar
window.headerFilters.renderFilterBar();
window.headerFilters.setupEventListeners();
```

### Conditional Filter Display

Show filters only on specific pages:

```javascript
// In header-filters.js init()
if (window.location.pathname.includes('/browse')) {
    this.renderFilterBar();
} else {
    // Hide filter bar
    document.getElementById('header-filter-bar').style.display = 'none';
}
```

### Filter Presets

Create saved filter presets:

```javascript
const presets = {
    greekDeities: {
        contentSource: 'official',
        mythologies: ['greek'],
        entityTypes: ['deity'],
        topics: []
    },
    allWar: {
        contentSource: 'both',
        mythologies: [],
        entityTypes: [],
        topics: ['war', 'combat']
    }
};

// Apply preset
function applyPreset(presetName) {
    const preset = presets[presetName];
    window.headerFilters.filterState = { ...preset };
    window.headerFilters.renderFilterBar();
    window.headerFilters.setupEventListeners();
    window.headerFilters.notifyFilterChange();
}
```

## API Reference

### HeaderFilters Class

#### Properties

- `filterState` - Current filter state object
- `availableOptions` - Available filter options (mythologies, types, topics)
- `filterBarVisible` - Boolean indicating if filter bar is expanded
- `initialized` - Boolean indicating initialization status
- `listeners` - Array of filter change callbacks

#### Methods

##### `init()`
Initialize the header filters system. Called automatically on page load.

##### `renderFilterBar()`
Render the filter bar UI in the header.

##### `updateFilters(filterType, values)`
Update a specific filter type.
- `filterType`: 'contentSource', 'mythologies', 'entityTypes', or 'topics'
- `values`: New value(s) for the filter

##### `clearFilters()`
Reset all filters to default state.

##### `getActiveFilters()`
Returns current filter state object.

##### `getActiveFilterCount()`
Returns count of active filters (excluding 'both' content source).

##### `onFilterChange(callback)`
Register a callback for filter change events.
- `callback`: Function to call when filters change, receives filter state

##### `saveToPreferences()`
Save current filter state to localStorage.

##### `loadFromPreferences()`
Load filter state from localStorage.

##### `updateURLParameters()`
Update URL parameters to reflect current filters.

##### `applyURLParameters()`
Apply filters from URL parameters to filter state.

## Best Practices

### 1. Initialize Early
Load header-filters.js early in page load for best UX.

### 2. Use URL Parameters
Always sync filters with URL for shareability.

### 3. Provide Clear Feedback
Show filter count and active filter pills prominently.

### 4. Optimize Queries
Use Firestore queries for indexed fields, client-side for complex filters.

### 5. Test Edge Cases
Test with no filters, all filters, and single filters.

### 6. Mobile First
Design filter UI for mobile, enhance for desktop.

### 7. Accessibility
Ensure keyboard navigation and screen reader support.

## Examples

### Example 1: Basic Page Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Browse Entities</title>
    <link rel="stylesheet" href="/css/theme-base.css">
    <link rel="stylesheet" href="/css/header-filters.css">

    <script src="/js/firebase-config.js"></script>
    <script defer src="/js/header-filters.js"></script>
    <script defer src="/js/entity-loader.js"></script>
</head>
<body>
    <header>
        <h1>Browse Entities</h1>
    </header>

    <!-- Filter bar will be injected here automatically -->

    <main>
        <div id="entities-grid" data-entity-grid="deities"></div>
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            EntityLoader.init();
        });
    </script>
</body>
</html>
```

### Example 2: Custom Filter Handler

```javascript
// Custom handling of filter changes
window.headerFilters.onFilterChange((filters) => {
    // Update UI indicators
    document.getElementById('filter-count').textContent =
        window.headerFilters.getActiveFilterCount();

    // Custom analytics
    if (window.gtag) {
        gtag('event', 'filter_change', {
            mythologies: filters.mythologies.length,
            types: filters.entityTypes.length,
            source: filters.contentSource
        });
    }

    // Custom reload logic
    reloadCustomView(filters);
});
```

### Example 3: Programmatic Filter Control

```javascript
// Create filter preset buttons
document.getElementById('btn-greek-deities').addEventListener('click', () => {
    window.headerFilters.updateFilters('mythologies', ['greek']);
    window.headerFilters.updateFilters('entityTypes', ['deity']);
    window.headerFilters.updateFilters('contentSource', 'official');
});

document.getElementById('btn-all-heroes').addEventListener('click', () => {
    window.headerFilters.clearFilters();
    window.headerFilters.updateFilters('entityTypes', ['hero']);
});
```

## Future Enhancements

### Planned Features

1. **Filter History**: Navigate through filter history (back/forward)
2. **Saved Searches**: Allow users to save favorite filter combinations
3. **Advanced Filtering**: Date ranges, numeric ranges, text search
4. **Filter Analytics**: Track popular filter combinations
5. **Smart Suggestions**: Suggest related filters based on current selection
6. **Bulk Operations**: Apply/remove multiple filters at once
7. **Filter Export**: Share filter configurations via JSON

### Extensibility Points

- Custom filter types
- Custom filter logic
- Custom UI components
- Integration with other systems

## Support

For issues or questions:
- Check console for error messages
- Verify Firebase connection
- Review initialization order
- Test in isolation

## Version History

- **v1.0.0** (2024-12-14): Initial release
  - Content source filtering
  - Mythology multi-select
  - Entity type multi-select
  - Topic/tag multi-select
  - URL synchronization
  - localStorage persistence
  - Mobile responsive design
  - Glassmorphism UI

---

**Last Updated**: December 14, 2024
**Status**: Production Ready
**Compatibility**: Modern browsers with ES6+ support
