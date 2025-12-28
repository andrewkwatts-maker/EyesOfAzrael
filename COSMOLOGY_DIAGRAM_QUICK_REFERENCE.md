# Cosmology Diagram Renderer - Quick Reference

## Basic Setup (3 Steps)

### 1. Include Dependencies
```html
<!-- CSS -->
<link rel="stylesheet" href="css/cosmology-diagrams.css">

<!-- JavaScript -->
<script src="https://d3js.org/d3.v7.min.js"></script>
<script defer src="js/components/cosmology-diagram-renderer.js"></script>
```

### 2. Add Diagram Element
```html
<div data-cosmology-diagram
     data-type="tree"
     data-mythology="norse"
     data-structure="yggdrasil"></div>
```

### 3. Done!
The diagram automatically renders when the page loads.

---

## All Diagram Types

### Tree Diagrams
```html
<!-- Yggdrasil (Norse World Tree) -->
<div data-cosmology-diagram
     data-type="tree"
     data-mythology="norse"
     data-structure="yggdrasil"></div>

<!-- Tree of Life (Kabbalah) -->
<div data-cosmology-diagram
     data-type="tree"
     data-mythology="jewish"
     data-structure="tree_of_life"></div>
```

### Realm Maps (Vertical)
```html
<!-- Nine Realms -->
<div data-cosmology-diagram
     data-type="realm_map"
     data-mythology="norse"
     data-structure="nine_realms"></div>

<!-- Greek Underworld -->
<div data-cosmology-diagram
     data-type="realm_map"
     data-mythology="greek"
     data-structure="underworld"></div>
```

### Realm Maps (Horizontal)
```html
<!-- Egyptian Duat Journey -->
<div data-cosmology-diagram
     data-type="realm_map"
     data-mythology="egyptian"
     data-structure="duat"></div>
```

### Genealogy Trees
```html
<!-- Olympian Family Tree -->
<div data-cosmology-diagram
     data-type="genealogy"
     data-mythology="greek"
     data-structure="olympian_genealogy"></div>
```

---

## Available Structures

| Mythology | Structure | Type | Description |
|-----------|-----------|------|-------------|
| norse | yggdrasil | tree | World Tree with 9 realms |
| norse | nine_realms | realm_map | Spatial arrangement of realms |
| jewish | tree_of_life | tree | Kabbalistic Sefirot |
| greek | underworld | realm_map | Hades and afterlife regions |
| greek | olympian_genealogy | genealogy | Chaos to Olympians |
| egyptian | duat | realm_map | 12-hour underworld journey |

---

## HTML Attributes

| Attribute | Required | Values | Description |
|-----------|----------|--------|-------------|
| `data-cosmology-diagram` | ✅ | - | Marks element as diagram |
| `data-type` | ✅ | tree, realm_map, genealogy, cosmic_layers | Diagram type |
| `data-mythology` | ✅ | norse, greek, jewish, egyptian, etc. | Mythology namespace |
| `data-structure` | ✅ | yggdrasil, tree_of_life, etc. | Structure name |
| `data-entity-id` | ❌ | any string | Firebase entity ID |

---

## User Controls

### Mouse Controls
- **Zoom**: Scroll wheel
- **Pan**: Click and drag
- **Node Info**: Click any node
- **Close Modal**: Click outside or ×

### Touch Controls (Mobile)
- **Zoom**: Pinch gesture
- **Pan**: One finger drag
- **Node Info**: Tap any node

### Buttons
- **Reset View**: Restore default zoom/position
- **Export PNG**: Download as image
- **Fullscreen**: Toggle fullscreen mode

---

## Firebase Integration

### Firestore Structure
```
entities/
  {mythology}/
    cosmology/
      {entityId}
```

### Example Path
```
entities/norse/cosmology/yggdrasil
```

### Enable Firebase Loading
```html
<div data-cosmology-diagram
     data-type="tree"
     data-mythology="norse"
     data-structure="yggdrasil"
     data-entity-id="yggdrasil"></div>
```

---

## Custom Data Structure

