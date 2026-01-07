/**
 * Icon Generator Module
 * Provides SVG icon generation with sacred geometry, mythology symbols, and theme-aware colors
 *
 * Usage:
 *   const generator = new IconGenerator();
 *   const svg = generator.generate({ shape: 'hexagram', style: 'filled', color: 'primary' });
 */

class IconGenerator {
    constructor(options = {}) {
        this.size = options.size || 64;
        this.viewBox = options.viewBox || '0 0 64 64';
        this.strokeWidth = options.strokeWidth || 2;

        // Load theme colors from CSS variables or use defaults
        this.colors = this.loadThemeColors();

        // Define shape categories
        this.shapeCategories = {
            geometry: ['circle', 'triangle', 'square', 'pentagon', 'hexagon', 'octagon', 'star', 'hexagram', 'pentagram', 'vesica-piscis', 'flower-of-life', 'seed-of-life', 'metatrons-cube', 'sri-yantra', 'torus'],
            mythology: ['ankh', 'triskelion', 'mjolnir', 'eye-of-horus', 'eye-of-ra', 'caduceus', 'ouroboros', 'tree-of-life', 'valknut', 'yin-yang', 'om', 'cross', 'crescent', 'trident', 'lotus', 'scarab', 'thunderbolt', 'wings', 'serpent', 'dragon-head'],
            elements: ['fire', 'water', 'earth', 'air', 'spirit', 'sun', 'moon', 'stars', 'mountain', 'wave', 'flame', 'leaf', 'crystal'],
            symbols: ['infinity', 'spiral', 'labyrinth', 'mandala', 'chakra', 'rune', 'sigil', 'awen', 'triquetra', 'helm-of-awe']
        };

        // Flatten all shapes for quick lookup
        this.allShapes = Object.values(this.shapeCategories).flat();
    }

    /**
     * Load theme colors from CSS custom properties
     */
    loadThemeColors() {
        const root = document.documentElement;
        const getVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();

        return {
            primary: getVar('--color-primary') || '#8b7fff',
            secondary: getVar('--color-secondary') || '#ff7eb6',
            accent: getVar('--color-accent') || '#ffd93d',
            text: getVar('--color-text-primary') || '#f8f9fa',
            muted: getVar('--color-text-muted') || '#6c757d',
            gold: '#ffd700',
            silver: '#c0c0c0',
            bronze: '#cd7f32',
            white: '#ffffff',
            black: '#000000',
            // Mythology-specific colors
            egyptian: '#c9a227',
            greek: '#4a90d9',
            norse: '#8b4513',
            celtic: '#228b22',
            hindu: '#ff6b35',
            buddhist: '#ffa500',
            christian: '#daa520',
            islamic: '#1e7b3d',
            japanese: '#c41e3a',
            chinese: '#ff0000'
        };
    }

    /**
     * Generate an SVG icon
     * @param {Object} options - Generation options
     * @returns {string} SVG markup
     */
    generate(options = {}) {
        const {
            shape = 'circle',
            style = 'filled', // 'filled', 'outline', 'gradient', 'glow'
            color = 'primary',
            secondaryColor = null,
            size = this.size,
            rotation = 0,
            opacity = 1,
            animate = false
        } = options;

        const colorValue = this.getColor(color);
        const secondaryColorValue = secondaryColor ? this.getColor(secondaryColor) : this.getSecondaryColor(colorValue);

        const shapeContent = this.renderShape(shape, {
            style,
            color: colorValue,
            secondaryColor: secondaryColorValue,
            rotation,
            opacity,
            animate
        });

        return this.wrapSVG(shapeContent, { size, animate });
    }

    /**
     * Get color value from name or return as-is if hex
     */
    getColor(colorName) {
        if (colorName.startsWith('#') || colorName.startsWith('rgb')) {
            return colorName;
        }
        return this.colors[colorName] || this.colors.primary;
    }

    /**
     * Get a complementary secondary color
     */
    getSecondaryColor(primaryColor) {
        // Simple approach: use accent or secondary theme color
        return this.colors.secondary;
    }

