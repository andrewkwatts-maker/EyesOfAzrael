# Visual Consistency Guide

## Purpose
This guide ensures visual consistency across all index and landing pages in the Eyes of Azrael mythology database.

---

## Core Design Principles

### 1. Visual Hierarchy
- **Hero sections**: Large, prominent, eye-catching entry points
- **Section headers**: Clear, consistent styling with icons
- **Cards**: Uniform sizing, spacing, and hover effects
- **Typography**: Consistent font sizes and weights across all pages

### 2. Spacing System
All pages use the same spacing scale:
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 2.5rem;   /* 40px */
--spacing-3xl: 3rem;     /* 48px */
--spacing-4xl: 4rem;     /* 64px */
--spacing-5xl: 5rem;     /* 80px */
```

### 3. Responsive Breakpoints
Consistent across all views:
```css
/* Mobile */
@media (max-width: 767px)

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px)

/* Desktop */
@media (min-width: 1024px)

/* Large Desktop */
@media (min-width: 1400px)
```

---

## Component Templates

### Hero Section Template

**Standard Dimensions:**
- Padding: `var(--spacing-4xl, 4rem) var(--spacing-xl, 2rem)`
- Icon size: `4rem` (hero icons)
- Title size: `clamp(2.5rem, 5vw, 3.5rem)`
- Subtitle size: `clamp(1.25rem, 2.5vw, 1.5rem)`
- Description size: `clamp(1rem, 1.5vw, 1.125rem)`

**Standard Styling:**
```css
.hero-section {
    background: linear-gradient(135deg,
        rgba(var(--color-primary-rgb, 139, 127, 255), 0.2),
        rgba(var(--color-secondary-rgb, 255, 126, 182), 0.2));
    border: 2px solid var(--color-primary, #8b7fff);
    border-radius: var(--radius-2xl, 1.5rem);
    padding: var(--spacing-4xl, 4rem) var(--spacing-xl, 2rem);
    text-align: center;
    margin-bottom: var(--spacing-4xl, 4rem);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.hero-icon-display {
    font-size: 4rem;
    margin-bottom: var(--spacing-md, 1rem);
    filter: drop-shadow(0 4px 8px rgba(var(--color-primary-rgb), 0.5));
}

.hero-title {
    font-family: var(--font-heading, Georgia, serif);
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 700;
    margin-bottom: var(--spacing-md, 1rem);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-subtitle {
    font-size: clamp(1.25rem, 2.5vw, 1.5rem);
    color: var(--color-text-primary, #e5e7eb);
    margin-bottom: var(--spacing-lg, 1.5rem);
    font-weight: 500;
}

.hero-description {
    font-size: clamp(1rem, 1.5vw, 1.125rem);
    color: var(--color-text-secondary, #9ca3af);
    max-width: 800px;
    margin: 0 auto var(--spacing-xl, 2rem);
    line-height: var(--leading-relaxed, 1.75);
}
```

**Mobile Adaptation:**
```css
@media (max-width: 767px) {
    .hero-section {
        padding: var(--spacing-2xl, 2.5rem) var(--spacing-md, 1rem);
        margin-bottom: var(--spacing-xl, 2rem);
    }

    .hero-icon-display {
        font-size: 3rem;
    }
}
```

---

### Card Grid Template

**Standard Grid:**
```css
.card-grid,
.entity-grid,
.category-grid,
.mythology-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg, 1.5rem);
    margin-bottom: var(--spacing-3xl, 3rem);
}
```

**Responsive Grids:**
```css
/* Mobile */
@media (max-width: 767px) {
    .card-grid,
    .entity-grid,
    .category-grid,
    .mythology-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-md, 1rem);
    }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
    .card-grid,
    .entity-grid,
    .category-grid,
    .mythology-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Large Desktop */
@media (min-width: 1400px) {
    .card-grid,
    .entity-grid,
    .category-grid,
    .mythology-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
}
```

---

### Card Component Template

**Standard Card Dimensions:**
- Min-width: `280px`
- Padding: `var(--spacing-xl, 2rem)`
- Min-height: `180px`
- Icon size: `2rem` (card icons)
- Border radius: `var(--radius-xl, 1rem)`
- Border width: `2px`

**Standard Card Styling:**
```css
.card,
.entity-card,
.category-card,
.mythology-card {
    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.5);
    border-radius: var(--radius-xl, 1rem);
    padding: var(--spacing-xl, 2rem);
    text-decoration: none;
    color: inherit;
    transition: all var(--transition-base, 0.3s ease);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-height: 180px;
    display: flex;
    flex-direction: column;
}

/* Top border accent (hidden by default) */
.card::before,
.entity-card::before,
.category-card::before,
.mythology-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--card-color, linear-gradient(90deg, var(--color-primary), var(--color-secondary)));
    transform: scaleX(0);
    transition: transform var(--transition-base, 0.3s ease);
}

