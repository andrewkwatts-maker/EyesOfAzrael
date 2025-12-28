# Modal Quick View - Quick Reference Guide

**Status:** ✅ Production Ready
**Last Updated:** 2025-12-28

---

## 🚀 Quick Start

### 1. Opening a Modal Programmatically

```javascript
// Get Firestore instance
const db = window.EyesOfAzrael.db;

// Create modal
const modal = new EntityQuickViewModal(db);

// Open it
modal.open('entity-id', 'collection-name', 'mythology-name');
```

### 2. Adding to HTML Cards

```html
<!-- Modal will auto-open on click -->
<div class="entity-card"
     data-entity-id="deity-zeus"
     data-collection="deities"
     data-mythology="greek">
    <div class="card-icon">⚡</div>
    <h3 class="card-title">Zeus</h3>
    <p class="card-description">King of the Gods</p>
</div>
```

### 3. Using from Asset Renderer

```javascript
const renderer = new UniversalAssetRenderer(db);
renderer.showQuickView(assetObject);
```

---

## 📋 Data Attributes Required

| Attribute | Required | Description | Example |
|-----------|----------|-------------|---------|
| `data-entity-id` or `data-id` | ✅ Yes | Entity document ID | `"deity-zeus"` |
| `data-collection` or `data-type` | ✅ Yes | Firestore collection | `"deities"` |
| `data-mythology` | ⚠️ Optional | Mythology name | `"greek"` |

---

## 🎨 Supported Card Classes

Modal auto-detects clicks on these classes:
- `.entity-card`
- `.mythology-card`
- `.deity-card`
- `.hero-card`
- `.creature-card`
- `.panel-card`
- `.related-entity-card`

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Close modal |
| `Tab` | Navigate through related entities |
| `Enter` / `Space` | Activate focused related entity |

---

## 🎯 Modal Features

✅ Entity icon (large display)
✅ Entity name/title
✅ Metadata badges (mythology, type, importance)
✅ Original name (if available)
✅ Alternate names
✅ Description (truncated to 500 chars)
✅ Domains (tag list)
✅ Symbols (tag list)
✅ Related entities (up to 6, clickable)
✅ "View Full Page" button
✅ Close on X, ESC, or click outside

---

## 🔧 Common Use Cases

### Opening from Button

```javascript
document.getElementById('myButton').addEventListener('click', () => {
    const modal = new EntityQuickViewModal(window.EyesOfAzrael.db);
    modal.open('deity-123', 'deities', 'greek');
});
```

### Opening from Search Results

```javascript
searchResults.forEach(result => {
    result.addEventListener('click', () => {
        const modal = new EntityQuickViewModal(db);
        modal.open(result.id, result.collection, result.mythology);
    });
});
```

### Chaining Modals (Related Entities)

```javascript
// Related entities automatically chain
// Click a related entity → opens that entity's modal
// No additional code needed
```

---

## 🚫 Auto-Exclusions

Modal **will NOT open** when clicking:
- Links (`<a>`)
- Buttons (`<button>`)
- Edit icons (`.edit-icon-btn`)
- Delete buttons (`.delete-btn`)
- Primary buttons (`.btn-primary`)
- Secondary buttons (`.btn-secondary`)

---

## 🐛 Troubleshooting

### Modal Doesn't Open

**Check 1:** Data attributes present?
```javascript
console.log(card.dataset);
// Should show: { entityId: "...", collection: "...", mythology: "..." }
```

**Check 2:** Script loaded?
```javascript
console.log(typeof EntityQuickViewModal);
// Should show: "function"
```

**Check 3:** Firestore available?
```javascript
console.log(window.EyesOfAzrael?.db);
// Should show: Firestore instance
```

### Related Entities Not Loading

**Check 1:** Entity has related IDs?
```javascript
// Check entity data
console.log(entity.displayOptions?.relatedEntities);
console.log(entity.relationships?.relatedIds);
```

**Check 2:** Network errors?
```javascript
// Check browser console for Firestore errors
```

### Styling Issues

