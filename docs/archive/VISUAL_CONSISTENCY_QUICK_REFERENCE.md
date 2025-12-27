# Visual Consistency Quick Reference Guide
## Eyes of Azrael Mythology Website

**Last Updated:** 2025-12-18

---

## Essential CSS Files (Load in Order)

Every mythology page MUST include these CSS files in this order:

```html
<link href="../../../themes/theme-base.css" rel="stylesheet"/>
<link rel="stylesheet" href="../../../themes/mythology-colors.css">
<link href="../../../styles.css" rel="stylesheet"/>
<link href="../../../themes/corpus-links.css" rel="stylesheet"/>
<link rel="stylesheet" href="../../../themes/smart-links.css">
```

---

## Mandatory HTML Structure

### 1. Main Tag with data-mythology Attribute
```html
<main data-mythology="[MYTHOLOGY_NAME]">
    <!-- All content here -->
</main>
```

Valid mythology names:
- `greek`, `norse`, `egyptian`, `hindu`, `buddhist`, `chinese`
- `celtic`, `roman`, `persian`, `babylonian`, `sumerian`
- `aztec`, `mayan`, `yoruba`, `christian`

### 2. Hero Section (REQUIRED on all deity/entity pages)
```html
<section class="hero-section">
    <div class="hero-icon-display">[ICON EMOJI]</div>
    <h2>[Entity Name]</h2>
    <p class="subtitle" style="font-size: var(--font-size-2xl); margin: 0.5rem 0;">
        [Epithets/Titles]
    </p>
    <p style="font-size: var(--font-size-lg); margin-top: 1rem;">
        [Description paragraph]
    </p>
</section>
```

### 3. Attribute Grid Pattern
```html
<section>
    <h2 style="color: var(--color-primary);">Attributes & Domains</h2>
    <div class="attribute-grid">
        <div class="subsection-card">
            <div class="attribute-label">Label</div>
            <div class="attribute-value">Value</div>
        </div>
        <!-- More cards... -->
    </div>
</section>
```

### 4. Breadcrumb Navigation
```html
<nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="../../../mythos/index.html">Home</a> →
    <a href="../../index.html">[Mythology]</a> →
    <a href="../index.html">[Category]</a> →
    <span>[Current Page]</span>
</nav>
```

**Note:** Use `→` (arrow) for consistency, not `>` or `/`

---

## CSS Variables Reference

### Spacing (Use these instead of hard-coded pixels)
```css
var(--spacing-xs)   /* 4px */
var(--spacing-sm)   /* 8px */
var(--spacing-md)   /* 16px */
var(--spacing-lg)   /* 24px */
var(--spacing-xl)   /* 32px */
var(--spacing-2xl)  /* 40px */
var(--spacing-3xl)  /* 48px */
```

### Font Sizes
```css
var(--font-size-xs)    /* 0.75rem */
var(--font-size-sm)    /* 0.875rem */
var(--font-size-base)  /* 1rem */
var(--font-size-lg)    /* 1.125rem */
var(--font-size-xl)    /* 1.25rem */
var(--font-size-2xl)   /* 1.5rem */
var(--font-size-3xl)   /* 1.875rem */
```

### Border Radius
```css
var(--radius-sm)    /* 4px */
var(--radius-md)    /* 8px */
var(--radius-lg)    /* 12px */
var(--radius-xl)    /* 16px */
var(--radius-2xl)   /* 24px */
var(--radius-full)  /* 9999px - pills */
```

### Mythology-Specific Colors (Auto-applied via data-mythology)
```css
var(--mythos-primary)        /* Primary color */
var(--mythos-secondary)      /* Secondary color */
var(--mythos-accent)         /* Accent color */
var(--mythos-surface)        /* Surface background */
var(--mythos-border)         /* Border color */
var(--mythos-gradient-start) /* Gradient start */
var(--mythos-gradient-end)   /* Gradient end */
```

---

## Special Character Classes

### Egyptian Hieroglyphs
```html
<p style="font-family: 'Segoe UI Historic', 'Segoe UI Symbol', sans-serif;">
    𓃀𓈖𓊪𓅱 (hieroglyphs)
</p>
```

### Nahuatl Terms (Aztec/Mayan)
```html
<span class="nahuatl-term">Quetzalcoatl</span>
```

### Sanskrit/Devanagari (Hindu/Buddhist)
UTF-8 encoding handles this automatically. No special class needed.

### Chinese/Japanese Characters
UTF-8 encoding handles this automatically. No special class needed.

---

## Card System Patterns

### Glass-Morphism Card (Subsection)
```html
<div class="subsection-card">
    <div class="attribute-label">Label</div>
    <div class="attribute-value">Value</div>
</div>
```

### Related Concepts Card
```html
<div class="related-card">
    <h3>Section Title</h3>
    <ul>
        <li><a href="...">Link</a> - Description</li>
    </ul>
</div>
```

### Interlink Panel
```html
<section class="interlink-panel" style="margin-top: 3rem;">
    <h3 class="interlink-header">
        <span class="interlink-icon">🔗</span>
        Related Across the Mythos
    </h3>
    <div class="interlink-grid">
        <!-- Archetype section -->
        <!-- Sacred items section -->
        <!-- Sacred places section -->
        <!-- Cross-cultural parallels -->
    </div>
</section>
```

---

## Color Palettes by Mythology