### Tree Format
```javascript
{
  type: 'tree',
  name: 'My Tree',
  root: {
    name: 'Root Node',
    color: '#3498DB',
    children: [
      { name: 'Child 1', color: '#E74C3C' },
      { name: 'Child 2', color: '#2ECC71' }
    ]
  }
}
```

### Realm Map Format
```javascript
{
  type: 'realm_map',
  name: 'My Realms',
  layout: 'vertical',
  realms: [
    {
      name: 'Heaven',
      level: 2,
      x: 50,
      y: 10,
      color: '#F1C40F'
    },
    {
      name: 'Earth',
      level: 1,
      x: 50,
      y: 50,
      color: '#2ECC71'
    }
  ]
}
```

---

## Styling Customization

### Override Colors
```css
.cosmology-diagram-container {
  --diagram-border: #FF5733;
}

.cosmology-svg .node circle {
  stroke: #FFD700;
  stroke-width: 4px;
}
```

### Change Sizes
```javascript
const renderer = window.CosmologyDiagramRenderer;
renderer.config.nodeRadius = 50;
renderer.config.fontSize = 14;
```

---

## Common Issues

### Diagram Not Showing
✅ Check D3.js loaded before renderer
✅ Verify all attributes present
✅ Check browser console for errors
✅ Ensure container has width

### Firebase Not Loading
✅ Check Firebase initialized
✅ Verify correct Firestore path
✅ Check security rules
✅ Confirm entity-id matches document

### Zoom Not Working
✅ Update to D3.js v7+
✅ Check for JavaScript errors
✅ Test in different browser
✅ Verify SVG element created

---

## Browser Support

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Mobile Chrome/Safari
❌ Internet Explorer

---

## File Locations

```
js/components/cosmology-diagram-renderer.js
css/cosmology-diagrams.css
COSMOLOGY_DIAGRAM_EXAMPLES.html
COSMOLOGY_DIAGRAM_RENDERER_DOCUMENTATION.md
```

---

## Performance Tips

1. **Limit nodes**: Keep under 100 for best performance
2. **Use static data**: Faster than Firebase loading
3. **Defer scripts**: Use `defer` attribute
4. **Minimize reflows**: Set container width explicitly
5. **Mobile**: Reduce node count for small screens

---

## Accessibility

✅ Keyboard navigation (Tab, Enter)
✅ Screen reader compatible
✅ High contrast mode
✅ Reduced motion support
✅ Focus indicators

---

## Export Options

### PNG Export
- Click "Export PNG" button
- Downloads diagram as image
- White background for printing
- Resolution matches screen

### Fullscreen Mode
- Click "Fullscreen" button
- Press Escape to exit
- Ideal for presentations
- Works on mobile

---

## Adding New Structures

1. Edit `cosmology-diagram-renderer.js`
2. Find `getPredefinedStructure()` method
3. Add to appropriate mythology:

```javascript
{
  mythology: {
    new_structure: {
      type: 'tree',
      name: 'My Structure',
      root: { ... }
    }
  }
}
```

4. Use in HTML:

```html
<div data-cosmology-diagram
     data-type="tree"
     data-mythology="mythology"
     data-structure="new_structure"></div>
```

---

## Complete Example Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cosmology Diagram</title>

  <!-- Styles -->
  <link rel="stylesheet" href="themes/theme-base.css">
  <link rel="stylesheet" href="css/cosmology-diagrams.css">

  <!-- D3.js -->
  <script src="https://d3js.org/d3.v7.min.js"></script>

  <!-- Renderer -->
  <script defer src="js/components/cosmology-diagram-renderer.js"></script>
</head>
<body>
  <h1>Yggdrasil - The World Tree</h1>

  <!-- Diagram -->
  <div data-cosmology-diagram
       data-type="tree"
       data-mythology="norse"
       data-structure="yggdrasil"></div>
</body>
</html>
```

---

## Get Help

📖 **Full Documentation**: `COSMOLOGY_DIAGRAM_RENDERER_DOCUMENTATION.md`
🎯 **Examples**: `COSMOLOGY_DIAGRAM_EXAMPLES.html`
🔧 **Implementation**: `COSMOLOGY_DIAGRAM_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
