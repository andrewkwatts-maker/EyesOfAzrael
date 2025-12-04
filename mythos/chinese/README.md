# Chinese Mythology Section

Welcome to the **Chinese Mythology** section of the Eyes of Azrael mythology explorer.

## Overview

This section comprehensively covers Chinese mythology, cosmology, and spiritual traditions spanning over 4,000 years of cultural development. It integrates Taoist, Buddhist, and Confucian perspectives into a unified exploration of the Chinese mythological worldview.

## Contents

### 📚 Main Sections

- **[Main Index](index.html)** - Landing page with overview of Chinese mythology
- **[Deities](deities/index.html)** - The Celestial Bureaucracy and divine hierarchy
- **[Cosmology](cosmology/index.html)** - Structure of reality, Yin-Yang, Wu Xing (Five Elements)
- **[Heroes](heroes/index.html)** - Legendary figures and immortals
- **[Creatures](creatures/index.html)** - Mythical beasts (dragons, phoenix, qilin)
- **[Herbs](herbs/index.html)** - Sacred plants and alchemical ingredients
- **[Rituals](rituals/index.html)** - Ceremonies, festivals, and worship practices
- **[Magic](magic/index.html)** - Taoist alchemy, feng shui, talismans
- **[Path](path/index.html)** - Spiritual cultivation and path to immortality
- **[Texts](texts/index.html)** - Sacred literature (I Ching, Tao Te Ching, etc.)
- **[Symbols](symbols/index.html)** - Yin-Yang, Bagua, sacred geometry

### 🏮 Featured Deities

| Deity | Title | Page |
|-------|-------|------|
| **Jade Emperor** (玉皇大帝) | Supreme Ruler of Heaven | [jade-emperor.html](deities/jade-emperor.html) |
| **Guanyin** (觀音) | Goddess of Mercy | [guanyin.html](deities/guanyin.html) |
| **Guan Yu** (關羽) | God of War | [guan-yu.html](deities/guan-yu.html) |
| **Xi Wangmu** (西王母) | Queen Mother of the West | [xi-wangmu.html](deities/xi-wangmu.html) |
| **Dragon Kings** (龍王) | Rulers of the Seas | [dragon-kings.html](deities/dragon-kings.html) |
| **Nezha** (哪吒) | Lotus Prince | [nezha.html](deities/nezha.html) |
| **Erlang Shen** (二郎神) | Third Eye Warrior | [erlang-shen.html](deities/erlang-shen.html) |
| **Zao Jun** (灶神) | Kitchen God | [zao-jun.html](deities/zao-jun.html) |

## Features

### 🎨 Modern Design
- Glass morphism card design
- Theme picker with multiple color schemes
- Responsive layout for all devices
- Unicode emoji icons (☯️, 🐉, 🙏, etc.)

### 🔗 Cross-Cultural Connections
Extensive interlinking to parallel figures in other mythologies:
- **Jade Emperor** ↔ Zeus (Greek), Odin (Norse), Indra (Hindu)
- **Guanyin** ↔ Avalokiteshvara (Buddhist), Mary (Christian)
- **Guan Yu** ↔ Ares (Greek), Mars (Roman), Tyr (Norse)
- **Pangu** ↔ Ymir (Norse), Purusha (Hindu)

### 📖 Corpus Integration
Smart links to ancient text corpus for scholarly research and primary source verification.

## Technical Details

### File Structure
```
chinese/
├── index.html                 # Main landing page
├── corpus-search.html         # Text corpus search
├── deities/                   # 8 detailed deity pages
├── cosmology/                 # Creation, afterlife, structure
├── heroes/                    # Legendary figures
├── creatures/                 # Mythical beasts
├── herbs/                     # Sacred plants
├── rituals/                   # Ceremonies
├── magic/                     # Practices and alchemy
├── path/                      # Spiritual cultivation
├── texts/                     # Sacred literature
└── symbols/                   # Sacred geometry
```

### Audit Scripts

Automated maintenance scripts are available in this directory:

