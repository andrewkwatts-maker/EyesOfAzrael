/**
 * AGENT 11: Update Mythologies Collection
 *
 * This script updates the mythologies collection in Firebase with:
 * - Accurate category counts from file system scan
 * - Rendering configuration for all display modes
 * - Enhanced metadata and search configuration
 * - Cross-linking to child assets
 * - Page asset integration
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let app;
try {
    app = admin.app();
    console.log('✅ Using existing Firebase app');
} catch (error) {
    const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'eyesofazrael'
    });
    console.log('✅ Initialized new Firebase app');
}

const db = admin.firestore();

// Load category counts from previous scan
const categoryCountsPath = path.join(__dirname, '..', 'AGENT_11_CATEGORY_COUNTS.json');
const categoryCounts = JSON.parse(fs.readFileSync(categoryCountsPath, 'utf8'));

// Enhanced mythology data with rendering configuration
const mythologyEnhancements = {
    greek: {
        id: 'greek',
        name: 'Greek Mythology',
        icon: '🏛️',
        description: 'Gods of Olympus and heroes of ancient Greece',
        color: 'var(--color-primary, #8b7fff)',
        metadata: {
            order: 1,
            featured: true,
            status: 'active',
            region: 'Europe',
            period: 'Ancient',
            language: 'Greek',
            completeness: 95
        },
        search: {
            keywords: ['olympus', 'zeus', 'athena', 'mythology', 'pantheon', 'titans', 'gods', 'heroes'],
            facets: ['polytheism', 'classical', 'western', 'mediterranean'],
            popularity: 100
        }
    },
    norse: {
        id: 'norse',
        name: 'Norse Mythology',
        icon: '⚔️',
        description: 'Warriors of Asgard and the Nine Realms',
        color: '#4a9eff',
        metadata: {
            order: 2,
            featured: true,
            status: 'active',
            region: 'Northern Europe',
            period: 'Medieval',
            language: 'Old Norse',
            completeness: 85
        },
        search: {
            keywords: ['viking', 'odin', 'thor', 'asgard', 'ragnarok', 'valkyrie', 'nine realms'],
            facets: ['polytheism', 'germanic', 'scandinavian', 'warrior culture'],
            popularity: 95
        }
    },
    egyptian: {
        id: 'egyptian',
        name: 'Egyptian Mythology',
        icon: '𓂀',
        description: 'Keepers of the Nile and guardians of Ma\'at',
        color: '#ffd93d',
        metadata: {
            order: 3,
            featured: true,
            status: 'active',
            region: 'North Africa',
            period: 'Ancient',
            language: 'Ancient Egyptian',
            completeness: 90
        },
        search: {
            keywords: ['pharaoh', 'ra', 'osiris', 'isis', 'pyramid', 'maat', 'afterlife'],
            facets: ['polytheism', 'african', 'ancient', 'death rituals'],
            popularity: 92
        }
    },
    hindu: {
        id: 'hindu',
        name: 'Hindu Mythology',
        icon: '🕉️',
        description: 'The Trimurti and cosmic cycles of creation',
        color: '#ff7eb6',
        metadata: {
            order: 4,
            featured: true,
            status: 'active',
            region: 'South Asia',
            period: 'Ancient to Present',
            language: 'Sanskrit',
            completeness: 88
        },
        search: {
            keywords: ['brahma', 'vishnu', 'shiva', 'karma', 'dharma', 'vedas', 'avatars'],
            facets: ['polytheism', 'dharmic', 'indian', 'living tradition'],
            popularity: 90
        }
    },
    buddhist: {
        id: 'buddhist',
        name: 'Buddhist Tradition',
        icon: '☸️',
        description: 'Bodhisattvas and the path to enlightenment',
        color: '#51cf66',
        metadata: {
            order: 5,
            featured: true,
            status: 'active',
            region: 'Asia',
            period: 'Ancient to Present',
            language: 'Pali, Sanskrit',
            completeness: 82
        },
        search: {
            keywords: ['buddha', 'enlightenment', 'nirvana', 'dharma', 'meditation', 'compassion'],
            facets: ['dharmic', 'philosophical', 'asian', 'living tradition'],
            popularity: 85
        }
    },
    chinese: {
        id: 'chinese',
        name: 'Chinese Mythology',
        icon: '🐉',
        description: 'Dragons, immortals, and celestial bureaucracy',
        color: '#f85a8f',
        metadata: {
            order: 6,
            featured: false,
            status: 'active',
            region: 'East Asia',
            period: 'Ancient to Present',
            language: 'Chinese',
            completeness: 65
        },
        search: {
            keywords: ['dragon', 'jade emperor', 'immortal', 'tao', 'yin yang', 'celestial'],
            facets: ['polytheism', 'east asian', 'taoism', 'folk religion'],
            popularity: 75
        }
    },
    japanese: {
        id: 'japanese',
        name: 'Japanese Mythology',
        icon: '⛩️',
        description: 'Kami spirits and the creation of Japan',
        color: '#fb9f7f',
        metadata: {
            order: 7,
            featured: false,
            status: 'active',
            region: 'East Asia',
            period: 'Ancient to Present',
            language: 'Japanese',
            completeness: 70
        },
        search: {
            keywords: ['kami', 'shinto', 'amaterasu', 'susanoo', 'yokai', 'shrine'],
            facets: ['polytheism', 'east asian', 'shinto', 'animism'],
            popularity: 78
        }
    },
    celtic: {
        id: 'celtic',
        name: 'Celtic Mythology',
        icon: '🍀',
        description: 'Druids, faeries, and the Tuatha Dé Danann',
        color: '#7fd9d3',
        metadata: {
            order: 8,
            featured: false,
            status: 'active',
            region: 'Western Europe',
            period: 'Ancient',
            language: 'Celtic languages',
            completeness: 68
        },
        search: {
            keywords: ['druid', 'fairy', 'tuatha de danann', 'irish', 'welsh', 'otherworld'],
            facets: ['polytheism', 'celtic', 'european', 'nature worship'],
            popularity: 72
        }
    },
    babylonian: {
        id: 'babylonian',
        name: 'Babylonian Mythology',
        icon: '🏛️',
        description: 'The Enuma Elish and gods of Mesopotamia',
        color: '#b965e6',
        metadata: {
            order: 9,
            featured: false,
            status: 'active',
            region: 'Middle East',
            period: 'Ancient',
            language: 'Akkadian',
            completeness: 72
        },
        search: {
            keywords: ['marduk', 'tiamat', 'enuma elish', 'mesopotamia', 'ishtar', 'ziggurat'],
            facets: ['polytheism', 'mesopotamian', 'ancient', 'cuneiform'],
            popularity: 68
        }
    },
    persian: {
        id: 'persian',
        name: 'Persian Mythology',
        icon: '🔥',
        description: 'Zoroastrian wisdom and the eternal flame',
        color: '#7fb0f9',
        metadata: {
            order: 10,
            featured: false,
            status: 'active',
            region: 'Middle East',
            period: 'Ancient',
            language: 'Avestan',
            completeness: 75
        },
        search: {
            keywords: ['zoroaster', 'ahura mazda', 'fire', 'dualism', 'avesta', 'persia'],
            facets: ['dualism', 'persian', 'fire worship', 'prophetic'],
            popularity: 65
        }
    },
    christian: {
        id: 'christian',
        name: 'Christian Tradition',
        icon: '✟',
        description: 'Angels, saints, and biblical narratives',
        color: '#a8edea',
        metadata: {
            order: 11,
            featured: false,
            status: 'active',
            region: 'Global',
            period: 'Ancient to Present',
            language: 'Hebrew, Greek, Latin',
            completeness: 92
        },
        search: {
            keywords: ['jesus', 'bible', 'angel', 'saint', 'gospel', 'trinity', 'resurrection'],
            facets: ['monotheism', 'abrahamic', 'global', 'living tradition'],
            popularity: 95
        }
    },
    islamic: {
        id: 'islamic',
        name: 'Islamic Tradition',
        icon: '☪️',
        description: 'Prophets, angels, and divine revelation',
        color: '#fed6e3',
        metadata: {
            order: 12,
            featured: false,
            status: 'active',
            region: 'Global',
            period: 'Medieval to Present',
            language: 'Arabic',
            completeness: 70
        },
        search: {
            keywords: ['prophet', 'quran', 'angel', 'muhammad', 'allah', 'hajj', 'mosque'],
            facets: ['monotheism', 'abrahamic', 'global', 'living tradition'],
            popularity: 88
        }
    },
    roman: {
        id: 'roman',
        name: 'Roman Mythology',
        icon: '🏛️',
        description: 'Imperial gods and the foundation of Rome',
        color: '#667eea',
        metadata: {
            order: 13,
            featured: false,
            status: 'active',
            region: 'Europe',
            period: 'Ancient',
            language: 'Latin',
            completeness: 78
        },
        search: {
            keywords: ['jupiter', 'mars', 'venus', 'rome', 'empire', 'pantheon', 'legion'],
            facets: ['polytheism', 'classical', 'european', 'imperial'],
            popularity: 82
        }
    },
    sumerian: {
        id: 'sumerian',
        name: 'Sumerian Mythology',
        icon: '📜',
        description: 'The first written myths and ancient wisdom',
        color: '#9E9E9E',
        metadata: {
            order: 14,
            featured: false,
            status: 'active',
            region: 'Middle East',
            period: 'Ancient',
            language: 'Sumerian',
            completeness: 68
        },
        search: {
            keywords: ['gilgamesh', 'inanna', 'enki', 'ziggurat', 'cuneiform', 'sumer'],
            facets: ['polytheism', 'mesopotamian', 'ancient', 'first civilization'],
            popularity: 70
        }
    },
    aztec: {
        id: 'aztec',
        name: 'Aztec Mythology',
        icon: '☀️',
        description: 'Solar deities and the Fifth Sun',
        color: '#FF9800',
        metadata: {
            order: 15,
            featured: false,
            status: 'active',
            region: 'Mesoamerica',
            period: 'Medieval',
            language: 'Nahuatl',
            completeness: 55
        },
        search: {
            keywords: ['quetzalcoatl', 'sun', 'sacrifice', 'tenochtitlan', 'pyramid', 'calendar'],
            facets: ['polytheism', 'mesoamerican', 'solar worship', 'ritual sacrifice'],
            popularity: 68
        }
    },
    mayan: {
        id: 'mayan',
        name: 'Mayan Mythology',
        icon: '🗿',
        description: 'The Popol Vuh and Hero Twins',
        color: '#8BC34A',
        metadata: {
            order: 16,
            featured: false,
            status: 'active',
            region: 'Mesoamerica',
            period: 'Ancient to Medieval',
            language: 'Mayan languages',
            completeness: 58
        },
        search: {
            keywords: ['popol vuh', 'hero twins', 'xibalba', 'pyramid', 'calendar', 'jaguar'],
            facets: ['polytheism', 'mesoamerican', 'astronomy', 'glyphs'],
            popularity: 65
        }
    },
    yoruba: {
        id: 'yoruba',
        name: 'Yoruba Tradition',
        icon: '👑',
        description: 'Orishas and West African spirituality',
        color: '#9C27B0',
        metadata: {
            order: 17,
            featured: false,
            status: 'active',
            region: 'West Africa',
            period: 'Ancient to Present',
            language: 'Yoruba',
            completeness: 52
        },
        search: {
            keywords: ['orisha', 'ifa', 'santeria', 'vodun', 'west africa', 'diaspora'],
            facets: ['polytheism', 'african', 'living tradition', 'diaspora religion'],
            popularity: 62
        }
    }
};

/**
 * Generate rendering configuration for mythology
 */
