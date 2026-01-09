/**
 * AI Icon Generator
 * Eyes of Azrael Project
 *
 * Smart deterministic SVG icon generator that analyzes entity metadata
 * and creates appropriate visual representations.
 *
 * Features:
 * - Domain-based visual element mapping
 * - Mythology-specific color schemes
 * - Composite icon generation from multiple attributes
 * - Fallback to symbolic representations
 * - Clean, geometric SVG output
 */

class AIIconGenerator {
    constructor() {
        // Domain to visual element mapping
        this.domainElements = {
            // War and Combat
            'war': { path: 'M10,5 L50,20 L90,5 L90,35 L50,50 L10,35 Z M30,25 L70,25 M50,10 L50,45', color: '#dc2626', desc: 'crossed swords' },
            'battle': { path: 'M20,40 L40,10 L50,20 L60,10 L80,40 L50,50 Z', color: '#dc2626', desc: 'battle formation' },
            'strength': { path: 'M30,20 Q50,10 70,20 L70,80 Q50,70 30,80 Z M40,35 L60,35 M40,50 L60,50', color: '#dc2626', desc: 'shield' },

            // Wisdom and Knowledge
            'wisdom': { path: 'M50,15 Q30,20 25,40 Q25,55 50,60 Q75,55 75,40 Q70,20 50,15 M35,40 A5,5 0 1,1 36,40 M64,40 A5,5 0 1,1 65,40 M42,52 Q50,48 58,52', color: '#8b7fff', desc: 'owl face' },
            'knowledge': { path: 'M30,20 L30,80 L70,80 L70,20 Z M30,35 L70,35 M30,50 L70,50 M30,65 L70,65', color: '#3b82f6', desc: 'book' },
            'magic': { path: 'M50,10 L55,35 L80,35 L60,50 L70,75 L50,60 L30,75 L40,50 L20,35 L45,35 Z', color: '#8b7fff', desc: 'pentagram' },
            'prophecy': { path: 'M50,20 A25,25 0 1,1 50,21 M45,30 L55,30 M50,25 L50,40 M40,50 A10,10 0 1,0 60,50', color: '#6366f1', desc: 'crystal ball' },

            // Love and Beauty
            'love': { path: 'M50,75 L25,45 Q20,35 25,25 Q35,15 50,25 Q65,15 75,25 Q80,35 75,45 Z', color: '#ec4899', desc: 'heart' },
            'beauty': { path: 'M50,25 Q30,35 30,50 Q30,70 50,75 Q70,70 70,50 Q70,35 50,25 M40,45 A3,3 0 1,1 41,45 M59,45 A3,3 0 1,1 60,45', color: '#f472b6', desc: 'rose' },
            'fertility': { path: 'M35,60 Q35,40 45,30 Q50,25 55,30 Q65,40 65,60 L65,75 Q50,80 35,75 Z M45,45 L55,45 M45,55 L55,55', color: '#22c55e', desc: 'seed' },

            // Death and Underworld
            'death': { path: 'M50,20 L40,30 L30,40 L30,60 L50,80 L70,60 L70,40 L60,30 Z M38,45 A4,4 0 1,1 39,45 M61,45 A4,4 0 1,1 62,45 M40,60 Q50,55 60,60', color: '#0f172a', desc: 'skull' },
            'underworld': { path: 'M20,50 L30,70 L70,70 L80,50 L75,30 L25,30 Z M35,45 L45,55 M55,55 L65,45', color: '#1e293b', desc: 'gate' },
            'souls': { path: 'M50,25 Q40,30 40,42 Q40,50 50,55 Q60,50 60,42 Q60,30 50,25 M45,65 Q50,60 55,65 L55,75 L45,75 Z', color: '#64748b', desc: 'spirit' },

            // Nature
            'nature': { path: 'M50,70 L50,40 M30,50 Q40,40 50,40 Q60,40 70,50 M25,60 Q35,55 50,55 Q65,55 75,60 M20,70 Q30,65 50,65 Q70,65 80,70', color: '#22c55e', desc: 'tree' },
            'forest': { path: 'M30,60 L35,40 L30,40 L40,20 L35,20 L45,10 L55,20 L50,20 L60,40 L55,40 L60,60 M45,60 L45,70 M30,70 L60,70', color: '#16a34a', desc: 'pine tree' },
            'earth': { path: 'M50,50 A30,30 0 1,1 50,51 M35,40 Q40,45 45,40 M55,60 Q60,55 65,60 M40,60 L45,65 L40,70', color: '#92400e', desc: 'planet' },
            'agriculture': { path: 'M30,70 Q30,50 40,40 Q45,35 50,35 Q55,35 60,40 Q70,50 70,70 M40,50 L60,50 M35,60 L65,60', color: '#ca8a04', desc: 'wheat' },

            // Sky and Celestial
            'sky': { path: 'M20,60 Q30,50 50,50 Q70,50 80,60 L75,70 L25,70 Z M35,30 L40,40 L50,35 L60,40 L65,30', color: '#3b82f6', desc: 'clouds' },
            'sun': { path: 'M50,50 A15,15 0 1,1 50,51 M50,20 L50,30 M50,70 L50,80 M20,50 L30,50 M70,50 L80,50 M30,30 L36,36 M64,64 L70,70 M70,30 L64,36 M36,64 L30,70', color: '#f59e0b', desc: 'sun' },
            'moon': { path: 'M60,25 Q45,25 35,35 Q25,45 25,60 Q25,70 35,75 Q50,75 60,65 Q55,55 55,45 Q55,35 60,25', color: '#e5e7eb', desc: 'crescent moon' },
            'stars': { path: 'M50,20 L52,32 L65,32 L55,40 L58,52 L50,44 L42,52 L45,40 L35,32 L48,32 Z M25,30 L27,35 L32,35 L28,38 L30,43 L25,40 L20,43 L22,38 L18,35 L23,35 Z M75,55 L77,60 L82,60 L78,63 L80,68 L75,65 L70,68 L72,63 L68,60 L73,60 Z', color: '#fbbf24', desc: 'stars' },
            'thunder': { path: 'M55,15 L35,45 L50,45 L30,80 L60,50 L45,50 L65,15 Z', color: '#eab308', desc: 'lightning' },
            'storm': { path: 'M20,45 Q30,35 50,35 Q70,35 80,45 L75,55 L25,55 Z M45,60 L40,70 M50,60 L50,75 M55,60 L60,70', color: '#475569', desc: 'storm cloud' },

            // Water and Sea
            'sea': { path: 'M10,50 Q20,40 30,50 Q40,60 50,50 Q60,40 70,50 Q80,60 90,50 L90,80 L10,80 Z M15,65 Q25,60 35,65 Q45,70 55,65 Q65,60 75,65 Q85,70 90,65', color: '#0ea5e9', desc: 'waves' },
            'water': { path: 'M50,25 Q45,30 45,38 Q45,43 50,48 Q55,43 55,38 Q55,30 50,25 M40,55 Q38,60 38,65 Q38,68 40,70 Q42,68 42,65 Q42,60 40,55 M60,55 Q58,60 58,65 Q58,68 60,70 Q62,68 62,65 Q62,60 60,55', color: '#06b6d4', desc: 'water drops' },
            'rivers': { path: 'M20,30 Q30,40 40,35 Q50,30 60,40 Q70,50 80,45 L80,70 Q70,65 60,70 Q50,75 40,70 Q30,65 20,70 Z', color: '#0891b2', desc: 'river' },
            'ocean': { path: 'M10,45 Q25,35 40,45 Q55,55 70,45 Q85,35 90,45 M10,55 Q25,48 40,55 Q55,62 70,55 Q85,48 90,55 M10,65 Q25,60 40,65 Q55,70 70,65 Q85,60 90,65', color: '#0c4a6e', desc: 'ocean waves' },

            // Fire
            'fire': { path: 'M50,20 Q45,30 45,40 Q45,50 50,60 Q48,50 48,45 Q48,38 52,35 Q55,42 55,50 Q55,58 50,65 Q45,60 42,55 Q38,48 40,40 Q42,30 50,20 M58,30 Q60,35 60,42 Q60,48 58,52', color: '#f97316', desc: 'flame' },
            'light': { path: 'M50,30 A20,20 0 1,1 50,31 M50,15 L50,25 M50,75 L50,85 M20,50 L30,50 M70,50 L80,50 M28,28 L35,35 M65,65 L72,72 M72,28 L65,35 M35,65 L28,72', color: '#fbbf24', desc: 'radiant light' },
            'heat': { path: 'M50,25 Q45,32 45,40 Q45,48 50,55 Q55,48 55,40 Q55,32 50,25 M35,35 Q33,40 33,45 Q33,50 35,53 M65,35 Q67,40 67,45 Q67,50 65,53 M42,60 L42,70 M50,62 L50,75 M58,60 L58,70', color: '#dc2626', desc: 'heat waves' },

            // Air and Wind
            'air': { path: 'M20,40 Q40,35 60,40 M20,50 Q50,48 80,50 M20,60 Q45,58 70,60', color: '#e0e7ff', desc: 'wind' },
            'wind': { path: 'M15,35 Q35,30 55,35 L58,35 A5,5 0 1,0 58,34 M15,50 Q45,48 75,50 L78,50 A5,5 0 1,0 78,49 M15,65 Q40,62 65,65 L68,65 A5,5 0 1,0 68,64', color: '#cbd5e1', desc: 'wind gusts' },
            'weather': { path: 'M25,40 Q35,30 55,30 Q70,30 75,40 L72,50 L28,50 Z M35,55 L32,65 M45,55 L42,65 M55,55 L52,65 M65,55 L62,65', color: '#94a3b8', desc: 'rain cloud' },

            // Justice and Order
            'justice': { path: 'M50,20 L50,60 M30,30 L30,50 L25,50 M70,30 L70,50 L75,50 M25,50 L25,55 L30,55 M75,50 L75,55 L70,55 M35,65 L65,65 L60,75 L40,75 Z', color: '#a855f7', desc: 'scales' },
            'law': { path: 'M30,25 L70,25 L70,75 L30,75 Z M40,35 L60,35 M40,45 L60,45 M40,55 L60,55 M40,65 L60,65 M50,25 L50,20', color: '#7c3aed', desc: 'law tablet' },
            'order': { path: 'M25,25 L75,25 L75,75 L25,75 Z M35,35 L65,35 L65,65 L35,65 Z M45,45 L55,45 L55,55 L45,55 Z', color: '#6366f1', desc: 'structure' },

            // Trickery and Chaos
            'trickery': { path: 'M35,35 Q30,45 35,55 Q40,60 50,60 Q60,60 65,55 Q70,45 65,35 Q60,30 50,30 Q40,30 35,35 M42,42 A3,3 0 1,1 43,42 M57,42 A3,3 0 1,1 58,42 M42,50 Q50,54 58,50', color: '#f59e0b', desc: 'trickster mask' },
            'chaos': { path: 'M30,30 L40,50 L25,60 M50,25 L50,50 L60,55 M70,35 L60,45 L75,65 M35,70 L50,75 L65,70', color: '#ef4444', desc: 'chaos symbol' },
            'cunning': { path: 'M25,50 Q30,40 40,38 Q50,37 60,38 Q70,40 75,50 Q70,45 60,43 Q50,42 40,43 Q30,45 25,50 M35,48 L38,52 M62,48 L65,52', color: '#fb923c', desc: 'fox eyes' },

            // Healing and Medicine
            'healing': { path: 'M50,25 L50,75 M25,50 L75,50', color: '#10b981', desc: 'healing cross' },
            'medicine': { path: 'M50,20 L50,80 M45,30 Q40,35 40,42 Q40,48 45,52 Q40,56 40,63 Q40,70 45,75 M55,30 Q60,35 60,42 Q60,48 55,52 Q60,56 60,63 Q60,70 55,75', color: '#059669', desc: 'caduceus' },
            'health': { path: 'M50,25 Q35,30 30,45 Q30,60 40,70 Q50,75 60,70 Q70,60 70,45 Q65,30 50,25 M42,48 L48,54 L58,44', color: '#14b8a6', desc: 'healthy heart' },

            // Time
            'time': { path: 'M50,50 A25,25 0 1,1 50,51 M50,30 L50,50 L65,55 M48,26 L52,26 M74,48 L74,52 M48,74 L52,74 M26,48 L26,52', color: '#64748b', desc: 'clock' },
            'fate': { path: 'M30,30 L70,30 L60,50 L70,70 L30,70 L40,50 Z M50,35 L50,45 M45,50 L55,50 M50,55 L50,65', color: '#8b5cf6', desc: 'hourglass' },
            'destiny': { path: 'M50,25 L60,40 L80,40 L65,52 L72,70 L50,58 L28,70 L35,52 L20,40 L40,40 Z M50,35 A10,10 0 1,1 50,36', color: '#a78bfa', desc: 'destiny star' },

            // Craftsmanship
            'craft': { path: 'M40,25 L60,25 L65,35 L60,70 L50,75 L40,70 L35,35 Z M45,40 L55,40 M43,50 L57,50 M42,60 L58,60', color: '#fb923c', desc: 'anvil' },
            'smithing': { path: 'M30,30 L40,30 L45,50 L40,70 L30,70 M60,50 L70,40 L80,40 L70,55 L80,55 L75,65 L60,65 Z', color: '#ea580c', desc: 'hammer' },
            'creation': { path: 'M50,20 Q40,25 35,35 Q30,50 35,65 Q40,75 50,80 Q60,75 65,65 Q70,50 65,35 Q60,25 50,20 M45,40 L55,40 M45,50 L55,50 M45,60 L55,60', color: '#8b7fff', desc: 'creation sphere' }
        };

        // Mythology-specific color palettes
        this.mythologyColors = {
            'greek': { primary: '#8b7fff', secondary: '#f59e0b', accent: '#e5e7eb' },
            'norse': { primary: '#3b82f6', secondary: '#64748b', accent: '#e0e7ff' },
            'egyptian': { primary: '#f59e0b', secondary: '#0ea5e9', accent: '#fef3c7' },
            'roman': { primary: '#dc2626', secondary: '#fbbf24', accent: '#fef2f2' },
            'hindu': { primary: '#f97316', secondary: '#8b5cf6', accent: '#fff7ed' },
            'celtic': { primary: '#22c55e', secondary: '#059669', accent: '#f0fdf4' },
            'aztec': { primary: '#dc2626', secondary: '#eab308', accent: '#fef2f2' },
            'mayan': { primary: '#059669', secondary: '#eab308', accent: '#ecfdf5' },
            'sumerian': { primary: '#0891b2', secondary: '#ca8a04', accent: '#ecfeff' },
            'babylonian': { primary: '#7c3aed', secondary: '#f59e0b', accent: '#faf5ff' },
            'persian': { primary: '#f59e0b', secondary: '#dc2626', accent: '#fffbeb' },
            'chinese': { primary: '#dc2626', secondary: '#eab308', accent: '#fef2f2' },
            'yoruba': { primary: '#f97316', secondary: '#14b8a6', accent: '#fff7ed' },
            'buddhist': { primary: '#f59e0b', secondary: '#8b5cf6', accent: '#fffbeb' },
            'christian': { primary: '#3b82f6', secondary: '#fbbf24', accent: '#eff6ff' },
            'default': { primary: '#8b7fff', secondary: '#f59e0b', accent: '#e5e7eb' }
        };

        // Entity type default symbols
        this.typeDefaults = {
            'deity': { symbol: 'stars', color: '#8b7fff' },
            'hero': { symbol: 'war', color: '#f59e0b' },
            'creature': { symbol: 'chaos', color: '#dc2626' },
            'item': { symbol: 'craft', color: '#fb923c' },
            'place': { symbol: 'earth', color: '#22c55e' },
            'concept': { symbol: 'wisdom', color: '#3b82f6' },
            'magic': { symbol: 'magic', color: '#8b5cf6' },
            'ritual': { symbol: 'fire', color: '#f97316' },
            'symbol': { symbol: 'stars', color: '#fbbf24' }
        };
    }

