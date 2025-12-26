/**
 * Create Page Assets in Firebase
 *
 * This script creates a 'pages' collection with standardized page assets
 * that can be dynamically rendered, including the landing page.
 */

const admin = require('firebase-admin');

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

/**
 * Standard Page Asset Template
 * All pages follow this structure for consistent rendering
 */
const pageAssetTemplate = {
    id: '',                    // Unique page identifier
    title: '',                 // Page title
    subtitle: '',              // Optional subtitle
    description: '',           // Page description
    icon: '',                  // Icon emoji
    type: 'landing',           // Page type: landing, category, detail
    layout: 'grid',            // Layout: grid, list, detail
    hero: {                    // Hero section (optional)
        title: '',
        subtitle: '',
        background: '',
        cta: []                // Call-to-action buttons
    },
    sections: [],              // Page sections (array of section objects)
    panelCards: [],            // Panel cards to display
    metadata: {
        created: null,
        updated: null,
        author: 'system',
        version: '1.0',
        status: 'active'
    }
};

/**
 * Landing Page Asset
 */
const landingPage = {
    id: 'home',
    title: 'Eyes of Azrael',
    subtitle: 'World Mythos Explorer',
    description: 'A comprehensive encyclopedia of world mythologies, magical systems, sacred herbalism, and spiritual traditions spanning 6000+ years of human history',
    icon: '👁️',
    type: 'landing',
    layout: 'grid',
    hero: {
        title: 'Eyes of Azrael',
        subtitle: 'Explore the myths, legends, and sacred traditions of humanity',
        background: 'cosmic',
        cta: [
            {
                text: 'Explore Mythologies',
                link: '#/mythologies',
                icon: '🏛️',
                primary: true
            },
            {
                text: 'Browse All Content',
                link: '#/browse',
                icon: '📚',
                primary: false
            }
        ]
    },
    sections: [
        {
            id: 'mythologies',
            title: 'World Mythologies',
            description: 'Explore gods, heroes, and legends from cultures around the world',
            icon: '🏛️',
            type: 'panel-cards',
            collection: 'mythologies',
            link: '#/mythologies',
            displayCount: 12,
            sortBy: 'order',
            featured: true
        },
        {
            id: 'places',
            title: 'Sacred Places',
            description: 'Discover mythical locations and sacred sites',
            icon: '🗺️',
            type: 'panel-cards',
            collection: 'places',
            link: '#/places',
            displayCount: 6,
            sortBy: 'importance',
            featured: true
        },
        {
            id: 'items',
            title: 'Legendary Items',
            description: 'Artifacts of power from myth and legend',
            icon: '⚔️',
            type: 'panel-cards',
            collection: 'items',
            link: '#/items',
            displayCount: 6,
            sortBy: 'importance',
            featured: true
        },
        {
            id: 'archetypes',
            title: 'Mythological Archetypes',
            description: 'Universal patterns across world mythologies',
            icon: '🎭',
            type: 'panel-cards',
            collection: 'archetypes',
            link: '#/archetypes',
            displayCount: 6,
            sortBy: 'name',
            featured: true
        },
        {
            id: 'theories',
            title: 'Theories & Analysis',
            description: 'Scholarly interpretations and comparative mythology',
            icon: '🧠',
            type: 'panel-cards',
            collection: 'theories',
            link: '#/theories',
            displayCount: 4,
            sortBy: 'created',
            featured: false
        },
        {
            id: 'submissions',
            title: 'Community Contributions',
            description: 'User-submitted content and research',
            icon: '📝',
            type: 'panel-cards',
            collection: 'submissions',
            link: '#/submissions',
            displayCount: 4,
            sortBy: 'created',
            featured: false
        }
    ],
    panelCards: [
        // Panel cards will be dynamically loaded from collections
        // specified in the sections array
    ],
    metadata: {
        created: admin.firestore.FieldValue.serverTimestamp(),
        updated: admin.firestore.FieldValue.serverTimestamp(),
        author: 'system',
        version: '1.0',
        status: 'active',
        featured: true
    }
};

/**
 * Mythologies Category Page
 */
const mythologiesPage = {
    id: 'mythologies',
    title: 'World Mythologies',
    subtitle: 'Explore the sacred traditions of humanity',
    description: 'Browse mythological traditions from around the world, each with their pantheons, heroes, creatures, and sacred texts',
    icon: '🏛️',
    type: 'category',
    layout: 'grid',
    hero: {
        title: 'World Mythologies',
        subtitle: 'Gods, heroes, and legends from every culture',
        background: 'mythology-mosaic'
    },
    sections: [
        {
            id: 'all-mythologies',
            title: 'All Traditions',
            description: 'Browse all mythological traditions',
            type: 'panel-cards',
            collection: 'mythologies',
            displayCount: 0, // 0 = show all
            sortBy: 'order',
            filters: {
                status: 'active'
            }
        }
    ],
    metadata: {
        created: admin.firestore.FieldValue.serverTimestamp(),
        updated: admin.firestore.FieldValue.serverTimestamp(),
        author: 'system',
        version: '1.0',
        status: 'active'
    }
};

