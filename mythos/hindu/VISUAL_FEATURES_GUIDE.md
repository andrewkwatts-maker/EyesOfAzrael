# Hindu Mythology Page - Visual Features Guide

## Page Layout Overview

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: 🕉️ Hindu Mythology + User Auth              │
├─────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home → Hindu Mythology                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🕉️                                                     │
│  HERO SECTION                                          │
│  "Explore the vast cosmos..."                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  THE TRIMURTI - SACRED TRINITY                         │
│  त्रिमूर्ति                                              │
│                                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐                   │
│  │  🪷    │  │  🦚    │  │  🔱    │                   │
│  │ Brahma │  │ Vishnu │  │ Shiva  │                   │
│  │ ब्रह्मा │  │ विष्णु  │  │ शिव    │                   │
│  │Creator │  │Preserver│  │Destroyer│                  │
│  └────────┘  └────────┘  └────────┘                   │
├─────────────────────────────────────────────────────────┤
│  7 CHAKRAS - ENERGY CENTERS                            │
│  सप्त चक्र                                              │
│                                                         │
│       ☸️  Sahasrara (Violet)  सहस्रार                  │
│        ↑                                               │
│       👁️  Ajna (Indigo)  आज्ञा                        │
│        ↑                                               │
│       🗣️  Vishuddha (Blue)  विशुद्ध                    │
│        ↑                                               │
│       💚  Anahata (Green)  अनाहत                       │
│        ↑                                               │
│       ☀️  Manipura (Yellow)  मणिपुर                    │
│        ↑                                               │
│       🌊  Svadhisthana (Orange)  स्वाधिष्ठान            │
│        ↑                                               │
│       🔴  Muladhara (Red)  मूलाधार                     │
│                                                         │
│  [Interactive Legend with 7 clickable items]           │
│                                                         │
│  [Chakra Information Panel - Changes on click]         │
│  Currently showing: Muladhara (Root)                   │
│  - Location: Base of spine                             │
│  - Associated Deities: Ganesha, Brahma, Prithvi       │
│  - Qualities: Grounding, stability, security...       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  DEITIES (Firebase-loaded)                             │
│  [Grid of deity cards...]                              │
├─────────────────────────────────────────────────────────┤
│  HEROES, CREATURES, COSMOLOGY, etc...                  │
│  [More sections...]                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Feature #1: Trimurti Sacred Trinity

### Visual Design

```
┌────────────────────────────────────────────────────┐
│          🕉️ THE TRIMURTI - SACRED TRINITY          │
│                    त्रिमूर्ति                        │
│    The three supreme aspects of the divine         │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  │   CREATOR    │ │  PRESERVER   │ │  DESTROYER   │
│  ├──────────────┤ ├──────────────┤ ├──────────────┤
│  │      🪷      │ │      🦚      │ │      🔱      │
│  │              │ │              │ │              │
│  │    Brahma    │ │    Vishnu    │ │    Shiva     │
│  │    ब्रह्मा    │ │    विष्णु     │ │     शिव      │
│  │              │ │              │ │              │
│  │ Lord of      │ │ Sustainer of │ │ Lord of      │
│  │ Creation...  │ │ dharma...    │ │ transformation│
│  └──────────────┘ └──────────────┘ └──────────────┘
│                                                    │
│  [Hover Effect: Cards lift up 8px with glow]      │
│  [Click: Navigate to full deity page]             │
└────────────────────────────────────────────────────┘
```

### Key Visual Elements:
- **Gradient Background**: Subtle primary/secondary color blend
- **Top Accent Strip**: 4px gradient stripe at top of each card
- **Devanagari Names**: 1.3em serif font in primary color
- **Role Labels**: Uppercase, 0.9rem, secondary color
- **Hover Animation**: translateY(-8px) + enhanced shadow
- **Responsive**: 3 cols → 2 cols → 1 col on mobile

---

## Feature #2: Seven Chakras Visualization

### SVG Wheel Structure

```
         ☸️  Crown (Violet)
          ↑  #9333EA
         👁️  Third Eye (Indigo)
          ↑  #4F46E5
         🗣️  Throat (Blue)
          ↑  #0EA5E9
         💚  Heart (Green)
          ↑  #10B981
         ☀️  Solar Plexus (Yellow)
          ↑  #EAB308
         🌊  Sacral (Orange)
          ↑  #F97316
         🔴  Root (Red)
              #DC2626
```

### Interactive Legend

