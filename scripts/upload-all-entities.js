/**
 * Consolidated Entity Upload Script
 *
 * This script uploads all entities to Firebase Firestore in the correct order:
 * 1. Core entities (deities, creatures, heroes)
 * 2. Physical entities (places, items)
 * 3. Abstract entities (concepts, magic)
 * 4. Relationships
 * 5. Theories
 *
 * Usage:
 *   node scripts/upload-all-entities.js --dry-run   # Preview what would be uploaded
 *   node scripts/upload-all-entities.js --upload    # Actually upload to Firebase
 *   node scripts/upload-all-entities.js --validate  # Validate before upload
 */

const fs = require('fs');
const path = require('path');

// Load the upload functions
const uploadModule = require('./upload-to-firebase.js');
const validateModule = require('./validate-migration.js');

const transformForFirestore = uploadModule.transformForFirestore;
const calculateCompleteness = validateModule.calculateCompleteness;
const generateReport = validateModule.generateReport;

/**
 * Upload order - defines which collections to upload in which order
 */
const UPLOAD_ORDER = [
  'deity',
  'hero',
  'creature',
  'place',
  'item',
  'magic',
  'concept'
];

/**
 * Load entities by type
 */
function loadEntitiesByType(type) {
  const entities = [];
  const entitiesDir = path.join(__dirname, '../data/entities', type);

  if (!fs.existsSync(entitiesDir)) {
    console.log(`  ⚠️  Directory not found: ${type}`);
    return entities;
  }

  const files = fs.readdirSync(entitiesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const filePath = path.join(entitiesDir, file);
      const entity = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      entities.push(entity);
    } catch (error) {
      console.error(`    ❌ Error loading ${file}: ${error.message}`);
    }
  }

  return entities;
}

/**
 * Load theories
 */
function loadTheories() {
  const theoriesPath = path.join(__dirname, '../data/theories-import.json');

  if (!fs.existsSync(theoriesPath)) {
    console.log('  ⚠️  theories-import.json not found');
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(theoriesPath, 'utf8'));
    return data.theories || [];
  } catch (error) {
    console.error(`  ❌ Error loading theories: ${error.message}`);
    return [];
  }
}

/**
 * Load relationships
 */
function loadRelationships() {
  const relPath = path.join(__dirname, '../data/relationships.json');

  if (!fs.existsSync(relPath)) {
    console.log('  ⚠️  relationships.json not found');
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(relPath, 'utf8'));
  } catch (error) {
    console.error(`  ❌ Error loading relationships: ${error.message}`);
    return [];
  }
}

/**
 * Dry run - preview what would be uploaded
 */
