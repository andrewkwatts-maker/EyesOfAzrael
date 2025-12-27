# Add Entity Card System - Visual Reference Guide

## Visual Appearance Description

Since I cannot create actual screenshots, this document provides detailed descriptions of the visual appearance to help you understand what the components look like.

---

## Add Entity Card Visual Appearance

### Default State

```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                               │
│                               │
│            +                  │    <-- Large plus icon (4rem)
│                               │        Color: Cyan (#64ffda)
│                               │        Glow: Subtle drop-shadow
│     Add New Deity             │
│                               │    <-- Label in Cinzel font
│                               │        Color: Cyan with 90% opacity
│                               │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘

Background: Semi-transparent with blur
Border: 2px DASHED cyan (key differentiator!)
Shadow: Subtle dark shadow
Cursor: Pointer
Height: 200px minimum
```

**Key Visual Features:**
- **DASHED BORDER** - This is the main differentiator from regular entity cards
- Semi-transparent glassmorphism background
- Cyan color scheme (#64ffda)
- Centered layout
- Subtle glow effects

### Hover State

```
┌━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                              ┃
┃                              ┃
┃            ╳                 ┃    <-- Icon rotated 90 degrees
┃          (glowing)           ┃        Larger (4.5rem)
┃                              ┃        Brighter glow
┃     Add New Deity            ┃
┃      (glowing)               ┃    <-- Text with glow
┃                              ┃
┃                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Background: Brighter cyan tint
Border: 2px SOLID cyan (changes from dashed!)
Shadow: Enhanced with cyan glow
Transform: Scaled up slightly, lifted up 5px
Cursor: Pointer
```

**Hover Animations:**
- Border changes from DASHED to SOLID
- Icon rotates 90 degrees (+ becomes ╳)
- Card scales up (1.02x)
- Card lifts up (translateY -5px)
- Cyan glow appears around border
- Background brightens

### Comparison with Regular Entity Cards

**Regular Entity Card:**
```
┌───────────────────────────┐
│                           │
│           ⚡              │    <-- Deity icon
│                           │
│          Zeus             │    <-- Name in Cinzel
│                           │
│    King of the Gods       │    <-- Subtitle
│                           │
└───────────────────────────┘

Border: SOLID (regular line)
Background: Glassmorphism
```

**Add Entity Card:**
```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                           │
│            +              │    <-- Plus icon
│                           │
│      Add New Deity        │    <-- Label
│                           │
│                           │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘

Border: DASHED (differentiated!)
Background: Slightly more transparent
```

**Visual Differentiation Strategy:**
- Regular cards use **solid borders**
- Add entity card uses **dashed border**
- This makes the add card instantly recognizable as an action/interactive element
- Both maintain the same glassmorphism aesthetic

---

## Edit Icon Visual Appearance

### Default State (Top-Right Position)

```
Entity Card:
┌───────────────────────────┐
│                      [✏️] │ <-- Edit icon (40x40px)
│           ⚡              │     Top-right corner
│                           │     12px from edges
│          Zeus             │
│                           │
│    King of the Gods       │
│                           │
└───────────────────────────┘

Edit Icon Detail:
┌──────────┐
│          │
│    ✏️    │  <-- Pencil emoji centered
│          │      Glassmorphism background
└──────────┘      Cyan border (2px)
                  Subtle glow
                  Border-radius: 10px
```

**Visual Properties:**
- Size: 40x40px (medium)
- Background: Glassmorphism with cyan tint
- Border: 2px solid cyan
- Shadow: Dark shadow + cyan glow
- Position: Absolute, 12px from top and right
- Icon: ✏️ pencil emoji, centered

### Hover State

```
┌──────────────┐
│              │
│      ✏️      │  <-- Scaled up 10%
│   (tilted)   │      Rotated -15 degrees
│              │      Brighter glow
└──────────────┘
      ↑
 "Edit this entity"  <-- Tooltip appears above
```

**Hover Effects:**
- Icon scales up to 110%
- Icon rotates -15 degrees
- Glow intensifies
- Tooltip appears above with arrow
- Background brightens

### Position Variants

```
Top-Right (default):
┌─────────────────────────┐
│                    [✏️] │
│                         │
│        Content          │
└─────────────────────────┘

Top-Left:
┌─────────────────────────┐
│ [✏️]                    │
│                         │
│        Content          │
└─────────────────────────┘

Bottom-Right:
┌─────────────────────────┐
│                         │
│        Content          │
│                    [✏️] │
└─────────────────────────┘

Bottom-Left:
┌─────────────────────────┐
│                         │
│        Content          │
│ [✏️]                    │
└─────────────────────────┘
```

### Size Variants

```
Small (32x32px):
┌────────┐
│   ✏️   │  <-- Smaller icon
└────────┘      Font-size: 0.9rem

Medium (40x40px) - Default:
┌──────────┐
│    ✏️    │  <-- Medium icon
└──────────┘      Font-size: 1.1rem

Large (48x48px):
┌────────────┐
│     ✏️     │  <-- Larger icon
└────────────┘      Font-size: 1.3rem
```

---

## Theme Variants

### Purple Variant (for Theories)

**Add Entity Card - Purple:**
```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                           │
│            💡             │    <-- Different icon
│                           │        Color: Purple (#9333ea)
│    Submit New Theory      │
│                           │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘

Border: Dashed purple
Glow: Purple instead of cyan
Theme: Matches theory pages
```

**Edit Icon - Purple:**
```
┌──────────┐
│    ✏️    │  <-- Purple themed
└──────────┘      Border: Purple
                  Glow: Purple
                  Background: Purple tint
```

### Gold Variant (for Special Entities)

**Add Entity Card - Gold:**
```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                           │
│            ⭐             │    <-- Star icon
│                           │        Color: Gold (#ffc107)
│    Add Special Entity     │
│                           │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘

Border: Dashed gold
Glow: Golden glow
Theme: For rare/special content
```

---

## Size Variants

### Compact Variant

```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                       │
│          +            │    <-- Smaller icon (3rem)
│                       │        Height: 150px
│    Add New Deity      │        Reduced padding
│                       │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘

Use case: Sidebar, limited space
```

### Mini Variant

```
┌─ ─ ─ ─ ─ ─ ─ ─┐
│                │
│       +        │    <-- Tiny icon (2rem)
│                │        Height: 100px
│  Add Deity     │        Minimal padding
└─ ─ ─ ─ ─ ─ ─ ─┘

Use case: Compact lists, mobile
```

---

## Grid Integration

### In Entity Grid

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │          │  │          │  │          │           │
│  │    ⚡    │  │    👑    │  │    🌊    │           │
│  │          │  │          │  │          │           │
│  │   Zeus   │  │   Hera   │  │ Poseidon │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌ ─ ─ ─ ─ ┐           │
│  │          │  │          │  │          │ <-- Dashed!
│  │    🦉    │  │    ☀️    │  │    +     │           │
│  │          │  │          │  │          │           │
│  │  Athena  │  │  Apollo  │  │Add Deity │           │
│  └──────────┘  └──────────┘  └ ─ ─ ─ ─ ┘           │
│                                                      │
└──────────────────────────────────────────────────────┘

Grid: Auto-fit, 250px minimum columns
Gap: 1.5rem between cards
Add card: Fits seamlessly in grid
Border: Dashed (vs solid on others)
```

---

## Responsive Behavior

### Desktop (> 768px)

```
Full-size add card:
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                               │
│              +                │  <-- Icon: 4rem
│                               │      Height: 200px
│       Add New Deity           │      Full label
│                               │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

### Tablet (≤ 768px)

```
Medium add card:
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                       │
│         +             │  <-- Icon: 3rem
│                       │      Height: 180px
│   Add New Deity       │      Reduced padding
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

### Mobile (≤ 480px)

```
Compact add card:
┌─ ─ ─ ─ ─ ─ ─ ─┐
│                │
│       +        │  <-- Icon: 2.5rem
│                │      Height: 150px
│  Add Deity     │      Smaller text
└─ ─ ─ ─ ─ ─ ─ ─┘
```

---

## Animation Sequences

### Add Entity Card Appear Animation

```
Frame 1 (0s):
  Opacity: 0
  Position: translateY(+20px)
  ┌ ─ ─ ─ ─ ─ ─┐
  │             │  <-- Below, invisible
  │      +      │
  └ ─ ─ ─ ─ ─ ─┘

Frame 2 (0.2s):
  Opacity: 0.5
  Position: translateY(+10px)
  ┌ ─ ─ ─ ─ ─ ─┐
  │             │  <-- Rising, fading in
  │      +      │
  └ ─ ─ ─ ─ ─ ─┘

Frame 3 (0.4s):
  Opacity: 1
  Position: translateY(0)
  ┌ ─ ─ ─ ─ ─ ─┐
  │             │  <-- Final position, visible
  │      +      │
  └ ─ ─ ─ ─ ─ ─┘
```

### Hover Transition Sequence

```
State 1 (Default):
  ┌─ ─ ─ ─ ─ ─┐  <-- Dashed border
  │            │      Icon: +
  │     +      │      Rotation: 0deg
  └─ ─ ─ ─ ─ ─┘      Scale: 1.0

Transition (0.3s):
  ┌─ ─ ─ ─ ─ ─┐  <-- Border solidifying
  │            │      Icon rotating
  │     ╱      │      Scale increasing
  └─ ─ ─ ─ ─ ─┘

State 2 (Hover):
  ┌━━━━━━━━━━┓  <-- SOLID border (key change!)
  ┃          ┃      Icon: ╳
  ┃    ╳     ┃      Rotation: 90deg
  ┗━━━━━━━━━━┛      Scale: 1.02
                    Glow: Active
```

### Edit Icon Appear Animation

```
Frame 1 (0s):
  Opacity: 0
  Scale: 0.5
  [·] <-- Tiny, invisible

Frame 2 (0.15s):
  Opacity: 0.7
  Scale: 0.8
  [✏️] <-- Growing, appearing

Frame 3 (0.3s):
  Opacity: 1
  Scale: 1.0
  [✏️] <-- Full size, visible
```

---

## Color Palette

### Cyan Theme (Default)

```
Primary:    #64ffda  (Cyan glow)
Secondary:  #00d4ff  (Bright cyan)
Background: rgba(255, 255, 255, 0.03)  (Semi-transparent)
Border:     rgba(100, 255, 218, 0.3)   (Cyan with transparency)
Hover Glow: rgba(100, 255, 218, 0.6)   (Brighter cyan)
Shadow:     rgba(0, 0, 0, 0.37)        (Dark shadow)
```

### Purple Theme (Theories)

```
Primary:    #9333ea  (Purple)
Secondary:  #764ba2  (Deep purple)
Background: rgba(255, 255, 255, 0.03)
Border:     rgba(147, 51, 234, 0.3)
Hover Glow: rgba(147, 51, 234, 0.6)
```

### Gold Theme (Special)

```
Primary:    #ffc107  (Gold)
Secondary:  #ff9800  (Orange-gold)
Background: rgba(255, 255, 255, 0.03)
Border:     rgba(255, 193, 7, 0.3)
Hover Glow: rgba(255, 193, 7, 0.6)
```

---

## Typography

### Add Entity Card

```
Icon:
  - Font-size: 4rem
  - Line-height: 1
  - User-select: none
  - Filter: drop-shadow (glow effect)

Label:
  - Font-family: 'Cinzel', serif
  - Font-size: 1.1rem
  - Font-weight: 600
  - Color: rgba(100, 255, 218, 0.9)
  - Letter-spacing: 0.5px
  - Text-align: center
```

### Edit Icon

```
Icon:
  - Font-size: 1.1rem (medium)
  - User-select: none
  - Filter: drop-shadow

Tooltip:
  - Font-size: 0.75rem
  - Font-weight: 600
  - Color: #64ffda
  - Background: rgba(0, 0, 0, 0.9)
  - Padding: 6px 12px
  - Border-radius: 6px
```

---

## Shadow and Glow Effects

### Add Entity Card Shadows

**Default:**
```
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);

