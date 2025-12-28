# Browse View - Quick Reference Card

## One-Page Developer Guide

---

## File Location
```
h:\Github\EyesOfAzrael\js\views\browse-category-view.js
```

## Usage

```javascript
// Initialize
const view = new BrowseCategoryView(firestore);

// Render
await view.render(container, {
  category: 'deities',  // Required: deities, heroes, creatures, items, places, herbs, rituals, texts, symbols
  mythology: 'greek'    // Optional: pre-filter by mythology
});
```

---

## Feature Overview

| Feature | Description | User Benefit |
|---------|-------------|--------------|
| **Quick Filters** | Chip-based mythology/domain selection | Fast filtering without dropdowns |
| **Multi-Select** | Toggle multiple filters simultaneously | Complex queries made easy |
| **Search** | Debounced (300ms) full-text search | Find specific entities quickly |
| **Sort Options** | Name, Mythology, Popularity, Date Added | Flexible ordering |
| **View Modes** | Grid vs List | User preference |
| **Density** | Compact, Comfortable, Detailed | Adjust information density |
| **Pagination** | Traditional (< 100 items) | Standard browsing |
| **Virtual Scroll** | Auto-enabled (100+ items) | Smooth large dataset handling |
| **Tag Overflow** | "Show +X more" for truncated tags | Clean card design |
| **Hover Preview** | Additional details on desktop | Quick information access |
| **Empty States** | Contextual messages + CTAs | Clear feedback |

---

## View Density Comparison

| Aspect | Compact | Comfortable | Detailed |
|--------|---------|-------------|----------|
| **Grid Columns** | 240px min | 280px min | 320px min |
| **Card Padding** | 1rem | 1.5rem | 2rem |
| **Icon Size** | 2rem | 2.5rem | 3rem |
| **Description Lines** | 2 | 3 | 5 |
| **Visible Tags** | 3 | 4 | 6 |
| **Best For** | Power users | Most users | Reading |

---

## Filter Types by Category

### All Categories
- **Mythology**: Top 8 by count
- **Search**: Name, description, tags
- **Sort**: 4 options

### Deities Specific
- **Domains**: War, Sky, Love, Death, Wisdom, Thunder, Sea, Fertility, Sun, Moon...

### Creatures Specific
- **Types**: Dragon, Giant, Monster, Hybrid, Spirit, Undead, Elemental, Shapeshifter

### Items Specific
- **Types**: Weapon, Armor, Artifact, Relic, Talisman, Staff, Ring, Crown

### Places Specific
- **Types**: Mountain, Island, Temple, Underworld, Heaven, Forest, River, Sea

### Herbs Specific
- **Properties**: Healing, Immortality, Vision, Protection, Purification, Strength

### Rituals Specific
- **Types**: Initiation, Sacrifice, Festival, Purification, Divination, Marriage

### Texts Specific
- **Types**: Scripture, Epic, Hymn, Prayer, Chronicle, Wisdom, Law, Prophecy

### Symbols Specific
- **Types**: Geometric, Celestial, Animal, Plant, Abstract, Anthropomorphic

---

## Key Methods

```javascript
// Core Methods
render(container, options)         // Main entry point
loadEntities()                     // Fetch from Firebase
applyFilters()                     // Filter + sort pipeline
updateGrid()                       // Re-render cards
attachEventListeners()             // Wire up interactions

// Filter Methods
handleChipClick(event)             // Toggle chip filter
clearAllFilters()                  // Reset all filters
updateActiveFilters()              // Update active filter display

// Helper Methods
calculatePopularity(entity)        // Compute popularity score
groupByMythology(entities)         // Group entities by culture
extractUniqueDomains(entities)     // Get all unique domains
getEntityCardHTML(entity)          // Generate card HTML

// Pagination/Virtual Scroll
updatePagination()                 // Update page controls
handleScroll()                     // Virtual scroll handler
```

---

## Entity Data Structure

```javascript
{
  id: 'zeus',
  name: 'Zeus',
  mythology: 'greek',
  description: 'King of the gods...',
  icon: 'assets/icons/zeus.svg',  // Or emoji
  domains: ['War', 'Sky', 'Thunder', 'Justice'],
  attributes: ['Kingship', 'Law', 'Order'],
  altNames: ['Jupiter', 'Jove', 'Ζεύς'],
  symbols: ['Lightning bolt', 'Eagle', 'Oak'],

  // Optional metadata
  views: 1500,
  likes: 200,
  shares: 50,
  dateAdded: 1703721600000,
  createdAt: 1703721600000,

  // Category-specific fields
  type: 'Olympian',         // For creatures, items
  category: 'Major Deity',  // For classification
  pantheon: 'Olympian',     // For deities
  properties: ['Divine'],   // For herbs
  ritualType: 'Sacrifice',  // For rituals
  textType: 'Epic',         // For texts
  symbolType: 'Animal'      // For symbols
}
```

