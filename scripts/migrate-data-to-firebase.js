#!/usr/bin/env node

/**
 * Data Migration Script: Migrate Static Data to Firebase
 *
 * This script reads the existing static data files and migrates them
 * to Firebase Firestore collections.
 *
 * Prerequisites:
 * - Firebase Admin SDK installed: npm install firebase-admin
 * - Service account key JSON file
 * - Firebase project initialized
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Parse the mythos_data.js file to extract mythology data
 */
function parseMythosData() {
    const mythosDataPath = path.join(__dirname, '..', 'mythos_data.js');
    const content = fs.readFileSync(mythosDataPath, 'utf8');

    // Extract MYTHOLOGY_BRANCHES array
    const branchesMatch = content.match(/const MYTHOLOGY_BRANCHES = (\[[\s\S]*?\]);/);
    if (!branchesMatch) {
        throw new Error('Could not find MYTHOLOGY_BRANCHES in mythos_data.js');
    }

    // Use eval to parse (in production, use a proper JS parser)
    const MYTHOLOGY_BRANCHES = eval(branchesMatch[1]);

    return MYTHOLOGY_BRANCHES.map(branch => ({
        id: branch.id,
        displayName: branch.displayName,
        icon: branch.icon,
        description: branch.description || '',
        era: branch.era || 'Unknown',
        regions: branch.regions || [],
        color: branch.color || '#9370DB',
        completed: branch.completed || false,
        coreConcepts: branch.coreConcepts || [],
        keyTexts: branch.keyTexts || [],
        metadata: {
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'system',
            verified: true,
            source: 'static_migration'
        }
    }));
}

/**
 * Migrate mythologies to Firestore
 */
async function migrateMythologies() {
    console.log('📦 Migrating mythologies to Firestore...');

    const mythologies = parseMythosData();
    const batch = db.batch();

    mythologies.forEach(mythology => {
        const docRef = db.collection('mythologies').doc(mythology.id);
        batch.set(docRef, mythology);
    });

    await batch.commit();
    console.log(`✅ Migrated ${mythologies.length} mythologies`);

    return mythologies.length;
}

/**
 * Create sample deities from HTML files
 * (This is a simplified version - in production, parse actual HTML deity pages)
 */
async function migrateSampleDeities() {
    console.log('📦 Creating sample deities...');

    const sampleDeities = [
        {
            id: 'zeus',
            name: 'Zeus',
            mythology: 'greek',
            displayName: 'Zeus (Ζεύς)',
            archetypes: ['sky-father', 'divine-king'],
            domains: ['sky', 'thunder', 'justice', 'kingship'],
            symbols: ['thunderbolt', 'eagle', 'oak'],
            description: 'King of the Olympian gods, god of the sky and thunder.',
            epithets: ['Cloud-Gatherer', 'Father of Gods and Men', 'Olympian'],
            relationships: {
                father: 'cronus',
                mother: 'rhea',
                consort: 'hera',
                children: ['apollo', 'artemis', 'athena', 'ares', 'dionysus']
            },
            metadata: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
                verified: true,
                submissionType: 'system'
            }
        },
        {
            id: 'shiva',
            name: 'Shiva',
            mythology: 'hindu',
            displayName: 'Shiva (शिव)',
            archetypes: ['destroyer', 'transformer', 'cosmic-dancer'],
            domains: ['destruction', 'transformation', 'meditation', 'yoga'],
            symbols: ['trident', 'crescent moon', 'cobra', 'third eye'],
            description: 'The Destroyer and Transformer, one of the principal deities of Hinduism.',
            epithets: ['Mahadeva', 'Nataraja', 'Mahayogi'],
            relationships: {
                consort: 'parvati',
                children: ['ganesha', 'kartikeya']
            },
            metadata: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
                verified: true,
                submissionType: 'system'
            }
        },
        {
            id: 'yahweh',
            name: 'Yahweh',
            mythology: 'jewish',
            displayName: 'Yahweh (יהוה)',
            archetypes: ['cosmic-creator', 'sky-father', 'divine-lawgiver'],
            domains: ['creation', 'law', 'covenant', 'monotheism'],
            symbols: ['burning bush', 'tablets of law', 'tetragrammaton'],
            description: 'The God of Israel, creator of the universe and giver of the Torah.',
            epithets: ['Adonai', 'Elohim', 'El Shaddai', 'The Name'],
            relationships: {},
            metadata: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
                verified: true,
                submissionType: 'system'
            }
        }
    ];

    const batch = db.batch();

    sampleDeities.forEach(deity => {
        const docRef = db.collection('deities').doc(deity.id);
        batch.set(docRef, deity);
    });

    await batch.commit();
    console.log(`✅ Created ${sampleDeities.length} sample deities`);

    return sampleDeities.length;
}

/**
 * Create sample archetypes
 */