Visual: Subtle dark shadow beneath card
Effect: Gives slight elevation
```

**Hover:**
```
box-shadow:
  0 12px 40px 0 rgba(100, 255, 218, 0.2),
  0 0 30px rgba(100, 255, 218, 0.15);

Visual: Enhanced shadow + cyan glow
Effect: Card appears to "lift" and "glow"
```

### Edit Icon Shadows

**Default:**
```
box-shadow:
  0 4px 12px rgba(0, 0, 0, 0.3),
  0 0 20px rgba(100, 255, 218, 0.2);

Visual: Dark shadow + subtle glow
Effect: Icon appears to float
```

**Hover:**
```
box-shadow:
  0 6px 16px rgba(0, 0, 0, 0.4),
  0 0 30px rgba(100, 255, 218, 0.4);

Visual: Enhanced shadow + brighter glow
Effect: Icon "pops" out more
```

---

## Tooltip Design

### Edit Icon Tooltip

```
Position: Above icon

     ┌─────────────────────┐
     │ Edit this entity    │  <-- Tooltip box
     └──────────┬──────────┘      Black background
                │                  Cyan text
                ▼                  Rounded corners
           ┌──────────┐            6px padding
           │    ✏️    │  <-- Edit icon
           └──────────┘

Appearance:
  - Background: rgba(0, 0, 0, 0.9)
  - Color: #64ffda
  - Font-size: 0.75rem
  - Font-weight: 600
  - Border-radius: 6px
  - Arrow: 6px triangle pointing down
  - Offset: 8px above icon