---

## Popularity Score Calculation

```javascript
score =
  (views × 1) +
  (likes × 5) +
  (shares × 10) +
  (domains.length × 2) +
  (attributes.length × 2) +
  (description.length > 200 ? 20 : 0) +
  (hasIcon ? 10 : 0)

// Example: Zeus with 1500 views, 200 likes, 50 shares, 7 domains
// = 1500 + 1000 + 500 + 14 + 20 + 10 = 3044
```

---

## localStorage Keys

```javascript
'browse-view-mode'      // 'grid' | 'list'
'browse-view-density'   // 'compact' | 'comfortable' | 'detailed'
'browse-sort-by'        // 'name' | 'mythology' | 'popularity' | 'dateAdded'
```

---

## CSS Classes

### Container Classes
```css
.browse-view              /* Main container */
.browse-header            /* Header section */
.quick-filters            /* Quick filter chips section */
.browse-controls          /* Search/sort/view controls */
.entity-container         /* Grid container wrapper */
.entity-grid              /* Grid itself */
.pagination-controls      /* Pagination buttons */
```

### View Mode Classes
```css
.entity-grid.grid-view                  /* Grid layout */
.entity-grid.list-view                  /* List layout */
.entity-grid.density-compact            /* Compact mode */
.entity-grid.density-comfortable        /* Comfortable mode */
.entity-grid.density-detailed           /* Detailed mode */
```

### Entity Card Classes
```css
.entity-card              /* Card wrapper */
.entity-card-header       /* Header with icon + name */
.entity-icon              /* Icon/emoji */
.entity-card-title        /* Entity name */
.entity-mythology         /* Mythology badge */
.entity-description       /* Description text */
.entity-tags              /* Tag container */
.tag                      /* Individual tag */
.tag-overflow             /* "+X more" tag */
.entity-preview           /* Hover preview overlay */
```

### Filter Classes
```css
.filter-chip              /* Filter chip button */
.filter-chip[aria-pressed="true"]  /* Active chip */
.active-filters           /* Active filter display */
.active-chip              /* Individual active filter */
.clear-filters-btn        /* Clear all button */
```

---

## Event Handling

```javascript
// Quick Filters
document.querySelectorAll('.filter-chip')
  .forEach(chip => chip.addEventListener('click', handleChipClick));

// Search (with debounce)
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => applyFilters(), 300);
});

// Sort
sortSelect.addEventListener('change', (e) => {
  sortBy = e.target.value;
  localStorage.setItem('browse-sort-by', sortBy);
  applyFilters();
});

// View Mode
viewBtn.addEventListener('click', () => {
  viewMode = btn.dataset.view;
  localStorage.setItem('browse-view-mode', viewMode);
  grid.className = `entity-grid ${viewMode}-view density-${density}`;
});

// Density
densityOption.addEventListener('click', () => {
  viewDensity = option.dataset.density;
  localStorage.setItem('browse-view-density', viewDensity);
  updateGrid();
});

// Virtual Scroll
container.addEventListener('scroll', handleScroll);

// Pagination
pageBtn.addEventListener('click', () => {
  currentPage = parseInt(btn.dataset.page);
  updateGrid();
  updatePagination();
});
```

---

## Filter Pipeline

```javascript
// Step 1: Start with all entities
let filtered = [...this.entities];

// Step 2: Apply mythology filter
if (selectedMythologies.size > 0) {
  filtered = filtered.filter(e => selectedMythologies.has(e.mythology));
}

// Step 3: Apply domain filter
if (selectedDomains.size > 0) {
  filtered = filtered.filter(e =>
    e.domains.some(d => selectedDomains.has(d))
  );
}

// Step 4: Apply search
if (searchTerm) {
  filtered = filtered.filter(e => {
    const text = [e.name, e.description, ...e.domains, ...e.altNames]
      .join(' ').toLowerCase();
    return text.includes(searchTerm);
  });
}

// Step 5: Sort
filtered.sort((a, b) => {
  switch (sortBy) {
    case 'name': return a.name.localeCompare(b.name);
    case 'mythology': return a.mythology.localeCompare(b.mythology);
    case 'popularity': return b._popularity - a._popularity;
    case 'dateAdded': return b._dateAdded - a._dateAdded;
  }
});

// Step 6: Update
this.filteredEntities = filtered;
this.updateGrid();
this.updatePagination();
```

---

## Responsive Breakpoints

```css
/* Desktop (default) */
.entity-grid.grid-view {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* Tablet (< 1024px) */
@media (max-width: 1024px) {
  .entity-grid.grid-view {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

/* Mobile (< 768px) */
@media (max-width: 768px) {
  .entity-grid.grid-view,
  .entity-grid.list-view {
    grid-template-columns: 1fr; /* Single column */
  }
  .entity-preview { display: none; } /* Hide hover previews */
}
```