/* Hover state */
.card:hover,
.entity-card:hover,
.category-card:hover,
.mythology-card:hover {
    transform: translateY(-8px);
    border-color: var(--card-color, var(--color-primary));
    box-shadow: 0 12px 40px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.8);
}

.card:hover::before,
.entity-card:hover::before,
.category-card:hover::before,
.mythology-card:hover::before {
    transform: scaleX(1);
}

/* Card icon */
.card-icon,
.entity-icon,
.category-icon,
.mythology-icon {
    font-size: 2rem;
    margin-bottom: var(--spacing-md, 1rem);
    display: block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    transition: transform var(--transition-base, 0.3s ease);
    line-height: 1;
}

.card:hover .card-icon,
.entity-card:hover .entity-icon,
.category-card:hover .category-icon,
.mythology-card:hover .mythology-icon {
    transform: scale(1.1);
}

/* Card title */
.card-title,
.entity-card-title,
.category-name,
.mythology-name {
    font-size: clamp(1.25rem, 2vw, 1.4rem);
    font-weight: var(--font-semibold, 600);
    margin-bottom: var(--spacing-sm, 0.5rem);
    color: var(--color-text-primary, #e5e7eb);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    line-height: var(--leading-tight, 1.25);
}

/* Card description */
.card-description,
.entity-description,
.category-description,
.mythology-description {
    font-size: clamp(0.875rem, 1.25vw, 0.95rem);
    color: var(--color-text-secondary, #9ca3af);
    line-height: var(--leading-normal, 1.6);
    flex-grow: 1;
}
```

**Mobile Card Adjustments:**
```css
@media (max-width: 767px) {
    .card,
    .entity-card,
    .category-card,
    .mythology-card {
        padding: var(--spacing-md, 1rem);
        min-height: 200px;
    }

    .card-icon,
    .entity-icon,
    .category-icon,
    .mythology-icon {
        font-size: 2rem;
    }
}
```

---

### Section Header Template

**Standard Dimensions:**
```css
.section-header {
    margin-bottom: var(--spacing-xl, 2rem);
}

.section-title {
    font-size: clamp(1.75rem, 3vw, 2.25rem);
    text-align: center;
    margin-bottom: var(--spacing-md, 1rem);
    color: var(--color-primary, #8b7fff);
    font-weight: var(--font-semibold, 600);
    text-shadow: 0 0 8px rgba(var(--color-primary-rgb, 139, 127, 255), 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md, 1rem);
    flex-wrap: wrap;
}

.section-icon {
    font-size: 1.5em;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.section-subtitle,
.section-description {
    text-align: center;
    color: var(--color-text-secondary, #9ca3af);
    margin-bottom: var(--spacing-xl, 2rem);
    font-size: clamp(1rem, 1.5vw, 1.125rem);
    line-height: var(--leading-relaxed, 1.75);
}
```

---

### Stats Badge Template

```css
.stat-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm, 0.5rem);
    padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1.5rem);
    background: linear-gradient(135deg,
        rgba(var(--color-primary-rgb), 0.2),
        rgba(var(--color-secondary-rgb), 0.2));
    border: 1px solid rgba(var(--color-primary-rgb), 0.4);
    border-radius: var(--radius-full, 9999px);
    font-weight: var(--font-semibold, 600);
}

.stat-icon {
    font-size: 1.25rem;
    line-height: 1;
}

.stat-value {
    color: var(--color-primary);
    font-size: 1.1rem;
}

.stat-label {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
}
```

---

### Filter Controls Template

```css
.filter-controls {
    display: flex;
    gap: var(--spacing-lg, 1.5rem);
    margin-bottom: var(--spacing-xl, 2rem);
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs, 0.25rem);
    min-width: 200px;
    flex: 1;
}

.filter-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 0.25rem);
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: var(--font-medium, 500);
    color: var(--color-text-secondary);
}

