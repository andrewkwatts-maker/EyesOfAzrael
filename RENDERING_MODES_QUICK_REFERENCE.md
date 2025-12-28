# Rendering Modes - Quick Reference Guide

## 5 Universal Rendering Modes

Every asset type in Eyes of Azrael supports ALL 5 rendering modes:

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDERING MODES                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📄 PAGE      → Full detailed entity page                  │
│  🎴 PANEL     → Grid card for galleries                    │
│  📋 SECTION   → Embedded content block                     │
│  🔗 LINK      → Cross-reference navigation                 │
│  📝 PARAGRAPH → Inline text mention                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Mode Comparison Chart

| Mode | Detail Level | Use Case | HTML Class | Renderer |
|------|-------------|----------|------------|----------|
| **PAGE** | ⭐⭐⭐⭐⭐ | Dedicated pages | `.hero-section` | `renderDeity()` etc |
| **PANEL** | ⭐⭐⭐ | Index/Gallery | `.entity-card` | `renderRelatedEntitiesGrid()` |
| **SECTION** | ⭐⭐⭐⭐ | Embedded content | `.glass-card` | Custom |
| **LINK** | ⭐ | Navigation | `.corpus-link` | N/A |
| **PARAGRAPH** | ⭐ | Inline mention | `.inline-mention` | N/A |

---

## Visual Examples

### PAGE Mode
```
┌────────────────────────────────────────┐
│         🌟 LARGE ICON 🌟              │
│                                        │
│              ZEUS                      │
│      King of the Gods                 │
│                                        │
│  Supreme ruler of Mount Olympus...    │
│                                        │
├────────────────────────────────────────┤
│         ATTRIBUTES & DOMAINS           │
│                                        │
│  ┌──────────┐  ┌──────────┐          │
│  │ Titles   │  │ Domains  │          │
│  │ King of  │  │ Sky      │          │
│  │ Gods     │  │ Thunder  │          │
│  └──────────┘  └──────────┘          │
│                                        │
├────────────────────────────────────────┤
│         MYTHOLOGY & STORIES            │
│         RELATIONSHIPS                  │
│         WORSHIP & RITUALS              │
└────────────────────────────────────────┘
```

### PANEL Mode
```
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│  ⚡  │  │  🌊  │  │  ☠️  │  │  👑  │
│      │  │      │  │      │  │      │
│ Zeus │  │Posdn │  │Hades │  │ Hera │
│ King │  │ Sea  │  │Death │  │Queen │
└──────┘  └──────┘  └──────┘  └──────┘
```

### SECTION Mode
```
┌────────────────────────────────────────┐
│  ⚡ Zeus                               │
│                                        │
│  Role: King of the Gods               │
│  Domains: Sky, Thunder, Law           │
│  Mythology: Greek                     │
│                                        │
│  Zeus is the supreme ruler...         │
└────────────────────────────────────────┘
```

### LINK Mode
```
The supreme ruler is [Zeus], who commands...
                      ^^^^^^
                    (clickable)
```

### PARAGRAPH Mode
```
In Greek mythology, Zeus overthrew his father...
                    ^^^^
                  (styled)
```

---

## Asset Type Coverage

```
DEITIES       ✓✓✓✓✓  (All 5 modes)
HEROES        ✓✓✓✓✓
CREATURES     ✓✓✓✓✓
ITEMS         ✓✓✓✓✓
PLACES        ✓✓✓✓✓
HERBS         ✓✓✓✓✓
RITUALS       ✓✓✓✓✓
TEXTS         ✓✓✓✓✓
SYMBOLS       ✓✓✓✓✓
MAGIC         ✓✓✓✓✓
MYTHOLOGIES   ✓✓✓✓✓
ARCHETYPES    ✓✓✓✓✓
PAGES         ✓✓✓✓✓
──────────────────────
13 types × 5 modes = 65 combinations ✓
```

---

## When to Use Each Mode

### Use PAGE when:
- ✓ Creating dedicated entity page
- ✓ Maximum detail needed
- ✓ Primary information source
- ✓ Educational content

### Use PANEL when:
- ✓ Building index/browse pages
- ✓ Showing multiple entities
- ✓ Gallery/collection view
- ✓ Quick scanning needed

### Use SECTION when:
- ✓ Embedding in another page
- ✓ Related content display
- ✓ Contextual information
- ✓ Comparative analysis

### Use LINK when:
- ✓ Cross-referencing entities
- ✓ Building navigation
- ✓ Text-based connections
- ✓ Tooltip previews

### Use PARAGRAPH when:
- ✓ Natural text flow
- ✓ Narrative content
- ✓ Inline mentions
- ✓ Subtle highlighting

---

## Code Snippets

### PAGE Mode
```javascript
const renderer = new FirebaseEntityRenderer();
await renderer.loadAndRender('deity', 'zeus', 'greek', container);
```

### PANEL Mode
```javascript
const html = renderRelatedEntitiesGrid(entities, {
  mode: 'grid',
  columns: 4,
  showIcons: true
});
```

### SECTION Mode
```html
<div class="glass-card">
  <h3>⚡ Zeus</h3>
  <p><strong>Role:</strong> King of Gods</p>
  <p>Description...</p>
</div>
```

### LINK Mode
```html
<a class="corpus-link" href="mythos/greek/deities/zeus.html">Zeus</a>
```

### PARAGRAPH Mode
```html
<p>The king <span class="inline-mention">Zeus</span> ruled...</p>
```

---

## Styling Variables

```css
/* Mythology-specific colors */
[data-mythology="greek"] {
  --mythos-primary: #1e90ff;
  --mythos-secondary: #ffd700;
}

/* Component classes */
.hero-section { /* PAGE hero */ }
.entity-card { /* PANEL card */ }
.glass-card { /* SECTION container */ }
.corpus-link { /* LINK styling */ }
.inline-mention { /* PARAGRAPH highlight */ }
```

---

## Quick Tips

💡 **Mix Modes:** Combine modes on same page for rich experience

💡 **Context Matters:** Choose mode based on user's current task

💡 **Consistency:** Use same mode for similar content types

�� **Performance:** LINK and PARAGRAPH have minimal overhead

💡 **Accessibility:** All modes support keyboard navigation

---

## Testing

**Live Demo:** Open `test-asset-rendering.html`

**Visual Proof:** See all modes side-by-side for each asset type

**Code Examples:** Copy-paste ready snippets included

**JSON Samples:** Complete data structures provided

---

## Support Matrix Summary

```
┌────────────┬──────┬───────┬─────────┬──────┬───────────┐
│ Asset Type │ PAGE │ PANEL │ SECTION │ LINK │ PARAGRAPH │
├────────────┼──────┼───────┼─────────┼──────┼───────────┤
│ Deities    │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Heroes     │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Creatures  │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Items      │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Places     │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Herbs      │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Rituals    │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Texts      │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Symbols    │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Magic      │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Mythology  │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Archetypes │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
│ Pages      │  ✓   │   ✓   │    ✓    │  ✓   │     ✓     │
└────────────┴──────┴───────┴─────────┴──────┴───────────┘

                  100% COVERAGE ✓
```

---

**Last Updated:** 2025-12-28
**Test Page:** `test-asset-rendering.html`
**Full Documentation:** `ASSET_RENDERING_SUMMARY.md`