    /**
     * Wrap shape content in SVG element
     */
    wrapSVG(content, options = {}) {
        const { size = this.size, animate = false } = options;

        const animationDefs = animate ? `
            <defs>
                <style>
                    @keyframes iconPulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.7; }
                    }
                    @keyframes iconRotate {
                        from { transform: rotate(0deg); transform-origin: 32px 32px; }
                        to { transform: rotate(360deg); transform-origin: 32px 32px; }
                    }
                    @keyframes iconGlow {
                        0%, 100% { filter: drop-shadow(0 0 4px currentColor); }
                        50% { filter: drop-shadow(0 0 12px currentColor); }
                    }
                </style>
            </defs>
        ` : '';

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${this.viewBox}" width="${size}" height="${size}" fill="none">
${animationDefs}
${content}
</svg>`;
    }

    /**
     * Render a specific shape
     */
    renderShape(shape, options) {
        const { style, color, secondaryColor, rotation, opacity, animate } = options;

        const transformAttr = rotation ? `transform="rotate(${rotation} 32 32)"` : '';
        const opacityAttr = opacity !== 1 ? `opacity="${opacity}"` : '';
        const animClass = animate ? 'style="animation: iconPulse 2s ease-in-out infinite"' : '';

        const fillColor = style === 'outline' ? 'none' : color;
        const strokeColor = style === 'outline' ? color : 'none';

        // Get the shape generator
        const shapeGenerator = this.getShapeGenerator(shape);
        if (shapeGenerator) {
            return shapeGenerator.call(this, {
                fill: fillColor,
                stroke: strokeColor,
                color,
                secondaryColor,
                style,
                transformAttr,
                opacityAttr,
                animClass
            });
        }

        // Fallback to circle
        return this.renderCircle({ fill: fillColor, stroke: strokeColor, transformAttr, opacityAttr, animClass });
    }

    /**
     * Get shape generator function
     */
    getShapeGenerator(shape) {
        const generators = {
            // Sacred Geometry
            'circle': this.renderCircle,
            'triangle': this.renderTriangle,
            'square': this.renderSquare,
            'pentagon': this.renderPentagon,
            'hexagon': this.renderHexagon,
            'octagon': this.renderOctagon,
            'star': this.renderStar,
            'hexagram': this.renderHexagram,
            'pentagram': this.renderPentagram,
            'vesica-piscis': this.renderVesicaPiscis,
            'flower-of-life': this.renderFlowerOfLife,
            'seed-of-life': this.renderSeedOfLife,
            'metatrons-cube': this.renderMetatronsCube,
            'sri-yantra': this.renderSriYantra,
            'torus': this.renderTorus,

            // Mythology Symbols
            'ankh': this.renderAnkh,
            'triskelion': this.renderTriskelion,
            'mjolnir': this.renderMjolnir,
            'eye-of-horus': this.renderEyeOfHorus,
            'eye-of-ra': this.renderEyeOfRa,
            'caduceus': this.renderCaduceus,
            'ouroboros': this.renderOuroboros,
            'tree-of-life': this.renderTreeOfLife,
            'valknut': this.renderValknut,
            'yin-yang': this.renderYinYang,
            'om': this.renderOm,
            'cross': this.renderCross,
            'crescent': this.renderCrescent,
            'trident': this.renderTrident,
            'lotus': this.renderLotus,
            'scarab': this.renderScarab,
            'thunderbolt': this.renderThunderbolt,
            'wings': this.renderWings,
            'serpent': this.renderSerpent,
            'dragon-head': this.renderDragonHead,

            // Elements
            'fire': this.renderFire,
            'water': this.renderWater,
            'earth': this.renderEarth,
            'air': this.renderAir,
            'spirit': this.renderSpirit,
            'sun': this.renderSun,
            'moon': this.renderMoon,
            'stars': this.renderStars,
            'mountain': this.renderMountain,
            'wave': this.renderWave,
            'flame': this.renderFlame,
            'leaf': this.renderLeaf,
            'crystal': this.renderCrystal,

            // Additional Symbols
            'infinity': this.renderInfinity,
            'spiral': this.renderSpiral,
            'labyrinth': this.renderLabyrinth,
            'mandala': this.renderMandala,
            'chakra': this.renderChakra,
            'rune': this.renderRune,
            'sigil': this.renderSigil,
            'awen': this.renderAwen,
            'triquetra': this.renderTriquetra,
            'helm-of-awe': this.renderHelmOfAwe
        };

        return generators[shape];
    }

    // ============================================
    // SACRED GEOMETRY SHAPES
    // ============================================

    renderCircle(opts) {
        return `<circle cx="32" cy="32" r="24" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}" ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}/>`;
    }

    renderTriangle(opts) {
        return `<polygon points="32,8 56,52 8,52" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}" ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}/>`;
    }

    renderSquare(opts) {
        return `<rect x="10" y="10" width="44" height="44" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}" ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}/>`;
    }

    renderPentagon(opts) {
        const points = this.getPolygonPoints(5, 24, 32, 32, -90);
        return `<polygon points="${points}" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}" ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}/>`;
    }

    renderHexagon(opts) {
        const points = this.getPolygonPoints(6, 24, 32, 32, -90);
        return `<polygon points="${points}" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}" ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}/>`;
    }

    renderOctagon(opts) {
        const points = this.getPolygonPoints(8, 24, 32, 32, -22.5);
        return `<polygon points="${points}" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}" ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}/>`;
    }

    renderStar(opts) {
        const points = this.getStarPoints(5, 24, 10, 32, 32, -90);
        return `<polygon points="${points}" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}" ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}/>`;
    }

    renderHexagram(opts) {
        // Star of David - two overlapping triangles
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <polygon points="32,8 52,44 12,44" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <polygon points="32,56 12,20 52,20" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderPentagram(opts) {
        const points = this.getStarPoints(5, 26, 10, 32, 32, -90);
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <polygon points="${points}" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <circle cx="32" cy="32" r="26" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1" opacity="0.5"/>
        </g>`;
    }

    renderVesicaPiscis(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="24" cy="32" r="18" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <circle cx="40" cy="32" r="18" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <ellipse cx="32" cy="32" rx="8" ry="16" fill="${opts.fill}" opacity="0.5"/>
        </g>`;
    }

    renderFlowerOfLife(opts) {
        const circles = [];
        // Center circle
        circles.push(`<circle cx="32" cy="32" r="10" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>`);
        // First ring (6 circles)
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const x = 32 + 10 * Math.cos(angle);
            const y = 32 + 10 * Math.sin(angle);
            circles.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>`);
        }
        // Second ring (12 circles)
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 + 15) * Math.PI / 180;
            const x = 32 + 20 * Math.cos(angle);
            const y = 32 + 20 * Math.sin(angle);
            circles.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="0.5" opacity="0.7"/>`);
        }
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>${circles.join('')}</g>`;
    }

    renderSeedOfLife(opts) {
        const circles = [];
        // Center circle
        circles.push(`<circle cx="32" cy="32" r="10" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>`);
        // Six surrounding circles
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const x = 32 + 10 * Math.cos(angle);
            const y = 32 + 10 * Math.sin(angle);
            circles.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>`);
        }
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>${circles.join('')}</g>`;
    }

    renderMetatronsCube(opts) {
        // Metatron's Cube - 13 circles with connecting lines
        const circles = [];
        const lines = [];
        const positions = [
            [32, 32], // center
            [32, 12], [32, 52], // top, bottom
            [14, 22], [50, 22], // upper sides
            [14, 42], [50, 42], // lower sides
        ];

        // Add circles
        positions.forEach(([x, y]) => {
            circles.push(`<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>`);
        });

        // Connect all circles with lines
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                lines.push(`<line x1="${positions[i][0]}" y1="${positions[i][1]}" x2="${positions[j][0]}" y2="${positions[j][1]}" stroke="${opts.stroke || opts.color}" stroke-width="0.5" opacity="0.5"/>`);
            }
        }

        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>${lines.join('')}${circles.join('')}</g>`;
    }

    renderSriYantra(opts) {
        // Simplified Sri Yantra - concentric triangles
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="32" cy="32" r="26" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <polygon points="32,8 54,48 10,48" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <polygon points="32,56 10,16 54,16" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <polygon points="32,16 48,44 16,44" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <polygon points="32,48 16,20 48,20" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <circle cx="32" cy="32" r="4" fill="${opts.fill || opts.color}" opacity="0.8"/>
        </g>`;
    }

    renderTorus(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <ellipse cx="32" cy="32" rx="24" ry="12" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <ellipse cx="32" cy="32" rx="12" ry="24" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <ellipse cx="32" cy="32" rx="24" ry="8" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1" opacity="0.5"/>
        </g>`;
    }

    // ============================================
    // MYTHOLOGY SYMBOLS
    // ============================================

    renderAnkh(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <ellipse cx="32" cy="16" rx="10" ry="12" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="32" y1="28" x2="32" y2="56" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="18" y1="38" x2="46" y2="38" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderTriskelion(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M32,32 Q44,20 32,8 Q32,20 32,32" fill="${opts.fill}" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <path d="M32,32 Q20,44 32,56 Q32,44 32,32" fill="${opts.fill}" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <path d="M32,32 Q50,44 56,32 Q44,32 32,32" fill="${opts.fill}" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <path d="M32,32 Q14,20 8,32 Q20,32 32,32" fill="${opts.fill}" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <circle cx="32" cy="32" r="4" fill="${opts.fill || opts.color}"/>
        </g>`;
    }

    renderMjolnir(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <rect x="28" y="8" width="8" height="20" rx="2" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <path d="M12,28 L52,28 L52,44 Q32,50 12,44 Z" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <rect x="29" y="44" width="6" height="14" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <line x1="20" y1="34" x2="44" y2="34" stroke="${opts.secondaryColor || opts.color}" stroke-width="1" opacity="0.5"/>
        </g>`;
    }

    renderEyeOfHorus(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <ellipse cx="32" cy="28" rx="20" ry="12" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <circle cx="32" cy="28" r="6" fill="${opts.secondaryColor || opts.color}"/>
            <circle cx="32" cy="28" r="3" fill="${opts.color}"/>
            <path d="M12,28 Q8,36 16,44" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M52,28 L56,32" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M32,40 L28,52 L24,48" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderEyeOfRa(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <ellipse cx="32" cy="26" rx="18" ry="10" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <circle cx="32" cy="26" r="5" fill="${opts.secondaryColor || opts.color}"/>
            <path d="M14,26 Q8,32 12,42 L18,38" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M50,26 Q56,32 52,42 L46,38" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="32" y1="36" x2="32" y2="52" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
            <circle cx="32" cy="54" r="3" fill="${opts.fill || opts.color}"/>
        </g>`;
    }

    renderCaduceus(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <line x1="32" y1="8" x2="32" y2="56" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <circle cx="32" cy="10" r="4" fill="${opts.fill || opts.color}"/>
            <path d="M20,44 Q32,36 44,44 Q32,52 20,44" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1.5"/>
            <path d="M18,36 Q32,28 46,36 Q32,44 18,36" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1.5"/>
            <path d="M16,28 Q32,20 48,28 Q32,36 16,28" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1.5"/>
            <path d="M24,8 L20,4 M24,8 L28,4" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
            <path d="M40,8 L36,4 M40,8 L44,4" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
        </g>`;
    }

    renderOuroboros(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="32" cy="32" r="20" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="6"/>
            <path d="M52,32 L56,28 L56,36 Z" fill="${opts.fill || opts.color}"/>
            <circle cx="14" cy="32" r="3" fill="${opts.secondaryColor || opts.color}"/>
            <path d="M16,30 Q12,28 10,32" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
        </g>`;
    }

    renderTreeOfLife(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <line x1="32" y1="56" x2="32" y2="20" stroke="${opts.stroke || opts.color}" stroke-width="3"/>
            <path d="M32,20 Q20,12 20,20 Q20,28 32,24" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
            <path d="M32,20 Q44,12 44,20 Q44,28 32,24" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
            <path d="M32,28 Q16,20 14,28 Q12,36 32,32" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
            <path d="M32,28 Q48,20 50,28 Q52,36 32,32" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
            <circle cx="32" cy="14" r="6" fill="${opts.fill || opts.color}" opacity="0.8"/>
            <path d="M24,56 Q32,48 40,56" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
        </g>`;
    }

    renderValknut(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <polygon points="32,8 44,28 20,28" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <polygon points="20,20 44,20 32,40" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <polygon points="32,52 20,32 44,32" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderYinYang(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="32" cy="32" r="24" fill="${opts.fill || opts.color}"/>
            <path d="M32,8 A24,24 0 0,1 32,56 A12,12 0 0,1 32,32 A12,12 0 0,0 32,8" fill="${opts.secondaryColor || '#ffffff'}"/>
            <circle cx="32" cy="20" r="4" fill="${opts.fill || opts.color}"/>
            <circle cx="32" cy="44" r="4" fill="${opts.secondaryColor || '#ffffff'}"/>
            <circle cx="32" cy="32" r="24" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderOm(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M16,40 Q8,36 12,28 Q16,20 24,24 Q28,28 24,36 Q20,44 16,40" fill="${opts.fill}" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M28,32 Q32,24 40,28 Q48,32 44,40 Q40,48 32,44" fill="${opts.fill}" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M48,20 Q52,16 48,12" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <circle cx="52" cy="8" r="3" fill="${opts.fill || opts.color}"/>
            <path d="M36,16 Q40,12 44,16" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderCross(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <rect x="28" y="8" width="8" height="48" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <rect x="12" y="20" width="40" height="8" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderCrescent(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M44,32 A20,20 0 1,1 44,31.9 A14,14 0 1,0 44,32" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderTrident(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <line x1="32" y1="16" x2="32" y2="56" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M32,16 L32,8" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M20,24 L20,12 Q20,8 24,10" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M44,24 L44,12 Q44,8 40,10" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="20" y1="24" x2="44" y2="24" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <circle cx="32" cy="8" r="3" fill="${opts.fill || opts.color}"/>
            <circle cx="20" cy="10" r="2" fill="${opts.fill || opts.color}"/>
            <circle cx="44" cy="10" r="2" fill="${opts.fill || opts.color}"/>
        </g>`;
    }

    renderLotus(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <ellipse cx="32" cy="48" rx="20" ry="8" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="1" opacity="0.5"/>
            <path d="M32,44 Q24,36 20,44 Q28,40 32,44" fill="${opts.fill || opts.color}"/>
            <path d="M32,44 Q40,36 44,44 Q36,40 32,44" fill="${opts.fill || opts.color}"/>
            <path d="M32,40 Q20,28 16,40 Q24,36 32,40" fill="${opts.fill || opts.color}" opacity="0.8"/>
            <path d="M32,40 Q44,28 48,40 Q40,36 32,40" fill="${opts.fill || opts.color}" opacity="0.8"/>
            <path d="M32,36 Q24,20 32,12 Q40,20 32,36" fill="${opts.fill || opts.color}"/>
            <circle cx="32" cy="32" r="4" fill="${opts.secondaryColor || '#ffd700'}"/>
        </g>`;
    }

    renderScarab(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <ellipse cx="32" cy="36" rx="16" ry="12" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <circle cx="32" cy="20" r="8" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <path d="M12,32 Q8,24 16,20" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M52,32 Q56,24 48,20" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M20,44 L12,52" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M44,44 L52,52" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="32" y1="48" x2="32" y2="56" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderThunderbolt(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M38,6 L18,30 L28,30 L24,58 L46,28 L34,28 Z" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <path d="M28,30 L34,28" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.5"/>
        </g>`;
    }

    renderWings(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M32,32 Q16,24 8,16 Q12,28 20,32 Q12,36 8,48 Q16,40 32,32" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <path d="M32,32 Q48,24 56,16 Q52,28 44,32 Q52,36 56,48 Q48,40 32,32" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <ellipse cx="32" cy="32" rx="4" ry="6" fill="${opts.secondaryColor || opts.color}"/>
        </g>`;
    }

    renderSerpent(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M12,48 Q8,40 16,32 Q24,24 32,32 Q40,40 48,32 Q56,24 52,16" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="4" stroke-linecap="round"/>
            <circle cx="52" cy="14" r="4" fill="${opts.fill || opts.color}"/>
            <circle cx="50" cy="12" r="1" fill="${opts.secondaryColor || '#ffffff'}"/>
            <path d="M56,16 L60,12 M56,16 L60,20" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
        </g>`;
    }

    renderDragonHead(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M48,20 C48,12 36,8 24,12 C12,16 8,28 12,40 L24,48 L36,44 L48,36 C52,28 52,24 48,20" fill="${opts.fill}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <circle cx="36" cy="24" r="4" fill="${opts.secondaryColor || '#ffffff'}"/>
            <circle cx="38" cy="24" r="2" fill="${opts.color}"/>
            <path d="M12,28 L4,24 L8,32" fill="${opts.fill || opts.color}"/>
            <path d="M48,20 L56,12 L52,8" fill="${opts.fill || opts.color}" opacity="0.8"/>
            <path d="M24,48 L20,56" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
        </g>`;
    }

    // ============================================
    // ELEMENTAL SYMBOLS
    // ============================================

    renderFire(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M32,8 Q40,20 36,28 Q44,24 40,36 Q48,32 44,44 Q52,40 48,52 L32,56 L16,52 Q12,40 20,44 Q16,32 24,36 Q20,24 28,28 Q24,20 32,8" fill="${opts.fill || opts.color}"/>
            <path d="M32,20 Q36,28 32,36 Q28,44 32,52" fill="${opts.secondaryColor || '#ffd700'}" opacity="0.8"/>
        </g>`;
    }

    renderWater(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M32,8 Q48,24 48,40 Q48,56 32,56 Q16,56 16,40 Q16,24 32,8" fill="${opts.fill || opts.color}"/>
            <ellipse cx="32" cy="42" rx="12" ry="8" fill="${opts.secondaryColor || '#ffffff'}" opacity="0.3"/>
            <path d="M24,32 Q28,28 32,32 Q36,36 40,32" fill="none" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.5"/>
        </g>`;
    }

    renderEarth(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <polygon points="32,8 52,48 12,48" fill="${opts.fill || opts.color}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <line x1="32" y1="8" x2="32" y2="48" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.3"/>
            <line x1="22" y1="28" x2="42" y2="28" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.3"/>
            <line x1="17" y1="38" x2="47" y2="38" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.3"/>
        </g>`;
    }

    renderAir(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <polygon points="32,56 12,16 52,16" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="20" y1="28" x2="44" y2="28" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderSpirit(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="32" cy="32" r="20" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <circle cx="32" cy="32" r="8" fill="${opts.fill || opts.color}"/>
            <line x1="32" y1="12" x2="32" y2="4" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="32" y1="52" x2="32" y2="60" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="12" y1="32" x2="4" y2="32" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="52" y1="32" x2="60" y2="32" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderSun(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="32" cy="32" r="12" fill="${opts.fill || opts.color}"/>
            ${[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
                const rad = angle * Math.PI / 180;
                const x1 = 32 + 16 * Math.cos(rad);
                const y1 = 32 + 16 * Math.sin(rad);
                const x2 = 32 + 24 * Math.cos(rad);
                const y2 = 32 + 24 * Math.sin(rad);
                return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>`;
            }).join('')}
        </g>`;
    }

    renderMoon(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M40,12 A20,20 0 1,1 40,52 A14,14 0 1,0 40,12" fill="${opts.fill || opts.color}"/>
        </g>`;
    }

    renderStars(opts) {
        const stars = [
            { x: 32, y: 16, r: 4 },
            { x: 20, y: 28, r: 3 },
            { x: 44, y: 28, r: 3 },
            { x: 16, y: 44, r: 2 },
            { x: 32, y: 48, r: 3 },
            { x: 48, y: 44, r: 2 }
        ];

        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            ${stars.map(s => {
                const points = this.getStarPoints(5, s.r, s.r * 0.4, s.x, s.y, -90);
                return `<polygon points="${points}" fill="${opts.fill || opts.color}"/>`;
            }).join('')}
        </g>`;
    }

    renderMountain(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <polygon points="32,8 56,56 8,56" fill="${opts.fill || opts.color}"/>
            <polygon points="32,8 40,24 24,24" fill="${opts.secondaryColor || '#ffffff'}" opacity="0.5"/>
            <polygon points="48,32 56,56 40,56" fill="${opts.fill || opts.color}" opacity="0.7"/>
        </g>`;
    }

    renderWave(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M4,32 Q12,20 20,32 Q28,44 36,32 Q44,20 52,32 Q60,44 60,32" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M4,40 Q12,28 20,40 Q28,52 36,40 Q44,28 52,40" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}" opacity="0.7"/>
            <path d="M8,48 Q16,40 24,48 Q32,56 40,48 Q48,40 56,48" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}" opacity="0.5"/>
        </g>`;
    }

    renderFlame(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M32,8 Q44,24 40,40 Q36,52 32,56 Q28,52 24,40 Q20,24 32,8" fill="${opts.fill || opts.color}"/>
            <path d="M32,20 Q38,32 34,44 Q30,52 32,56 Q34,52 30,44 Q26,32 32,20" fill="${opts.secondaryColor || '#ffd700'}" opacity="0.8"/>
            <path d="M32,32 Q34,40 32,48 Q30,40 32,32" fill="${opts.secondaryColor || '#ffffff'}" opacity="0.6"/>
        </g>`;
    }

    renderLeaf(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M32,8 Q52,16 52,36 Q52,52 32,56 Q12,52 12,36 Q12,16 32,8" fill="${opts.fill || opts.color}"/>
            <path d="M32,12 L32,52" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.5"/>
            <path d="M32,24 Q24,28 20,36" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.3" fill="none"/>
            <path d="M32,24 Q40,28 44,36" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.3" fill="none"/>
            <path d="M32,36 Q24,40 18,48" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.3" fill="none"/>
            <path d="M32,36 Q40,40 46,48" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.3" fill="none"/>
        </g>`;
    }

    renderCrystal(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <polygon points="32,4 44,24 44,48 32,60 20,48 20,24" fill="${opts.fill || opts.color}" stroke="${opts.stroke}" stroke-width="${this.strokeWidth}"/>
            <polygon points="32,4 44,24 32,32 20,24" fill="${opts.secondaryColor || '#ffffff'}" opacity="0.3"/>
            <line x1="32" y1="4" x2="32" y2="60" stroke="${opts.secondaryColor || '#ffffff'}" stroke-width="1" opacity="0.2"/>
        </g>`;
    }

    // ============================================
    // ADDITIONAL SYMBOLS
    // ============================================

    renderInfinity(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M32,32 Q16,16 8,32 Q16,48 32,32 Q48,16 56,32 Q48,48 32,32" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderSpiral(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M32,32 Q36,28 40,32 Q44,36 40,40 Q36,44 32,40 Q28,36 32,32 Q40,24 48,32 Q56,40 48,48 Q40,56 32,48 Q24,40 32,32 Q44,20 56,32" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderLabyrinth(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="32" cy="32" r="24" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <circle cx="32" cy="32" r="18" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <circle cx="32" cy="32" r="12" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <circle cx="32" cy="32" r="6" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <circle cx="32" cy="32" r="2" fill="${opts.fill || opts.color}"/>
            <path d="M32,8 L32,14" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
            <path d="M32,20 L32,26" stroke="${opts.stroke || opts.color}" stroke-width="2"/>
        </g>`;
    }

    renderMandala(opts) {
        const petals = [];
        for (let i = 0; i < 8; i++) {
            const angle = i * 45;
            petals.push(`<ellipse cx="32" cy="18" rx="6" ry="12" fill="${opts.fill || opts.color}" transform="rotate(${angle} 32 32)" opacity="${0.6 + (i % 2) * 0.2}"/>`);
        }
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="32" cy="32" r="24" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            ${petals.join('')}
            <circle cx="32" cy="32" r="8" fill="${opts.secondaryColor || opts.color}"/>
            <circle cx="32" cy="32" r="4" fill="${opts.fill || '#ffffff'}" opacity="0.5"/>
        </g>`;
    }

    renderChakra(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="32" cy="32" r="20" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            ${[0, 60, 120, 180, 240, 300].map(angle => {
                const rad = angle * Math.PI / 180;
                const x = 32 + 20 * Math.cos(rad);
                const y = 32 + 20 * Math.sin(rad);
                return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${opts.fill || opts.color}"/>`;
            }).join('')}
            <circle cx="32" cy="32" r="6" fill="${opts.secondaryColor || opts.color}"/>
        </g>`;
    }

    renderRune(opts) {
        // Algiz rune (protection)
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <line x1="32" y1="8" x2="32" y2="56" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="32" y1="20" x2="16" y2="8" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <line x1="32" y1="20" x2="48" y2="8" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
        </g>`;
    }

    renderSigil(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <circle cx="32" cy="32" r="22" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1"/>
            <polygon points="32,12 38,28 56,28 42,38 48,56 32,44 16,56 22,38 8,28 26,28" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <circle cx="32" cy="32" r="6" fill="${opts.fill || opts.color}"/>
        </g>`;
    }

    renderAwen(opts) {
        // Celtic Awen symbol - three rays
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M20,8 L20,48" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M32,8 L32,48" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M44,8 L44,48" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <circle cx="20" cy="52" r="4" fill="${opts.fill || opts.color}"/>
            <circle cx="32" cy="52" r="4" fill="${opts.fill || opts.color}"/>
            <circle cx="44" cy="52" r="4" fill="${opts.fill || opts.color}"/>
            <path d="M8,12 Q32,4 56,12" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="1" opacity="0.5"/>
        </g>`;
    }

    renderTriquetra(opts) {
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            <path d="M32,12 Q44,20 44,32 Q44,44 32,44 Q20,44 20,32 Q20,20 32,12" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M32,12 Q20,24 32,32 Q44,40 32,52" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <path d="M20,44 Q32,36 44,44" fill="none" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>
            <circle cx="32" cy="32" r="4" fill="${opts.fill || opts.color}"/>
        </g>`;
    }

    renderHelmOfAwe(opts) {
        // Aegishjalmur - Norse symbol of protection
        const lines = [];
        for (let i = 0; i < 8; i++) {
            const angle = i * 45 * Math.PI / 180;
            const x2 = 32 + 24 * Math.cos(angle);
            const y2 = 32 + 24 * Math.sin(angle);
            lines.push(`<line x1="32" y1="32" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${opts.stroke || opts.color}" stroke-width="${this.strokeWidth}"/>`);
            // Add small perpendicular lines at the end
            const perpAngle = angle + Math.PI / 2;
            const px1 = x2 + 4 * Math.cos(perpAngle);
            const py1 = y2 + 4 * Math.sin(perpAngle);
            const px2 = x2 - 4 * Math.cos(perpAngle);
            const py2 = y2 - 4 * Math.sin(perpAngle);
            lines.push(`<line x1="${px1.toFixed(1)}" y1="${py1.toFixed(1)}" x2="${px2.toFixed(1)}" y2="${py2.toFixed(1)}" stroke="${opts.stroke || opts.color}" stroke-width="1"/>`);
        }
        return `<g ${opts.transformAttr} ${opts.opacityAttr} ${opts.animClass}>
            ${lines.join('')}
            <circle cx="32" cy="32" r="4" fill="${opts.fill || opts.color}"/>
        </g>`;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Generate polygon points for regular polygons
     */
    getPolygonPoints(sides, radius, cx, cy, startAngle = 0) {
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (startAngle + (i * 360 / sides)) * Math.PI / 180;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        return points.join(' ');
    }

    /**
     * Generate star polygon points
     */
    getStarPoints(points, outerRadius, innerRadius, cx, cy, startAngle = 0) {
        const result = [];
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (startAngle + (i * 180 / points)) * Math.PI / 180;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            result.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        return result.join(' ');
    }

    /**
     * Get all available shapes
     */
    getShapes() {
        return this.shapeCategories;
    }

    /**
     * Get all shape names
     */
    getAllShapeNames() {
        return this.allShapes;
    }

    /**
     * Get shapes by category
     */
    getShapesByCategory(category) {
        return this.shapeCategories[category] || [];
    }

    /**
     * Get available colors
     */
    getColors() {
        return Object.keys(this.colors);
    }

    /**
     * Refresh theme colors (call after theme change)
     */
    refreshColors() {
        this.colors = this.loadThemeColors();
    }

    /**
     * Generate a random icon
     */
    generateRandom(options = {}) {
        const randomShape = this.allShapes[Math.floor(Math.random() * this.allShapes.length)];
        const colorKeys = Object.keys(this.colors);
        const randomColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
        const styles = ['filled', 'outline', 'gradient'];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];

        return this.generate({
            shape: randomShape,
            color: randomColor,
            style: randomStyle,
            ...options
        });
    }

    /**
     * Generate icon for specific mythology
     */
    generateForMythology(mythology, options = {}) {
        const mythologyShapes = {
            egyptian: ['ankh', 'eye-of-horus', 'eye-of-ra', 'scarab', 'lotus'],
            greek: ['caduceus', 'trident', 'thunderbolt', 'ouroboros', 'labyrinth'],
            norse: ['mjolnir', 'valknut', 'helm-of-awe', 'rune', 'tree-of-life'],
            celtic: ['triskelion', 'triquetra', 'awen', 'spiral'],
            hindu: ['om', 'lotus', 'chakra', 'sri-yantra', 'mandala'],
            buddhist: ['lotus', 'chakra', 'mandala', 'infinity', 'spiral'],
            christian: ['cross', 'wings', 'star', 'hexagram'],
            islamic: ['crescent', 'star', 'hexagram', 'mandala'],
            japanese: ['lotus', 'wave', 'mountain', 'dragon-head', 'sun'],
            chinese: ['dragon-head', 'yin-yang', 'lotus', 'wave', 'mountain']
        };

        const shapes = mythologyShapes[mythology] || this.allShapes;
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        const mythologyColor = this.colors[mythology] || this.colors.primary;

        return this.generate({
            shape: options.shape || randomShape,
            color: options.color || mythology,
            ...options
        });
    }

    /**
     * Export icon as data URL
     */
    toDataURL(svgString) {
        const encoded = encodeURIComponent(svgString);
        return `data:image/svg+xml,${encoded}`;
    }

    /**
     * Export icon as Base64
     */
    toBase64(svgString) {
        const encoded = btoa(unescape(encodeURIComponent(svgString)));
        return `data:image/svg+xml;base64,${encoded}`;
    }
}

// Export globally
window.IconGenerator = IconGenerator;
