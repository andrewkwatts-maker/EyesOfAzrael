# Grid Panel System Design

## Overview

A hierarchical panel system where panels can contain grids, and grids can contain sub-panels, links, searches, and images.

## Panel Structure

```javascript
{
  type: 'panel' | 'grid',
  title: string,
  content: string,
  order: number,  // Sequential order at this level

  // For grid panels
  gridWidth: number,  // Number of columns (e.g., 7 for 7-wide)
  children: [
    {
      type: 'panel' | 'link' | 'search' | 'image',
      order: number,
      // ... type-specific properties
    }
  ]
}
```

## Hierarchy

```
Root Level (Sequential)
├─ Panel 1 (Simple text panel)
├─ Grid 2 (7-wide)
│  ├─ Sub-Panel A
│  ├─ Sub-Panel B
│  ├─ Link C
│  ├─ Search D
│  └─ Image E
├─ Panel 3 (Simple text panel)
└─ Grid 4 (3-wide)
   ├─ Sub-Panel X
   ├─ Sub-Panel Y
   └─ Sub-Panel Z
```

## Panel Types

### 1. Simple Panel
```javascript
{
  type: 'panel',
  title: 'Panel Title',
  content: 'Panel content text',
  order: 0,
  children: [] // Empty for simple panels
}
```

### 2. Grid Panel
```javascript
{
  type: 'grid',
  title: 'Grid Container',
  gridWidth: 7,  // 7 columns
  order: 1,
  children: [
    // Sub-panels auto-size within grid constraints
    // e.g., 7 items in 7-wide = 1 per column
    // 14 items in 7-wide = 2 rows, 7 per row
  ]
}
```

### 3. Link Item (within grid)
```javascript
{
  type: 'link',
  text: 'Link Text',
  url: '/path/to/page.html',
  order: 0
}
```

### 4. Search Item (within grid)
```javascript
{
  type: 'search',
  term: 'Zeus',
  searchType: 'corpus' | 'page',
  order: 1
}
```

### 5. Image Item (within grid)
```javascript
{
  type: 'image',
  url: 'https://imgur.com/image.jpg',
  caption: 'Image caption',
  alt: 'Alt text',
  order: 2
}
```

## UI Controls

### Root Level Controls
```
[Add Simple Panel] [Add Grid Panel]

Panel 1 Title
Content here...
[↑] [↓] [Edit] [Delete]

Grid 2 (7-wide)
[Contains 5 items]
[↑] [↓] [Edit Grid] [Delete]
  Sub-Panel A [←][→][Edit][Delete]
  Sub-Panel B [←][→][Edit][Delete]
  Link C [←][→][Edit][Delete]
  Search D [←][→][Edit][Delete]
  Image E [←][→][Edit][Delete]
  [Add Panel] [Add Link] [Add Search] [Add Image]
```

### Reordering

**Root Level (Sequential):**
- ↑ Move panel up in sequence
- ↓ Move panel down in sequence

**Grid Children (Left/Right within grid):**
- ← Move item left in grid
- → Move item right in grid

## Auto-Sizing

Grid items auto-size based on:
```javascript
itemsPerRow = gridWidth
rowsNeeded = Math.ceil(totalItems / gridWidth)
itemWidth = 100% / itemsPerRow
```

Example: 7-wide grid with 10 items
- Row 1: 7 items (100% / 7 = ~14.3% each)
- Row 2: 3 items (100% / 7 = ~14.3% each, 4 empty spaces)

## CSS Grid Implementation

```css
.grid-panel {
  display: grid;
  grid-template-columns: repeat(var(--grid-width), 1fr);
  gap: 1rem;
}

.grid-item {
  /* Auto-placed in grid */
  min-height: 100px;
}

/* For 7-wide grid */
.grid-panel[data-width="7"] {
  --grid-width: 7;
}
```

## Data Structure Example

```javascript
{
  panels: [
    {
      type: 'panel',
      title: 'Introduction',
      content: 'This theory explores...',
      order: 0,
      children: []
    },
    {
      type: 'grid',
      title: 'Related Deities',
      gridWidth: 7,
      order: 1,
      children: [
        {
          type: 'panel',
          title: 'Zeus',
          content: 'King of gods',
          order: 0
        },
        {
          type: 'link',
          text: 'Zeus Page',
          url: '/mythos/greek/deities/zeus.html',
          order: 1
        },
        {
          type: 'search',
          term: 'Zeus',
          searchType: 'corpus',
          order: 2
        },
        {
          type: 'image',
          url: 'https://example.com/zeus.jpg',
          caption: 'Zeus with thunderbolt',
          alt: 'Zeus statue',
          order: 3
        }
      ]
    },
    {
      type: 'panel',
      title: 'Conclusion',
      content: 'In summary...',
      order: 2,
      children: []
    }
  ]
}
```

## Implementation Files

1. `js/components/grid-panel-editor.js` - Grid panel creation/editing
2. `js/components/panel-reorder.js` - Drag/drop and arrow reordering
3. Update `js/components/theory-editor.js` - Integrate grid system
4. Update `css/theory-editor.css` - Grid styling

## User Workflow

1. User clicks "Add Grid Panel"
2. Modal appears: "Grid Width: [7] columns"
3. Grid created with controls
4. Within grid, user clicks "Add Panel" / "Add Link" / "Add Search" / "Add Image"
5. Items appear in grid, auto-sized
6. User can reorder with ← → arrows
7. Root-level panels use ↑ ↓ arrows
