#!/usr/bin/env node

/**
 * Firebase Asset Validation Script
 *
 * Downloads all Firebase assets, validates:
 * - Content completeness
 * - Link validity
 * - Metadata presence
 * - Rendering in all display modes (page, panel, card, table row)
 * - Common structure compliance
 *
 * Usage: node scripts/validate-firebase-assets.js
 */

const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const COLLECTIONS = [
    'deities',
    'heroes',
    'creatures',
    'cosmology',
    'rituals',
    'herbs',
    'texts',
    'symbols',
    'items',
    'places',
    'mythologies'
];

const REQUIRED_FIELDS = {
    deity: ['name', 'mythology', 'description', 'domains', 'type'],
    hero: ['name', 'mythology', 'description', 'deeds', 'type'],
    creature: ['name', 'mythology', 'description', 'abilities', 'type'],
    cosmology: ['name', 'mythology', 'description', 'type'],
    ritual: ['name', 'mythology', 'description', 'purpose', 'type'],
    herb: ['name', 'mythology', 'description', 'uses', 'type'],
    text: ['name', 'mythology', 'description', 'type'],
    symbol: ['name', 'mythology', 'description', 'meaning', 'type'],
    item: ['name', 'mythology', 'description', 'powers', 'type'],
    place: ['name', 'mythology', 'description', 'significance', 'type'],
    mythology: ['name', 'id', 'description', 'icon']
};

const DISPLAY_MODES = ['page', 'panel', 'card', 'table-row', 'short-description', 'link'];

