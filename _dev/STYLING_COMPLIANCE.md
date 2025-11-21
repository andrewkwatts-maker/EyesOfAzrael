# World Mythos Explorer - Styling Compliance Guide

This document defines the standard HTML structure and styling patterns that ALL pages must follow.

## Three Core Requirements

1. **Theme System** - All pages must load theme-base.css and theme-picker.js for consistent theming
2. **Modern UI Styling** - Use glass-card, hero-section, and CSS variables (NO hardcoded colors)
3. **Breadcrumb Navigation** - Always placed OUTSIDE and AFTER the header element

---

## Required Head Elements

```html
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Page Title - World Mythos Explorer</title>

    <!-- REQUIRED: Theme System -->
    <link href="{relative-path}themes/theme-base.css" rel="stylesheet"/>
    <link href="{relative-path}styles.css" rel="stylesheet"/>
    <script defer src="{relative-path}themes/theme-picker.js"></script>
    <script defer src="{relative-path}themes/theme-animations.js"></script>
</head>
```

**Note:** `{relative-path}` depends on file depth:
- Root level: `` (empty)
- 1 level deep: `../`
- 2 levels deep: `../../`
- 3 levels deep: `../../../`

## Standard Page Structure

```html
<body>
<!-- Theme picker container (auto-populated by JS) -->
<div id="theme-picker"></div>

<!-- HEADER: Contains title and theme selector -->
<header>
    <div class="header-content">
        <h1>Page Title</h1>
        <div id="theme-picker-container"></div>
    </div>
</header>

<!-- BREADCRUMB: Always OUTSIDE and AFTER header -->
<nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="{parent-path}/index.html">Home</a> →
    <span>Current Page</span>
</nav>

<!-- MAIN CONTENT -->
<main style="max-width: var(--container-xl); margin: 0 auto; padding: var(--space-6);">
    <!-- Hero Section (required for index pages) -->
    <div class="hero-section">
        <h2>Subtitle or Tagline</h2>
        <p class="hero-description">Brief description of the page content.</p>
    </div>

    <!-- Content Sections using glass-card -->
    <section class="glass-card">
        <h2 style="color: var(--color-primary);">Section Title</h2>
        <p style="line-height: 1.7;">Section content...</p>

        <!-- Subsections -->
        <div class="subsection-card">
            <h3>Subsection Title</h3>
            <p style="line-height: 1.7;">Subsection content...</p>
        </div>
    </section>
</main>

<!-- FOOTER -->
<footer>
    <p>
        <strong>World Mythos Explorer</strong> - Tradition Name<br/>
        Based on primary source descriptions<br/>
        <a href="https://sourcelink.com" target="_blank">Read Primary Sources</a>
    </p>
</footer>
</body>
```

## CSS Variable Usage (REQUIRED)

**NEVER use hardcoded colors.** Always use CSS variables from theme-base.css:

### Colors
```css
/* Primary/Accent Colors */
var(--color-primary)
var(--color-secondary)
var(--color-accent)

/* Backgrounds */
var(--color-background)
var(--color-surface)
var(--color-surface-hover)

/* Text */
var(--color-text-primary)
var(--color-text-secondary)

/* With transparency (use -rgb variants) */
rgba(var(--color-primary-rgb), 0.5)
rgba(var(--color-surface-rgb), 0.6)
```

### Spacing
```css
var(--spacing-sm)   /* Small spacing */
var(--spacing-md)   /* Medium spacing */
var(--spacing-lg)   /* Large spacing */
var(--spacing-xl)   /* Extra large spacing */
```

### Border Radius
```css
var(--radius-sm)
var(--radius-md)
var(--radius-lg)
var(--radius-xl)
var(--radius-full)  /* Fully rounded/pill */
```

### Shadows
```css
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
var(--shadow-xl)
```

### Transitions
```css
var(--transition-base)  /* Standard transition */
```

## Required CSS Classes

