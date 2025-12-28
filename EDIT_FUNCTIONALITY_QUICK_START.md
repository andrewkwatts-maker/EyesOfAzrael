# Entity Edit Functionality - Quick Start Guide

## Overview
Complete edit functionality for all entity displays with modal-based editing and permission checks.

---

## Files Added

### 1. `js/components/edit-entity-modal.js`
Modal component for editing entities.

**Usage:**
```javascript
const modal = new EditEntityModal(crudManager);
await modal.open(entityId, collection);
```

### 2. `css/edit-modal.css`
Styling for edit modals and edit icons.

---

## Files Modified

1. **`js/components/cosmology-renderer.js`** - Integrated edit modal
2. **`js/components/creature-renderer.js`** - Added edit icons
3. **`js/entity-renderer-firebase.js`** - Added edit icons to deity/generic renders
4. **`js/components/universal-display-renderer.js`** - Added edit icons to grid cards
5. **`js/app-init-simple.js`** - Added global edit icon handler
6. **`index.html`** - Added script and CSS includes

---

## How It Works

### For Users
1. View an entity you created
2. See edit icon (✏️) in top-right corner
3. Click to open edit modal
4. Modify fields
5. Click "Update" to save
6. Page refreshes with changes

### For Developers

**Add edit icon to any entity display:**
```javascript
// Check if user can edit
canUserEdit(entity) {
    const user = firebase.auth().currentUser;
    if (!user) return false;
    return entity.createdBy === user.uid;
}

// Render edit icon
renderEditIcon(entity) {
    if (!this.canUserEdit(entity)) return '';

    return `
        <button class="edit-icon-btn"
                data-entity-id="${entity.id}"
                data-collection="deities"
                aria-label="Edit ${entity.name}">
            ✏️
        </button>
    `;
}
```

**Global handler automatically wires up all edit icons:**
```javascript
// No manual event listener needed!
// Click is handled by setupEditIconHandler() in app-init-simple.js
```

---

## Permission System

### Three Layers of Security

1. **Client-Side (UI)**
   - Edit icon only shows if user owns entity
   - Check: `entity.createdBy === user.uid`

2. **CRUD Manager (Logic)**
   - Validates ownership before update
   - Method: `PermissionManager.canEdit()`

3. **Firestore Rules (Database)**
   - Server-side validation
   - Final enforcement

---

## CSS Classes

### Edit Icon Button
```css
.edit-icon-btn           /* Base edit icon */
.edit-icon--top-left     /* Position: top-left */
.edit-icon--top-right    /* Position: top-right (default) */
.edit-icon--small        /* Size: 28px */
.edit-icon--medium       /* Size: 36px (default) */
.edit-icon--large        /* Size: 44px */
```

### Modal Classes
```css
.modal-overlay           /* Full-screen overlay */
.modal-content           /* Modal container */
.modal-large             /* Large modal (900px) */
.modal-small             /* Small modal (400px) */
.modal-header            /* Header section */
.modal-body              /* Content section */
.modal-close             /* Close button */
```

---

## Integration Examples

### Example 1: Deity Renderer
```javascript
renderDeity(entity, container) {
    container.style.position = 'relative';

    const html = `
        ${this.renderEditIcon(entity)}

        <section class="deity-header">
            <h2>${entity.name}</h2>
            <!-- Rest of content -->
        </section>
    `;

    container.innerHTML = html;
}
```

### Example 2: Grid Card
```javascript
renderGridCard(entity) {
    return `
        <div class="entity-card"
             data-entity-id="${entity.id}"
             data-created-by="${entity.createdBy}">

            ${this.renderEditIcon(entity)}

            <h3>${entity.name}</h3>
            <!-- Rest of card -->
        </div>
    `;
}
```

### Example 3: Custom Renderer
```javascript
class MyCustomRenderer {
    renderEntity(entity) {
        // Make sure parent is position: relative
        const container = document.getElementById('my-container');
        container.style.position = 'relative';

        const editIcon = this.canUserEdit(entity)
            ? `<button class="edit-icon-btn"
                        data-entity-id="${entity.id}"
                        data-collection="my_collection">
                   ✏️
               </button>`
            : '';

        container.innerHTML = `
            ${editIcon}
            <h1>${entity.name}</h1>
            <!-- Your content -->
        `;
    }

    canUserEdit(entity) {
        const user = firebase.auth().currentUser;
        return user && entity.createdBy === user.uid;
    }
}
```