| Mythology | Primary | Secondary | Theme |
|-----------|---------|-----------|-------|
| **Greek** | #DAA520 Gold | #FFD700 Bright Gold | Olympic majesty |
| **Norse** | #4682B4 Steel Blue | #87CEEB Sky Blue | Northern cold |
| **Egyptian** | #CD853F Peru | #DAA520 Gold | Desert & pharaohs |
| **Hindu** | #FF6347 Tomato | #FFA500 Orange | Sacred fire |
| **Buddhist** | #FFD700 Gold | #FFA500 Orange | Lotus & enlightenment |
| **Chinese** | #DC143C Crimson | #FFD700 Gold | Imperial colors |
| **Celtic** | #228B22 Forest | #32CD32 Lime | Sacred groves |
| **Roman** | #8B0000 Dark Red | #DAA520 Gold | Imperial purple/red |
| **Persian** | #DC143C Crimson | #FFD700 Gold | Sacred fire |
| **Babylonian** | #CD853F Peru | #4169E1 Royal Blue | Clay & lapis |
| **Sumerian** | #CD853F Peru | #4169E1 Royal Blue | Clay & lapis |
| **Aztec** | #40E0D0 Turquoise | #FFD700 Gold | Turquoise & sun |
| **Mayan** | #40E0D0 Turquoise | #FFD700 Gold | Sacred jade |
| **Yoruba** | #DAA520 Gold | #FF8C00 Orange | Savanna & sunset |
| **Christian** | #8B0000 Dark Red | #DAA520 Gold | Sacred purple/gold |

---

## Common Patterns

### Section Header with Color
```html
<h2 style="color: var(--color-primary);">Section Title</h2>
```

### Subsection Header
```html
<h3 style="color: var(--color-secondary); margin-top: 1.5rem;">Subsection</h3>
```

### Citation Block
```html
<div class="citation" style="margin-top: 1rem;">
    <strong>Sources:</strong> Source list here
</div>
```

### List with Proper Spacing
```html
<ul style="margin: var(--spacing-md) 0 0 2rem; line-height: 1.8;">
    <li><strong>Item:</strong> Description</li>
</ul>
```

---

## Responsive Breakpoints

### Desktop (Default)
All styles apply as written.

### Tablet (768px - 1024px)
```css
.deity-grid {
    grid-template-columns: repeat(2, 1fr);
}
```

### Mobile (< 768px)
```css
.hero-section {
    padding: var(--spacing-2xl) var(--spacing-md);
}
.deity-grid {
    grid-template-columns: 1fr;
}
.hero-icon-display {
    font-size: var(--text-5xl, 3rem);
}
```

---

## DO's and DON'Ts

### DO:
- ✅ Always include `data-mythology` attribute on `<main>` tag
- ✅ Use CSS variables for spacing, colors, fonts
- ✅ Include all required CSS files in correct order
- ✅ Use `.hero-section` for deity/entity introductions
- ✅ Use `.subsection-card` for attribute grids
- ✅ Use arrow `→` in breadcrumbs
- ✅ Include `aria-label` on navigation elements

### DON'T:
- ❌ Hard-code pixel values (use CSS variables)
- ❌ Hard-code colors (use var(--mythos-primary) etc.)
- ❌ Skip the `data-mythology` attribute
- ❌ Use inconsistent breadcrumb separators
- ❌ Forget UTF-8 charset meta tag for special characters
- ❌ Skip the mythology-colors.css file

---

## Checklist for New Pages

- [ ] `<meta charset="utf-8"/>` in head
- [ ] All 5 essential CSS files loaded in correct order
- [ ] `<main data-mythology="[name]">` tag with correct mythology name
- [ ] Hero section with icon, title, subtitle, description
- [ ] Breadcrumb navigation with `→` arrows
- [ ] Attribute grid using `.subsection-card` pattern
- [ ] Section headers using `var(--color-primary)`
- [ ] Interlink panel at bottom
- [ ] Footer with navigation links
- [ ] Special character support if needed (hieroglyphs, Nahuatl, etc.)

---

## Testing Visual Consistency

### Quick Visual Check
1. Open page in browser
2. Verify hero section has gradient background
3. Check that mythology-specific colors appear (not default gray)
4. Verify cards have glass-morphism effect (blur + transparency)
5. Test responsive layout on mobile viewport
6. Verify special characters render correctly

### Browser DevTools Check
1. Inspect hero section
2. Confirm `--mythos-primary` has a color value (not undefined)
3. Check computed styles show backdrop-filter blur
4. Verify grid layouts respond to screen size

---

## Common Fixes

### Colors not appearing?
**Fix:** Add or verify `<link rel="stylesheet" href="../../../themes/mythology-colors.css">`

### Gradients not showing?
**Fix:** Ensure `<main data-mythology="[name]">` attribute is present and correct

### Cards not blurring?
**Fix:** Verify theme-base.css is loaded before styles.css

### Special characters showing as boxes?
**Fix:** Add `<meta charset="utf-8"/>` to head

### Layout broken on mobile?
**Fix:** Check that responsive CSS is loaded (mythology-colors.css includes media queries)

---

## Support Resources

- **Main Audit Report:** `VISUAL_CONSISTENCY_AUDIT_REPORT.md`
- **Theme Base CSS:** `themes/theme-base.css`
- **Mythology Colors:** `themes/mythology-colors.css`
- **Smart Links System:** `themes/smart-links.css` + `themes/smart-links.js`

---

**Quick Reference Version:** 1.0
**Audit Status:** ✅ All mythologies passing
**Last Verified:** 2025-12-18