Animation:
  - Opacity: 0 → 1
  - translateY: 5px → 0
  - Duration: 0.2s
```

---

## Glassmorphism Effect

### Background Blur

```
Layering visualization:

┌─────────────────────────────────┐
│  Background gradient (page)     │
│  ↓                               │
│  ┌─────────────────────────────┐│
│  │ Blurred background         ││  <-- backdrop-filter: blur(10px)
│  │ ↓                           ││
│  │ ┌─────────────────────────┐││
│  │ │ Semi-transparent fill   │││  <-- rgba(255,255,255,0.03)
│  │ │ ↓                       │││
│  │ │ CONTENT LAYER           │││
│  │ └─────────────────────────┘││
│  └─────────────────────────────┘│
└─────────────────────────────────┘

Result: "Frosted glass" effect
```

**CSS:**
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
```

---

## Accessibility Features

### High Contrast Mode

```
Normal Mode:
┌─ ─ ─ ─ ─ ─ ─ ─┐
│                │  Border: 2px dashed
│       +        │  Text weight: 600
└─ ─ ─ ─ ─ ─ ─ ─┘

High Contrast Mode:
┌━━━━━━━━━━━━━━┓
┃              ┃  Border: 3px solid (thicker)
┃      +       ┃  Text weight: 700 (bolder)
┗━━━━━━━━━━━━━━┛  Colors: Maximum contrast
```

