# Historic Design Standards Documentation

> **Purpose**: This document captures the visual design standards, CSS patterns, and component structures used in the historic HTML files (pre-Firebase migration) within the `mythos/` directory. These standards serve as the reference for maintaining visual consistency during Firebase rendering migration.

**Last Updated**: 2025-12-28
**Analyzed Files**: 10 sample HTML files across deities, creatures, heroes, cosmology, and rituals
**For Use By**: 8 agents polishing Firebase rendering views

---

## Table of Contents

1. [CSS Variable System](#css-variable-system)
2. [Typography Standards](#typography-standards)
3. [Spacing & Layout](#spacing--layout)
4. [Color System](#color-system)
5. [Component Patterns](#component-patterns)
6. [Grid Layouts](#grid-layouts)
7. [Responsive Design](#responsive-design)
8. [Animation & Transitions](#animation--transitions)
9. [Icon Standards](#icon-standards)
10. [Implementation Checklist](#implementation-checklist)

---

## CSS Variable System

### Foundation
All modern styling uses CSS variables defined in `themes/theme-base.css`. **Never use hard-coded values** - always reference the appropriate CSS variable.

### Core CSS Variables

```css
/* Color System */
--color-primary: #f59e0b;           /* Primary accent (gold/amber) */
--color-primary-rgb: 245, 158, 11;  /* RGB for alpha compositing */
--color-secondary: #fbbf24;         /* Secondary accent */
--color-secondary-rgb: 251, 191, 36;
--color-background: #0a0e27;        /* Main background (dark navy) */
--color-surface: rgba(26, 31, 58, 0.8);      /* Card/panel background */
--color-surface-hover: rgba(26, 31, 58, 0.95); /* Hover state */
--color-text-primary: #e5e7eb;      /* Main text (light gray) */
--color-text-secondary: #9ca3af;    /* Secondary text (medium gray) */
--color-accent: #8b7fff;            /* Accent color (purple) */
--color-border: rgba(139, 127, 255, 0.3);    /* Border color */
--color-shadow: rgba(0, 0, 0, 0.5); /* Shadow color */

/* Glass-morphism Support */
--glass-bg: rgba(26, 31, 58, 0.8);
--glass-border: rgba(255, 255, 255, 0.1);
```

### Spacing Scale

```css
/* Systematic spacing - ALWAYS use these */
--spacing-xs: 0.25rem;   /* 4px  - Tight spacing */
--spacing-sm: 0.5rem;    /* 8px  - Small gaps */
--spacing-md: 1rem;      /* 16px - Default spacing */
--spacing-lg: 1.5rem;    /* 24px - Section spacing */
--spacing-xl: 2rem;      /* 32px - Large spacing */
--spacing-2xl: 2.5rem;   /* 40px - Extra large */
--spacing-3xl: 3rem;     /* 48px - Hero sections */
--spacing-4xl: 4rem;     /* 64px - Page sections */
--spacing-5xl: 5rem;     /* 80px - Major dividers */
```

### Border Radius Scale

```css
--radius-sm: 0.25rem;   /* 4px  - Subtle rounding */
--radius-md: 0.5rem;    /* 8px  - Default */
--radius-lg: 0.75rem;   /* 12px - Cards */
--radius-xl: 1rem;      /* 16px - Large cards */
--radius-2xl: 1.5rem;   /* 24px - Hero sections */
--radius-full: 9999px;  /* Pill/circular shapes */
```

### Shadow Scale

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-glow: 0 0 20px var(--color-primary);
```

---

## Typography Standards

### Font Families

```css
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
--font-heading: 'Georgia', 'Times New Roman', serif;
--font-mono: 'Courier New', Courier, monospace;
```

**Usage**:
- Body text: `--font-primary` (modern system fonts)
- Headings (h2-h4 for mythology): `--font-heading` (serif for gravitas)
- h1: Can use system fonts for cleaner look
- Code/technical: `--font-mono`

### Font Size Scale

```css
--font-size-xs: 0.75rem;    /* 12px - Fine print, captions */
--font-size-sm: 0.875rem;   /* 14px - Small text, breadcrumbs */
--font-size-base: 1rem;     /* 16px - Body text DEFAULT */
--font-size-lg: 1.125rem;   /* 18px - Emphasized body */
--font-size-xl: 1.25rem;    /* 20px - Subtitles */
--font-size-2xl: 1.5rem;    /* 24px - Section headers */
--font-size-3xl: 1.875rem;  /* 30px - Page headers */
--font-size-4xl: 2.25rem;   /* 36px - Hero titles */
--font-size-5xl: 3rem;      /* 48px - Large icons */
```

### Typography Hierarchy

**Observed patterns in historic HTML**:

```html
<!-- H1: Page title in header -->
<h1 style="font-size: 1.75rem; font-weight: 700;">
    ⚡ Zeus
</h1>

<!-- H2: Hero section title -->
<h2 style="font-size: var(--font-size-3xl); font-family: var(--font-heading);">
    Zeus
</h2>

<!-- Subtitle in hero -->
<p class="subtitle" style="font-size: 1.5rem; margin: 0.5rem 0;">
    King of the Gods, God of Sky and Thunder
</p>

<!-- Hero description -->
<p style="font-size: 1.1rem; margin-top: 1rem;">
    Description text...
</p>

<!-- Section headers -->
<h2 style="color: var(--color-primary);">
    Attributes & Domains
</h2>

<!-- Subsection headers -->
<h3 style="color: var(--color-text-primary); margin-top: 1.5rem;">
    Key Myths:
</h3>
```

### Line Heights

```css
--leading-tight: 1.25;      /* Headings, tight text */
--leading-normal: 1.5;      /* Default body text */
--leading-relaxed: 1.75;    /* Comfortable reading */
--leading-loose: 2;         /* Airy, spaced out */
```

**Standard**: Body text uses `line-height: 1.6` or `--leading-normal: 1.5`

### Font Weights

```css
--font-normal: 400;    /* Body text */
--font-medium: 500;    /* Emphasized text */
--font-semibold: 600;  /* Section headers */
--font-bold: 700;      /* Important headers */
```

### Text Shadows

**Headers get subtle text shadows for visibility**:

```css
/* General headers */
h1, h2, h3, h4 {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Hero section headers (on gradient backgrounds) */
.hero-section h1,
.hero-section h2,
.hero-section h3 {
    text-shadow:
        0 0 10px rgba(var(--color-primary-rgb), 0.5),
        0 0 20px rgba(var(--color-primary-rgb), 0.3),
        0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Card titles */
.card h3,
.deity-card h3 {
    text-shadow:
        0 0 6px rgba(var(--color-primary-rgb), 0.3),
        0 1px 2px rgba(0, 0, 0, 0.4);
}
```

---

## Spacing & Layout

### Section Spacing

**Consistent vertical rhythm observed**:

```html
<!-- Main sections separated by 2rem -->
<section style="margin-top: 2rem;">
    <h2>Section Title</h2>
</section>

<!-- Subsections within sections: 1.5rem -->
<h3 style="margin-top: 1.5rem;">Subsection</h3>

<!-- Smaller spacing within content: 1rem -->
<p style="margin-top: 1rem;">Content</p>

<!-- Lists indented: 2rem left margin -->
<ul style="margin: 0.5rem 0 0 2rem;">
    <li>Item</li>
</ul>
```

### Padding Standards

**Card/Panel padding**:
```css
/* Standard cards */
padding: var(--spacing-lg);  /* 1.5rem / 24px */

/* Glass cards */
padding: var(--spacing-lg);

/* Hero sections */
padding: var(--spacing-4xl) var(--spacing-xl);  /* 4rem top/bottom, 2rem sides */

/* Compact cards */
padding: var(--spacing-md);  /* 1rem / 16px */
```

### Margins

**Consistent bottom margins**:
```css
/* After hero section */
margin-bottom: 2rem;

/* Between major sections */
margin-top: 2rem;
margin-bottom: 3rem;

/* Interlink panels */
margin-top: 3rem;
```

### Container Max-Width

```css
/* Main content */
max-width: 1400px;
margin: 0 auto;
padding: 0 2rem;

/* Hero text blocks */
max-width: 800px;
margin: 0 auto;

/* Narrow content */
max-width: 700px;
margin: 2.5rem auto;
```

---

## Color System

### Usage Patterns

**Observed color hierarchy**:

1. **Primary (`--color-primary`)**: Section headers, key highlights, primary CTAs
2. **Secondary (`--color-secondary`)**: Subsection headers, secondary emphasis
3. **Text Primary (`--color-text-primary`)**: Main body text
4. **Text Secondary (`--color-text-secondary`)**: Supporting text, metadata
5. **Accent (`--color-accent`)**: Special highlights, interactive elements
6. **Border (`--color-border`)**: Card borders, dividers

### Gradient Patterns

**Hero sections and cards use gradients**:

```css
/* Hero section background */
background: linear-gradient(135deg,
    rgba(var(--color-primary-rgb), 0.2),
    rgba(var(--color-secondary-rgb), 0.2));

/* Button/CTA gradients */
background: linear-gradient(135deg,
    var(--color-primary),
    var(--color-secondary));

/* Text gradients (h1, card titles) */
background: linear-gradient(135deg,
    var(--color-primary) 0%,
    var(--color-secondary) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### Mythology-Specific Colors

**From `mythology-colors.css` - Data attributes trigger these**:

```css
[data-mythology="greek"] {
    --color-primary: #4169E1; /* Royal Blue */
    --color-secondary: #FFD700; /* Gold */
}

[data-mythology="norse"] {
    --color-primary: #B0C4DE; /* Light Steel Blue */
    --color-secondary: #CD853F; /* Peru */
}

[data-mythology="egyptian"] {
    --color-primary: #DAA520; /* Goldenrod */
    --color-secondary: #4169E1; /* Royal Blue */
}

[data-mythology="hindu"] {
    --color-primary: #FF6347; /* Tomato */
    --color-secondary: #FFD700; /* Gold */
}
```

**Usage**: Add `data-mythology="greek"` to `<main>` or container to apply theme

---

## Component Patterns

### 1. Hero Section

**Standard structure observed across all entity pages**:

```html
<section class="hero-section">
    <div class="hero-icon-display">
        ⚡
    </div>
    <h2>Zeus</h2>
    <p class="subtitle" style="font-size: 1.5rem; margin: 0.5rem 0;">
        King of the Gods, God of Sky and Thunder
    </p>
    <p style="font-size: 1.1rem; margin-top: 1rem;">
        Supreme ruler of Mount Olympus and the Greek pantheon...
    </p>
</section>
```

**Styling**:
```css
.hero-section {
    background: linear-gradient(135deg,
        rgba(var(--color-primary-rgb), 0.2),
        rgba(var(--color-secondary-rgb), 0.2));
    border: 2px solid var(--color-primary);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-4xl) var(--spacing-xl);
    text-align: center;
    position: relative;
    overflow: hidden;
}

.hero-icon-display {
    font-size: var(--font-size-5xl);  /* 3rem / 48px */
    margin-bottom: var(--spacing-md);
}
```

### 2. Attribute Grid

**Dynamic Firebase-powered grid with loading placeholder**:

```html
<section>
    <h2 style="color: var(--color-primary);">
        Attributes & Domains
    </h2>
    <div class="attribute-grid"
         data-attribute-grid
         data-mythology="greek"
         data-entity="zeus"
         data-allow-edit="true">
        <div class="loading-placeholder">
            Loading attributes from Firebase...
        </div>
    </div>
</section>
```

**Grid CSS**:
```css
.attribute-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);  /* 1rem */
    margin: var(--spacing-lg) 0;  /* 1.5rem */
}

.attribute-card {
    background: var(--color-surface);
    backdrop-filter: blur(10px);
    border: 2px solid var(--color-border);
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
}
```

### 3. Myth List Renderer

**Standard pattern for dynamic myth loading**:

```html
<h3 style="color: var(--color-text-primary); margin-top: 1.5rem;">
    Key Myths:
</h3>
<div data-myth-list
     data-mythology="greek"
     data-entity="zeus"
     data-allow-submissions="true">
    <div class="loading-placeholder">
        Loading myths from Firebase...
    </div>
</div>
```

### 4. Citation Blocks

```html
<div class="citation" style="margin-top: 1rem;">
    <strong>Sources:</strong>
    Homer's <em>Iliad</em> and <em>Odyssey</em>,
    Hesiod's <em>Theogony</em>...
</div>
```

**Styling**:
```css
.citation {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-style: italic;
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: rgba(var(--color-primary-rgb), 0.05);
    border-left: 3px solid var(--color-primary);
    border-radius: var(--radius-md);
}
```

### 5. Interlink Panel

**Cross-reference system at bottom of pages**:

```html
<section class="interlink-panel" style="margin-top: 3rem;">
    <h3 class="interlink-header">
        <span class="interlink-icon">🔗</span>
        Related Across the Mythos
    </h3>

    <div class="interlink-grid">
        <!-- Archetype Section -->
        <div class="interlink-section">
            <div class="interlink-section-title">Archetype</div>
            <a class="archetype-link-card" href="...">
                <div class="archetype-badge">⚡ SKY FATHER</div>
                <p class="archetype-context">Zeus embodies...</p>
                <span class="see-parallels">See parallels →</span>
            </a>
        </div>

        <!-- Sacred Items, Places, etc. -->
    </div>

    <!-- Cross-Cultural Parallels -->
    <div class="parallel-traditions glass-card"
         style="margin-top: var(--spacing-lg);">
        <h4>🌍 Cross-Cultural Parallels</h4>
        <div class="parallel-grid">
            <a class="parallel-card" href="...">
                <span class="tradition-flag">🦅</span>
                <span class="parallel-name">Jupiter</span>
                <span class="tradition-label">Roman</span>
            </a>
        </div>
    </div>
</section>
```

**Interlink Grid CSS**:
```css
.interlink-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-lg);
}

.parallel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-sm);
}
```

### 6. See Also Links

**Quick navigation pills at bottom**:

```html
<div class="see-also-section">
    <h4 style="color: var(--color-text-primary);">📚 See Also</h4>
    <div class="see-also-links">
        <a class="see-also-link" href="hera.html">
            <span>👑</span> Hera
        </a>
        <a class="see-also-link" href="poseidon.html">
            <span>🔱</span> Poseidon
        </a>
    </div>
</div>
```

**CSS**:
```css
.see-also-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
}

.see-also-link {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    text-decoration: none;
    transition: all var(--transition-base);
}

.see-also-link:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-primary);
    transform: translateY(-2px);
}
```

### 7. Loading Placeholders

**Standard loading state**:

```html
<div class="loading-placeholder">
    <div class="spinner"></div>
    <p>Loading deities...</p>
</div>
```

**CSS from `spinner.css`**:
```css
.loading-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-2xl);
    color: var(--color-text-secondary);
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(var(--color-primary-rgb), 0.2);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### 8. Breadcrumbs

**Standard navigation pattern**:

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="../../../mythos/index.html">Home</a> →
    <a href="../../index.html">Greek</a> →
    <a href="../index.html">Deities</a> →
    <span>Zeus</span>
</nav>
```

**CSS**:
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

---

## Grid Layouts

### 1. Deity/Entity Grid (Index Pages)

**Standard grid for browsing entities**:

```css
.deity-grid,
.pantheon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-lg);  /* 1.5rem / 24px */
}
```

**Minimum card width**: `280px`
**Gap**: `1.5rem` (24px)
**Responsive**: Auto-fit ensures mobile → desktop adaptation

### 2. Attribute Grid (Detail Pages)

```css
.attribute-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);  /* 1rem / 16px */
}
```

**Minimum card width**: `200px`
**Gap**: `1rem` (16px)
**Use case**: Smaller, denser information cards

### 3. Parallel Grid (Cross-references)

```css
.parallel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-sm);  /* 0.5rem / 8px */
}
```

**Minimum card width**: `150px`
**Gap**: `0.5rem` (8px)
**Use case**: Compact parallel deity/concept links

### 4. Two-Column Content Grid

```css
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}
```

**From `styles.css`** - general purpose grid

---

## Responsive Design

### Mobile-First Breakpoints

**Observed patterns**:

```css
/* Base: Mobile (< 768px) */
/* Single column layouts, full-width cards */

/* Tablet (768px - 1024px) */
@media (min-width: 768px) {
    /* 2-column grids */
    .deity-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
    /* 3+ column grids */
    .deity-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
}

/* Large Desktop (> 1400px) */
@media (min-width: 1400px) {
    /* Max-width containers prevent over-stretching */
    main {
        max-width: 1400px;
    }
}
```

### Mobile Adaptations

**Key responsive patterns**:

1. **Grid columns collapse**: `repeat(auto-fit, minmax(280px, 1fr))` automatically stacks on mobile
2. **Padding reduction**:
   ```css
   @media (max-width: 768px) {
       main {
           padding: 0 1rem;  /* Reduced from 2rem */
       }

       .hero-section {
           padding: 2rem 1rem;  /* Reduced from 4rem 2rem */
       }
   }
   ```
3. **Font size scaling**: Hero titles may reduce slightly on mobile
4. **Flex wrapping**: Navigation, breadcrumbs, tags all wrap via `flex-wrap: wrap`

### Header Responsiveness

```css
.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
}

@media (max-width: 768px) {
    .header-content h1 {
        font-size: 1.5rem;  /* Reduced from 1.75rem */
    }
}
```

---

## Animation & Transitions

### Standard Transition Speeds

```css
--transition-fast: 0.15s ease;   /* Hover states */
--transition-base: 0.3s ease;    /* Default animations */
--transition-slow: 0.5s ease;    /* Dramatic effects */
```

### Card Hover Effects

**Standard pattern for interactive cards**:

```css
.card,
.deity-card {
    transition: all var(--transition-base);  /* 0.3s */
}

.card:hover,
.deity-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 30px rgba(var(--color-primary-rgb), 0.4);
}
```

**Hover lift**: `-8px` vertical translation
**Shadow intensifies**: From `--shadow-md` to custom glow

### Button Hover

```css
.btn-primary:hover {
    box-shadow: var(--shadow-lg), var(--shadow-glow);
    transform: translateY(-2px);
}
```

**Lift**: `-2px` (subtle)
**Glow appears**: `--shadow-glow` adds primary color glow

### Link Transitions

```css
nav a {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

nav a::after {
    content: '';
    width: 0;
    transition: all 0.3s ease;
}

nav a:hover::after {
    width: 60%;
}
```

**Underline animation**: Grows from center outward

### Theme Transitions

```css
body.theme-transitioning,
body.theme-transitioning * {
    transition:
        background-color 0.3s ease,
        color 0.3s ease,
        border-color 0.3s ease !important;
}
```

**Applied during theme switching** to prevent jarring color changes

### Loading Spinner

```css
.spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

**Speed**: 1 second per rotation
**Easing**: Linear (constant speed)

---

## Icon Standards

### Icon Sizing

**Observed in HTML**:

1. **Hero icon**: `font-size: 3rem` (48px) - Large, centered display
2. **Card icon**: `font-size: 2.5rem` (40px) - Medium cards
3. **Inline icon**: `font-size: 1.5rem` (24px) - Next to text
4. **Small icon**: `font-size: 1rem` (16px) - Tight spaces

**CSS Variable Usage**:
```css
.hero-icon-display {
    font-size: var(--font-size-5xl);  /* 3rem */
}

.deity-icon {
    font-size: var(--font-size-5xl);  /* 3rem */
}
```

### Icon Placement

**Hero sections**:
```html
<div class="hero-icon-display">
    ⚡
</div>
```

**Card headers**:
```html
<div class="hero-icon-display">⚡</div>
<h3>Zeus</h3>
```

**Inline with text**:
```html
<h1>⚡ Zeus</h1>
<span class="tradition-flag">🦅</span>
```

### Common Icon Categories

- **Deities**: ⚡ (Zeus), 👑 (Hera), 🔱 (Poseidon), 🦉 (Athena), 🏹 (Artemis)
- **Creatures**: 🐉 (dragons), 🦅 (Garuda), 🐺 (Fenrir), 🐍 (serpents)
- **Cosmology**: 🌌 (cosmos), ⚡ (samsara), 🏔️ (mountains), 🌊 (waters)
- **Rituals**: 🕯️ (ceremonies), 🔥 (offerings), 🏛️ (temples)
- **Navigation**: 🔗 (related), 📚 (see also), 🌍 (parallels)

---

## Implementation Checklist

### For Each Firebase-Rendered View

- [ ] **CSS Variables**: No hard-coded colors, spacing, or sizes
- [ ] **Hero Section**: Gradient background, centered icon, proper text hierarchy
- [ ] **Typography**:
  - [ ] Serif headings (`--font-heading`)
  - [ ] System font body (`--font-primary`)
  - [ ] Font size scale followed
  - [ ] Text shadows on headers
- [ ] **Spacing**:
  - [ ] Sections: `margin-top: 2rem`
  - [ ] Subsections: `margin-top: 1.5rem`
  - [ ] Lists: `margin: 0.5rem 0 0 2rem`
- [ ] **Grid Layouts**:
  - [ ] Deity grid: `minmax(280px, 1fr)`
  - [ ] Attribute grid: `minmax(200px, 1fr)`
  - [ ] Proper gap spacing
- [ ] **Cards**:
  - [ ] Glass-morphism: `backdrop-filter: blur(10px)`
  - [ ] Border: `2px solid var(--color-border)`
  - [ ] Border radius: `var(--radius-xl)`
  - [ ] Padding: `var(--spacing-lg)`
  - [ ] Hover: `-8px` lift + shadow
- [ ] **Interlink Panel**:
  - [ ] Archetype section
  - [ ] Cross-cultural parallels
  - [ ] See Also links
- [ ] **Loading States**: Spinner + placeholder text
- [ ] **Responsive**: Auto-fit grids, flex-wrap on navigation
- [ ] **Mythology Theming**: `data-mythology="..."` attribute on `<main>`
- [ ] **Transitions**: `var(--transition-base)` on interactive elements
- [ ] **Icons**: Proper sizing (`--font-size-5xl` for heroes)

### Testing Checklist

- [ ] **Mobile (< 768px)**: Single column, readable text, no overflow
- [ ] **Tablet (768-1024px)**: 2-column grids, comfortable spacing
- [ ] **Desktop (> 1024px)**: 3+ columns, full features visible
- [ ] **Theme Switching**: Smooth transitions, no flash
- [ ] **Dark Mode**: All text readable, proper contrast
- [ ] **Loading States**: Spinner visible, no layout shift when content loads
- [ ] **Hover Effects**: Cards lift, shadows appear, links underline
- [ ] **Cross-browser**: Chrome, Firefox, Safari, Edge

---

## Component Reference Examples

### Complete Hero Section

```html
<section class="hero-section">
    <div class="hero-icon-display">⚡</div>
    <h2>Zeus</h2>
    <p class="subtitle" style="font-size: 1.5rem; margin: 0.5rem 0;">
        King of the Gods, God of Sky and Thunder
    </p>
    <p style="font-size: 1.1rem; margin-top: 1rem;">
        Supreme ruler of Mount Olympus and the Greek pantheon,
        Zeus commands the sky, hurls thunderbolts, and upholds cosmic justice.
    </p>
</section>
```

### Complete Attribute Section

```html
<section>
    <h2 style="color: var(--color-primary);">
        Attributes & Domains
    </h2>
    <div class="attribute-grid"
         data-attribute-grid
         data-mythology="greek"
         data-entity="zeus"
         data-allow-edit="true">
        <div class="loading-placeholder">
            Loading attributes from Firebase...
        </div>
    </div>
</section>
```

### Complete Myth List Section

```html
<section style="margin-top: 2rem;">
    <h2 style="color: var(--color-primary);">
        Mythology & Stories
    </h2>
    <p>
        Zeus's mythology spans the entire Greek cosmos—from the
        overthrow of the Titans to countless interactions with mortals.
    </p>

    <h3 style="color: var(--color-text-primary); margin-top: 1.5rem;">
        Key Myths:
    </h3>
    <div data-myth-list
         data-mythology="greek"
         data-entity="zeus"
         data-allow-submissions="true">
        <div class="loading-placeholder">
            Loading myths from Firebase...
        </div>
    </div>

    <div class="citation" style="margin-top: 1rem;">
        <strong>Sources:</strong>
        Homer's <em>Iliad</em> and <em>Odyssey</em>,
        Hesiod's <em>Theogony</em> and <em>Works and Days</em>
    </div>
</section>
```

### Complete Interlink Panel

```html
<section class="interlink-panel" style="margin-top: 3rem;">
    <h3 class="interlink-header">
        <span class="interlink-icon">🔗</span>
        Related Across the Mythos
    </h3>

    <div class="interlink-grid">
        <div class="interlink-section">
            <div class="interlink-section-title">Archetype</div>
            <a class="archetype-link-card" href="../../../archetypes/sky-father/index.html">
                <div class="archetype-badge">⚡ SKY FATHER</div>
                <p class="archetype-context">
                    Zeus embodies the Sky Father archetype - the supreme
                    heavenly authority ruling over sky, thunder, and cosmic order.
                </p>
                <span class="see-parallels">
                    See parallels: Jupiter, Odin, Dyaus Pita →
                </span>
            </a>
        </div>

        <div class="interlink-section">
            <div class="interlink-section-title">Sacred Places</div>
            <a class="place-link-card" href="../../../spiritual-places/mountains/mount-olympus.html">
                <div class="place-visual">
                    <span class="place-icon">🏔️</span>
                    <span class="place-type">Mountain</span>
                </div>
                <div class="place-info">
                    <h4>Mount Olympus</h4>
                    <p>Home of the Olympian gods</p>
                </div>
            </a>
        </div>
    </div>

    <div class="parallel-traditions glass-card"
         style="margin-top: var(--spacing-lg);
                backdrop-filter: blur(10px);
                border-radius: var(--radius-xl);
                padding: var(--spacing-lg);">
        <h4 style="color: var(--color-text-primary);">
            🌍 Cross-Cultural Parallels
        </h4>
        <div class="parallel-grid">
            <a class="parallel-card" href="../../roman/deities/jupiter.html">
                <span class="tradition-flag">🦅</span>
                <span class="parallel-name">Jupiter</span>
                <span class="tradition-label">Roman</span>
            </a>
            <a class="parallel-card" href="../../norse/deities/thor.html">
                <span class="tradition-flag">⚔️</span>
                <span class="parallel-name">Thor</span>
                <span class="tradition-label">Norse</span>
            </a>
        </div>
    </div>
</section>
```

### Complete See Also Section

```html
<div class="see-also-section">
    <h4 style="color: var(--color-text-primary);">📚 See Also</h4>
    <div class="see-also-links">
        <a class="see-also-link" href="hera.html">
            <span>👑</span> Hera
        </a>
        <a class="see-also-link" href="poseidon.html">
            <span>🔱</span> Poseidon
        </a>
        <a class="see-also-link" href="athena.html">
            <span>🦉</span> Athena
        </a>
        <a class="see-also-link" href="../cosmology/mount-olympus.html">
            <span>🏔️</span> Mount Olympus
        </a>
    </div>
</div>
```

---

## Key Principles

### 1. Consistency is Sacred
- **Always** use CSS variables, never hard-code values
- **Always** follow the spacing scale
- **Always** use the same component structure across pages

### 2. Mobile-First, Always
- Design for mobile first, enhance for desktop
- Use `auto-fit` grids for automatic responsiveness
- Test on 360px, 768px, 1024px, and 1400px+ widths

### 3. Visual Hierarchy
- Hero sections are bold and centered
- Section headers use `--color-primary`
- Subsection headers use `--color-text-primary` or `--color-secondary`
- Body text uses `--color-text-secondary`

### 4. Glass-Morphism is Default
- Cards and panels use `backdrop-filter: blur(10px)`
- Subtle borders: `2px solid var(--color-border)`
- Semi-transparent backgrounds: `var(--color-surface)`

### 5. Transitions Everywhere
- Interactive elements get `transition: all var(--transition-base)`
- Hover states lift cards `-8px` with enhanced shadow
- Theme changes are smooth via `.theme-transitioning` class

### 6. Content-First
- Loading placeholders prevent layout shift
- Semantic HTML structure (`<section>`, `<article>`, etc.)
- Accessibility: breadcrumbs, ARIA labels, semantic headings

---

## Files Analyzed

1. **H:\Github\EyesOfAzrael\mythos\greek\deities\zeus.html** - Deity detail page (comprehensive)
2. **H:\Github\EyesOfAzrael\mythos\egyptian\deities\thoth.html** - Deity with author theories section
3. **H:\Github\EyesOfAzrael\mythos\norse\deities\loki.html** - Deity with inline styles
4. **H:\Github\EyesOfAzrael\mythos\hindu\creatures\garuda.html** - Creature page (minimal structure)
5. **H:\Github\EyesOfAzrael\mythos\babylonian\creatures\mushussu.html** - Creature with codex search
6. **H:\Github\EyesOfAzrael\mythos\sumerian\heroes\gilgamesh.html** - Hero page (empty/placeholder)
7. **H:\Github\EyesOfAzrael\mythos\buddhist\cosmology\samsara.html** - Cosmology with embedded styles
8. **H:\Github\EyesOfAzrael\mythos\greek\rituals\index.html** - Category index (under development)
9. **H:\Github\EyesOfAzrael\mythos\greek\deities\index.html** - Deity index with Firebase grid
10. **H:\Github\EyesOfAzrael\styles.css** - Base stylesheet (first 300 lines)
11. **H:\Github\EyesOfAzrael\themes\theme-base.css** - Theme variables (first 400 lines)

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│ HISTORIC DESIGN QUICK REFERENCE                │
├─────────────────────────────────────────────────┤
│ SPACING SCALE                                   │
│   xs: 0.25rem  sm: 0.5rem   md: 1rem           │
│   lg: 1.5rem   xl: 2rem     2xl: 2.5rem        │
│                                                 │
│ FONT SIZES                                      │
│   xs: 0.75rem  base: 1rem   xl: 1.25rem        │
│   2xl: 1.5rem  4xl: 2.25rem 5xl: 3rem          │
│                                                 │
│ BORDER RADIUS                                   │
│   sm: 0.25rem  md: 0.5rem   lg: 0.75rem        │
│   xl: 1rem     2xl: 1.5rem  full: 9999px       │
│                                                 │
│ GRIDS                                           │
│   Deity: minmax(280px, 1fr)  gap: 1.5rem       │
│   Attribute: minmax(200px, 1fr)  gap: 1rem     │
│   Parallel: minmax(150px, 1fr)  gap: 0.5rem    │
│                                                 │
│ SECTION SPACING                                 │
│   Main sections: margin-top: 2rem              │
│   Subsections: margin-top: 1.5rem              │
│   Content: margin-top: 1rem                    │
│                                                 │
│ CARD HOVER                                      │
│   transform: translateY(-8px)                  │
│   shadow: 0 10px 30px rgba(primary, 0.4)       │
│                                                 │
│ HERO PADDING                                    │
│   padding: 4rem 2rem (desktop)                 │
│   padding: 2rem 1rem (mobile)                  │
└─────────────────────────────────────────────────┘
```

---

**END OF DOCUMENT**

*This document serves as the authoritative reference for maintaining visual consistency across Firebase-rendered mythology pages. All 8 polishing agents should reference this document when implementing views.*
