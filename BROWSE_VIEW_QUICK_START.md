# Browse View - Quick Start Guide

## TL;DR

Production-ready browse view with all user interaction features integrated. Glass-morphism design, 60fps animations, WCAG AA accessible.

---

## Installation

### 1. Include CSS
```html
<link rel="stylesheet" href="/css/browse-category-polished.css">
```

### 2. Include Dependencies
```html
<!-- Services -->
<script src="/js/services/asset-service.js"></script>
<script src="/js/services/vote-service.js"></script>

<!-- Components -->
<script src="/js/components/content-filter.js"></script>
<script src="/js/components/sort-selector.js"></script>
<script src="/js/components/add-entity-card.js"></script>
<script src="/js/components/vote-buttons.js"></script>

<!-- Browse View -->
<script src="/js/views/browse-category-view-polished.js"></script>
```

### 3. Initialize
```javascript
const browseView = new BrowseCategoryViewPolished(firestore);

await browseView.render(container, {
    category: 'deities',      // Required: entity type
    mythology: 'greek'        // Optional: filter by mythology
});
```

---

## Features at a Glance

| Feature | Agent | Description |
|---------|-------|-------------|
| **Add Button** | 6 | Authenticated users can add entities |
| **Vote Buttons** | 8 | Real-time voting with optimistic UI |
| **Content Filter** | 9 | Toggle standard vs. community content |
| **Sort Selector** | 10 | 5 sort modes (votes, contested, recent, A-Z) |
| **Edit Icons** | - | Owner-only edit access |
| **Badges** | - | Community, contested visual indicators |
| **Search** | - | Debounced live search (300ms) |
| **Quick Filters** | - | Chip-based mythology/domain filters |
| **View Modes** | - | Grid or list layout |
| **Density** | - | Compact, comfortable, or detailed |
| **Pagination** | - | Smart pagination with ellipsis |

---

## User Interaction Flow

```
┌─────────────────────────────────────────────────┐
│  [+ Add Deity]  [Community: OFF]  [Sort: Votes]│ ← Controls
├─────────────────────────────────────────────────┤
│  [Greek] [Roman] [Norse] [Egyptian] ...        │ ← Quick Filters
├─────────────────────────────────────────────────┤
│  [🔍 Search...]         [Grid] [List] [•••]    │ ← Search & View
├─────────────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐           │
│  │Zeus │  │Hera │  │Pose.│  │Athe.│           │ ← Entity Cards
│  │ ⬆127│  │ ⬆89 │  │ ⬆156│  │ ⬆201│           │   (with votes)
│  └─────┘  └─────┘  └─────┘  └─────┘           │
├─────────────────────────────────────────────────┤
│          [← Prev] [1] [2] [3] ... [Next →]     │ ← Pagination
└─────────────────────────────────────────────────┘
```

---

## Code Examples

### Basic Usage
```javascript
const view = new BrowseCategoryViewPolished(window.db);
await view.render(document.getElementById('app'), {
    category: 'deities'
});
```

### With Mythology Filter
```javascript
await view.render(container, {
    category: 'deities',
    mythology: 'norse'  // Only Norse deities
});
```

### Cleanup (SPA)
```javascript
view.destroy(); // Clean up timers, listeners
```

---

## Responsive Breakpoints

| Screen Size | Columns | Example Devices |
|-------------|---------|-----------------|
| **1200px+** | 4-5 | Desktop monitors |
| **768-1199px** | 3 | Tablets, small laptops |
| **480-767px** | 1 | Phones (landscape) |
| **<480px** | 1 | Phones (portrait) |

**Grid auto-adjusts** using `repeat(auto-fill, minmax(280px, 1fr))`

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Tab** | Navigate to next element |
| **Shift+Tab** | Navigate to previous element |
| **Enter** | Activate button/link |
| **Space** | Toggle checkbox/chip |
| **Escape** | Close menu/modal |
| **Arrow Keys** | Navigate within menu |

---

## Component APIs

### Add Entity Card
```javascript
new AddEntityCard({
    containerId: 'addContainer',
    entityType: 'deities',
    mythology: 'greek',
    label: 'Add Deity'
});
```

### Content Filter
```javascript
new ContentFilter({
    container: element,
    category: 'deities',
    mythology: 'greek',
    onToggle: (showUserContent) => { /* reload */ }
});
```

