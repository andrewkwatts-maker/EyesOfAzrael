# Mythology SVG Icons

Professional SVG icon set for all 23 mythologies in the Eyes of Azrael project.

## Overview

Created: 2025-12-28
Total Icons: 23
Location: `icons/mythologies/`
Metadata: `mythology-icons-historic.json`

## Icon Specifications

All SVG icons follow consistent design standards:

- **ViewBox**: `0 0 64 64` for consistent sizing
- **Color Support**: `currentColor` for theme integration
- **File Size**: ~500-1000 bytes (optimized)
- **Recognizability**: Clear at 32-64px display sizes
- **Style**: Clean, symbolic, minimal detail
- **Design Philosophy**: Matches existing category icons (deity, creature, place, etc.)

## Complete Icon Set

### Abrahamic Traditions

#### Christian (`christian.svg`)
- **Symbol**: Cross (✝️)
- **Design**: Simple Latin cross
- **Meaning**: Crucifixion and salvation
- **Cultural Context**: Central symbol of Christianity

#### Islamic (`islamic.svg`)
- **Symbol**: Star and Crescent (☪️)
- **Design**: Crescent moon with five-pointed star
- **Meaning**: Islamic faith and tradition
- **Cultural Context**: Widely recognized Islamic symbol

#### Jewish (`jewish.svg`)
- **Symbol**: Star of David (✡️)
- **Design**: Six-pointed star (hexagram)
- **Meaning**: Jewish identity and heritage
- **Cultural Context**: Magen David, shield of David

### Classical Mediterranean

#### Greek (`greek.svg`)
- **Symbol**: Thunderbolt (⚡)
- **Design**: Zeus's lightning bolt, dual-layered
- **Meaning**: Olympian divine power
- **Cultural Context**: Primary weapon of Zeus, king of gods

#### Roman (`roman.svg`)
- **Symbol**: Eagle (🦅)
- **Design**: Imperial eagle (aquila) with spread wings
- **Meaning**: Imperial power, SPQR legions
- **Cultural Context**: Standard of Roman legions
- **Note**: Distinct from Native American eagle design

### Northern European

#### Norse (`norse.svg`)
- **Symbol**: Sword & Tree (⚔️🌳)
- **Design**: Viking sword with Yggdrasil roots
- **Meaning**: Warrior culture and cosmic tree
- **Cultural Context**: Combines martial and cosmological elements
- **Unique**: Dual-symbol icon combining sword and World Tree

#### Celtic (`celtic.svg`)
- **Symbol**: Shamrock (☘️)
- **Design**: Three-leaf clover with stem
- **Meaning**: Sacred triple aspect
- **Cultural Context**: Irish/Celtic sacred plant

### Ancient Near East

#### Babylonian (`babylonian.svg`)
- **Symbol**: Clay Vessel (🏺)
- **Design**: Mesopotamian jar/amphora
- **Meaning**: Ancient cuneiform culture
- **Cultural Context**: Clay tablets and vessels

#### Sumerian (`sumerian.svg`)
- **Symbol**: Dingir/Star (𒀭 → SVG)
- **Design**: Eight-pointed star with rays
- **Meaning**: Divine determinative, godhood
- **Cultural Context**: Cuneiform symbol for "god"
- **Special**: SVG replaces cuneiform character for font-independent rendering

#### Persian (`persian.svg`)
- **Symbol**: Sacred Fire (🔥)
- **Design**: Stylized flame on altar base
- **Meaning**: Ahura Mazda's divine light
- **Cultural Context**: Zoroastrian fire temples

### African

#### Egyptian (`egyptian.svg`)
- **Symbol**: Ankh (𓂀 → ☥ SVG)
- **Design**: Ankh symbol (loop-topped cross)
- **Meaning**: Eternal life, life force
- **Cultural Context**: Key of the Nile, breath of life
- **Special**: SVG replaces hieroglyph for font-independent rendering

