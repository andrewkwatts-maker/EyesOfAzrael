# Submission Link Component

> A beautiful, reusable component for adding contextual "Submit Content" buttons to any page in the Eyes of Azrael project.

## Overview

The Submission Link component provides a consistent, accessible way to add submission buttons across the site. It automatically detects page context and provides appropriate labels, making it easy to encourage user contributions.

## Features

- ✅ **Contextual Awareness** - Automatically detects page type (deities, heroes, etc.)
- ✅ **Multiple Styles** - FAB, inline, dropdown, and card variants
- ✅ **Beautiful Design** - Glass morphism with smooth animations
- ✅ **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- ✅ **Accessible** - ARIA labels, keyboard navigation, screen reader support
- ✅ **Auto-Injection** - One-line setup for floating action buttons
- ✅ **Dark Mode** - Automatic dark mode support
- ✅ **Lightweight** - < 15KB total (CSS + JS, unminified)
- ✅ **Zero Dependencies** - Pure vanilla JavaScript

## Quick Start

### 1. Add Files to Your Page

```html
<!-- In <head> or before </head> -->
<link rel="stylesheet" href="css/submission-link.css">

<!-- Before </body> -->
<script src="js/components/submission-link.js"></script>
<script>
    SubmissionLink.autoInject();
</script>
```

That's it! The component will automatically:
- Detect your page context
- Add an appropriate label
- Position itself in the bottom-right corner
- Add a subtle pulsing animation

## Files

```
js/components/submission-link.js    - Main component (8KB)
css/submission-link.css             - Styles (7KB)
submission-link-demo.html           - Full demo page
test-submission-link.html           - Test suite
SUBMISSION_LINK_GUIDE.md           - Complete documentation
SUBMISSION_LINK_INTEGRATION.md     - Integration examples
```

## Button Styles

### 🎯 FAB (Floating Action Button)

Perfect for global "add content" actions. Appears in bottom-right corner.

```javascript
SubmissionLink.autoInject();
```

### 📝 Inline Button

Great for toolbars, page headers, or within content.

```javascript
const button = SubmissionLink.createInline({ label: 'Add Deity' });
container.appendChild(button);
```

### 📋 Dropdown Menu Item

Designed for navigation menus and dropdowns.

```javascript
const item = SubmissionLink.createDropdownItem({ label: 'Submit Content' });
menu.appendChild(item);
```

### 🎴 Card Action Button

Perfect for grid cards and content previews.

```javascript
const card = SubmissionLink.createCardButton({ label: 'Add Hero' });
cardFooter.appendChild(card);
```

## Context Detection

The component automatically detects page context from URL:

| URL Pattern | Label | Icon |
|------------|-------|------|
| `/deities/` | Add Deity | ➕ |
| `/heroes/` | Add Hero | ➕ |
| `/creatures/` | Add Creature | ➕ |
| `/texts/` | Add Text | ➕ |
| `/teachings/` | Add Teaching | ➕ |
| `/theology/` | Add Theology | ➕ |
| `/theories/` | Submit Theory | 📝 |
| Other | Contribute | ➕ |

## Usage Examples

### Example 1: Simple Auto-Injection

```html
<script src="js/components/submission-link.js"></script>
<script>
    SubmissionLink.autoInject();
</script>
```

### Example 2: Page Header Button

```html
<header>
    <h1>Greek Heroes</h1>
    <div id="actions"></div>
</header>

<script>
    const button = SubmissionLink.createInline({ label: 'Add Hero' });
    document.getElementById('actions').appendChild(button);
</script>
```

### Example 3: Custom Configuration

```javascript
SubmissionLink.autoInject({
    label: 'Custom Label',
    icon: '🎯',
    url: '/custom/page.html'
});
```

### Example 4: Multiple Styles

```javascript
// FAB for mobile
if (window.innerWidth < 768) {
    SubmissionLink.autoInject();
}

// Inline for desktop header
else {
    const button = SubmissionLink.createInline();
    header.appendChild(button);
}
```

## API Reference

### Constructor