### Sort Selector
```javascript
new SortSelector(container, {
    defaultSort: 'votes-desc',
    onSortChange: (sortBy) => { /* re-sort */ }
});
```

### Vote Buttons
```javascript
// Auto-initialized on cards with data attributes:
<div data-item-id="zeus-001"
     data-item-type="deities"
     data-upvotes="127"
     data-downvotes="85">
</div>
```

---

## Customization

### Change Color Scheme
```css
:root {
    --color-primary: #your-color;
    --color-secondary: #your-color;
}
```

### Adjust Animation Speed
```css
:root {
    --transition-base: 0.5s ease; /* Default: 0.3s */
}
```

### Modify Grid Columns
```css
.entity-grid.grid-view {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    /* Default: 280px */
}
```

---

## Troubleshooting

### Cards Not Rendering
**Check:** Is Firebase initialized?
```javascript
await window.waitForFirebase();
```

### Hover Effects Not Smooth
**Check:** GPU acceleration enabled?
```css
.entity-card {
    will-change: transform; /* Should be present */
}
```

### Backdrop Filter Not Working (Firefox)
**Fix:** Enable flag in `about:config`
```
layout.css.backdrop-filter.enabled = true
```

### Vote Buttons Not Showing
**Check:** Are vote components initialized?
```javascript
this.initializeVoteButtons(); // Called in updateGrid()
```

---

## Performance Tips

1. **Use Virtual Scrolling** for 100+ items (auto-enabled)
2. **Lazy Load Images** with `loading="lazy"` (default)
3. **Debounce Search** at 300ms (default)
4. **GPU Accelerate** animations with `transform` (default)
5. **Minimize Re-renders** by batching state updates

---

## Browser Support

| Browser | Min Version | Status |
|---------|-------------|--------|
| Chrome | 90 | ✅ Full |
| Firefox | 88 | ⚠️ Flag required |
| Safari | 14 | ✅ Full |
| Edge | 90 | ✅ Full |

**IE11:** Not supported (show upgrade message)

---

## Accessibility Checklist

- ✅ Keyboard navigation works
- ✅ Screen reader announces changes
- ✅ Focus indicators visible
- ✅ Color contrast WCAG AA
- ✅ Touch targets 44x44px
- ✅ ARIA labels on all buttons
- ✅ High contrast mode support
- ✅ Reduced motion support

---

## Testing

### Run Integration Tests
```javascript
const tests = new BrowseViewIntegrationTests();
await tests.runAllTests();
```

### Manual Testing Checklist
```
□ Click add button (authenticated)
□ Toggle content filter
□ Change sort mode
□ Click vote buttons
□ Use search
□ Toggle quick filters
□ Switch view mode
□ Change density
□ Navigate pages
□ Test keyboard nav
```

---

## File Sizes

| File | Size | Gzipped |
|------|------|---------|
| JS | 72 KB | 18 KB |
| CSS | 45 KB | 9 KB |
| **Total** | **117 KB** | **27 KB** |

**Load Impact:** Minimal (loads once, cached)

---

## Common Tasks

### Get Current Filters
```javascript
const filters = {
    search: view.searchTerm,
    mythologies: Array.from(view.selectedMythologies),
    domains: Array.from(view.selectedDomains)
};
```

### Programmatically Set Sort
```javascript
view.sortSelector.setSort('recent');
```

### Reload Data
```javascript
await view.reloadEntities();
```

### Export Current View
```javascript
const entities = view.filteredEntities;
console.log(JSON.stringify(entities, null, 2));
```

---

## Links

- **Full Documentation:** `BROWSE_VIEW_UI_POLISH.md`
- **Integration Report:** `AGENT_11_BROWSE_POLISH_REPORT.md`
- **Test Suite:** `tests/browse-view-integration-tests.js`
- **Source Code:**
  - JS: `js/views/browse-category-view-polished.js`
  - CSS: `css/browse-category-polished.css`

---

## Support

**Issues?** Check the troubleshooting section above.

**Feature Requests?** See "Future Enhancements" in the full report.

**Performance Issues?** Enable debug mode:
```javascript
window.BrowseCategoryViewPolished.DEBUG = true;
```

---

**Last Updated:** 2025-12-29
**Version:** 1.0.0
**Status:** Production-Ready ✅
