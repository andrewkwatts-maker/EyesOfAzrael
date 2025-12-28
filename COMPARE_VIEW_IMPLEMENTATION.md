# CompareView Implementation Guide

**Component:** CompareView Enhanced Edition v2.0
**Date:** December 28, 2025
**Status:** Production Ready

---

## Quick Start

### 1. Include Required Files

Add to your HTML page:

```html
<!-- Firebase SDK (if not already included) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

<!-- Base Styles -->
<link rel="stylesheet" href="css/compare-view.css">
<link rel="stylesheet" href="css/compare-view-enhanced.css">

<!-- Component Script -->
<script src="js/components/compare-view.js"></script>
```

### 2. Initialize Component

```html
<div id="compare-container"></div>

<script>
// Wait for Firebase to initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Initialize CompareView
const compareView = new CompareView(db);

// Render component
const container = document.getElementById('compare-container');
compareView.render(container);
</script>
```

### 3. Test Component

Open your page and:
1. Search for an entity (e.g., "Zeus")
2. Click to add it to comparison
3. Search and add a second entity (e.g., "Odin")
4. View the similarity analysis and comparison table

---

## Advanced Configuration

### Pre-load Entities via URL

```javascript
// URL format: #/compare?entities=deities:zeus,deities:odin

// Automatic on component init
const compareView = new CompareView(db);
await compareView.render(container);
// Will automatically parse URL and load entities
```

### Customize Maximum Entities

```javascript
const compareView = new CompareView(db);
compareView.maxEntities = 4; // Default is 3
compareView.minEntities = 2; // Minimum required
await compareView.render(container);
```

### Add Custom Mythologies

```javascript
const compareView = new CompareView(db);
compareView.mythologies.push('custom_mythology');
await compareView.render(container);
```

### Add Custom Collections

```javascript
const compareView = new CompareView(db);
compareView.collections['weapons'] = 'Weapons';
compareView.collections['locations'] = 'Locations';
await compareView.render(container);
```

---

## Integration with Existing Pages

### Option 1: Standalone Page

Create `compare.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compare Entities - Eyes of Azrael</title>

    <!-- Styles -->
    <link rel="stylesheet" href="themes/theme-base.css">
    <link rel="stylesheet" href="css/compare-view.css">
    <link rel="stylesheet" href="css/compare-view-enhanced.css">

    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
    <script src="firebase-config.js"></script>
</head>
<body>
    <div id="compare-container"></div>

    <script src="js/components/compare-view.js"></script>
    <script>
        // Initialize Firebase
        firebase.initializeApp(window.firebaseConfig);
        const db = firebase.firestore();

        // Initialize CompareView
        const compareView = new CompareView(db);
        const container = document.getElementById('compare-container');
        compareView.render(container);
    </script>
</body>
</html>
```

### Option 2: SPA Integration

If using a router (e.g., dashboard.html routing system):

```javascript
// In your router/navigation handler
if (route === 'compare') {
    const container = document.getElementById('main-content');
    const compareView = new CompareView(firebase.firestore());
    await compareView.render(container);
}
```

### Option 3: Modal/Dialog Integration

```javascript
// Show compare view in modal
function showCompareModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">×</button>
            <div id="modal-compare-container"></div>
        </div>
    `;
    document.body.appendChild(modal);

    const compareView = new CompareView(firebase.firestore());
    const container = modal.querySelector('#modal-compare-container');
    compareView.render(container);

    // Close button
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
}
```

---

## Customization

### Custom Styling

Override CSS variables in your stylesheet:

```css
:root {
    /* Primary color for buttons and highlights */
    --color-primary: #your-color;

    /* Secondary color for accents */
    --color-secondary: #your-color;

    /* Background colors */
    --color-bg-primary: #your-color;
    --color-bg-card: #your-color;
    --color-bg-secondary: #your-color;

    /* Text colors */
    --color-text-primary: #your-color;
    --color-text-secondary: #your-color;

    /* Border colors */
    --color-border-primary: #your-color;
}
```

### Custom Attribute List

Modify the `getCommonAttributes()` method:

```javascript
getCommonAttributes() {
    const baseAttributes = [
        // Add your custom attributes
        { key: 'custom_field', label: 'Custom Field' },
        // ... existing attributes
    ];

    return baseAttributes.filter(/* ... */);
}
```

### Custom Similarity Algorithm

Override the `calculateSimilarity()` method:

```javascript
calculateSimilarity() {
    // Your custom similarity logic
    const myScore = calculateMyCustomScore(this.selectedEntities);

    return {
        overallScore: myScore,
        sharedAttributes: /* ... */,
        // ... etc
    };
}
```

---

## Event Handling

### Listen for Entity Selection

```javascript
const compareView = new CompareView(db);

