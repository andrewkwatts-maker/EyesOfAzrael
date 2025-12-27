# Add Entity Card System - Complete Implementation Guide

## Overview

The **Add Entity Card** system is a universal component that allows authenticated users to contribute new entities (deities, heroes, creatures, items, places, etc.) across the Eyes of Azrael website. This system includes:

1. **Add Entity Card** - A distinctive "+ Add New" card that appears in entity grids
2. **Edit Icon** - A floating edit button that appears on user-created content

Both components integrate seamlessly with Firebase Authentication and match the site's glassmorphism aesthetic.

---

## Table of Contents

- [Features](#features)
- [Component Files](#component-files)
- [Quick Start](#quick-start)
- [Add Entity Card](#add-entity-card)
  - [Basic Usage](#basic-usage)
  - [Configuration Options](#configuration-options)
  - [Auto-Detection](#auto-detection)
  - [Styling Variants](#styling-variants)
- [Edit Icon](#edit-icon)
  - [Basic Usage](#edit-icon-basic-usage)
  - [Configuration Options](#edit-icon-configuration-options)
  - [Batch Rendering](#batch-rendering)
- [Integration Examples](#integration-examples)
- [Visual Design](#visual-design)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Features

### Add Entity Card
- ✅ **Auth-aware**: Only visible to logged-in users (configurable)
- ✅ **Context detection**: Automatically detects mythology, entity type, and category
- ✅ **Glassmorphism aesthetic**: Dashed border, blur effects, cyan glow
- ✅ **Hover animations**: Icon rotation, scale up, border solidifies
- ✅ **Accessibility**: Keyboard navigation, screen reader support
- ✅ **Responsive**: Adapts to mobile screens
- ✅ **Flexible positioning**: Can appear at start or end of grid

### Edit Icon
- ✅ **Ownership-based**: Only visible for entities created by current user
- ✅ **Event isolation**: Stops propagation to prevent card navigation
- ✅ **Multiple positions**: Top-right, top-left, bottom-right, bottom-left
- ✅ **Size variants**: Small, medium, large
- ✅ **Theme variants**: Default (cyan), purple, gold, danger
- ✅ **Tooltips**: Built-in hover tooltips
- ✅ **Batch operations**: Apply to multiple cards at once

---

## Component Files

### JavaScript
- `js/components/add-entity-card.js` - Add entity card component
- `js/components/edit-icon.js` - Edit icon component

### CSS
- `css/add-entity-card.css` - Add entity card styles
- `css/edit-icon.css` - Edit icon styles

---

## Quick Start

### 1. Include Required Files

Add to your HTML `<head>`:

```html
<!-- Firebase Auth (required) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="/firebase-config.js"></script>
<script src="/js/firebase-auth.js"></script>

<!-- Add Entity Card Component -->
<link rel="stylesheet" href="/css/add-entity-card.css">
<script src="/js/components/add-entity-card.js"></script>

<!-- Edit Icon Component (optional) -->
<link rel="stylesheet" href="/css/edit-icon.css">
<script src="/js/components/edit-icon.js"></script>
```

### 2. Add Container to Your Grid

Add a container div at the end of your entity grid:

```html
<div class="pantheon-grid">
    <!-- Existing entity cards -->
    <div class="deity-card">...</div>
    <div class="deity-card">...</div>

    <!-- Add entity card container -->
    <div id="add-entity-container"></div>
</div>
```

### 3. Initialize the Component

Add script at the bottom of your page:

```html
<script>
    renderAddEntityCard({
        containerId: 'add-entity-container',
        entityType: 'deity',
        mythology: 'greek',
        label: 'Add New Deity'
    });
</script>
```

**That's it!** The card will now appear for logged-in users.

---

## Add Entity Card

### Basic Usage

#### Method 1: JavaScript Initialization

```html
<div id="add-entity-container"></div>

<script>
    renderAddEntityCard({
        containerId: 'add-entity-container',
        entityType: 'deity',
        mythology: 'greek'
    });
</script>
```

#### Method 2: Auto-Inject with Data Attributes

```html
<div
    id="add-deity-card"
    data-add-entity-auto
    data-entity-type="deity"
    data-mythology="greek"
    data-label="Add New Deity">
</div>
```

No JavaScript needed - component auto-initializes on page load.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerId` | string | **required** | ID of the container element |
| `entityType` | string | `'entity'` | Type of entity (deity, hero, creature, etc.) |
| `mythology` | string | auto-detect | Mythology tradition (greek, norse, egyptian, etc.) |
| `category` | string | `null` | Sub-category (optional) |
| `parentEntity` | string | `null` | Parent entity ID (optional, for nested entities) |
| `label` | string | `'Add New {Type}'` | Button label text |
| `icon` | string | `'+'` | Icon to display (emoji or text) |
| `redirectUrl` | string | `'/theories/user-submissions/edit.html'` | Submission form URL |
| `showForGuests` | boolean | `false` | Show for non-authenticated users |
| `position` | string | `'end'` | Position in grid (`'start'` or `'end'`) |

### Auto-Detection

The component can automatically detect context from:

1. **Data Attributes**: `<main data-mythology="greek">`
2. **URL Path**: `/mythos/greek/deities/index.html` → mythology=greek, type=deity
3. **Meta Tags**: `<meta name="mythology" content="greek">`

Example with auto-detection:

```html
<main data-mythology="norse">
    <div class="deities-grid">
        <!-- Cards here -->
        <div id="add-deity"></div>
    </div>
</main>

<script>
    // Mythology will be auto-detected as 'norse'
    // Entity type will be auto-detected from URL path
    renderAddEntityCard({
        containerId: 'add-deity'
    });
</script>
```

### Styling Variants

#### Default (Cyan)
```html
<div class="add-entity-card"></div>
```

#### Purple (for Theories)
```html
<div class="add-entity-card add-entity-card--purple"></div>
```

Or via JavaScript:
```javascript
const card = renderAddEntityCard({ containerId: 'add-theory' });
card.cardElement.classList.add('add-entity-card--purple');
```

#### Gold (for Special Entities)
```html
<div class="add-entity-card add-entity-card--gold"></div>
```

#### Size Variants
```html
<!-- Compact -->
<div class="add-entity-card add-entity-card--compact"></div>

<!-- Mini -->
<div class="add-entity-card add-entity-card--mini"></div>
```

---

## Edit Icon

### Edit Icon Basic Usage

#### Method 1: JavaScript Initialization

```javascript
renderEditIcon({
    cardElement: document.querySelector('.deity-card'),
    entityId: 'zeus',
    entityType: 'deity',
    createdBy: 'user-uid-123',
    mythology: 'greek'
});
```

#### Method 2: Auto-Inject with Data Attributes

```html
<div
    class="deity-card"
    data-edit-icon
    data-entity-id="zeus"
    data-entity-type="deity"
    data-created-by="user-uid-123"
    data-mythology="greek">

    <h3>Zeus</h3>
    <p>King of the Gods</p>
</div>
```

The edit icon will automatically appear for the owner.

### Edit Icon Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cardElement` | HTMLElement | **required** | Entity card element |
| `entityId` | string | **required** | Unique entity identifier |
| `entityType` | string | `'entity'` | Type of entity |
| `createdBy` | string | **required** | User UID who created this entity |
| `mythology` | string | `null` | Mythology tradition |
| `redirectUrl` | string | `'/theories/user-submissions/edit.html'` | Edit form URL |
| `icon` | string | `'✏️'` | Icon symbol |
| `position` | string | `'top-right'` | Position on card |
| `size` | string | `'medium'` | Size variant |
| `showTooltip` | boolean | `true` | Show hover tooltip |

### Position Options

- `'top-right'` (default)
- `'top-left'`
- `'bottom-right'`
- `'bottom-left'`

### Size Options

- `'small'` - 32x32px
- `'medium'` - 40x40px (default)
- `'large'` - 48x48px

### Batch Rendering

Apply edit icons to multiple cards at once:

```javascript
const cards = [
    {
        element: document.querySelector('#card-1'),
        entityId: 'zeus',
        entityType: 'deity',
        createdBy: 'user-123'
    },
    {
        element: document.querySelector('#card-2'),
        entityId: 'hera',
        entityType: 'deity',
        createdBy: 'user-123'
    }
];

renderEditIconsOnCards(cards, {
    mythology: 'greek',
    size: 'large'
});
```

---

## Integration Examples

### Example 1: Deity Collection Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Greek Deities</title>

    <!-- Core Styles -->
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="stylesheet" href="/css/entity-display.css">

    <!-- Component Styles -->
    <link rel="stylesheet" href="/css/add-entity-card.css">
    <link rel="stylesheet" href="/css/edit-icon.css">

    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
    <script src="/firebase-config.js"></script>
    <script src="/js/firebase-auth.js"></script>

    <!-- Components -->
    <script src="/js/components/add-entity-card.js"></script>
    <script src="/js/components/edit-icon.js"></script>
</head>
<body>
    <main data-mythology="greek">
        <h1>Greek Deities</h1>

        <div class="pantheon-grid">
            <!-- Zeus Card -->
            <div
                class="deity-card"
                data-edit-icon
                data-entity-id="zeus"
                data-entity-type="deity"
                data-created-by="user-original-author"
                onclick="window.location.href='zeus.html'">

                <div class="hero-icon-display">⚡</div>
                <h3>Zeus</h3>
                <p>King of the Gods</p>
            </div>

            <!-- Hera Card -->
            <div
                class="deity-card"
                data-edit-icon
                data-entity-id="hera"
                data-entity-type="deity"
                data-created-by="user-original-author"
                onclick="window.location.href='hera.html'">

                <div class="hero-icon-display">👑</div>
                <h3>Hera</h3>
                <p>Queen of the Gods</p>
            </div>

            <!-- Add Entity Card -->
            <div
                id="add-deity-card"
                data-add-entity-auto
                data-entity-type="deity"
                data-mythology="greek"
                data-label="Add New Deity">
            </div>
        </div>
    </main>
</body>
</html>
```

### Example 2: Herb Collection

```html
<main data-mythology="greek">
    <h2>Sacred Herbs</h2>

    <div class="herbs-grid">
        <!-- Existing herb cards -->

        <!-- Add new herb -->
        <div id="add-herb-container"></div>
    </div>
</main>

<script>
    renderAddEntityCard({
        containerId: 'add-herb-container',
        entityType: 'herb',
        mythology: 'greek',
        label: 'Add Sacred Herb',
        icon: '🌿'
    });
</script>
```

### Example 3: Theory Submissions

```html
<div class="theories-grid">
    <!-- Existing theories -->

    <div id="add-theory"></div>
</div>

<script>
    const card = renderAddEntityCard({
        containerId: 'add-theory',
        entityType: 'theory',
        label: 'Submit New Theory',
        icon: '💡',
        redirectUrl: '/theories/user-submissions/edit.html'
    });

    // Apply purple theme
    card.cardElement.classList.add('add-entity-card--purple');
</script>
```

### Example 4: Dynamic Entity Loading with Edit Icons

```javascript
// Load entities from Firebase
async function loadDeities() {
    const db = firebase.firestore();
    const snapshot = await db.collection('entities')
        .where('type', '==', 'deity')
        .where('mythology', '==', 'greek')
        .get();

    const grid = document.querySelector('.deities-grid');

    snapshot.forEach(doc => {
        const data = doc.data();

        // Create card
        const card = document.createElement('div');
        card.className = 'deity-card';
        card.setAttribute('data-entity-id', doc.id);
        card.setAttribute('data-entity-type', 'deity');
        card.setAttribute('data-created-by', data.createdBy);
        card.setAttribute('data-mythology', 'greek');

        card.innerHTML = `
            <div class="hero-icon-display">${data.icon}</div>
            <h3>${data.name}</h3>
            <p>${data.subtitle}</p>
        `;

        card.onclick = () => window.location.href = `${doc.id}.html`;

        grid.appendChild(card);

        // Add edit icon
        renderEditIcon({
            cardElement: card,
            entityId: doc.id,
            entityType: 'deity',
            createdBy: data.createdBy,
            mythology: 'greek'
        });
    });
}

document.addEventListener('DOMContentLoaded', loadDeities);
```

---

## Visual Design

### Add Entity Card Appearance

**Default State:**
- Semi-transparent background with blur
- **Dashed border** in cyan (100, 255, 218)
- Large "+" icon
- Label text in Cinzel font
- Subtle shadow

**Hover State:**
- Border becomes solid
- Background brightens
- Icon rotates 90 degrees
- Scale increases slightly
- Cyan glow appears
- Enhanced shadow

**Visual Differentiation:**
- Regular entity cards have **solid borders**
- Add entity card has **dashed border**
- This makes it immediately recognizable as an action card

### Edit Icon Appearance

**Default State:**
- Small floating button in corner
- Glassmorphism background
- Cyan border and glow
- Pencil emoji (✏️)

**Hover State:**
- Scales up 10%
- Brighter glow
- Icon rotates -15 degrees
- Tooltip appears above

**Ownership:**
- Only visible when `currentUser.uid === entity.createdBy`
- Gracefully hidden for other users
- No layout shift when hidden

---

## Troubleshooting

### Card Not Appearing

**Issue**: Add entity card doesn't show up

**Solutions**:
1. Check if user is logged in:
   ```javascript
   console.log('User:', window.firebaseAuth.getCurrentUser());
   ```

2. Verify container exists:
   ```javascript
   console.log('Container:', document.getElementById('add-entity-container'));
   ```

3. Check console for errors

4. Ensure CSS is loaded:
   ```javascript
   console.log('CSS loaded:', document.querySelector('link[href*="add-entity-card.css"]'));
   ```

### Edit Icon Not Showing

**Issue**: Edit icon doesn't appear on user's own content

**Solutions**:
1. Verify `createdBy` matches current user:
   ```javascript
   const user = window.firebaseAuth.getCurrentUser();
   console.log('Current user:', user?.uid);
   console.log('Created by:', cardElement.getAttribute('data-created-by'));
   ```

2. Check if card has position context:
   ```javascript
   const card = document.querySelector('.deity-card');
   console.log('Position:', window.getComputedStyle(card).position);
   // Should be 'relative', 'absolute', or 'fixed'
   ```

3. Verify component loaded:
   ```javascript
   console.log('EditIcon class:', window.EditIcon);
   ```

### Click Event Conflicts

**Issue**: Clicking edit icon navigates to detail page

**Solution**: Edit icon automatically stops propagation. If still having issues:

```javascript
renderEditIcon({
    cardElement: card,
    // ... other options
});

// Ensure card click handler is added AFTER edit icon
card.addEventListener('click', () => {
    window.location.href = 'detail.html';
});
```

### Styling Not Applied

**Issue**: Card doesn't match site aesthetic

**Solutions**:
1. Verify CSS load order:
   ```html
   <link rel="stylesheet" href="/css/styles.css">
   <link rel="stylesheet" href="/css/entity-display.css">
   <link rel="stylesheet" href="/css/add-entity-card.css">
   ```

2. Check for CSS conflicts in dev tools

3. Ensure parent grid has correct class:
   ```html
   <div class="pantheon-grid"> <!-- or deities-grid, heroes-grid, etc. -->
   ```

---

## Best Practices

### 1. Always Provide Context

```javascript
// Good - Explicit context
renderAddEntityCard({
    containerId: 'add-entity',
    entityType: 'deity',
    mythology: 'greek',
    category: 'olympian'
});

// Okay - Auto-detection (but less predictable)
renderAddEntityCard({
    containerId: 'add-entity'
});
```

### 2. Match Grid Naming Conventions

Use consistent grid class names:
- `pantheon-grid` for deity collections
- `heroes-grid` for hero collections
- `creatures-grid` for creature collections
- `items-grid` for spiritual items
- `places-grid` for sacred places
- `herbs-grid` for herbal lore

### 3. Position at End of Grid

```html
<div class="pantheon-grid">
    <!-- Existing cards first -->
    <div class="deity-card">Zeus</div>
    <div class="deity-card">Hera</div>

    <!-- Add card last -->
    <div id="add-deity"></div>
</div>
```

Unless you have a specific reason to put it first:

```javascript
renderAddEntityCard({
    containerId: 'add-entity',
    position: 'start' // Appears at beginning of grid
});
```

### 4. Use Semantic Labels

```javascript
// Good
label: 'Add New Deity'
label: 'Submit Sacred Herb'
label: 'Contribute Hero Story'

// Avoid generic
label: 'Add Entity'
label: 'Click Here'
```

### 5. Theme Consistency

Match component theme to page content:

```javascript
// For theory pages
card.cardElement.classList.add('add-entity-card--purple');
icon.iconElement.classList.add('edit-icon--purple');

// For special/rare entities
card.cardElement.classList.add('add-entity-card--gold');
icon.iconElement.classList.add('edit-icon--gold');
```

### 6. Accessibility

Always test with:
- Keyboard navigation (Tab, Enter, Space)
- Screen readers
- High contrast mode
- Reduced motion preferences

The components handle this automatically, but verify in your specific context.

### 7. Mobile Optimization

Components are responsive by default, but test on:
- Phone (< 480px)
- Tablet (< 768px)
- Desktop (> 768px)

### 8. Loading States

Show loading indicators when fetching entities:

```javascript
const grid = document.querySelector('.deities-grid');
grid.innerHTML = '<div class="loading-spinner">Loading...</div>';

// Load entities
await loadEntities();

// Then add the add-entity card
renderAddEntityCard({ containerId: 'add-deity' });
```

### 9. Error Handling

Wrap initialization in try-catch:

```javascript
try {
    renderAddEntityCard({
        containerId: 'add-entity',
        entityType: 'deity',
        mythology: 'greek'
    });
} catch (error) {
    console.error('Failed to render add entity card:', error);
    // Gracefully degrade - site still works without contribution features
}
```

### 10. Cleanup on SPA Navigation

If using single-page app routing:

```javascript
let addCard = null;
let editIcons = [];

// On page load
addCard = renderAddEntityCard({ /* options */ });
editIcons = renderEditIconsOnCards(cards);

// On page navigation
if (addCard) addCard.destroy();
editIcons.forEach(icon => icon.destroy());
```

---

## Advanced Usage

### Custom Redirect Logic

```javascript
const card = renderAddEntityCard({
    containerId: 'add-entity',
    entityType: 'deity',
    mythology: 'greek'
});

// Override default redirect
card.cardElement.addEventListener('click', (e) => {
    e.stopPropagation();

    // Custom logic
    const confirmSubmit = confirm('Ready to add a new deity?');
    if (confirmSubmit) {
        window.location.href = '/custom-submission-form.html?type=deity';
    }
});
```

### Conditional Visibility

```javascript
const card = renderAddEntityCard({
    containerId: 'add-entity',
    showForGuests: false // Only show for logged-in users
});

// Later, change visibility rules
window.firebaseAuth.onAuthStateChanged(user => {
    if (user && user.emailVerified) {
        card.cardElement.style.display = '';
    } else {
        card.cardElement.style.display = 'none';
    }
});
```

### Multiple Add Cards

Different entity types on same page:

```html
<section>
    <h2>Deities</h2>
    <div class="deities-grid">
        <!-- Deity cards -->
        <div id="add-deity"></div>
    </div>
</section>

<section>
    <h2>Heroes</h2>
    <div class="heroes-grid">
        <!-- Hero cards -->
        <div id="add-hero"></div>
    </div>
</section>

<script>
    renderAddEntityCard({
        containerId: 'add-deity',
        entityType: 'deity',
        label: 'Add Deity'
    });

    renderAddEntityCard({
        containerId: 'add-hero',
        entityType: 'hero',
        label: 'Add Hero'
    });
</script>
```

---

## Testing Checklist

Before deploying, verify:

- [ ] Card appears for logged-in users
- [ ] Card hidden for guests (unless `showForGuests: true`)
- [ ] Clicking card navigates to correct URL with query params
- [ ] Edit icons appear on user's own content
- [ ] Edit icons hidden on others' content
- [ ] Clicking edit icon opens edit form (not detail page)
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Hover effects animate smoothly
- [ ] Mobile layout responsive
- [ ] High contrast mode readable
- [ ] Reduced motion respects preference
- [ ] No console errors
- [ ] Grid layout not broken
- [ ] Theme matches page aesthetic

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Uses modern CSS features:
- `backdrop-filter` (glassmorphism)
- CSS Grid
- CSS Custom Properties
- `prefers-reduced-motion`
- `prefers-contrast`

---

## License

Part of Eyes of Azrael project.

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting)
2. Review [Integration Examples](#integration-examples)
3. Check browser console for errors
4. Verify Firebase Auth is initialized

---

## Changelog

**v1.0.0** (2024-12-18)
- Initial release
- Add Entity Card component
- Edit Icon component
- Full documentation
- Integration examples

---

**Happy Contributing!** 🎉
