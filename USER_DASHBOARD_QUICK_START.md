# User Dashboard & Forms - Quick Start Guide

## What Was Updated

### Files Modified
1. **`js/components/user-dashboard.js`** - Complete rewrite with modern UI
2. **`js/components/entity-form.js`** - Complete rewrite with multi-step wizard
3. **`css/entity-forms.css`** - Enhanced with new component styles

### Files Using Existing Styles
- **`css/user-dashboard.css`** - Already compliant with theme system

## Key Features Added

### Dashboard Features
- 📊 **Statistics Cards** - Total entities, active count, mythologies, days active
- 📅 **Activity Timeline** - Recent updates at a glance
- 🔍 **Advanced Filtering** - By type, status, and search
- ⌨️ **Keyboard Navigation** - Arrow keys between cards
- ♿ **Full Accessibility** - Screen readers, ARIA, focus management

### Form Features
- 🎯 **Multi-Step Wizard** - 3-step guided form
- 📝 **Rich Text Editor** - WYSIWYG with formatting toolbar
- 🖼️ **Image Upload** - Preview before submit
- 🏷️ **Tags Input** - Easy tag management
- 💾 **Auto-Save** - Drafts saved every 2 seconds
- ✅ **Inline Validation** - Real-time error feedback

## How to Use

### Initialize Dashboard

```javascript
// 1. Import/load the component
<script src="/js/components/user-dashboard.js"></script>

// 2. Create instance
const dashboard = new UserDashboard({
    crudManager: window.crudManager,
    auth: firebase.auth()
});

// 3. Render and initialize
const container = document.getElementById('dashboard-container');
dashboard.render().then(html => {
    container.innerHTML = html;
    dashboard.initialize(container);
});
```

### Initialize Form

```javascript
// 1. Import/load the component
<script src="/js/components/entity-form.js"></script>

// 2. Create instance
const form = new EntityForm({
    crudManager: window.crudManager,
    collection: 'deities', // or 'creatures', 'heroes', etc.
    entityId: null, // null for create, ID for edit
    onSuccess: (result) => {
        alert('Entity saved!');
        // Refresh dashboard, etc.
    },
    onCancel: () => {
        // Close modal, etc.
    }
});

// 3. Render and initialize
const container = document.getElementById('form-container');
form.render().then(html => {
    container.innerHTML = html;
    form.initialize(container);
});
```

## Keyboard Shortcuts

### Dashboard
- **Tab** - Navigate between elements
- **Arrow Keys** - Navigate entity cards
- **Enter/Space** - Activate focused card

### Form
- **Tab** - Navigate form fields
- **Ctrl/Cmd + Enter** - Submit form (on last step)
- **Ctrl/Cmd + S** - Save draft
- **Esc** - Cancel/close form

### Rich Text Editor
- **Ctrl/Cmd + B** - Bold
- **Ctrl/Cmd + I** - Italic
- **Ctrl/Cmd + U** - Underline

### Tags Input
- **Enter** or **Comma** - Add tag
- **Backspace** - Delete last tag (when input empty)

## CSS Variables Used

All components use theme variables from `themes/theme-base.css`:

```css
/* Colors */
--color-primary
--color-secondary
--color-background
--color-surface
--color-text-primary
--color-text-secondary

/* Spacing */
--spacing-xs
--spacing-sm
--spacing-md
--spacing-lg
--spacing-xl

/* Others */
--radius-lg
--shadow-lg
--transition-base
```

## Common Customizations

### Change Entity Collections
Edit the `collections` array in `handleCreateNew()`:

```javascript
const collections = [
    { value: 'deities', label: '🏛️ Deity', description: '...' },
    { value: 'custom', label: '🌟 Custom', description: '...' },
    // Add more...
];
```

### Add Custom Field Schema
Edit `getSchema()` in entity-form.js:

```javascript
const specificFields = {
    customType: [
        {
            name: 'customField',
            label: 'Custom Field',
            type: 'text',
            required: true,
            placeholder: 'Enter value...',
            helpText: 'Help text here'
        }
    ]
};
```

### Modify Stats Displayed
Edit `renderStats()` in user-dashboard.js:

```javascript
renderStats() {
    const stats = this.calculateStats();

    return `
        <div class="stat-card glass-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">${stats.custom}</div>
            <div class="stat-label">Custom Stat</div>
        </div>
    `;
}
```

## Accessibility Checklist