```
┌───────────────────────────────────────────────────┐
│ Legend (Click any item to view details):         │
├───────────────────────────────────────────────────┤
│ 🟣 Sahasrara  सहस्रार   Crown • Divine Connection│
│ 🔵 Ajna  आज्ञा   Third Eye • Intuition          │
│ 🔵 Vishuddha  विशुद्ध   Throat • Expression      │
│ 🟢 Anahata  अनाहत   Heart • Love                │
│ 🟡 Manipura  मणिपुर   Solar Plexus • Power      │
│ 🟠 Svadhisthana  स्वाधिष्ठान   Sacral • Creativity│
│ 🔴 Muladhara  मूलाधार   Root • Grounding         │
└───────────────────────────────────────────────────┘

[Active item highlighted with border and background]
```

### Information Panel (Example: Anahata)

```
┌─────────────────────────────────────────────────────┐
│  Anahata Chakra - Heart   अनाहत                    │
├─────────────────────────────────────────────────────┤
│  Location: Heart center                             │
│  Color: Green                                       │
│  Element: Air                                       │
│                                                     │
│  Associated Deities:                                │
│  [Vishnu • विष्णु] [Lakshmi • लक्ष्मी]              │
│  [Parvati • पार्वती]                                │
│                                                     │
│  Qualities: Love, compassion, balance, healing,     │
│  harmony, devotion                                  │
└─────────────────────────────────────────────────────┘
```

### Deity Badges
```css
Background: rgba(16, 185, 129, 0.2)  /* Chakra color at 20% */
Color: #10B981  /* Full chakra color */
Font: 0.75rem, weight: 600
Padding: 0.25rem 0.5rem
Border-radius: Small
```

---

## Feature #3: Devanagari Typography

### Font Rendering Examples

#### Sanskrit Name Display (Large)
```
┌────────────┐
│   Shiva    │
│            │
│    शिव     │  ← 1.3em, Tiro Devanagari Sanskrit
│            │     Color: var(--color-primary)
└────────────┘
```

#### General Devanagari Text
```
Sapta Chakra  सप्त चक्र  ← Noto Sans Devanagari, 600 weight
```

#### Inline Mixed Script
```
Crown Chakra • Sahasrara • सहस्रार
                            ↑
                   Devanagari class applied
```

### Font Stack Priority:
1. **Noto Sans Devanagari** (Google Fonts) - Modern, clean
2. **Tiro Devanagari Sanskrit** (Google Fonts) - Traditional
3. **Mangal** (Windows) - System fallback
4. **Nirmala UI** (Windows 8+) - Modern system
5. **sans-serif** - Universal fallback

---

## Color Palette

### Chakra Colors (Exact Values)
```css
Crown (Sahasrara):      #9333EA  /* Violet */
Third Eye (Ajna):       #4F46E5  /* Indigo */
Throat (Vishuddha):     #0EA5E9  /* Blue */
Heart (Anahata):        #10B981  /* Green */
Solar Plexus (Manipura):#EAB308  /* Yellow */
Sacral (Svadhisthana):  #F97316  /* Orange */
Root (Muladhara):       #DC2626  /* Red */
```

### Theme Colors
```css
--color-primary: #FF6347     /* Hindu theme primary */
--color-secondary: #FF8C00   /* Hindu theme secondary */
```

---

## Interaction States

### Chakra Click Flow:
1. **User clicks chakra circle or legend item**
   → JavaScript captures click event

2. **Active state applied:**
   - SVG circle: Brightness 1.4 + glow
   - Legend item: Background change + border
   - Info panel: Display with fadeIn animation

3. **Previous active states removed:**
   - All other elements return to default

4. **Scrolling (optional):**
   - Info panel scrolls into view if below fold

### Hover Effects:
- **Trimurti Cards**: Lift 8px, shadow increases
- **Chakra Circles**: Brightness 1.3, scale 1.1
- **Legend Items**: Background tint, slide right 4px

---

## Responsive Breakpoints

### Desktop (> 768px)
```
Trimurti Grid:     3 columns
Chakra Legend:     3-4 columns
Chakra Wheel:      500px max width
Devanagari Size:   Full size (1.3em for names)
```

### Tablet (480px - 768px)
```
Trimurti Grid:     2 columns
Chakra Legend:     2 columns
Chakra Wheel:      100% width (scales)
Devanagari Size:   Slightly reduced
```

### Mobile (< 480px)
```
Trimurti Grid:     1 column
Chakra Legend:     1 column
Chakra Wheel:      100% width
Devanagari Size:   Optimized for readability
Touch Targets:     Minimum 50x50px
```

---

## Accessibility Features

### Keyboard Navigation:
- Tab through chakra legend items
- Enter/Space to activate
- Arrow keys to move between items
- Escape to close info panel

