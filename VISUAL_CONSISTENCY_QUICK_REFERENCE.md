# Visual Consistency Quick Reference

## One-Page Cheat Sheet for Developers

---

## Hero Sections

```html
<section class="hero-section">
    <div class="hero-icon-display">👁️</div>
    <h1 class="hero-title">Title Here</h1>
    <p class="hero-subtitle">Subtitle text</p>
    <p class="hero-description">Longer description...</p>
    <div class="hero-actions">
        <a href="#" class="btn btn-primary">Primary CTA</a>
        <a href="#" class="btn btn-secondary">Secondary CTA</a>
    </div>
</section>
```

**Key Measurements**:
- Icon: `4rem`
- Padding: `4rem 2rem`
- Border: `2px solid var(--color-primary)`
- Border radius: `1.5rem`
- Backdrop blur: `blur(10px)`

---

## Card Grids

```html
<div class="card-grid">
    <a href="#" class="card">
        <span class="card-icon">⚡</span>
        <h3 class="card-title">Card Title</h3>
        <p class="card-description">Description text...</p>
    </a>
    <!-- More cards... -->
</div>
```

```css
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg, 1.5rem);
}
```

**Key Measurements**:
- Min-width: `280px`
- Gap: `1.5rem`
- Icon: `2rem`
- Padding: `2rem`
- Border: `2px solid`
- Border radius: `1rem`
- Min-height: `180px`

---

## Hover Effects (Standard)

```css
/* Card hover */
.card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(var(--color-primary-rgb), 0.3);
}

/* Icon scale */
.card:hover .card-icon {
    transform: scale(1.1);
}

/* Top border reveal */
.card::before {
    /* ...border setup... */
    transform: scaleX(0);
}
.card:hover::before {
    transform: scaleX(1);
}
```

---

## Typography Scale

| Element | Size |
|---------|------|
| Hero title | `clamp(2.5rem, 5vw, 3.5rem)` |
| Section title | `clamp(1.75rem, 3vw, 2.25rem)` |
| Card title | `clamp(1.25rem, 2vw, 1.4rem)` |
| Hero subtitle | `clamp(1.25rem, 2.5vw, 1.5rem)` |
| Description | `clamp(1rem, 1.5vw, 1.125rem)` |
| Card description | `clamp(0.875rem, 1.25vw, 0.95rem)` |

---

## Spacing Variables

```css
--spacing-xs:  0.25rem  /*  4px */
--spacing-sm:  0.5rem   /*  8px */
--spacing-md:  1rem     /* 16px */
--spacing-lg:  1.5rem   /* 24px */
--spacing-xl:  2rem     /* 32px */
--spacing-2xl: 2.5rem   /* 40px */
--spacing-3xl: 3rem     /* 48px */
--spacing-4xl: 4rem     /* 64px */
--spacing-5xl: 5rem     /* 80px */
```

---

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
    grid-template-columns: 1fr;
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
    grid-template-columns: repeat(2, 1fr);
}

/* Desktop */
@media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

/* Large Desktop */
@media (min-width: 1400px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
```

---

## Common Patterns

### Section Header
```html
<h2 class="section-title">
    <span class="section-icon">🗂️</span>
    Section Title
</h2>
<p class="section-description">Description text...</p>
```

### Stat Badge
```html
<span class="stat-badge">
    <span class="stat-icon">📊</span>
    <span class="stat-value">42</span>
    <span class="stat-label">items</span>
</span>
```

### Filter Controls
```html
<div class="filter-group">
    <label for="filter" class="filter-label">
        <span class="filter-icon">🔍</span>
        Filter Label
    </label>
    <select id="filter" class="filter-select">
        <option>Option 1</option>
    </select>
</div>
```

---

## Accessibility Must-Haves

```css
/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
    .card { transition: none; }
    .card:hover { transform: none; }
}

/* High contrast */
@media (prefers-contrast: high) {
    .card { border-width: 3px; }
}

/* Touch targets */
@media (hover: none) and (pointer: coarse) {
    .btn { min-height: 48px; }
}

/* Focus states */
.card:focus {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
}
```

---

## Standard Card Template

```html
<a href="#/link" class="card" style="--card-color: #8b7fff">
    <span class="card-icon">🎯</span>
    <h3 class="card-title">Card Title</h3>
    <p class="card-description">
        Brief description that automatically truncates after 3 lines
        using -webkit-line-clamp for clean presentation.
    </p>
    <div class="card-tags">
        <span class="tag">Tag 1</span>
        <span class="tag">Tag 2</span>
    </div>