class FirebaseAssetValidator {
    constructor() {
        this.db = null;
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: []
        };
        this.assets = [];
    }

    /**
     * Initialize Firebase Admin SDK
     */
    async init() {
        console.log('🔧 Initializing Firebase Admin SDK...');

        try {
            // Try to load service account
            let serviceAccount;
            const possiblePaths = [
                path.join(__dirname, '..', 'serviceAccountKey.json'),
                path.join(__dirname, '..', 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json')
            ];

            for (const serviceAccountPath of possiblePaths) {
                try {
                    serviceAccount = require(serviceAccountPath);
                    console.log(`✅ Loaded credentials from ${path.basename(serviceAccountPath)}`);
                    break;
                } catch (error) {
                    // Try next path
                }
            }

            if (!serviceAccount) {
                console.warn('⚠️  Service account key not found. Using environment credentials.');
                // Try environment variable
                if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                } else {
                    throw new Error('No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json');
                }
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || 'eyesofazrael'
            });

            this.db = admin.firestore();
            console.log('✅ Firebase initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase:', error.message);
            throw error;
        }
    }

    /**
     * Download all assets from Firebase
     */
    async downloadAllAssets() {
        console.log('\n📥 Downloading all assets from Firebase...');

        for (const collection of COLLECTIONS) {
            try {
                const snapshot = await this.db.collection(collection).get();
                console.log(`   ${collection}: ${snapshot.size} documents`);

                snapshot.forEach(doc => {
                    this.assets.push({
                        collection,
                        id: doc.id,
                        data: doc.data()
                    });
                });

                this.results.total += snapshot.size;
            } catch (error) {
                console.error(`   ❌ Error fetching ${collection}:`, error.message);
                this.results.errors.push({
                    collection,
                    error: error.message
                });
            }
        }

        console.log(`\n✅ Downloaded ${this.assets.length} total assets`);
    }

    /**
     * Validate a single asset
     */
    validateAsset(asset) {
        const { collection, id, data } = asset;
        const issues = [];

        // Get entity type (singular form of collection)
        const entityType = collection.endsWith('ies')
            ? collection.slice(0, -3) + 'y'  // mythologies -> mythology
            : collection.slice(0, -1);        // deities -> deity

        const requiredFields = REQUIRED_FIELDS[entityType] || ['name', 'description', 'type'];

        // 1. Check required fields
        for (const field of requiredFields) {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                issues.push({
                    severity: 'error',
                    field,
                    message: `Missing or empty required field: ${field}`
                });
            }
        }

        // 2. Check metadata
        if (!data.created_at && !data.createdAt) {
            issues.push({
                severity: 'warning',
                field: 'metadata',
                message: 'Missing creation timestamp'
            });
        }

        if (!data.icon && entityType !== 'mythology') {
            issues.push({
                severity: 'warning',
                field: 'icon',
                message: 'Missing icon field'
            });
        }

        // 3. Validate links (internal references)
        const linkFields = ['related_entities', 'relatedDeities', 'relatedHeroes', 'parents', 'children', 'siblings'];
        for (const field of linkFields) {
            if (data[field] && Array.isArray(data[field])) {
                data[field].forEach((link, index) => {
                    if (typeof link === 'string' && link.trim() === '') {
                        issues.push({
                            severity: 'warning',
                            field,
                            message: `Empty link at index ${index}`
                        });
                    }
                });
            }
        }

        // 4. Validate URLs (external links)
        const urlFields = ['image', 'imageUrl', 'sources', 'references'];
        for (const field of urlFields) {
            if (data[field]) {
                if (typeof data[field] === 'string') {
                    if (!this.isValidUrl(data[field]) && data[field].trim() !== '') {
                        issues.push({
                            severity: 'warning',
                            field,
                            message: `Invalid URL format: ${data[field]}`
                        });
                    }
                } else if (Array.isArray(data[field])) {
                    data[field].forEach((url, index) => {
                        if (typeof url === 'string' && !this.isValidUrl(url) && url.trim() !== '') {
                            issues.push({
                                severity: 'warning',
                                field,
                                message: `Invalid URL at index ${index}: ${url}`
                            });
                        }
                    });
                }
            }
        }

        // 5. Validate description length (should have substantial content)
        if (data.description && data.description.length < 50) {
            issues.push({
                severity: 'warning',
                field: 'description',
                message: `Description too short (${data.description.length} chars, recommend >50)`
            });
        }

        // 6. Check for common structure fields
        const commonFields = ['name', 'type', 'mythology', 'description'];
        const missingCommon = commonFields.filter(f => !data[f]);
        if (missingCommon.length > 0) {
            issues.push({
                severity: 'error',
                field: 'structure',
                message: `Missing common fields: ${missingCommon.join(', ')}`
            });
        }

        // 7. Validate rendering data (fields needed for different display modes)
        const renderingChecks = {
            page: ['name', 'description'], // Full page view
            panel: ['name', 'description', 'icon'], // Side panel
            card: ['name', 'icon'], // Grid card
            'table-row': ['name', 'type'], // Table entry
            'short-description': ['name', 'description'], // Summary
            link: ['name', 'id'] // Link reference
        };

        for (const [mode, fields] of Object.entries(renderingChecks)) {
            const missing = fields.filter(f => !data[f]);
            if (missing.length > 0) {
                issues.push({
                    severity: 'warning',
                    field: 'rendering',
                    message: `Cannot render as ${mode}: missing ${missing.join(', ')}`
                });
            }
        }

        return issues;
    }

    /**
     * Validate URL format
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            // Check if it's a relative path
            return string.startsWith('/') || string.startsWith('./') || string.startsWith('../');
        }
    }

    /**
     * Run validation on all assets
     */
    async runValidation() {
        console.log('\n🔍 Validating assets...\n');

        const failedAssets = [];

        for (const asset of this.assets) {
            const issues = this.validateAsset(asset);

            if (issues.length === 0) {
                this.results.passed++;
            } else {
                const hasErrors = issues.some(i => i.severity === 'error');
                const hasWarnings = issues.some(i => i.severity === 'warning');

                if (hasErrors) {
                    this.results.failed++;
                    failedAssets.push({
                        ...asset,
                        issues
                    });
                } else if (hasWarnings) {
                    this.results.warnings++;
                }

                // Log issues for this asset
                const emoji = hasErrors ? '❌' : '⚠️ ';
                console.log(`${emoji} ${asset.collection}/${asset.id}`);
                issues.forEach(issue => {
                    const severity = issue.severity === 'error' ? '  ERROR' : '  WARN ';
                    console.log(`  ${severity}: ${issue.message}`);
                });
                console.log('');
            }
        }

        return failedAssets;
    }

    /**
     * Generate validation report
     */
    async generateReport(failedAssets) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                passRate: ((this.results.passed / this.results.total) * 100).toFixed(2) + '%'
            },
            failedAssets: failedAssets.map(asset => ({
                collection: asset.collection,
                id: asset.id,
                name: asset.data.name || 'Unknown',
                mythology: asset.data.mythology || 'Unknown',
                issues: asset.issues
            })),
            byCollection: this.getCollectionStats(),
            byMythology: this.getMythologyStats()
        };

        // Save report
        const reportPath = path.join(__dirname, '..', 'FIREBASE_VALIDATION_REPORT.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Full report saved to: ${reportPath}`);

        // Save failed assets for agent processing
        const failedPath = path.join(__dirname, '..', 'FAILED_ASSETS.json');
        await fs.writeFile(failedPath, JSON.stringify(failedAssets, null, 2));
        console.log(`📄 Failed assets saved to: ${failedPath}`);

        return report;
    }

    /**
     * Get statistics by collection
     */
    getCollectionStats() {
        const stats = {};

        for (const asset of this.assets) {
            if (!stats[asset.collection]) {
                stats[asset.collection] = {
                    total: 0,
                    passed: 0,
                    failed: 0
                };
            }

            stats[asset.collection].total++;

            const issues = this.validateAsset(asset);
            const hasErrors = issues.some(i => i.severity === 'error');

            if (hasErrors) {
                stats[asset.collection].failed++;
            } else {
                stats[asset.collection].passed++;
            }
        }

        return stats;
    }

    /**
     * Get statistics by mythology
     */
    getMythologyStats() {
        const stats = {};

        for (const asset of this.assets) {
            const mythology = asset.data.mythology || 'unknown';

            if (!stats[mythology]) {
                stats[mythology] = {
                    total: 0,
                    passed: 0,
                    failed: 0
                };
            }

            stats[mythology].total++;

            const issues = this.validateAsset(asset);
            const hasErrors = issues.some(i => i.severity === 'error');

            if (hasErrors) {
                stats[mythology].failed++;
            } else {
                stats[mythology].passed++;
            }
        }

        return stats;
    }

    /**
     * Print summary
     */
    printSummary(report) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Assets:     ${report.summary.total}`);
        console.log(`✅ Passed:         ${report.summary.passed} (${report.summary.passRate})`);
        console.log(`❌ Failed:         ${report.summary.failed}`);
        console.log(`⚠️  Warnings:       ${report.summary.warnings}`);
        console.log('='.repeat(60));

        console.log('\n📈 By Collection:');
        for (const [collection, stats] of Object.entries(report.byCollection)) {
            const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
            console.log(`  ${collection.padEnd(20)} ${stats.passed}/${stats.total} (${passRate}%)`);
        }

        console.log('\n🌍 By Mythology:');
        for (const [mythology, stats] of Object.entries(report.byMythology)) {
            const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
            console.log(`  ${mythology.padEnd(20)} ${stats.passed}/${stats.total} (${passRate}%)`);
        }

        console.log('\n' + '='.repeat(60));

        if (report.summary.failed > 0) {
            console.log(`\n⚠️  ${report.summary.failed} assets need fixing!`);
            console.log('   Run: node scripts/fix-failed-assets.js');
            console.log('   Or spin off agents to fix issues automatically\n');
            process.exit(1); // Exit with error code
        } else {
            console.log('\n✅ All assets passed validation!\n');
            process.exit(0);
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const validator = new FirebaseAssetValidator();

    try {
        await validator.init();
        await validator.downloadAllAssets();
        const failedAssets = await validator.runValidation();
        const report = await validator.generateReport(failedAssets);
        validator.printSummary(report);
    } catch (error) {
        console.error('\n❌ Validation failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = FirebaseAssetValidator;
