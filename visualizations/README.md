# Mythology Visualizations

Interactive visual tools for exploring mythology through data visualization.

## 🚀 Quick Start

### View Demo

Open `/visualizations/visualizations.html` in your browser to see all visualizations.

### Embed in Your Page

```html
<!-- Include dependencies -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- Include visualization -->
<script src="/visualizations/visualization-utils.js"></script>
<script src="/visualizations/family-tree.js"></script>

<!-- Create container -->
<div id="my-tree"></div>

<!-- Initialize -->
<script>
const tree = new FamilyTreeGenerator('#my-tree', {
    mythology: 'greek',
    width: 1200,
    height: 800
});
tree.init();
</script>
```

## 📊 Available Visualizations

### 1. Family Tree Generator
```javascript
new FamilyTreeGenerator(container, options)
```
Interactive collapsible family trees showing divine lineages.

### 2. Relationship Graph
```javascript
new RelationshipGraph(container, options)
```
Force-directed network of entity relationships.

### 3. Mythology Map
```javascript
new MythologyMap(container, options)
```
Geographic map with timeline showing mythology origins.

### 4. Historical Timeline
```javascript
new HistoricalTimeline(container, options)
```
Chronological view of mythology periods and events.

### 5. 3D Constellation View
```javascript
new ConstellationView(container, options)
```
Interactive 3D star map with mythological constellations.

### 6. Pantheon Hierarchy
```javascript
new PantheonHierarchy(container, options)
```
Tree diagrams of divine power structures.

## 📚 Documentation

See `/VISUALIZATIONS_GUIDE.md` for comprehensive documentation including:
- Detailed feature descriptions
- Code examples
- Integration guides
- Customization options
- Performance tips

## 🎨 Customization

### Change Colors

Edit `visualization-utils.js`:
```javascript
static getEntityColor(type, mythology) {
    const typeColors = {
        deity: '#FFD700',  // Change to your color
        // ...
    };
}
```

### Adjust Layout

Pass options to constructor:
```javascript
const tree = new FamilyTreeGenerator('#tree', {
    nodeRadius: 40,      // Larger nodes
    levelHeight: 200,    // More spacing
    mythology: 'norse'   // Different mythology
});
```

## 🔧 Requirements

### Libraries
- D3.js v7+
- Leaflet 1.9+ (for map)
- Three.js r128+ (for 3D)

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📁 Files

```
visualizations/
├── visualization-utils.js      # Shared utilities
├── family-tree.js              # Family tree viz
├── relationship-graph.js       # Relationship graph
├── mythology-map.js            # Geographic map
├── timeline.js                 # Historical timeline
├── constellation-view.js       # 3D constellation
├── pantheon-hierarchy.js       # Pantheon hierarchy
├── visualizations.html         # Showcase page
├── visualizations.css          # Styles
└── README.md                   # This file
```

## 🐛 Troubleshooting

**Visualization not showing?**
- Check browser console for errors
- Verify all dependencies loaded
- Ensure container element exists

**Poor performance?**
- Reduce number of nodes
- Disable auto-rotation
- Use static JSON instead of Firebase

**Data not loading?**
- Check Firebase configuration
- Verify `/data/mythology-graph-data.json` exists
- Check network tab in dev tools

## 📞 Support

- Full Guide: `/VISUALIZATIONS_GUIDE.md`
- Issues: GitHub Issues
- Examples: See `visualizations.html`

## 📄 License

© 2024 Eyes of Azrael - All Rights Reserved

---

*Last Updated: December 15, 2024*
