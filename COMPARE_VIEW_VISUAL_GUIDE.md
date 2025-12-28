# CompareView Visual Component Guide

**Component:** CompareView Enhanced Edition
**Version:** 2.0
**Last Updated:** December 28, 2025

---

## Component Structure

```
┌──────────────────────────────────────────────────────────────────┐
│                         COMPARE ENTITIES                          │
│               Discover similarities and differences              │
│                                                                   │
│  [🔗 Share]  [📥 Export]  [🗑️ Clear]                           │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Select Entities to Compare                              2/3     │
│                                                                   │
│  [⚡ Zeus] ×  [⚒️ Thor] ×  ←─ Selected Entity Chips           │
│                                                                   │
│  ┌──────────────────────┬─────────────┬─────────────┐          │
│  │ Search entities...  🔍│  Mythology  │    Type     │          │
│  └──────────────────────┴─────────────┴─────────────┘          │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │  Entity  │ │  Entity  │ │  Entity  │  ←─ Search Results     │
│  │   Card   │ │   Card   │ │   Card   │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Similarity Analysis Section

```
┌──────────────────────────────────────────────────────────────────┐
│                      Similarity Analysis                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Overall Match │  │   Shared     │  │   Unique     │          │
│  │              │  │ Attributes   │  │ Attributes   │          │
│  │     67%      │  │      8       │  │      4       │          │
│  │──────────────│  │ out of 12    │  │ differences  │          │
│  │████████      │  └──────────────┘  └──────────────┘          │
│  └──────────────┘                                                │
│                                                                   │
│                     Attribute Overlap                            │
│  ┌────────────────────────────────────────────────────┐         │
│  │            ┌─────────┐      ┌─────────┐           │         │
│  │            │  Zeus   │      │  Thor   │           │         │
│  │            │    ○────┴──────┴────○    │           │         │
│  │            │    │       8       │     │           │         │
│  │            └────┘               └─────┘           │         │
│  │                  Venn Diagram                      │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ ✓ Key Similarities  │  │ ✗ Key Differences   │              │
│  │─────────────────────│  │─────────────────────│              │
│  │ • Both control      │  │ • Different         │              │
│  │   thunder/storms    │  │   mythology origins │              │
│  │ • Sky god roles     │  │ • Unique symbols    │              │
│  │ • Divine weapons    │  │ • Family structures │              │
│  └─────────────────────┘  └─────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Desktop Comparison Table

```
┌────────────────────────────────────────────────────────────────────────┐
│ Attribute    │    Zeus (Greek) ⚡         │    Thor (Norse) ⚒️        │
│──────────────┼────────────────────────────┼───────────────────────────│
│ Name         │ Zeus                       │ Thor                      │ ← all-match
│──────────────┼────────────────────────────┼───────────────────────────│
│ Mythology    │ Greek                      │ Norse                     │ ← all-differ
│──────────────┼────────────────────────────┼───────────────────────────│
│ Domain       │ Sky, Thunder, Law          │ Thunder, Strength, War    │ ← some-match
│──────────────┼────────────────────────────┼───────────────────────────│
│ Symbols      │ Thunderbolt, Eagle, Oak    │ Mjolnir, Goats, Oak       │ ← all-differ
│──────────────┼────────────────────────────┼───────────────────────────│
│ Weapon       │ Thunderbolt                │ Mjolnir                   │ ← all-differ
│──────────────┼────────────────────────────┼───────────────────────────│
│ Parents      │ Cronus, Rhea               │ Odin, Fjörgyn            │ ← all-differ
│──────────────┼────────────────────────────┼───────────────────────────│
│ Sacred Tree  │ Oak                        │ Oak                       │ ← all-match
│──────────────┴────────────────────────────┴───────────────────────────│
│                         [Scroll Bar] →→→                               │
└────────────────────────────────────────────────────────────────────────┘

Color Legend:
  Green Background  = All values match
  Yellow Background = Some values match
  Blue Background   = All values differ
  Faded             = All values empty
```

---

## Mobile View (Stacked Cards)

```
┌──────────────────────────────────────┐
│    [Zeus ⚡]  [Thor ⚒️]             │ ← Tabs
│    ─────────  ─────────              │
└──────────────────────────────────────┘

        ← Swipe to switch entities →    ← Hint

┌──────────────────────────────────────┐
│  ⚡                         ×        │
│                                       │
│  Zeus                                 │
│  [Greek] [Deity]                      │
│───────────────────────────────────────│
│  Attribute        Value               │
│───────────────────────────────────────│
│  Name            Zeus                 │
│  Mythology       Greek                │
│  Domain          Sky, Thunder, Law    │
│  Symbols         Thunderbolt, Eagle   │
│  Weapon          Thunderbolt          │
│  Parents         Cronus, Rhea         │
│  Sacred Tree     Oak                  │
│                                       │
│  [Scroll for more attributes...]     │
└──────────────────────────────────────┘

        [← Previous]  1 of 2  [Next →]   ← Navigation
```

---

## Venn Diagram Variations

### Two-Entity Comparison
```
        ┌─────────┐
        │  Zeus   │
        │    ○────┴──────┐
        │    │     8     │
        └────┘           │
                   ┌─────┴───┐
                   │  Thor   │
                   │    ○    │
                   └─────────┘
```

### Three-Entity Comparison
```
              ┌─────────┐
              │  Zeus   │
              │    ○    │
              └────┬────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────┴────┐     6     ┌────┴────┐
   │  Thor   │           │   Ra    │
   │    ○    │           │    ○    │
   └─────────┘           └─────────┘
```

---

## Responsive Breakpoints

### Desktop (>768px)
- Side-by-side comparison table
- Full button text visible
- Large Venn diagrams (300px height)
- Multi-column metrics grid

