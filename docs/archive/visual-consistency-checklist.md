# Visual Consistency Checklist

## Overview
This checklist helps maintain visual consistency across the Eyes of Azrael mythology site. Use this when reviewing designs, implementing new features, or auditing existing pages.

---

## Color System

### Primary Colors
- [ ] Primary color used: `#8b7fff` (Purple)
- [ ] Secondary color used: `#ff7eb6` (Pink)
- [ ] Accent color used: `#ffd93d` (Gold)
- [ ] Colors defined in CSS variables (`:root`)
- [ ] RGB values available for rgba() usage

### Background Colors
- [ ] Primary background: `#0a0e27`
- [ ] Secondary background: `#151a35`
- [ ] Card background: `#1a1f3a`
- [ ] Surface background with alpha for glass effects
- [ ] Consistent gradient backgrounds

### Text Colors
- [ ] Primary text: `#f8f9fa` (white-ish)
- [ ] Secondary text: `#adb5bd` (gray)
- [ ] Muted text: `#6c757d` (dark gray)
- [ ] High contrast ratios (WCAG AA minimum)

### Border Colors
- [ ] Primary border: `rgba(42, 47, 74, 0.8)`
- [ ] Accent border: Primary color with opacity
- [ ] Consistent border colors across components

---

## Typography

### Font Families
- [ ] Body: Inter, system fonts fallback
- [ ] Headings: Crimson Text (serif) or Inter
- [ ] Monospace: 'Courier New', Courier

### Font Sizes (rem-based)
- [ ] xs: 0.75rem (12px)
- [ ] sm: 0.875rem (14px)
- [ ] base: 1rem (16px)
- [ ] lg: 1.125rem (18px)
- [ ] xl: 1.25rem (20px)
- [ ] 2xl: 1.5rem (24px)
- [ ] 3xl: 1.875rem (30px)
- [ ] 4xl: 2.25rem (36px)
- [ ] 5xl: 3rem (48px)

### Font Weights
- [ ] Normal: 400
- [ ] Medium: 500
- [ ] Semibold: 600
- [ ] Bold: 700

### Line Heights
- [ ] Tight: 1.25
- [ ] Normal: 1.5
- [ ] Relaxed: 1.75
- [ ] Loose: 2

### Mobile Typography
- [ ] Base font size: 16px (prevents iOS zoom)
- [ ] Readable line lengths: max 65ch
- [ ] Proper heading hierarchy
- [ ] Consistent spacing between elements

---

## Spacing

### Spacing Scale
- [ ] xs: 0.25rem (4px)
- [ ] sm: 0.5rem (8px)
- [ ] md: 1rem (16px)
- [ ] lg: 1.5rem (24px)
- [ ] xl: 2rem (32px)
- [ ] 2xl: 2.5rem (40px)
- [ ] 3xl: 3rem (48px)
- [ ] 4xl: 4rem (64px)
- [ ] 5xl: 5rem (80px)

### Component Spacing
- [ ] Consistent padding within cards
- [ ] Consistent margins between sections
- [ ] Grid gaps match design system
- [ ] Proper whitespace around text

---

## Borders and Radius

### Border Radius
- [ ] sm: 0.25rem (4px)
- [ ] md: 0.5rem (8px)
- [ ] lg: 0.75rem (12px)
- [ ] xl: 1rem (16px)
- [ ] 2xl: 1.5rem (24px)
- [ ] full: 9999px (pill shape)

### Border Styles
- [ ] Consistent border widths (1-2px)
- [ ] Glass morphism borders use alpha
- [ ] Hover states change border color
- [ ] No harsh borders (use alpha values)

---

## Shadows

### Shadow Levels
- [ ] sm: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- [ ] md: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- [ ] lg: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`
- [ ] xl: `0 20px 25px -5px rgba(0, 0, 0, 0.1)`
- [ ] 2xl: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`
- [ ] glow: `0 0 20px var(--color-primary)`

### Shadow Usage
- [ ] Cards have subtle shadows
- [ ] Hover states increase shadow
- [ ] Focused elements have colored shadows
- [ ] Layered shadows for depth

---

## Buttons

### Button Variants
- [ ] Primary: Gradient background, white text
- [ ] Secondary: Transparent with border
- [ ] Icon buttons: Circular, consistent size
- [ ] Disabled state: Reduced opacity, no-cursor

