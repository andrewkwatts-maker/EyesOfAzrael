/**
 * Test Herb Frontend Access
 *
 * Verifies that the 6 newly migrated herbs are accessible
 * and have the correct structure for frontend display
 */

const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFrontendAccess() {
  console.log('FRONTEND ACCESS TEST FOR NEWLY MIGRATED HERBS');
  console.log('='.repeat(70));
  console.log('');

  const newHerbIds = [
    'buddhist_tea',
    'hindu_tulsi',
    'jewish_hyssop',
    'jewish_mandrake',
    'universal_frankincense',
    'universal_myrrh'
  ];

  let passCount = 0;
  let failCount = 0;

  for (const herbId of newHerbIds) {
    console.log(`Testing: ${herbId}`);

    try {
      const doc = await db.collection('herbs').doc(herbId).get();

      if (!doc.exists) {
        console.log('  ❌ FAIL - Document does not exist');
        failCount++;
        continue;
      }

      const data = doc.data();

      // Check required fields for frontend
      const checks = {
        'Has name': !!data.name,
        'Has type': data.type === 'herb',
        'Has mythologies': Array.isArray(data.mythologies) && data.mythologies.length > 0,
        'Has botanicalName': !!data.botanicalName,
        'Has properties': !!data.properties,
        'Has uses': Array.isArray(data.uses) && data.uses.length > 0,
        'Has associatedDeities': Array.isArray(data.associatedDeities),
        'Has sacredSignificance': !!data.sacredSignificance,
        'Has preparationMethods': Array.isArray(data.preparationMethods) && data.preparationMethods.length > 0,
        'Has safetyWarnings': Array.isArray(data.safetyWarnings) && data.safetyWarnings.length > 0,
        'Has searchTerms': Array.isArray(data.searchTerms) && data.searchTerms.length > 0,
        'Has visibility': data.visibility === 'public',
        'Has status': data.status === 'published'
      };

      let passed = true;
      for (const [check, result] of Object.entries(checks)) {
        if (!result) {
          console.log(`  ⚠️  ${check}: MISSING`);
          passed = false;
        }
      }

      if (passed) {
        console.log(`  ✅ PASS - All frontend fields present`);
        console.log(`     Name: ${data.name}`);
        console.log(`     Mythologies: ${data.mythologies.join(', ')}`);
        console.log(`     Deities: ${data.associatedDeities.join(', ')}`);
        passCount++;
      } else {
        console.log(`  ❌ FAIL - Missing required fields`);
        failCount++;
      }

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      failCount++;
    }

    console.log('');
  }

  console.log('='.repeat(70));
  console.log('FRONTEND ACCESS TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total herbs tested: ${newHerbIds.length}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success rate: ${Math.round((passCount / newHerbIds.length) * 100)}%`);
  console.log('');

  if (passCount === newHerbIds.length) {
    console.log('🎉 ALL HERBS READY FOR FRONTEND DISPLAY!');
  } else {
    console.log('⚠️  Some herbs need data corrections');
  }

  console.log('');
  process.exit(failCount > 0 ? 1 : 0);
}

testFrontendAccess().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
