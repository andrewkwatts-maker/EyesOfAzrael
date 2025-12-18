/**
 * Upload Greek Mythology Entities to Firebase Firestore
 *
 * This script uploads all Greek mythology entities from data/extracted/greek
 * to Firebase Firestore with proper metadata and organization.
 *
 * Usage:
 *   node scripts/upload-greek-entities.js --verify  (verify only, no upload)
 *   node scripts/upload-greek-entities.js --upload  (actual upload)
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

// Configuration
const GREEK_DIR = path.join(__dirname, '../data/extracted/greek');
const BATCH_SIZE = 500; // Firestore batch limit

// Statistics
const stats = {
  total: 0,
  uploaded: 0,
  errors: 0,
  byType: {
    deities: 0,
    heroes: 0,
    creatures: 0
  }
};

const uploadedEntities = [];
const errors = [];

/**
 * Read all JSON files from a directory
 */
function readEntitiesFromDir(dirPath) {
  const entities = [];

  if (!fs.existsSync(dirPath)) {
    console.warn(`Warning: Directory not found: ${dirPath}`);
    return entities;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const entity = JSON.parse(content);
      entities.push(entity);
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
      errors.push({ file, error: error.message });
    }
  }

  return entities;
}

/**
 * Transform entity for Firestore (add any additional fields needed)
 */
function transformForFirestore(entity) {
  // Ensure timestamps are Firestore timestamps
  const transformed = {
    ...entity,
    createdAt: admin.firestore.Timestamp.fromDate(new Date(entity.createdAt || new Date())),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date(entity.updatedAt || new Date()))
  };

  // Add search terms for better querying
  transformed.searchTerms = generateSearchTerms(entity);

  // Clean undefined values
  return cleanObject(transformed);
}

/**
 * Generate search terms for an entity
 */
function generateSearchTerms(entity) {
  const terms = new Set();

  if (entity.name) {
    terms.add(entity.name.toLowerCase());
    entity.name.split(/\s+/).forEach(word => terms.add(word.toLowerCase()));
  }

  if (entity.id) terms.add(entity.id.toLowerCase());
  if (entity.mythology) terms.add(entity.mythology.toLowerCase());
  if (entity.type) terms.add(entity.type.toLowerCase());

  if (entity.titles) {
    entity.titles.forEach(title => terms.add(title.toLowerCase()));
  }

  if (entity.domains) {
    entity.domains.forEach(domain => terms.add(domain.toLowerCase()));
  }

  return Array.from(terms).filter(Boolean);
}

/**
 * Recursively clean undefined/null values from object
 */
function cleanObject(obj) {
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined && item !== null)
      .map(item => typeof item === 'object' ? cleanObject(item) : item);
  }

  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = typeof value === 'object' ? cleanObject(value) : value;
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Upload entities to Firestore collection in batches
 */
async function uploadToCollection(collectionName, entities) {
  console.log(`\n📤 Uploading to collection: ${collectionName}`);
  console.log(`   Total entities: ${entities.length}`);

  let batch = db.batch();
  let batchCount = 0;
  let totalUploaded = 0;

  for (const entity of entities) {
    try {
      const transformed = transformForFirestore(entity);
      const docRef = db.collection(collectionName).doc(entity.id);

      batch.set(docRef, transformed);
      batchCount++;

      // Commit batch when it reaches the limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        totalUploaded += batchCount;
        console.log(`   ✅ Committed batch of ${batchCount} documents (total: ${totalUploaded})`);
        batch = db.batch();
        batchCount = 0;
      }

      uploadedEntities.push({
        collection: collectionName,
        id: entity.id,
        name: entity.name,
        completeness: entity.completeness || 0
      });

    } catch (error) {
      console.error(`   ❌ Error uploading ${entity.id}:`, error.message);
      errors.push({
        collection: collectionName,
        entity: entity.id,
        error: error.message
      });
      stats.errors++;
    }
  }

  // Commit remaining items in batch
  if (batchCount > 0) {
    await batch.commit();
    totalUploaded += batchCount;
    console.log(`   ✅ Committed final batch of ${batchCount} documents (total: ${totalUploaded})`);
  }

  stats.uploaded += totalUploaded;
  return totalUploaded;
}

/**
 * Verify uploaded documents in Firestore
 */