- `audit-broken-links-v2.js` - Check for broken internal links
- `audit-styles.js` - Verify CSS/JS imports and modern features
- `audit-completeness.js` - Ensure all expected pages exist
- `audit-cross-links.js` - Analyze cross-mythology connections
- `audit-ascii-art.js` - Detect old ASCII diagrams
- `run-all-audits.js` - Master script running all audits

**Usage:**
```bash
cd mythos/chinese
node run-all-audits.js
```

### Current Status

| Metric | Status | Score |
|--------|--------|-------|
| Broken Links | ✅ PASS | 0/191 broken |
| Style Imports | ✅ PASS | 22/22 complete |
| Page Completeness | ✅ PASS | 22/22 exist |
| Cross-Mythology Links | ✅ EXCELLENT | Extensive |
| Overall Health | ✅ EXCELLENT | 98/100 |

**Last Audited:** December 3, 2025
**Status:** PRODUCTION READY ✅

## Development Guidelines

### Adding New Deity Pages

1. Create HTML file in `deities/` directory
2. Follow template from `jade-emperor.html` or `guanyin.html`
3. Include required imports:
   ```html
   <link href="../../../themes/theme-base.css" rel="stylesheet"/>
   <link href="../../../styles.css" rel="stylesheet"/>
   <link href="../../../themes/corpus-links.css" rel="stylesheet"/>
   <link rel="stylesheet" href="../../../themes/smart-links.css">
   <script defer src="../../../themes/smart-links.js"></script>
   <script defer src="../../../themes/theme-animations.js"></script>
   <script defer src="../../../themes/theme-picker.js"></script>
   ```
4. Add to `deities/index.html` deity grid
5. Add cross-cultural parallels section
6. Run audits to verify

### Style Requirements

All pages must include:
- ✅ Glass morphism cards (`.glass-card`)
- ✅ Hero section with icon (`.hero-section`, `.hero-icon-display`)
- ✅ Breadcrumb navigation (`.breadcrumb`)
- ✅ Theme picker container (`#theme-picker-container`)
- ✅ Corpus link integration (`.corpus-link`)
- ✅ Smart links for cross-references (`data-smart="chinese"`)

### Content Standards

- Provide Chinese characters with pinyin romanization
- Include accurate mythology references
- Link to primary source texts
- Add cross-cultural comparisons
- Use proper deity titles and epithets
- Cite Journey to the West, I Ching, etc. where applicable

## Future Work

### High Priority
- [ ] God of Wealth (財神) deity page
- [ ] Lei Gong (雷公) Thunder God page
- [ ] Mazu (媽祖) Sea Goddess page

### Medium Priority
- [ ] Expand cosmology: Sacred Mountains detail page
- [ ] Dragon Lines / Feng Shui cosmology page
- [ ] Immortal Realms (Penglai, Kunlun) pages
- [ ] Add SVG diagrams for Yin-Yang cycle, Wu Xing

### Low Priority
- [ ] Individual Eight Immortals pages
- [ ] Three Pure Ones individual pages
- [ ] Four Heavenly Kings pages
- [ ] Ritual calendar detail page

## Contributing

When adding or modifying content:

1. **Read existing pages** for style consistency
2. **Run audit scripts** before committing
3. **Test cross-links** to ensure they resolve correctly
4. **Verify mobile responsiveness** on different screen sizes
5. **Add corpus links** where appropriate for scholarly depth

## Resources

### Primary Sources
- I Ching (易經) - Book of Changes
- Tao Te Ching (道德經) - Laozi's classic
- Shan Hai Jing (山海經) - Classic of Mountains and Seas
- Journey to the West (西遊記) - Wu Cheng'en
- Fengshen Yanyi (封神演義) - Investiture of the Gods

### Cross-References
- [Main Mythos Index](../../mythos/index.html)
- [Greek Mythology](../greek/index.html)
- [Norse Mythology](../norse/index.html)
- [Hindu Mythology](../hindu/index.html)
- [Buddhist Mythology](../buddhist/index.html)

## License

Part of the Eyes of Azrael project. All content respects cultural and religious sensitivities while providing educational material on world mythology.

---

**Maintainer:** Eyes of Azrael Development Team
**Last Updated:** December 3, 2025
**Section Health:** 98/100 ✅ EXCELLENT
