# Cosmology Diagram Renderer Documentation

## Overview

The **Cosmology Diagram Renderer** is an advanced SVG-based visualization system for displaying mythological cosmological structures. It provides interactive, responsive diagrams for various types of cosmic structures found across world mythologies.

## Features

### Diagram Types

1. **Tree Diagrams**
   - Hierarchical tree layouts (e.g., Yggdrasil, Tree of Life)
   - Automatic node positioning based on parent-child relationships
   - Supports branching structures with multiple levels

2. **Realm Maps**
   - Spatial layouts showing interconnected realms
   - Vertical layout (for layered cosmologies)
   - Horizontal layout (for journey-type cosmologies)
   - Customizable positioning and connections

3. **Genealogy Trees**
   - Family tree visualizations for divine lineages
   - Generation-based coloring
   - Partner relationship indicators
   - Multi-generational support

4. **Cosmic Layers**
   - Stacked layer visualizations (e.g., Seven Heavens)
   - Interactive layer information
   - Vertical arrangement with descriptions

### Interactive Features

- **Zoom & Pan Controls**
  - Mouse wheel zoom
  - Pinch-to-zoom on mobile devices
  - Click-and-drag panning
  - Reset view button

- **Node Interactions**
  - Click nodes to view detailed information
  - Hover effects with visual feedback
  - Tooltips with contextual information
  - Navigation to related pages

- **Export Capabilities**
  - Export diagrams as PNG images
  - Fullscreen mode for presentations
  - Print-optimized layouts

### Responsive Design

- Automatic scaling to container width
- Mobile-optimized touch interactions
- Adaptive node sizes for small screens
- Accessible keyboard navigation

### Firebase Integration

- Dynamic data loading from Firestore
- Real-time updates when data changes
- Fallback to static data structures
- Supports custom mythology structures

## Installation

### Dependencies

1. **D3.js v7+** - Required for SVG manipulation
```html
<script src="https://d3js.org/d3.v7.min.js"></script>
```

2. **Firebase (Optional)** - For dynamic data loading
```html
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
```

3. **Theme System** - For consistent styling
```html
<link rel="stylesheet" href="themes/theme-base.css">
<link rel="stylesheet" href="css/cosmology-diagrams.css">
```

### Files Required

```
js/components/cosmology-diagram-renderer.js
css/cosmology-diagrams.css
```

## Usage

### Basic HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cosmology Diagram Example</title>

    <!-- Styles -->
    <link rel="stylesheet" href="themes/theme-base.css">
    <link rel="stylesheet" href="css/cosmology-diagrams.css">

    <!-- D3.js -->
    <script src="https://d3js.org/d3.v7.min.js"></script>

    <!-- Cosmology Renderer -->
    <script defer src="js/components/cosmology-diagram-renderer.js"></script>
</head>
<body>
    <!-- Diagram Container -->
    <div data-cosmology-diagram
         data-type="tree"
         data-mythology="norse"
         data-structure="yggdrasil"></div>
</body>
</html>
```

### HTML Attributes

#### Required Attributes

- `data-cosmology-diagram` - Marks the element as a diagram container
- `data-type` - Type of diagram to render
  - `tree` - Hierarchical tree layout
  - `realm_map` - Spatial realm layout
  - `genealogy` - Family tree layout
  - `cosmic_layers` - Stacked layer layout
- `data-mythology` - Mythology namespace (e.g., "norse", "greek", "jewish")
- `data-structure` - Specific structure name within the mythology

#### Optional Attributes

- `data-entity-id` - Firebase entity ID for dynamic loading

### Predefined Structures

#### Norse Mythology

**Yggdrasil (Tree)**
```html
<div data-cosmology-diagram
     data-type="tree"
     data-mythology="norse"
     data-structure="yggdrasil"></div>
```

**Nine Realms (Realm Map)**
```html
<div data-cosmology-diagram
     data-type="realm_map"
     data-mythology="norse"
     data-structure="nine_realms"></div>
```

#### Jewish Kabbalah

**Tree of Life (Tree)**
```html
<div data-cosmology-diagram
     data-type="tree"
     data-mythology="jewish"
     data-structure="tree_of_life"></div>
```

#### Greek Mythology

**Underworld (Realm Map)**
```html
<div data-cosmology-diagram
     data-type="realm_map"
     data-mythology="greek"
     data-structure="underworld"></div>
```

**Olympian Genealogy (Genealogy)**
```html
<div data-cosmology-diagram
     data-type="genealogy"
     data-mythology="greek"
     data-structure="olympian_genealogy"></div>
```

#### Egyptian Mythology

**Duat Journey (Realm Map)**
```html
<div data-cosmology-diagram
     data-type="realm_map"
     data-mythology="egyptian"
     data-structure="duat"></div>