### Tablet (768px-1024px)
- Narrower table columns
- Stacked search controls
- Medium Venn diagrams (250px height)
- 2-column metrics grid

### Mobile (<768px)
- Stacked entity cards
- Icon-only buttons
- Small Venn diagrams (200px height)
- Single-column layout
- Swipe gestures enabled

---

## Color Coding System

### Mythology Colors
```
Greek     : #4A90E2  (Blue)
Norse     : #7C4DFF  (Purple)
Egyptian  : #FFB300  (Gold)
Hindu     : #E91E63  (Pink)
Chinese   : #F44336  (Red)
Japanese  : #FF5722  (Deep Orange)
Celtic    : #4CAF50  (Green)
Babylonian: #795548  (Brown)
```

### Comparison Highlighting
```
All Match     : rgba(76, 175, 80, 0.1)   (Light Green)
Some Match    : rgba(255, 193, 7, 0.05)  (Light Yellow)
All Differ    : rgba(33, 150, 243, 0.05) (Light Blue)
All Empty     : Faded (opacity: 0.5)
```

---

## Interactive States

### Button States
```
Normal:   Background: #1a1f3a, Border: #2a2f4a
Hover:    Background: #8b7fff, Border: #8b7fff, Shadow: rgba(139, 127, 255, 0.3)
Disabled: Opacity: 0.5, Cursor: not-allowed
```

### Entity Chips
```
Normal:   Background: #1a1f3a, Border: #8b7fff
Hover:    Background: rgba(139, 127, 255, 0.1), Transform: translateY(-1px)
Remove:   Background: rgba(255, 77, 77, 0.2), Color: #ff4d4d
```

### Search Results
```
Normal:   Background: #151a35, Border: #2a2f4a
Hover:    Border: #8b7fff, Transform: translateY(-2px), Shadow: rgba(139, 127, 255, 0.2)
```

---

## Animation Timeline

### Page Load
```
0ms    : Component mounts
100ms  : Fade in animation starts
400ms  : Fade in completes
500ms  : Parse URL parameters
1000ms : Load pre-selected entities
1500ms : Calculate similarity metrics
2000ms : Animate metric bars (600ms duration)
2600ms : Render complete
```

### Entity Selection
```
0ms    : Entity clicked
0ms    : Add to selectedEntities array
0ms    : Re-render component
300ms  : New chip animates in
600ms  : Similarity calculation updates
1200ms : Metric bars re-animate
```

### Mobile Swipe
```
0ms    : Touch starts (touchStartX recorded)
???ms  : Touch ends (touchEndX recorded)
0ms    : Calculate swipe distance
0ms    : If >50px, navigate to next/prev
0ms    : slideIn animation starts (300ms)
300ms  : New card fully visible
```

---

## Data Flow

```
User Action
    ↓
Event Handler
    ↓
Update State (this.selectedEntities)
    ↓
Calculate Similarity
    ↓
Re-render Component
    ↓
Update DOM
    ↓
Apply Animations
    ↓
Ready for Next Action
```

---

## Key Features Visualization

### 1. Entity Selection Flow
```
Search → Filter → Click Card → Add Chip → Update Table → Calculate Similarity
```

### 2. Comparison Flow
```
Select 2+ Entities → Calculate Metrics → Render Venn → Highlight Differences → Display Insights
```

### 3. Mobile Navigation Flow
```
Swipe Left → Detect Gesture → Change Index → Update Active Card → Animate Transition → Update Tabs
```

### 4. Share Flow
```
Click Share → Generate URL → Copy to Clipboard → Show Toast → Success!
```

---

## Usage Examples

### Example 1: Compare Sky Gods
```
Entities: Zeus (Greek), Odin (Norse), Ra (Egyptian)
Result:  67% similarity
Shared:  All rule their respective pantheons
         All associated with sky/heavens
         All have divine weapons
Differ:  Different cultural origins
         Unique family structures
         Different sacred symbols
```

### Example 2: Compare Heroes
```
Entities: Heracles (Greek), Gilgamesh (Babylonian)
Result:  54% similarity
Shared:  Both demigods
         Both undertook quests
         Both sought immortality
Differ:  Different quest types
         Different outcomes
         Different cultural contexts
```

---

## Best Practices

### For Users
1. Select entities from the same category for meaningful comparisons
2. Compare 2-3 entities for optimal visualization
3. Use filters to narrow search results
4. Share interesting comparisons via URL
5. Export to PDF for reference

### For Developers
1. Always validate entity data before comparison
2. Handle missing attributes gracefully
3. Test on multiple screen sizes
4. Optimize for slow connections
5. Cache Firebase results when possible

---

## Accessibility Features

```
Keyboard Navigation:
  Tab       → Navigate between elements
  Enter     → Select/activate
  Esc       → Close modals
  Arrow Keys→ Navigate table cells

Screen Reader:
  ARIA labels on all buttons
  Semantic HTML structure
  Descriptive alt text
  Logical heading hierarchy

Visual:
  2:1 minimum contrast ratio
  Focus indicators on all interactive elements
  High contrast mode support
  Reduced motion support
```

---

## Performance Metrics

```
Initial Load:     < 1s
Entity Selection: < 200ms
Similarity Calc:  < 100ms
Re-render:        < 300ms
Swipe Response:   < 50ms
Animation:        60fps target
```

---

**Component Files:**
- JavaScript: `js/components/compare-view.js`
- CSS (Base): `css/compare-view.css`
- CSS (Enhanced): `css/compare-view-enhanced.css`

**Total Lines:** ~2,500 lines (combined)
**Browser Support:** Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
**Mobile Support:** iOS 16+, Android 13+

---

This visual guide demonstrates the enhanced CompareView component with all its features, layouts, and interactive states.
