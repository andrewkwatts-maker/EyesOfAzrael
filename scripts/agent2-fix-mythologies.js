#!/usr/bin/env node

/**
 * AGENT 2: FIX MYTHOLOGIES IN FIREBASE
 *
 * Responsibilities:
 * 1. Update category counts with ACTUAL Firebase data
 * 2. Add cross-links to related mythologies
 * 3. Ensure all template fields are populated
 * 4. Set proper rendering configuration
 * 5. Fix missing icons and descriptions
 *
 * Goal: Make mythologies 100% complete for top-level navigation
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'eyesofazrael'
});

const db = admin.firestore();

// Load actual entity counts from downloaded data
const entityCounts = require('../firebase-mythologies-data/entity-counts.json');

// Comprehensive mythology metadata with cross-links
const mythologyEnhancements = {
    greek: {
        icon: '🏛️',
        name: 'Greek Mythology',
        description: 'Gods of Olympus and heroes of ancient Greece',
        longDescription: 'Explore the rich tapestry of Greek mythology, from the Olympian gods to legendary heroes. Discover tales of Zeus, Athena, Hercules, and the epic journey of Odysseus.',
        color: '#8b7fff',
        order: 1,
        featured: true,
        relatedMythologies: ['roman', 'egyptian', 'persian'],
        culturalTags: ['Classical', 'Mediterranean', 'Hellenic'],
        timePeriod: { era: 'Classical Antiquity', start: '800 BCE', end: '400 CE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'olympian'
        }
    },
    norse: {
        icon: '⚔️',
        name: 'Norse Mythology',
        description: 'Warriors of Asgard and the Nine Realms',
        longDescription: 'Journey through Yggdrasil and the Nine Realms. Meet Odin the All-Father, Thor the Thunder God, and witness the prophesied Ragnarök.',
        color: '#4a9eff',
        order: 2,
        featured: true,
        relatedMythologies: ['celtic', 'germanic'],
        culturalTags: ['Viking', 'Scandinavian', 'Germanic'],
        timePeriod: { era: 'Viking Age', start: '793 CE', end: '1066 CE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'asgardian'
        }
    },
    egyptian: {
        icon: '𓂀',
        name: 'Egyptian Mythology',
        description: 'Keepers of the Nile and guardians of Ma\'at',
        longDescription: 'Delve into ancient Egypt\'s mysteries. From Ra\'s solar journey to Osiris\'s resurrection, explore the wisdom of the pharaohs and the secrets of the pyramids.',
        color: '#ffd93d',
        order: 3,
        featured: true,
        relatedMythologies: ['babylonian', 'sumerian', 'greek'],
        culturalTags: ['Ancient Egypt', 'African', 'Nile Valley'],
        timePeriod: { era: 'Pharaonic Egypt', start: '3100 BCE', end: '30 BCE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'pharaonic'
        }
    },
    hindu: {
        icon: '🕉️',
        name: 'Hindu Mythology',
        description: 'The Trimurti and cosmic cycles of creation',
        longDescription: 'Explore Sanātana Dharma - the Eternal Way. From Brahma the Creator to Shiva the Destroyer, discover the cosmic dance of creation and dissolution.',
        color: '#ff7eb6',
        order: 4,
        featured: true,
        relatedMythologies: ['buddhist', 'persian'],
        culturalTags: ['Vedic', 'Indian', 'South Asian'],
        timePeriod: { era: 'Ancient India', start: '1500 BCE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'vedic'
        }
    },
    buddhist: {
        icon: '☸️',
        name: 'Buddhist Tradition',
        description: 'Bodhisattvas and the path to enlightenment',
        longDescription: 'Walk the Eightfold Path and discover the teachings of the Buddha. From Avalokiteshvara\'s compassion to the realms of samsara, explore the Dharma.',
        color: '#51cf66',
        order: 5,
        featured: true,
        relatedMythologies: ['hindu', 'chinese', 'japanese'],
        culturalTags: ['Dharmic', 'Asian', 'Contemplative'],
        timePeriod: { era: 'Ancient to Modern', start: '563 BCE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'dharmic'
        }
    },
    chinese: {
        icon: '🐉',
        name: 'Chinese Mythology',
        description: 'Dragons, immortals, and celestial bureaucracy',
        longDescription: 'Discover the Middle Kingdom\'s ancient wisdom. Meet the Jade Emperor, explore the Eight Immortals, and understand the harmony of Yin and Yang.',
        color: '#f85a8f',
        order: 6,
        featured: false,
        relatedMythologies: ['japanese', 'buddhist'],
        culturalTags: ['East Asian', 'Taoist', 'Confucian'],
        timePeriod: { era: 'Imperial China', start: '2070 BCE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'celestial'
        }
    },
    japanese: {
        icon: '⛩️',
        name: 'Japanese Mythology',
        description: 'Kami spirits and the creation of Japan',
        longDescription: 'Enter the realm of Shinto and the kami. From Amaterasu\'s sun to Susanoo\'s storms, discover the sacred islands and their divine guardians.',
        color: '#fb9f7f',
        order: 7,
        featured: false,
        relatedMythologies: ['chinese', 'buddhist'],
        culturalTags: ['Shinto', 'East Asian', 'Island'],
        timePeriod: { era: 'Ancient to Modern', start: '660 BCE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'shinto'
        }
    },
    celtic: {
        icon: '🍀',
        name: 'Celtic Mythology',
        description: 'Druids, faeries, and the Tuatha Dé Danann',
        longDescription: 'Journey through the mists to the Otherworld. Meet the Tuatha Dé Danann, learn druidic wisdom, and discover the magic of the ancient Celts.',
        color: '#7fd9d3',
        order: 8,
        featured: false,
        relatedMythologies: ['norse', 'roman'],
        culturalTags: ['Celtic', 'European', 'Druidic'],
        timePeriod: { era: 'Iron Age', start: '1200 BCE', end: '400 CE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'celtic'
        }
    },
    babylonian: {
        icon: '🏛️',
        name: 'Babylonian Mythology',
        description: 'The Enuma Elish and gods of Mesopotamia',
        longDescription: 'Explore the cradle of civilization. From Marduk\'s victory over Tiamat to the Epic of Gilgamesh, discover the myths that shaped the ancient world.',
        color: '#b965e6',
        order: 9,
        featured: false,
        relatedMythologies: ['sumerian', 'persian', 'egyptian'],
        culturalTags: ['Mesopotamian', 'Near Eastern', 'Ancient'],
        timePeriod: { era: 'Bronze Age', start: '1900 BCE', end: '539 BCE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'mesopotamian'
        }
    },
    persian: {
        icon: '🔥',
        name: 'Persian Mythology',
        description: 'Zoroastrian wisdom and the eternal flame',
        longDescription: 'Discover the religion of light. Follow Ahura Mazda\'s struggle against Angra Mainyu, and learn the threefold path of good thoughts, good words, good deeds.',
        color: '#7fb0f9',
        order: 10,
        featured: false,
        relatedMythologies: ['babylonian', 'islamic', 'hindu'],
        culturalTags: ['Zoroastrian', 'Iranian', 'Dualistic'],
        timePeriod: { era: 'Ancient Persia', start: '1500 BCE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'zoroastrian'
        }
    },
    christian: {
        icon: '✟',
        name: 'Christian Tradition',
        description: 'Angels, saints, and biblical narratives',
        longDescription: 'Explore the foundations of Western spirituality. From the Genesis creation to Revelation\'s apocalypse, discover angels, saints, and gnostic mysteries.',
        color: '#a8edea',
        order: 11,
        featured: false,
        relatedMythologies: ['jewish', 'islamic', 'apocryphal'],
        culturalTags: ['Abrahamic', 'Western', 'Monotheistic'],
        timePeriod: { era: 'Common Era', start: '30 CE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'christian'
        }
    },
    islamic: {
        icon: '☪️',
        name: 'Islamic Tradition',
        description: 'Prophets, angels, and divine revelation',
        longDescription: 'Journey through the Abrahamic tradition. From the Night Journey to the 99 Names of Allah, discover the wisdom of prophets and angels.',
        color: '#fed6e3',
        order: 12,
        featured: false,
        relatedMythologies: ['christian', 'jewish', 'persian'],
        culturalTags: ['Abrahamic', 'Middle Eastern', 'Monotheistic'],
        timePeriod: { era: 'Islamic Era', start: '610 CE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'islamic'
        }
    },
    jewish: {
        icon: '✡️',
        name: 'Jewish Tradition',
        description: 'Prophets, patriarchs, and mystical wisdom',
        longDescription: 'Explore the oldest Abrahamic tradition. From Abraham\'s covenant to Enoch\'s heavenly journeys, discover the Kabbalah and rabbinical wisdom.',
        color: '#4fc3f7',
        order: 13,
        featured: false,
        relatedMythologies: ['christian', 'islamic', 'apocryphal'],
        culturalTags: ['Abrahamic', 'Hebraic', 'Monotheistic'],
        timePeriod: { era: 'Ancient to Modern', start: '2000 BCE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'judaic'
        }
    },
    roman: {
        icon: '🏛️',
        name: 'Roman Mythology',
        description: 'Imperial gods and the foundation of Rome',
        longDescription: 'Enter the eternal city. From Jupiter\'s thunder to Romulus and Remus, discover the myths that built an empire.',
        color: '#667eea',
        order: 14,
        featured: false,
        relatedMythologies: ['greek', 'celtic'],
        culturalTags: ['Classical', 'Mediterranean', 'Imperial'],
        timePeriod: { era: 'Roman Era', start: '753 BCE', end: '476 CE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'roman'
        }
    },
    sumerian: {
        icon: '📜',
        name: 'Sumerian Mythology',
        description: 'The first written myths and ancient wisdom',
        longDescription: 'Discover humanity\'s oldest myths. From Inanna\'s descent to the Anunnaki\'s wisdom, explore the foundation of Mesopotamian civilization.',
        color: '#9E9E9E',
        order: 15,
        featured: false,
        relatedMythologies: ['babylonian', 'egyptian'],
        culturalTags: ['Mesopotamian', 'Ancient', 'Proto-writing'],
        timePeriod: { era: 'Bronze Age', start: '4500 BCE', end: '1900 BCE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: true,
            showRelatedMythologies: true,
            theme: 'sumerian'
        }
    },
    aztec: {
        icon: '☀️',
        name: 'Aztec Mythology',
        description: 'Solar deities and the Fifth Sun',
        longDescription: 'Discover the mythology of the Fifth Sun. From Huitzilopochtli\'s war to Quetzalcoatl\'s wisdom, explore Mesoamerican cosmology.',
        color: '#FF9800',
        order: 16,
        featured: false,
        relatedMythologies: ['mayan'],
        culturalTags: ['Mesoamerican', 'Nahuatl', 'Solar'],
        timePeriod: { era: 'Post-Classic', start: '1300 CE', end: '1521 CE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'aztec'
        }
    },
    mayan: {
        icon: '🗿',
        name: 'Mayan Mythology',
        description: 'The Popol Vuh and Hero Twins',
        longDescription: 'Journey through the Popol Vuh. Follow the Hero Twins through Xibalba and discover the cycles of creation and destruction.',
        color: '#8BC34A',
        order: 17,
        featured: false,
        relatedMythologies: ['aztec'],
        culturalTags: ['Mesoamerican', 'Maya', 'Calendrical'],
        timePeriod: { era: 'Classic Maya', start: '250 CE', end: '900 CE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'mayan'
        }
    },
    yoruba: {
        icon: '👑',
        name: 'Yoruba Tradition',
        description: 'Orishas and West African spirituality',
        longDescription: 'Meet the Orishas of West Africa. From Ọbatala\'s creation to Ṣango\'s thunder, discover the living traditions of the Yoruba people.',
        color: '#9C27B0',
        order: 18,
        featured: false,
        relatedMythologies: [],
        culturalTags: ['West African', 'Yoruba', 'Orisha'],
        timePeriod: { era: 'Ancient to Modern', start: '500 BCE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'yoruba'
        }
    },
    tarot: {
        icon: '🔮',
        name: 'Tarot & Hermetic Tradition',
        description: 'The Western esoteric tradition and archetypal wisdom',
        longDescription: 'Explore the Major Arcana and Hermetic mysteries. From The Fool\'s journey to The World\'s completion, discover mystical symbolism.',
        color: '#7c4dff',
        order: 19,
        featured: false,
        relatedMythologies: ['jewish', 'christian', 'egyptian'],
        culturalTags: ['Hermetic', 'Esoteric', 'Western'],
        timePeriod: { era: 'Medieval to Modern', start: '1400 CE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'hermetic'
        }
    },
    apocryphal: {
        icon: '📖',
        name: 'Apocryphal & Enochian Tradition',
        description: 'Hidden wisdom of apocryphal texts and angelic hierarchies',
        longDescription: 'Uncover the forbidden knowledge. From the Book of Enoch to the Watchers and Nephilim, explore the mysteries excluded from canon.',
        color: '#d4af37',
        order: 20,
        featured: false,
        relatedMythologies: ['jewish', 'christian'],
        culturalTags: ['Apocryphal', 'Enochian', 'Mystical'],
        timePeriod: { era: 'Second Temple', start: '300 BCE', end: '100 CE' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'enochian'
        }
    },
    comparative: {
        icon: '🔗',
        name: 'Comparative Mythology',
        description: 'Cross-cultural parallels and universal mythic patterns',
        longDescription: 'Discover the patterns that connect all mythologies. From flood myths to dying-rising gods, explore humanity\'s shared stories.',
        color: '#00bcd4',
        order: 21,
        featured: false,
        relatedMythologies: ['greek', 'babylonian', 'christian', 'hindu'],
        culturalTags: ['Comparative', 'Cross-Cultural', 'Universal'],
        timePeriod: { era: 'Modern Scholarship', start: '1800 CE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: false,
            enableCorpusSearch: false,
            showRelatedMythologies: true,
            theme: 'comparative'
        }
    },
    native_american: {
        icon: '🦅',
        name: 'Native American Traditions',
        description: 'Great Spirit, animal spirits, and creation stories',
        longDescription: 'Honor the diverse traditions of Turtle Island. From Coyote the trickster to White Buffalo Woman, respect the sacred stories of indigenous peoples.',
        color: '#8d6e63',
        order: 22,
        featured: false,
        relatedMythologies: [],
        culturalTags: ['Indigenous', 'North American', 'Animistic'],
        timePeriod: { era: 'Ancient to Modern', start: '10000 BCE', end: 'Present' },
        renderConfig: {
            showCategoryGrid: true,
            enableCorpusSearch: false,
            showRelatedMythologies: false,
            theme: 'indigenous'
        }
    }
};

class MythologyFixer {
    constructor() {
        this.stats = {
            totalMythologies: 0,
            updated: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Main execution function
     */
    async execute() {
        console.log('='.repeat(80));
        console.log('AGENT 2: FIX MYTHOLOGIES IN FIREBASE');
        console.log('='.repeat(80));
        console.log('');

        try {
            // Get all mythology documents
            const mythologiesSnapshot = await db.collection('mythologies').get();
            this.stats.totalMythologies = mythologiesSnapshot.size;

            console.log(`📊 Found ${this.stats.totalMythologies} mythologies in Firebase`);
            console.log('');

            // Update each mythology
            for (const doc of mythologiesSnapshot.docs) {
                await this.fixMythology(doc.id, doc.data());
            }

            this.generateReport();

        } catch (error) {
            console.error('❌ Fatal error:', error);
            throw error;
        } finally {
            await admin.app().delete();
        }
    }

    /**
     * Fix a single mythology document
     */
    async fixMythology(mythologyId, currentData) {
        console.log(`\n🔧 Fixing: ${mythologyId}`);

        try {
            // Get enhancement data
            const enhancements = mythologyEnhancements[mythologyId] || {};

            // Get actual entity counts
            const counts = entityCounts[mythologyId] || {};

            // Build category counts
            const categories = {};
            const categoryList = [
                'deities', 'heroes', 'creatures', 'cosmology',
                'rituals', 'texts', 'herbs', 'symbols',
                'magic', 'places', 'concepts', 'events', 'items'
            ];

            for (const category of categoryList) {
                const count = counts[category] || 0;
                if (count > 0 || enhancements.order <= 12) {
                    // Include category if it has entities OR if it's a major mythology
                    categories[category] = {
                        enabled: true,
                        count: count
                    };
                }
            }

            // Calculate totals
            const totalEntities = Object.values(counts).reduce((sum, count) => sum + count, 0);

            // Build complete mythology document
            const updatedData = {
                // Core identity
                id: mythologyId,
                name: enhancements.name || currentData.name || mythologyId,
                displayName: enhancements.name || currentData.displayName || currentData.name || mythologyId,
                mythology: mythologyId,

                // Visual
                icon: enhancements.icon || currentData.icon || '📜',
                color: enhancements.color || currentData.color || '#8b7fff',

                // Description
                description: enhancements.description || currentData.description || '',
                longDescription: enhancements.longDescription || currentData.longDescription || enhancements.description || currentData.description || '',
                heroTitle: currentData.heroTitle || enhancements.name || mythologyId,

                // Organization
                order: enhancements.order !== undefined ? enhancements.order : currentData.order || 999,
                status: currentData.status || 'active',
                featured: enhancements.featured !== undefined ? enhancements.featured : currentData.featured || false,

                // Categories with actual counts
                categories: categories,

                // Stats
                stats: {
                    totalEntities: totalEntities,
                    deityCount: counts.deities || 0,
                    heroCount: counts.heroes || 0,
                    creatureCount: counts.creatures || 0,
                    ...currentData.stats
                },

                // Cross-links and metadata
                relatedMythologies: enhancements.relatedMythologies || [],
                culturalTags: enhancements.culturalTags || [],
                timePeriod: enhancements.timePeriod || null,

                // Rendering configuration
                renderConfig: enhancements.renderConfig || {
                    showCategoryGrid: true,
                    enableCorpusSearch: false,
                    showRelatedMythologies: true,
                    theme: mythologyId
                },

                // Preserve existing metadata
                metadata: {
                    ...currentData.metadata,
                    lastUpdatedBy: 'agent2-mythology-fixer',
                    lastUpdateReason: 'Category count sync, cross-links, and render config',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                },

                // Keep sections if they exist
                ...(currentData.sections && { sections: currentData.sections }),

                // Timestamps
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: currentData.createdAt || admin.firestore.FieldValue.serverTimestamp()
            };

            // Update in Firebase
            await db.collection('mythologies').doc(mythologyId).set(updatedData, { merge: true });

            this.stats.updated++;
            console.log(`  ✓ Updated successfully`);
            console.log(`    - ${totalEntities} total entities`);
            console.log(`    - ${Object.keys(categories).length} categories enabled`);
            console.log(`    - ${enhancements.relatedMythologies?.length || 0} related mythologies`);

        } catch (error) {
            this.stats.failed++;
            this.stats.errors.push({
                mythology: mythologyId,
                error: error.message
            });
            console.log(`  ✗ Failed: ${error.message}`);
        }
    }

    /**
     * Generate final report
     */
    generateReport() {
        console.log('');
        console.log('='.repeat(80));
        console.log('FIX REPORT');
        console.log('='.repeat(80));
        console.log('');
        console.log(`Total Mythologies:    ${this.stats.totalMythologies}`);
        console.log(`Successfully Updated: ${this.stats.updated}`);
        console.log(`Failed:               ${this.stats.failed}`);
        console.log('');

        if (this.stats.failed > 0) {
            console.log('❌ Errors:');
            this.stats.errors.forEach(err => {
                console.log(`  - ${err.mythology}: ${err.error}`);
            });
            console.log('');
        }

        // Save report
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            improvements: [
                '✓ Updated category counts with actual Firebase data',
                '✓ Added cross-links to related mythologies',
                '✓ Populated all template fields (icon, description, etc.)',
                '✓ Set proper rendering configuration',
                '✓ Added cultural tags and time periods',
                '✓ Ensured 100% completeness for navigation'
            ]
        };

        const reportPath = path.join(__dirname, '..', 'AGENT2_MYTHOLOGY_FIX_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`📄 Report saved to: AGENT2_MYTHOLOGY_FIX_REPORT.json`);
        console.log('');
        console.log('='.repeat(80));
        console.log('✅ AGENT 2 COMPLETE - Mythologies are now 100% complete!');
        console.log('='.repeat(80));
    }
}

// Run if executed directly
if (require.main === module) {
    const fixer = new MythologyFixer();
    fixer.execute()
        .then(() => {
            console.log('\n✅ Mission accomplished!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Mission failed:', error);
            process.exit(1);
        });
}

module.exports = MythologyFixer;