async function dryRun() {
  console.log('\n=== DRY RUN: Preview Upload ===\n');

  const summary = {
    entities: {},
    theories: 0,
    relationships: 0,
    total: 0
  };

  // Load and preview entities
  console.log('📦 ENTITIES:');
  for (const type of UPLOAD_ORDER) {
    const entities = loadEntitiesByType(type);
    summary.entities[type] = entities.length;
    summary.total += entities.length;

    console.log(`  ${type}: ${entities.length} entities`);

    // Show sample
    if (entities.length > 0) {
      const sample = entities.slice(0, 3);
      sample.forEach(e => {
        const completeness = calculateCompleteness(e);
        console.log(`    - ${e.name} (${e.id}) - ${completeness}%`);
      });
      if (entities.length > 3) {
        console.log(`    ... and ${entities.length - 3} more`);
      }
    }
  }

  // Load theories
  console.log('\n📚 THEORIES:');
  const theories = loadTheories();
  summary.theories = theories.length;
  summary.total += theories.length;
  console.log(`  ${theories.length} theories`);

  if (theories.length > 0) {
    theories.slice(0, 3).forEach(t => {
      console.log(`    - ${t.name} (${t.id})`);
    });
    if (theories.length > 3) {
      console.log(`    ... and ${theories.length - 3} more`);
    }
  }

  // Load relationships
  console.log('\n🔗 RELATIONSHIPS:');
  const relationships = loadRelationships();
  summary.relationships = Array.isArray(relationships) ? relationships.length : Object.keys(relationships).length;
  console.log(`  ${summary.relationships} relationships`);

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total entities: ${summary.total - summary.theories}`);
  console.log(`Total theories: ${summary.theories}`);
  console.log(`Total relationships: ${summary.relationships}`);
  console.log(`Grand total: ${summary.total + summary.relationships} documents`);

  console.log('\n💡 To upload, run: node scripts/upload-all-entities.js --upload');

  return summary;
}

/**
 * Upload to Firebase
 */
async function uploadToFirebase() {
  console.log('\n=== UPLOADING TO FIREBASE ===\n');

  try {
    // Check if Firebase Admin is available
    const admin = require('firebase-admin');

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!serviceAccount) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();

    const results = {
      entities: {},
      theories: 0,
      relationships: 0,
      errors: []
    };

    // Upload entities in order
    for (const type of UPLOAD_ORDER) {
      console.log(`\n📦 Uploading ${type}...`);
      const entities = loadEntitiesByType(type);

      let uploaded = 0;
      const batch = db.batch();

      for (const entity of entities) {
        try {
          const data = transformForFirestore(entity);
          const collection = `entities_${type}`;
          const docRef = db.collection(collection).doc(entity.id);

          batch.set(docRef, data);
          uploaded++;

          console.log(`  ✓ ${entity.name} (${entity.id})`);
        } catch (error) {
          console.error(`  ❌ Failed: ${entity.name} - ${error.message}`);
          results.errors.push({ entity: entity.id, error: error.message });
        }
      }

      // Commit batch
      if (uploaded > 0) {
        await batch.commit();
        console.log(`  📦 Committed ${uploaded} ${type} entities`);
        results.entities[type] = uploaded;
      }
    }

    // Upload theories
    console.log('\n📚 Uploading theories...');
    const theories = loadTheories();
    let theoryCount = 0;
    const theoryBatch = db.batch();

    for (const theory of theories) {
      try {
        const docRef = db.collection('theories').doc(theory.id);
        theoryBatch.set(docRef, {
          ...theory,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        theoryCount++;
        console.log(`  ✓ ${theory.name} (${theory.id})`);
      } catch (error) {
        console.error(`  ❌ Failed: ${theory.id} - ${error.message}`);
        results.errors.push({ entity: theory.id, error: error.message });
      }
    }

    if (theoryCount > 0) {
      await theoryBatch.commit();
      console.log(`  📦 Committed ${theoryCount} theories`);
      results.theories = theoryCount;
    }

    // Upload relationships
    console.log('\n🔗 Uploading relationships...');
    const relationships = loadRelationships();

    if (Array.isArray(relationships) && relationships.length > 0) {
      const relBatch = db.batch();
      let relCount = 0;

      for (const rel of relationships) {
        try {
          const docRef = db.collection('relationships').doc();
          relBatch.set(docRef, rel);
          relCount++;
        } catch (error) {
          console.error(`  ❌ Failed to upload relationship: ${error.message}`);
          results.errors.push({ entity: 'relationship', error: error.message });
        }
      }

      if (relCount > 0) {
        await relBatch.commit();
        console.log(`  📦 Committed ${relCount} relationships`);
        results.relationships = relCount;
      }
    }

    // Final summary
    console.log('\n=== UPLOAD COMPLETE ===');
    console.log('Entities uploaded:');
    Object.entries(results.entities).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log(`Theories: ${results.theories}`);
    console.log(`Relationships: ${results.relationships}`);

    const totalEntities = Object.values(results.entities).reduce((a, b) => a + b, 0);
    console.log(`\nTotal: ${totalEntities + results.theories + results.relationships} documents`);

    if (results.errors.length > 0) {
      console.log(`\n⚠️  ${results.errors.length} errors occurred`);
      results.errors.forEach(e => {
        console.log(`  - ${e.entity}: ${e.error}`);
      });
    } else {
      console.log('\n✅ All documents uploaded successfully!');
    }

    return results;

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n❌ Firebase Admin SDK not installed');
      console.error('Install with: npm install firebase-admin');
      console.error('Then set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.log('\nRunning dry run instead...\n');
      return await dryRun();
    } else {
      throw error;
    }
  }
}

/**
 * Validate before upload
 */
async function validate() {
  console.log('\n=== VALIDATION ===\n');

  const report = generateReport();

  if (report.summary.status === 'PASS') {
    console.log('✅ Validation PASSED');
    console.log('\nYou can proceed with upload:');
    console.log('  node scripts/upload-all-entities.js --upload');
    return true;
  } else {
    console.log('❌ Validation FAILED');
    console.log('\nIssues found:');
    if (report.summary.duplicateIds > 0) {
      console.log(`  - ${report.summary.duplicateIds} duplicate IDs`);
      console.log('    Fix with: node scripts/fix-duplicate-ids.js --apply');
    }
    if (report.summary.loadErrors > 0) {
      console.log(`  - ${report.summary.loadErrors} files failed to load`);
    }
    if (report.summary.validationIssues > 0) {
      console.log(`  - ${report.summary.validationIssues} validation issues`);
    }
    console.log('\nFix issues before uploading.');
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--validate')) {
    await validate();
  } else if (args.includes('--upload')) {
    // Validate first
    const isValid = await validate();
    if (!isValid) {
      console.log('\n⚠️  Upload aborted due to validation errors');
      process.exit(1);
    }
    await uploadToFirebase();
  } else {
    // Default to dry run
    await dryRun();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { uploadToFirebase, dryRun, validate };