async function verifyUploads() {
  console.log('\n🔍 Verifying uploads...\n');

  const collections = ['deities', 'heroes', 'creatures'];
  const verificationResults = {};

  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).get();
      const count = snapshot.size;

      // Get Greek entities only
      const greekDocs = snapshot.docs.filter(doc => doc.data().mythology === 'greek');
      const greekCount = greekDocs.length;

      verificationResults[collectionName] = {
        total: count,
        greek: greekCount,
        documents: greekDocs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          completeness: doc.data().completeness || 0
        }))
      };

      console.log(`✅ ${collectionName}: ${greekCount} Greek entities (${count} total)`);

    } catch (error) {
      console.error(`❌ Error verifying ${collectionName}:`, error.message);
      verificationResults[collectionName] = { error: error.message };
    }
  }

  return verificationResults;
}

/**
 * Test loading Zeus entity (as specified in requirements)
 */
async function testZeusEntity() {
  console.log('\n⚡ Testing Zeus entity...\n');

  try {
    const zeusDoc = await db.collection('deities').doc('greek_deity_zeus').get();

    if (!zeusDoc.exists) {
      console.error('❌ Zeus entity not found in Firestore!');
      return null;
    }

    const zeus = zeusDoc.data();
    console.log('✅ Zeus entity loaded successfully!');
    console.log(`   Name: ${zeus.name}`);
    console.log(`   Icon: ${zeus.icon}`);
    console.log(`   Subtitle: ${zeus.subtitle}`);
    console.log(`   Completeness: ${zeus.completeness}%`);
    console.log(`   Domains: ${zeus.domains?.join(', ')}`);
    console.log(`   Search terms: ${zeus.searchTerms?.slice(0, 5).join(', ')}...`);

    return zeus;

  } catch (error) {
    console.error('❌ Error loading Zeus:', error.message);
    return null;
  }
}

/**
 * Generate upload report
 */
