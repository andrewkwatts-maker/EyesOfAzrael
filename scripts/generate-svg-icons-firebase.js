#!/usr/bin/env node

/**
 * SVG Icon Generator for Firebase Storage
 *
 * Generates SVG icons that can be:
 * 1. Stored directly in Firebase asset documents (icon field)
 * 2. Rendered inline in HTML (no external files needed)
 * 3. Easily styled with CSS
 * 4. Infinitely scalable
 * 5. Small file size (<2KB per icon)
 *
 * Usage:
 *   node scripts/generate-svg-icons-firebase.js
 */

const fs = require('fs').promises;
const path = require('path');

// Brand colors
const COLORS = {
    background: '#1a1a1a',
    primary: '#8b7fff',
    secondary: '#9370DB',
    accent: '#6a5acd',
    highlight: '#ffffff'
};

/**
 * Generate mystical eye icon (main app icon)
 */
function generateEyeIconSVG(size = 512) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${COLORS.background}"/>

  <!-- Sacred geometry - outer circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.35}" fill="none" stroke="${COLORS.primary}" stroke-width="2" opacity="0.3"/>

  <!-- Eye outline -->
  <ellipse cx="${size/2}" cy="${size/2}" rx="${size*0.3}" ry="${size*0.18}" fill="none" stroke="${COLORS.primary}" stroke-width="4"/>

  <!-- Iris gradient -->
  <defs>
    <radialGradient id="irisGrad">
      <stop offset="0%" stop-color="${COLORS.secondary}"/>
      <stop offset="50%" stop-color="${COLORS.primary}"/>
      <stop offset="100%" stop-color="${COLORS.accent}"/>
    </radialGradient>
  </defs>

  <!-- Iris -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.1}" fill="url(#irisGrad)"/>

  <!-- Pupil -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.05}" fill="${COLORS.background}"/>

  <!-- Highlight -->
  <circle cx="${size/2 - size*0.03}" cy="${size/2 - size*0.03}" r="${size*0.02}" fill="${COLORS.highlight}" opacity="0.8"/>

  <!-- Sacred geometry points -->
  <circle cx="${size/2}" cy="${size*0.15}" r="3" fill="${COLORS.primary}" opacity="0.5"/>
  <circle cx="${size/2}" cy="${size*0.85}" r="3" fill="${COLORS.primary}" opacity="0.5"/>
  <circle cx="${size*0.15}" cy="${size/2}" r="3" fill="${COLORS.primary}" opacity="0.5"/>
  <circle cx="${size*0.85}" cy="${size/2}" r="3" fill="${COLORS.primary}" opacity="0.5"/>
