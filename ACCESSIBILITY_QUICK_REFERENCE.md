# Accessibility Quick Reference Guide
**For Eyes of Azrael Developers**

## Quick Checklist

### Before Every Commit
- [ ] All buttons have accessible text or `aria-label`
- [ ] All images have `alt` attributes
- [ ] All form inputs have associated `<label>`
- [ ] Keyboard navigation works
- [ ] Focus is visible
- [ ] Color contrast is sufficient (4.5:1 minimum)

---

## Common Patterns

### Buttons with Icons Only
```html
<!-- ❌ BAD -->
<button>🔍</button>

<!-- ✅ GOOD -->
<button aria-label="Search entities">🔍</button>
```

### Images
```html
<!-- ❌ BAD -->
<img src="zeus.jpg">

<!-- ✅ GOOD - Meaningful image -->
<img src="zeus.jpg" alt="Zeus wielding a thunderbolt">

<!-- ✅ GOOD - Decorative image -->
<img src="divider.png" alt="" role="presentation">
```

### Form Inputs
```html
<!-- ❌ BAD -->
<input type="text" placeholder="Name">

<!-- ✅ GOOD -->
<label for="name">Name</label>
<input id="name" type="text" placeholder="e.g., Zeus">
```

### Required Fields
```html
<!-- ✅ GOOD -->
<label for="email">
    Email <span aria-label="required">*</span>
</label>
<input id="email" type="email" required aria-required="true">
```

### Error Messages
```html
<!-- ✅ GOOD -->
<input id="email"
       aria-invalid="true"
       aria-describedby="email-error">
<span id="email-error" role="alert">
    Please enter a valid email address
</span>
```

### Modal Dialogs
```html
<!-- ✅ GOOD -->
<div role="dialog"
     aria-labelledby="modal-title"
     aria-modal="true">
    <h2 id="modal-title">Edit Entity</h2>
    <button aria-label="Close dialog">×</button>
    <!-- Content -->
</div>
```

### Loading States
```html
<!-- ✅ GOOD -->
<div role="status" aria-live="polite">
    <span>Loading entities...</span>
</div>
```

### Success/Error Messages
```html
<!-- ✅ GOOD - Error (assertive) -->
<div role="alert" aria-live="assertive">
    Failed to save entity
</div>

<!-- ✅ GOOD - Success (polite) -->
<div role="status" aria-live="polite">
    Entity saved successfully
</div>
```

### Expandable Sections
```html
<!-- ✅ GOOD -->
<button aria-expanded="false"
        aria-controls="panel-1">
    Show Details
</button>
<div id="panel-1" hidden>
    <!-- Content -->
</div>
```

### Navigation
```html
<!-- ✅ GOOD -->
<nav role="navigation" aria-label="Main navigation">
    <a href="#home">Home</a>
    <a href="#deities" aria-current="page">Deities</a>
</nav>
```

### Skip Links
```html
<!-- ✅ GOOD - First element in <body> -->
<a href="#main-content" class="skip-link">
    Skip to main content
</a>
```

---

## ARIA Cheat Sheet

### Common ARIA Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `aria-label` | Accessible name | `<button aria-label="Close">×</button>` |
| `aria-labelledby` | References label | `<div role="dialog" aria-labelledby="title">` |
| `aria-describedby` | Additional description | `<input aria-describedby="help-text">` |
| `aria-required` | Required field | `<input required aria-required="true">` |
| `aria-invalid` | Validation error | `<input aria-invalid="true">` |
| `aria-live` | Dynamic updates | `<div aria-live="polite">` |
| `aria-expanded` | Expandable state | `<button aria-expanded="false">` |
| `aria-controls` | Controls element | `<button aria-controls="panel-1">` |
| `aria-current` | Current item | `<a aria-current="page">` |
| `aria-hidden` | Hide from screen readers | `<span aria-hidden="true">⭐</span>` |
| `aria-modal` | Modal dialog | `<div role="dialog" aria-modal="true">` |

### ARIA Roles

