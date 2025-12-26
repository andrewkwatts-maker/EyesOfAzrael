/**
 * Migrate Mythologies to Firebase
 *
 * This script populates the 'mythologies' collection in Firestore
 * with the hardcoded mythology data from HomeView.
 *
 * Run this ONCE to set up the collection.
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Mythology data (from HomeView.getFallbackMythologies())
const mythologies = [
    {
        id: 'greek',
        name: 'Greek Mythology',
        icon: '🏛️',
        description: 'Gods of Olympus and heroes of ancient Greece',
        color: '#8b7fff',
        order: 1,
        metadata: {
            region: 'Mediterranean',
            era: 'Ancient',
            pantheon: 'Olympian',
            primaryDeities: ['Zeus', 'Hera', 'Poseidon', 'Athena', 'Apollo'],
            majorTexts: ['Iliad', 'Odyssey', 'Theogony'],
            entityCount: 0
        }
    },
    {
        id: 'norse',
        name: 'Norse Mythology',
        icon: '⚔️',
        description: 'Warriors of Asgard and the Nine Realms',
        color: '#4a9eff',
        order: 2,
        metadata: {
            region: 'Scandinavia',
            era: 'Medieval',
            pantheon: 'Aesir and Vanir',
            primaryDeities: ['Odin', 'Thor', 'Loki', 'Freya', 'Frigg'],
            majorTexts: ['Prose Edda', 'Poetic Edda'],
            entityCount: 0
        }
    },
    {
        id: 'egyptian',
        name: 'Egyptian Mythology',
        icon: '𓂀',
        description: 'Keepers of the Nile and guardians of Ma\'at',
        color: '#ffd93d',
        order: 3,
        metadata: {
            region: 'Egypt',
            era: 'Ancient',
            pantheon: 'Ennead',
            primaryDeities: ['Ra', 'Osiris', 'Isis', 'Horus', 'Anubis'],
            majorTexts: ['Book of the Dead', 'Pyramid Texts', 'Coffin Texts'],
            entityCount: 0
        }
    },
    {
        id: 'hindu',
        name: 'Hindu Mythology',
        icon: '🕉️',
        description: 'The Trimurti and cosmic cycles of creation',
        color: '#ff7eb6',
        order: 4,
        metadata: {
            region: 'India',
            era: 'Ancient to Modern',
            pantheon: 'Trimurti',
            primaryDeities: ['Brahma', 'Vishnu', 'Shiva', 'Lakshmi', 'Saraswati'],
            majorTexts: ['Vedas', 'Upanishads', 'Bhagavad Gita', 'Ramayana', 'Mahabharata'],
            entityCount: 0
        }
    },
    {
        id: 'buddhist',
        name: 'Buddhist Tradition',
        icon: '☸️',
        description: 'Bodhisattvas and the path to enlightenment',
        color: '#51cf66',
        order: 5,
        metadata: {
            region: 'Asia',
            era: 'Ancient to Modern',
            pantheon: 'Buddha and Bodhisattvas',
            primaryDeities: ['Gautama Buddha', 'Avalokiteshvara', 'Manjushri', 'Tara'],
            majorTexts: ['Tripitaka', 'Heart Sutra', 'Lotus Sutra', 'Diamond Sutra'],
            entityCount: 0
        }
    },
    {
        id: 'chinese',
        name: 'Chinese Mythology',
        icon: '🐉',
        description: 'Dragons, immortals, and celestial bureaucracy',
        color: '#f85a8f',
        order: 6,
        metadata: {
            region: 'China',
            era: 'Ancient to Modern',
            pantheon: 'Celestial Hierarchy',
            primaryDeities: ['Jade Emperor', 'Guanyin', 'Nezha', 'Dragon Kings'],
            majorTexts: ['Journey to the West', 'Fengshen Yanyi', 'Classic of Mountains and Seas'],
            entityCount: 0
        }
    },
    {
        id: 'japanese',
        name: 'Japanese Mythology',
        icon: '⛩️',
        description: 'Kami spirits and the creation of Japan',
        color: '#fb9f7f',
        order: 7,
        metadata: {
            region: 'Japan',
            era: 'Ancient to Modern',
            pantheon: 'Kami',
            primaryDeities: ['Amaterasu', 'Susanoo', 'Tsukuyomi', 'Izanagi', 'Izanami'],
            majorTexts: ['Kojiki', 'Nihon Shoki'],
            entityCount: 0
        }
    },
    {
        id: 'celtic',
        name: 'Celtic Mythology',
        icon: '🍀',
        description: 'Druids, faeries, and the Tuatha Dé Danann',
        color: '#7fd9d3',
        order: 8,
        metadata: {
            region: 'British Isles and Gaul',
            era: 'Ancient',
            pantheon: 'Tuatha Dé Danann',
            primaryDeities: ['Dagda', 'Morrigan', 'Lugh', 'Brigid', 'Cernunnos'],
            majorTexts: ['Mabinogion', 'Táin Bó Cúailnge', 'Ulster Cycle'],
            entityCount: 0
        }
    },
    {
        id: 'babylonian',
        name: 'Babylonian Mythology',
        icon: '🏛️',
        description: 'The Enuma Elish and gods of Mesopotamia',
        color: '#b965e6',
        order: 9,
        metadata: {
            region: 'Mesopotamia',
            era: 'Ancient',
            pantheon: 'Mesopotamian',
            primaryDeities: ['Marduk', 'Ishtar', 'Ea', 'Shamash', 'Sin'],
            majorTexts: ['Enuma Elish', 'Epic of Gilgamesh'],
            entityCount: 0
        }
    },
    {
        id: 'persian',
        name: 'Persian Mythology',
        icon: '🔥',
        description: 'Zoroastrian wisdom and the eternal flame',
        color: '#7fb0f9',
        order: 10,
        metadata: {
            region: 'Persia',
            era: 'Ancient',
            pantheon: 'Zoroastrian',
            primaryDeities: ['Ahura Mazda', 'Mithra', 'Anahita', 'Amesha Spentas'],
            majorTexts: ['Avesta', 'Gathas', 'Shahnameh'],
            entityCount: 0
        }
    },
    {
        id: 'christian',
        name: 'Christian Tradition',
        icon: '✟',
        description: 'Angels, saints, and biblical narratives',
        color: '#a8edea',
        order: 11,
        metadata: {
            region: 'Global',
            era: 'Ancient to Modern',
            pantheon: 'Trinity',
            primaryDeities: ['God the Father', 'Jesus Christ', 'Holy Spirit', 'Archangels'],
            majorTexts: ['Bible', 'Gospel of John', 'Book of Revelation', 'Apocrypha'],
            entityCount: 0
        }
    },
    {
        id: 'islamic',
        name: 'Islamic Tradition',
        icon: '☪️',
        description: 'Prophets, angels, and divine revelation',
        color: '#fed6e3',
        order: 12,
        metadata: {
            region: 'Global',
            era: 'Medieval to Modern',
            pantheon: 'Prophets and Angels',
            primaryDeities: ['Allah', 'Jibreel (Gabriel)', 'Prophets'],
            majorTexts: ['Quran', 'Hadith'],
            entityCount: 0
        }
    },
    {
        id: 'sumerian',
        name: 'Sumerian Mythology',
        icon: '📜',
        description: 'The oldest pantheon and cuneiform epics',
        color: '#9e9e9e',
        order: 13,
        metadata: {
            region: 'Mesopotamia',
            era: 'Ancient',
            pantheon: 'Anunnaki',
            primaryDeities: ['An', 'Enlil', 'Enki', 'Inanna', 'Utu'],
            majorTexts: ['Descent of Inanna', 'Enki and Ninmah', 'Eridu Genesis'],
            entityCount: 0
        }
    },
    {
        id: 'roman',
        name: 'Roman Mythology',
        icon: '🏛️',
        description: 'The gods of the eternal city and empire',
        color: '#673ab7',
        order: 14,
        metadata: {
            region: 'Rome',
            era: 'Ancient',
            pantheon: 'Roman Pantheon',
            primaryDeities: ['Jupiter', 'Juno', 'Mars', 'Venus', 'Neptune'],
            majorTexts: ['Aeneid', 'Metamorphoses', 'Fasti'],
            entityCount: 0
        }
    },
    {
        id: 'aztec',
        name: 'Aztec Mythology',
        icon: '☀️',
        description: 'The Fifth Sun and Mesoamerican cosmology',
        color: '#ff9800',
        order: 15,
        metadata: {
            region: 'Mesoamerica',
            era: 'Medieval',
            pantheon: 'Aztec Pantheon',
            primaryDeities: ['Quetzalcoatl', 'Tezcatlipoca', 'Huitzilopochtli', 'Tlaloc'],
            majorTexts: ['Codex Borgia', 'Florentine Codex'],
            entityCount: 0
        }
    },
    {
        id: 'mayan',
        name: 'Mayan Mythology',
        icon: '🗿',
        description: 'Lords of the underworld and cosmic cycles',
        color: '#8bc34a',
        order: 16,
        metadata: {
            region: 'Mesoamerica',
            era: 'Ancient',
            pantheon: 'Mayan Pantheon',
            primaryDeities: ['Kukulkan', 'Itzamna', 'Chaac', 'Ah Puch'],
            majorTexts: ['Popol Vuh', 'Dresden Codex', 'Madrid Codex'],
            entityCount: 0
        }
    },
    {
        id: 'yoruba',
        name: 'Yoruba Tradition',
        icon: '👑',
        description: 'Orishas and the divine city of Ile-Ife',
        color: '#9c27b0',
        order: 17,
        metadata: {
            region: 'West Africa',
            era: 'Ancient to Modern',
            pantheon: 'Orishas',
            primaryDeities: ['Olodumare', 'Obatala', 'Yemoja', 'Shango', 'Oshun'],
            majorTexts: ['Odu Ifa', 'Oral Traditions'],
            entityCount: 0
        }
    },
    {
        id: 'jewish',
        name: 'Jewish Tradition',
        icon: '✡️',
        description: 'Torah, Kabbalah, and mystical traditions',
        color: '#2196f3',
        order: 18,
        metadata: {
            region: 'Middle East',
            era: 'Ancient to Modern',
            pantheon: 'Monotheistic with Angels',
            primaryDeities: ['YHWH', 'Archangels', 'Sefirot'],
            majorTexts: ['Torah', 'Talmud', 'Zohar', 'Sefer Yetzirah'],
            entityCount: 0
        }
    },
    {
        id: 'native_american',
        name: 'Native American Traditions',
        icon: '🦅',
        description: 'Diverse spirits and creation stories',
        color: '#795548',
        order: 19,
        metadata: {
            region: 'North America',
            era: 'Ancient to Modern',
            pantheon: 'Diverse Traditions',
            primaryDeities: ['Great Spirit', 'Coyote', 'Raven', 'Thunderbird'],
            majorTexts: ['Oral Traditions'],
            entityCount: 0
        }
    },
    {
        id: 'apocryphal',
        name: 'Apocryphal Texts',
        icon: '📖',
        description: 'Hidden wisdom and angelic hierarchies',
        color: '#e91e63',
        order: 20,
        metadata: {
            region: 'Middle East',
            era: 'Ancient',
            pantheon: 'Angelic and Esoteric',
            primaryDeities: ['Metatron', 'Watchers', 'Sophia'],
            majorTexts: ['Book of Enoch', 'Jubilees', 'Testaments of the Twelve Patriarchs'],
            entityCount: 0
        }
    }
];

async function migrateMythologies() {
    console.log('🔥 Starting mythology migration to Firebase...\n');

    const batch = db.batch();
    let successCount = 0;
    let errorCount = 0;

    for (const mythology of mythologies) {
        try {
            console.log(`📝 Adding ${mythology.name} (${mythology.id})...`);

            const docRef = db.collection('mythologies').doc(mythology.id);

            // Add timestamps
            const data = {
                ...mythology,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            batch.set(docRef, data, { merge: true });
            successCount++;

            console.log(`   ✅ ${mythology.icon} ${mythology.name} - Order: ${mythology.order}`);

        } catch (error) {
            console.error(`   ❌ Error adding ${mythology.name}:`, error);
            errorCount++;
        }
    }

    try {
        console.log('\n🚀 Committing batch write...');
        await batch.commit();
        console.log('✅ Batch write completed successfully!\n');
    } catch (error) {
        console.error('❌ Batch commit failed:', error);
        process.exit(1);
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${mythologies.length}`);
    console.log('═══════════════════════════════════════\n');

    // Verify the migration
    console.log('🔍 Verifying migration...\n');
    await verifyMigration();
}

async function verifyMigration() {
    try {
        const snapshot = await db.collection('mythologies')
            .orderBy('order', 'asc')
            .get();

        console.log(`✅ Found ${snapshot.size} mythologies in Firestore\n`);

        if (snapshot.size > 0) {
            console.log('📋 Mythology List:');
            snapshot.forEach((doc, index) => {
                const data = doc.data();
                console.log(`   ${index + 1}. ${data.icon} ${data.name} (order: ${data.order})`);
            });
        } else {
            console.warn('⚠️  WARNING: Collection is empty!');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
        if (error.code === 'failed-precondition') {
            console.error('\n⚠️  INDEX REQUIRED!');
            console.error('   Create a Firestore index:');
            console.error('   Collection: mythologies');
            console.error('   Field: order');
            console.error('   Direction: ASCENDING');
            console.error('\n   Or use the Firebase Console to create the index automatically.');
        }
    }
}

async function updateEntityCounts() {
    console.log('\n🔢 Updating entity counts...\n');

    const collections = ['deities', 'heroes', 'creatures', 'texts', 'places', 'items', 'herbs', 'rituals'];

    for (const myth of mythologies) {
        let totalCount = 0;

        for (const collection of collections) {
            try {
                const snapshot = await db.collection(collection)
                    .where('mythology', '==', myth.id)
                    .get();

                totalCount += snapshot.size;

                if (snapshot.size > 0) {
                    console.log(`   ${myth.icon} ${myth.name}: ${snapshot.size} ${collection}`);
                }
            } catch (error) {
                // Collection might not exist, skip
            }
        }

        // Update the mythology document
        try {
            await db.collection('mythologies').doc(myth.id).update({
                'metadata.entityCount': totalCount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`   ✅ ${myth.name}: Total ${totalCount} entities\n`);
        } catch (error) {
            console.error(`   ❌ Error updating ${myth.name}:`, error);
        }
    }
}

async function createIndex() {
    console.log('\n📊 Creating Firestore index...');
    console.log('⚠️  NOTE: Indexes must be created via Firebase Console or CLI');
    console.log('   This script cannot create indexes automatically.\n');
    console.log('   Run this command:');
    console.log('   firebase deploy --only firestore:indexes\n');
    console.log('   Or create manually in Firebase Console:');
    console.log('   https://console.firebase.google.com/project/_/firestore/indexes\n');
}

// Main execution
async function main() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║  Mythology Migration to Firebase     ║');
    console.log('╚═══════════════════════════════════════╝\n');

    try {
        await migrateMythologies();
        await updateEntityCounts();
        await createIndex();

        console.log('\n✅ Migration completed successfully!\n');
        console.log('Next steps:');
        console.log('1. Create Firestore index (if not exists)');
        console.log('2. Update Firestore rules to allow read on /mythologies');
        console.log('3. Test HomeView with enhanced logging\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { migrateMythologies, verifyMigration, updateEntityCounts };