    /**
     * Generate SVG icon from entity data
     * @param {Object} entityData - Entity metadata
     * @returns {string} SVG code
     */
    generateIcon(entityData) {
        const {
            name = 'Entity',
            type = 'deity',
            mythology = 'greek',
            domains = [],
            symbols = [],
            description = '',
            attributes = {}
        } = entityData;

        // Analyze entity to determine visual elements
        const analysis = this.analyzeEntity(entityData);

        // Select appropriate visual elements
        const elements = this.selectVisualElements(analysis);

        // Get color scheme
        const colors = this.getColorScheme(mythology, elements);

        // Generate SVG
        const svg = this.composeSVG(elements, colors, name);

        return svg;
    }

    /**
     * Analyze entity data to extract visual cues
     */
    analyzeEntity(entityData) {
        const {
            type = 'deity',
            mythology = 'greek',
            domains = [],
            symbols = [],
            description = '',
            attributes = {}
        } = entityData;

        // Extract keywords from description
        const keywords = this.extractKeywords(description);

        // Combine all sources of visual information
        const visualCues = [
            ...domains,
            ...symbols,
            ...keywords,
            ...(attributes.powers || []),
            ...(attributes.associations || [])
        ].map(s => s.toLowerCase().trim());

        return {
            type,
            mythology,
            visualCues,
            primaryDomains: domains.slice(0, 3),
            primarySymbols: symbols.slice(0, 3)
        };
    }