function generateRenderingConfig() {
    return {
        modes: {
            hyperlink: true,
            panelCard: true,
            subsection: true,
            fullPage: true,
            gridItem: true
        },
        panelCard: {
            size: 'medium',
            showFields: ['icon', 'name', 'description', 'categories'],
            showCategoryCount: true,
            clickable: true
        },
        gridItem: {
            size: 'large',
            layout: 'vertical',
            showIcon: true,
            showStats: true
        },
        fullPage: {
            sections: [
                'header',
                'description',
                'featured-deities',
                'categories',
                'statistics',
                'related-content'
            ],
            showBreadcrumb: true,
            showNavigation: true
        },
        subsection: {
            maxItems: 10,
            showViewAll: true,
            groupBy: 'category'
        }
    };
}

/**
 * Generate relationships structure
 */
function generateRelationships(mythId) {
    return {
        childCollections: ['deities', 'heroes', 'creatures', 'cosmology', 'texts', 'rituals'],
        parentCollections: [],
        relatedMythologies: getRelatedMythologies(mythId),
        featuredEntities: [] // Will be populated by another script
    };
}

/**
 * Get related mythologies based on cultural/geographical proximity
 */
function getRelatedMythologies(mythId) {
    const relations = {
        greek: ['roman', 'egyptian'],
        roman: ['greek', 'egyptian'],
        norse: ['celtic'],
        egyptian: ['greek', 'roman', 'babylonian'],
        hindu: ['buddhist'],
        buddhist: ['hindu', 'chinese', 'japanese'],
        chinese: ['buddhist', 'japanese'],
        japanese: ['buddhist', 'chinese'],
        celtic: ['norse'],
        babylonian: ['sumerian', 'persian', 'egyptian'],
        sumerian: ['babylonian', 'persian'],
        persian: ['babylonian', 'sumerian'],
        christian: ['islamic', 'jewish'],
        islamic: ['christian', 'jewish'],
        jewish: ['christian', 'islamic'],
        aztec: ['mayan'],
        mayan: ['aztec'],
        yoruba: []
    };

    return relations[mythId] || [];
}