// Override addEntity to add custom logic
const originalAddEntity = compareView.addEntity.bind(compareView);
compareView.addEntity = function(entityData, collection) {
    // Your custom code before adding
    console.log('Adding entity:', entityData.name);

    // Call original method
    originalAddEntity(entityData, collection);

    // Your custom code after adding
    console.log('Total entities:', this.selectedEntities.length);

    // Custom analytics
    if (window.gtag) {
        gtag('event', 'entity_added', {
            entity_name: entityData.name,
            mythology: entityData.mythology
        });
    }
};

compareView.render(container);
```

### Listen for Share Events

```javascript
const originalShare = compareView.shareComparison.bind(compareView);
compareView.shareComparison = function() {
    originalShare();

    // Custom analytics
    if (window.gtag) {
        gtag('event', 'comparison_shared', {
            entity_count: this.selectedEntities.length
        });
    }
};
```

---

## Firebase Schema Requirements

### Entity Document Structure

```javascript
{
    // Required fields
    id: "zeus",
    name: "Zeus",
    mythology: "greek",
    type: "deity",

    // Optional but recommended
    icon: "⚡",
    title: "King of the Gods",
    description: "Zeus is the sky and thunder god...",

    // Comparison attributes
    domain: "Sky",
    domains: ["Thunder", "Sky", "Justice"],
    symbols: ["Thunderbolt", "Eagle", "Oak"],
    attributes: ["Powerful", "Wise", "Just"],
    powers: ["Control thunder", "Shapeshift"],
    epithets: ["Cloud-Gatherer", "Father of Gods"],

    // Family relationships
    parents: ["Cronus", "Rhea"],
    siblings: ["Poseidon", "Hades", "Hera"],
    consort: "Hera",
    children: ["Apollo", "Artemis", "Athena"],

    // Cultural data
    sacred_animals: ["Eagle"],
    sacred_plants: ["Oak"],
    festivals: ["Olympic Games"],
    temples: ["Temple of Olympian Zeus"],
    weapons: ["Thunderbolt"],
    myths: ["Titanomachy", "Typhon"],
    cultural_significance: "Chief deity of ancient Greece",
    modern_influence: "Name used for planet Jupiter"
}
```

### Collection Structure

```
deities/
├── greek_zeus
├── norse_odin
├── egyptian_ra
└── ...

heroes/
├── greek_heracles
├── babylonian_gilgamesh
└── ...

creatures/
├── greek_cerberus
├── norse_fenrir
└── ...
```

---

## Performance Optimization

### Limit Search Results

```javascript
const compareView = new CompareView(db);

// Modify searchEntities to limit results
compareView.searchEntities = async function(query, mythologyFilter, typeFilter) {
    // ... existing code ...

    // Reduce limit for faster queries
    queryRef = queryRef.limit(10); // Default is 20

    // ... rest of code ...
};
```

### Cache Entity Data

```javascript
const entityCache = new Map();

compareView.addEntityById = async function(collection, id) {
    const cacheKey = `${collection}:${id}`;

    // Check cache first
    if (entityCache.has(cacheKey)) {
        this.addEntity(entityCache.get(cacheKey), collection);
        return;
    }

    // Fetch from Firebase
    const doc = await this.db.collection(collection).doc(id).get();
    if (doc.exists) {
        const entityData = { id: doc.id, ...doc.data() };
        entityCache.set(cacheKey, entityData);
        this.addEntity(entityData, collection);
    }
};
```

### Lazy Load Venn Diagram

```javascript
// Only render Venn diagram when section is visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            renderVennDiagram();
            observer.disconnect();
        }
    });
});

const vennContainer = document.querySelector('.venn-diagram-container');
if (vennContainer) {
    observer.observe(vennContainer);
}
```

---

## Testing

### Unit Tests (Jest Example)

```javascript
const CompareView = require('./compare-view.js');

