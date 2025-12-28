# Deity Domain Icon System

A comprehensive SVG icon set for deity domains that works across all mythologies in the Eyes of Azrael project.

## Overview

The Deity Domain Icon System provides 15 symbolic, universal icons representing common deity domains found across world mythologies. These icons automatically enhance deity pages by providing visual context for divine domains and responsibilities.

## Icon Categories

### 1. War/Battle (`war.svg`)
- **Symbol**: Crossed swords with shield
- **Domains**: war, battle, combat, warrior
- **Examples**: Ares, Mars, Thor, Huitzilopochtli, Tyr

### 2. Wisdom/Knowledge (`wisdom.svg`)
- **Symbol**: Owl with book
- **Domains**: wisdom, knowledge, learning, intelligence
- **Examples**: Athena, Minerva, Thoth, Saraswati, Nabu

### 3. Love/Beauty (`love.svg`)
- **Symbol**: Heart with sparkles
- **Domains**: love, beauty, desire, romance
- **Examples**: Aphrodite, Venus, Freya, Hathor, Rati

### 4. Death/Underworld (`death.svg`)
- **Symbol**: Skull with scythe
- **Domains**: death, underworld, afterlife, necromancy
- **Examples**: Hades, Pluto, Hel, Ereshkigal, Yama, Anubis

### 5. Sky/Thunder (`sky.svg`)
- **Symbol**: Cloud with lightning bolt
- **Domains**: sky, thunder, lightning, storm, weather
- **Examples**: Zeus, Jupiter, Thor, Indra, Raijin

### 6. Earth/Nature (`earth.svg`)
- **Symbol**: Mountains with tree
- **Domains**: earth, nature, agriculture, harvest, mountains
- **Examples**: Gaia, Demeter, Ceres, Prithvi, Pachamama

### 7. Sea/Water (`sea.svg`)
- **Symbol**: Trident with waves
- **Domains**: sea, water, ocean, rivers
- **Examples**: Poseidon, Neptune, Yemoja, Dragon Kings

### 8. Sun (`sun.svg`)
- **Symbol**: Sun with rays
- **Domains**: sun, solar, light, day
- **Examples**: Ra, Apollo, Amaterasu, Surya, Shamash

### 9. Moon (`moon.svg`)
- **Symbol**: Crescent moon with stars
- **Domains**: moon, lunar, night
- **Examples**: Selene, Luna, Tsukuyomi, Chandra, Sin

### 10. Trickster (`trickster.svg`)
- **Symbol**: Comedy/tragedy masks with question mark
- **Domains**: trickster, mischief, chaos, cunning
- **Examples**: Loki, Hermes, Anansi, Coyote, Eshu

### 11. Healing (`healing.svg`)
- **Symbol**: Caduceus/Rod of Asclepius
- **Domains**: healing, medicine, health, plague
- **Examples**: Asclepius, Apollo, Eir, Dhanvantari

### 12. Fertility (`fertility.svg`)
- **Symbol**: Grain stalks with cornucopia
- **Domains**: fertility, abundance, growth, prosperity
- **Examples**: Demeter, Freyr, Osiris, Inanna, Tlaloc

### 13. Fire (`fire.svg`)
- **Symbol**: Flames
- **Domains**: fire, forge, smithing, crafts
- **Examples**: Hephaestus, Vulcan, Agni, Pele

### 14. Creator (`creator.svg`)
- **Symbol**: Hands shaping cosmic sphere
- **Domains**: creator, creation, primordial, origin
- **Examples**: Brahma, Ptah, Atum, An, Izanagi

### 15. Justice/Law (`justice.svg`)
- **Symbol**: Scales with sword
- **Domains**: justice, law, order, judgment, truth
- **Examples**: Maat, Themis, Justitia, Forseti, Rashnu

## Technical Implementation

### File Structure

```
icons/deity-domains/
├── deity-domain-icons.json   # Domain-to-icon mapping
├── war.svg
├── wisdom.svg
├── love.svg
├── death.svg
├── sky.svg
├── earth.svg
├── sea.svg
├── sun.svg
├── moon.svg
├── trickster.svg
├── healing.svg
├── fertility.svg
├── fire.svg
├── creator.svg
└── justice.svg

js/
├── deity-domain-icons.js              # Core domain icon system
└── entity-renderer-domain-icons.js    # Extension for entity renderer
```

### Icon Specifications

- **Format**: SVG (Scalable Vector Graphics)
- **ViewBox**: `0 0 64 64`
- **Color**: `currentColor` (inherits from CSS)
- **Stroke**: 2px with round caps/joins
- **Style**: Clean, symbolic, minimalist
- **Compatibility**: Works across all mythologies

### Usage in HTML Pages

Add these scripts to deity pages (in order):

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore-compat.js"></script>

<!-- Firebase configuration -->
<script src="/js/firebase-config.js"></script>

<!-- Entity renderer -->
<script src="/js/entity-renderer-firebase.js"></script>

<!-- Domain icon system -->
<script src="/js/deity-domain-icons.js"></script>
<script src="/js/entity-renderer-domain-icons.js"></script>

