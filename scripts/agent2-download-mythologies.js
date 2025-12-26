#!/usr/bin/env node

/**
 * Agent 2 - Download Mythologies Collection
 *
 * Downloads all mythology documents from Firebase to analyze and fix them.
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

async function downloadMythologies() {
    console.log('='.repeat(80));
    console.log('AGENT 2: DOWNLOAD MYTHOLOGIES FROM FIREBASE');
    console.log('='.repeat(80));
    console.log('');

    try {
        // Download mythologies collection
        console.log('📥 Downloading mythologies collection...');
        const mythologiesSnapshot = await db.collection('mythologies').get();

        const mythologies = [];
        mythologiesSnapshot.forEach(doc => {
            mythologies.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`✓ Downloaded ${mythologies.length} mythology documents`);
        console.log('');

        // Now count actual entities in Firebase for each mythology
        console.log('📊 Counting entities in Firebase collections...');
        console.log('');

        const collections = [
            'deities', 'heroes', 'creatures', 'cosmology',
            'rituals', 'texts', 'herbs', 'symbols',
            'concepts', 'events', 'places', 'items'
        ];

        const mythologyCounts = {};

        for (const collection of collections) {
            console.log(`  Scanning ${collection}...`);
            const snapshot = await db.collection(collection).get();

            snapshot.forEach(doc => {
                const data = doc.data();
                const mythology = data.mythology || 'unknown';

                if (!mythologyCounts[mythology]) {
                    mythologyCounts[mythology] = {};
                }

                if (!mythologyCounts[mythology][collection]) {
                    mythologyCounts[mythology][collection] = 0;
                }

                mythologyCounts[mythology][collection]++;
            });
        }

        console.log('');
        console.log('✓ Entity counting complete');
        console.log('');

        // Save results
        const outputDir = path.join(__dirname, '..', 'firebase-mythologies-data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Save mythology documents
        const mythologiesPath = path.join(outputDir, 'mythologies.json');
        fs.writeFileSync(mythologiesPath, JSON.stringify(mythologies, null, 2));
        console.log(`💾 Saved mythology documents to: ${mythologiesPath}`);

        // Save entity counts
        const countsPath = path.join(outputDir, 'entity-counts.json');
        fs.writeFileSync(countsPath, JSON.stringify(mythologyCounts, null, 2));
        console.log(`💾 Saved entity counts to: ${countsPath}`);

        // Generate summary report
        console.log('');
        console.log('='.repeat(80));
        console.log('SUMMARY REPORT');
        console.log('='.repeat(80));
        console.log('');
        console.log(`Total Mythologies in Firebase: ${mythologies.length}`);
        console.log(`Total Mythologies with Entities: ${Object.keys(mythologyCounts).length}`);
        console.log('');
        console.log('Entity Counts by Mythology:');
        console.log('');

        const sortedMythologies = Object.entries(mythologyCounts)
            .sort((a, b) => {
                const totalA = Object.values(a[1]).reduce((sum, count) => sum + count, 0);
                const totalB = Object.values(b[1]).reduce((sum, count) => sum + count, 0);
                return totalB - totalA;
            });

        for (const [mythology, counts] of sortedMythologies) {
            const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
            console.log(`  ${mythology.padEnd(20)} ${total.toString().padStart(4)} entities`);

            const sortedCategories = Object.entries(counts)
                .filter(([cat, count]) => count > 0)
                .sort((a, b) => b[1] - a[1]);

            for (const [category, count] of sortedCategories) {
                console.log(`    - ${category.padEnd(15)} ${count}`);
            }
            console.log('');
        }

        console.log('='.repeat(80));
        console.log('');

        return { mythologies, mythologyCounts };

    } catch (error) {
        console.error('❌ Error downloading mythologies:', error);
        throw error;
    } finally {
        await admin.app().delete();
    }
}

// Run if executed directly
if (require.main === module) {
    downloadMythologies()
        .then(() => {
            console.log('✅ Download complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = downloadMythologies;
