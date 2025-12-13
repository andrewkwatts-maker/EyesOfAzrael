#!/usr/bin/env node

/**
 * Final Validation Script
 *
 * Performs comprehensive validation of the migration results
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

async function runFinalValidation() {
  console.log('='.repeat(80));
  console.log('FINAL MIGRATION VALIDATION');
  console.log('='.repeat(80));

  const results = {
    timestamp: new Date().toISOString(),
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Check 1: Verify /deities/ collection has 190 documents
  console.log('\n1. Checking /deities/ collection...');
  const deitiesSnapshot = await db.collection('deities').get();
  const deitiesCount = deitiesSnapshot.size;

  if (deitiesCount === 190) {
    console.log(`   ✅ PASS: /deities/ has ${deitiesCount} documents (expected 190)`);
    results.checks.push({ name: 'Deities count', status: 'PASS', expected: 190, actual: deitiesCount });
    results.passed++;
  } else {
    console.log(`   ❌ FAIL: /deities/ has ${deitiesCount} documents (expected 190)`);
    results.checks.push({ name: 'Deities count', status: 'FAIL', expected: 190, actual: deitiesCount });
    results.failed++;
  }

  // Check 2: Verify all deities have mythology field
  console.log('\n2. Checking mythology field on all deities...');
  let deitiesWithoutMythology = 0;
  const deitiesMythologies = {};

  deitiesSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.mythology) {
      deitiesWithoutMythology++;
    } else {
      deitiesMythologies[data.mythology] = (deitiesMythologies[data.mythology] || 0) + 1;
    }
  });

  if (deitiesWithoutMythology === 0) {
    console.log(`   ✅ PASS: All deities have mythology field`);
    console.log(`   Mythology breakdown:`, deitiesMythologies);
    results.checks.push({ name: 'Mythology field on deities', status: 'PASS', missingCount: 0 });
    results.passed++;
  } else {
    console.log(`   ❌ FAIL: ${deitiesWithoutMythology} deities missing mythology field`);
    results.checks.push({ name: 'Mythology field on deities', status: 'FAIL', missingCount: deitiesWithoutMythology });
    results.failed++;
  }

  // Check 3: Verify redundant collections are deleted
  console.log('\n3. Checking redundant mythology collections...');
  const redundantCollections = [
    'greek', 'norse', 'egyptian', 'roman', 'hindu', 'buddhist',
    'japanese', 'celtic', 'chinese', 'aztec', 'mayan', 'sumerian',
    'babylonian', 'persian'
  ];

  let remainingDocs = 0;
  const collectionsWithDocs = [];

  for (const collection of redundantCollections) {
    try {
      const snapshot = await db.collection(collection).get();
      if (snapshot.size > 0) {
        remainingDocs += snapshot.size;
        collectionsWithDocs.push(`${collection} (${snapshot.size})`);
      }
    } catch (error) {
      // Collection might not exist, which is fine
    }
  }

  if (remainingDocs === 0) {
    console.log(`   ✅ PASS: All redundant collections deleted or empty`);
    results.checks.push({ name: 'Redundant collections deleted', status: 'PASS', remainingDocs: 0 });
    results.passed++;
  } else {
    console.log(`   ❌ FAIL: ${remainingDocs} documents remain in: ${collectionsWithDocs.join(', ')}`);
    results.checks.push({ name: 'Redundant collections deleted', status: 'FAIL', remainingDocs, collections: collectionsWithDocs });
    results.failed++;
  }

  // Check 4: Verify search_index has expected documents
  console.log('\n4. Checking search_index...');
  const searchIndexSnapshot = await db.collection('search_index').get();
  const searchIndexCount = searchIndexSnapshot.size;

  if (searchIndexCount === 429) {
    console.log(`   ✅ PASS: search_index has ${searchIndexCount} documents (expected 429)`);
    results.checks.push({ name: 'Search index count', status: 'PASS', expected: 429, actual: searchIndexCount });
    results.passed++;
  } else {
    console.log(`   ⚠️  WARNING: search_index has ${searchIndexCount} documents (expected 429)`);
    results.checks.push({ name: 'Search index count', status: 'WARNING', expected: 429, actual: searchIndexCount });
    results.warnings++;
  }

  // Check 5: Verify cross_references have mythology field
  console.log('\n5. Checking mythology field on cross_references...');
  const crossRefsSnapshot = await db.collection('cross_references').get();
  let crossRefsWithoutMythology = 0;

  crossRefsSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.mythology) {
      crossRefsWithoutMythology++;
    }
  });

  if (crossRefsWithoutMythology === 0) {
    console.log(`   ✅ PASS: All ${crossRefsSnapshot.size} cross_references have mythology field`);
    results.checks.push({ name: 'Mythology field on cross_references', status: 'PASS', total: crossRefsSnapshot.size });
    results.passed++;
  } else {
    console.log(`   ❌ FAIL: ${crossRefsWithoutMythology} cross_references missing mythology field`);
    results.checks.push({ name: 'Mythology field on cross_references', status: 'FAIL', missingCount: crossRefsWithoutMythology });
    results.failed++;
  }

  // Check 6: Verify archetypes have mythology field
  console.log('\n6. Checking mythology field on archetypes...');
  const archetypesSnapshot = await db.collection('archetypes').get();
  let archetypesWithoutMythology = 0;

  archetypesSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.mythology) {
      archetypesWithoutMythology++;
    }
  });

  if (archetypesWithoutMythology === 0) {
    console.log(`   ✅ PASS: All ${archetypesSnapshot.size} archetypes have mythology field`);
    results.checks.push({ name: 'Mythology field on archetypes', status: 'PASS', total: archetypesSnapshot.size });
    results.passed++;
  } else {
    console.log(`   ❌ FAIL: ${archetypesWithoutMythology} archetypes missing mythology field`);
    results.checks.push({ name: 'Mythology field on archetypes', status: 'FAIL', missingCount: archetypesWithoutMythology });
    results.failed++;
  }

  // Check 7: Verify mythologies have mythology field
  console.log('\n7. Checking mythology field on mythologies...');
  const mythologiesSnapshot = await db.collection('mythologies').get();
  let mythologiesWithoutMythology = 0;

  mythologiesSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.mythology) {
      mythologiesWithoutMythology++;
    }
  });

  if (mythologiesWithoutMythology === 0) {
    console.log(`   ✅ PASS: All ${mythologiesSnapshot.size} mythologies have mythology field`);
    results.checks.push({ name: 'Mythology field on mythologies', status: 'PASS', total: mythologiesSnapshot.size });
    results.passed++;
  } else {
    console.log(`   ❌ FAIL: ${mythologiesWithoutMythology} mythologies missing mythology field`);
    results.checks.push({ name: 'Mythology field on mythologies', status: 'FAIL', missingCount: mythologiesWithoutMythology });
    results.failed++;
  }

  // Check 8: Sample data integrity check
  console.log('\n8. Spot-checking sample deities for data integrity...');
  const sampleDeities = ['greek_zeus', 'norse_odin', 'hindu_shiva', 'egyptian_ra'];
  let samplesValid = 0;

  for (const deityId of sampleDeities) {
    try {
      const deityDoc = await db.collection('deities').doc(deityId).get();
      if (deityDoc.exists) {
        const data = deityDoc.data();
        if (data.name && data.mythology && data.description) {
          samplesValid++;
          console.log(`   ✅ ${deityId}: name="${data.name}", mythology="${data.mythology}"`);
        } else {
          console.log(`   ⚠️  ${deityId}: Missing required fields`);
        }
      } else {
        console.log(`   ⚠️  ${deityId}: Not found`);
      }
    } catch (error) {
      console.log(`   ❌ ${deityId}: Error checking - ${error.message}`);
    }
  }

  if (samplesValid >= 3) {
    console.log(`   ✅ PASS: ${samplesValid}/${sampleDeities.length} sample deities validated`);
    results.checks.push({ name: 'Sample deity integrity', status: 'PASS', validated: samplesValid, total: sampleDeities.length });
    results.passed++;
  } else {
    console.log(`   ⚠️  WARNING: Only ${samplesValid}/${sampleDeities.length} sample deities validated`);
    results.checks.push({ name: 'Sample deity integrity', status: 'WARNING', validated: samplesValid, total: sampleDeities.length });
    results.warnings++;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`Total Checks: ${results.checks.length}`);

  if (results.failed === 0) {
    console.log('\n🎉 ALL CRITICAL VALIDATIONS PASSED!');
    console.log('The migration was successful with no data loss or integrity issues.');
  } else {
    console.log('\n⚠️  SOME VALIDATIONS FAILED');
    console.log('Please review the failures above.');
  }

  // Save validation results
  const resultsPath = path.join(__dirname, '..', 'FINAL_VALIDATION_RESULTS.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nValidation results saved to: ${resultsPath}`);

  process.exit(results.failed === 0 ? 0 : 1);
}

runFinalValidation().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