<script>
    // Icons will be automatically applied when rendering deities
    const renderer = new FirebaseEntityRenderer();
    renderer.loadAndRender('deity', 'zeus', 'greek', document.getElementById('deity-container'));
</script>
```

### JavaScript API

#### DeityDomainIcons Class

```javascript
// Initialize
await window.deityDomainIcons.init();

// Get icon path for a domain
const iconPath = window.deityDomainIcons.getIconPath('war');
// Returns: "icons/deity-domains/war.svg"

// Get SVG content for a domain
const svg = await window.deityDomainIcons.getIconSVG('wisdom');
// Returns: "<svg xmlns=...>...</svg>"

// Get icon for deity (from domains or custom icon)
const icon = await window.deityDomainIcons.getDeityIcon(deity);

// Render domain icons with labels
const html = await window.deityDomainIcons.renderDomainIcons(['war', 'sky']);
// Returns HTML with icons and labels

// Get all available domains
const domains = window.deityDomainIcons.getAllDomains();
```

### Firebase Data Structure

Icons are automatically used when deity data includes domains:

```json
{
  "id": "zeus",
  "name": "Zeus",
  "type": "deity",
  "mythology": "greek",
  "domains": ["sky", "thunder", "justice"],
  "visual": {
    "icon": null  // Will use domain icons automatically
  }
}
```

If a custom icon is provided, it takes precedence:

```json
{
  "visual": {
    "icon": "<svg>...</svg>"  // Custom icon used instead
  }
}
```

## Domain Mapping

The `deity-domain-icons.json` file maps multiple domain variations to icons:

```json
{
  "war": "icons/deity-domains/war.svg",
  "battle": "icons/deity-domains/war.svg",
  "combat": "icons/deity-domains/war.svg",

  "wisdom": "icons/deity-domains/wisdom.svg",
  "knowledge": "icons/deity-domains/wisdom.svg",
  "learning": "icons/deity-domains/wisdom.svg"
}
```

This allows flexible domain naming while ensuring consistent iconography.

## Styling

Domain icons inherit color from their context:

```css
/* Icons use currentColor, so they adapt to theme */
.domain-icon svg {
    fill: currentColor;
    stroke: currentColor;
}

/* Style domain badges */
.domain-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    background: rgba(var(--color-primary-rgb), 0.1);
    border: 1px solid rgba(var(--color-primary-rgb), 0.3);
    border-radius: 1rem;
    font-size: 0.9rem;
}

.domain-icon {
    width: 1.2em;
    height: 1.2em;
    display: inline-block;
    vertical-align: middle;
    margin-right: 0.3em;
}
```

## Adding New Domain Icons

To add a new domain icon:

1. **Create SVG file**: Follow existing icon style
   - 64x64 viewBox
   - Use currentColor
   - 2px stroke width
   - Symbolic and universal design

2. **Add to mapping**: Update `deity-domain-icons.json`
   ```json
   {
     "newdomain": "icons/deity-domains/newdomain.svg",
     "alias1": "icons/deity-domains/newdomain.svg"
   }
   ```

3. **Test**: Verify icon displays correctly across different mythologies

## Examples

### Greek Mythology
- **Zeus**: Sky + Thunder icons
- **Athena**: Wisdom icon
- **Ares**: War icon
- **Aphrodite**: Love icon

### Egyptian Mythology
- **Ra**: Sun icon
- **Osiris**: Death + Fertility icons
- **Thoth**: Wisdom icon
- **Anubis**: Death icon

### Norse Mythology
- **Odin**: Wisdom + War icons
- **Thor**: Sky + Thunder icons
- **Loki**: Trickster icon
- **Freya**: Love icon

### Hindu Mythology
- **Brahma**: Creator icon
- **Vishnu**: Creator icon
- **Shiva**: Death icon
- **Saraswati**: Wisdom icon

## Benefits

1. **Visual Consistency**: Same domain = same icon across all mythologies
2. **Quick Recognition**: Users instantly understand deity's primary role
3. **Mythology Agnostic**: Icons work for any tradition
4. **Accessible**: SVG format supports screen readers and scales perfectly
5. **Theme Compatible**: Icons adapt to mythology-specific color schemes
6. **Automatic**: No manual icon assignment needed for standard domains

## Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **SVG Support**: Required (all modern browsers)
- **Async/Await**: Required (ES2017+)
- **Fetch API**: Required (all modern browsers)

## Performance

- **Icon Loading**: Lazy-loaded via fetch
- **Caching**: SVG content cached in memory
- **File Size**: ~1-2KB per icon (uncompressed)
- **Total Set**: ~20KB for all 15 icons

## License

Part of the Eyes of Azrael project. Icons are original designs created for this project.

## Future Enhancements

Potential additions:
- Prophecy/Divination icon
- Music/Arts icon
- Hunting icon
- Messenger/Communication icon
- Craftsmanship icon
- Prosperity/Wealth icon
- Travel/Journey icon
- Magic/Sorcery icon

---

**Last Updated**: December 28, 2025
**Version**: 1.0.0