When testing, verify:

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Screen reader announces form errors
- [ ] ARIA labels are present on icon buttons
- [ ] Form validation works without mouse
- [ ] Modal can be closed with Escape key
- [ ] Tab order is logical
- [ ] Error messages are associated with fields

## Troubleshooting

### Dashboard Not Loading
**Check:**
1. Firebase auth is initialized
2. CRUD manager is available
3. User is signed in
4. Console for errors

### Form Not Submitting
**Check:**
1. All required fields filled
2. Validation passing
3. CRUD manager available
4. Network connectivity
5. Console for errors

### Styles Not Applying
**Check:**
1. CSS files loaded in correct order:
   ```html
   <link href="themes/theme-base.css" rel="stylesheet"/>
   <link href="css/entity-forms.css" rel="stylesheet"/>
   <link href="css/user-dashboard.css" rel="stylesheet"/>
   ```
2. No CSS conflicts
3. Theme picker initialized

### Images Not Uploading
**Check:**
1. File size under 5MB
2. Valid image format (PNG, JPG, GIF)
3. Browser supports FileReader API
4. Storage permissions in Firebase

## Browser Support

### Fully Supported
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

### Partially Supported (with fallbacks)
- IE 11 - Not recommended
- Older mobile browsers

### Required Features
- CSS Grid
- CSS Custom Properties
- Flexbox
- ES6 JavaScript
- FileReader API
- localStorage

## Performance Tips

1. **Limit Entity Display** - Show 20-50 at a time, add pagination
2. **Debounce Search** - Already implemented (300ms)
3. **Optimize Images** - Resize before upload
4. **Use Virtual Scrolling** - For 100+ entities
5. **Lazy Load** - Load entities on scroll

## Security Notes

1. **Client-side validation only** - Always validate server-side too
2. **Image uploads** - Stored as base64, consider cloud storage for production
3. **XSS Prevention** - HTML escaping implemented
4. **Auth checks** - User must be authenticated

## Next Steps

After implementing these components:

1. **Test thoroughly** - All features and accessibility
2. **Add server validation** - Firebase Security Rules
3. **Optimize images** - Implement image compression
4. **Add analytics** - Track usage patterns
5. **Monitor performance** - Check load times
6. **Gather feedback** - From actual users

## Support Resources

- **Design Standards** - See `HISTORIC_DESIGN_STANDARDS.md`
- **Firebase Guide** - See `FIREBASE_MIGRATION_QUICK_REFERENCE.md`
- **Full Summary** - See `USER_DASHBOARD_CRUD_POLISH_SUMMARY.md`
- **ARIA Docs** - https://www.w3.org/WAI/ARIA/apg/
- **WCAG Guidelines** - https://www.w3.org/WAI/WCAG21/quickref/

## Quick Tips

💡 **Tip 1:** Use `localStorage` to persist filter preferences
💡 **Tip 2:** Add toast notifications for better UX
💡 **Tip 3:** Implement undo functionality for deletions
💡 **Tip 4:** Add bulk operations for power users
💡 **Tip 5:** Create entity templates for common types

## Code Examples

### Custom Toast Notification

```javascript
class Toast {
    static show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    static success(msg) { this.show(msg, 'success'); }
    static error(msg) { this.show(msg, 'error'); }
    static info(msg) { this.show(msg, 'info'); }
}

// Usage
window.toast = Toast;
```

### Persist Filter State

```javascript
// In dashboard initialize()
const savedFilters = localStorage.getItem('dashboard-filters');
if (savedFilters) {
    this.filter = JSON.parse(savedFilters);
}

// On filter change
this.filter.collection = e.target.value;
localStorage.setItem('dashboard-filters', JSON.stringify(this.filter));
this.refresh();
```

### Add Confirmation Modal

```javascript
async handleDelete(collection, id) {
    const confirmed = await this.showConfirmModal(
        'Delete Entity?',
        'This will mark the entity as deleted. You can restore it later.'
    );

    if (confirmed) {
        // Delete logic...
    }
}

showConfirmModal(title, message) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="modal-content glass-card">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary cancel">Cancel</button>
                    <button class="btn btn-primary confirm">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.cancel').onclick = () => {
            modal.remove();
            resolve(false);
        };

        modal.querySelector('.confirm').onclick = () => {
            modal.remove();
            resolve(true);
        };
    });
}
```

---

**Ready to use!** The dashboard and forms are fully functional and accessible. Just integrate with your Firebase instance and you're good to go! 🚀
