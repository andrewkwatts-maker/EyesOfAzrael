/**
 * Theory Taxonomy System
 * Manages topics and subtopics for organizing user theories
 */

class TheoryTaxonomy {
    constructor() {
        this.topics = this.getDefaultTopics();
        this.customTopics = this.loadCustomTopics();
        this.init();
    }

    /**
     * Default topic taxonomy based on website structure
     */
    getDefaultTopics() {
        return {
            'mythologies': {
                name: 'Mythologies',
                icon: '🌍',
                subtopics: {
                    'greek': 'Greek Mythology',
                    'norse': 'Norse Mythology',
                    'egyptian': 'Egyptian Mythology',
                    'hindu': 'Hindu Mythology',
                    'chinese': 'Chinese Mythology',
                    'japanese': 'Japanese Mythology',
                    'celtic': 'Celtic Mythology',
                    'mesopotamian': 'Mesopotamian Mythology',
                    'mesoamerican': 'Mesoamerican Mythology',
                    'roman': 'Roman Mythology',
                    'slavic': 'Slavic Mythology',
                    'african': 'African Mythology',
                    'native-american': 'Native American Mythology',
                    'polynesian': 'Polynesian Mythology',
                    'jewish': 'Jewish Tradition'
                }
            },
            'deities': {
                name: 'Deities & Gods',
                icon: '⚡',
                subtopics: {
                    'creator-gods': 'Creator Gods',
                    'sky-gods': 'Sky & Thunder Gods',
                    'earth-goddesses': 'Earth & Mother Goddesses',
                    'war-deities': 'War Deities',
                    'wisdom-deities': 'Wisdom & Knowledge',
                    'love-deities': 'Love & Beauty',
                    'death-deities': 'Death & Underworld',
                    'solar-deities': 'Solar Deities',
                    'lunar-deities': 'Lunar Deities',
                    'sea-deities': 'Sea & Water',
                    'tricksters': 'Trickster Gods'
                }
            },
            'cosmology': {
                name: 'Cosmology & Creation',
                icon: '🌌',
                subtopics: {
                    'creation-myths': 'Creation Myths',
                    'cosmic-structure': 'Cosmic Structure',
                    'world-trees': 'World Trees',
                    'celestial-bodies': 'Celestial Bodies',
                    'elements': 'Elements & Forces',
                    'apocalypse': 'End Times & Apocalypse'
                }
            },
            'places': {
                name: 'Sacred Places',
                icon: '🏛️',
                subtopics: {
                    'temples': 'Temples & Shrines',
                    'mountains': 'Sacred Mountains',
                    'rivers-springs': 'Rivers & Springs',
                    'caves': 'Caves & Grottos',
                    'groves': 'Sacred Groves',
                    'cities': 'Sacred Cities',
                    'underworld': 'Underworld Locations'
                }
            },
            'items': {
                name: 'Sacred Items & Artifacts',
                icon: '⚔️',
                subtopics: {
                    'weapons': 'Weapons',
                    'armor': 'Armor & Protection',
                    'tools': 'Tools & Implements',
                    'relics': 'Relics',
                    'jewelry': 'Jewelry & Adornments',
                    'texts': 'Sacred Texts'
                }
            },
            'magic': {
                name: 'Magic & Mysticism',
                icon: '✨',
                subtopics: {
                    'divination': 'Divination',
                    'ritual-magic': 'Ritual Magic',
                    'energy-work': 'Energy Work',
                    'practical-magic': 'Practical Magic',
                    'grimoires': 'Grimoires & Texts',
                    'traditions': 'Magical Traditions'
                }
            },
            'creatures': {
                name: 'Mythical Creatures',
                icon: '🐉',
                subtopics: {
                    'dragons': 'Dragons',
                    'giants': 'Giants',
                    'spirits': 'Spirits & Elementals',
                    'monsters': 'Monsters',
                    'hybrid-beings': 'Hybrid Beings',
                    'undead': 'Undead'
                }
            },
            'heroes': {
                name: 'Heroes & Legends',
                icon: '🦸',
                subtopics: {
                    'demigods': 'Demigods',
                    'legendary-kings': 'Legendary Kings',
                    'warriors': 'Warriors',
                    'prophets': 'Prophets & Sages',
                    'culture-heroes': 'Culture Heroes'
                }
            },
            'concepts': {
                name: 'Concepts & Archetypes',
                icon: '💡',
                subtopics: {
                    'archetypes': 'Universal Archetypes',
                    'symbols': 'Symbols & Motifs',
                    'numbers': 'Sacred Numbers',
                    'time-cycles': 'Time & Cycles',
                    'duality': 'Duality & Opposition'
                }
            },
            'comparative': {
                name: 'Comparative Analysis',
                icon: '🔗',
                subtopics: {
                    'patterns': 'Cross-Cultural Patterns',
                    'evolution': 'Myth Evolution',
                    'archaeology': 'Archaeological Evidence',
                    'linguistics': 'Linguistic Connections',
                    'astronomy': 'Astronomical Interpretations',
                    'psychology': 'Psychological Analysis'
                }
            },
            'physics': {
                name: 'Physics Integration',
                icon: '⚛️',
                subtopics: {
                    'string-theory': 'String Theory Connections',
                    'dimensions': 'Extra Dimensions',
                    'quantum': 'Quantum Interpretations',
                    'cosmological': 'Cosmological Models',
                    'mathematical': 'Mathematical Patterns'
                }
            },
            'historical': {
                name: 'Historical Context',
                icon: '📜',
                subtopics: {
                    'ancient-civilizations': 'Ancient Civilizations',
                    'migrations': 'Migrations & Diffusion',
                    'trade-routes': 'Trade Routes',
                    'cultural-exchange': 'Cultural Exchange',
                    'chronology': 'Dating & Chronology'
                }
            }
        };
    }