.filter-select,
.filter-input {
    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.8);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
    border-radius: var(--radius-lg, 0.75rem);
    color: var(--color-text-primary);
    font-size: var(--font-size-base, 1rem);
    cursor: pointer;
    transition: all var(--transition-base, 0.3s ease);
    font-family: var(--font-primary);
}

.filter-select:hover,
.filter-input:hover {
    border-color: rgba(var(--color-primary-rgb), 0.5);
}

.filter-select:focus,
.filter-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
}
```

---

## Page-Specific Implementation

### LandingPageView (/)
- **Hero**: 4rem icon, gradient background, 2 CTA buttons
- **Category Grid**: 12 category cards in auto-fill grid (280px min)
- **Features Grid**: 4 feature cards in auto-fit grid (240px min)
- **Max width**: 1400px

### MythologiesView (#/mythologies)
- **Header**: 4rem icon, title, description, stats
- **Grid**: Mythology cards (280px min)
- **Counts**: Display deity/hero/creature counts per mythology
- **Max width**: 1400px

### BrowseCategoryView (#/browse/*)
- **Header**: 4rem icon, title, description, stats badges
- **Filters**: Mythology filter, sort order, search input
- **Grid**: Entity cards with tags (280px min)
- **View toggle**: Grid/List view options
- **Max width**: 1400px

### HomeView (#/home)
- **Hero**: Similar to LandingPageView
- **Mythology Grid**: Same as MythologiesView
- **Features**: 4 feature cards
- **Max width**: 1200px (slightly narrower)

### PageAssetRenderer (Custom Pages)
- **Hero**: Inline styles matching template
- **Sections**: Dynamic card grids (280px min)
- **Cards**: Panel cards with consistent styling
- **Max width**: Inherits from container

---

## Typography Scale

### Headings
```css
h1, .hero-title:        clamp(2.5rem, 5vw, 3.5rem)
h2, .section-title:     clamp(1.75rem, 3vw, 2.25rem)
h3, .card-title:        clamp(1.25rem, 2vw, 1.4rem)
```

### Body Text
```css
.hero-subtitle:         clamp(1.25rem, 2.5vw, 1.5rem)
.hero-description:      clamp(1rem, 1.5vw, 1.125rem)
.section-description:   clamp(1rem, 1.5vw, 1.125rem)
.card-description:      clamp(0.875rem, 1.25vw, 0.95rem)
.stat-label:            0.9rem
.filter-label:          0.875rem
```

### Font Weights
```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

---

## Color Usage

### Primary Colors
```css
--color-primary: #8b7fff        /* Purple - main accent */
--color-secondary: #fbbf24      /* Gold - secondary accent */
--color-accent: #00d4ff         /* Cyan - highlights */
```

### Text Colors
```css
--color-text-primary: #e5e7eb   /* Light gray - main text */
--color-text-secondary: #9ca3af /* Medium gray - descriptions */
```

### Background Colors
```css
--color-bg-card-rgb: 26, 31, 58     /* Dark blue cards */
--color-surface-rgb: 26, 31, 58     /* Surface elements */
```

