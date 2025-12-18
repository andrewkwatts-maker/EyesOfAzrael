# Mythology Visualizations Guide

**Comprehensive guide to the Eyes of Azrael visualization system**

## Overview

The Eyes of Azrael visualization system provides six rich, interactive tools for exploring mythology through visual interfaces. Built with modern web technologies (D3.js, Three.js, Leaflet), these visualizations make complex mythological relationships and hierarchies accessible and engaging.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Visualizations](#visualizations)
   - [Family Tree Generator](#1-family-tree-generator)
   - [Relationship Graph](#2-relationship-graph)
   - [Geographic Mythology Map](#3-geographic-mythology-map)
   - [Historical Timeline](#4-historical-timeline)
   - [3D Constellation View](#5-3d-constellation-view)
   - [Pantheon Hierarchy](#6-pantheon-hierarchy)
3. [Technical Stack](#technical-stack)
4. [Data Structure](#data-structure)
5. [Integration Guide](#integration-guide)
6. [Customization](#customization)
7. [Performance Optimization](#performance-optimization)
8. [Accessibility](#accessibility)
9. [Browser Support](#browser-support)

---

## Architecture

### Directory Structure

```
visualizations/
├── visualization-utils.js      # Shared utilities and helper functions
├── family-tree.js              # Family tree visualization
├── relationship-graph.js       # Force-directed relationship graph
├── mythology-map.js            # Geographic map with timeline
├── timeline.js                 # Historical timeline
├── constellation-view.js       # 3D star map
├── pantheon-hierarchy.js       # Divine hierarchy trees
├── visualizations.html         # Main showcase page
└── visualizations.css          # Styling for all visualizations
```

### Core Components

**VisualizationUtils** - Shared utility class providing:
- Data loading from Firebase/static sources
- Color schemes and entity styling
- Zoom and pan controls
- Export functionality
- Tooltip creation
- Legend generation

---

## Visualizations

### 1. Family Tree Generator

**Purpose:** Display hierarchical family relationships between mythological entities with expandable/collapsible branches.

#### Features

- **Interactive Nodes:** Click to expand/collapse family branches
- **Multiple Mythologies:** Greek Titans → Olympians, Norse Ymir → Aesir/Vanir
- **Entity Details:** Double-click for full entity information
- **Visual Hierarchy:** Color-coded by entity type and generation
- **Export:** Save tree as PNG image

#### Usage

```javascript
const familyTree = new FamilyTreeGenerator('#container', {
    width: 1200,
    height: 800,
    nodeRadius: 30,
    levelHeight: 150,
    mythology: 'greek',  // or 'norse', 'egyptian', etc.
    startEntity: null    // Start from specific entity
});

familyTree.init();
```

#### Controls

- **Expand All:** Reveal entire family tree
- **Collapse All:** Show only root entities
- **Export:** Download as image
- **Reset View:** Return to initial zoom/position

#### Example Hierarchies

**Greek:**
```
Chaos → Gaia → Uranus → Titans → Olympians
```

**Norse:**
```
Ymir → Búri → Borr → Odin → Thor/Baldr
```

---

### 2. Relationship Graph

**Purpose:** Force-directed network visualization showing all entity relationships.

#### Features

- **Dynamic Layout:** Physics-based node positioning
- **Connection Types:** Parent, spouse, sibling, ally, enemy, created, killed
- **Interactive:** Drag nodes, click to highlight connections
- **Filtering:** By mythology, entity type, relationship type
- **Sizing:** Nodes sized by importance/connections

#### Usage

```javascript
const graph = new RelationshipGraph('#container', {
    width: 1200,
    height: 800,
    nodeSize: { min: 5, max: 30 },
    linkDistance: 100,
    chargeStrength: -300,
    mythology: 'all',
    relationshipTypes: ['all']  // or specific: ['parent', 'spouse']
});

graph.init();
```

#### Color Coding

- **Entity Types:**
  - Deity: Gold (#FFD700)
  - Hero: Red (#FF6B6B)
  - Creature: Teal (#4ECDC4)
  - Place: Mint (#95E1D3)
  - Item: Pink (#F38181)

- **Relationships:**
  - Parent: Red (#e74c3c)
  - Spouse: Pink (#e91e63)
  - Sibling: Purple (#9c27b0)
  - Ally: Blue (#2196f3)
  - Enemy: Red (#f44336)

#### Interactions

1. **Click Node:** Highlight all connected entities
2. **Drag Node:** Reposition manually
3. **Hover:** View entity details
4. **Pause/Resume:** Control physics simulation

---

### 3. Geographic Mythology Map

**Purpose:** Interactive world map showing mythology origins and cultural exchanges through time.

#### Features

- **Timeline Slider:** Explore from 3000 BCE to 2000 CE
- **Geographic Markers:** Key locations for each mythology
- **Migration Routes:** Cultural exchange paths with dashed lines
- **Animation:** Play button for automatic timeline progression
- **Filters:** Show/hide specific mythologies

#### Usage

```javascript
const map = new MythologyMap(container, {
    center: [30, 0],
    zoom: 2,
    showTimeline: true,
    showMigrations: true,
    timeRange: { start: -3000, end: 2000 }
});

map.init();
```

#### Mythology Locations

**Greek:** Athens, Olympia, Delphi, Delos
**Norse:** Norway, Sweden, Iceland, Denmark
**Egyptian:** Cairo, Luxor, Alexandria, Aswan
**Hindu:** Varanasi, Mumbai, Chennai, Agra
**Chinese:** Beijing, Xi'an, Shanghai, Chengdu
**Japanese:** Tokyo, Kyoto, Izumo, Ise
**Celtic:** Ireland, Scotland, Wales, Brittany
**Mayan:** Tikal, Chichen Itza, Uxmal, Palenque
**Aztec:** Tenochtitlan, Teotihuacan, Cholula, Tula

#### Migration Routes

- Indo-European Migration (4000-2000 BCE)
- Greek to Roman influence (500 BCE - 100 CE)
- Buddhist spread across Asia (500 BCE - 700 CE)
- Viking expansion (700-1100 CE)

---

### 4. Historical Timeline

**Purpose:** Chronological visualization of mythology periods, events, and cultural influences.

#### Features

- **Time Periods:** Major eras displayed as horizontal bands
- **Key Events:** Important dates marked with circles
- **Cultural Influences:** Arrows showing mythology exchanges
- **Filtering:** Focus on specific mythologies
- **Gridlines:** Easy date reference

#### Usage

```javascript
const timeline = new HistoricalTimeline('#container', {
    width: 1400,
    height: 600,
    timeRange: { start: -3000, end: 2000 },
    mythology: 'all'
});

timeline.init();
```

#### Event Types

- **Legendary:** Mythological events (Trojan War)
- **Historical:** Real events (First Olympics)
- **Literary:** Texts composed (Theogony, Eddas)
- **Religious:** Religious movements (Christianity, Islam)

#### Major Periods

- Sumerian Mythology (3500-2000 BCE)
- Egyptian Old Kingdom (2686-2181 BCE)
- Vedic Period (1500-500 BCE)
- Greek Archaic (800-480 BCE)
- Greek Classical (480-323 BCE)
- Roman Republic (509-27 BCE)
- Roman Empire (27 BCE - 476 CE)
- Viking Age (793-1066 CE)
- Mayan Classic (250-900 CE)
- Aztec Empire (1428-1521 CE)

---

### 5. 3D Constellation View

**Purpose:** Interactive 3D star map showing mythological constellations with their stories.

#### Features

- **3D Navigation:** Rotate, zoom, pan through space
- **Real Constellations:** Orion, Ursa Major, Cassiopeia, Andromeda, Perseus
- **Star Names:** Individual stars labeled
- **Auto-Rotation:** Optional automatic spinning
- **Mythological Stories:** Click constellations for their myths

#### Usage

```javascript
const constellations = new ConstellationView(container, {
    width: 1000,
    height: 700,
    autoRotate: true,
    mythology: 'greek',
    showStars: true,
    showConstellations: true
});

constellations.init();
```

#### Constellations

**Orion** - The great hunter
- Stars: Betelgeuse, Rigel, Bellatrix, Saiph, Belt stars
- Story: Placed among stars by Zeus

**Ursa Major** - The Great Bear
- Stars: Big Dipper stars (Dubhe, Merak, etc.)
- Story: Associated with Callisto

**Cassiopeia** - The vain queen
- Stars: W-shaped constellation
- Story: Mother of Andromeda

**Andromeda** - The chained maiden
- Story: Rescued by Perseus

**Perseus** - The hero
- Stars: Mirfak, Algol (the Demon Star)
- Story: Slayer of Medusa

#### Controls

- **Mouse Drag:** Rotate view
- **Mouse Wheel:** Zoom in/out
- **Pause/Resume:** Toggle auto-rotation
- **Reset View:** Return to initial position
- **Show/Hide Names:** Toggle constellation labels

---

### 6. Pantheon Hierarchy

**Purpose:** Tree diagrams showing divine power structures across mythologies.

#### Features

- **Multiple Layouts:** Tree, radial, sunburst
- **Mythology Support:** Greek, Norse, Egyptian, Hindu
- **Tier-Based Coloring:** Visual hierarchy by divine rank
- **Interactive Nodes:** Click for detailed information
- **Generational Display:** Clear parent-child relationships

#### Usage

```javascript
const pantheon = new PantheonHierarchy('#container', {
    width: 1200,
    height: 900,
    nodeSize: 60,
    mythology: 'greek',
    layout: 'tree'  // or 'radial', 'sunburst'
});

pantheon.init();
```

#### Mythological Structures

**Greek:**
```
Chaos (Primordial)
└── Gaia (Primordial)
    └── Uranus (Primordial)
        └── Titans (Titan)
            └── Cronus (Titan)
                ├── Zeus (Olympian)
                ├── Poseidon (Olympian)
                ├── Hades (Olympian)
                ├── Hera (Olympian)
                ├── Demeter (Olympian)
                └── Hestia (Olympian)
```

**Norse:**
```
Ymir (Primordial Giant)
└── Búri (First God)
    └── Borr (Second Generation)
        ├── Odin (Aesir) → Thor, Baldr
        ├── Vili (Aesir)
        └── Vé (Aesir)
```

**Egyptian (Ennead):**
```
Atum (Creator)
├── Shu (Air)
│   └── Geb (Earth) → Osiris, Isis, Set, Nephthys
└── Tefnut (Moisture)
    └── Nut (Sky)
```

**Hindu (Trimurti):**
```
Brahman (Ultimate Reality)
├── Brahma (Creation)
├── Vishnu (Preservation) → Rama, Krishna
└── Shiva (Destruction) → Ganesha, Kartikeya
```

#### Tier Colors

- Primordial: Purple (#9b59b6)
- Creator: Orange (#f39c12)
- Titan: Orange (#e67e22)
- Olympian: Blue (#3498db)
- Aesir: Red (#e74c3c)
- Vanir: Green (#2ecc71)
- Trimurti: Dark Red (#c0392b)

---

## Technical Stack

### Core Libraries

**D3.js (v7)**
- Used for: Tree layouts, force simulations, timeline, hierarchies
- Features: SVG manipulation, data binding, transitions
- CDN: `https://d3js.org/d3.v7.min.js`

**Three.js (r128)**
- Used for: 3D constellation visualization
- Features: WebGL rendering, 3D scene management, controls
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`

**Leaflet (1.9.4)**
- Used for: Geographic map rendering
- Features: Tile layers, markers, popups, controls
- CDN: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`

### Data Sources

1. **Firebase Firestore** (primary)
   - Real-time data loading
   - Collections: deities, places, creatures, items, texts

2. **Static JSON** (fallback)
   - `/data/mythology-graph-data.json`
   - Backup for offline/demo mode

---

## Data Structure

### Entity Schema

```javascript
{
  "id": "unique-id",
  "name": "Entity Name",
  "type": "deity|hero|creature|place|item",
  "mythology": "greek|norse|egyptian|hindu|etc",
  "domain": ["Array", "Of", "Domains"],
  "description": "Detailed description",
  "relationships": [
    {
      "targetId": "related-entity-id",
      "type": "parent|spouse|sibling|ally|enemy|created|killed",
      "description": "Relationship description"
    }
  ]
}
```

### Relationship Types

- **parent:** Parent-child relationship
- **spouse:** Married/partnered
- **sibling:** Brother/sister
- **ally:** Allied with
- **enemy:** Opposed to
- **created:** Creator relationship
- **killed:** Killer-victim
- **transformed:** Transformation relationship

---

## Integration Guide

### Basic Setup

1. **Include Dependencies:**

```html
<!-- D3.js -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- Leaflet -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
```

2. **Include Visualization Scripts:**

```html
<script src="/visualizations/visualization-utils.js"></script>
<script src="/visualizations/family-tree.js"></script>
<!-- Include others as needed -->
```

3. **Initialize Visualization:**

```html
<div id="my-visualization"></div>

<script>
const viz = new FamilyTreeGenerator('#my-visualization', {
    mythology: 'greek',
    width: 1200,
    height: 800
});

viz.init();
</script>
```

### Embedding in Existing Pages

```html
<div class="mythology-visualization">
    <h2>Family Tree</h2>
    <div id="family-tree-embed"></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const tree = new FamilyTreeGenerator('#family-tree-embed', {
        mythology: 'norse',
        width: 800,
        height: 600
    });
    tree.init();
});
</script>
```

---

## Customization

### Styling

Override CSS variables in `visualizations.css`:

```css
:root {
    --primary-color: #3498db;
    --secondary-color: #9b59b6;
    --success-color: #2ecc71;
    --warning-color: #f39c12;
    --danger-color: #e74c3c;
}
```

### Color Schemes

Modify entity colors in `VisualizationUtils.getEntityColor()`:

```javascript
static getEntityColor(type, mythology) {
    const typeColors = {
        deity: '#FFD700',
        hero: '#FF6B6B',
        // Add custom colors
    };
    return typeColors[type] || '#95a5a6';
}
```

### Data Loading

Override data loading in individual visualizations:

```javascript
class CustomFamilyTree extends FamilyTreeGenerator {
    async init() {
        this.data = await this.loadCustomData();
        this.buildTree();
        this.render();
    }

    async loadCustomData() {
        // Your custom data loading logic
        return customData;
    }
}
```

---

## Performance Optimization

### Large Datasets

**Family Tree:**
- Limit initial render to 3 generations
- Lazy-load expanded branches
- Virtualize off-screen nodes

**Relationship Graph:**
- Limit displayed nodes to 100-200
- Use quadtree for collision detection
- Implement LOD (Level of Detail)

**Timeline:**
- Aggregate events by decade for large ranges
- Only render visible time period
- Use canvas instead of SVG for 1000+ elements

### Rendering

```javascript
// Example: Limit nodes in relationship graph
const graph = new RelationshipGraph('#container', {
    maxNodes: 150,
    performanceMode: true
});
```

### Memory Management

```javascript
// Clean up on page unload
window.addEventListener('beforeunload', () => {
    // Stop animations
    if (constellation) constellation.renderer.dispose();

    // Remove event listeners
    graph.simulation.stop();
});
```

---

## Accessibility

### Keyboard Navigation

All visualizations support:
- **Tab:** Navigate between controls
- **Enter/Space:** Activate buttons
- **Arrow Keys:** Navigate nodes (where applicable)

### Screen Readers

Add ARIA labels:

```javascript
nodeGroup.attr('role', 'button')
    .attr('aria-label', d => `${d.data.name}, ${d.data.tier}`)
    .attr('tabindex', 0);
```

### Color Contrast

Ensure 4.5:1 contrast ratio:
- Text on backgrounds
- Link colors
- Button states

### Focus Indicators

```css
button:focus, .node:focus {
    outline: 3px solid var(--primary-color);
    outline-offset: 2px;
}
```

---

## Browser Support

### Minimum Requirements

- **Chrome:** 90+
- **Firefox:** 88+
- **Safari:** 14+
- **Edge:** 90+

### Feature Detection

```javascript
if (!window.d3) {
    console.error('D3.js not loaded');
    showErrorMessage('Visualization requires D3.js');
}

if (!window.THREE) {
    console.warn('Three.js not available, constellation view disabled');
}
```

### Fallbacks

```javascript
// SVG fallback for canvas
if (!canvas.getContext) {
    useSVGRenderer();
}

// Static image fallback
if (!supportsWebGL()) {
    showStaticImage();
}
```

---

## Examples

### Example 1: Custom Family Tree

```javascript
const greekOlympians = new FamilyTreeGenerator('#olympians', {
    mythology: 'greek',
    startEntity: 'zeus',
    nodeRadius: 40,
    onNodeClick: (entity) => {
        console.log('Clicked:', entity.name);
        showDetailPanel(entity);
    }
});

greekOlympians.init();
```

### Example 2: Filtered Relationship Graph

```javascript
const greekHeroes = new RelationshipGraph('#heroes', {
    mythology: 'greek',
    entityType: 'hero',
    relationshipTypes: ['ally', 'enemy'],
    linkDistance: 150
});

greekHeroes.init();
```

### Example 3: Timeline with Custom Events

```javascript
const customTimeline = new HistoricalTimeline('#timeline', {
    timeRange: { start: -1000, end: 500 }
});

// Add custom event
customTimeline.data.events.push({
    year: -323,
    name: 'Death of Alexander',
    mythology: 'greek',
    description: 'End of Hellenistic expansion',
    type: 'historical'
});

customTimeline.init();
```

---

## Troubleshooting

### Common Issues

**Issue:** Visualization not rendering
- Check browser console for errors
- Verify all dependencies loaded
- Ensure container element exists

**Issue:** Poor performance
- Reduce node count
- Disable auto-rotation
- Use performanceMode option

**Issue:** Data not loading
- Check Firebase configuration
- Verify JSON file path
- Check browser network tab

### Debug Mode

```javascript
const viz = new FamilyTreeGenerator('#container', {
    debug: true,  // Enables console logging
    showStats: true  // Shows performance stats
});
```

---

## Future Enhancements

### Planned Features

1. **Animation System:** Smooth transitions between time periods
2. **Comparison View:** Side-by-side mythology comparisons
3. **AR/VR Support:** Immersive constellation viewing
4. **Social Sharing:** Generate shareable visualization snapshots
5. **Collaborative Annotations:** User notes on entities
6. **Theme System:** Dark mode, high contrast, custom themes
7. **Data Export:** CSV, JSON, GraphML export
8. **Search Integration:** Find entities across visualizations
9. **Mobile Optimization:** Touch gestures, responsive layouts
10. **Narrative Mode:** Guided tours through mythology

---

## Support

### Documentation

- Main Guide: `/VISUALIZATIONS_GUIDE.md`
- API Reference: Coming soon
- Video Tutorials: Coming soon

### Contact

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Email: support@eyesofazrael.com

---

## License

Eyes of Azrael Visualization System
© 2024 All Rights Reserved

---

## Credits

**Libraries:**
- D3.js by Mike Bostock
- Three.js by Mr.doob
- Leaflet by Vladimir Agafonkin

**Data Sources:**
- Theoi Greek Mythology
- Norse Mythology for Smart People
- Ancient History Encyclopedia

**Design:**
- Color schemes inspired by ancient art
- Layout principles from information visualization research

---

*Last Updated: December 15, 2024*