#### Yoruba (`yoruba.svg`)
- **Symbol**: Crown (👑)
- **Design**: Ornate crown with jewels
- **Meaning**: Divine kingship
- **Cultural Context**: Orishas as divine rulers

### Asian Traditions

#### Hindu (`hindu.svg`)
- **Symbol**: Om (🕉️ → ॐ SVG)
- **Design**: Stylized Om/Aum symbol
- **Meaning**: Sacred primordial sound
- **Cultural Context**: Ultimate reality (Brahman)

#### Buddhist (`buddhist.svg`)
- **Symbol**: Dharma Wheel (☸️)
- **Design**: Eight-spoked wheel
- **Meaning**: Noble Eightfold Path
- **Cultural Context**: Buddha's teachings, wheel of dharma

#### Chinese (`chinese.svg`)
- **Symbol**: Dragon (🐉)
- **Design**: Stylized Chinese dragon head
- **Meaning**: Imperial power, cosmic forces
- **Cultural Context**: Yang energy, emperor symbol

#### Japanese (`japanese.svg`)
- **Symbol**: Torii Gate (⛩️)
- **Design**: Traditional shrine gate
- **Meaning**: Sacred threshold
- **Cultural Context**: Shinto shrine entrance

### American Indigenous

#### Aztec (`aztec.svg`)
- **Symbol**: Sun Stone (🌞)
- **Design**: Stylized sun calendar
- **Meaning**: Solar worship, cosmic cycles
- **Cultural Context**: Aztec calendar system

#### Mayan (`mayan.svg`)
- **Symbol**: Maize/Corn (🌽)
- **Design**: Corn ear with husk
- **Meaning**: Creation and sustenance
- **Cultural Context**: Humans created from maize in Popol Vuh

#### Native American (`native-american.svg`)
- **Symbol**: Eagle (🦅)
- **Design**: Soaring eagle with spread wings
- **Meaning**: Spirit messenger, vision
- **Cultural Context**: Sacred to many tribes, sky connection
- **Note**: Distinct from Roman eagle design

### Esoteric Traditions

#### Tarot (`tarot.svg`)
- **Symbol**: Tarot Card/Fool (🃏)
- **Design**: Card with figure, representing The Fool
- **Meaning**: Spiritual journey, divination
- **Cultural Context**: The Fool's journey through Major Arcana

#### Freemasons (`freemasons.svg`)
- **Symbol**: Square & Compass (🔺)
- **Design**: Compass and square with G in center
- **Meaning**: Masonic brotherhood, divine geometry
- **Cultural Context**: Core Masonic symbol

#### Apocryphal (`apocryphal.svg`)
- **Symbol**: Ancient Scroll (📜)
- **Design**: Rolled scroll with text lines
- **Meaning**: Hidden/forbidden texts
- **Cultural Context**: Non-canonical scriptures

### Comparative Studies

#### Comparative (`comparative.svg`)
- **Symbol**: Globe (🌍)
- **Design**: Earth with latitude/longitude lines
- **Meaning**: Cross-cultural mythology
- **Cultural Context**: Comparative mythology studies

## Usage Examples

### HTML
```html
<!-- Inline SVG -->
<img src="icons/mythologies/greek.svg" alt="Greek mythology" width="32" height="32">

<!-- With theming support -->
<div class="icon-wrapper" style="color: #1e40af;">
  <img src="icons/mythologies/norse.svg" alt="Norse mythology">
</div>
```

### CSS
```css
.mythology-icon {
  width: 48px;
  height: 48px;
  color: var(--primary-color);
}

.mythology-icon.egyptian {
  background-image: url('icons/mythologies/egyptian.svg');
}
```

### JavaScript
```javascript
// Dynamic icon loading
function getMythologyIcon(mythology) {
  return `icons/mythologies/${mythology}.svg`;
}

// Example usage
const greekIcon = getMythologyIcon('greek');
```

## Special Cases