```javascript
new SubmissionLink(options)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `style` | string | `'fab'` | `'fab'`, `'inline'`, `'dropdown'`, `'card'` |
| `label` | string | Auto | Custom label text |
| `icon` | string | Auto | Custom icon (emoji or text) |
| `context` | object | Auto | Force specific context |
| `url` | string | Auto | Custom submission URL |
| `className` | string | `''` | Additional CSS classes |

### Static Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `autoInject(options)` | Auto-inject FAB button | Instance or null |
| `render(options)` | Render as HTML string | String |
| `createInline(options)` | Create inline button | Element |
| `createDropdownItem(options)` | Create dropdown item | Element |
| `createCardButton(options)` | Create card button | Element |
| `isSubmissionPage()` | Check if on submit page | Boolean |
| `removeAll()` | Remove all links | void |
| `updateAll(options)` | Update all links | void |

## Browser Support

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Opera 76+

**Graceful degradation** for older browsers with fallbacks for:
- Backdrop filter
- CSS Grid & Flexbox
- ES6+ JavaScript

## Accessibility

- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation support
- ✅ Focus visible states
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Semantic HTML

## Testing

Run the test suite by opening `test-submission-link.html` in your browser. It tests:

- Context detection from URLs
- All button style variants
- API method functionality
- Custom configurations
- Element structure
- URL calculation
- Error handling

## Demo

Open `submission-link-demo.html` to see:
- All button styles in action
- Context detection examples
- Integration code samples
- API reference
- Accessibility features

## Documentation

- **`SUBMISSION_LINK_GUIDE.md`** - Complete documentation with detailed API reference
- **`SUBMISSION_LINK_INTEGRATION.md`** - Integration examples for different page types
- **`SUBMISSION_LINK_README.md`** - This file

## Integration Checklist

When adding to a new page:

- [ ] Add CSS file: `<link rel="stylesheet" href="css/submission-link.css">`
- [ ] Add JS file: `<script src="js/components/submission-link.js"></script>`
- [ ] Call auto-inject: `<script>SubmissionLink.autoInject();</script>`
- [ ] Verify correct path depth (adjust `../../` as needed)
- [ ] Test on desktop and mobile
- [ ] Verify correct label appears
- [ ] Check link goes to submission page

## Customization

### Custom Colors

```css
.submission-link--fab {
    background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

### Custom Position

```css
.submission-link--fab {
    top: 2rem;      /* Top instead of bottom */
    bottom: auto;
}
```

### Disable Animations

```css
.submission-link--fab.submission-link--pulse {
    animation: none;
}
```

## Best Practices

### ✅ DO:
- Use `autoInject()` for simple FAB placement
- Let component detect context automatically
- Use appropriate style for context
- Test on mobile devices
- Verify accessibility with keyboard

### ❌ DON'T:
- Inject FAB on submission pages (prevented automatically)
- Create multiple FABs on same page
- Override context unless necessary
- Hardcode paths (let component calculate)

## Troubleshooting

### Button not appearing?

1. Check file paths are correct
2. Ensure JS is loaded after DOM
3. Check browser console for errors
4. Verify CSS file is loaded

### Wrong label?

1. Context detection is URL-based
2. Check URL matches patterns
3. Override with custom context

### Styling issues?

1. Check CSS file is loaded
2. Look for conflicting styles
3. Verify browser supports features

## Performance

- **Lightweight**: < 15KB total
- **Fast**: No network requests after load
- **Efficient**: Minimal DOM manipulation
- **Cached**: Static files cached by browser

## Contributing

To extend context patterns, edit `CONTEXT_PATTERNS` in the JavaScript file:

```javascript
static CONTEXT_PATTERNS = [
    { pattern: /\/new-pattern\//i, context: 'type', label: 'Label', icon: '➕' },
    // ...
];
```

## Support

For issues or questions:

1. Check documentation in `SUBMISSION_LINK_GUIDE.md`
2. Review integration examples in `SUBMISSION_LINK_INTEGRATION.md`
3. Run test suite in `test-submission-link.html`
4. View demo in `submission-link-demo.html`

## License

Part of the Eyes of Azrael project.

## Version

1.0.0 - Initial release

---

**Ready to use!** Just add the two files and call `SubmissionLink.autoInject()` 🚀
