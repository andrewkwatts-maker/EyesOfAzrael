# Search UI Design Patterns

## Visual Design System for Search Components

This document describes the visual design patterns used in the search UI components.

---

## Color Palette

### Primary Colors (Theme Variables)
```css
--color-primary         /* Main brand color - used for highlights, buttons */
--color-primary-rgb     /* RGB values for transparency effects */
--color-secondary       /* Accent color - used for badges, highlights */
--color-secondary-rgb   /* RGB values for transparency */
```

### Surface Colors
```css
--color-surface         /* Card/panel backgrounds */
--color-surface-rgb     /* For glassmorphism (rgba transparency) */
--color-background      /* Page background */
```

### Text Colors
```css
--color-text-primary    /* Main text */
--color-text-secondary  /* Secondary text, labels */
```

---

## Typography Scale

```css
/* Hero Heading */
font-size: clamp(2rem, 5vw, 3rem);  /* Fluid, responsive */
background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Search Input */
font-size: 1.1rem;
min-height: 48px;

/* Result Cards Title */
font-size: 1.2rem;
font-weight: 600;
color: var(--color-primary);

/* Body Text */
font-size: 1rem;
line-height: 1.8;  /* For readability */

/* Metadata / Labels */
font-size: 0.85-0.95rem;
color: var(--color-text-secondary);
```

---

## Spacing System

```css
/* Component Gaps */
gap: 0.5rem;   /* Tight spacing (chips, inline elements) */
gap: 0.75rem;  /* Standard spacing (buttons, cards) */
gap: 1rem;     /* Medium spacing (sections) */
gap: 1.5rem;   /* Large spacing (grid cards) */
gap: 2rem;     /* Extra large (major sections) */

/* Padding Scale */
padding: 0.5rem;        /* Small buttons */
padding: 0.75rem 1rem;  /* Standard buttons */
padding: 1rem;          /* Inputs, cards */
padding: 1.5rem;        /* Large cards */
padding: 2rem;          /* Hero sections */
padding: 3rem 2rem;     /* Extra large hero */
```

---

## Border Radius Scale

```css
--radius-sm: 6px;    /* Small elements (badges, inputs) */
--radius-md: 8px;    /* Medium elements (buttons, dropdowns) */
--radius-lg: 12px;   /* Large cards */
--radius-xl: 24px;   /* Hero sections */
--radius-full: 20px; /* Pills/badges */
```

---

## Shadow System

```css
--shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.3);
--shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.4);

/* Card Hover Effect */
box-shadow: var(--shadow-xl), 0 0 20px rgba(var(--color-primary-rgb), 0.15);
```

---

## Glassmorphism Pattern

The signature visual style of the search interface:

```css
.glass-card {
    background: rgba(var(--color-surface-rgb), 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);  /* Safari */
    border: 2px solid rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-lg);
}
```

**Usage:**
- Result cards
- Filter panels
- Autocomplete dropdowns
- Hero sections (with gradients)

---

## Button Styles

### Primary Button (Gradient)
```css
background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
color: white;
border: none;
border-radius: var(--radius-md);
min-height: 44px;
padding: 0.75rem 1.5rem;
font-weight: 600;
cursor: pointer;
transition: all var(--transition-base);
```

**Hover:**
```css
transform: translateY(-2px);
box-shadow: 0 5px 15px rgba(var(--color-primary-rgb), 0.4);
```

### Secondary Button (Outline)
```css
background: rgba(var(--color-surface-rgb), 0.6);
border: 1px solid rgba(var(--color-primary-rgb), 0.2);
color: var(--color-text-primary);
border-radius: var(--radius-md);
min-height: 44px;
```

### Pill Button (Example Queries)
```css
background: rgba(var(--color-primary-rgb), 0.2);
border: 2px solid var(--color-primary);
border-radius: var(--radius-full);
color: var(--color-primary);
min-height: 44px;
padding: 0.75rem 1.5rem;
```

---

## Badge Styles

### Primary Badge (Mythology Tags)
```css
background: rgba(var(--color-primary-rgb), 0.2);
padding: 0.25rem 0.75rem;
border-radius: var(--radius-full);
font-size: 0.75rem;
font-weight: 600;
border: 1px solid rgba(var(--color-primary-rgb), 0.3);
color: var(--color-primary);
```

### Counter Badge (Filter Count)
```css
background: white;
color: var(--color-primary);
border-radius: var(--radius-full);
padding: 0.25rem 0.75rem;
font-size: 0.85rem;
font-weight: 700;
```

### Result Count Badge
```css
background: rgba(var(--color-primary-rgb), 0.3);
color: var(--color-primary);
padding: 0.25rem 0.5rem;
border-radius: var(--radius-full);
font-size: 0.75rem;
font-weight: 700;
min-width: 30px;
text-align: center;
```

---

## Input Field Styles

### Search Input
```css
width: 100%;
min-height: 48px;
padding: 0.75rem 3rem 0.75rem 3rem;  /* Space for icons */
font-size: 1.1rem;
background: rgba(var(--color-surface-rgb), 0.6);
backdrop-filter: blur(10px);
border: 2px solid rgba(var(--color-primary-rgb), 0.2);
border-radius: var(--radius-md);
color: var(--color-text-primary);
transition: all var(--transition-base);
```