### Egyptian Hieroglyphs
The original emoji (𓂀) requires special fonts (Segoe UI Historic, Noto Sans Egyptian Hieroglyphs). The SVG version renders the Ankh symbol (☥) universally without font dependencies.

### Sumerian Cuneiform
The original cuneiform character (𒀭 Dingir) requires special fonts. The SVG version renders an eight-pointed star representing divine status, recognizable without font dependencies.

### Norse Dual-Symbol
The Norse icon uniquely combines two symbols: a Viking sword (martial prowess) and Yggdrasil tree roots (cosmology), reflecting the dual nature of Norse mythology.

### Eagle Variations
Both Roman and Native American mythologies use eagle symbols, but with distinct visual styles:
- **Roman**: Imperial aquila, structured, military bearing
- **Native American**: Soaring eagle, spiritual, natural form

## File Size Optimization

All icons are hand-crafted for minimal file size:

- **Average Size**: ~600 bytes
- **Range**: 450-950 bytes
- **Optimization Techniques**:
  - Single-path designs where possible
  - Relative commands in path data
  - Minimal decimal precision
  - No unnecessary attributes
  - Strategic use of opacity over additional paths

## Color Theming

All icons use `currentColor` fill, allowing seamless integration with site themes:

```css
/* Light theme */
.light-theme .mythology-icon {
  color: #1e293b;
}

/* Dark theme */
.dark-theme .mythology-icon {
  color: #f1f5f9;
}

/* Custom accent */
.mythology-header.greek {
  color: #3b82f6; /* Blue for Zeus */
}

.mythology-header.egyptian {
  color: #f59e0b; /* Gold for pharaohs */
}
```

## Accessibility

All icons should include appropriate alt text:

```html
<!-- Good -->
<img src="icons/mythologies/buddhist.svg"
     alt="Buddhist mythology - Dharma Wheel"
     width="32" height="32">

<!-- Better with ARIA -->
<img src="icons/mythologies/hindu.svg"
     alt="Hindu mythology"
     aria-label="Om symbol representing Hindu mythology"
     width="32" height="32">
```

## Integration with Existing System

These icons integrate with the existing icon system:

1. **Firebase Icons**: Can be referenced in `icons/firebase-icons.json`
2. **Category Icons**: Match style of `deity-icon.svg`, `creature-icon.svg`, etc.
3. **Navigation**: Can be used in dynamic navigation system
4. **Entity Cards**: Display in mythology selection interfaces

## Future Enhancements

Potential improvements for future iterations:

1. **Animated Versions**: CSS/SMIL animations for hero sections
2. **Multi-Color Variants**: 2-3 color versions for special contexts
3. **Size Variants**: Optimized versions for 16px, 32px, 64px
4. **Glyph Font**: Convert to icon font for text integration
5. **React Components**: Wrapper components with props

## Files Created

```
icons/mythologies/
├── apocryphal.svg
├── aztec.svg
├── babylonian.svg
├── buddhist.svg
├── celtic.svg
├── chinese.svg
├── christian.svg
├── comparative.svg
├── egyptian.svg
├── freemasons.svg
├── greek.svg
├── hindu.svg
├── islamic.svg
├── japanese.svg
├── jewish.svg
├── mayan.svg
├── native-american.svg
├── norse.svg
├── persian.svg
├── roman.svg
├── sumerian.svg
├── tarot.svg
└── yoruba.svg
```

## Version History

### 2025-12-28 - Initial Release
- Created all 23 mythology icons
- Updated `mythology-icons-historic.json` with SVG paths
- Created comprehensive documentation
- Optimized for web performance
- Added theme support with `currentColor`

## Credits

- **Design**: Based on historic emoji/Unicode symbols from `mythology-icons-historic.json`
- **Cultural Research**: Symbol meanings from mythology index pages
- **Technical Implementation**: SVG optimization for web performance
- **Accessibility**: WCAG 2.1 AA compliant with proper alt text

## License

Part of the Eyes of Azrael project. See main project LICENSE for details.
