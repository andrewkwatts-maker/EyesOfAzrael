/**
 * Firebase Setup Verification Script
 * Verifies that Firebase is properly configured and ready to use
 *
 * Usage: Include this script in a test HTML page or run via Node.js
 */

class FirebaseSetupVerifier {
    constructor() {
        this.checks = [];
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0
        };
    }

    async runAllChecks() {
        console.log('\n🔍 Starting Firebase Setup Verification...\n');
        console.log('=' .repeat(60));

        // Configuration Checks
        await this.checkFirebaseConfig();
        await this.checkSDKLoaded();

        // Service Checks
        await this.checkFirebaseInitialized();
        await this.checkAuthAvailable();
        await this.checkFirestoreAvailable();
        await this.checkStorageAvailable();

        // Security Rules Checks
        await this.checkFirestoreRules();
        await this.checkStorageRules();

        // Authentication Provider Checks
        await this.checkGoogleAuthEnabled();

        // Basic Functionality Checks
        await this.testFirestoreRead();
        await this.testFirestoreWrite();

        // Display Results
        this.displayResults();

        return this.results.failed === 0;
    }

    async checkFirebaseConfig() {
        this.startCheck('Firebase Config File');

        try {
            if (typeof window === 'undefined') {
                // Node.js environment
                const fs = require('fs');
                const path = require('path');
                const configPath = path.join(__dirname, '..', 'firebase-config.js');

                if (fs.existsSync(configPath)) {
                    const content = fs.readFileSync(configPath, 'utf8');
                    if (content.includes('apiKey') && content.includes('projectId')) {
                        this.pass('firebase-config.js exists and contains required fields');
                    } else {
                        this.fail('firebase-config.js exists but missing required fields');
                    }
                } else {
                    this.fail('firebase-config.js not found');
                }
            } else {
                // Browser environment
                if (typeof firebaseConfig !== 'undefined') {
                    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
                        this.pass('Firebase config loaded and contains required fields');
                    } else {
                        this.fail('Firebase config loaded but missing required fields');
                    }
                } else {
                    this.fail('Firebase config not loaded (firebaseConfig is undefined)');
                }
            }
        } catch (error) {
            this.fail(`Error checking config: ${error.message}`);
        }
    }

    async checkSDKLoaded() {
        this.startCheck('Firebase SDK Loading');

        if (typeof firebase === 'undefined') {
            this.fail('Firebase SDK not loaded (firebase is undefined)');
            this.warn('Make sure Firebase SDK scripts are included before this script');
            return;
        }

        this.pass('Firebase SDK loaded successfully');

        // Check individual SDKs
        const sdks = {
            'firebase.app': 'Firebase App',
            'firebase.auth': 'Firebase Auth',
            'firebase.firestore': 'Firebase Firestore',
            'firebase.storage': 'Firebase Storage'
        };

        for (const [sdk, name] of Object.entries(sdks)) {
            const parts = sdk.split('.');
            let obj = window;
            let available = true;

            for (const part of parts) {
                if (obj && obj[part]) {
                    obj = obj[part];
                } else {
                    available = false;
                    break;
                }
            }

            if (available) {
                console.log(`  ✓ ${name} SDK loaded`);
            } else {
                this.warn(`${name} SDK not loaded`);
            }
        }
    }

    async checkFirebaseInitialized() {
        this.startCheck('Firebase Initialization');

        if (typeof firebase === 'undefined') {
            this.fail('Cannot check initialization (Firebase SDK not loaded)');
            return;
        }

        try {
            if (firebase.apps && firebase.apps.length > 0) {
                const app = firebase.apps[0];
                this.pass(`Firebase app initialized: "${app.name}"`);

                // Display app details
                if (app.options) {
                    console.log(`  Project ID: ${app.options.projectId || 'N/A'}`);
                    console.log(`  Auth Domain: ${app.options.authDomain || 'N/A'}`);
                }
            } else {
                this.fail('Firebase app not initialized');
                this.warn('Make sure firebase.initializeApp(firebaseConfig) is called');
            }
        } catch (error) {
            this.fail(`Error checking initialization: ${error.message}`);
        }
    }

    async checkAuthAvailable() {
        this.startCheck('Firebase Authentication');

        try {
            if (!firebase.auth) {
                this.fail('Firebase Auth not available');
                return;
            }

            const auth = firebase.auth();
            if (auth) {
                this.pass('Firebase Auth available and initialized');

                // Check current auth state
                const user = auth.currentUser;
                if (user) {
                    console.log(`  Current user: ${user.email || user.uid}`);
                } else {
                    console.log(`  No user currently signed in`);
                }
            } else {
                this.fail('Could not get Auth instance');
            }
        } catch (error) {
            this.fail(`Error checking Auth: ${error.message}`);
        }
    }

    async checkFirestoreAvailable() {
        this.startCheck('Firestore Database');

        try {
            if (!firebase.firestore) {
                this.fail('Firestore not available');
                return;
            }

            const db = firebase.firestore();
            if (db) {
                this.pass('Firestore available and initialized');

                // Check settings
                console.log(`  Firestore instance created successfully`);
            } else {
                this.fail('Could not get Firestore instance');
            }
        } catch (error) {
            this.fail(`Error checking Firestore: ${error.message}`);
        }
    }

    async checkStorageAvailable() {
        this.startCheck('Firebase Storage');

        try {
            if (!firebase.storage) {
                this.fail('Firebase Storage not available');
                return;
            }

            const storage = firebase.storage();
            if (storage) {
                this.pass('Firebase Storage available and initialized');

                // Display bucket
                if (storage.app && storage.app.options && storage.app.options.storageBucket) {
                    console.log(`  Storage bucket: ${storage.app.options.storageBucket}`);
                }
            } else {
                this.fail('Could not get Storage instance');
            }
        } catch (error) {
            this.fail(`Error checking Storage: ${error.message}`);
        }
    }

    async checkFirestoreRules() {
        this.startCheck('Firestore Security Rules');

        try {
            const db = firebase.firestore();

            // Try to read from a collection (this will test read rules)
            const testRef = db.collection('theories').limit(1);
            await testRef.get();

            this.pass('Firestore security rules allow public read access');
            console.log('  ✓ Public read access works (for published theories)');

        } catch (error) {
            if (error.code === 'permission-denied') {
                this.warn('Firestore rules deny public read access');
                console.log('  This may be intentional if all reads require authentication');
            } else {
                this.fail(`Error testing Firestore rules: ${error.message}`);
            }
        }
    }

    async checkStorageRules() {
        this.startCheck('Storage Security Rules');

        try {
            const storage = firebase.storage();

            // Try to get download URL for a test path (tests read rules)
            // This will fail if file doesn't exist, but we can check the error type
            const testRef = storage.ref('theory-images/test/test.png');

            try {
                await testRef.getDownloadURL();
                this.pass('Storage security rules allow public read access');
            } catch (error) {
                if (error.code === 'storage/object-not-found') {
                    // This is OK - it means rules allow read, but file doesn't exist
                    this.pass('Storage security rules configured (test file not found, but access allowed)');
                } else if (error.code === 'storage/unauthorized') {
                    this.warn('Storage rules may deny public read access');
                    console.log('  Verify that public read is allowed in storage.rules');
                } else {
                    this.warn(`Storage rules check inconclusive: ${error.message}`);
                }
            }

        } catch (error) {
            this.fail(`Error testing Storage rules: ${error.message}`);
        }
    }

    async checkGoogleAuthEnabled() {
        this.startCheck('Google Authentication Provider');

        try {
            // We can't directly check if Google Auth is enabled without making a request
            // But we can verify the provider is available
            if (firebase.auth && firebase.auth.GoogleAuthProvider) {
                this.pass('Google Auth Provider available');
                console.log('  ✓ GoogleAuthProvider class exists');
                console.log('  ℹ️ To verify it\'s enabled, check Firebase Console > Authentication > Sign-in method');
            } else {
                this.fail('Google Auth Provider not available');
            }
        } catch (error) {
            this.fail(`Error checking Google Auth: ${error.message}`);
        }
    }

    async testFirestoreRead() {
        this.startCheck('Firestore Read Test');

        try {
            const db = firebase.firestore();

            // Try to read theories collection
            const snapshot = await db.collection('theories')
                .where('status', '==', 'published')
                .limit(5)
                .get();

            this.pass(`Firestore read successful (${snapshot.size} documents retrieved)`);

            if (snapshot.size === 0) {
                console.log('  ℹ️ No published theories found (this is OK for a new setup)');
            } else {
                console.log(`  ✓ Retrieved ${snapshot.size} published theories`);
            }

        } catch (error) {
            if (error.code === 'permission-denied') {
                this.warn('Firestore read denied (check security rules)');
            } else {
                this.fail(`Firestore read failed: ${error.message}`);
            }
        }
    }

    async testFirestoreWrite() {
        this.startCheck('Firestore Write Test');

        const user = firebase.auth ? firebase.auth().currentUser : null;

        if (!user) {
            this.warn('Cannot test Firestore write (not authenticated)');
            console.log('  ℹ️ Sign in to test write operations');
            return;
        }

        try {
            const db = firebase.firestore();

            // Try to create a test document
            const testData = {
                title: 'Setup Verification Test',
                authorId: user.uid,
                status: 'published',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                _test: true // Mark as test data
            };

            const docRef = await db.collection('theories').add(testData);

            this.pass('Firestore write successful (test document created)');
            console.log(`  ✓ Test document created with ID: ${docRef.id}`);

            // Clean up test document
            await docRef.delete();
            console.log('  ✓ Test document deleted (cleanup successful)');

        } catch (error) {
            if (error.code === 'permission-denied') {
                this.fail('Firestore write denied (check security rules)');
                console.log('  Verify that authenticated users can create theories');
            } else {
                this.fail(`Firestore write failed: ${error.message}`);
            }
        }
    }

    // Helper methods
    startCheck(name) {
        console.log(`\n📋 ${name}`);
    }

    pass(message) {
        console.log(`✅ PASS: ${message}`);
        this.results.passed++;
    }

    fail(message) {
        console.log(`❌ FAIL: ${message}`);
        this.results.failed++;
    }

    warn(message) {
        console.log(`⚠️  WARN: ${message}`);
        this.results.warnings++;
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 VERIFICATION RESULTS\n');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️  Warnings: ${this.results.warnings}`);
        console.log('\n' + '='.repeat(60));

        if (this.results.failed === 0) {
            console.log('\n🎉 All checks passed! Firebase is properly configured.\n');
            console.log('Next steps:');
            console.log('  1. Open tests/firebase-integration-tests.html to run automated tests');
            console.log('  2. Review FIREBASE_TESTING_CHECKLIST.md for manual testing');
            console.log('  3. Run tests/performance-tests.html to check performance\n');
        } else {
            console.log('\n⚠️  Some checks failed. Please review the errors above.\n');
            console.log('Common issues:');
            console.log('  • Firebase config not loaded: Check firebase-config.js exists');
            console.log('  • SDK not loaded: Add Firebase SDK scripts to HTML');
            console.log('  • Not initialized: Call firebase.initializeApp(firebaseConfig)');
            console.log('  • Permission denied: Deploy security rules with firebase deploy');
            console.log('\nSee FIREBASE_SETUP_GUIDE.md for detailed setup instructions.\n');
        }
    }
}

// Export for Node.js or browser usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseSetupVerifier;
}

// Auto-run if in browser and Firebase is loaded
if (typeof window !== 'undefined' && typeof firebase !== 'undefined') {
    window.addEventListener('load', async () => {
        // Wait a bit for Firebase to fully initialize
        setTimeout(async () => {
            const verifier = new FirebaseSetupVerifier();
            await verifier.runAllChecks();
        }, 1000);
    });
}