</a>
```

```css
.card {
    background: rgba(var(--color-bg-card-rgb), 0.6);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(var(--color-border-primary-rgb), 0.5);
    border-radius: var(--radius-xl, 1rem);
    padding: var(--spacing-xl, 2rem);
    min-height: 180px;
    transition: all var(--transition-base, 0.3s ease);
}
```

---

## Color Variables

```css
/* Primary Colors */
--color-primary: #8b7fff          /* Purple */
--color-secondary: #fbbf24        /* Gold */
--color-accent: #00d4ff           /* Cyan */

/* Text Colors */
--color-text-primary: #e5e7eb     /* Light gray */
--color-text-secondary: #9ca3af   /* Medium gray */

/* Backgrounds */
--color-bg-card-rgb: 26, 31, 58   /* Dark blue */
--color-surface-rgb: 26, 31, 58   /* Surface */

/* Borders */
--color-border-primary-rgb: 42, 47, 74
--color-primary-rgb: 139, 127, 255
```

---

## Button Styles

```html
<!-- Primary button -->
<a href="#" class="btn btn-primary">
    🔍 Primary Action
</a>

<!-- Secondary button -->
<a href="#" class="btn btn-secondary">
    ⚖️ Secondary Action
</a>
```

```css
.btn {
    padding: var(--spacing-md, 1rem) var(--spacing-xl, 2rem);
    border-radius: var(--radius-lg, 0.75rem);
    font-weight: var(--font-semibold, 600);
    min-height: 44px;
    transition: all var(--transition-base, 0.3s ease);
}

.btn-primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: white;
}

.btn-secondary {
    background: transparent;
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
}
```

---

## Quick Measurements

| Item | Size |
|------|------|
| Hero icon | `4rem` (64px) |
| Card icon | `2rem` (32px) |
| Section icon | `1.5em` |
| Card min-width | `280px` |
| Card padding | `2rem` |
| Grid gap | `1.5rem` |
| Border width | `2px` |
| Hero border radius | `1.5rem` |
| Card border radius | `1rem` |
| Hover lift | `-8px` |
| Icon scale | `1.1` |
| Transition | `0.3s ease` |
| Backdrop blur | `10px` |
| Container max-width | `1400px` |
| Touch target min | `44px` (48px touch) |

---

## Implementation Checklist

When creating/updating a view:

- [ ] Hero icon is 4rem
- [ ] Card icons are 2rem
- [ ] Grid uses `minmax(280px, 1fr)`
- [ ] Cards have 2rem padding
- [ ] Hover lifts -8px
- [ ] Icons scale to 1.1 on hover
- [ ] Top border reveals on hover
- [ ] Shadow: `0 12px 40px`
- [ ] Backdrop blur on cards
- [ ] Responsive at 768px, 1024px, 1400px
- [ ] Mobile = 1 column
- [ ] Tablet = 2 columns
- [ ] Desktop = auto-fill
- [ ] Reduced motion support
- [ ] High contrast support
- [ ] 44px+ touch targets
- [ ] Focus states visible

---

## Copy-Paste Snippets

### Standard Card CSS
```css
.your-card {
    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.6);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.5);
    border-radius: var(--radius-xl, 1rem);
    padding: var(--spacing-xl, 2rem);
    min-height: 180px;
    display: flex;
    flex-direction: column;
    transition: all var(--transition-base, 0.3s ease);
}

.your-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
}
```

### Standard Grid CSS
```css
.your-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg, 1.5rem);
    margin-bottom: var(--spacing-3xl, 3rem);
}
```

### Responsive Grid
```css
@media (max-width: 767px) {
    .your-grid { grid-template-columns: 1fr; }
}

@media (min-width: 768px) and (max-width: 1023px) {
    .your-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
    .your-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
}
```

---

## Reference Files

- **Full Guide**: `VISUAL_CONSISTENCY_GUIDE.md`
- **Implementation**: `VISUAL_CONSISTENCY_IMPLEMENTATION_SUMMARY.md`
- **Example View**: `js/views/landing-page-view.js`
- **Page Renderer CSS**: `css/page-asset-renderer.css`

---

**Version**: 1.0.0
**Last Updated**: 2025-12-28
