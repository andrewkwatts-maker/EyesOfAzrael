/**
 * Inline SVG Icons for Eyes of Azrael
 *
 * Usage:
 *   import { getEntityIcon } from './svg-icons.js';
 *   const svgString = getEntityIcon('deity');
 *   element.innerHTML = svgString;
 */

export const ENTITY_ICONS = {
  "deity": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">\n  <circle cx=\"32\" cy=\"32\" r=\"28.8\" fill=\"#8b7fff\" opacity=\"0.2\"/>\n  <path d=\"M 32 12.8 L 44.8 51.2 L 19.2 51.2 Z\" fill=\"#8b7fff\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"9.6\" fill=\"#9370DB\"/>\n  <text x=\"32\" y=\"57.6\" text-anchor=\"middle\" font-size=\"19.2\" fill=\"#8b7fff\">⚡</text>\n</svg>",
  "hero": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">\n  <circle cx=\"32\" cy=\"32\" r=\"28.8\" fill=\"#6a5acd\" opacity=\"0.2\"/>\n  <rect x=\"19.2\" y=\"16\" width=\"25.6\" height=\"32\" rx=\"4\" fill=\"#6a5acd\"/>\n  <text x=\"32\" y=\"44.8\" text-anchor=\"middle\" font-size=\"22.4\" fill=\"#ffffff\">⚔️</text>\n</svg>",
  "creature": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">\n  <circle cx=\"32\" cy=\"32\" r=\"28.8\" fill=\"#9370DB\" opacity=\"0.2\"/>\n  <path d=\"M 19.2 32 Q 32 19.2 44.8 32 Q 32 44.8 19.2 32\" fill=\"#9370DB\"/>\n  <text x=\"32\" y=\"48\" text-anchor=\"middle\" font-size=\"19.2\" fill=\"#8b7fff\">🐉</text>\n</svg>",
  "place": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">\n  <circle cx=\"32\" cy=\"32\" r=\"28.8\" fill=\"#8b7fff\" opacity=\"0.2\"/>\n  <path d=\"M 16 48 L 32 16 L 48 48 Z\" fill=\"none\" stroke=\"#8b7fff\" stroke-width=\"3\"/>\n  <text x=\"32\" y=\"51.2\" text-anchor=\"middle\" font-size=\"19.2\" fill=\"#8b7fff\">🏛️</text>\n</svg>",
  "item": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">\n  <circle cx=\"32\" cy=\"32\" r=\"28.8\" fill=\"#6a5acd\" opacity=\"0.2\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"16\" fill=\"none\" stroke=\"#6a5acd\" stroke-width=\"2\"/>\n  <text x=\"32\" y=\"44.8\" text-anchor=\"middle\" font-size=\"22.4\" fill=\"#6a5acd\">💎</text>\n</svg>",
  "concept": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">\n  <circle cx=\"32\" cy=\"32\" r=\"28.8\" fill=\"#9370DB\" opacity=\"0.2\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"19.2\" fill=\"none\" stroke=\"#9370DB\" stroke-width=\"2\" stroke-dasharray=\"5,5\"/>\n  <text x=\"32\" y=\"44.8\" text-anchor=\"middle\" font-size=\"22.4\" fill=\"#9370DB\">✨</text>\n</svg>",
  "magic": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">\n  <circle cx=\"32\" cy=\"32\" r=\"28.8\" fill=\"#8b7fff\" opacity=\"0.2\"/>\n  <path d=\"M 32 19.2 L 38.4 44.8 L 25.6 44.8 Z\" fill=\"#8b7fff\"/>\n  <circle cx=\"32\" cy=\"19.2\" r=\"5.12\" fill=\"#ffffff\"/>\n  <text x=\"32\" y=\"54.4\" text-anchor=\"middle\" font-size=\"16\" fill=\"#8b7fff\">🔮</text>\n</svg>"
};

export function getEntityIcon(type, size = 64) {
    const iconFn = ENTITY_ICON_FUNCTIONS[type];
    return iconFn ? iconFn(size) : ENTITY_ICONS[type] || ENTITY_ICONS.concept;
}

const ENTITY_ICON_FUNCTIONS = {
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