---

## Testing

### Quick Test
1. Create an entity (or use existing)
2. View the entity detail page
3. Verify edit icon appears (if you own it)
4. Click icon
5. Modal should open with pre-filled form
6. Make a change
7. Click "Update"
8. Verify changes saved

### Permission Test
1. View entity created by another user
2. Edit icon should NOT appear
3. Even if you manually trigger modal, CRUD manager will reject

---

## Troubleshooting

### Edit icon not appearing
**Check:**
- User is logged in: `firebase.auth().currentUser`
- Entity has `createdBy` field
- `createdBy` matches current user UID

### Modal not opening
**Check:**
- `EditEntityModal` script loaded
- CRUD manager initialized: `window.EyesOfAzrael.crudManager`
- Console for errors

### Save not working
**Check:**
- Form validation passing
- User has permission
- Firestore rules allow update
- Network connection

### Edit icon positioned wrong
**Check:**
- Parent container has `position: relative`
- CSS loaded correctly
- No conflicting styles

---

## Mobile Responsiveness

**Automatic adjustments at 768px:**
- Modal: 95% width
- Icons: 32px size
- Touch-friendly spacing
- Full-width toasts

---

## Keyboard Shortcuts

- **ESC**: Close modal
- **Tab**: Navigate form fields
- **Enter**: Submit form (when focused on submit button)

---

## Accessibility

✓ ARIA labels on buttons
✓ Keyboard navigation
✓ Focus management
✓ Screen reader support
✓ Reduced motion support

---

## Performance

**Optimizations:**
- Event delegation (single listener for all icons)
- Lazy modal creation (only when opened)
- DOM cleanup on close
- Auto-save debounced (2s)

---

## Dependencies

**Required (in load order):**
1. Firebase SDK
2. `firebase-crud-manager.js`
3. `entity-form.js`
4. `edit-entity-modal.js`
5. `app-init-simple.js`

**CSS:**
- `edit-modal.css`
- `entity-forms.css`

---

## API Reference

### EditEntityModal

```javascript
class EditEntityModal {
    constructor(crudManager)
    async open(entityId, collection)
    close()
    isOpen()
    async loadEntity(entityId, collection)
    handleSuccess(result)
    showError(message)
    showToast(message, type)
}
```

### Global Functions

```javascript
// Auto-wired in app-init-simple.js
setupEditIconHandler()  // Handles all edit icon clicks
```

### Helper Methods

```javascript
canUserEdit(entity)           // Check if user owns entity
renderEditIcon(entity)        // Generate edit icon HTML
inferCollection(entityType)   // Map type to collection
```

---

## Common Patterns

### Pattern 1: Add edit to existing renderer
```javascript
// Before
renderEntity(entity, container) {
    container.innerHTML = `<h1>${entity.name}</h1>`;
}

// After
renderEntity(entity, container) {
    container.style.position = 'relative';
    container.innerHTML = `
        ${this.renderEditIcon(entity)}
        <h1>${entity.name}</h1>
    `;
}
```

### Pattern 2: Conditional edit access
```javascript
const editIcon = (entity.createdBy === currentUser.uid)
    ? this.renderEditIcon(entity)
    : '';
```

### Pattern 3: Custom edit handler
```javascript
// Use existing global handler (recommended)
// Just add data attributes to button

// OR create custom handler
button.addEventListener('click', async (e) => {
    e.stopPropagation();
    const modal = new EditEntityModal(crudManager);
    await modal.open(entityId, collection);
});
```

---

## Next Steps

1. **Test** on your entities
2. **Customize** CSS colors if needed
3. **Add** to any missing renderers
4. **Monitor** analytics for usage
5. **Gather** user feedback

---

## Support

**Issues?**
- Check console for errors
- Verify script load order
- Confirm Firebase initialized
- Check Firestore permissions

**Questions?**
- See full report: `AGENT_6_EDIT_FUNCTIONALITY_REPORT.md`
- Review example implementations in renderers

---

**Status: Production Ready ✓**
