/**
 * Port Mythology Metadata to Firebase
 * Extracts mythology metadata from existing HTML files and uploads to Firebase
 *
 * This script:
 * 1. Reads all mythology index.html files
 * 2. Extracts metadata (name, description, region, period, etc.)
 * 3. Creates documents in the 'mythologies' collection
 * 4. Preserves existing data if already in Firebase
 *
 * Usage: node scripts/port-mythology-metadata.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Mythology configurations
const mythologyConfigs = {
    'greek': {
        icon: '🏛️',
        region: 'Mediterranean',
        period: '800 BCE - 400 CE',
        colors: { primary: '#4169E1', secondary: '#FFD700' }
    },
    'norse': {
        icon: '⚔️',
        region: 'Scandinavia',
        period: '750 CE - 1050 CE',
        colors: { primary: '#4682B4', secondary: '#B0C4DE' }
    },
    'egyptian': {
        icon: '🔺',
        region: 'North Africa',
        period: '3000 BCE - 30 BCE',
        colors: { primary: '#DAA520', secondary: '#CD853F' }
    },
    'roman': {
        icon: '🏛️',
        region: 'Mediterranean',
        period: '753 BCE - 476 CE',
        colors: { primary: '#DC143C', secondary: '#FFD700' }
    },
    'celtic': {
        icon: '☘️',
        region: 'British Isles & Gaul',
        period: '500 BCE - 400 CE',
        colors: { primary: '#228B22', secondary: '#32CD32' }
    },
    'hindu': {
        icon: '🕉️',
        region: 'Indian Subcontinent',
        period: '1500 BCE - Present',
        colors: { primary: '#FF6347', secondary: '#FFD700' }
    },
    'chinese': {
        icon: '🐉',
        region: 'East Asia',
        period: '2000 BCE - Present',
        colors: { primary: '#DC143C', secondary: '#FFD700' }
    },
    'japanese': {
        icon: '⛩️',
        region: 'Japan',
        period: '700 CE - Present',
        colors: { primary: '#DC143C', secondary: '#FFFFFF' }
    },
    'sumerian': {
        icon: '📿',
        region: 'Mesopotamia',
        period: '4500 BCE - 1900 BCE',
        colors: { primary: '#8B4513', secondary: '#DAA520' }
    },
    'babylonian': {
        icon: '🌟',
        region: 'Mesopotamia',
        period: '1894 BCE - 539 BCE',
        colors: { primary: '#4169E1', secondary: '#DAA520' }
    },
    'persian': {
        icon: '🔥',
        region: 'Persia',
        period: '1500 BCE - 651 CE',
        colors: { primary: '#FF4500', secondary: '#FFD700' }
    },
    'mayan': {
        icon: '☀️',
        region: 'Mesoamerica',
        period: '2000 BCE - 1500 CE',
        colors: { primary: '#228B22', secondary: '#FFD700' }
    },
    'aztec': {
        icon: '🦅',
        region: 'Mesoamerica',
        period: '1300 CE - 1521 CE',
        colors: { primary: '#DC143C', secondary: '#FFD700' }
    },
    'yoruba': {
        icon: '👑',
        region: 'West Africa',
        period: '500 CE - Present',
        colors: { primary: '#DAA520', secondary: '#8B4513' }
    },
    'buddhist': {
        icon: '☸️',
        region: 'Asia',
        period: '500 BCE - Present',
        colors: { primary: '#FF8C00', secondary: '#FFD700' }
    },
    'christian': {
        icon: '✝️',
        region: 'Global',
        period: '30 CE - Present',
        colors: { primary: '#4169E1', secondary: '#FFD700' }
    },
    'jewish': {
        icon: '✡️',
        region: 'Middle East',
        period: '1200 BCE - Present',
        colors: { primary: '#4169E1', secondary: '#FFFFFF' }
    },
    'islamic': {
        icon: '☪️',
        region: 'Middle East',
        period: '610 CE - Present',
        colors: { primary: '#228B22', secondary: '#FFD700' }
    }
};

/**
 * Extract metadata from HTML file
 */
function extractMetadata(htmlPath, mythologyId) {
    try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Extract title
        const titleEl = doc.querySelector('h1');
        const title = titleEl ? titleEl.textContent.trim() : mythologyId;

        // Extract description
        const descEl = doc.querySelector('.mythology-description, .description, p');
        const description = descEl ? descEl.textContent.trim() : '';

        // Extract full description from multiple paragraphs
        const descParagraphs = Array.from(doc.querySelectorAll('.content p, .main-content p'))
            .slice(0, 3)
            .map(p => p.textContent.trim())
            .filter(Boolean);
        const fullDescription = descParagraphs.join('\n\n') || description;

        return {
            title,
            description: description.substring(0, 200),
            fullDescription: fullDescription.substring(0, 1000)
        };
    } catch (error) {
        console.error(`Error reading ${htmlPath}:`, error.message);
        return {
            title: mythologyId,
            description: '',
            fullDescription: ''
        };
    }
}

/**
 * Port a single mythology to Firebase
 */
async function portMythology(mythologyId, config) {
    console.log(`\nProcessing ${mythologyId}...`);

    try {
        // Check if already exists
        const docRef = db.collection('mythologies').doc(mythologyId);
        const doc = await docRef.get();

        if (doc.exists) {
            console.log(`  ✓ ${mythologyId} already exists, skipping`);
            return { success: true, skipped: true };
        }

        // Read HTML file
        const htmlPath = path.join(__dirname, '..', 'mythos', mythologyId, 'index.html');

        if (!fs.existsSync(htmlPath)) {
            console.warn(`  ⚠ HTML file not found: ${htmlPath}`);
            return { success: false, error: 'HTML file not found' };
        }

        const extracted = extractMetadata(htmlPath, mythologyId);

        // Create mythology document
        const mythologyData = {
            id: mythologyId,
            name: config.name || mythologyId.charAt(0).toUpperCase() + mythologyId.slice(1),
            icon: config.icon,
            region: config.region,
            period: config.period,
            colors: config.colors,
            description: extracted.description || `Explore the ${mythologyId} mythology`,
            fullDescription: extracted.fullDescription || extracted.description,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Upload to Firebase
        await docRef.set(mythologyData);

        console.log(`  ✓ ${mythologyId} uploaded successfully`);
        return { success: true, data: mythologyData };

    } catch (error) {
        console.error(`  ✗ Error processing ${mythologyId}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('='.repeat(60));
    console.log('Mythology Metadata Porter');
    console.log('='.repeat(60));

    const results = {
        total: 0,
        success: 0,
        skipped: 0,
        failed: 0
    };

    // Process each mythology
    for (const [mythologyId, config] of Object.entries(mythologyConfigs)) {
        results.total++;

        const result = await portMythology(mythologyId, config);

        if (result.success) {
            if (result.skipped) {
                results.skipped++;
            } else {
                results.success++;
            }
        } else {
            results.failed++;
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log('='.repeat(60));
    console.log(`Total mythologies:  ${results.total}`);
    console.log(`Successfully added: ${results.success}`);
    console.log(`Skipped (exists):   ${results.skipped}`);
    console.log(`Failed:             ${results.failed}`);
    console.log('='.repeat(60));

    // Close connection
    await admin.app().delete();

    console.log('\nDone!');
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { portMythology, extractMetadata };