### Border Colors
```css
--color-border-primary-rgb: 42, 47, 74  /* Default borders */
--color-primary-rgb: 139, 127, 255      /* Accent borders */
```

---

## Hover & Interaction States

### Standard Hover Effect
All cards use consistent hover:
```css
/* Transform */
transform: translateY(-8px);

/* Border */
border-color: var(--card-color, var(--color-primary));

/* Shadow */
box-shadow: 0 12px 40px rgba(var(--color-primary-rgb), 0.3);

/* Background */
background: rgba(var(--color-bg-card-rgb), 0.8);
```

### Top Border Reveal
```css
.card::before {
    transform: scaleX(1);
}
```

### Icon Scale
```css
.card-icon {
    transform: scale(1.1);
}
```

---

## Accessibility

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    .card,
    .entity-card,
    .category-card,
    .mythology-card,
    .btn,
    .filter-select,
    .filter-input {
        transition: none;
        animation: none;
    }

    .card:hover,
    .entity-card:hover,
    .category-card:hover,
    .mythology-card:hover {
        transform: none;
    }
}
```

### High Contrast
```css
@media (prefers-contrast: high) {
    .card,
    .entity-card,
    .hero-section,
    .filter-select,
    .filter-input {
        border-width: 3px;
    }
}
```

### Touch Targets
Minimum 44px x 44px for buttons and interactive elements:
```css
.btn {
    min-height: 44px;
    min-width: 44px;
}

/* Touch devices - increase to 48px */
@media (hover: none) and (pointer: coarse) {
    .btn {
        min-height: 48px;
        padding: var(--spacing-md, 1rem) var(--spacing-lg, 1.5rem);
    }
}
```

---

## Container Widths

All views use consistent max-widths:
```css
/* Most views */
.view-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 var(--spacing-xl, 2rem) var(--spacing-4xl, 4rem);
}

/* Home view (slightly narrower) */
.home-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

/* Mobile */
@media (max-width: 767px) {
    .view-container {
        padding: 0 var(--spacing-sm, 0.5rem) var(--spacing-xl, 2rem);
    }
}
```

---

## Button Templates

### Primary Button
```css
.btn-primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: white;
    padding: var(--spacing-md, 1rem) var(--spacing-xl, 2rem);
    border-radius: var(--radius-lg, 0.75rem);
    border: none;
    cursor: pointer;
    transition: all var(--transition-base, 0.3s ease);
    font-size: var(--font-size-base, 1rem);
    font-weight: var(--font-semibold, 600);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm, 0.5rem);
    min-height: 44px;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.btn-primary:hover {
    box-shadow: 0 8px 24px rgba(var(--color-primary-rgb), 0.4);
    transform: translateY(-2px);
}
```

### Secondary Button
```css
.btn-secondary {
    background: transparent;
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
    padding: var(--spacing-md, 1rem) var(--spacing-xl, 2rem);
    border-radius: var(--radius-lg, 0.75rem);
    cursor: pointer;
    transition: all var(--transition-base, 0.3s ease);
    font-size: var(--font-size-base, 1rem);
    font-weight: var(--font-semibold, 600);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm, 0.5rem);
    min-height: 44px;
}

