/**
 * Populate Additional Firebase Collections
 *
 * Creates collection structure for: items, places, theories, and user submissions
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (reuse existing app if available)
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

/**
 * Create example items
 */
const exampleItems = [
    {
        id: 'excalibur',
        name: 'Excalibur',
        mythology: 'celtic',
        type: 'weapon',
        description: 'The legendary sword of King Arthur, drawn from the stone',
        powers: ['Unbreakable blade', 'Grants leadership', 'Symbol of rightful sovereignty'],
        owner: 'King Arthur',
        status: 'legendary',
        importance: 95
    },
    {
        id: 'mjolnir',
        name: 'Mjölnir',
        mythology: 'norse',
        type: 'weapon',
        description: 'Thor\'s hammer, forged by dwarves',
        powers: ['Returns to wielder', 'Controls lightning', 'Destroys giants'],
        owner: 'Thor',
        status: 'legendary',
        importance: 98
    },
    {
        id: 'golden-fleece',
        name: 'Golden Fleece',
        mythology: 'greek',
        type: 'artifact',
        description: 'The fleece of the golden ram, sought by Jason and the Argonauts',
        powers: ['Grants healing', 'Symbol of authority', 'Brings prosperity'],
        status: 'legendary',
        importance: 85
    }
];

/**
 * Create example places
 */
const examplePlaces = [
    {
        id: 'mount-olympus',
        name: 'Mount Olympus',
        mythology: 'greek',
        type: 'sacred-mountain',
        description: 'Home of the twelve Olympian gods',
        location: 'Greece',
        significance: 'Dwelling place of the gods',
        inhabitants: ['Zeus', 'Hera', 'Poseidon', 'Athena', 'Apollo', 'Artemis'],
        status: 'mythical',
        importance: 100
    },
    {
        id: 'valhalla',
        name: 'Valhalla',
        mythology: 'norse',
        type: 'afterlife',
        description: 'Odin\'s hall where slain warriors feast and prepare for Ragnarok',
        location: 'Asgard',
        significance: 'Hall of the slain warriors',
        inhabitants: ['Odin', 'Einherjar', 'Valkyries'],
        status: 'mythical',
        importance: 98
    },
    {
        id: 'duat',
        name: 'Duat',
        mythology: 'egyptian',
        type: 'underworld',
        description: 'The Egyptian underworld where souls are judged',
        significance: 'Realm of the dead and judgment',
        inhabitants: ['Osiris', 'Anubis', 'Ammit'],
        status: 'mythical',
        importance: 95
    },
    {
        id: 'mount-meru',
        name: 'Mount Meru',
        mythology: 'hindu',
        type: 'sacred-mountain',
        description: 'The cosmic mountain at the center of the universe',
        significance: 'Axis mundi, home of the gods',
        inhabitants: ['Brahma', 'Indra', 'Devas'],
        status: 'mythical',
        importance: 98
    }
];

/**
 * Create example theories
 */
const exampleTheories = [
    {
        id: 'indo-european-sky-father',
        title: 'Indo-European Sky Father',
        category: 'comparative-mythology',
        description: 'The theory that Zeus, Jupiter, Dyaus Pita, and Odin derive from a common Proto-Indo-European sky god',
        evidence: [
            'Linguistic similarities in god names',
            'Common attributes (sky, thunder, kingship)',
            'Similar mythological roles across cultures'
        ],
        mythologies: ['greek', 'roman', 'hindu', 'norse'],
        status: 'widely-accepted',
        scholar: 'Various comparative mythologists',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'dying-rising-god',
        title: 'Dying and Rising God',
        category: 'mythological-archetype',
        description: 'The pattern of deities who die and are resurrected, often tied to agricultural cycles',
        evidence: [
            'Osiris (Egyptian)',
            'Dionysus (Greek)',
            'Dumuzi/Tammuz (Sumerian/Babylonian)',
            'Persephone\'s seasonal descent and return'
        ],
        mythologies: ['egyptian', 'greek', 'sumerian', 'babylonian'],
        status: 'debated',
        scholar: 'James Frazer, Carl Jung',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'flood-myth-universality',
        title: 'Universal Flood Myths',
        category: 'comparative-mythology',
        description: 'The theory explaining why flood myths appear in cultures worldwide',
        evidence: [
            'Epic of Gilgamesh (Mesopotamian)',
            'Noah\'s Ark (Biblical)',
            'Deucalion (Greek)',
            'Manu (Hindu)',
            'Gun-Yu (Chinese)'
        ],
        mythologies: ['sumerian', 'babylonian', 'christian', 'greek', 'hindu', 'chinese'],
        status: 'widely-documented',
        scholar: 'Various anthropologists',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
];

/**
 * Create submissions collection structure (empty, for user-generated content)
 */
const submissionsStructure = {
    description: 'User submissions for deities, entities, and other mythological content',
    schema: {
        submittedBy: 'user ID',
        submittedAt: 'timestamp',
        type: 'deity | hero | creature | place | item | text',
        mythology: 'mythology ID',
        data: 'submitted entity data object',
        status: 'pending | approved | rejected',
        reviewedBy: 'admin user ID (optional)',
        reviewedAt: 'timestamp (optional)',
        reviewNotes: 'string (optional)'
    },
    moderationRules: {
        autoApprove: false,
        requiresReview: true,
        minimumReputation: 0
    }
};

/**
 * Main population function
 */
async function populateCollections() {
    console.log('🔥 Starting additional collections population...\n');

    try {
        const batch = db.batch();
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        // Create Items
        console.log('📦 Creating items...');
        exampleItems.forEach(item => {
            const docRef = db.collection('items').doc(item.id);
            batch.set(docRef, {
                ...item,
                createdAt: timestamp,
                lastUpdated: timestamp
            }, { merge: true });
            console.log(`  ✅ ${item.name} (${item.mythology})`);
        });

        // Create Places
        console.log('\n🗺️  Creating places...');
        examplePlaces.forEach(place => {
            const docRef = db.collection('places').doc(place.id);
            batch.set(docRef, {
                ...place,
                createdAt: timestamp,
                lastUpdated: timestamp
            }, { merge: true });
            console.log(`  ✅ ${place.name} (${place.mythology})`);
        });

        // Create Theories
        console.log('\n🧠 Creating theories...');
        exampleTheories.forEach(theory => {
            const docRef = db.collection('theories').doc(theory.id);
            batch.set(docRef, {
                ...theory,
                createdAt: timestamp,
                lastUpdated: timestamp
            }, { merge: true });
            console.log(`  ✅ ${theory.title}`);
        });

        // Create Submissions collection metadata
        console.log('\n📝 Creating submissions collection structure...');
        const submissionsMetaRef = db.collection('_metadata').doc('submissions');
        batch.set(submissionsMetaRef, {
            ...submissionsStructure,
            createdAt: timestamp,
            totalSubmissions: 0,
            pendingSubmissions: 0
        }, { merge: true });
        console.log('  ✅ Submissions collection structure created');

        // Commit batch
        await batch.commit();

        console.log('\n🎉 Successfully populated all collections!');
        console.log('\n📊 Summary:');
        console.log(`   - Items: ${exampleItems.length}`);
        console.log(`   - Places: ${examplePlaces.length}`);
        console.log(`   - Theories: ${exampleTheories.length}`);
        console.log(`   - Submissions: Structure created (ready for user content)`);

    } catch (error) {
        console.error('❌ Error populating collections:', error);
        throw error;
    } finally {
        await admin.app().delete();
        console.log('\n✨ Done!');
    }
}

// Run the script
populateCollections()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