**Focus State:**
```css
border-color: var(--color-primary);
box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.3);
outline: none;
```

### Select Dropdown
```css
width: 100%;
min-height: 44px;
padding: 0.5rem 1rem;
background: rgba(var(--color-surface-rgb), 0.6);
border: 1px solid rgba(var(--color-primary-rgb), 0.2);
border-radius: var(--radius-sm);
color: var(--color-text-primary);
cursor: pointer;
```

### Checkboxes
```css
width: 18px;
height: 18px;
cursor: pointer;
accent-color: var(--color-primary);
```

---

## Card Patterns

### Result Card (Grid View)
```css
.result-card {
    display: block;
    background: rgba(var(--color-surface-rgb), 0.6);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    cursor: pointer;
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
}

.result-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg), 0 0 15px rgba(var(--color-primary-rgb), 0.2);
    border-color: var(--color-primary);
}
```

### Corpus Result Card
```css
.corpus-result {
    background: rgba(var(--color-surface-rgb), 0.6);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    transition: all var(--transition-base);
    margin-bottom: 1rem;
}
```

---

## Grid Layouts

### Responsive Card Grid
```css
.entity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}
```

**Breakpoints:**
- Desktop (>1200px): 4-5 columns
- Tablet (768-1200px): 2-3 columns
- Mobile (<768px): 1 column

### Two-Column Layout (Filters + Results)
```css
.search-content {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 2rem;
    align-items: start;
}
```

**Mobile:** Collapses to single column

---

## Highlighting Pattern

### Search Term Highlight
```css
mark {
    background: rgba(var(--color-secondary-rgb), 0.3);
    color: var(--color-secondary);
    padding: 0.2rem 0.4rem;
    border-radius: var(--radius-sm);
    font-weight: 600;
}
```

---

## State Indicators

### Loading State
```css
.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
}

.spinner {
    /* Animated spinner */
}
```

### Empty State
```css
.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: rgba(var(--color-surface-rgb), 0.3);
    border-radius: var(--radius-lg);
    border: 2px dashed rgba(var(--color-primary-rgb), 0.3);
}
```

### Error State
```css
.error-state {
    text-align: center;
    padding: 4rem 2rem;
    background: rgba(255, 69, 0, 0.1);
    border: 2px solid rgba(255, 69, 0, 0.3);
    border-radius: var(--radius-lg);
}
```

---

## Animation Patterns

### Standard Transition
```css
transition: all var(--transition-base);
/* Typically 0.3s ease */
```

### Hover Lift
```css
transform: translateY(-5px);
```

### Slide In (Horizontal)
```css
transform: translateX(5px);
```

### Glow Effect
```css
box-shadow: var(--shadow-xl), 0 0 20px rgba(var(--color-primary-rgb), 0.15);
```

---

## Accessibility Patterns

### Touch Targets
- **Minimum height:** 44px (WCAG AAA)
- **Search input:** 48px (extra comfort)
- **Checkboxes:** 18×18px (in 44px container)

### Focus Indicators
```css
:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
```

### Disabled State
```css
:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

---

## Responsive Patterns

### Mobile Adjustments
```css
@media (max-width: 768px) {
    /* Stack filter panel */
    .search-content {
        grid-template-columns: 1fr;
    }

    /* Full-width buttons */
    .filter-actions button {
        width: 100%;
    }

    /* Smaller padding */
    .search-hero {
        padding: 2rem 1rem;
    }

    /* Smaller text */
    h1 {
        font-size: clamp(1.5rem, 5vw, 2rem);
    }
}
```

### Touch-Friendly Spacing
```css
/* Increase gaps on mobile */
@media (max-width: 768px) {
    .entity-grid {
        gap: 1rem;
    }
}
```

---

## Dark/Light Theme Support

All colors use CSS variables that change with the theme:

```css
/* Day theme */
--color-primary: #4a9eff;
--color-background: #f5f5f5;
--color-text-primary: #1a1a1a;

/* Night theme */
--color-primary: #9370db;
--color-background: #0a0a0a;
--color-text-primary: #e0e0e0;
```

The glassmorphism effect adapts automatically because it uses `rgba(var(--color-surface-rgb), 0.6)`.

---

## Icon Usage

### Emoji Icons
Used throughout for visual interest:
- 🔍 Search
- 🎛️ Filters
- 🌍 Mythology
- 📚 Entity Types
- ⭐ Importance
- 🖼️ Images
- 🕒 Recent

**Size Scale:**
- Inline: 1-1.2rem
- Hero: 4rem
- Card icons: 3rem

---

## Best Practices

1. **Always use CSS variables** - No hardcoded colors
2. **Include webkit prefixes** - For backdrop-filter
3. **Provide fallbacks** - For older browsers
4. **Test all themes** - Ensure contrast ratios
5. **Maintain touch targets** - ≥44px minimum
6. **Use semantic HTML** - For accessibility
7. **Progressive enhancement** - Works without JS for basic features
8. **Performance first** - Optimize animations, limit repaints
9. **Mobile-first** - Design for small screens first
10. **Test with real data** - Including long names, special characters
