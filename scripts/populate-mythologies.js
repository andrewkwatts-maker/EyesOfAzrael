/**
 * Populate Firebase Mythologies Collection
 *
 * This script creates the mythologies collection in Firestore with all
 * mythology traditions and their metadata.
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'eyesofazrael'
});

const db = admin.firestore();

// Mythologies data
const mythologies = [
    {
        id: 'greek',
        name: 'Greek Mythology',
        icon: '🏛️',
        description: 'Gods of Olympus and heroes of ancient Greece',
        color: 'var(--color-primary, #8b7fff)',
        order: 1,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 },
            places: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: true
    },
    {
        id: 'norse',
        name: 'Norse Mythology',
        icon: '⚔️',
        description: 'Warriors of Asgard and the Nine Realms',
        color: '#4a9eff',
        order: 2,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 },
            places: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: true
    },
    {
        id: 'egyptian',
        name: 'Egyptian Mythology',
        icon: '𓂀',
        description: 'Keepers of the Nile and guardians of Ma\'at',
        color: '#ffd93d',
        order: 3,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 },
            places: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: true
    },
    {
        id: 'hindu',
        name: 'Hindu Mythology',
        icon: '🕉️',
        description: 'The Trimurti and cosmic cycles of creation',
        color: '#ff7eb6',
        order: 4,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: true
    },
    {
        id: 'buddhist',
        name: 'Buddhist Tradition',
        icon: '☸️',
        description: 'Bodhisattvas and the path to enlightenment',
        color: '#51cf66',
        order: 5,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: true
    },
    {
        id: 'chinese',
        name: 'Chinese Mythology',
        icon: '🐉',
        description: 'Dragons, immortals, and celestial bureaucracy',
        color: '#f85a8f',
        order: 6,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'japanese',
        name: 'Japanese Mythology',
        icon: '⛩️',
        description: 'Kami spirits and the creation of Japan',
        color: '#fb9f7f',
        order: 7,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'celtic',
        name: 'Celtic Mythology',
        icon: '🍀',
        description: 'Druids, faeries, and the Tuatha Dé Danann',
        color: '#7fd9d3',
        order: 8,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'babylonian',
        name: 'Babylonian Mythology',
        icon: '🏛️',
        description: 'The Enuma Elish and gods of Mesopotamia',
        color: '#b965e6',
        order: 9,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'persian',
        name: 'Persian Mythology',
        icon: '🔥',
        description: 'Zoroastrian wisdom and the eternal flame',
        color: '#7fb0f9',
        order: 10,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'christian',
        name: 'Christian Tradition',
        icon: '✟',
        description: 'Angels, saints, and biblical narratives',
        color: '#a8edea',
        order: 11,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 },
            magic: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'islamic',
        name: 'Islamic Tradition',
        icon: '☪️',
        description: 'Prophets, angels, and divine revelation',
        color: '#fed6e3',
        order: 12,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 },
            herbs: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'roman',
        name: 'Roman Mythology',
        icon: '🏛️',
        description: 'Imperial gods and the foundation of Rome',
        color: '#667eea',
        order: 13,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'sumerian',
        name: 'Sumerian Mythology',
        icon: '📜',
        description: 'The first written myths and ancient wisdom',
        color: '#9E9E9E',
        order: 14,
        categories: {
            deities: { enabled: true, count: 0 },
            heroes: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            texts: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'aztec',
        name: 'Aztec Mythology',
        icon: '☀️',
        description: 'Solar deities and the Fifth Sun',
        color: '#FF9800',
        order: 15,
        categories: {
            deities: { enabled: true, count: 0 },
            creatures: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'mayan',
        name: 'Mayan Mythology',
        icon: '🗿',
        description: 'The Popol Vuh and Hero Twins',
        color: '#8BC34A',
        order: 16,
        categories: {
            deities: { enabled: true, count: 0 },
            cosmology: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    },
    {
        id: 'yoruba',
        name: 'Yoruba Tradition',
        icon: '👑',
        description: 'Orishas and West African spirituality',
        color: '#9C27B0',
        order: 17,
        categories: {
            deities: { enabled: true, count: 0 },
            rituals: { enabled: true, count: 0 }
        },
        status: 'active',
        featured: false
    }
];

/**
 * Main function to populate mythologies
 */
async function populateMythologies() {
    console.log('🔥 Starting Firebase mythologies population...\n');

    try {
        const batch = db.batch();
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        mythologies.forEach(myth => {
            const docRef = db.collection('mythologies').doc(myth.id);
            const mythData = {
                ...myth,
                lastUpdated: timestamp,
                createdAt: timestamp
            };

            batch.set(docRef, mythData, { merge: true });
            console.log(`✅ Queued: ${myth.name} (${myth.id})`);
        });

        await batch.commit();
        console.log(`\n🎉 Successfully created ${mythologies.length} mythology documents!`);
        console.log('\n📊 Summary:');
        console.log(`   - Total mythologies: ${mythologies.length}`);
        console.log(`   - Featured: ${mythologies.filter(m => m.featured).length}`);
        console.log(`   - Active: ${mythologies.filter(m => m.status === 'active').length}`);

    } catch (error) {
        console.error('❌ Error populating mythologies:', error);
        throw error;
    } finally {
        // Clean up
        await admin.app().delete();
        console.log('\n✨ Done!');
    }
}

// Run the script
populateMythologies()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