async function migrateArchetypes() {
    console.log('📦 Creating archetypes...');

    const archetypes = [
        {
            id: 'sky-father',
            name: 'Sky Father',
            icon: '⚡',
            description: 'Patriarchal deity associated with the sky, thunder, and cosmic order.',
            characteristics: [
                'Rules from the heavens',
                'Associated with thunder and lightning',
                'Patriarchal authority',
                'Cosmic kingship'
            ],
            occurrences: {
                greek: { deity: 'zeus', description: 'King of Olympus, wielder of thunderbolts' },
                norse: { deity: 'odin', description: 'All-Father, ruler of Asgard' },
                hindu: { deity: 'indra', description: 'King of gods, wielder of vajra' },
                jewish: { deity: 'yahweh', description: 'God of Israel, creator and lawgiver' }
            },
            relatedArchetypes: ['divine-king', 'war-god'],
            metadata: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
                verified: true
            }
        },
        {
            id: 'trickster',
            name: 'Trickster',
            icon: '🎭',
            description: 'Cunning deity who breaks rules, creates chaos, and teaches through mischief.',
            characteristics: [
                'Shape-shifting abilities',
                'Challenges authority',
                'Brings both help and harm',
                'Cultural boundary-crosser'
            ],
            occurrences: {
                norse: { deity: 'loki', description: 'Shape-shifter, father of monsters' },
                greek: { deity: 'hermes', description: 'Messenger god, patron of thieves' },
                african: { deity: 'anansi', description: 'Spider trickster of Akan folklore' },
                native_american: { deity: 'coyote', description: 'Clever trickster of many tribes' }
            },
            relatedArchetypes: ['culture-hero', 'threshold-guardian'],
            metadata: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
                verified: true
            }
        },
        {
            id: 'earth-mother',
            name: 'Earth Mother',
            icon: '🌍',
            description: 'Maternal deity associated with fertility, nature, and nurturing.',
            characteristics: [
                'Fertility and abundance',
                'Nurturing and protective',
                'Connection to nature',
                'Life-giving powers'
            ],
            occurrences: {
                greek: { deity: 'gaia', description: 'Primordial earth goddess' },
                norse: { deity: 'frigg', description: 'Mother goddess, wife of Odin' },
                hindu: { deity: 'prithvi', description: 'Earth goddess' },
                sumerian: { deity: 'ninhursag', description: 'Mother of all living' }
            },
            relatedArchetypes: ['great-goddess', 'fertility-deity'],
            metadata: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
                verified: true
            }
        }
    ];

    const batch = db.batch();

    archetypes.forEach(archetype => {
        const docRef = db.collection('archetypes').doc(archetype.id);
        batch.set(docRef, archetype);
    });

    await batch.commit();
    console.log(`✅ Created ${archetypes.length} archetypes`);

    return archetypes.length;
}

/**
 * Create widget templates
 */
async function createWidgetTemplates() {
    console.log('📦 Creating widget templates...');

    const widgets = [
        {
            id: 'deity_card',
            type: 'card',
            template: 'deity',
            config: {
                fields: ['name', 'mythology', 'archetypes', 'domains', 'symbols'],
                layout: 'card',
                style: 'glass-card'
            },
            htmlTemplate: `
                <div class="deity-card">
                    <h3>{{displayName}}</h3>
                    <p class="mythology-badge">{{mythology}}</p>
                    <p>{{description}}</p>
                    <div class="archetypes">
                        {{#archetypes}}
                            <span class="archetype-badge">{{.}}</span>
                        {{/archetypes}}
                    </div>
                    <div class="domains">
                        <strong>Domains:</strong> {{domains}}
                    </div>
                </div>
            `,
            metadata: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
                verified: true
            }
        },
        {
            id: 'mythology_grid',
            type: 'grid',
            template: 'mythology',
            config: {
                columns: 'auto-fit',
                minWidth: '280px',
                gap: '1.5rem'
            },
            htmlTemplate: `
                <div class="mythology-grid">
                    {{#mythologies}}
                        <div class="mythos-card" data-id="{{id}}">
                            <div class="mythos-icon">{{icon}}</div>
                            <div class="mythos-name">{{displayName}}</div>
                            <div class="mythos-description">{{description}}</div>
                        </div>
                    {{/mythologies}}
                </div>
            `,
            metadata: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
                verified: true
            }
        }
    ];

    const batch = db.batch();

    widgets.forEach(widget => {
        const docRef = db.collection('content_widgets').doc(widget.id);
        batch.set(docRef, widget);
    });

    await batch.commit();
    console.log(`✅ Created ${widgets.length} widget templates`);

    return widgets.length;
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log('🚀 Starting Firebase data migration...\n');

    try {
        const stats = {
            mythologies: 0,
            deities: 0,
            archetypes: 0,
            widgets: 0
        };

        stats.mythologies = await migrateMythologies();
        stats.deities = await migrateSampleDeities();
        stats.archetypes = await migrateArchetypes();
        stats.widgets = await createWidgetTemplates();

        console.log('\n✅ Migration complete!');
        console.log('\n📊 Summary:');
        console.log(`   - Mythologies: ${stats.mythologies}`);
        console.log(`   - Deities: ${stats.deities}`);
        console.log(`   - Archetypes: ${stats.archetypes}`);
        console.log(`   - Widget Templates: ${stats.widgets}`);
        console.log('\n📝 Next steps:');
        console.log('   1. Verify data in Firebase Console');
        console.log('   2. Deploy Firestore security rules');
        console.log('   3. Create Firestore indexes');
        console.log('   4. Test the index_firebase.html page');
        console.log('   5. Migrate remaining deity pages from HTML');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if called directly
if (require.main === module) {
    runMigration();
}

module.exports = {
    migrateMythologies,
    migrateSampleDeities,
    migrateArchetypes,
    createWidgetTemplates
};