    /**
     * Extract keywords from description
     */
    extractKeywords(description) {
        if (!description) return [];

        const text = description.toLowerCase();
        const keywords = [];

        // Check for domain-related keywords
        for (const domain in this.domainElements) {
            if (text.includes(domain)) {
                keywords.push(domain);
            }
        }

        return keywords;
    }

    /**
     * Select visual elements based on analysis
     */
    selectVisualElements(analysis) {
        const { type, visualCues, primaryDomains, primarySymbols } = analysis;
        const elements = [];

        // Priority 1: Primary domains
        for (const domain of primaryDomains) {
            const element = this.domainElements[domain.toLowerCase()];
            if (element) {
                elements.push({ ...element, weight: 3 });
                if (elements.length >= 2) break;
            }
        }

        // Priority 2: Primary symbols
        if (elements.length < 2) {
            for (const symbol of primarySymbols) {
                const element = this.domainElements[symbol.toLowerCase()];
                if (element) {
                    elements.push({ ...element, weight: 2 });
                    if (elements.length >= 2) break;
                }
            }
        }

        // Priority 3: Visual cues from description
        if (elements.length < 2) {
            for (const cue of visualCues) {
                const element = this.domainElements[cue];
                if (element) {
                    elements.push({ ...element, weight: 1 });
                    if (elements.length >= 2) break;
                }
            }
        }

        // Fallback: Use type default
        if (elements.length === 0) {
            const defaultSymbol = this.typeDefaults[type] || this.typeDefaults['deity'];
            const element = this.domainElements[defaultSymbol.symbol];
            if (element) {
                elements.push({ ...element, weight: 1 });
            }
        }

        return elements;
    }

