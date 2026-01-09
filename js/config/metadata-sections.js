/**
 * Metadata Sections Configuration
 *
 * Defines standardized metadata sections for all asset types in Eyes of Azrael.
 * This configuration ensures consistent metadata display across all entity types.
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    /**
     * Standard metadata sections organized by category
     * Each section includes display configuration, field mappings, and icons
     */
    const METADATA_SECTIONS = {
        // Identity information - who/what the entity is
        identity: {
            id: 'identity',
            title: 'Identity',
            icon: 'fingerprint',
            emoji: '\u{1F4DB}', // name badge
            priority: 1,
            fields: ['name', 'displayName', 'aliases', 'titles', 'epithets', 'alternateNames', 'alternativeNames'],
            collapsible: false,
            defaultExpanded: true,
            fieldConfig: {
                name: { label: 'Name', type: 'text', required: true },
                displayName: { label: 'Display Name', type: 'text' },
                aliases: { label: 'Aliases', type: 'list' },
                titles: { label: 'Titles', type: 'list' },
                epithets: { label: 'Epithets', type: 'list' },
                alternateNames: { label: 'Alternate Names', type: 'list' },
                alternativeNames: { label: 'Alternative Names', type: 'list' }
            }
        },

        // Classification information - categorization and type
        classification: {
            id: 'classification',
            title: 'Classification',
            icon: 'category',
            emoji: '\u{1F3F7}\uFE0F', // label
            priority: 2,
            fields: ['type', 'subtype', 'category', 'domains', 'aspects', 'archetypes', 'tags'],
            collapsible: true,
            defaultExpanded: true,
            fieldConfig: {
                type: { label: 'Type', type: 'text', badge: true },
                subtype: { label: 'Subtype', type: 'text', badge: true },
                category: { label: 'Category', type: 'text' },
                domains: { label: 'Domains', type: 'list', style: 'tags' },
                aspects: { label: 'Aspects', type: 'list', style: 'tags' },
                archetypes: { label: 'Archetypes', type: 'list', style: 'tags' },
                tags: { label: 'Tags', type: 'list', style: 'tags' }
            }
        },

        // Linguistic information - etymology, pronunciation, etc.
        linguistic: {
            id: 'linguistic',
            title: 'Linguistic Information',
            icon: 'translate',
            emoji: '\u{1F4DD}', // memo
            priority: 3,
            fields: ['originalName', 'originalScript', 'transliteration', 'pronunciation', 'meaning', 'etymology'],
            collapsible: true,
            defaultExpanded: false,
            fieldConfig: {
                originalName: { label: 'Original Name', type: 'text', style: 'script' },
                originalScript: { label: 'Original Script', type: 'text', style: 'script' },
                transliteration: { label: 'Transliteration', type: 'text' },
                pronunciation: { label: 'Pronunciation', type: 'text', style: 'ipa' },
                meaning: { label: 'Meaning', type: 'text' },
                etymology: { label: 'Etymology', type: 'object', subfields: ['origin', 'rootLanguage', 'derivation', 'cognates', 'historicalForms'] }
            }
        },

        // Geographical information - origins, locations, spread
        geographical: {
            id: 'geographical',
            title: 'Geographical Information',
            icon: 'globe',
            emoji: '\u{1F30D}', // globe
            priority: 4,
            fields: ['origin', 'region', 'culturalArea', 'temples', 'sacredSites', 'spread', 'modernCountries', 'coordinates'],
            collapsible: true,
            defaultExpanded: false,
            fieldConfig: {
                origin: { label: 'Origin', type: 'text' },
                region: { label: 'Region', type: 'text' },
                culturalArea: { label: 'Cultural Area', type: 'text' },
                temples: { label: 'Temples', type: 'list' },
                sacredSites: { label: 'Sacred Sites', type: 'list' },
                spread: { label: 'Geographic Spread', type: 'list' },
                modernCountries: { label: 'Modern Countries', type: 'list', style: 'tags' },
                coordinates: { label: 'Coordinates', type: 'coordinates' }
            }
        },

        // Chronological/temporal information
        chronological: {
            id: 'chronological',
            title: 'Timeline',
            icon: 'schedule',
            emoji: '\u{1F4C5}', // calendar
            priority: 5,
            fields: ['era', 'period', 'culturalPeriod', 'firstMention', 'firstAttestation', 'peakWorship', 'peakPopularity', 'timeline', 'mythologicalDate', 'historicalDate'],
            collapsible: true,
            defaultExpanded: false,
            fieldConfig: {
                era: { label: 'Era', type: 'text' },
                period: { label: 'Period', type: 'text' },
                culturalPeriod: { label: 'Cultural Period', type: 'text' },
                firstMention: { label: 'First Mention', type: 'date' },
                firstAttestation: { label: 'First Attestation', type: 'object' },
                peakWorship: { label: 'Peak Worship', type: 'date' },
                peakPopularity: { label: 'Peak Popularity', type: 'object' },
                timeline: { label: 'Timeline', type: 'timeline' },
                mythologicalDate: { label: 'Mythological Date', type: 'date' },
                historicalDate: { label: 'Historical Date', type: 'date' }
            }
        },

        // Relationship information (family, associations, mythological)
        relationships: {
            id: 'relationships',
            title: 'Relationships',
            icon: 'people',
            emoji: '\u{1F465}', // busts in silhouette
            priority: 6,
            fields: ['relationships', 'parentage', 'family', 'associations'],
            collapsible: true,
            defaultExpanded: true,
            subSections: {
                family: {
                    title: 'Family',
                    icon: 'family_restroom',
                    emoji: '\u{1F46A}', // family
                    fields: ['parents', 'father', 'mother', 'children', 'siblings', 'consorts', 'spouse', 'offspring']
                },
                associations: {
                    title: 'Associations',
                    icon: 'handshake',
                    emoji: '\u{1F91D}', // handshake
                    fields: ['allies', 'enemies', 'servants', 'worshippers', 'companions', 'rivals']
                },
                mythological: {
                    title: 'Mythological Connections',
                    icon: 'auto_stories',
                    emoji: '\u{1F4DA}', // books
                    fields: ['relatedDeities', 'relatedCreatures', 'relatedItems', 'relatedHeroes', 'relatedPlaces']
                }
            },
            fieldConfig: {
                parents: { label: 'Parents', type: 'relationship' },
                father: { label: 'Father', type: 'relationship' },
                mother: { label: 'Mother', type: 'relationship' },
                children: { label: 'Children', type: 'relationship' },
                siblings: { label: 'Siblings', type: 'relationship' },
                consorts: { label: 'Consorts', type: 'relationship' },
                spouse: { label: 'Spouse', type: 'relationship' },
                offspring: { label: 'Offspring', type: 'relationship' },
                allies: { label: 'Allies', type: 'relationship' },
                enemies: { label: 'Enemies', type: 'relationship' },
                servants: { label: 'Servants', type: 'relationship' },
                worshippers: { label: 'Worshippers', type: 'relationship' },
                companions: { label: 'Companions', type: 'relationship' },
                rivals: { label: 'Rivals', type: 'relationship' },
                relatedDeities: { label: 'Related Deities', type: 'entityList' },
                relatedCreatures: { label: 'Related Creatures', type: 'entityList' },
                relatedItems: { label: 'Related Items', type: 'entityList' },
                relatedHeroes: { label: 'Related Heroes', type: 'entityList' },
                relatedPlaces: { label: 'Related Places', type: 'entityList' }
            }
        },

        // Attributes - powers, symbols, associations
        attributes: {
            id: 'attributes',
            title: 'Attributes',
            icon: 'star',
            emoji: '\u2728', // sparkles
            priority: 7,
            fields: ['powers', 'abilities', 'symbols', 'animals', 'plants', 'colors', 'numbers', 'sacredObjects', 'weapons', 'attributes'],
            collapsible: true,
            defaultExpanded: true,
            fieldConfig: {
                powers: { label: 'Powers', type: 'list', style: 'cards' },
                abilities: { label: 'Abilities', type: 'list', style: 'cards' },
                symbols: { label: 'Symbols', type: 'list', style: 'icons' },
                animals: { label: 'Sacred Animals', type: 'list', style: 'icons' },
                plants: { label: 'Sacred Plants', type: 'list', style: 'icons' },
                colors: { label: 'Colors', type: 'list', style: 'colors' },
                numbers: { label: 'Sacred Numbers', type: 'list', style: 'badges' },
                sacredObjects: { label: 'Sacred Objects', type: 'list' },
                weapons: { label: 'Weapons', type: 'list', style: 'cards' },
                attributes: { label: 'Attributes', type: 'list', style: 'tags' }
            }
        },

        // Cultural context - worship, rituals, festivals
        cultural: {
            id: 'cultural',
            title: 'Cultural Context',
            icon: 'temple_hindu',
            emoji: '\u{1F3DB}\uFE0F', // classical building
            priority: 8,
            fields: ['worshipPractices', 'rituals', 'festivals', 'cultCenters', 'offerings', 'prayers', 'socialRole', 'modernLegacy'],
            collapsible: true,
            defaultExpanded: false,
            fieldConfig: {
                worshipPractices: { label: 'Worship Practices', type: 'list' },
                rituals: { label: 'Rituals', type: 'list', style: 'cards' },
                festivals: { label: 'Festivals', type: 'list', style: 'cards' },
                cultCenters: { label: 'Cult Centers', type: 'list', style: 'tags' },
                offerings: { label: 'Offerings', type: 'list' },
                prayers: { label: 'Prayers', type: 'list' },
                socialRole: { label: 'Social Role', type: 'text' },
                modernLegacy: { label: 'Modern Legacy', type: 'object' }
            }
        },

        // Metaphysical properties
        metaphysical: {
            id: 'metaphysical',
            title: 'Metaphysical Properties',
            icon: 'auto_awesome',
            emoji: '\u2728', // sparkles
            priority: 9,
            fields: ['element', 'primaryElement', 'energyType', 'chakra', 'planet', 'zodiac', 'sefirot', 'correspondences'],
            collapsible: true,
            defaultExpanded: false,
            fieldConfig: {
                element: { label: 'Element', type: 'text', style: 'element' },
                primaryElement: { label: 'Primary Element', type: 'text', style: 'element' },
                energyType: { label: 'Energy Type', type: 'text' },
                chakra: { label: 'Chakra', type: 'text', style: 'chakra' },
                planet: { label: 'Planet', type: 'text', style: 'planet' },
                zodiac: { label: 'Zodiac', type: 'list', style: 'zodiac' },
                sefirot: { label: 'Sefirot', type: 'list' },
                correspondences: { label: 'Correspondences', type: 'object' }
            }
        },

        // Sources and references
        sources: {
            id: 'sources',
            title: 'Sources & References',
            icon: 'menu_book',
            emoji: '\u{1F4DA}', // books
            priority: 10,
            fields: ['primarySources', 'secondarySources', 'modernReferences', 'sources', 'bibliography', 'textReferences'],
            collapsible: true,
            defaultExpanded: false,
            fieldConfig: {
                primarySources: { label: 'Primary Sources', type: 'citations' },
                secondarySources: { label: 'Secondary Sources', type: 'citations' },
                modernReferences: { label: 'Modern References', type: 'citations' },
                sources: { label: 'Sources', type: 'citations' },
                bibliography: { label: 'Bibliography', type: 'citations' },
                textReferences: { label: 'Text References', type: 'citations' }
            }
        },

        // Extended content and descriptions
        content: {
            id: 'content',
            title: 'Extended Content',
            icon: 'description',
            emoji: '\u{1F4C4}', // page facing up
            priority: 11,
            fields: ['description', 'shortDescription', 'longDescription', 'fullDescription', 'extendedContent', 'symbolism', 'significance'],
            collapsible: true,
            defaultExpanded: true,
            fieldConfig: {
                description: { label: 'Description', type: 'richtext' },
                shortDescription: { label: 'Summary', type: 'text' },
                longDescription: { label: 'Full Description', type: 'richtext' },
                fullDescription: { label: 'Full Description', type: 'richtext' },
                extendedContent: { label: 'Extended Content', type: 'sections' },
                symbolism: { label: 'Symbolism', type: 'richtext' },
                significance: { label: 'Significance', type: 'richtext' }
            }
        },

        // Related entities (cross-references)
        relatedEntities: {
            id: 'relatedEntities',
            title: 'Related Entities',
            icon: 'link',
            emoji: '\u{1F517}', // link
            priority: 12,
            fields: ['relatedEntities'],
            collapsible: true,
            defaultExpanded: true,
            categories: [
                { key: 'deities', label: 'Related Deities', icon: '\u{1F451}', color: '#FFD700' },
                { key: 'heroes', label: 'Related Heroes', icon: '\u2694\uFE0F', color: '#CD7F32' },
                { key: 'creatures', label: 'Related Creatures', icon: '\u{1F409}', color: '#4CAF50' },
                { key: 'places', label: 'Related Places', icon: '\u{1F3DB}\uFE0F', color: '#9C27B0' },
                { key: 'items', label: 'Related Items', icon: '\u2728', color: '#2196F3' },
                { key: 'texts', label: 'Related Texts', icon: '\u{1F4DC}', color: '#795548' },
                { key: 'symbols', label: 'Related Symbols', icon: '\u{1F4FF}', color: '#E91E63' },
                { key: 'concepts', label: 'Related Concepts', icon: '\u{1F4A1}', color: '#FF9800' },
                { key: 'archetypes', label: 'Related Archetypes', icon: '\u{1F3AD}', color: '#607D8B' }
            ]
        }
    };

    /**
     * Asset type specific configurations
     * Defines which sections are relevant for each entity type
     */
    const ASSET_TYPE_CONFIG = {
        deity: {
            primarySections: ['identity', 'classification', 'attributes', 'relationships', 'cultural', 'sources'],
            secondarySections: ['linguistic', 'geographical', 'chronological', 'metaphysical', 'relatedEntities'],
            hiddenFields: [],
            specialFields: {
                domains: { prominent: true },
                worshipPractices: { prominent: true }
            }
        },
        creature: {
            primarySections: ['identity', 'classification', 'attributes', 'content'],
            secondarySections: ['geographical', 'relationships', 'sources', 'relatedEntities'],
            hiddenFields: ['worshipPractices', 'festivals', 'cultCenters'],
            specialFields: {
                habitat: { label: 'Habitat', prominent: true },
                dangerLevel: { label: 'Danger Level', prominent: true, style: 'danger' }
            }
        },
        hero: {
            primarySections: ['identity', 'classification', 'relationships', 'content'],
            secondarySections: ['chronological', 'geographical', 'attributes', 'sources'],
            hiddenFields: ['worshipPractices'],
            specialFields: {
                quests: { label: 'Quests', prominent: true },
                feats: { label: 'Feats', prominent: true }
            }
        },
        item: {
            primarySections: ['identity', 'classification', 'attributes', 'content'],
            secondarySections: ['chronological', 'geographical', 'relationships', 'sources'],
            hiddenFields: ['worshipPractices', 'festivals'],
            specialFields: {
                powers: { prominent: true },
                wielders: { label: 'Wielders', prominent: true },
                materials: { label: 'Materials', type: 'list' }
            }
        },
        place: {
            primarySections: ['identity', 'geographical', 'content'],
            secondarySections: ['chronological', 'relationships', 'cultural', 'sources'],
            hiddenFields: [],
            specialFields: {
                inhabitants: { label: 'Inhabitants', prominent: true },
                guardians: { label: 'Guardians', prominent: true }
            }
        },
        text: {
            primarySections: ['identity', 'classification', 'content', 'sources'],
            secondarySections: ['chronological', 'geographical', 'linguistic'],
            hiddenFields: ['worshipPractices', 'rituals', 'festivals'],
            specialFields: {
                author: { label: 'Author', prominent: true },
                chapters: { label: 'Chapters', type: 'list' }
            }
        },
        symbol: {
            primarySections: ['identity', 'classification', 'content', 'cultural'],
            secondarySections: ['geographical', 'chronological', 'sources'],
            hiddenFields: [],
            specialFields: {
                meaning: { prominent: true },
                visualDescription: { label: 'Visual Description', prominent: true },
                usage: { label: 'Usage', prominent: true }
            }
        },
        herb: {
            primarySections: ['identity', 'classification', 'content'],
            secondarySections: ['cultural', 'geographical', 'sources'],
            hiddenFields: [],
            specialFields: {
                botanicalName: { label: 'Botanical Name', prominent: true, style: 'scientific' },
                properties: { label: 'Properties', prominent: true },
                preparationMethods: { label: 'Preparation Methods', type: 'list' }
            }
        },
        ritual: {
            primarySections: ['identity', 'classification', 'content', 'cultural'],
            secondarySections: ['chronological', 'geographical', 'sources'],
            hiddenFields: [],
            specialFields: {
                purpose: { label: 'Purpose', prominent: true },
                participants: { label: 'Participants', type: 'list' },
                timing: { label: 'Timing', type: 'text' }
            }
        },
        archetype: {
            primarySections: ['identity', 'classification', 'content'],
            secondarySections: ['relationships', 'sources', 'relatedEntities'],
            hiddenFields: ['geographical', 'chronological'],
            specialFields: {
                characteristics: { label: 'Characteristics', prominent: true },
                examples: { label: 'Examples', type: 'entityList' }
            }
        }
    };

    /**
     * Icons mapping for various metadata elements
     */
    const METADATA_ICONS = {
        // Sections
        identity: '\u{1F4DB}',
        classification: '\u{1F3F7}\uFE0F',
        linguistic: '\u{1F524}',
        geographical: '\u{1F30D}',
        chronological: '\u23F0',
        relationships: '\u{1F465}',
        attributes: '\u2728',
        cultural: '\u{1F3DB}\uFE0F',
        metaphysical: '\u{1F52E}',
        sources: '\u{1F4DA}',
        content: '\u{1F4C4}',
        relatedEntities: '\u{1F517}',

        // Relationship types
        parent: '\u{1F9D1}\u200D\u{1F467}',
        child: '\u{1F476}',
        spouse: '\u{1F48D}',
        sibling: '\u{1F46C}',
        ally: '\u{1F91D}',
        enemy: '\u2694\uFE0F',
        mentor: '\u{1F9D9}',
        companion: '\u{1F465}',
        servant: '\u{1F64F}',

        // Element types
        fire: '\u{1F525}',
        water: '\u{1F4A7}',
        earth: '\u{1FAA8}',
        air: '\u{1F4A8}',
        spirit: '\u2728',
        void: '\u26AB',
        light: '\u2600\uFE0F',
        dark: '\u{1F311}',

        // Mythology icons
        greek: '\u26A1',
        roman: '\u{1F985}',
        norse: '\u{1F528}',
        egyptian: '\u{1F3DB}\uFE0F',
        hindu: '\u{1F549}\uFE0F',
        buddhist: '\u2638\uFE0F',
        celtic: '\u2618\uFE0F',
        chinese: '\u{1F409}',
        japanese: '\u26E9\uFE0F',
        christian: '\u271D\uFE0F',
        jewish: '\u2721\uFE0F',
        islamic: '\u262A\uFE0F',
        mesopotamian: '\u{1F4DC}',
        mesoamerican: '\u{1F985}',

        // Entity types
        deity: '\u{1F451}',
        creature: '\u{1F409}',
        hero: '\u2694\uFE0F',
        item: '\u{1F48E}',
        place: '\u{1F3DF}\uFE0F',
        text: '\u{1F4DC}',
        symbol: '\u{1F4FF}',
        herb: '\u{1F33F}',
        ritual: '\u{1F56F}\uFE0F',
        archetype: '\u{1F3AD}'
    };

    /**
     * Color schemes for various metadata elements
     */
    const METADATA_COLORS = {
        // Entity type colors
        entityTypes: {
            deity: { primary: '#FFD700', secondary: '#FFA500', glow: 'rgba(255, 215, 0, 0.3)' },
            creature: { primary: '#4CAF50', secondary: '#8BC34A', glow: 'rgba(76, 175, 80, 0.3)' },
            hero: { primary: '#CD7F32', secondary: '#D2691E', glow: 'rgba(205, 127, 50, 0.3)' },
            item: { primary: '#9C27B0', secondary: '#E91E63', glow: 'rgba(156, 39, 176, 0.3)' },
            place: { primary: '#2196F3', secondary: '#03A9F4', glow: 'rgba(33, 150, 243, 0.3)' },
            text: { primary: '#795548', secondary: '#A1887F', glow: 'rgba(121, 85, 72, 0.3)' },
            symbol: { primary: '#FF5722', secondary: '#FF7043', glow: 'rgba(255, 87, 34, 0.3)' },
            herb: { primary: '#388E3C', secondary: '#66BB6A', glow: 'rgba(56, 142, 60, 0.3)' },
            ritual: { primary: '#7B1FA2', secondary: '#AB47BC', glow: 'rgba(123, 31, 162, 0.3)' },
            archetype: { primary: '#607D8B', secondary: '#90A4AE', glow: 'rgba(96, 125, 139, 0.3)' }
        },

        // Element colors
        elements: {
            fire: { bg: '#FF5722', text: '#FFFFFF' },
            water: { bg: '#2196F3', text: '#FFFFFF' },
            earth: { bg: '#795548', text: '#FFFFFF' },
            air: { bg: '#90CAF9', text: '#1565C0' },
            spirit: { bg: '#9C27B0', text: '#FFFFFF' },
            void: { bg: '#212121', text: '#FFFFFF' },
            light: { bg: '#FFC107', text: '#212121' },
            dark: { bg: '#37474F', text: '#FFFFFF' }
        },

        // Danger level colors
        dangerLevels: {
            harmless: { bg: '#4CAF50', text: '#FFFFFF' },
            low: { bg: '#8BC34A', text: '#212121' },
            moderate: { bg: '#FFC107', text: '#212121' },
            high: { bg: '#FF9800', text: '#212121' },
            dangerous: { bg: '#FF5722', text: '#FFFFFF' },
            deadly: { bg: '#F44336', text: '#FFFFFF' },
            extreme: { bg: '#B71C1C', text: '#FFFFFF' }
        }
    };

    /**
     * Field rendering configurations
     */
    const FIELD_RENDERERS = {
        text: {
            component: 'text-field',
            escapeHtml: true
        },
        richtext: {
            component: 'richtext-field',
            escapeHtml: false,
            markdown: true
        },
        list: {
            component: 'list-field',
            defaultStyle: 'bullet'
        },
        tags: {
            component: 'tags-field',
            clickable: true
        },
        date: {
            component: 'date-field',
            formats: ['display', 'year', 'start', 'end', 'circa']
        },
        coordinates: {
            component: 'coordinates-field',
            showMap: true
        },
        relationship: {
            component: 'relationship-field',
            linkable: true
        },
        entityList: {
            component: 'entity-list-field',
            showIcons: true,
            linkable: true
        },
        citations: {
            component: 'citations-field',
            format: 'academic'
        },
        timeline: {
            component: 'timeline-field',
            interactive: true
        },
        object: {
            component: 'object-field',
            expandable: true
        },
        sections: {
            component: 'sections-field',
            collapsible: true
        }
    };

    // Export to window for global access
    window.MetadataSections = {
        SECTIONS: METADATA_SECTIONS,
        ASSET_CONFIG: ASSET_TYPE_CONFIG,
        ICONS: METADATA_ICONS,
        COLORS: METADATA_COLORS,
        FIELD_RENDERERS: FIELD_RENDERERS,

        /**
         * Get sections for a specific asset type
         * @param {string} assetType - The type of asset (deity, creature, etc.)
         * @returns {Object} Configuration for the asset type
         */
        getSectionsForType: function(assetType) {
            const config = ASSET_TYPE_CONFIG[assetType] || ASSET_TYPE_CONFIG.deity;
            const sections = {};

            [...config.primarySections, ...config.secondarySections].forEach(sectionId => {
                if (METADATA_SECTIONS[sectionId]) {
                    sections[sectionId] = {
                        ...METADATA_SECTIONS[sectionId],
                        isPrimary: config.primarySections.includes(sectionId)
                    };
                }
            });

            return {
                sections,
                hiddenFields: config.hiddenFields || [],
                specialFields: config.specialFields || {}
            };
        },

        /**
         * Get icon for a metadata element
         * @param {string} key - The key to look up
         * @param {string} type - The type of icon (section, relationship, element, etc.)
         * @returns {string} The icon emoji
         */
        getIcon: function(key, type = 'section') {
            return METADATA_ICONS[key] || METADATA_ICONS[type] || '\u{1F4CB}';
        },

        /**
         * Get color configuration for an entity type
         * @param {string} type - The entity type
         * @returns {Object} Color configuration
         */
        getEntityColors: function(type) {
            return METADATA_COLORS.entityTypes[type] || METADATA_COLORS.entityTypes.deity;
        },

        /**
         * Get field renderer configuration
         * @param {string} fieldType - The type of field
         * @returns {Object} Renderer configuration
         */
        getFieldRenderer: function(fieldType) {
            return FIELD_RENDERERS[fieldType] || FIELD_RENDERERS.text;
        },

        /**
         * Check if a field has data
         * @param {*} value - The field value
         * @returns {boolean} Whether the field has data
         */
        hasData: function(value) {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object') return Object.keys(value).length > 0;
            return true;
        }
    };

    // Also export as ES module if supported
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.MetadataSections;
    }

})();