/**
 * Places Category Page
 */
const placesPage = {
    id: 'places',
    title: 'Sacred Places',
    subtitle: 'Mythical locations and sacred sites',
    description: 'Explore sacred mountains, mystical realms, and legendary locations from world mythology',
    icon: '🗺️',
    type: 'category',
    layout: 'grid',
    sections: [
        {
            id: 'all-places',
            title: 'All Places',
            type: 'panel-cards',
            collection: 'places',
            sortBy: 'importance'
        }
    ],
    metadata: {
        created: admin.firestore.FieldValue.serverTimestamp(),
        updated: admin.firestore.FieldValue.serverTimestamp(),
        author: 'system',
        version: '1.0',
        status: 'active'
    }
};

/**
 * Items Category Page
 */
const itemsPage = {
    id: 'items',
    title: 'Legendary Items',
    subtitle: 'Artifacts of power and significance',
    description: 'Weapons, artifacts, and magical objects from myth and legend',
    icon: '⚔️',
    type: 'category',
    layout: 'grid',
    sections: [
        {
            id: 'all-items',
            title: 'All Items',
            type: 'panel-cards',
            collection: 'items',
            sortBy: 'importance'
        }
    ],
    metadata: {
        created: admin.firestore.FieldValue.serverTimestamp(),
        updated: admin.firestore.FieldValue.serverTimestamp(),
        author: 'system',
        version: '1.0',
        status: 'active'
    }
};

/**
 * Archetypes Category Page
 */
const archetypesPage = {
    id: 'archetypes',
    title: 'Mythological Archetypes',
    subtitle: 'Universal patterns in world mythology',
    description: 'Discover recurring themes, characters, and patterns that appear across cultures',
    icon: '🎭',
    type: 'category',
    layout: 'grid',
    sections: [
        {
            id: 'all-archetypes',
            title: 'All Archetypes',
            type: 'panel-cards',
            collection: 'archetypes',
            sortBy: 'name'
        }
    ],
    metadata: {
        created: admin.firestore.FieldValue.serverTimestamp(),
        updated: admin.firestore.FieldValue.serverTimestamp(),
        author: 'system',
        version: '1.0',
        status: 'active'
    }
};

/**
 * Theories Category Page
 */
const theoriesPage = {
    id: 'theories',
    title: 'Theories & Analysis',
    subtitle: 'Scholarly interpretations of myth',
    description: 'Comparative mythology, academic theories, and interpretive frameworks',
    icon: '🧠',
    type: 'category',
    layout: 'list',
    sections: [
        {
            id: 'all-theories',
            title: 'All Theories',
            type: 'panel-cards',
            collection: 'theories',
            sortBy: 'created'
        }
    ],
    metadata: {
        created: admin.firestore.FieldValue.serverTimestamp(),
        updated: admin.firestore.FieldValue.serverTimestamp(),
        author: 'system',
        version: '1.0',
        status: 'active'
    }
};

/**
 * Submissions Category Page
 */
const submissionsPage = {
    id: 'submissions',
    title: 'Community Contributions',
    subtitle: 'User-submitted research and content',
    description: 'Contributions from the Eyes of Azrael community',
    icon: '📝',
    type: 'category',
    layout: 'list',
    sections: [
        {
            id: 'recent-submissions',
            title: 'Recent Submissions',
            type: 'panel-cards',
            collection: 'submissions',
            sortBy: 'created',
            displayCount: 20
        }
    ],
    metadata: {
        created: admin.firestore.FieldValue.serverTimestamp(),
        updated: admin.firestore.FieldValue.serverTimestamp(),
        author: 'system',
        version: '1.0',
        status: 'active'
    }
};

/**
 * Create all page assets
 */
async function createPageAssets() {
    console.log('🚀 Creating page assets in Firebase...\n');

    const pages = [
        landingPage,
        mythologiesPage,
        placesPage,
        itemsPage,
        archetypesPage,
        theoriesPage,
        submissionsPage
    ];

    try {
        const batch = db.batch();

        for (const page of pages) {
            const ref = db.collection('pages').doc(page.id);
            batch.set(ref, page);
            console.log(`✅ Queued: ${page.title} (${page.id})`);
        }

        await batch.commit();
        console.log(`\n🎉 Successfully created ${pages.length} page assets!`);
        console.log('\n📊 Pages created:');
        pages.forEach(p => console.log(`   - ${p.id}: ${p.title}`));

        console.log('\n✨ Page assets are ready for dynamic rendering!');

    } catch (error) {
        console.error('❌ Error creating page assets:', error);
        throw error;
    }
}

// Run the script
createPageAssets()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
