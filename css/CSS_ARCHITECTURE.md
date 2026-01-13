# CSS Architecture Guide

## Overview

Eyes of Azrael uses a component-based CSS architecture with 111 stylesheet files.
This guide establishes conventions for maintaining consistency and reducing duplication.

## Directory Structure

```
css/
├── base/                    # Foundation styles
│   ├── critical.css         # Above-the-fold critical styles
│   ├── accessibility.css    # A11y utilities
│   └── debug-borders.css    # Development helpers
│
├── components/              # UI Components (BEM)
│   ├── buttons/
│   ├── cards/
│   ├── forms/
│   ├── modals/
│   └── spinners/
│
├── layouts/                 # Page layouts
│   ├── grid-*.css
│   ├── panel-*.css
│   └── universal-*.css
│
├── themes/                  # Theme variations
│   ├── firebase-themes.css
│   ├── shader-*.css
│   └── mythology-ambiance.css
│
├── views/                   # Page-specific styles
│   ├── home-*.css
│   ├── entity-*.css
│   └── user-*.css
│
└── utilities/               # Utility classes
    └── visual-polish.css
```

## BEM Naming Convention

Use Block-Element-Modifier (BEM) for new CSS:

```css
/* Block: Standalone component */
.card { }

/* Element: Part of a block (double underscore) */
.card__header { }
.card__body { }
.card__footer { }

/* Modifier: Variation (double hyphen) */
.card--featured { }
.card--compact { }
.card__header--sticky { }
```

### Examples

```css
/* Entity Card Component */
.entity-card { }
.entity-card__image { }
.entity-card__title { }
.entity-card__description { }
.entity-card__actions { }
.entity-card--highlighted { }
.entity-card--loading { }

/* Loading Spinner */
.spinner { }
.spinner__ring { }
.spinner__text { }
.spinner--small { }
.spinner--large { }
.spinner--inline { }
```

## CSS Variables (Design Tokens)

### Colors
```css
:root {
  /* Primary palette */
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-primary-dark: #4f46e5;

  /* Semantic colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Neutrals */
  --color-bg-primary: var(--bg-primary);
  --color-bg-secondary: var(--bg-secondary);
  --color-text-primary: var(--text-primary);
  --color-text-muted: var(--text-muted);
}
```

### Spacing
```css
:root {
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
}
```

### Typography
```css
:root {
  --font-family-base: system-ui, -apple-system, sans-serif;
  --font-family-heading: var(--font-family-base);
  --font-family-mono: 'Fira Code', monospace;

  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-md: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-2xl: 1.5rem;   /* 24px */
}
```

### Transitions (defined in loading-states.css)
```css
:root {
  --transition-micro: 100ms;
  --transition-fast: 150ms;
  --transition-normal: 250ms;
  --transition-slow: 350ms;
  --transition-sluggish: 500ms;

  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
}
```

## Component Patterns

### Loading States
Use the standardized loading system from `loading-states.css`:

```html
<!-- Full page loading -->
<div class="loading-container spa-loading">
  <div class="spinner-container">
    <div class="spinner-ring"></div>
  </div>
  <p class="loading-message">Loading...</p>
</div>

<!-- Inline loading -->
<div class="loading-state">
  <div class="spinner-container">
    <div class="spinner-ring"></div>
  </div>
</div>

<!-- Skeleton screens -->
<div class="skeleton-card">
  <div class="skeleton-image"></div>
  <div class="skeleton-text"></div>
</div>
```

### Cards
```html
<article class="entity-card">
  <div class="entity-card__image">
    <img src="..." alt="...">
  </div>
  <div class="entity-card__content">
    <h3 class="entity-card__title">Title</h3>
    <p class="entity-card__description">Description</p>
  </div>
  <div class="entity-card__actions">
    <button class="btn btn--primary">Action</button>
  </div>
</article>
```

### Forms
```html
<form class="form">
  <div class="form__group">
    <label class="form__label" for="name">Name</label>
    <input class="form__input" type="text" id="name">
    <span class="form__error">Error message</span>
  </div>
  <div class="form__actions">
    <button class="btn btn--primary" type="submit">Submit</button>
  </div>
</form>
```

## File Consolidation Opportunities

### High Priority (Duplicate Functionality)

| Current Files | Consolidate To |
|---------------|----------------|
| loading-spinner.css, spinner.css, loading-states.css | loading-states.css |
| entity-card-polish.css, card-truncation.css | entity-card.css |
| form-polish.css, entity-forms.css, mobile-forms.css | forms.css |
| home-page.css, home-view.css | home.css |

### Medium Priority (Related Styles)

| Current Files | Consolidate To |
|---------------|----------------|
| user-profile.css, user-profile-polished.css | user-profile.css |
| user-dashboard.css, user-dashboard-polished.css | user-dashboard.css |
| compare-view.css, compare-view-enhanced.css | compare-view.css |
| entity-detail.css, entity-detail-enhanced.css | entity-detail.css |

### Low Priority (Can Remain Separate)

- Theme files (shader-*.css, mythology-ambiance.css)
- View-specific overrides
- Debug utilities

## Migration Strategy

1. **New CSS**: Write all new styles using BEM conventions
2. **Bug fixes**: When fixing styles, refactor to BEM if touching that component
3. **Major features**: Consolidate related files when adding major features
4. **Don't**: Mass-refactor existing CSS without specific need

## Z-Index Scale

```css
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}
```

## Media Queries

Use mobile-first approach with these breakpoints:

```css
/* Mobile first - base styles */
.component { }

/* Tablet */
@media (min-width: 768px) {
  .component { }
}

/* Desktop */
@media (min-width: 1024px) {
  .component { }
}

/* Large desktop */
@media (min-width: 1280px) {
  .component { }
}
```

## Performance Guidelines

1. **Critical CSS**: Keep above-the-fold styles in `critical.css`
2. **Specificity**: Avoid `!important`, use BEM for specificity
3. **Selectors**: Prefer class selectors over tag/ID selectors
4. **Animations**: Use `transform` and `opacity` for smooth animations
5. **GPU**: Add `will-change` sparingly for frequently animated elements