### Hero Section (for index pages)
```css
.hero-section {
    background: linear-gradient(135deg,
        rgba(var(--color-primary-rgb), 0.8),
        rgba(var(--color-secondary-rgb), 0.8));
    backdrop-filter: blur(10px);
    border: 2px solid var(--color-primary);
    color: var(--color-text-primary);
    padding: 3rem 2rem;
    text-align: center;
    border-radius: var(--radius-xl);
    margin-bottom: 2rem;
    box-shadow: var(--shadow-xl);
}
```

### Glass Card (main content container)
```css
.glass-card {
    background: rgba(var(--color-surface-rgb), 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    margin: 2rem var(--spacing-lg);
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-base, 0.3s ease);
}

.glass-card:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-5px);
}
```

### Subsection Card
```css
.subsection-card {
    background: rgba(var(--color-primary-rgb), 0.05);
    border-left: 4px solid var(--color-primary);
    padding: var(--spacing-lg);
    margin: var(--spacing-lg) 0;
    border-radius: var(--radius-md);
    transition: all var(--transition-base, 0.3s ease);
}

.subsection-card:hover {
    background: rgba(var(--color-primary-rgb), 0.1);
    transform: translateX(5px);
    box-shadow: var(--shadow-md);
}
```

### Navigation Links (pill buttons)
```css
.sub-link {
    background: var(--color-primary);
    color: var(--color-text-primary);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-full);
    text-decoration: none;
    font-size: var(--font-size-sm);
    transition: all var(--transition-base, 0.3s ease);
}

.sub-link:hover {
    background: var(--color-secondary);
    transform: scale(1.05);
}
```

### Clickable Cards (grid items)
```css
.deity-card {
    background: rgba(var(--color-primary-rgb), 0.05);
    border: 2px solid rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    transition: all var(--transition-base, 0.3s ease);
    cursor: pointer;
}

.deity-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary);
}
```

### Header Content
```css
.header-content {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: var(--spacing-lg);
}

#theme-picker-container {
    position: absolute;
    top: 50%;
    right: var(--spacing-lg);
    transform: translateY(-50%);
}
```

### Breadcrumb Navigation (Hovering)
```css
.breadcrumb {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background: rgba(var(--color-surface-rgb), 0.9);
    backdrop-filter: blur(10px);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
}

.breadcrumb a {
    color: var(--color-link);
    text-decoration: none;
    transition: color var(--transition-fast);
}

.breadcrumb a:hover {
    color: var(--color-link-hover);
    text-decoration: underline;
}
```

## Common Issues to Fix

### 1. Hardcoded Colors
**BAD:**
```css
background: #1a237e;
color: #e1bee7;
border: 1px solid #673ab7;
```

**GOOD:**
```css
background: var(--color-background);
color: var(--color-text-primary);
border: 1px solid var(--color-primary);
```

### 2. Breadcrumb Inside Header
**BAD:**
```html
<header>
    <h1>Title</h1>
    <nav class="breadcrumb">...</nav>
</header>
```

**GOOD:**
```html
<header>
    <div class="header-content">
        <h1>Title</h1>
    </div>
</header>
<nav class="breadcrumb" aria-label="Breadcrumb">...</nav>
```

### 3. Missing Theme Scripts
**BAD:**
```html
<head>
    <link href="styles.css" rel="stylesheet"/>
</head>
```

**GOOD:**
```html
<head>
    <link href="../../themes/theme-base.css" rel="stylesheet"/>
    <script defer src="../../themes/theme-picker.js"></script>
    <script defer src="../../themes/theme-animations.js"></script>
</head>
```

### 4. Missing Glass Card Styling
**BAD:**
```html
<div class="container">
    <h2>Section</h2>
</div>
```

**GOOD:**
```html
<section class="glass-card">
    <h2 style="color: var(--color-primary);">Section</h2>
</section>
```

