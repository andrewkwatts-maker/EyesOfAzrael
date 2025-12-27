# Content Filter Dropdown - Quick Reference

## Installation

### 1. Add CSS to your page
```html
<link rel="stylesheet" href="css/content-filter-dropdown.css">
```

### 2. Add JavaScript (after dependencies)
```html
<!-- Dependencies -->
<script src="js/content-filter.js"></script>

<!-- Content Filter Dropdown -->
<script src="js/content-filter-dropdown.js"></script>

<!-- Entity Display -->
<script src="js/entity-display.js"></script>
```

### 3. Ensure Firebase is initialized
```html
<script src="js/firebase-init.js"></script>
```

## Usage

### Automatic Integration
Dropdowns are automatically added when you use `EntityDisplay.renderCard()` or `EntityDisplay.renderDetail()`:

```javascript
const entity = {
    id: 'deity-123',
    type: 'deity',
    name: 'Zeus',
    userId: 'user456',        // User-generated content
    userName: 'MythologyFan',
    userTopic: 'olympians'
};

const card = EntityDisplay.renderCard(entity);
document.getElementById('grid').appendChild(card);
// Dropdown automatically appears!
```

### Manual Control

```javascript
// Add dropdown to existing element
window.contentFilterDropdown.addDropdown(element, entity);

// Block a user programmatically
window.contentFilter.hideUser('user123');

// Block a topic
window.contentFilter.hideTopic('monsters');

// Check if content should be shown
const shouldShow = EntityDisplay.shouldDisplayEntity(entity);

// Filter array of entities
const filtered = EntityDisplay.filterEntities(entities);
```

## Dropdown Options

When user clicks the three-dot menu (⋮), they see:

1. **Block [Username]** - Hides all content from this user
2. **Block topic: [Topic]** - Hides all content with this tag
3. **Block all user [Type]s** - Hides all user submissions of this entity type
4. **Hide this submission** - Hides just this one piece of content
5. **Report content** - Sends report to admin (requires sign-in)

## Content Badges

### Official Content
- Green badge with checkmark
- Text: "Official Content"
- No dropdown menu

### Your Contribution
- Blue badge with user icon
- Text: "Your Contribution"
- No dropdown menu

### Community Contribution
- Purple badge with people icon
- Shows: Author name, date, approval status
- Has dropdown menu

## Toast Notifications

Appears in top-right corner when actions are taken:
- **Success** (green) - Content unblocked
- **Info** (blue) - Content blocked/hidden
- **Warning** (yellow) - Caution messages
- **Error** (red) - Operation failed

Auto-dismisses after 3 seconds.

## Storage

### LocalStorage
- `contentFilterSettings` - User filter preferences
- `hiddenSubmissions` - Individual hidden submissions
- `blockedCategories` - Blocked entity types

### Firestore (when signed in)
- `userSettings/{userId}` - Synced filter settings
- `contentReports/{reportId}` - Content reports

## Filter Priority

Content is hidden if ANY of these are true:
1. User is blocked (via ContentFilter)
2. Topic is blocked (via ContentFilter)
3. Category is blocked (via localStorage)
4. Submission is individually hidden (via localStorage)
5. Global filter mode excludes it (defaults-only, defaults-self)

## Styling Customization

Override CSS variables for custom theming:
```css
:root {
    --filter-dropdown-bg: rgba(26, 31, 58, 0.95);
    --filter-dropdown-border: rgba(100, 255, 218, 0.3);
    --filter-menu-hover: rgba(100, 255, 218, 0.1);
    --toast-duration: 3s;
}
```

## Events

Listen for filter changes:
```javascript
window.addEventListener('contentFilterChanged', (e) => {
    console.log('Filter changed:', e.detail);
    // Refresh your content display
});

window.addEventListener('categoryBlocked', (e) => {
    console.log('Category blocked:', e.detail.category);
    // Hide all items of this category
});
```

## Accessibility

- **Keyboard**: Tab to button, Enter/Space to open, Arrow keys to navigate, Enter to select, Escape to close
- **Screen Readers**: Full ARIA support with role="menu" and role="menuitem"
- **Focus Indicators**: Visible focus states on all interactive elements
- **High Contrast**: Supported via CSS
- **Reduced Motion**: Animations disabled when user prefers reduced motion

## Troubleshooting

### Dropdown not appearing
- Check if entity has `userId` property (user-generated content)
- Verify entity is not marked `official: true`
- Confirm CSS file is loaded
- Check browser console for errors

### Filtering not working
```javascript
// Clear all filters and start fresh
window.contentFilter.clearAllHidden();
localStorage.removeItem('hiddenSubmissions');
localStorage.removeItem('blockedCategories');
```

### Debug mode
```javascript
// Enable debug logging
localStorage.setItem('debug-content-filter', 'true');

// View current state
console.log(window.contentFilter.getStats());
console.log(window.contentFilterDropdown.getHiddenSubmissions());
console.log(window.contentFilterDropdown.getBlockedCategories());
```

## Testing

Use the test page:
```
http://localhost:8000/test-content-filtering.html
```

Or create test entities:
```javascript
const testEntity = {
    id: 'test-1',
    type: 'deity',
    name: 'Test Deity',
    userId: 'testuser',
    userName: 'TestUser123',
    userTopic: 'testing'
};

const card = EntityDisplay.renderCard(testEntity);
document.body.appendChild(card);
```

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari iOS 14+
- Mobile Chrome Android 90+

## Performance Tips

1. Use `EntityDisplay.filterEntities()` once, not per-entity
2. Avoid re-rendering all entities on filter change
3. Use CSS transitions, not JavaScript animations
4. Batch filter operations when possible

## Security Notes

- All user input is escaped (XSS prevention)
- Reports require authentication
- Firestore security rules should validate reports
- Consider rate limiting on report submissions
- Filter preferences are private (localStorage)

## Example: Custom Filter Action

```javascript
// Add custom filter logic
const originalShouldShow = window.contentFilter.shouldShow.bind(window.contentFilter);

window.contentFilter.shouldShow = function(entity) {
    // Your custom logic
    if (entity.customField === 'blocked') {
        return false;
    }

    // Call original method
    return originalShouldShow(entity);
};
```

## Quick Checklist

Before going live:
- [ ] CSS file linked in HTML
- [ ] JS file loaded after dependencies
- [ ] Firebase initialized
- [ ] Entity objects have `userId` for user content
- [ ] Entity objects have `official: true` for official content
- [ ] Firestore security rules configured
- [ ] Test on mobile devices
- [ ] Test keyboard navigation
- [ ] Monitor `contentReports` collection

---

**Quick Links:**
- Full Test Report: `CONTENT_FILTERING_TEST_REPORT.md`
- Implementation Summary: `CONTENT_FILTERING_IMPLEMENTATION_SUMMARY.md`
- Test Page: `test-content-filtering.html`