    /**
     * Load custom user-created topics
     */
    loadCustomTopics() {
        const stored = localStorage.getItem('customTheoryTopics');
        return stored ? JSON.parse(stored) : {};
    }

    /**
     * Save custom topics
     */
    saveCustomTopics() {
        localStorage.setItem('customTheoryTopics', JSON.stringify(this.customTopics));
    }

    /**
     * Get all topics (default + custom)
     */
    getAllTopics() {
        return { ...this.topics, ...this.customTopics };
    }

    /**
     * Get topic by ID
     */
    getTopic(topicId) {
        return this.topics[topicId] || this.customTopics[topicId];
    }

    /**
     * Get subtopics for a topic
     */
    getSubtopics(topicId) {
        const topic = this.getTopic(topicId);
        return topic ? topic.subtopics : {};
    }

    /**
     * Add custom topic
     */
    addCustomTopic(id, name, icon = '📌', subtopics = {}) {
        if (this.topics[id]) {
            return { success: false, error: 'Topic ID already exists in default topics' };
        }

        this.customTopics[id] = {
            name,
            icon,
            subtopics,
            custom: true
        };

        this.saveCustomTopics();
        return { success: true };
    }

    /**
     * Add subtopic to existing topic
     */
    addSubtopic(topicId, subtopicId, name) {
        let topic = this.customTopics[topicId];
        let isCustomTopic = true;

        if (!topic) {
            // If it's a default topic, we need to create a custom extension
            const defaultTopic = this.topics[topicId];
            if (!defaultTopic) {
                return { success: false, error: 'Topic not found' };
            }

            // Create custom version with existing subtopics
            topic = {
                ...defaultTopic,
                subtopics: { ...defaultTopic.subtopics },
                custom: false
            };
            this.customTopics[topicId] = topic;
        }

        if (topic.subtopics[subtopicId]) {
            return { success: false, error: 'Subtopic already exists' };
        }

        topic.subtopics[subtopicId] = name;
        this.saveCustomTopics();

        return { success: true };
    }