describe('CompareView', () => {
    let mockFirestore;
    let compareView;

    beforeEach(() => {
        mockFirestore = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({ name: 'Zeus', mythology: 'greek' })
            })
        };
        compareView = new CompareView(mockFirestore);
    });

    test('should initialize with empty entities', () => {
        expect(compareView.selectedEntities).toEqual([]);
    });

    test('should add entity', () => {
        const entity = { name: 'Zeus', mythology: 'greek' };
        compareView.addEntity(entity, 'deities');
        expect(compareView.selectedEntities.length).toBe(1);
    });

    test('should calculate similarity', () => {
        compareView.selectedEntities = [
            { name: 'Zeus', domain: 'Sky' },
            { name: 'Odin', domain: 'Sky' }
        ];
        const similarity = compareView.calculateSimilarity();
        expect(similarity.overallScore).toBeGreaterThan(0);
    });
});
```

### Integration Tests

```javascript
// Test with real Firebase
describe('CompareView Integration', () => {
    test('should load entities from URL', async () => {
        window.location.hash = '#/compare?entities=deities:zeus,deities:odin';
        const compareView = new CompareView(firebase.firestore());
        await compareView.parseURLParams();
        expect(compareView.selectedEntities.length).toBe(2);
    });
});
```

### Manual Testing Checklist

```
□ Search for entities
□ Add/remove entities
□ View similarity metrics
□ Interact with Venn diagram
□ Scroll comparison table
□ Test on mobile device
□ Test swipe gestures
□ Share comparison
□ Export to PDF
□ Test with 2 entities
□ Test with 3 entities
□ Test empty states
□ Test error handling
```

---

## Troubleshooting

### Issue: Entities Not Loading

**Solution:**
1. Check Firebase connection
2. Verify collection names match schema
3. Check browser console for errors
4. Ensure entity IDs are correct

```javascript
// Debug mode
const compareView = new CompareView(db);
compareView.debugMode = true; // Add this property
// Component will log detailed information
```

### Issue: Venn Diagram Not Rendering

**Solution:**
1. Verify CSS file is loaded
2. Check that entities are selected
3. Inspect browser console for errors
4. Ensure CSS variables are defined

```javascript
// Check if Venn diagram container exists
const vennContainer = document.querySelector('.venn-diagram-container');
console.log('Venn container:', vennContainer);
```

### Issue: Mobile Swipe Not Working

**Solution:**
1. Ensure touch events are supported
2. Check that mobile-comparison div is visible
3. Verify swipe threshold (50px minimum)
4. Test on actual device (not desktop emulator)

```javascript
// Test touch support
console.log('Touch support:', 'ontouchstart' in window);
```

### Issue: Share URL Not Working

**Solution:**
1. Check clipboard API support
2. Ensure HTTPS (required for clipboard API)
3. Verify URL parameter format
4. Test fallback prompt method

```javascript
// Force fallback method
compareView.shareComparison = function() {
    const url = /* generate URL */;
    prompt('Copy this URL:', url);
};
```

---

## Browser Compatibility

### Supported Browsers

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome  | 120+    | ✅ Full       |
| Firefox | 120+    | ✅ Full       |
| Safari  | 17+     | ✅ Full*      |
| Edge    | 120+    | ✅ Full       |
| iOS Safari | 16+ | ✅ Full       |
| Android Chrome | 13+ | ✅ Full   |

*Safari requires `-webkit-` prefixes for some features

### Feature Detection

```javascript
// Check for required features
const hasClipboard = !!navigator.clipboard;
const hasTouchEvents = 'ontouchstart' in window;
const hasGrid = CSS.supports('display', 'grid');

if (!hasGrid) {
    console.warn('CSS Grid not supported. Falling back to flexbox.');
}
```

---

## Deployment Checklist

```
□ Test on all target browsers
□ Test on mobile devices
□ Optimize images and assets
□ Minify CSS and JavaScript
□ Enable gzip compression
□ Test Firebase connection
□ Verify API keys
□ Check CORS settings
□ Test share URLs
□ Test print/export
□ Verify analytics tracking
□ Test accessibility
□ Check responsive behavior
□ Test error handling
□ Review performance metrics
□ Update documentation
```

---

## Support & Maintenance

### Getting Help

1. Check this documentation first
2. Review browser console for errors
3. Test with sample entities
4. Check Firebase console for data issues
5. Review GitHub issues for similar problems

### Reporting Issues

Include in your report:
- Browser and version
- Screen size/device
- Steps to reproduce
- Console error messages
- Screenshots if applicable

### Contributing

To contribute improvements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## Additional Resources

**Related Components:**
- `entity-renderer-firebase.js` - Entity display component
- `mythology-comparisons.js` - Comparison engine
- `svg-editor-modal.js` - Icon editor

**Documentation:**
- `COMPARE_VIEW_ENHANCEMENT_SUMMARY.md` - Feature overview
- `COMPARE_VIEW_VISUAL_GUIDE.md` - Visual guide
- `ASSET_METADATA_STANDARDS.md` - Data schema reference

**External Resources:**
- [Firebase Documentation](https://firebase.google.com/docs)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)

---

**Component Version:** 2.0
**Last Updated:** December 28, 2025
**Maintained By:** Eyes of Azrael Development Team
**License:** Project License
