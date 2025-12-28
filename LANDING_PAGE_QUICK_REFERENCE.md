# Landing Page View - Quick Reference

## File Location
```
js/views/landing-page-view.js
```

## Key Class Names

### Layout
- `.landing-page-view` - Main container (max-width: 1400px)
- `.landing-hero-section` - Hero with gradient background
- `.landing-categories-section` - Category grid section
- `.landing-features-section` - Features grid section

### Hero Components
- `.hero-icon-display` - Floating eye icon (4.5rem)
- `.landing-hero-title` - Main title with gradient text
- `.landing-hero-subtitle` - Subtitle text
- `.landing-hero-description` - Description paragraph
- `.landing-hero-actions` - Button container
- `.landing-btn` - Base button class
- `.landing-btn-primary` - Gradient button
- `.landing-btn-secondary` - Outline button

### Section Components
- `.landing-section-header` - Section title with icon
- `.landing-section-icon` - Icon in section header
- `.landing-section-subtitle` - Section description

### Category Cards
- `.landing-category-grid` - Grid container
- `.landing-category-card` - Individual category card
- `.landing-category-icon` - Card icon (3-3.5rem)
- `.landing-category-name` - Card title
- `.landing-category-description` - Card description

### Feature Cards
- `.landing-features-grid` - Grid container
- `.landing-feature-card` - Individual feature card
- `.landing-feature-icon` - Feature icon
- `.landing-feature-card h3` - Feature title
- `.landing-feature-card p` - Feature description

## Responsive Breakpoints

```css
Mobile:    max-width: 767px   → 1 column
Tablet:    768px - 1023px     → 2 columns
Desktop:   1024px+            → 3-4 columns
Large:     1400px+            → 4 columns fixed
Touch:     (hover: none)      → 48px min height
```

## Color Variables Used

```css
--color-primary            #8b7fff (Purple)
--color-primary-rgb        139, 127, 255
--color-secondary          #fbbf24 (Gold)
--color-secondary-rgb      255, 126, 182
--color-text-primary       #e5e7eb (Light gray)
--color-text-secondary     #9ca3af (Medium gray)
--color-bg-card-rgb        26, 31, 58
--color-border-primary-rgb 42, 47, 74
```

## Spacing Scale

```css
xs:  0.25rem (4px)    sm:  0.5rem  (8px)
md:  1rem    (16px)   lg:  1.5rem  (24px)
xl:  2rem    (32px)   2xl: 2.5rem  (40px)
3xl: 3rem    (48px)   4xl: 4rem    (64px)
5xl: 5rem    (80px)
```

## Typography Scale

```css
Hero Title:     clamp(2.5rem, 5vw, 3.5rem)
Hero Subtitle:  clamp(1.25rem, 2.5vw, 1.5rem)
Section Header: clamp(1.75rem, 3vw, 2.25rem)
Card Title:     clamp(1.25rem, 2vw, 1.4rem)
Body Text:      clamp(0.875rem, 1.25vw, 0.95rem)
```

## Icon Sizes

```css
Hero Icon:     4.5rem
Category Icon: clamp(3rem, 5vw, 3.5rem)
Feature Icon:  clamp(2.5rem, 4vw, 3rem)
Section Icon:  1.5em (relative to header)
```

## Animation Classes

```css
@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-10px); }
}

.hero-icon-display {
    animation: float 3s ease-in-out infinite;
}
```

## Hover Effects

### Category Cards
```css
Default → Hover:
- translateY(0) → translateY(-8px)
- border opacity 0.5 → 1 (colored)
- shadow 4px → 12px + colored glow
- top bar scaleX(0) → scaleX(1)
- icon scale(1) → scale(1.1)
```

### Buttons
```css
Primary Hover:
- translateY(0) → translateY(-2px)
- shadow increases + glow effect

Secondary Hover:
- background transparent → primary color
- color primary → white
```

## Adding a New Category

```javascript
{
    id: 'new-category',
    name: 'Category Name',
    icon: '🔮',
    description: 'Category description',
    route: '#/browse/new-category',
    color: '#ff0000',  // Unique color for hover effects
    order: 13
}
```

## Customizing Styles

### Change Hero Background
```css
.landing-hero-section {
    background: linear-gradient(135deg,
        rgba(YOUR_COLOR_RGB, 0.2),
        rgba(YOUR_COLOR_RGB, 0.2));
}
```

### Change Card Hover Lift
```css
.landing-category-card:hover {
    transform: translateY(-12px); /* Default: -8px */
}
```

### Change Grid Columns
```css
/* Mobile */
@media (max-width: 767px) {
    .landing-category-grid {
        grid-template-columns: 1fr; /* Single column */
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .landing-category-grid {
        grid-template-columns: repeat(3, 1fr); /* 3 columns */
    }
}
```

## Common Tasks

### Update Hero Text
```javascript
// In getLandingHTML() method:
<h1 class="landing-hero-title">Your Title</h1>
<p class="landing-hero-subtitle">Your subtitle</p>
<p class="landing-hero-description">Your description</p>
```

### Change Button Text/Route
```javascript
<a href="#/your-route" class="landing-btn landing-btn-primary">
    🏛️ Your Button Text
</a>
```

### Add New Feature Card
```javascript
<div class="landing-feature-card">
    <div class="landing-feature-icon">🆕</div>
    <h3>Feature Title</h3>
    <p>Feature description</p>
</div>
```

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
❌ IE11 (Grid not supported)

## Performance Tips

1. **Use CSS Custom Properties**: Fallbacks included
2. **Avoid Will-Change**: Not needed for simple transforms
3. **Use Transform**: Better performance than position/margin
4. **Clamp for Responsive**: Single declaration vs multiple media queries
5. **Scoped Classes**: Prefix with `.landing-` to avoid conflicts

## Accessibility

- ✅ Touch targets: Min 44px (48px on touch devices)
- ✅ Color contrast: WCAG AA compliant
- ✅ Reduced motion: Animations disabled via media query
- ✅ Keyboard navigation: All links/buttons accessible
- ✅ Semantic HTML: Proper heading hierarchy

## Testing Commands

```bash
# Test on different screen sizes in DevTools:
Mobile S:  320px × 568px
Mobile M:  375px × 667px
Mobile L:  425px × 812px
Tablet:    768px × 1024px
Laptop:    1024px × 768px
Desktop:   1440px × 900px
4K:        2560px × 1440px
```

## Quick Fixes

### Cards Not Hovering
Check if CSS custom properties are loaded:
```javascript
console.log(getComputedStyle(document.documentElement).getPropertyValue('--color-primary'));
```

### Grid Not Responsive
Verify media queries are not overridden:
```css
/* Ensure specificity is correct */
.landing-category-grid { /* base styles */ }
@media (max-width: 767px) { /* mobile override */ }
```

### Icons Not Scaling
Check clamp() browser support or use fallback:
```css
font-size: 3rem; /* Fallback */
font-size: clamp(3rem, 5vw, 3.5rem); /* Progressive enhancement */
```

## Related Files

- `themes/theme-base.css` - Color variables and spacing
- `styles.css` - Additional base styles
- `js/entity-renderer-firebase.js` - Entity rendering
- `js/router.js` - SPA routing for category links

## Contact for Issues

Check these first:
1. Browser console for errors
2. CSS custom properties loaded
3. Theme CSS files loaded in correct order
4. No conflicting class names
