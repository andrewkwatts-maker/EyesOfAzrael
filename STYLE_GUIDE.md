# Eyes of Azrael - Comprehensive Style Guide

**Version:** 1.0.0
**Last Updated:** 2025-12-14
**Status:** Living Document

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Component Library](#component-library)
5. [Animation Standards](#animation-standards)
6. [Grid Systems](#grid-systems)
7. [Responsive Breakpoints](#responsive-breakpoints)
8. [Accessibility Guidelines](#accessibility-guidelines)

---

## 1. Color System

### Primary Brand Colors

The Eyes of Azrael theme uses a **glassmorphism dark gradient aesthetic** with purple and cyan accent colors.

#### Core Colors (CSS Variables)

```css
:root {
    /* Primary Colors */
    --color-primary: #8b7fff;              /* Purple accent */
    --color-primary-rgb: 139, 127, 255;
    --color-secondary: #ff7eb6;            /* Pink accent */
    --color-secondary-rgb: 255, 126, 182;
    --color-accent: #64ffda;               /* Cyan/Teal */
    --color-accent-rgb: 100, 255, 218;

    /* Background Colors */
    --color-background: #0a0e27;           /* Deep navy */
    --color-bg-primary: #0a0e27;
    --color-bg-secondary: #151a35;
    --color-bg-card: #1a1f3a;
    --color-bg-card-hover: #222847;

    /* Surface Colors (Glassmorphism) */
    --color-surface: rgba(26, 31, 58, 0.8);
    --color-surface-hover: rgba(26, 31, 58, 0.95);

    /* Text Colors */
    --color-text-primary: #e5e7eb;         /* Light gray */
    --color-text-secondary: #9ca3af;       /* Medium gray */
    --color-text-muted: #6c757d;           /* Dark gray */

    /* Border Colors */
    --color-border: rgba(139, 127, 255, 0.3);
    --color-border-primary: #2a2f4a;
    --color-border-accent: #4a4f6a;

    /* Glassmorphism */
    --glass-bg: rgba(26, 31, 58, 0.8);
    --glass-border: rgba(255, 255, 255, 0.1);
}
```

#### Entity Display Colors

```css
/* Gradient presets for different entity types */
--gradient-deity: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-hero: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--gradient-creature: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
--gradient-item: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
--gradient-place: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
--gradient-concept: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-magic: linear-gradient(135deg, #c471f5 0%, #fa71cd 100%);
--gradient-theory: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
```

#### Mythology-Specific Colors

```css
/* Each mythology has signature colors */
--mythos-greek: #DAA520;       /* Gold */
--mythos-norse: #6366f1;       /* Indigo */
--mythos-egyptian: #CD853F;    /* Peru/Bronze */
--mythos-hindu: #ef4444;       /* Red */
--mythos-buddhist: #f59e0b;    /* Amber */
--mythos-chinese: #ec4899;     /* Pink */
--mythos-japanese: #f43f5e;    /* Rose */
--mythos-celtic: #22c55e;      /* Green */
--mythos-jewish: #3b82f6;      /* Blue */
--mythos-roman: #8b5cf6;       /* Violet */
```

#### Semantic Colors

```css
/* Status and feedback colors */
--success: #51cf66;            /* Green */
--info: #4dabf7;               /* Blue */
--warning: #ffd43b;            /* Yellow */
--danger: #ff6b6b;             /* Red */

/* Submission workflow colors */
--submission-primary: #9370DB;
--submission-secondary: #DAA520;
--submission-success: #22c55e;
--submission-danger: #ef4444;
--submission-warning: #fbbf24;
--submission-info: #3b82f6;
```

---

## 2. Typography

### Font Families

```css
:root {
    --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    --font-heading: 'Cinzel', 'Georgia', 'Times New Roman', serif;
    --font-mono: 'Courier New', Courier, monospace;
}
```

**Primary Font:** System font stack for optimal performance and readability
**Heading Font:** Cinzel (serif) for mythological gravitas
**Monospace:** For code, data, and technical content

### Font Scale

```css
:root {
    --font-size-xs: 0.75rem;    /* 12px */
    --font-size-sm: 0.875rem;   /* 14px */
    --font-size-base: 1rem;     /* 16px - body text */
    --font-size-lg: 1.125rem;   /* 18px */
    --font-size-xl: 1.25rem;    /* 20px */
    --font-size-2xl: 1.5rem;    /* 24px */
    --font-size-3xl: 1.875rem;  /* 30px */
    --font-size-4xl: 2.25rem;   /* 36px */
    --font-size-5xl: 3rem;      /* 48px */
}
```

### Font Weights

```css
:root {
    --font-normal: 400;
    --font-medium: 500;
    --font-semibold: 600;
    --font-bold: 700;
}
```

### Line Heights

```css
:root {
    --leading-tight: 1.25;
    --leading-normal: 1.5;      /* Default for body text */
    --leading-relaxed: 1.75;
    --leading-loose: 2;
}
```

### Typography Usage Guidelines

#### Headings

```css
h1 {
    font-family: var(--font-heading);
    font-size: var(--font-size-5xl);
    font-weight: var(--font-bold);
    line-height: var(--leading-tight);
    color: var(--color-primary);
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

h2 {
    font-family: var(--font-heading);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-semibold);
    color: var(--color-primary);
}

h3 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-semibold);
    color: var(--color-accent);
}
```

#### Body Text

```css
body {
    font-family: var(--font-primary);
    font-size: var(--font-size-base);
    line-height: var(--leading-normal);
    color: var(--color-text-primary);
}

p {
    margin-bottom: var(--spacing-md);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
}
```

---

## 3. Spacing System

**8px Base Unit** - All spacing is based on multiples of 8px for consistency.

```css
:root {
    --spacing-xs: 0.25rem;   /* 4px */
    --spacing-sm: 0.5rem;    /* 8px */
    --spacing-md: 1rem;      /* 16px - base unit */
    --spacing-lg: 1.5rem;    /* 24px */
    --spacing-xl: 2rem;      /* 32px */
    --spacing-2xl: 2.5rem;   /* 40px */
    --spacing-3xl: 3rem;     /* 48px */
    --spacing-4xl: 4rem;     /* 64px */
    --spacing-5xl: 5rem;     /* 80px */
}
```

### Utility Classes

```css
/* Margin utilities */
.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.mt-lg { margin-top: var(--spacing-lg); }
.mt-xl { margin-top: var(--spacing-xl); }

.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.mb-lg { margin-bottom: var(--spacing-lg); }
.mb-xl { margin-bottom: var(--spacing-xl); }

/* Padding utilities */
.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }
.p-xl { padding: var(--spacing-xl); }
```

---

## 4. Component Library

### 4.1 Buttons

#### Primary Button

```css
.btn-primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: white;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-lg);
    border: none;
    font-weight: var(--font-semibold);
    cursor: pointer;
    transition: all var(--transition-base);
    box-shadow: var(--shadow-md);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg), var(--shadow-glow);
}
```

#### Secondary Button

```css
.btn-secondary {
    background: transparent;
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-weight: var(--font-semibold);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.btn-secondary:hover {
    background: var(--color-primary);
    color: white;
}
```

#### Button Sizes

```css
.btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
.btn-md { padding: 0.75rem 1.5rem; font-size: 1rem; }    /* Default */
.btn-lg { padding: 1rem 2rem; font-size: 1.125rem; }
```

### 4.2 Cards

#### Glass Card (Primary)

```css
.glass-card {
    background: var(--color-surface);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg);
    transition: all var(--transition-base);
}

.glass-card:hover {
    background: var(--color-surface-hover);
    transform: translateY(-4px);
    box-shadow: var(--shadow-2xl);
}
```

#### Entity Card

```css
.entity-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.entity-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px 0 rgba(100, 255, 218, 0.3);
    border-color: rgba(100, 255, 218, 0.3);
}

.entity-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.entity-card:hover::before {
    opacity: 1;
}
```

### 4.3 Forms

#### Input Fields

```css
.form-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-surface);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    transition: all var(--transition-fast);
}

.form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.3);
    background: var(--color-surface-hover);
}
```

#### Textarea

```css
.form-textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
    /* Inherits other styles from .form-input */
}
```

#### Labels

```css
.form-label {
    display: block;
    font-weight: var(--font-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
}

.form-label.required::after {
    content: ' *';
    color: var(--danger);
}
```

### 4.4 Tags & Badges

#### Tag

```css
.tag {
    background: rgba(var(--color-primary-rgb), 0.3);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    border: 1px solid rgba(var(--color-primary-rgb), 0.3);
    transition: all var(--transition-fast);
}

.tag:hover {
    background: rgba(var(--color-primary-rgb), 0.25);
    transform: translateY(-1px);
}
```

#### Status Badges

```css
.status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: var(--font-size-xs);
    font-weight: var(--font-semibold);
    border: 1px solid;
}

.status-pending {
    background: rgba(251, 191, 36, 0.2);
    border-color: var(--warning);
    color: var(--warning);
}

.status-approved {
    background: rgba(34, 197, 94, 0.2);
    border-color: var(--success);
    color: var(--success);
}

.status-rejected {
    background: rgba(239, 68, 68, 0.2);
    border-color: var(--danger);
    color: var(--danger);
}
```

### 4.5 Navigation

#### Breadcrumb

```css
.breadcrumb {
    display: flex;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    flex-wrap: wrap;
}

.breadcrumb a {
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: color var(--transition-fast);
}

.breadcrumb a:hover {
    color: var(--color-primary);
}
```

#### Navigation Bar

```css
.nav-bar {
    display: flex;
    gap: var(--spacing-sm);
    background: var(--color-surface);
    backdrop-filter: blur(10px);
    padding: var(--spacing-md);
    border-radius: var(--radius-xl);
    border: 2px solid var(--color-border);
    flex-wrap: wrap;
}

.nav-link {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: all var(--transition-fast);
}

.nav-link:hover {
    color: var(--color-primary);
    background: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
    color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.2);
}
```

---

## 5. Animation Standards

### Transition Speeds

```css
:root {
    --transition-fast: 0.15s ease;
    --transition-base: 0.3s ease;
    --transition-slow: 0.5s ease;
}
```

### Common Animations

#### Fade In

```css
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

#### Spin (Loading)

```css
@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-spinner {
    animation: spin 1s linear infinite;
}
```

#### Pulse (Notifications)

```css
@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.9;
    }
}
```

### Hover Effects

All interactive elements should have smooth hover transitions:

```css
/* Standard hover lift */
.hoverable {
    transition: all var(--transition-base);
}

.hoverable:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}
```

---

## 6. Grid Systems

### Standard Grid

```css
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-lg);
}
```

### Entity Grid

```css
.entities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}
```

### Attribute Grid

```css
.attribute-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
}
```

### Responsive Grid Variants

```css
/* Two-column grid */
.grid-2 {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

/* Three-column grid */
.grid-3 {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* Four-column grid */
.grid-4 {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}
```

---

## 7. Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) { }

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) { }

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) { }

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) { }

/* Mobile-specific overrides */
@media (max-width: 768px) {
    .hero-section {
        padding: var(--spacing-2xl) var(--spacing-md);
    }

    .grid,
    .entities-grid {
        grid-template-columns: 1fr;
    }

    .nav-bar {
        flex-direction: column;
    }
}
```

---

## 8. Accessibility Guidelines

### Focus States

All interactive elements must have visible focus indicators:

```css
*:focus {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
}
```

### Skip Links

```css
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-sm) var(--spacing-md);
    text-decoration: none;
}

.skip-link:focus {
    top: 0;
}
```

### ARIA Labels

All interactive components should include appropriate ARIA labels:

```html
<button aria-label="Close modal">×</button>
<nav aria-label="Breadcrumb">...</nav>
```

### Color Contrast

All text must meet WCAG AA standards:
- **Normal text:** 4.5:1 contrast ratio
- **Large text:** 3:1 contrast ratio
- **UI components:** 3:1 contrast ratio

---

## Border Radius Scale

```css
:root {
    --radius-sm: 0.25rem;   /* 4px */
    --radius-md: 0.5rem;    /* 8px */
    --radius-lg: 0.75rem;   /* 12px */
    --radius-xl: 1rem;      /* 16px */
    --radius-2xl: 1.5rem;   /* 24px */
    --radius-full: 9999px;  /* Pill shape */
}
```

## Shadow Scale

```css
:root {
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    --shadow-glow: 0 0 20px var(--color-primary);
}
```

## Z-Index Scale

```css
:root {
    --z-base: 1;
    --z-dropdown: 100;
    --z-sticky: 200;
    --z-fixed: 300;
    --z-modal-backdrop: 400;
    --z-modal: 500;
    --z-popover: 600;
    --z-tooltip: 700;
}
```

---

## Usage Examples

### Complete Entity Card Example

```html
<div class="entity-card">
    <div class="entity-icon">⚡</div>
    <h3 class="entity-name">Zeus</h3>
    <p class="entity-subtitle">King of the Gods</p>
    <div class="mythology-badges">
        <span class="mythology-badge mythology-greek">Greek</span>
    </div>
    <div class="entity-type-badge">Deity</div>
</div>
```

### Glass Card with Content

```html
<div class="glass-card">
    <h2>Archetypes</h2>
    <div class="attribute-grid">
        <div class="attribute-card">
            <div class="attribute-label">Sky Father</div>
            <div class="attribute-value">95%</div>
        </div>
    </div>
</div>
```

---

## Version History

- **1.0.0** (2025-12-14): Initial comprehensive style guide
