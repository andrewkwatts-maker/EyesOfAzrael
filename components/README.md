# EOAPlot Component Library

## Overview

This directory contains reusable HTML component templates for the EOAPlot mythology documentation project. All components follow the glass-morphism design system and integrate seamlessly with the theme system.

## Component Files Created

### 13 Component Templates

1. **page-template.html** - Complete page scaffold with theme integration
2. **button.html** - All button variants (7 types)
3. **card.html** - Card components (5 variants)
4. **nav.html** - Navigation components (5 types)
5. **hero.html** - Hero section variants (6 types)
6. **grid.html** - Grid layout templates (6 layouts)
7. **expandable.html** - Collapsible sections (4 variants)
8. **tabs.html** - Tab components (4 styles)
9. **search.html** - Search interfaces (4 types)
10. **modal.html** - Modal dialogs (5 variants)
11. **form.html** - Form elements (complete set)
12. **list.html** - List components (6 styles)
13. **COMPONENT_GUIDE.md** - Comprehensive usage documentation

## Total Reusable Patterns

**50+ reusable component patterns** covering:
- 7 button types
- 5 card variants
- 5 navigation patterns
- 6 hero sections
- 6 grid layouts
- 4 expandable patterns
- 4 tab styles
- 4 search components
- 5 modal types
- 10+ form elements
- 6 list styles

## Quick Start

### 1. Starting a New Page

Use `page-template.html` as your starting point:

```bash
# Copy the template
cp docs/components/page-template.html docs/my-new-page.html

# Edit and customize
```

### 2. Adding a Component

Browse the component files, find the pattern you need, and copy the HTML:

```html
<!-- From button.html -->
<button class="btn btn-primary">Save Changes</button>

<!-- From card.html -->
<div class="deity-card">
    <div class="deity-icon">🔱</div>
    <h3>Poseidon</h3>
    <p class="deity-title">God of the Seas</p>
    <p>Description here</p>
</div>
```

### 3. Customizing

All components use CSS variables from the theme system:

```css
/* Components automatically adapt to themes */
--color-primary
--color-secondary
--color-background
--color-surface
--color-text-primary
--space-* (spacing scale)
--radius-* (border radius)
--shadow-* (shadows)
```

## Component Descriptions

### page-template.html
Complete HTML5 page structure with:
- Proper meta tags and responsive viewport
- Theme system integration (CSS + JS)
- Header with site title
- Breadcrumb navigation
- Main navigation bar
- Hero section example
- Content sections with cards, tabs, and expandables
- Footer with links
- JavaScript for interactive components

**Use when**: Starting any new documentation page

---

### button.html
All button variants:
- Primary button (main actions)
- Secondary button (alternate actions)
- Icon button (compact, icon-only)
- Button with icon (combined)
- Button group (related actions)
- Button sizes (small, medium, large)
- Link button (styled links)

**Use when**: Need interactive buttons for user actions

---

### card.html
Card components:
- Basic glass card (general container)
- Deity card (profile cards with icon, title, tags)
- Section card (content blocks with badges)
- Feature card (centered features with icons)
- Image card (cards with image headers)

**Use when**: Grouping content in visually distinct containers

---

### nav.html
Navigation patterns:
- Top navigation bar (main site nav)
- Breadcrumb navigation (current location path)
- Side navigation (section TOC)
- Mobile hamburger menu (responsive menu)
- Footer navigation (footer links)

**Use when**: Need navigation elements for site wayfinding

---

### hero.html
Hero section variants:
- Basic hero (title + description)
- Hero with tags (category indicators)
- Hero with background image
- Hero with CTA buttons (call-to-action)
- Hero with icon (large visual icon)
- Hero with stats (key metrics display)

**Use when**: Creating compelling page headers that draw attention

---

### grid.html
Grid layout templates:
- 2-column grid (side-by-side)
- 3-column deity grid (deity cards)
- 4-column feature grid (small cards)
- Responsive auto-fit grid (flexible columns)
- Asymmetric grid (featured + regular items)
- Masonry-style grid (varying heights)

**Use when**: Need multi-column responsive layouts

---

### expandable.html
Collapsible sections:
- Basic expandable (simple toggle)
- Codex search section (with primary sources)
- FAQ accordion (multiple Q&A)
- Multi-level expansion (nested hierarchies)

**Use when**: Hiding/showing content on demand, FAQs, citations

---

### tabs.html
Tab components:
- Horizontal tabs (standard layout)
- Vertical tabs (sidebar layout)
- Tabs with icons (visual indicators)
- Pill-style tabs (rounded modern style)

**Use when**: Organizing related content into separate views

