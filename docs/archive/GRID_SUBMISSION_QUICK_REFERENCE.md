# Grid Submission Integration - Quick Reference

## One-Minute Setup

### Add to Any Entity Grid Page

```html
<!-- In <head> -->
<link rel="stylesheet" href="../../../css/add-entity-card.css">
<script defer src="../../../js/components/add-entity-card.js"></script>

<!-- Add ID to your grid -->
<div class="pantheon-grid" id="my-entity-grid">
  <!-- your entity cards here -->
</div>

<!-- Before </body> -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    window.renderAddEntityCard({
        containerId: 'my-entity-grid',
        entityType: 'deity',    // deity, hero, creature, etc.
        mythology: 'greek'      // greek, norse, egyptian, etc.
    });
});
</script>
```

## Common Use Cases

### Basic Usage (Auto-detect Everything)
```javascript
window.renderAddEntityCard({
    containerId: 'deities-grid'
    // mythology and entityType detected automatically
});
```

### Index Page (Specific Type)
```javascript
window.renderAddEntityCard({
    containerId: 'heroes-grid',
    entityType: 'hero',
    mythology: 'norse'
});
```

### Detail Page (Related Entities)
```javascript
window.renderAddEntityCard({
    containerId: 'related-items-grid',
    entityType: 'item',
    parentEntity: 'zeus',           // Current entity ID
    relationshipType: 'owned_by'    // Type of relationship
});
```

### Multiple Cards per Page
```javascript
// Olympian deities
window.renderAddEntityCard({
    containerId: 'olympian-grid',
    category: 'olympian'
});

// Titan deities
window.renderAddEntityCard({
    containerId: 'titan-grid',
    category: 'titan'
});
```

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerId` | string | **required** | ID of grid container |
| `entityType` | string | auto-detect | deity, hero, creature, etc. |
| `mythology` | string | auto-detect | greek, norse, egyptian, etc. |
| `category` | string | null | Optional category filter |
| `parentEntity` | string | null | Parent entity ID for relationships |
| `relationshipType` | string | null | Type of relationship |
| `position` | string | 'end' | 'start' or 'end' of grid |
| `showForGuests` | boolean | true | Show card to non-logged-in users |
| `label` | string | auto-generate | Custom label text |
| `guestLabel` | string | auto-generate | Custom guest state label |
| `icon` | string | '+' | Icon character or HTML |

## Visual States

### Guest (Not Logged In)
- Purple border and glow
- Lock icon (🔒)
- "Sign in to add..." label
- Click opens login modal

### Authenticated
- Teal border and glow
- Plus icon (+)
- "Add [Type]..." label
- Click navigates to form

## Auto-Deploy to All Pages

```bash
# Preview changes (dry run)
node scripts/add-submission-cards-to-grids.js --dry-run

# Deploy to all mythologies
node scripts/add-submission-cards-to-grids.js

# Deploy to one mythology
node scripts/add-submission-cards-to-grids.js --mythology=greek

# Deploy to one entity type
node scripts/add-submission-cards-to-grids.js --entity-type=deities
```

## Customization

### Custom Label
```javascript
window.renderAddEntityCard({
    containerId: 'grid',
    label: 'Contribute Your Knowledge',
    guestLabel: 'Login to Share Your Insights'
});
```

### Custom Icon
```javascript
window.renderAddEntityCard({
    containerId: 'grid',
    icon: '✨'  // Any emoji or symbol
});
```

### Position at Start of Grid
```javascript
window.renderAddEntityCard({
    containerId: 'grid',
    position: 'start'  // Appears first instead of last
});
```

### Hide from Guests
```javascript
window.renderAddEntityCard({
    containerId: 'grid',
    showForGuests: false  // Only visible when logged in
});
```

## Troubleshooting

### Card Not Showing
1. Check container ID matches: `document.getElementById('your-id')`
2. Check CSS loaded: DevTools Network tab
3. Check JS loaded: `typeof window.renderAddEntityCard`
4. Check for JavaScript errors: Console tab

### Context Not Detected
1. Add meta tags: `<meta name="mythology" content="greek">`
2. Add data attributes: `<main data-mythology="greek">`
3. Or specify manually in options

### Card Shows But Click Doesn't Work
1. Check Firebase Auth loaded
2. Check for JavaScript errors
3. Verify `redirectUrl` path is correct

## Files

- **Component**: `js/components/add-entity-card.js`
- **Styles**: `css/add-entity-card.css`
- **Deploy Script**: `scripts/add-submission-cards-to-grids.js`
- **Full Docs**: `GRID_SUBMISSION_INTEGRATION_REPORT.md`

## Support

See full documentation in `GRID_SUBMISSION_INTEGRATION_REPORT.md` for:
- Complete API reference
- Security considerations
- Admin approval workflow
- Advanced customization
- Performance optimization