| Role | Purpose | Example |
|------|---------|---------|
| `role="dialog"` | Modal dialog | `<div role="dialog">` |
| `role="alert"` | Important message | `<div role="alert">Error!</div>` |
| `role="status"` | Status message | `<div role="status">Saved</div>` |
| `role="navigation"` | Navigation landmark | `<nav role="navigation">` |
| `role="search"` | Search form | `<form role="search">` |
| `role="main"` | Main content | `<main role="main">` |
| `role="complementary"` | Aside/sidebar | `<aside role="complementary">` |
| `role="contentinfo"` | Footer info | `<footer role="contentinfo">` |

### ARIA Live Regions

| Value | When to Use | Example |
|-------|-------------|---------|
| `polite` | Non-urgent updates | Search results, save confirmations |
| `assertive` | Urgent updates | Errors, warnings |
| `off` | No announcement | Default |

---

## Keyboard Navigation

### Required Keyboard Support

| Element | Key | Action |
|---------|-----|--------|
| Button | `Enter` or `Space` | Activate |
| Link | `Enter` | Navigate |
| Modal | `Esc` | Close |
| Accordion | `Enter` or `Space` | Expand/collapse |
| Menu | `Arrow Up/Down` | Navigate items |
| All | `Tab` | Move forward |
| All | `Shift+Tab` | Move backward |

### Focus Management Rules

1. **Always visible:** Focus indicators must be visible
2. **Logical order:** Tab order follows visual order
3. **No traps:** Users can always escape focus
4. **Modal traps:** Focus stays in modal until closed
5. **Restore focus:** Return focus after modal closes

---

## Color Contrast

### Minimum Ratios (WCAG AA)

- **Normal text:** 4.5:1
- **Large text (18pt+ or 14pt+ bold):** 3:1
- **UI components:** 3:1

### Safe Color Combinations

| Text | Background | Ratio | Status |
|------|------------|-------|--------|
| `#000000` | `#FFFFFF` | 21:1 | ✅ Excellent |
| `#1565C0` | `#FFFFFF` | 8.2:1 | ✅ Excellent |
| `#0D47A1` | `#FFFFFF` | 11.1:1 | ✅ Excellent |
| `#666666` | `#FFFFFF` | 5.7:1 | ✅ Good |
| `#999999` | `#FFFFFF` | 2.8:1 | ❌ Fail |

---

## Testing Commands

```bash
# Run all accessibility tests
npm test -- __tests__/accessibility.test.js

# Run automated axe-core tests
npm test -- __tests__/accessibility-axe.test.js

# Run with coverage
npm test -- __tests__/accessibility*.test.js --coverage

# Watch mode
npm test -- __tests__/accessibility.test.js --watch
```

---

## Common Mistakes to Avoid

### ❌ Don't Do This

```html
<!-- Missing alt text -->
<img src="deity.jpg">

<!-- Icon button without label -->
<button>🔍</button>

<!-- Input without label -->
<input type="text" placeholder="Name">

<!-- Positive tabindex -->
<button tabindex="1">Click</button>

<!-- Color-only information -->
<span style="color: red;">Error</span>

<!-- Click-only functionality -->
<div onclick="handleClick()">Click me</div>
```

### ✅ Do This Instead

```html
<!-- Alt text on images -->
<img src="deity.jpg" alt="Zeus holding a thunderbolt">

<!-- Labeled icon buttons -->
<button aria-label="Search">🔍</button>

<!-- Labeled inputs -->
<label for="name">Name</label>
<input id="name" type="text">

<!-- Use tabindex="0" or no tabindex -->
<button>Click</button>

<!-- Text + color for information -->
<span class="error" role="alert">
    <strong>Error:</strong> Invalid input
</span>

<!-- Semantic button -->
<button type="button" onclick="handleClick()">Click me</button>
```

---

## Browser DevTools

### Chrome/Edge
1. F12 → Lighthouse tab
2. Select "Accessibility"
3. Generate report

### Firefox
1. F12 → Accessibility tab
2. Check for issues
3. Review ARIA properties

---

## Resources

### Official Standards
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) (Windows - Free)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Windows)
- VoiceOver (macOS/iOS - Built-in)

---

## Need Help?

1. Check existing test files for examples
2. Review `ACCESSIBILITY_TEST_REPORT.md`
3. Use `accessibility-helpers.js` utility functions
4. Ask in code reviews

---

**Remember:** Accessibility is not optional. It's a core requirement for all features.