    /**
     * Get color scheme for mythology and elements
     */
    getColorScheme(mythology, elements) {
        const mythColors = this.mythologyColors[mythology] || this.mythologyColors['default'];

        // If we have element-specific colors, blend them with mythology colors
        const elementColors = elements.map(e => e.color).filter(Boolean);

        return {
            primary: elementColors[0] || mythColors.primary,
            secondary: elementColors[1] || mythColors.secondary,
            accent: mythColors.accent,
            background: 'rgba(10, 14, 39, 0.1)'
        };
    }

    /**
     * Compose final SVG from elements and colors
     */
    composeSVG(elements, colors, title = 'Icon') {
        const viewBox = '0 0 100 100';
        const size = 64; // Default icon size

        // If we have multiple elements, composite them
        let paths = '';

        if (elements.length === 1) {
            // Single element - use as-is
            paths = `<path d="${elements[0].path}" fill="${colors.primary}" stroke="${colors.secondary}" stroke-width="2"/>`;
        } else if (elements.length >= 2) {
            // Multiple elements - layer them with opacity
            paths = `
                <path d="${elements[0].path}" fill="${colors.primary}" opacity="0.7" stroke="${colors.secondary}" stroke-width="1.5"/>
                <path d="${elements[1].path}" fill="${colors.secondary}" opacity="0.5" stroke="${colors.primary}" stroke-width="1"/>
            `;
        } else {
            // Fallback: simple circle with mythology color
            paths = `<circle cx="50" cy="50" r="35" fill="${colors.primary}" stroke="${colors.secondary}" stroke-width="3"/>`;
        }

        return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" aria-label="${title}">
    <title>${title}</title>
    <defs>
        <linearGradient id="grad-${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="100" height="100" fill="${colors.background}" rx="15"/>
    ${paths}
</svg>`;
    }

    /**
     * Generate icon with options
     * @param {Object} entityData - Entity metadata
     * @param {Object} options - Generation options
     * @returns {Object} Result with SVG and metadata
     */
    generateWithOptions(entityData, options = {}) {
        const {
            style = 'symbolic', // symbolic, detailed, minimalist, geometric
            size = 64,
            colorScheme = 'auto' // auto, monochrome, vibrant, muted
        } = options;

        try {
            const svg = this.generateIcon(entityData);

            return {
                success: true,
                svgCode: svg,
                metadata: {
                    entityName: entityData.name,
                    entityType: entityData.type,
                    mythology: entityData.mythology,
                    generatedAt: new Date().toISOString(),
                    style,
                    size
                }
            };
        } catch (error) {
            console.error('Icon generation error:', error);
            return {
                success: false,
                error: error.message,
                svgCode: this.generateFallbackIcon(entityData.name || 'Icon')
            };
        }
    }

    /**
     * Generate fallback icon when generation fails
     */
    generateFallbackIcon(title = 'Icon') {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    <title>${title}</title>
    <rect width="100" height="100" fill="rgba(139, 127, 255, 0.2)" rx="15"/>
    <circle cx="50" cy="50" r="30" fill="none" stroke="#8b7fff" stroke-width="3"/>
    <text x="50" y="60" font-size="40" text-anchor="middle" fill="#8b7fff" font-family="Arial">?</text>
</svg>`;
    }