    /**
     * Generate topic selector HTML
     */
    renderTopicSelector(selectedTopic = '', selectedSubtopic = '') {
        const topics = this.getAllTopics();

        return `
            <div class="topic-selector">
                <div class="form-group">
                    <label for="theory-topic">Topic *</label>
                    <select id="theory-topic" name="topic" required>
                        <option value="">Select a topic...</option>
                        ${Object.entries(topics).map(([id, topic]) => `
                            <option value="${id}" ${selectedTopic === id ? 'selected' : ''}>
                                ${topic.icon} ${topic.name}
                            </option>
                        `).join('')}
                        <option value="_custom">➕ Create New Topic</option>
                    </select>
                </div>

                <div class="form-group" id="subtopic-group" style="display: ${selectedTopic ? 'block' : 'none'};">
                    <label for="theory-subtopic">Subtopic *</label>
                    <select id="theory-subtopic" name="subtopic" required>
                        <option value="">Select a subtopic...</option>
                        ${selectedTopic ? this.renderSubtopicOptions(selectedTopic, selectedSubtopic) : ''}
                        <option value="_custom">➕ Create New Subtopic</option>
                    </select>
                </div>

                <!-- Custom topic input (hidden by default) -->
                <div id="custom-topic-input" class="form-group" style="display: none;">
                    <label for="custom-topic-name">New Topic Name</label>
                    <input type="text" id="custom-topic-name" placeholder="e.g., Astrology">
                    <input type="text" id="custom-topic-icon" placeholder="Icon (emoji)" maxlength="2" value="📌">
                </div>

                <!-- Custom subtopic input (hidden by default) -->
                <div id="custom-subtopic-input" class="form-group" style="display: none;">
                    <label for="custom-subtopic-name">New Subtopic Name</label>
                    <input type="text" id="custom-subtopic-name" placeholder="e.g., Zodiac Signs">
                </div>
            </div>
        `;
    }

    /**
     * Render subtopic options for a topic
     */
    renderSubtopicOptions(topicId, selectedSubtopic = '') {
        const subtopics = this.getSubtopics(topicId);
        return Object.entries(subtopics).map(([id, name]) => `
            <option value="${id}" ${selectedSubtopic === id ? 'selected' : ''}>
                ${name}
            </option>
        `).join('');
    }

    /**
     * Handle topic selector events
     */
    attachTopicSelectorEvents(container) {
        const topicSelect = container.querySelector('#theory-topic');
        const subtopicGroup = container.querySelector('#subtopic-group');
        const subtopicSelect = container.querySelector('#theory-subtopic');
        const customTopicInput = container.querySelector('#custom-topic-input');
        const customSubtopicInput = container.querySelector('#custom-subtopic-input');

        // Topic change
        topicSelect?.addEventListener('change', (e) => {
            const value = e.target.value;

            if (value === '_custom') {
                customTopicInput.style.display = 'block';
                subtopicGroup.style.display = 'none';
            } else if (value) {
                customTopicInput.style.display = 'none';
                subtopicGroup.style.display = 'block';

                // Update subtopic options
                subtopicSelect.innerHTML = `
                    <option value="">Select a subtopic...</option>
                    ${this.renderSubtopicOptions(value)}
                    <option value="_custom">➕ Create New Subtopic</option>
                `;
            } else {
                customTopicInput.style.display = 'none';
                subtopicGroup.style.display = 'none';
            }
        });

        // Subtopic change
        subtopicSelect?.addEventListener('change', (e) => {
            if (e.target.value === '_custom') {
                customSubtopicInput.style.display = 'block';
            } else {
                customSubtopicInput.style.display = 'none';
            }
        });
    }

    /**
     * Get selected topic/subtopic data
     */
    getSelectedTopicData(container) {
        const topicSelect = container.querySelector('#theory-topic');
        const subtopicSelect = container.querySelector('#theory-subtopic');
        const customTopicName = container.querySelector('#custom-topic-name');
        const customTopicIcon = container.querySelector('#custom-topic-icon');
        const customSubtopicName = container.querySelector('#custom-subtopic-name');

        let topic = topicSelect?.value;
        let subtopic = subtopicSelect?.value;

        // Handle custom topic
        if (topic === '_custom') {
            const name = customTopicName?.value.trim();
            const icon = customTopicIcon?.value.trim() || '📌';
            if (!name) return null;

            // Generate ID from name
            topic = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            // Add to custom topics
            this.addCustomTopic(topic, name, icon, {});
        }

        // Handle custom subtopic
        if (subtopic === '_custom') {
            const name = customSubtopicName?.value.trim();
            if (!name) return null;

            // Generate ID from name
            subtopic = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            // Add to topic
            this.addSubtopic(topic, subtopic, name);
        }

        if (!topic || !subtopic) return null;

        const topicData = this.getTopic(topic);
        const subtopicName = topicData?.subtopics[subtopic];

        return {
            topic,
            topicName: topicData?.name,
            topicIcon: topicData?.icon,
            subtopic,
            subtopicName
        };
    }

    /**
     * Initialize
     */
    init() {
        // Any initialization code
    }
}

// Create global instance
window.theoryTaxonomy = new TheoryTaxonomy();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TheoryTaxonomy;
}
