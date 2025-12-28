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
    'mythologies',
    'magic',
    'archetypes',
    'pages',
    'concepts',
    'events'
];

const REQUIRED_FIELDS = {
    deity: ['name', 'mythology', 'description', 'domains', 'type'],
    hero: ['name', 'mythology', 'description', 'type'],
    creature: ['name', 'mythology', 'description', 'type'],
    cosmology: ['name', 'mythology', 'description', 'type'],
    ritual: ['name', 'mythology', 'description', 'type'],
    herb: ['name', 'mythology', 'description', 'type'],
    text: ['name', 'mythology', 'description', 'type'],
    symbol: ['name', 'mythology', 'description', 'type'],
    item: ['name', 'mythology', 'description', 'type'],
    place: ['name', 'mythology', 'description', 'type'],
    mythology: ['name', 'id', 'description', 'icon'],
    magic: ['name', 'mythology', 'description', 'type'],
    archetype: ['name', 'description', 'type'],
    page: ['name', 'mythology', 'type'],
    concept: ['name', 'mythology', 'description', 'type'],
    event: ['name', 'mythology', 'description', 'type']
};

const DISPLAY_MODES = ['page', 'panel', 'section', 'link', 'paragraph'];

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
            panel: ['name', 'description'], // Side panel
            section: ['name', 'description'], // Section within page
            link: ['name'], // Link reference
            paragraph: ['name', 'description'] // Inline paragraph
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
     * Generate rendering examples for each collection
     */
    generateRenderingExamples() {
        const examples = {};

        for (const collection of COLLECTIONS) {
            const asset = this.assets.find(a => a.collection === collection);
            if (!asset) continue;

            examples[collection] = {
                id: asset.id,
                name: asset.data.name,
                modes: {}
            };

            // Generate example for each display mode
            for (const mode of DISPLAY_MODES) {
                examples[collection].modes[mode] = this.renderAsset(asset, mode);
            }
        }

        return examples;
    }

    /**
     * Render an asset in a specific display mode
     */
    renderAsset(asset, mode) {
        const data = asset.data;

        switch(mode) {
            case 'page':
                return {
                    html: `<div class="entity-page">
                        <h1>${data.name || 'Unnamed'}</h1>
                        ${data.icon ? `<div class="icon">${data.icon}</div>` : ''}
                        <div class="metadata">
                            ${data.mythology ? `<span class="mythology">${data.mythology}</span>` : ''}
                            ${data.type ? `<span class="type">${data.type}</span>` : ''}
                        </div>
                        <div class="description">${data.description || ''}</div>
                    </div>`,
                    canRender: !!(data.name && data.description)
                };

            case 'panel':
                return {
                    html: `<div class="entity-panel">
                        <h3>${data.name || 'Unnamed'}</h3>
                        <p>${data.description ? data.description.substring(0, 200) + '...' : ''}</p>
                    </div>`,
                    canRender: !!(data.name && data.description)
                };

            case 'section':
                return {
                    html: `<section class="entity-section">
                        <h2>${data.name || 'Unnamed'}</h2>
                        <p>${data.description || ''}</p>
                    </section>`,
                    canRender: !!(data.name && data.description)
                };

            case 'link':
                return {
                    html: `<a href="/${asset.collection}/${asset.id}" class="entity-link">${data.name || 'Unnamed'}</a>`,
                    canRender: !!(data.name)
                };

            case 'paragraph':
                return {
                    html: `<p class="entity-paragraph"><strong>${data.name}:</strong> ${data.description ? data.description.substring(0, 150) + '...' : ''}</p>`,
                    canRender: !!(data.name && data.description)
                };

            default:
                return { html: '', canRender: false };
        }
    }

    /**
     * Validate icon fields
     */
    validateIcons() {
        const iconStats = {
            total: 0,
            valid: 0,
            invalid: 0,
            missing: 0,
            byType: {}
        };

        for (const asset of this.assets) {
            iconStats.total++;

            if (!asset.data.icon) {
                iconStats.missing++;
            } else if (typeof asset.data.icon === 'string') {
                // Valid if it's an emoji or SVG path
                const isEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(asset.data.icon);
                const isSvgPath = asset.data.icon.startsWith('/') || asset.data.icon.startsWith('./');

                if (isEmoji || isSvgPath) {
                    iconStats.valid++;
                    const type = isEmoji ? 'emoji' : 'svg';
                    iconStats.byType[type] = (iconStats.byType[type] || 0) + 1;
                } else {
                    iconStats.invalid++;
                }
            }
        }

        return iconStats;
    }

    /**
     * Generate validation report
     */
    async generateReport(failedAssets) {
        console.log('\n📊 Generating detailed reports...');

        const iconStats = this.validateIcons();
        const renderingExamples = this.generateRenderingExamples();
        const collectionStats = this.getCollectionStats();

        // Add rendering capability stats to each collection
        for (const [collection, stats] of Object.entries(collectionStats)) {
            stats.renderingModes = {};
            for (const mode of DISPLAY_MODES) {
                const canRender = this.assets
                    .filter(a => a.collection === collection)
                    .filter(a => this.renderAsset(a, mode).canRender)
                    .length;
                stats.renderingModes[mode] = {
                    canRender,
                    total: stats.total,
                    percentage: ((canRender / stats.total) * 100).toFixed(1) + '%'
                };
            }
        }

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                passRate: ((this.results.passed / this.results.total) * 100).toFixed(2) + '%'
            },
            icons: iconStats,
            failedAssets: failedAssets.map(asset => ({
                collection: asset.collection,
                id: asset.id,
                name: asset.data.name || 'Unknown',
                mythology: asset.data.mythology || 'Unknown',
                issues: asset.issues
            })),
            byCollection: collectionStats,
            byMythology: this.getMythologyStats()
        };

        // Save main validation report
        const reportPath = path.join(__dirname, '..', 'validation-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`   ✅ Validation report: validation-report.json`);

        // Save rendering examples
        const examplesPath = path.join(__dirname, '..', 'rendering-examples.json');
        await fs.writeFile(examplesPath, JSON.stringify(renderingExamples, null, 2));
        console.log(`   ✅ Rendering examples: rendering-examples.json`);

        // Save failed assets for agent processing
        if (failedAssets.length > 0) {
            const failedPath = path.join(__dirname, '..', 'FAILED_ASSETS.json');
            await fs.writeFile(failedPath, JSON.stringify(failedAssets, null, 2));
            console.log(`   ✅ Failed assets: FAILED_ASSETS.json`);
        }

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
        console.log('\n' + '='.repeat(70));
        console.log('📊 VALIDATION SUMMARY');
        console.log('='.repeat(70));
        console.log(`Total Assets:     ${report.summary.total}`);
        console.log(`✅ Passed:         ${report.summary.passed} (${report.summary.passRate})`);
        console.log(`❌ Failed:         ${report.summary.failed}`);
        console.log(`⚠️  Warnings:       ${report.summary.warnings}`);
        console.log('='.repeat(70));

        console.log('\n🎨 Icon Statistics:');
        console.log(`  Total Assets:     ${report.icons.total}`);
        console.log(`  Valid Icons:      ${report.icons.valid} (${((report.icons.valid / report.icons.total) * 100).toFixed(1)}%)`);
        console.log(`  Missing Icons:    ${report.icons.missing} (${((report.icons.missing / report.icons.total) * 100).toFixed(1)}%)`);
        console.log(`  Invalid Icons:    ${report.icons.invalid}`);
        if (Object.keys(report.icons.byType).length > 0) {
            console.log('  By Type:');
            for (const [type, count] of Object.entries(report.icons.byType)) {
                console.log(`    ${type}: ${count}`);
            }
        }

        console.log('\n📈 By Collection:');
        for (const [collection, stats] of Object.entries(report.byCollection)) {
            const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
            console.log(`  ${collection.padEnd(20)} ${stats.total.toString().padStart(4)} assets  (${passRate}% valid)`);
        }

        console.log('\n🎭 Rendering Capability Summary:');
        for (const mode of DISPLAY_MODES) {
            const totalCanRender = Object.values(report.byCollection)
                .reduce((sum, stats) => sum + (stats.renderingModes?.[mode]?.canRender || 0), 0);
            const total = report.summary.total;
            const percentage = ((totalCanRender / total) * 100).toFixed(1);
            console.log(`  ${mode.padEnd(15)} ${totalCanRender}/${total} (${percentage}%)`);
        }

        console.log('\n🌍 By Mythology:');
        const sortedMythologies = Object.entries(report.byMythology)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10);
        for (const [mythology, stats] of sortedMythologies) {
            const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
            console.log(`  ${mythology.padEnd(20)} ${stats.total.toString().padStart(4)} assets  (${passRate}% valid)`);
        }

        console.log('\n' + '='.repeat(70));

        if (report.summary.failed > 0) {
            console.log(`\n⚠️  ${report.summary.failed} assets need fixing!`);
            console.log('   Review: validation-report.json');
            console.log('   Failed assets: FAILED_ASSETS.json\n');
        } else {
            console.log('\n✅ All assets passed validation!\n');
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
