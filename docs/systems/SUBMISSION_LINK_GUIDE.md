# Submission Link Component Guide

A beautiful, reusable component for adding contextual "Submit Content" buttons to any page in the Eyes of Azrael project.

## Features

- **Contextual Awareness**: Automatically detects page type and provides appropriate labels
- **Multiple Button Styles**: FAB, inline, dropdown, and card variants
- **Beautiful Design**: Glass morphism styling with smooth animations
- **Fully Responsive**: Adapts to mobile, tablet, and desktop
- **Accessible**: ARIA labels, keyboard navigation, high contrast support
- **Auto-Injection**: Automatically add FAB buttons to pages
- **Dark Mode**: Automatic dark mode support

## Quick Start

### 1. Include Files

Add to your HTML:

```html
<link rel="stylesheet" href="css/submission-link.css">
<script src="js/components/submission-link.js"></script>
```

### 2. Auto-Inject FAB Button

Add this script to automatically inject a floating action button:

```html
<script>
    SubmissionLink.autoInject();
</script>
```

That's it! The component will:
- Detect your page context (deities, heroes, etc.)
- Add appropriate label ("Add Deity", "Add Hero", etc.)
- Position itself in the bottom-right corner
- Add a subtle pulsing animation to attract attention

## Button Styles

### FAB (Floating Action Button)

Perfect for global "add content" actions. Appears in bottom-right corner.

```javascript
// Auto-inject
SubmissionLink.autoInject();

// Or create manually
const fab = new SubmissionLink({ style: 'fab' });
document.body.appendChild(fab.element);
```

**Features:**
- Glass morphism design
- Expands on hover to show full label
- Pulsing glow animation
- Fixed position in bottom-right

### Inline Button

Great for toolbars, page headers, or within content.

```javascript
const button = SubmissionLink.createInline({
    label: 'Add Deity',
    icon: '➕'
});
container.appendChild(button);
```

**Features:**
- Subtle glass effect
- Solid background on hover
- Full-width on mobile

### Dropdown Menu Item

Designed for navigation menus and dropdowns.

```javascript
const menuItem = SubmissionLink.createDropdownItem({
    label: 'Submit Content'
});
dropdown.appendChild(menuItem);
```

**Features:**
- Matches dropdown styling
- Slides right on hover
- Icon + text layout

### Card Action Button

Perfect for grid cards and content previews.

```javascript
const cardButton = SubmissionLink.createCardButton({
    label: 'Add Hero'
});
card.appendChild(cardButton);
```

**Features:**
- Compact size
- Subtle elevation on hover
- Matches card aesthetics

## Context Detection

The component automatically detects page context from the URL:

| URL Pattern | Context | Label | Icon |
|------------|---------|-------|------|
| `/deities/` | deity | Add Deity | ➕ |
| `/heroes/` | hero | Add Hero | ➕ |
| `/creatures/` | creature | Add Creature | ➕ |
| `/texts/` | text | Add Text | ➕ |
| `/teachings/` | teaching | Add Teaching | ➕ |
| `/theology/` | theology | Add Theology | ➕ |
| `/lineage/` | lineage | Add Lineage | ➕ |
| `/mythos/christian/` | mythology | Submit Content | ➕ |
| `/theories/` | theory | Submit Theory | 📝 |
| Other | general | Contribute | ➕ |

### Override Context

You can manually override the detected context:

```javascript
const button = new SubmissionLink({
    context: {
        type: 'deity',
        label: 'Add Deity',
        icon: '➕'
    }
});
```

## API Reference

### Constructor

```javascript
new SubmissionLink(options)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `style` | string | `'fab'` | Button style: `'fab'`, `'inline'`, `'dropdown'`, `'card'` |
| `label` | string | Auto-detected | Custom label text |
| `icon` | string | Auto-detected | Custom icon (emoji or text) |
| `context` | object\|null | Auto-detected | Force specific context |
| `url` | string\|null | Auto-calculated | Custom submission URL |
| `className` | string | `''` | Additional CSS classes |

### Static Methods

#### `autoInject(options)`

Automatically inject a FAB button to the page.

```javascript
SubmissionLink.autoInject();

// With custom options
SubmissionLink.autoInject({
    label: 'Custom Label',
    icon: '🎯'
});
```

Returns: `SubmissionLink` instance or `null` if not injected (e.g., already on submission page)

#### `render(options)`

Render button as HTML string.

```javascript
const html = SubmissionLink.render({
    style: 'inline',
    label: 'Add Hero'
});
container.innerHTML = html;
```

Returns: HTML string

#### `createInline(options)`

Create inline button element.

```javascript
const button = SubmissionLink.createInline({ label: 'Add Deity' });
container.appendChild(button);
```

Returns: HTML element

#### `createDropdownItem(options)`

Create dropdown menu item element.

```javascript
const item = SubmissionLink.createDropdownItem({ label: 'Submit Content' });
dropdown.appendChild(item);
```

Returns: HTML element

#### `createCardButton(options)`

Create card action button element.

```javascript
const button = SubmissionLink.createCardButton({ label: 'Add Hero' });
card.appendChild(button);
```

Returns: HTML element

#### `isSubmissionPage()`

Check if current page is a submission page.

```javascript
if (!SubmissionLink.isSubmissionPage()) {
    SubmissionLink.autoInject();
}
```

Returns: Boolean

#### `removeAll()`

Remove all submission links from the page.

```javascript
SubmissionLink.removeAll();
```

#### `updateAll(options)`

Update all submission links with new options.

```javascript
SubmissionLink.updateAll({ label: 'New Label' });
```

## Usage Examples

### Example 1: Simple Auto-Injection

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="css/submission-link.css">
</head>
<body>
    <!-- Your page content -->

    <script src="js/components/submission-link.js"></script>
    <script>
        SubmissionLink.autoInject();
    </script>
</body>
</html>
```