/**
 * Main update function
 */
async function updateMythologies() {
    console.log('🔥 AGENT 11: MYTHOLOGY UPDATE SCRIPT\n');
    console.log('Updating mythologies collection with enhanced data...\n');

    try {
        const batch = db.batch();
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        let updateCount = 0;

        for (const mythId in mythologyEnhancements) {
            const enhancement = mythologyEnhancements[mythId];
            const counts = categoryCounts[mythId];

            if (!counts) {
                console.warn(`⚠️  No category counts found for ${mythId}, skipping...`);
                continue;
            }

            const docRef = db.collection('mythologies').doc(mythId);

            // Build complete mythology document
            const mythData = {
                // Core identity
                id: enhancement.id,
                name: enhancement.name,
                icon: enhancement.icon,
                description: enhancement.description,
                color: enhancement.color,

                // Categories with actual counts
                categories: counts.categories,
                totalContent: counts.totalFiles,

                // Enhanced metadata
                metadata: enhancement.metadata,

                // Search configuration
                search: enhancement.search,

                // Rendering configuration
                rendering: generateRenderingConfig(),

                // Relationships
                relationships: generateRelationships(mythId),

                // Timestamps
                lastUpdated: timestamp,
                updatedBy: 'AGENT_11_UPDATE_SCRIPT'
            };

            batch.set(docRef, mythData, { merge: true });

            console.log(`✅ ${enhancement.name}`);
            console.log(`   - Total content: ${counts.totalFiles}`);
            console.log(`   - Categories: ${Object.keys(counts.categories).length}`);
            console.log(`   - Completeness: ${enhancement.metadata.completeness}%`);
            console.log('');

            updateCount++;
        }

        // Commit the batch
        await batch.commit();

        console.log('\n═══════════════════════════════════════════');
        console.log(`🎉 Successfully updated ${updateCount} mythologies!`);
        console.log('═══════════════════════════════════════════\n');

        console.log('📊 Summary Statistics:');
        const totalContent = Object.values(categoryCounts).reduce((sum, m) => sum + m.totalFiles, 0);
        const avgContent = Math.round(totalContent / updateCount);
        const featured = Object.values(mythologyEnhancements).filter(m => m.metadata.featured).length;

        console.log(`   - Total mythologies: ${updateCount}`);
        console.log(`   - Total content items: ${totalContent}`);
        console.log(`   - Average per mythology: ${avgContent}`);
        console.log(`   - Featured mythologies: ${featured}`);

        console.log('\n✨ Enhancements Applied:');
        console.log('   ✓ Accurate category counts from file system');
        console.log('   ✓ Rendering configuration for all display modes');
        console.log('   ✓ Enhanced metadata (region, period, language, completeness)');
        console.log('   ✓ Search keywords and facets');
        console.log('   ✓ Cross-mythology relationships');
        console.log('   ✓ Display mode configurations');

    } catch (error) {
        console.error('❌ Error updating mythologies:', error);
        throw error;
    } finally {
        await admin.app().delete();
        console.log('\n✨ Done!');
    }
}

// Run the script
updateMythologies()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