### 5. Inline Styles with Hardcoded Values
**BAD:**
```html
<div style="background: linear-gradient(135deg, #1a237e, #311b92);">
```

**GOOD:**
```html
<div style="background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.8), rgba(var(--color-secondary-rgb), 0.8));">
```

## Theme Selection

The theme picker is automatically injected by `theme-picker.js`. Ensure:

1. The `<div id="theme-picker-container"></div>` element exists in the body
2. The `theme-picker.js` script is loaded with `defer`
3. All styling uses CSS variables so themes apply correctly

The theme picker appears as a floating button (bottom-right) that opens a theme selection grid.

**Available Themes:** day, night, fire, water, earth, air, chaos, order, celestial, abyssal

---

## Modern UI Styling Patterns

### DO use these patterns:

```html
<!-- Glass morphism cards -->
<section class="glass-card">
    <h2 style="color: var(--color-primary);">Section Title</h2>
    <p>Content with backdrop blur and subtle borders</p>
</section>

<!-- Subsection cards with hover effects -->
<div class="subsection-card">
    <h3>Clickable subsection</h3>
    <p>Transforms on hover</p>
</div>

<!-- Pill-style navigation links -->
<div class="sub-links">
    <a class="sub-link" href="page.html">Link Text</a>
</div>

<!-- Card grids -->
<div class="deity-grid">
    <div class="deity-card" onclick="window.location.href='page.html'">
        <div class="deity-icon">Icon</div>
        <h3>Card Title</h3>
        <p>Description</p>
    </div>
</div>
```

### DON'T use these patterns:

```html
<!-- Old-style plain containers -->
<div class="container">...</div>

<!-- Hardcoded gradient backgrounds -->
<div style="background: linear-gradient(135deg, #1a237e, #311b92);">

<!-- Plain unstyled sections -->
<section>
    <h2>Title</h2>
</section>
```

---

## Breadcrumb Standard

**Position:** ALWAYS outside and immediately after the `</header>` closing tag.

```html
<header>
    <div class="header-content">
        <h1>Page Title</h1>
    </div>
</header>
<nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="../../index.html">Home</a> →
    <a href="../index.html">Section</a> →
    <span>Current Page</span>
</nav>
```

**Rules:**
- Use `→` (arrow) as separator
- Final item is a `<span>` (not a link)
- Include `aria-label="Breadcrumb"` for accessibility
- Links should use correct relative paths based on file depth

---

## Reference Implementation

See `mythos/buddhist/index.html` for a fully compliant example page.

---

## Compliance Checklist

### Theme System
- [ ] `theme-base.css` linked in `<head>`
- [ ] `theme-picker.js` loaded with `defer`
- [ ] `theme-animations.js` loaded with `defer`
- [ ] `<div id="theme-picker-container"></div>` in body

### Header Structure
- [ ] `<header>` element present
- [ ] Header contains `<div class="header-content">` wrapper
- [ ] Header contains `<h1>` with page title

### Breadcrumb Navigation
- [ ] Breadcrumb is OUTSIDE header (immediately after `</header>`)
- [ ] Uses `<nav class="breadcrumb" aria-label="Breadcrumb">`
- [ ] Correct relative path links
- [ ] Arrow separators between items

### Modern UI Styling
- [ ] Index pages have `.hero-section`
- [ ] Content wrapped in `.glass-card` sections
- [ ] Subsections use `.subsection-card`
- [ ] Navigation links use `.sub-link` class
- [ ] Card grids use `.deity-grid` and `.deity-card`

### CSS Variables (NO hardcoded colors!)
- [ ] All colors use `var(--color-*)` variables
- [ ] All spacing uses `var(--spacing-*)` variables
- [ ] All shadows use `var(--shadow-*)` variables
- [ ] All border-radius uses `var(--radius-*)` variables
- [ ] Transparent colors use `rgba(var(--color-*-rgb), opacity)`

### Footer
- [ ] `<footer>` element present with site branding