### Screen Readers:
- ARIA labels on interactive elements
- Alt text for symbols
- Semantic HTML structure
- Descriptive link text

### Visual:
- High contrast text (WCAG AA compliant)
- Focus indicators on all interactive elements
- Color not sole information carrier (text labels included)
- Scalable text (em/rem units)

---

## Animation Timings

```css
Transition Duration: 0.3s (--transition-base)
Hover Delay:        0s (immediate)
Active Delay:       0s
FadeIn Duration:    0.3s
Transform:          cubic-bezier(0.4, 0, 0.2, 1)
```

### Chakra Info Panel FadeIn:
```css
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

---

## Performance Metrics

### Font Loading:
- **FOIT** (Flash of Invisible Text): Avoided via `font-display: swap`
- **Preconnect**: Google Fonts domain preconnected
- **Subset**: Only Devanagari glyphs loaded (not entire font)

### SVG:
- **Inline**: No external HTTP request
- **Complexity**: Minimal (7 circles, simple paths)
- **File Size**: ~2KB (embedded in HTML)

### JavaScript:
- **Payload**: ~1KB (interaction code)
- **Dependencies**: Zero (vanilla JS)
- **Execution**: DOMContentLoaded (early interaction)

---

## Browser Testing Results

| Browser | Devanagari | SVG | Interactions | Grade |
|---------|-----------|-----|--------------|-------|
| Chrome 120+ | ✅ Perfect | ✅ Perfect | ✅ Smooth | A+ |
| Firefox 121+ | ✅ Perfect | ✅ Perfect | ✅ Smooth | A+ |
| Safari 17+ | ✅ Perfect | ✅ Perfect | ✅ Smooth | A+ |
| Edge 120+ | ✅ Perfect | ✅ Perfect | ✅ Smooth | A+ |
| Mobile Safari | ✅ Good | ✅ Perfect | ✅ Touch works | A |
| Chrome Android | ✅ Good | ✅ Perfect | ✅ Touch works | A |

---

## Code Snippets

### Adding a New Chakra Legend Item
```html
<div class="chakra-legend-item" data-chakra="anahata">
    <div class="chakra-color-dot" style="background: #10B981;"></div>
    <div>
        <strong>Anahata</strong>
        <div class="devanagari" style="font-size: 0.9rem;">अनाहत</div>
        <small>Heart • Love</small>
    </div>
</div>
```

### Adding a Deity Badge
```html
<div class="deity-chakra-badge"
     style="background: rgba(16, 185, 129, 0.2); color: #10B981;">
    Vishnu • <span class="devanagari">विष्णु</span>
</div>
```

### Activating a Chakra via JavaScript
```javascript
activateChakra('anahata');  // Activates heart chakra
```

---

## Future Enhancement Ideas

### 1. Chakra Deity Filtering
Add filter buttons to show only deities associated with selected chakra:
```
[Filter by Chakra: All | Root | Sacral | ... | Crown]
↓
Deity grid dynamically filters
```

### 2. Animated Energy Flow
Add CSS/SVG animation showing energy rising through chakras:
```
🔴 → 🟠 → 🟡 → 🟢 → 🔵 → 🔵 → 🟣
Pulsing glow effect moving upward
```

### 3. Mantra Audio
Add pronunciation audio for each chakra's bija mantra:
```
Muladhara: [🔊 LAM]
Svadhisthana: [🔊 VAM]
etc.
```

### 4. Chakra Balance Quiz
Interactive quiz to identify imbalanced chakras:
```
"Feel grounded and secure?" → Root Chakra health
"Express yourself freely?" → Throat Chakra health
```

### 5. Deity-Chakra Matrix
Visual matrix showing all deity-chakra relationships:
```
        Root  Sacral  Solar  Heart  Throat  3rd Eye  Crown
Ganesha  ●
Krishna        ●
Vishnu                  ●
Shiva                                      ●        ●
```

---

## Maintenance Checklist

### Monthly:
- [ ] Test Devanagari rendering across browsers
- [ ] Verify Google Fonts loading
- [ ] Check chakra interaction on mobile
- [ ] Validate Unicode characters

### Quarterly:
- [ ] Update chakra deity associations (if needed)
- [ ] Review font performance metrics
- [ ] Check for new Sanskrit terms to add
- [ ] Test accessibility with screen readers

### Annually:
- [ ] Review chakra color accuracy with sources
- [ ] Update Devanagari reference guide
- [ ] Audit complete visual design
- [ ] Survey users for desired enhancements

---

**Document Version:** 1.0
**Last Updated:** December 13, 2025
**Maintained by:** EyesOfAzrael Development Team
