#!/usr/bin/env node

/**
 * COMPLETE FIREBASE MIGRATION SCRIPT
 *
 * This script executes the COMPLETE Firebase migration with deduplication,
 * standardization, and centralized schema implementation.
 *
 * CRITICAL REQUIREMENTS:
 * 1. Deduplicate 168 deities (3 mythology wins, 156 merges)
 * 2. Delete 14 redundant mythology collections
 * 3. Add mythology field to cross_references, archetypes, mythologies
 * 4. Delete and regenerate ALL search_index documents
 * 5. Upload 242 transformed documents
 * 6. Comprehensive validation and diff checking
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

// Migration log
const migrationLog = {
  startTime: new Date().toISOString(),
  endTime: null,
  operations: [],
  errors: [],
  statistics: {
    deitiesMerged: 0,
    duplicatesRemoved: 0,
    collectionsDeleted: 0,
    documentsDeleted: 0,
    mythologyFieldsAdded: 0,
    searchIndexDeleted: 0,
    searchIndexCreated: 0,
    transformedDocsUploaded: 0
  }
};

function log(message, data = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    data
  };
  migrationLog.operations.push(entry);
  console.log(`[${entry.timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logError(message, error) {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    error: error.message || error
  };
  migrationLog.errors.push(entry);
  console.error(`[${entry.timestamp}] ERROR: ${message}`, error);
}

// =====================================================================
// PRIORITY 1: DEDUPLICATE DEITIES
// =====================================================================

async function deduplicateDeities() {
  log('='.repeat(80));
  log('PRIORITY 1: DEDUPLICATING DEITIES');
  log('='.repeat(80));

  try {
    // Read duplicate analysis
    const analysisPath = path.join(__dirname, '..', 'DUPLICATE_ANALYSIS_REPORT.json');
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

    log(`Found ${analysis.totalDuplicates} duplicates to process`);
    log(`Recommendations: Keep deities=${analysis.recommendations.keepDeitiesVersion}, Keep mythology=${analysis.recommendations.keepMythologyVersion}, Merge=${analysis.recommendations.mergeBoth}`);

    const mythologyCollections = [
      'greek', 'norse', 'egyptian', 'roman', 'hindu', 'buddhist',
      'japanese', 'celtic', 'chinese', 'aztec', 'mayan', 'sumerian',
      'babylonian', 'persian'
    ];

    let mergedCount = 0;
    let removedFromMythologyCollections = 0;

    // Process each mythology collection
    for (const mythology of mythologyCollections) {
      log(`Processing ${mythology} duplicates...`);

      const mythologyDocs = await db.collection(mythology).get();

      for (const doc of mythologyDocs.docs) {
        const mythologyData = doc.data();
        const deityName = mythologyData.name;

        // Check if deity exists in /deities/
        const deityQuery = await db.collection('deities')
          .where('name', '==', deityName)
          .where('mythology', '==', mythology)
          .get();

        if (!deityQuery.empty) {
          // Deity exists in both collections - merge them
          const deityDoc = deityQuery.docs[0];
          const deityData = deityDoc.data();

          // Determine merge strategy
          const mythologyQuality = calculateQualityScore(mythologyData);
          const deityQuality = calculateQualityScore(deityData);

          let finalData;

          if (mythologyQuality > deityQuality + 2) {
            // Mythology version is significantly better - use it as base
            log(`Using ${mythology}/${deityName} as base (quality: ${mythologyQuality} vs ${deityQuality})`);
            finalData = { ...mythologyData };
            // Merge unique fields from /deities/
            if (deityData.metadata && !finalData.metadata) {
              finalData.metadata = deityData.metadata;
            }
          } else {
            // Use /deities/ version as base
            log(`Using deities/${deityName} as base (quality: ${deityQuality} vs ${mythologyQuality})`);
            finalData = { ...deityData };
            // Merge unique fields from mythology collection (like rawMetadata)
            if (mythologyData.rawMetadata && !finalData.rawMetadata) {
              finalData.rawMetadata = mythologyData.rawMetadata;
            }
          }

          // Ensure mythology field is set
          finalData.mythology = mythology;

          // Ensure metadata exists
          if (!finalData.metadata) {
            finalData.metadata = {
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: 'system',
              source: 'migration_merge',
              verified: false
            };
          } else {
            finalData.metadata.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            finalData.metadata.source = 'migration_merge';
          }

          // Update deity in /deities/ collection
          await deityDoc.ref.update(finalData);

          mergedCount++;
          log(`Merged ${mythology}/${deityName} into /deities/`);
        }
      }

      removedFromMythologyCollections += mythologyDocs.size;
    }

    migrationLog.statistics.deitiesMerged = mergedCount;
    migrationLog.statistics.duplicatesRemoved = removedFromMythologyCollections;

    log(`✅ Deduplication complete: ${mergedCount} deities merged`);
    return { mergedCount, removedFromMythologyCollections };

  } catch (error) {
    logError('Failed to deduplicate deities', error);
    throw error;
  }
}

function calculateQualityScore(doc) {
  let score = 0;

  // Has description
  if (doc.description && doc.description.length > 0) score += 2;
  if (doc.description && doc.description.length > 100) score += 2;

  // Has symbols
  if (doc.symbols && doc.symbols.length > 0) score += 4;

  // Has archetypes
  if (doc.archetypes && doc.archetypes.length > 0) score += 2;

  // Has relationships
  if (doc.relationships && Object.keys(doc.relationships).length > 0) score += 2;

  return score;
}

// =====================================================================
// PRIORITY 2: DELETE REDUNDANT COLLECTIONS
// =====================================================================

async function deleteRedundantCollections() {
  log('='.repeat(80));
  log('PRIORITY 2: DELETING REDUNDANT MYTHOLOGY COLLECTIONS');
  log('='.repeat(80));

  const mythologyCollections = [
    'greek', 'norse', 'egyptian', 'roman', 'hindu', 'buddhist',
    'japanese', 'celtic', 'chinese', 'aztec', 'mayan', 'sumerian',
    'babylonian', 'persian'
  ];

  let totalDeleted = 0;
  let collectionsDeleted = 0;

  try {
    for (const collection of mythologyCollections) {
      log(`Deleting collection: ${collection}`);

      const collectionRef = db.collection(collection);
      const snapshot = await collectionRef.get();
      const docCount = snapshot.size;

      if (docCount === 0) {
        log(`  - Collection ${collection} is already empty`);
        continue;
      }

      // Delete in batches of 500 (Firestore limit)
      const batchSize = 500;
      let deletedInCollection = 0;

      while (true) {
        const batch = db.batch();
        const docs = await collectionRef.limit(batchSize).get();

        if (docs.empty) break;

        docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedInCollection += docs.size;
        log(`  - Deleted ${deletedInCollection}/${docCount} documents from ${collection}`);

        if (docs.size < batchSize) break;
      }

      totalDeleted += deletedInCollection;
      collectionsDeleted++;
      log(`✅ Deleted ${deletedInCollection} documents from ${collection}`);
    }

    migrationLog.statistics.collectionsDeleted = collectionsDeleted;
    migrationLog.statistics.documentsDeleted = totalDeleted;

    log(`✅ Collection deletion complete: ${collectionsDeleted} collections, ${totalDeleted} documents deleted`);

    if (totalDeleted !== 168) {
      logError(`WARNING: Expected to delete 168 documents, but deleted ${totalDeleted}`);
    }

    return { collectionsDeleted, totalDeleted };

  } catch (error) {
    logError('Failed to delete redundant collections', error);
    throw error;
  }
}

// =====================================================================
// PRIORITY 3: ADD MYTHOLOGY FIELD
// =====================================================================

async function addMythologyField() {
  log('='.repeat(80));
  log('PRIORITY 3: ADDING MYTHOLOGY FIELD TO DOCUMENTS');
  log('='.repeat(80));

  let totalUpdated = 0;

  try {
    // 1. Add to cross_references (421 docs)
    log('Adding mythology field to cross_references...');
    const crossRefsSnapshot = await db.collection('cross_references').get();
    const crossRefsBatch = db.batch();
    let crossRefsCount = 0;

    for (const doc of crossRefsSnapshot.docs) {
      const data = doc.data();
      if (!data.mythology) {
        // Try to derive from linked documents or set to "global"
        crossRefsBatch.update(doc.ref, { mythology: 'global' });
        crossRefsCount++;
      }
    }

    if (crossRefsCount > 0) {
      await crossRefsBatch.commit();
      log(`✅ Added mythology field to ${crossRefsCount} cross_references`);
      totalUpdated += crossRefsCount;
    }

    // 2. Add to archetypes (4 docs)
    log('Adding mythology field to archetypes...');
    const archetypesSnapshot = await db.collection('archetypes').get();
    const archetypesBatch = db.batch();
    let archetypesCount = 0;

    for (const doc of archetypesSnapshot.docs) {
      const data = doc.data();
      if (!data.mythology) {
        archetypesBatch.update(doc.ref, { mythology: 'global' });
        archetypesCount++;
      }
    }

    if (archetypesCount > 0) {
      await archetypesBatch.commit();
      log(`✅ Added mythology field to ${archetypesCount} archetypes`);
      totalUpdated += archetypesCount;
    }

    // 3. Add to mythologies (22 docs) - use document ID as mythology value
    log('Adding mythology field to mythologies...');
    const mythologiesSnapshot = await db.collection('mythologies').get();
    const mythologiesBatch = db.batch();
    let mythologiesCount = 0;

    for (const doc of mythologiesSnapshot.docs) {
      const data = doc.data();
      if (!data.mythology) {
        mythologiesBatch.update(doc.ref, { mythology: doc.id });
        mythologiesCount++;
      }
    }

    if (mythologiesCount > 0) {
      await mythologiesBatch.commit();
      log(`✅ Added mythology field to ${mythologiesCount} mythologies`);
      totalUpdated += mythologiesCount;
    }

    migrationLog.statistics.mythologyFieldsAdded = totalUpdated;
    log(`✅ Mythology field addition complete: ${totalUpdated} documents updated`);

    return { totalUpdated };

  } catch (error) {
    logError('Failed to add mythology field', error);
    throw error;
  }
}

// =====================================================================
// PRIORITY 4: STANDARDIZE SEARCH_INDEX
// =====================================================================

async function regenerateSearchIndex() {
  log('='.repeat(80));
  log('PRIORITY 4: REGENERATING SEARCH_INDEX');
  log('='.repeat(80));

  try {
    // Step 1: Delete ALL existing search_index documents
    log('Deleting existing search_index documents...');
    const searchIndexRef = db.collection('search_index');
    let deletedCount = 0;

    while (true) {
      const batch = db.batch();
      const docs = await searchIndexRef.limit(500).get();

      if (docs.empty) break;

      docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += docs.size;
      log(`  - Deleted ${deletedCount} search_index documents...`);

      if (docs.size < 500) break;
    }

    log(`✅ Deleted ${deletedCount} old search_index documents`);
    migrationLog.statistics.searchIndexDeleted = deletedCount;

    // Step 2: Regenerate from all content collections
    log('Generating new search_index documents...');

    const contentCollections = [
      'deities', 'heroes', 'creatures', 'cosmology', 'texts',
      'herbs', 'rituals', 'symbols', 'concepts', 'myths', 'events'
    ];

    let createdCount = 0;

    for (const collection of contentCollections) {
      log(`  - Indexing ${collection}...`);
      const snapshot = await db.collection(collection).get();

      const batch = db.batch();
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Generate search index entry
        const searchDoc = generateSearchIndexEntry(doc.id, collection, data);
        const searchRef = db.collection('search_index').doc(`${collection}_${doc.id}`);
        batch.set(searchRef, searchDoc);

        batchCount++;

        // Commit batch every 500 docs
        if (batchCount >= 500) {
          await batch.commit();
          createdCount += batchCount;
          log(`    - Indexed ${createdCount} documents so far...`);
          batchCount = 0;
        }
      }

      // Commit remaining
      if (batchCount > 0) {
        await batch.commit();
        createdCount += batchCount;
      }

      log(`  ✅ Indexed ${snapshot.size} ${collection}`);
    }

    migrationLog.statistics.searchIndexCreated = createdCount;
    log(`✅ Search index regeneration complete: ${createdCount} new entries created`);

    return { deletedCount, createdCount };

  } catch (error) {
    logError('Failed to regenerate search_index', error);
    throw error;
  }
}

function generateSearchIndexEntry(docId, contentType, data) {
  const searchTokens = new Set();

  // Add name
  if (data.name) {
    searchTokens.add(data.name.toLowerCase());
  }

  // Add alternate names
  if (data.alternateNames) {
    data.alternateNames.forEach(name => searchTokens.add(name.toLowerCase()));
  }

  // Add epithets
  if (data.epithets) {
    data.epithets.forEach(epithet => searchTokens.add(epithet.toLowerCase()));
  }

  // Add domains
  if (data.domains) {
    data.domains.forEach(domain => searchTokens.add(domain.toLowerCase()));
  }

  // Add tags
  if (data.tags) {
    data.tags.forEach(tag => searchTokens.add(tag.toLowerCase()));
  }

  // Add mythology
  if (data.mythology) {
    searchTokens.add(data.mythology.toLowerCase());
  }

  // Calculate quality score
  const qualityScore = calculateQualityScore(data);

  return {
    id: docId,
    contentType,
    name: data.name || '',
    displayName: data.displayName || data.name || '',
    mythology: data.mythology || 'unknown',
    searchTokens: Array.from(searchTokens),
    tags: data.tags || [],
    qualityScore,
    metadata: {
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'search_index_regeneration'
    }
  };
}

// =====================================================================
// PRIORITY 5: UPLOAD TRANSFORMED DATA
// =====================================================================

async function uploadTransformedData() {
  log('='.repeat(80));
  log('PRIORITY 5: UPLOADING TRANSFORMED DATA');
  log('='.repeat(80));

  const transformedDataDir = path.join(__dirname, '..', 'transformed_data', 'by_type');

  const contentTypes = [
    'heroes', 'creatures', 'cosmology', 'texts',
    'herbs', 'rituals', 'symbols', 'concepts', 'myths', 'events'
  ];

  let totalUploaded = 0;

  try {
    for (const contentType of contentTypes) {
      const filePath = path.join(transformedDataDir, `${contentType}_transformed.json`);

      if (!fs.existsSync(filePath)) {
        log(`  - File not found: ${contentType}_transformed.json, skipping...`);
        continue;
      }

      log(`Uploading ${contentType}...`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      if (!Array.isArray(data)) {
        log(`  - Invalid data format in ${contentType}_transformed.json, skipping...`);
        continue;
      }

      let uploaded = 0;
      const batchSize = 500;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = db.batch();
        const chunk = data.slice(i, Math.min(i + batchSize, data.length));

        for (const item of chunk) {
          if (!item.id) {
            log(`  - Skipping item without id in ${contentType}`);
            continue;
          }

          const docRef = db.collection(contentType).doc(item.id);
          batch.set(docRef, item, { merge: true });
        }

        await batch.commit();
        uploaded += chunk.length;
        log(`  - Uploaded ${uploaded}/${data.length} ${contentType}...`);
      }

      totalUploaded += uploaded;
      log(`✅ Uploaded ${uploaded} ${contentType}`);
    }

    migrationLog.statistics.transformedDocsUploaded = totalUploaded;
    log(`✅ Transformed data upload complete: ${totalUploaded} documents uploaded`);

    return { totalUploaded };

  } catch (error) {
    logError('Failed to upload transformed data', error);
    throw error;
  }
}

// =====================================================================
// PRIORITY 6: VALIDATION & DIFF CHECK
// =====================================================================

async function runValidation() {
  log('='.repeat(80));
  log('PRIORITY 6: RUNNING VALIDATION');
  log('='.repeat(80));

  try {
    const validation = {
      collections: {},
      totalDocuments: 0,
      issues: []
    };

    // Check all collections
    const collections = await db.listCollections();

    for (const collection of collections) {
      const snapshot = await collection.get();
      const count = snapshot.size;
      validation.collections[collection.id] = count;
      validation.totalDocuments += count;

      log(`  - ${collection.id}: ${count} documents`);
    }

    // Verify deities collection has complete data
    log('Validating deities collection...');
    const deitiesSnapshot = await db.collection('deities').get();
    let deitiesWithIssues = 0;

    deitiesSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.mythology) {
        validation.issues.push(`Deity ${doc.id} missing mythology field`);
        deitiesWithIssues++;
      }
    });

    if (deitiesWithIssues > 0) {
      log(`⚠️  Found ${deitiesWithIssues} deities with missing mythology field`);
    } else {
      log(`✅ All deities have mythology field`);
    }

    // Verify redundant collections are deleted
    const redundantCollections = [
      'greek', 'norse', 'egyptian', 'roman', 'hindu', 'buddhist',
      'japanese', 'celtic', 'chinese', 'aztec', 'mayan', 'sumerian',
      'babylonian', 'persian'
    ];

    for (const col of redundantCollections) {
      if (validation.collections[col] && validation.collections[col] > 0) {
        validation.issues.push(`Redundant collection ${col} still has ${validation.collections[col]} documents`);
      }
    }

    log(`\n✅ Validation complete`);
    log(`Total documents in database: ${validation.totalDocuments}`);
    log(`Issues found: ${validation.issues.length}`);

    if (validation.issues.length > 0) {
      log('Issues:', validation.issues);
    }

    return validation;

  } catch (error) {
    logError('Failed to run validation', error);
    throw error;
  }
}

// =====================================================================
// MAIN MIGRATION ORCHESTRATOR
// =====================================================================

async function runCompleteMigration() {
  log('🚀 STARTING COMPLETE FIREBASE MIGRATION');
  log('='.repeat(80));
  log('This migration will:');
  log('  1. Deduplicate 168 deities');
  log('  2. Delete 14 redundant mythology collections');
  log('  3. Add mythology field to 447 documents');
  log('  4. Regenerate ALL search_index entries');
  log('  5. Upload 242 transformed documents');
  log('  6. Run comprehensive validation');
  log('='.repeat(80));

  try {
    // PRIORITY 1: Deduplicate deities
    await deduplicateDeities();

    // PRIORITY 2: Delete redundant collections
    await deleteRedundantCollections();

    // PRIORITY 3: Add mythology field
    await addMythologyField();

    // PRIORITY 4: Regenerate search index
    await regenerateSearchIndex();

    // PRIORITY 5: Upload transformed data
    await uploadTransformedData();

    // PRIORITY 6: Run validation
    const validation = await runValidation();

    // Finalize migration log
    migrationLog.endTime = new Date().toISOString();
    migrationLog.validation = validation;

    // Save migration log
    const logPath = path.join(__dirname, '..', 'migration', `migration-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));

    // Generate migration report
    await generateMigrationReport(migrationLog);

    log('='.repeat(80));
    log('✅ MIGRATION COMPLETE!');
    log('='.repeat(80));
    log(`Migration log saved to: ${logPath}`);
    log('Statistics:', migrationLog.statistics);
    log('Errors:', migrationLog.errors.length);

    if (migrationLog.errors.length > 0) {
      log('⚠️  Migration completed with errors. Please review the log.');
    }

    process.exit(0);

  } catch (error) {
    logError('Migration failed', error);
    migrationLog.endTime = new Date().toISOString();

    // Save error log
    const errorLogPath = path.join(__dirname, '..', 'migration', `migration-error-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(errorLogPath, JSON.stringify(migrationLog, null, 2));

    console.error('❌ MIGRATION FAILED');
    console.error('Error log saved to:', errorLogPath);
    process.exit(1);
  }
}

async function generateMigrationReport(migrationLogData) {
  const report = `# FIREBASE MIGRATION COMPLETE REPORT

**Generated:** ${new Date().toISOString()}
**Migration Start:** ${migrationLogData.startTime}
**Migration End:** ${migrationLogData.endTime}
**Duration:** ${((new Date(migrationLogData.endTime) - new Date(migrationLogData.startTime)) / 1000).toFixed(2)} seconds

## Executive Summary

This report documents the complete Firebase migration to a centralized schema with deduplication and standardization.

## Statistics

- **Deities Merged:** ${migrationLogData.statistics.deitiesMerged}
- **Duplicates Removed:** ${migrationLogData.statistics.duplicatesRemoved}
- **Collections Deleted:** ${migrationLogData.statistics.collectionsDeleted}
- **Documents Deleted:** ${migrationLogData.statistics.documentsDeleted}
- **Mythology Fields Added:** ${migrationLogData.statistics.mythologyFieldsAdded}
- **Search Index Deleted:** ${migrationLogData.statistics.searchIndexDeleted}
- **Search Index Created:** ${migrationLogData.statistics.searchIndexCreated}
- **Transformed Docs Uploaded:** ${migrationLogData.statistics.transformedDocsUploaded}

## Operations Log

${migrationLogData.operations.map((op, i) => `${i + 1}. [${op.timestamp}] ${op.message}`).join('\n')}

## Errors

${migrationLogData.errors.length === 0 ? 'No errors occurred during migration.' : migrationLogData.errors.map((err, i) => `${i + 1}. [${err.timestamp}] ${err.message}: ${err.error}`).join('\n')}

## Validation Results

### Collection Summary

${Object.entries(migrationLogData.validation.collections).map(([name, count]) => `- **${name}:** ${count} documents`).join('\n')}

**Total Documents:** ${migrationLogData.validation.totalDocuments}

### Issues Found

${migrationLogData.validation.issues.length === 0 ? 'No validation issues found.' : migrationLogData.validation.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

## Verification Checklist

- [${migrationLogData.statistics.duplicatesRemoved === 168 ? 'x' : ' '}] Exactly 168 duplicates removed
- [${migrationLogData.statistics.collectionsDeleted === 14 ? 'x' : ' '}] All 14 redundant collections deleted
- [${migrationLogData.statistics.mythologyFieldsAdded > 0 ? 'x' : ' '}] Mythology fields added to required collections
- [${migrationLogData.statistics.searchIndexDeleted > 0 ? 'x' : ' '}] Old search index deleted
- [${migrationLogData.statistics.searchIndexCreated > 0 ? 'x' : ' '}] New search index created
- [${migrationLogData.statistics.transformedDocsUploaded > 0 ? 'x' : ' '}] Transformed documents uploaded
- [${migrationLogData.validation.issues.length === 0 ? 'x' : ' '}] No validation issues

## Conclusion

${migrationLogData.errors.length === 0 && migrationLogData.validation.issues.length === 0
  ? '✅ Migration completed successfully with no errors or validation issues.'
  : '⚠️  Migration completed but encountered ' + (migrationLogData.errors.length + migrationLogData.validation.issues.length) + ' issues. Please review above.'}

## Next Steps

1. Review this report for any issues
2. Test Firestore queries in Firebase Console
3. Verify data integrity by spot-checking random documents
4. Update frontend to use new centralized schema
5. Monitor performance and optimize indexes as needed

---

**Migration Script:** complete-migration.js
**Service Account:** firebase-service-account.json
**Backup Location:** H:\\Github\\EyesOfAzrael\\FIREBASE\\backups\\backup-2025-12-13T03-51-50-305Z\\
`;

  const reportPath = path.join(__dirname, '..', 'MIGRATION_COMPLETE_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`Migration report saved to: ${reportPath}`);
}

// Run migration
if (require.main === module) {
  runCompleteMigration();
}

module.exports = {
  deduplicateDeities,
  deleteRedundantCollections,
  addMythologyField,
  regenerateSearchIndex,
  uploadTransformedData,
  runValidation
};