**Check 1:** CSS loaded?
```html
<!-- Should be in index.html -->
<link rel="stylesheet" href="css/quick-view-modal.css">
```

**Check 2:** CSS variables defined?
```css
/* Should be in theme CSS */
:root {
    --color-primary: #8b7fff;
    --color-text-primary: #f8f9fa;
    /* ... etc */
}
```

---

## 📱 Responsive Breakpoints

| Screen Width | Layout |
|--------------|--------|
| > 768px | Desktop layout (side-by-side) |
| ≤ 768px | Mobile layout (stacked) |

---

## 🎨 Customization

### Change Max Related Entities

```javascript
// In entity-quick-view-modal.js, line ~200
const entities = await this.loadMultipleEntities(relatedIds.slice(0, 6));
//                                                                    ^ Change this number
```

### Change Description Truncation

```javascript
// In entity-quick-view-modal.js, line ~163
const truncated = description.length > 500 ? description.substring(0, 500) + '...' : description;
//                                     ^^^                            ^^^
//                                     Change these numbers
```

### Add Custom Sections

```javascript
// In renderContentSection(), add:
if (entity.myCustomField) {
    html += `
        <div class="info-section">
            <h3>My Custom Section</h3>
            <p>${this.escapeHtml(entity.myCustomField)}</p>
        </div>
    `;
}
```

---

## 📊 Performance Tips

### Cache Firestore Instance

```javascript
// Good: Reuse instance
const db = window.EyesOfAzrael.db;
const modal = new EntityQuickViewModal(db);

// Bad: Create new instance each time
new EntityQuickViewModal(firebase.firestore());
```

### Batch Load Related Entities

```javascript
// Future optimization: Use batch reads
const batch = db.batch();
relatedIds.forEach(id => {
    batch.get(db.collection('deities').doc(id));
});
```

### Preload Common Entities

```javascript
// Cache frequently accessed entities
const cache = new Map();
async function getEntity(id) {
    if (cache.has(id)) return cache.get(id);
    const entity = await loadEntity(id);
    cache.set(id, entity);
    return entity;
}
```

---

## 🔐 Security Notes

### XSS Prevention

All text content is escaped:
```javascript
escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### Firestore Rules

Ensure read access is properly configured:
```javascript
// firestore.rules
match /deities/{deityId} {
    allow read: if request.auth != null;
}
```

---

## 📚 Files Reference

### Core Files
- `js/components/entity-quick-view-modal.js` - Modal component
- `css/quick-view-modal.css` - Modal styling
- `js/components/entity-card-quick-view.js` - Global click handler

### Dependencies
- Firebase Firestore SDK
- `js/universal-asset-renderer.js`
- `css/ui-components.css`

### Integration Files
- `index.html` - Script/CSS loading
- `js/app-init-simple.js` - App initialization

---

## 🎯 Testing Checklist

```
✅ Modal opens on card click
✅ Shows correct entity data
✅ Related entities clickable
✅ "View Full Page" works
✅ Close on X button
✅ Close on ESC key
✅ Close on click outside
✅ Mobile responsive
✅ Keyboard navigation
✅ Loading states
✅ Error handling
```

---

## 💡 Pro Tips

1. **Debugging:** Open browser console to see detailed logs
2. **Performance:** Use browser DevTools Network tab to check Firestore reads
3. **Styling:** Use browser Inspector to adjust CSS live
4. **Testing:** Add `console.log()` to click handler to verify card detection
5. **Mobile:** Test on real devices, not just desktop responsive mode

---

## 🆘 Getting Help

### Check Console Logs

```javascript
// Look for these messages:
[QuickView] Opening modal for: {entityId, collection, mythology}
[QuickView] Error loading entity: ...
[EntityCardQuickView] Card missing required data attributes
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| "Firestore not initialized" | Wait for app to initialize |
| "Entity not found" | Check entity ID and collection |
| "EntityQuickViewModal not loaded" | Check script order in index.html |

---

*Last updated: 2025-12-28*
*Version: 1.0.0*
*Status: Production Ready*
