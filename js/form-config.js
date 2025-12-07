/**
 * Centralized Form Configuration
 * Defines contextual field behavior, progressive disclosure, and smart field types
 * Eyes of Azrael - Theory Submission System
 */

window.formConfig = {
    /**
     * Contribution types and their specific field requirements
     */
    contributionTypes: {
        theory: {
            label: 'Theory / Analysis',
            description: 'Analyze existing content, draw connections, present hypotheses',
            sections: ['basic', 'classification', 'content', 'metadata', 'sources']
        },
        deity: {
            label: 'Deity / God',
            description: 'Add a deity, god, or divine being',
            sections: ['basic', 'classification', 'deity-details', 'content', 'metadata', 'sources'],
            requiredFields: ['pantheon', 'domain']
        },
        hero: {
            label: 'Hero / Figure',
            description: 'Add a hero, prophet, saint, or important figure',
            sections: ['basic', 'classification', 'hero-details', 'content', 'metadata', 'sources'],
            requiredFields: ['role', 'era']
        },
        creature: {
            label: 'Creature / Being',
            description: 'Add a mythological creature, angel, demon, or spirit',
            sections: ['basic', 'classification', 'creature-details', 'content', 'metadata', 'sources'],
            requiredFields: ['creatureType']
        },
        place: {
            label: 'Place / Location',
            description: 'Add a sacred place, realm, or location',
            sections: ['basic', 'classification', 'place-details', 'content', 'metadata', 'sources'],
            requiredFields: ['placeType', 'location']
        },
        item: {
            label: 'Item / Artifact',
            description: 'Add a sacred item, relic, or artifact',
            sections: ['basic', 'classification', 'item-details', 'content', 'metadata', 'sources'],
            requiredFields: ['itemType']
        },
        herb: {
            label: 'Herb / Plant',
            description: 'Add a sacred herb, plant, or botanical',
            sections: ['basic', 'classification', 'herb-details', 'content', 'metadata', 'sources'],
            requiredFields: ['botanical']
        },
        text: {
            label: 'Text / Scripture',
            description: 'Add a sacred text, scripture, or writing',
            sections: ['basic', 'classification', 'text-details', 'content', 'metadata', 'sources'],
            requiredFields: ['textType', 'author']
        },
        concept: {
            label: 'Concept / Teaching',
            description: 'Add a theological concept, teaching, or philosophy',
            sections: ['basic', 'classification', 'concept-details', 'content', 'metadata', 'sources'],
            requiredFields: ['conceptCategory']
        },
        mythology: {
            label: 'New Mythology',
            description: 'Add an entirely new mythology/tradition',
            sections: ['basic', 'classification', 'mythology-details', 'content', 'metadata', 'sources'],
            requiredFields: ['culture', 'region']
        }
    },

    /**
     * Location type configurations with hierarchical options
     */
    locationTypes: {
        earth: {
            label: 'Earth Location',
            fieldType: 'coordinates',
            options: [
                { value: 'search', label: 'Search for location', type: 'geocoder' },
                { value: 'coordinates', label: 'Enter coordinates', type: 'latlong' },
                { value: 'description', label: 'Describe location', type: 'text' }
            ]
        },
        mythical: {
            label: 'Mythical Realm',
            fieldType: 'hierarchical',
            options: [
                // Existing locations from website
                { value: 'heaven', label: 'Heaven / Paradise', parent: null },
                { value: 'hell', label: 'Hell / Underworld', parent: null },
                { value: 'purgatory', label: 'Purgatory / Limbo', parent: null },
                { value: 'eden', label: 'Garden of Eden', parent: 'heaven' },
                { value: 'tartarus', label: 'Tartarus', parent: 'hell' },
                { value: 'elysium', label: 'Elysian Fields', parent: 'heaven' },
                { value: 'valhalla', label: 'Valhalla', parent: 'heaven' },
                { value: 'asgard', label: 'Asgard', parent: null },
                { value: 'olympus', label: 'Mount Olympus', parent: null },
                { value: 'sheol', label: 'Sheol', parent: 'hell' },
                // User's previously used locations
                { value: 'user-locations', label: '--- My Locations ---', type: 'separator' },
                // Option to add new
                { value: 'custom', label: '+ Add New Mythical Location', type: 'custom' }
            ]
        },
        celestial: {
            label: 'Celestial Location',
            fieldType: 'hierarchical',
            options: [
                { value: 'sun', label: 'Sun / Solar' },
                { value: 'moon', label: 'Moon / Lunar' },
                { value: 'stars', label: 'Stars / Stellar' },
                { value: 'planets', label: 'Planets', parent: null },
                { value: 'mercury', label: 'Mercury', parent: 'planets' },
                { value: 'venus', label: 'Venus', parent: 'planets' },
                { value: 'mars', label: 'Mars', parent: 'planets' },
                { value: 'jupiter', label: 'Jupiter', parent: 'planets' },
                { value: 'saturn', label: 'Saturn', parent: 'planets' },
                { value: 'custom', label: '+ Add New Celestial Location', type: 'custom' }
            ]
        },
        abstract: {
            label: 'Abstract / Conceptual',
            fieldType: 'text',
            placeholder: 'Describe the conceptual or abstract nature of this location'
        }
    },

    /**
     * Smart field configurations
     */
    smartFields: {
        pantheon: {
            type: 'hierarchical',
            label: 'Pantheon / Divine Family',
            options: [
                // Greek
                { value: 'greek', label: 'Greek Pantheon', parent: null },
                { value: 'greek-olympians', label: 'Olympian Gods', parent: 'greek' },
                { value: 'greek-titans', label: 'Titans', parent: 'greek' },
                { value: 'greek-primordial', label: 'Primordial Deities', parent: 'greek' },
                // Norse
                { value: 'norse', label: 'Norse Pantheon', parent: null },
                { value: 'norse-aesir', label: 'Æsir', parent: 'norse' },
                { value: 'norse-vanir', label: 'Vanir', parent: 'norse' },
                // Egyptian
                { value: 'egyptian', label: 'Egyptian Pantheon', parent: null },
                { value: 'egyptian-ennead', label: 'Ennead of Heliopolis', parent: 'egyptian' },
                { value: 'egyptian-ogdoad', label: 'Ogdoad of Hermopolis', parent: 'egyptian' },
                // Hindu
                { value: 'hindu', label: 'Hindu Deities', parent: null },
                { value: 'hindu-trimurti', label: 'Trimurti', parent: 'hindu' },
                { value: 'hindu-devi', label: 'Devi (Goddesses)', parent: 'hindu' },
                // Abrahamic
                { value: 'abrahamic', label: 'Abrahamic Tradition', parent: null },
                { value: 'christian-trinity', label: 'Christian Trinity', parent: 'abrahamic' },
                { value: 'angels', label: 'Angels / Angelic Beings', parent: 'abrahamic' },
                // Custom
                { value: 'user-pantheons', label: '--- My Pantheons ---', type: 'separator' },
                { value: 'custom', label: '+ Add New Pantheon', type: 'custom' }
            ],
            allowCustom: true
        },

        domain: {
            type: 'multi-select',
            label: 'Divine Domain(s)',
            placeholder: 'Select or add domains',
            options: [
                // Natural
                { value: 'sky', label: '⛅ Sky / Weather', category: 'natural' },
                { value: 'sea', label: '🌊 Sea / Water', category: 'natural' },
                { value: 'earth', label: '🌍 Earth / Land', category: 'natural' },
                { value: 'fire', label: '🔥 Fire', category: 'natural' },
                { value: 'sun', label: '☀️ Sun / Light', category: 'natural' },
                { value: 'moon', label: '🌙 Moon / Night', category: 'natural' },
                { value: 'storms', label: '⚡ Storms / Thunder', category: 'natural' },
                // Human Affairs
                { value: 'war', label: '⚔️ War / Battle', category: 'human' },
                { value: 'love', label: '💕 Love / Beauty', category: 'human' },
                { value: 'wisdom', label: '🦉 Wisdom / Knowledge', category: 'human' },
                { value: 'death', label: '💀 Death / Underworld', category: 'human' },
                { value: 'fertility', label: '🌾 Fertility / Harvest', category: 'human' },
                { value: 'justice', label: '⚖️ Justice / Law', category: 'human' },
                { value: 'healing', label: '⚕️ Healing / Medicine', category: 'human' },
                { value: 'arts', label: '🎨 Arts / Music', category: 'human' },
                { value: 'commerce', label: '💰 Commerce / Trade', category: 'human' },
                // Abstract
                { value: 'time', label: '⏰ Time', category: 'abstract' },
                { value: 'fate', label: '🎭 Fate / Destiny', category: 'abstract' },
                { value: 'chaos', label: '🌀 Chaos / Disorder', category: 'abstract' },
                { value: 'order', label: '✨ Order / Harmony', category: 'abstract' },
                // Custom
                { value: 'custom', label: '+ Add Custom Domain', type: 'custom' }
            ],
            allowCustom: true
        },

        creatureType: {
            type: 'hierarchical',
            label: 'Creature Type',
            options: [
                { value: 'divine', label: 'Divine Beings', parent: null },
                { value: 'angels', label: 'Angels', parent: 'divine' },
                { value: 'demons', label: 'Demons', parent: 'divine' },
                { value: 'spirits', label: 'Spirits', parent: 'divine' },

                { value: 'mythical', label: 'Mythical Creatures', parent: null },
                { value: 'dragons', label: 'Dragons', parent: 'mythical' },
                { value: 'giants', label: 'Giants', parent: 'mythical' },
                { value: 'monsters', label: 'Monsters', parent: 'mythical' },

                { value: 'hybrid', label: 'Hybrid Beings', parent: null },
                { value: 'centaur', label: 'Centaurs', parent: 'hybrid' },
                { value: 'chimera', label: 'Chimeras', parent: 'hybrid' },

                { value: 'undead', label: 'Undead', parent: null },

                { value: 'custom', label: '+ Add Custom Type', type: 'custom' }
            ],
            allowCustom: true
        }
    },

    /**
     * Progressive disclosure rules
     * Defines which sections appear based on previous selections
     */
    progressiveDisclosure: {
        // Section visibility rules
        sectionRules: {
            'contribution-type': {
                visible: 'always',
                completed: (formData) => formData.contributionType !== ''
            },
            'basic': {
                visible: (formData) => formData.contributionType !== '',
                completed: ['title', 'summary']
            },
            'classification': {
                visible: (formData) => formData.contributionType !== '' && formData.title !== '' && formData.summary !== '',
                completed: (formData) => {
                    if (!formData.page) return false;
                    if (formData.contributionType === 'mythology') {
                        return formData.page !== '';
                    }
                    // For theories and assets, require page
                    return formData.page !== '';
                }
            },
            'asset-details': {
                visible: (formData) => {
                    const assetTypes = ['deity', 'hero', 'creature', 'place', 'item', 'herb', 'text', 'concept', 'mythology'];
                    return assetTypes.includes(formData.contributionType) && formData.title !== '' && formData.summary !== '';
                },
                completed: 'optional' // Asset details are optional but recommended
            },
            'content': {
                visible: (formData) => {
                    // Content is visible once classification is complete
                    return formData.page !== '';
                },
                completed: (formData) => formData.richContent && formData.richContent.panels && formData.richContent.panels.length > 0
            },
            'metadata': {
                visible: (formData) => {
                    // Metadata visible once content has started
                    return formData.richContent && formData.richContent.panels && formData.richContent.panels.length > 0;
                },
                completed: 'optional' // Metadata is optional
            }
        },

        // Field visibility within sections
        fieldRules: {
            // Location field logic
            'location': {
                visible: (formData) => formData.placeType !== '',
                renderAs: (formData) => {
                    // Determine which type of location field to show
                    if (formData.placeType === 'earth') return 'coordinates';
                    if (formData.placeType === 'mythical') return 'hierarchical-select';
                    if (formData.placeType === 'celestial') return 'hierarchical-select';
                    if (formData.placeType === 'abstract') return 'text';
                    return 'text';
                }
            }
        }
    },

    /**
     * Get visible sections for current form state
     */
    getVisibleSections(formData) {
        const visible = [];
        for (const [sectionKey, rule] of Object.entries(this.progressiveDisclosure.sectionRules)) {
            if (rule.visible === 'always' || (typeof rule.visible === 'function' && rule.visible(formData))) {
                visible.push(sectionKey);
            }
        }
        return visible;
    },

    /**
     * Check if a section is completed
     */
    isSectionCompleted(sectionKey, formData) {
        const rule = this.progressiveDisclosure.sectionRules[sectionKey];
        if (!rule) return false;
        if (rule.completed === 'optional') return true;
        if (typeof rule.completed === 'function') return rule.completed(formData);
        if (Array.isArray(rule.completed)) {
            return rule.completed.every(field => formData[field] && formData[field] !== '');
        }
        return false;
    },

    /**
     * Get user's previously used values for a field
     */
    async getUserFieldHistory(fieldName, userId) {
        if (!userId || !firebase || !firebase.firestore) return [];

        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('theories')
                .where('userId', '==', userId)
                .where(`assetMetadata.${fieldName}`, '!=', null)
                .orderBy(`assetMetadata.${fieldName}`)
                .limit(20)
                .get();

            const values = new Set();
            snapshot.docs.forEach(doc => {
                const value = doc.data().assetMetadata?.[fieldName];
                if (value) values.add(value);
            });

            return Array.from(values).sort();
        } catch (error) {
            console.error('Error fetching user field history:', error);
            return [];
        }
    }
};