### Button States
- [ ] Default: Base styling
- [ ] Hover: Transform + enhanced shadow
- [ ] Active: Slight scale down
- [ ] Focus: High-visibility outline
- [ ] Disabled: Grayed out, cursor: not-allowed

### Touch Targets
- [ ] Minimum 44x44px on desktop
- [ ] Minimum 48x48px on mobile
- [ ] Adequate spacing between buttons
- [ ] No overlapping tap areas

---

## Cards

### Card Structure
- [ ] Glass morphism background
- [ ] 2px border with theme color
- [ ] Consistent border-radius (16px)
- [ ] Proper padding (1.5-2rem)

### Card States
- [ ] Default: Subtle shadow
- [ ] Hover: Lift effect (-6px translateY)
- [ ] Hover: Enhanced shadow + glow
- [ ] Focus: High-contrast outline
- [ ] Active: Slight scale

### Card Content
- [ ] Icon at top (if applicable)
- [ ] Title with gradient text
- [ ] Description with secondary text color
- [ ] Badges/tags with pill shape
- [ ] Consistent internal spacing

---

## Navigation

### Header
- [ ] Sticky positioning
- [ ] Glass morphism background
- [ ] Proper z-index (9999)
- [ ] Responsive collapse on mobile

### Navigation Links
- [ ] Underline animation on hover
- [ ] Active state indication
- [ ] Proper keyboard focus
- [ ] Touch-friendly sizing

### Breadcrumbs
- [ ] Separator consistency
- [ ] Hover effects
- [ ] Current page indication
- [ ] Responsive wrapping

---

## Forms

### Input Fields
- [ ] Consistent height (48px min)
- [ ] Font size 16px (prevents zoom)
- [ ] Proper padding
- [ ] Border changes on focus
- [ ] Shadow/glow on focus

### Labels
- [ ] Above input field
- [ ] Required indicator (*)
- [ ] Proper font weight
- [ ] Associated with input (for/id)

### Validation
- [ ] Error state (red border)
- [ ] Error message below field
- [ ] Success state (green border)
- [ ] Inline validation feedback

---

## Animations and Transitions

### Transition Timing
- [ ] Fast: 0.15s (micro-interactions)
- [ ] Base: 0.3s (standard transitions)
- [ ] Slow: 0.5s (page transitions)

