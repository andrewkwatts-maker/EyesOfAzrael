#!/usr/bin/env node

/**
 * Safe Firebase Sync Script
 *
 * Safely synchronizes local assets to Firebase by:
 * 1. Backing up current Firebase state first
 * 2. Comparing local enrichedAt timestamps with Firebase
 * 3. Only pushing assets where local changes are newer
 *
 * Usage:
 *   node safe-firebase-sync.js [options]
 *
 * Options:
 *   --dry-run     Preview changes without uploading (default)
 *   --upload      Actually push changes to Firebase
 *   --category=X  Only sync specific category
 *   --skip-backup Skip the backup step (use with caution)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class SafeFirebaseSync {
    constructor(options = {}) {
        this.dryRun = options.dryRun !== false; // Default to dry-run
        this.skipBackup = options.skipBackup || false;
        this.targetCategory = options.category || null;

        this.baseDir = path.resolve(__dirname, '..');
        this.localAssetsDir = path.join(this.baseDir, 'firebase-assets-downloaded');
        this.backupDir = path.join(this.baseDir, 'backups', `firebase-backup-${this.getTimestamp()}`);

        this.collections = [
            'deities', 'heroes', 'creatures', 'items', 'places',
            'texts', 'rituals', 'herbs', 'symbols', 'cosmology',
            'concepts', 'events', 'archetypes', 'magic', 'beings',
            'figures', 'angels', 'teachings'
        ];

        this.stats = {
            firebaseAssets: 0,
            localAssets: 0,
            newerLocal: 0,
            newerFirebase: 0,
            noChange: 0,
            newInLocal: 0,
            uploaded: 0,
            skipped: 0,
            errors: []
        };

        this.db = null;
        this.firebaseData = new Map();
        this.localData = new Map();
        this.assetsToUpload = [];
    }

    getTimestamp() {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    }

    async initializeFirebase() {
        try {
            const serviceAccountPath = path.join(this.baseDir, 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
            const serviceAccount = require(serviceAccountPath);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: 'eyesofazrael'
            });

            this.db = admin.firestore();
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Firebase:', error.message);
            return false;
        }
    }

    async downloadFirebaseAssets() {
        console.log('\n1. DOWNLOADING FIREBASE ASSETS FOR BACKUP');
        console.log('=' .repeat(60));

        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        for (const collection of this.collections) {
            if (this.targetCategory && collection !== this.targetCategory) continue;

            try {
                const snapshot = await this.db.collection(collection).get();
                const collectionDir = path.join(this.backupDir, collection);

                if (snapshot.size > 0 && !fs.existsSync(collectionDir)) {
                    fs.mkdirSync(collectionDir, { recursive: true });
                }

                snapshot.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    const key = `${collection}/${doc.id}`;
                    this.firebaseData.set(key, data);
                    this.stats.firebaseAssets++;

                    // Save backup
                    const filePath = path.join(collectionDir, `${doc.id}.json`);
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                });

                if (snapshot.size > 0) {
                    console.log(`  [${collection}] ${snapshot.size} assets backed up`);
                }
            } catch (error) {
                console.error(`  Error with ${collection}:`, error.message);
                this.stats.errors.push({ collection, error: error.message });
            }
        }

        console.log(`\n  Total Firebase assets: ${this.stats.firebaseAssets}`);
        console.log(`  Backup saved to: ${this.backupDir}`);
    }

    async loadLocalAssets() {
        console.log('\n2. LOADING LOCAL ASSETS');
        console.log('='.repeat(60));

        for (const collection of this.collections) {
            if (this.targetCategory && collection !== this.targetCategory) continue;

            const collectionDir = path.join(this.localAssetsDir, collection);
            if (!fs.existsSync(collectionDir)) continue;

            await this.loadDirectory(collection, collectionDir);
        }

        console.log(`\n  Total local assets: ${this.stats.localAssets}`);
    }

    async loadDirectory(collection, dirPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Subdirectory (mythology-specific)
                await this.loadDirectory(collection, fullPath);
            } else if (entry.name.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const data = JSON.parse(content);

                    if (data.id) {
                        const key = `${collection}/${data.id}`;
                        data._localPath = fullPath;
                        this.localData.set(key, data);
                        this.stats.localAssets++;
                    }
                } catch (error) {
                    // Skip invalid files
                }
            }
        }
    }

    getTimestampValue(asset) {
        // Check enrichedAt first (from Gemini enrichment)
        if (asset.enrichedAt) {
            return new Date(asset.enrichedAt).getTime();
        }

        // Check metadata.enrichedAt
        if (asset.metadata?.enrichedAt) {
            if (typeof asset.metadata.enrichedAt === 'object' && asset.metadata.enrichedAt._seconds) {
                return asset.metadata.enrichedAt._seconds * 1000;
            }
            return new Date(asset.metadata.enrichedAt).getTime();
        }

        // Check _uploadedAt
        if (asset._uploadedAt) {
            return new Date(asset._uploadedAt).getTime();
        }

        // Check metadata.updatedAt
        if (asset.metadata?.updatedAt) {
            if (typeof asset.metadata.updatedAt === 'object' && asset.metadata.updatedAt._seconds) {
                return asset.metadata.updatedAt._seconds * 1000;
            }
            return new Date(asset.metadata.updatedAt).getTime();
        }

        return 0; // No timestamp found
    }

    compareTimestamps() {
        console.log('\n3. COMPARING TIMESTAMPS');
        console.log('='.repeat(60));

        for (const [key, localAsset] of this.localData) {
            const firebaseAsset = this.firebaseData.get(key);
            const [collection, id] = key.split('/');

            if (!firebaseAsset) {
                // New asset in local (not in Firebase)
                this.stats.newInLocal++;
                this.assetsToUpload.push({
                    key,
                    collection,
                    asset: localAsset,
                    reason: 'new'
                });
                continue;
            }

            const localTimestamp = this.getTimestampValue(localAsset);
            const firebaseTimestamp = this.getTimestampValue(firebaseAsset);

            if (localTimestamp > firebaseTimestamp) {
                // Local is newer
                this.stats.newerLocal++;
                this.assetsToUpload.push({
                    key,
                    collection,
                    asset: localAsset,
                    reason: 'updated',
                    localTime: new Date(localTimestamp).toISOString(),
                    firebaseTime: firebaseTimestamp ? new Date(firebaseTimestamp).toISOString() : 'none'
                });
            } else if (firebaseTimestamp > localTimestamp) {
                // Firebase is newer - skip
                this.stats.newerFirebase++;
            } else {
                // Same or no timestamps
                this.stats.noChange++;
            }
        }

        console.log(`  New in local (to upload): ${this.stats.newInLocal}`);
        console.log(`  Local newer (to upload): ${this.stats.newerLocal}`);
        console.log(`  Firebase newer (skip): ${this.stats.newerFirebase}`);
        console.log(`  No change: ${this.stats.noChange}`);
        console.log(`\n  TOTAL TO UPLOAD: ${this.assetsToUpload.length}`);
    }

    cleanAssetForUpload(asset) {
        const cleaned = { ...asset };
        delete cleaned._localPath;
        delete cleaned._category;
        delete cleaned._filePath;

        // Add sync metadata
        cleaned._syncedAt = new Date().toISOString();
        cleaned._syncedBy = 'safe-firebase-sync.js';

        return cleaned;
    }

    async uploadAssets() {
        console.log('\n4. UPLOADING ASSETS');
        console.log('='.repeat(60));

        if (this.dryRun) {
            console.log('  [DRY RUN] Would upload the following assets:');

            // Show first 20 assets
            const preview = this.assetsToUpload.slice(0, 20);
            for (const item of preview) {
                console.log(`    ${item.reason === 'new' ? '[NEW]' : '[UPD]'} ${item.key}`);
                if (item.localTime) {
                    console.log(`         Local: ${item.localTime}`);
                    console.log(`         Firebase: ${item.firebaseTime}`);
                }
            }

            if (this.assetsToUpload.length > 20) {
                console.log(`    ... and ${this.assetsToUpload.length - 20} more`);
            }

            console.log(`\n  [DRY RUN] Total: ${this.assetsToUpload.length} assets would be uploaded`);
            console.log('  Run with --upload to actually push changes');
            return;
        }

        // Actual upload
        let batch = this.db.batch();
        let batchCount = 0;

        for (const item of this.assetsToUpload) {
            const cleaned = this.cleanAssetForUpload(item.asset);
            const docRef = this.db.collection(item.collection).doc(item.asset.id);

            batch.set(docRef, cleaned, { merge: true });
            batchCount++;

            // Firebase batch limit is 500
            if (batchCount >= 450) {
                await batch.commit();
                console.log(`  Committed batch of ${batchCount} assets`);
                this.stats.uploaded += batchCount;
                batchCount = 0;
                batch = this.db.batch();
            }
        }

        // Commit remaining
        if (batchCount > 0) {
            await batch.commit();
            this.stats.uploaded += batchCount;
            console.log(`  Committed final batch of ${batchCount} assets`);
        }

        console.log(`\n  Successfully uploaded ${this.stats.uploaded} assets`);
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            mode: this.dryRun ? 'dry-run' : 'upload',
            backupLocation: this.backupDir,
            stats: this.stats,
            assetsToUpload: this.assetsToUpload.map(a => ({
                key: a.key,
                reason: a.reason,
                localTime: a.localTime,
                firebaseTime: a.firebaseTime
            }))
        };

        const reportPath = path.join(this.baseDir, 'scripts', 'reports', 'sync-report.json');

        if (!fs.existsSync(path.dirname(reportPath))) {
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\nReport saved to: ${reportPath}`);
    }

    async run() {
        console.log('='.repeat(60));
        console.log('SAFE FIREBASE SYNC');
        console.log('='.repeat(60));
        console.log(`Mode: ${this.dryRun ? 'DRY RUN (preview only)' : 'UPLOAD'}`);
        if (this.targetCategory) console.log(`Category: ${this.targetCategory}`);
        console.log('');

        // Initialize Firebase
        const initialized = await this.initializeFirebase();
        if (!initialized) {
            console.error('Cannot proceed without Firebase connection');
            return;
        }

        // Step 1: Backup Firebase
        if (!this.skipBackup) {
            await this.downloadFirebaseAssets();
        } else {
            console.log('\n1. SKIPPING BACKUP (--skip-backup flag set)');
        }

        // Step 2: Load local assets
        await this.loadLocalAssets();

        // Step 3: Compare timestamps
        this.compareTimestamps();

        // Step 4: Upload if not dry-run
        await this.uploadAssets();

        // Generate report
        this.generateReport();

        console.log('\n' + '='.repeat(60));
        console.log('SYNC COMPLETE');
        console.log('='.repeat(60));
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: true,
        skipBackup: false,
        category: null
    };

    for (const arg of args) {
        if (arg === '--upload') {
            options.dryRun = false;
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--skip-backup') {
            options.skipBackup = true;
        } else if (arg.startsWith('--category=')) {
            options.category = arg.split('=')[1];
        }
    }

    return options;
}

// Main execution
if (require.main === module) {
    const options = parseArgs();
    const sync = new SafeFirebaseSync(options);

    sync.run()
        .then(() => {
            console.log('\nDone!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Sync failed:', error);
            process.exit(1);
        });
}

module.exports = SafeFirebaseSync;