    /**
     * Regenerate icon with different parameters
     */
    regenerateIcon(entityData, previousResult) {
        // Try with slightly different approach
        const variation = Math.random();

        // Shuffle visual cues to get different element selection
        if (entityData.domains) {
            entityData.domains = [...entityData.domains].sort(() => variation - 0.5);
        }

        return this.generateIcon(entityData);
    }

    /**
     * Batch generate icons for multiple entities
     * @param {Array} entities - Array of entity data objects
     * @param {Function} progressCallback - Called with progress updates
     * @returns {Promise<Array>} Results for each entity
     */
    async batchGenerate(entities, progressCallback = null) {
        const results = [];

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];

            try {
                const result = this.generateWithOptions(entity);
                results.push({
                    entityId: entity.id,
                    entityName: entity.name,
                    ...result
                });
            } catch (error) {
                results.push({
                    entityId: entity.id,
                    entityName: entity.name,
                    success: false,
                    error: error.message
                });
            }

            if (progressCallback) {
                progressCallback({
                    current: i + 1,
                    total: entities.length,
                    percent: Math.round(((i + 1) / entities.length) * 100)
                });
            }

            // Small delay to prevent overwhelming the browser
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return results;
    }

    /**
     * Validate generated SVG with comprehensive checks
     * @param {string} svgCode - SVG code to validate
     * @returns {Object} Validation result with valid flag and errors array
     */
    validateSVG(svgCode) {
        const errors = [];
        const warnings = [];

        // Basic checks
        if (!svgCode || typeof svgCode !== 'string') {
            return { valid: false, errors: ['Invalid SVG code - must be a non-empty string'], warnings: [] };
        }

        const trimmed = svgCode.trim();

        // Check for SVG structure
        if (!trimmed.includes('<svg')) {
            errors.push('Missing <svg> element');
        }

        if (!trimmed.includes('</svg>')) {
            errors.push('SVG not properly closed - missing </svg>');
        }

        // Check for required attributes
        if (!/<svg[^>]*viewBox=/i.test(trimmed)) {
            warnings.push('Missing viewBox attribute - icon may not scale properly');
        }

        if (!/<svg[^>]*xmlns=/i.test(trimmed)) {
            warnings.push('Missing xmlns attribute - may cause issues in some browsers');
        }

        // Check for potentially dangerous content (XSS prevention)
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,  // event handlers like onclick=
            /<iframe/i,
            /<object/i,
            /<embed/i
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(trimmed)) {
                errors.push('SVG contains potentially dangerous content (scripts or event handlers)');
                break;
            }
        }

        // Check for valid path syntax
        const pathElements = trimmed.match(/<path[^>]*d="([^"]*)"[^>]*>/gi) || [];
        for (const pathEl of pathElements) {
            const dAttr = pathEl.match(/d="([^"]*)"/);
            if (dAttr && dAttr[1]) {
                const pathData = dAttr[1];
                // Very basic path validation - check for valid commands
                const validCommands = /^[MmZzLlHhVvCcSsQqTtAa0-9\s,.-]+$/;
                if (!validCommands.test(pathData)) {
                    warnings.push('Path data may contain invalid characters');
                }
            }
        }

        // Check file size (warn if over 50KB)
        if (trimmed.length > 50000) {
            warnings.push('SVG is larger than 50KB - consider optimizing');
        }

        // Check for reasonable dimensions
        const viewBoxMatch = trimmed.match(/viewBox=["']([^"']*)["']/);
        if (viewBoxMatch) {
            const parts = viewBoxMatch[1].split(/[\s,]+/);
            if (parts.length === 4) {
                const width = parseFloat(parts[2]);
                const height = parseFloat(parts[3]);
                if (width > 2000 || height > 2000) {
                    warnings.push('ViewBox dimensions are very large - may affect performance');
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            sanitized: errors.length === 0 ? this.sanitizeSVG(trimmed) : null
        };
    }

    /**
     * Sanitize SVG by removing potentially dangerous elements
     * @param {string} svgCode - SVG code to sanitize
     * @returns {string} Sanitized SVG
     */
    sanitizeSVG(svgCode) {
        let sanitized = svgCode;

        // Remove script tags
        sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

        // Remove event handlers
        sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');

        // Remove javascript: URLs
        sanitized = sanitized.replace(/javascript:[^"']*/gi, '');

        // Remove external references that could be tracking pixels
        sanitized = sanitized.replace(/xlink:href\s*=\s*["'](?!#)[^"']*["']/gi, '');

        return sanitized;
    }

    /**
     * Style presets for icon generation
     */
    static STYLE_PRESETS = {
        symbolic: {
            name: 'Symbolic',
            description: 'Clean, iconic symbols with minimal detail',
            strokeWidth: 2,
            fillOpacity: 0.7,
            strokeOpacity: 1,
            useGradients: false,
            cornerRadius: 15
        },
        detailed: {
            name: 'Detailed',
            description: 'Rich, intricate designs with layered elements',
            strokeWidth: 1.5,
            fillOpacity: 0.8,
            strokeOpacity: 0.9,
            useGradients: true,
            cornerRadius: 12
        },
        minimalist: {
            name: 'Minimalist',
            description: 'Simple, modern aesthetic with clean lines',
            strokeWidth: 2.5,
            fillOpacity: 0.5,
            strokeOpacity: 1,
            useGradients: false,
            cornerRadius: 20
        },
        geometric: {
            name: 'Geometric',
            description: 'Sacred geometry patterns with precise shapes',
            strokeWidth: 1,
            fillOpacity: 0.6,
            strokeOpacity: 1,
            useGradients: true,
            cornerRadius: 0
        },
        vintage: {
            name: 'Vintage',
            description: 'Classic, aged appearance with muted tones',
            strokeWidth: 1.5,
            fillOpacity: 0.75,
            strokeOpacity: 0.85,
            useGradients: false,
            cornerRadius: 10
        },
        neon: {
            name: 'Neon',
            description: 'Glowing, vibrant cyberpunk aesthetic',
            strokeWidth: 2,
            fillOpacity: 0.3,
            strokeOpacity: 1,
            useGradients: true,
            cornerRadius: 15,
            glowEffect: true
        }
    };

    /**
     * Theme color palettes
     */
    static THEME_PALETTES = {
        night: {
            name: 'Night',
            background: 'rgba(10, 14, 39, 0.9)',
            primary: '#8b7fff',
            secondary: '#667eea',
            accent: '#a78bfa'
        },
        cosmic: {
            name: 'Cosmic',
            background: 'rgba(15, 10, 30, 0.9)',
            primary: '#ec4899',
            secondary: '#8b5cf6',
            accent: '#f472b6'
        },
        sacred: {
            name: 'Sacred',
            background: 'rgba(20, 15, 10, 0.9)',
            primary: '#f59e0b',
            secondary: '#d97706',
            accent: '#fbbf24'
        },
        golden: {
            name: 'Golden',
            background: 'rgba(25, 20, 10, 0.9)',
            primary: '#fbbf24',
            secondary: '#f59e0b',
            accent: '#fcd34d'
        },
        ocean: {
            name: 'Ocean',
            background: 'rgba(5, 15, 25, 0.9)',
            primary: '#06b6d4',
            secondary: '#0891b2',
            accent: '#22d3ee'
        },
        fire: {
            name: 'Fire',
            background: 'rgba(20, 5, 5, 0.9)',
            primary: '#ef4444',
            secondary: '#dc2626',
            accent: '#f97316'
        },
        nature: {
            name: 'Nature',
            background: 'rgba(10, 20, 10, 0.9)',
            primary: '#22c55e',
            secondary: '#16a34a',
            accent: '#4ade80'
        }
    };

    /**
     * Generate icon with specific style preset
     * @param {Object} entityData - Entity metadata
     * @param {string} styleName - Style preset name
     * @param {string} themeName - Theme palette name
     * @returns {Object} Result with SVG and metadata
     */
    generateWithStyle(entityData, styleName = 'symbolic', themeName = 'night') {
        const style = AIIconGenerator.STYLE_PRESETS[styleName] || AIIconGenerator.STYLE_PRESETS.symbolic;
        const theme = AIIconGenerator.THEME_PALETTES[themeName] || AIIconGenerator.THEME_PALETTES.night;

        try {
            // Analyze entity to determine visual elements
            const analysis = this.analyzeEntity(entityData);
            const elements = this.selectVisualElements(analysis);

            // Apply style and theme
            const svg = this.composeSVGWithStyle(elements, entityData, style, theme);

            return {
                success: true,
                svgCode: svg,
                metadata: {
                    entityName: entityData.name,
                    entityType: entityData.type,
                    mythology: entityData.mythology,
                    style: styleName,
                    theme: themeName,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Icon generation error:', error);
            return {
                success: false,
                error: error.message,
                svgCode: this.generateFallbackIcon(entityData.name || 'Icon')
            };
        }
    }

    /**
     * Compose SVG with style and theme applied
     */
    composeSVGWithStyle(elements, entityData, style, theme) {
        const viewBox = '0 0 100 100';
        const size = 64;
        const timestamp = Date.now();
        const title = entityData.name || 'Icon';

        // Build gradient definitions if needed
        let defs = '';
        if (style.useGradients) {
            defs = `
        <linearGradient id="grad-primary-${timestamp}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${theme.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${theme.secondary};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad-secondary-${timestamp}" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${theme.secondary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:1" />
        </linearGradient>`;
        }

        // Add glow effect if neon style
        if (style.glowEffect) {
            defs += `
        <filter id="glow-${timestamp}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>`;
        }

        // Build paths based on elements and style
        let paths = '';
        const primaryColor = style.useGradients ? `url(#grad-primary-${timestamp})` : theme.primary;
        const secondaryColor = style.useGradients ? `url(#grad-secondary-${timestamp})` : theme.secondary;
        const glowFilter = style.glowEffect ? `filter="url(#glow-${timestamp})"` : '';

        if (elements.length === 1) {
            paths = `<path d="${elements[0].path}"
                fill="${primaryColor}"
                fill-opacity="${style.fillOpacity}"
                stroke="${theme.accent}"
                stroke-width="${style.strokeWidth}"
                stroke-opacity="${style.strokeOpacity}"
                ${glowFilter}/>`;
        } else if (elements.length >= 2) {
            paths = `
            <path d="${elements[0].path}"
                fill="${primaryColor}"
                fill-opacity="${style.fillOpacity * 0.9}"
                stroke="${theme.secondary}"
                stroke-width="${style.strokeWidth * 0.75}"
                ${glowFilter}/>
            <path d="${elements[1].path}"
                fill="${secondaryColor}"
                fill-opacity="${style.fillOpacity * 0.6}"
                stroke="${theme.primary}"
                stroke-width="${style.strokeWidth * 0.5}"
                ${glowFilter}/>`;
        } else {
            // Fallback circle
            paths = `<circle cx="50" cy="50" r="30"
                fill="${primaryColor}"
                fill-opacity="${style.fillOpacity}"
                stroke="${theme.accent}"
                stroke-width="${style.strokeWidth}"
                ${glowFilter}/>`;
        }

        return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" aria-label="${title}">
    <title>${title}</title>
    <defs>${defs}
    </defs>
    <rect width="100" height="100" fill="${theme.background}" rx="${style.cornerRadius}"/>
    ${paths}
</svg>`;
    }

    /**
     * Get all available style presets
     * @returns {Object} Style presets object
     */
    static getStylePresets() {
        return AIIconGenerator.STYLE_PRESETS;
    }

    /**
     * Get all available theme palettes
     * @returns {Object} Theme palettes object
     */
    static getThemePalettes() {
        return AIIconGenerator.THEME_PALETTES;
    }

    /**
     * Get example entity data for testing
     */
    static getExampleEntities() {
        return [
            {
                name: 'Zeus',
                type: 'deity',
                mythology: 'greek',
                domains: ['sky', 'thunder', 'justice'],
                symbols: ['lightning bolt', 'eagle', 'oak'],
                description: 'King of the gods, ruler of Mount Olympus, wielder of the thunderbolt'
            },
            {
                name: 'Athena',
                type: 'deity',
                mythology: 'greek',
                domains: ['wisdom', 'war', 'craft'],
                symbols: ['owl', 'olive', 'aegis'],
                description: 'Goddess of wisdom and strategic warfare'
            },
            {
                name: 'Poseidon',
                type: 'deity',
                mythology: 'greek',
                domains: ['sea', 'storms', 'earthquakes'],
                symbols: ['trident', 'horse', 'dolphin'],
                description: 'God of the sea and earthquakes'
            },
            {
                name: 'Hades',
                type: 'deity',
                mythology: 'greek',
                domains: ['underworld', 'death', 'wealth'],
                symbols: ['helm of darkness', 'cerberus', 'cypress'],
                description: 'God of the underworld and the dead'
            },
            {
                name: 'Aphrodite',
                type: 'deity',
                mythology: 'greek',
                domains: ['love', 'beauty', 'desire'],
                symbols: ['dove', 'rose', 'myrtle'],
                description: 'Goddess of love and beauty'
            }
        ];
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.AIIconGenerator = AIIconGenerator;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIIconGenerator;
}
