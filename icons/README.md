# SVG Icons System

## Overview

All icons are now SVG-based and can be stored directly in Firebase asset documents.

## Files Generated

1. **icons/app-icon.svg** - Main application icon (512x512)
2. **icons/*-icon.svg** - Entity type icons (deity, hero, creature, etc.)
3. **icons/firebase-icons.json** - Firebase import data
4. **manifest.json** - PWA manifest with embedded SVG data URIs
5. **js/svg-icons.js** - JavaScript helper for inline SVG rendering

## Usage in Firebase

### Store icon in asset document:

```json
{
  "name": "Zeus",
  "type": "deity",
  "icon": "<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"> <circle cx="32" cy="32" r="28.8" fill="#8b7fff" opacity="0.2"/> <path d="M 32 12.8 L 44.8 51.2 L 19.2 51.2 Z" fill="#8b7fff"/> <circle cx="32" cy="32" r="9.6" fill="#9370DB"/> <text x="32" y="57.6" text-anchor="middle" font-size="19.2" fill="#8b7fff">⚡</text></svg>",
  "iconType": "svg"
}
```

### Render icon in HTML:

```javascript
// Option 1: From Firebase asset
const asset = await getAsset('deity', 'zeus');
element.innerHTML = asset.icon;

// Option 2: From helper function
import { getEntityIcon } from './js/svg-icons.js';
element.innerHTML = getEntityIcon('deity', 64);
```

## Benefits

✅ **Small file size** - SVG strings are <2KB each
✅ **Scalable** - Works at any size without quality loss
✅ **Inline rendering** - No external file requests
✅ **Easy to style** - Can modify colors via CSS
✅ **Firebase-friendly** - Stored directly in asset documents
✅ **Fast** - No image loading delays

## Icon Types

- **deity** - ⚡ Lightning/divine power
- **hero** - ⚔️ Sword/warrior
- **creature** - 🐉 Dragon/mythical beast
- **place** - 🏛️ Temple/sacred site
- **item** - 💎 Gem/artifact
- **concept** - ✨ Sparkle/abstract idea
- **magic** - 🔮 Crystal ball/mysticism

## Customization

Edit `scripts/generate-svg-icons-firebase.js` to:
- Change colors (COLORS object)
- Modify icon designs (ENTITY_ICONS functions)
- Add new icon types
- Adjust sizes

Then run: `node scripts/generate-svg-icons-firebase.js`
