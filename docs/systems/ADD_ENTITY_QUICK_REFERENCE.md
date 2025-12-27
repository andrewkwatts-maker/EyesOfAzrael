# Add Entity Card System - Quick Reference Card

**One-page cheat sheet for rapid integration**

---

## Fastest Integration (3 Steps)

### 1. Include Files

```html
<link rel="stylesheet" href="/css/add-entity-card.css">
<script src="/js/components/add-entity-card.js"></script>
```

### 2. Add Container

```html
<div class="pantheon-grid">
    <!-- Your entity cards -->
    <div id="add-entity"></div>
</div>
```

### 3. Initialize

```html
<script>
    renderAddEntityCard({
        containerId: 'add-entity',
        entityType: 'deity',
        mythology: 'greek'
    });
</script>
```

**Done!** Card appears for logged-in users.

---

## Common Configurations

### Deity Collection

```javascript
renderAddEntityCard({
    containerId: 'add-deity',
    entityType: 'deity',
    mythology: 'greek',
    label: 'Add New Deity',
    icon: '⚡'
});
```

### Hero Collection

```javascript
renderAddEntityCard({
    containerId: 'add-hero',
    entityType: 'hero',
    mythology: 'norse',
    label: 'Add Hero',
    icon: '🦸'
});
```

### Theory Submission (Purple Theme)

```javascript
const card = renderAddEntityCard({
    containerId: 'add-theory',
    entityType: 'theory',
    label: 'Submit Theory',
    icon: '💡'
});
card.cardElement.classList.add('add-entity-card--purple');
```

### Herb Collection

```javascript
renderAddEntityCard({
    containerId: 'add-herb',
    entityType: 'herb',
    mythology: 'greek',
    label: 'Add Sacred Herb',
    icon: '🌿'
});
```

---

## Edit Icons

### Auto-Inject (Zero JavaScript)

```html
<div
    class="deity-card"
    data-edit-icon
    data-entity-id="zeus"
    data-entity-type="deity"
    data-created-by="user-uid-123"
    data-mythology="greek">

    <h3>Zeus</h3>
</div>
```

### JavaScript

```javascript
renderEditIcon({
    cardElement: document.querySelector('.deity-card'),
    entityId: 'zeus',
    entityType: 'deity',
    createdBy: 'user-uid-123',
    mythology: 'greek'
});
```

### Batch Apply

```javascript
const cards = document.querySelectorAll('.deity-card');
renderEditIconsOnCards(
    Array.from(cards).map(card => ({
        element: card,
        entityId: card.dataset.entityId,
        createdBy: card.dataset.createdBy
    })),
    { mythology: 'greek' }
);
```

---

## Options Reference

### Add Entity Card

| Option | Type | Example |
|--------|------|---------|
| `containerId` | string | `'add-entity'` |
| `entityType` | string | `'deity'`, `'hero'`, `'herb'` |
| `mythology` | string | `'greek'`, `'norse'`, `'egyptian'` |
| `label` | string | `'Add New Deity'` |
| `icon` | string | `'+'`, `'⚡'`, `'🌿'` |
| `position` | string | `'end'`, `'start'` |

### Edit Icon

| Option | Type | Example |
|--------|------|---------|
| `cardElement` | HTMLElement | `document.querySelector('.card')` |
| `entityId` | string | `'zeus'` |
| `createdBy` | string | `'user-uid-123'` |
| `position` | string | `'top-right'`, `'top-left'` |
| `size` | string | `'small'`, `'medium'`, `'large'` |

---

## Styling

### Add Class for Theme

```javascript
// Purple (theories)
card.cardElement.classList.add('add-entity-card--purple');

// Gold (special)
card.cardElement.classList.add('add-entity-card--gold');

// Compact size
card.cardElement.classList.add('add-entity-card--compact');
```

### Edit Icon Themes

```javascript
const icon = renderEditIcon({ /* options */ });
icon.iconElement.classList.add('edit-icon--purple');
```

---

## Troubleshooting

### Card Not Showing?

```javascript
// Debug
console.log('User:', window.firebaseAuth?.getCurrentUser());
console.log('Container:', document.getElementById('add-entity'));
```

**Fix:** User must be logged in (unless `showForGuests: true`)

### Edit Icon Not Showing?

```javascript
// Check ownership
const user = window.firebaseAuth.getCurrentUser();
console.log('Match:', user?.uid === createdBy);
```

**Fix:** `createdBy` must match current user UID

### Click Not Working?

**Fix:** Ensure scripts loaded after DOM:
```html
<script src="/js/components/add-entity-card.js"></script>
<script>
    // Initialize after DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        renderAddEntityCard({ /* options */ });
    });
</script>
```

---

## Visual Identifiers

### How to Spot Them

**Add Entity Card:**
- ✓ **Dashed border** (vs solid on regular cards)
- ✓ Large + icon centered
- ✓ "Add New..." label

**Edit Icon:**
- ✓ Small ✏️ button
- ✓ Top-right corner (default)
- ✓ Only on your content

---

## File Locations

```
js/components/add-entity-card.js
js/components/edit-icon.js
css/add-entity-card.css
css/edit-icon.css
```

---

## Full Docs

📖 **Complete Guide:** `ADD_ENTITY_CARD_GUIDE.md`
📊 **Summary:** `ADD_ENTITY_SYSTEM_SUMMARY.md`
🎨 **Visual Guide:** `ADD_ENTITY_VISUAL_GUIDE.md`
🖥️ **Demo:** `demo-add-entity-system.html`

---

**Created:** Dec 18, 2024 | **Version:** 1.0.0