### Animation Curves
- [ ] Default: `cubic-bezier(0.4, 0, 0.2, 1)`
- [ ] Entrance: `ease-out`
- [ ] Exit: `ease-in`
- [ ] Spring: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`

### GPU Acceleration
- [ ] Use `transform` instead of `top/left`
- [ ] Use `opacity` for fade effects
- [ ] Add `will-change` sparingly
- [ ] Avoid animating expensive properties

### Loading States
- [ ] Skeleton screens with shimmer
- [ ] Multi-ring spinners
- [ ] Smooth fade-in when loaded
- [ ] Progress indicators where needed

---

## Responsive Design

### Breakpoints
- [ ] Mobile: < 768px
- [ ] Tablet: 768px - 1024px
- [ ] Desktop: > 1024px
- [ ] Large desktop: > 1400px

### Mobile Optimizations
- [ ] Single/two-column grids
- [ ] Larger touch targets (48px min)
- [ ] Hamburger menu (if needed)
- [ ] Reduced animation complexity
- [ ] Optimized images

### Tablet Optimizations
- [ ] Three-column grids
- [ ] Adjusted spacing
- [ ] Touch-optimized interactions
- [ ] Landscape orientation support

### Desktop Optimizations
- [ ] Four+ column grids
- [ ] Hover effects enabled
- [ ] Larger viewports utilized
- [ ] Enhanced visual effects

---

## Accessibility

### WCAG 2.1 AA Compliance
- [ ] Sufficient color contrast (4.5:1 minimum)
- [ ] Text resizable to 200%
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Focus indicators visible

### Focus Indicators
- [ ] 3px outline minimum
- [ ] High-contrast color (gold #ffd93d)
- [ ] Visible offset (2-3px)
- [ ] Consistent across all elements
- [ ] Different from hover state

### Skip Links
- [ ] "Skip to main content" link
- [ ] Appears on focus
- [ ] Positioned at top
- [ ] High-contrast styling

### ARIA Labels
- [ ] Buttons have aria-label
- [ ] Regions have aria-labelledby
- [ ] Live regions for dynamic content
- [ ] Proper heading hierarchy

### Screen Readers
- [ ] Alt text for images
- [ ] Semantic HTML
- [ ] Proper label associations
- [ ] Status announcements

---

## Dark Mode

### Color Adjustments
- [ ] Inverted color scheme
- [ ] Reduced white brightness
- [ ] Sufficient contrast maintained
- [ ] Border visibility

### Component Adjustments
- [ ] Glass effects work in dark mode
- [ ] Shadows visible
- [ ] Text readable
- [ ] Icons visible

---

## Performance

### CSS Performance
- [ ] No expensive selectors
- [ ] Minimal specificity
- [ ] Scoped CSS variables
- [ ] Optimized animations

### Loading Performance
- [ ] Critical CSS inlined
- [ ] Non-critical CSS deferred
- [ ] Minimal reflows
- [ ] Efficient selectors

### Mobile Performance
- [ ] Reduced animation complexity
- [ ] Optimized images
- [ ] Minimal JavaScript
- [ ] Backdrop filters with fallbacks

---

## Icons and Images

### Icon Usage
- [ ] Consistent size (1-3rem)
- [ ] Emoji or SVG format
- [ ] Accessible alt text
- [ ] Proper spacing

### Image Optimization
- [ ] Responsive images (srcset)
- [ ] WebP format with fallbacks
- [ ] Lazy loading
- [ ] Aspect ratio preserved
- [ ] Max-width: 100%

---

## Grid and Layout

### Grid Systems
- [ ] Responsive grid columns
- [ ] Consistent gap spacing
- [ ] Proper alignment
- [ ] Auto-fit/auto-fill usage

### Flexbox
- [ ] Proper direction
- [ ] Appropriate wrapping
- [ ] Gap instead of margins
- [ ] Align items properly

### Container Widths
- [ ] Max-width: 1400px
- [ ] Centered with margin: auto
- [ ] Proper padding
- [ ] Responsive adjustments

---

## Special Components

### Modals
- [ ] Centered positioning
- [ ] Backdrop overlay
- [ ] Smooth animations
- [ ] Keyboard dismissal (ESC)
- [ ] Focus trap

### Tooltips
- [ ] Positioned correctly
- [ ] Arrow indicator
- [ ] Smooth fade
- [ ] Non-blocking
- [ ] Keyboard accessible

### Toasts
- [ ] Top-right or bottom positioning
- [ ] Auto-dismiss option
- [ ] Stacked properly
- [ ] Slide-in animation
- [ ] Dismissible

---

## Testing Checklist

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### Device Testing
- [ ] iPhone (various sizes)
- [ ] Android (various sizes)
- [ ] iPad
- [ ] Desktop (1920x1080+)
- [ ] Small laptop (1366x768)

### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader (NVDA/JAWS)
- [ ] Color contrast checker
- [ ] Zoom to 200%
- [ ] Reduced motion preference

---

## Quality Assurance

### Before Deployment
- [ ] All colors from design system
- [ ] Typography consistent
- [ ] Spacing follows scale
- [ ] Animations smooth (60fps)
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] Cross-browser tested
- [ ] Performance optimized
- [ ] No console errors
- [ ] Visual regression tested

### Code Quality
- [ ] CSS organized
- [ ] No duplicate styles
- [ ] Proper commenting
- [ ] Maintainable structure
- [ ] Version controlled

---

## Documentation

### Component Documentation
- [ ] Usage examples
- [ ] Variants documented
- [ ] Props/classes listed
- [ ] Accessibility notes
- [ ] Browser support

### Style Guide Updates
- [ ] New components added
- [ ] Changes documented
- [ ] Examples updated
- [ ] Screenshots provided

---

## Notes

**Theme Colors Reference:**
- Primary: `#8b7fff` (Purple gradient)
- Secondary: `#ff7eb6` (Pink)
- Accent: `#ffd93d` (Gold)
- Success: `#51cf66` (Green)
- Info: `#4dabf7` (Blue)
- Warning: `#ffd43b` (Yellow)
- Error: `#ff6b6b` (Red)

**Font Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

**Glass Morphism:**
```css
background: rgba(26, 31, 58, 0.8);
backdrop-filter: blur(20px);
border: 1px solid rgba(42, 47, 74, 0.8);
```

---

## Revision History

- v1.0 - Initial checklist creation (2024-12-27)
- Comprehensive visual audit completed
- Mobile optimization standards defined
- Accessibility requirements documented