### Focus Indicators

```
Keyboard Focus:
┌─ ─ ─ ─ ─ ─ ─ ─┐
┃                ┃  <-- 3px solid outline
┃       +        ┃      Cyan color
┃                ┃      2px offset
└─ ─ ─ ─ ─ ─ ─ ─┘
  ↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  Focus outline (3px)

Visible for keyboard users
Hidden for mouse users (:focus-visible)
```

---

## Print View

When printing pages:

```
Printed Page:

┌──────────┐  ┌──────────┐
│          │  │          │
│   Zeus   │  │   Hera   │  <-- Entity cards visible
│          │  │          │
└──────────┘  └──────────┘

[Add entity card HIDDEN in print]
[Edit icons HIDDEN in print]

Rationale: Interactive elements not useful in print
```

---

## Loading State

```
Add Entity Card Loading:

┌─ ─ ─ ─ ─ ─ ─ ─┐
│                │
│       ⟳        │  <-- Spinning loader
│   (spinning)   │      Cyan color
│                │      Card at 50% opacity
└─ ─ ─ ─ ─ ─ ─ ─┘      Pointer-events: none

Used when:
  - Verifying authentication
  - Submitting form
  - Processing request
```

---

## Summary of Visual Differences

### Key Visual Markers

**Add Entity Card:**
- ✓ DASHED border (main identifier)
- ✓ + icon centered
- ✓ Label text
- ✓ Slightly more transparent
- ✓ Hover: border becomes solid

**Regular Entity Card:**
- ✓ SOLID border
- ✓ Entity icon (emoji/symbol)
- ✓ Entity name + subtitle
- ✓ Standard opacity
- ✓ Hover: just glow

**Edit Icon:**
- ✓ Small floating button
- ✓ Top-right corner (default)
- ✓ Pencil emoji
- ✓ Only visible to owner
- ✓ Glassmorphism background

---

## Testing Visual Appearance

### Visual QA Checklist

**Add Entity Card:**
- [ ] Border is dashed in default state
- [ ] Border becomes solid on hover
- [ ] Icon rotates 90 degrees on hover
- [ ] Card scales up slightly on hover
- [ ] Cyan glow appears on hover
- [ ] Fits in grid with other cards
- [ ] Visually distinct from regular cards
- [ ] Theme color matches page

**Edit Icon:**
- [ ] Appears in correct corner
- [ ] Only visible for owned content
- [ ] Scales up on hover
- [ ] Icon rotates on hover
- [ ] Tooltip appears on hover
- [ ] Doesn't interfere with card click
- [ ] Visible on all card sizes
- [ ] Accessible via keyboard

---

This visual guide provides detailed descriptions of the component appearance to help you understand the design without actual screenshots. Use the demo page (`demo-add-entity-system.html`) to see the live components in action!

---

**Note**: The actual rendered components will have smooth animations, glassmorphism blur effects, and glowing shadows that are difficult to represent in ASCII art. Open the demo page in a browser for the full visual experience.
