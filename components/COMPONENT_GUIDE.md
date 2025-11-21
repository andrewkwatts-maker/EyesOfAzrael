# EOAPlot Component Guide

## Table of Contents
1. [Overview](#overview)
2. [How to Use Components](#how-to-use-components)
3. [Component Reference](#component-reference)
4. [Common Patterns](#common-patterns)
5. [Customization](#customization)
6. [Accessibility](#accessibility)

---

## Overview

This component library provides reusable HTML templates for the EOAPlot mythology documentation. All components follow the glass-morphism design system and integrate with the theme system.

### Design Principles
- **Copy-Paste Ready**: All components can be directly copied into your pages
- **Theme-Aware**: Components use CSS variables that adapt to the active theme
- **Accessible**: Built with ARIA labels and semantic HTML
- **Responsive**: Mobile-first design that works on all screen sizes
- **Consistent**: Follow the STYLE_GUIDE.md specifications

---

## How to Use Components

### Basic Workflow

1. **Reference the theme system** in your HTML page:
```html
<link rel="stylesheet" href="/themes/theme-base.css">
<link rel="stylesheet" href="/themes/themes/day.css" id="theme-stylesheet">
<script src="/themes/theme-picker.js" defer></script>
```

2. **Browse the component files** to find the pattern you need

3. **Copy the HTML** from the component template

4. **Paste into your page** and customize the content

5. **Copy the CSS** if it's not already in your theme-base.css

### File Structure

```
docs/components/
├── page-template.html     # Complete page scaffold
├── button.html           # All button variants
├── card.html             # Card components
├── nav.html              # Navigation patterns
├── hero.html             # Hero sections
├── grid.html             # Grid layouts
├── expandable.html       # Collapsible sections
├── tabs.html             # Tab components
├── search.html           # Search interfaces
├── modal.html            # Modal dialogs
├── form.html             # Form elements
├── list.html             # List styles
└── COMPONENT_GUIDE.md    # This file
```

---

## Component Reference

### 1. Page Template (`page-template.html`)

**Purpose**: Complete HTML5 page structure with all necessary integrations

**When to Use**:
- Starting a new documentation page
- Need a complete scaffold with header, nav, main, footer

**Key Features**:
- Proper HTML5 structure with responsive meta tags
- Theme system integration
- Breadcrumb navigation
- Standard header and footer
- Accessibility skip links
- JavaScript for interactive components

**Customization**:
- Update page title and meta description
- Modify navigation links
- Adjust breadcrumb path
- Replace hero content
- Add your content sections

---

### 2. Buttons (`button.html`)

**Purpose**: Interactive buttons for user actions

**Variants**:
- **Primary Button**: Main actions, CTAs (`btn btn-primary`)
- **Secondary Button**: Less emphasis actions (`btn btn-secondary`)
- **Icon Button**: Compact icon-only buttons (`btn btn-icon`)
- **Button with Icon**: Combined icon and text
- **Button Group**: Related buttons grouped together
- **Button Sizes**: Small, medium (default), large (`btn-sm`, `btn-lg`)
- **Link Button**: Styled links that look like buttons

**When to Use**:
- Primary: Main page actions, form submissions
- Secondary: Cancel, back, or alternate actions
- Icon: Toolbars, compact interfaces, mobile menus
- Button Group: Related options like text alignment

**Accessibility**:
- Always include `aria-label` for icon-only buttons
- Use semantic `<button>` for actions, `<a>` for navigation
- Disabled state should have `disabled` attribute

**Example**:
```html
<button class="btn btn-primary">Save Changes</button>
<button class="btn btn-secondary">Cancel</button>
<button class="btn btn-icon" aria-label="Close">✕</button>
```

---

### 3. Cards (`card.html`)

**Purpose**: Content containers with glass-morphism effects

**Variants**:
- **Basic Glass Card**: General purpose container
- **Deity Card**: For deity profiles with icon, title, description, tags
- **Section Card**: Content sections with header badges
- **Feature Card**: Centered feature highlights with icons
- **Image Card**: Cards with image headers

**When to Use**:
- Glass Card: General content grouping, panels
- Deity Card: Character profiles, entity cards
- Section Card: Important content blocks with labels
- Feature Card: Benefits, features, key points in grids
- Image Card: Blog posts, articles, visual content

**Customization**:
- Adjust padding with `--space-*` variables
- Change border color by modifying `--color-border`
- Add hover effects with `transform` and `box-shadow`

**Example**:
```html
<div class="deity-card">
    <div class="deity-icon">🔱</div>
    <h3>Poseidon</h3>
    <p class="deity-title">God of the Seas</p>
    <p>Ruler of all waters and earthquakes.</p>
    <div class="deity-domains">
        <span class="tag">Water</span>
        <span class="tag">Earthquakes</span>
    </div>
</div>
```

---

### 4. Navigation (`nav.html`)

**Purpose**: Site navigation and wayfinding

**Variants**:
- **Top Navigation Bar**: Main site navigation
- **Breadcrumb Navigation**: Show current location in hierarchy
- **Side Navigation**: Section navigation or table of contents
- **Mobile Hamburger Menu**: Responsive mobile navigation
- **Footer Navigation**: Footer links organized by category

**When to Use**:
- Top Nav: Every page, main site sections
- Breadcrumb: Pages deep in hierarchy, show path
- Side Nav: Long pages with many sections, documentation
- Mobile Menu: Responsive sites on small screens
- Footer Nav: Secondary navigation, sitemap links

**Accessibility**:
- Use `aria-label` to describe navigation purpose
- Mark current page with `aria-current="page"`
- Ensure keyboard navigation works
- Use `aria-expanded` for expandable menus

**Example**:
```html
<nav class="nav-bar" aria-label="Main navigation">
    <a href="/" class="nav-link">Home</a>
    <a href="/mythology" class="nav-link active">Mythology</a>
    <a href="/deities" class="nav-link">Deities</a>
</nav>

<nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="/">Home</a> →
    <a href="/mythology">Mythology</a> →
    <span aria-current="page">Zeus</span>
</nav>
```

---

### 5. Hero Sections (`hero.html`)

**Purpose**: Compelling page headers that draw attention

**Variants**:
- **Basic Hero**: Title and description
- **Hero with Tags**: Includes category tags
- **Hero with Background**: Full background image or gradient
- **Hero with CTA Buttons**: Action buttons for user engagement
- **Hero with Icon**: Large icon for visual identity
- **Hero with Stats**: Highlight key metrics

**When to Use**:
- Basic: Simple page headers
- Tags: Category pages, filtered content
- Background: Landing pages, marketing
- CTA: Conversion-focused pages
- Icon: Entity pages (deity, hero)
- Stats: Overview pages, dashboards

**Customization**:
- Adjust gradient colors in `background`
- Change text alignment (left, center, right)
- Modify padding for different heights
- Add background images with `background-image: url()`

**Example**:
```html
<div class="hero-section hero-cta">
    <h1>Begin Your Journey</h1>
    <p class="hero-description">Explore the rich tapestry of mythology.</p>
    <div class="hero-actions">
        <button class="btn btn-primary btn-lg">Explore</button>
        <button class="btn btn-secondary btn-lg">Learn More</button>
    </div>
</div>
```

---

### 6. Grid Layouts (`grid.html`)

**Purpose**: Multi-column responsive layouts

**Variants**:
- **2-Column Grid**: Side-by-side content (`grid-2col`)
- **3-Column Deity Grid**: Deity cards (`deity-grid`)
- **4-Column Feature Grid**: Feature cards (`grid-4col`)
- **Responsive Auto-Fit Grid**: Flexible columns (`grid-autofit`)
- **Asymmetric Grid**: Featured + regular items (`grid-asymmetric`)
- **Masonry-Style Grid**: Varying heights (`grid-masonry`)

**When to Use**:
- 2-Column: Comparisons, dual content
- 3-Column: Deity grids, medium card sets
- 4-Column: Feature highlights, small cards
- Auto-Fit: Dynamic content amount
- Asymmetric: Featured content with supporting items
- Masonry: Varying content lengths

**Responsive Behavior**:
- Grids automatically stack on mobile
- `auto-fit` adjusts column count based on space
- Use `grid-span-2` to make items span multiple columns

**Example**:
```html
<div class="deity-grid">
    <div class="deity-card">...</div>
    <div class="deity-card">...</div>
    <div class="deity-card">...</div>
</div>
```

---

### 7. Expandable Sections (`expandable.html`)

**Purpose**: Show/hide content on demand

**Variants**:
- **Basic Expandable**: Simple toggle section
- **Codex Search Section**: Research with primary sources
- **FAQ Accordion**: Multiple expandable questions
- **Multi-Level Expansion**: Nested hierarchies

**When to Use**:
- Basic: Hide supplementary information
- Codex: Citation management, source references
- FAQ: Question/answer format
- Multi-Level: Complex hierarchies, nested content

**JavaScript Required**:
```javascript
function toggleSection(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('.expand-icon');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    content.classList.toggle('collapsed');
    button.setAttribute('aria-expanded', !isExpanded);
    icon.style.transform = content.classList.contains('collapsed') ?
        'rotate(-90deg)' : 'rotate(0deg)';
}
```

**Accessibility**:
- Use `aria-expanded` to indicate state
- Ensure keyboard navigation works
- Mark icons with `aria-hidden="true"`

**Example**:
```html
<div class="expandable-section">
    <button class="expand-header" onclick="toggleSection(this)" aria-expanded="false">
        <h3>Click to Expand</h3>
        <span class="expand-icon" aria-hidden="true">▼</span>
    </button>
    <div class="expand-content collapsed">
        <p>Hidden content here</p>
    </div>
</div>
```

---

### 8. Tabs (`tabs.html`)

**Purpose**: Organize related content into separate views

**Variants**:
- **Horizontal Tabs**: Standard tab layout
- **Vertical Tabs**: Sidebar tab layout
- **Tabs with Icons**: Visual tab indicators
- **Pill-Style Tabs**: Rounded, modern appearance

**When to Use**:
- Horizontal: 3-7 tabs, standard layouts
- Vertical: Many tabs, sidebar layouts
- Icons: Visual reinforcement, better UX
- Pills: Modern design, marketing pages

**JavaScript Required**:
```javascript
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        const container = tab.closest('.tabs');

        // Remove active from all
        container.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        container.querySelectorAll('.tab-content').forEach(c =>
            c.classList.remove('active'));

        // Add active to selected
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        document.getElementById(tabId).classList.add('active');
    });
});
```

**Example**:
```html
<div class="tabs">
    <div class="tab-list" role="tablist">
        <button class="tab active" role="tab" data-tab="tab1">Tab 1</button>
        <button class="tab" role="tab" data-tab="tab2">Tab 2</button>
    </div>
    <div class="tab-content active" id="tab1" role="tabpanel">
        Content 1
    </div>
    <div class="tab-content" id="tab2" role="tabpanel">
        Content 2
    </div>
</div>
```

---

### 9. Search (`search.html`)

**Purpose**: Search interfaces and results display

**Variants**:
- **Basic Search Box**: Simple search input
- **Advanced Search with Filters**: Multiple filter options
- **Search Results Display**: Formatted result list with pagination
- **Live Search with Suggestions**: Autocomplete suggestions

**When to Use**:
- Basic: Simple search needs
- Advanced: Complex filtering requirements
- Results: Display search results
- Live: Instant feedback, autocomplete

**Example**:
```html
<div class="search-box">
    <input type="text" class="search-input" placeholder="Search..." aria-label="Search">
    <button class="search-button" aria-label="Search">🔍</button>
</div>
```

---

### 10. Modals (`modal.html`)

**Purpose**: Overlay dialogs for focused interactions

**Variants**:
- **Basic Modal**: General purpose dialog
- **Confirmation Dialog**: Confirm destructive actions
- **Image Lightbox**: Full-size image display
- **Form Modal**: Collect user input
- **Info Modal with Tabs**: Complex information display

**When to Use**:
- Basic: General overlays, information
- Confirmation: Delete, destructive actions
- Lightbox: Image viewing
- Form: Quick data entry
- Info: Detailed information without page navigation

**JavaScript Required**:
```javascript
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});
```

**Accessibility**:
- Trap focus within modal when open
- Close on Escape key
- Return focus to trigger element on close
- Use `aria-label` for close button

**Example**:
```html
<button onclick="openModal('myModal')">Open Modal</button>

<div class="modal" id="myModal">
    <div class="modal-overlay" onclick="closeModal('myModal')"></div>
    <div class="modal-content">
        <button class="modal-close" onclick="closeModal('myModal')">×</button>
        <h2>Modal Title</h2>
        <p>Modal content</p>
    </div>
</div>
```

---

### 11. Forms (`form.html`)

**Purpose**: User input elements and validation

**Components**:
- **Input Fields**: Text, email, password, number, date
- **Textarea**: Multi-line text input
- **Select Dropdown**: Single and multiple selection
- **Checkbox**: Multiple option selection
- **Radio Buttons**: Single option selection
- **Form Validation**: Success, error, warning states

**When to Use**:
- Forms for data entry
- User preferences
- Search filters
- Comments and feedback

**Validation States**:
- `form-success`: Valid input
- `form-error`: Invalid input
- `form-warning`: Questionable input

**Example**:
```html
<div class="form-group">
    <label for="name">Name</label>
    <input type="text" id="name" class="form-input" placeholder="Enter name">
</div>

<div class="form-group form-error">
    <label for="email">Email</label>
    <input type="email" id="email" class="form-input" value="invalid">
    <small class="form-message">Please enter a valid email</small>
</div>

<label class="checkbox-label">
    <input type="checkbox" class="form-checkbox">
    <span>I agree to the terms</span>
</label>
```

---

### 12. Lists (`list.html`)

**Purpose**: Organized content in list format

**Variants**:
- **Styled Bullet List**: Custom bullet points
- **Numbered List**: Sequential, ordered content
- **Definition List**: Term-definition pairs
- **Icon List**: Lists with icons and descriptions
- **Card List**: Prominent list items with detail
- **Nested List**: Hierarchical content

**When to Use**:
- Bullet: Unordered items
- Numbered: Sequential steps, rankings
- Definition: Glossaries, term explanations
- Icon: Feature lists, domain listings
- Card: Important list items with metadata
- Nested: Hierarchies, taxonomies

**Example**:
```html
<ul class="styled-list">
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
</ul>

<ul class="icon-list">
    <li>
        <span class="list-icon">⚡</span>
        <div>
            <strong>Title</strong>
            <p>Description text</p>
        </div>
    </li>
</ul>
```

---

## Common Patterns

### Pattern 1: Profile Page

Combine hero, tabs, and cards:

```html
<!-- Hero with icon -->
<div class="hero-section hero-icon">
    <div class="hero-icon-display">⚡</div>
    <h1>Zeus</h1>
    <p class="hero-description">King of the Gods</p>
</div>

<!-- Tabbed content -->
<div class="tabs">
    <div class="tab-list">
        <button class="tab active" data-tab="overview">Overview</button>
        <button class="tab" data-tab="myths">Myths</button>
    </div>
    <div class="tab-content active" id="overview">...</div>
    <div class="tab-content" id="myths">...</div>
</div>
```

### Pattern 2: Dashboard/Overview Page

Combine hero with stats and feature grid:

```html
<div class="hero-section hero-stats">
    <h1>Greek Mythology Archive</h1>
    <div class="hero-stat-grid">
        <div class="stat-item">
            <div class="stat-number">12</div>
            <div class="stat-label">Olympians</div>
        </div>
    </div>
</div>

<div class="grid-4col">
    <div class="feature-card">...</div>
</div>
```

### Pattern 3: Documentation Page

Combine side nav, expandable sections, and lists:

```html
<div style="display: grid; grid-template-columns: 250px 1fr; gap: var(--space-6);">
    <nav class="side-nav">...</nav>

    <main>
        <div class="expandable-section">...</div>
        <ul class="icon-list">...</ul>
    </main>
</div>
```

### Pattern 4: Gallery/Catalog Page

Combine search, filters, and grid:

```html
<div class="search-advanced">
    <div class="search-box">...</div>
    <div class="search-filters">...</div>
</div>

<div class="deity-grid">
    <div class="deity-card">...</div>
</div>
```

---

## Customization

### Adjusting Colors

All components use CSS variables from the theme system:

```css
/* Override in your page or custom CSS */
.my-custom-card {
    --color-primary: #your-color;
    --color-border: rgba(your, rgba);
}
```

### Spacing

Use spacing scale variables:

```css
.custom-spacing {
    padding: var(--space-8);
    gap: var(--space-4);
    margin-bottom: var(--space-12);
}
```

### Typography

Adjust font sizes and weights:

```css
.custom-text {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    line-height: var(--leading-relaxed);
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

---

## Accessibility

### Checklist for All Components

- [ ] Use semantic HTML elements
- [ ] Add ARIA labels where needed
- [ ] Ensure keyboard navigation works
- [ ] Provide focus styles
- [ ] Use sufficient color contrast (4.5:1 minimum)
- [ ] Include skip links for navigation
- [ ] Test with screen readers
- [ ] Ensure form labels are associated with inputs
- [ ] Mark decorative elements with `aria-hidden="true"`
- [ ] Use `aria-expanded` for collapsible content

### Focus Styles

All interactive elements should have visible focus:

```css
*:focus {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
}
```

### Screen Reader Text

For icon-only buttons:

```html
<button aria-label="Close dialog">×</button>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:
- Tab: Move forward
- Shift+Tab: Move backward
- Enter/Space: Activate
- Escape: Close modals/menus
- Arrow keys: Navigate within groups

---

## Best Practices

1. **Start with page-template.html** for new pages
2. **Copy HTML exactly** before customizing
3. **Test responsiveness** on mobile, tablet, desktop
4. **Validate accessibility** with tools like axe DevTools
5. **Use CSS variables** instead of hardcoded colors
6. **Keep JavaScript minimal** and reusable
7. **Document customizations** you make
8. **Test with different themes** to ensure compatibility
9. **Follow naming conventions** from STYLE_GUIDE.md
10. **Optimize images** before using in image cards

---

## Quick Reference Table

| Component | File | Primary Use Case | Key Classes |
|-----------|------|------------------|-------------|
| Page Template | page-template.html | Starting point for new pages | N/A |
| Buttons | button.html | User actions | `btn`, `btn-primary`, `btn-secondary` |
| Cards | card.html | Content containers | `glass-card`, `deity-card`, `feature-card` |
| Navigation | nav.html | Site navigation | `nav-bar`, `breadcrumb`, `side-nav` |
| Hero | hero.html | Page headers | `hero-section`, `hero-cta`, `hero-icon` |
| Grid | grid.html | Multi-column layouts | `deity-grid`, `grid-2col`, `grid-4col` |
| Expandable | expandable.html | Collapsible content | `expandable-section`, `expand-content` |
| Tabs | tabs.html | Content organization | `tabs`, `tab-list`, `tab-content` |
| Search | search.html | Search interfaces | `search-box`, `search-input` |
| Modal | modal.html | Dialog overlays | `modal`, `modal-content`, `modal-overlay` |
| Forms | form.html | User input | `form-group`, `form-input` |
| Lists | list.html | Organized content | `styled-list`, `icon-list`, `card-list` |

---

**Version 1.0 | Last Updated: 2025-11-14**