---

## Performance Thresholds

```javascript
// Pagination vs Virtual Scrolling
const VIRTUAL_SCROLL_THRESHOLD = 100;

if (filteredEntities.length > VIRTUAL_SCROLL_THRESHOLD) {
  // Use virtual scrolling
  useVirtualScrolling = true;
  itemsPerRender = 30;
} else {
  // Use pagination
  useVirtualScrolling = false;
  itemsPerPage = 24;
}
```

---

## Customization Examples

### Add New Category

```javascript
// 1. Update category info
getCategoryInfo(category) {
  const info = {
    // ... existing
    spells: {
      name: 'Magical Spells',
      icon: '✨',
      description: 'Incantations and magical formulas'
    }
  };
  return info[category];
}

// 2. Add default icon
getDefaultIcon(category) {
  const icons = {
    // ... existing
    spells: '✨'
  };
  return icons[category];
}

// 3. Create Firebase collection 'spells'
// 4. Add custom filters in getQuickFiltersHTML()
```

### Customize Popularity

```javascript
calculatePopularity(entity) {
  let score = 0;

  // Standard scoring
  if (entity.views) score += entity.views * 1;
  if (entity.likes) score += entity.likes * 5;

  // Category-specific bonuses
  if (this.category === 'deities') {
    if (entity.pantheon === 'Olympian') score += 100;
    if (entity.domains.includes('War')) score += 50;
  }

  return score;
}
```

### Add Custom Filter

```javascript
// In getQuickFiltersHTML()
if (this.category === 'heroes') {
  const heroTypes = this.extractUniqueTypes(this.entities);

  return `
    <div class="quick-filter-section">
      <h3>Filter by Hero Type</h3>
      <div class="filter-chips">
        ${Array.from(heroTypes).map(type => `
          <button class="filter-chip"
                  data-filter-type="hero-type"
                  data-filter-value="${type}">
            ${type}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}
```

---

## Troubleshooting

### Cards Not Rendering
```javascript
// Check entity structure
console.log('[Browse] Entities:', this.entities);
// Verify: id, name, mythology, description
```

### Filters Not Working
```javascript
// Check filter state
console.log('[Browse] Selected:', {
  mythologies: this.selectedMythologies,
  domains: this.selectedDomains,
  search: this.searchTerm
});
console.log('[Browse] Filtered count:', this.filteredEntities.length);
```

### Performance Issues
```javascript
// Check virtual scrolling
if (this.filteredEntities.length > 100) {
  console.log('[Browse] Virtual scrolling enabled');
  console.log('[Browse] Visible range:', this.visibleRange);
}
```

### Styles Not Applying
```javascript
// Verify CSS variables in :root
getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary');
```

---

## Testing Checklist

- [ ] Load with 0 entities (empty state)
- [ ] Load with 10 entities (pagination)
- [ ] Load with 100+ entities (virtual scrolling)
- [ ] Apply mythology filter
- [ ] Apply domain filter
- [ ] Apply multi-select filters
- [ ] Search for entity
- [ ] Clear all filters
- [ ] Sort by each option
- [ ] Switch view modes
- [ ] Change density
- [ ] Test pagination
- [ ] Test virtual scrolling
- [ ] Test on mobile
- [ ] Test with keyboard only
- [ ] Test with screen reader
- [ ] Test in high contrast mode
- [ ] Test with reduced motion

---

## Common Use Cases

### Filter War Deities from Greek Mythology
```
1. Navigate to /browse/deities
2. Click "Greek" chip
3. Click "War" domain chip
4. Results: Zeus, Ares, Athena, etc.
```

### Find Dragons in Any Mythology
```
1. Navigate to /browse/creatures
2. Enter "dragon" in search
3. Results: All creatures with "dragon" in name/description
```

### Browse Recently Added Texts
```
1. Navigate to /browse/texts
2. Select "Recently Added" from sort dropdown
3. Results: Newest texts first
```

### View Detailed Deity Information
```
1. Navigate to /browse/deities
2. Click density button → Select "Detailed"
3. Hover over card for preview
4. Results: Full descriptions, all tags, hover previews
```

---

## Related Documentation

- **Full Documentation**: `BROWSE_VIEW_POLISH.md`
- **Visual Guide**: `BROWSE_VIEW_ENHANCEMENTS_SUMMARY.md`
- **Source Code**: `js/views/browse-category-view.js`
- **Style Guide**: See inline CSS in getStyles()

---

**Quick Reference Version**: 1.0
**Last Updated**: December 28, 2025
**Print**: This page is optimized for single-page printing