### Example 2: Page Header with Inline Button

```html
<header>
    <h1>Greek Heroes</h1>
    <div id="header-actions"></div>
</header>

<script>
    const button = SubmissionLink.createInline({
        label: 'Add Hero',
        icon: '➕'
    });
    document.getElementById('header-actions').appendChild(button);
</script>
```

### Example 3: Navigation Dropdown

```html
<nav>
    <div class="dropdown">
        <button>Actions</button>
        <div class="dropdown-menu" id="actions-menu">
            <!-- Other menu items -->
        </div>
    </div>
</nav>

<script>
    const menuItem = SubmissionLink.createDropdownItem({
        label: 'Submit Content'
    });
    document.getElementById('actions-menu').appendChild(menuItem);
</script>
```

### Example 4: Grid of Cards

```html
<div class="grid">
    <div class="card">
        <h3>Zeus</h3>
        <p>King of the Gods</p>
        <div class="card-actions" id="card-actions"></div>
    </div>
</div>

<script>
    const button = SubmissionLink.createCardButton({
        label: 'Add Deity'
    });
    document.getElementById('card-actions').appendChild(button);
</script>
```

### Example 5: Custom URL

```html
<script>
    const button = new SubmissionLink({
        style: 'inline',
        label: 'Submit Custom Content',
        url: '/custom/submit-page.html'
    });
    container.appendChild(button.element);
</script>
```

### Example 6: Conditional Injection

```javascript
// Only inject on mythology pages
if (window.location.pathname.includes('/mythos/')) {
    SubmissionLink.autoInject();
}

// Don't inject on submission pages
if (!SubmissionLink.isSubmissionPage()) {
    SubmissionLink.autoInject();
}
```

## Styling Customization

### Custom Colors

Override CSS variables to customize colors:

```css
.submission-link--fab {
    background: linear-gradient(135deg, #your-color-1, #your-color-2);
}

.submission-link--fab:hover {
    background: linear-gradient(135deg, #your-hover-color-1, #your-hover-color-2);
}
```

### Custom Positioning

Move FAB to different corner:

```css
.submission-link--fab {
    /* Top-right instead of bottom-right */
    top: 2rem;
    bottom: auto;
}
```

### Disable Pulsing

```css
.submission-link--fab.submission-link--pulse {
    animation: none;
}
```

## Accessibility

The component includes comprehensive accessibility features:

- **ARIA Labels**: Each button has appropriate `aria-label`
- **Keyboard Navigation**: Full keyboard support with visible focus states
- **Screen Readers**: Semantic HTML and descriptive labels
- **High Contrast**: Enhanced borders in high contrast mode
- **Reduced Motion**: Animations disabled when user prefers reduced motion
- **Focus Management**: Clear focus indicators for keyboard navigation

## Browser Support

Works in all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Graceful Degradation:**
- Backdrop filter fallback for older browsers
- Flexbox/Grid with fallbacks

## Performance

- **Lightweight**: < 5KB CSS + < 8KB JS (unminified)
- **No Dependencies**: Pure vanilla JavaScript
- **Lazy Loading**: Auto-injection only runs when needed
- **Efficient**: Minimal DOM manipulation

## Best Practices

### DO:
- ✅ Use `autoInject()` for simple FAB placement
- ✅ Let the component detect context automatically
- ✅ Use appropriate button style for context
- ✅ Test on mobile devices

### DON'T:
- ❌ Inject FAB on submission pages (already prevented)
- ❌ Create multiple FABs on the same page
- ❌ Override default context unless necessary
- ❌ Use inline buttons in place of FAB for global actions

## Troubleshooting

### Button not appearing?

1. Check that CSS file is loaded
2. Ensure JavaScript file is loaded
3. Verify `autoInject()` is called after DOM ready
4. Check browser console for errors

### Wrong label showing?

1. Context detection is URL-based
2. Override with custom `context` option
3. Check URL patterns in code

### Button in wrong position?

1. Check for conflicting CSS
2. Verify `z-index` is not overridden
3. Test with browser DevTools

### Styling looks broken?

1. Ensure CSS file is loaded correctly
2. Check for CSS conflicts
3. Verify browser supports backdrop-filter

## Demo

Open `submission-link-demo.html` in your browser to see all button styles and features in action.

## Files

- **JavaScript**: `js/components/submission-link.js`
- **CSS**: `css/submission-link.css`
- **Demo**: `submission-link-demo.html`
- **Guide**: `SUBMISSION_LINK_GUIDE.md` (this file)

## Support

For issues or questions:
1. Check this guide
2. Review the demo page
3. Inspect browser console for errors
4. Check CSS/JS file paths are correct