</svg>`;
}

/**
 * Generate type-specific icons (for entities)
 */
const ENTITY_ICONS = {
    deity: (size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="${COLORS.primary}" opacity="0.2"/>
  <path d="M ${size/2} ${size*0.2} L ${size*0.7} ${size*0.8} L ${size*0.3} ${size*0.8} Z" fill="${COLORS.primary}"/>
  <circle cx="${size/2}" cy="${size*0.5}" r="${size*0.15}" fill="${COLORS.secondary}"/>
  <text x="${size/2}" y="${size*0.9}" text-anchor="middle" font-size="${size*0.3}" fill="${COLORS.primary}">⚡</text>
</svg>`,

    hero: (size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="${COLORS.accent}" opacity="0.2"/>
  <rect x="${size*0.3}" y="${size*0.25}" width="${size*0.4}" height="${size*0.5}" rx="4" fill="${COLORS.accent}"/>
  <text x="${size/2}" y="${size*0.7}" text-anchor="middle" font-size="${size*0.35}" fill="${COLORS.highlight}">⚔️</text>
</svg>`,

    creature: (size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="${COLORS.secondary}" opacity="0.2"/>
  <path d="M ${size*0.3} ${size*0.5} Q ${size/2} ${size*0.3} ${size*0.7} ${size*0.5} Q ${size/2} ${size*0.7} ${size*0.3} ${size*0.5}" fill="${COLORS.secondary}"/>
  <text x="${size/2}" y="${size*0.75}" text-anchor="middle" font-size="${size*0.3}" fill="${COLORS.primary}">🐉</text>
</svg>`,

    place: (size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="${COLORS.primary}" opacity="0.2"/>
  <path d="M ${size*0.25} ${size*0.75} L ${size/2} ${size*0.25} L ${size*0.75} ${size*0.75} Z" fill="none" stroke="${COLORS.primary}" stroke-width="3"/>
  <text x="${size/2}" y="${size*0.8}" text-anchor="middle" font-size="${size*0.3}" fill="${COLORS.primary}">🏛️</text>
</svg>`,

    item: (size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="${COLORS.accent}" opacity="0.2"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.25}" fill="none" stroke="${COLORS.accent}" stroke-width="2"/>
  <text x="${size/2}" y="${size*0.7}" text-anchor="middle" font-size="${size*0.35}" fill="${COLORS.accent}">💎</text>
</svg>`,

    concept: (size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="${COLORS.secondary}" opacity="0.2"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.3}" fill="none" stroke="${COLORS.secondary}" stroke-width="2" stroke-dasharray="5,5"/>
  <text x="${size/2}" y="${size*0.7}" text-anchor="middle" font-size="${size*0.35}" fill="${COLORS.secondary}">✨</text>
</svg>`,

    magic: (size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="${COLORS.primary}" opacity="0.2"/>
  <path d="M ${size/2} ${size*0.3} L ${size*0.6} ${size*0.7} L ${size*0.4} ${size*0.7} Z" fill="${COLORS.primary}"/>
  <circle cx="${size/2}" cy="${size*0.3}" r="${size*0.08}" fill="${COLORS.highlight}"/>
  <text x="${size/2}" y="${size*0.85}" text-anchor="middle" font-size="${size*0.25}" fill="${COLORS.primary}">🔮</text>
</svg>`
};

/**
 * Generate PWA manifest icons as base64 data URIs
 */
function generatePWAManifest() {
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    const icons = sizes.map(size => {
        const svg = generateEyeIconSVG(size);
        const base64 = Buffer.from(svg).toString('base64');

        return {
            src: `data:image/svg+xml;base64,${base64}`,
            sizes: `${size}x${size}`,
            type: 'image/svg+xml',
            purpose: 'any maskable'
        };
    });

    return {
        name: 'Eyes of Azrael',
        short_name: 'Eyes of Azrael',
        description: 'Explore world mythologies - deities, heroes, creatures, and sacred texts',
        start_url: '/',
        display: 'standalone',
        background_color: COLORS.background,
        theme_color: COLORS.primary,
        orientation: 'any',
        icons
    };
}

/**
 * Generate Firebase-ready icon data
 */
function generateFirebaseIconData() {
    const icons = {
        app: {
            svg: generateEyeIconSVG(512),
            name: 'Eyes of Azrael App Icon',
            type: 'app',
            sizes: [72, 96, 128, 144, 152, 192, 384, 512]
        },
        entities: {}
    };

    // Generate entity type icons
    for (const [type, generator] of Object.entries(ENTITY_ICONS)) {
        icons.entities[type] = {
            svg: generator(64),
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Icon`,
            type: 'entity',
            entityType: type
        };
    }

    return icons;
}

/**
 * Main execution
 */
async function main() {
    console.log('🎨 Generating SVG icons for Firebase...\n');

    try {
        // Create icons directory
        const iconsDir = path.join(__dirname, '..', 'icons');
        await fs.mkdir(iconsDir, { recursive: true });

        // 1. Generate and save app icon SVG
        const appIconSVG = generateEyeIconSVG(512);
        await fs.writeFile(
            path.join(iconsDir, 'app-icon.svg'),
            appIconSVG
        );
        console.log('✅ Generated app-icon.svg (512x512)');

        // 2. Generate entity type icons
        for (const [type, generator] of Object.entries(ENTITY_ICONS)) {
            const svg = generator(64);
            await fs.writeFile(
                path.join(iconsDir, `${type}-icon.svg`),
                svg
            );
            console.log(`✅ Generated ${type}-icon.svg`);
        }

        // 3. Generate PWA manifest with embedded SVGs
        const manifest = generatePWAManifest();
        await fs.writeFile(
            path.join(__dirname, '..', 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        console.log('✅ Generated manifest.json with embedded SVG icons');

        // 4. Generate Firebase icon data file
        const firebaseIcons = generateFirebaseIconData();
        await fs.writeFile(
            path.join(iconsDir, 'firebase-icons.json'),
            JSON.stringify(firebaseIcons, null, 2)
        );
        console.log('✅ Generated firebase-icons.json for Firebase import');

        // 5. Generate inline SVG helper
        const inlineSVGHelper = `/**
 * Inline SVG Icons for Eyes of Azrael
 *
 * Usage:
 *   import { getEntityIcon } from './svg-icons.js';
 *   const svgString = getEntityIcon('deity');
 *   element.innerHTML = svgString;
 */

export const ENTITY_ICONS = ${JSON.stringify(
    Object.fromEntries(
        Object.entries(ENTITY_ICONS).map(([type, fn]) => [type, fn(64)])
    ),
    null,
    2
)};

export function getEntityIcon(type, size = 64) {
    const iconFn = ENTITY_ICON_FUNCTIONS[type];
    return iconFn ? iconFn(size) : ENTITY_ICONS[type] || ENTITY_ICONS.concept;
}

const ENTITY_ICON_FUNCTIONS = {
${Object.entries(ENTITY_ICONS).map(([type, fn]) =>
    `    ${type}: ${fn.toString()}`
).join(',\n')}
};
`;

        await fs.writeFile(
            path.join(__dirname, '..', 'js', 'svg-icons.js'),
            inlineSVGHelper
        );
        console.log('✅ Generated js/svg-icons.js for inline usage');

        // 6. Generate usage documentation
        const docs = `# SVG Icons System

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

\`\`\`json
{
  "name": "Zeus",
  "type": "deity",
  "icon": "${ENTITY_ICONS.deity(64).replace(/\n/g, '').replace(/  +/g, ' ')}",
  "iconType": "svg"
}
\`\`\`

### Render icon in HTML:

\`\`\`javascript
// Option 1: From Firebase asset
const asset = await getAsset('deity', 'zeus');
element.innerHTML = asset.icon;

// Option 2: From helper function
import { getEntityIcon } from './js/svg-icons.js';
element.innerHTML = getEntityIcon('deity', 64);
\`\`\`

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

Edit \`scripts/generate-svg-icons-firebase.js\` to:
- Change colors (COLORS object)
- Modify icon designs (ENTITY_ICONS functions)
- Add new icon types
- Adjust sizes

Then run: \`node scripts/generate-svg-icons-firebase.js\`
`;

        await fs.writeFile(
            path.join(iconsDir, 'README.md'),
            docs
        );
        console.log('✅ Generated icons/README.md');

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Summary');
        console.log('='.repeat(60));
        console.log(`✅ App Icon: icons/app-icon.svg`);
        console.log(`✅ Entity Icons: ${Object.keys(ENTITY_ICONS).length} types`);
        console.log(`✅ PWA Manifest: manifest.json (${manifest.icons.length} sizes)`);
        console.log(`✅ Firebase Data: icons/firebase-icons.json`);
        console.log(`✅ JS Helper: js/svg-icons.js`);
        console.log('='.repeat(60));
        console.log('\n💡 Next Steps:');
        console.log('   1. Import icons/firebase-icons.json to Firebase');
        console.log('   2. Update asset documents with icon SVGs');
        console.log('   3. Use js/svg-icons.js in your rendering code');
        console.log('   4. Deploy manifest.json with embedded SVGs');
        console.log('');
        console.log('📖 See icons/README.md for detailed usage\n');

    } catch (error) {
        console.error('❌ Error generating icons:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    generateEyeIconSVG,
    ENTITY_ICONS,
    generatePWAManifest,
    generateFirebaseIconData
};