.btn-secondary:hover {
    background: var(--color-primary);
    color: white;
    box-shadow: 0 8px 24px rgba(var(--color-primary-rgb), 0.3);
    transform: translateY(-2px);
}
```

---

## Loading States

### Skeleton Cards
```css
.skeleton-card {
    pointer-events: none;
    background: linear-gradient(90deg,
        rgba(var(--color-bg-card-rgb), 0.5) 0%,
        rgba(var(--color-bg-card-rgb), 0.8) 50%,
        rgba(var(--color-bg-card-rgb), 0.5) 100%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

### Loading Spinner
```css
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 2rem;
}

.spinner-container {
    /* Standard spinner styling */
}
```

---

## Implementation Checklist

When creating or updating a view, ensure:

- [ ] Hero section uses 4rem icons
- [ ] Hero title uses clamp(2.5rem, 5vw, 3.5rem)
- [ ] Card grid uses `minmax(280px, 1fr)`
- [ ] Card icons are 2rem
- [ ] Card padding is `var(--spacing-xl, 2rem)`
- [ ] Hover effect: `translateY(-8px)`
- [ ] Hover shadow: `0 12px 40px rgba(var(--color-primary-rgb), 0.3)`
- [ ] Top border accent on hover
- [ ] Icon scales to 1.1 on hover
- [ ] Backdrop filter: `blur(10px)` on translucent elements
- [ ] Responsive breakpoints: 768px, 1024px, 1400px
- [ ] Mobile: single column grid
- [ ] Tablet: 2 column grid
- [ ] Desktop: auto-fill grid
- [ ] Accessibility: reduced motion support
- [ ] Accessibility: high contrast support
- [ ] Touch targets: 44px minimum (48px on touch devices)
- [ ] Max width: 1400px (or 1200px for home)
- [ ] Section spacing: 3rem - 5rem
- [ ] Card spacing: 1.5rem gap

---

## Quick Reference

### Most Common Values

| Property | Value |
|----------|-------|
| Hero icon size | 4rem |
| Card icon size | 2rem |
| Section icon size | 1.5em |
| Card min-width | 280px |
| Card padding | 2rem |
| Card border-radius | 1rem |
| Card border-width | 2px |
| Grid gap | 1.5rem |
| Hover transform | translateY(-8px) |
| Hover shadow | 0 12px 40px rgba(139, 127, 255, 0.3) |
| Icon hover scale | scale(1.1) |
| Backdrop blur | blur(10px) |
| Max container width | 1400px |
| Mobile breakpoint | 767px |
| Tablet breakpoint | 768px - 1023px |
| Desktop breakpoint | 1024px+ |
| Touch target min | 44px (48px touch) |

---

## Examples

See implementation in:
- `H:\Github\EyesOfAzrael\js\views\landing-page-view.js`
- `H:\Github\EyesOfAzrael\js\views\mythologies-view.js`
- `H:\Github\EyesOfAzrael\js\views\browse-category-view.js`
- `H:\Github\EyesOfAzrael\js\views\home-view.js`
- `H:\Github\EyesOfAzrael\js\page-asset-renderer.js`

---

## Testing Visual Consistency

### Manual Testing
1. Open each view in browser
2. Verify hero section height and padding match
3. Verify card sizes are uniform (280px min-width)
4. Verify icon sizes (4rem hero, 2rem cards)
5. Test hover effects (all cards lift 8px)
6. Test responsive breakpoints (768px, 1024px, 1400px)
7. Test mobile view (single column)
8. Test tablet view (2 columns)
9. Test desktop view (auto-fill grid)

### Automated Testing
Use browser DevTools:
```javascript
// Check card grid consistency
document.querySelectorAll('.card, .entity-card, .category-card, .mythology-card')
    .forEach(card => {
        const styles = getComputedStyle(card);
        console.log({
            minWidth: styles.minWidth,
            padding: styles.padding,
            borderRadius: styles.borderRadius,
            borderWidth: styles.borderWidth
        });
    });

// Check icon sizes
document.querySelectorAll('.hero-icon-display, .card-icon, .entity-icon, .section-icon')
    .forEach(icon => {
        console.log(icon.className, getComputedStyle(icon).fontSize);
    });
```

---

## Maintenance

### When Adding New Views
1. Copy styling from an existing view (preferably LandingPageView)
2. Adjust only content, not structure or sizing
3. Run the testing checklist above
4. Verify responsive behavior at all breakpoints

### When Updating Existing Views
1. Check this guide for current standards
2. Update all instances of the component type
3. Verify no regressions in other views
4. Update this guide if introducing new patterns

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