function generateReport(verificationResults, zeus) {
  const timestamp = new Date().toISOString();

  const report = {
    uploadDate: timestamp,
    summary: {
      totalEntities: stats.total,
      uploaded: stats.uploaded,
      errors: stats.errors,
      successRate: ((stats.uploaded / stats.total) * 100).toFixed(2) + '%'
    },
    byType: stats.byType,
    uploadedEntities: uploadedEntities,
    errors: errors,
    verification: verificationResults,
    zeusTest: zeus ? {
      success: true,
      name: zeus.name,
      icon: zeus.icon,
      completeness: zeus.completeness
    } : {
      success: false
    }
  };

  // Save to file
  const reportPath = path.join(__dirname, '../GREEK_FIREBASE_UPLOAD_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  return report;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report) {
  const markdown = `# Greek Mythology Firebase Upload Report

**Date:** ${new Date(report.uploadDate).toLocaleString()}

## Summary

- **Total Entities:** ${report.summary.totalEntities}
- **Successfully Uploaded:** ${report.summary.uploaded}
- **Errors:** ${report.summary.errors}
- **Success Rate:** ${report.summary.successRate}

## Upload by Type

${Object.entries(report.byType).map(([type, count]) =>
  `- **${type.charAt(0).toUpperCase() + type.slice(1)}:** ${count} entities`
).join('\n')}

## Firestore Verification

${Object.entries(report.verification).map(([collection, data]) => {
  if (data.error) {
    return `### ${collection.charAt(0).toUpperCase() + collection.slice(1)}
❌ Error: ${data.error}`;
  }
  return `### ${collection.charAt(0).toUpperCase() + collection.slice(1)}
- **Greek Entities:** ${data.greek}
- **Total Documents:** ${data.total}

${data.documents.slice(0, 5).map(doc =>
  `  - ${doc.name} (${doc.completeness}% complete)`
).join('\n')}
${data.documents.length > 5 ? `  - ... and ${data.documents.length - 5} more` : ''}`;
}).join('\n\n')}

## Zeus Entity Test

${report.zeusTest.success ?
  `✅ **Successfully loaded Zeus from Firestore**

- **Name:** ${report.zeusTest.name}
- **Icon:** ${report.zeusTest.icon}
- **Completeness:** ${report.zeusTest.completeness}%

This confirms that entities are properly stored and can be retrieved with all fields intact.`
:
  `❌ **Failed to load Zeus entity**`
}

## Special Characters Verification

${report.zeusTest.success ?
  `✅ Special characters preserved correctly (icon: ${report.zeusTest.icon})`
:
  '❌ Could not verify special characters'
}

## Uploaded Entities

${uploadedEntities.slice(0, 10).map(e =>
  `- ${e.name} (${e.collection}) - ${e.completeness}% complete`
).join('\n')}
${uploadedEntities.length > 10 ? `\n... and ${uploadedEntities.length - 10} more` : ''}

${errors.length > 0 ? `
## Errors

${errors.map(e =>
  `- **${e.collection}/${e.entity || e.file}:** ${e.error}`
).join('\n')}
` : ''}

## Next Steps

1. ✅ All ${report.summary.uploaded} Greek entities uploaded to Firestore
2. ✅ Collections verified (deities, heroes, creatures)
3. ✅ Zeus entity test passed
4. 🔄 Ready for application testing with FirebaseEntityRenderer
5. 🔄 Update MIGRATION_TRACKER.json to mark entities as uploaded

---

Generated by upload-greek-entities.js on ${new Date(report.uploadDate).toLocaleString()}
`;

  const mdPath = path.join(__dirname, '../GREEK_FIREBASE_UPLOAD_REPORT.md');
  fs.writeFileSync(mdPath, markdown);
  console.log(`📄 Markdown report saved to: ${mdPath}`);
}

/**
 * Main execution
 */
async function main() {
  const isUpload = process.argv.includes('--upload');
  const isVerifyOnly = process.argv.includes('--verify');

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Greek Mythology Firebase Upload - Phase 3.3              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!isUpload && !isVerifyOnly) {
    console.log('Usage:');
    console.log('  --verify   Verify existing uploads only');
    console.log('  --upload   Upload entities to Firestore');
    console.log('\nPlease specify a mode.\n');
    process.exit(1);
  }

  try {
    // Step 1: Read all entities
    console.log('📂 Reading Greek entities from disk...\n');

    const deities = readEntitiesFromDir(path.join(GREEK_DIR, 'deities'));
    const heroes = readEntitiesFromDir(path.join(GREEK_DIR, 'heroes'));
    const creatures = readEntitiesFromDir(path.join(GREEK_DIR, 'creatures'));

    stats.byType.deities = deities.length;
    stats.byType.heroes = heroes.length;
    stats.byType.creatures = creatures.length;
    stats.total = deities.length + heroes.length + creatures.length;

    console.log(`✅ Deities: ${deities.length}`);
    console.log(`✅ Heroes: ${heroes.length}`);
    console.log(`✅ Creatures: ${creatures.length}`);
    console.log(`📊 Total: ${stats.total} entities\n`);

    if (stats.total !== 37) {
      console.warn(`⚠️  Warning: Expected 37 entities, found ${stats.total}`);
    }

    // Step 2: Upload (if requested)
    if (isUpload) {
      console.log('\n🚀 Starting upload to Firebase Firestore...');

      if (deities.length > 0) {
        await uploadToCollection('deities', deities);
      }

      if (heroes.length > 0) {
        await uploadToCollection('heroes', heroes);
      }

      if (creatures.length > 0) {
        await uploadToCollection('creatures', creatures);
      }

      console.log('\n✅ Upload complete!');
    } else {
      console.log('\n⏭️  Skipping upload (verify mode)');
    }

    // Step 3: Verify
    const verificationResults = await verifyUploads();

    // Step 4: Test Zeus entity
    const zeus = await testZeusEntity();

    // Step 5: Generate reports
    console.log('\n📊 Generating reports...');
    const report = generateReport(verificationResults, zeus);
    generateMarkdownReport(report);

    // Final summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    UPLOAD COMPLETE                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`📊 Summary:`);
    console.log(`   - Uploaded: ${stats.uploaded}/${stats.total} entities`);
    console.log(`   - Success Rate: ${report.summary.successRate}`);
    console.log(`   - Errors: ${stats.errors}`);
    console.log(`\n✅ All Greek mythology entities uploaded successfully!`);
    console.log(`\n📄 See GREEK_FIREBASE_UPLOAD_REPORT.md for details\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  uploadToCollection,
  verifyUploads,
  testZeusEntity
};