---

### search.html
Search interfaces:
- Basic search box (simple input)
- Advanced search with filters (multiple criteria)
- Search results display (formatted results with pagination)
- Live search with suggestions (autocomplete)

**Use when**: Adding search functionality to pages

---

### modal.html
Modal dialogs:
- Basic modal (general overlay)
- Confirmation dialog (destructive action confirmation)
- Image lightbox (full-size image viewing)
- Form modal (data entry dialog)
- Info modal with tabs (complex information)

**Use when**: Need overlay dialogs for focused interactions

---

### form.html
Form elements:
- Input fields (text, email, password, number, date)
- Textarea (multi-line input)
- Select dropdown (single/multiple selection)
- Checkbox (multiple options)
- Radio buttons (single selection)
- Form validation states (success, error, warning)
- Complete form example

**Use when**: Collecting user input, preferences, or data

---

### list.html
List components:
- Styled bullet list (custom bullets)
- Numbered list (sequential content)
- Definition list (term-definition pairs)
- Icon list (lists with icons and descriptions)
- Card list (prominent items with metadata)
- Nested list (hierarchical content)

**Use when**: Displaying organized content in list format

---

## File Structure

```
docs/components/
├── README.md              # This file
├── COMPONENT_GUIDE.md     # Comprehensive usage guide
├── page-template.html     # Complete page scaffold
├── button.html           # Button components
├── card.html             # Card components
├── nav.html              # Navigation components
├── hero.html             # Hero sections
├── grid.html             # Grid layouts
├── expandable.html       # Expandable sections
├── tabs.html             # Tab components
├── search.html           # Search components
├── modal.html            # Modal dialogs
├── form.html             # Form elements
└── list.html             # List components
```

## Features

### Design System Integration
- All components use CSS variables from theme system
- Automatically adapt to active theme (day, night, fire, water, etc.)
- Glass-morphism effects with backdrop blur
- Consistent spacing, typography, and colors

### Accessibility
- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation support
- Focus styles for all interactive elements
- Screen reader friendly
- WCAG 2.1 AA compliant color contrast

### Responsive Design
- Mobile-first approach
- Breakpoints at 640px, 768px, 1024px, 1280px, 1536px
- Flexible grids that stack on mobile
- Touch-friendly button sizes
- Responsive navigation patterns

### Copy-Paste Ready
- Complete HTML examples
- Inline CSS in component files
- JavaScript snippets included
- No build process required
- Easy to customize

## Documentation

### COMPONENT_GUIDE.md
Comprehensive guide covering:
- How to use each component
- When to use each variant
- Customization options
- Common patterns
- Accessibility best practices
- Code examples
- Quick reference table

**Read this for**: Detailed usage instructions and best practices

## Common Patterns

### Pattern 1: Profile Page
```html
<div class="hero-section hero-icon">...</div>
<div class="tabs">...</div>
<div class="deity-grid">...</div>
```

### Pattern 2: Documentation Page
```html
<nav class="breadcrumb">...</nav>
<nav class="side-nav">...</nav>
<div class="expandable-section">...</div>
```

### Pattern 3: Gallery/Catalog
```html
<div class="search-advanced">...</div>
<div class="deity-grid">...</div>
```

### Pattern 4: Dashboard
```html
<div class="hero-section hero-stats">...</div>
<div class="grid-4col">...</div>
```

## Customization

### Changing Colors
```css
.custom-component {
    --color-primary: #your-color;
    --color-border: rgba(your, rgba);
}
```

### Adjusting Spacing
```css
.custom-spacing {
    padding: var(--space-8);
    gap: var(--space-4);
    margin: var(--space-12);
}
```

### Adding Animations
```css
.custom-hover {
    transition: all 0.3s ease;
}

.custom-hover:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-2xl);
}
```

## Dependencies

All components require:
1. `theme-base.css` - Base styles and CSS variables
2. `{theme}.css` - Active theme styles (day.css, night.css, etc.)
3. `theme-picker.js` - Theme switching functionality

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

CSS features used:
- CSS Grid
- CSS Custom Properties (variables)
- Backdrop filter (gracefully degrades)
- Flexbox

## Contributing

When adding new components:
1. Follow the existing file structure
2. Include HTML examples with inline comments
3. Use CSS variables from theme system
4. Ensure accessibility (ARIA, keyboard nav)
5. Test responsiveness
6. Update COMPONENT_GUIDE.md
7. Add to this README

## Version

**Version 1.0**
Created: 2025-11-14
Total Components: 13 files, 50+ reusable patterns

---

**For detailed usage instructions, see COMPONENT_GUIDE.md**
