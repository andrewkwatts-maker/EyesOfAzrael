/**
 * Firestore Query Test Script
 * Tests Firestore connection and queries from Node.js
 *
 * Usage: node scripts/test-firestore-query.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Color output utilities
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
    console.log('\n' + '='.repeat(70));
    log(message, 'cyan');
    console.log('='.repeat(70) + '\n');
}

async function runTests() {
    header('🔥 FIRESTORE CONNECTION TEST');

    let testsRun = 0;
    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Firebase Admin SDK Initialization
    log('📋 Test 1: Initialize Firebase Admin SDK', 'bright');
    testsRun++;

    try {
        // Check if already initialized
        if (admin.apps.length === 0) {
            // Initialize with default credentials (requires GOOGLE_APPLICATION_CREDENTIALS env var)
            // or service account key file

            // Try to find service account key
            const fs = require('fs');

            // Try multiple possible paths
            const possiblePaths = [
                path.join(__dirname, '..', 'serviceAccountKey.json'),
                path.join(__dirname, '..', 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json')
            ];

            let serviceAccountPath = null;
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    serviceAccountPath = p;
                    break;
                }
            }

            if (serviceAccountPath) {
                const serviceAccount = require(serviceAccountPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                log(`✅ PASS: Firebase Admin initialized with service account key`, 'green');
                log(`   Key file: ${path.basename(serviceAccountPath)}`, 'blue');
                testsPassed++;
            } else {
                // Try default credentials
                try {
                    admin.initializeApp({
                        credential: admin.credential.applicationDefault()
                    });
                    log('✅ PASS: Firebase Admin initialized with application default credentials', 'green');
                    testsPassed++;
                } catch (error) {
                    log('❌ FAIL: No service account key or default credentials found', 'red');
                    log(`   Error: ${error.message}`, 'red');
                    log(`   \n   To fix this:`, 'yellow');
                    log(`   1. Download service account key from Firebase Console`, 'yellow');
                    log(`   2. Save it as serviceAccountKey.json in project root`, 'yellow');
                    log(`   3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable\n`, 'yellow');
                    testsFailed++;
                    return;
                }
            }
        } else {
            log('✅ PASS: Firebase Admin already initialized', 'green');
            testsPassed++;
        }
    } catch (error) {
        log(`❌ FAIL: ${error.message}`, 'red');
        testsFailed++;
        return;
    }

    // Test 2: Get Firestore instance
    log('\n📋 Test 2: Get Firestore Instance', 'bright');
    testsRun++;

    let db;
    try {
        db = admin.firestore();
        log('✅ PASS: Firestore instance obtained', 'green');
        testsPassed++;
    } catch (error) {
        log(`❌ FAIL: ${error.message}`, 'red');
        testsFailed++;
        return;
    }

    // Test 3: List collections
    log('\n📋 Test 3: List Collections', 'bright');
    testsRun++;

    try {
        const collections = await db.listCollections();
        log('✅ PASS: Successfully listed collections', 'green');
        log(`   Found ${collections.length} collections:`, 'blue');
        collections.forEach(col => {
            log(`   - ${col.id}`, 'blue');
        });
        testsPassed++;
    } catch (error) {
        log(`❌ FAIL: ${error.message}`, 'red');
        testsFailed++;
    }

    // Test 4: Check mythologies collection
    log('\n📋 Test 4: Check "mythologies" Collection', 'bright');
    testsRun++;

    try {
        const mythologiesRef = db.collection('mythologies');
        const snapshot = await mythologiesRef.limit(5).get();

        if (snapshot.empty) {
            log('⚠️  WARN: "mythologies" collection exists but is empty', 'yellow');
            log('   This is expected if you haven\'t uploaded data yet', 'yellow');
            testsPassed++; // Still pass, just a warning
        } else {
            log(`✅ PASS: Found ${snapshot.size} documents in "mythologies"`, 'green');
            log('   Sample documents:', 'blue');
            snapshot.forEach(doc => {
                const data = doc.data();
                log(`   - ${doc.id}: ${data.name || data.title || 'No name'}`, 'blue');
            });
            testsPassed++;
        }
    } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
            log('❌ FAIL: Permission denied to read "mythologies" collection', 'red');
            log('   Check Firestore security rules', 'red');
        } else {
            log(`❌ FAIL: ${error.message}`, 'red');
        }
        testsFailed++;
    }

    // Test 5: Check theories collection
    log('\n📋 Test 5: Check "theories" Collection', 'bright');
    testsRun++;

    try {
        const theoriesRef = db.collection('theories');
        const snapshot = await theoriesRef.where('status', '==', 'published').limit(5).get();

        if (snapshot.empty) {
            log('⚠️  WARN: No published theories found', 'yellow');
            log('   This is expected if users haven\'t submitted theories yet', 'yellow');
            testsPassed++; // Still pass
        } else {
            log(`✅ PASS: Found ${snapshot.size} published theories`, 'green');
            log('   Sample theories:', 'blue');
            snapshot.forEach(doc => {
                const data = doc.data();
                log(`   - ${data.title || 'Untitled'} by ${data.authorName || 'Unknown'}`, 'blue');
            });
            testsPassed++;
        }
    } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
            log('⚠️  WARN: Permission denied to read theories (may require auth)', 'yellow');
            testsPassed++; // This is OK, just means rules are working
        } else {
            log(`❌ FAIL: ${error.message}`, 'red');
            testsFailed++;
        }
    }

    // Test 6: Test query with filters
    log('\n📋 Test 6: Test Query with Filters', 'bright');
    testsRun++;

    try {
        const mythologiesRef = db.collection('mythologies');
        const snapshot = await mythologiesRef
            .where('entityType', '==', 'deity')
            .limit(3)
            .get();

        if (snapshot.empty) {
            log('⚠️  WARN: No deities found with filter query', 'yellow');
            testsPassed++; // Still pass
        } else {
            log(`✅ PASS: Filter query successful, found ${snapshot.size} deities`, 'green');
            testsPassed++;
        }
    } catch (error) {
        log(`❌ FAIL: ${error.message}`, 'red');
        testsFailed++;
    }

    // Test 7: Test specific document read
    log('\n📋 Test 7: Read Specific Document', 'bright');
    testsRun++;

    try {
        // Try to read a known deity
        const docRef = db.collection('mythologies').doc('greek_zeus');
        const doc = await docRef.get();

        if (!doc.exists) {
            log('⚠️  WARN: Test document "greek_zeus" not found', 'yellow');
            log('   This is OK if data hasn\'t been uploaded yet', 'yellow');
            testsPassed++; // Still pass
        } else {
            log('✅ PASS: Successfully read specific document', 'green');
            const data = doc.data();
            log(`   Document: ${data.name || doc.id}`, 'blue');
            log(`   Type: ${data.entityType || 'unknown'}`, 'blue');
            testsPassed++;
        }
    } catch (error) {
        log(`❌ FAIL: ${error.message}`, 'red');
        testsFailed++;
    }

    // Summary
    header('📊 TEST SUMMARY');
    log(`Total Tests: ${testsRun}`, 'bright');
    log(`✅ Passed: ${testsPassed}`, 'green');
    log(`❌ Failed: ${testsFailed}`, 'red');

    if (testsFailed === 0) {
        log('\n🎉 ALL TESTS PASSED! Firebase is properly configured.', 'green');
        console.log('\nNext steps:');
        console.log('  1. Test browser connection: open test-firebase-connection.html');
        console.log('  2. Check that client-side queries work');
        console.log('  3. Verify security rules are properly configured\n');
    } else {
        log('\n⚠️  SOME TESTS FAILED. Please review errors above.', 'red');
        console.log('\nCommon fixes:');
        console.log('  - Missing service account key: Download from Firebase Console');
        console.log('  - Permission denied: Deploy Firestore security rules');
        console.log('  - Collection not found: Upload data to Firestore first\n');
    }

    process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
});
