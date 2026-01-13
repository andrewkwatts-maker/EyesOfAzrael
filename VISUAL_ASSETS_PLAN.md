# Visual Assets Planning - Eyes of Azrael

## Current State

### Icon Usage Audit (2026-01-11)

| Metric | Value |
|--------|-------|
| Assets with icons | 9,779 |
| Assets without icons | 147 |
| Unique icons | 704 |
| Primary format | Emoji (98%) |

### Current Icon Types

1. **Emoji Icons** (98% of assets)
   - Deities: ⚡ (thunder), 🌊 (sea), 💀 (death), ☀️ (sun)
   - Creatures: 🐉 (dragons), 🦅 (eagles), 🐍 (serpents), 🦁 (lions)
   - Items: ⚔️ (weapons), 🏆 (treasures), 📜 (texts), 🔮 (magic)
   - Places: ⛰️ (mountains), 🌳 (groves), 🏛️ (temples)

2. **SVG Icons** (<1% of assets)
   - Some mythology hubs have custom SVG icons
   - Format: Inline SVG with viewBox="0 0 64 64"

3. **Missing Icons** (147 assets)
   - Primarily obscure concepts and minor entities

---

## Phase 1: Icon Standardization

### Problem
- No consistent icon vocabulary
- Same concept uses different emojis across mythologies
- SVG icons are inline (bloated JSON)

### Solution

Create `icons/emoji-mappings.json`:

```json
{
  "domains": {
    "sky": "⛈️",
    "thunder": "⚡",
    "war": "⚔️",
    "love": "❤️",
    "death": "💀",
    "sun": "☀️",
    "moon": "🌙",
    "sea": "🌊",
    "earth": "🌍",
    "wisdom": "📚",
    "fire": "🔥",
    "fertility": "🌱"
  },
  "categories": {
    "deities": "👑",
    "heroes": "🦸",
    "creatures": "🐲",
    "items": "✨",
    "places": "🏛️",
    "texts": "📜",
    "rituals": "🕯️",
    "herbs": "🌿",
    "symbols": "☯️"
  }
}
```

**Script**: `scripts/standardize-icons.js`
- Map domains to consistent emoji
- Fill missing icons based on domain/category
- Replace inline SVG with references

---

## Phase 2: Image Asset Structure

### Schema Addition

```json
{
  "media": {
    "icon": "⚡",
    "thumbnail": "/images/deities/zeus-thumb.webp",
    "primaryImage": "/images/deities/zeus-primary.webp",
    "gallery": [
      {
        "url": "/images/deities/zeus-lightning.webp",
        "caption": "Zeus wielding thunderbolt",
        "source": "Public domain artwork"
      }
    ],
    "attribution": {
      "source": "Wikimedia Commons",
      "license": "Public Domain",
      "author": "Unknown"
    }
  }
}
```

### Directory Structure

```
images/
├── deities/
│   ├── greek/
│   │   ├── zeus-primary.webp
│   │   ├── zeus-thumb.webp
│   │   └── zeus-gallery/
│   ├── norse/
│   ├── egyptian/
│   └── ...
├── creatures/
├── items/
├── places/
└── _templates/
    ├── deity-card.svg
    └── creature-card.svg
```

---

## Phase 3: Image Sources (Research)

### Recommended Sources

| Source | License | Quality | Coverage |
|--------|---------|---------|----------|
| **Wikimedia Commons** | Mixed (mostly PD) | High | Excellent |
| **Metropolitan Museum** | CC0 | Very High | Greek/Egyptian |
| **British Museum** | CC BY-NC-SA | Very High | Global |
| **AI Generation** | Custom | Variable | Full |

### Priority by Category

1. **Major Deities** (100 most viewed)
   - Greek: Zeus, Athena, Apollo, Hades, Poseidon
   - Norse: Odin, Thor, Freya, Loki
   - Egyptian: Ra, Osiris, Isis, Anubis
   - Hindu: Shiva, Vishnu, Brahma, Ganesha

2. **Popular Creatures** (Top 50)
   - Dragons, Phoenixes, Minotaur, Cerberus
   - Kraken, Hydra, Griffin, Chimera

3. **Iconic Items** (Top 30)
   - Mjolnir, Excalibur, Holy Grail
   - Trident, Caduceus, Ankh

### Image Requirements

| Type | Size | Format | Quality |
|------|------|--------|---------|
| Thumbnail | 150x150 | WebP | 80% |
| Primary | 800x600 | WebP | 85% |
| Gallery | 1200x900 | WebP | 90% |
| Hero | 1920x1080 | WebP | 95% |

---

## Phase 4: Implementation Approach

### Option A: CDN-Hosted Images
- Store images on Firebase Storage or Cloudflare Images
- Benefits: Fast, scalable, cached globally
- Cost: ~$5-20/month for moderate traffic

### Option B: Git LFS
- Store images in repository with Git LFS
- Benefits: Version controlled, no extra cost
- Limit: 1GB free storage

### Option C: External References
- Link to public domain sources (Wikimedia, museums)
- Benefits: Zero storage cost
- Risk: Links may break, variable quality

### Recommended: Hybrid Approach
1. Store thumbnails locally (small, critical for UX)
2. Use CDN for primary/gallery images
3. Reference external sources with fallbacks

---

## Phase 5: Placeholder System

Until images are acquired, implement:

### Color-Coded Category Placeholders

```javascript
const categoryColors = {
  deities: { bg: '#4A90D9', accent: '#FFD700' },
  heroes: { bg: '#CD7F32', accent: '#FFFFFF' },
  creatures: { bg: '#2E8B57', accent: '#90EE90' },
  items: { bg: '#8B4513', accent: '#DAA520' },
  places: { bg: '#4169E1', accent: '#87CEEB' }
};
```

### SVG Placeholder Generator

```javascript
function generatePlaceholder(entity) {
  const color = categoryColors[entity.category];
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${color.bg}"/>
      <text x="100" y="90" text-anchor="middle" font-size="60">${entity.icon}</text>
      <text x="100" y="140" text-anchor="middle" font-size="14" fill="${color.accent}">
        ${entity.name}
      </text>
    </svg>
  `;
}
```

---

## Action Items

### Immediate (Phase 1)
- [ ] Create `icons/emoji-mappings.json`
- [ ] Create `scripts/standardize-icons.js`
- [ ] Fill 147 missing icons
- [ ] Remove inline SVG icons

### Short-term (Phase 2-3)
- [ ] Add `media` field to schema
- [ ] Curate 100 priority images from public domain
- [ ] Set up Firebase Storage bucket
- [ ] Create image upload pipeline

### Medium-term (Phase 4-5)
- [ ] Implement placeholder SVG generator
- [ ] Add thumbnail support to renderers
- [ ] Create gallery component for asset detail view

---

## Notes

### Current Emoji Coverage by Category

| Category | Has Icon | Missing | Coverage |
|----------|----------|---------|----------|
| Deities | 1,708 | 6 | 99.6% |
| Heroes | 815 | 2 | 99.8% |
| Creatures | 1,050 | 5 | 99.5% |
| Items | 680 | 6 | 99.1% |
| Places | 500 | 5 | 99.0% |
| Concepts | 5,000 | 120 | 97.6% |

### Icon Conventions

- Use single emoji per asset (no combinations)
- Prefer universal/neutral emoji over cultural-specific
- Fallback hierarchy: domain icon → category icon → ✨

---

**Document created**: 2026-01-11
**Status**: Planning complete, ready for implementation