```

## Data Structure

### Tree Diagram Format

```javascript
{
    type: 'tree',
    name: 'Structure Name',
    description: 'Description of the structure',
    root: {
        name: 'Root Node',
        type: 'node_type',
        color: '#HEXCOLOR',
        description: 'Node description',
        children: [
            {
                name: 'Child Node 1',
                color: '#HEXCOLOR',
                children: [...]
            },
            {
                name: 'Child Node 2',
                color: '#HEXCOLOR'
            }
        ]
    },
    paths: [  // Optional - for special connections
        { from: 'Node1', to: 'Node2', number: 11 }
    ]
}
```

### Realm Map Format

```javascript
{
    type: 'realm_map',
    name: 'Map Name',
    description: 'Description',
    layout: 'vertical' | 'horizontal',
    realms: [
        {
            name: 'Realm Name',
            level: 0,  // For vertical layout
            x: 50,     // Percentage (0-100)
            y: 50,     // Percentage (0-100)
            color: '#HEXCOLOR',
            description: 'Realm description',
            ruler: 'Deity Name',
            inhabitants: ['Entity1', 'Entity2']
        }
    ],
    connections: [  // Optional
        {
            from: 'Realm1',
            to: 'Realm2',
            type: 'connection_type',
            description: 'Connection description'
        }
    ]
}
```

### Genealogy Format

```javascript
{
    type: 'genealogy',
    name: 'Family Tree Name',
    description: 'Description',
    root: {
        name: 'Ancestor',
        generation: 0,
        partner: 'Spouse Name',  // Optional
        domain: ['Domain1', 'Domain2'],  // Optional
        children: [
            {
                name: 'Child',
                generation: 1,
                children: [...]
            }
        ]
    }
}
```

### Cosmic Layers Format

```javascript
{
    type: 'cosmic_layers',
    name: 'Layer Structure Name',
    description: 'Description',
    layers: [
        {
            name: 'Layer Name',
            level: 0,
            color: '#HEXCOLOR',
            description: 'Layer description',
            inhabitants: ['Entity1', 'Entity2']
        }
    ]
}
```

## Firebase Integration

### Firestore Structure

Store cosmology data in Firestore at:
```
entities/{mythology}/cosmology/{entityId}
```

Example path:
```
entities/norse/cosmology/yggdrasil
```

### Document Format

The document should contain the same data structure as the predefined formats above.

### Loading Firebase Data

```html
<!-- Add entity-id attribute -->
<div data-cosmology-diagram
     data-type="tree"
     data-mythology="norse"
     data-structure="yggdrasil"
     data-entity-id="yggdrasil"></div>
```

## Customization

### Styling

Override CSS variables in your stylesheet:

```css
/* Container styling */
.cosmology-diagram-container {
    --diagram-bg: rgba(var(--color-bg-rgb), 0.95);
    --diagram-border: var(--color-primary);
}

/* Node styling */
.cosmology-svg .node circle {
    /* Your custom styles */
}

/* Control buttons */
.btn-control {
    /* Your custom styles */
}
```

### Configuration

Modify the renderer configuration by accessing the global instance:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const renderer = window.CosmologyDiagramRenderer;

    // Customize configuration
    renderer.config.nodeRadius = 50;
    renderer.config.fontSize = 14;
    renderer.config.linkColor = '#FF5733';
});
```

## Advanced Usage

### Manual Initialization

```javascript
const renderer = new CosmologyDiagramRenderer();
await renderer.initFirebase();

const element = document.getElementById('my-diagram');
await renderer.initialize(element);
```

### Custom Data Loading

```javascript
const renderer = new CosmologyDiagramRenderer();

// Define custom structure
const customData = {
    type: 'tree',
    name: 'Custom Tree',
    root: {
        name: 'Root',
        children: [...]
    }
};

// Render directly
await renderer.renderTree(element, customData, {
    mythology: 'custom',
    structure: 'custom_tree'
});
```

### Event Handling

```javascript
// Override node click handler
const originalHandler = renderer.handleNodeClick;
renderer.handleNodeClick = function(event, node, options) {
    console.log('Node clicked:', node.data.name);
    originalHandler.call(this, event, node, options);
};
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Firefox Mobile
- **Requirements**: SVG support, ES6+ JavaScript

## Accessibility

- Keyboard navigation support
- ARIA labels for interactive elements
- High contrast mode support
- Screen reader compatible
- Focus indicators

## Performance

- Optimized SVG rendering
- Efficient zoom/pan with hardware acceleration
- Lazy loading for large structures
- Debounced resize handlers
- Minimal reflows

## Troubleshooting

### Diagram Not Rendering

1. Check console for errors
2. Verify D3.js is loaded before renderer
3. Ensure all required attributes are present
4. Check that mythology/structure exists

### Firebase Not Loading

1. Verify Firebase is initialized
2. Check Firestore security rules
3. Ensure document path is correct
4. Check browser console for Firebase errors

### Zoom/Pan Not Working

1. Ensure D3.js v7+ is loaded
2. Check for JavaScript errors
3. Verify SVG container is properly sized
4. Test in different browser

## Examples

See `COSMOLOGY_DIAGRAM_EXAMPLES.html` for complete working examples of all diagram types.

## API Reference

### CosmologyDiagramRenderer Class

#### Methods

**initFirebase()**
- Initializes Firebase connection
- Returns: `Promise<boolean>`

**initializeAll()**
- Initializes all diagram elements on page
- Returns: `Promise<void>`

**initialize(element)**
- Initializes a single diagram element
- Parameters: `element` (HTMLElement)
- Returns: `Promise<void>`

**renderTree(element, data, options)**
- Renders tree diagram
- Parameters:
  - `element` (HTMLElement)
  - `data` (Object)
  - `options` (Object)
- Returns: `Promise<void>`

**renderRealmMap(element, data, options)**
- Renders realm map diagram
- Parameters: Same as renderTree
- Returns: `Promise<void>`

**renderGenealogy(element, data, options)**
- Renders genealogy tree
- Parameters: Same as renderTree
- Returns: `Promise<void>`

**renderCosmicLayers(element, data, options)**
- Renders cosmic layers diagram
- Parameters: Same as renderTree
- Returns: `Promise<void>`

**exportDiagram(container, filename)**
- Exports diagram as PNG
- Parameters:
  - `container` (HTMLElement)
  - `filename` (String)
- Returns: `Promise<void>`

## License

Part of the Eyes of Azrael project.

## Contributing

To add new predefined structures:

1. Edit `getPredefinedStructure()` method
2. Add mythology and structure to the structures object
3. Follow existing data format conventions
4. Test thoroughly across devices

## Support

For issues or questions:
- Check existing examples
- Review this documentation
- Inspect browser console for errors
- Test with simplified data structure
